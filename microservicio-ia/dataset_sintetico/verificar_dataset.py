"""
Verificaciones obligatorias del dataset sintético (formato del registro oficial).

Uso (desde microservicio-ia/, después de generar el dataset):
    venv/Scripts/python.exe dataset_sintetico/verificar_dataset.py

Escribe los resultados en dataset_sintetico/resultados_verificacion.md (tablas
listas para la tesis) y los muestra en pantalla.

IMPORTANTE: el clasificador de la prueba anti-fuga es SOLO una prueba del
dataset. No reemplaza ni modifica el modelo del sistema (model/modelo_riesgo.pkl).
"""
from __future__ import annotations

import contextlib
import hashlib
import io
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.tree import DecisionTreeClassifier

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generar_dataset as gen  # noqa: E402

ARCHIVO_RESULTADOS = Path(__file__).resolve().parent / "resultados_verificacion.md"
ENTRADAS = ["promedio_notas", "porcentaje_asistencia", "areas_reprobadas", "nivel", "trimestre"]
CLASES = ["SIN_RIESGO", "RIESGO_MEDIO", "RIESGO_ALTO"]
secciones: list[str] = []


def tabla(df: pd.DataFrame, indice: bool = True) -> str:
    """Tabla en formato Markdown (sin depender de librerías extra)."""
    d = df.reset_index() if indice else df
    if indice and d.columns[0] == "index":
        d = d.rename(columns={"index": ""})
    fmt = lambda v: f"{v:.3f}".rstrip("0").rstrip(".") if isinstance(v, float) else str(v)  # noqa: E731
    lineas = ["| " + " | ".join(map(str, d.columns)) + " |", "|" + "---|" * len(d.columns)]
    lineas += ["| " + " | ".join(fmt(v) for v in fila) + " |" for fila in d.itertuples(index=False)]
    return "\n".join(lineas)


def agregar(titulo: str, contenido: str) -> None:
    secciones.append(f"## {titulo}\n\n{contenido}\n")
    print(f"\n=== {titulo} ===\n{contenido}")


def ok_txt(cond: bool) -> str:
    return "✅" if cond else "❌"


# 1. Estructura ----------------------------------------------------------------
def v1_estructura(ds: pd.DataFrame, c: pd.DataFrame) -> bool:
    info = pd.DataFrame({"tipo": ds.dtypes.astype(str), "nulos": ds.isna().sum(), "valores distintos": ds.nunique()})
    ok = ds.isna().sum().sum() == 0 and list(ds.columns) == gen.COLUMNAS_FINALES
    agregar("1. Estructura",
            f"**Dataset del modelo:** {len(ds)} filas · {ds.shape[1]} columnas · {ds.id_estudiante.nunique()} estudiantes · "
            f"valores nulos: {int(ds.isna().sum().sum())}\n\n" + tabla(info)
            + f"\n\n**Centralizador (detalle):** {len(c)} filas = {c.id_estudiante.nunique()} estudiantes × "
            f"{c.area.nunique()} áreas × {c.trimestre.nunique()} trimestres · {c.curso.nunique()} cursos ficticios."
            f"\n\nResultado: {ok_txt(ok)}")
    return ok


