
import React, { useState, useEffect, useMemo } from 'react';
import { Ingredient, IngredientType, Unit } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { UNIT_OPTIONS, ALLERGENS } from '../../constants';
import { useAppContext } from '../../context/AppContext';
import { Wheat, Shell, Egg, Fish, Nut, Bean, Milk, Leaf, Wine, Flower, Snail, CircleDot, Droplet, AlertTriangle } from 'lucide-react';

// Extracted outside to prevent re-creation on every render
const getAllergenIcon = (id: string) => {
    switch(id) {
        case 'gluten': return <Wheat size={24} strokeWidth={1.5} />;
        case 'crustaceans': return <Shell size={24} strokeWidth={1.5} />;
        case 'eggs': return <Egg size={24} strokeWidth={1.5} />;
        case 'fish': return <Fish size={24} strokeWidth={1.5} />;
        case 'peanuts': return <Nut size={24} strokeWidth={1.5} />; 
        case 'soy': return <Bean size={24} strokeWidth={1.5} />;
        case 'milk': return <Milk size={24} strokeWidth={1.5} />;
        case 'nuts': return <Nut size={24} strokeWidth={1.5} />; 
        case 'celery': return <Leaf size={24} strokeWidth={1.5} />;
        case 'mustard': return <Droplet size={24} strokeWidth={1.5} />; 
        case 'sesame': return <CircleDot size={24} strokeWidth={1.5} />; 
        case 'sulphites': return <Wine size={24} strokeWidth={1.5} />;
        case 'lupin': return <Flower size={24} strokeWidth={1.5} />;
        case 'molluscs': return <Snail size={24} strokeWidth={1.5} />;
        default: return <AlertTriangle size={24} strokeWidth={1.5} />;
    }
}

