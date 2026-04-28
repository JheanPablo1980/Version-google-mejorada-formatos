import React from 'react';
import { LogIn, ShieldAlert, Users, Info, ChevronRight, FileText, Camera, Database, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion } from 'motion/react';
import { isSupabaseConfigured } from '../lib/supabase';

const FeatureCard = ({ icon, title, description, delay }: any) => (
// ... existing FeatureCard ...
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all group"
  >
    <div className="bg-slate-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-3">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">
      {description}
    </p>
  </motion.div>
);

const CapabilityItem = ({ title, text }: any) => (
  <div className="flex gap-4">
    <div className="mt-1 bg-blue-100 p-1 rounded-full h-fit">
      <div className="bg-blue-600 w-2 h-2 rounded-full"></div>
    </div>
    <div>
      <h4 className="font-bold text-slate-800 text-base">{title}</h4>
      <p className="text-slate-500 text-sm font-medium">{text}</p>
    </div>
  </div>
);

const DevLoginButton = ({ onClick, icon, title, bg }: any) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition-all text-left w-full group"
  >
    <div className={`${bg} p-2 rounded-lg`}>
      {icon}
    </div>
    <span className="text-xs font-bold text-slate-700 flex-1">{title}</span>
    <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
  </button>
);

export const Login: React.FC = () => {
  const { signIn, devLogin } = useAppStore();
  
  const isInAppBrowser = /FBAN|FBAV|Instagram|WhatsApp|Messenger/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-slate-900 font-sans selection:bg-blue-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#1F3864] text-white">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-600/10 skew-x-12 transform translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-400/5 -skew-x-12 transform -translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">
          <motion.div 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center space-y-6"
          >
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/20 shadow-2xl mb-4">
              <FileText size={48} className="text-blue-300" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-tight">
                Protocolos <span className="text-blue-300">I&C</span>
              </h1>
              <p className="text-blue-200/80 font-bold tracking-widest text-xs md:text-sm uppercase">
                Digitalización de Gestión de Activos • Smurfit Westrock
              </p>
            </div>
            <p className="max-w-2xl text-lg text-blue-100/70 leading-relaxed font-medium">
              Plataforma avanzada para el registro fotográfico técnica, gestión de perfiles de inspección 
              y generación automatizada de protocolos de instrumentación en alta resolución.
            </p>
            
            <div className="pt-8 space-y-4 w-full max-w-md">
              {!isSupabaseConfigured && (
                <div className="bg-red-500/20 border border-red-500/50 p-4 rounded-2xl flex items-start gap-3 text-left">
                  <ShieldAlert className="text-red-300 shrink-0 mt-0.5" size={20} />
                  <div className="space-y-1">
                    <p className="text-red-100 font-bold text-xs uppercase tracking-wider">Configuración Pendiente</p>
                    <p className="text-red-200/80 text-[10px] leading-relaxed">
                      La app aún no detecta tus llaves de Supabase. Asegúrate de guardarlas en el panel de <b>Secrets</b> y refrescar la página.
                    </p>
                  </div>
                </div>
              )}

              {isInAppBrowser && (
                <div className="bg-amber-500/20 border border-amber-500/50 p-4 rounded-2xl flex items-start gap-3 text-left">
                  <Info className="text-amber-300 shrink-0 mt-0.5" size={20} />
                  <div className="space-y-1">
                    <p className="text-amber-100 font-bold text-xs uppercase tracking-wider">Navegador Limitado</p>
                    <p className="text-amber-200/80 text-[10px] leading-relaxed">
                      Si el login falla, toca los tres puntos y selecciona <b>"Abrir en Chrome"</b> o <b>"Abrir en Safari"</b> para una mejor experiencia.
                    </p>
                  </div>
                </div>
              )}

              {/* Panel de Ayuda para el Maestro */}
              {isSupabaseConfigured && (
                <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl space-y-3 text-left">
                  <div className="flex items-start gap-3">
                    <Info className="text-blue-300 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <p className="text-blue-100 font-bold text-[10px] uppercase tracking-wider">Configuración de Retorno</p>
                      <p className="text-blue-200/60 text-[9px] leading-tight italic">
                        Copia esta URL y pégala en <b>ambos campos</b> (Site URL y Redirect URLs) dentro de Supabase {'>'} Auth {'>'} URL Configuration:
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1.5 flex flex-col">
                      <span className="text-[7px] text-blue-400 font-bold uppercase mb-0.5">URL para Site URL y Redirect URLs</span>
                      <input 
                        readOnly 
                        value={window.location.origin} 
                        className="bg-transparent text-[9px] text-blue-100 w-full font-mono focus:outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const url = window.location.origin;
                        navigator.clipboard.writeText(url);
                        alert('URL Copiada: ' + url + '\n\nPégala en Site URL y Redirect URLs en Supabase.');
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-3 py-2 rounded-lg font-bold transition-all shadow-lg active:scale-95"
                    >
                      COPIAR
                    </button>
                  </div>
                  
                  <div className="pt-2">
                    <button 
                      onClick={() => devLogin('ADMIN')}
                      className="w-full text-blue-400/50 hover:text-blue-400 text-[8px] uppercase tracking-widest transition-colors font-bold"
                    >
                      ¿Problemas con el login? Entrar como Maestro
                    </button>
                  </div>
                  
                  <p className="text-[8px] text-blue-300/50 text-center">
                    * Nota: En Supabase, Site URL y Redirect URLs deben ser IGUALES.
                  </p>
                </div>
              )}
              
              <button
                onClick={signIn}
                disabled={!isSupabaseConfigured}
                className={`w-full px-8 py-4 rounded-2xl font-black text-lg shadow-[0_10px_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_15px_50px_-10px_rgba(255,255,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group ${
                  !isSupabaseConfigured ? 'bg-white/20 text-white/40 cursor-not-allowed border border-white/10' : 'bg-white text-[#1F3864]'
                }`}
              >
                <div className={`p-1.5 rounded-full ${!isSupabaseConfigured ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <img src="https://www.google.com/favicon.ico" alt="Google" className={`w-5 h-5 ${!isSupabaseConfigured ? 'grayscale opacity-50' : ''}`} />
                </div>
                Entrar con Google
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Camera size={24} />}
            title="Registro Fotográfico"
            description="Captura evidencias técnicas en campo directamente desde tu dispositivo con geolocalización y marcas temporales."
            delay={0.1}
          />
          <FeatureCard 
            icon={<Database size={24} />}
            title="Gestión de Perfiles"
            description="Base de datos centralizada de instrumentos con perfiles dinámicos adaptados a normativas internacionales."
            delay={0.2}
          />
          <FeatureCard 
            icon={<Download size={24} />}
            title="Reportes PDF/Excel"
            description="Exportación inteligente de protocolos industriales con firmas digitales y sincronización en la nube (Supabase)."
            delay={0.3}
          />
        </div>

        {/* Presentation Section */}
        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-gray-100">
          <div className="space-y-8">
            <div className="space-y-4">
              <span className="bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Capacidades Clave
              </span>
              <h2 className="text-3xl font-bold text-slate-800 leading-tight">
                Eficiencia Operativa en el <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Corazón de la Industria</span>
              </h2>
            </div>
            
            <div className="space-y-6">
              <CapabilityItem 
                title="Sincronización Multi-Usuario" 
                text="Trabaja en equipo con acceso diferenciado para administradores, técnicos e invitados."
              />
              <CapabilityItem 
                title="Historial de Exportaciones" 
                text="Mantén un control total sobre quién, cuándo y qué reportes se generan para auditorías."
              />
              <CapabilityItem 
                title="Modo Desconectado (PWA)" 
                text="Captura datos e imágenes sin conexión a internet; sincroniza automáticamente al recuperar señal."
              />
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 space-y-6">
            <h3 className="text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
              <Info size={14} className="text-blue-500" /> Acceso para Soporte y Pruebas
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <DevLoginButton 
                onClick={() => devLogin('ADMIN')} 
                icon={<ShieldAlert size={18} className="text-red-500" />}
                title="Admin Demo"
                bg="bg-red-50"
              />
              <DevLoginButton 
                onClick={() => devLogin('TECNICO')} 
                icon={<Users size={18} className="text-blue-600" />}
                title="Técnico Demo"
                bg="bg-blue-50"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-center font-medium italic">
              * El acceso vía Google asignará automáticamente el rol correspondiente.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-center pb-10 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
        &copy; 2026 Smurfit Westrock • Excellence in Instrumentation
      </footer>
    </div>
  );
};

