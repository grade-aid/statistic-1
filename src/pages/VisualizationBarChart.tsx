import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, ArrowLeft } from 'lucide-react';

const VisualizationBarChart = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get game state from navigation or localStorage
  const gameState = location.state as { collected: Record<string, number> } | null;
  let collectedData = gameState?.collected;
  
  if (!collectedData) {
    const savedData = localStorage.getItem('animalCollectionData');
    collectedData = savedData ? JSON.parse(savedData) : {
      mammals: 0,
      birds: 0,
      fish: 0,
      reptiles: 0,
      insects: 0
    };
  }

  // Calculate total
  const totalAnimals = Object.values(collectedData).reduce((sum, count) => sum + count, 0);

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

  const dataEntries = Object.entries(collectedData);
  const maxValue = Math.max(...dataEntries.map(([, value]) => value));

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => navigate('/visualization/summary', { state: { collected: collectedData } })} 
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-space-grotesk font-bold">
              📊 Bar Chart View
            </h1>
          </div>
          <Button 
            onClick={() => navigate('/visualization/pie-chart', { state: { collected: collectedData } })} 
            variant="outline"
            size="sm"
          >
            <PieChart className="h-4 w-4 mr-2" />
            Pie Chart
          </Button>
        </div>

        {/* Bar Chart */}
        <Card className="game-card">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h3 className="text-xl md:text-2xl font-space-grotesk font-bold">Animal Collection Data</h3>
            </div>
            <div className="space-y-6">
              {dataEntries.map(([type, count]) => {
                const config = animalConfig[type as keyof typeof animalConfig];
                const percentage = count / maxValue * 100;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl md:text-3xl">{config.emoji}</span>
                        <span className="font-dm-sans font-semibold text-lg md:text-xl">{config.name}</span>
                      </div>
                      <span className="font-dm-sans font-bold text-xl md:text-2xl">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-6 md:h-8 border-2 border-brand-black">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3" 
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color
                        }}
                      >
                        {percentage > 15 && (
                          <span className="text-sm md:text-base font-bold text-white">{count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-8 text-center">
              <p className="text-lg font-dm-sans text-muted-foreground">
                Total Animals Collected: <span className="font-bold text-primary text-xl">{totalAnimals}</span>
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VisualizationBarChart;