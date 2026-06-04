import * as fs from 'fs';
const file = 'src/store/useAppStore.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `      if (data.session) {
        const assignedRole = get().usuariosRegistrados.find(u => u.email.toLowerCase() === email.toLowerCase())?.role || (email === ADMIN_EMAIL ? 'ADMIN' : 'TECNICO');
        const role: UserRole = assignedRole;`;

const newStr = `      if (data.session) {
        const isRegistered = get().usuariosRegistrados.some(u => u.email.toLowerCase() === email.toLowerCase());
        const assignedRole = get().usuariosRegistrados.find(u => u.email.toLowerCase() === email.toLowerCase())?.role || (email === ADMIN_EMAIL ? 'ADMIN' : 'TECNICO');
        const role: UserRole = assignedRole;
        if (!isRegistered && email) {
           get().updateUserRoleAssignment(email.toLowerCase(), role);
        }`;

// We will replace all occurrences (should be 2: one in loginWithEmail and one in signUpWithEmail)
code = code.replace(targetStr, newStr).replace(targetStr, newStr);

fs.writeFileSync(file, code);
console.log('done');
