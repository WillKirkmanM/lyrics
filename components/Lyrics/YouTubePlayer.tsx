"use client";

import { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  className?: string;
}

export default function YouTubePlayer({
  videoId,
  isPlaying,
  currentTime,
  setIsPlaying,
  setCurrentTime,
  setDuration,
  className = ""
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const timeUpdateRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const playerReadyRef = useRef<boolean>(false);
  
  const onReady = (event: any) => {
    playerRef.current = event.target;
    playerReadyRef.current = true;
    setDuration(playerRef.current.getDuration());
    
    if (!timeUpdateRef.current) {
      const updateTime = () => {
        if (playerRef.current && !isSeekingRef.current) {
          const playerTime = playerRef.current.getCurrentTime();
          if (Math.abs(playerTime - prevTimeRef.current) > 0.01) {
            prevTimeRef.current = playerTime;
            setCurrentTime(playerTime);
          }
        }
        timeUpdateRef.current = requestAnimationFrame(updateTime);
      };
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    }
  };
  
  const onStateChange = (event: any) => {
    switch(event.data) {
      case 1:
        setIsPlaying(true);
        break;
      case 0:
      case 2:
        setIsPlaying(false);
        break;
    }
  };
  
  useEffect(() => {
    if (!playerRef.current || !playerReadyRef.current) return;
    
    if (isPlaying) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }, [isPlaying]);
  
  useEffect(() => {
    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
    };
  }, []);
  
  useEffect(() => {
    if (!playerRef.current || !playerReadyRef.current) return;
    
    if (Math.abs(currentTime - prevTimeRef.current) < 0.5) {
      return;
    }
    
    const handleSeek = () => {
      try {
        isSeekingRef.current = true;
        playerRef.current.seekTo(currentTime);
        prevTimeRef.current = currentTime;
        
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 500);
      } catch (error) {
        console.error("Error seeking:", error);
        isSeekingRef.current = false;
      }
    };
    
    handleSeek();
  }, [currentTime]);

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <YouTube
        videoId={videoId}
        className="w-full h-full"
        opts={{
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            enablejsapi: 1,
            origin: window.location.origin
          },
        }}
        onReady={onReady}
        onStateChange={onStateChange}
        onError={(error) => console.error("YouTube player error:", error)}
      />
    </div>
  );
}
