import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import Button from '../ui/Button';
import Input from '../ui/Input';

const SupplierForm: React.FC<{
  supplier: Supplier | null;
  onSave: (supplier: Omit<Supplier, 'id'> | Supplier) => void;
  onClose: () => void;
}> = ({ supplier, onSave, onClose }) => {
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    contactName: '',
    officePhone: '',
    salesPhone: '',
    email: '',
    deliveryDays: [],
    notes: '',
  });

  const daysOfWeek = [
    { label: 'Lunes', value: 1 },
    { label: 'Martes', value: 2 },
    { label: 'Miércoles', value: 3 },
    { label: 'Jueves', value: 4 },
    { label: 'Viernes', value: 5 },
    { label: 'Sábado', value: 6 },
    { label: 'Domingo', value: 0 },
  ];

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactName: supplier.contactName || '',
        officePhone: supplier.officePhone || '',
        salesPhone: supplier.salesPhone || '',
        email: supplier.email || '',
        deliveryDays: supplier.deliveryDays || [],
        notes: supplier.notes || '',
      });
    } else {
      setFormData({
        name: '',
        contactName: '',
        officePhone: '',
        salesPhone: '',
        email: '',
        deliveryDays: [],
        notes: '',
      });
    }
  }, [supplier]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }
  
  const handleDeliveryDayChange = (dayValue: number, isChecked: boolean) => {
    setFormData(prev => {
        const currentDays = prev.deliveryDays || [];
        if (isChecked) {
            return { ...prev, deliveryDays: [...currentDays, dayValue] };
        } else {
            return { ...prev, deliveryDays: currentDays.filter(d => d !== dayValue) };
        }
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      name: formData.name,
      contactName: formData.contactName || undefined,
      officePhone: formData.officePhone || undefined,
      salesPhone: formData.salesPhone || undefined,
      email: formData.email || undefined,
      deliveryDays: formData.deliveryDays,
      notes: formData.notes || undefined,
    };
    
    if (supplier) {
      onSave({ ...dataToSave, id: supplier.id });
    } else {
      onSave(dataToSave);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre del Proveedor" name="name" value={formData.name} onChange={handleChange} required />
      <Input label="Persona de Contacto" name="contactName" value={formData.contactName} onChange={handleChange} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Teléfono (Oficina)" name="officePhone" type="tel" value={formData.officePhone} onChange={handleChange} />
        <Input label="Teléfono (Comercial)" name="salesPhone" type="tel" value={formData.salesPhone} onChange={handleChange} />
      </div>
      <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />

      <div>
          <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 mb-1">Notas Adicionales</label>
          <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Ej: Pedido mínimo, horarios de contacto, productos destacados..."
          ></textarea>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">Días de Reparto</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 rounded-md border bg-neutral-50 p-4">
            {daysOfWeek.map(day => (
                <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={(formData.deliveryDays || []).includes(day.value)}
                        onChange={(e) => handleDeliveryDayChange(day.value, e.target.checked)}
                        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{day.label}</span>
                </label>
            ))}
        </div>
      </div>
      
      <div className="flex justify-end pt-4 space-x-2 border-t mt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Guardar Proveedor</Button>
      </div>
    </form>
  );
};

export default SupplierForm;