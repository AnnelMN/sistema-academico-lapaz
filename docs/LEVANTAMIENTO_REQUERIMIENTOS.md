# Levantamiento de Requerimientos — Sistema Web con ML para Gestión Académica
## Caso: Unidad Educativa La Paz "A" · La Paz, Bolivia · 2026

> **Autora:** Mamani Huarca Najhely Annel — Universidad Salesiana de Bolivia
> **Tipo de documento:** Comparativo Actual vs Ideal, dividido por Sprints Scrum
> **Fuentes verificadas:** `AGENTS.md`, `proyecto_resumen_TG1.md`, `REPORTE_ERRORES.md` (20/09/2026), código en `backend/`, `frontend/`, `microservicio-ia/`, `diseño/`
> **Fecha:** Octubre 2026

---

## 1. Objetivo del levantamiento

Documentar **qué debe hacer el sistema (ideal)** y **qué hace hoy realmente (actual verificado en código)**, para cerrar la brecha por Sprints Scrum. Sirve como Capítulo V — Marco Aplicativo de la tesis.

**Convención de estados usada en todo el documento:**

| Estado | Significado |
|---|---|
| ✅ Implementado | Verificado en código |
| ⚠️ Parcial | Existe pero incompleto o con bug |
| ❌ No implementado | Pedido en AGENTS.md, ausente en código |

---

## 2. Revisión técnica del sistema actual (verificada 04/10/2026)

### 2.1 Estructura encontrada

```
sistema-academico/
├── backend/               # Node 20 + Express 4 + Prisma 5 + JWT + bcrypt + Nodemailer
│   ├── prisma/schema.prisma   # 11 modelos (no 9: + Configuracion)
│   ├── prisma/seed.js         # ✅ crea Director + dotenv + Config
│   ├── src/server.js          # ✅ error handler global presente
│   ├── src/lib/prisma.js      # ✅ singleton (BUG-09 ya corregido)
│   ├── src/controllers/       # auth, usuarios, notas, asistencia, estudiante, academico, programaciones
│   ├── src/services/          # iaService.js, emailService.js
│   └── src/routes/            # auth, usuarios, notas, asistencia, estudiante, academico
├── frontend/              # React 18 + Vite 5 + Tailwind 3.4 + Recharts + Router 6
│   └── src/App.jsx            # Rutas Director/Profesor/Administrativo/Estudiante + PrivateRoute
├── microservicio-ia/      # FastAPI + scikit-learn + pandas + joblib
│   ├── main.py                # POST /predecir + GET /health
│   ├── train_model.py
│   └── requirements.txt
├── diseño/                # 15 mockups JPEG + wireframes_actualizados.html
├── AGENTS.md / proyecto_resumen_TG1.md / REPORTE_ERRORES.md (40 bugs)
└── docs/                  # este documento
```

### 2.2 Hallazgos clave (lo que cambió desde REPORTE_ERRORES.md)

| # | Hallazgo | Evidencia | Estado hoy |
|---|---|---|---|
| 1 | Ownership docente ya se valida | `notas.controller.js:44-54`, `asistencia.controller.js:18-28` verifican `docenteId` | ✅ BUG-07 corregido |
| 2 | Singleton Prisma ya existe | `src/lib/prisma.js` + `require('../lib/prisma')` en controllers | ✅ BUG-09 corregido |
| 3 | Error handler global ya existe | `server.js:23-26` | ✅ BUG-15 corregido |
| 4 | Prefijo `/api` en estudiante ya corregido | `estudiante.service.js:5-21` usa `/api/estudiante/*` | ✅ BUG-23 corregido |
| 5 | Seed con dotenv + Director | `seed.js:1` + upsert `director@lapaz.edu.bo` / `<INITIAL_DIRECTOR_PASSWORD en .env>` | ✅ BUG-10 corregido |
| 6 | Payload IA **sigue incompatible** | Backend envía `attendance_percentage, total_score, class_participation:5.0, weekly_self_study_hours:10.0` (`iaService.js:4-9`); AGENTS.md pide `promedio_notas, porcentaje_asistencia, nivel, trimestre` | ❌ BUG-06/19 vigente |
| 7 | `main.py` espera variables inexistentes en BD | `PredictionRequest` con `class_participation, weekly_self_study_hours` | ❌ vigente |
| 8 | `requirements.txt` sin pydantic | Solo fastapi, uvicorn, sklearn, pandas, numpy, joblib | ⚠️ BUG-21 vigente (funciona por dependencia transitiva) |
| 9 | BD tiene 11 tablas, no 9 | `schema.prisma` agrega `Configuracion { limiteFaltas:25, umbralAprobacion:51, trimestreActivo:1, gestionActual:2026 }` | ✅ mejora sobre spec |
| 10 | Restricciones de integridad correctas | `Nota @@unique(estudiante+materia+trimestre)`, `Asistencia @@unique(estudiante+materia+fecha)` | ✅ RN-03 cumplida |

