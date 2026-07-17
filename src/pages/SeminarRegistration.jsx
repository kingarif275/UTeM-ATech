import React, { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSeminars } from '../context/SeminarContext';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { generateGoogleCalendarUrl } from '../utils/calendar';

const isOnlineActivity = (activity) => ['online', 'Online', 'Google Meet'].includes(activity?.locationType);

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
        jobTitle: '',
        company: ''
    });
    const [submitted, setSubmitted] = useState(false);
    const [userAuthChecked, setUserAuthChecked] = useState(false);
    const [selectedSessionIndices, setSelectedSessionIndices] = useState([]);

    React.useEffect(() => {
        document.title = 'UTeM ATech - Register for Activity';
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                setUserAuthChecked(true);
                setFormData(prev => ({
                    ...prev,
                    fullName: prev.fullName || currentUser.displayName || '',
                    email: prev.email || currentUser.email || ''
                }));
            }
        });
        return () => unsubscribe();
    }, [navigate]);

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
                    <button className="btn btn-primary" onClick={() => navigate('/explore')}>Back to Explore</button>
                </div>
            </>
        );
    }

    const toggleSession = (index) => {
        setSelectedSessionIndices(prev => (
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        ));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (selectedSessionIndices.length === 0) {
            alert('Please select at least one session to register.');
            return;
        }
        registerForSeminar(seminar.id, selectedSessionIndices);
        setTimeout(() => setSubmitted(true), 1000);
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
                    <h2 style={{ fontSize: '32px', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.02em' }}>Registration Confirmed!</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
                        You are registered for <strong>{seminar.title}</strong>.
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

                    <button className="btn btn-primary" onClick={() => navigate('/explore')}>
                        Browse Activities
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

                <form onSubmit={handleSubmit} className="profile-card" style={{ padding: '32px' }}>
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

                    <div className="grid-2" style={{ width: '100%', marginBottom: '32px' }}>
                        <div className="form-group">
                            <label className="form-label">Job Title</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.jobTitle}
                                onChange={event => setFormData({ ...formData, jobTitle: event.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Company</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.company}
                                onChange={event => setFormData({ ...formData, company: event.target.value })}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={selectedSessionIndices.length === 0}>
                        Confirm Registration
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SeminarRegistration;
