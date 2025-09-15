import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();

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
  
  // Visual weight adjustments to make elephants more prominent
  const getVisualWeight = (animalType: string, actualCount: number): number => {
    switch (animalType) {
      case 'insects':
        return actualCount * 0.2; // Drastically reduce insects visual weight
      case 'birds':
        return actualCount * 0.5; // Reduce birds significantly
      case 'reptiles':
        return actualCount * 0.6; // Reduce reptiles
      case 'fish':
        return actualCount * 0.7; // Reduce fish
      case 'mammals':
        return actualCount * 2.5; // Dramatically boost mammals (elephants)
      default:
        return actualCount;
    }
  };
  
  // Calculate visual data for pie charts
  const visualData = Object.fromEntries(
    Object.entries(collectedData).map(([type, count]) => [
      type, 
      getVisualWeight(type, count)
    ])
  );
  const totalVisualWeight = Object.values(visualData).reduce((sum: number, weight: number) => sum + weight, 0);
  
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
  const [completedAnimals, setCompletedAnimals] = useState<string[]>([]);
  const [currentTargetAnimal, setCurrentTargetAnimal] = useState<string | null>(null);
  const [currentCalculation, setCurrentCalculation] = useState<string | null>(null);
  const [animatingNumbers, setAnimatingNumbers] = useState(false);
  
  // Drag-drop questions state
  const [showDragDrop, setShowDragDrop] = useState(false);
  const [dragDropQuestions, setDragDropQuestions] = useState<any[]>([]);
  const [currentDragDropIndex, setCurrentDragDropIndex] = useState(0);
  const [droppedItems, setDroppedItems] = useState<any[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  // Get animal entries for the exercise
  const animalEntries = Object.entries(collectedData).filter(([, count]) => count > 0);
  const isAllCompleted = completedAnimals.length === animalEntries.length;

  // Set first target animal immediately
  useEffect(() => {
    if (animalEntries.length > 0) {
      // Set first target animal (highest count)
      const firstTarget = animalEntries.reduce((max, current) => 
        current[1] > max[1] ? current : max, animalEntries[0]
      );
      setCurrentTargetAnimal(firstTarget[0]);
    }
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

  // Generate drag-drop questions
  const generateDragDropQuestions = () => {
    const questions = animalEntries.map((entry, index) => {
      const [animalType, count] = entry;
      const percentage = Math.round((count / totalAnimals) * 100);
      
      return {
        id: `dragdrop-${index}`,
        animalType,
        equation: `? ÷ ? × ? = ${percentage}%`,
        correctDrops: {
          animal: `${count}`,
          total: `${totalAnimals}`,
          hundred: "100"
        }
      };
    });
    return questions.slice(0, 5); // Limit to 5 questions
  };

  // Drag-drop handlers
  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    if (draggedItem) {
      setDroppedItems(prev => [
        ...prev.filter(item => item.zone !== zone),
        { zone, item: draggedItem }
      ]);
      setDraggedItem(null);
    }
  };

  const checkDragDropAnswer = () => {
    const currentQuestion = dragDropQuestions[currentDragDropIndex];
    if (!currentQuestion) return false;

    const animalDrop = droppedItems.find(item => item.zone === 'animal');
    const totalDrop = droppedItems.find(item => item.zone === 'total');
    const hundredDrop = droppedItems.find(item => item.zone === 'hundred');

    return animalDrop?.item === currentQuestion.correctDrops.animal &&
           totalDrop?.item === currentQuestion.correctDrops.total &&
           hundredDrop?.item === currentQuestion.correctDrops.hundred;
  };

  const handleDragDropSubmit = () => {
    if (checkDragDropAnswer()) {
      setShowConfetti(true);
      toast({
        title: "🎉 Perfect!",
        description: "Correct equation!",
        duration: 2000
      });
      setTimeout(() => {
        if (currentDragDropIndex < dragDropQuestions.length - 1) {
          setCurrentDragDropIndex(prev => prev + 1);
          setDroppedItems([]);
          setShowConfetti(false);
        } else {
          // All questions completed, navigate to next page
          navigate('/whole-from-percentage');
        }
      }, 2000);
    } else {
      toast({
        title: "🤔 Try again",
        description: "Check your equation placement",
        duration: 2000
      });
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
      // All animals completed - start drag-drop questions
      const questions = generateDragDropQuestions();
      setDragDropQuestions(questions);
      setCurrentDragDropIndex(0);
      setDroppedItems([]);
      setShowDragDrop(true);
    }
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
          
          {/* Current Target Display */}
          <div className="bg-white p-4 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-3xl mb-2">{targetConfig.emoji}</div>
            <div className="text-lg font-bold">{targetConfig.name}</div>
            <div className="text-sm text-muted-foreground">Find this animal in the circle below</div>
          </div>
          
          {/* Pie Chart - All Animals */}
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
                            y={isCompleted ? labelY - 6 : labelY} 
                            textAnchor="middle" 
                            dy="0.3em" 
                            className={type === 'mammals' ? 'text-3xl pointer-events-none' : 'text-2xl pointer-events-none'}
                          >
                            {typeConfig.emoji}
                          </text>
                          {/* Animal count or percentage */}
                          {isCompleted ? (
                            <>
                              <text 
                                x={labelX} 
                                y={labelY + 12} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-lg font-bold fill-white pointer-events-none animate-scale-in"
                                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                              >
                                {Math.round(count / totalAnimals * 100)}%
                              </text>
                              <text 
                                x={labelX} 
                                y={labelY + 28} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-xs font-medium fill-white/80 pointer-events-none"
                                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                              >
                                ({count})
                              </text>
                            </>
                          ) : (
                            <text 
                              x={labelX} 
                              y={labelY + 18} 
                              textAnchor="middle" 
                              dy="0.3em" 
                              className={`${type === 'mammals' ? 'text-base' : 'text-sm'} font-bold fill-white pointer-events-none`}
                              style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
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
                      Start Practice Questions <ArrowRight className="w-4 h-4 ml-2" />
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



  // Drag-Drop Questions Component
  const DragDropQuestions = () => {
    if (!dragDropQuestions.length) return null;
    
    const currentQuestion = dragDropQuestions[currentDragDropIndex];
    const [animalType, count] = animalEntries.find(([type]) => type === currentQuestion.animalType) || ['mammals', 0];
    const percentage = Math.round((count / totalAnimals) * 100);
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          
          {/* Question Header */}
          <div className="mb-4">
            <div className="text-6xl mb-3">
              {animalConfig[animalType as keyof typeof animalConfig].emoji}
            </div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">
              Drag the correct numbers into the equation
            </h2>
            <div className="text-lg text-purple-600 font-semibold">
              Question {currentDragDropIndex + 1} of {dragDropQuestions.length}
            </div>
          </div>

          {/* Percentage Equivalency Display */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200 mb-6">
            <h3 className="text-lg font-bold text-blue-700 mb-2">💡 Remember:</h3>
            <div className="text-xl font-semibold text-blue-600">
              {percentage}% = {(percentage / 100).toFixed(2)}
            </div>
            <div className="text-sm text-blue-500 mt-1">Percentage as decimal</div>
          </div>

          {/* Draggable Items */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Drag these items:</h3>
            <div className="flex justify-center gap-4 flex-wrap">
              {[
                { id: count.toString(), label: `${count} ${animalConfig[animalType as keyof typeof animalConfig].emoji}`, color: 'bg-purple-200 border-purple-400' },
                { id: totalAnimals.toString(), label: `${totalAnimals}`, color: 'bg-pink-200 border-pink-400' },
                { id: '100', label: '100', color: 'bg-purple-200 border-purple-400' }
              ].map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item.id)}
                  className={`${item.color} px-6 py-4 rounded-2xl border-2 text-2xl font-bold cursor-move hover:scale-105 transition-transform shadow-sm`}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          {/* Equation with Drop Zones */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-4">Complete the equation:</h3>
            <div className="flex items-center justify-center gap-4 flex-wrap text-2xl font-bold">
              {/* Drop Zone 1 */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'animal')}
                className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                  droppedItems.find(item => item.zone === 'animal') 
                    ? 'bg-purple-100 border-purple-400 text-purple-700' 
                    : 'border-gray-400 text-gray-400 hover:border-purple-400'
                }`}
              >
                {droppedItems.find(item => item.zone === 'animal')?.item || '?'}
              </div>
              
              <span className="text-gray-500">÷</span>
              
              {/* Drop Zone 2 */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'total')}
                className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                  droppedItems.find(item => item.zone === 'total') 
                    ? 'bg-pink-100 border-pink-400 text-pink-700' 
                    : 'border-gray-400 text-gray-400 hover:border-pink-400'
                }`}
              >
                {droppedItems.find(item => item.zone === 'total')?.item || '?'}
              </div>
              
              <span className="text-gray-500">×</span>
              
              {/* Drop Zone 3 */}
              <div
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'hundred')}
                className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                  droppedItems.find(item => item.zone === 'hundred') 
                    ? 'bg-purple-100 border-purple-400 text-purple-700' 
                    : 'border-gray-400 text-gray-400 hover:border-purple-400'
                }`}
              >
                {droppedItems.find(item => item.zone === 'hundred')?.item || '?'}
              </div>
              
              <span className="text-gray-500">=</span>
              
              <div className="bg-pink-100 px-4 py-3 rounded-2xl border-2 border-pink-300">
                {percentage}% {animalConfig[animalType as keyof typeof animalConfig].emoji}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleDragDropSubmit}
            disabled={droppedItems.length < 3}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            Check My Answer ✓
          </Button>
        </div>
      </Card>
    );
  };

  // Main render function
  const renderContent = () => {
    if (showDragDrop) {
      return <DragDropQuestions />;
    }
    
    if (isAllCompleted && !showDragDrop) {
      return (
        <Card className="p-4 md:p-6 text-center border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-2xl md:text-3xl mb-2">🎊</div>
          <h2 className="text-lg md:text-xl font-bold text-green-700 mb-2">
            Congratulations! All Animals Completed!
          </h2>
          <p className="text-sm md:text-base text-green-600 mb-3">
            You've successfully calculated the percentage for all {animalEntries.length} animal types!
          </p>
          <Button 
            onClick={handleNext}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm"
          >
            Start Practice Questions <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      );
    }
    
    return <LearningExercise />;
  };

  if (totalAnimals === 0) {
    return (
      <div className="h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center overflow-hidden">
        <Card className="p-4 md:p-6 text-center">
          <h2 className="text-lg md:text-xl font-bold mb-3">🧮 Learn Percentages & Data Analysis</h2>
          <p className="text-muted-foreground mb-3 text-sm md:text-base">
            First, collect some animals to start learning! 
          </p>
          <Button onClick={() => navigate('/')} className="text-sm">
            Go Collect Animals
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 p-2 md:p-3 overflow-hidden flex flex-col max-h-screen">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        <Card className="p-3 md:p-4 mb-2 bg-white/80 backdrop-blur-sm flex-shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-center mb-2">
            🧮 Interactive Percentage Learning
          </h1>
        </Card>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {renderContent()}
        </div>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default Learning;