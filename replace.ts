import * as fs from 'fs';

let txt = fs.readFileSync('src/components/Admin.tsx', 'utf8');

// Replace tab button
txt = txt.replace('setActiveTab(\'control\')', 'setActiveTab(\'config_usuarios\')');
txt = txt.replace('activeTab === \'control\'', 'activeTab === \'config_usuarios\'');
txt = txt.replace("useState<'corporativo' | 'bd' | 'control'>('corporativo');", "useState<'corporativo' | 'bd' | 'config_usuarios'>('corporativo');");

const controlTabStartStr = "{activeTab === 'config_usuarios' && (";
const startIdx = txt.indexOf(controlTabStartStr);
const endIdx = txt.indexOf('</AnimatePresence>', startIdx);

const currentSettingsVar = `
  const { usuariosRegistrados, updateUserRoleAssignment } = useAppStore();
  const [targetUser, setTargetUser] = useState<string>('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TECNICO');

  const currentSettings = targetUser 
    ? { ...(globalAppSettings || appSettings), ...((globalAppSettings || appSettings)?.userOverrides?.[targetUser.toLowerCase()] || {}) } 
    : (globalAppSettings || appSettings);
`;

const newTabContent = `{activeTab === 'config_usuarios' && (
          <motion.div
            key="config_usuarios"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col md:flex-row gap-6 items-start"
          >
            {/* Sidebar Usuarios Registrados */}
            <div className="w-full md:w-1/3 bg-white p-4 rounded-xl shadow-sm border border-gray-200 sticky top-4">
              <h3 className="font-bold text-[#1F3864] text-md border-b pb-2 flex items-center gap-2 mb-4">
                <Users size={16} className="text-blue-500" /> Roles y Usuarios
              </h3>
              
              <div className="mb-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Añadir o Actualizar Usuario</div>
                <div className="space-y-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="Email del usuario"
                    className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="TECNICO">TECNICO</option>
                    <option value="INVITADO">INVITADO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button
                    onClick={() => {
                       if (newEmail.trim()) {
                         updateUserRoleAssignment(newEmail.trim().toLowerCase(), newRole);
                         setNewEmail('');
                         setTargetUser(newEmail.trim().toLowerCase());
                       }
                    }}
                    disabled={!newEmail.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                  >
                    Asignar Rol
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-xs font-bold text-gray-700 mb-2">Usuarios Registrados</div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  <button 
                    onClick={() => setTargetUser('')}
                    className={\`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-center justify-between \${targetUser === '' ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}\`}
                  >
                    <span>Todos (Global)</span>
                  </button>
                  {usuariosRegistrados.map((u) => (
                    <button
                      key={u.email}
                      onClick={() => setTargetUser(u.email)}
                      className={\`w-full text-left p-2 rounded-lg border text-xs font-medium flex items-center justify-between \${targetUser === u.email ? 'bg-purple-50 border-purple-300 text-purple-700' : 'bg-white hover:bg-gray-50 border-gray-200'}\`}
                    >
                      <span className="truncate mr-2">{u.email}</span>
                      <span className={\`text-[10px] px-2 py-0.5 rounded-full \${u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : u.role === 'TECNICO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}\`}>
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full md:w-2/3 space-y-6">
              {/* Controles */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                  <Sliders size={18} className="text-purple-500" /> Controles Globales (Aplicación) {targetUser ? \` - \${targetUser}\` : ' - Todo el Sistema'}
                </h3>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => updateAppSettings({ enableCameraManual: !currentSettings.enableCameraManual }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableCameraManual ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableCameraManual ? 'text-purple-700' : 'text-gray-500'}\`}>Cámara Modo Manual</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableCameraManual ? 'bg-purple-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableCameraManual ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Permitir seleccionar fotos del archivo.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableCameraAuto: !currentSettings.enableCameraAuto }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableCameraAuto ? 'bg-purple-50 border-purple-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableCameraAuto ? 'text-purple-700' : 'text-gray-500'}\`}>Cámara Modo En Vivo</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableCameraAuto ? 'bg-purple-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableCameraAuto ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Tomar foto usando la cámara del dispositivo.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ learningMode: !currentSettings.learningMode }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.learningMode ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold flex items-center gap-1 \${currentSettings.learningMode ? 'text-emerald-700' : 'text-gray-500'}\`}>
                        <GraduationCap size={14} /> Sesión de Aprendizaje
                      </span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.learningMode ? 'bg-emerald-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.learningMode ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar modo seguro para nuevos usuarios (sin guardado en la nube).</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableGenInstrumentacion: !currentSettings.enableGenInstrumentacion }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableGenInstrumentacion ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableGenInstrumentacion ? 'text-blue-700' : 'text-gray-500'}\`}>Formatos Instrumentación</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableGenInstrumentacion ? 'bg-blue-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableGenInstrumentacion ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar creación/edición de perfiles de Inst.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableGenPotencia: !currentSettings.enableGenPotencia }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableGenPotencia ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableGenPotencia ? 'text-orange-700' : 'text-gray-500'}\`}>Formatos Potencia</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableGenPotencia ? 'bg-orange-500' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableGenPotencia ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar creación/edición de perfiles Potencia.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableMassUploadDrive: !currentSettings.enableMassUploadDrive }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableMassUploadDrive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableMassUploadDrive ? 'text-blue-700' : 'text-gray-500'}\`}>Integración Google Drive</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableMassUploadDrive ? 'bg-blue-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableMassUploadDrive ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Subida múltiple de carpetas GDrive para fotos.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableExportPdf: !currentSettings.enableExportPdf }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableExportPdf ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableExportPdf ? 'text-green-700' : 'text-gray-500'}\`}>Exportación a PDF</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableExportPdf ? 'bg-green-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableExportPdf ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Permitir imprimir localmente a PDF.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableExportXlsx: !currentSettings.enableExportXlsx }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableExportXlsx ? 'bg-green-50 border-green-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableExportXlsx ? 'text-green-700' : 'text-gray-500'}\`}>Exportación a Excel</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableExportXlsx ? 'bg-green-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableExportXlsx ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Permitir generar y descargar .xlsx.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableUploadManual: !currentSettings.enableUploadManual }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableUploadManual ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableUploadManual ? 'text-indigo-700' : 'text-gray-500'}\`}>Subida Modo Manual</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableUploadManual ? 'bg-indigo-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableUploadManual ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar subida de un tag a la vez.</span>
                  </button>

                  <button
                    onClick={() => updateAppSettings({ enableUploadAuto: !currentSettings.enableUploadAuto }, targetUser)}
                    className={\`flex flex-col items-start p-3 rounded-xl border text-left transition-all \${
                      currentSettings.enableUploadAuto ? 'bg-pink-50 border-pink-200 shadow-sm' : 'bg-gray-50 border-gray-200 opacity-60 hover:opacity-100'
                    }\`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={\`text-xs font-bold \${currentSettings.enableUploadAuto ? 'text-pink-700' : 'text-gray-500'}\`}>Carga Masiva Automática</span>
                      <div className={\`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ease-in-out \${currentSettings.enableUploadAuto ? 'bg-pink-600' : 'bg-gray-300'}\`}>
                        <div className={\`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${currentSettings.enableUploadAuto ? 'translate-x-5' : 'translate-x-0'}\`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500">Habilitar carga masiva de fotos auto-asignadas.</span>
                  </button>
                </div>
              </div>

              {/* Permisos de roles general */}
              {!targetUser && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-[#1F3864] text-lg border-b pb-2 flex items-center gap-2 mb-4">
                    <Shield size={18} className="text-blue-500" /> Permisos de Usuarios
                  </h3>
                  <p className="text-xs text-gray-500 italic mb-4">Habilita o deshabilita secciones enteras para cada tipo de rol (Técnico / Invitado).</p>
                  
                  <div className="space-y-4">
                    {(['TECNICO', 'INVITADO'] as UserRole[]).map(role => (
                      <div key={role} className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <span className="font-bold text-xs uppercase tracking-widest text-[#1F3864]">Perfil: {role}</span>
                          <Shield size={14} className="text-gray-400" />
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {(Object.keys(rolePermissions[role]) as Array<keyof RolePermissions>).map(key => {
                            const isEnabled = rolePermissions[role][key];
                            const Icon = sectionIcons[key];
                            if (key === 'admin' && role !== 'ADMIN') return null;

                            return (
                              <button
                                key={key}
                                onClick={() => handleTogglePermission(role, key)}
                                className={\`flex items-center justify-between p-2 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-tight \${
                                  isEnabled 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                                    : 'bg-white border-gray-100 text-gray-400 opacity-60 hover:opacity-100 hover:bg-gray-50'
                                }\`}
                              >
                                <div className="flex items-center gap-2">
                                  <Icon size={14} />
                                  <span>{sectionLabels[key]}</span>
                                </div>
                                <div className={\`w-8 h-4 rounded-full p-0.5 transition-colors duration-300 ease-in-out shrink-0 \${isEnabled ? 'bg-blue-600' : 'bg-gray-300'}\`}>
                                  <div className={\`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ease-in-out \${isEnabled ? 'translate-x-4' : 'translate-x-0'}\`} />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
`;

txt = txt.substring(0, startIdx) + newTabContent + txt.substring(endIdx);

const rps2 = txt.replace(/const \[targetUser, setTargetUser\] = useState<string>\(''\);/g, ''); // we already define it earlier maybe?
// Let's remove previous variables
txt = txt.replace('const [targetUser, setTargetUser] = useState<string>(\'\');', '');

const insertionIdx = txt.indexOf('return (');
txt = txt.substring(0, insertionIdx) + currentSettingsVar + '\\n  ' + txt.substring(insertionIdx);

fs.writeFileSync('src/components/Admin.tsx', txt);
