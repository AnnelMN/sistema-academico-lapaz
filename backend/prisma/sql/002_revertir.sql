-- ════════════════════════════════════════════════════════════════════
-- REVERTIR 002 — Vuelve a la estructura anterior de notas
-- ════════════════════════════════════════════════════════════════════
-- Úsalo SOLO si 002_notas_por_casillas.sql causara un problema.
-- ⚠️ Elimina las casillas, sus calificaciones y los periodos trimestrales.
-- Las 15 notas de prueba y las 4 filas de configuración borradas NO vuelven
-- con este archivo: se restauran desde la copia de respaldo tomada antes de
-- aplicar 002 (no se guarda en el repositorio porque contiene datos de estudiantes).
-- Después de revertir, también hay que volver schema.prisma a la versión anterior
-- (git) y ejecutar `npx prisma generate`.
--
--   npx prisma db execute --file prisma/sql/002_revertir.sql --schema prisma/schema.prisma
-- ════════════════════════════════════════════════════════════════════

BEGIN;

DROP TABLE IF EXISTS "calificaciones_casilla";
DROP TABLE IF EXISTS "casillas";
DROP TABLE IF EXISTS "periodos_trimestrales";
DROP TYPE  IF EXISTS "Dimension";

ALTER TABLE "notas"
  DROP CONSTRAINT IF EXISTS "notas_trimestre_check",
  DROP CONSTRAINT IF EXISTS "notas_ser_check",
  DROP CONSTRAINT IF EXISTS "notas_saber_check",
  DROP CONSTRAINT IF EXISTS "notas_hacer_check",
  DROP CONSTRAINT IF EXISTS "notas_autoevaluacion_check",
  DROP CONSTRAINT IF EXISTS "notas_total_check",
  DROP COLUMN IF EXISTS "autoevaluacion",
  ALTER COLUMN "ser"   SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "saber" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "hacer" SET DATA TYPE DOUBLE PRECISION,
  ALTER COLUMN "total" SET DATA TYPE DOUBLE PRECISION;

COMMIT;
