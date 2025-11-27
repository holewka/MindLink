import { useEffect, useState } from 'react';
import useAsyncState from '../hooks/useAsyncState.js';
import Loading from '../components/Loading.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';
import { loadProfile, saveProfile } from '../services/firebase.js';

const prefs = {
  get() {
    try {
      return JSON.parse(localStorage.getItem('prefs') || '{}');
    } catch {
      return {};
    }
  },
  set(p) {
    const cur = prefs.get();
    localStorage.setItem('prefs', JSON.stringify({ ...cur, ...p }));
  },
};

export default function Settings() {
  const [displayName, setDisplayName] = useState('');
  const [trustedContact, setTrustedContact] = useState('');
  const [defaultSource, setDefaultSource] = useState('cloud');

  const load = useAsyncState();
  const save = useAsyncState();

  useEffect(() => {
    let cancelled = false;

    load.run(() => loadProfile()).then((profile) => {
      if (cancelled) return;

      const p = prefs.get();
      if (p.defaultSource) setDefaultSource(p.defaultSource);

      if (profile) {
        setDisplayName(profile.displayName || '');
        setTrustedContact(profile.trustedContact || '');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []); 

  function savePrefs() {
    prefs.set({ defaultSource });
    localStorage.setItem('pref_source', defaultSource);
    alert('Preferencje zapisane lokalnie.');
  }

  function saveProfileCloud() {
    save
      .run(() => saveProfile({ displayName, trustedContact }))
      .then(() => alert('Profil zapisany w chmurze.'));
  }

  return (
    <div className="card">
      <h2>Ustawienia</h2>

      {load.loading && <Loading />}
      {load.error && <ErrorMsg message={load.error} />}

      {!load.loading && !load.error && (
        <>
          <section className="card" style={{ padding: 12, marginBottom: 12 }}>
            <h3>Profil (chmura)</h3>
            <label style={{ display: 'block', marginTop: 8 }}>
              Wyświetlana nazwa:
              <br />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </label>
            <label style={{ display: 'block', marginTop: 8 }}>
              Kontakt zaufany (tel / imię):
              <br />
              <input
                value={trustedContact}
                onChange={(e) => setTrustedContact(e.target.value)}
              />
            </label>
            <button
              className="btn"
              style={{ marginTop: 8 }}
              onClick={saveProfileCloud}
              disabled={save.loading}
            >
              {save.loading ? 'Zapisywanie…' : 'Zapisz profil'}
            </button>
            {save.error && <ErrorMsg message={save.error} />}
          </section>

          <section className="card" style={{ padding: 12 }}>
            <h3>Preferencje (lokalnie)</h3>
            <label style={{ display: 'block', marginTop: 8 }}>
              Domyślne źródło danych:&nbsp;
              <select
                value={defaultSource}
                onChange={(e) => setDefaultSource(e.target.value)}
              >
                <option value="cloud">Chmura (live)</option>
                <option value="local">Lokalnie (przeglądarka)</option>
              </select>
            </label>
            <button
              className="btn"
              style={{ marginTop: 8 }}
              onClick={savePrefs}
            >
              Zapisz preferencje
            </button>
          </section>

          <p style={{ marginTop: 12, fontSize: 12, opacity: 0.8 }}>
            Uwaga: MindLink nie zastępuje opieki medycznej/psychologicznej. W
            sytuacji zagrożenia zadzwoń 112 lub skontaktuj się z 116 123.
          </p>
        </>
      )}
    </div>
  );
}

