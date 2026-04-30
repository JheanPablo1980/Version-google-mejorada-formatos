import React, { useState, useRef } from 'react';
import { Database, Image as ImageIcon, FileSpreadsheet, CloudUpload, Trash2, CheckCircle, Shield, Eye, EyeOff, Plus, Camera, History, Download, FileText } from 'lucide-react';
import { useAppStore, UserRole, RolePermissions } from '../store/useAppStore';
import { Button } from './ui/Button';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

export const Admin: React.FC = () => {
  const { 
    instrumentos, 
    loadInstrumentosBulk, 
    logoBase64, 
    saveLogo, 
    syncWithSupabase, 
    totalFactoryReset,
    clearInstrumentos,
    clearFotos,
    clearPerfiles,
    rolePermissions,
    updateRolePermissions
  } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showInstruments, setShowInstruments] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [confirmStep, setConfirmStep] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const sectionIcons: Record<keyof RolePermissions, any> = {
    admin: Shield,
    nuevo: Plus,
    fotos: Camera,
    galeria: ImageIcon,
    perfiles: FileText,
    historial: History,
    generar: Download,
  };

  const sectionLabels: Record<keyof RolePermissions, string> = {
    admin: 'Admin',
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

        const formattedData: any = rawJson.map((row: any) => {
          const findKey = (keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const k of keys) {
              const found = rowKeys.find(rk => {
                const normalizedKey = rk.toString()
                  .replace(/[\r\n\t]+/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .toUpperCase();
                const targetKey = k.toUpperCase().trim();
                return normalizedKey === targetKey || normalizedKey.includes(targetKey);
              });
              if (found) return row[found];
            }
            return '';
          };
          return {
            TAG_CABLE_SWC: findKey(['TAG CABLE SWC', 'TAG CABLE']),
            TAGNAME: findKey(['TAGNAME', 'TAG']), 
            DESCRIPCIÓN: findKey(['DESCRIPCIÓN', 'DESCRIPTION', 'DESCRIPCION']),
            TIPO_CABLE: findKey(['TIPO CABLE', 'TIPO']),
            UBICACIÓN: findKey(['UBICACIÓN', 'UBICACION', 'LOCATION']),
            OBSERVACIÓN: findKey(['OBSERVACIÓN', 'OBSERVACION', 'REMARKS', 'NOTES'])
          };
        }).filter(item => item.TAGNAME && item.TAGNAME.toString().trim() !== '');

        if (formattedData.length === 0) {
          showNotification("No se encontraron instrumentos. Verifique la columna 'TAGNAME'.", 'error');
          return;
        }

        await loadInstrumentosBulk(formattedData);
        showNotification(`${formattedData.length} instrumentos cargados`);
      } catch (error: any) { 
        showNotification("Error leyendo el archivo: " + (error.message || 'Error desconocido'), 'error'); 
      } finally { 
        setIsProcessing(false); 
        if(fileInputRef.current) fileInputRef.current.value = ''; 
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        await saveLogo(reader.result as string);
        showNotification('Logo actualizado');
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
        <Database size={24} /> Base de Datos & Configuración
      </h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2">Logo del Formato</h3>
        {logoBase64 && (
          <div className="bg-gray-50 border p-2 rounded-lg inline-block w-full max-w-[200px] h-[80px] flex items-center justify-center">
            <img src={logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
          </div>
        )}
        <p className="text-sm text-gray-500">Este logo aparecerá en el encabezado de los reportes PDF y Excel.</p>
        <input type="file" accept="image/*" className="hidden" ref={logoInputRef} onChange={handleLogoUpload} />
        <Button onClick={() => logoInputRef.current?.click()} icon={ImageIcon} variant="secondary">
          {logoBase64 ? 'Cambiar Logo' : 'Subir Logo'}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 text-left flex items-center gap-2">
          <Database size={18} className="text-blue-500" /> Listado Maestro de TAGs
        </h3>
        <p className="text-sm text-gray-500 text-left">Sube el archivo Excel o CSV con el listado de TAGs de instrumentación.</p>
        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={processFile} />
        <Button onClick={() => fileInputRef.current?.click()} icon={FileSpreadsheet} disabled={isProcessing} className="w-full">
          {isProcessing ? 'Procesando...' : 'Cargar Base de Datos'}
        </Button>
      </div>

      {/* Seccion de Fotos masivas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4 text-left">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2">
          <CloudUpload size={18} className="text-blue-500" /> Carpeta de Fotos Masivas (Google Drive)
        </h3>
        <div className="text-xs text-gray-500 leading-relaxed bg-blue-50 p-3 rounded-lg border border-blue-100 italic">
          <strong>Nota Explicativa:</strong> Pega aquí el link de tu carpeta pública de Google Drive donde almacenarás las fotos masivas.
          <br /><br />
          Para su reconocimiento automático:
          <ul className="list-disc pl-4 mt-1">
            <li>Nombra las fotos directamente con el TAG y un consecutivo (ej. <code>TE-01-1.jpg</code>, <code>TE-01(2).jpg</code>).</li>
            <li>O agrúpalas en subcarpetas que tengan como nombre exactamente el TAG (ej. Carpeta <code>TE-01</code>).</li>
          </ul>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#1F3864]">Enlace de la carpeta de Drive:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="https://drive.google.com/drive/folders/..." 
              className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              defaultValue={useAppStore.getState().driveFolderLink || ''}
              onChange={(e) => {
                const val = e.target.value;
                useAppStore.getState().saveDriveFolderLink(val);
              }}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 text-left flex items-center gap-2">
          <Trash2 size={18} className="text-red-500" /> Limpieza de Datos Individual
        </h3>
        <p className="text-sm text-gray-500 text-left">Borra tablas específicas si necesitas reiniciar solo una parte de la aplicación.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button 
            onClick={handleClearInstrumentos} 
            variant={confirmStep === 'instrumentos' ? 'danger' : 'secondary'} 
            className={`flex-1 transition-all ${confirmStep === 'instrumentos' ? '!bg-red-500 !text-white' : '!bg-amber-50 !text-amber-700 !border-amber-200 hover:!bg-amber-100'}`}
            icon={Database}
            disabled={isClearing}
          >
            {confirmStep === 'instrumentos' ? '¿Confirmar Borrado?' : 'Limpiar Instrumentos'}
          </Button>
          <Button 
            onClick={handleClearFotos} 
            variant={confirmStep === 'fotos' ? 'danger' : 'secondary'} 
            className={`flex-1 transition-all ${confirmStep === 'fotos' ? '!bg-red-500 !text-white' : '!bg-orange-50 !text-orange-700 !border-orange-200 hover:!bg-orange-100'}`}
            icon={ImageIcon}
            disabled={isClearing}
          >
            {confirmStep === 'fotos' ? '¿Confirmar Borrado?' : 'Limpiar Fotos'}
          </Button>
          <Button 
            onClick={handleClearPerfiles} 
            variant={confirmStep === 'perfiles' ? 'danger' : 'secondary'} 
            className={`flex-1 transition-all col-span-full ${confirmStep === 'perfiles' ? '!bg-red-500 !text-white' : '!bg-blue-50 !text-blue-700 !border-blue-200 hover:!bg-blue-100'}`}
            icon={FileSpreadsheet}
            disabled={isClearing}
          >
            {confirmStep === 'perfiles' ? '¿Confirmar Borrado de Perfiles?' : 'Limpiar Todos los Perfiles'}
          </Button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 uppercase tracking-tighter text-red-600">Peligro: Acción Crítica</h3>
        <p className="text-sm text-gray-500">Esta opción borrará ABSOLUTAMENTE TODO y dejará la aplicación como nueva.</p>
        <Button 
          onClick={handleTotalReset} 
          variant="secondary" 
          className={`w-full shadow-lg transition-all ${confirmStep === 'total' ? '!bg-red-800 animate-pulse' : '!bg-red-600'} !text-white hover:!bg-red-700`}
          icon={Trash2}
          disabled={isClearing}
        >
          {isClearing ? 'Reiniciando...' : (confirmStep === 'total' ? '¡CLIC OTRA VEZ PARA BORRADO TOTAL!' : 'FÁBRICA: BORRADO TOTAL')}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center space-y-4">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2">Respaldar en la Nube (Supabase)</h3>
        <p className="text-sm text-gray-500">Sincroniza tus datos locales con la base de datos remota para compartirlos con otros usuarios o recuperarlos si cambias de equipo.</p>
        <Button onClick={handleSync} icon={CloudUpload} variant="secondary" disabled={isSyncing}>
          {isSyncing ? 'Sincronizando...' : 'Sincronizar Datos'}
        </Button>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2">
          <Shield size={20} className="text-blue-500" /> Control de Accesos (Roles)
        </h3>
        <p className="text-xs text-gray-500 italic">Habilita o deshabilita secciones para cada tipo de usuario.</p>
        
        {(['TECNICO', 'INVITADO'] as UserRole[]).map(role => (
          <div key={role} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <span className="font-bold text-xs uppercase tracking-widest text-[#1F3864]">Perfil: {role}</span>
              <Shield size={14} className="text-gray-400" />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
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
                        : 'bg-white border-gray-100 text-gray-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      <span>{sectionLabels[key]}</span>
                    </div>
                    {isEnabled ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#1F3864] text-white p-6 rounded-xl shadow-lg flex items-center justify-between mb-2">
        <div>
          <p className="text-xs text-blue-200 font-semibold tracking-wider uppercase">Total Instrumentos Cargados</p>
          <p className="text-4xl font-bold">{instrumentos.length}</p>
        </div>
        <Database className="text-blue-800 opacity-50" size={48} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <button 
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          onClick={() => setShowInstruments(!showInstruments)}
        >
          <div className="flex items-center gap-2 font-bold text-[#1F3864]">
            <FileSpreadsheet size={18} className="text-green-600" />
            <span>Ver Listado Maestro ({instrumentos.length})</span>
          </div>
          <motion.div animate={{ rotate: showInstruments ? 180 : 0 }}>
            <CloudUpload size={18} className="text-gray-400" />
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
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 border-b">TAGNAME</th>
                      <th className="px-4 py-2 border-b">Descripción</th>
                      <th className="px-4 py-2 border-b">Ubicación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {instrumentos.length > 0 ? (
                      instrumentos.map((inst, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                          <td className="px-4 py-2 font-mono font-bold text-blue-700">{inst.TAGNAME}</td>
                          <td className="px-4 py-2 text-gray-600 truncate max-w-[150px]">{inst.DESCRIPCIÓN}</td>
                          <td className="px-4 py-2 text-gray-400 italic">{inst.UBICACIÓN}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-10 text-center text-gray-400 italic">No hay instrumentos cargados.</td>
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
  );
};
