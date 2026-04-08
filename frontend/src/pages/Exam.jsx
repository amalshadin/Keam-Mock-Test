import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Clock, Navigation, CheckCircle, Circle, ArrowRight, ArrowLeft } from 'lucide-react';

export default function Exam() {
  const { id: attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Local state dictating what mapping exists
  const [answersMap, setAnswersMap] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // We assume test ID is 1 for this static mock, normally we'd fetch the attempt and testId
    const fetchTest = async () => {
      try {
        const { data } = await axios.get('/tests/1');
        setTestData(data);
        setQuestions(data.questions);
        setTimeLeft(data.duration_minutes * 60);

        // Fetch existing attempt answers (if refreshed)
        // A robust app would have GET /attempts/:id API to restore answersMap.
        // For now, we start fresh on mount.
      } catch (error) {
        toast.error('Failed to load test');
      }
    };
    fetchTest();
  }, []);

  // Timer logic
  useEffect(() => {
    if (timeLeft <= 0 && testData) {
      handleFinalSubmit(); // Auto submit
      return;
    }
    const timerId = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, testData]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if(h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleOptionSelect = async (optionId) => {
    const qId = questions[currentIndex].question_id;
    const isMarkedInfo = answersMap[qId]?.is_marked_for_review || false;
    
    // Optimistic UI update
    setAnswersMap(prev => ({
      ...prev,
      [qId]: { selected_option_id: optionId, is_marked_for_review: isMarkedInfo }
    }));

    try {
      await axios.put(`/attempts/${attemptId}/answer`, {
        question_id: qId,
        selected_option_id: optionId,
        is_marked_for_review: isMarkedInfo
      });
    } catch (error) {
      toast.error('Failed to save answer');
    }
  };

  const handleMarkReview = async () => {
    const qId = questions[currentIndex].question_id;
    const currentAns = answersMap[qId] || {};
    const newMarkedVal = !currentAns.is_marked_for_review;

    setAnswersMap(prev => ({
      ...prev,
      [qId]: { ...currentAns, is_marked_for_review: newMarkedVal }
    }));

    try {
      await axios.put(`/attempts/${attemptId}/answer`, {
        question_id: qId,
        selected_option_id: currentAns.selected_option_id || null,
        is_marked_for_review: newMarkedVal
      });
    } catch (error) {
      toast.error('Sync failed');
    }
    
    // Auto next after mark for review in many exam portals
    if (currentIndex < questions.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const handleFinalSubmit = async () => {
    if (!window.confirm("Are you sure you want to submit the exam?")) return;
    try {
      await axios.post(`/attempts/${attemptId}/submit`);
      toast.success('Exam submitted successfully!');
      navigate(`/result/${attemptId}`);
    } catch (error) {
      toast.error('Submit failed');
    }
  };

  if (!testData || questions.length === 0) return <div className="container">Loading Test Environment...</div>;

  const currentQ = questions[currentIndex];
  const currentAns = answersMap[currentQ.question_id] || {};

  const getStatusClass = (qId) => {
    const ans = answersMap[qId];
    if (!ans) return 'status-not-visited';
    if (ans.selected_option_id && ans.is_marked_for_review) return 'status-marked-answered';
    if (ans.is_marked_for_review) return 'status-marked';
    if (ans.selected_option_id) return 'status-answered';
    return 'status-unattempted'; // visited but not answered
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-color)' }}>
      {/* Top Bar */}
      <div className="glass-panel" style={{ borderRadius: 0, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{testData.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: 600, color: timeLeft < 300 ? 'var(--danger)' : 'var(--text-primary)' }}>
            <Clock size={20} /> Time Left: {formatTime(timeLeft)}
          </div>
          <button className="btn-primary" onClick={handleFinalSubmit} style={{ background: 'var(--warning)', color: '#000' }}>
            Submit Test
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Main Area */}
        <div style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div className="glass-panel" style={{ flex: 1, padding: 30, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border)', paddingBottom: 20, marginBottom: 30 }}>
              <h3 style={{ color: 'var(--accent)' }}>Question {currentIndex + 1} of {questions.length}</h3>
              <span style={{ color: 'var(--text-secondary)' }}>Marks: +4 / -1</span>
            </div>
            
            <p style={{ fontSize: '1.2rem', lineHeight: 1.6, marginBottom: 40, whiteSpace: 'pre-line' }}>
              {currentQ.question_text}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {currentQ.options.map((opt, idx) => {
                const isSelected = currentAns.selected_option_id === opt.option_id;
                return (
                  <div 
                    key={opt.option_id}
                    onClick={() => handleOptionSelect(opt.option_id)}
                    style={{
                      padding: 20,
                      borderRadius: 12,
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--panel-border)'}`,
                      background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'var(--panel-bg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--text-secondary)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--accent)' }} />}
                    </div>
                    <span style={{ fontSize: '1.1rem' }}>{opt.option_text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" 
                      style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)' }}
                      onClick={handleMarkReview}>
                {currentAns.is_marked_for_review ? 'Unmark Review' : 'Mark for Review'}
              </button>
              <button className="btn-primary" 
                      style={{ background: 'var(--panel-bg)', color: 'var(--text-primary)', border: '1px solid var(--panel-border)' }}
                      onClick={async () => {
                        setAnswersMap(p => ({ ...p, [currentQ.question_id]: { ...p[currentQ.question_id], selected_option_id: null }}));
                        await handleOptionSelect(null);
                      }}>
                Clear Response
              </button>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-primary" disabled={currentIndex === 0} 
                      onClick={() => setCurrentIndex(p => p - 1)}>
                <ArrowLeft size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Previous
              </button>
              <button className="btn-primary" disabled={currentIndex === questions.length - 1} 
                      onClick={() => setCurrentIndex(p => p + 1)}>
                Next <ArrowRight size={18} style={{ marginLeft: 8, verticalAlign: 'middle' }} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Palette */}
        <div className="glass-panel" style={{ width: 320, borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderRight: 'none', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: 20, borderBottom: '1px solid var(--panel-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
             <img src={`https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`} 
                  style={{ width: 48, height: 48, borderRadius: 8 }} alt="User" />
             <div>
               <div style={{ fontWeight: 600 }}>{user?.name}</div>
               <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>KEAM Aspirant</div>
             </div>
          </div>

          <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
            <h4 style={{ marginBottom: 16, color: 'var(--text-secondary)' }}>Question Palette</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              {questions.map((q, idx) => {
                const statusClass = getStatusClass(q.question_id);
                return (
                  <div key={q.question_id}
                       onClick={() => setCurrentIndex(idx)}
                       className={statusClass}
                       style={{
                         aspectRatio: '1', borderRadius: '50%',
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         cursor: 'pointer', fontWeight: 600, border: '2px solid',
                         boxShadow: currentIndex === idx ? '0 0 0 4px rgba(59,130,246,0.4)' : 'none',
                         transition: 'all 0.2s'
                       }}>
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '0.9rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--success)' }}></div> Answered</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: '#a855f7' }}></div> Answered & Marked</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--warning)' }}></div> Marked for Review</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'var(--panel-bg)', border: '1px solid var(--panel-border)' }}></div> Not Answered</div>
               <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 16, height: 16, borderRadius: '50%', background: 'transparent', border: '1px solid var(--panel-border)' }}></div> Not Visited</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
