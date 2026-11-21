-- ════════════════════════════════════════════════════════════════════
-- 004 — Índice de predicciones por estudiante y fecha (auditoría R-05)
-- ════════════════════════════════════════════════════════════════════
-- Qué hace:
--   Crea un índice en predicciones_riesgo ("estudianteId", "generadoEn").
--   Las pantallas buscan la ÚLTIMA predicción de cada estudiante (agrupando por
--   estudiante y tomando la fecha máxima) y el servicio de riesgo busca la
--   última del trimestre de un estudiante. Sin índice, PostgreSQL recorre toda
--   la tabla; con el índice, va directo a las filas de ese estudiante.
--
-- No modifica ni borra datos. Es reversible con 004_revertir.sql.
-- El nombre es el que genera Prisma para @@index([estudianteId, generadoEn])
-- en schema.prisma, así la base de datos y el esquema quedan iguales.
--
-- Aplicar (NUNCA con `prisma migrate dev`: la BD se creó con db push):
--   npx prisma db execute --file prisma/sql/004_indice_predicciones.sql --schema prisma/schema.prisma

CREATE INDEX IF NOT EXISTS "predicciones_riesgo_estudianteId_generadoEn_idx"
  ON "predicciones_riesgo" ("estudianteId", "generadoEn");
