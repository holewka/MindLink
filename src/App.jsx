import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import './styles.css';
import Result from './pages/Result.jsx';
import History from './pages/History.jsx';
import Settings from './pages/Settings.jsx';
import Insights from './pages/Insights.jsx';     
import ThemeSwitch from './components/ThemeSwitch.jsx'; 

export default function App() {
  return (
    <div>
      {/* GÓRNY PASEK / NAVBAR */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="logo">MindLink</span>
          <nav className="nav">
            <Link to="/">Start</Link>
            <Link to="/history">Historia</Link>
            <Link to="/insights">Insights</Link>   
            <Link to="/settings">Ustawienia</Link>
          </nav>
        </div>

        <div className="topbar-right">
          <ThemeSwitch /> 
        </div>
      </header>

      
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/result" element={<Result />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/insights" element={<Insights />} /> 
        </Routes>
      </main>
    </div>
  );
}
