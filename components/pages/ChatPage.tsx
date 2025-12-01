
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, PriceChangeProposal, Ingredient } from '../../types';
import { streamChatResponse } from '../../services/geminiService';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Send, User, Bot, Loader, Link as LinkIcon, Trash2, Sparkles } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { calculateAllRecipeCosts, RecipeScaffold } from '../../utils/recipeCalculations';
import Modal from '../ui/Modal';

interface ChatPageProps {
  onScaffoldRecipe: (scaffold: RecipeScaffold) => void;
  onScaffoldIngredient: (scaffold: Partial<Ingredient>) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({ onScaffoldRecipe, onScaffoldIngredient }) => {
  const { ingredients, suppliers, recipes, updateIngredient, chatHistory, setChatHistory, clearChatHistory } = useAppContext();
  // Use context state instead of local state
  const messages = chatHistory;
  const setMessages = setChatHistory;

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [ingredientPriceChangeProposal, setIngredientPriceChangeProposal] = useState<PriceChangeProposal | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const processedRecipes = useMemo(() => {
    return calculateAllRecipeCosts(recipes, ingredients);
  }, [recipes, ingredients]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);
  
  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = typeof textOverride === 'string' ? textOverride : input;
    if (textToSend.trim() === '' || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: ChatMessage = { id: modelMessageId, role: 'model', text: '' };
    setMessages(prev => [...prev, modelMessage]);

    const response = await streamChatResponse(newMessages, ingredients, suppliers, processedRecipes, (chunkText) => {
      setMessages(prev => {
        return prev.map(msg => 
            msg.id === modelMessageId ? { ...msg, text: chunkText } : msg
        );
      });
    });
    
    // After streaming is complete, check for proposals
    if (response.priceChangeProposal) {
        setMessages(prev => prev.filter(msg => msg.id !== modelMessageId)); // Remove temp message
        setIngredientPriceChangeProposal(response.priceChangeProposal);
    } else if (response.recipeScaffold) {
        setMessages(prev => prev.filter(msg => msg.id !== modelMessageId)); // Remove temp message
        onScaffoldRecipe(response.recipeScaffold);
    } else if (response.ingredientScaffold) {
        setMessages(prev => prev.filter(msg => msg.id !== modelMessageId)); // Remove temp message
        onScaffoldIngredient(response.ingredientScaffold);
    } else {
        setMessages(prev => {
           return prev.map(msg => 
               msg.id === modelMessageId 
               ? { ...msg, text: response.finalText, groundingChunks: response.groundingChunks } 
               : msg
           );
         });
    }
    
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };
  
  const handleConfirmClear = () => {
    clearChatHistory();
    setShowConfirmClear(false);
  };

  const handleConfirmPriceChange = () => {
    if (!ingredientPriceChangeProposal) return;
    const { ingredientId, newPrice } = ingredientPriceChangeProposal;
    const ingredientToUpdate = ingredients.find(i => i.id === ingredientId);

    if (ingredientToUpdate) {
        let updatedIngredient = { ...ingredientToUpdate, costPerUnit: newPrice };

        // Update the purchasePrice to reflect the new unit cost to maintain consistency
        if (updatedIngredient.purchaseQuantity && updatedIngredient.purchaseQuantity > 0) {
            let quantityInBaseUnit = updatedIngredient.purchaseQuantity;
            if (updatedIngredient.purchaseUnit === 'g' || updatedIngredient.purchaseUnit === 'ml') {
                quantityInBaseUnit /= 1000;
            }
            const newPurchasePrice = newPrice * quantityInBaseUnit;
            updatedIngredient.purchasePrice = parseFloat(newPurchasePrice.toFixed(2));
        }

        updateIngredient(updatedIngredient);

        const confirmationMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'model',
            text: `✅ ¡Hecho! El precio de '${ingredientToUpdate.name}' se ha actualizado a ${newPrice.toFixed(2)} €.`
        };
        setMessages(prev => [...prev, confirmationMessage]);
    }
    setIngredientPriceChangeProposal(null);
  };

  const handleCancelPriceChange = () => {
    setIngredientPriceChangeProposal(null);
  };

  const quickActions = [
    { label: "Crear receta", text: "Ayúdame a crear una nueva receta paso a paso.", icon: "🍰" },
    { label: "Analizar costes", text: "¿Cuál es mi receta más rentable y cuál la más cara?", icon: "💰" },
    { label: "Tendencias", text: "¿Cuáles son las tendencias actuales en pastelería para esta temporada?", icon: "📈" },
    { label: "Ajustar precio", text: "Necesito actualizar el precio de una materia prima.", icon: "🏷️" },
  ];

