import { Calculator, BarChart3, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

const PercentageSummary = () => {
  const concepts = [
    {
      title: "Percentage of Number",
      example: "22% of 500 = 110",
      formula: "Number × (% ÷ 100)",
      color: "bg-blue-500",
      icon: Calculator
    },
    {
      title: "Whole from Part",
      example: "48 is 12% of 400",
      formula: "Part ÷ (% ÷ 100)",
      color: "bg-purple-500",
      icon: BarChart3
    },
    {
      title: "Percentage Difference",
      example: "1200 is 33% more than 900",
      formula: "(Difference ÷ Original) × 100",
      color: "bg-red-500",
      icon: TrendingUp
    }
  ];

  return (
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
      <h3 className="text-lg font-bold text-center mb-4">📊 What We've Learned</h3>
      <div className="grid gap-4 md:grid-cols-3">
        {concepts.map((concept, index) => {
          const IconComponent = concept.icon;
          return (
            <div key={index} className="text-center space-y-2">
              <div className={`w-12 h-12 rounded-full ${concept.color} flex items-center justify-center mx-auto`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-sm">{concept.title}</h4>
              <div className={`${concept.color} text-white text-xs p-2 rounded font-bold`}>
                {concept.example}
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                {concept.formula}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default PercentageSummary;