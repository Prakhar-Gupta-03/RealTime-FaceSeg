// src/App.js
import React, { useState } from "react";
import ModeSelector from "./components/ModeSelector";
import CameraFeed from "./components/CameraFeed";
import ImageCapture from "./components/ImageCapture";
import LiveSegmentation from "./components/LiveSegmentation";
import ImageUploader from "./components/ImageUploader";
import "./styles/App.css";

function App() {
  const [mode, setMode] = useState(null); // null = home

  const handleBack = () => setMode(null);

  const renderContent = () => {
    switch (mode) {
      case "upload":
        return <ImageUploader onBack={handleBack} />;
      case "click":
        return <ImageCapture onBack={handleBack} />;
      case "live":
        return <LiveSegmentation onBack={handleBack} />;
      default:
        return (
          <div className="home-container">
            <h2>Select Segmentation Mode</h2>
            <button onClick={() => setMode("live")}>Real-Time Camera Segmentation</button>
            <button onClick={() => setMode("click")}>Click Photo for Segmentation</button>
            <button onClick={() => setMode("upload")}>Upload Image for Segmentation</button>
          </div>
        );
    }
  };

  return <div className="App">{renderContent()}</div>;
}

export default App;