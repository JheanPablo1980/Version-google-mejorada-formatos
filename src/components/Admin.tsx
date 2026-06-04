import React, { useState, useRef } from 'react';
import { Database, Image as ImageIcon, FileSpreadsheet, CloudUpload, Trash2, CheckCircle, Shield, Eye, EyeOff, Plus, Camera, History, Download, FileText, LayoutDashboard, Settings, Building, Sliders } from 'lucide-react';
import { useAppStore, UserRole, RolePermissions } from '../store/useAppStore';
import { Button } from './ui/Button';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

export const Admin: React.FC = () => {
  const { 
    instrumentos, 
    loadInstrumentosBulk, 
    potenciaEquipos,
    loadPotenciaEquiposBulk,
    saveLogo, 
    syncWithSupabase, 
    totalFactoryReset,
    clearInstrumentos,
    clearPotenciaEquipos,
    clearFotos,
    clearPerfiles,
    rolePermissions,
    updateRolePermissions,
    appSettings,
    updateAppSettings
  } = useAppStore();
  const [activeTab, setActiveTab] = useState<'corporativo' | 'bd' | 'control'>('corporativo');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPot, setIsProcessingPot] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showPotencia, setShowPotencia] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassChange, setShowPassChange] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [confirmStep, setConfirmStep] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInstInputRef = useRef<HTMLInputElement>(null);
  const logoPotInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearInstrumentos = async () => {
    if (confirmStep !== 'instrumentos') {
      setConfirmStep('instrumentos');
      setTimeout(() => setConfirmStep(null), 3000);
      return;
    }
    try {
      setIsClearing(true);
      await clearInstrumentos();
      showNotification('Tabla de Instrumentos borrada');
    } catch (e: any) {
      showNotification('Error al borrar instrumentos', 'error');
    } finally {
      setIsClearing(false);
      setConfirmStep(null);
    }
  };

  const handleClearPotencia = async () => {
    if (confirmStep !== 'potencia_db') {
      setConfirmStep('potencia_db');
      setTimeout(() => setConfirmStep(null), 3000);
      return;
    }
    try {
      setIsClearing(true);
      await clearPotenciaEquipos();
      showNotification('Tabla de Potencia borrada');
    } catch (e: any) {
      showNotification('Error al borrar equipos de potencia', 'error');
    } finally {
      setIsClearing(false);
      setConfirmStep(null);
    }
  };

  const handleClearFotos = async () => {
    if (confirmStep !== 'fotos') {
      setConfirmStep('fotos');
      setTimeout(() => setConfirmStep(null), 3000);
      return;
    }
    try {
      setIsClearing(true);
      await clearFotos();
      showNotification('Tabla de Fotos borrada');
    } catch (e: any) {
      showNotification('Error al borrar fotos', 'error');
    } finally {
      setIsClearing(false);
      setConfirmStep(null);
    }
  };

  const handleClearPerfiles = async () => {
    if (confirmStep !== 'perfiles') {
      setConfirmStep('perfiles');
      setTimeout(() => setConfirmStep(null), 3000);
      return;
    }
    try {
      setIsClearing(true);
      await clearPerfiles();
      showNotification('Perfiles borrados correctamente');
    } catch (e: any) {
      showNotification('Error al borrar perfiles', 'error');
    } finally {
      setIsClearing(false);
      setConfirmStep(null);
    }
  };

  const handleTotalReset = async () => {
    if (confirmStep !== 'total') {
      setConfirmStep('total');
      setTimeout(() => setConfirmStep(null), 5000); 
      return;
    }

    try {
      setIsClearing(true);
      await totalFactoryReset();
      showNotification('Base de datos borrada completamente');
    } catch (e: any) {
      showNotification('Error al borrar la base de datos', 'error');
    } finally {
      setIsClearing(false);
      setConfirmStep(null);
    }
  };

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      await syncWithSupabase();
      showNotification('Sincronización exitosa');
    } catch (e: any) {
      showNotification('Error en la sincronización', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTogglePermission = async (role: UserRole, key: keyof RolePermissions) => {
    await updateRolePermissions(role, { [key]: !rolePermissions[role][key] });
  };
  
  const { updateAdminPassword } = useAppStore();

  const handlePasswordChange = async () => {
    if (newPassword.trim().length < 3) {
      showNotification('La contraseña debe tener al menos 3 caracteres', 'error');
      return;
    }
    try {
      await updateAdminPassword(newPassword.trim());
      showNotification('Contraseña actualizada correctamente');
      setNewPassword('');
      setShowPassChange(false);
    } catch (e) {
      showNotification('Error al actualizar contraseña', 'error');
    }
  };

  const sectionIcons: Record<keyof RolePermissions, any> = {
    admin: Shield,
    dashboard: LayoutDashboard,
    nuevo: Plus,
    fotos: Camera,
    galeria: ImageIcon,
    perfiles: FileText,
    historial: History,
    generar: Download,
  };

  const sectionLabels: Record<keyof RolePermissions, string> = {
    admin: 'Admin',
    dashboard: 'Panel',
    nuevo: 'BD',
    fotos: 'Cámara',
    galeria: 'Fotos',
    perfiles: 'Perfiles',
    historial: 'Historial',
    generar: 'Exportar',
  };

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error("El archivo está vacío");
        }

        // Optimize: Find column mappings once
        const firstRow = rawJson[0];
        const rowKeys = Object.keys(firstRow);
        
        const getMappedKey = (targets: string[]) => {
          for (const t of targets) {
            const found = rowKeys.find(rk => {
              const normalizedKey = rk.toString()
                .replace(/[\r\n\t]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();
              const targetKey = t.toUpperCase().trim();
              return normalizedKey === targetKey || normalizedKey.includes(targetKey);
            });
            if (found) return found;
          }
          return null;
        };

        const keyMap = {
          TAG_CABLE_SWC: getMappedKey(['TAG CABLE SWC', 'TAG CABLE']),
          TAGNAME: getMappedKey(['TAGNAME', 'TAG']),
          DESCRIPCION: getMappedKey(['DESCRIPCIÓN', 'DESCRIPTION', 'DESCRIPCION']),
          TIPO_CABLE: getMappedKey(['TIPO CABLE', 'TIPO']),
          UBICACION: getMappedKey(['UBICACIÓN', 'UBICACION', 'LOCATION']),
          OBSERVACION: getMappedKey(['OBSERVACIÓN', 'OBSERVACION', 'REMARKS', 'NOTES'])
        };

        const formattedData: any = rawJson.map((row: any) => {
          return {
            TAG_CABLE_SWC: keyMap.TAG_CABLE_SWC ? row[keyMap.TAG_CABLE_SWC] : '',
            TAGNAME: keyMap.TAGNAME ? row[keyMap.TAGNAME] : '', 
            DESCRIPCIÓN: keyMap.DESCRIPCION ? row[keyMap.DESCRIPCION] : '',
            TIPO_CABLE: keyMap.TIPO_CABLE ? row[keyMap.TIPO_CABLE] : '',
            UBICACIÓN: keyMap.UBICACION ? row[keyMap.UBICACION] : '',
            OBSERVACIÓN: keyMap.OBSERVACION ? row[keyMap.OBSERVACION] : ''
          };
        }).filter(item => item.TAGNAME && item.TAGNAME.toString().trim() !== '');

        if (formattedData.length === 0) {
          showNotification("No se encontraron instrumentos. Verifique la columna 'TAGNAME'.", 'error');
          return;
        }

        await loadInstrumentosBulk(formattedData);
        showNotification(`${formattedData.length} instrumentos cargados`);
      } catch (error: any) { 
        showNotification("Error leyendo el archivo o guardando en bd local: " + (error.message || 'Error desconocido'), 'error'); 
        console.error("Error bulk load:", error);
      } finally { 
        setIsProcessing(false); 
        if(fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processFilePotencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPot(true);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          throw new Error("El archivo está vacío");
        }

        // Optimize: Find column mappings once
        const firstRow = rawJson[0];
        const rowKeys = Object.keys(firstRow);
        
        const getMappedKey = (targets: string[]) => {
          for (const t of targets) {
            const found = rowKeys.find(rk => {
              const normalizedKey = rk.toString()
                .replace(/[\r\n\t]+/g, ' ')
                .replace(/\s+/g, ' ')
                .trim()
                .toUpperCase();
              const targetKey = t.toUpperCase().trim();
              return normalizedKey === targetKey || normalizedKey.includes(targetKey);
            });
            if (found) return found;
          }
          return null;
        };

        const keyMap = {
          TAG: getMappedKey(['TAG', 'TAGNAME']),
          DESCRIPCION: getMappedKey(['DESCRIPCIÓN', 'DESCRIPTION', 'DESCRIPCION'])
        };

        const formattedData: any = rawJson.map((row: any) => {
          return {
            TAG: keyMap.TAG ? row[keyMap.TAG] : '', 
            DESCRIPCIÓN: keyMap.DESCRIPCION ? row[keyMap.DESCRIPCION] : ''
          };
        }).filter(item => item.TAG && item.TAG.toString().trim() !== '');

        if (formattedData.length === 0) {
          showNotification("No se encontraron equipos. Verifique las columnas 'TAG' y 'DESCRIPCIÓN'.", 'error');
          return;
        }

        await loadPotenciaEquiposBulk(formattedData);
        showNotification(`${formattedData.length} equipos de potencia cargados`);
      } catch (error: any) { 
        showNotification("Error leyendo el archivo: " + (error.message || 'Error desconocido'), 'error'); 
      } finally { 
        setIsProcessingPot(false); 
        if(filePotInputRef.current) filePotInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = (type: 'instrumentacion' | 'potencia') => {
    const headers = type === 'instrumentacion' 
      ? ['TAG CABLE SWC', 'TAGNAME', 'DESCRIPCIÓN', 'TIPO CABLE', 'UBICACIÓN', 'OBSERVACIÓN']
      : ['TAG', 'DESCRIPCIÓN'];
    const fileName = type === 'instrumentacion' 
      ? 'plantilla_instrumentacion.xlsx' 
      : 'plantilla_potencia.xlsx';

    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, fileName);
  };

  const filePotInputRef = useRef<HTMLInputElement>(null);
  const { logoInstrumentacion, logoPotencia } = useAppStore();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'INSTRUMENTACION' | 'POTENCIA') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await saveLogo(reader.result as string, type);
        showNotification(`Logo ${type.toLowerCase()} actualizado`);
      };
      reader.readAsDataURL(file);
    } catch (error) { 
      showNotification("Error al guardar el logo.", 'error'); 
    }
  };

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
            <div className={`p-1 rounded-full text-white ${notification.type === 'error' ? 'bg-red-800' : 'bg-green-500'}`}>
              <CheckCircle size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider">{notification.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
        <Settings size={28} /> Panel de Administración
      </h2>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border border-gray-200">
        <button
          onClick={() => setActiveTab('corporativo')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${
            activeTab === 'corporativo' ? 'bg-white shadow text-[#1F3864]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Building size={16} /> <span className="hidden sm:inline">Corporativo</span>
        </button>
        <button
          onClick={() => setActiveTab('bd')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${
            activeTab === 'bd' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Database size={16} /> <span className="hidden sm:inline">BD y Datos</span>
        </button>
        <button
          onClick={() => setActiveTab('control')}
          className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-bold transition-all ${
            activeTab === 'control' ? 'bg-white shadow text-purple-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Sliders size={16} /> <span className="hidden sm:inline">Roles y Control</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'corporativo' && (
          <motion.div
            key="corporativo"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Sección Logos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
                <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center justify-center gap-2">
                  <ImageIcon size={18} className="text-blue-500" /> Logo Instrumentación
                </h3>
                {logoInstrumentacion && (
                  <div className="bg-gray-50 border p-2 rounded-lg inline-block w-full max-w-[200px] h-[80px] flex items-center justify-center">
                    <img src={logoInstrumentacion} alt="Logo Inst" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <p className="text-[10px] text-gray-500">Logo para reportes de Instrumentación.</p>
                <input type="file" accept="image/*" className="hidden" ref={logoInstInputRef} onChange={(e) => handleLogoUpload(e, 'INSTRUMENTACION')} />
                <Button onClick={() => logoInstInputRef.current?.click()} icon={ImageIcon} variant="secondary" className="w-full">
                  {logoInstrumentacion ? 'Cambiar Logo Instr.' : 'Subir Logo Instr.'}
                </Button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
                <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center justify-center gap-2">
                  <ImageIcon size={18} className="text-orange-500" /> Logo Potencia
                </h3>
                {logoPotencia && (
                  <div className="bg-gray-50 border p-2 rounded-lg inline-block w-full max-w-[200px] h-[80px] flex items-center justify-center">
                    <img src={logoPotencia} alt="Logo Pot" className="max-w-full max-h-full object-contain" />
                  </div>
                )}
                <p className="text-[10px] text-gray-500">Logo para reportes de Potencia.</p>
                <input type="file" accept="image/*" className="hidden" ref={logoPotInputRef} onChange={(e) => handleLogoUpload(e, 'POTENCIA')} />
                <Button onClick={() => logoPotInputRef.current?.click()} icon={ImageIcon} variant="secondary" className="w-full">
                  {logoPotencia ? 'Cambiar Logo Pot.' : 'Subir Logo Pot.'}
                </Button>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4 flex flex-col h-full">
              <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 text-left flex items-center gap-2">
                <Shield size={18} className="text-blue-500" /> Seguridad
              </h3>
              <div className="space-y-4 flex-grow flex flex-col justify-center">
                {!showPassChange ? (
                  <Button 
                    onClick={() => setShowPassChange(true)} 
                    variant="secondary" 
                    className="w-full h-full py-3"
                    icon={Shield}
                  >
                    Cambiar Contraseña Admin
                  </Button>
                ) : (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nueva Contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center"
                        autoFocus
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        onClick={() => setShowPassChange(false)} 
                        variant="secondary" 
                        className="w-full sm:flex-1 !bg-gray-100 !text-gray-600 py-2 text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handlePasswordChange} 
                        variant="secondary" 
                        className="w-full sm:flex-1 !bg-[#1F3864] !text-white py-2 text-xs"
                      >
                        Confirmar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bd' && (
          <motion.div
            key="bd"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-4"
          >
            {/* Sección BD Maestras */}
            <div className={`grid grid-cols-1 ${appSettings.enableGenInstrumentacion && appSettings.enableGenPotencia ? 'md:grid-cols-2' : ''} gap-4`}>
              {appSettings.enableGenInstrumentacion && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4 flex flex-col h-full">
                  <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 text-left flex items-center gap-2">
                    <Database size={18} className="text-blue-500" /> Listado Maestro de TAGs (Instr.)
                  </h3>
                  <p className="text-sm text-gray-500 text-left flex-grow">Sube el archivo Excel o CSV con el listado de TAGs de instrumentación.</p>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={processFile} />
                    <Button onClick={() => fileInputRef.current?.click()} icon={FileSpreadsheet} disabled={isProcessing} className="w-full justify-center" title="Cargar archivo Excel/CSV">
                    </Button>
                    <Button onClick={() => downloadTemplate('instrumentacion')} icon={Download} variant="secondary" className="w-full justify-center" title="Descargar plantilla de encabezados">
                    </Button>
                  </div>
                </div>
              )}

              {appSettings.enableGenPotencia && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4 flex flex-col h-full">
                  <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 text-left flex items-center gap-2 leading-tight">
                    <Database size={18} className="text-orange-500 shrink-0" /> Listado Maestro de Potencia
                  </h3>
                  <p className="text-sm text-gray-500 text-left flex-grow">Sube el archivo Excel o CSV con el listado de TAGs de potencia.</p>
                  <div className="grid grid-cols-2 gap-2 mt-auto">
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={filePotInputRef} onChange={processFilePotencia} />
                    <Button onClick={() => filePotInputRef.current?.click()} icon={FileSpreadsheet} disabled={isProcessingPot} className="w-full !bg-orange-600 justify-center" title="Cargar archivo Excel/CSV">
                    </Button>
                    <Button onClick={() => downloadTemplate('potencia')} icon={Download} variant="secondary" className="w-full justify-center" title="Descargar plantilla de encabezados">
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Componente BD Stats */}
            <div className={`grid grid-cols-1 ${appSettings.enableGenInstrumentacion && appSettings.enableGenPotencia ? 'sm:grid-cols-2' : ''} gap-4`}>
              {appSettings.enableGenInstrumentacion && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Instrumentos</p>
                    <p className="text-3xl font-bold text-blue-700">{instrumentos.length}</p>
                  </div>
                  <Database className="text-blue-200" size={32} />
                </div>
              )}
              {appSettings.enableGenPotencia && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-orange-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Equipos Potencia</p>
                    <p className="text-3xl font-bold text-orange-600">{potenciaEquipos.length}</p>
                  </div>
                  <Database className="text-orange-200" size={32} />
                </div>
              )}
            </div>

            {appSettings.enableMassUploadDrive && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 text-left flex flex-col h-full">
              <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2">
                <CloudUpload size={18} className="text-blue-500" /> Carpeta de Fotos Masivas (Google Drive)
              </h3>
              <div className="text-xs text-gray-500 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100 flex-grow">
                <strong>Configuración local:</strong> Pega aquí el link de tu carpeta de Google Drive donde almacenarás las fotos masivas de los TAG.<br/><br/>
                El formato debe ser: <code>TAGNAME-1.jpg</code> o estar en subcarpetas con el nombre del TAG.
              </div>
              <div className="space-y-2 mt-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    id="drive-link-input"
                    placeholder="https://drive.google.com/..." 
                    className="flex-1 w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    defaultValue={useAppStore.getState().driveFolderLink || ''}
                  />
                  <Button 
                    variant="secondary" 
                    className="w-full sm:w-auto !py-2 shrink-0"
                    onClick={() => {
                      const input = document.getElementById('drive-link-input') as HTMLInputElement;
                      const val = input?.value || '';
                      if (val.includes('drive.google.com')) {
                        useAppStore.getState().saveDriveFolderLink(val);
                        showNotification('Enlace guardado');
                      } else if (val === '') {
                        useAppStore.getState().saveDriveFolderLink('');
                        showNotification('Enlace eliminado');
                      } else {
                        showNotification('Enlace inválido', 'error');
                      }
                    }}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center text-center gap-4">
              <CloudUpload size={32} className="text-blue-600" />
              <div>
                <h3 className="font-bold text-[#1F3864]">Respaldo en la Nube (Sincronización)</h3>
                <p className="text-xs text-gray-500 mt-1">Sube tus datos locales al servidor para compartirlos con otros equipos.</p>
              </div>
              <Button onClick={handleSync} icon={CloudUpload} variant="secondary" disabled={isSyncing} className="w-full max-w-sm">
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Todos los Datos'}
              </Button>
            </div>

            <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200">
              <h3 className="font-bold text-red-700 text-lg border-b border-red-200 pb-2 flex items-center gap-2 mb-4">
                <Trash2 size={18} /> Zona de Peligro
              </h3>
              
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <Button 
                  onClick={handleClearInstrumentos} 
                  variant={confirmStep === 'instrumentos' ? 'danger' : 'secondary'} 
                  className={`w-full text-xs py-2 ${confirmStep === 'instrumentos' ? '!bg-red-600 !text-white' : '!text-red-700 !border-red-200 hover:!bg-red-100'}`}
                  disabled={isClearing}
                >
                  {confirmStep === 'instrumentos' ? '¿Confirmar?' : 'Limpiar Instrumentos'}
                </Button>
                <Button 
                  onClick={handleClearPotencia} 
                  variant={confirmStep === 'potencia_db' ? 'danger' : 'secondary'} 
                  className={`w-full text-xs py-2 ${confirmStep === 'potencia_db' ? '!bg-red-600 !text-white' : '!text-red-700 !border-red-200 hover:!bg-red-100'}`}
                  disabled={isClearing}
                >
                  {confirmStep === 'potencia_db' ? '¿Confirmar?' : 'Limpiar Potencia'}
                </Button>
                <Button 
                  onClick={handleClearFotos} 
                  variant={confirmStep === 'fotos' ? 'danger' : 'secondary'} 
                  className={`w-full text-xs py-2 ${confirmStep === 'fotos' ? '!bg-red-600 !text-white' : '!text-red-700 !border-red-200 hover:!bg-red-100'}`}
                  disabled={isClearing}
                >
                  {confirmStep === 'fotos' ? '¿Confirmar?' : 'Limpiar Fotos'}
                </Button>
                <Button 
                  onClick={handleClearPerfiles} 
                  variant={confirmStep === 'perfiles' ? 'danger' : 'secondary'} 
                  className={`w-full text-xs py-2 ${confirmStep === 'perfiles' ? '!bg-red-600 !text-white' : '!text-red-700 !border-red-200 hover:!bg-red-100'}`}
                  disabled={isClearing}
                >
                  {confirmStep === 'perfiles' ? '¿Confirmar?' : 'Limpiar Perfiles'}
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-red-200">
                <Button 
                  onClick={handleTotalReset} 
                  variant="secondary" 
                  className={`w-full text-xs py-3 shadow-sm transition-all ${confirmStep === 'total' ? '!bg-red-800 animate-pulse' : '!bg-red-600'} !text-white hover:!bg-red-700`}
                  icon={Trash2}
                  disabled={isClearing}
                >
                  {isClearing ? 'Reiniciando...' : (confirmStep === 'total' ? '¡CLIC OTRA VEZ: TOTAL!' : 'FÁBRICA: BORRADO TOTAL')}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setShowInstruments(!showInstruments)}
                >
                  <div className="flex items-center gap-2 font-bold text-[#1F3864]">
                    <FileSpreadsheet size={18} className="text-blue-600" />
                    <span>Ver Tabla Instrumentación</span>
                  </div>
                  <motion.div animate={{ rotate: showInstruments ? 180 : 0 }}>
                    <Download size={18} className="text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showInstruments && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase font-bold sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-2 border-b">TAGNAME</th>
                              <th className="px-4 py-2 border-b">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {instrumentos.length > 0 ? (
                              instrumentos.map((inst, idx) => (
                                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                  <td className="px-4 py-2 font-mono font-bold text-blue-700">{inst.TAGNAME}</td>
                                  <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">{inst.DESCRIPCIÓN}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="px-4 py-10 text-center text-gray-400 italic">No hay instrumentos.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button 
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setShowPotencia(!showPotencia)}
                >
                  <div className="flex items-center gap-2 font-bold text-[#1F3864]">
                    <FileSpreadsheet size={18} className="text-orange-600" />
                    <span>Ver Tabla Potencia</span>
                  </div>
                  <motion.div animate={{ rotate: showPotencia ? 180 : 0 }}>
                    <Download size={18} className="text-gray-400" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showPotencia && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-gray-100"
                    >
                      <div className="overflow-x-auto max-h-[300px]">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 text-gray-500 uppercase font-bold sticky top-0 z-10">
                            <tr>
                              <th className="px-4 py-2 border-b">TAG</th>
                              <th className="px-4 py-2 border-b">Descripción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {potenciaEquipos.length > 0 ? (
                              potenciaEquipos.map((p, idx) => (
                                <tr key={idx} className="hover:bg-orange-50/50 transition-colors">
                                  <td className="px-4 py-2 font-mono font-bold text-orange-700">{p.TAG}</td>
                                  <td className="px-4 py-2 text-gray-600 truncate max-w-[200px]">{p.DESCRIPCIÓN}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={2} className="px-4 py-10 text-center text-gray-400 italic">No hay equipos de potencia.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'control' && (
          <motion.div
            key="control"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                <Sliders size={18} className="text-purple-500" /> Controles Globales (Aplicación)
              </h3>
              
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => updateAppSettings({ enableCameraManual: !appSettings.enableCameraManual })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableCameraManual ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableCameraManual ? 'text-purple-700' : 'text-gray-500'}`}>Cámara Modo Manual</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableCameraManual ? 'bg-purple-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableCameraManual ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Permitir seleccionar fotos del archivo.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableCameraAuto: !appSettings.enableCameraAuto })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableCameraAuto ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableCameraAuto ? 'text-purple-700' : 'text-gray-500'}`}>Cámara Modo En Vivo</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableCameraAuto ? 'bg-purple-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableCameraAuto ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Tomar foto usando la cámara del dispositivo.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableGenInstrumentacion: !appSettings.enableGenInstrumentacion })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableGenInstrumentacion ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableGenInstrumentacion ? 'text-blue-700' : 'text-gray-500'}`}>Formatos Instrumentación</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableGenInstrumentacion ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableGenInstrumentacion ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Habilitar creación/edición de perfiles de Inst.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableGenPotencia: !appSettings.enableGenPotencia })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableGenPotencia ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableGenPotencia ? 'text-orange-700' : 'text-gray-500'}`}>Formatos Potencia</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableGenPotencia ? 'bg-orange-500' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableGenPotencia ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Habilitar creación/edición de perfiles Potencia.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableMassUploadDrive: !appSettings.enableMassUploadDrive })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableMassUploadDrive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableMassUploadDrive ? 'text-blue-700' : 'text-gray-500'}`}>Integración Google Drive</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableMassUploadDrive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableMassUploadDrive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Subida múltiple de carpetas GDrive para fotos.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableExportPdf: !appSettings.enableExportPdf })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableExportPdf ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableExportPdf ? 'text-green-700' : 'text-gray-500'}`}>Exportación a PDF</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableExportPdf ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableExportPdf ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Permitir imprimir localmente a PDF.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableExportXlsx: !appSettings.enableExportXlsx })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableExportXlsx ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableExportXlsx ? 'text-green-700' : 'text-gray-500'}`}>Exportación a Excel</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableExportXlsx ? 'bg-green-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableExportXlsx ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Permitir generar y descargar .xlsx.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableUploadManual: !appSettings.enableUploadManual })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableUploadManual ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableUploadManual ? 'text-indigo-700' : 'text-gray-500'}`}>Subida Modo Manual</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableUploadManual ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableUploadManual ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Habilitar subida de un tag a la vez.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableUploadAuto: !appSettings.enableUploadAuto })}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    appSettings.enableUploadAuto ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${appSettings.enableUploadAuto ? 'text-pink-700' : 'text-gray-500'}`}>Carga Masiva Automática</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${appSettings.enableUploadAuto ? 'bg-pink-600' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${appSettings.enableUploadAuto ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500">Habilitar carga masiva de fotos auto-asignadas.</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                <Shield size={18} className="text-blue-500" /> Permisos de Usuarios
              </h3>
              <p className="text-xs text-gray-500 italic mb-4">Habilita o deshabilita secciones enteras para cada tipo de rol (Técnico / Invitado).</p>
              
              <div className="space-y-4">
                {(['TECNICO', 'INVITADO'] as UserRole[]).map(role => (
                  <div key={role} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <span className="font-bold text-xs uppercase tracking-widest text-[#1F3864]">Perfil: {role}</span>
                      <Shield size={14} className="text-gray-400" />
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {(Object.keys(rolePermissions[role]) as Array<keyof RolePermissions>).map(key => {
                        const isEnabled = rolePermissions[role][key];
                        const Icon = sectionIcons[key];
                        // Admin section is always disabled for non-ADMIN roles here for safety
                        if (key === 'admin' && role !== 'ADMIN') return null;

                        return (
                          <button
                            key={key}
                            onClick={() => handleTogglePermission(role, key)}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-tight ${
                              isEnabled 
                                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                : 'bg-white border-gray-100 text-gray-400 opacity-60 hover:opacity-100 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Icon size={14} />
                              <span>{sectionLabels[key]}</span>
                            </div>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ease-in-out shrink-0 ${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                              <div className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${isEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
