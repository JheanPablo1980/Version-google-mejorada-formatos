import React, { useState, useMemo } from 'react';
import { Database, Save, Trash2, Search, Filter, X, ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { InputGroup } from './ui/InputGroup';

export const NuevoRegistro: React.FC = () => {
  const { addInstrumento, instrumentos, deleteInstrumentos } = useAppStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroUbicacion, setFiltroUbicacion] = useState('');
  const [filtroTipoCable, setFiltroTipoCable] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [formData, setFormData] = useState({
    TAG_CABLE_SWC: '',
    TAGNAME: '',
    DESCRIPCIÓN: '',
    TIPO_CABLE: '',
    UBICACIÓN: '',
    OBSERVACIÓN: ''
  });

  const ubicacionesUnicas = useMemo(() => {
    const u = new Set(instrumentos.map(i => i.UBICACIÓN).filter(Boolean));
    return Array.from(u).sort();
  }, [instrumentos]);

  const tiposCableUnicos = useMemo(() => {
    const t = new Set(instrumentos.map(i => i.TIPO_CABLE).filter(Boolean));
    return Array.from(t).sort();
  }, [instrumentos]);

  const filteredInstrumentos = useMemo(() => {
    const filtered = instrumentos.filter(inst => {
      const matchesSearch = inst.TAGNAME.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (inst.DESCRIPCIÓN || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUbicacion = filtroUbicacion ? inst.UBICACIÓN === filtroUbicacion : true;
      const matchesTipo = filtroTipoCable ? inst.TIPO_CABLE === filtroTipoCable : true;
      
      return matchesSearch && matchesUbicacion && matchesTipo;
    });

    return filtered.sort((a, b) => {
      const cmp = a.TAGNAME.localeCompare(b.TAGNAME);
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [instrumentos, searchQuery, filtroUbicacion, filtroTipoCable, sortOrder]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TAGNAME.trim()) {
      setStatusMsg({ type: 'error', text: "El TAGNAME es obligatorio para registrar el instrumento." });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    const nuevoInst = { ...formData, TAGNAME: formData.TAGNAME.trim().toUpperCase() };
    const result = await addInstrumento(nuevoInst as any);
    
    setIsSaving(false);

    if (result.success) {
      setStatusMsg({ type: 'success', text: `Instrumento ${nuevoInst.TAGNAME} agregado y sincronizado con éxito.` });
      setFormData({ 
        TAG_CABLE_SWC: '', 
        TAGNAME: '', 
        DESCRIPCIÓN: '', 
        TIPO_CABLE: '', 
        UBICACIÓN: '', 
        OBSERVACIÓN: '' 
      });
    } else {
      setStatusMsg({ type: 'error', text: result.error || "Error al guardar el instrumento." });
    }
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const confirmDeleteAction = async () => {
    setShowConfirmDelete(false);
    setIsDeleting(true);
    const result = await deleteInstrumentos(selectedTags);
    setIsDeleting(false);

    if (result.success) {
      setStatusMsg({ type: 'success', text: `Se eliminaron ${selectedTags.length} registro(s) con éxito.` });
      setSelectedTags([]);
    } else {
      setStatusMsg({ type: 'error', text: result.error || "Error al eliminar registros." });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedTags.length === 0) return;
    setShowConfirmDelete(true);
  };

  return (
    <div className="p-4 space-y-6 max-w-5xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2 border-b pb-4">
        <Database size={24} className="text-blue-600" /> Base de Datos de Instrumentos
      </h2>
      
      {statusMsg && (
        <div className={`p-4 rounded-xl text-sm font-medium border flex items-center justify-between ${
          statusMsg.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div>
            {statusMsg.text}
            {statusMsg.type === 'error' && (
              <p className="mt-1 italic opacity-80 text-xs">Nota: Revisa la conexión a Supabase si es un error de sincronización.</p>
            )}
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-lg font-bold opacity-60 hover:opacity-100">&times;</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-6">
        
        {/* LADO IZQUIERDO: FORMULARIO */}
        <div className="space-y-4">
          <div>
            <h3 className="font-bold text-[#1F3864] text-lg">Nuevo Registro</h3>
            <p className="text-xs text-gray-500 mb-2">Añadir instrumento manualmente a la BD.</p>
          </div>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-3">
              <InputGroup 
                label="TAGNAME (Obligatorio)" 
                name="TAGNAME" 
                value={formData.TAGNAME} 
                onChange={handleChange} 
                required 
                placeholder="Ej: PT-101" 
                disabled={isSaving || isDeleting}
              />
              <InputGroup 
                label="TAG CABLE SWC" 
                name="TAG_CABLE_SWC" 
                value={formData.TAG_CABLE_SWC} 
                onChange={handleChange} 
                placeholder="Ej: VBCON5-0001"
                disabled={isSaving || isDeleting}
              />
              <InputGroup 
                label="Descripción" 
                name="DESCRIPCIÓN" 
                value={formData.DESCRIPCIÓN} 
                onChange={handleChange} 
                placeholder="Ej: SENSOR DE PRESIÓN" 
                disabled={isSaving || isDeleting}
              />
              <InputGroup 
                label="Tipo Cable" 
                name="TIPO_CABLE" 
                value={formData.TIPO_CABLE} 
                onChange={handleChange} 
                placeholder="Ej: 2X18AWG" 
                disabled={isSaving || isDeleting}
              />
              <InputGroup 
                label="Ubicación" 
                name="UBICACIÓN" 
                value={formData.UBICACIÓN} 
                onChange={handleChange} 
                placeholder="Ej: AIR BELT Y SILO PTM" 
                disabled={isSaving || isDeleting}
              />
              <InputGroup 
                label="Observación" 
                name="OBSERVACIÓN" 
                value={formData.OBSERVACIÓN} 
                onChange={handleChange} 
                textarea
                placeholder="..." 
                disabled={isSaving || isDeleting}
              />
              <div className="pt-2">
                <Button type="submit" variant="primary" icon={Save} disabled={isSaving || isDeleting} className="w-full">
                  {isSaving ? "Guardando..." : "Guardar Instrumento"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* LADO DERECHO: LISTA DE INSTRUMENTOS */}
        <div className="space-y-4 flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-[#1F3864] text-lg">Registros Actuales ({instrumentos.length})</h3>
              <p className="text-xs text-gray-500">Selecciona para eliminar de la base de datos.</p>
            </div>
            {selectedTags.length > 0 && (
              <Button 
                variant="danger" 
                icon={Trash2} 
                onClick={handleDeleteSelected} 
                disabled={isDeleting}
                className="animate-fade-in text-xs py-1.5"
              >
                {isDeleting ? 'Eliminando...' : `Eliminar ${selectedTags.length}`}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar por TAG o descripción..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#1F3864] focus:outline-none"
              />
            </div>
            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-2 border rounded-lg transition-colors flex items-center justify-center bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
              title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
            >
              {sortOrder === 'asc' ? <ArrowDownAZ size={18} /> : <ArrowUpZA size={18} />}
            </button>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border rounded-lg transition-colors flex items-center justify-center ${showFilters || filtroUbicacion || filtroTipoCable ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
              title="Filtros avanzados"
            >
              <Filter size={18} />
            </button>
          </div>

          {showFilters && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Ubicación</label>
                <select 
                  value={filtroUbicacion} 
                  onChange={(e) => setFiltroUbicacion(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded bg-white focus:ring-[#1F3864] focus:outline-none"
                >
                  <option value="">Todas</option>
                  {ubicacionesUnicas.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Tipo de Cable</label>
                <select 
                  value={filtroTipoCable} 
                  onChange={(e) => setFiltroTipoCable(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-200 rounded bg-white focus:ring-[#1F3864] focus:outline-none"
                >
                  <option value="">Todos</option>
                  {tiposCableUnicos.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr] md:grid-cols-[auto_1.5fr_2fr] gap-3 p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs uppercase text-gray-500">
              <div className="flex items-center justify-center w-6 px-1">
                <input 
                  type="checkbox" 
                  checked={selectedTags.length === filteredInstrumentos.length && filteredInstrumentos.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags(filteredInstrumentos.map(i => i.TAGNAME));
                    } else {
                      setSelectedTags([]);
                    }
                  }}
                  className="rounded border-gray-300 w-4 h-4"
                />
              </div>
              <div>TAGNAME</div>
              <div className="hidden md:block">Descripción</div>
            </div>

            {/* Listado virtual simple */}
            <div className="overflow-y-auto flex-1 p-1 space-y-1 custom-scrollbar bg-gray-50/30">
              {filteredInstrumentos.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  No se encontraron instrumentos.
                </div>
              ) : (
                filteredInstrumentos.map(inst => (
                  <label 
                    key={inst.TAGNAME} 
                    className={`grid grid-cols-[auto_1fr] md:grid-cols-[auto_1.5fr_2fr] gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors items-center ${
                      selectedTags.includes(inst.TAGNAME) 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white border-transparent hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-center w-6 px-1" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedTags.includes(inst.TAGNAME)}
                        onChange={() => handleToggleTag(inst.TAGNAME)}
                        className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-600"
                      />
                    </div>
                    <div className="font-bold text-[#1F3864] text-sm break-all">{inst.TAGNAME}</div>
                    <div className="hidden md:block text-xs text-gray-500 uppercase truncate" title={inst.DESCRIPCIÓN}>
                      {inst.DESCRIPCIÓN || '—'}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Eliminar {selectedTags.length} registro(s)?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Esta acción eliminará permanentemente los instrumentos seleccionados de la base de datos maestra. Este movimiento quedará registrado en el historial.
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="secondary" onClick={() => setShowConfirmDelete(false)} className="flex-1">
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmDeleteAction} disabled={isDeleting} className="flex-1">
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
