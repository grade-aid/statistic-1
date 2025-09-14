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
    
    const newExercises: WholeExercise[] = [];
    const targetPercentages = [25, 50, 33]; // Exactly 3 exercises with simple percentages
    
    // Sort animal types by count (descending) to pick the most collected ones
    const sortedTypes = availableTypes.sort((a, b) => collected[b] - collected[a]);
    
    for (let i = 0; i < Math.min(3, sortedTypes.length); i++) {
      const type = sortedTypes[i];
      const animalCount = collected[type];
      const percentage = targetPercentages[i];
      
      // Calculate what part count would give us this percentage of total animals
      const expectedPartCount = Math.round((percentage / 100) * totalTarget);
      
      // Use the actual collected count if it's reasonable, otherwise use expected
      const partCount = Math.abs(animalCount - expectedPartCount) <= 2 ? animalCount : expectedPartCount;
      
      newExercises.push({
        id: `exercise-${i}`,
        targetType: type,
        percentage,
        partCount,
        wholeCount: totalTarget // The answer is always the total number of animals
      });
    }
    
    return newExercises;
  }, [collected, totalTarget]);

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
        const newExercises = generateExercises();
        setExercises(newExercises);
        setCurrentExercise(newExercises[0] || null);
        setPhase('learning');
      }, 1000);
    }
  }, [isCollectionComplete, generateExercises]);

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
        description: `${currentExercise.partCount} ÷ ${currentExercise.percentage}% = ${currentExercise.wholeCount}`,
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
      <div className="tablet-container bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-2 overflow-hidden">
        <Card className="game-card text-center w-full max-w-sm">
          <div className="text-2xl mb-3">🔍</div>
          <h1 className="text-xl font-bold mb-2">🐘 Find the Whole Game</h1>
          <p className="text-sm text-muted-foreground mb-3">Collect animals, then find the whole from parts!</p>
          <Button onClick={() => setPhase('intro')} className="game-button w-full">
            <Play className="mr-2 h-4 w-4" />
            Start Adventure
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="tablet-container bg-gradient-to-br from-purple-50 to-pink-100 p-2 overflow-hidden">
        <div className="tablet-content items-center justify-center">
          <Card className="game-card bg-white/90 backdrop-blur-sm max-w-2xl mx-auto my-auto">
            <div className="text-center space-y-4">
              
              {/* Step 1: Show partial pie (known part) */}
              <div className={`transition-all duration-1000 ${showPartial ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="text-4xl mb-3">🔍</div>
                <div className="bg-purple-100 p-3 rounded-xl mb-3">
                  <div className="text-2xl mb-1">🐘🐘🐘</div>
                  <div className="text-3xl font-bold text-purple-600">25%</div>
                </div>
              </div>

              {/* Step 2: Show calculation process */}
              <div className={`transition-all duration-1000 ${showCalculation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex items-center justify-center gap-3 text-2xl mb-3">
                  <div className="bg-purple-100 p-2 rounded-full animate-pulse">
                    <span>🐘</span>
                    <div className="text-sm font-bold">3</div>
                  </div>
                  <div className="text-3xl">÷</div>
                  <div className="bg-pink-100 p-2 rounded-full animate-pulse">
                    <span>📊</span>
                    <div className="text-sm font-bold">25%</div>
                  </div>
                  <div className="text-3xl">=</div>
                  <div className="bg-yellow-100 p-2 rounded-full animate-bounce">
                    <span>❓</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Show complete pie chart */}
              <div className={`transition-all duration-1000 ${showWhole ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex justify-center mb-3">
                  <svg className="w-32 h-32" viewBox="0 0 200 200">
                    {/* Known part - 25% (elephants) */}
                    <path
                      d="M 100 100 L 100 10 A 90 90 0 0 1 190 100 Z"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="6"
                      className="animate-pulse"
                    />
                    {/* Unknown parts expanding */}
                    <path
                      d="M 100 100 L 190 100 A 90 90 0 1 1 100 10 Z"
                      fill="#06b6d4"
                      stroke="white"
                      strokeWidth="6"
                      style={{
                        strokeDasharray: showWhole ? 'none' : '400',
                        strokeDashoffset: showWhole ? '0' : '400',
                        transition: 'all 2s ease-in-out'
                      }}
                    />
                    <text x="150" y="60" textAnchor="middle" className="text-lg">🐘</text>
                    <text x="60" y="130" textAnchor="middle" className="text-lg">🐟</text>
                  </svg>
                </div>
              </div>

              {/* Step 4: Show result */}
              <div className={`transition-all duration-1000 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-gradient-to-r from-green-200 to-emerald-200 p-3 rounded-full inline-block animate-bounce">
                  <div className="text-3xl font-bold text-green-700">12</div>
                </div>
                <div className="text-2xl mt-2">🎉</div>
                <div className="text-lg mt-1">🐘🐘🐘🐟🐟🐟🐟🐟🐟🐟🐟🐟</div>
              </div>

              {/* Navigation */}
              <div className="flex gap-3 justify-center mt-4">
                <Button 
                  onClick={() => setPhase('start')} 
                  variant="outline"
                  className="game-button-secondary"
                >
                  ← Back
                </Button>
                <Button 
                  onClick={startGame} 
                  className="game-button"
                >
                  🚀 Start Game
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
      <div className="tablet-container bg-gradient-to-br from-purple-50 to-pink-100 p-1 overflow-hidden">
        <div className="tablet-content max-w-4xl mx-auto">
          <div className="text-center mb-1 flex-shrink-0">
            <h2 className="text-base font-bold mb-1">🔍 Collect Animals for Whole Number Learning</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 mb-1">
              <div className="flex items-center gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-xs">
                    {i < lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <p className="text-xs">
                {totalCollected} / {totalTarget} animals
              </p>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                size="sm"
                className="text-xs"
                disabled={animals.length === 0}
              >
                Auto Complete
              </Button>
            </div>
          </div>

          <div className="flex justify-center flex-1 min-h-0">
            <Card className="w-full max-w-2xl mx-auto">
              <div className="relative bg-muted rounded-xl p-2 aspect-square">
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
                          border border-border/20 flex items-center justify-center text-xs
                          ${isWallCell ? 'bg-stone-600' : 'bg-background/50'}
                        `}
                        style={{ aspectRatio: '1' }}
                      >
                        {isPlayer && <span className="text-sm">🧑</span>}
                        {animal && <span className="text-sm">{animal.emoji}</span>}
                        {hunter && <span className="text-sm">{hunter.emoji}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-2 flex-shrink-0">
            <p className="text-xs text-muted-foreground">Use WASD or arrow keys to move • Avoid hunters • Collect all animals!</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'learning') {
    return (
      <div className="tablet-container bg-gradient-to-br from-purple-50 to-pink-100 p-1 overflow-hidden">
        <div className="tablet-content max-w-3xl mx-auto">
          <Card className="game-card mb-1 bg-white/80 backdrop-blur-sm flex-shrink-0">
            <h1 className="text-lg font-bold text-center mb-1">
              🔍 Find the Whole from Part
            </h1>
            <div className="text-center text-xs text-gray-600">
              Progress: {completedExercises.length} / {exercises.length} completed
            </div>
          </Card>

          {currentExercise && (
            <Card className="game-card text-center flex-1 min-h-0 overflow-y-auto">
              
              {/* Current Animal Display */}
              <div className="mb-2">
                <div className="text-2xl mb-1">
                  {animalConfig[currentExercise.targetType].emoji}
                </div>
                <h2 className="text-lg font-bold mb-2 text-gray-700">
                  How many animals total?
                </h2>
              </div>

              {/* Problem Statement */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-2 rounded-xl mb-2">
                <div className="text-sm text-gray-600 mb-1">
                  You found <span className="font-bold text-blue-600">{currentExercise.partCount}</span> {animalConfig[currentExercise.targetType].emoji}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  This is <span className="font-bold text-purple-600">{currentExercise.percentage}%</span> of all animals
                </div>
                
                {/* Visual Representation */}
                <div className="bg-white p-2 rounded-lg mb-2">
                  <div className="flex items-center justify-center gap-1 mb-1 flex-wrap">
                    {Array.from({ length: Math.min(currentExercise.partCount, 6) }, (_, i) => (
                      <span key={i} className="text-lg flex-shrink-0">{animalConfig[currentExercise.targetType].emoji}</span>
                    ))}
                    {currentExercise.partCount > 6 && <span className="text-sm text-gray-500">+{currentExercise.partCount - 6}</span>}
                    <span className="text-sm text-gray-400 mx-1 flex-shrink-0">= {currentExercise.percentage}%</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    What's the total number?
                  </div>
                </div>

                {/* Calculation */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-2 rounded-lg">
                  <div className="text-sm font-bold text-gray-700 mb-1">Calculation:</div>
                  <div className="flex items-center justify-center gap-2 text-lg font-bold">
                    <div className="bg-blue-200 text-blue-800 px-2 py-1 rounded-lg">
                      {currentExercise.partCount}
                    </div>
                    <span className="text-gray-600">÷</span>
                    <div className="bg-purple-200 text-purple-800 px-2 py-1 rounded-lg">
                      {currentExercise.percentage}%
                    </div>
                    <span className="text-gray-600">=</span>
                    <div className={`px-2 py-1 rounded-lg transition-all ${
                      showAnswer 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {showAnswer ? currentExercise.wholeCount : '?'}
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
                      description: `${currentExercise.partCount} ÷ ${currentExercise.percentage}% = ${currentExercise.wholeCount}`,
                      duration: 3000
                    });
                  }}
                  className="game-button"
                >
                  Calculate the Answer
                </Button>
              )}

              {/* Answer Display */}
              {showAnswer && (
                <div className="space-y-2">
                  <div className="bg-green-50 p-2 rounded-lg border-2 border-green-200">
                    <div className="text-lg font-bold text-green-700 mb-1">
                      🎉 Answer: {currentExercise.wholeCount} total animals!
                    </div>
                    <div className="text-sm text-green-600 mb-1">
                      {currentExercise.partCount} ÷ {currentExercise.percentage}% = {currentExercise.wholeCount}
                    </div>
                    <div className="text-xs text-gray-600">
                      So you collected <span className="font-bold">{currentExercise.partCount}</span> out of <span className="font-bold">{currentExercise.wholeCount}</span> total animals
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
                    className="game-button"
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
      <div className="tablet-container bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-2 overflow-hidden">
        <Card className="game-card text-center w-full max-w-sm">
          <div className="text-3xl mb-3">🎊</div>
          <h2 className="text-xl font-bold text-green-700 mb-3">
            Whole Number Mastery Complete!
          </h2>
          <p className="text-sm text-green-600 mb-4">
            You've mastered finding the whole from percentages using your collected animals!
          </p>
          <Button 
            onClick={() => navigate('/percentage-difference')}
            className="game-button w-full"
          >
            Next Challenge <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return null;
};

export default WholeFromPercentage;