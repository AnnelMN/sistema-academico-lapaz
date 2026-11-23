# Guía de pruebas manuales — Sistema Académico U.E. La Paz "A"

> Elaborada el 23/11/2026 revisando el frontend, el backend y la base de datos en modo solo lectura.
> Incluye únicamente las funcionalidades que existen en el código.

El sistema tiene **4 roles**: Director, Docente (en el código `PROFESOR`), Administrativo y Estudiante.
Los padres o tutores **no tienen cuenta**: solo reciben correos.

---

## Índice

0. [Antes de empezar](#0-antes-de-empezar)
1. [Para todos los roles: acceso y seguridad](#1-para-todos-los-roles-acceso-y-seguridad)
2. [Director](#2-director)
3. [Administrativo](#3-administrativo)
4. [Docente](#4-docente)
5. [Estudiante](#5-estudiante)
6. [Pruebas de permisos entre roles](#6-pruebas-de-permisos-entre-roles)
7. [Flujo completo de punta a punta](#7-flujo-completo-de-punta-a-punta-recomendado)
8. [Cosas que vas a encontrar y que no son fallos de tu prueba](#8-cosas-que-vas-a-encontrar-y-que-no-son-fallos-de-tu-prueba)

---

## 0. Antes de empezar

**Estado de la base de datos al 23/11/2026:**

| Dato | Valor |
|---|---|
| Usuarios activos | 1 Director, 1 Docente, 1 Administrativo, 4 Estudiantes |
| Usuarios inactivos | 12 |
| Estudiantes | Todos en **3.º A** (4 activos de 11) |
| Cursos / materias / horarios 2026 | 31 / 5 / 6 |
| Trimestre activo (lunes 23/11/2026) | **3.er trimestre**, del 01/09 al **02/12** |
| Límite de faltas | 25 |
| Nota para aprobar | 51 |
| IA de riesgo y QR de asistencia | Activos en el `.env` local |

**Ten en cuenta que estas pruebas sí cambian la base de datos real:**

- **No se pueden borrar** desde la pantalla los usuarios, cursos, materias ni horarios: lo que crees se queda. Ponles nombres reconocibles, por ejemplo "PRUEBA Ana Test" o "PRUEBA Química".
- Haz una copia antes de empezar: `cd backend` y luego `node scripts/respaldarBD.js`.
- Los correos son **reales**: aviso a padres, exceso de faltas y riesgo alto. Como correo del tutor, usa uno tuyo.
- Después del **02/12** no habrá trimestre activo y no se podrán registrar notas ni asistencia.
- **2FA obligatorio:** cada cuenta nueva pide escanear un QR con Google Authenticator la primera vez. Ten el celular a mano.
- Para cambiar de usuario usa **otra ventana en modo incógnito**. Las pestañas normales comparten la sesión.
- Inicia todo con `iniciar.bat` y entra a `http://localhost:5173`.

---

## 1. Para todos los roles: acceso y seguridad

### 1.1 Iniciar sesión

- **Para qué sirve:** entrar al sistema con correo, contraseña y código 2FA.
- **Cómo se entra:** `http://localhost:5173`.
- **Pasos:**
  1. Escribe el correo y la contraseña (no hay que elegir rol).
  2. Pulsa **Ingresar al sistema**.
  3. Escribe el código de 6 dígitos de la app.
- **Resultado esperado:** entras al panel de tu rol (`/director`, `/profesor`, `/administrativo` o `/estudiante`).
- **Comprobación:** la pantalla de login **no** muestra botones de rol; el panel al que entras lo decide la cuenta.

| Prueba negativa | Resultado esperado |
|---|---|
| Campos vacíos | "Ingrese sus credenciales institucionales" |
| Contraseña incorrecta | "Credenciales inválidas" |
| Cuenta desactivada | "Credenciales inválidas" (no dice que está desactivada, a propósito) |
| 5 contraseñas incorrectas seguidas | "Demasiados intentos. Intente en 15 minutos." |
| Código 2FA equivocado | "Código 2FA inválido" |
| Varios códigos 2FA equivocados | "Demasiados códigos incorrectos. Espere 15 minutos." |

### 1.2 Primer ingreso (activar el 2FA)

- **Pasos:** entra con un usuario recién creado. Aparece "Escanea este QR con Authenticator". Escanéalo y escribe el código.
- **Resultado esperado:** entra al panel. Desde entonces, cada ingreso pide el código.

### 1.3 Recuperar la contraseña

- **Pasos:**
  1. En el login pulsa **¿Olvidaste tu contraseña?**.
  2. Escribe el correo.
  3. Escribe el código de tu app y la nueva contraseña dos veces.
- **Resultado esperado:** "Contraseña actualizada correctamente". La recuperación **no envía correos**: se valida con el código 2FA.

| Prueba negativa | Resultado esperado |
|---|---|
| Contraseña de 9 caracteres | "Debe tener al menos 10 caracteres, una letra y un número" |
| Contraseña solo con letras | El mismo mensaje |
| Las dos contraseñas no coinciden | "Las contraseñas no coinciden" |

### 1.4 Seguridad 2FA y cerrar sesión

- **Cómo se entra:** en el menú lateral, botón **Seguridad 2FA**.
- **Funcionalidades:** ver si el 2FA está activo, o **Desactivar 2FA** escribiendo la contraseña actual.
  - Con una contraseña incorrecta debe decir "Contraseña incorrecta".
  - Al desactivarlo se cierran las demás sesiones de esa cuenta.
- **Cerrar sesión:** botón al final del menú. Después, si abres una URL interna, te devuelve al login.

---

## 2. Director

**Menú:** Dashboard · Horarios · Asistencia · Notas · Predicción IA · Reportes · Usuarios · Notificaciones.

### 2.1 Usuarios (`/director/usuarios`)

**Para qué sirve:** crear docentes, administrativos y estudiantes, editarlos y activarlos o desactivarlos. Es el único rol que puede hacerlo.

**A. Crear un estudiante**

1. Pulsa **Nuevo usuario**.
2. Llena los datos:
   - Rol: Estudiante.
   - Nombre: "PRUEBA Ana Test".
   - Correo: `ana.prueba@lapaz.edu.bo`.
   - Contraseña inicial: `Prueba2026x`.
   - Curso: 3ro A.
   - Correo del tutor: un correo tuyo.
3. Guarda.

**Resultado esperado:** aparece en la tabla como Estudiante, activo, con su curso. Al iniciar sesión con esa cuenta pide activar el 2FA.

**B. Crear un docente:** Rol Docente, especialidad "Química".

**C. Crear un administrativo:** no pide campos extra.

| Prueba negativa | Resultado esperado |
|---|---|
| Correo que ya existe | "Ya existe un usuario con ese correo" |
| Contraseña débil (`abc`) | "La contraseña debe tener al menos 10 caracteres, una letra y un número…" |
| Estudiante sin curso | "Seleccione un curso válido para el estudiante" |
| Correo del tutor igual al del estudiante | "El correo del tutor debe ser distinto del correo del estudiante" |
| Docente sin especialidad | "La especialidad del docente es obligatoria…" |
| El rol "Director" | No aparece entre los roles que se pueden crear |

**D. Editar**

1. Pulsa **Editar** en una fila.
2. Cambia el nombre, el curso, el tutor o la especialidad.
3. Deja la contraseña vacía para no cambiarla.

Resultados esperados:

- **Nunca se muestra la contraseña actual.** El texto indica que no se puede ver.
- Si escribes una contraseña nueva, se cierran las sesiones de ese usuario.
- Al editar un Estudiante o un Docente aparece "El rol de este usuario no se puede cambiar".
- **Solo un Administrativo** se puede cambiar a Docente (te pedirá la especialidad).

**E. Activar y desactivar (prueba clave)**

1. Desactiva a un estudiante de 3.º A y confirma en la ventana.
2. Comprueba:
   - el estado pasa a "Inactivo";
   - si ese estudiante intenta entrar, ve "Credenciales inválidas", y si ya tenía la sesión abierta, lo saca al hacer cualquier acción;
   - el **Docente ya no lo ve** en Registrar notas, en Asistencia ni en el QR (ver 4.2 y 4.3);
   - el **Director sí lo ve** en Notas y Asistencia, con la etiqueta **"Inactivo"** y sus notas sin cambios.
3. Reactívalo y comprueba que vuelve a las listas del docente con todo su historial.

**Otras pruebas:**

- En la fila del Director no hay botón para desactivar.
- Usa los filtros por rol y por estado, y el buscador por nombre o correo.

### 2.2 Dashboard (`/director`)

- Muestra el total de estudiantes, la tasa de aprobación, cuántos están en riesgo alto, la asistencia media, la aprobación por curso y la lista de estudiantes en riesgo.
- **Prueba:** anota las cifras, registra notas o asistencia como docente y vuelve: las cifras deben cambiar.
- Sin notas, muestra "Aún no hay notas registradas…".

### 2.3 Horarios (`/director/horarios`)

- **Solo lectura:** tabla de curso, materia, docente, horario y gestión.
- **Prueba:** crea un horario como Administrativo (3.4) y comprueba que aparece aquí.
- **Docentes inactivos:** sus horarios siguen en la lista (como historial), atenuados y con la etiqueta **"Docente inactivo"**. Desactiva un docente en Usuarios y comprueba que su fila cambia; al reactivarlo, la etiqueta desaparece.

### 2.4 Notas (`/director/notas`)

- **Solo lectura.** Elige materia y curso, y luego el trimestre.
- **Resultado esperado:**
  - la planilla del docente, con casillas, SER, SABER, HACER, autoevaluación, total y estado;
  - no puedes escribir en las casillas;
  - los estudiantes inactivos aparecen con la etiqueta "Inactivo" y su nota congelada.

### 2.5 Asistencia (`/director/asistencia`)

- Elige materia y curso, y una fecha.
- **Resultado esperado:**
  - el estado de cada estudiante ese día, su asistencia acumulada y sus faltas;
  - **Ver historial** abre una ventana nítida (el fondo se desenfoca, la ventana no) con el nombre del estudiante, la materia y el curso, y todas sus fechas con su estado; **Cerrar** o un clic fuera la cierra;
  - los inactivos aparecen con la etiqueta "Inactivo";
  - no hay botones para registrar: solo el docente registra.

### 2.6 Predicción IA (`/director/predicciones`)

- Filtra por curso, nivel de riesgo (Alto, Medio, Sin riesgo) y trimestre.
- **Resultado esperado:** promedio, asistencia, nivel, probabilidad y fecha de cada predicción. Solo existen esas **3 categorías**.
- **Relación:** las predicciones se generan solas cuando el docente guarda notas o asistencia.

### 2.7 Reportes (`/director/reportes`)

- Filtros: gestión, curso, materia y trimestre.
- **Resultado esperado:**
  - indicadores generales: estudiantes con notas, promedio, aprobados, reprobados, asistencia y riesgo alto;
  - tablas por curso, por materia y por estudiante (SER /10, SABER /45, HACER /40, autoevaluación /5, total y estado).
- **Exportar CSV** descarga el archivo. Ábrelo en Excel y revisa que las tildes se vean bien.
- Con filtros sin datos: "Sin datos… con los filtros seleccionados".

### 2.8 Notificaciones (`/director/notificaciones`)

- **Historial:** estudiante, tipo (Riesgo alto o Exceso de faltas), estado (Enviado, Fallido o Pendiente), destinatario y fecha.
- **Envío manual:**
  1. Elige un estudiante (debe mostrar "Destinatario: <correo del tutor>").
  2. Elige el tipo y escribe el mensaje.
  3. Pulsa **Enviar notificación**.
- **Resultado esperado:** llega el correo al tutor y aparece en el historial como "Enviado". Si el correo falla, aparece como "Fallido".

| Prueba negativa | Resultado esperado |
|---|---|
| Mensaje vacío | "Estudiante, tipo y mensaje son requeridos" |
| Mensaje de más de 2000 caracteres | "El mensaje no puede superar 2000 caracteres" |
| Más de 30 envíos en una hora | "Se alcanzó el límite de correos manuales por hora…" |
| Estudiante inactivo | No aparece en la lista |

---

## 3. Administrativo

**Menú:** Dashboard · Cursos · Materias · Horarios.

### 3.1 Dashboard (`/administrativo`)

- Muestra cuántos cursos y materias hay, los usuarios por rol y accesos rápidos ("Ir a Cursos", "Ir a Materias").
- **Prueba:** crea un curso y comprueba que el número sube.

### 3.2 Cursos (`/administrativo/cursos`)

1. Elige Nivel (1ro a 6to) y Paralelo (A a E).
2. Pulsa **Guardar curso**.

- **Resultado esperado:** aparece en la tabla.
- **Prueba negativa:** si repites un curso que ya existe (por ejemplo 3ro A), debe decir "Ya existe ese curso".

### 3.3 Materias (`/administrativo/materias`)

1. Escribe el nombre ("PRUEBA Química"), la carga horaria (4) y el nivel (3ro).
2. Pulsa **Guardar materia**.

- **Resultado esperado:** aparece en la tabla.
- **Prueba negativa:** con un campo vacío debe decir "Todos los campos son requeridos".

### 3.4 Horarios (`/administrativo/horarios`)

**Para qué sirve:** asignar una materia a un curso, con su docente, día y hora. Así el docente ve la materia y sus estudiantes.

1. Elige Curso 3ro A, la materia, el docente, el día (de lunes a viernes) y la hora (07:30, 08:30, 09:30, 10:30 u 11:30).
2. Pulsa **Guardar horario**.

**Resultado esperado:**

- aparece "Horario guardado" y la clase se ve en la cuadrícula del curso;
- el docente la ve en "Mi horario" y en "Registrar notas";
- el estudiante la ve en "Mi horario".

**Pruebas negativas:**

- Asigna **al mismo docente** el mismo día y hora en otro curso: "Conflicto: El docente ya tiene una clase asignada…".
- Asigna **al mismo curso** otra materia el mismo día y hora: "Conflicto: El curso ya tiene asignada la materia…".
- **Espacio de un docente inactivo:** si en la grilla una clase aparece atenuada con "(inactivo)", asigna ese mismo curso, día y hora a un docente activo: debe guardarse sin conflicto y la grilla mostrará la clase nueva.
- Los docentes inactivos no aparecen en la lista de docentes para asignar.

**Permisos:** el Docente y el Estudiante no pueden ver esta pantalla.

---

## 4. Docente

**Menú:** Dashboard · Registrar notas · Asistencia · Predicción IA · Mi horario · Reportes.

### 4.1 Dashboard (`/profesor`)

- Muestra sus materias, con curso, horario, estudiantes, promedio, aprobados y reprobados y asistencia, y una lista de "Estudiantes que necesitan atención".
- Se puede elegir el trimestre.
- Si no tiene materias: "Todavía no tienes materias asignadas…".

### 4.2 Registrar notas (`/profesor/notas`)

**Escala:** cada casilla es un número entero **sobre los puntos de su dimensión**: SER de 0 a 10, SABER de 0 a 45 y HACER de 0 a 40. La autoevaluación va de 0 a 5.

**A. Configurar las casillas**

1. Elige la materia y el curso. El trimestre activo aparece marcado "(activo)".
2. En "Casillas del trimestre", pulsa **Agregar casilla** en una dimensión. Aparece un campo con dos botones: **✓** (confirmar) y **✗** (cancelar).
3. Escribe el nombre, por ejemplo "Prueba 1", y pulsa **✓** (o Enter).
4. Resultado esperado: mensaje verde "Casilla «Prueba 1» creada en SER." y la casilla aparece al instante en la lista y como columna en la planilla.
5. Repite hasta tener SER: 2 (más la de "Asistencia (automática)"), SABER: 2 y HACER: 1.

| Prueba de casillas | Resultado esperado |
|---|---|
| Pulsar ✗ (o Escape) | Se cierra el campo y no se crea nada |
| Confirmar con el nombre vacío | "Escribe el nombre de la casilla…" |
| Repetir un nombre en la misma dimensión | "Ya existe una casilla «…» en SER." |
| Lápiz de una casilla | Permite renombrarla con ✓ / ✗ |
| Crear casillas con notas escritas sin guardar | Se permite; las notas escritas no se pierden |

**B. Calificar (ejemplo con resultado conocido)**

| Casillas de un estudiante | Resultado esperado |
|---|---|
| SER: 9 y 7, sin listas de asistencia | (9 + 7) / 2 = **8** |
| SABER: 40 y 35 | 37,5, que se redondea a **38** |
| HACER: 32 | **32** |
| Autoevaluación: 4 | Total **82**, "Aprobado" |

**C. Calificación pendiente (regla del 23/11/2026)**

| Prueba | Resultado esperado |
|---|---|
| Deja vacía una casilla de SABER a un estudiante | Su SABER muestra **"Pend."**, el total "—" y el estado **"Calificación pendiente"** (al pasar el mouse: "Falta completar: SABER") |
| Escribe **0** en esa casilla y guarda | SABER se calcula (el 0 cuenta) |
| Crea una casilla nueva y no la califiques | Todos los estudiantes pasan a "Pend." en ese componente; al quitarla (✗) vuelven a calcularse |
| Deja vacía la autoevaluación | SER, SABER y HACER se ven; el total queda "Calificación pendiente" |
| Sin listas de asistencia en el trimestre | La columna «Asist.» no deja SER pendiente |
| Dashboard y Reportes del docente con pendientes | Promedio y aprobados solo con notas completas; se indica "n pendiente(s)" |

Las celdas que escribes se marcan en **naranja** (sin guardar) y abajo aparece una barra fija: "n cambios sin guardar" con **Guardar notas (n)** y **Descartar**. Al guardar, la barra muestra "Guardando notas…" y luego, en verde, "Notas guardadas correctamente (n cambios) a las HH:MM"; el naranja desaparece. Si falla, la barra se pone roja con "No se guardaron las notas: …" y tus cambios siguen ahí. Recarga la página (F5): las notas deben seguir. Si intentas recargar con cambios sin guardar, el navegador te avisa.

| Prueba negativa | Resultado esperado |
|---|---|
| 11 en SER, 46 en SABER o 41 en HACER | La celda se pone roja y al guardar dice "Hay n casilla(s) con valores no válidos…" |
| Letras o decimales | No se pueden escribir |
| Autoevaluación de 6 | Celda roja |
| Escribir en la casilla de asistencia | No se puede: se calcula sola |
| Cambiar de materia con cambios sin guardar | Aviso "Tienes cambios sin guardar…" y botón **Descartar cambios** |
| Elegir un trimestre pasado | Solo lectura, con un candado y el motivo |
| Quitar una casilla (✗ de la fila) | Pregunta "¿Quitar «…»?" con **Sí, quitar** / **No**; si tiene notas avisa "también se borrarán" |
| Quitar una casilla con notas de un estudiante **inactivo** | No se permite (es parte de su historial) |

**Relación con otros módulos:** al guardar notas se actualiza la predicción de riesgo, y la nota aparece en el Director (Notas y Reportes) y en "Mis notas" del estudiante.

### 4.3 Asistencia (`/profesor/asistencia`)

**A. Registro manual**

1. Elige la materia, el curso y la fecha (hoy, si es de lunes a viernes).
2. Marca a cada estudiante con **P**, **A** o **J** (Presente, Ausente o Justificado), o usa **Marcar todos presente**.
3. Pulsa **Guardar asistencia**.

- **Resultado esperado:** suben los contadores de Presentes, Ausentes y Justificados, y se actualizan la asistencia acumulada y las faltas.
- **Relación con notas:** la casilla de asistencia de SER pasa a tener valor **sobre 10**. Por ejemplo, con 1 clase presente vale 10. Comprueba que el SER de 4.2 cambia.

| Prueba negativa | Resultado esperado |
|---|---|
| Fecha de mañana | "No se puede registrar asistencia de una fecha futura" |
| Un sábado o domingo | "Solo se registra asistencia de lunes a viernes" |
| Una fecha del 2.º trimestre | "Solo se registra asistencia del trimestre activo" |
| Un estudiante inactivo | No aparece en la lista |

**B. Registro con QR**

1. Pulsa **Registro mediante QR** y luego **Iniciar escáner**.
2. Apunta al QR que el estudiante muestra en su celular (ver 5.5).

- **Resultado esperado:** "Asistencia registrada" y el estudiante pasa a la lista de "Registrados por QR".
- **Pruebas negativas:**
  - escanea al mismo estudiante dos veces: "Ya estaba registrado hoy como Presente. No se modificó.";
  - un QR de más de 30 segundos o una captura vieja: "Código QR inválido o vencido…";
  - los que no escanearon **no** quedan como ausentes: se completan en el registro manual.
- **Necesita cámara:** en el celular solo funciona con HTTPS ("se requiere HTTPS"). En la PC con `localhost` sí funciona.

### 4.4 Predicción IA (`/profesor/predicciones`)

- Muestra el riesgo de **sus** estudiantes: nivel, probabilidad, promedio general, asistencia general y fecha de actualización.
- Se puede filtrar por curso y materia; **Quitar filtro** vuelve a todos.
- Indica que la predicción es **orientativa**.

### 4.5 Mi horario (`/profesor/horario`)

- Muestra sus clases de lunes a viernes, ordenadas por hora, con los totales de clases por semana, cursos y días con clases.
- Si dos clases suyas coinciden en día y hora, aparece un aviso en rojo.
- **Ahora mismo deberías ver ese aviso**: Matemáticas de 3.º A tiene dos clases el lunes a las 07:30 (caso pendiente de decidir).

### 4.6 Reportes (`/profesor/reportes`)

- Elige una materia y un trimestre.
- **Resultado esperado:** resumen de estudiantes, promedio, aprobados, reprobados y asistencia, y una tabla por estudiante.
- **Exportar CSV** descarga el archivo. **Imprimir / PDF** oculta el menú y agrega el encabezado del colegio.

---

## 5. Estudiante

**Menú:** Inicio · Mis notas · Mi horario · Mi asistencia · Mi código QR · Mi predicción.

| Módulo | Qué comprobar |
|---|---|
| **5.1 Inicio** | Promedio, materias aprobadas, asistencia, su nivel de riesgo con una recomendación y sus materias |
| **5.2 Mis notas** | Boletín con T1, T2, T3 y la nota anual. Al tocar una materia ve sus casillas, por ejemplo "8/10" o "38/45"; una casilla sin calificar dice **"pendiente"** (en naranja). Si le falta algo, ve **"Calificación pendiente"** en lugar del total, y la nota anual dice "Pendiente". **Exportar PDF** imprime el boletín. Debe coincidir con lo que guardó el docente en 4.2 |
| **5.3 Mi horario** | Sus clases de lunes a viernes. Debe aparecer el horario creado en 3.4. Si un docente fue desactivado: su clase aparece en gris con **"Docente por asignar"**; si el Administrativo ya asignó ese día y hora a otro docente, solo se ve la clase nueva (hoy, en 3.º A, el lunes 07:30 muestra una sola Matemáticas) |
| **5.4 Mi asistencia** | Asistencia global, alerta de faltas y detalle por materia. Debe coincidir con lo registrado en 4.3 |
| **5.5 Mi código QR** | Un QR que **se renueva cada 30 segundos** (con cuenta regresiva). Se usa en 4.3 B |
| **5.6 Mi predicción** | Solo **su propio** riesgo, la probabilidad, los factores (promedio y asistencia) y recomendaciones. Es de solo lectura |

---

## 6. Pruebas de permisos entre roles

Entra con un rol y escribe en la barra del navegador la URL de otro rol:

| Usuario conectado | URL que escribes | Resultado esperado |
|---|---|---|
| Docente | `/director/usuarios` | Te devuelve a `/profesor` |
| Estudiante | `/profesor/notas` | Te devuelve a `/estudiante` |
| Administrativo | `/director/reportes` | Te devuelve a `/administrativo` |
| Director | `/estudiante/notas` | Te devuelve a `/director` |
| Sin sesión | `/director` | Te lleva al login |

**Qué debe ocurrir en cada rol:**

- **Docente:** solo ve sus materias y los estudiantes **activos** de sus cursos. No puede editar notas de trimestres pasados.
- **Estudiante:** no ve datos de otros estudiantes ni puede escribir notas.
- **Administrativo:** no ve notas individuales ni predicciones.

Esto también lo comprueba el servidor, no solo la pantalla: aunque alguien fuerce la URL, el backend responde "Access denied".

---

## 7. Flujo completo de punta a punta (recomendado)

1. **Director:** crea el estudiante "PRUEBA Ana Test" en 3ro A, con un correo de tutor tuyo.
2. **Administrativo:** crea el curso o la materia si hace falta y asigna un horario en 3ro A con el docente.
3. **Docente:** comprueba la clase en "Mi horario", configura las casillas y califica a Ana con el ejemplo de 4.2.
4. **Docente:** registra la asistencia de hoy (manual o por QR con el celular de Ana).
5. **Estudiante (Ana):** revisa Mis notas (82, Aprobado), Mi asistencia, Mi horario y Mi predicción.
6. **Director:** revisa Notas, Asistencia, Reportes (y el CSV), Predicción IA y el Dashboard.
7. **Director:** desactiva a Ana.
   - El **Docente** ya no la ve.
   - El **Director** la ve como "Inactivo" con su nota igual.
   - **Ana** ya no puede entrar.
8. **Director:** reactiva a Ana y comprueba que vuelve con su historial.

---

## 8. Cosas que vas a encontrar y que no son fallos de tu prueba

Son límites del código actual, no errores al probar:

- **Botones que no hacen nada:** "Editar" en Cursos y Materias, y "Exportar horarios" en Horarios. Tampoco hay forma de editar ni borrar horarios.
- **Materia de otro nivel:** al crear un horario se puede asignar una materia de un nivel distinto al del curso (por ejemplo una de 5to a 3ro A). El sistema no lo valida.
- **Límite de faltas distinto:** "Mi asistencia" del estudiante dice "límite de 5 inasistencias", pero la configuración real usa **25**. El correo de exceso de faltas se envía con 25.
- **La Configuración institucional y la Auditoría no tienen pantalla.** El servidor sí las tiene, pero no hay forma de usarlas desde la interfaz.
