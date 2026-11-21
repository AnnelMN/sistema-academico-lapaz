"""
Excel de EJEMPLO con el formato del registro pedagógico oficial, para UN curso
ficticio, generado con el mismo simulador del dataset (misma semilla).

Contiene hojas con FÓRMULAS como las del registro oficial (Excel las calcula al
abrir el archivo): asistencia P/F/A/L → nota de asistencia → 1.ª casilla de Ser →
promedios por dimensión → calificación trimestral → centralizador con nota anual,
áreas reprobadas y nivel de riesgo.

Todos los datos son FICTICIOS (estudiantes "Estudiante 01…", docente y fechas de
ejemplo). Sirve para mostrar en la tesis cómo luce un curso del dataset.

Uso (desde microservicio-ia/; requiere openpyxl, que no lo necesita el microservicio):
    venv/Scripts/python.exe dataset_sintetico/generar_excel_ejemplo.py
"""
from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

import numpy as np
from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter as col

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generar_dataset as gen  # noqa: E402

ARCHIVO = Path(__file__).resolve().parent / "ejemplo_registro_sintetico.xlsx"
NIVEL_EJEMPLO = 5
AREA_REGISTRO = "MATEMÁTICA"
INICIO_TRIMESTRE = {1: dt.date(2026, 2, 3), 2: dt.date(2026, 5, 12), 3: dt.date(2026, 9, 1)}
DIAS_CLASE = (0, 3)                   # lunes y jueves (2 clases por semana)
FILA0 = 7                             # primera fila de estudiantes en REGISTRO y ASISTENCIA

# ── Estilos ────────────────────────────────────────────────────────────────
F = "Arial"
F_NORMAL, F_NEGRITA = Font(name=F, size=9), Font(name=F, size=9, bold=True)
F_TITULO = Font(name=F, size=13, bold=True)
F_ENTRADA = Font(name=F, size=9, color="0000FF")      # dato de entrada (simulado)
F_VINCULO = Font(name=F, size=9, color="008000")      # vínculo a otra hoja
F_FORMULA = Font(name=F, size=9, color="000000")      # fórmula
F_NOTA = Font(name=F, size=8, italic=True, color="595959")
RELLENO_CAB = PatternFill("solid", fgColor="D9E1F2")
RELLENO_PROM = PatternFill("solid", fgColor="FFF2CC")
RELLENO_CONFIG = PatternFill("solid", fgColor="FFFF00")
RELLENO_VACIO = PatternFill("solid", fgColor="EDEDED")
LINEA = Side(style="thin", color="BFBFBF")
BORDE = Border(left=LINEA, right=LINEA, top=LINEA, bottom=LINEA)
CENTRO = Alignment(horizontal="center", vertical="center", wrap_text=True)


def celda(ws, ref, valor, fuente=F_NORMAL, relleno=None, formato=None, alinear=CENTRO, borde=True):
    c = ws[ref]
    c.value = valor
    c.font = fuente
    if relleno:
        c.fill = relleno
    if formato:
        c.number_format = formato
    if alinear:
        c.alignment = alinear
    if borde:
        c.border = BORDE
    return c


def simular() -> dict:
    """Ejecuta el simulador con la misma semilla y devuelve su estado interno."""
    p = gen.Parametros()
    rng = np.random.default_rng(p.semilla)
    e = gen.paso1_estudiantes(p, rng)
    e = gen.paso2_evolucion(e, p, rng)
    e = gen.paso3_asistencia(e, p, rng)
    e = gen.paso4_notas(e, p, rng)
    e = gen.paso5_etiqueta(e, p)
    e = gen.paso5b_parcial_t3(e, p, rng)
    e["p"] = p
    return e


def fechas_de_clase(t: int, cantidad: int) -> list[dt.date]:
    d, fechas = INICIO_TRIMESTRE[t], []
    while len(fechas) < cantidad:
        if d.weekday() in DIAS_CLASE:
            fechas.append(d)
        d += dt.timedelta(days=1)
    return fechas


