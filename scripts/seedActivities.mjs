import crypto from 'crypto';
import { readFile } from 'fs/promises';

const serviceAccount = JSON.parse(await readFile(new URL('../functions/service-account.json', import.meta.url), 'utf8'));
const databaseUrl = 'https://zingoprj01-training-site-default-rtdb.asia-southeast1.firebasedatabase.app';
const firebaseApiKey = 'AIzaSyBUqUsM-LLsp9vW3FQOVzgD6tGZkk7aw98';
const defaultAdminUid = process.env.ADMIN_UID || 'nyHwJ4HklsOYZKc59zjr9Xm3txM2';

const UTeM_LOGO = '/assets/logo-utem.png';
const ATECH_LOGO = '/assets/logo-atech.png';
const KONVO_BANNER = 'https://konvo.utem.edu.my/images/2026/banner2026.jpg';

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');

const fetchJson = async (url, options = {}) => {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`${url} failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
};

const getAdminIdToken = async () => {
    const now = Math.floor(Date.now() / 1000);
    const header = { alg: 'RS256', typ: 'JWT' };
    const claim = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
        iat: now,
        exp: now + 3600,
        uid: defaultAdminUid,
    };
    const unsigned = `${base64url(header)}.${base64url(claim)}`;
    const signature = crypto
        .createSign('RSA-SHA256')
        .update(unsigned)
        .sign(serviceAccount.private_key, 'base64url');
    const assertion = `${unsigned}.${signature}`;
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${firebaseApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: assertion, returnSecureToken: true }),
    });
    if (!response.ok) {
        throw new Error(`Custom token exchange failed: ${response.status} ${await response.text()}`);
    }
    const data = await response.json();
    const users = await fetchJson(`${databaseUrl}/users.json?auth=${data.idToken}`);
    if (users?.[defaultAdminUid]?.isAdmin !== true) {
        throw new Error('Configured ADMIN_UID is not an admin in RTDB users.');
    }
    return { idToken: data.idToken, userIds: Object.keys(users || {}) };
};

const writeJson = async (path, method, body, idToken) => {
    const response = await fetch(`${databaseUrl}/${path}.json?auth=${idToken}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
        throw new Error(`${method} ${path} failed: ${response.status} ${await response.text()}`);
    }
    return response.json();
};

const bannerImages = {
    circuit: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80',
    code: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1400&q=80',
    robot: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=80',
    cloud: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1400&q=80',
    data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80',
    security: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80',
    factory: 'https://images.unsplash.com/photo-1581093458791-9f3c3bdc5f72?auto=format&fit=crop&w=1400&q=80',
    laptop: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80',
    lecture: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80',
    lab: 'https://images.unsplash.com/photo-1581093588401-fbb62a02f120?auto=format&fit=crop&w=1400&q=80',
};

const organizers = {
    utem: {
        name: 'Universiti Teknikal Malaysia Melaka',
        logo: UTeM_LOGO,
        source: 'https://www.utem.edu.my/',
    },
    atech: {
        name: 'UTeM ATech',
        logo: ATECH_LOGO,
        source: 'https://www.utem.edu.my/',
    },
    mdec: {
        name: 'Malaysia Digital Economy Corporation (MDEC)',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/9/9b/MDEC_logo.png',
        source: 'https://mdec.my/',
    },
    csm: {
        name: 'CyberSecurity Malaysia',
        logo: 'https://www.google.com/s2/favicons?domain=cybersecurity.my&sz=128',
        source: 'https://www.cybersecurity.my/',
    },
    mpc: {
        name: 'Malaysia Productivity Corporation (MPC)',
        logo: 'https://www.google.com/s2/favicons?domain=mpc.gov.my&sz=128',
        source: 'https://www.mpc.gov.my/',
    },
    mydigital: {
        name: 'MyDIGITAL Corporation',
        logo: 'https://www.google.com/s2/favicons?domain=digital.gov.my&sz=128',
        source: 'https://www.mydigital.gov.my/',
    },
};

const venues = [
    'Dewan Canselor UTeM',
    'FTMK Seminar Room, UTeM',
    'FTKE Learning Studio, UTeM',
    'UTeM Library Collaboration Space',
    'Auditorium Canselori, UTeM',
    'Technology Campus, Ayer Keroh',
];