---

## 3. Stakeholders y roles

| Rol | Acceso | Fuente |
|---|---|---|
| Director | Total: usuarios, dashboards, predicciones, reportes PDF/Excel, configuración, notificaciones | `DirectorLayout`, `Dashboard.jsx`, `Usuarios.jsx` |
| Profesor | Solo sus materias: asistencia, notas, riesgo de sus alumnos | `RegistroNotas.jsx`, `RegistroAsistencia.jsx`, `PrediccionIA.jsx` |
| Administrativo | Materias, cursos, horarios, conflictos | `AdminLayout`, `Horarios.jsx`, `Dashboard.jsx` |
| Estudiante | Solo lectura propia: notas, asistencia, horario | `EstudianteLayout`, `Notas/Asistencia/Horario/Prediccion.jsx` |
| Padre/Tutor | **Sin cuenta.** Solo email a `Estudiante.emailTutor` vía Nodemailer | `emailService.js`, `Notificacion` |

> Nota de diseño: `estudiante/Prediccion.jsx` existe, pero AGENTS.md dice que el estudiante "no puede ver predicciones". Decisión pendiente (BUG-35): eliminar ruta o documentar que solo ve la suya.

---

## 4. Reglas de negocio (RN)

| ID | Regla | Estado |
|---|---|---|
| RN-01 | Escala boliviana: Ser 0–15 + Saber 0–35 + Hacer variable = 100. Aprueba ≥51 | ⚠️ cálculo `total` existe, falta validar rangos (BUG-03) |
| RN-02 | 3 trimestres. Solo se registra en trimestre activo (`Configuracion.trimestreActivo`) | ❌ sin validación (BUG-02) |
| RN-03 | Unicidad asistencia (estudiante+materia+fecha) y nota (estudiante+materia+trimestre) | ✅ schema.prisma |
| RN-04 | Riesgo en exactamente 3 valores: SIN_RIESGO / RIESGO_MEDIO / RIESGO_ALTO | ✅ enum `NivelRiesgo` |
| RN-05 | Cada nota o asistencia recalcula predicción vía FastAPI | ⚠️ solo notas lo hacen (BUG-04) |
| RN-06 | Si RIESGO_ALTO → email automático + fila en `Notificacion` | ⚠️ solo por notas, no por faltas (BUG-05) |
| RN-07 | Predicción es orientativa; decisión final humana | ✅ documentado, sin enforcement en código |
| RN-08 | Padres sin cuenta, nunca rol PADRE | ✅ enum `Rol` sin PADRE |
| RN-09 | Docente solo ve sus cursos (ownership) | ✅ ya implementado |

---

## 5. Requerimientos funcionales y no funcionales

### 5.1 Funcionales (RF)

