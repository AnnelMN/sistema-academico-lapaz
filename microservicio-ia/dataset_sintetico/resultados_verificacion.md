# Resultados de verificación — dataset sintético de riesgo académico (formato del registro oficial)

Semilla 2026 · 8000 estudiantes · 13 áreas · 3 trimestres. Archivo producido automáticamente por `verificar_dataset.py`.

## Primeras 10 filas

| id_estudiante | promedio_notas | porcentaje_asistencia | areas_reprobadas | nivel | trimestre | nivel_riesgo |
|---|---|---|---|---|---|---|
| E00001 | 78.31 | 92.63 | 0 | 6 | 1 | SIN_RIESGO |
| E00001 | 81.96 | 90.87 | 0 | 6 | 2 | SIN_RIESGO |
| E00001 | 80.62 | 91.03 | 0 | 6 | 3 | SIN_RIESGO |
| E00002 | 90 | 95.19 | 0 | 3 | 1 | SIN_RIESGO |
| E00002 | 90.81 | 96.47 | 0 | 3 | 2 | SIN_RIESGO |
| E00002 | 90.15 | 95.64 | 0 | 3 | 3 | SIN_RIESGO |
| E00003 | 68 | 84.29 | 0 | 4 | 1 | SIN_RIESGO |
| E00003 | 70.62 | 86.22 | 0 | 4 | 2 | SIN_RIESGO |
| E00003 | 71.95 | 87.05 | 0 | 4 | 3 | SIN_RIESGO |
| E00004 | 78.77 | 91.03 | 0 | 3 | 1 | SIN_RIESGO |

## 1. Estructura

**Dataset del modelo:** 24000 filas · 7 columnas · 8000 estudiantes · valores nulos: 0

|  | tipo | nulos | valores distintos |
|---|---|---|---|
| id_estudiante | str | 0 | 8000 |
| promedio_notas | float64 | 0 | 3002 |
| porcentaje_asistencia | float64 | 0 | 579 |
| areas_reprobadas | int64 | 0 | 14 |
| nivel | int64 | 0 | 6 |
| trimestre | int64 | 0 | 3 |
| nivel_riesgo | str | 0 | 3 |

**Centralizador (detalle):** 312000 filas = 8000 estudiantes × 13 áreas × 3 trimestres · 271 cursos ficticios.

Resultado: ✅

## 2. Rangos válidos y fórmulas del registro oficial

| variable | permitido | mínimo | máximo | media | desv. | válido |
|---|---|---|---|---|---|---|
| promedio_notas | 0–100 | 20.31 | 99.08 | 71.61 | 12.88 | ✅ |
| porcentaje_asistencia | 0–100 | 41.99 | 100 | 88.44 | 7.77 | ✅ |
| areas_reprobadas | 0–13 | 0 | 13 | 1.48 | 2.7 | ✅ |
| nivel | 1–6 | 1 | 6 | 3.47 | 1.7 | ✅ |
| trimestre | 1–3 | 1 | 3 | 2 | 0.82 | ✅ |
| Ser (área) | 0–10 | 1 | 10 | 7.85 | 1.25 | ✅ |
| Saber (área) | 0–45 | 0 | 45 | 30.63 | 9.2 | ✅ |
| Hacer (área) | 0–40 | 0 | 40 | 28.43 | 7.25 | ✅ |
| Autoevaluación (área) | 0–5 | 0 | 5 | 3.92 | 0.78 | ✅ |
| Puntos extra | 0–3 | 0 | 3 | 0.2 | 0.65 | ✅ |
| Calificación trimestral | 0–100 | 2 | 100 | 71.03 | 17.37 | ✅ |
| Nota de asistencia (Ser) | 0–10 | 2 | 10 | 8.69 | 1.1 | ✅ |
| Casillas de Ser | 3–6 | 3 | 6 | 4.51 | 1.11 | ✅ |
| Casillas de Saber | 10–15 | 10 | 15 | 12.52 | 1.71 | ✅ |
| Casillas de Hacer | 10–15 | 10 | 15 | 12.53 | 1.7 | ✅ |

