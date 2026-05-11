import { create } from 'zustand';
import { initDB } from '../lib/db';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface Instrumento {
  TAG_CABLE_SWC: string;
  TAGNAME: string;
  DESCRIPCIÓN: string;
  TIPO_CABLE: string;
  UBICACIÓN: string;
  OBSERVACIÓN: string;
}

export interface PotenciaEquipo {
  TAG: string;
  DESCRIPCIÓN: string;
}

export type UserRole = 'ADMIN' | 'TECNICO' | 'INVITADO';

export interface RolePermissions {
  admin: boolean;
  dashboard: boolean;
  nuevo: boolean;
  fotos: boolean;
  galeria: boolean;
  perfiles: boolean;
  historial: boolean;
  generar: boolean;
}

export interface UserSession {
  user: any;
  role: UserRole;
}

export interface Foto {
  id: string;
  TAGNAME: string;
  blobData: string;
  nombre_archivo: string;
  observacion: string;
  timestamp: string;
  estado: string;
}

export interface Perfil {
  ID_PERFIL: string;
  TIPO: 'INSTRUMENTACION' | 'POTENCIA' | 'POTENCIA_COM';
  NOMBRE_PERFIL: string;
  CLIENTE: string;
  PROYECTO: string;
  CONTRATO: string;
  REVISION: string;
  FECHA_REVISION: string;
  FECHA: string;
  TAG_CABLE_SWC: string;
  TAGNAME: string;
  DESCRIPCION: string;
  TIPO_CABLE: string;
  UBICACION: string;
  OBSERVACION: string;
  FABRICANTE_MODELO?: string;
  RANGO_OPERACION?: string;
  CLASE_EXACTITUD?: string;
  NORMA_PROCEDIMIENTO: string;
  TIPO_PRUEBA_PLANO: boolean;
  TIPO_PRUEBA_LOOP: boolean;
  TIPO_PRUEBA_FUNC_SIM: boolean;
  TIPO_PRUEBA_FUNC_LINEA: boolean;
  EQUIPO_PRUEBA_1: string;
  CERT_FECHA_1: string;
  EQUIPO_PRUEBA_2: string;
  CERT_FECHA_2: string;
  LOOP_C1: string;
  LOOP_C2: string;
  LOOP_C3: string;
  L1_C1: string;
  L1_C2: string;
  L1_C3: string;
  L2_C1: string;
  L2_C2: string;
  L2_C3: string;
  L3_C1: string;
  L3_C2: string;
  L3_C3: string;
  INSP_4_1: string;
  OBS_4_1: string;
  LABEL_4_1: string;
  INSP_4_2: string;
  OBS_4_2: string;
  LABEL_4_2: string;
  INSP_4_3: string;
  OBS_4_3: string;
  LABEL_4_3: string;
  INSP_4_4: string;
  OBS_4_4: string;
  LABEL_4_4: string;
  COMENTARIOS: string;
  ELABORO_NOMBRE: string;
  ELABORO_CARGO: string;
  ELABORO_FIRMA: string;
  REVISO_NOMBRE: string;
  REVISO_CARGO: string;
  REVISO_FIRMA: string;
  APROBO_NOMBRE: string;
  APROBO_CARGO: string;
  APROBO_FIRMA: string;
  timestamp?: string;
  USER_EMAIL?: string;
  POT_CODIGO?: string;
  AC1_NO?: string;
  HC1_NO?: string;
  CONTRATISTA?: string;
  AREA?: string;
  LOCACION?: string;
  SERVICIO?: string;
  P_ID_NO?: string;
  REV_P_ID?: string;
  PAQUETE_NO?: string;
  PLANO_NO?: string;
  REV_PLANO?: string;
  CHKL_1_DESC?: string;
  CHKL_1_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_2_DESC?: string;
  CHKL_2_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_3_DESC?: string;
  CHKL_3_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_4_DESC?: string;
  CHKL_4_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_5_DESC?: string;
  CHKL_5_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_6_DESC?: string;
  CHKL_6_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_7_DESC?: string;
  CHKL_7_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_8_DESC?: string;
  CHKL_8_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_9_DESC?: string;
  CHKL_9_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_10_DESC?: string;
  CHKL_10_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  CHKL_11_DESC?: string;
  CHKL_11_ESTADO?: 'CUMPLE' | 'NO_CUMPLE' | 'N/A' | '';
  POT_COMPANIA_1?: string;
  POT_FIRMA_1?: string;
  POT_NOMBRE_1?: string;
  POT_FECHA_1?: string;
  POT_COMPANIA_2?: string;
  POT_FIRMA_2?: string;
  POT_NOMBRE_2?: string;
  POT_FECHA_2?: string;
  POT_COMPANIA_3?: string;
  POT_FIRMA_3?: string;
  POT_NOMBRE_3?: string;
  POT_FECHA_3?: string;
  POT_COM_DATA?: string;
}

export interface ExportLog {
  id: string;
  user_email: string;
  user_role?: UserRole;
  tagname: string;
  tipo_formato: 'EXCEL' | 'PDF' | 'DELETED';
  timestamp: string;
  id_perfil: string;
}

export interface ConteoExportacion {
  id: string;
  tag: string;
  conteo: number;
  fecha_hora: string;
  user_role: UserRole;
  user_email: string;
}

