/**
 * Generates a Google Calendar event template URL
 * @param {Object} eventDetails 
 * @param {string} eventDetails.title - Event title
 * @param {string} eventDetails.description - Event description
 * @param {string} eventDetails.location - Event location
 * @param {string} eventDetails.date - YYYY-MM-DD format
 * @param {string} eventDetails.startTime - HH:MM format
 * @param {string} eventDetails.endTime - HH:MM format
 * @returns {string} Google Calendar Add Event URL
 */
export const generateGoogleCalendarUrl = ({ title, description, location, date, startTime, endTime }) => {
    // Format date and time for Google Calendar (YYYYMMDDTHHMMSSZ)
    // Assuming the browser's local timezone for now, or we can just pass the raw datetime string to google
    
    // Convert YYYY-MM-DD and HH:MM into a Javascript Date object to get UTC strings
    const startObj = new Date(`${date}T${startTime}:00`);
    const endObj = endTime ? new Date(`${date}T${endTime}:00`) : new Date(startObj.getTime() + 60 * 60 * 1000); // default 1 hour later
    
    // Format to YYYYMMDDTHHMMSSZ
    const formatGoogleDate = (dateObj) => {
        return dateObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    };

    const startStr = formatGoogleDate(startObj);
    const endStr = formatGoogleDate(endObj);

    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', title || 'Seminar Event');
    url.searchParams.append('dates', `${startStr}/${endStr}`);
    
    if (description) {
        url.searchParams.append('details', description);
    }
    
    if (location) {
        url.searchParams.append('location', location);
    }

    return url.toString();
};
