
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { Type } from 'lucide-react';

const FontSizeSettings: React.FC = () => {
  const { settings, setSettings } = useAppContext();

  const sizes: { id: 'normal' | 'medium' | 'large'; label: string; description: string }[] = [
    { id: 'normal', label: 'Normal', description: 'Tamaño estándar' },
    { id: 'medium', label: 'Mediana', description: 'Un poco más grande' },
    { id: 'large', label: 'Grande', description: 'Máxima legibilidad' },
  ];

  const handleSizeChange = (size: 'normal' | 'medium' | 'large') => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-700 border-b pb-3 mb-4 flex items-center">
        <Type className="mr-2 h-6 w-6 text-primary-500" />
        Tamaño del Texto
      </h2>
      <div className="flex flex-col sm:flex-row gap-4">
        {sizes.map((size) => (
          <button
            key={size.id}
            onClick={() => handleSizeChange(size.id)}
            className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center text-center ${
              settings.fontSize === size.id
                ? 'border-primary-500 bg-primary-50 text-neutral-900 shadow-sm'
                : 'border-neutral-200 hover:border-neutral-300 text-neutral-600'
            }`}
          >
            <span className={`font-bold mb-1 ${
                size.id === 'large' ? 'text-xl' : size.id === 'medium' ? 'text-lg' : 'text-base'
            }`}>
                Aa
            </span>
            <span className="font-medium">{size.label}</span>
            <span className="text-xs opacity-75">{size.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FontSizeSettings;