const meetLink = (slug) => `https://meet.google.com/${slug}`;

const makeSession = ({ name, date, startTime, endTime, location, quota = 80, registered = 0 }) => ({
    name,
    date,
    startTime,
    endTime,
    location,
    quota,
    registered,
    fileUrl: '',
    fileName: '',
});

const activity = ({
    id,
    type,
    title,
    description,
    organizer,
    image,
    date,
    startTime,
    endTime,
    location,
    online = false,
    price = 0,
    sessionName,
    quota,
    registered,
}) => ({
    id,
    title,
    type,
    description,
    organizer: organizer.name,
    organizerSource: organizer.source,
    locationType: online ? 'online' : 'physical',
    location: online ? meetLink(id.replaceAll('_', '-').slice(0, 28)) : location,
    displayLocation: online ? 'Online via Google Meet' : location,
    meetLink: online ? meetLink(id.replaceAll('_', '-').slice(0, 28)) : '',
    price,
    sessionType: 'one_time',
    startDate: date,
    endDate: date,
    sessions: [
        makeSession({
            name: sessionName,
            date,
            startTime,
            endTime,
            location: online ? 'Online via Google Meet' : location,
            quota,
            registered,
        }),
    ],
    banner: image,
    poster: image,
    logo: organizer.logo,
    posted: 'Seeded activity',
    isOrganizerVerified: true,
    createdAt: Date.now(),
});

const seminarData = [
    ['seminar_ai_ethics_malaysia', 'Responsible AI for Malaysian Campuses', 'A seminar on practical AI ethics, academic integrity, privacy, and responsible AI use for Malaysian higher education.', organizers.mydigital, bannerImages.robot, '2026-07-20', '09:00', '11:00', venues[1], false, 0, 'Keynote Seminar: Responsible AI Practice'],
    ['seminar_cyber_hygiene', 'Cyber Hygiene for University Communities', 'A security awareness seminar covering phishing, password safety, secure cloud storage, and incident reporting for campus users.', organizers.csm, bannerImages.security, '2026-07-21', '10:00', '12:00', venues[4], false, 0, 'Awareness Seminar: Campus Cyber Hygiene'],
    ['seminar_data_storytelling', 'Data Storytelling with Dashboards', 'A seminar on turning raw institutional data into clear dashboard narratives for reporting and decision-making.', organizers.atech, bannerImages.data, '2026-07-22', '14:00', '16:00', venues[3], false, 15, 'Seminar Session: Dashboard Narratives'],
    ['seminar_green_technology', 'Green Technology and Smart Energy', 'A technical seminar introducing energy analytics, sensor-based monitoring, and green technology use cases for smart campuses.', organizers.utem, bannerImages.factory, '2026-07-23', '09:30', '11:30', venues[2], false, 0, 'Technical Seminar: Smart Energy'],
    ['seminar_cloud_foundations', 'Cloud Foundations for Students', 'A beginner-friendly seminar on cloud computing concepts, deployment models, and common career pathways in Malaysia.', organizers.mdec, bannerImages.cloud, '2026-07-24', '15:00', '17:00', 'Online via Google Meet', true, 0, 'Online Seminar: Cloud Foundations'],
    ['seminar_iot_safety', 'IoT Safety in Engineering Labs', 'A seminar on safe IoT device setup, network segmentation, and responsible lab data collection.', organizers.atech, bannerImages.circuit, '2026-07-27', '10:00', '12:00', venues[2], false, 0, 'Seminar Session: Secure IoT Labs'],
    ['seminar_digital_productivity', 'Digital Productivity for Student Teams', 'A productivity seminar for student project teams using documentation, task boards, and workflow automation.', organizers.mpc, bannerImages.laptop, '2026-07-28', '09:00', '11:00', venues[3], false, 10, 'Seminar Session: Digital Productivity'],
    ['seminar_research_methods', 'Research Methods for Technical Projects', 'A seminar on framing research problems, collecting evidence, and writing technical findings for engineering projects.', organizers.utem, bannerImages.lecture, '2026-07-29', '14:00', '16:00', venues[4], false, 0, 'Seminar Session: Technical Research Methods'],
    ['seminar_accessible_ui', 'Accessible UI for Public Services', 'A seminar on accessibility basics, readable interfaces, and inclusive web design for public digital services.', organizers.mydigital, bannerImages.code, '2026-07-30', '10:00', '12:00', 'Online via Google Meet', true, 0, 'Online Seminar: Accessible UI'],
    ['seminar_robotics_future', 'Robotics Trends in Industry 5.0', 'A technology seminar on robotics, human-machine collaboration, and automation trends for Malaysian industries.', organizers.atech, bannerImages.robot, '2026-07-31', '09:00', '11:00', venues[5], false, 25, 'Seminar Session: Robotics and Industry 5.0'],
];

