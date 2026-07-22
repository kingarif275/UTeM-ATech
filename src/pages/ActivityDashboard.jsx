import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { ref as dbRef, update } from 'firebase/database';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import {
    MdOutlineDownload,
    MdOutlineEdit,
    MdOutlineImage,
    MdOutlineOpenInNew,
    MdOutlineTableRows,
    MdOutlineViewList
} from 'react-icons/md';
import Navbar from '../components/Navbar';
import { auth, db, storage } from '../firebase';
import { useSeminars } from '../context/SeminarContext';
import { ensureUserProfile } from '../utils/userProfiles';
import { PROGRAMME_STATUSES, REGISTRATION_STATUSES } from '../data/atechContent';

const activityTypes = ['All', 'Event', 'Seminar', 'Workshop', 'Conference', 'Webinar', 'Meetup'];

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;

const buildRows = (registrations, seminarTitle) => {
    return registrations.flatMap((registration) => {
        const sessions = registration.sessions?.length ? registration.sessions : [{}];
        return sessions.map((session, index) => ({
            activity: seminarTitle,
            registrationId: registration.id || registration.registrationId || '',
            name: registration.attendee?.fullName || '',
            email: registration.attendee?.email || '',
            phone: registration.attendee?.phoneNumber || '',
            role: registration.attendee?.role || registration.attendee?.profession || '',
            organization: registration.attendee?.organization || registration.attendee?.company || '',
            category: registration.attendee?.registrationCategory || '',
            reference: registration.referenceNumber || '',
            paymentStatus: registration.paymentStatus || '',
            method: registration.registrationMethod || '',
            status: registration.status || '',
            registeredAt: registration.registeredAt || '',
            sessionName: session.name || `Session ${index + 1}`,
            sessionDate: session.date || '',
            sessionStart: session.startTime || '',
            sessionEnd: session.endTime || '',
            sessionTime: [session.startTime, session.endTime].filter(Boolean).join(' - ')
        }));
    });
};

