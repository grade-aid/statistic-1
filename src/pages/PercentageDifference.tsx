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

  // Start phase - Tablet Optimized
  if (phase === 'start') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex items-center justify-center overflow-hidden">
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
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xl px-8 py-4 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
            >
              Start Shopping! <ShoppingCart className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Collection phase - Tablet Optimized
  if (phase === 'collection') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0">
          
          {/* Compact Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">🛒 Collect Items</h2>
            
            <div className="flex items-center justify-center gap-4">
              <div className="bg-white/95 px-6 py-3 rounded-2xl border-2 border-purple-200 shadow-sm backdrop-blur-sm">
                <span className="text-xl font-bold text-gray-700">
                  {collectedCount} / {TARGET_ITEMS}
                </span>
              </div>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                className="text-lg px-6 py-3 h-12 rounded-2xl border-2 border-purple-300 bg-white/95 hover:bg-purple-50 transition-all duration-300 shadow-sm backdrop-blur-sm min-w-[150px]"
                disabled={priceItems.length === 0}
              >
                Skip Collection
              </Button>
            </div>
          </div>

          {/* Game Grid - Fixed size for tablet */}
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

          {/* Compact Instructions */}
          <div className="mt-4 flex-shrink-0">
            <Card className="p-3 bg-white/95 backdrop-blur-sm border-2 border-purple-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  <span className="text-lg font-medium">Use arrow keys to move 🛒</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  Progress: {Math.round((collectedCount / TARGET_ITEMS) * 100)}%
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  // Examples phase - Tablet Optimized (No Scrolling)
  if (phase === 'examples' && currentExample) {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto min-h-0">
          
          {/* Compact Header */}
          <div className="text-center mb-4 flex-shrink-0">
            <div className="text-5xl mb-2">📊</div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Price Percentage Changes
            </h1>
            <p className="text-lg text-muted-foreground">
              Example {currentExampleIndex + 1} of {examples.length}
            </p>
          </div>

          {/* Main Content Card */}
          <Card className="flex-1 p-6 overflow-hidden">
            <div className="h-full flex flex-col">
              
              {/* Item Header */}
              <div className="text-center mb-4 flex-shrink-0">
                <div className="text-4xl mb-2">{currentExample.emoji}</div>
                <h2 className="text-2xl font-bold mb-1">{currentExample.name}</h2>
                <div className="text-lg text-muted-foreground">{currentExample.store}</div>
              </div>

              {/* Price Comparison */}
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center p-3 bg-red-50 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">Old Price</div>
                    <div className="text-xl font-bold text-red-600">${currentExample.oldPrice}</div>
                  </div>
                  
                  <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                  
                  <div className="text-center p-3 bg-green-50 rounded-lg border">
                    <div className="text-sm text-muted-foreground mb-1">New Price</div>
                    <div className="text-xl font-bold text-green-600">${currentExample.newPrice}</div>
                  </div>
                </div>

                {showCalculation && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in">
                    {/* Step 1 */}
                    <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <h4 className="text-sm font-bold text-blue-800">Find difference</h4>
                      </div>
                      <div className="bg-white p-2 rounded border border-blue-200 text-center">
                        <div className="text-sm">
                          <span className="font-bold text-blue-600">${Math.abs(currentExample.newPrice - currentExample.oldPrice)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <h4 className="text-sm font-bold text-purple-800">Divide by base</h4>
                      </div>
                      <div className="bg-white p-2 rounded border border-purple-200 text-center">
                        <div className="text-sm">
                          <span className="font-bold text-purple-600">
                            {(Math.abs(currentExample.newPrice - currentExample.oldPrice) / (currentExample.isIncrease ? currentExample.oldPrice : currentExample.newPrice)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-pink-50 p-3 rounded-lg border-2 border-pink-200">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <h4 className="text-sm font-bold text-pink-800">× 100</h4>
                      </div>
                      <div className="bg-white p-2 rounded border border-pink-200 text-center">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded text-sm">
                          <span className="font-bold">{currentExample.percentageChange}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {showResult && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200 animate-scale-in text-center">
                    <div className="text-2xl mb-1">
                      {currentExample.isIncrease ? '📈' : '📉'}
                    </div>
                    <div className="text-lg font-bold text-green-700">
                      {currentExample.percentageChange}% {currentExample.isIncrease ? 'Increase' : 'Decrease'}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3 flex-shrink-0">
                {!showCalculation ? (
                  <Button 
                    onClick={handleShowCalculation}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg rounded-2xl min-w-[150px]"
                  >
                    Show Calculation
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextExample}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg rounded-2xl min-w-[150px]"
                  >
                    {currentExampleIndex < examples.length - 1 ? 'Next Example' : 'Start Practice'} 
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Drag-drop phase - Tablet Optimized (No Scrolling)
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
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-4 overflow-hidden flex flex-col">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto min-h-0">
          
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-4 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Drag & Drop Practice
              </h1>
              <p className="text-muted-foreground text-sm">Complete the percentage calculation</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">{currentQuestionIndex + 1}/{dragDropQuestions.length}</div>
              <div className="text-sm text-muted-foreground">Questions</div>
            </div>
          </div>

          {/* Main Question Card */}
          <Card className="flex-1 p-6 overflow-hidden">
            <div className="h-full flex flex-col">
              
              {/* Question Header */}
              <div className="text-center mb-4 flex-shrink-0">
                <div className="text-4xl mb-2">{currentQuestion.emoji}</div>
                <h2 className="text-xl font-bold mb-3">
                  What percentage did this {currentQuestion.name} {currentQuestion.isIncrease ? 'increase' : 'decrease'}?
                </h2>
                
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {currentQuestion.isIncrease ? 'Old Price' : 'New Price'}
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      ${currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 mx-auto text-muted-foreground" />
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {currentQuestion.isIncrease ? 'New Price' : 'Old Price'}
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      ${currentQuestion.isIncrease ? currentQuestion.newPrice : currentQuestion.oldPrice}
                    </div>
                  </div>
                </div>
              </div>

              {/* Drag Drop Interface */}
              <div className="flex-1 flex flex-col justify-center">
                
                {/* Drag Drop Equation */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-dashed border-purple-200 mb-4">
                  <div className="text-center mb-3">
                    <h3 className="text-lg font-bold">Complete the equation:</h3>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 flex-wrap text-xl font-bold">
                    <span>(</span>
                    
                    {/* Difference drop zone */}
                    <div
                      className="w-16 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'difference')}
                    >
                      {droppedItems.find(item => item.zone === 'difference')?.item || '?'}
                    </div>
                    
                    <span>÷</span>
                    
                    {/* Base price drop zone */}
                    <div
                      className="w-16 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'oldPrice')}
                    >
                      {droppedItems.find(item => item.zone === 'oldPrice')?.item || '?'}
                    </div>
                    
                    <span>) × </span>
                    
                    {/* Hundred drop zone */}
                    <div
                      className="w-12 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'hundred')}
                    >
                      {droppedItems.find(item => item.zone === 'hundred')?.item || '?'}
                    </div>
                    
                    <span>= </span>
                    
                    {/* Result drop zone */}
                    <div
                      className="w-16 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'newPrice')}
                    >
                      {droppedItems.find(item => item.zone === 'newPrice')?.item || '?'}
                    </div>
                    
                    <span>%</span>
                  </div>
                </div>

                {/* Draggable Items */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-3 text-center">Drag these values:</h3>
                  <div className="flex justify-center gap-3 flex-wrap">
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

                {/* Show result */}
                {showQuestionResult && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200 animate-fade-in text-center">
                    <div className="text-lg font-bold text-green-600 mb-2">
                      Correct! The {currentQuestion.name} {currentQuestion.isIncrease ? 'increased' : 'decreased'} by {currentQuestion.correctAnswer}%
                    </div>
                    <div className="text-sm text-green-600 mb-3">
                      ({difference} ÷ {basePrice}) × 100 = {currentQuestion.correctAnswer}%
                    </div>
                    
                    <Button 
                      onClick={handleNextQuestion}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 px-6 rounded-2xl min-w-[150px]"
                    >
                      {currentQuestionIndex < dragDropQuestions.length - 1 ? 'Next Question' : 'View Results'} 
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {!showQuestionResult && (
                <div className="flex gap-3 flex-shrink-0">
                  <Button 
                    onClick={checkAnswer}
                    disabled={droppedItems.length < 4}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-12 text-lg rounded-2xl disabled:opacity-50 min-w-[150px]"
                  >
                    Check Answer
                  </Button>
                  <Button 
                    onClick={resetQuestion}
                    variant="outline"
                    className="h-12 px-6 rounded-2xl min-w-[100px]"
                  >
                    Reset
                  </Button>
                </div>
              )}
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