| ID | Requerimiento (ideal) | Módulo | Estado actual |
|---|---|---|---|
| RF-01 | Login JWT `{id, rol, email}` + bcrypt + redirección por rol | M1 Auth | ✅ |
| RF-02 | CRUD usuarios solo Director + desactivar (`activo` boolean) | M1 | ✅ parcial (falta forgot/reset password) |
| RF-03 | Recuperación contraseña por email | M1 | ❌ BUG-11 |
| RF-04 | Registrar materias por nivel 1–6, asignar docente-curso, horario semanal | M2 | ⚠️ CRUD parcial, sin detección conflictos |
| RF-05 | Detección conflictos horario | M2 | ❌ |
| RF-06 | Horario personal del estudiante | M2 | ⚠️ formato inconsistente guion vs espacio (BUG-25) |
| RF-07 | Registro asistencia PRESENTE/AUSENTE/JUSTIFICADO + % acumulado | M3 | ✅ con inconsistencia fórmula (BUG-08) |
| RF-08 | Alerta límite faltas (`Configuracion.limiteFaltas`) | M3 | ❌ BUG-05 |
| RF-09 | Historial asistencia estudiante | M3 | ✅ |
| RF-10 | Registro notas Ser/Saber/Hacer + total auto + aprobado (≥51) | M4 | ⚠️ sin validar rangos/trimestre |
| RF-11 | Promedios trimestral/anual + indicador aprobado/reprobado | M4 | ⚠️ |
| RF-12 | Boletín PDF individual | M4 | ❌ solo `window.print` |
| RF-13 | `POST /predecir` Random Forest: `{promedio, asistencia, nivel, trimestre}` → `{nivel_riesgo, probabilidad}` | M5 IA | ❌ payload distinto + data leakage (BUG-17/18) |
| RF-14 | Guardar en `PrediccionRiesgo` en cada nota/asistencia | M5 | ⚠️ solo notas |
| RF-15 | Dashboard Director: KPIs + Recharts + lista Riesgo Alto + exportar | M6 | ⚠️ mock data (BUG-27) |
| RF-16 | Dashboard Docente: mis cursos + riesgo + alertas | M6 | ⚠️ mock (BUG-28) |
| RF-17 | Dashboard Estudiante: notas/asistencia/horario | M6 | ✅ |
| RF-18 | Dashboard Administrativo: materias/horarios/usuarios | M6 | ✅ parcial |
| RF-19 | Email tutor en RIESGO_ALTO y EXCESO_FALTAS con promedio, asistencia, recomendación | M7 | ⚠️ solo RIESGO_ALTO |
| RF-20 | Historial notificaciones (fecha, tipo, destino) | M7 | ⚠️ mock (BUG-30), tabla `Notificacion` existe |
| RF-21 | Configuración institucional (límite faltas, umbral, trimestre activo) | M8 | ⚠️ tabla existe, sin panel UI |
| RF-22 | Reportes por curso/materia/trimestre/gestión + exportar PDF/Excel | M8 | ❌ |

### 5.2 No funcionales (RNF)

| ID | Requerimiento | Estado |
|---|---|---|
| RNF-01 | Seguridad: JWT 8h, bcrypt, RLS Supabase, ownership por docente | ⚠️ JWT_SECRET predecible, sin rate-limit/helmet, CORS `*` |
| RNF-02 | Ciclo nota→predicción→email <5s | ⚠️ no medido |
| RNF-03 | Stack fijo: React+Vite+Tailwind+Recharts / Express+Prisma / FastAPI+sklearn / PG Supabase | ✅ |
| RNF-04 | Deploy $0: Vercel / Railway / Render / Supabase + vars `DATABASE_URL, JWT_SECRET, IA_SERVICE_URL, EMAIL_*, FRONTEND_URL, VITE_API_URL` | ⚠️ pendiente deploy |
| RNF-05 | Calidad ISO 25010 + CRISP-DM con F1-Score, split 80/20, ID3 vs RF | ❌ modelo con leakage, sin cross-val |
| RNF-06 | Usabilidad: responsive, modo oscuro con CSS vars, `lang="es"`, título real | ⚠️ BUG-33/34 vigentes |
| RNF-07 | 401 → redirect login (interceptor axios) | ❌ BUG-31 |

---

## 6. División por Sprints Scrum (plan de cierre de brecha)

> Sprint = 2 semanas (Sprint 5 IA = 3 semanas). Total estimado original: 153 SP ≈ 612 h. Remanente estimado: 15–20 días (ver REPORTE_ERRORES §10).

### Sprint 1 — Autenticación, Usuarios y Base (M1 + BD)

**Objetivo:** acceso seguro y datos semilla correctos.

| HU | Historia de usuario | Criterio de aceptación | Estado |
|---|---|---|---|
| HU-01 | Como Director quiero crear/editar/desactivar usuarios para gestionar planta | CRUD con `activo` flag, solo rol DIRECTOR | ✅ |
| HU-02 | Como usuario quiero loguearme y ser redirigido a mi dashboard | JWT `{id,rol,email}`, bcrypt, `PrivateRoute` por rol | ✅ |
| HU-03 | Como usuario bloqueado no puedo entrar | Login rechaza `activo=false` | ⚠️ verificar |
| HU-04 | Como usuario olvidé mi clave y la recupero por email | `POST /forgot-password` + `/reset-password` con token | ❌ BUG-11 → hacer |
| HU-05 | Como sistema quiero seed con Director inicial | `director@lapaz.edu.bo` / `<INITIAL_DIRECTOR_PASSWORD en .env>` + perfil estudiante completo en `estudiantes` | ⚠️ verificar BUG-01 (estudiante seed con `cursoId+gestion+emailTutor`) |

**Brecha Sprint 1:** implementar HU-04, validar HU-05, endurecer `JWT_SECRET` (64B random), rate-limit login, Helmet, CORS específico.

