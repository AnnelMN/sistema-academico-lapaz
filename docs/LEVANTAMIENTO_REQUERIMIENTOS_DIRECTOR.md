# Solicitud Institucional del Sistema Académico — Dirección General
## Unidad Educativa La Paz "A" · Calle Campero N° 51, La Paz – Bolivia · 2026

> **De:** Director General, Unidad Educativa La Paz "A"
> **Para:** Univ. Mamani Huarca Najhely Annel — Universidad Salesiana de Bolivia, Ingeniería de Sistemas
> **Asunto:** Levantamiento de requerimientos del Sistema Web con Machine Learning para Gestión Académica y Análisis Predictivo

---

## 1. Quién soy y por qué le escribo

Soy el Director de la Unidad Educativa La Paz "A", turno mañana. Dirijo una institución con 77 años de servicio, **1.080 estudiantes de 1ro a 6to de secundaria y 52 docentes**.

Hoy trabajamos con cuadernos, listas orales y boletines en papel. Eso nos genera pérdida de datos, retrasos en notas, padres que se enteran tarde cuando su hijo ya reprobó y ninguna forma de anticiparnos al fracaso escolar.

Le encargo a usted el desarrollo de un **sistema web institucional** que digitalice nuestra gestión y nos alerte a tiempo qué estudiantes están en riesgo. Este documento es mi pedido oficial: así debe ser el sistema.

---

## 2. Qué problema quiero resolver

1. Quiero ver las notas sin pedir cuadernos a cada profesor.
2. Quiero saber cuántas faltas tiene cada estudiante sin revisar listas en papel.
3. Quiero que el estudiante vea sus notas y horario durante el trimestre, no solo al final.
4. Quiero que el padre de familia sea avisado por correo cuando su hijo esté en riesgo o falte mucho, sin que tenga que venir al colegio.
5. Quiero anticiparme a la reprobación, no solo registrarla cuando ya ocurrió.

Una encuesta a nuestros estudiantes lo confirma: 94% no ve sus notas a tiempo, 53% reprobó sin darse cuenta del riesgo y 94% dice que con información oportuna corregiría.

---

## 3. Quiénes usarán el sistema

| Usuario | Qué debe poder hacer |
|---|---|
| **Director (yo)** | Ver todo: indicadores del colegio, predicciones de todos los cursos, reportes por curso/materia/trimestre/gestión en PDF y Excel, crear y desactivar usuarios, configurar límite de faltas y nota de aprobación, ver historial de avisos a padres. |
| **Profesor** | Registrar asistencia diaria y notas solo de sus materias asignadas, ver el riesgo de sus alumnos, recibir alerta si uno falta demasiado. |
| **Administrativo** | Registrar materias por nivel, armar cursos y paralelos A/B/C, asignar docentes, armar horario semanal sin choques. No necesita ver notas individuales. |
| **Estudiante** | Ver solo lo suyo: mis notas, mi asistencia, mi horario. |
| **Padre de familia** | No tendrá usuario. Solo recibirá correos automáticos. Su correo lo registraremos como `email del tutor` en la ficha del estudiante. |

Nunca se creará un usuario con rol de padre.

---

## 4. Cómo quiero el sistema — por módulos

### Módulo 1 — Acceso y usuarios
- Ingreso con correo y contraseña cifrada.
- El sistema reconoce el rol y lleva a cada uno a su panel.
- Solo yo puedo registrar, editar y desactivar usuarios.
- Si alguien olvida su clave, debe recuperarla por correo.
- Primer acceso garantizado con: `director@lapaz.edu.bo / <INITIAL_DIRECTOR_PASSWORD en .env>`.

### Módulo 2 — Materias y horarios
- Registrar materias de 1ro a 6to con su carga horaria.
- Asignar qué profesor da qué materia en qué curso.
- Armar el horario semanal y que el sistema me avise si un docente quedó en dos cursos a la misma hora.
- El estudiante debe ver su horario semanal.

### Módulo 3 — Asistencia
- El profesor pasa lista por materia y fecha: Presente / Ausente / Justificado. Sin duplicados por día.
- El sistema calcula el % de asistencia solo.
- Si un estudiante pasa mi límite de faltas (por defecto 25), quiero que se avise al profesor y se envíe correo al padre.
- El estudiante puede ver su historial.

