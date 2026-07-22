import React, { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSeminars } from '../context/SeminarContext';
import { auth, storage } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ensureUserProfile } from '../utils/userProfiles';
import { PROGRAMME_STATUSES, TRAINING_CATEGORIES } from '../data/atechContent';

const generateMicrosoftTeamsLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randStr = (len) => {
        let res = '';
        for (let i = 0; i < len; i++) {
            res += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return res;
    };
    return `https://teams.microsoft.com/l/meetup-join/${randStr(8)}-${randStr(4)}-${randStr(4)}`;
};

const FilePicker = ({ label, file, onChange }) => {
    const inputRef = useRef(null);

    return (
        <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>{label}</label>
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                style={{
                    width: '100%',
                    minHeight: '48px',
                    border: '1px solid #d1d5db',
                    borderRadius: '14px',
                    background: '#ffffff',
                    color: file ? '#111827' : '#6b7280',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file?.name || 'Choose any file format'}
                </span>
                <span style={{ flexShrink: 0, color: '#111827' }}>Browse</span>
            </button>
            <input
                ref={inputRef}
                type="file"
                onChange={event => onChange(event.target.files?.[0] || null)}
                style={{ display: 'none' }}
            />
        </div>
    );
};

const PostSeminar = () => {
    const navigate = useNavigate();
    const { addSeminar } = useSeminars();
    const [userAuthChecked, setUserAuthChecked] = useState(false);
    const [userData, setUserData] = useState(null);
    const [bannerFile, setBannerFile] = useState(null);
    const [posterFile, setPosterFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingPoster, setIsDraggingPoster] = useState(false);
    const fileInputRef = useRef(null);
    const posterInputRef = useRef(null);

    React.useEffect(() => {
        document.title = "UTeM ATech - Create An Activity";
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                navigate('/login');
            } else {
                ensureUserProfile(currentUser).then((profile) => {
                    if (profile?.isVerified === true || profile?.isAdmin === true) {
                        setUserAuthChecked(true);
                        setUserData(profile);
                    } else {
                        alert("Only verified trainers/organizers can host activities.");
                        navigate('/register');
                    }
                }).catch(() => {
                    navigate('/register');
                });
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialType = queryParams.get('type') || 'Seminar';

    const [sessionType, setSessionType] = useState('multiple'); // 'one_time' or 'multiple'
    const [oneTimeData, setOneTimeData] = useState({
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        quota: ''
    });
    const [oneTimeFile, setOneTimeFile] = useState(null);
    const [sessionFiles, setSessionFiles] = useState({}); // { [index]: file }

    const [seminarData, setSeminarData] = useState({
        title: '',
        type: initialType,
        category: TRAINING_CATEGORIES[0],
        programmeStatus: 'Open',
        courseCode: '',
        description: '',
        overview: '',
        learningOutcomes: '',
        audience: '',
        topics: '',
        requirements: '',
        closingDate: '',
        included: '',
        hrdCorpClaimable: false,
        level: 'Professional',
        locationType: 'Microsoft Teams',
        location: '',
        priceType: 'Free',
        price: '',
        studentPrice: '',
        sessions: [
            { name: 'Session 1', date: '', startTime: '', endTime: '', quota: '' }
        ]
    });

    const handleSessionChange = (index, field, value) => {
        const updatedSessions = [...seminarData.sessions];
        updatedSessions[index][field] = value;
        setSeminarData({ ...seminarData, sessions: updatedSessions });
    };

    const addSession = () => {
        const nextIdx = seminarData.sessions.length + 1;
        setSeminarData({
            ...seminarData,
            sessions: [...seminarData.sessions, { name: `Session ${nextIdx}`, date: '', startTime: '', endTime: '', quota: '' }]
        });
    };

    const removeSession = (index) => {
        const updatedSessions = seminarData.sessions.filter((_, i) => i !== index);
        // Rename remaining sessions to maintain logical order if not customized
        const renamedSessions = updatedSessions.map((s, idx) => {
            if (s.name.startsWith('Session ')) {
                return { ...s, name: `Session ${idx + 1}` };
            }
            return s;
        });
        setSeminarData({ ...seminarData, sessions: renamedSessions });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setBannerFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const triggerFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handlePosterDragOver = (e) => {
        e.preventDefault();
        setIsDraggingPoster(true);
    };

    const handlePosterDragLeave = (e) => {
        e.preventDefault();
        setIsDraggingPoster(false);
    };

    const handlePosterDrop = (e) => {
        e.preventDefault();
        setIsDraggingPoster(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setPosterFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    };

    const triggerPosterFileInput = () => {
        if (posterInputRef.current) {
            posterInputRef.current.click();
        }
    };

    const uploadAttachment = async (file) => {
        if (!file) return { url: '', name: '' };
        try {
            const ownerId = auth.currentUser.uid;
            const fileRef = ref(storage, `activity_attachments/${ownerId}/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(fileRef, file);
            const url = await getDownloadURL(snapshot.ref);
            return { url, name: file.name };
        } catch (error) {
            console.error("Error uploading attachment:", error);
            return { url: '', name: '' };
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setUploading(true);
        let bannerUrl = 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
        let posterUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80';
        
        // Sync organizer logo & name from creator profile
        const organizerName = userData?.name || auth.currentUser?.displayName || 'Unknown Trainer';
        const logoUrl = userData?.pfpUrl || auth.currentUser?.photoURL || '';
        const ownerId = auth.currentUser.uid;

        if (bannerFile) {
            try {
                const storageRef = ref(storage, `seminar_banners/${ownerId}/${Date.now()}_${bannerFile.name}`);
                const snapshot = await uploadBytes(storageRef, bannerFile);
                bannerUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading banner:", error);
                alert("Failed to upload the banner. " + error.message);
            }
        }

        if (posterFile) {
            try {
                const storageRef = ref(storage, `seminar_posters/${ownerId}/${Date.now()}_${posterFile.name}`);
                const snapshot = await uploadBytes(storageRef, posterFile);
                posterUrl = await getDownloadURL(snapshot.ref);
            } catch (error) {
                console.error("Error uploading poster:", error);
                alert("Failed to upload the poster. " + error.message);
            }
        }

        const generatedMeetingLink = seminarData.locationType === 'Microsoft Teams' ? generateMicrosoftTeamsLink() : '';

        let sessions = [];
        let seminarFileUrl = '';
        let seminarFileName = '';

        if (sessionType === 'one_time') {
            const attachment = await uploadAttachment(oneTimeFile);
            seminarFileUrl = attachment.url;
            seminarFileName = attachment.name;

            sessions = [
                {
                    name: seminarData.title,
                    date: oneTimeData.startDate,
                    endDate: oneTimeData.endDate,
                    startTime: oneTimeData.startTime,
                    endTime: oneTimeData.endTime,
                    quota: Number(oneTimeData.quota),
                    registered: 0,
                    fileUrl: attachment.url,
                    fileName: attachment.name
                }
            ];
        } else {
            // Multiple Session
            for (let i = 0; i < seminarData.sessions.length; i++) {
                const s = seminarData.sessions[i];
                const file = sessionFiles[i];
                let fileUrl = s.fileUrl || '';
                let fileName = s.fileName || '';
                if (file) {
                    const attachment = await uploadAttachment(file);
                    fileUrl = attachment.url;
                    fileName = attachment.name;
                }
                sessions.push({
                    name: s.name || `Session ${i + 1}`,
                    date: s.date,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    quota: Number(s.quota),
                    registered: 0,
                    fileUrl: fileUrl,
                    fileName: fileName
                });
            }
        }

        // Finalize data
        const finalData = {
            title: seminarData.title,
            type: seminarData.type,
            category: seminarData.category,
            programmeStatus: seminarData.programmeStatus,
            courseCode: seminarData.courseCode,
            description: seminarData.description,
            overview: seminarData.overview,
            learningOutcomes: seminarData.learningOutcomes,
            audience: seminarData.audience,
            topics: seminarData.topics,
            requirements: seminarData.requirements,
            closingDate: seminarData.closingDate,
            included: seminarData.included,
            hrdCorpClaimable: seminarData.hrdCorpClaimable,
            level: seminarData.level,
            locationType: seminarData.locationType,
            location: seminarData.locationType === 'Microsoft Teams' ? generatedMeetingLink : seminarData.location,
            meetLink: seminarData.locationType === 'Microsoft Teams' ? generatedMeetingLink : '',
            price: seminarData.priceType === 'Free' ? 0 : Number(seminarData.price),
            studentPrice: seminarData.priceType === 'Free' ? 0 : Number(seminarData.studentPrice || seminarData.price || 0),
            sessionType: sessionType,
            startDate: sessionType === 'one_time' ? oneTimeData.startDate : '',
            endDate: sessionType === 'one_time' ? oneTimeData.endDate : '',
            fileUrl: seminarFileUrl,
            fileName: seminarFileName,
            sessions: sessions,
            banner: bannerUrl,
            poster: posterUrl,
            organizer: organizerName,
            creatorId: ownerId,
            logo: logoUrl,
            isOrganizerVerified: true
        };

        try {
            console.log("[PostSeminar] Attempting to save seminar data:", finalData);
            await addSeminar(finalData);
            console.log("[PostSeminar] Successfully saved seminar data.");
            setUploading(false);
            window.location.href = '/register';
        } catch (error) {
            console.error("[PostSeminar] Error caught from addSeminar:", error);
            setUploading(false);
            alert("Failed to save the activity: " + error.message);
        }
    };

    if (!userAuthChecked) return null;

    return (
        <div style={{ background: '#ffffff', minHeight: '100vh' }}>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px' }}>
                <div style={{ textAlign: 'left', marginBottom: '40px', maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '12px' }}>Create An Activity</h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-light)' }}>
                        Share your knowledge and connect with eager learners.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '0', background: 'transparent', maxWidth: '800px' }}>
                    {/* Basic Info */}
                    <div className="form-group">
                        <label className="form-label">Activity Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Intro to Artificial Intelligence"
                            required
                            value={seminarData.title}
                            onChange={e => setSeminarData({ ...seminarData, title: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Event Type</label>
                        <select
                            className="form-input"
                            value={seminarData.type}
                            onChange={e => setSeminarData({ ...seminarData, type: e.target.value })}
                        >
                            <option value="Seminar">Seminar</option>
                            <option value="Workshop">Workshop</option>
                            <option value="Conference">Conference</option>
                            <option value="Webinar">Webinar</option>
                            <option value="Event">Event</option>
                            <option value="Meetup">Meetup</option>
                        </select>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Training Category</label>
                            <select
                                className="form-input"
                                value={seminarData.category}
                                onChange={e => setSeminarData({ ...seminarData, category: e.target.value })}
                            >
                                {TRAINING_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Programme Status</label>
                            <select
                                className="form-input"
                                value={seminarData.programmeStatus}
                                onChange={e => setSeminarData({ ...seminarData, programmeStatus: e.target.value })}
                            >
                                {PROGRAMME_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Course Code</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. ATECH-MINITAB-2026"
                                value={seminarData.courseCode}
                                onChange={e => setSeminarData({ ...seminarData, courseCode: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Registration Closing Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={seminarData.closingDate}
                                onChange={e => setSeminarData({ ...seminarData, closingDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Session Type Switcher */}
                    <div className="form-group">
                        <label className="form-label">Session Structure</label>
                        <div style={{
                            display: 'inline-flex',
                            background: '#f3f4f6',
                            padding: '4px',
                            borderRadius: '12px',
                            position: 'relative',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '360px',
                            marginBottom: '16px',
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: sessionType === 'one_time' ? '4px' : 'calc(50%)',
                                width: 'calc(50% - 4px)',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                transition: 'left 0.2s ease',
                                zIndex: 1,
                            }} />
                            <button
                                type="button"
                                onClick={() => setSessionType('one_time')}
                                style={{
                                    position: 'relative', zIndex: 2, background: 'transparent', border: 'none', width: '50%', padding: '8px 0', fontSize: '14px', fontWeight: '600', color: sessionType === 'one_time' ? '#111827' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit'
                                }}
                            >
                                One Time Session
                            </button>
                            <button
                                type="button"
                                onClick={() => setSessionType('multiple')}
                                style={{
                                    position: 'relative', zIndex: 2, background: 'transparent', border: 'none', width: '50%', padding: '8px 0', fontSize: '14px', fontWeight: '600', color: sessionType === 'multiple' ? '#111827' : '#6b7280', cursor: 'pointer', fontFamily: 'inherit'
                                }}
                            >
                                Multiple Session
                            </button>
                        </div>
                    </div>

                    {/* Sessions / Dates */}
                    {sessionType === 'one_time' ? (
                        <div className="form-group" style={{ background: '#f8f9fa', padding: '24px', borderRadius: '16px', marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <label className="form-label" style={{ marginBottom: '0', fontSize: '16px' }}>One-Time Schedule & Details</label>
                            
                            <div className="form-grid-2">
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required={sessionType === 'one_time'}
                                        value={oneTimeData.startDate}
                                        onChange={e => setOneTimeData({ ...oneTimeData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>End Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required={sessionType === 'one_time'}
                                        value={oneTimeData.endDate}
                                        onChange={e => setOneTimeData({ ...oneTimeData, endDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Start Time</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        required={sessionType === 'one_time'}
                                        value={oneTimeData.startTime}
                                        onChange={e => setOneTimeData({ ...oneTimeData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>End Time</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        required={sessionType === 'one_time'}
                                        value={oneTimeData.endTime}
                                        onChange={e => setOneTimeData({ ...oneTimeData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-grid-2">
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Capacity / Quota</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="e.g. 100"
                                        required={sessionType === 'one_time'}
                                        min="1"
                                        value={oneTimeData.quota}
                                        onChange={e => setOneTimeData({ ...oneTimeData, quota: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '0' }}>
                                    <FilePicker
                                        label="Attachment / Resource File"
                                        file={oneTimeFile}
                                        onChange={setOneTimeFile}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="form-group" style={{ background: '#f8f9fa', padding: '24px', borderRadius: '16px', marginBottom: '32px' }}>
                            <label className="form-label" style={{ marginBottom: '16px', fontSize: '16px' }}>Sessions & Schedule</label>
                            {seminarData.sessions.map((session, index) => (
                                <div key={index} style={{ marginBottom: '24px', borderBottom: index < seminarData.sessions.length - 1 ? '1px solid #e0e0e0' : 'none', paddingBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>Session {index + 1}</span>
                                        {seminarData.sessions.length > 1 && (
                                            <button type="button" onClick={() => removeSession(index)} style={{ color: '#d93025', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Remove</button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Session Name</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                style={{ padding: '12px 16px' }}
                                                required={sessionType === 'multiple'}
                                                value={session.name}
                                                onChange={e => handleSessionChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group" style={{ marginBottom: '0' }}>
                                                <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Date</label>
                                                <input
                                                    type="date"
                                                    className="form-input"
                                                    style={{ padding: '12px 16px' }}
                                                    required={sessionType === 'multiple'}
                                                    value={session.date}
                                                    onChange={e => handleSessionChange(index, 'date', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '0' }}>
                                                <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Capacity / Quota</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    style={{ padding: '12px 16px' }}
                                                    placeholder="e.g. 50"
                                                    required={sessionType === 'multiple'}
                                                    min="1"
                                                    value={session.quota}
                                                    onChange={e => handleSessionChange(index, 'quota', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-grid-2">
                                            <div className="form-group" style={{ marginBottom: '0' }}>
                                                <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>Start Time</label>
                                                <input
                                                    type="time"
                                                    className="form-input"
                                                    style={{ padding: '12px 16px' }}
                                                    required={sessionType === 'multiple'}
                                                    value={session.startTime}
                                                    onChange={e => handleSessionChange(index, 'startTime', e.target.value)}
                                                />
                                            </div>
                                            <div className="form-group" style={{ marginBottom: '0' }}>
                                                <label style={{ fontSize: '11px', color: '#666', fontWeight: '600', display: 'block', marginBottom: '6px' }}>End Time</label>
                                                <input
                                                    type="time"
                                                    className="form-input"
                                                    style={{ padding: '12px 16px' }}
                                                    required={sessionType === 'multiple'}
                                                    value={session.endTime}
                                                    onChange={e => handleSessionChange(index, 'endTime', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="form-group" style={{ marginBottom: '0' }}>
                                            <FilePicker
                                                label="Session Attachment / File"
                                                file={sessionFiles[index]}
                                                onChange={file => {
                                                    const nextFiles = { ...sessionFiles };
                                                    if (file) nextFiles[index] = file;
                                                    else delete nextFiles[index];
                                                    setSessionFiles(nextFiles);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={addSession} className="btn nav-btn-outline" style={{ fontSize: '14px', width: '100%', justifyContent: 'center', padding: '12px' }}>
                                + Add Another Session
                            </button>
                        </div>
                    )}

                    {/* Location Toggle */}
                    <div className="form-group">
                        <label className="form-label">Location Type</label>
                        <div style={{
                            display: 'inline-flex',
                            background: '#f3f4f6',
                            padding: '4px',
                            borderRadius: '12px',
                            position: 'relative',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '360px',
                            marginBottom: '16px',
                        }}>
                            {/* Sliding pill */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: seminarData.locationType === 'Microsoft Teams' ? '4px' : 'calc(50%)',
                                width: 'calc(50% - 4px)',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 1,
                            }} />
                            <button
                                type="button"
                                onClick={() => setSeminarData({ ...seminarData, locationType: 'Microsoft Teams', location: '' })}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '50%',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: seminarData.locationType === 'Microsoft Teams' ? '#111827' : '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Online (Microsoft Teams)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSeminarData({ ...seminarData, locationType: 'Physical', location: '' })}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '50%',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: seminarData.locationType === 'Physical' ? '#111827' : '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Physical
                            </button>
                        </div>
                        {seminarData.locationType === 'Physical' && (
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. 123 Main St, New York"
                                required
                                value={seminarData.location}
                                onChange={e => setSeminarData({ ...seminarData, location: e.target.value })}
                            />
                        )}
                    </div>

                    {/* Pricing Toggle */}
                    <div className="form-group">
                        <label className="form-label">Pricing</label>
                        <div style={{
                            display: 'inline-flex',
                            background: '#f3f4f6',
                            padding: '4px',
                            borderRadius: '12px',
                            position: 'relative',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            width: '100%',
                            maxWidth: '240px',
                            marginBottom: '16px',
                        }}>
                            {/* Sliding pill */}
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                bottom: '4px',
                                left: seminarData.priceType === 'Free' ? '4px' : 'calc(50%)',
                                width: 'calc(50% - 4px)',
                                background: '#ffffff',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
                                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                zIndex: 1,
                            }} />
                            <button
                                type="button"
                                onClick={() => setSeminarData({ ...seminarData, priceType: 'Free', price: '' })}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '50%',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: seminarData.priceType === 'Free' ? '#111827' : '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Free
                            </button>
                            <button
                                type="button"
                                onClick={() => setSeminarData({ ...seminarData, priceType: 'Paid', price: '' })}
                                style={{
                                    position: 'relative',
                                    zIndex: 2,
                                    background: 'transparent',
                                    border: 'none',
                                    width: '50%',
                                    padding: '8px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: seminarData.priceType === 'Paid' ? '#111827' : '#6b7280',
                                    cursor: 'pointer',
                                    borderRadius: '8px',
                                    transition: 'color 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                Paid
                            </button>
                        </div>
                        {seminarData.priceType === 'Paid' && (
                            <div className="form-grid-2">
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>RM</span>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Non-student fee"
                                        style={{ paddingLeft: '44px' }}
                                        required
                                        min="0"
                                        value={seminarData.price}
                                        onChange={e => setSeminarData({ ...seminarData, price: e.target.value })}
                                    />
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold' }}>RM</span>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="Student fee"
                                        style={{ paddingLeft: '44px' }}
                                        min="0"
                                        value={seminarData.studentPrice}
                                        onChange={e => setSeminarData({ ...seminarData, studentPrice: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                        <label style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '12px', fontWeight: 700, color: '#374151' }}>
                            <input
                                type="checkbox"
                                checked={seminarData.hrdCorpClaimable}
                                onChange={e => setSeminarData({ ...seminarData, hrdCorpClaimable: e.target.checked })}
                            />
                            HRD Corp claim support where applicable
                        </label>
                    </div>

                    {/* Event Banner */}
                    <div className="form-group">
                        <label className="form-label">Event Banner</label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerFileInput}
                            style={{
                                border: `2px dashed ${isDragging ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                borderRadius: '12px',
                                padding: '32px',
                                textAlign: 'center',
                                background: isDragging ? 'rgba(13, 138, 188, 0.05)' : '#f8f9fa',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setBannerFile(e.target.files[0]);
                                    }
                                }}
                                style={{ display: 'none' }}
                            />

                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: '#e0f2fe', color: 'var(--primary-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '4px'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>

                            {bannerFile ? (
                                <div style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
                                    Selected File: <span style={{ textDecoration: 'underline' }}>{bannerFile.name}</span>
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px', textDecoration: 'none' }}>
                                        Click or drag a new image to replace
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-dark)' }}>
                                        <span style={{ color: 'var(--primary-color)' }}>Click to upload</span> <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>or drag and drop</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
                                        SVG, PNG, JPG or GIF (max. 800x400px)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Event Poster */}
                    <div className="form-group">
                        <label className="form-label">Event Poster (Vertical)</label>
                        <div
                            onDragOver={handlePosterDragOver}
                            onDragLeave={handlePosterDragLeave}
                            onDrop={handlePosterDrop}
                            onClick={triggerPosterFileInput}
                            style={{
                                border: `2px dashed ${isDraggingPoster ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                borderRadius: '12px',
                                padding: '32px',
                                textAlign: 'center',
                                background: isDraggingPoster ? 'rgba(13, 138, 188, 0.05)' : '#f8f9fa',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px'
                            }}
                        >
                            <input
                                type="file"
                                accept="image/*"
                                ref={posterInputRef}
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        setPosterFile(e.target.files[0]);
                                    }
                                }}
                                style={{ display: 'none' }}
                            />

                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: '#e0f2fe', color: 'var(--primary-color)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '4px'
                            }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>

                            {posterFile ? (
                                <div style={{ color: 'var(--primary-color)', fontWeight: 500 }}>
                                    Selected File: <span style={{ textDecoration: 'underline' }}>{posterFile.name}</span>
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '4px', textDecoration: 'none' }}>
                                        Click or drag a new image to replace
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-dark)' }}>
                                        <span style={{ color: 'var(--primary-color)' }}>Click to upload</span> <span style={{ fontWeight: 400, color: 'var(--text-light)' }}>or drag and drop</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>
                                        SVG, PNG, JPG (Vertical Aspect Ratio recommended)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-input"
                            rows="6"
                            style={{ resize: 'vertical' }}
                            value={seminarData.description}
                            onChange={e => setSeminarData({ ...seminarData, description: e.target.value })}
                            placeholder="Describe what attendees will learn..."
                        ></textarea>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Learning Outcomes</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                value={seminarData.learningOutcomes}
                                onChange={e => setSeminarData({ ...seminarData, learningOutcomes: e.target.value })}
                                placeholder="List what participants will be able to do after the programme."
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Who Should Attend</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                value={seminarData.audience}
                                onChange={e => setSeminarData({ ...seminarData, audience: e.target.value })}
                                placeholder="Students, engineers, technicians, lecturers, industry teams..."
                            />
                        </div>
                    </div>

                    <div className="form-grid-2">
                        <div className="form-group">
                            <label className="form-label">Topics / Programme Outline</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                value={seminarData.topics}
                                onChange={e => setSeminarData({ ...seminarData, topics: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preparation / Requirements</label>
                            <textarea
                                className="form-input"
                                rows="4"
                                value={seminarData.requirements}
                                onChange={e => setSeminarData({ ...seminarData, requirements: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Fee Includes</label>
                        <input
                            className="form-input"
                            value={seminarData.included}
                            onChange={e => setSeminarData({ ...seminarData, included: e.target.value })}
                            placeholder="e.g. training notes, certificate of participation, hands-on exercises"
                        />
                    </div>

                    <div style={{ marginTop: '32px', textAlign: 'right' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '14px 48px', fontSize: '18px' }} disabled={uploading}>
                            {uploading ? 'Creating...' : 'Create Activity'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PostSeminar;
