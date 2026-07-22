import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ActivityCard from '../components/ActivityCard';
import { useSeminars } from '../context/SeminarContext';
import { useTrainers } from '../context/TrainerContext';
import { LAUNCH_PROGRAMME, PUBLICATIONS, QUICK_TRAINING_FILTERS, TRAINING_CATEGORIES } from '../data/atechContent';
import { parseSessionDate } from '../utils/notifications';

const heroImage = 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1800&q=85';

const Home = () => {
    const navigate = useNavigate();
    const { seminars } = useSeminars();
    const { trainers } = useTrainers();

    useEffect(() => {
        document.title = 'ATech UTeM - Engineering Professional Development Hub';
    }, []);

    const launchCard = {
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
        banner: heroImage
    };

    const upcoming = (seminars.length ? seminars : [launchCard])
        .filter(item => item.sessions?.some(session => parseSessionDate(session.date, session.startTime) > new Date()) || item.id === 'launch-minitab')
        .slice(0, 6);

    const featuredTrainers = trainers.slice(0, 4);

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />

            <section style={{ minHeight: '92vh', position: 'relative', display: 'flex', alignItems: 'center', color: '#ffffff', overflow: 'hidden' }}>
                <img src={heroImage} alt="Engineering training workshop" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(11,45,92,0.92), rgba(11,45,92,0.62), rgba(11,45,92,0.20))' }} />
                <div className="container" style={{ position: 'relative', zIndex: 1, paddingTop: '120px', paddingBottom: '96px' }}>
                    <p style={{ margin: '0 0 14px', color: '#fed7aa', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>ATech UTeM</p>
                    <h1 style={{ maxWidth: '920px', fontSize: 'clamp(46px, 8vw, 92px)', lineHeight: 0.98, fontWeight: 950, margin: '0 0 24px', letterSpacing: 0 }}>
                        Build Competence. Inspire Innovation. Shape the Future of Engineering.
                    </h1>
                    <p style={{ maxWidth: '680px', fontSize: '20px', lineHeight: 1.65, color: 'rgba(255,255,255,0.9)', margin: '0 0 30px' }}>
                        Discover practical, industry-oriented training led by UTeM academicians and industry experts.
                    </p>
                    <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                        <button className="btn btn-primary" type="button" onClick={() => navigate('/register')} style={{ background: '#f47a20' }}>Explore Training</button>
                        <button className="nav-btn-outline" type="button" onClick={() => navigate('/corporate-training')} style={{ background: '#ffffff', color: '#0b2d5c' }}>Request Corporate Training</button>
                        <button className="nav-btn-outline" type="button" onClick={() => navigate('/create')} style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.5)' }}>Become an Organizer</button>
                    </div>
                </div>
            </section>

            <main>
                <section className="container" style={{ padding: '42px 20px 28px' }}>
                    <div style={{ border: '1px solid #dbe4ef', borderRadius: '8px', padding: '22px', background: '#f8fafc' }}>
                        <input
                            className="form-input"
                            placeholder="Search by programme title, topic, trainer, or keyword"
                            onKeyDown={event => {
                                if (event.key === 'Enter' && event.currentTarget.value.trim()) {
                                    navigate(`/register?search=${encodeURIComponent(event.currentTarget.value.trim())}`);
                                }
                            }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '14px' }}>
                            {QUICK_TRAINING_FILTERS.map(filter => (
                                <button key={filter} type="button" onClick={() => navigate(`/register?search=${encodeURIComponent(filter)}`)} style={{ border: '1px solid #cbd5e1', background: '#ffffff', borderRadius: '999px', padding: '8px 13px', fontWeight: 800, color: '#0b2d5c', cursor: 'pointer' }}>
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="container" style={{ padding: '36px 20px' }}>
                    <SectionHeader title="Featured / Upcoming Training" action="View All Training" onClick={() => navigate('/register')} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                        {upcoming.map(programme => (
                            <ActivityCard
                                key={programme.id}
                                seminar={programme}
                                onClick={() => navigate(`/register/${programme.id}`, { state: { seminar: programme } })}
                            />
                        ))}
                    </div>
                </section>

                <section style={{ background: '#f3f6fa', padding: '50px 0' }}>
                    <div className="container">
                        <SectionHeader title="Training Categories" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                            {TRAINING_CATEGORIES.map(category => (
                                <button key={category} type="button" onClick={() => navigate(`/register?search=${encodeURIComponent(category)}`)} style={{ textAlign: 'left', border: '1px solid #dbe4ef', background: '#ffffff', borderRadius: '8px', padding: '18px', color: '#0b2d5c', fontWeight: 900, cursor: 'pointer' }}>
                                    {category}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="container" style={{ padding: '54px 20px' }}>
                    <SectionHeader title="Why ATech" />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                        {['Professional engineering training', 'Industry-oriented modules', 'Experienced academic and industry trainers', 'Practical hands-on learning', 'Verified training quality', 'UTeM institutional credibility'].map(item => (
                            <div key={item} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', color: '#1f2937', fontWeight: 850 }}>{item}</div>
                        ))}
                    </div>
                </section>

                <section style={{ background: '#0b2d5c', color: '#ffffff', padding: '54px 0' }}>
                    <div className="container">
                        <SectionHeader title="Meet Our Trainers" action="View All Trainers" onClick={() => navigate('/trainers')} dark />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                            {(featuredTrainers.length ? featuredTrainers : [{ name: LAUNCH_PROGRAMME.trainer, title: 'ATech Expert Trainer', description: LAUNCH_PROGRAMME.category }]).map(trainer => (
                                <article key={trainer.id || trainer.name} style={{ border: '1px solid rgba(255,255,255,0.18)', borderRadius: '8px', padding: '18px', background: 'rgba(255,255,255,0.06)' }}>
                                    {trainer.image && <img src={trainer.image} alt={trainer.name} style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', marginBottom: '14px' }} />}
                                    <h3 style={{ margin: '0 0 6px', fontWeight: 900 }}>{trainer.name}</h3>
                                    <p style={{ margin: 0, color: '#bfdbfe' }}>{trainer.title || 'ATech Expert Trainer'}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="container" style={{ padding: '54px 20px' }}>
                    <SectionHeader title="Latest ATech Publications" action="View Publications" onClick={() => navigate('/collection')} />
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        {PUBLICATIONS.map(item => (
                            <article key={item.title} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '20px', background: '#ffffff' }}>
                                <p style={{ color: '#f47a20', fontWeight: 900, margin: '0 0 8px' }}>{item.category} - {item.year}</p>
                                <h3 style={{ color: '#0b2d5c', margin: '0 0 10px', fontWeight: 900 }}>{item.title}</h3>
                                <p style={{ color: '#4b5563', lineHeight: 1.6 }}>{item.description}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section style={{ background: '#f3f6fa', padding: '50px 0' }}>
                    <div className="container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(260px, 0.6fr)', gap: '28px', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: '#0b2d5c', fontSize: '38px', lineHeight: 1.1, fontWeight: 950, margin: '0 0 14px' }}>Training Designed Around Your Organisation.</h2>
                            <p style={{ color: '#4b5563', fontSize: '17px', lineHeight: 1.7 }}>Customised, in-house, online, hybrid, and consultancy-linked training for engineering teams.</p>
                        </div>
                        <button className="btn btn-primary" type="button" onClick={() => navigate('/corporate-training')} style={{ background: '#f47a20' }}>Request Corporate Training</button>
                    </div>
                </section>
            </main>
        </div>
    );
};

const SectionHeader = ({ title, action, onClick, dark = false }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, color: dark ? '#ffffff' : '#0b2d5c', fontSize: '30px', fontWeight: 950 }}>{title}</h2>
        {action && <button type="button" onClick={onClick} className="nav-btn-outline" style={dark ? { color: '#ffffff', borderColor: 'rgba(255,255,255,0.35)' } : undefined}>{action}</button>}
    </div>
);

export default Home;
