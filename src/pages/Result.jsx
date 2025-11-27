// src/pages/Result.jsx
// --------------------
// Wyświetla wynik analizy nastroju, zapisuje lokalnie i w chmurze,
// oraz umożliwia feedback (👍 / 👎). Używa useAsyncState + Loading/ErrorMsg.

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAsyncState from '../hooks/useAsyncState.js';
import Loading from '../components/Loading.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';
import { saveMoodLocal } from '../services/storageLocal.js';
import { saveMoodRemote, saveSuggestionFeedback } from '../services/firebase.js';
import { pickQuote } from '../data/quotes.js';

export default function Result() {
  const { state } = useLocation();
  const navigate = useNavigate();
  // osobny stan dla feedbacku
  const feedback = useAsyncState(null);

  // zapis wyniku (lokalnie + chmura) po wejściu na stronę
  useEffect(() => {
    if (!state) return;
    const entry = {
      input: state.input || '',
      emotion: state.emotion || '',
      intensity: state.intensity ?? 0,
      suggestion: state.suggestions?.[0] || null,
      ts: state.ts || Date.now(),
    };
    saveMoodLocal(entry);
    saveMoodRemote(entry).catch(() => {});
  }, [state]);

  // brak state → np. wejście bezpośrednio na /result
  if (!state) {
    return (
      <div className="card">
        <p>Brak danych wyniku.</p>
        <button className="btn" onClick={() => navigate('/')}>Wróć</button>
      </div>
    );
  }

  const first = state.suggestions?.[0] || null;
  const rest = (state.suggestions || []).slice(1);
  // tutaj pobieramy pełny obiekt { text, type }
  const q = pickQuote(state.emotion, true);
  const [extraIndex, setExtraIndex] = useState(null); // który „inny” jest pokazywany
  const extra = extraIndex == null ? null : rest[extraIndex]; // aktualna dodatkowa



  async function onFeedback(vote, suggestionOverride) {
  const target = suggestionOverride || first;
  if (!target) return;

  await feedback.run(
    () =>
      saveSuggestionFeedback({
        suggestionId: target.id,
        title: target.title,
        emotion: state.emotion,
        ts: Date.now(),
        vote,
      }),
    {
      onSuccess: () => feedback.setData('ok'),
    }
  );
}
   function onShowAnother() {
  if (!rest.length) return;

  setExtraIndex(prev => {
    if (prev == null) return 0; // pierwsze kliknięcie – pokaż pierwszą z „rest”
    const next = prev + 1;
    // możesz cyklicznie albo zatrzymać się na końcu
    return next >= rest.length ? 0 : next; // cykl po liście
    // jeśli wolisz zatrzymać na końcu:
    // return next >= rest.length ? prev : next;
  });
}



  return (
    <div className="card">
      <h2>Twój wynik</h2>

      <div className="badge">
        {state.emotion} {state.intensity ? `• intensywność ${state.intensity}/3` : ''}
      </div>

      {first && (
        <div className="card fade-in" style={{ marginTop: 12, padding: 12 }}>
          <div className="badge">
            {first.category} • {first.durationMin} min
          </div>
          <strong>{first.title}</strong>
          <p style={{ margin: '6px 0 0' }}>{first.detail}</p>

          {/* Cytat/porada zależna od emocji */}
          <p
            className="fade-in"
            style={{
              marginTop: 10,
              fontStyle: 'italic',
              opacity: 0.9,
              color:
                q.type === 'quote'
                  ? '#444'
                  : q.type === 'tip'
                  ? '#004aad'
                  : '#0a6400',
            }}
          >
            💬 {q.text}
          </p>

          {/* stany akcji feedback */}
          {feedback.loading && <Loading text="Wysyłanie opinii…" />}
          {feedback.error && <ErrorMsg message={feedback.error} />}

          {/* przyciski feedback */}
          {!feedback.loading && !feedback.error && (
            <div style={{ marginTop: 8 }}>
              <button
                className="btn"
                onClick={() => onFeedback('up')}
                disabled={feedback.loading}
              >
                Pomogło 👍
              </button>
              <button
                className="btn"
                onClick={() => onFeedback('down')}
                disabled={feedback.loading}
                style={{ marginLeft: 8 }}
              >
                Meh 👎
              </button>
              {feedback.data === 'ok' && (
                <span style={{ marginLeft: 8 }}>Dziękujemy za opinię!</span>
              )}
            </div>
          )}
        </div>
      )}

     {/* Inne rekomendacje – tylko jedna na raz */}
{rest.length > 0 && (
  <div style={{ marginTop: 16 }}>
    <h3>Inne rekomendacje</h3>

    {extra && (
      <div className="card fade-in" style={{ padding: 12, marginTop: 8 }}>
        <div className="badge">
          {extra.category} • {extra.durationMin} min
        </div>
        <strong style={{ display: 'block', marginTop: 4 }}>{extra.title}</strong>
        <p style={{ margin: '6px 0 0' }}>{extra.detail}</p>

        <div
          style={{
            marginTop: 8,
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <button
            className="btn"
            disabled={feedback.loading}
            onClick={() => onFeedback('up', extra)}
          >
            Pomogło 👍
          </button>
          <button
            className="btn"
            disabled={feedback.loading}
            onClick={() => onFeedback('down', extra)}
          >
            Meh 👎
          </button>
        </div>
      </div>
    )}

    <button
      className="btn"
      style={{ marginTop: 8 }}
      onClick={onShowAnother}
      disabled={rest.length === 0}
    >
      {extra ? 'Pokaż inną rekomendację' : 'Pokaż dodatkową rekomendację'}
    </button>
  </div>
)}

      <div style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => navigate('/')}>Nowa analiza</button>
        <button
          className="btn"
          onClick={() => navigate('/history')}
          style={{ marginLeft: 8 }}
        >
          Zobacz historię
        </button>
      </div>
    </div>
  );
}

