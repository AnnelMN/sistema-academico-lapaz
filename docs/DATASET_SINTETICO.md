# Dataset sintético para la predicción de riesgo académico
### Unidad Educativa La Paz "A" — Proyecto de grado, 2026

---

## 1. Propósito y justificación

El módulo de predicción del sistema clasifica a cada estudiante en una de tres categorías de riesgo (`SIN_RIESGO`, `RIESGO_MEDIO`, `RIESGO_ALTO`) a partir de su rendimiento parcial del año. Para entrenar un modelo de aprendizaje supervisado se necesitan ejemplos históricos etiquetados. Sin embargo, la Unidad Educativa La Paz "A" **no dispone de registros históricos digitales** de calificaciones y asistencia. Además, la Dirección **no puede entregar datos personales de estudiantes** por tratarse de menores de edad.

Por estas razones se construyó un **dataset sintético** mediante simulación estocástica. Reproduce dos fuentes:

1. **La rúbrica de calificación confirmada por el Director de la institución:** Ser 10, Saber 45, Hacer 40 y Autoevaluación 5, con aprobación desde 51 puntos.
2. **La estructura del registro pedagógico oficial de secundaria:** casillas por dimensión calificadas en la escala de cada dimensión, asistencia diaria con los códigos P/F/A/L, puntos extra y un centralizador con 13 áreas, notas por trimestre, nota anual y áreas reprobadas.

El dataset es reproducible (semilla fija), parametrizable (todos los supuestos están en una sola estructura) y **completamente ficticio**: ningún valor proviene de una persona real. Su propósito es **validar el pipeline de entrenamiento y el funcionamiento integral del sistema**. No estima el desempeño real del modelo (ver §9).

## 2. Reglas del registro oficial que se reproducen

| Elemento | Regla aplicada |
|---|---|
| **Casillas** | Cada dimensión tiene varias casillas, calificadas **en la escala de la dimensión**. La cantidad la define el docente en cada área y trimestre: Ser de 3 a 6, Saber de 10 a 15 y Hacer de 10 a 15. |
| **Nota de una dimensión** | `ROUND(PROMEDIO(casillas))`, redondeando hacia arriba desde 0,5. |
| **Asistencia diaria** | Cada día de clase de cada área recibe un código: **P** (presente), **F** (falta), **A** (atraso) o **L** (licencia). |
| **Nota de asistencia** | `ROUND((P + L + A·2/3) × 10 / días trabajados)`. El atraso vale 2/3 de asistencia y la licencia cuenta como asistencia. Esta nota es **la primera casilla de Ser** ("Asistencia y Puntualidad"). |
| **Autoevaluación** | Entero de 0 a 5. |
| **Puntos extra** | De 0 a 3, sumados a la calificación trimestral. |
| **Calificación trimestral** | Ser + Saber + Hacer + Autoevaluación + puntos extra, con un **máximo de 100**. |
| **Nota anual del área** | `ROUND(PROMEDIO(T1, T2, T3))`. |
| **Área reprobada** | Nota anual del área menor a 51. |

Las 13 áreas del centralizador son: Comunicación y Lenguaje; Lengua Extranjera; Ciencias Sociales; Educación Musical; Artes Plásticas y Visuales; Educación Física y Deportes; Matemática; Técnica Tecnológica; Física; Química; Ciencias Naturales (Biología-Geografía); Filosofía - Psicología; y Valores, Espiritualidad y Religiones.

## 3. Definición de la etiqueta

La etiqueta depende de la **cantidad de áreas reprobadas al cierre del año**. Es el criterio que determina la promoción del estudiante en el sistema educativo:

| Áreas reprobadas al cierre | Etiqueta |
|---|---|
| 0 | `SIN_RIESGO` |
| 1 o 2 | `RIESGO_MEDIO` |
| 3 o más | `RIESGO_ALTO` |

Los umbrales se pueden cambiar con `areas_riesgo_medio` y `areas_riesgo_alto` para adecuarlos al reglamento de promoción vigente. Las tres filas de un mismo estudiante comparten la misma etiqueta.

