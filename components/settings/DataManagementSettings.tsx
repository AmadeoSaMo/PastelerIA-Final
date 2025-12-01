
import React, { useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import { Download, Upload, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { Ingredient, Recipe, Supplier, ChatMessage, BusinessProfile } from '../../types';
import Modal from '../ui/Modal';

const DataManagementSettings: React.FC = () => {
  const { 
    ingredients, setIngredients,
    recipes, setRecipes,
    suppliers, setSuppliers,
    settings, setSettings,
    businessProfile, setBusinessProfile,
    chatHistory, setChatHistory
  } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const handleExport = () => {
    const data = {
      ingredients,
      recipes,
      suppliers,
      settings,
      businessProfile,
      chatHistory,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().split('T')[0];
    const safeName = businessProfile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'pasteleria';
    
    link.href = url;
    link.download = `backup_${safeName}_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation check
        if (!json.ingredients || !json.recipes) {
            throw new Error("Formato de archivo inválido");
        }
        setPendingData(json);
        setShowConfirmModal(true);
        
        // Reset input so same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error("Error parsing backup file:", error);
        setImportStatus('error');
        setTimeout(() => setImportStatus('idle'), 3000);
      }
    };
    reader.readAsText(file);
  };

  const confirmImport = () => {
    if (!pendingData) return;

    try {
        if (pendingData.ingredients) setIngredients(pendingData.ingredients);
        if (pendingData.recipes) setRecipes(pendingData.recipes);
        if (pendingData.suppliers) setSuppliers(pendingData.suppliers);
        if (pendingData.settings) setSettings(pendingData.settings);
        if (pendingData.businessProfile) setBusinessProfile(pendingData.businessProfile);
        if (pendingData.chatHistory) setChatHistory(pendingData.chatHistory);

        setImportStatus('success');
        setTimeout(() => setImportStatus('idle'), 3000);
    } catch (e) {
        setImportStatus('error');
    }
    setShowConfirmModal(false);
    setPendingData(null);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
        <h2 className="text-xl font-semibold text-neutral-700 border-b pb-3 mb-4 flex items-center">
            <Database className="mr-2 h-6 w-6 text-primary-500" />
            Copias de Seguridad
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
            Tus datos se guardan en este navegador. Para evitar perderlos (si cambias de móvil o limpias la caché), 
            descarga una copia de seguridad periódicamente.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExport} variant="primary" className="flex-1 flex justify-center items-center">
                <Download className="mr-2 h-5 w-5" />
                Descargar Copia (Exportar)
            </Button>
            
            <div className="flex-1">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" 
                    accept=".json"
                />
                <Button onClick={triggerFileInput} variant="secondary" className="w-full flex justify-center items-center h-full">
                    <Upload className="mr-2 h-5 w-5" />
                    Restaurar Copia (Importar)
                </Button>
            </div>
        </div>

        {importStatus === 'success' && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded-md flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                Datos restaurados correctamente.
            </div>
        )}
        
        {importStatus === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded-md flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Error al leer el archivo. Asegúrate de que es una copia válida.
            </div>
        )}
        </div>

        <Modal
            isOpen={showConfirmModal}
            onClose={() => setShowConfirmModal(false)}
            title="⚠️ Confirmar Restauración"
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>Cancelar</Button>
                    <Button variant="danger" onClick={confirmImport}>Sí, Sobrescribir Datos</Button>
                </div>
            }
        >
            <div className="space-y-4">
                <p className="text-neutral-700 font-medium">
                    Estás a punto de importar una copia de seguridad.
                </p>
                <p className="text-red-600 bg-red-50 p-3 rounded border border-red-100 text-sm">
                    ¡Cuidado! Esta acción <strong>borrará todos los datos actuales</strong> (recetas, ingredientes, chat...) 
                    y los reemplazará por los del archivo.
                </p>
                <p className="text-sm text-neutral-500">
                    Fecha de la copia: {pendingData?.exportDate ? new Date(pendingData.exportDate).toLocaleString() : 'Desconocida'}
                </p>
            </div>
        </Modal>
    </>
  );
};

export default DataManagementSettings;
