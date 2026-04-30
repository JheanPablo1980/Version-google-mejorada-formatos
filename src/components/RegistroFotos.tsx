import React, { useState, useRef, useMemo } from 'react';
import { Camera, ImagePlus, Search, Check, X, Trash2, AlertTriangle, Cloud, Loader2, Filter, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

export const RegistroFotos: React.FC = () => {
  const { instrumentos, fotos, saveFoto, deleteFoto, driveFolderLink } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lastCapturedTags, setLastCapturedTags] = useState<string[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoCable, setFiltroTipoCable] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [observacion, setObservacion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{id: string, name: string, mimeType: string, thumbnailLink?: string}[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [selectedDriveFileIds, setSelectedDriveFileIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const MAX_RESULTS = 100;
  
  const ubicacionesUnicas = useMemo(() => {
    const u = new Set(instrumentos.map(i => i.UBICACIÓN).filter(Boolean));
    return Array.from(u).sort();
  }, [instrumentos]);

  const tiposCableUnicos = useMemo(() => {
    const t = new Set(instrumentos.map(i => i.TIPO_CABLE).filter(Boolean));
    return Array.from(t).sort();
  }, [instrumentos]);

  const filteredInstruments = useMemo(() => {
    const filtered = instrumentos.filter(i => {
      const matchesSearch = i.TAGNAME.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.DESCRIPCIÓN && i.DESCRIPCIÓN.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesUbicacion = filtroUbicacion ? i.UBICACIÓN === filtroUbicacion : true;
      const matchesTipo = filtroTipoCable ? i.TIPO_CABLE === filtroTipoCable : true;
      return matchesSearch && matchesUbicacion && matchesTipo;
    });

    return filtered.sort((a, b) => {
      const cmp = a.TAGNAME.localeCompare(b.TAGNAME);
      return sortOrder === 'asc' ? cmp : -cmp;
    }).slice(0, MAX_RESULTS);
  }, [instrumentos, searchTerm, filtroUbicacion, filtroTipoCable, sortOrder]);

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
        return [];
      } else {
        return [tag];
      }
    });
  };

  const handleClearTagPhotos = (tag: string) => {
    const fotosDelTag = fotos.filter(f => f.TAGNAME === tag);
    fotosDelTag.forEach(f => deleteFoto(f.id));
    showNotification(`Se han borrado las fotos del TAG ${tag}.`, 'info');
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const timestamp = new Date().toISOString();
      let tagsActualizados = 0;
      let tagsParaMantener: string[] = [];

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

        if (cupoDisponible - archivosAProcesar.length > 0) {
          tagsParaMantener.push(tag);
        }
      }

      if (tagsActualizados === 0) {
        showNotification("Los TAGs seleccionados ya tienen el límite de 4 fotos.", "error");
      } else {
        if (tagsParaMantener.length === 0) {
          setObservacion('');
        }
        setLastCapturedTags([...selectedTags]);
        setSelectedTags(tagsParaMantener); 
        if (tagsParaMantener.length > 0) {
          showNotification(`Foto guardada. Aún puedes tomar más fotos para los TAGs marcados.`);
        } else {
          showNotification(`Fotos guardadas correctamente.`);
        }
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

  const openDriveModal = async () => {
    if (!driveFolderLink) {
      showNotification("Configura primero el enlace de Google Drive en Admin.", "error");
      return;
    }
    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    if (!apiKey) {
      showNotification("Falta la API Key de Google Drive (.env).", "error");
      return;
    }

    const match = driveFolderLink.match(/folders\/([a-zA-Z0-9-_]+)/);
    const folderId = match ? match[1] : null;
    if (!folderId) {
      showNotification("Enlace de Google Drive inválido.", "error");
      return;
    }

    setIsFetchingDrive(true);
    setIsDriveModalOpen(true);
    setSelectedDriveFileIds([]);

    try {
      let allFiles: any[] = [];
      let pageToken = '';
      
      do {
        const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false+and+mimeType+contains+'image/'&pageSize=1000&fields=nextPageToken,files(id,name,mimeType,thumbnailLink)&key=${apiKey}${tokenParam}`);
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || res.statusText);
        }
        const data = await res.json();
        if (data.files) {
          allFiles = [...allFiles, ...data.files];
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      setDriveFiles(allFiles);
    } catch (e: any) {
      showNotification("Error obteniendo Drive: " + e.message, "error");
      setIsDriveModalOpen(false);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const downloadBase64FromDrive = async (fileId: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    
    let res;
    try {
      res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    } catch (e) {
      try {
        res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
      } catch (proxyError) {
        throw new Error("Error proxy CORS");
      }
    }

    if (!res || !res.ok) throw new Error("No se pudo descargar. Verifica los permisos de la carpeta en Drive.");
    
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleDriveUpload = async () => {
    if (selectedDriveFileIds.length === 0) return;
    setIsProcessing(true);
    
    try {
      const timestamp = new Date().toISOString();
      let tagsActualizados = 0;

      for (const tag of selectedTags) {
        const fotosDelTag = fotos.filter(f => f.TAGNAME === tag).length;
        let cupoDisponible = 4 - fotosDelTag;
        
        if (cupoDisponible <= 0) continue; 
        
        const archivosAProcesarIds = selectedDriveFileIds.slice(0, cupoDisponible);

        for (let i = 0; i < archivosAProcesarIds.length; i++) {
          const fileId = archivosAProcesarIds[i];
          const fileMeta = driveFiles.find(f => f.id === fileId);
          const base64 = await downloadBase64FromDrive(fileId);
          
          await saveFoto({
            id: crypto.randomUUID(), 
            TAGNAME: tag, 
            blobData: base64,
            nombre_archivo: fileMeta ? fileMeta.name : `${tag}_drive_${new Date().getTime()}.jpg`,
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
      setIsDriveModalOpen(false);
    } catch (e: any) {
      showNotification("Error procesando desde Drive: " + e.message, "error");
    } finally {
      setIsProcessing(false);
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

        <div className="flex gap-2 mb-3 shrink-0">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por TAG o desc..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F3864] text-sm" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            className="p-2 border rounded-lg transition-colors flex items-center justify-center bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
            title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
          >
            {sortOrder === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
          </button>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded-lg transition-colors flex items-center justify-center ${showFilters || filtroUbicacion || filtroTipoCable ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
            title="Filtros avanzados"
          >
            <Filter size={18} />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white p-3 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3 shrink-0 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ubicación</label>
              <select 
                value={filtroUbicacion} 
                onChange={(e) => setFiltroUbicacion(e.target.value)}
                className="w-full p-2 text-xs border border-gray-200 rounded bg-gray-50 focus:ring-[#1F3864] focus:outline-none"
              >
                <option value="">Todas</option>
                {ubicacionesUnicas.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Cable</label>
              <select 
                value={filtroTipoCable} 
                onChange={(e) => setFiltroTipoCable(e.target.value)}
                className="w-full p-2 text-xs border border-gray-200 rounded bg-gray-50 focus:ring-[#1F3864] focus:outline-none"
              >
                <option value="">Todos</option>
                {tiposCableUnicos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50/30 p-1 space-y-0.5 custom-scrollbar">
          {filteredInstruments.length > 0 ? (
            filteredInstruments.map((inst, index) => {
              const isSelected = selectedTags.includes(inst.TAGNAME);
              const fotosDelInst = fotos.filter(f => f.TAGNAME === inst.TAGNAME).length;

              return (
                <label 
                  key={`${inst.TAGNAME}-${index}`} 
                  className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg border transition-all ${
                    isSelected 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'hover:bg-white hover:border-gray-300 border-transparent cursor-pointer'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => handleToggleTag(inst.TAGNAME)}
                    className="w-5 h-5 rounded border-gray-300 text-[#1F3864] focus:ring-[#1F3864]" 
                  />
                  <div className="flex-1 min-w-0" onClick={() => handleToggleTag(inst.TAGNAME)}>
                    <div className={`font-bold text-sm cursor-pointer ${isSelected ? 'text-[#1F3864]' : 'text-gray-800'}`}>
                      {inst.TAGNAME}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate uppercase cursor-pointer">{inst.DESCRIPCIÓN || 'Sin descripción'}</div>
                  </div>
                  {fotosDelInst > 0 && (
                    <div className="flex items-center gap-1">
                      <div className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${fotosDelInst === 4 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {fotosDelInst === 4 ? <Check size={12} /> : null} {fotosDelInst}/4
                      </div>
                      {isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleClearTagPhotos(inst.TAGNAME);
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-100 hover:text-red-700 rounded-full transition-colors"
                          title="Eliminar todas las fotos"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
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
          <div className="grid grid-cols-3 gap-2">
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageCapture} />
            <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleImageCapture} />
            
            <Button onClick={() => cameraInputRef.current?.click()} variant="primary" icon={Camera} disabled={isProcessing} className="text-xs px-2">
              {isProcessing ? 'Proc...' : 'Cámara'}
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary" icon={ImagePlus} disabled={isProcessing} className="text-xs px-2">
              Galería
            </Button>
            <Button onClick={openDriveModal} variant="secondary" icon={Cloud} disabled={isProcessing} className="text-xs px-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
              Drive
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

      {/* Drive Modal */}
      <AnimatePresence>
        {isDriveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold text-[#1F3864] flex items-center gap-2">
                  <Cloud size={18} />
                  Seleccionar desde Drive
                </h3>
                <button onClick={() => setIsDriveModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/50">
                {isFetchingDrive ? (
                  <div className="flex flex-col items-center justify-center py-12 text-blue-600">
                    <Loader2 className="animate-spin mb-4" size={32} />
                    <p className="text-sm font-bold uppercase tracking-tight">Cargando archivos...</p>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-sm uppercase tracking-tight font-bold">No hay imágenes en la carpeta</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {driveFiles.map(file => {
                      const isSelected = selectedDriveFileIds.includes(file.id);
                      return (
                        <div 
                          key={file.id} 
                          onClick={() => {
                            setSelectedDriveFileIds(prev => 
                              prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
                            )
                          }}
                          className={`relative aspect-square rounded-lg border-2 cursor-pointer overflow-hidden transition-all ${isSelected ? 'border-blue-500 shadow-md scale-95' : 'border-transparent hover:border-blue-300'}`}
                        >
                          {file.thumbnailLink ? (
                            <img src={file.thumbnailLink} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ImagePlus className="text-gray-400" size={24} />
                            </div>
                          )}
                          <div className={`absolute top-1 right-1 p-0.5 rounded-full ${isSelected ? 'bg-blue-500 text-white' : 'bg-black/20 text-white/50'}`}>
                            <Check size={14} />
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                            <span className="text-[9px] text-white font-medium truncate block">{file.name}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 flex gap-3 bg-white">
                <Button variant="secondary" onClick={() => setIsDriveModalOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleDriveUpload} 
                  disabled={selectedDriveFileIds.length === 0 || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? <Loader2 className="animate-spin" size={18} /> : `Importar (${selectedDriveFileIds.length})`}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
