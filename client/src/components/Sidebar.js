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
      background: 'none',
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
      color: '#424242',
    }
  };

  return (
    <div style={styles.sidebar}>
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => onTabChange(id)}
          style={{
            ...styles.button,
            ...(tab === id ? styles.activeButton : styles.inactiveButton),
            '&:hover': {
              backgroundColor: tab === id ? '#1565c0' : '#f5f5f5'
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default Sidebar;