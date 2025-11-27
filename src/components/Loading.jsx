// src/components/Loading.jsx
export default function Loading({ text = 'Ładowanie…' }) {
  return <p className="loading">⏳ {text}</p>;
}
