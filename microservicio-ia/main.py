from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
import joblib
import os
import numpy as np

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(title="Microservicio IA - Predicción de Riesgo Académico")

# Ruta al modelo entrenado (configurable por entorno, con default local).
# Ej. .env: MODEL_PATH=./model/modelo_riesgo.pkl
_BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.getenv("MODEL_PATH", "./model/modelo_riesgo.pkl")
if not os.path.isabs(MODEL_PATH):
    MODEL_PATH = os.path.normpath(os.path.join(_BASE_DIR, MODEL_PATH))

# Esquema de los datos de entrada
class PredictionRequest(BaseModel):
    attendance_percentage: float
    total_score: float
    class_participation: float
    weekly_self_study_hours: float

@app.get("/health")
def health_check():
    """
    Endpoint para confirmar que el servicio está activo.
    """
    return {"status": "active", "message": "Microservicio IA funcionando correctamente"}

@app.post("/predecir")
def predecir_riesgo(data: PredictionRequest):
    """
    Endpoint para realizar una predicción de riesgo académico.
    """
    if not os.path.exists(MODEL_PATH):
        raise HTTPException(
            status_code=503, 
            detail="El modelo no ha sido entrenado todavía. Falta el archivo model/modelo_riesgo.pkl."
        )
    
    try:
        # Cargar el modelo
        modelo = joblib.load(MODEL_PATH)
        
        # Preparar los datos en el formato que espera scikit-learn (array 2D)
        input_data = np.array([[
            data.attendance_percentage,
            data.total_score,
            data.class_participation,
            data.weekly_self_study_hours
        ]])
        
        # Realizar la predicción
        prediccion = modelo.predict(input_data)[0]
        
        # Obtener la probabilidad (tomamos la máxima probabilidad de las clases)
        probabilidades = modelo.predict_proba(input_data)[0]
        probabilidad = max(probabilidades)
        
        return {
            "nivel_riesgo": prediccion,
            "probabilidad": float(probabilidad)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al realizar la predicción: {str(e)}")
