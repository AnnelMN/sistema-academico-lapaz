---
name: web-security-audit
description: Auditoría de seguridad del Sistema Académico UE La Paz "A" (React+Vite en Vercel, Express+Prisma en Railway, FastAPI en Render, PostgreSQL en Supabase). Úsala para auditar el sistema completo, revisar la seguridad de cambios de código o verificar el sistema antes de llevarlo a producción. Evalúa 20 medidas base y 8 adicionales, presenta evidencias con archivo:línea, propone soluciones y verifica correcciones, sin aplicar cambios ni mostrar secretos.
argument-hint: "[completa | cambios | produccion]"
---

# web-security-audit — Guía permanente de seguridad

Skill de auditoría para el **Sistema Web con ML para Gestión Académica — UE La Paz "A"**.
Sirve durante todo el desarrollo: al escribir código nuevo, al revisar cambios y antes de cada despliegue.

> La auditoría **detecta, evidencia y propone**. Nunca corrige por su cuenta.
> Ninguna auditoría permite afirmar que el sistema es "completamente seguro": solo que los controles revisados pasaron las verificaciones descritas, en la fecha indicada.

---

## 1. Reglas inquebrantables

Durante cualquier ejecución de esta Skill:

1. **No modificar** archivos existentes, configuraciones ni código.
2. **No eliminar** archivos, datos ni registros.
3. **No cambiar nada en Supabase** (ni políticas, ni permisos, ni configuraciones del panel).
4. **No ejecutar migraciones** (`prisma migrate`, `prisma db push`, `prisma db seed`, SQL DDL/DML).
5. **No instalar, actualizar ni desinstalar dependencias** (`npm install`, `npm audit fix`, `pip install`, etc.).
6. **No corregir vulnerabilidades automáticamente.** Primero se presentan evidencias y recomendaciones; los cambios se aplican solo tras autorización explícita del usuario, y cada autorización vale solo para lo que se aprobó.
7. **No revelar secretos**: contraseñas, API keys, `JWT_SECRET`, `DATABASE_URL`, `EMAIL_PASS`, tokens JWT, secretos TOTP, hashes de contraseña, códigos QR de 2FA. Siempre enmascarar (ver §4).
8. **No dar por implementada una protección sin comprobarla** con evidencia (archivo:línea, salida de comando o resultado de consulta). Si algo no se puede verificar desde el entorno local (panel de Supabase, variables de Railway/Vercel/Render, configuración de GitHub), marcarlo como **"No verificable — requiere confirmación del usuario"**, nunca como aprobado.
9. **No hacer `git commit`, `git push` ni reescribir historial** durante la auditoría.
10. Si una verificación requiere una acción no listada en §2, **detenerse y pedir autorización**.

---

## 2. Acciones autorizadas (solo lectura)

| Permitido | Ejemplos |
|---|---|
| Leer archivos y configuraciones del repo | Read, Grep, Glob, `cat`, `sed -n` |
| Inspeccionar Git sin modificarlo | `git status`, `git diff`, `git log`, `git ls-files`, `git check-ignore`, `git show <commit>:<archivo>` (enmascarando) |
| Auditar dependencias sin instalar | `npm audit` / `npm audit --omit=dev`, `npm ls`, `pip-audit` **solo si ya está instalado** |
| Consultas `SELECT` al **catálogo** de PostgreSQL | `pg_tables`, `pg_policies`, `pg_roles`, `information_schema.role_table_grants`, `pg_stat_ssl` (ver §4.2) |
| Solicitudes HTTP de lectura a los despliegues propios | `curl -sI https://<frontend>` para revisar encabezados (solo modo producción) |
| Ejecutar `gitleaks` **solo si ya está instalado** | `gitleaks detect --redact --no-banner` |

