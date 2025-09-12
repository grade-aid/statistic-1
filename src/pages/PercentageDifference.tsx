import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ArrowRight, ShoppingCart, MapPin } from "lucide-react";
import Confetti from "@/components/Confetti";

// Game phases
type GamePhase = 'start' | 'intro' | 'collection' | 'learning' | 'complete';

// Game state for collected price data
interface GameState {
  collectedPrices: Record<string, { oldPrice: number; newPrice: number; store: string; }>;
}

// Player and item interfaces
interface Player {
  x: number;
  y: number;
}

interface PriceItem {
  x: number;
  y: number;
  emoji: string;
  type: string;
  oldPrice: number;
  newPrice: number;
  store: string;
  collected: boolean;
}

interface StoreArea {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  color: string;
}

// Learning exercise interface
interface PriceExercise {
  id: string;
  item: string;
  emoji: string;
  oldPrice: number;
  newPrice: number;
  store: string;
  correctAnswer: number;
  isIncrease: boolean;
}

const PercentageDifference = () => {
  const navigate = useNavigate();

  // Game state
  const [phase, setPhase] = useState<GamePhase>('start');
  const [player, setPlayer] = useState<Player>({ x: 10, y: 15 });
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [storeAreas, setStoreAreas] = useState<StoreArea[]>([]);
  const [gameState, setGameState] = useState<GameState>({ collectedPrices: {} });
  const [collectedCount, setCollectedCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  // Learning phase state
  const [exercises, setExercises] = useState<PriceExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showAnswerDialog, setShowAnswerDialog] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);

  // Intro animation
  const [introStep, setIntroStep] = useState(0);

  // Grid dimensions
  const GRID_WIDTH = 20;
  const GRID_HEIGHT = 20;
  const TARGET_ITEMS = 9;

  // Item configuration
  const itemConfig = {
    phone: { emoji: '📱', name: 'Phone' },
    laptop: { emoji: '💻', name: 'Laptop' },
    headphones: { emoji: '🎧', name: 'Headphones' },
    watch: { emoji: '⌚', name: 'Watch' },
    camera: { emoji: '📷', name: 'Camera' },
    tablet: { emoji: '📱', name: 'Tablet' },
    speaker: { emoji: '🔊', name: 'Speaker' },
    mouse: { emoji: '🖱️', name: 'Mouse' },
    keyboard: { emoji: '⌨️', name: 'Keyboard' }
  };

  // Store areas configuration
  const generateStoreAreas = (): StoreArea[] => [
    { x: 1, y: 1, width: 8, height: 8, name: 'TechMart', color: 'bg-blue-200' },
    { x: 11, y: 1, width: 8, height: 8, name: 'ElectroShop', color: 'bg-green-200' },
    { x: 1, y: 11, width: 8, height: 8, name: 'GadgetStore', color: 'bg-purple-200' },
    { x: 11, y: 11, width: 8, height: 8, name: 'TechHub', color: 'bg-orange-200' }
  ];

  // Generate price items for collection
  const generatePriceItems = (): PriceItem[] => {
    const items: PriceItem[] = [];
    const itemTypes = Object.keys(itemConfig);
    const stores = generateStoreAreas();
    
    let itemIndex = 0;
    for (let i = 0; i < TARGET_ITEMS && itemIndex < itemTypes.length; i++) {
      const itemType = itemTypes[itemIndex % itemTypes.length];
      const store = stores[Math.floor(i / 3)];
      
      // Generate realistic price changes
      const basePrice = 100 + Math.floor(Math.random() * 900);
      const priceChange = 0.1 + Math.random() * 0.4; // 10-50% change
      const isIncrease = Math.random() > 0.5;
      
      const oldPrice = isIncrease ? basePrice : Math.round(basePrice * (1 + priceChange));
      const newPrice = isIncrease ? Math.round(basePrice * (1 + priceChange)) : basePrice;
      
      // Place item randomly within store area
      const x = store.x + 1 + Math.floor(Math.random() * (store.width - 2));
      const y = store.y + 1 + Math.floor(Math.random() * (store.height - 2));
      
      items.push({
        x,
        y,
        emoji: itemConfig[itemType as keyof typeof itemConfig].emoji,
        type: itemType,
        oldPrice,
        newPrice,
        store: store.name,
        collected: false
      });
      
      if ((i + 1) % 3 === 0) itemIndex++;
    }
    
    return items;
  };

  // Generate exercises from collected data
  const generateExercises = (collectedData: GameState): PriceExercise[] => {
    const exercises: PriceExercise[] = [];
    let id = 1;
    
    Object.entries(collectedData.collectedPrices).forEach(([itemType, data]) => {
      const config = itemConfig[itemType as keyof typeof itemConfig];
      const isIncrease = data.newPrice > data.oldPrice;
      const percentageChange = Math.round(
        Math.abs(data.newPrice - data.oldPrice) / (isIncrease ? data.oldPrice : data.newPrice) * 100
      );
      
      exercises.push({
        id: id.toString(),
        item: config.name,
        emoji: config.emoji,
        oldPrice: data.oldPrice,
        newPrice: data.newPrice,
        store: data.store,
        correctAnswer: percentageChange,
        isIncrease
      });
      id++;
    });
    
    return exercises.slice(0, 3); // Take first 3 exercises
  };

  // Start the game
  const startGame = () => {
    const stores = generateStoreAreas();
    const items = generatePriceItems();
    
    setStoreAreas(stores);
    setPriceItems(items);
    setPlayer({ x: 10, y: 15 });
    setCollectedCount(0);
    setGameState({ collectedPrices: {} });
    setPhase('intro');
  };

  // Intro animation sequence
  useEffect(() => {
    if (phase === 'intro') {
      const timers = [
        setTimeout(() => setIntroStep(1), 1000),
        setTimeout(() => setIntroStep(2), 3000),
        setTimeout(() => setIntroStep(3), 5000),
        setTimeout(() => {
          setPhase('collection');
          setIntroStep(0);
        }, 7000)
      ];
      
      return () => timers.forEach(clearTimeout);
    }
  }, [phase]);

  // Player movement
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phase !== 'collection') return;
    
    setPlayer(prev => ({
      x: Math.max(0, Math.min(GRID_WIDTH - 1, prev.x + dx)),
      y: Math.max(0, Math.min(GRID_HEIGHT - 1, prev.y + dy))
    }));
  }, [phase]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch(e.key) {
        case 'ArrowUp': movePlayer(0, -1); break;
        case 'ArrowDown': movePlayer(0, 1); break;
        case 'ArrowLeft': movePlayer(-1, 0); break;
        case 'ArrowRight': movePlayer(1, 0); break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer]);

  // Check for item collection
  useEffect(() => {
    if (phase !== 'collection') return;
    
    const itemToCollect = priceItems.find(item => 
      item.x === player.x && item.y === player.y && !item.collected
    );
    
    if (itemToCollect) {
      setPriceItems(prev => prev.map(item => 
        item === itemToCollect ? { ...item, collected: true } : item
      ));
      
      setGameState(prev => ({
        collectedPrices: {
          ...prev.collectedPrices,
          [itemToCollect.type]: {
            oldPrice: itemToCollect.oldPrice,
            newPrice: itemToCollect.newPrice,
            store: itemToCollect.store
          }
        }
      }));
      
      setCollectedCount(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
  }, [player, priceItems, phase]);

  // Transition to learning phase
  useEffect(() => {
    if (collectedCount >= TARGET_ITEMS && phase === 'collection') {
      const generatedExercises = generateExercises(gameState);
      setExercises(generatedExercises);
      setPhase('learning');
      
      // Store in localStorage for visualization page
      localStorage.setItem('priceComparisonData', JSON.stringify(gameState));
    }
  }, [collectedCount, gameState, phase]);

  // Handle exercise answer submission
  const handleAnswerSubmit = (answer: number) => {
    if (showAnswer) return;
    
    setSelectedAnswer(answer);
    setShowAnswerDialog(true);
    
    const currentExercise = exercises[currentExerciseIndex];
    if (answer === currentExercise.correctAnswer) {
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  // Move to next exercise
  const handleNext = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswerDialog(false);
    } else {
      setPhase('complete');
    }
  };

  // Auto-complete for testing
  const autoComplete = () => {
    const remaining = priceItems.filter(item => !item.collected);
    remaining.forEach(item => {
      setGameState(prev => ({
        collectedPrices: {
          ...prev.collectedPrices,
          [item.type]: {
            oldPrice: item.oldPrice,
            newPrice: item.newPrice,
            store: item.store
          }
        }
      }));
    });
    setCollectedCount(TARGET_ITEMS);
  };

  // Render grid cell
  const renderGridCell = (x: number, y: number) => {
    const isPlayer = player.x === x && player.y === y;
    const item = priceItems.find(item => item.x === x && item.y === y && !item.collected);
    const store = storeAreas.find(store => 
      x >= store.x && x < store.x + store.width && 
      y >= store.y && y < store.y + store.height
    );
    
    let cellClass = "w-6 h-6 border border-gray-200 flex items-center justify-center text-xs relative ";
    
    if (store) {
      cellClass += store.color + " ";
    } else {
      cellClass += "bg-gray-100 ";
    }
    
    return (
      <div key={`${x}-${y}`} className={cellClass}>
        {isPlayer && <div className="text-lg">🛒</div>}
        {item && !isPlayer && (
          <div className="text-sm animate-bounce">{item.emoji}</div>
        )}
      </div>
    );
  };

  // Render start phase
  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 flex items-center justify-center">
        <Card className="game-card max-w-2xl mx-auto text-center">
          <div className="space-y-6">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-4xl font-bold mb-4">Price Comparison Adventure!</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Visit different stores and collect items with different prices
            </p>
            <Button 
              onClick={startGame}
              className="game-button text-xl px-8 py-4"
            >
              Start Shopping! <ShoppingCart className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render intro animation
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 flex items-center justify-center">
        <Card className="game-card max-w-4xl mx-auto text-center">
          <div className="space-y-8">
            <div className={`transition-all duration-1000 ${introStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-3xl font-bold mb-4">Visit Different Stores</h2>
            </div>
            
            <div className={`transition-all duration-1000 ${introStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="bg-blue-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-bold">TechMart</div>
                  <div className="text-sm">$800</div>
                </div>
                <div className="bg-green-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-bold">ElectroShop</div>
                  <div className="text-sm">$1000</div>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 ${introStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="text-xl text-muted-foreground">
                Compare prices and learn percentage differences! 📊
              </div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Render collection phase
  if (phase === 'collection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <Card className="game-card mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ShoppingCart className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Price Collection</h1>
                  <p className="text-muted-foreground">Use arrow keys to move 🛒</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-bold">{collectedCount}/{TARGET_ITEMS}</div>
                  <div className="text-sm text-muted-foreground">Items Collected</div>
                </div>
                <Button onClick={autoComplete} size="sm" variant="outline">
                  Auto Complete
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Game Grid */}
            <div className="lg:col-span-2">
              <Card className="game-card">
                <div className="grid grid-cols-20 gap-0 w-full max-w-3xl mx-auto">
                  {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                    Array.from({ length: GRID_WIDTH }, (_, x) => renderGridCell(x, y))
                  )}
                </div>
                
                {/* Store Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {storeAreas.map(store => (
                    <div key={store.name} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${store.color}`}></div>
                      <span className="text-sm font-medium">{store.name}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Collection Progress */}
            <div className="space-y-4">
              <Card className="game-card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Collected Items
                </h3>
                <div className="space-y-3">
                  {Object.entries(gameState.collectedPrices).map(([itemType, data]) => {
                    const config = itemConfig[itemType as keyof typeof itemConfig];
                    return (
                      <div key={itemType} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className="text-xl">{config.emoji}</div>
                          <div className="flex-1">
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-muted-foreground">{data.store}</div>
                            <div className="flex gap-2 text-sm">
                              <span className="text-red-600">${data.oldPrice}</span>
                              <span>→</span>
                              <span className="text-green-600">${data.newPrice}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4">
                  <Progress value={(collectedCount / TARGET_ITEMS) * 100} />
                </div>
              </Card>
            </div>
          </div>
        </div>
        
        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  // Render learning phase
  if (phase === 'learning') {
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return null;

    // Generate answer options
    const correctAnswer = currentExercise.correctAnswer;
    const options = [
      correctAnswer,
      correctAnswer + Math.floor(Math.random() * 10) + 5,
      correctAnswer - Math.floor(Math.random() * 10) - 5,
      correctAnswer + Math.floor(Math.random() * 15) - 7
    ].filter(opt => opt > 0 && opt <= 100).slice(0, 4);
    
    // Shuffle options
    const shuffledOptions = [...options].sort(() => Math.random() - 0.5);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="game-card mb-6 text-center">
            <h1 className="text-3xl font-bold mb-2">Price Comparison Challenge</h1>
            <Progress value={((currentExerciseIndex + 1) / exercises.length) * 100} className="max-w-md mx-auto" />
            <p className="text-muted-foreground mt-2">
              Question {currentExerciseIndex + 1} of {exercises.length}
            </p>
          </Card>

          {/* Exercise */}
          <Card className="game-card text-center">
            <div className="space-y-6">
              <div className="text-6xl">{currentExercise.emoji}</div>
              <h2 className="text-2xl font-bold">{currentExercise.item}</h2>
              <p className="text-lg text-muted-foreground">at {currentExercise.store}</p>
              
              {/* Visual Price Comparison */}
              <div className="bg-white p-6 rounded-lg border max-w-md mx-auto">
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div 
                      className="bg-red-400 w-16 mx-auto mb-2 transition-all duration-1000"
                      style={{ height: `${(currentExercise.oldPrice / Math.max(currentExercise.oldPrice, currentExercise.newPrice)) * 100}px` }}
                    ></div>
                    <div className="font-bold">${currentExercise.oldPrice}</div>
                    <div className="text-sm text-muted-foreground">Before</div>
                  </div>
                  
                  <div className="text-2xl">→</div>
                  
                  <div className="text-center">
                    <div 
                      className="bg-green-400 w-16 mx-auto mb-2 transition-all duration-1000"
                      style={{ height: `${(currentExercise.newPrice / Math.max(currentExercise.oldPrice, currentExercise.newPrice)) * 100}px` }}
                    ></div>
                    <div className="font-bold">${currentExercise.newPrice}</div>
                    <div className="text-sm text-muted-foreground">After</div>
                  </div>
                </div>
              </div>

              <div className="text-xl font-bold">
                What is the percentage {currentExercise.isIncrease ? 'increase' : 'decrease'}?
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {shuffledOptions.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={showAnswerDialog}
                    className={`h-16 text-xl ${
                      showAnswerDialog && option === currentExercise.correctAnswer
                        ? 'bg-green-600 text-white'
                        : showAnswerDialog && option === selectedAnswer && option !== currentExercise.correctAnswer
                        ? 'bg-red-600 text-white'
                        : ''
                    }`}
                    variant={showAnswerDialog && option === currentExercise.correctAnswer ? 'default' : 'outline'}
                  >
                    {option}%
                  </Button>
                ))}
              </div>

              {/* Answer Explanation Dialog */}
              <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-center">
                      {selectedAnswer === currentExercise.correctAnswer ? '🎉 Correct!' : '❌ Incorrect'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {/* Calculation Steps */}
                  <div className="bg-white p-4 rounded-lg border mb-4">
                    <div className="text-lg font-bold text-center mb-3">📊 How to Calculate:</div>
                    
                    {/* Step 1: Find the difference */}
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700">1️⃣ Find the difference:</div>
                      <div className="bg-blue-50 p-2 rounded text-center">
                        <span className="font-mono">
                          ${currentExercise.newPrice} - ${currentExercise.oldPrice} = ${Math.abs(currentExercise.newPrice - currentExercise.oldPrice)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Step 2: Divide by original */}
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700">2️⃣ Divide by {currentExercise.isIncrease ? 'original' : 'new'} price:</div>
                      <div className="bg-purple-50 p-2 rounded text-center">
                        <span className="font-mono">
                          ${Math.abs(currentExercise.newPrice - currentExercise.oldPrice)} ÷ ${currentExercise.isIncrease ? currentExercise.oldPrice : currentExercise.newPrice} = {((Math.abs(currentExercise.newPrice - currentExercise.oldPrice) / (currentExercise.isIncrease ? currentExercise.oldPrice : currentExercise.newPrice))).toFixed(3)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Step 3: Multiply by 100 */}
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700">3️⃣ Multiply by 100:</div>
                      <div className="bg-green-50 p-2 rounded text-center">
                        <span className="font-mono">
                          {((Math.abs(currentExercise.newPrice - currentExercise.oldPrice) / (currentExercise.isIncrease ? currentExercise.oldPrice : currentExercise.newPrice))).toFixed(3)} × 100 = 
                          {selectedAnswer === currentExercise.correctAnswer ? (
                            <span className="font-bold text-green-600"> {currentExercise.correctAnswer}%</span>
                          ) : (
                            <span className="font-bold text-orange-600"> ?%</span>
                          )}
                        </span>
                      </div>
                    </div>
                    
                    {/* Visual Formula */}
                    <div className="mt-4 pt-3 border-t">
                      <div className="text-xs text-gray-600 text-center">
                        💡 Formula: (Difference ÷ {currentExercise.isIncrease ? 'Original' : 'New'}) × 100
                      </div>
                    </div>
                  </div>
                  
                  {selectedAnswer === currentExercise.correctAnswer ? (
                    <div className="text-green-600 font-bold text-center mb-4">
                      Answer: {currentExercise.correctAnswer}% {currentExercise.isIncrease ? 'increase' : 'decrease'}
                    </div>
                  ) : (
                    <div className="text-orange-600 font-bold text-center mb-4">
                      Try to calculate the final percentage yourself!<br/>
                      <span className="text-sm">Correct answer: {currentExercise.correctAnswer}% {currentExercise.isIncrease ? 'increase' : 'decrease'}</span>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleNext}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {currentExerciseIndex < exercises.length - 1 ? 'Next Question' : 'Complete'} 
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>
        
        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  // Render complete phase
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4 flex items-center justify-center">
      <Card className="game-card max-w-2xl mx-auto text-center">
        <div className="space-y-6">
          <div className="text-6xl">🎊</div>
          <h1 className="text-4xl font-bold text-green-700">Shopping Complete!</h1>
          <p className="text-xl text-muted-foreground">
            You've mastered price comparisons and percentage differences!
          </p>
          <Button 
            onClick={() => navigate('/percentage-visualization')}
            className="game-button bg-green-600 hover:bg-green-700"
          >
            View Your Results <ArrowRight className="w-6 h-6 ml-2" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PercentageDifference;