# 2. Rangos y fórmulas del registro oficial ----------------------------------
def v2_rangos_y_formulas(ds: pd.DataFrame, c: pd.DataFrame, p: gen.Parametros) -> bool:
    filas, ok = [], True
    limites = {
        "promedio_notas": (ds.promedio_notas, 0, 100), "porcentaje_asistencia": (ds.porcentaje_asistencia, 0, 100),
        "areas_reprobadas": (ds.areas_reprobadas, 0, 13), "nivel": (ds.nivel, 1, 6), "trimestre": (ds.trimestre, 1, 3),
        "Ser (área)": (c.ser, 0, 10), "Saber (área)": (c.saber, 0, 45), "Hacer (área)": (c.hacer, 0, 40),
        "Autoevaluación (área)": (c.autoevaluacion, 0, 5), "Puntos extra": (c.puntos_extra, 0, 3),
        "Calificación trimestral": (c.calificacion, 0, 100), "Nota de asistencia (Ser)": (c.nota_asistencia, 0, 10),
        "Casillas de Ser": (c.n_casillas_ser, *p.casillas_ser), "Casillas de Saber": (c.n_casillas_saber, *p.casillas_saber),
        "Casillas de Hacer": (c.n_casillas_hacer, *p.casillas_hacer),
    }
    for nombre, (serie, lo, hi) in limites.items():
        valido = bool(serie.between(lo, hi).all())
        ok &= valido
        filas.append({"variable": nombre, "permitido": f"{lo}–{hi}", "mínimo": serie.min(), "máximo": serie.max(),
                      "media": round(float(serie.mean()), 2), "desv.": round(float(serie.std()), 2), "válido": ok_txt(valido)})
    enteros = all((c[k] == c[k].round()).all() for k in ("ser", "saber", "hacer", "autoevaluacion", "calificacion"))

    # Fórmulas del registro oficial, comprobadas fila por fila
    dias_ok = bool((c.asis_P + c.asis_F + c.asis_A + c.asis_L == c.asis_dias).all())
    nota_as = gen.redondear((c.asis_P + c.asis_L + c.asis_A * p.peso_atraso_en_nota) * 10 / c.asis_dias)
    nota_as_ok = bool((nota_as == c.nota_asistencia).all())
    suma = np.minimum(c.ser + c.saber + c.hacer + c.autoevaluacion + c.puntos_extra, 100)
    suma_ok = bool((suma == c.calificacion).all())
    piv = c.pivot_table(index=["id_estudiante", "area"], columns="trimestre", values="calificacion")
    anual = pd.Series(gen.redondear(piv.mean(axis=1)), index=piv.index)
    anual_ref = c[c.trimestre == 1].set_index(["id_estudiante", "area"]).nota_anual_area
    anual_ok = bool((anual.loc[anual_ref.index].to_numpy() == anual_ref.to_numpy()).all())
    reprob = (anual < p.nota_aprobacion).groupby(level=0).sum()
    rep_ref = c[c.trimestre == 1].groupby("id_estudiante").areas_reprobadas_anual.first()
    rep_ok = bool((reprob.loc[rep_ref.index] == rep_ref).all())
    etiq = np.select([rep_ref >= p.areas_riesgo_alto, rep_ref >= p.areas_riesgo_medio], ["RIESGO_ALTO", "RIESGO_MEDIO"], "SIN_RIESGO")
    etiq_ok = bool((pd.Series(etiq, index=rep_ref.index) == ds[ds.trimestre == 1].set_index("id_estudiante").nivel_riesgo.loc[rep_ref.index]).all())
    formulas = pd.DataFrame([
        {"regla del registro oficial": "P + F + A + L = días trabajados", "cumple": ok_txt(dias_ok)},
        {"regla del registro oficial": "Nota asistencia = ROUND((P + L + A·2/3) × 10 / días)", "cumple": ok_txt(nota_as_ok)},
        {"regla del registro oficial": "Calificación = Ser + Saber + Hacer + Autoevaluación + extras (máx. 100)", "cumple": ok_txt(suma_ok)},
        {"regla del registro oficial": "Nota anual del área = ROUND(PROMEDIO(T1, T2, T3))", "cumple": ok_txt(anual_ok)},
        {"regla del registro oficial": "Áreas reprobadas = cantidad de notas anuales < 51", "cumple": ok_txt(rep_ok)},
        {"regla del registro oficial": "Etiqueta: 0 → SIN · 1–2 → MEDIO · ≥3 → ALTO", "cumple": ok_txt(etiq_ok)},
        {"regla del registro oficial": "Notas de dimensión y calificación son enteras", "cumple": ok_txt(enteros)},
    ])
    ok &= dias_ok and nota_as_ok and suma_ok and anual_ok and rep_ok and etiq_ok and enteros
    agregar("2. Rangos válidos y fórmulas del registro oficial",
            tabla(pd.DataFrame(filas), indice=False) + "\n\n" + tabla(formulas, indice=False))
    return ok


