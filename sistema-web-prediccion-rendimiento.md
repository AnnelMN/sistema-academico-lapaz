# UNIVERSIDAD SALESIANA DE BOLIVIA
## INGENIERÍA DE SISTEMAS
### PROYECTO DE GRADO

**Para obtener el Grado Académico de Licenciatura en Ingeniería de Sistemas**

# SISTEMA WEB CON MACHINE LEARNING PARA GESTIÓN ACADÉMICA Y ANÁLISIS PREDICTIVO DEL RENDIMIENTO ACADÉMICO
**CASO: UNIDAD EDUCATIVA LA PAZ “A”**

- **Postulante:** Mamani Huarca Najhely Annel
- **Docente Guía:** Ing. Lazcano Balanza Juan Gabriel
- **La Paz – Bolivia 2026**

---

## DEDICATORIA
A mi familia, por su amor, su paciencia y su apoyo incondicional en cada etapa de mi formación profesional. Este logro también es suyo.

---

## AGRADECIMIENTO
A la Universidad Salesiana de Bolivia y a la Carrera de Ingeniería de Sistemas, por la formación académica y humana recibida a lo largo de mis estudios.

Al Ing. Juan Gabriel Lazcano Balanza, docente guía del presente proyecto, por su orientación, sus observaciones y su acompañamiento durante el desarrollo de este trabajo.

A la Unidad Educativa La Paz “A”, a su director, docentes y estudiantes, por la apertura y la colaboración brindadas durante el levantamiento de información.

A mi familia y a todas las personas que, de una u otra forma, contribuyeron a la culminación de esta etapa.

---

## ÍNDICE

- RESUMEN
- CAPÍTULO I. GENERALIDADES
  - 1.1 Introducción
  - 1.2 Antecedentes
    - 1.2.1 Estudios internacionales
    - 1.2.2 Estudios nacionales
    - 1.2.3 Estudios departamentales
  - 1.3 Justificación
    - 1.3.1 Justificación técnica
    - 1.3.2 Justificación económica
    - 1.3.3 Justificación social
    - 1.3.4 Justificación legal
  - 1.4 Planteamiento y formulación del problema
    - 1.4.1 Descripción del problema
    - 1.4.2 Formulación del problema
      - 1.4.2.1 Problema principal
      - 1.4.2.2 Problemas secundarios
  - 1.5 Objetivos
    - 1.5.1 Objetivo general
    - 1.5.2 Objetivos específicos
  - 1.6 Alcances, límites y aportes
    - 1.6.1 Alcances
    - 1.6.2 Límites
    - 1.6.3 Aportes
      - 1.6.3.1 Aportes del proyecto
      - 1.6.3.2 Aporte académico o ingenieril
- CAPÍTULO II. MARCO INSTITUCIONAL
  - 2.1 Antecedentes de la institución
  - 2.2 Estructura orgánica
  - 2.3 Servicios
  - 2.4 Visión
  - 2.5 Misión
  - 2.6 Organigrama
- CAPÍTULO III. MARCO TEÓRICO
  - 3.1 Marco histórico
    - 3.1.1 Evolución de los sistemas de gestión académica
    - 3.1.2 Desarrollo de aplicaciones web en educación
    - 3.1.3 Evolución de la inteligencia artificial aplicada a la educación y marcos normativos
    - 3.1.4 Historia del Machine Learning
    - 3.1.5 Digitalización educativa en Bolivia
  - 3.2 Marco conceptual
    - 3.2.1 Sistema web
    - 3.2.2 Gestión académica
    - 3.2.3 Rendimiento académico
    - 3.2.4 Inteligencia artificial
    - 3.2.5 Machine Learning
    - 3.2.6 Análisis predictivo
    - 3.2.7 Árbol de decisión ID3
    - 3.2.8 Random Forest
    - 3.2.9 Metodología CRISP-DM
    - 3.2.10 Arquitectura cliente-servidor
    - 3.2.11 Patrón Modelo-Vista-Controlador (MVC)
    - 3.2.12 API REST
      - 3.2.12.1 Principios de diseño REST
      - 3.2.12.2 Escalabilidad e independencia del backend
    - 3.2.13 Lenguaje unificado de modelado (UML)
      - 3.2.13.1 Diagrama de casos de uso
      - 3.2.13.2 Diagrama de clases
      - 3.2.13.3 Diagrama de secuencia
      - 3.2.13.4 Lenguaje de restricciones de objetos (OCL)
    - 3.2.14 Metodología Scrum
    - 3.2.15 Normas de calidad del software
      - 3.2.15.1 Norma ISO/IEC 25010
      - 3.2.15.2 Norma ISO/IEC 27002
    - 3.2.16 Pruebas de software
    - 3.2.17 Evaluación financiera
      - 3.2.17.1 Valor actual neto (VAN)
      - 3.2.17.2 Tasa interna de retorno (TIR)
  - 3.3 Marco tecnológico
    - 3.3.1 Tecnologías para el desarrollo de interfaces (frontend)
    - 3.3.2 Tecnologías para el desarrollo de servidores (backend)
    - 3.3.3 Tecnologías para el microservicio de inteligencia artificial
    - 3.3.4 Tecnologías para la persistencia y gestión de datos
    - 3.3.5 Comparación de frameworks y justificación de uso
  - 3.4 Marco legal
    - 3.4.1 Constitución Política del Estado
    - 3.4.2 Ley N.° 070 Avelino Siñani - Elizardo Pérez
    - 3.4.3 Ley N.° 164 General de Telecomunicaciones y TIC
  - 3.5 Marco actual
- CAPÍTULO IV. MARCO METODOLÓGICO
  - 4.1 Delimitación temporal y espacial
    - 4.1.1 Delimitación temporal
    - 4.1.2 Delimitación espacial
  - 4.2 Materiales
    - 4.2.1 Hardware
    - 4.2.2 Software
  - 4.3 Metodología
    - 4.3.1 Planteamiento del estudio
      - 4.3.1.1 Método deductivo e inductivo
      - 4.3.1.2 Diseño de investigación no experimental
      - 4.3.1.3 Tipo de estudio
      - 4.3.1.4 Población y muestra
      - 4.3.1.5 Técnicas de recolección de datos
      - 4.3.1.6 Procesamiento y análisis de datos
    - 4.3.2 Desarrollo del proyecto (Ingeniería del proyecto)
      - 4.3.2.1 Fase de especificación de requerimientos
      - 4.3.2.2 Fase de análisis y diseño
      - 4.3.2.3 Fase de implementación
      - 4.3.2.4 Fase de pruebas
    - 4.3.3 Calidad del sistema
    - 4.3.4 Estimación de costos
      - 4.3.4.1 Estimación del esfuerzo de desarrollo
      - 4.3.4.2 Costo de desarrollo
      - 4.3.4.3 Costo de implementación
      - 4.3.4.4 Costo de elaboración
      - 4.3.4.5 Costo total del proyecto
      - 4.3.4.6 Costo/beneficio
- CAPÍTULO V. MARCO APLICATIVO
  - 5.1 Desarrollo del proyecto (Ingeniería del proyecto)
    - 5.1.1 Fase de especificación de requerimientos
      - 5.1.1.1 Requerimientos funcionales
      - 5.1.1.2 Requerimientos no funcionales
      - 5.1.1.3 Casos de uso del sistema
    - 5.1.2 Fase de análisis y diseño
      - 5.1.2.1 Arquitectura del sistema
      - 5.1.2.2 Diagramas de actividades
      - 5.1.2.3 Diagramas de casos de uso
      - 5.1.2.4 Diagrama de componentes
      - 5.1.2.5 Diagramas de secuencia
      - 5.1.2.6 Modelo conceptual: diagrama de clases
      - 5.1.2.7 Restricciones OCL del modelo
      - 5.1.2.8 Modelo físico: esquema de base de datos
      - 5.1.2.9 Diseño navegacional
    - 5.1.3 Diseño de interfaces de usuario
      - 5.1.3.1 Pantalla de inicio de sesión
      - 5.1.3.2 Dashboard del director
      - 5.1.3.3 Panel del profesor: registro de asistencia
      - 5.1.3.4 Panel del profesor: registro de notas
      - 5.1.3.5 Módulo de predicción de riesgo académico
      - 5.1.3.6 Portal del estudiante
      - 5.1.3.7 Panel administrativo: gestión de materias y horarios
      - 5.1.3.8 Módulo de notificaciones: historial y configuración
    - 5.1.4 Fase de implementación
      - 5.1.4.1 Implementación del sistema web
    - 5.1.5 Fase de pruebas
- REFERENCIAS BIBLIOGRÁFICAS
- ANEXOS

---

## RESUMEN

El presente proyecto de grado aborda la problemática de la gestión académica de la Unidad Educativa La Paz “A”, donde el registro de calificaciones y asistencia de 1.080 estudiantes, a cargo de 52 docentes, se realiza de forma manual y fragmentada, lo que provoca pérdida de información, falta de acceso oportuno a las notas y la detección tardía de los estudiantes en riesgo de reprobación. Como respuesta, se desarrolla un sistema web con Machine Learning para la gestión académica y el análisis predictivo del rendimiento académico. La investigación adopta un enfoque mixto, de tipo aplicado y descriptivo, con un diseño no experimental; la información se recopiló mediante encuestas, entrevistas, observación directa y revisión documental.

El sistema se construye con el marco de trabajo ágil Scrum sobre una arquitectura cliente-servidor de tres capas: React y Tailwind CSS en la interfaz, Node.js con Express y Prisma ORM en la lógica de negocio, y PostgreSQL en Supabase para la persistencia de los datos. El módulo predictivo, desarrollado bajo la metodología CRISP-DM en un microservicio con Python, FastAPI y scikit-learn, emplea los algoritmos Árbol de Decisión (ID3) y Random Forest para clasificar a los estudiantes según su nivel de riesgo académico y genera notificaciones automáticas a los padres de familia. La calidad del producto se evalúa con base en la norma ISO/IEC 25010. El sistema permite centralizar la información académica, ofrecer acceso en tiempo real a las notas y la asistencia, y transformar la gestión institucional de un modelo reactivo a uno preventivo.

**Palabras clave:** sistema web, Machine Learning, gestión académica, análisis predictivo, rendimiento académico.

---

# CAPÍTULO I. GENERALIDADES

## 1.1 Introducción
En el actual panorama educativo de Bolivia, la digitalización de los procesos académicos en instituciones de secundaria de carácter público aún enfrenta brechas significativas. La gestión de información, tradicionalmente relegada a métodos manuales o herramientas ofimáticas aisladas, limita la capacidad de respuesta institucional ante fenómenos críticos como la deserción y el bajo rendimiento académico. En este contexto, el Machine Learning (ML) surge como una solución disruptiva, permitiendo evolucionar de una administración reactiva de datos hacia un análisis predictivo capaz de transformar la realidad pedagógica mediante el procesamiento inteligente de la información generada en las aulas.

La Unidad Educativa La Paz "A" refleja esta necesidad de innovación tecnológica. Actualmente, el plantel docente, compuesto por 52 profesionales, actúa como la principal fuente de recolección de datos; sin embargo, al registrar notas y asistencia en soportes físicos o planillas digitales no integradas, se pierde el potencial analítico de dicha información. Esta desconexión impide identificar patrones de comportamiento en la población estudiantil, quienes constituyen el objeto central de este estudio. Al no contar con mecanismos que procesen los datos aportados por los docentes en tiempo real, la institución solo detecta los casos de riesgo académico cuando el ciclo escolar ha concluido, anulando cualquier posibilidad de intervención temprana.

Ante esta problemática, la presente investigación prioriza la implementación de algoritmos de Machine Learning diseñados para el análisis predictivo del rendimiento estudiantil. El enfoque principal radica en el entrenamiento y despliegue de modelos de aprendizaje supervisado que, utilizando el sistema web como plataforma de interacción y soporte, permitan a los usuarios administrativos y docentes anticipar escenarios de reprobación. De esta manera, se busca optimizar los recursos institucionales y garantizar la integridad de la información, integrando de forma implícita la necesidad de una gestión técnica eficiente y una respuesta social oportuna ante el rezago escolar.

Para el desarrollo de esta solución, se aplica una metodología de investigación de enfoque mixto, combinando el análisis cuantitativo de los registros académicos para el entrenamiento del modelo predictivo con una perspectiva cualitativa sobre los procesos de gestión institucional. El proceso inicia con el diagnóstico de las variables académicas proporcionadas por el plantel docente, seguido del diseño del modelo de Machine Learning y su integración en un entorno web. Esta estructura metodológica asegura que el desarrollo técnico esté estrictamente alineado con las necesidades de la Unidad Educativa, validando la precisión del modelo en un entorno escolar real.

## 1.2 Antecedentes
Los antecedentes del presente proyecto comprenden investigaciones y proyectos de grado relacionados con la gestión académica y el uso de Machine Learning en el ámbito educativo, organizados en estudios internacionales, nacionales y departamentales.

### 1.2.1 Estudios internacionales
La investigación titulada “Desarrollo e implementación de un sistema web de gestión académica en la Unidad Educativa Marco Aurelio Subía – Batalla de Panupali”, elaborada por Antony Israel Troya Cuzco y Eddy Ruy Ushco Cuchiparte en la Universidad Técnica de Cotopaxi (Latacunga, Ecuador) en el año 2024, parte de la problemática de una institución en la que los registros académicos se manejaban de forma manual, lo que ocasionaba la pérdida de información y retrasaba la gestión administrativa (Troya & Ushco, 2024).

Aplica la siguiente metodología: para el desarrollo del software emplea una adaptación del marco de trabajo ágil Scrum, y para la investigación se apoya en la investigación bibliográfica y en los métodos cuantitativo y cualitativo, con encuestas y entrevistas a docentes y autoridades para identificar los requerimientos. El sistema se construye con Bootstrap, PHP, JavaScript, jQuery, HTML, CSS y MySQL.

De acuerdo con sus resultados, la aplicación permite a la administración gestionar los registros de cursos, docentes, estudiantes y notas anuales; a los docentes, registrar notas por trimestre y asistencia, planificar horarios y generar reportes por materia; y a los estudiantes, consultar sus horarios y calificaciones. Entre sus conclusiones, señala que el sistema optimiza los procesos educativos, mejora el flujo de trabajo administrativo y docente, y constituye un apoyo para la toma de decisiones en la institución.

Este trabajo contribuye al presente proyecto como referencia funcional para los módulos de registro de notas trimestrales, control de asistencia y consulta de calificaciones. Sin embargo, se limita al almacenamiento y la consulta de la información; el presente proyecto incorpora, además, un componente de Machine Learning basado en Árbol de Decisión y Random Forest, bajo la metodología CRISP-DM, que permite pasar de una gestión reactiva a una preventiva.

La investigación titulada “Análisis de datos del uso de tecnologías digitales para la medición del nivel de impacto en el rendimiento académico de los estudiantes de la carrera de Tecnologías de la Información mediante la herramienta Power BI”, elaborada por María Belén Barreto Baque, con la tutoría de Lenin Jonatan Pin García, en la Universidad Estatal del Sur de Manabí (Jipijapa, Ecuador) en el año 2025, tiene como objetivo analizar el impacto de las tecnologías digitales en el desempeño académico de los estudiantes de octavo semestre de dicha carrera (Pin & Barreto, 2025).

Aplica la siguiente metodología: un enfoque mixto, cualitativo y cuantitativo, con los métodos teórico, de análisis-síntesis, estadístico-matemático y bibliográfico; la información se recolecta mediante encuestas a estudiantes y docentes, complementadas con la revisión de investigaciones previas, y se analiza con la herramienta Power BI.

De acuerdo con sus resultados, se implementa un modelo de visualización de datos en Power BI que sirve como base analítica para diseñar estrategias de integración tecnológica en el proceso de enseñanza-aprendizaje. Entre sus conclusiones, establece que una correcta incorporación de las tecnologías digitales contribuye a mejorar la calidad educativa y a fortalecer la formación profesional de los estudiantes.

Este estudio aporta al presente proyecto la importancia del rendimiento académico como indicador central y el uso de herramientas de visualización para la toma de decisiones. A diferencia de su enfoque, centrado en el análisis descriptivo de datos históricos, el presente proyecto integra algoritmos que generan predicciones sobre el riesgo de reprobación directamente en la operativa diaria de la institución.

La investigación titulada “Desarrollo de un dashboard web para un modelo de Machine Learning basado en IA en la predicción temprana de la deserción estudiantil de la Facultad de Ciencias y Tecnologías”, elaborada por Diego Emanuel Armoa Rolon y Juan Vicente Bogado Machuca en la Universidad Nacional de Caaguazú (Paraguay) en el año 2025, desarrolla un dashboard web interactivo que integra un modelo de aprendizaje automático previamente validado para identificar a los estudiantes en riesgo de deserción (Armoa & Bogado, 2025).

Aplica la siguiente metodología: integra el modelo predictivo desarrollado previamente en la facultad, diseña una arquitectura web escalable y segura, e implementa la solución con Python, Django, React.js y PostgreSQL; además, evalúa la viabilidad técnica, operativa y económica del sistema, y verifica su capacidad de procesamiento y su usabilidad.

De acuerdo con sus resultados, la herramienta mejora la identificación temprana de los estudiantes en riesgo mediante visualizaciones, indicadores clave y alertas automatizadas, y optimiza el uso de los recursos académicos. Entre sus conclusiones, destaca el valor de la analítica académica y del aprendizaje automático como instrumentos para la toma de decisiones y para el fortalecimiento de las estrategias de retención estudiantil.

Este trabajo contribuye al presente proyecto con un modelo de integración entre un componente predictivo y una interfaz web basada en React y PostgreSQL, similar a la arquitectura propuesta. No obstante, se aplica en el nivel universitario; el presente proyecto se orienta a la educación secundaria, donde las variables de rendimiento y asistencia difieren, y trasciende el tablero de visualización para constituir una plataforma integral de gestión académica.

### 1.2.2 Estudios nacionales
La investigación titulada “El efecto de la inteligencia artificial en el rendimiento académico de estudiantes de ciencias administrativas en la Universidad Católica Boliviana”, elaborada por Martin Ortega Azurduy, Jorge Machaca Mamani y Jessica Daza Morales, y publicada en la revista del Centro Psicopedagógico y de Investigación en Educación Superior (CEPIES) de la Universidad Mayor de San Andrés en el año 2023, tiene como objetivo determinar qué factores sociocognitivos influyen en la intención de utilizar inteligencia artificial y su impacto en el rendimiento académico (Ortega, Machaca, & Daza, 2023).

Aplica la siguiente metodología: un estudio de carácter exploratorio con una muestra de 48 estudiantes de Ciencias Administrativas, a quienes se aplicó un cuestionario de 31 ítems en escala de Likert de cinco puntos; los datos se analizaron mediante análisis de rutas (path analysis).

De acuerdo con sus resultados, la ética tiene un efecto muy significativo sobre la autoeficacia y la motivación, y las expectativas de resultados influyen en la intención de uso, que a su vez incide en el rendimiento académico. Entre sus conclusiones, identifica a la ética, la autoeficacia, la motivación y las expectativas de resultados como predictores de la intención de adoptar la inteligencia artificial y del rendimiento académico.

Este estudio aporta al presente proyecto evidencia del contexto boliviano sobre la relación entre la inteligencia artificial y el rendimiento académico, así como la necesidad de un uso ético de esta tecnología. A diferencia de su carácter exploratorio, el presente proyecto propone una solución técnica concreta: un motor de Machine Learning funcional que procesa datos académicos para generar alertas tempranas en la Unidad Educativa La Paz “A”.

La investigación titulada “Factores que intervienen en el rendimiento académico en la Universidad”, elaborada por Wendoline Arteaga Sabja y Juan Pablo Sandoval, y publicada en la Revista Acta Nova de la Universidad Católica Boliviana, regional Cochabamba, en el año 2018, tiene como objetivo identificar los factores que afectan el rendimiento académico de los estudiantes mediante técnicas de minería de datos (Arteaga Sabja & Sandoval, 2018).

