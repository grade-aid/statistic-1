import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, BarChart3, PieChart, TrendingUp, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const PercentageVisualization = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const concepts = [
    {
      title: "Percentage of a Number",
      description: "Calculate what portion a percentage represents",
      example: "22% of 500 = 110",
      formula: "Number × (Percentage ÷ 100)",
      color: "#3b82f6",
      bgColor: "from-blue-50 to-blue-100",
      icon: Calculator,
      route: "/percentage-of-number",
      visual: {
        type: "progress",
        percentage: 22,
        total: 500,
        result: 110
      }
    },
    {
      title: "Whole from Percentage",
      description: "Find the original number when given a part",
      example: "48 is 12% of 400",
      formula: "Part ÷ (Percentage ÷ 100)",
      color: "#8b5cf6",
      bgColor: "from-purple-50 to-purple-100",
      icon: BarChart3,
      route: "/whole-from-percentage",
      visual: {
        type: "reverse",
        part: 48,
        percentage: 12,
        whole: 400
      }
    },
    {
      title: "Percentage Difference",
      description: "Compare two numbers as percentages",
      example: "1200 is 33.3% more than 900",
      formula: "(Difference ÷ Original) × 100",
      color: "#ef4444",
      bgColor: "from-red-50 to-red-100",
      icon: TrendingUp,
      route: "/percentage-difference",
      visual: {
        type: "comparison",
        original: 900,
        new: 1200,
        difference: 33.3
      }
    }
  ];

  const currentConcept = concepts[currentIndex];

  const nextConcept = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % concepts.length);
      setIsAnimating(false);
    }, 150);
  };

  const prevConcept = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + concepts.length) % concepts.length);
      setIsAnimating(false);
    }, 150);
  };

  const renderVisual = (concept: typeof concepts[0]) => {
    const IconComponent = concept.icon;
    
    if (concept.visual.type === "progress") {
      return (
        <div className="space-y-6">
          {/* Large Icon */}
          <div className="flex justify-center mb-8">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-in"
              style={{ backgroundColor: concept.color + '20' }}
            >
              <IconComponent 
                className="h-12 w-12" 
                style={{ color: concept.color }}
              />
            </div>
          </div>

          {/* Progress Bar Visual */}
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-6xl font-bold" style={{ color: concept.color }}>
                  {concept.visual.percentage}%
                </div>
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                  ✓ Learned
                </div>
              </div>
              <div className="text-xl text-muted-foreground">
                of {concept.visual.total}
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-12 mb-4 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-2000 flex items-center justify-end pr-4 text-white font-bold animate-slide-in-right"
                style={{ 
                  backgroundColor: concept.color,
                  width: `${concept.visual.percentage}%`
                }}
              >
                {concept.visual.result}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold animate-fade-in" style={{ color: concept.color }}>
                = {concept.visual.result}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (concept.visual.type === "reverse") {
      return (
        <div className="space-y-6">
          {/* Large Icon */}
          <div className="flex justify-center mb-8">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-in"
              style={{ backgroundColor: concept.color + '20' }}
            >
              <IconComponent 
                className="h-12 w-12" 
                style={{ color: concept.color }}
              />
            </div>
          </div>

          {/* Reverse Visual */}
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold mb-2" style={{ color: concept.color }}>
                {concept.visual.part}
              </div>
              <div className="text-xl text-muted-foreground">
                is {concept.visual.percentage}% of what number?
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-12 mb-4 relative overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-2000 flex items-center justify-center text-white font-bold animate-slide-in-right"
                style={{ 
                  backgroundColor: concept.color,
                  width: `${concept.visual.percentage}%`
                }}
              >
                {concept.visual.part}
              </div>
              <div className="absolute top-0 right-0 h-full flex items-center pr-4 text-gray-600 font-semibold">
                {concept.visual.whole}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold animate-fade-in" style={{ color: concept.color }}>
                Answer: {concept.visual.whole}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (concept.visual.type === "comparison") {
      return (
        <div className="space-y-6">
          {/* Large Icon */}
          <div className="flex justify-center mb-8">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center animate-scale-in"
              style={{ backgroundColor: concept.color + '20' }}
            >
              <IconComponent 
                className="h-12 w-12" 
                style={{ color: concept.color }}
              />
            </div>
          </div>

          {/* Comparison Visual */}
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <div className="text-xl text-muted-foreground mb-4">
                Compare these two values:
              </div>
            </div>
            
            <div className="flex items-end justify-center gap-8 mb-6">
              <div className="text-center">
                <div 
                  className="w-20 rounded-lg flex items-end justify-center text-white font-bold pb-2 animate-scale-in"
                  style={{ 
                    backgroundColor: concept.color + '80',
                    height: '80px'
                  }}
                >
                  {concept.visual.original}
                </div>
                <div className="text-sm text-muted-foreground mt-2">Original</div>
              </div>
              
              <div className="text-4xl text-muted-foreground animate-fade-in">→</div>
              
              <div className="text-center">
                <div 
                  className="w-20 rounded-lg flex items-end justify-center text-white font-bold pb-2 animate-scale-in"
                  style={{ 
                    backgroundColor: concept.color,
                    height: '120px'
                  }}
                >
                  {concept.visual.new}
                </div>
                <div className="text-sm text-muted-foreground mt-2">New</div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold animate-fade-in" style={{ color: concept.color }}>
                {concept.visual.difference}% increase
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`h-screen bg-gradient-to-br ${currentConcept.bgColor} p-2 transition-all duration-500 overflow-hidden flex flex-col`}>
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        {/* Header with Progress */}
        <Card className="p-3 mb-3 bg-white/90 backdrop-blur-sm animate-fade-in flex-shrink-0">
          <div className="text-center mb-2">
            <h1 className="text-xl font-bold mb-1">Percentage Concepts</h1>
            <p className="text-muted-foreground text-sm">
              Master essential percentage calculation methods
            </p>
          </div>
          
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-3">
            {concepts.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsAnimating(true);
                  setTimeout(() => {
                    setCurrentIndex(index);
                    setIsAnimating(false);
                  }, 150);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'scale-125' 
                    : 'hover:scale-110'
                }`}
                style={{ 
                  backgroundColor: index === currentIndex ? currentConcept.color : '#d1d5db'
                }}
              />
            ))}
          </div>
        </Card>

        {/* Main Concept Display */}
        <Card className={`p-3 mb-3 bg-white/95 backdrop-blur-sm transition-all duration-300 flex-1 min-h-0 overflow-hidden flex flex-col ${
          isAnimating ? 'opacity-50 scale-95' : 'opacity-100 scale-100 animate-fade-in'
        }`}>
          <div className="text-center mb-3 flex-shrink-0">
            <h2 className="text-2xl font-bold mb-2" style={{ color: currentConcept.color }}>
              {currentConcept.title}
            </h2>
            <p className="text-sm text-muted-foreground mb-3">
              {currentConcept.description}
            </p>
            
            {/* Example Badge */}
            <div 
              className="inline-block px-3 py-1 rounded-full text-white font-bold text-sm mb-3 animate-scale-in"
              style={{ backgroundColor: currentConcept.color }}
            >
              {currentConcept.example}
            </div>
          </div>

          {/* Visual Representation */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {renderVisual(currentConcept)}
          </div>

          {/* Formula */}
          <div className="max-w-md mx-auto mt-3 flex-shrink-0">
            <div className="bg-gray-50 p-2 rounded-lg text-center animate-fade-in">
              <div className="text-xs text-muted-foreground mb-1">Formula:</div>
              <div className="font-mono text-sm font-semibold">{currentConcept.formula}</div>
            </div>
          </div>
        </Card>

        {/* Navigation and Action */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
          <Button
            onClick={prevConcept}
            variant="outline"
            size="sm"
            className="hover-scale text-xs px-2"
          >
            <ChevronLeft className="w-3 h-3 mr-1" />
            Previous
          </Button>

          <Button
            onClick={() => navigate(currentConcept.route)}
            size="sm"
            className="px-3 hover-scale text-xs"
            style={{ backgroundColor: currentConcept.color }}
          >
            <Play className="w-3 h-3 mr-1" />
            Practice
          </Button>

          <Button
            onClick={nextConcept}
            variant="outline"
            size="sm"
            className="hover-scale text-xs px-2"
          >
            Next
            <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>

      </div>
    </div>
  );
};

export default PercentageVisualization;