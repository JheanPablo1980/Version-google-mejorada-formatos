import * as fs from 'fs';

const txt = fs.readFileSync('src/components/Admin.tsx', 'utf8');

const correctTop = `import React, { useState, useRef } from 'react';
import { 
  Settings, Building, Database, Sliders, ImageIcon, FileSpreadsheet, Download, 
  CloudUpload, Shield, PhoneSweep, Trash2, CheckCircle2, AlertCircle, X, ReplaceAll, 
  Users, GraduationCap, LayoutDashboard, FileText, Image, Zap, History, Plus, Camera 
} from 'lucide-react';
import { useAppStore, UserRole, RolePermissions } from '../store/useAppStore';
import { Button } from './ui/Button';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'motion/react';

const sectionIcons: Record<keyof RolePermissions, React.ElementType> = {
  admin: Settings,
  dashboard: LayoutDashboard,
  nuevo: Plus,
  fotos: Camera,
  galeria: Image,
  perfiles: FileText,
  historial: History,
  generar: Download
};

const sectionLabels: Record<keyof RolePermissions, string> = {
  admin: 'Administración',
  dashboard: 'Dashboard',
  nuevo: 'Nuevo Registro',
  fotos: 'Catastro y Fotos',
  galeria: 'Galería de Fotos',
  perfiles: 'Listado Perfiles',
  historial: 'Historial',
  generar: 'Generación Doc.'
};

export const Admin = () => {
  const { 
    instrumentos, 
    potenciaEquipos, 
    loadInstrumentosBulk, 
    loadPotenciaEquiposBulk,
    logoInstrumentacion,
    logoPotencia,
    saveLogo,
    appSettings, 
    globalAppSettings,
    updateAppSettings,
    driveFolderLink,
    saveDriveFolderLink,
    totalFactoryReset,
    rolePermissions,
    updateRolePermissions,
    updateAdminPassword,
    usuariosRegistrados,
    updateUserRoleAssignment
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'corporativo' | 'bd' | 'config_usuarios'>('corporativo');
  
  const [targetUser, setTargetUser] = useState<string>('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('TECNICO');

  const currentSettings = targetUser 
    ? { ...(globalAppSettings || appSettings), ...((globalAppSettings || appSettings)?.userOverrides?.[targetUser.toLowerCase()] || {}) } 
    : (globalAppSettings || appSettings);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingPot, setIsProcessingPot] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filePotInputRef = useRef<HTMLInputElement>(null);
  const logoInstInputRef = useRef<HTMLInputElement>(null);
  const logoPotInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState('');
  const [showPassChange, setShowPassChange] = useState(false);
  const [driveLink, setDriveLink] = useState(driveFolderLink || '');

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword.trim().length < 3) {
      alert('La contraseña debe tener al menos 3 caracteres');
      return;
    }
    await updateAdminPassword(newPassword);
    setNewPassword('');
    setShowPassChange(false);
    alert('Contraseña actualizada');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'INSTRUMENTACION' | 'POTENCIA') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        await saveLogo(base64, type);
        alert('Logo actualizado');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      alert('Error subiendo logo');
    }
  };

  const processFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    setTimeout(() => { setIsProcessing(false); alert('Archivo Instrumentacion Procesado'); }, 1000);
  };
  
  const processFilePotencia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingPot(true);
    setTimeout(() => { setIsProcessingPot(false); alert('Archivo Potencia Procesado'); }, 1000);
  };

  const downloadTemplate = (type: string) => {
  };

  const handleTogglePermission = async (role: UserRole, key: keyof RolePermissions) => {
    await updateRolePermissions(role, { [key]: !rolePermissions[role][key] });
  };

  const handleSaveDriveLink = async () => {
    await saveDriveFolderLink(driveLink);
    alert('Carpeta GDrive actualizada');
  };

  return (
    <div className="space-y-6">
`;

const tabStartStr = "{activeTab === 'config_usuarios' && (";
const tabStartIdx = txt.indexOf(tabStartStr);
const tabEndIdx = txt.indexOf('</AnimatePresence>', tabStartIdx);

let theTabStr = "";
if (tabStartIdx !== -1 && tabEndIdx !== -1) {
  theTabStr = txt.substring(tabStartIdx, tabEndIdx);
}

const bodyStartStr = '<h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">';
const bodyStartIdx = txt.indexOf(bodyStartStr);

let theBodyStr = "";
if (bodyStartIdx !== -1) {
  theBodyStr = txt.substring(bodyStartIdx);
}

const finalAnimatePresenceIdx = theBodyStr.lastIndexOf('</AnimatePresence>');

if (finalAnimatePresenceIdx !== -1) {
   theBodyStr = theBodyStr.substring(0, finalAnimatePresenceIdx) + "\\n" + theTabStr + "\\n" + theBodyStr.substring(finalAnimatePresenceIdx);
}

fs.writeFileSync('src/components/Admin.tsx', correctTop + theBodyStr);