  return (
    <>
      <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
        <div className="p-4 border-b flex justify-between items-center">
          <div>
              <h1 className="text-xl font-bold text-neutral-800">Habla con Chef AI</h1>
              <p className="text-sm text-neutral-500 hidden sm:block">Tu asistente personal de PastelerIA.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowConfirmClear(true)} disabled={messages.length === 0 || isLoading}>
              <Trash2 className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Limpiar Chat</span>
          </Button>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-neutral-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-20 h-20 bg-white rounded-full shadow-md flex items-center justify-center mb-6 text-primary-500 border-2 border-primary-100">
                    <Bot size={40} />
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 mb-2">¡Hola! Soy Chef AI</h2>
                <p className="text-neutral-600 max-w-md mb-8">
                    Estoy conectado a tu inventario y recetas. Puedo ayudarte a calcular costes, crear nuevos productos o buscar inspiración.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                    {quickActions.map((action, index) => (
                        <button 
                            key={index}
                            onClick={() => handleSendMessage(action.text)}
                            className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm hover:shadow-md hover:border-primary-300 hover:bg-primary-50 transition-all text-left group"
                        >
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">{action.icon}</span>
                            <span className="font-semibold text-neutral-800 block">{action.label}</span>
                            <span className="text-xs text-neutral-500 block mt-1">{action.text}</span>
                        </button>
                    ))}
                </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'model' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-500 flex items-center justify-center text-white"><Bot size={20} /></div>}
                  <div className={`max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-white border border-neutral-200 text-neutral-800 shadow-sm'}`}>
                    <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
                    {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-neutral-300/50">
                        <h4 className="text-xs font-semibold mb-2 flex items-center opacity-75">
                          <LinkIcon size={12} className="mr-1.5" />
                          Fuentes
                        </h4>
                        <ul className="space-y-1.5">
                          {msg.groundingChunks.map((chunk, i) => (
                            <li key={i} className="text-xs">
                              <a 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="underline opacity-80 hover:opacity-100 break-all"
                                title={chunk.web.title}
                              >
                                {chunk.web.title || chunk.web.uri}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {msg.role === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white"><User size={20} /></div>}
                </div>
              ))}
              {isLoading && messages[messages.length-1]?.role === 'model' && (
                  <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-500 flex items-center justify-center text-white"><Bot size={20} /></div>
                      <div className="max-w-md p-3 rounded-lg bg-white border border-neutral-200 text-neutral-800 shadow-sm">
                          <div className="flex items-center gap-2 text-neutral-500 text-sm">
                            <Loader className="animate-spin" size={16}/>
                            <span>Pensando...</span>
                          </div>
                      </div>
                  </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t bg-white">
          <div className="flex items-center space-x-2">
            <Input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu consulta aquí..."
              className="flex-1"
              disabled={isLoading}
              containerClassName="w-full"
            />
            <Button onClick={() => handleSendMessage()} disabled={isLoading || input.trim() === ''}>
              <Send size={20} />
            </Button>
          </div>
        </div>
      </div>
      <Modal
        isOpen={showConfirmClear}
        onClose={() => setShowConfirmClear(false)}
        title="Confirmar Limpieza de Chat"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowConfirmClear(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleConfirmClear}>
              Sí, Limpiar
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          Se borrará todo el historial de la conversación. Esta acción no se puede deshacer.
        </p>
      </Modal>

      <Modal
        isOpen={!!ingredientPriceChangeProposal}
        onClose={handleCancelPriceChange}
        title="Confirmar Cambio de Precio"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleCancelPriceChange}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleConfirmPriceChange}>
              Confirmar Cambio
            </Button>
          </div>
        }
      >
        {ingredientPriceChangeProposal && (
          <p className="text-sm text-neutral-600">
            Chef AI sugiere cambiar el precio de <strong>'{ingredientPriceChangeProposal.ingredientName}'</strong> de 
            <strong> {ingredientPriceChangeProposal.oldPrice.toFixed(2)} €</strong> a 
            <strong> {ingredientPriceChangeProposal.newPrice.toFixed(2)} €</strong>.
            <br/><br/>
            ¿Estás de acuerdo?
          </p>
        )}
      </Modal>
    </>
  );
};

export default ChatPage;
