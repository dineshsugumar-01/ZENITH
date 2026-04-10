import { useState, useRef, useEffect } from "react";
import { useStockSimulator } from "../lib/stockSimulator";
import { Terminal, X, Minimize2, Play, Pause, AlertCircle, Server } from "lucide-react";

export function AutomationTerminal() {
  const { isConnected, isSimulating, logs, connectServer, disconnectServer, toggleSimulation, clearLogs } = useStockSimulator();
  const [isOpen, setIsOpen] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of logs
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!isConnected && !isOpen) {
    return null; // Don't show the floating button if they haven't connected their server yet, except maybe they want to open it TO connect? We'll put the connect button in the Navbar.
  }

  // Floating Bubble when closed
  if (!isOpen) {
    return (
      <div 
        className="fixed bottom-6 right-6 bg-[#0B1120] text-blue-400 p-4 rounded-full shadow-lg cursor-pointer hover:bg-slate-800 transition-colors z-50 flex items-center justify-center border border-indigo-500/30"
        onClick={() => setIsOpen(true)}
      >
         <Terminal className="w-6 h-6 animate-pulse" />
         <span className="absolute -top-1 -right-1 flex h-3 w-3">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
         </span>
      </div>
    );
  }

  // Open Terminal View
  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-[#0B1120] rounded-xl shadow-2xl flex flex-col z-50 border border-slate-700/50 overflow-hidden font-mono text-sm">
      {/* Header */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-slate-300 font-semibold tracking-wider text-xs">ZENITH CORE AUTOMATION</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 flex gap-2 items-center justify-between">
          <div className="flex gap-2">
              <button 
                onClick={toggleSimulation}
                disabled={!isConnected}
                className={`p-1.5 rounded flex items-center justify-center ${!isConnected ? 'opacity-50 cursor-not-allowed text-slate-500' : isSimulating ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                title={isSimulating ? "Pause Simulation" : "Resume Simulation"}
              >
                  {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button 
                  onClick={clearLogs}
                  className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs hover:bg-slate-600 transition-colors"
              >
                  Clear
              </button>
          </div>
          
          <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Status:</span>
              {isConnected ? (
                  <span className="text-emerald-400 flex items-center gap-1"><Server className="w-3 h-3"/> CONNECTED</span>
              ) : (
                  <span className="text-red-400">OFFLINE</span>
              )}
          </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#0B1120] text-slate-300 space-y-2">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 mt-[-20px]">
            <Server className="w-8 h-8 opacity-50" />
            <p>Awaiting Telemetry...</p>
          </div>
        ) : (
          logs.map((log) => {
            const timeString = log.timestamp.toLocaleTimeString([], { hour12: false });
            
            let colorClass = "text-slate-300";
            let icon = null;

            if (log.type === "info") colorClass = "text-blue-300";
            if (log.type === "warning") {
                colorClass = "text-amber-400";
                icon = <AlertCircle className="w-3 h-3 inline mr-1" />;
            }
            if (log.type === "success") colorClass = "text-emerald-400";
            if (log.type === "error") colorClass = "text-red-400";

            return (
              <div key={log.id} className="leading-relaxed break-words">
                <span className="text-slate-500">[{timeString}]</span>{" "}
                <span className={`font-semibold ${log.source === 'STOCK_SERVER' ? 'text-indigo-400' : log.source === 'ZENITH_CORE' ? 'text-blue-400' : 'text-amber-500'}`}>
                    [{log.source}]
                </span>{" "}
                <span className={colorClass}>
                    {icon}
                    {log.message}
                </span>
              </div>
            );
          })
        )}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}
