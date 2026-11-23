import { useEffect, useRef, useState } from 'react';
import { Plus, X, Check, Pencil, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { guardarCasillas } from '../../services/notas.service';
import { DIMENSIONES, PESOS } from '../../utils/calculoNotas';

// Panel para que el docente cree, renombre y quite las casillas de SER, SABER y
// HACER. Cada acción se confirma con su botón (✓ / ✗) y se guarda en el momento:
// no hay borradores escondidos. En SER la casilla de asistencia la crea y calcula
// el sistema.

const MAX_CASILLAS = 20;
const MAX_NOMBRE = 60;
const maximoManual = (dimension) => (dimension === 'SER' ? MAX_CASILLAS - 1 : MAX_CASILLAS);

const casillasDe = (planilla, dimension) => planilla.casillas
  .filter((c) => c.dimension === dimension && !c.esAsistencia)
  .sort((a, b) => a.orden - b.orden);

const normalizar = (texto) => texto.trim().replace(/\s+/g, ' ');

function BotonIcono({ titulo, onClick, disabled, color, children }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      disabled={disabled}
      onClick={onClick}
      className="p-1 rounded-md disabled:opacity-40 hover:opacity-80"
      style={{ color }}
    >
      {children}
    </button>
  );
}

// Campo de nombre con ✓ (confirmar) y ✗ (cancelar). Enter confirma y Escape cancela.
function CampoNombre({ valorInicial, placeholder, etiqueta, guardando, onConfirmar, onCancelar }) {
  const [texto, setTexto] = useState(valorInicial);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  const confirmar = () => { if (!guardando) onConfirmar(texto); };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={ref}
        className="ios-input flex-1 text-[12px] py-1"
        value={texto}
        maxLength={MAX_NOMBRE}
        disabled={guardando}
        placeholder={placeholder}
        aria-label={etiqueta}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); confirmar(); }
          if (e.key === 'Escape') { e.preventDefault(); onCancelar(); }
        }}
      />
      {guardando ? (
        <Loader2 size={15} className="animate-spin mx-1" style={{ color: 'var(--ios-blue)' }} />
      ) : (
        <>
          <BotonIcono titulo="Confirmar" onClick={confirmar} color="var(--ios-green)">
            <Check size={16} strokeWidth={3} />
          </BotonIcono>
          <BotonIcono titulo="Cancelar" onClick={onCancelar} color="var(--ios-red)">
            <X size={16} strokeWidth={3} />
          </BotonIcono>
        </>
      )}
    </div>
  );
}