const IngredientForm: React.FC<{
  ingredient?: Ingredient | null;
  initialValues?: Partial<Ingredient> | null;
  onSave: (ingredient: Omit<Ingredient, 'id' | 'lastUpdated'> | Ingredient) => void;
  onClose: () => void;
}> = ({ ingredient, initialValues, onSave, onClose }) => {
  const { suppliers } = useAppContext();
  
  const getInitialState = () => ({
    name: '',
    unit: Unit.kg,
    costPerUnit: 0,
    supplierId: '',
    type: IngredientType.weight,
    purchasePrice: '',
    purchaseQuantity: '',
    purchaseUnit: Unit.kg,
    purchaseFormatName: '',
    allergens: [] as string[],
  });

  const [formData, setFormData] = useState(getInitialState());

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        unit: ingredient.unit,
        costPerUnit: ingredient.costPerUnit,
        supplierId: ingredient.supplierId || '',
        type: ingredient.type,
        purchasePrice: String(ingredient.purchasePrice || ''),
        purchaseQuantity: String(ingredient.purchaseQuantity || ''),
        purchaseUnit: ingredient.purchaseUnit || Unit.kg,
        purchaseFormatName: ingredient.purchaseFormatName || '',
        allergens: ingredient.allergens || [],
      });
    } else if (initialValues) {
       setFormData({
        name: initialValues.name || '',
        unit: initialValues.unit || Unit.kg,
        costPerUnit: initialValues.costPerUnit || 0,
        supplierId: initialValues.supplierId || '',
        type: initialValues.type || IngredientType.weight,
        purchasePrice: String(initialValues.purchasePrice || ''),
        purchaseQuantity: String(initialValues.purchaseQuantity || ''),
        purchaseUnit: initialValues.purchaseUnit || Unit.kg,
        purchaseFormatName: initialValues.purchaseFormatName || '',
        allergens: initialValues.allergens || [],
      });
    } else {
      setFormData(getInitialState());
    }
  }, [ingredient, initialValues]);
  
  // Calculate cost when purchase fields change
  useEffect(() => {
    const price = parseFloat(formData.purchasePrice);
    const quantity = parseFloat(formData.purchaseQuantity);
    const purchaseUnit = formData.purchaseUnit;

    if (isNaN(price) || isNaN(quantity) || quantity === 0) {
      return;
    }

    let costPerBase = 0;
    let baseUnit: Unit = Unit.kg;
    let ingredientType: IngredientType = IngredientType.weight;

    switch (purchaseUnit) {
      case Unit.g:
        costPerBase = (price / quantity) * 1000;
        baseUnit = Unit.kg;
        break;
      case Unit.kg:
        costPerBase = price / quantity;
        baseUnit = Unit.kg;
        break;
      case Unit.ml:
        costPerBase = (price / quantity) * 1000;
        baseUnit = Unit.L;
        break;
      case Unit.L:
        costPerBase = price / quantity;
        baseUnit = Unit.L;
        break;
      case Unit.unit:
        costPerBase = price / quantity;
        baseUnit = Unit.unit;
        ingredientType = IngredientType.unit;
        break;
    }

    if (isFinite(costPerBase)) {
        if (Math.abs(costPerBase - formData.costPerUnit) > 0.00001 || baseUnit !== formData.unit) {
            setFormData(prev => ({
                ...prev,
                costPerUnit: costPerBase,
                unit: baseUnit,
                type: ingredientType,
            }));
        }
    }

  }, [formData.purchasePrice, formData.purchaseQuantity, formData.purchaseUnit]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: string | number = value;
    
    if (name === 'purchasePrice' || name === 'purchaseQuantity' || name === 'costPerUnit') {
      processedValue = value.replace(',', '.');
    }
    
    if (name === 'costPerUnit') {
         setFormData(prev => ({ ...prev, costPerUnit: parseFloat(processedValue as string) || 0 }));
    } else {
         setFormData(prev => ({ ...prev, [name]: processedValue }));
    }
  }

  const toggleAllergen = (id: string) => {
    setFormData(prev => {
        const current = prev.allergens || [];
        if (current.includes(id)) {
            return { ...prev, allergens: current.filter(a => a !== id) };
        } else {
            return { ...prev, allergens: [...current, id] };
        }
    });
  }

  // Prevent accidental submit on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
      e.preventDefault();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        name: formData.name,
        unit: formData.unit,
        costPerUnit: formData.costPerUnit,
        type: formData.type,
        supplierId: formData.supplierId || undefined,
        purchasePrice: parseFloat(formData.purchasePrice) || undefined,
        purchaseQuantity: parseFloat(formData.purchaseQuantity) || undefined,
        purchaseUnit: formData.purchaseUnit as Unit,
        purchaseFormatName: formData.purchaseFormatName,
        allergens: formData.allergens,
    };
    if (ingredient) {
        onSave({ ...dataToSave, id: ingredient.id });
    } else {
        onSave(dataToSave as Omit<Ingredient, 'id' | 'lastUpdated'>);
    }
  };

  const supplierOptions = useMemo(() => [
      { value: '', label: 'Sin Proveedor' },
      ...suppliers.map(s => ({ value: s.id, label: s.name }))
  ], [suppliers]);
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6" onKeyDown={handleKeyDown}>
      <div className="space-y-4">
        <Input label="Nombre de la Materia Prima" name="name" value={formData.name} onChange={handleFormChange} required />
        <Select 
            label="Proveedor"
            name="supplierId"
            value={formData.supplierId}
            onChange={handleFormChange}
            options={supplierOptions}
        />
      </div>
      
      {/* Calculadora de Costes */}
      <div className="space-y-3 rounded-md border bg-neutral-50 p-4">
        <h3 className="text-sm font-semibold text-neutral-700">Opcional: Calculadora de Coste</h3>
        <p className="text-xs text-neutral-500 -mt-2">Si rellenas esto, el coste unitario se calculará solo.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input 
                label="Nombre del Formato" 
                name="purchaseFormatName"
                placeholder="Ej: Saco, Caja"
                value={formData.purchaseFormatName} 
                onChange={handleFormChange} 
            />
            <Input 
                label="Precio del Formato (€)" 
                name="purchasePrice"
                type="text" 
                inputMode="decimal"
                placeholder="Ej: 5.99"
                value={formData.purchasePrice} 
                onChange={handleFormChange} 
            />
             <Input 
                label="Cantidad del Formato" 
                name="purchaseQuantity"
                type="text" 
                inputMode="decimal"
                placeholder="Ej: 5"
                value={formData.purchaseQuantity} 
                onChange={handleFormChange} 
            />
            <Select 
                label="Unidad del Formato" 
                name="purchaseUnit"
                value={formData.purchaseUnit} 
                onChange={handleFormChange} 
                options={UNIT_OPTIONS} 
            />
        </div>
      </div>

      {/* Coste Final */}
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
             <div className="flex-grow">
                <label htmlFor="costPerUnit" className="block text-sm font-semibold text-blue-900 mb-1">Coste por Unidad de Almacén (€)</label>
                <Input
                    id="costPerUnit"
                    name="costPerUnit"
                    type="number"
                    step="any"
                    value={formData.costPerUnit || ''}
                    onChange={handleFormChange}
                    className="text-lg font-bold text-blue-900 bg-white border-blue-300 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="0.00"
                />
             </div>
             <div className="flex-shrink-0 min-w-[120px]">
                 <label htmlFor="unit" className="block text-sm font-medium text-blue-800 mb-1">Unidad Base</label>
                 <Select 
                    id="unit"
                    name="unit"
                    value={formData.unit} 
                    onChange={handleFormChange} 
                    options={UNIT_OPTIONS} 
                    className="bg-white border-blue-300"
                />
             </div>
        </div>
      </div>

      {/* Selector de Alérgenos Rediseñado */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-3">Alérgenos (14 Declaración Obligatoria)</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {ALLERGENS.map(allergen => {
                const isSelected = formData.allergens.includes(allergen.id);
                return (
                <button
                    key={allergen.id}
                    type="button"
                    onClick={() => toggleAllergen(allergen.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all h-24 ${
                        isSelected
                        ? 'bg-neutral-800 border-neutral-900 text-white shadow-md transform scale-105'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-800'
                    }`}
                >
                    <div className={`mb-1 ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                        {getAllergenIcon(allergen.id)}
                    </div>
                    <span className="text-[10px] leading-tight text-center break-words w-full px-1 font-medium">
                        {allergen.label}
                    </span>
                </button>
            )})}
        </div>
      </div>

       <div className="flex justify-end pt-4 space-x-2 border-t mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Guardar Materia Prima</Button>
        </div>
    </form>
  );
};

export default IngredientForm;