## 4. Principio central: predecir, no copiar una regla

Cada fila contiene **solo la información disponible en el momento de la predicción**. La etiqueta se define con el **cierre anual**, que incluye información posterior. Si la etiqueta pudiera obtenerse con una regla directa sobre las columnas de la misma fila, el modelo aprendería esa regla (*fuga de datos*) y sus métricas no tendrían valor.

**La fila del tercer trimestre.** Si esa fila usara las notas finales de T3, sus áreas reprobadas serían exactamente la etiqueta. Por eso representa la predicción **a mitad del tercer trimestre**, que es como opera el sistema: la predicción se recalcula cada vez que el docente registra notas o asistencia, antes del cierre.

- En ese momento solo se conocen las primeras casillas de cada dimensión y los primeros días de clase (parámetro `avance_t3 = 0,5`).
- La autoevaluación de T3 todavía no se registró, así que se usa la de T2.
- Durante la segunda mitad del trimestre el estudiante puede mejorar o empeorar (`variacion_segunda_mitad_t3`), como ocurre en la realidad.

## 5. Modelo de generación

Cada paso es una función de `microservicio-ia/dataset_sintetico/generar_dataset.py`. Todos comparten un único generador pseudoaleatorio (`numpy.random.default_rng`) inicializado con la semilla.

| Paso | Función | Descripción |
|---|---|---|
| 1 | `paso1_estudiantes` | Cada estudiante tiene dos **rasgos latentes** que no aparecen en el dataset: *aptitud* (capacidad teórica) y *compromiso* (constancia y responsabilidad). Ambos siguen una distribución Normal(0, 1) con correlación 0,30. Recibe además un nivel de 1.º a 6.º, un curso ficticio de unos 30 estudiantes, una **afinidad por área** (fortalezas y debilidades propias) y un **factor externo** de inasistencia (salud, transporte, trabajo familiar). |
| 2 | `paso2_evolucion` | Los rasgos cambian de un trimestre a otro mediante un paseo aleatorio. El 13 % de los estudiantes sufre un **cambio brusco** en T2 o T3 (70 % caídas, 30 % recuperaciones). |
| 3 | `paso3_asistencia` | Para cada área y trimestre se simulan 24 días de clase con los códigos P/F/A/L, usando un modelo logístico multinomial. La probabilidad de faltar y de llegar tarde depende del compromiso y del factor externo. |
| 4 | `paso4_notas` | Se simula **cada casilla**. Ser depende del compromiso. Saber depende de la aptitud, sobre todo en las áreas teóricas, y del compromiso. Hacer depende del compromiso y de la aptitud práctica. A todas se suman la afinidad, la dificultad del área y del nivel, y el ruido del período y de cada casilla. Algunos trabajos no se entregan o algunos exámenes no se rinden (casilla en 0). Las notas se calculan con las fórmulas del §2. |
| 5 | `paso5_etiqueta` | Nota anual por área, cantidad de áreas reprobadas y etiqueta (§3). |
| 5b | `paso5b_parcial_t3` | Información disponible a mitad del tercer trimestre (§4). |
| 6 | `paso6_filas` | Tres filas por estudiante. Por cada área se calcula la nota acumulada; luego, por estudiante, el promedio de las áreas, la asistencia acumulada y las áreas reprobadas hasta ese momento. |

**Dificultad por área.** Las áreas difieren en exigencia (parámetro `dificultad`) y en cuánto pesa la aptitud teórica frente a la práctica (parámetro `teorica`). Por ejemplo, Matemática, Física y Química son más exigentes y teóricas, mientras que Educación Física, Artes y Música son más prácticas.

## 6. Parámetros principales y su justificación

Todos están en la clase `Parametros` y en el diccionario `AREAS` del generador.

