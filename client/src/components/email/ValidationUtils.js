/**
 * Validates email addresses for technicians
 * @param {Array} techs - Array of technician objects
 * @returns {Array} Array of error messages
 */
export const validateEmails = (techs) => {
    const errors = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    techs.forEach(tech => {
      if (!tech.email || !emailRegex.test(tech.email)) {
        errors.push(`${tech.name || 'Technician ' + tech.id}: Invalid or missing email (${tech.email || 'none'})`);
      }
    });
    
    return errors;
  };