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

const GRID_SIZE = 20;

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
      <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4 overflow-hidden">
        <Card className="p-6 text-center w-full max-w-md">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-3">🐘 Find the Whole Game</h1>
          <p className="text-base text-muted-foreground mb-4">Collect animals, then find the whole from parts!</p>
          <Button onClick={startGame} className="w-full text-lg py-3">
            <Play className="mr-2 h-4 w-4" />
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
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-2 md:p-4 overflow-hidden flex flex-col max-h-screen">
        <div className="max-w-4xl mx-auto flex-1 flex items-center justify-center min-h-0">
          <Card className="p-4 md:p-8 bg-white/90 backdrop-blur-sm w-full max-h-full overflow-y-auto">
            <div className="text-center space-y-4 md:space-y-6">
              
              {/* Step 1: Show partial pie (known part) */}
              <div className={`transition-all duration-1000 ${showPartial ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="text-4xl md:text-6xl mb-2 md:mb-4">🔍</div>
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 md:p-6 rounded-xl mb-3 md:mb-4 border-2 border-purple-200">
                  <div className="text-center mb-4">
                    <h3 className="text-xl md:text-2xl font-bold text-purple-800 mb-2">🎯 Learning Goal</h3>
                    <div className="text-lg md:text-xl text-purple-700 mb-3">
                      Find the number from percentage
                    </div>
                  </div>
                  
                  {/* Visual Example */}
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center justify-center gap-4 mb-4 flex-wrap">
                      <div className="bg-blue-100 px-4 py-3 rounded-lg border-2 border-blue-300">
                        <div className="text-sm font-semibold text-blue-600">Total Animals</div>
                        <div className="text-3xl font-bold text-blue-800">20</div>
                      </div>
                      <div className="text-2xl text-gray-500">×</div>
                      <div className="bg-purple-100 px-4 py-3 rounded-lg border-2 border-purple-300">
                        <div className="text-sm font-semibold text-purple-600">Percentage</div>
                        <div className="text-3xl font-bold text-purple-800">40%</div>
                      </div>
                      <div className="text-2xl text-gray-500">=</div>
                      <div className="bg-green-100 px-4 py-3 rounded-lg border-2 border-green-300">
                        <div className="text-sm font-semibold text-green-600">🐘 Animals</div>
                        <div className="text-3xl font-bold text-green-800">?</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg text-gray-700 mb-2">
                        If 40% of your 20 animals are 🐘
                      </div>
                      <div className="text-xl font-bold text-purple-700">
                        How many 🐘 do you have?
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Show calculation process */}
              <div className={`transition-all duration-1000 ${showCalculation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex items-center justify-center gap-2 md:gap-4 text-2xl md:text-3xl mb-2 md:mb-4">
                  <div className="bg-purple-100 p-2 md:p-3 rounded-full animate-pulse">
                    <span>🎯</span>
                    <div className="text-sm md:text-base font-bold">{totalCollected}</div>
                  </div>
                  <div className="text-3xl md:text-4xl">×</div>
                  <div className="bg-pink-100 p-2 md:p-3 rounded-full animate-pulse">
                    <span>📊</span>
                    <div className="text-sm md:text-base font-bold">{examplePercentage}%</div>
                  </div>
                  <div className="text-3xl md:text-4xl">=</div>
                  <div className="bg-yellow-100 p-2 md:p-3 rounded-full animate-bounce">
                    <span>❓</span>
                  </div>
                </div>
                <div className="text-sm md:text-base text-gray-600">
                  Formula: Whole × Percentage = Part
                </div>
              </div>

              {/* Step 4: Show result */}
              <div className={`transition-all duration-1000 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-gradient-to-r from-green-200 to-emerald-200 p-3 md:p-4 rounded-full inline-block animate-bounce">
                  <div className="text-3xl md:text-5xl font-bold text-green-700">{exampleCount}</div>
                </div>
                <div className="text-2xl md:text-4xl mt-2">🎉</div>
              </div>

              {/* Navigation */}
              <div className="flex gap-2 md:gap-4 justify-center mt-4 md:mt-6">
                <Button 
                  onClick={() => setPhase('start')} 
                  variant="outline"
                  className="text-sm md:text-base py-2 px-3 md:py-3 md:px-6"
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
                  className="text-sm md:text-lg py-2 px-4 md:py-3 md:px-6 bg-purple-600 hover:bg-purple-700"
                >
                  🚀 Start Learning
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'collection') {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">🔍 Collect Animals for Whole Number Learning</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-lg">
                    {i < lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <p className="text-lg">
                {totalCollected} / {totalTarget} animals
              </p>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                size="sm"
                className="text-sm"
                disabled={animals.length === 0}
              >
                Auto Complete
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-2xl mx-auto">
              <div className="relative bg-muted rounded-xl p-4 aspect-square">
                <div 
                  className="grid gap-px relative w-full h-full"
                  style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
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
                          border border-border/20 flex items-center justify-center text-lg
                          ${isWallCell ? 'bg-stone-600' : 'bg-background/50'}
                        `}
                        style={{ aspectRatio: '1' }}
                      >
                        {isPlayer && <span className="text-xl">🧑</span>}
                        {animal && <span className="text-xl">{animal.emoji}</span>}
                        {hunter && <span className="text-xl">{hunter.emoji}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">Use WASD or arrow keys to move • Avoid hunters • Collect all animals!</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'learning') {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 overflow-hidden flex flex-col">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-center mb-6">
              🧮 Find the Part from Percentage
            </h1>
            <div className="text-center text-lg text-gray-600">
              Progress: {completedExercises.length} / {exercises.length} completed
            </div>
          </Card>

          {currentExercise && (
            <Card className="p-8 text-center">
              
              {/* Current Animal Display */}
              <div className="mb-8">
                <div className="text-6xl mb-4">
                  {animalConfig[currentExercise.targetType].emoji}
                </div>
                <h2 className="text-3xl font-bold mb-6 text-gray-700">
                  How many {animalConfig[currentExercise.targetType].emoji} animals?
                </h2>
              </div>

              {/* Problem Statement */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-8 rounded-xl mb-8">
                <div className="text-xl text-gray-600 mb-4">
                  You collected <span className="font-bold text-blue-600">{currentExercise.wholeCount}</span> total animals
                </div>
                <div className="text-xl text-gray-600 mb-6">
                  <span className="font-bold text-purple-600">{currentExercise.percentage}%</span> of them are {animalConfig[currentExercise.targetType].emoji}
                </div>
                
                {/* Visual Representation */}
                <div className="bg-white p-6 rounded-lg mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4 flex-wrap">
                    <span className="text-4xl flex-shrink-0">🎯</span>
                    <span className="text-2xl text-blue-600 font-bold mx-2">{currentExercise.wholeCount} total</span>
                    <span className="text-3xl text-gray-400 mx-4 flex-shrink-0">×</span>
                    <span className="text-2xl text-purple-600 font-bold mx-2">{currentExercise.percentage}%</span>
                    <span className="text-3xl text-gray-400 mx-4 flex-shrink-0">= ?</span>
                  </div>
                  <div className="text-lg text-gray-600">
                    How many {animalConfig[currentExercise.targetType].emoji} animals?
                  </div>
                </div>

                {/* Calculation */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700 mb-4">Calculation:</div>
                  <div className="flex items-center justify-center gap-6 text-4xl font-bold">
                    <div className="bg-blue-200 text-blue-800 px-6 py-3 rounded-lg">
                      {currentExercise.wholeCount}
                    </div>
                    <span className="text-gray-600">×</span>
                    <div className="bg-purple-200 text-purple-800 px-6 py-3 rounded-lg">
                      {currentExercise.percentage}%
                    </div>
                    <span className="text-gray-600">=</span>
                    <div className={`px-6 py-3 rounded-lg transition-all ${
                      showAnswer 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {showAnswer ? currentExercise.partCount : '?'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculate Button */}
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
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-2xl py-6 px-12 rounded-xl"
                >
                  Calculate the Answer
                </Button>
              )}

              {/* Answer Display */}
              {showAnswer && (
                <div className="space-y-6">
                  <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                    <div className="text-3xl font-bold text-green-700 mb-4">
                      🎉 Answer: {currentExercise.partCount} {animalConfig[currentExercise.targetType].emoji} animals!
                    </div>
                    <div className="text-xl text-green-600 mb-4">
                      {currentExercise.wholeCount} × {currentExercise.percentage}% = {currentExercise.partCount}
                    </div>
                    <div className="text-lg text-gray-600">
                      So out of <span className="font-bold">{currentExercise.wholeCount}</span> total animals, <span className="font-bold">{currentExercise.partCount}</span> are {animalConfig[currentExercise.targetType].emoji}
                    </div>
                    <div className="text-2xl md:text-3xl mb-1 md:mb-2">
                      {Array.from({ length: Math.min(currentExercise.partCount, 12) }, (_, i) => animalConfig[currentExercise.targetType].emoji).join('')}
                      {currentExercise.partCount > 12 && '...'}
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
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white text-xl py-4 px-8"
                  >
                    {exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id) ? 
                      'Next Animal →' : 'Complete! 🎊'}
                  </Button>
                </div>
              )}
            </Card>
          )}
        </div>

        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  if (phase === 'complete') {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4 overflow-hidden">
        <Card className="p-8 text-center w-full max-w-md">
          <div className="text-6xl mb-6">🎊</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Whole Number Mastery Complete!
          </h2>
          <p className="text-lg text-green-600 mb-6">
            You've mastered finding parts from percentages using your collected animals!
          </p>
          <Button 
            onClick={() => navigate('/percentage-difference')}
            className="w-full text-xl py-4 bg-green-600 hover:bg-green-700"
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