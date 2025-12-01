
import React from 'react';
import { Page } from '../../App';
import { FileText, Wheat, MessageSquare, Truck, Settings, HelpCircle, Home } from 'lucide-react';
import Logo from '../ui/Logo';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'recipes', label: 'Recetas', icon: FileText },
    { id: 'ingredients', label: 'Materias primas', icon: Wheat },
    { id: 'suppliers', label: 'Proveedores', icon: Truck },
    { id: 'chat', label: 'Chef AI', icon: MessageSquare },
    { id: 'settings', label: 'Configuración', icon: Settings },
    { id: 'help', label: 'Ayuda', icon: HelpCircle },
  ];

  return (
    <header className="hidden md:flex bg-white shadow-md h-full w-64 flex-shrink-0 flex-col z-10 relative">
      <div className="flex h-20 items-center justify-center px-4 border-b-2 border-neutral-200">
        <Logo className="h-16 w-auto" />
      </div>
      <nav className="flex-1">
        <ul className="flex flex-col items-stretch justify-start mt-6">
          {navItems.map((item) => (
            <li key={item.id} className="my-2 px-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(item.id as Page);
                }}
                className={`flex h-12 flex-row items-center justify-start rounded-lg transition-colors duration-200 ${
                  currentPage === item.id
                    ? 'bg-primary-100 text-primary-800 font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-800'
                }`}
              >
                <div className="flex items-center justify-center w-12">
                   <item.icon className="h-6 w-6" />
                </div>
                <span className="ml-3 text-base">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Sidebar;
