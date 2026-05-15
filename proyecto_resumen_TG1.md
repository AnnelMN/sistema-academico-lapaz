# Sistema Web con Machine Learning para Gestión Académica y Análisis Predictivo del Rendimiento Estudiantil
**Caso: Unidad Educativa La Paz "A"**

> **Postulante:** Mamani Huarca Najhely Annel  
> **Docente Guía:** Ing. Lazcano Balanza Juan Gabriel  
> **Universidad Salesiana de Bolivia — Ingeniería de Sistemas | 2026**

---

## 1. ¿Qué es este proyecto?

Este proyecto de grado desarrolla un **sistema web inteligente** que moderniza la gestión académica de la Unidad Educativa La Paz "A", una institución pública de educación secundaria ubicada en la Calle Campero N° 51, en el centro de La Paz, Bolivia.

El sistema combina dos grandes capacidades:

1. **Gestión académica digital** — reemplaza el registro manual de notas, asistencias y horarios por una plataforma web centralizada, accesible desde cualquier navegador.
2. **Análisis predictivo con Machine Learning** — usa algoritmos de inteligencia artificial para identificar, antes de que termine el trimestre, qué estudiantes están en riesgo de reprobar.

---

## 2. ¿Por qué existe este proyecto?

### El problema real

La Unidad Educativa La Paz "A" atiende a **1,080 estudiantes** distribuidos en los seis niveles de educación secundaria, con una planta de **52 docentes**. A pesar de su trayectoria de 77 años, la institución opera con procesos completamente manuales:

| Proceso actual | Problema que genera |
|---|---|
| Registro de notas en cuadernos físicos | Inconsistencias, duplicidad, pérdida de datos |
| Control de asistencia por lista oral | Pérdida de minutos lectivos, errores de registro |
| Sin acceso del estudiante a sus calificaciones | El alumno solo conoce su situación al final del trimestre |
| Sin comunicación automática con padres | Acompañamiento familiar débil ante el riesgo de reprobación |
| Sin herramientas predictivas | La institución solo detecta el fracaso escolar cuando ya ocurrió |

### La evidencia del diagnóstico

Una encuesta aplicada a 17 estudiantes de distintos niveles reveló:

- **94.1%** no tiene acceso oportuno a sus notas durante el trimestre
- **70.6%** ha dejado de recoger su boletín de calificaciones en alguna ocasión
- **64.7%** no lleva ningún registro de sus inasistencias
- **53%** ha reprobado una materia sin haber identificado previamente que estaba en riesgo
- **94.1%** afirmó que, con información oportuna, tomaría medidas correctivas

---

## 3. Objetivo del proyecto

> **Implementar un Sistema Web con Machine Learning para gestión académica y análisis predictivo del rendimiento académico, aplicado como caso de estudio en la Unidad Educativa La Paz "A".**

### Objetivos específicos

1. Analizar la situación actual de la gestión académica y administrativa de la institución.
2. Diseñar una arquitectura web moderna que conecte el panel docente con el motor de IA.
3. Desarrollar el sistema integral y el modelo predictivo usando Árbol de Decisión y Random Forest bajo la metodología CRISP-DM.
4. Evaluar la precisión del modelo predictivo y el funcionamiento de la plataforma web.

---

## 4. ¿Qué hace el sistema? — Módulos funcionales

El sistema está compuesto por **7 módulos funcionales** y gestiona **4 roles de usuario**.

### 4.1 Módulo de Usuarios y Roles

Gestiona el acceso seguro al sistema mediante autenticación JWT y cifrado bcrypt. Cada usuario accede exclusivamente a las funcionalidades correspondientes a su rol.

| Rol | Descripción |
|---|---|
| **Director** | Supervisión institucional, dashboard general, predicciones, reportes |
| **Profesor** | Registro de asistencia y notas de sus materias asignadas |
| **Administrativo** | Configuración de materias, horarios y estructura académica |
| **Estudiante** | Consulta de sus propias notas, asistencias y horario |

> Los **padres de familia** no tienen cuenta en el sistema, pero reciben notificaciones automáticas por correo electrónico.

### 4.2 Módulo de Gestión de Materias y Horarios

Permite programar el horario semanal por curso, asignar docentes a materias por nivel educativo (1° a 6° de secundaria) y detectar automáticamente conflictos de horario. Los estudiantes pueden consultar su horario semanal desde su portal.

### 4.3 Módulo de Control de Asistencia

Los docentes registran diariamente la asistencia de cada estudiante por materia. El sistema:

- Registra tres estados: **Presente**, **Ausente** o **Justificado**
- Calcula automáticamente el porcentaje de asistencia acumulado
- Genera alertas cuando un estudiante supera el límite de faltas permitido
- Desencadena notificaciones automáticas al padre o tutor

