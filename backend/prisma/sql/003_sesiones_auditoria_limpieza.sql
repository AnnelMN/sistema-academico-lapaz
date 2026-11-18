-- ════════════════════════════════════════════════════════════════════
-- 003 — Revocación de sesiones, auditoría de cambios y limpieza (grupo 4)
-- ════════════════════════════════════════════════════════════════════
-- Qué hace:
--   1. usuarios."tokenVersion": permite invalidar todas las sesiones de un usuario
--      (al cambiar contraseña o rol, desactivarlo o "cerrar todas las sesiones").
--   2. Tabla auditoria_cambios: historial de cambios en notas y asistencia
--      (quién, cuándo, valor anterior y nuevo). Con RLS y sin permisos públicos.
--   3. Limpieza de datos antiguos:
--      - notificaciones que guardaban el error técnico del servidor de correo
--        → se reemplaza por un mensaje genérico (no se borran).
--      - códigos de verificación ya usados o vencidos → se eliminan.
--
-- El cifrado de los secretos 2FA (LB-08) NO va aquí: se hace con el script
-- scripts/cifrarSecretos2FA.js porque requiere la clave TOTP_ENC_KEY.
--
-- La estructura (pasos 1 y 2) la generó Prisma con:
--   npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
--     --to-schema-datamodel prisma/schema.prisma --script
--
-- Cómo aplicarlo (desde backend/), después de respaldar las filas afectadas:
--   npx prisma db execute --file prisma/sql/003_sesiones_auditoria_limpieza.sql --schema prisma/schema.prisma
--   npx prisma generate
--
-- ⚠️ NO usar `prisma migrate dev` (la BD se creó con db push: borraría los datos).
-- Para revertir: prisma/sql/003_revertir.sql
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Versión de sesión (generado por Prisma) ──────────────────────
ALTER TABLE "usuarios" ADD COLUMN     "tokenVersion" INTEGER NOT NULL DEFAULT 0;

-- ── 2. Auditoría de cambios (generado por Prisma) ───────────────────
CREATE TABLE "auditoria_cambios" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidadId" TEXT,
    "materiaProgramadaId" TEXT,
    "estudianteId" TEXT,
    "valorAnterior" JSONB,
    "valorNuevo" JSONB,
    "usuarioId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_cambios_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "auditoria_cambios_creadoEn_idx" ON "auditoria_cambios"("creadoEn");
CREATE INDEX "auditoria_cambios_materiaProgramadaId_idx" ON "auditoria_cambios"("materiaProgramadaId");
CREATE INDEX "auditoria_cambios_estudianteId_idx" ON "auditoria_cambios"("estudianteId");

-- Valores permitidos (segunda defensa; Prisma no gestiona CHECK, db push no las borra)
ALTER TABLE "auditoria_cambios"
  ADD CONSTRAINT "auditoria_cambios_accion_check"
    CHECK ("accion" IN ('CREAR', 'MODIFICAR', 'ELIMINAR')),
  ADD CONSTRAINT "auditoria_cambios_entidad_check"
    CHECK ("entidad" IN ('CALIFICACION_CASILLA', 'AUTOEVALUACION', 'CASILLA', 'ASISTENCIA'));

ALTER TABLE "usuarios"
  ADD CONSTRAINT "usuarios_tokenVersion_check" CHECK ("tokenVersion" >= 0);

-- Seguridad: RLS sin políticas + sin permisos para la API pública
ALTER TABLE public."auditoria_cambios" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."auditoria_cambios" FROM anon, authenticated;

-- ── 3. Limpieza de datos antiguos ───────────────────────────────────
UPDATE "notificaciones"
   SET "mensaje" = 'No se pudo enviar el correo de alerta'
 WHERE "mensaje" LIKE 'Fallo al enviar correo:%';

DELETE FROM "codigos_verificacion"
 WHERE "usado" = true OR "expiraEn" < now();

COMMIT;
