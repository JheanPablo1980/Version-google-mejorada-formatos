import React, { useState, useRef } from 'react';
import { ArrowLeft, Trash2, FileUp, Save } from 'lucide-react';
import { useAppStore, Perfil } from '../store/useAppStore';
import { Button } from './ui/Button';
import { InputGroup } from './ui/InputGroup';
import { PERFIL_INICIAL } from '../constants';

interface FormPerfilProps {
  perfilToEdit?: Perfil | null;
  onBack: () => void;
}

export const FormPerfil: React.FC<FormPerfilProps> = ({ perfilToEdit, onBack }) => {
  const savePerfil = useAppStore(state => state.savePerfil);
  const [formData, setFormData] = useState<Perfil>(perfilToEdit || { ...PERFIL_INICIAL, ID_PERFIL: crypto.randomUUID() } as Perfil);
  const [confirmClear, setConfirmClear] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSignatureChange = (fieldName: string, base64: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: base64 }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.NOMBRE_PERFIL) {
      setSaveError("El nombre del perfil es obligatorio para poder guardar.");
      return;
    }
    
    setIsSaving(true);
    setSaveError(null);
    
    const result = await savePerfil({ ...formData, timestamp: new Date().toISOString() });
    
    setIsSaving(false);
    
    if (result.success) {
      onBack();
    } else {
      setSaveError(result.error || 'Error desconocido al guardar');
    }
  };

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setFormData({ ...PERFIL_INICIAL, ID_PERFIL: formData.ID_PERFIL } as Perfil);
    setConfirmClear(false);
  };

  return (
    <div className="max-w-2xl mx-auto pb-24">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md p-4 border-b z-30 flex items-center gap-3">
        <button 
          type="button" 
          onClick={onBack} 
          className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20}/>
        </button>
        <h2 className="text-xl font-bold text-[#1F3864] truncate">
          {perfilToEdit ? 'Editar Perfil' : 'Nuevo Perfil'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        <section className="bg-white p-5 rounded-xl shadow-sm border-t-4 border-t-[#1F3864]">
          <h3 className="font-bold text-sm mb-4 text-[#1F3864] uppercase tracking-widest border-b pb-2">Identificación</h3>
          <InputGroup label="Nombre del Perfil" name="NOMBRE_PERFIL" value={formData.NOMBRE_PERFIL} onChange={handleChange} required className="mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Revisión Format." name="REVISION" value={formData.REVISION} onChange={handleChange} />
            <InputGroup label="Fecha de Revisión" name="FECHA_REVISION" value={formData.FECHA_REVISION} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <InputGroup label="Cliente" name="CLIENTE" value={formData.CLIENTE} onChange={handleChange} />
            <InputGroup label="Fecha Elaboración" name="FECHA" type="date" value={formData.FECHA} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <InputGroup label="Proyecto" name="PROYECTO" value={formData.PROYECTO} onChange={handleChange} />
            <InputGroup label="Contrato" name="CONTRATO" value={formData.CONTRATO} onChange={handleChange} />
          </div>
        </section>

        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4 text-[#1F3864] uppercase tracking-widest border-b pb-2">1. Información del Instrumento</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputGroup label="Tagname" name="TAGNAME" value={formData.TAGNAME} onChange={handleChange} />
            <InputGroup label="Tag Cable / SWC" name="TAG_CABLE_SWC" value={formData.TAG_CABLE_SWC} onChange={handleChange} />
            <InputGroup label="Descripción" name="DESCRIPCION" value={formData.DESCRIPCION} onChange={handleChange} />
            <InputGroup label="Tipo de Cable" name="TIPO_CABLE" value={formData.TIPO_CABLE} onChange={handleChange} />
            <InputGroup label="Ubicación" name="UBICACION" value={formData.UBICACION} onChange={handleChange} />
            <InputGroup label="Observación" name="OBSERVACION" value={formData.OBSERVACION} onChange={handleChange} />
          </div>
        </section>

        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4 text-[#1F3864] uppercase tracking-widest border-b pb-2">2. Condiciones de Prueba</h3>
          <InputGroup label="Norma / Procedimiento" name="NORMA_PROCEDIMIENTO" value={formData.NORMA_PROCEDIMIENTO} onChange={handleChange} className="mb-4" />
          
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Tipo de Prueba</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              {[
                { name: 'TIPO_PRUEBA_PLANO', label: 'Equipo instalado en ubicación/PLANO' },
                { name: 'TIPO_PRUEBA_FUNC_SIM', label: 'Prueba funcional simulada' },
                { name: 'TIPO_PRUEBA_LOOP', label: 'Pruebas de lazo (loop check)' },
                { name: 'TIPO_PRUEBA_FUNC_LINEA', label: 'Prueba funcional acoplada a línea' }
              ].map(opt => (
                <label key={opt.name} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name={opt.name} 
                    checked={(formData as any)[opt.name]} 
                    onChange={handleChange} 
                    className="w-5 h-5 rounded border-gray-300 text-[#1F3864] focus:ring-[#1F3864]"
                  />
                  <span className="text-gray-700 group-hover:text-[#1F3864] transition-colors">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 border-gray-50">
            <InputGroup label="Equipo de prueba 1" name="EQUIPO_PRUEBA_1" value={formData.EQUIPO_PRUEBA_1} onChange={handleChange} />
            <InputGroup label="Certificado / Vigencia 1" name="CERT_FECHA_1" value={formData.CERT_FECHA_1} onChange={handleChange} placeholder="VIGENTE / 12-2026" />
            <InputGroup label="Equipo de prueba 2" name="EQUIPO_PRUEBA_2" value={formData.EQUIPO_PRUEBA_2} onChange={handleChange} />
            <InputGroup label="Certificado / Vigencia 2" name="CERT_FECHA_2" value={formData.CERT_FECHA_2} onChange={handleChange} />
          </div>
        </section>

        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4 text-[#1F3864] uppercase tracking-widest border-b pb-2">3. Pruebas de Lazo</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['LOOP_C1', 'LOOP_C2', 'LOOP_C3'].map(col => (
              <input 
                key={col}
                name={col} 
                value={(formData as any)[col] || ''} 
                onChange={handleChange} 
                className="p-2 border border-gray-200 rounded-lg text-center uppercase font-bold text-[10px] bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#1F3864] focus:outline-none" 
                placeholder="Encabezado"
              />
            ))}
          </div>

          {[1, 2, 3].map(rowNum => (
            <div key={rowNum} className="grid grid-cols-3 gap-2 mb-2">
              {[1, 2, 3].map(colNum => (
                <input 
                  key={colNum}
                  name={`L${rowNum}_C${colNum}`} 
                  value={(formData as any)[`L${rowNum}_C${colNum}`] || ''} 
                  onChange={handleChange} 
                  className="p-2 border border-gray-100 rounded-lg bg-gray-50 focus:bg-white text-center text-xs focus:ring-1 focus:ring-[#1F3864] focus:outline-none" 
                  placeholder={`Fila ${rowNum} Col ${colNum}`} 
                />
              ))}
            </div>
          ))}
        </section>

        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4 text-[#1F3864] uppercase tracking-widest border-b pb-2">4. Inspección</h3>
          {[1, 2, 3, 4].map(num => (
            <div key={num} className="mb-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
              <input 
                type="text" 
                name={`LABEL_4_${num}`} 
                value={(formData as any)[`LABEL_4_${num}`]} 
                onChange={handleChange} 
                className="w-full font-bold text-xs text-[#1F3864] bg-transparent border-b border-gray-200 focus:outline-none mb-3 pb-1"
                placeholder="Ítem de inspección..."
              />
              <div className="flex gap-6 mb-4">
                {['SI', 'NO', 'NA'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600">
                    <input 
                      type="radio" 
                      name={`INSP_4_${num}`} 
                      value={opt} 
                      checked={(formData as any)[`INSP_4_${num}`] === opt} 
                      onChange={handleChange} 
                      className="text-[#1F3864] focus:ring-[#1F3864] w-4 h-4" 
                    /> {opt}
                  </label>
                ))}
              </div>
              <input 
                type="text" 
                name={`OBS_4_${num}`} 
                placeholder="Observaciones..." 
                value={(formData as any)[`OBS_4_${num}`] || ''} 
                onChange={handleChange} 
                className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:ring-1 focus:ring-[#1F3864] focus:outline-none" 
              />
            </div>
          ))}
        </section>

        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-sm mb-4 text-[#1F3864] uppercase tracking-widest border-b pb-2">5. Gestión y Firmas</h3>
          <InputGroup label="Comentarios Generales" name="COMENTARIOS" value={formData.COMENTARIOS} onChange={handleChange} textarea rows={4} className="mb-8" />
          
          <div className="space-y-8">
            {[
              { id: 'ELABORO', label: 'Elaboró', signatureLabel: 'Quien Elabora' },
              { id: 'REVISO', label: 'Revisó', signatureLabel: 'Quien Revisa' },
              { id: 'APROBO', label: 'Aprobó', signatureLabel: 'Cliente/Interventor' }
            ].map(role => (
              <div key={role.id} className="grid grid-cols-2 gap-x-4 border-b pb-6 border-gray-100 last:border-0 last:pb-0">
                <InputGroup label={`${role.label} (Nombre)`} name={`${role.id}_NOMBRE`} value={(formData as any)[`${role.id}_NOMBRE`]} onChange={handleChange} className="mb-4" />
                <InputGroup label="Cargo" name={`${role.id}_CARGO`} value={(formData as any)[`${role.id}_CARGO`]} onChange={handleChange} className="mb-4" />
                
                <div className="col-span-2 bg-gray-50/50 p-4 rounded-xl border border-dashed border-gray-300 flex flex-col items-center">
                  <label className="text-[10px] font-bold text-gray-500 mb-3 uppercase tracking-wider">Firma de {role.signatureLabel}</label>
                  {(formData as any)[`${role.id}_FIRMA`] ? (
                    <div className="relative group">
                      <div className="bg-white p-4 rounded-lg shadow-inner border border-gray-200">
                        <img 
                          src={(formData as any)[`${role.id}_FIRMA`]} 
                          alt={`Firma ${role.label}`} 
                          className="h-16 object-contain mix-blend-multiply" 
                        />
                      </div>
                      <button 
                        type="button" 
                        onClick={() => handleSignatureChange(`${role.id}_FIRMA`, '')} 
                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  ) : (
                    <div className="w-full flex justify-center">
                      <SignatureUploadButton onUpload={(base64) => handleSignatureChange(`${role.id}_FIRMA`, base64)} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {saveError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs mb-4">
            <p className="font-bold mb-1">Error al sincronizar con la nube:</p>
            <p>{saveError}</p>
            <p className="mt-2 text-[10px] text-red-500 italic">Nota: Los datos se guardaron localmente en el dispositivo.</p>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          <Button type="button" onClick={handleClear} variant={confirmClear ? "danger" : "secondary"} icon={Trash2} className="flex-1" disabled={isSaving}>
            {confirmClear ? "Confirmar Limpiar" : "Limpiar Todo"}
          </Button>
          <Button type="submit" variant="primary" icon={Save} className="flex-[2]" disabled={isSaving}>
            {isSaving ? "Guardando y Sincronizando..." : "Guardar Perfil"}
          </Button>
        </div>
      </form>
    </div>
  );
};

const SignatureUploadButton: React.FC<{ onUpload: (base64: string) => void }> = ({ onUpload }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onUpload(reader.result as string);
    reader.readAsDataURL(file);
  };
  return (
    <>
      <input type="file" accept="image/*" className="hidden" ref={inputRef} onChange={handleFileChange} />
      <Button 
        type="button" 
        onClick={() => inputRef.current?.click()} 
        variant="secondary" 
        className="!py-2 text-xs border border-blue-200 shadow-sm" 
        icon={FileUp}
      >
        Subir Imagen de Firma
      </Button>
    </>
  );
};
