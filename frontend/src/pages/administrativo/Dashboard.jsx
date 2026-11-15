import React, { useEffect, useState } from 'react';
import { UserPlus, Download, Bell, Key, Calendar, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { getCursos, getMaterias, getDocentes } from '../../services/academico.service';
import { getUsuarios } from '../../services/usuarios.service';

const AdminDashboard = () => {
  const [cursos, setCursos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [cData, mData, dData, uData] = await Promise.all([
          getCursos(),
          getMaterias(),
          getDocentes(),
          getUsuarios()
        ]);
        setCursos(cData || []);
        setMaterias(mData || []);
        setDocentes(dData || []);
        setUsuarios(uData || []);
      } catch (err) {
        console.error('Error cargando dashboard administrativo:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalEstudiantes = usuarios.filter(u => u.rol === 'ESTUDIANTE').length;
  const totalDocentes = usuarios.filter(u => u.rol === 'PROFESOR').length;
  const totalAdmin = usuarios.filter(u => u.rol === 'ADMINISTRATIVO').length;
  const totalDirectores = usuarios.filter(u => u.rol === 'DIRECTOR').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <RefreshCw size={30} className="animate-spin" style={{ color: 'var(--ios-blue)' }} />
        <p className="text-[13px] font-medium" style={{ color: 'var(--ios-secondary)' }}>
          Cargando panel administrativo...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
          Panel Administrativo
        </h2>
        <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
          Control de estructura académica: cursos, materias, docentes y usuarios.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Cursos', value: cursos.length, color: 'var(--ios-blue)' },
          { label: 'Materias', value: materias.length, color: 'var(--ios-green)' },
          { label: 'Docentes', value: totalDocentes, color: 'var(--ios-label)' },
          { label: 'Estudiantes', value: totalEstudiantes, color: 'var(--ios-red)' }
        ].map((kpi, i) => (
          <div key={i} className="ios-card p-5 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--ios-secondary)' }}>
              {kpi.label}
            </div>
            <div className="text-[28px] font-bold" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Cursos registrados
          </div>
          <div className="space-y-2">
            {cursos.length === 0 ? (
              <p className="text-[12px] text-slate-500">
                No hay cursos registrados.
              </p>
            ) : (
              cursos.map(c => (
                <div key={c.id} className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                      {c.nivel}° {c.paralelo}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600">Curso {c.nivel}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Materias registradas
          </div>
          <div className="space-y-2">
            {materias.length === 0 ? (
              <p className="text-[12px] text-slate-500">
                No hay materias registradas.
              </p>
            ) : (
              materias.map(m => (
                <div key={m.id} className="flex justify-between items-center py-2">
                  <div>
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                      {m.nombre}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Nivel {m.nivel} · {m.cargaHoraria}h
                    </div>
                  </div>
                  <div className="text-[12px] text-slate-600">{m.cargaHoraria}h</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Usuarios por rol
          </div>
          <div className="space-y-2">
            {[
              { label: 'Director', value: totalDirectores },
              { label: 'Docentes', value: totalDocentes },
              { label: 'Administrativos', value: totalAdmin },
              { label: 'Estudiantes', value: totalEstudiantes }
            ].map(u => (
              <div key={u.label} className="flex justify-between items-center py-2">
                <div className="text-[12px] font-medium" style={{ color: 'var(--ios-label)' }}>
                  {u.label}
                </div>
                <div className="text-[13px] font-bold" style={{ color: 'var(--ios-blue)' }}>
                  {u.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="ios-card p-5">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--ios-label)' }}>
            Acciones rápidas
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ios-bg)' }}>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                  Registrar nuevo curso
                </div>
                <div className="text-[11px] text-slate-500">Define nivel y paralelo</div>
              </div>
              <div className="text-[11px] text-blue-500 font-bold cursor-pointer">Ir a Cursos</div>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: 'var(--ios-bg)' }}>
              <div>
                <div className="text-[12px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                  Registrar nueva materia
                </div>
                <div className="text-[11px] text-slate-500">Define nombre, carga y nivel</div>
              </div>
              <div className="text-[11px] text-blue-500 font-bold cursor-pointer">Ir a Materias</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;