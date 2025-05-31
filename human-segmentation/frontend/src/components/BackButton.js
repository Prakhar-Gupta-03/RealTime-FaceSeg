const BackButton = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      marginTop: "20px",
      padding: "10px 20px",
      fontSize: "16px",
      cursor: "pointer",
      backgroundColor: "#007BFF",
      color: "white",
      border: "none",
      borderRadius: "8px",
    }}
  >
    Back to Home
  </button>
);

export default BackButton;
