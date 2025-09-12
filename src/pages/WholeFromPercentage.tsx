import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Target } from "lucide-react";
import Confetti from "@/components/Confetti";

interface Exercise {
  part: number;
  percentage: number;
  whole: number;
  id: string;
}

const WholeFromPercentage = () => {
  const navigate = useNavigate();

  // Generate exercises
  const generateExercises = (): Exercise[] => [
    { id: '1', part: 48, percentage: 12, whole: 400 },
    { id: '2', part: 75, percentage: 25, whole: 300 },
    { id: '3', part: 90, percentage: 18, whole: 500 },
    { id: '4', part: 120, percentage: 30, whole: 400 },
    { id: '5', part: 105, percentage: 35, whole: 300 }
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
    
    const answer = parseInt(userAnswer);
    if (answer === currentExercise.whole) {
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
          <div className="text-4xl mb-4">🔍</div>
          
          <div className={`transition-all duration-1000 ${showVisualAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <h3 className="text-2xl font-bold mb-6">Learn How to Find the Whole from a Percentage!</h3>
            
            {/* Example Problem */}
            <div className="bg-white p-4 rounded-lg border-2 border-primary/30 mb-6">
              <div className="text-xl font-bold mb-2">Example Problem:</div>
              <div className="text-lg">If {exampleExercise.part} is {exampleExercise.percentage}% of the total, what is the whole number?</div>
            </div>
            
            {/* Step-by-step Calculation */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200 mb-6">
              <div className="text-lg font-bold mb-4">Step-by-Step Solution:</div>
              
              {/* Step 1: Convert percentage to decimal */}
              <div className="flex items-center justify-center gap-4 mb-4 text-xl">
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{exampleExercise.percentage}%</div>
                <span>=</span>
                <div className="bg-blue-100 px-4 py-2 rounded-lg border font-bold text-blue-700">
                  {(exampleExercise.percentage / 100).toFixed(2)}
                </div>
              </div>
              
              {/* Step 2: Divide part by decimal */}
              <div className="flex items-center justify-center gap-4 text-xl">
                <div className="bg-white px-4 py-2 rounded-lg border font-bold">{exampleExercise.part}</div>
                <span>÷</span>
                <div className="bg-blue-100 px-4 py-2 rounded-lg border font-bold text-blue-700">
                  {(exampleExercise.percentage / 100).toFixed(2)}
                </div>
                <span>=</span>
                <Badge className="text-xl px-6 py-3 animate-bounce bg-green-600">
                  {exampleExercise.whole}
                </Badge>
              </div>
            </div>
            
            {/* Visual representation */}
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200 mb-6">
              <div className="text-lg font-bold mb-4">Visual Representation:</div>
              <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-2000" 
                  style={{ width: `${exampleExercise.percentage}%` }}
                ></div>
              </div>
              <div className="text-sm text-muted-foreground mb-2">
                The colored part ({exampleExercise.part}) represents {exampleExercise.percentage}% of the whole bar
              </div>
              <div className="text-sm font-bold">
                So the whole bar represents {exampleExercise.whole}
              </div>
            </div>
            
            <div className="text-lg text-muted-foreground">
              Next, you'll practice finding the whole from different parts! 🎯
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Main Learning Exercise Component
  const LearningExercise = () => {
    if (!currentExercise) return null;
    
    return (
      <Card className="p-6 border-2 border-secondary/20 bg-gradient-to-br from-secondary/5 to-accent/5">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Target className="h-6 w-6 text-secondary" />
            <h3 className="text-xl font-bold">Find the Whole Number</h3>
          </div>
          
          {/* Problem Display */}
          <div className="bg-white p-6 rounded-lg border-2 border-accent/30 mb-6">
            <div className="text-2xl font-bold mb-4">
              If {currentExercise.part} is {currentExercise.percentage}% of the total, what is the whole number?
            </div>
            
            {/* Visual bar showing the part */}
            <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000" 
                style={{ width: `${currentExercise.percentage}%` }}
              ></div>
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              This colored section = {currentExercise.part} ({currentExercise.percentage}% of the whole)
            </div>
            
            {/* Answer input */}
            <div className="flex items-center justify-center gap-4 text-xl">
              <span>{currentExercise.part} ÷ {(currentExercise.percentage / 100).toFixed(2)} =</span>
              <input
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-24 px-3 py-2 border-2 border-primary/30 rounded-lg text-center font-bold"
                placeholder="?"
              />
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
                  <span>{currentCalculation.part} ÷ {(currentCalculation.percentage / 100).toFixed(2)} =</span>
                  <Badge className={`text-xl px-4 py-2 bg-green-600 text-white transition-all duration-500 ${animatingNumbers ? 'scale-110 animate-bounce' : ''}`}>
                    {currentCalculation.whole}
                  </Badge>
                </div>
                
                <div className="text-sm text-green-600 mb-4">
                  The whole number is {currentCalculation.whole} when {currentCalculation.part} represents {currentCalculation.percentage}%!
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
            You've successfully solved all {exercises.length} problems for finding the whole from a percentage!
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
            🔍 Find the Whole from a Percentage
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

export default WholeFromPercentage;