| Parámetro | Valor | Justificación |
|---|---|---|
| `semilla` | 2026 | Reproducibilidad exacta. |
| `n_estudiantes` | 8.000 | Equivale a unos 271 cursos de 30 estudiantes (varias gestiones de un colegio grande). Genera 24.000 filas para el modelo y 312.000 registros de área. |
| `correlacion_aptitud_compromiso` | 0,30 | Quien rinde en lo teórico tiende a ser constante, pero no siempre. |
| `afinidad_por_area` | 0,60 | Cada estudiante tiene áreas fuertes y débiles. Es lo que permite que haya estudiantes con 1 o 2 áreas reprobadas y no solo con "todo bien" o "todo mal". |
| `exigencia_por_nivel` | 0,05 | Los niveles superiores son levemente más exigentes. |
| `variacion_trimestral` | 0,35 | El rendimiento cambia entre trimestres sin perder la identidad del estudiante. |
| `proporcion_cambio_brusco` | 0,13 | Dentro del 10–15 %. Representa casos de abandono o recuperación. |
| `clases_por_trimestre` | 24 | Días de clase de cada área por trimestre. |
| `falta_base`, `atraso_base`, `prob_licencia` | −2,2 / −3,0 / 1,2 % | Para un estudiante promedio, unas 3 faltas, 1 atraso y una licencia ocasional por área y trimestre (en la muestra: 11,7 % de días F, 4,6 % A, 1,0 % L). |
| `factor_externo_asistencia` | 0,65 | Causas de inasistencia ajenas al rendimiento. Mantiene la correlación entre notas y asistencia en un nivel moderado. |
| `casillas_ser / saber / hacer` | 3–6 / 10–15 / 10–15 | Rangos configurados en el registro oficial. |
| `ruido_periodo`, `ruido_casilla` | 0,40 / 0,55 | Variación del estudiante en un área y trimestre, y variación entre exámenes o trabajos. |
| `prob_puntos_extra` | 0,10 | Uso ocasional de los puntos extra (1 a 3). |
| `avance_t3`, `variacion_segunda_mitad_t3` | 0,5 / 0,6 | Predicción a mitad del T3 y posible cambio posterior (§4). |
| `areas_riesgo_medio / alto` | 1 / 3 | Definición de la etiqueta (§3). |

## 7. Columnas de los archivos

**Dataset del modelo:** `microservicio-ia/data/dataset_riesgo_sintetico.csv` (24.000 filas × 7 columnas)

| Columna | Tipo | Descripción | ¿Entrada del modelo? |
|---|---|---|---|
| `id_estudiante` | texto (`E00001`…) | Identificador ficticio. Solo sirve para agrupar las filas del mismo estudiante. | **No** |
| `promedio_notas` | decimal 0–100 | Promedio de las 13 áreas de la nota acumulada hasta el trimestre. | Sí |
| `porcentaje_asistencia` | decimal 0–100 | (P + A + L) / días × 100, acumulado en todas las áreas. | Sí |
| `areas_reprobadas` | entero 0–13 | Áreas cuya nota acumulada, redondeada, es menor a 51. | Sí |
| `nivel` | entero 1–6 | Curso (1.º a 6.º de secundaria). | Sí |
| `trimestre` | entero 1–3 | Momento de la predicción (en T3, a mitad del trimestre). | Sí |
| `nivel_riesgo` | categoría | Etiqueta del cierre anual (§3). | Variable objetivo |

**Detalle con formato de centralizador:** `microservicio-ia/data/centralizador_sintetico.csv` (312.000 filas: estudiante × área × trimestre). Incluye:

- curso, nivel y área;
- cantidad de casillas por dimensión;
- notas de Ser, Saber, Hacer y Autoevaluación, puntos extra y calificación;
- conteos P/F/A/L, días trabajados y nota de asistencia;
- calificación parcial a mitad del T3;
- nota anual del área, áreas reprobadas, tipo de cambio brusco y etiqueta.

Este archivo sirve para verificar y documentar. **No** contiene los rasgos ocultos.

## 8. Resultados de las verificaciones

Las tablas completas se generan automáticamente en `microservicio-ia/dataset_sintetico/resultados_verificacion.md`.

