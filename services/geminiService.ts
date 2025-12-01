
import { GoogleGenAI, FunctionDeclaration, Type, GenerateContentResponse } from "@google/genai";
import { ChatMessage, GroundingChunk, Ingredient, PriceChangeProposal, Supplier } from '../types';
import { ProcessedRecipe, RecipeScaffold } from "../utils/recipeCalculations";

const model = 'gemini-2.5-flash';

const findExtremeIngredientTool: FunctionDeclaration = {
    name: 'find_extreme_ingredient',
    description: 'Encuentra el ingrediente más caro o más barato de la lista proporcionada por el usuario.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            criteria: {
                type: Type.STRING,
                description: "El criterio para buscar, ya sea 'más_caro' o 'más_barato'.",
                enum: ['most_expensive', 'cheapest']
            }
        },
        required: ['criteria']
    }
};

const findExtremeRecipeTool: FunctionDeclaration = {
    name: 'find_extreme_recipe',
    description: 'Encuentra la receta más cara o más barata según su coste unitario.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            criteria: {
                type: Type.STRING,
                description: "El criterio para buscar, ya sea 'más_cara' o 'más_barata'.",
                enum: ['most_expensive', 'cheapest']
            }
        },
        required: ['criteria']
    }
};

const proposeIngredientPriceChangeTool: FunctionDeclaration = {
    name: 'propose_ingredient_price_change',
    description: 'Propone un cambio de precio para un ingrediente específico. No cambia el precio directamente, solo lo propone para confirmación del usuario.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            ingredientName: {
                type: Type.STRING,
                description: "El nombre del ingrediente que el usuario quiere modificar. Debe ser lo más parecido posible a un nombre de la lista de ingredientes."
            },
            newPrice: {
                type: Type.NUMBER,
                description: "El nuevo precio por unidad para el ingrediente."
            }
        },
        required: ['ingredientName', 'newPrice']
    }
};

const proposeNewRecipeTool: FunctionDeclaration = {
    name: 'propose_new_recipe',
    description: 'Crea un borrador para una nueva receta con un nombre, notas y una lista de ingredientes. No crea la receta directamente, solo propone un borrador para confirmación del usuario.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            recipeName: {
                type: Type.STRING,
                description: "El nombre de la nueva receta."
            },
            notes: {
                type: Type.STRING,
                description: "Notas o descripción para la receta."
            },
            ingredients: {
                type: Type.ARRAY,
                description: "Una lista de los ingredientes necesarios para la receta. Usa ingredientes que ya existen.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        ingredientName: {
                            type: Type.STRING,
                            description: "El nombre de un ingrediente existente en la lista de ingredientes del usuario. Debe ser lo más parecido posible a un nombre de la lista de ingredientes."
                        },
                        quantity: {
                            type: Type.NUMBER,
                            description: "La cantidad del ingrediente necesaria en su unidad base (g, ml, o unidad)."
                        }
                    },
                    required: ['ingredientName', 'quantity']
                }
            }
        },
        required: ['recipeName', 'ingredients']
    }
};

const proposeNewIngredientTool: FunctionDeclaration = {
    name: 'propose_new_ingredient',
    description: 'Prepara la creación de una nueva materia prima (ingrediente). Extrae los datos proporcionados por el usuario para rellenar el formulario de creación.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Nombre de la materia prima (ej: Harina de Maíz)." },
            costPerUnit: { type: Type.NUMBER, description: "Coste por unidad base (si se menciona explícitamente)." },
            unit: { type: Type.STRING, description: "Unidad base del ingrediente.", enum: ['g', 'ml', 'unit', 'kg', 'L'] },
            purchasePrice: { type: Type.NUMBER, description: "Precio de compra del formato/paquete (si se menciona)." },
            purchaseQuantity: { type: Type.NUMBER, description: "Cantidad que viene en el formato de compra (si se menciona)." },
            purchaseUnit: { type: Type.STRING, description: "Unidad del formato de compra.", enum: ['g', 'ml', 'unit', 'kg', 'L'] },
            purchaseFormatName: { type: Type.STRING, description: "Nombre del formato (ej: Saco, Caja, Botella)." }
        },
        required: ['name']
    }
};

