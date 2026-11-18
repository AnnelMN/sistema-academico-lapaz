-- ════════════════════════════════════════════════════════════════════
-- REVERTIR 003 — Quita tokenVersion y la tabla de auditoría
-- ════════════════════════════════════════════════════════════════════
-- Úsalo SOLO si 003_sesiones_auditoria_limpieza.sql causara un problema.
-- ⚠️ Borra el historial de auditoría registrado desde que se aplicó 003.
-- La limpieza (mensajes de notificaciones y códigos vencidos) NO se revierte
-- con este archivo: esos datos se restauran desde la copia de respaldo tomada
-- antes de aplicar 003 (no se guarda en el repositorio).
-- Después de revertir, volver schema.prisma a la versión anterior (git) y
-- ejecutar `npx prisma generate`.
--
--   npx prisma db execute --file prisma/sql/003_revertir.sql --schema prisma/schema.prisma
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS "auditoria_cambios";

ALTER TABLE "usuarios"
  DROP CONSTRAINT IF EXISTS "usuarios_tokenVersion_check",
  DROP COLUMN IF EXISTS "tokenVersion";

COMMIT;
