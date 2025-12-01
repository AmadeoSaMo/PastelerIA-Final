
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Calculator, Scale, Database, MessageSquare, FileText, Layers, Wifi } from 'lucide-react';

const FaqItem: React.FC<{ question: string; answer: React.ReactNode; icon?: React.ElementType }> = ({ question, answer, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 text-left focus:outline-none group"
      >
        <div className="flex items-center gap-3">
            {Icon && <div className="p-2 bg-primary-50 text-primary-600 rounded-full group-hover:bg-primary-100 transition-colors"><Icon size={20} /></div>}
            <span className="font-medium text-neutral-800 group-hover:text-primary-700 transition-colors">{question}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-neutral-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-neutral-400" />
        )}
      </button>
      {isOpen && (
        <div className="pb-4 pl-[3.25rem] pr-4 text-neutral-600 text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
          {answer}
        </div>
      )}
    </div>
  );
};

const HelpPage: React.FC = () => {
  return (
    <div className="container mx-auto max-w-3xl">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-neutral-800 flex items-center justify-center md:justify-start gap-3">
          <HelpCircle className="h-8 w-8 text-primary-500" />
          Centro de Ayuda
        </h1>
        <p className="text-neutral-500 mt-2">
          Respuestas a las dudas más comunes sobre PastelerIA.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden px-6 py-2">
        
        <div className="py-4">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Gestión de Costes</h2>
            <FaqItem 
                icon={Calculator}
                question="¿Cómo se calcula el precio sugerido?"
                answer={
                    <span>
                        El sistema suma el coste de las materias primas (incluyendo la merma). Luego añade los costes indirectos si los has activado (Elaboración y Horneado).
                        <br/><br/>
                        Finalmente, aplica la fórmula: <strong>PVP = Coste Total / (1 - Margen%)</strong>.
                        <br/>
                        Por ejemplo, si tu coste es 10€ y quieres un 30% de margen, el precio será 14.28€ (no 13€), asegurando que el 30% del dinero que entra en caja es beneficio real.
                    </span>
                }
            />
            <FaqItem 
                icon={Scale}
                question="¿Qué pasa si compro en Kilos pero uso Gramos?"
                answer="No te preocupes. Al crear una Materia Prima, defines cómo la compras (ej: Saco de 25kg). El sistema calcula automáticamente el 'precio por unidad base' (kg, litro o unidad). Cuando creas una receta, puedes usar gramos, mililitros, etc., y el sistema hace la conversión matemática exacta del coste."
            />
        </div>

        <div className="py-4 border-t border-neutral-100">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Recetas y Producción</h2>
            <FaqItem 
                icon={Layers}
                question="¿Cómo funcionan las Sub-Recetas?"
                answer="Son recetas dentro de recetas. Por ejemplo, puedes crear una receta llamada 'Crema Pastelera'. Luego, al crear una 'Tarta de Frutas', añades 'Crema Pastelera' como si fuera un ingrediente más. Si mañana sube el precio de la leche, se actualizará el coste de la crema y automáticamente el de la tarta."
            />
            <FaqItem 
                icon={Scale}
                question="¿Puedo escalar las cantidades para un pedido grande?"
                answer="Sí. Entra en una receta y pulsa el botón 'Ver y Escalar'. Podrás escribir la cantidad exacta que quieres producir (ej: 50 tartas o 5000g de masa) y la aplicación recalculará la lista de ingredientes necesaria y el coste total de ese lote."
            />
        </div>

        <div className="py-4 border-t border-neutral-100">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Datos y Seguridad</h2>
            <FaqItem 
                icon={Database}
                question="¿Dónde se guardan mis recetas?"
                answer="Todos los datos se guardan localmente en tu navegador (LocalStorage). Esto significa que es privado y nadie más tiene acceso. Sin embargo, si borras el historial o cambias de dispositivo, podrías perderlos. Recomendamos usar la opción de 'Copias de Seguridad' en Ajustes periódicamente."
            />
             <FaqItem 
                icon={FileText}
                question="¿Puedo poner mi logo en los PDFs?"
                answer="Actualmente puedes personalizar el nombre, dirección y datos de contacto de tu negocio en Ajustes > Perfil del Negocio. Estos datos aparecerán automáticamente en la cabecera de cualquier receta que exportes o imprimas."
            />
             <FaqItem 
                icon={Wifi}
                question="¿Necesito internet para usar la app?"
                answer="La mayor parte de la aplicación (recetas, ingredientes, calculadora) funciona sin internet. Solo necesitas conexión para usar Chef AI y para cargar la aplicación si no la has instalado aún en tu dispositivo."
            />
        </div>

        <div className="py-4 border-t border-neutral-100">
            <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Inteligencia Artificial</h2>
            <FaqItem 
                icon={MessageSquare}
                question="¿Qué puede hacer Chef AI?"
                answer={
                    <ul className="list-disc list-inside space-y-1">
                        <li><strong>Crear Recetas:</strong> Dile 'Crea una receta de tarta de queso' y generará un borrador.</li>
                        <li><strong>Cambiar Precios:</strong> Dile 'La harina ha subido a 1.50' y actualizará la materia prima.</li>
                        <li><strong>Análisis:</strong> Pregunta '¿Cuál es mi receta más rentable?' o '¿Qué ingrediente es el más caro?'.</li>
                        <li><strong>Escalar:</strong> Dile 'Calcula los ingredientes para 50 tartas'.</li>
                    </ul>
                }
            />
        </div>

      </div>

      <div className="mt-8 bg-primary-50 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-primary-800">¿Necesitas más ayuda?</h3>
        <p className="text-black mt-2 text-sm">
          Prueba a preguntarle directamente a <strong>Chef AI</strong>. Entiende todo el contexto de tu pastelería y puede guiarte paso a paso.
        </p>
      </div>
    </div>
  );
};

export default HelpPage;
