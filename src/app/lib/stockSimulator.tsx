import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { dataService } from "./data";
import { authService } from "./auth";

export interface LogEntry {
  id: string;
  timestamp: Date;
  source: "STOCK_SERVER" | "ZENITH_CORE" | "SYSTEM_ALERT";
  message: string;
  type: "info" | "warning" | "success" | "error";
}

export interface StockItem {
  id: string;
  item: string;
  stock: number;
  unit: string;
  reorderLevel: number;
  status: "Good" | "Low" | "Critical";
  value: string;
}

interface StockSimulatorContextType {
  isConnected: boolean;
  isSimulating: boolean;
  logs: LogEntry[];
  inventory: StockItem[];
  connectServer: () => void;
  disconnectServer: () => void;
  toggleSimulation: () => void;
  clearLogs: () => void;
}

const initialInventory: StockItem[] = [
  { id: "inv_01", item: "Steel Rods (20mm)", stock: 850, unit: "kg", reorderLevel: 500, status: "Good", value: "₹4,25,000" },
  { id: "inv_02", item: "Copper Wire", stock: 220, unit: "kg", reorderLevel: 200, status: "Good", value: "₹8,88,000" },
  { id: "inv_03", item: "Circuit Boards", stock: 450, unit: "units", reorderLevel: 100, status: "Good", value: "₹14,40,000" },
  { id: "inv_04", item: "Hydraulic Pumps", stock: 120, unit: "units", reorderLevel: 50, status: "Good", value: "₹11,25,000" },
];

const StockSimulatorContext = createContext<StockSimulatorContextType | undefined>(undefined);

