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

const GRID_SIZE = 16;
const TARGET_ITEMS = 9;

interface Hunter {
  id: string;
  position: { x: number; y: number };
  emoji: string;
  direction: 'up' | 'down' | 'left' | 'right';
}

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
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [lives, setLives] = useState(9);
  const [collectedCount, setCollectedCount] = useState(0);

  // Examples state
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [showStep1, setShowStep1] = useState(false);
  const [showStep2, setShowStep2] = useState(false);
  const [showStep3, setShowStep3] = useState(false);

  // Drag-drop state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepCompleted, setStepCompleted] = useState<{[key: number]: boolean}>({});

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
        // Border walls
        if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
          newWalls.push({ x, y });
        } 
        // Reduced obstacles - fewer patterns and lower random chance
        else if ((x % 6 === 3 && y % 6 === 3) || 
                 (Math.random() > 0.93)) {
          // Don't place walls that could trap the player near start position
          if (!(x <= 3 && y <= 3)) {
            newWalls.push({ x, y });
          }
        }
      }
    }
    return newWalls;
  }, []);

  // Generate price items for collection
  const generatePriceItems = useCallback((wallPositions: { x: number; y: number }[]) => {
    const items: PriceItem[] = [];
    const itemTypes = Object.keys(itemConfig);
    const stores = Object.keys(storeConfig);

    const isWallPosition = (pos: { x: number; y: number }) => {
      return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
    };

    for (let i = 0; i < TARGET_ITEMS; i++) {
      const itemType = itemTypes[i % itemTypes.length];
      const store = stores[Math.floor(i / 3) % stores.length];
      
      // Generate realistic price changes
      const basePrice = 100 + Math.floor(Math.random() * 900);
      const priceChange = 0.1 + Math.random() * 0.4; // 10-50% change
      const isIncrease = Math.random() > 0.5;
      
      const oldPrice = isIncrease ? basePrice : Math.round(basePrice * (1 + priceChange));
      const newPrice = isIncrease ? Math.round(basePrice * (1 + priceChange)) : basePrice;

      // Find valid position - avoid walls and other items
      let position;
      let attempts = 0;
      do {
        position = {
          x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
          y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
        };
        attempts++;
      } while (
        (position.x === 1 && position.y === 1 || // Avoid player start position
         isWallPosition(position) ||
         items.some(item => item.position.x === position.x && item.position.y === position.y)) 
         && attempts < 50
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
  }, []);

  // Generate hunters
  const generateHunters = useCallback((wallPositions: { x: number; y: number }[]) => {
    const newHunters: Hunter[] = [];
    const hunterEmojis = ['🐺', '🦖'];
    
    const isWallPosition = (pos: { x: number; y: number }) => {
      return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
    };
    
    for (let i = 0; i < 2; i++) {
      let position: { x: number; y: number };
      let attempts = 0;
      do {
        position = {
          x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
          y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
        };
        attempts++;
      } while ((position.x === 1 && position.y === 1 || isWallPosition(position) || 
                newHunters.some(hunter => hunter.position.x === position.x && hunter.position.y === position.y)) 
                && attempts < 50);
      
      newHunters.push({
        id: `hunter-${i}`,
        position,
        emoji: hunterEmojis[i],
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as any
      });
    }
    setHunters(newHunters);
  }, []);

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
      const items = generatePriceItems(newWalls);
      setPriceItems(items);
      generateHunters(newWalls);
    }, 100);
    
    setPlayerPosition({ x: 1, y: 1 });
    setLives(9);
    setCollectedPrices({});
    setCollectedCount(0);
    setPhase('collection');
  };

  // Player movement
  const movePlayer = useCallback((direction: string) => {
    if (phase !== 'collection') return;
    
    setPlayerPosition(prev => {
      let newX = prev.x;
      let newY = prev.y;
      
      switch (direction) {
        case 'up':
        case 'w':
          newY = Math.max(0, prev.y - 1);
          break;
        case 'down':
        case 's':
          newY = Math.min(GRID_SIZE - 1, prev.y + 1);
          break;
        case 'left':
        case 'a':
          newX = Math.max(0, prev.x - 1);
          break;
        case 'right':
        case 'd':
          newX = Math.min(GRID_SIZE - 1, prev.x + 1);
          break;
      }
      
      const newPos = { x: newX, y: newY };
      if (isWall(newPos)) {
        return prev;
      }
      return newPos;
    });
  }, [phase, isWall]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        e.preventDefault();
        const direction = key.replace('arrow', '');
        movePlayer(direction);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [movePlayer]);

  // Hunter movement and collision logic
  useEffect(() => {
    if (phase !== 'collection' || hunters.length === 0) return;
    
    const interval = setInterval(() => {
      setHunters(prevHunters => prevHunters.map(hunter => {
        const directions = ['up', 'down', 'left', 'right'] as const;
        let newPosition = { ...hunter.position };
        let newDirection = hunter.direction;
        
        // More focused tracking (80% chance to move toward player)
        if (Math.random() < 0.8) {
          const dx = playerPosition.x - hunter.position.x;
          const dy = playerPosition.y - hunter.position.y;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            newDirection = dx > 0 ? 'right' : 'left';
          } else if (dy !== 0) {
            newDirection = dy > 0 ? 'down' : 'up';
          }
        } else {
          // Small chance for random movement to prevent getting stuck
          newDirection = directions[Math.floor(Math.random() * directions.length)];
        }
        
        switch (newDirection) {
          case 'up':
            newPosition.y = Math.max(0, hunter.position.y - 1);
            break;
          case 'down':
            newPosition.y = Math.min(GRID_SIZE - 1, hunter.position.y + 1);
            break;
          case 'left':
            newPosition.x = Math.max(0, hunter.position.x - 1);
            break;
          case 'right':
            newPosition.x = Math.min(GRID_SIZE - 1, hunter.position.x + 1);
            break;
        }
        
        // If blocked, try alternative directions instead of staying put
        if (isWall(newPosition)) {
          const alternativeDirections = directions.filter(dir => dir !== newDirection);
          for (const altDir of alternativeDirections) {
            let altPosition = { ...hunter.position };
            switch (altDir) {
              case 'up':
                altPosition.y = Math.max(0, hunter.position.y - 1);
                break;
              case 'down':
                altPosition.y = Math.min(GRID_SIZE - 1, hunter.position.y + 1);
                break;
              case 'left':
                altPosition.x = Math.max(0, hunter.position.x - 1);
                break;
              case 'right':
                altPosition.x = Math.min(GRID_SIZE - 1, hunter.position.x + 1);
                break;
            }
            if (!isWall(altPosition)) {
              newPosition = altPosition;
              newDirection = altDir;
              break;
            }
          }
          // If all directions blocked, stay in place
          if (isWall(newPosition)) {
            newPosition = hunter.position;
          }
        }
        
        return { ...hunter, position: newPosition, direction: newDirection };
      }));
    }, 350); // Smoother movement timing
    
    return () => clearInterval(interval);
  }, [phase, hunters.length, isWall, playerPosition]);

  // Hunter collision
  useEffect(() => {
    const hunterAtPosition = hunters.find(hunter => 
      hunter.position.x === playerPosition.x && hunter.position.y === playerPosition.y
    );
    
    if (hunterAtPosition && phase === 'collection') {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setPhase('start');
          toast({
            title: "💀 Game Over!",
            description: "Better luck next time!",
            duration: 3000
          });
        } else {
          setPlayerPosition({ x: 1, y: 1 });
          toast({
            title: `💔 Hit by ${hunterAtPosition.emoji}!`,
            description: `${newLives} lives remaining`,
            duration: 2000
          });
        }
        return newLives;
      });
    }
  }, [playerPosition, hunters, phase, toast]);

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
    setShowStep1(false);
    setShowStep2(false);
    setShowStep3(false);
  }, [currentExampleIndex]);

  // Handle example interactions
  const handleShowCalculation = () => {
    setShowCalculation(true);
    // Show steps progressively
    setTimeout(() => setShowStep1(true), 500);
    setTimeout(() => setShowStep2(true), 1500);
    setTimeout(() => setShowStep3(true), 2500);
    setTimeout(() => setShowResult(true), 3500);
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

    // Check if this is the correct step
    if (zone === 'step1' && currentStep === 1) {
      const difference = Math.abs(currentQuestion.newPrice - currentQuestion.oldPrice);
      if (draggedItem === `$${difference}`) {
        const updatedItems = droppedItems.filter(item => item.zone !== zone);
        updatedItems.push({ zone, item: draggedItem });
        setDroppedItems(updatedItems);
        setStepCompleted(prev => ({...prev, 1: true}));
        setCurrentStep(2);
        toast({
          title: "Step 1 Complete! ✅",
          description: "Now divide by the base price"
        });
      } else {
        toast({
          title: "Not quite right 🤔",
          description: "Check the difference calculation",
          variant: "destructive"
        });
      }
    } else if (zone === 'step2' && currentStep === 2) {
      const basePrice = currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice;
      if (draggedItem === `$${basePrice}`) {
        const updatedItems = droppedItems.filter(item => item.zone !== zone);
        updatedItems.push({ zone, item: draggedItem });
        setDroppedItems(updatedItems);
        setStepCompleted(prev => ({...prev, 2: true}));
        setCurrentStep(3);
        toast({
          title: "Step 2 Complete! ✅",
          description: "Now multiply by 100"
        });
      } else {
        toast({
          title: "Not quite right 🤔", 
          description: "Use the correct base price for division",
          variant: "destructive"
        });
      }
    } else if (zone === 'step3' && currentStep === 3) {
      if (draggedItem === '100') {
        const updatedItems = droppedItems.filter(item => item.zone !== zone);
        updatedItems.push({ zone, item: draggedItem });
        setDroppedItems(updatedItems);
        setStepCompleted(prev => ({...prev, 3: true}));
        
        // Complete the question
        setCompletedQuestions(prev => [...prev, currentQuestion.id]);
        setShowConfetti(true);
        setShowQuestionResult(true);
        setTimeout(() => setShowConfetti(false), 2000);
        
        toast({
          title: "Perfect! 🎉",
          description: `The ${currentQuestion.name} ${currentQuestion.isIncrease ? 'increased' : 'decreased'} by ${currentQuestion.correctAnswer}%`,
        });
      } else {
        toast({
          title: "Not quite right 🤔",
          description: "Multiply by 100 to get the percentage",
          variant: "destructive"
        });
      }
    }
    
    setDraggedItem(null);
  };


  const handleNextQuestion = () => {
    if (currentQuestionIndex < dragDropQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setDroppedItems([]);
      setShowQuestionResult(false);
      setCurrentStep(1);
      setStepCompleted({});
    } else {
      // Game completed - show congratulations
      setPhase('complete');
    }
  };

  const resetQuestion = () => {
    setDroppedItems([]);
    setShowQuestionResult(false);
    setCurrentStep(1);
    setStepCompleted({});
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
              <div className="flex items-center gap-1 bg-white/95 px-4 py-2 rounded-2xl border-2 border-purple-200 shadow-sm backdrop-blur-sm">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-lg">
                    {i < lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
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
                    const hunter = hunters.find(h => h.position.x === x && h.position.y === y);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          border border-purple-200/50 flex items-center justify-center text-sm rounded-sm
                          ${isWallCell ? 'bg-purple-600 shadow-inner' : 'bg-white/80 hover:bg-white/90'}
                          transition-all duration-200 relative
                        `}
                        style={{ aspectRatio: '1' }}
                      >
                        {isPlayer && <span className="text-sm drop-shadow-sm">🛒</span>}
                        {item && <span className="text-sm drop-shadow-sm animate-bounce">{item.emoji}</span>}
                        {hunter && (
                          <div className="w-full h-full bg-red-500 rounded-full flex items-center justify-center shadow-lg border-2 border-red-600">
                            <span className="text-xs drop-shadow-sm">{hunter.emoji}</span>
                          </div>
                        )}
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
                  <span className="text-lg font-medium">Use WASD or Arrow Keys to move 🛒 • Avoid Hunters!</span>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    {/* Step 1 - Find Difference */}
                    {showStep1 && (
                      <div className="bg-blue-50 p-3 rounded-lg border-2 border-blue-200 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                          <h4 className="text-sm font-bold text-blue-800">Find difference</h4>
                        </div>
                        <div className="bg-white p-2 rounded border border-blue-200 text-center">
                          <div className="text-xs mb-1 text-blue-600">
                            ${currentExample.newPrice} - ${currentExample.oldPrice}
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            = ${Math.abs(currentExample.newPrice - currentExample.oldPrice)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2 - Divide by Base Price */}
                    {showStep2 && (
                      <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-200 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                          <h4 className="text-sm font-bold text-purple-800">Divide by {currentExample.isIncrease ? 'original' : 'final'}</h4>
                        </div>
                        <div className="bg-white p-2 rounded border border-purple-200 text-center">
                          <div className="text-xs mb-1 text-purple-600">
                            ${Math.abs(currentExample.newPrice - currentExample.oldPrice)} ÷ ${currentExample.isIncrease ? currentExample.oldPrice : currentExample.newPrice}
                          </div>
                          <div className="text-sm font-bold text-purple-600">
                            = {(Math.abs(currentExample.newPrice - currentExample.oldPrice) / (currentExample.isIncrease ? currentExample.oldPrice : currentExample.newPrice)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 3 - Multiply by 100 */}
                    {showStep3 && (
                      <div className="bg-pink-50 p-3 rounded-lg border-2 border-pink-200 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                          <h4 className="text-sm font-bold text-pink-800">× 100</h4>
                        </div>
                        <div className="bg-white p-2 rounded border border-pink-200 text-center">
                          <div className="text-xs mb-1 text-pink-600">
                            {(Math.abs(currentExample.newPrice - currentExample.oldPrice) / (currentExample.isIncrease ? currentExample.oldPrice : currentExample.newPrice)).toFixed(2)} × 100
                          </div>
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded text-sm">
                            <span className="font-bold">= {currentExample.percentageChange}%</span>
                          </div>
                        </div>
                      </div>
                    )}
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

              {/* Drag Drop Interface - 3 Steps */}
              <div className="flex-1 flex flex-col justify-center">
                
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold">Complete the 3-step calculation:</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  {/* Step 1 - Find Difference */}
                  <div className={`bg-blue-50 p-4 rounded-lg border-2 transition-colors ${
                    currentStep >= 1 ? 'border-blue-500' : 'border-blue-200 opacity-60'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <h4 className="text-sm font-bold text-blue-800">Find difference</h4>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200 text-center">
                      <div className="text-xs mb-2 text-blue-600">
                        ${currentQuestion.isIncrease ? currentQuestion.newPrice : currentQuestion.oldPrice} - ${currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice}
                      </div>
                      <div className="text-sm font-bold text-blue-600 mb-2">= $</div>
                      <div
                        className={`w-16 h-10 border-2 border-dashed rounded-lg bg-white mx-auto flex items-center justify-center text-sm font-bold transition-colors ${
                          currentStep >= 1 ? 'border-blue-400 hover:border-blue-500' : 'border-gray-300'
                        }`}
                        onDragOver={currentStep >= 1 ? handleDragOver : undefined}
                        onDrop={currentStep >= 1 ? (e) => handleDrop(e, 'step1') : undefined}
                      >
                        {droppedItems.find(item => item.zone === 'step1')?.item || '?'}
                      </div>
                    </div>
                  </div>

                  {/* Step 2 - Divide by Base Price */}
                  <div className={`bg-purple-50 p-4 rounded-lg border-2 transition-colors ${
                    currentStep >= 2 ? 'border-purple-500' : 'border-purple-200 opacity-60'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <h4 className="text-sm font-bold text-purple-800">Divide by base</h4>
                    </div>
                    <div className="bg-white p-3 rounded border border-purple-200 text-center">
                      <div className="text-xs mb-2 text-purple-600">
                        {stepCompleted[1] ? droppedItems.find(item => item.zone === 'step1')?.item || '$??' : '$??'} ÷ $
                      </div>
                      <div
                        className={`w-16 h-10 border-2 border-dashed rounded-lg bg-white mx-auto mb-2 flex items-center justify-center text-sm font-bold transition-colors ${
                          currentStep >= 2 ? 'border-purple-400 hover:border-purple-500' : 'border-gray-300'
                        }`}
                        onDragOver={currentStep >= 2 ? handleDragOver : undefined}
                        onDrop={currentStep >= 2 ? (e) => handleDrop(e, 'step2') : undefined}
                      >
                        {droppedItems.find(item => item.zone === 'step2')?.item || '?'}
                      </div>
                      <div className="text-sm font-bold text-purple-600">= 
                        {stepCompleted[2] ? (
                          <span className="ml-1">
                            {(parseInt(droppedItems.find(item => item.zone === 'step1')?.item?.replace('$', '') || '0') / 
                              parseInt(droppedItems.find(item => item.zone === 'step2')?.item?.replace('$', '') || '1')).toFixed(2)}
                          </span>
                        ) : ' ??'}
                      </div>
                    </div>
                  </div>

                  {/* Step 3 - Multiply by 100 */}
                  <div className={`bg-pink-50 p-4 rounded-lg border-2 transition-colors ${
                    currentStep >= 3 ? 'border-pink-500' : 'border-pink-200 opacity-60'
                  }`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <h4 className="text-sm font-bold text-pink-800">× 100</h4>
                    </div>
                    <div className="bg-white p-3 rounded border border-pink-200 text-center">
                      <div className="text-xs mb-2 text-pink-600">
                        {stepCompleted[2] ? 
                          `${(parseInt(droppedItems.find(item => item.zone === 'step1')?.item?.replace('$', '') || '0') / 
                            parseInt(droppedItems.find(item => item.zone === 'step2')?.item?.replace('$', '') || '1')).toFixed(2)} × ` 
                          : '?? × '
                        }
                      </div>
                      <div
                        className={`w-12 h-10 border-2 border-dashed rounded-lg bg-white mx-auto mb-2 flex items-center justify-center text-sm font-bold transition-colors ${
                          currentStep >= 3 ? 'border-pink-400 hover:border-pink-500' : 'border-gray-300'
                        }`}
                        onDragOver={currentStep >= 3 ? handleDragOver : undefined}
                        onDrop={currentStep >= 3 ? (e) => handleDrop(e, 'step3') : undefined}
                      >
                        {droppedItems.find(item => item.zone === 'step3')?.item || '?'}
                      </div>
                      <div className="text-sm font-bold">
                        {stepCompleted[3] ? (
                          <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-1 rounded">
                            = {currentQuestion.correctAnswer}%
                          </div>
                        ) : (
                          <span className="text-pink-600">= ??%</span>
                        )}
                      </div>
                    </div>
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
                <div className="flex justify-center">
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

  // Complete phase - Game finished with congratulations
  if (phase === 'complete') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex items-center justify-center overflow-hidden">
        <Card className="p-8 max-w-2xl mx-auto text-center shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm border-2">
          <div className="space-y-6">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Congratulations!
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              You've mastered percentage differences! Great job learning how to compare prices and calculate percentage changes.
            </p>
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-2xl mb-6">
              <p className="text-lg font-semibold text-gray-700">
                🎯 You successfully completed all percentage difference challenges!
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xl px-8 py-4 h-16 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
            >
              Return to Main Menu
            </Button>
          </div>
        </Card>
        <Confetti trigger={true} />
      </div>
    );
  }

  return null;
};

export default PercentageDifference;