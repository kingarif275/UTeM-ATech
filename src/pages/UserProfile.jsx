import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged, updateProfile as updateAuthProfile } from 'firebase/auth';
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import Navbar from '../components/Navbar';
import ProfileLayout from '../components/ProfileLayout';
import { auth, db, storage } from '../firebase';
import { defaultProfileForUser, ensureUserProfile, requestProfileVerification, updateUserProfileData } from '../utils/userProfiles';
import { normalizeProfileRoles, shouldShowFaculty } from '../utils/profileOptions';
import { useSeminars } from '../context/SeminarContext';
import { useTrainers } from '../context/TrainerContext';

const clone = (value) => JSON.parse(JSON.stringify(value || {}));

const pickBestProfileMatch = (matches) => {
    return matches.sort((a, b) => {
        const aRank = a.profile?.isAdmin === true ? 0 : a.profile?.isVerified === true ? 1 : 2;
        const bRank = b.profile?.isAdmin === true ? 0 : b.profile?.isVerified === true ? 1 : 2;
        return aRank - bRank;
    })[0];
};

const UserProfile = () => {
    const navigate = useNavigate();
    const { uid } = useParams();
    const { seminars } = useSeminars();
    const { trainers } = useTrainers();
    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileUid, setProfileUid] = useState('');
    const [draft, setDraft] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);

    useEffect(() => {
        document.title = 'UTeM ATech - Profile';
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            const targetUid = uid || user?.uid;

            if (!targetUid) {
                setLoading(false);
                navigate('/login');
                return;
            }

            try {
                let loadedProfile;
                let loadedProfileUid = targetUid;
                if (!uid && user) {
                    try {
                        loadedProfile = await ensureUserProfile(user);
                    } catch (error) {
                        console.warn('Could not sync own profile before loading', error);
                    }
                    if (user.email) {
                        const emailSnapshot = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(user.email)));
                        if (emailSnapshot.exists()) {
                            const bestMatch = pickBestProfileMatch(
                                Object.entries(emailSnapshot.val() || {}).map(([matchUid, value]) => ({
                                    uid: matchUid,
                                    profile: value
                                }))
                            );
                            if (bestMatch?.profile) {
                                loadedProfile = bestMatch.profile;
                                loadedProfileUid = bestMatch.uid;
                            }
                        }
                    }
                } else {
                    const snapshot = await get(ref(db, `users/${targetUid}`));
                    loadedProfile = snapshot.exists() ? snapshot.val() : null;
                }

                if (!loadedProfile && user && targetUid === user.uid) {
                    loadedProfile = defaultProfileForUser(user);
                }

                if (!loadedProfile) {
                    setProfile(null);
                    setProfileUid('');
                    setDraft(null);
                } else {
                    setProfile(loadedProfile);
                    setProfileUid(loadedProfileUid);
                    setDraft(clone(loadedProfile));
                }
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [navigate, uid]);

    const isOwnProfile = currentUser && (
        !uid
        || uid === currentUser.uid
        || profileUid === currentUser.uid
        || (profile?.email && profile.email === currentUser.email)
    );
    const profileName = profile?.name || currentUser?.displayName || '';

    const hostedActivities = useMemo(() => {
        if (!profileName) return [];
        return seminars.filter(item => item.organizer?.toLowerCase() === profileName.toLowerCase());
    }, [profileName, seminars]);

    const people = useMemo(() => {
        return trainers
            .filter(trainer => trainer.name !== profileName)
            .slice(0, 6)
            .map(trainer => ({
                id: trainer.id,
                name: trainer.name,
                title: trainer.title,
                photo: trainer.photo && trainer.photo !== 'placeholder' ? trainer.photo : '',
                href: `/trainers/${trainer.id}`
            }));
    }, [profileName, trainers]);

    const startEditingWithDraft = () => {
        setDraft(clone(profile));
        setEditing(true);
    };

    const validateImage = (file) => {
        if (!file.type.startsWith('image/')) {
            alert('Please choose an image file.');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Please choose an image under 5MB.');
            return false;
        }
        return true;
    };

    const handleAvatarFile = (file) => {
        if (!file || !isOwnProfile || !validateImage(file)) return;
        const preview = URL.createObjectURL(file);
        setAvatarFile(file);
        setEditing(true);
        setDraft(prev => ({
            ...(prev || profile),
            _pfpPreview: preview
        }));
    };

    const handleBannerFile = (file) => {
        if (!file || !isOwnProfile || !validateImage(file)) return;
        const preview = URL.createObjectURL(file);
        setBannerFile(file);
        setEditing(true);
        setDraft(prev => ({
            ...(prev || profile),
            bannerMode: 'image',
            _bannerPreview: preview
        }));
    };

    const uploadProfileImage = async (file, folder) => {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `profile_media/${currentUser.uid}/${folder}/${Date.now()}_${safeName}`;
        const fileRef = storageRef(storage, path);
        const snapshot = await uploadBytes(fileRef, file);
        return getDownloadURL(snapshot.ref);
    };

    const handleSave = async () => {
        if (!currentUser || !draft) return;
        setSaving(true);
        try {
            const uploadedAvatarUrl = avatarFile ? await uploadProfileImage(avatarFile, 'avatar') : draft.pfpUrl;
            const uploadedBannerUrl = bannerFile ? await uploadProfileImage(bannerFile, 'banner') : draft.bannerImageUrl;
            const normalizedRoles = normalizeProfileRoles(draft.roles, draft.isVerified === true || draft.isAdmin === true);
            const cleaned = {
                ...draft,
                pfpUrl: uploadedAvatarUrl || '',
                bannerImageUrl: uploadedBannerUrl || '',
                roles: normalizedRoles,
                faculties: shouldShowFaculty(normalizedRoles) ? (draft.faculties || []) : [],
                experience: draft.showExperience ? (draft.experience || []) : [],
                certifications: draft.showCertifications ? (draft.certifications || []) : []
            };
            delete cleaned._pfpPreview;
            delete cleaned._bannerPreview;

            await updateUserProfileData(profileUid || currentUser.uid, cleaned);
            await updateAuthProfile(currentUser, {
                displayName: cleaned.name,
                photoURL: cleaned.pfpUrl || null
            });
            setProfile(cleaned);
            setDraft(clone(cleaned));
            setAvatarFile(null);
            setBannerFile(null);
            setEditing(false);
        } catch (error) {
            alert(`Failed to save profile: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleRequestVerification = async () => {
        if (!currentUser) return;
        try {
            await requestProfileVerification(currentUser.uid);
            const next = { ...profile, verificationRequested: true };
            setProfile(next);
            setDraft(clone(next));
        } catch (error) {
            alert(`Failed to request verification: ${error.message}`);
        }
    };

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

    if (!profile) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff' }}>
                <Navbar />
                <div className="container page-content" style={{ textAlign: 'center', paddingTop: '180px' }}>
                    <h1>Profile not found</h1>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Back Home</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <div className="container profile-page-wrap">
                <ProfileLayout
                    profile={editing ? draft : profile}
                    activities={hostedActivities}
                    people={people}
                    editable={Boolean(isOwnProfile)}
                    editing={editing}
                    onEdit={startEditingWithDraft}
                    onCancel={() => { setDraft(clone(profile)); setAvatarFile(null); setBannerFile(null); setEditing(false); }}
                    onSave={handleSave}
                    onChange={setDraft}
                    saving={saving}
                    onRequestVerification={handleRequestVerification}
                    onAvatarFile={handleAvatarFile}
                    onBannerFile={handleBannerFile}
                />
            </div>
        </div>
    );
};

export default UserProfile;
