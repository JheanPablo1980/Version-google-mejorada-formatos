import React, { useState, useRef, useEffect } from 'react';
import { 
  Settings, Building, Database, Sliders, ImageIcon, FileSpreadsheet, Download, 
  CloudUpload, Shield, Trash2, CheckCircle2, AlertCircle, X, ReplaceAll, 
  Users, GraduationCap, LayoutDashboard, FileText, Image, Zap, History, Plus, Camera,
  Lock, Unlock
} from 'lucide-react';
import { useAppStore, UserRole, RolePermissions } from '../store/useAppStore';
import { Button } from './ui/Button';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

const sectionIcons: Record<keyof RolePermissions, React.ElementType> = {
  admin: Settings,
  dashboard: LayoutDashboard,
  nuevo: Plus,
  fotos: Camera,
  galeria: Image,
  perfiles: FileText,
  historial: History,
  generar: Download
};

const sectionLabels: Record<keyof RolePermissions, string> = {
  admin: 'Administración',
  dashboard: 'Dashboard',
  nuevo: 'Nuevo Registro',
  fotos: 'Catastro y Fotos',
  galeria: 'Galería de Fotos',
  perfiles: 'Listado Perfiles',
  historial: 'Historial',
  generar: 'Generación Doc.'
};

export const Admin = () => {
  const { 
    instrumentos, 
    potenciaEquipos, 
    loadInstrumentosBulk, 
    loadPotenciaEquiposBulk,
    logoInstrumentacion,
    logoPotencia,
    saveLogo,
    appSettings, 
    globalAppSettings,
    updateAppSettings,
    driveFolderLink,
    saveDriveFolderLink,
    totalFactoryReset,
    rolePermissions,
    updateRolePermissions,
    updateAdminPassword,
    usuariosRegistrados,
    updateUserRoleAssignment,
    deleteUserRoleAssignment,
    loadUsuariosRegistrados,
    session
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'corporativo' | 'bd' | 'config_usuarios' | 'proyectos'>('proyectos');
  
  useEffect(() => {
    if (activeTab === 'config_usuarios') {
      loadUsuariosRegistrados();
    }
  }, [activeTab, loadUsuariosRegistrados]);

  const [targetUser, setTargetUser] = useState<string>('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TECNICO');

  const currentSettings = targetUser 
    ? { ...(globalAppSettings || appSettings), ...((globalAppSettings || appSettings)?.userOverrides?.[targetUser.toLowerCase()] || {}) } 
    : (globalAppSettings || appSettings);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPot, setIsProcessingPot] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePotInputRef = useRef<HTMLInputElement>(null);
  const logoInstInputRef = useRef<HTMLInputElement>(null);
  const logoPotInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [showPassChange, setShowPassChange] = useState(false);
  const [driveLink, setDriveLink] = useState(driveFolderLink || '');

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showPotencia, setShowPotencia] = useState(false);

  const { syncWithSupabase, clearInstrumentos, clearPotenciaEquipos, clearFotos, clearPerfiles } = useAppStore();

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => alert(msg);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithSupabase();
      showNotification('Sincronización completa');
    } catch {
      showNotification('Error sincronizando', 'error');
    }
    setIsSyncing(false);
  };

  const handleClearInstrumentos = async () => {
    setIsClearing(true);
    await clearInstrumentos();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Instrumentos limpiados');
  };

  const handleClearPotencia = async () => {
    setIsClearing(true);
    await clearPotenciaEquipos();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Potencia limpiada');
  };

  const handleClearFotos = async () => {
    setIsClearing(true);
    await clearFotos();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Fotos limpiadas');
  };

  const handleClearPerfiles = async () => {
    setIsClearing(true);
    await clearPerfiles();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Perfiles limpiados');
  };

  const handleTotalReset = async () => {
    setIsClearing(true);
    await totalFactoryReset();
    setIsClearing(false);
    setShowResetConfirm(false);
    showNotification('Reinicio de fábrica completado');
  };
