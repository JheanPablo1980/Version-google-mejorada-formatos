import React, { useState } from 'react';
import { Mail, Lock, Shield, LogIn, UserPlus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginWithEmail, signUpWithEmail } = useAppStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor ingrese correo y clave');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const result = await signUpWithEmail(email, password);
        if (!result.success) {
          setError(result.error || 'Error al registrar tu cuenta.');
        } else if (result.error) {
          // This means "Success" but potentially needs email confirmation
          setError(result.error);
          setEmail('');
          setPassword('');
        } else {
          setEmail('');
          setPassword('');
        }
      } else {
        const result = await loginWithEmail(email, password);
        if (!result.success) {
          setError(result.error || 'Correo o contraseña incorrectos.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      >
        <div className="bg-[#1F3864] p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4 backdrop-blur-sm">
            <Shield className="text-blue-300" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
            {isSignUp ? 'Crear Cuenta' : 'Acceso al Sistema'}
          </h1>
          <p className="text-blue-200 text-sm mt-2 opacity-80">Protocolos I&C - Smurfit Westrock</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="usuario@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder={isSignUp ? "Al menos 6 caracteres" : "Ingrese su clave"}
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                  required
                />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="text-red-500 text-[10px] font-bold uppercase bg-red-50 p-2 rounded-lg border border-red-100"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-[#1F3864] hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}
            <span className="uppercase tracking-widest text-sm">
              {loading ? 'Procesando...' : (isSignUp ? 'Registrarse' : 'Entrar')}
            </span>
          </button>
          
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide transition-colors"
            >
              {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate aquí"}
            </button>
          </div>
        </form>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">
            Sistema de Gestión de Protocolos de Instrumentación
          </p>
        </div>
      </motion.div>
    </div>
  );
};
