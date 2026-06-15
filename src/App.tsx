import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PhotoTimeline } from "./components/PhotoTimeline";
import { CollectionsView } from "./components/CollectionsView";
import { HomeView } from "./components/HomeView";
import { PhotoEvent } from "./lib/types";
import { loadAndClusterPhotos } from "./lib/events";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"home" | "chronology" | "collections">("home");
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);

  const [activeEvent, setActiveEvent] = useState<PhotoEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const loadedEvents = await loadAndClusterPhotos();
        setEvents(loadedEvents);
      } catch (e: any) {
        console.error("Failed to load photos", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const coverPhoto = events.length > 0 && events[events.length - 1]?.photos[0]
    ? (events[events.length - 1].photos[0].thumbnailLink?.replace("=s220", "=s1024") || events[events.length - 1].photos[0].webContentLink)
    : events[0]?.photos[0]?.thumbnailLink?.replace("=s220", "=s1024");

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden bg-paper text-ink font-serif" style={{ perspective: "2000px" }}>
      
      {/* BACKGROUND APP (Behind the cover) */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: isAlbumOpen ? 1 : 0.95, opacity: isAlbumOpen ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: isAlbumOpen ? 0.3 : 0 }}
        className="absolute inset-0 flex flex-col items-center z-0 h-screen"
        style={{ pointerEvents: isAlbumOpen ? "auto" : "none" }}
      >
        <div className="w-full flex-1 flex flex-col h-full bg-paper">
          <Header 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            currentView={currentView}
            setCurrentView={(v) => {
              setCurrentView(v);
              setActiveEvent(null);
            }}
            onGoHome={() => setIsAlbumOpen(false)}
          />
          <main className="flex-1 flex overflow-hidden w-full relative">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 w-full">
                <Loader2 className="w-8 h-8 text-ink/20 animate-spin" />
                <p className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light">Sincronizando Memórias...</p>
              </div>
            ) : events.length === 0 && currentView !== "collections" ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4 w-full text-center">
                <p className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light opacity-50 mb-4">Você ainda não conectou nenhuma pasta.</p>
                <button 
                  onClick={() => setCurrentView("collections")} 
                  className="px-6 py-3 bg-ink text-paper text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors"
                >
                  Ir para Capítulos
                </button>
              </div>
            ) : (
              <>
                {currentView === "home" && (
                  <HomeView 
                    events={events} 
                    onOpenEvent={(e) => {
                      setActiveEvent(e);
                      setCurrentView("chronology");
                    }}
                    onOpenTimeline={() => setCurrentView("chronology")}
                  />
                )}
                
                {currentView === "chronology" && (
                  <PhotoTimeline 
                    events={events} 
                    searchQuery={searchQuery} 
                    forceOpen={activeEvent}
                    onClearForceOpen={() => {
                      setActiveEvent(null);
                      setCurrentView("home");
                    }}
                    onRefreshEvents={async () => {
                      setLoading(true);
                      try {
                        const loadedEvents = await loadAndClusterPhotos();
                        setEvents(loadedEvents);
                      } catch(e) {}
                      setLoading(false);
                    }}
                  />
                )}

                {currentView === "collections" && (
                  <div className="w-full h-full overflow-y-auto">
                    <CollectionsView />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </motion.div>

      {/* ÁLBUM FRONT COVER */}
      <AnimatePresence>
        {!isAlbumOpen && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
            style={{
              background: `radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.9) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(0, 0, 0, 0.02) 0%, transparent 60%), #F8F5F0`,
              perspective: "2000px"
            }}
          >
            {/* Subtle paper noise on background */}
            <div 
              className="absolute inset-0 mix-blend-multiply opacity-[0.03] pointer-events-none" 
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            <motion.div
              initial={{ y: 20, opacity: 0, rotateZ: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, rotateZ: -1, scale: 1 }}
              exit={{ scale: 1.8, rotateY: -110, rotateZ: 0, opacity: 0, x: -50 }}
              transition={{ 
                duration: 1.4, 
                ease: [0.22, 1, 0.36, 1],
                exit: { duration: 0.9, ease: [0.22, 1, 0.36, 1] }
              }}
              style={{ 
                transformOrigin: "left center",
                boxShadow: "0 45px 120px rgba(0,0,0,0.08)",
              }}
              className="relative bg-[#FCFAF8] w-[90vw] max-w-[420px] max-h-[85vh] flex flex-col items-center justify-between py-8 px-6 sm:py-12 sm:px-8 rounded-[2px]"
            >
              {/* Inner paper layers for thickness effect */}
              <div className="absolute inset-0 border-[2px] border-black/5 rounded-[2px] m-[1px] pointer-events-none"></div>
              <div className="absolute inset-0 border border-black/[0.03] rounded-[2px] m-[2px] pointer-events-none"></div>
              <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

              {/* Cover Photo */}
              <div className="relative w-[55%] sm:w-[60%] shrink-0 aspect-[3/4] bg-paper-dark border-8 border-white shadow-[0_15px_35px_rgba(0,0,0,0.06)] flex items-center justify-center overflow-hidden mb-6 sm:mb-8">
                {coverPhoto ? (
                  <img 
                    src={coverPhoto} 
                    alt="Capa" 
                    className="w-full h-full object-cover grayscale-[15%] hover:grayscale-0 transition-all duration-700"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Loader2 className="w-6 h-6 text-ink/20 animate-spin" />
                )}
              </div>

              {/* Text Elements */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 1 }}
                className="flex flex-col items-center w-full z-10 overflow-y-auto no-scrollbar"
              >
                <h1 
                  className="font-logo text-[2.25rem] sm:text-[2.75rem] md:text-5xl text-ink uppercase text-center leading-[1.1] shrink-0" 
                  style={{ fontWeight: 600, letterSpacing: "-0.04em" }}
                >
                  Álbum Família
                </h1>

                <div className="flex flex-col items-center mt-4 sm:mt-6 text-ink/70 shrink-0">
                  <span className="font-sans text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-medium">Casa Ferreira</span>
                  <span className="font-sans text-[8px] sm:text-[9px] uppercase tracking-[0.15em] mt-1">2024 — Hoje</span>
                </div>

                <div className="w-12 h-px bg-ink/15 my-4 sm:my-6 shrink-0"></div>

                <p className="font-serif italic text-ink text-[1rem] sm:text-[1.1rem] leading-snug text-center max-w-[200px] shrink-0">
                  "Cada foto guarda mais<br/>do que um momento."
                </p>

                <div className="w-12 h-px bg-ink/15 my-4 sm:my-6 shrink-0"></div>

                {loading ? (
                  <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/30 animate-pulse py-2 sm:py-3 shrink-0">
                    Preparando...
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAlbumOpen(true)}
                    className="group shrink-0 relative flex items-center gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-transparent border border-ink/20 hover:border-ink/40 rounded-xl transition-all duration-350 hover:-translate-y-[2px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.05)] active:scale-[0.98]"
                  >
                    <span className="font-sans text-[10px] sm:text-[11px] font-semibold text-ink uppercase tracking-[0.1em] flex items-center gap-2">
                      <span className="transition-transform duration-350 group-hover:translate-x-1">→</span> 
                      Abrir Álbum
                    </span>
                  </button>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
