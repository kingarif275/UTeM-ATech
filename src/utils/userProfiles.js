import { auth, db } from '../firebase';
import { get, ref, update } from 'firebase/database';

export const SUPER_ADMIN_EMAIL = '';

export const defaultProfileForUser = (user) => {
    const email = user?.email || '';
    const fallbackName = user?.displayName || email.split('@')[0]?.replaceAll('.', ' ') || 'UTeM ATech User';
    const isSuperAdmin = Boolean(SUPER_ADMIN_EMAIL && email === SUPER_ADMIN_EMAIL);

    return {
        name: fallbackName,
        username: email.split('@')[0] || '',
        email,
        phoneNumber: '',
        role: '',
        organization: '',
        profession: '',
        company: '',
        isAdmin: isSuperAdmin,
        isVerified: isSuperAdmin,
        isBanned: false,
        verificationRequested: false,
        pfpUrl: user?.photoURL || '',
        bannerMode: 'color',
        bannerColor: '#dbeafe',
        bannerGradient: 'linear-gradient(135deg, #111827 0%, #2563eb 55%, #22c55e 100%)',
        bannerImageUrl: '',
        roles: ['Learner'],
        faculties: [],
        about: '',
        location: '',
        experience: [],
        certifications: [],
        showExperience: false,
        showCertifications: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
};

export const ensureUserProfile = async (user = auth.currentUser) => {
    if (!user) return null;

    const profileRef = ref(db, `users/${user.uid}`);
    const snapshot = await get(profileRef);
    const baseProfile = defaultProfileForUser(user);

    if (!snapshot.exists()) {
        await update(profileRef, baseProfile);
        return baseProfile;
    }

    const existing = snapshot.val();
    const isSuperAdmin = Boolean(SUPER_ADMIN_EMAIL && user.email === SUPER_ADMIN_EMAIL);
    const normalized = {
        ...baseProfile,
        ...existing,
        email: user.email || existing.email || '',
        name: existing.name || user.displayName || baseProfile.name,
        username: existing.username || baseProfile.username,
        phoneNumber: existing.phoneNumber || baseProfile.phoneNumber,
        role: existing.role || existing.profession || baseProfile.role,
        organization: existing.organization || existing.company || baseProfile.organization,
        profession: existing.profession || baseProfile.profession,
        company: existing.company || baseProfile.company,
        pfpUrl: existing.pfpUrl || user.photoURL || '',
        bannerMode: existing.bannerMode || baseProfile.bannerMode,
        bannerColor: existing.bannerColor || baseProfile.bannerColor,
        bannerGradient: existing.bannerGradient || baseProfile.bannerGradient,
        bannerImageUrl: existing.bannerImageUrl || '',
        isAdmin: isSuperAdmin || existing.isAdmin === true,
        isVerified: isSuperAdmin || existing.isVerified === true,
        isBanned: existing.isBanned === true,
        verificationRequested: existing.verificationRequested === true,
        roles: Array.isArray(existing.roles) && existing.roles.length ? existing.roles : baseProfile.roles,
        faculties: Array.isArray(existing.faculties) ? existing.faculties : [],
        experience: Array.isArray(existing.experience) ? existing.experience : [],
        certifications: Array.isArray(existing.certifications) ? existing.certifications : [],
        updatedAt: Date.now()
    };

    const syncPayload = {
        name: normalized.name,
        username: normalized.username,
        phoneNumber: normalized.phoneNumber,
        role: normalized.role,
        organization: normalized.organization,
        profession: normalized.profession,
        company: normalized.company,
        pfpUrl: normalized.pfpUrl,
        bannerMode: normalized.bannerMode,
        bannerColor: normalized.bannerColor,
        bannerGradient: normalized.bannerGradient,
        bannerImageUrl: normalized.bannerImageUrl,
        roles: normalized.roles,
        faculties: normalized.faculties,
        about: normalized.about,
        location: normalized.location,
        experience: normalized.experience,
        certifications: normalized.certifications,
        showExperience: normalized.showExperience,
        showCertifications: normalized.showCertifications,
        updatedAt: normalized.updatedAt
    };

    if (!existing.email || existing.email === normalized.email) {
        syncPayload.email = normalized.email;
    }

    const needsSync = Object.entries(syncPayload).some(([key, value]) => {
        return JSON.stringify(existing[key]) !== JSON.stringify(value);
    });

    if (needsSync) {
        try {
            await update(profileRef, syncPayload);
        } catch (error) {
            console.warn('Profile sync skipped:', error.message);
        }
    }

    return normalized;
};

const EDITABLE_PROFILE_FIELDS = [
    'name',
    'username',
    'phoneNumber',
    'role',
    'organization',
    'profession',
    'company',
    'pfpUrl',
    'bannerMode',
    'bannerColor',
    'bannerGradient',
    'bannerImageUrl',
    'roles',
    'faculties',
    'about',
    'location',
    'experience',
    'certifications',
    'showExperience',
    'showCertifications'
];

export const editableProfilePayload = (data = {}) => {
    return EDITABLE_PROFILE_FIELDS.reduce((payload, field) => {
        if (Object.prototype.hasOwnProperty.call(data, field)) {
            payload[field] = data[field];
        }
        return payload;
    }, {});
};

export const updateUserProfileData = async (uid, data) => {
    const payload = {
        ...editableProfilePayload(data),
        updatedAt: Date.now()
    };
    await update(ref(db, `users/${uid}`), payload);
    return payload;
};

export const requestProfileVerification = async (uid) => {
    await update(ref(db, `users/${uid}`), {
        verificationRequested: true,
        updatedAt: Date.now()
    });
};
