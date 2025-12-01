
import React from 'react';
import { Page } from '../../App';
import { FileText, Wheat, MessageSquare, Settings, Home } from 'lucide-react';

interface BottomNavBarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentPage, setCurrentPage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: Home },
    { id: 'recipes', label: 'Recetas', icon: FileText },
    { id: 'ingredients', label: 'Materias', icon: Wheat },
    { id: 'chat', label: 'Chef AI', icon: MessageSquare },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 md:hidden z-50">
      <nav>
        <ul className="flex h-16">
          {navItems.map((item) => (
            <li key={item.id} className="flex-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(item.id as Page);
                }}
                className={`flex flex-col items-center justify-center w-full h-full transition-colors duration-200 ${
                  currentPage === item.id ? 'text-primary-800 bg-primary-50' : 'text-neutral-500 hover:text-primary-600'
                }`}
              >
                <item.icon className="h-6 w-6" />
                <span className="text-[10px] mt-1 font-medium">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
};

export default BottomNavBar;