# ── CARÁTULA ───────────────────────────────────────────────────────────────
CONFIG = {}  # nombre → referencia absoluta en CARATULA


def hoja_caratula(wb, curso, p):
    ws = wb.create_sheet("CARATULA")
    ws.column_dimensions["A"].width = 34
    ws.column_dimensions["B"].width = 18
    ws.column_dimensions["C"].width = 60
    celda(ws, "A1", "REGISTRO PEDAGÓGICO — EJEMPLO CON DATOS FICTICIOS", F_TITULO, alinear=None, borde=False)
    datos = [
        ("Unidad educativa", 'U.E. La Paz "A" (caso de estudio)'),
        ("Gestión", 2026),
        ("Nivel", "Secundaria Comunitaria Productiva"),
        ("Curso", f"{NIVEL_EJEMPLO}.º de secundaria (curso ficticio {curso})"),
        ("Área del registro", AREA_REGISTRO),
        ("Maestra/o", "Docente ficticio (ejemplo)"),
        ("Origen de los datos", "Simulación — dataset_sintetico/generar_dataset.py, semilla 2026"),
    ]
    for i, (k, v) in enumerate(datos, start=3):
        celda(ws, f"A{i}", k, F_NEGRITA, RELLENO_CAB, alinear=None)
        ws.merge_cells(f"B{i}:C{i}")
        celda(ws, f"B{i}", v, alinear=None)
    celda(ws, "A12", "CONFIGURACIÓN (la usan las fórmulas)", F_NEGRITA, alinear=None, borde=False)
    config = [
        ("ESCALA_SER", "Escala de las casillas de SER", 10, "Puntos de la dimensión Ser (rúbrica del Director)"),
        ("ESCALA_SABER", "Escala de las casillas de SABER", 45, "Puntos de la dimensión Saber"),
        ("ESCALA_HACER", "Escala de las casillas de HACER", 40, "Puntos de la dimensión Hacer"),
        ("MAX_AUTO", "Autoevaluación máxima", 5, "Puntos de la autoevaluación"),
        ("APROBACION", "Nota mínima de aprobación", p.nota_aprobacion, "Aprobado con 51 o más"),
        ("PESO_ATRASO", "Valor de un atraso en la nota de asistencia", "=2/3", "Registro oficial: el atraso vale 2/3 de asistencia"),
        ("AREAS_MEDIO", "Áreas reprobadas para RIESGO_MEDIO (desde)", p.areas_riesgo_medio, "Etiqueta del dataset (opción b)"),
        ("AREAS_ALTO", "Áreas reprobadas para RIESGO_ALTO (desde)", p.areas_riesgo_alto, "Etiqueta del dataset (opción b)"),
    ]
    celda(ws, "A13", "Parámetro", F_NEGRITA, RELLENO_CAB)
    celda(ws, "B13", "Valor", F_NEGRITA, RELLENO_CAB)
    celda(ws, "C13", "Fuente / justificación", F_NEGRITA, RELLENO_CAB)
    for i, (clave, nombre, valor, fuente) in enumerate(config, start=14):
        celda(ws, f"A{i}", nombre, alinear=None)
        celda(ws, f"B{i}", valor, F_ENTRADA, RELLENO_CONFIG, "0.000" if clave == "PESO_ATRASO" else "0")
        celda(ws, f"C{i}", fuente, F_NOTA, alinear=None)
        CONFIG[clave] = f"CARATULA!$B${i}"
    return ws


