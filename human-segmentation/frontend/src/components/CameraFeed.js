import React, { useRef, useEffect } from "react";
import "../styles/CameraFeed.css";

const CameraFeed = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  return (
    <div className="cam-container">
      <div>
        <h3>Live Camera Feed</h3>
        <video ref={videoRef} autoPlay playsInline className="video" />
      </div>
      <div>
        <h3>Live Segmentation</h3>
        <canvas ref={canvasRef} className="canvas" />
      </div>
    </div>
  );
};

export default CameraFeed;