| regla del registro oficial | cumple |
|---|---|
| P + F + A + L = días trabajados | ✅ |
| Nota asistencia = ROUND((P + L + A·2/3) × 10 / días) | ✅ |
| Calificación = Ser + Saber + Hacer + Autoevaluación + extras (máx. 100) | ✅ |
| Nota anual del área = ROUND(PROMEDIO(T1, T2, T3)) | ✅ |
| Áreas reprobadas = cantidad de notas anuales < 51 | ✅ |
| Etiqueta: 0 → SIN · 1–2 → MEDIO · ≥3 → ALTO | ✅ |
| Notas de dimensión y calificación son enteras | ✅ |

## 3. Balance de clases (sin duplicar ni eliminar filas)

| nivel_riesgo | estudiantes | filas | % | objetivo % | dentro |
|---|---|---|---|---|---|
| SIN_RIESGO | 5004 | 15012 | 62.6 | 55–70 | ✅ |
| RIESGO_MEDIO | 1369 | 4107 | 17.1 | 15–25 | ✅ |
| RIESGO_ALTO | 1627 | 4881 | 20.3 | 10–25 | ✅ |

**Distribución de áreas reprobadas al cierre**

| áreas reprobadas al cierre | estudiantes | % |
|---|---|---|
| 0 | 5004 | 62.6 |
| 1 | 862 | 10.8 |
| 2 | 507 | 6.3 |
| 3 | 343 | 4.3 |
| 4 | 257 | 3.2 |
| 5 | 187 | 2.3 |
| 6 | 155 | 1.9 |
| 7 | 135 | 1.7 |
| 8 | 125 | 1.6 |
| 9 | 104 | 1.3 |
| 10 | 93 | 1.2 |
| 11 | 77 | 1 |
| 12 | 58 | 0.7 |
| 13 | 93 | 1.2 |

Nota anual por área: media **71.0**, desviación **15.7**, reprobadas (< 51): **11.9 %** de todas las notas de área.

## 4. Distribución por trimestre, nivel y área

**Medias de las entradas por trimestre** (T3 = información a mitad del trimestre)

| trimestre | promedio_notas | porcentaje_asistencia | areas_reprobadas |
|---|---|---|---|
| 1 | 72.02 | 88.55 | 1.47 |
| 2 | 71.59 | 88.42 | 1.43 |
| 3 | 71.2 | 88.35 | 1.53 |

**Medias por dimensión (por área) y trimestre**

| trimestre | ser | saber | hacer | autoevaluacion | puntos_extra | calificacion |
|---|---|---|---|---|---|---|
| 1 | 7.93 | 31.07 | 28.87 | 3.95 | 0.2 | 72.02 |
| 2 | 7.87 | 30.69 | 28.49 | 3.92 | 0.2 | 71.16 |
| 3 | 7.77 | 30.13 | 27.93 | 3.88 | 0.2 | 69.91 |

**Por nivel (% de cada clase)**

| nivel | estudiantes | SIN_RIESGO | RIESGO_MEDIO | RIESGO_ALTO |
|---|---|---|---|---|
| 1 | 1381 | 69 | 15.9 | 15.1 |
| 2 | 1329 | 64.7 | 16.9 | 18.4 |
| 3 | 1326 | 63.7 | 15.9 | 20.4 |
| 4 | 1357 | 60.7 | 17.4 | 21.9 |
| 5 | 1342 | 58.1 | 18.9 | 23 |
| 6 | 1265 | 58.7 | 17.7 | 23.6 |

**Por área** (de la más exigente a la menos exigente)