export default function ConfiguradorCasillas({ planilla, bloqueado = false, motivoBloqueo, onGuardado }) {
  // Acción abierta (solo una a la vez):
  //   { tipo: 'crear', dimension } · { tipo: 'renombrar', dimension, id } · { tipo: 'quitar', dimension, id }
  const [accion, setAccion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState(null); // { tipo: 'exito' | 'error', texto }

  const ocupado = bloqueado || guardando;

  const abrir = (nueva) => { setAccion(nueva); setAviso(null); };
  const cerrar = () => setAccion(null);

  // Envía al servidor la lista completa de UNA dimensión
  const enviar = async (dimension, lista, { confirmarEliminacion = false, textoExito }) => {
    setGuardando(true);
    setAviso(null);
    try {
      const nueva = await guardarCasillas({
        materiaProgramadaId: planilla.materiaProgramadaId,
        casillas: { [dimension]: lista },
        ...(confirmarEliminacion ? { confirmarEliminacion: true } : {}),
      });
      onGuardado(nueva);
      setAccion(null);
      setAviso({ tipo: 'exito', texto: textoExito });
    } catch (err) {
      const datos = err.response?.data;
      setAviso({ tipo: 'error', texto: datos?.error || 'No se pudo guardar la casilla. Revisa tu conexión e inténtalo de nuevo.' });
    } finally {
      setGuardando(false);
    }
  };

  const validarNombre = (dimension, texto, idPropio = null) => {
    const nombre = normalizar(texto);
    if (!nombre) return { error: 'Escribe el nombre de la casilla (por ejemplo, «Prueba 1»).' };
    const repetido = casillasDe(planilla, dimension)
      .some((c) => c.id !== idPropio && normalizar(c.nombre || '').toLowerCase() === nombre.toLowerCase());
    if (repetido) return { error: `Ya existe una casilla «${nombre}» en ${dimension}.` };
    return { nombre };
  };

  const crear = (dimension, texto) => {
    const { nombre, error } = validarNombre(dimension, texto);
    if (error) { setAviso({ tipo: 'error', texto: error }); return; }
    const lista = [...casillasDe(planilla, dimension).map((c) => ({ id: c.id, nombre: c.nombre })), { nombre }];
    enviar(dimension, lista, { textoExito: `Casilla «${nombre}» creada en ${dimension}.` });
  };

  const renombrar = (dimension, id, texto) => {
    const { nombre, error } = validarNombre(dimension, texto, id);
    if (error) { setAviso({ tipo: 'error', texto: error }); return; }
    const lista = casillasDe(planilla, dimension).map((c) => ({ id: c.id, nombre: c.id === id ? nombre : c.nombre }));
    enviar(dimension, lista, { textoExito: `Casilla renombrada a «${nombre}».` });
  };

  const quitar = (dimension, casilla) => {
    const lista = casillasDe(planilla, dimension).filter((c) => c.id !== casilla.id).map((c) => ({ id: c.id, nombre: c.nombre }));
    enviar(dimension, lista, {
      confirmarEliminacion: casilla.calificada,
      textoExito: `Casilla «${casilla.nombre || 'sin nombre'}» quitada de ${dimension}.`,
    });
  };

  return (
    <div className="ios-card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-[14px] font-semibold" style={{ color: 'var(--ios-label)' }}>Casillas del trimestre</h3>
          <p className="text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
            Pulsa «Agregar casilla», escribe el nombre y confirma con ✓ (o Enter). Se guarda al instante.
            Cada casilla se califica en números enteros: SER de 0 a 10, SABER de 0 a 45 y HACER de 0 a 40.
            La asistencia de SER se calcula sola, sobre 10.
          </p>
        </div>
        {bloqueado && motivoBloqueo && (
          <span className="text-[12px] font-medium" style={{ color: 'var(--ios-orange)' }}>{motivoBloqueo}</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DIMENSIONES.map((dimension) => {
          const lista = casillasDe(planilla, dimension);
          const total = dimension === 'SER' ? lista.length + 1 : lista.length;
          const creandoAqui = accion?.tipo === 'crear' && accion.dimension === dimension;
          const lleno = lista.length >= maximoManual(dimension);
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

                {lista.map((c, i) => {
                  const nombreVisible = c.nombre || `Casilla ${i + 1}`;
                  const esta = accion?.id === c.id;
                  if (esta && accion.tipo === 'renombrar') {
                    return (
                      <CampoNombre
                        key={c.id}
                        valorInicial={c.nombre || ''}
                        placeholder="Nombre de la casilla"
                        etiqueta={`Nuevo nombre de ${dimension} ${nombreVisible}`}
                        guardando={guardando}
                        onConfirmar={(texto) => renombrar(dimension, c.id, texto)}
                        onCancelar={cerrar}
                      />
                    );
                  }
                  if (esta && accion.tipo === 'quitar') {
                    return (
                      <div key={c.id} className="rounded-lg p-2 space-y-1.5 text-[12px]" style={{ backgroundColor: 'var(--ios-red-light)' }}>
                        <div style={{ color: 'var(--ios-label)' }}>
                          ¿Quitar «{nombreVisible}»?
                          {c.calificada && (
                            <span className="block font-semibold" style={{ color: 'var(--ios-red)' }}>
                              Tiene notas registradas: también se borrarán.
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="ios-btn-primary text-[11px] py-1" style={{ backgroundColor: 'var(--ios-red)' }} disabled={guardando} onClick={() => quitar(dimension, c)}>
                            {guardando ? 'Quitando…' : 'Sí, quitar'}
                          </button>
                          <button type="button" className="ios-btn-ghost text-[11px] py-1" disabled={guardando} onClick={cerrar}>
                            No
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={c.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ backgroundColor: 'var(--ios-surface)' }}>
                      <span className="text-[10px] w-6 text-right shrink-0" style={{ color: 'var(--ios-tertiary)' }}>C{i + 1}</span>
                      <span className="flex-1 text-[12px] truncate" style={{ color: c.nombre ? 'var(--ios-label)' : 'var(--ios-tertiary)' }} title={nombreVisible}>
                        {nombreVisible}
                      </span>
                      {c.calificada && <span className="text-[10px] shrink-0" style={{ color: 'var(--ios-tertiary)' }}>con notas</span>}
                      <BotonIcono titulo={`Renombrar ${nombreVisible}`} disabled={ocupado || Boolean(accion)} onClick={() => abrir({ tipo: 'renombrar', dimension, id: c.id })} color="var(--ios-secondary)">
                        <Pencil size={13} />
                      </BotonIcono>
                      <BotonIcono titulo={`Quitar ${nombreVisible}`} disabled={ocupado || Boolean(accion)} onClick={() => abrir({ tipo: 'quitar', dimension, id: c.id })} color={c.calificada ? 'var(--ios-red)' : 'var(--ios-secondary)'}>
                        <X size={14} />
                      </BotonIcono>
                    </div>
                  );
                })}

                {creandoAqui ? (
                  <CampoNombre
                    valorInicial=""
                    placeholder={`Nombre (ej. Prueba ${lista.length + 1})`}
                    etiqueta={`Nombre de la nueva casilla de ${dimension}`}
                    guardando={guardando}
                    onConfirmar={(texto) => crear(dimension, texto)}
                    onCancelar={cerrar}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={ocupado || Boolean(accion) || lleno}
                    title={lleno ? `Máximo ${maximoManual(dimension)} casillas` : undefined}
                    onClick={() => abrir({ tipo: 'crear', dimension })}
                    className="w-full flex items-center justify-center gap-1 text-[12px] font-semibold py-1.5 rounded-lg disabled:opacity-40"
                    style={{ color: 'var(--ios-blue)', border: '1px dashed var(--ios-separator)' }}
                  >
                    <Plus size={13} /> Agregar casilla
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {aviso && (
        <div
          role={aviso.tipo === 'error' ? 'alert' : 'status'}
          className="p-3 rounded-xl flex items-center gap-2 text-[12px] font-medium"
          style={{
            backgroundColor: aviso.tipo === 'exito' ? 'var(--ios-green-light)' : 'var(--ios-red-light)',
            color: aviso.tipo === 'exito' ? 'var(--ios-green)' : 'var(--ios-red)',
          }}
        >
          {aviso.tipo === 'exito' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {aviso.texto}
        </div>
      )}
    </div>
  );
}
