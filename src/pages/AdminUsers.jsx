import React, { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { get, ref, update } from 'firebase/database';
import { httpsCallable } from 'firebase/functions';
import { MdOutlineAdminPanelSettings, MdOutlineBlock, MdOutlineLockReset, MdOutlineManageAccounts, MdOutlineSearch, MdOutlineShield } from 'react-icons/md';
import Navbar from '../components/Navbar';
import { auth, db, functions } from '../firebase';
import { ensureUserProfile } from '../utils/userProfiles';
import { getAvatarColor, getInitials } from '../utils/avatar';

const normalizeUser = (uid, profile = {}) => {
    const name = profile.name || profile.displayName || profile.username || profile.email?.split('@')[0] || 'UTeM ATech User';
    const searchText = [
        name,
        profile.email,
        profile.username,
        ...(Array.isArray(profile.roles) ? profile.roles : []),
        ...(Array.isArray(profile.faculties) ? profile.faculties : []),
    ].filter(Boolean).join(' ').toLowerCase();

    return {
        uid,
        ...profile,
        name,
        email: profile.email || '',
        username: profile.username || '',
        pfpUrl: profile.pfpUrl || profile.photoURL || '',
        isAdmin: profile.isAdmin === true,
        isVerified: profile.isVerified === true || profile.isAdmin === true,
        isBanned: profile.isBanned === true,
        verificationRequested: profile.verificationRequested === true,
        searchText,
    };
};

const statusPill = (label, tone = 'neutral') => {
    const tones = {
        neutral: { background: '#f3f4f6', color: '#374151' },
        good: { background: '#dcfce7', color: '#166534' },
        warn: { background: '#fef3c7', color: '#92400e' },
        bad: { background: '#fee2e2', color: '#991b1b' },
        blue: { background: '#dbeafe', color: '#1d4ed8' },
    };

    return (
        <span style={{
            ...tones[tone],
            borderRadius: '999px',
            padding: '6px 10px',
            fontSize: '12px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
        }}>
            {label}
        </span>
    );
};

const AdminUsers = ({ manageAdmins = false }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [allowed, setAllowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [resetPassword, setResetPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetBusy, setResetBusy] = useState(false);

    const loadUsers = async () => {
        const snapshot = await get(ref(db, 'users'));
        const data = snapshot.exists() ? snapshot.val() : {};
        setUsers(Object.entries(data).map(([uid, profile]) => normalizeUser(uid, profile)).sort((a, b) => a.name.localeCompare(b.name)));
    };

    useEffect(() => {
        let active = true;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setLoading(true);
            setError('');
            setCurrentUser(user);

            if (!user) {
                setAllowed(false);
                setUsers([]);
                setLoading(false);
                return;
            }

            try {
                const profile = await ensureUserProfile(user);
                const canAccess = profile?.isAdmin === true;
                if (!active) return;
                setAllowed(canAccess);

                if (canAccess) {
                    await loadUsers();
                }
            } catch (err) {
                if (!active) return;
                setAllowed(false);
                setError(err.message || 'Could not load admin tools.');
            } finally {
                if (active) setLoading(false);
            }
        });

        return () => {
            active = false;
            unsubscribe();
        };
    }, [manageAdmins]);

    const filteredUsers = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return users;
        return users.filter(user => user.searchText.includes(normalizedQuery));
    }, [query, users]);

    const selectedUsers = useMemo(() => {
        return users.filter(user => selectedIds.has(user.uid));
    }, [selectedIds, users]);

    const userStats = useMemo(() => ({
        total: users.length,
        verified: users.filter(user => user.isVerified).length,
        admins: users.filter(user => user.isAdmin).length,
        banned: users.filter(user => user.isBanned).length,
    }), [users]);

    const selectableFilteredUsers = useMemo(() => {
        return filteredUsers.filter(user => user.uid !== currentUser?.uid);
    }, [currentUser?.uid, filteredUsers]);

    const toggleSelected = (uid) => {
        setSelectedIds(previous => {
            const next = new Set(previous);
            if (next.has(uid)) {
                next.delete(uid);
            } else {
                next.add(uid);
            }
            return next;
        });
    };

    const toggleAllFiltered = () => {
        setSelectedIds(previous => {
            const next = new Set(previous);
            const allSelected = selectableFilteredUsers.length > 0 && selectableFilteredUsers.every(user => next.has(user.uid));
            selectableFilteredUsers.forEach(user => {
                if (allSelected) {
                    next.delete(user.uid);
                } else {
                    next.add(user.uid);
                }
            });
            return next;
        });
    };

    const patchUser = async (targetUser, payload) => {
        const nextUsers = users.map(user => user.uid === targetUser.uid ? normalizeUser(user.uid, { ...user, ...payload }) : user);
        setUsers(nextUsers);

        try {
            await update(ref(db, `users/${targetUser.uid}`), {
                ...payload,
                updatedAt: Date.now(),
            });
        } catch (err) {
            await loadUsers();
            alert(`Failed to update ${targetUser.name}: ${err.message}`);
        }
    };

    const toggleAdmin = (targetUser) => {
        if (targetUser.uid === currentUser?.uid) {
            alert('You cannot remove your own admin rights.');
            return;
        }

        const nextValue = !targetUser.isAdmin;
        const confirmed = window.confirm(`${nextValue ? 'Grant admin access to' : 'Remove admin access from'} ${targetUser.name}?`);
        if (!confirmed) return;

        patchUser(targetUser, {
            isAdmin: nextValue,
            isVerified: nextValue ? true : targetUser.isVerified === true,
        });
    };

    const toggleBan = (targetUser) => {
        if (targetUser.uid === currentUser?.uid) {
            alert('You cannot ban your own account.');
            return;
        }

        const nextValue = !targetUser.isBanned;
        const confirmed = window.confirm(`${nextValue ? 'Ban' : 'Unban'} ${targetUser.name}?`);
        if (!confirmed) return;

        patchUser(targetUser, { isBanned: nextValue });
    };

    const toggleVerified = (targetUser) => {
        const nextValue = !targetUser.isVerified;
        patchUser(targetUser, {
            isVerified: nextValue,
            verificationRequested: false,
        });
    };

    const handlePasswordReset = async () => {
        const userIds = Array.from(selectedIds);
        if (userIds.length === 0) {
            alert('Select at least one user first.');
            return;
        }

        if (resetPassword.length < 8) {
            alert('Password must be at least 8 characters.');
            return;
        }

        if (resetPassword !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        const previewNames = selectedUsers.slice(0, 3).map(user => user.name).join(', ');
        const extraCount = Math.max(0, selectedUsers.length - 3);
        const confirmed = window.confirm(`Reset password for ${previewNames}${extraCount ? ` and ${extraCount} more` : ''}?`);
        if (!confirmed) return;

        setResetBusy(true);
        try {
            const resetUserPasswords = httpsCallable(functions, 'resetUserPasswords');
            const result = await resetUserPasswords({ userIds, password: resetPassword });
            const updated = result.data?.updated || 0;
            const failed = Array.isArray(result.data?.failed) ? result.data.failed : [];

            setResetPassword('');
            setConfirmPassword('');
            setSelectedIds(new Set());

            if (failed.length > 0) {
                alert(`Reset ${updated} password(s). ${failed.length} failed.`);
            } else {
                alert(`Reset ${updated} password(s).`);
            }
        } catch (err) {
            alert(`Password reset failed: ${err.message}`);
        } finally {
            setResetBusy(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '112px 24px 56px' }}>
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    style={{ border: 0, background: 'transparent', color: '#111827', fontWeight: 800, marginBottom: '18px', cursor: 'pointer' }}
                >
                    Back
                </button>

                <h1 style={{ margin: 0, fontSize: '36px', lineHeight: 1.05, letterSpacing: 0 }}>
                    {manageAdmins ? 'Add or Remove Admin' : 'User Moderation'}
                </h1>
                <p style={{ color: '#6b7280', margin: '10px 0 24px', fontSize: '15px' }}>
                    {manageAdmins ? 'Grant or revoke admin rights for users.' : 'Banned users cannot log in. You can also review verification status from here.'}
                </p>

                {loading ? (
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px', fontWeight: 800 }}>Loading admin tools...</div>
                ) : !allowed ? (
                    <div style={{ background: '#fff', borderRadius: '24px', padding: '28px' }}>
                        <h2 style={{ margin: '0 0 8px' }}>Admin access required</h2>
                        <p style={{ margin: 0, color: '#6b7280' }}>{error || 'This page only appears for admin accounts.'}</p>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '22px' }}>
                            {[
                                ['Users', userStats.total],
                                ['Verified', userStats.verified],
                                ['Admins', userStats.admins],
                                ['Banned', userStats.banned],
                            ].map(([label, value]) => (
                                <div key={label} style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: '22px', padding: '18px' }}>
                                    <div style={{ color: '#6b7280', fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                                    <div style={{ color: '#111827', fontSize: '28px', fontWeight: 950, marginTop: '6px' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        {!manageAdmins && (
                            <div style={{
                                background: '#111827',
                                color: '#fff',
                                borderRadius: '28px',
                                padding: '22px',
                                marginBottom: '22px',
                                boxShadow: '0 22px 48px rgba(15, 23, 42, 0.18)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '18px', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 900, fontSize: '18px' }}>
                                            <MdOutlineLockReset size={24} />
                                            Password Reset
                                        </div>
                                        <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: '14px' }}>
                                            Select one or multiple users, then set a temporary password for them.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleAllFiltered}
                                        disabled={selectableFilteredUsers.length === 0}
                                        style={{
                                            border: '1px solid rgba(255,255,255,0.22)',
                                            background: 'rgba(255,255,255,0.08)',
                                            color: '#fff',
                                            borderRadius: '999px',
                                            padding: '10px 14px',
                                            fontWeight: 900,
                                            cursor: selectableFilteredUsers.length === 0 ? 'not-allowed' : 'pointer',
                                            opacity: selectableFilteredUsers.length === 0 ? 0.55 : 1,
                                        }}
                                    >
                                        {selectableFilteredUsers.length > 0 && selectableFilteredUsers.every(user => selectedIds.has(user.uid)) ? 'Clear Visible' : 'Select Visible'}
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto', gap: '12px', alignItems: 'end', marginTop: '18px' }}>
                                    <label style={{ display: 'grid', gap: '7px', fontSize: '12px', fontWeight: 900, color: 'rgba(255,255,255,0.72)' }}>
                                        New Password
                                        <input
                                            type="password"
                                            value={resetPassword}
                                            onChange={(event) => setResetPassword(event.target.value)}
                                            placeholder="Minimum 8 characters"
                                            style={{ height: '46px', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '16px', padding: '0 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 0, font: 'inherit' }}
                                        />
                                    </label>
                                    <label style={{ display: 'grid', gap: '7px', fontSize: '12px', fontWeight: 900, color: 'rgba(255,255,255,0.72)' }}>
                                        Confirm Password
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(event) => setConfirmPassword(event.target.value)}
                                            placeholder="Repeat password"
                                            style={{ height: '46px', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '16px', padding: '0 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', outline: 0, font: 'inherit' }}
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handlePasswordReset}
                                        disabled={resetBusy || selectedIds.size === 0}
                                        style={{
                                            height: '46px',
                                            border: 0,
                                            borderRadius: '16px',
                                            padding: '0 18px',
                                            background: '#fff',
                                            color: '#111827',
                                            fontWeight: 900,
                                            cursor: resetBusy || selectedIds.size === 0 ? 'not-allowed' : 'pointer',
                                            opacity: resetBusy || selectedIds.size === 0 ? 0.55 : 1,
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {resetBusy ? 'Resetting...' : `Reset ${selectedIds.size || ''}`.trim()}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: '#f8fafc',
                            border: '1px solid #e5e7eb',
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
                                placeholder="Search users by name, username, email, role, or faculty"
                                style={{ border: 0, outline: 0, width: '100%', font: 'inherit', background: 'transparent', color: '#111827' }}
                            />
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 18px 48px rgba(15, 23, 42, 0.06)' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '920px' }}>
                                    <thead>
                                        <tr style={{ background: '#f8fafc', color: '#6b7280', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {!manageAdmins && (
                                                <th style={{ width: '54px', padding: '16px 18px', textAlign: 'left' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectableFilteredUsers.length > 0 && selectableFilteredUsers.every(user => selectedIds.has(user.uid))}
                                                        onChange={toggleAllFiltered}
                                                        disabled={selectableFilteredUsers.length === 0}
                                                        style={{ width: '18px', height: '18px', accentColor: '#111827' }}
                                                    />
                                                </th>
                                            )}
                                            <th style={{ padding: '16px 18px', textAlign: 'left' }}>User</th>
                                            <th style={{ padding: '16px 18px', textAlign: 'left' }}>Profile State</th>
                                            <th style={{ padding: '16px 18px', textAlign: 'left' }}>Verification</th>
                                            <th style={{ padding: '16px 18px', textAlign: 'left' }}>Admin</th>
                                            <th style={{ padding: '16px 18px', textAlign: 'left' }}>Access</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(person => {
                                            const canResetPerson = !manageAdmins && person.uid !== currentUser?.uid;
                                            const protectedAccount = person.uid === currentUser?.uid;
                                            return (
                                                <tr key={person.uid} style={{ borderTop: '1px solid #eef2f7' }}>
                                                    {!manageAdmins && (
                                                        <td style={{ padding: '16px 18px' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(person.uid)}
                                                                onChange={() => toggleSelected(person.uid)}
                                                                disabled={!canResetPerson}
                                                                title={canResetPerson ? 'Select for password reset' : 'This account cannot be selected'}
                                                                style={{ width: '18px', height: '18px', accentColor: '#111827', cursor: canResetPerson ? 'pointer' : 'not-allowed' }}
                                                            />
                                                        </td>
                                                    )}
                                                    <td style={{ padding: '16px 18px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, gap: '12px' }}>
                                                            {person.pfpUrl ? (
                                                                <img src={person.pfpUrl} alt={person.name} style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <span style={{
                                                                    width: '46px',
                                                                    height: '46px',
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
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                                    <strong style={{ color: '#111827', fontSize: '15px', whiteSpace: 'nowrap' }}>{person.name}</strong>
                                                                    {person.isAdmin && <MdOutlineShield size={17} color="#111827" title="Admin" />}
                                                                </div>
                                                                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '3px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                    {person.email || person.username || person.uid}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 18px' }}>
                                                        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                                                            {person.isAdmin && statusPill('Admin', 'good')}
                                                            {person.isVerified && statusPill('Verified', 'blue')}
                                                            {person.isBanned && statusPill('Banned', 'bad')}
                                                            {person.verificationRequested && !person.isVerified && statusPill('Pending', 'warn')}
                                                            {!person.isAdmin && !person.isVerified && !person.isBanned && statusPill('Standard')}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '16px 18px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleVerified(person)}
                                                            style={{ border: 0, borderRadius: '999px', padding: '10px 13px', background: person.isVerified ? '#111827' : '#e5e7eb', color: person.isVerified ? '#fff' : '#111827', fontWeight: 900, cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                        >
                                                            <MdOutlineAdminPanelSettings style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                                                            {person.isVerified ? 'Verified' : 'Verify'}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '16px 18px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleAdmin(person)}
                                                            disabled={person.uid === currentUser?.uid}
                                                            style={{
                                                                border: 0,
                                                                borderRadius: '999px',
                                                                padding: '10px 13px',
                                                                background: person.isAdmin ? '#111827' : '#e5e7eb',
                                                                color: person.isAdmin ? '#fff' : '#111827',
                                                                fontWeight: 900,
                                                                cursor: person.uid === currentUser?.uid ? 'not-allowed' : 'pointer',
                                                                opacity: person.uid === currentUser?.uid ? 0.55 : 1,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            <MdOutlineManageAccounts style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                                                            {person.isAdmin ? 'Admin On' : 'Admin Off'}
                                                        </button>
                                                    </td>
                                                    <td style={{ padding: '16px 18px' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleBan(person)}
                                                            disabled={protectedAccount}
                                                            style={{
                                                                border: 0,
                                                                borderRadius: '999px',
                                                                padding: '10px 13px',
                                                                background: person.isBanned ? '#fee2e2' : '#111827',
                                                                color: person.isBanned ? '#991b1b' : '#fff',
                                                                fontWeight: 900,
                                                                cursor: protectedAccount ? 'not-allowed' : 'pointer',
                                                                opacity: protectedAccount ? 0.55 : 1,
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        >
                                                            <MdOutlineBlock style={{ verticalAlign: '-2px', marginRight: '6px' }} />
                                                            {person.isBanned ? 'Unban' : 'Ban'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {filteredUsers.length === 0 && (
                                <div style={{ padding: '28px', color: '#6b7280' }}>
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

export default AdminUsers;
