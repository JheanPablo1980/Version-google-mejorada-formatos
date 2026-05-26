import React, { useState, useRef, useMemo } from 'react';
import { Camera, ImagePlus, Search, Check, X, Trash2, AlertTriangle, Cloud, Loader2, Filter, ArrowDownAZ, ArrowUpZA, FolderOpen, Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

interface LogImportFile {
  id: string;
  file: File;
  name: string;
  matchedTag: string;
  type: 'INSTRUMENTACION' | 'POTENCIA' | null;
  previewUrl: string;
}

export const RegistroFotos: React.FC = () => {
  const { instrumentos, potenciaEquipos, fotos, saveFoto, deleteFoto, driveFolderLink } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<'INSTRUMENTACION' | 'POTENCIA'>('INSTRUMENTACION');
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
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const multiFileInputRef = useRef<HTMLInputElement>(null);

  const [registroMode, setRegistroMode] = useState<'manual' | 'automatico'>('manual');
  const [importFiles, setImportFiles] = useState<LogImportFile[]>([]);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);

  const MAX_RESULTS = 100;

  const currentList = activeCategory === 'INSTRUMENTACION' ? instrumentos : potenciaEquipos;
  const tagKey = activeCategory === 'INSTRUMENTACION' ? 'TAGNAME' : 'TAG';
  
  const ubicacionesUnicas = useMemo(() => {
    if (activeCategory === 'POTENCIA') return [];
    const u = new Set(instrumentos.map(i => i.UBICACIÓN).filter(Boolean));
    return Array.from(u).sort();
  }, [instrumentos, activeCategory]);

  const tiposCableUnicos = useMemo(() => {
    if (activeCategory === 'POTENCIA') return [];
    const t = new Set(instrumentos.map(i => i.TIPO_CABLE).filter(Boolean));
    return Array.from(t).sort();
  }, [instrumentos, activeCategory]);

  const filteredInstruments = useMemo(() => {
    const filtered = currentList.filter(i => {
      const tag = (i as any)[tagKey] || '';
      const matchesSearch = tag.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (i.DESCRIPCIÓN && i.DESCRIPCIÓN.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (activeCategory === 'INSTRUMENTACION') {
        const matchesUbicacion = filtroUbicacion ? (i as any).UBICACIÓN === filtroUbicacion : true;
        const matchesTipo = filtroTipoCable ? (i as any).TIPO_CABLE === filtroTipoCable : true;
        return matchesSearch && matchesUbicacion && matchesTipo;
      }
      return matchesSearch;
    });

    return (filtered as any[]).sort((a, b) => {
      const tagA = (a as any)[tagKey] || '';
      const tagB = (b as any)[tagKey] || '';
      const cmp = tagA.localeCompare(tagB);
      return sortOrder === 'asc' ? cmp : -cmp;
    }).slice(0, MAX_RESULTS);
  }, [currentList, activeCategory, tagKey, searchTerm, filtroUbicacion, filtroTipoCable, sortOrder]);

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
        return [...prev, tag];
      }
    });
  };

  const handleClearTagPhotos = (tag: string) => {
    const fotosDelTag = fotos.filter(f => f.TAGNAME === tag);
    fotosDelTag.forEach(f => deleteFoto(f.id));
    showNotification(`Se han borrado las fotos del TAG ${tag}.`, 'info');
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsProcessing(true);
    try {
      const timestamp = new Date().toISOString();
      const tagsAfectados = new Set<string>();
      let savedCount = 0;
      let limitExceededCount = 0;
      let unmatchedCount = 0;

      for (const file of files) {
        // First try to match filename
        const match = detectTagFromFilename(file.name);
        if (match) {
          const matchedTag = match.tag;
          const currentCount = fotos.filter(f => f.TAGNAME === matchedTag).length;
          
          if (currentCount < 4) {
            const base64 = await compressImage(file);
            await saveFoto({
              id: crypto.randomUUID(),
              TAGNAME: matchedTag,
              blobData: base64,
              nombre_archivo: file.name,
              observacion,
              timestamp,
              estado: 'pending_upload'
            });
            tagsAfectados.add(matchedTag);
            savedCount++;
          } else {
            limitExceededCount++;
          }
        } else {
          // Fallback to manually selected tags
          if (selectedTags.length > 0) {
            let base64Cache = '';
            
            for (const tag of selectedTags) {
              const currentCount = fotos.filter(f => f.TAGNAME === tag).length;
              if (currentCount < 4) {
                if (!base64Cache) {
                  base64Cache = await compressImage(file);
                }
                await saveFoto({
                  id: crypto.randomUUID(),
                  TAGNAME: tag,
                  blobData: base64Cache,
                  nombre_archivo: file.name || `${tag}_${new Date().getTime()}.jpg`,
                  observacion,
                  timestamp,
                  estado: 'pending_upload'
                });
                tagsAfectados.add(tag);
                savedCount++;
              } else {
                limitExceededCount++;
              }
            }
          } else {
            unmatchedCount++;
          }
        }
      }

      if (savedCount > 0) {
        setObservacion('');
        setLastCapturedTags(Array.from(tagsAfectados));
        // Clear only those selected tags that have reached 4 photos
        setSelectedTags(prev => prev.filter(tag => fotos.filter(f => f.TAGNAME === tag).length < 4));
        
        let msg = `Se guardaron ${savedCount} foto(s) correctamente.`;
        if (tagsAfectados.size > 0) {
          msg += ` Vinculadas a: ${Array.from(tagsAfectados).join(', ')}`;
        }
        showNotification(msg, 'info');
      } else {
        if (limitExceededCount > 0 && unmatchedCount === 0) {
          showNotification("Los TAGs ya tienen el límite máximo de 4 fotos.", "error");
        } else if (unmatchedCount > 0) {
          showNotification("No se detectó ningún TAG en los nombres de los archivos. Seleccione un TAG manualmente.", "error");
        } else {
          showNotification("No se procesaron fotos.", "error");
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

  const availableTags = useMemo(() => {
    const list: { tag: string; type: 'INSTRUMENTACION' | 'POTENCIA'; desc: string }[] = [];
    instrumentos.forEach(i => {
      if (i.TAGNAME) {
        list.push({ tag: i.TAGNAME.trim(), type: 'INSTRUMENTACION', desc: i.DESCRIPCIÓN || '' });
      }
    });
    potenciaEquipos.forEach(p => {
      if (p.TAG) {
        list.push({ tag: p.TAG.trim(), type: 'POTENCIA', desc: p.DESCRIPCIÓN || '' });
      }
    });
    return list;
  }, [instrumentos, potenciaEquipos]);

  const detectTagFromFilename = (filename: string): { tag: string; type: 'INSTRUMENTACION' | 'POTENCIA' } | null => {
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
    const upperName = nameWithoutExt.toUpperCase();
    
    const cleanString = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanFile = cleanString(nameWithoutExt);

    let bestMatch: { tag: string; type: 'INSTRUMENTACION' | 'POTENCIA'; length: number } | null = null;

    for (const item of availableTags) {
      const rawTag = item.tag;
      const upperTag = rawTag.toUpperCase();
      const cleanTag = cleanString(rawTag);

      if (cleanTag.length < 2) continue;

      if (upperName.includes(upperTag) || cleanFile.includes(cleanTag)) {
        if (!bestMatch || rawTag.length > bestMatch.length) {
          bestMatch = { tag: rawTag, type: item.type, length: rawTag.length };
        }
      }
    }

    return bestMatch ? { tag: bestMatch.tag, type: bestMatch.type } : null;
  };

  const handleFolderOrFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedList = Array.from(e.target.files || []) as File[];
    if (selectedList.length === 0) return;

    const processed: LogImportFile[] = selectedList.map((file: File) => {
      const match = detectTagFromFilename(file.name);
      return {
        id: crypto.randomUUID(),
        file,
        name: file.name,
        matchedTag: match ? match.tag : '',
        type: match ? match.type : null,
        previewUrl: URL.createObjectURL(file),
      };
    });

    setImportFiles(prev => [...prev, ...processed]);
    
    if (directoryInputRef.current) directoryInputRef.current.value = '';
    if (multiFileInputRef.current) multiFileInputRef.current.value = '';
  };

  const handleRemoveImportFile = (id: string) => {
    const found = importFiles.find(f => f.id === id);
    if (found) {
      URL.revokeObjectURL(found.previewUrl);
    }
    setImportFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleClearImportList = () => {
    importFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setImportFiles([]);
  };

  const startAutoImport = async () => {
    const toImport = importFiles.filter(item => item.matchedTag !== '');
    if (toImport.length === 0) {
      showNotification("Asigna al menos un TAG para iniciar la importación.", "error");
      return;
    }

    setIsProcessing(true);
    setImportProgress({ current: 0, total: toImport.length });

    try {
      const timestamp = new Date().toISOString();
      let importedCount = 0;

      for (let i = 0; i < toImport.length; i++) {
        const item = toImport[i];
        setImportProgress({ current: i + 1, total: toImport.length });

        const fotosDelTag = fotos.filter(f => f.TAGNAME === item.matchedTag).length;
        if (fotosDelTag >= 4) {
          continue;
        }

        try {
          const base64 = await compressImage(item.file);
          
          await saveFoto({
            id: crypto.randomUUID(),
            TAGNAME: item.matchedTag,
            blobData: base64,
            nombre_archivo: item.name,
            observacion: observacion || '',
            timestamp,
            estado: 'pending_upload'
          });
          importedCount++;
        } catch (err) {
          console.error("Error compressing file: ", item.name, err);
        }
      }

      showNotification(`Se han importado y vinculado ${importedCount} fotos con éxito.`, 'info');
      importFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
      setImportFiles([]);
      setObservacion('');
    } catch (err) {
      console.error(err);
      showNotification("Error durante la importación automática.", "error");
    } finally {
      setIsProcessing(false);
      setImportProgress(null);
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

      {/* Progress Overlay for Automatic Loading */}
      <AnimatePresence>
        {importProgress && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm text-center space-y-4 border border-gray-100"
            >
              <Loader2 className="animate-spin mx-auto text-blue-600" size={36} />
              <div className="space-y-1">
                <h4 className="font-bold text-[#1F3864] text-xs uppercase tracking-wider">Modo Automático</h4>
                <p className="text-xs text-gray-500 font-medium font-mono">
                  Procesando, comprimiendo y guardando:<br />
                  {importProgress.current} de {importProgress.total} fotos
                </p>
              </div>
              <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400">Por favor, no cierres esta pestaña</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2"><Camera size={24} /> Registro Fotográfico</h2>

      {/* Selector de Modo de Registro */}
      <div className="bg-white p-1.5 rounded-xl border border-gray-100 flex gap-2 shrink-0 shadow-sm">
        <button
          type="button"
          onClick={() => setRegistroMode('manual')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
            registroMode === 'manual'
              ? 'bg-[#1F3864] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Camera size={14} /> Modo Manual
        </button>
        <button
          type="button"
          onClick={() => setRegistroMode('automatico')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-center gap-2 ${
            registroMode === 'automatico'
              ? 'bg-[#1F3864] text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FolderOpen size={14} /> Modo Automático
        </button>
      </div>

      {registroMode === 'manual' ? (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col max-h-[500px]">
            {/* Selector de Categoría (Instrumentación / Potencia) */}
            <div className="grid grid-cols-2 gap-3 mb-4 shrink-0">
              <button
                onClick={() => { setActiveCategory('INSTRUMENTACION'); setSelectedTags([]); }}
                className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-2 flex items-center justify-center gap-2 ${
                  activeCategory === 'INSTRUMENTACION' 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100 ring-2 ring-blue-50' 
                  : 'bg-white border-blue-50 text-blue-400 hover:border-blue-200 hover:text-blue-600'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'INSTRUMENTACION' ? 'bg-white animate-pulse' : 'bg-blue-100'}`} />
                Instrumentación
              </button>
              <button
                onClick={() => { setActiveCategory('POTENCIA'); setSelectedTags([]); }}
                className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-2 flex items-center justify-center gap-2 ${
                  activeCategory === 'POTENCIA' 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-100 ring-2 ring-orange-50' 
                  : 'bg-white border-orange-50 text-orange-400 hover:border-orange-200 hover:text-orange-600'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'POTENCIA' ? 'bg-white animate-pulse' : 'bg-orange-100'}`} />
                Potencia
              </button>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">1. Seleccionar {activeCategory === 'POTENCIA' ? 'Equipo' : 'Instrumento'}</label>
            
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto p-1 font-sans">
                {selectedTags.map(tag => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border shadow-sm uppercase ${activeCategory === 'POTENCIA' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-[#D9E1F2] text-[#1F3864] border-blue-200'}`}>
                    {tag}
                    <button onClick={() => handleToggleTag(tag)} className={`p-0.5 rounded-full ml-1 ${activeCategory === 'POTENCIA' ? 'hover:bg-orange-200 text-orange-800' : 'hover:bg-blue-300 text-blue-800'}`}>
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
                  placeholder={`Buscar por ${activeCategory === 'POTENCIA' ? 'TAG' : 'TAGNAME'} o desc...`} 
                  className={`w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 ${activeCategory === 'POTENCIA' ? 'focus:ring-orange-600' : 'focus:ring-[#1F3864]'}`} 
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
              
              {activeCategory === 'INSTRUMENTACION' && (
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 border rounded-lg transition-colors flex items-center justify-center ${showFilters || filtroUbicacion || filtroTipoCable ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                  title="Filtros avanzados"
                >
                  <Filter size={18} />
                </button>
              )}
            </div>

            {showFilters && activeCategory === 'INSTRUMENTACION' && (
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
                filteredInstruments.map((inst: any, index) => {
                  const tag = inst[tagKey];
                  const isSelected = selectedTags.includes(tag);
                  const fotosDelInst = fotos.filter(f => f.TAGNAME === tag).length;

                  return (
                    <label 
                      key={`${tag}-${index}`} 
                      className={`flex items-center gap-3 w-full text-left p-2.5 rounded-lg border transition-all ${
                        isSelected 
                        ? activeCategory === 'POTENCIA' ? 'bg-orange-50 border-orange-300 shadow-sm' : 'bg-blue-50 border-blue-300 shadow-sm' 
                        : 'hover:bg-white hover:border-gray-300 border-transparent cursor-pointer'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleTag(tag)}
                        className={`w-5 h-5 rounded border-gray-300 ${activeCategory === 'POTENCIA' ? 'text-orange-600 focus:ring-orange-600' : 'text-[#1F3864] focus:ring-[#1F3864]'}`} 
                      />
                      <div className="flex-1 min-w-0" onClick={() => handleToggleTag(tag)}>
                        <div className={`font-bold text-sm cursor-pointer ${isSelected ? activeCategory === 'POTENCIA' ? 'text-orange-700' : 'text-[#1F3864]' : 'text-gray-800'}`}>
                          {tag}
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
                                handleClearTagPhotos(tag);
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
                <div className="p-8 text-sm text-gray-500 text-center uppercase tracking-tight">No se encontraron resultados.</div>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-[#1F3864]/10 animate-in fade-in slide-in-from-bottom-4 space-y-3">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center justify-between">
              <span>2. Capturar Imagen</span>
              {selectedTags.length === 0 ? (
                <span className="text-[9px] font-black uppercase tracking-widest text-[#1F3864] bg-[#D9E1F2] px-2 py-0.5 rounded-full">
                  Automatch Activo
                </span>
              ) : (
                <span className="text-[9px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                  Asignación Manual ({selectedTags.length})
                </span>
              )}
            </h3>

            {selectedTags.length === 0 ? (
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold uppercase tracking-tight">
                No tienes TAGs seleccionados. Sube fotos directamente mediante Cámara o Galería y el detector asociará cada una al TAG correspondiente según su nombre de archivo de forma automática.
              </p>
            ) : (
              <p className="text-[10px] text-gray-500 leading-relaxed font-semibold uppercase tracking-tight">
                Se guardarán las fotos en los {selectedTags.length} TAGs seleccionados: <span className="text-[#1F3864] font-bold">{selectedTags.join(', ')}</span>. Los archivos cuyos nombres contengan un TAG exacto se asignarán prioritariamente a dicho TAG (Automatch).
              </p>
            )}

            <input 
              type="text" 
              placeholder="Observación general (Opcional)..." 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F3864] focus:outline-none" 
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

          {fotosAPrevisualizar.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-600 mb-3 text-[10px] uppercase tracking-widest">
                {selectedTags.length > 0 ? 'Fotos de la selección actual' : 'Última captura'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {fotosAPrevisualizar.map((foto) => (
                  <div key={foto.id} className="relative bg-gray-50 p-2 rounded-xl border border-gray-200 animate-in zoom-in-95">
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden mb-2 relative group">
                      <img src={foto.blobData} alt="Captura" className="w-full h-full object-cover transition-transform group-hover:scale-105" referrerPolicy="no-referrer" />
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
        </>
      ) : (
        /* UI de Relación y Carga Automática */
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="space-y-1">
              <h3 className="font-bold text-[#1F3864] text-xs uppercase tracking-wider">Relación Automática de Fotos</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Selecciona una carpeta local de fotos o un grupo de imágenes. El programa extraerá los nombres de archivo y buscará coincidencias con los TAGNAMEs e identificar los TAGs equivalentes al instante.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <input 
                type="file" 
                multiple 
                {...{ webkitdirectory: "", directory: "" }} 
                className="hidden" 
                ref={directoryInputRef} 
                onChange={handleFolderOrFilesSelect} 
              />
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={multiFileInputRef} 
                onChange={handleFolderOrFilesSelect} 
              />

              <button
                type="button"
                onClick={() => directoryInputRef.current?.click()}
                disabled={isProcessing}
                className="py-4 px-3 bg-blue-50/70 hover:bg-blue-100/90 text-[#1F3864] border-2 border-dashed border-blue-200 rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <FolderOpen size={24} className="text-blue-600" />
                Seleccionar Carpeta
              </button>

              <button
                type="button"
                onClick={() => multiFileInputRef.current?.click()}
                disabled={isProcessing}
                className="py-4 px-3 bg-gray-50/70 hover:bg-gray-100/90 text-gray-700 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all"
              >
                <Upload size={24} className="text-gray-500" />
                Cargar Archivos
              </button>
            </div>

            <div className="space-y-2 pt-2">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observación por defecto (Opcional)</label>
              <input 
                type="text" 
                placeholder="Ej. Foto cargada en lote..." 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1F3864] focus:outline-none" 
                value={observacion} 
                onChange={(e) => setObservacion(e.target.value)} 
              />
            </div>
          </div>

          {importFiles.length > 0 && (
            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 shrink-0">
                <div>
                  <h4 className="font-bold text-[#1F3864] text-xs uppercase tracking-wide">Relación de Fotos extraídas</h4>
                  <p className="text-[10px] text-gray-400 font-mono font-medium">{importFiles.length} imágenes cargadas</p>
                </div>
                <button
                  type="button"
                  onClick={handleClearImportList}
                  disabled={isProcessing}
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition-colors"
                >
                  Limpiar lista
                </button>
              </div>

              <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                {importFiles.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100 items-center justify-between">
                    <div className="flex gap-3 items-center min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 shrink-0 border border-gray-200">
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-bold text-gray-700 truncate" title={item.name}>{item.name}</p>
                        <select
                          value={item.matchedTag}
                          disabled={isProcessing}
                          onChange={(e) => {
                            const val = e.target.value;
                            const tagObj = availableTags.find(t => t.tag === val);
                            setImportFiles(prev => prev.map(f => f.id === item.id ? {
                              ...f,
                              matchedTag: val,
                              type: tagObj ? tagObj.type : null
                            } : f));
                          }}
                          className={`text-[11px] px-2 py-1.5 border rounded-lg focus:outline-none bg-white font-bold max-w-[160px] truncate ${
                            item.matchedTag 
                              ? 'border-green-200 text-green-700 bg-green-50/30' 
                              : 'border-red-200 text-red-500 bg-red-50/10'
                          }`}
                        >
                          <option value="">-- No asignado (Ignorar) --</option>
                          <optgroup label="Instrumentación">
                            {availableTags.filter(t => t.type === 'INSTRUMENTACION').map(t => (
                              <option key={`opt-inst-${item.id}-${t.tag}`} value={t.tag}>{t.tag}</option>
                            ))}
                          </optgroup>
                          <optgroup label="Potencia">
                            {availableTags.filter(t => t.type === 'POTENCIA').map(t => (
                              <option key={`opt-pot-${item.id}-${t.tag}`} value={t.tag}>{t.tag}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0 select-none">
                      {item.matchedTag ? (
                        <span className="text-[8px] font-black uppercase bg-green-100 text-green-700 px-2.5 py-1 rounded-full tracking-widest animate-in fade-in">
                          Auto Match
                        </span>
                      ) : (
                        <span className="text-[8px] font-black uppercase bg-red-100 text-red-600 px-2.5 py-1 rounded-full tracking-widest animate-in fade-in">
                          Sin Tag
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImportFile(item.id)}
                        disabled={isProcessing}
                        className="p-1 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <Button
                  onClick={startAutoImport}
                  variant="primary"
                  disabled={isProcessing || importFiles.filter(i => i.matchedTag !== '').length === 0}
                  className="w-full py-3.5 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100"
                >
                  {isProcessing ? 'Guardando...' : `Vincular e Importar (${importFiles.filter(i => i.matchedTag !== '').length})`}
                </Button>
              </div>
            </div>
          )}
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
