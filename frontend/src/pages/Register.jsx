import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingUserId, setPendingUserId] = useState(null);
  const [resendTimer, setResendTimer] = useState(0);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    let interval = null;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer]);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', { name, email, phone, password });
      toast.success(res.data.message || 'OTP sent to your email!');
      setPendingUserId(res.data.user_id);
      setStep(2);
      setResendTimer(60); // Initial cooldown
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/verify-otp', { user_id: pendingUserId, otp_code: otp });
      login(res.data, res.data.token);
      toast.success('Email Verified successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired OTP');
    }
  };

  const handleResend = async () => {
    try {
      await axios.post('/auth/resend-otp', { user_id: pendingUserId });
      toast.success('A new OTP has been sent!');
      setResendTimer(60);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to resend OTP');
    }
  };

  const handleCancel = () => {
    setStep(1);
    setOtp('');
    setPendingUserId(null);
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <h1 style={{ textAlign: 'center', marginBottom: 24 }}>{step === 1 ? 'Create Account' : 'Verify Email'}</h1>
        
        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div className="auth-form-group">
              <input type="text" placeholder="Full Name" required className="input-field" 
                     value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="auth-form-group">
              <input type="email" placeholder="Email" required className="input-field" 
                     value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="auth-form-group">
              <input type="tel" placeholder="Phone Number" required pattern="[0-9]{10}" title="10-digit phone number" className="input-field" 
                     value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="auth-form-group">
              <input type="password" placeholder="Password" required className="input-field" 
                     value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary auth-submit">Register</button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div className="auth-form-group" style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.9rem' }}>
                 We have sent a 6-digit OTP to <b>{email}</b>. (For dev: check backend terminal)
              </p>
              <input type="text" placeholder="_ _ _ _ _ _" required maxLength={6} className="input-field" 
                     style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: 8, marginBottom: 16 }}
                     value={otp} onChange={e => setOtp(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary auth-submit">Verify OTP & Login</button>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, gap: 12 }}>
              <button type="button" onClick={handleCancel} className="btn-danger" style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', color: '#fff', cursor: 'pointer' }}>
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleResend} 
                disabled={resendTimer > 0} 
                style={{ 
                  flex: 1, 
                  padding: '10px', 
                  borderRadius: 8, 
                  border: 'none', 
                  color: '#fff', 
                  cursor: resendTimer > 0 ? 'not-allowed' : 'pointer',
                  background: resendTimer > 0 ? '#4b5563' : '#3b82f6',
                  opacity: resendTimer > 0 ? 0.7 : 1
                }}
              >
                {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP'}
              </button>
            </div>
          </form>
        )}
        
        {step === 1 && (
          <div className="auth-links">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        )}
      </div>
    </div>
  );
}