Aplica la siguiente metodología: técnicas de aprendizaje supervisado basadas en árboles de decisión, aplicadas a los datos de las materias cursadas entre los años 2012 y 2015 en el pregrado de la Universidad Católica Boliviana, regional Cochabamba.

De acuerdo con sus resultados, los factores que más afectaron el rendimiento académico fueron la inscripción temprana, el mayor espacio libre en el aula, la repetición de materias, la hora de inicio de clases, el número de alumnos inscritos, la edad del estudiante y la experiencia del docente. Entre sus conclusiones, plantea que la minería de datos, aplicada con fines académicos, puede apoyar la toma de decisiones de los involucrados en el proceso de enseñanza-aprendizaje.

Este estudio aporta al presente proyecto un antecedente nacional del uso de árboles de decisión para explicar el rendimiento académico a partir de datos institucionales, técnica que el presente proyecto emplea junto con Random Forest. A diferencia de ese trabajo, cuyo análisis es retrospectivo, el presente proyecto integra el modelo predictivo en un sistema web que genera alertas durante el desarrollo del trimestre.

### 1.2.3 Estudios departamentales
La investigación titulada “Sistema web de gestión académica y repositorio virtual. Caso: Unidad Educativa Príncipe de Luz”, elaborada por Edwin Rubén Cachaga Villegas en la Carrera de Informática de la Universidad Mayor de San Andrés (La Paz) en el año 2016, busca mejorar el seguimiento académico de los estudiantes y facilitar el trabajo docente mediante el uso de tecnología web (Cachaga Villegas, 2016).

Aplica la siguiente metodología: el marco de trabajo ágil Scrum para el proceso de desarrollo, con historias de usuario definidas por el director de la institución como dueño del producto; la metodología UWE para el modelado del sistema web (modelos de requerimientos, de contenido, navegacional, de presentación y de procesos); la norma ISO 9126 para la evaluación de la calidad; la norma ISO 17799 para la seguridad; y el modelo COCOMO II para la estimación de costos. Las pruebas de software se realizaron con la herramienta JMeter.

De acuerdo con sus resultados, el sistema permite a la comunidad educativa informarse sobre el seguimiento académico del estudiante y facilita la labor del docente. Asimismo, el proyecto evaluó la calidad del software en términos de funcionalidad, fiabilidad, usabilidad y mantenibilidad, reforzó el control de acceso de los usuarios con el algoritmo MD5 y determinó su costo y beneficio mediante COCOMO II.

Este trabajo aporta al presente proyecto un antecedente local de sistema web de gestión académica para una unidad educativa de la ciudad de La Paz, desarrollado con Scrum y evaluado con normas de calidad. El presente proyecto actualiza ese enfoque con la norma ISO/IEC 25010, que sustituye a la ISO 9126, con tecnologías actuales y con un módulo de análisis predictivo que no forma parte del trabajo de referencia.

La investigación titulada “Analítica de datos del rendimiento académico anual para la toma de decisiones en la carrera de Arquitectura”, elaborada por Edson Marcelo Quispe Ticona en la Carrera de Informática de la Universidad Mayor de San Andrés (La Paz) en el año 2024, tiene como objetivo identificar los factores que influyen en el rendimiento académico de los estudiantes de la Carrera de Arquitectura para que sean considerados en la toma de decisiones educativas (Quispe Ticona, 2024).

Aplica la siguiente metodología: la metodología CRISP-DM, con la recolección de datos personales, socioeconómicos, académicos y de autopercepción de los estudiantes; el preprocesamiento para eliminar valores atípicos y completar datos faltantes; la selección de variables; y la construcción de modelos de regresión (regresión lineal, árboles de decisión y Random Forest) y, posteriormente, de clasificación (regresión logística, árboles de decisión, Random Forest, XGBoost y LightGBM).

De acuerdo con sus resultados, Random Forest fue el modelo de regresión con mejor desempeño, aunque con un bajo coeficiente de determinación, por lo que se optó por modelos de clasificación; entre estos, LightGBM y XGBoost obtuvieron los mejores resultados en precisión, en validación cruzada y en capacidad para distinguir entre clases. En consecuencia, el estudio muestra que los modelos de clasificación resultan más adecuados que los de regresión para predecir el rendimiento académico con los datos disponibles.

Este trabajo aporta al presente proyecto un antecedente departamental del uso de CRISP-DM y Random Forest para predecir el rendimiento académico, y respalda la decisión de abordar la predicción como un problema de clasificación por niveles de riesgo. A diferencia de ese estudio, desarrollado en el nivel universitario y orientado al análisis, el presente proyecto integra el modelo en un sistema web de uso diario en una unidad educativa de secundaria.

## 1.3 Justificación

### 1.3.1 Justificación técnica
El desarrollo del presente proyecto se sustenta en la implementación de una arquitectura de software moderna y escalable, seleccionada específicamente para resolver las limitaciones tecnológicas identificadas en la Unidad Educativa La Paz “A”. La justificación técnica se articula en tres ejes fundamentales:

1. Se utiliza React junto con Tailwind CSS para transformar los procesos manuales y el uso disperso de hojas de cálculo en una plataforma digital intuitiva y responsiva. Esta combinación técnica permite centralizar la información académica de los 1,080 estudiantes en una interfaz que facilita la labor de los 52 docentes, permitiendo una visualización clara del rendimiento mediante dashboards dinámicos que convierten datos planos en información estratégica para la toma de decisiones.
2. La innovación central radica en el uso de Python y la librería scikit-learn para el despliegue de modelos de Machine Learning (Random Forest y Árboles de Decisión). Bajo la metodología CRISP-DM, esta capa técnica permite que el sistema evolucione de un simple repositorio de notas a una herramienta predictiva. El uso de FastAPI garantiza que el procesamiento de patrones de comportamiento estudiantil se realice con alta velocidad, permitiendo a la institución anticipar riesgos de reprobación antes de concluir el trimestre escolar.
3. Para garantizar la integridad y disponibilidad de la información sin requerir que la institución invierta en infraestructura física (servidores), se emplea Supabase como plataforma de Backend as a Service. Esto proporciona una base de datos PostgreSQL robusta y relacional, esencial para mantener la consistencia entre materias, notas y asistencias. Además, esta solución gestiona la autenticación segura y el almacenamiento en la nube, asegurando que el sistema sea accesible de forma protegida para el director, docentes y administrativos desde cualquier dispositivo.

Finalmente, el ecosistema tecnológico seleccionado garantiza que el producto final cumpla con los estándares de calidad de la norma ISO/IEC 25010, asegurando niveles óptimos de seguridad, usabilidad y mantenibilidad en un entorno educativo público.

### 1.3.2 Justificación económica
Un aspecto adicional que refuerza la viabilidad económica del presente proyecto es la ausencia total de costos por concepto de licenciamiento de software. Todas las tecnologías empleadas en el desarrollo del sistema (React, Node.js, PostgreSQL, Python, FastAPI y scikit-learn) son de código abierto y distribución gratuita, lo que elimina cualquier gasto recurrente por concepto de licencias, reduciendo considerablemente el costo total de propiedad del sistema a largo plazo.

En cuanto a los requerimientos de hardware, la Unidad Educativa La Paz "A" cuenta con la infraestructura informática necesaria para el despliegue y funcionamiento del sistema, por lo que no se generan costos adicionales por concepto de adquisición de equipos. Los equipos cliente únicamente requieren un navegador web actualizado para acceder al sistema, condición que es cubierta por los equipos existentes en la institución. En conjunto, al no incurrir en gastos de licenciamiento ni de hardware, el costo total de implementación y mantenimiento del sistema se reduce significativamente, consolidando la propuesta como una solución tecnológica sostenible y accesible para una institución educativa pública.

### 1.3.3 Justificación social
El desarrollo e implementación del presente sistema web genera un beneficio social significativo para la Unidad Educativa La Paz "A", al atender de forma directa tres problemáticas que afectan el funcionamiento institucional y la calidad educativa de la comunidad escolar. En primer lugar, la desorganización administrativa en el manejo de notas, asistencia y horarios impacta negativamente en la eficiencia del trabajo docente y directivo; el sistema resuelve esta situación al centralizar y automatizar dichos procesos, liberando tiempo y recursos humanos que pueden ser redirigidos hacia actividades pedagógicas de mayor valor. En segundo lugar, la reprobación estudiantil constituye uno de los principales indicadores de alerta en la institución; frente a ello, el módulo de predicción de rendimiento basado en Inteligencia Artificial permite identificar anticipadamente a los estudiantes en riesgo antes de que concluya el trimestre, transformando la gestión académica de un modelo reactivo a uno preventivo que favorece la permanencia y el éxito escolar de los estudiantes. En tercer lugar, la falta de comunicación entre la institución y los padres de familia debilita el acompañamiento familiar en el proceso educativo; el módulo de notificaciones automáticas resuelve esta brecha al mantener informados a los tutores de forma oportuna ante situaciones de bajo rendimiento o exceso de inasistencias, fortaleciendo el vínculo entre el hogar y la escuela.

En conjunto, el sistema beneficia a los cuatro actores principales de la comunidad educativa: los estudiantes acceden a información transparente sobre su rendimiento y asistencia, favoreciendo su autorregulación; los docentes optimizan su labor administrativa y cuentan con alertas tempranas para intervenir pedagógicamente; los directivos disponen de información consolidada en tiempo real para tomar decisiones institucionales basadas en datos; y los padres de familia se integran activamente al seguimiento académico de sus hijos. De este modo, el proyecto se alinea con los principios de calidad, equidad e inclusión educativa establecidos en la Ley de Educación N° 070 Avelino Siñani Elizardo Pérez del Estado Plurinacional de Bolivia.

### 1.3.4 Justificación legal
El desarrollo del presente proyecto se enmarca en el cumplimiento de normativas legales y estándares técnicos vigentes, tanto a nivel nacional como internacional, garantizando que el sistema propuesto opere dentro de un marco jurídico y técnico legítimo.

En primera instancia, el sistema se alinea con la Ley N° 070 "Avelino Siñani - Elizardo Pérez", que regula el sistema educativo nacional y promueve el uso de las Tecnologías de la Información y Comunicación (TIC) como herramientas de apoyo al proceso de enseñanza, aprendizaje y gestión institucional. Esta ley respalda la digitalización de los procesos académicos de la Unidad Educativa La Paz "A" como parte de la modernización del sistema educativo boliviano (Gaceta Oficial de Bolivia, 2010).

Asimismo, el tratamiento de los datos personales de estudiantes, docentes y padres de familia se rige por la Ley N° 164 de Telecomunicaciones y Tecnologías de Información y Comunicación. El sistema garantiza los principios de confidencialidad e integridad mediante mecanismos técnicos de autenticación (JWT) y cifrado de alta seguridad (bcrypt), cumpliendo con el uso responsable de sistemas informáticos y la privacidad de la información gestionada por medios digitales (Constitución Política del Estado, 2011). Complementariamente, dada la naturaleza de la población estudiantil, se observa el cumplimiento del Código Niña, Niño y Adolescente (Ley N° 548), asegurando que el uso de datos académicos tenga como fin exclusivo el beneficio pedagógico y la prevención de la reprobación.

En el ámbito internacional, el sistema es desarrollado bajo los criterios de la norma ISO/IEC 25010, que establece el modelo de calidad para el producto software. La aplicación de este estándar garantiza niveles óptimos de funcionalidad, rendimiento, usabilidad y seguridad, verificables a través de los requerimientos no funcionales definidos en este proyecto.

Adicionalmente, el proceso de desarrollo sigue los principios de la metodología ágil Scrum, cuyas prácticas se encuentran alineadas con el estándar ISO/IEC 12207, referido al ciclo de vida del software. Esto asegura un desarrollo estructurado, iterativo y transparente.

En concordancia con las tendencias globales de gobernanza digital, el módulo de predicción de rendimiento estudiantil opera bajo principios de transparencia, beneficio público y no discriminación. El uso de algoritmos de Machine Learning se limita estrictamente a datos académicos internos de la institución y mantiene una supervisión humana permanente en todas las decisiones derivadas de las predicciones generadas, asegurando un despliegue ético y seguro de la tecnología dentro del entorno escolar.

## 1.4 Planteamiento y formulación del problema

### 1.4.1 Descripción del problema
En la Unidad Educativa La Paz "A", la gestión de la información académica atraviesa una crisis de desarticulación tecnológica que afecta directamente la calidad del proceso enseñanza-aprendizaje. Actualmente, el manejo de datos críticos como calificaciones y registros de asistencia se realiza de manera fragmentada, dependiendo de métodos analógicos o herramientas digitales aisladas que no permiten una visión integral del rendimiento de la población estudiantil.

El problema central se manifiesta en la inaccesibilidad de la información académica en tiempo real. Los estudiantes de secundaria carecen de un mecanismo directo para conocer su situación evaluativa durante el transcurso del trimestre, lo que genera una dependencia absoluta del docente para recibir retroalimentación verbal. Esta falta de transparencia informativa produce una desconexión entre el alumno y su proceso formativo, provocando que muchos estudiantes solo cobren conciencia de su desempeño académico cuando los resultados son definitivos y, a menudo, irreversibles.

En cuanto al control de asistencia, la práctica del llamado de lista manual conlleva una pérdida significativa de minutos lectivos y propicia errores en el registro. La ausencia de un sistema centralizado impide que la institución y los padres de familia detecten patrones de inasistencia que suelen ser indicadores tempranos de deserción. Esta carencia de seguimiento constante deja a los estudiantes en una situación de vulnerabilidad, ya que desconocen si están próximos a exceder el límite de faltas permitido para mantener su derecho a evaluación.

A nivel institucional, la problemática se agrava por la incapacidad de realizar un análisis preventivo. La Unidad Educativa La Paz "A" opera bajo un modelo reactivo; es decir, las autoridades y docentes identifican a los estudiantes con riesgo de reprobación únicamente después de que el trimestre ha cerrado. No existe una herramienta que procese los datos históricos y actuales para generar alertas tempranas. Esta falta de análisis predictivo anula la posibilidad de aplicar estrategias pedagógicas de intervención oportuna, convirtiendo el riesgo académico en una realidad de reprobación efectiva para una parte considerable del estudiantado.

Finalmente, la brecha entre la disponibilidad tecnológica de la población (acceso a internet y dispositivos móviles) y la precariedad de los servicios digitales de la institución evidencia una oportunidad desaprovechada. Mientras los procesos sigan anclados a registros físicos o planillas de Excel no compartidas, la gestión académica continuará siendo lenta, propensa a la pérdida de datos y desvinculada de la necesidad de un seguimiento académico moderno y eficiente.

### 1.4.2 Formulación del problema
La ausencia de un sistema integrado de gestión académica en la Unidad Educativa La Paz "A" genera inconsistencias en la información, pérdida de registros físicos y desconocimiento oportuno de la situación académica de los estudiantes imposibilitando una intervención pedagógica oportuna.

#### 1.4.2.1 Problema principal
¿De qué manera se puede optimizar la gestión académica, el rendimiento estudiantil, la eficiencia de los procesos administrativos y contribuir a la identificación oportuna de estudiantes en riesgo de reprobación en la Unidad Educativa La Paz "A" en la ciudad de La Paz?

#### 1.4.2.2 Problemas secundarios
- ¿Cómo afecta la gestión manual y descentralizada del registro de notas y del control de asistencia, realizada por los 52 docentes de la institución, a la consistencia de los datos y a la consolidación ágil y confiable de la información académica de los 1.080 estudiantes?
- ¿De qué manera la pérdida y el extravío de registros físicos comprometen la integridad de la información académica histórica de los estudiantes y el acceso oportuno a los datos de gestiones anteriores para la toma de decisiones institucionales?
- ¿Cómo influye la falta de acceso oportuno de los estudiantes a su información académica durante el trimestre en la autorregulación de su aprendizaje y en la adopción de medidas correctivas a tiempo?
- ¿De qué manera la comunicación lenta e irregular entre la institución y los padres de familia, ante situaciones de bajo rendimiento o exceso de inasistencias, debilita el acompañamiento familiar en el proceso educativo?
- ¿Cómo limita la inexistencia de mecanismos tecnológicos para la identificación temprana de dificultades académicas la detección oportuna de los estudiantes en situación de vulnerabilidad y la capacidad de respuesta pedagógica antes de la conclusión del periodo evaluativo?

## 1.5 Objetivos

### 1.5.1 Objetivo general
Implementar un Sistema Web con Machine Learning para gestión académica y análisis predictivo del rendimiento académico en la Unidad Educativa La Paz “A”.

### 1.5.2 Objetivos específicos
- Analizar la situación actual de la gestión académica y administrativa de la Unidad Educativa La Paz "A".
- Diseñar una arquitectura web que sea sencilla y moderna, organizando cómo se conectarán el panel de control de los profesores con el motor de IA para que el sistema sea rápido y fácil de navegar.
- Desarrollar el sistema integral y el modelo predictivo utilizando Árbol de Decisión y Random Forest, logrando que la plataforma automatice el registro de datos y genere alertas claras sobre el rendimiento de los estudiantes, bajo la metodología CRISP-DM.
- Evaluar qué tan precisas son las predicciones del modelo y qué tan bien funciona la página web en el día a día, asegurándonos de que cumpla con todo lo que el colegio necesita para tomar mejores decisiones.

## 1.6 Alcances, límites y aportes

### 1.6.1 Alcances
El presente proyecto abarca el desarrollo de una solución tecnológica integral diseñada para transformar la gestión de la Unidad Educativa La Paz "A", pasando de un modelo de registro tradicional a una estrategia de prevención activa basada en datos. El proceso de construcción se llevará a cabo bajo el marco de trabajo SCRUM, una metodología ágil que permite avanzar mediante ciclos de entrega cortos y revisiones constantes, asegurando que cada funcionalidad del sistema web cumpla paso a paso con el objetivo de reducir el fracaso escolar.

Para lograr esto, la plataforma establece un entorno seguro mediante un Módulo de Usuarios desarrollado con React y Node.js. Este componente gestiona los roles de Directores, Profesores, Administrativos y Estudiantes, garantizando la privacidad de la información a través de tecnologías de cifrado bcrypt y autenticación JWT. Toda la información será centralizada en una base de datos relacional en PostgreSQL, diseñada con normas de integridad referencial y seguridad basada en roles para proteger los registros académicos de la institución.

La captura de datos clave se realiza de forma estratégica para alimentar el ciclo de vida de la Inteligencia Artificial. Por un lado, el módulo de Control de Asistencia registra las faltas diarias como variables críticas para identificar patrones de abandono. Por otro lado, la Gestión de Notas automatiza el cálculo de promedios trimestrales y anuales, facilitando la labor docente con opciones de exportación a PDF. Este flujo de datos es fundamental para la aplicación de la metodología CRISP-DM, la cual guía el proceso de convertir la información administrativa en predicciones precisas.

El núcleo del sistema reside en su capacidad de análisis predictivo, donde se utiliza FastAPI para ejecutar algoritmos de Árbol de Decisión y Random Forest. Este motor de IA clasifica a los alumnos según su nivel de riesgo en exactamente tres categorías: Sin Riesgo, Riesgo Medio o Riesgo Alto (valores del modelo: `SIN_RIESGO`, `RIESGO_MEDIO`, `RIESGO_ALTO`), presentando los resultados en un Dashboard Interactivo con gráficos visuales para la dirección. Finalmente, el alcance incluye un Módulo de Notificaciones que envía alertas automáticas por correo electrónico a los padres de familia ante Riesgo Alto, asegurando que el sistema sea una herramienta de prevención temprana y efectiva.

