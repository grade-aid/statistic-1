import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ShoppingCart, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/Confetti";

// Game phases
type GamePhase = 'start' | 'collection' | 'examples' | 'dragdrop' | 'complete';

interface PriceItem {
  id: string;
  emoji: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  store: string;
  position: { x: number; y: number };
  collected: boolean;
}

interface CollectedPrices {
  [key: string]: PriceItem;
}

interface PriceExample {
  id: string;
  emoji: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  store: string;
  percentageChange: number;
  isIncrease: boolean;
}

interface DragDropQuestion {
  id: string;
  emoji: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  isIncrease: boolean;
  correctAnswer: number;
}

interface DroppedItem {
  zone: string;
  item: string;
}

const GRID_SIZE = 12;
const TARGET_ITEMS = 9;

const PercentageDifference = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Game phase
  const [phase, setPhase] = useState<GamePhase>('start');

  // Collection phase state
  const [playerPosition, setPlayerPosition] = useState({ x: 1, y: 1 });
  const [priceItems, setPriceItems] = useState<PriceItem[]>([]);
  const [collectedPrices, setCollectedPrices] = useState<CollectedPrices>({});
  const [walls, setWalls] = useState<{ x: number; y: number }[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);

  // Examples state
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Drag-drop state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [showQuestionResult, setShowQuestionResult] = useState(false);

  // Item configuration for collection
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

  // Store configuration
  const storeConfig = {
    techmart: { name: 'TechMart', color: 'bg-blue-200' },
    electroshop: { name: 'ElectroShop', color: 'bg-green-200' },
    gadgetstore: { name: 'GadgetStore', color: 'bg-purple-200' },
    techhub: { name: 'TechHub', color: 'bg-orange-200' }
  };

  // Generate walls for game grid
  const generateWalls = useCallback(() => {
    const newWalls: { x: number; y: number }[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
          newWalls.push({ x, y });
        } else if (x % 3 === 0 && y % 3 === 0 && Math.random() > 0.5) {
          newWalls.push({ x, y });
        }
      }
    }
    return newWalls;
  }, []);

  // Generate price items for collection
  const generatePriceItems = useCallback(() => {
    const items: PriceItem[] = [];
    const itemTypes = Object.keys(itemConfig);
    const stores = Object.keys(storeConfig);

    for (let i = 0; i < TARGET_ITEMS; i++) {
      const itemType = itemTypes[i % itemTypes.length];
      const store = stores[Math.floor(i / 3) % stores.length];
      
      // Generate realistic price changes
      const basePrice = 100 + Math.floor(Math.random() * 900);
      const priceChange = 0.1 + Math.random() * 0.4; // 10-50% change
      const isIncrease = Math.random() > 0.5;
      
      const oldPrice = isIncrease ? basePrice : Math.round(basePrice * (1 + priceChange));
      const newPrice = isIncrease ? Math.round(basePrice * (1 + priceChange)) : basePrice;

      // Find valid position
      let position;
      do {
        position = {
          x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
          y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
        };
      } while (
        walls.some(wall => wall.x === position.x && wall.y === position.y) ||
        items.some(item => item.position.x === position.x && item.position.y === position.y)
      );

      items.push({
        id: `${itemType}-${i}`,
        emoji: itemConfig[itemType as keyof typeof itemConfig].emoji,
        name: itemConfig[itemType as keyof typeof itemConfig].name,
        oldPrice,
        newPrice,
        store: storeConfig[store as keyof typeof storeConfig].name,
        position,
        collected: false
      });
    }
    
    return items;
  }, [walls]);

  // Check if position is a wall
  const isWall = (pos: { x: number; y: number }) => {
    return walls.some(wall => wall.x === pos.x && wall.y === pos.y);
  };

  // Start game
  const startGame = () => {
    const newWalls = generateWalls();
    setWalls(newWalls);
    
    // Generate items after walls are set
    setTimeout(() => {
      const items = generatePriceItems();
      setPriceItems(items);
    }, 100);
    
    setPlayerPosition({ x: 1, y: 1 });
    setCollectedPrices({});
    setCollectedCount(0);
    setPhase('collection');
  };

  // Player movement
  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phase !== 'collection') return;
    
    setPlayerPosition(prev => {
      const newPos = {
        x: Math.max(0, Math.min(GRID_SIZE - 1, prev.x + dx)),
        y: Math.max(0, Math.min(GRID_SIZE - 1, prev.y + dy))
      };
      
      // Check if new position is a wall
      if (isWall(newPos)) {
        return prev; // Don't move if hitting a wall
      }
      
      return newPos;
    });
  }, [phase, walls]);

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
      item.position.x === playerPosition.x && 
      item.position.y === playerPosition.y && 
      !item.collected
    );
    
    if (itemToCollect) {
      setPriceItems(prev => prev.map(item => 
        item.id === itemToCollect.id ? { ...item, collected: true } : item
      ));
      
      setCollectedPrices(prev => ({
        ...prev,
        [itemToCollect.id]: itemToCollect
      }));
      
      setCollectedCount(prev => prev + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    }
  }, [playerPosition, priceItems, phase]);

  // Check if collection is complete
  useEffect(() => {
    if (collectedCount >= TARGET_ITEMS && phase === 'collection') {
      setTimeout(() => {
        setPhase('examples');
      }, 1000);
    }
  }, [collectedCount, phase]);

  // Auto-complete for testing
  const autoComplete = () => {
    priceItems.forEach(item => {
      if (!item.collected) {
        setCollectedPrices(prev => ({
          ...prev,
          [item.id]: item
        }));
      }
    });
    setCollectedCount(TARGET_ITEMS);
  };

  // Generate examples from collected data
  const examples: PriceExample[] = Object.values(collectedPrices).slice(0, 4).map(item => {
    const percentageChange = Math.round(
      Math.abs(item.newPrice - item.oldPrice) / Math.min(item.oldPrice, item.newPrice) * 100
    );
    return {
      id: item.id,
      emoji: item.emoji,
      name: item.name,
      oldPrice: item.oldPrice,
      newPrice: item.newPrice,
      store: item.store,
      percentageChange,
      isIncrease: item.newPrice > item.oldPrice
    };
  });

  // Drag-drop questions from collected data
  const dragDropQuestions: DragDropQuestion[] = Object.values(collectedPrices).slice(0, 5).map(item => {
    const percentageChange = Math.round(
      Math.abs(item.newPrice - item.oldPrice) / Math.min(item.oldPrice, item.newPrice) * 100
    );
    return {
      id: `drag-${item.id}`,
      emoji: item.emoji,
      name: item.name,
      oldPrice: item.oldPrice,
      newPrice: item.newPrice,
      isIncrease: item.newPrice > item.oldPrice,
      correctAnswer: percentageChange
    };
  });

  const currentExample = examples[currentExampleIndex];
  const currentQuestion = dragDropQuestions[currentQuestionIndex];

  // Reset calculation states when example changes
  useEffect(() => {
    setShowCalculation(false);
    setShowResult(false);
  }, [currentExampleIndex]);

  // Handle example interactions
  const handleShowCalculation = () => {
    setShowCalculation(true);
    setTimeout(() => setShowResult(true), 2000);
  };

  const handleNextExample = () => {
    if (currentExampleIndex < examples.length - 1) {
      setCurrentExampleIndex(prev => prev + 1);
    } else {
      setPhase('dragdrop');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Remove existing item in this zone
    const updatedItems = droppedItems.filter(item => item.zone !== zone);
    updatedItems.push({ zone, item: draggedItem });
    setDroppedItems(updatedItems);
    setDraggedItem(null);
  };

  const checkAnswer = () => {
    const oldPriceItem = droppedItems.find(item => item.zone === 'oldPrice');
    const newPriceItem = droppedItems.find(item => item.zone === 'newPrice');
    const differenceItem = droppedItems.find(item => item.zone === 'difference');
    const hundredItem = droppedItems.find(item => item.zone === 'hundred');

    const difference = Math.abs(currentQuestion.newPrice - currentQuestion.oldPrice);
    const basePrice = currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice;

    const isCorrect = 
      oldPriceItem?.item === `$${basePrice}` &&
      newPriceItem?.item === (currentQuestion.isIncrease ? `$${currentQuestion.newPrice}` : `$${currentQuestion.oldPrice}`) &&
      differenceItem?.item === `$${difference}` &&
      hundredItem?.item === '100';

    if (isCorrect) {
      setCompletedQuestions(prev => [...prev, currentQuestion.id]);
      setShowConfetti(true);
      setShowQuestionResult(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      toast({
        title: "Correct! 🎉",
        description: `The ${currentQuestion.name} ${currentQuestion.isIncrease ? 'increased' : 'decreased'} by ${currentQuestion.correctAnswer}%`,
      });
    } else {
      toast({
        title: "Not quite right 🤔",
        description: "Check the calculation steps and try again!",
        variant: "destructive"
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < dragDropQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setDroppedItems([]);
      setShowQuestionResult(false);
    } else {
      // Store data for visualization page
      localStorage.setItem('priceComparisonData', JSON.stringify({
        examples: examples,
        completed: true
      }));
      navigate('/percentage-visualization');
    }
  };

  const resetQuestion = () => {
    setDroppedItems([]);
    setShowQuestionResult(false);
  };

  // Start phase
  if (phase === 'start') {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex items-center justify-center overflow-hidden">
        <Card className="p-8 max-w-2xl mx-auto text-center shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm border-2">
          <div className="space-y-6">
            <div className="text-6xl mb-4">🛒</div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Price Comparison Adventure!
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              Collect items with different prices and learn percentage differences
            </p>
            <Button 
              onClick={startGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xl px-8 py-4 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Start Shopping! <ShoppingCart className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Collection phase
  if (phase === 'collection') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-6 overflow-hidden flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold mb-3 text-gray-800">🛒 Collect Price Items</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
              <div className="bg-white/95 px-6 py-3 rounded-2xl border-2 border-purple-200 shadow-sm backdrop-blur-sm">
                <span className="text-xl font-bold text-gray-700">
                  {collectedCount} / {TARGET_ITEMS}
                </span>
              </div>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                className="text-lg px-4 py-3 h-12 rounded-2xl border-2 border-purple-300 bg-white/95 hover:bg-purple-50 transition-all duration-300 shadow-sm backdrop-blur-sm"
                disabled={priceItems.length === 0}
              >
                Skip Collection
              </Button>
            </div>
          </div>

          {/* Game Grid */}
          <div className="flex-1 flex justify-center items-center min-h-0">
            <Card className="w-full aspect-square max-w-lg shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm border-2">
              <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 h-full p-3">
                <div 
                  className="grid gap-1 relative w-full h-full rounded-xl overflow-hidden"
                  style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
                    const x = index % GRID_SIZE;
                    const y = Math.floor(index / GRID_SIZE);
                    const isWallCell = isWall({ x, y });
                    const isPlayer = playerPosition.x === x && playerPosition.y === y;
                    const item = priceItems.find(item => 
                      item.position.x === x && item.position.y === y && !item.collected
                    );
                    
                    return (
                      <div
                        key={index}
                        className={`
                          border border-purple-200/50 flex items-center justify-center text-lg rounded-sm
                          ${isWallCell ? 'bg-purple-600 shadow-inner' : 'bg-white/80 hover:bg-white/90'}
                          transition-all duration-200
                        `}
                        style={{ aspectRatio: '1' }}
                      >
                        {isPlayer && <span className="text-lg drop-shadow-sm">🛒</span>}
                        {item && <span className="text-lg drop-shadow-sm animate-pulse">{item.emoji}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Instructions and Progress */}
          <div className="mt-4">
            <Card className="p-4 bg-white/95 backdrop-blur-sm border-2 border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <MapPin className="w-6 h-6 text-purple-600" />
                  <span className="text-lg font-medium">Use arrow keys to move 🛒</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  Collected: {collectedCount}/{TARGET_ITEMS}
                </div>
              </div>
            </Card>
          </div>

          {/* Collected Items Display */}
          {Object.keys(collectedPrices).length > 0 && (
            <div className="mt-4">
              <Card className="p-4 bg-white/95 backdrop-blur-sm border-2 border-purple-200 shadow-sm">
                <h3 className="text-lg font-bold mb-3">Collected Items:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(collectedPrices).map(item => (
                    <div key={item.id} className="bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-2 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.emoji}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ${item.oldPrice} → ${item.newPrice}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
        
        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  // Examples phase
  if (phase === 'examples' && currentExample) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📊</div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Price Percentage Changes
              </h1>
              <p className="text-xl text-muted-foreground">
                Learn from the items you collected
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Example Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{currentExample.emoji}</div>
                <h2 className="text-2xl font-bold mb-2">{currentExample.name}</h2>
                <div className="text-lg text-muted-foreground">{currentExample.store}</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border">
                  <span className="font-medium">Old Price:</span>
                  <span className="text-xl font-bold text-red-600">${currentExample.oldPrice}</span>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border">
                  <span className="font-medium">New Price:</span>
                  <span className="text-xl font-bold text-green-600">${currentExample.newPrice}</span>
                </div>

                {showCalculation && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border animate-in slide-in-from-bottom duration-500">
                    <h3 className="font-bold mb-3">Calculation Steps:</h3>
                    <div className="space-y-2 text-sm">
                      <div>1. Find difference: ${Math.abs(currentExample.newPrice - currentExample.oldPrice)}</div>
                      <div>2. Divide by {currentExample.isIncrease ? 'old' : 'new'} price: {Math.abs(currentExample.newPrice - currentExample.oldPrice)} ÷ {currentExample.isIncrease ? currentExample.oldPrice : currentExample.newPrice}</div>
                      <div>3. Multiply by 100: × 100 = {currentExample.percentageChange}%</div>
                    </div>
                  </div>
                )}

                {showResult && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border animate-in slide-in-from-bottom duration-500">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentExample.percentageChange}% {currentExample.isIncrease ? 'Increase' : 'Decrease'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {!showCalculation ? (
                  <Button 
                    onClick={handleShowCalculation}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Show Calculation
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextExample}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {currentExampleIndex < examples.length - 1 ? 'Next Example' : 'Start Practice'} 
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </Card>

            {/* Visual Bar Chart */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Price Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Old Price</span>
                    <span className="font-bold">${currentExample.oldPrice}</span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-red-500 h-8 rounded-full transition-all duration-1000 flex items-center justify-center"
                      style={{ width: `${(currentExample.oldPrice / Math.max(currentExample.oldPrice, currentExample.newPrice)) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">${currentExample.oldPrice}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>New Price</span>
                    <span className="font-bold">${currentExample.newPrice}</span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-8 rounded-full transition-all duration-1000 flex items-center justify-center"
                      style={{ width: `${(currentExample.newPrice / Math.max(currentExample.oldPrice, currentExample.newPrice)) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">${currentExample.newPrice}</span>
                    </div>
                  </div>
                </div>

                {showResult && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {currentExample.isIncrease ? '📈' : '📉'}
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {currentExample.percentageChange}% {currentExample.isIncrease ? 'Increase' : 'Decrease'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Progress */}
          <Card className="p-4 mt-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Example {currentExampleIndex + 1} of {examples.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentExampleIndex + 1) / examples.length) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Drag-drop phase
  if (phase === 'dragdrop' && currentQuestion) {
    const difference = Math.abs(currentQuestion.newPrice - currentQuestion.oldPrice);
    const basePrice = currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice;

    const availableItems = [
      { id: `$${currentQuestion.oldPrice}`, label: `$${currentQuestion.oldPrice}`, color: 'bg-purple-200 border-purple-400' },
      { id: `$${currentQuestion.newPrice}`, label: `$${currentQuestion.newPrice}`, color: 'bg-purple-200 border-purple-400' },
      { id: `$${difference}`, label: `$${difference}`, color: 'bg-pink-200 border-pink-400' },
      { id: '100', label: '100', color: 'bg-purple-200 border-purple-400' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Drag & Drop Practice
                </h1>
                <p className="text-muted-foreground">
                  Complete the percentage calculation with your collected items
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currentQuestionIndex + 1}/{dragDropQuestions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
            </div>
          </Card>

          {/* Question */}
          <Card className="p-8 mb-6">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{currentQuestion.emoji}</div>
              <h2 className="text-2xl font-bold mb-4">
                What percentage did this {currentQuestion.name} {currentQuestion.isIncrease ? 'increase' : 'decrease'}?
              </h2>
              
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    {currentQuestion.isIncrease ? 'Old Price' : 'New Price'}
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    ${currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice}
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 self-end mb-2 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    {currentQuestion.isIncrease ? 'New Price' : 'Old Price'}
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${currentQuestion.isIncrease ? currentQuestion.newPrice : currentQuestion.oldPrice}
                  </div>
                </div>
              </div>
            </div>

            {/* Drag Drop Equation */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-dashed border-purple-200">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">Complete the equation:</h3>
              </div>
              
              <div className="flex items-center justify-center gap-2 flex-wrap text-xl font-bold">
                <span>(</span>
                
                {/* Difference drop zone */}
                <div
                  className="w-20 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'difference')}
                >
                  {droppedItems.find(item => item.zone === 'difference')?.item || 'Drag'}
                </div>
                
                <span>÷</span>
                
                {/* Base price drop zone */}
                <div
                  className="w-20 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'oldPrice')}
                >
                  {droppedItems.find(item => item.zone === 'oldPrice')?.item || 'Drag'}
                </div>
                
                <span>) × </span>
                
                {/* Hundred drop zone */}
                <div
                  className="w-16 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'hundred')}
                >
                  {droppedItems.find(item => item.zone === 'hundred')?.item || 'Drag'}
                </div>
                
                <span>= </span>
                
                {/* Result drop zone */}
                <div
                  className="w-20 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'newPrice')}
                >
                  {droppedItems.find(item => item.zone === 'newPrice')?.item || 'Drag'}
                </div>
                
                <span>%</span>
              </div>
            </div>

            {/* Draggable Items */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-center">Drag these values:</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {availableItems.map((item) => {
                  const isUsed = droppedItems.some(dropped => dropped.item === item.label);
                  return (
                    <div
                      key={item.id}
                      draggable={!isUsed}
                      onDragStart={() => handleDragStart(item.label)}
                      className={`${item.color} px-4 py-3 rounded-lg cursor-move border-2 font-bold text-lg min-w-[80px] text-center transition-all ${
                        isUsed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 justify-center">
              <Button 
                onClick={checkAnswer}
                disabled={droppedItems.length < 4}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
              >
                Check Answer
              </Button>
              <Button 
                onClick={resetQuestion}
                variant="outline"
                className="px-8"
              >
                Reset
              </Button>
            </div>

            {/* Show result */}
            {showQuestionResult && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 animate-in slide-in-from-bottom duration-300">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 mb-2">
                    Correct! The {currentQuestion.name} {currentQuestion.isIncrease ? 'increased' : 'decreased'} by {currentQuestion.correctAnswer}%
                  </div>
                  <div className="text-sm text-green-600">
                    ({difference} ÷ {basePrice}) × 100 = {currentQuestion.correctAnswer}%
                  </div>
                  
                  <Button 
                    onClick={handleNextQuestion}
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {currentQuestionIndex < dragDropQuestions.length - 1 ? 'Next Question' : 'View Visualization'} 
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {dragDropQuestions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / dragDropQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  return null;
};

export default PercentageDifference;