"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { InfoIcon } from "lucide-react";

interface LyricsDisplayProps {
  lyrics: { time: number; text: string }[];
  currentLyricIndex: number;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  currentSource?: string;
}

export default function LyricsDisplay({ 
  lyrics, 
  currentLyricIndex, 
  currentTime,
  setCurrentTime,
  currentSource = ""
}: LyricsDisplayProps) {
  const lyricsRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUserScrollingRef = useRef(false);
  
  useEffect(() => {
    if (isUserScrollingRef.current || !lyricsRef.current || currentLyricIndex < 0) return;
    
    const lyricElement = lyricsRef.current.querySelector(
      `[data-lyric-index="${currentLyricIndex}"]`
    ) as HTMLElement;
    
    if (lyricElement) {
      lyricElement.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }, [currentLyricIndex]);

  const handleScroll = () => {
    isUserScrollingRef.current = true;
    
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 2000);
  };
  
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);
  
  const handleLyricClick = (time: number) => {
    setCurrentTime(time);
  };
  
  const getNoLyricsMessage = () => {
    const messages = [
      "Why do some songs have lyrics and others just have 'WOO!'s and 'YEAH!'s? It's like they're trying to confuse me on purpose",
      "I've got a master's degree in searching for lyrics, but somehow I still can't find this one...",
      "I've checked every website, app, and meme page... but it seems even Google can't find those lyrics for me...",
      "I've scrolled through so many tabs that I think my browser has started to auto-complete lyrics for me...",
      "I'm trying to 'Run the World' but it's hard when I can't even get the lyrics right...",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (lyrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <p className="text-xl text-center opacity-70 px-8">
          {getNoLyricsMessage()}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {currentSource && (
        <div className="flex items-center justify-center gap-1 mb-3 text-xs text-white/60 px-8">
          <InfoIcon size={12} />
          <span>{currentSource}</span>
        </div>
      )}
      
      <div 
        ref={lyricsRef}
        className="flex-1 mb-32 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="p-8">
          {lyrics.map((line, index) => (
            <p
              key={index}
              data-lyric-index={index}
              onClick={() => handleLyricClick(line.time)}
              className={`
                text-3xl
                text-center
                transition-opacity
                duration-300
                cursor-pointer
                text-white
                py-1
                ${index === currentLyricIndex ? "opacity-100 font-bold" : "opacity-50 font-normal"}
              `}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}