const calculateRecipeScaleTool: FunctionDeclaration = {
    name: 'calculate_recipe_scale',
    description: 'Calcula los ingredientes y el coste total para una cantidad deseada de una receta específica.',
    parameters: {
        type: Type.OBJECT,
        properties: {
            recipeName: {
                type: Type.STRING,
                description: "El nombre de la receta que el usuario quiere escalar. Debe ser lo más parecido posible a un nombre de la lista de recetas."
            },
            desiredQuantity: {
                type: Type.NUMBER,
                description: "La cantidad final deseada para la producción de la receta (en su unidad final, ej: 500 para 500g, 10 para 10 unidades)."
            }
        },
        required: ['recipeName', 'desiredQuantity']
    }
};

const executeFindExtremeIngredient = (criteria: 'most_expensive' | 'cheapest', ingredients: Ingredient[]): Ingredient | null => {
    if (ingredients.length === 0) return null;
    return ingredients.reduce((extreme, current) => {
        if (criteria === 'most_expensive') {
            return current.costPerUnit > extreme.costPerUnit ? current : extreme;
        } else {
            return current.costPerUnit < extreme.costPerUnit ? current : extreme;
        }
    }, ingredients[0]);
}

const executeFindExtremeRecipe = (criteria: 'most_expensive' | 'cheapest', recipes: ProcessedRecipe[]): ProcessedRecipe | null => {
    if (recipes.length === 0) return null;
    return recipes.reduce((extreme, current) => {
        if (criteria === 'most_expensive') {
            return current.unitCost > extreme.unitCost ? current : extreme;
        } else {
            return current.unitCost < extreme.unitCost ? current : extreme;
        }
    }, recipes[0]);
}

const executeCalculateRecipeScale = (
    recipeName: string,
    desiredQuantity: number,
    processedRecipes: ProcessedRecipe[],
    ingredients: Ingredient[]
) => {
    const recipe = processedRecipes.find(r => r.name.toLowerCase() === recipeName.toLowerCase());
    if (!recipe) {
        return { error: `No se encontró la receta "${recipeName}".` };
    }

    const scaleFactor = (recipe.finalProductCount > 0 && desiredQuantity > 0)
        ? desiredQuantity / recipe.finalProductCount
        : 1;

    const scaledIngredients = recipe.ingredients.map(ing => {
        const ingredientDetails = ingredients.find(i => i.id === ing.ingredientId);
        return {
            name: ingredientDetails?.name || 'Desconocido',
            quantity: (ing.quantity * scaleFactor).toFixed(2),
            unit: ing.unit
        };
    });

    const scaledSubRecipes = recipe.subRecipes.map(sub => {
        const subRecipeDetails = processedRecipes.find(r => r.id === sub.recipeId);
        return {
            name: subRecipeDetails?.name || 'Receta desconocida',
            quantity: (sub.quantity * scaleFactor).toFixed(2),
            unit: 'g/ml/u'
        };
    });
    
    const totalScaledCost = recipe.totalCost * scaleFactor;

    return {
        recipeName: recipe.name,
        baseQuantity: `${recipe.finalProductCount} ${recipe.finalProductUnit}`,
        desiredQuantity: `${desiredQuantity} ${recipe.finalProductUnit}`,
        scaleFactor: `x${scaleFactor.toFixed(2)}`,
        totalScaledCost: `${totalScaledCost.toFixed(2)} €`,
        scaledIngredients: scaledIngredients,
        scaledSubRecipes: scaledSubRecipes.length > 0 ? scaledSubRecipes : undefined
    };
};

const formatHistoryForGemini = (history: ChatMessage[]) => {
    return history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));
}

export interface StreamChatResponse {
  finalText: string;
  groundingChunks: GroundingChunk[];
  priceChangeProposal?: PriceChangeProposal | null;
  recipeScaffold?: RecipeScaffold | null;
  ingredientScaffold?: Partial<Ingredient> | null;
}

// NEW INTERFACE for Invoice Analysis
export interface InvoiceAnalysisResult {
    supplierName: string;
    items: {
        name: string;
        purchasePrice: number; // Base Price (No Tax)
        purchaseQuantity: number;
        purchaseUnit: string; // kg, g, L, ml, unit
        formatName: string; // e.g. "Caja 6u", "Saco 25kg"
    }[];
}

