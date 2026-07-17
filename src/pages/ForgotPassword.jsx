import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { confirmPasswordReset, sendPasswordResetEmail, verifyPasswordResetCode } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const oobCode = params.get('oobCode');
    const isResetMode = mode === 'resetPassword' && Boolean(oobCode);

    useEffect(() => {
        document.title = 'UTeM ATech - Reset Password';
    }, []);

    useEffect(() => {
        if (!isResetMode) return;

        setVerifyingCode(true);
        setError('');
        verifyPasswordResetCode(auth, oobCode)
            .then((verifiedEmail) => {
                setResetEmail(verifiedEmail);
            })
            .catch(() => {
                setError('This password reset link is invalid or has expired. Please request a new reset email.');
            })
            .finally(() => setVerifyingCode(false));
    }, [isResetMode, oobCode]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');
        setSending(true);

        try {
            await sendPasswordResetEmail(auth, email.trim(), {
                url: `${window.location.origin}/forgot-password`,
                handleCodeInApp: true
            });
            setStatus('If an account exists for this email address, a password reset email has been sent. Please check your inbox and follow the instructions in the email.');
        } catch (err) {
            setError(err.message || 'Unable to send the password reset email. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        setError('');
        setStatus('');

        if (newPassword.length < 8) {
            setError('Please choose a password with at least 8 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('The password confirmation does not match.');
            return;
        }

        setSending(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            setResetComplete(true);
            setStatus('Your password has been updated successfully. You can now sign in with your new password.');
        } catch (err) {
            setError(err.message || 'Unable to update your password. Please request a new reset email.');
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="auth-wrapper">
                <div className="container auth-container">
                    <div className="auth-left">
                        <div className="auth-header">
                            <h1 className="auth-title">Reset Your Password</h1>
                            <p className="auth-subtitle">
                                {isResetMode
                                    ? 'Choose a new password for your UTeM ATech account.'
                                    : 'Enter the email address linked to your UTeM ATech account. We will send a secure password reset link to your inbox.'}
                            </p>
                        </div>

                        {status && <p className="auth-success-message">{status}</p>}
                        {error && <p className="auth-error-message">{error}</p>}

                        {isResetMode ? (
                            verifyingCode ? (
                                <p className="auth-subtitle">Verifying your password reset link...</p>
                            ) : resetComplete ? (
                                <Link to="/login" className="btn btn-block btn-primary" style={{ display: 'flex', justifyContent: 'center' }}>
                                    Back to Sign In
                                </Link>
                            ) : (
                                <form onSubmit={handleResetPassword}>
                                    {resetEmail && (
                                        <p className="auth-reset-email">
                                            Resetting password for <strong>{resetEmail}</strong>
                                        </p>
                                    )}

                                    <div className="form-group">
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="New password"
                                            value={newPassword}
                                            onChange={(event) => setNewPassword(event.target.value)}
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="Confirm new password"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            required
                                            minLength={8}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-block btn-primary" disabled={sending || Boolean(error && !resetEmail)}>
                                        {sending ? 'Updating...' : 'Update Password'}
                                    </button>
                                </form>
                            )
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <input
                                        type="email"
                                        className="form-input"
                                        placeholder="Enter your email address"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-block btn-primary" disabled={sending}>
                                    {sending ? 'Sending...' : 'Send Reset Email'}
                                </button>
                            </form>
                        )}

                        <div className="auth-footer">
                            Remember your password? <Link to="/login" className="auth-link">Back to sign in</Link>
                        </div>
                    </div>

                    <div className="auth-right">
                        <img
                            src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80"
                            alt="Workspace"
                            className="auth-image"
                        />
                        <div className="auth-overlay">
                            <h2 className="overlay-title">Secure Account Recovery</h2>
                            <p className="overlay-text">A reset link will be sent through Firebase Authentication.</p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ForgotPassword;
