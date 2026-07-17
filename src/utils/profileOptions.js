export const STUDENT_ROLE = 'Student';
export const LECTURER_ROLE = 'Lecturer';
export const CERTIFIED_ONLY_ROLES = ['Expert Trainer', 'Certified Trainer', LECTURER_ROLE];

export const roleOptions = [
    'Learner',
    STUDENT_ROLE,
    LECTURER_ROLE,
    'Trainer',
    'Expert Trainer',
    'Certified Trainer',
    'Organizer',
    'Researcher',
    'Industry Partner'
];

export const facultyOptions = [
    'Faculty of Electronics and Computer Technology and Engineering',
    'Faculty of Electrical Technology and Engineering',
    'Faculty of Mechanical Technology and Engineering',
    'Faculty of Industrial and Manufacturing Technology and Engineering',
    'Faculty of Information And Communications Technology',
    'Faculty of Technology Management And Technopreneurship',
    'Faculty of Artificial Intelligence and Cyber Security',
    'School of Graduate Studies',
    'School of International Studies and Global Languages',
    'Institute of Technology Management And Entrepreneurship'
];

export const FTKE_FACULTY = 'Faculty of Electrical Technology and Engineering';

export const facultyCodes = {
    'Faculty of Electronics and Computer Technology and Engineering': 'FTKEK',
    'Faculty of Electrical Technology and Engineering': 'FTKE',
    'Faculty of Mechanical Technology and Engineering': 'FTKM',
    'Faculty of Industrial and Manufacturing Technology and Engineering': 'FTKIP',
    'Faculty of Information And Communications Technology': 'FTMK',
    'Faculty of Technology Management And Technopreneurship': 'FPTT',
    'Faculty of Artificial Intelligence and Cyber Security': 'FAIX',
    'School of Graduate Studies': 'PPS',
    'School of International Studies and Global Languages': 'PBAG',
    'Institute of Technology Management And Entrepreneurship': 'IPTK'
};

export const getFacultyCode = (faculty) => facultyCodes[faculty] || faculty;

export const normalizeProfileRoles = (roles = [], isCertified = false) => {
    const roleSet = new Set(Array.isArray(roles) ? roles : []);

    if (!isCertified) {
        CERTIFIED_ONLY_ROLES.forEach(role => roleSet.delete(role));
    }

    if (roleSet.has(STUDENT_ROLE) && roleSet.has(LECTURER_ROLE)) {
        roleSet.delete(LECTURER_ROLE);
    }

    const normalized = Array.from(roleSet).filter(role => roleOptions.includes(role));
    return normalized.length ? normalized : ['Learner'];
};

export const shouldShowFaculty = (roles = []) => {
    const roleSet = new Set(Array.isArray(roles) ? roles : []);
    return roleSet.has(STUDENT_ROLE) || roleSet.has(LECTURER_ROLE);
};
