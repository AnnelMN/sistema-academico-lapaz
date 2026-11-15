import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Search, Power, X } from 'lucide-react';
import { getUsuarios, createUsuario, updateUsuario, toggleEstadoUsuario } from '../../services/usuarios.service';
import { getCursos } from '../../services/academico.service';

const getRolBadge = (rol) => {
  switch (rol) {
    case 'DIRECTOR':      return 'ios-badge ios-badge-info';
    case 'PROFESOR':      return 'ios-badge ios-badge-danger';
    case 'ADMINISTRATIVO':return 'ios-badge ios-badge-warning';
    case 'ESTUDIANTE':    return 'ios-badge ios-badge-success';
    default:              return 'ios-badge ios-badge-neutral';
  }
};

const Usuarios = () => {
  const [usuarios, setUsuarios]       = useState([]);
  const [cursos, setCursos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData]       = useState({ nombre: '', email: '', password: '', rol: 'ESTUDIANTE', cursoId: '' });
  const [localError, setLocalError]   = useState('');

  useEffect(() => {
    fetchUsuarios();
    fetchCursos();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setUsuarios(await getUsuarios());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCursos = async () => {
    try {
      const data = await getCursos();
      setCursos(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setLocalError('');
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '',
        rol: user.rol,
        cursoId: user.estudiante?.curso?.id || '',
      });
    } else {
      setEditingUser(null);
      setFormData({ nombre: '', email: '', password: '', rol: 'ESTUDIANTE', cursoId: '' });
    }
    setLocalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (formData.rol === 'ESTUDIANTE' && !formData.cursoId) {
      setLocalError('Debe seleccionar un curso para el estudiante');
      return;
    }

    try {
      if (editingUser) {
        const data = { ...formData };
        if (!data.password) delete data.password;
        await updateUsuario(editingUser.id, data);
      } else {
        await createUsuario(formData);
      }
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      setLocalError(err.response?.data?.error || 'Error al guardar usuario');
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleEstadoUsuario(id);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-[20px] font-bold" style={{ color: 'var(--ios-label)' }}>
            Gestión de Usuarios
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--ios-secondary)' }}>
            Administra el acceso de personal y estudiantes
          </p>
        </div>
        <button
          id="btn-nuevo-usuario"
          onClick={() => handleOpenModal()}
          className="ios-btn-primary text-[13px]"
        >
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      {/* Search + Stats */}
      <div className="ios-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ios-input pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={14}
            style={{ color: 'var(--ios-tertiary)' }} />
        </div>
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-[18px] font-bold" style={{ color: 'var(--ios-label)' }}>{usuarios.length}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Total</div>
          </div>
          <div className="text-center">
            <div className="text-[18px] font-bold" style={{ color: 'var(--ios-green)' }}>
              {usuarios.filter(u => u.activo).length}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ios-secondary)' }}>Activos</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="ios-card overflow-hidden">
        <table className="ios-table">
          <thead>
            <tr>
              <th>Nombre y correo</th>
              <th>Curso</th>
              <th>Rol</th>
              <th>Estado</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: 'var(--ios-secondary)' }}>
                  Cargando usuarios...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8" style={{ color: 'var(--ios-secondary)' }}>
                  No se encontraron resultados
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="font-semibold text-[13px]" style={{ color: 'var(--ios-label)' }}>{user.nombre}</div>
                    <div className="text-[11px]" style={{ color: 'var(--ios-secondary)' }}>{user.email}</div>
                  </td>
                  <td className="text-[12px]">
                    {user.estudiante?.curso ? `${user.estudiante.curso.nivel}° ${user.estudiante.curso.paralelo}` : '-'}
                  </td>
                  <td>
                    <span className={getRolBadge(user.rol)}>{user.rol}</span>
                  </td>
                  <td>
                    <span
                      className="text-[12px] font-semibold"
                      style={{ color: user.activo ? 'var(--ios-green)' : 'var(--ios-red)' }}
                    >
                      {user.activo ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => handleOpenModal(user)}
                        className="p-2 rounded-xl transition-all hover:bg-[#EAF4FF]"
                        style={{ color: 'var(--ios-secondary)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleToggle(user.id)}
                        className="p-2 rounded-xl transition-all"
                        style={{ color: user.activo ? 'var(--ios-secondary)' : 'var(--ios-green)' }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = user.activo ? '#FFECEB' : '#E8F8ED'; e.currentTarget.style.color = user.activo ? 'var(--ios-red)' : 'var(--ios-green)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = user.activo ? 'var(--ios-secondary)' : 'var(--ios-green)'; }}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal iOS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-md overflow-hidden"
            style={{
              backgroundColor: 'var(--ios-surface)',
              borderRadius: 'var(--ios-radius-lg)',
              boxShadow: 'var(--ios-shadow-md)',
            }}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 flex justify-between items-center"
              style={{ borderBottom: '1px solid var(--ios-separator)' }}>
              <h3 className="text-[16px] font-semibold" style={{ color: 'var(--ios-label)' }}>
                {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full transition-all hover:bg-[#F2F2F7]"
                style={{ color: 'var(--ios-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {[
                { label: 'Nombre completo', name: 'nombre', type: 'text', required: true },
                { label: 'Correo electrónico', name: 'email', type: 'email', required: true },
                { label: `Contraseña${editingUser ? ' (opcional)' : ''}`, name: 'password', type: 'password', required: !editingUser },
              ].map(field => (
                <div key={field.name}>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--ios-secondary)' }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    required={field.required}
                    className="ios-input"
                  />
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'var(--ios-secondary)' }}>
                  Rol
                </label>
                <select name="rol" value={formData.rol} onChange={handleInputChange}
                  className="ios-select w-full">
                  <option value="ESTUDIANTE">Estudiante</option>
                  <option value="PROFESOR">Profesor</option>
                  <option value="ADMINISTRATIVO">Administrativo</option>
                  <option value="DIRECTOR">Director</option>
                </select>
              </div>

              {formData.rol === 'ESTUDIANTE' && (
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: 'var(--ios-secondary)' }}>
                    Curso
                  </label>
                  <select name="cursoId" value={formData.cursoId || ''} onChange={handleInputChange}
                    className="ios-select w-full">
                    <option value="">Seleccionar curso</option>
                    {cursos.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nivel}° {c.paralelo}
                      </option>
                    ))}
                  </select>
                  {localError && formData.rol === 'ESTUDIANTE' && !formData.cursoId && (
                    <div className="text-[11px] text-red-600 mt-1">Seleccione un curso</div>
                  )}
                </div>
              )}

              {localError && !(
                formData.rol === 'ESTUDIANTE' && !formData.cursoId
              ) && (
                <div className="text-[11px] text-red-600 mt-1">{localError}</div>
              )}

              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[13px] font-semibold rounded-xl transition-all hover:bg-[#F2F2F7]"
                  style={{ color: 'var(--ios-secondary)' }}>
                  Cancelar
                </button>
                <button type="submit" className="ios-btn-primary text-[13px]">
                  {editingUser ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
