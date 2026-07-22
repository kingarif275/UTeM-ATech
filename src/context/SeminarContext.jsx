import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, set, push, update, get } from 'firebase/database';
import { LAUNCH_PROGRAMME, REGISTRATION_STATUSES } from '../data/atechContent';

const SeminarContext = createContext();

const normalizeCollection = (collection, id) => {
    const title = collection.title || collection.name || 'Untitled Source';
    const coverUrl = collection.coverUrl || collection.coverImage || '';
    const createdAt = collection.createdAt || Date.now();
    return {
        ...collection,
        id: id || collection.id,
        title,
        name: title,
        coverUrl,
        coverImage: coverUrl,
        onlyViewableInApp: collection.onlyViewableInApp ?? collection.onlyViewInApp ?? false,
        onlyViewInApp: collection.onlyViewInApp ?? collection.onlyViewableInApp ?? false,
        createdAt,
        postedAt: collection.postedAt || new Date(createdAt).toISOString()
    };
};

const splitCollectionForStorage = (collection) => {
    const privateKeys = ['fileUrl', 'fileName', 'isDownloadable', 'onlyViewInApp', 'onlyViewableInApp'];
    const publicCollection = { ...collection };
    const privateCollection = {};

    privateKeys.forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(publicCollection, key)) {
            privateCollection[key] = publicCollection[key];
            delete publicCollection[key];
        }
    });

    return { publicCollection, privateCollection };
};

const makeRegistrationReference = () => {
    const year = new Date().getFullYear();
    const serial = String(Date.now()).slice(-6).padStart(6, '0');
    return `ATR-${year}-${serial}`;
};

