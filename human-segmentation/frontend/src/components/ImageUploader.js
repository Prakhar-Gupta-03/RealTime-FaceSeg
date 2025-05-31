import React, { useState } from "react";
import axios from "axios";
import { overlayMask } from "../utils/overlayUtils";
import BackButton from "./BackButton";

function ImageUploader({ onBack }) {
  const [imageDataURL, setImageDataURL] = useState(null);      // original (left)
  const [resultDataURL, setResultDataURL] = useState(null);    // overlay (right)
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;
      setImageDataURL(base64Image);

      const formData = new FormData();
      formData.append("file", file);

      try {
        setLoading(true);
        const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
        const res = await axios.post(`${API_URL}/predict/`, formData);
        const { mask } = res.data;

        const overlayed = await overlayMask(base64Image, mask);
        setResultDataURL(overlayed);
      } catch (err) {
        console.error("Prediction error:", err);
        alert("Prediction failed. Check backend or CORS.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="upload-container" style={{ textAlign: "center", padding: "20px" }}>
      <h2>Human Segmentation</h2>
      <input type="file" accept="image/*" onChange={handleImageUpload} />
      {loading && <p>Processing...</p>}

      <div style={{ display: "flex", justifyContent: "center", marginTop: "20px", gap: "40px" }}>
        {imageDataURL && (
          <div>
            <h3>Original Image</h3>
            <img src={imageDataURL} alt="Original" style={{ width: 256, height: 256, objectFit: "cover", border: "1px solid #ccc" }} />
          </div>
        )}
        {resultDataURL && (
          <div>
            <h3>Overlay Result</h3>
            <img src={resultDataURL} alt="Overlay" style={{ width: 256, height: 256, objectFit: "cover", border: "1px solid #ccc" }} />
          </div>
        )}
      </div>

      {/* Move BackButton here */}
      <BackButton onClick={onBack} />
    </div>
  );
}

export default ImageUploader;
