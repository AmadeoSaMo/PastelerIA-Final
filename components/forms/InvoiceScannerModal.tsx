
import React, { useRef, useState } from 'react';
import { Camera, Upload, Loader, X, Save } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { analyzeInvoiceImage, InvoiceAnalysisResult } from '../../services/geminiService';
import { Ingredient, Unit, IngredientType } from '../../types';
import { UNIT_OPTIONS } from '../../constants';
import Select from '../ui/Select';
import { useAppContext } from '../../context/AppContext';

interface InvoiceScannerModalProps {
    onClose: () => void;
    onImport: (ingredients: Omit<Ingredient, 'id' | 'lastUpdated'>[]) => void;
}

const InvoiceScannerModal: React.FC<InvoiceScannerModalProps> = ({ onClose, onImport }) => {
    const { suppliers, addSupplier } = useAppContext();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<InvoiceAnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // For managing the detected supplier
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
    const [newSupplierName, setNewSupplierName] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!imagePreview) return;
        setIsAnalyzing(true);
        setError(null);

        // Extract base64 without prefix
        const base64Data = imagePreview.split(',')[1];
        
        try {
            const result = await analyzeInvoiceImage(base64Data);
            if (result) {
                setAnalysisResult(result);
                // Try to auto-match supplier
                const matchedSupplier = suppliers.find(s => s.name.toLowerCase().includes(result.supplierName.toLowerCase()));
                if (matchedSupplier) {
                    setSelectedSupplierId(matchedSupplier.id);
                } else {
                    setNewSupplierName(result.supplierName);
                    setSelectedSupplierId('new');
                }
            } else {
                setError("No se pudieron extraer datos de la imagen. Intenta con una foto más clara.");
            }
        } catch (err) {
            console.error(err);
            setError("Error al conectar con el servicio de IA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        if (!analysisResult) return;
        const newItems = [...analysisResult.items];
        (newItems[index] as any)[field] = value;
        setAnalysisResult({ ...analysisResult, items: newItems });
    };

    const handleRemoveItem = (index: number) => {
        if (!analysisResult) return;
        const newItems = analysisResult.items.filter((_, i) => i !== index);
        setAnalysisResult({ ...analysisResult, items: newItems });
    };

    const handleFinalImport = () => {
        if (!analysisResult) return;

        let finalSupplierId = selectedSupplierId;

        // If creating a new supplier on the fly
        if (selectedSupplierId === 'new' && newSupplierName) {
            const newSupplierId = Date.now().toString();
            addSupplier({
                name: newSupplierName,
                // Add basic placeholders
                contactName: '',
                email: '',
                officePhone: '',
                salesPhone: '',
                deliveryDays: [],
                notes: 'Creado desde Escáner de Facturas'
            });
            finalSupplierId = newSupplierId;
        } else if (selectedSupplierId === 'new') {
            finalSupplierId = ''; // No supplier selected
        }

        const ingredientsToImport: Omit<Ingredient, 'id' | 'lastUpdated'>[] = analysisResult.items.map(item => {
            // Calculate base cost
            let costPerUnit = 0;
            let baseUnit = Unit.kg;
            let type = IngredientType.weight;
            const price = Number(item.purchasePrice);
            const qty = Number(item.purchaseQuantity);
            const unit = item.purchaseUnit as Unit;

            if (price > 0 && qty > 0) {
                switch (unit) {
                    case Unit.g: costPerUnit = (price / qty) * 1000; baseUnit = Unit.kg; break;
                    case Unit.kg: costPerUnit = price / qty; baseUnit = Unit.kg; break;
                    case Unit.ml: costPerUnit = (price / qty) * 1000; baseUnit = Unit.L; break;
                    case Unit.L: costPerUnit = price / qty; baseUnit = Unit.L; break;
                    case Unit.unit: costPerUnit = price / qty; baseUnit = Unit.unit; type = IngredientType.unit; break;
                    default: costPerUnit = price / qty; baseUnit = Unit.kg; // Default fallback
                }
            }

            return {
                name: item.name,
                costPerUnit: costPerUnit,
                unit: baseUnit,
                type: type,
                supplierId: finalSupplierId || undefined,
                purchasePrice: price,
                purchaseQuantity: qty,
                purchaseUnit: unit,
                purchaseFormatName: item.formatName || 'Formato Estándar',
                allergens: [] // User must check allergens manually later for safety
            };
        });

        onImport(ingredientsToImport);
        onClose();
    };

    const supplierOptions = [
        { value: '', label: 'Sin Proveedor' },
        { value: 'new', label: '+ Crear Nuevo Proveedor' },
        ...suppliers.map(s => ({ value: s.id, label: s.name }))
    ];

    if (analysisResult) {
        return (
            <div className="flex flex-col h-full max-h-[80vh]">
                <div className="flex-shrink-0 mb-4 pb-4 border-b">
                    <h3 className="text-lg font-bold text-neutral-800 mb-2">Revisar Resultados</h3>
                    <p className="text-sm text-neutral-500 mb-4">
                        La IA ha detectado {analysisResult.items.length} productos. Revisa los datos y el proveedor antes de importar.
                    </p>
                    
                    <div className="bg-primary-50 p-3 rounded-lg border border-primary-100">
                        <label className="block text-sm font-semibold text-primary-800 mb-1">Proveedor Detectado:</label>
                        <Select 
                            options={supplierOptions} 
                            value={selectedSupplierId} 
                            onChange={(e) => setSelectedSupplierId(e.target.value)}
                            containerClassName="bg-white"
                        />
                        {selectedSupplierId === 'new' && (
                            <Input 
                                placeholder="Nombre del nuevo proveedor" 
                                value={newSupplierName} 
                                onChange={(e) => setNewSupplierName(e.target.value)} 
                                containerClassName="mt-2"
                            />
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 p-1">
                    {analysisResult.items.map((item, index) => (
                        <div key={index} className="flex flex-col md:flex-row gap-3 p-3 bg-white border rounded-lg shadow-sm">
                            <div className="flex-1">
                                <Input 
                                    label="Nombre" 
                                    value={item.name} 
                                    onChange={(e) => handleItemChange(index, 'name', e.target.value)} 
                                    className="text-sm font-medium"
                                />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                <Input 
                                    label="Precio (€)" 
                                    type="number" 
                                    step="any"
                                    value={item.purchasePrice} 
                                    onChange={(e) => handleItemChange(index, 'purchasePrice', parseFloat(e.target.value))}
                                    containerClassName="w-20"
                                />
                                <Input 
                                    label="Cant." 
                                    type="number" 
                                    value={item.purchaseQuantity} 
                                    onChange={(e) => handleItemChange(index, 'purchaseQuantity', parseFloat(e.target.value))}
                                    containerClassName="w-16"
                                />
                                <Select 
                                    label="Unidad"
                                    options={UNIT_OPTIONS} 
                                    value={item.purchaseUnit} 
                                    onChange={(e) => handleItemChange(index, 'purchaseUnit', e.target.value)}
                                    containerClassName="w-28"
                                />
                                <div className="flex items-end pb-1">
                                    <button onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 p-2">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex-shrink-0 mt-4 pt-4 border-t flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setAnalysisResult(null)}>Volver</Button>
                    <Button onClick={handleFinalImport}>
                        <Save className="mr-2 h-4 w-4" /> Importar {analysisResult.items.length} Items
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="text-center p-6">
            {!imagePreview ? (
                <div 
                    className="border-2 border-dashed border-neutral-300 rounded-xl p-10 cursor-pointer hover:bg-neutral-50 hover:border-primary-400 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <Camera className="mx-auto h-12 w-12 text-neutral-400 mb-4" />
                    <p className="font-medium text-neutral-700">Toca para hacer una foto o subir archivo</p>
                    <p className="text-sm text-neutral-500 mt-2">Formatos: JPG, PNG</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="relative rounded-lg overflow-hidden max-h-64 shadow-md mx-auto">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-contain bg-neutral-900" />
                        <button 
                            onClick={() => { setImagePreview(null); setError(null); }}
                            className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center">
                        <Button 
                            onClick={handleAnalyze} 
                            disabled={isAnalyzing}
                            className="w-full md:w-auto"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader className="mr-2 h-5 w-5 animate-spin" />
                                    Analizando Factura...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-5 w-5" />
                                    Procesar Imagen con IA
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-xs text-neutral-400">
                        La IA detectará el proveedor y la lista de productos (sin IVA).
                    </p>
                </div>
            )}
        </div>
    );
};

export default InvoiceScannerModal;
