import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import '../App.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        setError('Please verify your email before logging in.');
        await auth.signOut();
        setLoading(false);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        setError('User data not found.');
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      localStorage.setItem(
        'user',
        JSON.stringify({
          uid: userCredential.user.uid,
          email: userData.email,
          fullName: userData.fullName,
          phoneNumber: userData.phoneNumber,
          isAdmin: userData.isAdmin || false,
        })
      );

      if (userData.isAdmin) {
        navigate('/admin');
      } else if (userData.role === 'officer') {
        navigate('/officer');
      } else if (userData.role === 'head') {
        navigate('/head');
      } else {
        navigate('/user-dashboard');
      }
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email sent! Check your inbox.');
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  return (
    <div className="login-container">
      <div>
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="input-group">
            <label>PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <button
          onClick={handleForgotPassword}
          className="forgot-btn"
          type="button"
        >
          Forgot Password?
        </button>

        <div className="signup-section">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;