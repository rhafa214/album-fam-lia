import React, { useState, useEffect } from "react";
import { DriveFile } from "../lib/drive";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Lightbox({
  photos,
  initialIndex,
  onClose
}: {
  photos: DriveFile[];
  initialIndex: number;
  onClose: () => void;
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
      className="fixed inset-0 z-[100] bg-paper-dark/90 backdrop-blur-xl flex items-center justify-center cursor-pointer"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-4 hover:text-ink transition-colors text-ink-light cursor-pointer"
      >
        <X className="w-8 h-8" strokeWidth={1} />
      </button>

      <div className="absolute top-8 left-8 text-xs font-sans font-bold uppercase tracking-widest text-ink/40">
        {currentIndex + 1} / {photos.length}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98, rotate: Math.random() * 2 - 1 }}
          animate={{ opacity: 1, scale: 1, rotate: Math.random() * 1 - 0.5 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-[90vw] max-h-[85vh] w-full h-full flex items-center justify-center p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white p-4 md:p-6 pb-16 shadow-2xl border border-black/5 inline-block">
            <img 
              src={currentPhoto.thumbnailLink?.replace("=s220", "=s2048") || currentPhoto.webContentLink} 
              alt={currentPhoto.name}
              className="max-h-[65vh] max-w-full object-contain cursor-default"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-0 right-0 text-center px-12 opacity-80 text-ink">
              <p className="font-handwriting text-2xl">
                {currentPhoto.name.replace(/\.[^/.]+$/, "")}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {photos.length > 1 && (
        <div 
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-12 text-ink-light"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handlePrev} className="p-4 hover:text-ink transition-colors cursor-pointer">
            <ChevronLeft className="w-8 h-8" strokeWidth={1} />
          </button>
          <button onClick={handleNext} className="p-4 hover:text-ink transition-colors cursor-pointer">
            <ChevronRight className="w-8 h-8" strokeWidth={1} />
          </button>
        </div>
      )}
    </div>
  );
}