### Sprint 2 — Asistencia (M3)

**Objetivo:** registro diario fiable + alertas de faltas.

| HU | Historia | Aceptación | Estado |
|---|---|---|---|
| HU-06 | Como Profesor registro asistencia diaria de mi curso | `@@unique(estudiante+materia+fecha)`, ownership verificado | ✅ |
| HU-07 | Como Profesor veo % asistencia acumulado consistente | Fórmula única `(PRESENTE+JUSTIFICADO)/total` en los 3 controllers | ❌ BUG-08 → unificar |
| HU-08 | Como sistema al superar `limiteFaltas` emailo al tutor | `enviarAlertaInasistencia()` + `Notificacion{EXCESO_FALTAS}` | ❌ BUG-05 → hacer |
| HU-09 | Como Estudiante veo mi historial | `GET /api/estudiante/asistencia` con `/api` | ✅ (prefijo ya OK) |

### Sprint 3 — Notas (M4)

**Objetivo:** escala boliviana íntegra.

| HU | Historia | Aceptación | Estado |
|---|---|---|---|
| HU-10 | Como Profesor registro Ser/Saber/Hacer por trimestre | `total=ser+saber+hacer`, `aprobado=total>=51`, ownership | ✅ parcial |
| HU-11 | Como sistema rechazo notas fuera de rango y de trimestre inactivo | Ser 0–15, Saber 0–35, Hacer ≥0; `trimestre==Config.trimestreActivo` else 403/400 | ❌ BUG-02/03 → hacer |
| HU-12 | Como Estudiante veo mis notas y promedio | `GET /api/estudiante/notas?trimestre=` | ✅ |
| HU-13 | Como Profesor exporto boletín PDF real | PDF generado backend (no print) | ❌ → hacer |

### Sprint 4 — Dashboards y Reportes (M6 + M8 parcial)

**Objetivo:** eliminar mocks, gráficos reales.

| HU | Historia | Aceptación | Estado |
|---|---|---|---|
| HU-14 | Como Director veo KPIs + evolución Recharts + lista Riesgo Alto | Endpoint `/api/dashboard/director`, sin arrays hardcodeados | ❌ BUG-27 → hacer |
| HU-15 | Como Profesor veo mis cursos con riesgo por alumno | Endpoint por docente | ❌ BUG-28 → hacer |
| HU-16 | Como Administrativo gestiono materias/horarios | CRUD + AdminLayout | ⚠️ |
| HU-17 | Como Director exporto PDF/Excel por curso/materia/trimestre/gestión | Filtros + descarga | ❌ → hacer |
| HU-18 | Como usuario mi sesión expirada me lleva a login | Interceptor 401 en `api.js` | ❌ BUG-31 → hacer |

### Sprint 5 — IA núcleo (M5, 3 semanas, CRISP-DM)

**Objetivo:** modelo honesto con las 4 variables del spec.

| HU | Historia | Aceptación | Estado |
|---|---|---|---|
| HU-19 | Como sistema clasifico en 3 niveles con RF | Input `{promedio_notas, porcentaje_asistencia, nivel 1-6, trimestre 1-3}`; output `{nivel_riesgo, probabilidad}` | ❌ hoy usa `attendance_percentage, total_score, class_participation, weekly_self_study_hours` → realinear `iaService.js` + `main.py` |
| HU-20 | Como data scientist entreno ID3 vs RF 80/20 y elijo por F1 | `train_model.py`: rutas `data/*.csv` → `model/modelo_riesgo.pkl` + `metricas_modelo.json`, sin leakage, con GridSearchCV | ❌ BUG-17/18/20/22 → reentrenar dataset con `nivel, trimestre` |
| HU-21 | Como sistema recalculo en cada nota **y** asistencia | `registrarAsistencia` invoca `iaService.predecirRiesgo` igual que notas | ❌ BUG-04 → hacer |
| HU-22 | Como Director/Profesor consulto predicción con probabilidad | `GET /api/predicciones/*` sin MOCK | ❌ BUG-29 → hacer |

**Deuda IA verificada:** `requirements.txt` agregar `pydantic>=2.0`; corregir rutas CWD en `train_model.py:40,195,225`.

### Sprint 6 — Notificaciones (M7) + Materias/Horarios (M2)

**Objetivo:** padres informados, horarios sin choques.

