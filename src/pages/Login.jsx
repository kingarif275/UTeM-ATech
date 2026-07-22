import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../components/Navbar'; // We'll put the navbar here for layout consistency if needed, or outside
import { ensureUserProfile } from '../utils/userProfiles';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const returnTo = location.state?.returnTo || '/';
    const returnState = location.state?.seminar ? { seminar: location.state.seminar } : undefined;

    useEffect(() => {
        document.title = "UTeM ATech - Login";
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            await ensureUserProfile(result.user);
            navigate(returnTo, { replace: true, state: returnState });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await ensureUserProfile(result.user);
            navigate(returnTo, { replace: true, state: returnState });
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-wrapper">
                <div className="container auth-container">
                    <div className="auth-left">
                        <div className="auth-header">
                            <h1 className="auth-title">Welcome Back</h1>
                            <p className="auth-subtitle">Please enter your details to sign in</p>
                        </div>

                        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Enter your email or username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="password"
                                    className="form-input"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ textAlign: 'right', marginBottom: '32px' }}>
                                <Link to="/forgot-password" style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
                                    Forgot password?
                                </Link>
                            </div>

                            <button type="submit" className="btn btn-block btn-primary">
                                Sign In
                            </button>
                        </form>

                        <div className="divider">Or continue with</div>

                        <button onClick={handleGoogleLogin} className="btn btn-block btn-google">
                            <FcGoogle size={20} style={{ marginRight: '8px' }} />
                            Sign in with Google
                        </button>

                        <div className="auth-footer">
                            Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link>
                        </div>
                    </div>

                    <div className="auth-right">
                        <img
                            src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80"
                            alt="Workspace"
                            className="auth-image"
                        />
                        <div className="auth-overlay">
                            <h2 className="overlay-title">Build Your Dream Team</h2>
                            <p className="overlay-text">Connect with top talent and get things done.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
