import React, { useState } from 'react';
import { FileText, Plus, Pencil, Trash2, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { useAppStore, Perfil } from '../store/useAppStore';
import { Button } from './ui/Button';
import { FormPerfil } from './FormPerfil';
import { motion, AnimatePresence } from 'motion/react';

export const ListaPerfiles: React.FC = () => {
  const { perfiles, deletePerfil } = useAppStore();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPerfil, setEditingPerfil] = useState<Perfil | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{id: string, nombre: string} | null>(null);

  const confirmDelete = (id: string, nombre: string) => {
    setDeleteConfirm({ id, nombre });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deletePerfil(deleteConfirm.id);
      showNotification(`Perfil "${deleteConfirm.nombre}" eliminado.`);
    } catch (error) {
      console.error("Error deleting profile:", error);
      showNotification("Error al eliminar perfil");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleDateString('es-ES', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
    });
  };

  if (view === 'form') {
    return (
      <FormPerfil 
        perfilToEdit={editingPerfil} 
        onBack={() => { 
          setView('list'); 
          setEditingPerfil(null); 
        }} 
      />
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#1F3864] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-blue-400/30 backdrop-blur-md"
          >
            <div className="bg-green-500 p-1 rounded-full text-white">
              <CheckCircle size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{notification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
          <FileText size={24} /> Perfiles
        </h2>
        <Button 
          onClick={() => setView('form')} 
          className="!w-auto !py-2 !px-4 text-xs shadow-md" 
          icon={Plus}
        >
          Crear Nuevo
        </Button>
      </div>

      {perfiles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <FileText className="text-gray-300" size={48} />
          </div>
          <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">No hay perfiles creados</p>
          <p className="text-gray-400 text-xs mt-1">Crea un perfil para empezar a generar protocolos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...perfiles].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).map(perfil => (
            <div 
              key={perfil.ID_PERFIL} 
              className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-1 h-full bg-[#1F3864] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <div>
                <h3 className="font-bold text-[#1F3864] text-lg leading-tight uppercase tracking-tight">{perfil.NOMBRE_PERFIL}</h3>
                <p className="text-[10px] text-gray-500 line-clamp-1 mt-1 font-medium italic">
                  {perfil.NORMA_PROCEDIMIENTO || 'Sin Norma Definida'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-gray-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold uppercase">{formatDate(perfil.timestamp)}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t pt-4 border-gray-50">
                <Button 
                  onClick={() => { 
                    setEditingPerfil(perfil); 
                    setView('form'); 
                  }} 
                  variant="secondary" 
                  className="!py-2 text-xs flex-1" 
                  icon={Pencil}
                >
                  Editar
                </Button>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(perfil.ID_PERFIL, perfil.NOMBRE_PERFIL);
                  }}
                  className="p-3 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer z-10 text-red-500 bg-red-50 hover:bg-red-600 hover:text-white"
                  title="Eliminar Perfil"
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-sm w-full"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">¿Eliminar Perfil?</h3>
                <p className="text-sm text-gray-500">
                  ¿Está seguro que desea eliminar el perfil <strong className="text-gray-900">"{deleteConfirm.nombre}"</strong>? Esta acción no se puede deshacer.
                </p>
                <div className="flex w-full gap-3 pt-4">
                  <Button 
                    variant="secondary" 
                    className="flex-1" 
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    variant="danger" 
                    className="flex-1" 
                    onClick={handleConfirmDelete}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