### 1.6.2 Límites
- No contempla la gestión de procesos correspondientes al nivel primario ni la administración de aspectos financieros, contables o de recursos humanos de la institución.
- El sistema no incluye el desarrollo de aplicaciones móviles nativas para dispositivos Android o iOS, siendo accesible únicamente a través de navegadores web como Google Chrome, Mozilla Firefox y Microsoft Edge mediante conexión a internet dado que el sistema se aloja en la nube.
- Asimismo, el sistema no contempla la integración con sistemas externos del Ministerio de Educación del Estado Plurinacional de Bolivia ni con plataformas educativas de terceros.
- No se contempla el procesamiento de variables externas como factores socioeconómicos, psicológicos o familiares del estudiante.
- Asimismo, el sistema no incluye funcionalidades de matrículas en línea ni gestión de infraestructura física de la institución.
- El desarrollo, implementación y validación del sistema se circunscribe a la gestión escolar 2026 de la Unidad Educativa La Paz "A".
- El entrenamiento del módulo de Machine Learning se realizará con los datos históricos disponibles en la institución correspondientes a gestiones anteriores.
- El estudio no abarca el seguimiento longitudinal de los resultados académicos posteriores a la implementación, ni la evaluación del impacto a largo plazo sobre las tasas de reprobación y deserción, aspectos que pueden constituir líneas de investigación futuras. Tampoco contempla la implementación en otras instituciones, aunque el diseño modular del software lo haría técnicamente viable.

### 1.6.3 Aportes

#### 1.6.3.1 Aportes del proyecto
El presente proyecto representa un aporte significativo en los ámbitos tecnológico, institucional y social, al proponer una solución innovadora que integra la gestión administrativa con el análisis predictivo para responder a las necesidades reales de la Unidad Educativa La Paz "A".

En el ámbito tecnológico, el proyecto demuestra la aplicabilidad de herramientas de vanguardia y de código abierto en contextos educativos locales. Al integrar frameworks modernos con modelos de Machine Learning (Árbol de Decisión y Random Forest) bajo la metodología CRISP-DM, se establece un precedente técnico sobre cómo transformar registros estáticos en una arquitectura inteligente y escalable. Este enfoque no solo moderniza la infraestructura de software de la institución, sino que fomenta la adopción de soluciones de bajo costo y alto impacto científico.

Desde una perspectiva académica e institucional, el sistema aporta valor al permitir un control preventivo sobre el rendimiento escolar. Al automatizar el seguimiento de asistencias y calificaciones, se logra reducir el error humano y ahorrar tiempo operativo del personal docente. El aporte principal radica en la capacidad de generar alertas tempranas de reprobación, lo cual fortalece la imagen institucional y permite una comunicación directa y oportuna con los padres de familia, mejorando sustancialmente la calidad del servicio educativo y el éxito estudiantil.

#### 1.6.3.2 Aporte académico o ingenieril
Desde el punto de vista académico, el presente proyecto constituye un aporte significativo en el campo de la Ingeniería de Sistemas aplicada a la educación, al demostrar la viabilidad de integrar técnicas de Machine Learning en un sistema de gestión académica real en el contexto boliviano. La investigación se desarrolló bajo un enfoque metodológico mixto, combinando métodos cualitativos mediante la observación directa en la institución para el diagnóstico de la problemática, y métodos cuantitativos a través del análisis y evaluación de los algoritmos de Machine Learning empleados, midiendo su precisión, recall y F1-score para determinar el modelo con mejor desempeño predictivo.

Para el desarrollo del sistema web se aplicó la metodología ágil Scrum, organizando el trabajo en sprints con entregables incrementales que permitieron validar cada módulo de forma progresiva. Para el desarrollo específico del módulo de Inteligencia Artificial se aplicó la metodología CRISP-DM (Cross Industry Standard Process for Data Mining), estándar ampliamente reconocido en proyectos de minería de datos y aprendizaje automático, que estructuró el proceso en las fases de comprensión del negocio, comprensión de los datos, preparación de los datos, modelado, evaluación e implementación del modelo predictivo.

La innovación central del proyecto reside en la incorporación de un módulo de análisis predictivo basado en Inteligencia Artificial dentro de un sistema de gestión académica escolar, funcionalidad que no existe actualmente en las instituciones de educación secundaria pública de Bolivia, posicionando al proyecto como un referente para futuras investigaciones en el área de sistemas inteligentes aplicados a la gestión educativa boliviana.

---

# CAPÍTULO II. MARCO INSTITUCIONAL

## 2.1 Antecedentes de la institución
La Unidad Educativa La Paz "A", anteriormente conocida como el Liceo de Señoritas La Paz, es una institución emblemática de educación secundaria de carácter público fundada el 13 de febrero de 1948 por la profesora Alicia Pizarro del Castillo, mediante Resolución Ministerial N° 7885 del 19 de julio de 1948, en homenaje al IV centenario de la fundación de la ciudad de La Paz. La institución fue creada originalmente como anexo del Liceo Venezuela, con el propósito de fomentar el acceso a la educación femenina en la ciudad, funcionando inicialmente en ambientes del Hotel Hamburgo, en las proximidades de la Plaza Murillo, antes de trasladarse a su ubicación actual en la calle Campero N° 51, en el centro de la ciudad de La Paz, Bolivia.

A lo largo de su trayectoria institucional, la Unidad Educativa La Paz ha evolucionado significativamente en su estructura y organización, dando lugar a dos turnos de funcionamiento: el turno de la mañana, correspondiente a la Unidad Educativa La Paz "A", y el turno de la tarde, correspondiente a la Unidad Educativa La Paz "B", ambos bajo una misma dirección institucional. En 2025, la institución celebró 77 años de servicio continuo a la educación boliviana, consolidándose como un referente educativo en la ciudad de La Paz. Actualmente, la institución atiende a una población de 1.080 estudiantes distribuidos en el nivel de educación secundaria, con una planta docente conformada por 52 profesores.

## 2.2 Estructura orgánica
La estructura orgánica de la Unidad Educativa La Paz “A” es de tipo jerárquico: la Dirección General ejerce la conducción de la institución y de ella dependen la Subdirección Académica, las comisiones especializadas y la planta docente, conformada por 52 profesores. Esta organización se representa gráficamente en el organigrama institucional.

## 2.3 Servicios
La Unidad Educativa La Paz "A" ofrece los siguientes servicios educativos a su comunidad:
- **Educación Secundaria Regular:** la institución brinda formación académica en los seis niveles de educación secundaria, desde primero hasta sexto de secundaria, en el turno de la mañana.
- **Formación en valores:** la institución promueve activamente la formación cívica, ética y moral de sus estudiantes como parte de su enfoque educativo integral.
- **Actividades extracurriculares:** la institución desarrolla actividades artísticas y culturales, entre las que destacan el ballet folclórico y el coro institucional, que complementan la formación académica de los estudiantes.

## 2.4 Visión
Ser un referente nacional en educación regular, formando jóvenes líderes con alta capacidad de adaptación, visión de futuro y comprometidos con el desarrollo de su sociedad.

## 2.5 Misión
Proporcionar un servicio educativo integral y holístico que fortalezca el desarrollo cognitivo y personal de los estudiantes, fomentando la responsabilidad, la disciplina y el respeto, en un ambiente que promueve la convivencia armónica y el valor de la cultura de paz.

## 2.6 Organigrama
**Figura 1** *Organigrama de la Unidad Educativa La Paz “A”*
*Nota.* El organigrama de la Unidad Educativa La Paz "A" representa gráficamente la estructura organizacional de la institución, evidenciando la relación jerárquica entre la Dirección General, la Subdirección Académica, las Comisiones especializadas y la Planta Docente. (Organigrama, 2025).

---

# CAPÍTULO III. MARCO TEÓRICO

## 3.1 Marco histórico
La Unidad Educativa La Paz "A", desde su fundación, ha desempeñado un rol fundamental en la formación académica de la comunidad estudiantil en la ciudad de La Paz, evolucionando constantemente para adaptarse a las normativas del Ministerio de Educación de Bolivia. A lo largo de su trayectoria institucional, la gestión de la información académica, el control de asistencia y el seguimiento del rendimiento de sus estudiantes se ha basado tradicionalmente en métodos analógicos y registros físicos centralizados en kárdex manuales. Este modelo histórico, aunque funcional en sus inicios, ha enfrentado desafíos crecientes debido al incremento de la población estudiantil, que actualmente alcanza los 1.080 alumnos. El registro histórico de la institución refleja una transición necesaria hacia la modernización tecnológica, impulsada por la necesidad de superar la fragmentación de los datos y la falta de herramientas preventivas que permitan una intervención pedagógica oportuna frente al riesgo de reprobación escolar.

### 3.1.1 Evolución de los sistemas de gestión académica
La gestión de la información en el ámbito educativo ha experimentado una metamorfosis radical, transitando de herramientas manuales aisladas hacia ecosistemas digitales integrados que han redefinido la administración escolar. Esta evolución se puede trazar desde sus orígenes en las décadas de 1960 y 1970, periodos caracterizados por una gestión puramente analógica y centralizada, donde el enfoque principal era el registro escolar básico y el control de datos mediante métodos tradicionales de archivo físico. Con el advenimiento de la automatización inicial en los años 80 y 90, se introdujeron herramientas de ofimática y las primeras bases de datos relacionales, permitiendo digitalizar tareas administrativas específicas y reducir significativamente los tiempos de procesamiento de información en las instituciones. A partir de la década de los 2000, denominada como la Era Digital y Web, se consolidaron formalmente los Sistemas de Gestión Académica (SGA) y las plataformas de gestión educativa en línea. Este hito permitió la centralización de matrículas, calendarios de evaluación y registros de calificaciones en servidores web, optimizando recursos y minimizando los errores críticos derivados de la transcripción manual de datos. En la actualidad, nos encontramos en la etapa de Integración y Computación en la Nube, donde las plataformas conectan en tiempo real a docentes, estudiantes y directivos mediante arquitecturas escalables. Hoy en día, un SGA moderno trasciende la simple automatización; integra componentes estratégicos como la gestión de currículos, la evaluación mediante reportes de progreso y, fundamentalmente, la generación de inteligencia institucional para la toma de decisiones basadas en datos. (ETNA, 2023; CFU Digital, 2025)

### 3.1.2 Desarrollo de aplicaciones web en educación
El desarrollo de aplicaciones web orientadas al ámbito pedagógico ha experimentado una expansión sin precedentes, transformando el paradigma tradicional de enseñanza en un ecosistema digital accesible, dinámico y escalable. Históricamente, la tecnología educativa ha dejado de ser una herramienta complementaria para consolidarse como un pilar fundamental del sistema instruccional moderno, impulsada por la exigencia de personalizar el aprendizaje y elevar el compromiso del estudiante mediante entornos adaptativos. Esta evolución se vio drásticamente acelerada por la emergencia sanitaria del año 2020, periodo en el que la implementación de ecosistemas web y aulas virtuales se tornó obligatoria para asegurar la continuidad pedagógica a través de la educación a distancia. Desde una perspectiva de ingeniería y funcionalidad, las aplicaciones web educativas han evolucionado hacia la ubicuidad, permitiendo el acceso concurrente a contenidos sin restricciones de tiempo o ubicación geográfica. La transición de materiales estáticos hacia recursos multimedia interactivos —que integran video, audio y elementos gamificados— ha demostrado un impacto positivo en el rendimiento académico y en la motivación intrínseca del alumnado. Plataformas pioneras en la sincronización de datos y el trabajo cooperativo marcaron hitos históricos al facilitar la colaboración en tiempo real y la gestión organizativa basada en la nube, eliminando la dependencia de software local especializado. Finalmente, la trayectoria histórica de estas herramientas evidencia una tendencia irreversible hacia la especialización y la analítica de datos avanzada. El desarrollo de software capaz de procesar problemas complejos o realizar encuestas dinámicas en vivo demuestra que las aplicaciones han dejado de ser simples repositorios de información para convertirse en instrumentos de investigación estratégica. Esta evolución permite que los administradores educativos capturen métricas de rendimiento en tiempo real, facilitando la toma de decisiones basada en evidencia para el diseño de una experiencia estudiantil integral y eficiente. (Ortega C., 2023)

### 3.1.3 Evolución de la inteligencia artificial aplicada a la educación y marcos normativos
La trayectoria histórica de la Inteligencia Artificial (IA) en el ámbito educativo ha pasado de ser una herramienta experimental para convertirse en un motor estratégico para alcanzar los Objetivos de Desarrollo Sostenible (ODS 4). A diferencia de las Tecnologías de la Información y Comunicación (TIC) convencionales, la evolución de la IA se distingue por su capacidad única de imitar comportamientos humanos y remodelar profundamente los sistemas pedagógicos. Históricamente, este avance ha planteado desafíos éticos sin precedentes en áreas de equidad, transparencia y privacidad. En respuesta a esto, organismos internacionales como la UNESCO han liderado la creación de marcos regulatorios, destacando hitos como el Consenso de Beijing (2010) y las Recomendaciones sobre la Ética de la IA (2021). Estos documentos marcan un cambio de paradigma: la transición de una IA meramente instrumental hacia una "IA centrada en el ser humano", cuyo objetivo principal es reducir la brecha tecnológica y garantizar que la innovación no sustituya, sino que potencie las capacidades intelectuales de estudiantes y docentes.

En la actualidad, la integración de la IA en las aulas se rige por marcos de competencias desarrollados entre 2023 y 2024, diseñados para preparar a las instituciones ante la rapidez de los cambios tecnológicos. Para los estudiantes, la evolución ha pasado del consumo pasivo de software educativo al diseño de sistemas de IA, fomentando el pensamiento crítico y la resolución de problemas mediante el aprendizaje interdisciplinar en áreas STEM y estudios sociales. Por otro lado, para el cuerpo docente, la IA ha evolucionado hacia una herramienta de apoyo al desarrollo profesional y la pedagogía innovadora. Estos marcos de competencias actuales subrayan que la IA debe ser utilizada de manera segura y responsable, enfatizando que las herramientas tecnológicas deben complementar la labor del profesor, sin socavar su responsabilidad social ni su juicio pedagógico. Esta visión es fundamental para proyectos como el presente, que buscan aplicar análisis predictivo en una unidad educativa fiscal, asegurando que los algoritmos de Machine Learning operen bajo principios éticos de inclusión y dignidad humana. (UNESCO, 2024)

### 3.1.4 Historia del Machine Learning
La historia del Aprendizaje Automático o Machine Learning no es un fenómeno contemporáneo, sino el resultado de más de ocho décadas de evolución en la intersección de la matemática, la estadística y la computación. Sus cimientos se establecieron en 1943 con el trabajo de Walter Pitts y Warren McCulloch, quienes presentaron el primer modelo matemático de redes neuronales, sentando las bases para simular la actividad nerviosa mediante el cálculo lógico. Este avance fue complementado en 1949 por Donald Hebb en su obra *La organización del comportamiento*, donde introdujo teorías sobre la plasticidad cerebral y el fortalecimiento de las conexiones neuronales, principios que hoy rigen el entrenamiento de algoritmos. Un hito filosófico y técnico fundamental ocurrió en 1950, cuando Alan Turing propuso la famosa "Prueba de Turing" en su artículo *Máquinas de computación e inteligencia*, planteando la pregunta fundamental de si las máquinas pueden pensar y estableciendo los criterios para medir la inteligencia artificial real. El desarrollo operativo del ML comenzó formalmente en 1952, cuando Arthur Samuel escribió el primer programa de aprendizaje para el juego de damas en una computadora IBM, logrando que el sistema mejorara su estrategia a través de la experiencia. Posteriormente, en 1957, Frank Rosenblatt diseñó el "Perceptrón", la primera red neuronal práctica para ordenadores, destinada al reconocimiento de patrones. Tras un periodo de refinamiento, en 1967 se introdujo el algoritmo del "Vecino más cercano" (*Nearest Neighbor*), permitiendo a las máquinas utilizar el reconocimiento de patrones para la optimización de rutas y clasificación básica. Durante las décadas de 1980 y 1990, el enfoque del ML transitó de una programación basada en reglas y conocimientos hacia un paradigma basado puramente en datos. En este periodo surgieron algoritmos de clasificación robustos y se alcanzó un hito mediático en 1997, cuando la computadora *Deep Blue* de IBM venció al campeón mundial de ajedrez, demostrando la potencia del procesamiento algorítmico sobre la intuición humana en entornos complejos. A partir del año 2006, el término "Aprendizaje Profundo" (*Deep Learning*), acuñado por Geoffrey Hinton, revolucionó la disciplina al permitir que las computadoras procesaran imágenes y videos con una precisión similar a la humana. En la década de 2010, hitos como el desarrollo de *Google Brain* y la victoria de *Watson* de IBM en *Jeopardy* marcaron la transición hacia sistemas capaces de procesar lenguaje natural y categorizar objetos de forma autónoma. Desde 2020 hasta la actualidad, la aparición de modelos masivos como GPT-3 de OpenAI, con 175 mil millones de parámetros, ha consolidado al Machine Learning como una herramienta capaz de generar texto y conocimiento predictivo con una fluidez humana. (Firican, 2023)

### 3.1.5 Digitalización educativa en Bolivia
La digitalización educativa en Bolivia ha transitado por un sendero de profundas disparidades estructurales, donde la brecha tecnológica entre los centros urbanos y las comunidades rurales o periurbanas ha definido la agenda de desarrollo nacional. Históricamente, mientras en las áreas metropolitanas se ha iniciado el debate sobre la inteligencia artificial y el emprendimiento digital, en gran parte del territorio nacional la carencia de conectividad básica persiste como una barrera crítica para el progreso institucional. No obstante, para el periodo 2023-2025, han surgido iniciativas disruptivas como ConexiónLab, un modelo impulsado por la ONG Conexión ICCO Cooperación con el respaldo del Banco Interamericano de Desarrollo (BIDLab). Este proyecto ha marcado un hito histórico al capacitar a cerca de 9,000 jóvenes en competencias digitales de alta demanda, demostrando que la transformación de las oportunidades en Bolivia depende directamente del acceso democrático a la tecnología y de una formación técnica actualizada. La evolución de la alfabetización digital en el país se ha estructurado recientemente mediante niveles de formación progresiva que responden a las dinámicas del mercado laboral boliviano. Desde el aprendizaje de herramientas básicas para la creación de contenido hasta especializaciones avanzadas en ciencia de datos (Data Science), diseño de experiencia de usuario (UX Design) y desarrollo de software (Master of Coding), la juventud boliviana ha comenzado a reconfigurar su espectro de posibilidades profesionales. Un aspecto técnico y logístico relevante en esta trayectoria es la implementación de soluciones innovadoras como la Escuela Móvil Miska y la tecnología de antenas portátiles Nita, infraestructuras diseñadas para desplegar conocimiento digital en zonas remotas sin cobertura previa. Estos esfuerzos, avalados por el Ministerio de Educación, han permitido que para el año 2025 se consoliden ecosistemas integrales como la plataforma conexionlab.net. Estas infraestructuras digitales logran unificar el aprendizaje continuo, la intermediación laboral y la mentoría empresarial, fomentando un liderazgo conectado y ético en la región. Este panorama de modernización tecnológica en Bolivia justifica y respalda la implementación de soluciones como la analítica predictiva en las unidades educativas, orientadas a optimizar el rendimiento académico mediante el uso estratégico de la información. (Aramayo, 2024)

## 3.2 Marco conceptual

### 3.2.1 Sistema web
Un sistema web, de acuerdo con la definición establecida por Camila (2024), se constituye como un tipo de software especializado que se ejecuta en servidores remotos y cuya interacción se realiza exclusivamente a través de un navegador web. A diferencia de las aplicaciones de escritorio tradicionales, que demandan procesos complejos de instalación en hardware local, los sistemas web operan sobre la infraestructura de internet, permitiendo que el usuario final acceda a las funcionalidades del programa sin necesidad de software adicional. Esta naturaleza técnica los define como herramientas independientes de la plataforma, lo que significa que su operatividad no está condicionada a un sistema operativo específico (como Windows, Linux o macOS), garantizando una flexibilidad y accesibilidad total desde cualquier dispositivo con conexión a la red.