const workshopData = [
    ['workshop_react_ui', 'React UI Build Workshop', 'A hands-on workshop where participants build a responsive activity card interface using React components and real content data.', organizers.atech, bannerImages.code, '2026-07-20', '09:00', '13:00', venues[1], false, 25, 'Hands-on Lab: React Activity Cards'],
    ['workshop_arduino_proto', 'Arduino Prototyping Workshop', 'Participants assemble a simple sensor prototype, read data, and prepare a short technical demonstration.', organizers.utem, bannerImages.circuit, '2026-07-22', '10:00', '15:00', venues[2], false, 0, 'Prototype Lab: Arduino Sensors'],
    ['workshop_python_automation', 'Python Automation Workshop', 'A practical workshop on file handling, API calls, and small automation scripts for coursework and admin tasks.', organizers.atech, bannerImages.laptop, '2026-07-23', '09:30', '13:30', venues[1], false, 20, 'Hands-on Lab: Python Automation'],
    ['workshop_power_bi', 'Power BI Dashboard Sprint', 'Participants design a simple dashboard from prepared CSV data and learn visual storytelling basics.', organizers.mpc, bannerImages.data, '2026-07-24', '14:00', '17:30', venues[3], false, 0, 'Dashboard Lab: Power BI Sprint'],
    ['workshop_network_lab', 'Network Troubleshooting Lab', 'A guided troubleshooting workshop covering IP configuration, basic routing checks, and diagnostic tools.', organizers.csm, bannerImages.security, '2026-07-27', '09:00', '13:00', venues[2], false, 15, 'Lab Session: Network Troubleshooting'],
    ['workshop_figma_frontend', 'Figma to Frontend Workshop', 'A design-to-code workshop for translating interface layouts into clean React components.', organizers.atech, bannerImages.code, '2026-07-28', '10:00', '14:00', venues[1], false, 0, 'Build Session: Figma to Frontend'],
    ['workshop_cloud_deploy', 'Cloud Deployment Workshop', 'A remote workshop on deploying a small web app, managing environment settings, and checking production logs.', organizers.mdec, bannerImages.cloud, '2026-07-29', '20:00', '22:00', 'Online via Google Meet', true, 0, 'Online Lab: Cloud Deployment'],
    ['workshop_mobile_testing', 'Mobile App Testing Workshop', 'Participants learn test cases, bug reports, and emulator-based checks for mobile app flows.', organizers.utem, bannerImages.laptop, '2026-07-30', '09:00', '12:30', venues[4], false, 0, 'Testing Lab: Mobile App Flow'],
    ['workshop_prompt_engineering', 'Prompt Engineering for Coursework', 'A structured workshop on writing useful prompts, checking AI outputs, and documenting responsible AI use.', organizers.mydigital, bannerImages.robot, '2026-07-31', '14:30', '16:30', 'Online via Google Meet', true, 0, 'Online Lab: Prompt Engineering'],
    ['workshop_3d_printing', '3D Printing Design Workshop', 'A maker workshop introducing slicing, print settings, and design checks for small engineering prototypes.', organizers.atech, bannerImages.lab, '2026-08-03', '09:00', '13:00', venues[5], false, 30, 'Maker Lab: 3D Printing Basics'],
];

