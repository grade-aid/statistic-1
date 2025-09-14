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
  const [canTryAgain, setCanTryAgain] = useState(true);
  const [currentStep, setCurrentStep] = useState(0); // 0: intro, 1: step1, 2: step2, 3: step3, 4: formula

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
    setCurrentStep(0); // Reset to first step when opening dialog
    
    const currentExercise = exercises[currentExerciseIndex];
    if (answer === currentExercise.correctAnswer) {
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
      setCanTryAgain(false);
      // Show answer as correct but don't auto-advance
      setShowAnswer(true);
    } else {
      setCanTryAgain(false);
      setShowAnswerDialog(true); // Only show dialog for incorrect answers
    }
  };

  // Move to next exercise
  const handleNext = () => {
    setShowAnswer(false); // Reset answer state
    if (currentExerciseIndex < 2) { // Limit to 3 questions (indexes 0, 1, 2)
      setCurrentExerciseIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswerDialog(false);
      setCurrentStep(0); // Reset step state for next question
      setCanTryAgain(true);
    } else {
      setPhase('complete'); // Finish after question 3
    }
  };

  // Try again function
  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowAnswerDialog(false);
    setCurrentStep(0);
    setCanTryAgain(true);
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
    
    let cellClass = "border border-gray-200 flex items-center justify-center text-xs relative ";
    
    if (store) {
      cellClass += store.color + " ";
    } else {
      cellClass += "bg-gray-100 ";
    }
    
    return (
      <div key={`${x}-${y}`} className={cellClass} style={{ aspectRatio: '1' }}>
        {isPlayer && <div className="text-sm">🛒</div>}
        {item && !isPlayer && (
          <div className="text-xs animate-bounce">{item.emoji}</div>
        )}
      </div>
    );
  };

  // Render start phase
  if (phase === 'start') {
    return (
      <div className="tablet-container bg-gradient-to-br from-blue-50 to-purple-100 p-2 flex items-center justify-center overflow-hidden">
        <Card className="game-card max-w-lg mx-auto text-center">
          <div className="space-y-3">
            <div className="text-3xl mb-2">🛒</div>
            <h1 className="text-2xl font-bold mb-2">Price Comparison Adventure!</h1>
            <p className="text-sm text-muted-foreground mb-3">
              Visit different stores and collect items with different prices
            </p>
            <Button 
              onClick={startGame}
              className="game-button"
            >
              Start Shopping! <ShoppingCart className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Render intro animation
  if (phase === 'intro') {
    return (
      <div className="tablet-container bg-gradient-to-br from-blue-50 to-purple-100 p-2 flex items-center justify-center overflow-hidden">
        <Card className="game-card max-w-2xl mx-auto text-center">
          <div className="space-y-4">
            <div className={`transition-all duration-1000 ${introStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="text-3xl mb-2">🏪</div>
              <h2 className="text-xl font-bold mb-2">Visit Different Stores</h2>
            </div>
            
            <div className={`transition-all duration-1000 ${introStep >= 2 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                <div className="bg-blue-200 p-2 rounded-lg">
                  <div className="text-lg mb-1">📱</div>
                  <div className="font-bold text-sm">TechMart</div>
                  <div className="text-xs">$800</div>
                </div>
                <div className="bg-green-200 p-2 rounded-lg">
                  <div className="text-lg mb-1">📱</div>
                  <div className="font-bold text-sm">ElectroShop</div>
                  <div className="text-xs">$1000</div>
                </div>
              </div>
            </div>
            
            <div className={`transition-all duration-1000 ${introStep >= 3 ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="text-sm text-muted-foreground">
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
      <div className="tablet-container bg-gradient-to-br from-blue-50 to-purple-100 p-1 overflow-hidden">
        <div className="tablet-content max-w-4xl mx-auto h-full">
          {/* Header */}
          <Card className="game-card mb-1 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <div>
                  <h1 className="text-lg font-bold">Price Collection</h1>
                  <p className="text-xs text-muted-foreground">Use arrow keys to move 🛒</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-lg font-bold">{collectedCount}/{TARGET_ITEMS}</div>
                  <div className="text-xs text-muted-foreground">Items Collected</div>
                </div>
                <Button onClick={autoComplete} size="sm" variant="outline" className="text-xs">
                  Auto Complete
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex gap-2 flex-1 min-h-0 h-full max-h-[calc(100%-80px)] overflow-hidden">
            {/* Game Grid */}
            <div className="flex-1 min-w-0 overflow-hidden">
              <Card className="game-card h-full flex flex-col overflow-hidden">
                <div className="flex-1 min-h-0 flex items-center justify-center p-2">
                  <div className="tablet-game-grid w-full h-full max-w-[500px] max-h-[500px]">
                    <div className="grid grid-cols-20 gap-0 w-full h-full border-2 border-gray-300 rounded-lg overflow-hidden">
                      {Array.from({ length: GRID_HEIGHT }, (_, y) =>
                        Array.from({ length: GRID_WIDTH }, (_, x) => renderGridCell(x, y))
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Store Legend - Fixed at bottom */}
                <div className="flex-shrink-0 mt-2 pt-2 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-1 px-2 pb-2">
                    {storeAreas.map(store => (
                      <div key={store.name} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${store.color} flex-shrink-0`}></div>
                        <span className="text-xs font-medium truncate">{store.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* Collection Progress */}
            <div className="w-64 flex-shrink-0 min-w-0">
              <Card className="game-card h-full flex flex-col overflow-hidden">
                <h3 className="text-sm font-bold mb-2 flex items-center gap-1 flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                  Collected Items
                </h3>
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                  {Object.entries(gameState.collectedPrices).map(([itemType, data]) => {
                    const config = itemConfig[itemType as keyof typeof itemConfig];
                    return (
                      <div key={itemType} className="bg-white p-2 rounded-lg border flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm flex-shrink-0">{config.emoji}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-xs truncate">{config.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{data.store}</div>
                            <div className="flex gap-1 text-xs">
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
                
                <div className="mt-2 flex-shrink-0">
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

  // Generate smart answer options with realistic distractors
  const generateAnswerOptions = (correctAnswer: number, exercise: PriceExercise): number[] => {
    const options = new Set<number>();
    options.add(correctAnswer);
    
    // Smart distractors based on common calculation mistakes
    const { oldPrice, newPrice } = exercise;
    const priceDiff = Math.abs(newPrice - oldPrice);
    
    // Distractor 1: Wrong base price (using new price instead of old for percentage decrease)
    if (exercise.isIncrease) {
      const wrongBase = Math.round((priceDiff / newPrice) * 100);
      if (wrongBase > 0 && wrongBase <= 100 && wrongBase !== correctAnswer) {
        options.add(wrongBase);
      }
    } else {
      const wrongBase = Math.round((priceDiff / oldPrice) * 100);
      if (wrongBase > 0 && wrongBase <= 100 && wrongBase !== correctAnswer) {
        options.add(wrongBase);
      }
    }
    
    // Distractor 2: Forgetting to multiply by 100 (decimal percentage)
    const decimal = Math.round(correctAnswer / 10);
    if (decimal > 0 && decimal <= 100 && decimal !== correctAnswer) {
      options.add(decimal);
    }
    
    // Distractor 3: Simple arithmetic error (±5-15%)
    let arithmeticError = correctAnswer + (Math.random() > 0.5 ? 1 : -1) * (5 + Math.floor(Math.random() * 10));
    arithmeticError = Math.max(1, Math.min(100, arithmeticError));
    if (arithmeticError !== correctAnswer) {
      options.add(arithmeticError);
    }
    
    // Fill remaining slots with reasonable alternatives if needed
    while (options.size < 4) {
      let alternative = correctAnswer + (Math.random() > 0.5 ? 1 : -1) * (2 + Math.floor(Math.random() * 8));
      alternative = Math.max(1, Math.min(100, alternative));
      if (!options.has(alternative)) {
        options.add(alternative);
      }
    }
    
    // Convert to array and shuffle
    const optionsArray = Array.from(options).slice(0, 4);
    return optionsArray.sort(() => Math.random() - 0.5);
  };

  // Render learning phase
  if (phase === 'learning') {
    const currentExercise = exercises[currentExerciseIndex];
    if (!currentExercise) return null;

    // Generate answer options with smart distractors
    const shuffledOptions = generateAnswerOptions(currentExercise.correctAnswer, currentExercise);

    return (
      <div className="tablet-container bg-gradient-to-br from-blue-50 to-purple-100 p-1 overflow-hidden">
        <div className="tablet-content max-w-3xl mx-auto">
          {/* Header */}
          <Card className="game-card mb-1 text-center flex-shrink-0">
            <h1 className="text-lg font-bold mb-1">Price Comparison Challenge</h1>
            <Progress value={((currentExerciseIndex + 1) / exercises.length) * 100} className="max-w-sm mx-auto" />
            <p className="text-xs text-muted-foreground mt-1">
              Question {currentExerciseIndex + 1} of {exercises.length}
            </p>
          </Card>

          {/* Exercise */}
          <Card className="game-card text-center flex-1 min-h-0 overflow-y-auto">
            <div className="space-y-3">
              <div className="text-3xl">{currentExercise.emoji}</div>
              <h2 className="text-lg font-bold">{currentExercise.item}</h2>
              <p className="text-sm text-muted-foreground">at {currentExercise.store}</p>
              
              {/* Visual Price Comparison */}
              <div className="bg-white p-3 rounded-lg border max-w-xs mx-auto">
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div 
                      className="bg-red-400 w-8 mx-auto mb-1 transition-all duration-1000"
                      style={{ height: `${(currentExercise.oldPrice / Math.max(currentExercise.oldPrice, currentExercise.newPrice)) * 60}px` }}
                    ></div>
                    <div className="font-bold text-sm">${currentExercise.oldPrice}</div>
                    <div className="text-xs text-muted-foreground">Before</div>
                  </div>
                  
                  <div className="text-lg">→</div>
                  
                  <div className="text-center">
                    <div 
                      className="bg-green-400 w-8 mx-auto mb-1 transition-all duration-1000"
                      style={{ height: `${(currentExercise.newPrice / Math.max(currentExercise.oldPrice, currentExercise.newPrice)) * 60}px` }}
                    ></div>
                    <div className="font-bold text-sm">${currentExercise.newPrice}</div>
                    <div className="text-xs text-muted-foreground">After</div>
                  </div>
                </div>
              </div>

              <div className="text-lg font-bold">
                What is the percentage {currentExercise.isIncrease ? 'increase' : 'decrease'}?
              </div>

              {/* Answer Options */}
              <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
                {shuffledOptions.map((option) => (
                  <Button
                    key={option}
                    onClick={() => handleAnswerSubmit(option)}
                    disabled={showAnswerDialog && (selectedAnswer === currentExercise.correctAnswer || !canTryAgain)}
                    className={`h-12 text-lg ${
                      showAnswerDialog && selectedAnswer !== null && option === currentExercise.correctAnswer
                        ? 'bg-green-600 text-white'
                        : showAnswerDialog && selectedAnswer !== null && option === selectedAnswer && option !== currentExercise.correctAnswer
                        ? 'bg-red-600 text-white'
                        : ''
                    }`}
                    variant={showAnswerDialog && selectedAnswer !== null && option === currentExercise.correctAnswer ? 'default' : 'outline'}
                  >
                    {option}%
                  </Button>
                ))}
              </div>

              {/* Next Button for Correct Answers */}
              {showAnswer && selectedAnswer === currentExercise.correctAnswer && (
                <div className="animate-fade-in">
                  <Button 
                    onClick={handleNext}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6"
                  >
                    {currentExerciseIndex < 2 ? 'Next Question →' : 'Complete Challenge! 🎉'}
                  </Button>
                </div>
              )}

              {/* Answer Explanation Dialog */}
              <Dialog open={showAnswerDialog} onOpenChange={setShowAnswerDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                      {selectedAnswer === currentExercise.correctAnswer ? '🎉 Excellent Work!' : '🤔 Let\'s Learn Together!'}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {/* Step 0: Visual Price Comparison */}
                  {currentStep === 0 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl">
                        <div className="text-center mb-4">
                          <div className="text-2xl mb-2">{currentExercise.emoji}</div>
                          <div className="font-bold text-lg">{currentExercise.item} at {currentExercise.store}</div>
                        </div>
                        
                        <div className="flex items-center justify-center gap-8 mb-4">
                          <div className="text-center">
                            <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4 mb-2">
                              <div className="text-2xl font-bold text-red-700">${currentExercise.oldPrice}</div>
                              <div className="text-sm text-red-600">Before</div>
                            </div>
                            <div className="w-16 h-2 bg-red-400 rounded mx-auto"></div>
                          </div>
                          
                          <div className="text-3xl animate-pulse">→</div>
                          
                          <div className="text-center">
                            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4 mb-2">
                              <div className="text-2xl font-bold text-green-700">${currentExercise.newPrice}</div>
                              <div className="text-sm text-green-600">After</div>
                            </div>
                            <div className="w-16 h-2 bg-green-400 rounded mx-auto"></div>
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full border-2 border-gray-200">
                            <span className="text-lg">Price {currentExercise.isIncrease ? '📈 Increased' : '📉 Decreased'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">Let's calculate the percentage step by step!</p>
                        <Button 
                          onClick={() => setCurrentStep(1)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                        >
                          Start Calculation →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 1: Find the difference */}
                  {currentStep === 1 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-white border-2 border-blue-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">1</div>
                          <div className="text-lg font-semibold text-blue-700">Find the difference</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center justify-center gap-3 text-lg">
                            <div className="bg-green-200 px-3 py-2 rounded font-bold">${currentExercise.newPrice}</div>
                            <span className="text-2xl">−</span>
                            <div className="bg-red-200 px-3 py-2 rounded font-bold">${currentExercise.oldPrice}</div>
                            <span className="text-2xl">=</span>
                            <div className="bg-yellow-200 px-3 py-2 rounded font-bold animate-bounce">
                              ${Math.abs(currentExercise.newPrice - currentExercise.oldPrice)}
                            </div>
                          </div>
                          <div className="text-center text-sm text-blue-600 mt-2">
                            💡 This tells us how much the price changed
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          onClick={() => setCurrentStep(0)}
                          variant="outline"
                          className="px-4 py-2"
                        >
                          ← Back
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep(2)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2"
                        >
                          Next Step →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Divide by base price */}
                  {currentStep === 2 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-white border-2 border-purple-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
                          <div className="text-lg font-semibold text-purple-700">
                            Divide by the {currentExercise.isIncrease ? 'original' : 'new'} price
                          </div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="flex items-center justify-center gap-3 text-lg">
                            <div className="bg-yellow-200 px-3 py-2 rounded font-bold">${Math.abs(currentExercise.newPrice - currentExercise.oldPrice)}</div>
                            <span className="text-2xl">÷</span>
                            <div className="bg-blue-200 px-3 py-2 rounded font-bold">
                              ${currentExercise.isIncrease ? currentExercise.oldPrice : currentExercise.newPrice}
                            </div>
                            <span className="text-2xl">=</span>
                            <div className="bg-orange-200 px-3 py-2 rounded font-bold animate-bounce">
                              {((Math.abs(currentExercise.newPrice - currentExercise.oldPrice) / (currentExercise.isIncrease ? currentExercise.oldPrice : currentExercise.newPrice))).toFixed(3)}
                            </div>
                          </div>
                          <div className="text-center text-sm text-purple-600 mt-2">
                            💡 This gives us the decimal change
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          onClick={() => setCurrentStep(1)}
                          variant="outline"
                          className="px-4 py-2"
                        >
                          ← Back
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep(3)}
                          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
                        >
                          Next Step →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Convert to percentage */}
                  {currentStep === 3 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-white border-2 border-green-200 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
                          <div className="text-lg font-semibold text-green-700">Convert to percentage</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="flex items-center justify-center gap-3 text-lg">
                            <div className="bg-orange-200 px-3 py-2 rounded font-bold">
                              {((Math.abs(currentExercise.newPrice - currentExercise.oldPrice) / (currentExercise.isIncrease ? currentExercise.oldPrice : currentExercise.newPrice))).toFixed(3)}
                            </div>
                            <span className="text-2xl">×</span>
                            <div className="bg-gray-200 px-3 py-2 rounded font-bold">100</div>
                            <span className="text-2xl">=</span>
                            <div className="bg-gradient-to-r from-green-400 to-emerald-400 text-white px-4 py-2 rounded-lg font-bold text-xl animate-pulse">
                              {currentExercise.correctAnswer}%
                            </div>
                          </div>
                          <div className="text-center text-sm text-green-600 mt-2">
                            🎯 Final answer: {currentExercise.correctAnswer}% {currentExercise.isIncrease ? 'increase' : 'decrease'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button 
                          onClick={() => setCurrentStep(2)}
                          variant="outline"
                          className="px-4 py-2"
                        >
                          ← Back
                        </Button>
                        <Button 
                          onClick={() => setCurrentStep(4)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2"
                        >
                          See Formula →
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Formula Summary & Action */}
                  {currentStep === 4 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-gray-200 rounded-xl p-4">
                        <div className="text-center">
                          <div className="text-lg font-bold mb-2">📝 Remember the Formula:</div>
                          <div className="bg-white p-3 rounded-lg border inline-block">
                            <div className="text-lg font-mono">
                              <span className="text-blue-600">Difference</span> ÷ 
                              <span className="text-purple-600"> Base Price</span> × 
                              <span className="text-green-600"> 100</span> = 
                              <span className="text-orange-600"> Percentage</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {selectedAnswer === currentExercise.correctAnswer ? (
                        <div className="text-center">
                          <div className="text-green-600 font-bold mb-4">
                            🎉 Perfect! You got {currentExercise.correctAnswer}% {currentExercise.isIncrease ? 'increase' : 'decrease'}
                          </div>
                          <Button 
                            onClick={handleNext}
                            className="bg-primary hover:bg-primary/90 px-8 py-3"
                          >
                            {currentExerciseIndex < exercises.length - 1 ? 'Next Question' : 'Complete'} 
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-orange-600 font-bold mb-4">
                            🤔 The correct answer was {currentExercise.correctAnswer}%. Let's try the next question!
                          </div>
                          <div className="flex gap-3 justify-center">
                            <Button 
                              onClick={() => setCurrentStep(0)}
                              variant="outline"
                              className="px-4 py-2"
                            >
                              Review Steps
                            </Button>
                            <Button 
                              onClick={handleTryAgain}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                            >
                              Try Again
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
    <div className="tablet-container bg-gradient-to-br from-blue-50 to-purple-100 p-2 flex items-center justify-center overflow-hidden">
      <Card className="game-card max-w-lg mx-auto text-center">
        <div className="space-y-4">
          <div className="text-6xl">🎉</div>
          <h1 className="text-3xl font-bold text-green-700">Congratulations!</h1>
          <p className="text-lg text-muted-foreground">
            You've mastered percentage differences!
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-semibold">
              ✅ Challenge Complete
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PercentageDifference;