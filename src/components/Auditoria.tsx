import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Shield, Clock, User, AlertCircle, FileText } from 'lucide-react';

export const Auditoria: React.FC = () => {
  const { auditLogs } = useAppStore();

  const getActionColor = (action: string) => {
    if (action.includes('DELETE') || action.includes('RESET')) return 'text-red-600 bg-red-50';
    if (action.includes('UPDATE')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('DELETE') || action.includes('RESET')) return <AlertCircle size={16} />;
    if (action.includes('UPDATE')) return <FileText size={16} />;
    return <Clock size={16} />;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-[#1F3864] flex items-center gap-2 mb-2">
          <Shield className="text-[#1F3864]" size={24} />
          Historial de Auditoría Global
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Registro inmutable de todas las acciones administrativas, configuraciones y purgas de bases de datos realizadas en el sistema.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#1F3864] text-white">
              <tr>
                <th className="p-3 rounded-tl-lg font-semibold w-40">Fecha y Hora</th>
                <th className="p-3 font-semibold w-64">Usuario</th>
                <th className="p-3 font-semibold w-48">Acción</th>
                <th className="p-3 rounded-tr-lg font-semibold">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => {
                  const dateInfo = new Date(log.fecha_hora);
                  const displayDate = dateInfo.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const displayTime = dateInfo.toLocaleTimeString('es-ES', { hour: '2-digit', minute:'2-digit' });

                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 align-top">
                        <div className="flex flex-col text-xs">
                          <span className="font-bold text-gray-700">{displayDate}</span>
                          <span className="text-gray-500">{displayTime}</span>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="flex flex-col">
                          <span className="text-gray-800 font-medium break-all">{log.user_email}</span>
                          <span className="text-xs text-gray-400 capitalize flex items-center gap-1 mt-0.5">
                            <User size={10} />
                            {log.user_role}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 align-top">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border border-gray-100 shadow-sm ${getActionColor(log.action_type)}`}>
                          {getActionIcon(log.action_type)}
                          {log.action_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3 align-top text-gray-600 text-xs">
                        <div className="bg-gray-50 p-2 rounded border border-gray-100 font-mono">
                          {log.details}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 bg-gray-50/50 rounded-b-lg">
                    No hay registros de auditoría disponibles.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