En el ámbito de la ingeniería de software, estos sistemas se distinguen por una serie de atributos técnicos que optimizan la gestión organizacional. Entre sus características principales destacan la implementación de protocolos de cifrado y firewalls que protegen la integridad de los datos alojados. Asimismo, la arquitectura de un sistema web moderno promueve la eficiencia operativa al centralizar la información, eliminando la duplicidad de datos y facilitando la actualización automática de funciones para todos los usuarios de forma simultánea, lo cual reduce drásticamente los costos de mantenimiento técnico. (Camila, 2024)

### 3.2.2 Gestión académica
La gestión académica se define, según Viveros y Sánchez (2018), como el conjunto de prácticas recurrentes que permiten a una institución educativa asegurar la coherencia entre su propuesta curricular, el Proyecto Educativo Institucional (PEI) y las necesidades reales de aprendizaje de sus estudiantes. Más allá de una simple administración de horarios, esta disciplina se enfoca en la transformación de la educación mediante la optimización de cuatro procesos fundamentales: el diseño pedagógico (currículo), las prácticas pedagógicas, la gestión de aula y el seguimiento académico. En este sentido, la gestión académica actúa como un sistema dinámico donde el docente deja de ser un mero transmisor de información para convertirse en un facilitador y gestor del aprendizaje, capaz de organizar y repensar su práctica pedagógica para fomentar un cambio positivo tanto en la institución como en la sociedad. Desde una perspectiva operativa, la gestión académica implica un ciclo constante de diagnóstico, planeación, ejecución y evaluación. Como señalan los autores, este proceso incluye el diseño de la propuesta curricular y su puesta en práctica, pero destaca especialmente en el "seguimiento académico", el cual abarca el control de resultados, la asistencia y el apoyo pedagógico para estudiantes con dificultades. La eficiencia de esta gestión se mide por su capacidad de generar una cultura de colaboración y de utilizar los resultados de las evaluaciones para la mejora continua de los aprendizajes. Bajo modelos contemporáneos, la gestión académica busca que la institución funcione como un "laboratorio" donde la didáctica se apoya en técnicas y métodos que promueven la reflexión crítica, la autonomía del estudiante y la toma de decisiones basada en evidencias de desempeño real. (Viveros & Sánchez, 2018)

### 3.2.3 Rendimiento académico
El rendimiento académico se define, en términos generales, como el nivel de conocimientos demostrado por un estudiante en un área específica, comparado con la norma de edad y nivel académico (Jiménez, 2000). Sin embargo, según Edel (2003), este fenómeno es multifactorial y complejo, ya que no depende únicamente de la capacidad intelectual o la inteligencia, sino de una interacción dinámica entre variables cognitivas, afectivas y sociales. En este contexto, surgen autopercepciones críticas como la habilidad y el esfuerzo, donde el estudiante busca ser reconocido por su capacidad, mientras que el sistema escolar tiende a valorar más el esfuerzo invertido. De acuerdo con el modelo de Covington (1984), el juego de valores entre habilidad y esfuerzo puede generar diferentes perfiles de estudiantes: aquellos orientados al dominio (exitosos y seguros), los que aceptan el fracaso (derrotistas con desesperanza aprendida) y los que evitan el fracaso (que emplean estrategias como la mínima participación para proteger su autoestima). Esta dinámica convierte al rendimiento en un fenómeno que va más allá de una calificación cuantitativa, involucrando procesos de motivación escolar, autocontrol y el desarrollo de habilidades sociales, las cuales son predictores más exactos del éxito a largo plazo que el propio Coeficiente Intelectual (CI). (Edel, 2003)

### 3.2.4 Inteligencia artificial
La evolución de la Inteligencia Artificial (IA) se analiza actualmente como la transformación tecnológica más relevante del siglo XXI, proyectando un impacto que algunos autores comparan con la aparición de la vida misma, superando con creces las revoluciones industriales previas. Según Cabanelas (2019), la IA se define como la capacidad de un sistema computacional para realizar tareas comúnmente asociadas a la inteligencia humana, tales como la percepción, asociación, predicción y control. Esta disciplina se divide en tres fases críticas que marcan su trayectoria histórica y futura: en primer lugar, la Inteligencia Artificial Débil (IAD), centrada en la automatización y el aprendizaje de patrones específicos (fase en la que se encuentra la tecnología actual); en segundo lugar, la Inteligencia Artificial General (IAG), que busca replicar la capacidad adaptativa y abstracta del cerebro humano; y finalmente, la Súper Inteligencia Artificial (SIA), un estadio donde las máquinas superarán la red de cerebros humanos conectados en creatividad y habilidades sociales. (Cabanelas, 2019)

### 3.2.5 Machine Learning
El Machine Learning o aprendizaje automático se define, según Ruiz Guevara (2023), como una rama de la inteligencia artificial cuya característica distintiva es la capacidad de las máquinas para adquirir, e incluso generar, nuevos conocimientos de manera autónoma, trascendiendo la información que se les ha suministrado inicialmente. A diferencia de la programación convencional basada en reglas rígidas, este paradigma se refiere a la habilidad de los sistemas para aprender a partir del análisis de datos masivos que van adquiriendo por sí solos. En la actualidad, este concepto es el responsable de la "explosión" de la inteligencia artificial, ya que permite que los algoritmos identifiquen patrones complejos y tomen decisiones informadas sin haber sido explícitamente programados para cada escenario posible, convirtiéndose en una herramienta de análisis dinámico en constante evolución. Técnicamente, el funcionamiento del Machine Learning se sustenta en el procesamiento de grandes volúmenes de datos para encontrar correlaciones y tendencias que pasan desapercibidas para el ojo humano. Este proceso de aprendizaje se divide generalmente en tres tipos: supervisado, donde el sistema aprende de datos etiquetados previamente; no supervisado, donde busca estructuras ocultas en datos sin etiquetas; y por refuerzo, basado en un sistema de recompensas y penalizaciones. La eficacia de un modelo de aprendizaje automático depende de la calidad y cantidad de los datos analizados, lo que permite pasar de un enfoque descriptivo (qué pasó) a un enfoque predictivo (qué pasará). Esta capacidad de anticipación es lo que sitúa al Machine Learning como el núcleo tecnológico de los sistemas modernos de apoyo a la decisión en diversos sectores estratégicos. (Ruiz, 2023)

### 3.2.6 Análisis predictivo
El análisis predictivo se define como un conjunto de técnicas estadísticas y de minería de datos que permiten identificar patrones históricos para formular reglas y predicciones sobre eventos futuros. En la actualidad, esta disciplina ha experimentado un crecimiento exponencial debido a la capacidad de las tecnologías de la información para almacenar y procesar grandes volúmenes de datos (Big Data). A diferencia del análisis descriptivo tradicional, que solo explica qué sucedió, el análisis predictivo busca determinar qué es probable que ocurra, convirtiéndose en una herramienta crítica para la toma de decisiones en administraciones, empresas y organizaciones educativas. La implementación del análisis predictivo requiere de herramientas informáticas avanzadas capaces de detectar tendencias ocultas en los datos. Si bien existen plataformas propietarias de alto costo, el ecosistema de código abierto (Open Source) ha demostrado cumplir con todos los requerimientos técnicos necesarios mediante lenguajes y librerías especializadas. Este enfoque permite que el análisis no sea solo una observación estadística, sino un motor de reglas automatizadas que se adaptan conforme la información evoluciona, garantizando resultados precisos y validados científicamente. (Espino, 2027)

### 3.2.7 Árbol de decisión ID3
El modelo de clasificación ID3, desarrollado por J. Ross Quinlan, se define como un sistema de aprendizaje supervisado que utiliza la estrategia de "divide y vencerás" para la toma de decisiones y la automatización de tareas. Este algoritmo es capaz de modelar el comportamiento humano mediante la creación de estructuras lógicas que imitan la comprensión y el reconocimiento de patrones. Su filosofía principal radica en la capacidad de establecer leyes generales a partir de la observación de ejemplos específicos, representando el conocimiento en forma de un grafo o árbol jerárquico. En esta estructura, el nodo principal o raíz actúa como el punto de partida de una secuencia de preguntas sobre los atributos de un objeto, las cuales se evalúan con el propósito de obtener la clasificación más precisa posible en los nodos terminales o "hojas". Desde un punto de vista matemático y probabilístico, el ID3 se fundamenta en el concepto de entropía, que actúa como una medida de incertidumbre o desorden dentro de un conjunto de datos. El objetivo del algoritmo es seleccionar, en cada paso, el atributo que posea el mayor poder discriminatorio, es decir, aquel que maximice la "ganancia de información" y reduzca la entropía. Para una muestra homogénea, la entropía es igual a cero, mientras que una distribución equitativa de clases genera una entropía máxima de uno. Mediante este proceso iterativo, el sistema descarta atributos ya evaluados y subdivide el problema en subconjuntos más pequeños y específicos hasta alcanzar una decisión final, permitiendo que la información se mantenga organizada y sea fácilmente interpretable por cualquier usuario. (Quinlan, 2020)

### 3.2.8 Random Forest
El algoritmo de Bosques Aleatorios, conocido técnicamente como Random Forest, representa una técnica avanzada de aprendizaje supervisado desarrollada por Leo Breiman y Adele Cutler, la cual consiste en una combinación de múltiples árboles de decisión entrenados de manera independiente. De acuerdo con la literatura técnica (Breiman, 2001), este método constituye una modificación sustancial de la técnica de bagging (agregación por arranque), donde se construye una vasta colección de árboles no correlacionados para luego promediar sus predicciones. La esencia de este algoritmo radica en reducir la varianza y el ruido inherente a los árboles de decisión individuales, logrando capturar estructuras de interacción complejas en los datos con un nivel de precisión significativamente mayor. Operativamente, el funcionamiento de un Random Forest se basa en dos pilares fundamentales: el subconjunto aleatorio de datos y el subconjunto aleatorio de atributos. Durante el proceso de construcción, cada árbol se entrena utilizando una muestra aleatoria del conjunto de datos total. Además, en cada nodo del árbol, el algoritmo selecciona aleatoriamente un subconjunto de variables o atributos para determinar la mejor partición. Al finalizar el entrenamiento de todos los árboles (que pueden ser cientos o miles), la predicción final se obtiene mediante un mecanismo de votación mayoritaria para tareas de clasificación o mediante el promedio de los resultados para tareas de regresión. Este enfoque de "sabiduría de masas" permite que el modelo mantenga una alta exactitud incluso cuando existe una gran proporción de datos perdidos o ruidosos. (Breiman, 2025)

### 3.2.9 Metodología CRISP-DM
La metodología CRISP-DM se define como el estándar industrial de facto para el desarrollo de proyectos de minería de datos y ciencia de datos. Surgida a finales de la década de los 90 a través de un consorcio de empresas líderes como DaimlerChrysler y SPSS, esta metodología propone un proceso cíclico e iterativo compuesto por seis fases interrelacionadas que buscan alinear el análisis técnico de los datos con los objetivos estratégicos de una organización. A diferencia de las metodologías de desarrollo de software tradicionales, CRISP-DM es independiente de la industria y de las herramientas tecnológicas específicas, enfocándose en la transformación de datos crudos en conocimiento accionable y valor real para la toma de decisiones.

Su nombre corresponde a las siglas de Cross-Industry Standard Process for Data Mining; publicada originalmente en 1999 para estandarizar los procesos analíticos, se ha consolidado como la metodología más utilizada en proyectos de análisis y aprendizaje automático (Shearer, 2000).

El ciclo de vida de esta metodología se estructura en seis etapas críticas:
1. **Comprensión del Negocio:** donde se definen los objetivos y requisitos desde una perspectiva institucional.
2. **Comprensión de los Datos:** que implica la recolección inicial y exploración de la calidad de la información.
3. **Preparación de los Datos:** fase dedicada a la limpieza, transformación y selección de variables.
4. **Modelado:** donde se aplican técnicas matemáticas y algoritmos específicos.
5. **Evaluación:** para validar que los resultados del modelo cumplen con las expectativas planteadas.
6. **Implementación:** que consiste en la puesta en marcha del modelo en un entorno de producción real. Debido a su naturaleza no lineal, CRISP-DM permite retroceder a fases anteriores para refinar los resultados, garantizando que el modelo final sea robusto y preciso ante los cambios en el entorno de los datos. (Chrysler, 2024)

### 3.2.10 Arquitectura cliente-servidor
La arquitectura cliente-servidor se define como un modelo de diseño de software en el que las tareas se distribuyen de manera lógica entre los proveedores de recursos o servicios, denominados servidores, y los demandantes, llamados clientes. En este esquema, el proceso se basa en una red de comunicación donde el cliente inicia peticiones de servicio y el servidor procesa dichas solicitudes para entregar una respuesta bajo protocolos estandarizados, generalmente mediante el protocolo de transferencia de hipertexto o HTTP. En el modelo distribuido, el cliente representa la capa de presentación o interfaz de usuario, cuya función primordial es actuar como el punto de interacción entre el sistema y el operador humano a través de un entorno de ejecución como un navegador web. Sus responsabilidades teóricas incluyen la gestión de la interfaz mediante componentes visuales, la generación de solicitudes asíncronas hacia los puntos de enlace del servidor para la recuperación de datos y el renderizado de la información recibida para transformarla en contenido comprensible para el usuario final.

Por su parte, el servidor constituye la capa lógica y de servicios del sistema, encargada de centralizar el procesamiento de datos, la aplicación de reglas de negocio y la seguridad institucional. En arquitecturas modernas y escalables, esta capa suele subdividirse en componentes especializados que separan la persistencia de datos de la lógica de cómputo. El componente de almacenamiento gestiona la información en bases de datos relacionales, garantizando la integridad de los registros y el control de acceso mediante políticas de seguridad centralizadas. Asimismo, en sistemas que integran modelos avanzados de análisis, el servidor puede derivar tareas de alto procesamiento a servicios especializados que ejecutan algoritmos de aprendizaje automático, los cuales procesan grandes volúmenes de datos para devolver únicamente resultados estratégicos, optimizando así el rendimiento general de la plataforma. El funcionamiento de este modelo sigue una secuencia cíclica estructurada que comienza con una solicitud formal emitida por el cliente con parámetros específicos, seguida por un procesamiento en el que el servidor valida la identidad del solicitante y ejecuta la lógica necesaria. Finalmente, el servidor devuelve un objeto de datos que el cliente interpreta para actualizar su estado visual. Desde una perspectiva de ingeniería de software, esta arquitectura proporciona beneficios intrínsecos como la centralización de la seguridad en entornos controlados, la escalabilidad para gestionar múltiples peticiones simultáneas mediante la distribución de carga y un mantenimiento simplificado. Esto último permite que las modificaciones en la lógica de negocio o en los algoritmos se apliquen directamente en el servidor, impactando de manera inmediata en todos los clientes conectados sin requerir actualizaciones en los dispositivos locales de los usuarios. (García de Zúñiga, 2025; Tanenbaum, 2009)

**Figura 2** *Diagrama cliente-servidor*
*Nota.* Elaborado por Tanenbaum (2009).

### 3.2.11 Patrón Modelo-Vista-Controlador (MVC)
El patrón Modelo-Vista-Controlador se define como un estándar fundamental en la ingeniería de software para el desarrollo de aplicaciones con interfaces de usuario, cuyo objetivo primordial es la separación de responsabilidades dentro de un sistema. Esta arquitectura divide el software en tres capas independientes y especializadas: la lógica de gestión de datos, la lógica de control y la interfaz de interacción con el usuario. Esta segmentación permite mejorar la mantenibilidad y la escalabilidad de los proyectos tecnológicos, facilitando el desarrollo paralelo de sus componentes y asegurando que las modificaciones en una de las capas tengan un impacto mínimo o nulo en las demás. Dentro de esta estructura, la capa del Modelo representa la estructura lógica de la información y las reglas de negocio que rigen el comportamiento del sistema. Su función principal es gestionar todas las interacciones directas con los mecanismos de almacenamiento de datos, abstrayendo la complejidad de las consultas y la manipulación de registros. Teóricamente, el Modelo se apoya en componentes especializados como los Objetos de Transferencia de Datos para el intercambio eficiente de información entre capas y los Objetos de Acceso a Datos, encargados exclusivamente de ejecutar las operaciones de persistencia, recuperación y actualización de la información procesada. La Vista constituye la capa de presentación con la que interactúa el usuario final, encargándose de transformar los datos procesados en una representación visual comprensible. Su naturaleza es strictly informativa y estética, lo que implica que carece de conocimiento sobre el origen de los datos o los algoritmos utilizados para generarlos. El Controlador, por su parte, actúa como el intermediario crítico entre la Vista y el Modelo, recibiendo las peticiones del usuario desde la interfaz para invocar la lógica necesaria y coordinar la respuesta adecuada. Esta gestión centralizada de solicitudes permite procesar eventos complejos, orquestar el flujo de información hacia servicios externos de procesamiento y actualizar el estado de la interfaz de manera coherente. La adopción del patrón MVC en el desarrollo de soluciones web proporciona ventajas competitivas esenciales, entre las que destaca la independencia funcional de sus componentes. Esta autonomía permite actualizar la interfaz visual sin comprometer la integridad de la lógica de procesamiento o los algoritmos de análisis. Asimismo, favorece la reutilización de código mediante componentes de acceso a datos que pueden ser empleados por diversos módulos del sistema sin necesidad de duplicación. Finalmente, la organización estructural que ofrece este patrón simplifica el mantenimiento técnico, permitiendo que la detección y corrección de errores sea un proceso más eficiente, optimizando los tiempos de depuración y asegurando la robustez del software a largo plazo. (Camarena, Trueba, & Martínez, 2012)

### 3.2.12 API REST
Una API REST se define, bajo los principios establecidos por el Dr. Roy Fielding en el año 2000, como un estilo de arquitectura de software diseñado para la creación de servicios web escalables y eficientes. A diferencia de otros modelos de comunicación, REST no es un protocolo rígido, sino un conjunto de restricciones que utilizan los estándares del protocolo HTTP para la gestión de recursos. Su funcionamiento se basa en la transferencia de "estados" o representaciones de datos, generalmente en formato JSON, permitiendo que sistemas heterogéneos se comuniquen de forma universal e independiente de la plataforma o el lenguaje de programación utilizado. Los pilares técnicos de esta arquitectura incluyen la ausencia de estado (stateless), lo que significa que cada petición del cliente al servidor debe contener toda la información necesaria para ser procesada, mejorando así la escalabilidad y la seguridad. Mediante el uso de métodos estándar como GET (lectura), POST (escritura), PUT (actualización) y DELETE (eliminación), REST facilita una estructura de navegación lógica y predecible. Esta independencia entre el cliente y el servidor permite que el frontend y el backend evolucionen por separado, optimizando el mantenimiento y la integración de nuevas funcionalidades en sistemas complejos. (Fielding, 2023; Gutiérrez, 2024)

**Figura 3** *Esquema de una API REST*
*Nota.* Elaborado por Gutiérrez (2024).

#### 3.2.12.1 Principios de diseño REST
Para que el sistema sea considerado RESTful, debe cumplir con principios arquitectónicos que garantizan su escalabilidad y versatilidad (Gutiérrez, 2024).
Los pilares que rigen esta estructura son:
- **Estructura Cliente-Servidor:** el sistema se divide claramente entre el servidor (que gestiona los recursos) y los clientes que acceden a ellos mediante el protocolo HTTP.
- **Comunicación sin estado (Stateless):** cada solicitud realizada por el cliente es autónoma e independiente, conteniendo toda la información necesaria para su procesamiento sin que el servidor deba recordar interacciones previas.
- **Interfaz Uniforme:** Se asegura la estandarización mediante la identificación única de recursos, permitiendo que los mensajes sean autodescriptivos y facilitando la manipulación de la información por parte del cliente.
- **Sistema de Capas:** la infraestructura se organiza de forma modular, permitiendo capas invisibles para el usuario que gestionan aspectos críticos como la seguridad y el balanceo de carga.

