
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { Recipe, Unit, Ingredient } from '../../types';
import IngredientForm from '../forms/IngredientForm';
import { calculateAllRecipeCosts } from '../../utils/recipeCalculations';
import { UNIT_OPTIONS } from '../../constants';

const RecipeForm: React.FC<{
  recipe: Recipe | null;
  onSave: (recipe: Omit<Recipe, 'id'> | Recipe) => void;
  onClose: () => void;
}> = ({ recipe, onSave, onClose }) => {
  const { ingredients, recipes, addIngredient } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: '',
    ingredients: [] as {ingredientId: string, quantity: string, unit: Unit}[],
    subRecipes: [] as {recipeId: string, quantity: string}[],
    finalProductCount: 1,
    finalProductUnit: Unit.unit,
    notes: '',
    wastePercentage: 0,
    tags: [] as string[] | undefined,
    elaborationCostPercentage: 0,
    bakingCostPercentage: 0,
    profitMarginPercentage: 30,
    isForSale: false,
    salePrice: '' as string | number, // Added for Real PVP
  });

  const [isNewIngredientModalOpen, setIsNewIngredientModalOpen] = useState(false);

  const allProcessedRecipes = useMemo(() => calculateAllRecipeCosts(recipes, ingredients), [recipes, ingredients]);

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name,
        ingredients: recipe.ingredients.map(ing => ({ 
            ingredientId: ing.ingredientId, 
            quantity: String(ing.quantity), 
            unit: ing.unit 
        })),
        subRecipes: recipe.subRecipes.map(sub => ({ 
            recipeId: sub.recipeId, 
            quantity: String(sub.quantity) 
        })),
        finalProductCount: recipe.finalProductCount,
        finalProductUnit: recipe.finalProductUnit || Unit.unit,
        notes: recipe.notes,
        wastePercentage: recipe.wastePercentage,
        tags: recipe.tags || [],
        elaborationCostPercentage: recipe.elaborationCostPercentage || 0,
        bakingCostPercentage: recipe.bakingCostPercentage || 0,
        profitMarginPercentage: recipe.profitMarginPercentage ?? 30,
        isForSale: recipe.isForSale || false,
        salePrice: recipe.salePrice ?? '', // Use nullish coalescing to allow 0
      });
    } else {
      setFormData({
        name: '',
        ingredients: [],
        subRecipes: [],
        finalProductCount: 1,
        finalProductUnit: Unit.unit,
        notes: '',
        wastePercentage: 0,
        tags: [],
        elaborationCostPercentage: 0,
        bakingCostPercentage: 0,
        profitMarginPercentage: 30,
        isForSale: false,
        salePrice: '',
      });
    }
  }, [recipe]);

  // Real-time calculations using useMemo for better performance
  const calculatedCosts = useMemo(() => {
    const currentIngredients = formData.ingredients.map(ing => ({
        ...ing,
        quantity: parseFloat(String(ing.quantity).replace(',', '.')) || 0,
    }));
    const currentSubRecipes = formData.subRecipes.map(sub => ({
        ...sub,
        quantity: parseFloat(String(sub.quantity).replace(',', '.')) || 0,
    }));

    let rawMaterialCost = 0;
    currentIngredients.forEach(ri => {
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
        }
    });
    
    currentSubRecipes.forEach(sr => {
        const subRecipeData = allProcessedRecipes.find(r => r.id === sr.recipeId);
        if (subRecipeData) {
            let subRecipeOutputInBaseUnit = subRecipeData.finalProductCount;
            if (subRecipeData.finalProductUnit === 'kg' || subRecipeData.finalProductUnit === 'L') {
                subRecipeOutputInBaseUnit *= 1000;
            }
            const costPerBaseUnitOfSubRecipe = subRecipeOutputInBaseUnit > 0 ? subRecipeData.totalCost / subRecipeOutputInBaseUnit : 0;
            rawMaterialCost += sr.quantity * costPerBaseUnitOfSubRecipe;
        }
    });

    const waste = formData.wastePercentage || 0;
    const elaboration = formData.elaborationCostPercentage || 0;
    const baking = formData.bakingCostPercentage || 0;
    
    const materialCostWithWaste = rawMaterialCost / (1 - (waste / 100));
    const elaborationCost = materialCostWithWaste * (elaboration / 100);
    const bakingCost = materialCostWithWaste * (baking / 100);
    const totalCost = materialCostWithWaste + elaborationCost + bakingCost;
    
    // Safety check for division by zero
    const unitCost = formData.finalProductCount > 0 ? totalCost / formData.finalProductCount : 0;
    
    const currentMargin = formData.profitMarginPercentage || 0;
    const suggestedPrice = currentMargin < 100 && unitCost > 0 ? unitCost / (1 - (currentMargin / 100)) : unitCost;

    let unitCostPerKg, unitCostPerL, suggestedPricePerKg, suggestedPricePerL;
    if (formData.finalProductUnit === Unit.g) {
        unitCostPerKg = unitCost * 1000;
        suggestedPricePerKg = suggestedPrice * 1000;
    } else if (formData.finalProductUnit === Unit.ml) {
        unitCostPerL = unitCost * 1000;
        suggestedPricePerL = suggestedPrice * 1000;
    }

    // Real Margin Calc
    const currentSalePrice = parseFloat(String(formData.salePrice).replace(',', '.')) || 0;
    const realMarginPercentage = currentSalePrice > 0 
        ? ((currentSalePrice - unitCost) / currentSalePrice) * 100 
        : 0;

    return {
        totalCost: isFinite(totalCost) ? totalCost : 0,
        unitCost: isFinite(unitCost) ? unitCost : 0,
        suggestedPrice: isFinite(suggestedPrice) ? suggestedPrice : 0,
        unitCostPerKg: unitCostPerKg && isFinite(unitCostPerKg) ? unitCostPerKg : undefined,
        unitCostPerL: unitCostPerL && isFinite(unitCostPerL) ? unitCostPerL : undefined,
        suggestedPricePerKg: suggestedPricePerKg && isFinite(suggestedPricePerKg) ? suggestedPricePerKg : undefined,
        suggestedPricePerL: suggestedPricePerL && isFinite(suggestedPricePerL) ? suggestedPricePerL : undefined,
        realMarginPercentage,
    };

  }, [formData, ingredients, allProcessedRecipes]);

  const handleSaveNewIngredient = (ingredientData: Omit<Ingredient, 'id' | 'lastUpdated'> | Ingredient) => {
    if (!('id' in ingredientData)) {
      addIngredient(ingredientData);
    }
    setIsNewIngredientModalOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'salePrice') {
         setFormData(prev => ({ ...prev, [name]: value }));
    } else {
        const isNumeric = ['finalProductCount', 'wastePercentage', 'elaborationCostPercentage', 'bakingCostPercentage', 'profitMarginPercentage'].includes(name);
        setFormData(prev => ({ ...prev, [name]: isNumeric ? parseFloat(value) || 0 : value }));
    }
  };
  
  const handleIndirectCostToggle = (field: 'elaborationCostPercentage' | 'bakingCostPercentage', isChecked: boolean) => {
    setFormData(prev => ({
        ...prev,
        [field]: isChecked ? 10 : 0 // Default to 10% when checked, 0 when unchecked
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
      setFormData(prev => ({ ...prev, tags }));
  }

  const handleAddIngredient = () => {
    if (ingredients.length === 0) {
        alert("Añade primero una materia prima en la pestaña de Materias Primas.");
        return;
    }
    const newIngredient = { ingredientId: ingredients[0].id, quantity: '0', unit: ingredients[0].unit };
    setFormData(prev => ({ ...prev, ingredients: [...prev.ingredients, newIngredient] }));
  }
  
  const handleIngredientChange = (index: number, field: 'ingredientId' | 'quantity' | 'unit', value: string) => {
    const newIngredients = [...formData.ingredients];
    if (field === 'quantity') {
      newIngredients[index][field] = value;
    } else {
      newIngredients[index][field] = value as any;
      if (field === 'ingredientId') {
          const selectedIngredient = ingredients.find(i => i.id === value);
          if (selectedIngredient) {
              newIngredients[index].unit = selectedIngredient.unit;
          }
      }
    }
    setFormData(prev => ({ ...prev, ingredients: newIngredients }));
  }
  
  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
  }
  
  const handleAddSubRecipe = () => {
    const availableRecipes = recipes.filter(r => r.id !== recipe?.id);
    if (availableRecipes.length > 0) {
        const newSubRecipe = { recipeId: availableRecipes[0].id, quantity: '0' };
        setFormData(prev => ({ ...prev, subRecipes: [...prev.subRecipes, newSubRecipe] }));
    } else {
        alert("No hay otras recetas disponibles para añadir como sub-receta.");
    }
  }
  
  const handleSubRecipeChange = (index: number, field: 'recipeId' | 'quantity', value: string) => {
    const newSubRecipes = [...formData.subRecipes];
    if (field === 'quantity') {
        newSubRecipes[index].quantity = value;
    } else {
        newSubRecipes[index].recipeId = value;
    }
    setFormData(prev => ({ ...prev, subRecipes: newSubRecipes }));
  }
  
  const handleRemoveSubRecipe = (index: number) => {
    setFormData(prev => ({ ...prev, subRecipes: prev.subRecipes.filter((_, i) => i !== index) }));
  }

  // Prevent accidental submit on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipeToSave = {
        ...formData,
        tags: formData.tags || [],
        ingredients: formData.ingredients.map(ing => ({
            ...ing,
            quantity: parseFloat(String(ing.quantity).replace(',', '.')) || 0,
        })),
        subRecipes: formData.subRecipes.map(sub => ({
            ...sub,
            quantity: parseFloat(String(sub.quantity).replace(',', '.')) || 0,
        })),
        salePrice: parseFloat(String(formData.salePrice).replace(',', '.')) || undefined,
    };

    const finalRecipe = recipe ? { ...recipeToSave, id: recipe.id } : recipeToSave;
    onSave(finalRecipe);
  };
    
  const ingredientOptions = ingredients.map(i => ({ value: i.id, label: i.name }));
  const subRecipeOptions = recipes.filter(r => r.id !== recipe?.id).map(r => ({ value: r.id, label: r.name }));

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto p-1 pr-3" onKeyDown={handleKeyDown}>
        <Input label="Nombre de la Receta" name="name" value={formData.name} onChange={handleChange} required />
        
        <div>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">Ingredientes</h3>
          <div className="space-y-3">
          {formData.ingredients.map((ing, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 p-2 border rounded-lg bg-neutral-50">
                  <Select 
                    containerClassName="w-full md:flex-1 min-w-0" 
                    options={ingredientOptions} 
                    value={ing.ingredientId} 
                    onChange={e => handleIngredientChange(index, 'ingredientId', e.target.value)} 
                  />
                  <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                      <Input 
                        containerClassName="w-16" 
                        type="text" 
                        inputMode="decimal" 
                        placeholder="Cant." 
                        value={ing.quantity} 
                        onChange={e => handleIngredientChange(index, 'quantity', e.target.value)} 
                      />
                      <p className="w-12 text-sm text-neutral-600 text-center truncate">{ing.unit}</p>
                      <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveIngredient(index)} className="!p-2 flex-shrink-0"><Trash2 size={16} /></Button>
                  </div>
              </div>
          ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button type="button" variant="secondary" size="sm" onClick={handleAddIngredient} className="text-xs">Añadir Materia Prima</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setIsNewIngredientModalOpen(true)} className="text-xs">
              + Crear Materia Prima
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">Sub-Recetas</h3>
          <div className="space-y-3">
          {formData.subRecipes.map((sub, index) => (
              <div key={index} className="flex flex-col md:flex-row md:items-center gap-2 p-2 border rounded-lg bg-neutral-50">
                  <Select 
                    containerClassName="w-full md:flex-1 min-w-0" 
                    options={subRecipeOptions} 
                    value={sub.recipeId} 
                    onChange={e => handleSubRecipeChange(index, 'recipeId', e.target.value)} 
                  />
                   <div className="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
                      <Input 
                        containerClassName="w-16" 
                        type="text" 
                        inputMode="decimal" 
                        placeholder="Cant." 
                        value={sub.quantity} 
                        onChange={e => handleSubRecipeChange(index, 'quantity', e.target.value)} 
                      />
                      <p className="w-12 text-sm text-neutral-600 text-center truncate">g/ml/u</p>
                      <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveSubRecipe(index)} className="!p-2 flex-shrink-0"><Trash2 size={16} /></Button>
                  </div>
              </div>
          ))}
          </div>
          {subRecipeOptions.length > 0 ? (
              <Button type="button" variant="secondary" size="sm" onClick={handleAddSubRecipe} className="mt-2 text-xs">Añadir Sub-Receta</Button>
          ) : (
              <p className="text-xs text-neutral-500 mt-2">No hay otras recetas para usar como sub-recetas.</p>
          )}
        </div>

        {/* ALIGNMENT FIX: Use grid for perfect alignment of final product fields */}
        <div className="grid grid-cols-12 gap-4 items-end bg-neutral-50 p-4 rounded-lg border">
            <div className="col-span-12 sm:col-span-5">
                <Input 
                    label="Producción Final" 
                    name="finalProductCount" 
                    type="number" 
                    step="any" 
                    value={formData.finalProductCount} 
                    onChange={handleChange} 
                    required 
                    containerClassName="w-full" 
                />
            </div>
            <div className="col-span-12 sm:col-span-3">
                <Select 
                    label="Unidad" 
                    name="finalProductUnit" 
                    value={formData.finalProductUnit} 
                    onChange={handleChange} 
                    options={UNIT_OPTIONS} 
                    containerClassName="w-full" 
                />
            </div>
            <div className="col-span-12 sm:col-span-4">
                <Input 
                    label="Merma (%)" 
                    name="wastePercentage" 
                    type="number" 
                    step="any" 
                    value={formData.wastePercentage} 
                    onChange={handleChange} 
                    containerClassName="w-full"
                />
            </div>
        </div>
        
        <div>
            <h3 className="text-base font-medium text-neutral-800 mb-2">Costes Indirectos</h3>
            <div className="space-y-3 rounded-md border bg-neutral-50 p-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="hasElaboration"
                            checked={formData.elaborationCostPercentage > 0}
                            onChange={e => handleIndirectCostToggle('elaborationCostPercentage', e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="hasElaboration" className="ml-2 block text-sm font-medium text-neutral-700">Añadir coste de Elaboración</label>
                    </div>
                    {formData.elaborationCostPercentage > 0 && (
                        <div className="flex items-center">
                            <Input 
                                type="number" 
                                step="any"
                                name="elaborationCostPercentage"
                                value={formData.elaborationCostPercentage}
                                onChange={handleChange}
                                className="w-24 p-1.5"
                            />
                            <span className="ml-2 text-sm text-neutral-500">%</span>
                        </div>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <div className="flex items-center">
                        <input 
                            type="checkbox" 
                            id="hasBaking"
                            checked={formData.bakingCostPercentage > 0}
                            onChange={e => handleIndirectCostToggle('bakingCostPercentage', e.target.checked)}
                            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="hasBaking" className="ml-2 block text-sm font-medium text-neutral-700">Añadir coste de Horneado</label>
                    </div>
                    {formData.bakingCostPercentage > 0 && (
                        <div className="flex items-center">
                            <Input 
                                type="number" 
                                step="any"
                                name="bakingCostPercentage"
                                value={formData.bakingCostPercentage}
                                onChange={handleChange}
                                className="w-24 p-1.5"
                            />
                            <span className="ml-2 text-sm text-neutral-500">%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="flex items-center space-x-3 bg-neutral-50 p-3 rounded-md border">
            <input
                type="checkbox"
                id="isForSale"
                name="isForSale"
                checked={formData.isForSale}
                onChange={handleChange}
                className="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isForSale" className="font-medium text-neutral-700">
                Marcar como producto de venta al público
            </label>
        </div>

        {formData.isForSale && (
          <div>
              <h3 className="text-base font-medium text-neutral-800 mb-2">Precio de Venta (PVP)</h3>
              <div className="rounded-md border border-green-200 bg-white p-4">
                  <div className="flex flex-col gap-5">
                      
                      {/* Inputs Row - Stacked Vertically */}
                      <div className="flex flex-col gap-4">
                          <div className="w-full">
                              <Input
                                  label={`PVP Real (por ${formData.finalProductUnit})`}
                                  name="salePrice"
                                  type="number"
                                  step="any"
                                  value={formData.salePrice}
                                  onChange={handleChange}
                                  placeholder="0.00"
                                  className="block w-full rounded-md border font-bold text-green-900 border-green-300 focus:border-green-500 focus:ring-green-500 text-lg h-12 bg-white"
                                  containerClassName="w-full"
                              />
                          </div>
                          
                          <div className="w-full">
                              <label htmlFor="profitMargin" className="block text-sm font-medium text-neutral-900 mb-1">Margen Deseado</label>
                              <div className="relative rounded-md shadow-sm">
                                  <input
                                      type="number"
                                      name="profitMarginPercentage"
                                      id="profitMargin"
                                      step="any"
                                      value={formData.profitMarginPercentage}
                                      onChange={handleChange}
                                      className="block w-full rounded-md border border-neutral-300 pr-10 focus:border-primary-500 focus:ring-primary-500 text-lg h-12 bg-white text-neutral-900"
                                      placeholder="30"
                                  />
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                      <span className="text-neutral-500 sm:text-lg font-medium">%</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Calculations Display Row */}
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-green-100">
                          {/* Left: Info */}
                          <div className="col-span-2 sm:col-span-1 flex flex-col justify-center space-y-2">
                              <div className="flex justify-between items-baseline">
                                      <span className="text-sm text-neutral-600">Coste Unitario:</span>
                                      <span className="font-mono text-neutral-900 font-medium">{calculatedCosts.unitCost.toFixed(4)} €</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                      <span className="text-sm text-neutral-600">PVP Sugerido:</span>
                                      <span className="font-medium font-mono text-neutral-800">{calculatedCosts.suggestedPrice.toFixed(2)} €</span>
                              </div>
                              <div className="text-xs text-neutral-400 mt-1">
                                  (Target: {formData.profitMarginPercentage}%)
                              </div>
                          </div>

                          {/* Right: Result Box */}
                          <div className={`col-span-2 sm:col-span-1 p-3 rounded text-center border transition-colors flex flex-col justify-center ${
                              calculatedCosts.realMarginPercentage < (formData.profitMarginPercentage || 0) 
                              ? 'bg-amber-50 border-amber-200 text-amber-800' 
                              : 'bg-green-100 border-green-200 text-green-800'
                          }`}>
                              <span className="block text-xs uppercase tracking-wide font-semibold opacity-75 mb-0.5">Margen Real</span>
                              <div className="flex items-baseline justify-center gap-0.5">
                                  <span className="text-3xl font-bold font-mono tracking-tight">
                                      {calculatedCosts.realMarginPercentage > -999 ? calculatedCosts.realMarginPercentage.toFixed(1) : 0}
                                  </span>
                                  <span className="text-lg font-bold opacity-80">%</span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        )}

        <Input label="Etiquetas (separados por comas)" name="tags" placeholder="base, tarta, chocolate" value={formData.tags?.join(', ') || ''} onChange={handleTagsChange} />
        
        <div className="flex flex-col">
          <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
          <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3} className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"></textarea>
        </div>

        <div className="flex justify-end pt-4 space-x-2 border-t mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Receta</Button>
        </div>
      </form>

      <Modal 
        isOpen={isNewIngredientModalOpen} 
        onClose={() => setIsNewIngredientModalOpen(false)} 
        title="Crear Nueva Materia Prima"
      >
        <IngredientForm 
          ingredient={null} 
          onSave={handleSaveNewIngredient} 
          onClose={() => setIsNewIngredientModalOpen(false)} 
        />
      </Modal>
    </>
  );
}

export default RecipeForm;
