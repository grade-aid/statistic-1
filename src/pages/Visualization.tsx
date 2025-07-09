import { useState, useEffect } from "react";
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

  // Save data to localStorage so other pages can access it
  useEffect(() => {
    localStorage.setItem('animalData', JSON.stringify(collectedData));
  }, [collectedData]);

  const animalConfig = {
    mammals: { emoji: '🐘', color: '#ef4444', name: 'Mammals' }, // red
    birds: { emoji: '🦅', color: '#3b82f6', name: 'Birds' }, // blue  
    reptiles: { emoji: '🐍', color: '#22c55e', name: 'Reptiles' }, // green
    fish: { emoji: '🐟', color: '#06b6d4', name: 'Fish' }, // cyan
    insects: { emoji: '🐛', color: '#eab308', name: 'Insects' } // yellow
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
            onClick={() => navigate('/learning', { 
              state: { 
                collected: collectedData, 
                totalCollected: totalAnimals
              }
            })}
            className="game-button"
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
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-2 border-4 border-brand-black" style={{backgroundColor: config.color}}>
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
                        className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                        style={{ width: `${percentage}%`, backgroundColor: config.color }}
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
            
            {/* Pie Chart - Real SVG Implementation */}
            <div className="space-y-4">
              <div className="relative w-64 h-64 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {(() => {
                    let startAngle = 0;
                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;
                    
                    return dataEntries.map(([type, count], index) => {
                      const percentage = (count / totalAnimals) * 100;
                      const angle = (percentage / 100) * 360;
                      const endAngle = startAngle + angle;
                      
                      // Convert angles to radians
                      const startAngleRad = (startAngle * Math.PI) / 180;
                      const endAngleRad = (endAngle * Math.PI) / 180;
                      
                      // Calculate path coordinates
                      const x1 = centerX + radius * Math.cos(startAngleRad);
                      const y1 = centerY + radius * Math.sin(startAngleRad);
                      const x2 = centerX + radius * Math.cos(endAngleRad);
                      const y2 = centerY + radius * Math.sin(endAngleRad);
                      
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      
                      const pathData = [
                        `M ${centerX} ${centerY}`,
                        `L ${x1} ${y1}`,
                        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                        'Z'
                      ].join(' ');
                      
                      // Label position (middle of slice)
                      const labelAngle = (startAngle + endAngle) / 2;
                      const labelAngleRad = (labelAngle * Math.PI) / 180;
                      const labelRadius = radius * 0.7;
                      const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
                      const labelY = centerY + labelRadius * Math.sin(labelAngleRad);
                      
                      const config = animalConfig[type as keyof typeof animalConfig];
                      const slice = (
                        <g key={type}>
                          <path
                            d={pathData}
                            fill={config.color}
                            stroke="white"
                            strokeWidth="2"
                            className="transition-all duration-300 hover:opacity-80"
                          />
                          {percentage > 5 && (
                             <text
                               x={labelX}
                               y={labelY}
                               textAnchor="middle"
                               dy="0.3em"
                               className="text-xs font-bold fill-white"
                               style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
                             >
                               {count}
                             </text>
                          )}
                        </g>
                      );
                      
                      startAngle = endAngle;
                      return slice;
                    });
                  })()}
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
                          <div className="w-4 h-4 rounded-full border border-brand-black" style={{backgroundColor: config.color}}></div>
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
              <Button 
                onClick={() => navigate('/learning', { 
                  state: { 
                    collected: collectedData, 
                    totalCollected: totalAnimals
                  }
                })} 
                className="game-button"
              >
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