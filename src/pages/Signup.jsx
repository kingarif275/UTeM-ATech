import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { createUserWithEmailAndPassword, signInWithPopup, updateProfile } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import Navbar from '../components/Navbar';
import { ensureUserProfile, updateUserProfileData } from '../utils/userProfiles';
import { ROLE_OPTIONS } from '../data/atechContent';

const Signup = () => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [role, setRole] = useState('');
    const [organization, setOrganization] = useState('');
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
            await updateUserProfileData(userCredential.user.uid, {
                name,
                username,
                phoneNumber,
                role,
                organization
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
                            <p className="auth-subtitle">Use one account for training registrations, activity tracking, and organizer tools.</p>
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
                                    type="text"
                                    className="form-input"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
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

                            <div className="form-group">
                                <input
                                    type="tel"
                                    className="form-input"
                                    placeholder="Phone Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <select
                                    className="form-input"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    required
                                >
                                    <option value="">Select role</option>
                                    {ROLE_OPTIONS.map(option => <option key={option} value={option}>{option}</option>)}
                                </select>
                            </div>

                            <div className="form-group">
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Organisation / University"
                                    value={organization}
                                    onChange={(e) => setOrganization(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn btn-block btn-primary">
                                Create Account
                            </button>
                        </form>

                        <div className="divider">Or continue with</div>

                        <button onClick={handleGoogleSignup} className="btn btn-block btn-google">
                            <FcGoogle size={20} style={{ marginRight: '8px' }} />
                            Continue with Google
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
                            <h2 className="overlay-title">ATech UTeM Account</h2>
                            <p className="overlay-text">Track your training activities and request organizer access when needed.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Signup;
