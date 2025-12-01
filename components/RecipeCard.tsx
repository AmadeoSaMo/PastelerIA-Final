
import React from 'react';
import { Recipe } from '../types';
import { Edit, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { ProcessedRecipe } from '../utils/recipeCalculations';
import Button from './ui/Button';
import { ALLERGENS } from '../constants';

interface RecipeCardProps {
    recipe: ProcessedRecipe;
    onEdit: (recipe: Recipe) => void;
    onDelete: (id: string) => void;
    onPrint: (recipe: ProcessedRecipe) => void;
}

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, onEdit, onDelete, onPrint }) => {
    const { unitCost, totalCost, suggestedPrice, salePrice, realMarginPercentage, profitMarginPercentage, allergens, unitCostPerKg, unitCostPerL } = recipe;

    const isLosingMoney = salePrice && salePrice < unitCost;
    const isLowMargin = salePrice && realMarginPercentage !== undefined && realMarginPercentage < (profitMarginPercentage || 30);

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow flex flex-col">
            <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-neutral-800 truncate pr-2" title={recipe.name}>{recipe.name}</h2>
                    <button 
                        onClick={() => onDelete(recipe.id)} 
                        className="text-neutral-400 hover:text-red-600 transition-colors p-1" 
                        title="Eliminar Receta"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
                <p className="text-sm text-neutral-600 mb-4 h-10 overflow-hidden">{recipe.notes}</p>
                {recipe.tags && recipe.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {recipe.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-primary-100 text-primary-800 text-xs font-medium rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Allergens Display */}
                {allergens && allergens.length > 0 && (
                    <div className="mb-4 p-2 bg-neutral-50 rounded-md">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Alérgenos:</p>
                        <div className="flex flex-wrap gap-2">
                            {allergens.map(id => {
                                const allergen = ALLERGENS.find(a => a.id === id);
                                return allergen ? (
                                    <div key={id} className="flex items-center text-sm text-neutral-700 bg-white px-2 py-1 rounded border border-neutral-200" title={allergen.label}>
                                        <span className="mr-1">{allergen.icon}</span>
                                        <span className="text-xs">{allergen.label}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </div>
                )}

                <div className="space-y-3 text-sm mt-4 border-t pt-4">
                    <div className="flex justify-between">
                        <span className="font-semibold text-neutral-600">Coste Total Receta:</span>
                        <span className="font-bold text-neutral-900">{totalCost.toFixed(2)} €</span>
                    </div>

                    <div>
                        <div className="flex justify-between">
                            <span className="font-semibold text-neutral-600">Coste por {recipe.finalProductUnit}:</span>
                            <span className="font-bold text-neutral-900">{unitCost.toFixed(4)} €</span>
                        </div>
                        {(unitCostPerKg !== undefined || unitCostPerL !== undefined) && (
                             <div className="flex justify-between mt-1 text-neutral-700">
                                <span className="font-semibold">
                                    Coste por {unitCostPerKg !== undefined ? 'kg' : 'L'}:
                                </span>
                                <span className="font-bold text-neutral-900">
                                    {(unitCostPerKg ?? unitCostPerL)?.toFixed(2)} €
                                </span>
                            </div>
                        )}
                    </div>

                    {recipe.isForSale && (
                        <div className={`p-2 rounded-md mt-2 ${isLosingMoney ? 'bg-red-50 border border-red-100' : 'bg-green-50'}`}>
                            {/* Suggested Price (Small) */}
                            <div className="flex justify-between text-xs mb-2 opacity-75">
                                <span className={isLosingMoney ? "text-red-700" : "text-green-700"}>PVP Sugerido:</span>
                                <span className={isLosingMoney ? "text-red-700" : "text-green-700"}>{suggestedPrice.toFixed(2)} €</span>
                            </div>

                            {/* Real Sale Price (Highlighted) */}
                            {salePrice ? (
                                <>
                                    <div className="flex justify-between items-baseline border-t border-black/5 pt-2">
                                        <span className={`font-bold ${isLosingMoney ? 'text-red-800' : 'text-green-900'}`}>
                                            PVP Real:
                                        </span>
                                        <span className={`font-bold text-lg ${isLosingMoney ? 'text-red-800' : 'text-green-900'}`}>
                                            {salePrice.toFixed(2)} €
                                        </span>
                                    </div>
                                    
                                    {/* Warnings - BIGGER AND BOLDER */}
                                    {isLosingMoney && (
                                        <div className="mt-3 bg-red-100 border-2 border-red-400 rounded-lg p-3 text-center shadow-sm animate-pulse">
                                            <div className="flex items-center justify-center text-red-700 font-black text-lg uppercase tracking-wide">
                                                <AlertTriangle size={24} className="mr-2" />
                                                ¡PIERDES DINERO!
                                            </div>
                                            <div className="text-red-800 font-bold text-sm mt-1">
                                                Pierdes {(unitCost - salePrice).toFixed(2)} € en cada venta
                                            </div>
                                        </div>
                                    )}
                                    {!isLosingMoney && isLowMargin && (
                                        <div className="mt-3 bg-amber-100 border-2 border-amber-300 rounded-lg p-2 text-center shadow-sm">
                                            <div className="flex items-center justify-center text-amber-800 font-bold text-base uppercase">
                                                <AlertTriangle size={20} className="mr-2" />
                                                ⚠️ Margen Bajo
                                            </div>
                                            <div className="text-amber-900 font-medium text-sm mt-1">
                                                Estás ganando un {realMarginPercentage?.toFixed(1)}%
                                                <br/>
                                                <span className="text-xs font-normal opacity-80">(Objetivo: {profitMarginPercentage || 30}%)</span>
                                            </div>
                                        </div>
                                    )}
                                    {!isLosingMoney && !isLowMargin && (
                                        <div className="mt-1 text-right text-xs text-green-700 font-bold">
                                            ¡Margen Saludable! ({realMarginPercentage?.toFixed(1)}%)
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-xs text-center text-neutral-500 italic mt-1">
                                    Sin precio de venta asignado
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
             <div className="p-3 bg-neutral-50 rounded-b-lg mt-auto flex gap-2 border-t border-neutral-100">
                <Button onClick={() => onEdit(recipe)} variant="secondary" className="flex-1 text-sm font-medium" title="Editar">
                    <Edit size={18} className="mr-2" /> Editar
                </Button>
                <Button onClick={() => onPrint(recipe)} className="flex-1 text-sm font-medium" title="Ver y Escalar">
                    <Eye size={18} className="mr-2" /> Ver y Escalar
                </Button>
            </div>
        </div>
    );
};

export default RecipeCard;
