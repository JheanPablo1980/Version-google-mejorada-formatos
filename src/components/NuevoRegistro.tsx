import React, { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import { InputGroup } from './ui/InputGroup';

export const NuevoRegistro: React.FC = () => {
  const addInstrumento = useAppStore(state => state.addInstrumento);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    TAG_CABLE_SWC: '',
    TAGNAME: '',
    DESCRIPCIÓN: '',
    TIPO_CABLE: '',
    UBICACIÓN: '',
    OBSERVACIÓN: ''
  });

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

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
        <Plus size={24} /> Nuevo Registro Maestro
      </h2>
      <p className="text-sm text-gray-500 mb-2">Registra manualmente un instrumento en la base de datos maestra.</p>
      
      {statusMsg && (
        <div className={`p-4 rounded-xl text-xs font-medium border ${
          statusMsg.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {statusMsg.text}
          {statusMsg.type === 'error' && (
            <p className="mt-1 italic opacity-80 text-[10px]">Nota: Se intentó guardar localmente, pero revisa la conexión a Supabase.</p>
          )}
        </div>
      )}
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputGroup 
            label="TAGNAME (Obligatorio)" 
            name="TAGNAME" 
            value={formData.TAGNAME} 
            onChange={handleChange} 
            required 
            placeholder="Ej: PT-101" 
            disabled={isSaving}
          />
          <InputGroup 
            label="TAG CABLE SWC" 
            name="TAG_CABLE_SWC" 
            value={formData.TAG_CABLE_SWC} 
            onChange={handleChange} 
            placeholder="Ej: VBCON5-0001"
            disabled={isSaving}
          />
          <InputGroup 
            label="Descripción" 
            name="DESCRIPCIÓN" 
            value={formData.DESCRIPCIÓN} 
            onChange={handleChange} 
            placeholder="Ej: SENSOR DE PRESIÓN" 
            disabled={isSaving}
          />
        <div className="grid grid-cols-1 gap-4">
            <InputGroup 
              label="Tipo Cable" 
              name="TIPO_CABLE" 
              value={formData.TIPO_CABLE} 
              onChange={handleChange} 
              placeholder="Ej: 2X18AWG" 
              disabled={isSaving}
            />
          </div>
          <InputGroup 
            label="Ubicación" 
            name="UBICACIÓN" 
            value={formData.UBICACIÓN} 
            onChange={handleChange} 
            placeholder="Ej: AIR BELT Y SILO PTM" 
            disabled={isSaving}
          />
          <InputGroup 
            label="Observación" 
            name="OBSERVACIÓN" 
            value={formData.OBSERVACIÓN} 
            onChange={handleChange} 
            textarea
            placeholder="..." 
            disabled={isSaving}
          />
          <div className="pt-4">
            <Button type="submit" variant="primary" icon={Save} disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Instrumento"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
