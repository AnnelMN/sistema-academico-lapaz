-- ════════════════════════════════════════════════════════════════════
-- 002 — Notas por casillas (escala real de la UE La Paz "A")
-- ════════════════════════════════════════════════════════════════════
-- Escala: SER 10 + SABER 45 + HACER 40 + AUTOEVALUACIÓN 5 = 100.
-- SER, SABER y HACER se califican por casillas (enteros 0–100) que define el
-- docente (máx. 20 por dimensión); una casilla de SER es la asistencia.
-- La autoevaluación es un entero 0–5 que registra el docente.
--
-- Qué hace:
--   1. Borra las 15 notas de prueba (escala antigua 15/35/50, no convertibles).
--   2. Deja una sola fila en "configuracion" (había 5 idénticas; se conserva 'config-1').
--   3. "notas" pasa a ser el RESUMEN del trimestre: columnas enteras + autoevaluacion.
--   4. Crea "casillas", "calificaciones_casilla" y "periodos_trimestrales".
--   5. Reglas de validación en la base de datos (CHECK) como segunda defensa.
--   6. Activa RLS y retira permisos de la API pública en las tablas nuevas.
--
-- Qué NO toca: usuarios, estudiantes, docentes, cursos, materias, horarios,
-- asistencias, predicciones ni notificaciones.
--
-- El SQL de estructura (pasos 3 y 4) fue generado por Prisma con:
--   npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
--     --to-schema-datamodel prisma/schema.prisma --script
--
-- Cómo aplicarlo (desde backend/), después de respaldar las filas que se borran:
--   npx prisma db execute --file prisma/sql/002_notas_por_casillas.sql --schema prisma/schema.prisma
--   npx prisma generate
--
-- ⚠️ NO usar `prisma migrate dev` (la BD se creó con db push: borraría los datos).
-- Para revertir: prisma/sql/002_revertir.sql
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Notas de prueba (escala antigua) ─────────────────────────────
DELETE FROM "notas";

-- ── 2. Configuración duplicada: se conserva solo 'config-1' ─────────
DELETE FROM "configuracion" WHERE "id" <> 'config-1';

-- ── 3 y 4. Estructura (generada por Prisma) ─────────────────────────
-- CreateEnum
CREATE TYPE "Dimension" AS ENUM ('SER', 'SABER', 'HACER');

-- AlterTable
ALTER TABLE "notas" ADD COLUMN     "autoevaluacion" INTEGER,
ALTER COLUMN "ser" SET DATA TYPE INTEGER,
ALTER COLUMN "saber" SET DATA TYPE INTEGER,
ALTER COLUMN "hacer" SET DATA TYPE INTEGER,
ALTER COLUMN "total" SET DATA TYPE INTEGER;

-- CreateTable
CREATE TABLE "casillas" (
    "id" TEXT NOT NULL,
    "materiaProgramadaId" TEXT NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "dimension" "Dimension" NOT NULL,
    "orden" INTEGER NOT NULL,
    "nombre" TEXT,
    "esAsistencia" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "casillas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones_casilla" (
    "id" TEXT NOT NULL,
    "casillaId" TEXT NOT NULL,
    "estudianteId" TEXT NOT NULL,
    "valor" INTEGER NOT NULL,
    "registradoPorId" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calificaciones_casilla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "periodos_trimestrales" (
    "id" TEXT NOT NULL,
    "gestion" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "fechaInicio" DATE NOT NULL,
    "fechaFin" DATE NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "periodos_trimestrales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "casillas_materiaProgramadaId_trimestre_idx" ON "casillas"("materiaProgramadaId", "trimestre");

-- CreateIndex
CREATE UNIQUE INDEX "casillas_materiaProgramadaId_trimestre_dimension_orden_key" ON "casillas"("materiaProgramadaId", "trimestre", "dimension", "orden");

-- CreateIndex
CREATE INDEX "calificaciones_casilla_estudianteId_idx" ON "calificaciones_casilla"("estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_casilla_casillaId_estudianteId_key" ON "calificaciones_casilla"("casillaId", "estudianteId");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_trimestrales_gestion_trimestre_key" ON "periodos_trimestrales"("gestion", "trimestre");

-- AddForeignKey
ALTER TABLE "casillas" ADD CONSTRAINT "casillas_materiaProgramadaId_fkey" FOREIGN KEY ("materiaProgramadaId") REFERENCES "materias_programadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_casilla" ADD CONSTRAINT "calificaciones_casilla_casillaId_fkey" FOREIGN KEY ("casillaId") REFERENCES "casillas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones_casilla" ADD CONSTRAINT "calificaciones_casilla_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "estudiantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── 5. Reglas de validación (segunda defensa; el servidor también valida) ──
-- Prisma no gestiona CHECK constraints, así que `db push` no las elimina.
ALTER TABLE "notas"
  ADD CONSTRAINT "notas_trimestre_check"      CHECK ("trimestre" BETWEEN 1 AND 3),
  ADD CONSTRAINT "notas_ser_check"            CHECK ("ser"   BETWEEN 0 AND 10),
  ADD CONSTRAINT "notas_saber_check"          CHECK ("saber" BETWEEN 0 AND 45),
  ADD CONSTRAINT "notas_hacer_check"          CHECK ("hacer" BETWEEN 0 AND 40),
  ADD CONSTRAINT "notas_autoevaluacion_check" CHECK ("autoevaluacion" IS NULL OR "autoevaluacion" BETWEEN 0 AND 5),
  ADD CONSTRAINT "notas_total_check"          CHECK ("total" BETWEEN 0 AND 100);

ALTER TABLE "casillas"
  ADD CONSTRAINT "casillas_trimestre_check"   CHECK ("trimestre" BETWEEN 1 AND 3),
  ADD CONSTRAINT "casillas_orden_check"       CHECK ("orden" BETWEEN 1 AND 20),
  ADD CONSTRAINT "casillas_asistencia_en_ser" CHECK (NOT "esAsistencia" OR "dimension" = 'SER');

ALTER TABLE "calificaciones_casilla"
  ADD CONSTRAINT "calificaciones_casilla_valor_check" CHECK ("valor" BETWEEN 0 AND 100);

ALTER TABLE "periodos_trimestrales"
  ADD CONSTRAINT "periodos_trimestrales_trimestre_check" CHECK ("trimestre" BETWEEN 1 AND 3),
  ADD CONSTRAINT "periodos_trimestrales_fechas_check"    CHECK ("fechaFin" >= "fechaInicio");

-- ── 6. Seguridad: RLS sin políticas + sin permisos para la API pública ──
ALTER TABLE public."casillas"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."calificaciones_casilla" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."periodos_trimestrales"  ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public."casillas"               FROM anon, authenticated;
REVOKE ALL ON public."calificaciones_casilla" FROM anon, authenticated;
REVOKE ALL ON public."periodos_trimestrales"  FROM anon, authenticated;

COMMIT;
