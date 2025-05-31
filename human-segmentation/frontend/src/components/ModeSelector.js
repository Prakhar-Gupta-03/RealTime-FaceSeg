import React from "react";
import "../styles/ModeSelector.css";

const ModeSelector = ({ setMode }) => {
  return (
    <div className="mode-selector">
      <h2>Select Segmentation Mode</h2>
      <div className="buttons">
        <button onClick={() => setMode("live")}>Live Segmentation</button>
        <button onClick={() => setMode("click")}>Click a Picture</button>
        <button onClick={() => setMode("upload")}>Upload an Image</button>
      </div>
    </div>
  );
};

export default ModeSelector;
