import { useState, useEffect } from 'react';
import { Plus, Edit2, Search, Power, X } from 'lucide-react';
import { getUsuarios, createUsuario, updateUsuario, toggleEstadoUsuario } from '../../services/usuarios.service';
import { getCursos } from '../../services/academico.service';

// Etiquetas visibles de cada rol (en la base de datos el docente es PROFESOR)
const ETIQUETA_ROL = {
  DIRECTOR: 'Director',
  PROFESOR: 'Docente',
  ADMINISTRATIVO: 'Administrativo',
  ESTUDIANTE: 'Estudiante',
};

// Roles que el Director puede crear (la cuenta de Director no se crea desde aquí)
const ROLES_CREABLES = ['ESTUDIANTE', 'PROFESOR', 'ADMINISTRATIVO'];

const FORM_VACIO = { nombre: '', email: '', password: '', rol: 'ESTUDIANTE', cursoId: '', emailTutor: '', especialidad: '' };

const getRolBadge = (rol) => {
  switch (rol) {
    case 'DIRECTOR':      return 'ios-badge ios-badge-info';
    case 'PROFESOR':      return 'ios-badge ios-badge-danger';
    case 'ADMINISTRATIVO':return 'ios-badge ios-badge-warning';
    case 'ESTUDIANTE':    return 'ios-badge ios-badge-success';
    default:              return 'ios-badge ios-badge-neutral';
  }
};

const etiquetaCampo = 'block text-[11px] font-semibold uppercase tracking-wider mb-1.5';

