
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { Ingredient, Recipe, Unit, IngredientType, Supplier, BusinessProfile, ChatMessage } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Theme } from '../utils/themes';

interface AppSettings {
  theme: Theme;
  fontSize: 'normal' | 'medium' | 'large';
}

interface AppContextType {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  businessProfile: BusinessProfile;
  setBusinessProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  clearChatHistory: () => void;
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>) => void;
  updateIngredient: (ingredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  addRecipe: (recipe: Omit<Recipe, 'id'>) => void;
  updateRecipe: (recipe: Recipe) => void;
  deleteRecipe: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (supplier: Supplier) => void;
  deleteSupplier: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialSuppliers: Supplier[] = [
    { id: 's1', name: 'Harinas Panificables S.L.', contactName: 'Juan García', officePhone: '912345678', salesPhone: '612345678', email: 'pedidos@harinaspan.es', deliveryDays: [1, 4], notes: 'Pedido mínimo de 50€. Llamar antes de las 12h para entrega al día siguiente.' },
    { id: 's2', name: 'Dulce Vida S.A.', contactName: 'María López', officePhone: '934567890', salesPhone: '623456789', email: 'comercial@dulcevida.es', deliveryDays: [3], notes: 'Especialistas en chocolates y azúcares especiales.' },
    { id: 's3', name: 'Granja Avícola El Huevo de Oro', contactName: 'Carlos Sánchez', officePhone: '956789012', salesPhone: '634567890', email: 'ventas@huevodeoro.es', deliveryDays: [1, 2, 3, 4, 5] },
    { id: 's4', name: 'Lácteos del Prado', contactName: 'Ana Martínez', officePhone: '987654321', salesPhone: '645678901', email: 'info@lacteosprado.com', deliveryDays: [2, 5], notes: 'La nata fresca solo se entrega los viernes.' },
];

const initialIngredients: Ingredient[] = [
    { id: '1', name: 'Harina de Trigo', unit: Unit.kg, costPerUnit: 1.20, supplierId: 's1', lastUpdated: '2023-10-26', type: IngredientType.weight, purchasePrice: 30, purchaseQuantity: 25, purchaseUnit: Unit.kg, purchaseFormatName: 'Saco', allergens: ['gluten'] },
    { id: '2', name: 'Azúcar Blanco', unit: Unit.kg, costPerUnit: 0.90, supplierId: 's2', lastUpdated: '2023-10-25', type: IngredientType.weight, purchasePrice: 45, purchaseQuantity: 50, purchaseUnit: Unit.kg, purchaseFormatName: 'Saco', allergens: [] },
    { id: '3', name: 'Huevo (unidad)', unit: Unit.unit, costPerUnit: 0.15, supplierId: 's3', lastUpdated: '2023-10-27', type: IngredientType.unit, purchasePrice: 4.50, purchaseQuantity: 30, purchaseUnit: Unit.unit, purchaseFormatName: 'Caja', allergens: ['eggs'] },
    { id: '4', name: 'Leche Entera', unit: Unit.L, costPerUnit: 0.85, supplierId: 's4', lastUpdated: '2023-10-26', type: IngredientType.weight, purchasePrice: 5.10, purchaseQuantity: 6, purchaseUnit: Unit.L, purchaseFormatName: 'Pack de 6', allergens: ['milk'] },
];

const initialRecipes: Recipe[] = [
     { id: 'r1', name: 'Crema Pastelera', ingredients: [{ingredientId: '4', quantity: 500, unit: Unit.ml}, {ingredientId: '2', quantity: 100, unit: Unit.g}, {ingredientId: '3', quantity: 2, unit: Unit.unit}], subRecipes: [], finalProductCount: 600, finalProductUnit: Unit.g, notes: 'Base para rellenos.', wastePercentage: 5, tags: ['base', 'crema', 'relleno'], elaborationCostPercentage: 15, bakingCostPercentage: 0, isForSale: false },
     { id: 'r2', name: 'Bizcocho Genovés', ingredients: [{ingredientId: '1', quantity: 120, unit: Unit.g}, {ingredientId: '2', quantity: 120, unit: Unit.g}, {ingredientId: '3', quantity: 4, unit: Unit.unit}], subRecipes: [], finalProductCount: 500, finalProductUnit: Unit.g, notes: 'Ideal para tartas.', wastePercentage: 10, tags: ['base', 'bizcocho', 'tarta'], elaborationCostPercentage: 10, bakingCostPercentage: 20, isForSale: false },
     { id: 'r3', name: 'Croissant de Mantequilla', ingredients: [{ingredientId: '1', quantity: 500, unit: Unit.g}, {ingredientId: '4', quantity: 250, unit: Unit.ml}, {ingredientId: '2', quantity: 60, unit: Unit.g}, {ingredientId: '3', quantity: 1, unit: Unit.unit}], subRecipes: [], finalProductCount: 12, finalProductUnit: Unit.unit, notes: 'Bollería de desayuno laminada. Receta clásica.', wastePercentage: 5, tags: ['bollería', 'desayuno', 'venta'], elaborationCostPercentage: 25, bakingCostPercentage: 15, profitMarginPercentage: 70, isForSale: true, salePrice: 1.80 }
];

const defaultSettings: AppSettings = {
  theme: 'natural',
  fontSize: 'normal',
};

const defaultBusinessProfile: BusinessProfile = {
  name: 'Mi Pastelería',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ingredients, setIngredients] = useLocalStorage<Ingredient[]>('ingredients', initialIngredients);
  const [recipes, setRecipes] = useLocalStorage<Recipe[]>('recipes', initialRecipes);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', initialSuppliers);
  const [settings, setSettings] = useLocalStorage<AppSettings>('app-settings', defaultSettings);
  const [businessProfile, setBusinessProfile] = useLocalStorage<BusinessProfile>('business-profile', defaultBusinessProfile);
  const [chatHistory, setChatHistory] = useLocalStorage<ChatMessage[]>('chat-history', []);

  // DATA MIGRATION & REPAIR EFFECT
  // This runs once on mount to ensure old data matches new structure
  useEffect(() => {
    let hasChanges = false;

    // 1. Repair Ingredients (Ensure allergens array exists)
    const repairedIngredients = ingredients.map(ing => {
        if (!ing.allergens) {
            hasChanges = true;
            return { ...ing, allergens: [] };
        }
        return ing;
    });

    if (hasChanges) {
        setIngredients(repairedIngredients);
        hasChanges = false; // Reset for next check
    }

    // 2. Repair Recipes (Ensure sale fields exist)
    const repairedRecipes = recipes.map(recipe => {
        let needsUpdate = false;
        const updated = { ...recipe };

        if (updated.profitMarginPercentage === undefined) {
            updated.profitMarginPercentage = 30;
            needsUpdate = true;
        }
        if (updated.isForSale === undefined) {
            updated.isForSale = false;
            needsUpdate = true;
        }
        
        if (needsUpdate) {
            hasChanges = true;
            return updated;
        }
        return recipe;
    });

    if (hasChanges) {
        setRecipes(repairedRecipes);
    }

  }, []); // Empty dependency array = runs only on app mount

  const addIngredient = (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'>) => {
    const newIngredient: Ingredient = {
      ...ingredient,
      id: new Date().toISOString(),
      lastUpdated: new Date().toISOString().split('T')[0],
    };
    setIngredients(prev => [...prev, newIngredient]);
  };

  const updateIngredient = (updatedIngredient: Ingredient) => {
    setIngredients(prev => prev.map(ing => ing.id === updatedIngredient.id ? { ...updatedIngredient, lastUpdated: new Date().toISOString().split('T')[0] } : ing));
  };

  const deleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(ing => ing.id !== id));
    setRecipes(prevRecipes => prevRecipes.map(r => ({
      ...r,
      ingredients: r.ingredients.filter(ing => ing.ingredientId !== id)
    })));
  };
  
  const addRecipe = (recipe: Omit<Recipe, 'id'>) => {
    const newRecipe: Recipe = {
      ...recipe,
      id: new Date().toISOString(),
    };
    setRecipes(prev => [...prev, newRecipe]);
  };

  const updateRecipe = (updatedRecipe: Recipe) => {
    setRecipes(prev => prev.map(rec => rec.id === updatedRecipe.id ? updatedRecipe : rec));
  };

  const deleteRecipe = (id: string) => {
    setRecipes(prevRecipes => {
      const updatedRecipes = prevRecipes.filter(rec => rec.id !== id);
      return updatedRecipes.map(r => ({
        ...r,
        subRecipes: r.subRecipes.filter(sr => sr.recipeId !== id)
      }));
    });
  };
  
  const addSupplier = (supplier: Omit<Supplier, 'id'>) => {
    const newSupplier: Supplier = {
      ...supplier,
      id: new Date().toISOString(),
    };
    setSuppliers(prev => [...prev, newSupplier]);
  };

  const updateSupplier = (updatedSupplier: Supplier) => {
    setSuppliers(prev => prev.map(sup => sup.id === updatedSupplier.id ? updatedSupplier : sup));
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(sup => sup.id !== id));
    setIngredients(prevIngredients => prevIngredients.map(i => {
        if (i.supplierId === id) {
            const { supplierId, ...remaining } = i;
            return { ...remaining, supplierId: undefined };
        }
        return i;
    }));
  };

  const clearChatHistory = () => {
    setChatHistory([]);
  };

  return (
    <AppContext.Provider value={{ 
        ingredients, setIngredients, 
        recipes, setRecipes, 
        suppliers, setSuppliers, 
        settings, setSettings,
        businessProfile, setBusinessProfile,
        chatHistory, setChatHistory, clearChatHistory,
        addIngredient, updateIngredient, deleteIngredient, 
        addRecipe, updateRecipe, deleteRecipe, 
        addSupplier, updateSupplier, deleteSupplier 
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
