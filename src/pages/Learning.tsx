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
  const totalSteps = 4;
  const currentAnimal = animalEntries[currentAnimalIndex];
  const isLastAnimal = currentAnimalIndex >= animalEntries.length - 1;

  // Auto-advance visual animation in step 1
  useEffect(() => {
    if (currentStep === 1 && showVisualAnimation) {
      const timer = setTimeout(() => {
        setShowVisualAnimation(false);
        setCurrentStep(2);
      }, 8000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, showVisualAnimation]);

  // Check if current step is completed
  useEffect(() => {
    if (currentStep === 2 && currentAnimal && selectedAnimals.includes(currentAnimal[0])) {
      const timer = setTimeout(() => {
        if (isLastAnimal) {
          // All animals completed
          setShowConfetti(true);
          setTimeout(() => {
            navigate('/visualization');
          }, 2000);
        } else {
          setCurrentAnimalIndex(prev => prev + 1);
          setShowCalculation(false);
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [currentStep, selectedAnimals, currentAnimal, isLastAnimal, navigate]);

  // Handle animal selection in step 2
  const handleAnimalSelect = (animalType: string) => {
    if (!currentAnimal) return;
    
    const [currentType, currentCount] = currentAnimal;
    const correctPercentage = totalAnimals > 0 ? Math.round(currentCount / totalAnimals * 100) : 0;
    const selectedCount = collectedData[animalType as keyof AnimalData];
    const selectedPercentage = totalAnimals > 0 ? Math.round(selectedCount / totalAnimals * 100) : 0;
    
    if (selectedPercentage === correctPercentage && animalType === currentType) {
      // Correct selection
      setSelectedAnimals(prev => [...prev, animalType]);
      setShowCalculation(true);
      setAnimatingNumbers(true);
      setShowConfetti(true);
      
      // Clear confetti after animation
      setTimeout(() => {
        setShowConfetti(false);
        setAnimatingNumbers(false);
      }, 2000);
    } else {
      // Wrong selection - shake effect could be added here
      console.log('Wrong selection');
    }
  };

  // Step 1: Visual Animation Component  
  const VisualIntroduction = () => (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="text-center space-y-6">
        <div className="text-4xl mb-4">🔢</div>
        
        <div className={`transition-all duration-1000 ${showVisualAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          {/* Total Animals Display */}
          <div className="bg-white p-4 rounded-lg border-2 border-primary/30 mb-6">
            <div className="text-6xl font-bold text-primary animate-pulse">
              {totalAnimals}
            </div>
            <div className="text-lg text-muted-foreground">Total Animals</div>
          </div>
          
          {/* Visual Division Animation */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge variant="outline" className="text-2xl px-4 py-2">{totalAnimals}</Badge>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white font-bold">÷</span>
            </div>
            <Badge variant="outline" className="text-2xl px-4 py-2">100</Badge>
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-white font-bold">×</span>
            </div>
            <Badge variant="outline" className="text-2xl px-4 py-2">100</Badge>
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-bold">=</span>
            </div>
            <Badge className="text-2xl px-4 py-2 bg-primary text-white">%</Badge>
          </div>
          
          {/* Animated Explanation */}
          <div className="grid grid-cols-3 gap-4 text-4xl">
            <div className="animate-bounce" style={{ animationDelay: '0ms' }}>📊</div>
            <div className="animate-bounce" style={{ animationDelay: '200ms' }}>🧮</div>
            <div className="animate-bounce" style={{ animationDelay: '400ms' }}>📈</div>
          </div>
        </div>
      </div>
    </Card>
  );

  // Step 2: Single Pie Chart Focus Component
  const SingleAnimalFocus = () => {
    if (!currentAnimal) return null;
    
    const [animalType, animalCount] = currentAnimal;
    const config = animalConfig[animalType as keyof typeof animalConfig];
    const percentage = totalAnimals > 0 ? Math.round(animalCount / totalAnimals * 100) : 0;
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Eye className="h-6 w-6 text-secondary" />
            <h3 className="text-xl font-bold">Focus on One Animal</h3>
          </div>
          
          {/* Large Single Pie Chart */}
          <div className="flex justify-center">
            <div className="relative w-64 h-64">
              <svg className="w-full h-full" viewBox="0 0 200 200">
                {(() => {
                  let startAngle = 0;
                  const radius = 90;
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
                    const isCurrentAnimal = type === animalType;
                    
                    const slice = (
                      <g key={type}>
                        <path 
                          d={pathData} 
                          fill={typeConfig.color} 
                          stroke="white" 
                          strokeWidth="4" 
                          className={`transition-all duration-500 ${isCurrentAnimal ? 'opacity-100 drop-shadow-lg' : 'opacity-30'}`}
                          style={{
                            filter: isCurrentAnimal ? 'brightness(1.2)' : 'brightness(0.8)'
                          }}
                        />
                        {animalPercentage > 2 && isCurrentAnimal && (
                          <text 
                            x={centerX} 
                            y={centerY} 
                            textAnchor="middle" 
                            dy="0.3em" 
                            className="text-2xl font-bold fill-white animate-pulse"
                            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                          >
                            {Math.round(animalPercentage)}%
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
          
          {/* Current Animal Display */}
          <div className="bg-white p-4 rounded-lg border-2 border-secondary/30">
            <div className="text-4xl mb-2">{config.emoji}</div>
            <div className="text-xl font-bold">{config.name}</div>
            <div className="text-lg text-muted-foreground">{animalCount} animals</div>
            <Badge className="text-lg px-4 py-2 mt-2" style={{ backgroundColor: config.color }}>
              {percentage}%
            </Badge>
          </div>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Animal {currentAnimalIndex + 1} of {animalEntries.length}</span>
            <Progress value={((currentAnimalIndex + 1) / animalEntries.length) * 100} className="flex-1" />
          </div>
        </div>
      </Card>
    );
  };

  // Step 3: Interactive Animal Selection Component
  const AnimalSelection = () => {
    if (!currentAnimal) return null;
    
    const [, currentCount] = currentAnimal;
    const targetPercentage = totalAnimals > 0 ? Math.round(currentCount / totalAnimals * 100) : 0;
    
    return (
      <Card className="p-6 border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-6 w-6 text-accent" />
            <h3 className="text-xl font-bold">Select the Correct Animal</h3>
          </div>
          
          {/* Equation Template */}
          <div className="bg-white p-6 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-2xl font-bold mb-4">Find the animal that equals:</div>
            <div className="flex items-center justify-center gap-4 text-xl">
              <div className="bg-gray-100 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300">
                <span className="text-gray-500">?</span>
              </div>
              <span>÷ 100 × 100 =</span>
              <Badge className="text-xl px-4 py-2 bg-accent text-white">
                {targetPercentage}%
              </Badge>
            </div>
          </div>
          
          {/* Animal Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(collectedData)
              .filter(([, count]) => count > 0)
              .map(([animalType, count]) => {
                const config = animalConfig[animalType as keyof typeof animalConfig];
                const isSelected = selectedAnimals.includes(animalType);
                const isCurrentCorrect = animalType === currentAnimal[0];
                
                return (
                  <button
                    key={animalType}
                    onClick={() => handleAnimalSelect(animalType)}
                    disabled={isSelected}
                    className={`p-4 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 ${
                      isSelected && isCurrentCorrect
                        ? 'border-green-500 bg-green-50 cursor-default'
                        : isSelected
                        ? 'border-gray-300 bg-gray-100 cursor-default opacity-50'
                        : 'border-accent/30 bg-white hover:border-accent hover:bg-accent/10 cursor-pointer'
                    }`}
                  >
                    <div className="text-3xl mb-2">{config.emoji}</div>
                    <div className="font-bold">{config.name}</div>
                    <div className="text-sm text-muted-foreground">{count} animals</div>
                    {isSelected && isCurrentCorrect && (
                      <div className="mt-2 text-green-600 font-bold">✓ Correct!</div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </Card>
    );
  };

  // Step 4: Auto-Calculation Display Component  
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
            {!showVisualAnimation && (
              <div className="text-center">
                <Button 
                  onClick={() => setShowVisualAnimation(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Start Visual Introduction
                </Button>
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-6">
            <SingleAnimalFocus />
            <AnimalSelection />
            {showCalculation && <AutoCalculationDisplay />}
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

        {/* Navigation */}
        <Card className="p-4 bg-white/80 backdrop-blur-sm">
          <div className="flex justify-between items-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Back to Game
            </Button>
            
            <div className="text-center">
              {currentStep === 1 && !showVisualAnimation && (
                <p className="text-sm text-muted-foreground">Click the button above to start the visual introduction</p>
              )}
              {currentStep === 1 && showVisualAnimation && (
                <p className="text-sm text-muted-foreground">Watch the visual explanation...</p>
              )}
              {currentStep === 2 && currentAnimal && (
                <p className="text-sm text-muted-foreground">
                  Click the animal that matches {totalAnimals > 0 ? Math.round(currentAnimal[1] / totalAnimals * 100) : 0}%
                </p>
              )}
            </div>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/visualization')}
              className="flex items-center gap-2"
            >
              Skip to Results
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default Learning;