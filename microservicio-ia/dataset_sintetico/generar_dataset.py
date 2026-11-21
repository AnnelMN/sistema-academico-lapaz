"""
Generador del dataset SINTÉTICO de riesgo académico — U.E. La Paz "A".

No existen datos históricos digitales de la institución y la Dirección no puede
entregar datos de estudiantes (menores de edad). Por eso el dataset se obtiene por
SIMULACIÓN, siguiendo:
  - la rúbrica confirmada por el Director: Ser 10 + Saber 45 + Hacer 40 +
    Autoevaluación 5 = 100, aprobado con 51;
  - la estructura del REGISTRO PEDAGÓGICO OFICIAL de secundaria: casillas por
    dimensión calificadas en la escala de la dimensión, asistencia diaria con los
    códigos P/F/A/L (presente, falta, atraso, licencia), puntos extra y un
    CENTRALIZADOR con 13 áreas, notas por trimestre, nota anual y áreas reprobadas.

Etiqueta (opción elegida por la usuaria): riesgo según la cantidad de ÁREAS
REPROBADAS al cierre del año (nota anual del área < 51):
    0 áreas → SIN_RIESGO · 1–2 áreas → RIESGO_MEDIO · 3 o más → RIESGO_ALTO

Principio central: cada fila contiene SOLO la información disponible hasta ese
trimestre; la etiqueta usa el cierre anual (información futura).

Uso (desde microservicio-ia/):
    venv/Scripts/python.exe dataset_sintetico/generar_dataset.py

Salidas (en microservicio-ia/data/, carpeta que no se sube a Git):
    dataset_riesgo_sintetico.csv  → dataset para el modelo (una fila por estudiante y trimestre)
    centralizador_sintetico.csv   → detalle por estudiante, área y trimestre (formato centralizador)

Todo es anónimo y ficticio: no contiene ni deriva de datos de personas reales.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import pandas as pd

# ════════════════════════════════════════════════════════════════════════
# PARÁMETROS AJUSTABLES (se pueden cambiar sin tocar la lógica)
# ════════════════════════════════════════════════════════════════════════

# Las 13 áreas del centralizador oficial de secundaria.
#   dificultad: desplaza las notas hacia abajo (+) o arriba (−), en escala logística
#   teorica:    0–1, cuánto pesa la aptitud (teórica) frente al compromiso (práctica)
AREAS: dict[str, dict] = {
    "COMUNICACIÓN Y LENGUAJE":                {"dificultad": 0.05, "teorica": 0.55},
    "LENGUA EXTRANJERA":                      {"dificultad": 0.15, "teorica": 0.60},
    "CIENCIAS SOCIALES":                      {"dificultad": 0.00, "teorica": 0.50},
    "EDUCACIÓN MUSICAL":                      {"dificultad": -0.35, "teorica": 0.25},
    "ARTES PLÁSTICAS Y VISUALES":             {"dificultad": -0.35, "teorica": 0.25},
    "EDUCACIÓN FÍSICA Y DEPORTES":            {"dificultad": -0.40, "teorica": 0.15},
    "MATEMÁTICA":                             {"dificultad": 0.45, "teorica": 0.80},
    "TÉCNICA TECNOLÓGICA":                    {"dificultad": -0.10, "teorica": 0.40},
    "FÍSICA":                                 {"dificultad": 0.40, "teorica": 0.80},
    "QUÍMICA":                                {"dificultad": 0.35, "teorica": 0.75},
    "CIENCIAS NATURALES (BIOLOGÍA-GEOGRAFÍA)": {"dificultad": 0.10, "teorica": 0.60},
    "FILOSOFÍA - PSICOLOGÍA":                 {"dificultad": 0.05, "teorica": 0.55},
    "VALORES, ESPIRITUALIDAD Y RELIGIONES":   {"dificultad": -0.30, "teorica": 0.30},
}


@dataclass(frozen=True)
class Parametros:
    # ── Reproducibilidad y tamaño ─────────────────────────────────────────
    semilla: int = 2026
    n_estudiantes: int = 8000
    estudiantes_por_curso: int = 30          # tamaño típico de un paralelo
    proporcion_niveles: tuple = (1 / 6,) * 6  # 1° a 6° de secundaria, uniforme

    # ── Rasgos ocultos (no aparecen en el dataset) ────────────────────────
    correlacion_aptitud_compromiso: float = 0.30
    afinidad_por_area: float = 0.60          # desv. de la afinidad estudiante-área (fortalezas/debilidades)
    exigencia_por_nivel: float = 0.05        # niveles superiores, levemente más exigentes

    # ── Evolución entre trimestres ────────────────────────────────────────
    variacion_trimestral: float = 0.35
    proporcion_cambio_brusco: float = 0.13   # 10–15 % de estudiantes
    magnitud_cambio_brusco: tuple = (1.2, 2.4)
    prob_caida_en_cambio_brusco: float = 0.70

    # ── Asistencia diaria por área (códigos P/F/A/L) ──────────────────────
    clases_por_trimestre: int = 24            # días de clase de cada área por trimestre
    falta_base: float = -2.2                  # logit de la prob. de falta para un estudiante promedio
    falta_peso_compromiso: float = 0.35
    factor_externo_asistencia: float = 0.65   # causa persistente ajena al rendimiento (salud, transporte…)
    atraso_base: float = -3.0                 # logit de la prob. de atraso
    atraso_peso_compromiso: float = 0.40
    prob_licencia: float = 0.012              # licencias (permisos justificados)
    peso_atraso_en_nota: float = 2 / 3        # en el registro oficial el atraso vale 2/3 de asistencia

    # ── Casillas por dimensión (escala de cada dimensión, como en el registro) ──
    casillas_ser: tuple = (3, 6)              # rango configurado en el registro oficial
    casillas_saber: tuple = (10, 15)
    casillas_hacer: tuple = (10, 15)
    ruido_periodo: float = 0.40               # variación del estudiante en esa área y trimestre
    ruido_casilla: float = 0.55               # variación entre casillas (cada examen o trabajo)
    # Ser (casillas distintas de la asistencia): compromiso
    ser_base: float = 1.35
    ser_peso_compromiso: float = 0.55
    # Saber (exámenes): aptitud según lo teórica que sea el área + compromiso
    saber_base: float = 1.25
    saber_peso_aptitud: float = 0.55
    saber_peso_compromiso: float = 0.35
    # Hacer (trabajos): compromiso + aptitud según lo práctica que sea el área
    hacer_base: float = 1.40
    hacer_peso_compromiso: float = 0.50
    hacer_peso_aptitud: float = 0.35
    # Trabajos no entregados / exámenes no rendidos (casilla en 0)
    no_entrega_base: float = -4.0
    no_entrega_peso_compromiso: float = 0.9
    # Autoevaluación (0–5, entero): compromiso con leve sesgo optimista
    auto_base: float = 1.5
    auto_peso_compromiso: float = 0.6
    auto_ruido: float = 0.5
    # Puntos extra (0–3), como en el registro oficial
    prob_puntos_extra: float = 0.10

    # ── Información parcial del 3.er trimestre (evita la fuga en la fila T3) ──
    # La fila T3 representa la predicción A MITAD del trimestre 3: se conocen las
    # casillas y los días de clase hasta ese punto, no la nota final.
    avance_t3: float = 0.5
    # Cambio del estudiante en la SEGUNDA mitad del T3 (mejora o empeoramiento
    # después del punto de predicción): sin él, la mitad conocida anticiparía
    # casi exactamente el cierre del año.
    variacion_segunda_mitad_t3: float = 0.6

    # ── Etiqueta: áreas reprobadas al cierre del año ─────────────────────
    nota_aprobacion: int = 51
    areas_riesgo_medio: int = 1     # 1 o 2 áreas reprobadas → RIESGO_MEDIO
    areas_riesgo_alto: int = 3      # 3 o más → RIESGO_ALTO

    areas: dict = field(default_factory=lambda: AREAS)


CARPETA_DATOS = Path(__file__).resolve().parent.parent / "data"
ARCHIVO_DATASET = CARPETA_DATOS / "dataset_riesgo_sintetico.csv"
ARCHIVO_CENTRALIZADOR = CARPETA_DATOS / "centralizador_sintetico.csv"
COLUMNAS_FINALES = [
    "id_estudiante", "promedio_notas", "porcentaje_asistencia", "areas_reprobadas",
    "nivel", "trimestre", "nivel_riesgo",
]
TRIMESTRES = (1, 2, 3)
ESCALAS = {"ser": 10, "saber": 45, "hacer": 40}


def sigmoide(x):
    return 1.0 / (1.0 + np.exp(-x))


def redondear(x):
    """Redondeo del registro oficial (ROUND de Excel): 0,5 sube."""
    return np.floor(np.asarray(x, dtype=float) + 0.5)


# ════════════════════════════════════════════════════════════════════════
# PASO 1 — Estudiantes: rasgos ocultos, nivel, curso y afinidad por área
# ════════════════════════════════════════════════════════════════════════
def paso1_estudiantes(p: Parametros, rng: np.random.Generator) -> dict:
    n, n_areas = p.n_estudiantes, len(p.areas)
    cov = np.array([[1.0, p.correlacion_aptitud_compromiso], [p.correlacion_aptitud_compromiso, 1.0]])
    rasgos = rng.multivariate_normal([0.0, 0.0], cov, size=n)
    nivel = rng.choice(np.arange(1, 7), size=n, p=np.array(p.proporcion_niveles))
    # Cursos (paralelos) ficticios de ~30 estudiantes por nivel
    curso = np.empty(n, dtype=object)
    for nv in range(1, 7):
        idx = np.flatnonzero(nivel == nv)
        for k, i in enumerate(idx):
            num = k // p.estudiantes_por_curso
            curso[i] = f"{nv}°-C{num + 1:03d}"
    return {
        "id": np.array([f"E{i:05d}" for i in range(1, n + 1)]),
        "nivel": nivel,
        "curso": curso,
        "aptitud_0": rasgos[:, 0],
        "compromiso_0": rasgos[:, 1],
        "afinidad": rng.normal(0, p.afinidad_por_area, size=(n, n_areas)),
        "externo": rng.normal(0, p.factor_externo_asistencia, size=n),
    }


# ════════════════════════════════════════════════════════════════════════
# PASO 2 — Evolución de los rasgos entre trimestres (incluye cambios bruscos)
# ════════════════════════════════════════════════════════════════════════
def paso2_evolucion(e: dict, p: Parametros, rng: np.random.Generator) -> dict:
    n = p.n_estudiantes
    con_cambio = rng.random(n) < p.proporcion_cambio_brusco
    t_cambio = rng.choice([2, 3], size=n)
    direccion = np.where(rng.random(n) < p.prob_caida_en_cambio_brusco, -1.0, 1.0)
    magnitud = rng.uniform(*p.magnitud_cambio_brusco, size=n)
    e["cambio_brusco"] = np.where(con_cambio, np.where(direccion < 0, "CAIDA", "RECUPERACION"), "NINGUNO")
    apt, comp = e["aptitud_0"].copy(), e["compromiso_0"].copy()
    e["aptitud"], e["compromiso"] = {}, {}
    for t in TRIMESTRES:
        apt = apt + rng.normal(0, p.variacion_trimestral, n)
        comp = comp + rng.normal(0, p.variacion_trimestral, n)
        salto = np.where(con_cambio & (t_cambio == t), direccion * magnitud, 0.0)
        comp, apt = comp + salto, apt + 0.5 * salto   # el cambio afecta sobre todo al compromiso
        e["aptitud"][t], e["compromiso"][t] = apt.copy(), comp.copy()
    return e


# ════════════════════════════════════════════════════════════════════════
# PASO 3 — Asistencia diaria por área y trimestre (conteos P/F/A/L)
# ════════════════════════════════════════════════════════════════════════
def paso3_asistencia(e: dict, p: Parametros, rng: np.random.Generator) -> dict:
    """Cuenta presentes, faltas, atrasos y licencias de cada estudiante en cada área.
    Nota de asistencia (registro oficial) = ROUND((P + L + A·2/3) × 10 / días)."""
    n, n_areas, dias = p.n_estudiantes, len(p.areas), p.clases_por_trimestre
    e["asis"] = {}
    for t in TRIMESTRES:
        comp = e["compromiso"][t][:, None]
        ruido_area = rng.normal(0, 0.25, size=(n, n_areas))
        # Logit multinomial con PRESENTE como referencia: las 4 probabilidades
        # siempre son válidas (entre 0 y 1 y suman 1)
        l_falta = p.falta_base - p.falta_peso_compromiso * comp - e["externo"][:, None] + ruido_area
        l_atraso = p.atraso_base - p.atraso_peso_compromiso * comp + 0.5 * ruido_area
        l_lic = np.full((n, n_areas), np.log(p.prob_licencia / (1 - p.prob_licencia)))
        expo = np.exp(np.stack([np.zeros((n, n_areas)), l_falta, l_atraso, l_lic], axis=-1))
        probs = expo / expo.sum(axis=-1, keepdims=True)
        conteos = rng.multinomial(dias, probs)                 # (n, áreas, 4): P, F, A, L
        P, F, A, L = (conteos[..., k] for k in range(4))
        e["asis"][t] = {"P": P, "F": F, "A": A, "L": L, "dias": np.full((n, n_areas), dias)}
    return e


def nota_asistencia(P, A, L, dias, p: Parametros):
    return redondear((P + L + A * p.peso_atraso_en_nota) * ESCALAS["ser"] / dias)


def porcentaje_asistencia(P, A, L, dias):
    """Para el modelo: asistió (presente, atraso o licencia justificada) / días × 100."""
    return (P + A + L) / dias * 100.0


# ════════════════════════════════════════════════════════════════════════
# PASO 4 — Casillas y notas por dimensión, área y trimestre
# ════════════════════════════════════════════════════════════════════════
def _casillas(mu, escala, n_cas, max_cas, prob_cero, p, rng, cambio_segunda_mitad=None):
    """Matriz de casillas (estudiantes × áreas × max_cas) en la escala de la dimensión.
    Las posiciones ≥ n_cas quedan vacías (NaN), como las casillas no usadas.
    cambio_segunda_mitad: desplazamiento de las casillas posteriores a la mitad (solo T3)."""
    forma = mu.shape + (max_cas,)
    mu_cas = np.broadcast_to(mu[..., None], forma).copy()
    if cambio_segunda_mitad is not None:
        mitad = np.ceil(n_cas * p.avance_t3)[..., None]
        mu_cas += np.where(np.arange(max_cas)[None, None, :] >= mitad, cambio_segunda_mitad[..., None], 0.0)
    valores = escala * sigmoide(mu_cas + rng.normal(0, p.ruido_casilla, size=forma))
    valores = redondear(valores)
    if prob_cero is not None:
        valores = np.where(rng.random(forma) < prob_cero[..., None], 0.0, valores)
    usadas = np.arange(max_cas)[None, None, :] < n_cas[..., None]
    return np.where(usadas, valores, np.nan)


def paso4_notas(e: dict, p: Parametros, rng: np.random.Generator) -> dict:
    """Simula cada casilla (Ser /10, Saber /45, Hacer /40) y calcula la nota de cada
    dimensión con la fórmula del registro: ROUND(PROMEDIO(casillas)). La 1.ª casilla
    de Ser es la nota de asistencia. Total = Ser + Saber + Hacer + Autoevaluación +
    puntos extra (máximo 100)."""
    n, n_areas = p.n_estudiantes, len(p.areas)
    dif = np.array([a["dificultad"] for a in p.areas.values()])[None, :]
    teo = np.array([a["teorica"] for a in p.areas.values()])[None, :]
    exig = (p.exigencia_por_nivel * (e["nivel"] - 1))[:, None]
    cursos, idx_curso = np.unique(e["curso"], return_inverse=True)
    e["notas"], e["casillas"] = {}, {}
    for t in TRIMESTRES:
        apt = e["aptitud"][t][:, None]
        comp = e["compromiso"][t][:, None]
        afin = e["afinidad"]
        periodo = rng.normal(0, p.ruido_periodo, size=(n, n_areas))
        # Cantidad de casillas: la decide cada docente (igual para todo el curso en esa área y trimestre)
        def n_por_curso(rango):
            por_curso = rng.integers(rango[0], rango[1] + 1, size=(len(cursos), n_areas))
            return por_curso[idx_curso]
        n_ser, n_saber, n_hacer = n_por_curso(p.casillas_ser), n_por_curso(p.casillas_saber), n_por_curso(p.casillas_hacer)

        mu_ser = p.ser_base + p.ser_peso_compromiso * comp + 0.3 * afin + periodo
        mu_saber = (p.saber_base + p.saber_peso_aptitud * (0.5 + teo) * apt + p.saber_peso_compromiso * comp
                    + afin - dif - exig + periodo)
        mu_hacer = (p.hacer_base + p.hacer_peso_compromiso * comp + p.hacer_peso_aptitud * (1.5 - teo) * apt
                    + 0.7 * afin - 0.5 * dif - exig + periodo)
        prob_cero = sigmoide(p.no_entrega_base - p.no_entrega_peso_compromiso * comp + 0 * afin)

        # En T3, el estudiante puede cambiar después de la mitad del trimestre
        cambio = (rng.normal(0, p.variacion_segunda_mitad_t3, size=(n, 1)) + rng.normal(0, 0.2, size=(n, n_areas))
                  if t == 3 else None)
        cas_ser = _casillas(mu_ser, 10, n_ser, p.casillas_ser[1], None, p, rng, cambio)
        a = e["asis"][t]
        cas_ser[..., 0] = nota_asistencia(a["P"], a["A"], a["L"], a["dias"], p)   # "Asistencia y Puntualidad"
        cas_saber = _casillas(mu_saber, 45, n_saber, p.casillas_saber[1], prob_cero, p, rng, cambio)
        cas_hacer = _casillas(mu_hacer, 40, n_hacer, p.casillas_hacer[1], prob_cero, p, rng, cambio)

        ser = redondear(np.nanmean(cas_ser, axis=-1))
        saber = redondear(np.nanmean(cas_saber, axis=-1))
        hacer = redondear(np.nanmean(cas_hacer, axis=-1))
        auto = np.clip(redondear(5 * sigmoide(p.auto_base + p.auto_peso_compromiso * comp
                                               + rng.normal(0, p.auto_ruido, size=(n, n_areas)))), 0, 5)
        extra = np.where(rng.random((n, n_areas)) < p.prob_puntos_extra, rng.integers(1, 4, size=(n, n_areas)), 0)
        total = np.minimum(ser + saber + hacer + auto + extra, 100)
        e["notas"][t] = {"ser": ser, "saber": saber, "hacer": hacer, "autoevaluacion": auto,
                         "puntos_extra": extra, "calificacion": total,
                         "n_casillas_ser": n_ser, "n_casillas_saber": n_saber, "n_casillas_hacer": n_hacer}
        e["casillas"][t] = {"ser": cas_ser, "saber": cas_saber, "hacer": cas_hacer}
    return e


# ════════════════════════════════════════════════════════════════════════
# PASO 5 — Cierre anual: nota anual por área, áreas reprobadas y etiqueta
# ════════════════════════════════════════════════════════════════════════
def paso5_etiqueta(e: dict, p: Parametros) -> dict:
    """Nota anual del área = ROUND(PROMEDIO(T1, T2, T3)) (fórmula del centralizador).
    Etiqueta según la cantidad de áreas con nota anual < 51."""
    anual = redondear(np.mean([e["notas"][t]["calificacion"] for t in TRIMESTRES], axis=0))
    reprobadas = (anual < p.nota_aprobacion).sum(axis=1)
    e["nota_anual"] = anual
    e["areas_reprobadas_anual"] = reprobadas
    e["promedio_anual"] = anual.mean(axis=1)
    e["nivel_riesgo"] = np.select(
        [reprobadas >= p.areas_riesgo_alto, reprobadas >= p.areas_riesgo_medio],
        ["RIESGO_ALTO", "RIESGO_MEDIO"], default="SIN_RIESGO")
    return e


# ════════════════════════════════════════════════════════════════════════
# PASO 5b — Información PARCIAL del 3.er trimestre (mitad del trimestre)
# ════════════════════════════════════════════════════════════════════════
def paso5b_parcial_t3(e: dict, p: Parametros, rng: np.random.Generator) -> dict:
    """A mitad del trimestre 3 solo se conocen las primeras casillas de cada
    dimensión y los primeros días de clase. La autoevaluación todavía no se
    registra (se usa la del T2) y no hay puntos extra."""
    cas, n3 = e["casillas"][3], e["notas"][3]
    a = e["asis"][3]
    dias_h = np.maximum(1, np.round(p.clases_por_trimestre * p.avance_t3)).astype(int)
    # Días transcurridos: muestreo sin reemplazo de los días reales del trimestre
    P_h = rng.hypergeometric(a["P"], a["dias"] - a["P"], dias_h)
    F_h = rng.hypergeometric(a["F"], a["dias"] - a["P"] - a["F"], dias_h - P_h)
    A_h = rng.hypergeometric(a["A"], np.maximum(a["L"], 0), dias_h - P_h - F_h)
    L_h = dias_h - P_h - F_h - A_h
    dias_arr = np.full_like(P_h, dias_h)

    def primeras(m, n_cas):
        k = np.ceil(n_cas * p.avance_t3).astype(int)
        usadas = np.arange(m.shape[-1])[None, None, :] < k[..., None]
        return np.where(usadas, m, np.nan)

    ser_cas = primeras(cas["ser"], n3["n_casillas_ser"])
    ser_cas[..., 0] = nota_asistencia(P_h, A_h, L_h, dias_arr, p)
    ser = redondear(np.nanmean(ser_cas, axis=-1))
    saber = redondear(np.nanmean(primeras(cas["saber"], n3["n_casillas_saber"]), axis=-1))
    hacer = redondear(np.nanmean(primeras(cas["hacer"], n3["n_casillas_hacer"]), axis=-1))
    e["parcial_t3"] = {
        "calificacion": np.minimum(ser + saber + hacer + e["notas"][2]["autoevaluacion"], 100),
        "P": P_h, "F": F_h, "A": A_h, "L": L_h, "dias": dias_arr,
    }
    return e


# ════════════════════════════════════════════════════════════════════════
# PASO 6 — Filas del dataset (una por estudiante y trimestre)
# ════════════════════════════════════════════════════════════════════════
def paso6_filas(e: dict, p: Parametros) -> pd.DataFrame:
    """Para cada T, SOLO la información disponible en ese momento:
      T1 → notas y asistencia del T1 (cerrado)
      T2 → T1 y T2 (cerrados)
      T3 → T1 y T2 cerrados + casillas y días transcurridos del T3 (paso 5b)
    Por área se calcula la nota acumulada (promedio redondeado como en el
    centralizador); luego, por estudiante: promedio de las áreas, asistencia
    acumulada y cantidad de áreas reprobadas hasta ese momento."""
    observadas = {1: [e["notas"][1]["calificacion"]],
                  2: [e["notas"][1]["calificacion"], e["notas"][2]["calificacion"]],
                  3: [e["notas"][1]["calificacion"], e["notas"][2]["calificacion"], e["parcial_t3"]["calificacion"]]}
    asis = {1: [e["asis"][1]], 2: [e["asis"][1], e["asis"][2]], 3: [e["asis"][1], e["asis"][2], e["parcial_t3"]]}
    filas = []
    for t in TRIMESTRES:
        por_area = np.mean(observadas[t], axis=0)                       # (estudiantes, áreas)
        presentes = sum(a["P"] + a["A"] + a["L"] for a in asis[t]).sum(axis=1)
        dias = sum(a["dias"] for a in asis[t]).sum(axis=1)
        filas.append(pd.DataFrame({
            "id_estudiante": e["id"],
            "promedio_notas": por_area.mean(axis=1).round(2),
            "porcentaje_asistencia": (presentes / dias * 100).round(2),
            "areas_reprobadas": (redondear(por_area) < p.nota_aprobacion).sum(axis=1),
            "nivel": e["nivel"],
            "trimestre": t,
            "nivel_riesgo": e["nivel_riesgo"],
        }))
    ds = pd.concat(filas, ignore_index=True)
    return ds.sort_values(["id_estudiante", "trimestre"], ignore_index=True)[COLUMNAS_FINALES]


def centralizador(e: dict, p: Parametros) -> pd.DataFrame:
    """Detalle por estudiante × área × trimestre (sin rasgos ocultos), con la misma
    información que el registro y el centralizador oficiales."""
    nombres = list(p.areas)
    n, n_areas = p.n_estudiantes, len(nombres)
    partes = []
    for t in TRIMESTRES:
        nt, a = e["notas"][t], e["asis"][t]
        d = {
            "id_estudiante": np.repeat(e["id"], n_areas),
            "curso": np.repeat(e["curso"], n_areas),
            "nivel": np.repeat(e["nivel"], n_areas),
            "area": np.tile(nombres, n),
            "trimestre": t,
        }
        for k in ("n_casillas_ser", "n_casillas_saber", "n_casillas_hacer", "ser", "saber", "hacer",
                  "autoevaluacion", "puntos_extra", "calificacion"):
            d[k] = nt[k].ravel().astype(int)
        for k in ("P", "F", "A", "L", "dias"):
            d[f"asis_{k}"] = a[k].ravel().astype(int)
        d["nota_asistencia"] = nota_asistencia(a["P"], a["A"], a["L"], a["dias"], p).ravel().astype(int)
        d["calificacion_parcial_mitad_t3"] = (e["parcial_t3"]["calificacion"].ravel().astype(int)
                                              if t == 3 else np.full(n * n_areas, -1))
        d["nota_anual_area"] = e["nota_anual"].ravel().astype(int)
        d["cambio_brusco"] = np.repeat(e["cambio_brusco"], n_areas)
        d["areas_reprobadas_anual"] = np.repeat(e["areas_reprobadas_anual"], n_areas)
        d["nivel_riesgo"] = np.repeat(e["nivel_riesgo"], n_areas)
        partes.append(pd.DataFrame(d))
    c = pd.concat(partes, ignore_index=True)
    c["calificacion_parcial_mitad_t3"] = c["calificacion_parcial_mitad_t3"].replace(-1, pd.NA)
    return c.sort_values(["id_estudiante", "area", "trimestre"], ignore_index=True)


# ════════════════════════════════════════════════════════════════════════
def generar(p: Parametros = Parametros()) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Ejecuta los pasos con un único generador aleatorio (reproducible)."""
    rng = np.random.default_rng(p.semilla)
    e = paso1_estudiantes(p, rng)
    e = paso2_evolucion(e, p, rng)
    e = paso3_asistencia(e, p, rng)
    e = paso4_notas(e, p, rng)
    e = paso5_etiqueta(e, p)
    e = paso5b_parcial_t3(e, p, rng)
    return paso6_filas(e, p), centralizador(e, p)


def main() -> None:
    p = Parametros()
    dataset, central = generar(p)
    CARPETA_DATOS.mkdir(parents=True, exist_ok=True)
    dataset.to_csv(ARCHIVO_DATASET, index=False, encoding="utf-8")
    central.to_csv(ARCHIVO_CENTRALIZADOR, index=False, encoding="utf-8")
    # El archivo de detalle de la versión anterior (una sola nota por estudiante) ya no corresponde
    viejo = CARPETA_DATOS / "detalle_trimestral_sintetico.csv"
    if viejo.exists():
        print(f"Aviso: {viejo.name} es de la versión anterior y ya no se usa; puedes borrarlo.")
    print(f"Dataset: {len(dataset)} filas ({p.n_estudiantes} estudiantes × 3 trimestres) → {ARCHIVO_DATASET}")
    print(f"Centralizador: {len(central)} filas ({p.n_estudiantes} × {len(p.areas)} áreas × 3) → {ARCHIVO_CENTRALIZADOR}")


if __name__ == "__main__":
    main()
