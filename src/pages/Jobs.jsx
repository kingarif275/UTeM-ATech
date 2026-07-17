import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useJobs } from '../context/JobContext';

const Jobs = () => {
    const { jobs } = useJobs();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        document.title = "UTeM ATech - Jobs";
    }, []);

    const filteredJobs = jobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                <div style={{ textAlign: 'center', marginBottom: '60px' }}>
                    <h1 style={{ fontSize: '48px', fontWeight: '700', marginBottom: '16px' }}>
                        Find your next dream job
                    </h1>
                    <p style={{ fontSize: '20px', color: 'var(--text-light)', marginBottom: '40px' }}>
                        Browse thousands of job openings from top companies.
                    </p>

                    <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
                        <input
                            type="text"
                            placeholder="Search by job title or company..."
                            className="form-input"
                            style={{
                                padding: '16px 24px',
                                borderRadius: '999px', // Pill shape search bar
                                paddingRight: '60px',
                                fontSize: '18px',
                                width: '100%'
                            }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                            style={{
                                position: 'absolute',
                                right: '8px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'var(--primary-color)',
                                color: 'white',
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                    {filteredJobs.map(job => (
                        <div key={job.id} style={{
                            background: 'white',
                            borderRadius: '24px',
                            padding: '32px',
                            border: '1px solid var(--border-color)',
                            transition: 'all 0.2s',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px'
                        }}
                            className="job-card"
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.08)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <img src={job.logo} alt={job.company} style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
                                <span style={{
                                    background: '#f1f3f4',
                                    padding: '6px 12px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: 'var(--text-dark)'
                                }}>
                                    {job.type}
                                </span>
                            </div>

                            <div>
                                <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>{job.title}</h3>
                                <p style={{ color: 'var(--text-light)', fontSize: '14px', fontWeight: '500' }}>{job.company} • {job.location}</p>
                            </div>

                            <p style={{ color: 'var(--text-light)', fontSize: '15px', lineHeight: '1.6', flex: 1 }}>
                                {job.description}
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                                <span style={{ fontSize: '13px', color: '#9aa0a6' }}>{job.posted}</span>
                                <Link
                                    to={`/apply/${job.id}`}
                                    state={{ job }}
                                    style={{ display: 'flex', alignItems: 'center', fontWeight: '600', fontSize: '15px', color: 'var(--text-dark)' }}
                                >
                                    Apply Now &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredJobs.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '60px' }}>
                        <p style={{ fontSize: '18px' }}>No jobs found matching your search.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default Jobs;
