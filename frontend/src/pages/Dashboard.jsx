import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { History, Target, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get('/attempts/history');
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history");
      }
    };
    fetchHistory();
  }, []);

  const startTest = async () => {
    try {
      const res = await axios.post('/attempts/start', { test_id: 1 });
      navigate(`/exam/${res.data.attempt_id}`);
    } catch (err) {
      toast.error('Could not start test. Check backend.');
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h2>Welcome, {user.name}</h2>
        <button onClick={logout} className="btn-danger" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', color: '#fff', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 30 }}>
        {/* Main Test Panel */}
        <div className="glass-panel" style={{ padding: 40, textAlign: 'center', height: 'fit-content' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>KEAM Mock Test 1</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
            3 Subjects • Physics, Chemistry, Maths • 180 Minutes <br />
            Marking Scheme: +4 Correct, -1 Incorrect
          </p>
          <button onClick={startTest} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px', width: '100%' }}>
            START EXAM NOW
          </button>
        </div>

        {/* History Panel */}
        <div>
          <h3 style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}><History size={24} color="var(--accent)"/> Past Attempts History</h3>
          
          {history.length === 0 ? (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center', color: 'var(--text-secondary)' }}>
              No past attempts found. Take your first test!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {history.map(att => (
                <div key={att.attempt_id} className="glass-panel" style={{ padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {att.test_title} <span style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(59,130,246,0.1)', borderRadius: 12, color: 'var(--accent)' }}>Completed</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(att.completed_at).toLocaleDateString()}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={14} /> Score: {att.score} ({att.accuracy}%)</span>
                    </div>
                  </div>
                  <div>
                    <Link to={`/result/${att.attempt_id}`} className="btn-primary" style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)', textDecoration: 'none' }}>
                      View Analysis
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
