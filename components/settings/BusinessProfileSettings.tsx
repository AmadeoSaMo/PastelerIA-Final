
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Store } from 'lucide-react';

const BusinessProfileSettings: React.FC = () => {
  const { businessProfile, setBusinessProfile } = useAppContext();
  const [formData, setFormData] = useState(businessProfile);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setFormData(businessProfile);
  }, [businessProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-700 border-b pb-3 mb-4 flex items-center">
        <Store className="mr-2 h-6 w-6 text-primary-500" />
        Perfil de la Pastelería
      </h2>
      <p className="text-sm text-neutral-500 mb-6">
        Estos datos aparecerán en la cabecera de los informes PDF que generes (recetas y escalados).
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Nombre del Negocio" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          placeholder="Ej: Pastelería Delicias" 
          required
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
            label="NIF / CIF" 
            name="taxId" 
            value={formData.taxId || ''} 
            onChange={handleChange} 
            placeholder="Ej: B12345678"
            />
            <Input 
            label="Teléfono" 
            name="phone" 
            value={formData.phone || ''} 
            onChange={handleChange} 
            placeholder="Ej: 91 555 55 55"
            />
        </div>

        <Input 
          label="Dirección Completa" 
          name="address" 
          value={formData.address || ''} 
          onChange={handleChange} 
          placeholder="Calle Ejemplo 123, 28000 Madrid"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
            label="Email" 
            name="email" 
            type="email"
            value={formData.email || ''} 
            onChange={handleChange} 
            placeholder="contacto@mipasteleria.com"
            />
            <Input 
            label="Sitio Web" 
            name="website" 
            value={formData.website || ''} 
            onChange={handleChange} 
            placeholder="www.mipasteleria.com"
            />
        </div>

        <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSaved} className={isSaved ? "bg-green-600 hover:bg-green-700" : ""}>
                {isSaved ? '¡Guardado Correctamente!' : 'Guardar Cambios'}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfileSettings;
