import React, { useState } from 'react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, Users, AlertTriangle } from 'lucide-react';

// ─────────────────────────────────────────────────────────
// TODO Sprint 8: reemplazar MOCK_DATA con llamadas a la API
// GET /api/predicciones/curso?cursoId=X&trimestre=Y
// GET /api/predicciones/modelo-stats
// ─────────────────────────────────────────────────────────
const CURSOS_MOCK = [
  { id: 'curso-3a', label: '3ro A' },
  { id: 'curso-5a', label: '5ro A' },
];

const MOCK_DATA = {
  'curso-3a': {
    kpis: { precision: 94.7, sinRiesgo: 3, riesgoMedio: 1, riesgoAlto: 2 },
    estudiantes: [
      { nombre: 'Juan Mamani',   nota: 48, asistencia: 76, probabilidad: 87, riesgo: 'RIESGO_ALTO'  },
      { nombre: 'María Quispe',  nota: 71, asistencia: 92, probabilidad: 12, riesgo: 'SIN_RIESGO'   },
      { nombre: 'Carlos Flores', nota: 58, asistencia: 88, probabilidad: 34, riesgo: 'RIESGO_MEDIO' },
      { nombre: 'Ana Condori',   nota: 74, asistencia: 97, probabilidad: 8,  riesgo: 'SIN_RIESGO'   },
      { nombre: 'Luis Vargas',   nota: 44, asistencia: 79, probabilidad: 91, riesgo: 'RIESGO_ALTO'  },
    ],
  },
  'curso-5a': {
    kpis: { precision: 94.7, sinRiesgo: 4, riesgoMedio: 2, riesgoAlto: 1 },
    estudiantes: [
      { nombre: 'Pedro Huanca',    nota: 65, asistencia: 91, probabilidad: 22, riesgo: 'SIN_RIESGO'   },
      { nombre: 'Rosa Choque',     nota: 52, asistencia: 83, probabilidad: 55, riesgo: 'RIESGO_MEDIO' },
      { nombre: 'Ernesto Mamani',  nota: 78, asistencia: 95, probabilidad: 7,  riesgo: 'SIN_RIESGO'   },
      { nombre: 'Sandra Lima',     nota: 69, asistencia: 88, probabilidad: 18, riesgo: 'SIN_RIESGO'   },
      { nombre: 'Diego Torrez',    nota: 41, asistencia: 71, probabilidad: 83, riesgo: 'RIESGO_ALTO'  },
      { nombre: 'Valeria Quispe',  nota: 61, asistencia: 84, probabilidad: 39, riesgo: 'RIESGO_MEDIO' },
      { nombre: 'Marco Condori',   nota: 73, asistencia: 93, probabilidad: 11, riesgo: 'SIN_RIESGO'   },
    ],
  },
};

// Datos fijos del modelo (no cambian por curso)
const MODELO_STATS = {
  comparacion: [
    { metrica: 'Precisión',  rf: 0.95, arbol: 0.88 },
    { metrica: 'Recall',     rf: 0.93, arbol: 0.84 },
    { metrica: 'F1-Score',   rf: 0.94, arbol: 0.86 },
  ],
  variables: [
    { nombre: 'Promedio de notas',  importancia: 92 },
    { nombre: '% Asistencia',       importancia: 85 },
    { nombre: 'Trimestre actual',   importancia: 61 },
    { nombre: 'Nivel educativo',    importancia: 44 },
  ],
};

// ─── Configuración de riesgo ──────────────────────────────
const RIESGO_CONFIG = {
  SIN_RIESGO:   { label: 'Sin Riesgo',   badge: 'bg-green-100 text-green-700', dot: '#16a34a' },
  RIESGO_MEDIO: { label: 'Riesgo Medio', badge: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  RIESGO_ALTO:  { label: 'Riesgo Alto',  badge: 'bg-red-100 text-red-700',     dot: '#ef4444' },
};

const menuGroups = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard',       path: '/profesor',            dotColor: 'bg-[#60a5fa]', exact: true },
      { label: 'Registrar notas', path: '/profesor/notas',      dotColor: 'bg-[#fb923c]' },
      { label: 'Asistencia',      path: '/profesor/asistencia', dotColor: 'bg-[#34d399]' },
    ]
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
      { label: 'Mi horario',    path: '/profesor/horario',       dotColor: 'bg-[#fbbf24]' },
      { label: 'Reportes',      path: '/profesor/reportes',      dotColor: 'bg-[#9ca3af]' },
    ]
  }
];