# 3. Balance de clases --------------------------------------------------------
def v3_balance(ds: pd.DataFrame, c: pd.DataFrame) -> bool:
    por_est = ds[ds.trimestre == 1].nivel_riesgo
    conteo = por_est.value_counts().reindex(CLASES)
    pct = (conteo / conteo.sum() * 100).round(1)
    objetivo = {"SIN_RIESGO": (55, 70), "RIESGO_MEDIO": (15, 25), "RIESGO_ALTO": (10, 25)}
    t = pd.DataFrame({"estudiantes": conteo, "filas": conteo * 3, "%": pct,
                      "objetivo %": [f"{a}–{b}" for a, b in objetivo.values()],
                      "dentro": [ok_txt(objetivo[k][0] <= pct[k] <= objetivo[k][1]) for k in CLASES]})
    rep = c[c.trimestre == 1].groupby("id_estudiante").areas_reprobadas_anual.first()
    dist = rep.value_counts().sort_index()
    dist_t = pd.DataFrame({"áreas reprobadas al cierre": dist.index, "estudiantes": dist.values,
                           "%": (dist.values / dist.sum() * 100).round(1)})
    anual = c[c.trimestre == 1].nota_anual_area
    agregar("3. Balance de clases (sin duplicar ni eliminar filas)",
            tabla(t) + "\n\n**Distribución de áreas reprobadas al cierre**\n\n" + tabla(dist_t, indice=False)
            + f"\n\nNota anual por área: media **{anual.mean():.1f}**, desviación **{anual.std():.1f}**, "
            f"reprobadas (< 51): **{(anual < 51).mean() * 100:.1f} %** de todas las notas de área.")
    return all(objetivo[k][0] <= pct[k] <= objetivo[k][1] for k in CLASES)


# 4. Distribución por trimestre, nivel y área ----------------------------------
def v4_distribucion(ds: pd.DataFrame, c: pd.DataFrame) -> None:
    medias_t = ds.groupby("trimestre")[["promedio_notas", "porcentaje_asistencia", "areas_reprobadas"]].mean().round(2)
    t1 = ds[ds.trimestre == 1]
    por_n = pd.crosstab(t1.nivel, t1.nivel_riesgo, normalize="index").reindex(columns=CLASES).mul(100).round(1)
    por_n.insert(0, "estudiantes", t1.nivel.value_counts().sort_index())
    anual = c[c.trimestre == 1]
    por_a = anual.groupby("area").agg(nota_anual_media=("nota_anual_area", "mean"),
                                      reprobados_pct=("nota_anual_area", lambda s: (s < 51).mean() * 100)).round(1)
    por_a = por_a.sort_values("nota_anual_media")
    dims = c.groupby("trimestre")[["ser", "saber", "hacer", "autoevaluacion", "puntos_extra", "calificacion"]].mean().round(2)
    asis = c.assign(pct=(c.asis_P + c.asis_A + c.asis_L) / c.asis_dias * 100)
    codigos = (c[["asis_P", "asis_F", "asis_A", "asis_L"]].sum() / c.asis_dias.sum() * 100).round(2)
    agregar("4. Distribución por trimestre, nivel y área",
            "**Medias de las entradas por trimestre** (T3 = información a mitad del trimestre)\n\n" + tabla(medias_t)
            + "\n\n**Medias por dimensión (por área) y trimestre**\n\n" + tabla(dims)
            + "\n\n**Por nivel (% de cada clase)**\n\n" + tabla(por_n)
            + "\n\n**Por área** (de la más exigente a la menos exigente)\n\n" + tabla(por_a)
            + f"\n\n**Asistencia:** P {codigos.asis_P} % · F {codigos.asis_F} % · A {codigos.asis_A} % · L {codigos.asis_L} % de los días. "
            f"Asistencia por área y trimestre entre 80 y 98 %: {asis.pct.between(80, 98).mean() * 100:.1f} %; "
            f"bajo 70 %: {(asis.pct < 70).mean() * 100:.1f} %.")


