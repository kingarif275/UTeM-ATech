const avatarPalette = [
    '#2563eb',
    '#0f766e',
    '#7c3aed',
    '#be123c',
    '#b45309',
    '#047857',
    '#4338ca',
    '#0369a1'
];

export const getInitials = (value = 'UTeM ATech User') => {
    const cleaned = String(value).replace(/@.*/, '').replace(/[._-]+/g, ' ').trim();
    return cleaned
        .split(/\s+/)
        .map(part => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'UA';
};

export const getAvatarColor = (value = '') => {
    const source = String(value || 'UTeM ATech User');
    const hash = Array.from(source).reduce((total, char) => total + char.charCodeAt(0), 0);
    return avatarPalette[hash % avatarPalette.length];
};
