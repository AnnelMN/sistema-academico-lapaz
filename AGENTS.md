# PROMPT MAESTRO — SISTEMA WEB CON MACHINE LEARNING PARA GESTIÓN ACADÉMICA
## Caso: Unidad Educativa La Paz "A" · La Paz, Bolivia · 2026

---

## ROL QUE DEBES ASUMIR

Eres un desarrollador fullstack senior especializado en arquitecturas web modernas y Machine Learning. Debes construir un sistema web académico completo, funcional, seguro y desplegado en la nube, siguiendo exactamente las especificaciones técnicas, módulos, roles de usuario y reglas de negocio descritos a continuación. No omitas ningún detalle. Cada decisión tecnológica está justificada y no debe cambiarse.

---

## STACK TECNOLÓGICO COMPLETO

### FRONTEND
| Herramienta |  | Función dentro del sistema |
|---|---|---|
| React |  | Framework principal de UI basado en componentes |
| Vite | | Build tool y servidor de desarrollo ultrarrápido |
| Tailwind CSS |  | Framework de estilos utilitarios, diseño responsivo |
| Recharts |  | Gráficos dinámicos para dashboards académicos |
| React Router |  | Navegación entre vistas según rol autenticado |

**Cómo implementarlos:**
```bash
npm create vite@latest sistema-academico -- --template react
cd sistema-academico
npm install
npm install tailwindcss@3.4.1 postcss autoprefixer
npx tailwindcss init -p
npm install react-router-dom@6
npm install recharts@2.12.7
npm install axios
```
Configura `tailwind.config.js` con `content: ["./index.html","./src/**/*.{js,jsx}"]`. Usa `BrowserRouter` en `main.jsx`. Protege cada ruta con un componente `PrivateRoute` que lea el rol del token JWT antes de renderizar la vista.

---

### BACKEND
| Herramienta |  | Función dentro del sistema |
|---|---|---|
| Node.js |  | Entorno de ejecución del servidor |
| Express |  | Framework para definir rutas y middleware de la API REST |
| cors |  | Permite solicitudes del frontend en Vercel hacia Railway |
| JWT |  | Genera y valida tokens de autenticación por rol |
| bcrypt | | Cifra contraseñas antes de guardarlas en la BD |
| Prisma ORM |  | Mapeo objeto-relacional con PostgreSQL vía Supabase |
| Nodemailer |  | Envío de correos automáticos a padres de familia |

**Cómo implementarlos:**
```bash
mkdir backend && cd backend
npm init -y
npm install express cors jsonwebtoken bcryptjs @prisma/client nodemailer
npm install dotenv
npm install --save-dev prisma nodemon
npx prisma init
```
En `prisma/schema.prisma` define las 9 tablas del sistema. Crea `server.js` con `app.use(cors({ origin: process.env.FRONTEND_URL }))`. Organiza las rutas en carpetas: `/routes/auth.routes.js`, `/routes/notas.routes.js`, `/routes/asistencia.routes.js`, `/routes/predicciones.routes.js`, `/routes/usuarios.routes.js`. Crea un middleware `authMiddleware.js` que verifique el JWT en cada solicitud protegida y extraiga el rol del payload.

---

### MICROSERVICIO DE INTELIGENCIA ARTIFICIAL
| Herramienta |  | Función dentro del sistema |
|---|---|---|
| Python |  | Lenguaje base del microservicio IA |
| FastAPI |  | Framework para exponer el modelo como endpoint REST |
| uvicorn |  | Servidor ASGI que ejecuta FastAPI en producción |
| scikit-learn |  | Entrenamiento de Árbol de Decisión y Random Forest |
| pandas |  | Limpieza, transformación y preparación de datos |
| numpy |  | Operaciones numéricas sobre arrays de datos |
| joblib |  | Serializa el modelo entrenado en archivo .pkl |

**Cómo implementarlos:**
```bash
mkdir microservicio-ia && cd microservicio-ia
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi==0.111.0 uvicorn scikit-learn==1.5.1 pandas==2.2.2 numpy==1.26.4 joblib
```
Crea `train_model.py` para entrenar con datos históricos de la institución. Usa CRISP-DM: limpia datos con pandas, divide en 80% entrenamiento / 20% prueba, entrena Árbol de Decisión e ID3 y Random Forest, compara F1-Score de ambos, guarda el mejor con `joblib.dump(modelo, "modelo_riesgo.pkl")`. En `main.py` crea el endpoint `POST /predecir` con FastAPI que carga el modelo con `joblib.load()` y devuelve `{"nivel_riesgo": "Riesgo Alto", "probabilidad": 0.87}`. Ejecuta con `uvicorn main:app --host 0.0.0.0 --port 8000`.

