import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { MdOutlineLocalActivity, MdOutlineLibraryBooks, MdOutlineKeyboardArrowRight } from 'react-icons/md';
import { ensureUserProfile } from '../utils/userProfiles';

const CreateChoice = () => {
    const navigate = useNavigate();
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        document.title = "UTeM ATech - Choose Category";
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                ensureUserProfile(currentUser).then((profile) => {
                    setIsVerified(profile?.isVerified === true || profile?.isAdmin === true);
                    setLoading(false);
                }).catch(() => {
                    setLoading(false);
                });
            } else {
                setLoading(false);
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div style={{ background: '#ffffff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ border: '3px solid #f3f3f3', borderTop: '3px solid #000000', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const activityTypes = [
        { name: 'Seminar', desc: 'Host an educational technical seminar', val: 'Seminar', bgImage: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80' },
        { name: 'Event', desc: 'Host a verified activity or event', val: 'Event', bgImage: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80' },
        { name: 'Workshop', desc: 'Hands-on practical training session', val: 'Workshop', bgImage: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=900&q=80' },
        { name: 'Conference', desc: 'Large scale technical conference', val: 'Conference', bgImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80' },
        { name: 'Webinar', desc: 'Live online virtual session', val: 'Webinar', bgImage: 'https://images.unsplash.com/photo-1591115763573-09c9130f95f1?auto=format&fit=crop&w=900&q=80' },
        { name: 'Meetup', desc: 'Community gathering and networking', val: 'Meetup', bgImage: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=900&q=80' }
    ];

    const collectionTypes = [
        { name: 'Books', desc: 'Digital books and textbook references', bgImage: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80' },
        { name: 'Document', desc: 'Official documentation and guidelines', bgImage: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80' },
        { name: 'Notes', desc: 'Lecture, study and summary notes', bgImage: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=900&q=80' },
        { name: 'Slides', desc: 'Presentation slides and materials', bgImage: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=900&q=80' },
        { name: 'References', desc: 'Cheatsheets, codes and frameworks', bgImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80' },
        { name: 'Past Year Papers', desc: 'Previous exam papers and solutions', bgImage: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=900&q=80' }
    ];

    const handleActivityClick = (type) => {
        if (type === 'Event' && !isVerified) {
            alert('Only verified organizers can create Events.');
            return;
        }
        navigate(`/post-seminar?type=${type}`);
    };

    const handleCollectionClick = (category) => {
        if (!isVerified) {
            alert('Only verified (certified) users can add Collections / Sources.');
            return;
        }
        navigate(`/post-collection?category=${category}`);
    };

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
                <div style={{ textAlign: 'left', marginBottom: '48px', maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '12px' }}>Create New Resource</h1>
                    <p style={{ fontSize: '18px', color: '#666666' }}>
                        Choose what resource you want to publish.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: '48px', maxWidth: '1180px' }}>
                    
                    {/* Activity Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{ background: '#f3f4f6', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MdOutlineLocalActivity size={24} color="#000" />
                            </div>
                            <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Activity</h2>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
                            {activityTypes.map((act) => (
                                <div
                                    key={act.name}
                                    onClick={() => handleActivityClick(act.val)}
                                    style={{
                                        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.42)), url(${act.bgImage})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        borderRadius: '16px',
                                        minHeight: '135px',
                                        padding: '20px',
                                        border: '1px solid rgba(255,255,255,0.16)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        transition: 'all 0.2s ease-in-out',
                                        color: '#ffffff'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'none';
                                        e.currentTarget.style.boxShadow = 'none';
                                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
                                    }}
                                >
                                    <div style={{ flex: 1, paddingRight: '12px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#ffffff' }}>{act.name}</h3>
                                            {act.name === 'Event' && !isVerified && (
                                                <span style={{ fontSize: '10px', fontWeight: 'bold', background: 'rgba(255,255,255,0.22)', color: '#ffffff', padding: '2px 6px', borderRadius: '999px' }}>Verified Only</span>
                                            )}
                                        </div>
                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.82)', margin: '4px 0 0 0' }}>{act.desc}</p>
                                    </div>
                                    <MdOutlineKeyboardArrowRight size={20} color="rgba(255,255,255,0.78)" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Collection Section */}
                    {isVerified && (
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: '#f3f4f6', width: '48px', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <MdOutlineLibraryBooks size={24} color="#000" />
                                </div>
                                <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0 }}>Collection (Sources)</h2>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', position: 'relative' }}>
                                {collectionTypes.map((coll) => (
                                    <div
                                        key={coll.name}
                                        onClick={() => handleCollectionClick(coll.name)}
                                        style={{
                                            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.78), rgba(0,0,0,0.42)), url(${coll.bgImage})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            borderRadius: '16px',
                                            minHeight: '135px',
                                            padding: '20px',
                                            border: '1px solid rgba(255,255,255,0.16)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            transition: 'all 0.2s ease-in-out',
                                            color: '#ffffff'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)';
                                        }}
                                    >
                                        <div style={{ flex: 1, paddingRight: '12px' }}>
                                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#ffffff' }}>{coll.name}</h3>
                                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.82)', margin: '4px 0 0 0' }}>{coll.desc}</p>
                                        </div>
                                        <MdOutlineKeyboardArrowRight size={20} color="rgba(255,255,255,0.78)" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default CreateChoice;
