import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSeminars } from '../context/SeminarContext';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { generateGoogleCalendarUrl } from '../utils/calendar';
import {
    isWithin24Hours,
    getCountdownString,
    parseSessionDate,
    scheduleActivityReminders,
    getNotificationPermission,
} from '../utils/notifications';

// Format date nicely
const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'TBA') return 'TBA';
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return dateStr;
    }
};

// Live countdown chip
const CountdownChip = ({ dateStr, timeStr }) => {
    const [, tick] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => tick(n => n + 1), 1000);
        return () => clearInterval(interval);
    }, []);
    const sessionDate = parseSessionDate(dateStr, timeStr);
    const label = sessionDate ? getCountdownString(sessionDate) : '—';
    return (
        <span className="date-chip countdown countdown-live" style={{ fontSize: '10px' }}>
            ⏱ {label}
        </span>
    );
};

// Activity card matching Android mockup
const MyActivityCard = ({ activity }) => {
    const bgUrl = activity.poster || activity.banner || activity.seminarBanner;
    const organizerAvatar = activity.organizerPhoto ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.organizer || 'O')}&background=1a56db&color=fff`;
    const locationText = activity.location || activity.locationType || 'TBA';
    const sessions = activity.sessions || [];

    return (
        <div
            className="activity-card"
            style={{ height: '220px', cursor: 'default' }}
        >
            {/* Background */}
            {bgUrl ? (
                <img
                    src={bgUrl}
                    alt={activity.seminarTitle}
                    className="activity-card-bg"
                    style={{ objectFit: 'cover', width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                    onError={e => { e.target.style.display = 'none'; }}
                />
            ) : (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, #1a56db 0%, #0f3d8e 100%)'
                }} />
            )}

            {/* Gradient */}
            <div className="activity-card-gradient" />

            {/* Content */}
            <div className="activity-card-content">
                {/* Top row: type badge + date chips */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left: type + confirmed */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{
                            background: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(10px)',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: '800',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.2)',
                            textTransform: 'uppercase',
                        }}>
                            {activity.type || 'Activity'}
                        </span>
                        <span style={{
                            background: 'rgba(34, 197, 94, 0.3)',
                            backdropFilter: 'blur(8px)',
                            padding: '4px 10px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: '800',
                            color: '#dcfce7',
                            border: '1px solid rgba(34,197,94,0.4)',
                        }}>
                            ✓ CONFIRMED
                        </span>
                    </div>

                    {/* Right: session date chips */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        {sessions.slice(0, 2).map((session, i) => {
                            if (isWithin24Hours(session.date, session.startTime)) {
                                return <CountdownChip key={i} dateStr={session.date} timeStr={session.startTime} />;
                            }
                            return (
                                <span key={i} className="date-chip" style={{ fontSize: '10px' }}>
                                    📅 {formatDate(session.date)}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* Bottom: title + organizer */}
                <div>
                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '800',
                        color: 'white',
                        marginBottom: '8px',
                        lineHeight: '1.2',
                        letterSpacing: '-0.02em',
                        textShadow: '0 1px 4px rgba(0,0,0,0.4)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                    }}>
                        {activity.seminarTitle}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img
                            src={organizerAvatar}
                            alt={activity.organizer}
                            className="organizer-avatar"
                            onError={e => {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(activity.organizer || 'O')}&background=1a56db&color=fff`;
                            }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{
                                fontSize: '12px',
                                fontWeight: '700',
                                color: 'rgba(255,255,255,0.95)',
                                marginBottom: '2px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {activity.organizer}
                            </p>
                            <span className="location-pill">
                                📍 {locationText}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Session row with calendar link and download option
const SessionRow = ({ session, activity }) => {
    const calendarUrl = generateGoogleCalendarUrl({
        title: activity.seminarTitle,
        description: `${session.name || 'Session'} on ${session.date}`,
        location: (activity.locationType === 'Online' || activity.locationType === 'Google Meet') ? activity.location || 'Online' : activity.location,
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
    });

    const countdown = isWithin24Hours(session.date, session.startTime);
    const fileUrl = session.fileUrl || activity.fileUrl;
    const fileName = session.fileName || activity.fileName;

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '10px 14px',
            background: 'var(--bg-light)',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '13px', color: 'var(--text-dark)' }}>
                    {session.name || 'Session'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    ({formatDate(session.date)})
                </span>
                {session.startTime && (
                    <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                        {session.startTime}
                    </span>
                )}
                {countdown && (
                    <span style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: '#ef4444',
                        background: 'rgba(239,68,68,0.1)',
                        padding: '2px 6px',
                        borderRadius: '999px',
                    }}>
                        SOON
                    </span>
                )}
                {fileUrl && (
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={fileName || 'Attachment'}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#0284c7',
                            textDecoration: 'none',
                            fontWeight: '700',
                            fontSize: '12px',
                            marginLeft: '8px',
                            background: '#e0f2fe',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#bae6fd'}
                        onMouseLeave={(e) => e.target.style.background = '#e0f2fe'}
                    >
                        📎 Download Attachment
                    </a>
                )}
            </div>
            <a
                href={calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '700', fontSize: '12px' }}
            >
                + Calendar
            </a>
        </div>
    );
};

