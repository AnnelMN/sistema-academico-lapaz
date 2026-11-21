"""
Microservicio IA - Predicción de riesgo académico (FastAPI).

Seguridad (hallazgo LB-13 / control A de la Skill web-security-audit):
- POST /predecir exige el encabezado X-API-Key con la clave compartida IA_API_KEY:
  solo el backend del sistema puede pedir predicciones.
- /docs, /redoc y /openapi.json solo existen con ENTORNO=development.
- Los datos de entrada se validan por rango y no se aceptan campos extra.
- Los errores internos no se envían al cliente (solo quedan en el log).
- El modelo se carga UNA vez al iniciar, no en cada solicitud.
"""
import logging
import os
import secrets
from contextlib import asynccontextmanager
from typing import Optional

import joblib
import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

_BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(_BASE_DIR, ".env"))

logger = logging.getLogger("microservicio-ia")

# Por seguridad, si no se indica ENTORNO se asume producción (sin /docs)
ENTORNO = os.getenv("ENTORNO", "production").strip().lower()
ES_DESARROLLO = ENTORNO == "development"

def _clave_valida(valor: str) -> str:
    """Devuelve la clave solo si es usable: ni vacía, ni el valor de ejemplo de
    .env.example ("cambia_esto…"), ni menor a 32 caracteres (C-01). Si no, "",
    y /predecir rechaza todas las solicitudes (falla cerrada)."""
    valor = (valor or "").strip()
    if len(valor) < 32 or valor.lower().startswith("cambia_esto"):
        return ""
    return valor


IA_API_KEY = _clave_valida(os.getenv("IA_API_KEY", ""))

# Ruta al modelo entrenado (configurable por entorno, con valor local por defecto)
MODEL_PATH = os.getenv("MODEL_PATH", "./model/modelo_riesgo.pkl")
if not os.path.isabs(MODEL_PATH):
    MODEL_PATH = os.path.normpath(os.path.join(_BASE_DIR, MODEL_PATH))

# Regla de negocio 4: exactamente estas tres categorías
NIVELES_VALIDOS = {"SIN_RIESGO", "RIESGO_MEDIO", "RIESGO_ALTO"}

# Variables con las que se entrenó el modelo (train_model.py), en este orden
FEATURES = ["promedio_notas", "porcentaje_asistencia", "areas_reprobadas", "nivel", "trimestre"]

_modelo = None


def _cargar_modelo():
    if not os.path.exists(MODEL_PATH):
        logger.warning("No se encontró el modelo en %s", MODEL_PATH)
        return None
    try:
        modelo = joblib.load(MODEL_PATH)
    except Exception:  # noqa: BLE001 - se registra y el servicio responde 503
        logger.exception("No se pudo cargar el modelo")
        return None
    # El modelo debe esperar exactamente las variables de FEATURES y predecir solo
    # las 3 categorías permitidas; si no (p. ej., un .pkl antiguo), no se usa.
    esperadas = list(getattr(modelo, "feature_names_in_", []))
    clases = set(map(str, getattr(modelo, "classes_", [])))
    if esperadas != FEATURES or not clases <= NIVELES_VALIDOS:
        logger.error("Modelo incompatible: variables %s, clases %s", esperadas, sorted(clases))
        return None
    return modelo


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global _modelo
    _modelo = _cargar_modelo()
    if not IA_API_KEY:
        logger.warning("IA_API_KEY no está configurada o no es válida (valor de ejemplo o muy corta): /predecir rechazará todas las solicitudes")
    yield


app = FastAPI(
    title="Microservicio IA - Predicción de Riesgo Académico",
    lifespan=lifespan,
    docs_url="/docs" if ES_DESARROLLO else None,
    redoc_url="/redoc" if ES_DESARROLLO else None,
    openapi_url="/openapi.json" if ES_DESARROLLO else None,
)


def verificar_clave(x_api_key: Optional[str] = Header(default=None, alias="X-API-Key")):
    """Solo el backend (que conoce IA_API_KEY) puede pedir predicciones."""
    if not IA_API_KEY:
        raise HTTPException(status_code=503, detail="Servicio no configurado")
    if not x_api_key or not secrets.compare_digest(x_api_key.encode(), IA_API_KEY.encode()):
        raise HTTPException(status_code=401, detail="No autorizado")


class PredictionRequest(BaseModel):
    """Datos de entrada, con rangos válidos. No se aceptan campos adicionales."""

    model_config = ConfigDict(extra="forbid")

    promedio_notas: float = Field(ge=0, le=100)          # promedio de las áreas hasta el momento
    porcentaje_asistencia: float = Field(ge=0, le=100)   # (P + A + L) / días × 100, acumulado
    areas_reprobadas: int = Field(ge=0, le=13)           # áreas con nota acumulada < 51
    nivel: int = Field(ge=1, le=6)                       # 1.º a 6.º de secundaria
    trimestre: int = Field(ge=1, le=3)                   # trimestre de la predicción


@app.get("/health")
def health_check():
    """Confirma que el servicio está activo (sin datos internos)."""
    return {"status": "active"}


@app.post("/predecir", dependencies=[Depends(verificar_clave)])
def predecir_riesgo(data: PredictionRequest):
    """Predicción de riesgo académico. Requiere el encabezado X-API-Key."""
    if _modelo is None:
        raise HTTPException(status_code=503, detail="Modelo no disponible")

    try:
        entrada = pd.DataFrame([data.model_dump()])[FEATURES]
        nivel = str(_modelo.predict(entrada)[0])
        probabilidad = float(max(_modelo.predict_proba(entrada)[0]))
        if nivel not in NIVELES_VALIDOS:
            raise ValueError(f"Categoría de riesgo no permitida: {nivel}")
        return {"nivel_riesgo": nivel, "probabilidad": probabilidad}
    except Exception:  # noqa: BLE001 - el detalle queda solo en el log del servidor
        logger.exception("Error al realizar la predicción")
        raise HTTPException(status_code=500, detail="Error al realizar la predicción")
