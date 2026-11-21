# Microservicio IA - Sistema Académico

Este microservicio se encarga de predecir el nivel de riesgo académico de los estudiantes utilizando un modelo de Machine Learning entrenado. Está construido con Python y FastAPI.

## Requisitos previos
- Python 3.9 o superior

## Instalación

1. Crear un entorno virtual dentro de la carpeta `microservicio-ia`:
```bash
python -m venv venv
```

2. Activar el entorno virtual:
- **En Windows:**
  ```bash
  venv\Scripts\activate
  ```
- **En Linux/Mac:**
  ```bash
  source venv/bin/activate
  ```

3. Instalar las dependencias necesarias:
```bash
pip install -r requirements.txt
```

## Estructura de Directorios requerida
Asegúrate de que exista una carpeta `model` con el modelo exportado, de lo contrario el endpoint POST `/predecir` devolverá error 503.
```text
microservicio-ia/
├── model/
│   └── modelo_riesgo.pkl
├── main.py
├── requirements.txt
└── README.md
```

## Ejecución

Para iniciar el servidor FastAPI localmente, ejecuta el siguiente comando:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servicio estará disponible en `http://localhost:8000`.

## Endpoints Disponibles

### `GET /health`
Verifica el estado del servicio.
**Respuesta exitosa:**
```json
{
  "status": "active",
  "message": "Microservicio IA funcionando correctamente"
}
```

### `POST /predecir`
Realiza una predicción del nivel de riesgo. Requiere el encabezado `X-API-Key`.
**Cuerpo de la petición (JSON)**: la información del estudiante hasta el momento de la predicción.
```json
{
  "promedio_notas": 60.0,
  "porcentaje_asistencia": 86.0,
  "areas_reprobadas": 2,
  "nivel": 4,
  "trimestre": 2
}
```
| Campo | Rango | Significado |
|---|---|---|
| `promedio_notas` | 0–100 | Promedio de las áreas (nota acumulada del año hasta el momento) |
| `porcentaje_asistencia` | 0–100 | (Presentes + Atrasos + Licencias) / días × 100, acumulado |
| `areas_reprobadas` | 0–13 | Áreas con nota acumulada menor a 51 |
| `nivel` | 1–6 | Curso de secundaria |
| `trimestre` | 1–3 | Trimestre en que se hace la predicción |

**Respuesta exitosa:**
```json
{
  "nivel_riesgo": "RIESGO_MEDIO",
  "probabilidad": 0.52
}
```

### Entrenamiento
`venv/Scripts/python.exe train_model.py` entrena un Árbol de Decisión (entropía) y un Random Forest con el dataset sintético (`dataset_sintetico/`, ver `docs/DATASET_SINTETICO.md`), compara su F1 macro con una partición 80/20 por estudiante y guarda el mejor en `model/modelo_riesgo.pkl`, con sus métricas en `model/metricas_modelo.json` y las reglas del árbol en `model/reglas_arbol_decision.txt`. Al iniciar, el servicio verifica que el modelo use exactamente estas 5 variables; si no, responde 503.
