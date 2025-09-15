import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Confetti from "@/components/Confetti";

type GamePhase = 'start' | 'intro' | 'collection' | 'learning' | 'complete';

interface GameState {
  mammals: number;
  birds: number;
  reptiles: number;
  fish: number;
  insects: number;
}

interface Position {
  x: number;
  y: number;
}

interface Animal {
  id: string;
  type: keyof GameState;
  position: Position;
  emoji: string;
  color: string;
}

interface Hunter {
  id: string;
  position: Position;
  emoji: string;
  direction: 'up' | 'down' | 'left' | 'right';
}

interface WholeExercise {
  targetType: keyof GameState;
  percentage: number;
  partCount: number;
  wholeCount: number;
  id: string;
}

const GRID_SIZE = 15; // Smaller grid for tablet optimization

// Remove dynamic sizing - use CSS instead

const WholeFromPercentage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Game phases
  const [phase, setPhase] = useState<GamePhase>('start');
  
  // Collection game state
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [lives, setLives] = useState(9);
  const [collected, setCollected] = useState<GameState>({
    mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0
  });
  const [totalTarget, setTotalTarget] = useState(20);
  const [walls, setWalls] = useState<Position[]>([]);
  
  // Learning state
  const [exercises, setExercises] = useState<WholeExercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<WholeExercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  // Intro animation states (always declared)
  const [showPartial, setShowPartial] = useState(false);
  const [showWhole, setShowWhole] = useState(false);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Reset intro states when phase changes
  useEffect(() => {
    if (phase !== 'intro') {
      setShowPartial(false);
      setShowWhole(false);
      setShowCalculation(false);
      setShowResult(false);
    }
  }, [phase]);

  // Intro animation effect (always declared)
  useEffect(() => {
    if (phase === 'intro') {
      const timer1 = setTimeout(() => setShowPartial(true), 500);
      const timer2 = setTimeout(() => setShowCalculation(true), 2500);
      const timer3 = setTimeout(() => setShowWhole(true), 4000);
      const timer4 = setTimeout(() => setShowResult(true), 5500);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    }
  }, [phase]);

  const animalConfig = {
    mammals: { emoji: '🐘', color: '#ef4444' },
    birds: { emoji: '🦅', color: '#3b82f6' },
    reptiles: { emoji: '🐍', color: '#22c55e' },
    fish: { emoji: '🐟', color: '#06b6d4' },
    insects: { emoji: '🐛', color: '#eab308' }
  };

  const generateWalls = useCallback(() => {
    const newWalls: Position[] = [];
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

  const isWall = useCallback((pos: Position) => {
    return walls.some(wall => wall.x === pos.x && wall.y === pos.y);
  }, [walls]);

  const generateAnimals = useCallback((wallPositions: Position[]) => {
    const newAnimals: Animal[] = [];
    const animalTypes = Object.keys(animalConfig) as Array<keyof GameState>;
    
    const animalDistributions = [
      { total: 25, counts: [1, 3, 4, 7, 10] },
      { total: 25, counts: [2, 4, 5, 6, 8] },
      { total: 50, counts: [3, 7, 9, 11, 20] },
      { total: 50, counts: [4, 6, 10, 12, 18] },
      { total: 100, counts: [5, 15, 20, 25, 35] },
      { total: 20, counts: [1, 2, 3, 5, 9] }
    ];
    
    const selectedDistribution = animalDistributions[Math.floor(Math.random() * animalDistributions.length)];
    setTotalTarget(selectedDistribution.total);
    
    const isWallPosition = (pos: Position) => {
      return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
    };
    
    let animalIndex = 0;
    animalTypes.forEach((type, typeIndex) => {
      const count = selectedDistribution.counts[typeIndex];
      const config = animalConfig[type];
      for (let i = 0; i < count; i++) {
        let position: Position;
        let attempts = 0;
        do {
          position = {
            x: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1,
            y: Math.floor(Math.random() * (GRID_SIZE - 2)) + 1
          };
          attempts++;
        } while ((position.x === 1 && position.y === 1 || isWallPosition(position) || 
                  newAnimals.some(animal => animal.position.x === position.x && animal.position.y === position.y)) 
                  && attempts < 50);
        
        newAnimals.push({
          id: `${type}-${animalIndex}`,
          type,
          position,
          emoji: config.emoji,
          color: config.color
        });
        animalIndex++;
      }
    });
    setAnimals(newAnimals);
  }, []);

  const generateHunters = useCallback((wallPositions: Position[]) => {
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

  const generateExercises = useCallback(() => {
    const animalTypes = Object.keys(collected) as Array<keyof GameState>;
    const availableTypes = animalTypes.filter(type => collected[type] > 0);
    
    if (availableTypes.length === 0) return [];
    
    const totalCollected = Object.values(collected).reduce((sum, count) => sum + count, 0);
    const newExercises: WholeExercise[] = [];
    
    // Sort animal types by count (descending) to pick the most collected ones
    const sortedTypes = availableTypes.sort((a, b) => collected[b] - collected[a]);
    
    for (let i = 0; i < Math.min(3, sortedTypes.length); i++) {
      const type = sortedTypes[i];
      const actualPartCount = collected[type];
      // Calculate the real percentage of this animal type from the total collected
      const actualPercentage = Math.round((actualPartCount / totalCollected) * 100);
      
      newExercises.push({
        id: `exercise-${i}`,
        targetType: type,
        percentage: actualPercentage,
        partCount: actualPartCount, // This is the answer - the actual count collected
        wholeCount: totalCollected // The total animals collected (known value)
      });
    }
    
    return newExercises;
  }, [collected]);

  const startGame = () => {
    setPhase('collection');
    setPlayerPosition({ x: 1, y: 1 });
    setLives(9);
    setCollected({ mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0 });
    
    const newWalls = generateWalls();
    setWalls(newWalls);
    generateAnimals(newWalls);
    generateHunters(newWalls);
  };

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

  // Hunter movement and collision logic
  useEffect(() => {
    if (phase !== 'collection' || hunters.length === 0) return;
    
    const interval = setInterval(() => {
      setHunters(prevHunters => prevHunters.map(hunter => {
        const directions = ['up', 'down', 'left', 'right'] as const;
        let newPosition = { ...hunter.position };
        let newDirection = hunter.direction;
        
        if (Math.random() < 0.6) {
          const dx = playerPosition.x - hunter.position.x;
          const dy = playerPosition.y - hunter.position.y;
          
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
            newPosition.y = Math.min(GRID_SIZE - 1, hunter.position.y + 1);
            break;
          case 'left':
            newPosition.x = Math.max(0, hunter.position.x - 1);
            break;
          case 'right':
            newPosition.x = Math.min(GRID_SIZE - 1, hunter.position.x + 1);
            break;
        }
        
        if (isWall(newPosition)) {
          newPosition = hunter.position;
        }
        
        return { ...hunter, position: newPosition, direction: newDirection };
      }));
    }, 180);
    
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

  // Keyboard controls
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

  // Animal collection
  useEffect(() => {
    const animalAtPosition = animals.find(animal => 
      animal.position.x === playerPosition.x && animal.position.y === playerPosition.y
    );
    
    if (animalAtPosition) {
      setAnimals(prev => prev.filter(animal => animal.id !== animalAtPosition.id));
      setCollected(prev => ({
        ...prev,
        [animalAtPosition.type]: prev[animalAtPosition.type] + 1
      }));
    }
  }, [playerPosition, animals]);

  // Check collection completion
  const totalCollected = Object.values(collected).reduce((sum, count) => sum + count, 0);
  const isCollectionComplete = totalCollected === totalTarget && phase === 'collection';

  useEffect(() => {
    if (isCollectionComplete) {
      setTimeout(() => {
        setPhase('intro'); // Show example first
      }, 1000);
    }
  }, [isCollectionComplete]);

  const autoComplete = () => {
    if (phase !== 'collection') return;
    
    // Collect all remaining animals
    const remainingAnimals = [...animals];
    remainingAnimals.forEach(animal => {
      setCollected(prev => ({
        ...prev,
        [animal.type]: prev[animal.type] + 1
      }));
    });
    
    // Clear all animals from the board
    setAnimals([]);
    
    toast({
      title: "🎉 Auto Complete!",
      description: "All animals collected automatically!",
      duration: 3000
    });
  };

  const handleAnswerSubmit = () => {
    if (!currentExercise) return;
    
    const isCorrect = true; // Simplified since we're removing the interactive pie chart
    
    if (isCorrect) {
      setShowAnswer(true);
      setShowConfetti(true);
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      
      toast({
        title: "🎉 Correct!",
        description: `${currentExercise.wholeCount} × ${currentExercise.percentage}% = ${currentExercise.partCount}`,
        duration: 3000
      });
      
      setTimeout(() => {
        setShowConfetti(false);
        setShowAnswer(false);
        
        const nextExercise = exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id);
        if (nextExercise) {
          setCurrentExercise(nextExercise);
        } else {
          setPhase('complete');
        }
      }, 3000);
    }
  };


  // Render different phases
  if (phase === 'start') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4 max-h-screen overflow-hidden">
        <Card className="p-6 lg:p-8 text-center w-full max-w-lg shadow-lg rounded-2xl">
          <div className="text-5xl lg:text-6xl mb-4">🔍</div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-3 text-gray-800">🐘 Find the Whole Game</h1>
          <p className="text-lg text-muted-foreground mb-6">Collect animals, then find the whole from parts!</p>
          <Button onClick={startGame} className="w-full text-lg lg:text-xl py-4 px-6 h-12 lg:h-14 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Play className="mr-2 h-5 w-5" />
            Start Adventure
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'intro') {
    // Use actual collected data for the example
    const animalTypes = Object.keys(collected) as Array<keyof GameState>;
    const availableTypes = animalTypes.filter(type => collected[type] > 0);
    const exampleType = availableTypes.sort((a, b) => collected[b] - collected[a])[0]; // Highest count
    const exampleCount = collected[exampleType];
    const examplePercentage = Math.round((exampleCount / totalCollected) * 100);
    const exampleConfig = animalConfig[exampleType];
    
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-3 lg:p-4 overflow-hidden flex items-center justify-center max-h-screen">
        <Card className="p-4 lg:p-6 bg-white/90 backdrop-blur-sm w-full max-w-4xl shadow-xl rounded-2xl max-h-full overflow-hidden">
          <div className="text-center space-y-3 lg:space-y-4 h-full flex flex-col justify-center">
            
            {/* Compact Learning Goal */}
            <div className={`transition-all duration-1000 ${showPartial ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="text-3xl lg:text-4xl mb-2">🔍</div>
              <h3 className="text-xl lg:text-2xl font-bold text-purple-800 mb-2">🎯 Learning Goal</h3>
              <div className="text-base lg:text-lg text-purple-700 mb-3">
                Find the number from percentage
              </div>
              
              {/* Compact Visual Example */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 lg:p-4 rounded-xl border-2 border-purple-200">
                <div className="grid grid-cols-5 gap-2 lg:gap-3 items-center justify-items-center mb-3">
                  <div className="bg-blue-100 px-2 lg:px-3 py-2 rounded-lg border border-blue-300 text-center">
                    <div className="text-xs font-semibold text-blue-600">Total</div>
                    <div className="text-lg lg:text-xl font-bold text-blue-800">20</div>
                  </div>
                  <div className="text-lg lg:text-xl text-gray-500">×</div>
                  <div className="bg-purple-100 px-2 lg:px-3 py-2 rounded-lg border border-purple-300 text-center">
                    <div className="text-xs font-semibold text-purple-600">%</div>
                    <div className="text-lg lg:text-xl font-bold text-purple-800">40%</div>
                  </div>
                  <div className="text-lg lg:text-xl text-gray-500">=</div>
                  <div className="bg-green-100 px-2 lg:px-3 py-2 rounded-lg border border-green-300 text-center">
                    <div className="text-xs font-semibold text-green-600">🐘</div>
                    <div className="text-lg lg:text-xl font-bold text-green-800">?</div>
                  </div>
                </div>
                <div className="text-sm lg:text-base text-gray-700">
                  If 40% of 20 animals are 🐘, how many 🐘?
                </div>
              </div>
            </div>

            {/* Compact calculation */}
            <div className={`transition-all duration-1000 ${showCalculation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="flex items-center justify-center gap-2 lg:gap-3 text-lg lg:text-xl mb-2">
                <div className="bg-purple-100 px-2 py-1 rounded-full animate-pulse">
                  <span className="text-sm lg:text-base">🎯 {totalCollected}</span>
                </div>
                <span>×</span>
                <div className="bg-pink-100 px-2 py-1 rounded-full animate-pulse">
                  <span className="text-sm lg:text-base">📊 {examplePercentage}%</span>
                </div>
                <span>=</span>
                <div className="bg-yellow-100 px-2 py-1 rounded-full animate-bounce">
                  <span className="text-sm lg:text-base">❓</span>
                </div>
              </div>
              <div className="text-xs lg:text-sm text-gray-600">Whole × Percentage = Part</div>
            </div>

            {/* Compact result */}
            <div className={`transition-all duration-1000 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
              <div className="bg-gradient-to-r from-green-200 to-emerald-200 px-4 py-2 rounded-full inline-block animate-bounce">
                <div className="text-2xl lg:text-3xl font-bold text-green-700">8 🐘</div>
              </div>
              <div className="text-xl lg:text-2xl mt-1">🎉</div>
            </div>

            {/* Compact Navigation */}
            <div className="flex gap-3 justify-center mt-4">
              <Button 
                onClick={() => setPhase('start')} 
                variant="outline"
                className="text-base py-3 px-4 h-12 rounded-xl"
              >
                ← Back
              </Button>
              <Button 
                onClick={() => {
                  const newExercises = generateExercises();
                  setExercises(newExercises);
                  setCurrentExercise(newExercises[0] || null);
                  setPhase('learning');
                }} 
                className="text-base lg:text-lg py-3 px-6 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                🚀 Start Learning
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'collection') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-3 lg:p-4 overflow-hidden flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          
          {/* Compact Header */}
          <div className="text-center mb-3">
            <h2 className="text-lg lg:text-xl font-bold mb-2 text-gray-800">🔍 Collect Animals</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4 mb-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-sm lg:text-base">
                    {i < lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <div className="bg-white/80 px-3 py-1 rounded-full border">
                <span className="text-sm lg:text-base font-semibold">
                  {totalCollected} / {totalTarget}
                </span>
              </div>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                size="sm"
                className="text-xs lg:text-sm px-2 py-1 h-8 rounded-lg"
                disabled={animals.length === 0}
              >
                Skip
              </Button>
            </div>
          </div>

          {/* Optimized Game Grid */}
          <div className="flex-1 flex justify-center items-center min-h-0">
            <Card className="w-full aspect-square max-w-md lg:max-w-lg shadow-lg rounded-2xl overflow-hidden">
              <div className="relative bg-muted h-full p-2">
                <div 
                  className="grid gap-px relative w-full h-full"
                  style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
                >
                  {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
                    const x = index % GRID_SIZE;
                    const y = Math.floor(index / GRID_SIZE);
                    const isWallCell = isWall({ x, y });
                    const isPlayer = playerPosition.x === x && playerPosition.y === y;
                    const animal = animals.find(a => a.position.x === x && a.position.y === y);
                    const hunter = hunters.find(h => h.position.x === x && h.position.y === y);
                    
                    return (
                      <div
                        key={index}
                        className={`
                          border border-border/20 flex items-center justify-center text-xs lg:text-sm
                          ${isWallCell ? 'bg-stone-600' : 'bg-background/50'}
                          transition-colors hover:bg-background/70
                        `}
                        style={{ aspectRatio: '1' }}
                      >
                        {isPlayer && <span className="text-sm lg:text-base">🧑</span>}
                        {animal && <span className="text-sm lg:text-base">{animal.emoji}</span>}
                        {hunter && <span className="text-sm lg:text-base">{hunter.emoji}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Compact Controls */}
          <div className="text-center mt-2">
            <p className="text-xs lg:text-sm text-muted-foreground">
              Use WASD or arrow keys • Avoid hunters • Collect all animals!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'learning') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-3 lg:p-4 overflow-hidden flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full min-h-0">
          
          {/* Compact Header */}
          <Card className="p-3 lg:p-4 mb-3 bg-white/80 backdrop-blur-sm shadow-md rounded-xl">
            <div className="flex items-center justify-between">
              <h1 className="text-lg lg:text-xl font-bold text-gray-800">
                🧮 Find the Part from %
              </h1>
              <div className="text-sm lg:text-base text-gray-600 bg-purple-100 px-3 py-1 rounded-full">
                {completedExercises.length} / {exercises.length}
              </div>
            </div>
          </Card>

          {currentExercise && (
            <Card className="flex-1 p-4 lg:p-6 text-center shadow-lg rounded-2xl overflow-hidden">
              <div className="h-full flex flex-col justify-between">
                
                {/* Animal & Question - Compact */}
                <div className="mb-4">
                  <div className="text-3xl lg:text-4xl mb-2">
                    {animalConfig[currentExercise.targetType].emoji}
                  </div>
                  <h2 className="text-base lg:text-lg font-bold text-gray-700 mb-3">
                    How many {animalConfig[currentExercise.targetType].emoji}?
                  </h2>
                </div>

                {/* Compact Problem Layout */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 lg:p-4 rounded-xl mb-4 flex-1 flex flex-col justify-center">
                  
                  {/* Problem Statement */}
                  <div className="grid grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-3 items-center justify-items-center mb-3">
                    <div className="bg-blue-100 px-2 lg:px-3 py-2 rounded-lg border text-center">
                      <div className="text-xs font-semibold text-blue-600">Total</div>
                      <div className="text-lg lg:text-xl font-bold text-blue-800">{currentExercise.wholeCount}</div>
                    </div>
                    <div className="text-lg lg:text-xl text-gray-500">×</div>
                    <div className="bg-purple-100 px-2 lg:px-3 py-2 rounded-lg border text-center">
                      <div className="text-xs font-semibold text-purple-600">%</div>
                      <div className="text-lg lg:text-xl font-bold text-purple-800">{currentExercise.percentage}%</div>
                    </div>
                    <div className="text-lg lg:text-xl text-gray-500 hidden lg:block">=</div>
                    <div className={`px-2 lg:px-3 py-2 rounded-lg border text-center transition-all ${
                      showAnswer 
                        ? 'bg-green-100 border-green-300' 
                        : 'bg-gray-100 border-gray-300'
                    } ${!showAnswer ? 'lg:col-start-4 col-start-2' : ''}`}>
                      <div className="text-xs font-semibold text-gray-600">Answer</div>
                      <div className={`text-lg lg:text-xl font-bold ${
                        showAnswer ? 'text-green-800' : 'text-gray-500'
                      }`}>
                        {showAnswer ? currentExercise.partCount : '?'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm lg:text-base text-gray-600 mb-2">
                    {currentExercise.wholeCount} total × {currentExercise.percentage}% = ? {animalConfig[currentExercise.targetType].emoji}
                  </div>
                </div>

                {/* Action Button */}
                <div className="space-y-3">
                  {!showAnswer && (
                    <Button 
                      onClick={() => {
                        setShowAnswer(true);
                        setShowConfetti(true);
                        setCompletedExercises(prev => [...prev, currentExercise.id]);
                        
                        toast({
                          title: "🎉 Correct!",
                          description: `${currentExercise.wholeCount} × ${currentExercise.percentage}% = ${currentExercise.partCount}`,
                          duration: 3000
                        });
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-base lg:text-lg py-3 px-6 h-12 lg:h-14 rounded-xl w-full"
                    >
                      Calculate Answer
                    </Button>
                  )}

                  {/* Compact Answer Display */}
                  {showAnswer && (
                    <div className="space-y-3">
                      <div className="bg-green-50 p-3 lg:p-4 rounded-lg border border-green-200">
                        <div className="text-lg lg:text-xl font-bold text-green-700 mb-1">
                          🎉 {currentExercise.partCount} {animalConfig[currentExercise.targetType].emoji}
                        </div>
                        <div className="text-sm lg:text-base text-green-600 mb-2">
                          {currentExercise.wholeCount} × {currentExercise.percentage}% = {currentExercise.partCount}
                        </div>
                        <div className="text-lg lg:text-xl">
                          {Array.from({ length: Math.min(currentExercise.partCount, 8) }, (_, i) => animalConfig[currentExercise.targetType].emoji).join('')}
                          {currentExercise.partCount > 8 && '...'}
                        </div>
                      </div>

                      <Button 
                        onClick={() => {
                          setShowAnswer(false);
                          setShowConfetti(false);
                          
                          const nextExercise = exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id);
                          if (nextExercise) {
                            setCurrentExercise(nextExercise);
                          } else {
                            setPhase('complete');
                          }
                        }}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-base lg:text-lg py-3 px-6 h-12 lg:h-14 rounded-xl w-full"
                      >
                        {exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id) ? 
                          'Next Animal →' : 'Complete! 🎊'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4 overflow-hidden max-h-screen">
        <Card className="p-6 lg:p-8 text-center w-full max-w-lg shadow-xl rounded-2xl">
          <div className="text-4xl lg:text-5xl mb-4">🎊</div>
          <h2 className="text-xl lg:text-2xl font-bold text-green-700 mb-3">
            Whole Number Mastery Complete!
          </h2>
          <p className="text-base lg:text-lg text-green-600 mb-6">
            You've mastered finding parts from percentages!
          </p>
          <Button 
            onClick={() => navigate('/percentage-difference')}
            className="w-full text-lg lg:text-xl py-4 px-6 h-14 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
          >
            Next Challenge <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return null;
};

export default WholeFromPercentage;