**Prohibido en consultas SQL:** `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `ALTER`, `CREATE`, `DROP`, `GRANT`, `REVOKE`, y `SELECT` sobre tablas con datos personales (`usuarios`, `estudiantes`, `notas`, etc.). Si hace falta conocer volúmenes, usar solo `count(*)`.

---

## 3. Modos de uso

Si el usuario no indica el modo, preguntarlo. Si invoca `/web-security-audit <modo>`, usar ese modo.

### Modo 1 — `completa` (auditoría completa del sistema)

1. **Reconocer la arquitectura actual** (puede haber cambiado desde la línea base de §9): estructura de carpetas, `package.json`, `requirements.txt`, `schema.prisma`, `server.js`, rutas montadas, servicios.
2. **Evaluar los 28 controles** del catálogo (§5 y §6), en orden, con sus verificaciones.
3. **Ejecutar las inspecciones de solo lectura**: `npm audit` (backend y frontend), consultas de catálogo (§4.2), revisión de Git.
4. **Comparar con la línea base** (§9): indicar qué hallazgos se corrigieron, cuáles siguen abiertos y cuáles son nuevos.
5. **Entregar el informe** con el formato de §8.

### Modo 2 — `cambios` (auditoría de cambios en el código)

1. Obtener el alcance:
   ```bash
   git status --short
   git diff --name-only HEAD          # cambios sin commit
   git diff --name-only main...HEAD   # cambios de una rama respecto a main
   git ls-files --others --exclude-standard   # archivos nuevos
   ```
2. Revisar el **diff completo** de cada archivo cambiado (no solo el nombre).
3. Aplicar **solo los controles relacionados** según esta tabla:

   | Archivo cambiado | Controles a revisar |
   |---|---|
   | `backend/src/routes/*` | 6, 7, 11, 12, C |
   | `backend/src/controllers/*` | 6, 7, 8, 13, 14, 15, 17, B, F |
   | `backend/src/middleware/*` | 6, 9, C |
   | `backend/src/services/emailService.js` | 15, 17, F |
   | `backend/src/services/iaService.js` | A, 14, 19 |
   | `backend/src/server.js` | 11, 12, 17, 18, 19, G |
   | `backend/prisma/schema.prisma`, migraciones | 3, 4, 5, B, C, E |
   | `backend/prisma/seed*.js`, `scripts/*` | 1, 2, 10, G |
   | `package.json`, `package-lock.json`, `requirements.txt` | 20 |
   | `frontend/src/**` | 9, 15, 17 (datos mostrados), 14 (validación de UX, nunca como única defensa) |
   | `frontend/index.html`, `vercel.json`, `vite.config.js` | 18, 19 |
   | `microservicio-ia/*.py` | A, 14, 17, 20, F |
   | `.gitignore`, `.env.example`, archivos nuevos | 1, 2, D, G |
   | Cualquier archivo nuevo con endpoint de subida | 16 |

4. Señalar también **regresiones**: cambios que reabren un hallazgo ya corregido en §9.
5. Entregar el informe (§8), limitado a los archivos y controles afectados.

### Modo 3 — `produccion` (auditoría previa a producción)

1. Ejecutar el **Modo 1 completo**.
2. Añadir la **lista de despliegue** de §7.
3. Emitir un **dictamen**:
   - **NO APTO** si hay algún hallazgo **Crítico** o **Alto** abierto.
   - **APTO CON RESERVAS** si solo quedan Medios/Bajos, listando los riesgos aceptados.
   - **APTO PARA LOS CONTROLES REVISADOS** si todos pasan. Nunca escribir "seguro al 100 %".
4. Todo lo que dependa de paneles externos (Supabase, Railway, Vercel, Render, GitHub) debe quedar como pregunta explícita al usuario si no se pudo verificar.

---

## 4. Técnicas seguras de inspección

### 4.1 Leer variables de entorno sin revelarlas

```bash
# Solo nombres de variables
sed 's/=.*/=***/' backend/.env

# Comprobar longitud de un secreto sin mostrarlo
echo "JWT_SECRET longitud: $(grep '^JWT_SECRET=' backend/.env | cut -d= -f2- | tr -d '"' | wc -c)"

# Tipo de conexión a la BD (usuario, host enmascarado, puerto, sslmode)
v=$(grep '^DATABASE_URL=' backend/.env | cut -d= -f2- | tr -d '"')
echo "usuario: $(echo "$v" | sed -E 's#^[a-z]+://([^:.]+).*#\1#') | host: $(echo "$v" | sed -E 's#.*@([^:/]+).*#\1#; s/^[^.]+\./***./') | sslmode: $(echo "$v" | grep -oE 'sslmode=[a-z-]+' || echo 'no especificado')"

