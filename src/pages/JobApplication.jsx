import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const JobApplication = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const job = state?.job;

    useEffect(() => {
        document.title = "UTeM ATech - Job Application";
    }, []);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        coverLetter: '',
        resume: null
    });

    const [submitted, setSubmitted] = useState(false);

    // Fallback if accessed directly without state
    if (!job) {
        return (
            <>
                <Navbar />
                <div className="container" style={{ paddingTop: '100px', textAlign: 'center' }}>
                    <h2>Job not found</h2>
                    <button className="btn btn-primary" onClick={() => navigate('/jobs')}>Back to Jobs</button>
                </div>
            </>
        );
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simulate API call
        setTimeout(() => {
            setSubmitted(true);
            // Reset form or redirect after some time
        }, 1000);
    };

    if (submitted) {
        return (
            <>
                <Navbar />
                <div className="container flex-center" style={{ minHeight: '80vh', flexDirection: 'column', textAlign: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: '#e6f4ea',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '24px',
                        color: '#1e8e3e'
                    }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Application Sent!</h2>
                    <p style={{ color: 'var(--text-light)', marginBottom: '32px' }}>
                        Thanks for applying to <strong>{job.company}</strong>. We'll be in touch soon.
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/jobs')}>
                        Browse More Jobs
                    </button>
                </div>
            </>
        )
    }

    return (
        <>
            <Navbar />
            <div className="container" style={{ paddingTop: '100px', paddingBottom: '80px', maxWidth: '800px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'transparent',
                        color: 'var(--text-light)',
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                    }}
                >
                    &larr; Back to job details
                </button>

                <div style={{ marginBottom: '40px' }}>
                    <span style={{
                        background: '#f1f3f4',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'var(--text-dark)',
                        display: 'inline-block',
                        marginBottom: '16px'
                    }}>
                        {job.type}
                    </span>
                    <h1 style={{ fontSize: '40px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.2' }}>
                        Apply for {job.title}
                    </h1>
                    <p style={{ fontSize: '18px', color: 'var(--text-light)' }}>
                        at <strong style={{ color: 'var(--text-dark)' }}>{job.company}</strong> &bull; {job.location}
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '40px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                required
                                value={formData.fullName}
                                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                required
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input
                            type="tel"
                            className="form-input"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Resume / CV</label>
                        <div style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: '12px',
                            padding: '32px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: '#f8f9fa'
                        }}>
                            <p style={{ fontWeight: '500', marginBottom: '8px' }}>Click to upload or drag and drop</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>PDF, DOCX up to 10MB</p>
                            <input type="file" style={{ opacity: 0, position: 'absolute', width: '1px', height: '1px' }} id="resume-upload" />
                            <label htmlFor="resume-upload" className="btn btn-primary" style={{ marginTop: '16px', display: 'inline-flex', padding: '8px 24px', fontSize: '14px' }}>
                                Select File
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Cover Letter</label>
                        <textarea
                            className="form-input"
                            rows="6"
                            style={{ resize: 'vertical' }}
                            value={formData.coverLetter}
                            onChange={e => setFormData({ ...formData, coverLetter: e.target.value })}
                            placeholder="Tell us why you're a great fit..."
                        ></textarea>
                    </div>

                    <div style={{ marginTop: '32px', textAlign: 'right' }}>
                        <button type="submit" className="btn btn-primary" style={{ padding: '14px 48px', fontSize: '18px' }}>
                            Submit Application
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default JobApplication;
