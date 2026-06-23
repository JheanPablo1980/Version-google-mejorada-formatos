import React, { useState, useEffect, useMemo } from 'react';
import { Download, Camera, Printer, FileSpreadsheet, Check, AlertCircle, Search, Filter, ArrowDownAZ, ArrowUpZA, FileText, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import ExcelJS from 'exceljs';
import { format } from 'date-fns';

function extractTagFromName(name: string, tagsDb: string[]) {
  let baseName = name.replace(/\.[^/.]+$/, "").trim();
  
  // Exact match
  if (tagsDb.includes(baseName)) return baseName;
  
  // Find matching tag inside filename (considering suffixes)
  const possibleTags = tagsDb.filter(tag => 
    baseName === tag ||
    baseName.startsWith(tag + "-") || 
    baseName.startsWith(tag + "_") || 
    baseName.startsWith(tag + " ") || 
    baseName.startsWith(tag + "(")
  );

  if (possibleTags.length > 0) {
    // Return longest matched tag
    return possibleTags.sort((a, b) => b.length - a.length)[0];
  }

  // Fallback
  baseName = baseName.replace(/[-_(\s]+[0-9]+[)]?$/, "");
  return baseName.trim();
}

export const VistaGenerar: React.FC = () => {
  const { 
    instrumentos, 
    potenciaEquipos,
    perfiles, 
    fotos, 
    logoInstrumentacion, 
    logoPotencia, 
    saveExportLog, 
    saveConteoExportacion, 
    driveFolderLink,
    deleteFoto,
    appSettings
  } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStartTime, setExportStartTime] = useState<number | null>(null);
  const [exportElapsedTime, setExportElapsedTime] = useState(0);
  const [modoExportacion, setModoExportacion] = useState<'LOCAL' | 'DRIVE'>('LOCAL');
  const [activeCategory, setActiveCategory] = useState<'INSTRUMENTACION' | 'POTENCIA' | 'POTENCIA_COM'>(
    appSettings.enableGenInstrumentacion ? 'INSTRUMENTACION' : 'POTENCIA'
  );
  
  const [driveFiles, setDriveFiles] = useState<{name: string, id: string, mimeType: string}[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveFetchError, setDriveFetchError] = useState<string | null>(null);
  const [showDriveTags, setShowDriveTags] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoCable, setFiltroTipoCable] = useState('');
  const [filtroFechaFoto, setFiltroFechaFoto] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!appSettings.enableMassUploadDrive && modoExportacion === 'DRIVE') {
      setModoExportacion('LOCAL');
    }
  }, [appSettings.enableMassUploadDrive, modoExportacion]);

  const tagsConFotos = useMemo(() => {
    let filteredFotos = fotos;
    if (filtroFechaFoto) {
      filteredFotos = fotos.filter(f => {
        if (!f.timestamp) return false;
        return f.timestamp.substring(0, 10) === filtroFechaFoto;
      });
    }
    return [...new Set(filteredFotos.map(f => f.TAGNAME))];
  }, [fotos, filtroFechaFoto]);
  const tagsInstrumentos = instrumentos.map(i => i.TAGNAME);
  const tagsPotencia = potenciaEquipos.map(e => e.TAG);
  const todosLosTags = [...tagsInstrumentos, ...tagsPotencia];
  const tagsDrive: string[] = [...new Set(driveFiles.map(f => extractTagFromName(f.name, todosLosTags)))] as string[];
  
  const currentItems = activeCategory === 'INSTRUMENTACION' ? instrumentos : potenciaEquipos;
  const tagKey = activeCategory === 'INSTRUMENTACION' ? 'TAGNAME' : 'TAG';

  const itemsConFotos = modoExportacion === 'LOCAL' 
    ? currentItems.filter(item => tagsConFotos.includes((item as any)[tagKey])) 
    : currentItems.filter(item => tagsDrive.includes((item as any)[tagKey]));

  const ubicacionesUnicas = useMemo(() => {
    if (activeCategory !== 'INSTRUMENTACION') return [];
    const u = new Set(itemsConFotos.map(i => (i as any).UBICACIÓN).filter(Boolean));
    return Array.from(u).sort();
  }, [itemsConFotos, activeCategory]);

  const tiposCableUnicos = useMemo(() => {
    if (activeCategory !== 'INSTRUMENTACION') return [];
    const t = new Set(itemsConFotos.map(i => (i as any).TIPO_CABLE).filter(Boolean));
    return Array.from(t).sort();
  }, [itemsConFotos, activeCategory]);

  const filteredItems = useMemo(() => {
    const filtered = itemsConFotos.filter(item => {
      const tag = (item as any)[tagKey] || '';
      const matchesSearch = tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.DESCRIPCIÓN || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeCategory === 'INSTRUMENTACION') {
        const matchesUbicacion = filtroUbicacion ? (item as any).UBICACIÓN === filtroUbicacion : true;
        const matchesTipo = filtroTipoCable ? (item as any).TIPO_CABLE === filtroTipoCable : true;
        return matchesSearch && matchesUbicacion && matchesTipo;
      }
      return matchesSearch;
    });

    return filtered.sort((a, b) => {
      const tagA = (a as any)[tagKey] || '';
      const tagB = (b as any)[tagKey] || '';
      const cmp = tagA.localeCompare(tagB);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [itemsConFotos, activeCategory, tagKey, searchQuery, filtroUbicacion, filtroTipoCable, sortOrder]);

  useEffect(() => {
    if (modoExportacion === 'DRIVE') {
      fetchDriveFiles();
    } else {
      setDriveFetchError(null);
    }
  }, [modoExportacion, driveFolderLink]);

  useEffect(() => {
    let interval: any;
    if (isExporting) {
      setExportStartTime(Date.now());
      setExportElapsedTime(0);
      interval = setInterval(() => {
        setExportElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isExporting]);

  const fetchDriveFiles = async () => {
    setIsFetchingDrive(true);
    setDriveFetchError(null);
    setDriveFiles([]);
    try {
      if (!driveFolderLink) {
        throw new Error("No hay enlace de Google Drive configurado.");
      }
      
      // Regex mejorada para cualquier tipo de enlace de carpeta de Drive
      const match = driveFolderLink.match(/(?:folders\/|id=)([^/?]+)/);
      const folderId = match ? match[1] : null;

      if (!folderId) {
        throw new Error("Enlace de Drive no válido. Copia el enlace desde el botón 'Compartir' de la carpeta.");
      }

      const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
      if (!apiKey) {
        throw new Error("API Key de Drive no configurada.");
      }

      let allFiles: {name: string, id: string, mimeType: string}[] = [];
      let pageToken = '';
      
      do {
        const tokenParam = pageToken ? `&pageToken=${pageToken}` : '';
        const res = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&pageSize=1000&fields=nextPageToken,files(id,name,mimeType)&key=${apiKey}${tokenParam}`);
        
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(`Google API: ${errData.error?.message || res.statusText}`);
        }
        
        const data = await res.json();
        if (data.files) {
          allFiles = [...allFiles, ...data.files];
        }
        pageToken = data.nextPageToken;
      } while (pageToken);

      setDriveFiles(allFiles);
    } catch (error: any) {
      setDriveFetchError(error.message);
    } finally {
      setIsFetchingDrive(false);
    }
  };

  const downloadBase64FromDrive = async (fileId: string, retries = 4): Promise<string> => {
    const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
    if (!apiKey) throw new Error("Falta la API Key de Google Drive.");
    
    const blobToBase64 = (blob: Blob): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    };

    const attemptFetch = async (targetUrl: string, method: 'DIRECT' | 'PROXY1' | 'PROXY2' | 'PROXY3') => {
      let finalUrl = targetUrl;
      if (method === 'PROXY1') finalUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
      if (method === 'PROXY2') finalUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      if (method === 'PROXY3') finalUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      
      const res = await fetch(finalUrl, { 
        mode: 'cors',
        cache: 'no-cache',
        referrerPolicy: 'no-referrer'
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      return await res.blob();
    };

    // Intentamos descargar la imagen original (Media)
    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${apiKey}`;
    
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        let blob: Blob;
        // Intento 1: Directo
        // Intento 2: Proxy 1 (AllOrigins)
        // Intento 3: Proxy 2 (CorsProxy.io)
        // Intento 4: Proxy 3 (CodeTabs)
        // Intento 5: Miniatura (Thumbnail) de alta calidad vía Proxy 1
        
        switch (attempt) {
          case 1:
            blob = await attemptFetch(mediaUrl, 'DIRECT');
            break;
          case 2:
            blob = await attemptFetch(mediaUrl, 'PROXY1');
            break;
          case 3:
            blob = await attemptFetch(mediaUrl, 'PROXY2');
            break;
          case 4:
            blob = await attemptFetch(mediaUrl, 'PROXY3');
            break;
          case 5:
          default:
            const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=thumbnailLink&key=${apiKey}`);
            const metaData = await metaRes.json();
            if (metaData.thumbnailLink) {
              const highResThumb = metaData.thumbnailLink.replace('=s220', '=s1000');
              blob = await attemptFetch(highResThumb, 'PROXY1');
            } else {
              throw new Error("No hay miniatura disponible");
            }
            break;
        }
        return await blobToBase64(blob);
      } catch (e: any) {
        console.warn(`Intento ${attempt} fallido para ${fileId}: ${e.message}`);
        if (attempt === retries) {
          console.error(`Fallo total descargando archivo ${fileId}:`, e);
          throw new Error(`Fallo tras ${retries} intentos: ${e.message}`);
        }
        // Espera exponencial
        await new Promise(r => setTimeout(r, 1000 * attempt));
      }
    }
    throw new Error("Error desconocido en descarga.");
  };

  const [overrideRevisoId, setOverrideRevisoId] = useState<string>('');

  const getEffectiveProfile = (profileId: string) => {
    const rawProfile = perfiles.find(p => p.ID_PERFIL === profileId);
    if (!rawProfile) return undefined;
    
    const activeProf = { ...rawProfile };
    
    if (overrideRevisoId) {
      const parts = overrideRevisoId.split('|');
      const oId = parts[0];
      const oRole = parts[1];
      
      const overrideProf = perfiles.find(p => p.ID_PERFIL === oId);
      if (overrideProf) {
        const isTargetPot = activeProf.TIPO.startsWith('POTENCIA');
        
        let sourceName = '';
        let sourceCargo = '';
        let sourceFirma = '';
        let sourceCompania = '';
        let sourceFecha = '';

        if (oRole === 'ELABORO') {
          sourceName = overrideProf.ELABORO_NOMBRE || '';
          sourceCargo = overrideProf.ELABORO_CARGO || '';
          sourceFirma = overrideProf.ELABORO_FIRMA || '';
        } else if (oRole === 'REVISO') {
          sourceName = overrideProf.REVISO_NOMBRE || '';
          sourceCargo = overrideProf.REVISO_CARGO || '';
          sourceFirma = overrideProf.REVISO_FIRMA || '';
        } else if (oRole === 'APROBO') {
          sourceName = overrideProf.APROBO_NOMBRE || '';
          sourceCargo = overrideProf.APROBO_CARGO || '';
          sourceFirma = overrideProf.APROBO_FIRMA || '';
        } else if (oRole === 'POT1') {
          sourceName = overrideProf.POT_NOMBRE_1 || '';
          sourceFirma = overrideProf.POT_FIRMA_1 || '';
          sourceCompania = overrideProf.POT_COMPANIA_1 || '';
          sourceFecha = overrideProf.POT_FECHA_1 || '';
        } else if (oRole === 'POT2') {
          sourceName = overrideProf.POT_NOMBRE_2 || '';
          sourceFirma = overrideProf.POT_FIRMA_2 || '';
          sourceCompania = overrideProf.POT_COMPANIA_2 || '';
          sourceFecha = overrideProf.POT_FECHA_2 || '';
        } else if (oRole === 'POT3') {
          sourceName = overrideProf.POT_NOMBRE_3 || '';
          sourceFirma = overrideProf.POT_FIRMA_3 || '';
          sourceCompania = overrideProf.POT_COMPANIA_3 || '';
          sourceFecha = overrideProf.POT_FECHA_3 || '';
        }

        if (!isTargetPot) {
          activeProf.ELABORO_NOMBRE = sourceName;
          activeProf.ELABORO_CARGO = sourceCargo;
          activeProf.ELABORO_FIRMA = sourceFirma;
        } else {
          activeProf.POT_NOMBRE_1 = sourceName;
          activeProf.POT_FIRMA_1 = sourceFirma;
          activeProf.POT_COMPANIA_1 = sourceCompania;
          activeProf.POT_FECHA_1 = sourceFecha;
        }
      }
    }
    return activeProf;
  };

  const activeProfile = getEffectiveProfile(selectedProfile);

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleDownloadTagsTxt = () => {
    if (tagsDrive.length === 0) return;
    const content = tagsDrive.sort().join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lista_tags_drive_${format(new Date(), 'yyyyMMdd_HHmm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectAll = () => {
    if (selectedTags.length === filteredItems.length) setSelectedTags([]); 
    else setSelectedTags(filteredItems.map(i => (i as any)[tagKey])); 
  };

  const [exportError, setExportError] = useState<string | null>(null);

  const logExportAction = async (tipo: 'EXCEL' | 'PDF') => {
    if (!activeProfile) return;
    setExportError(null);
    for (const tag of selectedTags) {
       await saveExportLog({
         tagname: tag,
         tipo_perfil: activeProfile.TIPO,
         tipo_formato: tipo,
         id_perfil: activeProfile.ID_PERFIL
       });
       
       // Guardar el conteo
       await saveConteoExportacion(tag, tipo);
    }
  };

  const populateDriveBlobs = async (tagsToFetch: string[]) => {
    if (modoExportacion !== 'DRIVE') return [];
    if (!driveFiles || driveFiles.length === 0) return [];
    
    setIsExporting(true);
    setExportProgress(0);
    const driveFotos: any[] = [];
    
    // Solo traemos fotos de los tags seleccionados, limitado a 4 por cada tag
    const filesByTag: Record<string, any[]> = {};
    driveFiles.forEach(f => {
      const tag = extractTagFromName(f.name, todosLosTags);
      if (tagsToFetch.includes(tag) && f.mimeType.startsWith('image/')) {
        if (!filesByTag[tag]) filesByTag[tag] = [];
        if (filesByTag[tag].length < 4) {
          filesByTag[tag].push(f);
        }
      }
    });

    const filesToFetch = Object.values(filesByTag).flat();
    const totalFiles = filesToFetch.length;

    if (totalFiles === 0) {
      return [];
    }
    
    // Descarga con control de concurrencia básica
    const results: any[] = [];
    const BATCH_SIZE = 3; // Reducimos para ser más gentiles con Google Drive y Proxies
    
    for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
      const batch = filesToFetch.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (file) => {
        try {
          const blobData = await downloadBase64FromDrive(file.id);
          if (!blobData) throw new Error("Datos de imagen vacíos");
          return {
            TAGNAME: extractTagFromName(file.name, todosLosTags),
            blobData,
            observacion: `Drive: ${file.name}`
          };
        } catch (e: any) {
          console.warn(`No se pudo descargar ${file.name} del Drive:`, e);
          return null;
        }
      }));
      results.push(...batchResults);
      
      const currentProgress = Math.round(((i + batch.length) / totalFiles) * 80);
      setExportProgress(currentProgress);

      if (i + BATCH_SIZE < totalFiles) {
        await new Promise(r => setTimeout(r, 500)); 
      }
    }
    
    results.forEach(res => {
      if (res && res.blobData) driveFotos.push(res);
    });

    return driveFotos;
  };

  const limpiarDespuesDeExportar = async (tagsExportados: string[]) => {
    try {
      if (modoExportacion === 'LOCAL') {
        const dbFotosAEliminar = fotos.filter(f => tagsExportados.includes(f.TAGNAME));
        for (const foto of dbFotosAEliminar) {
          await deleteFoto(foto.id);
        }
      }
    } catch (err) {
      console.error("Error al limpiar las fotos después de la exportación:", err);
    } finally {
      setSelectedTags([]);
    }
  };

  const exportarExcel = async () => {
    if (selectedTags.length === 0 || !activeProfile) { 
      setExportError("Selecciona al menos un ítem y un perfil."); 
      return; 
    }
    
    setIsExporting(true);
    setExportProgress(modoExportacion === 'LOCAL' ? 0 : 5);
    setExportError(null);
    try {
      // Intentamos traer si es DRIVE, y si falla levanta la excepcion (Protocolo de error)
      const driveFotosDownloaded = await populateDriveBlobs(selectedTags);
      
      // Log backup
      await logExportAction('EXCEL');
      const wb = new ExcelJS.Workbook();
      
      const applyStyle = (cell: any, isHeader = false) => {
        if (isHeader) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri', size: 10 };
        } else {
          cell.font = { name: 'Calibri', size: 10 };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { 
          top: {style:'thin'}, 
          left: {style:'thin'}, 
          bottom: {style:'thin'}, 
          right: {style:'thin'} 
        };
      };

      const totalItems = selectedTags.length;
      let processedItems = 0;

      for (const tag of selectedTags) {
        processedItems++;
        // Si no es DRIVE (que ya usó el 80%), dividimos el progreso proporcionalmente
        // Si es DRIVE, el 80-100% es la generación del Excel
        const baseProgress = modoExportacion === 'DRIVE' ? 80 : 0;
        const multiplier = modoExportacion === 'DRIVE' ? 20 : 100;
        setExportProgress(baseProgress + Math.round((processedItems / totalItems) * multiplier));

        const activeItem = currentItems.find(i => (i as any)[tagKey] === tag);
        const fotosDelTag = (modoExportacion === 'DRIVE' 
          ? driveFotosDownloaded.filter(f => f.TAGNAME === tag)
          : fotos.filter(f => f.TAGNAME === tag)).slice(0, 4);
        
        if (!activeItem) continue;

        const currentLogo = (activeProfile.TIPO === 'POTENCIA' || activeProfile.TIPO === 'POTENCIA_COM') ? logoPotencia : logoInstrumentacion;

        const safeSheetName = tag.replace(/[\\*?:\/\[\]]/g, '').substring(0, 26);
        const ws1 = wb.addWorksheet(`${safeSheetName}`);
        
        const embedSig = (b64: string, col: number, colMaxOffset: number, row: number) => {
          if (!b64) return;
          try {
            const extension = b64.includes('png') ? 'png' : 'jpeg';
            const imageId = wb.addImage({ 
              base64: b64.split(',')[1], 
              extension: extension as any
            });
            ws1.addImage(imageId, { 
              tl: { col: col + 0.25, row: row - 1 + 0.4 } as any, 
              br: { col: col + colMaxOffset - 0.25, row: row - 1 + 2.6 } as any,
              editAs: 'oneCell'
            });
          } catch (e) {
            console.error("Error embedding signature", e);
          }
        };

        if (activeProfile.TIPO === 'POTENCIA') {
          // --- FORMATO POTENCIA PRECOMISIONAMIENTO (11 ÍTEMS) ---
          ws1.columns = [
            { width: 8 },   // A - ITEM
            { width: 14 },  // B - Desc 1
            { width: 14 },  // C - Desc 2
            { width: 18 },  // D - Desc 3
            { width: 18 },  // E - Desc 4
            { width: 12 },  // F - CUMPLE
            { width: 12 },  // G - NO CUMPLE
            { width: 12 }   // H - N/A
          ];

          // 1. CABECERA (Filas 1 a 3)
          ws1.mergeCells('A1:B3'); applyStyle(ws1.getCell('A1'));
          if (currentLogo) {
            try {
              const logoId = wb.addImage({ 
                base64: currentLogo.split(',')[1], 
                extension: 'png' 
              });
              ws1.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 120, height: 50 } });
            } catch (e) {
              console.error("Error embedding logo in Excel", e);
            }
          }

          ws1.mergeCells('C1:F1');
          ws1.getCell('C1').value = 'Ingeniería y Proyectos';
          applyStyle(ws1.getCell('C1'), true);

          ws1.mergeCells('C2:F3');
          ws1.getCell('C2').value = `Formato Precomisionamiento\nLista de chequeo ${activeProfile.SUBTIPO === 'MOTOR' ? 'Motor' : 'Cable y Motor'} baja tensión\nCHKL-ELE-08`;
          applyStyle(ws1.getCell('C2'), true);
          ws1.getCell('C2').font = { name: 'Calibri', bold: true, size: 10 };

          ws1.getCell('G1').value = 'Código:'; applyStyle(ws1.getCell('G1'), true);
          ws1.getCell('H1').value = activeProfile.POT_CODIGO || 'SKC-PC-F-009'; applyStyle(ws1.getCell('H1'));

          ws1.getCell('G2').value = 'Fecha:'; applyStyle(ws1.getCell('G2'), true);
          ws1.getCell('H2').value = activeProfile.FECHA_REVISION || '15.03.2022'; applyStyle(ws1.getCell('H2'));

          ws1.getCell('G3').value = 'Versión:'; applyStyle(ws1.getCell('G3'), true);
          ws1.getCell('H3').value = activeProfile.REVISION || '1'; applyStyle(ws1.getCell('H3'));

          // 2. METADATOS (Filas 4 a 7)
          ws1.mergeCells('A4:C4'); ws1.getCell('A4').value = `PROYECTO: ${activeProfile.PROYECTO || ''}`; applyStyle(ws1.getCell('A4')); ws1.getCell('A4').alignment = {horizontal:'left'}; ws1.getCell('A4').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('D4:F4'); ws1.getCell('D4').value = `AC-1 No: ${activeProfile.AC1_NO || ''}`; applyStyle(ws1.getCell('D4')); ws1.getCell('D4').alignment = {horizontal:'left'}; ws1.getCell('D4').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('G4:H4'); ws1.getCell('G4').value = `HC-1 No: ${activeProfile.HC1_NO || ''}`; applyStyle(ws1.getCell('G4')); ws1.getCell('G4').alignment = {horizontal:'left'}; ws1.getCell('G4').font = { bold: true, name: 'Calibri', size: 9 };

          ws1.mergeCells('A5:C5'); ws1.getCell('A5').value = `CONTRATISTA: ${activeProfile.CONTRATISTA || ''}`; applyStyle(ws1.getCell('A5')); ws1.getCell('A5').alignment = {horizontal:'left'}; ws1.getCell('A5').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('D5:F5'); ws1.getCell('D5').value = `AREA: ${activeProfile.AREA || ''}`; applyStyle(ws1.getCell('D5')); ws1.getCell('D5').alignment = {horizontal:'left'}; ws1.getCell('D5').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('G5:H5'); ws1.getCell('G5').value = `LOCACION: ${activeProfile.LOCACION || ''}`; applyStyle(ws1.getCell('G5')); ws1.getCell('G5').alignment = {horizontal:'left'}; ws1.getCell('G5').font = { bold: true, name: 'Calibri', size: 9 };

          ws1.mergeCells('A6:C6'); ws1.getCell('A6').value = `SERVICIO: ${activeProfile.SERVICIO || ''}`; applyStyle(ws1.getCell('A6')); ws1.getCell('A6').alignment = {horizontal:'left'}; ws1.getCell('A6').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('D6:F6'); ws1.getCell('D6').value = `P & ID No: ${activeProfile.P_ID_NO || ''}`; applyStyle(ws1.getCell('D6')); ws1.getCell('D6').alignment = {horizontal:'left'}; ws1.getCell('D6').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('G6:H6'); ws1.getCell('G6').value = `REV: ${activeProfile.REV_P_ID || ''}`; applyStyle(ws1.getCell('G6')); ws1.getCell('G6').alignment = {horizontal:'left'}; ws1.getCell('G6').font = { bold: true, name: 'Calibri', size: 9 };

          ws1.mergeCells('A7:C7'); ws1.getCell('A7').value = `PAQUETE No: ${activeProfile.PAQUETE_NO || ''}`; applyStyle(ws1.getCell('A7')); ws1.getCell('A7').alignment = {horizontal:'left'}; ws1.getCell('A7').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('D7:F7'); ws1.getCell('D7').value = `PLANO No: ${activeProfile.PLANO_NO || ''}`; applyStyle(ws1.getCell('D7')); ws1.getCell('D7').alignment = {horizontal:'left'}; ws1.getCell('D7').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('G7:H7'); ws1.getCell('G7').value = `REV: ${activeProfile.REV_PLANO || ''}`; applyStyle(ws1.getCell('G7')); ws1.getCell('G7').alignment = {horizontal:'left'}; ws1.getCell('G7').font = { bold: true, name: 'Calibri', size: 9 };

          // 3. TABLA LISTA DE CHEQUEO
          ws1.mergeCells('A9:A10'); ws1.getCell('A9').value = 'ITEM'; applyStyle(ws1.getCell('A9'), true);
          ws1.mergeCells('B9:E10'); ws1.getCell('B9').value = 'DESCRIPCION'; applyStyle(ws1.getCell('B9'), true);
          ws1.mergeCells('F9:H9'); ws1.getCell('F9').value = 'ESTADO'; applyStyle(ws1.getCell('F9'), true);
          ws1.getCell('F10').value = 'CUMPLE'; applyStyle(ws1.getCell('F10'), true);
          ws1.getCell('G10').value = 'NO CUMPLE'; applyStyle(ws1.getCell('G10'), true);
          ws1.getCell('H10').value = 'N/A'; applyStyle(ws1.getCell('H10'), true);

          let rIdx = 11;
          for (let num = 1; num <= 11; num++) {
            ws1.getRow(rIdx).height = 24;
            ws1.getCell(`A${rIdx}`).value = num;
            applyStyle(ws1.getCell(`A${rIdx}`));
            ws1.getCell(`A${rIdx}`).font = { bold: true, name: 'Calibri', size: 9 };

            ws1.mergeCells(`B${rIdx}:E${rIdx}`);
            ws1.getCell(`B${rIdx}`).value = (activeProfile as any)[`CHKL_${num}_DESC`] || '';
            applyStyle(ws1.getCell(`B${rIdx}`));
            ws1.getCell(`B${rIdx}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            ws1.getCell(`B${rIdx}`).font = { name: 'Calibri', size: 9 };

            const estado = (activeProfile as any)[`CHKL_${num}_ESTADO`];
            ws1.getCell(`F${rIdx}`).value = estado === 'CUMPLE' ? 'X' : ''; applyStyle(ws1.getCell(`F${rIdx}`));
            ws1.getCell(`G${rIdx}`).value = estado === 'NO_CUMPLE' ? 'X' : ''; applyStyle(ws1.getCell(`G${rIdx}`));
            ws1.getCell(`H${rIdx}`).value = estado === 'N/A' ? 'X' : ''; applyStyle(ws1.getCell(`H${rIdx}`));

            ws1.getCell(`F${rIdx}`).font = { bold: true, name: 'Calibri', size: 9 };
            ws1.getCell(`G${rIdx}`).font = { bold: true, name: 'Calibri', size: 9 };
            ws1.getCell(`H${rIdx}`).font = { bold: true, name: 'Calibri', size: 9 };

            rIdx++;
          }

          // 4. COMENTARIOS
          ws1.mergeCells(`A${rIdx}:H${rIdx}`);
          ws1.getCell(`A${rIdx}`).value = 'Comentarios:';
          applyStyle(ws1.getCell(`A${rIdx}`), true);
          ws1.getCell(`A${rIdx}`).alignment = { horizontal: 'left' };
          rIdx++;

          ws1.mergeCells(`A${rIdx}:H${rIdx+2}`);
          ws1.getCell(`A${rIdx}`).value = activeProfile.COMENTARIOS || '';
          applyStyle(ws1.getCell(`A${rIdx}`));
          ws1.getCell(`A${rIdx}`).alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
          ws1.getCell(`A${rIdx}`).font = { name: 'Consolas', size: 9 };
          ws1.getRow(rIdx).height = 18;
          ws1.getRow(rIdx+1).height = 18;
          ws1.getRow(rIdx+2).height = 18;

          rIdx += 4;

          // 5. REGISTRO FOTOGRÁFICO
          if (fotosDelTag.length > 0) {
            ws1.mergeCells(`A${rIdx}:H${rIdx}`);
            ws1.getCell(`A${rIdx}`).value = '6. REGISTRO FOTOGRÁFICO';
            applyStyle(ws1.getCell(`A${rIdx}`), true);
            ws1.getCell(`A${rIdx}`).alignment = { horizontal: 'left' };
            rIdx++;

            fotosDelTag.forEach((foto, idx) => {
              const isLeft = idx % 2 === 0;
              const rowOffset = Math.floor(idx / 2) * 16;
              const r = rIdx + rowOffset;
              const colStart = isLeft ? 'A' : 'E';
              const colEnd = isLeft ? 'D' : 'H';
              const colIdx = isLeft ? 0 : 4;

              for (let h = 0; h < 15; h++) {
                ws1.getRow(r + h).height = 18;
              }
              ws1.getRow(r + 15).height = 15;

              ws1.mergeCells(`${colStart}${r}:${colEnd}${r+14}`);
              applyStyle(ws1.getCell(`${colStart}${r}`));

              try {
                const mimeType = foto.blobData.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
                const ext = (mimeType.split('/')[1] || 'jpeg').replace('jpg', 'jpeg');
                const imageId = wb.addImage({ 
                  base64: foto.blobData.split(',')[1], 
                  extension: ext as any
                });
                ws1.addImage(imageId, { 
                  tl: { col: colIdx + 0.2, row: r - 1 + 0.3 } as any, 
                  br: { col: colIdx + 3.8, row: r - 1 + 14.7 } as any,
                  editAs: 'oneCell'
                });
              } catch (e) {
                console.error("Error adding photo to spreadsheet", e);
              }

              ws1.mergeCells(`${colStart}${r+15}:${colEnd}${r+15}`);
              ws1.getCell(`${colStart}${r+15}`).value = foto.observacion || `Foto ${idx+1}`;
              applyStyle(ws1.getCell(`${colStart}${r+15}`));
            });

            rIdx += Math.ceil(fotosDelTag.length / 2) * 16 + 1;
          }

          // 6. FIRMAS
          ws1.mergeCells(`A${rIdx}:C${rIdx}`); 
          ws1.getCell(`A${rIdx}`).value = 'CONTRATISTA Y/O VENDOR'; 
          applyStyle(ws1.getCell(`A${rIdx}`), true);

          ws1.mergeCells(`D${rIdx}:F${rIdx}`); 
          ws1.getCell(`D${rIdx}`).value = 'PRECOMISIONAMIENTO'; 
          applyStyle(ws1.getCell(`D${rIdx}`), true);

          ws1.mergeCells(`G${rIdx}:H${rIdx}`); 
          ws1.getCell(`G${rIdx}`).value = 'COMISIONAMIENTO'; 
          applyStyle(ws1.getCell(`G${rIdx}`), true);

          ws1.mergeCells(`A${rIdx+1}:C${rIdx+1}`); ws1.getCell(`A${rIdx+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_1 || ''}`; applyStyle(ws1.getCell(`A${rIdx+1}`)); ws1.getCell(`A${rIdx+1}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`D${rIdx+1}:F${rIdx+1}`); ws1.getCell(`D${rIdx+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_2 || ''}`; applyStyle(ws1.getCell(`D${rIdx+1}`)); ws1.getCell(`D${rIdx+1}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`G${rIdx+1}:H${rIdx+1}`); ws1.getCell(`G${rIdx+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_3 || ''}`; applyStyle(ws1.getCell(`G${rIdx+1}`)); ws1.getCell(`G${rIdx+1}`).alignment = {horizontal:'left'};

          ws1.mergeCells(`A${rIdx+2}:C${rIdx+2}`); ws1.getCell(`A${rIdx+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_1 || ''}`; applyStyle(ws1.getCell(`A${rIdx+2}`)); ws1.getCell(`A${rIdx+2}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`D${rIdx+2}:F${rIdx+2}`); ws1.getCell(`D${rIdx+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_2 || ''}`; applyStyle(ws1.getCell(`D${rIdx+2}`)); ws1.getCell(`D${rIdx+2}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`G${rIdx+2}:H${rIdx+2}`); ws1.getCell(`G${rIdx+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_3 || ''}`; applyStyle(ws1.getCell(`G${rIdx+2}`)); ws1.getCell(`G${rIdx+2}`).alignment = {horizontal:'left'};

          ws1.mergeCells(`A${rIdx+3}:C${rIdx+3}`); ws1.getCell(`A${rIdx+3}`).value = `FECHA: ${format(new Date(), 'dd.MM.yyyy')}`; applyStyle(ws1.getCell(`A${rIdx+3}`)); ws1.getCell(`A${rIdx+3}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`D${rIdx+3}:F${rIdx+3}`); ws1.getCell(`D${rIdx+3}`).value = `FECHA: ${activeProfile.POT_FECHA_2 || ''}`; applyStyle(ws1.getCell(`D${rIdx+3}`)); ws1.getCell(`D${rIdx+3}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`G${rIdx+3}:H${rIdx+3}`); ws1.getCell(`G${rIdx+3}`).value = `FECHA: ${activeProfile.POT_FECHA_3 || ''}`; applyStyle(ws1.getCell(`G${rIdx+3}`)); ws1.getCell(`G${rIdx+3}`).alignment = {horizontal:'left'};

          ws1.mergeCells(`A${rIdx+4}:C${rIdx+6}`); ws1.getCell(`A${rIdx+4}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`A${rIdx+4}`)); ws1.getCell(`A${rIdx+4}`).alignment = {vertical:'top', horizontal:'left'}; ws1.getCell(`A${rIdx+4}`).font = { bold: true };
          ws1.mergeCells(`D${rIdx+4}:F${rIdx+6}`); ws1.getCell(`D${rIdx+4}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`D${rIdx+4}`)); ws1.getCell(`D${rIdx+4}`).alignment = {vertical:'top', horizontal:'left'}; ws1.getCell(`D${rIdx+4}`).font = { bold: true };
          ws1.mergeCells(`G${rIdx+4}:H${rIdx+6}`); ws1.getCell(`G${rIdx+4}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`G${rIdx+4}`)); ws1.getCell(`G${rIdx+4}`).alignment = {vertical:'top', horizontal:'left'}; ws1.getCell(`G${rIdx+4}`).font = { bold: true };

          ws1.getRow(rIdx+4).height = 18;
          ws1.getRow(rIdx+5).height = 18;
          ws1.getRow(rIdx+6).height = 18;

          embedSig(activeProfile.POT_FIRMA_1, 0, 3, rIdx+4);
          embedSig(activeProfile.POT_FIRMA_2, 3, 3, rIdx+4);
          embedSig(activeProfile.POT_FIRMA_3, 6, 2, rIdx+4);

        } else if (activeProfile.TIPO === 'POTENCIA_COM') {
          let comData: any = {};
          try { comData = JSON.parse(activeProfile.POT_COM_DATA || '{}'); } catch(e){}

          // Configurar 12 columnas: A es variable / check, B a L son para tiempos, resultados, etc.
          ws1.columns = [
            { width: 32 }, // A: Variable / Check
            { width: 10 }, // B: t=0 / merged specs
            { width: 10 }, // C: t=15
            { width: 10 }, // D: t=30
            { width: 10 }, // E: t=45
            { width: 10 }, // F: t=60
            { width: 10 }, // G: t=90
            { width: 10 }, // H: t=120
            { width: 10 }, // I: t=150
            { width: 10 }, // J: t=180
            { width: 10 }, // K: t=210
            { width: 10 }  // L: t=240
          ];

          // 1. CABECERA (Filas 1 a 3)
          ws1.mergeCells('A1:B3'); applyStyle(ws1.getCell('A1'));
          if (currentLogo) {
            try {
              const logoId = wb.addImage({ 
                base64: currentLogo.split(',')[1], 
                extension: 'png' 
              });
              ws1.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 120, height: 50 } });
            } catch (e) {
              console.error("Error embedding logo in Excel", e);
            }
          }

          ws1.mergeCells('C1:J1');
          ws1.getCell('C1').value = 'Ingeniería y Proyectos';
          applyStyle(ws1.getCell('C1'), true);

          ws1.mergeCells('C2:J3');
          ws1.getCell('C2').value = `Formato Comisionamiento\nMotor Eléctrico Bajo Voltaje\nPRUE-ELE-03`;
          applyStyle(ws1.getCell('C2'), true);
          ws1.getCell('C2').font = { name: 'Calibri', bold: true, size: 10 };

          ws1.getCell('K1').value = 'Código:'; applyStyle(ws1.getCell('K1'), true);
          ws1.getCell('L1').value = activeProfile.POT_CODIGO || 'SKC-C-F-005'; applyStyle(ws1.getCell('L1'));

          ws1.getCell('K2').value = 'Fecha:'; applyStyle(ws1.getCell('K2'), true);
          ws1.getCell('L2').value = activeProfile.FECHA_REVISION || '01.19.2023'; applyStyle(ws1.getCell('L2'));

          ws1.getCell('K3').value = 'Versión:'; applyStyle(ws1.getCell('K3'), true);
          ws1.getCell('L3').value = activeProfile.REVISION || '1'; applyStyle(ws1.getCell('L3'));

          // 2. METADATOS (Filas 4 a 5)
          ws1.mergeCells('A4:C4'); ws1.getCell('A4').value = `PROYECTO: ${activeProfile.PROYECTO || ''}`; applyStyle(ws1.getCell('A4')); ws1.getCell('A4').alignment = {horizontal:'left'}; ws1.getCell('A4').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('D4:F4'); ws1.getCell('D4').value = `AC-1 No: ${activeProfile.AC1_NO || ''}`; applyStyle(ws1.getCell('D4')); ws1.getCell('D4').alignment = {horizontal:'left'}; ws1.getCell('D4').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('G4:I4'); ws1.getCell('G4').value = `HC-1 No: ${activeProfile.HC1_NO || ''}`; applyStyle(ws1.getCell('G4')); ws1.getCell('G4').alignment = {horizontal:'left'}; ws1.getCell('G4').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('J4:L4'); ws1.getCell('J4').value = `CONTRATISTA: ${activeProfile.CONTRATISTA || ''}`; applyStyle(ws1.getCell('J4')); ws1.getCell('J4').alignment = {horizontal:'left'};  ws1.getCell('J4').font = { bold: true, name: 'Calibri', size: 9 };

          ws1.mergeCells('A5:C5'); ws1.getCell('A5').value = `AREA: ${activeProfile.AREA || ''}`; applyStyle(ws1.getCell('A5')); ws1.getCell('A5').alignment = {horizontal:'left'}; ws1.getCell('A5').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('D5:F5'); ws1.getCell('D5').value = `LOCACION: ${activeProfile.LOCACION || ''}`; applyStyle(ws1.getCell('D5')); ws1.getCell('D5').alignment = {horizontal:'left'}; ws1.getCell('D5').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('G5:I5'); ws1.getCell('G5').value = `SISTEMA: ${activeProfile.UBICACION || ''}`; applyStyle(ws1.getCell('G5')); ws1.getCell('G5').alignment = {horizontal:'left'}; ws1.getCell('G5').font = { bold: true, name: 'Calibri', size: 9 };
          ws1.mergeCells('J5:L5'); ws1.getCell('J5').value = `P&ID: ${activeProfile.P_ID_NO || ''}`; applyStyle(ws1.getCell('J5')); ws1.getCell('J5').alignment = {horizontal:'left'}; ws1.getCell('J5').font = { bold: true, name: 'Calibri', size: 9 };

          // 3. INFORMACION MOTOR (Filas 7 a 11)
          ws1.mergeCells('A7:L7');
          ws1.getCell('A7').value = 'INFORMACIÓN DEL MOTOR';
          applyStyle(ws1.getCell('A7'), true);
          ws1.getCell('A7').alignment = { horizontal: 'left' };

          // Row 8
          ws1.mergeCells('A8:B8'); ws1.getCell('A8').value = 'TAG No.:'; applyStyle(ws1.getCell('A8'), true); ws1.getCell('A8').alignment = {horizontal:'left'};
          ws1.mergeCells('C8:D8'); ws1.getCell('C8').value = activeProfile.TAGNAME; applyStyle(ws1.getCell('C8')); ws1.getCell('C8').alignment = {horizontal:'left'};
          ws1.mergeCells('E8:F8'); ws1.getCell('E8').value = 'CLASIFICACIÓN DE ÁREA:'; applyStyle(ws1.getCell('E8'), true); ws1.getCell('E8').alignment = {horizontal:'left'};
          ws1.mergeCells('G8:H8'); ws1.getCell('G8').value = activeProfile.AREA || ''; applyStyle(ws1.getCell('G8')); ws1.getCell('G8').alignment = {horizontal:'left'};
          ws1.mergeCells('I8:J8'); ws1.getCell('I8').value = 'FABRICANTE:'; applyStyle(ws1.getCell('I8'), true); ws1.getCell('I8').alignment = {horizontal:'left'};
          ws1.mergeCells('K8:L8'); ws1.getCell('K8').value = activeProfile.FABRICANTE_MODELO || 'N/A'; applyStyle(ws1.getCell('K8')); ws1.getCell('K8').alignment = {horizontal:'left'};

          // Row 9
          ws1.mergeCells('A9:B9'); ws1.getCell('A9').value = 'SERIE No.:'; applyStyle(ws1.getCell('A9'), true); ws1.getCell('A9').alignment = {horizontal:'left'};
          ws1.mergeCells('C9:D9'); ws1.getCell('C9').value = comData.POT_COM_SERIE || ''; applyStyle(ws1.getCell('C9')); ws1.getCell('C9').alignment = {horizontal:'left'};
          ws1.mergeCells('E9:F9'); ws1.getCell('E9').value = 'MODELO No.:'; applyStyle(ws1.getCell('E9'), true); ws1.getCell('E9').alignment = {horizontal:'left'};
          ws1.mergeCells('G9:H9'); ws1.getCell('G9').value = comData.POT_COM_MODELO || ''; applyStyle(ws1.getCell('G9')); ws1.getCell('G9').alignment = {horizontal:'left'};
          ws1.mergeCells('I9:J9'); ws1.getCell('I9').value = 'NEMA:'; applyStyle(ws1.getCell('I9'), true); ws1.getCell('I9').alignment = {horizontal:'left'};
          ws1.mergeCells('K9:L9'); ws1.getCell('K9').value = comData.POT_COM_NEMA || ''; applyStyle(ws1.getCell('K9')); ws1.getCell('K9').alignment = {horizontal:'left'};

          // Row 10
          ws1.mergeCells('A10:B10'); ws1.getCell('A10').value = 'POTENCIA HP:'; applyStyle(ws1.getCell('A10'), true); ws1.getCell('A10').alignment = {horizontal:'left'};
          ws1.mergeCells('C10:D10'); ws1.getCell('C10').value = comData.POT_COM_POTENCIA_HP || ''; applyStyle(ws1.getCell('C10')); ws1.getCell('C10').alignment = {horizontal:'left'};
          ws1.mergeCells('E10:F10'); ws1.getCell('E10').value = 'VELOCIDAD RPM:'; applyStyle(ws1.getCell('E10'), true); ws1.getCell('E10').alignment = {horizontal:'left'};
          ws1.mergeCells('G10:H10'); ws1.getCell('G10').value = comData.POT_COM_VELOCIDAD_RPM || ''; applyStyle(ws1.getCell('G10')); ws1.getCell('G10').alignment = {horizontal:'left'};
          ws1.mergeCells('I10:J10'); ws1.getCell('I10').value = 'CLASE DE AISL.:'; applyStyle(ws1.getCell('I10'), true); ws1.getCell('I10').alignment = {horizontal:'left'};
          ws1.mergeCells('K10:L10'); ws1.getCell('K10').value = comData.POT_COM_CLASE_AISL || ''; applyStyle(ws1.getCell('K10')); ws1.getCell('K10').alignment = {horizontal:'left'};

          // Row 11
          ws1.mergeCells('A11:B11'); ws1.getCell('A11').value = 'SERVICIO:'; applyStyle(ws1.getCell('A11'), true); ws1.getCell('A11').alignment = {horizontal:'left'};
          ws1.mergeCells('C11:D11'); ws1.getCell('C11').value = activeProfile.SERVICIO || ''; applyStyle(ws1.getCell('C11')); ws1.getCell('C11').alignment = {horizontal:'left'};
          ws1.mergeCells('E11:F11'); ws1.getCell('E11').value = 'VOLTAJE V:'; applyStyle(ws1.getCell('E11'), true); ws1.getCell('E11').alignment = {horizontal:'left'};
          ws1.mergeCells('G11:H11'); ws1.getCell('G11').value = comData.POT_COM_VOLTAJE_V || ''; applyStyle(ws1.getCell('G11')); ws1.getCell('G11').alignment = {horizontal:'left'};
          ws1.mergeCells('I11:J11'); ws1.getCell('I11').value = 'F.L.A. AMP:'; applyStyle(ws1.getCell('I11'), true); ws1.getCell('I11').alignment = {horizontal:'left'};
          ws1.mergeCells('K11:L11'); ws1.getCell('K11').value = comData.POT_COM_FLA_AMP || ''; applyStyle(ws1.getCell('K11')); ws1.getCell('K11').alignment = {horizontal:'left'};

          // Row 12
          ws1.mergeCells('A12:B12'); ws1.getCell('A12').value = 'FRECUENCIA Hz:'; applyStyle(ws1.getCell('A12'), true); ws1.getCell('A12').alignment = {horizontal:'left'};
          ws1.mergeCells('C12:D12'); ws1.getCell('C12').value = comData.POT_COM_FRECUENCIA_HZ || ''; applyStyle(ws1.getCell('C12')); ws1.getCell('C12').alignment = {horizontal:'left'};
          ws1.mergeCells('E12:L12'); ws1.getCell('E12').value = ''; applyStyle(ws1.getCell('E12'));

          // 4. TABLA LISTA DE REQUERIMIENTOS FUNCIONALES (Fila 14)
          ws1.getCell('A14').value = 'Check'; applyStyle(ws1.getCell('A14'), true);
          ws1.mergeCells('B14:J14'); ws1.getCell('B14').value = '1.1 REQUERIMIENTOS PRUEBAS FUNCIONALES'; applyStyle(ws1.getCell('B14'), true);
          ws1.getCell('K14').value = 'Resultados'; applyStyle(ws1.getCell('K14'), true);
          ws1.getCell('L14').value = 'Iniciales / Fecha'; applyStyle(ws1.getCell('L14'), true);

          const reqs = [
            'Realice la prueba de inyección sobre los relés de protección y medición. Chequee los ratings y setting de protección de los fusibles. Anexe los data sheet.',
            'Mida la resistencia de Aislamiento del cableado de control Mínimo 10 MΩ con Megger de 500 V. Registre el serial del equipo.',
            'Prueba funcional del arrancador Interruptor/Contactor incluyendo la interfase de control.',
            'Prueba funcional Mecánica y Eléctrica de los Interlocks incluido las señales de disparo. Liste las pruebas funcionales en una hoja y anéxela.',
            'Verifique el aterrizaje del motor de acuerdo con las especificaciones del proyecto.',
            'Mida la resistencia de Aislamiento del Heater. Mínimo 10 MΩ con Megger de 500 V.',
            'Mida la resistencia de Aislamiento del cable y devanados del motor. Mínimo 100 MΩ con Megger de 1000 V.'
          ];

          let currRow = 15;
          reqs.forEach((lbl, i) => {
            ws1.getRow(currRow).height = i === 3 ? 32 : 24;
            ws1.getCell(`A${currRow}`).value = `0${i+1}`;
            applyStyle(ws1.getCell(`A${currRow}`));
            ws1.getCell(`A${currRow}`).font = { bold: true };

            ws1.mergeCells(`B${currRow}:J${currRow}`);
            ws1.getCell(`B${currRow}`).value = lbl;
            applyStyle(ws1.getCell(`B${currRow}`));
            ws1.getCell(`B${currRow}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            ws1.getCell(`B${currRow}`).font = { size: 9 };

            ws1.getCell(`K${currRow}`).value = comData[`RES_${i}`] || '';
            applyStyle(ws1.getCell(`K${currRow}`));
            ws1.getCell(`K${currRow}`).font = { size: 9, bold: true };

            ws1.getCell(`L${currRow}`).value = comData[`INI_${i}`] || '';
            applyStyle(ws1.getCell(`L${currRow}`));
            ws1.getCell(`L${currRow}`).font = { size: 9 };

            currRow++;
          });

          // Serial instrument note (Fila currRow)
          ws1.mergeCells(`A${currRow}:J${currRow}`);
          ws1.getCell(`A${currRow}`).value = 'NOTA. Registre el # del serial de todos los instrumentos involucrados en las pruebas:';
          applyStyle(ws1.getCell(`A${currRow}`), true);
          ws1.getCell(`A${currRow}`).alignment = { horizontal: 'left' };
          ws1.getCell(`A${currRow}`).font = { size: 8.5, bold: true };

          ws1.mergeCells(`K${currRow}:L${currRow}`);
          ws1.getCell(`K${currRow}`).value = comData['NOTA_SERIALES'] || '';
          applyStyle(ws1.getCell(`K${currRow}`));
          ws1.getCell(`K${currRow}`).font = { size: 9, bold: true };

          currRow += 2;

          // 5. PRUEBAS DE FUNCIONAMIENTO (Fila currRow)
          ws1.mergeCells(`A${currRow}:J${currRow}`);
          ws1.getCell(`A${currRow}`).value = 'PRUEBAS DE FUNCIONAMIENTO REQUERIDAS';
          applyStyle(ws1.getCell(`A${currRow}`), true);
          ws1.getCell(`A${currRow}`).alignment = { horizontal: 'left' };

          ws1.getCell(`K${currRow}`).value = 'RESULTADOS'; applyStyle(ws1.getCell(`K${currRow}`), true);
          ws1.getCell(`L${currRow}`).value = 'INICIAL. Y FECHA'; applyStyle(ws1.getCell(`L${currRow}`), true);

          currRow++;

          const funcRows = [
            'Corra el motor sin carga (Desacoplado) por 1 a 4 horas. Registre los datos. Nota: 1 Hora para motores<40 KW. 4 horas para motores>40 KW',
            'Verificar correspondencia de cargas',
            'Verifique el sentido de rotación.',
            'Corriente de arranque',
            'Tiempo de arranque'
          ];

          funcRows.forEach((lbl, i) => {
            ws1.getRow(currRow).height = i === 0 ? 32 : 22;
            ws1.mergeCells(`B${currRow}:J${currRow}`);
            ws1.getCell(`A${currRow}`).value = ''; applyStyle(ws1.getCell(`A${currRow}`));
            
            ws1.getCell(`B${currRow}`).value = lbl;
            applyStyle(ws1.getCell(`B${currRow}`));
            ws1.getCell(`B${currRow}`).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
            ws1.getCell(`B${currRow}`).font = { size: 9 };

            ws1.getCell(`K${currRow}`).value = comData[`FUNC_RES_${i}`] || '';
            applyStyle(ws1.getCell(`K${currRow}`));
            ws1.getCell(`K${currRow}`).font = { size: 9, bold: true };

            ws1.getCell(`L${currRow}`).value = comData[`FUNC_INI_${i}`] || '';
            applyStyle(ws1.getCell(`L${currRow}`));
            ws1.getCell(`L${currRow}`).font = { size: 9 };

            currRow++;
          });

          currRow += 2;

          // 6. TIME GRID TABLE (Fila currRow)
          ws1.mergeCells(`A${currRow}:L${currRow}`);
          ws1.getCell(`A${currRow}`).value = 'REGISTRO DE TEMPERATURA, CORRIENTE Y VIBRACIONES (Tiempo 15/30 min. Use 15 Minutos para periodos de 1 H.)';
          applyStyle(ws1.getCell(`A${currRow}`), true);
          ws1.getCell(`A${currRow}`).alignment = { horizontal: 'left' };
          
          currRow++;

          const times = ['0', '15', '30', '45', '60', '90', '120', '150', '180', '210', '240'];
          ws1.getCell(`A${currRow}`).value = 'Variable / Tiempo (min)';
          applyStyle(ws1.getCell(`A${currRow}`), true);

          times.forEach((t, i) => {
            const colLetter = String.fromCharCode(66 + i); // 66 is 'B'
            ws1.getCell(`${colLetter}${currRow}`).value = t;
            applyStyle(ws1.getCell(`${colLetter}${currRow}`), true);
          });

          currRow++;

          const gridRowsDef = [
            { id: 'TEMP_AMB', label: 'Temperatura Ambiente' },
            { id: 'TEMP_DE', label: 'Temperatura Cojinetes (Drive End)' },
            { id: 'TEMP_NDE', label: 'Temperatura Cojin. (Not Drive End)' },
            { id: 'CORRIENTE', label: 'Corriente' },
            { id: 'TEMP_DEV_90', label: 'Temperatura del Devanado 90°' },
            { id: 'TEMP_DEV_180', label: 'Temperatura del Devanado 180°' },
            { id: 'TEMP_DEV_270', label: 'Temperatura del Devanado 270°' },
            { id: 'VIB_DE_V', label: 'Medición Vibración (Drive End) V' },
            { id: 'VIB_DE_H', label: 'Medición Vibración (Drive End) H' },
            { id: 'VIB_NDE_V', label: 'Medición Vibración (Not Drive End) V' },
            { id: 'VIB_NDE_H', label: 'Medición Vibración (Not Drive End) H' }
          ];

          gridRowsDef.forEach(row => {
            ws1.getRow(currRow).height = 20;
            ws1.getCell(`A${currRow}`).value = row.label;
            applyStyle(ws1.getCell(`A${currRow}`), true);
            ws1.getCell(`A${currRow}`).alignment = { horizontal: 'left' };
            ws1.getCell(`A${currRow}`).font = { size: 8, bold: true, color: { argb: 'FFFFFFFF' } };

            times.forEach((t, i) => {
              const colLetter = String.fromCharCode(66 + i); // 'B' through 'L'
              const key = `GRID_${row.id}_${t}`;
              ws1.getCell(`${colLetter}${currRow}`).value = comData[key] || '';
              applyStyle(ws1.getCell(`${colLetter}${currRow}`));
              ws1.getCell(`${colLetter}${currRow}`).font = { size: 9, bold: true };
            });

            currRow++;
          });

          // NOTA: Terminada la prueba se aislará el motor.
          ws1.mergeCells(`A${currRow}:L${currRow}`);
          ws1.getCell(`A${currRow}`).value = 'NOTA: Terminada la prueba se aislará el motor.';
          applyStyle(ws1.getCell(`A${currRow}`));
          ws1.getCell(`A${currRow}`).alignment = { horizontal: 'left' };
          ws1.getCell(`A${currRow}`).font = { italic: true, bold: true, size: 9 };

          currRow += 2;

          // 7. FIRMAS (COMISIONAMIENTO FORMAT)
          ws1.mergeCells(`A${currRow}:C${currRow}`); 
          ws1.getCell(`A${currRow}`).value = 'CONTRATISTA Y/O VENDOR'; 
          applyStyle(ws1.getCell(`A${currRow}`), true);

          ws1.mergeCells(`D${currRow}:H${currRow}`); 
          ws1.getCell(`D${currRow}`).value = 'GESTOR DEL CONTRATO'; 
          applyStyle(ws1.getCell(`D${currRow}`), true);

          ws1.mergeCells(`I${currRow}:L${currRow}`); 
          ws1.getCell(`I${currRow}`).value = 'COMISIONAMIENTO'; 
          applyStyle(ws1.getCell(`I${currRow}`), true);

          ws1.mergeCells(`A${currRow+1}:C${currRow+1}`); ws1.getCell(`A${currRow+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_1 || ''}`; applyStyle(ws1.getCell(`A${currRow+1}`)); ws1.getCell(`A${currRow+1}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`D${currRow+1}:H${currRow+1}`); ws1.getCell(`D${currRow+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_2 || ''}`; applyStyle(ws1.getCell(`D${currRow+1}`)); ws1.getCell(`D${currRow+1}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`I${currRow+1}:L${currRow+1}`); ws1.getCell(`I${currRow+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_3 || ''}`; applyStyle(ws1.getCell(`I${currRow+1}`)); ws1.getCell(`I${currRow+1}`).alignment = {horizontal:'left'};

          ws1.mergeCells(`A${currRow+2}:C${currRow+2}`); ws1.getCell(`A${currRow+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_1 || ''}`; applyStyle(ws1.getCell(`A${currRow+2}`)); ws1.getCell(`A${currRow+2}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`D${currRow+2}:H${currRow+2}`); ws1.getCell(`D${currRow+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_2 || ''}`; applyStyle(ws1.getCell(`D${currRow+2}`)); ws1.getCell(`D${currRow+2}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`I${currRow+2}:L${currRow+2}`); ws1.getCell(`I${currRow+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_3 || ''}`; applyStyle(ws1.getCell(`I${currRow+2}`)); ws1.getCell(`I${currRow+2}`).alignment = {horizontal:'left'};

          ws1.mergeCells(`A${currRow+3}:C${currRow+3}`); ws1.getCell(`A${currRow+3}`).value = `FECHA: ${format(new Date(), 'dd.MM.yyyy')}`; applyStyle(ws1.getCell(`A${currRow+3}`)); ws1.getCell(`A${currRow+3}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`D${currRow+3}:H${currRow+3}`); ws1.getCell(`D${currRow+3}`).value = `FECHA: ${activeProfile.POT_FECHA_2 || ''}`; applyStyle(ws1.getCell(`D${currRow+3}`)); ws1.getCell(`D${currRow+3}`).alignment = {horizontal:'left'};
          ws1.mergeCells(`I${currRow+3}:L${currRow+3}`); ws1.getCell(`I${currRow+3}`).value = `FECHA: ${activeProfile.POT_FECHA_3 || ''}`; applyStyle(ws1.getCell(`I${currRow+3}`)); ws1.getCell(`I${currRow+3}`).alignment = {horizontal:'left'};

          ws1.mergeCells(`A${currRow+4}:C${currRow+6}`); ws1.getCell(`A${currRow+4}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`A${currRow+4}`)); ws1.getCell(`A${currRow+4}`).alignment = {vertical:'top', horizontal:'left'}; ws1.getCell(`A${currRow+4}`).font = { bold: true };
          ws1.mergeCells(`D${currRow+4}:H${currRow+6}`); ws1.getCell(`D${currRow+4}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`D${currRow+4}`)); ws1.getCell(`D${currRow+4}`).alignment = {vertical:'top', horizontal:'left'}; ws1.getCell(`D${currRow+4}`).font = { bold: true };
          ws1.mergeCells(`I${currRow+4}:L${currRow+6}`); ws1.getCell(`I${currRow+4}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`I${currRow+4}`)); ws1.getCell(`I${currRow+4}`).alignment = {vertical:'top', horizontal:'left'}; ws1.getCell(`I${currRow+4}`).font = { bold: true };

          ws1.getRow(currRow+4).height = 18;
          ws1.getRow(currRow+5).height = 18;
          ws1.getRow(currRow+6).height = 18;

          embedSig(activeProfile.POT_FIRMA_1, 0, 3, currRow+4);
          embedSig(activeProfile.POT_FIRMA_2, 3, 5, currRow+4);
          embedSig(activeProfile.POT_FIRMA_3, 8, 4, currRow+4);

        } else {
          ws1.columns = [
            { width: 12 }, { width: 12 }, { width: 12 }, { width: 18 }, 
            { width: 18 }, { width: 12 }, { width: 12 }, { width: 12 }
          ];
          
          // Logo
          ws1.mergeCells('A1:B2'); applyStyle(ws1.getCell('A1'));
          if (currentLogo) {
            try {
              const logoId = wb.addImage({ 
                base64: currentLogo.split(',')[1], 
                extension: 'png' 
              });
              ws1.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 120, height: 35 } });
            } catch (e) {
              console.error("Error embedding logo", e);
            }
          }

          ws1.mergeCells('C1:F2'); 
          ws1.getCell('C1').value = (activeProfile.TIPO as string) === 'POTENCIA' 
            ? (activeProfile.SUBTIPO === 'MOTOR' 
                ? 'LISTA DE CHEQUEO MOTOR BAJA TENSIÓN' 
                : 'LISTA DE CHEQUEO CABLE Y MOTOR BAJA TENSIÓN')
            : 'PROTOCOLO DE PRUEBAS DE INSTRUMENTACIÓN'; 
          applyStyle(ws1.getCell('C1'), true); 
          ws1.getCell('G1').value = 'REVISIÓN:'; applyStyle(ws1.getCell('G1'), true);
          ws1.getCell('H1').value = activeProfile.REVISION; applyStyle(ws1.getCell('H1'));
          ws1.getCell('G2').value = 'FECHA DE REVISIÓN:'; applyStyle(ws1.getCell('G2'), true);
          ws1.getCell('H2').value = activeProfile.FECHA_REVISION; applyStyle(ws1.getCell('H2'));

          ws1.getCell('A3').value = 'CLIENTE:'; applyStyle(ws1.getCell('A3'), true);
          ws1.mergeCells('B3:E3'); ws1.getCell('B3').value = activeProfile.CLIENTE; applyStyle(ws1.getCell('B3')); ws1.getCell('B3').alignment = {horizontal:'left'};
          ws1.mergeCells('F3:G3'); ws1.getCell('F3').value = 'FECHA:'; applyStyle(ws1.getCell('F3'), true); ws1.getCell('F3').alignment = {horizontal:'left'};
          ws1.getCell('H3').value = activeProfile.FECHA; applyStyle(ws1.getCell('H3')); ws1.getCell('H3').alignment = {horizontal:'left'};

          ws1.getCell('A4').value = 'PROYECTO:'; applyStyle(ws1.getCell('A4'), true);
          ws1.mergeCells('B4:E4'); ws1.getCell('B4').value = activeProfile.PROYECTO; applyStyle(ws1.getCell('B4')); ws1.getCell('B4').alignment = {horizontal:'left'};
          ws1.mergeCells('F4:G4'); ws1.getCell('F4').value = 'CONTRATO:'; applyStyle(ws1.getCell('F4'), true); ws1.getCell('F4').alignment = {horizontal:'left'};
          ws1.getCell('H4').value = activeProfile.CONTRATO; applyStyle(ws1.getCell('H4')); ws1.getCell('H4').alignment = {horizontal:'left'};

          // 1. INFORMACIÓN GENERAL
          ws1.mergeCells('A6:H6'); ws1.getCell('A6').value = activeProfile.TIPO.startsWith('POTENCIA') ? '1. INFORMACIÓN DEL EQUIPO' : '1. INFORMACIÓN GENERAL DEL INSTRUMENTO'; applyStyle(ws1.getCell('A6'), true); ws1.getCell('A6').alignment = {horizontal:'left'};
              ws1.mergeCells('A7:B7'); ws1.getCell('A7').value = 'Tag No:'; applyStyle(ws1.getCell('A7'), true); ws1.getCell('A7').alignment = {horizontal:'left'};
          ws1.mergeCells('C7:D7'); ws1.getCell('C7').value = (activeItem as any)[tagKey]; applyStyle(ws1.getCell('C7')); ws1.getCell('C7').alignment = {horizontal:'left'};
          ws1.mergeCells('E7:F7'); ws1.getCell('E7').value = 'Fabricante/Modelo:'; applyStyle(ws1.getCell('E7'), true); ws1.getCell('E7').alignment = {horizontal:'left'};
          ws1.mergeCells('G7:H7'); ws1.getCell('G7').value = activeProfile.FABRICANTE_MODELO || 'N/A'; applyStyle(ws1.getCell('G7')); ws1.getCell('G7').alignment = {horizontal:'left'};
          
          ws1.mergeCells('A8:B8'); ws1.getCell('A8').value = activeProfile.TIPO.startsWith('POTENCIA') ? 'Descripción:' : 'Tipo Cable / Desc:'; applyStyle(ws1.getCell('A8'), true); ws1.getCell('A8').alignment = {horizontal:'left'};
          ws1.mergeCells('C8:H8'); 
          ws1.getCell('C8').value = activeProfile.TIPO.startsWith('POTENCIA') 
            ? (activeItem as any).DESCRIPCIÓN || ''
            : `${(activeItem as any).TIPO_CABLE || activeProfile.TIPO_CABLE || ''} / ${(activeItem as any).DESCRIPCIÓN || ''}`;
          applyStyle(ws1.getCell('C8')); ws1.getCell('C8').alignment = {horizontal:'left'};
          
          if (!activeProfile.TIPO.startsWith('POTENCIA')) {
            ws1.mergeCells('A9:B9'); ws1.getCell('A9').value = 'Rango de Operación:'; applyStyle(ws1.getCell('A9'), true); ws1.getCell('A9').alignment = {horizontal:'left'};
            ws1.mergeCells('C9:D9'); ws1.getCell('C9').value = activeProfile.RANGO_OPERACION || 'N/A'; applyStyle(ws1.getCell('C9')); ws1.getCell('C9').alignment = {horizontal:'left'};
            ws1.mergeCells('E9:F9'); ws1.getCell('E9').value = 'Clase de Exactitud:'; applyStyle(ws1.getCell('E9'), true); ws1.getCell('E9').alignment = {horizontal:'left'};
            ws1.mergeCells('G9:H9'); ws1.getCell('G9').value = activeProfile.CLASE_EXACTITUD || 'N/A'; applyStyle(ws1.getCell('G9')); ws1.getCell('G9').alignment = {horizontal:'left'};
      
            ws1.mergeCells('A10:B10'); ws1.getCell('A10').value = 'Ubicación:'; applyStyle(ws1.getCell('A10'), true); ws1.getCell('A10').alignment = {horizontal:'left'};
            ws1.mergeCells('C10:D10'); ws1.getCell('C10').value = (activeItem as any).UBICACIÓN || ''; applyStyle(ws1.getCell('C10')); ws1.getCell('C10').alignment = {horizontal:'left'};
            ws1.mergeCells('E10:F10'); ws1.getCell('E10').value = 'Tag Cable SWC:'; applyStyle(ws1.getCell('E10'), true); ws1.getCell('E10').alignment = {horizontal:'left'};
            ws1.mergeCells('G10:H10'); ws1.getCell('G10').value = (activeItem as any).TAG_CABLE_SWC || 'N/A'; applyStyle(ws1.getCell('G10')); ws1.getCell('G10').alignment = {horizontal:'left'};
          }

          // 2. CONDICIONES DE LA PRUEBA
          ws1.mergeCells('A12:H12'); ws1.getCell('A12').value = '2. CONDICIONES DE LA PRUEBA'; applyStyle(ws1.getCell('A12'), true); ws1.getCell('A12').alignment = {horizontal:'left'};
          ws1.mergeCells('A13:B13'); ws1.getCell('A13').value = 'Norma/Procedimiento:'; applyStyle(ws1.getCell('A13'), true); ws1.getCell('A13').alignment = {horizontal:'left'};
          ws1.mergeCells('C13:H13'); ws1.getCell('C13').value = activeProfile.NORMA_PROCEDIMIENTO; applyStyle(ws1.getCell('C13')); ws1.getCell('C13').alignment = {horizontal:'left'};
          
          ws1.mergeCells('A14:B15'); ws1.getCell('A14').value = 'Tipo de Prueba:'; applyStyle(ws1.getCell('A14'), true); ws1.getCell('A14').alignment = {horizontal:'left', vertical:'middle'};
          ws1.mergeCells('C14:E14'); ws1.getCell('C14').value = activeProfile.TIPO_PRUEBA_PLANO ? '☑ Equipo instalado en ubicación/PLANO' : '☐ Equipo instalado en ubicación/PLANO'; applyStyle(ws1.getCell('C14')); ws1.getCell('C14').alignment = {horizontal:'left'};
          ws1.mergeCells('F14:H14'); ws1.getCell('F14').value = activeProfile.TIPO_PRUEBA_FUNC_SIM ? '☑ Prueba funcional simulada' : '☐ Prueba funcional simulada'; applyStyle(ws1.getCell('F14')); ws1.getCell('F14').alignment = {horizontal:'left'};
          ws1.mergeCells('C15:E15'); ws1.getCell('C15').value = activeProfile.TIPO_PRUEBA_LOOP ? '☑ Pruebas de lazo (loop check)' : '☐ Pruebas de lazo (loop check)'; applyStyle(ws1.getCell('C15')); ws1.getCell('C15').alignment = {horizontal:'left'};
          ws1.mergeCells('F15:H15'); ws1.getCell('F15').value = activeProfile.TIPO_PRUEBA_FUNC_LINEA ? '☑ Prueba funcional acoplada a línea' : '☐ Prueba funcional acoplada a línea'; applyStyle(ws1.getCell('F15')); ws1.getCell('F15').alignment = {horizontal:'left'};

          ws1.mergeCells('A16:B16'); ws1.getCell('A16').value = 'Equipo de prueba 1:'; applyStyle(ws1.getCell('A16'), true); ws1.getCell('A16').alignment = {horizontal:'left'};
          ws1.mergeCells('C16:E16'); ws1.getCell('C16').value = activeProfile.EQUIPO_PRUEBA_1; applyStyle(ws1.getCell('C16')); ws1.getCell('C16').alignment = {horizontal:'left'};
          ws1.mergeCells('F16:G16'); ws1.getCell('F16').value = 'Certificado/Fecha de Vigencia:'; applyStyle(ws1.getCell('F16'), true); ws1.getCell('F16').alignment = {horizontal:'left'};
          ws1.getCell('H16').value = activeProfile.CERT_FECHA_1; applyStyle(ws1.getCell('H16')); ws1.getCell('H16').alignment = {horizontal:'left'};

          ws1.mergeCells('A17:B17'); ws1.getCell('A17').value = 'Equipo de prueba 2:'; applyStyle(ws1.getCell('A17'), true); ws1.getCell('A17').alignment = {horizontal:'left'};
          ws1.mergeCells('C17:E17'); ws1.getCell('C17').value = activeProfile.EQUIPO_PRUEBA_2; applyStyle(ws1.getCell('C17')); ws1.getCell('C17').alignment = {horizontal:'left'};
          ws1.mergeCells('F17:G17'); ws1.getCell('F17').value = 'Certificado/Fecha de Vigencia:'; applyStyle(ws1.getCell('F17'), true); ws1.getCell('F17').alignment = {horizontal:'left'};
          ws1.getCell('H17').value = activeProfile.CERT_FECHA_2; applyStyle(ws1.getCell('H17')); ws1.getCell('H17').alignment = {horizontal:'left'};

          // 3. Pruebas de Lazo (Loop Check)
          ws1.mergeCells('A19:H19'); ws1.getCell('A19').value = '3. PRUEBAS DE LAZO (LOOP CHECK)'; applyStyle(ws1.getCell('A19'), true); ws1.getCell('A19').alignment = {horizontal:'left'};
          ws1.mergeCells('A20:C20'); ws1.getCell('A20').value = activeProfile.LOOP_C1 || ''; applyStyle(ws1.getCell('A20'), true);
          ws1.mergeCells('D20:E20'); ws1.getCell('D20').value = activeProfile.LOOP_C2 || ''; applyStyle(ws1.getCell('D20'), true);
          ws1.mergeCells('F20:H20'); ws1.getCell('F20').value = activeProfile.LOOP_C3 || ''; applyStyle(ws1.getCell('F20'), true);

          const addLoopRow = (r: number, v1: string, v2: string, v3: string) => {
            ws1.mergeCells(`A${r}:C${r}`); ws1.getCell(`A${r}`).value = v1; applyStyle(ws1.getCell(`A${r}`));
            ws1.mergeCells(`D${r}:E${r}`); ws1.getCell(`D${r}`).value = v2; applyStyle(ws1.getCell(`D${r}`));
            ws1.mergeCells(`F${r}:H${r}`); ws1.getCell(`F${r}`).value = v3; applyStyle(ws1.getCell(`F${r}`));
          };
          addLoopRow(21, activeProfile.L1_C1, activeProfile.L1_C2, activeProfile.L1_C3);
          addLoopRow(22, activeProfile.L2_C1, activeProfile.L2_C2, activeProfile.L2_C3);
          addLoopRow(23, activeProfile.L3_C1, activeProfile.L3_C2, activeProfile.L3_C3);

          // 4. Inspección
          ws1.mergeCells('A25:H25'); ws1.getCell('A25').value = '4. INSPECCIÓN'; applyStyle(ws1.getCell('A25'), true); ws1.getCell('A25').alignment = {horizontal:'left'};
          ws1.mergeCells('A26:D26'); ws1.getCell('A26').value = 'Ítem Revisado'; applyStyle(ws1.getCell('A26'), true);
          ws1.getCell('E26').value = 'Estado'; applyStyle(ws1.getCell('E26'), true);
          ws1.mergeCells('F26:H26'); ws1.getCell('F26').value = 'Observaciones'; applyStyle(ws1.getCell('F26'), true);

          const addInspRow = (r: number, label: string, val: string, obs: string) => {
            ws1.mergeCells(`A${r}:D${r}`); ws1.getCell(`A${r}`).value = label; applyStyle(ws1.getCell(`A${r}`)); ws1.getCell(`A${r}`).alignment = {horizontal:'left', wrapText:true};
            ws1.getCell(`E${r}`).value = val; applyStyle(ws1.getCell(`E${r}`));
            ws1.mergeCells(`F${r}:H${r}`); ws1.getCell(`F${r}`).value = obs; applyStyle(ws1.getCell(`F${r}`)); ws1.getCell(`F${r}`).alignment = {horizontal:'left', wrapText:true};
          };
          addInspRow(27, activeProfile.LABEL_4_1, activeProfile.INSP_4_1, activeProfile.OBS_4_1);
          addInspRow(28, activeProfile.LABEL_4_2, activeProfile.INSP_4_2, activeProfile.OBS_4_2);
          addInspRow(29, activeProfile.LABEL_4_3, activeProfile.INSP_4_3, activeProfile.OBS_4_3);
          addInspRow(30, activeProfile.LABEL_4_4, activeProfile.INSP_4_4, activeProfile.OBS_4_4);

          // 5. Comentarios
          ws1.mergeCells('A32:H32'); ws1.getCell('A32').value = '5. COMENTARIOS'; applyStyle(ws1.getCell('A32'), true); ws1.getCell('A32').alignment = {horizontal:'left'};
          ws1.mergeCells('A33:H34'); ws1.getCell('A33').value = activeProfile.COMENTARIOS; applyStyle(ws1.getCell('A33')); ws1.getCell('A33').alignment = {vertical: 'top', horizontal:'left', wrapText:true};

          let currentRow = 36;

          // FOTOS
          if (fotosDelTag.length > 0) {
            ws1.mergeCells(`A${currentRow}:H${currentRow}`); 
            ws1.getCell(`A${currentRow}`).value = `6. REGISTRO FOTOGRÁFICO`; 
            applyStyle(ws1.getCell(`A${currentRow}`), true); 
            ws1.getCell(`A${currentRow}`).alignment = {horizontal:'left'};
            currentRow++;

            fotosDelTag.forEach((foto, idx) => {
              const isLeft = idx % 2 === 0;
              const rowOffset = Math.floor(idx / 2) * 16;
              const r = currentRow + rowOffset;
              const colStart = isLeft ? 'A' : 'E';
              const colEnd = isLeft ? 'D' : 'H';
              const colIdx = isLeft ? 0 : 4;

              // Asegurar alturas de filas para que las fotos no se vean "incompletas"
              for (let h = 0; h < 15; h++) {
                ws1.getRow(r + h).height = 18;
              }
              ws1.getRow(r + 15).height = 15; // Altura para observación

              ws1.mergeCells(`${colStart}${r}:${colEnd}${r+14}`);
              applyStyle(ws1.getCell(`${colStart}${r}`));
              
              try {
                const mimeType = foto.blobData.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
                const ext = (mimeType.split('/')[1] || 'jpeg').replace('jpg', 'jpeg');
                
                const imageId = wb.addImage({ 
                  base64: foto.blobData.split(',')[1], 
                  extension: ext as any
                });
                
                // Ajuste de posicionamiento y tamaño
                // Usaremos coordenadas 'tl' (top-left) y 'br' (bottom-right) para que exceljs lo ancle al recuadro.
                ws1.addImage(imageId, { 
                  tl: { col: colIdx + 0.2, row: r - 1 + 0.3 } as any, 
                  br: { col: colIdx + 3.8, row: r - 1 + 14.7 } as any,
                  editAs: 'oneCell'
                });
              } catch (e) {
                console.error("Error adding photo to spreadsheet", e);
              }

              ws1.mergeCells(`${colStart}${r+15}:${colEnd}${r+15}`);
              ws1.getCell(`${colStart}${r+15}`).value = foto.observacion || `Foto ${idx+1}`; 
              applyStyle(ws1.getCell(`${colStart}${r+15}`));
            });

            currentRow += Math.ceil(fotosDelTag.length / 2) * 16 + 1;
          }

          // Firmas
          const isPotencia = (activeProfile.TIPO as string).startsWith('POTENCIA');
          
          ws1.mergeCells(`A${currentRow}:C${currentRow}`); 
          ws1.getCell(`A${currentRow}`).value = isPotencia ? 'CONTRATISTA Y/O VENDOR' : 'ELABORÓ'; 
          applyStyle(ws1.getCell(`A${currentRow}`), true);

          ws1.mergeCells(`D${currentRow}:E${currentRow}`); 
          ws1.getCell(`D${currentRow}`).value = isPotencia ? (((activeProfile.TIPO as string) === 'POTENCIA_COM' ? 'GESTOR DEL CONTRATO' : 'PRECOMISIONAMIENTO')) : 'REVISÓ'; 
          applyStyle(ws1.getCell(`D${currentRow}`), true);

          ws1.mergeCells(`F${currentRow}:H${currentRow}`); 
          ws1.getCell(`F${currentRow}`).value = isPotencia ? 'COMISIONAMIENTO' : 'APROBÓ (CLIENTE / INTERVENTOR)'; 
          applyStyle(ws1.getCell(`F${currentRow}`), true);
          
          // Fila de NOMBRES / COMPAÑÍAS
          if (isPotencia) {
            ws1.mergeCells(`A${currentRow+1}:C${currentRow+1}`); ws1.getCell(`A${currentRow+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_1 || ''}`; applyStyle(ws1.getCell(`A${currentRow+1}`)); ws1.getCell(`A${currentRow+1}`).alignment = {horizontal:'left'};
            ws1.mergeCells(`D${currentRow+1}:E${currentRow+1}`); ws1.getCell(`D${currentRow+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_2 || ''}`; applyStyle(ws1.getCell(`D${currentRow+1}`)); ws1.getCell('D' + (currentRow+1)).alignment = {horizontal:'left'};
            ws1.mergeCells(`F${currentRow+1}:H${currentRow+1}`); ws1.getCell(`F${currentRow+1}`).value = `COMPAÑÍA: ${activeProfile.POT_COMPANIA_3 || ''}`; applyStyle(ws1.getCell(`F${currentRow+1}`)); ws1.getCell('F' + (currentRow+1)).alignment = {horizontal:'left'};

            ws1.mergeCells(`A${currentRow+2}:C${currentRow+2}`); ws1.getCell(`A${currentRow+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_1 || ''}`; applyStyle(ws1.getCell(`A${currentRow+2}`)); ws1.getCell('A' + (currentRow+2)).alignment = {horizontal:'left'};
            ws1.mergeCells(`D${currentRow+2}:E${currentRow+2}`); ws1.getCell(`D${currentRow+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_2 || ''}`; applyStyle(ws1.getCell(`D${currentRow+2}`)); ws1.getCell('D' + (currentRow+2)).alignment = {horizontal:'left'};
            ws1.mergeCells(`F${currentRow+2}:H${currentRow+2}`); ws1.getCell(`F${currentRow+2}`).value = `NOMBRE: ${activeProfile.POT_NOMBRE_3 || ''}`; applyStyle(ws1.getCell(`F${currentRow+2}`)); ws1.getCell('F' + (currentRow+2)).alignment = {horizontal:'left'};
            
            ws1.mergeCells(`A${currentRow+6}:C${currentRow+6}`); ws1.getCell(`A${currentRow+6}`).value = `FECHA: ${format(new Date(), 'dd.MM.yyyy')}`; applyStyle(ws1.getCell(`A${currentRow+6}`)); ws1.getCell('A' + (currentRow+6)).alignment = {horizontal:'left'};
            ws1.mergeCells(`D${currentRow+6}:E${currentRow+6}`); ws1.getCell(`D${currentRow+6}`).value = `FECHA: ${activeProfile.POT_FECHA_2 || ''}`; applyStyle(ws1.getCell(`D${currentRow+6}`)); ws1.getCell('D' + (currentRow+6)).alignment = {horizontal:'left'};
            ws1.mergeCells(`F${currentRow+6}:H${currentRow+6}`); ws1.getCell(`F${currentRow+6}`).value = `FECHA: ${activeProfile.POT_FECHA_3 || ''}`; applyStyle(ws1.getCell(`F${currentRow+6}`)); ws1.getCell('F' + (currentRow+6)).alignment = {horizontal:'left'};
          } else {
            ws1.mergeCells(`A${currentRow+1}:C${currentRow+1}`); ws1.getCell(`A${currentRow+1}`).value = `NOMBRE: ${activeProfile.ELABORO_NOMBRE}`; applyStyle(ws1.getCell(`A${currentRow+1}`)); ws1.getCell(`A${currentRow+1}`).alignment = {horizontal:'left'};
            ws1.mergeCells(`D${currentRow+1}:E${currentRow+1}`); ws1.getCell(`D${currentRow+1}`).value = `NOMBRE: ${activeProfile.REVISO_NOMBRE}`; applyStyle(ws1.getCell(`D${currentRow+1}`)); ws1.getCell('D' + (currentRow+1)).alignment = {horizontal:'left'};
            ws1.mergeCells(`F${currentRow+1}:H${currentRow+1}`); ws1.getCell(`F${currentRow+1}`).value = `NOMBRE: ${activeProfile.APROBO_NOMBRE}`; applyStyle(ws1.getCell(`F${currentRow+1}`)); ws1.getCell('F' + (currentRow+1)).alignment = {horizontal:'left'};

            ws1.mergeCells(`A${currentRow+2}:C${currentRow+2}`); ws1.getCell(`A${currentRow+2}`).value = `CARGO: ${activeProfile.ELABORO_CARGO}`; applyStyle(ws1.getCell(`A${currentRow+2}`)); ws1.getCell('A' + (currentRow+2)).alignment = {horizontal:'left'};
            ws1.mergeCells(`D${currentRow+2}:E${currentRow+2}`); ws1.getCell(`D${currentRow+2}`).value = `CARGO: ${activeProfile.REVISO_CARGO}`; applyStyle(ws1.getCell(`D${currentRow+2}`)); ws1.getCell('D' + (currentRow+2)).alignment = {horizontal:'left'};
            ws1.mergeCells(`F${currentRow+2}:H${currentRow+2}`); ws1.getCell(`F${currentRow+2}`).value = `CARGO: ${activeProfile.APROBO_CARGO}`; applyStyle(ws1.getCell(`F${currentRow+2}`)); ws1.getCell('F' + (currentRow+2)).alignment = {horizontal:'left'};
            
            ws1.mergeCells(`A${currentRow+6}:C${currentRow+6}`); ws1.getCell(`A${currentRow+6}`).value = `FECHA: ${format(new Date(), 'dd.MM.yyyy')}`; applyStyle(ws1.getCell(`A${currentRow+6}`)); ws1.getCell('A' + (currentRow+6)).alignment = {horizontal:'left'};
            ws1.mergeCells(`D${currentRow+6}:E${currentRow+6}`); ws1.getCell(`D${currentRow+6}`).value = `FECHA: `; applyStyle(ws1.getCell(`D${currentRow+6}`)); ws1.getCell('D' + (currentRow+6)).alignment = {horizontal:'left'};
            ws1.mergeCells(`F${currentRow+6}:H${currentRow+6}`); ws1.getCell(`F${currentRow+6}`).value = `FECHA: `; applyStyle(ws1.getCell(`F${currentRow+6}`)); ws1.getCell('F' + (currentRow+6)).alignment = {horizontal:'left'};
          }

          ws1.getRow(currentRow+3).height = 18;
          ws1.getRow(currentRow+4).height = 18;
          ws1.getRow(currentRow+5).height = 18;

          ws1.mergeCells(`A${currentRow+3}:C${currentRow+5}`); ws1.getCell(`A${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`A${currentRow+3}`)); ws1.getCell(`A${currentRow+3}`).font = { bold: true }; ws1.getCell(`A${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};
          ws1.mergeCells(`D${currentRow+3}:E${currentRow+5}`); ws1.getCell(`D${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`D${currentRow+3}`)); ws1.getCell(`D${currentRow+3}`).font = { bold: true }; ws1.getCell(`D${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};
          ws1.mergeCells(`F${currentRow+3}:H${currentRow+5}`); ws1.getCell(`F${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`F${currentRow+3}`)); ws1.getCell(`F${currentRow+3}`).font = { bold: true }; ws1.getCell(`F${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};

          if (isPotencia) {
            embedSig(activeProfile.POT_FIRMA_1, 0, 3, currentRow+3);
            embedSig(activeProfile.POT_FIRMA_2, 3, 2, currentRow+3);
            embedSig(activeProfile.POT_FIRMA_3, 5, 3, currentRow+3);
          } else {
            embedSig(activeProfile.ELABORO_FIRMA, 0, 3, currentRow+3);
            embedSig(activeProfile.REVISO_FIRMA, 3, 2, currentRow+3);
            embedSig(activeProfile.APROBO_FIRMA, 5, 3, currentRow+3);
          }
        }
      }

      const buffer = await wb.xlsx.writeBuffer();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buffer]));
      a.download = selectedTags.length === 1 ? `Protocolo_${selectedTags[0]}.xlsx` : `Protocolos_Masivos_${selectedTags.length}TAGs.xlsx`;
      a.click();
      await limpiarDespuesDeExportar(selectedTags);
    } catch (e) { 
      setExportError("Error generando Excel."); 
      console.error(e);
    } finally { 
      setIsExporting(false); 
    }
  };

  const exportarPDF = async (tipoSalida: 'UNIDO' | 'SEPARADOS') => {
    if (selectedTags.length === 0 || !activeProfile) { 
        setExportError("Selecciona instrumentos y perfil para generar PDF."); 
        return; 
    }
    
    setIsExporting(true);
    setExportProgress(modoExportacion === 'LOCAL' ? 0 : 5);
    setExportError(null);
    let driveFotosDownloaded: any[] = [];
    try {
      driveFotosDownloaded = await populateDriveBlobs(selectedTags);
      
      // Log backup
      await logExportAction('PDF');
      
      const buildHtmlForTag = (tag: string) => {
        const activeItem = currentItems.find(i => (i as any)[tagKey] === tag);
        const fotosDelTag = (modoExportacion === 'DRIVE' 
          ? driveFotosDownloaded.filter(f => f.TAGNAME === tag)
          : fotos.filter(f => f.TAGNAME === tag)).slice(0, 4);

        if (!activeItem) return '';

        const currentLogo = (activeProfile.TIPO === 'POTENCIA' || activeProfile.TIPO === 'POTENCIA_COM') ? logoPotencia : logoInstrumentacion;

        if (activeProfile.TIPO === 'POTENCIA') {
          const cabeceraFormatoHtml = `
            <!-- CABECERA -->
            <table class="grid-table">
              <tr>
                <td colspan="2" rowspan="3" class="center no-padding" style="width: 25%;">
                  ${currentLogo ? `<img src="${currentLogo}" style="max-height: 50px; max-width: 90%; object-fit: contain; margin: 5px;" />` : 'LOGO'}
                </td>
                <td colspan="4" class="center" style="font-weight: bold; font-family: 'Calibri', 'Arial', sans-serif;">Ingeniería y Proyectos</td>
                <td class="bg-blue" style="width: 12.5%; font-weight: bold;">Código:</td>
                <td class="center" style="width: 12.5%;">${activeProfile.POT_CODIGO || ''}</td>
              </tr>
              <tr>
                <td colspan="4" rowspan="2" class="center" style="font-size: 14px; font-weight: bold; font-family: 'Calibri', 'Arial', sans-serif;">
                  Formato Precomisionamiento<br/>
                  ${activeProfile.SUBTIPO === 'MOTOR' 
                    ? 'Lista de chequeo Motor baja tensión' 
                    : 'Lista de chequeo Cable y Motor baja tensión'
                  }<br/>CHKL-ELE-08
                </td>
                <td class="bg-blue" style="font-weight: bold;">Fecha:</td>
                <td class="center">${activeProfile.FECHA_REVISION || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue" style="font-weight: bold;">Versión:</td>
                <td class="center">${activeProfile.REVISION || ''}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-left font-bold" style="width: 37.5%">PROYECTO: <span style="font-weight: normal">${activeProfile.PROYECTO || ''}</span></td>
                <td colspan="3" class="text-left font-bold" style="width: 37.5%">AC-1 No: <span style="font-weight: normal">${activeProfile.AC1_NO || ''}</span></td>
                <td colspan="2" class="text-left font-bold" style="width: 25%">HC-1 No: <span style="font-weight: normal">${activeProfile.HC1_NO || ''}</span></td>
              </tr>
              <tr>
                <td colspan="3" class="text-left font-bold">CONTRATISTA: <span style="font-weight: normal">${activeProfile.CONTRATISTA || ''}</span></td>
                <td colspan="3" class="text-left font-bold">AREA: <span style="font-weight: normal">${activeProfile.AREA || ''}</span></td>
                <td colspan="2" class="text-left font-bold">LOCACION: <span style="font-weight: normal">${activeProfile.LOCACION || ''}</span></td>
              </tr>
              <tr>
                <td colspan="3" class="text-left font-bold">SERVICIO: <span style="font-weight: normal">${activeProfile.SERVICIO || ''}</span></td>
                <td colspan="3" class="text-left font-bold">P & ID No: <span style="font-weight: normal">${activeProfile.P_ID_NO || ''}</span></td>
                <td colspan="2" class="text-left font-bold">REV: <span style="font-weight: normal">${activeProfile.REV_P_ID || ''}</span></td>
              </tr>
              <tr>
                <td colspan="3" class="text-left font-bold">PAQUETE No: <span style="font-weight: normal">${activeProfile.PAQUETE_NO || ''}</span></td>
                <td colspan="3" class="text-left font-bold">PLANO No: <span style="font-weight: normal">${activeProfile.PLANO_NO || ''}</span></td>
                <td colspan="2" class="text-left font-bold">REV: <span style="font-weight: normal">${activeProfile.REV_PLANO || ''}</span></td>
              </tr>
            </table>
          `;

          return `
          <!-- PAGINA 1: LISTA DE CHEQUEO -->
          <div class="protocol-page">
            ${cabeceraFormatoHtml}

            <!-- LISTA DE CHEQUEO -->
            <table class="grid-table mt-4">
              <tr>
                <td rowspan="2" class="bg-blue center font-bold" style="width: 10%;">ITEM</td>
                <td rowspan="2" class="bg-blue center font-bold" style="width: 60%;">DESCRIPCION</td>
                <td colspan="3" class="bg-blue center font-bold" style="width: 30%;">ESTADO</td>
              </tr>
              <tr>
                <td class="bg-blue center font-bold" style="width: 10%;">CUMPLE</td>
                <td class="bg-blue center font-bold" style="width: 10%;">NO CUMPLE</td>
                <td class="bg-blue center font-bold" style="width: 10%;">N/A</td>
              </tr>
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(num => `
                <tr>
                  <td class="center font-bold">${num}</td>
                  <td class="text-left" style="font-size: 11px; padding: 4px;">${(activeProfile as any)[`CHKL_${num}_DESC`] || ''}</td>
                  <td class="center font-bold">${(activeProfile as any)[`CHKL_${num}_ESTADO`] === 'CUMPLE' ? 'X' : ''}</td>
                  <td class="center font-bold">${(activeProfile as any)[`CHKL_${num}_ESTADO`] === 'NO_CUMPLE' ? 'X' : ''}</td>
                  <td class="center font-bold">${(activeProfile as any)[`CHKL_${num}_ESTADO`] === 'N/A' ? 'X' : ''}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="5" style="text-align: left; padding: 10px; height: 120px; vertical-align: top;">
                  <div style="font-weight: bold; margin-bottom: 5px;">Comentarios:</div>
                  <div style="white-space: pre-wrap; font-family: monospace; font-size: 11px;">${activeProfile.COMENTARIOS || ''}</div>
                </td>
              </tr>
            </table>
          </div>

          <!-- PAGINA 2: REGISTRO FOTOGRÁFICO Y FIRMAS -->
          <div class="protocol-page" style="page-break-before: always;">
            ${cabeceraFormatoHtml}

            <!-- REGISTRO FOTOGRÁFICO -->
            ${fotosDelTag.length > 0 ? `
              <table class="grid-table mt-4">
                <tr><td class="bg-blue text-left font-bold" style="padding: 4px 8px;">6. REGISTRO FOTOGRÁFICO</td></tr>
              </table>
              <div class="photo-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 10px;">
                ${fotosDelTag.map((f, i) => `
                  <div class="photo-item" style="border: 1px solid #ddd; padding: 8px; border-radius: 4px; display: flex; flex-direction: column; align-items: center; justify-self: center; width: 100%; max-width: 320px;">
                    <div class="photo-box" style="width: 100%; height: 180px; display: flex; align-items: center; justify-content: center; background-color: #fcfcfc; overflow: hidden; border: 1px solid #eee; border-radius: 2px;">
                      <img src="${f.blobData}" style="max-height: 100%; max-width: 100%; object-fit: contain;" />
                    </div>
                    <div class="photo-caption" style="margin-top: 8px; font-size: 11px; text-align: center; color: #555; word-wrap: break-word; width: 100%;">${f.observacion || `Foto ${i+1}`}</div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div style="height: 140px; display: flex; align-items: center; justify-content: center; border: 1px dashed #ccc; margin-top: 20px; border-radius: 4px; font-weight: bold; color: #999;">
                SIN REGISTRO FOTOGRÁFICO
              </div>
            `}

            <!-- FIRMAS -->
            <table class="grid-table mt-6" style="page-break-inside: avoid; margin-top: 30px;">
              <tr>
                <td colspan="3" class="bg-blue" style="font-weight: bold;">CONTRATISTA Y/O VENDOR</td>
                <td colspan="3" class="bg-blue" style="font-weight: bold;">PRECOMISIONAMIENTO</td>
                <td colspan="2" class="bg-blue" style="font-weight: bold;">COMISIONAMIENTO</td>
              </tr>
              <tr>
                <td class="text-left font-bold" style="width: 15%">COMPAÑÍA</td>
                <td colspan="2" class="text-left">${activeProfile.POT_COMPANIA_1 || ''}</td>
                <td colspan="3" class="text-left">${activeProfile.POT_COMPANIA_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_COMPANIA_3 || ''}</td>
              </tr>
              <tr>
                <td class="text-left font-bold">FIRMA</td>
                <td colspan="2" class="signature-box" style="height: 60px; vertical-align: middle; text-align: center;">
                  ${activeProfile.POT_FIRMA_1 ? `<img src="${activeProfile.POT_FIRMA_1}" class="sign-img" style="max-height: 50px; max-width: 90%; object-fit: contain;" />` : ''}
                </td>
                <td colspan="3" class="signature-box" style="height: 60px; vertical-align: middle; text-align: center;">
                  ${activeProfile.POT_FIRMA_2 ? `<img src="${activeProfile.POT_FIRMA_2}" class="sign-img" style="max-height: 50px; max-width: 90%; object-fit: contain;" />` : ''}
                </td>
                <td colspan="2" class="signature-box" style="height: 60px; vertical-align: middle; text-align: center;">
                  ${activeProfile.POT_FIRMA_3 ? `<img src="${activeProfile.POT_FIRMA_3}" class="sign-img" style="max-height: 50px; max-width: 90%; object-fit: contain;" />` : ''}
                </td>
              </tr>
              <tr>
                <td class="text-left font-bold">NOMBRE</td>
                <td colspan="2" class="text-left">${activeProfile.POT_NOMBRE_1 || ''}</td>
                <td colspan="3" class="text-left">${activeProfile.POT_NOMBRE_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_NOMBRE_3 || ''}</td>
              </tr>
              <tr>
                <td class="text-left font-bold">FECHA</td>
                <td colspan="2" class="text-left">${format(new Date(), 'dd.MM.yyyy')}</td>
                <td colspan="3" class="text-left">${activeProfile.POT_FECHA_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_FECHA_3 || ''}</td>
              </tr>
            </table>
          </div>
          `;
        }

        if (activeProfile.TIPO === 'POTENCIA_COM') {
          let comData: any = {};
          try { comData = JSON.parse(activeProfile.POT_COM_DATA || '{}'); } catch(e){}

          return `
          <div class="protocol-page">
            <!-- CABECERA -->
            <table class="grid-table">
              <tr>
                <td colspan="2" rowspan="3" class="center no-padding" style="width: 25%;">
                  ${currentLogo ? `<img src="${currentLogo}" style="max-height: 50px; max-width: 90%; object-fit: contain; margin: 5px;" />` : 'LOGO'}
                </td>
                <td colspan="4" class="center">Ingeniería y Proyectos</td>
                <td class="bg-blue" style="width: 12.5%;">Código:</td>
                <td class="center" style="width: 12.5%;">${activeProfile.POT_CODIGO || ''}</td>
              </tr>
              <tr>
                <td colspan="4" rowspan="2" class="center" style="font-size: 14px; font-weight: bold;">
                  Formato Comisionamiento<br/>Motor de baja tensión<br/>SKC-P-F-005
                </td>
                <td class="bg-blue">Fecha:</td>
                <td class="center">${activeProfile.FECHA_REVISION || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">Versión:</td>
                <td class="center">${activeProfile.REVISION || ''}</td>
              </tr>
              <tr>
                <td colspan="2" class="bg-blue">CLIENTE:</td>
                <td colspan="6">${activeProfile.CLIENTE}</td>
              </tr>
              <tr>
                <td colspan="2" class="bg-blue">PROYECTO:</td>
                <td colspan="6">${activeProfile.PROYECTO}</td>
              </tr>
            </table>

            <!-- INFO MOTOR -->
            <table class="grid-table mt-4" style="font-size: 9px;">
              <tr><td colspan="4" class="bg-blue font-bold">INFORMACIÓN DEL MOTOR</td></tr>
              <tr>
                <td class="bg-blue" style="width: 25%">Tag No.</td>
                <td style="width: 25%">${activeProfile.TAGNAME}</td>
                <td class="bg-blue" style="width: 25%">Clasificación de Área</td>
                <td style="width: 25%">${activeProfile.AREA}</td>
              </tr>
              <tr>
                <td class="bg-blue">Fabricante</td>
                <td>${activeProfile.FABRICANTE_MODELO || ''}</td>
                <td class="bg-blue">Modelo No.</td>
                <td>${comData.POT_COM_MODELO || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">Nema</td>
                <td>${comData.POT_COM_NEMA || ''}</td>
                <td class="bg-blue">Serie No.</td>
                <td>${comData.POT_COM_SERIE || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">Clasificación</td>
                <td>${comData.POT_COM_CLASIFICACION || ''}</td>
                <td class="bg-blue">Potencia HP</td>
                <td>${comData.POT_COM_POTENCIA_HP || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">Velocidad RPM</td>
                <td>${comData.POT_COM_VELOCIDAD_RPM || ''}</td>
                <td class="bg-blue">Clase de Aisl.</td>
                <td>${comData.POT_COM_CLASE_AISL || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">Servicio</td>
                <td>${activeProfile.SERVICIO}</td>
                <td class="bg-blue">Voltaje V</td>
                <td>${comData.POT_COM_VOLTAJE_V || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">F.L.A. AMP</td>
                <td>${comData.POT_COM_FLA_AMP || ''}</td>
                <td class="bg-blue">Frecuencia Hz</td>
                <td>${comData.POT_COM_FRECUENCIA_HZ || ''}</td>
              </tr>
            </table>

            <!-- PRUEBAS -->
            <table class="grid-table mt-4" style="font-size: 8px;">
               <thead>
                  <tr class="bg-blue">
                    <th class="p-1 w-16 text-center">Check</th>
                    <th class="p-1">1.1 REQUERIMIENTOS PRUEBAS FUNCIONALES</th>
                    <th class="p-1 w-24">Resultados</th>
                    <th class="p-1 w-32">Iniciales / Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  ${[
                    'Realice la prueba de inyección sobre los relés de protección y medición. Chequee los ratings y setting de protección de los fusibles. Anexe los data sheet.',
                    'Mida la resistencia de Aislamiento del cableado de control Mínimo 10 MΩ con Megger de 500 V. Registre el serial del equipo.',
                    'Prueba funcional del arrancador Interruptor/Contactor incluyendo la interfase de control.',
                    'Prueba funcional Mecánica y Eléctrica de los Interlocks incluido las señales de disparo. Liste las pruebas funcionales en una hoja y anéxela.',
                    'Verifique el aterrizaje del motor de acuerdo con las especificaciones del proyecto.',
                    'Mida la resistencia de Aislamiento del Heater. Mínimo 10 MΩ con Megger de 500 V.',
                    'Mida la resistencia de Aislamiento del cable y devanados del motor. Mínimo 100 MΩ con Megger de 1000 V.'
                  ].map((lbl, i) => `
                    <tr>
                      <td class="center">${i+1}</td>
                      <td class="text-left">${lbl}</td>
                      <td class="center">${comData[`RES_${i}`] || ''}</td>
                      <td class="center">${comData[`INI_${i}`] || ''}</td>
                    </tr>
                  `).join('')}
                </tbody>
            </table>

            <!-- NOTA SERIALES -->
            <table class="grid-table mt-2" style="font-size: 8px;">
               <tr>
                 <td class="text-left font-bold" style="width: 50%;">NOTA: Registre el # del serial de todos los instrumentos involucrados en las pruebas:</td>
                 <td class="text-left font-bold" style="width: 50%; font-family: monospace; color: #1F3864;">${comData['NOTA_SERIALES'] || ''}</td>
               </tr>
            </table>

            <!-- PRUEBAS DE FUNCIONAMIENTO -->
            <table class="grid-table mt-4" style="font-size: 8px;">
              <thead>
                <tr class="bg-blue">
                  <th class="p-1 text-left" style="width: 60%">PRUEBAS DE FUNCIONAMIENTO REQUERIDAS</th>
                  <th class="p-1 text-center" style="width: 20%">RESULTADOS</th>
                  <th class="p-1 text-center" style="width: 20%">INICIAL. Y FECHA</th>
                </tr>
              </thead>
              <tbody>
                ${[
                  'Corra el motor sin carga (Desacoplado) por 1 a 4 horas. Registre los datos. Nota: 1 Hora para motores<40 KW. 4 horas para motores>40 KW',
                  'Verificar correspondencia de cargas',
                  'Verifique el sentido de rotación.',
                  'Corriente de arranque',
                  'Tiempo de arranque'
                ].map((lbl, i) => `
                  <tr>
                    <td class="text-left">${lbl}</td>
                    <td class="center font-bold" style="color: #1F3864;">${comData[`FUNC_RES_${i}`] || ''}</td>
                    <td class="center">${comData[`FUNC_INI_${i}`] || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <!-- REGISTER GRID (PAGE 2) -->
            <div style="page-break-before: always; margin-top: 15px;"></div>
            
            <h4 class="mt-4 text-[#1F3864]" style="font-size: 10px; font-weight: bold; text-transform: uppercase;">REGISTRO DE TEMPERATURA, CORRIENTE Y VIBRACIONES (PRUEBA DE 1 A 4 HORAS)</h4>
            <table class="grid-table mt-1" style="font-size: 7.5px;">
              <thead>
                <tr class="bg-blue">
                  <th class="p-1 text-left" style="width: 23%;">Variable / Tiempo (min)</th>
                  ${['0', '15', '30', '45', '60', '90', '120', '150', '180', '210', '240'].map(t => `<th class="p-1 text-center" style="width: 7%;">${t}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${[
                  { id: 'TEMP_AMB', label: 'Temperatura Ambiente' },
                  { id: 'TEMP_DE', label: 'Temperatura Cojinetes (Drive End)' },
                  { id: 'TEMP_NDE', label: 'Temperatura Cojin. (Not Drive End)' },
                  { id: 'CORRIENTE', label: 'Corriente' },
                  { id: 'TEMP_DEV_90', label: 'Temperatura del Devanado 90°' },
                  { id: 'TEMP_DEV_180', label: 'Temperatura del Devanado 180°' },
                  { id: 'TEMP_DEV_270', label: 'Temperatura del Devanado 270°' },
                  { id: 'VIB_DE_V', label: 'Medición Vibración (Drive End) V' },
                  { id: 'VIB_DE_H', label: 'Medición Vibración (Drive End) H' },
                  { id: 'VIB_NDE_V', label: 'Medición Vibración (Not Drive End) V' },
                  { id: 'VIB_NDE_H', label: 'Medición Vibración (Not Drive End) H' }
                ].map(row => `
                  <tr>
                    <td class="text-left font-bold" style="background-color: #f9fafb;">${row.label}</td>
                    ${['0', '15', '30', '45', '60', '90', '120', '150', '180', '210', '240'].map(t => {
                      const key = `GRID_${row.id}_${t}`;
                      return `<td class="center font-bold" style="color: #1F3864;">${comData[key] || ''}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <p style="font-size: 7.5px; font-style: italic; margin-top: 5px; font-weight: bold; color: #555;">NOTA: Terminada la prueba se aislará el motor.</p>

            <!-- FIRMAS -->
            <table class="grid-table mt-4" style="page-break-inside: avoid;">
              <tr>
                <td colspan="3" class="bg-blue">CONTRATISTA Y/O VENDOR</td>
                <td colspan="3" class="bg-blue">GESTOR DEL CONTRATO</td>
                <td colspan="2" class="bg-blue">COMISIONAMIENTO</td>
              </tr>
              <tr>
                <td class="text-left font-bold" style="width: 15%">COMPAÑÍA</td>
                <td colspan="2" class="text-left">${activeProfile.POT_COMPANIA_1 || ''}</td>
                <td colspan="3" class="text-left">${activeProfile.POT_COMPANIA_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_COMPANIA_3 || ''}</td>
              </tr>
              <tr>
                <td class="text-left font-bold">FIRMA</td>
                <td colspan="2" class="signature-box" style="height: 60px;">
                  ${activeProfile.POT_FIRMA_1 ? `<img src="${activeProfile.POT_FIRMA_1}" class="sign-img" style="max-height: 50px;" />` : ''}
                </td>
                <td colspan="3" class="signature-box" style="height: 60px;">
                  ${activeProfile.POT_FIRMA_2 ? `<img src="${activeProfile.POT_FIRMA_2}" class="sign-img" style="max-height: 50px;" />` : ''}
                </td>
                <td colspan="2" class="signature-box" style="height: 60px;">
                  ${activeProfile.POT_FIRMA_3 ? `<img src="${activeProfile.POT_FIRMA_3}" class="sign-img" style="max-height: 50px;" />` : ''}
                </td>
              </tr>
              <tr>
                <td class="text-left font-bold">NOMBRE</td>
                <td colspan="2" class="text-left">${activeProfile.POT_NOMBRE_1 || ''}</td>
                <td colspan="4" class="text-left">${activeProfile.POT_NOMBRE_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_NOMBRE_3 || ''}</td>
              </tr>
            </table>

            ${fotosDelTag.length > 0 ? `
              <div style="page-break-before: always; margin-top: 20px;"></div>
              <table class="grid-table mt-4 overflow-hidden">
                <tr><td colspan="8" class="bg-blue text-left">REGISTRO FOTOGRÁFICO</td></tr>
              </table>
              <div class="photo-container">
                ${fotosDelTag.map((f, i) => `
                  <div class="photo-item">
                    <div class="photo-box">
                      <img src="${f.blobData}" />
                    </div>
                    <div class="photo-caption">${f.observacion || `Foto ${i+1}`}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
          `;
        }

        return `
        <div class="protocol-page">
          <!-- CABECERA -->
          <table class="grid-table">
            <tr>
              <td colspan="2" rowspan="2" class="center no-padding" style="width: 25%;">
                ${currentLogo ? `<img src="${currentLogo}" style="max-height: 50px; max-width: 90%; object-fit: contain; margin: 5px;" />` : 'LOGO'}
              </td>
              <td colspan="4" rowspan="2" class="bg-blue center" style="font-size: 14px; width: 50%;">
                PROTOCOLO DE PRUEBAS DE INSTRUMENTACIÓN
              </td>
              <td class="bg-blue" style="width: 12.5%;">REVISIÓN:</td>
              <td class="center" style="width: 12.5%;">${activeProfile.REVISION}</td>
            </tr>
            <tr>
              <td class="bg-blue" style="width: 12.5%;">FECHA REVISIÓN:</td>
              <td class="center">${activeProfile.FECHA_REVISION}</td>
            </tr>
            <tr>
              <td class="bg-blue">CLIENTE:</td>
              <td colspan="4">${activeProfile.CLIENTE}</td>
              <td colspan="2" class="bg-blue">FECHA:</td>
              <td class="center font-bold">${activeProfile.FECHA}</td>
            </tr>
            <tr>
              <td class="bg-blue">PROYECTO:</td>
              <td colspan="4">${activeProfile.PROYECTO}</td>
              <td colspan="2" class="bg-blue">CONTRATO:</td>
              <td class="center">${activeProfile.CONTRATO}</td>
            </tr>
          </table>

          <!-- 1. INFORMACIÓN GENERAL -->
          <table class="grid-table mt-4">
            <tr><td colspan="8" class="bg-blue text-left">1. INFORMACIÓN GENERAL DEL INSTRUMENTO</td></tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">TAG NO:</td>
              <td colspan="2" class="font-bold uppercase">${(activeItem as any)[tagKey]}</td>
              <td colspan="2" class="bg-blue text-left">FABRICANTE/MODELO:</td>
              <td colspan="2">${activeProfile.FABRICANTE_MODELO || 'N/A'}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">TIPO CABLE / DESC:</td>
              <td colspan="6" class="uppercase">${(activeItem as any).TIPO_CABLE || activeProfile.TIPO_CABLE || ''} / ${(activeItem as any).DESCRIPCIÓN || ''}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">RANGO OPERACIÓN:</td>
              <td colspan="2">${activeProfile.RANGO_OPERACION || 'N/A'}</td>
              <td colspan="2" class="bg-blue text-left">CLASE EXACTITUD:</td>
              <td colspan="2">${activeProfile.CLASE_EXACTITUD || 'N/A'}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">UBICACIÓN:</td>
              <td colspan="2" class="uppercase">${(activeItem as any).UBICACIÓN || ''}</td>
              <td colspan="2" class="bg-blue text-left">TAG CABLE SWC:</td>
              <td colspan="2" class="uppercase">${(activeItem as any).TAG_CABLE_SWC || 'N/A'}</td>
            </tr>
          </table>

          <!-- 2. CONDICIONES DE LA PRUEBA -->
          <table class="grid-table mt-4">
            <tr><td colspan="8" class="bg-blue text-left">2. CONDICIONES DE LA PRUEBA</td></tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">NORMA/PROCEDIMIENTO:</td>
              <td colspan="6">${activeProfile.NORMA_PROCEDIMIENTO}</td>
            </tr>
            <tr>
              <td colspan="2" rowspan="2" class="bg-blue text-left">TIPO DE PRUEBA:</td>
              <td colspan="3">${activeProfile.TIPO_PRUEBA_PLANO ? '☑ Equipo instalado en ubicación/PLANO' : '☐ Equipo instalado en ubicación/PLANO'}</td>
              <td colspan="3">${activeProfile.TIPO_PRUEBA_FUNC_SIM ? '☑ Prueba funcional simulada' : '☐ Prueba funcional simulada'}</td>
            </tr>
            <tr>
              <td colspan="3">${activeProfile.TIPO_PRUEBA_LOOP ? '☑ Pruebas de lazo (loop check)' : '☐ Pruebas de lazo (loop check)'}</td>
              <td colspan="3">${activeProfile.TIPO_PRUEBA_FUNC_LINEA ? '☑ Prueba funcional acoplada a línea' : '☐ Prueba funcional acoplada a línea'}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">EQUIPO PRUEBA 1:</td>
              <td colspan="3">${activeProfile.EQUIPO_PRUEBA_1}</td>
              <td colspan="2" class="bg-blue text-left">CERT./VIGENCIA:</td>
              <td>${activeProfile.CERT_FECHA_1}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">EQUIPO PRUEBA 2:</td>
              <td colspan="3">${activeProfile.EQUIPO_PRUEBA_2}</td>
              <td colspan="2" class="bg-blue text-left">CERT./VIGENCIA:</td>
              <td>${activeProfile.CERT_FECHA_2}</td>
            </tr>
          </table>

          <!-- 3. PRUEBAS DE LAZO -->
          <table class="grid-table mt-4">
            <tr><td colspan="8" class="bg-blue text-left">3. PRUEBAS DE LAZO (LOOP CHECK)</td></tr>
            <tr>
              <td colspan="3" class="bg-blue uppercase">${activeProfile.LOOP_C1 || 'EQUIPO'}</td>
              <td colspan="2" class="bg-blue uppercase">${activeProfile.LOOP_C2 || 'MEDIDA'}</td>
              <td colspan="3" class="bg-blue uppercase">${activeProfile.LOOP_C3 || 'VALOR'}</td>
            </tr>
            <tr>
              <td colspan="3" class="center">${activeProfile.L1_C1 || ''}</td>
              <td colspan="2" class="center">${activeProfile.L1_C2 || ''}</td>
              <td colspan="3" class="center">${activeProfile.L1_C3 || ''}</td>
            </tr>
            <tr>
              <td colspan="3" class="center">${activeProfile.L2_C1 || ''}</td>
              <td colspan="2" class="center">${activeProfile.L2_C2 || ''}</td>
              <td colspan="3" class="center">${activeProfile.L2_C3 || ''}</td>
            </tr>
            <tr>
              <td colspan="3" class="center">${activeProfile.L3_C1 || ''}</td>
              <td colspan="2" class="center">${activeProfile.L3_C2 || ''}</td>
              <td colspan="3" class="center">${activeProfile.L3_C3 || ''}</td>
            </tr>
          </table>

          <!-- 4. INSPECCIÓN -->
          <table class="grid-table mt-4">
            <tr><td colspan="8" class="bg-blue text-left">4. INSPECCIÓN</td></tr>
            <tr>
              <td colspan="4" class="bg-blue">ÍTEM REVISADO</td>
              <td class="bg-blue">ESTADO</td>
              <td colspan="3" class="bg-blue">OBSERVACIONES</td>
            </tr>
            <tr>
              <td colspan="4" class="text-left">${activeProfile.LABEL_4_1}</td>
              <td class="center font-bold">${activeProfile.INSP_4_1}</td>
              <td colspan="3" class="text-left">${activeProfile.OBS_4_1}</td>
            </tr>
            <tr>
              <td colspan="4" class="text-left">${activeProfile.LABEL_4_2}</td>
              <td class="center font-bold">${activeProfile.INSP_4_2}</td>
              <td colspan="3" class="text-left">${activeProfile.OBS_4_2}</td>
            </tr>
            <tr>
              <td colspan="4" class="text-left">${activeProfile.LABEL_4_3}</td>
              <td class="center font-bold">${activeProfile.INSP_4_3}</td>
              <td colspan="3" class="text-left">${activeProfile.OBS_4_3}</td>
            </tr>
            <tr>
              <td colspan="4" class="text-left">${activeProfile.LABEL_4_4}</td>
              <td class="center font-bold">${activeProfile.INSP_4_4}</td>
              <td colspan="3" class="text-left">${activeProfile.OBS_4_4}</td>
            </tr>
          </table>

          <!-- 5. COMENTARIOS -->
          <table class="grid-table mt-4">
            <tr><td colspan="8" class="bg-blue text-left">5. COMENTARIOS</td></tr>
            <tr><td colspan="8" style="height: 40px; vertical-align: top; text-align: left;">${activeProfile.COMENTARIOS}</td></tr>
          </table>

          <!-- 6. REGISTRO FOTOGRÁFICO -->
          ${fotosDelTag.length > 0 ? `
            <table class="grid-table mt-4 overflow-hidden">
              <tr><td colspan="8" class="bg-blue text-left">6. REGISTRO FOTOGRÁFICO</td></tr>
            </table>
            <div class="photo-container">
              ${fotosDelTag.map((f, i) => `
                <div class="photo-item">
                  <div class="photo-box">
                    <img src="${f.blobData}" />
                  </div>
                  <div class="photo-caption">${f.observacion || `Foto ${i+1}`}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- FIRMAS -->
          <table class="grid-table mt-4" style="page-break-inside: avoid;">
            <tr>
              <td colspan="3" class="bg-blue">ELABORÓ</td>
              <td colspan="2" class="bg-blue">REVISÓ</td>
              <td colspan="3" class="bg-blue">APROBÓ (CLIENTE / INTERVENTOR)</td>
            </tr>
            <tr>
              <td colspan="3" class="text-left">NOMBRE: ${activeProfile.ELABORO_NOMBRE}</td>
              <td colspan="2" class="text-left">NOMBRE: ${activeProfile.REVISO_NOMBRE}</td>
              <td colspan="3" class="text-left">NOMBRE: ${activeProfile.APROBO_NOMBRE}</td>
            </tr>
            <tr>
              <td colspan="3" class="text-left">CARGO: ${activeProfile.ELABORO_CARGO}</td>
              <td colspan="2" class="text-left">CARGO: ${activeProfile.REVISO_CARGO}</td>
              <td colspan="3" class="text-left">CARGO: ${activeProfile.APROBO_CARGO}</td>
            </tr>
            <tr>
              <td colspan="3" class="signature-box">
                <span class="sign-label">FIRMA:</span>
                ${activeProfile.ELABORO_FIRMA ? `<img src="${activeProfile.ELABORO_FIRMA}" class="sign-img" />` : ''}
              </td>
              <td colspan="2" class="signature-box">
                <span class="sign-label">FIRMA:</span>
                ${activeProfile.REVISO_FIRMA ? `<img src="${activeProfile.REVISO_FIRMA}" class="sign-img" />` : ''}
              </td>
              <td colspan="3" class="signature-box">
                <span class="sign-label">FIRMA:</span>
                ${activeProfile.APROBO_FIRMA ? `<img src="${activeProfile.APROBO_FIRMA}" class="sign-img" />` : ''}
              </td>
            </tr>
            <tr>
              <td colspan="3" class="text-left">FECHA: ${format(new Date(), 'dd.MM.yyyy')}</td>
              <td colspan="2" class="text-left">FECHA: </td>
              <td colspan="3" class="text-left">FECHA: </td>
            </tr>
          </table>
        </div>
        `;
      };

      const wrapHtml = (content: string, title: string) => `
      <html>
        <head>
          <title>${title}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 9px; color: #000; margin: 0; padding: 0; background: #fff; }
            .protocol-page { 
              width: 100%; 
              min-height: 275mm; 
              page-break-after: always; 
              position: relative;
              box-sizing: border-box;
            }
            .protocol-page:last-child { page-break-after: auto; }
            
            .grid-table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #000; }
            .grid-table td { border: 1px solid #000; padding: 3px 5px; vertical-align: middle; }
            .bg-blue { background-color: #1F3864 !important; color: #FFF !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; text-transform: uppercase; font-size: 8px; }
            .center { text-align: center; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            .no-padding { padding: 0 !important; }
            .mt-4 { margin-top: 5px; }

            .photo-container { 
              display: grid; 
              grid-template-columns: 1fr 1fr; 
              gap: 5px; 
              margin-top: 0;
            }
            .photo-item { border: 1px solid #000; display: flex; flex-direction: column; break-inside: avoid; }
            .photo-box { height: 160px; display: flex; align-items: center; justify-content: center; background: #fff; padding: 2px; }
            .photo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
            .photo-caption { 
              border-top: 1px solid #000; 
              padding: 2px; 
              text-align: center; 
              font-size: 8px; 
              background: #f5f5f5 !important; 
              font-weight: bold;
              -webkit-print-color-adjust: exact;
            }

            .signature-box { height: 60px; vertical-align: top !important; position: relative; padding: 2px !important; }
            .sign-label { font-size: 7px; font-weight: bold; color: #444; position: absolute; top: 2px; left: 4px; }
            .sign-img { max-height: 45px; max-width: 90%; display: block; margin: 8px auto 0; object-fit: contain; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
      `;

      if (tipoSalida === 'UNIDO') {
        const totalItems = selectedTags.length;
        const allHtmlContent = selectedTags.map((tag, idx) => {
          const content = buildHtmlForTag(tag);
          const baseProgress = modoExportacion === 'DRIVE' ? 80 : 0;
          const multiplier = modoExportacion === 'DRIVE' ? 20 : 100;
          setExportProgress(baseProgress + Math.round(((idx + 1) / totalItems) * multiplier));
          return content;
        }).join('');
        const fullHtml = wrapHtml(allHtmlContent, `Protocolos_${activeProfile.NOMBRE_PERFIL}`);
        
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(fullHtml);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { 
            printWindow.print(); 
            printWindow.close(); 
          }, 750);
        } else {
          setExportError("El navegador bloqueó la ventana emergente. Por favor, permite los pop-ups para este sitio.");
        }
      } else {
        // Modo SEPARADOS
        const totalItems = selectedTags.length;
        let idx = 0;
        for (const tag of selectedTags) {
          idx++;
          const content = buildHtmlForTag(tag);
          if (!content) continue;
          
          const baseProgress = modoExportacion === 'DRIVE' ? 80 : 0;
          const multiplier = modoExportacion === 'DRIVE' ? 20 : 100;
          setExportProgress(baseProgress + Math.round((idx / totalItems) * multiplier));

          const fullHtml = wrapHtml(content, `Protocolo_${tag}`);
          const printWindow = window.open('', '_blank');
          
          if (printWindow) {
            printWindow.document.write(fullHtml);
            printWindow.document.close();
            printWindow.focus();
            
            // Usamos Promise para simular un bloqueo ligero antes de abrir el sgte
            await new Promise(r => setTimeout(r, 750));
            printWindow.print();
            printWindow.close();
          } else {
            setExportError("El navegador bloqueó las ventanas múltiples. Permite los pop-ups en tu navegador.");
            break;
          }
        }
      }
      await limpiarDespuesDeExportar(selectedTags);
    } catch (e: any) {
      setExportError(e.message || "Error generando PDF con Drive");
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2"><Download size={24} /> Exportar Formatos</h2>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-blue-50 rounded-full border border-blue-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">{selectedTags.length} Seleccionados</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4">
            {/* Toggle para Modo o Fuente de Fotos */}
            <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200">
              <button 
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${modoExportacion === 'LOCAL' ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                onClick={() => { setModoExportacion('LOCAL'); setSelectedTags([]); }}
              >
                App (Locales)
              </button>
              {appSettings.enableMassUploadDrive && (
                <button 
                  className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${modoExportacion === 'DRIVE' ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                  onClick={() => { setModoExportacion('DRIVE'); setSelectedTags([]); }}
                >
                  Google Drive (Masiva)
                </button>
              )}
            </div>

            {/* Selector de Categoría (Instrumentación / Potencia) */}
            <div className="flex gap-2 border-b-[3px] border-[#1F3864] px-2 md:px-4 pt-2 mb-6 overflow-x-auto custom-scrollbar">
              {appSettings.enableGenInstrumentacion && (
                <button
                  onClick={() => { setActiveCategory('INSTRUMENTACION'); setSelectedTags([]); setSelectedProfile(''); }}
                  className={`py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                    activeCategory === 'INSTRUMENTACION' 
                    ? 'bg-white text-[#1F3864] text-[15px]' 
                    : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
                  }`}
                >
                  INSTRUMENTACIÓN
                </button>
              )}
              {appSettings.enableGenPotencia && (
                <>
                  <button
                    onClick={() => { setActiveCategory('POTENCIA'); setSelectedTags([]); setSelectedProfile(''); }}
                    className={`py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                      activeCategory === 'POTENCIA' 
                      ? 'bg-white text-[#1F3864] text-[15px]' 
                      : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
                    }`}
                  >
                    POTENCIA (PRECOM)
                  </button>
                  <button
                    onClick={() => { setActiveCategory('POTENCIA_COM'); setSelectedTags([]); setSelectedProfile(''); }}
                    className={`py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                      activeCategory === 'POTENCIA_COM' 
                      ? 'bg-white text-[#1F3864] text-[15px]' 
                      : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
                    }`}
                  >
                    POTENCIA (COM)
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por TAG o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F3864] focus:outline-none text-sm font-medium transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border rounded-lg transition-colors flex items-center justify-center bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 flex-1 md:flex-none"
                  title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
                >
                  {sortOrder === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
                </button>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 border rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none ${showFilters || filtroUbicacion || filtroTipoCable || filtroFechaFoto ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                  <Filter size={18} className="mr-2 md:mr-0" />
                  <span className="md:hidden text-xs font-bold uppercase">Filtros</span>
                </button>
                {modoExportacion === 'DRIVE' && (
                  <button 
                    onClick={() => setShowDriveTags(!showDriveTags)}
                    className={`px-3 py-2 border rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none ${showDriveTags ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}
                    title="Ver Tags en Drive"
                  >
                    <Check size={18} className="mr-2 md:mr-0" />
                    <span className="md:hidden text-xs font-bold uppercase">Tags Drive</span>
                  </button>
                )}
              </div>
            </div>

            {showDriveTags && modoExportacion === 'DRIVE' && !isFetchingDrive && (
              <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    Tags Detectados en Google Drive ({tagsDrive.length})
                  </h4>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={handleDownloadTagsTxt}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white border border-indigo-200 rounded text-[9px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                      title="Exportar lista a TXT"
                    >
                      <FileText size={12} />
                      EXPORTAR LISTA
                    </button>
                    <button onClick={() => setShowDriveTags(false)} className="text-[10px] text-indigo-400 font-bold hover:text-indigo-600">Ocultar</button>
                  </div>
                </div>
                {tagsDrive.length === 0 ? (
                  <div className="text-center py-4 bg-white/50 rounded-lg border border-indigo-50">
                    <p className="text-[9px] text-indigo-400 font-bold uppercase">No se detectaron tags válidos en el Drive.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar p-1">
                    {tagsDrive.sort().map(tag => (
                      <div 
                        key={tag} 
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold cursor-pointer transition-all border ${
                          selectedTags.includes(tag) 
                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                            : 'bg-white border-indigo-100 text-indigo-700 hover:border-indigo-300'
                        }`}
                      >
                        {tag}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[8px] text-indigo-400 mt-2 italic font-medium leading-tight">
                  * Estos tags corresponden a nombres de archivos o carpetas en Google Drive que coinciden con la base de datos. 
                  Haz clic sobre ellos para seleccionarlos rápidamente.
                </p>
              </div>
            )}

            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Ubicación</label>
                  <select 
                    value={filtroUbicacion} 
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    disabled={activeCategory !== 'INSTRUMENTACION'}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-405 focus:ring-[#1F3864] focus:outline-none font-medium text-gray-800"
                  >
                    <option value="">Todas</option>
                    {ubicacionesUnicas.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Tipo de Cable</label>
                  <select 
                    value={filtroTipoCable} 
                    onChange={(e) => setFiltroTipoCable(e.target.value)}
                    disabled={activeCategory !== 'INSTRUMENTACION'}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white disabled:bg-gray-100 disabled:text-gray-405 focus:ring-[#1F3864] focus:outline-none font-medium text-gray-800"
                  >
                    <option value="">Todos</option>
                    {tiposCableUnicos.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Fecha Asociación</label>
                  <input 
                    type="date"
                    value={filtroFechaFoto} 
                    onChange={(e) => setFiltroFechaFoto(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-[#1F3864] focus:outline-none font-medium text-gray-800"
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setFiltroUbicacion('');
                      setFiltroTipoCable('');
                      setFiltroFechaFoto('');
                      setSearchQuery('');
                    }}
                    className="w-full py-2.5 px-3 text-[10px] font-bold uppercase bg-gray-200 text-gray-650 rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {modoExportacion === 'DRIVE' ? `${activeCategory} En Drive` : `${activeCategory} Con Fotos`} ({filteredItems.length})
              </label>
              {filteredItems.length > 0 && (
                <div className="flex gap-4">
                   <button onClick={handleSelectAll} className="text-[10px] text-blue-600 font-black hover:text-blue-800 transition-colors uppercase tracking-widest">
                    {selectedTags.length === filteredItems.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                  </button>
                </div>
              )}
            </div>

            <div className="w-full min-h-[400px] max-h-[600px] overflow-y-auto bg-white rounded-xl space-y-1 custom-scrollbar">
              {isFetchingDrive ? (
                 <div className="text-center py-24 flex flex-col items-center">
                   <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                   <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Consultando Google Drive...</p>
                 </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Camera className="text-gray-200" size={40} />
                  </div>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No hay resultados</p>
                  <p className="text-xs text-gray-400 mt-1">Intenta ajustando los filtros o la búsqueda</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 pt-2">
                  {filteredItems.map((item, index) => {
                    const tag = (item as any)[tagKey];
                    return (
                      <label 
                        key={`${tag}-${index}`} 
                        className={`flex flex-col p-3 rounded-xl cursor-pointer border-2 transition-all group relative ${
                          selectedTags.includes(tag) 
                          ? activeCategory === 'POTENCIA' 
                            ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/10' 
                            : activeCategory === 'POTENCIA_COM'
                              ? 'bg-red-50 border-red-500 ring-2 ring-red-500/10'
                              : 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/10'
                          : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                            selectedTags.includes(tag) 
                              ? activeCategory === 'POTENCIA' 
                                ? 'bg-orange-600 border-orange-600' 
                                : activeCategory === 'POTENCIA_COM'
                                  ? 'bg-red-600 border-red-600'
                                  : 'bg-blue-600 border-blue-600' 
                              : 'bg-white border-gray-300'
                          }`}>
                            {selectedTags.includes(tag) && <Check size={10} className="text-white" />}
                          </div>
                          <input 
                            type="checkbox" 
                            checked={selectedTags.includes(tag)}
                            onChange={() => handleToggleTag(tag)}
                            className="hidden" 
                          />
                        </div>
                        <p className={`text-xs font-black uppercase truncate ${
                          selectedTags.includes(tag) 
                            ? activeCategory === 'POTENCIA' 
                              ? 'text-orange-700' 
                              : activeCategory === 'POTENCIA_COM'
                                ? 'text-red-700'
                                : 'text-blue-700' 
                            : 'text-[#1F3864]'
                        }`}>
                          {tag}
                        </p>
                        <p className="text-[8px] text-gray-400 truncate uppercase mt-0.5 font-bold tracking-tighter">
                          {item.DESCRIPCIÓN || 'SIN DESCRIPCIÓN'}
                        </p>
                        {(item as any).UBICACIÓN && (
                          <span className="mt-2 text-[7px] font-black uppercase text-gray-400 bg-gray-200/50 w-fit px-1.5 py-0.5 rounded">
                            {(item as any).UBICACIÓN}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-4">
            <h3 className="text-sm font-black text-[#1F3864] uppercase tracking-widest mb-4 flex items-center gap-2">
              <Filter size={16} /> Configuración
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Procedimiento / Perfil</label>
                <select 
                  value={selectedProfile} 
                  onChange={e => setSelectedProfile(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F3864] focus:outline-none text-xs font-bold text-blue-900 appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                >
                  <option value="">-- Seleccionar Perfil --</option>
                  {perfiles
                    .filter(p => p.TIPO === activeCategory && p.ENABLED !== false)
                    .map(p => (
                      <option key={p.ID_PERFIL} value={p.ID_PERFIL}>
                        {p.NOMBRE_PERFIL.toUpperCase()}
                      </option>
                    ))
                  }
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Firma de Elaboró (Opcional)</label>
                <select 
                  value={overrideRevisoId} 
                  onChange={e => setOverrideRevisoId(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F3864] focus:outline-none text-xs font-bold text-blue-900 appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
                >
                  <option value="">-- Usar firma original del perfil --</option>
                  {Array.from(
                    new Map(
                      perfiles
                        .flatMap(p => {
                          const sigs = [];
                          if (!p.TIPO.startsWith('POTENCIA')) {
                            if (p.ELABORO_NOMBRE) sigs.push({ id: p.ID_PERFIL + '|ELABORO', name: p.ELABORO_NOMBRE, roleName: 'Elaboró' });
                          } else {
                            if (p.POT_NOMBRE_1) sigs.push({ id: p.ID_PERFIL + '|POT1', name: p.POT_NOMBRE_1, roleName: 'Firma 1' });
                          }
                          return sigs;
                        })
                        .filter(x => x.name && x.name.trim() !== '')
                        .map(x => [x.name.trim().toLowerCase(), x]) // Key by name to keep unique names across profiles
                    ).values()
                  ).map(info => (
                    <option key={info.id} value={info.id}>
                      {info.name.toUpperCase()} (Firma Original: {info.roleName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-3">
                {isExporting && (
                  <div className="space-y-3 mb-2 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex justify-between items-center text-[9px] font-black text-blue-700 uppercase tracking-widest">
                      <span>{exportProgress < 100 ? 'Procesando...' : '¡Completado!'}</span>
                      <span>{exportElapsedTime >= 60 ? `${Math.floor(exportElapsedTime / 60)}m ${exportElapsedTime % 60}s` : `${exportElapsedTime}s`}</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300 ease-out"
                        style={{ width: `${exportProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-[8px] text-blue-500 font-bold uppercase tracking-tight text-center">
                      {modoExportacion === 'DRIVE' ? 'Sincronizando fotos de Google Drive' : 'Generando formatos locales'}
                    </p>
                  </div>
                )}

                {!isExporting && (exportProgress === 100) && !exportError && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center justify-between">
                    <Check size={14} /> Exito en {exportElapsedTime}s
                  </div>
                )}

                {exportError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span className="truncate">{exportError}</span>
                  </div>
                )}
                
                {appSettings.enableExportPdf && (
                  <Button 
                    onClick={() => exportarPDF('UNIDO')} 
                    variant="pdf" 
                    icon={Printer} 
                    disabled={selectedTags.length === 0 || !selectedProfile}
                    className="w-full py-4 shadow-lg shadow-slate-200 active:scale-[0.98] transition-all rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    Generar Protocolos (PDF)
                  </Button>
                )}
                
                {appSettings.enableExportXlsx && (
                  <Button 
                    onClick={exportarExcel} 
                    variant="success" 
                    icon={FileSpreadsheet} 
                    disabled={isExporting || selectedTags.length === 0 || !selectedProfile}
                    className="w-full py-4 shadow-lg shadow-[#1F3864]/20 active:scale-[0.98] transition-all rounded-xl font-black text-[10px] uppercase tracking-widest"
                  >
                    {isExporting ? 'Procesando...' : 'Descargar Excel (.xlsx)'}
                  </Button>
                )}
                
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2">
                  <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[8px] text-amber-700 font-bold leading-tight uppercase">
                    Asegúrate de permitir ventanas emergentes para que el generador de PDF funcione correctamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
