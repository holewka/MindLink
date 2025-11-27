import { useEffect, useMemo, useRef, useState } from 'react';
import useAsyncState from '../hooks/useAsyncState.js';
import Loading from '../components/Loading.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';
import { listMoodsLocal } from '../services/storageLocal.js';
import { watchMoodsRemote, fetchMoodsOnce } from '../services/firebase.js';

const PREF_SOURCE_KEY = 'pref_source';
const HISTORY_KEY = 'mindlink_history';
const DAY_MS = 24 * 60 * 60 * 1000;


export default function History() {
  // skąd bierzemy dane: chmura / lokalnie
  const [source, setSource] = useState(
    () => localStorage.getItem(PREF_SOURCE_KEY) || 'cloud'
  );
  const { data, setData, loading, error, run, reset } = useAsyncState([]);

  // filtry
  const [emotion, setEmotion] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  // ref do odpinania nasłuchu Firestore
  const unsubscribeRef = useRef(null);

  // zapamiętujemy preferencję źródła
  useEffect(() => {
    localStorage.setItem(PREF_SOURCE_KEY, source);
  }, [source]);

  // przełączanie źródła: lokalnie vs chmura (live)
  useEffect(() => {
    // sprzątanie poprzedniego nasłuchu
    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch {}
      unsubscribeRef.current = null;
    }
    reset();

    if (source === 'local') {
      // snapshot z localStorage
      run(() => Promise.resolve(listMoodsLocal())).then((rows) =>
        setData(rows || [])
      );
      return;
    }

    // chmura (live) – pokazujemy spinner do pierwszego pakietu danych
    run(() => new Promise(() => {}));
    const unsub = watchMoodsRemote({
      onData: (docs) => {
        setData(docs || []);
        reset();
      },
      onError: () => {
        reset();
        run(Promise.reject(new Error('Błąd połączenia z chmurą.'))).catch(
          () => {}
        );
      },
    });
    unsubscribeRef.current = unsub;

    return () => {
      try {
        unsub && unsub();
      } catch {}
    };
  }, [source, run, reset]);

  // helper do spójnego timestampu
  function tsNum(v) {
    return typeof v === 'number' ? v : v?.toMillis?.() ?? 0;
  }

  // filtrowanie + sortowanie
  const filtered = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];
    return rows
      .filter((m) => {
        if (
          emotion !== 'all' &&
          (m.emotion || '').toLowerCase() !== emotion
        ) {
          return false;
        }
        const t = tsNum(m.ts);
        if (from && t < new Date(from).getTime()) return false;
        if (to && t > new Date(to).getTime() + DAY_MS - 1) return false;
        return true;
      })
      .sort((a, b) => tsNum(b.ts) - tsNum(a.ts));
  }, [data, emotion, from, to]);

  function toCSV(rows) {
    const headers = ['ts_iso', 'emotion', 'input', 'suggestionTitle'];
    const lines = [headers.join(',')];

    rows.forEach((r) => {
      const t = tsNum(r.ts);
      const line = [
        new Date(t).toISOString(),
        (r.emotion || '').replaceAll(',', ' '),
        (r.input || '').replaceAll('\n', ' ').replaceAll(',', ' '),
        (r.suggestion?.title || '').replaceAll(',', ' '),
      ].join(',');
      lines.push(line);
    });

    return lines.join('\n');
  }

  async function onExportCSV() {
    try {
      const rows = source === 'cloud' ? await fetchMoodsOnce() : filtered;
      const blob = new Blob([toCSV(rows)], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindlink_history.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Nie udało się wyeksportować CSV.');
    }
  }

  // JSON
  async function onExportJSON() {
    try {
      const rows = source === 'cloud' ? await fetchMoodsOnce() : filtered;
      const blob = new Blob([JSON.stringify(rows, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mindlink_history.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Nie udało się wyeksportować JSON.');
    }
  }

  // czyszczenie lokalnych danych (bezpośrednio z localStorage)
  function onClearLocal() {
    if (
      confirm(
        'Usunąć lokalną historię nastrojów? Tej operacji nie można cofnąć.'
      )
    ) {
      localStorage.removeItem(HISTORY_KEY);
      if (source === 'local') {
        setData([]);
      }
    }
  }

  // mapowanie emocji na klasy CSS
  function emotionKey(e) {
    switch ((e || '').toLowerCase()) {
      case 'smutek':
        return 'sad';
      case 'lęk':
        return 'fear';
      case 'złość':
        return 'anger';
      case 'spokój':
        return 'calm';
      case 'radość':
        return 'joy';
      default:
        return 'neutral';
    }
  }

  return (
    <div className="card">
      <h2>Historia nastrojów</h2>

      <div
        className="row"
        style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}
      >
        <label>
          Źródło:&nbsp;
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
          >
            <option value="cloud">Chmura (live)</option>
            <option value="local">Lokalnie (przeglądarka)</option>
          </select>
        </label>

        <label>
          Emocja:&nbsp;
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
          >
            <option value="all">Wszystkie</option>
            <option value="smutek">smutek</option>
            <option value="lęk">lęk</option>
            <option value="złość">złość</option>
            <option value="spokój">spokój</option>
            <option value="radość">radość</option>
          </select>
        </label>

        <label>
          Od:{' '}
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          Do:{' '}
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>

        <button className="btn" onClick={onExportCSV}>
          Eksport CSV
        </button>
        <button className="btn" onClick={onExportJSON}>
          Eksport JSON
        </button>
        <button className="btn" onClick={onClearLocal}>
          🧹 Wyczyść lokalne
        </button>
      </div>

      {loading && <Loading />}
      {error && <ErrorMsg message={error} />}

      {!loading && !error && (
        <ul className="list">
          {filtered.map((m, i) => {
            const t = tsNum(m.ts);
            const ek = emotionKey(m.emotion);

            return (
              <li
                key={m.id || i}
                className="card fade-in"
                style={{ padding: 12 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  {m.emotion && (
                    <span className={`emotion-pill emotion-${ek}`}>
                      {m.emotion}
                    </span>
                  )}
                  <strong>{new Date(t).toLocaleString()}</strong>
                </div>

                {m.input && <p style={{ marginTop: 4 }}>{m.input}</p>}

                {m.suggestion?.title && (
                  <p style={{ marginTop: 6 }}>
                    <em>Sugestia:</em> {m.suggestion.title}
                  </p>
                )}
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li>Brak wyników po zastosowanych filtrach.</li>
          )}
        </ul>
      )}
    </div>
  );
}

