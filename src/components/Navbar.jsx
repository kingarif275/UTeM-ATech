import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { equalTo, get, orderByChild, query, ref } from 'firebase/database';
import { db } from '../firebase';
import { useSeminars } from '../context/SeminarContext';
import { useTrainers } from '../context/TrainerContext';
import { ensureUserProfile } from '../utils/userProfiles';
import { getAvatarColor, getInitials } from '../utils/avatar';
import {
    requestNotificationPermission,
    getNotificationPermission,
    scheduleActivityReminders,
    getUpcomingSessions,
    getCountdownString,
} from '../utils/notifications';
import utemLogo from '../assets/logo-utem.png';
import atechLogo from '../assets/logo-atech.png';
import { 
    MdOutlineHome, 
    MdOutlineSearch,
    MdOutlineLocalActivity, 
    MdOutlineAddCircleOutline, 
    MdOutlineDashboard,
    MdOutlineEvent, 
    MdOutlineVerified, 
    MdOutlineLogout, 
    MdOutlineLogin, 
    MdOutlinePerson, 
    MdOutlineArrowBack, 
    MdOutlineKeyboardArrowRight,
    MdOutlineFolderOpen,
    MdOutlineAdminPanelSettings,
    MdOutlineManageAccounts
} from 'react-icons/md';

const BellIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const Navbar = () => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [profileUid, setProfileUid] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { seminars, collections, getUserActivities } = useSeminars();
    const { trainers } = useTrainers();
    const navigate = useNavigate();
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [notifPermission, setNotifPermission] = useState('default');
    const [showPermBanner, setShowPermBanner] = useState(false);
    const [navSearch, setNavSearch] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [activeSearchIndex, setActiveSearchIndex] = useState(0);
    const [searchableUsers, setSearchableUsers] = useState([]);
    const [, forceUpdate] = useState(0);
    const notifRef = useRef(null);
    const searchRef = useRef(null);
    const reminderTimeoutsRef = useRef([]);

    useEffect(() => {
        const id = setTimeout(() => setNotifPermission(getNotificationPermission()), 0);
        return () => clearTimeout(id);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setProfile(null);
            setProfileUid('');
            if (currentUser) {
                try {
                    let ensuredProfile = null;
                    try {
                        ensuredProfile = await ensureUserProfile(currentUser);
                    } catch (error) {
                        console.warn('Could not sync profile before navbar lookup', error);
                    }
                    let resolvedProfile = ensuredProfile;
                    let resolvedUid = currentUser.uid;

                    if (currentUser.email) {
                        const emailSnapshot = await get(query(ref(db, 'users'), orderByChild('email'), equalTo(currentUser.email)));
                        if (emailSnapshot.exists()) {
                            const matches = Object.entries(emailSnapshot.val() || {})
                                .map(([uid, value]) => ({ uid, value }))
                                .sort((a, b) => {
                                    const aRank = (a.value?.isAdmin === true ? 0 : a.value?.isVerified === true ? 1 : 2);
                                    const bRank = (b.value?.isAdmin === true ? 0 : b.value?.isVerified === true ? 1 : 2);
                                    return aRank - bRank;
                                });
                            if (matches[0]) {
                                resolvedUid = matches[0].uid;
                                resolvedProfile = matches[0].value;
                            }
                        }
                    }

                    setProfile(resolvedProfile);
                    setProfileUid(resolvedUid);

                    if (resolvedProfile?.isBanned) {
                        await signOut(auth);
                        alert('Your account has been banned.');
                        setIsVerified(false);
                        setIsAdmin(false);
                        return;
                    }
                    const admin = resolvedProfile?.isAdmin === true;
                    setIsAdmin(admin);
                    setIsVerified(resolvedProfile?.isVerified === true || admin);
                } catch {
                    setProfile(null);
                    setProfileUid(currentUser.uid);
                    setIsVerified(false);
                    setIsAdmin(false);
                }
            } else {
                setProfile(null);
                setProfileUid('');
                setIsVerified(false);
                setIsAdmin(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) {
            const id = setTimeout(() => setUpcomingSessions([]), 0);
            reminderTimeoutsRef.current.forEach(id => clearTimeout(id));
            return () => clearTimeout(id);
        }

        let active = true;
        const syncNotifications = async () => {
            try {
                const activities = await getUserActivities(user.uid);
                if (!active) return;

                // Filter out registrations where seminarId is not in active seminars
                const activeSeminarIds = new Set(seminars.map(s => s.id));
                const filteredActivities = activities.filter(act => activeSeminarIds.has(act.seminarId));

                const upcoming = getUpcomingSessions(filteredActivities);
                setUpcomingSessions(upcoming);

                if (getNotificationPermission() === 'granted') {
                    reminderTimeoutsRef.current.forEach(id => clearTimeout(id));
                    reminderTimeoutsRef.current = scheduleActivityReminders(filteredActivities);
                } else if (getNotificationPermission() === 'default' && filteredActivities.length > 0) {
                    setShowPermBanner(true);
                }
            } catch (e) {
                console.warn('Could not load activities for notifications', e);
            }
        };

        syncNotifications();

        return () => {
            active = false;
        };
    }, [user, seminars, getUserActivities]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setNotifOpen(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!user) {
            setSearchableUsers([]);
            return;
        }

        let active = true;
        get(ref(db, 'users'))
            .then(snapshot => {
                if (!active) return;
                const rows = snapshot.exists()
                    ? Object.entries(snapshot.val() || {}).map(([uid, value]) => ({ uid, ...value }))
                    : [];
                setSearchableUsers(rows);
            })
            .catch(error => {
                console.warn('Could not load navbar users for search counts', error);
                if (active) setSearchableUsers([]);
            });

        return () => {
            active = false;
        };
    }, [user]);

    // Countdown tick when notification panel open
    useEffect(() => {
        if (!notifOpen || upcomingSessions.length === 0) return;
        const tick = setInterval(() => forceUpdate(n => n + 1), 1000);
        return () => clearInterval(tick);
    }, [notifOpen, upcomingSessions]);

    const handleLogout = async () => {
        reminderTimeoutsRef.current.forEach(id => clearTimeout(id));
        await signOut(auth);
        navigate('/login');
    };

    const handleEnableNotifications = async () => {
        setShowPermBanner(false);
        const granted = await requestNotificationPermission();
        setNotifPermission(granted ? 'granted' : 'denied');
        if (granted && user) {
            try {
                const activities = await getUserActivities(user.uid);
                const activeSeminarIds = new Set(seminars.map(s => s.id));
                const filteredActivities = activities.filter(act => activeSeminarIds.has(act.seminarId));
                reminderTimeoutsRef.current.forEach(id => clearTimeout(id));
                reminderTimeoutsRef.current = scheduleActivityReminders(filteredActivities);
            } catch (error) {
                console.warn('Could not enable reminders', error);
            }
        }
    };

    const avatarName = profile?.name || user?.displayName || user?.email || 'Guest';
    const avatarUrl = profile?.pfpUrl || user?.photoURL || '';
    const avatarFallbackStyle = {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        cursor: 'pointer',
        background: getAvatarColor(avatarName),
        color: '#ffffff',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '800',
        flexShrink: 0,
    };

    const notifCount = upcomingSessions.length;
    const searchText = navSearch.trim().toLowerCase();
    const includesSearch = (values) => values
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(searchText));

    const filteredExploreCount = !searchText
        ? seminars?.length || 0
        : (seminars || []).filter(item => includesSearch([
            item.title,
            item.organizer,
            item.type,
            item.description
        ])).length;

    const filteredTrainerCount = !searchText
        ? trainers?.length || 0
        : (trainers || []).filter(item => includesSearch([
            item.name,
            item.title,
            item.faculty,
            ...(Array.isArray(item.roles) ? item.roles : [])
        ])).length;

    const filteredCollectionCount = !searchText
        ? collections?.length || 0
        : (collections || []).filter(item => includesSearch([
            item.title,
            item.name,
            item.category,
            item.creatorName,
            item.description
        ])).length;

    const filteredUserCount = !searchText
        ? searchableUsers.length + (trainers?.length || 0)
        : searchableUsers.filter(item => includesSearch([
            item.name,
            item.username,
            item.email,
            ...(Array.isArray(item.roles) ? item.roles : []),
            ...(Array.isArray(item.faculties) ? item.faculties : [])
        ])).length + filteredTrainerCount;

    const navSearchOptions = [
        { scope: 'all', label: 'All Users', count: filteredUserCount, icon: MdOutlineSearch },
        { scope: 'explore', label: 'Explore', count: filteredExploreCount, icon: MdOutlineLocalActivity },
        { scope: 'trainers', label: 'Trainers', count: filteredTrainerCount, icon: MdOutlinePerson },
        { scope: 'collection', label: 'Collection', count: filteredCollectionCount, icon: MdOutlineFolderOpen },
    ];

    useEffect(() => {
        setActiveSearchIndex(0);
    }, [navSearch]);

    const submitNavSearch = (scope) => {
        const value = navSearch.trim();
        if (!value) return;
        setSearchOpen(false);

        if (scope === 'explore' || (scope === 'all' && location.pathname === '/explore')) {
            navigate(`/explore?search=${encodeURIComponent(value)}`);
        } else if (scope === 'trainers') {
            navigate(`/users?search=${encodeURIComponent(value)}&tag=Trainer`);
        } else if (scope === 'collection') {
            navigate(`/collection?search=${encodeURIComponent(value)}`);
        } else {
            navigate(`/users?search=${encodeURIComponent(value)}`);
        }
    };

    return (
        <>
            {/* ── Original Navbar Style ─────────────────────────────── */}
            <nav className="navbar">
                {/* Left: logos + links */}
                <div className="nav-left">
                    <Link to="/" className="nav-logo" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <img className="nav-logo-img" src={utemLogo} alt="UTeM Logo" style={{ height: '49px', width: 'auto', objectFit: 'contain' }} />
                        <img className="nav-logo-img" src={atechLogo} alt="ATech Logo" style={{ height: '49px', width: 'auto', objectFit: 'contain' }} />
                    </Link>

                    <div className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/explore" className="nav-link">Explore</Link>
                        <Link to="/collection" className="nav-link">Collection</Link>
                        <Link to="/create" className="nav-link">Create</Link>
                        {user && isVerified && <Link to="/dashboard" className="nav-link">Dashboard</Link>}
                    </div>
                </div>

                <div className="nav-search" ref={searchRef}>
                    <MdOutlineSearch size={20} className="nav-search-icon" />
                    <input
                        value={navSearch}
                        onChange={(event) => {
                            setNavSearch(event.target.value);
                            setSearchOpen(Boolean(event.target.value.trim()));
                        }}
                        onFocus={() => setSearchOpen(Boolean(navSearch.trim()))}
                        onKeyDown={(event) => {
                            if (event.key === 'ArrowDown') {
                                event.preventDefault();
                                setSearchOpen(Boolean(navSearch.trim()));
                                setActiveSearchIndex(index => (index + 1) % navSearchOptions.length);
                            }
                            if (event.key === 'ArrowUp') {
                                event.preventDefault();
                                setSearchOpen(Boolean(navSearch.trim()));
                                setActiveSearchIndex(index => (index - 1 + navSearchOptions.length) % navSearchOptions.length);
                            }
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                submitNavSearch(searchOpen ? navSearchOptions[activeSearchIndex]?.scope : 'all');
                            }
                            if (event.key === 'Escape') setSearchOpen(false);
                        }}
                        placeholder="Search UTeM ATech"
                    />
                    {navSearch && (
                        <button
                            type="button"
                            className="nav-search-clear"
                            onClick={() => {
                                setNavSearch('');
                                setSearchOpen(false);
                            }}
                            title="Clear search"
                        >
                            x
                        </button>
                    )}
                    {searchOpen && navSearch.trim() && (
                        <div className="nav-search-menu">
                            {navSearchOptions.map((option, index) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.scope}
                                        type="button"
                                        className={activeSearchIndex === index ? 'active' : ''}
                                        onMouseEnter={() => setActiveSearchIndex(index)}
                                        onClick={() => submitNavSearch(option.scope)}
                                    >
                                        <Icon size={18} />
                                        <span><strong>{navSearch}</strong> in {option.label}</span>
                                        <small>{option.count}</small>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right: bell + profile */}
                <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Notification Bell */}
                    {user && (
                        <div ref={notifRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setNotifOpen(o => !o)}
                                title="Upcoming sessions"
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '6px',
                                    borderRadius: '50%',
                                    position: 'relative',
                                    transition: 'background 0.2s',
                                }}
                                onMouseOver={e => e.currentTarget.style.background = '#f5f5f5'}
                                onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                            >
                                <BellIcon />
                                {notifCount > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        width: '15px',
                                        height: '15px',
                                        background: '#1a1a1a',
                                        color: 'white',
                                        borderRadius: '50%',
                                        fontSize: '9px',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1.5px solid white',
                                    }}>
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}
                            </button>

                            {notifOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 12px)',
                                    right: 0,
                                    width: '320px',
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                    border: '1px solid #e5e5e5',
                                    zIndex: 200,
                                    overflow: 'hidden',
                                }}>
                                    <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: '600', fontSize: '14px', color: '#1a1a1a' }}>Upcoming Sessions</span>
                                        <span style={{ fontSize: '11px', color: '#999' }}>
                                            {notifPermission === 'granted' ? '🔔 Reminders on' : '🔕 Off'}
                                        </span>
                                    </div>

                                    {upcomingSessions.length === 0 ? (
                                        <div style={{ padding: '20px 16px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
                                            No upcoming sessions in 7 days.
                                        </div>
                                    ) : (
                                        upcomingSessions.map(({ activity, session, sessionDate }, i) => (
                                            <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #f7f7f7', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{ width: '7px', height: '7px', background: '#1a1a1a', borderRadius: '50%', marginTop: '5px', flexShrink: 0 }} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: '600', fontSize: '13px', color: '#1a1a1a', marginBottom: '2px' }}>{activity.seminarTitle}</p>
                                                    <p style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>{session.date} at {session.startTime}</p>
                                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#d93025', background: 'rgba(217,48,37,0.08)', padding: '2px 7px', borderRadius: '999px' }}>
                                                        {getCountdownString(sessionDate)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {notifPermission !== 'granted' && (
                                        <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
                                            <button
                                                onClick={handleEnableNotifications}
                                                style={{
                                                    width: '100%',
                                                    background: '#1a1a1a',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '10px',
                                                    borderRadius: '999px',
                                                    fontWeight: '600',
                                                    fontSize: '13px',
                                                    cursor: 'pointer',
                                                    fontFamily: 'inherit',
                                                }}
                                            >
                                                Enable Reminders 🔔
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {user && (
                        <div className="nav-shortcuts" aria-label="Personal shortcuts">
                            <button
                                type="button"
                                className="nav-shortcut-btn"
                                title="My Activities"
                                onClick={() => navigate('/my-activities')}
                            >
                                <MdOutlineEvent size={18} />
                                <span className="nav-shortcut-label">Activity</span>
                            </button>
                            <button
                                type="button"
                                className="nav-shortcut-btn"
                                title="My Collections"
                                onClick={() => navigate('/my-collections')}
                            >
                                <MdOutlineFolderOpen size={18} />
                                <span className="nav-shortcut-label">Library</span>
                            </button>
                        </div>
                    )}

                    {/* Profile or Log In */}
                    {user ? (
                        avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                onClick={() => setDrawerOpen(true)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    objectFit: 'cover',
                                }}
                            />
                        ) : (
                            <button type="button" onClick={() => setDrawerOpen(true)} style={avatarFallbackStyle} aria-label="Open profile menu">
                                {getInitials(avatarName)}
                            </button>
                        )
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Link to="/login" className="nav-btn-outline" style={{ padding: '8px 16px', fontSize: '13px' }}>Log In</Link>
                            <button type="button" onClick={() => setDrawerOpen(true)} style={{ ...avatarFallbackStyle, background: '#e5e7eb', color: '#111827' }} aria-label="Open guest menu">
                                G
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            <nav className="mobile-bottom-nav" aria-label="Mobile primary navigation">
                {[
                    { to: '/', label: 'Home', icon: MdOutlineHome },
                    { to: '/explore', label: 'Explore', icon: MdOutlineSearch },
                    { to: '/collection', label: 'Collection', icon: MdOutlineFolderOpen },
                    { to: '/create', label: 'Create', icon: MdOutlineAddCircleOutline },
                ].map(item => {
                    const Icon = item.icon;
                    const isActive = item.to === '/'
                        ? location.pathname === '/'
                        : location.pathname.startsWith(item.to);
                    return (
                        <Link key={item.to} to={item.to} className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}>
                            <Icon size={21} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Sliding Drawer for "My Page" */}
            {drawerOpen && (
                <div 
                    onClick={() => setDrawerOpen(false)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        zIndex: 1999,
                        backdropFilter: 'blur(4px)',
                        transition: 'opacity 0.3s ease',
                    }}
                />
            )}
            <div style={{
                position: 'fixed',
                top: 0,
                right: 0,
                bottom: 0,
                width: '380px',
                maxWidth: '85%',
                background: '#f5f5f5',
                boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
                zIndex: 2000,
                transform: drawerOpen ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                fontFamily: 'var(--font-family)',
            }}>
                {/* Drawer Header */}
                <div style={{
                    padding: '24px 24px 12px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                }}>
                    <button 
                        onClick={() => setDrawerOpen(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#000000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <MdOutlineArrowBack size={24} color="#000000" />
                    </button>
                </div>

                <div style={{ padding: '0 24px 40px 24px', display: 'flex', flexDirection: 'column' }}>
                    {/* Screen Title */}
                    <h2 style={{
                        fontSize: '32px',
                        fontWeight: '600',
                        color: '#000000',
                        margin: '8px 0 24px 0',
                        fontFamily: 'var(--font-family)',
                    }}>
                        My Page
                    </h2>

                    {/* Section: Account Details Card */}
                    <div 
                        onClick={() => {
                            setDrawerOpen(false);
                            if (user) {
                                navigate(profileUid ? `/profile/${profileUid}` : '/profile');
                            } else {
                                navigate('/login');
                            }
                        }}
                        style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        }}
                    >
                        {avatarUrl ? (
                            <img
                                src={avatarUrl}
                                alt="Profile"
                                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <span style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                background: user ? getAvatarColor(avatarName) : '#e5e7eb',
                                color: user ? '#ffffff' : '#111827',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                fontWeight: '900',
                                flexShrink: 0,
                            }}>
                                {user ? getInitials(avatarName) : 'G'}
                            </span>
                        )}
                        <div style={{ marginLeft: '16px', flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 'bold', fontSize: '18px', color: '#000000', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user ? (profile?.name || user.displayName || 'User') : 'Guest Explorer'}
                            </p>
                            <p style={{ fontSize: '13px', color: '#666666', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user ? (profile?.email || user.email) : 'Log in or Sign Up to get started'}
                            </p>
                        </div>
                        <MdOutlineKeyboardArrowRight size={24} color="#ccc" style={{ marginLeft: '8px', flexShrink: 0 }} />
                    </div>

                    <div style={{ height: '24px' }} />

                    {/* Section: Navigation (visible for all users, helps routing) */}
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#414141', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Explore
                    </div>
                    <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div 
                            onClick={() => { setDrawerOpen(false); navigate('/'); }}
                            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        >
                            <MdOutlineHome size={20} style={{ marginRight: '16px' }} />
                            <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Home</span>
                            <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                        </div>
                        <div 
                            onClick={() => { setDrawerOpen(false); navigate('/explore'); }}
                            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        >
                            <MdOutlineSearch size={20} style={{ marginRight: '16px' }} />
                            <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Explore</span>
                            <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                        </div>
                        <div 
                            onClick={() => { setDrawerOpen(false); navigate('/collection'); }}
                            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        >
                            <MdOutlineFolderOpen size={20} style={{ marginRight: '16px' }} />
                            <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Collection</span>
                            <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                        </div>
                        <div 
                            onClick={() => { setDrawerOpen(false); navigate('/create'); }}
                            style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', borderBottom: user && isVerified ? '1px solid #f3f4f6' : 'none', cursor: 'pointer' }}
                        >
                            <MdOutlineAddCircleOutline size={20} style={{ marginRight: '16px' }} />
                            <span style={{ fontSize: '15px', fontWeight: '600', color: '#000000', flex: 1 }}>Create</span>
                            <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                        </div>
                        {user && isVerified && (
                            <div
                                onClick={() => { setDrawerOpen(false); navigate('/dashboard'); }}
                                style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <MdOutlineDashboard size={20} style={{ marginRight: '16px' }} />
                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#000000', flex: 1 }}>Dashboard</span>
                                <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                            </div>
                        )}
                    </div>

                    <div style={{ height: '24px' }} />

                    {/* Section: Activity Tracking */}
                    {user && (
                        <>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#414141', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Activity Tracking
                            </div>
                            <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div 
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/my-activities');
                                    }}
                                    style={{
                                        padding: '18px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderBottom: '1px solid #f3f4f6',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <MdOutlineEvent size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>My Activity</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                                <div 
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/my-collections');
                                    }}
                                    style={{
                                        padding: '18px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <MdOutlineFolderOpen size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>My Collections</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                            </div>
                            <div style={{ height: '24px' }} />
                        </>
                    )}

                    {/* Section: Admin and Moderation */}
                    {user && isAdmin && (
                        <>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#414141', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Admin and Moderation
                            </div>
                            <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/admin/verification');
                                    }}
                                    style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                                >
                                    <MdOutlineVerified size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Verification</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                                <div
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/admin/users');
                                    }}
                                    style={{
                                        padding: '18px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        borderBottom: '1px solid #f3f4f6',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <MdOutlineAdminPanelSettings size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>User Moderation</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                                <div
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/admin/manage-admins');
                                    }}
                                    style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                                >
                                    <MdOutlineManageAccounts size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Add or Remove Admin</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                            </div>
                            <div style={{ height: '24px' }} />
                        </>
                    )}

                    {/* Section: Verification */}
                    {user && (
                        <>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#414141', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Verification
                            </div>
                            <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'center' }}>
                                    <MdOutlineVerified size={20} style={{ marginRight: '16px', color: isVerified ? '#3b82f6' : '#1a1a1a' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Verification Status</span>
                                    <span style={{
                                        fontSize: '13px',
                                        color: isVerified ? '#3b82f6' : '#666',
                                        fontWeight: 'bold',
                                        background: isVerified ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.05)',
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                    }}>
                                        {isVerified ? 'Verified' : 'Pending Verification'}
                                    </span>
                                </div>
                            </div>
                            <div style={{ height: '24px' }} />
                        </>
                    )}

                    {/* Section: Authentication */}
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#414141', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Authentication
                    </div>
                    <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {user ? (
                            <div 
                                onClick={() => {
                                    setDrawerOpen(false);
                                    handleLogout();
                                }}
                                style={{
                                    padding: '18px 20px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                }}
                            >
                                <MdOutlineLogout size={20} style={{ marginRight: '16px', color: '#ef4444' }} />
                                <span style={{ fontSize: '15px', fontWeight: '500', color: '#ef4444', flex: 1 }}>Logout</span>
                                <MdOutlineKeyboardArrowRight size={20} color="#ef4444" style={{ flexShrink: 0 }} />
                            </div>
                        ) : (
                            <>
                                <div 
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/login');
                                    }}
                                    style={{
                                        padding: '18px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid #f3f4f6',
                                    }}
                                >
                                    <MdOutlineLogin size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Log In</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                                <div 
                                    onClick={() => {
                                        setDrawerOpen(false);
                                        navigate('/signup');
                                    }}
                                    style={{
                                        padding: '18px 20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <MdOutlinePerson size={20} style={{ marginRight: '16px' }} />
                                    <span style={{ fontSize: '15px', fontWeight: '500', color: '#000000', flex: 1 }}>Sign Up</span>
                                    <MdOutlineKeyboardArrowRight size={20} color="#ccc" style={{ flexShrink: 0 }} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Permission Banner */}
            {showPermBanner && notifPermission === 'default' && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1a1a1a',
                    color: 'white',
                    padding: '14px 20px',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    zIndex: 9999,
                    maxWidth: '480px',
                    width: 'calc(100% - 40px)',
                    animation: 'slideUpIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                    <span style={{ fontSize: '22px' }}>🔔</span>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', fontSize: '14px', marginBottom: '2px', margin: '0 0 2px 0' }}>
                            Enable Activity Reminders
                        </p>
                        <p style={{ fontSize: '12px', opacity: 0.75, margin: 0 }}>
                            Get notified before your sessions start
                        </p>
                    </div>
                    <button
                        onClick={handleEnableNotifications}
                        style={{
                            background: 'white',
                            color: '#1a1a1a',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '999px',
                            fontWeight: '700',
                            fontSize: '13px',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: 'inherit',
                        }}
                    >
                        Enable
                    </button>
                    <button
                        onClick={() => setShowPermBanner(false)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.6)',
                            cursor: 'pointer',
                            fontSize: '18px',
                            padding: '0 4px',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
        </>
    );
};

export default Navbar;
