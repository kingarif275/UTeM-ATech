import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useSeminars } from '../context/SeminarContext';
import { getAvatarColor, getInitials } from '../utils/avatar';
import { getCountdownString, isWithin24Hours, parseSessionDate } from '../utils/notifications';

const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'TBA') return 'TBA';
    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (Number.isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
        return dateStr;
    }
};

const CountdownChip = ({ dateStr, timeStr }) => {
    const [, forceUpdate] = useState(0);

    useEffect(() => {
        const tick = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(tick);
    }, []);

    const sessionDate = parseSessionDate(dateStr, timeStr);
    const label = sessionDate ? getCountdownString(sessionDate) : '-';

    return (
        <span className="date-chip countdown countdown-live">
            {label}
        </span>
    );
};

const DateChips = ({ sessions }) => {
    if (!sessions || sessions.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {sessions.slice(0, 2).map((session, index) => (
                isWithin24Hours(session.date, session.startTime) ? (
                    <CountdownChip key={index} dateStr={session.date} timeStr={session.startTime} />
                ) : (
                    <span key={index} className="date-chip">
                        {formatDate(session.date)}
                    </span>
                )
            ))}
        </div>
    );
};

const OrganizerAvatar = ({ seminar }) => {
    const organizer = seminar.organizer || 'Organizer';
    if (seminar.logo) {
        return <img src={seminar.logo} alt={organizer} className="organizer-avatar" />;
    }

    return (
        <span className="organizer-avatar organizer-avatar-fallback" style={{ background: getAvatarColor(organizer) }}>
            {getInitials(organizer)}
        </span>
    );
};

