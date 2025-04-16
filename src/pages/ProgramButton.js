import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const ProgramButton = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/programmes');
  };

  return (
    <Button 
      variant="primary"
      onClick={handleClick}
      className="program-btn"
      style={{
        backgroundColor: '#0056b3',
        border: 'none',
        padding: '10px 20px',
        borderRadius: '5px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        transition: 'all 0.3s ease'
      }}
    >
      <i className="far fa-calendar-alt me-2"></i>
      Calendrier
    </Button>
  );
};

export default ProgramButton;