// ─── Sub-componentes ──────────────────────────────────────

function KpiCard({ label, value, sub, icon: Icon, colorClass }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-slate-100">
      <div className="flex justify-between items-start mb-2">
        <div className={`text-[10px] font-bold uppercase tracking-wider ${colorClass ?? 'text-slate-400'}`}>{label}</div>
        {Icon && <Icon size={16} className="text-slate-300" />}
      </div>
      <div className="text-[26px] font-bold text-[#1a1a2e] leading-none">{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function BarraImportancia({ nombre, importancia }) {
  const color = importancia >= 80 ? '#4a90e2' : importancia >= 60 ? '#a78bfa' : '#9ca3af';
  return (
    <div className="flex items-center gap-3">
      <div className="text-[11px] text-slate-600 w-36 truncate shrink-0">{nombre}</div>
      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${importancia}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-[11px] font-bold text-slate-500 w-8 text-right">{importancia}%</div>
    </div>
  );
}

const DonaLeyenda = ({ payload }) => (
  <div className="flex flex-col justify-center gap-2 pl-4">
    {payload.map((entry, i) => (
      <div key={i} className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.payload.color }} />
        <span className="text-[11px] text-slate-600">{entry.name}</span>
        <span className="text-[11px] font-bold text-slate-800 ml-auto pl-3">{entry.value}</span>
      </div>
    ))}
  </div>
);