### 8.1 Estructura
El dataset tiene 24.000 filas, 7 columnas, 8.000 estudiantes y **0 valores nulos**. El centralizador tiene 312.000 filas (8.000 × 13 áreas × 3 trimestres), distribuidas en 271 cursos ficticios.

### 8.2 Rangos y fórmulas del registro oficial
Todas las variables están dentro de sus rangos: Ser 0–10, Saber 0–45, Hacer 0–40, Autoevaluación 0–5, puntos extra 0–3, calificación 0–100 y casillas dentro de los rangos configurados. Además, se comprobó **fila por fila** que se cumplen todas las reglas del §2 y la definición de la etiqueta:

- P + F + A + L = días trabajados ✅
- La nota de asistencia coincide con su fórmula ✅
- La calificación es la suma de las dimensiones, con máximo 100 ✅
- La nota anual de cada área es el promedio redondeado de los tres trimestres ✅
- Las áreas reprobadas y la etiqueta son consistentes ✅
- Todas las notas son enteras ✅

### 8.3 Balance de clases (sin duplicar ni eliminar filas)

| Clase | Estudiantes | % | Objetivo |
|---|---|---|---|
| SIN_RIESGO | 5.004 | 62,6 % | 55–70 % ✅ |
| RIESGO_MEDIO | 1.369 | 17,1 % | 15–25 % ✅ |
| RIESGO_ALTO | 1.627 | 20,3 % | 10–25 % ✅ |

La nota anual por área tiene media 71,0 y desviación 15,7, y el 11,9 % de las notas de área están reprobadas. Entre los estudiantes con alguna área reprobada, 1 área es el caso más frecuente (10,8 %) y la frecuencia baja a medida que aumentan las áreas reprobadas.

### 8.4 Distribución por nivel y por área
El riesgo alto crece con el nivel: 15,1 % en 1.º y 23,6 % en 6.º. Las áreas más exigentes son Matemática (18,7 % de reprobados), Física (17,5 %) y Química (16,8 %). Las menos exigentes son Educación Física (6,8 %), Artes Plásticas (7,0 %) y Música (7,2 %). La asistencia se reparte así: 82,7 % de los días P, 11,7 % F, 4,6 % A y 1,0 % L.

### 8.5 Correlaciones entre las entradas

| | promedio_notas | porcentaje_asistencia | areas_reprobadas | nivel | trimestre |
|---|---|---|---|---|---|
| promedio_notas | 1 | 0,377 | −0,846 | −0,090 | −0,026 |
| porcentaje_asistencia | 0,377 | 1 | −0,307 | 0,011 | −0,010 |
| areas_reprobadas | −0,846 | −0,307 | 1 | 0,078 | 0,010 |
| nivel | −0,090 | 0,011 | 0,078 | 1 | 0,000 |
| trimestre | −0,026 | −0,010 | 0,010 | 0,000 | 1 |

La correlación entre notas y asistencia es moderada (0,36 en T1, 0,38 en T2 y 0,39 en T3), dentro del rango esperado de 0,3–0,6. La correlación fuerte y negativa entre `promedio_notas` y `areas_reprobadas` es esperable, porque ambas resumen el rendimiento. Aun así, la segunda aporta información propia: un estudiante con buen promedio puede tener un área débil.

### 8.6 Prueba anti-fuga
Se entrenó un árbol de decisión simple (entropía, profundidad 6) con una partición 80/20 **por estudiante**: las tres filas de cada estudiante quedan siempre del mismo lado. Este clasificador sirve **solo para probar el dataset** y no es el modelo del sistema.

| Trimestre | F1 macro (árbol) | F1 macro (regla 0 / 1–2 / ≥3 sobre las áreas reprobadas observadas) |
|---|---|---|
| 1 | 0,707 | 0,711 |
| 2 | 0,822 | 0,839 |
| 3 | 0,911 | 0,911 |
| **Global** | **0,814** | — |

- El F1 crece con el trimestre (T1 < T2 < T3) ✅
- El F1 global está entre 0,78 y 0,92 ✅
- No hay fuga: ningún trimestre alcanza F1 = 1 ✅
- **Estabilidad:** con 5 particiones distintas, el F1 global es 0,820 ± 0,003, y las condiciones se cumplen en todas.

