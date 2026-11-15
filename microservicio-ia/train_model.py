"""
=============================================================
SISTEMA DE PREDICCIÓN DE RENDIMIENTO ACADÉMICO
Unidad Educativa La Paz "A" — Gestión 2026
Metodología: CRISP-DM
Modelos: Árbol de Decisión ID3 vs Random Forest
Postulante: Mamani Huarca Najhely Annel
Universidad Salesiana de Bolivia
=============================================================
"""

import pandas as pd
import numpy as np
import joblib
import json
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    accuracy_score
)
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("SISTEMA DE PREDICCIÓN DE RENDIMIENTO ACADÉMICO")
print("Metodología CRISP-DM — U.E. La Paz 'A'")
print("=" * 60)

# ─────────────────────────────────────────────
# FASE 1: COMPRENSIÓN Y CARGA DE DATOS
# ─────────────────────────────────────────────
print("\n📂 FASE 1: Carga de datos...")

df = pd.read_csv("student_performance.csv")
print(f"   Registros cargados: {len(df):,}")
print(f"   Columnas: {list(df.columns)}")

# ─────────────────────────────────────────────
# FASE 2: PREPARACIÓN DE DATOS (CRISP-DM)
# ─────────────────────────────────────────────
print("\n🔧 FASE 2: Preparación de datos...")

# Eliminar nulos
df = df.dropna()

# Muestra representativa de 50,000 registros
df = df.sample(n=50000, random_state=42).reset_index(drop=True)
print(f"   Muestra representativa: {len(df):,} registros")

# ADAPTACIÓN A LA ESCALA BOLIVIANA
print("\n   Adaptando a escala boliviana (aprobación: 51 puntos)...")

def asignar_nivel_riesgo(total_score):
    """
    Escala boliviana:
    - Sin Riesgo:   total_score >= 66
    - Riesgo Medio: total_score 51-65
    - Riesgo Alto:  total_score < 51
    """
    if total_score >= 66:
        return "SIN_RIESGO"
    elif total_score >= 51:
        return "RIESGO_MEDIO"
    else:
        return "RIESGO_ALTO"

df['nivel_riesgo'] = df['total_score'].apply(asignar_nivel_riesgo)

print("\n   Distribución de niveles de riesgo:")
distribucion = df['nivel_riesgo'].value_counts()
for nivel, cantidad in distribucion.items():
    porcentaje = (cantidad / len(df)) * 100
    print(f"   {nivel}: {cantidad:,} ({porcentaje:.1f}%)")

# Variables de entrada
FEATURES = [
    'attendance_percentage',
    'total_score',
    'class_participation',
    'weekly_self_study_hours'
]

X = df[FEATURES]
y = df['nivel_riesgo']

