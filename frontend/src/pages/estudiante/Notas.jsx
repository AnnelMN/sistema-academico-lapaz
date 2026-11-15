import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const getStatusInfo = (total) => {
  if (total >= 51) return { label: 'Aprobado', cls: 'ios-badge ios-badge-success' };
  if (total >= 40) return { label: 'Atención', cls: 'ios-badge ios-badge-warning' };
  return { label: 'En riesgo', cls: 'ios-badge ios-badge-danger' };
};

const Notas = () => {
  const [trimestre, setTrimestre] = useState(1);
  const [notas, setNotas]         = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { cargarDatos(); }, [trimestre]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [notasData, predData] = await Promise.all([
        estudianteService.getMisNotas(trimestre),
        estudianteService.getMiPrediccion(),
      ]);
      setNotas(notasData);
      setPrediccion(predData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-[14px]" style={{ color: 'var(--ios-secondary)' }}>
          Cargando información académica...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 print:space-y-3">

      {/* Header */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
            Historial de Notas
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
            Gestión 2026
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={trimestre}
            onChange={(e) => setTrimestre(parseInt(e.target.value))}
            className="ios-select"
          >
            <option value={1}>1er Trimestre</option>
            <option value={2}>2do Trimestre</option>
            <option value={3}>3er Trimestre</option>
          </select>
          <button onClick={() => window.print()} className="ios-btn-ghost text-[13px]">
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">Boletín Oficial de Calificaciones</h1>
        <p className="text-sm">Gestión 2026 - Trimestre {trimestre}</p>
      </div>

      {/* Tabla iOS */}
      <div className="ios-card overflow-hidden print:shadow-none print:border print:border-gray-300">
        <table className="ios-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th className="text-center">Ser (15)</th>
              <th className="text-center">Saber (35)</th>
              <th className="text-center">Hacer (50)</th>
              <th className="text-center font-bold">Total (100)</th>
              <th className="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>
            {notas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10" style={{ color: 'var(--ios-secondary)' }}>
                  No hay notas registradas para este trimestre.
                </td>
              </tr>
            ) : (
              notas.map((n) => {
                const status = getStatusInfo(n.total);
                return (
                  <tr key={n.id}>
                    <td className="font-semibold">{n.materiaProgramada.materia.nombre}</td>
                    <td className="text-center">{n.ser}</td>
                    <td className="text-center">{n.saber}</td>
                    <td className="text-center">{n.hacer}</td>
                    <td className="text-center font-bold text-[15px]" style={{ color: 'var(--ios-label)' }}>
                      {n.total}
                    </td>
                    <td className="text-center">
                      <span className={status.cls}>{status.label}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Bloque IA */}
      {prediccion && prediccion.nivelRiesgo !== 'SIN_EVALUAR' && (
        <div
          className="ios-card p-5 flex items-start gap-4 print:hidden"
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor:
                prediccion.nivelRiesgo === 'RIESGO_ALTO' ? 'var(--ios-red-light)' :
                prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? 'var(--ios-orange-light)' :
                'var(--ios-green-light)'
            }}
          >
            {prediccion.nivelRiesgo === 'RIESGO_ALTO' ? (
              <AlertTriangle size={20} style={{ color: 'var(--ios-red)' }} />
            ) : prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? (
              <Info size={20} style={{ color: 'var(--ios-orange)' }} />
            ) : (
              <CheckCircle size={20} style={{ color: 'var(--ios-green)' }} />
            )}
          </div>
          <div>
            <h3 className="text-[14px] font-semibold mb-1" style={{ color: 'var(--ios-label)' }}>
              Análisis Predictivo de Rendimiento
            </h3>
            <p className="text-[12px]" style={{ color: 'var(--ios-secondary)' }}>
              Basado en tu historial académico y asistencia, el modelo de IA estima que tu nivel actual es de{' '}
              <strong style={{
                color:
                  prediccion.nivelRiesgo === 'RIESGO_ALTO' ? 'var(--ios-red)' :
                  prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? 'var(--ios-orange)' :
                  'var(--ios-green)'
              }}>
                {prediccion.nivelRiesgo.replace('_', ' ')}
              </strong>.
            </p>
            <div className="mt-1.5 text-[11px]" style={{ color: 'var(--ios-tertiary)' }}>
              Probabilidad estimada de dificultades: {(prediccion.probabilidad * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notas;
