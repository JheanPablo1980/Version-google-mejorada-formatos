import React, { useState } from 'react';
import { FileText, Plus, Pencil, Trash2, AlertTriangle, Clock, CheckCircle, Zap, Activity, ArrowLeft } from 'lucide-react';
import { useAppStore, Perfil } from '../store/useAppStore';
import { Button } from './ui/Button';
import { FormPerfil } from './FormPerfil';
import { motion, AnimatePresence } from 'motion/react';
import { PERFIL_INICIAL, PERFIL_POTENCIA_INICIAL, PERFIL_POTENCIA_COM_INICIAL } from '../constants';

export const ListaPerfiles: React.FC = () => {
  const { perfiles, deletePerfil } = useAppStore();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [selectedCategory, setSelectedCategory] = useState<'INSTRUMENTACION' | 'POTENCIA' | 'POTENCIA_COM' | null>(null);
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

  const handleCreateNew = () => {
    if (!selectedCategory) return;
    let baseData;
    if (selectedCategory === 'INSTRUMENTACION') baseData = PERFIL_INICIAL;
    else if (selectedCategory === 'POTENCIA') baseData = PERFIL_POTENCIA_INICIAL;
    else baseData = PERFIL_POTENCIA_COM_INICIAL;
    setEditingPerfil({ ...baseData, ID_PERFIL: crypto.randomUUID() } as Perfil);
    setView('form');
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

  const filteredPerfiles = perfiles.filter(p => p.TIPO === selectedCategory);
  const categoryTitle = selectedCategory === 'INSTRUMENTACION' ? 'Instrumentación' : 
                        selectedCategory === 'POTENCIA' ? 'Potencia (Precom)' : 
                        selectedCategory === 'POTENCIA_COM' ? 'Potencia (Com)' : '';

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

      {!selectedCategory ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-[#1F3864] uppercase tracking-tighter italic">Gestión de Perfiles</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Selecciona una categoría para gestionar protocolos</p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <button
              onClick={() => setSelectedCategory('INSTRUMENTACION')}
              className="group p-6 bg-white border-2 border-blue-100 hover:border-blue-600 rounded-3xl shadow-xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-all flex items-center gap-6 text-left active:scale-[0.98]"
            >
              <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Activity size={40} />
              </div>
              <div className="flex-1">
                <span className="block font-black text-[#1F3864] text-xl uppercase tracking-tighter group-hover:text-blue-700 transition-colors">Instrumentación</span>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70">Calibración, lazos e inspección</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-blue-300 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <CheckCircle size={20} />
              </div>
            </button>

            <button
              onClick={() => setSelectedCategory('POTENCIA')}
              className="group p-6 bg-white border-2 border-orange-100 hover:border-orange-600 rounded-3xl shadow-xl shadow-orange-900/5 hover:shadow-orange-900/10 transition-all flex items-center gap-6 text-left active:scale-[0.98]"
            >
              <div className="p-4 bg-orange-50 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                <Zap size={40} />
              </div>
              <div className="flex-1">
                <span className="block font-black text-[#1F3864] text-xl uppercase tracking-tighter group-hover:text-orange-700 transition-colors">Potencia (Precom)</span>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70">Transformadores, motores y tableros</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-orange-300 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                <CheckCircle size={20} />
              </div>
            </button>

            <button
              onClick={() => setSelectedCategory('POTENCIA_COM')}
              className="group p-6 bg-white border-2 border-red-100 hover:border-red-600 rounded-3xl shadow-xl shadow-red-900/5 hover:shadow-red-900/10 transition-all flex items-center gap-6 text-left active:scale-[0.98]"
            >
              <div className="p-4 bg-red-50 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                <CheckCircle size={40} />
              </div>
              <div className="flex-1">
                <span className="block font-black text-[#1F3864] text-sm uppercase tracking-tighter group-hover:text-red-700 transition-colors whitespace-nowrap">Potencia (Comisionamiento)</span>
                <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-70">Motor Eléctrico Bajo Voltaje</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-red-300 group-hover:bg-red-50 group-hover:text-red-600 transition-all">
                <CheckCircle size={20} />
              </div>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in side-in-from-right-4 duration-300">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-700 transition-all active:scale-90"
              title="Volver"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h2 className="text-xl font-black text-[#1F3864] uppercase tracking-tighter">{categoryTitle}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Gestión de formatos y firmas</p>
            </div>
          </div>

          <div className="flex gap-2">
             <Button 
              onClick={handleCreateNew} 
              className={`flex-[2] shadow-md font-black uppercase tracking-widest ${selectedCategory === 'INSTRUMENTACION' ? 'bg-blue-600 hover:bg-blue-700' : selectedCategory === 'POTENCIA' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`} 
              icon={Plus}
            >
              Nuevo Perfil
            </Button>
            <Button
              onClick={() => setSelectedCategory(null)}
              variant="secondary"
              className="flex-1 text-[10px] uppercase font-black tracking-widest py-2"
              icon={ArrowLeft}
            >
              Regresar
            </Button>
          </div>

          {filteredPerfiles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <FileText className="text-gray-200" size={48} />
              </div>
              <p className="text-gray-400 font-black text-xs uppercase tracking-widest">No hay perfiles en esta categoría</p>
              <button 
                onClick={handleCreateNew}
                className="mt-4 text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline"
              >
                Crear el primero ahora
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {[...filteredPerfiles].sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()).map(perfil => (
                <div 
                  key={perfil.ID_PERFIL} 
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all group"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="font-black text-[#1F3864] text-sm uppercase tracking-tight truncate">{perfil.NOMBRE_PERFIL}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={10} className="text-gray-300" />
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{formatDate(perfil.timestamp)}</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <button 
                      onClick={() => { 
                        setEditingPerfil(perfil); 
                        setView('form'); 
                      }} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => confirmDelete(perfil.ID_PERFIL, perfil.NOMBRE_PERFIL)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
