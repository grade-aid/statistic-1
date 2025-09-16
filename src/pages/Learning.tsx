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
  const [showPieChart, setShowPieChart] = useState(true);
  const [showEquation, setShowEquation] = useState(false);
  
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
    
    // Show equation view for clicked animal
    setCurrentCalculation(animalType);
    setCurrentTargetAnimal(animalType);
    setShowPieChart(false);
    setShowEquation(true);
    setAnimatingNumbers(true);
    setShowConfetti(true);
    
    // Clear animation after delay
    setTimeout(() => {
      setAnimatingNumbers(false);
      setShowConfetti(false);
    }, 2000);
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
    if (currentCalculation) {
      // Mark current animal as completed
      setCompletedAnimals(prev => [...prev, currentCalculation]);
      
      const remaining = animalEntries.filter(([type]) => 
        !completedAnimals.includes(type) && type !== currentCalculation
      );
      
      if (remaining.length > 0) {
        // Go back to pie chart for next animal
        setShowEquation(false);
        setShowPieChart(true);
        setCurrentCalculation(null);
        setCurrentTargetAnimal(null);
      } else {
        // All animals completed - start drag-drop questions
        const questions = generateDragDropQuestions();
        setDragDropQuestions(questions);
        setCurrentDragDropIndex(0);
        setDroppedItems([]);
        setShowDragDrop(true);
        setShowEquation(false);
        setShowPieChart(false);
      }
    }
  };


  // Pie Chart Component
  const PieChartView = () => {
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          
          {/* Instructions */}
          <div className="bg-white p-4 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-2xl mb-2">🎯</div>
            <div className="text-lg font-bold mb-2">Click animals to see formulas</div>
          </div>
          
          {/* Pie Chart - All Animals */}
          <div className="flex justify-center mb-6">
            <div className="relative w-80 h-80">
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
                            className={`transition-all duration-500 cursor-pointer hover:brightness-110 hover:scale-105 ${
                              isCompleted
                                ? 'opacity-50' 
                                : 'opacity-90 hover:opacity-100 hover:drop-shadow-lg'
                            }`}
                            onClick={() => !isCompleted && handleAnimalClick(type)}
                            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
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
                          {/* Animal count */}
                          {isCompleted ? (
                            <>
                              <text 
                                x={labelX} 
                                y={labelY + 12} 
                                textAnchor="middle" 
                                dy="0.3em" 
                                className="text-lg font-bold fill-white pointer-events-none"
                                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                              >
                                ✓ {Math.round(count / totalAnimals * 100)}%
                              </text>
                            </>
                          ) : (
                            <text 
                              x={labelX} 
                              y={labelY + 18} 
                              textAnchor="middle" 
                              dy="0.3em" 
                              className={`${type === 'mammals' ? 'text-base' : 'text-sm'} font-bold fill-white pointer-events-none cursor-pointer`}
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
            <div className="text-xs text-muted-foreground">
              Click animals to learn formulas
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Equation View Component
  const EquationView = () => {
    if (!currentCalculation) return null;
    
    const targetConfig = animalConfig[currentCalculation as keyof typeof animalConfig];
    const targetCount = collectedData[currentCalculation as keyof AnimalData];
    const targetPercentage = totalAnimals > 0 ? Math.round(targetCount / totalAnimals * 100) : 0;
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          
          {/* Animal Header */}
          <div className="bg-white p-4 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-5xl mb-2">{targetConfig.emoji}</div>
            <div className="text-xl font-bold">{targetConfig.name}</div>
          </div>
          
          {/* Equation Formula */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <div className="text-center space-y-4">
              <div className="text-lg font-bold text-blue-700 mb-3">
                📐 Percentage Formula
              </div>
              
              {/* Main Formula */}
              <div className="bg-white p-4 rounded-lg border border-blue-300 mb-4">
                <div className="text-xl font-mono font-bold text-gray-800">
                  Percentage = (Part ÷ Total) × 100
                </div>
              </div>
              
              {/* Calculation */}
              <div className="flex items-center justify-center gap-3 text-2xl flex-wrap">
                <div className="bg-white px-4 py-3 rounded-lg border-2 border-blue-300 font-bold text-blue-700">
                  {targetCount}
                </div>
                <span className="font-bold text-blue-700">÷</span>
                <div className="bg-white px-4 py-3 rounded-lg border-2 border-blue-300 font-bold text-blue-700">
                  {totalAnimals}
                </div>
                <span className="font-bold text-blue-700">×</span>
                <div className="bg-white px-4 py-3 rounded-lg border-2 border-blue-300 font-bold text-blue-700">
                  100
                </div>
                <span className="font-bold text-blue-700">=</span>
                <Badge className={`text-2xl px-4 py-3 bg-blue-600 text-white transition-all duration-500 ${animatingNumbers ? 'scale-110 animate-bounce' : ''}`}>
                  {targetPercentage}%
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4">
            <Button 
              onClick={() => {
                setShowEquation(false);
                setShowPieChart(true);
                setCurrentCalculation(null);
              }}
              variant="outline"
              className="px-6 py-2"
            >
              ← Back to Chart
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
            >
              {completedAnimals.length >= animalEntries.length - 1 ? 'Start Practice Questions' : 'Continue'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
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
                onClick={() => {
                  setDroppedItems(prev => prev.filter(item => item.zone !== 'animal'));
                }}
                className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer ${
                  droppedItems.find(item => item.zone === 'animal') 
                    ? 'bg-purple-100 border-purple-400 text-purple-700 hover:bg-purple-200' 
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
                onClick={() => {
                  setDroppedItems(prev => prev.filter(item => item.zone !== 'total'));
                }}
                className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer ${
                  droppedItems.find(item => item.zone === 'total') 
                    ? 'bg-pink-100 border-pink-400 text-pink-700 hover:bg-pink-200' 
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
                onClick={() => {
                  setDroppedItems(prev => prev.filter(item => item.zone !== 'hundred'));
                }}
                className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all cursor-pointer ${
                  droppedItems.find(item => item.zone === 'hundred') 
                    ? 'bg-purple-100 border-purple-400 text-purple-700 hover:bg-purple-200' 
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
    
    if (isAllCompleted && !showDragDrop && !showPieChart && !showEquation) {
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
    
    if (showEquation) {
      return <EquationView />;
    }
    
    return <PieChartView />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-6 overflow-hidden flex flex-col">
      <div className="max-w-3xl mx-auto h-full flex flex-col">
        <Card className="p-3 md:p-4 mb-2 bg-white/80 backdrop-blur-sm flex-shrink-0">
          <h1 className="text-lg md:text-xl font-bold text-center mb-2">
            🧮 Interactive Percentage Learning
          </h1>
        </Card>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {renderContent()}
        </div>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default Learning;