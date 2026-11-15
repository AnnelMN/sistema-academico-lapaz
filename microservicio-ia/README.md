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
Realiza una predicción del nivel de riesgo.
**Cuerpo de la petición (JSON):**
```json
{
  "attendance_percentage": 85.0,
  "total_score": 60.5,
  "class_participation": 5.0,
  "weekly_self_study_hours": 10.0
}
```
**Respuesta exitosa:**
```json
{
  "nivel_riesgo": "SIN_RIESGO",
  "probabilidad": 0.92
}
```
