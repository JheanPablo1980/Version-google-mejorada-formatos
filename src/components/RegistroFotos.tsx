import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Camera, ImagePlus, Search, Check, X, Trash2, AlertTriangle, Cloud, Loader2, Filter, ArrowDownAZ, ArrowUpZA, Upload, Sparkles, AlertCircle, FileImage, Folder, FolderOpen, ChevronRight, ChevronDown, Layers, MapPin } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { compressImage } from '../lib/imageUtils';
import { motion, AnimatePresence } from 'motion/react';

export const RegistroFotos: React.FC = () => {
  const { instrumentos, potenciaEquipos, fotos, saveFoto, deleteFoto, driveFolderLink, appSettings } = useAppStore();
  const [activeCategory, setActiveCategory] = useState<'INSTRUMENTACION' | 'POTENCIA'>(
    appSettings.enableGenInstrumentacion ? 'INSTRUMENTACION' : 'POTENCIA'
  );
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [lastCapturedTags, setLastCapturedTags] = useState<string[]>([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoCable, setFiltroTipoCable] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [observacion, setObservacion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fotoFilter, setFotoFilter] = useState<'all' | 'with' | 'without'>('all');
  const [confirmClearData, setConfirmClearData] = useState<{
    message: string;
    tagsToClear: string[];
    fotosToClear: any[];
  } | null>(null);

  // Estados para Modo Automático
  const [uploadMode, setUploadMode] = useState<'manual' | 'auto'>(
    appSettings.enableUploadManual ? 'manual' : (appSettings.enableUploadAuto ? 'auto' : 'manual')
  );

  useEffect(() => {
    if (!appSettings.enableUploadManual && uploadMode === 'manual') {
      if (appSettings.enableUploadAuto) {
        setUploadMode('auto');
      }
    } else if (!appSettings.enableUploadAuto && uploadMode === 'auto') {
      if (appSettings.enableUploadManual) {
        setUploadMode('manual');
      }
    }
  }, [appSettings.enableUploadManual, appSettings.enableUploadAuto, uploadMode]);

  const [autoPreviews, setAutoPreviews] = useState<any[]>([]);
  const [autoIsDragging, setAutoIsDragging] = useState(false);
  const [isProcessingAuto, setIsProcessingAuto] = useState(false);
  const fileInputAutoRef = useRef<HTMLInputElement>(null);
  const [isHoveringDropzone, setIsHoveringDropzone] = useState(false);
  const [selectedAutoTagFilter, setSelectedAutoTagFilter] = useState<string | null>(null);
  const [autoStatusFilter, setAutoStatusFilter] = useState<'all' | 'success' | 'warning' | 'error'>('all');

  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [driveFiles, setDriveFiles] = useState<{id: string, name: string, mimeType: string, thumbnailLink?: string}[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [selectedDriveFileIds, setSelectedDriveFileIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

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
      
      let initialMatch = matchesSearch;
      if (activeCategory === 'INSTRUMENTACION') {
        const matchesUbicacion = filtroUbicacion ? (i as any).UBICACIÓN === filtroUbicacion : true;
        const matchesTipo = filtroTipoCable ? (i as any).TIPO_CABLE === filtroTipoCable : true;
        initialMatch = matchesSearch && matchesUbicacion && matchesTipo;
      }
      
      if (!initialMatch) return false;

      const fotosDelInst = fotos.filter(f => f.TAGNAME === tag).length;
      if (fotoFilter === 'with') {
        return fotosDelInst > 0;
      }
      if (fotoFilter === 'without') {
        return fotosDelInst === 0;
      }
      return true;
    });

    return (filtered as any[]).sort((a, b) => {
      const tagA = (a as any)[tagKey] || '';
      const tagB = (b as any)[tagKey] || '';
      const cmp = tagA.localeCompare(tagB);
      return sortOrder === 'asc' ? cmp : -cmp;
    }).slice(0, MAX_RESULTS);
  }, [currentList, activeCategory, tagKey, searchTerm, filtroUbicacion, filtroTipoCable, sortOrder, fotoFilter, fotos]);

  const uniqueTagsInBatch = useMemo(() => {
    const tags: Record<string, { count: number; status: 'success' | 'warning' | 'error'; description?: string }> = {};
    
    const currentList = activeCategory === 'INSTRUMENTACION' ? instrumentos : potenciaEquipos;
    const tagKey = activeCategory === 'INSTRUMENTACION' ? 'TAGNAME' : 'TAG';
    
    autoPreviews.forEach(item => {
      const tag = item.matchedTag;
      if (tag) {
        if (!tags[tag]) {
          const matchingElement = currentList.find(c => (c as any)[tagKey] === tag);
          tags[tag] = { 
            count: 0, 
            status: 'success',
            description: matchingElement?.DESCRIPCIÓN || 'Sin descripción'
          };
        }
        tags[tag].count += 1;
        
        if (item.status === 'error') {
          tags[tag].status = 'error';
        } else if (item.status === 'warning' && tags[tag].status !== 'error') {
          tags[tag].status = 'warning';
        }
      }
    });

    return Object.keys(tags).sort().map(tag => ({
      tag,
      count: tags[tag].count,
      status: tags[tag].status,
      description: tags[tag].description
    }));
  }, [autoPreviews, activeCategory, instrumentos, potenciaEquipos]);



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

  const handleBatchClearPhotos = () => {
    const tagsToClear = selectedTags.length > 0
      ? selectedTags
      : filteredInstruments.map((i: any) => i[tagKey]);

    if (tagsToClear.length === 0) {
      showNotification("No hay TAGs para limpiar.", "error");
      return;
    }

    const fotosToClear = fotos.filter(f => tagsToClear.includes(f.TAGNAME));
    if (fotosToClear.length === 0) {
      showNotification("No hay fotos asociadas para limpiar en los TAGs indicados.", "info");
      return;
    }

    const confirmMsg = selectedTags.length > 0
      ? `¿Estás seguro de que deseas eliminar todas las fotos de los ${selectedTags.length} TAGs seleccionados? (${fotosToClear.length} fotos de forma permanente)`
      : `¿Estás seguro de que deseas eliminar todas las fotos de los ${filteredInstruments.length} TAGs mostrados en la lista? (${fotosToClear.length} fotos de forma permanente)`;

    setConfirmClearData({
      message: confirmMsg,
      tagsToClear,
      fotosToClear
    });
  };

  const executeBatchClear = async () => {
    if (!confirmClearData) return;
    setIsProcessing(true);
    try {
      let count = 0;
      for (const f of confirmClearData.fotosToClear) {
        await deleteFoto(f.id);
        count++;
      }
      showNotification(`Se han eliminado ${count} fotos con éxito.`, "info");
      if (selectedTags.length > 0) {
        setSelectedTags([]);
      }
    } catch (err) {
      console.error(err);
      showNotification("Error al eliminar algunas fotos.", "error");
    } finally {
      setIsProcessing(false);
      setConfirmClearData(null);
    }
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

  // --- MÉTODOS PARA EL MODO AUTOMÁTICO DE RECONOCIMIENTO ---

  const sortedAllTagsForDropdown = useMemo(() => {
    const list = activeCategory === 'INSTRUMENTACION' ? instrumentos : potenciaEquipos;
    const key = activeCategory === 'INSTRUMENTACION' ? 'TAGNAME' : 'TAG';
    return list.map((item: any) => item[key]).filter(Boolean).sort();
  }, [instrumentos, potenciaEquipos, activeCategory]);

  const recalculateAutoPreviewStatuses = (items: any[]) => {
    const countsPerTag: Record<string, number> = {};
    
    return items.map(item => {
      const tag = item.matchedTag;
      if (!tag) {
        return {
          ...item,
          status: 'warning',
          message: 'Sin coincidencia'
        };
      }
      
      // Calcular fotos actualmente en DB
      const dbCount = fotos.filter(f => f.TAGNAME === tag).length;
      const batchCount = countsPerTag[tag] || 0;
      const totalCount = dbCount + batchCount + 1;
      
      if (totalCount > 4) {
        return {
          ...item,
          status: 'error',
          message: `Supera límite (Tiene: ${dbCount}, Lote: ${batchCount + 1}/Máx 4)`
        };
      }
      
      countsPerTag[tag] = batchCount + 1;
      return {
        ...item,
        status: 'success',
        message: `Asignado a ${tag}`
      };
    });
  };

  const handleQueueAutoFiles = async (newFiles: File[]) => {
    setIsProcessingAuto(true);
    try {
      const currentList = activeCategory === 'INSTRUMENTACION' ? instrumentos : potenciaEquipos;
      const tagKey = activeCategory === 'INSTRUMENTACION' ? 'TAGNAME' : 'TAG';

      // Preparar y ordenar los TAGs (por longitud de mayor a menor para calzar el más largo primero)
      const tagsListClean = currentList.map(item => {
        const originalTag = (item as any)[tagKey] || '';
        return {
          originalTag,
          normalizedTag: originalTag.toLowerCase().replace(/[^a-zA-Z0-9]/g, '')
        };
      }).filter(x => x.originalTag);

      tagsListClean.sort((a, b) => b.normalizedTag.length - a.normalizedTag.length);

      const processedItems: any[] = [];

      for (const file of newFiles) {
        const base64 = await compressImage(file);
        const fileNameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        const normalizedFile = fileNameWithoutExt.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');

        // Buscar coincidencia robusta
        const matched = tagsListClean.find(t => {
          if (!t.normalizedTag) return false;
          return normalizedFile.includes(t.normalizedTag);
        });

        const matchedTagStr = matched ? matched.originalTag : null;

        processedItems.push({
          tempId: crypto.randomUUID(),
          fileName: file.name,
          blobData: base64,
          matchedTag: matchedTagStr,
          observacion: '',
          status: 'warning',
          message: ''
        });
      }

      // Añadir al listado existente y recalcular
      setAutoPreviews(prev => {
        const combined = [...prev, ...processedItems];
        return recalculateAutoPreviewStatuses(combined);
      });
      
      showNotification("Por favor, recuerda guardar las fotos válidas para finalizar.", "info");

    } catch (err) {
      console.error("Error processing auto files:", err);
      showNotification("Error procesando lote de imágenes.", "error");
    } finally {
      setIsProcessingAuto(false);
      if (fileInputAutoRef.current) fileInputAutoRef.current.value = '';
    }
  };

  const handleUpdateItemTag = (tempId: string, newTag: string) => {
    setAutoPreviews(prev => {
      const updated = prev.map(item => 
        item.tempId === tempId 
          ? { ...item, matchedTag: newTag || null } 
          : item
      );
      return recalculateAutoPreviewStatuses(updated);
    });
  };

  const handleUpdateItemObs = (tempId: string, obs: string) => {
    setAutoPreviews(prev => 
      prev.map(item => 
        item.tempId === tempId ? { ...item, observacion: obs } : item
      )
    );
  };

  const handleUpdateItemFileName = (tempId: string, newFileName: string) => {
    setAutoPreviews(prev => 
      prev.map(item => 
        item.tempId === tempId ? { ...item, fileName: newFileName } : item
      )
    );
  };

  const handleDeleteItem = (tempId: string) => {
    setAutoPreviews(prev => {
      const updated = prev.filter(item => item.tempId !== tempId);
      return recalculateAutoPreviewStatuses(updated);
    });
  };

  const handleSaveAutoLot = async () => {
    const validItems = autoPreviews.filter(item => item.status === 'success');
    if (validItems.length === 0) {
      showNotification("No hay fotos válidas para guardar.", "error");
      return;
    }

    setIsProcessingAuto(true);
    try {
      const timestamp = new Date().toISOString();
      let countSaved = 0;

      for (const item of validItems) {
        await saveFoto({
          id: crypto.randomUUID(),
          TAGNAME: item.matchedTag!,
          blobData: item.blobData,
          nombre_archivo: item.fileName,
          observacion: item.observacion || observacion,
          timestamp,
          estado: 'pending_upload'
        });
        countSaved++;
      }

      showNotification(`Se han guardado ${countSaved} fotos correctamente.`, 'info');
      
      // Limpiar fotos guardadas exitosamente, dejar las que tienen advertencias o errores para que el usuario las resuelva
      setAutoPreviews(prev => {
        const remaining = prev.filter(item => item.status !== 'success');
        return recalculateAutoPreviewStatuses(remaining);
      });

    } catch (err) {
      console.error(err);
      showNotification("Ocurrió un error al guardar el lote de fotos.", "error");
    } finally {
      setIsProcessingAuto(false);
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
    <div className="p-4 space-y-6 max-w-6xl mx-auto pb-24 relative">
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
      
      {/* Selector de Modo (Manual / Automático) */}
      {(appSettings.enableUploadManual || appSettings.enableUploadAuto) && (
        <div className="flex gap-2 border-b-[3px] border-[#1F3864] px-2 md:px-4 pt-2 mb-6 overflow-x-auto custom-scrollbar shrink-0">
          {appSettings.enableUploadManual && (
            <button
              onClick={() => setUploadMode('manual')}
              className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                uploadMode === 'manual'
                ? 'bg-white text-[#1F3864] text-[15px]'
                : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
              }`}
            >
              <Camera size={16} />
              <span>MODO MANUAL</span>
            </button>
          )}
          {appSettings.enableUploadAuto && (
            <button
              onClick={() => setUploadMode('auto')}
              className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                uploadMode === 'auto'
                ? 'bg-white text-[#1F3864] text-[15px]'
                : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
              }`}
            >
              <Sparkles size={16} className={uploadMode === 'auto' ? 'text-yellow-400 fill-yellow-400 animate-pulse' : 'text-[#64748B]'} />
              <span>CARGA MASIVA AUTOMÁTICA</span>
            </button>
          )}
        </div>
      )}

      {!appSettings.enableUploadManual && !appSettings.enableUploadAuto && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl text-center shadow-sm">
          No hay modos de subida habilitados. Habilítalos en el menú de administrador.
        </div>
      )}

      {uploadMode === 'manual' && appSettings.enableUploadManual ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Listado de Tags Planos */}
          <div className="md:col-span-5 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[500px] md:h-[620px]">
            {/* Selector de Categoría (Instrumentación / Potencia) */}
            <div className="grid gap-3 mb-4 shrink-0 grid-cols-1 sm:grid-cols-2">
              {appSettings.enableGenInstrumentacion && (
                <button
                  onClick={() => { setActiveCategory('INSTRUMENTACION'); setSelectedTags([]); setFotoFilter('all'); }}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-2 flex items-center justify-center gap-2 ${
                    activeCategory === 'INSTRUMENTACION' 
                    ? 'bg-[#1F3864] border-[#1F3864] text-white shadow-md' 
                    : 'bg-white border-[#D9E1F2] text-[#64748B] hover:border-[#1F3864] hover:text-[#1F3864]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'INSTRUMENTACION' ? 'bg-white animate-pulse' : 'bg-current'}`} />
                  INSTRUMENTACIÓN
                </button>
              )}
              {appSettings.enableGenPotencia && (
                <button
                  onClick={() => { setActiveCategory('POTENCIA'); setSelectedTags([]); setFotoFilter('all'); }}
                  className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-2 flex items-center justify-center gap-2 ${
                    activeCategory === 'POTENCIA' 
                    ? 'bg-[#1F3864] border-[#1F3864] text-white shadow-md' 
                    : 'bg-white border-[#D9E1F2] text-[#64748B] hover:border-[#1F3864] hover:text-[#1F3864]'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'POTENCIA' ? 'bg-white animate-pulse' : 'bg-current'}`} />
                  POTENCIA
                </button>
              )}
            </div>

            <label className="block text-sm font-semibold text-gray-750 mb-2.5">1. Seleccionar {activeCategory === 'POTENCIA' ? 'Equipo' : 'Instrumento'}</label>
            
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 max-h-24 overflow-y-auto p-1 shrink-0">
                {selectedTags.map(tag => (
                  <span key={tag} className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border shadow-sm uppercase ${activeCategory === 'POTENCIA' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-[#D9E1F2] text-[#1F3864] border-blue-200'}`}>
                    {tag}
                    <button onClick={() => handleToggleTag(tag)} className={`p-0.5 rounded-full ml-1 ${activeCategory === 'POTENCIA' ? 'hover:bg-orange-200 text-orange-855' : 'hover:bg-blue-300 text-blue-800'}`}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2 mb-3 shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder={`Buscar coincidencia...`} 
                  className={`w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 ${activeCategory === 'POTENCIA' ? 'focus:ring-orange-600' : 'focus:ring-[#1F3864]'}`} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-2 border rounded-lg transition-colors flex items-center justify-center bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
              >
                {sortOrder === 'asc' ? <ArrowDownAZ size={16} /> : <ArrowUpZA size={16} />}
              </button>
              
              {activeCategory === 'INSTRUMENTACION' && (
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 border rounded-lg transition-colors flex items-center justify-center ${showFilters || filtroUbicacion || filtroTipoCable ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                  title="Filtros avanzados"
                >
                  <Filter size={16} />
                </button>
              )}
            </div>

            {/* Selector de filtro por relación con fotos (Coincidentes / No Coincidentes) */}
            <div className="grid grid-cols-2 sm:flex gap-1 mb-4 shrink-0 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setFotoFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer ${
                  fotoFilter === 'all'
                  ? 'bg-[#1F3864] text-white shadow-sm'
                  : 'text-gray-550 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setFotoFilter('with')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 ${
                  fotoFilter === 'with'
                  ? 'bg-green-600 text-white shadow-sm font-black'
                  : 'text-gray-555 hover:text-green-700 hover:bg-green-50/50'
                }`}
              >
                <Check size={11} className="stroke-[3]" />
                Con Foto
              </button>
              <button
                type="button"
                onClick={() => setFotoFilter('without')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 ${
                  fotoFilter === 'without'
                  ? 'bg-amber-600 text-white shadow-sm font-black'
                  : 'text-gray-555 hover:text-amber-700 hover:bg-amber-50/50'
                }`}
              >
                <X size={11} className="stroke-[3]" />
                Sin Foto
              </button>
              <button
                type="button"
                onClick={handleBatchClearPhotos}
                className="flex-1 py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50/80 hover:scale-[1.02] active:scale-95 duration-100"
                title="Eliminar fotos de los TAGs seleccionados o filtrados para dejarlos en limpio"
              >
                <Trash2 size={11} />
                Limpiar
              </button>
            </div>

            {showFilters && activeCategory === 'INSTRUMENTACION' && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 grid grid-cols-1 gap-2 shrink-0 mb-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Ubicación</label>
                  <select 
                    value={filtroUbicacion} 
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded bg-gray-50 focus:ring-[#1F3864] focus:outline-none"
                  >
                    <option value="">Todas</option>
                    {ubicacionesUnicas.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Tipo de Cable</label>
                  <select 
                    value={filtroTipoCable} 
                    onChange={(e) => setFiltroTipoCable(e.target.value)}
                    className="w-full px-2 py-1.5 text-[11px] border border-gray-200 rounded bg-gray-50 focus:ring-[#1F3864] focus:outline-none"
                  >
                    <option value="">Todos</option>
                    {tiposCableUnicos.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-2 px-1 shrink-0">
              <span className="font-extrabold text-[#1F3864] uppercase tracking-wider text-[9px] flex items-center gap-1">
                <Layers size={11} className="text-blue-500" />
                Listado de TAGS
              </span>
              <span className="text-[10px] text-gray-400 font-bold bg-gray-100 px-1.5 rounded-full">
                {filteredInstruments.length} items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50/40 p-2 space-y-1.5 custom-scrollbar">
              {filteredInstruments.length > 0 ? (
                filteredInstruments.map((inst: any, index) => {
                  const tag = inst[tagKey];
                  const isSelected = selectedTags.includes(tag);
                  const fotosDelInst = fotos.filter(f => f.TAGNAME === tag).length;

                  return (
                    <div 
                      key={`${tag}-${index}`}
                      className={`flex items-center justify-between p-2 rounded-md border transition-all ${
                        isSelected 
                        ? activeCategory === 'POTENCIA' 
                          ? 'bg-orange-50/50 border-orange-200 shadow-sm' 
                          : 'bg-blue-50/50 border-blue-200 shadow-sm' 
                        : 'hover:bg-slate-50/40 border-transparent bg-white'
                      }`}
                    >
                      <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleToggleTag(tag)}
                          className={`w-4 h-4 rounded border-gray-300 ${activeCategory === 'POTENCIA' ? 'text-orange-600 focus:ring-orange-600' : 'text-[#1F3864] focus:ring-[#1F3864]'}`} 
                        />
                        <div className="flex-1 min-w-0">
                          <div className={`font-black text-xs ${isSelected ? activeCategory === 'POTENCIA' ? 'text-orange-750' : 'text-[#1F3864]' : 'text-gray-800'}`}>
                            {tag}
                          </div>
                          <div className="text-[9px] text-gray-500 truncate uppercase">
                            {inst.DESCRIPCIÓN || 'Sin descripción'}
                            {inst.UBICACIÓN && ` • ${inst.UBICACIÓN}`}
                          </div>
                        </div>
                      </label>
                      
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {fotosDelInst > 0 && (
                          <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${fotosDelInst === 4 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {fotosDelInst === 4 ? <Check size={10} className="stroke-[3]" /> : null} {fotosDelInst}/4
                          </div>
                        )}
                        {isSelected && fotosDelInst > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleClearTagPhotos(tag);
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-full transition-colors"
                            title="Eliminar todas las fotos"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-xs text-gray-500 text-center uppercase tracking-tight">No se encontraron resultados para {activeCategory}.</div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Captura e imágenes cargándose */}
          <div className="md:col-span-7 space-y-4">
            {selectedTags.length > 0 ? (
              <>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="font-extrabold text-[#1F3864] mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Camera size={14} className="text-blue-500" />
                    2. Capturar Imagen para {selectedTags.join(', ')}
                  </h3>
                  
                  <input 
                    type="text" 
                    placeholder="Observación (Opcional)..." 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg mb-4 text-sm focus:ring-2 focus:ring-[#1F3864] focus:outline-none" 
                    value={observacion} 
                    onChange={(e) => setObservacion(e.target.value)} 
                  />
                  
                  <div className="flex gap-2">
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageCapture} />
                    <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handleImageCapture} />
                    
                    {appSettings.enableCameraAuto && (
                      <Button onClick={() => cameraInputRef.current?.click()} variant="primary" icon={Camera} disabled={isProcessing} className="flex-1 text-xs px-2 font-bold py-2.5">
                        {isProcessing ? 'Proc...' : 'Cámara'}
                      </Button>
                    )}
                    {appSettings.enableCameraManual && (
                      <Button onClick={() => fileInputRef.current?.click()} variant="secondary" icon={ImagePlus} disabled={isProcessing} className="flex-1 text-xs px-2 font-bold py-2.5">
                        Galería
                      </Button>
                    )}
                    {appSettings.enableMassUploadDrive && (
                      <Button onClick={openDriveModal} variant="secondary" icon={Cloud} disabled={isProcessing} className="flex-1 text-xs px-2 font-bold py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200">
                        Drive
                      </Button>
                    )}
                  </div>
                </div>

                {fotosAPrevisualizar.length > 0 ? (
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-[#1F3864] mb-3 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Layers size={13} className="text-blue-500" />
                      Fotos de la selección actual ({fotosAPrevisualizar.length}/4)
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
                          <p className="text-[10px] text-gray-650 truncate font-semibold bg-gray-100/50 p-1.5 rounded border border-gray-200/50">
                            {foto.observacion || 'Sin observación'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl border border-dashed border-gray-200 text-center py-10 text-gray-400 flex flex-col items-center justify-center">
                    <ImagePlus className="text-gray-300 mb-2" size={32} />
                    <p className="text-xs font-semibold text-gray-500">Sin fotos registradas todavía</p>
                    <p className="text-[10px] text-gray-400">Captura una foto usando los controles de arriba para este TAG.</p>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-dashed border-gray-200 text-center py-20 text-gray-400 flex flex-col items-center justify-center h-full min-h-[300px]">
                <Camera className="text-gray-300 mb-3" size={44} />
                <p className="text-sm font-bold text-gray-600 uppercase tracking-tight">Ningún TAG Seleccionado</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Selecciona un TAG en el listado de la izquierda para capturar la imagen o ver las fotos que se van registrando.</p>
              </div>
            )}
          </div>
        </div>
      ) : uploadMode === 'auto' && appSettings.enableUploadAuto ? (
        /* VISTA DE MODO AUTOMÁTICO DE CARGA */
        <div className="space-y-6">
          {/* Selector de Categoría (Instrumentación / Potencia) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">1. Seleccionar Categoría a buscar</label>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <button
                onClick={() => { setActiveCategory('INSTRUMENTACION'); setAutoPreviews([]); setSelectedAutoTagFilter(null); setAutoStatusFilter('all'); }}
                className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-2 flex items-center justify-center gap-2 ${
                  activeCategory === 'INSTRUMENTACION' 
                  ? 'bg-[#1F3864] border-[#1F3864] text-white shadow-md' 
                  : 'bg-white border-[#D9E1F2] text-[#64748B] hover:border-[#1F3864] hover:text-[#1F3864]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'INSTRUMENTACION' ? 'bg-white animate-pulse' : 'bg-current'}`} />
                INSTRUMENTACIÓN
              </button>
              <button
                onClick={() => { setActiveCategory('POTENCIA'); setAutoPreviews([]); setSelectedAutoTagFilter(null); setAutoStatusFilter('all'); }}
                className={`py-3 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-2 flex items-center justify-center gap-2 ${
                  activeCategory === 'POTENCIA' 
                  ? 'bg-[#1F3864] border-[#1F3864] text-white shadow-md' 
                  : 'bg-white border-[#D9E1F2] text-[#64748B] hover:border-[#1F3864] hover:text-[#1F3864]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeCategory === 'POTENCIA' ? 'bg-white animate-pulse' : 'bg-current'}`} />
                POTENCIA
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-3 italic">
              El buscador automático comparará los nombres de las fotos con los registros de la categoría elegida.
            </p>
          </div>

          {/* Área de Carga / Dropzone */}
          <div 
            onMouseEnter={() => setIsHoveringDropzone(true)}
            onMouseLeave={() => setIsHoveringDropzone(false)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-500 uppercase">2. Cargar fotos en lote</label>
              {autoPreviews.length > 0 && !isHoveringDropzone && (
                <span className="text-[10px] text-blue-600 bg-blue-50 font-bold px-2.5 py-0.5 rounded-full animate-pulse transition-all">
                  Pasa el mouse cerca para arrastrar o agregar más
                </span>
              )}
            </div>
            
            {autoPreviews.length > 0 ? (
              <div className="relative overflow-hidden transition-all duration-300">
                {!isHoveringDropzone ? (
                  <div className="flex items-center justify-center gap-2 py-4 px-4 bg-blue-50/40 hover:bg-blue-100/60 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer text-blue-600 transition-colors animate-in fade-in duration-200">
                    <Upload size={14} className="animate-bounce" />
                    <span className="text-xs font-black uppercase tracking-wider">Arrastrar o agregar más fotos (Pasa el mouse aquí)</span>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-200">
                    <div 
                      onDragOver={(e) => { e.preventDefault(); setAutoIsDragging(true); }}
                      onDragEnter={() => setAutoIsDragging(true)}
                      onDragLeave={() => setAutoIsDragging(false)}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setAutoIsDragging(false);
                        const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
                        if (files.length > 0) {
                          await handleQueueAutoFiles(files);
                        }
                      }}
                      onClick={() => fileInputAutoRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center bg-[#F8FAFC] ${
                        autoIsDragging 
                        ? 'border-blue-600 bg-blue-50/50 scale-[0.99] shadow-inner' 
                        : 'border-blue-300 hover:border-blue-600 hover:bg-blue-50/20'
                      }`}
                    >
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        className="hidden" 
                        ref={fileInputAutoRef}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          if (files.length > 0) {
                            await handleQueueAutoFiles(files);
                          }
                        }}
                      />
                      <div className="p-3 bg-blue-100 text-blue-600 rounded-full mb-2">
                        <Upload size={20} className="animate-bounce" />
                      </div>
                      <span className="text-sm font-bold text-gray-700">Arrastra tus fotos aquí</span>
                      <span className="text-xs text-gray-400 mt-1">o haz clic para explorar tus archivos</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div 
                onDragOver={(e) => { e.preventDefault(); setAutoIsDragging(true); }}
                onDragEnter={() => setAutoIsDragging(true)}
                onDragLeave={() => setAutoIsDragging(false)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setAutoIsDragging(false);
                  const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => f.type.startsWith('image/'));
                  if (files.length > 0) {
                    await handleQueueAutoFiles(files);
                  }
                }}
                onClick={() => fileInputAutoRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  autoIsDragging 
                  ? 'border-blue-600 bg-blue-50/50 scale-[0.99] shadow-inner' 
                  : 'border-gray-200 hover:border-blue-600 hover:bg-gray-50 bg-white'
                }`}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  ref={fileInputAutoRef}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []) as File[];
                    if (files.length > 0) {
                      await handleQueueAutoFiles(files);
                    }
                  }}
                />
                <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-2">
                  <Upload size={20} className="animate-bounce" />
                </div>
                <span className="text-sm font-bold text-gray-700">Arrastra tus fotos aquí</span>
                <span className="text-xs text-gray-400 mt-1">o haz clic para explorar tus archivos</span>
              </div>
            )}
            
            {autoPreviews.length > 0 && (
              <div className="animate-in fade-in duration-200 pb-1">
                <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">
                  Observación General (Opcional - aplica a todo el lote)
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. Registro fotográfico de calibración..." 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#1F3864] focus:outline-none" 
                  value={observacion} 
                  onChange={(e) => setObservacion(e.target.value)} 
                />
              </div>
            )}
          </div>

          {/* Listado de Previsualización y Asignaciones más la Lista Lateral en Rejilla Responsiva */}
          {autoPreviews.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Columna Izquierda: Detalle de Fotos y Asignaciones */}
              <div className="md:col-span-8 bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-4">
                <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg flex items-start gap-3">
                  <AlertCircle className="text-blue-600 mt-0.5 shrink-0" size={18} />
                  <div className="text-xs">
                    <p className="font-bold">¡Atención! Fotos pendientes de guardar</p>
                    <p className="text-blue-700/90 mt-0.5">Recuerda hacer clic en el botón <strong>"Guardar Lote Válido"</strong> (Abajo o en la columna derecha) para confirmar y registrar las fotos que estén marcadas en verde.</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="block text-xs font-bold text-gray-500 uppercase">
                      3. Revisar Asignaciones ({autoPreviews.length} fotos)
                    </label>
                    {selectedAutoTagFilter && (
                      <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-blue-700 uppercase bg-blue-50 border border-blue-100 px-2 py-0.5 rounded shadow-sm w-fit animate-in fade-in duration-150">
                        <span>Filtrando por: {selectedAutoTagFilter}</span>
                        <button 
                          onClick={() => setSelectedAutoTagFilter(null)}
                          className="hover:bg-blue-200 hover:text-blue-900 rounded p-0.5 transition-colors"
                          title="Mostrar todas"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => { setAutoPreviews([]); setSelectedAutoTagFilter(null); setAutoStatusFilter('all'); }} 
                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg transition-colors uppercase shrink-0"
                    title="Limpiar cualquier registro agregado en el lote"
                  >
                    <Trash2 size={14} />
                    Limpiar Registros
                  </button>
                </div>

                {/* Filtro por estado para fotos del lote */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-gray-50 border border-gray-150 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAutoStatusFilter('all')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 min-h-[32px] ${
                      autoStatusFilter === 'all'
                        ? 'bg-[#1F3864] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
                    }`}
                  >
                    <span>Todos ({autoPreviews.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoStatusFilter('success')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 min-h-[32px] ${
                      autoStatusFilter === 'success'
                        ? 'bg-green-600 text-white shadow-sm'
                        : 'text-green-600 bg-white border border-green-150 hover:bg-green-50/40'
                    }`}
                  >
                    <Check size={11} className="stroke-[3]" />
                    <span>Match ({autoPreviews.filter(p => p.status === 'success').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoStatusFilter('warning')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 min-h-[32px] ${
                      autoStatusFilter === 'warning'
                        ? 'bg-yellow-600 text-white shadow-sm'
                        : 'text-yellow-600 bg-white border border-yellow-150 hover:bg-yellow-50/40'
                    }`}
                  >
                    <AlertCircle size={11} />
                    <span>Sin Match ({autoPreviews.filter(p => p.status === 'warning').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutoStatusFilter('error')}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-black transition-all uppercase tracking-wider text-center cursor-pointer flex items-center justify-center gap-1 min-h-[32px] ${
                      autoStatusFilter === 'error'
                        ? 'bg-red-650 text-white shadow-sm bg-red-600'
                        : 'text-red-500 bg-white border border-red-150 hover:bg-red-50/40'
                    }`}
                  >
                    <AlertCircle size={11} />
                    <span>Límite ({autoPreviews.filter(p => p.status === 'error').length})</span>
                  </button>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                  {autoPreviews
                    .filter(p => !selectedAutoTagFilter || p.matchedTag === selectedAutoTagFilter)
                    .filter(p => autoStatusFilter === 'all' || p.status === autoStatusFilter)
                    .map((item) => {
                      const isSuccess = item.status === 'success';
                      const isError = item.status === 'error';
                      const isWarning = item.status === 'warning';

                      return (
                        <div 
                          key={item.tempId} 
                          className={`flex flex-col gap-3 p-3 rounded-lg border transition-all ${
                            isSuccess ? 'border-green-100 bg-green-50/20' : 
                            isError ? 'border-red-100 bg-red-50/20' : 
                            'border-yellow-100 bg-yellow-50/20'
                          }`}
                        >
                          <div className="flex gap-3 items-start flex-1 min-w-0">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded overflow-hidden border border-gray-200 bg-gray-50 shrink-0 relative flex items-center justify-center">
                              <img src={item.blobData} alt="Miniatura" className="w-full h-full object-cover" />
                            </div>

                            {/* Detalles de Match o Dropdown */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              {/* Nombre del archivo JPG */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Nombre archivo JPG:</span>
                                <input 
                                  type="text"
                                  value={item.fileName}
                                  onChange={(e) => handleUpdateItemFileName(item.tempId, e.target.value)}
                                  className="w-full p-1 border border-gray-200 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white font-mono text-gray-700"
                                />
                              </div>

                              {/* Badge de estado */}
                              <div className="flex flex-wrap items-center gap-1">
                                {isSuccess && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 uppercase">
                                    <Check size={12} className="stroke-[3]" /> Asignado
                                  </span>
                                )}
                                {isWarning && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-yellow-600 uppercase">
                                    <AlertCircle size={11} /> Sin coincidencia
                                  </span>
                                )}
                                {isError && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 uppercase">
                                    <AlertCircle size={11} /> Fuera de límite
                                  </span>
                                )}
                                <span className="text-[9px] text-gray-500 italic">
                                  ({item.message})
                                </span>
                              </div>

                              {/* Selector de Tag Manual */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Asignar TAG:</span>
                                <select
                                  value={item.matchedTag || ''}
                                  onChange={(e) => handleUpdateItemTag(item.tempId, e.target.value)}
                                  className="w-full text-xs font-medium border border-gray-200 rounded p-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                  <option value="">-- Selecciona el TAG --</option>
                                  {sortedAllTagsForDropdown.map(tOption => (
                                    <option key={tOption} value={tOption}>{tOption}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Observación Individual */}
                              <div className="space-y-0.5">
                                <span className="text-[9px] font-bold text-gray-400 uppercase">Comentario para esta foto:</span>
                                <input 
                                  type="text" 
                                  placeholder="Frente del equipo, calibrador..." 
                                  value={item.observacion}
                                  onChange={(e) => handleUpdateItemObs(item.tempId, e.target.value)}
                                  className="w-full p-1 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Botón descartar foto del lote */}
                          <div className="flex justify-end items-start p-1 shrink-0">
                            <button
                              onClick={() => handleDeleteItem(item.tempId)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                              title="Quitar foto de la lista"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {autoPreviews
                    .filter(p => !selectedAutoTagFilter || p.matchedTag === selectedAutoTagFilter)
                    .filter(p => autoStatusFilter === 'all' || p.status === autoStatusFilter).length === 0 && (
                    <div className="text-center py-10 bg-gray-50/50 border border-dashed border-gray-200 rounded-lg p-6">
                      <p className="text-xs font-semibold text-gray-500 uppercase">
                        No hay fotos coincidentes con los filtros seleccionados
                      </p>
                      <div className="flex justify-center gap-4 mt-3">
                        {selectedAutoTagFilter && (
                          <button 
                            type="button"
                            onClick={() => setSelectedAutoTagFilter(null)}
                            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider"
                          >
                            Quitar filtro de TAG
                          </button>
                        )}
                        {autoStatusFilter !== 'all' && (
                          <button 
                            type="button"
                            onClick={() => setAutoStatusFilter('all')}
                            className="text-[11px] font-extrabold text-[#1F3864] hover:underline transition-colors uppercase tracking-wider"
                          >
                            Mostrar todos los estados
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="pt-2">
                  <Button
                    onClick={handleSaveAutoLot}
                    variant="primary"
                    disabled={autoPreviews.filter(p => p.status === 'success').length === 0 || isProcessingAuto}
                    className="w-full font-bold uppercase tracking-wide flex items-center justify-center gap-2 py-3"
                  >
                    {isProcessingAuto ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Procesando lote...
                      </>
                    ) : (
                      <>
                        <Check size={16} className="stroke-[3]" /> Guardar fotos válidas ({autoPreviews.filter(p => p.status === 'success').length})
                      </>
                    )}
                  </Button>
                  {autoPreviews.filter(p => p.status !== 'success').length > 0 && (
                    <p className="text-[10px] text-yellow-800 font-semibold mt-2 text-center bg-yellow-55 p-1.5 rounded border border-yellow-200">
                      💡 Algunas fotos no coinciden o exceden el límite de 4 fotos por TAG y no serán guardadas hasta que las corrijas o asignes manualmente en la lista.
                    </p>
                  )}
                </div>
              </div>

              {/* Columna Derecha: TAGs seleccionados */}
              <div className="md:col-span-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:max-h-[620px] shrink-0">
                <div className="flex items-center justify-between border-b pb-2.5 mb-3 shrink-0">
                  <span className="font-extrabold text-[#1F3864] uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Layers size={13} className="text-blue-500" />
                    TAGS Seleccionados ({uniqueTagsInBatch.length})
                  </span>
                  {selectedAutoTagFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedAutoTagFilter(null)}
                      className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 transition-colors px-1.5 py-0.5 rounded cursor-pointer"
                    >
                      Mostrar todo
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {uniqueTagsInBatch.length > 0 ? (
                    uniqueTagsInBatch.map(({ tag, count, status, description }) => {
                      const isActiveFilter = selectedAutoTagFilter === tag;
                      const isSuccess = status === 'success';
                      const isError = status === 'error';

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSelectedAutoTagFilter(isActiveFilter ? null : tag)}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isActiveFilter 
                              ? activeCategory === 'POTENCIA'
                                ? 'bg-orange-50/80 border-orange-400 ring-2 ring-orange-100 shadow-md scale-[1.01]'
                                : 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-100 shadow-md scale-[1.01]'
                              : 'bg-gray-50 border-gray-150 hover:bg-gray-100/50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className={`font-black text-xs uppercase ${isActiveFilter ? activeCategory === 'POTENCIA' ? 'text-orange-800' : 'text-[#1F3864]' : 'text-gray-800'}`}>
                              {tag}
                            </div>
                            <div className="text-[9px] text-gray-400 font-semibold truncate uppercase" title={description}>
                              {description}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                              isSuccess ? 'bg-green-100 text-green-700' :
                              isError ? 'bg-red-100 text-red-700' :
                              'bg-yellow-101 text-yellow-700'
                            }`}>
                              {count} {count === 1 ? 'foto' : 'fotos'}
                            </span>
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              isSuccess ? 'bg-green-500 animate-pulse' :
                              isError ? 'bg-red-500 animate-bounce' :
                              'bg-yellow-500'
                            }`} />
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-400 flex flex-col items-center justify-center">
                      <FileImage size={32} className="text-gray-300 mb-2" />
                      <p className="text-xs font-semibold text-gray-500">Sin TAGs detectados</p>
                      <p className="text-[9.5px] text-gray-400 mt-1 max-w-[180px]">
                        Asigna o corrige las fotos del lote para visualizar los TAGs relacionados aquí.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>
      ) : null}

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

        {confirmClearData && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-red-55 overflow-hidden"
            >
              <div className="bg-red-50 p-5 text-red-700 flex items-center gap-3 border-b border-red-100">
                <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xs uppercase tracking-tight">Confirmar Limpieza</h3>
                  <p className="text-[9px] text-red-600/80 font-bold font-sans">Esta acción eliminará fotos permanentemente</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-gray-700 leading-relaxed font-bold">
                  {confirmClearData.message}
                </p>
                <div className="mt-3 bg-gray-50 border border-gray-100 rounded-xl p-3 max-h-32 overflow-y-auto">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-1">TAGs a limpiar:</span>
                  <div className="flex flex-wrap gap-1">
                    {confirmClearData.tagsToClear.map(t => (
                      <span key={t} className="text-[10px] font-black bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700 shadow-xs">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmClearData(null)}
                  className="flex-1 py-2 px-3 text-[10px] font-bold text-gray-650 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-wider cursor-pointer font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={executeBatchClear}
                  disabled={isProcessing}
                  className="flex-1 py-2 px-3 text-[10px] font-black text-white bg-red-650 rounded-lg hover:bg-red-700 transition-colors uppercase tracking-wider shadow-sm cursor-pointer flex items-center justify-center gap-1 font-sans"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Check size={12} className="stroke-[3]" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
