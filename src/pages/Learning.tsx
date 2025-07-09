import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CheckCircle, Calculator, Lightbulb } from "lucide-react";

const Learning = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from navigation state or use fallback data
  const gameState = location.state as {
    collected?: {
      mammals: number;
      birds: number;
      reptiles: number;
      fish: number;
      insects: number;
    };
    totalCollected?: number;
  } | null;

  const collectedData = gameState?.collected || {
    mammals: 12,
    birds: 8,
    reptiles: 6,
    fish: 10,
    insects: 4
  };

  const totalAnimals = gameState?.totalCollected || Object.values(collectedData).reduce((sum, count) => sum + count, 0);

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

  // Calculate correct answers
  const mammalsPercentage = Math.round((collectedData.mammals / totalAnimals) * 100);
  const onePercent = totalAnimals / 100;

  const checkAnswer = (questionId: string, userAnswer: string, correctAnswer: number) => {
    const isCorrect = Math.abs(parseFloat(userAnswer) - correctAnswer) < 0.1;
    setShowAnswers(prev => ({ ...prev, [questionId]: true }));
    return isCorrect;
  };

  const renderPhase3 = () => (
    <Card className="game-card">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="h-8 w-8 text-primary" />
        <h3 className="text-2xl font-space-grotesk font-bold">Phase 3: Amount to Percentage Conversion</h3>
      </div>
      
      <div className="space-y-6">
        {/* Guided Example */}
        <div className="bg-blue-50 dark:bg-blue-950 p-6 rounded-lg border-2 border-blue-200">
          <h4 className="text-xl font-bold mb-4 text-blue-800 dark:text-blue-200">
            🎯 Guided Example: "What Percentage Are Mammals? 🐘"
          </h4>
          <div className="space-y-3 text-lg">
            <p>• You collected <span className="font-bold text-blue-600">{collectedData.mammals} mammals 🐘</span> out of <span className="font-bold">{totalAnimals} total animals</span></p>
            <p>• To find percentage: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">({collectedData.mammals} ÷ {totalAnimals}) × 100 = {mammalsPercentage}%</span></p>
            <p>• As a fraction: <span className="font-mono bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{collectedData.mammals}/{totalAnimals} = {Math.round(collectedData.mammals * 10 / totalAnimals)}/10</span></p>
          </div>
        </div>

        {/* Student Practice */}
        <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg border-2 border-green-200">
          <h4 className="text-xl font-bold mb-4 text-green-800 dark:text-green-200">
            ✏️ Your Turn: Calculate percentages for each animal type
          </h4>
          
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(collectedData).filter(([type]) => type !== 'mammals').map(([type, count]) => {
              const config = animalConfig[type as keyof typeof animalConfig];
              const correctPercentage = Math.round((count / totalAnimals) * 100);
              const questionId = `phase3-${type}`;
              
              return (
                <div key={type} className="space-y-2">
                  <p className="font-semibold">{config.emoji} {config.name}: {count} out of {totalAnimals}</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Enter %"
                      className="w-20 px-3 py-2 border rounded-lg"
                      value={userAnswers[questionId] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                    />
                    <span>%</span>
                    <Button
                      size="sm"
                      onClick={() => checkAnswer(questionId, userAnswers[questionId], correctPercentage)}
                      disabled={!userAnswers[questionId]}
                    >
                      Check
                    </Button>
                  </div>
                  {showAnswers[questionId] && (
                    <p className={`text-sm font-semibold ${
                      Math.abs(parseFloat(userAnswers[questionId]) - correctPercentage) < 0.1 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {Math.abs(parseFloat(userAnswers[questionId]) - correctPercentage) < 0.1 
                        ? '✅ Correct!' 
                        : `❌ Correct answer: ${correctPercentage}%`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderPhase4 = () => (
    <Card className="game-card">
      <div className="flex items-center gap-3 mb-6">
        <Lightbulb className="h-8 w-8 text-primary" />
        <h3 className="text-2xl font-space-grotesk font-bold">Phase 4: Percentage to Amount Conversion</h3>
      </div>
      
      <div className="space-y-6">
        {/* Guided Example */}
        <div className="bg-purple-50 dark:bg-purple-950 p-6 rounded-lg border-2 border-purple-200">
          <h4 className="text-xl font-bold mb-4 text-purple-800 dark:text-purple-200">
            🎯 Guided Example: "If 25% Were Birds... 🦅"
          </h4>
          <div className="space-y-3 text-lg">
            <p>• If birds 🦅 made up 25% of your {totalAnimals} animals</p>
            <p>• To find amount: <span className="font-mono bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">25% × {totalAnimals} = (25 ÷ 100) × {totalAnimals} = {Math.round(0.25 * totalAnimals)} birds 🦅</span></p>
          </div>
        </div>

        {/* Student Practice */}
        <div className="bg-orange-50 dark:bg-orange-950 p-6 rounded-lg border-2 border-orange-200">
          <h4 className="text-xl font-bold mb-4 text-orange-800 dark:text-orange-200">
            ✏️ Your Turn: Calculate amounts from percentages
          </h4>
          
          <div className="grid gap-4">
            {[
              { percentage: 30, animal: 'mammals', emoji: '🐘' },
              { percentage: 15, animal: 'reptiles', emoji: '🐍' },
              { percentage: 20, animal: 'fish', emoji: '🐟' },
              { percentage: 10, animal: 'insects', emoji: '🐛' }
            ].map(({ percentage, animal, emoji }) => {
              const correctAmount = Math.round((percentage / 100) * totalAnimals);
              const questionId = `phase4-${animal}`;
              
              return (
                <div key={animal} className="space-y-2">
                  <p className="font-semibold">If {percentage}% were {animal} {emoji}, how many animals would that be?</p>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="Enter amount"
                      className="w-24 px-3 py-2 border rounded-lg"
                      value={userAnswers[questionId] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                    />
                    <span>animals</span>
                    <Button
                      size="sm"
                      onClick={() => checkAnswer(questionId, userAnswers[questionId], correctAmount)}
                      disabled={!userAnswers[questionId]}
                    >
                      Check
                    </Button>
                  </div>
                  {showAnswers[questionId] && (
                    <p className={`text-sm font-semibold ${
                      Math.abs(parseFloat(userAnswers[questionId]) - correctAmount) < 0.1 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {Math.abs(parseFloat(userAnswers[questionId]) - correctAmount) < 0.1 
                        ? '✅ Correct!' 
                        : `❌ Correct answer: ${correctAmount} animals`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );

  const renderPhase5 = () => (
    <Card className="game-card">
      <div className="flex items-center gap-3 mb-6">
        <CheckCircle className="h-8 w-8 text-primary" />
        <h3 className="text-2xl font-space-grotesk font-bold">Phase 5: Unit Percentage Mastery</h3>
      </div>
      
      <div className="space-y-6">
        {/* Part A */}
        <div className="bg-teal-50 dark:bg-teal-950 p-6 rounded-lg border-2 border-teal-200">
          <h4 className="text-xl font-bold mb-4 text-teal-800 dark:text-teal-200">
            🎯 Part A: "The Power of 1% 📊"
          </h4>
          <div className="space-y-3 text-lg">
            <p>• 1% of your {totalAnimals} animals = <span className="font-mono bg-teal-100 dark:bg-teal-900 px-2 py-1 rounded">{totalAnimals} ÷ 100 = {onePercent.toFixed(1)} animals</span></p>
            <p>• Visual: 1% = {onePercent < 1 ? 'less than one' : Math.round(onePercent)} 🐘</p>
          </div>
        </div>

        {/* Part B */}
        <div className="bg-indigo-50 dark:bg-indigo-950 p-6 rounded-lg border-2 border-indigo-200">
          <h4 className="text-xl font-bold mb-4 text-indigo-800 dark:text-indigo-200">
            🎯 Part B: Using 1% to Find Any Percentage
          </h4>
          <div className="space-y-4">
            <p className="text-lg">If 1% = {onePercent.toFixed(1)} animals, then:</p>
            <p className="text-lg">• 5% = 5 × {onePercent.toFixed(1)} = {(5 * onePercent).toFixed(1)} animals</p>
            
            <div className="grid gap-4 md:grid-cols-3">
              {[3, 7, 12].map((percentage) => {
                const correctAmount = (percentage * onePercent).toFixed(1);
                const questionId = `phase5-${percentage}`;
                
                return (
                  <div key={percentage} className="space-y-2">
                    <p className="font-semibold">{percentage}% = ?</p>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        className="w-20 px-3 py-2 border rounded-lg"
                        value={userAnswers[questionId] || ''}
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [questionId]: e.target.value }))}
                      />
                      <Button
                        size="sm"
                        onClick={() => checkAnswer(questionId, userAnswers[questionId], parseFloat(correctAmount))}
                        disabled={!userAnswers[questionId]}
                      >
                        Check
                      </Button>
                    </div>
                    {showAnswers[questionId] && (
                      <p className={`text-sm font-semibold ${
                        Math.abs(parseFloat(userAnswers[questionId]) - parseFloat(correctAmount)) < 0.1 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {Math.abs(parseFloat(userAnswers[questionId]) - parseFloat(correctAmount)) < 0.1 
                          ? '✅ Correct!' 
                          : `❌ Correct answer: ${correctAmount} animals`}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={() => navigate('/visualization')}
            variant="outline"
            className="rounded-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Data
          </Button>
          <h1 className="text-3xl font-space-grotesk font-bold">🧮 Learn Percentages & Fractions</h1>
          <Button 
            onClick={() => navigate('/')}
            className="game-button-secondary"
          >
            🏠 Home
          </Button>
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
            className="game-button"
          >
            Next Phase
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Learning;