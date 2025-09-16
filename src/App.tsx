import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Visualization from "./pages/Visualization";
import VisualizationSummary from "./pages/VisualizationSummary";
import VisualizationBarChart from "./pages/VisualizationBarChart";
import VisualizationPieChart from "./pages/VisualizationPieChart";
import Learning from "./pages/Learning";
import WholeFromPercentage from "./pages/WholeFromPercentage";
import PercentageDifference from "./pages/PercentageDifference";

import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/visualization" element={<Visualization />} />
          <Route path="/visualization/summary" element={<VisualizationSummary />} />
          <Route path="/visualization/bar-chart" element={<VisualizationBarChart />} />
          <Route path="/visualization/pie-chart" element={<VisualizationPieChart />} />
          <Route path="/learning" element={<Learning />} />
          <Route path="/whole-from-percentage" element={<WholeFromPercentage />} />
          <Route path="/percentage-difference" element={<PercentageDifference />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
