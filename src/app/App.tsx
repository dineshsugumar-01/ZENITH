import { RouterProvider } from "react-router";
import { router } from "./routes";
import { StockSimulatorProvider } from "./lib/stockSimulator";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <StockSimulatorProvider>
      <Toaster />
      <RouterProvider router={router} />
    </StockSimulatorProvider>
  );
}
