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
const GRID_SIZE = 15;
const CELL_SIZE = 24;
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
      color: 'mammals-red'
    },
    birds: {
      emoji: '🦅',
      color: 'birds-blue'
    },
    reptiles: {
      emoji: '🐍',
      color: 'reptiles-green'
    },
    fish: {
      emoji: '🐟',
      color: 'fish-cyan'
    },
    insects: {
      emoji: '🐛',
      color: 'insects-yellow'
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
    const totalAnimals = Math.floor(Math.random() * 31) + 20; // Random number from 20 to 50
    setTotalTarget(totalAnimals);
    const isWallPosition = (pos: Position) => {
      return wallPositions.some(wall => wall.x === pos.x && wall.y === pos.y);
    };
    for (let i = 0; i < totalAnimals; i++) {
      const type = animalTypes[Math.floor(Math.random() * animalTypes.length)];
      const config = animalConfig[type];
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
        id: `${type}-${i}`,
        type,
        position,
        emoji: config.emoji,
        color: config.color
      });
    }
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
    }, 150); // Much faster movement

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
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="game-card text-center max-w-md">
          <div className="text-8xl mb-6">🎮</div>
          <h1 className="text-4xl font-space-grotesk font-bold mb-4">
            Animal Adventure
          </h1>
          <p className="text-lg font-dm-sans text-muted-foreground mb-8">
            Collect animals, see your data!
          </p>
          <Button onClick={startGame} className="game-button w-full text-2xl py-6">
            <Play className="mr-3 h-6 w-6" />
            Start
          </Button>
        </Card>
      </div>;
  }
  if (phase === 'game') {
    return <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-space-grotesk font-bold mb-2">Collect Animals</h2>
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="flex items-center gap-1">
                {Array.from({
                length: 9
              }, (_, i) => <span key={i} className="text-2xl">
                    {i < lives ? '❤️' : '🖤'}
                  </span>)}
              </div>
              <p className="text-xl font-dm-sans">
                {totalCollected} / {totalTarget} animals
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="game-card">
                <div className="relative bg-muted rounded-xl p-4 mx-auto" style={{
                width: GRID_SIZE * CELL_SIZE + 32,
                height: GRID_SIZE * CELL_SIZE + 32
              }}>
                  <div className="absolute bg-brand-purple rounded-full border-2 border-brand-black transition-all duration-150 flex items-center justify-center text-lg z-10" style={{
                  left: playerPosition.x * CELL_SIZE + 16,
                  top: playerPosition.y * CELL_SIZE + 16,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2
                }}>
                    🐱
                  </div>
                  
                  {/* Walls */}
                  {walls.map((wall, index) => <div key={`wall-${index}`} className="absolute bg-brand-blue border border-brand-black" style={{
                  left: wall.x * CELL_SIZE + 16,
                  top: wall.y * CELL_SIZE + 16,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2
                }} />)}
                  
                  {/* Animals */}
                  {animals.map(animal => <div key={animal.id} className={`absolute rounded-full border border-brand-black flex items-center justify-center bg-${animal.color}`} style={{
                  left: animal.position.x * CELL_SIZE + 16,
                  top: animal.position.y * CELL_SIZE + 16,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                  fontSize: '14px'
                }}>
                      {animal.emoji}
                    </div>)}
                  
                  {/* Hunters */}
                  {hunters.map(hunter => <div key={hunter.id} className="absolute rounded-full border-2 border-red-500 bg-red-600 flex items-center justify-center text-lg transition-all duration-300" style={{
                  left: hunter.position.x * CELL_SIZE + 16,
                  top: hunter.position.y * CELL_SIZE + 16,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2
                }}>
                      {hunter.emoji}
                    </div>)}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Use arrow keys or WASD to move
                </p>
              </Card>
            </div>

            <Card className="game-card">
              <h3 className="text-xl font-space-grotesk font-bold mb-4">Collection</h3>
              <div className="space-y-3">
                {Object.entries(animalConfig).map(([type, config]) => <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full bg-${config.color} flex items-center justify-center text-xs border border-brand-black`}>
                        {config.emoji}
                      </div>
                      <span className="font-dm-sans text-sm capitalize">{type}</span>
                    </div>
                    <span className="font-dm-sans font-bold">
                      {collected[type as keyof GameState]}
                    </span>
                  </div>)}
              </div>
            </Card>
          </div>
        </div>
      </div>;
  }
  if (phase === 'results') {
    const dataEntries = Object.entries(collected);
    const maxValue = Math.max(...Object.values(collected));
    return <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-4xl font-space-grotesk font-bold mb-4">
              Mission Complete!
            </h2>
            <p className="text-xl font-dm-sans">
              You collected {totalCollected} animals
            </p>
          </div>

          <Card className="game-card mb-8">
            <h3 className="text-2xl font-space-grotesk font-bold mb-6 text-center">Your Data</h3>
            <div className="space-y-4">
              {dataEntries.map(([type, count]) => {
              const config = animalConfig[type as keyof typeof animalConfig];
              const percentage = maxValue > 0 ? count / maxValue * 100 : 0;
              return <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.emoji}</span>
                        <span className="font-dm-sans font-semibold capitalize">{type}</span>
                      </div>
                      
                    </div>
                    <div className="w-full bg-muted rounded-full h-6 border-2 border-brand-black">
                      <div className={`h-full ${count > 0 ? `bg-${config.color}` : 'bg-muted'} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2`} style={{
                    width: count > 0 ? `${percentage}%` : '0%'
                  }}>
                        {count > 0 && <span className="text-xs font-bold text-white">{count}</span>}
                      </div>
                    </div>
                  </div>;
            })}
            </div>
          </Card>

          <div className="text-center">
            <Button onClick={() => navigate('/visualization')} className="game-button text-xl px-8 py-4">
              <ArrowRight className="mr-2 h-5 w-5" />
              Continue to Learning
            </Button>
          </div>
        </div>
      </div>;
  }
  return null;
};
export default Index;