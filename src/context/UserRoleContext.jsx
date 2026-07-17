import React, { createContext, useState, useContext } from 'react';

const UserRoleContext = createContext();

export const UserRoleProvider = ({ children }) => {
    const [role, setRole] = useState('attendee'); // 'attendee' or 'organizer'

    const toggleRole = () => {
        setRole(prev => prev === 'attendee' ? 'organizer' : 'attendee');
    };

    return (
        <UserRoleContext.Provider value={{ role, toggleRole, setRole }}>
            {children}
        </UserRoleContext.Provider>
    );
};

export const useUserRole = () => useContext(UserRoleContext);