### 4.4 Módulo de Registro y Reporte de Notas

Los docentes registran calificaciones usando la **escala de evaluación boliviana**:

```
Ser (0–15 pts.) + Saber (0–35 pts.) + Hacer (variable) = Total (0–100 pts.)
Aprobación: 51 puntos o más
```

El sistema calcula automáticamente el promedio trimestral y anual, indica en tiempo real si el estudiante aprueba o reprueba, y permite exportar reportes en formato PDF.

### 4.5 Módulo de Predicción de Rendimiento con IA *(núcleo del proyecto)*

Este es el componente más innovador del sistema. Usando Machine Learning bajo la metodología CRISP-DM, clasifica a cada estudiante en una de tres categorías de riesgo:

| Categoría | Descripción |
|---|---|
| 🟢 **Sin Riesgo** | El estudiante tiene bajo riesgo de reprobar |
| 🟡 **Riesgo Medio** | El estudiante muestra señales de alerta |
| 🔴 **Riesgo Alto** | El estudiante tiene alta probabilidad de reprobación |

Las predicciones se actualizan automáticamente cada vez que el docente registra nuevas notas o asistencias.

### 4.6 Módulo de Dashboard y Reportes

El Director dispone de un panel de control con:

- Indicadores clave de rendimiento institucional
- Gráficos de evolución por trimestre (barras, líneas y circulares)
- Lista de estudiantes actualmente en riesgo alto
- Exportación de reportes en PDF o Excel, filtrados por curso, materia o trimestre

### 4.7 Módulo de Notificaciones a Padres de Familia

Cuando el sistema detecta que un estudiante entra en categoría de riesgo alto o supera el límite de inasistencias, envía automáticamente un correo electrónico al padre o tutor registrado. Cada evento queda registrado en el historial de notificaciones.

---

## 5. Arquitectura tecnológica del sistema

El sistema adopta una **arquitectura de tres capas Cliente-Servidor**, complementada con un microservicio independiente para la inteligencia artificial.

```
┌─────────────────────────────────────────────────────┐
│              FRONTEND (React + Vite)                │
│         Desplegado en Vercel                        │
│  Interfaces para Director, Profesor, Estudiante,    │
│  Administrativo — Tailwind CSS + Recharts           │
└────────────────────┬────────────────────────────────┘
                     │ HTTP REST (JSON)
┌────────────────────▼────────────────────────────────┐
│              BACKEND (Node.js + Express)            │
│         Desplegado en Railway                       │
│  Autenticación JWT · Reglas de negocio              │
│  Prisma ORM · Notificaciones (Nodemailer)           │
└───────────┬─────────────────────┬───────────────────┘
            │ Prisma ORM          │ HTTP REST
┌───────────▼──────────┐  ┌──────▼──────────────────┐
│  BASE DE DATOS       │  │  MICROSERVICIO IA        │
│  PostgreSQL          │  │  (Python + FastAPI)      │
│  Supabase (nube)     │  │  Desplegado en Render    │
│  RLS por roles       │  │  Random Forest + ID3     │
└──────────────────────┘  │  scikit-learn            │
                          └──────────────────────────┘
```

### Stack tecnológico completo

| Capa | Tecnología | Versión | Función |
|---|---|---|---|
| Frontend | React | v18.3.1 | Construcción de interfaces |
| Frontend | Vite | v5.4.0 | Herramienta de compilación |
| Frontend | Tailwind CSS | v3.4.1 | Diseño responsivo |
| Frontend | Recharts | v2.12.7 | Gráficos del dashboard |
| Backend | Node.js | v20.15.0 LTS | Entorno de ejecución |
| Backend | Express | v4.19.2 | Framework de API REST |
| Backend | Prisma ORM | v5.17.0 | Acceso a base de datos |
| Backend | JWT | v9.0.2 | Autenticación |
| Backend | bcrypt | v5.1.1 | Cifrado de contraseñas |
| IA | Python | v3.11.9 | Lenguaje del microservicio |
| IA | FastAPI | — | Framework de API para ML |
| IA | scikit-learn | — | Algoritmos de ML |
| IA | Pandas | — | Procesamiento de datos |
| Base de datos | PostgreSQL | v16.3 | Motor relacional |
| Base de datos | Supabase | — | BaaS en la nube |
| Editor | VS Code | v1.91.0 | Desarrollo |
| Control versiones | GitHub | — | Repositorio remoto |
| Pruebas API | Postman | v11.0 | Validación de endpoints |
| Admin BD | pgAdmin | v8.9 | Gestión visual |

