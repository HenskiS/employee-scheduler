import { useMediaQuery } from '@mui/material';

const Sidebar = ({ tab, onTabChange }) => {
  const tabs = [
    { id: 0, label: 'DOCTORS' },
    { id: 1, label: 'TECHNICIANS' },
    { id: 2, label: 'USERS' }
  ];
  const isMobile = useMediaQuery('(max-width:800px)');
  
  const styles = {
    sidebar: {
      width: isMobile ? '30%' : '20%',
      borderRight: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden'
    },
    button: {
      padding: '12px 16px',
      textAlign: 'left',
      border: 'none',
      backgroundColor: 'transparent',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'all 0.2s',
    },
    activeButton: {
      backgroundColor: '#1976d2',
      color: 'white',
      fontWeight: 500,
    },
    inactiveButton: {
      backgroundColor: 'transparent',
      color: '#424242',
    },
    buttonHoverActive: {
      backgroundColor: '#1565c0',
    },
    buttonHoverInactive: {
      backgroundColor: '#f5f5f5',
    }
  };

  return (
    <div style={styles.sidebar}>
      {tabs.map(({ id, label }) => {
        const isActive = tab === id;
        const baseStyle = {
          ...styles.button,
          ...(isActive ? styles.activeButton : styles.inactiveButton)
        };

        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            style={baseStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = isActive 
                ? styles.buttonHoverActive.backgroundColor 
                : styles.buttonHoverInactive.backgroundColor;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = isActive 
                ? styles.activeButton.backgroundColor 
                : styles.inactiveButton.backgroundColor;
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};

export default Sidebar;