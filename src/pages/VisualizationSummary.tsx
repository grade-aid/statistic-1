import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart } from 'lucide-react';

const VisualizationSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get game state from navigation
  const gameState = location.state as { collected: Record<string, number> } | null;
  const collectedData = gameState?.collected || {
    mammals: 0,
    birds: 0,
    fish: 0,
    reptiles: 0,
    insects: 0
  };

  // Calculate total
  const totalAnimals = Object.values(collectedData).reduce((sum, count) => sum + count, 0);

  // Save to localStorage for persistence
  useEffect(() => {
    if (gameState?.collected) {
      localStorage.setItem('animalCollectionData', JSON.stringify(collectedData));
    }
  }, [collectedData]);

  // Animal configuration with colors and emojis
  const animalConfig = {
    mammals: {
      emoji: '🐺',
      color: '#8B5CF6',
      name: 'Mammals'
    },
    birds: {
      emoji: '🦅',
      color: '#06B6D4',
      name: 'Birds'
    },
    fish: {
      emoji: '🐟',
      color: '#10B981',
      name: 'Fish'
    },
    reptiles: {
      emoji: '🦎',
      color: '#F59E0B',
      name: 'Reptiles'
    },
    insects: {
      emoji: '🦋',
      color: '#EF4444',
      name: 'Insects'
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-space-grotesk font-bold text-center lg:text-left">
            📊 Mission Summary
          </h1>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/visualization/bar-chart', { state: { collected: collectedData } })} 
              variant="outline"
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Bar Chart
            </Button>
            <Button 
              onClick={() => navigate('/visualization/pie-chart', { state: { collected: collectedData } })} 
              variant="outline"
              size="sm"
            >
              <PieChart className="h-4 w-4 mr-2" />
              Pie Chart
            </Button>
          </div>
        </div>

        {/* Summary */}
        <Card className="game-card mb-6">
          <div className="text-center p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-space-grotesk font-bold mb-4">
              🎉 Mission Complete!
            </h2>
            <p className="text-lg md:text-xl font-dm-sans mb-6">
              You collected <span className="font-bold text-primary text-2xl">{totalAnimals}</span> animals total!
            </p>
            <div className="grid grid-cols-5 gap-4 max-w-2xl mx-auto">
              {Object.entries(animalConfig).map(([type, config]) => 
                <div key={type} className="text-center">
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center text-2xl md:text-3xl mx-auto mb-2 border-4 border-brand-black" style={{
                    backgroundColor: config.color
                  }}>
                    {config.emoji}
                  </div>
                  <p className="font-dm-sans font-bold text-xl md:text-2xl mb-1">{collectedData[type as keyof typeof collectedData]}</p>
                  <p className="font-dm-sans text-sm md:text-base text-muted-foreground">{config.name}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center">
          <Button 
            onClick={() => navigate('/learning', {
              state: {
                collected: collectedData,
                totalCollected: totalAnimals
              }
            })} 
            className="game-button" 
            size="lg"
          >
            Continue to Learning 🧮
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VisualizationSummary;