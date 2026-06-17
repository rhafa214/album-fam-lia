import React, { useState, useEffect } from "react";
import { Album } from "../lib/types";
import { getAlbums, saveAlbums, addAlbumFromUrl, loadAlbumPhotos } from "../lib/albums";
import { FolderPlus, Loader2, Image as ImageIcon, DownloadCloud, Edit3, X } from "lucide-react";
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

  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCoverUrl, setEditCoverUrl] = useState("");

  useEffect(() => {
    // Load initially from local storage
    setAlbums(getAlbums());

    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = auth.onAuthStateChanged(newUser => {
      setUser(newUser);
      
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = undefined;
      }

      if (newUser) {
        // Sync local albums to cloud right away
        const localAlbums = getAlbums();
        if (localAlbums.length > 0) {
           saveAlbums(localAlbums);
        }

        const q = collection(db, `users/${newUser.uid}/albums`);
        unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
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
        }, (err) => {
          console.error("Snapshot error:", err);
        });
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
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
        startDate: new Date(album.customDate || photos[photos.length - 1]?.createdTime || new Date()),
        endDate: new Date(album.customDate || photos[0]?.createdTime || new Date()),
        photos
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPhotos(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingAlbum) return;
    const updatedAlbums = albums.map(a => 
      a.id === editingAlbum.id ? { 
        ...a, 
        title: editTitle, 
        customDate: editDate, 
        coverUrl: editCoverUrl 
      } : a
    );
    setAlbums(updatedAlbums);
    saveAlbums(updatedAlbums);
    setEditingAlbum(null);
  };

  const handleDeleteAlbum = () => {
    if (!editingAlbum) return;
    if (window.confirm("Certeza que deseja excluir este capítulo?")) {
      const updatedAlbums = albums.filter(a => a.id !== editingAlbum.id);
      setAlbums(updatedAlbums);
      saveAlbums(updatedAlbums);
      setEditingAlbum(null);
    }
  };

  const handleSetCoverFromTimeline = (url: string) => {
    if (!selectedAlbum) return;
    const updatedAlbums = albums.map(a => 
      a.id === selectedAlbum.id ? { 
        ...a, 
        coverUrl: url 
      } : a
    );
    setAlbums(updatedAlbums);
    saveAlbums(updatedAlbums);
    // Update local state so it immediately reflects if we go back
    setSelectedAlbum({ ...selectedAlbum, coverUrl: url });
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
          <PhotoTimeline 
            events={[albumEvent]} 
            searchQuery="" 
            onSetChapterCover={handleSetCoverFromTimeline}
            isAlbumView={true}
          />
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
            Sincronizar Nuvem (Login Google)
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
          <div key={album.id} className="relative group flex flex-col text-left transition-all duration-500 hover:scale-[1.02]" style={{ rotate: `${(idx % 2 === 0 ? '-1deg' : '1deg')}` }}>
            <button 
              onClick={() => handleSelectAlbum(album)}
              className="peer cursor-pointer w-full text-left"
            >
              <div className="w-full aspect-[4/5] bg-paper-dark border-[12px] border-white relative overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.08)]">
                {album.coverUrl ? (
                  <img src={album.coverUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-ink/5 group-hover:text-ink/10 transition-colors">
                    <ImageIcon className="w-24 h-24" />
                  </div>
                )}
              </div>
              
              <div className="mt-6 text-center space-y-1 h-32 px-4">
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink-light">
                  {album.customDate ? format(new Date(album.customDate), "MMMM yyyy", { locale: ptBR }) : format(new Date(album.addedAt), "yyyy", { locale: ptBR })}
                </p>
                <h3 className="text-xl font-serif text-ink tracking-tight uppercase group-hover:text-terracotta transition-colors leading-tight">
                  {album.title}
                </h3>
                <p className="font-handwriting text-ink/60 text-xl italic mt-2">
                  "Um dia para lembrar."
                </p>
              </div>
            </button>

            {/* Edit button superimposed over the card */}
            <button
              onClick={() => {
                setEditingAlbum(album);
                setEditTitle(album.title);
                setEditDate(album.customDate || album.addedAt.split('T')[0]);
                setEditCoverUrl(album.coverUrl || "");
              }}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-sm text-ink/50 hover:text-ink cursor-pointer"
              title="Editar Capítulo"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {albums.length === 0 && (
          <div className="col-span-full py-20 text-center text-[10px] font-sans uppercase tracking-[0.2em] font-semibold text-ink-light border border-dashed border-ink/20 rounded-xl">
            Nenhum capítulo salvo. Adicione sua primeira pasta acima.
          </div>
        )}
      </div>

      {editingAlbum && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-paper p-8 border border-ink/10 max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setEditingAlbum(null)} className="absolute top-4 right-4 text-ink-light hover:text-ink p-2">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-2xl mb-6 text-ink">Editar Capítulo</h3>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-ink-light mb-1 block">Título do Capítulo</label>
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-transparent border-b border-ink/20 px-2 py-2 text-sm font-sans text-ink focus:outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-ink-light mb-1 block">Data Base (Mês/Ano)</label>
                <input 
                  type="date" 
                  value={editDate ? editDate.split('T')[0] : ''}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full bg-transparent border-b border-ink/20 px-2 py-2 text-sm font-sans text-ink focus:outline-none focus:border-ink transition-colors"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-widest text-ink-light mb-1 block">URL da Capa (Opcional)</label>
                <input 
                  type="url" 
                  value={editCoverUrl}
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-transparent border-b border-ink/20 px-2 py-2 text-sm font-sans text-ink focus:outline-none focus:border-ink transition-colors"
                />
                <p className="text-[10px] text-ink-light/70 mt-2 font-mono">Dica: abra o capítulo e use o botão de capa nas fotos para preencher isso automaticamente.</p>
              </div>
            </div>

            <div className="flex gap-4 justify-between items-center">
              <button 
                onClick={handleDeleteAlbum} 
                className="text-[10px] uppercase font-bold tracking-widest text-terracotta hover:text-red-700 transition-colors"
              >
                Excluir
              </button>
              <div className="flex gap-4">
                <button onClick={() => setEditingAlbum(null)} className="text-xs uppercase font-bold tracking-widest text-ink-light hover:text-ink">Cancelar</button>
                <button onClick={handleSaveEdit} className="text-xs uppercase font-bold tracking-widest text-ink hover:text-terracotta transition-colors">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
