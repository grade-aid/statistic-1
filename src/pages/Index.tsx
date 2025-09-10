import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
type GamePhase = 'start' | 'game' | 'results';
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
// Responsive grid configuration
const GRID_SIZE = 20;
const getResponsiveCellSize = () => {
  if (typeof window === 'undefined') return 20;
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
  if (vw >= 1024) return 24; // Desktop
  if (vw >= 768) return 18;  // Tablet
  return 16; // Mobile fallback
};

const getCellSize = () => getResponsiveCellSize();
const Index = () => {
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<GamePhase>('start');
  const [playerPosition, setPlayerPosition] = useState<Position>({
    x: 1,
    y: 1
  });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [hunters, setHunters] = useState<Hunter[]>([]);
  const [lives, setLives] = useState(9);
  const [collected, setCollected] = useState<GameState>({
    mammals: 0,
    birds: 0,
    reptiles: 0,
    fish: 0,
    insects: 0
  });
  const [totalTarget, setTotalTarget] = useState(20);
  const [walls, setWalls] = useState<Position[]>([]);
  const animalConfig = {
    mammals: {
      emoji: '🐘',
      color: 'red-500'
    },
    birds: {
      emoji: '🦅',
      color: 'blue-500'
    },
    reptiles: {
      emoji: '🐍',
      color: 'green-500'
    },
    fish: {
      emoji: '🐟',
      color: 'cyan-500'
    },
    insects: {
      emoji: '🐛',
      color: 'yellow-500'
    }
  };
  const generateWalls = useCallback(() => {
    const newWalls: Position[] = [];
    // Generate maze-like walls
    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        // Border walls
        if (x === 0 || x === GRID_SIZE - 1 || y === 0 || y === GRID_SIZE - 1) {
          newWalls.push({
            x,
            y
          });
        }
        // Internal maze walls
        else if (x % 3 === 0 && y % 3 === 0 && Math.random() > 0.5) {
          newWalls.push({
            x,
            y
          });
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

    // Use strategic animal counts for clean percentages - all different numbers, totals > 20
    const animalDistributions = [{
      total: 25,
      counts: [1, 3, 4, 7, 10]
    },
    // 4%, 12%, 16%, 28%, 40%
    {
      total: 25,
      counts: [2, 4, 5, 6, 8]
    },
    // 8%, 16%, 20%, 24%, 32%
    {
      total: 50,
      counts: [3, 7, 9, 11, 20]
    },
    // 6%, 14%, 18%, 22%, 40%
    {
      total: 50,
      counts: [4, 6, 10, 12, 18]
    },
    // 8%, 12%, 20%, 24%, 36%
    {
      total: 100,
      counts: [5, 15, 20, 25, 35]
    },
    // 5%, 15%, 20%, 25%, 35%
    {
      total: 20,
      counts: [1, 2, 3, 5, 9]
    } // 5%, 10%, 15%, 25%, 45%
    ];
    const selectedDistribution = animalDistributions[Math.floor(Math.random() * animalDistributions.length)];
    const totalAnimals = selectedDistribution.total;
    setTotalTarget(totalAnimals);
    const isWallPosition = (pos: Position) => {
      return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
    };
    // Generate animals based on the strategic distribution
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
        } while ((position.x === 1 && position.y === 1 || isWallPosition(position) || newAnimals.some(animal => animal.position.x === position.x && animal.position.y === position.y)) && attempts < 50);
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
      } while ((position.x === 1 && position.y === 1 || isWallPosition(position) || newHunters.some(hunter => hunter.position.x === position.x && hunter.position.y === position.y)) && attempts < 50);
      newHunters.push({
        id: `hunter-${i}`,
        position,
        emoji: hunterEmojis[i],
        direction: ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)] as any
      });
    }
    setHunters(newHunters);
  }, []);
  const startGame = () => {
    setPhase('game');
    setPlayerPosition({
      x: 1,
      y: 1
    });
    setLives(9);
    setCollected({
      mammals: 0,
      birds: 0,
      reptiles: 0,
      fish: 0,
      insects: 0
    });

    // Generate walls first
    const newWalls = generateWalls();
    setWalls(newWalls);

    // Then generate animals and hunters using the wall positions
    generateAnimals(newWalls);
    generateHunters(newWalls);
  };
  const movePlayer = useCallback((direction: string) => {
    if (phase !== 'game') return;
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
      const newPos = {
        x: newX,
        y: newY
      };

      // Check for wall collision
      if (isWall(newPos)) {
        return prev;
      }
      return newPos;
    });
  }, [phase, isWall]);

  // Hunter movement AI
  useEffect(() => {
    if (phase !== 'game' || hunters.length === 0) return;
    const interval = setInterval(() => {
      setHunters(prevHunters => prevHunters.map(hunter => {
        const directions = ['up', 'down', 'left', 'right'] as const;
        let newPosition = {
          ...hunter.position
        };
        let newDirection = hunter.direction;

        // 60% chance to hunt player, 40% chance random movement
        if (Math.random() < 0.6) {
          // Calculate direction towards player
          const dx = playerPosition.x - hunter.position.x;
          const dy = playerPosition.y - hunter.position.y;

          // Choose direction that gets closer to player
          if (Math.abs(dx) > Math.abs(dy)) {
            newDirection = dx > 0 ? 'right' : 'left';
          } else if (dy !== 0) {
            newDirection = dy > 0 ? 'down' : 'up';
          }
        } else {
          // Random movement
          newDirection = directions[Math.floor(Math.random() * directions.length)];
        }

        // Try to move in chosen direction
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

        // If hit wall, try alternative direction or stay put
        if (isWall(newPosition)) {
          // Try perpendicular directions
          const altDirections = newDirection === 'up' || newDirection === 'down' ? ['left', 'right'] : ['up', 'down'];
          for (const altDir of altDirections) {
            let altPos = {
              ...hunter.position
            };
            switch (altDir) {
              case 'up':
                altPos.y = Math.max(0, hunter.position.y - 1);
                break;
              case 'down':
                altPos.y = Math.min(GRID_SIZE - 1, hunter.position.y + 1);
                break;
              case 'left':
                altPos.x = Math.max(0, hunter.position.x - 1);
                break;
              case 'right':
                altPos.x = Math.min(GRID_SIZE - 1, hunter.position.x + 1);
                break;
            }
            if (!isWall(altPos)) {
              newPosition = altPos;
              newDirection = altDir as any;
              break;
            }
          }

          // If all directions blocked, stay in place
          if (isWall(newPosition)) {
            newPosition = hunter.position;
          }
        }
        return {
          ...hunter,
          position: newPosition,
          direction: newDirection
        };
      }));
    }, 180); // Even faster movement for maximum difficulty

    return () => clearInterval(interval);
  }, [phase, hunters.length, isWall, playerPosition]);

  // Check for hunter collision (player death)
  useEffect(() => {
    const hunterAtPosition = hunters.find(hunter => hunter.position.x === playerPosition.x && hunter.position.y === playerPosition.y);
    if (hunterAtPosition && phase === 'game') {
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          // Game over
          setPhase('start');
          toast({
            title: "💀 Game Over!",
            description: "Better luck next time!",
            duration: 3000
          });
        } else {
          // Respawn player
          setPlayerPosition({
            x: 1,
            y: 1
          });
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
  useEffect(() => {
    const animalAtPosition = animals.find(animal => animal.position.x === playerPosition.x && animal.position.y === playerPosition.y);
    if (animalAtPosition) {
      setAnimals(prev => prev.filter(animal => animal.id !== animalAtPosition.id));
      setCollected(prev => ({
        ...prev,
        [animalAtPosition.type]: prev[animalAtPosition.type] + 1
      }));
    }
  }, [playerPosition, animals]);
  const totalCollected = Object.values(collected).reduce((sum, count) => sum + count, 0);
  const isComplete = totalCollected === totalTarget && phase === 'game';
  useEffect(() => {
    if (isComplete) {
      setTimeout(() => setPhase('results'), 1000);
    }
  }, [isComplete]);
  const autoComplete = () => {
    if (phase !== 'game') return;
    
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
      duration: 2000
    });
  };

  const resetGame = () => {
    setPhase('start');
    setCollected({
      mammals: 0,
      birds: 0,
      reptiles: 0,
      fish: 0,
      insects: 0
    });
  };
  if (phase === 'start') {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-6">
        <Card className="game-card text-center w-full max-w-md mx-auto">
          <div className="text-4xl md:text-6xl mb-4">🎮</div>
          <h1 className="text-2xl md:text-3xl font-space-grotesk font-bold mb-3">
            Animal Adventure
          </h1>
          <p className="text-sm md:text-base font-dm-sans text-muted-foreground mb-4">
            Collect animals, see your data!
          </p>
          <Button onClick={startGame} className="game-button w-full text-lg md:text-xl py-3 md:py-4">
            <Play className="mr-2 h-4 w-4 md:h-5 md:w-5" />
            Start
          </Button>
        </Card>
      </div>;
  }
  if (phase === 'game') {
    const cellSize = getCellSize();
    const boardSize = GRID_SIZE * cellSize + 32;
    
    return <div className="min-h-screen bg-background p-3 md:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-space-grotesk font-bold mb-2">Collect Animals</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 mb-2">
              <div className="flex items-center gap-1">
                {Array.from({
                length: 9
              }, (_, i) => <span key={i} className="text-base md:text-lg">
                    {i < lives ? '❤️' : '🖤'}
                  </span>)}
              </div>
              <p className="text-base md:text-lg font-dm-sans">
                {totalCollected} / {totalTarget} animals
              </p>
              <Button 
                onClick={autoComplete} 
                variant="outline" 
                size="sm"
                className="text-xs md:text-sm"
              >
                Auto Complete
              </Button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-4">
            <div className="flex-1 flex justify-center">
              <Card className="game-card w-full max-w-none">
                <div className="relative bg-muted rounded-xl p-4 mx-auto overflow-hidden" style={{
                width: Math.min(boardSize, window.innerWidth - 64),
                height: Math.min(boardSize, window.innerHeight - 200),
                maxWidth: '100%',
                aspectRatio: '1'
              }}>
                  <div className="absolute bg-brand-purple rounded-full border-2 border-brand-black transition-all duration-150 flex items-center justify-center z-10" style={{
                  left: playerPosition.x * cellSize + 16,
                  top: playerPosition.y * cellSize + 16,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  fontSize: `${cellSize * 0.6}px`
                }}>
                    🐱
                  </div>
                  
                  {/* Walls */}
                  {walls.map((wall, index) => <div key={`wall-${index}`} className="absolute bg-brand-blue border border-brand-black" style={{
                  left: wall.x * cellSize + 16,
                  top: wall.y * cellSize + 16,
                  width: cellSize - 2,
                  height: cellSize - 2
                }} />)}
                  
                  {/* Animals */}
                  {animals.map(animal => <div key={animal.id} className={`absolute rounded-full border border-brand-black flex items-center justify-center bg-${animal.color}`} style={{
                  left: animal.position.x * cellSize + 16,
                  top: animal.position.y * cellSize + 16,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  fontSize: `${cellSize * 0.6}px`
                }}>
                      {animal.emoji}
                    </div>)}
                  
                  {/* Hunters */}
                  {hunters.map(hunter => <div key={hunter.id} className="absolute rounded-full border-2 border-red-500 bg-red-600 flex items-center justify-center transition-all duration-300" style={{
                  left: hunter.position.x * cellSize + 16,
                  top: hunter.position.y * cellSize + 16,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  fontSize: `${cellSize * 0.6}px`
                }}>
                      {hunter.emoji}
                    </div>)}
                </div>
                <p className="text-center text-xs md:text-sm text-muted-foreground mt-3">
                  Use arrow keys or WASD to move
                </p>
              </Card>
            </div>

            <div className="xl:w-72">
              <Card className="game-card">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base md:text-lg font-space-grotesk font-bold">Collection</h3>
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
                <div className="space-y-2">
                  {Object.entries(animalConfig).map(([type, config]) => <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-${config.color} flex items-center justify-center text-xs border border-brand-black`}>
                          {config.emoji}
                        </div>
                        <span className="font-dm-sans text-xs md:text-sm capitalize">{type}</span>
                      </div>
                      <span className="font-dm-sans font-bold text-sm md:text-base">
                        {collected[type as keyof GameState]}
                      </span>
                    </div>)}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>;
  }
  if (phase === 'results') {
    const dataEntries = Object.entries(collected);
    const maxValue = Math.max(...Object.values(collected));
    return <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <div className="text-3xl md:text-4xl mb-3">🎉</div>
            <h2 className="text-2xl md:text-3xl font-space-grotesk font-bold mb-3">
              Mission Complete!
            </h2>
            <p className="text-base md:text-lg font-dm-sans">
              You collected {totalCollected} animals
            </p>
          </div>

          <Card className="game-card mb-6">
            <h3 className="text-lg md:text-xl font-space-grotesk font-bold mb-4 text-center">Your Data</h3>
            <div className="space-y-3">
              {dataEntries.map(([type, count]) => {
              const config = animalConfig[type as keyof typeof animalConfig];
              const percentage = maxValue > 0 ? count / maxValue * 100 : 0;
              return <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base md:text-lg">{config.emoji}</span>
                        <span className="font-dm-sans font-semibold capitalize text-sm md:text-base">{type}</span>
                      </div>
                      <span className="font-dm-sans font-bold text-sm md:text-base">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 md:h-4 border-2 border-brand-black">
                      <div className="h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-1" style={{
                    width: count > 0 ? `${percentage}%` : '0%',
                    backgroundColor: count > 0 ? type === 'mammals' ? '#ef4444' : type === 'birds' ? '#3b82f6' : type === 'reptiles' ? '#22c55e' : type === 'fish' ? '#06b6d4' : type === 'insects' ? '#eab308' : '#6b7280' : '#6b7280'
                  }}>
                        {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </Card>

          <div className="text-center">
            <Button onClick={() => {
            // Save data to localStorage so other pages can access it
            localStorage.setItem('animalData', JSON.stringify(collected));
            navigate('/visualization', {
              state: {
                collected: collected,
                totalCollected: totalCollected,
                animalConfig: animalConfig
              }
            });
          }} className="game-button text-base md:text-lg px-4 md:px-6 py-3">
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue to Learning
            </Button>
          </div>
        </div>
      </div>;
  }
  return null;
};
export default Index;