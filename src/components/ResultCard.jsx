const CATEGORY_INFO = {
  compost: { label: "Compost", icon: "🌱" },
  recycle: { label: "Recycle", icon: "♻️" },
  trash: { label: "Trash", icon: "🗑️" },
};

// Shows what Gemini decided about the item.
export default function ResultCard({ result }) {
  const info = CATEGORY_INFO[result.category] || CATEGORY_INFO.trash;

  return (
    <div className={`result ${result.category}`}>
      <div className="result-icon">{info.icon}</div>
      <h2>{info.label}</h2>
      <p className="result-item">{result.item}</p>
      <p>{result.reason}</p>
      {result.tip && <p className="result-tip">Tip: {result.tip}</p>}
    </div>
  );
}