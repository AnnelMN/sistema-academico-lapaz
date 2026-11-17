-- ════════════════════════════════════════════════════════════════════
-- 001 — Cerrar el acceso de la API pública de Supabase (hallazgo LB-01)
-- ════════════════════════════════════════════════════════════════════
-- Qué hace:
--   1. Activa Row Level Security (RLS) en las 12 tablas SIN crear políticas:
--      la API pública (roles anon y authenticated) queda sin acceso a filas.
--   2. Retira a anon y authenticated todos los permisos sobre tablas,
--      secuencias y funciones del esquema public (segunda capa de protección).
--   3. Evita que las tablas que Prisma cree en el futuro vuelvan a recibir
--      esos permisos automáticamente.
--
-- Qué NO cambia:
--   - El backend (Express + Prisma) se conecta como "postgres", que tiene
--     BYPASSRLS: sigue leyendo y escribiendo igual que antes.
--   - service_role (clave secreta de Supabase) conserva su acceso.
--   - No se modifica ni borra ningún dato.
--
-- Cómo aplicarlo (desde backend/):
--   npx prisma db execute --file prisma/sql/001_cerrar_api_publica.sql --schema prisma/schema.prisma
--
-- ⚠️ NO usar `prisma migrate dev`: esta base de datos se creó con `prisma db push`
--    (no existe _prisma_migrations) y migrate dev propondría BORRAR todos los datos.
--
-- Para revertir: prisma/sql/001_revertir.sql
-- ════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Activar RLS (sin políticas = acceso denegado para anon/authenticated)
ALTER TABLE public."usuarios"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."estudiantes"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."docentes"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."cursos"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."materias"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."materias_programadas"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notas"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."asistencias"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."predicciones_riesgo"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notificaciones"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."configuracion"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."codigos_verificacion"  ENABLE ROW LEVEL SECURITY;

-- 2. Retirar permisos actuales de la API pública
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. Retirar permisos por defecto para objetos que cree "postgres" (Prisma) en el futuro
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

COMMIT;

-- Recordatorio: cada tabla NUEVA que se agregue a schema.prisma debe recibir
-- "ALTER TABLE ... ENABLE ROW LEVEL SECURITY;" (la Skill web-security-audit lo revisa).
