-- ════════════════════════════════════════════════════════════════════
-- REVERTIR 001 — Vuelve a abrir la API pública de Supabase
-- ════════════════════════════════════════════════════════════════════
-- Úsalo SOLO si 001_cerrar_api_publica.sql causara un problema.
-- Restaura exactamente los permisos que existían antes (estado inseguro).
--
--   npx prisma db execute --file prisma/sql/001_revertir.sql --schema prisma/schema.prisma
-- ════════════════════════════════════════════════════════════════════

BEGIN;

ALTER TABLE public."usuarios"              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."estudiantes"           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."docentes"              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."cursos"                DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."materias"              DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."materias_programadas"  DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."notas"                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."asistencias"           DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."predicciones_riesgo"   DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."notificaciones"        DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."configuracion"         DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."codigos_verificacion"  DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES    TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;

COMMIT;
