// src/components/ErrorMsg.jsx
export default function ErrorMsg({ message }) {
  if (!message) return null;
  return <p className="error">❌ {message}</p>;
}
