import React, { useEffect, useRef, useState } from "react";
import BackButton from "./BackButton";
import "../styles/LiveSegmentation.css";

const LiveSegmentation = ({ onBack }) => {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const [streaming, setStreaming] = useState(false);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreaming(true);
        }
      } catch (err) {
        console.error("Camera error:", err);
      }
    };

    initCamera();

    return () => {
      // Stop camera stream on cleanup
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId;

    if (streaming) {
      intervalId = setInterval(() => {
        captureAndSegment();
      }, 100); // one prediction per second (adjust as needed)
    }

    return () => clearInterval(intervalId);
  }, [streaming]);

  const captureAndSegment = async () => {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 256, 256);

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "frame.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("http://localhost:8000/predict/", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        const maskImg = new Image();
        maskImg.src = `data:image/png;base64,${data.mask}`;
        maskImg.onload = () => {
          if (!overlayRef.current) return;

          const overlayCanvas = overlayRef.current;
          const overlayCtx = overlayCanvas.getContext("2d");

          // Draw original video frame
          overlayCtx.clearRect(0, 0, 256, 256);
          overlayCtx.globalAlpha = 1.0;
          overlayCtx.drawImage(canvas, 0, 0);

          // Create a colored version of the mask
          const tempCanvas = document.createElement("canvas");
          tempCanvas.width = 256;
          tempCanvas.height = 256;
          const tempCtx = tempCanvas.getContext("2d");

          // Draw the grayscale mask
          tempCtx.drawImage(maskImg, 0, 0);
          const maskData = tempCtx.getImageData(0, 0, 256, 256);
          const data = maskData.data;

          // Recolor mask pixels to magenta (or another color)
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i]; // grayscale value (R=G=B), use as alpha
            data[i] = 255;     // R
            data[i + 1] = 0;   // G
            data[i + 2] = 0; // B
            data[i + 3] = alpha; // use grayscale value as alpha
          }

          tempCtx.putImageData(maskData, 0, 0);

          // Blur mask before overlaying
          overlayCtx.globalAlpha = 0.6;
          overlayCtx.filter = "blur(2px)";
          overlayCtx.drawImage(tempCanvas, 0, 0);
          overlayCtx.filter = "none"; // reset filter
        };
      } catch (err) {
        console.error("Segmentation error:", err);
      }
    }, "image/png");
  };

  return (
    <div
      className="live-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 0",
      }}
    >
      <div style={{ width: "100%", textAlign: "center" }}>
        <h3>Live Camera Segmentation</h3>
        <video ref={videoRef} autoPlay playsInline width={256} height={256} className="video" />
        <canvas ref={overlayRef} width={256} height={256} className="canvas" />
      </div>
      {/* BackButton just below the boxes */}
      <div style={{ marginTop: 1, display: "flex", justifyContent: "center" }}>
        <BackButton onClick={onBack} />
      </div>
    </div>
  );
};

export default LiveSegmentation;
