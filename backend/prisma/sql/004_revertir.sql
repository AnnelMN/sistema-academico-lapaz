-- ════════════════════════════════════════════════════════════════════
-- REVERTIR 004 — Quita el índice de predicciones
-- ════════════════════════════════════════════════════════════════════
-- Úsalo SOLO si 004_indice_predicciones.sql causara un problema. No afecta
-- ningún dato: solo elimina el índice (las consultas siguen funcionando, más
-- lentas con muchas filas). Después, quitar también la línea
-- @@index([estudianteId, generadoEn]) del modelo PrediccionRiesgo en schema.prisma.
--
--   npx prisma db execute --file prisma/sql/004_revertir.sql --schema prisma/schema.prisma

DROP INDEX IF EXISTS "predicciones_riesgo_estudianteId_generadoEn_idx";
