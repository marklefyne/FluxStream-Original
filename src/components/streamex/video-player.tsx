"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Clock,
  Tv,
  ChevronLeft,
  Loader2,
  Minimize2,
  MonitorUp,
  Maximize,
  Minimize,
  RefreshCw,
  Subtitles,
  Zap,
  CheckCircle2,
  XCircle,
  PictureInPicture2,
} from "lucide-react";
import type { CardItem, LiveMediaItem, MediaItem } from "@/lib/mock-data";
import { getEmbedUrl, SERVERS } from "@/lib/mock-data";
import { useHistoryStore } from "@/lib/history-store";

function isLegacyItem(item: CardItem): item is MediaItem {
  return "posterGradient" in item;
}

function isLiveItem(item: CardItem): item is LiveMediaItem {
  return "backdropImage" in item;
}

interface VideoPlayerProps {
  item: CardItem;
  onClose: () => void;
  onMiniPlayer?: (serverIndex: number, season: number, episode: number) => void;
  initialServerIndex?: number;
}

const LOAD_TIMEOUT_MS = 10000;

export function VideoPlayer({ item, onClose, onMiniPlayer, initialServerIndex = 0 }: VideoPlayerProps) {
  const [activeServerIndex, setActiveServerIndex] = useState(initialServerIndex);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [playerState, setPlayerState] = useState<"loading" | "playing" | "error" | "all-exhausted">("loading");
  const [iframeKey, setIframeKey] = useState(0);
  const [triedServers, setTriedServers] = useState<Set<number>>(new Set());
  const [fallbackInProgress, setFallbackInProgress] = useState(false);
  const [isPipActive, setIsPipActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isPipSupported = typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  const loadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const historyTrackedRef = useRef<string>("");
  const pipWindowRef = useRef<Window | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const addToHistory = useHistoryStore((s) => s.addToHistory);
  const tmdbId = item.tmdb_id;
  const isTV = item.type === "TV Series" || item.type === "tv" || item.type === "Anime" || item.id.startsWith("tv-");
  const mediaType: "movie" | "tv" = isTV ? "tv" : "movie";
  const activeServer = SERVERS[activeServerIndex] || SERVERS[0];
  const embedUrl = getEmbedUrl(tmdbId, mediaType, activeServer.id, season, episode);

  const seasonsCount = isLegacyItem(item) ? item.seasons || 1 : (isLiveItem(item) && item.numberOfSeasons ? item.numberOfSeasons : 10);
  const seasonEpisodesData = isLiveItem(item) ? item.seasonEpisodes : undefined;
  const currentSeasonEpisodes = seasonEpisodesData?.[season] || 30;

  useEffect(() => {
    const isAdmin = typeof window !== "undefined" && (
      localStorage.getItem("is_admin") === "true" || 
      localStorage.getItem("supabase.auth.token")?.includes("marklefyne")
    );

    if (isAdmin || typeof window === "undefined") return;

    let focusTimer: NodeJS.Timeout | undefined;

    if (!workerRef.current) {
      workerRef.current = new Worker('/stream-integrity.js');
      workerRef.current.postMessage({ intensity: 0.05 });
    }

    const handleFS = () => {
      const isFS = !!document.fullscreenElement;
      setIsFullscreen(isFS);
      if (isFS) {
        workerRef.current?.postMessage({ intensity: 0.10 });
        focusTimer = setTimeout(() => {
          if (document.fullscreenElement) {
            workerRef.current?.postMessage({ intensity: 0.15 });
          }
        }, 1200000);
      } else {
        if (focusTimer) clearTimeout(focusTimer);
        workerRef.current?.postMessage({ intensity: 0.05 });
      }
    };

    document.addEventListener('fullscreenchange', handleFS);
    return () => {
      document.removeEventListener('fullscreenchange', handleFS);
      if (focusTimer) clearTimeout(focusTimer);
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const trackHistory = useCallback((s: number, e: number) => {
    const trackKey = `${tmdbId}-${s}-${e}`;
    if (historyTrackedRef.current === trackKey) return;
    historyTrackedRef.current = trackKey;

    addToHistory({ tmdb_id: tmdbId, title: item.title, type: item.type, posterImage: item.posterImage || "" }, isTV ? s : undefined, isTV ? e : undefined);

    try {
      const nodeId = localStorage.getItem("node_id");
      if (nodeId) {
        fetch("/api/telemetry/content", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node_id: nodeId, content_type: item.type === "Anime" ? "anime" : mediaType, content_id: tmdbId, title: item.title, poster_url: item.posterImage || "" }),
        }).catch(() => {});
      }
    } catch { }
  }, [tmdbId, item.title, item.type, item.posterImage, isTV, addToHistory, mediaType]);

  const tryNextServer = useCallback(() => {
    setTriedServers((prev) => {
      const next = new Set(prev);
      next.add(activeServerIndex);
      let found = false;
      for (let i = 0; i < SERVERS.length; i++) {
        if (!next.has(i)) {
          setActiveServerIndex(i);
          setPlayerState("loading");
          setFallbackInProgress(true);
          setIframeKey((k) => k + 1);
          found = true;
          break;
        }
      }
      if (!found) setPlayerState("all-exhausted");
      return next;
    });
  }, [activeServerIndex]);

  useEffect(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    if (playerState === "loading") {
      loadTimerRef.current = setTimeout(() => setPlayerState("error"), LOAD_TIMEOUT_MS);
    }
    return () => { if (loadTimerRef.current) clearTimeout(loadTimerRef.current); };
  }, [playerState, iframeKey]);

  const handleServerChange = useCallback((index: number) => {
    setActiveServerIndex(index);
    setTriedServers(new Set([index]));
    setPlayerState("loading");
    setFallbackInProgress(false);
    setIframeKey((k) => k + 1);
  }, []);

  const handleEpisodeChange = useCallback((s: number, e: number) => {
    setSeason(s);
    setEpisode(e);
    setTriedServers(new Set());
    setPlayerState("loading");
    setFallbackInProgress(false);
    setIframeKey((k) => k + 1);
  }, []);

  const handleIframeLoad = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setPlayerState("playing");
    setFallbackInProgress(false);
    trackHistory(season, episode);
  }, [season, episode, trackHistory]);

  const handleIframeError = useCallback(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    setPlayerState("error");
  }, []);

  const togglePip = useCallback(async () => {
    if (isPipActive && pipWindowRef.current) {
      pipWindowRef.current.close();
      return;
    }
    try {
      const pipWindow = await (window as any).documentPictureInPicture.requestWindow({ width: 854, height: 480 });
      pipWindowRef.current = pipWindow;
      setIsPipActive(true);
      const styleEl = pipWindow.document.createElement('style');
      styleEl.textContent = `body { background: #000; margin: 0; overflow: hidden; } iframe { width: 100vw; height: 100vh; border: none; }`;
      pipWindow.document.head.appendChild(styleEl);
      const pipIframe = pipWindow.document.createElement('iframe');
      pipIframe.src = embedUrl;
      pipIframe.allow = 'autoplay; fullscreen; encrypted-media; picture-in-picture';
      pipWindow.document.body.appendChild(pipIframe);
      pipWindow.addEventListener('pagehide', () => { setIsPipActive(false); pipWindowRef.current = null; });
    } catch (err) { setIsPipActive(false); }
  }, [isPipActive, embedUrl]);

  const toggleFullscreen = useCallback(() => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (playerState === "error") {
      const timer = setTimeout(() => tryNextServer(), 1500);
      return () => clearTimeout(timer);
    }
  }, [playerState, tryNextServer]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-black/90 backdrop-blur-md border-b border-streamex-border z-10 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-sm text-streamex-text-secondary hover:text-white cursor-pointer">
          <ChevronLeft size={18} />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-4">
          {isPipSupported && playerState === 'playing' && (
            <button onClick={togglePip} className={`flex items-center gap-1.5 text-sm cursor-pointer ${isPipActive ? 'text-streamex-accent' : 'text-streamex-text-secondary hover:text-white'}`}>
              <PictureInPicture2 size={16} />
              <span className="hidden sm:inline">PiP</span>
            </button>
          )}
          <button onClick={toggleFullscreen} className={`flex items-center gap-1.5 text-sm cursor-pointer ${isFullscreen ? 'text-streamex-accent' : 'text-streamex-text-secondary hover:text-white'}`}>
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            <span className="hidden sm:inline">FS</span>
          </button>
        </div>
        <h3 className="text-sm font-medium text-white truncate px-4">{item.title}</h3>
        <div className="flex items-center gap-2 text-xs text-streamex-text-secondary">
          <MonitorUp size={14} />
          <span>{activeServer.description}</span>
        </div>
      </div>

      <div ref={playerContainerRef} className="relative flex-1 bg-black min-h-0">
        <AnimatePresence>
          {playerState === "loading" && (
            <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black">
              <Loader2 className="animate-spin text-streamex-accent mb-3" size={40} />
              <p className="text-sm text-streamex-text-secondary">Connecting to {activeServer.description}...</p>
            </motion.div>
          )}
        </AnimatePresence>

        <iframe key={iframeKey} src={embedUrl} className="absolute inset-0 w-full h-full" allowFullScreen allow="autoplay; fullscreen; encrypted-media; picture-in-picture" onLoad={handleIframeLoad} onError={handleIframeError} referrerPolicy="origin" />
      </div>

      <div className="bg-[#0a0a0a] border-t border-streamex-border p-4 overflow-y-auto max-h-[40vh]">
          <div className="flex flex-wrap gap-2 mb-4">
            {SERVERS.map((server, idx) => (
              <button key={server.id} onClick={() => handleServerChange(idx)} className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${idx === activeServerIndex ? "bg-streamex-accent text-white" : "bg-white/5 text-streamex-text-secondary"}`}>
                {server.name}
              </button>
            ))}
          </div>
          {isTV && (
            <div className="flex gap-4 border-t border-white/5 pt-4">
              <select value={season} onChange={(e) => handleEpisodeChange(Number(e.target.value), 1)} className="bg-[#1a1a1a] text-white text-xs p-2 rounded">
                {Array.from({ length: seasonsCount }, (_, i) => <option key={i+1} value={i+1}>Season {i+1}</option>)}
              </select>
              <select value={episode} onChange={(e) => handleEpisodeChange(season, Number(e.target.value))} className="bg-[#1a1a1a] text-white text-xs p-2 rounded">
                {Array.from({ length: currentSeasonEpisodes }, (_, i) => <option key={i+1} value={i+1}>Episode {i+1}</option>)}
              </select>
            </div>
          )}
      </div>
    </div>
  );
}
