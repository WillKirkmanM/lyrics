"use client";

import { useEffect, useRef, useState } from 'react';
import { Octagon } from 'lucide-react';

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            modestbranding?: number;
            rel?: number;
            origin?: string;
            [key: string]: any;
          };
          events?: {
            onReady?: (event: any) => void;
            onStateChange?: (event: any) => void;
            onError?: (event: any) => void;
            [key: string]: any;
          };
        }
      ) => any;
      PlayerState?: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

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
  const timeUpdateRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);
  const [playbackError, setPlaybackError] = useState(false);
  const playerRef = useRef<any>(null);

  const onPlayerReady = (event: any) => {
    const player = event.target;
    playerRef.current = player;
    setDuration(player.getDuration());

    if (!timeUpdateRef.current) {
      const updateTime = () => {
        if (playerRef.current && !isSeekingRef.current) {
          try {
            const playerTime = playerRef.current.getCurrentTime();
            if (Math.abs(playerTime - prevTimeRef.current) > 0.01) {
              prevTimeRef.current = playerTime;
              setCurrentTime(playerTime);
            }
          } catch (error) {
            console.error("Error getting current time:", error);
          }
        }
        timeUpdateRef.current = requestAnimationFrame(updateTime);
      };
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    }
  };

  const onPlayerStateChange = (event: any) => {
    switch (event.data) {
      case 1:
        setIsPlaying(true);
        break;
      case 0:
      case 2:
        setIsPlaying(false);
        break;
    }
  };

  const onPlayerError = (error: any) => {
    console.error("YouTube player error:", error);
    setPlaybackError(true);
  };

  useEffect(() => {
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }
  }, []);

  useEffect(() => {
    const container = document.getElementById('youtube-player-container');
    if (container) {
      container.innerHTML = '';
    }

    const initializePlayer = () => {
      try {
        if (typeof window.YT !== 'undefined' && window.YT && window.YT.Player) {
          playerRef.current = new window.YT.Player('youtube-player-container', {
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              modestbranding: 1,
              rel: 0,
              origin: window.location.origin,
              host: 'https://www.youtube-nocookie.com',
              nocookie: 1
            },
            events: {
              onReady: onPlayerReady,
              onStateChange: onPlayerStateChange,
              onError: onPlayerError
            }
          });
        } else {
          window.onYouTubeIframeAPIReady = initializePlayer;
        }
      } catch (error) {
        console.error("Error initializing YouTube player:", error);
        setPlaybackError(true);
      }
    };

    initializePlayer();

    return () => {
      try {
        if (playerRef.current && typeof playerRef.current.destroy === 'function') {
          playerRef.current.destroy();
        }
      } catch (error) {
        console.error("Error destroying player:", error);
      }
    };
  }, [videoId]);

  useEffect(() => {
    return () => {
      if (timeUpdateRef.current) {
        cancelAnimationFrame(timeUpdateRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (error) {
      console.error("Error controlling playback:", error);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!playerRef.current) return;
    
    if (Math.abs(currentTime - prevTimeRef.current) < 0.5) {
      return;
    }

    try {
      isSeekingRef.current = true;
      playerRef.current.seekTo(currentTime, true);
      prevTimeRef.current = currentTime;

      setTimeout(() => {
        isSeekingRef.current = false;
      }, 500);
    } catch (error) {
      console.error("Error seeking:", error);
      isSeekingRef.current = false;
    }
  }, [currentTime]);

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      {playbackError ? (
        <div className="w-full h-full bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center">
          <div className="mb-4 text-red-400">
            <Octagon size={32} />
          </div>
          <h3 className="text-lg font-medium mb-2">Video Unavailable</h3>
          <p className="opacity-70 text-sm">
            This video contains content that cannot be played on this domain due to rights restrictions.
          </p>
        </div>
      ) : (
        <div id="youtube-player-container" className="w-full h-full"></div>
      )}
    </div>
  );
}