interface AppState {
  perfiles: Perfil[];
  fotos: Foto[];
  instrumentos: Instrumento[];
  potenciaEquipos: PotenciaEquipo[];
  exportLogs: ExportLog[];
  conteoExportacion: ConteoExportacion[];
  logoInstrumentacion: string | null;
  logoPotencia: string | null;
  driveFolderLink: string | null;
  session: UserSession | null;
  rolePermissions: Record<UserRole, RolePermissions>;
  adminPassword?: string;
  isInitialized: boolean;
  loadData: () => Promise<void>;
  savePerfil: (perfil: Perfil) => Promise<{ success: boolean; error?: string }>;
  deletePerfil: (id: string) => Promise<void>;
  saveFoto: (fotoData: Foto) => Promise<void>;
  deleteFoto: (id: string) => Promise<void>;
  saveExportLog: (log: Omit<ExportLog, 'id' | 'timestamp' | 'user_email'>) => Promise<void>;
  saveConteoExportacion: (tag: string) => Promise<void>;
  deleteInstrumentos: (tagnames: string[]) => Promise<{ success: boolean; error?: string }>;
  loadInstrumentosBulk: (dataArray: Instrumento[]) => Promise<void>;
  addInstrumento: (inst: Instrumento) => Promise<{ success: boolean; error?: string }>;
  deletePotenciaEquipos: (tagnames: string[]) => Promise<{ success: boolean; error?: string }>;
  loadPotenciaEquiposBulk: (dataArray: PotenciaEquipo[]) => Promise<void>;
  addPotenciaEquipo: (inst: PotenciaEquipo) => Promise<{ success: boolean; error?: string }>;
  saveLogo: (base64: string, type: 'INSTRUMENTACION' | 'POTENCIA') => Promise<void>;
  saveDriveFolderLink: (link: string) => Promise<void>;
  updateRolePermissions: (role: UserRole, permissions: Partial<RolePermissions>) => Promise<void>;
  updateAdminPassword: (newPassword: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  clearInstrumentos: () => Promise<void>;
  clearPotenciaEquipos: () => Promise<void>;
  clearFotos: () => Promise<void>;
  clearPerfiles: () => Promise<void>;
  totalFactoryReset: () => Promise<void>;
  signIn: () => Promise<void>;
  devLogin: (role: UserRole) => void;
  login: (role: UserRole, password?: string) => { success: boolean; error?: string };
  signOut: () => Promise<void>;
}

const ADMIN_EMAIL = '3usajanpapo6@gmail.com';

export const useAppStore = create<AppState>((set, get) => ({
    perfiles: [],
    fotos: [],
    instrumentos: [],
    potenciaEquipos: [],
    exportLogs: [],
    conteoExportacion: [],
    logoInstrumentacion: null,
    logoPotencia: null,
    driveFolderLink: null,
    session: null,
    isInitialized: false,
    rolePermissions: {
      ADMIN: { admin: true, dashboard: true, nuevo: true, fotos: true, galeria: true, perfiles: true, historial: true, generar: true },
      TECNICO: { admin: false, dashboard: false, nuevo: true, fotos: true, galeria: true, perfiles: true, historial: true, generar: true },
      INVITADO: { admin: false, dashboard: false, nuevo: false, fotos: false, galeria: true, perfiles: true, historial: false, generar: true }
    },
    adminPassword: '123',

  devLogin: (role) => {
    // Ya no es necesario con el acceso directo, pero lo mantenemos por compatibilidad
    set({ session: { user: { email: ADMIN_EMAIL, id: 'admin-fallback', user_metadata: { full_name: 'Maestro' } }, role: 'ADMIN' } });
  },

  login: (role, password) => {
    if (role === 'ADMIN') {
      const currentPassword = get().adminPassword || '123';
      if (password === currentPassword) {
        const adminSession: UserSession = {
          user: { email: ADMIN_EMAIL, id: 'admin-local', user_metadata: { full_name: 'Administrador' } },
          role: 'ADMIN'
        };
        set({ session: adminSession });
        localStorage.setItem('user_session', JSON.stringify(adminSession));
        return { success: true };
      } else {
        return { success: false, error: 'Contraseña incorrecta' };
      }
    } else if (role === 'TECNICO') {
      const tecnicoSession: UserSession = {
        user: { email: 'tecnico@protocolos.com', id: 'tecnico-local', user_metadata: { full_name: 'Técnico' } },
        role: 'TECNICO'
      };
      set({ session: tecnicoSession });
      localStorage.setItem('user_session', JSON.stringify(tecnicoSession));
      return { success: true };
    }
    return { success: false, error: 'Rol no válido' };
  },

  signIn: async () => {
    // El acceso con Google ha sido deshabilitado a petición
    console.log('SignIn deshabilitado - Usando modo de acceso directo');
  },

  signOut: async () => {
    localStorage.removeItem('user_session');
    set({ session: null });
  },

  clearInstrumentos: async () => {
    const db = await initDB();
    
    // 1. Limpiar localmente primero (IndexedDB)
    try {
      const tx = db.transaction('instrumentos', 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (dbError) {
      console.error('Error clearing local IndexedDB:', dbError);
    }

    // 2. Actualizar estado de la UI inmediatamente
    set({ instrumentos: [] });

    // 3. Intentar borrar en la nube (Supabase)
    try {
      const { error } = await supabase
        .from('instrumentos')
        .delete()
        .neq('tagname', '_borrado_manual_');
      
      if (error) {
        throw error;
      } else {
        console.log('Supabase instruments table cleared');
      }
    } catch (e: any) {
      console.error('Error clearing remote instruments:', e);
    }
  },

  clearPotenciaEquipos: async () => {
    const db = await initDB();
    try {
      const tx = db.transaction('potencia_equipos', 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (dbError) {
      console.error('Error clearing local IndexedDB:', dbError);
    }
    set({ potenciaEquipos: [] });
    try {
      const { error } = await supabase.from('potencia_equipos').delete().neq('tag', '_borrado_manual_');
      if (error) throw error;
    } catch (e: any) {
      console.error('Error clearing remote potencia_equipos:', e);
    }
  },

  clearFotos: async () => {
    const db = await initDB();
    try {
      const tx = db.transaction('fotos', 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (e) {
      console.error('Error clearing local Fotos:', e);
    }

    set({ fotos: [] });

    try {
      const { error } = await supabase.from('fotos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    } catch (e: any) {
      console.warn('Error clearing remote fotos:', e);
    }
  },

  clearPerfiles: async () => {
    const db = await initDB();
    try {
      const tx = db.transaction('perfiles', 'readwrite');
      await tx.store.clear();
      await tx.done;
    } catch (e) {
      console.error('Error clearing local Perfiles:', e);
    }

    set({ perfiles: [] });

    try {
      const { error } = await supabase.from('perfiles').delete().neq('id_perfil', '_borrado_manual_');
      if (error) throw error;
    } catch (e: any) {
      console.warn('Error clearing remote perfiles:', e);
    }
  },

  totalFactoryReset: async () => {
    const db = await initDB();
    
    // 1. Limpiar IndexedDB (Tablas locales)
    try {
      const tx = db.transaction(['perfiles', 'fotos', 'instrumentos', 'potencia_equipos', 'config', 'conteo_exportacion'], 'readwrite');
      await tx.objectStore('perfiles').clear();
      await tx.objectStore('fotos').clear();
      await tx.objectStore('instrumentos').clear();
      await tx.objectStore('potencia_equipos').clear();
      await tx.objectStore('config').clear();
      await tx.objectStore('conteo_exportacion').clear();
      await tx.done;
    } catch (e) {
      console.error('Local clear error:', e);
    }

    // 2. Limpiar Supabase (Tablas remotas)
    try {
      const results = await Promise.all([
        supabase.from('instrumentos').delete().neq('tagname', '_reset_'),
        supabase.from('potencia_equipos').delete().neq('tag', '_reset_'),
        supabase.from('fotos').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('perfiles').delete().neq('id_perfil', '_reset_'),
        supabase.from('export_logs').delete().neq('id', '_reset_'),
        supabase.from('conteo_exportacion').delete().neq('id', '_reset_')
      ]);

      const errors = results.map(r => r.error).filter(Boolean);
      if (errors.length > 0) {
        console.error('Some remote tables could not be cleared:', errors);
      }
    } catch (e) {
      console.error('Remote reset error:', e);
    }

    // 3. Reiniciar estado de la App
    set({
      perfiles: [],
      fotos: [],
      instrumentos: [],
      potenciaEquipos: [],
      logoInstrumentacion: null,
      logoPotencia: null,
      driveFolderLink: null
    });
  },

  loadData: async () => {
    const db = await initDB();
    const perfiles = await db.getAll('perfiles');
    const fotos = await db.getAll('fotos');
    const instrumentosLocal = await db.getAll('instrumentos');
    const potenciaEquiposLocal = await db.getAll('potencia_equipos');
    const exportLogs = await db.getAll('export_logs');
    const conteoExportacion = await db.getAll('conteo_exportacion');
    const configLogoInst = await db.get('config', 'logo_instrumentacion');
    const configLogoPot = await db.get('config', 'logo_potencia');
    const configDrive = await db.get('config', 'driveFolderLink');
    const configPermissions = await db.get('config', 'rolePermissions');
    const configPassword = await db.get('config', 'adminPassword');
    
    // Cargar sesión guardada si existe
    const savedSession = localStorage.getItem('user_session');
    let initialSession = null;
    try {
      initialSession = savedSession ? JSON.parse(savedSession) : null;
    } catch (e) {
      console.error('Error al parsear la sesión guardada:', e);
      localStorage.removeItem('user_session');
    }

    // Valores por defecto
    const defaultPermissions: Record<UserRole, RolePermissions> = {
      ADMIN: { admin: true, dashboard: true, nuevo: true, fotos: true, galeria: true, perfiles: true, historial: true, generar: true },
      TECNICO: { admin: false, dashboard: false, nuevo: true, fotos: true, galeria: true, perfiles: true, historial: true, generar: true },
      INVITADO: { admin: false, dashboard: false, nuevo: false, fotos: false, galeria: true, perfiles: true, historial: false, generar: true }
    };

    // Combinar permisos guardados con los de por defecto para asegurar que nuevas llaves existan
    const finalPermissions = { ...defaultPermissions };
    if (configPermissions?.value) {
      Object.keys(configPermissions.value).forEach((role) => {
        const r = role as UserRole;
        finalPermissions[r] = { ...defaultPermissions[r], ...configPermissions.value[r] };
      });
    }

    set({ 
      perfiles, 
      fotos, 
      instrumentos: instrumentosLocal, 
      potenciaEquipos: potenciaEquiposLocal,
      exportLogs: exportLogs || [],
      conteoExportacion: conteoExportacion || [],
      logoInstrumentacion: configLogoInst?.value || null,
      logoPotencia: configLogoPot?.value || null,
      driveFolderLink: configDrive?.value || null,
      rolePermissions: finalPermissions,
      adminPassword: configPassword?.value || '123',
      session: initialSession,
      isInitialized: true
    });

    // Supabase auth listeners disabled in direct access mode
    console.log('App cargada en modo Directo (ADMIN)');

    // Cargar Configuración Global desde Supabase (Logos y Drive)
    try {
      const { data: remoteConfig, error: configError } = await supabase.from('app_config').select('*');
      if (remoteConfig && !configError) {
        const logoInstItem = remoteConfig.find(c => c.id === 'logo_instrumentacion');
        const logoPotItem = remoteConfig.find(c => c.id === 'logo_potencia');
        const driveItem = remoteConfig.find(c => c.id === 'drive_folder_link');
        const permsItem = remoteConfig.find(c => c.id === 'role_permissions');
        const passItem = remoteConfig.find(c => c.id === 'admin_password');

        if (logoInstItem) {
          await db.put('config', { id: 'logo_instrumentacion', value: logoInstItem.value });
          set({ logoInstrumentacion: logoInstItem.value });
        }
        if (logoPotItem) {
          await db.put('config', { id: 'logo_potencia', value: logoPotItem.value });
          set({ logoPotencia: logoPotItem.value });
        }
        if (driveItem) {
          await db.put('config', { id: 'driveFolderLink', value: driveItem.value });
          set({ driveFolderLink: driveItem.value });
        }
        if (permsItem) {
          await db.put('config', { id: 'rolePermissions', value: permsItem.value });
          set({ rolePermissions: permsItem.value });
        }
        if (passItem) {
          await db.put('config', { id: 'adminPassword', value: passItem.value });
          set({ adminPassword: passItem.value });
        }
      }
    } catch (e) {
      console.warn('Error cargando configuración remota:', e);
    }

    // Cargar Instrumentos desde Supabase (Fuente de Verdad)
    try {
      const { data: remoteInst, error: instError } = await supabase.from('instrumentos').select('*');
      if (remoteInst && !instError) {
        const mappedInst = remoteInst.map(i => ({
          TAG_CABLE_SWC: i.tag_cable_swc,
          TAGNAME: i.tagname,
          DESCRIPCIÓN: i.descripcion,
          TIPO_CABLE: i.tipo_cable,
          UBICACIÓN: i.ubicacion,
          OBSERVACIÓN: i.observacion
        }));
        
        // Actualizar localmente también para que funcione offline
        const tx = db.transaction('instrumentos', 'readwrite');
        await tx.store.clear();
        for (const item of mappedInst) await tx.store.put(item);
        await tx.done;

        set({ instrumentos: mappedInst });
        console.log('Instrumentos cargados desde Supabase');
      }

      // Cargar Potencia Equipos desde Supabase
      const { data: remotePotencia, error: potError } = await supabase.from('potencia_equipos').select('*');
      if (remotePotencia && !potError) {
        const mappedPotencia = remotePotencia.map(p => ({
          TAG: p.tag,
          DESCRIPCIÓN: p.descripcion
        }));
        
        const tx = db.transaction('potencia_equipos', 'readwrite');
        await tx.store.clear();
        for (const item of mappedPotencia) await tx.store.put(item);
        await tx.done;

        set({ potenciaEquipos: mappedPotencia });
        console.log('Equipos de Potencia cargados desde Supabase');
      }

      // Cargar Perfiles desde Supabase
      const { data: remotePerfiles, error: perfError } = await supabase.from('perfiles').select('*');
      if (remotePerfiles && !perfError && remotePerfiles.length > 0) {
        const mappedPerfiles = remotePerfiles.map(p => ({
          ID_PERFIL: p.id_perfil,
          NOMBRE_PERFIL: p.nombre_perfil || '',
          CLIENTE: p.cliente || '',
          PROYECTO: p.proyecto || '',
          CONTRATO: p.contrato || '',
          REVISION: p.revision || '',
          FECHA_REVISION: p.fecha_revision || '',
          FECHA: p.fecha || '',
          TAG_CABLE_SWC: p.tag_cable_swc || '',
          TAGNAME: p.tagname || '',
          DESCRIPCION: p.descripcion || '',
          TIPO_CABLE: p.tipo_cable || '',
          TIPO: p.tipo || 'INSTRUMENTACION',
          POT_CODIGO: p.pot_codigo || '',
          AC1_NO: p.ac1_no || '',
          HC1_NO: p.hc1_no || '',
          CONTRATISTA: p.contratista || '',
          AREA: p.area || '',
          LOCACION: p.locacion || '',
          SERVICIO: p.servicio || '',
          P_ID_NO: p.p_id_no || '',
          REV_P_ID: p.rev_p_id || '',
          PAQUETE_NO: p.paquete_no || '',
          PLANO_NO: p.plano_no || '',
          REV_PLANO: p.rev_plano || '',
          CHKL_1_DESC: p.chkl_1_desc || '', CHKL_1_ESTADO: p.chkl_1_estado || '',
          CHKL_2_DESC: p.chkl_2_desc || '', CHKL_2_ESTADO: p.chkl_2_estado || '',
          CHKL_3_DESC: p.chkl_3_desc || '', CHKL_3_ESTADO: p.chkl_3_estado || '',
          CHKL_4_DESC: p.chkl_4_desc || '', CHKL_4_ESTADO: p.chkl_4_estado || '',
          CHKL_5_DESC: p.chkl_5_desc || '', CHKL_5_ESTADO: p.chkl_5_estado || '',
          CHKL_6_DESC: p.chkl_6_desc || '', CHKL_6_ESTADO: p.chkl_6_estado || '',
          CHKL_7_DESC: p.chkl_7_desc || '', CHKL_7_ESTADO: p.chkl_7_estado || '',
          CHKL_8_DESC: p.chkl_8_desc || '', CHKL_8_ESTADO: p.chkl_8_estado || '',
          CHKL_9_DESC: p.chkl_9_desc || '', CHKL_9_ESTADO: p.chkl_9_estado || '',
          CHKL_10_DESC: p.chkl_10_desc || '', CHKL_10_ESTADO: p.chkl_10_estado || '',
          CHKL_11_DESC: p.chkl_11_desc || '', CHKL_11_ESTADO: p.chkl_11_estado || '',
          POT_COMPANIA_1: p.pot_compania_1 || '', POT_FIRMA_1: p.pot_firma_1 || '', POT_NOMBRE_1: p.pot_nombre_1 || '', POT_FECHA_1: p.pot_fecha_1 || '',
          POT_COMPANIA_2: p.pot_compania_2 || '', POT_FIRMA_2: p.pot_firma_2 || '', POT_NOMBRE_2: p.pot_nombre_2 || '', POT_FECHA_2: p.pot_fecha_2 || '',
          POT_COMPANIA_3: p.pot_compania_3 || '', POT_FIRMA_3: p.pot_firma_3 || '', POT_NOMBRE_3: p.pot_nombre_3 || '', POT_FECHA_3: p.pot_fecha_3 || '',
          POT_COM_DATA: p.pot_com_data || '',
          UBICACION: p.ubicacion || '',
          OBSERVACION: p.observacion || '',
          FABRICANTE_MODELO: p.fabricante_modelo || '',
          RANGO_OPERACION: p.rango_operacion || '',
          CLASE_EXACTITUD: p.clase_exactitud || '',
          NORMA_PROCEDIMIENTO: p.norma_procedimiento || '',
          TIPO_PRUEBA_PLANO: p.tipo_prueba_plano || false,
          TIPO_PRUEBA_LOOP: p.tipo_prueba_loop || false,
          TIPO_PRUEBA_FUNC_SIM: p.tipo_prueba_func_sim || false,
          TIPO_PRUEBA_FUNC_LINEA: p.tipo_prueba_func_linea || false,
          EQUIPO_PRUEBA_1: p.equipo_prueba_1 || '',
          CERT_FECHA_1: p.cert_fecha_1 || '',
          EQUIPO_PRUEBA_2: p.equipo_prueba_2 || '',
          CERT_FECHA_2: p.cert_fecha_2 || '',
          LOOP_C1: p.loop_c1 || '', LOOP_C2: p.loop_c2 || '', LOOP_C3: p.loop_c3 || '',
          L1_C1: p.l1_c1 || '', L1_C2: p.l1_c2 || '', L1_C3: p.l1_c3 || '',
          L2_C1: p.l2_c1 || '', L2_C2: p.l2_c2 || '', L2_C3: p.l2_c3 || '',
          L3_C1: p.l3_c1 || '', L3_C2: p.l3_c2 || '', L3_C3: p.l3_c3 || '',
          INSP_4_1: p.insp_4_1 || '', OBS_4_1: p.obs_4_1 || '', LABEL_4_1: p.label_4_1 || '',
          INSP_4_2: p.insp_4_2 || '', OBS_4_2: p.obs_4_2 || '', LABEL_4_2: p.label_4_2 || '',
          INSP_4_3: p.insp_4_3 || '', OBS_4_3: p.obs_4_3 || '', LABEL_4_3: p.label_4_3 || '',
          INSP_4_4: p.insp_4_4 || '', OBS_4_4: p.obs_4_4 || '', LABEL_4_4: p.label_4_4 || '',
          COMENTARIOS: p.comentarios || '',
          ELABORO_NOMBRE: p.elaboro_nombre || '', ELABORO_CARGO: p.elaboro_cargo || '', ELABORO_FIRMA: p.elaboro_firma || '',
          REVISO_NOMBRE: p.reviso_nombre || '', REVISO_CARGO: p.reviso_cargo || '', REVISO_FIRMA: p.reviso_firma || '',
          APROBO_NOMBRE: p.aprobo_nombre || '', APROBO_CARGO: p.aprobo_cargo || '', APROBO_FIRMA: p.aprobo_firma || '',
          timestamp: p.timestamp || p.created_at,
          USER_EMAIL: p.user_email || ''
        }));
        const txP = db.transaction('perfiles', 'readwrite');
        await txP.store.clear();
        for (const item of mappedPerfiles) await txP.store.put(item);
        await txP.done;
        set({ perfiles: mappedPerfiles });
      }

      // Cargar Fotos desde Supabase
      const { data: remoteFotos, error: fotosError } = await supabase.from('fotos').select('*');
      if (remoteFotos && !fotosError && remoteFotos.length > 0) {
        const mappedFotos = remoteFotos.map(f => ({
          id: f.id,
          TAGNAME: f.tagname || '',
          blobData: f.blob_data || '',
          nombre_archivo: f.nombre_archivo || '',
          observacion: f.observacion || '',
          estado: f.estado || '',
          timestamp: f.created_at
        }));
        const txF = db.transaction('fotos', 'readwrite');
        await txF.store.clear();
        for (const item of mappedFotos) await txF.store.put(item);
        await txF.done;
        set({ fotos: mappedFotos });
      }
    } catch (e) {
      console.warn('Operando en modo offline:', e);
    }
  },

  syncWithSupabase: async () => {
    const { perfiles, fotos, instrumentos, potenciaEquipos } = get();
    
    // 1. Sincronizar perfiles
    if (perfiles.length > 0) {
      const perfilesToSync = perfiles.map(p => ({
        id_perfil: p.ID_PERFIL,
        tipo: p.TIPO || 'INSTRUMENTACION',
        nombre_perfil: p.NOMBRE_PERFIL,
        cliente: p.CLIENTE,
        proyecto: p.PROYECTO,
        contrato: p.CONTRATO,
        revision: p.REVISION,
        fecha_revision: p.FECHA_REVISION,
        fecha: p.FECHA,
        tag_cable_swc: p.TAG_CABLE_SWC,
        tagname: p.TAGNAME,
        descripcion: p.DESCRIPCION,
        tipo_cable: p.TIPO_CABLE,
        ubicacion: p.UBICACION,
        observacion: p.OBSERVACION,
        fabricante_modelo: p.FABRICANTE_MODELO || '',
        rango_operacion: p.RANGO_OPERACION || '',
        clase_exactitud: p.CLASE_EXACTITUD || '',
        norma_procedimiento: p.NORMA_PROCEDIMIENTO,
        tipo_prueba_plano: p.TIPO_PRUEBA_PLANO,
        tipo_prueba_loop: p.TIPO_PRUEBA_LOOP,
        tipo_prueba_func_sim: p.TIPO_PRUEBA_FUNC_SIM,
        tipo_prueba_func_linea: p.TIPO_PRUEBA_FUNC_LINEA,
        equipo_prueba_1: p.EQUIPO_PRUEBA_1,
        cert_fecha_1: p.CERT_FECHA_1,
        equipo_prueba_2: p.EQUIPO_PRUEBA_2,
        cert_fecha_2: p.CERT_FECHA_2,
        loop_c1: p.LOOP_C1, loop_c2: p.LOOP_C2, loop_c3: p.LOOP_C3,
        l1_c1: p.L1_C1, l1_c2: p.L1_C2, l1_c3: p.L1_C3,
        l2_c1: p.L2_C1, l2_c2: p.L2_C2, l2_c3: p.L2_C3,
        l3_c1: p.L3_C1, l3_c2: p.L3_C2, l3_c3: p.L3_C3,
        insp_4_1: p.INSP_4_1, obs_4_1: p.OBS_4_1, label_4_1: p.LABEL_4_1,
        insp_4_2: p.INSP_4_2, obs_4_2: p.OBS_4_2, label_4_2: p.LABEL_4_2,
        insp_4_3: p.INSP_4_3, obs_4_3: p.OBS_4_3, label_4_3: p.LABEL_4_3,
        insp_4_4: p.INSP_4_4, obs_4_4: p.OBS_4_4, label_4_4: p.LABEL_4_4,
        comentarios: p.COMENTARIOS,
        elaboro_nombre: p.ELABORO_NOMBRE, elaboro_cargo: p.ELABORO_CARGO, elaboro_firma: p.ELABORO_FIRMA,
        reviso_nombre: p.REVISO_NOMBRE, reviso_cargo: p.REVISO_CARGO, reviso_firma: p.REVISO_FIRMA,
        aprobo_nombre: p.APROBO_NOMBRE, aprobo_cargo: p.APROBO_CARGO, aprobo_firma: p.APROBO_FIRMA,
        user_email: p.USER_EMAIL || '',
        pot_codigo: p.POT_CODIGO,
        ac1_no: p.AC1_NO,
        hc1_no: p.HC1_NO,
        contratista: p.CONTRATISTA,
        area: p.AREA,
        locacion: p.LOCACION,
        servicio: p.SERVICIO,
        p_id_no: p.P_ID_NO,
        rev_p_id: p.REV_P_ID,
        paquete_no: p.PAQUETE_NO,
        plano_no: p.PLANO_NO,
        rev_plano: p.REV_PLANO,
        chkl_1_desc: p.CHKL_1_DESC, chkl_1_estado: p.CHKL_1_ESTADO,
        chkl_2_desc: p.CHKL_2_DESC, chkl_2_estado: p.CHKL_2_ESTADO,
        chkl_3_desc: p.CHKL_3_DESC, chkl_3_estado: p.CHKL_3_ESTADO,
        chkl_4_desc: p.CHKL_4_DESC, chkl_4_estado: p.CHKL_4_ESTADO,
        chkl_5_desc: p.CHKL_5_DESC, chkl_5_estado: p.CHKL_5_ESTADO,
        chkl_6_desc: p.CHKL_6_DESC, chkl_6_estado: p.CHKL_6_ESTADO,
        chkl_7_desc: p.CHKL_7_DESC, chkl_7_estado: p.CHKL_7_ESTADO,
        chkl_8_desc: p.CHKL_8_DESC, chkl_8_estado: p.CHKL_8_ESTADO,
        chkl_9_desc: p.CHKL_9_DESC, chkl_9_estado: p.CHKL_9_ESTADO,
        chkl_10_desc: p.CHKL_10_DESC, chkl_10_estado: p.CHKL_10_ESTADO,
        chkl_11_desc: p.CHKL_11_DESC, chkl_11_estado: p.CHKL_11_ESTADO,
        pot_compania_1: p.POT_COMPANIA_1, pot_firma_1: p.POT_FIRMA_1, pot_nombre_1: p.POT_NOMBRE_1, pot_fecha_1: p.POT_FECHA_1,
        pot_compania_2: p.POT_COMPANIA_2, pot_firma_2: p.POT_FIRMA_2, pot_nombre_2: p.POT_NOMBRE_2, pot_fecha_2: p.POT_FECHA_2,
        pot_compania_3: p.POT_COMPANIA_3, pot_firma_3: p.POT_FIRMA_3, pot_nombre_3: p.POT_NOMBRE_3, pot_fecha_3: p.POT_FECHA_3,
        pot_com_data: p.POT_COM_DATA || ''
      }));
      for (let i = 0; i < perfilesToSync.length; i += 500) {
        const { error } = await supabase.from('perfiles').upsert(perfilesToSync.slice(i, i + 500));
        if (error) console.error('Error syncing perfiles:', error);
      }
    }

    // 2. Sincronizar instrumentos
    if (instrumentos.length > 0) {
      const uniqueDataMap = new Map();
      for (const item of instrumentos) {
        if (item.TAGNAME && item.TAGNAME.toString().trim() !== '') {
          uniqueDataMap.set(item.TAGNAME.toString().trim(), item);
        }
      }
      
      const instrumentosToSync = Array.from(uniqueDataMap.values()).map(i => ({
        tag_cable_swc: i.TAG_CABLE_SWC,
        tagname: i.TAGNAME.toString().trim(),
        descripcion: i.DESCRIPCIÓN,
        tipo_cable: i.TIPO_CABLE,
        ubicacion: i.UBICACIÓN,
        observacion: i.OBSERVACIÓN
      }));
      
      for (let i = 0; i < instrumentosToSync.length; i += 500) {
        const { error } = await supabase.from('instrumentos').upsert(instrumentosToSync.slice(i, i + 500), { onConflict: 'tagname' });
        if (error) {
          console.error('Error syncing instrumentos:', error);
        }
      }
    }

    // 3. Sincronizar potenciaEquipos
    if (potenciaEquipos.length > 0) {
      const uniqueDataMap = new Map();
      for (const item of potenciaEquipos) {
        if (item.TAG && item.TAG.toString().trim() !== '') {
          uniqueDataMap.set(item.TAG.toString().trim(), item);
        }
      }
      
      const toSync = Array.from(uniqueDataMap.values()).map(i => ({
        tag: i.TAG.toString().trim(),
        descripcion: i.DESCRIPCIÓN
      }));
      
      for (let i = 0; i < toSync.length; i += 500) {
        const { error } = await supabase.from('potencia_equipos').upsert(toSync.slice(i, i + 500), { onConflict: 'tag' });
        if (error) console.error('Error syncing potencia_equipos:', error);
      }
    }

    // 4. Sincronizar fotos
    if (fotos.length > 0) {
      const fotosToSync = fotos.map(f => ({
        id: f.id,
        tagname: f.TAGNAME,
        blob_data: f.blobData,
        nombre_archivo: f.nombre_archivo,
        observacion: f.observacion,
        estado: f.estado
      }));
      for (let i = 0; i < fotosToSync.length; i += 50) {
        const { error } = await supabase.from('fotos').upsert(fotosToSync.slice(i, i + 50));
        if (error) console.error('Error syncing fotos:', error);
      }
    }

    // 4. Sincronizar logs de exportación
    const { exportLogs, conteoExportacion } = get();
    if (exportLogs.length > 0) {
      for (let i = 0; i < exportLogs.length; i += 500) {
        const chunk = exportLogs.slice(i, i + 500).map(log => ({
          id: log.id,
          user_email: log.user_email,
          tagname: log.tagname,
          tipo_formato: log.tipo_formato,
          id_perfil: log.id_perfil,
          timestamp: log.timestamp
        }));
        const { error } = await supabase.from('export_logs').upsert(chunk);
        if (error) console.warn('Error syncing export_logs:', error);
      }
    }

    // 5. Sincronizar conteo de exportación
    if (conteoExportacion.length > 0) {
      for (let i = 0; i < conteoExportacion.length; i += 500) {
        const chunk = conteoExportacion.slice(i, i + 500).map(item => ({
          id: item.id,
          tag: item.tag,
          conteo: item.conteo,
          fecha_hora: item.fecha_hora,
          user_role: item.user_role,
          user_email: item.user_email
        }));
        const { error } = await supabase.from('conteo_exportacion').upsert(chunk);
        if (error) console.warn('Error syncing conteo_exportacion:', error);
      }
    }
  },

  savePerfil: async (perfil) => {
    const db = await initDB();
    const session = get().session;
    const userEmail = session?.user?.email || '';

    const profileToSave = { ...perfil, USER_EMAIL: perfil.USER_EMAIL || userEmail };
    await db.put('perfiles', profileToSave);
    
    let supabaseError = null;

    // Intentar sincronizar con Supabase
    try {
      const payload: any = {
        id_perfil: perfil.ID_PERFIL,
        tipo: perfil.TIPO || 'INSTRUMENTACION',
        nombre_perfil: perfil.NOMBRE_PERFIL || '',
        cliente: perfil.CLIENTE || '',
        proyecto: perfil.PROYECTO || '',
        contrato: perfil.CONTRATO || '',
        revision: perfil.REVISION || '',
        fecha_revision: perfil.FECHA_REVISION || '',
        fecha: perfil.FECHA || '',
        tag_cable_swc: perfil.TAG_CABLE_SWC || '',
        tagname: perfil.TAGNAME || '',
        descripcion: perfil.DESCRIPCION || '',
        tipo_cable: perfil.TIPO_CABLE || '',
        ubicacion: perfil.UBICACION || '',
        observacion: perfil.OBSERVACION || '',
        fabricante_modelo: perfil.FABRICANTE_MODELO || '',
        rango_operacion: perfil.RANGO_OPERACION || '',
        clase_exactitud: perfil.CLASE_EXACTITUD || '',
        norma_procedimiento: perfil.NORMA_PROCEDIMIENTO || '',
        tipo_prueba_plano: perfil.TIPO_PRUEBA_PLANO || false,
        tipo_prueba_loop: perfil.TIPO_PRUEBA_LOOP || false,
        tipo_prueba_func_sim: perfil.TIPO_PRUEBA_FUNC_SIM || false,
        tipo_prueba_func_linea: perfil.TIPO_PRUEBA_FUNC_LINEA || false,
        equipo_prueba_1: perfil.EQUIPO_PRUEBA_1 || '',
        cert_fecha_1: perfil.CERT_FECHA_1 || '',
        equipo_prueba_2: perfil.EQUIPO_PRUEBA_2 || '',
        cert_fecha_2: perfil.CERT_FECHA_2 || '',
        loop_c1: perfil.LOOP_C1 || '', loop_c2: perfil.LOOP_C2 || '', loop_c3: perfil.LOOP_C3 || '',
        l1_c1: perfil.L1_C1 || '', l1_c2: perfil.L1_C2 || '', l1_c3: perfil.L1_C3 || '',
        l2_c1: perfil.L2_C1 || '', l2_c2: perfil.L2_C2 || '', l2_c3: perfil.L2_C3 || '',
        l3_c1: perfil.L3_C1 || '', l3_c2: perfil.L3_C2 || '', l3_c3: perfil.L3_C3 || '',
        insp_4_1: perfil.INSP_4_1 || '', obs_4_1: perfil.OBS_4_1 || '', label_4_1: perfil.LABEL_4_1 || '',
        insp_4_2: perfil.INSP_4_2 || '', obs_4_2: perfil.OBS_4_2 || '', label_4_2: perfil.LABEL_4_2 || '',
        insp_4_3: perfil.INSP_4_3 || '', obs_4_3: perfil.OBS_4_3 || '', label_4_3: perfil.LABEL_4_3 || '',
        insp_4_4: perfil.INSP_4_4 || '', obs_4_4: perfil.OBS_4_4 || '', label_4_4: perfil.LABEL_4_4 || '',
        comentarios: perfil.COMENTARIOS || '',
        elaboro_nombre: perfil.ELABORO_NOMBRE || '', elaboro_cargo: perfil.ELABORO_CARGO || '', elaboro_firma: perfil.ELABORO_FIRMA || '',
        reviso_nombre: perfil.REVISO_NOMBRE || '', reviso_cargo: perfil.REVISO_CARGO || '', reviso_firma: perfil.REVISO_FIRMA || '',
        aprobo_nombre: perfil.APROBO_NOMBRE || '', aprobo_cargo: perfil.APROBO_CARGO || '', aprobo_firma: perfil.APROBO_FIRMA || '',
        timestamp: perfil.timestamp || new Date().toISOString(),
        user_email: perfil.USER_EMAIL || userEmail,
        pot_codigo: perfil.POT_CODIGO,
        ac1_no: perfil.AC1_NO,
        hc1_no: perfil.HC1_NO,
        contratista: perfil.CONTRATISTA,
        area: perfil.AREA,
        locacion: perfil.LOCACION,
        servicio: perfil.SERVICIO,
        p_id_no: perfil.P_ID_NO,
        rev_p_id: perfil.REV_P_ID,
        paquete_no: perfil.PAQUETE_NO,
        plano_no: perfil.PLANO_NO,
        rev_plano: perfil.REV_PLANO,
        chkl_1_desc: perfil.CHKL_1_DESC, chkl_1_estado: perfil.CHKL_1_ESTADO,
        chkl_2_desc: perfil.CHKL_2_DESC, chkl_2_estado: perfil.CHKL_2_ESTADO,
        chkl_3_desc: perfil.CHKL_3_DESC, chkl_3_estado: perfil.CHKL_3_ESTADO,
        chkl_4_desc: perfil.CHKL_4_DESC, chkl_4_estado: perfil.CHKL_4_ESTADO,
        chkl_5_desc: perfil.CHKL_5_DESC, chkl_5_estado: perfil.CHKL_5_ESTADO,
        chkl_6_desc: perfil.CHKL_6_DESC, chkl_6_estado: perfil.CHKL_6_ESTADO,
        chkl_7_desc: perfil.CHKL_7_DESC, chkl_7_estado: perfil.CHKL_7_ESTADO,
        chkl_8_desc: perfil.CHKL_8_DESC, chkl_8_estado: perfil.CHKL_8_ESTADO,
        chkl_9_desc: perfil.CHKL_9_DESC, chkl_9_estado: perfil.CHKL_9_ESTADO,
        chkl_10_desc: perfil.CHKL_10_DESC, chkl_10_estado: perfil.CHKL_10_ESTADO,
        chkl_11_desc: perfil.CHKL_11_DESC, chkl_11_estado: perfil.CHKL_11_ESTADO,
        pot_compania_1: perfil.POT_COMPANIA_1, pot_firma_1: perfil.POT_FIRMA_1, pot_nombre_1: perfil.POT_NOMBRE_1, pot_fecha_1: perfil.POT_FECHA_1,
        pot_compania_2: perfil.POT_COMPANIA_2, pot_firma_2: perfil.POT_FIRMA_2, pot_nombre_2: perfil.POT_NOMBRE_2, pot_fecha_2: perfil.POT_FECHA_2,
        pot_compania_3: perfil.POT_COMPANIA_3, pot_firma_3: perfil.POT_FIRMA_3, pot_nombre_3: perfil.POT_NOMBRE_3, pot_fecha_3: perfil.POT_FECHA_3,
        pot_com_data: perfil.POT_COM_DATA || ''
      };

      const { data: existingRemote } = await supabase.from('perfiles').select('id_perfil').eq('id_perfil', perfil.ID_PERFIL).maybeSingle();
      
      let res;
      if (!existingRemote) {
        res = await supabase.from('perfiles').insert(payload);
      } else {
        res = await supabase.from('perfiles').update(payload).eq('id_perfil', perfil.ID_PERFIL);
      }

      if (res.error) {
        if (res.error.message.includes('user_email')) {
          delete payload.user_email;
          const retryRes = !existingRemote ? 
            await supabase.from('perfiles').insert(payload) : 
            await supabase.from('perfiles').update(payload).eq('id_perfil', perfil.ID_PERFIL);
          if (retryRes.error) supabaseError = retryRes.error.message;
        } else {
          supabaseError = res.error.message;
        }
      }

      if (perfil.TAGNAME) {
        if (perfil.TIPO === 'INSTRUMENTACION') {
          const instData = {
            TAGNAME: perfil.TAGNAME,
            TAG_CABLE_SWC: perfil.TAG_CABLE_SWC || '',
            DESCRIPCIÓN: perfil.DESCRIPCION || '',
            TIPO_CABLE: perfil.TIPO_CABLE || '',
            UBICACIÓN: perfil.UBICACION || '',
            OBSERVACIÓN: perfil.OBSERVACION || ''
          };
          await db.put('instrumentos', instData);
          set((state) => ({
            instrumentos: [...state.instrumentos.filter(i => i.TAGNAME !== perfil.TAGNAME), instData]
          }));

          const instPayload = {
            tagname: perfil.TAGNAME,
            tag_cable_swc: perfil.TAG_CABLE_SWC || '',
            descripcion: perfil.DESCRIPCION || '',
            tipo_cable: perfil.TIPO_CABLE || '',
            ubicacion: perfil.UBICACION || '',
            observacion: perfil.OBSERVACION || ''
          };

          const { data: existingInst } = await supabase.from('instrumentos').select('tagname').eq('tagname', perfil.TAGNAME).maybeSingle();
          if (!existingInst) {
            await supabase.from('instrumentos').insert(instPayload);
          } else {
            await supabase.from('instrumentos').update(instPayload).eq('tagname', perfil.TAGNAME);
          }
        } else {
          // Es POTENCIA o POTENCIA_COM
          const potData = {
            TAG: perfil.TAGNAME,
            DESCRIPCIÓN: perfil.DESCRIPCION || ''
          };
          await db.put('potencia_equipos', potData);
          set((state) => ({
            potenciaEquipos: [...state.potenciaEquipos.filter(i => i.TAG !== perfil.TAGNAME), potData]
          }));

          const potPayload = {
            tag: perfil.TAGNAME,
            descripcion: perfil.DESCRIPCION || ''
          };

          const { data: existingPot } = await supabase.from('potencia_equipos').select('tag').eq('tag', perfil.TAGNAME).maybeSingle();
          if (!existingPot) {
            await supabase.from('potencia_equipos').insert(potPayload);
          } else {
            await supabase.from('potencia_equipos').update(potPayload).eq('tag', perfil.TAGNAME);
          }
        }
      }
    } catch (e: any) {
      supabaseError = e.message;
    }

    set((state) => ({ 
      perfiles: [...state.perfiles.filter(p => p.ID_PERFIL !== perfil.ID_PERFIL), profileToSave] 
    }));

    return supabaseError ? { success: false, error: supabaseError } : { success: true };
  },

  deletePerfil: async (id) => {
    if (!id) {
      console.error('deletePerfil called with invalid ID:', id);
      throw new Error('ID_PERFIL is required to delete a profile');
    }
    const db = await initDB();
    try {
      await db.delete('perfiles', id);
    } catch (dbError) {
      console.error('Error deleting from local DB:', dbError);
      throw new Error('Local DB deletion failed');
    }
    
    // Actualizar estado local inmediatamente
    set((state) => ({ perfiles: state.perfiles.filter(p => p.ID_PERFIL !== id) }));

    // Intento de borrar en Supabase (no bloqueante)
    try {
      const { error } = await supabase.from('perfiles').delete().eq('id_perfil', id);
      if (error) console.error('Error al borrar perfil en Supabase:', error);
    } catch (e) {
      console.warn('Error de red al borrar en Supabase:', e);
    }
  },

  saveFoto: async (fotoData) => {
    const db = await initDB();
    await db.put('fotos', fotoData);
    
    set((state) => ({ 
      fotos: [...state.fotos.filter(f => f.id !== fotoData.id), fotoData] 
    }));

    try {
      const { error } = await supabase.from('fotos').upsert({
        id: fotoData.id,
        tagname: fotoData.TAGNAME,
        blob_data: fotoData.blobData,
        nombre_archivo: fotoData.nombre_archivo,
        observacion: fotoData.observacion,
        estado: fotoData.estado
      });
      if (error) console.error('Error al guardar foto en Supabase:', error);
    } catch (e) {
      console.warn('Error de red al guardar foto en Supabase:', e);
    }
  },

  deleteFoto: async (id) => {
    const db = await initDB();
    await db.delete('fotos', id);
    
    // Actualizar estado local inmediatamente
    set((state) => ({ fotos: state.fotos.filter(p => p.id !== id) }));

    try {
      const { error } = await supabase.from('fotos').delete().eq('id', id);
      if (error) console.error('Error al borrar foto en Supabase:', error);
    } catch (e) {
      console.warn('Error de red al borrar foto en Supabase:', e);
    }
  },

  loadInstrumentosBulk: async (dataArray) => {
    // Deduplicate array by TAGNAME (keep the last occurrence)
    const uniqueDataMap = new Map();
    for (const item of dataArray) {
      if (item.TAGNAME && item.TAGNAME.toString().trim() !== '') {
        uniqueDataMap.set(item.TAGNAME.toString().trim(), item);
      }
    }
    const deduplicatedArray = Array.from(uniqueDataMap.values());

    const db = await initDB();
    const tx = db.transaction('instrumentos', 'readwrite');
    await tx.store.clear();
    // Use put in batch if possible, or just loop
    for (const item of deduplicatedArray) tx.store.put(item);
    await tx.done;

    // Sync remote
    const remoteData = deduplicatedArray.map(i => ({
      tag_cable_swc: i.TAG_CABLE_SWC,
      tagname: i.TAGNAME.toString().trim(),
      descripcion: i.DESCRIPCIÓN,
      tipo_cable: i.TIPO_CABLE,
      ubicacion: i.UBICACIÓN,
      observacion: i.OBSERVACIÓN
    }));
    
    // Process in chunks of 500 to avoid payload size errors
    const chunkSize = 500;
    const promises = [];
    for (let i = 0; i < remoteData.length; i += chunkSize) {
      const chunk = remoteData.slice(i, i + chunkSize);
      promises.push(supabase.from('instrumentos').upsert(chunk, { onConflict: 'tagname' }));
    }
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some chunks failed to sync to Supabase:', errors);
    } else {
      console.log('Bulk data synced successfully to Supabase');
    }

    set({ instrumentos: deduplicatedArray });
  },

  saveExportLog: async (logInfo) => {
    const session = get().session;
    if (!session) return;
    
    const newLog: ExportLog = {
      ...logInfo,
      id: crypto.randomUUID(),
      user_email: session.user.email,
      user_role: session.role,
      timestamp: new Date().toISOString(),
    };
    
    const db = await initDB();
    await db.add('export_logs', newLog);
    
    set((state) => ({
      exportLogs: [newLog, ...state.exportLogs]
    }));

    // Sincronizar log con Supabase (intentar)
    try {
      await supabase.from('export_logs').insert({
        id: newLog.id,
        user_email: newLog.user_email,
        user_role: newLog.user_role,
        tagname: newLog.tagname,
        tipo_formato: newLog.tipo_formato,
        id_perfil: newLog.id_perfil,
        timestamp: newLog.timestamp
      });
    } catch (e) {
      console.warn('No se pudo respaldar el log en la nube (Supabase table export_logs might not exist)', e);
    }
  },

  saveConteoExportacion: async (tag) => {
    const session = get().session;
    if (!session || session.role !== 'TECNICO') return;
    
    const newRecord: ConteoExportacion = {
      id: crypto.randomUUID(),
      tag,
      conteo: 1,
      fecha_hora: new Date().toISOString(),
      user_role: session.role,
      user_email: session.user.email
    };
    
    const db = await initDB();
    await db.add('conteo_exportacion', newRecord);
    
    set((state) => ({
      conteoExportacion: [newRecord, ...state.conteoExportacion]
    }));

    // Sincronizar con Supabase
    try {
      await supabase.from('conteo_exportacion').insert({
        id: newRecord.id,
        tag: newRecord.tag,
        conteo: newRecord.conteo,
        fecha_hora: newRecord.fecha_hora,
        user_role: newRecord.user_role,
        user_email: newRecord.user_email
      });
    } catch (e) {
      console.warn('No se pudo respaldar conteo en la nube:', e);
    }
  },

  deleteInstrumentos: async (tagnames: string[]) => {
    const db = await initDB();
    const session = get().session;
    try {
      // 1. Local Delete
      const tx = db.transaction('instrumentos', 'readwrite');
      for (const tag of tagnames) {
        tx.store.delete(tag);
      }
      await tx.done;

      // 2. Update state
      set((state) => ({ instrumentos: state.instrumentos.filter(i => !tagnames.includes(i.TAGNAME)) }));

      // 3. Cloud (Supabase) Delete
      try {
        await supabase.from('instrumentos').delete().in('tagname', tagnames);
      } catch (e) {
        console.warn('Error deleting from supabase: ', e);
      }

      // 4. Log in exportLog with tipo_formato as 'DELETED'
      if (session) {
        for (const tag of tagnames) {
          const logInfo: Omit<ExportLog, 'id' | 'timestamp' | 'user_email'> = { tagname: tag, tipo_formato: 'DELETED', id_perfil: '' };
          get().saveExportLog(logInfo);
        }
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Error al eliminar: ' + e.message };
    }
  },

  addInstrumento: async (inst: Instrumento) => {
    const db = await initDB();
    
    // 1. Verificación rápida local
    const exists = await db.get('instrumentos', inst.TAGNAME);
    if (exists) return { success: false, error: 'Este TAG ya existe localmente.' };
    
    // 2. Guardado local y actualización inmediata del estado (Optimistic UI)
    try {
      await db.put('instrumentos', inst);
      set((state) => ({ instrumentos: [...state.instrumentos, inst] }));
    } catch (e: any) {
      return { success: false, error: 'Error al guardar localmente: ' + e.message };
    }
    
    // 3. Sincronización con la nube (Supabase)
    try {
      const { error } = await supabase.from('instrumentos').insert([{
        tag_cable_swc: inst.TAG_CABLE_SWC || '',
        tagname: inst.TAGNAME,
        descripcion: inst.DESCRIPCIÓN || '',
        tipo_cable: inst.TIPO_CABLE || '',
        ubicacion: inst.UBICACIÓN || '',
        observacion: inst.OBSERVACIÓN || ''
      }]);

      if (error) {
        console.error('Error de Supabase (Sincronización diferida):', error);
        return { 
          success: true, 
          error: `Guardado local: OK. Sincronización nube: FALLÓ (${error.message})` 
        };
      }
    } catch (e: any) {
      console.error('Excepción en Supabase:', e);
      return { 
        success: true, 
        error: `Guardado local: OK. Error de red nube: ${e.message}` 
      };
    }

    return { success: true };
  },

  deletePotenciaEquipos: async (tagnames: string[]) => {
    const db = await initDB();
    const session = get().session;
    try {
      const tx = db.transaction('potencia_equipos', 'readwrite');
      for (const tag of tagnames) {
        tx.store.delete(tag);
      }
      await tx.done;

      set((state) => ({ potenciaEquipos: state.potenciaEquipos.filter(i => !tagnames.includes(i.TAG)) }));

      try {
        await supabase.from('potencia_equipos').delete().in('tag', tagnames);
      } catch (e) {
        console.warn('Error deleting from supabase: ', e);
      }

      if (session) {
        for (const tag of tagnames) {
          const logInfo: Omit<ExportLog, 'id' | 'timestamp' | 'user_email'> = { tagname: tag, tipo_formato: 'DELETED', id_perfil: '' };
          get().saveExportLog(logInfo);
        }
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: 'Error al eliminar: ' + e.message };
    }
  },

  loadPotenciaEquiposBulk: async (dataArray) => {
    const uniqueDataMap = new Map();
    for (const item of dataArray) {
      if (item.TAG && item.TAG.toString().trim() !== '') {
        uniqueDataMap.set(item.TAG.toString().trim(), item);
      }
    }
    const deduplicatedArray = Array.from(uniqueDataMap.values());

    const db = await initDB();
    const tx = db.transaction('potencia_equipos', 'readwrite');
    await tx.store.clear();
    for (const item of deduplicatedArray) tx.store.put(item);
    await tx.done;

    const remoteData = deduplicatedArray.map(i => ({
      tag: i.TAG.toString().trim(),
      descripcion: i.DESCRIPCIÓN
    }));
    
    const chunkSize = 500;
    const promises = [];
    for (let i = 0; i < remoteData.length; i += chunkSize) {
      const chunk = remoteData.slice(i, i + chunkSize);
      promises.push(supabase.from('potencia_equipos').upsert(chunk, { onConflict: 'tag' }));
    }
    
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Some chunks failed to sync to Supabase:', errors);
    }

    set({ potenciaEquipos: deduplicatedArray });
  },

  addPotenciaEquipo: async (inst: PotenciaEquipo) => {
    const db = await initDB();
    const exists = await db.get('potencia_equipos', inst.TAG);
    if (exists) return { success: false, error: 'Este TAG ya existe localmente.' };
    
    try {
      await db.put('potencia_equipos', inst);
      set((state) => ({ potenciaEquipos: [...state.potenciaEquipos, inst] }));
    } catch (e: any) {
      return { success: false, error: 'Error al guardar localmente: ' + e.message };
    }
    
    try {
      const { error } = await supabase.from('potencia_equipos').insert([{
        tag: inst.TAG,
        descripcion: inst.DESCRIPCIÓN || ''
      }]);

      if (error) {
        return { 
          success: true, 
          error: `Guardado local: OK. Sincronización nube: FALLÓ (${error.message})` 
        };
      }
    } catch (e: any) {
      return { 
        success: true, 
        error: `Guardado local: OK. Error de red nube: ${e.message}` 
      };
    }

    return { success: true };
  },

  saveLogo: async (base64, type) => {
    const db = await initDB();
    const configId = type === 'INSTRUMENTACION' ? 'logo_instrumentacion' : 'logo_potencia';
    await db.put('config', { id: configId, value: base64 });
    if (type === 'INSTRUMENTACION') {
      set({ logoInstrumentacion: base64 });
    } else {
      set({ logoPotencia: base64 });
    }

    try {
      await supabase.from('app_config').upsert({ id: configId, value: base64 });
    } catch (e) {
      console.warn('Error syncing logo:', e);
    }
  },

  updateRolePermissions: async (role, permissions) => {
    const { rolePermissions } = get();
    const updatedPermissions = {
      ...rolePermissions,
      [role]: { ...rolePermissions[role], ...permissions }
    };
    
    const db = await initDB();
    await db.put('config', { id: 'rolePermissions', value: updatedPermissions });
    set({ rolePermissions: updatedPermissions });

    // Intentar sincronizar con app_config en Supabase si existe
    try {
      await supabase.from('app_config').upsert({ id: 'role_permissions', value: updatedPermissions });
    } catch (e) {
      console.warn('No se pudo respaldar permisos en la nube:', e);
    }
  },

  updateAdminPassword: async (newPassword) => {
    const db = await initDB();
    await db.put('config', { id: 'adminPassword', value: newPassword });
    set({ adminPassword: newPassword });

    try {
      await supabase.from('app_config').upsert({ id: 'admin_password', value: newPassword });
    } catch (e) {
      console.warn('No se pudo respaldar password en la nube:', e);
    }
  },

  saveDriveFolderLink: async (link: string) => {
    const db = await initDB();
    await db.put('config', { id: 'driveFolderLink', value: link });
    set({ driveFolderLink: link });

    try {
      await supabase.from('app_config').upsert({ id: 'drive_folder_link', value: link });
    } catch (e) {
      console.warn('Error syncing drive link:', e);
    }
  }
}));
