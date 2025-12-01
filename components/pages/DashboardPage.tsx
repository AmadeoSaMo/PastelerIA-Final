
import React, { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { calculateAllRecipeCosts } from '../../utils/recipeCalculations';
import { FileText, Wheat, Truck, AlertTriangle, Plus, MessageSquare, ArrowRight, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Page } from '../../App';

interface DashboardPageProps {
  onNavigate: (page: Page) => void;
  onOpenNewRecipe: () => void;
  onOpenNewIngredient: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onOpenNewRecipe, onOpenNewIngredient }) => {
  const { recipes, ingredients, suppliers, businessProfile } = useAppContext();

  // Cálculos en tiempo real para el dashboard
  const stats = useMemo(() => {
    const processedRecipes = calculateAllRecipeCosts(recipes, ingredients);
    
    // 1. Recetas con margen bajo REAL
    // Filtramos recetas que están a la venta, tienen precio, y cuyo margen REAL es inferior al margen DESEADO (o 30% por defecto)
    const lowMarginRecipes = processedRecipes.filter(r => {
        // Solo analizamos recetas marcadas "A la venta" y con un precio definido
        if (!r.isForSale || !r.salePrice) return false;
        
        const targetMargin = r.profitMarginPercentage ?? 30;
        
        // Si no se puede calcular el margen real, no alertamos
        if (r.realMarginPercentage === undefined) return false;

        // Comprobamos si el margen real está por debajo del objetivo
        return r.realMarginPercentage < targetMargin;
    });

    // 2. Ingredientes más caros (normalizados a coste por kg/L para comparar)
    const topExpensiveIngredients = [...ingredients]
      .sort((a, b) => {
        return b.costPerUnit - a.costPerUnit;
      })
      .slice(0, 5);

    return {
      totalRecipes: recipes.length,
      totalIngredients: ingredients.length,
      totalSuppliers: suppliers.length,
      lowMarginRecipes,
      topExpensiveIngredients,
    };
  }, [recipes, ingredients, suppliers]);

  const hasLowMarginRecipes = stats.lowMarginRecipes.length > 0;
  // Detect if any recipe is critically losing money (Sale Price < Cost)
  const hasCriticalRecipes = stats.lowMarginRecipes.some(r => (r.salePrice || 0) < r.unitCost);

  return (
    <div className="container mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-800 font-serif">
          Hola, {businessProfile.name || 'Chef'}
        </h1>
        <p className="text-neutral-500 mt-1">
          Aquí tienes un resumen de la rentabilidad de tu obrador hoy.
        </p>
      </div>

      {/* 1. SECCIÓN DE ALERTAS (PRIORIDAD ALTA) */}
      <div className="mb-8">
        <div className={`bg-white rounded-xl shadow-sm border ${
            hasCriticalRecipes ? 'border-red-500 ring-2 ring-red-500' : 
            hasLowMarginRecipes ? 'border-amber-300' : 
            'border-green-200'} overflow-hidden`}>
            
            <div className={`p-5 border-b flex justify-between items-center ${
                hasCriticalRecipes ? 'bg-red-100 border-red-200' : 
                hasLowMarginRecipes ? 'bg-amber-50 border-amber-200' : 
                'bg-green-50 border-green-100'
            }`}>
                <h3 className={`font-semibold flex items-center ${
                    hasCriticalRecipes ? 'text-red-800' : 
                    hasLowMarginRecipes ? 'text-amber-900' : 
                    'text-green-900'
                }`}>
                    {hasLowMarginRecipes ? (
                        <>
                            <AlertTriangle className={`mr-2 h-6 w-6 ${hasCriticalRecipes ? 'text-red-600' : 'text-amber-600'}`} />
                            <span className={hasCriticalRecipes ? 'font-bold uppercase tracking-wide' : ''}>
                                {hasCriticalRecipes ? '¡ALERTA CRÍTICA: PIERDES DINERO!' : `Atención: Margen Bajo (${stats.lowMarginRecipes.length})`}
                            </span>
                        </>
                    ) : (
                        <>
                            <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                            Rentabilidad Saludable
                        </>
                    )}
                </h3>
                {hasLowMarginRecipes && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-md border ${
                        hasCriticalRecipes ? 'bg-red-200 text-red-900 border-red-300' : 'bg-white/50 text-amber-800 border-amber-200'
                    }`}>
                        {hasCriticalRecipes ? 'Revisar Urgentemente' : 'Margen Real < Objetivo'}
                    </span>
                )}
            </div>
            <div className="p-0">
                {hasLowMarginRecipes ? (
                    <div className="divide-y divide-neutral-100">
                        {stats.lowMarginRecipes.slice(0, 5).map(recipe => {
                            const isLosingMoney = (recipe.salePrice || 0) < recipe.unitCost;
                            return (
                            <div key={recipe.id} className="p-4 flex justify-between items-center hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => onNavigate('recipes')}>
                                <div>
                                    <p className="font-medium text-neutral-800">{recipe.name}</p>
                                    <p className="text-sm text-neutral-500">Coste: {recipe.unitCost.toFixed(2)}€</p>
                                </div>
                                <div className="text-right">
                                    {isLosingMoney ? (
                                        <div className="flex flex-col items-end">
                                            <span className="inline-flex items-center px-2 py-1 rounded bg-red-600 text-white border border-red-700 text-xs font-black uppercase tracking-wide shadow-sm animate-pulse">
                                                <AlertTriangle size={12} className="mr-1" />
                                                ¡PIERDES DINERO!
                                            </span>
                                            <span className="text-xs text-red-600 font-bold mt-1">
                                                Margen: {recipe.realMarginPercentage?.toFixed(1)}%
                                            </span>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-bold text-amber-600">{recipe.realMarginPercentage?.toFixed(1)}%</p>
                                            <p className="text-xs text-neutral-400">Objetivo: {recipe.profitMarginPercentage}%</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        )})}
                        {stats.lowMarginRecipes.length > 5 && (
                            <div className="p-3 text-center bg-neutral-50">
                                <button onClick={() => onNavigate('recipes')} className="text-sm text-primary-600 font-medium hover:underline">
                                    Ver todas ({stats.lowMarginRecipes.length})
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-neutral-500">
                        <p className="font-medium text-green-700">¡Buen trabajo!</p>
                        <p className="text-sm mt-1">Todas tus recetas a la venta cumplen con el margen deseado.</p>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 2. TARJETAS DE RESUMEN (STATS) - Clickables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div 
            onClick={() => onNavigate('recipes')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-primary-200 hover:-translate-y-0.5 transition-all group"
        >
            <div>
                <p className="text-sm font-medium text-neutral-500 mb-1 group-hover:text-primary-700 transition-colors">Total Recetas</p>
                <h3 className="text-2xl font-bold text-neutral-800">{stats.totalRecipes}</h3>
            </div>
            <div className="p-3 bg-primary-50 rounded-full text-primary-600 group-hover:bg-primary-100 transition-colors">
                <FileText size={24} />
            </div>
        </div>
        
        <div 
            onClick={() => onNavigate('ingredients')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all group"
        >
            <div>
                <p className="text-sm font-medium text-neutral-500 mb-1 group-hover:text-blue-700 transition-colors">Materias Primas</p>
                <h3 className="text-2xl font-bold text-neutral-800">{stats.totalIngredients}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-full text-blue-600 group-hover:bg-blue-100 transition-colors">
                <Wheat size={24} />
            </div>
        </div>

        <div 
            onClick={() => onNavigate('suppliers')}
            className="bg-white p-6 rounded-xl shadow-sm border border-neutral-100 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-green-200 hover:-translate-y-0.5 transition-all group"
        >
            <div>
                <p className="text-sm font-medium text-neutral-500 mb-1 group-hover:text-green-700 transition-colors">Proveedores</p>
                <h3 className="text-2xl font-bold text-neutral-800">{stats.totalSuppliers}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-full text-green-600 group-hover:bg-green-100 transition-colors">
                <Truck size={24} />
            </div>
        </div>
      </div>

      {/* 3. SECCIÓN INFERIOR: ACCESOS Y TOP COSTES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Accesos Rápidos */}
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
                <button 
                    onClick={onOpenNewRecipe}
                    className="flex flex-col justify-center p-6 bg-white border border-neutral-200 rounded-xl hover:shadow-md hover:border-primary-300 transition-all group text-left h-full"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-primary-50 text-primary-600 p-3 rounded-lg group-hover:bg-primary-600 group-hover:text-white transition-colors">
                            <Plus size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-800 group-hover:text-primary-700">Nueva Receta</h3>
                        <p className="text-sm text-neutral-500 mt-1">Crear un escandallo desde cero</p>
                    </div>
                </button>

                <button 
                    onClick={() => onNavigate('chat')}
                    className="flex flex-col justify-center p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all group text-left h-full"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-white/20 text-white p-3 rounded-lg group-hover:bg-white group-hover:text-primary-600 transition-colors">
                            <MessageSquare size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Consultar a Chef AI</h3>
                        <p className="text-sm text-primary-100 mt-1">Ayuda con precios o ideas</p>
                    </div>
                </button>
            </div>
        </div>

        {/* Columna Derecha: Top Costes */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-neutral-100 bg-neutral-50">
                <h3 className="font-semibold text-neutral-800">Materias Primas más Caras</h3>
                <p className="text-xs text-neutral-500 mt-1">Vigila estos ingredientes</p>
            </div>
            <div className="p-0 flex-1">
                 {stats.topExpensiveIngredients.length > 0 ? (
                    <div className="divide-y divide-neutral-100">
                        {stats.topExpensiveIngredients.map(ing => (
                            <div key={ing.id} className="p-4 flex justify-between items-center hover:bg-neutral-50">
                                <div className="min-w-0">
                                    <p className="font-medium text-neutral-800 truncate">{ing.name}</p>
                                    <p className="text-xs text-neutral-500 truncate">{ing.purchaseFormatName || 'Formato estándar'}</p>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                    <p className="font-bold text-neutral-900">{ing.costPerUnit.toFixed(2)}€</p>
                                    <p className="text-xs text-neutral-400">/{ing.unit}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                 ) : (
                    <div className="p-6 text-center text-neutral-500">
                        <p>No hay ingredientes registrados aún.</p>
                        <Button variant="secondary" size="sm" onClick={onOpenNewIngredient} className="mt-4">
                            Añadir Materia
                        </Button>
                    </div>
                 )}
            </div>
            <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
                <button onClick={() => onNavigate('ingredients')} className="text-sm font-medium text-neutral-600 hover:text-primary-600 flex items-center justify-center">
                    Ver Inventario Completo <ArrowRight size={16} className="ml-1" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
