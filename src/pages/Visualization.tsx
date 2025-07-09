import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, PieChart, BarChart3 } from "lucide-react";

const Visualization = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from navigation state or use fallback data
  const gameState = location.state as {
    collected?: {
      mammals: number;
      birds: number;
      reptiles: number;
      fish: number;
      insects: number;
    };
    totalCollected?: number;
    animalConfig?: any;
  } | null;

  const collectedData = gameState?.collected || {
    mammals: 12,
    birds: 8,
    reptiles: 6,
    fish: 10,
    insects: 4
  };

  const totalAnimals = gameState?.totalCollected || Object.values(collectedData).reduce((sum, count) => sum + count, 0);

  const animalConfig = {
    mammals: { emoji: '🐘', color: 'mammals-red', name: 'Mammals' },
    birds: { emoji: '🦅', color: 'mammals-red', name: 'Birds' },
    reptiles: { emoji: '🐍', color: 'mammals-red', name: 'Reptiles' },
    fish: { emoji: '🐟', color: 'mammals-red', name: 'Fish' },
    insects: { emoji: '🐛', color: 'mammals-red', name: 'Insects' }
  };

  const dataEntries = Object.entries(collectedData);
  const maxValue = Math.max(...dataEntries.map(([, value]) => value));

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back Home
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
              You collected <span className="font-bold text-primary">{totalAnimals}</span> animals total!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(animalConfig).map(([type, config]) => (
                <div key={type} className="text-center">
                  <div className={`w-16 h-16 rounded-full bg-${config.color} flex items-center justify-center text-3xl mx-auto mb-2 border-4 border-brand-black`}>
                    {config.emoji}
                  </div>
                  <p className="font-dm-sans font-bold text-2xl">{collectedData[type as keyof typeof collectedData]}</p>
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
            
            {/* Pie Chart - SVG Implementation */}
            <div className="space-y-4">
              <div className="relative w-64 h-64 mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    let cumulativePercentage = 0;
                    const colors = {
                      mammals: '#ef4444', // red
                      birds: '#ef4444',
                      reptiles: '#ef4444',
                      fish: '#ef4444',
                      insects: '#ef4444'
                    };
                    
                    return dataEntries.map(([type, count], index) => {
                      const percentage = (count / totalAnimals) * 100;
                      const strokeDasharray = `${percentage} ${100 - percentage}`;
                      const strokeDashoffset = -cumulativePercentage;
                      cumulativePercentage += percentage;
                      
                      return (
                        <circle
                          key={type}
                          cx="50"
                          cy="50"
                          r="15.9155"
                          fill="transparent"
                          stroke={colors[type as keyof typeof colors]}
                          strokeWidth="32"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-1000"
                        />
                      );
                    });
                  })()}
                  
                  {/* Center circle with total */}
                  <circle cx="50" cy="50" r="15" fill="white" stroke="#000" strokeWidth="2"/>
                  <text x="50" y="50" textAnchor="middle" dy="0.3em" className="text-xs font-bold fill-black">
                    {totalAnimals}
                  </text>
                </svg>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-dm-sans text-muted-foreground mb-4">
                  Each slice represents the proportion of animals you collected
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {dataEntries.map(([type, count]) => {
                    const config = animalConfig[type as keyof typeof animalConfig];
                    const percentage = Math.round((count / totalAnimals) * 100);
                    
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
              <Button onClick={() => navigate('/')} className="game-button-secondary">
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