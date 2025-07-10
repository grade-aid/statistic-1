import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Calculator, Lightbulb, Divide, X, Equal, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/Confetti";
interface AnimalData {
  mammals: number;
  birds: number;
  reptiles: number;
  fish: number;
  insects: number;
}

interface FoodData {
  fruits: number;
  vegetables: number;
  grains: number;
  proteins: number;
  dairy: number;
}

interface Position {
  x: number;
  y: number;
}

interface Hunter {
  id: string;
  position: Position;
  emoji: string;
  direction: 'up' | 'down' | 'left' | 'right';
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

  // Food data functions
  const getFoodData = (): FoodData => {
    const stored = localStorage.getItem("foodData");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { fruits: 0, vegetables: 0, grains: 0, proteins: 0, dairy: 0 };
      }
    }
    return { fruits: 0, vegetables: 0, grains: 0, proteins: 0, dairy: 0 };
  };

  const saveFoodData = (data: FoodData) => {
    localStorage.setItem("foodData", JSON.stringify(data));
  };

  const foodData = getFoodData();
  const totalFood = Object.values(foodData).reduce((sum: number, count: number) => sum + count, 0);

  const foodConfig = {
    fruits: { emoji: '🍎', name: 'Fruits', color: '#ef4444' },
    vegetables: { emoji: '🥕', name: 'Vegetables', color: '#22c55e' },
    grains: { emoji: '🌾', name: 'Grains', color: '#eab308' },
    proteins: { emoji: '🥩', name: 'Proteins', color: '#8b5cf6' },
    dairy: { emoji: '🧀', name: 'Dairy', color: '#06b6d4' }
  };

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
  const [isCollectingFood, setIsCollectingFood] = useState(false);
  const [tempFoodData, setTempFoodData] = useState<FoodData>(foodData);
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

  // Calculate correct answers - ensure numbers are properly typed
  const mammalsPercentage = totalAnimals > 0 ? Math.round(collectedData.mammals / totalAnimals * 100) : 0;
  const onePercent = totalAnimals > 0 ? totalAnimals / 100 : 0;

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
                    <Badge variant="outline" className="text-lg px-4 py-2 mb-2">
                      {label}
                    </Badge>
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

  // Food Collection Game - Similar to animal collection but with food items
  const renderFoodCollectionGame = () => {
    const FOOD_GRID_SIZE = 15;
    const FOOD_CELL_SIZE = 28;
    
    const [foodPlayerPosition, setFoodPlayerPosition] = useState<Position>({ x: 1, y: 1 });
    const [foodItems, setFoodItems] = useState<Array<{id: string; type: keyof FoodData; position: Position; emoji: string}>>([]);
    const [foodHunters, setFoodHunters] = useState<Hunter[]>([]);
    const [foodLives, setFoodLives] = useState(9);
    const [foodWalls, setFoodWalls] = useState<Position[]>([]);
    const [isGameInitialized, setIsGameInitialized] = useState(false);

    const generateFoodWalls = useCallback(() => {
      const newWalls: Position[] = [];
      for (let x = 0; x < FOOD_GRID_SIZE; x++) {
        for (let y = 0; y < FOOD_GRID_SIZE; y++) {
          if (x === 0 || x === FOOD_GRID_SIZE - 1 || y === 0 || y === FOOD_GRID_SIZE - 1) {
            newWalls.push({ x, y });
          } else if (x % 3 === 0 && y % 3 === 0 && Math.random() > 0.5) {
            newWalls.push({ x, y });
          }
        }
      }
      return newWalls;
    }, []);

    const isFoodWall = useCallback((pos: Position) => {
      return foodWalls.some(wall => wall.x === pos.x && wall.y === pos.y);
    }, [foodWalls]);

    const generateFoodItems = useCallback((wallPositions: Position[]) => {
      const newFoodItems: Array<{id: string; type: keyof FoodData; position: Position; emoji: string}> = [];
      const foodTypes = Object.keys(foodConfig) as Array<keyof FoodData>;
      const totalItems = Math.floor(Math.random() * 21) + 20; // 20-40 items
      
      const isWallPosition = (pos: Position) => {
        return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
      };

      for (let i = 0; i < totalItems; i++) {
        const type = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        const config = foodConfig[type];
        let position: Position;
        let attempts = 0;
        
        do {
          position = {
            x: Math.floor(Math.random() * (FOOD_GRID_SIZE - 2)) + 1,
            y: Math.floor(Math.random() * (FOOD_GRID_SIZE - 2)) + 1
          };
          attempts++;
        } while ((
          (position.x === 1 && position.y === 1) || 
          isWallPosition(position) || 
          newFoodItems.some(item => item.position.x === position.x && item.position.y === position.y)
        ) && attempts < 50);

        newFoodItems.push({
          id: `${type}-${i}`,
          type,
          position,
          emoji: config.emoji
        });
      }
      setFoodItems(newFoodItems);
    }, []);

    const generateFoodHunters = useCallback((wallPositions: Position[]) => {
      const newHunters: Hunter[] = [];
      const hunterEmojis = ['🐺', '🦖'];
      
      const isWallPosition = (pos: Position) => {
        return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
      };

      for (let i = 0; i < 2; i++) {
        let position: Position;
        let attempts = 0;
        
        do {
          position = {
            x: Math.floor(Math.random() * (FOOD_GRID_SIZE - 2)) + 1,
            y: Math.floor(Math.random() * (FOOD_GRID_SIZE - 2)) + 1
          };
          attempts++;
        } while ((
          (position.x === 1 && position.y === 1) || 
          isWallPosition(position) || 
          newHunters.some(hunter => hunter.position.x === position.x && hunter.position.y === position.y)
        ) && attempts < 50);

        newHunters.push({
          id: `food-hunter-${i}`,
          position,
          emoji: hunterEmojis[i],
          direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as any
        });
      }
      setFoodHunters(newHunters);
    }, []);

    // Initialize game when component mounts
    useEffect(() => {
      if (!isGameInitialized) {
        const newWalls = generateFoodWalls();
        setFoodWalls(newWalls);
        generateFoodItems(newWalls);
        generateFoodHunters(newWalls);
        setIsGameInitialized(true);
      }
    }, [isGameInitialized, generateFoodWalls, generateFoodItems, generateFoodHunters]);

    const moveFoodPlayer = useCallback((direction: string) => {
      setFoodPlayerPosition(prev => {
        let newX = prev.x;
        let newY = prev.y;
        
        switch (direction) {
          case 'up':
          case 'w':
            newY = Math.max(0, prev.y - 1);
            break;
          case 'down':
          case 's':
            newY = Math.min(FOOD_GRID_SIZE - 1, prev.y + 1);
            break;
          case 'left':
          case 'a':
            newX = Math.max(0, prev.x - 1);
            break;
          case 'right':
          case 'd':
            newX = Math.min(FOOD_GRID_SIZE - 1, prev.x + 1);
            break;
        }
        
        const newPos = { x: newX, y: newY };
        if (isFoodWall(newPos)) {
          return prev;
        }
        return newPos;
      });
    }, [isFoodWall]);

    // Food Hunter movement
    useEffect(() => {
      if (!isGameInitialized || foodHunters.length === 0) return;
      
      const interval = setInterval(() => {
        setFoodHunters(prevHunters => prevHunters.map(hunter => {
          const directions = ['up', 'down', 'left', 'right'] as const;
          let newPosition = { ...hunter.position };
          let newDirection = hunter.direction;

          if (Math.random() < 0.6) {
            const dx = foodPlayerPosition.x - hunter.position.x;
            const dy = foodPlayerPosition.y - hunter.position.y;

            if (Math.abs(dx) > Math.abs(dy)) {
              newDirection = dx > 0 ? 'right' : 'left';
            } else if (dy !== 0) {
              newDirection = dy > 0 ? 'down' : 'up';
            }
          } else {
            newDirection = directions[Math.floor(Math.random() * directions.length)];
          }

          switch (newDirection) {
            case 'up':
              newPosition.y = Math.max(0, hunter.position.y - 1);
              break;
            case 'down':
              newPosition.y = Math.min(FOOD_GRID_SIZE - 1, hunter.position.y + 1);
              break;
            case 'left':
              newPosition.x = Math.max(0, hunter.position.x - 1);
              break;
            case 'right':
              newPosition.x = Math.min(FOOD_GRID_SIZE - 1, hunter.position.x + 1);
              break;
          }

          if (isFoodWall(newPosition)) {
            const altDirections = newDirection === 'up' || newDirection === 'down' ? ['left', 'right'] : ['up', 'down'];
            for (const altDir of altDirections) {
              let altPos = { ...hunter.position };
              switch (altDir) {
                case 'up':
                  altPos.y = Math.max(0, hunter.position.y - 1);
                  break;
                case 'down':
                  altPos.y = Math.min(FOOD_GRID_SIZE - 1, hunter.position.y + 1);
                  break;
                case 'left':
                  altPos.x = Math.max(0, hunter.position.x - 1);
                  break;
                case 'right':
                  altPos.x = Math.min(FOOD_GRID_SIZE - 1, hunter.position.x + 1);
                  break;
              }
              if (!isFoodWall(altPos)) {
                newPosition = altPos;
                newDirection = altDir as any;
                break;
              }
            }

            if (isFoodWall(newPosition)) {
              newPosition = hunter.position;
            }
          }

          return { ...hunter, position: newPosition, direction: newDirection };
        }));
      }, 400);

      return () => clearInterval(interval);
    }, [isGameInitialized, foodHunters.length, isFoodWall, foodPlayerPosition]);

    // Check for hunter collision
    useEffect(() => {
      const hunterAtPosition = foodHunters.find(hunter => 
        hunter.position.x === foodPlayerPosition.x && hunter.position.y === foodPlayerPosition.y
      );
      
      if (hunterAtPosition && isGameInitialized) {
        setFoodLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            // Reset game
            setFoodPlayerPosition({ x: 1, y: 1 });
            setIsGameInitialized(false);
            setFoodLives(9);
            setTempFoodData({ fruits: 0, vegetables: 0, grains: 0, proteins: 0, dairy: 0 });
            toast({
              title: "💀 Game Over!",
              description: "Try again to collect food!",
              duration: 3000
            });
          } else {
            setFoodPlayerPosition({ x: 1, y: 1 });
            toast({
              title: `💔 Hit by ${hunterAtPosition.emoji}!`,
              description: `${newLives} lives remaining`,
              duration: 2000
            });
          }
          return newLives;
        });
      }
    }, [foodPlayerPosition, foodHunters, isGameInitialized, toast]);

    // Handle keyboard input for food game
    useEffect(() => {
      const handleKeyPress = (e: KeyboardEvent) => {
        if (!isCollectingFood) return;
        
        const key = e.key.toLowerCase();
        if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
          e.preventDefault();
          const direction = key.replace('arrow', '');
          moveFoodPlayer(direction);
        }
      };
      
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }, [moveFoodPlayer, isCollectingFood]);

    // Check for food collection
    useEffect(() => {
      const foodAtPosition = foodItems.find(item => 
        item.position.x === foodPlayerPosition.x && item.position.y === foodPlayerPosition.y
      );
      
      if (foodAtPosition) {
        setFoodItems(prev => prev.filter(item => item.id !== foodAtPosition.id));
        setTempFoodData(prev => ({
          ...prev,
          [foodAtPosition.type]: prev[foodAtPosition.type] + 1
        }));
      }
    }, [foodPlayerPosition, foodItems]);

    const totalFoodCollected = Object.values(tempFoodData).reduce((sum, count) => sum + count, 0);

    // Check if game is complete
    useEffect(() => {
      if (totalFoodCollected >= 15 && foodItems.length === 0) {
        setTimeout(() => {
          saveFoodData(tempFoodData);
          setIsCollectingFood(false);
          setCurrentPhase(7);
        }, 1000);
      }
    }, [totalFoodCollected, foodItems.length, tempFoodData]);

    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2">🍎 Collect Food Items</h2>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-2xl">
                    {i < foodLives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <p className="text-xl">
                {totalFoodCollected} food items collected
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="p-4">
                <div 
                  className="relative bg-muted rounded-xl p-4 mx-auto" 
                  style={{
                    width: FOOD_GRID_SIZE * FOOD_CELL_SIZE + 32,
                    height: FOOD_GRID_SIZE * FOOD_CELL_SIZE + 32
                  }}
                >
                  {/* Player */}
                  <div 
                    className="absolute bg-purple-500 rounded-full border-2 border-black transition-all duration-150 flex items-center justify-center text-lg z-10"
                    style={{
                      left: foodPlayerPosition.x * FOOD_CELL_SIZE + 16,
                      top: foodPlayerPosition.y * FOOD_CELL_SIZE + 16,
                      width: FOOD_CELL_SIZE - 2,
                      height: FOOD_CELL_SIZE - 2
                    }}
                  >
                    🐱
                  </div>
                  
                  {/* Walls */}
                  {foodWalls.map((wall, index) => (
                    <div 
                      key={`food-wall-${index}`} 
                      className="absolute bg-blue-600 border border-black"
                      style={{
                        left: wall.x * FOOD_CELL_SIZE + 16,
                        top: wall.y * FOOD_CELL_SIZE + 16,
                        width: FOOD_CELL_SIZE - 2,
                        height: FOOD_CELL_SIZE - 2
                      }}
                    />
                  ))}
                  
                  {/* Food Items */}
                  {foodItems.map(item => (
                    <div 
                      key={item.id} 
                      className="absolute rounded-full border border-black flex items-center justify-center bg-yellow-400"
                      style={{
                        left: item.position.x * FOOD_CELL_SIZE + 16,
                        top: item.position.y * FOOD_CELL_SIZE + 16,
                        width: FOOD_CELL_SIZE - 2,
                        height: FOOD_CELL_SIZE - 2,
                        fontSize: '16px'
                      }}
                    >
                      {item.emoji}
                    </div>
                  ))}
                  
                  {/* Hunters */}
                  {foodHunters.map(hunter => (
                    <div 
                      key={hunter.id} 
                      className="absolute rounded-full border-2 border-red-500 bg-red-600 flex items-center justify-center text-lg transition-all duration-300"
                      style={{
                        left: hunter.position.x * FOOD_CELL_SIZE + 16,
                        top: hunter.position.y * FOOD_CELL_SIZE + 16,
                        width: FOOD_CELL_SIZE - 2,
                        height: FOOD_CELL_SIZE - 2
                      }}
                    >
                      {hunter.emoji}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Use arrow keys or WASD to move • Collect 15+ items to continue
                </p>
              </Card>
            </div>

            <Card className="p-4">
              <h3 className="text-xl font-bold mb-4">Food Collection</h3>
              <div className="space-y-3">
                {Object.entries(foodConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center text-xs border border-black">
                        {config.emoji}
                      </div>
                      <span className="text-sm capitalize">{config.name}</span>
                    </div>
                    <span className="font-bold">
                      {tempFoodData[type as keyof FoodData]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  // Phase 6: Find percentage of a number (using animal data)
  const renderPhase6 = () => {
    const problems = [
      { animal: 'mammals', percentage: 25, emoji: '🐘' },
      { animal: 'birds', percentage: 40, emoji: '🦅' },
      { animal: 'reptiles', percentage: 30, emoji: '🐍' },
      { animal: 'fish', percentage: 20, emoji: '🐟' }
    ];

    return (
      <Card className="p-6 border-2 border-orange-200 bg-orange-50">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-8 w-8 text-orange-600" />
          <h3 className="text-2xl font-bold text-orange-800">Find Percentage of a Number 📊</h3>
        </div>
        
        <div className="space-y-6">
          {/* Example */}
          <div className="bg-white p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-bold mb-4 text-orange-700">📚 Example: 30% of {collectedData.mammals} mammals</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <AnimalVisual count={collectedData.mammals} emoji="🐘" total={totalAnimals} name="Mammals" />
              <div className="space-y-4">
                <VisualCalculator 
                  operation="multiply" 
                  values={["30%", collectedData.mammals]} 
                  result={Math.round(collectedData.mammals * 0.3).toString()} 
                  color="orange" 
                />
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    30% of {collectedData.mammals} = {Math.round(collectedData.mammals * 0.3)} mammals
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Practice */}
          <div className="bg-white p-6 rounded-xl border border-orange-200">
            <h4 className="text-lg font-bold mb-4 text-orange-700">✏️ Your Turn</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {problems.map(({ animal, percentage, emoji }) => {
                const animalCount = collectedData[animal as keyof AnimalData];
                const correctAnswer = Math.round(animalCount * (percentage / 100));
                const questionId = `phase6-${animal}-${percentage}`;
                const answerState = answerStates[questionId] || 'unanswered';
                const isShaking = shakingQuestions[questionId] || false;
                
                return (
                  <div key={questionId} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{emoji}</span>
                      <div>
                        <div className="font-semibold">Find {percentage}% of {animalCount} {animal}</div>
                        <div className="text-sm text-muted-foreground">{percentage}% × {animalCount} = ?</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="answer" 
                        value={userAnswers[questionId] || ''} 
                        onChange={e => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                        className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                        disabled={answerState === 'correct'}
                      />
                      <Button 
                        onClick={() => checkAnswer(questionId, userAnswers[questionId], correctAnswer)}
                        disabled={!userAnswers[questionId] || answerState === 'correct'}
                        size="sm"
                        variant={answerState === 'correct' ? 'default' : 'outline'}
                        className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {answerState === 'correct' ? '✅' : '✓'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    );
  };


  // Food Visual Component
  const FoodVisual = ({ count, emoji, total, name, showPercentages = false }: {
    count: number;
    emoji: string;
    total: number;
    name: string;
    showPercentages?: boolean;
  }) => {
    const percentage = total > 0 ? Math.round(count / total * 100) : 0;
    const dataEntries = Object.entries(foodData);

    return (
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <div className="text-lg font-bold">{name}</div>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full" viewBox="0 0 200 200">
              {(() => {
                let startAngle = 0;
                const radius = 80;
                const centerX = 100;
                const centerY = 100;
                
                return dataEntries.map(([type, foodCount]) => {
                  const foodPercentage = foodCount / total * 100;
                  const angle = foodPercentage / 100 * 360;
                  const endAngle = startAngle + angle;

                  const startAngleRad = startAngle * Math.PI / 180;
                  const endAngleRad = endAngle * Math.PI / 180;

                  const x1 = centerX + radius * Math.cos(startAngleRad);
                  const y1 = centerY + radius * Math.sin(startAngleRad);
                  const x2 = centerX + radius * Math.cos(endAngleRad);
                  const y2 = centerY + radius * Math.sin(endAngleRad);
                  
                  const largeArcFlag = angle > 180 ? 1 : 0;
                  const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');

                  const labelAngle = (startAngle + endAngle) / 2;
                  const labelAngleRad = labelAngle * Math.PI / 180;
                  const labelRadius = radius * 0.7;
                  const labelX = centerX + labelRadius * Math.cos(labelAngleRad);
                  const labelY = centerY + labelRadius * Math.sin(labelAngleRad);
                  
                  const config = foodConfig[type as keyof typeof foodConfig];
                  const slice = (
                    <g key={type}>
                      <path d={pathData} fill={config.color} stroke="white" strokeWidth="4" className="transition-all duration-300" />
                      {foodPercentage > 5 && (
                        <text x={labelX} y={labelY} textAnchor="middle" dy="0.3em" className="text-sm font-bold fill-white" style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}>
                          {showPercentages ? `${Math.round(foodPercentage)}%` : foodCount}
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
        
        <div className="flex flex-wrap gap-2 justify-center mt-3">
          {Object.entries(foodConfig).map(([type, config]) => (
            <div key={type} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: config.color }} />
              <span className="text-xs text-muted-foreground">
                {config.emoji} {config.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Phase 7: Find the whole when knowing the percentage
  const renderPhase7 = () => {
    const problems = [
      { food: 'fruits', known: Math.round(foodData.fruits * 0.3), percentage: 30 },
      { food: 'vegetables', known: Math.round(foodData.vegetables * 0.25), percentage: 25 },
      { food: 'grains', known: Math.round(foodData.grains * 0.4), percentage: 40 }
    ];

    return (
      <Card className="p-6 border-2 border-pink-200 bg-pink-50">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-8 w-8 text-pink-600" />
          <h3 className="text-2xl font-bold text-pink-800">Find the Whole Number 🔍</h3>
        </div>
        
        <div className="space-y-6">
          {/* Example */}
          <div className="bg-white p-6 rounded-xl border border-pink-200">
            <h4 className="text-lg font-bold mb-4 text-pink-700">📚 Example: If 15 is 30% of a number, what's the whole?</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FoodVisual count={foodData.fruits} emoji="🍎" total={totalFood} name="Fruits" />
              <div className="space-y-4">
                <VisualCalculator 
                  operation="divide" 
                  values={["15", "30%"]} 
                  result="50" 
                  color="pink" 
                />
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    15 ÷ 0.30 = 50
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Practice */}
          <div className="bg-white p-6 rounded-xl border border-pink-200">
            <h4 className="text-lg font-bold mb-4 text-pink-700">✏️ Your Turn</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {problems.map(({ food, known, percentage }) => {
                const foodCount = foodData[food as keyof FoodData];
                const correctAnswer = Math.round(known / (percentage / 100));
                const questionId = `phase7-${food}-${percentage}`;
                const answerState = answerStates[questionId] || 'unanswered';
                const isShaking = shakingQuestions[questionId] || false;
                const config = foodConfig[food as keyof typeof foodConfig];
                
                return (
                  <div key={questionId} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <div className="font-semibold">If {known} is {percentage}% of a number, what's the whole?</div>
                        <div className="text-sm text-muted-foreground">{known} ÷ {percentage}% = ?</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="whole number" 
                        value={userAnswers[questionId] || ''} 
                        onChange={e => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                        className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                        disabled={answerState === 'correct'}
                      />
                      <Button 
                        onClick={() => checkAnswer(questionId, userAnswers[questionId], correctAnswer)}
                        disabled={!userAnswers[questionId] || answerState === 'correct'}
                        size="sm"
                        variant={answerState === 'correct' ? 'default' : 'outline'}
                        className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {answerState === 'correct' ? '✅' : '✓'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Phase 8: Find the percentage rate
  const renderPhase8 = () => {
    const problems = [
      { food: 'vegetables', part: foodData.vegetables },
      { food: 'grains', part: foodData.grains },
      { food: 'proteins', part: foodData.proteins },
      { food: 'dairy', part: foodData.dairy }
    ];

    return (
      <Card className="p-6 border-2 border-teal-200 bg-teal-50">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-8 w-8 text-teal-600" />
          <h3 className="text-2xl font-bold text-teal-800">Find the Percentage Rate 📈</h3>
        </div>
        
        <div className="space-y-6">
          {/* Example */}
          <div className="bg-white p-6 rounded-xl border border-teal-200">
            <h4 className="text-lg font-bold mb-4 text-teal-700">📚 Example: What percentage of {totalFood} foods are fruits?</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FoodVisual count={foodData.fruits} emoji="🍎" total={totalFood} name="Fruits" showPercentages={true} />
              <div className="space-y-4">
                <VisualCalculator 
                  operation="percentage" 
                  values={[foodData.fruits, totalFood]} 
                  result={`${Math.round(foodData.fruits / totalFood * 100)}%`} 
                  color="teal" 
                />
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    ({foodData.fruits} ÷ {totalFood}) × 100 = {Math.round(foodData.fruits / totalFood * 100)}%
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Practice */}
          <div className="bg-white p-6 rounded-xl border border-teal-200">
            <h4 className="text-lg font-bold mb-4 text-teal-700">✏️ Your Turn</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {problems.map(({ food, part }) => {
                const correctAnswer = Math.round((part / totalFood) * 100);
                const questionId = `phase8-${food}`;
                const answerState = answerStates[questionId] || 'unanswered';
                const isShaking = shakingQuestions[questionId] || false;
                const config = foodConfig[food as keyof typeof foodConfig];
                
                return (
                  <div key={questionId} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <div className="font-semibold">What % of {totalFood} foods are {food}?</div>
                        <div className="text-sm text-muted-foreground">({part} ÷ {totalFood}) × 100 = ?</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="%" 
                        value={userAnswers[questionId] || ''} 
                        onChange={e => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                        className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                        disabled={answerState === 'correct'}
                      />
                      <Button 
                        onClick={() => checkAnswer(questionId, userAnswers[questionId], correctAnswer)}
                        disabled={!userAnswers[questionId] || answerState === 'correct'}
                        size="sm"
                        variant={answerState === 'correct' ? 'default' : 'outline'}
                        className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {answerState === 'correct' ? '✅' : '✓'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Phase 9: Calculate percentage increase and decrease
  const renderPhase9 = () => {
    const problems = [
      { food: 'fruits', oldValue: foodData.fruits, newValue: Math.round(foodData.fruits * 1.2), type: 'increase' },
      { food: 'vegetables', oldValue: foodData.vegetables, newValue: Math.round(foodData.vegetables * 0.8), type: 'decrease' },
      { food: 'grains', oldValue: foodData.grains, newValue: Math.round(foodData.grains * 1.5), type: 'increase' }
    ];

    return (
      <Card className="p-6 border-2 border-indigo-200 bg-indigo-50">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-8 w-8 text-indigo-600" />
          <h3 className="text-2xl font-bold text-indigo-800">Percentage Change 📊</h3>
        </div>
        
        <div className="space-y-6">
          {/* Example */}
          <div className="bg-white p-6 rounded-xl border border-indigo-200">
            <h4 className="text-lg font-bold mb-4 text-indigo-700">📚 Example: Fruits increased from 10 to 15</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FoodVisual count={foodData.fruits} emoji="🍎" total={totalFood} name="Fruits" />
              <div className="space-y-4">
                <VisualCalculator 
                  operation="percentage" 
                  values={["(15-10)", "10"]} 
                  result="50%" 
                  color="indigo" 
                />
                <div className="text-center">
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    ((15-10) ÷ 10) × 100 = 50% increase
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Practice */}
          <div className="bg-white p-6 rounded-xl border border-indigo-200">
            <h4 className="text-lg font-bold mb-4 text-indigo-700">✏️ Your Turn</h4>
            <div className="grid md:grid-cols-2 gap-4">
              {problems.map(({ food, oldValue, newValue, type }) => {
                const change = newValue - oldValue;
                const correctAnswer = Math.round((change / oldValue) * 100);
                const questionId = `phase9-${food}-${type}`;
                const answerState = answerStates[questionId] || 'unanswered';
                const isShaking = shakingQuestions[questionId] || false;
                const config = foodConfig[food as keyof typeof foodConfig];
                
                return (
                  <div key={questionId} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{config.emoji}</span>
                      <div>
                        <div className="font-semibold">{config.name} changed from {oldValue} to {newValue}</div>
                        <div className="text-sm text-muted-foreground">
                          (({newValue}-{oldValue}) ÷ {oldValue}) × 100 = ?% {type}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="number" 
                        placeholder="% change" 
                        value={userAnswers[questionId] || ''} 
                        onChange={e => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                        className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                        disabled={answerState === 'correct'}
                      />
                      <Button 
                        onClick={() => checkAnswer(questionId, userAnswers[questionId], Math.abs(correctAnswer))}
                        disabled={!userAnswers[questionId] || answerState === 'correct'}
                        size="sm"
                        variant={answerState === 'correct' ? 'default' : 'outline'}
                        className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {answerState === 'correct' ? '✅' : '✓'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Phase 10: Compare percentages
  const renderPhase10 = () => {
    const foodPercentages = Object.entries(foodData).map(([food, count]) => ({
      food,
      count,
      percentage: Math.round((count / totalFood) * 100),
      ...foodConfig[food as keyof typeof foodConfig]
    })).sort((a, b) => b.percentage - a.percentage);

    const comparisons = [
      { question: "Which food type has the highest percentage?", answer: foodPercentages[0].food },
      { question: "Which food type has the lowest percentage?", answer: foodPercentages[foodPercentages.length - 1].food },
      { question: "What's the difference between the highest and lowest percentages?", answer: String(foodPercentages[0].percentage - foodPercentages[foodPercentages.length - 1].percentage) }
    ];

    return (
      <Card className="p-6 border-2 border-violet-200 bg-violet-50">
        <div className="flex items-center gap-3 mb-6">
          <Calculator className="h-8 w-8 text-violet-600" />
          <h3 className="text-2xl font-bold text-violet-800">Compare Percentages 🏆</h3>
        </div>
        
        <div className="space-y-6">
          {/* Visual Comparison */}
          <div className="bg-white p-6 rounded-xl border border-violet-200">
            <h4 className="text-lg font-bold mb-4 text-violet-700">📊 Food Percentage Ranking</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              <FoodVisual count={totalFood} emoji="🍽️" total={totalFood} name="All Foods" showPercentages={true} />
              <div className="space-y-3">
                {foodPercentages.map((item, index) => (
                  <div key={item.food} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{item.percentage}%</Badge>
                      <Badge variant="secondary">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Questions */}
          <div className="bg-white p-6 rounded-xl border border-violet-200">
            <h4 className="text-lg font-bold mb-4 text-violet-700">✏️ Comparison Questions</h4>
            <div className="space-y-4">
              {comparisons.map((comp, index) => {
                const questionId = `phase10-comp-${index}`;
                const answerState = answerStates[questionId] || 'unanswered';
                const isShaking = shakingQuestions[questionId] || false;
                
                return (
                  <div key={questionId} className={`bg-gray-50 p-4 rounded-lg space-y-3 transition-colors duration-300 ${answerState === 'correct' ? 'bg-green-100 border-2 border-green-300' : answerState === 'incorrect' ? 'bg-red-50 border-2 border-red-200' : ''} ${isShaking ? 'animate-shake' : ''}`}>
                    <div className="font-semibold">{comp.question}</div>
                    
                    <div className="flex gap-2">
                      <Input 
                        type="text" 
                        placeholder="answer" 
                        value={userAnswers[questionId] || ''} 
                        onChange={e => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                        className={`flex-1 ${answerState === 'correct' ? 'border-green-500 bg-green-50' : answerState === 'incorrect' ? 'border-red-500 bg-red-50' : ''}`}
                        disabled={answerState === 'correct'}
                      />
                      <Button 
                        onClick={() => {
                          const userAnswer = userAnswers[questionId]?.toLowerCase().trim();
                          const correctAnswer = comp.answer.toLowerCase().trim();
                          const isCorrect = userAnswer === correctAnswer || 
                            (index < 2 && userAnswer === foodConfig[comp.answer as keyof typeof foodConfig]?.name.toLowerCase());
                          
                          if (isCorrect) {
                            setAnswerStates(prev => ({ ...prev, [questionId]: 'correct' }));
                            setShowConfetti(true);
                            setTimeout(() => setShowConfetti(false), 3000);
                          } else {
                            setAnswerStates(prev => ({ ...prev, [questionId]: 'incorrect' }));
                            setShakingQuestions(prev => ({ ...prev, [questionId]: true }));
                            setTimeout(() => setShakingQuestions(prev => ({ ...prev, [questionId]: false })), 500);
                          }
                        }}
                        disabled={!userAnswers[questionId] || answerState === 'correct'}
                        size="sm"
                        variant={answerState === 'correct' ? 'default' : 'outline'}
                        className={answerState === 'correct' ? 'bg-green-600 hover:bg-green-700' : ''}
                      >
                        {answerState === 'correct' ? '✅' : '✓'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
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
        <div className="text-center">
          <Button onClick={() => navigate('/')} variant="outline" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back Home
          </Button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧮 Learn Percentages & Fractions</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Using your {totalAnimals} animals!
          </Badge>
        </div>


        {/* Current Phase Content */}
        {isCollectingFood ? renderFoodCollectionGame() : (
          <>
            {currentPhase === 3 && renderPhase3()}
            {currentPhase === 4 && renderPhase4()}
            {currentPhase === 5 && renderPhase5()}
            {currentPhase === 7 && renderPhase7()}
            {currentPhase === 8 && renderPhase8()}
            {currentPhase === 9 && renderPhase9()}
            {currentPhase === 10 && renderPhase10()}
          </>
        )}

        {/* Navigation */}
        {!isCollectingFood && (
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={() => setCurrentPhase(Math.max(3, currentPhase - 1))} 
              disabled={currentPhase === 3}
            >
              Previous Phase
            </Button>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentPhase}/10</Badge>
            </div>
            <Button 
              onClick={() => {
                if (currentPhase === 5) {
                  setTempFoodData(foodData); // Initialize temp data
                  setIsCollectingFood(true);
                } else if (currentPhase === 6) {
                  // Skip phase 6, go to 7
                  setCurrentPhase(7);
                } else {
                  setCurrentPhase(Math.min(10, currentPhase + 1));
                }
              }}
              disabled={currentPhase === 10}
            >
              {currentPhase === 5 ? 'Collect Food Data' : 'Next Phase'}
            </Button>
          </div>
        )}
      </div>
      <CalculatorModal />
      <Confetti trigger={showConfetti} />
    </div>;
};
export default Learning;