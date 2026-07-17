import React, { createContext, useState, useContext, useEffect } from 'react';
import { db, auth } from '../firebase';
import { ref, onValue, set, push, update, get } from 'firebase/database';

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

    const registerForSeminar = async (seminarId, sessionIndices) => {
        const seminar = seminars.find(s => s.id === seminarId);
        if (!seminar) return;

        const updatedSessions = seminar.sessions.map((session, index) => {
            if (sessionIndices.includes(index)) {
                return { ...session, registered: (session.registered || 0) + 1 };
            }
            return session;
        });

        await update(ref(db, `seminars/${seminarId}`), {
            sessions: updatedSessions
        });

        if (auth.currentUser) {
            const userRef = ref(db, `user_registrations/${auth.currentUser.uid}`);
            const newRegRef = push(userRef);
            
            // Map selected sessions
            const registeredSessions = sessionIndices.map(idx => seminar.sessions[idx]);
            
            await set(newRegRef, {
                seminarId,
                seminarTitle: seminar.title,
                organizer: seminar.organizer,
                type: seminar.type,
                locationType: seminar.locationType,
                poster: seminar.poster || seminar.banner || '',
                sessions: registeredSessions,
                registeredAt: new Date().toISOString(),
                status: 'Confirmed'
            });
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
        <SeminarContext.Provider value={{ seminars, addSeminar, registerForSeminar, getUserActivities, loading, collections, addCollection, unlockCollection, getUserCollections, loadingCollections }}>
            {children}
        </SeminarContext.Provider>
    );
};

export const useSeminars = () => useContext(SeminarContext);
