import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, PieChart, ArrowLeft } from 'lucide-react';

const VisualizationPieChart = () => {
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
              📊 Pie Chart View
            </h1>
          </div>
          <Button 
            onClick={() => navigate('/visualization/bar-chart', { state: { collected: collectedData } })} 
            variant="outline"
            size="sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Bar Chart
          </Button>
        </div>

        {/* Pie Chart */}
        <Card className="game-card">
          <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <h3 className="text-xl md:text-2xl font-space-grotesk font-bold">Distribution Overview</h3>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center gap-8">
              {/* Pie Chart SVG */}
              <div className="relative w-80 h-80 flex-shrink-0">
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
                            strokeWidth="3" 
                            className="transition-all duration-300 hover:opacity-80" 
                          />
                          {percentage > 8 && (
                            <>
                              <text 
                                x={labelX} 
                                y={labelY - 10} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-2xl pointer-events-none"
                              >
                                {config.emoji}
                              </text>
                              <text 
                                x={labelX} 
                                y={labelY + 12} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-sm font-bold fill-white pointer-events-none" 
                                style={{
                                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
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

              {/* Legend */}
              <div className="flex-1">
                <h4 className="text-lg font-dm-sans font-semibold mb-4">Animal Distribution</h4>
                <div className="grid gap-3">
                  {dataEntries.map(([type, count]) => {
                    const config = animalConfig[type as keyof typeof animalConfig];
                    const percentage = Math.round(count / totalAnimals * 100);
                    return (
                      <div key={type} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-brand-black" 
                            style={{
                              backgroundColor: config.color
                            }}
                          ></div>
                          <span className="text-xl mr-2">{config.emoji}</span>
                          <span className="font-dm-sans font-medium">{config.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-dm-sans font-bold text-lg">{count}</div>
                          <div className="font-dm-sans text-sm text-muted-foreground">{percentage}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 p-4 bg-primary/10 rounded-lg text-center">
                  <p className="text-lg font-dm-sans">
                    Total: <span className="font-bold text-primary text-xl">{totalAnimals}</span> animals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VisualizationPieChart;