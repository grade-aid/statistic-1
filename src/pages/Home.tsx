import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, ArrowRight, Eye, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import Confetti from "@/components/Confetti";

// Combined types from both pages
type GamePhase = 'start' | 'intro' | 'collection' | 'learning' | 'percentage-learning' | 'complete';

interface AnimalData {
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
  type: keyof AnimalData;
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
  targetType: keyof AnimalData;
  percentage: number;
  partCount: number;
  wholeCount: number;
  id: string;
}

const GRID_SIZE = 20;

const Home = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Game phases
  const [phase, setPhase] = useState<GamePhase>('start');
  
  // Collection game state
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [lives, setLives] = useState(9);
  const [collected, setCollected] = useState<AnimalData>({
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

  // Percentage learning state  
  const [completedAnimals, setCompletedAnimals] = useState<string[]>([]);
  const [currentTargetAnimal, setCurrentTargetAnimal] = useState<string | null>(null);
  const [currentCalculation, setCurrentCalculation] = useState<string | null>(null);
  const [animatingNumbers, setAnimatingNumbers] = useState(false);

  // Intro animation states
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

  // Intro animation effect
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
    mammals: { emoji: '🐘', name: 'Mammals', color: '#ef4444' },
    birds: { emoji: '🦅', name: 'Birds', color: '#3b82f6' },
    reptiles: { emoji: '🐍', name: 'Reptiles', color: '#22c55e' },
    fish: { emoji: '🐟', name: 'Fish', color: '#06b6d4' },
    insects: { emoji: '🐛', name: 'Insects', color: '#eab308' }
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
    const animalTypes = Object.keys(animalConfig) as Array<keyof AnimalData>;
    
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
    const animalTypes = Object.keys(collected) as Array<keyof AnimalData>;
    const availableTypes = animalTypes.filter(type => collected[type] > 0);
    
    if (availableTypes.length === 0) return [];
    
    const newExercises: WholeExercise[] = [];
    const targetPercentages = [25, 50, 33];
    
    const sortedTypes = availableTypes.sort((a, b) => collected[b] - collected[a]);
    
    for (let i = 0; i < Math.min(3, sortedTypes.length); i++) {
      const type = sortedTypes[i];
      const animalCount = collected[type];
      const percentage = targetPercentages[i];
      
      const expectedPartCount = Math.round((percentage / 100) * totalTarget);
      const partCount = Math.abs(animalCount - expectedPartCount) <= 2 ? animalCount : expectedPartCount;
      
      newExercises.push({
        id: `exercise-${i}`,
        targetType: type,
        percentage,
        partCount,
        wholeCount: totalTarget
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
      // Save collected data to localStorage for other pages to use
      localStorage.setItem("animalData", JSON.stringify(collected));
      
      setTimeout(() => {
        const newExercises = generateExercises();
        setExercises(newExercises);
        setCurrentExercise(newExercises[0] || null);
        setPhase('learning');
      }, 1000);
    }
  }, [isCollectionComplete, generateExercises, collected]);

  const autoComplete = () => {
    if (phase !== 'collection') return;
    
    const remainingAnimals = [...animals];
    remainingAnimals.forEach(animal => {
      setCollected(prev => ({
        ...prev,
        [animal.type]: prev[animal.type] + 1
      }));
    });
    
    setAnimals([]);
    
    toast({
      title: "🎉 Auto Complete!",
      description: "All animals collected automatically!",
      duration: 3000
    });
  };

  // Start phase
  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="text-center w-full max-w-md p-8">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold mb-4">🐘 Animal Percentage Adventure</h1>
          <p className="text-muted-foreground mb-6">
            Collect animals, then learn to calculate percentages with your findings!
          </p>
          <Button onClick={() => setPhase('intro')} size="lg" className="w-full">
            <Play className="mr-2 h-5 w-5" />
            Start Adventure
          </Button>
        </Card>
      </div>
    );
  }

  // Intro phase
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
          <Card className="bg-white/90 backdrop-blur-sm max-w-2xl mx-auto p-8">
            <div className="text-center space-y-6">
              
              <div className={`transition-all duration-1000 ${showPartial ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="text-4xl mb-4">🔍</div>
                <div className="bg-purple-100 p-4 rounded-xl mb-4">
                  <div className="text-3xl mb-2">🐘🐘🐘</div>
                  <div className="text-4xl font-bold text-purple-600">25%</div>
                </div>
              </div>

              <div className={`transition-all duration-1000 ${showCalculation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex items-center justify-center gap-4 text-3xl mb-4">
                  <div className="bg-purple-100 p-3 rounded-full animate-pulse">
                    <span>🐘</span>
                    <div className="text-sm font-bold">3</div>
                  </div>
                  <div className="text-4xl">÷</div>
                  <div className="bg-pink-100 p-3 rounded-full animate-pulse">
                    <span>📊</span>
                    <div className="text-sm font-bold">25%</div>
                  </div>
                  <div className="text-4xl">=</div>
                  <div className="bg-yellow-100 p-3 rounded-full animate-bounce">
                    <span>❓</span>
                  </div>
                </div>
              </div>

              <div className={`transition-all duration-1000 ${showWhole ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex justify-center mb-4">
                  <svg className="w-40 h-40" viewBox="0 0 200 200">
                    <path
                      d="M 100 100 L 100 10 A 90 90 0 0 1 190 100 Z"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="6"
                      className="animate-pulse"
                    />
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
                    <text x="150" y="60" textAnchor="middle" className="text-2xl">🐘</text>
                    <text x="60" y="130" textAnchor="middle" className="text-2xl">🐟</text>
                  </svg>
                </div>
              </div>

              <div className={`transition-all duration-1000 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-gradient-to-r from-green-200 to-emerald-200 p-4 rounded-full inline-block animate-bounce">
                  <div className="text-4xl font-bold text-green-700">12</div>
                </div>
                <div className="text-3xl mt-4">🎉</div>
                <div className="text-2xl mt-2">🐘🐘🐘🐟🐟🐟🐟🐟🐟🐟🐟🐟</div>
              </div>

              <div className="flex gap-4 justify-center mt-8">
                <Button 
                  onClick={() => setPhase('start')} 
                  variant="outline"
                  size="lg"
                >
                  ← Back
                </Button>
                <Button 
                  onClick={startGame} 
                  size="lg"
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

  // Collection phase
  if (phase === 'collection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">🔍 Collect Animals for Learning</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-lg">
                    {i < lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <p className="text-lg font-semibold">
                {totalCollected} / {totalTarget} animals
              </p>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                disabled={animals.length === 0}
              >
                Auto Complete
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <Card className="w-full max-w-3xl">
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
                          border border-border/20 flex items-center justify-center text-sm
                          ${isWallCell ? 'bg-stone-600' : 'bg-background/50'}
                        `}
                        style={{ aspectRatio: '1' }}
                      >
                        {isPlayer && <span className="text-lg">🧑</span>}
                        {animal && <span className="text-lg">{animal.emoji}</span>}
                        {hunter && <span className="text-lg">{hunter.emoji}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mt-4">
            <p className="text-muted-foreground">Use WASD or arrow keys to move • Avoid hunters • Collect all animals!</p>
          </div>
        </div>
      </div>
    );
  }

  // Learning phase (whole from percentage)
  if (phase === 'learning') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-4 p-6">
            <h1 className="text-2xl font-bold text-center mb-2">
              🔍 Find the Whole from Part
            </h1>
            <div className="text-center text-muted-foreground">
              Progress: {completedExercises.length} / {exercises.length} completed
            </div>
          </Card>

          {currentExercise && (
            <Card className="p-6 text-center">
              
              <div className="mb-4">
                <div className="text-4xl mb-2">
                  {animalConfig[currentExercise.targetType].emoji}
                </div>
                <h2 className="text-xl font-bold mb-4 text-gray-700">
                  How many animals total?
                </h2>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-4">
                <div className="text-lg text-gray-600 mb-2">
                  You found <span className="font-bold text-blue-600">{currentExercise.partCount}</span> {animalConfig[currentExercise.targetType].emoji}
                </div>
                <div className="text-lg text-gray-600 mb-4">
                  This is <span className="font-bold text-purple-600">{currentExercise.percentage}%</span> of all animals
                </div>
                
                <div className="bg-white p-4 rounded-lg mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                    {Array.from({ length: Math.min(currentExercise.partCount, 8) }, (_, i) => (
                      <span key={i} className="text-2xl">{animalConfig[currentExercise.targetType].emoji}</span>
                    ))}
                    {currentExercise.partCount > 8 && <span className="text-lg text-gray-500">+{currentExercise.partCount - 8}</span>}
                    <span className="text-lg text-gray-400 mx-2">= {currentExercise.percentage}%</span>
                  </div>
                  <div className="text-muted-foreground">
                    What's the total number?
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-gray-700 mb-2">Calculation:</div>
                  <div className="flex items-center justify-center gap-3 text-xl font-bold">
                    <div className="bg-blue-200 text-blue-800 px-3 py-2 rounded-lg">
                      {currentExercise.partCount}
                    </div>
                    <span className="text-gray-600">÷</span>
                    <div className="bg-purple-200 text-purple-800 px-3 py-2 rounded-lg">
                      {currentExercise.percentage}%
                    </div>
                    <span className="text-gray-600">=</span>
                    <div className={`px-3 py-2 rounded-lg transition-all ${
                      showAnswer 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-500'
                    }`}>
                      {showAnswer ? currentExercise.wholeCount : '?'}
                    </div>
                  </div>
                </div>
              </div>

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
                  size="lg"
                  className="mb-4"
                >
                  Calculate the Answer
                </Button>
              )}

              {showAnswer && (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                    <div className="text-xl font-bold text-green-700 mb-2">
                      🎉 Answer: {currentExercise.wholeCount} total animals!
                    </div>
                    <div className="text-lg text-green-600 mb-2">
                      {currentExercise.partCount} ÷ {currentExercise.percentage}% = {currentExercise.wholeCount}
                    </div>
                    <div className="text-muted-foreground">
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
                        setPhase('percentage-learning');
                        // Set up percentage learning
                        const animalEntries = Object.entries(collected).filter(([, count]) => count > 0);
                        const firstTarget = animalEntries.reduce((max, current) => 
                          current[1] > max[1] ? current : max, animalEntries[0]
                        );
                        if (firstTarget) {
                          setCurrentTargetAnimal(firstTarget[0]);
                        }
                      }
                    }}
                    size="lg"
                  >
                    {exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id) ? 
                      'Next Animal →' : 'Learn Percentages! 📊'}
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

  // Percentage learning phase
  if (phase === 'percentage-learning') {
    const totalAnimals = Object.values(collected).reduce((sum, count) => sum + count, 0);
    const animalEntries = Object.entries(collected).filter(([, count]) => count > 0);
    const isAllCompleted = completedAnimals.length === animalEntries.length;

    const handleAnimalClick = (animalType: string) => {
      if (completedAnimals.includes(animalType)) return;
      
      if (animalType === currentTargetAnimal) {
        setCompletedAnimals(prev => [...prev, animalType]);
        setCurrentCalculation(animalType);
        setAnimatingNumbers(true);
        setShowConfetti(true);
        
        setTimeout(() => {
          setAnimatingNumbers(false);
          setShowConfetti(false);
        }, 2000);
      }
    };

    const handleNext = () => {
      const remaining = animalEntries.filter(([type]) => 
        !completedAnimals.includes(type) && type !== currentCalculation
      );
      
      setCurrentCalculation(null);
      
      if (remaining.length > 0) {
        setCurrentTargetAnimal(remaining[0][0]);
      } else {
        setPhase('complete');
      }
    };

    if (isAllCompleted) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4 flex items-center justify-center">
          <Card className="text-center w-full max-w-md p-8">
            <div className="text-6xl mb-6">🎊</div>
            <h2 className="text-3xl font-bold text-green-700 mb-4">
              Percentage Mastery Complete!
            </h2>
            <p className="text-lg text-green-600 mb-6">
              You've mastered calculating percentages with your collected animals!
            </p>
            <Button 
              onClick={() => navigate('/percentage-difference')}
              size="lg"
              className="w-full"
            >
              Next Challenge <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-4 p-6">
            <h1 className="text-2xl font-bold text-center mb-2">
              📊 Learn Percentage Calculation
            </h1>
            <div className="text-center text-muted-foreground">
              Progress: {completedAnimals.length} / {animalEntries.length} completed
            </div>
          </Card>

          {currentTargetAnimal && (
            <Card className="p-6">
              <div className="text-center space-y-6">
                
                <div className="bg-white p-4 rounded-lg border-2 border-accent/30 mb-6">
                  <div className="text-4xl mb-2">{animalConfig[currentTargetAnimal as keyof typeof animalConfig].emoji}</div>
                  <div className="text-xl font-bold">{animalConfig[currentTargetAnimal as keyof typeof animalConfig].name}</div>
                  <div className="text-muted-foreground">Find this animal in the circle below</div>
                </div>
                
                <div className="flex justify-center mb-6">
                  <div className="relative w-80 h-80">
                    <svg className="w-full h-full" viewBox="0 0 200 200">
                      {(() => {
                        let startAngle = 0;
                        const radius = 90;
                        const centerX = 100;
                        const centerY = 100;
                        
                        return Object.entries(collected)
                          .filter(([, count]) => count > 0)
                          .map(([type, count]) => {
                            const animalPercentage = count / totalAnimals * 100;
                            const angle = animalPercentage / 100 * 360;
                            const endAngle = startAngle + angle;
                            
                            const startAngleRad = startAngle * Math.PI / 180;
                            const endAngleRad = endAngle * Math.PI / 180;
                            
                            const x1 = centerX + radius * Math.cos(startAngleRad);
                            const y1 = centerY + radius * Math.sin(startAngleRad);
                            const x2 = centerX + radius * Math.cos(endAngleRad);
                            const y2 = centerY + radius * Math.sin(endAngleRad);
                            const largeArcFlag = angle > 180 ? 1 : 0;
                            const pathData = [`M ${centerX} ${centerY}`, `L ${x1} ${y1}`, `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`, 'Z'].join(' ');
                            
                            const typeConfig = animalConfig[type as keyof typeof animalConfig];
                            const isTarget = type === currentTargetAnimal;
                            const isCompleted = completedAnimals.includes(type);
                            
                            const labelAngle = (startAngle + endAngle) / 2;
                            const labelRadius = radius * 0.7;
                            const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180);
                            const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180);
                            
                            const slice = (
                              <g key={type}>
                                <path 
                                  d={pathData} 
                                  fill={typeConfig.color} 
                                  stroke="white" 
                                  strokeWidth="3" 
                                  className={`transition-all duration-500 cursor-pointer hover:brightness-110 ${
                                    isCompleted
                                      ? 'opacity-70' 
                                      : isTarget
                                      ? 'animate-pulse drop-shadow-lg'
                                      : 'opacity-90 hover:opacity-100'
                                  }`}
                                  onClick={() => handleAnimalClick(type)}
                                />
                                <text 
                                  x={labelX} 
                                  y={labelY} 
                                  textAnchor="middle" 
                                  dy="0.3em" 
                                  className="text-2xl pointer-events-none"
                                >
                                  {typeConfig.emoji}
                                </text>
                                <text 
                                  x={labelX} 
                                  y={labelY + 18} 
                                  textAnchor="middle" 
                                  dy="0.3em" 
                                  className="text-sm font-bold fill-white pointer-events-none"
                                  style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                                >
                                  {count}
                                </text>
                              </g>
                            );
                            
                            startAngle = endAngle;
                            return slice;
                          });
                      })()}
                    </svg>
                  </div>
                </div>

                {currentCalculation && (
                  <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                    <div className="text-xl font-bold text-green-700 mb-4">✨ Perfect! Here's how we calculate:</div>
                    
                    {(() => {
                      const count = collected[currentCalculation as keyof AnimalData];
                      const percentage = Math.round(count / totalAnimals * 100);
                      
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center gap-4 text-xl">
                            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg border">
                              <span className="text-2xl">{animalConfig[currentCalculation as keyof typeof animalConfig].emoji}</span>
                              <span className="font-bold">{count}</span>
                            </div>
                            <span>÷</span>
                            <div className="bg-white px-4 py-3 rounded-lg border font-bold">{totalAnimals}</div>
                            <span>=</span>
                            <div className="bg-blue-100 px-4 py-3 rounded-lg border font-bold text-blue-700">
                              {(count / totalAnimals).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-center gap-4 text-xl">
                            <div className="bg-blue-100 px-4 py-3 rounded-lg border font-bold text-blue-700">
                              {(count / totalAnimals).toFixed(2)}
                            </div>
                            <span>×</span>
                            <div className="bg-white px-4 py-3 rounded-lg border font-bold">100</div>
                            <span>=</span>
                            <Badge 
                              className="text-xl px-6 py-3 animate-bounce" 
                              style={{ backgroundColor: animalConfig[currentCalculation as keyof typeof animalConfig].color }}
                            >
                              {percentage}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })()}
                    
                    <Button 
                      onClick={handleNext}
                      size="lg"
                      className="mt-4"
                    >
                      Next Animal <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {!currentCalculation && (
                  <div className="text-lg text-muted-foreground">
                    Click on the {animalConfig[currentTargetAnimal as keyof typeof animalConfig].name.toLowerCase()} slice to learn! 🎯
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  return null;
};

export default Home;