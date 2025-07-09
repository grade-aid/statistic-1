import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, PieChart, BarChart3 } from "lucide-react";

const Visualization = () => {
  const navigate = useNavigate();
  
  // Sample data - in a real app this would come from the game state
  const [animalData] = useState({
    mammals: 12,
    birds: 8,
    reptiles: 6,
    fish: 10,
    insects: 4,
    total: 40
  });

  const animalConfig = {
    mammals: { emoji: '🐘', color: 'mammals-red', name: 'Mammals' },
    birds: { emoji: '🦅', color: 'birds-blue', name: 'Birds' },
    reptiles: { emoji: '🐍', color: 'reptiles-green', name: 'Reptiles' },
    fish: { emoji: '🐟', color: 'fish-cyan', name: 'Fish' },
    insects: { emoji: '🐛', color: 'insects-yellow', name: 'Insects' }
  };

  const dataEntries = Object.entries(animalData).filter(([key]) => key !== 'total');
  const maxValue = Math.max(...dataEntries.map(([, value]) => value));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/game')}
            variant="outline"
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Game
          </Button>
          <h1 className="text-3xl font-space-grotesk font-bold">📊 Understanding Your Collection</h1>
          <Button 
            onClick={() => navigate('/learning')}
            className="game-button"
            disabled
          >
            Next: Learn Math 🧮
          </Button>
        </div>

        {/* Summary */}
        <Card className="game-card mb-8">
          <div className="text-center">
            <h2 className="text-4xl font-space-grotesk font-bold mb-4">
              🎉 Mission Complete!
            </h2>
            <p className="text-xl font-dm-sans mb-6">
              You collected <span className="font-bold text-primary">{animalData.total}</span> animals total!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(animalConfig).map(([type, config]) => (
                <div key={type} className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-${config.color} flex items-center justify-center text-3xl mx-auto mb-2 border-4 border-brand-black`}>
                    {config.emoji}
                  </div>
                  <p className="font-dm-sans font-bold text-2xl">{animalData[type as keyof typeof animalData]}</p>
                  <p className="font-dm-sans text-sm text-muted-foreground">{config.name}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Bar Chart */}
          <Card className="game-card">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-space-grotesk font-bold">Bar Chart View</h3>
            </div>
            <div className="space-y-4">
              {dataEntries.map(([type, count]) => {
                const config = animalConfig[type as keyof typeof animalConfig];
                const percentage = (count / maxValue) * 100;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.emoji}</span>
                        <span className="font-dm-sans font-semibold">{config.name}</span>
                      </div>
                      <span className="font-dm-sans font-bold text-lg">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-6 border-2 border-brand-black">
                      <div 
                        className={`h-full bg-${config.color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pie Chart Representation */}
          <Card className="game-card">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="h-8 w-8 text-primary" />
              <h3 className="text-2xl font-space-grotesk font-bold">Pie Chart View</h3>
            </div>
            
            {/* Simple visual pie representation */}
            <div className="space-y-4">
              <div className="relative w-64 h-64 mx-auto">
                {/* Pie segments - simplified visual representation */}
                <div className="w-full h-full rounded-full border-8 border-brand-black relative overflow-hidden bg-mammals-red">
                  {/* This is a simplified version - a real pie chart would use SVG or Canvas */}
                  <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-6xl">
                    🐘
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-dm-sans text-muted-foreground mb-4">
                  Each slice represents the proportion of animals you collected
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {dataEntries.map(([type, count]) => {
                    const config = animalConfig[type as keyof typeof animalConfig];
                    const percentage = Math.round((count / animalData.total) * 100);
                    
                    return (
                      <div key={type} className="flex items-center justify-between px-4 py-2 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full bg-${config.color} border border-brand-black`}></div>
                          <span className="font-dm-sans">{config.emoji} {config.name}</span>
                        </div>
                        <span className="font-dm-sans font-bold">{count} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Next Steps */}
        <Card className="game-card mt-8">
          <div className="text-center">
            <h3 className="text-2xl font-space-grotesk font-bold mb-4">Ready to Learn More?</h3>
            <p className="text-lg font-dm-sans text-muted-foreground mb-6">
              Now that you've seen your data, let's learn how to work with percentages and fractions!
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              <Button onClick={() => navigate('/game')} className="game-button-secondary">
                🎮 Play Again
              </Button>
              <Button className="game-button" disabled>
                🧮 Learn Percentages
              </Button>
              <Button onClick={() => navigate('/')} className="game-button-secondary">
                🏠 Back Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Visualization;