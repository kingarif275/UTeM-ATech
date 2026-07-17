import React, { useRef, useState } from 'react';
import { MdOutlineEdit, MdOutlineVerified, MdOutlineClose, MdOutlineSave, MdOutlinePhotoCamera, MdOutlineImage, MdOutlineShield } from 'react-icons/md';
import { getAvatarColor, getInitials } from '../utils/avatar';
import {
    CERTIFIED_ONLY_ROLES,
    LECTURER_ROLE,
    STUDENT_ROLE,
    facultyOptions,
    normalizeProfileRoles,
    roleOptions,
    shouldShowFaculty
} from '../utils/profileOptions';

const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden'
};

const sectionStyle = {
    ...cardStyle,
    padding: '24px'
};

const safeList = (value) => Array.isArray(value) ? value : [];

const splitLines = (value) => value
    .split('\n')
    .map(item => item.trim())
    .filter(Boolean);

const joinLines = (items) => safeList(items).join('\n');

const gradientOptions = [
    'linear-gradient(135deg, #111827 0%, #2563eb 55%, #22c55e 100%)',
    'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #ec4899 100%)',
    'linear-gradient(135deg, #064e3b 0%, #0ea5e9 100%)',
    'linear-gradient(135deg, #7c2d12 0%, #f59e0b 100%)'
];