# 5. Correlaciones -------------------------------------------------------------
def v5_correlaciones(ds: pd.DataFrame) -> bool:
    corr = ds[ENTRADAS].corr().round(3)
    por_t = pd.DataFrame({"trimestre": [1, 2, 3], "corr(promedio_notas, asistencia)": [
        round(float(ds[ds.trimestre == t][["promedio_notas", "porcentaje_asistencia"]].corr().iloc[0, 1]), 3) for t in (1, 2, 3)]})
    ok = bool(por_t.iloc[:, 1].between(0.3, 0.6).all())
    agregar("5. Correlaciones entre variables de entrada", tabla(corr) + "\n\n" + tabla(por_t, indice=False)
            + f"\n\nNotas–asistencia por trimestre dentro de 0,3–0,6: {ok_txt(ok)}. "
            "La correlación fuerte y negativa entre `promedio_notas` y `areas_reprobadas` es esperable: "
            "ambas resumen el rendimiento, pero la segunda capta las debilidades en áreas puntuales.")
    return ok


# 6. Prueba anti-fuga ----------------------------------------------------------
def v6_anti_fuga(ds: pd.DataFrame, semilla: int) -> dict:
    """Árbol de decisión simple; entrenamiento/prueba 80/20 separando POR ESTUDIANTE."""
    i_ent, i_pru = next(GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=semilla).split(ds, groups=ds.id_estudiante))
    ent, pru = ds.iloc[i_ent], ds.iloc[i_pru]
    assert set(ent.id_estudiante).isdisjoint(pru.id_estudiante)
    modelo = DecisionTreeClassifier(criterion="entropy", max_depth=6, min_samples_leaf=20, random_state=semilla)
    modelo.fit(ent[ENTRADAS], ent.nivel_riesgo)
    pred = pd.Series(modelo.predict(pru[ENTRADAS]), index=pru.index)
    # Diagnóstico: la misma regla de la etiqueta aplicada a las áreas reprobadas observadas
    regla = pd.Series(np.select([pru.areas_reprobadas >= 3, pru.areas_reprobadas >= 1],
                                ["RIESGO_ALTO", "RIESGO_MEDIO"], "SIN_RIESGO"), index=pru.index)
    filas, f1 = [], {}
    for t in (1, 2, 3):
        m = pru.trimestre == t
        f1[t] = f1_score(pru.nivel_riesgo[m], pred[m], average="macro")
        filas.append({"trimestre": t, "filas de prueba": int(m.sum()), "F1 macro (árbol)": round(f1[t], 3),
                      "F1 macro (regla 0/1–2/≥3 sobre áreas reprobadas observadas)":
                          round(f1_score(pru.nivel_riesgo[m], regla[m], average="macro"), 3)})
    f1["global"] = f1_score(pru.nivel_riesgo, pred, average="macro")
    filas.append({"trimestre": "global", "filas de prueba": len(pru), "F1 macro (árbol)": round(f1["global"], 3),
                  "F1 macro (regla 0/1–2/≥3 sobre áreas reprobadas observadas)": "—"})
    creciente, rango, fuga = f1[1] < f1[2] < f1[3], 0.78 <= f1["global"] <= 0.92, f1["global"] >= 0.97
    agregar("6. Prueba anti-fuga (árbol de decisión, separación por estudiante)",
            tabla(pd.DataFrame(filas), indice=False)
            + f"\n\nSeparación por estudiante: {ent.id_estudiante.nunique()} de entrenamiento y {pru.id_estudiante.nunique()} "
            "de prueba, sin estudiantes compartidos ✅"
            + f"\n\n- F1 creciente T1 < T2 < T3: {ok_txt(creciente)}\n- F1 global entre 0,78 y 0,92: {ok_txt(rango)}"
            + f"\n- F1 global < 0,97 (sin fuga): {ok_txt(not fuga)}\n- Ningún trimestre alcanza F1 = 1 (la etiqueta no es "
            f"una regla directa de la fila): {ok_txt(max(f1[1], f1[2], f1[3]) < 0.97)}")
    return {"f1": f1, "creciente": creciente, "rango": rango, "fuga": fuga}


