import React, { useState, useEffect } from "react";
import { Album } from "../lib/types";
import { getAlbums, addAlbumFromUrl, loadAlbumPhotos } from "../lib/albums";
import { FolderPlus, Loader2, Image as ImageIcon } from "lucide-react";
import { PhotoEvent } from "../lib/types";
import { PhotoTimeline } from "./PhotoTimeline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function CollectionsView() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumEvent, setAlbumEvent] = useState<PhotoEvent | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  useEffect(() => {
    setAlbums(getAlbums());
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
          ← Voltar para Minhas Memórias
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
      <h2 className="text-4xl font-black tracking-tighter uppercase mb-6 font-serif text-ink">Minhas Memórias</h2>
      <p className="text-sm font-sans uppercase tracking-[0.2em] font-semibold text-ink-light max-w-xl">
        Cole links de pastas do Google Drive abaixo para guardar novos capítulos no seu álbum.
      </p>

      <form onSubmit={handleAdd} className="flex gap-4 mb-16 relative mt-12">
        <input 
          type="url"
          required
          placeholder="Cole o link da pasta do Google Drive aqui..."
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="flex-1 bg-transparent border-b-2 border-black/10 px-0 py-4 focus:outline-none focus:border-ocean transition-colors text-xs font-sans font-medium tracking-widest placeholder:text-ink-light text-ink"
          disabled={adding}
        />
        <button 
          type="submit"
          disabled={adding || !newUrl}
          className="px-8 bg-ink text-paper text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
          Adicionar
        </button>
        {error && <div className="absolute -bottom-6 left-0 text-[10px] text-terracotta font-sans uppercase">{error}</div>}
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {albums.map(album => (
          <button 
            key={album.id}
            onClick={() => handleSelectAlbum(album)}
            className="group flex flex-col text-left aspect-[4/3] bg-paper-dark border-4 border-white shadow-sm relative overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1"
          >
            <div className="absolute inset-0 flex items-center justify-center text-ink/5 group-hover:text-ink/10 transition-colors">
              <ImageIcon className="w-24 h-24" />
            </div>
            
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/20 to-transparent">
              <h3 className="text-xl font-serif font-black tracking-tight leading-tight text-white drop-shadow-md">{album.title}</h3>
              <p className="text-[10px] font-sans uppercase tracking-[0.1em] text-white/90 drop-shadow-md mt-1">
                {format(new Date(album.addedAt), "MMM yyyy", { locale: ptBR })}
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
