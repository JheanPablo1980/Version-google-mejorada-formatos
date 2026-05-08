import React, { useState, useEffect, useMemo } from 'react';
import { Download, Camera, Printer, FileSpreadsheet, Check, AlertCircle, Search, Filter, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import ExcelJS from 'exceljs';

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
  const { instrumentos, perfiles, fotos, logoInstrumentacion, logoPotencia, saveExportLog, saveConteoExportacion, driveFolderLink } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStartTime, setExportStartTime] = useState<number | null>(null);
  const [exportElapsedTime, setExportElapsedTime] = useState(0);
  const [modoExportacion, setModoExportacion] = useState<'LOCAL' | 'DRIVE'>('LOCAL');
  
  const [driveFiles, setDriveFiles] = useState<{name: string, id: string, mimeType: string}[]>([]);
  const [isFetchingDrive, setIsFetchingDrive] = useState(false);
  const [driveFetchError, setDriveFetchError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoCable, setFiltroTipoCable] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const tagsConFotos = [...new Set(fotos.map(f => f.TAGNAME))];
  const todosLosTags = instrumentos.map(i => i.TAGNAME);
  const tagsDrive = [...new Set(driveFiles.map(f => extractTagFromName(f.name, todosLosTags)))];
  
  const instrumentosConFotos = modoExportacion === 'LOCAL' 
    ? instrumentos.filter(inst => tagsConFotos.includes(inst.TAGNAME)) 
    : instrumentos.filter(inst => tagsDrive.includes(inst.TAGNAME));

  const ubicacionesUnicas = useMemo(() => {
    const u = new Set(instrumentosConFotos.map(i => i.UBICACIÓN).filter(Boolean));
    return Array.from(u).sort();
  }, [instrumentosConFotos]);

  const tiposCableUnicos = useMemo(() => {
    const t = new Set(instrumentosConFotos.map(i => i.TIPO_CABLE).filter(Boolean));
    return Array.from(t).sort();
  }, [instrumentosConFotos]);

  const filteredInstrumentos = useMemo(() => {
    const filtered = instrumentosConFotos.filter(inst => {
      const matchesSearch = inst.TAGNAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (inst.DESCRIPCIÓN || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUbicacion = filtroUbicacion ? inst.UBICACIÓN === filtroUbicacion : true;
      const matchesTipo = filtroTipoCable ? inst.TIPO_CABLE === filtroTipoCable : true;
      return matchesSearch && matchesUbicacion && matchesTipo;
    });

    return filtered.sort((a, b) => {
      const cmp = a.TAGNAME.localeCompare(b.TAGNAME);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [instrumentosConFotos, searchQuery, filtroUbicacion, filtroTipoCable, sortOrder]);

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

  const activeProfile = perfiles.find(p => p.ID_PERFIL === selectedProfile);

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSelectAll = () => {
    if (selectedTags.length === filteredInstrumentos.length) setSelectedTags([]); 
    else setSelectedTags(filteredInstrumentos.map(i => i.TAGNAME)); 
  };

  const [exportError, setExportError] = useState<string | null>(null);

  const logExportAction = async (tipo: 'EXCEL' | 'PDF') => {
    if (!activeProfile) return;
    setExportError(null);
    for (const tag of selectedTags) {
       await saveExportLog({
         tagname: tag,
         tipo_formato: tipo,
         id_perfil: activeProfile.ID_PERFIL
       });
       
       // Guardar el conteo específico para el técnico
       await saveConteoExportacion(tag);
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

  const exportarExcel = async () => {
    if (selectedTags.length === 0 || !activeProfile) { 
      setExportError("Selecciona al menos un instrumento y un perfil."); 
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

        const activeInstrument = instrumentos.find(i => i.TAGNAME === tag);
        const fotosDelTag = (modoExportacion === 'DRIVE' 
          ? driveFotosDownloaded.filter(f => f.TAGNAME === tag)
          : fotos.filter(f => f.TAGNAME === tag)).slice(0, 4);
        
        if (!activeInstrument) continue;

        const currentLogo = activeProfile.TIPO === 'POTENCIA' ? logoPotencia : logoInstrumentacion;

        const safeSheetName = tag.replace(/[\\*?:\/\[\]]/g, '').substring(0, 26);
        const ws1 = wb.addWorksheet(`${safeSheetName}`);
        
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
        ws1.getCell('C1').value = activeProfile.TIPO === 'POTENCIA' 
          ? 'PROTOCOLO DE PRUEBAS DE POTENCIA' 
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
        ws1.mergeCells('A6:H6'); ws1.getCell('A6').value = '1. INFORMACIÓN GENERAL DEL INSTRUMENTO'; applyStyle(ws1.getCell('A6'), true); ws1.getCell('A6').alignment = {horizontal:'left'};
            ws1.mergeCells('A7:B7'); ws1.getCell('A7').value = 'Tag No:'; applyStyle(ws1.getCell('A7'), true); ws1.getCell('A7').alignment = {horizontal:'left'};
        ws1.mergeCells('C7:D7'); ws1.getCell('C7').value = activeInstrument.TAGNAME; applyStyle(ws1.getCell('C7')); ws1.getCell('C7').alignment = {horizontal:'left'};
        ws1.mergeCells('E7:F7'); ws1.getCell('E7').value = 'Fabricante/Modelo:'; applyStyle(ws1.getCell('E7'), true); ws1.getCell('E7').alignment = {horizontal:'left'};
        ws1.mergeCells('G7:H7'); ws1.getCell('G7').value = activeProfile.FABRICANTE_MODELO || 'N/A'; applyStyle(ws1.getCell('G7')); ws1.getCell('G7').alignment = {horizontal:'left'};
        
        ws1.mergeCells('A8:B8'); ws1.getCell('A8').value = 'Tipo Cable / Desc:'; applyStyle(ws1.getCell('A8'), true); ws1.getCell('A8').alignment = {horizontal:'left'};
        ws1.mergeCells('C8:H8'); ws1.getCell('C8').value = `${activeInstrument.TIPO_CABLE} / ${activeInstrument.DESCRIPCIÓN}`; applyStyle(ws1.getCell('C8')); ws1.getCell('C8').alignment = {horizontal:'left'};
        
        ws1.mergeCells('A9:B9'); ws1.getCell('A9').value = 'Rango de Operación:'; applyStyle(ws1.getCell('A9'), true); ws1.getCell('A9').alignment = {horizontal:'left'};
        ws1.mergeCells('C9:D9'); ws1.getCell('C9').value = activeProfile.RANGO_OPERACION || 'N/A'; applyStyle(ws1.getCell('C9')); ws1.getCell('C9').alignment = {horizontal:'left'};
        ws1.mergeCells('E9:F9'); ws1.getCell('E9').value = 'Clase de Exactitud:'; applyStyle(ws1.getCell('E9'), true); ws1.getCell('E9').alignment = {horizontal:'left'};
        ws1.mergeCells('G9:H9'); ws1.getCell('G9').value = activeProfile.CLASE_EXACTITUD || 'N/A'; applyStyle(ws1.getCell('G9')); ws1.getCell('G9').alignment = {horizontal:'left'};
 
        ws1.mergeCells('A10:B10'); ws1.getCell('A10').value = 'Ubicación:'; applyStyle(ws1.getCell('A10'), true); ws1.getCell('A10').alignment = {horizontal:'left'};
        ws1.mergeCells('C10:D10'); ws1.getCell('C10').value = activeInstrument.UBICACIÓN; applyStyle(ws1.getCell('C10')); ws1.getCell('C10').alignment = {horizontal:'left'};
        ws1.mergeCells('E10:F10'); ws1.getCell('E10').value = 'Tag Cable SWC:'; applyStyle(ws1.getCell('E10'), true); ws1.getCell('E10').alignment = {horizontal:'left'};
        ws1.mergeCells('G10:H10'); ws1.getCell('G10').value = activeInstrument.TAG_CABLE_SWC || 'N/A'; applyStyle(ws1.getCell('G10')); ws1.getCell('G10').alignment = {horizontal:'left'};

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
        ws1.mergeCells(`A${currentRow}:C${currentRow}`); ws1.getCell(`A${currentRow}`).value = 'ELABORÓ'; applyStyle(ws1.getCell(`A${currentRow}`), true);
        ws1.mergeCells(`D${currentRow}:E${currentRow}`); ws1.getCell(`D${currentRow}`).value = 'REVISÓ'; applyStyle(ws1.getCell(`D${currentRow}`), true);
        ws1.mergeCells(`F${currentRow}:H${currentRow}`); ws1.getCell(`F${currentRow}`).value = 'APROBÓ (CLIENTE / INTERVENTOR)'; applyStyle(ws1.getCell(`F${currentRow}`), true);
        
        ws1.mergeCells(`A${currentRow+1}:C${currentRow+1}`); ws1.getCell(`A${currentRow+1}`).value = `NOMBRE: ${activeProfile.ELABORO_NOMBRE}`; applyStyle(ws1.getCell(`A${currentRow+1}`)); ws1.getCell(`A${currentRow+1}`).alignment = {horizontal:'left'};
        ws1.mergeCells(`D${currentRow+1}:E${currentRow+1}`); ws1.getCell(`D${currentRow+1}`).value = `NOMBRE: ${activeProfile.REVISO_NOMBRE}`; applyStyle(ws1.getCell(`D${currentRow+1}`)); ws1.getCell('D' + (currentRow+1)).alignment = {horizontal:'left'};
        ws1.mergeCells(`F${currentRow+1}:H${currentRow+1}`); ws1.getCell(`F${currentRow+1}`).value = `NOMBRE: ${activeProfile.APROBO_NOMBRE}`; applyStyle(ws1.getCell(`F${currentRow+1}`)); ws1.getCell('F' + (currentRow+1)).alignment = {horizontal:'left'};

        ws1.mergeCells(`A${currentRow+2}:C${currentRow+2}`); ws1.getCell(`A${currentRow+2}`).value = `CARGO: ${activeProfile.ELABORO_CARGO}`; applyStyle(ws1.getCell(`A${currentRow+2}`)); ws1.getCell('A' + (currentRow+2)).alignment = {horizontal:'left'};
        ws1.mergeCells(`D${currentRow+2}:E${currentRow+2}`); ws1.getCell(`D${currentRow+2}`).value = `CARGO: ${activeProfile.REVISO_CARGO}`; applyStyle(ws1.getCell(`D${currentRow+2}`)); ws1.getCell('D' + (currentRow+2)).alignment = {horizontal:'left'};
        ws1.mergeCells(`F${currentRow+2}:H${currentRow+2}`); ws1.getCell(`F${currentRow+2}`).value = `CARGO: ${activeProfile.APROBO_CARGO}`; applyStyle(ws1.getCell(`F${currentRow+2}`)); ws1.getCell('F' + (currentRow+2)).alignment = {horizontal:'left'};

        ws1.mergeCells(`A${currentRow+3}:C${currentRow+5}`); ws1.getCell(`A${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`A${currentRow+3}`)); ws1.getCell(`A${currentRow+3}`).font = { bold: true }; ws1.getCell(`A${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};
        ws1.mergeCells(`D${currentRow+3}:E${currentRow+5}`); ws1.getCell(`D${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`D${currentRow+3}`)); ws1.getCell(`D${currentRow+3}`).font = { bold: true }; ws1.getCell(`D${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};
        ws1.mergeCells(`F${currentRow+3}:H${currentRow+5}`); ws1.getCell(`F${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`F${currentRow+3}`)); ws1.getCell(`F${currentRow+3}`).font = { bold: true }; ws1.getCell(`F${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};

        ws1.mergeCells(`A${currentRow+6}:C${currentRow+6}`); ws1.getCell(`A${currentRow+6}`).value = `FECHA: ${activeProfile.FECHA}`; applyStyle(ws1.getCell(`A${currentRow+6}`)); ws1.getCell('A' + (currentRow+6)).alignment = {horizontal:'left'};
        ws1.mergeCells(`D${currentRow+6}:E${currentRow+6}`); ws1.getCell(`D${currentRow+6}`).value = `FECHA: `; applyStyle(ws1.getCell(`D${currentRow+6}`)); ws1.getCell('D' + (currentRow+6)).alignment = {horizontal:'left'};
        ws1.mergeCells(`F${currentRow+6}:H${currentRow+6}`); ws1.getCell(`F${currentRow+6}`).value = `FECHA: `; applyStyle(ws1.getCell(`F${currentRow+6}`)); ws1.getCell('F' + (currentRow+6)).alignment = {horizontal:'left'};

        const embedSig = (b64: string, col: number, colMaxOffset: number, row: number) => {
          if (!b64) return;
          try {
            const extension = b64.includes('png') ? 'png' : 'jpeg';
            const imageId = wb.addImage({ 
              base64: b64.split(',')[1], 
              extension: extension as any
            });
            // Se ajusta el tamaño y la posición para que no se salga de las celdas
            // Usamos coordenadas precisas respetando el texto "FIRMA:" que está arriba.
            ws1.addImage(imageId, { 
              tl: { col: col + 0.3, row: row - 1 + 0.8 } as any, 
              br: { col: col + colMaxOffset - 0.3, row: row - 1 + 2.8 } as any,
              editAs: 'oneCell'
            });
          } catch (e) {
            console.error("Error embedding signature", e);
          }
        };
        embedSig(activeProfile.ELABORO_FIRMA, 0, 3, currentRow+3);
        embedSig(activeProfile.REVISO_FIRMA, 3, 2, currentRow+3);
        embedSig(activeProfile.APROBO_FIRMA, 5, 3, currentRow+3);
      }

      const buffer = await wb.xlsx.writeBuffer();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buffer]));
      a.download = selectedTags.length === 1 ? `Protocolo_${selectedTags[0]}.xlsx` : `Protocolos_Masivos_${selectedTags.length}TAGs.xlsx`;
      a.click();
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
        const activeInstrument = instrumentos.find(i => i.TAGNAME === tag);
        const fotosDelTag = (modoExportacion === 'DRIVE' 
          ? driveFotosDownloaded.filter(f => f.TAGNAME === tag)
          : fotos.filter(f => f.TAGNAME === tag)).slice(0, 4);

        if (!activeInstrument) return '';

        const currentLogo = activeProfile.TIPO === 'POTENCIA' ? logoPotencia : logoInstrumentacion;

        if (activeProfile.TIPO === 'POTENCIA') {
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
                  Formato Precomisionamiento<br/>Lista de chequeo Motor baja tensión<br/>CHKL-ELE-08
                </td>
                <td class="bg-blue">Fecha:</td>
                <td class="center">${activeProfile.FECHA_REVISION || ''}</td>
              </tr>
              <tr>
                <td class="bg-blue">Versión:</td>
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
                  <td class="text-left">${(activeProfile as any)[`CHKL_${num}_DESC`] || ''}</td>
                  <td class="center">${(activeProfile as any)[`CHKL_${num}_ESTADO`] === 'CUMPLE' ? 'X' : ''}</td>
                  <td class="center">${(activeProfile as any)[`CHKL_${num}_ESTADO`] === 'NO_CUMPLE' ? 'X' : ''}</td>
                  <td class="center">${(activeProfile as any)[`CHKL_${num}_ESTADO`] === 'N/A' ? 'X' : ''}</td>
                </tr>
              `).join('')}
              <tr>
                <td colspan="5" style="text-align: left; padding: 10px; height: 100px; vertical-align: top;">
                  <div style="font-weight: bold;">Comentarios:</div>
                  <div style="white-space: pre-wrap; font-family: monospace;">${activeProfile.COMENTARIOS || ''}</div>
                </td>
              </tr>
            </table>

            <!-- FIRMAS -->
            <table class="grid-table mt-4" style="page-break-inside: avoid;">
              <tr>
                <td colspan="3" class="bg-blue">CONTRATISTA Y/O VENDOR</td>
                <td colspan="3" class="bg-blue">PRECOMISIONAMIENTO</td>
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
                <td colspan="3" class="text-left">${activeProfile.POT_NOMBRE_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_NOMBRE_3 || ''}</td>
              </tr>
              <tr>
                <td class="text-left font-bold">FECHA</td>
                <td colspan="2" class="text-left">${activeProfile.POT_FECHA_1 || ''}</td>
                <td colspan="3" class="text-left">${activeProfile.POT_FECHA_2 || ''}</td>
                <td colspan="2" class="text-left">${activeProfile.POT_FECHA_3 || ''}</td>
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
                PROTOCOLO DE PRUEBAS DE ${activeProfile.TIPO === 'POTENCIA' ? 'POTENCIA' : 'INSTRUMENTACIÓN'}
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
              <td colspan="2" class="font-bold uppercase">${activeInstrument.TAGNAME}</td>
              <td colspan="2" class="bg-blue text-left">FABRICANTE/MODELO:</td>
              <td colspan="2">${activeProfile.FABRICANTE_MODELO || 'N/A'}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">TIPO CABLE / DESC:</td>
              <td colspan="6" class="uppercase">${activeInstrument.TIPO_CABLE} / ${activeInstrument.DESCRIPCIÓN}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">RANGO OPERACIÓN:</td>
              <td colspan="2">${activeProfile.RANGO_OPERACION || 'N/A'}</td>
              <td colspan="2" class="bg-blue text-left">CLASE EXACTITUD:</td>
              <td colspan="2">${activeProfile.CLASE_EXACTITUD || 'N/A'}</td>
            </tr>
            <tr>
              <td colspan="2" class="bg-blue text-left">UBICACIÓN:</td>
              <td colspan="2" class="uppercase">${activeInstrument.UBICACIÓN}</td>
              <td colspan="2" class="bg-blue text-left">TAG CABLE SWC:</td>
              <td colspan="2" class="uppercase">${activeInstrument.TAG_CABLE_SWC || 'N/A'}</td>
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
              <td colspan="3" class="text-left">FECHA: ${activeProfile.FECHA}</td>
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
              <button 
                className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${modoExportacion === 'DRIVE' ? 'bg-white text-blue-700 shadow-sm' : 'bg-transparent text-gray-400 hover:text-gray-600'}`}
                onClick={() => { setModoExportacion('DRIVE'); setSelectedTags([]); }}
              >
                Google Drive (Masiva)
              </button>
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
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1F3864] focus:outline-none text-sm font-medium transition-all"
                />
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
                  className={`px-3 py-2 border rounded-lg transition-colors flex items-center justify-center flex-1 md:flex-none ${showFilters || filtroUbicacion || filtroTipoCable ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                >
                  <Filter size={18} className="mr-2 md:mr-0" />
                  <span className="md:hidden text-xs font-bold uppercase">Filtros</span>
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Ubicación</label>
                  <select 
                    value={filtroUbicacion} 
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-[#1F3864] focus:outline-none font-medium"
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
                    className="w-full p-2 text-xs border border-gray-200 rounded-lg bg-white focus:ring-[#1F3864] focus:outline-none font-medium"
                  >
                    <option value="">Todos</option>
                    {tiposCableUnicos.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setFiltroUbicacion('');
                      setFiltroTipoCable('');
                      setSearchQuery('');
                    }}
                    className="w-full py-2 px-3 text-[10px] font-bold uppercase bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {modoExportacion === 'DRIVE' ? 'Instrumentos En Drive' : 'Instrumentos Con Fotos'} ({filteredInstrumentos.length})
              </label>
              {filteredInstrumentos.length > 0 && (
                <div className="flex gap-4">
                   <button onClick={handleSelectAll} className="text-[10px] text-blue-600 font-black hover:text-blue-800 transition-colors uppercase tracking-widest">
                    {selectedTags.length === filteredInstrumentos.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
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
              ) : filteredInstrumentos.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <Camera className="text-gray-200" size={40} />
                  </div>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">No hay resultados</p>
                  <p className="text-xs text-gray-400 mt-1">Intenta ajustando los filtros o la búsqueda</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 pt-2">
                  {filteredInstrumentos.map((inst, index) => (
                    <label 
                      key={`${inst.TAGNAME}-${index}`} 
                      className={`flex flex-col p-3 rounded-xl cursor-pointer border-2 transition-all group relative ${
                        selectedTags.includes(inst.TAGNAME) 
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/10' 
                        : 'bg-gray-50 border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${selectedTags.includes(inst.TAGNAME) ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                          {selectedTags.includes(inst.TAGNAME) && <Check size={10} className="text-white" />}
                        </div>
                        <input 
                          type="checkbox" 
                          checked={selectedTags.includes(inst.TAGNAME)}
                          onChange={() => handleToggleTag(inst.TAGNAME)}
                          className="hidden" 
                        />
                      </div>
                      <p className={`text-xs font-black uppercase truncate ${selectedTags.includes(inst.TAGNAME) ? 'text-blue-700' : 'text-[#1F3864]'}`}>
                        {inst.TAGNAME}
                      </p>
                      <p className="text-[8px] text-gray-400 truncate uppercase mt-0.5 font-bold tracking-tighter">
                        {inst.DESCRIPCIÓN || 'SIN DESCRIPCIÓN'}
                      </p>
                      {inst.UBICACIÓN && (
                        <span className="mt-2 text-[7px] font-black uppercase text-gray-400 bg-gray-200/50 w-fit px-1.5 py-0.5 rounded">
                          {inst.UBICACIÓN}
                        </span>
                      )}
                    </label>
                  ))}
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
                  {perfiles.map(p => <option key={p.ID_PERFIL} value={p.ID_PERFIL}>{p.NOMBRE_PERFIL.toUpperCase()}</option>)}
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
                
                <Button 
                  onClick={() => exportarPDF('UNIDO')} 
                  variant="pdf" 
                  icon={Printer} 
                  disabled={selectedTags.length === 0 || !selectedProfile}
                  className="w-full py-4 shadow-lg shadow-red-200 active:scale-[0.98] transition-all rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  Generar Protocolos (PDF)
                </Button>
                
                <Button 
                  onClick={exportarExcel} 
                  variant="success" 
                  icon={FileSpreadsheet} 
                  disabled={isExporting || selectedTags.length === 0 || !selectedProfile}
                  className="w-full py-4 shadow-lg shadow-green-200 active:scale-[0.98] transition-all rounded-xl font-black text-[10px] uppercase tracking-widest"
                >
                  {isExporting ? 'Procesando...' : 'Descargar Excel (.xlsx)'}
                </Button>
                
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
