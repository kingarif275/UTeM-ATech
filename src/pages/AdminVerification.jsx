import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref, update } from 'firebase/database';
import { MdOutlinePerson, MdOutlineSearch, MdOutlineVerified } from 'react-icons/md';
import Navbar from '../components/Navbar';
import { auth, db } from '../firebase';
import { ensureUserProfile } from '../utils/userProfiles';
import { getAvatarColor, getInitials } from '../utils/avatar';

const normalizeUser = (uid, profile = {}) => {
    const name = profile.name || profile.displayName || profile.username || profile.email?.split('@')[0] || 'UTeM ATech User';

    return {
        uid,
        ...profile,
        name,
        email: profile.email || '',
        username: profile.username || '',
        pfpUrl: profile.pfpUrl || profile.photoURL || '',
        isVerified: profile.isVerified === true || profile.isAdmin === true,
        isAdmin: profile.isAdmin === true,
        verificationRequested: profile.verificationRequested === true,
        searchText: [name, profile.email, profile.username].filter(Boolean).join(' ').toLowerCase(),
    };
};

const AdminVerification = () => {
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');

    const loadUsers = async () => {
        const snapshot = await get(ref(db, 'users'));
        const data = snapshot.exists() ? snapshot.val() : {};
        const list = Object.entries(data)
            .map(([uid, profile]) => normalizeUser(uid, profile))
            .sort((a, b) => Number(b.verificationRequested) - Number(a.verificationRequested) || a.name.localeCompare(b.name));
        setUsers(list);
    };

    useEffect(() => {
        let active = true;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            setError('');

            if (!user) {
                setAllowed(false);
                setUsers([]);
                setLoading(false);
                return;
            }

            try {
                const profile = await ensureUserProfile(user);
                if (!active) return;

                setAllowed(profile?.isAdmin === true);
                if (profile?.isAdmin === true) {
                    await loadUsers();
                }
            } catch (err) {
                if (!active) return;
                setAllowed(false);
                setError(err.message || 'Could not load verification tools.');
            } finally {
                if (active) setLoading(false);
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, []);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return users;
        return users.filter(user => user.searchText.includes(normalizedQuery));
    }, [query, users]);

    const updateVerification = async (targetUser, isVerified) => {
        const nextUsers = users.map(user => user.uid === targetUser.uid
            ? normalizeUser(user.uid, { ...user, isVerified, verificationRequested: false })
            : user
        );
        setUsers(nextUsers);

        try {
            await update(ref(db, `users/${targetUser.uid}`), {
                isVerified,
                verificationRequested: false,
                updatedAt: Date.now(),
            });
        } catch (err) {
            await loadUsers();
            alert(`Failed to update ${targetUser.name}: ${err.message}`);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <main style={{ maxWidth: '980px', margin: '0 auto', padding: '112px 24px 56px' }}>
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    style={{ border: 0, background: 'transparent', color: '#111827', fontWeight: 800, marginBottom: '18px', cursor: 'pointer' }}
                >
                    Back
                </button>

                <h1 style={{ margin: 0, fontSize: '36px', lineHeight: 1.05, letterSpacing: 0 }}>Verification</h1>
                <p style={{ color: '#6b7280', margin: '10px 0 24px', fontSize: '15px' }}>
                    Approve requests or manage user certifications.
                </p>

                {loading ? (
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', fontWeight: 800 }}>Loading verification requests...</div>
                ) : !allowed ? (
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px' }}>
                        <h2 style={{ margin: '0 0 8px' }}>Admin access required</h2>
                        <p style={{ margin: 0, color: '#6b7280' }}>{error || 'This page only appears for admin accounts.'}</p>
                    </div>
                ) : (
                    <>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: '#fff',
                            borderRadius: '999px',
                            padding: '0 18px',
                            height: '52px',
                            marginBottom: '22px',
                            boxShadow: '0 18px 42px rgba(15, 23, 42, 0.06)',
                        }}>
                            <MdOutlineSearch size={22} color="#6b7280" />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Search users by name, username, or email"
                                style={{ border: 0, outline: 0, width: '100%', font: 'inherit', background: 'transparent', color: '#111827' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gap: '16px' }}>
                            {filteredUsers.map(person => (
                                <div
                                    key={person.uid}
                                    style={{
                                        background: '#fff',
                                        borderRadius: '28px',
                                        padding: '18px',
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                                        gap: '18px',
                                        alignItems: 'center',
                                        boxShadow: '0 18px 44px rgba(15, 23, 42, 0.06)',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                                        {person.pfpUrl ? (
                                            <img src={person.pfpUrl} alt={person.name} style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <span style={{
                                                width: '54px',
                                                height: '54px',
                                                borderRadius: '50%',
                                                background: getAvatarColor(person.email || person.name),
                                                color: '#fff',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 900,
                                                flexShrink: 0,
                                            }}>
                                                {getInitials(person.name)}
                                            </span>
                                        )}
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                <strong style={{ color: '#111827', fontSize: '16px' }}>{person.name}</strong>
                                                {person.isVerified && <MdOutlineVerified size={18} color="#2563eb" title="Verified" />}
                                                {person.verificationRequested && !person.isVerified && (
                                                    <span style={{ borderRadius: '999px', background: '#fef3c7', color: '#92400e', padding: '5px 9px', fontSize: '11px', fontWeight: 900 }}>
                                                        Pending request
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ color: '#6b7280', fontSize: '13px', marginTop: '4px' }}>
                                                {person.email || person.username || person.uid}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => updateVerification(person, !person.isVerified)}
                                            style={{
                                                border: 0,
                                                borderRadius: '999px',
                                                padding: '12px 16px',
                                                background: person.isVerified ? '#111827' : '#e5e7eb',
                                                color: person.isVerified ? '#fff' : '#111827',
                                                fontWeight: 900,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <MdOutlinePerson style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                                            {person.isVerified ? 'Verified' : 'Verify'}
                                        </button>
                                        {person.verificationRequested && !person.isVerified && (
                                            <button
                                                type="button"
                                                onClick={() => updateVerification(person, false)}
                                                style={{ border: 0, borderRadius: '999px', padding: '12px 16px', background: '#fee2e2', color: '#991b1b', fontWeight: 900, cursor: 'pointer' }}
                                            >
                                                Reject
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredUsers.length === 0 && (
                                <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', color: '#6b7280' }}>
                                    No matching users found.
                                </div>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminVerification;