const ActivityCard = ({ seminar, onClick }) => {
    const bgUrl = seminar.poster || seminar.banner;
    const isOnline = ['online', 'Online', 'Google Meet'].includes(seminar.locationType);
    const locationText = isOnline ? 'Online' : (seminar.location || 'Venue TBA');

    return (
        <div
            className="activity-card"
            style={{ aspectRatio: '4 / 5' }}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={event => event.key === 'Enter' && onClick?.()}
        >
            {bgUrl ? (
                <img
                    src={bgUrl}
                    alt={seminar.title}
                    className="activity-card-bg"
                    onError={event => { event.currentTarget.style.display = 'none'; }}
                />
            ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e3c72, #2a5298)' }} />
            )}

            <div className="activity-card-gradient" />

            <div className="activity-card-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span className="activity-chip">{seminar.type || 'Seminar'}</span>
                        <span className={`activity-chip ${seminar.price === 0 ? 'free' : 'paid'}`}>
                            {seminar.price === 0 ? 'FREE' : `RM ${seminar.price || 0}`}
                        </span>
                    </div>
                    <DateChips sessions={seminar.sessions || []} />
                </div>

                <div>
                    <h3 className="activity-card-title">
                        {seminar.title || 'Untitled Activity'}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <OrganizerAvatar seminar={seminar} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="activity-organizer-name">{seminar.organizer || 'Organizer'}</p>
                            <span className="location-pill">{locationText}</span>
                        </div>
                        <span className="activity-mode-pill">
                            {isOnline ? 'ONLINE' : 'PHYSICAL'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Seminars = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { seminars } = useSeminars();
    const query = new URLSearchParams(location.search).get('search') || '';
    const [searchTerm, setSearchTerm] = useState(query);
    const [selectedType, setSelectedType] = useState('All');

    useEffect(() => {
        document.title = 'UTeM ATech - Explore';
    }, []);

    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    const filteredSeminars = seminars.filter(seminar => {
        const title = seminar.title || '';
        const organizer = seminar.organizer || '';
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = title.toLowerCase().includes(searchLower) ||
            organizer.toLowerCase().includes(searchLower);
        const matchesType = selectedType === 'All' || seminar.type === selectedType;
        return matchesSearch && matchesType;
    });

    const upcomingSeminars = seminars
        .filter(seminar => seminar.sessions?.some(session => parseSessionDate(session.date, session.startTime) > new Date()))
        .sort((a, b) => {
            const aIsEvent = a.type === 'Event' ? 0 : 1;
            const bIsEvent = b.type === 'Event' ? 0 : 1;
            if (aIsEvent !== bIsEvent) return aIsEvent - bIsEvent;

            const now = new Date();
            const inCurrentMonth = (seminar) => seminar.sessions?.some(session => {
                const date = parseSessionDate(session.date, session.startTime);
                return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
            });
            const aMonthRank = inCurrentMonth(a) ? 0 : 1;
            const bMonthRank = inCurrentMonth(b) ? 0 : 1;
            if (aMonthRank !== bMonthRank) return aMonthRank - bMonthRank;

            const firstDate = (seminar) => seminar.sessions
                ?.map(session => parseSessionDate(session.date, session.startTime))
                .filter(Boolean)
                .sort((left, right) => left - right)[0]?.getTime() || Number.MAX_SAFE_INTEGER;
            return firstDate(a) - firstDate(b);
        })
        .slice(0, 12);

    const activityTypes = ['All', 'Event', 'Seminar', 'Workshop', 'Conference', 'Webinar', 'Meetup'];

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <div className="container page-content" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <header style={{ textAlign: 'left', marginBottom: '48px' }}>
                    <h1 className="hero-title" style={{
                        fontSize: '48px',
                        fontWeight: '800',
                        marginBottom: '14px',
                        color: 'var(--text-dark)',
                        letterSpacing: '-0.03em',
                    }}>
                        Explore
                    </h1>
                    <p className="hero-subtitle" style={{
                        fontSize: '18px',
                        color: 'var(--text-light)',
                        marginBottom: '36px',
                        maxWidth: '640px',
                        margin: '0 0 36px',
                        lineHeight: '1.6',
                    }}>
                        Explore activities, seminars, workshops, and conferences from top organizers.
                    </p>

                    <div style={{ width: '100%', margin: '0 0 24px', position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search by topic or organizer..."
                            className="form-input"
                            style={{
                                padding: '14px 52px 14px 20px',
                                borderRadius: '999px',
                                fontSize: '16px',
                                width: '100%',
                                border: '1.5px solid var(--border-color)',
                            }}
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                        <button className="explore-search-button" type="button" title="Search">
                            <MdSearchIcon />
                        </button>
                    </div>

                    {upcomingSeminars.length > 0 && (
                        <div className="explore-upcoming-banner">
                            {upcomingSeminars.slice(0, 6).map((seminar, index) => (
                                <button
                                    key={seminar.id}
                                    type="button"
                                    className="explore-upcoming-slide"
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.82), rgba(15,23,42,0.18)), url(${seminar.banner || seminar.poster})`,
                                        animationDelay: `${index * 5}s`,
                                    }}
                                    onClick={() => navigate(`/register/${seminar.id}`, { state: { seminar } })}
                                >
                                    <span>{seminar.type || 'Activity'}</span>
                                    <strong>{seminar.title || 'Untitled Activity'}</strong>
                                    <small>{seminar.sessions?.[0]?.date || 'Date TBA'} · {seminar.sessions?.[0]?.name || 'Upcoming session'}</small>
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {activityTypes.map(type => (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                style={{
                                    padding: '8px 18px',
                                    borderRadius: '999px',
                                    border: '1.5px solid',
                                    borderColor: selectedType === type ? 'var(--primary-color)' : 'var(--border-color)',
                                    background: selectedType === type ? 'var(--primary-color)' : 'white',
                                    color: selectedType === type ? 'white' : 'var(--text-dark)',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </header>

                <div className="grid-container" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '24px',
                }}>
                    {filteredSeminars.map(seminar => (
                        <ActivityCard
                            key={seminar.id}
                            seminar={seminar}
                            onClick={() => navigate(`/register/${seminar.id}`, { state: { seminar } })}
                        />
                    ))}
                </div>

                {filteredSeminars.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '80px 0' }}>
                        <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No activities found</p>
                        <p style={{ fontSize: '14px' }}>Try adjusting your search or filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const MdSearchIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

export default Seminars;
