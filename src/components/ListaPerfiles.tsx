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

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string, nombre: string) => {
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      setTimeout(() => setConfirmingDeleteId(null), 3000);
      return;
    }

    try {
      await deletePerfil(id);
      showNotification(`Perfil "${nombre}" eliminado.`);
      setConfirmingDeleteId(null);
    } catch (error) {
      console.error("Error deleting profile:", error);
      showNotification("Error al eliminar perfil");
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
                    handleDelete(perfil.ID_PERFIL, perfil.NOMBRE_PERFIL);
                  }}
                  className={`p-3 rounded-xl transition-all active:scale-95 shadow-sm cursor-pointer z-10 ${
                    confirmingDeleteId === perfil.ID_PERFIL 
                      ? "bg-red-600 text-white animate-pulse" 
                      : "text-red-500 bg-red-50 hover:bg-red-600 hover:text-white"
                  }`}
                  title={confirmingDeleteId === perfil.ID_PERFIL ? "Confirmar eliminar" : "Eliminar Perfil"}
                >
                  <Trash2 size={20}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
