import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Home, RotateCcw, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const GRID_SIZE = 20;
const CELL_SIZE = 20;

const Game = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [playerPosition, setPlayerPosition] = useState<Position>({ x: 1, y: 1 });
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [collected, setCollected] = useState<GameState>({
    mammals: 0,
    birds: 0,
    reptiles: 0,
    fish: 0,
    insects: 0
  });
  const [gameStarted, setGameStarted] = useState(false);
  const [totalTarget, setTotalTarget] = useState(30);

  // Animal configuration
  const animalConfig = {
    mammals: { emoji: '🐘', color: 'mammals-red' },
    birds: { emoji: '🦅', color: 'birds-blue' },
    reptiles: { emoji: '🐍', color: 'reptiles-green' },
    fish: { emoji: '🐟', color: 'fish-cyan' },
    insects: { emoji: '🐛', color: 'insects-yellow' }
  };

  // Generate random animals on the grid
  const generateAnimals = useCallback(() => {
    const newAnimals: Animal[] = [];
    const animalTypes = Object.keys(animalConfig) as Array<keyof GameState>;
    
    // Generate 30-50 animals randomly distributed
    const totalAnimals = Math.floor(Math.random() * 21) + 30;
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
        (position.x === 1 && position.y === 1) || // Don't place on player start
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

  // Initialize game
  const startGame = () => {
    setGameStarted(true);
    setPlayerPosition({ x: 1, y: 1 });
    setCollected({ mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0 });
    generateAnimals();
    toast({
      title: "🎮 Mission Started!",
      description: "Use arrow keys or WASD to move around and collect animals!"
    });
  };

  // Handle player movement
  const movePlayer = useCallback((direction: string) => {
    if (!gameStarted) return;
    
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
  }, [gameStarted]);

  // Handle keyboard input
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

  // Check for animal collection
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
      
      // Add collection animation
      const gameGrid = document.getElementById('game-grid');
      if (gameGrid) {
        gameGrid.classList.add('collect-animation');
        setTimeout(() => gameGrid.classList.remove('collect-animation'), 300);
      }
    }
  }, [playerPosition, animals]);

  // Check if game is complete
  const totalCollected = Object.values(collected).reduce((sum, count) => sum + count, 0);
  const isComplete = totalCollected === totalTarget;

  useEffect(() => {
    if (isComplete && gameStarted) {
      toast({
        title: "🎉 Mission Complete!",
        description: `Great job! You collected all ${totalTarget} animals!`,
        duration: 5000
      });
    }
  }, [isComplete, gameStarted, totalTarget, toast]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-space-grotesk font-bold">🕹️ Zoo Keeper's Mission</h1>
          <Button 
            onClick={startGame}
            className="game-button"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            New Game
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="game-card">
              {!gameStarted ? (
                <div className="text-center py-20">
                  <div className="text-8xl mb-6">🎮</div>
                  <h2 className="text-3xl font-space-grotesk font-bold mb-4">Ready to Start Your Mission?</h2>
                  <p className="text-lg text-muted-foreground mb-8">
                    Help the zoo keeper collect all the escaped animals! Use arrow keys or WASD to move around the maze.
                  </p>
                  <Button onClick={startGame} className="game-button text-2xl px-12 py-6">
                    <Play className="mr-3 h-6 w-6" />
                    Start Mission
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-lg font-dm-sans">
                      Collected: {totalCollected} / {totalTarget} animals
                    </p>
                    {isComplete && (
                      <div className="mt-4">
                        <Button 
                          onClick={() => navigate('/visualization')}
                          className="game-button success-glow"
                        >
                          View Your Data 📊
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Game Grid */}
                  <div 
                    id="game-grid"
                    className="relative bg-muted rounded-xl p-4 mx-auto overflow-hidden"
                    style={{ width: GRID_SIZE * CELL_SIZE + 32, height: GRID_SIZE * CELL_SIZE + 32 }}
                  >
                    {/* Player */}
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
                    
                    {/* Animals */}
                    {animals.map(animal => (
                      <div
                        key={animal.id}
                        className={`absolute rounded-full border border-brand-black flex items-center justify-center text-sm bg-${animal.color} transition-all duration-200 hover:scale-110`}
                        style={{
                          left: animal.position.x * CELL_SIZE + 16,
                          top: animal.position.y * CELL_SIZE + 16,
                          width: CELL_SIZE - 2,
                          height: CELL_SIZE - 2
                        }}
                      >
                        {animal.emoji}
                      </div>
                    ))}
                  </div>
                  
                  {/* Controls */}
                  <div className="text-center text-sm text-muted-foreground">
                    Use arrow keys or WASD to move • Touch animals to collect them
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-6">
            {/* Collection Progress */}
            <Card className="game-card">
              <h3 className="text-xl font-space-grotesk font-bold mb-4">Your Collection</h3>
              <div className="space-y-3">
                {Object.entries(animalConfig).map(([type, config]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-${config.color} flex items-center justify-center text-sm border-2 border-brand-black`}>
                        {config.emoji}
                      </div>
                      <span className="font-dm-sans font-medium capitalize">{type}</span>
                    </div>
                    <span className="font-dm-sans font-bold text-lg">
                      {collected[type as keyof GameState]}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Instructions */}
            <Card className="game-card">
              <h3 className="text-xl font-space-grotesk font-bold mb-4">How to Play</h3>
              <div className="space-y-2 text-sm font-dm-sans">
                <p>🧑‍🚀 You are the zoo keeper</p>
                <p>🎯 Collect all escaped animals</p>
                <p>⌨️ Use arrow keys or WASD to move</p>
                <p>📊 Complete to see your data!</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;