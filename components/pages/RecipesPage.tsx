import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Search, Download, SlidersHorizontal } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Modal from '../ui/Modal';
import { Recipe } from '../../types';
import RecipeForm from '../forms/RecipeForm';
import RecipeCard from '../RecipeCard';
import { calculateAllRecipeCosts, exportRecipesToCSV, ProcessedRecipe, RecipeScaffold } from '../../utils/recipeCalculations';


interface RecipesPageProps {
  onPrintRecipe: (recipe: ProcessedRecipe) => void;
  recipeScaffold: RecipeScaffold | null;
  clearRecipeScaffold: () => void;
}

const RecipesPage: React.FC<RecipesPageProps> = ({ onPrintRecipe, recipeScaffold, clearRecipeScaffold }) => {
  const { recipes, ingredients, addRecipe, updateRecipe, deleteRecipe } = useAppContext();
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

  useEffect(() => {
    if (recipeScaffold) {
      const scaffoldAsRecipe = {
        ...recipeScaffold,
        id: '',
        subRecipes: [],
        finalProductCount: 1,
        wastePercentage: 0,
        elaborationCostPercentage: 0,
        bakingCostPercentage: 0,
        profitMarginPercentage: 30,
        ingredients: recipeScaffold.ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ingredients.find(i => i.id === ing.ingredientId)?.unit || 'g'
        })),
      }
      handleOpenModal(scaffoldAsRecipe as Recipe);
      clearRecipeScaffold();
    }
  }, [recipeScaffold, clearRecipeScaffold, ingredients]);

  const handleOpenModal = (recipe: Recipe | null = null) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingRecipe(null);
    setIsModalOpen(false);
  };

  const handleSaveRecipe = (recipeData: Omit<Recipe, 'id'> | Recipe) => {
    if ('id' in recipeData && recipeData.id) {
      updateRecipe(recipeData as Recipe);
    } else {
      addRecipe(recipeData as Omit<Recipe, 'id'>);
    }
    handleCloseModal();
  };
  
  const handleDeleteRecipe = (id: string) => {
    if(window.confirm('¿Estás seguro de que quieres eliminar esta receta? También se eliminará de cualquier otra receta que la use como sub-receta.')) {
        deleteRecipe(id);
    }
  }

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const recipesWithCost = useMemo(() => calculateAllRecipeCosts(recipes, ingredients), [recipes, ingredients]);

  const processedRecipes = useMemo(() => {
    const filtered = recipesWithCost.filter(recipe => {
        const query = searchQuery.toLowerCase();
        return query === '' ||
            recipe.name.toLowerCase().includes(query) ||
            recipe.notes.toLowerCase().includes(query) ||
            (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query)));
    });

    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'cost-asc':
                return a.unitCost - b.unitCost;
            case 'cost-desc':
                return b.unitCost - a.unitCost;
            case 'name-asc':
            default:
                return a.name.localeCompare(b.name);
        }
    });

    return sorted;
  }, [recipesWithCost, searchQuery, sortBy]);

  return (
    <div className="container mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-neutral-800">Mis Recetas</h1>
        <div className="flex gap-2">
            <Button onClick={() => setFiltersVisible(!filtersVisible)} variant="secondary" size="sm" className="!p-2">
                <SlidersHorizontal className="h-5 w-5" />
            </Button>
            <Button onClick={() => handleOpenModal()} size="sm" className="!p-2">
              <Plus className="h-5 w-5" />
            </Button>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-6 gap-2 flex-wrap">
        <h1 className="text-3xl font-bold text-neutral-800">Mis Recetas</h1>
        <div className="flex gap-2">
            <Button onClick={() => exportRecipesToCSV(processedRecipes)} variant="secondary">
              <Download className="mr-2 h-5 w-5" />
              Exportar a CSV
            </Button>
            <Button onClick={() => handleOpenModal()}>
              <Plus className="mr-2 h-5 w-5" />
              Crear Receta
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={`${filtersVisible ? 'block' : 'hidden'} md:block mb-6 p-4 bg-white rounded-lg shadow-sm border border-neutral-200`}>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-grow flex items-end gap-2">
            <Input
              label="Buscar Receta"
              id="search"
              placeholder="Nombre, notas, tag..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={handleKeyPress}
              containerClassName="w-full"
            />
            <Button onClick={handleSearch} className="flex-shrink-0">Buscar</Button>
          </div>
          <Select
            label="Ordenar Por"
            id="sort-by"
            options={[
              { value: 'name-asc', label: 'Nombre (A-Z)' },
              { value: 'name-desc', label: 'Nombre (Z-A)' },
              { value: 'cost-asc', label: 'Coste (Bajo > Alto)' },
              { value: 'cost-desc', label: 'Coste (Alto > Bajo)' },
            ]}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            containerClassName="w-full md:w-auto md:min-w-[200px]"
          />
        </div>
      </div>

      {processedRecipes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedRecipes.map(recipe => (
              <RecipeCard 
                key={recipe.id}
                recipe={recipe}
                onEdit={handleOpenModal}
                onDelete={handleDeleteRecipe}
                onPrint={onPrintRecipe}
              />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Search className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No se encontraron recetas</h3>
            <p className="mt-1 text-sm text-neutral-500">
                 {searchQuery ? 'Intenta ajustar tu búsqueda o filtros.' : 'Empieza creando tu primera receta.'}
            </p>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingRecipe?.id ? 'Editar Receta' : 'Crear Nueva Receta'}
      >
        <RecipeForm recipe={editingRecipe} onSave={handleSaveRecipe} onClose={handleCloseModal} />
      </Modal>

    </div>
  );
};

export default RecipesPage;