---

### BASE DE DATOS
| Herramienta |  | Función dentro del sistema |
|---|---|---|
| PostgreSQL |  | Motor de base de datos relacional con propiedades ACID |
| Supabase |  | BaaS: PostgreSQL en la nube + autenticación + RLS |
| pgAdmin |  | Interfaz visual local para administrar la BD durante el desarrollo |

**Cómo implementarlos:**
1. Crea un proyecto nuevo en supabase.com. Copia la cadena de conexión (`DATABASE_URL`) al archivo `.env` del backend.
2. En `prisma/schema.prisma` define el `provider = "postgresql"` y la `url = env("DATABASE_URL")`.
3. Ejecuta `npx prisma migrate dev --name init` para crear las tablas en Supabase.
4. En el panel de Supabase, activa Row Level Security (RLS) en todas las tablas y crea políticas que restrinjan el acceso según el campo `rol` del usuario autenticado.
5. Usa pgAdmin localmente apuntando a la misma `DATABASE_URL` para inspeccionar los datos durante el desarrollo.

---

### NUBE — DESPLIEGUE
| Plataforma | Qué aloja | Por qué |
|---|---|---|
| Vercel | Frontend (React + Vite) | Deploy automático desde GitHub, CDN global, HTTPS gratis |
| Railway | Backend (Node.js + Express) | Soporta variables de entorno, conecta directo con Supabase |
| Render | Microservicio IA (FastAPI) | Soporta Python, plan gratuito funcional para el volumen del proyecto |
| Supabase | Base de datos (PostgreSQL) | PostgreSQL en la nube sin servidor propio, RLS integrado |

**Cómo implementarlos:**
- **Vercel:** Conecta el repositorio GitHub del frontend en vercel.com. Agrega la variable de entorno `VITE_API_URL=https://tu-backend.railway.app`. Deploy automático en cada `git push`.
- **Railway:** Conecta el repositorio GitHub del backend en railway.app. Agrega todas las variables de entorno: `DATABASE_URL`, `JWT_SECRET`, `EMAIL_USER`, `EMAIL_PASS`, `IA_SERVICE_URL`. Railway detecta Node.js y hace el deploy automáticamente.
- **Render:** Conecta el repositorio GitHub del microservicio en render.com. Configura el Build Command: `pip install -r requirements.txt` y el Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **Supabase:** El proyecto ya está en la nube desde que lo creaste. Copia la `DATABASE_URL` y úsala en Railway como variable de entorno.

---

## ESQUEMA COMPLETO DE LA BASE DE DATOS (9 TABLAS)

