# REPORTE GENERAL DE ERRORES — Sistema Academico UELA 2026

**Fecha:** 20 de Septiembre de 2026
**Proyecto:** Sistema Web con Machine Learning para Gestion Academica
**Postulante:** Mamani Huarca Najhely Annel

---

## TABLA DE CONTENIDO

1. [Como funciona este proyecto (guia para principiantes)](#1-como-funciona-este-proyecto)
2. [Resumen ejecutivo](#2-resumen-ejecutivo)
3. [Fase 1: Correccion critica — Backend + Base de datos](#fase-1-corregir-backend--base-de-datos)
4. [Fase 2: Correccion critica — Microservicio IA](#fase-2-corregir-microservicio-ia)
5. [Fase 3: Correccion critica — Frontend](#fase-3-corregir-frontend)
6. [Fase 4: Features faltantes segun AGENTS.md](#fase-4-features-faltantes)
7. [Fase 5: Seguridad](#fase-5-seguridad)
8. [Fase 6: Mejoras opcionales](#fase-6-mejoras-opcionales)
9. [Como crear agents para cada tarea](#9-como-crear-agents-para-cada-tarea)
10. [Orden recomendado de ejecucion](#10-orden-recomendado)

---

## 1. COMO FUNCIONA ESTE PROYECTO

### Arquitectura general (explicada paso a paso)

```
USUARIO ABRE EL NAVEGADOR (React/Vite)
         |
         |  El navegador muestra las paginas (Login, Dashboard, etc.)
         |  Cada pagina hace peticiones HTTP al Backend
         |
         v
BACKEND (Node.js + Express)
         |
         |  Recibe peticiones, valida token JWT, verifica permisos
         |  Consulta o modifica la base de datos
         |  Ocasionalmente llama al microservicio IA
         |
         +-----> BASE DE DATOS (PostgreSQL en Supabase)
         |         Donde se guardan todos los datos (usuarios, notas, etc.)
         |
         +-----> MICROSERVICIO IA (Python + FastAPI)
                   Servicio separado que entrena un modelo de Machine Learning
                   y devuelve predicciones de riesgo academico
```

### Cada parte del proyecto

| Parte | Carpeta | Tecnologia | Que hace |
|-------|---------|------------|----------|
| Frontend | `frontend/` | React + Vite + Tailwind | Lo que el usuario ve y manipula |
| Backend | `backend/` | Node.js + Express + Prisma | Logica del negocio, API, autenticacion |
| Microservicio IA | `microservicio-ia/` | Python + FastAPI + scikit-learn | Entrena modelo y predice riesgo |
| Base de datos | Supabase (nube) | PostgreSQL | Almacena toda la informacion |

### Flujo de datos de una operacion comun

```
1. El DOCENTE abre la pagina de "Registro de Notas"
2. React (frontend) hace GET /api/notas/mis-materias para listar las materias
3. El BACKEND recibe la peticion, verifica el token JWT, busca en la BD
4. React muestra las materias y el docente ingresa las notas
5. React hace POST /api/notas con los datos
6. El BACKEND guarda la nota en la BD
7. El BACKEND calcula total = ser + saber + hacer
8. El BACKEND llama al MICROSERVICIO IA para predecir riesgo
9. El MICROSERVICIO IA carga el modelo y devuelve { nivel_riesgo, probabilidad }
10. El BACKEND guarda la prediccion en la BD
11. Si es RIESGO_ALTO, el BACKEND envia un correo al padre via Nodemailer
12. El BACKEND responde al FRONTEND con la nota guardada
13. React actualiza la pantalla
```

### Archivos importantes que debes conocer

```
backend/
  prisma/schema.prisma     <-- Define todas las tablas de la BD
  prisma/seed.js           <-- Crea datos iniciales (Director, cursos, materias)
  src/server.js            <-- Punto de entrada del servidor
  src/middleware/authMiddleware.js  <-- Valida tokens JWT
  src/controllers/         <-- Logica de cada modulo (notas, asistencia, etc.)
  src/services/iaService.js       <-- Comunica con el microservicio IA
  src/services/emailService.js    <-- Envia correos electronicos
  src/routes/              <-- Define que URLs van a cada controller

frontend/
  src/App.jsx              <-- Define todas las rutas (paginas)
  src/context/AuthContext.jsx  <-- Maneja login/logout y usuario actual
  src/services/            <-- Cada archivo conecta con una parte del backend
  src/pages/               <-- Cada carpeta = un rol (director, profesor, etc.)
  src/routes/PrivateRoute.jsx  <-- Protege las rutas segun el rol

microservicio-ia/
  train_model.py           <-- Entrena el modelo de Machine Learning
  main.py                  <-- API que recibe peticiones y devuelve predicciones
  data/student_performance.csv  <-- Datos de entrenamiento
  model/modelo_riesgo.pkl  <-- Modelo entrenado guardado
```

---

## 2. RESUMEN EJECUTIVO

| Categoria | Criticos | Altos | Medios | Bajos | Total |
|-----------|----------|-------|--------|-------|-------|
| Backend | 7 | 3 | 4 | 2 | 16 |
| Frontend | 4 | 5 | 3 | 3 | 15 |
| Microservicio IA | 2 | 2 | 3 | 2 | 9 |
| **TOTAL** | **13** | **10** | **10** | **7** | **40** |

### Que significa cada nivel de severidad

- **CRITICO**: El sistema no funciona o viola una regla de negocio fundamental. Sin esta correccion, el sistema esta roto.
- **ALTO**: Funcionalidad importante no disponible o datos incorrectos.
- **MEDIO**: Funciona pero con problemas que afectan calidad o mantenibilidad.
- **BAJO**: Mejora menor, no afecta funcionalidad.

---

## FASE 1: CORREGIR BACKEND + BASE DE DATOS

### BUG-01 [CRITICO] — Estudiante sin perfil en BD

**Archivo:** `backend/prisma/seed.js` lineas 72-83

**Problema:** El seed crea un usuario con `rol: 'ESTUDIANTE'` pero NO crea un registro en la tabla `estudiantes`. Cuando el estudiante intenta usar cualquier endpoint (ver notas, horario, asistencia), el controller busca en la tabla `estudiantes` y falla con "Perfil de estudiante no encontrado".

**Por que es critico:** El usuario estudiante puede hacer login pero NO puede hacer nada dentro del sistema.

**Solucion:** Despues de crear el usuario, crear tambien el perfil:
```javascript
// Despues de crear el usuario estudiante
const curso3A = await prisma.curso.findFirst({ where: { nivel: 3, paralelo: 'A' } });
await prisma.estudiante.create({
  data: {
    usuarioId: estudiante.id,
    cursoId: curso3A.id,
    gestion: 2026,
    emailTutor: 'padre_carlos@lapaz.edu.bo'
  }
});
```

**Agent sugerido:** `backend-fix-seed` — Corregir seed.js para crear perfiles completos.

---

### BUG-02 [CRITICO] — Sin validacion de trimestre activo

**Archivo:** `backend/src/controllers/notas.controller.js` funcion `upsertNota` (linea 95)

**Problema:** El docente puede enviar notas para cualquier trimestre (1, 2 o 3) sin importar cual esta activo. La regla de negocio dice: "Solo se puede registrar notas en el trimestre activo."

**Por que es critico:** Se pueden ingresar notas de trimestre 3 cuando solo esta activo el trimestre 1, rompiendo la integridad academica.

**Solucion:** Antes del upsert, consultar la configuracion:
```javascript
// Al inicio de upsertNota
const config = await prisma.configuracion.findFirst();
if (config && parseInt(trimestre) !== config.trimestreActivo) {
  return res.status(403).json({ 
    error: `Solo se pueden registrar notas en el trimestre activo (${config.trimestreActivo})` 
  });
}
```

**Agent sugerido:** `backend-validacion-notas` — Agregar validacion de trimestre y rangos.

---

### BUG-03 [CRITICO] — Sin validacion de rangos de nota

**Archivo:** `backend/src/controllers/notas.controller.js` lineas 97-131

**Problema:** No se valida que `ser` este entre 0-15, `saber` entre 0-35, y `hacer` sea positivo. Se puede enviar `ser: 100` y el sistema lo acepta.

**Por que es critico:** Datos invalidos contaminan la base de datos y hacen que las predicciones IA sean inutiles.

**Solucion:**
```javascript
if (ser < 0 || ser > 15) return res.status(400).json({ error: 'Ser debe estar entre 0 y 15' });
if (saber < 0 || saber > 35) return res.status(400).json({ error: 'Saber debe estar entre 0 y 35' });
if (hacer < 0) return res.status(400).json({ error: 'Hacer no puede ser negativo' });
```

**Agent sugerido:** `backend-validacion-notas` — (mismo que BUG-02, se pueden combinar).

---

### BUG-04 [CRITICO] — Asistencia no invoca prediccion IA

**Archivo:** `backend/src/controllers/asistencia.controller.js` funcion `registrarAsistencia` (linea 84)

**Problema:** Cuando se registra asistencia, el sistema NO llama al microservicio IA para recalcular el riesgo. Solo lo hace cuando se registran notas. La regla de negocio dice: "Cada vez que se registra una nota O UNA ASISTENCIA, el backend llama automaticamente a FastAPI."

**Por que es critico:** Las predicciones se desactualizan cuando el estudiante falta a clases. Un estudiante con muchas faltas seguira apareciendo como "Sin Riesgo" hasta que se registre una nota.

**Solucion:** Al final de `registrarAsistencia`, para cada estudiante afectado:
```javascript
// Despues de guardar las asistencias
for (const registro of registros) {
  // Calcular promedio de notas y porcentaje de asistencia
  // Llamar a iaService.predecirRiesgo(...)
  // Guardar prediccion en PrediccionRiesgo
  // Si es RIESGO_ALTO, enviar correo
}
```

**Agent sugerido:** `backend-asistencia-ia` — Integrar asistencia con el sistema de prediccion.

---

### BUG-05 [CRITICO] — Sin notificacion de EXCESO_FALTAS

**Archivo:** `backend/src/controllers/asistencia.controller.js`
**Archivo:** `backend/src/services/emailService.js`

**Problema:** La regla de negocio dice: "Nodemailer envia correo automatico cuando el estudiante supera el limite de inasistencias." Actualmente solo se envian correos por RIESGO_ALTO, nunca por exceso de faltas.

**Por que es critico:** Los padres nunca son informados cuando su hijo falta demasiado.

**Solucion:**
1. Crear funcion `enviarAlertaInasistencia()` en `emailService.js`
2. En `registrarAsistencia`, contar faltas totales del estudiante
3. Comparar con `Configuracion.limiteFaltas`
4. Si supera el limite, enviar correo y crear notificacion con `tipo: 'EXCESO_FALTAS'`

**Agent sugerido:** `backend-notificaciones-faltas` — Crear sistema de notificaciones por exceso de faltas.

---

### BUG-06 [CRITICO] — Payload de IA incompatible

**Archivo:** `backend/src/services/iaService.js` (lineas 1-9)

**Problema:** El backend envia al microservicio:
```json
{ "attendance_percentage": 85, "total_score": 60, "class_participation": 5.0, "weekly_self_study_hours": 10.0 }
```
Pero el AGENTS.md especifica que las variables deben ser: `promedio_notas, porcentaje_asistencia, nivel (1-6), trimestre (1-3)`.

Ademas, `class_participation` y `weekly_self_study_hours` estan **hardcodeados** a valores fijos porque no existen columnas en la BD.

**Por que es critico:** El modelo recibe datos fabricados. La prediccion no es confiable.

**Solucion:** Cambiar el payload en `iaService.js` para enviar los valores reales que existen en la BD. Asegurar que `main.py` en el microservicio espere los mismos campos.

**Agent sugerido:** `backend-ia-payload` — Alinear payload del backend con el microservicio.

---

### BUG-07 [CRITICO] — Sin verificacion de propiedad de materia

**Archivos:**
- `backend/src/controllers/notas.controller.js`
- `backend/src/controllers/asistencia.controller.js`

**Problema:** Cualquier profesor autenticado puede enviar `materiaProgramadaId` de cualquier materia y modificar notas/asistencia de cursos que no le corresponden. El middleware solo verifica que sea PROFESOR, no que sea el dueño de esa materia.

**Por que es critico:** Un profesor de Fisica puede cambiar las notas de Matematicas.

**Solucion:** En cada controller, verificar que la materia le pertenece al profesor:
```javascript
const programacion = await prisma.materiaProgramada.findUnique({ where: { id: materiaProgramadaId } });
if (programacion.docenteId !== docente.id) {
  return res.status(403).json({ error: 'No tienes acceso a esta materia' });
}
```

**Agent sugerido:** `backend-autorizacion-materia` — Agregar verificacion de ownership.

---

### BUG-08 [ALTO] — Calculo inconsistente de porcentaje de asistencia

**Archivos:**
- `notas.controller.js:158` — Cuenta PRESENTE + JUSTIFICADO como presentes
- `estudiante.controller.js:96` — Solo cuenta PRESENTE
- `asistencia.controller.js:56` — Solo cuenta PRESENTE

**Problema:** Un estudiante puede ver 85% en una pantalla y 72% en otra.

**Solucion:** Estandarizar el calculo. La regla boliviana tipica: PRESENTE = presente, JUSTIFICADO = justificado (no es falta), AUSENTE = falta. Entonces `(PRESENTE + JUSTIFICADO) / total * 100` es la formula correcta. Corregir los dos controllers que usan solo PRESENTE.

**Agent sugerido:** `backend-asistencia-consistencia` — Estandarizar calculo de asistencia.

---

### BUG-09 [ALTO] — PrismaClient instanciado en cada archivo

**Archivos:** Todos los controllers (7 archivos)

**Problema:** Cada controller crea `new PrismaClient()`. Eso crea 7 pools de conexion separados, consumiendo recursos innecesariamente.

**Solucion:** Crear un singleton:
```javascript
// backend/src/lib/prisma.js
const { PrismaClient } = require('@prisma/client');
module.exports = new PrismaClient();
```
Luego en cada controller: `const prisma = require('../lib/prisma');`

**Agent sugerido:** `backend-prisma-singleton` — Refactorizar a singleton de Prisma.

---

### BUG-10 [ALTO] — Seed.js sin dotenv

**Archivo:** `backend/prisma/seed.js`

**Problema:** No tiene `require('dotenv').config()`. Si se ejecuta directamente con `node prisma/seed.js` (fuera de `npx prisma db seed`), las variables de entorno no se cargan.

**Solucion:** Agregar `require('dotenv').config();` al inicio del archivo.

**Agent sugerido:** `backend-fix-seed` — (mismo que BUG-01).

---

### BUG-11 [MEDIO] — Sin recuperacion de contrasena

**Archivos:** `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`

**Problema:** El AGENTS.md especifica "Recuperacion de contrasena por correo electronico" en el Modulo 1. No existe ningun endpoint ni logica para esto.

**Solucion:** Crear endpoints `POST /api/auth/forgot-password` y `POST /api/auth/reset-password`.

**Agent sugerido:** `backend-password-recovery` — Implementar recuperacion de contrasena.

---

### BUG-12 [MEDIO] — emailTutor fake por defecto

**Archivo:** `backend/src/controllers/usuarios.controller.js` linea 74

**Problema:** Al crear un estudiante sin emailTutor, se genera `tutor_${email}` que no es un correo real.

**Solucion:** Hacer emailTutor obligatorio al crear estudiantes, o validarlo con regex de email.

**Agent sugerido:** `backend-validacion-estudiante` — Validar emailTutor.

---

### BUG-13 [MEDIO] — JWT_SECRET debil

**Archivo:** `backend/.env`

**Problema:** `clave_secreta_para_tokens_jwt_sistema_academico_2026` es una frase predecible.

**Solucion:** Generar uno aleatorio: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

**Agent sugerido:** `backend-seguridad` — Generar JWT_SECRET seguro.

---

### BUG-14 [MEDIO] — Token hardcodeado en verify_endpoint.js

**Archivo:** `backend/verify_endpoint.js`

**Problema:** Contiene un JWT completo hardcodeado. Si se sube a GitHub, cualquiera puede usarlo.

**Solucion:** Eliminar el token hardcodeado o generar tokens dinamicamente en los tests.

**Agent sugerido:** `backend-limpieza` — Eliminar archivos de test del directorio raiz.

---

### BUG-15 [BAJO] — Sin handler global de errores

**Archivo:** `backend/src/server.js`

**Problema:** No hay middleware de errores. Si algo falla, Express muestra HTML de error.

**Solucion:** Agregar al final de server.js:
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});
```

**Agent sugerido:** `backend-mejoras-generales` — Agregar error handler.

---

### BUG-16 [BAJO] — Archivos de test en directorio raiz

**Archivos:** `test_email.js`, `test_ia_integration.js`, `test_student.js`, `verify_endpoint.js`, `check_teacher.js`, `diagnostico.js`, `fix_estudiantes.js`

**Problema:** 7 archivos de prueba/test en la raiz del backend. Deberian estar en `backend/scripts/`.

**Solucion:** Mover a `backend/scripts/` y agregar al `.gitignore` los que contengan datos sensibles.

**Agent sugerido:** `backend-limpieza` — Reorganizar archivos.

---

## FASE 2: CORREGIR MICROSERVICIO IA

### BUG-17 [CRITICO] — Data Leakage total en el modelo

**Archivo:** `microservicio-ia/train_model.py` lineas 59-73

**Problema:** La variable objetivo (`nivel_riesgo`) se genera con una funcion `if/else` basada UNICAMENTE en `total_score`:

```python
def asignar_nivel_riesgo(total_score):
    if total_score >= 66: return "SIN_RIESGO"
    elif total_score >= 51: return "RIESGO_MEDIO"
    else: return "RIESGO_ALTO"
```

Esto significa que el modelo "aprende" una regla trivial: si `total_score < 51` entonces "RIESGO_ALTO". El 100% de accuracy no es inteligencia artificial, es una calculadora.

**Por que es critico:** El modelo no tiene ningun valor predictivo real. Podria ser reemplazado por un simple `if/else`.

**Solucion:** Crear un dataset donde `nivel_riesgo` dependa de MULTIPLES factores (asistencia, notas de varios trimestres, tendencia, etc.), no solo de `total_score`.

**Agent sugerido:** `ia-reentrenar-modelo` — Crear dataset realista y reentrenar.

---

### BUG-18 [CRITICO] — Variables faltantes en el dataset

**Archivo:** `microservicio-ia/data/student_performance.csv`

**Problema:** El AGENTS.md especifica 4 variables de entrada:
1. `promedio_notas` — Parcialmente cubierto por `total_score`
2. `porcentaje_asistencia` — Presente como `attendance_percentage`
3. `nivel` (1-6) — **NO EXISTE** en el dataset
4. `trimestre` (1-3) — **NO EXISTE** en el dataset

**Por que es critico:** El modelo no puede diferenciar entre un estudiante de 1ro y uno de 6to, ni entre el trimestre 1 y el 3.

**Solucion:** Crear un dataset que incluya todas las variables requeridas por el spec.

**Agent sugerido:** `ia-reentrenar-modelo` — (mismo que BUG-17).

---

### BUG-19 [ALTO] — Payload hardcodeado en backend

**Archivo:** `backend/src/services/iaService.js` lineas 7-8

**Problema:** `class_participation: 5.0` y `weekly_self_study_hours: 10.0` estan hardcodeados porque no existen columnas en la BD.

**Solucion:** Opcion A: Agregar columnas a la BD. Opcion B: Cambiar las variables del modelo para usar solo datos disponibles (notas, asistencia, nivel, trimestre).

**Agent sugerido:** `ia-reentrenar-modelo` — Definir variables del modelo segun datos reales.

---

### BUG-20 [MEDIO] — Rutas de archivos inconsistentes en train_model.py

**Archivo:** `microservicio-ia/train_model.py`

**Problema:**
- Linea 40: `pd.read_csv("student_performance.csv")` pero el archivo esta en `data/student_performance.csv`
- Linea 195: Guarda `modelo_riesgo.pkl` en CWD, pero `main.py` busca en `model/modelo_riesgo.pkl`

**Solucion:**
```python
# linea 40
df = pd.read_csv("data/student_performance.csv")
# linea 195
joblib.dump(mejor_modelo, "model/modelo_riesgo.pkl")
# linea 225
with open("model/metricas_modelo.json", "w") as f:
```

**Agent sugerido:** `ia-fix-rutas` — Corregir rutas en train_model.py.

---

### BUG-21 [MEDIO] — pydantic no esta en requirements.txt

**Archivo:** `microservicio-ia/requirements.txt`

**Problema:** `main.py` importa `from pydantic import BaseModel` pero pydantic no esta listado (es dependencia transitiva de FastAPI).

**Solucion:** Agregar `pydantic>=2.0` a requirements.txt.

**Agent sugerido:** `ia-fix-dependencias` — Actualizar requirements.txt.

---

### BUG-22 [BAJO] — Sin cross-validation ni hyperparameter tuning

**Archivo:** `microservicio-ia/train_model.py`

**Problema:** CRISP-DM recomienda k-fold cross-validation y busqueda de hiperparametros. Actualmente usa un solo split 80/20 con parametros fijos.

**Solucion:** Agregar `GridSearchCV` y `cross_val_score`.

**Agent sugerido:** `ia-mejorar-modelo` — Mejorar metodologia de entrenamiento.

---

## FASE 3: CORREGIR FRONTEND

### BUG-23 [CRITICO] — estudiante.service.js sin prefijo /api

**Archivo:** `frontend/src/services/estudiante.service.js`

**Problema:** Todos los endpoints usan `/estudiante/...` en vez de `/api/estudiante/...`:
```javascript
// MAL
api.get('/estudiante/notas?trimestre=1')
// BIEN
api.get('/api/estudiante/notas?trimestre=1')
```

El proxy de Vite y las rutas del backend esperan `/api/`.

**Por que es critico:** Las paginas de estudiante (Notas, Horario, Asistencia, Prediccion) no funcionan ni en desarrollo ni en produccion.

**Solucion:** Cambiar todas las rutas:
```javascript
const estudianteService = {
  getMisNotas: async (trimestre = 1) => {
    const response = await api.get(`/api/estudiante/notas?trimestre=${trimestre}`);
    return response.data;
  },
  getMiHorario: async () => {
    const response = await api.get('/api/estudiante/horario');
    return response.data;
  },
  getMiAsistencia: async () => {
    const response = await api.get('/api/estudiante/asistencia');
    return response.data;
  },
  getMiPrediccion: async () => {
    const response = await api.get('/api/estudiante/prediccion');
    return response.data;
  }
};
```

**Agent sugerido:** `frontend-fix-estudiante-service` — Corregir prefijos de endpoints.

---

### BUG-24 [CRITICO] — Rutas muertas en App.jsx

**Archivo:** `frontend/src/App.jsx`

**Problema:** Los sidebars de Director, Profesor y Administrativo tienen links a rutas que NO existen en `App.jsx`:

| Sidebar referencia | Existe en App.jsx? |
|---|---|
| `/director/horarios` | NO |
| `/director/asistencia` | NO |
| `/director/notas` | NO |
| `/director/predicciones` | NO |
| `/director/reportes` | NO |
| `/profesor/horario` | NO |
| `/profesor/reportes` | NO |
| `/administrativo/usuarios` | NO |
| `/administrativo/reportes` | NO |
| `/administrativo/asistencia` | NO |

Hacer clic en cualquiera de estos links redirige al login.

**Solucion:** Agregar las rutas faltantes en `App.jsx` con sus respectivos componentes, O eliminar los links muertos del sidebar hasta que las paginas esten listas.

**Agent sugerido:** `frontend-rutas-completas` — Completar rutas faltantes o limpiar sidebars.

---

### BUG-25 [CRITICO] — Formato de horario incompatible

**Archivos:**
- `frontend/src/pages/administrativo/Horarios.jsx` — Guarda como `"Lunes-07:30"` (guión)
- `frontend/src/pages/estudiante/Horario.jsx` — Parsea con `.split(' ')` (espacio)

**Problema:** El horario del estudiante no se muestra correctamente porque el formato de parsing no coincide con el formato de guardado.

**Solucion:** Unificar el formato. Usar siempre `"Lunes 07:30"` (con espacio) o `"Lunes-07:30"` (con guion).

**Agent sugerido:** `frontend-fix-horario` — Unizar formato de horario.

---

### BUG-26 [CRITICO] — Typo en Login

**Archivo:** `frontend/src/pages/Login.jsx` linea 10

**Problema:** `"Adminstrativo"` deberia ser `"Administrativo"` (falta la segunda 'i').

**Solucion:** Corregir el texto.

**Agent sugerido:** `frontend-fix-login` — Corregir typo.

---

### BUG-27 [ALTO] — Dashboard del Director con datos mock

**Archivo:** `frontend/src/pages/director/Dashboard.jsx`

**Problema:** Todos los datos (`kpiData`, `cursosData`, `estudiantesRiesgo`) son arrays hardcodeados. No hay llamadas a la API.

**Solucion:** Crear un endpoint en el backend que devuelva los KPIs del director y conectar el componente con `useEffect` + `axios`.

**Agent sugerido:** `frontend-dashboard-director` — Conectar dashboard con API real.

---

### BUG-28 [ALTO] — Dashboard del Profesor con datos mock

**Archivo:** `frontend/src/pages/profesor/Dashboard.jsx`

**Problema:** Igual que el director, todos los datos estan hardcodeados.

**Solucion:** Crear endpoint y conectar.

**Agent sugerido:** `frontend-dashboard-profesor` — Conectar dashboard con API real.

---

### BUG-29 [ALTO] — PrediccionIA.jsx con datos mock

**Archivo:** `frontend/src/pages/profesor/PrediccionIA.jsx`

**Problema:** Tiene `TODO Sprint 8` y usa `MOCK_DATA`, `MODELO_STATS`, `CURSOS_MOCK`.

**Solucion:** Crear endpoint `GET /api/predicciones/por-materia` y conectar.

**Agent sugerido:** `frontend-prediccion-ia` — Conectar vista de predicciones con API.

---

### BUG-30 [ALTO] — Notificaciones.jsx con datos mock

**Archivo:** `frontend/src/pages/shared/Notificaciones.jsx`

**Problema:** Tiene `TODO Sprint 9` y usa `MOCK_DATA`. El envio es un `setTimeout` fake.

**Solucion:** Crear endpoints CRUD para notificaciones y conectar.

**Agent sugerido:** `frontend-notificaciones` — Conectar notificaciones con API.

---

### BUG-31 [ALTO] — Sin interceptor 401 en api.js

**Archivo:** `frontend/src/services/api.js`

**Problema:** Si el token JWT expira, el usuario recibe errores silenciosos. No hay interceptor que redirija al login.

**Solucion:**
```javascript
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**Agent sugerido:** `frontend-mejoras-api` — Agregar interceptor 401.

---

### BUG-32 [MEDIO] — Archivos muertos

| Archivo | Problema |
|---------|----------|
| `frontend/src/App.css` | CSS default de Vite, nunca se importa |
| `frontend/src/pages/administrativo/MallaCurricular.jsx` | Copia exacta de Horarios.jsx, nunca se usa |
| `frontend/src/components/layout/TopbarLayout.jsx` | Layout alternativo, nunca se importa |

**Solucion:** Eliminar los tres archivos.

**Agent sugerido:** `frontend-limpieza` — Eliminar archivos no utilizados.

---

### BUG-33 [MEDIO] — index.html con titulo y lang incorrectos

**Archivo:** `frontend/index.html`

**Problema:** `<title>frontend</title>` (es un placeholder de Vite) y `lang="en"` (deberia ser `"es"`).

**Solucion:**
```html
<html lang="es">
  <head>
    <title>U.E. La Paz "A" - Sistema Academico 2026</title>
```

**Agent sugerido:** `frontend-fix-html` — Corregir index.html.

---

### BUG-34 [MEDIO] — Estilos inconsistentes (hardcoded vs CSS variables)

**Archivos:** `RegistroNotas.jsx`, `RegistroAsistencia.jsx`, `PrediccionIA.jsx`, `Horarios.jsx`, `Notificaciones.jsx`, `profesor/Dashboard.jsx`

**Problema:** Usan clases Tailwind hardcodeadas (`bg-white`, `text-slate-700`) en vez de CSS variables (`var(--ios-label)`), rompiendo el modo oscuro.

**Solucion:** Reemplazar colores hardcoded con CSS variables del design system.

**Agent sugerido:** `frontend-tema-consistente` — Estandarizar uso de CSS variables.

---

### BUG-35 [BAJO] — Pagina de Prediccion del estudiante

**Archivo:** `frontend/src/pages/estudiante/Prediccion.jsx`

**Problema:** El AGENTS.md dice que el estudiante "No puede ver las predicciones de riesgo". Sin embargo, la pagina existe y funciona.

**Solucion:** Decision de diseno. Si se quiere seguir el spec al pie de la letra, eliminar la ruta y el componente. Si se quiere ser flexible (mostrar su propia prediccion), documentar la decision.

**Agent sugerido:** `frontend-decision-prediccion-estudiante` — Decidir y documentar.

---

## FASE 4: FEATURES FALTANTES

Estas son funcionalidades que el AGENTS.md especifica pero que no estan implementadas.

| # | Feature | Modulo | Estado | Complejidad |
|---|---------|--------|--------|-------------|
| 1 | Recuperacion de contrasena por correo | Modulo 1 | NO IMPLEMENTADO | Media |
| 2 | Exportar boletin como PDF real (no solo window.print) | Modulo 4 | NO IMPLEMENTADO | Alta |
| 3 | Exportar reportes en Excel | Modulo 6 | NO IMPLEMENTADO | Alta |
| 4 | Graficos Recharts en dashboard del Director | Modulo 6 | NO IMPLEMENTADO | Media |
| 5 | Panel de configuracion (limite faltas, umbral aprobacion) | Modulo 8 | NO IMPLEMENTADO | Media |
| 6 | Deteccion de conflictos de horario | Modulo 2 | NO IMPLEMENTADO | Media |
| 7 | CRUD de MateriaProgramada (asignar docente a materia/curso) | Modulo 2 | Parcial | Baja |
| 8 | Reportes por curso/materia/trimestre/gestion | Modulo 8 | NO IMPLEMENTADO | Alta |
| 9 | Endpoint de dashboard para cada rol | Modulo 6 | NO IMPLEMENTADO | Media |

**Agents sugeridos:** Un agent por cada feature, en el orden indicado.

---

## FASE 5: SEGURIDAD

| # | Problema | Severidad | Solucion |
|---|----------|-----------|----------|
| 1 | JWT_SECRET es una frase predecible | ALTO | Generar 64+ caracteres aleatorios |
| 2 | Token hardcodeado en verify_endpoint.js | MEDIO | Eliminar el archivo o el token |
| 3 | Sin rate limiting en login | MEDIO | Instalar `express-rate-limit` |
| 4 | Sin interceptor 401 en frontend | ALTO | Agregar en api.js |
| 5 | Sin helmet (headers de seguridad) | BAJO | Instalar `helmet` |
| 6 | CORS con `origin: '*'` en produccion | MEDIO | Configurar origin especifico |

**Agent sugerido:** `backend-seguridad-general` — Aplicar todas las mejoras de seguridad.

---

## FASE 6: MEJORAS OPCIONALES

| # | Mejora | Beneficio |
|---|--------|-----------|
| 1 | Pruebas unitarias con Jest | Garantizar que los cambios no rompan funcionalidad |
| 2 | Pruebas de integracion | Verificar que backend-frontend-IA funcionan juntos |
| 3 | CI/CD con GitHub Actions | Deploy automatico y control de calidad |
| 4 | Logging estructurado (Winston) | Debugging mas facil en produccion |
| 5 | Paginacion en listados | Mejor rendimiento con muchos datos |
| 6 | Filtros avanzados en reportes | UX mejorada para el Director |
| 7 | Modo offline / cache | Disponibilidad sin conexion |
| 8 | Notificaciones in-app (WebSocket) | Alertas en tiempo real sin recargar |

---

## 9. COMO CREAR AGENTS PARA CADA TAREA

### Que es un "agent"?

Un agent es un asistente especializado que se encarga de UNA tarea especifica. En lugar de intentar arreglar todo de una vez, divides el trabajo en agentes pequeños.

### Como funciona en la practica

Tu le das una tarea al agent (por ejemplo: "corregir el seed.js para crear perfiles de estudiante") y el agent:
1. Lee los archivos relevantes
2. Entiende el contexto
3. Hace los cambios necesarios
4. Verifica que funcione
5. Te reporta que hizo

### Como crear un AGENTS.md paso a paso

El archivo `AGENTS.md` que ya tienes es un "prompt maestro" que describe todo el proyecto. Para crear agents especificos, puedes crear un archivo `AGENTS_TAREAS.md` o simplemente ir tareas por tarea.

### Ejemplo de como deberias proceder

**Paso 1:** Elige UN bug de la Fase 1 (por ejemplo BUG-01: seed sin perfil de estudiante)

**Paso 2:** Me dices: "Arregla el BUG-01 del seed.js"

**Paso 3:** Yo (como agent) hago lo siguiente:
- Leo `seed.js` y `estudiante.controller.js`
- Entiendo que falta crear el registro en la tabla `estudiantes`
- Agrego el codigo necesario al seed.js
- Verifico que el schema de Prisma coincide
- Reporto los cambios

**Paso 4:** Tu verificas que funciona y pasas al siguiente bug.

### Estructura recomendada de AGENTS_TAREAS.md

```markdown
# TAREAS DEL SISTEMA ACADEMICO

## Sprint 1: Fundamentos criticos
- [ ] BUG-01: Corregir seed.js (crear perfil estudiante)
- [ ] BUG-02: Validar trimestre activo en notas
- [ ] BUG-03: Validar rangos de nota (Ser 0-15, Saber 0-35)
- [ ] BUG-23: Corregir prefijo /api en estudiante.service.js
- [ ] BUG-26: Corregir typo "Adminstrativo"

## Sprint 2: Integracion IA
- [ ] BUG-04: Asistencia invoca prediccion IA
- [ ] BUG-05: Notificaciones de EXCESO_FALTAS
- [ ] BUG-06: Alinear payload IA backend-microservicio
- [ ] BUG-17: Reentrenar modelo sin data leakage
- [ ] BUG-18: Agregar variables faltantes al dataset

## Sprint 3: Frontend funcional
- [ ] BUG-24: Completar rutas en App.jsx
- [ ] BUG-25: Unificar formato de horario
- [ ] BUG-27: Dashboard Director con API real
- [ ] BUG-28: Dashboard Profesor con API real
- [ ] BUG-31: Agregar interceptor 401

## Sprint 4: Features y pulido
- [ ] Feature: Panel de configuracion
- [ ] Feature: Exportar PDF de boletin
- [ ] Feature: Graficos Recharts en dashboard
- [ ] BUG-34: Estandarizar estilos con CSS variables
- [ ] BUG-32: Eliminar archivos muertos

## Sprint 5: Seguridad y calidad
- [ ] Seguridad: JWT_SECRET seguro
- [ ] Seguridad: Rate limiting en login
- [ ] Seguridad: Helmet headers
- [ ] Mejora: Pruebas unitarias basicas
```

### Orden recomendado de ejecucion

```
Fase 1 (Backend critico) → 2-3 dias
    |
    v
Fase 2 (Microservicio IA) → 2-3 dias
    |
    v
Fase 3 (Frontend critico) → 2-3 dias
    |
    v
Fase 4 (Features) → 5-7 dias
    |
    v
Fase 5 (Seguridad) → 1 dia
    |
    v
Fase 6 (Mejoras) → 2-3 dias
```

**Total estimado: 15-20 dias de desarrollo**

---

## 10. ORDEN RECOMENDADO DE EJECUCION

### Dia 1-2: Fundamentos del Backend
1. BUG-01: Seed.js (perfil estudiante)
2. BUG-02: Validar trimestre activo
3. BUG-03: Validar rangos de nota
4. BUG-08: Estandarizar calculo de asistencia
5. BUG-09: PrismaClient singleton
6. BUG-10: Seed.js dotenv

### Dia 3-4: Backend — IA y Notificaciones
7. BUG-04: Asistencia invoca IA
8. BUG-05: Notificaciones EXCESO_FALTAS
9. BUG-06: Alinear payload IA
10. BUG-07: Autorizacion de materia

### Dia 5-7: Microservicio IA
11. BUG-17: Crear dataset realista
12. BUG-18: Agregar variables faltantes
13. BUG-19: Actualizar payload en backend
14. BUG-20: Corregir rutas en train_model.py
15. BUG-21: Actualizar requirements.txt
16. BUG-22: Agregar cross-validation

### Dia 8-10: Frontend Critico
17. BUG-23: Corregir estudiante.service.js
18. BUG-24: Completar rutas en App.jsx
19. BUG-25: Unificar formato horario
20. BUG-26: Corregir typo Login
21. BUG-33: Corregir index.html

### Dia 11-14: Frontend — Dashboards
22. BUG-27: Dashboard Director con API
23. BUG-28: Dashboard Profesor con API
24. BUG-29: PrediccionIA con API
25. BUG-30: Notificaciones con API
26. BUG-31: Interceptor 401

### Dia 15-16: Limpieza y Seguridad
27. BUG-32: Eliminar archivos muertos
28. BUG-34: Estandarizar estilos
29. BUG-13: JWT_SECRET seguro
30. BUG-15: Error handler global

### Dia 17-18: Features Faltantes
31. Panel de configuracion
32. Exportar PDF real
33. Graficos Recharts

### Dia 19-20: Pulido Final
34. Pruebas manuales de cada flujo
35. Correccion de bugs residuales
36. Documentacion final

---

*Reporte generado el 20/09/2026 — Mamani Huarca Najhely Annel*
