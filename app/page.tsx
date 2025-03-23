"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Music, Mic, Youtube, ChevronDown, ChevronUp, Pause, Play, SkipForward } from "lucide-react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { FastAverageColor } from "fast-average-color";
import LyricsDisplay from "@/components/Lyrics/LyricsDisplay";
import YouTubePlayer from "@/components/Lyrics/YouTubePlayer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoId, setVideoId] = useState("");
  const [showLyrics, setShowLyrics] = useState(true);
  const [lyrics, setLyrics] = useState<{ time: number; text: string }[]>([]);
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [songInfo, setSongInfo] = useState({ title: "", artist: "", albumArt: "" });
  const [backgroundColor, setBackgroundColor] = useState("rgba(0,0,0,0.9)");
  const [textColor, setTextColor] = useState("rgba(255,255,255,0.9)");
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [similarSongs, setSimilarSongs] = useState<any[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [lyricsOptions, setLyricsOptions] = useState<Array<{
    id: number;
    source: string;
    artist: string;
    title: string;
    lyrics: { time: number; text: string }[];
  }>>([]);
  const [activeLyricsId, setActiveLyricsId] = useState<number>(0);
  const [isLyricsDialogOpen, setLyricsDialogOpen] = useState(false);
  const [manualArtist, setManualArtist] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,            
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i,  
      /^([a-zA-Z0-9_-]{11})$/                                     
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      const videoId = extractVideoId(query);
      
      if (videoId) {
        setVideoId(videoId);
        
        const oembedResponse = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );
        
        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          const videoTitle = oembedData.title || "";
          
          let artist = "", title = videoTitle;
          
          if (videoTitle.includes(" - ")) {
            [artist, title] = videoTitle.split(" - ", 2);
          } else if (videoTitle.includes(" | ")) {
            [artist, title] = videoTitle.split(" | ", 2);
          } else if (videoTitle.includes(": ")) {
            [artist, title] = videoTitle.split(": ", 2);
          }
          
          title = title
            .replace(/\(Official Video\)/i, "")
            .replace(/\(Official Music Video\)/i, "")
            .replace(/\(Official Audio\)/i, "")
            .replace(/\(Lyrics\)/i, "")
            .replace(/\(Lyric Video\)/i, "")
            .replace(/\[.*?\]/g, "")
            .replace(/\(.*?\)/g, "")
            .trim();
          
          setSongInfo({
            title: title,
            artist: artist,
            albumArt: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          });
          
          await fetchLyrics(title, artist);
        } else {
          setSongInfo({
            title: "Unknown Song",
            artist: "Unknown Artist", 
            albumArt: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
          });
          
          setLyrics([{ time: 0, text: "Couldn't identify song to fetch lyrics" }]);
        }
      } else {
        const searchTerms = query.trim();
        
        let artist = "", title = searchTerms;
        
        if (searchTerms.includes(" - ")) {
          [artist, title] = searchTerms.split(" - ", 2);
        }
        
        setVideoId("78YDlgZfPus");
        
        setSongInfo({
          title: title,
          artist: artist,
          albumArt: `https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg`
        });
        
        await fetchLyrics(title, artist);
      }
    } catch (error) {
      console.error("Error processing input:", error);
      setLyrics([{ time: 0, text: "Error processing video or lyrics" }]);
    } finally {
      setIsLoading(false);
    }
  };

