import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Play, BarChart3, Trophy } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl lg:text-6xl font-space-grotesk font-bold text-foreground mb-4">
            🎮 Animal Collection Data Adventure
          </h1>
          <p className="text-xl text-muted-foreground font-dm-sans max-w-2xl mx-auto">
            Become a zoo keeper! Collect animals in a fun maze game, then learn about data, percentages, and fractions with your collection.
          </p>
        </div>

        {/* Game Phases Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Phase 1: Collection Game */}
          <Card className="game-card hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🕹️</div>
              <h3 className="text-2xl font-space-grotesk font-bold mb-3">Zoo Keeper's Mission</h3>
              <p className="text-lg font-dm-sans text-muted-foreground mb-6">
                Navigate through zoo habitats and collect escaped animals! Gather mammals 🐘, birds 🦅, reptiles 🐍, fish 🐟, and insects 🐛.
              </p>
              <Button 
                onClick={() => navigate('/game')}
                className="game-button w-full"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Mission
              </Button>
            </div>
          </Card>

          {/* Phase 2: Data Visualization */}
          <Card className="game-card hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-2xl font-space-grotesk font-bold mb-3">Understanding Your Collection</h3>
              <p className="text-lg font-dm-sans text-muted-foreground mb-6">
                See your animal collection displayed in colorful pie charts and bar graphs to understand your data better.
              </p>
              <Button 
                onClick={() => navigate('/visualization')}
                className="game-button-secondary w-full"
                disabled
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                View Data
              </Button>
            </div>
          </Card>

          {/* Phase 3-5: Learning Modules */}
          <Card className="game-card hover:scale-105 transition-transform duration-300">
            <div className="text-center">
              <div className="text-6xl mb-4">🧮</div>
              <h3 className="text-2xl font-space-grotesk font-bold mb-3">Percentage Mastery</h3>
              <p className="text-lg font-dm-sans text-muted-foreground mb-6">
                Learn to convert amounts to percentages, percentages to amounts, and master the power of 1%!
              </p>
              <Button 
                onClick={() => navigate('/learning')}
                className="game-button-secondary w-full"
                disabled
              >
                <Trophy className="mr-2 h-5 w-5" />
                Learn Math
              </Button>
            </div>
          </Card>
        </div>

        {/* Animal Categories Preview */}
        <Card className="game-card">
          <div className="text-center">
            <h3 className="text-3xl font-space-grotesk font-bold mb-6">Meet the Animal Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { emoji: '🐘', name: 'Mammals', color: 'mammals-red' },
                { emoji: '🦅', name: 'Birds', color: 'birds-blue' },
                { emoji: '🐍', name: 'Reptiles', color: 'reptiles-green' },
                { emoji: '🐟', name: 'Fish', color: 'fish-cyan' },
                { emoji: '🐛', name: 'Insects', color: 'insects-yellow' }
              ].map((category, index) => (
                <div key={index} className="text-center">
                  <div className={`w-20 h-20 rounded-full bg-${category.color} flex items-center justify-center text-4xl mx-auto mb-2 border-4 border-brand-black`}>
                    {category.emoji}
                  </div>
                  <p className="font-dm-sans font-medium text-lg">{category.name}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <div className="text-center mt-12">
          <h3 className="text-2xl font-space-grotesk font-bold mb-4">How to Play</h3>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-4xl mb-2">1️⃣</div>
              <h4 className="font-dm-sans font-semibold text-lg mb-2">Collect Animals</h4>
              <p className="text-muted-foreground">Move through the maze to collect different types of animals</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">2️⃣</div>
              <h4 className="font-dm-sans font-semibold text-lg mb-2">View Your Data</h4>
              <p className="text-muted-foreground">See your collection in charts and graphs</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">3️⃣</div>
              <h4 className="font-dm-sans font-semibold text-lg mb-2">Learn Math</h4>
              <p className="text-muted-foreground">Convert between amounts and percentages</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;