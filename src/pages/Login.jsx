import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      navigate('/patient');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="dashboard-card">
        {/* Left Side: Login Form */}
        <div className="login-form-side">
          <div className="brand-header">
            <Link to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
              <div className="brand-dot"></div>
              <span>HealthCare AR</span>
            </Link>
          </div>

          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Access your healthcare dashboard</p>

          <form onSubmit={handleLogin}>
            {error && <div className="error-msg-dashboard">{error}</div>}
            
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                name="email"
                type="email"
                className="dashboard-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                className="dashboard-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-extras">
              <label htmlFor="remember-me" className="remember-checkbox">
                <input 
                  id="remember-me" 
                  name="rememberMe"
                  type="checkbox" 
                />
                <span>Remember me</span>
              </label>
              <Link to="/forgot-password" disabled className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-dashboard-signin" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="signup-footer">
            Don't have an account? 
            <Link to="/signup" className="signup-link">Sign Up</Link>
          </p>
        </div>

        {/* Right Side: Visual Panel */}
        <div className="visual-panel-side">
          <div className="abstract-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
          </div>
          
          <div className="floating-ui">
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>System Performance</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Real-time AR analytics</p>
            </div>
            
            <div className="ui-item large"></div>
            <div className="ui-item medium"></div>
            <div className="ui-item small"></div>
            
            <div className="ui-stats">
              <div className="stat-circle"></div>
              <div className="stat-circle"></div>
              <div className="stat-circle"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
