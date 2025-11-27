// Agregacje tygodniowe i proste metryki z historii
export function groupByDay(rows) {
  const by = {};
  rows.forEach(r => {
    const ts = typeof r.ts === 'number' ? r.ts : r.ts?.toMillis?.() ?? 0;
    const d = new Date(ts);
    const key = d.toISOString().slice(0,10); // YYYY-MM-DD
    (by[key] ||= []).push(r);
  });
  return by;
}

export function scoreFromEmotion(e) {
  // prosty mapping do wykresu (spokój/radość > 0, smutek/lęk/złość < 0)
  const k = (e || '').toLowerCase();
  if (k === 'radość' || k === 'spokój') return 2;
  if (k === 'smutek') return -2;
  if (k === 'lęk') return -1;
  if (k === 'złość') return -1;
  return 0;
}

export function dailyAverageScore(rows) {
  const by = groupByDay(rows);
  const days = Object.keys(by).sort();
  return days.map(day => {
    const list = by[day];
    const s = list.reduce((acc, r) => acc + scoreFromEmotion(r.emotion), 0);
    return { day, score: s / list.length };
  });
}

export function last7DaysStats(rows) {
  const now = new Date();
  const from = new Date(now.getTime() - 6*24*60*60*1000); // 7 dni łącznie
  const filt = rows.filter(r => {
    const ts = typeof r.ts === 'number' ? r.ts : r.ts?.toMillis?.() ?? 0;
    return ts >= new Date(from.toDateString()).getTime();
  });
  const byE = {};
  for (const r of filt) {
    const k = (r.emotion || 'inne').toLowerCase();
    byE[k] = (byE[k] || 0) + 1;
  }
  const total = filt.length || 1;
  const top = Object.entries(byE).sort((a,b)=>b[1]-a[1])[0] || ['brak', 0];
  return {
    total,
    topEmotion: top[0],
    topEmotionPct: Math.round((top[1]/total)*100),
  };
}
