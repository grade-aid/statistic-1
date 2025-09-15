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

interface DragDropQuestion {
  id: string;
  animalType: keyof GameState;
  equation: string;
}

interface DroppedItem {
  zone: string;
  item: string;
}

const GRID_SIZE = 16; // 16x16 grid for more gameplay space

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

  // Drag-drop questions state
  const [showDragDrop, setShowDragDrop] = useState(false);
  const [dragDropQuestions, setDragDropQuestions] = useState<DragDropQuestion[]>([]);
  const [currentDragDropIndex, setCurrentDragDropIndex] = useState(0);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [completedDragDropQuestions, setCompletedDragDropQuestions] = useState<string[]>([]);

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

  const generateDragDropQuestions = useCallback(() => {
    const animalTypes = Object.keys(collected) as Array<keyof GameState>;
    const availableTypes = animalTypes.filter(type => collected[type] > 0);
    const questions: DragDropQuestion[] = [];
    
    for (let i = 0; i < Math.min(5, availableTypes.length); i++) {
      const animalType = availableTypes[i % availableTypes.length];
      questions.push({
        id: `dragdrop-${i}`,
        animalType,
        equation: `? × ? = ?`
      });
    }
    return questions;
  }, [collected]);

  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    if (draggedItem) {
      const updatedDroppedItems = [
        ...droppedItems.filter(item => item.zone !== zone),
        { zone, item: draggedItem }
      ];
      setDroppedItems(updatedDroppedItems);
      setDraggedItem(null);

      // Auto-check answer when both total and percentage zones are filled
      if (updatedDroppedItems.length === 2) {
        setTimeout(() => {
          const currentQuestion = dragDropQuestions[currentDragDropIndex];
          if (!currentQuestion) return;

          const totalDrop = updatedDroppedItems.find(item => item.zone === 'total');
          const percentageDrop = updatedDroppedItems.find(item => item.zone === 'percentage');

          const percentageValue = Math.round((collected[currentQuestion.animalType] / totalCollected) * 100);

          console.log('Validation check:', {
            totalDropped: totalDrop?.item,
            totalExpected: totalCollected.toString(),
            percentageDropped: percentageDrop?.item, 
            percentageExpected: `${percentageValue}% ${animalConfig[currentQuestion.animalType].emoji}`,
            totalMatch: totalDrop?.item === totalCollected.toString(),
            percentageMatch: percentageDrop?.item === `${percentageValue}% ${animalConfig[currentQuestion.animalType].emoji}`
          });

          const isCorrect = totalDrop?.item === totalCollected.toString() &&
                 percentageDrop?.item === `${percentageValue}% ${animalConfig[currentQuestion.animalType].emoji}`;

          if (isCorrect) {
            setCompletedDragDropQuestions(prev => [...prev, currentQuestion.id]);
            setShowConfetti(true);
            toast({
              title: "🎉 Perfect!",
              description: `${totalCollected} × ${percentageValue}% = ${collected[currentQuestion.animalType]} ${animalConfig[currentQuestion.animalType].emoji}`,
              duration: 3000
            });

            setTimeout(() => {
              if (currentDragDropIndex < dragDropQuestions.length - 1) {
                setCurrentDragDropIndex(prev => prev + 1);
                setDroppedItems([]);
                setShowConfetti(false);
              } else {
                // All questions completed, move to next phase
                navigate('/percentage-difference');
              }
            }, 2500);
          } else {
            toast({
              title: "🤔 Try again",
              description: "Check your equation placement",
              duration: 2000
            });
          }
        }, 300);
      }
    }
  };

  const checkDragDropAnswer = () => {
    const currentQuestion = dragDropQuestions[currentDragDropIndex];
    if (!currentQuestion) return false;

    const totalDrop = droppedItems.find(item => item.zone === 'total');
    const percentageDrop = droppedItems.find(item => item.zone === 'percentage');
    const resultDrop = droppedItems.find(item => item.zone === 'result');

    const percentageValue = Math.round((collected[currentQuestion.animalType] / totalCollected) * 100);
    const animalCount = collected[currentQuestion.animalType];

    return totalDrop?.item === totalCollected.toString() &&
           percentageDrop?.item === `${percentageValue}% ${animalConfig[currentQuestion.animalType].emoji}` &&
           resultDrop?.item === `${animalCount} ${animalConfig[currentQuestion.animalType].emoji}`;
  };

  const handleDragDropSubmit = () => {
    if (checkDragDropAnswer()) {
      setShowConfetti(true);
      toast({
        title: "🎉 Perfect!",
        description: "Correct equation!",
        duration: 2000
      });

      setTimeout(() => {
        if (currentDragDropIndex < dragDropQuestions.length - 1) {
          setCurrentDragDropIndex(prev => prev + 1);
          setDroppedItems([]);
          setShowConfetti(false);
        } else {
          // All questions completed, move to next phase
          navigate('/percentage-difference');
        }
      }, 2000);
    } else {
      toast({
        title: "🤔 Try again",
        description: "Check your equation placement",
        duration: 2000
      });
    }
  };

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
    }, 300); // Smoother movement timing
    
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
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6 max-h-screen overflow-hidden">
        <Card className="p-8 text-center w-full max-w-2xl shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm border-2">
          <div className="text-7xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold mb-4 text-gray-800">🐘 Find the Whole Game</h1>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Collect animals, then find the whole from parts!
          </p>
          <Button 
            onClick={startGame} 
            className="w-full text-2xl py-6 px-8 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Play className="mr-3 h-6 w-6" />
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
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-6 overflow-hidden flex items-center justify-center max-h-screen">
        <div className="w-full max-w-6xl h-full flex items-center justify-center">
          <Card className="p-6 bg-white/95 backdrop-blur-sm w-full shadow-2xl rounded-3xl border-2 max-h-[90vh] overflow-hidden">
            <div className="text-center space-y-6 h-full flex flex-col justify-center">
              
              {/* Tablet-Optimized Learning Goal */}
              <div className={`transition-all duration-1000 ${showPartial ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-4xl font-bold text-gray-800 mb-3">🎯 Learning Goal</h3>
                <div className="text-xl text-muted-foreground mb-6">
                  Find the number from percentage
                </div>
                
                {/* Tablet-Optimized Visual Example */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl border-2 border-purple-200">
                  <div className="grid grid-cols-5 gap-4 items-center justify-items-center mb-4">
                    <div className="bg-purple-100 px-4 py-3 rounded-2xl border-2 border-purple-300 text-center min-w-[120px] shadow-sm">
                      <div className="text-sm font-semibold text-purple-600 mb-1">Total Animals</div>
                      <div className="text-3xl font-bold text-purple-800">{totalCollected || 20}</div>
                    </div>
                    <div className="text-3xl text-gray-500 font-bold">×</div>
                    <div className="bg-purple-100 px-4 py-3 rounded-2xl border-2 border-purple-300 text-center min-w-[120px] shadow-sm">
                      <div className="text-sm font-semibold text-purple-600 mb-1">Percentage</div>
                      <div className="text-3xl font-bold text-purple-800">{examplePercentage}%</div>
                    </div>
                    <div className="text-3xl text-gray-500 font-bold">=</div>
                    <div className="bg-pink-100 px-4 py-3 rounded-2xl border-2 border-pink-300 text-center min-w-[120px] shadow-sm">
                      <div className="text-sm font-semibold text-pink-600 mb-1">🐘 Animals</div>
                      <div className="text-3xl font-bold text-pink-800">?</div>
                    </div>
                  </div>
                  <div className="text-lg text-gray-700 font-medium">
                    If {examplePercentage}% of {totalCollected || 20} animals are 🐘, how many 🐘?
                  </div>
                </div>
              </div>

              {/* Tablet-Optimized Calculation */}
              <div className={`transition-all duration-1000 ${showCalculation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="flex items-center justify-center gap-6 text-2xl mb-3">
                  <div className="bg-purple-100 px-4 py-3 rounded-2xl animate-pulse border-2 border-purple-200 shadow-sm">
                    <span className="text-xl font-semibold text-purple-700">🎯 {totalCollected}</span>
                  </div>
                  <span className="text-4xl font-bold text-gray-500">×</span>
                  <div className="bg-pink-100 px-4 py-3 rounded-2xl animate-pulse border-2 border-pink-200 shadow-sm">
                    <span className="text-xl font-semibold text-pink-700">📊 {examplePercentage}%</span>
                  </div>
                  <span className="text-4xl font-bold text-gray-500">=</span>
                  <div className="bg-purple-100 px-4 py-3 rounded-2xl animate-bounce border-2 border-purple-200 shadow-sm">
                    <span className="text-xl font-semibold text-purple-700">❓</span>
                  </div>
                </div>
                <div className="text-lg text-muted-foreground font-medium">
                  Formula: Whole × Percentage = Part
                </div>
              </div>

              {/* Tablet-Optimized Result */}
              <div className={`transition-all duration-1000 ${showResult ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="bg-gradient-to-r from-purple-200 to-pink-200 px-8 py-4 rounded-2xl inline-block animate-bounce border-2 border-purple-300 shadow-sm">
                  <div className="text-5xl font-bold text-purple-700">8 🐘</div>
                </div>
                <div className="text-4xl mt-3">🎉</div>
              </div>

              {/* Tablet-Optimized Navigation */}
              <div className="flex gap-6 justify-center">
                <Button 
                  onClick={() => setPhase('start')} 
                  variant="outline"
                  className="text-xl py-4 px-6 h-16 rounded-2xl border-2 border-purple-300 min-w-[140px] hover:bg-purple-50 transition-all duration-300 shadow-sm"
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
                  className="text-xl py-4 px-8 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px]"
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
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-6 overflow-hidden flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full">
          
          {/* Tablet-Optimized Header */}
          <div className="text-center mb-4">
            <h2 className="text-4xl font-bold mb-3 text-gray-800">🔍 Collect Animals</h2>
            
            <div className="flex flex-wrap items-center justify-center gap-4 mb-3">
              <div className="flex items-center gap-1 bg-white/95 px-4 py-2 rounded-2xl border-2 border-purple-200 shadow-sm backdrop-blur-sm">
                {Array.from({ length: 9 }, (_, i) => (
                  <span key={i} className="text-lg">
                    {i < lives ? '❤️' : '🖤'}
                  </span>
                ))}
              </div>
              <div className="bg-white/95 px-6 py-3 rounded-2xl border-2 border-purple-200 shadow-sm backdrop-blur-sm">
                <span className="text-xl font-bold text-gray-700">
                  {totalCollected} / {totalTarget}
                </span>
              </div>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                className="text-lg px-4 py-3 h-12 rounded-2xl border-2 border-purple-300 bg-white/95 hover:bg-purple-50 transition-all duration-300 shadow-sm backdrop-blur-sm"
                disabled={animals.length === 0}
              >
                Skip Collection
              </Button>
            </div>
          </div>

          {/* Tablet-Optimized Game Grid */}
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
                    const animal = animals.find(a => a.position.x === x && a.position.y === y);
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
                        {isPlayer && <span className="text-sm drop-shadow-sm">🧑</span>}
                        {animal && <span className="text-sm drop-shadow-sm animate-bounce">{animal.emoji}</span>}
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

          {/* Tablet-Optimized Controls */}
          <div className="text-center mt-3">
            <div className="bg-white/95 px-6 py-3 rounded-2xl inline-block shadow-sm border-2 border-purple-200 backdrop-blur-sm">
              <p className="text-base font-medium text-muted-foreground">
                Use WASD or Arrow Keys • Avoid Hunters • Collect Animals!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'learning') {
    return (
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 p-6 overflow-hidden flex flex-col max-h-screen">
        <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full min-h-0">
          
          {/* Tablet-Optimized Header */}
          <Card className="p-4 mb-4 bg-white/95 backdrop-blur-sm shadow-2xl rounded-3xl border-2">
            <div className="flex items-center justify-between">
              <h1 className="text-4xl font-bold text-gray-800">
                🧮 Find the Part from Percentage
              </h1>
              <div className="text-lg font-semibold text-purple-700 bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 rounded-2xl border-2 border-purple-200 shadow-sm">
                {completedExercises.length} / {exercises.length}
              </div>
            </div>
          </Card>

          {currentExercise && !showDragDrop && (
            <Card className="flex-1 p-6 text-center shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm border-2">
              <div className="h-full flex flex-col justify-between">
                
                {/* Tablet-Optimized Animal & Question */}
                <div className="mb-4">
                  <div className="text-6xl mb-3">
                    {animalConfig[currentExercise.targetType].emoji}
                  </div>
                  <h2 className="text-3xl font-bold text-gray-700 mb-2">
                    How many {animalConfig[currentExercise.targetType].emoji} animals?
                  </h2>
                </div>

                {/* Tablet-Optimized Problem Layout */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl mb-6 flex-1 flex flex-col justify-center border-2 border-purple-200">
                  
                  <div className="grid grid-cols-5 gap-4 items-center justify-items-center mb-6">
                    <div className="bg-purple-100 px-4 py-4 rounded-2xl border-2 border-purple-300 text-center min-w-[100px] shadow-sm">
                      <div className="text-sm font-bold text-purple-600 mb-1">Total Animals</div>
                      <div className="text-3xl font-bold text-purple-800">{currentExercise.wholeCount}</div>
                    </div>
                    <div className="text-4xl text-gray-500 font-bold">×</div>
                    <div className="bg-purple-100 px-4 py-4 rounded-2xl border-2 border-purple-300 text-center min-w-[100px] shadow-sm">
                      <div className="text-sm font-bold text-purple-600 mb-1">Percentage</div>
                      <div className="text-3xl font-bold text-purple-800">{currentExercise.percentage}%</div>
                    </div>
                    <div className="text-4xl text-gray-500 font-bold">=</div>
                    <div className={`px-4 py-4 rounded-2xl border-2 text-center min-w-[100px] shadow-sm transition-all duration-500 ${
                      showAnswer 
                        ? 'bg-pink-100 border-pink-300' 
                        : 'bg-purple-100 border-purple-300'
                    }`}>
                      <div className={`text-sm font-bold mb-1 ${showAnswer ? 'text-pink-600' : 'text-purple-600'}`}>Answer</div>
                      <div className={`text-3xl font-bold ${
                        showAnswer ? 'text-pink-800' : 'text-purple-700'
                      }`}>
                        {showAnswer ? currentExercise.partCount : '?'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tablet-Optimized Action Buttons */}
                <div className="space-y-4">
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
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-2xl py-6 px-8 h-16 rounded-2xl w-full shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Calculate the Answer
                    </Button>
                  )}

                  {/* Tablet-Optimized Answer Display */}
                  {showAnswer && (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-purple-200 shadow-sm">
                        <div className="text-3xl font-bold text-purple-700 mb-2">
                          🎉 Answer: {currentExercise.partCount} {animalConfig[currentExercise.targetType].emoji}
                        </div>
                        <div className="text-xl font-semibold text-purple-600 mb-3">
                          {currentExercise.wholeCount} × {currentExercise.percentage}% = {currentExercise.partCount}
                        </div>
                        <div className="text-2xl leading-relaxed">
                          {Array.from({ length: Math.min(currentExercise.partCount, 10) }, (_, i) => animalConfig[currentExercise.targetType].emoji).join(' ')}
                          {currentExercise.partCount > 10 && ' ...'}
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
            // Start drag-drop questions
            const dragDropQs = generateDragDropQuestions();
            setDragDropQuestions(dragDropQs);
            setCurrentDragDropIndex(0);
            setDroppedItems([]);
            setCompletedDragDropQuestions([]);
            setShowDragDrop(true);
                          }
                        }}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-2xl py-6 px-8 h-16 rounded-2xl w-full shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        {exercises.find(ex => !completedExercises.includes(ex.id) && ex.id !== currentExercise.id) ? 
                          'Next Animal →' : 'Start Practice Questions 🎯'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Drag-Drop Questions Phase */}
          {showDragDrop && dragDropQuestions.length > 0 && (
            <Card className="flex-1 p-6 text-center shadow-2xl rounded-3xl overflow-hidden bg-white/95 backdrop-blur-sm border-2">
              <div className="h-full flex flex-col justify-between">
                
                {/* Question Header */}
                <div className="mb-4">
                  <div className="text-6xl mb-3">
                    {animalConfig[dragDropQuestions[currentDragDropIndex].animalType].emoji}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">
                    Drag the correct numbers into the equation
                  </h2>
                  <div className="text-lg text-purple-600 font-semibold">
                    Question {currentDragDropIndex + 1} of {dragDropQuestions.length}
                  </div>
                </div>

                {/* Drag-Drop Interface */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl mb-6 flex-1 flex flex-col justify-center border-2 border-purple-200">
                  
                   {/* Percentage Equivalency Display */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200">
                      <h3 className="text-lg font-bold text-blue-700 mb-2">💡 Remember:</h3>
                      <div className="text-xl font-semibold text-blue-600">
                        {Math.round((collected[dragDropQuestions[currentDragDropIndex].animalType] / totalCollected) * 100)}% = {(Math.round((collected[dragDropQuestions[currentDragDropIndex].animalType] / totalCollected) * 100) / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-blue-500 mt-1">Percentage as decimal</div>
                    </div>
                  </div>

                  {/* Draggable Items */}
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-700 mb-4">Drag these items:</h3>
                    <div className="flex justify-center gap-4 flex-wrap">
                      {(() => {
                        const percentageValue = Math.round((collected[dragDropQuestions[currentDragDropIndex].animalType] / totalCollected) * 100);
                        const currentAnimal = dragDropQuestions[currentDragDropIndex].animalType;
                        return [
                          { id: totalCollected.toString(), label: `${totalCollected}`, color: 'bg-purple-200 border-purple-400' },
                          { id: `${percentageValue}%`, label: `${percentageValue}% ${animalConfig[currentAnimal].emoji}`, color: 'bg-pink-200 border-pink-400' }
                        ];
                      })().map((item) => (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={() => handleDragStart(item.label)}
                          className={`${item.color} px-6 py-4 rounded-2xl border-2 text-2xl font-bold cursor-move hover:scale-105 transition-transform shadow-sm`}
                        >
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Equation with Drop Zones */}
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-700 mb-4">Complete the equation:</h3>
                    <div className="flex items-center justify-center gap-4 flex-wrap text-2xl font-bold">
                      {/* Total Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'total')}
                        className={`w-20 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                          droppedItems.find(item => item.zone === 'total') 
                            ? 'bg-purple-100 border-purple-400 text-purple-700' 
                            : 'border-gray-400 text-gray-400 hover:border-purple-400'
                        }`}
                      >
                        {droppedItems.find(item => item.zone === 'total')?.item || '?'}
                      </div>
                      
                      <span className="text-gray-500">×</span>
                      
                      {/* Percentage Drop Zone */}
                      <div
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, 'percentage')}
                        className={`w-24 h-16 border-4 border-dashed rounded-2xl flex items-center justify-center text-lg font-bold transition-all ${
                          droppedItems.find(item => item.zone === 'percentage') 
                            ? 'bg-pink-100 border-pink-400 text-pink-700' 
                            : 'border-gray-400 text-gray-400 hover:border-pink-400'
                        }`}
                      >
                        {droppedItems.find(item => item.zone === 'percentage')?.item || '?'}
                      </div>
                      
                      <span className="text-gray-500">=</span>
                      
                      {/* Result Drop Zone */}
                      <div className="bg-green-100 px-4 py-3 rounded-2xl border-2 border-green-300 text-center min-w-[120px]">
                        <div className="text-sm font-semibold text-green-600 mb-1">Result</div>
                        <div className="text-3xl font-bold text-green-800">
                          {(droppedItems.length >= 2 && 
                            droppedItems.find(item => item.zone === 'total') && 
                            droppedItems.find(item => item.zone === 'percentage')) ? 
                            `${collected[dragDropQuestions[currentDragDropIndex].animalType]} ${animalConfig[dragDropQuestions[currentDragDropIndex].animalType].emoji}` : 
                            '?'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Result Display or Submit Button */}
                <div className="space-y-4">
                {completedDragDropQuestions.includes(dragDropQuestions[currentDragDropIndex]?.id) ? (
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-6 rounded-2xl border-2 border-green-200">
                    <div className="text-3xl mb-2">🎉</div>
                    <div className="text-xl font-bold text-green-700 mb-2">
                      Excellent! Moving to next question...
                    </div>
                    <div className="text-sm text-green-600">
                      {totalCollected} × {Math.round((collected[dragDropQuestions[currentDragDropIndex].animalType] / totalCollected) * 100)}% = {collected[dragDropQuestions[currentDragDropIndex].animalType]} {animalConfig[dragDropQuestions[currentDragDropIndex].animalType].emoji}
                    </div>
                  </div>
                ) : droppedItems.length < 2 ? (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border-2 border-blue-200">
                    <div className="text-lg font-semibold text-blue-700">
                      Drop both items to see the result!
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      {2 - droppedItems.length} more item{2 - droppedItems.length !== 1 ? 's' : ''} needed
                    </div>
                  </div>
                ) : null}
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
      <div className="h-dvh bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-6 overflow-hidden max-h-screen">
        <Card className="p-8 text-center w-full max-w-2xl shadow-2xl rounded-3xl bg-white/95 backdrop-blur-sm border-2">
          <div className="text-7xl mb-6">🎊</div>
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            Whole Number Mastery Complete!
          </h2>
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            You have mastered finding parts from percentages!
          </p>
          <Button 
            onClick={() => navigate('/percentage-difference')}
            className="w-full text-2xl py-6 px-8 h-16 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Next Challenge <ArrowRight className="w-6 h-6 ml-3" />
          </Button>
        </Card>
      </div>
    );
  }

  return null;
};

export default WholeFromPercentage;