import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
import Confetti from "@/components/Confetti";

interface Exercise {
  value1: number;
  value2: number;
  increase: number; // percentage increase from value1 to value2
  decrease: number; // percentage decrease from value2 to value1
  id: string;
  currency?: string;
}

const PercentageDifference = () => {
  const navigate = useNavigate();

  // Generate exercises
  const generateExercises = (): Exercise[] => [
    { id: '1', value1: 900, value2: 1200, increase: 33.3, decrease: 25, currency: 'kr' },
    { id: '2', value1: 800, value2: 1000, increase: 25, decrease: 20, currency: 'kr' },
    { id: '3', value1: 1500, value2: 1800, increase: 20, decrease: 16.7, currency: 'kr' },
    { id: '4', value1: 600, value2: 750, increase: 25, decrease: 20, currency: 'kr' },
    { id: '5', value1: 400, value2: 500, increase: 25, decrease: 20, currency: 'kr' }
  ];

  const exercises = generateExercises();

  // Exercise state
  const [showConfetti, setShowConfetti] = useState(false);
  const [showVisualAnimation, setShowVisualAnimation] = useState(false);
  const [completedExercises, setCompletedExercises] = useState<string[]>([]);
  const [currentExercise, setCurrentExercise] = useState<Exercise | null>(null);
  const [currentCalculation, setCurrentCalculation] = useState<Exercise | null>(null);
  const [animatingNumbers, setAnimatingNumbers] = useState(false);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [calculationType, setCalculationType] = useState<'increase' | 'decrease'>('increase');
  
  const isAllCompleted = completedExercises.length === exercises.length;

  // Auto-start visual animation and set first exercise
  useEffect(() => {
    setShowVisualAnimation(true);
    const timer = setTimeout(() => {
      setShowVisualAnimation(false);
      setCurrentExercise(exercises[0]);
    }, 6000);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle answer submission
  const handleAnswerSubmit = () => {
    if (!currentExercise) return;
    
    const answer = parseFloat(userAnswer);
    const correctAnswer = calculationType === 'increase' ? currentExercise.increase : currentExercise.decrease;
    
    if (Math.abs(answer - correctAnswer) < 0.2) { // Allow small rounding differences
      // Correct answer
      setCompletedExercises(prev => [...prev, currentExercise.id]);
      setCurrentCalculation(currentExercise);
      setAnimatingNumbers(true);
      setShowConfetti(true);
      setUserAnswer('');
      
      // Clear animation after delay
      setTimeout(() => {
        setAnimatingNumbers(false);
        setShowConfetti(false);
      }, 2000);
    }
  };

  // Handle next button click
  const handleNext = () => {
    const remaining = exercises.filter(ex => 
      !completedExercises.includes(ex.id) && ex.id !== currentCalculation?.id
    );
    
    setCurrentCalculation(null);
    
    if (remaining.length > 0) {
      setCurrentExercise(remaining[0]);
      // Alternate between increase and decrease
      setCalculationType(Math.random() > 0.5 ? 'increase' : 'decrease');
    } else {
      navigate('/percentage-visualization');
    }
  };

  // Visual Introduction Component  
  const VisualIntroduction = () => {
    const exampleExercise = exercises[0];
    
    return (
      <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center space-y-6">
          <div className="text-4xl mb-4">📊</div>
          
          <div className={`transition-all duration-1000 ${showVisualAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h3 className="text-2xl font-bold mb-6">Learn How to Calculate Percentage Difference!</h3>
            
            {/* Example Problem */}
            <div className="bg-white p-4 rounded-lg border-2 border-primary/30 mb-6">
              <div className="text-xl font-bold mb-2">Example Problem:</div>
              <div className="text-lg">Compare {exampleExercise.value1} {exampleExercise.currency} and {exampleExercise.value2} {exampleExercise.currency}</div>
            </div>
            
            {/* Step-by-step Calculation for Increase */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200 mb-4">
              <div className="text-lg font-bold mb-4">Percentage Increase (from {exampleExercise.value1} to {exampleExercise.value2}):</div>
              
              {/* Step 1: Find difference */}
              <div className="flex items-center justify-center gap-4 mb-4 text-lg">
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{exampleExercise.value2}</div>
                <span>-</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{exampleExercise.value1}</div>
                <span>=</span>
                <div className="bg-green-100 px-4 py-2 rounded-lg border font-bold text-green-700">
                  {exampleExercise.value2 - exampleExercise.value1}
                </div>
              </div>
              
              {/* Step 2: Divide by original and multiply by 100 */}
              <div className="flex items-center justify-center gap-4 text-lg">
                <div className="bg-green-100 px-4 py-2 rounded-lg border font-bold text-green-700">
                  {exampleExercise.value2 - exampleExercise.value1}
                </div>
                <span>÷</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{exampleExercise.value1}</div>
                <span>×</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">100</div>
                <span>=</span>
                <Badge className="text-lg px-4 py-2 animate-bounce bg-green-600">
                  {exampleExercise.increase}%
                </Badge>
              </div>
            </div>

            {/* Step-by-step Calculation for Decrease */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-lg border-2 border-red-200 mb-6">
              <div className="text-lg font-bold mb-4">Percentage Decrease (from {exampleExercise.value2} to {exampleExercise.value1}):</div>
              
              {/* Use same difference but divide by larger value */}
              <div className="flex items-center justify-center gap-4 text-lg">
                <div className="bg-red-100 px-4 py-2 rounded-lg border font-bold text-red-700">
                  {exampleExercise.value2 - exampleExercise.value1}
                </div>
                <span>÷</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{exampleExercise.value2}</div>
                <span>×</span>
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">100</div>
                <span>=</span>
                <Badge className="text-lg px-4 py-2 animate-bounce bg-red-600">
                  {exampleExercise.decrease}%
                </Badge>
              </div>
            </div>
            
            {/* Visual comparison */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 mb-6">
              <div className="text-lg font-bold mb-4">Visual Comparison:</div>
              <div className="flex items-end gap-4 justify-center mb-4">
                <div className="text-center">
                  <div 
                    className="bg-blue-500 w-16 transition-all duration-2000 mb-2"
                    style={{ height: `${(exampleExercise.value1 / exampleExercise.value2) * 80}px` }}
                  ></div>
                  <div className="text-sm font-bold">{exampleExercise.value1} {exampleExercise.currency}</div>
                </div>
                <div className="text-center">
                  <div 
                    className="bg-green-500 w-16 transition-all duration-2000 mb-2"
                    style={{ height: '80px' }}
                  ></div>
                  <div className="text-sm font-bold">{exampleExercise.value2} {exampleExercise.currency}</div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {exampleExercise.value2} {exampleExercise.currency} is {exampleExercise.increase}% more than {exampleExercise.value1} {exampleExercise.currency}
              </div>
            </div>
            
            <div className="text-lg text-muted-foreground">
              Next, you'll practice calculating percentage differences! 🎯
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Main Learning Exercise Component
  const LearningExercise = () => {
    if (!currentExercise) return null;
    
    const correctAnswer = calculationType === 'increase' ? currentExercise.increase : currentExercise.decrease;
    const fromValue = calculationType === 'increase' ? currentExercise.value1 : currentExercise.value2;
    const toValue = calculationType === 'increase' ? currentExercise.value2 : currentExercise.value1;
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-6 w-6 text-secondary" />
            <h3 className="text-xl font-bold">
              Calculate Percentage {calculationType === 'increase' ? 'Increase' : 'Decrease'}
            </h3>
          </div>
          
          {/* Problem Display */}
          <div className="bg-white p-6 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-2xl font-bold mb-4">
              What is the percentage {calculationType} from {fromValue} {currentExercise.currency} to {toValue} {currentExercise.currency}?
            </div>
            
            {/* Visual comparison */}
            <div className="flex items-end gap-4 justify-center mb-6">
              <div className="text-center">
                <div 
                  className={`w-16 transition-all duration-1000 mb-2 ${calculationType === 'increase' ? 'bg-blue-500' : 'bg-red-500'}`}
                  style={{ height: `${(fromValue / Math.max(fromValue, toValue)) * 80}px` }}
                ></div>
                <div className="text-sm font-bold">{fromValue} {currentExercise.currency}</div>
                <div className="text-xs text-muted-foreground">From</div>
              </div>
              <div className="text-center">
                <div 
                  className={`w-16 transition-all duration-1000 mb-2 ${calculationType === 'increase' ? 'bg-green-500' : 'bg-blue-500'}`}
                  style={{ height: `${(toValue / Math.max(fromValue, toValue)) * 80}px` }}
                ></div>
                <div className="text-sm font-bold">{toValue} {currentExercise.currency}</div>
                <div className="text-xs text-muted-foreground">To</div>
              </div>
            </div>
            
            {/* Calculation hint */}
            <div className="text-sm text-muted-foreground mb-4">
              Formula: (Difference ÷ Original Value) × 100
            </div>
            
            {/* Answer input */}
            <div className="flex items-center justify-center gap-4 text-xl">
              <span>({Math.abs(toValue - fromValue)} ÷ {fromValue}) × 100 =</span>
              <input
                type="number"
                step="0.1"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-24 px-3 py-2 border-2 border-primary/30 rounded-lg text-center font-bold"
                placeholder="?"
              />
              <span>%</span>
              <Button onClick={handleAnswerSubmit} disabled={!userAnswer}>
                Check
              </Button>
            </div>
          </div>
          
          {/* Progress Display */}
          <div className="bg-white p-4 rounded-lg border-2 border-primary/30">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Progress:</span>
              <Progress value={(completedExercises.length / exercises.length) * 100} className="flex-1" />
              <span className="text-sm text-muted-foreground">
                {completedExercises.length} / {exercises.length}
              </span>
            </div>
          </div>
          
          {/* Current Calculation Display */}
          {currentCalculation && (
            <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
              <div className="text-center space-y-4">
                <div className="text-lg font-bold text-green-700 mb-2">
                  🎉 Correct Answer!
                </div>
                
                <div className="flex items-center justify-center gap-4 text-xl">
                  <span>
                    ({Math.abs(toValue - fromValue)} ÷ {fromValue}) × 100 =
                  </span>
                  <Badge className={`text-xl px-4 py-2 bg-green-600 text-white transition-all duration-500 ${animatingNumbers ? 'scale-110 animate-bounce' : ''}`}>
                    {correctAnswer}%
                  </Badge>
                </div>
                
                <div className="text-sm text-green-600 mb-4">
                  {toValue} {currentCalculation.currency} is {correctAnswer}% {calculationType === 'increase' ? 'more' : 'less'} than {fromValue} {currentCalculation.currency}!
                </div>
                
                {/* Next Button */}
                <div className="flex justify-center">
                  {completedExercises.length < exercises.length ? (
                    <Button 
                      onClick={handleNext}
                      className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
                    >
                      Next Problem <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                    >
                      Complete Learning <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // Main render function
  const renderContent = () => {
    if (showVisualAnimation) {
      return <VisualIntroduction />;
    }
    
    if (isAllCompleted) {
      return (
        <Card className="p-8 text-center border-2 border-green-500/20 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="text-4xl mb-4">🎊</div>
          <h2 className="text-2xl font-bold text-green-700 mb-4">
            Congratulations! All Problems Completed!
          </h2>
          <p className="text-lg text-green-600 mb-6">
            You've successfully solved all {exercises.length} percentage difference problems!
          </p>
          <Button 
            onClick={() => navigate('/percentage-visualization')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          >
            Continue to Visualization <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      );
    }
    
    return <LearningExercise />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
            📊 Percentage Difference
          </h1>
        </Card>

        {/* Main Content */}
        <div className="mb-6">
          {renderContent()}
        </div>
      </div>

      {/* Confetti */}
      <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
    </div>
  );
};

export default PercentageDifference;