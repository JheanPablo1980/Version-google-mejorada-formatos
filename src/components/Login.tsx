import React, { useState } from 'react';
import { User, Lock, Shield, UserCog, LogIn } from 'lucide-react';
import { useAppStore, UserRole } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const [role, setRole] = useState<UserRole>('TECNICO');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAppStore((state) => state.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = login(role, role === 'ADMIN' ? password : undefined);
    if (!result.success) {
      setError(result.error || 'Acceso denegado');
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
          <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Acceso al Sistema</h1>
          <p className="text-blue-200 text-sm mt-2 opacity-80">Protocolos I&C - Smurfit Westrock</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Seleccionar Rol</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setRole('TECNICO'); setError(''); }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                  role === 'TECNICO' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <User size={24} />
                <span className="text-xs font-bold uppercase tracking-tighter">Técnico</span>
              </button>
              <button
                type="button"
                onClick={() => { setRole('ADMIN'); setError(''); }}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-2 ${
                  role === 'ADMIN' 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                }`}
              >
                <UserCog size={24} />
                <span className="text-xs font-bold uppercase tracking-tighter">Administrador</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {role === 'ADMIN' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Ingrese la clave"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                    autoFocus
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-red-500 text-[10px] font-bold uppercase bg-red-50 p-2 rounded-lg border border-red-100"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            className="w-full bg-[#1F3864] hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-95"
          >
            <LogIn size={20} />
            <span className="uppercase tracking-widest text-sm">Entrar</span>
          </button>
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
