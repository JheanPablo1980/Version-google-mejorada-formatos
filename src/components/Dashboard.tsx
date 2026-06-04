import { useState, useMemo } from 'react';
import { useAppStore, UserRole } from '../store/useAppStore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Calendar, 
  Tag as TagIcon, 
  ArrowRight, 
  LayoutDashboard, 
  FileSpreadsheet, 
  FileText,
  Filter,
  BarChart3,
  TrendingUp,
  Package,
  User as UserIcon,
  Sliders,
  Zap
} from 'lucide-react';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';

export function Dashboard() {
  const { conteoExportacion, instrumentos, potenciaEquipos } = useAppStore();
  const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Filtrar conteos según fecha, tag, rol
  const filteredConteos = useMemo(() => {
    return conteoExportacion.filter(log => {
      const logDate = parseISO(log.fecha_hora);
      const isWithinDates = isWithinInterval(logDate, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate))
      });
      const matchesTag = selectedTag === 'all' || log.tag === selectedTag;
      const matchesRole = selectedRole === 'all' || log.user_role === selectedRole;
      
      return isWithinDates && matchesTag && matchesRole;
    });
  }, [conteoExportacion, startDate, endDate, selectedTag, selectedRole]);

  // Contar exportaciones clasificados por tabla (Instrumentos vs Potencia)
  const exportsByType = useMemo(() => {
    let instrumentacion = 0;
    let potencia = 0;
    
    const instTagnames = new Set(instrumentos.map(i => i.TAGNAME));
    const potTags = new Set(potenciaEquipos.map(p => p.TAG));
    
    filteredConteos.forEach(log => {
      if (instTagnames.has(log.tag)) {
        instrumentacion += log.conteo;
      } else if (potTags.has(log.tag)) {
        potencia += log.conteo;
      }
    });
    
    return { instrumentacion, potencia };
  }, [filteredConteos, instrumentos, potenciaEquipos]);

  // Lista de tags únicos que han sido exportados
  const uniqueTags = useMemo(() => {
    const tags = new Set(conteoExportacion.map(l => l.tag));
    return Array.from(tags).filter(Boolean).sort();
  }, [conteoExportacion]);

  const roles = ['ADMIN', 'TECNICO', 'INVITADO'];

  // Datos para gráfico de líneas por día
  const dailyData = useMemo(() => {
    const map = new Map<string, { date: string, total: number }>();
    
    // Inicializar días en el rango
    let current = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    
    while (current <= end) {
      const d = format(current, 'yyyy-MM-dd');
      map.set(d, { date: d, total: 0 });
      current.setDate(current.getDate() + 1);
    }

    filteredConteos.forEach(log => {
      const d = format(parseISO(log.fecha_hora), 'yyyy-MM-dd');
      if (map.has(d)) {
        const entry = map.get(d)!;
        entry.total += log.conteo;
      }
    });

    return Array.from(map.values());
  }, [filteredConteos, startDate, endDate]);

  // Totales por Tag
  const tagStats = useMemo(() => {
    const stats = new Map<string, number>();
    filteredConteos.forEach(log => {
      stats.set(log.tag, (stats.get(log.tag) || 0) + log.conteo);
    });
    return Array.from(stats.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredConteos]);

  const totalExports = filteredConteos.reduce((acc, curr) => acc + curr.conteo, 0);

  const COLORS = ['#1F3864', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[#1F3864] flex items-center gap-2">
          <LayoutDashboard size={24} /> Análisis de Exportaciones
        </h2>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-full">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-gray-400 hidden sm:block" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className="w-full sm:w-auto text-xs border rounded p-2 sm:p-1 font-bold text-blue-900"
              />
            </div>
            <div className="hidden sm:flex items-center justify-center">
               <ArrowRight size={14} className="text-gray-300" />
            </div>
            <div className="flex sm:hidden justify-center text-gray-300">
               <ArrowRight size={14} className="rotate-90" />
            </div>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              className="w-full sm:w-auto text-xs border rounded p-2 sm:p-1 font-bold text-blue-900"
            />
          </div>
          <div className="h-px sm:h-4 w-full sm:w-px bg-gray-200 sm:mx-1 my-1 sm:my-0"></div>
          <select 
            value={selectedRole} 
            onChange={e => setSelectedRole(e.target.value)}
            className="w-full sm:w-auto text-xs border rounded p-2 sm:p-1 font-bold text-blue-900 appearance-none bg-white pr-6 min-w-[100px]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.4rem center', backgroundRepeat: 'no-repeat', backgroundSize: '0.8rem' }}
          >
            <option value="all">TODOS ROLES</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <div className="h-px sm:h-4 w-full sm:w-px bg-gray-200 sm:mx-1 my-1 sm:my-0"></div>
          <select 
            value={selectedTag} 
            onChange={e => setSelectedTag(e.target.value)}
            className="w-full sm:w-auto text-xs border rounded p-2 sm:p-1 font-bold text-blue-900 appearance-none bg-white pr-6 min-w-[120px]"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
          >
            <option value="all">TODOS LOS TAGS</option>
            {uniqueTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 group hover:border-blue-200 transition-all justify-center">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Exportaciones</p>
            <p className="text-3xl font-black text-[#1F3864] leading-none mt-1">{totalExports}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 group hover:border-emerald-200 transition-all justify-center">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
            <Sliders size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instrumentación</p>
            <p className="text-3xl font-black text-emerald-600 leading-none mt-1">{exportsByType.instrumentacion}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 group hover:border-amber-200 transition-all justify-center">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Potencia</p>
            <p className="text-3xl font-black text-amber-600 leading-none mt-1">{exportsByType.potencia}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1F3864] uppercase tracking-widest flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-500" /> Actividad por Día
            </h3>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', fontWeight: 'bold' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '15px' }} />
                <Bar name="Exportaciones" dataKey="total" fill="#1F3864" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ranking de Tags */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col lg:h-[390px]">
          <h3 className="text-sm font-black text-[#1F3864] uppercase tracking-widest mb-4 flex items-center gap-2 flex-shrink-0">
            <Package size={18} className="text-yellow-500" /> Top Instrumentos
          </h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 min-h-0">
            {tagStats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                <TagIcon size={48} className="mb-2" />
                <p className="text-[10px] font-bold uppercase">Sin datos en el rango</p>
              </div>
            ) : (
              tagStats.map((item, idx) => (
                <div key={item.tag} className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100 group hover:bg-blue-50 hover:border-blue-100 transition-all">
                  <div className="w-6 h-6 flex items-center justify-center bg-white rounded-lg shadow-sm text-[10px] font-black text-[#1F3864]">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-[#1F3864] truncate uppercase">{item.tag}</p>
                    <div className="w-full bg-gray-200 h-1 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-500" 
                        style={{ width: `${(item.count / tagStats[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-blue-700">{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Gráfico de Línea de Tendencia */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-sm font-black text-[#1F3864] uppercase tracking-widest mb-6 flex items-center gap-2">
          <TrendingUp size={18} className="text-green-500" /> Tendencia de Exportación Total
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} 
                axisLine={false} 
                tickLine={false}
                tickFormatter={(val) => val.split('-').reverse().slice(0, 2).reverse().join('/')}
              />
              <YAxis tick={{ fontSize: 8, fontWeight: 700, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#1F3864" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#1F3864', strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
