import React, { useEffect, useState } from 'react';
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

    return <span className="date-chip countdown countdown-live">{label}</span>;
};

const DateChips = ({ sessions }) => {
    if (!sessions || sessions.length === 0) return null;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            {sessions.slice(0, 2).map((session, index) => (
                isWithin24Hours(session.date, session.startTime) ? (
                    <CountdownChip key={index} dateStr={session.date} timeStr={session.startTime} />
                ) : (
                    <span key={index} className="date-chip">{formatDate(session.date)}</span>
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
    const isOnline = ['online', 'Online', 'Microsoft Teams', 'Google Meet'].includes(seminar.locationType);
    const locationText = isOnline ? (seminar.locationType === 'Microsoft Teams' ? 'Microsoft Teams' : 'Online') : (seminar.location || 'Venue TBA');
    const status = seminar.programmeStatus || 'Open';

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
                        {(seminar.isOrganizerVerified || seminar.atechVerified) && <span className="activity-chip verified">ATech Verified</span>}
                        <span className={`activity-chip ${seminar.price === 0 ? 'free' : 'paid'}`}>
                            {seminar.price === 0 ? 'FREE' : `RM ${seminar.price || 0}`}
                        </span>
                    </div>
                    <DateChips sessions={seminar.sessions || []} />
                </div>

                <div>
                    <h3 className="activity-card-title">{seminar.title || 'Untitled Activity'}</h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <OrganizerAvatar seminar={seminar} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="activity-organizer-name">{seminar.organizer || 'Organizer'}</p>
                            <span className="location-pill">{locationText}</span>
                        </div>
                        <span className="activity-mode-pill">{isOnline ? 'ONLINE' : 'PHYSICAL'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginTop: '14px' }}>
                        <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 900 }}>{status}</span>
                        <span style={{ background: '#f47a20', color: '#ffffff', borderRadius: '999px', padding: '8px 12px', fontSize: '12px', fontWeight: 900 }}>
                            Reserve Your Seat
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;
