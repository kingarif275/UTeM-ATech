import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set } from 'firebase/database';
import trainersData from '../trainers_data_simple.json';
import { FTKE_FACULTY } from '../utils/profileOptions';

const TrainerContext = createContext();

const normalizeTrainer = (trainer) => {
    if (!trainer?.isCertified) return trainer;
    return {
        ...trainer,
        roles: ['Expert Trainer', 'Certified Trainer', 'Lecturer'],
        faculty: trainer.faculty || FTKE_FACULTY
    };
};

export const TrainerProvider = ({ children }) => {
    const [trainers, setTrainers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const trainersRef = ref(db, 'trainers');

        const unsubscribe = onValue(trainersRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Map the object to an array and ensure ID is correctly handled
                const loadedTrainers = Object.keys(data).map(key => normalizeTrainer({
                    id: parseInt(key),
                    ...data[key]
                }));
                setTrainers(loadedTrainers);
            } else {
                console.log("[TrainerContext] Seeding trainers data to Firebase...");
                // Seed with initial data if database is empty
                trainersData.forEach(trainer => {
                    const { id, ...trainerDataWithoutId } = trainer;
                    set(ref(db, `trainers/${id}`), normalizeTrainer(trainerDataWithoutId));
                });
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <TrainerContext.Provider value={{ trainers, loading }}>
            {children}
        </TrainerContext.Provider>
    );
};

export const useTrainers = () => useContext(TrainerContext);