const downloadCsv = (filename, rows) => {
    const headers = ['Activity', 'Reference', 'Full Name', 'Email', 'Phone Number', 'Role', 'Organisation / University', 'Category', 'Method', 'Status', 'Payment Status', 'Registered At', 'Session', 'Session Date', 'Start Time', 'End Time', 'Session Time'];
    const keys = ['activity', 'reference', 'name', 'email', 'phone', 'role', 'organization', 'category', 'method', 'status', 'paymentStatus', 'registeredAt', 'sessionName', 'sessionDate', 'sessionStart', 'sessionEnd', 'sessionTime'];
    const body = rows.map(row => keys.map(key => csvEscape(row[key])).join(',')).join('\n');
    const blob = new Blob([[headers.join(','), body].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

const ActivityDashboard = () => {
    const navigate = useNavigate();
    const { seminars, loading, getActivityRegistrations } = useSeminars();
    const [currentUser, setCurrentUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [allowed, setAllowed] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(true);
    const [selectedType, setSelectedType] = useState('All');
    const [selectedId, setSelectedId] = useState('');
    const [registrations, setRegistrations] = useState([]);
    const [registrationsLoading, setRegistrationsLoading] = useState(false);
    const [sheetMode, setSheetMode] = useState(false);
    const [exportNotice, setExportNotice] = useState('');
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [draft, setDraft] = useState(null);
    const bannerInputRef = useRef(null);
    const posterInputRef = useRef(null);

    useEffect(() => {
        document.title = 'UTeM ATech - Activity Dashboard';
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (!user) {
                setAllowed(false);
                setCheckingAccess(false);
                navigate('/login');
                return;
            }

            try {
                const nextProfile = await ensureUserProfile(user);
                setProfile(nextProfile);
                setAllowed(nextProfile?.isVerified === true || nextProfile?.isAdmin === true);
            } catch (error) {
                console.warn('Could not verify dashboard access:', error);
                setAllowed(false);
            } finally {
                setCheckingAccess(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const ownedActivities = useMemo(() => {
        if (!profile || !currentUser) return [];
        const ownerName = (profile.name || currentUser.displayName || '').toLowerCase();
        return seminars.filter((seminar) => (
            profile.isAdmin === true
            || seminar.creatorId === currentUser.uid
            || (seminar.organizer || '').toLowerCase() === ownerName
        ));
    }, [currentUser, profile, seminars]);

    const filteredActivities = useMemo(() => {
        if (selectedType === 'All') return ownedActivities;
        return ownedActivities.filter(activity => activity.type === selectedType);
    }, [ownedActivities, selectedType]);

    const selectedActivity = useMemo(() => {
        return filteredActivities.find(activity => activity.id === selectedId) || filteredActivities[0] || null;
    }, [filteredActivities, selectedId]);

    useEffect(() => {
        if (selectedActivity && selectedActivity.id !== selectedId) {
            setSelectedId(selectedActivity.id);
        }
    }, [selectedActivity, selectedId]);

    useEffect(() => {
        if (!selectedActivity) {
            setRegistrations([]);
            return;
        }

        let active = true;
        setRegistrationsLoading(true);
        getActivityRegistrations(selectedActivity.id)
            .then(items => {
                if (active) setRegistrations(items);
            })
            .finally(() => {
                if (active) setRegistrationsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [getActivityRegistrations, selectedActivity]);

    useEffect(() => {
        if (selectedActivity) {
            setDraft({
                title: selectedActivity.title || '',
                type: selectedActivity.type || 'Seminar',
                description: selectedActivity.description || '',
                locationType: selectedActivity.locationType || 'Physical',
                location: selectedActivity.location || '',
                price: selectedActivity.price || 0,
                programmeStatus: selectedActivity.programmeStatus || 'Open',
                banner: selectedActivity.banner || '',
                poster: selectedActivity.poster || ''
            });
        }
    }, [selectedActivity]);

    const rows = useMemo(() => buildRows(registrations, selectedActivity?.title || ''), [registrations, selectedActivity]);

    const uploadImage = async (file, field) => {
        if (!file || !currentUser) return;
        setSaving(true);
        try {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const fileRef = storageRef(storage, `seminar_${field}s/${currentUser.uid}/${Date.now()}_${safeName}`);
            const snapshot = await uploadBytes(fileRef, file);
            const url = await getDownloadURL(snapshot.ref);
            setDraft(prev => ({ ...prev, [field]: url }));
        } catch (error) {
            alert(`Image upload failed: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const saveActivity = async () => {
        if (!selectedActivity || !draft) return;
        setSaving(true);
        try {
            await update(dbRef(db, `seminars/${selectedActivity.id}`), {
                title: draft.title,
                type: draft.type,
                description: draft.description,
                locationType: draft.locationType,
                location: draft.location,
                price: Number(draft.price || 0),
                programmeStatus: draft.programmeStatus,
                banner: draft.banner,
                poster: draft.poster
            });
            setEditing(false);
        } catch (error) {
            alert(`Could not save activity: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const copyForGoogleSheets = async () => {
        if (rows.length === 0) {
            alert('There are no enrollments to export yet.');
            return;
        }

        const headers = ['Activity', 'Reference', 'Full Name', 'Email', 'Phone Number', 'Role', 'Organisation / University', 'Category', 'Method', 'Status', 'Payment Status', 'Registered At', 'Session', 'Session Date', 'Start Time', 'End Time', 'Session Time'];
        const keys = ['activity', 'reference', 'name', 'email', 'phone', 'role', 'organization', 'category', 'method', 'status', 'paymentStatus', 'registeredAt', 'sessionName', 'sessionDate', 'sessionStart', 'sessionEnd', 'sessionTime'];
        const tsv = [headers.join('\t'), ...rows.map(row => keys.map(key => row[key] ?? '').join('\t'))].join('\n');
        const html = `
            <table>
                <thead><tr>${headers.map(header => `<th>${header}</th>`).join('')}</tr></thead>
                <tbody>
                    ${rows.map(row => `<tr>${keys.map(key => `<td>${String(row[key] ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</td>`).join('')}</tr>`).join('')}
                </tbody>
            </table>
        `;

        try {
            if (window.ClipboardItem && navigator.clipboard.write) {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'text/plain': new Blob([tsv], { type: 'text/plain' }),
                        'text/html': new Blob([html], { type: 'text/html' })
                    })
                ]);
            } else {
                await navigator.clipboard.writeText(tsv);
            }
            setExportNotice('Enrollment data copied. In the new Google Sheet, click cell A1 and press Ctrl+V to paste it.');
            window.open('https://sheets.new', '_blank', 'noopener,noreferrer');
        } catch {
            alert('Could not copy the table. Use Export CSV instead.');
        }
    };

    const updateRegistrationStatus = async (registration, nextStatus) => {
        if (!selectedActivity || !registration?.id) return;
        const paymentStatus = nextStatus === 'Payment Received' || nextStatus === 'Registration Confirmed'
            ? 'Payment Recorded'
            : nextStatus === 'Payment Invitation Sent'
                ? 'Payment Requested'
                : registration.paymentStatus || 'Pending Review';
        const nextAction = nextStatus === 'Registration Confirmed'
            ? 'Seat confirmed. Please wait for training reminders.'
            : nextStatus === 'Certificate Ready'
                ? 'Certificate is ready for collection or download.'
                : 'ATech will update the next step after review.';
        const payload = { status: nextStatus, paymentStatus, nextAction };
        await update(dbRef(db, `activity_registrations/${selectedActivity.id}/${registration.id}`), payload);
        if (registration.userId && registration.registrationId) {
            try {
                await update(dbRef(db, `user_registrations/${registration.userId}/${registration.registrationId}`), payload);
            } catch (error) {
                console.warn('Could not sync attendee registration copy:', error);
            }
        }
        setRegistrations(items => items.map(item => item.id === registration.id ? { ...item, ...payload } : item));
    };

    if (checkingAccess || loading) {
        return (
            <div style={{ minHeight: '100vh', background: '#ffffff' }}>
                <Navbar />
                <main className="container page-content" style={{ paddingTop: '180px', textAlign: 'center' }}>
                    <div className="spinner" />
                </main>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <main className="container page-content" style={{ paddingTop: '112px', paddingBottom: '72px' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap', marginBottom: '28px' }}>
                    <div>
                        <h1 style={{ margin: '0 0 10px', fontSize: '40px', fontWeight: 900, letterSpacing: 0 }}>Activity Dashboard</h1>
                        <p style={{ color: 'var(--text-light)', margin: 0 }}>Manage activities, attendee records, and organizer exports.</p>
                    </div>
                    <button className="btn btn-primary" type="button" onClick={() => navigate('/create')}>
                        Create Activity
                    </button>
                </header>

                {!allowed ? (
                    <section style={{ border: '1px solid var(--border-color)', borderRadius: '24px', padding: '28px', background: '#f8fafc' }}>
                        <h2 style={{ margin: '0 0 8px' }}>Organizer access required</h2>
                        <p style={{ color: 'var(--text-light)', margin: 0 }}>Only verified organizers and admins can use this dashboard.</p>
                    </section>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                            {activityTypes.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSelectedType(type)}
                                    style={{
                                        border: selectedType === type ? '1px solid #111827' : '1px solid var(--border-color)',
                                        background: selectedType === type ? '#111827' : '#ffffff',
                                        color: selectedType === type ? '#ffffff' : '#111827',
                                        borderRadius: '999px',
                                        padding: '9px 16px',
                                        fontWeight: 900,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
                            <aside style={{ border: '1px solid var(--border-color)', borderRadius: '24px', overflow: 'hidden', background: '#ffffff' }}>
                                <div style={{ padding: '18px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)', fontWeight: 900 }}>
                                    Activities
                                </div>
                                {filteredActivities.map(activity => (
                                    <button
                                        key={activity.id}
                                        type="button"
                                        onClick={() => setSelectedId(activity.id)}
                                        style={{
                                            width: '100%',
                                            border: 0,
                                            borderBottom: '1px solid #eef2f7',
                                            background: selectedActivity?.id === activity.id ? '#eff6ff' : '#ffffff',
                                            padding: '14px 16px',
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontFamily: 'inherit'
                                        }}
                                    >
                                        <strong style={{ display: 'block', color: '#111827', fontSize: '14px' }}>{activity.title || 'Untitled Activity'}</strong>
                                        <span style={{ display: 'block', color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>{activity.type || 'Activity'} - {activity.sessions?.length || 0} session(s)</span>
                                    </button>
                                ))}
                                {filteredActivities.length === 0 && (
                                    <p style={{ color: '#6b7280', padding: '18px', margin: 0 }}>No activities in this filter.</p>
                                )}
                            </aside>

                            {selectedActivity && draft && (
                                <section style={{ display: 'grid', gap: '24px' }}>
                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '24px', overflow: 'hidden', background: '#ffffff' }}>
                                        <div style={{ minHeight: '240px', position: 'relative', background: '#111827' }}>
                                            {(draft.banner || draft.poster) && (
                                                <img src={draft.banner || draft.poster} alt={draft.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                                            )}
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(15,23,42,0.12), rgba(15,23,42,0.8))' }} />
                                            <div style={{ position: 'absolute', left: '24px', right: '24px', bottom: '24px', color: '#fff' }}>
                                                <span style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.18)', borderRadius: '999px', padding: '6px 10px', fontSize: '12px', fontWeight: 900 }}>{draft.type}</span>
                                                <h2 style={{ margin: '12px 0 0', fontSize: '34px', fontWeight: 950, lineHeight: 1.05 }}>{draft.title}</h2>
                                            </div>
                                        </div>

                                        <div style={{ padding: '24px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
                                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Activity Details</h3>
                                                <button className="nav-btn-outline" type="button" onClick={() => setEditing(value => !value)}>
                                                    <MdOutlineEdit size={18} /> {editing ? 'Close Editor' : 'Edit'}
                                                </button>
                                            </div>

                                            {editing ? (
                                                <div style={{ display: 'grid', gap: '16px' }}>
                                                    <div className="grid-2">
                                                        <label className="form-group">
                                                            <span className="form-label">Activity Name</span>
                                                            <input className="form-input" value={draft.title} onChange={event => setDraft({ ...draft, title: event.target.value })} />
                                                        </label>
                                                        <label className="form-group">
                                                            <span className="form-label">Type</span>
                                                            <select className="form-input" value={draft.type} onChange={event => setDraft({ ...draft, type: event.target.value })}>
                                                                {activityTypes.filter(type => type !== 'All').map(type => <option key={type} value={type}>{type}</option>)}
                                                            </select>
                                                        </label>
                                                    </div>
                                                    <div className="grid-2">
                                                        <label className="form-group">
                                                            <span className="form-label">Location Type</span>
                                                            <select className="form-input" value={draft.locationType} onChange={event => setDraft({ ...draft, locationType: event.target.value })}>
                                                                <option value="Microsoft Teams">Microsoft Teams</option>
                                                                <option value="Physical">Physical</option>
                                                                <option value="Online">Online</option>
                                                            </select>
                                                        </label>
                                                        <label className="form-group">
                                                            <span className="form-label">Price (RM)</span>
                                                            <input className="form-input" type="number" min="0" value={draft.price} onChange={event => setDraft({ ...draft, price: event.target.value })} />
                                                        </label>
                                                    </div>
                                                    <label className="form-group">
                                                        <span className="form-label">Programme Status</span>
                                                        <select className="form-input" value={draft.programmeStatus} onChange={event => setDraft({ ...draft, programmeStatus: event.target.value })}>
                                                            {PROGRAMME_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                                        </select>
                                                    </label>
                                                    <label className="form-group">
                                                        <span className="form-label">Location or Meeting Link</span>
                                                        <input className="form-input" value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} />
                                                    </label>
                                                    <label className="form-group">
                                                        <span className="form-label">Details</span>
                                                        <textarea className="form-input" rows="5" value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} />
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                                        <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={event => uploadImage(event.target.files?.[0], 'banner')} />
                                                        <input ref={posterInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={event => uploadImage(event.target.files?.[0], 'poster')} />
                                                        <button className="nav-btn-outline" type="button" onClick={() => bannerInputRef.current?.click()}><MdOutlineImage size={18} /> Change Banner</button>
                                                        <button className="nav-btn-outline" type="button" onClick={() => posterInputRef.current?.click()}><MdOutlineImage size={18} /> Change Poster</button>
                                                        <button className="btn btn-primary" type="button" onClick={saveActivity} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p style={{ color: '#4b5563', lineHeight: 1.7, margin: 0 }}>{draft.description || 'No details added yet.'}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div style={{ border: '1px solid var(--border-color)', borderRadius: '24px', overflow: 'hidden', background: '#ffffff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', padding: '18px', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Enrollments</h3>
                                                <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '13px' }}>{registrations.length} attendee(s)</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <button className="nav-btn-outline" type="button" onClick={() => setSheetMode(value => !value)}>
                                                    {sheetMode ? <MdOutlineViewList size={18} /> : <MdOutlineTableRows size={18} />}
                                                    {sheetMode ? 'Table View' : 'Sheet Mode'}
                                                </button>
                                                <button className="nav-btn-outline" type="button" onClick={() => downloadCsv(`${selectedActivity.title || 'activity'}-enrollments.csv`, rows)}>
                                                    <MdOutlineDownload size={18} /> Export CSV
                                                </button>
                                                <button className="nav-btn-outline" type="button" onClick={copyForGoogleSheets}>
                                                    <MdOutlineOpenInNew size={18} /> Copy to Google Sheet
                                                </button>
                                            </div>
                                        </div>
                                        {exportNotice && (
                                            <div style={{ margin: '14px 18px 0', background: '#ecfdf5', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '12px 14px', fontSize: '13px', fontWeight: 800 }}>
                                                {exportNotice}
                                            </div>
                                        )}

                                        <div style={{ overflowX: 'auto' }}>
                                            {registrationsLoading ? (
                                                <p style={{ padding: '24px', margin: 0, color: '#6b7280' }}>Loading enrollments...</p>
                                            ) : rows.length === 0 ? (
                                                <p style={{ padding: '24px', margin: 0, color: '#6b7280' }}>No enrollments yet.</p>
                                            ) : (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: sheetMode ? '1320px' : '1120px', fontSize: sheetMode ? '13px' : '14px' }}>
                                                    <thead>
                                                        <tr style={{ background: sheetMode ? '#f3f4f6' : '#ffffff', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '11px' }}>
                                                            {['Reference', 'Full Name', 'Email', 'Phone', 'Role', 'Organisation / University', 'Category', 'Method', 'Status', 'Payment', 'Session', 'Date', 'Start', 'End'].map(label => (
                                                                <th key={label} style={{ padding: sheetMode ? '10px' : '14px 16px', textAlign: 'left', border: sheetMode ? '1px solid #d1d5db' : 0 }}>{label}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rows.map((row, index) => (
                                                            <tr key={`${row.email}-${index}`} style={{ borderTop: sheetMode ? 0 : '1px solid #eef2f7' }}>
                                                                {[row.reference, row.name, row.email, row.phone, row.role, row.organization, row.category, row.method].map((value, cellIndex) => (
                                                                    <td key={cellIndex} style={{ padding: sheetMode ? '9px 10px' : '14px 16px', border: sheetMode ? '1px solid #d1d5db' : 0, color: '#111827', whiteSpace: cellIndex === 2 ? 'nowrap' : 'normal' }}>
                                                                        {value || '-'}
                                                                    </td>
                                                                ))}
                                                                <td style={{ padding: sheetMode ? '9px 10px' : '14px 16px', border: sheetMode ? '1px solid #d1d5db' : 0 }}>
                                                                    <select
                                                                        className="form-input"
                                                                        style={{ minWidth: '190px', padding: '8px 10px', fontSize: '12px' }}
                                                                        value={registrations.find(item => item.id === row.registrationId)?.status || row.status || 'Registration Received'}
                                                                        onChange={event => {
                                                                            const reg = registrations.find(item => item.referenceNumber === row.reference || item.attendee?.email === row.email);
                                                                            updateRegistrationStatus(reg, event.target.value);
                                                                        }}
                                                                    >
                                                                        {REGISTRATION_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                                                                    </select>
                                                                </td>
                                                                {[row.paymentStatus, row.sessionName, row.sessionDate, row.sessionStart, row.sessionEnd].map((value, cellIndex) => (
                                                                    <td key={`tail-${cellIndex}`} style={{ padding: sheetMode ? '9px 10px' : '14px 16px', border: sheetMode ? '1px solid #d1d5db' : 0, color: '#111827' }}>
                                                                        {value || '-'}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default ActivityDashboard;
