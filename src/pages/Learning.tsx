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

  // New 4-step learning state
  const [currentStep, setCurrentStep] = useState(1);
  const [currentAnimalIndex, setCurrentAnimalIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVisualAnimation, setShowVisualAnimation] = useState(false);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [showCalculation, setShowCalculation] = useState(false);
  const [animatingNumbers, setAnimatingNumbers] = useState(false);
  
  // Get animal entries for sequential display
  const animalEntries = Object.entries(collectedData).filter(([, count]) => count > 0);
  const totalSteps = 3;
  const currentAnimal = animalEntries[currentAnimalIndex];
  const isLastAnimal = currentAnimalIndex >= animalEntries.length - 1;

  // Auto-start visual animation in step 1
  useEffect(() => {
    if (currentStep === 1) {
      setShowVisualAnimation(true);
      const timer = setTimeout(() => {
        setShowVisualAnimation(false);
        setCurrentStep(2);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Manual progression - no auto-advance
  const handleNext = () => {
    if (currentStep === 3) {
      if (isLastAnimal) {
        // All animals completed
        setShowConfetti(true);
        setTimeout(() => {
          navigate('/visualization');
        }, 2000);
      } else {
        setCurrentAnimalIndex(prev => prev + 1);
        setShowCalculation(false);
        setCurrentStep(2); // Back to pie chart for next animal
      }
    }
  };

  // Handle pie slice click in step 2
  const handlePieSliceClick = (animalType: string) => {
    if (!currentAnimal) return;
    
    const [currentType] = currentAnimal;
    
    if (animalType === currentType) {
      // Correct slice clicked
      setSelectedAnimals(prev => [...prev, animalType]);
      setShowCalculation(true);
      setAnimatingNumbers(true);
      setShowConfetti(true);
      setCurrentStep(3); // Move to calculation display
      
      // Clear confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
        setAnimatingNumbers(false);
      }, 2000);
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

  // Step 2: Interactive Pie Chart Component
  const InteractivePieChart = () => {
    if (!currentAnimal) return null;
    
    const [animalType, animalCount] = currentAnimal;
    const config = animalConfig[animalType as keyof typeof animalConfig];
    const targetPercentage = totalAnimals > 0 ? Math.round(animalCount / totalAnimals * 100) : 0;
    const isCorrectClicked = selectedAnimals.includes(animalType);
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-6 w-6 text-secondary" />
            <h3 className="text-xl font-bold">Find the Animal That Equals {targetPercentage}%</h3>
          </div>
          
          {/* Equation Template */}
          <div className="bg-white p-6 rounded-lg border-2 border-accent/30 mb-6">
            <div className="flex items-center justify-center gap-4 text-xl">
              <div className={`px-4 py-2 rounded-lg border-2 border-dashed transition-all duration-500 ${
                isCorrectClicked 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 bg-gray-50'
              }`}>
                {isCorrectClicked ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="font-bold text-green-600">{animalCount}</span>
                  </div>
                ) : (
                  <span className="text-gray-500">?</span>
                )}
              </div>
              <span>÷</span>
              <div className="bg-blue-100 px-4 py-2 rounded-lg border font-bold">{totalAnimals}</div>
              <span>× 100 =</span>
              <Badge className="text-xl px-4 py-2 bg-accent text-white">
                {targetPercentage}%
              </Badge>
            </div>
          </div>
          
          {/* Pie Chart - Show All Animals */}
          <div className="flex justify-center mb-6">
            <div className="relative w-72 h-72">
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
                      const isTargetAnimal = type === animalType;
                      const isClicked = selectedAnimals.includes(type);
                      
                      // Calculate label position
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
                              isClicked && isTargetAnimal
                                ? 'animate-pulse drop-shadow-lg' 
                                : isClicked
                                ? 'opacity-50'
                                : 'opacity-100 hover:opacity-90'
                            }`}
                            style={{
                              filter: isClicked && isTargetAnimal ? 'brightness(1.2)' : 'brightness(1.0)'
                            }}
                            onClick={() => handlePieSliceClick(type)}
                          />
                          {/* Animal count labels */}
                          {animalPercentage > 5 && (
                            <text 
                              x={labelX} 
                              y={labelY} 
                              textAnchor="middle" 
                              dy="0.3em" 
                              className="text-sm font-bold fill-white pointer-events-none"
                              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
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
          </div>
          
          {/* Animal Legend */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(collectedData)
              .filter(([, count]) => count > 0)
              .map(([type, count]) => {
                const typeConfig = animalConfig[type as keyof typeof animalConfig];
                const isTarget = type === animalType;
                const isClicked = selectedAnimals.includes(type);
                const percentage = Math.round(count / totalAnimals * 100);
                
                return (
                  <div 
                    key={type}
                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                      isClicked && isTarget
                        ? 'border-green-500 bg-green-50'
                        : isTarget
                        ? 'border-accent bg-accent/10 animate-pulse'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{typeConfig.emoji}</div>
                    <div className="text-sm font-bold">{typeConfig.name}</div>
                    <div className="text-xs text-muted-foreground">{count} animals</div>
                    <div className="text-xs font-bold" style={{ color: typeConfig.color }}>
                      {percentage}%
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* Progress and Instructions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Animal {currentAnimalIndex + 1} of {animalEntries.length}</span>
              <Progress value={((currentAnimalIndex + 1) / animalEntries.length) * 100} className="flex-1" />
            </div>
            
            {!isCorrectClicked && (
              <div className="text-sm text-muted-foreground">
                Click on the pie slice that represents {targetPercentage}% of your animals
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };


  // Step 3: Auto-Calculation Display Component  
  const AutoCalculationDisplay = () => {
    if (!currentAnimal || !showCalculation) return null;
    
    const [animalType, animalCount] = currentAnimal;
    const config = animalConfig[animalType as keyof typeof animalConfig];
    const percentage = totalAnimals > 0 ? Math.round(animalCount / totalAnimals * 100) : 0;
    
    return (
      <Card className="p-6 border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center space-y-6">
          <div className="text-2xl font-bold text-green-700 mb-4">
            🎉 Calculation Complete!
          </div>
          
          {/* Auto-filled Equation */}
          <div className="bg-white p-6 rounded-lg border-2 border-green-300">
            <div className="flex items-center justify-center gap-4 text-2xl font-bold mb-4">
              <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg border-2 border-green-300">
                <span className="text-2xl">{config.emoji}</span>
                <span className={`transition-all duration-1000 ${animatingNumbers ? 'animate-pulse text-green-600' : ''}`}>
                  {animalCount}
                </span>
              </div>
              <span>÷ 100 × 100 =</span>
              <Badge className={`text-2xl px-6 py-3 bg-green-600 text-white transition-all duration-1000 ${animatingNumbers ? 'scale-110 animate-bounce' : ''}`}>
                {percentage}%
              </Badge>
            </div>
            
            {/* Step-by-step breakdown */}
            <div className="text-lg text-muted-foreground space-y-2">
              <div className="flex justify-center gap-2">
                <span>{animalCount}</span>
                <span>÷</span>
                <span>{totalAnimals}</span>
                <span>=</span>
                <span className="font-bold">{(animalCount / totalAnimals).toFixed(2)}</span>
              </div>
              <div className="flex justify-center gap-2">
                <span>{(animalCount / totalAnimals).toFixed(2)}</span>
                <span>×</span>
                <span>100</span>
                <span>=</span>
                <span className="font-bold text-green-600">{percentage}%</span>
              </div>
            </div>
          </div>
          
          {/* Animal Info */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-4xl mb-2">{config.emoji}</div>
            <div className="text-xl font-bold">{config.name}</div>
            <div className="text-green-700">{animalCount} out of {totalAnimals} animals = {percentage}%</div>
          </div>
          
          {/* Next Button or Completion */}
          {!isLastAnimal ? (
            <div className="text-sm text-muted-foreground">
              Moving to next animal in 3 seconds...
            </div>
          ) : (
            <div className="text-lg font-bold text-green-600">
              🎊 All animals completed! Redirecting to visualization...
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Main render function for current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <VisualIntroduction />
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <InteractivePieChart />
            {selectedAnimals.includes(currentAnimal?.[0] || '') && (
              <div className="flex justify-center">
                <Button 
                  onClick={() => setCurrentStep(3)}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                >
                  See Full Calculation <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <AutoCalculationDisplay />
            <div className="flex justify-center gap-4">
              {!isLastAnimal ? (
                <Button 
                  onClick={handleNext}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3"
                >
                  Next Animal <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={handleNext}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                >
                  Complete Learning <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        );
      
      default:
        return null;
    }
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
          
          {/* Step Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <Progress value={(currentStep / totalSteps) * 100} className="h-3" />
          </div>
          
        </Card>

        {/* Current Step Content */}
        <div className="mb-6">
          {renderCurrentStep()}
        </div>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default Learning;