#### 3.2.12.2 Escalabilidad e independencia del backend
Una de las características más relevantes para el éxito de un sistema web es su capacidad de crecimiento. Gutiérrez (2024) sostiene que la escalabilidad en los servicios REST permite alcanzar altos rendimientos mediante granjas de servidores y balanceo de cargas. Al no requerir el almacenamiento de sesiones o contextos de usuario en el servidor, se reduce la complejidad del diseño y se aumenta el rendimiento global de la plataforma, haciendo que el sistema sea ideal para contextos de alta demanda como el Internet de las Cosas (IoT) y entornos móviles. (Gutiérrez, 2024)

### 3.2.13 Lenguaje unificado de modelado (UML)
El Lenguaje de Modelado Unificado, conocido por sus siglas en inglés como UML, es el estándar internacional más ampliamente adoptado para la especificación, visualización y documentación de sistemas de software. Su fortaleza principal radica en ofrecer un conjunto de notaciones gráficas y textuales formales que eliminan la ambigüedad inherente al lenguaje natural cuando se describen sistemas complejos. Para el presente proyecto, se emplearon cuatro tipos de artefactos UML, cada uno orientado a capturar una dimensión distinta del sistema: los casos de uso describen el comportamiento desde la perspectiva del usuario, el diagrama de clases representa la estructura estática de los datos, los diagramas de secuencia documentan el flujo dinámico de las interacciones, y el lenguaje OCL formaliza las restricciones de integridad que el sistema debe garantizar en todo momento. (Booch, Rumbaugh, & Jacobson, 2005)

#### 3.2.13.1 Diagrama de casos de uso
El diagrama de casos de uso es el punto de partida natural del modelado de cualquier sistema orientado a usuarios, porque obliga al equipo de desarrollo a pensar en el sistema desde afuera hacia adentro: primero se identifican quiénes interactúan con él y qué necesitan hacer, y solo después se discute cómo el sistema lo implementará internamente. (Booch, Rumbaugh, & Jacobson, 2005)

#### 3.2.13.2 Diagrama de clases
El diagrama de clases representa la estructura estática del sistema, mostrando las entidades que lo componen, sus atributos, sus operaciones y las relaciones que existen entre ellas. A diferencia del diagrama de casos de uso, que describe el comportamiento desde la perspectiva del usuario, el diagrama de clases describe la organización interna del sistema desde la perspectiva del desarrollador, siendo la base directa sobre la que se construye el esquema de la base de datos relacional. (Rodríguez & Goncalves, 2009)

#### 3.2.13.3 Diagrama de secuencia
Los diagramas de secuencia pertenecen a la categoría de diagramas de interacción de UML y tienen como propósito documentar cómo los distintos componentes del sistema intercambian mensajes entre sí a lo largo del tiempo para llevar a cabo una operación específica. A diferencia del diagrama de clases, que muestra una fotografía estática del sistema, el diagrama de secuencia muestra una película: el orden preciso en que ocurren las comunicaciones entre objetos durante la ejecución de un caso de uso. (Booch, Rumbaugh, & Jacobson, 2005)

#### 3.2.13.4 Lenguaje de restricciones de objetos (OCL)
El Lenguaje de Restricciones de Objetos, conocido por sus siglas en inglés como OCL, es un componente formal del estándar UML que permite expresar con precisión matemática las restricciones y reglas de negocio que los modelos gráficos por sí solos no pueden comunicar con suficiente rigor. Mientras que un diagrama de clases puede mostrar que un estudiante tiene un atributo llamado "porcentaje de asistencia", no puede expresar por sí solo que ese valor siempre debe estar comprendido entre 0 y 100, o que nunca puede existir más de un registro de asistencia para el mismo estudiante, la misma materia y fecha. Para capturar estas restricciones de forma inequívoca, se emplea OCL mediante invariantes que el sistema debe mantener en todo momento, independientemente de la operación que se esté ejecutando. (Revista Cubana de Ciencias Informáticas, 2013)

### 3.2.14 Metodología Scrum
Scrum se define como un marco de trabajo (framework) ligero y evolutivo diseñado para la gestión y el desarrollo de proyectos complejos. Basado en los principios del empirismo y el pensamiento Lean, esta metodología sustituye los modelos de planificación tradicionales y lineales por un enfoque iterativo e incremental. Su funcionamiento teórico se sustenta en tres pilares fundamentales que garantizan la calidad del proceso: la transparencia, que permite una visibilidad clara de los procesos; la inspección constante del progreso para detectar desviaciones; y la adaptación inmediata ante los cambios o nuevos requerimientos detectados. Mediante la entrega de valor funcional en ciclos cortos, este marco de trabajo permite que los equipos de ingeniería mejoren continuamente el producto basándose en el aprendizaje obtenido en cada etapa del desarrollo. La estructura organizativa de Scrum se fundamenta en una tríada de roles, eventos y artefactos específicos. Los roles principales se dividen en el Product Owner, responsable de maximizar el valor del producto y gestionar las prioridades; el Scrum Master, quien actúa como facilitador del proceso y asegura la eliminación de impedimentos técnicos; y el Equipo de Desarrollo, caracterizado por ser autogestionado y multidisciplinario. El ciclo de trabajo se divide en Sprints, los cuales representan iteraciones de tiempo fijo donde se seleccionan requisitos de una lista priorizada denominada Product Backlog para convertirlos en un plan de trabajo específico o Sprint Backlog. Al finalizar cada iteración, la metodología exige la entrega de un Incremento, que se define como una porción de software terminada, funcional y de alta calidad que cumple con los criterios de aceptación técnica. El uso de esta metodología en el desarrollo de software proporciona una estructura modular y flexible, permitiendo abordar por separado componentes críticos como el diseño de interfaces, la arquitectura de datos y la integración de algoritmos de análisis avanzado. Esta organización teórica facilita la validación constante de los módulos y asegura que el resultado final responda de manera efectiva a los objetivos establecidos bajo un flujo de trabajo ágil, productivo y orientado a la mejora continua. (Sutherland & Schwaber, 2013)

### 3.2.15 Normas de calidad del software
La ingeniería de software moderna establece que la calidad no es un atributo añadido al final del desarrollo, sino un proceso continuo basado en estándares internacionales que aseguran la excelencia del producto y la protección de los activos de información.

#### 3.2.15.1 Norma ISO/IEC 25010
La norma ISO/IEC 25010 constituye el estándar internacional de referencia para la especificación, medición y evaluación de la calidad en sistemas informáticos y productos de software. Este marco teórico establece una terminología técnica coherente para determinar la eficacia de un producto mediante dos dimensiones fundamentales: el modelo de calidad del producto y el modelo de calidad en uso. El primero se compone de ocho características intrínsecas, entre las que destacan la fiabilidad, la usabilidad, la seguridad y la mantenibilidad, mientras que el segundo se centra en la experiencia del usuario final y el impacto del sistema en su entorno de operación. Al emplear este estándar como base conceptual, se fundamenta que el software posee propiedades estáticas y dinámicas que aseguran su desempeño técnico y su capacidad de evolución en un entorno real. El alcance teórico de esta norma permite definir objetivos de diseño rigurosos, validar la exhaustividad de los requisitos funcionales y establecer criterios de aceptación técnica previos al despliegue. Entre sus pilares conceptuales se encuentra la idoneidad funcional, definida como la capacidad del sistema para proporcionar funciones que cubran las necesidades declaradas bajo condiciones específicas, y la eficiencia de desempeño, que analiza el comportamiento del software respecto al uso de recursos y tiempos de respuesta. Estos modelos proporcionan un marco de referencia esencial para la ingeniería de software, permitiendo la comparación objetiva entre los requisitos de calidad establecidos en el diseño y el desempeño real observado en el sistema informático, garantizando así la obtención de un producto robusto y confiable. (ISO/IEC, 2011)

Para el desarrollo de sistemas web orientados a la gestión académica, destacan las siguientes dimensiones:
- **Adecuación Funcional:** Representa el grado en el que un producto proporciona funciones que cumplen las necesidades declaradas y lógicas para su uso. En este proyecto, implica que el sistema realice con exactitud los cálculos de rendimiento y las predicciones de riesgo.
- **Usabilidad:** Se define como la capacidad del sistema para ser comprendido, aprendido y utilizado de forma satisfactoria por usuarios específicos (los 52 docentes). Se enfoca en la estética de la interfaz y la facilidad de navegación.
- **Eficiencia de Desempeño:** Evalúa la relación entre el nivel de rendimiento de un software y la cantidad de recursos utilizados, considerando tiempos de respuesta y capacidad máxima de carga.

#### 3.2.15.2 Norma ISO/IEC 27002
La norma ISO/IEC 27002 se define como el estándar internacional que proporciona un conjunto de directrices y controles detallados para la gestión de la seguridad de la información en las organizaciones. Esta normativa se enfoca en la implementación de medidas técnicas, organizativas y físicas para salvaguardar la tríada de la seguridad de la información: confidencialidad, integridad y disponibilidad. En el marco de la ingeniería de software, este estándar actúa como una guía para la selección y aplicación de controles preventivos y correctivos, permitiendo que el diseño de los sistemas informáticos cumpla con estándares globales de protección de datos y mitigación de riesgos cibernéticos. Uno de los pilares fundamentales de esta normativa es la gestión de accesos, la cual se sustenta en el principio de privilegio mínimo a través de modelos de control de acceso basado en roles. Este concepto teórico establece que los permisos dentro de un sistema deben asignarse de manera restrictiva, garantizando que cada usuario interactúe únicamente con los recursos y datos estrictamente necesarios para su función específica. Asimismo, la norma destaca la importancia de la integridad y confidencialidad mediante la aplicación de políticas de seguridad a nivel lógico, las cuales aseguran que la información sensible sea procesada únicamente por personal autorizado y protegida contra cualquier tipo de alteración no controlada o acceso indebido durante el ciclo de vida del software. (ISO/IEC, 2022)

### 3.2.16 Pruebas de software
El aseguramiento de la calidad (QA) requiere la ejecución de protocolos de prueba sistemáticos. Como señala Pressman (2010), el objetivo de las pruebas es encontrar errores en la lógica o el diseño antes de la implementación final. (Pressman, 2010)
- **Pruebas Unitarias (Unit Testing):** Consisten en la verificación individual de los componentes mínimos del software (funciones o clases). Estas pruebas garantizan que la lógica interna de cada algoritmo, especialmente aquellos encargados de la gestión de notas y el pre-procesamiento de datos para Machine Learning, opere correctamente.
- **Pruebas de Estrés (Stress Testing):** Son un tipo de prueba de rendimiento que somete al sistema web a niveles de carga superiores a los normales para observar su punto de quiebre. En un entorno académico, esto asegura que el servidor no presente degradación del servicio cuando la totalidad de la población docente interactúe simultáneamente con la base de datos. (Pressman, 2010)

### 3.2.17 Evaluación financiera
La evaluación financiera permite determinar si es rentable o no invertir en el desarrollo e implementación del sistema web para la Unidad Educativa La Paz “A”. Para ello, se utilizan herramientas que brindan una visión clara sobre las posibilidades de éxito de la inversión (García, 2021).

#### 3.2.17.1 Valor actual neto (VAN)
El Valor Actual Neto (VAN), también conocido como Valor Presente Neto (VPN), se define como la diferencia entre el valor presente de los ingresos (o ahorros) futuros que percibirá la institución y la cantidad de capital invertido para sacar adelante el proyecto.

Si el resultado de este cálculo es positivo, significa que el proyecto es rentable y, por lo tanto, viable para la Unidad Educativa. El fruto de este cálculo otorga seguridad a la organización para invertir, ya que expresa el beneficio neto en unidades de valor monetario (bolivianos). A diferencia de otros indicadores, el VAN permite comparar este proyecto con otras alternativas de inversión para señalar cuál es más beneficiosa.

#### 3.2.17.2 Tasa interna de retorno (TIR)
La Tasa Interna de Retorno (TIR) calcula la tasa de rentabilidad que generará la inversión en el software. Técnicamente, representa el valor de la tasa de descuento que hace que el Valor Actual Neto (VAN) sea igual a cero (García Villacorta, 2021).

La TIR arroja un resultado en forma de porcentaje, indicando la ganancia o pérdida que tendrá el proyecto para todas las partes involucradas. Mientras el VAN ofrece un resultado en moneda corriente, la TIR expresa la eficiencia de la inversión en términos relativos. Para su cálculo en este proyecto, se requiere el uso de herramientas informáticas o calculadoras financieras que permitan realizar las aproximaciones económicas necesarias.

## 3.3 Marco tecnológico

### 3.3.1 Tecnologías para el desarrollo de interfaces (frontend)
En el ecosistema del desarrollo web moderno, React.js se define como una biblioteca de JavaScript de código abierto orientada a la creación de interfaces de usuario mediante una arquitectura basada en componentes. Su fundamento teórico reside en la capacidad de encapsular lógica, estado y estructura visual en bloques de construcción reutilizables y modulares, lo que permite gestionar aplicaciones complejas de forma predecible. Un aspecto distintivo es el uso del DOM virtual y la sintaxis JSX, elementos que optimizan el rendimiento al actualizar únicamente los componentes necesarios ante cambios en el estado de la aplicación. Esta metodología promueve una alta mantenibilidad y facilita el escalamiento de proyectos de software al permitir que el flujo de datos sea unidireccional y robusto. (Kim, 2025)

La estilización de interfaces contemporáneas se apoya en marcos de trabajo basados en utilidades como Tailwind CSS, el cual propone un enfoque práctico mediante el uso de clases predefinidas aplicadas directamente sobre el marcado lógico. A diferencia de las hojas de estilo tradicionales, este modelo fomenta la separación de responsabilidades al integrar el diseño con el componente, lo que reduce significativamente la redundancia de código y el tamaño de los archivos finales. Desde una perspectiva de diseño web, esta herramienta garantiza un lenguaje visual coherente y facilita la implementación de interfaces responsivas que se adaptan dinámicamente a diferentes resoluciones de pantalla y dispositivos, optimizando la experiencia del usuario sin comprometer la eficiencia técnica del sistema. (Wathan, 2018)

Para la orquestación y el despliegue de aplicaciones frontend modernas, Vite se ha consolidado como una herramienta de construcción que prioriza la velocidad y la optimización de recursos durante el ciclo de vida del desarrollo. Su arquitectura técnica se diferencia por utilizar módulos de JavaScript nativos en el navegador, lo que permite una carga instantánea de los recursos y una actualización rápida de módulos en caliente sin necesidad de recompilar todo el proyecto. Al actuar como un motor de construcción inteligente, optimiza el empaquetado final del software, asegurando que el navegador del usuario final reciba una versión depurada y eficiente, lo que se traduce en tiempos de respuesta reducidos y un rendimiento superior de la plataforma web. (You, 2025)

### 3.3.2 Tecnologías para el desarrollo de servidores (backend)
Node.js se define como un entorno de ejecución para JavaScript construido con el motor de JavaScript V8, diseñado para la creación de aplicaciones de red escalables y de alto rendimiento. Su arquitectura se fundamenta en un modelo de operaciones de entrada y salida (I/O) no bloqueante y orientado a eventos, lo que permite gestionar múltiples conexiones simultáneas de manera eficiente sin interrumpir el flujo principal de ejecución. A diferencia de los modelos de hilos tradicionales, esta tecnología optimiza el uso de los recursos del servidor al procesar solicitudes de forma asíncrona, lo que resulta ideal para sistemas que requieren una comunicación fluida con bases de datos y servicios externos, garantizando una alta disponibilidad y tiempos de respuesta reducidos ante una gran carga de usuarios. (Copes, 2024)

Para la estructuración y gestión de servicios web en entornos basados en Node.js, Express.js se consolida como el marco de trabajo de referencia debido a su naturaleza minimalista y flexible. Técnicamente, actúa como una capa de mediación (middleware) que facilita la definición de rutas y puntos de enlace (endpoints) necesarios para la comunicación entre el cliente y el servidor. Este marco permite organizar la lógica de negocio de manera modular, facilitando el procesamiento de peticiones mediante funciones especializadas que validan la información, gestionan la seguridad y coordinan las respuestas del sistema. Su diseño promueve la creación de arquitecturas robustas donde la integración de servicios adicionales se realiza de forma estandarizada y eficiente. (Tyson, 2024)

Una de las ventajas competitivas en la ingeniería de software actual es la homogeneidad del lenguaje de programación a través de toda la arquitectura del sistema. El uso de JavaScript tanto en la capa de presentación como en la de servicios permite una integración natural entre componentes, reduciendo la complejidad técnica y facilitando la mantenibilidad a largo plazo. Desde una perspectiva de diseño, esta infraestructura se apoya en el uso de middlewares para implementar capas de seguridad, autenticación y registro de actividad de forma modular. Esta organización garantiza que la lógica del servidor sea escalable y capaz de evolucionar, ofreciendo una respuesta inmediata y estable incluso en escenarios de alta concurrencia tecnológica.

### 3.3.3 Tecnologías para el microservicio de inteligencia artificial
Python se define como un lenguaje de programación de alto nivel, interpretado y de propósito general, que se ha consolidado como el estándar de facto en el campo de la ciencia de datos y el aprendizaje automático. Su arquitectura teórica se basa en una sintaxis legible y un sistema de tipado dinámico que facilita la implementación de algoritmos complejos de manera eficiente. La versatilidad de su ecosistema, compuesto por una amplia gama de bibliotecas especializadas, permite que el procesamiento de grandes volúmenes de información sea una tarea ágil y escalable. En el ámbito de la ingeniería, su capacidad para integrarse con diversas arquitecturas de software lo convierte en la herramienta base ideal para el desarrollo de componentes analíticos y motores de inferencia. (Mezger, 2023)

FastAPI constituye un marco de trabajo web moderno y de código abierto diseñado para la construcción de interfaces de programación de aplicaciones (API) con Python, destacando por su alto rendimiento y eficiencia. Su arquitectura se fundamenta en los estándares de tipos de Python, lo que permite la validación automática de datos y un rendimiento que compite con entornos de ejecución tradicionalmente más rápidos. A diferencia de otros marcos de trabajo más densos, esta tecnología se especializa en la creación de servicios ligeros, integrando de forma nativa la programación asíncrona para gestionar múltiples peticiones concurrentes. Una de sus características técnicas más relevantes es la generación automática de documentación interactiva bajo estándares internacionales, lo que asegura que el intercambio de información entre servicios sea transparente y libre de inconsistencias, aspectos críticos al manejar variables en modelos de aprendizaje automático. (Raiola Networks, 2023)

Scikit-learn se establece como una biblioteca fundamental para el aprendizaje automático en Python, proporcionando herramientas eficientes para el análisis predictivo de datos. Teóricamente, este recurso permite implementar algoritmos de alto nivel sin la necesidad de reconstruir los complejos fundamentos matemáticos desde su base, ofreciendo una interfaz unificada para tareas de clasificación, regresión y agrupamiento. En arquitecturas de microservicios, esta biblioteca es la encargada de ejecutar modelos que analizan variables estadísticas para generar inferencias en tiempo real. Su robustez técnica permite que la integración de algoritmos como los bosques aleatorios (Random Forest) se realice de manera estable, facilitando la conversión de datos brutos en información estratégica para la toma de decisiones basada en evidencia. (Clark, s.f.)

### 3.3.4 Tecnologías para la persistencia y gestión de datos
PostgreSQL se define como un sistema de gestión de bases de datos relacionales de objetos, reconocido por su robustez, extensibilidad y cumplimiento de los estándares técnicos de la industria. Su arquitectura se fundamenta en la garantía de las propiedades ACID (Atomicidad, Consistencia, Aislamiento y Durabilidad), lo que asegura que las transacciones de datos sean seguras, permanentes y libres de errores de concurrencia. Una característica técnica relevante es su capacidad para gestionar de forma híbrida datos estructurados mediante el modelo relacional y datos no estructurados a través de tipos de datos JSONB. Esta versatilidad permite que los sistemas de información evolucionen y se adapten a nuevos requisitos sin necesidad de reestructuraciones profundas en el esquema de la base de datos. (Stonebraker, 2026)