| HU | Historia | Aceptación | Estado |
|---|---|---|---|
| HU-23 | Como tutor recibo email en RIESGO_ALTO con promedio, asistencia, recomendación | Nodemailer + fila `Notificacion{RIESGO_ALTO}` | ✅ parcial (solo vía notas) |
| HU-24 | Como tutor recibo email en EXCESO_FALTAS | Idem `EXCESO_FALTAS` | ❌ (depende HU-08) |
| HU-25 | Como Administrativo programo horario sin choques | Detección conflicto docente-curso-hora | ❌ → hacer |
| HU-26 | Como Estudiante veo mi horario semanal legible | Unificar formato `"Lunes 07:30"` (espacio) en `Horarios.jsx` y `Horario.jsx` | ❌ BUG-25 → hacer |
| HU-27 | Como Director veo historial notificaciones real | CRUD notificaciones, sin `setTimeout` fake | ❌ BUG-30 → hacer |

### Sprint 7 — Pruebas, Seguridad y Deploy (transversal)

**Objetivo:** sistema desplegable y auditable.

- [ ] Regenerar `JWT_SECRET` (`crypto.randomBytes(64)`), mover tests sueltos de `backend/*.js` a `backend/scripts/`, eliminar token hardcodeado `verify_endpoint.js` (BUG-14/16)
- [ ] `express-rate-limit` en login, `helmet`, CORS `origin: FRONTEND_URL` (Fase 5 seguridad)
- [ ] Corregir `Login.jsx:10` "Adminstrativo", `index.html` `lang="es"` + título real, eliminar `App.css`/`MallaCurricular.jsx`/`TopbarLayout.jsx` muertos, unificar Tailwind → CSS vars (BUG-26/32/33/34)
- [ ] Postman: login 4 roles, notas, asistencia, predicción, 403 ownership, 400 rangos
- [ ] Deploy: Vercel `VITE_API_URL`, Railway `DATABASE_URL/JWT/IA/EMAIL/FRONTEND_URL`, Render `pip install -r requirements.txt` + `uvicorn main:app --host 0.0.0.0 --port $PORT`, Supabase RLS por `rol`
- [ ] Decidir BUG-35: quitar `/estudiante/prediccion` o documentar "solo ve la suya"

### Sprint 8 — Cierre y Tesis

**Objetivo:** entrega TG2.

- [ ] Manual usuario por rol + flujo crítico <5s (nota→FastAPI→email→UI)
- [ ] Evidencia CRISP-DM: F1/precisión/recall ID3 vs RF, matriz confusión
- [ ] Marco legal (Ley 070/164/548, ISO 25010/27002/12207) y costos (31.220 Bs desarrollo, Bs 0 operativo)
- [ ] Acta supervisión humana (RN-07) y consentimiento datos menores

---

## 7. Matriz de trazabilidad (resumen)

| Sprint | RF | Módulo | Estado global |
|---|---|---|---|
| 1 | RF-01–03 | M1 Auth | ⚠️ falta recovery |
| 2 | RF-07–09 | M3 Asistencia | ⚠️ falta alerta faltas + fórmula |
| 3 | RF-10–12 | M4 Notas | ⚠️ falta validaciones + PDF |
| 4 | RF-15–18 | M6 Dashboards | ❌ mocks |
| 5 | RF-13–14 | M5 IA | ❌ payload + leakage |
| 6 | RF-04–06, RF-19–20 | M2 + M7 | ❌ conflictos + EXCESO_FALTAS + horario |
| 7 | RNF-01/04/06/07, RF-21–22 parcial | Transversal | ⚠️ |
| 8 | — | Tesis | Pendiente |

**Priorización MoSCoW:** Must: HU-04, HU-07/08, HU-11, HU-19/20/21, HU-23/24, HU-14/18. Should: HU-13/17/25/27. Could: Excel avanzado, WebSocket. Won't (ahora): app móvil, offline total.

---

## 8. Flujo crítico a validar en QA

```
Docente POST /api/notas {estudianteId, materiaProgramadaId, trimestre, ser, saber, hacer}
→ authMiddleware JWT + ownership docente
→ Prisma Nota total=ser+saber+hacer, aprobado>=51
→ promedio trimestral + % asistencia
→ iaService POST {promedio_notas, porcentaje_asistencia, nivel, trimestre} → FastAPI joblib
→ {nivel_riesgo: RIESGO_ALTO, probabilidad: 0.87} → PrediccionRiesgo
→ si ALTO: Nodemailer → emailTutor + Notificacion
→ React refresca <5s
```

Hoy el paso IA usa variables distintas — es el bloqueador Nº1 del Sprint 5.

---

*Generado para TG — Universidad Salesiana de Bolivia, 2026. Verificar contra código antes de cada Sprint Review.*
