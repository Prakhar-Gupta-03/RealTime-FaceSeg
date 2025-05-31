import React, { useRef, useState, useEffect } from "react";
import BackButton from "./BackButton";
import "../styles/ImageCapture.css";

const ImageCapture = ({ onBack }) => {
  const videoRef = useRef(null);
  const [original, setOriginal] = useState(null);
  const [overlay, setOverlay] = useState(null);

  // Start camera on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    initCamera();
  }, []);

  const captureAndSegment = async () => {
    const video = videoRef.current;

    // Draw current frame to an offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, 256, 256);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "capture.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);
      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
      const res = await fetch(`${API_URL}/predict/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      const mask = new Image();
      mask.src = `data:image/png;base64,${data.mask}`;

      // Create overlay once both are loaded
      mask.onload = () => {
        const overlayCanvas = document.createElement("canvas");
        overlayCanvas.width = 256;
        overlayCanvas.height = 256;
        const overlayCtx = overlayCanvas.getContext("2d");

        // Draw the original image
        overlayCtx.clearRect(0, 0, 256, 256);
        overlayCtx.globalAlpha = 1.0;
        overlayCtx.drawImage(canvas, 0, 0);

        // Create a colored version of the mask
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = 256;
        tempCanvas.height = 256;
        const tempCtx = tempCanvas.getContext("2d");

        tempCtx.drawImage(mask, 0, 0);
        const maskData = tempCtx.getImageData(0, 0, 256, 256);
        const data = maskData.data;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i]; // grayscale as alpha
          data[i] = 255;     // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0; // B
          data[i + 3] = alpha; // A
        }

        tempCtx.putImageData(maskData, 0, 0);

        // Apply blur and draw onto overlay
        overlayCtx.globalAlpha = 0.6;
        overlayCtx.filter = "blur(2px)";
        overlayCtx.drawImage(tempCanvas, 0, 0);
        overlayCtx.filter = "none";

        // Update state with result
        setOriginal(canvas.toDataURL());
        setOverlay(overlayCanvas.toDataURL());
      };
    }, "image/png");
  };

  return (
    <div
      className="cam-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        justifyContent: "flex-start",
        padding: "24px 0",
      }}
    >
      <div>
        <h3>Live Camera</h3>
        <video ref={videoRef} autoPlay playsInline width={256} height={256} className="video" />
        <br />
        <button onClick={captureAndSegment}>📸 Capture & Segment</button>
      </div>
      <div style={{ marginTop: 24 }}>
        <h3>Result</h3>
        {original && <img src={original} alt="original" />}
        {overlay && <img src={overlay} alt="segmented" />}
      </div>
      {/* Center BackButton at the bottom */}
      <div style={{ marginTop: 32, display: "flex", justifyContent: "center", width: "100%" }}>
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
};

export default ImageCapture;