| area | nota_anual_media | reprobados_pct |
|---|---|---|
| MATEMÁTICA | 66.3 | 18.7 |
| FÍSICA | 66.9 | 17.5 |
| QUÍMICA | 67.4 | 16.8 |
| LENGUA EXTRANJERA | 69.6 | 14.2 |
| CIENCIAS NATURALES (BIOLOGÍA-GEOGRAFÍA) | 70 | 13.1 |
| FILOSOFÍA - PSICOLOGÍA | 70.6 | 12.3 |
| COMUNICACIÓN Y LENGUAJE | 70.7 | 12.3 |
| CIENCIAS SOCIALES | 71.1 | 11.5 |
| TÉCNICA TECNOLÓGICA | 72.2 | 9.5 |
| VALORES, ESPIRITUALIDAD Y RELIGIONES | 74.1 | 7.8 |
| EDUCACIÓN MUSICAL | 74.7 | 7.2 |
| ARTES PLÁSTICAS Y VISUALES | 74.8 | 7 |
| EDUCACIÓN FÍSICA Y DEPORTES | 75.1 | 6.8 |

**Asistencia:** P 82.73 % · F 11.69 % · A 4.57 % · L 1.01 % de los días. Asistencia por área y trimestre entre 80 y 98 %: 64.1 %; bajo 70 %: 5.6 %.

## 5. Correlaciones entre variables de entrada

|  | promedio_notas | porcentaje_asistencia | areas_reprobadas | nivel | trimestre |
|---|---|---|---|---|---|
| promedio_notas | 1 | 0.377 | -0.846 | -0.09 | -0.026 |
| porcentaje_asistencia | 0.377 | 1 | -0.307 | 0.011 | -0.01 |
| areas_reprobadas | -0.846 | -0.307 | 1 | 0.078 | 0.01 |
| nivel | -0.09 | 0.011 | 0.078 | 1 | -0 |
| trimestre | -0.026 | -0.01 | 0.01 | -0 | 1 |

| trimestre | corr(promedio_notas, asistencia) |
|---|---|
| 1 | 0.358 |
| 2 | 0.379 |
| 3 | 0.394 |

Notas–asistencia por trimestre dentro de 0,3–0,6: ✅. La correlación fuerte y negativa entre `promedio_notas` y `areas_reprobadas` es esperable: ambas resumen el rendimiento, pero la segunda capta las debilidades en áreas puntuales.

## 6. Prueba anti-fuga (árbol de decisión, separación por estudiante)

| trimestre | filas de prueba | F1 macro (árbol) | F1 macro (regla 0/1–2/≥3 sobre áreas reprobadas observadas) |
|---|---|---|---|
| 1 | 1600 | 0.707 | 0.711 |
| 2 | 1600 | 0.822 | 0.839 |
| 3 | 1600 | 0.911 | 0.911 |
| global | 4800 | 0.814 | — |

Separación por estudiante: 6400 de entrenamiento y 1600 de prueba, sin estudiantes compartidos ✅

- F1 creciente T1 < T2 < T3: ✅
- F1 global entre 0,78 y 0,92: ✅
- F1 global < 0,97 (sin fuga): ✅
- Ningún trimestre alcanza F1 = 1 (la etiqueta no es una regla directa de la fila): ✅

## 6b. Estabilidad de la prueba anti-fuga (5 particiones distintas)

| trimestre | F1 medio | desv. |
|---|---|---|
| 1 | 0.711 | 0.01 |
| 2 | 0.827 | 0.005 |
| 3 | 0.92 | 0.004 |
| global | 0.82 | 0.003 |

En todas las particiones se cumplen las condiciones: ✅

## 7. Reproducibilidad

| Generación | Huella SHA-256 del dataset (16 primeros) |
|---|---|
| 1ª (semilla 2026) | `f7ea2281f9c9dbc4` |
| 2ª (misma semilla) | `f7ea2281f9c9dbc4` |

Idénticas (dataset y centralizador): ✅ · Con otra semilla el resultado cambia: ✅

## Resumen

| verificación | resultado |
|---|---|
| 1. Estructura | ✅ |
| 2. Rangos y fórmulas del registro | ✅ |
| 3. Balance | ✅ |
| 5. Correlaciones | ✅ |
| 6. Anti-fuga | ✅ |
| 6b. Anti-fuga (estabilidad) | ✅ |
| 7. Reproducibilidad | ✅ |