# ── LÉEME ──────────────────────────────────────────────────────────────────
def hoja_leeme(wb):
    ws = wb.active
    ws.title = "LEEME"
    ws.column_dimensions["A"].width = 110
    lineas = [
        ("EJEMPLO DE UN CURSO DEL DATASET SINTÉTICO", F_TITULO),
        ("Todos los datos de este libro son FICTICIOS: provienen de la simulación del dataset sintético "
         "(misma semilla). No corresponden a ningún estudiante real.", F_NEGRITA),
        ("", F_NORMAL),
        ("Estructura (igual que el registro pedagógico oficial):", F_NEGRITA),
        ("• CARATULA: datos del curso y CONFIGURACIÓN que usan las fórmulas (celdas amarillas, editables).", F_NORMAL),
        ("• ASISTENCIA 1/2/3TRIM: códigos diarios P (presente), F (falta), A (atraso), L (licencia). "
         "Nota = ROUND((P + L + A·2/3) × 10 / días).", F_NORMAL),
        ("• REGISTRO 1/2/3TRIM (área de Matemática): casillas de Ser /10, Saber /45 y Hacer /40. La 1.ª casilla de Ser "
         "es la nota de asistencia. Cada dimensión = ROUND(PROMEDIO(casillas)). Calificación = Ser + Saber + Hacer + "
         "Autoevaluación + puntos extra (máx. 100).", F_NORMAL),
        ("• CENTRALIZADOR: las 13 áreas por trimestre, nota anual = ROUND(PROMEDIO(T1,T2,T3)), áreas reprobadas "
         "(nota anual < 51) y nivel de riesgo (0 → SIN_RIESGO, 1–2 → RIESGO_MEDIO, ≥3 → RIESGO_ALTO). Matemática se "
         "toma de las hojas REGISTRO; las otras 12 áreas, de la simulación.", F_NORMAL),
        ("", F_NORMAL),
        ("Colores:", F_NEGRITA),
        ("• Azul: dato de entrada simulado (casillas, códigos de asistencia, notas de otras áreas).", F_ENTRADA),
        ("• Verde: vínculo a otra hoja.", F_VINCULO),
        ("• Negro: fórmula.", F_FORMULA),
        ("• Fondo amarillo: configuración editable en CARATULA. Fondo gris: casilla no usada por el docente.", F_NORMAL),
        ("", F_NORMAL),
        ("Comprobación: la columna «¿Coincide?» del CENTRALIZADOR compara el riesgo calculado por las fórmulas con la "
         "etiqueta del dataset (debe decir SÍ en todas las filas).", F_NORMAL),
    ]
    for i, (texto, fuente) in enumerate(lineas, start=1):
        c = ws.cell(row=i, column=1, value=texto)
        c.font = fuente
        c.alignment = Alignment(wrap_text=True, vertical="top")


