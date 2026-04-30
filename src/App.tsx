import { useEffect, useState } from 'react';
import { Database, Plus, Camera, FileText, Download, History, LogOut, User as UserIcon, Image } from 'lucide-react';
import { useAppStore, UserRole } from './store/useAppStore';
import { Admin } from './components/Admin';
import { NuevoRegistro } from './components/NuevoRegistro';
import { RegistroFotos } from './components/RegistroFotos';
import { ListaPerfiles } from './components/ListaPerfiles';
import { VistaGenerar } from './components/VistaGenerar';
import { Historial } from './components/Historial';
import { GaleriaFotos } from './components/GaleriaFotos';
import { Login } from './components/Login';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'admin' | 'nuevo' | 'fotos' | 'galeria' | 'perfiles' | 'generar' | 'historial';

export default function App() {
  const { session, signOut, loadData, rolePermissions } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('perfiles');

  useEffect(() => { 
    loadData().catch(err => console.error('Error loading data:', err)); 
  }, [loadData]);

  // Session check removed to allow direct access mode
  const permissions = session ? (rolePermissions[session.role as UserRole] || rolePermissions.INVITADO) : rolePermissions.ADMIN;

  const navigation: { id: Tab; icon: any; label: string; roles: string[] }[] = [
    { id: 'admin', icon: Database, label: 'Admin', roles: ['ADMIN'] },
    { id: 'nuevo', icon: Database, label: 'BD', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'fotos', icon: Camera, label: 'Cámara', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'galeria', icon: Image, label: 'Fotos', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'perfiles', icon: FileText, label: 'Perfiles', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'historial', icon: History, label: 'Historial', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'generar', icon: Download, label: 'Exportar', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
  ];

  const filteredNav = navigation.filter(n => {
    // 1. Verificar si el rol tiene permiso para esta pestaña según la tabla de permisos
    const hasPermission = permissions[n.id as keyof typeof permissions];
    if (!hasPermission) return false;

    // 2. Restricción adicional por correo solo para Historial (Maestro)
    if (n.id === 'historial' && session.user.email !== '3usajanpapo6@gmail.com') {
      return false;
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F3F6FA] font-sans selection:bg-blue-200 text-slate-900 overflow-x-hidden">
      <header className="bg-[#1F3864] text-white p-3 sm:p-4 shadow-lg sticky top-0 z-40 flex justify-between items-center transition-all">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white/10 p-1.5 sm:p-2 rounded-lg backdrop-blur">
            <FileText size={18} className="text-blue-200" />
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base leading-tight tracking-tight uppercase">Protocolos I&C</h1>
            <span className="text-[8px] sm:text-[10px] text-blue-300 font-bold tracking-widest uppercase opacity-80">Smurfit Westrock</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden xs:flex flex-col items-end">
            <span className="text-[9px] font-bold text-blue-200 uppercase tracking-tighter">Rol: {session.role}</span>
            <span className="text-[8px] text-white/60 truncate max-w-[80px] sm:max-w-[150px]">{session.user.email}</span>
          </div>
          <button 
            onClick={signOut}
            className="p-2 bg-white/10 hover:bg-red-500/20 hover:text-red-300 rounded-full transition-all border border-white/5 active:scale-95"
            title="Cerrar Sesión"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="pb-20 sm:pb-24 max-w-7xl mx-auto min-h-[calc(100vh-60px)] px-2 sm:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {activeTab === 'admin' && <Admin />}
            {activeTab === 'nuevo' && <NuevoRegistro />}
            {activeTab === 'fotos' && <RegistroFotos />}
            {activeTab === 'galeria' && <GaleriaFotos />}
            {activeTab === 'perfiles' && <ListaPerfiles />}
            {activeTab === 'historial' && <Historial />}
            {activeTab === 'generar' && <VistaGenerar />}
            
            {/* Fallback de seguridad para pestañas protegidas */}
            {activeTab === 'historial' && session.user.email !== '3usajanpapo6@gmail.com' && (
              <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                <Database size={48} className="text-red-200" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-800 uppercase">Acceso Restringido</h3>
                  <p className="text-sm text-slate-500 max-w-xs">El historial está reservado exclusivamente para el Administrador Maestro.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)] z-50 transition-all">
        <div className="max-w-2xl mx-auto flex justify-between items-center px-1 sm:px-2 py-0.5">
          {filteredNav.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button 
                key={id}
                onClick={() => setActiveTab(id)}
                className={`group flex-1 py-2 sm:py-3 flex flex-col items-center justify-center gap-1 transition-all relative min-w-0 ${
                  isActive ? 'text-[#1F3864]' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-bg"
                    className="absolute -top-[1px] w-8 sm:w-12 h-1 bg-[#1F3864] rounded-full"
                  />
                )}
                <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-active:scale-90'}`}>
                  <Icon size={isActive ? 22 : 19} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                </div>
                <span className={`text-[7px] sm:text-[9px] font-bold uppercase tracking-tighter sm:tracking-widest transition-opacity truncate w-full text-center px-1 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/95"></div>
      </nav>
    </div>
  );
}
