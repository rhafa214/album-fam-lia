import { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PhotoTimeline } from "./components/PhotoTimeline";
import { CollectionsView } from "./components/CollectionsView";
import { HomeView } from "./components/HomeView";
import { PhotoEvent } from "./lib/types";
import { loadAndClusterPhotos } from "./lib/events";
import { Loader2, Image } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSyncedState } from "./lib/sync";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"home" | "chronology" | "collections">("home");
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);

  const [activeEvent, setActiveEvent] = useState<PhotoEvent | null>(null);

  const [mainCoverPhoto, setMainCoverPhoto] = useSyncedState<string | null>("main-cover-photo", null);
  useSyncedState<Record<string, string>>("custom_photo_dates", {});

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

  const coverPhoto = mainCoverPhoto || (events.length > 0 && events[0]?.photos[0]
    ? (events[0].photos[0].thumbnailLink?.replace("=s220", "=s1024") || events[0].photos[0].webContentLink)
    : undefined);

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
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
          >
            {/* Cover Photo Background */}
            {coverPhoto ? (
              <img 
                src={coverPhoto} 
                alt="Capa" 
                className="absolute inset-0 w-full h-full object-cover opacity-70"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/20 animate-spin" />
              </div>
            )}
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none" />

            {/* Text Elements */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="relative z-10 flex flex-col items-center w-full px-6 text-white"
            >
              <h1 
                className="font-logo text-[2.5rem] sm:text-[4rem] md:text-[5.5rem] text-center leading-[1.1] drop-shadow-lg" 
                style={{ fontWeight: 600, letterSpacing: "-0.04em" }}
              >
                Álbum Família<br />Ferreira de Noronha
              </h1>

              <div className="flex flex-col items-center mt-6 text-white/80 drop-shadow-md">
                <span className="font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.3em] font-medium">Desde</span>
                <span className="font-sans text-[12px] sm:text-[14px] uppercase tracking-[0.2em] mt-1">2024 — Hoje</span>
              </div>

              <div className="w-16 h-px bg-white/30 my-8 shrink-0"></div>

              {loading ? (
                <div className="text-[12px] font-sans font-bold uppercase tracking-widest text-white/50 animate-pulse py-4">
                  Carregando Memórias...
                </div>
              ) : (
                <button 
                  onClick={() => setIsAlbumOpen(true)}
                  className="group relative flex items-center gap-4 px-10 py-5 bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 hover:scale-105 rounded-full transition-all duration-300 shadow-xl"
                >
                  <span className="font-sans text-[12px] sm:text-[14px] font-semibold text-white uppercase tracking-[0.15em] flex items-center gap-3">
                    Abrir Álbum
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span> 
                  </span>
                </button>
              )}
            </motion.div>

            {/* Change Cover Photo Button & Logic */}
            {!loading && events.length > 0 && (
              <div className="absolute bottom-6 right-6 z-20">
                <div className="group relative">
                  <button 
                    className="p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white/80 hover:text-white transition-all hover:scale-105"
                    title="Alterar foto de capa"
                  >
                    <Image size={20} />
                  </button>
                  {/* Dropup for choosing photo */}
                  <div className="absolute bottom-full right-0 mb-4 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl w-[80vw] max-w-[320px] max-h-[50vh] overflow-y-auto hidden group-hover:grid grid-cols-3 gap-2 shadow-2xl origin-bottom-right">
                    <div className="col-span-3 text-white/60 text-xs font-sans uppercase tracking-widest mb-2 px-1">
                      Escolher Capa
                    </div>
                    {events.flatMap(e => e.photos).slice(0, 30).map((photo, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const url = photo.thumbnailLink?.replace("=s220", "=s1024") || photo.webContentLink;
                          if (url) {
                            setMainCoverPhoto(url);
                          }
                        }}
                        className="w-full aspect-square relative overflow-hidden rounded-lg border border-transparent hover:border-white transition-all hover:scale-105"
                      >
                        <img 
                          src={photo.thumbnailLink} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
