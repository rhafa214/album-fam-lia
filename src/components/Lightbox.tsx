import React, { useState, useEffect } from "react";
import { DriveFile } from "../lib/drive";
import { X, ChevronLeft, ChevronRight, Download, Heart, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Lightbox({
  photos,
  initialIndex,
  onClose,
  eventId,
  isFavorite,
  onToggleFavorite,
  isCover,
  onSetCover,
}: {
  photos: DriveFile[];
  initialIndex: number;
  onClose: () => void;
  eventId?: string;
  isFavorite?: (photoId: string) => boolean;
  onToggleFavorite?: (photoId: string) => void;
  isCover?: (photoId: string) => boolean;
  onSetCover?: (photoId: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const currentPhoto = photos[currentIndex];

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#F8F5F0]/60 backdrop-blur-md flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      <div className="absolute top-6 right-6 z-50 flex items-center gap-2">
        {onToggleFavorite && (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(currentPhoto.id); }}
            className={`p-4 transition-colors cursor-pointer ${isFavorite?.(currentPhoto.id) ? 'text-red-500' : 'text-ink/50 hover:text-ink'}`}
            title="Favoritar"
          >
            <Heart className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} fill={isFavorite?.(currentPhoto.id) ? "currentColor" : "none"} />
          </button>
        )}
        {onSetCover && (
          <button 
            onClick={(e) => { e.stopPropagation(); onSetCover(currentPhoto.id); }}
            className={`p-4 transition-colors cursor-pointer ${isCover?.(currentPhoto.id) ? 'text-blue-500' : 'text-ink/50 hover:text-ink'}`}
            title="Definir como capa do álbum"
          >
            <ImageIcon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
          </button>
        )}
        {currentPhoto.webContentLink && (
          <a
            href={currentPhoto.webContentLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-4 hover:text-ink transition-colors text-ink/50 cursor-pointer inline-block"
            title="Baixar imagem"
          >
            <Download className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
          </a>
        )}
        <button 
          onClick={onClose}
          className="p-4 hover:text-ink transition-colors text-ink/50 cursor-pointer"
          title="Fechar"
        >
          <X className="w-8 h-8" strokeWidth={1.5} />
        </button>
      </div>

      <div className="absolute top-8 left-8 text-xs font-sans font-bold uppercase tracking-widest text-ink/40">
        {currentIndex + 1} / {photos.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white p-4 md:p-6 pb-16 shadow-[0_30px_80px_rgba(0,0,0,0.15)] border border-black/5 transform rotate-[-1deg]">
            <img 
              src={currentPhoto.thumbnailLink?.replace("=s220", "=s2048") || currentPhoto.webContentLink} 
              alt={currentPhoto.name}
              className="max-h-[70vh] max-w-full object-contain cursor-default"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-0 right-0 text-center px-12 opacity-80 text-ink">
              <p className="font-handwriting text-2xl">
                {currentPhoto.description || ""}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 text-ink/50"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handlePrev} className="p-4 hover:text-ink transition-colors cursor-pointer">
            <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
          </button>
          <button onClick={handleNext} className="p-4 hover:text-ink transition-colors cursor-pointer">
            <ChevronRight className="w-8 h-8" strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
