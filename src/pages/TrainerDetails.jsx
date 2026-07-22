import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ProfileLayout from '../components/ProfileLayout';
import { useTrainers } from '../context/TrainerContext';
import { useSeminars } from '../context/SeminarContext';
import { FTKE_FACULTY } from '../utils/profileOptions';

const trainerToProfile = (trainer) => ({
    name: trainer.name,
    username: String(trainer.id),
    email: trainer.email || '',
    pfpUrl: trainer.photo && trainer.photo !== 'placeholder' ? trainer.photo : '',
    bannerColor: trainer.banner || '#dbeafe',
    roles: trainer.isCertified
        ? ['ATech Expert Trainer', 'Lecturer']
        : ['Trainer'],
    faculties: trainer.isCertified ? [trainer.faculty || FTKE_FACULTY] : [],
    about: trainer.description || 'No about section has been added yet.',
    location: trainer.location || 'Universiti Teknikal Malaysia Melaka',
    isVerified: trainer.isCertified || trainer.isAccredited,
    isAdmin: trainer.isAdmin === true,
    showExperience: Boolean(trainer.title),
    experience: trainer.title ? [trainer.title] : [],
    showCertifications: trainer.isCertified || trainer.isAccredited,
    certifications: [
        trainer.isCertified || trainer.isAccredited ? 'ATech Expert Trainer' : null
    ].filter(Boolean)
});

const TrainerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { trainers, loading } = useTrainers();
    const { seminars } = useSeminars();

    const trainer = trainers.find(t => t.id === parseInt(id));

    const activities = useMemo(() => {
        if (!trainer) return [];
        return seminars.filter(item => item.organizer?.toLowerCase() === trainer.name.toLowerCase());
    }, [seminars, trainer]);

    const people = useMemo(() => {
        return trainers
            .filter(item => item.id !== trainer?.id)
            .slice(0, 6)
            .map(item => ({
                id: item.id,
                name: item.name,
                title: item.title,
                photo: item.photo && item.photo !== 'placeholder' ? item.photo : '',
                href: `/trainers/${item.id}`
            }));
    }, [trainers, trainer]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff' }}>
                <Navbar />
                <div className="container page-content" style={{ display: 'flex', justifyContent: 'center', paddingTop: '180px' }}>
                    <div className="spinner" />
                </div>
            </div>
        );
    }

    if (!trainer) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff' }}>
                <Navbar />
                <div className="container page-content" style={{ textAlign: 'center', paddingTop: '180px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Trainer not found</h2>
                    <button onClick={() => navigate('/trainers')} className="btn btn-primary">
                        Back to Trainers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <div className="container profile-page-wrap">
                <ProfileLayout
                    profile={trainerToProfile(trainer)}
                    activities={activities}
                    people={people}
                />
            </div>
        </div>
    );
};

export default TrainerDetails;