# ── ASISTENCIA ─────────────────────────────────────────────────────────────
def hoja_asistencia(wb, t, idx, ids, e, a_idx, rng):
    p = e["p"]
    ws = wb.create_sheet(f"ASISTENCIA {t}TRIM")
    dias = p.clases_por_trimestre
    fechas = fechas_de_clase(t, dias)
    c_dia0 = 3
    c_P = c_dia0 + dias
    cols = {k: col(c_P + i) for i, k in enumerate(["P", "F", "A", "L", "DIAS", "NOTA", "PCT"])}
    celda(ws, "A1", f"REGISTRO DE ASISTENCIA — {AREA_REGISTRO} — {t}.º TRIMESTRE (datos ficticios)", F_TITULO, alinear=None, borde=False)
    celda(ws, "A2", "P = presente · F = falta · A = atraso (vale 2/3) · L = licencia (cuenta como asistencia)", F_NOTA, alinear=None, borde=False)
    ws.merge_cells(start_row=5, start_column=c_dia0, end_row=5, end_column=c_dia0 + dias - 1)
    celda(ws, f"{col(c_dia0)}5", "FECHA DE CLASE", F_NEGRITA, RELLENO_CAB)
    for k in ("A", "B"):
        ws.merge_cells(f"{k}5:{k}6")
    celda(ws, "A5", "Nº", F_NEGRITA, RELLENO_CAB)
    celda(ws, "B5", "ESTUDIANTE (ficticio)", F_NEGRITA, RELLENO_CAB)
    for j, f in enumerate(fechas):
        celda(ws, f"{col(c_dia0 + j)}6", f, F_NEGRITA, RELLENO_CAB, "dd/mm")
        ws.column_dimensions[col(c_dia0 + j)].width = 5.2
    titulos = {"P": "P", "F": "F", "A": "A", "L": "L", "DIAS": "DÍAS TRABAJADOS", "NOTA": "NOTA /10", "PCT": "% ASISTENCIA"}
    for k, letra in cols.items():
        ws.merge_cells(f"{letra}5:{letra}6")
        celda(ws, f"{letra}5", titulos[k], F_NEGRITA, RELLENO_PROM)
        ws.column_dimensions[letra].width = 9 if k not in ("DIAS", "PCT") else 11
    a = e["asis"][t]
    for k, i in enumerate(idx):
        r = FILA0 + k
        celda(ws, f"A{r}", k + 1)
        celda(ws, f"B{r}", ids[k], alinear=None)
        codigos = (["P"] * int(a["P"][i, a_idx]) + ["F"] * int(a["F"][i, a_idx])
                   + ["A"] * int(a["A"][i, a_idx]) + ["L"] * int(a["L"][i, a_idx]))
        rng.shuffle(codigos)
        for j, cod in enumerate(codigos):
            celda(ws, f"{col(c_dia0 + j)}{r}", cod, F_ENTRADA)
        rango = f"{col(c_dia0)}{r}:{col(c_dia0 + dias - 1)}{r}"
        for cod in ("P", "F", "A", "L"):
            celda(ws, f"{cols[cod]}{r}", f'=COUNTIF({rango},"{cod}")', F_FORMULA, formato="0")
        celda(ws, f"{cols['DIAS']}{r}", f"=SUM({cols['P']}{r}:{cols['L']}{r})", F_FORMULA, formato="0")
        celda(ws, f"{cols['NOTA']}{r}",
              f"=IF({cols['DIAS']}{r}=0,\"\",ROUND(({cols['P']}{r}+{cols['L']}{r}+{cols['A']}{r}*{CONFIG['PESO_ATRASO']})"
              f"*{CONFIG['ESCALA_SER']}/{cols['DIAS']}{r},0))", F_FORMULA, RELLENO_PROM, "0")
        celda(ws, f"{cols['PCT']}{r}",
              f"=IF({cols['DIAS']}{r}=0,\"\",({cols['P']}{r}+{cols['A']}{r}+{cols['L']}{r})/{cols['DIAS']}{r})",
              F_FORMULA, formato="0.0%")
    ws.column_dimensions["A"].width = 5
    ws.column_dimensions["B"].width = 16
    ws.freeze_panes = f"{col(c_dia0)}{FILA0}"
    return cols["NOTA"]