### Módulo 4 — Notas (escala boliviana)
- Exijo la escala oficial: **Ser 0–15 + Saber 0–35 + Hacer (resto) = 100. Se aprueba con 51.**
- Solo se carga en el trimestre activo (1, 2 o 3).
- El sistema calcula total, promedio trimestral y anual, y muestra aprobado/reprobado en colores.
- Quiero imprimir el boletín individual en PDF.

### Módulo 5 — Alerta temprana con Inteligencia Artificial (el corazón del encargo)
- Cada vez que se cargue una nota o asistencia, el sistema debe recalcular el riesgo del estudiante.
- Debe clasificar en solo tres niveles: **Sin Riesgo / Riesgo Medio / Riesgo Alto**, con su probabilidad (0 a 1).
- Debe usar: promedio de notas, % asistencia, nivel (1–6) y trimestre (1–3).
- Si sale Riesgo Alto, debe avisar al padre automáticamente.
- Dejo claro: la máquina alerta, **la decisión final siempre es del profesor o del director**.

### Módulo 6 — Paneles y reportes
- **Mi panel (Director):** total estudiantes, % aprobación, evolución por trimestre en gráficos, lista de estudiantes en Riesgo Alto, exportar todo a PDF y Excel.
- **Panel Profesor:** sus cursos, riesgo por alumno, alertas de faltas.
- **Panel Estudiante:** sus notas, asistencia y horario.
- **Panel Administrativo:** materias, horarios y usuarios, sin notas.

### Módulo 7 — Avisos a padres
- Correo automático al tutor cuando: (a) su hijo entra en Riesgo Alto, (b) supera el límite de faltas.
- El correo debe decir: nombre del estudiante, materia/curso, promedio, % asistencia y una recomendación (ej. "acercarse a tutoría").
- Quiero ver el historial: a quién se avisó, cuándo, por qué motivo y si se envió bien.

### Módulo 8 — Configuración del colegio
- Quiero cambiar yo mismo: límite de faltas, nota mínima (51), trimestre activo (1/2/3) y gestión (2026).
- Reportes consolidados por curso, materia, trimestre y gestión.

---

## 5. Reglas que no son negociables

1. Nota siempre 0–100, aprobado 51 o más.
2. Año dividido en 3 trimestres, solo se carga en el activo.
3. Un solo registro de asistencia por estudiante + materia + fecha.
4. Riesgo solo en 3 valores, nada más.
5. Cada nota o asistencia dispara nueva predicción.
6. Riesgo Alto siempre genera correo sin que nadie tenga que apretar un botón.
7. Los padres no tienen cuenta.
8. Cada profesor solo ve sus cursos. Yo veo todo.

---

## 6. Cómo lo quiero técnicamente (sin cambiarlo)

- Web responsive que abra en cualquier navegador del colegio.
- Datos guardados en base de datos PostgreSQL en la nube, con acceso por roles.
- Respuesta del ciclo nota → predicción → aviso en menos de 5 segundos.
- Funcionar con costo operativo cero para el colegio (planes gratuitos de nube).
- Contraseñas cifradas y sesiones seguras de 8 horas.

---

## 7. Cómo quiero recibir el trabajo — por entregas (Scrum)

Le pido entregas cada 2 semanas para revisar con mi equipo:

- **Entrega 1:** Acceso, roles y usuarios. Yo ya puedo entrar y crear cuentas.
- **Entrega 2:** Asistencia funcionando con % y alertas de faltas.
- **Entrega 3:** Notas bolivianas con promedios y boletín PDF.
- **Entrega 4:** Mis paneles con gráficos y reportes por rol.
- **Entrega 5 (3 semanas):** Inteligencia Artificial conectada y prediciendo.
- **Entrega 6:** Correos a padres y horarios sin choques.
- **Entrega 7:** Sistema en internet, probado y seguro.
- **Entrega 8:** Manuales, capacitación y acta de entrega.

En cada entrega quiero verlo funcionando con datos reales de un curso piloto de 3ro A.

---

## 8. Criterios para darle conformidad

Daré por recibido el sistema cuando:

- [ ] Entro como Director y veo los 1.080 estudiantes por curso.
- [ ] Un profesor carga notas y al instante veo el riesgo actualizado.
- [ ] Un estudiante con promedio 38 y 72% de asistencia sale en Riesgo Alto y su padre recibe el correo.
- [ ] Un profesor no puede editar notas de otro profesor.
- [ ] Exporto el reporte del trimestre en PDF y Excel.
- [ ] El estudiante ve su horario y notas desde su celular.

---

La Paz, 2026.

**Fdo. Director General**
**Unidad Educativa La Paz "A"**