const Usuarios = () => {
  const [usuarios, setUsuarios]       = useState([]);
  const [cursos, setCursos]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filtroRol, setFiltroRol]     = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData]       = useState(FORM_VACIO);
  const [localError, setLocalError]   = useState('');
  const [guardando, setGuardando]     = useState(false);
  const [confirmarEstado, setConfirmarEstado] = useState(null); // usuario a activar/desactivar
  const [errorPagina, setErrorPagina] = useState('');

  const fetchUsuarios = async () => {
    try {
      setUsuarios(await getUsuarios());
    } catch (err) {
      console.error(err);
      setErrorPagina(err.response?.data?.error || 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Carga inicial (las recargas posteriores usan fetchUsuarios)
  useEffect(() => {
    const cargar = async () => {
      try {
        const [listaUsuarios, listaCursos] = await Promise.all([getUsuarios(), getCursos()]);
        setUsuarios(listaUsuarios);
        setCursos(listaCursos || []);
      } catch (err) {
        console.error(err);
        setErrorPagina(err.response?.data?.error || 'No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

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
        password: '', // la contraseña actual nunca se muestra: solo se puede asignar una nueva
        rol: user.rol,
        cursoId: user.estudiante?.curso?.id || '',
        emailTutor: user.estudiante?.emailTutor || '',
        especialidad: user.docente?.especialidad || '',
      });
    } else {
      setEditingUser(null);
      setFormData(FORM_VACIO);
    }
    setLocalError('');
    setIsModalOpen(true);
  };

  // Solo un Administrativo puede pasar a Docente; los demás roles no cambian
  const rolEditable = !editingUser || editingUser.rol === 'ADMINISTRATIVO';
  const opcionesRol = !editingUser
    ? ROLES_CREABLES
    : editingUser.rol === 'ADMINISTRATIVO' ? ['ADMINISTRATIVO', 'PROFESOR'] : [editingUser.rol];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const { rol } = formData;
    if (rol === 'ESTUDIANTE' && !formData.cursoId) {
      setLocalError('Seleccione el curso del estudiante');
      return;
    }
    if (rol === 'ESTUDIANTE' && !formData.emailTutor.trim()) {
      setLocalError('Ingrese el correo del tutor: recibe los avisos de riesgo y de faltas');
      return;
    }
    if (rol === 'PROFESOR' && !formData.especialidad.trim()) {
      setLocalError('Ingrese la especialidad del docente');
      return;
    }

    // Solo se envían los campos que corresponden al rol
    const datos = { nombre: formData.nombre, email: formData.email, rol };
    if (formData.password) datos.password = formData.password;
    if (rol === 'ESTUDIANTE') {
      datos.cursoId = formData.cursoId;
      datos.emailTutor = formData.emailTutor;
    }
    if (rol === 'PROFESOR') datos.especialidad = formData.especialidad;

    try {
      setGuardando(true);
      if (editingUser) {
        await updateUsuario(editingUser.id, datos);
      } else {
        await createUsuario(datos);
      }
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      setLocalError(err.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggle = async () => {
    const user = confirmarEstado;
    setConfirmarEstado(null);
    setErrorPagina('');
    try {
      await toggleEstadoUsuario(user.id);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      setErrorPagina(err.response?.data?.error || 'No se pudo cambiar el estado del usuario');
    }
  };

  const texto = search.toLowerCase();
  const filtered = usuarios.filter(u =>
    (u.nombre.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto))
    && (!filtroRol || u.rol === filtroRol)
    && (!filtroEstado || (filtroEstado === 'ACTIVO' ? u.activo : !u.activo))
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
            Crea docentes, administrativos y estudiantes, y activa o desactiva su acceso
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

      {errorPagina && (
        <div className="ios-card p-3 text-[12px] text-red-600">{errorPagina}</div>
      )}

      {/* Search + Filters + Stats */}
      <div className="ios-card p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
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
          <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="ios-select" aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            {Object.entries(ETIQUETA_ROL).map(([valor, etiqueta]) => (
              <option key={valor} value={valor}>{etiqueta}</option>
            ))}
          </select>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="ios-select" aria-label="Filtrar por estado">
            <option value="">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
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
      <div className="ios-card overflow-x-auto">
        <table className="ios-table">
          <thead>
            <tr>
              <th>Nombre y correo</th>
              <th>Curso / especialidad</th>
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
                    {user.estudiante?.curso
                      ? `${user.estudiante.curso.nivel}° ${user.estudiante.curso.paralelo}`
                      : user.docente?.especialidad || '-'}
                  </td>
                  <td>
                    <span className={getRolBadge(user.rol)}>{ETIQUETA_ROL[user.rol] || user.rol}</span>
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
                        title="Editar"
                        aria-label={`Editar a ${user.nombre}`}
                        className="p-2 rounded-xl transition-all hover:bg-[#EAF4FF]"
                        style={{ color: 'var(--ios-secondary)' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      {user.rol !== 'DIRECTOR' && (
                        <button
                          onClick={() => setConfirmarEstado(user)}
                          title={user.activo ? 'Desactivar' : 'Activar'}
                          aria-label={`${user.activo ? 'Desactivar' : 'Activar'} a ${user.nombre}`}
                          className="p-2 rounded-xl transition-all"
                          style={{ color: user.activo ? 'var(--ios-secondary)' : 'var(--ios-green)' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = user.activo ? '#FFECEB' : '#E8F8ED'; e.currentTarget.style.color = user.activo ? 'var(--ios-red)' : 'var(--ios-green)'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = user.activo ? 'var(--ios-secondary)' : 'var(--ios-green)'; }}
                        >
                          <Power size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmación de activar / desactivar */}
      {confirmarEstado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-md p-6 space-y-4"
            style={{ backgroundColor: 'var(--ios-surface)', borderRadius: 'var(--ios-radius-lg)', boxShadow: 'var(--ios-shadow-md)' }}>
            <h3 className="text-[16px] font-semibold" style={{ color: 'var(--ios-label)' }}>
              {confirmarEstado.activo ? 'Desactivar' : 'Activar'} a {confirmarEstado.nombre}
            </h3>
            <p className="text-[13px]" style={{ color: 'var(--ios-secondary)' }}>
              {confirmarEstado.activo
                ? (confirmarEstado.rol === 'ESTUDIANTE'
                  ? 'No podrá ingresar al sistema y dejará de aparecer en las listas de notas y asistencia del docente. Su historial académico se conserva.'
                  : 'No podrá ingresar al sistema y se cerrarán sus sesiones abiertas. Sus datos se conservan.')
                : (confirmarEstado.rol === 'ESTUDIANTE'
                  ? 'Podrá volver a ingresar y aparecerá otra vez en las listas del docente, con todo su historial.'
                  : 'Podrá volver a ingresar al sistema.')}
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmarEstado(null)}
                className="px-5 py-2.5 text-[13px] font-semibold rounded-xl transition-all hover:bg-[#F2F2F7]"
                style={{ color: 'var(--ios-secondary)' }}>
                Cancelar
              </button>
              <button type="button" onClick={handleToggle} className="ios-btn-primary text-[13px]">
                {confirmarEstado.activo ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear / editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}>
          <div
            className="w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
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
                aria-label="Cerrar"
                className="p-1.5 rounded-full transition-all hover:bg-[#F2F2F7]"
                style={{ color: 'var(--ios-secondary)' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={etiquetaCampo} style={{ color: 'var(--ios-secondary)' }}>Rol</label>
                <select name="rol" value={formData.rol} onChange={handleInputChange}
                  disabled={!rolEditable} className="ios-select w-full">
                  {opcionesRol.map((rol) => (
                    <option key={rol} value={rol}>{ETIQUETA_ROL[rol]}</option>
                  ))}
                </select>
                {editingUser && !rolEditable && (
                  <div className="text-[11px] mt-1" style={{ color: 'var(--ios-tertiary)' }}>
                    El rol de este usuario no se puede cambiar.
                  </div>
                )}
              </div>

              {[
                { label: 'Nombre completo', name: 'nombre', type: 'text', required: true },
                { label: 'Correo electrónico', name: 'email', type: 'email', required: true },
              ].map(field => (
                <div key={field.name}>
                  <label className={etiquetaCampo} style={{ color: 'var(--ios-secondary)' }}>{field.label}</label>
                  <input type={field.type} name={field.name} value={formData[field.name]}
                    onChange={handleInputChange} required={field.required} className="ios-input" />
                </div>
              ))}

              <div>
                <label className={etiquetaCampo} style={{ color: 'var(--ios-secondary)' }}>
                  {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
                </label>
                <input type="password" name="password" value={formData.password}
                  onChange={handleInputChange} required={!editingUser} autoComplete="new-password"
                  className="ios-input" />
                <div className="text-[11px] mt-1" style={{ color: 'var(--ios-tertiary)' }}>
                  {editingUser
                    ? 'La contraseña actual no se puede ver. Déjelo vacío para no cambiarla; si asigna una nueva, se cerrarán sus sesiones.'
                    : 'Mínimo 10 caracteres, con al menos una letra y un número.'}
                </div>
              </div>

              {formData.rol === 'ESTUDIANTE' && (
                <>
                  <div>
                    <label className={etiquetaCampo} style={{ color: 'var(--ios-secondary)' }}>Curso</label>
                    <select name="cursoId" value={formData.cursoId || ''} onChange={handleInputChange}
                      required className="ios-select w-full">
                      <option value="">Seleccionar curso</option>
                      {cursos.map(c => (
                        <option key={c.id} value={c.id}>{c.nivel}° {c.paralelo}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={etiquetaCampo} style={{ color: 'var(--ios-secondary)' }}>Correo del tutor</label>
                    <input type="email" name="emailTutor" value={formData.emailTutor}
                      onChange={handleInputChange} required className="ios-input" />
                    <div className="text-[11px] mt-1" style={{ color: 'var(--ios-tertiary)' }}>
                      Recibe los avisos de riesgo académico y de exceso de faltas.
                    </div>
                  </div>
                </>
              )}

              {formData.rol === 'PROFESOR' && (
                <div>
                  <label className={etiquetaCampo} style={{ color: 'var(--ios-secondary)' }}>Especialidad</label>
                  <input type="text" name="especialidad" value={formData.especialidad}
                    onChange={handleInputChange} required maxLength={100} className="ios-input" />
                </div>
              )}

              {localError && (
                <div className="text-[11px] text-red-600 mt-1">{localError}</div>
              )}

              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-[13px] font-semibold rounded-xl transition-all hover:bg-[#F2F2F7]"
                  style={{ color: 'var(--ios-secondary)' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="ios-btn-primary text-[13px]">
                  {guardando ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
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
