export const ROLE_OPTIONS = [
    'Student',
    'Lecturer',
    'Engineer',
    'Technician',
    'Researcher',
    'Manager',
    'Industry Professional',
    'Government / Agency Officer',
    'Other'
];

export const REGISTRATION_CATEGORIES = ['Student', 'Non-Student'];

export const REGISTRATION_STATUSES = [
    'Registration Received',
    'Under Review',
    'Payment Invitation Sent',
    'Payment Received',
    'Registration Confirmed',
    'Training Reminder Sent',
    'Training Completed',
    'Certificate Ready'
];

export const PROGRAMME_STATUSES = ['Open', 'Limited Seats', 'Full', 'Waiting List', 'Closed', 'Completed'];

export const TRAINING_CATEGORIES = [
    'Electrical Engineering',
    'Power Systems & Protection',
    'PLC & Industrial Automation',
    'Artificial Intelligence & Machine Learning',
    'IoT & Embedded Systems',
    'Signal Processing & MATLAB',
    'Data Analytics & Engineering Statistics',
    'Solar PV & Renewable Energy',
    'AutoCAD & Engineering Software'
];

export const QUICK_TRAINING_FILTERS = [
    'Training',
    'Workshop',
    'Seminar',
    'Webinar',
    'Physical',
    'Online',
    'HRD Corp Claimable',
    'Free',
    'Paid'
];

export const LAUNCH_PROGRAMME = {
    title: 'Statistical Analysis for Engineering Data using MINITAB with Hands-on Workshop',
    code: 'ATECH-MINITAB-2026',
    date: '29 August 2026',
    rawDate: '2026-08-29',
    time: '8:00 AM - 5:00 PM',
    mode: 'Online',
    platform: 'Microsoft Teams',
    feeStudent: 180,
    feeNonStudent: 210,
    trainer: 'Dr. Arfah Ahmad',
    category: 'Data Analytics & Engineering Statistics',
    status: 'Open',
    overview: 'A hands-on engineering statistics workshop focused on data analysis, DOE, and practical MINITAB workflows for technical decision-making.'
};

export const PUBLICATIONS = [
    {
        title: 'Engineering Data Analysis Field Manual',
        author: 'ATech Trainer Authors',
        year: '2026',
        category: 'Training Manual',
        description: 'Practical examples and templates for professional engineering analysis workshops.'
    },
    {
        title: 'Industrial Automation Practical Guide',
        author: 'ATech UTeM',
        year: '2026',
        category: 'Technical Guide',
        description: 'A compact guide for PLC, instrumentation, and hands-on automation training.'
    },
    {
        title: 'Renewable Energy Lab Notes',
        author: 'ATech UTeM',
        year: '2026',
        category: 'eBook',
        description: 'Selected lab activities and preparation notes for solar PV and energy programmes.'
    }
];
