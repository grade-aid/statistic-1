import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, BarChart3, PieChart, TrendingUp } from 'lucide-react';

const PercentageVisualization = () => {
  const navigate = useNavigate();

  const concepts = [
    {
      title: "Percentage of a Number",
      description: "Calculate what portion a percentage represents",
      example: "22% of 500 = 110",
      formula: "Number × (Percentage ÷ 100)",
      color: "#3b82f6",
      icon: Calculator,
      route: "/percentage-of-number"
    },
    {
      title: "Whole from Percentage",
      description: "Find the original number when given a part",
      example: "48 is 12% of 400",
      formula: "Part ÷ (Percentage ÷ 100)",
      color: "#8b5cf6",
      icon: BarChart3,
      route: "/whole-from-percentage"
    },
    {
      title: "Percentage Difference",
      description: "Compare two numbers as percentages",
      example: "1200 is 33.3% more than 900",
      formula: "(Difference ÷ Original) × 100",
      color: "#ef4444",
      icon: TrendingUp,
      route: "/percentage-difference"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="p-6 mb-6 bg-white/80 backdrop-blur-sm">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-4">
            📊 Percentage Concepts Overview
          </h1>
          <p className="text-center text-muted-foreground">
            Master three essential percentage calculation methods
          </p>
        </Card>

        {/* Concepts Grid */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {concepts.map((concept, index) => {
            const IconComponent = concept.icon;
            return (
              <Card key={index} className="p-6 border-2 border-gray-200 hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <div className="text-center space-y-4">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: concept.color + '20' }}
                  >
                    <IconComponent 
                      className="h-8 w-8" 
                      style={{ color: concept.color }}
                    />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">{concept.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{concept.description}</p>
                  
                  {/* Example */}
                  <div 
                    className="p-3 rounded-lg text-white font-semibold"
                    style={{ backgroundColor: concept.color }}
                  >
                    {concept.example}
                  </div>
                  
                  {/* Formula */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">Formula:</div>
                    <div className="font-mono text-sm">{concept.formula}</div>
                  </div>
                  
                  <Button 
                    onClick={() => navigate(concept.route)}
                    className="w-full"
                    style={{ backgroundColor: concept.color }}
                  >
                    Practice This Concept
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Interactive Comparison Chart */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">Visual Comparison</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {/* Percentage of Number Visual */}
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-blue-600">Percentage of Number</h4>
              <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-2000 flex items-center justify-center text-white text-sm font-bold"
                  style={{ width: '22%' }}
                >
                  22%
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                22% of 500 = <span className="font-bold text-blue-600">110</span>
              </div>
            </div>

            {/* Whole from Percentage Visual */}
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-purple-600">Whole from Percentage</h4>
              <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-2000 flex items-center justify-center text-white text-sm font-bold"
                  style={{ width: '12%' }}
                >
                  48
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                If 48 is 12%, whole = <span className="font-bold text-purple-600">400</span>
              </div>
            </div>

            {/* Percentage Difference Visual */}
            <div className="text-center">
              <h4 className="font-semibold mb-3 text-red-600">Percentage Difference</h4>
              <div className="flex items-end gap-2 justify-center mb-2">
                <div className="bg-red-400 w-12 h-16 rounded flex items-end justify-center text-white text-xs font-bold pb-1">
                  900
                </div>
                <div className="bg-red-600 w-12 h-20 rounded flex items-end justify-center text-white text-xs font-bold pb-1">
                  1200
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                1200 is <span className="font-bold text-red-600">33.3%</span> more than 900
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Stats */}
        <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              🎉 Ready to Master Percentages!
            </h2>
            <p className="text-green-600 mb-6">
              Choose any concept above to start practicing with interactive exercises
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">3</div>
                <div className="text-sm text-green-600">Concepts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">15</div>
                <div className="text-sm text-green-600">Practice Problems</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">∞</div>
                <div className="text-sm text-green-600">Learning</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PercentageVisualization;