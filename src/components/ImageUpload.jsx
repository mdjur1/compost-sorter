import { useState, useEffect } from "react";

// Lets the user pick or take a photo, shows a preview,
// and tells the parent which file was chosen.
export default function ImageUpload({ onSelect, disabled }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  // Free the preview's memory when it changes or the component goes away
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    onSelect(file);
  }

  return (
    <div className="upload">
      <label className={`upload-button ${disabled ? "disabled" : ""}`}>
        {previewUrl ? "Choose a different photo" : "Take or choose a photo"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleChange}
          disabled={disabled}
          hidden
        />
      </label>
      {previewUrl && (
        <img className="preview" src={previewUrl} alt="The item you chose" />
      )}
    </div>
  );
}