```prisma
model Usuario {
  id          String   @id @default(uuid())
  nombre      String
  email       String   @unique
  password    String
  rol         Rol      // DIRECTOR | PROFESOR | ADMINISTRATIVO | ESTUDIANTE
  creadoEn    DateTime @default(now())
  estudiante  Estudiante?
  docente     Docente?
}

enum Rol {
  DIRECTOR
  PROFESOR
  ADMINISTRATIVO
  ESTUDIANTE
}

model Estudiante {
  id            String   @id @default(uuid())
  usuarioId     String   @unique
  usuario       Usuario  @relation(fields: [usuarioId], references: [id])
  cursoId       String
  curso         Curso    @relation(fields: [cursoId], references: [id])
  gestion       Int
  emailTutor    String
  notas         Nota[]
  asistencias   Asistencia[]
  predicciones  PrediccionRiesgo[]
  notificaciones Notificacion[]
}

model Docente {
  id          String   @id @default(uuid())
  usuarioId   String   @unique
  usuario     Usuario  @relation(fields: [usuarioId], references: [id])
  especialidad String
  materias    MateriaProgramada[]
}

model Curso {
  id         String   @id @default(uuid())
  nivel      Int      // 1 a 6 (secundaria)
  paralelo   String   // A, B, C
  estudiantes Estudiante[]
  horarios   MateriaProgramada[]
}

model Materia {
  id              String   @id @default(uuid())
  nombre          String
  cargaHoraria    Int
  nivel           Int
  programaciones  MateriaProgramada[]
}

model MateriaProgramada {
  id        String   @id @default(uuid())
  materiaId String
  materia   Materia  @relation(fields: [materiaId], references: [id])
  docenteId String
  docente   Docente  @relation(fields: [docenteId], references: [id])
  cursoId   String
  curso     Curso    @relation(fields: [cursoId], references: [id])
  horario   String
  notas     Nota[]
  asistencias Asistencia[]
}

model Nota {
  id                   String   @id @default(uuid())
  estudianteId         String
  estudiante           Estudiante @relation(fields: [estudianteId], references: [id])
  materiaProgramadaId  String
  materiaProgramada    MateriaProgramada @relation(fields: [materiaProgramadaId], references: [id])
  trimestre            Int      // 1, 2 o 3
  ser                  Float    // 0–15
  saber                Float    // 0–35
  hacer                Float    // variable según materia
  total                Float    // calculado automáticamente
  creadoEn             DateTime @default(now())
}

model Asistencia {
  id                   String   @id @default(uuid())
  estudianteId         String
  estudiante           Estudiante @relation(fields: [estudianteId], references: [id])
  materiaProgramadaId  String
  materiaProgramada    MateriaProgramada @relation(fields: [materiaProgramadaId], references: [id])
  fecha                DateTime
  estado               EstadoAsistencia // PRESENTE | AUSENTE | JUSTIFICADO
}

enum EstadoAsistencia {
  PRESENTE
  AUSENTE
  JUSTIFICADO
}

model PrediccionRiesgo {
  id           String   @id @default(uuid())
  estudianteId String
  estudiante   Estudiante @relation(fields: [estudianteId], references: [id])
  nivelRiesgo  NivelRiesgo // SIN_RIESGO | RIESGO_MEDIO | RIESGO_ALTO
  probabilidad Float
  generadoEn   DateTime @default(now())
}

enum NivelRiesgo {
  SIN_RIESGO
  RIESGO_MEDIO
  RIESGO_ALTO
}

model Notificacion {
  id           String   @id @default(uuid())
  estudianteId String
  estudiante   Estudiante @relation(fields: [estudianteId], references: [id])
  tipo         TipoNotificacion // RIESGO_ALTO | EXCESO_FALTAS
  emailDestino String
  estadoEnvio  String
  enviadoEn    DateTime @default(now())
}

enum TipoNotificacion {
  RIESGO_ALTO
  EXCESO_FALTAS
}
```

---

## MÓDULOS DEL SISTEMA (8 MÓDULOS)
Cuando empieces el Sprint 1 con Antigravity, incluye en la tarea que genere el seed inicial con un usuario Director por defecto para poder entrar al sistema la primera vez. 
Por ejemplo:
Email:    director@lapaz.edu.bo
Password: Director2026!
Rol:      DIRECTOR

### Módulo 1 — Autenticación y Gestión de Usuarios
- Login con email y contraseña cifrada con bcrypt
- Generación de token JWT con payload `{ id, rol, email }`
- Redirección automática al dashboard correspondiente según rol
- CRUD de usuarios: registrar, editar, desactivar (solo Director)
- Recuperación de contraseña por correo electrónico

### Módulo 2 — Gestión de Materias y Horarios
- Registro de materias por nivel educativo (1ro a 6to de secundaria)
- Asignación de docentes a materias por curso
- Configuración del horario semanal con detección de conflictos
- Consulta del horario personal (disponible para el rol Estudiante)

### Módulo 3 — Control de Asistencia
- Registro diario de asistencia por materia y curso (estados: Presente / Ausente / Justificado)
- Cálculo automático del porcentaje de asistencia acumulado
- Alerta automática al docente cuando un estudiante supera el límite de faltas
- Historial de asistencia consultable por el estudiante

### Módulo 4 — Registro y Reporte de Notas
- Registro de notas por trimestre usando escala boliviana: Ser (0–15) + Saber (0–35) + Hacer (variable) = total sobre 100
- El sistema aprueba con 51 puntos o más
- Cálculo automático de promedios trimestrales y promedio anual
- Indicador visual de aprobado / reprobado en tiempo real
- Exportación del boletín individual en formato PDF

### Módulo 5 — Predicción de Rendimiento con IA (núcleo del sistema)
- El backend invoca el microservicio FastAPI cada vez que se registra una nota o asistencia
- FastAPI carga el modelo Random Forest serializado y clasifica al estudiante en: Sin Riesgo / Riesgo Medio / Riesgo Alto
- La predicción se almacena en la tabla `PrediccionRiesgo` con su probabilidad
- Si el nivel es Riesgo Alto se activa automáticamente el módulo de notificaciones
- Variables del modelo: promedio de notas del trimestre, porcentaje de asistencia, nivel educativo, trimestre actual

