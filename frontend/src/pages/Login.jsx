import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ksuLogo from '../resources/ksu.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { email, password });
      login(res.data, res.data.token);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <h1>KEAM Mock Portal</h1>
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <input type="email" placeholder="Email" required className="input-field" 
                   value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="auth-form-group">
            <input type="password" placeholder="Password" required className="input-field" 
                   value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary auth-submit">Login</button>
        </form>
        <div className="auth-links">
          Don't have an account? <Link to="/register">Sign up</Link>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 30, textAlign: 'center' }}>
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
