import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Eye, Target } from "lucide-react";
import Confetti from "@/components/Confetti";

interface AnimalData {
  mammals: number;
  birds: number;
  reptiles: number;
  fish: number;
  insects: number;
}

const Learning = () => {
  const navigate = useNavigate();

  // Get data from localStorage (same as other pages)
  const getStoredData = (): AnimalData => {
    const stored = localStorage.getItem("animalData");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return {
          mammals: 0,
          birds: 0,
          reptiles: 0,
          fish: 0,
          insects: 0
        };
      }
    }
    // If no data exists, try the old gameState format
    const oldStored = localStorage.getItem("gameState");
    if (oldStored) {
      try {
        const gameState = JSON.parse(oldStored);
        if (gameState.collected) {
          return gameState.collected;
        }
      } catch {
        // Fall through to default
      }
    }
    return {
      mammals: 0,
      birds: 0,
      reptiles: 0,
      fish: 0,
      insects: 0
    };
  };

  const collectedData = getStoredData();
  const totalAnimals = Object.values(collectedData).reduce((sum: number, count: number) => sum + count, 0);
  
  // Consolidated animalConfig with all properties
  const animalConfig = {
    mammals: {
      emoji: '🐘',
      name: 'Mammals',
      color: '#ef4444'
    },
    birds: {
      emoji: '🦅',
      name: 'Birds',
      color: '#3b82f6'
    },
    reptiles: {
      emoji: '🐍',
      name: 'Reptiles',
      color: '#22c55e'
    },
    fish: {
      emoji: '🐟',
      name: 'Fish',
      color: '#06b6d4'
    },
    insects: {
      emoji: '🐛',
      name: 'Insects',
      color: '#eab308'
    }
  };

  // Single exercise state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVisualAnimation, setShowVisualAnimation] = useState(false);
  const [completedAnimals, setCompletedAnimals] = useState<string[]>([]);
  const [currentTargetAnimal, setCurrentTargetAnimal] = useState<string | null>(null);
  const [currentCalculation, setCurrentCalculation] = useState<string | null>(null);
  const [animatingNumbers, setAnimatingNumbers] = useState(false);
  
  // Get animal entries for the exercise
  const animalEntries = Object.entries(collectedData).filter(([, count]) => count > 0);
  const isAllCompleted = completedAnimals.length === animalEntries.length;

  // Auto-start visual animation and set first target
  useEffect(() => {
    setShowVisualAnimation(true);
    const timer = setTimeout(() => {
      setShowVisualAnimation(false);
      // Set first target animal (highest count)
      const firstTarget = animalEntries.reduce((max, current) => 
        current[1] > max[1] ? current : max, animalEntries[0]
      );
      setCurrentTargetAnimal(firstTarget[0]);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle animal click
  const handleAnimalClick = (animalType: string) => {
    if (completedAnimals.includes(animalType)) return;
    
    if (animalType === currentTargetAnimal) {
      // Correct animal clicked - show calculation for this animal
      setCompletedAnimals(prev => [...prev, animalType]);
      setCurrentCalculation(animalType);
      setAnimatingNumbers(true);
      setShowConfetti(true);
      
      // Clear animation after delay
      setTimeout(() => {
        setAnimatingNumbers(false);
        setShowConfetti(false);
      }, 2000);
    }
  };

  // Handle next button click
  const handleNext = () => {
    const remaining = animalEntries.filter(([type]) => 
      !completedAnimals.includes(type) && type !== currentCalculation
    );
    
    setCurrentCalculation(null); // Clear current calculation
    
    if (remaining.length > 0) {
      setCurrentTargetAnimal(remaining[0][0]);
    } else {
      // All completed
      navigate('/visualization');
    }
  };


  // Step 1: Visual Animation Component  
  const VisualIntroduction = () => {
    // Pick the first animal with the highest count as example
    const exampleAnimal = animalEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max, animalEntries[0]
    );
    const [exampleType, exampleCount] = exampleAnimal || ['mammals', 0];
    const exampleConfig = animalConfig[exampleType as keyof typeof animalConfig];
    const examplePercentage = totalAnimals > 0 ? Math.round(exampleCount / totalAnimals * 100) : 0;
    
    return (
      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center space-y-6">
          <div className="text-4xl mb-4">📊</div>
          
          <div className={`transition-all duration-1000 ${showVisualAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h3 className="text-2xl font-bold mb-6">Learn How to Calculate Percentages!</h3>
            
            {/* Show Pie Chart */}
            <div className="flex justify-center mb-6">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full" viewBox="0 0 200 200">
                  {(() => {
                    let startAngle = 0;
                    const radius = 80;
                    const centerX = 100;
                    const centerY = 100;
                    
                    return Object.entries(collectedData).map(([type, count]) => {
                      const animalPercentage = count / totalAnimals * 100;
                      const angle = animalPercentage / 100 * 360;
                      const endAngle = startAngle + angle;
                      
                      const startAngleRad = startAngle * Math.PI / 180;
                      const endAngleRad = endAngle * Math.PI / 180;
                      
                      const x1 = centerX + radius * Math.cos(startAngleRad);
                      const y1 = centerY + radius * Math.sin(startAngleRad);
                      const x2 = centerX + radius * Math.cos(endAngleRad);
                      const y2 = centerY + radius * Math.sin(endAngleRad);
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');
                      
                      const typeConfig = animalConfig[type as keyof typeof animalConfig];
                      const isExample = type === exampleType;
                      
                      const slice = (
                        <g key={type}>
                          <path 
                            d={pathData} 
                            fill={typeConfig.color} 
                            stroke="white" 
                            strokeWidth="3" 
                            className={`transition-all duration-1000 ${isExample ? 'opacity-100 drop-shadow-lg animate-pulse' : 'opacity-40'}`}
                            style={{
                              filter: isExample ? 'brightness(1.2)' : 'brightness(0.7)'
                            }}
                          />
                        </g>
                      );
                      
                      startAngle = endAngle;
                      return slice;
                    });
                  })()}
                </svg>
              </div>
            </div>
            
            {/* Example Animal Display */}
            <div className="bg-white p-4 rounded-lg border-2 border-primary/30 mb-6">
              <div className="text-3xl mb-2">{exampleConfig.emoji}</div>
              <div className="text-xl font-bold">{exampleConfig.name}</div>
              <div className="text-lg text-muted-foreground">{exampleCount} out of {totalAnimals} animals</div>
            </div>
            
            {/* Step-by-step Calculation Example */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 mb-6">
              <div className="text-lg font-bold mb-4">Example Calculation:</div>
              
              {/* Step 1: Division */}
              <div className="flex items-center justify-center gap-4 mb-4 text-xl">
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
                  <span className="text-2xl">{exampleConfig.emoji}</span>
                  <span className="font-bold">{exampleCount}</span>
                </div>
                <span>÷</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{totalAnimals}</div>
                <span>=</span>
                <div className="bg-blue-100 px-4 py-2 rounded-lg border font-bold text-blue-700">
                  {(exampleCount / totalAnimals).toFixed(2)}
                </div>
              </div>
              
              {/* Step 2: Multiply by 100 */}
              <div className="flex items-center justify-center gap-4 text-xl">
                <div className="bg-blue-100 px-4 py-2 rounded-lg border font-bold text-blue-700">
                  {(exampleCount / totalAnimals).toFixed(2)}
                </div>
                <span>×</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">100</div>
                <span>=</span>
                <Badge className={`text-xl px-6 py-3 animate-bounce`} style={{ backgroundColor: exampleConfig.color }}>
                  {examplePercentage}%
                </Badge>
              </div>
            </div>
            
            {/* Call to Action */}
            <div className="text-lg text-muted-foreground">
              Next, you'll practice by clicking on the pie chart slices! 🎯
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Main Learning Exercise Component
  const LearningExercise = () => {
    if (!currentTargetAnimal) return null;
    
    const targetConfig = animalConfig[currentTargetAnimal as keyof typeof animalConfig];
    const targetCount = collectedData[currentTargetAnimal as keyof AnimalData];
    const targetPercentage = totalAnimals > 0 ? Math.round(targetCount / totalAnimals * 100) : 0;
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-6 w-6 text-secondary" />
            <h3 className="text-xl font-bold">Click the Animal That Equals {targetPercentage}%</h3>
          </div>
          
          {/* Current Target Display */}
          <div className="bg-white p-4 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-3xl mb-2">{targetConfig.emoji}</div>
            <div className="text-lg font-bold">{targetConfig.name}</div>
            <div className="text-sm text-muted-foreground">Find this animal in the circle below</div>
          </div>
          
          {/* Pie Chart - All Animals */}
          <div className="flex justify-center mb-6">
            <div className="relative w-96 h-96">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {(() => {
                  let startAngle = 0;
                  const radius = 90;
                  const centerX = 100;
                  const centerY = 100;
                  
                  return Object.entries(collectedData)
                    .filter(([, count]) => count > 0)
                    .map(([type, count]) => {
                      const animalPercentage = count / totalAnimals * 100;
                      const angle = animalPercentage / 100 * 360;
                      const endAngle = startAngle + angle;
                      
                      const startAngleRad = startAngle * Math.PI / 180;
                      const endAngleRad = endAngle * Math.PI / 180;
                      
                      const x1 = centerX + radius * Math.cos(startAngleRad);
                      const y1 = centerY + radius * Math.sin(startAngleRad);
                      const x2 = centerX + radius * Math.cos(endAngleRad);
                      const y2 = centerY + radius * Math.sin(endAngleRad);
                      const largeArcFlag = angle > 180 ? 1 : 0;
                      const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');
                      
                      const typeConfig = animalConfig[type as keyof typeof animalConfig];
                      const isTarget = type === currentTargetAnimal;
                      const isCompleted = completedAnimals.includes(type);
                      
                      // Calculate label position for animal emoji
                      const labelAngle = (startAngle + endAngle) / 2;
                      const labelRadius = radius * 0.7;
                      const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
                      const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);
                      
                      const slice = (
                        <g key={type}>
                          <path 
                            d={pathData} 
                            fill={typeConfig.color} 
                            stroke="white" 
                            strokeWidth="3" 
                            className={`transition-all duration-500 cursor-pointer hover:brightness-110 ${
                              isCompleted
                                ? 'opacity-70' 
                                : isTarget
                                ? 'animate-pulse drop-shadow-lg'
                                : 'opacity-90 hover:opacity-100'
                            }`}
                            onClick={() => handleAnimalClick(type)}
                          />
                          {/* Animal emoji in slice */}
                          <text 
                            x={labelX} 
                            y={labelY} 
                            textAnchor="middle" 
                            dy="0.3em" 
                            className="text-2xl pointer-events-none"
                          >
                            {typeConfig.emoji}
                          </text>
                          {/* Animal count */}
                          <text 
                            x={labelX} 
                            y={labelY + 18} 
                            textAnchor="middle" 
                            dy="0.3em" 
                            className="text-sm font-bold fill-white pointer-events-none"
                            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                          >
                            {count}
                          </text>
                        </g>
                      );
                      
                      startAngle = endAngle;
                      return slice;
                    });
                })()}
              </svg>
            </div>
          </div>
          
          {/* Progress Display */}
          <div className="bg-white p-4 rounded-lg border-2 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Progress:</span>
              <Progress value={(completedAnimals.length / animalEntries.length) * 100} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {completedAnimals.length} / {animalEntries.length}
              </span>
            </div>
          </div>
          
          {/* Current Calculation Display */}
          {currentCalculation && (
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <div className="text-center space-y-4">
                <div className="text-lg font-bold text-green-700 mb-2">
                  🎉 Calculation Complete!
                </div>
                
                <div className="flex items-center justify-center gap-4 text-xl">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
                    <span className="text-2xl">{animalConfig[currentCalculation as keyof typeof animalConfig].emoji}</span>
                    <span className={`font-bold transition-all duration-500 ${animatingNumbers ? 'animate-pulse text-green-600' : ''}`}>
                      {collectedData[currentCalculation as keyof AnimalData]}
                    </span>
                  </div>
                  <span>÷ {totalAnimals} × 100 =</span>
                  <Badge className={`text-xl px-4 py-2 bg-green-600 text-white transition-all duration-500 ${animatingNumbers ? 'scale-110 animate-bounce' : ''}`}>
                    {Math.round(collectedData[currentCalculation as keyof AnimalData] / totalAnimals * 100)}%
                  </Badge>
                </div>
                
                <div className="text-sm text-green-600 mb-4">
                  {animalConfig[currentCalculation as keyof typeof animalConfig].name} represents {Math.round(collectedData[currentCalculation as keyof AnimalData] / totalAnimals * 100)}% of your animals!
                </div>
                
                {/* Next Button */}
                <div className="flex justify-center">
                  {completedAnimals.length < animalEntries.length ? (
                    <Button 
                      onClick={handleNext}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
                    >
                      Next Animal <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      Complete Learning <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };



  // Main render function
  const renderContent = () => {
    if (showVisualAnimation) {
      return <VisualIntroduction />;
    }
    
    if (isAllCompleted) {
      return (
        <Card className="p-8 text-center border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-4xl mb-4">🎊</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Congratulations! All Animals Completed!
          </h2>
          <p className="text-lg text-green-600 mb-6">
            You've successfully calculated the percentage for all {animalEntries.length} animal types!
          </p>
          <Button 
            onClick={() => navigate('/visualization')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            Continue to Visualization <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      );
    }
    
    return <LearningExercise />;
  };

  if (totalAnimals === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">🧮 Learn Percentages & Data Analysis</h2>
          <p className="text-muted-foreground mb-4">
            First, collect some animals to start learning! 
          </p>
          <Button onClick={() => navigate('/')}>
            Go Collect Animals
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
            🧮 Interactive Percentage Learning
          </h1>
        </Card>

        {/* Main Content */}
        <div className="mb-6">
          {renderContent()}
        </div>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default Learning;