### 8.7 Reproducibilidad
Dos generaciones con la semilla 2026 producen el mismo dataset y el mismo centralizador (huella SHA-256 `f7ea2281f9c9dbc4…`). Con otra semilla el resultado cambia ✅

## 9. Limitaciones

1. **Los datos son ficticios.** Reflejan los supuestos del generador, no el comportamiento real de los estudiantes de la institución.
2. **Las métricas no representan el desempeño real.** El F1 mide la coherencia del pipeline con los supuestos de la simulación, no la capacidad de predecir el riesgo en la U.E. La Paz "A".
3. **Variables limitadas.** El modelo usa notas, asistencia, áreas reprobadas, nivel y trimestre. No representa factores como el contexto familiar, la salud o el apoyo escolar.
4. **Supuestos de reglamento.** Los umbrales de la etiqueta (1 y 3 áreas) y los rangos de casillas siguen el registro oficial y deben confirmarse con la normativa de evaluación vigente.
5. **Reentrenamiento obligatorio.** El modelo debe reentrenarse con los datos reales que el propio sistema acumule (al menos una gestión completa). Las predicciones deben presentarse siempre como orientativas: la decisión pedagógica final es del docente o del director.

## 10. Recalibración con datos reales anonimizados

Cuando se disponga de un **centralizador anual anonimizado** (sin nombres, CI ni RUDE), los parámetros pueden ajustarse sin cambiar la lógica:

| Estadístico real a medir | Parámetros que ajusta |
|---|---|
| Media y desviación de Ser, Saber, Hacer y Autoevaluación | `*_base` y `*_peso_*` de cada dimensión |
| Proporción de días P, F, A y L | `falta_base`, `atraso_base`, `prob_licencia` |
| Porcentaje de reprobados por área | `dificultad` y `teorica` de cada área |
| Distribución de áreas reprobadas por estudiante | `afinidad_por_area` y los pesos de los rasgos |
| Diferencia entre niveles | `exigencia_por_nivel` |
| Uso de puntos extra | `prob_puntos_extra` |
| Cantidad de casillas que usan los docentes | `casillas_ser`, `casillas_saber`, `casillas_hacer` |

**Procedimiento:**
1. Calcular los estadísticos reales.
2. Ajustar los parámetros.
3. Regenerar el dataset.
4. Ejecutar `verificar_dataset.py`.
5. Comparar las tablas del dataset con las reales y repetir hasta que las diferencias sean pequeñas.

## 11. Cómo reproducirlo

Desde la carpeta `microservicio-ia/`:

```bash
venv/Scripts/python.exe dataset_sintetico/generar_dataset.py    # genera los CSV en data/
venv/Scripts/python.exe dataset_sintetico/verificar_dataset.py  # ejecuta las verificaciones
```

Los CSV se guardan en `microservicio-ia/data/`, que no se sube a Git, porque se regeneran idénticos con la misma semilla.

### Excel de ejemplo de un curso

`dataset_sintetico/ejemplo_registro_sintetico.xlsx` muestra **un curso ficticio de 5.º (30 estudiantes)** del dataset con el aspecto del registro pedagógico oficial:

- **LEEME** y **CARATULA**, con la configuración editable.
- **ASISTENCIA** y **REGISTRO** de Matemática por trimestre.
- **CENTRALIZADOR** de las 13 áreas.

Las notas de asistencia, los promedios por dimensión, la calificación trimestral, la nota anual, las áreas reprobadas y el nivel de riesgo se calculan con **fórmulas de Excel**, como en el registro original. La columna «¿Coincide?» confirma que el riesgo calculado por las fórmulas es igual a la etiqueta del dataset.

Para regenerarlo se necesita `openpyxl`, que el microservicio no usa:

```bash
venv/Scripts/python.exe -m pip install openpyxl==3.1.5
venv/Scripts/python.exe dataset_sintetico/generar_excel_ejemplo.py
```
