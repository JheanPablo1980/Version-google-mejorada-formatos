import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  HelpCircle, 
  CheckCircle2, 
  LayoutDashboard, 
  Database, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  History, 
  Download,
  Info
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

type Tab = 'admin' | 'nuevo' | 'fotos' | 'galeria' | 'perfiles' | 'generar' | 'historial' | 'dashboard';

interface Step {
  id: string;
  tab?: Tab;
  title: string;
  description: string;
  icon: any;
  highlightText?: string;
  badge?: string;
}

interface OnboardingTourProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  filteredNavIds: Set<Tab>;
}

export function OnboardingTour({ activeTab, setActiveTab, filteredNavIds }: OnboardingTourProps) {
  const { session } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasSeenIntroBubble, setHasSeenIntroBubble] = useState(false);

  // Definir todos los pasos potenciales de la aplicación
  const allSteps: Step[] = [
    {
      id: 'bienvenida',
      title: '¡Bienvenido a Protocolos I&C!',
      description: 'Este asistente interactivo te guiará brevemente a través de las capacidades del sistema de aseguramiento de calidad y generación de protocolos para Smurfit Westrock.',
      icon: Sparkles,
      badge: 'Guía de Inicio',
      highlightText: 'Optimiza tus flujos en terreno y administración.'
    },
    {
      id: 'dashboard',
      tab: 'dashboard',
      title: 'Dashboard de Progreso',
      description: 'Aquí visualizas el avance total de las calibraciones de Instrumentos y Motores de Potencia en tiempo real. Monitorea estadísticas de cobertura, tags con fotos, tags cargados y tendencias de avance general de la obra.',
      icon: LayoutDashboard,
      badge: 'Panel Analítico',
      highlightText: 'Toma decisiones informadas con gráficos interactivos.'
    },
    {
      id: 'admin',
      tab: 'admin',
      title: 'Admin Master Base de Datos',
      description: 'La sección de control maestro. Desde aquí se cargan las bases de datos originales de Instrumentación y de Potencia directamente desde plantillas de Excel. También permite vaciar datos con un clic o gestionar usuarios y logs.',
      icon: Database,
      badge: 'Administración',
      highlightText: 'Sincroniza bases maestras de Excel instantáneamente.'
    },
    {
      id: 'nuevo',
      tab: 'nuevo',
      title: 'Base de Datos de Tags',
      description: 'Accede y administra las listas completas de tags. Busca por Tagname, tipo de cable o ubicación. Si hace falta, crea registros nuevos manualmente o edita descripciones específicas directamente en el sistema.',
      icon: Database,
      badge: 'Gestión BD',
      highlightText: 'Todo el inventario técnico al alcance de un filtro.'
    },
    {
      id: 'fotos',
      tab: 'fotos',
      title: 'Cámara y Carga de Evidencia',
      description: 'La herramienta crucial de terreno. Toma fotos o cárgalas desde tu dispositivo. Incluye la potente "Carga Masiva Automática", que analiza la galería de fotos, extrae el TAGNAME usando los nombres de archivo y asocia cada foto con su registro correspondiente de forma autónoma.',
      icon: Camera,
      badge: 'Herramienta de Campo',
      highlightText: 'Filtra por "Con Foto" o "Sin Foto" para auditar pendientes.'
    },
    {
      id: 'galeria',
      tab: 'galeria',
      title: 'Galería General de Fotos',
      description: 'Visualiza la totalidad de las fotos subidas. Busca imágenes de tags específicos, elude reprocesos ampliando fotos, comprueba marcas de agua digitales, elimina duplicados o descárgalas individualmente.',
      icon: ImageIcon,
      badge: 'Visualizador Galería',
      highlightText: 'La base visual de aseguramiento de calidad.'
    },
    {
      id: 'perfiles',
      tab: 'perfiles',
      title: 'Perfiles e Hojas de Calibración',
      description: 'Selecciona cualquier tag y configúrale su perfil específico: calibración de presión, temperatura, válvulas, lazos, o pruebas eléctricas de motores. Ingresa rangos de operación, marcas, sets de escala, puntos medidos e introduce firmas digitales en segundos.',
      icon: FileText,
      badge: 'Ingeniería & Calibración',
      highlightText: 'Diseña el protocolo técnico exacto para cada instrumento.'
    },
    {
      id: 'generar',
      tab: 'generar',
      title: 'Generación y Exportación Masiva',
      description: '¡El corazón automatizado del software! Agrupa múltiples instrumentos y descárgalos consolidados en un libro Excel formateado idéntico a las normas de entrega de Smurfit Westrock. Alternativamente, expórtalos a PDF y sincronízalos automáticamente en carpetas ordenadas de Google Drive.',
      icon: Download,
      badge: 'Motor de Salida',
      highlightText: 'Genera cientos de reportes firmados y listos en segundos.'
    },
    {
      id: 'historial',
      tab: 'historial',
      title: 'Historial Maestro de Acciones',
      description: 'Un registro de control exhaustivo para el Administrador Maestro (3usajanpapo6@gmail.com). Permite auditar qué tags se exportaron, cuántos conteos se descargaron y realizar análisis forense si es necesario.',
      icon: History,
      badge: 'Auditoría',
      highlightText: 'Seguridad y trazabilidad asegurada.'
    }
  ];

  // Filtrar los pasos y conservar únicamente los que el usuario actual posee acceso en pestañas
  const steps = allSteps.filter(step => {
    // El paso de bienvenida siempre se incluye
    if (step.id === 'bienvenida') return true;
    // Si requiere una pestaña específica, verificar si corresponde a las del usuario actual
    if (step.tab) return filteredNavIds.has(step.tab);
    return true;
  });

  // Efecto para sugerir la ayuda en primer ingreso
  useEffect(() => {
    const hasSeenTour = localStorage.getItem('ic-protocols-onboarding-v2');
    if (!hasSeenTour) {
      // Mostrar recordatorio de ayuda o abrir automáticamente
      const timer = setTimeout(() => {
        setHasSeenIntroBubble(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Al navegar por pasos de pestañas, cambiar activamente la pestaña en la app
  useEffect(() => {
    if (!isOpen) return;
    const currentStep = steps[currentStepIndex];
    if (currentStep && currentStep.tab && currentStep.tab !== activeTab) {
      setActiveTab(currentStep.tab);
    }
  }, [currentStepIndex, isOpen]);

  const handleStartTour = () => {
    setHasSeenIntroBubble(false);
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('ic-protocols-onboarding-v2', 'true');
    setIsOpen(false);
  };

  const handleSkip = () => {
    localStorage.setItem('ic-protocols-onboarding-v2', 'true');
    setIsOpen(false);
  };

  const activeStep = steps[currentStepIndex];
  const StepIcon = activeStep?.icon || Info;

  return (
    <>
      {/* Botón flotante o menú superior de guía interactiva */}
      <div className="fixed top-14 right-4 z-40">
        <div className="relative">
          <button
            onClick={handleStartTour}
            id="btn-onboarding-tour-trigger"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F3864]/95 text-white rounded-full text-[10px] font-bold tracking-wider uppercase border border-blue-400/30 hover:bg-blue-800 transition-all shadow-lg select-none cursor-pointer"
          >
            <Sparkles size={11} className="text-yellow-400 fill-yellow-400 animate-pulse" />
            <span>Guía de Uso</span>
          </button>

          {/* Burbuja informativa inicial animada */}
          <AnimatePresence>
            {hasSeenIntroBubble && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute right-0 top-10 w-64 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-150 p-4 z-50 text-left"
              >
                <div className="absolute top-2 right-2">
                  <button 
                    onClick={() => {
                      setHasSeenIntroBubble(false);
                      localStorage.setItem('ic-protocols-onboarding-v2', 'true');
                    }}
                    className="p-1 hover:bg-slate-100 rounded-full text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-blue-50 text-[#1F3864] rounded-lg shrink-0 mt-0.5">
                    <Sparkles size={14} className="text-blue-600 fill-blue-100" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-[#1F3864] tracking-wider">¿Primera vez aquí?</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      Inicia una guía interactiva sobre el sistema para dominar el llenado de fotos y exportación.
                    </p>
                    <button
                      onClick={handleStartTour}
                      className="mt-2.5 w-full py-1 text-[9px] font-black text-center bg-[#1F3864] text-white rounded-lg uppercase tracking-wider hover:bg-blue-800 transition-all cursor-pointer"
                    >
                      Ver Guía de Inicio
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Backdrop y Modal del Onboarding */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
            {/* Fondo oscuro traslúcido */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black"
              onClick={handleSkip}
            />

            {/* Tarjeta de diálogo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-gray-100/50 flex flex-col z-50 text-left"
            >
              {/* Encabezado con degradado suave */}
              <div className="p-5 bg-gradient-to-r from-[#1F3864] to-blue-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                  <div className="bg-white/15 p-1.5 rounded-xl backdrop-blur-md">
                    <Sparkles size={16} className="text-yellow-300" />
                  </div>
                  <div>
                    <span className="text-[8px] bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase tracking-widest block w-max mb-0.5">
                      {activeStep.badge || 'Asistente'}
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider">Asistente Interactivo</h3>
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white/80 hover:text-white cursor-pointer"
                  title="Saltar Guía"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Barra de progreso */}
              <div className="w-full bg-slate-100 h-1 shrink-0">
                <motion.div
                  className="bg-blue-600 h-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((currentStepIndex + 1) / steps.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Contenido principal con transiciones de Framer Motion */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between min-h-[220px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 text-[#1F3864] rounded-2xl shrink-0">
                        <StepIcon size={25} className="stroke-[2.5]" />
                      </div>
                      <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                        {activeStep.title}
                      </h2>
                    </div>

                    <p className="text-slate-600 text-xs leading-relaxed">
                      {activeStep.description}
                    </p>

                    {activeStep.highlightText && (
                      <div className="p-3.5 bg-slate-50 border-l-4 border-blue-600 rounded-r-xl">
                        <p className="text-[11px] font-bold text-[#1F3864] italic">
                          💡 {activeStep.highlightText}
                        </p>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer con acciones */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
                {/* Paso actual */}
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Paso {currentStepIndex + 1} de {steps.length}
                </span>

                {/* Navegación */}
                <div className="flex items-center gap-2">
                  {currentStepIndex > 0 && (
                    <button
                      onClick={handlePrev}
                      className="px-3.5 py-2 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft size={14} className="stroke-[2.5]" />
                      Atrás
                    </button>
                  )}

                  {currentStepIndex === 0 && (
                    <button
                      onClick={handleSkip}
                      className="px-3.5 py-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 font-bold text-xs rounded-xl transition-all uppercase tracking-wider cursor-pointer"
                    >
                      Saltar
                    </button>
                  )}

                  <button
                    onClick={handleNext}
                    className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#1F3864] hover:from-blue-700 hover:to-slate-900 text-white font-extrabold text-xs rounded-xl transition-all uppercase tracking-widest shadow-md hover:shadow-blue-100 flex items-center gap-1 cursor-pointer"
                  >
                    <span>
                      {currentStepIndex === steps.length - 1 ? 'Entendido' : 'Siguiente'}
                    </span>
                    {currentStepIndex < steps.length - 1 ? (
                      <ChevronRight size={14} className="stroke-[3]" />
                    ) : (
                      <CheckCircle2 size={14} className="stroke-[3] text-green-300" />
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
