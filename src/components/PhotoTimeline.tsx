import React, { useState, useEffect } from "react";
import { PhotoEvent } from "../lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight, BookOpen, Clock, Calendar, Heart, Palette, Download, Image as ImageIcon, Type, Smile, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useSyncedState } from "../lib/sync";

type Decoration = {
  id: string;
  type: 'text' | 'emoji';
  content: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  fontFamily?: string;
};
import { Lightbox } from "./Lightbox";
import { DriveFile } from "../lib/drive";
import { saveCustomDate } from "../lib/events";

export function PhotoTimeline({ 
  events, 
  searchQuery,
  forceOpen,
  onClearForceOpen,
  onRefreshEvents,
  onSetChapterCover,
  isAlbumView
}: { 
  events: PhotoEvent[], 
  searchQuery: string,
  forceOpen?: PhotoEvent | null,
  onClearForceOpen?: () => void,
  onRefreshEvents?: () => void,
  onSetChapterCover?: (url: string) => void,
  isAlbumView?: boolean
}) {
  const [openedEvent, setOpenedEvent] = useState<PhotoEvent | null>(null);
  const [albumPageIndex, setAlbumPageIndex] = useState(0);
  const [lightboxData, setLightboxData] = useState<{ photos: DriveFile[], index: number } | null>(null);
  
  const [editingDate, setEditingDate] = useState(false);
  const [newDateStr, setNewDateStr] = useState("");

  const [favorites, setFavorites] = useSyncedState<string[]>("photo-favorites", []);
  const [coverPhotos, setCoverPhotos] = useSyncedState<Record<string, string>>("album-covers", {});
  const [albumThemes, setAlbumThemes] = useSyncedState<Record<string, string>>("album-themes", {});
  const [decorations, setDecorations] = useSyncedState<Record<string, Decoration[]>>("album-decorations", {});

  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isFontPickerOpen, setIsFontPickerOpen] = useState(false);
  const [editingDecorationId, setEditingDecorationId] = useState<string | null>(null);
  const [currentFont, setCurrentFont] = useState('font-handwriting');

  const EMOJIS = ['❤️', '✨', '🌸', '👑', '🎈', '🎉', '📝', '⭐', '🎂', '👶', '🎄', '🎁', '💖', '🧸', '🍼'];
  const FONTS = [
    { name: 'Manual', class: 'font-handwriting' },
    { name: 'Clássica', class: 'font-serif' },
    { name: 'Moderna', class: 'font-sans' },
    { name: 'Máquina', class: 'font-mono' }
  ];

  const toggleFavorite = (photoId: string) => {
    setFavorites(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };

  const setCover = (eventId: string, photoId: string) => {
    setCoverPhotos(prev => ({ ...prev, [eventId]: photoId }));
  };

  const setAlbumTheme = (eventId: string, themeColor: string) => {
    setAlbumThemes(prev => ({ ...prev, [eventId]: themeColor }));
  };

  const addDecoration = (type: 'text' | 'emoji', content: string) => {
    if (!openedEvent) return;
    const pageId = `${openedEvent.id}-p${albumPageIndex}`;
    const newDeco: Decoration = {
      id: Math.random().toString(36).substring(7),
      type,
      content,
      x: (Math.random() * 40) - 20,
      y: (Math.random() * 40) - 20,
      rotation: type === 'emoji' ? (Math.random() * 20 - 10) : 0,
      scale: 1,
      fontFamily: type === 'text' ? currentFont : undefined
    };
    setDecorations(prev => ({ ...prev, [pageId]: [...(prev[pageId] || []), newDeco] }));
    if (type === 'text') {
      setEditingDecorationId(newDeco.id);
    }
  };

  const updateDecoration = (id: string, updates: Partial<Decoration>) => {
    if (!openedEvent) return;
    const pageId = `${openedEvent.id}-p${albumPageIndex}`;
    setDecorations(prev => ({
      ...prev,
      [pageId]: (prev[pageId] || []).map(d => d.id === id ? { ...d, ...updates } : d)
    }));
  };

  const removeDecoration = (id: string) => {
    if (!openedEvent) return;
    const pageId = `${openedEvent.id}-p${albumPageIndex}`;
    setDecorations(prev => ({
      ...prev,
      [pageId]: (prev[pageId] || []).filter(d => d.id !== id)
    }));
  };

  useEffect(() => {
    if (forceOpen) {
      setOpenedEvent(forceOpen);
      setAlbumPageIndex(0);
    }
  }, [forceOpen]);

  const handleSaveDate = (photoId: string) => {
    if (newDateStr) {
       saveCustomDate(photoId, new Date(newDateStr).toISOString());
       setEditingDate(false);
       onRefreshEvents?.();
    }
  };

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    const title = e.title?.toLowerCase() || "";
    const dateStr = format(e.endDate, "MMMM yyyy", { locale: ptBR }).toLowerCase();
    return title.includes(searchQuery.toLowerCase()) || dateStr.includes(searchQuery.toLowerCase());
  });

  const spreads = React.useMemo(() => {
    if (!openedEvent) return [];
    const photos = openedEvent.photos;
    const result = [];
    let i = 0;
    let spreadIdx = 0;
    while (i < photos.length) {
      // Every 3rd spread, make the left side full-bleed (1 photo). Right side gets 2 photos.
      // Every 5th spread, make the right side full-bleed.
      let leftCount = 2;
      let rightCount = 2;
      let isLeftFullBleed = false;
      let isRightFullBleed = false;

      if (spreadIdx % 3 === 0 && spreadIdx !== 0) {
        leftCount = 1;
        isLeftFullBleed = true;
        rightCount = 2;
      } else if (spreadIdx % 5 === 0) {
        leftCount = 2;
        rightCount = 1;
        isRightFullBleed = true;
      }

      const leftPhotos = photos.slice(i, i + leftCount);
      i += leftPhotos.length;
      
      // Correct if we ran out of photos for right side
      const rightPhotos = photos.slice(i, i + rightCount);
      i += rightPhotos.length;

      // Ensure if left only has 1 and wasn't intended to be full bleed, we don't necessarily make it full bleed unless we want to
      if (leftPhotos.length === 1 && !isLeftFullBleed) isLeftFullBleed = spreadIdx % 2 === 0;
      if (rightPhotos.length === 1 && !isRightFullBleed) isRightFullBleed = spreadIdx % 2 !== 0;

      result.push({
        leftPhotos,
        rightPhotos,
        isLeftFullBleed,
        isRightFullBleed,
        startIndex: i - leftPhotos.length - rightPhotos.length
      });
      spreadIdx++;
    }
    return result;
  }, [openedEvent]);

  if (openedEvent) {
    const photos = openedEvent.photos;

    const maxAlbumPageIndex = Math.max(0, spreads.length - 1);
    const validAlbumPageIndex = Math.min(albumPageIndex, maxAlbumPageIndex);
    const currentSpread = spreads[validAlbumPageIndex] || { leftPhotos: [], rightPhotos: [], isLeftFullBleed: false, isRightFullBleed: false, startIndex: 0 };

    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center overflow-hidden transition-colors duration-500" style={{ backgroundColor: albumThemes[openedEvent.id] || '#E5DFD5' }}>
        {/* Subtle noise and texture background */}
        <div 
          className="absolute inset-0 mix-blend-multiply opacity-[0.04] pointer-events-none z-0" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        {/* Discreet Back Button */}
        <button 
          onClick={() => {
            setOpenedEvent(null);
            setAlbumPageIndex(0);
            onClearForceOpen?.();
          }}
          className="absolute top-4 left-4 md:top-6 md:left-6 z-[70] p-2 bg-white/30 hover:bg-white/60 backdrop-blur-md shadow-sm border border-black/5 rounded-full text-ink/70 hover:text-ink transition-all hover:scale-105"
          title="Voltar"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Toolbar */}
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[70] flex gap-2">
          
          <div className="relative">
            <button 
              onClick={() => { setIsFontPickerOpen(!isFontPickerOpen); setIsEmojiPickerOpen(false); setIsThemePickerOpen(false); }}
              className="p-1.5 bg-white/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-black/5 rounded-full text-ink/50 hover:text-ink transition-all hover:scale-105"
              title="Adicionar Texto"
            >
              <Type className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <AnimatePresence>
              {isFontPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-2 p-3 bg-white shadow-xl border border-black/5 rounded-2xl flex flex-col gap-2 origin-top-right whitespace-nowrap"
                >
                  <button 
                    onClick={() => { addDecoration('text', 'Escreva algo...'); setIsFontPickerOpen(false); }}
                    className="w-full text-left px-4 py-2 hover:bg-black/5 rounded-lg text-sm font-bold bg-black/5"
                  >
                    + Novo Texto
                  </button>
                  <div className="w-full h-px bg-black/5 my-1" />
                  {FONTS.map(font => (
                    <button
                      key={font.class}
                      onClick={() => { 
                        setCurrentFont(font.class);
                        if (editingDecorationId) {
                          updateDecoration(editingDecorationId, { fontFamily: font.class });
                        }
                        setIsFontPickerOpen(false);
                      }}
                      className={`text-left px-4 py-2 hover:bg-black/5 rounded-lg text-lg ${font.class} ${currentFont === font.class ? 'text-black' : 'text-black/50'}`}
                    >
                      {font.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => { setIsEmojiPickerOpen(!isEmojiPickerOpen); setIsFontPickerOpen(false); setIsThemePickerOpen(false); }}
              className="p-1.5 bg-white/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-black/5 rounded-full text-ink/50 hover:text-ink transition-all hover:scale-105"
              title="Adicionar Figuração/Emoji"
            >
              <Smile className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            <AnimatePresence>
              {isEmojiPickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-2 p-4 bg-white shadow-xl border border-black/5 rounded-2xl grid grid-cols-5 gap-2 origin-top-right"
                >
                  {EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => { addDecoration('emoji', emoji); setIsEmojiPickerOpen(false); }}
                      className="text-2xl w-10 h-10 flex items-center justify-center hover:scale-125 transition-transform hover:bg-black/5 rounded-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => { setIsThemePickerOpen(!isThemePickerOpen); setIsFontPickerOpen(false); setIsEmojiPickerOpen(false); }}
              className="p-1.5 bg-white/20 hover:bg-white/50 backdrop-blur-md shadow-sm border border-black/5 rounded-full text-ink/50 hover:text-ink transition-all hover:scale-105"
              title="Cores da página"
            >
              <Palette className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </button>
            
            <AnimatePresence>
              {isThemePickerOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full right-0 mt-2 p-4 bg-white shadow-xl border border-black/5 rounded-2xl flex gap-3 origin-top-right whitespace-nowrap"
                >
                  {[
                    { color: '#E5DFD5', name: 'Clássico' },
                    { color: '#D5DFE5', name: 'Azul Sereno' },
                    { color: '#E5D5DD', name: 'Rosa Vintage' },
                    { color: '#D5E5D8', name: 'Verde Sábio' },
                    { color: '#E5D5D5', name: 'Terracota' },
                    { color: '#DCDCDC', name: 'Cinza Gelo' },
                    { color: '#2C2A28', name: 'Escuro' },
                  ].map(theme => (
                    <button
                      key={theme.color}
                      onClick={() => { setAlbumTheme(openedEvent.id, theme.color); setIsThemePickerOpen(false); }}
                      className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 shrink-0"
                      style={{ 
                        backgroundColor: theme.color, 
                        borderColor: (albumThemes[openedEvent.id] || '#E5DFD5') === theme.color ? '#000' : 'transparent' 
                      }}
                      title={theme.name}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full flex-1 flex flex-col items-center justify-center z-10 relative overflow-hidden">
          
          <div className="absolute top-1/2 left-2 md:left-6 -translate-y-1/2 z-30">
            <button 
              onClick={() => setAlbumPageIndex(p => Math.max(0, p - 1))}
              disabled={albumPageIndex === 0}
              className="p-2 md:p-3 bg-white/30 backdrop-blur-md border border-black/5 shadow-sm rounded-full text-ink hover:bg-white hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute top-1/2 right-2 md:right-6 -translate-y-1/2 z-30">
            <button 
              onClick={() => setAlbumPageIndex(p => Math.min(Math.ceil(photos.length / 4) - 1, p + 1))}
              disabled={photos.length === 0 || albumPageIndex >= Math.ceil(photos.length / 4) - 1}
              className="p-2 md:p-3 bg-white/30 backdrop-blur-md border border-black/5 shadow-sm rounded-full text-ink hover:bg-white hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={albumPageIndex}
              initial={{ opacity: 0, rotateY: 90, scale: 0.98 }}
              animate={{ opacity: 1, rotateY: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -90, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
              style={{ perspective: 3000, transformOrigin: 'left center', backgroundColor: albumThemes[openedEvent.id] || '#F9F6F0' }}
              className="w-full h-full max-w-full flex items-stretch overflow-hidden relative"
            >
              <div 
                className="absolute inset-0 mix-blend-multiply opacity-[0.25] pointer-events-none z-0" 
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
              />
              
              {/* Dynamic Abstract Blobs to add life to background */}
              <div className="absolute top-[-5%] left-[-5%] w-[40%] h-[40%] bg-white/40 rounded-full blur-[80px] pointer-events-none z-0 mix-blend-overlay"></div>
              <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] bg-black/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
              
              {validAlbumPageIndex % 2 === 0 && (
                <div 
                  className="absolute inset-0 opacity-[0.04] pointer-events-none z-0" 
                  style={{ backgroundImage: `radial-gradient(circle at center, black 2px, transparent 2px)`, backgroundSize: '32px 32px' }} 
                />
              )}
              {validAlbumPageIndex % 2 !== 0 && (
                <div 
                  className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
                  style={{ backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, black 10px, black 11px)` }} 
                />
              )}

              {(() => {
                const renderPhoto = (currentPhoto: DriveFile, indexInPage: number, sideOffset: number = 0, totalOnPage: number = 1, isFullBleed: boolean = false) => {
                  const index = currentSpread.startIndex + indexInPage + sideOffset;
                  
                  if (isFullBleed) {
                    return (
                      <div 
                        key={currentPhoto.id}
                        className="absolute inset-0 w-full h-full z-0 overflow-hidden cursor-pointer group"
                        onClick={() => setLightboxData({ photos, index })}
                      >
                        <img 
                          src={currentPhoto.thumbnailLink?.replace("=s220", "=s1024") || currentPhoto.webContentLink} 
                          alt={currentPhoto.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        {favorites.includes(currentPhoto.id) && (
                          <div className="absolute top-4 right-4 z-20 text-red-500 drop-shadow-sm">
                            <Heart className="w-6 h-6 md:w-8 md:h-8" fill="currentColor" />
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Pseudo-random rotation between -3 and 3 degrees
                  const rotation = (index % 5 === 0 ? '-2.5deg' : index % 3 === 0 ? '3deg' : index % 2 === 0 ? '-1.5deg' : '2deg');
                  const marginTopClass = indexInPage % 2 !== 0 && totalOnPage > 1 ? 'md:mt-24 landscape:mt-8' : '';
                  
                  return (
                    <div 
                      key={currentPhoto.id}
                      className={`flex flex-col items-center justify-center relative group px-1 md:px-2 max-w-full mx-auto ${totalOnPage > 1 ? 'w-[88%] sm:w-[75%] md:w-[45%] landscape:w-[45%]' : 'w-[88%] sm:w-[80%] md:w-full landscape:w-full md:px-8 landscape:px-2'} ${marginTopClass}`}
                    >
                      <div 
                        className="bg-white p-2 md:p-3 pb-8 md:pb-10 shadow-[0_10px_25px_rgba(0,0,0,0.06)] border border-black/5 relative transform transition-all duration-400 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] cursor-pointer z-10 w-fit max-w-full"
                        onClick={() => setLightboxData({ photos, index })}
                        style={{ rotate: rotation }}
                      >
                        {/* Tape effect */}
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 md:w-16 h-3 md:h-5 bg-white/60 backdrop-blur-sm border border-black/5 shadow-sm opacity-90 mix-blend-overlay" style={{ rotate: index % 2 === 0 ? '-3deg' : '4deg' }}></div>
                        <div className="absolute -bottom-3 right-4 w-6 md:w-14 h-3 md:h-5 bg-white/50 backdrop-blur-sm border border-black/5 shadow-sm opacity-70 mix-blend-overlay" style={{ rotate: '-6deg' }}></div>
                        
                        {favorites.includes(currentPhoto.id) && (
                          <div className="absolute top-2 right-2 md:top-4 md:right-4 z-20 text-red-500 drop-shadow-sm">
                            <Heart className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />
                          </div>
                        )}
                        <img 
                          src={currentPhoto.thumbnailLink?.replace("=s220", "=s1024") || currentPhoto.webContentLink} 
                          alt={currentPhoto.name}
                          className="w-auto h-auto max-w-full max-h-[45vh] landscape:max-h-[65vh] md:landscape:max-h-[55vh] md:max-h-[55vh] object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Text and details written/pasted on the page below the photo */}
                      <div 
                        className="mt-6 w-full px-4 flex flex-col items-center z-20"
                        style={{ rotate: index % 2 === 0 ? '1.5deg' : '-2deg' }}
                      >
                        {currentPhoto.description && (
                          <p className="font-handwriting text-2xl md:text-3xl text-ink/80 leading-tight text-center mb-3 max-w-full overflow-hidden text-ellipsis whitespace-nowrap px-4">
                            {currentPhoto.description}
                          </p>
                        )}
                        
                        <div className="relative group-hover:opacity-100 flex items-center justify-center gap-2 transition-all duration-300">
                          {/* Date label looking like a small cut piece of paper */}
                          <div className="bg-[#f0ebe1] shadow-[0_2px_4px_rgba(0,0,0,0.05)] border border-black/[0.04] px-3 py-1 font-mono text-[9px] md:text-[10px] text-ink/70 uppercase tracking-widest flex items-center">
                            {format(new Date(currentPhoto.createdTime), "dd MMM, yyyy", { locale: ptBR })}
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewDateStr(currentPhoto.createdTime.split("T")[0]);
                              setEditingDate(true);
                              setLightboxData({ photos, index });
                            }} 
                            className="opacity-0 group-hover:opacity-100 p-2 bg-ink/5 hover:bg-ink/10 rounded-full transition-all duration-300"
                            title="Editar data"
                          >
                            <Calendar className="w-3 h-3 text-ink/60" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="flex w-full h-full relative font-serif">
                    
                    {/* LEFT PAGE (Desktop Only) */}
                    <div className="hidden md:flex landscape:flex flex-1 relative bg-transparent shadow-[inset_-10px_0_30px_rgba(0,0,0,0.04)] flex-col p-4 md:p-8 lg:p-16 z-10 w-1/2 justify-center">
                      {validAlbumPageIndex % 4 === 0 && (
                        <div className="absolute top-12 left-12 font-handwriting text-5xl text-black/20 -rotate-6 pointer-events-none z-10 drop-shadow-sm">
                          Memórias...
                        </div>
                      )}
                      {(validAlbumPageIndex % 3 === 1) && (
                        <div className="absolute bottom-1/4 left-1/4 w-32 h-10 bg-amber-500/10 rounded-full blur-[2px] -rotate-6 pointer-events-none mix-blend-multiply z-10"></div>
                      )}
                      {(validAlbumPageIndex % 5 === 2) && (
                        <div className="absolute top-1/3 left-10 w-24 h-24 border-4 border-sky-400/20 rounded-full pointer-events-none z-10 border-dashed"></div>
                      )}
                      
                      <div className="flex-1 flex flex-wrap items-center justify-center gap-4 lg:gap-8 w-full h-full relative z-20">
                        {currentSpread.leftPhotos.map((photo, i) => renderPhoto(photo, i, 0, currentSpread.leftPhotos.length, currentSpread.isLeftFullBleed))}
                        {currentSpread.leftPhotos.length === 0 && <div className="text-ink/20 italic font-serif">Página em branco</div>}
                      </div>

                      <div className="absolute left-8 bottom-8 text-[9px] font-mono text-ink/30 uppercase tracking-widest z-20">
                        Pág. {String(validAlbumPageIndex * 2 + 1).padStart(2, '0')}
                      </div>
                    </div>

                    {/* CENTER SPINE CREASE */}
                    <div className="w-8 md:w-16 shrink-0 bg-gradient-to-r from-black/[0.08] via-black/[0.03] to-transparent border-r border-black/[0.06] shadow-[inset_-2px_0_15px_rgba(0,0,0,0.04)] z-20 pointer-events-none"></div>

                    {/* RIGHT PAGE */}
                    <div className="flex-1 relative bg-transparent shadow-[inset_10px_0_30px_rgba(0,0,0,0.03)] flex-col p-4 md:p-8 lg:p-16 z-10 w-full md:w-1/2 landscape:w-1/2 justify-center overflow-y-auto landscape:overflow-y-visible no-scrollbar md:overflow-visible">
                      {validAlbumPageIndex % 4 === 1 && (
                        <div className="absolute bottom-12 right-24 font-serif italic text-3xl text-black/20 -rotate-3 pointer-events-none z-10 drop-shadow-sm">
                          Um dia para recordar
                        </div>
                      )}
                      {validAlbumPageIndex % 4 === 2 && (
                        <div className="absolute top-16 right-12 font-handwriting text-4xl text-black/20 rotate-6 pointer-events-none z-10 drop-shadow-sm">
                          Detalhes Perfeitos
                        </div>
                      )}
                      {(validAlbumPageIndex % 5 === 0) && (
                        <div className="absolute top-1/4 right-32 text-6xl opacity-[0.15] rotate-12 pointer-events-none z-10 drop-shadow-md">✨</div>
                      )}
                      {(validAlbumPageIndex % 3 === 2) && (
                        <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-rose-500/10 rounded-full blur-[2px] rotate-12 pointer-events-none mix-blend-multiply z-10"></div>
                      )}
                      {(validAlbumPageIndex % 4 === 3) && (
                        <div className="absolute bottom-1/3 right-10 w-20 h-20 border-[6px] border-emerald-400/20 rounded-full pointer-events-none z-10 border-dotted"></div>
                      )}

                      <div className="flex-1 flex flex-wrap items-center justify-center gap-6 lg:gap-10 w-full h-full relative z-20">
                        {/* On mobile, we render ALL photos from the page here, otherwise just the right ones */}
                        <div className="flex md:hidden landscape:hidden flex-col items-center justify-center gap-12 w-full py-8">
                          {[...currentSpread.leftPhotos, ...currentSpread.rightPhotos].map((photo, i) => renderPhoto(photo, i, 0, currentSpread.leftPhotos.length + currentSpread.rightPhotos.length, false))}
                        </div>
                        <div className="hidden md:flex landscape:flex flex-wrap items-center justify-center gap-4 lg:gap-8 w-full h-full relative">
                           {currentSpread.rightPhotos.map((photo, i) => renderPhoto(photo, i, currentSpread.leftPhotos.length, currentSpread.rightPhotos.length, currentSpread.isRightFullBleed))}
                           {currentSpread.rightPhotos.length === 0 && currentSpread.leftPhotos.length > 0 && <div className="text-ink/20 italic font-serif">Página em branco</div>}
                        </div>
                      </div>

                      <div className="absolute right-6 md:right-8 bottom-6 md:bottom-8 text-[9px] font-mono text-ink/30 uppercase tracking-widest z-20">
                        Pág. {String(validAlbumPageIndex * 2 + 2).padStart(2, '0')}
                      </div>
                    </div>
                    
                    {/* DECORATIONS LAYER */}
                    <div className="absolute inset-0 z-50 pointer-events-none overflow-hidden">
                      {(decorations[`${openedEvent.id}-p${albumPageIndex}`] || []).map(deco => (
                        <motion.div
                          key={deco.id}
                          drag
                          dragMomentum={false}
                          onDragEnd={(e, info) => {
                            updateDecoration(deco.id, { x: deco.x + info.offset.x, y: deco.y + info.offset.y });
                          }}
                          initial={{ x: deco.x, y: deco.y, rotate: deco.rotation, scale: deco.scale }}
                          className="absolute pointer-events-auto cursor-grab active:cursor-grabbing group"
                          style={{
                            left: '50%', top: '50%',
                            x: deco.x, y: deco.y, rotate: deco.rotation, scale: deco.scale
                          }}
                        >
                          {deco.type === 'text' ? (
                            <div className="relative">
                              {editingDecorationId === deco.id ? (
                                <input
                                  autoFocus
                                  defaultValue={deco.content}
                                  onBlur={(e) => {
                                    setEditingDecorationId(null);
                                    if (!e.target.value.trim()) removeDecoration(deco.id);
                                    else updateDecoration(deco.id, { content: e.target.value });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingDecorationId(null);
                                      if (!e.currentTarget.value.trim()) removeDecoration(deco.id);
                                      else updateDecoration(deco.id, { content: e.currentTarget.value });
                                    }
                                  }}
                                  className={`${deco.fontFamily || 'font-handwriting'} text-2xl md:text-4xl text-ink/80 bg-transparent border-none outline-none text-center min-w-[200px]`}
                                />
                              ) : (
                                <div 
                                  className={`${deco.fontFamily || 'font-handwriting'} text-2xl md:text-4xl text-ink/80 text-center px-4`}
                                  onClick={() => setEditingDecorationId(deco.id)}
                                >
                                  {deco.content}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-4xl md:text-6xl filter drop-shadow-sm flex items-center justify-center">
                              {deco.content}
                            </div>
                          )}

                          {/* Delete Button (visible on hover) */}
                          <button
                            onClick={(e) => { e.stopPropagation(); removeDecoration(deco.id); }}
                            className="absolute -top-3 -right-3 p-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-black/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            title="Remover"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </motion.div>
                      ))}
                    </div>

                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>

        </div>

        {/* Edit Date Modal for individual photo inside event */}
        {editingDate && lightboxData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-paper p-8 rounded border border-ink/10 max-w-sm w-full shadow-2xl">
              <h3 className="font-serif text-2xl mb-4 text-ink">Editar Data da Foto</h3>
              <input 
                type="date" 
                value={newDateStr}
                onChange={(e) => setNewDateStr(e.target.value)}
                className="w-full bg-transparent border-b border-ink/20 px-2 py-2 text-sm font-sans text-ink focus:outline-none mb-6"
              />
              <div className="flex gap-4 justify-end">
                <button onClick={() => { setEditingDate(false); setLightboxData(null); }} className="text-xs uppercase font-bold tracking-widest text-ink-light hover:text-ink">Cancelar</button>
                <button onClick={() => { handleSaveDate(photos[lightboxData.index].id); setLightboxData(null); }} className="text-xs uppercase font-bold tracking-widest text-ink hover:text-terracotta transition-colors">Salvar</button>
              </div>
            </div>
          </div>
        )}

        {lightboxData && !editingDate && (
          <Lightbox 
            photos={lightboxData.photos}
            initialIndex={lightboxData.index}
            onClose={() => setLightboxData(null)}
            eventId={openedEvent.id}
            isFavorite={(id) => favorites.includes(id)}
            onToggleFavorite={toggleFavorite}
            isCover={(id) => isAlbumView ? false : coverPhotos[openedEvent.id] === id}
            onSetCover={(id) => {
              if (isAlbumView && onSetChapterCover) {
                const photo = lightboxData.photos.find(p => p.id === id);
                if (photo) {
                  const url = photo.thumbnailLink?.replace("=s220", "=s800") || photo.webContentLink || "";
                  onSetChapterCover(url);
                  alert("Capa atualizada com sucesso!");
                }
              } else {
                setCover(openedEvent.id, id);
              }
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full overflow-y-auto bg-paper h-full relative">
      <div className="flex-1 max-w-4xl mx-auto flex flex-col py-24 px-6 md:px-12">
        {filteredEvents.length === 0 && (
          <div className="text-center py-20 text-[10px] font-sans uppercase tracking-[0.2em] font-semibold opacity-50 text-ink-light">
            Nenhum evento encontrado para "{searchQuery}".
          </div>
        )}

        <div className="relative border-l border-ink/20 pl-8 md:pl-16 ml-4 md:ml-8 space-y-24 pb-32">
          {filteredEvents.map((event, i) => {
            const coverPhotoId = coverPhotos[event.id];
            const coverPhoto = event.photos.find(p => p.id === coverPhotoId) || event.photos[0];
            return (
              <motion.div 
                key={event.id} 
                className="relative group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="absolute -left-[36.5px] md:-left-[68.5px] top-8 flex items-center justify-center">
                  <div className="w-[9px] h-[9px] bg-paper border-2 border-ink rounded-full group-hover:bg-terracotta transition-colors shadow-[0_0_0_6px_var(--color-paper)]" />
                </div>
                
                <div 
                  className="flex flex-col md:flex-row gap-8 lg:gap-16 cursor-pointer group-hover:-translate-y-2 transition-transform duration-500"
                  onClick={() => {
                    setOpenedEvent(event);
                    setAlbumPageIndex(0);
                  }}
                >
                  <div className="md:w-64 pt-6 shrink-0">
                    <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink-light mb-4">
                      <Clock className="w-3 h-3" />
                      {format(event.startDate, "yyyy")}
                    </div>
                    
                    <h3 className="text-3xl font-serif text-ink tracking-tight mb-2 leading-tight uppercase">
                      {event.title !== "Untitled Cluster" ? event.title : "Capítulo de " + format(event.startDate, "MMMM", { locale: ptBR })}
                    </h3>
                    
                    <p className="text-xs font-sans text-ink-light italic mb-8 capitalize flex items-center gap-2 group-hover:text-ink transition-colors">
                      {format(event.startDate, "MMMM", { locale: ptBR })}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newD = prompt("Digite a nova data para este capítulo (AAAA-MM-DD):", format(event.startDate, "yyyy-MM-dd"));
                          if (newD && onRefreshEvents) {
                            try {
                              const iso = new Date(newD).toISOString();
                              // Apply this date to all photos in this event to keep them clustered
                              event.photos.forEach(p => {
                                import("../lib/events").then(({ saveCustomDate }) => {
                                  saveCustomDate(p.id, iso);
                                });
                              });
                              setTimeout(() => onRefreshEvents(), 100);
                            } catch(err) {
                              alert("Data inválida. Use o formato AAAA-MM-DD.");
                            }
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-black/5 rounded-full transition-all"
                        title="Editar data do capítulo"
                      >
                        <Calendar className="w-3 h-3" />
                      </button>
                    </p>
                    
                    <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink-light bg-ink/5 px-4 py-2 w-max rounded-full">
                      <BookOpen className="w-3 h-3" />
                      {event.photos.length} Momentos
                    </div>
                  </div>

                  <div className="flex-1 relative aspect-[4/3] bg-paper-dark border-8 md:border-[12px] border-white shadow-md transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
                    {coverPhoto && (
                      <img 
                        src={coverPhoto.thumbnailLink?.replace("=s220", "=s800")} 
                        alt=""
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
