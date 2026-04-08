import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Target, AlertTriangle, Lightbulb, Clock } from 'lucide-react';

export default function Result() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get(`/attempts/${id}/results`);
        setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchResults();
  }, [id]);

  if (!data) return <div className="container">Loading Analytics...</div>;

  // Identify weak subject
  let weakSubject = null;
  if (data.subject_stats && data.subject_stats.length > 0) {
    weakSubject = data.subject_stats.reduce((prev, curr) => 
      parseFloat(prev.accuracy) < parseFloat(curr.accuracy) ? prev : curr
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h2>Performance Analytics</h2>
        <Link to={`/review/${id}`} className="btn-primary">View Detailed Review</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        <div className="glass-panel" style={{ padding: 30, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Total Score</div>
          <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--accent)' }}>{data.score}</div>
          <div style={{ color: 'var(--success)', marginTop: 8 }}>+4 / -1 Marking</div>
        </div>
        
        <div className="glass-panel" style={{ padding: 30, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Accuracy</div>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>{data.accuracy}%</div>
          <div style={{ color: 'var(--warning)', marginTop: 8 }}>{data.correct} Correct / {data.attempted} Attempted</div>
        </div>

        <div className="glass-panel" style={{ padding: 30, textAlign: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>Efficiency</div>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>{data.efficiency}%</div>
          <div style={{ color: 'var(--text-disabled)', marginTop: 8 }}>Overall performance against total</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 24 }}>Advanced Insights</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 40 }}>
        <div className="glass-panel" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12 }}>
            <AlertTriangle size={32} color="var(--danger)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Negative Marks Impact</h4>
            <p style={{ color: 'var(--text-secondary)' }}>You lost <strong>{data.negative_marks} marks</strong> due to incorrect guesses.</p>
          </div>
        </div>

        {parseFloat(data.accuracy) === 100 ? (
          <div className="glass-panel" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: 16, borderRadius: 12 }}>
              <Target size={32} color="var(--success)" />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Flawless Performance</h4>
              <p style={{ color: 'var(--text-secondary)' }}>Congratulations, you've nailed it! Perfect accuracy achieved.</p>
            </div>
          </div>
        ) : weakSubject && (
        <div className="glass-panel" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 12 }}>
            <Target size={32} color="var(--warning)" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.2rem', marginBottom: 4 }}>Weakest Subject</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Focus more on <strong>{weakSubject.subject}</strong> (Accuracy: {weakSubject.accuracy}%).</p>
          </div>
        </div>
        )}
      </div>

      <h3 style={{ marginBottom: 24 }}>Subject-wise Breakdown</h3>
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
              <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)' }}>Subject</th>
              <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)' }}>Attempted</th>
              <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)' }}>Correct</th>
              <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)' }}>Wrong</th>
              <th style={{ padding: '20px 24px', borderBottom: '1px solid var(--panel-border)' }}>Accuracy</th>
            </tr>
          </thead>
          <tbody>
            {data.subject_stats.map(s => (
              <tr key={s.subject} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '20px 24px', fontWeight: 600 }}>{s.subject}</td>
                <td style={{ padding: '20px 24px' }}>{s.attempted}</td>
                <td style={{ padding: '20px 24px', color: 'var(--success)' }}>{s.correct}</td>
                <td style={{ padding: '20px 24px', color: 'var(--danger)' }}>{s.wrong}</td>
                <td style={{ padding: '20px 24px' }}>{s.accuracy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <Link to="/" className="btn-primary" style={{ padding: '15px 40px' }}>Back to Dashboard</Link>
      </div>
    </div>
  );
}
