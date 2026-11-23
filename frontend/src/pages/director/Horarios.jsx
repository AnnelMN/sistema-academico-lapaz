import { useEffect, useState } from 'react';
import { getProgramaciones } from '../../services/academico.service';

export default function DirectorHorarios() {
  const [programaciones, setProgramaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getProgramaciones();
        setProgramaciones(data || []);
      } catch (err) {
        console.error('Error cargando horarios:', err);
        setError(err.response?.data?.error || 'No se pudieron cargar los horarios');
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando horarios...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="ios-card p-5 text-[13px] font-semibold"
        style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Horarios
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Programaciones de materias por curso
        </p>
      </div>

      <div className="ios-card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Curso</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Materia</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Docente</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Horario</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-right" style={{ color: 'var(--ios-secondary)' }}>Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {programaciones.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
                  No hay horarios registrados.
                </td>
              </tr>
            ) : (
              programaciones.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-slate-50/50 transition-colors"
                  style={p.docente?.usuario?.activo === false ? { opacity: 0.55 } : undefined}
                >
                  <td className="px-4 py-3 text-[12px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                    {p.curso?.nivel}° {p.curso?.paralelo}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--ios-label)' }}>
                    {p.materia?.nombre}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--ios-label)' }}>
                    {p.docente?.usuario?.nombre || 'Sin docente'}
                    {p.docente?.usuario?.activo === false && (
                      <span className="ios-badge ios-badge-neutral ml-2" title="Docente desactivado: el horario se conserva como historial y no ocupa el espacio del curso">
                        Docente inactivo
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px]" style={{ color: 'var(--ios-label)' }}>
                    {p.horario}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-right" style={{ color: 'var(--ios-secondary)' }}>
                    {p.gestion}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
