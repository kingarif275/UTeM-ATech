import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../components/Navbar';
import { ensureUserProfile } from '../utils/userProfiles';

const Signup = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "UTeM ATech - Sign Up";
    }, []);

    const handleSignup = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });
            await ensureUserProfile({
                uid: userCredential.user.uid,
                email: userCredential.user.email,
                displayName: name,
                photoURL: userCredential.user.photoURL
            });
            navigate('/');
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('Email already in use.');
            } else {
                setError(err.message);
            }
        }
    };

    const handleGoogleSignup = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            await ensureUserProfile(result.user);
            navigate('/');
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
                            <h1 className="auth-title">Create an Account</h1>
                            <p className="auth-subtitle">Join us and start building today</p>
                        </div>

                        {error && <p style={{ color: 'red', marginBottom: '16px' }}>{error}</p>}

                        <form onSubmit={handleSignup}>
                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Full Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <input
                                    type="email"
                                    className="form-input"
                                    placeholder="Email"
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
                                    minLength={6}
                                />
                            </div>

                            <button type="submit" className="btn btn-block btn-primary">
                                Sign Up
                            </button>
                        </form>

                        <div className="divider">Or continue with</div>

                        <button onClick={handleGoogleSignup} className="btn btn-block btn-google">
                            <FcGoogle size={20} style={{ marginRight: '8px' }} />
                            Sign up with Google
                        </button>

                        <div className="auth-footer">
                            Already have an account? <Link to="/login" className="auth-link">Log in</Link>
                        </div>
                    </div>

                    <div className="auth-right">
                        <img
                            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80"
                            alt="Workspace"
                            className="auth-image"
                        />
                        <div className="auth-overlay">
                            <h2 className="overlay-title">Join the Community</h2>
                            <p className="overlay-text">Create your portfolio and get hired.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;
