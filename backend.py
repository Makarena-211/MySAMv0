from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pickle
import numpy as np
import lightgbm as lgb

app = FastAPI()

# Load the model
try:
    # Load the model using pickle
    with open('lgbm_model.pkl', 'rb') as file:
        model = pickle.load(file)
except Exception as e:
    print(f"Error loading model: {e}")
    model = None

class WineFeatures(BaseModel):
    fixed_acidity: float = Field(..., ge=7, le=8)
    volatile_acidity: float = Field(..., ge=0.4, le=0.7)
    citric_acid: float = Field(..., ge=0.0, le=0.1)
    residual_sugar: float = Field(..., ge=1, le=2.5)
    chlorides: float = Field(..., ge=0.085, le=0.15)
    free_sulfur_dioxide: float = Field(..., ge=0, le=15)
    total_sulfur_dioxide: float = Field(..., ge=0, le=30)
    density: float = Field(..., ge=0.996, le=0.998)
    pH: float = Field(..., ge=3.2, le=3.4)
    sulphates: float = Field(..., ge=0.50, le=0.75)
    alcohol: float = Field(..., ge=9, le=10)

@app.post("/predict-quality")
async def predict_quality(wine: WineFeatures):
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
        
    try:
        # Convert the input to a pandas DataFrame-like structure
        feature_names = [
            'fixed_acidity', 'volatile_acidity', 'citric_acid',
            'residual_sugar', 'chlorides', 'free_sulfur_dioxide',
            'total_sulfur_dioxide', 'density', 'pH', 'sulphates', 'alcohol'
        ]
        
        # Create the features array
        features = np.array([
            wine.fixed_acidity,
            wine.volatile_acidity,
            wine.citric_acid,
            wine.residual_sugar,
            wine.chlorides,
            wine.free_sulfur_dioxide,
            wine.total_sulfur_dioxide,
            wine.density,
            wine.pH,
            wine.sulphates,
            wine.alcohol
        ]).reshape(1, -1)

        # Use model's predict method
        try:
            prediction = float(model.predict(features)[0])
            # Ensure prediction is within the valid range of 5-6
            final_prediction = max(5, min(6, round(prediction)))
            return {"quality": final_prediction}
        except AttributeError:
            # If predict doesn't work, try using model directly
            prediction = float(model(features)[0])
            final_prediction = max(5, min(6, round(prediction)))
            return {"quality": final_prediction}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

# Add a diagnostic endpoint
@app.get("/model-info")
async def model_info():
    if model is None:
        return {"status": "Model not loaded"}
    return {
        "status": "Model loaded",
        "model_type": str(type(model)),
        "model_attributes": dir(model)
    }