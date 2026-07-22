import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { LAUNCH_PROGRAMME, PUBLICATIONS, TRAINING_CATEGORIES } from '../data/atechContent';

const pageData = {
    about: {
        title: 'About ATech',
        eyebrow: 'Engineering Professional Development Hub',
        intro: 'UTeM Advanced Technology Skills & Industry Training connects university expertise, industry practice, publications, and professional certification pathways.',
        sections: [
            ['Who We Are', 'ATech UTeM provides practical engineering training led by UTeM academicians, expert trainers, and industry collaborators.'],
            ['Vision and Mission', 'Build competence, inspire innovation, and shape the future of engineering professionals through credible, industry-oriented learning.'],
            ['Core Values', 'Excellence, practical learning, industry relevance, knowledge sharing, and continuous innovation.'],
            ['Knowledge Ecosystem', 'Academy, experts, publications, industry solutions, training quality, and future certification pathways.'],
            ['Facilities and Laboratories', 'Programmes may use UTeM laboratories, engineering tools, and partner facilities based on programme needs.']
        ]
    },
    corporate: {
        title: 'Corporate Training',
        eyebrow: 'Training Designed Around Your Organisation',
        intro: 'Request customised, in-house, online, hybrid, or consultancy-linked training for engineering and technical teams.',
        sections: [
            ['Custom Programme Design', 'ATech can shape content around your technical topic, skill gap, preferred date, and participant profile.'],
            ['Delivery Options', 'Training may run at UTeM, client premises, or through Microsoft Teams for online delivery.'],
            ['HRD Corp Support', 'Claim support can be highlighted where the programme and arrangement are applicable.'],
            ['Request Details', 'Send organisation, contact person, topic, preferred date, participant count, and remarks through the enquiry form.']
        ]
    },
    news: {
        title: 'News & Gallery',
        eyebrow: 'Training Highlights',
        intro: 'ATech announcements, completed programme highlights, photo galleries, testimonials, and industry collaboration stories will be published here.',
        sections: [
            ['Upcoming Announcements', `${LAUNCH_PROGRAMME.title} is prepared as the launch programme for the ATech training brand.`],
            ['Completed Training Highlights', 'Completed programme posts should use real photos, accurate captions, and verified participant feedback.'],
            ['Success Stories', 'Industry collaboration stories will focus on practical outcomes and credible learning impact.']
        ]
    },
    contact: {
        title: 'Contact ATech',
        eyebrow: 'General and Training Enquiries',
        intro: 'Use this page for official ATech enquiries, programme questions, corporate requests, and registration support.',
        sections: [
            ['Official Name', 'UTeM Advanced Technology Skills & Industry Training (ATech), Universiti Teknikal Malaysia Melaka.'],
            ['Enquiry Channels', 'Official email, phone, WhatsApp, and map details should be added only after approval by ATech.'],
            ['Response Time', 'ATech will respond to enquiries as soon as possible during working days.']
        ]
    }
};

const PublicInfoPage = ({ type = 'about' }) => {
    const navigate = useNavigate();
    const params = useParams();
    const publication = params.slug
        ? PUBLICATIONS.find(item => item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === params.slug)
        : null;
    const data = publication ? {
        title: publication.title,
        eyebrow: `${publication.category} - ${publication.year}`,
        intro: publication.description,
        sections: [
            ['Author', publication.author],
            ['Synopsis', publication.description],
            ['Related Training', LAUNCH_PROGRAMME.title],
            ['Purchase / Enquiry', 'Publication enquiry and sample download links can be connected after official approval.']
        ]
    } : pageData[type];

    return (
        <div style={{ minHeight: '100vh', background: '#ffffff' }}>
            <Navbar />
            <main className="container page-content" style={{ paddingTop: '112px', paddingBottom: '80px' }}>
                <header style={{ maxWidth: '920px', marginBottom: '34px' }}>
                    <p style={{ color: '#f47a20', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px' }}>{data.eyebrow}</p>
                    <h1 style={{ color: '#0b2d5c', fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 1, fontWeight: 950, margin: '0 0 18px', letterSpacing: 0 }}>{data.title}</h1>
                    <p style={{ color: '#374151', fontSize: '18px', lineHeight: 1.7, margin: 0 }}>{data.intro}</p>
                </header>

                <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px', marginBottom: '36px' }}>
                    {data.sections.map(([heading, body]) => (
                        <article key={heading} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '22px', background: '#f8fafc' }}>
                            <h2 style={{ fontSize: '18px', color: '#0b2d5c', margin: '0 0 10px', fontWeight: 900 }}>{heading}</h2>
                            <p style={{ color: '#4b5563', lineHeight: 1.65, margin: 0 }}>{body}</p>
                        </article>
                    ))}
                </section>

                {type === 'corporate' && (
                    <form style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', display: 'grid', gap: '16px', maxWidth: '760px' }}>
                        <h2 style={{ margin: 0, color: '#0b2d5c' }}>Corporate Request Form</h2>
                        <div className="form-grid-2">
                            <input className="form-input" placeholder="Organisation" />
                            <input className="form-input" placeholder="Contact person" />
                            <input className="form-input" placeholder="Training topic" />
                            <input className="form-input" type="date" />
                            <input className="form-input" type="number" min="1" placeholder="Number of participants" />
                            <input className="form-input" placeholder="Remarks" />
                        </div>
                        <button className="btn btn-primary" type="button" style={{ justifySelf: 'start' }}>Submit Enquiry</button>
                    </form>
                )}

                {type === 'about' && (
                    <section style={{ marginTop: '24px' }}>
                        <h2 style={{ color: '#0b2d5c', fontWeight: 900 }}>Training Categories</h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                            {TRAINING_CATEGORIES.map(category => (
                                <button key={category} type="button" onClick={() => navigate(`/register?search=${encodeURIComponent(category)}`)} style={{ border: '1px solid #dbe4ef', background: '#ffffff', borderRadius: '999px', padding: '10px 14px', fontWeight: 800, color: '#0b2d5c', cursor: 'pointer' }}>
                                    {category}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};

export default PublicInfoPage;
