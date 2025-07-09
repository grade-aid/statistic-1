import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const GRID_SIZE = 15;
const CELL_SIZE = 24;

const Index = () => {
  const { toast } = useToast();
  const [phase, setPhase] = useState<GamePhase>('start');
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [collected, setCollected] = useState<GameState>({
    mammals: 0,
    birds: 0,
    reptiles: 0,
    fish: 0,
    insects: 0
  });
  const [totalTarget, setTotalTarget] = useState(20);

  const animalConfig = {
    mammals: { emoji: '🐘', color: 'mammals-red' },
    birds: { emoji: '🦅', color: 'birds-blue' },
    reptiles: { emoji: '🐍', color: 'reptiles-green' },
    fish: { emoji: '🐟', color: 'fish-cyan' },
    insects: { emoji: '🐛', color: 'insects-yellow' }
  };

  const generateAnimals = useCallback(() => {
    const newAnimals: Animal[] = [];
    const animalTypes = Object.keys(animalConfig) as Array<keyof GameState>;
    const totalAnimals = 20;
    setTotalTarget(totalAnimals);
    
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
      } while (
        (position.x === 1 && position.y === 1) ||
        newAnimals.some(animal => animal.position.x === position.x && animal.position.y === position.y) &&
        attempts < 50
      );
      
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

  const startGame = () => {
    setPhase('game');
    setPlayerPosition({ x: 1, y: 1 });
    setCollected({ mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0 });
    generateAnimals();
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
      
      return { x: newX, y: newY };
    });
  }, [phase]);

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
    const animalAtPosition = animals.find(
      animal => animal.position.x === playerPosition.x && animal.position.y === playerPosition.y
    );
    
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
    setCollected({ mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0 });
  };

  if (phase === 'start') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
      </div>
    );
  }

  if (phase === 'game') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-space-grotesk font-bold mb-2">Collect Animals</h2>
            <p className="text-xl font-dm-sans">
              {totalCollected} / {totalTarget} animals
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="game-card">
                <div 
                  className="relative bg-muted rounded-xl p-4 mx-auto"
                  style={{ width: GRID_SIZE * CELL_SIZE + 32, height: GRID_SIZE * CELL_SIZE + 32 }}
                >
                  <div
                    className="absolute bg-brand-purple rounded-full border-2 border-brand-black transition-all duration-150 flex items-center justify-center text-lg z-10"
                    style={{
                      left: playerPosition.x * CELL_SIZE + 16,
                      top: playerPosition.y * CELL_SIZE + 16,
                      width: CELL_SIZE - 2,
                      height: CELL_SIZE - 2
                    }}
                  >
                    🧑‍🚀
                  </div>
                  
                  {animals.map(animal => (
                    <div
                      key={animal.id}
                      className={`absolute rounded-full border border-brand-black flex items-center justify-center bg-${animal.color}`}
                      style={{
                        left: animal.position.x * CELL_SIZE + 16,
                        top: animal.position.y * CELL_SIZE + 16,
                        width: CELL_SIZE - 2,
                        height: CELL_SIZE - 2,
                        fontSize: '14px'
                      }}
                    >
                      {animal.emoji}
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Use arrow keys or WASD to move
                </p>
              </Card>
            </div>

            <Card className="game-card">
              <h3 className="text-xl font-space-grotesk font-bold mb-4">Collection</h3>
              <div className="space-y-3">
                {Object.entries(animalConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full bg-${config.color} flex items-center justify-center text-xs border border-brand-black`}>
                        {config.emoji}
                      </div>
                      <span className="font-dm-sans text-sm capitalize">{type}</span>
                    </div>
                    <span className="font-dm-sans font-bold">
                      {collected[type as keyof GameState]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'results') {
    const dataEntries = Object.entries(collected).filter(([, value]) => value > 0);
    const maxValue = Math.max(...dataEntries.map(([, value]) => value));

    return (
      <div className="min-h-screen bg-background p-4">
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
                const percentage = (count / maxValue) * 100;
                
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.emoji}</span>
                        <span className="font-dm-sans font-semibold capitalize">{type}</span>
                      </div>
                      <span className="font-dm-sans font-bold text-lg">{count}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-6 border-2 border-brand-black">
                      <div 
                        className={`h-full bg-${config.color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2`}
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-bold text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="text-center">
            <Button onClick={resetGame} className="game-button text-xl px-8 py-4">
              <Play className="mr-2 h-5 w-5" />
              Play Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;