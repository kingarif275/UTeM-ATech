import React, { createContext, useState, useContext } from 'react';

const JobContext = createContext();

const INITIAL_JOBS = [
    {
        id: 1,
        title: 'Senior Frontend Developer',
        company: 'TechCorp',
        location: 'Remote',
        type: 'Full-time',
        description: 'We are looking for an experienced React developer to lead our frontend team.',
        posted: '2 days ago',
        logo: 'https://ui-avatars.com/api/?name=Tech+Corp&background=0D8ABC&color=fff'
    },
    {
        id: 2,
        title: 'Product Designer',
        company: 'Creative Studio',
        location: 'New York, NY',
        type: 'Contract',
        description: 'Join our award-winning design team to create stunning user experiences.',
        posted: '1 week ago',
        logo: 'https://ui-avatars.com/api/?name=Creative+Studio&background=ff5252&color=fff'
    },
    {
        id: 3,
        title: 'Backend Engineer',
        company: 'DataFlow',
        location: 'San Francisco, CA',
        type: 'Full-time',
        description: 'Scale our distributed systems and optimize data processing pipelines.',
        posted: '3 days ago',
        logo: 'https://ui-avatars.com/api/?name=Data+Flow&background=4caf50&color=fff'
    },
    {
        id: 4,
        title: 'Marketing Manager',
        company: 'GrowthHub',
        location: 'London, UK',
        type: 'Full-time',
        description: 'Drive growth and brand awareness through innovative marketing strategies.',
        posted: '5 days ago',
        logo: 'https://ui-avatars.com/api/?name=Growth+Hub&background=ff9800&color=fff'
    },
];

export const JobProvider = ({ children }) => {
    const [jobs, setJobs] = useState(INITIAL_JOBS);

    const addJob = (newJob) => {
        // Basic ID generation
        const jobWithId = {
            ...newJob,
            id: Date.now(),
            posted: 'Just now',
            logo: `https://ui-avatars.com/api/?name=${encodeURIComponent(newJob.company)}&background=random&color=fff`
        };
        setJobs(prevJobs => [jobWithId, ...prevJobs]);
    };

    return (
        <JobContext.Provider value={{ jobs, addJob }}>
            {children}
        </JobContext.Provider>
    );
};

export const useJobs = () => useContext(JobContext);
