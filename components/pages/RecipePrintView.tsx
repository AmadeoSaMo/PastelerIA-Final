
import React, { useRef, useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Loader, Share2, Download } from 'lucide-react';
import { ProcessedRecipe } from '../../utils/recipeCalculations';
import Input from '../ui/Input';
import { ALLERGENS } from '../../constants';

interface RecipePrintViewProps {
  recipe: ProcessedRecipe;
  onClose: () => void;
}

const RecipePrintView: React.FC<RecipePrintViewProps> = ({ recipe, onClose }) => {
    const { ingredients, recipes, businessProfile } = useAppContext();
    const printRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    
    const [scaleInputValue, setScaleInputValue] = useState<string>(String(recipe.finalProductCount));
    const [scaledUnits, setScaledUnits] = useState<string>(String(recipe.finalProductCount));
    
    const margin = recipe.profitMarginPercentage ?? 30;

    const getIngredientName = (id: string) => ingredients.find(i => i.id === id)?.name || 'Desconocido';
    const getSubRecipeName = (id: string) => recipes.find(r => r.id === id)?.name || 'Desconocido';
    
    const scaleFactor = useMemo(() => {
        const parsedScaledUnits = parseFloat(scaledUnits);
        if (!recipe.finalProductCount || recipe.finalProductCount <= 0 || isNaN(parsedScaledUnits) || parsedScaledUnits <= 0) {
            return 1;
        }
        return parsedScaledUnits / recipe.finalProductCount;
    }, [scaledUnits, recipe.finalProductCount]);

    // Calculate Total Suggested Price for the entire batch
    const totalSuggestedPrice = (recipe.totalCost * scaleFactor) / (1 - (margin / 100));

    const getFileName = () => {
        const safeFileName = recipe.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `${safeFileName}_${parseFloat(scaledUnits) || recipe.finalProductCount}${recipe.finalProductUnit}.pdf`;
    };

    const generatePDF = async () => {
        const elementToCapture = printRef.current;
        if (!elementToCapture) return null;

        const canvas = await html2canvas(elementToCapture, {
            scale: 2, 
            useCORS: true,
            backgroundColor: '#ffffff',
            windowWidth: 1280, 
            onclone: (clonedDoc) => {
                const clonedElement = clonedDoc.getElementById('print-container');
                if (clonedElement) {
                    clonedElement.style.width = '800px'; 
                    clonedElement.style.maxWidth = 'none';
                    clonedElement.style.minHeight = '1100px';
                    clonedElement.style.padding = '40px'; 
                    clonedElement.style.margin = '0 auto';
                    clonedElement.classList.remove('w-full'); 
                }
            }
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;
        
        let imgWidth = pdfWidth;
        let imgHeight = pdfWidth / canvasAspectRatio;

        if (imgHeight > pdfHeight) {
           // Fit to page logic if needed
        }
        
        const xOffset = (pdfWidth - imgWidth) / 2; 
        const yOffset = 0;

        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
        return pdf;
    };

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const pdf = await generatePDF();
            if (pdf) {
                pdf.save(getFileName());
            }
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Hubo un error al generar el PDF. Por favor, inténtalo de nuevo.");
        } finally {
            setIsDownloading(false);
        }
    };

    const handleShare = async () => {
        if (!navigator.share) {
            alert("Tu navegador no soporta la función de compartir. Utiliza el botón de Descargar.");
            return;
        }

        setIsSharing(true);
        try {
            const pdf = await generatePDF();
            if (pdf) {
                const blob = pdf.output('blob');
                const file = new File([blob], getFileName(), { type: 'application/pdf' });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        files: [file],
                        title: recipe.name,
                        text: `Aquí tienes la receta de ${recipe.name} (${parseFloat(scaledUnits)} ${recipe.finalProductUnit})`,
                    });
                } else {
                    alert("Tu dispositivo no permite compartir archivos PDF directamente. Intenta descargarlo primero.");
                }
            }
        } catch (error) {
            if ((error as any).name !== 'AbortError') {
                console.error("Error sharing PDF:", error);
                alert("Hubo un error al intentar compartir.");
            }
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="bg-neutral-200 min-h-screen">
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm p-4 border-b flex justify-center gap-4 z-10">
                <Button variant="secondary" onClick={onClose} disabled={isDownloading || isSharing}>Volver</Button>
                
                <Button onClick={handleShare} disabled={isDownloading || isSharing} className="hidden sm:inline-flex">
                    {isSharing ? (
                        <>
                            <Loader className="animate-spin mr-2" size={20}/>
                            Compartiendo...
                        </>
                    ) : (
                        <>
                             <Share2 className="mr-2" size={20} />
                             Compartir
                        </>
                    )}
                </Button>

                 <Button onClick={handleShare} disabled={isDownloading || isSharing} className="sm:hidden !px-3">
                    {isSharing ? <Loader className="animate-spin" size={20}/> : <Share2 size={20} />}
                </Button>

                <Button onClick={handleDownload} disabled={isDownloading || isSharing} className="hidden sm:inline-flex">
                    {isDownloading ? (
                        <>
                            <Loader className="animate-spin mr-2" size={20}/>
                            Descargando...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2" size={20} />
                            Descargar PDF
                        </>
                    )}
                </Button>

                <Button onClick={handleDownload} disabled={isDownloading || isSharing} className="sm:hidden !px-3">
                    {isDownloading ? <Loader className="animate-spin" size={20}/> : <Download size={20} />}
                </Button>
            </div>
            
            <div className="p-4 flex justify-center">
                 <div ref={printRef} id="print-container" className="p-4 sm:p-6 md:p-8 font-sans bg-white w-full md:w-[210mm] md:min-h-[297mm] shadow-lg">
                    <header className="flex flex-col md:flex-row justify-between items-start border-b-2 pb-6 gap-6">
                        <div className="flex-1">
                             <h1 className="text-4xl font-bold font-serif text-neutral-800 mb-2">{recipe.name}</h1>
                             <p className="text-neutral-500 text-sm">Fecha: {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="text-left md:text-right flex-shrink-0 min-w-[200px]">
                            <h3 className="text-xl font-bold text-primary-600">{businessProfile.name}</h3>
                             <div className="text-sm text-neutral-500 mt-1 space-y-0.5">
                                {businessProfile.address && <p>{businessProfile.address}</p>}
                                {businessProfile.phone && <p>Tel: {businessProfile.phone}</p>}
                                {businessProfile.email && <p>{businessProfile.email}</p>}
                                {businessProfile.website && <p>{businessProfile.website}</p>}
                                {businessProfile.taxId && <p>NIF: {businessProfile.taxId}</p>}
                            </div>
                        </div>
                    </header>
                    
                    {/* ALLERGENS SECTION */}
                    {recipe.allergens && recipe.allergens.length > 0 && (
                        <div className="mt-4 p-3 bg-neutral-50 rounded border border-neutral-200">
                            <p className="text-xs font-bold text-neutral-500 uppercase mb-2">Declaración de Alérgenos (Reglamento UE 1169/2011)</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {recipe.allergens.map(id => {
                                    const allergen = ALLERGENS.find(a => a.id === id);
                                    if (!allergen) return null;
                                    return (
                                        <div key={id} className="flex items-center text-sm font-medium text-neutral-800">
                                            <span className="mr-1.5 text-lg">{allergen.icon}</span>
                                            <span>{allergen.label}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    
                    <section className="mt-8 bg-primary-50 border border-primary-100 p-4 rounded-lg">
                        <h2 className="text-xl font-semibold mb-3 text-primary-800">Escalador Dinámico de Receta</h2>
                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-end gap-2 w-full">
                                <Input
                                    label={`Calcular para (${recipe.finalProductUnit}):`}
                                    id="scaledUnits"
                                    type="number"
                                    value={scaleInputValue}
                                    onChange={(e) => setScaleInputValue(e.target.value)}
                                    containerClassName="w-full sm:w-48"
                                    min="0"
                                    step="any"
                                />
                                <Button type="button" variant="secondary" onClick={() => setScaledUnits(scaleInputValue)}>
                                    Recalcular receta
                                </Button>
                            </div>
                             <div className="text-sm text-neutral-600 text-left md:text-right pb-2 flex-shrink-0">
                                <p>Receta base para: <span className="font-bold">{recipe.finalProductCount} {recipe.finalProductUnit}</span></p>
                                <p>Multiplicador: <span className="font-bold">x{scaleFactor.toFixed(2)}</span></p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-8">
                        <h2 className="text-xl md:text-2xl font-semibold border-b pb-2 mb-4 text-neutral-700">Notas de la Receta</h2>
                        <p className="text-neutral-600 italic">{recipe.notes || 'No hay notas adicionales.'}</p>
                    </section>
                    
                    <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="text-xl md:text-2xl font-semibold border-b pb-2 mb-4 text-neutral-700">Ingredientes</h2>
                            <ul className="space-y-2">
                                {recipe.ingredients.map((ing, index) => (
                                    <li key={index} className="flex justify-between text-neutral-800 border-b border-neutral-100 pb-1">
                                        <span>{getIngredientName(ing.ingredientId)}</span>
                                        <span className="font-mono flex-shrink-0 pl-2 font-medium">{(ing.quantity * scaleFactor).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {ing.unit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div>
                            <h2 className="text-xl md:text-2xl font-semibold border-b pb-2 mb-4 text-neutral-700">Sub-Recetas</h2>
                            {recipe.subRecipes.length > 0 ? (
                                <ul className="space-y-2">
                                    {recipe.subRecipes.map((sub, index) => (
                                        <li key={index} className="flex justify-between text-neutral-800 border-b border-neutral-100 pb-1">
                                            <span>{getSubRecipeName(sub.recipeId)}</span>
                                            <span className="font-mono flex-shrink-0 pl-2 font-medium">{(sub.quantity * scaleFactor).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} g/ml/u</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-neutral-500">No se utilizan sub-recetas.</p>
                            )}
                        </div>
                    </section>

                    <section className="mt-8">
                        <h2 className="text-xl md:text-2xl font-semibold border-b pb-2 mb-4 text-neutral-700">Análisis de Costes (para {parseFloat(scaledUnits) || recipe.finalProductCount} {recipe.finalProductUnit})</h2>
                        <div className="space-y-3 text-base bg-neutral-50 p-4 sm:p-6 rounded-lg border">
                            <div className="flex justify-between">
                                <span className="text-neutral-600">Coste Materiales (c/merma):</span>
                                <span className="font-medium font-mono text-neutral-900">{(recipe.materialCostWithWaste * scaleFactor).toFixed(2)} €</span>
                            </div>
                            {recipe.elaborationCost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Coste Elaboración ({recipe.elaborationCostPercentage}%):</span>
                                    <span className="font-medium font-mono text-neutral-900">{(recipe.elaborationCost * scaleFactor).toFixed(2)} €</span>
                                </div>
                            )}
                            {recipe.bakingCost > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-neutral-600">Coste Horneado ({recipe.bakingCostPercentage}%):</span>
                                    <span className="font-medium font-mono text-neutral-900">{(recipe.bakingCost * scaleFactor).toFixed(2)} €</span>
                                </div>
                            )}
                            <div className="flex justify-between border-t pt-3 mt-3">
                                <span className="font-semibold text-neutral-800">Coste Total Receta:</span>
                                <span className="font-bold font-mono text-xl text-neutral-900">{(recipe.totalCost * scaleFactor).toFixed(2)} €</span>
                            </div>
                            
                            <div className="mt-4 bg-white p-3 rounded-md border">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-neutral-800">Coste por {recipe.finalProductUnit}:</p>
                                    <span className="font-bold font-mono text-xl text-neutral-900">{recipe.unitCost.toFixed(4)} €</span>
                                </div>
                                <p className="text-xs text-neutral-500 mt-2">(Este valor no cambia al escalar)</p>
                            </div>

                            <div className="bg-green-100 border border-green-200 p-3 rounded-md mt-2">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold text-green-800">PVP Sugerido (Total Receta):</p>
                                    <span className="font-bold font-mono text-xl text-green-900">{totalSuggestedPrice.toFixed(2)} €</span>
                                </div>
                                <p className="text-xs text-green-700 mt-2">({margin}% margen)</p>
                            </div>
                        </div>
                    </section>

                    <footer className="mt-12 border-t pt-4 text-center text-xs text-neutral-400">
                        <p>Generado por {businessProfile.name} usando PastelerIA.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default RecipePrintView;