const MyActivities = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('upcoming');
    const { seminars, getUserActivities } = useSeminars();
    const navigate = useNavigate();

    useEffect(() => {
        document.title = "My Activity - UTeM ATech";
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                const userActs = await getUserActivities(currentUser.uid);
                setActivities(userActs);
                setLoading(false);

                // Schedule reminders for active seminars only
                const activeSeminarIds = new Set(seminars.map(s => s.id));
                const activeActs = userActs.filter(act => activeSeminarIds.has(act.seminarId));
                if (getNotificationPermission() === 'granted') {
                    scheduleActivityReminders(activeActs);
                }
            }
        });
        return () => unsubscribe();
    }, [navigate, getUserActivities, seminars]);

    const now = new Date();

    const getSessionDateTime = (session) => {
        if (!session.date || session.date === 'TBA') return new Date(0);
        const timeStr = session.startTime || '00:00';
        try {
            const [year, month, day] = session.date.split('-').map(Number);
            const [hours, minutes] = timeStr.split(':').map(Number);
            return new Date(year, month - 1, day, hours, minutes);
        } catch {
            return new Date(0);
        }
    };

    const isUpcomingActivity = (activity) => {
        if (!activity.sessions || activity.sessions.length === 0) return true;
        return activity.sessions.some(session => getSessionDateTime(session) >= now);
    };

    // Filter out registrations where seminarId is not in active seminars
    const activeSeminarIds = new Set(seminars.map(s => s.id));
    const filteredActivities = activities.filter(act => activeSeminarIds.has(act.seminarId));

    // Separate upcoming and past
    const upcomingActivities = filteredActivities.filter(isUpcomingActivity);
    const pastActivities = filteredActivities.filter(act => !isUpcomingActivity(act));

    // Sort upcoming ascending by minimum session start time
    const getMinSessionTime = (activity) => {
        if (!activity.sessions || activity.sessions.length === 0) return 0;
        const times = activity.sessions.map(s => getSessionDateTime(s).getTime());
        return Math.min(...times);
    };
    upcomingActivities.sort((a, b) => getMinSessionTime(a) - getMinSessionTime(b));

    // Sort past descending by maximum session start time
    const getMaxSessionTime = (activity) => {
        if (!activity.sessions || activity.sessions.length === 0) return 0;
        const times = activity.sessions.map(s => getSessionDateTime(s).getTime());
        return Math.max(...times);
    };
    pastActivities.sort((a, b) => getMaxSessionTime(b) - getMaxSessionTime(a));

    const displayedActivities = activeTab === 'upcoming' ? upcomingActivities : pastActivities;

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container page-content" style={{ paddingTop: '100px', paddingBottom: '80px' }}>

                {/* Page header */}
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '800',
                        color: 'var(--text-dark)',
                        letterSpacing: '-0.03em',
                        marginBottom: '6px',
                    }}>
                        My Activity
                    </h1>
                    <p style={{ color: 'var(--text-light)', fontSize: '15px' }}>
                        Your registered sessions and upcoming reminders
                    </p>
                </div>

                {loading ? (
                    <div className="flex-center" style={{ height: '40vh' }}>
                        <div className="spinner" />
                    </div>
                ) : (
                    <>
                        {/* Segmented Control */}
                        <div style={{
                            display: 'inline-flex',
                            background: '#f3f4f6',
                            padding: '4px',
                            borderRadius: '999px',
                            position: 'relative',
                            marginBottom: '28px',
                            border: '1px solid #e5e7eb',
                            width: '100%',
                            maxWidth: '280px'
                        }}>
                            {/* Sliding pill */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: activeTab === 'upcoming' ? '4px' : 'calc(50%)',
                                width: 'calc(50% - 4px)',
                                background: '#ffffff',
                                borderRadius: '999px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                                transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 1,
                            }} />
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '50%',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: activeTab === 'upcoming' ? '#111827' : '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '999px',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '50%',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: activeTab === 'past' ? '#111827' : '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '999px',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Past
                            </button>
                        </div>

                        {displayedActivities.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '60px 24px',
                                background: 'white',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--border-color)',
                                boxShadow: 'var(--shadow-sm)',
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                                <h2 style={{ fontSize: '22px', marginBottom: '12px', color: 'var(--text-dark)', fontWeight: '700' }}>
                                    {activeTab === 'upcoming' ? 'No Upcoming Activities' : 'No Past Activities'}
                                </h2>
                                <p style={{ color: 'var(--text-light)', marginBottom: '28px', fontSize: '16px' }}>
                                    {activeTab === 'upcoming' 
                                        ? "You don't have any upcoming registered activities." 
                                        : "You don't have any past registered activities."}
                                </p>
                                <button className="btn btn-primary" onClick={() => navigate('/explore')}>
                                    Find Activities
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {displayedActivities.map(activity => (
                                    <div key={activity.id} style={{
                                        background: 'white',
                                        borderRadius: 'var(--radius-lg)',
                                        overflow: 'hidden',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: 'var(--shadow-sm)',
                                    }}>
                                        {/* Banner card on top */}
                                        <MyActivityCard activity={activity} />

                                        {/* Sessions below */}
                                        <div style={{ padding: '20px 20px 20px' }}>
                                            <p style={{
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                color: 'var(--text-muted)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                marginBottom: '10px',
                                            }}>
                                                Registered Sessions
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {activity.sessions && activity.sessions.map((session, idx) => (
                                                    <SessionRow key={idx} session={session} activity={activity} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MyActivities;
