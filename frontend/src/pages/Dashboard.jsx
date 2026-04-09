import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { History, Target, Calendar } from 'lucide-react';
import ksuLogo from '../resources/ksu.png';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [tests, setTests] = useState([]);
  const [myRegs, setMyRegs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [histRes, testRes, regRes] = await Promise.all([
          axios.get('/attempts/history'),
          axios.get('/tests'),
          axios.get('/registrations/mine')
        ]);
        setHistory(histRes.data);
        setTests(testRes.data);
        setMyRegs(regRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data");
      }
    };
    fetchData();
  }, []);

  const getRegStatus = (testId) => {
    return myRegs.find(r => r.test_id === testId);
  }

  const handleRegister = async (testId) => {
    try {
      const res = await axios.post('/registrations/register', { test_id: testId });
      const { razorpay_order_id, amount, key_id, registration_id } = res.data;

      if (!key_id) {
        toast.error("Payment Gateway configuration missing.");
        return;
      }

      const options = {
        key: key_id,
        amount: Math.round(amount * 100),
        currency: "INR",
        name: "KEAM Mock Portal",
        description: "Test Registration Fee",
        order_id: razorpay_order_id,
        handler: async function (response) {
          try {
            await axios.post('/registrations/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              registration_id: registration_id
            });
            toast.success("Payment Successful! You are now registered.");
            const regRes = await axios.get('/registrations/mine');
            setMyRegs(regRes.data);
          } catch (err) {
            toast.error(err.response?.data?.error || "Payment verification failed.");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: "#3b82f6"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.on('payment.failed', function (response){
        toast.error(`Payment failed: ${response.error.description}`);
      });
      rzp1.open();
    } catch (e) {
      toast.error(e.response?.data?.error || "Registration failed");
    }
  }

  const startTest = async (regId) => {
    try {
      const res = await axios.post('/attempts/start', { registration_id: regId });
      navigate(`/exam/${res.data.attempt_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start test.');
    }
  };

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
        <h2>Welcome, {user.name}</h2>
        <button onClick={logout} className="btn-danger" style={{ padding: '8px 16px', borderRadius: 8, border: 'none', color: '#fff', cursor: 'pointer' }}>Logout</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 30 }}>
        {/* Main Test Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {tests.map(test => {
            const reg = getRegStatus(test.test_id);
            const isRegistered = reg && reg.payment_status === 'PAID';
            const hasAttempted = reg && reg.attempt !== null;
            
            return (
              <div key={test.test_id} className="glass-panel" style={{ padding: 40, textAlign: 'center', height: 'fit-content' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>{test.title}</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>
                  Duration: {test.duration_minutes} Minutes <br />
                  Registration Fee: ₹{test.price}
                </p>
                {hasAttempted && reg.attempt.status === 'SUBMITTED' ? (
                  <button disabled className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px', width: '100%', opacity: 0.5, cursor: 'not-allowed' }}>
                    ALREADY ATTEMPTED
                  </button>
                ) : isRegistered ? (
                  <button onClick={() => startTest(reg.registration_id)} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px', width: '100%', background: 'var(--success)', borderColor: 'var(--success)' }}>
                    {hasAttempted && reg.attempt.status === 'STARTED' ? 'RESUME EXAM' : 'START EXAM NOW'}
                  </button>
                ) : (
                  <button onClick={() => handleRegister(test.test_id)} className="btn-primary" style={{ fontSize: '1.2rem', padding: '15px 40px', width: '100%', background: '#a855f7', borderColor: '#a855f7' }}>
                    PAY ₹{test.price} & REGISTER
                  </button>
                )}
              </div>
            )
          })}
          
          {tests.length === 0 && (
             <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
                <h3 style={{ color: 'var(--text-secondary)' }}>No Exams Available</h3>
             </div>
          )}
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

      <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: 30, paddingTop: 60 }}>
        <img src={ksuLogo} alt="KSU Logo" style={{ height: 60, width: 'auto', marginBottom: 8, opacity: 0.9 }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600, letterSpacing: 1 }}>
          GEC RIT KOTTAYAM
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: 4, opacity: 0.8 }}>
          Site maintained by Amal Shadin, for support contact 9567325591
        </div>
      </div>
    </div>
  );
}
