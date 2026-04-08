import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Check, X, ArrowLeft, ArrowRight } from 'lucide-react';

export default function Review() {
  const { id } = useParams();
  const [reviewData, setReviewData] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const res = await axios.get(`/attempts/${id}/review`);
        setReviewData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchReview();
  }, [id]);

  if (reviewData.length === 0) return <div className="container">Loading Review...</div>;

  const q = reviewData[currentIndex];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <h2>Review Answers</h2>
        <Link to={`/result/${id}`} className="btn-primary" style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)' }}>
          Back to Results
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 30 }}>
        <div className="glass-panel" style={{ flex: 1, padding: 30 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ color: 'var(--accent)' }}>Question {currentIndex + 1}</h3>
            {q.status === 'CORRECT' && <span style={{ color: 'var(--success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={20} /> Correct</span>}
            {q.status === 'WRONG' && <span style={{ color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}><X size={20} /> Wrong</span>}
            {q.status === 'UNATTEMPTED' && <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Unattempted</span>}
          </div>
          
          <p style={{ fontSize: '1.2rem', marginBottom: 30 }}>{q.question_text}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {q.options.map(opt => {
              const isSelected = q.selected_option_id === opt.option_id;
              const isCorrect = q.correct_option_id === opt.option_id;
              
              let borderCol = 'var(--panel-border)';
              let bgCol = 'var(--panel-bg)';
              let icon = null;

              if (isCorrect) {
                borderCol = 'var(--success)';
                bgCol = 'rgba(16, 185, 129, 0.1)';
                icon = <Check color="var(--success)" />;
              } else if (isSelected && !isCorrect) {
                borderCol = 'var(--danger)';
                bgCol = 'rgba(239, 68, 68, 0.1)';
                icon = <X color="var(--danger)" />;
              }

              return (
                <div key={opt.option_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderRadius: 12, border: `2px solid ${borderCol}`, background: bgCol }}>
                  <span>{opt.option_text}</span>
                  <div>{icon}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 40 }}>
            <button className="btn-primary" disabled={currentIndex === 0} onClick={() => setCurrentIndex(p => p - 1)}>
              <ArrowLeft size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Previous
            </button>
            <button className="btn-primary" disabled={currentIndex === reviewData.length - 1} onClick={() => setCurrentIndex(p => p + 1)}>
              Next <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{ width: 300, padding: 20 }}>
          <h4 style={{ marginBottom: 16 }}>Jump to Question</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {reviewData.map((revQ, idx) => {
              let bg = 'var(--panel-bg)';
              let col = 'var(--text-primary)';
              let border = '1px solid var(--panel-border)';
              if (idx === currentIndex) border = '2px solid var(--accent)';
              
              if (revQ.status === 'CORRECT') { bg = 'var(--success)'; border = 'none'; }
              if (revQ.status === 'WRONG') { bg = 'var(--danger)'; border = 'none'; }

              return (
                <div key={revQ.question_id} onClick={() => setCurrentIndex(idx)}
                     style={{ aspectRatio: '1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg, color: col, border, cursor: 'pointer', fontWeight: 600 }}>
                  {idx + 1}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
