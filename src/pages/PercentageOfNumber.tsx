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

interface PercentageExercise {
  targetType: keyof GameState;
  percentage: number;
  answer: number;
  id: string;
}

const GRID_SIZE = 20;

// Remove dynamic sizing - use CSS instead

const PercentageOfNumber = () => {
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
  const [exercises, setExercises] = useState<PercentageExercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<PercentageExercise | null>(null);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [selectedSlice, setSelectedSlice] = useState<keyof GameState | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

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
    
    const newExercises: PercentageExercise[] = [];
    const percentages = [25, 50, 75, 20, 40, 60, 80];
    
    for (let i = 0; i < Math.min(5, availableTypes.length); i++) {
      const type = availableTypes[i % availableTypes.length];
      const percentage = percentages[i % percentages.length];
      const totalAnimals = collected[type];
      const answer = Math.round((percentage / 100) * totalAnimals);
      
      if (answer > 0) {
        newExercises.push({
          id: `exercise-${i}`,
          targetType: type,
          percentage,
          answer
        });
      }
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

  const handleSliceClick = (animalType: keyof GameState) => {
    if (!currentExercise || showAnswer) return;
    
    setSelectedSlice(animalType);
    
    if (animalType === currentExercise.targetType) {
      setShowAnswer(true);
      setShowConfetti(true);
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      
      setTimeout(() => {
        setShowConfetti(false);
        setShowAnswer(false);
        setSelectedSlice(null);
        
        const nextExercise = exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id);
        if (nextExercise) {
          setCurrentExercise(nextExercise);
        } else {
          setPhase('complete');
        }
      }, 3000);
    } else {
      setTimeout(() => {
        setSelectedSlice(null);
      }, 1000);
    }
  };

  const renderPieChart = () => {
    const radius = 90;
    const centerX = 100;
    const centerY = 100;
    
    let startAngle = 0;
    const animalTypes = Object.keys(collected) as Array<keyof GameState>;
    
    return (
      <svg className="w-full h-full cursor-pointer" viewBox="0 0 200 200">
        {animalTypes.map((type) => {
          const count = collected[type];
          if (count === 0) return null;
          
          const percentage = (count / totalCollected) * 100;
          const angle = (percentage / 100) * 360;
          const endAngle = startAngle + angle;
          
          const x1 = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
          const y1 = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
          const x2 = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
          const y2 = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
          
          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
          
          const labelAngle = startAngle + angle / 2;
          const labelRadius = radius * 0.7;
          const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
          const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
          
          const isTarget = currentExercise?.targetType === type;
          const isSelected = selectedSlice === type;
          const isCorrect = showAnswer && isTarget;
          
          startAngle = endAngle;
          
          return (
            <g key={type} onClick={() => handleSliceClick(type)}>
              <path
                d={pathData}
                fill={animalConfig[type].color}
                stroke="white"
                strokeWidth="4"
                className={`transition-all duration-300 ${
                  isTarget ? 'opacity-100 drop-shadow-lg animate-pulse' : 
                  isSelected ? 'opacity-80' : 'opacity-90'
                } ${isCorrect ? 'animate-bounce' : ''}`}
                style={{
                  filter: isTarget ? 'brightness(1.2)' : 
                          isSelected ? 'brightness(0.8)' : 'brightness(1.0)'
                }}
              />
              <text
                x={labelX}
                y={labelY - 8}
                textAnchor="middle"
                dy="0.3em"
                className="text-3xl pointer-events-none"
              >
                {animalConfig[type].emoji}
              </text>
              <text
                x={labelX}
                y={labelY + 15}
                textAnchor="middle"
                dy="0.3em"
                className="text-base font-bold fill-white pointer-events-none"
                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
              >
                {count}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Render different phases
  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center w-full max-w-md">
          <div className="text-6xl mb-6">🧮</div>
          <h1 className="text-3xl font-bold mb-4">🐘 Percentage Game</h1>
          <p className="text-lg text-muted-foreground mb-6">Collect animals, then find percentages!</p>
          <Button onClick={() => setPhase('intro')} className="w-full text-xl py-4">
            <Play className="mr-2 h-5 w-5" />
            Start Adventure
          </Button>
        </Card>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-6 bg-white/90 backdrop-blur-sm">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🧮</div>
              <h1 className="text-4xl font-bold mb-4">Learn: Percentage of a Number</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Discover how to find what percentage one number is of another!
              </p>
            </div>

            {/* Visual Example */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border-2 border-blue-200 mb-8">
              <h3 className="text-2xl font-bold text-center mb-6">Here's How It Works:</h3>
              
              {/* Example with visual pie chart */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🐘🐘🐘🐟🐟🐟🐟🐟</div>
                    <p className="text-lg">You collected 8 animals total</p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border-2 border-blue-300 mb-4">
                    <div className="text-center">
                      <div className="text-3xl mb-2">🐘🐘🐘</div>
                      <p className="text-lg font-bold">3 Elephants</p>
                      <p className="text-sm text-muted-foreground">What percentage of total?</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-center mb-4">
                    <svg className="w-48 h-48" viewBox="0 0 200 200">
                      {/* Elephants slice - 37.5% */}
                      <path
                        d="M 100 100 L 100 10 A 90 90 0 0 1 166.4 65.8 Z"
                        fill="#ef4444"
                        stroke="white"
                        strokeWidth="4"
                      />
                      {/* Fish slice - 62.5% */}
                      <path
                        d="M 100 100 L 166.4 65.8 A 90 90 0 1 1 100 10 Z"
                        fill="#06b6d4"
                        stroke="white"
                        strokeWidth="4"
                      />
                      <text x="130" y="50" textAnchor="middle" className="text-2xl">🐘</text>
                      <text x="70" y="130" textAnchor="middle" className="text-2xl">🐟</text>
                    </svg>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      3 ÷ 8 × 100 = 37.5%
                    </div>
                    <p className="text-lg">
                      <span className="font-bold text-red-500">37.5%</span> of your animals are elephants!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Instructions */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200 mb-8">
              <h3 className="text-xl font-bold mb-4 text-center">🎮 Game Instructions:</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏃‍♂️</div>
                  <h4 className="font-bold mb-2">Step 1: Collect</h4>
                  <p className="text-sm">Move with WASD keys to collect animals while avoiding hunters</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🧮</div>
                  <h4 className="font-bold mb-2">Step 2: Calculate</h4>
                  <p className="text-sm">Find what percentage each animal type represents</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <h4 className="font-bold mb-2">Step 3: Click</h4>
                  <p className="text-sm">Click the correct pie chart slice to answer</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Button onClick={startGame} className="text-xl py-4 px-8 bg-blue-600 hover:bg-blue-700">
                Let's Start Collecting! 🚀
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'collection') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold mb-2">🐘 Collect Animals for Percentage Learning</h2>
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-center mb-6">
              🧮 Find Percentage of Animals
            </h1>
          </Card>

          {currentExercise && (
            <Card className="p-8 text-center">
              <div className="mb-8">
                <div className="text-6xl mb-4">
                  {animalConfig[currentExercise.targetType].emoji}
                </div>
                <div className="text-4xl font-bold mb-2">
                  Find {currentExercise.percentage}%
                </div>
                <div className="text-2xl text-muted-foreground">
                  Click the correct slice!
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="w-80 h-80">
                  {renderPieChart()}
                </div>
              </div>

              {showAnswer && (
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-700 mb-4">
                    🎉 Correct! 
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xl">
                    <span>{currentExercise.percentage}% of</span>
                    <span className="text-3xl">{animalConfig[currentExercise.targetType].emoji}</span>
                    <span>×{collected[currentExercise.targetType]} = {currentExercise.answer}</span>
                  </div>
                </div>
              )}

              <div className="text-sm text-muted-foreground mt-4">
                Progress: {completedExercises.length} / {exercises.length} completed
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center w-full max-w-md">
          <div className="text-6xl mb-6">🎊</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Percentage Mastery Complete!
          </h2>
          <p className="text-lg text-green-600 mb-6">
            You've mastered finding percentages of numbers using your collected animals!
          </p>
          <Button 
            onClick={() => navigate('/whole-from-percentage')}
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

export default PercentageOfNumber;