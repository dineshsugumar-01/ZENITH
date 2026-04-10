import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";
import { AutomationTerminal } from "./automation-terminal";

interface LayoutProps {
  children: ReactNode;
  type: "company" | "vendor";
  title: string;
}

export function Layout({ children, type, title }: LayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar type={type} />
      <div className="flex-1 ml-64 flex flex-col">
        <Navbar title={title} type={type} />
        <main className="flex-1 overflow-y-auto p-8 bg-background relative">
          {children}
        </main>
      </div>
      
      {/* Floating Stock Server Log Terminal */}
      {type === "company" && <AutomationTerminal />}
    </div>
  );
}