# ── REGISTRO ───────────────────────────────────────────────────────────────
def hoja_registro(wb, t, idx, ids, e, a_idx, col_nota_asis):
    p = e["p"]
    ws = wb.create_sheet(f"REGISTRO {t}TRIM")
    max_ser, max_saber, max_hacer = p.casillas_ser[1], p.casillas_saber[1], p.casillas_hacer[1]
    c = 3
    bloques = {}
    for dim, n_max in (("SER", max_ser), ("SABER", max_saber), ("HACER", max_hacer)):
        bloques[dim] = (c, c + n_max - 1, c + n_max)      # primera casilla, última, columna de promedio
        c += n_max + 1
    c_total, c_auto, c_extra, c_calif, c_estado = c, c + 1, c + 2, c + 3, c + 4
    celda(ws, "A1", f"REGISTRO PEDAGÓGICO — {AREA_REGISTRO} — {t}.º TRIMESTRE (datos ficticios)", F_TITULO, alinear=None, borde=False)
    celda(ws, "A2", "Casillas en la escala de su dimensión (Ser /10, Saber /45, Hacer /40). Gris = casilla no usada "
          "por el docente en este trimestre. Las casillas vacías no cuentan en el promedio.", F_NOTA, alinear=None, borde=False)
    for k in ("A", "B"):
        ws.merge_cells(f"{k}4:{k}6")
    celda(ws, "A4", "Nº", F_NEGRITA, RELLENO_CAB)
    celda(ws, "B4", "ESTUDIANTE (ficticio)", F_NEGRITA, RELLENO_CAB)
    escala = {"SER": "ESCALA_SER", "SABER": "ESCALA_SABER", "HACER": "ESCALA_HACER"}
    n_usadas = {"SER": int(e["notas"][t]["n_casillas_ser"][idx[0], a_idx]),
                "SABER": int(e["notas"][t]["n_casillas_saber"][idx[0], a_idx]),
                "HACER": int(e["notas"][t]["n_casillas_hacer"][idx[0], a_idx])}
    puntos = {"SER": 10, "SABER": 45, "HACER": 40}
    for dim, (ini, fin, c_prom) in bloques.items():
        ws.merge_cells(start_row=4, start_column=ini, end_row=4, end_column=fin)
        celda(ws, f"{col(ini)}4", f"{dim} /{puntos[dim]} — casillas usadas: {n_usadas[dim]}", F_NEGRITA, RELLENO_CAB)
        for j in range(ini, fin + 1):
            k = j - ini + 1
            nombre = "Asist. y Puntual." if (dim == "SER" and k == 1) else f"C{k}"
            usada = k <= n_usadas[dim]
            ws.merge_cells(start_row=5, start_column=j, end_row=6, end_column=j)
            celda(ws, f"{col(j)}5", nombre if usada else "—", F_NEGRITA, RELLENO_CAB if usada else RELLENO_VACIO)
            ws.column_dimensions[col(j)].width = 8 if (dim == "SER" and k == 1) else 4.6
        ws.merge_cells(start_row=4, start_column=c_prom, end_row=6, end_column=c_prom)
        celda(ws, f"{col(c_prom)}4", f"PROMEDIO {dim} /{puntos[dim]}", F_NEGRITA, RELLENO_PROM)
        ws.column_dimensions[col(c_prom)].width = 9
    for cc, titulo in ((c_total, "TOTAL S+S+H"), (c_auto, "AUTOEVAL. /5"), (c_extra, "PTS. EXTRA"),
                       (c_calif, "CALIFICACIÓN TRIMESTRAL"), (c_estado, "ESTADO")):
        ws.merge_cells(start_row=4, start_column=cc, end_row=6, end_column=cc)
        celda(ws, f"{col(cc)}4", titulo, F_NEGRITA, RELLENO_PROM)
        ws.column_dimensions[col(cc)].width = 11 if cc != c_estado else 12
    ws[f"{col(c_calif)}4"].comment = Comment(
        "El registro oficial marca CORREGIR si pasa de 100; aquí se limita a 100 con MIN(), igual que el dataset.", "dataset sintético")

    cas, notas = e["casillas"][t], e["notas"][t]
    for k, i in enumerate(idx):
        r = FILA0 + k
        celda(ws, f"A{r}", k + 1)
        celda(ws, f"B{r}", ids[k], alinear=None)
        for dim, (ini, fin, c_prom) in bloques.items():
            valores = cas[dim.lower()][i, a_idx]
            for j in range(ini, fin + 1):
                pos = j - ini
                if pos >= n_usadas[dim]:
                    celda(ws, f"{col(j)}{r}", None, relleno=RELLENO_VACIO)
                elif dim == "SER" and pos == 0:
                    celda(ws, f"{col(j)}{r}", f"='ASISTENCIA {t}TRIM'!{col_nota_asis}{r}", F_VINCULO, formato="0")
                else:
                    celda(ws, f"{col(j)}{r}", int(valores[pos]), F_ENTRADA, formato="0")
            celda(ws, f"{col(c_prom)}{r}",
                  f"=IFERROR(ROUND(AVERAGE({col(ini)}{r}:{col(fin)}{r})*{puntos[dim]}/{CONFIG[escala[dim]]},0),\"\")",
                  F_FORMULA, RELLENO_PROM, "0")
        s, sb, h = (f"{col(bloques[d][2])}{r}" for d in ("SER", "SABER", "HACER"))
        celda(ws, f"{col(c_total)}{r}", f'=IF(OR({s}="",{sb}="",{h}=""),"",SUM({s},{sb},{h}))', F_FORMULA, formato="0")
        celda(ws, f"{col(c_auto)}{r}", int(notas["autoevaluacion"][i, a_idx]), F_ENTRADA, formato="0")
        extra = int(notas["puntos_extra"][i, a_idx])
        celda(ws, f"{col(c_extra)}{r}", extra if extra else None, F_ENTRADA, formato="0")
        celda(ws, f"{col(c_calif)}{r}",
              f'=IF(OR({col(c_total)}{r}="",{col(c_auto)}{r}=""),"",MIN(100,SUM({col(c_total)}{r},{col(c_auto)}{r},{col(c_extra)}{r})))',
              Font(name=F, size=9, bold=True), RELLENO_PROM, "0")
        celda(ws, f"{col(c_estado)}{r}",
              f'=IF({col(c_calif)}{r}="","",IF({col(c_calif)}{r}>={CONFIG["APROBACION"]},"APROBADO","REPROBADO"))', F_FORMULA)
    ws.column_dimensions["A"].width = 5
    ws.column_dimensions["B"].width = 16
    ws.row_dimensions[4].height = 30
    ws.freeze_panes = f"C{FILA0}"
    return col(c_calif)


