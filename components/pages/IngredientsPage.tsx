
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Ingredient } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus, Edit, Trash2, SlidersHorizontal, Search } from 'lucide-react';
import IngredientForm from '../forms/IngredientForm';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { ALLERGENS } from '../../constants';


interface IngredientsPageProps {
    ingredientScaffold?: Partial<Ingredient> | null;
    clearIngredientScaffold?: () => void;
}

// Extracted for performance
const AllergenIcons = ({ allergens }: { allergens?: string[] }) => {
    if (!allergens || allergens.length === 0) return null;
    // Show first 3, then +X
    const visible = allergens.slice(0, 3);
    const remaining = allergens.length - 3;

    return (
        <div className="flex items-center gap-1 mt-1">
            {visible.map(id => {
                const allergen = ALLERGENS.find(a => a.id === id);
                return allergen ? <span key={id} title={allergen.label} className="text-base cursor-help">{allergen.icon}</span> : null;
            })}
            {remaining > 0 && <span className="text-xs text-neutral-500 bg-neutral-100 rounded px-1">+{remaining}</span>}
        </div>
    );
};

const IngredientsPage: React.FC<IngredientsPageProps> = ({ ingredientScaffold, clearIngredientScaffold }) => {
  const { ingredients, addIngredient, updateIngredient, deleteIngredient, suppliers } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Handle incoming scaffold from AI
  useEffect(() => {
      if (ingredientScaffold) {
          setEditingIngredient(null);
          setIsModalOpen(true);
      }
  }, [ingredientScaffold]);

  const handleOpenModal = (ingredient: Ingredient | null = null) => {
    setEditingIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingIngredient(null);
    setIsModalOpen(false);
    if (clearIngredientScaffold) clearIngredientScaffold();
  };

  const handleSave = (ingredientData: Omit<Ingredient, 'id' | 'lastUpdated'> | Ingredient) => {
    if ('id' in ingredientData) {
      updateIngredient(ingredientData);
    } else {
      addIngredient(ingredientData);
    }
    handleCloseModal();
  };
  
  const handleDelete = (id: string) => {
    if(window.confirm('¿Estás seguro de que quieres eliminar esta materia prima?')) {
        deleteIngredient(id);
    }
  }

  const supplierOptions = useMemo(() => [
    { value: '', label: 'Todos los Proveedores' },
    ...suppliers.map(s => ({ value: s.id, label: s.name }))
  ], [suppliers]);

  const processedIngredients = useMemo(() => {
    let filtered = [...ingredients];

    if (searchQuery) {
        filtered = filtered.filter(ing => 
            ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }

    if (selectedSupplier) {
        filtered = filtered.filter(ing => ing.supplierId === selectedSupplier);
    }

    return filtered.sort((a, b) => {
        switch (sortBy) {
            case 'name-desc':
                return b.name.localeCompare(a.name);
            case 'cost-asc':
                return a.costPerUnit - b.costPerUnit;
            case 'cost-desc':
                return b.costPerUnit - a.costPerUnit;
            case 'name-asc':
            default:
                return a.name.localeCompare(b.name);
        }
    });
  }, [ingredients, searchQuery, selectedSupplier, sortBy]);

  return (
    <div className="container mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-neutral-800">Materias Primas</h1>
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
      <div className="hidden md:flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-neutral-800">Gestión de Materias Primas</h1>
        <Button onClick={() => handleOpenModal()}>
            <Plus className="mr-2 h-5 w-5" />
            Añadir Materia Prima
        </Button>
      </div>

      {/* Filters */}
      <div className={`${filtersVisible ? 'block' : 'hidden'} md:block mb-6 p-4 bg-white rounded-lg shadow-sm border border-neutral-200`}>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <Input
            label="Buscar por Nombre"
            id="search"
            placeholder="Ej: Harina, Azúcar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            containerClassName="w-full md:w-1/3"
          />
          <Select
            label="Filtrar por Proveedor"
            id="filter-supplier"
            options={supplierOptions}
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            containerClassName="w-full md:w-1/3"
          />
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
            containerClassName="w-full md:w-1/3"
          />
        </div>
      </div>
      
      {processedIngredients.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Coste</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Proveedor</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Última Actualización</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {processedIngredients.map(ingredient => {
                    const supplierName = suppliers.find(s => s.id === ingredient.supplierId)?.name || 'N/A';
                    return (
                      <tr key={ingredient.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-neutral-900">{ingredient.name}</div>
                          <AllergenIcons allergens={ingredient.allergens} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-900">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(ingredient.costPerUnit)} / {ingredient.unit}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-neutral-500">{supplierName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                          {new Date(ingredient.lastUpdated).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button onClick={() => handleOpenModal(ingredient)} className="text-primary-600 hover:text-primary-800 mr-4"><Edit size={20} /></button>
                          <button onClick={() => handleDelete(ingredient.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {processedIngredients.map(ingredient => {
              const supplierName = suppliers.find(s => s.id === ingredient.supplierId)?.name || 'N/A';
              return (
                <div key={ingredient.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-neutral-800">{ingredient.name}</p>
                      <AllergenIcons allergens={ingredient.allergens} />
                      <p className="text-sm text-neutral-600 mt-1">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(ingredient.costPerUnit)} / {ingredient.unit}</p>
                    </div>
                     <div className="flex space-x-3">
                      <button onClick={() => handleOpenModal(ingredient)} className="text-primary-600 hover:text-primary-800"><Edit size={20} /></button>
                      <button onClick={() => handleDelete(ingredient.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                    <p>Proveedor: <span className="font-medium text-neutral-600">{supplierName}</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
            <Search className="mx-auto h-12 w-12 text-neutral-400" />
            <h3 className="mt-2 text-sm font-medium text-neutral-900">No se encontraron materias primas</h3>
            <p className="mt-1 text-sm text-neutral-500">
                 Intenta ajustar tu búsqueda o filtros.
            </p>
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingIngredient ? 'Editar Materia Prima' : 'Añadir Nueva Materia Prima'}
      >
        <IngredientForm 
            ingredient={editingIngredient} 
            initialValues={ingredientScaffold}
            onSave={handleSave} 
            onClose={handleCloseModal} 
        />
      </Modal>
    </div>
  );
};

export default IngredientsPage;
