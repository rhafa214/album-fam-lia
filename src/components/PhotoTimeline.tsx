import React, { useState } from "react";
import { PhotoEvent } from "../lib/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, ArrowRight, BookOpen, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbox } from "./Lightbox";
import { DriveFile } from "../lib/drive";

export function PhotoTimeline({ 
  events, 
  searchQuery 
}: { 
  events: PhotoEvent[], 
  searchQuery: string 
}) {
  const [openedEvent, setOpenedEvent] = useState<PhotoEvent | null>(null);
  const [albumPageIndex, setAlbumPageIndex] = useState(0);
  const [lightboxData, setLightboxData] = useState<{ photos: DriveFile[], index: number } | null>(null);

  const filteredEvents = events.filter(e => {
    if (!searchQuery) return true;
    const title = e.title?.toLowerCase() || "";
    const dateStr = format(e.endDate, "MMMM yyyy", { locale: ptBR }).toLowerCase();
    return title.includes(searchQuery.toLowerCase()) || dateStr.includes(searchQuery.toLowerCase());
  });

  if (openedEvent) {
    const photos = openedEvent.photos;
    const currentPhoto = photos[albumPageIndex];

    return (
      <div className="w-full flex-1 flex flex-col items-center bg-paper relative py-6 md:py-12">
        <div className="w-full h-16 px-6 sm:px-12 flex items-center justify-between z-10">
          <button 
            onClick={() => {
              setOpenedEvent(null);
              setAlbumPageIndex(0);
            }}
            className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-widest text-ink-light hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/40 text-center flex-1 mx-4 truncate">
            {openedEvent.title}
          </div>
          <div className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/40 w-[80px] text-right">
            Capítulo
          </div>
        </div>

        <div className="flex-1 w-full max-w-6xl px-4 sm:px-12 flex flex-col justify-center items-center relative">
          
          <AnimatePresence mode="wait">
            <motion.div 
              key={albumPageIndex}
              initial={{ opacity: 0, x: 20, rotateY: -10 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={{ opacity: 0, x: -20, rotateY: 10 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{ perspective: 1500 }}
              className="w-full flex-1 relative flex flex-col items-center justify-center p-8 max-h-[75vh]"
            >
              <div 
                className="bg-white p-4 md:p-6 pb-16 md:pb-24 shadow-2xl border border-black/5 relative transform transition-transform hover:scale-[1.01] cursor-pointer"
                onClick={() => setLightboxData({ photos: openedEvent.photos, index: albumPageIndex })}
                style={{ rotate: `${(albumPageIndex % 3 === 0 ? '-1deg' : albumPageIndex % 2 === 0 ? '1.5deg' : '-0.5deg')}` }}
              >
                <img 
                  src={currentPhoto.thumbnailLink?.replace("=s220", "=s1024") || currentPhoto.webContentLink} 
                  alt={currentPhoto.name}
                  className="max-w-full max-h-[55vh] object-contain pointer-events-none"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
                
                <div className="absolute bottom-6 md:bottom-10 left-0 right-0 text-center px-12">
                  <p className="font-handwriting text-2xl md:text-3xl text-ink/80 leading-relaxed max-w-xl mx-auto">
                    {/* fallback para legenda da foto */}
                    {currentPhoto.name.replace(/\.[^/.]+$/, "")}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 left-0 right-0 px-8 md:px-16 flex items-center justify-between text-ink-light text-[10px] font-sans font-bold uppercase tracking-widest">
            <button 
              onClick={() => setAlbumPageIndex(p => Math.max(0, p - 1))}
              disabled={albumPageIndex === 0}
              className="p-4 hover:text-ink transition-colors disabled:opacity-20 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
            
            <span className="opacity-60">Página {String(albumPageIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>

            <button 
              onClick={() => setAlbumPageIndex(p => Math.min(photos.length - 1, p + 1))}
              disabled={albumPageIndex === photos.length - 1}
              className="p-4 hover:text-ink transition-colors disabled:opacity-20 flex items-center gap-2"
            >
              Próxima
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {lightboxData && (
          <Lightbox 
            photos={lightboxData.photos}
            initialIndex={lightboxData.index}
            onClose={() => setLightboxData(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full overflow-y-auto bg-paper">
      <div className="flex-1 max-w-4xl mx-auto flex flex-col py-24 px-6 md:px-12">
        {filteredEvents.length === 0 && (
          <div className="text-center py-20 text-[10px] font-sans uppercase tracking-[0.2em] font-semibold opacity-50 text-ink-light">
            Nenhum evento encontrado para "{searchQuery}".
          </div>
        )}

        <div className="relative border-l border-ink/10 pl-8 md:pl-16 ml-4 md:ml-8 space-y-24 pb-32">
          {filteredEvents.map((event, i) => {
            const coverPhoto = event.photos[0];
            return (
              <div key={event.id} className="relative group">
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
                    
                    <h3 className="text-3xl font-serif text-ink tracking-tight mb-2 leading-tight">
                      {event.title !== "Untitled Cluster" ? event.title : "Capítulo de " + format(event.startDate, "MMMM", { locale: ptBR })}
                    </h3>
                    
                    <p className="text-xs font-sans text-ink-light italic mb-8 capitalize">
                      {format(event.startDate, "MMMM", { locale: ptBR })}
                    </p>
                    
                    <div className="flex items-center gap-2 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-ink-light bg-ink/5 px-4 py-2 w-max rounded-full">
                      <BookOpen className="w-3 h-3" />
                      {event.photos.length} Registros
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
