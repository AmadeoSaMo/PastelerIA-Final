
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Supplier, Ingredient } from '../../types';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus, Edit, Trash2, ArrowLeft, Phone, Mail, Truck, FileText } from 'lucide-react';
import SupplierForm from '../forms/SupplierForm';

const SupplierDetailView: React.FC<{ supplier: Supplier; ingredients: Ingredient[]; onClose: () => void; }> = ({ supplier, ingredients, onClose }) => {
    
    const formatDeliveryDays = (days?: number[]) => {
        if (!days || days.length === 0) return 'No especificados';
        const dayMap: { [key: number]: string } = { 1: 'Lunes', 2: 'Martes', 3: 'Miércoles', 4: 'Jueves', 5: 'Viernes', 6: 'Sábado', 0: 'Domingo' };
        return [...days].sort((a,b) => a-b).map(d => dayMap[d] || '').join(', ');
    }

    return (
        <div className="container mx-auto">
            <div className="mb-6">
                <Button variant="secondary" onClick={onClose}>
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Volver a Proveedores
                </Button>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 mb-6">
                <h1 className="text-3xl font-bold text-neutral-800 font-serif">{supplier.name}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-neutral-700 mb-4 border-b pb-2 flex items-center"><Phone className="mr-3 h-5 w-5 text-primary-500" />Contacto</h2>
                    <div className="space-y-3 text-sm">
                        <p className="text-neutral-500">Persona de contacto: <span className="font-medium text-neutral-800 block">{supplier.contactName || '-'}</span></p>
                        <p className="text-neutral-500">Teléfono Comercial: <span className="font-medium text-neutral-800 block">{supplier.salesPhone || '-'}</span></p>
                        <p className="text-neutral-500">Teléfono Oficina: <span className="font-medium text-neutral-800 block">{supplier.officePhone || '-'}</span></p>
                        <p className="text-neutral-500">Email: <span className="font-medium text-neutral-800 block">{supplier.email || '-'}</span></p>
                    </div>
                </div>
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-neutral-700 mb-4 border-b pb-2 flex items-center"><Truck className="mr-3 h-5 w-5 text-primary-500" />Reparto</h2>
                    <div className="space-y-3 text-sm">
                        <p className="text-neutral-500">Días de Reparto:</p>
                        <p className="font-medium text-neutral-800">{formatDeliveryDays(supplier.deliveryDays)}</p>
                    </div>
                </div>
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-neutral-700 mb-4 border-b pb-2 flex items-center"><FileText className="mr-3 h-5 w-5 text-primary-500" />Notas</h2>
                    <p className="text-sm text-neutral-600 italic">{supplier.notes || 'No hay notas adicionales.'}</p>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <h2 className="text-xl font-semibold text-neutral-800 p-6">Productos Suministrados</h2>
                {ingredients.length > 0 ? (
                     <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200">
                            <thead className="bg-neutral-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Producto</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Formato de Compra</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Precio del Formato</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Coste Unitario (Almacén)</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-neutral-200">
                                {ingredients.map(ingredient => {
                                    const purchaseFormat = ingredient.purchaseFormatName
                                        ? `${ingredient.purchaseFormatName} de ${ingredient.purchaseQuantity} ${ingredient.purchaseUnit}`
                                        : (ingredient.purchaseQuantity ? `${ingredient.purchaseQuantity} ${ingredient.purchaseUnit}` : 'No especificado');

                                    const purchasePrice = ingredient.purchasePrice
                                        ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(ingredient.purchasePrice)
                                        : '-';
                                    
                                    const unitCost = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 }).format(ingredient.costPerUnit);

                                    return (
                                        <tr key={ingredient.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-neutral-900">{ingredient.name}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-800">{purchaseFormat}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{purchasePrice}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{unitCost} / {ingredient.unit}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center p-8 border-t">
                        <p className="text-neutral-500">Este proveedor no tiene ningún ingrediente asociado actualmente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}


const SuppliersPage: React.FC = () => {
  const { suppliers, ingredients, addSupplier, updateSupplier, deleteSupplier } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    if (viewingSupplier) {
      const updatedSupplier = suppliers.find(s => s.id === viewingSupplier.id);
      if (updatedSupplier) {
        if (JSON.stringify(updatedSupplier) !== JSON.stringify(viewingSupplier)) {
          setViewingSupplier(updatedSupplier);
        }
      } else {
        // Supplier was deleted, go back to the list
        setViewingSupplier(null);
      }
    }
  }, [suppliers, viewingSupplier]);

  const handleOpenModal = (supplier: Supplier | null = null) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSupplier(null);
    setIsModalOpen(false);
  };
  
  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
  }

  const handleSave = (supplierData: Omit<Supplier, 'id'> | Supplier) => {
    if ('id' in supplierData) {
      updateSupplier(supplierData);
    } else {
      addSupplier(supplierData);
    }
    handleCloseModal();
  };
  
  const handleDelete = (id: string) => {
    if(window.confirm('¿Estás seguro de que quieres eliminar este proveedor? Se desvinculará de todos los ingredientes asociados.')) {
        deleteSupplier(id);
    }
  }
  
  const formatDeliveryDays = (days?: number[]) => {
    if (!days || days.length === 0) return '-';
    const dayMap: { [key: number]: string } = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' };
    return [...days].sort((a,b) => a-b).map(d => dayMap[d] || '').join(', ');
  }
  
  if (viewingSupplier) {
    const supplierIngredients = ingredients.filter(i => i.supplierId === viewingSupplier.id);
    return <SupplierDetailView 
        supplier={viewingSupplier} 
        ingredients={supplierIngredients} 
        onClose={() => setViewingSupplier(null)}
    />;
  }

  return (
    <div className="container mx-auto">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-neutral-800">Proveedores</h1>
        <Button onClick={() => handleOpenModal()} size="sm" className="!p-2">
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-neutral-800">Gestión de Proveedores</h1>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2 h-5 w-5" />
          Añadir Proveedor
        </Button>
      </div>
      
      {/* Desktop Table */}
      <div className="hidden md:block bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200">
            <thead className="bg-neutral-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Nombre</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contacto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Teléfono Comercial</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Días de Reparto</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {suppliers.map(supplier => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => handleViewSupplier(supplier)} className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline text-left">
                        {supplier.name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">{supplier.contactName || '-'}</div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-neutral-500">{supplier.salesPhone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {supplier.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                    {formatDeliveryDays(supplier.deliveryDays)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(supplier)} className="text-primary-600 hover:text-primary-800 mr-4"><Edit size={20} /></button>
                    <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {suppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-start">
              <div>
                <button onClick={() => handleViewSupplier(supplier)} className="font-bold text-neutral-800 text-left hover:underline">
                    {supplier.name}
                </button>
                <p className="text-sm text-neutral-600">{supplier.contactName || 'Sin contacto'}</p>
              </div>
              <div className="flex space-x-3">
                <button onClick={() => handleOpenModal(supplier)} className="text-primary-600 hover:text-primary-800"><Edit size={20} /></button>
                <button onClick={() => handleDelete(supplier.id)} className="text-red-600 hover:text-red-900"><Trash2 size={20} /></button>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500 space-y-1">
              {supplier.salesPhone && <p>Comercial: <span className="font-medium text-neutral-600">{supplier.salesPhone}</span></p>}
              {supplier.email && <p>Email: <span className="font-medium text-neutral-600">{supplier.email}</span></p>}
              <p>Reparto: <span className="font-medium text-neutral-600">{formatDeliveryDays(supplier.deliveryDays)}</span></p>
            </div>
          </div>
        ))}
      </div>


      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingSupplier ? 'Editar Proveedor' : 'Añadir Nuevo Proveedor'}
      >
        <SupplierForm supplier={editingSupplier} onSave={handleSave} onClose={handleCloseModal} />
      </Modal>
    </div>
  );
};

export default SuppliersPage;