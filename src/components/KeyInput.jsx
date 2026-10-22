import { useState } from "react";

// Settings panel: demo mode toggle and the user's own Gemini key.
export default function KeyInput({ apiKey, onSave, demoMode, onDemoChange }) {
  const [draft, setDraft] = useState("");

  function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setDraft("");
  }

  return (
    <details className="settings">
      <summary>Settings</summary>

      <label className="demo-toggle">
        <input
          type="checkbox"
          checked={demoMode}
          onChange={(e) => onDemoChange(e.target.checked)}
        />
        Demo mode (sample answers, no key needed)
      </label>

      {apiKey ? (
        <p>
          Key saved in this browser.{" "}
          <button type="button" onClick={() => onSave("")}>
            Remove key
          </button>
        </p>
      ) : (
        <div className="key-row">
          <input
            type="password"
            placeholder="Paste your Gemini API key"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="button" onClick={handleSave}>
            Save
          </button>
        </div>
      )}

      <p className="note">
        Your key is stored only in this browser and is sent only to Google's
        Gemini API. It is never saved in this project's code.
      </p>
    </details>
  );
}