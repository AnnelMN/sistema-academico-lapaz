import { useState } from 'react';
import { Plus, X, Save, AlertTriangle } from 'lucide-react';
import { guardarCasillas } from '../../services/notas.service';
import { DIMENSIONES, PESOS } from '../../utils/calculoNotas';

// Panel para que el docente defina cuántas casillas usa en SER, SABER y HACER y
// cómo se llaman. En SER la casilla de asistencia la crea y calcula el sistema.
// Se monta con key={versión de la planilla}, así su borrador se reinicia al guardar.

const MAX_CASILLAS = 20;
const maximoManual = (dimension) => (dimension === 'SER' ? MAX_CASILLAS - 1 : MAX_CASILLAS);

const borradorDesde = (planilla) => {
  const borrador = {};
  for (const d of DIMENSIONES) {
    borrador[d] = planilla.casillas
      .filter((c) => c.dimension === d && !c.esAsistencia)
      .sort((a, b) => a.orden - b.orden)
      .map((c) => ({ id: c.id, nombre: c.nombre || '', calificada: c.calificada }));
  }
  return borrador;
};

export default function ConfiguradorCasillas({ planilla, bloqueado, motivoBloqueo, onGuardado }) {
  const [borrador, setBorrador] = useState(() => borradorDesde(planilla));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmar, setConfirmar] = useState(null); // casillas con notas que se eliminarían

  const original = borradorDesde(planilla);
  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(original);

  const actualizar = (dimension, lista) => {
    setBorrador((b) => ({ ...b, [dimension]: lista }));
    setConfirmar(null);
    setError('');
  };

  const enviar = async (confirmarEliminacion = false) => {
    setGuardando(true);
    setError('');
    try {
      const casillas = {};
      for (const d of DIMENSIONES) {
        casillas[d] = borrador[d].map((c) => ({ ...(c.id ? { id: c.id } : {}), nombre: c.nombre.trim() || null }));
      }
      const nueva = await guardarCasillas({
        materiaProgramadaId: planilla.materiaProgramadaId,
        casillas,
        ...(confirmarEliminacion ? { confirmarEliminacion: true } : {}),
      });
      setConfirmar(null);
      onGuardado(nueva, 'Casillas guardadas');
    } catch (err) {
      if (err.response?.status === 409) {
        setConfirmar(err.response.data.casillasConNotas || []);
      } else {
        setError(err.response?.data?.error || 'No se pudieron guardar las casillas');
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="ios-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--ios-label)' }}>Casillas del trimestre</h3>
          <p className="text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
            Elige cuántas casillas usas en cada dimensión (máximo {MAX_CASILLAS}) y ponles nombre si quieres.
            Cada casilla se califica de 0 a 100.
          </p>
        </div>
        {bloqueado && (
          <span className="text-[12px] font-medium" style={{ color: 'var(--ios-orange)' }}>{motivoBloqueo}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DIMENSIONES.map((dimension) => {
          const lista = borrador[dimension];
          const total = dimension === 'SER' ? lista.length + 1 : lista.length;
          return (
            <div key={dimension} className="rounded-2xl p-3" style={{ backgroundColor: 'var(--ios-bg)' }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-label)' }}>
                  {dimension} ({PESOS[dimension]})
                </span>
                <span className="text-[11px]" style={{ color: 'var(--ios-secondary)' }}>
                  {total} casilla{total === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-1.5">
                {dimension === 'SER' && (
                  <div className="flex items-center gap-2 text-[12px] px-2 py-1.5 rounded-lg" style={{ color: 'var(--ios-tertiary)', border: '1px dashed var(--ios-separator)' }}>
                    Asistencia <span className="ml-auto text-[10px]">automática</span>
                  </div>
                )}
                {lista.map((c, i) => (
                  <div key={c.id || `nueva-${i}`} className="flex items-center gap-1.5">
                    <span className="text-[10px] w-6 text-right" style={{ color: 'var(--ios-tertiary)' }}>C{i + 1}</span>
                    <input
                      className="ios-input flex-1 text-[12px] py-1"
                      value={c.nombre}
                      maxLength={60}
                      disabled={bloqueado || guardando}
                      placeholder={`Casilla ${i + 1} (opcional: nombre)`}
                      aria-label={`${dimension} casilla ${i + 1} nombre`}
                      onChange={(e) => actualizar(dimension, lista.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))}
                    />
                    <button
                      type="button"
                      title={c.calificada ? 'Quitar casilla (tiene notas: se pedirá confirmación)' : 'Quitar casilla'}
                      aria-label={`Quitar ${dimension} casilla ${i + 1}`}
                      disabled={bloqueado || guardando}
                      onClick={() => actualizar(dimension, lista.filter((_, j) => j !== i))}
                      className="p-1 rounded-md disabled:opacity-40"
                      style={{ color: c.calificada ? 'var(--ios-red)' : 'var(--ios-secondary)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={bloqueado || guardando || lista.length >= maximoManual(dimension)}
                  onClick={() => actualizar(dimension, [...lista, { nombre: '', calificada: false }])}
                  className="w-full flex items-center justify-center gap-1 text-[12px] font-semibold py-1.5 rounded-lg disabled:opacity-40"
                  style={{ color: 'var(--ios-blue)', border: '1px dashed var(--ios-separator)' }}
                >
                  <Plus size={13} /> Agregar casilla
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmar && (
        <div className="rounded-2xl p-4 space-y-2" style={{ backgroundColor: 'var(--ios-red-light)' }}>
          <div className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: 'var(--ios-red)' }}>
            <AlertTriangle size={15} /> Estas casillas ya tienen notas y se borrarán:
          </div>
          <ul className="text-[12px] list-disc pl-6" style={{ color: 'var(--ios-label)' }}>
            {confirmar.map((c) => (
              <li key={c.id}>{c.dimension} — {c.nombre || 'sin nombre'} ({c.notasRegistradas} nota{c.notasRegistradas === 1 ? '' : 's'})</li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button type="button" className="ios-btn-primary text-[12px]" style={{ backgroundColor: 'var(--ios-red)' }} disabled={guardando} onClick={() => enviar(true)}>
              Sí, borrar y guardar
            </button>
            <button type="button" className="ios-btn-ghost text-[12px]" disabled={guardando} onClick={() => setConfirmar(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-[12px] font-medium" style={{ color: 'var(--ios-red)' }}>{error}</p>}

      {hayCambios && !confirmar && (
        <div className="flex gap-2 justify-end">
          <button type="button" className="ios-btn-ghost text-[12px]" disabled={guardando} onClick={() => { setBorrador(original); setError(''); }}>
            Descartar
          </button>
          <button type="button" className="ios-btn-primary text-[12px] flex items-center gap-1.5" disabled={bloqueado || guardando} onClick={() => enviar(false)}>
            <Save size={14} /> {guardando ? 'Guardando…' : 'Guardar casillas'}
          </button>
        </div>
      )}
    </div>
  );
}
