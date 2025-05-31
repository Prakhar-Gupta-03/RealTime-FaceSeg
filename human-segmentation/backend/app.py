from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import numpy as np
import onnxruntime as ort
import io
import base64
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://human-segmentation-backend.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load ONNX model
ort_session = ort.InferenceSession("model.onnx")

def preprocess(image: Image.Image):
    """Resize, center crop, normalize and prepare image for ONNX model."""
    try:
        # Resize so shorter side is 256 (maintain aspect ratio)
        aspect_ratio = image.width / image.height
        if image.width < image.height:
            new_width = 256
            new_height = int(new_width / aspect_ratio)
        else:
            new_height = 256
            new_width = int(new_height * aspect_ratio)
        image = image.resize((new_width, new_height))

        # Center crop to 256x256
        left = (image.width - 256) // 2
        top = (image.height - 256) // 2
        image = image.crop((left, top, left + 256, top + 256))

        # Convert to numpy [C, H, W] and normalize to [0,1]
        image_np = np.array(image).astype(np.float32) / 255.0  # [H, W, C]
        image_np = np.transpose(image_np, (2, 0, 1))            # [C, H, W]
        image_np = np.expand_dims(image_np, axis=0)             # [1, C, H, W]
        return image_np
    except Exception as e:
        raise ValueError(f"Error in preprocess(): {e}")

def postprocess(output):
    logits = output[0]  # shape: [1, 2, H, W] or [2, H, W]
    if logits.ndim == 4:
        logits = logits[0]  # Remove batch dim
    pred = np.argmax(logits, axis=0)  # shape: [H, W]
    binary_mask = (pred == 1).astype(np.uint8)
    return binary_mask

@app.get("/")
def root():
    return {"message": "Backend for Human Segmentation is running!"}

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    try:
        # Load image
        image_bytes = await file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # Preprocess and run ONNX model
        input_tensor = preprocess(image)  # shape: [1, 3, 256, 256]
        ort_inputs = {ort_session.get_inputs()[0].name: input_tensor}
        ort_outs = ort_session.run(None, ort_inputs)
        # Postprocess
        mask = postprocess(ort_outs)  # likely shape: (1, H, W) or (H, W)

        print("Mask shape before squeeze:", mask.shape)

        mask = np.squeeze(mask)                      # remove any size-1 dims
        print("Mask shape after squeeze:", mask.shape)

        if mask.ndim != 2:
            raise ValueError(f"Unexpected mask shape after squeeze: {mask.shape}")

        mask = (mask * 255).astype(np.uint8)         # Convert 0/1 → 0/255
        mask_img = Image.fromarray(mask)             # Create PIL grayscale image
  
        # Encode as PNG base64
        buffered = io.BytesIO()
        mask_img.save(buffered, format="PNG")
        mask_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return JSONResponse(content={
            "mask": mask_base64,
            "shape": mask.shape,
            "status": "success"
        })


    except Exception as e:
        traceback_str = traceback.format_exc()
        return JSONResponse(
            status_code=500,
            content={
                "error": str(e),
                "trace": traceback_str
            }
        )
