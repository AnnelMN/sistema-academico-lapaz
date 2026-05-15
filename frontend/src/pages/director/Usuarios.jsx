import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Search, Power, X } from 'lucide-react';
import { getUsuarios, createUsuario, updateUsuario, toggleEstadoUsuario } from '../../services/usuarios.service';

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'ESTUDIANTE'
  });

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nombre: user.nombre,
        email: user.email,
        password: '',
        rol: user.rol
      });
    } else {
      setEditingUser(null);
      setFormData({
        nombre: '',
        email: '',
        password: '',
        rol: 'ESTUDIANTE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) delete dataToUpdate.password;
        await updateUsuario(editingUser.id, dataToUpdate);
      } else {
        await createUsuario(formData);
      }
      setIsModalOpen(false);
      fetchUsuarios();
    } catch (error) {
      console.error('Error guardando usuario:', error);
    }
  };

  const handleToggleEstado = async (id) => {
    try {
      await toggleEstadoUsuario(id);
      fetchUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
    }
  };

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const getRolColor = (rol) => {
    switch(rol) {
      case 'DIRECTOR': return 'bg-[#dbeafe] text-[#1e40af]';
      case 'PROFESOR': return 'bg-[#fee2e2] text-[#991b1b]';
      case 'ADMINISTRATIVO': return 'bg-[#fef3c7] text-[#92400e]';
      case 'ESTUDIANTE': return 'bg-[#d1fae5] text-[#065f46]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-[18px] font-bold text-[#1a1a2e]">Gestión de Usuarios</h2>
          <p className="text-[11px] text-slate-400">Administra el acceso de personal y estudiantes</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-[#4a90e2] hover:bg-blue-600 text-white text-[11px] font-bold px-4 py-2 rounded-md transition-colors flex items-center gap-2"
        >
          <Plus size={14} /> Nuevo usuario
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-100">
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 border-r border-slate-100">
            <div className="text-[14px] font-bold text-[#1a1a2e]">{usuarios.length}</div>
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Total</div>
          </div>
          <div className="text-center px-4">
            <div className="text-[14px] font-bold text-[#16a34a]">{usuarios.filter(u => u.activo).length}</div>
            <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Activos</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nombre y correo</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rol</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-[12px]">Cargando usuarios...</td>
              </tr>
            ) : filteredUsuarios.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-slate-400 text-[12px]">No se encontraron resultados</td>
              </tr>
            ) : (
              filteredUsuarios.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-bold text-[#1a1a2e]">{user.nombre}</div>
                    <div className="text-[10px] text-slate-400">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getRolColor(user.rol)}`}>
                      {user.rol}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold ${user.activo ? 'text-[#16a34a]' : 'text-[#ef4444]'}`}>
                      {user.activo ? '● Activo' : '● Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleOpenModal(user)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleToggleEstado(user.id)}
                        className={`p-1.5 transition-colors ${user.activo ? 'text-slate-400 hover:text-red-500' : 'text-slate-400 hover:text-emerald-500'}`}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-[14px] font-bold text-[#1a1a2e]">
                {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre completo</label>
                  <input 
                    type="text" 
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo electrónico</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Contraseña {editingUser && '(Opcional)'}
                  </label>
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rol</label>
                  <select 
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-md text-[12px] outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  >
                    <option value="ESTUDIANTE">Estudiante</option>
                    <option value="PROFESOR">Profesor</option>
                    <option value="ADMINISTRATIVO">Administrativo</option>
                    <option value="DIRECTOR">Director</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex gap-2 justify-end">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-[11px] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#4a90e2] hover:bg-blue-600 text-white text-[11px] font-bold rounded-md transition-colors"
                >
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