def v6b_estabilidad(ds: pd.DataFrame, repeticiones: int = 5) -> bool:
    resultados = []
    for semilla in range(repeticiones):
        with contextlib.redirect_stdout(io.StringIO()):
            resultados.append(v6_anti_fuga(ds, semilla))
        secciones.pop()
    filas = []
    for k in (1, 2, 3, "global"):
        valores = [r["f1"][k] for r in resultados]
        filas.append({"trimestre": k, "F1 medio": round(float(np.mean(valores)), 3), "desv.": round(float(np.std(valores)), 3)})
    ok = all(r["creciente"] and r["rango"] and not r["fuga"] for r in resultados)
    agregar(f"6b. Estabilidad de la prueba anti-fuga ({repeticiones} particiones distintas)",
            tabla(pd.DataFrame(filas), indice=False) + f"\n\nEn todas las particiones se cumplen las condiciones: {ok_txt(ok)}")
    return ok


# 7. Reproducibilidad ------------------------------------------------------------
def v7_reproducibilidad(ds: pd.DataFrame, c: pd.DataFrame) -> bool:
    huella = lambda d: hashlib.sha256(d.to_csv(index=False).encode()).hexdigest()[:16]  # noqa: E731
    # Dos generaciones nuevas con la misma semilla, comparadas por la huella de su contenido
    gen1, central1 = gen.generar(gen.Parametros())
    otra, otra_c = gen.generar(gen.Parametros())
    igual = huella(gen1) == huella(otra) and huella(central1) == huella(otra_c)
    # El archivo guardado en disco corresponde a esa misma generación
    igual = igual and ds.reset_index(drop=True).equals(pd.read_csv(io.StringIO(gen1.to_csv(index=False))))
    distinta, _ = gen.generar(gen.Parametros(semilla=gen.Parametros().semilla + 1))
    cambia = not ds.reset_index(drop=True).equals(distinta.reset_index(drop=True))
    agregar("7. Reproducibilidad",
            f"| Generación | Huella SHA-256 del dataset (16 primeros) |\n|---|---|\n| 1ª (semilla {gen.Parametros().semilla}) | `{huella(ds)}` |\n"
            f"| 2ª (misma semilla) | `{huella(otra)}` |\n\nIdénticas (dataset y centralizador): {ok_txt(igual)} · "
            f"Con otra semilla el resultado cambia: {ok_txt(cambia)}")
    return igual and cambia


def main() -> None:
    if not gen.ARCHIVO_DATASET.exists() or not gen.ARCHIVO_CENTRALIZADOR.exists():
        sys.exit("Primero genera el dataset: venv/Scripts/python.exe dataset_sintetico/generar_dataset.py")
    ds = pd.read_csv(gen.ARCHIVO_DATASET)
    c = pd.read_csv(gen.ARCHIVO_CENTRALIZADOR)
    p = gen.Parametros()
    agregar("Primeras 10 filas", tabla(ds.head(10), indice=False))
    resultados = {
        "1. Estructura": v1_estructura(ds, c),
        "2. Rangos y fórmulas del registro": v2_rangos_y_formulas(ds, c, p),
        "3. Balance": v3_balance(ds, c),
    }
    v4_distribucion(ds, c)
    resultados["5. Correlaciones"] = v5_correlaciones(ds)
    af = v6_anti_fuga(ds, p.semilla)
    resultados["6. Anti-fuga"] = af["creciente"] and af["rango"] and not af["fuga"]
    resultados["6b. Anti-fuga (estabilidad)"] = v6b_estabilidad(ds)
    resultados["7. Reproducibilidad"] = v7_reproducibilidad(ds, c)
    agregar("Resumen", tabla(pd.DataFrame({"verificación": list(resultados),
                                           "resultado": [ok_txt(v) for v in resultados.values()]}), indice=False))
    ARCHIVO_RESULTADOS.write_text(
        "# Resultados de verificación — dataset sintético de riesgo académico (formato del registro oficial)\n\n"
        f"Semilla {p.semilla} · {p.n_estudiantes} estudiantes · {len(p.areas)} áreas · 3 trimestres. "
        "Archivo producido automáticamente por `verificar_dataset.py`.\n\n" + "\n".join(secciones), encoding="utf-8")
    print(f"\nResultados guardados en {ARCHIVO_RESULTADOS}")


if __name__ == "__main__":
    main()
