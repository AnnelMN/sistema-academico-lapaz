import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle, AlertCircle, Info, ArrowLeft, Users } from 'lucide-react';
import { getEstudiantesConAsistencia, registrarAsistenciaQR } from '../../services/asistencia.service';

// Escáner de QR para registrar ASISTENCIA (PRESENTE) de hoy.
// - El código lo valida el SERVIDOR; aquí solo se lee la cámara.
// - Nunca marca AUSENTE: los pendientes se completan en el registro manual.

const INTERVALO_LECTURA_MS = 200;     // frecuencia de análisis de la cámara
const PAUSA_TRAS_RESULTADO_MS = 1500; // evita lecturas repetidas seguidas
const IGNORAR_MISMO_CODIGO_MS = 60000; // el mismo código (≤ 60 s de vida) solo se envía una vez

const hoyLaPaz = () => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());

const MENSAJE_CAMARA = {
  NotAllowedError: 'Permiso de cámara denegado. Habilítalo en la configuración del navegador.',
  NotFoundError: 'No se encontró ninguna cámara en este dispositivo.',
  NotReadableError: 'La cámara está siendo usada por otra aplicación.',
};

const ESTILO_RESULTADO = {
  exito: 'bg-green-50 text-green-700 border border-green-100',
  aviso: 'bg-amber-50 text-amber-700 border border-amber-100',
  error: 'bg-red-50 text-red-700 border border-red-100',
  info: 'bg-blue-50 text-blue-700 border border-blue-100',
};

