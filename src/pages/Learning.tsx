import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Calculator, Lightbulb, Divide, X, Equal, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  const [currentPhase, setCurrentPhase] = useState(3);
  const [userAnswers, setUserAnswers] = useState<{
    [key: string]: string;
  }>({});
  const [answerStates, setAnswerStates] = useState<{
    [key: string]: 'correct' | 'incorrect' | 'unanswered';
  }>({});
  const [shakingQuestions, setShakingQuestions] = useState<{
    [key: string]: boolean;
  }>({});
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Drag and drop state for Phase 6
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [droppedItems, setDroppedItems] = useState<{[key: string]: string[]}>({
    low: [],
    medium: [],
    high: []
  });
  const [completedTasks, setCompletedTasks] = useState<{[key: string]: boolean}>({});
  const [phaseCompleted, setPhaseCompleted] = useState<{[key: number]: boolean}>({});

  // Auto-check phase completion when answer states change
  useEffect(() => {
    const timer = setTimeout(() => {
      checkPhaseCompletion(currentPhase);
    }, 100); // Small delay to ensure state updates are complete
    
    return () => clearTimeout(timer);
  }, [answerStates, droppedItems, currentPhase]);

  // Calculate correct answers - ensure numbers are properly typed
  const mammalsPercentage = totalAnimals > 0 ? Math.round(collectedData.mammals / totalAnimals * 100) : 0;
  const onePercent = totalAnimals > 0 ? totalAnimals / 100 : 0;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (draggedItem) {
      // Remove animal from other zones first
      setDroppedItems(prev => {
        const newItems = { ...prev };
        // Remove from all zones
        Object.keys(newItems).forEach(zone => {
          newItems[zone] = newItems[zone].filter(animal => animal !== draggedItem);
        });
        // Add to target zone
        newItems[targetId] = [...newItems[targetId], draggedItem];
        return newItems;
      });
      
      // Check if it's correct
      const isCorrect = checkDragDropAnswer(draggedItem, targetId);
      if (isCorrect) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
      
      // Phase completion will be checked by useEffect
      
      setDraggedItem(null);
    }
  };

  const checkDragDropAnswer = (draggedId: string, targetId: string): boolean => {
    // Define correct matches based on percentage ranges
    const animalPercentages = Object.entries(collectedData).map(([type, count]) => ({
      type,
      percentage: totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0
    }));

    const draggedAnimal = animalPercentages.find(animal => animal.type === draggedId);
    if (!draggedAnimal) return false;

    // Define percentage ranges
    const ranges = {
      'low': [0, 15],      // 0-15%
      'medium': [16, 35],  // 16-35%
      'high': [36, 100]    // 36-100%
    };

    const targetRange = ranges[targetId as keyof typeof ranges];
    if (!targetRange) return false;

    return draggedAnimal.percentage >= targetRange[0] && draggedAnimal.percentage <= targetRange[1];
  };

  // Visual Components
  const VisualCalculator = ({
    operation,
    values,
    result,
    color = "blue"
  }: {
    operation: string;
    values: (string | number)[];
    result: string;
    color?: string;
  }) => <div className={`bg-gradient-to-r from-${color}-100 to-${color}-50 p-2 rounded-lg border border-${color}-200`}>
      <div className="text-center mb-2">
        <div className="text-xs font-medium text-muted-foreground">🐘 Mammals Calculation</div>
      </div>
      <div className="flex items-center justify-center gap-2 text-sm font-bold">
        <Badge variant="outline" className="text-sm px-2 py-1">{values[0]}</Badge>
        <div className={`w-6 h-6 rounded-full bg-${color}-500 flex items-center justify-center text-black`}>
          {operation === 'divide' && <Divide size={12} />}
          {operation === 'multiply' && <X size={12} />}
          {operation === 'percentage' && <Divide size={12} />}
        </div>
        <Badge variant="outline" className="text-sm px-2 py-1">{values[1]}</Badge>
        {operation === 'percentage' && <>
            <div className={`w-6 h-6 rounded-full bg-${color}-500 flex items-center justify-center text-black`}>
              <X size={12} />
            </div>
            <Badge variant="outline" className="text-sm px-2 py-1">100</Badge>
          </>}
        <div className={`w-6 h-6 rounded-full bg-${color}-600 flex items-center justify-center text-black`}>
          <Equal size={12} />
        </div>
        <Badge variant="secondary" className="text-sm px-2 py-1 bg-orange-600 text-white">
          {result}
        </Badge>
      </div>
    </div>;
  const AnimalVisual = ({
    count,
    emoji,
    total,
    name,
    showPercentages = false
  }: {
    count: number;
    emoji: string;
    total: number;
    name: string;
    showPercentages?: boolean;
  }) => {
    const percentage = total > 0 ? Math.round(count / total * 100) : 0;

    // Get all animal data for pie chart
    const dataEntries = Object.entries(collectedData);

    // Use the consolidated animalConfig from parent scope
    return <div className="bg-white p-2 rounded-lg border space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{emoji}</span>
          <div>
            <div className="text-sm font-bold">{name}</div>
          </div>
        </div>
        
        {/* Mini Pie Chart from Visualization */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {(() => {
              let startAngle = 0;
              const radius = 80;
              const centerX = 100;
              const centerY = 100;
              return dataEntries.map(([type, animalCount]) => {
                const animalPercentage = animalCount / total * 100;
                const angle = animalPercentage / 100 * 360;
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
                const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');

                // Label position (middle of slice)
                const labelAngle = (startAngle + endAngle) / 2;
                const labelAngleRad = labelAngle * Math.PI / 180;
                const labelRadius = radius * 0.7;
                const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
                const labelY = centerY + labelRadius * Math.sin(labelAngleRad);
                const config = animalConfig[type as keyof typeof animalConfig];
                const slice = <g key={type}>
                      <path d={pathData} fill={config.color} stroke="white" strokeWidth="4" className="transition-all duration-300" />
                      {animalPercentage > 5 && <text x={labelX} y={labelY} textAnchor="middle" dy="0.3em" className="text-sm font-bold fill-white" style={{
                    textShadow: '1px 1px 1px rgba(0,0,0,0.5)'
                  }}>
                          {showPercentages ? `${Math.round(animalPercentage)}%` : animalCount}
                        </text>}
                    </g>;
                startAngle = endAngle;
                return slice;
              });
            })()}
            </svg>
          </div>
        </div>
        
        {/* Color Legend */}
        <div className="flex flex-wrap gap-1 justify-center mt-2">
          {Object.entries(animalConfig).map(([type, config]) => <div key={type} className="flex items-center gap-0.5">
              <div className="w-2 h-2 rounded-sm" style={{
            backgroundColor: config.color
          }} />
              <span className="text-xs text-muted-foreground">
                {config.emoji}
              </span>
            </div>)}
        </div>
        
        
      </div>;
  };
  // Check if a phase is completed
  const checkPhaseCompletion = (phase: number) => {
    console.log(`🔍 Checking phase ${phase} completion...`);
    console.log(`Already completed:`, phaseCompleted[phase]);
    
    // Don't duplicate completion logic, but allow function to check progress
    if (phaseCompleted[phase]) {
      console.log(`Phase ${phase} already completed, skipping completion check`);
      return false;
    }
    
    let isCompleted = false;
    
    if (phase === 3) {
      // Phase 3: All animal percentage calculations (excluding mammals which is example)
      const phase3Questions = Object.keys(collectedData).filter(type => type !== 'mammals');
      console.log(`Phase 3 questions:`, phase3Questions);
      console.log(`Answer states:`, answerStates);
      isCompleted = phase3Questions.every(type => answerStates[`phase3-${type}`] === 'correct');
      console.log(`Phase 3 completed:`, isCompleted);
    } 
    else if (phase === 4) {
      // Phase 4: All animal decimal conversions (excluding mammals which is example)
      const phase4Questions = Object.keys(collectedData).filter(type => type !== 'mammals');
      console.log(`Phase 4 questions:`, phase4Questions);
      console.log(`Answer states:`, answerStates);
      isCompleted = phase4Questions.every(type => answerStates[`phase4-${type}`] === 'correct');
      console.log(`Phase 4 completed:`, isCompleted);
    }
    else if (phase === 5) {
      // Phase 5: All percentage multiplication tasks
      const phase5Questions = [1, 3, 7, 12];
      console.log(`Phase 5 questions:`, phase5Questions);
      console.log(`Answer states:`, answerStates);
      isCompleted = phase5Questions.every(multiplier => answerStates[`phase5-${multiplier}`] === 'correct');
      console.log(`Phase 5 completed:`, isCompleted);
    }
    else if (phase === 6) {
      // Phase 6: All animals sorted correctly
      const totalAnimalsCount = Object.keys(collectedData).length;
      const sortedAnimalsCount = Object.values(droppedItems).flat().length;
      console.log(`Phase 6 - Total animals:`, totalAnimalsCount, `Sorted:`, sortedAnimalsCount);
      console.log(`Dropped items:`, droppedItems);
      
      // Check if all animals are sorted and correctly placed
      isCompleted = sortedAnimalsCount === totalAnimalsCount && 
        Object.values(droppedItems).flat().every(animalType => {
          // Find which zone this animal is in
          const zone = Object.keys(droppedItems).find(zoneName => 
            droppedItems[zoneName].includes(animalType)
          );
          const isCorrect = zone && checkDragDropAnswer(animalType, zone);
          console.log(`Animal ${animalType} in zone ${zone}: ${isCorrect}`);
          return isCorrect;
        });
      console.log(`Phase 6 completed:`, isCompleted);
    }
    
    if (isCompleted && !phaseCompleted[phase]) {
      console.log(`🎉 Phase ${phase} completed! Auto-advancing in 1 second...`);
      
      // Mark phase as completed
      setPhaseCompleted(prev => ({
        ...prev,
        [phase]: true
      }));
      
      // Show confetti celebration
      setShowConfetti(true);
      
      // Auto-advance to next phase after celebration
      setTimeout(() => {
        console.log(`⏰ Moving from phase ${phase} to phase ${phase + 1}`);
        setShowConfetti(false);
        if (phase < 6) {
          setCurrentPhase(phase + 1);
        }
      }, 1000);
      
      return true;
    }
    
    return false;
  };

  const checkAnswer = (questionId: string, userAnswer: string, correctAnswer: number) => {
    // Add detailed debugging for fish question
    if (questionId === 'phase3-fish') {
      console.log(`🐟 FISH QUESTION DEBUG:`);
      console.log(`- Question ID: ${questionId}`);
      console.log(`- User Answer: "${userAnswer}"`);
      console.log(`- Correct Answer: ${correctAnswer}`);
      console.log(`- Fish Count: ${collectedData.fish}`);
      console.log(`- Total Animals: ${totalAnimals}`);
      console.log(`- Fish Percentage Calculation: ${collectedData.fish} / ${totalAnimals} * 100 = ${totalAnimals > 0 ? Math.round(collectedData.fish / totalAnimals * 100) : 0}`);
    }
    
    // Use higher tolerance for percentage questions (whole numbers)
    const tolerance = correctAnswer > 10 ? 1.0 : 0.1;
    const isCorrect = Math.abs(parseFloat(userAnswer) - correctAnswer) < tolerance;
    
    // More debugging for fish question
    if (questionId === 'phase3-fish') {
      console.log(`- Tolerance: ${tolerance}`);
      console.log(`- Parsed User Answer: ${parseFloat(userAnswer)}`);
      console.log(`- Difference: ${Math.abs(parseFloat(userAnswer) - correctAnswer)}`);
      console.log(`- Is Correct: ${isCorrect}`);
    }
    if (isCorrect) {
      // Update answer state to correct
      setAnswerStates(prev => ({
        ...prev,
        [questionId]: 'correct'
      }));

      // Trigger confetti animation
      setShowConfetti(true);

      // Clear confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Phase completion will be checked by useEffect
    } else {
      // Update answer state to incorrect
      setAnswerStates(prev => ({
        ...prev,
        [questionId]: 'incorrect'
      }));

      // Trigger shake animation
      setShakingQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));

      // Clear shake animation
      setTimeout(() => {
        setShakingQuestions(prev => ({
          ...prev,
          [questionId]: false
        }));
      }, 500);
    }
    return isCorrect;
  };

  // Auto-fill function for testing purposes
  const autoFillAnswers = () => {
    console.log(`🔧 Auto-filling answers for Phase ${currentPhase}`);
    
    if (currentPhase === 3) {
      // Phase 3: Fill in correct percentages for all non-mammal animals
      const newAnswers: { [key: string]: string } = {};
      const newAnswerStates: { [key: string]: 'correct' | 'incorrect' | 'unanswered' } = {};
      
      Object.entries(collectedData).filter(([type]) => type !== 'mammals').forEach(([type, count]) => {
        const correctPercentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
        const questionId = `phase3-${type}`;
        newAnswers[questionId] = correctPercentage.toString();
        newAnswerStates[questionId] = 'correct';
      });
      
      setUserAnswers(prev => ({ ...prev, ...newAnswers }));
      setAnswerStates(prev => ({ ...prev, ...newAnswerStates }));
      
      // Trigger confetti and check completion
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        checkPhaseCompletion(3);
      }, 1000);
    }
    else if (currentPhase === 4) {
      // Phase 4: Fill in correct decimals for all non-mammal animals
      const newAnswers: { [key: string]: string } = {};
      const newAnswerStates: { [key: string]: 'correct' | 'incorrect' | 'unanswered' } = {};
      
      Object.entries(collectedData).filter(([type]) => type !== 'mammals').forEach(([type, count]) => {
        const percentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
        const correctDecimal = percentage / 100;
        const questionId = `phase4-${type}`;
        newAnswers[questionId] = correctDecimal.toFixed(2);
        newAnswerStates[questionId] = 'correct';
      });
      
      setUserAnswers(prev => ({ ...prev, ...newAnswers }));
      setAnswerStates(prev => ({ ...prev, ...newAnswerStates }));
      
      // Trigger confetti and check completion
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        checkPhaseCompletion(4);
      }, 1000);
    }
    else if (currentPhase === 5) {
      // Phase 5: Fill in correct values for all multipliers
      const newAnswers: { [key: string]: string } = {};
      const newAnswerStates: { [key: string]: 'correct' | 'incorrect' | 'unanswered' } = {};
      
      [1, 3, 7, 12].forEach(multiplier => {
        const correctAmount = (multiplier * onePercent).toFixed(1);
        const questionId = `phase5-${multiplier}`;
        newAnswers[questionId] = correctAmount;
        newAnswerStates[questionId] = 'correct';
      });
      
      setUserAnswers(prev => ({ ...prev, ...newAnswers }));
      setAnswerStates(prev => ({ ...prev, ...newAnswerStates }));
      
      // Trigger confetti and check completion
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        checkPhaseCompletion(5);
      }, 1000);
    }
    else if (currentPhase === 6) {
      // Phase 6: Auto-sort all animals into correct zones
      const newDroppedItems = { low: [], medium: [], high: [] } as { [key: string]: string[] };
      
      Object.entries(collectedData).forEach(([type, count]) => {
        const percentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
        
        if (percentage >= 0 && percentage <= 15) {
          newDroppedItems.low.push(type);
        } else if (percentage >= 16 && percentage <= 35) {
          newDroppedItems.medium.push(type);
        } else if (percentage >= 36 && percentage <= 100) {
          newDroppedItems.high.push(type);
        }
      });
      
      setDroppedItems(newDroppedItems);
      
      // Trigger confetti and check completion
      setShowConfetti(true);
      setTimeout(() => {
        setShowConfetti(false);
        checkPhaseCompletion(6);
      }, 1000);
    }
  };
  const renderPhase3 = () => <Card className="p-3 border border-green-200 bg-green-50">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="h-5 w-5 text-green-600" />
        <h3 className="text-base font-bold text-green-800">Amount → Percentage 🐘</h3>
      </div>
      
      <div className="space-y-3">
        {/* Visual Example */}
        <div className="bg-white p-3 rounded-lg border border-green-200">
          <h4 className="text-sm font-bold mb-2 text-green-700">📚 Example: Mammals</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <AnimalVisual count={collectedData.mammals} emoji="🐘" total={totalAnimals} name="Mammals" showPercentages={false} />
            <div className="space-y-2">
              <VisualCalculator operation="percentage" values={[collectedData.mammals, totalAnimals]} result={`${mammalsPercentage}%`} color="green" />
            </div>
          </div>
        </div>

        {/* Interactive Practice */}
        <div className="bg-white p-3 rounded-lg border border-green-200">
          <h4 className="text-sm font-bold mb-2 text-green-700">✏️ Your Turn</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1">
            {Object.entries(collectedData).filter(([type]) => type !== 'mammals').map(([type, count]) => {
            const config = animalConfig[type as keyof typeof animalConfig];
            const correctPercentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
            const questionId = `phase3-${type}`;
            const answerState = answerStates[questionId] || 'unanswered';
            const isShaking = shakingQuestions[questionId] || false;
            return <div key={type} className={`bg-gray-50 p-1 rounded-lg space-y-1 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                  <AnimalVisual count={count} emoji={config.emoji} total={totalAnimals} name={config.name} showPercentages={false} />
                  <div className="flex gap-1">
                    <Input type="number" placeholder="%" value={userAnswers[questionId] || ''} onChange={e => setUserAnswers(prev => ({
                  ...prev,
                  [questionId]: e.target.value
                }))} className={`flex-1 text-sm h-7 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} disabled={answerState === 'correct'} />
                    <Button onClick={() => checkAnswer(questionId, userAnswers[questionId], correctPercentage)} disabled={!userAnswers[questionId] || answerState === 'correct'} size="sm" variant={answerState === 'correct' ? 'default' : 'outline'} className={`h-7 w-7 p-0 text-xs ${answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                      {answerState === 'correct' ? '✅' : '✓'}
                    </Button>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </div>
    </Card>;
  const renderPhase4 = () => {
    // Get mammals percentage for the example
    const mammalsPercentage = totalAnimals > 0 ? Math.round(collectedData.mammals / totalAnimals * 100) : 0;
    const mammalsDecimal = mammalsPercentage / 100;
    return <Card className="p-3 border border-blue-200 bg-blue-50">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          <h3 className="text-base font-bold text-blue-800">Percentage → Decimal 🔢</h3>
        </div>
        
        <div className="space-y-3">
          {/* Visual Example */}
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <h4 className="text-sm font-bold mb-2 text-blue-700">📚 Example: Mammals</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <AnimalVisual count={collectedData.mammals} emoji="🐘" total={totalAnimals} name="Mammals" showPercentages={true} />
              <div className="space-y-2">
                <VisualCalculator operation="divide" values={[mammalsPercentage, "100"]} result={mammalsDecimal.toFixed(2)} color="blue" />
              </div>
            </div>
          </div>

          {/* Interactive Practice */}
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <h4 className="text-sm font-bold mb-2 text-blue-700">✏️ Your Turn</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {Object.entries(collectedData).filter(([type]) => type !== 'mammals').map(([type, count]) => {
              const config = animalConfig[type as keyof typeof animalConfig];
              const percentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
              const correctDecimal = percentage / 100;
              const questionId = `phase4-${type}`;
              const answerState = answerStates[questionId] || 'unanswered';
              const isShaking = shakingQuestions[questionId] || false;
              return <div key={type} className={`bg-gray-50 p-2 rounded-lg space-y-2 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-lg">{config.emoji}</span>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold">{config.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">{percentage}% → ? decimal</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Input type="number" step="0.01" placeholder="0,00" value={userAnswers[questionId] || ''} onChange={e => setUserAnswers(prev => ({
                    ...prev,
                    [questionId]: e.target.value
                  }))} className={`flex-1 text-sm h-7 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} disabled={answerState === 'correct'} />
                        <Button onClick={() => checkAnswer(questionId, userAnswers[questionId], correctDecimal)} disabled={!userAnswers[questionId] || answerState === 'correct'} size="sm" variant={answerState === 'correct' ? 'default' : 'outline'} className={`h-7 w-7 p-0 text-xs ${answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                          {answerState === 'correct' ? '✅' : '✓'}
                        </Button>
                      </div>
                    </div>;
            })}
            </div>
          </div>
        </div>
      </Card>;
  };
  const renderPhase5 = () => <Card className="p-3 border border-purple-200 bg-purple-50">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle className="h-5 w-5 text-purple-600" />
        <h3 className="text-base font-bold text-purple-800">Master 1% 📊</h3>
      </div>
      
      <div className="space-y-3">
        {/* 1% Visual */}
        <div className="bg-white p-3 rounded-lg border border-purple-200">
          <h4 className="text-sm font-bold mb-2 text-purple-700">🔍 Find 1%</h4>
          
          <VisualCalculator operation="divide" values={[totalAnimals, "100"]} result={`${onePercent.toFixed(1)} animals`} color="purple" />
          
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="text-sm px-2 py-1">
              1% = {onePercent.toFixed(1)} animals
            </Badge>
          </div>
        </div>

        {/* Interactive Building */}
        <div className="bg-white p-3 rounded-lg border border-purple-200">
          <h4 className="text-sm font-bold mb-2 text-purple-700">🔧 Build Any %</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {[{
            label: "1%",
            multiplier: 1
          }, {
            label: "3%",
            multiplier: 3
          }, {
            label: "7%",
            multiplier: 7
          }, {
            label: "12%",
            multiplier: 12
          }].map(({
            label,
            multiplier
          }) => {
            const answerKey = `phase5-${multiplier}`;
            const correctAmount = (multiplier * onePercent).toFixed(1);
            const answerState = answerStates[answerKey] || 'unanswered';
            const isShaking = shakingQuestions[answerKey] || false;
            return <div key={label} className={`bg-gray-50 p-2 rounded-lg space-y-2 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Badge variant="outline" className="text-sm px-2 py-1">
                          {label}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {multiplier} × {onePercent.toFixed(1)} = ?
                      </div>
                    </div>
                  <div className="flex gap-1">
                    <Input type="number" step="0.1" placeholder="answer" value={userAnswers[answerKey] || ''} onChange={e => setUserAnswers(prev => ({
                  ...prev,
                  [answerKey]: e.target.value
                }))} className={`flex-1 text-sm h-7 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} disabled={answerState === 'correct'} />
                    <Button onClick={() => checkAnswer(answerKey, userAnswers[answerKey], parseFloat(correctAmount))} disabled={!userAnswers[answerKey] || answerState === 'correct'} size="sm" variant={answerState === 'correct' ? 'default' : 'outline'} className={`h-7 w-7 p-0 text-xs ${answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}`}>
                      {answerState === 'correct' ? '✅' : '✓'}
                    </Button>
                  </div>
                </div>;
          })}
          </div>
        </div>
      </div>
    </Card>;

  const renderPhase6 = () => {
    // Calculate animal percentages for drag and drop
    const animalPercentages = Object.entries(collectedData).map(([type, count]) => ({
      type,
      count,
      percentage: totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0,
      config: animalConfig[type as keyof typeof animalConfig]
    }));

    const dropZones = [
      { id: 'low', label: '0-15%', emoji: '🔻', color: 'from-red-100 to-red-50 border-red-200' },
      { id: 'medium', label: '16-35%', emoji: '📊', color: 'from-yellow-100 to-yellow-50 border-yellow-200' },
      { id: 'high', label: '36-100%', emoji: '📈', color: 'from-green-100 to-green-50 border-green-200' }
    ];

    return (
      <Card className="p-3 border border-orange-200 bg-orange-50">
        <div className="flex items-center gap-2 mb-3">
          <Badge className="h-5 w-5 text-orange-600 bg-orange-100 border-orange-300 text-xs">🎯</Badge>
          <h3 className="text-base font-bold text-orange-800">Analyze Data 📊</h3>
        </div>
        
        <div className="space-y-3">
          {/* Instructions */}
          <div className="bg-white p-3 rounded-lg border border-orange-200">
            <h4 className="text-sm font-bold mb-2 text-orange-700">🎮 Drag & Drop Challenge</h4>
            <div className="text-center">
              <Badge variant="outline" className="text-xs px-2 py-1">
                Sort animals by their percentage ranges
              </Badge>
            </div>
          </div>

          {/* Draggable Animals */}
          <div className="bg-white p-3 rounded-lg border border-orange-200">
            <h4 className="text-sm font-bold mb-2 text-orange-700">🐾 Animals to Sort</h4>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {animalPercentages.map(({ type, count, percentage, config }) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  className={`bg-gradient-to-br from-gray-50 to-gray-100 p-2 rounded-lg border border-gray-200 cursor-move hover:shadow-lg transition-all duration-200 text-center ${
                    draggedItem === type ? 'opacity-50 scale-95' : ''
                  } ${
                    Object.values(droppedItems).some(animals => animals.includes(type)) ? 'opacity-30' : ''
                  }`}
                >
                  <div className="text-xl mb-1">{config.emoji}</div>
                  <div className="font-semibold text-xs">{config.name}</div>
                  <div className="text-xs text-muted-foreground">{count}</div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Drop Zones */}
          <div className="bg-white p-3 rounded-lg border border-orange-200">
            <h4 className="text-sm font-bold mb-2 text-orange-700">📋 Percentage Ranges</h4>
            <div className="grid grid-cols-3 gap-2">
              {dropZones.map((zone) => (
                <div
                  key={zone.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`bg-gradient-to-br ${zone.color} p-3 rounded-lg border border-dashed min-h-24 flex flex-col items-center justify-center transition-all duration-300 ${
                    draggedItem ? 'border-opacity-100 bg-opacity-50' : 'border-opacity-30'
                  } ${
                    completedTasks[zone.id] ? 'border-green-500 bg-green-100' : ''
                  }`}
                >
                  <div className="text-lg mb-1">{zone.emoji}</div>
                  <div className="font-bold text-sm mb-1">{zone.label}</div>
                  
                  {/* Show dropped animals */}
                  {droppedItems[zone.id] && droppedItems[zone.id].length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-1 w-full">
                      {droppedItems[zone.id].map((animalType) => (
                        <div key={animalType} className="p-1 bg-white rounded border shadow-sm">
                          <div className="text-sm mb-0.5">
                            {animalConfig[animalType as keyof typeof animalConfig]?.emoji}
                          </div>
                          <div className="text-xs font-semibold">
                            {animalConfig[animalType as keyof typeof animalConfig]?.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {(!droppedItems[zone.id] || droppedItems[zone.id].length === 0) && (
                    <div className="text-xs text-muted-foreground text-center">
                      Drop animals here
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white p-2 rounded-lg border border-orange-200">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold">Progress:</span>
              <Progress value={(Object.values(droppedItems).flat().length / Object.keys(collectedData).length) * 100} className="flex-1 h-1" />
              <span className="text-xs text-muted-foreground">
                {Object.values(droppedItems).flat().length}/{Object.keys(collectedData).length} sorted
              </span>
            </div>
            {Object.values(droppedItems).flat().length === Object.keys(collectedData).length && (
              <div className="text-center mt-1">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 text-xs">
                  🎉 All animals sorted!
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };
  if (totalAnimals === 0) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">🧮 Learn Percentages & Fractions</h2>
          <p className="text-muted-foreground mb-4">
            First, collect some animals to start learning! 
          </p>
          <Button onClick={() => navigate('/')}>
            Go Collect Animals
          </Button>
        </Card>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-2 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Learning Center
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/")}
              className="gap-1 text-xs px-2 py-1"
              size="sm"
            >
              Back to Collection
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium">Progress</span>
            <span className="text-xs text-muted-foreground">
              Phase {currentPhase} of 6
            </span>
          </div>
          <Progress value={((currentPhase - 1) / 6) * 100} className="h-1" />
        </div>

        {/* Current Phase Content */}
        <div className="flex-1 overflow-y-auto">
          {currentPhase === 3 && renderPhase3()}
          {currentPhase === 4 && renderPhase4()}
          {currentPhase === 5 && renderPhase5()}
          {currentPhase === 6 && renderPhase6()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => setCurrentPhase(Math.max(3, currentPhase - 1))} disabled={currentPhase === 3}>
            Previous Phase
          </Button>
          
          {/* Auto-fill button for testing */}
          <Button 
            variant="destructive" 
            size="sm"
            onClick={autoFillAnswers}
            className="bg-red-500 hover:bg-red-600 text-xs"
          >
            🔧 Auto-Fill Answers (Testing)
          </Button>
        </div>
      </div>
      
      <Confetti trigger={showConfetti} />
    </div>;
};
export default Learning;