const ProfileLayout = ({
    profile,
    activities = [],
    people = [],
    editable = false,
    editing = false,
    onEdit,
    onCancel,
    onSave,
    onChange,
    saving = false,
    onRequestVerification,
    onAvatarFile,
    onBannerFile
}) => {
    const avatarInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const [avatarDrag, setAvatarDrag] = useState(false);
    const [bannerDrag, setBannerDrag] = useState(false);
    const name = profile?.name || 'UTeM ATech User';
    const avatarColor = getAvatarColor(profile?.email || profile?.username || name);
    const about = profile?.about || 'No about section has been added yet.';
    const isVerified = profile?.isVerified === true;
    const isAdmin = profile?.isAdmin === true;
    const roles = normalizeProfileRoles(safeList(profile?.roles).length ? profile.roles : ['Learner'], isVerified);
    const faculties = safeList(profile?.faculties);
    const avatar = profile?._pfpPreview || profile?.pfpUrl || '';
    const bannerMode = profile?.bannerMode || 'color';
    const bannerColor = profile?.bannerColor || '#dbeafe';
    const bannerGradient = profile?.bannerGradient || gradientOptions[0];
    const bannerImage = profile?._bannerPreview || profile?.bannerImageUrl || '';
    const hasExperience = profile?.showExperience && safeList(profile?.experience).length > 0;
    const hasCertifications = profile?.showCertifications && safeList(profile?.certifications).length > 0;

    const update = (field, value) => onChange?.({ ...profile, [field]: value });
    const updateRoles = (role) => {
        if (CERTIFIED_ONLY_ROLES.includes(role) && !isVerified) return;

        const current = new Set(roles);
        if (current.has(role)) current.delete(role);
        else {
            current.add(role);
            if (role === STUDENT_ROLE) current.delete(LECTURER_ROLE);
            if (role === LECTURER_ROLE) current.delete(STUDENT_ROLE);
        }

        const nextRoles = normalizeProfileRoles(Array.from(current), isVerified);
        const nextProfile = { ...profile, roles: nextRoles };
        if (!shouldShowFaculty(nextRoles)) {
            nextProfile.faculties = [];
        }
        onChange?.(nextProfile);
    };
    const updateFaculties = (faculty) => {
        const current = new Set(faculties);
        if (current.has(faculty)) current.delete(faculty);
        else current.add(faculty);
        update('faculties', Array.from(current));
    };
    const bannerStyle = bannerMode === 'image' && bannerImage
        ? { backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.06), rgba(15,23,42,0.26)), url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: bannerMode === 'gradient' ? bannerGradient : bannerColor };
    const handleAvatarDrop = (event) => {
        event.preventDefault();
        setAvatarDrag(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onAvatarFile?.(file);
    };
    const handleBannerDrop = (event) => {
        event.preventDefault();
        setBannerDrag(false);
        const file = event.dataTransfer.files?.[0];
        if (file) onBannerFile?.(file);
    };

    return (
        <div className="profile-shell">
            <main className="profile-main">
                <section style={cardStyle}>
                    <div
                        className={`profile-banner ${editing && bannerMode === 'image' ? 'editable' : ''} ${bannerDrag ? 'dragging' : ''}`}
                        style={bannerStyle}
                        onDragOver={(event) => {
                            if (!editing || bannerMode !== 'image') return;
                            event.preventDefault();
                            setBannerDrag(true);
                        }}
                        onDragLeave={() => setBannerDrag(false)}
                        onDrop={handleBannerDrop}
                    >
                        {editing && (
                            <div className="profile-banner-tools">
                                <div className="profile-banner-mode">
                                    {['color', 'gradient', 'image'].map(mode => (
                                        <button
                                            key={mode}
                                            type="button"
                                            className={bannerMode === mode ? 'selected' : ''}
                                            onClick={() => update('bannerMode', mode)}
                                        >
                                            {mode}
                                        </button>
                                    ))}
                                </div>
                                {bannerMode === 'color' && (
                                    <label className="profile-color-picker compact">
                                        Color
                                        <input
                                            type="color"
                                            value={bannerColor}
                                            onChange={(e) => update('bannerColor', e.target.value)}
                                        />
                                    </label>
                                )}
                                {bannerMode === 'gradient' && (
                                    <div className="profile-gradient-picker">
                                        {gradientOptions.map(gradient => (
                                            <button
                                                key={gradient}
                                                type="button"
                                                className={bannerGradient === gradient ? 'selected' : ''}
                                                style={{ background: gradient }}
                                                onClick={() => update('bannerGradient', gradient)}
                                                title="Choose gradient"
                                            />
                                        ))}
                                    </div>
                                )}
                                {bannerMode === 'image' && (
                                    <>
                                        <button className="profile-banner-upload" type="button" onClick={() => bannerInputRef.current?.click()}>
                                            <MdOutlineImage size={17} />
                                            {bannerImage ? 'Change image' : 'Add image'}
                                        </button>
                                        <input
                                            ref={bannerInputRef}
                                            type="file"
                                            accept="image/*"
                                            hidden
                                            onChange={(e) => e.target.files?.[0] && onBannerFile?.(e.target.files[0])}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                        {editing && bannerMode === 'image' && (
                            <div className="profile-banner-drop-hint">
                                Drop banner image here
                            </div>
                        )}
                    </div>

                    <div className="profile-intro">
                        <button
                            type="button"
                            className={`profile-avatar-button ${editable ? 'editable' : ''} ${avatarDrag ? 'dragging' : ''}`}
                            onClick={() => editable && avatarInputRef.current?.click()}
                            onDragOver={(event) => {
                                if (!editable) return;
                                event.preventDefault();
                                setAvatarDrag(true);
                            }}
                            onDragLeave={() => setAvatarDrag(false)}
                            onDrop={handleAvatarDrop}
                            title={editable ? 'Change profile photo' : name}
                        >
                            {avatar ? (
                                <img className="profile-avatar" src={avatar} alt={name} />
                            ) : (
                                <span className="profile-avatar-fallback" style={{ background: avatarColor }}>{getInitials(name)}</span>
                            )}
                            {editable && (
                                <span className="profile-avatar-overlay">
                                    <MdOutlinePhotoCamera size={22} />
                                </span>
                            )}
                        </button>
                        {editable && (
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={(e) => e.target.files?.[0] && onAvatarFile?.(e.target.files[0])}
                            />
                        )}

                        <div className="profile-actions">
                            {editable && !editing && (
                                <button className="profile-icon-button" onClick={onEdit} title="Edit profile">
                                    <MdOutlineEdit size={20} />
                                </button>
                            )}
                            {editable && editing && (
                                <>
                                    <button className="profile-pill-button" onClick={onCancel}>
                                        <MdOutlineClose size={18} />
                                        Cancel
                                    </button>
                                    <button className="profile-pill-button primary" onClick={onSave} disabled={saving}>
                                        <MdOutlineSave size={18} />
                                        {saving ? 'Saving' : 'Save'}
                                    </button>
                                </>
                            )}
                        </div>

                        {editing ? (
                            <div className="profile-edit-grid">
                                <label>
                                    Name
                                    <input value={profile.name || ''} onChange={(e) => update('name', e.target.value)} />
                                </label>
                                <label>
                                    Username
                                    <input value={profile.username || ''} onChange={(e) => update('username', e.target.value)} />
                                </label>
                                <label>
                                    Location
                                    <input value={profile.location || ''} onChange={(e) => update('location', e.target.value)} placeholder="Melaka, Malaysia" />
                                </label>
                            </div>
                        ) : (
                            <>
                                <div className="profile-title-row">
                                    <h1>{name}</h1>
                                    {isAdmin && <MdOutlineShield className="profile-admin-icon" size={24} title="Admin" />}
                                    {isVerified && <MdOutlineVerified size={24} color="#2563eb" title="Verified" />}
                                </div>
                                <p className="profile-headline">{roles.join(' | ')}</p>
                                {profile?.location && <p className="profile-location">{profile.location}</p>}
                            </>
                        )}

                        {editing ? (
                            <div className="profile-role-editor">
                                {roleOptions.map(role => {
                                    const disabled = CERTIFIED_ONLY_ROLES.includes(role) && !isVerified;
                                    return (
                                        <button
                                            key={role}
                                            className={roles.includes(role) ? 'selected' : ''}
                                            onClick={() => updateRoles(role)}
                                            type="button"
                                            disabled={disabled}
                                            title={disabled ? 'Only certified accounts can choose this role' : undefined}
                                        >
                                            {role}
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="profile-tag-list">
                                {roles.map(role => <span className="profile-role-tag" key={role}>{role}</span>)}
                                {shouldShowFaculty(roles) && faculties.map(faculty => (
                                    <span className="profile-faculty-tag" key={faculty} title={faculty}>{faculty}</span>
                                ))}
                            </div>
                        )}

                        {editing && shouldShowFaculty(roles) && (
                            <>
                                <div className="profile-faculty-editor">
                                    <p>Faculty</p>
                                    <div>
                                        {facultyOptions.map(faculty => (
                                            <button
                                                key={faculty}
                                                type="button"
                                                className={faculties.includes(faculty) ? 'selected' : ''}
                                                onClick={() => updateFaculties(faculty)}
                                            >
                                                {faculty}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {editable && !isVerified && (
                            <div className="profile-verification-box">
                                <div>
                                    <strong>{profile?.verificationRequested ? 'Verification requested' : 'Trainer verification'}</strong>
                                    <p>{profile?.verificationRequested ? 'Your request is waiting for admin review.' : 'Request verification to publish sources and host trainer activities.'}</p>
                                </div>
                                {!profile?.verificationRequested && (
                                    <button className="profile-pill-button" onClick={onRequestVerification}>Request</button>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                <section style={sectionStyle}>
                    <h2>About</h2>
                    {editing ? (
                        <textarea
                            className="profile-textarea"
                            value={profile.about || ''}
                            onChange={(e) => update('about', e.target.value)}
                            placeholder="Tell learners and trainers what you do, what you teach, or what you are learning."
                        />
                    ) : (
                        <p className="profile-paragraph">{about}</p>
                    )}
                </section>

                <section style={sectionStyle}>
                    <h2>Activities</h2>
                    {activities.length === 0 ? (
                        <p className="profile-muted">No hosted activities yet.</p>
                    ) : (
                        <div className="profile-activity-list">
                            {activities.slice(0, 5).map(activity => (
                                <div key={activity.id || activity.title} className="profile-activity-item">
                                    <div>
                                        <strong>{activity.title}</strong>
                                        <p>{activity.type || 'Activity'} - {activity.sessions?.[0]?.date || activity.startDate || 'Date TBA'}</p>
                                    </div>
                                    <span>{activity.price === 0 ? 'Free' : `RM ${activity.price || 0}`}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {(editing || hasExperience) && (
                    <section style={sectionStyle}>
                        <div className="profile-section-header">
                            <h2>Experience</h2>
                            {editing && (
                                <button className="profile-small-button" onClick={() => update('showExperience', !profile.showExperience)}>
                                    {profile.showExperience ? 'Remove section' : 'Add section'}
                                </button>
                            )}
                        </div>
                        {editing && profile.showExperience ? (
                            <textarea
                                className="profile-textarea compact"
                                value={joinLines(profile.experience)}
                                onChange={(e) => update('experience', splitLines(e.target.value))}
                                placeholder="One experience per line"
                            />
                        ) : hasExperience ? (
                            <ul className="profile-list">{profile.experience.map(item => <li key={item}>{item}</li>)}</ul>
                        ) : editing ? (
                            <p className="profile-muted">Turn this on if you want experience to show on your profile.</p>
                        ) : null}
                    </section>
                )}

                {(editing || hasCertifications) && (
                    <section style={sectionStyle}>
                        <div className="profile-section-header">
                            <h2>Licences + Certification</h2>
                            {editing && (
                                <button className="profile-small-button" onClick={() => update('showCertifications', !profile.showCertifications)}>
                                    {profile.showCertifications ? 'Remove section' : 'Add section'}
                                </button>
                            )}
                        </div>
                        {editing && profile.showCertifications ? (
                            <textarea
                                className="profile-textarea compact"
                                value={joinLines(profile.certifications)}
                                onChange={(e) => update('certifications', splitLines(e.target.value))}
                                placeholder="One licence or certification per line"
                            />
                        ) : hasCertifications ? (
                            <ul className="profile-list">{profile.certifications.map(item => <li key={item}>{item}</li>)}</ul>
                        ) : editing ? (
                            <p className="profile-muted">Turn this on if you want certificates to show on your profile.</p>
                        ) : null}
                    </section>
                )}
            </main>

            <aside className="profile-side">
                <section style={sectionStyle}>
                    <h2>People You May Know</h2>
                    <div className="profile-people-list">
                        {people.slice(0, 5).map(person => (
                            <a key={person.id || person.name} href={person.href || '#'} className="profile-person">
                                {person.photo ? (
                                    <img src={person.photo} alt={person.name} />
                                ) : (
                                    <span className="profile-person-fallback" style={{ background: getAvatarColor(person.name) }}>{getInitials(person.name)}</span>
                                )}
                                <div>
                                    <strong>{person.name}</strong>
                                    <p>{person.title || safeList(person.roles).join(' | ') || 'UTeM ATech member'}</p>
                                </div>
                            </a>
                        ))}
                        {people.length === 0 && <p className="profile-muted">No recommendations yet.</p>}
                    </div>
                </section>
            </aside>
        </div>
    );
};

export default ProfileLayout;
