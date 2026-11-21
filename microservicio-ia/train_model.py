"""
=============================================================
SISTEMA DE PREDICCIÓN DE RIESGO ACADÉMICO
Unidad Educativa La Paz "A" — Gestión 2026
Metodología: CRISP-DM
Modelos: Árbol de Decisión (entropía, tipo ID3) vs Random Forest
Postulante: Mamani Huarca Najhely Annel — Universidad Salesiana de Bolivia
=============================================================

Entrena con el DATASET SINTÉTICO (dataset_sintetico/, ver docs/DATASET_SINTETICO.md):
cada fila es un estudiante en un trimestre, con la información disponible hasta
ese momento, y la etiqueta es el riesgo según las áreas reprobadas al cierre.

Uso (desde microservicio-ia/):
    venv/Scripts/python.exe dataset_sintetico/generar_dataset.py   # si aún no existe el CSV
    venv/Scripts/python.exe train_model.py

Salidas en model/:
    modelo_riesgo.pkl          → el mejor modelo (lo usa main.py)
    metricas_modelo.json       → métricas, parámetros e importancia de variables
    reglas_arbol_decision.txt  → las reglas del árbol en texto (para la tesis)
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (accuracy_score, classification_report, confusion_matrix,
                             f1_score, precision_score, recall_score)
from sklearn.model_selection import GroupKFold, GroupShuffleSplit
from sklearn.tree import DecisionTreeClassifier, export_text

BASE = Path(__file__).resolve().parent
ARCHIVO_DATOS = BASE / "data" / "dataset_riesgo_sintetico.csv"
CARPETA_MODELO = BASE / "model"
SEMILLA = 2026

# Variables de entrada (el id_estudiante NO es variable: solo agrupa filas)
FEATURES = ["promedio_notas", "porcentaje_asistencia", "areas_reprobadas", "nivel", "trimestre"]
OBJETIVO = "nivel_riesgo"
CLASES = ["SIN_RIESGO", "RIESGO_MEDIO", "RIESGO_ALTO"]


def titulo(texto: str) -> None:
    print(f"\n{'─' * 62}\n{texto}\n{'─' * 62}")


# ═════════════════════════════════════════════════════════════
# FASES 1 y 2 — Comprensión del negocio y de los datos
# ═════════════════════════════════════════════════════════════
def cargar_datos() -> pd.DataFrame:
    titulo("FASE 1-2 · Comprensión del problema y de los datos")
    if not ARCHIVO_DATOS.exists():
        sys.exit(f"No existe {ARCHIVO_DATOS}. Genérelo con: venv/Scripts/python.exe dataset_sintetico/generar_dataset.py")
    df = pd.read_csv(ARCHIVO_DATOS)
    print(f"Archivo: {ARCHIVO_DATOS.name} · {len(df):,} filas · {df.id_estudiante.nunique():,} estudiantes")
    print("Objetivo: predecir el riesgo de reprobar áreas al cierre del año, con la información parcial del trimestre.")
    dist = df[df.trimestre == 1][OBJETIVO].value_counts(normalize=True).reindex(CLASES) * 100
    print("Distribución de clases (por estudiante): " + " · ".join(f"{c} {v:.1f} %" for c, v in dist.items()))
    return df


# ═════════════════════════════════════════════════════════════
# FASE 3 — Preparación de datos y división 80/20 por estudiante
# ═════════════════════════════════════════════════════════════
def preparar(df: pd.DataFrame):
    titulo("FASE 3 · Preparación y división 80 % entrenamiento / 20 % prueba")
    nulos = int(df[FEATURES + [OBJETIVO]].isna().sum().sum())
    print(f"Valores nulos: {nulos} · Variables: {FEATURES}")
    # Las 3 filas de un estudiante quedan SIEMPRE del mismo lado: si un estudiante
    # estuviera en ambos lados, el modelo "conocería" la respuesta (fuga de datos).
    corte = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=SEMILLA)
    i_ent, i_pru = next(corte.split(df, groups=df.id_estudiante))
    ent, pru = df.iloc[i_ent], df.iloc[i_pru]
    assert set(ent.id_estudiante).isdisjoint(pru.id_estudiante)
    print(f"Entrenamiento: {len(ent):,} filas ({ent.id_estudiante.nunique():,} estudiantes) · "
          f"Prueba: {len(pru):,} filas ({pru.id_estudiante.nunique():,} estudiantes) · sin estudiantes compartidos")
    return ent, pru


# ═════════════════════════════════════════════════════════════
# FASE 4 — Modelado (con ajuste de hiperparámetros por validación cruzada)
# ═════════════════════════════════════════════════════════════
def elegir_por_validacion(nombre, fabrica, opciones, ent):
    """Validación cruzada de 5 particiones POR ESTUDIANTE, solo sobre el
    entrenamiento: el 20 % de prueba no se toca hasta la evaluación final."""
    gkf = GroupKFold(n_splits=5)
    resultados = []
    for params in opciones:
        f1s = []
        for i_a, i_b in gkf.split(ent, groups=ent.id_estudiante):
            m = fabrica(**params).fit(ent.iloc[i_a][FEATURES], ent.iloc[i_a][OBJETIVO])
            f1s.append(f1_score(ent.iloc[i_b][OBJETIVO], m.predict(ent.iloc[i_b][FEATURES]), average="macro"))
        resultados.append((float(np.mean(f1s)), float(np.std(f1s)), params))
        print(f"  {nombre} {params} → F1 macro (validación) {np.mean(f1s):.4f} ± {np.std(f1s):.4f}")
    mejor = max(resultados, key=lambda r: r[0])
    print(f"  ⇒ Elegido: {mejor[2]}")
    return mejor[2], [{"parametros": r[2], "f1_macro_validacion": round(r[0], 4), "desv": round(r[1], 4)} for r in resultados]


def arbol(**kw):
    return DecisionTreeClassifier(criterion="entropy", min_samples_leaf=20, random_state=SEMILLA, **kw)


def bosque(**kw):
    return RandomForestClassifier(n_estimators=200, criterion="entropy", min_samples_leaf=10,
                                  random_state=SEMILLA, n_jobs=-1, **kw)


def modelar(ent):
    titulo("FASE 4 · Modelado")
    print("Árbol de Decisión (criterio de entropía = ganancia de información, como ID3):")
    p_arbol, cv_arbol = elegir_por_validacion("Árbol", arbol, [{"max_depth": d} for d in (3, 4, 5, 6, 8, 10)], ent)
    print("Random Forest (200 árboles con entropía, cada uno sobre una muestra distinta):")
    p_rf, cv_rf = elegir_por_validacion("RF", bosque, [{"max_depth": d} for d in (6, 8, 10, 14)], ent)
    m_arbol = arbol(**p_arbol).fit(ent[FEATURES], ent[OBJETIVO])
    m_rf = bosque(**p_rf).fit(ent[FEATURES], ent[OBJETIVO])
    return {"arbol_decision": (m_arbol, p_arbol, cv_arbol), "random_forest": (m_rf, p_rf, cv_rf)}


# ═════════════════════════════════════════════════════════════
# FASE 5 — Evaluación en el 20 % de prueba
# ═════════════════════════════════════════════════════════════
def evaluar(modelo, pru) -> dict:
    y, pred = pru[OBJETIVO], modelo.predict(pru[FEATURES])
    m = {
        "accuracy": accuracy_score(y, pred),
        "precision_macro": precision_score(y, pred, average="macro"),
        "recall_macro": recall_score(y, pred, average="macro"),
        "f1_macro": f1_score(y, pred, average="macro"),
        "f1_por_trimestre": {int(t): f1_score(y[pru.trimestre == t], pred[(pru.trimestre == t).to_numpy()], average="macro")
                             for t in (1, 2, 3)},
        "matriz_confusion": {"clases (filas = real, columnas = predicho)": CLASES,
                             "valores": confusion_matrix(y, pred, labels=CLASES).tolist()},
        "por_clase": {c: {k: v for k, v in d.items() if k != "support"} | {"casos": int(d["support"])}
                      for c, d in classification_report(y, pred, labels=CLASES, output_dict=True).items() if c in CLASES},
    }
    return m


def mostrar(nombre, m):
    print(f"\n{nombre}")
    print(f"  Accuracy {m['accuracy']:.4f} · Precisión {m['precision_macro']:.4f} · Recall {m['recall_macro']:.4f} · "
          f"F1 macro {m['f1_macro']:.4f}")
    print("  F1 por trimestre: " + " · ".join(f"T{t} {v:.4f}" for t, v in m["f1_por_trimestre"].items()))
    print("  Por clase:")
    for c, d in m["por_clase"].items():
        print(f"    {c:13} precisión {d['precision']:.3f} · recall {d['recall']:.3f} · F1 {d['f1-score']:.3f} · casos {d['casos']}")
    print("  Matriz de confusión (filas = real, columnas = predicho):")
    print("    " + " ".join(f"{c[:12]:>13}" for c in CLASES))
    for c, fila in zip(CLASES, m["matriz_confusion"]["valores"]):
        print(f"    {c[:12]:>12} " + " ".join(f"{v:>13}" for v in fila))


# ═════════════════════════════════════════════════════════════
# FASE 6 — Despliegue: guardar el mejor modelo y sus métricas
# ═════════════════════════════════════════════════════════════
def guardar(modelos, metricas, df):
    titulo("FASE 6 · Selección y guardado del mejor modelo")
    nombre_mejor = max(metricas, key=lambda k: metricas[k]["f1_macro"])
    mejor = modelos[nombre_mejor][0]
    print(f"Mejor modelo por F1 macro en prueba: {nombre_mejor} ({metricas[nombre_mejor]['f1_macro']:.4f})")
    CARPETA_MODELO.mkdir(exist_ok=True)
    joblib.dump(mejor, CARPETA_MODELO / "modelo_riesgo.pkl")

    importancias = dict(sorted(zip(FEATURES, mejor.feature_importances_.round(4).tolist()), key=lambda x: -x[1]))
    huella = hashlib.sha256(ARCHIVO_DATOS.read_bytes()).hexdigest()[:16]
    salida = {
        "modelo_seleccionado": nombre_mejor,
        "criterio_seleccion": "Mayor F1 macro en el 20 % de prueba (separado por estudiante)",
        "fecha_entrenamiento": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "scikit_learn": sklearn.__version__,
        "dataset": {"archivo": ARCHIVO_DATOS.name, "sha256_16": huella, "filas": len(df),
                    "estudiantes": int(df.id_estudiante.nunique()), "tipo": "sintético (ver docs/DATASET_SINTETICO.md)"},
        "features": FEATURES,
        "clases": CLASES,
        "etiqueta": {"SIN_RIESGO": "0 áreas reprobadas al cierre", "RIESGO_MEDIO": "1 o 2 áreas", "RIESGO_ALTO": "3 o más áreas"},
        "variables_influyentes": importancias,
        "modelos": {k: {"parametros": modelos[k][1], "validacion_cruzada": modelos[k][2],
                        **{m: (round(v, 4) if isinstance(v, float) else v) for m, v in metricas[k].items()}}
                    for k in modelos},
        "advertencia": "Métricas sobre datos sintéticos: miden la coherencia del pipeline, no el desempeño real. "
                       "Reentrenar con datos reales del sistema cuando existan.",
    }
    for k in salida["modelos"]:
        salida["modelos"][k]["f1_por_trimestre"] = {t: round(v, 4) for t, v in metricas[k]["f1_por_trimestre"].items()}
        salida["modelos"][k]["por_clase"] = {c: {m: round(v, 4) if isinstance(v, float) else v for m, v in d.items()}
                                             for c, d in metricas[k]["por_clase"].items()}
    (CARPETA_MODELO / "metricas_modelo.json").write_text(json.dumps(salida, ensure_ascii=False, indent=2), encoding="utf-8")

    reglas = export_text(modelos["arbol_decision"][0], feature_names=FEATURES, decimals=1, show_weights=False)
    (CARPETA_MODELO / "reglas_arbol_decision.txt").write_text(
        "Reglas del Árbol de Decisión (entropía) entrenado con el dataset sintético.\n"
        "Cada rama es una condición; cada hoja ('class:') es el nivel de riesgo predicho.\n\n" + reglas, encoding="utf-8")
    print("Guardados: model/modelo_riesgo.pkl · model/metricas_modelo.json · model/reglas_arbol_decision.txt")
    print("Importancia de las variables: " + " · ".join(f"{k} {v:.3f}" for k, v in importancias.items()))

    # Prueba de carga, como lo hará el microservicio
    cargado = joblib.load(CARPETA_MODELO / "modelo_riesgo.pkl")
    ejemplo = pd.DataFrame([{"promedio_notas": 58, "porcentaje_asistencia": 80, "areas_reprobadas": 2, "nivel": 4, "trimestre": 2}])
    print(f"Prueba de carga: {ejemplo.iloc[0].to_dict()} → {cargado.predict(ejemplo)[0]} "
          f"(probabilidad {cargado.predict_proba(ejemplo).max():.2f})")
    return nombre_mejor


def main():
    df = cargar_datos()
    ent, pru = preparar(df)
    modelos = modelar(ent)
    titulo("FASE 5 · Evaluación en el 20 % de prueba (estudiantes nunca vistos)")
    metricas = {k: evaluar(v[0], pru) for k, v in modelos.items()}
    for k, m in metricas.items():
        mostrar("Árbol de Decisión" if k == "arbol_decision" else "Random Forest", m)
    guardar(modelos, metricas, df)


if __name__ == "__main__":
    main()
