import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/register', { name, email, password });
      login(res.data, res.data.token);
      toast.success('Registration successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box glass-panel">
        <h1>Create Account</h1>
        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <input type="text" placeholder="Full Name" required className="input-field" 
                   value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="auth-form-group">
            <input type="email" placeholder="Email" required className="input-field" 
                   value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="auth-form-group">
            <input type="password" placeholder="Password" required className="input-field" 
                   value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary auth-submit">Register</button>
        </form>
        <div className="auth-links">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
