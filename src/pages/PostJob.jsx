import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../context/JobContext';

const PostJob = () => {
    const navigate = useNavigate();
    const { addJob } = useJobs();

    useEffect(() => {
        document.title = "UTeM ATech - Post a Job";
    }, []);
    const [jobData, setJobData] = useState({
        title: '',
        company: '',
        location: '',
        type: 'Full-time',
        description: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        addJob(jobData); // Add job to global state
        navigate('/jobs'); // Redirect to jobs list
    };

    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '16px' }}>Post a New Job</h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-light)' }}>
                        Find the best talent for your team.
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '40px' }}>
                    <div className="form-group">
                        <label className="form-label">Job Title</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Senior Frontend Engineer"
                            required
                            value={jobData.title}
                            onChange={e => setJobData({ ...jobData, title: e.target.value })}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="form-group">
                            <label className="form-label">Company Name</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={jobData.company}
                                onChange={e => setJobData({ ...jobData, company: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="e.g. Remote, New York"
                                required
                                value={jobData.location}
                                onChange={e => setJobData({ ...jobData, location: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Job Type</label>
                        <select
                            className="form-input"
                            value={jobData.type}
                            onChange={e => setJobData({ ...jobData, type: e.target.value })}
                            style={{ appearance: 'none' }} // Custom arrow could be added
                        >
                            <option value="Full-time">Full-time</option>
                            <option value="Part-time">Part-time</option>
                            <option value="Contract">Contract</option>
                            <option value="Internship">Internship</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Job Description</label>
                        <textarea
                            className="form-input"
                            rows="8"
                            style={{ resize: 'vertical' }}
                            value={jobData.description}
                            onChange={e => setJobData({ ...jobData, description: e.target.value })}
                            placeholder="Describe the role, responsibilities, and requirements..."
                        ></textarea>
                    </div>

                    <div style={{ marginTop: '32px', textAlign: 'right' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '14px 48px', fontSize: '18px' }}>
                            Post Job
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default PostJob;
