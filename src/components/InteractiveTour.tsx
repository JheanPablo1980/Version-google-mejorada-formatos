import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Minimize2, 
  Maximize2, 
  CheckCircle, 
  HelpCircle, 
  Info, 
  Zap,
  Play
} from 'lucide-react';
import { useAppStore, UserRole } from '../store/useAppStore';

type Tab = 'admin' | 'nuevo' | 'fotos' | 'galeria' | 'perfiles' | 'generar' | 'historial' | 'dashboard';

interface InteractiveTourProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

interface TourStep {
  id: string;
  tab: Tab;
  title: string;
  content: string;
  targetId?: string;
  placement?: 'top' | 'bottom' | 'center';
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ activeTab, setActiveTab }) => {
  const { session, rolePermissions } = useAppStore();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number; width: number; height: number; padding: number } | null>(null);

  // Obtener permisos del rol activo del usuario
  const permissions = session 
    ? (rolePermissions?.[session.role as UserRole] || rolePermissions?.INVITADO) 
    : rolePermissions?.INVITADO;

  // Lista completa de navegación (id de pestañas que el usuario realmente puede ver)
  const navigationConfig: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Panel' },
    { id: 'admin', label: 'Admin/Importar' },
    { id: 'nuevo', label: 'Base de Datos' },
    { id: 'fotos', label: 'Cámara de Campo' },
    { id: 'galeria', label: 'Galería de Fotos' },
    { id: 'perfiles', label: 'Protocolos de Calibración' },
    { id: 'historial', label: 'Historial Maestro' },
    { id: 'generar', label: 'Exportación y Generación' },
  ];

  // Filtrar pestañas válidas según los permisos del usuario activo
  const filteredTabs = navigationConfig.filter(nav => {
    if (!permissions) return false;
    const hasPermission = permissions[nav.id as keyof typeof permissions];
    if (!hasPermission) return false;
    // Historial limitado a administrador principal
    if (nav.id === 'historial' && session?.user?.email !== '3usajanpapo6@gmail.com') {
      return false;
    }
    return true;
  });

  // Generar dinámicamente los pasos del tour basados en las secciones a las que el usuario tiene acceso real
  const getSteps = (): TourStep[] => {
    const stepsList: TourStep[] = [
      {
        id: 'welcome',
        tab: activeTab,
        title: '¡Bienvenido al Asistente de Protocolos I&C!',
        content: 'Este software optimiza y digitaliza los protocolos de calibración para instrumentación y potencia en Smurfit Westrock. Te enseñaremos cómo funciona cada sección en menos de un minuto.',
        placement: 'center'
      }
    ];

    filteredTabs.forEach((tabItem) => {
      if (tabItem.id === 'dashboard') {
        stepsList.push({
          id: 'dashboard',
          tab: 'dashboard',
          title: 'Panel y Métricas en Tiempo Real',
          content: 'En esta sección visualizas indicadores clave, gráficos de barra del historial de exportaciones para auditoría, y métricas consolidadas del sistema. Filtra cómodamente por rango de fechas o TAG.',
          targetId: 'nav-dashboard',
          placement: 'top'
        });
      }
      if (tabItem.id === 'admin') {
        stepsList.push({
          id: 'admin',
          tab: 'admin',
          title: 'Administración y Carga de Planillas',
          content: 'Exclusivo de administradores: Importa de forma masiva el listado maestro de instrumentos de Smurfit Westrock desde archivos Excel (.xlsx), sincroniza información y gestiona los registros iniciales.',
          targetId: 'nav-admin',
          placement: 'top'
        });
      }
      if (tabItem.id === 'nuevo') {
        stepsList.push({
          id: 'nuevo',
          tab: 'nuevo',
          title: 'Base de Datos de Instrumentos (BD)',
          content: 'Aquí administras la base técnica de cables y equipos. Puedes buscar por TAG, agregar nuevos dispositivos manualmente, editar cables como "2x18AWG" e ingresar rangos normativos.',
          targetId: 'nav-nuevo',
          placement: 'top'
        });
      }
      if (tabItem.id === 'fotos') {
        stepsList.push({
          id: 'fotos',
          tab: 'fotos',
          title: 'Capturar Fotografías en Campo',
          content: 'Vincula evidencias visuales a un TAG en tiempo real desde la tablet o smartphone en campo. Agrega observaciones a fotos de cajas de terminales, tags metálicos o cables de lazo.',
          targetId: 'nav-fotos',
          placement: 'top'
        });
      }
      if (tabItem.id === 'galeria') {
        stepsList.push({
          id: 'galeria',
          tab: 'galeria',
          title: 'Galería de Evidencias Técnicas',
          content: 'Explora de forma visual las imágenes de campo. Puedes hacer zoom sobre las fotos registradas de cada lazo, revisar observaciones del técnico y verificar su calidad.',
          targetId: 'nav-galeria',
          placement: 'top'
        });
      }
      if (tabItem.id === 'perfiles') {
        stepsList.push({
          id: 'perfiles',
          tab: 'perfiles',
          title: 'Formatos de Calibración y Protocolos',
          content: '¡La joya del sistema! Gestiona fichas técnicas de calibración para Instrumentación, Potencia (Precomisionamiento de Motores/Líneas) o Potencia (Comisionamiento de motores). Rellena mediciones, sube firmas digitales y guarda tu avance.',
          targetId: 'nav-perfiles',
          placement: 'top'
        });
      }
      if (tabItem.id === 'historial') {
        stepsList.push({
          id: 'historial',
          tab: 'historial',
          title: 'Historial de Auditoría',
          content: 'Exclusivo para la dirección: Rastrea de forma exhaustiva quién generó cada reporte, qué TAG se exportó, en qué fecha y qué tipo de formato se configuró.',
          targetId: 'nav-historial',
          placement: 'top'
        });
      }
      if (tabItem.id === 'generar') {
        stepsList.push({
          id: 'generar',
          tab: 'generar',
          title: 'Generación Masiva y Entrega de Carpeta',
          content: 'Exporta con formato idéntico al solicitado por Smurfit Westrock. Descarga el paquete masivo de protocolos en Excel (.xlsx) y un archivo comprimido corporativo .ZIP con todas las fotos debidamente ordenadas por TAG.',
          targetId: 'nav-generar',
          placement: 'top'
        });
      }
    });

    stepsList.push({
      id: 'complete',
      tab: 'perfiles', // Regresar a perfiles
      title: '¡Recorrido Completado!',
      content: 'Ya estás listo para operar el software con total seguridad. Recuerda que puedes volver a activar esta guía cuando lo necesites usando el botón de Luz "Zap" en la cabecera.',
      placement: 'center'
    });

    return stepsList;
  };

  const steps = getSteps();
  const currentStep = steps[currentStepIndex];

  // Iniciar automáticamente en la primera visita
  useEffect(() => {
    const isFirstTime = localStorage.getItem('swc-tour-completed') !== 'true';
    if (isFirstTime) {
      // Breve retraso para que todo cargue correctamente
      const t = setTimeout(() => {
        setIsActive(true);
        setCurrentStepIndex(0);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Escuchar el evento de inicio global
  useEffect(() => {
    const handleStartTour = () => {
      setIsActive(true);
      setCurrentStepIndex(0);
      setIsMinimized(false);
    };

    window.addEventListener('start-interactive-tour', handleStartTour);
    return () => {
      window.removeEventListener('start-interactive-tour', handleStartTour);
    };
  }, []);

  // Efecto para cambiar de pestaña al cambiar el paso
  useEffect(() => {
    if (isActive && currentStep && currentStep.id !== 'welcome' && currentStep.id !== 'complete') {
      if (activeTab !== currentStep.tab) {
        setActiveTab(currentStep.tab);
      }
    }
  }, [currentStepIndex, isActive]);

  // Calcular las coordenadas para el Spotlight
  useEffect(() => {
    if (!isActive || isMinimized || !currentStep?.targetId) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const element = document.getElementById(currentStep.targetId!);
      if (element) {
        // Asegurar que el elemento esté visible
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        const rect = element.getBoundingClientRect();
        setCoords({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
          padding: 8
        });
      } else {
        setCoords(null);
      }
    };

    // Pequeño timeout para permitir cambios de DOM de la pestaña
    const timer = setTimeout(updateCoords, 400);

    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [currentStepIndex, isActive, isMinimized, activeTab, currentStep]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('swc-tour-completed', 'true');
    setIsActive(false);
    setCoords(null);
  };

  const handleComplete = () => {
    localStorage.setItem('swc-tour-completed', 'true');
    setIsActive(false);
    setCoords(null);
  };

  if (!isActive) return null;

  return (
    <>
      {/* 1. Máscara de Fondo y Spotlight */}
      <AnimatePresence>
        {isActive && !isMinimized && currentStep?.targetId && coords && (
          <motion.svg 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 w-screen h-screen z-50 pointer-events-none transition-all duration-350"
          >
            <defs>
              <mask id="tour-spotlight-mask-svg">
                {/* Pantalla completa en opaca: conserva el fondo */}
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {/* Cuadro calado en negro: se hace transparente */}
                <rect
                  x={coords.x - coords.padding}
                  y={coords.y - coords.padding}
                  width={coords.width + coords.padding * 2}
                  height={coords.height + coords.padding * 2}
                  rx={8}
                  ry={8}
                  fill="black"
                  className="transition-all duration-300"
                />
              </mask>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(15, 23, 42, 0.45)"
              mask="url(#tour-spotlight-mask-svg)"
              className="pointer-events-auto"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* 2. Fondo completo para vistas generales sin spotlight (Ej: Welcome / Complete) */}
      <AnimatePresence>
        {isActive && !isMinimized && !currentStep?.targetId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F172A]/50 z-50 backdrop-blur-[2px] pointer-events-auto"
          />
        )}
      </AnimatePresence>

      {/* 3. Panel de la Guía Interactiva: Esquina superior derecha si está expandido, widget compacto abajo si está minimizado */}
      <div 
        className={
          isMinimized 
            ? "fixed right-4 bottom-24 sm:bottom-6 sm:right-6 flex justify-end z-[99] pointer-events-none max-w-[325px] w-full"
            : "fixed top-16 right-4 sm:top-[74px] sm:right-6 flex justify-end z-[99] p-2 pointer-events-none w-full max-w-[360px]"
        }
      >
        <AnimatePresence mode="wait">
          {!isMinimized ? (
            <motion.div
              layoutId="tour-panel"
              key="expanded"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className="w-full max-w-[360px] bg-white border border-slate-200/80 shadow-[0_15px_50px_rgba(15,23,42,0.22)] rounded-2xl p-5 pointer-events-auto flex flex-col gap-4 relative overflow-hidden"
            >
              {/* Adorno de cabecera sutil */}
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#1F3864]" />
              
              {/* Encabezado con el asistente */}
              <div className="flex justify-between items-start pb-2 border-b border-gray-100 mt-1">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-2 rounded-xl text-[#1F3864] shrink-0">
                    <Sparkles size={16} className="animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">Guía de Campo</span>
                    <h3 className="font-extrabold text-[#1F3864] uppercase text-xs tracking-tight truncate leading-tight mt-0.5">{currentStep?.title}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => setIsMinimized(true)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-all active:scale-95 flex items-center justify-center"
                    title="Minimizar (ver pantalla bajo el diálogo)"
                  >
                    <Minimize2 size={13} />
                  </button>
                  <button 
                    onClick={handleSkip}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded text-slate-400 transition-all active:scale-95 flex items-center justify-center"
                    title="Cerrar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Contenido principal del paso */}
              <div className="space-y-3">
                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                  {currentStep?.content}
                </p>

                {currentStep?.targetId && (
                  <div className="bg-blue-50/50 border border-blue-100/35 p-2 rounded-xl flex items-center gap-2 text-blue-700 text-[9px] font-extrabold uppercase tracking-wider">
                    <Info size={12} className="shrink-0 text-blue-500" />
                    <span>Botón destacado en el menú</span>
                  </div>
                )}
              </div>

              {/* Control de comandos inferiores */}
              <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-1">
                {/* Progreso en forma de paso numérico */}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest select-none">
                  {currentStepIndex + 1} / {steps.length}
                </span>

                {/* Botonera interna */}
                <div className="flex items-center gap-2">
                  {currentStepIndex > 0 ? (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 font-extrabold rounded-xl uppercase transition-all tracking-wider active:scale-95"
                    >
                      <ChevronLeft size={13} />
                      Atrás
                    </button>
                  ) : (
                    <button
                      onClick={handleSkip}
                      className="px-2.5 py-1.5 hover:bg-slate-50 text-xs text-slate-500 font-extrabold rounded-xl uppercase transition-all tracking-wider active:scale-95 text-center mr-0.5"
                    >
                      Omitir
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-[#1F3864] hover:bg-[#152748] text-white text-xs font-black rounded-xl uppercase transition-all tracking-wider shadow-sm active:scale-95"
                  >
                    {currentStepIndex === steps.length - 1 ? (
                      <>
                        Listo
                        <CheckCircle size={13} />
                      </>
                    ) : (
                      <>
                        Siguiente
                        <ChevronRight size={13} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Guía contraída / Widget de Asistente flotando en esquina inferior derecha */
            <motion.div
              layoutId="tour-panel"
              key="collapsed"
              initial={{ opacity: 0, scale: 0.8, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 15 }}
              onClick={() => setIsMinimized(false)}
              className="bg-[#1F3864] hover:bg-[#152748] border border-white/10 shadow-[0_4px_15px_rgba(31,56,100,0.25)] rounded-full py-1.5 px-3 pointer-events-auto flex items-center gap-2 cursor-pointer transition-all duration-300 active:scale-95 group text-white hover:text-yellow-200"
            >
              <div className="bg-yellow-400 text-slate-400 p-0.5 rounded-full animate-bounce shrink-0">
                <Zap size={11} fill="currentColor" className="text-slate-900" />
              </div>
              <div className="flex flex-col text-left leading-none min-w-0 max-w-[135px]">
                <span className="text-[6.5px] text-blue-200 uppercase font-black tracking-widest truncate">Guía {currentStepIndex + 1}/{steps.length}</span>
                <span className="text-[9px] font-extrabold uppercase tracking-tight text-white block mt-0.5 truncate">
                  {currentStep?.title || 'Recorrido'}
                </span>
              </div>
              <div className="bg-white/10 p-0.5 rounded text-white/55 group-hover:bg-white/20 group-hover:text-white transition-all shrink-0">
                <Maximize2 size={10} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
