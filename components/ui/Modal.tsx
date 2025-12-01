
import React, { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 p-1">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto min-h-0">
          {children}
        </div>
        
        {footer && (
          <div className="flex justify-end p-4 border-t bg-neutral-50 rounded-b-lg flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
