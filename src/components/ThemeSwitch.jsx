import useTheme from '../hooks/useTheme.js';

export default function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  return (
    <label style={{ display:'inline-flex', gap:8, alignItems:'center' }}>
      Motyw:
      <select value={theme} onChange={e => setTheme(e.target.value)}>
        <option value="system">System</option>
        <option value="light">Jasny</option>
        <option value="dark">Ciemny</option>
      </select>
    </label>
  );
}
