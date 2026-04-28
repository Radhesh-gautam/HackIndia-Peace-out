import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError("Please agree to the Terms & Conditions");
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;

      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert([
          {
            id: data.user.id,
            email: formData.email,
            name: formData.name,
            age: 0, 
            condition: 'None'
          }
        ]);

        if (profileError) throw profileError;

        alert('Signup successful! Please check your email for verification.');
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="signup-page-wrapper">
      <div className="dashboard-card">
        {/* Left Side: Signup Form */}
        <div className="signup-form-side">
          <div className="brand-header">
            <Link to="/" className="brand-logo" style={{ textDecoration: 'none' }}>
              <div className="brand-dot"></div>
              <span>HealthCare AR</span>
            </Link>
          </div>

          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Get started with your smart healthcare dashboard</p>

          <form onSubmit={handleSignup}>
            {error && <div className="error-msg-dashboard">{error}</div>}
            
            <div className="input-group">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                name="name"
                type="text"
                className="dashboard-input"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                className="dashboard-input"
                placeholder="name@company.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                className="dashboard-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="signup-confirm-password">Confirm Password</label>
              <input
                id="signup-confirm-password"
                name="confirmPassword"
                type="password"
                className="dashboard-input"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <label htmlFor="agree-terms" className="terms-checkbox">
              <input 
                id="agree-terms"
                name="agreeTerms"
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              <span>I agree to the Terms & Conditions and Privacy Policy</span>
            </label>

            <button type="submit" className="btn-dashboard-signup" disabled={loading}>
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>

          <p className="login-footer">
            Already have an account? 
            <Link to="/login" className="login-link">Sign In</Link>
          </p>
        </div>

        {/* Right Side: Visual Panel (Consistent with Login) */}
        <div className="visual-panel-side">
          <div className="abstract-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
          </div>
          
          <div className="floating-ui">
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Join the Network</h3>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Secure patient management</p>
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
