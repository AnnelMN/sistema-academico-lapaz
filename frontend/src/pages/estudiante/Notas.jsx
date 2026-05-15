import React, { useState, useEffect } from 'react';
import { Download, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import estudianteService from '../../services/estudiante.service';

const Notas = () => {
  const [trimestre, setTrimestre] = useState(1);
  const [notas, setNotas] = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [trimestre]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [notasData, prediccionData] = await Promise.all([
        estudianteService.getMisNotas(trimestre),
        estudianteService.getMiPrediccion()
      ]);
      setNotas(notasData);
      setPrediccion(prediccionData);
    } catch (error) {
      console.error('Error cargando notas y prediccion:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (notaTotal) => {
    if (notaTotal >= 51) return { label: 'Aprobado', bg: 'bg-green-100', text: 'text-green-700' };
    if (notaTotal >= 40) return { label: 'Atención', bg: 'bg-amber-100', text: 'text-amber-700' };
    return { label: 'Riesgo', bg: 'bg-red-100', text: 'text-red-700' };
  };

  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando información académica...</div>;
  }

  return (
    <div className="space-y-5 print:space-y-3">
      
      {/* Header con selectores (no visible en print) */}
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-[16px] font-bold text-[#1a1a2e]">Historial de Notas</h2>
        <div className="flex gap-3">
          <select 
            value={trimestre}
            onChange={(e) => setTrimestre(parseInt(e.target.value))}
            className="border border-slate-200 rounded-md px-3 py-1.5 text-[12px] outline-none focus:ring-1 focus:ring-[#1a4731]"
          >
            <option value={1}>1er Trimestre</option>
            <option value={2}>2do Trimestre</option>
            <option value={3}>3er Trimestre</option>
          </select>
          <button 
            onClick={handleImprimir}
            className="flex items-center gap-2 bg-[#1a4731] hover:bg-[#123624] text-white px-4 py-1.5 rounded-md text-[12px] font-bold transition-colors"
          >
            <Download size={14} /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Título solo visible en print */}
      <div className="hidden print:block text-center mb-6">
        <h1 className="text-xl font-bold">Boletín Oficial de Calificaciones</h1>
        <p className="text-sm">Gestión 2026 - Trimestre {trimestre}</p>
      </div>

      {/* Tabla de notas */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-black">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 print:bg-gray-200 print:border-black">
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider print:text-black">Materia</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center print:text-black">Ser (15)</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center print:text-black">Saber (35)</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center print:text-black">Hacer (50)</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center print:text-black">Total (100)</th>
              <th className="px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center print:text-black">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 print:divide-black">
            {notas.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-5 py-8 text-center text-slate-500 text-[12px]">
                  No hay notas registradas para este trimestre.
                </td>
              </tr>
            ) : (
              notas.map((n) => {
                const status = getStatusInfo(n.total);
                return (
                  <tr key={n.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-[12px] font-semibold text-slate-700 print:text-black">
                      {n.materiaProgramada.materia.nombre}
                    </td>
                    <td className="px-5 py-3 text-[12px] text-center text-slate-600 print:text-black">{n.ser}</td>
                    <td className="px-5 py-3 text-[12px] text-center text-slate-600 print:text-black">{n.saber}</td>
                    <td className="px-5 py-3 text-[12px] text-center text-slate-600 print:text-black">{n.hacer}</td>
                    <td className="px-5 py-3 text-[13px] font-bold text-center text-[#1a1a2e] print:text-black">{n.total}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase ${status.bg} ${status.text} print:bg-transparent print:text-black print:border print:border-black`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Predicción IA - Al final */}
      {prediccion && prediccion.nivelRiesgo !== 'SIN_EVALUAR' && (
        <div className="mt-6 bg-slate-50 rounded-lg p-5 border border-slate-200 print:hidden">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${
              prediccion.nivelRiesgo === 'RIESGO_ALTO' ? 'bg-red-100 text-red-600' :
              prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? 'bg-amber-100 text-amber-600' :
              'bg-green-100 text-green-600'
            }`}>
              {prediccion.nivelRiesgo === 'RIESGO_ALTO' ? <AlertTriangle size={24} /> :
               prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? <Info size={24} /> :
               <CheckCircle size={24} />}
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-[#1a1a2e] mb-1">Análisis Predictivo de Rendimiento</h3>
              <p className="text-[12px] text-slate-600">
                Basado en tu historial académico y asistencia, el modelo de IA estima que tu nivel actual es de 
                <strong className={`ml-1 ${
                  prediccion.nivelRiesgo === 'RIESGO_ALTO' ? 'text-red-600' :
                  prediccion.nivelRiesgo === 'RIESGO_MEDIO' ? 'text-amber-600' :
                  'text-green-600'
                }`}>
                  {prediccion.nivelRiesgo.replace('_', ' ')}
                </strong>.
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Probabilidad estimada de dificultades: {(prediccion.probabilidad * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Notas;
