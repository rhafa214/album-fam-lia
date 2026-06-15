import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, logout as authLogout } from "./auth";
import { Header } from "./components/Header";
import { PhotoTimeline } from "./components/PhotoTimeline";
import { CollectionsView } from "./components/CollectionsView";
import { PhotoEvent } from "./lib/types";
import { loadAndClusterPhotos } from "./lib/events";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentView, setCurrentView] = useState<"chronology" | "collections">("chronology");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      async (user, token) => {
        setUser(user);
        setNeedsAuth(false);
        setLoading(true);
        setAuthError(null);
        try {
          const loadedEvents = await loadAndClusterPhotos();
          setEvents(loadedEvents);
        } catch (e: any) {
          console.error("Failed to load photos", e);
          setAuthError(e.message || "Failed to load photos from Google Drive. Please ensure you checked the permissions box.");
        } finally {
          setLoading(false);
        }
      },
      () => {
        setNeedsAuth(true);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentView === "chronology" && user && !needsAuth && isAlbumOpen) {
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
    }
  }, [currentView, user, needsAuth, isAlbumOpen]);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
        try {
          const loadedEvents = await loadAndClusterPhotos();
          setEvents(loadedEvents);
        } catch (e: any) {
          console.error("Failed to load photos", e);
          setAuthError(e.message || "Failed to load photos from Google Drive. Please ensure you checked the permissions box.");
        }
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      setAuthError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setEvents([]);
    setIsAlbumOpen(false);
  };

  if (loading && !needsAuth && !user) {
    return (
      <div className="min-h-screen flex flex-col pt-32 items-center bg-paper text-ink font-serif">
        <Loader2 className="w-8 h-8 opacity-50 animate-spin mb-4" />
        <p className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light opacity-50">Autenticando...</p>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="min-h-screen bg-paper text-ink font-serif flex flex-col items-center justify-center p-4">
        <div className="max-w-sm w-full bg-transparent p-8 text-center space-y-8">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase font-serif">Álbum</h1>
            <p className="text-sm font-sans uppercase tracking-[0.2em] font-semibold text-ink-light opacity-50 mt-4">Acesso Privado</p>
          </div>
          
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-ink text-paper text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors"
          >
            Acessar com Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAlbumOpen) {
    return (
      <div 
        className="min-h-screen bg-paper text-ink font-serif flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`
        }}
      >
        <div className="flex flex-col items-center z-10 space-y-12">
          <div className="w-[300px] h-[400px] bg-paper-dark rounded-r-3xl shadow-[20px_0_40px_rgba(0,0,0,0.05),_inset_5px_0_15px_rgba(0,0,0,0.05)] border-l-8 border-ocean/80 relative flex items-center justify-center transition-transform hover:scale-[1.02] cursor-pointer"
               onClick={() => setIsAlbumOpen(true)}>
            <div className="absolute left-6 top-10 bottom-10 w-px bg-black/10"></div>
            <div className="absolute right-6 top-10 bottom-10 w-px bg-white/50"></div>
            
            <div className="text-center px-8 z-10 w-full">
              <h1 className="text-5xl font-serif text-ink tracking-tight mb-4">Álbum da<br/>Família</h1>
            </div>
            
            <div className="absolute bottom-10 left-0 right-0 text-center">
              <span className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light mix-blend-multiply">
                Est. {new Date().getFullYear()}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-ink-light italic font-serif text-lg mb-8">"Cada foto guarda mais do que um momento."</p>
            <button 
              onClick={() => setIsAlbumOpen(true)}
              className="px-8 py-3 border border-ink text-ink text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink hover:text-paper transition-colors"
            >
              Abrir Álbum
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-serif flex flex-col">
      <Header 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        onLogout={handleLogout}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />
      <main className="flex-1 flex overflow-hidden max-w-[1440px] mx-auto w-full relative">
        {currentView === "chronology" && (
          loading ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 w-full">
              <Loader2 className="w-8 h-8 text-ink/20 animate-spin" />
              <p className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light">Sincronizando Memórias...</p>
            </div>
          ) : authError ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 w-full max-w-lg mx-auto text-center px-6">
              <div className="w-12 h-12 bg-terracotta/10 text-terracotta rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h2 className="text-xl font-bold font-sans">Wait, we need permission!</h2>
              <p className="text-sm font-sans text-ink-light opacity-70 mb-4">{authError}</p>
              <button 
                onClick={handleLogin}
                className="px-6 py-3 bg-ink text-paper text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors"
              >
                Try login again
              </button>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 space-y-4 w-full text-center">
              <p className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light opacity-50 mb-4">Você ainda não conectou nenhuma pasta.</p>
              <button 
                onClick={() => setCurrentView("collections")} 
                className="px-6 py-3 bg-ink text-paper text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors"
              >
                Ir para Minhas Memórias
              </button>
            </div>
          ) : (
            <PhotoTimeline events={events} searchQuery={searchQuery} />
          )
        )}
        
        {currentView === "collections" && (
          <div className="w-full h-full overflow-y-auto">
            <CollectionsView />
          </div>
        )}
      </main>
    </div>
  );
}
