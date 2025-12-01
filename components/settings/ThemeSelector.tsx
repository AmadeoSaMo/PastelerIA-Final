
import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { themes, Theme } from '../../utils/themes';
import { CheckCircle } from 'lucide-react';

const themeDetails = {
  natural: {
    name: 'Moderna y Natural',
    colors: ['#E2725B', '#FCE9E5', '#E7E5E4', '#57534E'],
  },
  gourmet: {
    name: 'Gourmet y Elegante',
    colors: ['#8D6E63', '#F5EFE6', '#D7CCC8', '#5D4037'],
  },
  tech: {
    name: 'Tecnológica y Confiable',
    colors: ['#60A5FA', '#EFF6FF', '#CBD5E1', '#475569'],
  },
};

const ThemeSelector: React.FC = () => {
  const { settings, setSettings } = useAppContext();

  const handleThemeChange = (theme: Theme) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
      <h2 className="text-xl font-semibold text-neutral-700 border-b pb-3 mb-4">
        Apariencia de la Aplicación
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {(Object.keys(themes) as Theme[]).map((themeKey) => {
          const isActive = settings.theme === themeKey;
          return (
            <button
              key={themeKey}
              onClick={() => handleThemeChange(themeKey)}
              className={`block text-left p-4 rounded-lg border-2 transition-all duration-200 relative ${
                isActive
                  ? 'border-primary-500 shadow-md scale-105'
                  : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
              }`}
            >
              {isActive && (
                <CheckCircle className="absolute top-2 right-2 h-6 w-6 text-white bg-primary-500 rounded-full p-0.5" />
              )}
              <p className="font-semibold text-neutral-800">
                {themeDetails[themeKey].name}
              </p>
              <div className="flex space-x-2 mt-3">
                {themeDetails[themeKey].colors.map((color, index) => (
                  <div
                    key={index}
                    className="h-8 w-full rounded"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
