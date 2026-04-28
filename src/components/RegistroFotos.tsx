import React, { useState, useRef } from 'react';
import { Camera, ImagePlus, Search, Check, X, Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

export const RegistroFotos: React.FC = () => {
  const { instrumentos, fotos, saveFoto, deleteFoto } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lastCapturedTags, setLastCapturedTags] = useState<string[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [observacion, setObservacion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_RESULTS = 100;
  const filteredInstruments = instrumentos.filter(i => 
    i.TAGNAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (i.DESCRIPCIÓN && i.DESCRIPCIÓN.toLowerCase().includes(searchTerm.toLowerCase()))
  ).slice(0, MAX_RESULTS);

  const tagsParaPrevisualizar = selectedTags.length > 0 ? selectedTags : lastCapturedTags;
  const fotosAPrevisualizar = fotos.filter(f => tagsParaPrevisualizar.includes(f.TAGNAME));

  const [notification, setNotification] = useState<{msg: string, type: 'info' | 'error'} | null>(null);

  const showNotification = (msg: string, type: 'info' | 'error' = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        const fotosDelTag = fotos.filter(f => f.TAGNAME === tag).length;
        if (fotosDelTag >= 4) {
          showNotification("Este TAG ya tiene el máximo de 4 fotos.", "info");
          return prev;
        }
        return [...prev, tag];
      }
    });
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const timestamp = new Date().toISOString();
      let tagsActualizados = 0;

      for (const tag of selectedTags) {
        const fotosDelTag = fotos.filter(f => f.TAGNAME === tag).length;
        let cupoDisponible = 4 - fotosDelTag;
        
        if (cupoDisponible <= 0) continue; 
        
        const archivosAProcesar = files.slice(0, cupoDisponible);

        for (let i = 0; i < archivosAProcesar.length; i++) {
          const file = archivosAProcesar[i] as File;
          const base64 = await compressImage(file);
          
          await saveFoto({
            id: crypto.randomUUID(), 
            TAGNAME: tag, 
            blobData: base64,
            nombre_archivo: `${tag}_${new Date().getTime()}_${i}.jpg`,
            observacion, 
            timestamp, 
            estado: 'pending_upload'
          });
        }
        tagsActualizados++;
      }

      if (tagsActualizados === 0) {
        showNotification("Los TAGs seleccionados ya tienen el límite de 4 fotos.", "error");
      } else {
        setObservacion('');
        setLastCapturedTags([...selectedTags]);
        setSelectedTags([]); 
      }

    } catch (error) {
      console.error(error);
      showNotification("Ocurrió un error al procesar la imagen.", "error");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  if (instrumentos.length === 0) return (
    <div className="p-8 text-center max-w-lg mx-auto">
      <AlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
      <h3 className="text-xl font-bold text-gray-800 mb-2">Base de datos vacía</h3>
      <p className="text-gray-500 mb-6">Carga un listado maestro en Admin antes de registrar fotos.</p>
    </div>
  );

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24 relative">
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              notification.type === 'error' ? 'bg-red-600 border-red-400/30' : 'bg-[#1F3864] border-blue-400/30'
            }`}
          >
            <div className={`p-1 rounded-full text-white ${notification.type === 'error' ? 'bg-red-800' : 'bg-blue-500'}`}>
              <Check size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2"><Camera size={24} /> Registro Fotográfico</h2>
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[500px]">
        <label className="block text-sm font-semibold text-gray-700 mb-2">1. Seleccionar Instrumento</label>
        
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto p-1">
            {selectedTags.map(tag => (
              <span key={tag} className="bg-[#D9E1F2] text-[#1F3864] px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-blue-200 shadow-sm uppercase">
                {tag}
                <button onClick={() => handleToggleTag(tag)} className="hover:bg-blue-300 p-0.5 rounded-full text-blue-800 ml-1">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="relative mb-3 shrink-0">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por TAG o desc..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F3864] text-sm" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50/30 p-1 space-y-0.5 custom-scrollbar">
          {filteredInstruments.length > 0 ? (
            filteredInstruments.map((inst, index) => {
              const isSelected = selectedTags.includes(inst.TAGNAME);
              const fotosDelInst = fotos.filter(f => f.TAGNAME === inst.TAGNAME).length;
              const isDisabled = fotosDelInst >= 4 && !isSelected; 

              return (
                <label 
                  key={`${inst.TAGNAME}-${index}`} 
                  className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg cursor-pointer border transition-all ${
                    isSelected 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : isDisabled 
                    ? 'opacity-40 grayscale pointer-events-none bg-gray-100 border-transparent' 
                    : 'hover:bg-white hover:border-gray-300 border-transparent'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleToggleTag(inst.TAGNAME)}
                    className="w-5 h-5 rounded border-gray-300 text-[#1F3864] focus:ring-[#1F3864]" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold text-sm ${isSelected ? 'text-[#1F3864]' : 'text-gray-800'}`}>
                      {inst.TAGNAME}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate uppercase">{inst.DESCRIPCIÓN || 'Sin descripción'}</div>
                  </div>
                  {fotosDelInst > 0 && (
                    <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${fotosDelInst === 4 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {fotosDelInst === 4 ? <Check size={12} /> : null} {fotosDelInst}/4
                    </div>
                  )}
                </label>
              )
            })
          ) : (
            <div className="p-8 text-sm text-gray-500 text-center uppercase tracking-tight">No se encontraron instrumentos.</div>
          )}
        </div>
      </div>

      {selectedTags.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-[#1F3864]/10 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-gray-800 mb-3 text-xs uppercase tracking-widest">2. Capturar Imagen</h3>
          <input 
            type="text" 
            placeholder="Observación (Opcional)..." 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-[#1F3864] focus:outline-none" 
            value={observacion} 
            onChange={(e) => setObservacion(e.target.value)} 
          />
          <div className="grid grid-cols-2 gap-3">
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageCapture} />
            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleImageCapture} />
            
            <Button onClick={() => cameraInputRef.current?.click()} variant="primary" icon={Camera} disabled={isProcessing}>
              {isProcessing ? 'Procesando...' : 'Cámara'}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" icon={ImagePlus} disabled={isProcessing}>
              Galería
            </Button>
          </div>
        </div>
      )}

      {fotosAPrevisualizar.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-600 mb-3 text-[10px] uppercase tracking-widest">
            {selectedTags.length > 0 ? 'Fotos de la selección actual' : 'Última captura'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {fotosAPrevisualizar.map((foto) => (
              <div key={foto.id} className="relative bg-gray-50 p-2 rounded-xl border border-gray-200 animate-in zoom-in-95">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2 relative group">
                  <img src={foto.blobData} alt="Captura" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFoto(foto.id);
                    }} 
                    className="absolute top-2 right-2 bg-white/95 p-2 rounded-full text-red-600 hover:bg-red-500 hover:text-white shadow-md transition-all active:scale-90 z-10"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="absolute top-2 left-2 bg-[#1F3864]/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm max-w-[75%] truncate uppercase">
                    {foto.TAGNAME}
                  </div>
                </div>
                <p className="text-[10px] text-gray-600 truncate font-medium">{foto.observacion || 'Sin observación'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
