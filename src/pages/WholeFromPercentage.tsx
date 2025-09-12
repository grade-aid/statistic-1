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
  const [userInput, setUserInput] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [animatingPie, setAnimatingPie] = useState(false);
  
  // Interactive equation state
  const [selectedSlice, setSelectedSlice] = useState<keyof GameState | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<keyof GameState | null>(null);
  const [equationValues, setEquationValues] = useState({
    partCount: null as number | null,
    percentage: null as number | null,
    wholeCount: null as number | null
  });

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
    const availableTypes = animalTypes.filter(type => collected[type] > 4); // Need enough for meaningful percentages
    
    if (availableTypes.length === 0) return [];
    
    const newExercises: WholeExercise[] = [];
    const percentages = [25, 50, 75, 20, 40, 60, 80];
    
    for (let i = 0; i < Math.min(5, availableTypes.length); i++) {
      const type = availableTypes[i % availableTypes.length];
      const percentage = percentages[i % percentages.length];
      const wholeCount = collected[type];
      const partCount = Math.round((percentage / 100) * wholeCount);
      
      if (partCount > 0 && partCount < wholeCount) {
        newExercises.push({
          id: `exercise-${i}`,
          targetType: type,
          percentage,
          partCount,
          wholeCount
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

  const handleAnswerSubmit = () => {
    if (!currentExercise) return;
    
    const isCorrect = equationValues.wholeCount === currentExercise.wholeCount;
    
    if (isCorrect) {
      setShowAnswer(true);
      setShowConfetti(true);
      setAnimatingPie(true);
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      
      toast({
        title: "🎉 Correct!",
        description: `${currentExercise.partCount} is ${currentExercise.percentage}% of ${currentExercise.wholeCount}`,
        duration: 3000
      });
      
      setTimeout(() => {
        setShowConfetti(false);
        setShowAnswer(false);
        setAnimatingPie(false);
        setSelectedSlice(null);
        setEquationValues({ partCount: null, percentage: null, wholeCount: null });
        
        const nextExercise = exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id);
        if (nextExercise) {
          setCurrentExercise(nextExercise);
        } else {
          setPhase('complete');
        }
      }, 3000);
    } else {
      toast({
        title: "Try again!",
        description: "Click on the highlighted slice to solve",
        duration: 2000
      });
    }
  };

  const renderInteractivePieChart = () => {
    const animalTypes = Object.keys(collected) as Array<keyof GameState>;
    const totalAnimals = Object.values(collected).reduce((sum, count) => sum + count, 0);
    
    if (totalAnimals === 0) return null;
    
    const radius = 90;
    const centerX = 100;
    const centerY = 100;
    
    let currentAngle = 0;
    const slices = animalTypes.map(type => {
      const count = collected[type];
      if (count === 0) return null;
      
      const percentage = (count / totalAnimals) * 100;
      const sliceAngle = (count / totalAnimals) * 360;
      
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle = endAngle;
      
      const startX = centerX + radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = centerY + radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = centerX + radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = centerY + radius * Math.sin((endAngle * Math.PI) / 180);
      
      const largeArcFlag = sliceAngle > 180 ? 1 : 0;
      const pathData = `M ${centerX} ${centerY} L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
      
      const labelAngle = (startAngle + endAngle) / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos((labelAngle * Math.PI) / 180);
      const labelY = centerY + labelRadius * Math.sin((labelAngle * Math.PI) / 180);
      
      const isHovered = hoveredSlice === type;
      const isSelected = selectedSlice === type;
      const isTarget = currentExercise && currentExercise.targetType === type;
      
      return (
        <g key={type}>
          <path
            d={pathData}
            fill={animalConfig[type].color}
            stroke="white"
            strokeWidth={isHovered || isSelected ? "6" : "4"}
            className={`transition-all duration-300 cursor-pointer ${
              isTarget ? 'animate-pulse' : ''
            } ${
              isHovered ? 'brightness-110' : ''
            } ${
              isSelected ? 'drop-shadow-lg' : ''
            }`}
            style={{
              filter: `brightness(${isHovered ? 1.2 : isSelected ? 1.1 : 1}) drop-shadow(0 4px 8px rgba(0,0,0,0.3))`,
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: `${centerX}px ${centerY}px`
            }}
            onMouseEnter={() => setHoveredSlice(type)}
            onMouseLeave={() => setHoveredSlice(null)}
            onClick={() => handleSliceClick(type, count, percentage)}
          />
          <text
            x={labelX}
            y={labelY - 8}
            textAnchor="middle"
            dy="0.3em"
            className="text-2xl pointer-events-none"
          >
            {animalConfig[type].emoji}
          </text>
          <text
            x={labelX}
            y={labelY + 12}
            textAnchor="middle"
            dy="0.3em"
            className="text-sm font-bold fill-white pointer-events-none"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
          >
            {count}
          </text>
          {isTarget && (
            <circle
              cx={centerX}
              cy={centerY}
              r={radius + 10}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="3"
              strokeDasharray="8,4"
              className="animate-spin pointer-events-none"
              style={{ animationDuration: '3s' }}
            />
          )}
        </g>
      );
    }).filter(Boolean);
    
    return (
      <svg className="w-full h-full" viewBox="0 0 200 200">
        {slices}
        
        {/* Center instruction */}
        <text
          x={centerX}
          y={centerY - 10}
          textAnchor="middle"
          className="text-xs font-bold fill-gray-600 pointer-events-none"
        >
          Click a slice
        </text>
        <text
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          className="text-xs fill-gray-500 pointer-events-none"
        >
          to solve
        </text>
      </svg>
    );
  };
  
  const handleSliceClick = (type: keyof GameState, count: number, percentage: number) => {
    if (!currentExercise || currentExercise.targetType !== type) return;
    
    setSelectedSlice(type);
    setEquationValues({
      partCount: currentExercise.partCount,
      percentage: Math.round(percentage),
      wholeCount: count
    });
    
    // Auto-submit after a short delay
    setTimeout(() => {
      handleAnswerSubmit();
    }, 1000);
  };

  // Render different phases
  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center w-full max-w-md">
          <div className="text-6xl mb-6">🔍</div>
          <h1 className="text-3xl font-bold mb-4">🐘 Find the Whole Game</h1>
          <p className="text-lg text-muted-foreground mb-6">Collect animals, then find the whole from parts!</p>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-screen">
          <Card className="p-12 bg-white/90 backdrop-blur-sm">
            <div className="text-center">
              
              {/* Step 1: Show partial pie (known part) */}
              <div className={`transition-all duration-1000 mb-8 ${showPartial ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="text-7xl mb-6">🔍</div>
                <div className="bg-purple-100 p-6 rounded-xl mb-6">
                  <div className="text-4xl mb-2">🐘🐘🐘</div>
                  <div className="text-6xl font-bold text-purple-600">25%</div>
                </div>
              </div>

              {/* Step 2: Show calculation process */}
              <div className={`transition-all duration-1000 mb-8 ${showCalculation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex items-center justify-center gap-6 text-4xl mb-6">
                  <div className="bg-purple-100 p-4 rounded-full animate-pulse">
                    <span>🐘</span>
                    <div className="text-lg font-bold">3</div>
                  </div>
                  <div className="text-6xl">÷</div>
                  <div className="bg-pink-100 p-4 rounded-full animate-pulse">
                    <span>📊</span>
                    <div className="text-lg font-bold">25%</div>
                  </div>
                  <div className="text-6xl">=</div>
                  <div className="bg-yellow-100 p-4 rounded-full animate-bounce">
                    <span>❓</span>
                  </div>
                </div>
              </div>

              {/* Step 3: Show complete pie chart */}
              <div className={`transition-all duration-1000 mb-8 ${showWhole ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex justify-center mb-6">
                  <svg className="w-64 h-64" viewBox="0 0 200 200">
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
                    <text x="150" y="60" textAnchor="middle" className="text-3xl">🐘</text>
                    <text x="60" y="130" textAnchor="middle" className="text-3xl">🐟</text>
                  </svg>
                </div>
              </div>

              {/* Step 4: Show result */}
              <div className={`transition-all duration-1000 mb-8 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-gradient-to-r from-green-200 to-emerald-200 p-6 rounded-full inline-block animate-bounce">
                  <div className="text-6xl font-bold text-green-700">12</div>
                </div>
                <div className="text-5xl mt-4">🎉</div>
                <div className="text-3xl mt-2">🐘🐘🐘🐟🐟🐟🐟🐟🐟🐟🐟🐟</div>
              </div>

              {/* Navigation */}
              <div className="flex gap-4 justify-center mt-8">
                <Button 
                  onClick={() => setPhase('start')} 
                  variant="outline"
                  className="text-lg py-3 px-6"
                >
                  ← Back
                </Button>
                <Button 
                  onClick={startGame} 
                  className="text-xl py-4 px-8 bg-purple-600 hover:bg-purple-700"
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
            <h1 className="text-3xl font-bold text-center mb-6">
              🔍 Find the Whole from Part
            </h1>
          </Card>

          {currentExercise && (
            <Card className="p-8 text-center">
              <div className="mb-8">
                <div className="text-4xl mb-4">
                  Find the {animalConfig[currentExercise.targetType].emoji} total from this part:
                </div>
                
                {/* Interactive Equation Display */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl mb-6">
                  <div className="flex items-center justify-center gap-4 text-3xl font-bold">
                    <div className={`px-4 py-2 rounded-lg transition-all ${
                      equationValues.partCount !== null 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-gray-200 text-gray-500 animate-pulse'
                    }`}>
                      {equationValues.partCount !== null ? equationValues.partCount : '?'}
                    </div>
                    
                    <span className="text-gray-600">animals =</span>
                    
                    <div className={`px-4 py-2 rounded-lg transition-all ${
                      equationValues.percentage !== null 
                        ? 'bg-blue-200 text-blue-800' 
                        : 'bg-gray-200 text-gray-500 animate-pulse'
                    }`}>
                      {equationValues.percentage !== null ? `${equationValues.percentage}%` : '?%'}
                    </div>
                    
                    <span className="text-gray-600">of</span>
                    
                    <div className={`px-4 py-2 rounded-lg transition-all ${
                      equationValues.wholeCount !== null 
                        ? 'bg-yellow-200 text-yellow-800' 
                        : 'bg-gray-200 text-gray-500 animate-pulse'
                    }`}>
                      {equationValues.wholeCount !== null ? equationValues.wholeCount : '?'}
                    </div>
                    
                    <span className="text-gray-600">total</span>
                  </div>
                  
                  <div className="text-lg text-gray-600 mt-4">
                    Click on the <span className="font-bold text-yellow-600">golden highlighted</span> slice to solve!
                  </div>
                </div>
              </div>

              <div className="flex justify-center mb-8">
                <div className="w-96 h-96">
                  {renderInteractivePieChart()}
                </div>
              </div>

              {showAnswer && (
                <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
                  <div className="text-2xl font-bold text-green-700 mb-4">
                    🎉 Correct! 
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xl">
                    <span>{currentExercise.partCount}</span>
                    <span className="text-3xl">{animalConfig[currentExercise.targetType].emoji}</span>
                    <span>is {currentExercise.percentage}% of {currentExercise.wholeCount} total</span>
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="p-8 text-center w-full max-w-md">
          <div className="text-6xl mb-6">🎊</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Whole Number Mastery Complete!
          </h2>
          <p className="text-lg text-green-600 mb-6">
            You've mastered finding the whole from percentages using your collected animals!
          </p>
          <Button 
            onClick={() => navigate('/percentage-visualization')}
            className="w-full text-xl py-4 bg-green-600 hover:bg-green-700"
          >
            Final Visualization <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>
      </div>
    );
  }

  return null;
};

export default WholeFromPercentage;