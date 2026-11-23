-- ════════════════════════════════════════════════════════════════════
-- 005 — Formato único de horario "Día-HH:MM"
-- ════════════════════════════════════════════════════════════════════
-- Qué hace:
--   Las clases creadas desde la pantalla del Administrativo guardan el horario
--   como "Lunes-07:30", pero había registros antiguos con espacio
--   ("Lunes 07:30"). Las pantallas y la detección de conflictos comparaban el
--   texto, así que esas clases no se mostraban bien ni chocaban entre sí.
--   Este script cambia SOLO el separador (espacio → guion) en los horarios con
--   el formato antiguo. No cambia el día ni la hora, ni ninguna otra columna.
--   Al 2026-11-22 afecta a 1 registro (id 46673e86-e07d-4483-9672-624c6b6f9598).
--
-- Desde ahora el backend guarda siempre "Día-HH:MM" (src/lib/horario.js).
-- Es reversible con 005_revertir.sql.
--
-- Aplicar (NUNCA con `prisma migrate dev`: la BD se creó con db push):
--   npx prisma db execute --file prisma/sql/005_formato_horario.sql --schema prisma/schema.prisma

UPDATE "materias_programadas"
SET "horario" = regexp_replace("horario", '^([A-Za-zÁÉÍÓÚáéíóú]+)\s+([0-9]{1,2}:[0-9]{2})$', '\1-\2')
WHERE "horario" ~ '^[A-Za-zÁÉÍÓÚáéíóú]+\s+[0-9]{1,2}:[0-9]{2}$';
