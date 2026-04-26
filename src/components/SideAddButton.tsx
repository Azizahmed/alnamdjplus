import React from 'react';

interface SideAddButtonProps {
  onAdd: () => void;
  disabled?: boolean;
  position?: 'left' | 'right';
}

export const SideAddButton: React.FC<SideAddButtonProps> = ({ 
  onAdd, 
  disabled = false,
  position = 'left'
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        position: 'absolute',
        [position]: '-40px',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 5
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={() => !disabled && onAdd()}
        disabled={disabled}
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: isHovered ? '#123A3F' : 'rgba(255, 255, 255, 0.8)',
          border: `1px solid ${isHovered ? '#123A3F' : '#D9E4E1'}`,
          color: isHovered ? '#ffffff' : '#6AA9AF',
          fontSize: '18px',
          fontWeight: '300',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isHovered ? '0 2px 8px rgba(18, 58, 63, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          opacity: disabled ? 0.4 : (isHovered ? 1 : 0.6)
        }}
        title="Add component"
      >
        +
      </button>
    </div>
  );
};
