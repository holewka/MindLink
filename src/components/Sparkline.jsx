export default function Sparkline({ data, width=320, height=80, strokeWidth=2 }) {
  if (!data || data.length === 0) return <div style={{opacity:.6}}>Brak danych do wykresu</div>;
  const xs = data.map((_, i) => i);
  const ys = data.map(p => p.score);
  const min = Math.min(...ys, -2);
  const max = Math.max(...ys, 2);
  const pad = 6;
  const sx = (width - pad*2) / (xs.length - 1 || 1);
  const sy = (height - pad*2) / ((max - min) || 1);
  const toX = i => pad + i*sx;
  const toY = v => pad + (max - v)*sy;

  const d = ys.map((y,i) => `${i===0?'M':'L'}${toX(i)},${toY(y)}`).join(' ');
  return (
    <svg width={width} height={height} style={{ display:'block' }}>
      <polyline fill="none" stroke="#2d6af5" strokeWidth={strokeWidth}
        points={ys.map((y,i)=>`${toX(i)},${toY(y)}`).join(' ')} />
      {/* oś 0 */}
      <line x1={pad} x2={width-pad} y1={toY(0)} y2={toY(0)} stroke="#999" strokeDasharray="4 4"/>
    </svg>
  );
}
