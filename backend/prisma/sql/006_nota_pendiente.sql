-- ════════════════════════════════════════════════════════════════════
-- 006 — Nota trimestral "pendiente"
-- ════════════════════════════════════════════════════════════════════
-- Qué hace:
--   Regla acordada con la usuaria el 2026-11-23: mientras a un estudiante le
--   falte alguna casilla de un componente (SER, SABER, HACER), ese componente
--   queda PENDIENTE (no se calcula ni se muestra), y mientras falte cualquier
--   componente o la autoevaluación, la nota final queda "Calificación pendiente".
--   Para poder guardarlo, las columnas ser, saber, hacer, total y aprobado de la
--   tabla notas pasan a aceptar NULL (NULL = pendiente).
--
--   NO borra ni cambia ningún dato: solo quita la restricción NOT NULL.
--   Es reversible con 006_revertir.sql (mientras no haya notas pendientes).
--
-- Aplicar (NUNCA con `prisma migrate dev`: la BD se creó con db push):
--   npx prisma db execute --file prisma/sql/006_nota_pendiente.sql --schema prisma/schema.prisma

ALTER TABLE "notas" ALTER COLUMN "ser"      DROP NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "saber"    DROP NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "hacer"    DROP NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "total"    DROP NOT NULL;
ALTER TABLE "notas" ALTER COLUMN "aprobado" DROP NOT NULL;