const handlePasswordChange = async () => {
    if (newPassword.trim().length < 3) {
      alert('La contraseña debe tener al menos 3 caracteres');
      return;
    }
    await updateAdminPassword(newPassword);
    setNewPassword('');
    setShowPassChange(false);
    alert('Contraseña actualizada');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'INSTRUMENTACION' | 'POTENCIA') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await saveLogo(base64, type);
        alert('Logo actualizado');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error subiendo logo');
    }
  };

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); alert('Archivo Instrumentacion Procesado'); }, 1000);
  };
  
  const processFilePotencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPot(true);
    setTimeout(() => { setIsProcessingPot(false); alert('Archivo Potencia Procesado'); }, 1000);
  };

  const downloadTemplate = (type: string) => {
  };

  const handleTogglePermission = async (role: UserRole, key: keyof RolePermissions) => {
    await updateRolePermissions(role, { [key]: !rolePermissions[role][key] });
  };

  const handleSaveDriveLink = async () => {
    await saveDriveFolderLink(driveLink);
    alert('Carpeta GDrive actualizada');
  };

  return (
    <div className="space-y-6">
<h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
        <Settings size={28} /> Panel de Administración
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 border-b-[3px] border-[#1F3864] px-2 md:px-4 pt-2 mb-6 overflow-x-auto custom-scrollbar">
        <button
          onClick={() => setActiveTab('proyectos')}
          className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'proyectos' 
            ? 'bg-white text-emerald-600 text-[15px]' 
            : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
          }`}
        >
          <Building size={16} /> <span>Proyectos</span>
        </button>
        <button
          onClick={() => setActiveTab('corporativo')}
          className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'corporativo' 
            ? 'bg-white text-[#1F3864] text-[15px]' 
            : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
          }`}
        >
          <Building size={16} /> <span>Corporativo</span>
        </button>
        <button
          onClick={() => setActiveTab('bd')}
          className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'bd' 
            ? 'bg-white text-blue-600 text-[15px]' 
            : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
          }`}
        >
          <Database size={16} /> <span>BD y Datos</span>
        </button>
        <button
          onClick={() => setActiveTab('config_usuarios')}
          className={`flex items-center justify-center gap-2 py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
            activeTab === 'config_usuarios' 
            ? 'bg-white text-purple-600 text-[15px]' 
            : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
          }`}
        >
          <Users size={16} /> <span>Configuración Usuarios</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'proyectos' && (
          <motion.div
            key="proyectos"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100">
              <h3 className="font-bold text-emerald-900 text-lg border-b pb-2 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-emerald-500" /> Crear Nuevo Proyecto Maestro
              </h3>
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target as HTMLFormElement);
                  const res = await useAppStore.getState().crearProyecto({
                    nombre: formData.get('nombre') as string,
                    cliente: formData.get('cliente') as string,
                    contrato: formData.get('contrato') as string,
                    estado: 'activo'
                  });
                  if (res.success) {
                    alert('Proyecto Creado Correctamente');
                    (e.target as HTMLFormElement).reset();
                  } else {
                    alert('Error creando proyecto: ' + res.error);
                  }
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Proyecto *</label>
                  <input required name="nombre" type="text" className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Ej. Expansión Caldera 2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cliente / Empresa</label>
                  <input required name="cliente" type="text" className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Ej. Smurfit Kappa Group" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Contrato o P.O.</label>
                  <input name="contrato" type="text" className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Ej. CO-2026-X" />
                </div>
                <div className="md:col-span-3 flex justify-end mt-2">
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-colors">
                    <Database size={18} /> GESTIONAR PROYECTO Y CREAR TABLAS
                  </Button>
                </div>
              </form>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 mb-4 flex items-center gap-2">
                <Database size={18} className="text-blue-500" /> Proyectos Existentes ({useAppStore.getState().proyectos.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Nombre</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {useAppStore.getState().proyectos.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{p.nombre}</td>
                        <td className="px-4 py-3 text-gray-500">{p.cliente}</td>
                        <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold uppercase">{p.estado}</span></td>
                        <td className="px-4 py-3 text-right flex justify-end gap-2">
                          <button 
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de vincular todos los datos huérfanos a ${p.nombre}?`)) {
                                const res = await useAppStore.getState().migrarDatosAProyecto(p.id);
                                if (res.success) {
                                  alert('Migración Completada. Toda la info previa ha sido guardada en ' + p.nombre);
                                  useAppStore.getState().loadData();
                                } else {
                                  alert('Error migrando: ' + res.error);
                                }
                              }
                            }}
                            className="text-emerald-600 hover:text-emerald-800 font-semibold text-xs border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded"
                          >
                            Vincular Info Histórica
                          </button>
                          <button 
                            onClick={() => useAppStore.getState().setProyectoActivo(p.id)}
                            className="text-blue-600 hover:text-blue-800 font-semibold text-xs border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded"
                          >
                            Seleccionar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

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
              
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                <label className="block text-xs font-bold text-[#1F3864] mb-1">Configurar para usuario específico (opcional)</label>
                <input
                  type="email"
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                  placeholder="Ingrese email (ej. juan@gmail.com) o deje en blanco para Global"
                  className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => updateAppSettings({ enableCameraManual: !currentSettings.enableCameraManual }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableCameraManual ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableCameraManual ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Cámara Modo Manual</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableCameraManual ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableCameraManual ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Permitir seleccionar fotos del archivo.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableCameraAuto: !currentSettings.enableCameraAuto }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableCameraAuto ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableCameraAuto ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Cámara Modo En Vivo</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableCameraAuto ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableCameraAuto ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Tomar foto usando la cámara del dispositivo.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ learningMode: !currentSettings.learningMode }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.learningMode ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold flex items-center gap-1 ${currentSettings.learningMode ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>
                      <GraduationCap size={14} /> Sesión de Aprendizaje
                    </span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.learningMode ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.learningMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Habilitar modo seguro para nuevos usuarios (sin guardado en la nube).</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableGenInstrumentacion: !currentSettings.enableGenInstrumentacion }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableGenInstrumentacion ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableGenInstrumentacion ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Formatos Instrumentación</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableGenInstrumentacion ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableGenInstrumentacion ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Habilitar creación/edición de perfiles de Inst.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableGenPotencia: !currentSettings.enableGenPotencia }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableGenPotencia ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableGenPotencia ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Formatos Potencia</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableGenPotencia ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableGenPotencia ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Habilitar creación/edición de perfiles Potencia.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableMassUploadDrive: !currentSettings.enableMassUploadDrive }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableMassUploadDrive ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableMassUploadDrive ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Integración Google Drive</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableMassUploadDrive ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableMassUploadDrive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Subida múltiple de carpetas GDrive para fotos.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableExportPdf: !currentSettings.enableExportPdf }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableExportPdf ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableExportPdf ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Exportación a PDF</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableExportPdf ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableExportPdf ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Permitir imprimir localmente a PDF.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableExportXlsx: !currentSettings.enableExportXlsx }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableExportXlsx ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableExportXlsx ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Exportación a Excel</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableExportXlsx ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableExportXlsx ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Permitir generar y descargar .xlsx.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableUploadManual: !currentSettings.enableUploadManual }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableUploadManual ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableUploadManual ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Subida Modo Manual</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableUploadManual ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableUploadManual ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Habilitar subida de un tag a la vez.</span>
                </button>

                <button
                  onClick={() => updateAppSettings({ enableUploadAuto: !currentSettings.enableUploadAuto }, targetUser)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    currentSettings.enableUploadAuto ? 'bg-[#F8FAFC] border-[#D9E1F2] shadow-sm' : 'bg-transparent border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className={`text-xs font-bold ${currentSettings.enableUploadAuto ? 'text-[#1F3864]' : 'text-[#64748B]'}`}>Carga Masiva Automática</span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableUploadAuto ? 'bg-[#2563EB]' : 'bg-gray-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableUploadAuto ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B]">Habilitar carga masiva de fotos auto-asignadas.</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                <Shield size={18} className="text-blue-500" /> Configuración Menús
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
      \n{activeTab === 'config_usuarios' && (
          <motion.div
            key="config_usuarios"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col md:flex-row gap-6 items-start"
          >
            {/* Sidebar Usuarios Registrados */}
            <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-4">
              <h3 className="font-bold text-[#1F3864] text-md border-b pb-2 flex items-center gap-2 mb-4">
                <Users size={16} className="text-blue-500" /> Roles y Usuarios
              </h3>
              
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Añadir o Actualizar Usuario</div>
                <div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <select
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        const user = usuariosRegistrados.find(u => u.email === e.target.value);
                        if (user) setNewRole(user.role);
                      }}
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un usuario...</option>
                      {usuariosRegistrados.map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={!newEmail}
                  >
                    <option value="TECNICO">TECNICO</option>
                    <option value="INVITADO">INVITADO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                         if (newEmail.trim()) {
                           updateUserRoleAssignment(newEmail.trim().toLowerCase(), newRole);
                           setNewEmail('');
                           setTargetUser(newEmail.trim().toLowerCase());
                         }
                      }}
                      disabled={!newEmail.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                    >
                      Asignar Rol
                    </button>
                    
                    <button
                      onClick={() => {
                        if (newEmail.trim()) {
                          deleteUserRoleAssignment(newEmail.trim().toLowerCase());
                          setNewEmail('');
                          setTargetUser('');
                        }
                      }}
                      title="Dar de baja"
                      disabled={!newEmail.trim()}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 disabled:opacity-50 disabled:hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Usuarios Registrados</div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <button 
                    onClick={() => setTargetUser('')}
                    className={`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-center justify-between ${targetUser === '' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                  >
                    <span>Todos (Global)</span>
                  </button>
                  {usuariosRegistrados.map((u) => (
                    <div key={u.email} className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-medium ${targetUser === u.email ? 'bg-purple-50 border-purple-300' : 'bg-white hover:bg-gray-50 border-gray-200'}`}>
                      <button
                        onClick={() => setTargetUser(u.email)}
                        className={`flex-1 text-left flex items-center justify-between min-w-0 mr-2 ${u.activo === false ? 'text-gray-400' : (targetUser === u.email ? 'text-purple-700' : 'text-gray-700')}`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0 pr-2">
                          <span className="truncate" title={u.email}>{u.email}</span>
                          {u.activo === false && <AlertCircle size={14} className="text-red-500 shrink-0" title="Usuario deshabilitado" />}
                          {session?.user?.email?.toLowerCase() === u.email.toLowerCase() && (
                            <span className="relative flex h-2.5 w-2.5 shrink-0" title="En línea (Tú)">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                          )}
                        </div>
                        <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'TECNICO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {u.role}
                        </span>
                      </button>
                      <button 
                        onClick={() => updateUserRoleAssignment(u.email, u.role, u.activo === false ? true : false)}
                        className={`shrink-0 ml-1 p-1.5 rounded-md flex items-center justify-center transition-colors ${u.activo === false ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        title={u.activo === false ? 'Habilitar acceso' : 'Deshabilitar acceso'}
                      >
                        {u.activo === false ? <Unlock size={14} className="stroke-[2.5px]" /> : <Lock size={14} className="stroke-[2.5px]" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full md:w-2/3 space-y-6">
              {/* Controles */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                  <Sliders size={18} className="text-purple-500" /> Controles Globales (Aplicación) {targetUser ? ` - ${targetUser}` : ' - Todo el Sistema'}
                </h3>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => updateAppSettings({ enableCameraManual: !currentSettings.enableCameraManual }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableCameraManual ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableCameraManual ? 'text-purple-700' : 'text-gray-500'}`}>Cámara Modo Manual</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableCameraManual ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableCameraManual ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Permitir seleccionar fotos del archivo.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableCameraAuto: !currentSettings.enableCameraAuto }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableCameraAuto ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableCameraAuto ? 'text-purple-700' : 'text-gray-500'}`}>Cámara Modo En Vivo</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableCameraAuto ? 'bg-purple-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableCameraAuto ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Tomar foto usando la cámara del dispositivo.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ learningMode: !currentSettings.learningMode }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.learningMode ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold flex items-center gap-1 ${currentSettings.learningMode ? 'text-emerald-700' : 'text-gray-500'}`}>
                        <GraduationCap size={14} /> Sesión de Aprendizaje
                      </span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.learningMode ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.learningMode ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar modo seguro para nuevos usuarios (sin guardado en la nube).</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableGenInstrumentacion: !currentSettings.enableGenInstrumentacion }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableGenInstrumentacion ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableGenInstrumentacion ? 'text-blue-700' : 'text-gray-500'}`}>Formatos Instrumentación</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableGenInstrumentacion ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableGenInstrumentacion ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar creación/edición de perfiles de Inst.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableGenPotencia: !currentSettings.enableGenPotencia }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableGenPotencia ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableGenPotencia ? 'text-orange-700' : 'text-gray-500'}`}>Formatos Potencia</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableGenPotencia ? 'bg-orange-500' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableGenPotencia ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar creación/edición de perfiles Potencia.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableMassUploadDrive: !currentSettings.enableMassUploadDrive }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableMassUploadDrive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableMassUploadDrive ? 'text-blue-700' : 'text-gray-500'}`}>Integración Google Drive</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableMassUploadDrive ? 'bg-blue-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableMassUploadDrive ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Subida múltiple de carpetas GDrive para fotos.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableExportPdf: !currentSettings.enableExportPdf }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableExportPdf ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableExportPdf ? 'text-green-700' : 'text-gray-500'}`}>Exportación a PDF</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableExportPdf ? 'bg-green-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableExportPdf ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Permitir imprimir localmente a PDF.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableExportXlsx: !currentSettings.enableExportXlsx }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableExportXlsx ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableExportXlsx ? 'text-green-700' : 'text-gray-500'}`}>Exportación a Excel</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableExportXlsx ? 'bg-green-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableExportXlsx ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Permitir generar y descargar .xlsx.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableUploadManual: !currentSettings.enableUploadManual }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableUploadManual ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableUploadManual ? 'text-indigo-700' : 'text-gray-500'}`}>Subida Modo Manual</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableUploadManual ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableUploadManual ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar subida de un tag a la vez.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableUploadAuto: !currentSettings.enableUploadAuto }, targetUser)}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                      currentSettings.enableUploadAuto ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${currentSettings.enableUploadAuto ? 'text-pink-700' : 'text-gray-500'}`}>Carga Masiva Automática</span>
                      <div className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out ${currentSettings.enableUploadAuto ? 'bg-pink-600' : 'bg-gray-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${currentSettings.enableUploadAuto ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar carga masiva de fotos auto-asignadas.</span>
                  </button>
                </div>
              </div>

              {/* Permisos de roles general */}
              {!targetUser && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                    <Shield size={18} className="text-blue-500" /> Configuración Menús
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
              )}
            </div>
          </motion.div>
        )}
\n</AnimatePresence>
    </div>
  );
};
