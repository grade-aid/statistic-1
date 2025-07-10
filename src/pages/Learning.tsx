import { useState } from "react";
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

  // Calculator functions
  const handleCalculatorInput = (value: string) => {
    if (value === "C") {
      setCalculatorDisplay("0");
      setCalculatorInput("");
    } else if (value === "=") {
      try {
        const result = eval(calculatorInput);
        setCalculatorDisplay(result.toString());
        setCalculatorInput(result.toString());
      } catch {
        setCalculatorDisplay("Error");
        setCalculatorInput("");
      }
    } else {
      const newInput = calculatorDisplay === "0" || calculatorDisplay === "Error" ? value : calculatorInput + value;
      setCalculatorInput(newInput);
      setCalculatorDisplay(newInput);
    }
  };
  const CalculatorModal = () => {
    const buttons = [["C", "±", "", "÷"], ["7", "8", "9", "×"], ["4", "5", "6", "-"], ["1", "2", "3", "+"], ["0", ".", "="]];
    return <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
        <DialogContent className="w-80">
          <DialogHeader>
            <DialogTitle>Calculator</DialogTitle>
          </DialogHeader>
          <div className="bg-gray-900 text-white p-4 rounded-lg">
            <div className="bg-black p-3 rounded mb-3 text-right text-2xl font-mono">
              {calculatorDisplay}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {buttons.flat().map((btn, idx) => btn === "" ? <div key={idx} className="h-12" /> : <Button key={idx} variant={["C", "±", "÷", "×", "-", "+", "="].includes(btn) ? "secondary" : "outline"} className={`h-12 text-lg font-semibold transition-all duration-150 ease-out focus-visible:ring-0 focus:ring-0 select-none ${btn === "0" ? "col-span-2" : ""} ${["C", "±", "÷", "×", "-", "+", "="].includes(btn) ? "!bg-orange-500 hover:!bg-orange-600 active:!bg-orange-700 active:!scale-95 !text-white" : "!bg-gray-600 hover:!bg-gray-500 active:!bg-gray-700 active:!scale-95 !text-white"}`} onClick={() => {
              let value = btn;
              if (btn === "×") value = "*";
              if (btn === "÷") value = "/";
              handleCalculatorInput(value);
            }}>
                  {btn}
                </Button>)}
            </div>
          </div>
        </DialogContent>
      </Dialog>;
  };
  const totalAnimals = Object.values(collectedData).reduce((sum: number, count: number) => sum + count, 0);
  const animalConfig = {
    mammals: {
      emoji: '🐘',
      name: 'Mammals'
    },
    birds: {
      emoji: '🦅',
      name: 'Birds'
    },
    reptiles: {
      emoji: '🐍',
      name: 'Reptiles'
    },
    fish: {
      emoji: '🐟',
      name: 'Fish'
    },
    insects: {
      emoji: '🐛',
      name: 'Insects'
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
  const [calculatorInput, setCalculatorInput] = useState("");
  const [calculatorDisplay, setCalculatorDisplay] = useState("0");
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  
  // Drag and drop state for Phase 6
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [droppedItems, setDroppedItems] = useState<{[key: string]: string[]}>({
    low: [],
    medium: [],
    high: []
  });
  const [completedTasks, setCompletedTasks] = useState<{[key: string]: boolean}>({});

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
  }) => <div className={`bg-gradient-to-r from-${color}-100 to-${color}-50 p-4 rounded-xl border-2 border-${color}-200`}>
      <div className="text-center mb-3">
        <div className="text-sm font-medium text-muted-foreground mb-1">🐘 Mammals Calculation</div>
      </div>
      <div className="flex items-center justify-center gap-4 text-xl font-bold">
        <Badge variant="outline" className="text-lg px-4 py-2">{values[0]}</Badge>
        <div className={`w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center text-black`}>
          {operation === 'divide' && <Divide size={18} />}
          {operation === 'multiply' && <X size={18} />}
          {operation === 'percentage' && <Divide size={18} />}
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">{values[1]}</Badge>
        {operation === 'percentage' && <>
            <div className={`w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center text-black`}>
              <X size={18} />
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">100</Badge>
          </>}
        <div className={`w-10 h-10 rounded-full bg-${color}-600 flex items-center justify-center text-black`}>
          <Equal size={18} />
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2 bg-orange-600 text-white">
          {result}
        </Badge>
      </div>
      <div className="text-center mt-3">
        
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

    // Animal config for colors
    const animalConfig = {
      mammals: {
        emoji: '🐘',
        color: '#ef4444',
        name: 'Mammals'
      },
      birds: {
        emoji: '🦅',
        color: '#3b82f6',
        name: 'Birds'
      },
      reptiles: {
        emoji: '🐍',
        color: '#22c55e',
        name: 'Reptiles'
      },
      fish: {
        emoji: '🐟',
        color: '#06b6d4',
        name: 'Fish'
      },
      insects: {
        emoji: '🐛',
        color: '#eab308',
        name: 'Insects'
      }
    };
    return <div className="bg-white p-4 rounded-lg border space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <div className="text-lg font-bold">{name}</div>
            
          </div>
        </div>
        
        {/* Mini Pie Chart from Visualization */}
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            {/* Calculator Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 z-10" onClick={() => setIsCalculatorOpen(true)}>
                  <HelpCircle size={14} />
                </Button>
              </DialogTrigger>
            </Dialog>
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
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          {Object.entries(animalConfig).map(([type, config]) => <div key={type} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{
            backgroundColor: config.color
          }} />
              <span className="text-xs text-muted-foreground">
                {config.emoji} {config.name}
              </span>
            </div>)}
        </div>
        
        
      </div>;
  };
  const checkAnswer = (questionId: string, userAnswer: string, correctAnswer: number) => {
    // Use higher tolerance for percentage questions (whole numbers)
    const tolerance = correctAnswer > 10 ? 1.0 : 0.1;
    const isCorrect = Math.abs(parseFloat(userAnswer) - correctAnswer) < tolerance;
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
  const renderPhase3 = () => <Card className="p-6 border-2 border-green-200 bg-green-50">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-8 w-8 text-green-600" />
        <h3 className="text-2xl font-bold text-green-800">Amount → Percentage 🐘</h3>
      </div>
      
      <div className="space-y-6">
        {/* Visual Example */}
        <div className="bg-white p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-bold mb-4 text-green-700">📚 Example: Mammals</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <AnimalVisual count={collectedData.mammals} emoji="🐘" total={totalAnimals} name="Mammals" showPercentages={false} />
            <div className="space-y-4">
              <VisualCalculator operation="percentage" values={[collectedData.mammals, totalAnimals]} result={`${mammalsPercentage}%`} color="green" />
              <div className="text-center">
                
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Practice */}
        <div className="bg-white p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-bold mb-4 text-green-700">✏️ Your Turn</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(collectedData).filter(([type]) => type !== 'mammals').map(([type, count]) => {
            const config = animalConfig[type as keyof typeof animalConfig];
            const correctPercentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
            const questionId = `phase3-${type}`;
            const answerState = answerStates[questionId] || 'unanswered';
            const isShaking = shakingQuestions[questionId] || false;
            return <div key={type} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                  <AnimalVisual count={count} emoji={config.emoji} total={totalAnimals} name={config.name} showPercentages={false} />
                  <div className="flex gap-2">
                    <Input type="number" placeholder="%" value={userAnswers[questionId] || ''} onChange={e => setUserAnswers(prev => ({
                  ...prev,
                  [questionId]: e.target.value
                }))} className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} disabled={answerState === 'correct'} />
                    <Button onClick={() => checkAnswer(questionId, userAnswers[questionId], correctPercentage)} disabled={!userAnswers[questionId] || answerState === 'correct'} size="sm" variant={answerState === 'correct' ? 'default' : 'outline'} className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}>
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
    return <Card className="p-6 border-2 border-blue-200 bg-blue-50">
        <div className="flex items-center gap-3 mb-6">
          <Lightbulb className="h-8 w-8 text-blue-600" />
          <h3 className="text-2xl font-bold text-blue-800">Percentage → Decimal 🔢</h3>
        </div>
        
        <div className="space-y-6">
          {/* Visual Example */}
          <div className="bg-white p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-bold mb-4 text-blue-700">📚 Example: Mammals</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <AnimalVisual count={collectedData.mammals} emoji="🐘" total={totalAnimals} name="Mammals" showPercentages={true} />
              <div className="space-y-4">
                <VisualCalculator operation="divide" values={[mammalsPercentage, "100"]} result={mammalsDecimal.toFixed(2)} color="blue" />
                
              </div>
            </div>
          </div>

          {/* Interactive Practice */}
          <div className="bg-white p-6 rounded-xl border border-blue-200">
            <h4 className="text-lg font-bold mb-4 text-blue-700">✏️ Your Turn</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(collectedData).filter(([type]) => type !== 'mammals').map(([type, count]) => {
              const config = animalConfig[type as keyof typeof animalConfig];
              const percentage = totalAnimals > 0 ? Math.round(count / totalAnimals * 100) : 0;
              const correctDecimal = percentage / 100;
              const questionId = `phase4-${type}`;
              const answerState = answerStates[questionId] || 'unanswered';
              const isShaking = shakingQuestions[questionId] || false;
              return <div key={type} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{config.emoji}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{config.name}</span>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="w-6 h-6 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsCalculatorOpen(true)}>
                                  <HelpCircle size={14} />
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          </div>
                          <div className="text-sm text-muted-foreground">{percentage}% → ? decimal</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Input type="number" step="0.01" placeholder="0,00" value={userAnswers[questionId] || ''} onChange={e => setUserAnswers(prev => ({
                    ...prev,
                    [questionId]: e.target.value
                  }))} className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} disabled={answerState === 'correct'} />
                        <Button onClick={() => checkAnswer(questionId, userAnswers[questionId], correctDecimal)} disabled={!userAnswers[questionId] || answerState === 'correct'} size="sm" variant={answerState === 'correct' ? 'default' : 'outline'} className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}>
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
  const renderPhase5 = () => <Card className="p-6 border-2 border-purple-200 bg-purple-50">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="h-8 w-8 text-purple-600" />
        <h3 className="text-2xl font-bold text-purple-800">Master 1% 📊</h3>
      </div>
      
      <div className="space-y-6">
        {/* 1% Visual */}
        <div className="bg-white p-6 rounded-xl border border-purple-200">
          <h4 className="text-lg font-bold mb-4 text-purple-700">🔍 Find 1%</h4>
          
          <VisualCalculator operation="divide" values={[totalAnimals, "100"]} result={`${onePercent.toFixed(1)} animals`} color="purple" />
          
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              1% = {onePercent.toFixed(1)} animals
            </Badge>
          </div>
        </div>

        {/* Interactive Building */}
        <div className="bg-white p-6 rounded-xl border border-purple-200">
          <h4 className="text-lg font-bold mb-4 text-purple-700">🔧 Build Any %</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
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
            return <div key={label} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Badge variant="outline" className="text-lg px-4 py-2">
                          {label}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-6 h-6 p-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90" 
                              onClick={() => setIsCalculatorOpen(true)}
                            >
                              <Calculator size={14} />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {multiplier} × {onePercent.toFixed(1)} = ?
                      </div>
                    </div>
                  <div className="flex gap-2">
                    <Input type="number" step="0.1" placeholder="answer" value={userAnswers[answerKey] || ''} onChange={e => setUserAnswers(prev => ({
                  ...prev,
                  [answerKey]: e.target.value
                }))} className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`} disabled={answerState === 'correct'} />
                    <Button onClick={() => checkAnswer(answerKey, userAnswers[answerKey], parseFloat(correctAmount))} disabled={!userAnswers[answerKey] || answerState === 'correct'} size="sm" variant={answerState === 'correct' ? 'default' : 'outline'} className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}>
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
      <Card className="p-6 border-2 border-orange-200 bg-orange-50">
        <div className="flex items-center gap-3 mb-6">
          <Badge className="h-8 w-8 text-orange-600 bg-orange-100 border-orange-300">🎯</Badge>
          <h3 className="text-2xl font-bold text-orange-800">Analyze Data 📊</h3>
        </div>
        
        <div className="space-y-6">
          {/* Instructions */}
          <div className="bg-white p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-bold mb-4 text-orange-700">🎮 Drag & Drop Challenge</h4>
            <div className="text-center mb-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                Sort animals by their percentage ranges
              </Badge>
            </div>
          </div>

          {/* Draggable Animals */}
          <div className="bg-white p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-bold mb-4 text-orange-700">🐾 Animals to Sort</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {animalPercentages.map(({ type, count, percentage, config }) => (
                <div
                  key={type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, type)}
                  className={`bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border-2 border-gray-200 cursor-move hover:shadow-lg transition-all duration-200 text-center ${
                    draggedItem === type ? 'opacity-50 scale-95' : ''
                  } ${
                    Object.values(droppedItems).some(animals => animals.includes(type)) ? 'opacity-30' : ''
                  }`}
                >
                  <div className="text-3xl mb-2">{config.emoji}</div>
                  <div className="font-semibold text-sm">{config.name}</div>
                  <div className="text-xs text-muted-foreground">{count} animals</div>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {percentage}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Drop Zones */}
          <div className="bg-white p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-bold mb-4 text-orange-700">📋 Percentage Ranges</h4>
            <div className="grid md:grid-cols-3 gap-4">
              {dropZones.map((zone) => (
                <div
                  key={zone.id}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, zone.id)}
                  className={`bg-gradient-to-br ${zone.color} p-6 rounded-lg border-2 border-dashed min-h-32 flex flex-col items-center justify-center transition-all duration-300 ${
                    draggedItem ? 'border-opacity-100 bg-opacity-50' : 'border-opacity-30'
                  } ${
                    completedTasks[zone.id] ? 'border-green-500 bg-green-100' : ''
                  }`}
                >
                  <div className="text-2xl mb-2">{zone.emoji}</div>
                  <div className="font-bold text-lg mb-1">{zone.label}</div>
                  
                  {/* Show dropped animals */}
                  {droppedItems[zone.id] && droppedItems[zone.id].length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2 w-full">
                      {droppedItems[zone.id].map((animalType) => (
                        <div key={animalType} className="p-2 bg-white rounded-lg border shadow-sm">
                          <div className="text-xl mb-1">
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
                    <div className="text-sm text-muted-foreground text-center">
                      Drop animals here
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white p-4 rounded-xl border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold">Progress:</span>
              <Progress value={(Object.values(droppedItems).flat().length / Object.keys(collectedData).length) * 100} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {Object.values(droppedItems).flat().length}/{Object.keys(collectedData).length} animals sorted
              </span>
            </div>
            {Object.values(droppedItems).flat().length === Object.keys(collectedData).length && (
              <div className="text-center mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">
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
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        
        <Badge variant="outline" className="text-lg px-4 py-2">
          Using your {totalAnimals} animals!
        </Badge>


        {/* Current Phase Content */}
        {currentPhase === 3 && renderPhase3()}
        {currentPhase === 4 && renderPhase4()}
        {currentPhase === 5 && renderPhase5()}
        {currentPhase === 6 && renderPhase6()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setCurrentPhase(Math.max(3, currentPhase - 1))} disabled={currentPhase === 3}>
            Previous Phase
          </Button>
          <Button onClick={() => setCurrentPhase(Math.min(6, currentPhase + 1))} disabled={currentPhase === 6}>
            Next Phase
          </Button>
        </div>
      </div>
      <CalculatorModal />
      <Confetti trigger={showConfetti} />
    </div>;
};
export default Learning;