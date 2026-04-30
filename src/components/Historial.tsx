import React, { useState, useMemo } from 'react';
import { History, User as UserIcon, Tag, Calendar, ChevronRight, ChevronDown, Image as ImageIcon, FileSpreadsheet, FileText as FilePdfIcon, Trash2 } from 'lucide-react';
import { useAppStore, Perfil, ExportLog } from '../store/useAppStore';
import { motion, AnimatePresence } from 'motion/react';

export const Historial: React.FC = () => {
  const { perfiles, fotos, exportLogs } = useAppStore();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'TAGS' | 'EXPORTACIONES'>('TAGS');
  const [expandedTags, setExpandedTags] = useState<string[]>([]);

  const toggleTag = (id: string) => {
    setExpandedTags(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  // Group data by user email
  const userHistory = useMemo(() => {
    const groups: Record<string, { perfiles: Perfil[], exports: ExportLog[] }> = {};
    
    perfiles.forEach(p => {
      const email = p.USER_EMAIL || 'Sin Usuario';
      if (!groups[email]) groups[email] = { perfiles: [], exports: [] };
      groups[email].perfiles.push(p);
    });

    exportLogs.forEach(log => {
      const email = log.user_email || 'Sin Usuario';
      if (!groups[email]) groups[email] = { perfiles: [], exports: [] };
      groups[email].exports.push(log);
    });

    // Sort
    Object.keys(groups).forEach(email => {
      groups[email].perfiles.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      groups[email].exports.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
    });

    return groups;
  }, [perfiles, exportLogs]);

  const usersList = Object.keys(userHistory).sort();

  // Helper to get photos for a tag
  const getPhotosForTag = (tag: string) => {
    return fotos.filter(f => f.TAGNAME === tag);
  };

  return (
    <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
        <History size={24} /> Historial de Actividad
      </h2>
      <p className="text-sm text-gray-500 mb-2">Traza los tags y protocolos realizados por el equipo, incluyendo evidencia fotográfica.</p>

      {!selectedUser ? (
        <div className="space-y-3">
          {usersList.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400">
              No hay actividad registrada aún.
            </div>
          ) : (
            usersList.map(email => (
              <motion.button
                key={email}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedUser(email)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-2.5 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <UserIcon size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#1F3864] text-sm truncate max-w-[200px] sm:max-w-md">{email}</p>
                    <div className="flex gap-2 mt-0.5">
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                        {userHistory[email].perfiles.length} Tags
                      </p>
                      <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                        {userHistory[email].exports.length} Exports
                      </p>
                    </div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
              </motion.button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setSelectedUser(null)}
              className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline uppercase tracking-widest"
            >
              &larr; Volver
            </button>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('TAGS')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'TAGS' ? 'bg-[#1F3864] text-white shadow-sm' : 'text-gray-500'}`}
              >
                Tags
              </button>
              <button 
                onClick={() => setViewMode('EXPORTACIONES')}
                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${viewMode === 'EXPORTACIONES' ? 'bg-[#1F3864] text-white shadow-sm' : 'text-gray-500'}`}
              >
                Actividad
              </button>
            </div>
          </div>
          
          <div className="bg-[#1F3864] text-white p-6 rounded-2xl shadow-lg mb-6 flex items-center gap-4">
             <div className="bg-white/20 p-3 rounded-xl border border-white/10 backdrop-blur">
                <UserIcon size={24} />
             </div>
             <div>
                <h3 className="font-bold text-lg leading-tight truncate max-w-[250px]">{selectedUser}</h3>
                <p className="text-xs text-blue-200 opacity-80 uppercase tracking-widest font-bold">Registro de actividad</p>
             </div>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="wait">
              {viewMode === 'TAGS' ? (
                <motion.div
                  key="tags-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {userHistory[selectedUser].perfiles.map((p, idx) => {
                    const itemPhotos = getPhotosForTag(p.TAGNAME);
                    const itemExports = userHistory[selectedUser].exports.filter(e => e.tagname === p.TAGNAME);
                    const isExpanded = expandedTags.includes(p.ID_PERFIL);
                    
                    return (
                      <motion.div
                        key={p.ID_PERFIL}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow"
                      >
                        <div 
                          className="p-5 border-b border-gray-50 cursor-pointer"
                          onClick={() => toggleTag(p.ID_PERFIL)}
                        >
                          <div className="absolute top-0 right-0 p-3">
                            <Tag size={16} className="text-blue-500/20" />
                          </div>
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                               <div className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight">
                                 {p.TAGNAME || 'SIN TAG'}
                               </div>
                               <span className="text-xs font-bold text-[#1F3864] truncate">
                                 {p.NOMBRE_PERFIL}
                               </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center gap-2 text-gray-500">
                                <Calendar size={14} />
                                <span className="text-[11px] font-medium">
                                  {p.timestamp ? new Date(p.timestamp).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-500">
                                <span className="text-[11px] font-medium italic truncate">
                                  "{p.ELABORO_NOMBRE || 'Anon'}"
                                </span>
                              </div>
                            </div>

                            <div className="text-[10px] text-gray-400 mt-1 flex justify-between items-center">
                               <span>ID: {p.ID_PERFIL.split('-')[0]}...</span>
                               <span className="font-bold uppercase text-blue-400/60">{p.UBICACION || 'Sin Ubicación'}</span>
                            </div>
                          </div>
                          <div className="absolute right-4 bottom-4 text-gray-300 group-hover:text-blue-500 transition-colors">
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </div>
                        </div>

                        {/* Collapsible Content */}
                        <AnimatePresence>
                          {isExpanded && ((itemPhotos.length > 0 || itemExports.length > 0) ? (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-50/50 p-4 border-t border-gray-100 flex flex-col gap-4 overflow-hidden"
                            >
                              {itemPhotos.length > 0 && (
                                <div>
                                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <ImageIcon size={10} /> Evidencia Fotográfica ({itemPhotos.length})
                                  </h4>
                                  <div className="grid grid-cols-4 gap-2">
                                    {itemPhotos.map((foto) => (
                                      <div key={foto.id} className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white">
                                        <img 
                                          src={foto.blobData} 
                                          alt="Evidencia" 
                                          className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                                          onClick={() => window.open(foto.blobData, '_blank')}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {itemExports.length > 0 && (
                                <div>
                                  <h4 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <FileSpreadsheet size={10} /> Exportaciones ({itemExports.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {itemExports.map(log => (
                                      <div key={log.id} className="bg-white p-2 rounded-lg border border-gray-100 flex justify-between items-center text-xs">
                                        <div className="flex gap-2 items-center">
                                          {log.tipo_formato === 'EXCEL' ? <FileSpreadsheet size={14} className="text-green-500" /> : 
                                           log.tipo_formato === 'DELETED' ? <Trash2 size={14} className="text-red-500" /> : <FilePdfIcon size={14} className="text-orange-500" />}
                                          <span className="font-bold text-[#1F3864]">
                                            {log.tipo_formato === 'DELETED' ? 'Eliminado' : 'Exportado'}
                                          </span>
                                        </div>
                                        <span className="text-[9px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          ) : (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-gray-50/50 p-4 border-t border-gray-100 overflow-hidden"
                            >
                              <div className="text-center text-[10px] text-gray-400">No hay fotos ni exportaciones para este perfil.</div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                  {userHistory[selectedUser].perfiles.length === 0 && (
                    <div className="text-center p-12 text-gray-400 text-sm">No hay tags registrados.</div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="exports-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {userHistory[selectedUser].exports.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group shadow-sm hover:border-gray-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg py-1.5 ${
                          log.tipo_formato === 'EXCEL' ? 'bg-green-50 text-green-600' : 
                          log.tipo_formato === 'DELETED' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                        }`}>
                          {log.tipo_formato === 'EXCEL' ? <FileSpreadsheet size={16} /> : 
                           log.tipo_formato === 'DELETED' ? <Trash2 size={16} /> : <FilePdfIcon size={16} />}
                        </div>
                        <div>
                           <p className="text-[11px] font-bold text-[#1F3864] uppercase tracking-tight">
                             {log.tipo_formato === 'DELETED' ? 'Eliminado: ' : 'Exportado: '} {log.tagname}
                           </p>
                           <p className="text-[9px] text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${
                        log.tipo_formato === 'DELETED' ? 'bg-red-50 border-red-100 text-red-400' : 'bg-gray-50 border-gray-100 text-gray-300'
                      }`}>
                        {log.tipo_formato}
                      </div>
                    </motion.div>
                  ))}
                  {userHistory[selectedUser].exports.length === 0 && (
                    <div className="text-center p-12 text-gray-400 text-sm">No hay registros de actividad aún.</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};
