import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart } from 'lucide-react';

const Visualization = () => {
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
    }, // purple
    birds: {
      emoji: '🦅',
      color: '#06B6D4',
      name: 'Birds'
    }, // cyan
    fish: {
      emoji: '🐟',
      color: '#10B981',
      name: 'Fish'
    }, // emerald
    reptiles: {
      emoji: '🦎',
      color: '#F59E0B',
      name: 'Reptiles'
    }, // amber
    insects: {
      emoji: '🦋',
      color: '#EF4444',
      name: 'Insects'
    } // red
  };

  const dataEntries = Object.entries(collectedData);
  const maxValue = Math.max(...dataEntries.map(([, value]) => value));

  return (
    <div className="h-dvh bg-background p-2 md:p-3 overflow-hidden max-h-screen">
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2 mb-2 flex-shrink-0">
          <h1 className="text-base md:text-lg lg:text-xl font-space-grotesk font-bold text-center lg:text-left">📊 Understanding Your Collection</h1>
          <Button 
            onClick={() => navigate('/learning', {
              state: {
                collected: collectedData,
                totalCollected: totalAnimals
              }
            })} 
            className="game-button text-xs md:text-sm px-3 md:px-4 py-2" 
            size="sm"
          >
            Next: Learn Math 🧮
          </Button>
        </div>

        {/* Summary */}
        <Card className="game-card mb-2 flex-shrink-0">
          <div className="text-center p-2 md:p-3">
            <h2 className="text-lg md:text-xl font-space-grotesk font-bold mb-1">
              🎉 Mission Complete!
            </h2>
            <p className="text-xs md:text-sm font-dm-sans mb-2">
              You collected <span className="font-bold text-primary">{totalAnimals}</span> animals total!
            </p>
            <div className="grid grid-cols-5 gap-1">
              {Object.entries(animalConfig).map(([type, config]) => 
                <div key={type} className="text-center">
                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm mx-auto mb-1 border-2 border-brand-black" style={{
                    backgroundColor: config.color
                  }}>
                    {config.emoji}
                  </div>
                  <p className="font-dm-sans font-bold text-xs md:text-sm">{collectedData[type as keyof typeof collectedData]}</p>
                  <p className="font-dm-sans text-xs text-muted-foreground">{config.name}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid gap-2 xl:grid-cols-2 flex-1 min-h-0 overflow-hidden">
          {/* Bar Chart */}
          <Card className="game-card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-1 p-2 flex-shrink-0">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h3 className="text-sm md:text-base font-space-grotesk font-bold">Bar Chart View</h3>
            </div>
            <div className="space-y-1 p-2 pt-0 overflow-y-auto flex-1">
              {dataEntries.map(([type, count]) => {
                const config = animalConfig[type as keyof typeof animalConfig];
                const percentage = count / maxValue * 100;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm md:text-base">{config.emoji}</span>
                        <span className="font-dm-sans font-semibold text-xs md:text-sm">{config.name}</span>
                      </div>
                      <span className="font-dm-sans font-bold text-sm md:text-base">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 md:h-3 border border-brand-black">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1" 
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color
                        }}
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
          <Card className="game-card overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 mb-1 p-2 flex-shrink-0">
              <PieChart className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              <h3 className="text-sm md:text-base font-space-grotesk font-bold">Pie Chart View</h3>
            </div>
            
            {/* Pie Chart - Real SVG Implementation */}
            <div className="p-2 pt-0 overflow-y-auto flex-1 flex flex-col">
              <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto flex-shrink-0">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {(() => {
                    let startAngle = 0;
                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;
                    
                    return dataEntries.map(([type, count], index) => {
                      const percentage = count / totalAnimals * 100;
                      const angle = percentage / 100 * 360;
                      const endAngle = startAngle + angle;

                      // Convert angles to radians
                      const startAngleRad = startAngle * Math.PI / 180;
                      const endAngleRad = endAngle * Math.PI / 180;

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
                      const labelAngleRad = labelAngle * Math.PI / 180;
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
                            <>
                              <text 
                                x={labelX} 
                                y={labelY - 8} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-lg pointer-events-none"
                              >
                                {config.emoji}
                              </text>
                              <text 
                                x={labelX} 
                                y={labelY + 8} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-xs font-bold fill-white pointer-events-none" 
                                style={{
                                  textShadow: '1px 1px 1px rgba(0,0,0,0.5)'
                                }}
                              >
                                {count}
                              </text>
                            </>
                          )}
                        </g>
                      );
                      
                      startAngle = endAngle;
                      return slice;
                    });
                  })()}
                </svg>
              </div>
              
              <div className="text-center mt-2 flex-1">
                <p className="text-xs md:text-sm font-dm-sans text-muted-foreground mb-2">
                  Proportion of animals collected
                </p>
                <div className="grid grid-cols-1 gap-1 text-xs">
                  {dataEntries.map(([type, count]) => {
                    const config = animalConfig[type as keyof typeof animalConfig];
                    const percentage = Math.round(count / totalAnimals * 100);
                    return (
                      <div key={type} className="flex items-center justify-between px-2 py-1 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full border border-brand-black" 
                            style={{
                              backgroundColor: config.color
                            }}
                          ></div>
                          <span className="font-dm-sans text-xs">{config.emoji} {config.name}</span>
                        </div>
                        <span className="font-dm-sans font-bold text-xs">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Visualization;