function BarraProbabilidad({ valor }) {
  const color = valor >= 70 ? 'bg-red-500' : valor >= 40 ? 'bg-amber-400' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 w-32">
      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${valor}%` }} />
      </div>
      <span className="text-[11px] font-bold text-slate-600 w-8 text-right">{valor}%</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────
export default function PrediccionIA() {
  const [cursoId, setCursoId]     = useState(CURSOS_MOCK[0].id);
  const [trimestre, setTrimestre] = useState('1');

  // TODO Sprint 8: reemplazar con useMemo + fetch real
  const datos = MOCK_DATA[cursoId];
  const { kpis, estudiantes } = datos;

  const distribucionRiesgo = [
    { name: 'Sin Riesgo',   value: kpis.sinRiesgo,   color: '#16a34a' },
    { name: 'Riesgo Medio', value: kpis.riesgoMedio,  color: '#f59e0b' },
    { name: 'Riesgo Alto',  value: kpis.riesgoAlto,   color: '#ef4444' },
  ];

  const totalEstudiantes = kpis.sinRiesgo + kpis.riesgoMedio + kpis.riesgoAlto;

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#8B0000]"
      headerTitle="Predicción IA de Riesgo"
      headerSubtitle="Modelo Random Forest · Gestión 2026"
    >
      <div className="space-y-5">

        {/* Filtros */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Curso</label>
            <select
              value={cursoId}
              onChange={e => setCursoId(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-purple-400 bg-white min-w-[140px]"
            >
              {CURSOS_MOCK.map(c => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trimestre</label>
            <select
              value={trimestre}
              onChange={e => setTrimestre(e.target.value)}
              className="border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-purple-400 bg-white"
            >
              <option value="1">1er Trimestre</option>
              <option value="2">2do Trimestre</option>
              <option value="3">3er Trimestre</option>
            </select>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Brain size={14} className="text-[#a78bfa]" />
            Modelo en producción: Random Forest
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard
            label="Precisión del modelo"
            value={`${kpis.precision}%`}
            sub="F1-Score: 0.94"
            icon={Brain}
            colorClass="text-[#a78bfa]"
          />
          <KpiCard
            label="Sin riesgo"
            value={kpis.sinRiesgo}
            sub={`${Math.round(kpis.sinRiesgo / totalEstudiantes * 100)}% del curso`}
            icon={TrendingUp}
            colorClass="text-[#16a34a]"
          />
          <KpiCard
            label="Riesgo medio"
            value={kpis.riesgoMedio}
            sub={`${Math.round(kpis.riesgoMedio / totalEstudiantes * 100)}% del curso`}
            icon={Users}
            colorClass="text-[#f59e0b]"
          />
          <KpiCard
            label="Riesgo alto"
            value={kpis.riesgoAlto}
            sub={`${Math.round(kpis.riesgoAlto / totalEstudiantes * 100)}% del curso`}
            icon={AlertTriangle}
            colorClass="text-[#ef4444]"
          />
        </div>

        {/* Sección 2 + 3: Comparación algoritmos | Variables influyentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Comparación de algoritmos */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight mb-4">
              Comparación de algoritmos
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Métrica</th>
                  <th className="pb-2 text-[10px] font-bold text-[#a78bfa] uppercase tracking-wider text-center">
                    Random Forest ★
                  </th>
                  <th className="pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                    Árbol Decisión
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MODELO_STATS.comparacion.map(({ metrica, rf, arbol }) => (
                  <tr key={metrica} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-[12px] font-medium text-slate-600">{metrica}</td>
                    <td className="py-2.5 text-center">
                      <span className="text-[13px] font-bold text-[#a78bfa]">{rf.toFixed(2)}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="text-[12px] text-slate-500">{arbol.toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 pt-3 border-t border-slate-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Entrenamiento: 80% · Prueba: 20% · Método: CRISP-DM
              </div>
            </div>
          </div>

          {/* Variables más influyentes */}
          <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight mb-4">
              Variables más influyentes
            </div>
            <div className="space-y-4">
              {MODELO_STATS.variables.map(v => (
                <BarraImportancia key={v.nombre} nombre={v.nombre} importancia={v.importancia} />
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400">
              Importancia relativa calculada por el modelo Random Forest.
            </div>
          </div>
        </div>

        {/* Sección 4: Distribución de riesgo del curso (Dona) */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-slate-100">
          <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight mb-4">
            Distribución de riesgo — {CURSOS_MOCK.find(c => c.id === cursoId)?.label}
          </div>
          <div className="flex items-center justify-center gap-8">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie
                  data={distribucionRiesgo}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {distribucionRiesgo.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} estudiantes`, name]}
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Leyenda personalizada */}
            <div className="space-y-3">
              {distribucionRiesgo.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <div className="text-[12px] font-bold text-[#1a1a2e]">{item.name}</div>
                    <div className="text-[10px] text-slate-400">
                      {item.value} estudiantes · {Math.round(item.value / totalEstudiantes * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Centro de la dona */}
            <div className="text-center">
              <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Total</div>
              <div className="text-[28px] font-bold text-[#1a1a2e]">{totalEstudiantes}</div>
              <div className="text-[10px] text-slate-400">estudiantes</div>
            </div>
          </div>
        </div>

        {/* Sección 5: Tabla de estudiantes */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
            <div className="text-[12px] font-bold text-[#1a1a2e] uppercase tracking-tight">
              Predicciones individuales — {CURSOS_MOCK.find(c => c.id === cursoId)?.label}
            </div>
            <div className="text-[10px] text-slate-400">
              {totalEstudiantes} estudiantes · Trimestre {trimestre}
            </div>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-2/5">Estudiante</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Nota prom.</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Asistencia</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Prob. reprobación</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Nivel riesgo IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {estudiantes.map((est, idx) => {
                const cfg = RIESGO_CONFIG[est.riesgo];
                const rowBg = est.riesgo === 'RIESGO_ALTO' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-slate-50/50';
                return (
                  <tr key={idx} className={`transition-colors ${rowBg}`}>
                    <td className="px-5 py-3 text-[12px] font-medium text-slate-700">{est.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[13px] font-bold ${est.nota >= 51 ? 'text-green-600' : 'text-red-600'}`}>
                        {est.nota}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[12px] font-bold ${est.asistencia >= 80 ? 'text-slate-600' : 'text-amber-600'}`}>
                        {est.asistencia}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <BarraProbabilidad valor={est.probabilidad} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </SidebarLayout>
  );
}