# ── CENTRALIZADOR ──────────────────────────────────────────────────────────
def hoja_centralizador(wb, idx, ids, e, a_idx, col_calif):
    p = e["p"]
    ws = wb.create_sheet("CENTRALIZADOR")
    areas = list(p.areas)
    celda(ws, "A1", f"CENTRALIZADOR DE CALIFICACIONES — {NIVEL_EJEMPLO}.º DE SECUNDARIA (datos ficticios)", F_TITULO, alinear=None, borde=False)
    celda(ws, "A2", f"{AREA_REGISTRO} viene de las hojas REGISTRO (verde); las demás áreas, de la simulación (azul). "
          "NA = nota anual = ROUND(PROMEDIO(T1,T2,T3)).", F_NOTA, alinear=None, borde=False)
    for k in ("A", "B"):
        ws.merge_cells(f"{k}4:{k}5")
    celda(ws, "A4", "Nº", F_NEGRITA, RELLENO_CAB)
    celda(ws, "B4", "ESTUDIANTE (ficticio)", F_NEGRITA, RELLENO_CAB)
    c = 3
    col_area = {}
    for nombre in areas:
        col_area[nombre] = c
        ws.merge_cells(start_row=4, start_column=c, end_row=4, end_column=c + 3)
        celda(ws, f"{col(c)}4", nombre, F_NEGRITA, RELLENO_CAB)
        for j, sub in enumerate(("T1", "T2", "T3", "NA")):
            celda(ws, f"{col(c + j)}5", sub, F_NEGRITA, RELLENO_PROM if sub == "NA" else RELLENO_CAB)
            ws.column_dimensions[col(c + j)].width = 4.6
        c += 4
    resumen = ["PROM. T1", "PROM. T2", "PROM. T3", "PROM. ANUAL", "ÁREAS REPROBADAS", "NIVEL DE RIESGO",
               "Etiqueta del dataset", "¿Coincide?"]
    col_res = {}
    for j, titulo in enumerate(resumen):
        col_res[titulo] = col(c + j)
        ws.merge_cells(start_row=4, start_column=c + j, end_row=5, end_column=c + j)
        celda(ws, f"{col(c + j)}4", titulo, F_NEGRITA, RELLENO_PROM)
        ws.column_dimensions[col(c + j)].width = 10 if j < 5 else 15
    ws.row_dimensions[4].height = 48

    filas_ok = []
    for k, i in enumerate(idx):
        r = 6 + k
        filas_ok.append(r)
        celda(ws, f"A{r}", k + 1)
        celda(ws, f"B{r}", ids[k], alinear=None)
        for nombre in areas:
            c0 = col_area[nombre]
            ai = areas.index(nombre)
            for t in (1, 2, 3):
                ref = f"{col(c0 + t - 1)}{r}"
                if nombre == AREA_REGISTRO:
                    celda(ws, ref, f"='REGISTRO {t}TRIM'!{col_calif[t]}{FILA0 + k}", F_VINCULO, formato="0")
                else:
                    celda(ws, ref, int(e["notas"][t]["calificacion"][i, ai]), F_ENTRADA, formato="0")
            t1, t3 = f"{col(c0)}{r}", f"{col(c0 + 2)}{r}"
            celda(ws, f"{col(c0 + 3)}{r}", f'=IF(COUNT({t1}:{t3})<3,"",ROUND(AVERAGE({t1}:{t3}),0))',
                  Font(name=F, size=9, bold=True), RELLENO_PROM, "0")
        def lista(desplazamiento):
            return ",".join(f"{col(col_area[n] + desplazamiento)}{r}" for n in areas)
        for j, titulo in enumerate(("PROM. T1", "PROM. T2", "PROM. T3", "PROM. ANUAL")):
            celda(ws, f"{col_res[titulo]}{r}", f"=IFERROR(AVERAGE({lista(3 if j == 3 else j)}),\"\")", F_FORMULA, formato="0.00")
        reprob = "+".join(f'COUNTIF({col(col_area[n] + 3)}{r},"<"&{CONFIG["APROBACION"]})' for n in areas)
        celda(ws, f"{col_res['ÁREAS REPROBADAS']}{r}", f"={reprob}", Font(name=F, size=9, bold=True), formato="0")
        rep = f"{col_res['ÁREAS REPROBADAS']}{r}"
        celda(ws, f"{col_res['NIVEL DE RIESGO']}{r}",
              f'=IF({rep}>={CONFIG["AREAS_ALTO"]},"RIESGO_ALTO",IF({rep}>={CONFIG["AREAS_MEDIO"]},"RIESGO_MEDIO","SIN_RIESGO"))',
              Font(name=F, size=9, bold=True))
        celda(ws, f"{col_res['Etiqueta del dataset']}{r}", str(e["nivel_riesgo"][i]), F_ENTRADA)
        celda(ws, f"{col_res['¿Coincide?']}{r}",
              f'=IF({col_res["NIVEL DE RIESGO"]}{r}={col_res["Etiqueta del dataset"]}{r},"SÍ","NO")', F_FORMULA)
    ws.column_dimensions["A"].width = 5
    ws.column_dimensions["B"].width = 16
    ws.freeze_panes = "C6"
    return ws


def main() -> None:
    e = simular()
    p = e["p"]
    a_idx = list(p.areas).index(AREA_REGISTRO)
    cursos_nivel = sorted({c for c, n in zip(e["curso"], e["nivel"]) if n == NIVEL_EJEMPLO})
    curso = cursos_nivel[0]
    idx = np.flatnonzero(e["curso"] == curso)
    ids = [f"Estudiante {k + 1:02d}" for k in range(len(idx))]

    wb = Workbook()
    hoja_leeme(wb)
    hoja_caratula(wb, curso, p)
    rng = np.random.default_rng(p.semilla + 99)   # solo para ordenar los días (reproducible)
    col_calif = {}
    for t in (1, 2, 3):
        col_nota = hoja_asistencia(wb, t, idx, ids, e, a_idx, rng)
        col_calif[t] = hoja_registro(wb, t, idx, ids, e, a_idx, col_nota)
    hoja_centralizador(wb, idx, ids, e, a_idx, col_calif)
    wb.calculation.fullCalcOnLoad = True           # Excel recalcula todas las fórmulas al abrir
    wb.save(ARCHIVO)
    print(f"Excel de ejemplo ({curso}, {len(idx)} estudiantes) → {ARCHIVO}")


if __name__ == "__main__":
    main()
