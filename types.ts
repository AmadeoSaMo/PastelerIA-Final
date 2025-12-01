
export enum Unit {
  g = 'g',
  kg = 'kg',
  ml = 'ml',
  L = 'L',
  unit = 'unit',
}

export enum IngredientType {
  weight = 'weight',
  unit = 'unit',
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  officePhone?: string;
  salesPhone?: string;
  email?: string;
  deliveryDays?: number[]; // 0 = Sunday, 1 = Monday, etc.
  notes?: string;
}

export interface Ingredient {
  id: string;
  name:string;
  unit: Unit;
  costPerUnit: number;
  supplierId?: string;
  lastUpdated: string;
  type: IngredientType;
  purchasePrice?: number;
  purchaseQuantity?: number;
  purchaseUnit?: Unit;
  purchaseFormatName?: string;
  allergens?: string[]; // List of allergen IDs
}

export interface RecipeIngredient {
  ingredientId: string;
  quantity: number;
  unit: Unit;
}

export interface SubRecipe {
  recipeId: string;
  quantity: number;
  unit?: string; // Optional helper, though usually implied as g/ml/unit
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  subRecipes: SubRecipe[];
  finalProductCount: number;
  finalProductUnit: Unit;
  notes: string;
  wastePercentage: number;
  tags?: string[];
  elaborationCostPercentage?: number;
  bakingCostPercentage?: number;
  profitMarginPercentage?: number;
  isForSale?: boolean;
  salePrice?: number; // PVP Real defined by user
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export interface PriceChangeProposal {
  ingredientId: string;
  ingredientName: string;
  oldPrice: number;
  newPrice: number;
}

export interface BusinessProfile {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string; // NIF/CIF
}
