import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const Visualization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get game state from navigation
  const gameState = location.state as { collected: Record<string, number> } | null;
  const collectedData = gameState?.collected;

  // Redirect to summary page automatically
  useEffect(() => {
    navigate('/visualization/summary', { 
      state: { collected: collectedData },
      replace: true 
    });
  }, [navigate, collectedData]);

  return null;
};

export default Visualization;