En el desarrollo de aplicaciones modernas, Supabase se establece como una plataforma de infraestructura que potencia las capacidades de PostgreSQL mediante la integración de servicios adicionales en una arquitectura unificada. Teóricamente, esta capa proporciona herramientas para la gestión simplificada de datos, sistemas de autenticación y almacenamiento de objetos, facilitando una iteración rápida en el desarrollo de software. Al basarse íntegramente en tecnologías de código abierto, esta infraestructura evita la dependencia de software propietario, garantizando la soberanía de la información y permitiendo la migración de los activos de datos en arquitecturas futuras sin pérdida de integridad o funcionalidad. (Streza, 2023)

El puente entre la lógica de programación y la persistencia de datos se gestiona a través de herramientas de Mapeo Objeto-Relacional (ORM) como Prisma. Esta tecnología actúa como una capa de abstracción que permite a los desarrolladores interactuar con las tablas de la base de datos utilizando el mismo lenguaje de programación empleado en el servidor, eliminando la necesidad de redactar consultas manuales complejas. Desde una perspectiva de calidad de software, el uso de un ORM garantiza la seguridad de tipos, asegurando que los datos manejados en el código coincidan estrictamente con la estructura de la base de datos. Esta coherencia técnica reduce significativamente la probabilidad de errores humanos y optimiza el flujo de información hacia componentes críticos como los módulos de inteligencia artificial y las interfaces de usuario. (Harrell, 2025)

### 3.3.5 Comparación de frameworks y justificación de uso

**Tabla 1** *Comparación entre Express (Node.js) y FastAPI (Python)*

| **Característica** | **Express (Node.js)** | **FastAPI (Python)** |
| --- | --- | --- |
| **Rol en el Proyecto** | Gestión administrativa y CRUD de datos. | Ejecución del modelo Random Forest. |
| **Gestión de Dependencias** | NPM (Centralizado y rápido). | PyPI / Virtual Environments (Especializado). |
| **Fortaleza Principal** | Madurez y rapidez en desarrollo web. | Herramientas avanzadas de Ciencia de Datos e IA. |
| **Manejo de Errores** | Basado en Middlewares personalizados. | Manejo de excepciones con tipado estricto. |

*Nota.* Elaboración propia.

La combinación de estas herramientas permite que el sistema de la Unidad Educativa sea modular. Mientras Express garantiza una experiencia fluida en la gestión diaria, FastAPI proporciona la potencia necesaria para procesar el "cerebro" predictivo del sistema, logrando un equilibrio entre desarrollo rápido y un enfoque estructurado de alta ingeniería.

## 3.4 Marco legal

### 3.4.1 Constitución Política del Estado
La Constitución Política del Estado (CPE), promulgada el 7 de febrero de 2009, es la norma suprema del ordenamiento jurídico boliviano. Establece que el Estado tiene la obligación de garantizar una educación de calidad y el acceso universal a las tecnologías de información para fortalecer el desarrollo social (Art. 9 y 77). (CPE, 2009)

### 3.4.2 Ley N.° 070 Avelino Siñani - Elizardo Pérez
Esta ley determina que la educación es la primera responsabilidad financiera del Estado, quien debe garantizar no solo el acceso, sino la permanencia de los estudiantes en el sistema educativo (Art. 1). (Gaceta Oficial de Bolivia, 2010)

El software desarrollado actúa directamente sobre el mandato de permanencia escolar. Mediante el uso de Machine Learning, el sistema identifica riesgos de reprobación de manera temprana, permitiendo a los 52 docentes aplicar estrategias de apoyo pedagógico oportunas. (Gaceta Oficial de Bolivia, 2010)

### 3.4.3 Ley N.° 164 General de Telecomunicaciones y Tecnologías de Información y Comunicación
Establece el marco legal para el aprovechamiento de las TIC, promoviendo el desarrollo de software bajo estándares abiertos y la protección de datos personales (Art. 2 y 77). (Constitución Política del Estado, 2011)

El uso de tecnologías como ReactJS, Node.js y Supabase se alinea con la soberanía tecnológica. La seguridad de la información de los estudiantes está garantizada mediante la arquitectura de base de datos relacional y el manejo de APIs seguras en FastAPI, cumpliendo con los estándares de interoperabilidad del Estado. (CPE, 2011)

## 3.5 Marco actual
Actualmente, la Unidad Educativa La Paz “A” atiende a 1.080 estudiantes de los seis niveles de educación secundaria en el turno de la mañana, con una planta de 52 docentes, un director y personal administrativo. La gestión de la información académica se realiza mediante cuadernos, kárdex físicos y planillas de Excel que cada docente administra de forma independiente, sin una base de datos común que permita consolidar las calificaciones y la asistencia del conjunto de los estudiantes.

El control de asistencia se efectúa mediante el llamado de lista en cada clase y su registro manual, mientras que las calificaciones trimestrales se comunican a los estudiantes al cierre del periodo a través del boletín de notas. De acuerdo con la encuesta aplicada en la fase de diagnóstico, el 94,1 % de los estudiantes no accede oportunamente a sus notas durante el trimestre, el 64,7 % no lleva registro de sus inasistencias y el 53 % reprobó alguna materia sin haber identificado antes que se encontraba en riesgo.

La comunicación con los padres de familia ante situaciones de bajo rendimiento o exceso de inasistencias es lenta e irregular, y la institución no dispone de un mecanismo de alerta temprana que permita intervenir antes del cierre del trimestre. En cuanto a la infraestructura, la institución cuenta con los equipos informáticos necesarios para utilizar un sistema web, y gran parte de la población estudiantil dispone de acceso a internet y de dispositivos móviles, condiciones favorables para la implementación del sistema propuesto.

---

# CAPÍTULO IV. MARCO METODOLÓGICO

## 4.1 Delimitación temporal y espacial
Según Arias (2012), delimitar una investigación consiste en precisar el período y el lugar en que se desarrolla el estudio, de modo que sus resultados puedan situarse en un contexto concreto. En este sentido, la delimitación temporal indica cuándo se ejecuta el proyecto y la delimitación espacial señala en qué institución se aplica.

### 4.1.1 Delimitación temporal
El presente proyecto inició formalmente el mes de marzo de 2026 con la fase de levantamiento de información y análisis de requerimientos. Es importante aclarar que esta etapa de diagnóstico se realiza de forma externa y previa a la implementación técnica en el establecimiento.

### 4.1.2 Delimitación espacial
El proyecto se implementará en la Unidad Educativa La Paz “A”, establecido en la Calle Campero N° 51, una zona estratégica y muy transitada de la ciudad de La Paz, situada justo entre la Avenida 16 de Julio (El Prado) y la Calle Federico Zuazo, en pleno centro paceño, ciudad de La Paz, Bolivia.

**Figura 4** *Ubicación geográfica de la Unidad Educativa La Paz “A”, calle Campero N.° 51, La Paz*
*Nota.* Elaboración propia con base en Google Maps (2026).

## 4.2 Materiales
El desarrollo del presente proyecto requiere de una serie de recursos materiales y tecnológicos que hacen posible la construcción, prueba y despliegue del sistema web. A continuación, se detallan los materiales utilizados, organizados por categoría.

### 4.2.1 Hardware
El desarrollo se realiza sobre una computadora portátil HP, complementada con un teléfono inteligente para las pruebas de diseño responsivo. Las especificaciones del equipo se presentan en la Tabla 2.

**Tabla 2** *Especificaciones del equipo*

| **Hardware** | **Especificación recomendada** | **Uso principal** |
| --- | --- | --- |
| **Laptop y PC de desarrollo** | Procesador i7 o superior, 8 GB de RAM, 500 GB HDD/SSD | Programación, ejecución local de los servidores de desarrollo (Node.js y FastAPI) y pruebas del sistema |
| **Dispositivo móvil (Smartphone)** | Android 9+ / iOS 13+ | Pruebas de diseño responsive |

*Nota.* Elaboración propia.

### 4.2.2 Software
Las herramientas de software empleadas en el desarrollo del sistema se detallan en la Tabla 3.

**Tabla 3** *Herramientas de software*

| **Software** | **Función dentro del sistema** | **Descripción** |
| --- | --- | --- |
| **Visual Studio Code v1.91.0** | Editor de código principal | Gratuito / Multiplataforma |
| **GitHub** | Repositorio remoto para control de versiones | Gratuito |
| **PostgreSQL v16.3 / Supabase** | Motor de BD relacional y alojamiento en la nube | Código abierto / Servicio en la nube |
| **React v18.3.1 / Vite** | Framework e interfaz de usuario | Código abierto / JavaScript |
| **Node.js v20.15.0 / Express** | Entorno de ejecución y API de lógica de negocio | Código abierto |
| **Python v3.11.9 / FastAPI** | Lenguaje y framework para microservicio de IA | Código abierto |
| **Tailwind CSS v3.4.1** | Framework de diseño responsive | Librería de diseño |
| **Postman v11.0** | Pruebas de integración de API REST | Gratuito |
| **pgAdmin v8.9** | Administración visual de BD | Software libre |
| **Prisma ORM** | Mapeador objeto-relacional de BD | Código abierto |
| **Scikit-learn / Pandas** | Entrenamiento de Machine Learning y análisis de datos | Código abierto |

*Nota.* Elaboración propia.

## 4.3 Metodología
De acuerdo con Arias (2012), la metodología reúne el conjunto de pasos, técnicas y procedimientos que se emplean para formular y resolver los problemas de una investigación. En el presente proyecto se articula en dos dimensiones complementarias: el enfoque investigativo, que orienta cómo se recopila e interpreta la información del entorno real de la institución, y el enfoque ingenieril, que define el proceso técnico de diseño, construcción, prueba y despliegue del software. Ambas se retroalimentan: los hallazgos de la investigación informan las decisiones técnicas y el avance del desarrollo permite refinar la comprensión del problema.

### 4.3.1 Planteamiento del estudio
El planteamiento del estudio establece el tipo de investigación, sus alcances, la población sobre la que recae y las técnicas de recolección y análisis de la información, de manera que el sistema responda a necesidades verificadas y no a suposiciones del investigador (Hernández-Sampieri et al., 2014).

Hernández-Sampieri y Mendoza (2018) definen el enfoque mixto como un proceso que recolecta, analiza y vincula datos cuantitativos y cualitativos en un mismo estudio para responder a un planteamiento del problema. Dentro de este marco, el enfoque cuantitativo se apoya en la medición numérica y el análisis estadístico, mientras que el cualitativo busca comprender los fenómenos desde la perspectiva de los participantes y su contexto (Hernández-Sampieri et al., 2014).

En este sentido, el proyecto adopta un enfoque mixto porque necesita medir la magnitud del problema académico y, a la vez, comprender cómo funcionan los procesos institucionales. Desde la perspectiva cuantitativa, se trabaja con calificaciones trimestrales, porcentajes de asistencia, tasas de reprobación y los resultados de las encuestas a estudiantes, datos que además constituyen la materia prima del módulo de Machine Learning. Desde la perspectiva cualitativa, la observación de los procesos de registro manual y las entrevistas con el director y los docentes permiten conocer las causas y consecuencias del problema.

#### 4.3.1.1 Método deductivo e inductivo
El método deductivo es un razonamiento que parte de premisas, leyes o teorías de carácter general para llegar a explicaciones o conclusiones particulares, mientras que el método inductivo procede a la inversa: parte del análisis de hechos particulares aceptados como válidos para formular conclusiones de alcance general (Bernal Torres, 2010).

En el presente proyecto se aplica el método deductivo al partir de los fundamentos teóricos de la gestión académica, del aprendizaje automático, de la metodología CRISP-DM y de la norma ISO/IEC 25010, desarrollados en el Capítulo III, para derivar de ellos los requerimientos, la arquitectura y los criterios de evaluación particulares del sistema para la Unidad Educativa La Paz “A”.

A su vez, se aplica el método inductivo en el análisis de los casos particulares observados en la institución —los registros de notas y asistencia, las respuestas de la encuesta a estudiantes y las entrevistas al director y a los docentes— para identificar los patrones generales que caracterizan la problemática. Este mismo razonamiento sustenta el módulo de Machine Learning, que aprende a partir de registros académicos históricos concretos para generalizar reglas que permiten estimar el nivel de riesgo de nuevos estudiantes.

#### 4.3.1.2 Diseño de investigación no experimental
La investigación no experimental es una búsqueda empírica y sistemática en la que el investigador no tiene control directo sobre las variables independientes, ya sea porque sus manifestaciones ya ocurrieron o porque no son manipulables; las relaciones entre las variables se infieren a partir de su variación natural, sin intervención directa (Kerlinger & Lee, 2002).

El presente proyecto adopta un diseño no experimental porque no se manipulan deliberadamente las variables de estudio ni se asignan los participantes a grupos de tratamiento: la situación de la gestión académica se observa tal como se presenta en la Unidad Educativa La Paz “A”, y el modelo predictivo se entrena con calificaciones y registros de asistencia de gestiones anteriores, es decir, con hechos que ya ocurrieron. Asimismo, la recolección de los datos del diagnóstico se realiza en un único momento, durante la gestión 2026.

#### 4.3.1.3 Tipo de estudio
Según su propósito, Tamayo y Tamayo (2003) caracteriza la investigación aplicada como aquella que busca utilizar el conocimiento existente para resolver problemas prácticos. El proyecto es de este tipo porque no pretende generar teoría nueva, sino resolver un problema concreto de la Unidad Educativa La Paz "A" mediante una herramienta tecnológica funcional.

Respecto al alcance, Hernández-Sampieri et al. (2014) explican que los estudios descriptivos especifican propiedades y características de los fenómenos analizados, y que los explicativos van más allá y buscan establecer las causas de los eventos. Aplicado al caso de estudio, la investigación es descriptiva porque caracteriza la gestión académica actual de la institución a partir de información primaria y secundaria, y es explicativa porque relaciona la ausencia de herramientas tecnológicas integradas con los problemas de acceso a la información, comunicación y rendimiento.

#### 4.3.1.4 Población y muestra
Hernández-Sampieri et al. (2014) definen la población como el conjunto de todos los casos que concuerdan con determinadas especificaciones, y la muestra como un subgrupo de esa población del cual se recolectan los datos. Señalan además que en el muestreo no probabilístico la selección de los casos depende de las características de la investigación y no de la probabilidad, como ocurre en el muestreo por conveniencia, donde se eligen los casos disponibles al investigador.

Aplicado al caso de estudio, la población está formada por los 1.080 estudiantes de los seis niveles de secundaria del turno de la mañana, los 52 docentes, el director y el personal administrativo, además de los padres o tutores que recibirán las notificaciones automáticas. Para la fase de diagnóstico, y por las limitaciones de tiempo y acceso, se aplicó una encuesta a 17 estudiantes de distintos niveles, seleccionados por conveniencia según su disponibilidad. Aunque esta muestra no es estadísticamente representativa, es suficiente para identificar patrones y necesidades que orientan el diseño. Para el componente cualitativo se realizaron entrevistas informales con el director y con algunos docentes.

Los resultados de la encuesta mostraron que el 94,1 % de los estudiantes no accede oportunamente a sus notas durante el trimestre, el 70,6 % dejó de recoger su boletín en alguna ocasión, el 64,7 % no lleva registro de sus inasistencias, el 53 % reprobó una materia sin haber identificado antes que estaba en riesgo, y el 94,1 % indicó que tomaría medidas correctivas si contara con información oportuna.

Para determinar un tamaño de muestra estadísticamente representativo se aplica la fórmula para poblaciones finitas, con un nivel de confianza del 95 % (Z = 1,96), probabilidad de éxito y fracaso de 0,5 (p = q = 0,5), margen de error del 5 % (e = 0,05) y una población N = 1.132 (1.080 estudiantes y 52 docentes):

$$n = \frac{N \cdot Z^2 \cdot p \cdot q}{e^2 \cdot (N - 1) + Z^2 \cdot p \cdot q}$$

Donde los parámetros definidos son:
- $N = 1132$: Población total de la institución.
- $Z = 1,96$: Valor correspondiente a un nivel de confianza del 95%.
- $p = 0,5$: Probabilidad de éxito.
- $q = 0,5$: Probabilidad de fracaso.
- $e = 0,05$: Margen de error admitido del 5%.

El resultado es una muestra de **287 personas**, que se establece como tamaño de referencia para la etapa de validación del sistema.

#### 4.3.1.5 Técnicas de recolección de datos
Las técnicas de recolección son los procedimientos mediante los cuales el investigador obtiene la información necesaria para responder al planteamiento del problema (Arias, 2012). En el proyecto se emplearon cuatro, seleccionadas según la naturaleza de la información y de cada grupo de actores.

1. **La encuesta:** se realiza mediante un cuestionario, definido por Hernández-Sampieri et al. (2014) como un conjunto de preguntas respecto de una o más variables a medir. Aquí se utilizó con los estudiantes un cuestionario de opción múltiple en cuatro secciones: acceso a notas durante el trimestre, conocimiento de la situación académica, control de asistencia y riesgo de reprobación, y disponibilidad tecnológica. Se aplicó mediante Google Forms, de forma presencial, durante una visita coordinada con las autoridades.
2. **La entrevista semiestructurada:** Hernández-Sampieri et al. (2014) señalan que se basa en una guía de asuntos o preguntas, con libertad del entrevistador para introducir preguntas adicionales. Esta técnica se aplicó al director y a algunos docentes para explorar el proceso actual de registro de notas y asistencia, los problemas de gestión, la disponibilidad de datos históricos, la infraestructura tecnológica y la disposición a adoptar una herramienta digital.
3. **La observación directa:** desde la mirada cualitativa, implica adentrarse en la situación social y registrar de forma sistemática lo que ocurre (Hernández-Sampieri et al., 2014). Permitió constatar las prácticas de registro manual, el uso de cuadernos y planillas de Excel no integradas y la dinámica del llamado de lista en el aula.
4. **La revisión documental:** consiste en consultar fuentes escritas previas relacionadas con el tema (Arias, 2012). Se empleó para analizar proyectos de grado afines, artículos académicos y documentación técnica de las herramientas utilizadas, lo que sustenta teóricamente el proyecto y sus diferencias con los antecedentes.

#### 4.3.1.6 Procesamiento y análisis de datos
Hernández-Sampieri et al. (2014) explican que la estadística descriptiva permite describir los datos obtenidos para cada variable mediante frecuencias y porcentajes. Para los datos cuantitativos de la encuesta se utilizó Google Forms, que genera frecuencias absolutas y porcentajes por respuesta; los resultados se exportaron, organizaron y utilizaron como evidencia del diagnóstico situacional.

Para los datos cualitativos se aplicó el análisis temático, que Braun y Clarke (2006) describen como un método para identificar, analizar e informar patrones o temas dentro de los datos. A partir de las entrevistas y la observación se identificaron tres ejes: problemas en la gestión de notas y asistencia, comunicación entre la institución y los padres, y percepción sobre la utilidad de una herramienta tecnológica. Estos ejes orientaron la definición de los módulos y la priorización de funcionalidades.

El procesamiento de los datos académicos históricos para el módulo de Machine Learning sigue las fases de CRISP-DM que se describen a continuación, e incluye la limpieza de datos, la transformación de variables categóricas, la normalización de valores numéricos cuando corresponde y la construcción del conjunto final para entrenar y evaluar los modelos de Árbol de Decisión y Random Forest:

- **Fase I: Comprensión del Negocio:** se centra en la comprensión profunda de los objetivos y requisitos de la institución, identificando las necesidades respecto al abandono escolar y definiendo los criterios de éxito institucional y técnico.
- **Fase II: Comprensión de los Datos:** recopilación de datos iniciales de los registros históricos de los 1.080 estudiantes, explorando su calidad, formatos y detectando posibles valores nulos.
- **Fase III: Preparación de los Datos:** limpieza, imputación de valores faltantes, integración de fuentes de datos y construcción de nuevos atributos (como el promedio de asistencia mensual).
- **Fase IV: Modelado:** selección del algoritmo de Random Forest e ID3, división del dataset en conjuntos de entrenamiento y prueba, e implementación del microservicio en FastAPI.
- **Fase V: Evaluación:** análisis integral de los resultados del modelo predictivo para verificar si cumple con los objetivos planteados y si es lo suficientemente robusto para su despliegue.
- **Fase VI: Despliegue:** puesta en marcha del modelo integrado con Supabase y la interfaz de usuario React, estableciendo un plan de seguimiento para los 52 docentes durante el ciclo escolar.

### 4.3.2 Desarrollo del proyecto (Ingeniería del proyecto)
Scrum es un marco de trabajo ligero que ayuda a generar valor mediante soluciones adaptativas a problemas complejos, y se sustenta en la transparencia, la inspección y la adaptación (Schwaber y Sutherland, 2020). Organiza el trabajo en iteraciones de duración fija llamadas sprints, cada una de las cuales produce un incremento de software. Se eligió porque el proyecto exige validaciones frecuentes con usuarios reales y capacidad de adaptarse a cambios.

Aplicado al caso, cada sprint dura dos semanas y el proyecto se estructura en ocho sprints, más una fase inicial de configuración del entorno y una final de pruebas y despliegue en la nube. Los roles se asumen así: el Product Owner lo ejerce la postulante en coordinación con el director de la unidad educativa, quien valida que el sistema responda a los objetivos; el Scrum Master lo ejerce la postulante con apoyo del docente guía; y el equipo de desarrollo es la postulante, responsable del frontend, el backend y el microservicio de Machine Learning. Cada sprint contempla planificación, ejecución, revisión del incremento y retrospectiva.

#### 4.3.2.1 Fase de especificación de requerimientos
Sommerville (2011) distingue los requerimientos funcionales, que describen los servicios que el sistema debe proveer y cómo reacciona ante entradas específicas, de los no funcionales, que son restricciones sobre los servicios, como rendimiento, seguridad o usabilidad. Esta fase establece qué debe hacer el software antes de construirlo y se apoya en los resultados del levantamiento de información.

En el proyecto se definieron siete requerimientos funcionales, agrupados en los módulos del sistema (usuarios y roles, materias y horarios, asistencia, notas, predicción con IA, dashboard y reportes, y notificaciones), y siete no funcionales alineados con la norma ISO/IEC 25010: seguridad, usabilidad, rendimiento (respuesta menor a tres segundos y predicciones menores a cinco), disponibilidad del 99 % en horario escolar, mantenibilidad, portabilidad y privacidad de datos. Cada requerimiento se documentó con identificador, descripción, prioridad, actores y condiciones de verificación, y se priorizó según valor para el usuario y complejidad técnica, dando máxima prioridad a autenticación y gestión de usuarios.

#### 4.3.2.2 Fase de análisis y diseño
Booch et al. (1999) presentan el Lenguaje de Modelado Unificado (UML) como un lenguaje estándar para especificar, visualizar y documentar los artefactos de un sistema de software. En este proyecto se usa para transformar los requerimientos en una arquitectura concreta: el diagrama de casos de uso representa la interacción de los cuatro roles con el sistema, el diagrama de clases modela las entidades y sirve de base para la base de datos, y el diagrama de secuencia describe la comunicación entre frontend, backend y microservicio de Machine Learning.

La arquitectura sigue el patrón cliente-servidor de tres capas: presentación (React), lógica de negocio (Node.js con Express y Prisma ORM) y datos (PostgreSQL en Supabase). El microservicio de inteligencia artificial en FastAPI actúa como componente especializado de la lógica de negocio, invocado cada vez que se genera o actualiza una predicción. La base de datos se diseñó con el esquema de Prisma y contiene nueve tablas principales: usuarios, niveles, materias, horarios, asistencias, notas, predicciones, padres de contacto y notificaciones, con integridad referencial. El diseño de interfaz es minimalista, con azul medianoche en la navegación, azul índigo en los botones de acción, gris carbón en el texto y blanco humo como fondo.

#### 4.3.2.3 Fase de implementación
La implementación es la etapa en que el diseño se traduce en código ejecutable (Sommerville, 2011). Se desarrolla de forma incremental, siguiendo el orden de prioridad del backlog, y el módulo de inteligencia artificial sigue la metodología CRISP-DM, estándar para proyectos de minería de datos que organiza el trabajo en seis fases: comprensión del negocio, comprensión de los datos, preparación de los datos, modelado, evaluación y despliegue (Chapman et al., 2000).

Por sprints, el trabajo se distribuye así:
- **Sprint 1:** construye la autenticación y la gestión de usuarios (entorno, esquema Prisma y migraciones, endpoints de acceso, roles y permisos con middlewares, y pantallas de login y usuarios).
- **Sprint 2:** desarrolla la asistencia diaria con estados presente, ausente y justificado, el cálculo del porcentaje y las alertas por exceso de faltas.
- **Sprint 3:** implementa las notas con la escala boliviana (Ser, Saber y Hacer), promedios trimestral y anual, indicador de aprobación y exportación a PDF.
- **Sprint 4:** crea los dashboards por rol con Recharts y la exportación de reportes en PDF y Excel.
- **Sprint 5 (3 semanas):** aplica las fases de CRISP-DM para limpiar los datos históricos, entrenar y comparar Árbol de Decisión y Random Forest, elegir el modelo con mejor F1-Score, publicarlo como microservicio FastAPI e integrarlo con el backend.
- **Sprint 6:** desarrolla las notificaciones por correo con Nodemailer, el historial y la configuración de umbrales.
- **Sprint 7:** corresponde a pruebas, ajustes y despliegue en la nube (Vercel, Railway, Render y Supabase).

#### 4.3.2.4 Fase de pruebas
Pressman (2010) sostiene que el objetivo de las pruebas es encontrar errores antes de la entrega, y que deben realizarse en distintos niveles. La norma ISO/IEC 25010 (2011) aporta los criterios de calidad contra los cuales se evalúa el producto. Aquí las pruebas se ejecutan al terminar cada sprint y de forma integral al final.

Las pruebas unitarias verifican componentes aislados (Pressman, 2010). En el backend se prueban el cálculo del total de notas, el porcentaje de asistencia, la determinación del nivel de riesgo y la validez de los tokens JWT; en el microservicio de Python, el preprocesamiento y la lógica de predicción con datos de resultado conocido. Las pruebas de integración comprueban que los componentes funcionen juntos; se somete a ellas el flujo completo desde el registro de una nota hasta la actualización del riesgo y el envío de la notificación. Las pruebas de carga evalúan el comportamiento con uso simultáneo; se simula el acceso concurrente de cincuenta usuarios para verificar tiempos menores a tres segundos. Las pruebas de usabilidad, relacionadas con la característica de usabilidad de la ISO/IEC 25010, se realizan con usuarios reales (al menos un docente y el director) que ejecutan tareas de su rol sin ayuda del desarrollador. Los resultados se registran en una matriz de pruebas con requerimiento, datos de entrada, resultado esperado, resultado obtenido y estado.

### 4.3.3 Calidad del sistema
La calidad del sistema se evalúa con base en el modelo de calidad del producto de la norma ISO/IEC 25010, que permite establecer requisitos de calidad y verificar su grado de cumplimiento (ISO/IEC, 2011). Las características seleccionadas corresponden a los requerimientos no funcionales definidos para el sistema y, para cada una, se establece un criterio de evaluación y un instrumento de medición, como se muestra en la Tabla 4.

**Tabla 4** *Características de calidad evaluadas según la norma ISO/IEC 25010*

| **Característica** | **Criterio de evaluación** | **Instrumento** |
| --- | --- | --- |
| **Adecuación funcional** | Porcentaje de requerimientos funcionales (RF-01 a RF-07) implementados y verificados | Matriz de pruebas funcionales |
| **Eficiencia de desempeño** | Tiempo de respuesta < 3 s con 50 usuarios concurrentes; predicciones < 5 s | Pruebas de carga |
| **Usabilidad** | Facilidad de aprendizaje y de uso percibida por el director y docentes | Cuestionario de usabilidad con escala de Likert |
| **Fiabilidad** | Disponibilidad del 99 % durante el horario escolar | Registro de disponibilidad del servicio |
| **Seguridad** | Autenticación con JWT, cifrado con bcrypt y control de acceso por roles | Pruebas de acceso y revisión de controles |
| **Mantenibilidad** | Estructura modular del código y separación por capas | Revisión del código fuente |
| **Portabilidad** | Funcionamiento en Chrome, Firefox y Edge, en PC y dispositivos móviles | Pruebas en navegadores y dispositivos |

*Nota.* Elaboración propia con base en la norma ISO/IEC 25010.

Cada característica se califica según el porcentaje de criterios cumplidos, y la calidad global del sistema se obtiene como el promedio de las calificaciones de todas las características. En el ámbito de la seguridad de la información, los controles de acceso basados en roles y la protección de los datos personales se verifican, además, según las directrices de la norma ISO/IEC 27002 (ISO/IEC, 2022).

Por su parte, la calidad del modelo predictivo se evalúa en la fase de evaluación de CRISP-DM (Shearer, 2000) mediante la matriz de confusión obtenida sobre el conjunto de prueba, a partir de la cual se calculan la exactitud (accuracy), la precisión, la exhaustividad (recall) y el F1-score de los modelos de Árbol de Decisión y Random Forest; el modelo con mejor F1-score es el que se integra al sistema.

### 4.3.4 Estimación de costos
La estimación de costos permite cuantificar los recursos económicos necesarios para desarrollar, implementar y documentar el sistema, y constituye la base para evaluar su viabilidad económica. Se estructura en seis componentes: la estimación del esfuerzo, el costo de desarrollo, el costo de implementación, el costo de elaboración, el costo total y la relación costo/beneficio.

#### 4.3.4.1 Estimación del esfuerzo de desarrollo
Dentro de la planificación ágil, un Story Point se define como una unidad de medida relativa utilizada para proporcionar estimaciones del esfuerzo necesario para completar los requisitos del sistema. A diferencia de las mediciones de tiempo tradicionales, los puntos de historia permiten alcanzar un consenso sobre la complejidad intrínseca y el riesgo de cada tarea técnica. Para cuantificar este esfuerzo, se aplica habitualmente la Escala de Fibonacci, una unidad de medida que permite predecir el ritmo de avance del desarrollo (Davidson, 2014).

**Tabla 5** *Matriz de estimación de Story Points*

| **Story Points** | **Complejidad** | **Descripción Técnica de la Tarea** | **Ejemplo de Tarea en el Sistema Académico** |
| --- | --- | --- | --- |
| **1 – 2** | Baja | Tareas con mínima incertidumbre y requerimientos claros de diseño | Ajustes estéticos, corrección de textos o creación de botones |
| **3 – 5** | Media | Tareas que requieren lógica de programación y acceso a datos | Desarrollo de funciones de registro (Estudiantes y Materias) |
| **8** | Alta | Tareas con complejidad técnica elevada o configuración de servicios | Configuración de autenticación en Supabase y roles de acceso |
| **13** | Muy Alta | Tareas con alto nivel de incertidumbre y procesamiento de datos | Limpieza de datos históricos y entrenamiento del modelo de IA |

*Nota.* Elaboración propia.

Cohn (2005) propone los Story Points como unidad relativa para estimar el esfuerzo de las historias de usuario según su complejidad, incertidumbre y volumen de trabajo. En el proyecto se usó la escala de Fibonacci (1, 2, 3, 5, 8 y 13). La estimación total es de **153 Story Points**, equivalentes a **612 horas** a razón de cuatro horas por punto.

#### 4.3.4.2 Costo de desarrollo
Para valorar el costo se aplicaron tarifas de mercado del contexto boliviano y una distribución del tiempo por perfil, como muestra la Tabla 6.

**Tabla 6** *Estimación del costo de desarrollo por perfil*

| **Perfil** | **Distribución** | **Horas** | **Tarifa (Bs/h)** | **Costo (Bs)** |
| --- | --- | --- | --- | --- |
| **Desarrollador fullstack** | 65 % | 398 | 50 | 19.900 |
| **Diseñador de interfaces** | 20 % | 122 | 40 | 4.880 |
| **Especialista en ML y Python** | 15 % | 92 | 70 | 6.440 |
| **Total** | 100 % | 612 | — | **31.220** |

*Nota.* Elaboración propia.

Este valor es el costo hipotético de contratar el desarrollo a terceros y no un gasto real del proyecto, pues lo realiza íntegramente la postulante como trabajo de grado; refleja el aporte económico a la institución.

#### 4.3.4.3 Costo de implementación
El costo de implementación comprende los recursos necesarios para poner el sistema en funcionamiento en la Unidad Educativa La Paz “A”: la infraestructura de alojamiento en la nube, la configuración inicial y la migración de los datos académicos, y la capacitación de los usuarios (director, docentes y personal administrativo).

Al emplear únicamente tecnologías de código abierto y los planes gratuitos de Vercel, Railway, Render y Supabase, el costo de infraestructura es de **cero bolivianos** con el nivel de uso actual; además, la institución ya cuenta con los equipos necesarios, por lo que no se requiere adquirir hardware adicional. Las horas de configuración y capacitación se valoran con las mismas tarifas utilizadas para el costo de desarrollo.

#### 4.3.4.4 Costo de elaboración
El costo de elaboración corresponde a los gastos asociados a la investigación y a la redacción del documento del proyecto de grado, independientes del desarrollo del software: servicio de internet, materiales de escritorio, impresión y empastado de los ejemplares, y transporte para las visitas de levantamiento de información a la institución. Estos gastos se cuantifican a partir de los registros de la postulante durante la gestión 2026.

#### 4.3.4.5 Costo total del proyecto
El costo total del proyecto se obtiene como la suma de los tres componentes anteriores:

$$CT = CD + CI + CE$$

Donde $CT$ es el costo total del proyecto, $CD$ el costo de desarrollo, $CI$ el costo de implementación y $CE$ el costo de elaboración.

#### 4.3.4.6 Costo/beneficio
Para la evaluación financiera, García (2021) explica que el Valor Actual Neto (VAN) es la diferencia entre el valor presente de los beneficios futuros y la inversión, y que la Tasa Interna de Retorno (TIR) es la tasa de descuento que hace el VAN igual a cero. Se calcularon con una tasa de descuento del 10 % anual y un horizonte de tres años, tomando como inversión el costo de desarrollo y como beneficios el ahorro en materiales físicos, el tiempo docente recuperado y la reducción esperada de la reprobación. Un VAN positivo y una TIR superior al 10 % indican que el proyecto es viable.

El valor actual neto se calcula descontando los beneficios esperados de cada periodo a la tasa de descuento definida y restando la inversión inicial (Baca Urbina, 2013):

$$VAN = -I_0 + \sum_{t=1}^{n} \frac{B_t}{(1 + i)^t}$$

La tasa interna de retorno es la tasa de descuento que hace que el valor actual neto sea igual a cero:

$$0 = -I_0 + \sum_{t=1}^{n} \frac{B_t}{(1 + TIR)^t}$$

A partir de los mismos flujos se obtiene la relación beneficio/costo ($B/C$), cociente entre el valor actual de los beneficios y el valor actual de los costos; un cociente mayor a uno indica que los beneficios superan a los costos:

$$B/C = \frac{VA(\text{beneficios})}{VA(\text{costos})}$$

Donde $I_0$ es la inversión inicial, $B_t$ el beneficio neto del periodo $t$, $i$ la tasa de descuento (10 % anual), $n$ el horizonte de evaluación (tres años) y $VA$ el valor actual. El proyecto se considera viable si el VAN es positivo, la TIR supera la tasa de descuento y la relación B/C es mayor a uno.

---

# CAPÍTULO V. MARCO APLICATIVO

## 5.1 Desarrollo del proyecto (Ingeniería del proyecto)
El presente capítulo describe la implementación del Sistema Web con Machine Learning para Gestión Académica y Análisis Predictivo del Rendimiento Estudiantil de la Unidad Educativa La Paz "A". Se presentan los artefactos de modelado UML, los diagramas de actividades, componentes, secuencia, el modelo conceptual y físico de la base de datos, el diseño navegacional y las especificaciones de las interfaces de usuario para cada módulo del sistema.

### 5.1.1 Fase de especificación de requerimientos
Los requerimientos funcionales y no funcionales del sistema fueron identificados mediante el diagnóstico institucional de la Unidad Educativa La Paz "A".

#### 5.1.1.1 Requerimientos funcionales

**Tabla 7** *Requerimientos funcionales del sistema*

| **ID** | **Módulo** | **Historia de Usuario** | **Prioridad** |
| --- | --- | --- | --- |
| **RF-01** | Gestión de Usuarios y Roles | El sistema debe permitir registrar, editar y desactivar usuarios asignando roles diferenciados: Director, Profesor, Administrativo y Estudiante. Acceso restringido según rol autenticado mediante JWT y cifrado bcrypt. | Alta |
| **RF-02** | Gestión de Materias y Horarios | El sistema debe permitir programar el horario semanal por curso, asignar docentes a materias por nivel educativo (1ro a 6to de secundaria) y detectar automáticamente conflictos de horario. Los estudiantes podrán consultar su horario semanal. | Alta |
| **RF-03** | Control de Asistencia | Los docentes deben poder registrar diariamente la asistencia por materia (Presente, Ausente, Justificado). El sistema calculará el porcentaje de asistencia y generará alertas al superar el límite de faltas. | Alta |
| **RF-04** | Registro y Reporte de Notas | Los docentes deben poder registrar notas por trimestre y materia. El sistema calculará automáticamente promedios trimestrales y el promedio final anual, indicando aprobación o reprobación con opción de exportar a PDF. | Alta |
| **RF-05** | Predicción de Rendimiento con IA | El módulo debe aplicar la metodología CRISP-DM con algoritmos Árbol de Decisión y Random Forest para clasificar estudiantes en exactamente tres categorías de riesgo: Sin Riesgo, Riesgo Medio y Riesgo Alto (valores del modelo: `SIN_RIESGO`, `RIESGO_MEDIO`, `RIESGO_ALTO`). Las predicciones se actualizarán automáticamente. | Alta |
| **RF-06** | Dashboard y Reportes Generales | El Director debe disponer de un panel de control con indicadores clave, gráficos de evolución por trimestre, lista de estudiantes en Riesgo Alto y opción de exportar reportes en PDF o Excel. | Media |
| **RF-07** | Notificaciones a Padres de Familia | El sistema debe enviar notificaciones automáticas por correo al tutor cuando el estudiante entre en categoría de Riesgo Alto (`RIESGO_ALTO`) o supere el límite de inasistencias, con historial de notificaciones por estudiante. | Media |

*Nota.* Elaboración propia.

#### 5.1.1.2 Requerimientos no funcionales

**Tabla 8** *Requerimientos no funcionales del sistema*

| **Código** | **Atributo** | **Descripción** | **Norma / Marco** |
| --- | --- | --- | --- |
| **RNF-01** | Seguridad | Autenticación con JWT. Contraseñas cifradas con bcrypt. Políticas de Row Level Security (RLS) en Supabase para restringir acceso por rol. | ISO/IEC 25010 — Seguridad |
| **RNF-02** | Usabilidad | Interfaz intuitiva y responsiva. Tiempo de aprendizaje para docentes < 30 minutos. | ISO/IEC 25010 — Usabilidad |
| **RNF-03** | Rendimiento | Respuesta < 3 segundos bajo carga normal. Predicciones de IA < 5 segundos. | ISO/IEC 25010 — Eficiencia de desempeño |
| **RNF-04** | Disponibilidad | Disponibilidad del 99% en horario escolar (Vercel, Railway, Render, Supabase). | ISO/IEC 25010 — Fiabilidad |
| **RNF-05** | Mantenibilidad | Código estructurado en módulos independientes siguiendo el patrón MVC. Documentación de endpoints de API REST. | ISO/IEC 25010 — Mantenibilidad |
| **RNF-06** | Portabilidad | Accesible desde Google Chrome, Mozilla Firefox y Microsoft Edge sin instalación adicional. | ISO/IEC 25010 — Portabilidad |
| **RNF-07** | Privacidad de datos | Tratamiento de datos bajo confidencialidad e integridad, en concordancia con la Ley N° 164. | Ley N° 164 TIC — Bolivia |