const conferenceData = [
    ['conference_smart_manufacturing', 'Smart Manufacturing Mini Conference', 'A compact conference on automation, data capture, and productivity in modern Malaysian manufacturing.', organizers.mpc, bannerImages.factory, '2026-08-04', '09:00', '17:00', venues[4], false, 40, 'Main Conference: Smart Manufacturing'],
    ['conference_ai_governance', 'AI Governance in Public Services', 'A conference gathering digital policy, ethics, and implementation perspectives for AI-enabled public services.', organizers.mydigital, bannerImages.robot, '2026-08-05', '09:30', '16:30', venues[4], false, 0, 'Conference Track: AI Governance'],
    ['conference_cyber_resilience', 'Cyber Resilience Forum Malaysia', 'A technical forum on readiness, incident response, and safer digital practices for institutions.', organizers.csm, bannerImages.security, '2026-08-06', '10:00', '17:00', venues[5], false, 35, 'Forum Track: Cyber Resilience'],
    ['conference_digital_economy', 'Digital Economy Talent Conference', 'A talent-focused conference on digital skills, industry expectations, and graduate pathways.', organizers.mdec, bannerImages.cloud, '2026-08-07', '09:00', '16:00', venues[4], false, 0, 'Conference Track: Digital Talent'],
    ['conference_engineering_education', 'Engineering Education Symposium', 'A symposium on teaching practice, lab learning, and industry-linked technical education.', organizers.utem, bannerImages.lecture, '2026-08-10', '09:00', '16:30', venues[0], false, 0, 'Symposium: Engineering Education'],
    ['conference_robotics_systems', 'Robotics and Autonomous Systems Forum', 'A forum exploring robotics systems, automation safety, and applied research collaboration.', organizers.atech, bannerImages.robot, '2026-08-11', '09:30', '17:00', venues[5], false, 45, 'Forum Session: Robotics Systems'],
    ['conference_data_innovation', 'Data Innovation Day', 'A one-day conference featuring data analytics talks, dashboard showcases, and student project sharing.', organizers.atech, bannerImages.data, '2026-08-12', '09:00', '17:00', venues[3], false, 0, 'Conference Session: Data Innovation'],
    ['conference_green_campus', 'Green Campus Technology Conference', 'A conference on sustainability, energy monitoring, and responsible technology adoption in university campuses.', organizers.utem, bannerImages.factory, '2026-08-13', '09:00', '16:00', venues[0], false, 0, 'Conference Session: Green Campus'],
    ['conference_ui_services', 'Digital Services UX Conference', 'A conference on public-sector user experience, service design, and interface quality.', organizers.mydigital, bannerImages.code, '2026-08-14', '10:00', '16:00', venues[4], false, 30, 'Conference Track: Service UX'],
    ['conference_cloud_security', 'Cloud Security Practice Conference', 'A focused conference on secure cloud architecture, identity, monitoring, and data handling.', organizers.csm, bannerImages.cloud, '2026-08-17', '09:30', '16:30', venues[5], false, 50, 'Conference Track: Cloud Security'],
];

