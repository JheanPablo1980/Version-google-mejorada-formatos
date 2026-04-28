import React, { useState, useMemo } from 'react';
import { useAppStore, Foto } from '../store/useAppStore';
import { Image, Search, Trash2, Calendar, Tag, Info, X, ExternalLink, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

export const GaleriaFotos: React.FC = () => {
  const { fotos, deleteFoto, instrumentos } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFoto, setSelectedFoto] = useState<Foto | null>(null);

  const filteredFotos = useMemo(() => {
    return fotos.filter(foto => 
      foto.TAGNAME.toLowerCase().includes(searchTerm.toLowerCase()) ||
      foto.observacion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      foto.nombre_archivo.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [fotos, searchTerm]);

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmingDeleteId !== id) {
      setConfirmingDeleteId(id);
      setTimeout(() => setConfirmingDeleteId(null), 3000);
      return;
    }
    await deleteFoto(id);
    if (selectedFoto?.id === id) setSelectedFoto(null);
    setConfirmingDeleteId(null);
  };

  const getInstrumentInfo = (tagname: string) => {
    return instrumentos.find(i => i.TAGNAME === tagname);
  };

  return (
    <div className="p-4 sm:p-6 pb-20">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#1F3864]">Galería de Fotos</h2>
            <p className="text-slate-500 text-sm">Visualiza y gestiona las capturas realizadas en campo.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por tag o observación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1F3864]/20 focus:border-[#1F3864] outline-none transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Image size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">Total Fotos</p>
              <p className="text-xl font-bold text-slate-800">{fotos.length}</p>
            </div>
          </div>
          {/* Add more stats if needed */}
        </div>

        {/* Grid */}
        {filteredFotos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredFotos.map((foto) => (
                <motion.div
                  layout
                  key={foto.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => setSelectedFoto(foto)}
                  className="group bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative"
                >
                  {/* Image Preview */}
                  <div className="aspect-[4/3] overflow-hidden bg-slate-100 relative">
                    <img 
                      src={foto.blobData} 
                      alt={foto.TAGNAME}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-white">
                         <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(foto.timestamp).toLocaleDateString()}</span>
                         <div className="flex gap-2">
                           <button 
                             onClick={(e) => handleDelete(foto.id, e)}
                             className="p-2 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                           >
                             <Trash2 size={14} />
                           </button>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[#1F3864] truncate">{foto.TAGNAME}</span>
                      <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-full uppercase">
                        {foto.estado}
                      </span>
                    </div>
                    {foto.observacion && (
                      <p className="text-xs text-slate-500 line-clamp-2 italic">
                        "{foto.observacion}"
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Image size={32} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No se encontraron fotos</h3>
            <p className="text-slate-500 text-sm mt-1">Usa la cámara para capturar nuevas imágenes.</p>
          </div>
        )}
      </div>

      {/* Modal Detalle */}
      <AnimatePresence>
        {selectedFoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          >
            <div 
              className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm"
              onClick={() => setSelectedFoto(null)}
            />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden relative z-10 flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Close Button */}
              <button 
                onClick={() => setSelectedFoto(null)}
                className="absolute top-6 right-6 p-3 bg-black/10 hover:bg-black/20 rounded-full transition-all z-20 text-slate-700 md:text-white"
              >
                <X size={24} />
              </button>

              {/* Image Area */}
              <div className="md:flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
                <img 
                  src={selectedFoto.blobData} 
                  alt={selectedFoto.TAGNAME}
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute bottom-6 left-6 flex gap-3">
                   <a 
                     href={selectedFoto.blobData} 
                     download={selectedFoto.nombre_archivo}
                     className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white text-xs font-bold flex items-center gap-2 transition-all"
                   >
                     <Download size={14} /> Descargar
                   </a>
                </div>
              </div>

              {/* Info Sidebar */}
              <div className="w-full md:w-80 bg-white p-8 border-l border-slate-100 overflow-y-auto">
                <div className="space-y-8">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1F3864]">{selectedFoto.TAGNAME}</h3>
                    <p className="text-slate-500 text-sm">{selectedFoto.nombre_archivo}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha y Hora</p>
                        <p className="text-sm font-medium text-slate-700">
                          {new Date(selectedFoto.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                        <Tag size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado</p>
                        <p className="text-sm font-medium text-slate-700 uppercase">
                          {selectedFoto.estado}
                        </p>
                      </div>
                    </div>

                    {selectedFoto.observacion && (
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                          <Info size={18} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observación</p>
                          <p className="text-sm font-medium text-slate-700 italic">
                            "{selectedFoto.observacion}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instrument Data */}
                  {getInstrumentInfo(selectedFoto.TAGNAME) && (
                    <div className="pt-8 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Datos del Instrumento</h4>
                      <div className="space-y-3 bg-slate-50 p-4 rounded-2xl">
                        <div className="text-xs">
                          <span className="text-slate-400">Descripción:</span>
                          <p className="font-medium text-slate-700 truncate">{getInstrumentInfo(selectedFoto.TAGNAME)?.DESCRIPCIÓN}</p>
                        </div>
                        <div className="text-xs">
                          <span className="text-slate-400">Ubicación:</span>
                          <p className="font-medium text-slate-700 font-mono">{getInstrumentInfo(selectedFoto.TAGNAME)?.UBICACIÓN}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-8 space-y-3">
                    <Button 
                      variant="danger" 
                      icon={Trash2} 
                      className="w-full justify-center"
                      onClick={(e) => handleDelete(selectedFoto.id, e as any)}
                    >
                      Eliminar Foto
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