# Comparar plantilla vs real sin mostrar valores
a=$(grep '^JWT_SECRET=' backend/.env.example | cut -d= -f2-); b=$(grep '^JWT_SECRET=' backend/.env | cut -d= -f2-)
[ "$a" = "$b" ] && echo "⚠️ la plantilla contiene el valor real" || echo "ok: plantilla distinta"
```

Al citar evidencias que contengan secretos, reemplazar el valor por `****` (p. ej. `sed -E "s/(['\"])[^'\"]{4,}(['\"])/\1****\2/g"`) y los JWT por `eyJ****`.

### 4.2 Consultas de catálogo PostgreSQL (solo SELECT)

Ejecutar desde `backend/` con Prisma (usa la `DATABASE_URL` del `.env` sin imprimirla). Las consultas son **fijas**, sin interpolar entradas:

```bash
cd backend && node -e "
require('dotenv').config({quiet:true});
const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();
const Q={
 rls:\"select tablename, rowsecurity, forcerowsecurity from pg_tables t join pg_class c on c.relname=t.tablename where schemaname='public' order by 1\",
 policies:\"select tablename, policyname, roles::text, cmd from pg_policies where schemaname='public' order by 1\",
 grants:\"select grantee, count(*)::int n, string_agg(distinct privilege_type, ',') privs from information_schema.role_table_grants where table_schema='public' and grantee in ('anon','authenticated') group by grantee\",
 role:\"select current_user, r.rolsuper, r.rolbypassrls from pg_roles r where r.rolname=current_user\",
 defaults:\"select pg_get_userbyid(defaclrole) owner, defaclobjtype, defaclacl::text from pg_default_acl where defaclnamespace='public'::regnamespace\"
};
(async()=>{for(const [k,q] of Object.entries(Q)){console.log('==',k);console.table(await p.\$queryRawUnsafe(q));}await p.\$disconnect();})()
.catch(e=>{console.error('ERROR',e.message.split('\n')[0]);process.exit(1)})"
```

Notas:
- `pg_stat_ssl` a través del pooler de Supabase muestra el tramo pooler→Postgres, **no** el tramo backend→pooler; no sirve como prueba de TLS del cliente. Para TLS del cliente, revisar `sslmode` en la URL y la opción *Enforce SSL* del panel (confirmación del usuario).
- `$queryRawUnsafe` se usa **solo** aquí, en un script de auditoría con constantes. En el código de la aplicación está prohibido (control 13).

### 4.3 Búsquedas útiles en el código

```bash
# Objetos de usuario completos devueltos (posible fuga de password/twoFactorSecret)
grep -rnE "usuario:\s*true|include:\s*\{\s*usuario\s*\}" backend/src
# Campos sensibles en respuestas
grep -rnE "password|twoFactorSecret|codigoHash" backend/src/controllers
# IDs tomados del cliente (revisar autorización por objeto)
grep -rnE "req\.(query|body|params)\.?\{?[^}]*(estudianteId|docenteId|usuarioId|cursoId|materiaProgramadaId|id)" backend/src
# SQL crudo
grep -rnE "\\\$(queryRaw|executeRaw)(Unsafe)?" backend/src
# XSS
grep -rnE "dangerouslySetInnerHTML|innerHTML|eval\(|new Function" frontend/src
# Rutas sin authMiddleware
grep -nE "router\.(get|post|put|patch|delete)|router\.use" backend/src/routes/*.js
# Fallbacks inseguros
grep -rnE "\|\|\s*'(\*|pepper|secret|changeme)'" backend/src
# Datos personales en logs
grep -rnE "console\.(log|info|warn|error)\(.*(email|Email|nombre|token|codigo|password)" backend/src
```

---

## 5. Catálogo de las 20 medidas base (adaptadas al stack)

Formato de cada control: **Objetivo · Qué verificar · Criterio de aprobación · Remediación recomendada · Cómo verificar la corrección**.

### 1. Protección de API keys y secretos
- **Objetivo:** ningún secreto en código, frontend ni repositorio.
- **Verificar:** `.env` de raíz, `backend/`, `frontend/` y `microservicio-ia/` ignorados (`git check-ignore -v`) y no rastreados (`git ls-files`); `.env.example` solo con marcadores; búsqueda de secretos escritos en el código (§4.3); variables `VITE_*` (se publican en el bundle, nunca deben contener secretos); fallbacks inseguros (`|| '*'`, `|| 'pepper'`); `JWT_SECRET` ≥ 64 caracteres (medir longitud, no mostrar); secretos reutilizados para fines distintos (p. ej. `JWT_SECRET` como *pepper* de OTP).
- **Aprobado si:** cero secretos en archivos rastreados, cero fallbacks inseguros, cada secreto con propósito único.
- **Remediación:** mover a variables de entorno; secreto separado por propósito (`OTP_PEPPER`, `IA_API_KEY`, `TOTP_ENC_KEY`); eliminar fallbacks y fallar al arrancar (control G); **rotar** todo secreto que haya estado expuesto.
- **Verificar corrección:** repetir búsquedas; `git ls-files | grep -E '\.env$'` vacío.

### 2. Secretos en el historial de Git
- **Objetivo:** que el historial publicado no contenga secretos vigentes y que no vuelvan a subirse.
- **Verificar:** `git log --all --oneline --name-status -- '*.env' '*/.env' AGENTS.md '*.pkl' 'temp-qr/*'`; buscar cadenas sensibles conocidas con `git log --all --oneline -S'<cadena>'` (imprime solo commits, no contenido); estado del remoto (`git status -sb`); presencia de control D.
- **Aprobado si:** los secretos que aparecen en el historial están **rotados** (confirmado por el usuario) o el historial fue limpiado; existe escaneo preventivo (control D).
- **Remediación:** 1) rotar primero (cambiar contraseñas, `JWT_SECRET`, claves); 2) opcionalmente `git filter-repo` (reescribe historial y exige *force push*: requiere autorización explícita y coordinación).
- **Verificar corrección:** `gitleaks detect --redact` (si está instalado) sin hallazgos vigentes.

### 3. Acceso público a la base de datos
- **Contexto:** Supabase expone una API REST (PostgREST) con los roles `anon` y `authenticated`. La *anon key* es pública por diseño; la protección real son los permisos y RLS. Este proyecto **no** usa esa API: todo pasa por Express + Prisma.
- **Verificar:** consulta `grants` de §4.2; consulta `defaults` (privilegios por defecto que Supabase otorga a tablas nuevas creadas por migraciones); preguntar al usuario si en *Settings → API* el esquema `public` está expuesto.
- **Aprobado si:** `anon` y `authenticated` no tienen privilegios sobre tablas de `public` (o RLS activo sin políticas, control 4), incluidas las tablas creadas después de cada migración.
- **Remediación (propuesta, requiere autorización y se aplica como migración SQL):**
  ```sql
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
  REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
  ```
  Opcional: quitar `public` de los esquemas expuestos en el panel.
- **Verificar corrección:** repetir consulta `grants` → sin filas para `anon`/`authenticated`.

### 4. Row-Level Security (RLS) — **adaptado**
- **Adaptación aprobada:** el backend se conecta con el rol `postgres` (`rolbypassrls = true`), así que RLS **no** filtra las consultas de Prisma, y las políticas por rol basadas en `auth.jwt()` no aplican porque no se usa Supabase Auth. RLS se usa como **capa de denegación** frente a la API pública: **RLS activo en todas las tablas y sin políticas para `anon`/`authenticated`** (= todo denegado). La autorización fina vive en Express (controles 6, 7, C).
- **Verificar:** consulta `rls` y `policies` de §4.2; incluir `_prisma_migrations`; revisar que las migraciones nuevas activen RLS en tablas nuevas.
- **Aprobado si:** `rowsecurity = true` en todas las tablas de `public` y no existe ninguna política que conceda acceso a `anon`/`authenticated`.
- **Remediación (migración SQL, requiere autorización):** `ALTER TABLE public.<tabla> ENABLE ROW LEVEL SECURITY;` para cada tabla, incluida en una migración de Prisma para que sea reproducible; añadirlo a cada migración que cree tablas.
- **Advertencias:** no usar `FORCE ROW LEVEL SECURITY` mientras Prisma use un rol propietario sin políticas propias; si se adopta el control E (rol sin `BYPASSRLS`), habrá que crear políticas para ese rol.
- **Verificar corrección:** repetir consulta `rls`; comprobar que la app sigue funcionando (login, notas, asistencia).

### 5. Cifrado de datos sensibles
- **Verificar:** contraseñas con bcrypt (control 10); `CodigoVerificacion.codigoHash` hasheado; **`Usuario.twoFactorSecret`** (¿texto plano?); TLS hacia la BD (`sslmode=require` en `DATABASE_URL`/`DIRECT_URL`, *Enforce SSL* en el panel — confirmar con usuario); TLS hacia FastAPI (`IA_SERVICE_URL` con `https://`); cifrado en reposo provisto por Supabase (informativo).
- **Aprobado si:** secretos reutilizables (TOTP) cifrados en la aplicación; todas las conexiones con TLS.
- **Remediación:** cifrar `twoFactorSecret` con AES-256-GCM (`crypto` nativo de Node, clave `TOTP_ENC_KEY` de 32 bytes en entorno, IV aleatorio por registro, guardar `iv:tag:cipher`), con migración de datos planificada; añadir `sslmode=require`.
- **Verificar corrección:** el valor en BD no es base32 legible (comprobar formato con `count(*)` + patrón, sin leer valores); login 2FA sigue funcionando.

### 6. Autenticación y validación forzadas desde el servidor
- **Verificar:** cada router de `backend/src/routes/` aplica `authMiddleware` (vía `router.use` o por ruta), salvo `/login`, `/2fa/authenticate`, `/2fa/setup-authenticate`, `/forgot-password`, `/reset-password`; `jwt.verify` con `algorithms: ['HS256']`; tokens temporales (`purpose`) rechazados en rutas normales; el estado del usuario (`activo`) y el rol se validan contra la BD (control C); `PrivateRoute` del frontend se considera solo UX, nunca control de seguridad.
- **Aprobado si:** ninguna ruta de datos accesible sin JWT válido y vigente de un usuario activo.
- **Remediación:** añadir middleware faltante; fijar algoritmo; implementar control C.
- **Verificar corrección:** tabla ruta → roles permitidos, derivada del código.

### 7. Acceso a registros según permisos (autorización por objeto / IDOR)
- **Reglas del negocio a comprobar:**
  - **PROFESOR:** solo `MateriaProgramada` con `docenteId` = su docente, **y** solo estudiantes cuyo `cursoId` = `cursoId` de esa programación (lectura y escritura).
  - **ESTUDIANTE:** solo sus propios datos; el `estudianteId` se obtiene **del token**, nunca de `req.query`/`req.body`. No ve predicciones de riesgo ni datos de otros (según `AGENTS.md`).
  - **ADMINISTRATIVO:** materias, cursos, horarios, asignaciones; **no** notas individuales ni predicciones.
  - **DIRECTOR:** acceso global.
- **Verificar:** cada endpoint que recibe un identificador (búsqueda en §4.3) y la comprobación de propiedad correspondiente; consistencia rol-ruta con `AGENTS.md`.
- **Aprobado si:** cada identificador recibido del cliente se valida contra el usuario autenticado antes de leer o escribir.
- **Remediación:** helpers reutilizables (`assertDocenteDeProgramacion`, `assertEstudianteEnCurso`, `getEstudianteDelToken`) y filtros `where` que incluyan la condición de propiedad.
- **Verificar corrección:** razonamiento con casos: "profesor A pide/escribe estudiante del curso de B" → 403; "estudiante X pide historial de Y" → 403.

### 8. Manipulación de campos, roles y permisos (mass assignment)
- **Verificar:** que nunca se pase `req.body` completo a Prisma (`data: req.body`, `...req.body`); que `rol`, `activo`, `twoFactorEnabled`, `twoFactorSecret`, `total`, `aprobado` no puedan venir del cliente salvo donde corresponda; que el Director no pueda cambiar su propio rol ni desactivarse; rangos: `ser` 0–15, `saber` 0–35, `hacer` 0–50 (total ≤ 100), `trimestre` 1–3, `nivel` 1–6; tamaño máximo de arrays (`registros` de asistencia).
- **Aprobado si:** lista blanca explícita de campos en cada escritura y campos derivados calculados en servidor.
- **Remediación:** esquemas de validación (control 14) con listas blancas; reglas de negocio en servidor.

### 9. Protección de sesiones y tokens — **adaptado**
- **Adaptación aprobada:** el sistema usa **JWT Bearer en `localStorage` + 2FA TOTP**, sin cookies. No se exige migrar a cookies. La medida se evalúa como "protección del token de sesión":
- **Verificar:** expiración (`JWT_EXPIRES_IN` ≤ 8h; recomendado 2–4h); revocación posible (control C); cierre de sesión que invalide en servidor (`tokenVersion`); tokens temporales con `purpose` y expiración corta (≤ 10 min); el token no aparece en URLs, logs ni respuestas de error; CSP que reduzca el riesgo de robo por XSS (control 18); 2FA obligatorio en todos los roles; secretos TOTP no reutilizados tras desactivar 2FA.
- **Aprobado si:** el token expira, puede revocarse y no se filtra.
- **Opción futura (no obligatoria):** cookies `httpOnly; Secure; SameSite=None` entre Vercel y Railway exigen protección CSRF y configuración CORS con `credentials`; evaluarlo solo si se decide migrar.

### 10. Almacenamiento seguro de contraseñas
- **Verificar:** bcrypt con costo ≥ 10 (recomendado 12) en **todas** las rutas que guardan contraseñas (`createUsuario`, `updateUsuario`, `resetPassword`, `seed.js`, `scripts/crearAdmin.js`); misma política de robustez en todas (mínimo 10 caracteres, letra y número); longitud máxima 72 bytes (límite de bcrypt); el hash nunca se devuelve en respuestas (control 17); contraseñas iniciales/demo cambiadas en producción.
- **Aprobado si:** política uniforme y ningún hash expuesto.

### 11. Límite de intentos de inicio de sesión
- **Verificar:** límite en `/login`, `/2fa/authenticate`, `/2fa/setup-authenticate`, `/forgot-password`, `/reset-password`; que limite **por IP y por cuenta**; que no permita **bloquear a propósito** la cuenta de otro (p. ej. del Director) — preferir retrasos progresivos a bloqueos duros; persistencia (un `Map` en memoria se pierde al reiniciar y crece sin límite); `app.set('trust proxy', 1)` en Railway para obtener la IP real.
- **Remediación recomendada:** `express-rate-limit` (requiere autorización para instalar) por IP en rutas de auth + retraso progresivo por cuenta; limpieza periódica de estructuras en memoria.
- **Aprobado si:** ataques de fuerza bruta y de bloqueo dirigido quedan acotados.

### 12. Protección contra bots y automatizaciones — **adaptado**
- **Adaptación aprobada:** priorizar *rate limiting*; el 2FA TOTP obligatorio ya mitiga el relleno de credenciales. CAPTCHA (p. ej. Cloudflare Turnstile) solo si se observa abuso real.
- **Verificar:** límite global por IP para `/api/*`; límites específicos para endpoints que **envían correos** (`/api/notificaciones/manual`, registros de notas/asistencia que disparan alertas) y para operaciones masivas (`registros` de asistencia); deduplicación de alertas por correo (evitar spam a padres).
- **Aprobado si:** ningún endpoint costoso o que envía correos es invocable sin límite.

### 13. Prevención de SQL Injection
- **Verificar:** cero `$queryRawUnsafe` / `$executeRawUnsafe` en `backend/src`; si existe `$queryRaw`, que use plantilla etiquetada (no concatenación); el microservicio FastAPI no accede a BD (si cambia, revisar).
- **Aprobado si:** todo acceso a datos es por API de Prisma o `$queryRaw` etiquetado.

### 14. Validación de todas las entradas
- **Verificar:** validación en el servidor (la del frontend es solo UX) de tipos, formatos y rangos: UUID en IDs, email con formato y normalizado a minúsculas al crear/editar (el login normaliza), fechas válidas, enums (`rol`, `estado`, `tipo`), `trimestre`, `nivel`, `paralelo`, notas (control 8), longitud de textos (`mensaje`, `nombre`, `horario`); en FastAPI, `pydantic.Field(ge=…, le=…)` para cada variable del modelo.
- **Remediación recomendada:** esquemas con `zod` en la frontera de cada ruta (requiere autorización para instalar) o validadores propios centralizados.
- **Aprobado si:** cada endpoint rechaza con 400 entradas fuera de esquema antes de tocar la BD.

### 15. Prevención de XSS (escape y sanitización)
- **Verificar:** sin `dangerouslySetInnerHTML`/`innerHTML`/`eval` en el frontend (o justificados y sanitizados con DOMPurify); `href`/`src` construidos con datos del usuario (bloquear `javascript:`); **plantillas de correo**: todo dato interpolado en HTML pasa por `escapeHtml` (nombres, materias, mensajes, asunto); exportaciones a Excel/CSV: neutralizar fórmulas (celdas que empiezan con `=`, `+`, `-`, `@`); PDFs generados con datos del usuario.
- **Aprobado si:** ningún dato controlado por usuarios llega sin escapar a HTML, correo u hoja de cálculo.

### 16. Subida de archivos — **condicional**
- **Adaptación aprobada:** hoy **no existe** subida de archivos. Comprobar en cada auditoría si apareció (`multer`, `busboy`, `formidable`, `type="file"`, `FormData`, Supabase Storage). Si no existe → **N/A**.
- **Si existe, verificar:** límite de tamaño; lista blanca de extensiones **y** de tipo real (magic bytes); nombres aleatorios en servidor; almacenamiento fuera de la carpeta pública (bucket privado de Supabase Storage con políticas y URLs firmadas temporales); prohibición de ejecutables/HTML/SVG; autorización por objeto (control 7); análisis antivirus opcional.

### 17. Respuestas de la API limitadas y protegidas
- **Verificar:** que ninguna respuesta incluya `password`, `twoFactorSecret`, `codigoHash` ni objetos `usuario` completos (`include: { usuario: true }` devuelto al cliente — usar `select`); que las respuestas no permitan **enumerar usuarios** (mismo mensaje y tiempo para cuenta inexistente/existente, sin datos derivados del hash en tokens); mensajes de error genéricos (sin `error.message`, stack, ni detalles de Prisma/SMTP hacia el cliente o guardados en tablas visibles); paginación o `take` en listados; `express.json({ limit })` explícito; datos mínimos por rol (p. ej. el estudiante no necesita email del docente).
- **Aprobado si:** cada respuesta contiene solo los campos que la vista necesita.

### 18. Encabezados de seguridad HTTP
- **Verificar:**
  - **Express:** `helmet` (o equivalente) y `x-powered-by` desactivado.
  - **Frontend en Vercel:** `vercel.json` con `Content-Security-Policy` (al menos `default-src 'self'; script-src 'self'; connect-src 'self' <URL API>; frame-ancestors 'none'; object-src 'none'; base-uri 'self'`), `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
  - **FastAPI:** encabezados básicos y `/docs`, `/redoc`, `/openapi.json` desactivados en producción (control A).
  - **CORS:** `origin` exacto desde `FRONTEND_URL`, sin `*` ni fallback.
- **Modo producción:** `curl -sI https://<frontend>` y `curl -sI https://<backend>/api/auth/me` para comprobar encabezados reales.

### 19. HTTPS forzado en producción
- **Verificar:** Vercel/Railway/Render sirven HTTPS (confirmar con `curl -sI http://…` → redirección 301/308 a https); `VITE_API_URL`, `IA_SERVICE_URL` y `FRONTEND_URL` de producción con `https://` (confirmación del usuario, no se ven desde el repo); HSTS (control 18); `trust proxy` configurado; `sslmode=require` hacia Supabase (control 5); sin contenido mixto en el frontend.
- **Aprobado si:** ningún tramo (navegador→Vercel→Railway→Render/Supabase) viaja sin TLS.

### 20. Análisis de dependencias
- **Verificar:**
  ```bash
  (cd backend && npm audit --omit=dev)      # dependencias de producción
  (cd frontend && npm audit)                 # separar runtime vs herramientas de desarrollo
  (cd microservicio-ia && pip-audit -r requirements.txt)   # solo si pip-audit ya está instalado
  ```
  Versiones fijadas (`requirements.txt` con `==`, lockfiles rastreados); existencia de Dependabot/Renovate (`.github/dependabot.yml`).
- **Clasificar:** vulnerabilidades en dependencias de **runtime del backend** pesan más que las de herramientas de desarrollo del frontend (Vite, ESLint), que no llegan al bundle.
- **Remediación:** `npm audit fix` / actualizaciones **solo con autorización**, revisando cambios incompatibles (`--force` nunca sin revisión).

---

## 6. Medidas adicionales aprobadas (A–H)

### A. Autenticación del microservicio FastAPI
- **Verificar:** `POST /predecir` exige un secreto compartido (encabezado `X-API-Key` comparado con `secrets.compare_digest` contra `IA_API_KEY` del entorno) y `iaService.js` lo envía; `/docs`, `/redoc`, `/openapi.json` desactivados en producción (`FastAPI(docs_url=None, redoc_url=None, openapi_url=None)`); validación de rangos con `pydantic.Field`; errores genéricos (sin `str(e)` hacia el cliente); modelo cargado una vez al iniciar (evita abuso de CPU); `/health` sin datos internos; HTTPS en `IA_SERVICE_URL`.
- **Aprobado si:** solo el backend puede obtener predicciones.

### B. Auditoría de modificaciones de notas y asistencia
- **Verificar:** existencia de un registro de auditoría por cada creación/modificación de `Nota` y `Asistencia` con: entidad, id, acción, valor anterior, valor nuevo, usuario que actuó, fecha y (opcional) IP; escritura en la **misma transacción** (`prisma.$transaction`) que el cambio; solo el Director puede consultarlo; nadie puede editarlo ni borrarlo desde la API.
- **Propuesta:** modelo `AuditoriaCambio` en `schema.prisma` (requiere migración autorizada) con RLS activo (control 4).
- **Aprobado si:** cualquier cambio de nota/asistencia es trazable a una persona.

### C. Revocación de sesiones y validación de estado y rol
- **Verificar:** `authMiddleware` consulta en BD el usuario del token (`select id, rol, activo, tokenVersion`) y rechaza si está inactivo, si el `tokenVersion` no coincide o si no existe; el **rol se toma de la BD**, no del token; `toggleEstado`, cambios de rol, cambio/restablecimiento de contraseña y desactivación de 2FA **incrementan `tokenVersion`**; existe "cerrar sesión en todos los dispositivos".
- **Propuesta:** campo `tokenVersion Int @default(0)` en `Usuario` (migración autorizada) e incluirlo en el JWT.
- **Aprobado si:** desactivar a un usuario o cambiar su rol tiene efecto en la siguiente solicitud.

### D. Escaneo de secretos (Gitleaks) y protección del repositorio
- **Verificar:** `gitleaks` como *pre-commit hook* y/o GitHub Action (`.github/workflows/`); `.gitleaks.toml` si hay falsos positivos; en GitHub (confirmación del usuario): *Secret scanning* y *Push protection* activados, rama `main` protegida, visibilidad del repo acorde a lo que contiene.
- **Comando (si está instalado):** `gitleaks detect --redact --no-banner` y `gitleaks protect --staged --redact`.
- **Aprobado si:** un secreto nuevo sería bloqueado antes de llegar a GitHub.

### E. Usuario de BD con privilegios mínimos para Prisma — **avanzado y opcional**
- **Situación:** Prisma usa `postgres` (propietario, `BYPASSRLS`), por lo que una filtración de `DATABASE_URL` da control total.
- **Propuesta:** rol dedicado (p. ej. `app_backend`) con `LOGIN`, solo `SELECT/INSERT/UPDATE/DELETE` sobre las tablas de la app y `USAGE` sobre secuencias, **sin** `CREATE`, `TRUNCATE` ni superusuario; `DATABASE_URL` (runtime) con ese rol y `DIRECT_URL` (migraciones) con `postgres`.
- **Implicaciones a explicar siempre:**
  - Con RLS activo y sin políticas (control 4), un rol sin `BYPASSRLS` **no verá ninguna fila**: hay que darle `BYPASSRLS` (lo más simple) o crear políticas `TO app_backend` en cada tabla.
  - Cada migración que cree tablas debe otorgar permisos al nuevo rol.
  - En el pooler de Supabase el usuario tiene formato `<rol>.<project-ref>`.
  - Requiere pruebas completas antes de producción; un error deja la app sin acceso a datos.
- **Aprobado si:** (cuando se adopte) el rol de runtime no puede ejecutar DDL ni `TRUNCATE`.

### F. Protección de datos personales (menores) y logs
- **Verificar:** ningún `console.log` con emails, nombres, tokens, códigos OTP, secretos TOTP o contenido de correos (búsqueda en §4.3); emails enmascarados en logs (`a***@dominio`); respuestas con datos mínimos por rol (control 17); el estudiante no recibe `emailTutor` de otros ni datos de docentes más allá del nombre; mensajes de error de SMTP no guardados en `Notificacion.mensaje`; política de retención: limpieza de `codigos_verificacion` usados/expirados y antigüedad máxima de notificaciones; datos de prueba (`seed_prueba.js`) sin correos reales de terceros; las predicciones se presentan como orientativas (regla de supervisión humana).
- **Aprobado si:** los logs y respuestas no contienen datos personales innecesarios.

### G. Configuración segura por entorno
- **Verificar:** validación al arrancar (backend y FastAPI) de variables obligatorias — `DATABASE_URL`, `JWT_SECRET` (≥ 64), `FRONTEND_URL`, `IA_SERVICE_URL`, `IA_API_KEY`, `EMAIL_*`, `NODE_ENV` — que **detenga el proceso** si faltan en producción; sin valores por defecto inseguros (`'*'`, `'pepper'`, `http://localhost` en producción); `SEED_DEMO_DATA=false` y sin cuentas demo en producción; credencial inicial del Director cambiada tras el primer acceso; `.env.example` actualizado con todas las variables (sin valores reales).
- **Aprobado si:** la app no puede arrancar en producción con configuración insegura o incompleta.

### H. Copias de seguridad y restauración (Supabase)
- **Verificar (confirmación del usuario):** en *Database → Backups* qué ofrece el plan contratado (el plan gratuito tiene opciones limitadas y los proyectos inactivos pueden pausarse); si no hay copias automáticas suficientes, existencia de un respaldo programado con `pg_dump` (usando `DIRECT_URL`) guardado cifrado fuera de Supabase; procedimiento de restauración **documentado y probado** en un proyecto separado; objetivos definidos (cada cuánto se respalda, cuánto se tarda en restaurar).
- **Aprobado si:** existe al menos una copia reciente verificada y un procedimiento de restauración probado.

---

## 7. Lista de despliegue (solo Modo 3 — producción)

Marcar cada punto como ✅ verificado, ❌ falla o ❓ requiere confirmación del usuario:

- [ ] Sin hallazgos Críticos/Altos abiertos (controles 1–20, A–H).
- [ ] Commit desplegado = commit auditado (`git log -1`, `git status` limpio).
- [ ] Variables de entorno de Railway, Vercel y Render completas, con `https://` y sin valores de desarrollo (confirmación del usuario; nunca pedir que pegue los valores).
- [ ] `NODE_ENV=production`, `SEED_DEMO_DATA=false`, cuentas demo inexistentes o desactivadas.
- [ ] Contraseña inicial del Director y contraseñas expuestas en el historial **rotadas**.
- [ ] `JWT_SECRET` de producción distinto al de desarrollo.
- [ ] RLS activo y sin privilegios para `anon`/`authenticated` (consultas de §4.2 contra la BD de producción).
- [ ] `modelo_riesgo.pkl` disponible en Render y `/docs` desactivado.
- [ ] Encabezados verificados con `curl -sI` en frontend y backend.
- [ ] Redirección HTTP→HTTPS comprobada.
- [ ] Copia de seguridad reciente y restauración probada (control H).
- [ ] `npm audit --omit=dev` del backend sin críticas/altas.
- [ ] Gitleaks / push protection activos.

---

## 8. Formato del informe

```markdown
# Informe web-security-audit — <modo> — <fecha AAAA-MM-DD>
Commit auditado: <hash corto> · Rama: <rama> · Cambios sin commit: <sí/no>
Acciones de solo lectura ejecutadas: <lista: npm audit, consultas de catálogo, curl…>

## Resumen
| Severidad | Abiertos | Nuevos | Corregidos desde la línea base |
|---|---|---|---|

## Estado por control
| # | Control | Estado | Severidad | Evidencia |
|---|---|---|---|---|
| 1 | Secretos | ✅ / ⚠️ / ❌ / N/A / ❓ | … | `archivo:línea` o salida resumida |

## Hallazgos (de mayor a menor severidad)
### [SEV] ID — Título
- **Control:** #
- **Evidencia:** `archivo:línea` + fragmento enmascarado / resultado de consulta
- **Impacto:** qué podría hacer un atacante, con un escenario concreto
- **Solución propuesta:** cambios concretos (archivos afectados, si requiere migración/instalación)
- **Cómo se verificará:** comprobación concreta tras el cambio

## No verificable desde el entorno local
- Lista de preguntas para el usuario (panel de Supabase, Railway, Vercel, Render, GitHub)

## Dictamen (solo modo producción)
NO APTO / APTO CON RESERVAS / APTO PARA LOS CONTROLES REVISADOS — nunca "100 % seguro"
```

**Severidades:**
- **Crítica:** explotable de forma remota sin privilegios o con privilegios mínimos, con exposición/alteración masiva de datos o credenciales.
- **Alta:** un usuario autenticado accede o modifica datos que no le corresponden, o se compromete una cuenta concreta.
- **Media:** debilita una defensa o requiere condiciones adicionales para explotarse.
- **Baja:** buena práctica ausente con impacto limitado.
- **Informativa:** observación sin riesgo directo.

### Flujo después del informe

1. Presentar el informe y **esperar autorización**, indicando qué hallazgos corregir.
2. Antes de cada cambio, avisar si implica **migración**, **instalación de dependencias**, **cambios en Supabase** o **rotación de secretos**, ya que cada uno requiere autorización expresa.
3. Aplicar solo lo autorizado.
4. **Verificar** cada corrección con la comprobación indicada en el hallazgo y reportar el resultado real (incluidos fallos).
5. Actualizar la línea base (§9) solo si el usuario lo autoriza.

---

## 9. Línea base conocida (auditoría inicial 2026-11-17)

Usar como referencia para detectar avances y regresiones. **Re-verificar siempre**; no asumir que siguen igual.

| ID | Sev. | Control | Hallazgo |
|---|---|---|---|
| LB-01 | Crítica | 3, 4 | RLS desactivado en las 12 tablas, 0 políticas; `anon` y `authenticated` con CRUD completo (incl. `TRUNCATE`) sobre `public`. |
| LB-02 | Crítica | 17, 7 | `estudiante.controller.js` (`getMiHorario`) incluye `docente.usuario` completo: expone hash de contraseña y `twoFactorSecret` de docentes a estudiantes. |
| LB-03 | Alta | 7 | `asistencia.controller.js` (`getHistorialAsistencia`): cualquier estudiante/profesor consulta el historial de cualquier `estudianteId`. |
| LB-04 | Alta | 7, 12 | `upsertNota` y `registrarAsistencia` no validan que el estudiante pertenezca al curso de la programación; permiten escribir datos y disparar correos a tutores de otros cursos. |
| LB-05 | Alta | 6, C | `authMiddleware` no consulta `activo` ni rol en BD: usuarios desactivados conservan acceso hasta 8h. |
| LB-06 | Alta | 20 | Backend: 4 vulnerabilidades (1 crítica `proxy-addr` vía express, 2 altas incl. nodemailer, 1 moderada `qs`). Frontend: 19 (mayoría en herramientas de desarrollo). `requirements.txt` sin versiones fijas. |
| LB-07 | Alta | 2 | Historial publicado contiene la contraseña inicial del Director (`AGENTS.md`), contraseñas demo (`seed.js`) y un JWT expirado; commit de limpieza `8132ac2` pendiente de push. |
| LB-08 | Media | 5 | `twoFactorSecret` en texto plano; `DATABASE_URL`/`DIRECT_URL` sin `sslmode=require`. |
| LB-09 | Media | 11 | Límite de intentos en `Map` en memoria por email: sin límite por IP, se reinicia, permite bloqueo dirigido de cuentas. |
| LB-10 | Media | 17 | `forgotPassword` incluye en el JWT temporal 16 caracteres del hash bcrypt y permite deducir si la cuenta existe y tiene 2FA. |
| LB-11 | Media | 15 | `emailService.js`: `enviarAlertaRiesgo`, `enviarAlertaInasistencia` y `enviarCodigoVerificacion` interpolan datos sin `escapeHtml`. |
| LB-12 | Media | 18, 19 | Sin `helmet`, sin `vercel.json` con CSP/HSTS, `X-Powered-By` activo, sin `trust proxy`. |
| LB-13 | Media | A | FastAPI `/predecir` público sin autenticación, `/docs` expuesto, sin validación de rangos, devuelve `str(e)` en errores. |
| LB-14 | Media | 1, G | Fallbacks inseguros: CORS `'*'` si falta `FRONTEND_URL` (`server.js`), *pepper* `'pepper'` y reutilización de `JWT_SECRET` (`otp.controller.js`); `SEED_DEMO_DATA=true`. |
| LB-15 | Media | 8, 14 | `hacer` sin máximo (total puede superar 100); `registros` sin límite de tamaño; email no normalizado en `createUsuario`; `fecha` sin validar; sin esquema de validación centralizado. |
| LB-16 | Baja | 10 | `createUsuario`/`updateUsuario` no aplican la política de contraseña robusta (solo `resetPassword`). |
| LB-17 | Baja | F | `emailService.js` registra direcciones de correo completas en `console.log`. |
| LB-18 | Baja | — | `asistencia.controller.js` (`getEstudiantesConAsistencia`): `docente` usado fuera de su ámbito → error 500 para profesores (falla cerrada). |
| LB-19 | Info | — | `otp.controller.js` no está montado en ninguna ruta (código muerto). |
| LB-20 | Info | 16 | No existe subida de archivos (control 16 = N/A). |
| LB-21 | Info | B, C, D, H | Sin auditoría de cambios, sin `tokenVersion`, sin Gitleaks, respaldos sin verificar. |

---

## 10. Mantenimiento de esta Skill

- Si cambia la arquitectura (p. ej. se adopta Supabase Auth, cookies, subida de archivos o un nuevo servicio), proponer al usuario actualizar los controles afectados antes de auditar con criterios obsoletos.
- Cualquier modificación de este archivo requiere autorización del usuario.