const webinarData = [
    ['webinar_github_basics', 'GitHub Basics Webinar', 'An online webinar covering repositories, commits, branches, and collaboration habits for student teams.', organizers.atech, bannerImages.code, '2026-07-20', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: GitHub Basics'],
    ['webinar_cloud_careers', 'Cloud Careers in Malaysia', 'A career webinar introducing cloud roles, certification paths, and Malaysian digital economy opportunities.', organizers.mdec, bannerImages.cloud, '2026-07-21', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Cloud Career Pathways'],
    ['webinar_data_privacy', 'Data Privacy for Students', 'An online briefing on personal data, consent, and safe handling of project datasets.', organizers.csm, bannerImages.security, '2026-07-22', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Student Data Privacy'],
    ['webinar_portfolio', 'Build a Technical Portfolio', 'A remote session on presenting projects, writing concise case studies, and preparing for internship applications.', organizers.atech, bannerImages.laptop, '2026-07-23', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Portfolio Clinic'],
    ['webinar_thesis_writing', 'Thesis Writing Workflow', 'An online session on organizing notes, references, drafts, and supervisor feedback for final-year projects.', organizers.utem, bannerImages.lecture, '2026-07-24', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Thesis Workflow'],
    ['webinar_accessibility', 'Accessibility Checks for Websites', 'A webinar on contrast, keyboard navigation, forms, and basic screen-reader friendly design.', organizers.mydigital, bannerImages.code, '2026-07-27', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Accessibility Checks'],
    ['webinar_startup_finance', 'Startup Finance Basics', 'An online primer on budgeting, simple pricing, and grant readiness for student founders.', organizers.mdec, bannerImages.data, '2026-07-28', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Startup Finance Basics'],
    ['webinar_exam_strategy', 'Technical Exam Strategy', 'A compact webinar on revision planning, problem solving, and managing engineering exam pressure.', organizers.utem, bannerImages.lecture, '2026-07-29', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Exam Strategy'],
    ['webinar_internship_prep', 'Internship Prep Webinar', 'An online session on resumes, interviews, workplace etiquette, and reporting internship outcomes.', organizers.mpc, bannerImages.laptop, '2026-07-30', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Internship Prep'],
    ['webinar_ai_study', 'AI Study Tools Without Cheating', 'A webinar on using AI for planning, explanation, and review while keeping academic integrity intact.', organizers.mydigital, bannerImages.robot, '2026-07-31', '20:00', '21:30', 'Online via Google Meet', true, 0, 'Webinar: Responsible AI Study Tools'],
];

const meetupData = [
    ['meetup_builder_night', 'Student Builder Night', 'A casual evening meetup for student builders to share prototypes, blockers, and next steps.', organizers.atech, bannerImages.laptop, '2026-08-03', '20:00', '22:00', venues[3], false, 0, 'Community Meetup: Student Builder Night'],
    ['meetup_design_critique', 'Design Critique Circle', 'A friendly critique session for UI drafts, poster layouts, and product ideas.', organizers.atech, bannerImages.code, '2026-08-04', '20:00', '22:00', venues[1], false, 0, 'Community Meetup: Design Critique'],
    ['meetup_data_jam', 'Data Jam Meetup', 'A casual meetup where participants explore sample datasets and share quick findings.', organizers.atech, bannerImages.data, '2026-08-05', '20:00', '22:00', venues[3], false, 0, 'Community Meetup: Data Jam'],
    ['meetup_hardware_hangout', 'Hardware Hangout', 'A hands-on social meetup for discussing sensors, microcontrollers, and small prototype ideas.', organizers.utem, bannerImages.circuit, '2026-08-06', '20:00', '22:00', venues[2], false, 0, 'Community Meetup: Hardware Hangout'],
    ['meetup_open_source', 'Open Source Circle', 'A meetup for students interested in contributing to documentation, bug fixes, and open source projects.', organizers.atech, bannerImages.code, '2026-08-07', '20:00', '22:00', venues[1], false, 0, 'Community Meetup: Open Source Circle'],
    ['meetup_women_tech', 'Women in Tech Connect', 'A supportive networking meetup for women students, trainers, and lecturers in technology fields.', organizers.mydigital, bannerImages.lecture, '2026-08-10', '20:00', '22:00', venues[3], false, 0, 'Community Meetup: Women in Tech Connect'],
    ['meetup_research_mixer', 'Research Mixer', 'A cross-faculty meetup for sharing research interests and finding project collaborators.', organizers.utem, bannerImages.lab, '2026-08-11', '20:00', '22:00', venues[4], false, 0, 'Community Meetup: Research Mixer'],
    ['meetup_founder_coffee', 'Founder Coffee Chat', 'A small-group meetup for student founders to discuss validation, pitch clarity, and early customers.', organizers.mdec, bannerImages.data, '2026-08-12', '20:00', '22:00', venues[5], false, 0, 'Community Meetup: Founder Coffee'],
    ['meetup_security_club', 'Security Club Meetup', 'A community session for discussing safe lab practice, CTF learning, and cybersecurity career routes.', organizers.csm, bannerImages.security, '2026-08-13', '20:00', '22:00', venues[1], false, 0, 'Community Meetup: Security Club'],
    ['meetup_productivity_circle', 'Productivity Circle', 'A casual meetup on study systems, team workflows, and practical productivity habits.', organizers.mpc, bannerImages.laptop, '2026-08-14', '20:00', '22:00', venues[3], false, 0, 'Community Meetup: Productivity Circle'],
];

const buildActivities = (rows, type) => rows.map((row, index) => activity({
    id: row[0],
    type,
    title: row[1],
    description: row[2],
    organizer: row[3],
    image: row[4],
    date: row[5],
    startTime: row[6],
    endTime: row[7],
    location: row[8],
    online: row[9],
    price: row[10],
    sessionName: row[11],
    quota: 60 + (index * 8),
    registered: (index * 5) % 24,
}));

const konvoEvent = {
    id: 'seed_event_konvo22',
    title: 'Majlis Konvokesyen Ke-22 UTeM Tahun 2026',
    type: 'Event',
    description: 'Majlis Konvokesyen Ke-22 UTeM Tahun 2026 berlangsung pada 31 Oktober hingga 2 November 2026 di Dewan Canselor UTeM. Sesi penganugerahan ini mengikut jadual rasmi laman konvokesyen UTeM.',
    organizer: organizers.utem.name,
    organizerSource: 'https://konvo.utem.edu.my/ms/konvokesyen-22/sesi-penganugerahan.html',
    locationType: 'physical',
    location: 'Dewan Canselor UTeM',
    displayLocation: 'Dewan Canselor UTeM',
    meetLink: '',
    price: 0,
    sessionType: 'multiple',
    startDate: '2026-10-31',
    endDate: '2026-11-02',
    sessions: [
        makeSession({ name: 'Sesi 1 Pascasiswazah', date: '2026-10-31', startTime: '07:30', endTime: '12:00', location: 'Dewan Canselor', quota: 1200 }),
        makeSession({ name: 'Sesi 2 Sarjana Muda FTKE dan Diploma FTKE', date: '2026-10-31', startTime: '13:00', endTime: '17:00', location: 'Dewan Canselor', quota: 1200 }),
        makeSession({ name: 'Sesi 3 Sarjana Muda FAIX, FTMK dan Diploma FTMK', date: '2026-11-01', startTime: '07:30', endTime: '12:00', location: 'Dewan Canselor', quota: 1200 }),
        makeSession({ name: 'Sesi 4 Sarjana Muda FTKM dan Diploma FTKM', date: '2026-11-01', startTime: '13:00', endTime: '17:00', location: 'Dewan Canselor', quota: 1200 }),
        makeSession({ name: 'Sesi 5 Sarjana Muda FPTT, FTKIP dan Diploma FTKIP', date: '2026-11-02', startTime: '07:30', endTime: '12:00', location: 'Dewan Canselor', quota: 1200 }),
        makeSession({ name: 'Sesi 6 Sarjana Muda FTKEK dan Diploma FTKEK', date: '2026-11-02', startTime: '13:00', endTime: '17:00', location: 'Dewan Canselor', quota: 1200 }),
    ],
    banner: KONVO_BANNER,
    poster: KONVO_BANNER,
    logo: UTeM_LOGO,
    fileUrl: 'https://konvo.utem.edu.my/ms/konvokesyen-22/sesi-penganugerahan.html',
    fileName: 'Jadual rasmi sesi penganugerahan',
    posted: 'Official UTeM event',
    isOrganizerVerified: true,
    officialSource: 'https://konvo.utem.edu.my/ms/konvokesyen-22/sesi-penganugerahan.html',
    createdAt: Date.now(),
};

const activities = [
    konvoEvent,
    ...buildActivities(seminarData, 'Seminar'),
    ...buildActivities(workshopData, 'Workshop'),
    ...buildActivities(conferenceData, 'Conference'),
    ...buildActivities(webinarData, 'Webinar'),
    ...buildActivities(meetupData, 'Meetup'),
];

const { idToken, userIds } = await getAdminIdToken();
for (const userId of userIds) {
    await writeJson(`user_registrations/${userId}`, 'DELETE', undefined, idToken);
}

const desiredIds = new Set(activities.map(activityItem => activityItem.id));
for (const activityItem of activities) {
    await writeJson(`seminars/${activityItem.id}`, 'PUT', activityItem, idToken);
}
const existingSeminars = await fetchJson(`${databaseUrl}/seminars.json?shallow=true`);
for (const seminarId of Object.keys(existingSeminars || {})) {
    if (!desiredIds.has(seminarId)) {
        await writeJson(`seminars/${seminarId}`, 'DELETE', undefined, idToken);
    }
}

console.log(`Seeded ${activities.length} activities: 1 event, 10 seminars, 10 workshops, 10 conferences, 10 webinars, 10 meetups.`);
