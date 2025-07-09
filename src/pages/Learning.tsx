import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Calculator, Lightbulb, Divide, X, Equal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnimalData {
  mammals: number;
  birds: number;
  reptiles: number;
  fish: number;
  insects: number;
}

const Learning = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get data from localStorage (same as other pages)
  const getStoredData = (): AnimalData => {
    const stored = localStorage.getItem("animalData");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0 };
      }
    }
    // If no data exists, try the old gameState format
    const oldStored = localStorage.getItem("gameState");
    if (oldStored) {
      try {
        const gameState = JSON.parse(oldStored);
        if (gameState.collected) {
          return gameState.collected;
        }
      } catch {
        // Fall through to default
      }
    }
    return { mammals: 0, birds: 0, reptiles: 0, fish: 0, insects: 0 };
  };

  const collectedData = getStoredData();
  const totalAnimals = Object.values(collectedData).reduce((sum: number, count: number) => sum + count, 0);

  const animalConfig = {
    mammals: { emoji: '🐘', name: 'Mammals' },
    birds: { emoji: '🦅', name: 'Birds' },
    reptiles: { emoji: '🐍', name: 'Reptiles' },
    fish: { emoji: '🐟', name: 'Fish' },
    insects: { emoji: '🐛', name: 'Insects' }
  };

  const [currentPhase, setCurrentPhase] = useState(3);
  const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
  const [showAnswers, setShowAnswers] = useState<{[key: string]: boolean}>({});

  // Calculate correct answers - ensure numbers are properly typed
  const mammalsPercentage = totalAnimals > 0 ? Math.round((collectedData.mammals / totalAnimals) * 100) : 0;
  const onePercent = totalAnimals > 0 ? totalAnimals / 100 : 0;

  // Visual Components
  const VisualCalculator = ({ operation, values, result, color = "blue" }: {
    operation: string;
    values: (string | number)[];
    result: string;
    color?: string;
  }) => (
    <div className={`bg-gradient-to-r from-${color}-100 to-${color}-50 p-4 rounded-xl border-2 border-${color}-200`}>
      <div className="text-center mb-3">
        <Badge variant="outline" className="bg-white/70 text-sm font-semibold">
          {operation === 'percentage' && '📊 How to Calculate Percentage'}
          {operation === 'multiply' && '🔢 Percentage to Amount'}
          {operation === 'divide' && '➗ Finding 1%'}
        </Badge>
      </div>
      <div className="flex items-center justify-center gap-4 text-xl font-bold">
        <Badge variant="outline" className="text-lg px-4 py-2">{values[0]}</Badge>
        <div className={`w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center text-white`}>
          {operation === 'divide' && <Divide size={18} />}
          {operation === 'multiply' && <X size={18} />}
          {operation === 'percentage' && <Divide size={18} />}
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">{values[1]}</Badge>
        {operation === 'percentage' && (
          <>
            <div className={`w-10 h-10 rounded-full bg-${color}-500 flex items-center justify-center text-white`}>
              <X size={18} />
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">100</Badge>
          </>
        )}
        <div className={`w-10 h-10 rounded-full bg-${color}-600 flex items-center justify-center text-white`}>
          <Equal size={18} />
        </div>
        <Badge variant="secondary" className={`text-lg px-4 py-2 bg-${color}-600 text-white`}>
          {result}
        </Badge>
      </div>
      <div className="text-center mt-3">
        <p className="text-sm text-gray-600">
          {operation === 'percentage' && 'Formula: (Part ÷ Total) × 100 = Percentage'}
          {operation === 'multiply' && 'Formula: Percentage × Total = Amount'}
          {operation === 'divide' && 'Formula: Total ÷ 100 = 1%'}
        </p>
      </div>
    </div>
  );

  const AnimalVisual = ({ count, emoji, total, name }: {
    count: number;
    emoji: string;
    total: number;
    name: string;
  }) => {
    const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
      <div className="bg-white p-4 rounded-lg border space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <div className="text-lg font-bold">{name}</div>
            <div className="text-2xl font-bold text-primary">{count}</div>
          </div>
        </div>
        <Progress value={percentage} className="h-4" />
        <div className="text-lg font-bold text-center">{percentage}%</div>
      </div>
    );
  };

  const checkAnswer = (questionId: string, userAnswer: string, correctAnswer: number) => {
    const isCorrect = Math.abs(parseFloat(userAnswer) - correctAnswer) < 0.1;
    setShowAnswers(prev => ({ ...prev, [questionId]: true }));
    
    if (isCorrect) {
      toast({ title: "🎉 Correct!", description: `Great job!` });
    } else {
      toast({ title: "🤔 Try again", description: `The correct answer is ${correctAnswer}` });
    }
    
    return isCorrect;
  };

  const renderPhase3 = () => (
    <Card className="p-6 border-2 border-green-200 bg-green-50">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-8 w-8 text-green-600" />
        <h3 className="text-2xl font-bold text-green-800">Amount → Percentage 🐘</h3>
      </div>
      
      <div className="space-y-6">
        {/* Visual Example */}
        <div className="bg-white p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-bold mb-4 text-green-700">📚 Example: Mammals</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <AnimalVisual 
              count={collectedData.mammals} 
              emoji="🐘" 
              total={totalAnimals}
              name="Mammals"
            />
            <div className="space-y-4">
              <VisualCalculator 
                operation="percentage"
                values={[collectedData.mammals, totalAnimals]}
                result={`${mammalsPercentage}%`}
                color="green"
              />
              <div className="text-center">
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Fraction: {collectedData.mammals}/{totalAnimals}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Practice */}
        <div className="bg-white p-6 rounded-xl border border-green-200">
          <h4 className="text-lg font-bold mb-4 text-green-700">✏️ Your Turn</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(collectedData).filter(([type]) => type !== 'mammals').map(([type, count]) => {
              const config = animalConfig[type as keyof typeof animalConfig];
              const correctPercentage = totalAnimals > 0 ? Math.round((count / totalAnimals) * 100) : 0;
              const questionId = `phase3-${type}`;
              
              return (
                <div key={type} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <AnimalVisual 
                    count={count} 
                    emoji={config.emoji} 
                    total={totalAnimals}
                    name={config.name}
                  />
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="%"
                      value={userAnswers[questionId] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => checkAnswer(questionId, userAnswers[questionId], correctPercentage)}
                      disabled={!userAnswers[questionId]}
                      size="sm"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderPhase4 = () => (
    <Card className="p-6 border-2 border-blue-200 bg-blue-50">
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="h-8 w-8 text-blue-600" />
        <h3 className="text-2xl font-bold text-blue-800">Percentage → Amount 🦅</h3>
      </div>
      
      <div className="space-y-6">
        {/* Visual Example */}
        <div className="bg-white p-6 rounded-xl border border-blue-200">
          <h4 className="text-lg font-bold mb-4 text-blue-700">📚 Example: 25% = ? Birds</h4>
          
          <div className="space-y-4">
            <VisualCalculator 
              operation="multiply"
              values={["25%", totalAnimals]}
              result={`${Math.round(0.25 * totalAnimals)} 🦅`}
              color="blue"
            />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({length: Math.min(Math.round(0.25 * totalAnimals), 15)}).map((_, i) => (
                <div key={i} className="text-3xl text-center">🦅</div>
              ))}
              {Math.round(0.25 * totalAnimals) > 15 && (
                <div className="text-lg text-center">...and {Math.round(0.25 * totalAnimals) - 15} more</div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Practice */}
        <div className="bg-white p-6 rounded-xl border border-blue-200">
          <h4 className="text-lg font-bold mb-4 text-blue-700">✏️ Your Turn</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { percentage: 30, animal: 'mammals', emoji: '🐘' },
              { percentage: 15, animal: 'reptiles', emoji: '🐍' },
              { percentage: 20, animal: 'fish', emoji: '🐟' },
              { percentage: 35, animal: 'insects', emoji: '🐛' }
            ].map(({ percentage, animal, emoji }) => {
              const correctAmount = Math.round((percentage / 100) * totalAnimals);
              const questionId = `phase4-${animal}`;
              
              return (
                <div key={animal} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="text-center">
                    <Badge variant="outline" className="text-lg px-4 py-2 mb-2">
                      {percentage}% of {totalAnimals}
                    </Badge>
                    <div className="text-2xl">{emoji}</div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="amount"
                      value={userAnswers[questionId] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => checkAnswer(questionId, userAnswers[questionId], correctAmount)}
                      disabled={!userAnswers[questionId]}
                      size="sm"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderPhase5 = () => (
    <Card className="p-6 border-2 border-purple-200 bg-purple-50">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="h-8 w-8 text-purple-600" />
        <h3 className="text-2xl font-bold text-purple-800">Master 1% 📊</h3>
      </div>
      
      <div className="space-y-6">
        {/* 1% Visual */}
        <div className="bg-white p-6 rounded-xl border border-purple-200">
          <h4 className="text-lg font-bold mb-4 text-purple-700">🔍 Find 1%</h4>
          
          <VisualCalculator 
            operation="divide"
            values={[totalAnimals, "100"]}
            result={`${onePercent.toFixed(1)} animals`}
            color="purple"
          />
          
          <div className="mt-4 text-center">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              1% = {onePercent.toFixed(1)} animals
            </Badge>
          </div>
        </div>

        {/* Interactive Building */}
        <div className="bg-white p-6 rounded-xl border border-purple-200">
          <h4 className="text-lg font-bold mb-4 text-purple-700">🔧 Build Any %</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { label: "1%", multiplier: 1 },
              { label: "3%", multiplier: 3 },
              { label: "7%", multiplier: 7 },
              { label: "12%", multiplier: 12 }
            ].map(({ label, multiplier }) => {
              const answerKey = `phase5-${multiplier}`;
              const correctAmount = (multiplier * onePercent).toFixed(1);
              
              return (
                <div key={label} className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="text-center">
                    <Badge variant="outline" className="text-lg px-4 py-2 mb-2">
                      {label}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {multiplier} × {onePercent.toFixed(1)} = ?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="answer"
                      value={userAnswers[answerKey] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [answerKey]: e.target.value }))}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => checkAnswer(answerKey, userAnswers[answerKey], parseFloat(correctAmount))}
                      disabled={!userAnswers[answerKey]}
                      size="sm"
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );

  if (totalAnimals === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">🧮 Learn Percentages & Fractions</h2>
          <p className="text-muted-foreground mb-4">
            First, collect some animals to start learning! 
          </p>
          <Button onClick={() => navigate('/')}>
            Go Collect Animals
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back Home
          </Button>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🧮 Learn Percentages & Fractions</h1>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Using your {totalAnimals} animals!
          </Badge>
        </div>

        {/* Phase Navigation */}
        <div className="flex justify-center gap-4 mb-8">
          {[3, 4, 5].map((phase) => (
            <Button
              key={phase}
              variant={currentPhase === phase ? "default" : "outline"}
              onClick={() => setCurrentPhase(phase)}
              className="w-24"
            >
              Phase {phase}
            </Button>
          ))}
        </div>

        {/* Current Phase Content */}
        {currentPhase === 3 && renderPhase3()}
        {currentPhase === 4 && renderPhase4()}
        {currentPhase === 5 && renderPhase5()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button 
            variant="outline"
            onClick={() => setCurrentPhase(Math.max(3, currentPhase - 1))}
            disabled={currentPhase === 3}
          >
            Previous Phase
          </Button>
          <Button 
            onClick={() => setCurrentPhase(Math.min(5, currentPhase + 1))}
            disabled={currentPhase === 5}
          >
            Next Phase
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Learning;