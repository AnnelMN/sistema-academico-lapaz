-- ════════════════════════════════════════════════════════════════════
-- REVERTIR 005 — Vuelve el horario modificado a su formato anterior
-- ════════════════════════════════════════════════════════════════════
-- Úsalo SOLO si 005_formato_horario.sql causara un problema. Devuelve al
-- formato con espacio únicamente el registro que 005 modificó (por su id).
--
--   npx prisma db execute --file prisma/sql/005_revertir.sql --schema prisma/schema.prisma

UPDATE "materias_programadas"
SET "horario" = 'Lunes 07:30'
WHERE "id" = '46673e86-e07d-4483-9672-624c6b6f9598' AND "horario" = 'Lunes-07:30';
