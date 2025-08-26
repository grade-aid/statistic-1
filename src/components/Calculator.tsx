import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CalculatorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const Calculator = ({ isOpen, onOpenChange }: CalculatorProps) => {
  const [display, setDisplay] = useState("0");
  const [input, setInput] = useState("");

  const handleInput = (value: string) => {
    if (value === "C") {
      setDisplay("0");
      setInput("");
    } else if (value === "=") {
      try {
        const result = eval(input);
        setDisplay(result.toString());
        setInput(result.toString());
      } catch {
        setDisplay("Error");
        setInput("");
      }
    } else {
      const newInput = display === "0" || display === "Error" ? value : input + value;
      setInput(newInput);
      setDisplay(newInput);
    }
  };

  const Button = ({ children, onClick, className = "", isOperator = false }: {
    children: React.ReactNode;
    onClick: () => void;
    className?: string;
    isOperator?: boolean;
  }) => (
    <div
      className={`
        h-12 flex items-center justify-center text-lg font-semibold cursor-pointer select-none rounded-md
        ${isOperator 
          ? "bg-orange-500 text-white border border-orange-500" 
          : "bg-gray-600 text-white border border-gray-600"
        }
        ${className}
      `}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        outline: 'none',
        boxShadow: 'none',
        transition: 'none'
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Immediate visual feedback
        const element = e.currentTarget;
        if (isOperator) {
          element.style.backgroundColor = '#ea580c';
        } else {
          element.style.backgroundColor = '#4b5563';
        }
      }}
      onMouseUp={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Reset color
        const element = e.currentTarget;
        if (isOperator) {
          element.style.backgroundColor = '#f97316';
        } else {
          element.style.backgroundColor = '#6b7280';
        }
      }}
      onMouseLeave={(e) => {
        // Reset color if mouse leaves while pressed
        const element = e.currentTarget;
        if (isOperator) {
          element.style.backgroundColor = '#f97316';
        } else {
          element.style.backgroundColor = '#6b7280';
        }
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </div>
  );

  const buttons = [
    ["C", "±", "", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "-"],
    ["1", "2", "3", "+"],
    ["0", ".", "="]
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-80">
        <DialogHeader>
          <DialogTitle>Calculator</DialogTitle>
        </DialogHeader>
        <div className="bg-gray-900 text-white p-4 rounded-lg">
          <div className="bg-black p-3 rounded mb-3 text-right text-2xl font-mono min-h-[3rem] flex items-center justify-end">
            {display}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {buttons.flat().map((btn, idx) => {
              if (btn === "") {
                return <div key={`empty-${idx}`} className="h-12" />;
              }
              
              const isOperator = ["C", "±", "÷", "×", "-", "+", "="].includes(btn);
              const isZero = btn === "0";
              
              return (
                <Button
                  key={`calc-${btn}-${idx}`}
                  onClick={() => {
                    let value = btn;
                    if (btn === "×") value = "*";
                    if (btn === "÷") value = "/";
                    handleInput(value);
                  }}
                  className={isZero ? "col-span-2" : ""}
                  isOperator={isOperator}
                >
                  {btn}
                </Button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Calculator;