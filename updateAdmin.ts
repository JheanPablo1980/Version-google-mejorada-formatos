import * as fs from 'fs';

let content = fs.readFileSync('src/components/Admin.tsx', 'utf8');

content = content.replace(
  "updateUserRoleAssignment",
  "updateUserRoleAssignment,\n    deleteUserRoleAssignment"
);

const targetBlock = `<div className="space-y-2">
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
                </div>`;

const newBlock = `<div className="space-y-2">
                  <div className="flex flex-col gap-2">
                    <select
                      value={newEmail}
                      onChange={(e) => {
                        setNewEmail(e.target.value);
                        const user = usuariosRegistrados.find(u => u.email === e.target.value);
                        if (user) setNewRole(user.role);
                      }}
                      className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un usuario...</option>
                      {usuariosRegistrados.map((u) => (
                        <option key={u.email} value={u.email}>
                          {u.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full text-sm p-2 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    disabled={!newEmail}
                  >
                    <option value="TECNICO">TECNICO</option>
                    <option value="INVITADO">INVITADO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                         if (newEmail.trim()) {
                           updateUserRoleAssignment(newEmail.trim().toLowerCase(), newRole);
                           setNewEmail('');
                           setTargetUser(newEmail.trim().toLowerCase());
                         }
                      }}
                      disabled={!newEmail.trim()}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-2 rounded-lg text-xs transition-colors"
                    >
                      Asignar Rol
                    </button>
                    
                    <button
                      onClick={() => {
                        if (newEmail.trim() && window.confirm('¿Estás seguro de que quieres dar de baja a este usuario?')) {
                          deleteUserRoleAssignment(newEmail.trim().toLowerCase());
                          setNewEmail('');
                          setTargetUser('');
                        }
                      }}
                      title="Dar de baja"
                      disabled={!newEmail.trim()}
                      className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 disabled:opacity-50 disabled:hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center justify-center shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>`;

content = content.replace(targetBlock, newBlock);

fs.writeFileSync('src/components/Admin.tsx', content);
