
import React, { useState } from 'react';
import ThemeSelector from '../settings/ThemeSelector';
import BusinessProfileSettings from '../settings/BusinessProfileSettings';
import DataManagementSettings from '../settings/DataManagementSettings';
import FontSizeSettings from '../settings/FontSizeSettings';
import { ChevronDown, ChevronUp, Store, Type, Palette, Database } from 'lucide-react';

type SettingSection = 'profile' | 'font' | 'theme' | 'data';

const SettingsPage: React.FC = () => {
  const [openSection, setOpenSection] = useState<SettingSection | null>('profile');

  const toggleSection = (section: SettingSection) => {
    if (openSection === section) {
      setOpenSection(null);
    } else {
      setOpenSection(section);
    }
  };

  const sections = [
    {
      id: 'profile' as SettingSection,
      title: 'Perfil del Negocio',
      description: 'Nombre, dirección y datos de contacto para tus informes.',
      icon: Store,
      component: <BusinessProfileSettings />
    },
    {
      id: 'font' as SettingSection,
      title: 'Tamaño del Texto',
      description: 'Ajusta el tamaño de la letra para mejorar la legibilidad.',
      icon: Type,
      component: <FontSizeSettings />
    },
    {
      id: 'theme' as SettingSection,
      title: 'Apariencia y Colores',
      description: 'Personaliza los colores de la aplicación.',
      icon: Palette,
      component: <ThemeSelector />
    },
    {
      id: 'data' as SettingSection,
      title: 'Copias de Seguridad',
      description: 'Exporta e importa tus datos para no perder nada.',
      icon: Database,
      component: <DataManagementSettings />
    }
  ];

  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-neutral-800">Configuración</h1>
        <p className="text-neutral-500 mt-1">
          Gestiona las preferencias de tu pastelería.
        </p>
      </div>

      <div className="space-y-4">
        {sections.map((section) => {
          const isOpen = openSection === section.id;
          const Icon = section.icon;

          return (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between p-4 md:p-6 transition-colors duration-200 ${
                  isOpen ? 'bg-neutral-50 border-b border-neutral-100' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-4 text-left">
                  <div className={`p-3 rounded-full ${isOpen ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-500'}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-800">{section.title}</h2>
                    <p className="text-sm text-neutral-500 hidden sm:block">{section.description}</p>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-neutral-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-400" />
                )}
              </button>
              
              {isOpen && (
                <div className="p-4 md:p-6 bg-neutral-50/50 animate-in slide-in-from-top-2 duration-200">
                    {section.component}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-12 pt-8 border-t border-neutral-200 text-center">
        <p className="text-xs text-neutral-400 font-mono">
            PastelerIA v1.0.3 Beta • Build 2024.10.30
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