export const SeminarProvider = ({ children }) => {
    const [seminars, setSeminars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [loadingCollections, setLoadingCollections] = useState(true);

    useEffect(() => {
        const seminarsRef = ref(db, 'seminars');

        const unsubscribe = onValue(seminarsRef, (snapshot) => {
            if (snapshot.exists()) {
                const loadedSeminars = [];
                snapshot.forEach((childSnapshot) => {
                    loadedSeminars.push({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    });
                });
                // Sort by pushing newest first intuitively
                setSeminars(loadedSeminars.reverse());
            } else {
                setSeminars([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const collectionsRef = ref(db, 'collections');
        const unsubscribe = onValue(collectionsRef, (snapshot) => {
            if (snapshot.exists()) {
                const loadedCollections = [];
                snapshot.forEach((childSnapshot) => {
                    loadedCollections.push(normalizeCollection({
                        id: childSnapshot.key,
                        ...childSnapshot.val()
                    }, childSnapshot.key));
                });
                setCollections(loadedCollections.reverse());
            } else {
                setCollections([]);
            }
            setLoadingCollections(false);
        });
        return () => unsubscribe();
    }, []);

    const addSeminar = async (newSeminar) => {
        try {
            console.log("[SeminarContext] Preparing to add seminar to RTDB:", newSeminar);
            const seminarWithMeta = {
                ...newSeminar,
                posted: 'Just now',
                logo: newSeminar.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(newSeminar.organizer)}&background=random&color=fff`,
                banner: newSeminar.banner || 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            };
            console.log("[SeminarContext] Generating new ref...");
            const newRef = push(ref(db, 'seminars'));
            console.log("[SeminarContext] New ref generated:", newRef.key);
            console.log("[SeminarContext] Awaiting set() operation...");
            await set(newRef, { ...seminarWithMeta, id: newRef.key });
            console.log("[SeminarContext] set() operation successful.");
        } catch (error) {
            console.error("[SeminarContext] Error in addSeminar:", error);
            throw error; // Re-throw to be caught by the component
        }
    };

    const registerForSeminar = async (seminarId, sessionIndices, attendee = {}) => {
        const seminar = seminars.find(s => s.id === seminarId) || (seminarId === 'launch-minitab' ? {
            id: 'launch-minitab',
            title: LAUNCH_PROGRAMME.title,
            organizer: LAUNCH_PROGRAMME.trainer,
            type: 'Workshop',
            locationType: LAUNCH_PROGRAMME.platform,
            poster: '',
            sessions: [{ name: LAUNCH_PROGRAMME.mode, date: LAUNCH_PROGRAMME.rawDate, startTime: '08:00', endTime: '17:00', quota: 40, registered: 0 }]
        } : null);
        if (!seminar) return;

        const registeredSessions = sessionIndices.map(idx => seminar.sessions[idx]);
        const registrationPayload = {
            seminarId,
            seminarTitle: seminar.title,
            organizer: seminar.organizer,
            type: seminar.type,
            locationType: seminar.locationType,
            poster: seminar.poster || seminar.banner || '',
            sessions: registeredSessions,
            attendee: {
                fullName: attendee.fullName || auth.currentUser?.displayName || '',
                email: attendee.email || auth.currentUser?.email || '',
                phoneNumber: attendee.phoneNumber || '',
                role: attendee.role || attendee.profession || '',
                organization: attendee.organization || attendee.company || '',
                registrationCategory: attendee.registrationCategory || '',
                remarks: attendee.remarks || ''
            },
            registrationMethod: attendee.registrationMethod || (auth.currentUser ? 'account' : 'manual'),
            referenceNumber: makeRegistrationReference(),
            registeredAt: new Date().toISOString(),
            status: REGISTRATION_STATUSES[0],
            paymentStatus: 'Pending Review',
            nextAction: 'ATech will review your reservation and send payment instructions.'
        };

        if (auth.currentUser) {
            const userRef = ref(db, `user_registrations/${auth.currentUser.uid}`);
            const newRegRef = push(userRef);
            const activityRegRef = push(ref(db, `activity_registrations/${seminarId}`));
            const savedPayload = {
                ...registrationPayload,
                userId: auth.currentUser.uid,
                registrationId: newRegRef.key
            };
            await set(newRegRef, {
                ...savedPayload,
                activityRegistrationId: activityRegRef.key
            });
            try {
                await set(activityRegRef, savedPayload);
            } catch (error) {
                console.warn("Registration saved, but organizer enrollment index could not be updated:", error);
            }
        } else {
            const guestRef = push(ref(db, `activity_registrations/${seminarId}`));
            const guestPayload = {
                ...registrationPayload,
                registrationId: guestRef.key
            };
            try {
                await set(guestRef, guestPayload);
            } catch {
                const legacyGuestRef = push(ref(db, `guest_registrations/${seminarId}`));
                try {
                    await set(legacyGuestRef, {
                        ...guestPayload,
                        registrationId: legacyGuestRef.key
                    });
                } catch {
                    throw new Error('Registration is blocked by database permissions. Deploy the updated Realtime Database rules, then try again.');
                }
            }
        }

        if (seminars.some(s => s.id === seminarId)) {
            const updatedSessions = seminar.sessions.map((session, index) => {
                if (sessionIndices.includes(index)) {
                    return { ...session, registered: (session.registered || 0) + 1 };
                }
                return session;
            });

            try {
                await update(ref(db, `seminars/${seminarId}`), {
                    sessions: updatedSessions
                });
            } catch (error) {
                console.warn("Registration saved, but session count could not be updated:", error);
            }
        }
    };

    const getUserActivities = async (userId) => {
        try {
            const userRef = ref(db, `user_registrations/${userId}`);
            const snapshot = await get(userRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                const activities = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                }));
                return activities.reverse(); // Newest first
            }
            return [];
        } catch (error) {
            console.error("Error fetching user activities:", error);
            return [];
        }
    };

    const addCollection = async (newCollection) => {
        try {
            const collectionRef = push(ref(db, 'collections'));
            const collectionWithId = normalizeCollection({
                ...newCollection,
                creatorId: auth.currentUser?.uid || '',
                creatorName: auth.currentUser?.displayName || 'Unknown Creator',
            }, collectionRef.key);
            const { publicCollection, privateCollection } = splitCollectionForStorage(collectionWithId);
            const privatePayload = {
                ...privateCollection,
                creatorId: publicCollection.creatorId,
                createdAt: publicCollection.createdAt,
            };
            await set(collectionRef, publicCollection);
            await set(ref(db, `collection_private/${collectionRef.key}`), privatePayload);
            
            // Auto unlock for creator
            if (auth.currentUser) {
                await set(ref(db, `user_collections/${auth.currentUser.uid}/${collectionRef.key}`), collectionWithId);
            }
        } catch (error) {
            console.error("Error in addCollection:", error);
            throw error;
        }
    };

    const getActivityRegistrations = async (seminarId) => {
        try {
            const snapshot = await get(ref(db, `activity_registrations/${seminarId}`));
            if (!snapshot.exists()) return [];
            return Object.entries(snapshot.val() || {}).map(([id, value]) => ({
                id,
                ...value
            })).sort((a, b) => new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0));
        } catch (error) {
            console.error("Error fetching activity registrations:", error);
            return [];
        }
    };

    const unlockCollection = async (collectionId) => {
        if (!auth.currentUser) return;
        const collection = collections.find(item => item.id === collectionId);
        if (!collection) return;
        const publicCollection = normalizeCollection(collection, collectionId);
        await set(ref(db, `user_collections/${auth.currentUser.uid}/${collectionId}`), publicCollection);

        const privateSnapshot = await get(ref(db, `collection_private/${collectionId}`));
        if (privateSnapshot.exists()) {
            await update(ref(db, `user_collections/${auth.currentUser.uid}/${collectionId}`), privateSnapshot.val());
        }
    };

    const getUserCollections = async (userId) => {
        try {
            const snapshot = await get(ref(db, `user_collections/${userId}`));
            if (snapshot.exists()) {
                const value = snapshot.val();
                return Object.keys(value).map(key => normalizeCollection(value[key]?.id ? value[key] : { id: key }, key));
            }
            return [];
        } catch (error) {
            console.error("Error fetching user collections:", error);
            return [];
        }
    };

    return (
        <SeminarContext.Provider value={{ seminars, addSeminar, registerForSeminar, getUserActivities, getActivityRegistrations, loading, collections, addCollection, unlockCollection, getUserCollections, loadingCollections }}>
            {children}
        </SeminarContext.Provider>
    );
};

export const useSeminars = () => useContext(SeminarContext);
