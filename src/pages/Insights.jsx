import { useEffect } from 'react';
import useAsyncState from '../hooks/useAsyncState.js';
import Loading from '../components/Loading.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';
import Sparkline from '../components/Sparkline.jsx';
import { fetchMoodsOnce } from '../services/firebase.js';
import { dailyAverageScore, last7DaysStats } from '../utils/insights.js';

export default function Insights() {
  const { data: rows, loading, error, run } = useAsyncState([]);

  useEffect(() => { run(() => fetchMoodsOnce()); }, [run]);

  if (loading) return <Loading />;
  if (error) return <ErrorMsg message={error} />;

  const series = dailyAverageScore(rows);
  const stats = last7DaysStats(rows);

  return (
    <div className="card">
      <h2>Insights</h2>
      <div className="card" style={{ padding:12, marginTop:8 }}>
        <h3>Średni „nastrój” dzienny</h3>
        <Sparkline data={series} />
        <div style={{ marginTop:8, opacity:.8, fontSize:13 }}>
          Ostatnich {series.length} dni. Linia pozioma = 0 (neutralnie).
        </div>
      </div>

      <div className="card" style={{ padding:12, marginTop:8 }}>
        <h3>Ostatnie 7 dni</h3>
        <p>Wpisów: <strong>{stats.total}</strong></p>
        <p>Najczęstsza emocja: <strong>{stats.topEmotion}</strong> ({stats.topEmotionPct}%)</p>
      </div>
    </div>
  );
}
