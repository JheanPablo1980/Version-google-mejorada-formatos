import { useEffect, useState } from 'react';
import { Database, Plus, Camera, FileText, Download, History, LogOut, User as UserIcon, Image, LayoutDashboard, Zap, HelpCircle, Settings, Shield, BookOpen, Menu } from 'lucide-react';
import { useAppStore, UserRole } from './store/useAppStore';
import { Admin } from './components/Admin';
import { NuevoRegistro } from './components/NuevoRegistro';
import { RegistroFotos } from './components/RegistroFotos';
import { ListaPerfiles } from './components/ListaPerfiles';
import { VistaGenerar } from './components/VistaGenerar';
import { Historial } from './components/Historial';
import { GaleriaFotos } from './components/GaleriaFotos';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { motion, AnimatePresence } from 'motion/react';
import { InteractiveTour } from './components/InteractiveTour';
type Tab = 'admin' | 'nuevo' | 'fotos' | 'galeria' | 'perfiles' | 'generar' | 'historial' | 'dashboard';

export default function App() {
  const { session, signOut, loadData, rolePermissions, isInitialized, appSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState<Tab>('perfiles');
  const [showLearningBanner, setShowLearningBanner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => { 
    loadData().catch(err => console.error('Error loading data:', err)); 
  }, [loadData]);

  useEffect(() => {
    if (appSettings?.learningMode) {
      setShowLearningBanner(true);
      const timer = setTimeout(() => setShowLearningBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [appSettings?.learningMode]);


  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1F3864] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-bold text-[#1F3864] uppercase tracking-widest animate-pulse">Cargando Sistema...</p>
        </div>
      </div>
    );
  }

  // Permisos basados en la sesión activa o por defecto Invitado
  const permissions = session 
    ? (rolePermissions?.[session.role as UserRole] || rolePermissions?.INVITADO) 
    : rolePermissions?.INVITADO;

  const navigation: { id: Tab; icon: any; label: string; roles: string[] }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Panel', roles: ['ADMIN'] },
    { id: 'admin', icon: Settings, label: 'Config', roles: ['ADMIN'] },
    { id: 'nuevo', icon: Database, label: 'Registros', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'fotos', icon: Camera, label: 'Cámara', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'galeria', icon: Image, label: 'Fotos', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'perfiles', icon: FileText, label: 'Perfiles', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'historial', icon: History, label: 'Historial', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
    { id: 'generar', icon: Download, label: 'Exportar', roles: ['ADMIN', 'TECNICO', 'INVITADO'] },
  ];

  const filteredNav = navigation.filter(n => {
    // 1. Verificar si el rol tiene permiso para esta pestaña según la tabla de permisos
    if (!permissions) return false;
    const hasPermission = permissions[n.id as keyof typeof permissions];
    if (!hasPermission) return false;

    // 2. Restricción adicional por correo solo para Historial (Maestro)
    if (n.id === 'historial' && session?.user?.email !== '3usajanpapo6@gmail.com') {
      return false;
    }
    
    return true;
  });

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[var(--color-surface)] font-sans text-[var(--color-on-surface)] overflow-hidden">
      
      <AnimatePresence>
        {showLearningBanner && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border border-emerald-400 backdrop-blur-md"
          >
            <Shield size={18} />
            <span className="text-sm">Estás en Sesión de Aprendizaje</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[55] md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-[60] transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 w-[260px] flex-shrink-0 bg-[var(--color-primary-container)] text-[var(--color-on-primary)] flex flex-col h-full shadow-lg`}>
        <div className="h-16 flex items-center justify-start px-6 border-b border-white/10 shrink-0">
           <FileText size={24} className={`${appSettings?.learningMode ? 'text-emerald-200' : 'text-[var(--color-inverse-primary)]'}`} />
           <h1 className="ml-3 font-display-lg text-lg tracking-tight truncate">
              {appSettings?.learningMode ? 'Aprendizaje' : 'Protocolos'}
           </h1>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 px-2 space-y-1">
          {filteredNav.map(({ id, icon: Icon, label }) => {
            const isActive = activeTab === id;
            return (
              <button 
                id={`nav-${id}`}
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-start px-3 py-3 transition-all relative ${
                  isActive 
                    ? 'active-tab-curve text-[var(--color-primary)]' 
                    : 'rounded-xl text-[var(--color-on-primary-container)] hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="relative z-10 flex items-center justify-start gap-3 w-full">
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  <span className={`font-body-bold truncate ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                    {label}
                  </span>
                </div>
              </button>
            )
          })}
        </nav>
        
        <div className="shrink-0 p-4 border-t border-white/10">
           <button 
            onClick={signOut}
            className="w-full flex items-center justify-start px-3 py-3 rounded-xl transition-all text-[var(--color-error-container)] hover:bg-white/10"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
            <span className="ml-3 font-body-bold w-full text-left">Salir</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className={`${appSettings?.learningMode ? 'bg-emerald-700' : 'bg-white'} text-[var(--color-on-surface)] h-16 shrink-0 shadow-sm z-40 flex justify-between items-center px-4 md:px-8 border-b border-[var(--color-outline-variant)]`}>
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 -ml-2 text-[var(--color-on-surface)] hover:bg-black/5 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className={`font-headline-md ${appSettings?.learningMode ? 'text-white' : ''} truncate `}>
              {appSettings?.learningMode ? 'Sesión de Aprendizaje' : 'Panel de Control'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden xs:flex flex-col items-end">
              <span className={`font-status-micro ${appSettings?.learningMode ? 'text-emerald-200' : 'text-[var(--color-primary)]'}`}>Rol: {session.role}</span>
              <span className={`font-label-caps truncate max-w-[120px] ${appSettings?.learningMode ? 'text-white/80' : 'text-[var(--color-on-surface-variant)]'}`}>{session.user.email}</span>
            </div>
            <button 
              id="btn-interactive-tour"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('start-interactive-tour'));
              }}
              className="px-4 py-2 bg-[var(--color-tertiary-container)] text-[var(--color-on-tertiary)] hover:bg-[var(--color-tertiary)] rounded-full transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none shadow-sm cursor-pointer"
              title="Iniciar Guía Interactiva"
            >
              <Zap size={14} className="animate-pulse" />
              <span className="font-label-caps tracking-wider hidden sm:block">Guía</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[var(--color-surface)] p-4 md:p-[var(--spacing-margin-desktop)] custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              className="max-w-7xl mx-auto w-full h-full"
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {activeTab === 'admin' && <Admin />}
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'nuevo' && <NuevoRegistro />}
              {activeTab === 'fotos' && <RegistroFotos />}
              {activeTab === 'galeria' && <GaleriaFotos />}
              {activeTab === 'perfiles' && <ListaPerfiles />}
              {activeTab === 'historial' && <Historial />}
              {activeTab === 'generar' && <VistaGenerar />}
              
              {/* Fallback de seguridad para pestañas protegidas */}
              {activeTab === 'historial' && session.user.email !== '3usajanpapo6@gmail.com' && (
                <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                  <Database size={48} className="text-[var(--color-error)] opacity-50" />
                  <div className="space-y-1">
                    <h3 className="font-headline-md text-[var(--color-on-surface)]">Acceso Restringido</h3>
                    <p className="font-body-base text-[var(--color-on-surface-variant)] max-w-xs">El historial está reservado exclusivamente para el Administrador Maestro.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Guía Interactiva encima de todo */}
      <InteractiveTour activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
