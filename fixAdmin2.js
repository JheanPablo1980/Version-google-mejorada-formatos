import * as fs from 'fs';

let txt = fs.readFileSync('src/components/Admin.tsx', 'utf8');

const targetIdx = txt.indexOf('const handlePasswordChange');
const injectStr = `
  const [isSyncing, setIsSyncing] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [confirmStep, setConfirmStep] = useState(0);
  const [showInstruments, setShowInstruments] = useState(false);
  const [showPotencia, setShowPotencia] = useState(false);

  const { syncWithSupabase, clearInstrumentos, clearPotenciaEquipos, clearFotos, clearPerfiles } = useAppStore();

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => alert(msg);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncWithSupabase();
      showNotification('Sincronización completa');
    } catch {
      showNotification('Error sincronizando', 'error');
    }
    setIsSyncing(false);
  };

  const handleClearInstrumentos = async () => {
    setIsClearing(true);
    await clearInstrumentos();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Instrumentos limpiados');
  };

  const handleClearPotencia = async () => {
    setIsClearing(true);
    await clearPotenciaEquipos();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Potencia limpiada');
  };

  const handleClearFotos = async () => {
    setIsClearing(true);
    await clearFotos();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Fotos limpiadas');
  };

  const handleClearPerfiles = async () => {
    setIsClearing(true);
    await clearPerfiles();
    setIsClearing(false);
    setConfirmStep(0);
    showNotification('Perfiles limpiados');
  };

  const handleTotalReset = async () => {
    setIsClearing(true);
    await totalFactoryReset();
    setIsClearing(false);
    setShowResetConfirm(false);
    showNotification('Reinicio de fábrica completado');
  };
`;

txt = txt.substring(0, targetIdx) + injectStr + txt.substring(targetIdx);

// Also fix the import error (PhoneSweep)
txt = txt.replace('PhoneSweep, ', '');

fs.writeFileSync('src/components/Admin.tsx', txt);
