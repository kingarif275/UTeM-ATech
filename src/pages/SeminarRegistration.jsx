import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSeminars } from '../context/SeminarContext';
import { auth, googleProvider } from '../firebase';
import { onAuthStateChanged, signInWithPopup } from 'firebase/auth';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import { ensureUserProfile } from '../utils/userProfiles';
import { REGISTRATION_CATEGORIES, ROLE_OPTIONS } from '../data/atechContent';

const isOnlineActivity = (activity) => ['online', 'Online', 'Microsoft Teams', 'Google Meet'].includes(activity?.locationType);

const SeminarRegistration = () => {
    const { state } = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { registerForSeminar, seminars, loading } = useSeminars();
    const seminar = state?.seminar || seminars.find(item => item.id === id);
    const isOnline = isOnlineActivity(seminar);
    const displayLocation = isOnline ? 'Online' : (seminar?.location || 'Venue TBA');

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: '',
        organization: '',
        registrationCategory: '',
        remarks: '',
        declarationAccepted: false
    });
    const [enrollmentMode, setEnrollmentMode] = useState('manual');
    const [submitted, setSubmitted] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userAuthChecked, setUserAuthChecked] = useState(false);
    const [selectedSessionIndices, setSelectedSessionIndices] = useState([]);
    const [submitError, setSubmitError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    React.useEffect(() => {
        document.title = 'UTeM ATech - Register for Activity';
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setCurrentUser(currentUser);
            setUserAuthChecked(true);
            if (currentUser) {
                let profile = null;
                try {
                    profile = await ensureUserProfile(currentUser);
                } catch (error) {
                    console.warn('Could not load profile details for registration:', error);
                }
                setFormData(prev => ({
                    ...prev,
                    fullName: prev.fullName || profile?.name || currentUser.displayName || '',
                    email: prev.email || profile?.email || currentUser.email || '',
                    phoneNumber: prev.phoneNumber || profile?.phoneNumber || '',
                    role: prev.role || profile?.role || profile?.profession || '',
                    organization: prev.organization || profile?.organization || profile?.company || ''
                }));
            }
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="container page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '180px' }}>
                    <div className="spinner" />
                </div>
            </>
        );
    }

    if (!seminar) {
        return (
            <>
                <Navbar />
                <div className="container page-content" style={{ textAlign: 'center' }}>
                    <h2>Activity not found</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/register')}>Back to Register</button>
                </div>
            </>
        );
    }

    const toggleSession = (index) => {
        setSelectedSessionIndices(prev => (
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        ));
    };

    const fillFromAccount = async (user = currentUser) => {
        if (!user) return;
        let profile = null;
        try {
            profile = await ensureUserProfile(user);
        } catch (error) {
            console.warn('Could not load account profile for registration:', error);
        }
        setFormData(prev => ({
            ...prev,
            fullName: profile?.name || user.displayName || prev.fullName,
            email: profile?.email || user.email || prev.email,
            phoneNumber: profile?.phoneNumber || prev.phoneNumber,
            role: profile?.role || profile?.profession || prev.role,
            organization: profile?.organization || profile?.company || prev.organization
        }));
    };

    const handleGoogleLogin = async () => {
        try {
            setSubmitError('');
            const result = await signInWithPopup(auth, googleProvider);
            await ensureUserProfile(result.user);
            setCurrentUser(result.user);
            setEnrollmentMode('account');
            await fillFromAccount(result.user);
        } catch (error) {
            setSubmitError(error.message);
        }
    };

    const goToLogin = () => {
        navigate('/login', {
            state: {
                returnTo: `/register/${seminar.id}`,
                seminar
            }
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSubmitError('');
        if (selectedSessionIndices.length === 0) {
            alert('Please select at least one session to register.');
            return;
        }
        try {
            setSubmitting(true);
            if (!formData.declarationAccepted) {
                alert('Please accept the registration declaration before reserving your seat.');
                return;
            }
            await registerForSeminar(seminar.id, selectedSessionIndices, {
                ...formData,
                registrationMethod: enrollmentMode === 'account' && currentUser ? 'account' : 'manual'
            });
            setSubmitted(true);
        } catch (error) {
            setSubmitError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <>
                <Navbar />
                <div className="container flex-center page-content" style={{ minHeight: '80vh', flexDirection: 'column', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#e6f4ea',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        color: '#1e8e3e'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '800', letterSpacing: 0 }}>Registration Received</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
                        Your reservation for <strong>{seminar.title}</strong> has been received. Payment instructions will be sent after review. The seat is confirmed only after payment.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px', maxWidth: '400px', width: '100%' }}>
                        {selectedSessionIndices.map(index => {
                            const session = seminar.sessions[index];
                            const calendarUrl = generateGoogleCalendarUrl({
                                title: seminar.title,
                                description: seminar.description || `Session on ${session.date}`,
                                location: isOnline ? seminar.location || 'Online' : session.location || seminar.location,
                                date: session.date,
                                startTime: session.startTime,
                                endTime: session.endTime
                            });

                            return (
                                <a
                                    key={index}
                                    href={calendarUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="nav-btn-outline"
                                    style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '14px' }}
                                >
                                    Add {session.name || `Session ${index + 1}`} to Calendar
                                </a>
                            );
                        })}
                    </div>

                    <button className="btn btn-primary" onClick={() => navigate('/register')}>
                        Browse Training
                    </button>
                </div>
            </>
        );
    }

    if (!userAuthChecked) return null;

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container page-content" style={{ paddingBottom: '80px', maxWidth: '920px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-light)',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    &larr; Back
                </button>

                <div style={{ marginBottom: '40px' }}>
                    <section
                        style={{
                            position: 'relative',
                            minHeight: '430px',
                            borderRadius: '28px',
                            overflow: 'hidden',
                            marginBottom: '32px',
                            boxShadow: '0 18px 42px rgba(15,23,42,0.14)',
                            background: '#111827',
                        }}
                    >
                        {(seminar.poster || seminar.banner) && (
                            <img
                                src={seminar.poster || seminar.banner}
                                alt={seminar.title}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.16), rgba(15,23,42,0.84))' }} />
                        <div style={{ position: 'absolute', inset: 0, padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                                <span className="activity-chip">{seminar.type || 'Activity'}</span>
                                <span className={`activity-chip ${seminar.price === 0 ? 'free' : 'paid'}`}>
                                    {seminar.price === 0 ? 'FREE' : `RM ${seminar.price || 0}`}
                                </span>
                            </div>
                            <div>
                                <h1 style={{ fontSize: 'clamp(34px, 6vw, 58px)', fontWeight: 900, lineHeight: 1.02, margin: '0 0 14px', color: '#ffffff', textShadow: '0 4px 20px rgba(0,0,0,0.28)' }}>
                                    {seminar.title}
                                </h1>
                                <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'rgba(255,255,255,0.88)', margin: '0 0 18px', maxWidth: '720px' }}>
                                    {seminar.description}
                                </p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                    {seminar.logo && (
                                        <img src={seminar.logo} alt={seminar.organizer} style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'contain', background: '#ffffff', padding: '4px' }} />
                                    )}
                                    <span style={{ color: '#ffffff', fontWeight: 800 }}>{seminar.organizer}</span>
                                    <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>·</span>
                                    <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{displayLocation}</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div style={{ background: 'white', padding: '32px', borderRadius: '24px', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>Select Sessions</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {seminar.sessions && seminar.sessions.map((session, index) => {
                                const remaining = (session.quota || 0) - (session.registered || 0);
                                const isFull = remaining <= 0;
                                const selected = selectedSessionIndices.includes(index);

                                return (
                                    <label key={index} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: isFull ? 'not-allowed' : 'pointer',
                                        background: selected ? 'var(--primary-color)' : '#f8f9fa',
                                        color: selected ? 'white' : 'var(--text-dark)',
                                        padding: '18px',
                                        borderRadius: '16px',
                                        transition: 'all 0.2s',
                                        border: '1px solid transparent'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => !isFull && toggleSession(index)}
                                            disabled={isFull}
                                            style={{ width: '20px', height: '20px', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(170px, 1.2fr) repeat(4, minmax(80px, auto)) auto', gap: '12px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '800', fontSize: '14px' }}>{session.name || `Session ${index + 1}`}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>Date: {session.date}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>Start: {session.startTime}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>End: {session.endTime || 'TBA'}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700' }}>Location: {session.location || displayLocation}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '700', opacity: 0.8 }}>
                                                {isFull ? 'SOLD OUT' : `${remaining} SPOTS LEFT`}
                                            </span>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>Enrollment Method</h2>
                    <p style={{ color: 'var(--text-light)', lineHeight: 1.6, margin: '0 0 18px' }}>
                        Enter attendee details manually, or use a saved account profile to complete the form faster.
                    </p>
                    <div style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        width: '100%',
                        maxWidth: '520px',
                        background: '#e5e7eb',
                        border: '1px solid #d1d5db',
                        borderRadius: '999px',
                        padding: '4px',
                        marginBottom: enrollmentMode === 'account' ? '18px' : 0,
                    }}>
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            bottom: '4px',
                            left: enrollmentMode === 'manual' ? '4px' : 'calc(50% + 0px)',
                            width: 'calc(50% - 4px)',
                            borderRadius: '999px',
                            background: '#ffffff',
                            boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
                            transition: 'left 0.22s ease',
                        }} />
                        <button
                            type="button"
                            onClick={() => setEnrollmentMode('manual')}
                            style={{ position: 'relative', zIndex: 1, border: 0, background: 'transparent', padding: '12px 14px', borderRadius: '999px', color: enrollmentMode === 'manual' ? '#111827' : '#6b7280', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            Enter Attendee Details
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                setEnrollmentMode('account');
                                if (currentUser) await fillFromAccount();
                            }}
                            style={{ position: 'relative', zIndex: 1, border: 0, background: 'transparent', padding: '12px 14px', borderRadius: '999px', color: enrollmentMode === 'account' ? '#111827' : '#6b7280', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                            Use Account Profile
                        </button>
                    </div>
                    {enrollmentMode === 'account' && (
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            {currentUser ? (
                                <button type="button" className="btn btn-primary" onClick={() => fillFromAccount()}>
                                    Refresh Account Details
                                </button>
                            ) : (
                                <>
                                    <button type="button" className="btn btn-primary" onClick={goToLogin}>
                                        Continue with UTeM ATech
                                    </button>
                                    <button type="button" className="btn btn-google" style={{ width: 'auto', padding: '12px 18px' }} onClick={handleGoogleLogin}>
                                        Continue with Google
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                    {enrollmentMode === 'account' && currentUser && (!formData.phoneNumber || !formData.role) && (
                        <p style={{ color: '#92400e', background: '#fef3c7', borderRadius: '12px', padding: '10px 12px', margin: '14px 0 0', fontWeight: 700, fontSize: '13px' }}>
                            Your account profile is missing phone number or role. Add them below once, then save your account profile later.
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="profile-card" style={{ padding: '32px' }}>
                    {submitError && (
                        <p style={{ color: '#b91c1c', background: '#fee2e2', borderRadius: '12px', padding: '12px 14px', margin: '0 0 20px', fontWeight: 700 }}>
                            {submitError}
                        </p>
                    )}
                    <div className="grid-2" style={{ width: '100%', marginBottom: '24px' }}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.fullName}
                                onChange={event => setFormData({ ...formData, fullName: event.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                required
                                value={formData.email}
                                onChange={event => setFormData({ ...formData, email: event.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid-2" style={{ width: '100%', marginBottom: '24px' }}>
                        <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="form-input"
                                required
                                value={formData.phoneNumber}
                                onChange={event => setFormData({ ...formData, phoneNumber: event.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Role</label>
                            <select
                                className="form-input"
                                required
                                value={formData.role}
                                onChange={event => setFormData({ ...formData, role: event.target.value })}
                            >
                                <option value="">Select your role</option>
                                {ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid-2" style={{ width: '100%', marginBottom: '24px' }}>
                        <div className="form-group">
                            <label className="form-label">Organisation / University</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.organization}
                                onChange={event => setFormData({ ...formData, organization: event.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Registration Category</label>
                            <select
                                className="form-input"
                                required
                                value={formData.registrationCategory}
                                onChange={event => setFormData({ ...formData, registrationCategory: event.target.value })}
                            >
                                <option value="">Select category</option>
                                {REGISTRATION_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '18px' }}>
                        <label className="form-label">Remarks (optional)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.remarks}
                            onChange={event => setFormData({ ...formData, remarks: event.target.value })}
                        />
                    </div>

                    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '28px', color: '#374151', lineHeight: 1.5, fontWeight: 700 }}>
                        <input
                            type="checkbox"
                            checked={formData.declarationAccepted}
                            onChange={event => setFormData({ ...formData, declarationAccepted: event.target.checked })}
                            required
                            style={{ marginTop: '4px' }}
                        />
                        I confirm that the information provided is accurate. I understand that this is a seat reservation and payment instructions will be sent after review.
                    </label>

                    <button type="submit" className="btn btn-primary btn-block" disabled={selectedSessionIndices.length === 0 || submitting}>
                        {submitting ? 'Reserving...' : 'Reserve My Seat'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SeminarRegistration;
