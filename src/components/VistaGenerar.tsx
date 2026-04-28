import React, { useState } from 'react';
import { Download, Camera, Printer, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Button } from './ui/Button';
import ExcelJS from 'exceljs';

export const VistaGenerar: React.FC = () => {
  const { instrumentos, perfiles, fotos, logoBase64, saveExportLog } = useAppStore();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const tagsConFotos = [...new Set(fotos.map(f => f.TAGNAME))];
  const instrumentosConFotos = instrumentos.filter(inst => tagsConFotos.includes(inst.TAGNAME));

  const activeProfile = perfiles.find(p => p.ID_PERFIL === selectedProfile);

  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSelectAll = () => {
    if (selectedTags.length === instrumentosConFotos.length) setSelectedTags([]); 
    else setSelectedTags(instrumentosConFotos.map(i => i.TAGNAME)); 
  };

  const [exportError, setExportError] = useState<string | null>(null);

  const logExportAction = async (tipo: 'EXCEL' | 'PDF') => {
    if (!activeProfile) return;
    setExportError(null);
    for (const tag of selectedTags) {
       await saveExportLog({
         tagname: tag,
         tipo_formato: tipo,
         id_perfil: activeProfile.ID_PERFIL
       });
    }
  };

  const exportarExcel = async () => {
    if (selectedTags.length === 0 || !activeProfile) { 
      setExportError("Selecciona al menos un instrumento y un perfil."); 
      return; 
    }
    setIsExporting(true);
    setExportError(null);
    try {
      // Log backup
      await logExportAction('EXCEL');
      const wb = new ExcelJS.Workbook();
      
      const applyStyle = (cell: any, isHeader = false) => {
        if (isHeader) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3864' } };
          cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri', size: 10 };
        } else {
          cell.font = { name: 'Calibri', size: 10 };
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = { 
          top: {style:'thin'}, 
          left: {style:'thin'}, 
          bottom: {style:'thin'}, 
          right: {style:'thin'} 
        };
      };

      for (const tag of selectedTags) {
        const activeInstrument = instrumentos.find(i => i.TAGNAME === tag);
        const fotosDelTag = fotos.filter(f => f.TAGNAME === tag);
        
        if (!activeInstrument) continue;

        const safeSheetName = tag.replace(/[\\*?:\/\[\]]/g, '').substring(0, 26);
        const ws1 = wb.addWorksheet(`${safeSheetName}`);
        
        ws1.columns = [
          { width: 10 }, { width: 10 }, { width: 25 }, { width: 12 }, 
          { width: 12 }, { width: 10 }, { width: 15 }, { width: 15 }
        ];
        
        // Logo
        ws1.mergeCells('A1:B2'); applyStyle(ws1.getCell('A1'));
        if (logoBase64) {
          try {
            const logoId = wb.addImage({ 
              base64: logoBase64.split(',')[1], 
              extension: 'png' 
            });
            ws1.addImage(logoId, { tl: { col: 0.1, row: 0.1 }, ext: { width: 120, height: 35 } });
          } catch (e) {
            console.error("Error embedding logo", e);
          }
        }

        ws1.mergeCells('C1:F2'); ws1.getCell('C1').value = 'PROTOCOLO DE PRUEBAS DE INSTRUMENTACIÓN'; applyStyle(ws1.getCell('C1'), true); 
        ws1.getCell('G1').value = 'REVISIÓN:'; applyStyle(ws1.getCell('G1'), true);
        ws1.getCell('H1').value = activeProfile.REVISION; applyStyle(ws1.getCell('H1'));
        ws1.getCell('G2').value = 'FECHA DE REVISIÓN:'; applyStyle(ws1.getCell('G2'), true);
        ws1.getCell('H2').value = activeProfile.FECHA_REVISION; applyStyle(ws1.getCell('H2'));

        ws1.getCell('A3').value = 'CLIENTE:'; applyStyle(ws1.getCell('A3'), true);
        ws1.mergeCells('B3:E3'); ws1.getCell('B3').value = activeProfile.CLIENTE; applyStyle(ws1.getCell('B3')); ws1.getCell('B3').alignment = {horizontal:'left'};
        ws1.mergeCells('F3:G3'); ws1.getCell('F3').value = 'FECHA:'; applyStyle(ws1.getCell('F3'), true); ws1.getCell('F3').alignment = {horizontal:'left'};
        ws1.getCell('H3').value = activeProfile.FECHA; applyStyle(ws1.getCell('H3')); ws1.getCell('H3').alignment = {horizontal:'left'};

        ws1.getCell('A4').value = 'PROYECTO:'; applyStyle(ws1.getCell('A4'), true);
        ws1.mergeCells('B4:E4'); ws1.getCell('B4').value = activeProfile.PROYECTO; applyStyle(ws1.getCell('B4')); ws1.getCell('B4').alignment = {horizontal:'left'};
        ws1.mergeCells('F4:G4'); ws1.getCell('F4').value = 'CONTRATO:'; applyStyle(ws1.getCell('F4'), true); ws1.getCell('F4').alignment = {horizontal:'left'};
        ws1.getCell('H4').value = activeProfile.CONTRATO; applyStyle(ws1.getCell('H4')); ws1.getCell('H4').alignment = {horizontal:'left'};

        // 1. INFORMACIÓN GENERAL
        ws1.mergeCells('A6:H6'); ws1.getCell('A6').value = '1. INFORMACIÓN GENERAL DEL INSTRUMENTO'; applyStyle(ws1.getCell('A6'), true); ws1.getCell('A6').alignment = {horizontal:'left'};
            ws1.mergeCells('A7:B7'); ws1.getCell('A7').value = 'Tag No:'; applyStyle(ws1.getCell('A7'), true); ws1.getCell('A7').alignment = {horizontal:'left'};
        ws1.mergeCells('C7:D7'); ws1.getCell('C7').value = activeInstrument.TAGNAME; applyStyle(ws1.getCell('C7')); ws1.getCell('C7').alignment = {horizontal:'left'};
        ws1.mergeCells('E7:F7'); ws1.getCell('E7').value = 'Fabricante/Modelo:'; applyStyle(ws1.getCell('E7'), true); ws1.getCell('E7').alignment = {horizontal:'left'};
        ws1.mergeCells('G7:H7'); ws1.getCell('G7').value = activeProfile.FABRICANTE_MODELO || 'N/A'; applyStyle(ws1.getCell('G7')); ws1.getCell('G7').alignment = {horizontal:'left'};
        
        ws1.mergeCells('A8:B8'); ws1.getCell('A8').value = 'Tipo Cable / Desc:'; applyStyle(ws1.getCell('A8'), true); ws1.getCell('A8').alignment = {horizontal:'left'};
        ws1.mergeCells('C8:H8'); ws1.getCell('C8').value = `${activeInstrument.TIPO_CABLE} / ${activeInstrument.DESCRIPCIÓN}`; applyStyle(ws1.getCell('C8')); ws1.getCell('C8').alignment = {horizontal:'left'};
        
        ws1.mergeCells('A9:B9'); ws1.getCell('A9').value = 'Rango de Operación:'; applyStyle(ws1.getCell('A9'), true); ws1.getCell('A9').alignment = {horizontal:'left'};
        ws1.mergeCells('C9:D9'); ws1.getCell('C9').value = activeProfile.RANGO_OPERACION || 'N/A'; applyStyle(ws1.getCell('C9')); ws1.getCell('C9').alignment = {horizontal:'left'};
        ws1.mergeCells('E9:F9'); ws1.getCell('E9').value = 'Clase de Exactitud:'; applyStyle(ws1.getCell('E9'), true); ws1.getCell('E9').alignment = {horizontal:'left'};
        ws1.mergeCells('G9:H9'); ws1.getCell('G9').value = activeProfile.CLASE_EXACTITUD || 'N/A'; applyStyle(ws1.getCell('G9')); ws1.getCell('G9').alignment = {horizontal:'left'};
 
        ws1.mergeCells('A10:B10'); ws1.getCell('A10').value = 'Ubicación:'; applyStyle(ws1.getCell('A10'), true); ws1.getCell('A10').alignment = {horizontal:'left'};
        ws1.mergeCells('C10:D10'); ws1.getCell('C10').value = activeInstrument.UBICACIÓN; applyStyle(ws1.getCell('C10')); ws1.getCell('C10').alignment = {horizontal:'left'};
        ws1.mergeCells('E10:F10'); ws1.getCell('E10').value = 'Tag Cable SWC:'; applyStyle(ws1.getCell('E10'), true); ws1.getCell('E10').alignment = {horizontal:'left'};
        ws1.mergeCells('G10:H10'); ws1.getCell('G10').value = activeInstrument.TAG_CABLE_SWC || 'N/A'; applyStyle(ws1.getCell('G10')); ws1.getCell('G10').alignment = {horizontal:'left'};

        // 2. CONDICIONES DE LA PRUEBA
        ws1.mergeCells('A12:H12'); ws1.getCell('A12').value = '2. CONDICIONES DE LA PRUEBA'; applyStyle(ws1.getCell('A12'), true); ws1.getCell('A12').alignment = {horizontal:'left'};
        ws1.mergeCells('A13:B13'); ws1.getCell('A13').value = 'Norma/Procedimiento:'; applyStyle(ws1.getCell('A13'), true); ws1.getCell('A13').alignment = {horizontal:'left'};
        ws1.mergeCells('C13:H13'); ws1.getCell('C13').value = activeProfile.NORMA_PROCEDIMIENTO; applyStyle(ws1.getCell('C13')); ws1.getCell('C13').alignment = {horizontal:'left'};
        
        ws1.mergeCells('A14:B15'); ws1.getCell('A14').value = 'Tipo de Prueba:'; applyStyle(ws1.getCell('A14'), true); ws1.getCell('A14').alignment = {horizontal:'left', vertical:'middle'};
        ws1.mergeCells('C14:E14'); ws1.getCell('C14').value = activeProfile.TIPO_PRUEBA_PLANO ? '☑ Equipo instalado en ubicación/PLANO' : '☐ Equipo instalado en ubicación/PLANO'; applyStyle(ws1.getCell('C14')); ws1.getCell('C14').alignment = {horizontal:'left'};
        ws1.mergeCells('F14:H14'); ws1.getCell('F14').value = activeProfile.TIPO_PRUEBA_FUNC_SIM ? '☑ Prueba funcional simulada' : '☐ Prueba funcional simulada'; applyStyle(ws1.getCell('F14')); ws1.getCell('F14').alignment = {horizontal:'left'};
        ws1.mergeCells('C15:E15'); ws1.getCell('C15').value = activeProfile.TIPO_PRUEBA_LOOP ? '☑ Pruebas de lazo (loop check)' : '☐ Pruebas de lazo (loop check)'; applyStyle(ws1.getCell('C15')); ws1.getCell('C15').alignment = {horizontal:'left'};
        ws1.mergeCells('F15:H15'); ws1.getCell('F15').value = activeProfile.TIPO_PRUEBA_FUNC_LINEA ? '☑ Prueba funcional acoplada a línea' : '☐ Prueba funcional acoplada a línea'; applyStyle(ws1.getCell('F15')); ws1.getCell('F15').alignment = {horizontal:'left'};

        ws1.mergeCells('A16:B16'); ws1.getCell('A16').value = 'Equipo de prueba 1:'; applyStyle(ws1.getCell('A16'), true); ws1.getCell('A16').alignment = {horizontal:'left'};
        ws1.mergeCells('C16:E16'); ws1.getCell('C16').value = activeProfile.EQUIPO_PRUEBA_1; applyStyle(ws1.getCell('C16')); ws1.getCell('C16').alignment = {horizontal:'left'};
        ws1.mergeCells('F16:G16'); ws1.getCell('F16').value = 'Certificado/Fecha de Vigencia:'; applyStyle(ws1.getCell('F16'), true); ws1.getCell('F16').alignment = {horizontal:'left'};
        ws1.getCell('H16').value = activeProfile.CERT_FECHA_1; applyStyle(ws1.getCell('H16')); ws1.getCell('H16').alignment = {horizontal:'left'};

        ws1.mergeCells('A17:B17'); ws1.getCell('A17').value = 'Equipo de prueba 2:'; applyStyle(ws1.getCell('A17'), true); ws1.getCell('A17').alignment = {horizontal:'left'};
        ws1.mergeCells('C17:E17'); ws1.getCell('C17').value = activeProfile.EQUIPO_PRUEBA_2; applyStyle(ws1.getCell('C17')); ws1.getCell('C17').alignment = {horizontal:'left'};
        ws1.mergeCells('F17:G17'); ws1.getCell('F17').value = 'Certificado/Fecha de Vigencia:'; applyStyle(ws1.getCell('F17'), true); ws1.getCell('F17').alignment = {horizontal:'left'};
        ws1.getCell('H17').value = activeProfile.CERT_FECHA_2; applyStyle(ws1.getCell('H17')); ws1.getCell('H17').alignment = {horizontal:'left'};

        // 3. Pruebas de Lazo (Loop Check)
        ws1.mergeCells('A19:H19'); ws1.getCell('A19').value = '3. PRUEBAS DE LAZO (LOOP CHECK)'; applyStyle(ws1.getCell('A19'), true); ws1.getCell('A19').alignment = {horizontal:'left'};
        ws1.mergeCells('A20:C20'); ws1.getCell('A20').value = activeProfile.LOOP_C1 || ''; applyStyle(ws1.getCell('A20'), true);
        ws1.mergeCells('D20:E20'); ws1.getCell('D20').value = activeProfile.LOOP_C2 || ''; applyStyle(ws1.getCell('D20'), true);
        ws1.mergeCells('F20:H20'); ws1.getCell('F20').value = activeProfile.LOOP_C3 || ''; applyStyle(ws1.getCell('F20'), true);

        const addLoopRow = (r: number, v1: string, v2: string, v3: string) => {
          ws1.mergeCells(`A${r}:C${r}`); ws1.getCell(`A${r}`).value = v1; applyStyle(ws1.getCell(`A${r}`));
          ws1.mergeCells(`D${r}:E${r}`); ws1.getCell(`D${r}`).value = v2; applyStyle(ws1.getCell(`D${r}`));
          ws1.mergeCells(`F${r}:H${r}`); ws1.getCell(`F${r}`).value = v3; applyStyle(ws1.getCell(`F${r}`));
        };
        addLoopRow(21, activeProfile.L1_C1, activeProfile.L1_C2, activeProfile.L1_C3);
        addLoopRow(22, activeProfile.L2_C1, activeProfile.L2_C2, activeProfile.L2_C3);
        addLoopRow(23, activeProfile.L3_C1, activeProfile.L3_C2, activeProfile.L3_C3);

        // 4. Inspección
        ws1.mergeCells('A25:H25'); ws1.getCell('A25').value = '4. INSPECCIÓN'; applyStyle(ws1.getCell('A25'), true); ws1.getCell('A25').alignment = {horizontal:'left'};
        ws1.mergeCells('A26:D26'); ws1.getCell('A26').value = 'Ítem Revisado'; applyStyle(ws1.getCell('A26'), true);
        ws1.getCell('E26').value = 'Estado'; applyStyle(ws1.getCell('E26'), true);
        ws1.mergeCells('F26:H26'); ws1.getCell('F26').value = 'Observaciones'; applyStyle(ws1.getCell('F26'), true);

        const addInspRow = (r: number, label: string, val: string, obs: string) => {
          ws1.mergeCells(`A${r}:D${r}`); ws1.getCell(`A${r}`).value = label; applyStyle(ws1.getCell(`A${r}`)); ws1.getCell(`A${r}`).alignment = {horizontal:'left', wrapText:true};
          ws1.getCell(`E${r}`).value = val; applyStyle(ws1.getCell(`E${r}`));
          ws1.mergeCells(`F${r}:H${r}`); ws1.getCell(`F${r}`).value = obs; applyStyle(ws1.getCell(`F${r}`)); ws1.getCell(`F${r}`).alignment = {horizontal:'left', wrapText:true};
        };
        addInspRow(27, activeProfile.LABEL_4_1, activeProfile.INSP_4_1, activeProfile.OBS_4_1);
        addInspRow(28, activeProfile.LABEL_4_2, activeProfile.INSP_4_2, activeProfile.OBS_4_2);
        addInspRow(29, activeProfile.LABEL_4_3, activeProfile.INSP_4_3, activeProfile.OBS_4_3);
        addInspRow(30, activeProfile.LABEL_4_4, activeProfile.INSP_4_4, activeProfile.OBS_4_4);

        // 5. Comentarios
        ws1.mergeCells('A32:H32'); ws1.getCell('A32').value = '5. COMENTARIOS'; applyStyle(ws1.getCell('A32'), true); ws1.getCell('A32').alignment = {horizontal:'left'};
        ws1.mergeCells('A33:H34'); ws1.getCell('A33').value = activeProfile.COMENTARIOS; applyStyle(ws1.getCell('A33')); ws1.getCell('A33').alignment = {vertical: 'top', horizontal:'left', wrapText:true};

        let currentRow = 36;

        // FOTOS
        if (fotosDelTag.length > 0) {
          ws1.mergeCells(`A${currentRow}:H${currentRow}`); 
          ws1.getCell(`A${currentRow}`).value = `6. REGISTRO FOTOGRÁFICO`; 
          applyStyle(ws1.getCell(`A${currentRow}`), true); 
          ws1.getCell(`A${currentRow}`).alignment = {horizontal:'left'};
          currentRow++;

          fotosDelTag.forEach((foto, idx) => {
            const isLeft = idx % 2 === 0;
            const rowOffset = Math.floor(idx / 2) * 16;
            const r = currentRow + rowOffset;
            const colStart = isLeft ? 'A' : 'E';
            const colEnd = isLeft ? 'D' : 'H';
            const colIdx = isLeft ? 0 : 4;

            ws1.mergeCells(`${colStart}${r}:${colEnd}${r+14}`);
            applyStyle(ws1.getCell(`${colStart}${r}`));
            try {
              const imageId = wb.addImage({ 
                base64: foto.blobData.split(',')[1], 
                extension: 'jpeg' 
              });
              ws1.addImage(imageId, { 
                tl: { col: colIdx + 0.1, row: r - 1 + 0.1 }, 
                ext: { width: 330, height: 230 } 
              });
            } catch (e) {
              console.error("Error adding photo to spreadsheet", e);
            }

            ws1.mergeCells(`${colStart}${r+15}:${colEnd}${r+15}`);
            ws1.getCell(`${colStart}${r+15}`).value = foto.observacion || `Foto ${idx+1}`; 
            applyStyle(ws1.getCell(`${colStart}${r+15}`));
          });

          currentRow += Math.ceil(fotosDelTag.length / 2) * 16 + 1;
        }

        // Firmas
        ws1.mergeCells(`A${currentRow}:B${currentRow}`); ws1.getCell(`A${currentRow}`).value = 'ELABORÓ'; applyStyle(ws1.getCell(`A${currentRow}`), true);
        ws1.mergeCells(`D${currentRow}:E${currentRow}`); ws1.getCell(`D${currentRow}`).value = 'REVISÓ'; applyStyle(ws1.getCell(`D${currentRow}`), true);
        ws1.mergeCells(`G${currentRow}:H${currentRow}`); ws1.getCell(`G${currentRow}`).value = 'APROBÓ (CLIENTE / INTERVENTOR)'; applyStyle(ws1.getCell(`G${currentRow}`), true);
        
        ws1.mergeCells(`A${currentRow+1}:B${currentRow+1}`); ws1.getCell(`A${currentRow+1}`).value = `NOMBRE: ${activeProfile.ELABORO_NOMBRE}`; applyStyle(ws1.getCell(`A${currentRow+1}`)); ws1.getCell(`A${currentRow+1}`).alignment = {horizontal:'left'};
        ws1.mergeCells(`D${currentRow+1}:E${currentRow+1}`); ws1.getCell(`D${currentRow+1}`).value = `NOMBRE: ${activeProfile.REVISO_NOMBRE}`; applyStyle(ws1.getCell(`D${currentRow+1}`)); ws1.getCell('D' + (currentRow+1)).alignment = {horizontal:'left'};
        ws1.mergeCells(`G${currentRow+1}:H${currentRow+1}`); ws1.getCell(`G${currentRow+1}`).value = `NOMBRE: ${activeProfile.APROBO_NOMBRE}`; applyStyle(ws1.getCell(`G${currentRow+1}`)); ws1.getCell('G' + (currentRow+1)).alignment = {horizontal:'left'};

        ws1.mergeCells(`A${currentRow+2}:B${currentRow+2}`); ws1.getCell(`A${currentRow+2}`).value = `CARGO: ${activeProfile.ELABORO_CARGO}`; applyStyle(ws1.getCell(`A${currentRow+2}`)); ws1.getCell('A' + (currentRow+2)).alignment = {horizontal:'left'};
        ws1.mergeCells(`D${currentRow+2}:E${currentRow+2}`); ws1.getCell(`D${currentRow+2}`).value = `CARGO: ${activeProfile.REVISO_CARGO}`; applyStyle(ws1.getCell(`D${currentRow+2}`)); ws1.getCell('D' + (currentRow+2)).alignment = {horizontal:'left'};
        ws1.mergeCells(`G${currentRow+2}:H${currentRow+2}`); ws1.getCell(`G${currentRow+2}`).value = `CARGO: ${activeProfile.APROBO_CARGO}`; applyStyle(ws1.getCell(`G${currentRow+2}`)); ws1.getCell('G' + (currentRow+2)).alignment = {horizontal:'left'};

        ws1.mergeCells(`A${currentRow+3}:B${currentRow+5}`); ws1.getCell(`A${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`A${currentRow+3}`)); ws1.getCell(`A${currentRow+3}`).font = { bold: true }; ws1.getCell(`A${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};
        ws1.mergeCells(`D${currentRow+3}:E${currentRow+5}`); ws1.getCell(`D${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`D${currentRow+3}`)); ws1.getCell(`D${currentRow+3}`).font = { bold: true }; ws1.getCell(`D${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};
        ws1.mergeCells(`G${currentRow+3}:H${currentRow+5}`); ws1.getCell(`G${currentRow+3}`).value = 'FIRMA:'; applyStyle(ws1.getCell(`G${currentRow+3}`)); ws1.getCell(`G${currentRow+3}`).font = { bold: true }; ws1.getCell(`G${currentRow+3}`).alignment = {vertical:'top', horizontal:'left'};

        ws1.mergeCells(`A${currentRow+6}:B${currentRow+6}`); ws1.getCell(`A${currentRow+6}`).value = `FECHA: ${activeProfile.FECHA}`; applyStyle(ws1.getCell(`A${currentRow+6}`)); ws1.getCell('A' + (currentRow+6)).alignment = {horizontal:'left'};
        ws1.mergeCells(`D${currentRow+6}:E${currentRow+6}`); ws1.getCell(`D${currentRow+6}`).value = `FECHA: ${activeProfile.FECHA}`; applyStyle(ws1.getCell(`D${currentRow+6}`)); ws1.getCell('D' + (currentRow+6)).alignment = {horizontal:'left'};
        ws1.mergeCells(`G${currentRow+6}:H${currentRow+6}`); ws1.getCell(`G${currentRow+6}`).value = `FECHA: ${activeProfile.FECHA}`; applyStyle(ws1.getCell(`G${currentRow+6}`)); ws1.getCell('G' + (currentRow+6)).alignment = {horizontal:'left'};

        const embedSig = (b64: string, col: number, row: number) => {
          if (!b64) return;
          try {
            const imageId = wb.addImage({ 
              base64: b64.split(',')[1], 
              extension: 'png' 
            });
            ws1.addImage(imageId, { tl: { col: col + 0.1, row: row + 0.5 }, ext: { width: 130, height: 40 } });
          } catch (e) {
            console.error("Error embedding signature", e);
          }
        };
        embedSig(activeProfile.ELABORO_FIRMA, 0, currentRow+3);
        embedSig(activeProfile.REVISO_FIRMA, 3, currentRow+3);
        embedSig(activeProfile.APROBO_FIRMA, 6, currentRow+3);
      }

      const buffer = await wb.xlsx.writeBuffer();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buffer]));
      a.download = selectedTags.length === 1 ? `Protocolo_${selectedTags[0]}.xlsx` : `Protocolos_Masivos_${selectedTags.length}TAGs.xlsx`;
      a.click();
    } catch (e) { 
      setExportError("Error generando Excel."); 
      console.error(e);
    } finally { 
      setIsExporting(false); 
    }
  };

  const exportarPDF = async () => {
    if (selectedTags.length === 0 || !activeProfile) { 
        setExportError("Selecciona instrumentos y perfil para generar PDF."); 
        return; 
    }
    setExportError(null);
    
    // Log backup
    await logExportAction('PDF');
    
    let allHtmlContent = '';

    selectedTags.forEach((tag, index) => {
      const activeInstrument = instrumentos.find(i => i.TAGNAME === tag);
      const fotosDelTag = fotos.filter(f => f.TAGNAME === tag);

      if (!activeInstrument) return;

      allHtmlContent += `
        <div class="protocol-page">
          <table class="main-table">
            <tr>
              <td rowspan="2" width="20%" class="center" style="padding: 4px;">
                ${logoBase64 ? `<img src="${logoBase64}" style="max-width:90%; max-height:45px; object-fit:contain;" />` : 'LOGO'}
              </td>
              <td rowspan="2" width="50%" class="bg-blue" style="font-size:14px;">PROTOCOLO DE PRUEBAS DE INSTRUMENTACIÓN</td>
              <td class="bg-gray" width="15%">REVISIÓN:</td>
              <td class="center" width="15%">${activeProfile.REVISION}</td>
            </tr>
            <tr>
              <td class="bg-gray">FECHA DE REVISIÓN:</td>
              <td class="center">${activeProfile.FECHA_REVISION}</td>
            </tr>
          </table>

          <table class="main-table">
            <tr>
              <td class="bg-gray" width="15%">CLIENTE:</td>
              <td width="35%">${activeProfile.CLIENTE}</td>
              <td class="bg-gray" width="15%">FECHA:</td>
              <td width="35%">${activeProfile.FECHA}</td>
            </tr>
            <tr>
              <td class="bg-gray">PROYECTO:</td>
              <td>${activeProfile.PROYECTO}</td>
              <td class="bg-gray">CONTRATO:</td>
              <td>${activeProfile.CONTRATO}</td>
            </tr>
          </table>

          <table class="main-table">
            <tr><td colspan="4" class="bg-blue">1. INFORMACIÓN GENERAL DEL INSTRUMENTO</td></tr>
            <tr>
              <td class="bg-gray" width="20%">Tag No:</td>
              <td class="bold uppercase" width="30%">${activeInstrument.TAGNAME}</td>
              <td class="bg-gray" width="20%">Fabricante/Modelo:</td>
              <td width="30%">${activeProfile.FABRICANTE_MODELO || 'N/A'}</td>
            </tr>
            <tr>
              <td class="bg-gray">Tipo Cable / Desc:</td>
              <td colspan="3" class="uppercase">${activeInstrument.TIPO_CABLE} / ${activeInstrument.DESCRIPCIÓN}</td>
            </tr>
            <tr>
              <td class="bg-gray">Rango de Operación:</td>
              <td>${activeProfile.RANGO_OPERACION || 'N/A'}</td>
              <td class="bg-gray">Clase de Exactitud:</td>
              <td>${activeProfile.CLASE_EXACTITUD || 'N/A'}</td>
            </tr>
            <tr>
              <td class="bg-gray">Ubicación:</td>
              <td class="uppercase">${activeInstrument.UBICACIÓN}</td>
              <td class="bg-gray">Tag Cable SWC:</td>
              <td class="uppercase">${activeInstrument.TAG_CABLE_SWC || 'N/A'}</td>
            </tr>
          </table>

          <table class="main-table">
            <tr><td colspan="4" class="bg-blue">2. CONDICIONES DE LA PRUEBA</td></tr>
            <tr><td class="bg-gray" width="25%">Norma/Procedimiento:</td><td colspan="3">${activeProfile.NORMA_PROCEDIMIENTO}</td></tr>
            <tr>
              <td class="bg-gray">Tipo de Prueba:</td>
              <td colspan="3">
                <table style="width: 100%; border: none; margin: 0; padding: 0;">
                  <tr>
                    <td style="border: none; padding: 2px;">[${activeProfile.TIPO_PRUEBA_PLANO ? 'X':' '}] Equipo instalado en ubicación/PLANO</td>
                    <td style="border: none; padding: 2px;">[${activeProfile.TIPO_PRUEBA_FUNC_SIM ? 'X':' '}] Prueba funcional simulada</td>
                  </tr>
                  <tr>
                    <td style="border: none; padding: 2px;">[${activeProfile.TIPO_PRUEBA_LOOP ? 'X':' '}] Pruebas de lazo (loop check)</td>
                    <td style="border: none; padding: 2px;">[${activeProfile.TIPO_PRUEBA_FUNC_LINEA ? 'X':' '}] Prueba funcional acoplada a línea</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="bg-gray">Equipo de prueba 1:</td><td>${activeProfile.EQUIPO_PRUEBA_1}</td>
              <td class="bg-gray">Certificado/Vigencia:</td><td>${activeProfile.CERT_FECHA_1}</td>
            </tr>
            <tr>
              <td class="bg-gray">Equipo de prueba 2:</td><td>${activeProfile.EQUIPO_PRUEBA_2}</td>
              <td class="bg-gray">Certificado/Vigencia:</td><td>${activeProfile.CERT_FECHA_2}</td>
            </tr>
          </table>

          <table class="main-table">
            <tr><td colspan="3" class="bg-blue">3. PRUEBAS DE LAZO (LOOP CHECK)</td></tr>
            <tr>
              <td class="bg-gray center uppercase" width="33%">${activeProfile.LOOP_C1 || 'EQUIPO'}</td>
              <td class="bg-gray center uppercase" width="33%">${activeProfile.LOOP_C2 || 'MEDIDA'}</td>
              <td class="bg-gray center uppercase" width="34%">${activeProfile.LOOP_C3 || 'VALOR'}</td>
            </tr>
            <tr><td class="center">${activeProfile.L1_C1 || ''}</td><td class="center">${activeProfile.L1_C2 || ''}</td><td class="center">${activeProfile.L1_C3 || ''}</td></tr>
            <tr><td class="center">${activeProfile.L2_C1 || ''}</td><td class="center">${activeProfile.L2_C2 || ''}</td><td class="center">${activeProfile.L2_C3 || ''}</td></tr>
            <tr><td class="center">${activeProfile.L3_C1 || ''}</td><td class="center">${activeProfile.L3_C2 || ''}</td><td class="center">${activeProfile.L3_C3 || ''}</td></tr>
          </table>

          <table class="main-table">
            <tr><td colspan="3" class="bg-blue">4. INSPECCIÓN</td></tr>
            <tr>
              <td class="bg-gray center" width="50%">Ítem Revisado</td>
              <td class="bg-gray center" width="15%">Estado</td>
              <td class="bg-gray center" width="35%">Observaciones</td>
            </tr>
            <tr><td>${activeProfile.LABEL_4_1}</td><td class="center bold">${activeProfile.INSP_4_1}</td><td>${activeProfile.OBS_4_1}</td></tr>
            <tr><td>${activeProfile.LABEL_4_2}</td><td class="center bold">${activeProfile.INSP_4_2}</td><td>${activeProfile.OBS_4_2}</td></tr>
            <tr><td>${activeProfile.LABEL_4_3}</td><td class="center bold">${activeProfile.INSP_4_3}</td><td>${activeProfile.OBS_4_3}</td></tr>
            <tr><td>${activeProfile.LABEL_4_4}</td><td class="center bold">${activeProfile.INSP_4_4}</td><td>${activeProfile.OBS_4_4}</td></tr>
          </table>

          <table class="main-table">
            <tr><td class="bg-blue">5. COMENTARIOS</td></tr>
            <tr><td style="height: 48px; vertical-align: top;">${activeProfile.COMENTARIOS}</td></tr>
          </table>

          ${fotosDelTag.length > 0 ? `
            <table class="main-table"><tr><td class="bg-blue" style="font-size:12px;">6. REGISTRO FOTOGRÁFICO</td></tr></table>
            <div class="photo-grid">
              ${fotosDelTag.map((f, i) => `
                <div class="photo-cell">
                  <img src="${f.blobData}" class="photo-img" />
                  <div class="bg-gray photo-caption">${f.observacion || `Foto ${i+1}`}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <table class="main-table signatures-table">
            <tr>
              <td class="bg-gray center" width="33.33%">ELABORÓ</td>
              <td class="bg-gray center" width="33.33%">REVISÓ</td>
              <td class="bg-gray center" width="33.33%">APROBÓ (CLIENTE / INTERVENTOR)</td>
            </tr>
            <tr><td>NOMBRE: ${activeProfile.ELABORO_NOMBRE}</td><td>NOMBRE: ${activeProfile.REVISO_NOMBRE}</td><td>NOMBRE: ${activeProfile.APROBO_NOMBRE}</td></tr>
            <tr><td>CARGO: ${activeProfile.ELABORO_CARGO}</td><td>CARGO: ${activeProfile.REVISO_CARGO}</td><td>CARGO: ${activeProfile.APROBO_CARGO}</td></tr>
            <tr>
              <td style="height: 70px; vertical-align: top; padding: 4px; position: relative;">
                <span class="bold" style="font-size: 8px; color: #666;">FIRMA:</span>
                ${activeProfile.ELABORO_FIRMA ? `<div style="text-align: center;"><img src="${activeProfile.ELABORO_FIRMA}" style="max-height: 50px; max-width: 95%; object-fit: contain;" /></div>` : ''}
              </td>
              <td style="height: 70px; vertical-align: top; padding: 4px; position: relative;">
                <span class="bold" style="font-size: 8px; color: #666;">FIRMA:</span>
                ${activeProfile.REVISO_FIRMA ? `<div style="text-align: center;"><img src="${activeProfile.REVISO_FIRMA}" style="max-height: 50px; max-width: 95%; object-fit: contain;" /></div>` : ''}
              </td>
              <td style="height: 70px; vertical-align: top; padding: 4px; position: relative;">
                <span class="bold" style="font-size: 8px; color: #666;">FIRMA:</span>
                ${activeProfile.APROBO_FIRMA ? `<div style="text-align: center;"><img src="${activeProfile.APROBO_FIRMA}" style="max-height: 50px; max-width: 95%; object-fit: contain;" /></div>` : ''}
              </td>
            </tr>
            <tr>
              <td>FECHA: ${activeProfile.FECHA}</td>
              <td>FECHA: ${activeProfile.FECHA}</td>
              <td>FECHA: ${activeProfile.FECHA}</td>
            </tr>
          </table>
        </div>
      `;
    });

    const fullHtml = `
      <html>
        <head>
          <title>Protocolos_${activeProfile.NOMBRE_PERFIL}</title>
          <style>
            @page { size: A4 portrait; margin: 10mm; }
            body { font-family: 'Inter', 'Helvetica', 'Arial', sans-serif; font-size: 9px; color: #000; margin: 0; padding: 0; background: #fff; }
            .protocol-page { 
              width: 100%; 
              min-height: 257mm; 
              page-break-after: always; 
              position: relative;
              box-sizing: border-box;
              display: block;
              clear: both;
            }
            .protocol-page:last-child { page-break-after: auto; }
            
            table.main-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; table-layout: fixed; }
            th, td { border: 1px solid #000; padding: 4px; vertical-align: middle; word-wrap: break-word; }
            .bg-blue { background-color: #1F3864 !important; color: #FFF !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; text-transform: uppercase; }
            .bg-gray { background-color: #D9E1F2 !important; font-weight: bold; -webkit-print-color-adjust: exact; text-transform: uppercase; font-size: 7.5px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .uppercase { text-transform: uppercase; }
            
            .photo-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-bottom: 10px; page-break-inside: avoid; }
            .photo-cell { text-align: center; border: 1px solid #000; padding: 2px; break-inside: avoid; }
            .photo-img { width: 100%; height: 200px; object-fit: contain; background: #fff; }
            .photo-caption { padding: 4px; font-size: 8px; border-top: 1px solid #000; background-color: #f8f8f8 !important; -webkit-print-color-adjust: exact; }
            
            .signatures-table { margin-top: 10px; page-break-inside: avoid; }
            
            /* Prevenir saltos de página dentro de tablas críticas */
            table { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          ${allHtmlContent}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(fullHtml);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { 
        printWindow.print(); 
        printWindow.close(); 
      }, 750);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2"><Download size={24} /> Exportar Formatos</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
        <div>
          <div className="flex justify-between items-end mb-3">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">1. Instrumentos ({instrumentosConFotos.length})</label>
            {instrumentosConFotos.length > 0 && (
              <button onClick={handleSelectAll} className="text-[10px] text-blue-600 font-bold hover:underline uppercase">
                {selectedTags.length === instrumentosConFotos.length ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
            )}
          </div>
          
          <div className="w-full h-48 overflow-y-auto bg-gray-50 border border-gray-100 rounded-xl p-2 space-y-1 custom-scrollbar">
            {instrumentosConFotos.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="bg-gray-100 p-3 rounded-full mb-3">
                  <Camera className="text-gray-300" size={32} />
                </div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">No hay instrumentos con fotos</p>
              </div>
            ) : (
              instrumentosConFotos.map((inst, index) => (
                <label key={`${inst.TAGNAME}-${index}`} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                  selectedTags.includes(inst.TAGNAME) 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'hover:bg-white hover:border-gray-300 border-transparent'
                }`}>
                  <input 
                    type="checkbox" 
                    checked={selectedTags.includes(inst.TAGNAME)}
                    onChange={() => handleToggleTag(inst.TAGNAME)}
                    className="w-4 h-4 rounded border-gray-300 text-[#1F3864] focus:ring-[#1F3864]" 
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1F3864] uppercase">{inst.TAGNAME}</p>
                    <p className="text-[9px] text-gray-400 truncate uppercase font-medium">{inst.DESCRIPCIÓN}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 p-2 bg-blue-50 rounded-lg">
            <Check size={14} className="text-blue-600" />
            <p className="text-[10px] text-blue-700 font-bold uppercase tracking-tight">{selectedTags.length} Seleccionados</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest">2. Perfil de Inspección</label>
          <select 
            value={selectedProfile} 
            onChange={e => setSelectedProfile(e.target.value)} 
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1F3864] focus:outline-none text-sm font-medium"
          >
            <option value="">-- Seleccionar Perfil --</option>
            {perfiles.map(p => <option key={p.ID_PERFIL} value={p.ID_PERFIL}>{p.NOMBRE_PERFIL.toUpperCase()}</option>)}
          </select>
        </div>

        <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] font-bold uppercase tracking-tight flex items-center gap-2">
              <AlertCircle size={14} />
              {exportError}
            </div>
          )}
          <Button 
            onClick={exportarPDF} 
            variant="pdf" 
            icon={Printer} 
            disabled={selectedTags.length === 0 || !selectedProfile}
            className="shadow-lg shadow-red-200 active:scale-95"
          >
            Generar Protocolos (PDF)
          </Button>
          <Button 
            onClick={exportarExcel} 
            variant="success" 
            icon={FileSpreadsheet} 
            disabled={isExporting || selectedTags.length === 0 || !selectedProfile}
             className="shadow-lg shadow-green-200 active:scale-95"
          >
            {isExporting ? 'Procesando...' : 'Descargar Excel (.xlsx)'}
          </Button>
          
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100 mt-2">
            <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-amber-700 leading-normal font-medium">
              Asegúrate de permitir ventanas emergentes para que el generador de PDF funcione correctamente al exportar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