const fetchLyrics = async (trackName: string, artistName: string) => {
  try {
    if (!trackName) {
      setLyrics([{ time: 0, text: "No track name to search for" }]);
      return;
    }
    
    const options: Array<{
      id: number;
      source: string;
      artist: string;
      title: string;
      lyrics: { time: number; text: string; }[];
    }> = [];
    let foundSyncedLyrics = false;
    
    if (artistName) {
      const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName
      });
      
      const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data) {
          if (data.syncedLyrics) {
            options.push({
              id: 1,
              source: "Exact match (synced)",
              artist: artistName,
              title: trackName,
              lyrics: parseLyrics(data.syncedLyrics)
            });
            foundSyncedLyrics = true;
          } else if (data.plainLyrics) {
            options.push({
              id: 2,
              source: "Exact match (plain)",
              artist: artistName,
              title: trackName,
              lyrics: parseLyrics(data.plainLyrics)
            });
          }
        }
      }
    }
    
    if (!foundSyncedLyrics) {
      const searchQuery = artistName ? `${trackName} ${artistName}` : trackName;
      const searchResponse = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (searchResponse.ok) {
        const searchResults = await searchResponse.json();
        
        if (Array.isArray(searchResults) && searchResults.length > 0) {
          console.log("Search results:", searchResults);
          
          const exactTitleMatch = searchResults.find(result => result.syncedLyrics 
          );
          
          if (exactTitleMatch) {
            options.push({
              id: 10,
              source: "Search result - exact title match (synced)",
              artist: exactTitleMatch.artistName || "",
              title: exactTitleMatch.trackName || "",
              lyrics: parseLyrics(exactTitleMatch.syncedLyrics)
            });
            foundSyncedLyrics = true;
          } else {
            const firstSyncedResult = searchResults.find(result => result.syncedLyrics);
            
            if (firstSyncedResult) {
              options.push({
                id: 20,
                source: "Search result (synced)",
                artist: firstSyncedResult.artistName || "",
                title: firstSyncedResult.trackName || "",
                lyrics: parseLyrics(firstSyncedResult.syncedLyrics)
              });
              foundSyncedLyrics = true;
            }
          }
          
          searchResults.forEach((result, index) => {
            if (options.some(o => 
              o.artist.toLowerCase() === (result.artistName || "").toLowerCase() && 
              o.title.toLowerCase() === (result.trackName || "").toLowerCase()
            )) {
              return;
            }
            
            if (result.syncedLyrics) {
              options.push({
                id: 30 + index,
                source: "Additional search result (synced)",
                artist: result.artistName || "",
                title: result.trackName || "",
                lyrics: parseLyrics(result.syncedLyrics)
              });
            } else if (result.plainLyrics) {
              options.push({
                id: 100 + index,
                source: "Search result (plain)",
                artist: result.artistName || "",
                title: result.trackName || "",
                lyrics: parseLyrics(result.plainLyrics)
              });
            }
          });
        }
      }
    }
    
    setLyricsOptions(options);
    
    if (options.length > 0) {
      setActiveLyricsId(options[0].id);
      setLyrics(options[0].lyrics);
    } else {
      setLyricsOptions([]);
      setActiveLyricsId(0);
      setLyrics([{ time: 0, text: "No lyrics found for this song" }]);
    }

    console.log("Final lyrics options:", options);
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    setLyricsOptions([]);
    setActiveLyricsId(0);
    setLyrics([{ time: 0, text: "Error loading lyrics" }]);
  }
};;
  const parseLyrics = (lyrics: string) => {
    if (!lyrics) return [{ time: 0, text: "No lyrics available" }];
    
    return lyrics.split("\n").map((line) => {
      let time = 0;
      let text = line;
      
      if (line.match(/\[\d+:\d+\.\d+\]/)) {
        const timeTag = line.match(/\[(\d+):(\d+)\.(\d+)\]/);
        if (timeTag && timeTag.length >= 4) {
          const minutes = parseInt(timeTag[1]);
          const seconds = parseInt(timeTag[2]);
          const hundredths = parseInt(timeTag[3]);
          time = minutes * 60 + seconds + hundredths / 100;
          text = line.replace(/\[\d+:\d+\.\d+\]/, "").trim();
        }
      }
      
      return { time, text };
    }).filter(item => item.text.length > 0);
  };

  useEffect(() => {
    if (lyrics.length === 0) return;
    
    const lineIndex = lyrics.findIndex((line, i) => {
      return (
        currentTime >= line.time &&
        (i + 1 === lyrics.length || currentTime < (lyrics[i + 1]?.time ?? Infinity))
      );
    });
    
    if (lineIndex !== -1) {
      setCurrentLyricIndex(lineIndex);
    }
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (songInfo.albumArt) {
      const fac = new FastAverageColor();
      fac.getColorAsync(songInfo.albumArt)
        .then(color => {
          setBackgroundColor(`rgba(${color.value[0]}, ${color.value[1]}, ${color.value[2]}, 0.8)`);
          
          const brightness = (color.value[0] * 299 + color.value[1] * 587 + color.value[2] * 114) / 1000;
          setTextColor(brightness > 128 ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)");
        })
        .catch(e => console.error(e));
    }
  }, [songInfo.albumArt]);

  useEffect(() => {
    setCurrentTime(0)
    setCurrentLyricIndex(0)
    setCurrentSongIndex(0)
  }, [songInfo])

  useEffect(() => {
    if (videoId) {
      setSimilarSongs([]);
    }
  }, [videoId]);

  const playNextSong = async () => {};

  const changeLyrics = (id: number) => {
    const selected = lyricsOptions.find(option => option.id === id);
    if (selected) {
      setActiveLyricsId(id);
      setLyrics(selected.lyrics);
      setCurrentLyricIndex(-1);
    }
  };

  const openManualLyricsSearch = () => {
    setManualArtist(songInfo.artist);
    setManualTitle(songInfo.title);
    setLyricsDialogOpen(true);
  };

  const performManualLyricsSearch = () => {
    if (manualTitle) {
      fetchLyrics(manualTitle, manualArtist);
      setLyricsDialogOpen(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col overflow-hidden relative"
      style={{ 
        backgroundImage: songInfo.albumArt ? `linear-gradient(to bottom, ${backgroundColor}, #000)` : undefined,
        color: textColor,
        transition: "background-image 1s ease-in-out, color 1s ease-in-out"
      }}
    >
      {songInfo.albumArt && (
        <div 
          className="absolute inset-0 z-0" 
          style={{
            backgroundImage: `url(${songInfo.albumArt})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(100px) brightness(40%)",
            opacity: 0.6,
          }}
        />
      )}

      <div className="relative z-10 flex-1 container mx-auto px-4 py-8 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Input
                  className="bg-black/20 backdrop-blur-md border-none text-inherit placeholder:text-white/50 pl-10 h-12"
                  placeholder="Paste YouTube URL or search for a song..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70" size={18} />
              </div>
              <p className="text-xs text-white/60 mt-1 ml-2">
                Tip: Paste a YouTube URL for best results
              </p>
            </div>
            <Button 
              onClick={handleSearch} 
              size="icon" 
              className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
            >
              <Youtube size={20} />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row gap-8 h-[calc(100vh-180px)]">
          <div className="md:w-1/3 flex flex-col h-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 rounded-xl overflow-hidden shadow-2xl mb-6"
            >
              {videoId ? (
                <YouTubePlayer 
                  videoId={videoId}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  setCurrentTime={setCurrentTime}
                  setDuration={setDuration} 
                  currentTime={currentTime}
                />
              ) : (
                <div className="w-full h-full bg-black/40 backdrop-blur-md flex items-center justify-center">
                  <Music size={48} className="text-white/50" />
                </div>
              )}
            </motion.div>

            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-2"
              >
                {isLoading ? (
                  <>
                    <Skeleton className="h-8 w-3/4 bg-white/10" />
                    <Skeleton className="h-4 w-1/2 bg-white/10" />
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold truncate text-white">{songInfo.title || "No song selected"}</h1>
                    <p className="text-lg opacity-80 text-gray-100">{songInfo.artist || "Search for a song to begin"}</p>
                  </>
                )}
              </motion.div>

              {videoId && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm opacity-70 min-w-[40px] text-white">
                      {formatTime(currentTime)}
                    </span>
                    <Slider 
                      value={[currentTime]}
                      max={duration}
                      step={0.1}
                      onValueChange={(vals) => setCurrentTime(vals[0])}
                      className="flex-1"
                    />
                    <span className="text-sm opacity-70 min-w-[40px] text-white">
                      {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-white/10"
                      onClick={() => setIsFavorite(!isFavorite)}
                    >
                      {isFavorite ? 
                        <FaHeart className="text-red-500" size={20} /> : 
                        <FaRegHeart size={20} />
                      }
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-12 w-12 rounded-full border-white/20 bg-white/10 hover:bg-white/20"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-white/10"
                      onClick={() => setShowLyrics(!showLyrics)}
                    >
                      {showLyrics ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    </Button>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="rounded-full hover:bg-white/10"
                      onClick={playNextSong}
                    >
                      <SkipForward size={20} />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {showLyrics && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="md:w-2/3 relative"
              >
                <Card className="h-full bg-black/30 backdrop-blur-lg border-white/10 text-white">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Mic size={18} />
                        <h2 className="text-lg font-medium">Lyrics</h2>
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-xs flex items-center gap-1"
                            >
                              <span>{lyricsOptions.length > 0 ? `Source (${lyricsOptions.length})` : "Options"}</span>
                              <ChevronDown size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end"
                            className="w-64 bg-black/80 backdrop-blur-md border-white/10 text-white"
                          >
                            <DropdownMenuLabel>Available Lyrics</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            
                            {lyricsOptions.map((option) => (
                              <DropdownMenuItem
                                key={option.id}
                                onClick={() => changeLyrics(option.id)}
                                className={`cursor-pointer ${activeLyricsId === option.id ? 'bg-white/20' : ''}`}
                              >
                                <div className="flex flex-col w-full">
                                  <span className="font-medium truncate">{option.title}</span>
                                  <span className="text-xs opacity-70 truncate">
                                    {option.artist} • {option.source}
                                  </span>
                                </div>
                              </DropdownMenuItem>
                            ))}
                            
                            {lyricsOptions.length > 0 && <DropdownMenuSeparator className="bg-white/10" />}
                            
                            <DropdownMenuItem onClick={openManualLyricsSearch} className="cursor-pointer">
                              <div className="flex flex-col">
                                <span className="font-medium">Manual Search</span>
                                <span className="text-xs opacity-70">Search with custom artist/title</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    
                    <ScrollArea className="h-[60vh]">
                      <LyricsDisplay 
                        lyrics={lyrics}
                        currentLyricIndex={currentLyricIndex}
                        currentTime={currentTime}
                        setCurrentTime={setCurrentTime}
                        currentSource={lyricsOptions.find(opt => opt.id === activeLyricsId)?.source || ""}
                      />
                    </ScrollArea>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Dialog open={isLyricsDialogOpen} onOpenChange={setLyricsDialogOpen}>
        <DialogContent className="bg-black/90 backdrop-blur-md border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Search for Lyrics</DialogTitle>
            <DialogDescription className="text-white/70">
              Enter artist name and song title to search for lyrics
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Song Title</label>
              <Input 
                value={manualTitle} 
                onChange={(e) => setManualTitle(e.target.value)} 
                className="bg-black/40 border-white/20"
                placeholder="Song title"
              />
            </div>

            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Artist</label>
              <Input 
                value={manualArtist} 
                onChange={(e) => setManualArtist(e.target.value)} 
                className="bg-black/40 border-white/20"
                placeholder="Artist name"
              />

          </div>
          
          <DialogFooter>
            <Button 
              onClick={() => setLyricsDialogOpen(false)} 
              variant="outline"
              className="border-white/20 hover:bg-white/10 text-black"
            >
              Cancel
            </Button>
            <Button 
              onClick={performManualLyricsSearch}
              disabled={!manualTitle.trim()}
            >
              Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}