// NEW FUNCTION: Analyze Invoice Image
export const analyzeInvoiceImage = async (base64Image: string): Promise<InvoiceAnalysisResult | null> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `Analiza esta imagen de una factura o etiqueta de compra para una pastelería.
    
    Extrae la siguiente información estructurada en formato JSON:
    1. "supplierName": El nombre del proveedor (busca el logo o la cabecera).
    2. "items": Una lista de los productos. Para cada producto extrae:
       - "name": Nombre descriptivo (ej: "Leche Entera", "Harina Fuerza").
       - "purchasePrice": El precio TOTAL de la línea (si es posible) o unitario, pero SIEMPRE SIN IVA (Base Imponible). Busca columnas como "Precio", "Base", "P.Unit".
       - "purchaseQuantity": La cantidad comprada (ej: si son 6 litros, pon 6). Intenta deducirlo de la descripción o cantidad.
       - "purchaseUnit": La unidad de medida (kg, g, L, ml, unit). Si es ambiguo, usa 'unit'.
       - "formatName": El formato del envase si se deduce (ej: "Caja", "Botella", "Saco").

    IMPORTANTE:
    - Ignora el IVA/Tax. Queremos el precio base.
    - Si hay múltiples líneas, extráelas todas.
    - Devuelve SOLO el JSON sin markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json"
            }
        });

        const text = response.response.text;
        if (!text) return null;
        
        return JSON.parse(text) as InvoiceAnalysisResult;
    } catch (e) {
        console.error("Error analyzing invoice:", e);
        return null;
    }
}

export const streamChatResponse = async (
    history: ChatMessage[],
    ingredients: Ingredient[],
    suppliers: Supplier[],
    processedRecipes: ProcessedRecipe[],
    onChunk: (text: string) => void
): Promise<StreamChatResponse> => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        const errorMessage = "⚠️ No se ha detectado la clave de API (API_KEY). Por favor configura la aplicación correctamente para usar Chef AI.";
        onChunk(errorMessage);
        return { finalText: errorMessage, groundingChunks: [], priceChangeProposal: null, recipeScaffold: null, ingredientScaffold: null };
    }

    const ai = new GoogleGenAI({ apiKey: API_KEY });

    try {
        const ingredientsContext = JSON.stringify(ingredients, null, 2);
        const suppliersContext = JSON.stringify(suppliers, null, 2);
        const recipesContext = JSON.stringify(processedRecipes, null, 2);

        const systemInstruction = `Eres un asistente experto para PastelerIA, una aplicación de gestión de costes para pastelerías. Tu nombre es Chef AI. Responde en español. Sé conciso y amigable.

        TUS CAPACIDADES: Puedes responder preguntas sobre los datos proporcionados, usar la búsqueda de Google para información externa y utilizar herramientas para:
        - Encontrar el ingrediente o receta más caro o más barato.
        - Proponer cambios de precio para un ingrediente.
        - Crear un borrador para una nueva receta (o materia prima).
        - Calcular los ingredientes y costes para una cantidad escalada de una receta.

        CONTEXTO IMPORTANTE:
        A continuación se muestra la lista actual de ingredientes, proveedores y recetas del usuario en formato JSON. Utiliza esta información para responder a sus preguntas. El campo 'supplierId' en un ingrediente corresponde al campo 'id' de un proveedor. Los costes de las recetas ('unitCost', 'totalCost', etc.) ya están calculados. Si la pregunta no se relaciona con estos datos, puedes usar tu conocimiento general o la búsqueda web.

        DATOS DE INGREDIENTES:
        ${ingredientsContext}

        DATOS DE PROVEEDORES:
        ${suppliersContext}

        DATOS DE RECETAS (CON COSTES CALCULADOS):
        ${recipesContext}
        `;
        
        let geminiHistory: { role: string; parts: any[] }[] = formatHistoryForGemini(history);
        
        const tools = [{functionDeclarations: [
            findExtremeIngredientTool, 
            findExtremeRecipeTool, 
            proposeIngredientPriceChangeTool, 
            proposeNewRecipeTool, 
            proposeNewIngredientTool,
            calculateRecipeScaleTool
        ]}];

        const initialResponse: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: geminiHistory,
            config: {
                systemInstruction,
                tools,
            }
        });

        const functionCalls = initialResponse.functionCalls;
        if (functionCalls && functionCalls.length > 0) {
            const fc = functionCalls[0];
            let toolResult: any = null;

            if (fc.name === 'find_extreme_ingredient') {
                const criteria = fc.args.criteria as 'most_expensive' | 'cheapest';
                toolResult = executeFindExtremeIngredient(criteria, ingredients);
            } else if (fc.name === 'find_extreme_recipe') {
                const criteria = fc.args.criteria as 'most_expensive' | 'cheapest';
                toolResult = executeFindExtremeRecipe(criteria, processedRecipes);
            } else if (fc.name === 'propose_ingredient_price_change') {
                const { ingredientName, newPrice } = fc.args;
                const targetIngredient = ingredients.find(i => i.name.toLowerCase() === (ingredientName as string).toLowerCase());
                
                if (targetIngredient && typeof newPrice === 'number') {
                    const proposal: PriceChangeProposal = {
                        ingredientId: targetIngredient.id,
                        ingredientName: targetIngredient.name,
                        oldPrice: targetIngredient.costPerUnit,
                        newPrice: newPrice,
                    };
                    return { finalText: '', groundingChunks: [], priceChangeProposal: proposal };
                }
            } else if (fc.name === 'propose_new_recipe') {
                const { recipeName, notes, ingredients: recipeIngredients } = fc.args;
                if (recipeName) {
                    let scaffoldIngredients: { ingredientId: string; quantity: number }[] = [];
                    
                    if (Array.isArray(recipeIngredients)) {
                        scaffoldIngredients = (recipeIngredients as any[])
                            .map(ing => {
                                const ingName = (ing.ingredientName as string).toLowerCase();
                                const targetIngredient = ingredients.find(i => 
                                    i.name.toLowerCase() === ingName || 
                                    i.name.toLowerCase().includes(ingName) ||
                                    ingName.includes(i.name.toLowerCase())
                                );

                                if (targetIngredient) {
                                    return {
                                        ingredientId: targetIngredient.id,
                                        quantity: ing.quantity as number
                                    };
                                }
                                return null;
                            })
                            .filter((ing): ing is { ingredientId: string; quantity: number } => ing !== null);
                    }

                    const scaffold: RecipeScaffold = {
                        name: recipeName as string,
                        notes: (notes as string) || '',
                        ingredients: scaffoldIngredients
                    };
                    return { finalText: '', groundingChunks: [], recipeScaffold: scaffold };
                }
            } else if (fc.name === 'propose_new_ingredient') {
                 const { name, costPerUnit, unit, purchasePrice, purchaseQuantity, purchaseUnit, purchaseFormatName } = fc.args;
                 if (name) {
                     const ingredientScaffold: Partial<Ingredient> = {
                         name: name as string,
                         costPerUnit: (costPerUnit as number) || 0,
                         unit: (unit as any) || 'kg',
                         purchasePrice: (purchasePrice as number),
                         purchaseQuantity: (purchaseQuantity as number),
                         purchaseUnit: (purchaseUnit as any),
                         purchaseFormatName: (purchaseFormatName as string),
                     };
                     return { finalText: '', groundingChunks: [], ingredientScaffold };
                 }
            } else if (fc.name === 'calculate_recipe_scale') {
                const { recipeName, desiredQuantity } = fc.args;
                if (typeof recipeName === 'string' && typeof desiredQuantity === 'number') {
                    toolResult = executeCalculateRecipeScale(recipeName, desiredQuantity, processedRecipes, ingredients);
                }
            }
            
            if (toolResult) {
                geminiHistory.push({ role: 'model', parts: [{ functionCall: fc }] });
                geminiHistory.push({ role: 'tool', parts: [{ functionResponse: { name: fc.name, response: { result: JSON.stringify(toolResult) }}}] });
            }
        }
        
        const resultStream = await ai.models.generateContentStream({
            model,
            contents: geminiHistory,
            config: {
                systemInstruction,
                tools: [{googleSearch: {}}],
            }
        });

        let accumulatedText = "";
        let allGroundingChunks: GroundingChunk[] = [];
        
        for await (const chunk of resultStream) {
            const chunkText = chunk.text;
            if (chunkText) {
                accumulatedText += chunkText;
                onChunk(accumulatedText);
            }
             const groundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
             if (groundingMetadata?.groundingChunks) {
                allGroundingChunks.push(...(groundingMetadata.groundingChunks as GroundingChunk[]));
             }
        }

        const uniqueChunks = Array.from(new Map(allGroundingChunks.map(item => [item.web.uri, item])).values());

        return { finalText: accumulatedText, groundingChunks: uniqueChunks, priceChangeProposal: null, recipeScaffold: null, ingredientScaffold: null };
    } catch (error) {
        console.error("Error streaming response from Gemini:", error);
        const errorMessage = "Lo siento, he encontrado un problema de conexión con la IA. Por favor, verifica tu conexión o inténtalo más tarde.";
        onChunk(errorMessage);
        return { finalText: errorMessage, groundingChunks: [], priceChangeProposal: null, recipeScaffold: null, ingredientScaffold: null };
    }
};
