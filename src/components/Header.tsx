import React from "react";
import { Search } from "lucide-react";

export function Header({ 
  searchQuery, 
  setSearchQuery,
  currentView,
  setCurrentView,
  onGoHome
}: { 
  searchQuery: string; 
  setSearchQuery: (q: string) => void;
  currentView: "home" | "chronology" | "collections";
  setCurrentView: (v: "home" | "chronology" | "collections") => void;
  onGoHome: () => void;
}) {
  return (
    <header className="h-20 flex items-center justify-between px-6 sm:px-12 border-b border-black/5 bg-paper sticky top-0 z-50">
      <button onClick={onGoHome} className="text-2xl font-bold tracking-widest uppercase font-logo text-ink hover:opacity-80 transition-opacity">Álbum</button>

      <nav className="hidden md:flex gap-8 text-xs font-sans font-medium uppercase tracking-widest text-ink-light ml-12 items-center flex-1">
        <button 
          onClick={() => setCurrentView("home")}
          className={`hover:text-ink transition-colors ${currentView === "home" ? "text-ink underline underline-offset-4" : ""}`}
        >
          Início
        </button>
        <button 
          onClick={() => setCurrentView("chronology")}
          className={`hover:text-ink transition-colors ${currentView === "chronology" ? "text-ink underline underline-offset-4" : ""}`}
        >
          Linha do Tempo
        </button>
        <button 
          onClick={() => setCurrentView("collections")}
          className={`hover:text-ink transition-colors ${currentView === "collections" ? "text-ink underline underline-offset-4" : ""}`}
        >
          Capítulos
        </button>
      </nav>

      {(currentView === "chronology" || currentView === "home") && (
        <div className="flex-1 md:flex-none max-w-[200px] relative mx-4">
          <label htmlFor="search" className="sr-only">Buscar</label>
          <div className="relative">
            <input
              id="search"
              type="text"
              placeholder="Buscar memórias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-0 pr-3 py-1 border-b border-black/10 bg-transparent placeholder-ink-light focus:outline-none focus:border-black/50 transition-colors text-xs font-sans font-medium uppercase tracking-widest text-ink"
            />
          </div>
        </div>
      )}
    </header>
  );
}