# ─────────────────────────────────────────────
# FASE 3: DIVISIÓN 80/20
# ─────────────────────────────────────────────
print("\n✂️  FASE 3: División 80% entrenamiento / 20% prueba...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"   Entrenamiento: {len(X_train):,} | Prueba: {len(X_test):,}")

# ─────────────────────────────────────────────
# FASE 4a: ÁRBOL DE DECISIÓN ID3
# ─────────────────────────────────────────────
print("\n🌳 FASE 4a: Entrenando Árbol de Decisión ID3...")

arbol = DecisionTreeClassifier(
    criterion='entropy',
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42
)
arbol.fit(X_train, y_train)
y_pred_arbol = arbol.predict(X_test)

f1_arbol = f1_score(y_test, y_pred_arbol, average='weighted')
precision_arbol = precision_score(y_test, y_pred_arbol, average='weighted')
recall_arbol = recall_score(y_test, y_pred_arbol, average='weighted')
accuracy_arbol = accuracy_score(y_test, y_pred_arbol)

print(f"\n   RESULTADOS — Árbol de Decisión ID3:")
print(f"   Accuracy:  {accuracy_arbol*100:.2f}%")
print(f"   Precision: {precision_arbol:.4f}")
print(f"   Recall:    {recall_arbol:.4f}")
print(f"   F1-Score:  {f1_arbol:.4f}")
print(classification_report(y_test, y_pred_arbol))

# ─────────────────────────────────────────────
# FASE 4b: RANDOM FOREST
# ─────────────────────────────────────────────
print("\n🌲 FASE 4b: Entrenando Random Forest...")

random_forest = RandomForestClassifier(
    n_estimators=100,
    criterion='entropy',
    max_depth=10,
    min_samples_split=20,
    min_samples_leaf=10,
    random_state=42,
    n_jobs=-1
)
random_forest.fit(X_train, y_train)
y_pred_rf = random_forest.predict(X_test)

f1_rf = f1_score(y_test, y_pred_rf, average='weighted')
precision_rf = precision_score(y_test, y_pred_rf, average='weighted')
recall_rf = recall_score(y_test, y_pred_rf, average='weighted')
accuracy_rf = accuracy_score(y_test, y_pred_rf)

print(f"\n   RESULTADOS — Random Forest:")
print(f"   Accuracy:  {accuracy_rf*100:.2f}%")
print(f"   Precision: {precision_rf:.4f}")
print(f"   Recall:    {recall_rf:.4f}")
print(f"   F1-Score:  {f1_rf:.4f}")
print(classification_report(y_test, y_pred_rf))

# ─────────────────────────────────────────────
# FASE 5: COMPARACIÓN Y SELECCIÓN
# ─────────────────────────────────────────────
print("\n⚖️  FASE 5: Comparación de modelos...")
print(f"\n   {'Modelo':<25} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} {'F1-Score':>10}")
print(f"   {'─'*65}")
print(f"   {'Árbol Decisión ID3':<25} {accuracy_arbol:>10.4f} {precision_arbol:>10.4f} {recall_arbol:>10.4f} {f1_arbol:>10.4f}")
print(f"   {'Random Forest':<25} {accuracy_rf:>10.4f} {precision_rf:>10.4f} {recall_rf:>10.4f} {f1_rf:>10.4f}")

if f1_rf >= f1_arbol:
    mejor_modelo = random_forest
    nombre_mejor = "Random Forest"
    f1_mejor = f1_rf
else:
    mejor_modelo = arbol
    nombre_mejor = "Árbol de Decisión ID3"
    f1_mejor = f1_arbol

print(f"\n   ✅ MODELO SELECCIONADO: {nombre_mejor} (F1: {f1_mejor:.4f})")

# Variables más influyentes
importancias = pd.DataFrame({
    'Variable': FEATURES,
    'Importancia': mejor_modelo.feature_importances_
}).sort_values('Importancia', ascending=False)

print(f"\n   Variables más influyentes:")
for _, row in importancias.iterrows():
    barra = "█" * int(row['Importancia'] * 40)
    print(f"   {row['Variable']:<30} {barra} {row['Importancia']*100:.1f}%")

# ─────────────────────────────────────────────
# FASE 6: SERIALIZACIÓN
# ─────────────────────────────────────────────
print("\n💾 FASE 6: Guardando modelo...")

joblib.dump(mejor_modelo, "modelo_riesgo.pkl")

metricas = {
    "modelo_seleccionado": nombre_mejor,
    "modelos": {
        "random_forest": {
            "accuracy": round(accuracy_rf, 4),
            "precision": round(precision_rf, 4),
            "recall": round(recall_rf, 4),
            "f1_score": round(f1_rf, 4)
        },
        "arbol_decision": {
            "accuracy": round(accuracy_arbol, 4),
            "precision": round(precision_arbol, 4),
            "recall": round(recall_arbol, 4),
            "f1_score": round(f1_arbol, 4)
        }
    },
    "variables_influyentes": {
        row['Variable']: round(row['Importancia'], 4)
        for _, row in importancias.iterrows()
    },
    "features": FEATURES,
    "escala_boliviana": {
        "sin_riesgo": "total_score >= 66",
        "riesgo_medio": "51 <= total_score < 66",
        "riesgo_alto": "total_score < 51"
    }
}

with open("metricas_modelo.json", "w", encoding="utf-8") as f:
    json.dump(metricas, f, ensure_ascii=False, indent=2)

print("   modelo_riesgo.pkl guardado")
print("   metricas_modelo.json guardado")

# ─────────────────────────────────────────────
# FASE 7: PRUEBA DE PREDICCIÓN
# ─────────────────────────────────────────────
print("\n🔮 FASE 7: Prueba con casos de ejemplo...")

casos = [
    {"nombre": "Riesgo Alto",  "attendance_percentage": 72.0, "total_score": 38.5, "class_participation": 2.0, "weekly_self_study_hours": 5.0},
    {"nombre": "Riesgo Medio", "attendance_percentage": 82.0, "total_score": 58.0, "class_participation": 4.5, "weekly_self_study_hours": 10.0},
    {"nombre": "Sin Riesgo",   "attendance_percentage": 95.0, "total_score": 78.5, "class_participation": 7.0, "weekly_self_study_hours": 18.0},
]

modelo_cargado = joblib.load("modelo_riesgo.pkl")

for caso in casos:
    datos = pd.DataFrame([{k: v for k, v in caso.items() if k != 'nombre'}])
    pred = modelo_cargado.predict(datos)[0]
    prob = max(modelo_cargado.predict_proba(datos)[0])
    print(f"   {caso['nombre']}: nota={caso['total_score']}, asistencia={caso['attendance_percentage']}% → {pred} ({prob*100:.1f}%)")

print("\n" + "=" * 60)
print(f"✅ ENTRENAMIENTO COMPLETADO")
print(f"   Mejor modelo: {nombre_mejor}")
print(f"   F1-Score: {f1_mejor*100:.2f}%")
print("=" * 60)
