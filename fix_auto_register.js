import * as fs from 'fs';
const file = 'src/store/useAppStore.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `      supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          const email = session.user.email || '';
          const assignedRole = get().usuariosRegistrados.find(u => u.email.toLowerCase() === email.toLowerCase())?.role || (email === ADMIN_EMAIL ? 'ADMIN' : 'TECNICO');
          const role: UserRole = assignedRole;`;

const newStr = `      supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
          const email = session.user.email || '';
          const isRegistered = get().usuariosRegistrados.some(u => u.email.toLowerCase() === email.toLowerCase());
          const assignedRole = get().usuariosRegistrados.find(u => u.email.toLowerCase() === email.toLowerCase())?.role || (email === ADMIN_EMAIL ? 'ADMIN' : 'TECNICO');
          const role: UserRole = assignedRole;
          
          if (!isRegistered && email) {
            get().updateUserRoleAssignment(email.toLowerCase(), role);
          }`;

code = code.replace(targetStr, newStr);

// Let's do the same for the getSession area directly just in case event is missing
const targetStr2 = `        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const email = session.user.email || '';
          const assignedRole = get().usuariosRegistrados.find(u => u.email.toLowerCase() === email.toLowerCase())?.role || (email === ADMIN_EMAIL ? 'ADMIN' : 'TECNICO');
          const role: UserRole = assignedRole;`;

const newStr2 = `        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const email = session.user.email || '';
          const isRegistered = get().usuariosRegistrados.some(u => u.email.toLowerCase() === email.toLowerCase());
          const assignedRole = get().usuariosRegistrados.find(u => u.email.toLowerCase() === email.toLowerCase())?.role || (email === ADMIN_EMAIL ? 'ADMIN' : 'TECNICO');
          const role: UserRole = assignedRole;
          
          if (!isRegistered && email) {
            get().updateUserRoleAssignment(email.toLowerCase(), role);
          }`;

code = code.replace(targetStr2, newStr2);


fs.writeFileSync(file, code);
console.log('done');