### Módulo 6 — Dashboard e Indicadores por Rol
- Dashboard del Director: indicadores globales, gráficos de evolución trimestral (Recharts), lista de estudiantes en Riesgo Alto, exportación a PDF y Excel
- Dashboard del Docente: lista de sus cursos con nivel de riesgo por estudiante, alertas de asistencia
- Dashboard del Estudiante: mis notas, mi porcentaje de asistencia, mi horario
- Dashboard del Administrativo: configuración de materias, horarios y usuarios

### Módulo 7 — Notificaciones Automáticas a Padres de Familia
- Nodemailer envía correo automático al emailTutor del estudiante cuando:
  - El sistema clasifica al estudiante como Riesgo Alto
  - El estudiante supera el límite de inasistencias configurado por el Director
- El correo incluye: nombre del estudiante, materia, promedio actual, porcentaje de asistencia y recomendación pedagógica
- Historial de notificaciones enviadas con fecha, tipo y destinatario
- Los padres NO tienen cuenta en el sistema; solo reciben correos

### Módulo 8 — Administración y Configuración
- Gestión de la configuración institucional: límite de faltas permitidas, umbral de nota mínima de aprobación
- Panel de gestión de sprints (visible solo para el Director)
- Reportes consolidados exportables por curso, materia, trimestre o gestión escolar

---

## ROLES Y PERMISOS (4 ROLES)

### ROL 1 — Director
**Acceso:** Total a todos los módulos del sistema.
**Puede hacer:**
- Registrar, editar y desactivar cualquier usuario del sistema
- Ver el dashboard institucional con todos los indicadores y predicciones
- Consultar predicciones de todos los cursos
- Exportar reportes en PDF y Excel filtrados por curso, materia, trimestre o gestión
- Configurar el límite de faltas y el umbral de aprobación
- Ver el historial completo de notificaciones enviadas a padres

### ROL 2 — Profesor
**Acceso:** Solo a sus cursos y materias asignadas.
**Puede hacer:**
- Registrar asistencia diaria de sus estudiantes (Presente / Ausente / Justificado)
- Registrar y editar notas de sus materias asignadas en el trimestre activo
- Ver el nivel de riesgo predicho para sus alumnos
- Recibir alertas cuando un estudiante supera el límite de faltas
- Consultar el porcentaje de asistencia acumulado de sus estudiantes

### ROL 3 — Administrativo
**Acceso:** Módulos de configuración estructural de la institución.
**Puede hacer:**
- Registrar y gestionar materias, cursos y horarios
- Asignar docentes a materias y cursos
- Detectar y resolver conflictos de horario
- No puede ver notas individuales ni predicciones de riesgo

### ROL 4 — Estudiante
**Acceso:** Solo lectura de su propia información académica.
**Puede hacer:**
- Consultar sus notas actuales por materia y trimestre
- Ver su porcentaje de asistencia en cada materia
- Consultar su horario semanal
- No puede ver las predicciones de riesgo ni información de otros estudiantes

### SIN ROL — Padre de Familia
**Sin cuenta en el sistema.**
- Recibe únicamente correos automáticos enviados por Nodemailer cuando su hijo/a entra en Riesgo Alto o supera el límite de faltas
- El correo del tutor se registra en el campo `emailTutor` del perfil del Estudiante

---

## REGLAS DE NEGOCIO CRÍTICAS

1. **Escala de calificación boliviana:** Ser (0–15) + Saber (0–35) + Hacer (variable) = total sobre 100 puntos. Aprobado con 51 o más puntos.
2. **Trimestres:** El sistema divide el año escolar en 3 trimestres. Solo se puede registrar notas en el trimestre activo.
3. **Unicidad de asistencia:** No puede existir más de un registro de asistencia para el mismo estudiante, materia y fecha.
4. **Categorías de riesgo:** El modelo clasifica en exactamente tres categorías: Sin Riesgo / Riesgo Medio / Riesgo Alto. Ningún otro valor es aceptado.
5. **Actualización automática de predicción:** Cada vez que se registra una nota o una asistencia, el backend llama automáticamente a FastAPI para recalcular la predicción del estudiante afectado.
6. **Notificación automática:** Si la nueva predicción es Riesgo Alto, Nodemailer envía el correo sin intervención humana.
7. **Supervisión humana permanente:** Las predicciones son alertas orientativas. La decisión pedagógica final siempre recae en el docente o director.
8. **Acceso a padres:** Los padres no tienen cuenta. Nunca se crea un usuario con rol de padre. Solo reciben correos.
9. **Seguridad RLS:** Cada docente solo ve datos de sus cursos asignados. El director tiene acceso global.

---

## ESTRUCTURA DE CARPETAS DEL PROYECTO