*Nota.* Elaboración propia con base en la norma ISO/IEC 25010.

#### 5.1.1.3 Casos de uso del sistema

**Tabla 9** *Casos de uso del sistema*

| **Código** | **Caso de Uso** | **Actor(es)** | **Precondición** | **Resultado esperado** |
| --- | --- | --- | --- | --- |
| **CU-01** | Autenticarse en el sistema | Director, Profesor, Administrativo, Estudiante | Usuario registrado con credenciales válidas | Acceso al panel de control según rol asignado |
| **CU-02** | Gestionar materias y horarios | Director, Administrativo | Sesión activa con privilegios administrativos | Materias asignadas por curso y horario registrado sin conflictos |
| **CU-03** | Registrar asistencia diaria | Profesor | Horario asignado activo, estudiantes matriculados | Asistencia registrada; alerta si supera límite de faltas |
| **CU-04** | Registrar notas por trimestre | Profesor | Materia asignada, trimestre activo | Notas guardadas, promedio calculado automáticamente |
| **CU-05** | Consultar notas y asistencia | Estudiante | Sesión iniciada como Estudiante | Visualización de notas, % de asistencia y horario |
| **CU-06** | Generar predicción de riesgo | Sistema (automático) / Director | Notas y asistencias del trimestre registradas | Clasificación: Sin Riesgo / Riesgo Medio / Riesgo Alto (`SIN_RIESGO` / `RIESGO_MEDIO` / `RIESGO_ALTO`) |
| **CU-07** | Enviar notificación al padre | Sistema (automático) | Estudiante en Riesgo Alto o con exceso de faltas | Correo enviado al tutor registrado; registro en historial |

*Nota.* Elaboración propia.

##### Detalle de Casos de Uso Críticos:
- **CU-03: Registrar asistencia diaria:** Actor principal: Profesor. Precondición: docente autenticado con materia asignada. El docente selecciona la materia y la fecha, marca Presente, Ausente o Justificado para cada alumno. El sistema actualiza el porcentaje acumulado de asistencia y, si se excede el límite de faltas, genera una alerta y desencadena la notificación al tutor.
- **CU-04: Registrar notas por trimestre:** Actor principal: Profesor. Precondición: trimestre activo y materia asignada. El docente ingresa notas. El sistema calcula promedios e invoca el microservicio de Machine Learning para actualizar la predicción de riesgo.
- **CU-06: Generar y consultar la predicción de riesgo:** Actor principal: Director, Profesor. El actor selecciona curso/estudiante y visualiza la clasificación de riesgo con su probabilidad asociada y las variables de mayor peso.
- **CU-07: Enviar notificación al padre o tutor:** Actor principal: Sistema (automático). Desencadenado cuando un estudiante entra en Riesgo Alto o exceso de faltas. Envía un correo con la alerta y guarda el registro histórico.

### 5.1.2 Fase de análisis y diseño

#### 5.1.2.1 Arquitectura del sistema
El sistema adopta una arquitectura de tres capas basada en el modelo Cliente-Servidor, complementada con un patrón de microservicios para el módulo de Inteligencia Artificial. La capa de presentación se desarrolla con React v18 + Vite + Tailwind CSS, la capa de lógica de negocio se implementa con Node.js v20 LTS + Express v4, y la capa de datos se gestiona mediante PostgreSQL en Supabase. El microservicio de Inteligencia Artificial se desarrolla con Python v3.11 + FastAPI y se comunica con el backend principal mediante API REST.

#### 5.1.2.2 Diagramas de actividades
- **Diagrama 1 — Registro de Asistencia Diaria:** Selección de materia y fecha -> Lista de alumnos -> Marcado de estado -> Validación y cálculo de % de asistencia -> Verificación de umbral de faltas -> Generación de alerta y notificación.
- **Diagrama 2 — Registro de Notas por Trimestre:** Selección de materia y trimestre -> Ingreso de calificaciones (Ser/Saber/Hacer) -> Cálculo de promedio trimestral -> Invocación a microservicio FastAPI ML -> Actualización de clasificación de riesgo -> Generación de notificación si la clasificación es Riesgo Alto (`RIESGO_ALTO`).
- **Diagrama 3 — Consulta de Predicción de Riesgo Académico:** Solicitud en Frontend -> Backend Node.js -> Consulta a Microservicio FastAPI ML -> Retorno de clasificación, probabilidad y variables de mayor impacto -> Renderizado visual en Dashboard.
- **Diagrama 4 — Envío Automático de Notificaciones a Padres:** Evento gatillo (Riesgo Alto / Exceso de Faltas) -> Verificación de correo del tutor -> Plantilla de correo -> Envío mediante Nodemailer -> Registro en tabla `notificaciones`.

#### 5.1.2.3 Diagramas de casos de uso
- **Director:** Gestión de usuarios, consulta de dashboard institucional, exportación de reportes (PDF/Excel), consulta de predicciones ML de todos los cursos.
- **Profesor:** Registro de asistencia diaria, registro de notas por trimestre, consulta de porcentaje de asistencia acumulado, consulta de riesgo de sus alumnos, recepción de alertas visuales.
- **Administrativo:** Configuración de materias, asignación de docentes a materias, estructuración de horarios por curso.
- **Estudiante:** Consulta de calificaciones por materia/trimestre, consulta de porcentaje de asistencia acumulado, consulta de horario semanal personal.

#### 5.1.2.4 Diagrama de componentes
- **Frontend (Vercel):** React + Tailwind CSS + Recharts
- **Backend (Railway):** Node.js + Express + Prisma ORM + Nodemailer
- **Microservicio IA (Render):** Python + FastAPI + Scikit-Learn
- **Base de Datos (Supabase):** PostgreSQL 16

#### 5.1.2.5 Diagramas de secuencia
1. **Inicio de Sesión y Autenticación:** User ingresa credenciales -> POST `/api/auth/login` -> Backend verifica con bcrypt contra PostgreSQL -> Retorna JWT con Rol -> Frontend guarda token y redirige según rol.
2. **Registro de Nota y Actualización de Predicción:** Docente ingresa nota -> POST `/api/notas` -> Backend guarda nota en PostgreSQL con Prisma -> POST `/predict` a Microservicio FastAPI ML con notas y asistencias -> FastAPI retorna clasificación de riesgo -> Backend guarda `PrediccionRiesgo` -> Retorna confirmación a Frontend.
3. **Consulta del Dashboard Institucional:** Director accede a dashboard -> GET `/api/dashboard` -> Backend consulta agregados en PostgreSQL -> Retorna JSON -> Frontend renderiza gráficos Recharts.

#### 5.1.2.6 Modelo conceptual: diagrama de clases
Entidades principales y relaciones:
- `Usuario` (id, nombre, email, password_hash, rol) <- Base para `Estudiante` y `Docente`.
- `Estudiante` (id_estudiante, curso, gestion, email_tutor)
- `Docente` (id_docente, especialidad)
- `Materia` (id_materia, nombre, carga_horaria, nivel)
- `MateriaProgramada` (id_materia_prog, id_materia, id_docente, id_curso, gestion)
- `Nota` (id_nota, id_estudiante, id_materia, trimestre, ser, saber, hacer, total)
- `Asistencia` (id_asistencia, id_estudiante, id_materia, fecha, estado)
- `PrediccionRiesgo` (id_prediccion, id_estudiante, nivel_riesgo, probabilidad, fecha)
- `Notificacion` (id_notificacion, id_estudiante, tipo, destinatario, fecha, estado)

#### 5.1.2.7 Restricciones OCL del modelo
1. `context Nota inv: self.total >= 0 and self.total <= 100`
2. `context Asistencia inv: Asistencia.allInstances()->isUnique(a | a.estudiante = self.estudiante and a.materia = self.materia and a.fecha = self.fecha)`
3. `context PrediccionRiesgo inv: Set{SIN_RIESGO, RIESGO_MEDIO, RIESGO_ALTO}->includes(self.nivel_riesgo)` -- Etiquetas en interfaz: Sin Riesgo, Riesgo Medio, Riesgo Alto
4. `context PrediccionRiesgo inv: self.probabilidad >= 0.0 and self.probabilidad <= 1.0`
5. `context Nota inv: Set{1, 2, 3}->includes(self.trimestre)`
6. `context PrediccionRiesgo inv: self.prob_sin_riesgo + self.prob_riesgo_medio + self.prob_riesgo_alto = 1.0`

#### 5.1.2.8 Modelo físico: esquema de base de datos
Implementado en PostgreSQL 16 con tipos UUID como llaves primarias, llaves foráneas con eliminación en cascada donde corresponde, y políticas de seguridad RLS (Row Level Security).

#### 5.1.2.9 Diseño navegacional
Flujos estructurados por rol:
- **Director:** Login -> Dashboard -> [Usuarios | Predicciones | Reportes | Notificaciones]
- **Profesor:** Login -> Panel Profesor -> [Asistencia | Notas | Alertas de Riesgo]
- **Administrativo:** Login -> Panel Admin -> [Materias | Horarios | Cursos]
- **Estudiante:** Login -> Portal Estudiante -> [Mis Notas | Mi Asistencia | Mi Horario]

### 5.1.3 Diseño de interfaces de usuario
Principios ISO/IEC 25010: paleta Azul Medianoche (`#1F3864`), Azul Índigo (`#2E5BA8`), Gris Carbón (`#333333`), Blanco Humo (`#F8F9FA`), tipografía Inter.
- **Inicio de sesión:** Formulario limpio con campos de correo, contraseña, botón primario azul e indicadores de error.
- **Dashboard Director:** Tarjetas de KPIs, gráficos Recharts (barras de notas, líneas de evolución trimestral, pie de niveles de riesgo) y tabla de Riesgo Alto con exportación.
- **Panel Profesor (Asistencia):** Selector de fecha/materia, lista con checkboxes colorizados (Verde=Presente, Rojo=Ausente, Amarillo=Justificado) y cálculo instantáneo.
- **Panel Profesor (Notas):** Formulario de notas trimestrales (Ser, Saber, Hacer), totalizador automático en tiempo real y semáforo de aprobación.
- **Módulo de Predicción de Riesgo:** Lista ordenada por severidad de riesgo, etiquetas de color, y panel lateral con desglose de probabilidades y variables clave.
- **Portal Estudiante:** Vista responsiva en pestañas para Notas, Asistencia y Horario Semanal.
- **Panel Administrativo:** Grilla semanal interactiva para asignación de horarios con detección visual de solapamientos/conflictos.
- **Módulo de Notificaciones:** Historial con estados de entrega e interfaz de configuración de umbrales de alerta.

### 5.1.4 Fase de implementación

#### 5.1.4.1 Implementación del sistema web
- **Frontend:** React v18.3.1 + Vite v5.4.0 + Tailwind CSS v3.4.1 + Recharts v2.12.7.
- **Backend:** Node.js v20.15.0 LTS + Express v4.19.2 + Prisma ORM v5.17.0 + JWT v9.0.2 + bcrypt v5.1.1.
- **Base de Datos:** PostgreSQL v16.3 alojado en Supabase con políticas RLS activas.
- **Microservicio IA:** Python v3.11.9 + FastAPI v0.111.0 + scikit-learn v1.5.0 + pandas.

### 5.1.5 Fase de pruebas
Protocolo de pruebas ejecutado:
- **Pruebas Unitarias:** Verificación de funciones de cálculo de promedios, porcentajes de asistencia y tokenización JWT.
- **Pruebas de Integración:** Validación de flujo Frontend -> Express API -> Prisma ORM -> Supabase DB -> FastAPI ML Microservice.
- **Pruebas de Carga/Estrés:** Simulación de 50 usuarios concurrentes manteniendo tiempos de respuesta < 3 s.
- **Pruebas Aceptación Usuario (UAT):** Casos de prueba CP-01 (Asistencia), CP-02 (Predicción Árboles/Random Forest) y CP-03 (Acceso y Seguridad).

---

# REFERENCIAS BIBLIOGRÁFICAS

- Aramayo, M. (2024). *Era digital educativa y el estado global en Bolivia*. Universidad Mayor de San Simón.
- Armoa, D., & Bogado, J. (2025). *Desarrollo de un Dashboard Web para un Modelo de Machine Learning basado en IA en la Predicción Temprana de la Deserción Estudiantil de la Facultad de Ciencias y Tecnologías*. Universidad Nacional de Caaguazú.
- Arteaga Sabja, W., & Sandoval, J. (2018). Factores que intervienen en el rendimiento académico en la Universidad. *Revista Acta Nova, 8*(4), 552-563.
- Arias, F. G. (2012). *El proyecto de investigación: Introducción a la metodología científica* (6.ª ed.). Episteme.
- Baca Urbina, G. (2013). *Evaluación de proyectos* (7.ª ed.). McGraw-Hill.
- Bernal Torres, C. (2010). *Metodología de la investigación: administración, economía, humanidades y ciencias sociales* (3.ª ed.). Pearson Educación.
- Booch, G., Rumbaugh, J., & Jacobson, I. (2005). *The Unified Modeling Language User Guide* (2nd ed.). Addison-Wesley.
- Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology, 3*(2), 77–101.
- Breiman, L. (2001). Random Forests. *Machine Learning, 45*(1), 5-32.
- Cabanelas, J. (2019). *Inteligencia artificial*. Universidade de Vigo, España.
- Cachaga Villegas, E. (2016). *Sistema web de gestión académica y repositorio virtual. Caso: Unidad Educativa Príncipe de Luz*. Universidad Mayor de San Andrés.
- Camarena, J., Trueba, A., & Martínez, M. (2012). Automatización de la codificación del patrón modelo vista controlador (MVC) en proyectos orientados a la WEB. *Ciencia Ergo Sum, 19*(3).
- Camila, D. (2024). *Sistema web*. DataTrust.
- Chapman, P., Clinton, J., Kerber, R., Khabaza, T., Reinartz, T., Shearer, C., & Wirth, R. (2000). *CRISP-DM 1.0: Step-by-step data mining guide*. SPSS Inc.
- Cohn, M. (2005). *Agile estimating and planning*. Prentice Hall.
- Copes, F. (2024). *Introduction to Node.js*. Nodejs.org.
- Davidson, D. (2014). *Why do we use story points for estimating?* Scrum.org.
- Edel, R. (2003). El rendimiento académico: concepto, investigación y desarrollo. *Revista Iberoamericana de Educación*.
- Espino, C. (2027). *Análisis predictivo: técnicas y modelos*. Universitat Oberta de Catalunya.
- Fielding, R. (2023). *REST APIs defined*. IBM.
- Firican, G. (2023). *The history of machine learning*. LightsOnData.
- Gaceta Oficial de Bolivia. (2010). *Ley N° 070 Avelino Siñani - Elizardo Pérez*.
- García, A. (2021). *VAN, TIR y Pay-back: ¿qué son y en qué se diferencian?* ESAN.
- García de Zúñiga, F. (2025). *Todo sobre la arquitectura cliente-servidor*. ARSYS.
- Gutiérrez, S. (2024). *¿Qué es una API REST?* Dos Setenta.
- Harrell, J. (2025). *Prisma Schema Language: The Best Way to Define Your Data*. Prisma.
- Hernández-Sampieri, R., Fernández, C., & Baptista, P. (2014). *Metodología de la investigación* (6.ª ed.). McGraw-Hill.
- Hernández-Sampieri, R., & Mendoza, C. P. (2018). *Metodología de la investigación: Las rutas cuantitativa, cualitativa y mixta*. McGraw-Hill.
- ISO/IEC. (2011). *ISO/IEC 25010:2011. Systems and software engineering — Systems and software quality requirements and evaluation (SQuaRE) — System and software quality models*.
- ISO/IEC. (2022). *ISO/IEC 27002:2022. Information security, cybersecurity and privacy protection — Information security controls*.
- Kerlinger, F., & Lee, H. (2002). *Investigación del comportamiento: métodos de investigación en ciencias sociales* (4.ª ed.). McGraw-Hill.
- Kim, J. (2025). *Why React?* Adactio.
- Mezger, M. (2023). *Python, the programming language for data engineering and AI*. Adesso.
- Ortega, C. (2023). *Aplicaciones educativas: Qué son, ventajas y ejemplos*. QuestionPro.
- Ortega, M., Machaca, J., & Daza, J. (2023). El efecto de la inteligencia artificial en el rendimiento académico de estudiantes de ciencias administrativas en la Universidad Católica Boliviana. *Revista CEPIES, UMSA*.
- Pin, L., & Barreto, M. (2025). *Análisis de datos del uso de tecnologías digitales para la medición del nivel de impacto en el rendimiento académico de los estudiantes de la carrera de Tecnologías de la Información mediante Power BI*. Universidad Estatal del Sur de Manabí.
- Pressman, R. S. (2010). *Ingeniería del software: Un enfoque práctico* (7.ª ed.). McGraw-Hill.
- Quinlan, J. R. (2020). *Induction of decision trees (ID3)*.
- Quispe Ticona, E. (2024). *Analítica de datos del rendimiento académico anual para la toma de decisiones en la carrera de Arquitectura*. Universidad Mayor de San Andrés.
- Raiola Networks. (2023). *Qué es FastAPI en Python*.
- Ruiz Guevara, P. (2023). *El Machine Learning, una rama de la inteligencia artificial en auge*. Fundación Dialnet.
- Schwaber, K., & Sutherland, J. (2020). *The Scrum Guide: The definitive guide to Scrum*. Scrum.org.
- Shearer, C. (2000). The CRISP-DM Model: New Clusters and Regional Nodes. *Journal of Data Warehousing*.
- Sommerville, I. (2011). *Ingeniería del software* (9.ª ed.). Pearson Educación.
- Stonebraker, M. (2026). *PostgreSQL: About*. PostgreSQL.org.
- Streza, A. (2023). *A supa introduction to Supabase*. Medium.
- Sutherland, J., & Schwaber, K. (2013). *Scrum Methodology*. Leader Summaries.
- Tamayo y Tamayo, M. (2003). *El proceso de la investigación científica* (4.ª ed.). Limusa.
- Tanenbaum, A. (2009). *Sistemas Operativos Modernos*. Pearson.
- Troya, A., & Ushco, E. (2024). *Desarrollo e implementación de un sistema web de gestión académica en la Unidad Educativa Marco Aurelio Subía – Batalla de Panupali*. Universidad Técnica de Cotopaxi.
- Tyson, M. (2024). *Intro to Express.js: Endpoints, parameters, and routes*. InfoWorld.
- UNESCO. (2024). *La inteligencia artificial en la educación y en marcos normativos*.
- Viveros, S., & Sánchez, L. (2018). La gestión académica. *Revista Universidad y Sociedad*.
- Wathan, A. (2018). *Tailwind CSS: Utility-first CSS framework*.
- You, E. (2025). *Vite: Next Generation Frontend Tooling*.

---

# ANEXOS

## Anexo A. Resultados de la encuesta aplicada a estudiantes
- **Acceso a notas:** El 94,1 % indica que no accede a sus notas de forma oportuna durante el trimestre.
- **Boletines físicos:** El 70,6 % señala haber dejado de recoger el boletín físico en alguna ocasión.
- **Control de inasistencias:** El 64,7 % admite no llevar un registro preciso de sus faltas.
- **Riesgo de reprobación:** El 53 % ha reprobado materias sin haber identificado a tiempo su condición de riesgo.
- **Disposición a la autorregulación:** El 94,1 % manifiesta que adoptaría acciones correctivas si tuviera información continua en tiempo real.
