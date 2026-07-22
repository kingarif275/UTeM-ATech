import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ActivityCard from '../components/ActivityCard';
import PageTitle from '../components/PageTitle';
import { useSeminars } from '../context/SeminarContext';
import { parseSessionDate } from '../utils/notifications';
import { LAUNCH_PROGRAMME, QUICK_TRAINING_FILTERS, TRAINING_CATEGORIES } from '../data/atechContent';

const Seminars = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { seminars } = useSeminars();
    const query = new URLSearchParams(location.search).get('search') || '';
    const [searchTerm, setSearchTerm] = useState(query);
    const [selectedType, setSelectedType] = useState('All');
    const [selectedQuickFilter, setSelectedQuickFilter] = useState('All');

    useEffect(() => {
        document.title = 'UTeM ATech - Register';
    }, []);

    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    const visibleSeminars = seminars.length ? seminars : [{
        id: 'launch-minitab',
        title: LAUNCH_PROGRAMME.title,
        type: 'Workshop',
        category: LAUNCH_PROGRAMME.category,
        description: LAUNCH_PROGRAMME.overview,
        organizer: LAUNCH_PROGRAMME.trainer,
        locationType: LAUNCH_PROGRAMME.platform,
        price: LAUNCH_PROGRAMME.feeNonStudent,
        studentPrice: LAUNCH_PROGRAMME.feeStudent,
        programmeStatus: LAUNCH_PROGRAMME.status,
        courseCode: LAUNCH_PROGRAMME.code,
        atechVerified: true,
        sessions: [{ name: LAUNCH_PROGRAMME.mode, date: LAUNCH_PROGRAMME.rawDate, startTime: '08:00', endTime: '17:00', quota: 40, registered: 0 }],
        banner: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1400&q=80',
        poster: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80'
    }];

    const filteredSeminars = visibleSeminars.filter(seminar => {
        const title = seminar.title || '';
        const organizer = seminar.organizer || '';
        const category = seminar.category || '';
        const description = seminar.description || '';
        const topics = seminar.topics || '';
        const trainer = seminar.trainer || seminar.organizer || '';
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = title.toLowerCase().includes(searchLower) ||
            organizer.toLowerCase().includes(searchLower) ||
            category.toLowerCase().includes(searchLower) ||
            description.toLowerCase().includes(searchLower) ||
            topics.toLowerCase().includes(searchLower) ||
            trainer.toLowerCase().includes(searchLower);
        const matchesType = selectedType === 'All' || seminar.type === selectedType;
        const quick = selectedQuickFilter;
        const isFree = Number(seminar.price || 0) === 0;
        const isOnline = ['online', 'Online', 'Microsoft Teams', 'Google Meet'].includes(seminar.locationType);
        const matchesQuick = quick === 'All'
            || seminar.type === quick
            || seminar.category === quick
            || (quick === 'Free' && isFree)
            || (quick === 'Paid' && !isFree)
            || (quick === 'Online' && isOnline)
            || (quick === 'Physical' && !isOnline)
            || (quick === 'HRD Corp Claimable' && seminar.hrdCorpClaimable);
        return matchesSearch && matchesType && matchesQuick;
    });

    const upcomingSeminars = visibleSeminars
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
                <header style={{ marginBottom: '48px' }}>
                    <PageTitle eyebrow="Training Registration" title="Register">
                        Reserve seats for ATech Verified training, workshops, seminars, and engineering programmes.
                    </PageTitle>

                    <div style={{ width: '100%', margin: '0 0 24px', position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search by programme, topic, trainer, category, or keyword..."
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

                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {['All', ...QUICK_TRAINING_FILTERS, ...TRAINING_CATEGORIES].map(filter => (
                            <button
                                key={filter}
                                onClick={() => setSelectedQuickFilter(filter)}
                                style={{
                                    padding: '7px 14px',
                                    borderRadius: '999px',
                                    border: '1px solid',
                                    borderColor: selectedQuickFilter === filter ? '#f47a20' : 'var(--border-color)',
                                    background: selectedQuickFilter === filter ? '#fff7ed' : 'white',
                                    color: selectedQuickFilter === filter ? '#9a3412' : 'var(--text-dark)',
                                    cursor: 'pointer',
                                    fontWeight: '700',
                                    fontSize: '12px',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {filter}
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
