import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { analyze } from "../services/recommendations";

export default function Home() {
  const [text, setText] = useState("");
  const navigate = useNavigate();

  function onAnalyze() {
    const { topEmotion, suggestions } = analyze(text, { count: 5 });
    const suggestion = suggestions?.[0] ?? null;

    navigate("/result", {
      state: {
        emotion: topEmotion,
        suggestion,
        suggestions,
        input: text,
        ts: Date.now(),
      },
    });
  }

  return (
    <div className="card">
      <h2>Jak się dziś czujesz?</h2>

      <textarea
        className="input"
        rows={5}
        placeholder="Napisz 1–2 zdania..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div style={{ marginTop: 12 }}>
        <button
          className="btn primary"
          onClick={onAnalyze}
          disabled={!text.trim()}
        >
          Analizuj nastrój
        </button>
      </div>
    </div>
  );
}


