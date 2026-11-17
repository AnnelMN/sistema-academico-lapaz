import { useEffect, useMemo, useState } from 'react';
import { Save, AlertCircle, CheckCircle, Info, Lock } from 'lucide-react';
import SidebarLayout from '../../components/layout/SidebarLayout';
import PlanillaNotas from '../../components/notas/PlanillaNotas';
import ConfiguradorCasillas from '../../components/notas/ConfiguradorCasillas';
import { getMisMaterias, getPeriodoActual, getPlanilla, guardarCalificaciones } from '../../services/notas.service';
import { leerEntero, MAX_AUTOEVALUACION } from '../../utils/calculoNotas';

// Registro de notas por casillas (escala SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5).
// El docente configura sus casillas, califica de 0 a 100 y registra la autoevaluación (0 a 5).
// Los subtotales y el total se ven al instante; al guardar, el servidor recalcula.

const menuGroups = [
  {
    title: 'Mi Panel',
    items: [
      { label: 'Dashboard', path: '/profesor', dotColor: 'bg-[#60a5fa]' },
      { label: 'Registrar notas', path: '/profesor/notas', dotColor: 'bg-[#fb923c]', exact: true },
      { label: 'Asistencia', path: '/profesor/asistencia', dotColor: 'bg-[#34d399]' },
    ],
  },
  {
    title: 'Consultas',
    items: [
      { label: 'Predicción IA', path: '/profesor/predicciones', dotColor: 'bg-[#a78bfa]' },
      { label: 'Mi horario', path: '/profesor/horario', dotColor: 'bg-[#fbbf24]' },
      { label: 'Reportes', path: '/profesor/reportes', dotColor: 'bg-[#9ca3af]' },
    ],
  },
];

const ETIQUETA_TRIMESTRE = { 1: '1.er', 2: '2.º', 3: '3.er' };

const fechaCorta = (iso) => (iso ? iso.split('-').reverse().join('/') : '');

// Compara el borrador con lo guardado y arma lo que hay que enviar
function calcularPendientes(planilla, cambios) {
  const resultado = { calificaciones: [], autoevaluaciones: [], invalidos: 0 };
  if (!planilla) return resultado;
  const porId = new Map(planilla.estudiantes.map((e) => [e.id, e]));
  for (const [clave, texto] of Object.entries(cambios)) {
    if (clave.startsWith('auto|')) {
      const estudianteId = clave.slice(5);
      const valor = leerEntero(texto, MAX_AUTOEVALUACION);
      if (Number.isNaN(valor)) { resultado.invalidos += 1; continue; }
      if (valor !== (porId.get(estudianteId)?.autoevaluacion ?? null)) {
        resultado.autoevaluaciones.push({ estudianteId, valor });
      }
    } else {
      const [estudianteId, casillaId] = clave.split('|');
      const valor = leerEntero(texto, 100);
      if (Number.isNaN(valor)) { resultado.invalidos += 1; continue; }
      if (valor !== (porId.get(estudianteId)?.valores[casillaId] ?? null)) {
        resultado.calificaciones.push({ estudianteId, casillaId, valor });
      }
    }
  }
  return resultado;
}

