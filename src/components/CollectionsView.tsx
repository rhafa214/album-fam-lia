import React, { useState, useEffect } from "react";
import { Album } from "../lib/types";
import { getAlbums, saveAlbums, addAlbumFromUrl, loadAlbumPhotos } from "../lib/albums";
import { FolderPlus, Loader2, Image as ImageIcon, DownloadCloud } from "lucide-react";
import { PhotoEvent } from "../lib/types";
import { PhotoTimeline } from "./PhotoTimeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { auth, db, signInWithGoogle, logout } from "../lib/firebase";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";

export function CollectionsView() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumEvent, setAlbumEvent] = useState<PhotoEvent | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    // Load initially from local storage
    setAlbums(getAlbums());

    const unsubscribeAuth = auth.onAuthStateChanged(newUser => {
      setUser(newUser);
      if (newUser) {
        // Sync local albums to cloud right away
        const localAlbums = getAlbums();
        if (localAlbums.length > 0) {
           saveAlbums(localAlbums);
        }

        const q = collection(db, `users/${newUser.uid}/albums`);
        return onSnapshot(q, (snapshot) => {
          const remoteAlbums = snapshot.docs.map(d => d.data() as Album);
          const currentLocal = getAlbums();
          const merged = [...currentLocal];
          let changed = false;
          for (const ra of remoteAlbums) {
            if (!merged.find(a => a.id === ra.id)) {
              merged.push(ra);
              changed = true;
            }
          }
          if (changed) {
             localStorage.setItem("my_albums", JSON.stringify(merged));
          }
          setAlbums(merged);
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl) return;
    setAdding(true);
    setError("");
    try {
      const album = await addAlbumFromUrl(newUrl);
      setAlbums(prev => [...prev, album]);
      setNewUrl("");
    } catch (err: any) {
      setError(err.message || "Falha ao adicionar álbum");
    } finally {
      setAdding(false);
    }
  };

  const handleSelectAlbum = async (album: Album) => {
    setSelectedAlbum(album);
    setLoadingPhotos(true);
    try {
      const photos = await loadAlbumPhotos(album.id);
      setAlbumEvent({
        id: album.id,
        title: album.title,
        startDate: new Date(photos[photos.length - 1]?.createdTime || new Date()),
        endDate: new Date(photos[0]?.createdTime || new Date()),
        photos
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  if (selectedAlbum) {
    return (
      <div className="w-full flex flex-col items-center">
        <button 
          onClick={() => setSelectedAlbum(null)}
          className="my-8 text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light hover:text-ink transition-colors"
        >
          ← Voltar para Capítulos
        </button>
        {loadingPhotos ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 text-ink/20 animate-spin" />
            <p className="text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light">Sincronizando Álbum...</p>
          </div>
        ) : albumEvent ? (
          <PhotoTimeline events={[albumEvent]} searchQuery="" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-12 md:px-12 flex flex-col">
      <div className="flex flex-col items-center mb-6 relative">
        <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase font-serif text-ink text-center">Capítulos</h2>
        {!user ? (
          <button 
            onClick={signInWithGoogle}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-sans font-bold uppercase tracking-widest hover:bg-indigo-100 transition-colors border border-indigo-100"
          >
            <DownloadCloud className="w-4 h-4" />
            Salvar na Nuvem
          </button>
        ) : (
          <div className="mt-6 flex flex-col items-center space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
              <DownloadCloud className="w-3.5 h-3.5" /> Sincronizado
            </span>
            <button 
              onClick={logout}
              className="text-[10px] text-ink/40 font-bold uppercase tracking-widest hover:text-ink transition-colors"
            >
              Sair da Conta ({user.email})
            </button>
          </div>
        )}
      </div>
      <p className="text-xs font-sans uppercase tracking-[0.2em] font-semibold text-ink-light max-w-xl mx-auto text-center mt-2">
        Cole links de pastas do Google Drive abaixo para guardar novos capítulos no seu álbum.
      </p>

      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4 relative mt-12 w-full max-w-2xl mx-auto items-center mb-16">
        <input 
          type="url"
          required
          placeholder="Cole o link da pasta do Google Drive aqui..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 w-full bg-transparent border-b border-black/20 px-0 py-4 focus:outline-none focus:border-ink transition-colors text-xs font-sans font-medium tracking-widest placeholder:text-ink-light/50 text-ink text-center sm:text-left"
          disabled={adding}
        />
        <button 
          type="submit"
          disabled={adding || !newUrl}
          className="w-full sm:w-auto px-8 py-4 bg-ink text-paper text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
          Novo Capítulo
        </button>
        {error && <div className="absolute -bottom-8 left-0 right-0 text-center text-[10px] text-terracotta font-sans uppercase tracking-widest">{error}</div>}
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-16 mt-8 pb-24">
        {albums.map((album, idx) => (
          <button 
            key={album.id}
            onClick={() => handleSelectAlbum(album)}
            className="group flex flex-col text-left transition-all duration-500 hover:scale-[1.02] cursor-pointer"
            style={{ rotate: `${(idx % 2 === 0 ? '-1deg' : '1deg')}` }}
          >
            <div className="w-full aspect-[4/5] bg-paper-dark border-[12px] border-white relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
              <div className="absolute inset-0 flex items-center justify-center text-ink/5 group-hover:text-ink/10 transition-colors">
                <ImageIcon className="w-24 h-24" />
              </div>
            </div>
            
            <div className="mt-6 text-center space-y-1 h-32">
              <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink-light">
                {format(new Date(album.addedAt), "yyyy", { locale: ptBR })}
              </p>
              <h3 className="text-xl font-serif text-ink tracking-tight uppercase group-hover:text-terracotta transition-colors leading-tight">
                {album.title}
              </h3>
              <p className="font-handwriting text-ink/60 text-xl italic mt-2">
                "Um dia para lembrar."
              </p>
            </div>
          </button>
        ))}
        {albums.length === 0 && (
          <div className="col-span-full py-20 text-center text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light border border-dashed border-ink/20 rounded-xl">
            Nenhum capítulo salvo. Adicione sua primeira pasta acima.
          </div>
        )}
      </div>
    </div>
  );
}
