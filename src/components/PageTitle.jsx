import React from 'react';

const PageTitle = ({ eyebrow = 'ATech UTeM', title, children, align = 'left' }) => (
    <header style={{ textAlign: align, marginBottom: '42px' }}>
        <p style={{
            margin: '0 0 12px',
            color: '#f47a20',
            fontSize: '14px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.08em'
        }}>
            {eyebrow}
        </p>
        <h1 style={{
            margin: '0 0 16px',
            color: '#0b2d5c',
            fontSize: 'clamp(42px, 6vw, 76px)',
            lineHeight: 0.98,
            fontWeight: 950,
            letterSpacing: 0
        }}>
            {title}
        </h1>
        {children && (
            <p style={{
                maxWidth: '720px',
                margin: align === 'center' ? '0 auto' : 0,
                color: '#4b5563',
                fontSize: '18px',
                lineHeight: 1.7
            }}>
                {children}
            </p>
        )}
    </header>
);

export default PageTitle;
