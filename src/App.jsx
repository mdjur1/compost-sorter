import { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import ResultCard from "./components/ResultCard";
import KeyInput from "./components/KeyInput";
import { classifyImage, demoClassify } from "./services/geminiService";

const KEY_STORAGE = "compost-sorter-gemini-key";

// Storage can fail in private windows, so every access is wrapped
function loadKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export default function App() {
  const [apiKey, setApiKey] = useState(loadKey);
  const [demoMode, setDemoMode] = useState(() => !loadKey());
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetCount, setResetCount] = useState(0);

  function saveKey(key) {
    setApiKey(key);
    try {
      if (key) localStorage.setItem(KEY_STORAGE, key);
      else localStorage.removeItem(KEY_STORAGE);
    } catch {
      // ignore: the key just won't persist after a refresh
    }
    if (key) setDemoMode(false);
  }

  function handleSelect(selectedFile) {
    setFile(selectedFile);
    setResult(null);
    setError("");
  }

   function handleReset() {
    setFile(null);
    setResult(null);
    setError("");
    setResetCount((count) => count + 1);
  }

  async function handleSort() {
    if (!file) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const answer = demoMode
        ? await demoClassify()
        : await classifyImage(file, apiKey);
      setResult(answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="app">
      <h1>Compost Sorter</h1>
      <p className="subtitle">
        Snap a photo of an item and find out if it goes in compost, recycling,
        or trash.
      </p>

       <ImageUpload key={resetCount} onSelect={handleSelect} disabled={loading} />

      <button
        type="button"
        className="sort-button"
        onClick={handleSort}
        disabled={!file || loading}
      >
        {loading ? "Sorting..." : "Sort it"}
      </button>

      {demoMode && (
        <p className="note">
          Demo mode is on, so you'll see a sample answer, not an analysis of
          your photo. Add a Gemini key in Settings for real results.
        </p>
      )}

      {error && <p className="error">{error}</p>}
      {result && <ResultCard result={result} />}
        {(result || error) && (
        <button type="button" className="reset-button" onClick={handleReset}>
          Try another
        </button>
      )}

      <KeyInput
        apiKey={apiKey}
        onSave={saveKey}
        demoMode={demoMode}
        onDemoChange={setDemoMode}
      />
    </main>
  );
}