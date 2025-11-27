// src/hooks/useAsyncState.js
// --------------------------
// Uniwersalny hook do obsługi stanów: loading / error / data + uruchamianie asynchronicznych akcji.
// Zastosowanie:
//   const { data, loading, error, run, setData, reset } = useAsyncState(initData)
//   useEffect(() => { run(() => fetchMoodsOnce()) }, [])
//
// Funkcje:
//  - run(task, {onSuccess, onError, silent}) – uruchamia async (Promise lub funkcję zwracającą Promise)
//  - setData(...) – ręczne ustawienie danych (np. po lokalnych zmianach)
//  - reset() – czyści błąd i przywraca loading=false dla obecnych danych
//
// Bezpieczny względem odmontowania komponentu (ignoreAfterUnmount).

import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsyncState(initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const alive = useRef(true);

  // Po odmontowaniu wstrzymujemy setState
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const safeSet = useCallback((fn) => {
    if (!alive.current) return;
    fn();
  }, []);

  // task: Promise LUB () => Promise
  const run = useCallback(async (task, opts = {}) => {
    const { onSuccess, onError, silent = false } = opts;
    if (!silent) safeSet(() => setLoading(true));
    safeSet(() => setError(null));

    try {
      const promise = typeof task === 'function' ? task() : task;
      const result = await promise;
      safeSet(() => setData(result));
      if (onSuccess) onSuccess(result);
      return result;
    } catch (e) {
      const msg = e?.message || 'Wystąpił błąd.';
      safeSet(() => setError(msg));
      if (onError) onError(e);
      throw e;
    } finally {
      if (!silent) safeSet(() => setLoading(false));
    }
  }, [safeSet]);

  const reset = useCallback(() => {
    safeSet(() => {
      setError(null);
      setLoading(false);
    });
  }, [safeSet]);

  return { data, setData, loading, error, run, reset };
}