export default function RegistroNotas() {
  const [materias, setMaterias] = useState([]);
  const [periodo, setPeriodo] = useState(null);
  const [materiaId, setMateriaId] = useState('');
  const [trimestre, setTrimestre] = useState(null); // null = trimestre activo
  const [planilla, setPlanilla] = useState(null);
  const [cambios, setCambios] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Materias del docente y trimestre activo
  useEffect(() => {
    let vigente = true;
    Promise.all([getMisMaterias(), getPeriodoActual()])
      .then(([lista, actual]) => {
        if (!vigente) return;
        setMaterias(lista || []);
        setPeriodo(actual);
        if (lista?.length) setMateriaId(lista[0].id);
      })
      .catch(() => vigente && setMensaje({ tipo: 'error', texto: 'No se pudieron cargar tus materias' }));
    return () => { vigente = false; };
  }, []);

  // Planilla de la materia y trimestre elegidos
  useEffect(() => {
    if (!materiaId) return undefined;
    let vigente = true;
    getPlanilla(materiaId, trimestre)
      .then((datos) => vigente && setPlanilla(datos))
      .catch((err) => vigente && setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudo cargar la planilla' }));
    return () => { vigente = false; };
  }, [materiaId, trimestre]);

  const cargando = !planilla || planilla.materiaProgramadaId !== materiaId || (trimestre !== null && planilla.trimestre !== trimestre);
  const pendientes = useMemo(() => calcularPendientes(planilla, cambios), [planilla, cambios]);
  const cantidadCambios = pendientes.calificaciones.length + pendientes.autoevaluaciones.length;
  const hayBorrador = cantidadCambios > 0 || pendientes.invalidos > 0;

  const alCambiar = (clave, texto) => {
    setCambios((c) => ({ ...c, [clave]: texto }));
    setMensaje(null);
  };

  const guardar = async () => {
    if (pendientes.invalidos > 0) {
      setMensaje({ tipo: 'error', texto: `Hay ${pendientes.invalidos} casilla(s) con valores no válidos (casillas: 0 a 100; autoevaluación: 0 a 5)` });
      return;
    }
    setGuardando(true);
    setMensaje({ tipo: 'info', texto: 'Guardando notas…' });
    try {
      const nueva = await guardarCalificaciones({
        materiaProgramadaId: materiaId,
        calificaciones: pendientes.calificaciones,
        autoevaluaciones: pendientes.autoevaluaciones,
      });
      setPlanilla(nueva);
      setCambios({});
      setMensaje({ tipo: 'exito', texto: `Notas guardadas (${cantidadCambios} cambio${cantidadCambios === 1 ? '' : 's'})` });
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.error || 'No se pudieron guardar las notas' });
    } finally {
      setGuardando(false);
    }
  };

  const materiaActual = materias.find((m) => m.id === materiaId);

  return (
    <SidebarLayout
      menuGroups={menuGroups}
      sidebarColor="bg-[#8B0000]"
      headerTitle="Registro de Calificaciones"
      headerSubtitle="SER 10 · SABER 45 · HACER 40 · AUTOEVALUACIÓN 5 — casillas de 0 a 100"
    >
      <div className="space-y-5">
        {/* Filtros */}
        <div className="ios-card p-4 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>Materia y curso</label>
            <select
              value={materiaId}
              disabled={hayBorrador}
              onChange={(e) => { setMateriaId(e.target.value); setCambios({}); setMensaje(null); }}
              className="ios-input w-full text-[12px]"
            >
              {materias.map((m) => (
                <option key={m.id} value={m.id}>{m.curso.nivel}° {m.curso.paralelo} — {m.materia.nombre}</option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--ios-secondary)' }}>Trimestre</label>
            <select
              value={trimestre ?? planilla?.trimestre ?? ''}
              disabled={hayBorrador || !planilla}
              onChange={(e) => { setTrimestre(Number(e.target.value)); setCambios({}); setMensaje(null); }}
              className="ios-input w-full text-[12px]"
            >
              {[1, 2, 3].map((t) => (
                <option key={t} value={t}>{ETIQUETA_TRIMESTRE[t]} trimestre{periodo?.trimestre === t ? ' (activo)' : ''}</option>
              ))}
            </select>
          </div>
          {planilla?.editable && (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando || cargando || cantidadCambios === 0}
              className="ios-btn-primary flex items-center gap-2 text-[12px]"
            >
              <Save size={15} /> {guardando ? 'Guardando…' : `Guardar notas${cantidadCambios ? ` (${cantidadCambios})` : ''}`}
            </button>
          )}
        </div>

        {/* Periodo y estado */}
        {planilla && !cargando && (
          <div className="flex flex-wrap items-center gap-3 text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
            <span>
              {materiaActual ? `${materiaActual.materia.nombre} · ` : ''}Trimestre {planilla.trimestre}
              {planilla.periodo ? ` · ${fechaCorta(planilla.periodo.fechaInicio)} al ${fechaCorta(planilla.periodo.fechaFin)}` : ' · sin fechas configuradas'}
            </span>
            {!planilla.editable && (
              <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--ios-orange)' }}>
                <Lock size={13} /> {planilla.motivoNoEditable}
              </span>
            )}
          </div>
        )}

        {hayBorrador && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl text-[12px]" style={{ backgroundColor: 'var(--ios-orange-light)', color: 'var(--ios-label)' }}>
            <Info size={15} style={{ color: 'var(--ios-orange)' }} />
            Tienes cambios sin guardar. Guarda o descarta antes de cambiar de materia, trimestre o casillas.
            <button type="button" className="ios-btn-ghost text-[12px] ml-auto" onClick={() => setCambios({})} disabled={guardando}>
              Descartar cambios
            </button>
          </div>
        )}

        {mensaje && (
          <div
            className="p-3 rounded-xl flex items-center gap-2 text-[12px] font-medium"
            style={{
              backgroundColor: mensaje.tipo === 'exito' ? 'var(--ios-green-light)' : mensaje.tipo === 'error' ? 'var(--ios-red-light)' : 'var(--ios-blue-light)',
              color: mensaje.tipo === 'exito' ? 'var(--ios-green)' : mensaje.tipo === 'error' ? 'var(--ios-red)' : 'var(--ios-blue)',
            }}
          >
            {mensaje.tipo === 'exito' ? <CheckCircle size={15} /> : mensaje.tipo === 'error' ? <AlertCircle size={15} /> : <Info size={15} />}
            {mensaje.texto}
          </div>
        )}

        {materias.length === 0 && !mensaje && (
          <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
            No tienes materias asignadas.
          </div>
        )}

        {cargando && materiaId && (
          <div className="ios-card p-8 text-center text-[13px]" style={{ color: 'var(--ios-secondary)' }}>Cargando planilla…</div>
        )}

        {!cargando && planilla.editable && (
          <ConfiguradorCasillas
            key={planilla.casillas.map((c) => `${c.id}:${c.nombre}`).join('|')}
            planilla={planilla}
            bloqueado={hayBorrador}
            motivoBloqueo="Guarda o descarta las notas antes de cambiar las casillas"
            onGuardado={(nueva, texto) => { setPlanilla(nueva); setMensaje({ tipo: 'exito', texto }); }}
          />
        )}

        {!cargando && (
          <PlanillaNotas planilla={planilla} editable={planilla.editable} cambios={cambios} onCambio={alCambiar} />
        )}

        {!cargando && (
          <p className="text-[11px] leading-relaxed" style={{ color: 'var(--ios-tertiary)' }}>
            Cada dimensión es el promedio de sus casillas, redondeado (0,5 sube). Una casilla que nadie tiene calificada no cuenta;
            si otros estudiantes ya tienen nota en ella, quien no la tiene recibe 0. La columna «Asist.» se calcula sola con las
            listas de asistencia (presente y justificado cuentan).
          </p>
        )}
      </div>
    </SidebarLayout>
  );
}
