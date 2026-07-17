import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import { MdOutlineSearch, MdOutlineShield, MdOutlineVerified } from 'react-icons/md';
import Navbar from '../components/Navbar';
import { db } from '../firebase';
import { useTrainers } from '../context/TrainerContext';
import { getAvatarColor, getInitials } from '../utils/avatar';
import { FTKE_FACULTY, facultyOptions, getFacultyCode } from '../utils/profileOptions';

const normalizeUserProfile = (profile, uid) => ({
    id: uid,
    uid,
    type: 'user',
    name: profile?.name || profile?.email || 'UTeM ATech User',
    email: profile?.email || '',
    photo: profile?.pfpUrl || '',
    roles: Array.isArray(profile?.roles) && profile.roles.length ? profile.roles : ['Learner'],
    faculties: Array.isArray(profile?.faculties) ? profile.faculties : [],
    isVerified: profile?.isVerified === true || profile?.isAdmin === true,
    isAdmin: profile?.isAdmin === true,
    href: `/profile/${uid}`
});

const normalizeTrainerProfile = (trainer) => ({
    id: `trainer-${trainer?.id || trainer?.name || 'unknown'}`,
    type: 'trainer',
    name: trainer?.name || 'Certified Trainer',
    email: trainer?.email || '',
    photo: trainer?.photo && trainer.photo !== 'placeholder' ? trainer.photo : '',
    roles: Array.isArray(trainer?.roles) && trainer.roles.length ? trainer.roles : ['Expert Trainer', 'Certified Trainer', 'Lecturer'],
    faculties: [trainer?.faculty || FTKE_FACULTY],
    isVerified: trainer?.isCertified || trainer?.isAccredited,
    isAdmin: trainer?.isAdmin === true,
    href: `/trainers/${trainer?.id}`
});

const UserAvatar = ({ person }) => {
    if (person.photo) {
        return <img src={person.photo} alt={person.name} className="users-avatar" />;
    }

    return (
        <span className="users-avatar users-avatar-fallback" style={{ background: getAvatarColor(person.email || person.name) }}>
            {getInitials(person.name)}
        </span>
    );
};

const Users = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const trainerContext = useTrainers();
    const trainers = useMemo(
        () => Array.isArray(trainerContext?.trainers) ? trainerContext.trainers : [],
        [trainerContext]
    );
    const initialSearch = new URLSearchParams(location.search).get('search') || '';
    const initialTag = new URLSearchParams(location.search).get('tag') || '';
    const [profiles, setProfiles] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedRole, setSelectedRole] = useState(['Trainer', 'Student'].includes(initialTag) ? initialTag : '');
    const [selectedFaculty, setSelectedFaculty] = useState(initialTag && !['Trainer', 'Student'].includes(initialTag) ? initialTag : '');

    useEffect(() => {
        document.title = 'UTeM ATech - Users';
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tag = params.get('tag') || '';
        setSearchTerm(params.get('search') || '');
        setSelectedRole(['Trainer', 'Student'].includes(tag) ? tag : '');
        setSelectedFaculty(tag && !['Trainer', 'Student'].includes(tag) ? tag : '');
    }, [location.search]);

    useEffect(() => {
        let active = true;
        get(ref(db, 'users'))
            .then(snapshot => {
                if (!active) return;
                setLoadError('');
                if (!snapshot.exists()) {
                    setProfiles([]);
                    return;
                }
                const data = snapshot.val() || {};
                setProfiles(Object.keys(data).map(uid => normalizeUserProfile(data[uid], uid)));
            })
            .catch(error => {
                if (!active) return;
                console.warn('Could not load users', error);
                setLoadError('User profiles could not be loaded right now.');
                setProfiles([]);
            });

        return () => {
            active = false;
        };
    }, []);

    const people = useMemo(() => {
        const trainerProfiles = trainers.map(normalizeTrainerProfile);
        const existingNames = new Set(profiles.map(profile => profile.name.toLowerCase()));
        return [
            ...profiles,
            ...trainerProfiles.filter(profile => !existingNames.has(profile.name.toLowerCase()))
        ];
    }, [profiles, trainers]);

    const roleFilterOptions = ['Trainer', 'Student'];

    const filteredPeople = people.filter(person => {
        const query = searchTerm.toLowerCase();
        const haystack = [
            person.name,
            person.email,
            ...person.roles,
            ...person.faculties,
            ...person.faculties.map(getFacultyCode)
        ].join(' ').toLowerCase();
        const matchesSearch = !query || haystack.includes(query);
        const matchesRole = !selectedRole || (
            selectedRole === 'Trainer'
                ? person.roles.some(role => role.includes('Trainer'))
                : person.roles.includes(selectedRole)
        );
        const matchesFaculty = !selectedFaculty || person.faculties.includes(selectedFaculty);
        return matchesSearch && matchesRole && matchesFaculty;
    });

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <main className="container users-page">
                <header className="users-header">
                    <h1>Users</h1>
                    <p>Find learners, students, lecturers, and certified trainers across UTeM ATech.</p>
                    <div className="users-search">
                        <MdOutlineSearch size={22} />
                        <input
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search names, roles, or faculties..."
                        />
                    </div>
                    <div className="users-filters">
                        <label>
                            Role
                            <select value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
                                <option value="">All roles</option>
                                {roleFilterOptions.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Faculty
                            <select value={selectedFaculty} onChange={(event) => setSelectedFaculty(event.target.value)}>
                                <option value="">All faculties</option>
                                {facultyOptions.map(faculty => (
                                    <option key={faculty} value={faculty}>{getFacultyCode(faculty)}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </header>

                {loadError && (
                    <div className="users-load-note">
                        {loadError} Showing available trainer profiles.
                    </div>
                )}

                <div className="users-grid">
                    {filteredPeople.map(person => (
                        <button
                            key={person.id}
                            type="button"
                            className="users-card"
                            onClick={() => navigate(person.href)}
                        >
                            <UserAvatar person={person} />
                            <div>
                                <div className="users-name-row">
                                    <strong>{person.name}</strong>
                                    {person.isAdmin && <MdOutlineShield size={18} title="Admin" />}
                                    {person.isVerified && <MdOutlineVerified size={18} color="#2563eb" title="Verified" />}
                                </div>
                                <p>{person.roles.join(' | ')}</p>
                                <div className="users-card-tags">
                                    {person.roles.slice(0, 3).map(role => <span key={role}>{role}</span>)}
                                    {person.faculties.slice(0, 2).map(faculty => <span key={faculty}>{getFacultyCode(faculty)}</span>)}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {filteredPeople.length === 0 && (
                    <div className="users-empty">
                        No related users found.
                    </div>
                )}
            </main>
        </div>
    );
};

export default Users;