```
sistema-academico/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/          # Componentes reutilizables
│   │   ├── pages/               # Vistas por módulo
│   │   │   ├── Login.jsx
│   │   │   ├── director/
│   │   │   ├── profesor/
│   │   │   ├── administrativo/
│   │   │   └── estudiante/
│   │   ├── routes/              # PrivateRoute por rol
│   │   ├── services/            # Llamadas axios a la API
│   │   └── App.jsx
│   ├── .env                     # VITE_API_URL
│   └── vite.config.js
│
├── backend/                     # Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma        # 9 tablas del sistema
│   ├── src/
│   │   ├── routes/              # auth, notas, asistencia, predicciones, usuarios
│   │   ├── middleware/          # authMiddleware.js (JWT)
│   │   ├── services/            # iaService.js (llama a FastAPI), emailService.js (Nodemailer)
│   │   └── server.js
│   └── .env                     # DATABASE_URL, JWT_SECRET, IA_SERVICE_URL, EMAIL_USER, EMAIL_PASS
│
└── microservicio-ia/            # Python + FastAPI
    ├── data/                    # Datos históricos de la institución
    ├── model/
    │   └── modelo_riesgo.pkl    # Modelo serializado con joblib
    ├── train_model.py           # Script CRISP-DM de entrenamiento
    ├── main.py                  # Endpoint POST /predecir
    ├── requirements.txt
    └── .env
```

---

## VARIABLES DE ENTORNO NECESARIAS

```env
# Backend (.env)
DATABASE_URL=postgresql://usuario:password@host:5432/nombre_bd
JWT_SECRET=tu_clave_secreta_muy_larga
JWT_EXPIRES_IN=8h
IA_SERVICE_URL=https://tu-microservicio.onrender.com
EMAIL_USER=tu_correo@gmail.com
EMAIL_PASS=tu_app_password_gmail
FRONTEND_URL=https://tu-frontend.vercel.app

# Frontend (.env)
VITE_API_URL=https://tu-backend.railway.app

# Microservicio IA (.env)
MODEL_PATH=./model/modelo_riesgo.pkl
```

---

## FLUJO COMPLETO DE LA OPERACIÓN MÁS CRÍTICA

**Registro de nota → predicción automática → notificación al padre:**

```
Docente ingresa nota en React
    → axios.post('/api/notas', { estudianteId, materiaId, trimestre, ser, saber, hacer })
    → authMiddleware valida JWT y confirma rol PROFESOR
    → Prisma guarda la nota en PostgreSQL (Supabase)
    → Prisma calcula total = ser + saber + hacer
    → Backend recupera promedio trimestral + % asistencia del estudiante
    → iaService.js envía POST al microservicio FastAPI:
        { promedio_notas: 38.5, porcentaje_asistencia: 72.0, nivel: 3, trimestre: 2 }
    → FastAPI carga modelo_riesgo.pkl con joblib
    → Random Forest clasifica: { nivel_riesgo: "RIESGO_ALTO", probabilidad: 0.87 }
    → Backend actualiza tabla PrediccionRiesgo en Supabase
    → Si nivel_riesgo === "RIESGO_ALTO":
        → emailService.js invoca Nodemailer
        → Correo enviado a emailTutor del estudiante
        → Registro guardado en tabla Notificacion
    → Backend devuelve respuesta al frontend con nivel de riesgo actualizado
    → React actualiza la pantalla del docente en tiempo real
```

**Tiempo total del ciclo: menos de 5 segundos.**

---

## CRITERIOS DE EVALUACIÓN DEL MODELO IA (CRISP-DM)

- Divide los datos históricos en 80% entrenamiento / 20% prueba
- Entrena Árbol de Decisión ID3 Y Random Forest con los mismos datos
- Evalúa ambos con F1-Score (métrica principal), Precisión y Recall
- Selecciona el modelo con mayor F1-Score para producción
- Serializa el modelo ganador con joblib en `modelo_riesgo.pkl`
- Variables de entrada del modelo: promedio de notas, porcentaje de asistencia, nivel educativo (1-6), trimestre (1-3)
- Variable de salida: etiqueta de riesgo (Sin Riesgo / Riesgo Medio / Riesgo Alto)

---

*Postulante: Mamani Huarca Najhely Annel · Universidad Salesiana de Bolivia · 2026*


## USUARIO INICIAL DEL SISTEMA (SEED)
Al inicializar el sistema por primera vez, crear automáticamente 
este usuario en la base de datos:

Email:    director@lapaz.edu.bo
Password: Director2026!
Rol:      DIRECTOR
Nombre:   Director General

Este usuario permite el primer acceso al sistema para que el 
Director real pueda crear los demás usuarios desde adentro.