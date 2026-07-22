import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PageTitle from '../components/PageTitle';
import { useTrainers } from '../context/TrainerContext';

const TrainerProfiles = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { trainers, loading } = useTrainers();
    const searchQuery = new URLSearchParams(location.search).get('search') || '';
    const filteredTrainers = trainers.filter(trainer => {
        const query = searchQuery.toLowerCase();
        return !query ||
            trainer.name?.toLowerCase().includes(query) ||
            trainer.title?.toLowerCase().includes(query) ||
            trainer.description?.toLowerCase().includes(query);
    });

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff' }}>
                <Navbar />
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                    <div style={{ fontSize: '20px', color: 'var(--text-light)', fontWeight: '600' }}>Loading expert trainers...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            
            <div className="container page-content" style={{ paddingBottom: '60px' }}>
                <PageTitle eyebrow="ATech Experts" title="Trainers" align="center">
                        Meet the industry leaders and academic pioneers who guide our training programs with expertise and passion.
                </PageTitle>

                <div className="grid-container" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                    gap: '32px' 
                }}>
                    {filteredTrainers.map(trainer => {
                        const finalPhotoUrl = trainer.photo && trainer.photo !== 'placeholder' 
                            ? trainer.photo 
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(trainer.name)}&background=random&color=fff`;

                        return (
                        <div 
                            key={trainer.id} 
                            onClick={() => navigate(`/trainers/${trainer.id}`)}
                            style={{
                                position: 'relative',
                                aspectRatio: '1 / 1.15',
                                borderRadius: '24px',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                background: trainer.banner || '#1a1a1a'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Gradient Overlay */}
                            <div style={{ 
                                position: 'absolute', 
                                inset: 0, 
                                background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0) 100%)', 
                                zIndex: 1 
                            }}></div>

                            {/* Top Right Tags */}
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                display: 'flex',
                                gap: '8px',
                                zIndex: 2
                            }}>
                                {(trainer.isCertified || trainer.isAccredited) && (
                                    <span style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        backdropFilter: 'blur(10px)',
                                        padding: '6px 12px',
                                        borderRadius: '999px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}>
                                        ATech Expert Trainer
                                    </span>
                                )}
                            </div>

                            {/* Content Block */}
                            <div style={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                left: 0, 
                                right: 0, 
                                padding: '24px', 
                                zIndex: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'flex-end',
                                alignItems: 'flex-start'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <img 
                                        src={finalPhotoUrl} 
                                        alt={trainer.name} 
                                        style={{ 
                                            width: '64px', 
                                            height: '64px', 
                                            borderRadius: '16px', 
                                            objectFit: 'cover',
                                        }} 
                                    />
                                    <span style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        backdropFilter: 'blur(4px)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        color: 'white',
                                        textTransform: 'uppercase'
                                    }}>
                                        Expert Trainer
                                    </span>
                                </div>

                                <div style={{ width: '100%' }}>
                                    <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px', lineHeight: '1.2' }}>
                                        {trainer.name}
                                    </h3>
                                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '15px', fontWeight: '600', marginBottom: '8px' }}>
                                        {trainer.title}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '14px', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {trainer.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )})}
                </div>
            </div>
        </div>
    );
};

export default TrainerProfiles;
