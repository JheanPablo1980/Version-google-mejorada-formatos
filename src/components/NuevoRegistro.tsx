import React, { useState, useMemo } from 'react';
import { Database, Save, Trash2, Search, Filter, X, ArrowDownAZ, ArrowUpZA, Edit, Plus, Folder, FolderOpen, ChevronRight, ChevronDown, FileText } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { InputGroup } from './ui/InputGroup';

export const NuevoRegistro: React.FC = () => {
  const { 
    addInstrumento, 
    updateInstrumento,
    instrumentos, 
    deleteInstrumentos,
    addPotenciaEquipo,
    updatePotenciaEquipo,
    potenciaEquipos,
    deletePotenciaEquipos,
    appSettings
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'INSTRUMENTACION' | 'POTENCIA'>(
    appSettings.enableGenInstrumentacion ? 'INSTRUMENTACION' : 'POTENCIA'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  
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
    const list = activeTab === 'INSTRUMENTACION' ? instrumentos : [];
    const u = new Set(list.map(i => (i as any).UBICACIÓN).filter(Boolean));
    return Array.from(u).sort();
  }, [instrumentos, activeTab]);

  const tiposCableUnicos = useMemo(() => {
    const list = activeTab === 'INSTRUMENTACION' ? instrumentos : [];
    const t = new Set(list.map(i => (i as any).TIPO_CABLE).filter(Boolean));
    return Array.from(t).sort();
  }, [instrumentos, activeTab]);

  const groupedItems = useMemo(() => {
    const list = activeTab === 'INSTRUMENTACION' ? instrumentos : potenciaEquipos;
    const filtered = list.filter(item => {
      const tag = activeTab === 'INSTRUMENTACION' ? (item as any).TAGNAME : (item as any).TAG;
      const desc = item.DESCRIPCIÓN || '';
      const matchesSearch = tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            desc.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (activeTab === 'INSTRUMENTACION') {
        const matchesUbicacion = filtroUbicacion ? (item as any).UBICACIÓN === filtroUbicacion : true;
        const matchesTipo = filtroTipoCable ? (item as any).TIPO_CABLE === filtroTipoCable : true;
        return matchesSearch && matchesUbicacion && matchesTipo;
      }
      
      return matchesSearch;
    });

    filtered.sort((a, b) => {
      const tagA = activeTab === 'INSTRUMENTACION' ? (a as any).TAGNAME : (a as any).TAG;
      const tagB = activeTab === 'INSTRUMENTACION' ? (b as any).TAGNAME : (b as any).TAG;
      const cmp = tagA.localeCompare(tagB);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    const groups: Record<string, any[]> = {};
    if (activeTab === 'INSTRUMENTACION') {
      filtered.forEach(item => {
        const u = ((item as any).UBICACIÓN || 'SIN UBICACIÓN').toString().toUpperCase();
        if (!groups[u]) groups[u] = [];
        groups[u].push(item);
      });
    } else {
      filtered.forEach(item => {
        const t = ((item as any).TAG as string) || '';
        const group = t ? t.charAt(0).toUpperCase() : '#';
        if (!groups[group]) groups[group] = [];
        groups[group].push(item);
      });
    }

    const sortedGroups: Record<string, any[]> = {};
    Object.keys(groups).sort().forEach(k => {
      sortedGroups[k] = groups[k];
    });

    return sortedGroups;
  }, [instrumentos, potenciaEquipos, activeTab, searchQuery, filtroUbicacion, filtroTipoCable, sortOrder]);

  const totalFilteredCount = useMemo(() => {
    return Object.values(groupedItems).reduce((acc: number, curr: any) => acc + curr.length, 0);
  }, [groupedItems]);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStartEdit = (item: any) => {
    if (activeTab === 'INSTRUMENTACION') {
      setFormData({
        TAGNAME: item.TAGNAME || '',
        TAG_CABLE_SWC: item.TAG_CABLE_SWC || '',
        TIPO_CABLE: item.TIPO_CABLE || '',
        UBICACIÓN: item.UBICACIÓN || '',
        DESCRIPCIÓN: item.DESCRIPCIÓN || '',
        OBSERVACIÓN: item.OBSERVACIÓN || ''
      });
      setEditingTag(item.TAGNAME);
    } else {
      setFormData({
        TAGNAME: item.TAG || '',
        TAG_CABLE_SWC: '',
        TIPO_CABLE: '',
        UBICACIÓN: '',
        DESCRIPCIÓN: item.DESCRIPCIÓN || '',
        OBSERVACIÓN: ''
      });
      setEditingTag(item.TAG);
    }
    setStatusMsg(null);
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setFormData({
      TAG_CABLE_SWC: '',
      TAGNAME: '',
      DESCRIPCIÓN: '',
      TIPO_CABLE: '',
      UBICACIÓN: '',
      OBSERVACIÓN: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.TAGNAME.trim()) {
      setStatusMsg({ type: 'error', text: "El TAG es obligatorio." });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    const tag = formData.TAGNAME.trim().toUpperCase();
    
    if (activeTab === 'INSTRUMENTACION') {
      const nuevoInst = { ...formData, TAGNAME: tag };
      let result;
      if (editingTag) {
        result = await updateInstrumento(editingTag, nuevoInst as any);
      } else {
        result = await addInstrumento(nuevoInst as any);
      }
      setIsSaving(false);
      if (result.success) {
        setStatusMsg({ 
          type: 'success', 
          text: editingTag 
            ? `Instrumento ${tag} actualizado con éxito.` 
            : `Instrumento ${tag} agregado con éxito.` 
        });
        handleCancelEdit();
      } else {
        setStatusMsg({ type: 'error', text: result.error || "Error al guardar el instrumento." });
      }
    } else {
      const nuevoEquipo = { TAG: tag, DESCRIPCIÓN: formData.DESCRIPCIÓN };
      let result;
      if (editingTag) {
        result = await updatePotenciaEquipo(editingTag, nuevoEquipo);
      } else {
        result = await addPotenciaEquipo(nuevoEquipo);
      }
      setIsSaving(false);
      if (result.success) {
        setStatusMsg({ 
          type: 'success', 
          text: editingTag 
            ? `Equipo de potencia ${tag} actualizado con éxito.` 
            : `Equipo de potencia ${tag} agregado con éxito.` 
        });
        handleCancelEdit();
      } else {
        setStatusMsg({ type: 'error', text: result.error || "Error al guardar el equipo." });
      }
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
    const result = activeTab === 'INSTRUMENTACION' 
      ? await deleteInstrumentos(selectedTags)
      : await deletePotenciaEquipos(selectedTags);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
          <Database size={24} className="text-blue-600" /> Gestionar Bases de Datos
        </h2>
        <div className="flex gap-2 border-b-[3px] border-[#1F3864] px-2 md:px-4 pt-2 mb-6 overflow-x-auto custom-scrollbar">
          {appSettings.enableGenInstrumentacion && (
            <button
              onClick={() => { setActiveTab('INSTRUMENTACION'); setSelectedTags([]); handleCancelEdit(); }}
              className={`py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'INSTRUMENTACION' 
                ? 'bg-white text-[#1F3864] text-[15px]' 
                : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
              }`}
            >
              INSTRUMENTACIÓN
            </button>
          )}
          {appSettings.enableGenPotencia && (
            <button
              onClick={() => { setActiveTab('POTENCIA'); setSelectedTags([]); handleCancelEdit(); }}
              className={`py-2.5 px-6 rounded-t-2xl font-semibold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'POTENCIA' 
                ? 'bg-white text-[#1F3864] text-[15px]' 
                : 'bg-[#EBF0F6] text-[#64748B] hover:bg-[#DFE7F0] hover:text-[#1F3864] text-[14px]'
              }`}
            >
              POTENCIA EQUIPOS
            </button>
          )}
        </div>
      </div>
      
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row h-[calc(100vh-180px)] min-h-[600px]">
        
        {/* LADO IZQUIERDO: LISTA DE REGISTROS (ARBOL) */}
        <div className="w-full md:w-1/3 min-w-[320px] max-w-sm border-r border-gray-200 flex flex-col bg-gray-50">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#1F3864] text-lg">Registros ({activeTab === 'INSTRUMENTACION' ? instrumentos.length : potenciaEquipos.length})</h3>
                <p className="text-xs text-gray-500">Navega y edita.</p>
              </div>
              {selectedTags.length > 0 && (
                <Button 
                  variant="danger" 
                  icon={Trash2} 
                  onClick={handleDeleteSelected} 
                  disabled={isDeleting}
                  className="animate-fade-in text-[10px] py-1 px-2 h-auto ml-2"
                >
                  {isDeleting ? 'Borrando...' : `Borrar ${selectedTags.length}`}
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar TAG..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#1F3864] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button 
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border rounded-lg transition-colors flex items-center justify-center bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                title={`Ordenar ${sortOrder === 'asc' ? 'Descendente' : 'Ascendente'}`}
              >
                {sortOrder === 'asc' ? <ArrowDownAZ size={16} /> : <ArrowUpZA size={16} />}
              </button>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`p-1.5 border rounded-lg transition-colors flex items-center justify-center ${showFilters || filtroUbicacion || filtroTipoCable ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title="Filtros avanzados"
              >
                <Filter size={16} />
              </button>
            </div>

            {showFilters && activeTab === 'INSTRUMENTACION' && (
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 grid grid-cols-1 gap-2 mt-3 text-xs">
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Ubicación</label>
                  <select 
                    value={filtroUbicacion} 
                    onChange={(e) => setFiltroUbicacion(e.target.value)}
                    className="w-full p-1 border border-gray-200 rounded bg-white focus:outline-none"
                  >
                    <option value="">Todas</option>
                    {ubicacionesUnicas.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Tipo de Cable</label>
                  <select 
                    value={filtroTipoCable} 
                    onChange={(e) => setFiltroTipoCable(e.target.value)}
                    className="w-full p-1 border border-gray-200 rounded bg-white focus:outline-none"
                  >
                    <option value="">Todos</option>
                    {tiposCableUnicos.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-2 p-2 bg-gray-100 border-b border-gray-200 font-bold text-[10px] uppercase text-gray-500 items-center">
            <div className="flex items-center justify-center w-6 px-1">
              <input 
                type="checkbox" 
                checked={selectedTags.length === totalFilteredCount && totalFilteredCount > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    const allTags = Object.values(groupedItems).flat().map(i => activeTab === 'INSTRUMENTACION' ? (i as any).TAGNAME : (i as any).TAG);
                    setSelectedTags(allTags);
                  } else {
                    setSelectedTags([]);
                  }
                }}
                className="rounded border-gray-300 w-3.5 h-3.5"
              />
            </div>
            <div>{activeTab === 'POTENCIA' ? 'A-Z / TAG' : 'Ubicación / TAG'}</div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            <div className="mb-2">
              <Button 
                onClick={handleCancelEdit} 
                variant="secondary" 
                className="w-full text-xs py-1.5 border-dashed border-gray-300 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                icon={Plus}
              >
                Nuevo Registro
              </Button>
            </div>
            {Object.keys(groupedItems).length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">
                No se encontraron resultados.
              </div>
            ) : (
              Object.entries(groupedItems).map(([groupName, items]: [string, any[]]) => {
                const isExpanded = expandedGroups[groupName];
                const allGroupTags = items.map(i => activeTab === 'INSTRUMENTACION' ? (i as any).TAGNAME : (i as any).TAG);
                const isAllGroupSelected = items.length > 0 && allGroupTags.every(t => selectedTags.includes(t));
                const isSomeGroupSelected = !isAllGroupSelected && allGroupTags.some(t => selectedTags.includes(t));

                return (
                  <div key={groupName} className="border border-gray-150 rounded-lg bg-white overflow-hidden shadow-sm">
                    {/* Header del Nodo */}
                    <div 
                      className="flex items-center p-2 bg-gray-50 hover:bg-gray-100 cursor-pointer select-none transition-colors"
                      onClick={() => toggleGroup(groupName)}
                    >
                      <div className="flex items-center justify-center w-6 px-1" onClick={e => e.stopPropagation()}>
                         <input 
                            type="checkbox"
                            checked={isAllGroupSelected}
                            ref={input => { if (input) input.indeterminate = isSomeGroupSelected; }}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTags(prev => Array.from(new Set([...prev, ...allGroupTags])));
                              } else {
                                setSelectedTags(prev => prev.filter(t => !allGroupTags.includes(t)));
                              }
                            }}
                            className="rounded border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-600 cursor-pointer"
                         />
                      </div>
                      <div className="text-gray-400 mr-1.5 flex items-center justify-center w-4 h-4">
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </div>
                      <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                         {isExpanded ? <FolderOpen size={13} className="text-blue-500 shrink-0" /> : <Folder size={13} className="text-blue-400 shrink-0" />}
                         <span className="text-xs font-bold text-gray-700 truncate">{groupName}</span>
                      </div>
                      <div className="text-[9px] font-bold text-gray-500 bg-gray-200 px-1.5 rounded-full">
                        {items.length}
                      </div>
                    </div>

                    {/* Hijos del Nodo */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-white">
                        {items.map((item, index) => {
                          const tag = activeTab === 'INSTRUMENTACION' ? (item as any).TAGNAME : (item as any).TAG;
                          const isBeingEdited = editingTag === tag;
                          const isSelected = selectedTags.includes(tag);

                          return (
                            <div 
                              key={tag}
                              className={`flex items-center p-1.5 pl-8 border-b border-gray-50 last:border-b-0 cursor-pointer transition-colors ${
                                isBeingEdited 
                                  ? activeTab === 'POTENCIA' ? 'bg-orange-50' : 'bg-blue-50 ring-1 ring-inset ring-blue-200'
                                  : isSelected ? 'bg-slate-50' : 'hover:bg-gray-50'
                              }`}
                              onClick={() => handleStartEdit(item)}
                            >
                              <div className="flex items-center justify-center w-6 px-1 shrink-0" onClick={e => e.stopPropagation()}>
                                <input 
                                  type="checkbox" 
                                  checked={isSelected}
                                  onChange={() => handleToggleTag(tag)}
                                  className="rounded border-gray-300 w-3.5 h-3.5 text-blue-600 focus:ring-blue-600 cursor-pointer"
                                />
                              </div>
                              <FileText size={12} className={`mr-2 shrink-0 ${isBeingEdited ? 'text-blue-500' : 'text-gray-300'}`} />
                              <div className="min-w-0 flex-1 flex flex-col justify-center">
                                <div className="flex items-center justify-between w-full">
                                  <span className={`text-xs font-semibold truncate ${
                                    isBeingEdited 
                                      ? activeTab === 'POTENCIA' ? 'text-orange-700' : 'text-[#1F3864]'
                                      : 'text-gray-600'
                                  }`}>
                                    {tag}
                                  </span>
                                  {!isBeingEdited && (
                                    <Edit size={10} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-blue-500 shrink-0 ml-1" />
                                  )}
                                  {isBeingEdited && (
                                    <span className={`text-[8.5px] font-black uppercase tracking-wider shrink-0 pl-1 ${activeTab === 'POTENCIA' ? 'text-orange-600' : 'text-blue-600'}`}>
                                      Editando
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* LADO DERECHO: FORMULARIO */}
        <div className="flex-1 bg-white flex flex-col min-w-0 overflow-y-auto w-full">
          <div className="p-6 md:p-8 max-w-2xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="font-bold text-[#1F3864] text-xl">
                  {editingTag ? 'Editar Registro' : 'Nuevo Registro'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingTag 
                    ? `Modificando los datos del TAG: ${editingTag}` 
                    : `Complete el formulario para añadir a la base de datos de ${activeTab.toLowerCase()}.`}
                </p>
              </div>
              <div className="shrink-0 ml-4 flex flex-col items-end gap-2">
                  {!editingTag && (
                    <Button 
                        onClick={() => { setFormData({ TAG_CABLE_SWC: '', TAGNAME: '', DESCRIPCIÓN: '', TIPO_CABLE: '', UBICACIÓN: '', OBSERVACIÓN: '' }); }}
                        variant="secondary" 
                        className="text-[10px] py-1 px-2 border-gray-200 text-gray-600 h-auto"
                        icon={Plus}
                        title="Limpiar"
                    >
                        Limpiar
                    </Button>
                  )}
                  {editingTag && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse border border-amber-250">
                    Editando: {editingTag}
                    </span>
                  )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputGroup 
                label={`TAG ${activeTab === 'POTENCIA' ? '' : 'NAME'} (Obligatorio)`} 
                name="TAGNAME" 
                value={formData.TAGNAME} 
                onChange={handleChange} 
                required 
                placeholder="Ej: PT-101" 
                disabled={isSaving || isDeleting}
              />
              {activeTab === 'INSTRUMENTACION' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup 
                    label="TAG CABLE SWC" 
                    name="TAG_CABLE_SWC" 
                    value={formData.TAG_CABLE_SWC} 
                    onChange={handleChange} 
                    placeholder="Ej: VBCON5-0001"
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
                </div>
              )}
              {activeTab === 'INSTRUMENTACION' && (
                  <InputGroup 
                    label="Ubicación" 
                    name="UBICACIÓN" 
                    value={formData.UBICACIÓN} 
                    onChange={handleChange} 
                    placeholder="Ej: AIR BELT Y SILO PTM" 
                    disabled={isSaving || isDeleting}
                  />
              )}
              
              <InputGroup 
                label="Descripción" 
                name="DESCRIPCIÓN" 
                value={formData.DESCRIPCIÓN} 
                onChange={handleChange} 
                placeholder={activeTab === 'POTENCIA' ? 'Ej: MOTOR DE BANDA' : 'Ej: SENSOR DE PRESIÓN'}
                disabled={isSaving || isDeleting}
              />
              
              {activeTab === 'INSTRUMENTACION' && (
                <InputGroup 
                  label="Observación" 
                  name="OBSERVACIÓN" 
                  value={formData.OBSERVACIÓN} 
                  onChange={handleChange} 
                  textarea
                  placeholder="..." 
                  disabled={isSaving || isDeleting}
                />
              )}
              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button 
                  type="submit" 
                  variant="primary" 
                  icon={Save} 
                  disabled={isSaving || isDeleting} 
                  className={`flex-1 py-3 ${activeTab === 'POTENCIA' ? '!bg-orange-600' : ''}`}
                >
                  {isSaving 
                    ? "Guardando..." 
                    : editingTag 
                      ? "Guardar Cambios" 
                      : `Guardar en ${activeTab === 'POTENCIA' ? 'Potencia' : 'Instrumentación'}`}
                </Button>
                {editingTag && (
                  <Button 
                    type="button" 
                    variant="secondary" 
                    icon={X}
                    onClick={handleCancelEdit} 
                    disabled={isSaving || isDeleting} 
                    className="sm:flex-none border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 py-3 px-6"
                  >
                    Salir de Edición
                  </Button>
                )}
              </div>
            </form>
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
