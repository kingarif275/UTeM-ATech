import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useSeminars } from '../context/SeminarContext';
import { parseSessionDate } from '../utils/notifications';

const imageSet = {
    seminar: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80',
    webTech: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    organizer: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80',
    registration: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    certificate: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1200&q=80',
};

const Home = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const { seminars } = useSeminars();

    useEffect(() => {
        document.title = 'UTeM ATech - Home';
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    const features = [
        {
            title: 'Discover New Seminars',
            description: 'Browse a curated catalog of industry-leading seminars provided by UTeM, ATech, and other featured partners to boost your career. Find exactly what you need to upskill.',
            mockup: (
                <div style={{ background: '#ffffff', borderRadius: '28px', border: '1px solid #e2e8f0', boxShadow: '0 24px 52px rgba(15,23,42,0.10)', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ minHeight: '185px', backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.10), rgba(15,23,42,0.42)), url(${imageSet.seminar})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ padding: '5px 12px', background: '#eef2ff', color: '#4338ca', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>INDUSTRY SEMINAR</span>
                            <span style={{ padding: '5px 12px', background: '#fff7ed', color: '#c2410c', borderRadius: '999px', fontSize: '12px', fontWeight: 700 }}>WEB DEV</span>
                        </div>
                        <h3 style={{ fontSize: '24px', lineHeight: 1.2, color: '#111827', margin: 0 }}>Next-Gen Web Technologies Masterclass</h3>
                        <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: 0 }}>Learn from ATech industry experts and explore modern front-end frameworks.</p>
                        <div style={{ display: 'grid', gap: '10px', color: '#475569', fontSize: '14px' }}>
                            <span>Oct 24, 2026 - 9:00 AM to 4:00 PM</span>
                            <span>UTeM Main Campus, Auditorium A</span>
                            <span>Dr. Ahmad Faris, Head of ATech</span>
                        </div>
                        <button style={{ width: '100%', padding: '14px', background: '#2563eb', color: '#ffffff', border: 0, borderRadius: '14px', fontSize: '15px', fontWeight: 700, fontFamily: 'inherit', cursor: 'default', boxShadow: '0 12px 24px rgba(37,99,235,0.24)' }}>
                            Register for Activity &gt;
                        </button>
                    </div>
                </div>
            ),
        },
        {
            title: 'Host Your Own Training',
            description: 'Are you an industry expert? Easily create event listings, manage registrations, set ticket pricing, and grow your audience all from a single dashboard.',
            mockup: (
                <div style={{ position: 'relative', background: '#111827', borderRadius: '28px', padding: '32px', color: '#ffffff', boxShadow: '0 24px 52px rgba(15,23,42,0.18)', minHeight: '330px', overflow: 'hidden', height: '100%' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, rgba(15,23,42,0.96), rgba(15,23,42,0.80)), url(${imageSet.organizer})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.96 }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '18px', fontWeight: 700 }}>Organizer Dashboard</div>
                            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundImage: `url(${imageSet.seminar})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '2px solid rgba(255,255,255,0.28)' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ background: 'rgba(30,41,59,0.78)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(148,163,184,0.28)' }}>
                                <div style={{ fontSize: '12px', color: '#bfdbfe', marginBottom: '8px' }}>Total Sales</div>
                                <div style={{ fontSize: '26px', fontWeight: 800 }}>RM 4,200</div>
                            </div>
                            <div style={{ background: 'rgba(30,41,59,0.78)', borderRadius: '16px', padding: '18px', border: '1px solid rgba(148,163,184,0.28)' }}>
                                <div style={{ fontSize: '12px', color: '#bfdbfe', marginBottom: '8px' }}>Registrations</div>
                                <div style={{ fontSize: '26px', fontWeight: 800 }}>128</div>
                            </div>
                        </div>
                        <div style={{ background: '#2563eb', padding: '14px', borderRadius: '12px', textAlign: 'center', fontWeight: 700, fontSize: '14px' }}>
                            + Create New Event
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Secure Your Spot Instantly',
            description: "Don't miss out. Register for premium workshops in just two clicks. Choose between online or physical tracking sessions effortlessly and receive instant email confirmations.",
            mockup: (
                <div style={{ background: '#ffffff', borderRadius: '28px', padding: '22px', border: '1px solid #e2e8f0', boxShadow: '0 24px 52px rgba(15,23,42,0.10)', minHeight: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ minHeight: '118px', borderRadius: '20px', backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.12), rgba(15,23,42,0.44)), url(${imageSet.registration})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '22px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
                            <div>
                                <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>React Advanced Trends</div>
                                <div style={{ fontSize: '14px', color: '#64748b' }}>Online Session</div>
                            </div>
                            <div style={{ fontWeight: 800 }}>RM 49.00</div>
                        </div>
                        <button style={{ width: '100%', background: '#10b981', color: '#ffffff', border: 'none', padding: '14px', borderRadius: '14px', fontWeight: 800, fontSize: '15px', fontFamily: 'inherit', cursor: 'default' }}>
                            Registration Confirmed
                        </button>
                    </div>
                </div>
            ),
        },
        {
            title: 'Earn Validated Certificates',
            description: 'Upon completing designated paths, receive official digital certificates validated by UTeM directly to your profile. Share them on LinkedIn to showcase your expertise.',
            mockup: (
                <div style={{ position: 'relative', borderRadius: '28px', padding: '52px 32px', boxShadow: '0 24px 52px rgba(15,23,42,0.10)', minHeight: '330px', overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(135deg, rgba(250,245,255,0.90), rgba(237,233,254,0.86)), url(${imageSet.certificate})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                    <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '340px', background: 'rgba(255,255,255,0.92)', borderRadius: '20px', padding: '26px', boxShadow: '0 20px 42px rgba(124,58,237,0.16)', border: '1px solid rgba(196,181,253,0.70)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Certificate of Completion</div>
                            <div style={{ width: '36px', height: '36px', background: '#7c3aed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '12px', fontWeight: 800 }}>OK</div>
                        </div>
                        <div style={{ fontSize: '19px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>Advanced Web Development</div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '18px' }}>Issued by UTeM and ATech - April 2026</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1, background: '#f3e8ff', borderRadius: '10px', padding: '9px', textAlign: 'center', fontSize: '12px', color: '#7c3aed', fontWeight: 700 }}>Share</div>
                            <div style={{ flex: 1, background: '#f8fafc', borderRadius: '10px', padding: '9px', textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: 700 }}>Skill validation</div>
                        </div>
                    </div>
                </div>
            ),
        },
    ];

    const upcomingSeminars = seminars
        .filter(seminar => seminar.sessions?.some(session => parseSessionDate(session.date, session.startTime) > new Date()))
        .sort((a, b) => {
            const aIsEvent = a.type === 'Event' ? 0 : 1;
            const bIsEvent = b.type === 'Event' ? 0 : 1;
            if (aIsEvent !== bIsEvent) return aIsEvent - bIsEvent;

            const firstDate = (seminar) => seminar.sessions
                ?.map(session => parseSessionDate(session.date, session.startTime))
                .filter(Boolean)
                .sort((left, right) => left - right)[0]?.getTime() || Number.MAX_SAFE_INTEGER;
            return firstDate(a) - firstDate(b);
        })
        .slice(0, 6);

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', overflow: 'hidden' }}>
            <Navbar />

            <section className="home-video-hero" aria-label="Welcome to UTeM ATech">
                <video
                    className="home-video-hero-media"
                    src="/assets/animated_banner_video.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                />
                <div className="home-video-hero-overlay" />
                <div className="home-video-hero-content">
                    <h1>Welcome to UTeM ATech</h1>
                    <p>
                        Discover UTeM training, seminars, workshops, and learning resources built for students, lecturers, trainers, and industry partners.
                    </p>
                </div>
            </section>

            {upcomingSeminars.length > 0 && (
                <section className="home-upcoming-section" aria-label="Upcoming activities">
                    <div className="home-upcoming-header">
                        <h2>Upcoming Activities</h2>
                        <button type="button" onClick={() => navigate('/explore')}>
                            Explore all
                        </button>
                    </div>
                    <div className="explore-upcoming-banner home-upcoming-banner">
                        {upcomingSeminars.map((seminar, index) => (
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
                                <small>{seminar.sessions?.[0]?.date || 'Date TBA'} - {seminar.sessions?.[0]?.name || 'Upcoming session'}</small>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <main className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">
                        Empower Your Career with Expert Training
                    </h1>
                    <p className="hero-desc">
                        Join the premier platform by UTeM and ATech for discovering and hosting industry-leading seminars. Enhance your skills or share your expertise with our growing professional community.
                    </p>

                    <div className="hero-buttons">
                        {user ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '16px', fontWeight: '500', color: '#1a1a1a' }}>
                                    Welcome back, {user.displayName || user.email.split('@')[0]}!
                                </span>
                                <button
                                    onClick={() => navigate('/explore')}
                                    style={{
                                        padding: '12px 32px',
                                        borderRadius: '999px',
                                        backgroundColor: '#1a1a1a',
                                        color: '#ffffff',
                                        fontWeight: '500',
                                        border: 'none',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseOver={e => e.target.style.backgroundColor = '#333'}
                                    onMouseOut={e => e.target.style.backgroundColor = '#1a1a1a'}
                                >
                                    Explore Seminars
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => navigate('/signup')}
                                    style={{
                                        padding: '12px 32px',
                                        borderRadius: '999px',
                                        backgroundColor: '#1a1a1a',
                                        color: '#ffffff',
                                        fontWeight: '500',
                                        border: 'none',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseOver={e => e.target.style.backgroundColor = '#333'}
                                    onMouseOut={e => e.target.style.backgroundColor = '#1a1a1a'}
                                >
                                    Get Started
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        padding: '12px 32px',
                                        borderRadius: '999px',
                                        backgroundColor: 'transparent',
                                        color: '#1a1a1a',
                                        fontWeight: '500',
                                        border: '1px solid #e5e5e5',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'border-color 0.2s',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseOver={e => e.target.style.borderColor = '#1a1a1a'}
                                    onMouseOut={e => e.target.style.borderColor = '#e5e5e5'}
                                >
                                    Log In
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="hero-image-container">
                    <div
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            width: '100%',
                            maxWidth: '420px',
                            backgroundColor: '#ffffff',
                            borderRadius: '28px',
                            boxShadow: '0 24px 48px rgba(0,20,50,0.12), 0 2px 8px rgba(0,20,50,0.05), inset 0 0 0 1px rgba(0,0,0,0.05)',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            transform: 'rotate(-2deg) translateY(-10px)',
                            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'rotate(0deg) translateY(-15px)';
                            e.currentTarget.style.boxShadow = '0 32px 64px rgba(0,30,80,0.15), 0 4px 12px rgba(0,30,80,0.08)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'rotate(-2deg) translateY(-10px)';
                            e.currentTarget.style.boxShadow = '0 24px 48px rgba(0,20,50,0.12), 0 2px 8px rgba(0,20,50,0.05)';
                        }}
                    >
                        <div style={{ height: '190px', backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.04), rgba(15,23,42,0.42)), url(${imageSet.webTech})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                        <div style={{ padding: '32px 28px' }}>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                <span style={{ padding: '4px 12px', backgroundColor: '#eef2ff', color: '#4338ca', fontSize: '13px', fontWeight: '600', borderRadius: '999px' }}>INDUSTRY SEMINAR</span>
                                <span style={{ padding: '4px 12px', backgroundColor: '#fff7ed', color: '#c2410c', fontSize: '13px', fontWeight: '600', borderRadius: '999px' }}>WEB DEV</span>
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#111827', lineHeight: '1.3' }}>
                                Next-Gen Web Technologies Masterclass
                            </h3>
                            <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
                                Learn directly from ATech industry experts. Discover modern front-end frameworks and the future of AI-driven development.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4b5563', fontSize: '14px' }}>
                                    <span>Oct 24, 2026 - 9:00 AM to 4:00 PM</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4b5563', fontSize: '14px' }}>
                                    <span>UTeM Main Campus, Auditorium A</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#4b5563', fontSize: '14px' }}>
                                    <span>Dr. Ahmad Faris, Head of ATech</span>
                                </div>
                            </div>
                            <button style={{
                                width: '100%',
                                padding: '14px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                borderRadius: '14px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'default',
                                boxShadow: '0 4px 6px rgba(37, 99, 235, 0.25)',
                                fontFamily: 'inherit',
                            }}>
                                Register for Activity &gt;
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {features.map((feature, index) => (
                <section key={index} className="feature-section">
                    <div
                        className="feature-container"
                        style={{ flexDirection: index % 2 === 0 ? 'row' : 'row-reverse' }}
                    >
                        <div className="feature-text-block">
                            <h2 className="feature-title">
                                {feature.title}
                            </h2>
                            <p className="feature-desc">
                                {feature.description}
                            </p>
                        </div>
                        <div className="feature-mockup-container">
                            {feature.mockup}
                        </div>
                    </div>
                </section>
            ))}
        </div>
    );
};

export default Home;