### Despliegue en la nube (costo operativo: $0)

| Plataforma | Componente | Plan |
|---|---|---|
| Vercel | Frontend React | Gratuito |
| Railway | Backend Node.js | Gratuito |
| Render | Microservicio FastAPI | Gratuito |
| Supabase | Base de datos PostgreSQL | Gratuito |

---

## 6. El componente de Machine Learning — ¿Cómo funciona?

El módulo predictivo sigue la metodología **CRISP-DM** (Cross-Industry Standard Process for Data Mining), compuesta por seis fases iterativas:

### Fase I — Comprensión del Negocio
Definición del objetivo institucional: identificar anticipadamente a los estudiantes en riesgo de reprobación para permitir intervención pedagógica oportuna.

### Fase II — Comprensión de los Datos
Recopilación y exploración de los registros históricos de los 1,080 estudiantes: formatos, número de registros, campos disponibles, valores nulos e inconsistencias.

### Fase III — Preparación de los Datos
Limpieza e imputación de valores erróneos, integración de múltiples fuentes (notas y asistencias) y construcción de nuevos atributos como el promedio de asistencia mensual.

### Fase IV — Modelado
Se comparan dos algoritmos de aprendizaje supervisado:

| Algoritmo | Descripción |
|---|---|
| **Árbol de Decisión (ID3)** | Clasifica mediante reglas jerárquicas basadas en ganancia de información y entropía. Genera estructuras interpretables. |
| **Random Forest** | Ensambla múltiples árboles entrenados sobre muestras aleatorias del dataset. Reduce la varianza y mejora la precisión. |

El modelo seleccionado será el que obtenga el mejor **F1-Score** en la fase de evaluación.

### Fase V — Evaluación
Análisis integral del modelo considerando precisión, recall y F1-Score. Verificación de que las predicciones sean coherentes con las variables académicas reales de la institución.

### Fase VI — Despliegue
El modelo entrenado se expone como un endpoint REST en el microservicio FastAPI. El backend Node.js lo invoca automáticamente cada vez que se registra una nota o asistencia, y devuelve en milisegundos la clasificación de riesgo del estudiante.

---

## 7. Modelado del sistema (UML)

El sistema fue documentado con cuatro tipos de artefactos UML:

### Actores identificados

| Actor | Tipo | Rol en el sistema |
|---|---|---|
| Director | Primario | Supervisión y toma de decisiones |
| Profesor | Primario | Registro de notas y asistencia |
| Administrativo | Primario | Configuración de la estructura académica |
| Estudiante | Primario | Consulta de su información personal |
| Sistema | Secundario | Procesos automáticos de predicción y notificación |

### Casos de uso críticos

**CU-01 — Registrar Asistencia:** el docente selecciona materia y fecha, marca el estado de cada estudiante (Presente/Ausente/Justificado), y el sistema actualiza el porcentaje acumulado y genera alertas si corresponde.

**CU-02 — Registrar Notas:** el docente ingresa calificaciones por trimestre; el sistema calcula el promedio e invoca al microservicio de ML para actualizar la predicción de riesgo.

**CU-03 — Consultar Predicción de Riesgo:** el Director o Profesor visualiza la clasificación de riesgo de cada estudiante junto con las variables académicas que más influyeron en la predicción.

**CU-04 — Enviar Notificación:** proceso automático que se activa cuando un estudiante alcanza riesgo alto, enviando correo al tutor registrado y guardando el evento en el historial.

### Entidades principales del modelo de clases

```
Usuario (base)
    ├── Estudiante → Nota (1:N) · Asistencia (1:N) · PrediccionRiesgo (1:N)
    └── Docente   → MateriaProgramada (1:N)

Materia → MateriaProgramada (1:N)
Curso   → Estudiante (1:N)
PrediccionRiesgo → {Sin Riesgo | Riesgo Medio | Riesgo Alto}
Notificacion → {Riesgo Académico | Exceso de Faltas}
```

### Restricciones de integridad (OCL)

- El valor de una nota siempre está entre 0 y 100 puntos.
- No puede existir más de un registro de asistencia para el mismo estudiante, materia y fecha.
- El nivel de riesgo solo puede ser: Sin Riesgo, Riesgo Medio o Riesgo Alto.
- La probabilidad del modelo siempre es un valor entre 0 y 1.
- El número de trimestre solo puede ser 1, 2 o 3.
- La suma de probabilidades de todas las categorías para una predicción es igual a 1.

---

## 8. Metodología de desarrollo — Scrum

El sistema se construye mediante **sprints de 2 semanas**, organizados en 8 iteraciones:

| Sprint | Módulo | Contenido |
|---|---|---|
| 1 | Autenticación y usuarios | Login, roles, JWT, bcrypt, esquema de BD |
| 2 | Control de asistencia | Registro diario, cálculo de porcentajes, alertas |
| 3 | Registro de notas | Escala boliviana, promedios, exportación PDF |
| 4 | Dashboards y reportes | 4 vistas por rol, gráficos Recharts, exportación |
| 5 | Módulo de IA (3 semanas) | CRISP-DM completo, entrenamiento, FastAPI, integración |
| 6 | Notificaciones | Nodemailer, historial, configuración de umbrales |
| 7 | Pruebas y despliegue | QA, ajustes finales, cloud |
| 8 | Cierre | Documentación final, entrega |

### Estimación de esfuerzo

| Story Points | Complejidad | Ejemplo |
|---|---|---|
| 1–2 | Baja | Ajustes de interfaz, correcciones de texto |
| 3–5 | Media | Registro de materias, gestión de estudiantes |
| 8 | Alta | Configuración de autenticación y roles |
| 13 | Muy Alta | Limpieza de datos históricos, entrenamiento del modelo |

**Total estimado: 153 Story Points = 612 horas de desarrollo**

---

## 9. Marco legal y normativo

El sistema opera dentro de un marco jurídico y técnico completamente legítimo:

| Norma | Aplicación en el proyecto |
|---|---|
| **Ley N° 070** (Avelino Siñani) | Respalda la digitalización de procesos académicos y el uso de TIC en educación |
| **Ley N° 164** (Telecomunicaciones y TIC) | Rige el tratamiento de datos personales; el sistema usa JWT y bcrypt |
| **Ley N° 548** (Código Niña, Niño y Adolescente) | Los datos de menores se usan exclusivamente con fines pedagógicos |
| **ISO/IEC 25010** | Estándar de calidad del producto software (funcionalidad, usabilidad, seguridad) |
| **ISO/IEC 27002** | Controles de seguridad de la información |
| **ISO/IEC 12207** | Ciclo de vida del software — alineado con la práctica Scrum |

---

## 10. Evaluación económica

### Costo hipotético de desarrollo (si fuera contratado externamente)

| Perfil | Horas | Tarifa (Bs/hr) | Subtotal |
|---|---|---|---|
| Desarrollador fullstack | ~398 hrs | 50 Bs | 19,900 Bs |
| Diseñador UI | ~122 hrs | 40 Bs | 4,880 Bs |
| Especialista en ML/Python | ~92 hrs | 70 Bs | 6,440 Bs |
| **Total** | **612 hrs** | — | **31,220 Bs** |

> Este valor representa el **aporte económico real** del proyecto a la institución, que accede a esta solución sin costo de desarrollo.

### Costo operativo mensual para la institución: **Bs 0**

Gracias al uso exclusivo de tecnologías de código abierto y planes gratuitos de Vercel, Railway, Render y Supabase.

---

## 11. Contexto institucional

**Unidad Educativa La Paz "A"**

- Fundada el 13 de febrero de 1948 por la Prof. Alicia Pizarro del Castillo
- Ubicada en Calle Campero N° 51, centro de La Paz, Bolivia
- Turno matutino (La Paz "A") y vespertino (La Paz "B") bajo una misma dirección
- En 2025 celebró 77 años de servicio continuo
- Actualmente: **1,080 estudiantes** y **52 docentes** en educación secundaria (1° a 6°)

---

## 12. Estado actual del proyecto

El documento de perfil de tesis (TG1) incluye completamente:

- ✅ **Capítulo I — Generalidades:** Introducción, antecedentes, justificaciones (técnica, social, económica y legal), descripción y formulación del problema, objetivos, alcances, límites y aportes.
- ✅ **Capítulo II — Marco Institucional:** Historia, organigrama, servicios, visión y misión de la Unidad Educativa.
- ✅ **Capítulo III — Marco Teórico:** Marco histórico, conceptual, tecnológico, metodológico, de arquitectura, calidad, evaluación financiera y legal.
- ✅ **Capítulo IV — Marco Metodológico:** Delimitación temporal y espacial, materiales (hardware y software), metodología de investigación, sprints de desarrollo, estimación de costos.
- ✅ **Capítulo V — Marco Aplicativo:** Requerimientos funcionales y no funcionales, casos de uso, diagramas UML (actividades, casos de uso, componentes, secuencias, clases), modelo físico de BD, diseño navegacional e interfaces de usuario para todos los módulos.

---

*Documento generado como resumen técnico del Proyecto de Grado TG1 — Universidad Salesiana de Bolivia, 2026.*
