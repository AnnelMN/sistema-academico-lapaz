// Auditoría de cambios en notas y asistencia (control B de la Skill de seguridad).
// Se escribe SIEMPRE dentro de la misma transacción que el cambio: o se guardan
// los dos o ninguno. Solo el Director puede consultarla (GET /api/auditoria) y
// no existe ninguna ruta para editarla ni borrarla.

const ENTIDADES = Object.freeze(['CALIFICACION_CASILLA', 'AUTOEVALUACION', 'CASILLA', 'ASISTENCIA']);

// Determina la acción a partir del valor anterior y el nuevo (null = no existía / se borró)
const accionDe = (anterior, nuevo) => {
  if (anterior === null || anterior === undefined) return 'CREAR';
  if (nuevo === null || nuevo === undefined) return 'ELIMINAR';
  return 'MODIFICAR';
};

/**
 * cambios: [{ entidad, accion, entidadId?, materiaProgramadaId?, estudianteId?,
 *             valorAnterior?, valorNuevo?, usuarioId }]
 * cliente: la transacción (tx) en curso.
 */
async function registrarCambios(cliente, cambios) {
  if (!cambios.length) return;
  for (const c of cambios) {
    if (!ENTIDADES.includes(c.entidad)) throw new Error(`Entidad de auditoría no válida: ${c.entidad}`);
    if (!c.usuarioId) throw new Error('La auditoría requiere el usuario que hizo el cambio');
  }
  await cliente.auditoriaCambio.createMany({
    data: cambios.map((c) => ({
      entidad: c.entidad,
      accion: c.accion,
      entidadId: c.entidadId ?? null,
      materiaProgramadaId: c.materiaProgramadaId ?? null,
      estudianteId: c.estudianteId ?? null,
      ...(c.valorAnterior !== undefined && c.valorAnterior !== null ? { valorAnterior: c.valorAnterior } : {}),
      ...(c.valorNuevo !== undefined && c.valorNuevo !== null ? { valorNuevo: c.valorNuevo } : {}),
      usuarioId: c.usuarioId,
    })),
  });
}

module.exports = { ENTIDADES, accionDe, registrarCambios };
