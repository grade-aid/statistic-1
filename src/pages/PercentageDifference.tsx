import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import Confetti from "@/components/Confetti";

interface PriceExample {
  id: string;
  emoji: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  store: string;
  percentageChange: number;
  isIncrease: boolean;
}

interface DragDropQuestion {
  id: string;
  emoji: string;
  name: string;
  oldPrice: number;
  newPrice: number;
  isIncrease: boolean;
  correctAnswer: number;
}

interface DroppedItem {
  zone: string;
  item: string;
}

const PercentageDifference = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Phase state
  const [showExamples, setShowExamples] = useState(true);
  const [showDragDrop, setShowDragDrop] = useState(false);

  // Examples state
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [showCalculation, setShowCalculation] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Drag-drop state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [droppedItems, setDroppedItems] = useState<DroppedItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<string[]>([]);
  const [showQuestionResult, setShowQuestionResult] = useState(false);

  // Price examples data
  const examples: PriceExample[] = [
    {
      id: '1',
      emoji: '📱',
      name: 'Phone',
      oldPrice: 800,
      newPrice: 1000,
      store: 'TechMart',
      percentageChange: 25,
      isIncrease: true
    },
    {
      id: '2',
      emoji: '💻',
      name: 'Laptop',
      oldPrice: 1200,
      newPrice: 960,
      store: 'ElectroShop',
      percentageChange: 20,
      isIncrease: false
    },
    {
      id: '3',
      emoji: '🎧',
      name: 'Headphones',
      oldPrice: 150,
      newPrice: 180,
      store: 'AudioPlus',
      percentageChange: 20,
      isIncrease: true
    },
    {
      id: '4',
      emoji: '⌚',
      name: 'Watch',
      oldPrice: 500,
      newPrice: 375,
      store: 'TimeZone',
      percentageChange: 25,
      isIncrease: false
    }
  ];

  // Drag-drop questions
  const dragDropQuestions: DragDropQuestion[] = [
    {
      id: '1',
      emoji: '📷',
      name: 'Camera',
      oldPrice: 600,
      newPrice: 720,
      isIncrease: true,
      correctAnswer: 20
    },
    {
      id: '2', 
      emoji: '🔊',
      name: 'Speaker',
      oldPrice: 200,
      newPrice: 160,
      isIncrease: false,
      correctAnswer: 20
    },
    {
      id: '3',
      emoji: '🖱️',
      name: 'Mouse',
      oldPrice: 80,
      newPrice: 100,
      isIncrease: true,
      correctAnswer: 25
    },
    {
      id: '4',
      emoji: '⌨️',
      name: 'Keyboard',
      oldPrice: 120,
      newPrice: 90,
      isIncrease: false,
      correctAnswer: 25
    },
    {
      id: '5',
      emoji: '📱',
      name: 'Tablet',
      oldPrice: 400,
      newPrice: 500,
      isIncrease: true,
      correctAnswer: 25
    }
  ];

  const currentExample = examples[currentExampleIndex];
  const currentQuestion = dragDropQuestions[currentQuestionIndex];

  // Reset calculation states when example changes
  useEffect(() => {
    setShowCalculation(false);
    setShowResult(false);
  }, [currentExampleIndex]);

  // Handle example interactions
  const handleShowCalculation = () => {
    setShowCalculation(true);
    setTimeout(() => setShowResult(true), 2000);
  };

  const handleNextExample = () => {
    if (currentExampleIndex < examples.length - 1) {
      setCurrentExampleIndex(prev => prev + 1);
    } else {
      setShowExamples(false);
      setShowDragDrop(true);
    }
  };

  // Drag and drop handlers
  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    // Remove existing item in this zone
    const updatedItems = droppedItems.filter(item => item.zone !== zone);
    updatedItems.push({ zone, item: draggedItem });
    setDroppedItems(updatedItems);
    setDraggedItem(null);
  };

  const checkAnswer = () => {
    const oldPriceItem = droppedItems.find(item => item.zone === 'oldPrice');
    const newPriceItem = droppedItems.find(item => item.zone === 'newPrice');
    const differenceItem = droppedItems.find(item => item.zone === 'difference');
    const hundredItem = droppedItems.find(item => item.zone === 'hundred');

    const difference = Math.abs(currentQuestion.newPrice - currentQuestion.oldPrice);
    const basePrice = currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice;

    const isCorrect = 
      oldPriceItem?.item === `$${basePrice}` &&
      newPriceItem?.item === (currentQuestion.isIncrease ? `$${currentQuestion.newPrice}` : `$${currentQuestion.oldPrice}`) &&
      differenceItem?.item === `$${difference}` &&
      hundredItem?.item === '100';

    if (isCorrect) {
      setCompletedQuestions(prev => [...prev, currentQuestion.id]);
      setShowConfetti(true);
      setShowQuestionResult(true);
      setTimeout(() => setShowConfetti(false), 2000);
      
      toast({
        title: "Correct! 🎉",
        description: `The ${currentQuestion.name} ${currentQuestion.isIncrease ? 'increased' : 'decreased'} by ${currentQuestion.correctAnswer}%`,
      });
    } else {
      toast({
        title: "Not quite right 🤔",
        description: "Check the calculation steps and try again!",
        variant: "destructive"
      });
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < dragDropQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setDroppedItems([]);
      setShowQuestionResult(false);
    } else {
      // Store data for visualization page
      localStorage.setItem('priceComparisonData', JSON.stringify({
        examples: examples,
        completed: true
      }));
      navigate('/percentage-visualization');
    }
  };

  const resetQuestion = () => {
    setDroppedItems([]);
    setShowQuestionResult(false);
  };

  // Examples phase
  if (showExamples) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">📊</div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Price Percentage Changes
              </h1>
              <p className="text-xl text-muted-foreground">
                Learn how to calculate percentage increases and decreases in prices
              </p>
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Example Card */}
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">{currentExample.emoji}</div>
                <h2 className="text-2xl font-bold mb-2">{currentExample.name}</h2>
                <div className="text-lg text-muted-foreground">{currentExample.store}</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg border">
                  <span className="font-medium">Old Price:</span>
                  <span className="text-xl font-bold text-red-600">${currentExample.oldPrice}</span>
                </div>
                
                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>
                
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border">
                  <span className="font-medium">New Price:</span>
                  <span className="text-xl font-bold text-green-600">${currentExample.newPrice}</span>
                </div>

                {showCalculation && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border animate-in slide-in-from-bottom duration-500">
                    <h3 className="font-bold mb-3">Calculation Steps:</h3>
                    <div className="space-y-2 text-sm">
                      <div>1. Find difference: ${Math.abs(currentExample.newPrice - currentExample.oldPrice)}</div>
                      <div>2. Divide by {currentExample.isIncrease ? 'old' : 'new'} price: {Math.abs(currentExample.newPrice - currentExample.oldPrice)} ÷ {currentExample.isIncrease ? currentExample.oldPrice : currentExample.newPrice}</div>
                      <div>3. Multiply by 100: × 100 = {currentExample.percentageChange}%</div>
                    </div>
                  </div>
                )}

                {showResult && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border animate-in slide-in-from-bottom duration-500">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentExample.percentageChange}% {currentExample.isIncrease ? 'Increase' : 'Decrease'}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {!showCalculation ? (
                  <Button 
                    onClick={handleShowCalculation}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Show Calculation
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextExample}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {currentExampleIndex < examples.length - 1 ? 'Next Example' : 'Start Practice'} 
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </Card>

            {/* Visual Bar Chart */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4 text-center">Price Comparison</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Old Price</span>
                    <span className="font-bold">${currentExample.oldPrice}</span>
                  </div>
                  <div className="w-full bg-red-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-red-400 to-red-500 h-8 rounded-full transition-all duration-1000 flex items-center justify-center"
                      style={{ width: `${(currentExample.oldPrice / Math.max(currentExample.oldPrice, currentExample.newPrice)) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">${currentExample.oldPrice}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span>New Price</span>
                    <span className="font-bold">${currentExample.newPrice}</span>
                  </div>
                  <div className="w-full bg-green-100 rounded-full h-8 relative overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-500 h-8 rounded-full transition-all duration-1000 flex items-center justify-center"
                      style={{ width: `${(currentExample.newPrice / Math.max(currentExample.oldPrice, currentExample.newPrice)) * 100}%` }}
                    >
                      <span className="text-white font-bold text-sm">${currentExample.newPrice}</span>
                    </div>
                  </div>
                </div>

                {showResult && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border">
                    <div className="text-center">
                      <div className="text-3xl mb-2">
                        {currentExample.isIncrease ? '📈' : '📉'}
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        {currentExample.percentageChange}% {currentExample.isIncrease ? 'Increase' : 'Decrease'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Progress */}
          <Card className="p-4 mt-8">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Example {currentExampleIndex + 1} of {examples.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentExampleIndex + 1) / examples.length) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Drag-drop phase
  if (showDragDrop) {
    const difference = Math.abs(currentQuestion.newPrice - currentQuestion.oldPrice);
    const basePrice = currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice;

    const availableItems = [
      { id: `$${currentQuestion.oldPrice}`, label: `$${currentQuestion.oldPrice}`, color: 'bg-purple-200 border-purple-400' },
      { id: `$${currentQuestion.newPrice}`, label: `$${currentQuestion.newPrice}`, color: 'bg-purple-200 border-purple-400' },
      { id: `$${difference}`, label: `$${difference}`, color: 'bg-pink-200 border-pink-400' },
      { id: '100', label: '100', color: 'bg-purple-200 border-purple-400' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Drag & Drop Practice
                </h1>
                <p className="text-muted-foreground">
                  Complete the percentage calculation by dragging the correct values
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{currentQuestionIndex + 1}/{dragDropQuestions.length}</div>
                <div className="text-sm text-muted-foreground">Questions</div>
              </div>
            </div>
          </Card>

          {/* Question */}
          <Card className="p-8 mb-6">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">{currentQuestion.emoji}</div>
              <h2 className="text-2xl font-bold mb-4">
                What percentage did this {currentQuestion.name} {currentQuestion.isIncrease ? 'increase' : 'decrease'}?
              </h2>
              
              <div className="flex justify-center gap-8 mb-6">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    {currentQuestion.isIncrease ? 'Old Price' : 'New Price'}
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    ${currentQuestion.isIncrease ? currentQuestion.oldPrice : currentQuestion.newPrice}
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 self-end mb-2 text-muted-foreground" />
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-1">
                    {currentQuestion.isIncrease ? 'New Price' : 'Old Price'}
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ${currentQuestion.isIncrease ? currentQuestion.newPrice : currentQuestion.oldPrice}
                  </div>
                </div>
              </div>
            </div>

            {/* Drag Drop Equation */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-dashed border-purple-200">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold">Complete the equation:</h3>
              </div>
              
              <div className="flex items-center justify-center gap-2 flex-wrap text-xl font-bold">
                <span>(</span>
                
                {/* Difference drop zone */}
                <div
                  className="w-20 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'difference')}
                >
                  {droppedItems.find(item => item.zone === 'difference')?.item || 'Drag'}
                </div>
                
                <span>÷</span>
                
                {/* Base price drop zone */}
                <div
                  className="w-20 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'oldPrice')}
                >
                  {droppedItems.find(item => item.zone === 'oldPrice')?.item || 'Drag'}
                </div>
                
                <span>) × </span>
                
                {/* Hundred drop zone */}
                <div
                  className="w-16 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'hundred')}
                >
                  {droppedItems.find(item => item.zone === 'hundred')?.item || 'Drag'}
                </div>
                
                <span>= </span>
                
                {/* Result drop zone */}
                <div
                  className="w-20 h-12 border-2 border-dashed border-purple-300 rounded-lg bg-white flex items-center justify-center text-sm font-bold hover:border-purple-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, 'newPrice')}
                >
                  {droppedItems.find(item => item.zone === 'newPrice')?.item || 'Drag'}
                </div>
                
                <span>%</span>
              </div>
            </div>

            {/* Draggable Items */}
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-4 text-center">Drag these values:</h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {availableItems.map((item) => {
                  const isUsed = droppedItems.some(dropped => dropped.item === item.label);
                  return (
                    <div
                      key={item.id}
                      draggable={!isUsed}
                      onDragStart={() => handleDragStart(item.label)}
                      className={`${item.color} px-4 py-3 rounded-lg cursor-move border-2 font-bold text-lg min-w-[80px] text-center transition-all ${
                        isUsed ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                      }`}
                    >
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex gap-4 justify-center">
              <Button 
                onClick={checkAnswer}
                disabled={droppedItems.length < 4}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
              >
                Check Answer
              </Button>
              <Button 
                onClick={resetQuestion}
                variant="outline"
                className="px-8"
              >
                Reset
              </Button>
            </div>

            {/* Show result */}
            {showQuestionResult && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 animate-in slide-in-from-bottom duration-300">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 mb-2">
                    Correct! The {currentQuestion.name} {currentQuestion.isIncrease ? 'increased' : 'decreased'} by {currentQuestion.correctAnswer}%
                  </div>
                  <div className="text-sm text-green-600">
                    ({difference} ÷ {basePrice}) × 100 = {currentQuestion.correctAnswer}%
                  </div>
                  
                  <Button 
                    onClick={handleNextQuestion}
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {currentQuestionIndex < dragDropQuestions.length - 1 ? 'Next Question' : 'View Visualization'} 
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Progress */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {dragDropQuestions.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / dragDropQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        <Confetti trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      </div>
    );
  }

  return null;
};

export default PercentageDifference;