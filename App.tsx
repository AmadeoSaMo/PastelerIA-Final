
import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import IngredientsPage from './components/pages/IngredientsPage';
import RecipesPage from './components/pages/RecipesPage';
import ChatPage from './components/pages/ChatPage';
import SuppliersPage from './components/pages/SuppliersPage';
import SettingsPage from './components/pages/SettingsPage';
import HelpPage from './components/pages/HelpPage';
import DashboardPage from './components/pages/DashboardPage';
import { AppProvider, useAppContext } from './context/AppContext';
import RecipePrintView from './components/pages/RecipePrintView';
import { ProcessedRecipe, RecipeScaffold } from './utils/recipeCalculations';
import BottomNavBar from './components/layout/BottomNavBar';
import { themes } from './utils/themes';
import { Ingredient } from './types';
import Modal from './components/ui/Modal';
import RecipeForm from './components/forms/RecipeForm';
import IngredientForm from './components/forms/IngredientForm';

export type Page = 'dashboard' | 'recipes' | 'ingredients' | 'suppliers' | 'chat' | 'settings' | 'help';

const AppContent: React.FC = () => {
  const { settings, addRecipe, addIngredient } = useAppContext();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [recipeToPrint, setRecipeToPrint] = useState<ProcessedRecipe | null>(null);
  const [recipeScaffold, setRecipeScaffold] = useState<RecipeScaffold | null>(null);
  const [ingredientScaffold, setIngredientScaffold] = useState<Partial<Ingredient> | null>(null);

  // Global Modals for Quick Actions from Dashboard
  const [isQuickRecipeModalOpen, setIsQuickRecipeModalOpen] = useState(false);
  const [isQuickIngredientModalOpen, setIsQuickIngredientModalOpen] = useState(false);

  useEffect(() => {
    const theme = themes[settings.theme];
    const root = document.documentElement;
    Object.keys(theme).forEach((key) => {
      root.style.setProperty(key, theme[key as keyof typeof theme]);
    });
    
    const favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (favicon) {
      const primary500 = theme['--color-primary-500'].replace('#', '%23');
      const primary100 = theme['--color-primary-100'].replace('#', '%23');
      const newFaviconUrl = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'%3e%3cpath d='M 20,50 C 0,50 0,30 20,30 C 30,10 70,10 80,30 C 100,30 100,50 80,50 Z' fill='white' stroke='${primary500}' stroke-width='3' stroke-linejoin='round' /%3e%3crect x='20' y='50' width='60' height='20' rx='3' fill='${primary500}'/%3e%3cpath d='M 50,28 L 52,33 L 57,35 L 52,37 L 50,42 L 48,37 L 43,35 L 48,33 Z' fill='${primary100}' /%3e%3c/svg%3e`;
      favicon.href = newFaviconUrl;
    }
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    switch (settings.fontSize) {
      case 'large':
        root.style.fontSize = '125%';
        break;
      case 'medium':
        root.style.fontSize = '110%';
        break;
      case 'normal':
      default:
        root.style.fontSize = '100%';
        break;
    }
  }, [settings.fontSize]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pageFromUrl = urlParams.get('page');
    if (['dashboard', 'recipes', 'ingredients', 'suppliers', 'chat', 'settings', 'help'].includes(pageFromUrl || '')) {
      setCurrentPage(pageFromUrl as Page);
    }
  }, []);

  const handlePrintRecipe = (recipe: ProcessedRecipe) => {
    setRecipeToPrint(recipe);
  };

  const handleClosePrintView = () => {
    setRecipeToPrint(null);
  };

  const handleScaffoldRecipe = (scaffold: RecipeScaffold) => {
    setRecipeScaffold(scaffold);
    setCurrentPage('recipes');
  };

  const clearRecipeScaffold = () => {
    setRecipeScaffold(null);
  };

  const handleScaffoldIngredient = (scaffold: Partial<Ingredient>) => {
    setIngredientScaffold(scaffold);
    setCurrentPage('ingredients');
  };

  const clearIngredientScaffold = () => {
    setIngredientScaffold(null);
  };

  // Quick Action Handlers
  const handleQuickSaveRecipe = (recipeData: any) => {
      addRecipe(recipeData);
      setIsQuickRecipeModalOpen(false);
      setCurrentPage('recipes');
  };

  const handleQuickSaveIngredient = (ingredientData: any) => {
      addIngredient(ingredientData);
      setIsQuickIngredientModalOpen(false);
      setCurrentPage('ingredients');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage 
            onNavigate={setCurrentPage} 
            onOpenNewRecipe={() => setIsQuickRecipeModalOpen(true)}
            onOpenNewIngredient={() => setIsQuickIngredientModalOpen(true)}
        />;
      case 'ingredients':
        return <IngredientsPage ingredientScaffold={ingredientScaffold} clearIngredientScaffold={clearIngredientScaffold} />;
      case 'suppliers':
        return <SuppliersPage />;
      case 'chat':
        return <ChatPage onScaffoldRecipe={handleScaffoldRecipe} onScaffoldIngredient={handleScaffoldIngredient} />;
      case 'settings':
        return <SettingsPage />;
      case 'help':
        return <HelpPage />;
      case 'recipes':
      default:
        return <RecipesPage onPrintRecipe={handlePrintRecipe} recipeScaffold={recipeScaffold} clearRecipeScaffold={clearRecipeScaffold} />;
    }
  };

  if (recipeToPrint) {
    return <RecipePrintView recipe={recipeToPrint} onClose={handleClosePrintView} />;
  }
  
  return (
    <div className="flex h-screen bg-neutral-100 font-sans">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
          {renderPage()}
        </main>
        <BottomNavBar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>

      {/* Global Modals for Quick Actions */}
      <Modal isOpen={isQuickRecipeModalOpen} onClose={() => setIsQuickRecipeModalOpen(false)} title="Crear Nueva Receta">
        <RecipeForm recipe={null} onSave={handleQuickSaveRecipe} onClose={() => setIsQuickRecipeModalOpen(false)} />
      </Modal>

      <Modal isOpen={isQuickIngredientModalOpen} onClose={() => setIsQuickIngredientModalOpen(false)} title="Añadir Materia Prima">
        <IngredientForm onSave={handleQuickSaveIngredient} onClose={() => setIsQuickIngredientModalOpen(false)} />
      </Modal>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
