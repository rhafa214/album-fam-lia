import React, { useState, useEffect } from 'react';
import { PhotoEvent } from '../lib/types';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Boa madrugada 🌙";
  if (hour < 12) return "Bom dia ☀️";
  if (hour < 18) return "Boa tarde ☁️";
  return "Boa noite 🌌";
}

export function HomeView({ 
  events,
  onOpenEvent,
  onOpenTimeline
}: {
  events: PhotoEvent[];
  onOpenEvent: (e: PhotoEvent) => void;
  onOpenTimeline: () => void;
}) {
  const totalMoments = events.reduce((acc, evt) => acc + evt.photos.length, 0);
  
  // oldest event year
  const oldestEvent = events.length > 0 ? events[events.length - 1] : null;
  const startYear = oldestEvent ? format(oldestEvent.startDate, "yyyy") : new Date().getFullYear();

  const lastEvent = events[0];

  // Slideshow photos
  const slidePhotos = events.flatMap(e => e.photos).slice(0, 5); // Take up to 5 photos from recent events
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (slidePhotos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex(prev => (prev + 1) % slidePhotos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [slidePhotos.length]);

  return (
    <div className="w-full flex-1 flex flex-col items-center bg-paper py-12 md:py-24 px-6 md:px-12 overflow-y-auto">
      <div className="w-full max-w-5xl flex flex-col gap-24">
        
        {/* HERO */}
        <section className="flex flex-col md:flex-row gap-12 items-center justify-between">
          <div className="flex-1 space-y-8">
            <div className="space-y-2">
              <h1 className="text-5xl md:text-7xl font-serif text-ink tracking-tight leading-tight">
                {getGreeting()}<br/>
                <span className="italic">Sua história continua aqui.</span>
              </h1>
              <p className="text-sm font-sans tracking-[0.2em] uppercase font-semibold text-ink-light pt-4">
                {totalMoments} memórias desde {startYear}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => lastEvent && onOpenEvent(lastEvent)}
                disabled={!lastEvent}
                className="px-8 py-4 bg-ink text-paper text-xs font-sans font-bold uppercase tracking-widest hover:bg-ink/80 transition-colors disabled:opacity-50"
              >
                Abrir último capítulo
              </button>
              <button 
                onClick={onOpenTimeline}
                className="px-8 py-4 border border-ink text-ink text-xs font-sans font-bold uppercase tracking-widest hover:bg-ink/5 transition-colors"
              >
                Explorar linha do tempo
              </button>
            </div>
          </div>

          {slidePhotos.length > 0 && (
            <div className="w-full md:w-[400px] aspect-[4/5] relative bg-paper-dark border-[16px] border-white shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 cursor-pointer overflow-hidden" onClick={() => lastEvent && onOpenEvent(lastEvent)}>
              <AnimatePresence>
                <motion.img 
                  key={currentSlideIndex}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1 }}
                  src={slidePhotos[currentSlideIndex].thumbnailLink?.replace("=s220", "=s800") || slidePhotos[currentSlideIndex].webContentLink} 
                  alt="" 
                  className="w-full h-full object-cover pointer-events-none absolute inset-0"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* CONTINUAR VENDO */}
        {lastEvent && (
          <section className="w-full">
            <p className="text-xs font-sans tracking-[0.2em] uppercase font-semibold text-ink-light mb-8">Continuar Vendo</p>
            
            <div 
              onClick={() => onOpenEvent(lastEvent)}
              className="w-full border-t border-b border-ink/10 py-12 flex flex-col md:flex-row items-center gap-8 cursor-pointer group hover:bg-ink/5 transition-colors"
            >
              {lastEvent.photos[0] && (
                <div className="w-48 aspect-video bg-paper-dark overflow-hidden shrink-0">
                  <img 
                    src={lastEvent.photos[0].thumbnailLink?.replace("=s220", "=s800") || lastEvent.photos[0].webContentLink} 
                    alt="" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              
              <div className="flex-1 flex flex-col items-start gap-2">
                <h3 className="text-2xl font-serif text-ink tracking-tight uppercase group-hover:text-terracotta transition-colors">
                  {lastEvent.title !== "Untitled Cluster" ? lastEvent.title : "Capítulo de " + format(lastEvent.startDate, "MMMM", { locale: ptBR })}
                </h3>
                <div className="flex items-center gap-4 text-xs font-sans text-ink-light">
                  <span className="opacity-70">Última visita: recentemente</span>
                  <span className="opacity-40">•</span>
                  <span className="opacity-70">{lastEvent.photos.length} momentos</span>
                </div>
              </div>

              <div className="text-xs font-sans font-bold uppercase tracking-widest text-ink group-hover:tracking-[0.3em] transition-all">
                [ continuar ]
              </div>
            </div>
          </section>
        )}

        {/* MEMÓRIAS RECENTES */}
        {events.length > 1 && (
          <section className="w-full">
            <p className="text-xs font-sans tracking-[0.2em] uppercase font-semibold text-ink-light mb-8">Memórias Recentes</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
              {events.slice(1, 4).map((evt, i) => (
                <div 
                  key={evt.id} 
                  className="flex flex-col gap-4 cursor-pointer group"
                  onClick={() => onOpenEvent(evt)}
                  style={{ transform: `translateY(${i % 2 === 1 ? '32px' : '0px'})` }}
                >
                  <div className={`w-full ${i === 0 ? 'aspect-square' : i === 1 ? 'aspect-[4/5]' : 'aspect-[5/4]'} bg-paper-dark border-8 border-white shadow-sm group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-500`}>
                    {evt.photos[0] && (
                      <img 
                        src={evt.photos[0].thumbnailLink?.replace("=s220", "=s800") || evt.photos[0].webContentLink} 
                        alt="" 
                        className="w-full h-full object-cover pointer-events-none"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-2">
                    <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-ink/40">
                      {format(evt.startDate, "yyyy")}
                    </span>
                    <h4 className="text-xl font-serif text-ink tracking-tight uppercase group-hover:text-terracotta transition-colors">
                      {evt.title !== "Untitled Cluster" ? evt.title : "Capítulo de " + format(evt.startDate, "MMMM", { locale: ptBR })}
                    </h4>
                    <div className="flex justify-between items-center text-xs font-sans text-ink-light">
                      <span>{evt.photos.length} momentos</span>
                      <span className="opacity-50">Há {Math.max(1, differenceInDays(new Date(), evt.startDate))} dias</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
