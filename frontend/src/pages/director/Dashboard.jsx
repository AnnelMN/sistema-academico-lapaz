import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getDirectorDashboard } from '../../services/academico.service';
import PrediccionNoDisponible from '../../components/PrediccionNoDisponible';

const riskBadgeClass = {
  Alto: 'ios-badge ios-badge-danger',
  Medio: 'ios-badge ios-badge-warning',
};

const DirectorDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setLoading(true);
        setError('');
        setDashboard(await getDirectorDashboard());
      } catch (err) {
        console.error('Error cargando dashboard del director:', err);
        setError(err.response?.data?.error || 'No se pudo cargar el panel institucional');
      } finally {
        setLoading(false);
      }
    };

    cargarDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando datos institucionales...
        </p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div
        className="ios-card p-5 text-[13px] font-semibold"
        style={{ backgroundColor: 'var(--ios-red-light)', color: 'var(--ios-red)' }}
      >
        {error || 'No se pudo cargar el panel institucional'}
      </div>
    );
  }

  const textoTrimestre = dashboard.trimestreActivo
    ? `Trimestre ${dashboard.trimestreActivo} (activo)`
    : 'Sin trimestre activo (vacaciones o descanso)';

  const kpiData = [
    {
      label: 'Total estudiantes',
      value: dashboard.totalEstudiantes,
      badge: `Gestión ${dashboard.gestion}`,
      badgeClass: 'ios-badge ios-badge-info',
    },
    {
      label: 'Tasa de aprobación',
      value: `${dashboard.tasaAprobacion}%`,
      badge: `Toda la gestión ${dashboard.gestion}`,
      badgeClass: 'ios-badge ios-badge-success',
    },
    {
      label: 'En riesgo alto',
      value: dashboard.prediccionesDisponibles === false ? '—' : dashboard.riesgoAlto,
      badge: dashboard.prediccionesDisponibles === false ? 'No disponible por ahora' : 'Última predicción',
      badgeClass: 'ios-badge ios-badge-danger',
    },
    {
      label: 'Asistencia media',
      value: `${dashboard.asistenciaMedia}%`,
      badge: 'Presentes + justificados',
      badgeClass: 'ios-badge ios-badge-warning',
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Panel general
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Gestión escolar {dashboard.gestion} · {textoTrimestre}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpiData.map((kpi) => (
          <div key={kpi.label} className="ios-card p-5">
            <div
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--ios-secondary)' }}
            >
              {kpi.label}
            </div>
            <div className="text-[28px] font-bold mb-2" style={{ color: 'var(--ios-label)' }}>
              {kpi.value}
            </div>
            <span className={kpi.badgeClass}>{kpi.badge}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Aprobación por curso — Gestión {dashboard.gestion}
          </div>
          {dashboard.cursos.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
              Aún no hay notas registradas para calcular la aprobación por curso.
            </p>
          ) : (
            <div className="space-y-3.5">
              {dashboard.cursos.map((course) => {
                const isLow = course.val < 75;
                return (
                  <div key={course.id} className="flex items-center gap-3">
                    <div className="w-12 text-[12px] font-semibold" style={{ color: 'var(--ios-secondary)' }}>
                      {course.label}
                    </div>
                    <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--ios-bg)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${course.val}%`,
                          backgroundColor: isLow ? 'var(--ios-orange)' : 'var(--ios-blue)',
                        }}
                      />
                    </div>
                    <div className="w-9 text-right text-[12px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                      {course.val}%
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Estudiantes en riesgo
          </div>
          {dashboard.prediccionesDisponibles === false ? (
            <PrediccionNoDisponible compacto />
          ) : dashboard.estudiantesRiesgo.length === 0 ? (
            <p className="text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
              No hay estudiantes con alertas de riesgo en la última predicción.
            </p>
          ) : (
            <div>
              {dashboard.estudiantesRiesgo.map((student, index) => (
                <div
                  key={student.id}
                  className="flex justify-between items-center gap-3 py-3"
                  style={{
                    borderBottom: index < dashboard.estudiantesRiesgo.length - 1
                      ? '1px solid var(--ios-separator-2)'
                      : 'none',
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--ios-label)' }}>
                      {student.name}
                    </div>
                    <div className="text-[11px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
                      {student.info}
                    </div>
                  </div>
                  <span className={riskBadgeClass[student.risk] || 'ios-badge ios-badge-warning'}>
                    {student.risk}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorDashboard;