export default function EscanerQR({ materias, materiaId, onCambiarMateria, onVolver }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const ocupadoRef = useRef(false);
  const recientesRef = useRef(new Map());
  const ultimoAnalisisRef = useRef(0);
  const frameRef = useRef(null);

  const [camara, setCamara] = useState('detenida'); // detenida | iniciando | activa
  const [resultado, setResultado] = useState(null);  // { tipo, titulo, texto }
  const [estudiantes, setEstudiantes] = useState([]);
  const [escaneos, setEscaneos] = useState([]);       // últimos registros de esta sesión
  const [fecha] = useState(hoyLaPaz);

  // Lista de hoy (para el resumen y los pendientes)
  useEffect(() => {
    if (!materiaId) return undefined;
    let vigente = true;
    getEstudiantesConAsistencia(materiaId, fecha)
      .then((lista) => vigente && setEstudiantes(lista))
      .catch(() => vigente && setResultado({ tipo: 'error', titulo: 'Error', texto: 'No se pudo cargar la lista de estudiantes' }));
    return () => { vigente = false; };
  }, [materiaId, fecha]);

  const detener = useCallback(() => {
    cancelAnimationFrame(frameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamara('detenida');
  }, []);

  // Apagar la cámara al salir de la pantalla o al cambiar de materia
  useEffect(() => detener, [detener, materiaId]);

  const enviar = useCallback(async (codigo) => {
    ocupadoRef.current = true;
    recientesRef.current.set(codigo, Date.now());
    try {
      const r = await registrarAsistenciaQR(materiaId, codigo);
      if (r.resultado === 'REGISTRADO') {
        setResultado({ tipo: 'exito', titulo: r.estudiante.nombre, texto: 'Asistencia registrada' });
        setEscaneos((lista) => [{ id: r.estudiante.id, nombre: r.estudiante.nombre, hora: new Date() }, ...lista].slice(0, 8));
      } else {
        const estados = { PRESENTE: 'presente', AUSENTE: 'ausente', JUSTIFICADO: 'justificado' };
        setResultado({
          tipo: 'aviso',
          titulo: r.estudiante.nombre,
          texto: `Ya estaba registrado hoy como ${estados[r.estado] || r.estado}. No se modificó.`,
        });
      }
      setEstudiantes((lista) => lista.map((e) => (
        e.id === r.estudiante.id && e.estadoHoy === null ? { ...e, estadoHoy: r.estado } : e
      )));
    } catch (err) {
      const datos = err.response?.data || {};
      setResultado({
        tipo: 'error',
        titulo: datos.resultado === 'NO_INSCRITO' ? 'No inscrito' : 'No registrado',
        texto: datos.error || 'No se pudo registrar. Revisa la conexión.',
      });
      // Si falló por la red, permitir reintentar el mismo código
      if (!err.response) recientesRef.current.delete(codigo);
    } finally {
      setTimeout(() => { ocupadoRef.current = false; }, PAUSA_TRAS_RESULTADO_MS);
    }
  }, [materiaId]);

  // Analiza un cuadro de la cámara (se llama en bucle mientras está activa)
  const leerCuadro = useCallback(() => {
    const video = videoRef.current;
    const ahora = Date.now();
    if (!video || video.readyState < 2 || ocupadoRef.current) return;
    if (ahora - ultimoAnalisisRef.current < INTERVALO_LECTURA_MS) return;
    ultimoAnalisisRef.current = ahora;

    const escala = Math.min(1, 640 / video.videoWidth);
    const ancho = Math.floor(video.videoWidth * escala);
    const alto = Math.floor(video.videoHeight * escala);
    const canvas = canvasRef.current;
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, ancho, alto);
    const lectura = jsQR(ctx.getImageData(0, 0, ancho, alto).data, ancho, alto, { inversionAttempts: 'dontInvert' });
    if (!lectura?.data) return;

    // Lecturas repetidas del mismo código: se ignoran
    for (const [codigo, momento] of recientesRef.current) {
      if (ahora - momento > IGNORAR_MISMO_CODIGO_MS) recientesRef.current.delete(codigo);
    }
    if (recientesRef.current.has(lectura.data)) return;
    enviar(lectura.data);
  }, [enviar]);

  // El bucle siempre usa la versión más reciente de leerCuadro
  const leerCuadroRef = useRef(leerCuadro);
  useEffect(() => { leerCuadroRef.current = leerCuadro; }, [leerCuadro]);

  const iniciar = async () => {
    setResultado(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setResultado({ tipo: 'error', titulo: 'Cámara no disponible', texto: 'Este navegador no permite usar la cámara (se requiere HTTPS).' });
      return;
    }
    setCamara('iniciando');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }, audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCamara('activa');
      setResultado({ tipo: 'info', titulo: 'Cámara activa', texto: 'Apunta al código QR del estudiante.' });
      const bucle = () => {
        frameRef.current = requestAnimationFrame(bucle);
        leerCuadroRef.current();
      };
      frameRef.current = requestAnimationFrame(bucle);
    } catch (err) {
      detener();
      setResultado({ tipo: 'error', titulo: 'Cámara no disponible', texto: MENSAJE_CAMARA[err.name] || 'No se pudo iniciar la cámara.' });
    }
  };

  const volver = () => {
    detener();
    onVolver();
  };

  const inscritos = estudiantes.length;
  const registrados = estudiantes.filter((e) => e.estadoHoy !== null).length;
  const presentes = estudiantes.filter((e) => e.estadoHoy === 'PRESENTE').length;
  const pendientes = estudiantes.filter((e) => e.estadoHoy === null);

  const Icono = resultado?.tipo === 'exito' ? CheckCircle : resultado?.tipo === 'info' ? Info : AlertCircle;

  return (
    <div className="space-y-5">
      {/* Resumen en tiempo real */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Inscritos', value: inscritos, color: 'text-slate-600' },
          { label: 'Presentes', value: presentes, color: 'text-[#16a34a]' },
          { label: 'Pendientes', value: inscritos - registrados, color: 'text-[#9ca3af]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 text-center">
            <div className={`text-[22px] font-bold ${color}`}>{value}</div>
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Materia y Curso</label>
          <select
            value={materiaId}
            onChange={(e) => onCambiarMateria(e.target.value)}
            className="w-full border border-slate-200 rounded-md px-3 py-2 text-[12px] text-slate-600 outline-none focus:ring-1 focus:ring-red-500 bg-white"
          >
            {materias.map((m) => (
              <option key={m.id} value={m.id}>{m.curso.nivel}ro {m.curso.paralelo} — {m.materia.nombre}</option>
            ))}
          </select>
        </div>
        <div className="text-[11px] text-slate-500 pb-2">Fecha: <strong>{fecha}</strong> (hoy)</div>

        {camara === 'detenida' ? (
          <button
            type="button"
            onClick={iniciar}
            className="bg-[#4a90e2] text-white text-[11px] font-bold px-5 py-2.5 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <Camera size={14} /> Iniciar escáner
          </button>
        ) : (
          <button
            type="button"
            onClick={detener}
            className="bg-white border border-red-200 text-red-600 text-[11px] font-bold px-5 py-2.5 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <CameraOff size={14} /> Detener escáner
          </button>
        )}
        <button
          type="button"
          onClick={volver}
          className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-5 py-2.5 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft size={14} /> Volver al registro manual
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Cámara y área de lectura */}
        <div className="space-y-3">
          <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {camara !== 'activa' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 text-[12px] gap-2">
                <Camera size={28} />
                {camara === 'iniciando' ? 'Iniciando cámara…' : 'Cámara detenida'}
              </div>
            )}
            {camara === 'activa' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/5 aspect-square border-4 border-white/80 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
              </div>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {resultado && (
            <div className={`p-3 rounded-md flex items-start gap-3 text-[12px] ${ESTILO_RESULTADO[resultado.tipo]}`} role="status" aria-live="polite">
              <Icono size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[13px]">{resultado.titulo}</div>
                <div>{resultado.texto}</div>
              </div>
            </div>
          )}
        </div>

        {/* Últimos escaneos y pendientes */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Registrados por QR en esta sesión</div>
            {escaneos.length === 0 ? (
              <div className="text-[12px] text-slate-400">Todavía ninguno.</div>
            ) : (
              <ul className="space-y-1">
                {escaneos.map((e) => (
                  <li key={`${e.id}-${e.hora.getTime()}`} className="flex justify-between text-[12px] text-slate-700">
                    <span className="flex items-center gap-2"><CheckCircle size={13} className="text-green-600" />{e.nombre}</span>
                    <span className="text-slate-400">{e.hora.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              <Users size={12} /> Pendientes ({pendientes.length})
            </div>
            {pendientes.length === 0 ? (
              <div className="text-[12px] text-slate-400">Todos los estudiantes tienen registro hoy.</div>
            ) : (
              <>
                <ul className="text-[12px] text-slate-600 space-y-0.5 max-h-48 overflow-y-auto">
                  {pendientes.map((e) => <li key={e.id}>{e.nombre}</li>)}
                </ul>
                <div className="text-[11px] text-slate-400 mt-2">
                  No se marcan como ausentes automáticamente: complétalos en el registro manual.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
