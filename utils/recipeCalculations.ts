
import { Recipe, Ingredient, Unit } from '../types';
import { ALLERGENS } from '../constants';

export interface RecipeScaffold {
  name: string;
  notes: string;
  ingredients: {
    ingredientId: string;
    quantity: number;
  }[];
}

const costCache = new Map<string, ReturnType<typeof calculateRecipeCostInternal>>();

const calculateRecipeCostInternal = (
  recipeId: string,
  recipes: Recipe[],
  ingredients: Ingredient[],
  processedIds: Set<string> = new Set()
): {
  materialCostWithWaste: number;
  elaborationCost: number;
  bakingCost: number;
  totalCost: number;
  allergens: Set<string>;
} => {
  if (processedIds.has(recipeId)) {
    console.warn(`Circular dependency detected in recipe ${recipeId}`);
    return { materialCostWithWaste: 0, elaborationCost: 0, bakingCost: 0, totalCost: 0, allergens: new Set() };
  }

  if (costCache.has(recipeId)) {
    return costCache.get(recipeId)!;
  }
  
  processedIds.add(recipeId);

  const recipe = recipes.find(r => r.id === recipeId);
  if (!recipe) return { materialCostWithWaste: 0, elaborationCost: 0, bakingCost: 0, totalCost: 0, allergens: new Set() };

  let rawMaterialCost = 0;
  const allergens = new Set<string>();

  // Add allergens from ingredients
  recipe.ingredients.forEach(ri => {
    const ingredient = ingredients.find(i => i.id === ri.ingredientId);
    if (ingredient) {
      let costPerBaseUnit = ingredient.costPerUnit;
      if (ingredient.unit === 'kg' || ingredient.unit === 'L') {
        costPerBaseUnit /= 1000;
      }

      let quantityInBaseUnit = ri.quantity;
      if (ri.unit === 'kg' || ri.unit === 'L') {
        quantityInBaseUnit *= 1000;
      }
      
      rawMaterialCost += quantityInBaseUnit * costPerBaseUnit;

      // Aggregating allergens
      if (ingredient.allergens) {
          ingredient.allergens.forEach(a => allergens.add(a));
      }
    }
  });

  // Add allergens from sub-recipes
  recipe.subRecipes.forEach(sr => {
    const subRecipe = recipes.find(r => r.id === sr.recipeId);
    if (subRecipe) {
      const subRecipeCosts = calculateRecipeCostInternal(sr.recipeId, recipes, ingredients, processedIds);
      
      let subRecipeOutputInBaseUnit = subRecipe.finalProductCount;
      if (subRecipe.finalProductUnit === 'kg' || subRecipe.finalProductUnit === 'L') {
          subRecipeOutputInBaseUnit *= 1000;
      }

      const costPerBaseUnitOfSubRecipe = subRecipeOutputInBaseUnit > 0 ? subRecipeCosts.totalCost / subRecipeOutputInBaseUnit : 0;
      
      rawMaterialCost += sr.quantity * costPerBaseUnitOfSubRecipe;

      // Aggregating sub-recipe allergens
      subRecipeCosts.allergens.forEach(a => allergens.add(a));
    }
  });
  
  const materialCostWithWaste = rawMaterialCost / (1 - (recipe.wastePercentage / 100));
  const elaborationCost = materialCostWithWaste * ((recipe.elaborationCostPercentage || 0) / 100);
  const bakingCost = materialCostWithWaste * ((recipe.bakingCostPercentage || 0) / 100);
  const totalCost = materialCostWithWaste + elaborationCost + bakingCost;

  const result = { materialCostWithWaste, elaborationCost, bakingCost, totalCost, allergens };
  costCache.set(recipeId, result);

  processedIds.delete(recipeId);

  return result;
};

export const calculateAllRecipeCosts = (recipes: Recipe[], ingredients: Ingredient[]) => {
    costCache.clear();
    return recipes.map(recipe => {
        const costs = calculateRecipeCostInternal(recipe.id, recipes, ingredients);
        const unitCost = recipe.finalProductCount > 0 ? costs.totalCost / recipe.finalProductCount : 0;
        const targetMargin = recipe.profitMarginPercentage ?? 30;
        const suggestedPrice = targetMargin < 100 && unitCost > 0 ? unitCost / (1 - (targetMargin / 100)) : unitCost;

        let realMarginPercentage = undefined;
        if (recipe.salePrice && recipe.salePrice > 0) {
            realMarginPercentage = ((recipe.salePrice - unitCost) / recipe.salePrice) * 100;
        }

        let unitCostPerKg, unitCostPerL, suggestedPricePerKg, suggestedPricePerL;

        if (recipe.finalProductUnit === Unit.g) {
            unitCostPerKg = unitCost * 1000;
            suggestedPricePerKg = suggestedPrice * 1000;
        } else if (recipe.finalProductUnit === Unit.ml) {
            unitCostPerL = unitCost * 1000;
            suggestedPricePerL = suggestedPrice * 1000;
        }

        return { 
            ...recipe, 
            ...costs, 
            allergens: Array.from(costs.allergens), // Convert Set to Array
            unitCost, 
            suggestedPrice,
            realMarginPercentage,
            unitCostPerKg,
            unitCostPerL,
            suggestedPricePerKg,
            suggestedPricePerL
        };
    });
};

export type ProcessedRecipe = ReturnType<typeof calculateAllRecipeCosts>[0];

export const exportRecipesToCSV = (recipes: ProcessedRecipe[]) => {
    const headers = [
      "ID", "Nombre", "Notas", "Tags", "Alérgenos", "Coste Materiales (€)", 
      "Coste Elaboracion (€)", "Coste Horneado (€)", "Coste Total (€)", 
      "Coste Unitario (€)", "Unidad Final", "Margen Deseado (%)", "PVP Sugerido (€)", "PVP Real (€)", "Margen Real (%)"
    ];
    
    const rows = recipes.map(r => {
        // Map allergens ids to labels
        const allergenLabels = r.allergens.map(id => ALLERGENS.find(a => a.id === id)?.label || id).join(', ');

        return [
            r.id,
            `"${r.name.replace(/"/g, '""')}"`,
            `"${r.notes.replace(/"/g, '""')}"`,
            `"${(r.tags || []).join(', ')}"`,
            `"${allergenLabels}"`,
            r.materialCostWithWaste.toFixed(4),
            r.elaborationCost.toFixed(4),
            r.bakingCost.toFixed(4),
            r.totalCost.toFixed(4),
            r.unitCost.toFixed(4),
            r.finalProductUnit,
            (r.profitMarginPercentage ?? 30).toFixed(2),
            r.suggestedPrice.toFixed(4),
            (r.salePrice || 0).toFixed(4),
            (r.realMarginPercentage || 0).toFixed(2)
        ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + "\n" 
      + rows.join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `pasteleria_recetas_${date}.csv`);
    document.body.appendChild(link); 
    link.click();
    document.body.removeChild(link);
};