export function StockSimulatorProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [inventory, setInventory] = useState<StockItem[]>(initialInventory);
  
  // Keep track of which items have already fired an RFQ during this simulation session
  // to avoid spamming an RFQ every second once it's below threshold.
  const [replenishmentTriggered, setReplenishmentTriggered] = useState<Set<string>>(new Set());

  const addLog = useCallback((source: LogEntry["source"], message: string, type: LogEntry["type"] = "info") => {
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
        source,
        message,
        type,
      },
    ]);
  }, []);

  const connectServer = async () => {
    addLog("STOCK_SERVER", "Attempting connection to Stock API Server (localhost:8001)...", "info");
    
    try {
      // Try connecting to real stock server
      const resp = await fetch("http://localhost:8001/health");
      if (resp.ok) {
        const data = await resp.json();
        setIsConnected(true);
        addLog("STOCK_SERVER", `Connected to live Stock Server! Status: ${data.status}`, "success");
        
        // Try fetching real stock data
        const user = authService.getCurrentUser();
        if (user) {
          const stockResp = await fetch(`http://localhost:8001/stock/${user.id}`);
          if (stockResp.ok) {
            const stockData = await stockResp.json();
            if (stockData.items && stockData.items.length > 0) {
              // Convert server format to our StockItem format
              const serverItems: StockItem[] = stockData.items.map((item: any) => ({
                id: item.id,
                item: item.item_name,
                stock: item.quantity,
                unit: item.unit,
                reorderLevel: item.reorder_level,
                status: item.quantity <= item.reorder_level / 2 ? "Critical" : item.quantity <= item.reorder_level ? "Low" : "Good",
                value: `₹${(item.quantity * item.unit_price).toLocaleString()}`,
              }));
              setInventory(serverItems);
              addLog("STOCK_SERVER", `Synced ${serverItems.length} items from live warehouse API.`, "success");
            } else {
              addLog("STOCK_SERVER", "Live server connected but no stock items. Using built-in inventory + simulation.", "info");
            }
          }
        }
        
        setTimeout(() => {
          setIsSimulating(true);
          addLog("SYSTEM_ALERT", "Telemetry bound. Live inventory monitoring active.", "info");
        }, 1500);
        return;
      }
    } catch {
      // Stock server not running, fall back to simulator
      addLog("STOCK_SERVER", "Live Stock Server unavailable. Falling back to built-in simulator.", "warning");
    }
    
    // Fallback: use built-in simulator
    setIsConnected(true);
    addLog("STOCK_SERVER", "Connection established via built-in simulator. Beginning ERP telemetry sync.", "success");
    setTimeout(() => {
      setIsSimulating(true);
      addLog("SYSTEM_ALERT", "Telemetry bound. Live inventory monitoring active (simulator mode).", "info");
    }, 1500);
  };

  const disconnectServer = () => {
    setIsConnected(false);
    setIsSimulating(false);
    addLog("STOCK_SERVER", "Connection terminated. Telemetry suspended.", "error");
  };

  const toggleSimulation = () => {
    setIsSimulating(!isSimulating);
    addLog("SYSTEM_ALERT", `Simulation ${!isSimulating ? "resumed" : "paused"}.`, "info");
  };

  const clearLogs = () => setLogs([]);

  // The actual simulation loop
  useEffect(() => {
    if (!isConnected || !isSimulating) return;

    const interval = setInterval(() => {
      setInventory((prevInventory) => {
        const newInventory = [...prevInventory];
        
        // Randomly pick an item to deplete
        const randomItemIndex = Math.floor(Math.random() * newInventory.length);
        const itemToDeplete = { ...newInventory[randomItemIndex] };
        
        // Don't deplete below 0
        if (itemToDeplete.stock <= 0) return prevInventory;

        // Decrease stock by a random chunk
        const decreaseAmount = Math.floor(Math.random() * 20) + 5;
        itemToDeplete.stock = Math.max(0, itemToDeplete.stock - decreaseAmount);

        // Update status for the UI
        if (itemToDeplete.stock <= itemToDeplete.reorderLevel / 2) {
            itemToDeplete.status = "Critical";
        } else if (itemToDeplete.stock <= itemToDeplete.reorderLevel) {
            itemToDeplete.status = "Low";
        } else {
            itemToDeplete.status = "Good";
        }

        // Log the depletion event
        addLog("STOCK_SERVER", `${itemToDeplete.item} stock depleted by ${decreaseAmount} ${itemToDeplete.unit}. Current: ${itemToDeplete.stock} ${itemToDeplete.unit}.`, "info");

        // --- AUTOMATION INTERCEPT ---
        if (itemToDeplete.stock <= itemToDeplete.reorderLevel && !replenishmentTriggered.has(itemToDeplete.id)) {
            // Mark as triggered so we don't spam
            setReplenishmentTriggered(prev => new Set(prev).add(itemToDeplete.id));
            
            // Queue the automation reactions for realism
            setTimeout(() => {
                addLog("SYSTEM_ALERT", `${itemToDeplete.item} fell below critical threshold (${itemToDeplete.reorderLevel} ${itemToDeplete.unit})!`, "warning");
            }, 1000);

            setTimeout(() => {
                addLog("ZENITH_CORE", "Initiating Automated Replenishment Protocol. Searching for ideal vendor routing...", "info");
            }, 2500);

            setTimeout(() => {
                const user = authService.getCurrentUser();
                if (user) {
                   // Calculate optimal reorder (e.g. up to 150% of reorder limit)
                   const replenishAmount = Math.ceil(itemToDeplete.reorderLevel * 1.5);
                   dataService.createRFQ({
                       companyId: user.id || "demo_company_001",
                       title: `AUTO-REPLENISHMENT: ${itemToDeplete.item}`,
                       description: `System generated RFQ due to critical low stock telemetry from connected ERP.`,
                       deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
                       status: "open",
                       items: [{
                           id: `req_${Math.random().toString()}`,
                           itemName: itemToDeplete.item,
                           quantity: replenishAmount,
                           unit: itemToDeplete.unit,
                           specifications: "Standard factory specification automated request."
                       }]
                   });
                   // Notify all connected vendors about urgent demand
                   const approvedVendors = dataService.getApprovedVendorsForCompany(user.id || "demo_company_001");
                   approvedVendors.forEach(vendor => {
                     dataService.pushNotification({
                       userId: vendor.userId,
                       type: "stock_alert",
                       title: "⚡ Urgent Stock Demand",
                       message: `${user.companyName || "A Company"} urgently needs ${replenishAmount} ${itemToDeplete.unit} of ${itemToDeplete.item}. New RFQ published.`,
                       read: false,
                       linkTo: "/vendor/rfqs",
                     });
                   });
                   addLog("ZENITH_CORE", `Successfully opened RFQ for ${replenishAmount} ${itemToDeplete.unit} of ${itemToDeplete.item}.`, "success");
                }
            }, 4500);
        }

        newInventory[randomItemIndex] = itemToDeplete;
        return newInventory;
      });

    }, 6000); // Trigger depletion every 6 seconds

    return () => clearInterval(interval);
  }, [isConnected, isSimulating, replenishmentTriggered, addLog]);

  return (
    <StockSimulatorContext.Provider value={{ isConnected, isSimulating, logs, inventory, connectServer, disconnectServer, toggleSimulation, clearLogs }}>
      {children}
    </StockSimulatorContext.Provider>
  );
}

export const useStockSimulator = () => {
  const context = useContext(StockSimulatorContext);
  if (context === undefined) {
    throw new Error("useStockSimulator must be used within a StockSimulatorProvider");
  }
  return context;
};
