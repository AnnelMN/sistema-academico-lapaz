-- ════════════════════════════════════════════════════════════════════
-- REVERTIR 006 — Vuelve a exigir valores en ser, saber, hacer, total y aprobado
-- ════════════════════════════════════════════════════════════════════
-- Úsalo SOLO si 006_nota_pendiente.sql causara un problema.
--
-- Si ya hay notas pendientes (con NULL), este script SE DETIENE sin cambiar nada:
-- no inventa números. En ese caso, primero hay que volver el código a la versión
-- anterior (que calcula vacías como 0) y recalcular las notas
-- (node scripts/recalcularNotas.js), y recién después ejecutar este script.
--
--   npx prisma db execute --file prisma/sql/006_revertir.sql --schema prisma/schema.prisma

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "notas"
    WHERE "ser" IS NULL OR "saber" IS NULL OR "hacer" IS NULL OR "total" IS NULL OR "aprobado" IS NULL
  ) THEN
    RAISE EXCEPTION 'Hay notas pendientes (NULL): recalcula con el código anterior antes de revertir 006';
  END IF;
END $$;

ALTER TABLE "notas" ALTER COLUMN "ser"      SET NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "saber"    SET NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "hacer"    SET NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "total"    SET NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "aprobado" SET NOT NULL;
