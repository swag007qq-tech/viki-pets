import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MusicNoteIcon,
  NextTrackIcon,
  PauseBarsIcon,
  PlayTriangleIcon,
  PrevTrackIcon,
  SpeakerIcon,
} from './VikiIcons';

export interface Track {
  id: string;
  title: string;
  artist: string;
  videoIds: string[];
  fallbackDuration: string;
}

const PLAYLIST: Track[] = [
  {
    id: 'beauty-and-a-beat',
    title: 'Beauty and a Beat',
    artist: 'Justin Bieber',
    videoIds: ['J9abt3xpdDU', 'Ys7-6_t7OEQ'],
    fallbackDuration: '3:48',
  },
  {
    id: 'shape-of-you',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    videoIds: ['z8y691JLa1A', 'JGwWNGJdvx8'],
    fallbackDuration: '3:54',
  },
  {
    id: 'wyw-my-sweetie',
    title: 'Wyw my sweetie',
    artist: 'nissi, 25Hzz',
    videoIds: ['T4Cw76Oo-38', 'zf5aWUZcaiQ'],
    fallbackDuration: '2:12',
  },
  {
    id: 'woman',
    title: 'Woman',
    artist: 'Doja Cat',
    videoIds: ['g7X9X6TlrUo', 'yxW5yuzVi8w'],
    fallbackDuration: '2:53',
  },
];

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  mute: () => void;
  unMute: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface YTPlayerEvent {
  target: YTPlayerInstance;
  data: number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          height?: string | number;
          width?: string | number;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: YTPlayerEvent) => void;
            onStateChange?: (event: YTPlayerEvent) => void;
            onError?: (event: YTPlayerEvent) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MusicPlayer() {
  const [trackIndex, setTrackIndex] = useState(0);
  const [fallbackStep, setFallbackStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [volume, setVolume] = useState(62);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const playerHostRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pendingAutoPlayRef = useRef(false);
  const playerReadyRef = useRef(false);
  const trackIndexRef = useRef(trackIndex);
  const fallbackStepRef = useRef(fallbackStep);
  const volumeRef = useRef(volume);

  trackIndexRef.current = trackIndex;
  fallbackStepRef.current = fallbackStep;
  volumeRef.current = volume;

  const currentTrack = PLAYLIST[trackIndex];

  const selectTrack = useCallback((index: number, autoPlay = true) => {
    const safeIndex = (index + PLAYLIST.length) % PLAYLIST.length;
    const nextTrack = PLAYLIST[safeIndex];
    setTrackIndex(safeIndex);
    trackIndexRef.current = safeIndex;
    setFallbackStep(0);
    fallbackStepRef.current = 0;
    setCurrentTime(0);
    setDuration(0);
    setLoadError(null);
    setHasInteracted(true);

    if (autoPlay) {
      pendingAutoPlayRef.current = true;
      setIsBuffering(true);
    }

    if (playerRef.current && playerReadyRef.current) {
      if (autoPlay) {
        pendingAutoPlayRef.current = false;
        playerRef.current.loadVideoById(nextTrack.videoIds[0]);
      } else {
        playerRef.current.cueVideoById(nextTrack.videoIds[0]);
      }
    }
  }, []);

  // Load YouTube IFrame API once
  useEffect(() => {
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !playerHostRef.current || !window.YT?.Player || playerRef.current) {
        return;
      }

      const initialVideoId = PLAYLIST[trackIndexRef.current].videoIds[0];
      playerRef.current = new window.YT.Player(playerHostRef.current, {
        height: '200',
        width: '200',
        videoId: initialVideoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (cancelled) return;
            playerReadyRef.current = true;
            setPlayerReady(true);
            event.target.setVolume(volumeRef.current);
            if (volumeRef.current === 0) {
              event.target.mute();
            } else {
              event.target.unMute();
            }
            const dur = event.target.getDuration();
            if (dur > 0) setDuration(dur);

            if (pendingAutoPlayRef.current) {
              pendingAutoPlayRef.current = false;
              const desiredId = PLAYLIST[trackIndexRef.current].videoIds[0];
              event.target.loadVideoById(desiredId);
            }
          },
          onStateChange: (event) => {
            if (cancelled) return;
            const YTState = window.YT?.PlayerState;
            const state = event.data;

            if (state === (YTState?.PLAYING ?? 1)) {
              setIsPlaying(true);
              setIsBuffering(false);
              setLoadError(null);
              const dur = event.target.getDuration();
              if (dur > 0) setDuration(dur);
            } else if (state === (YTState?.PAUSED ?? 2)) {
              setIsPlaying(false);
              setIsBuffering(false);
            } else if (state === (YTState?.BUFFERING ?? 3)) {
              setIsBuffering(true);
            } else if (state === (YTState?.ENDED ?? 0)) {
              setIsPlaying(false);
              setIsBuffering(false);
              const nextIdx = (trackIndexRef.current + 1) % PLAYLIST.length;
              selectTrack(nextIdx, true);
            }
          },
          onError: () => {
            if (cancelled) return;
            const track = PLAYLIST[trackIndexRef.current];
            const nextStep = fallbackStepRef.current + 1;
            if (nextStep < track.videoIds.length && playerRef.current) {
              setFallbackStep(nextStep);
              playerRef.current.loadVideoById(track.videoIds[nextStep]);
              playerRef.current.playVideo();
            } else {
              setIsPlaying(false);
              setIsBuffering(false);
              setLoadError('Трек недоступен для воспроизведения в этом браузере');
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prevCallback?.();
        initPlayer();
      };

      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore cleanup errors
        }
        playerRef.current = null;
      }
    };
  }, [selectTrack]);

  // Poll playback progress while playing
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const timer = window.setInterval(() => {
      if (!playerRef.current) return;
      const t = playerRef.current.getCurrentTime();
      const d = playerRef.current.getDuration();
      if (Number.isFinite(t)) setCurrentTime(t);
      if (Number.isFinite(d) && d > 0) setDuration(d);
    }, 500);

    return () => window.clearInterval(timer);
  }, [isPlaying]);

  // Close playlist dropdown on outside click
  useEffect(() => {
    if (!isPlaylistOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsPlaylistOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPlaylistOpen]);

  const handleTogglePlay = () => {
    setHasInteracted(true);
    setLoadError(null);

    if (!playerRef.current || !playerReady) {
      pendingAutoPlayRef.current = !isPlaying;
      setIsBuffering(!isPlaying);
      return;
    }

    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      setIsBuffering(true);
      playerRef.current.playVideo();
    }
  };

  const handlePrev = () => {
    selectTrack(trackIndex - 1, true);
  };

  const handleNext = () => {
    selectTrack(trackIndex + 1, true);
  };

  const handleVolumeChange = (nextVal: number) => {
    setVolume(nextVal);
    if (playerRef.current && playerReady) {
      playerRef.current.setVolume(nextVal);
      if (nextVal === 0) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    }
  };

  const handleToggleMute = () => {
    const nextVal = volume === 0 ? 62 : 0;
    handleVolumeChange(nextVal);
  };

  const handleSeek = (nextSec: number) => {
    setCurrentTime(nextSec);
    if (playerRef.current && playerReady) {
      playerRef.current.seekTo(nextSec, true);
    }
  };

  const progressMax = duration > 0 ? duration : 100;
  const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0 lg:max-w-[734px] lg:flex-1 xl:ml-4 2xl:ml-6"
    >
      {/* Hidden YouTube audio engine (kept in DOM with 1px size for browser audio playback) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
      >
        <div ref={playerHostRef} />
      </div>

      {/* Main Player Pill */}
      <div className="flex w-full min-w-0 flex-col gap-3 rounded-[26px] bg-[#EAD2C2] px-4 py-3.5 sm:h-[100px] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-full sm:px-7 sm:py-0 lg:h-[98px] lg:px-6 xl:h-[112px] xl:px-9 2xl:h-[118px] 2xl:px-10">
        {/* Left Note + Track Info & Controls */}
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-5 xl:gap-6">
          <button
            type="button"
            onClick={() => setIsPlaylistOpen((prev) => !prev)}
            aria-label="Открыть список песен"
            aria-expanded={isPlaylistOpen}
            className="shrink-0 cursor-pointer rounded-full p-1 text-[#8D654E] transition-colors duration-150 hover:text-[#5B3B2A] focus-visible:outline-2 focus-visible:outline-[#8D654E]"
          >
            <MusicNoteIcon className="h-8 w-8 sm:h-9 sm:w-9 xl:h-11 xl:w-11" />
          </button>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            {/* Track title / Playlist toggle button */}
            <button
              type="button"
              onClick={() => setIsPlaylistOpen((prev) => !prev)}
              aria-expanded={isPlaylistOpen}
              className="group flex max-w-full cursor-pointer items-center gap-1.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8D654E]"
            >
              <span className="truncate text-[15px] font-medium tracking-[0.01em] text-[#5B3B2A] transition-colors group-hover:text-[#3E261A] sm:text-[16px] xl:text-[17px]">
                {hasInteracted
                  ? `${currentTrack.title} — ${currentTrack.artist}`
                  : 'good vibes ♡'}
              </span>
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className={`h-3.5 w-3.5 shrink-0 text-[#8D654E] transition-transform duration-150 ${
                  isPlaylistOpen ? 'rotate-180' : ''
                }`}
              >
                <path d="m4 6 4 4 4-4" />
              </svg>
            </button>

            {/* Playback Controls */}
            <div className="mt-1.5 flex items-center gap-3 sm:mt-2 sm:gap-4 xl:gap-6">
              <button
                type="button"
                aria-label="Предыдущий трек"
                onClick={handlePrev}
                className="cursor-pointer rounded-full p-1 text-[#8D654E] transition-colors duration-150 hover:text-[#5B3B2A] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#8D654E]"
              >
                <PrevTrackIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <button
                type="button"
                aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                onClick={handleTogglePlay}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#9B735B] text-white transition-all duration-150 hover:bg-[#8C654E] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3B2A] sm:h-10 sm:w-10"
              >
                {isPlaying ? (
                  <PauseBarsIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <PlayTriangleIcon
                    className={`h-4 w-4 translate-x-[1px] sm:h-5 sm:w-5 ${
                      isBuffering ? 'opacity-70' : ''
                    }`}
                  />
                )}
              </button>

              <button
                type="button"
                aria-label="Следующий трек"
                onClick={handleNext}
                className="cursor-pointer rounded-full p-1 text-[#8D654E] transition-colors duration-150 hover:text-[#5B3B2A] active:scale-95 focus-visible:outline-2 focus-visible:outline-[#8D654E]"
              >
                <NextTrackIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-1 hidden h-12 w-[1.5px] shrink-0 bg-[#B69681] sm:block xl:mx-2 xl:h-16" />

        {/* Volume Control */}
        <div className="flex min-w-0 shrink-0 items-center gap-3 sm:gap-3 xl:gap-4">
          <button
            type="button"
            aria-label={volume === 0 ? 'Включить звук' : 'Выключить звук'}
            onClick={handleToggleMute}
            className="shrink-0 cursor-pointer rounded-full p-1 text-[#8D654E] transition-colors duration-150 hover:text-[#5B3B2A] focus-visible:outline-2 focus-visible:outline-[#8D654E]"
          >
            <SpeakerIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            aria-label="Уровень громкости"
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            style={{
              background: `linear-gradient(to right, #BA9B86 0%, #BA9B86 ${volume}%, #D5BBA9 ${volume}%, #D5BBA9 100%)`,
            }}
            className="viki-volume-slider min-w-0 flex-1 sm:w-[105px] sm:flex-none lg:w-[95px] xl:w-[145px] 2xl:w-[185px]"
          />
        </div>
      </div>

      {/* Mini Playlist Popover */}
      {isPlaylistOpen && (
        <div
          role="region"
          aria-label="Список песен"
          className="absolute top-full left-0 z-40 mt-2.5 w-full rounded-[24px] border-[1.5px] border-[#DFC3B0] bg-[#FCF0E7] p-3.5 shadow-[0_12px_32px_rgba(91,59,42,0.12)] sm:p-4"
        >
          {/* Current Track Scrubber */}
          <div className="mb-3 rounded-[16px] bg-[#F3E1D4] px-3.5 py-2.5">
            <div className="flex items-center justify-between gap-2 text-[13px] font-medium text-[#5B3B2A]">
              <span className="truncate">
                {currentTrack.title} · {currentTrack.artist}
              </span>
              <span className="shrink-0 tabular-nums text-[#7F5A46]">
                {formatTime(currentTime)} /{' '}
                {duration > 0 ? formatTime(duration) : currentTrack.fallbackDuration}
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={progressMax}
              value={duration > 0 ? currentTime : 0}
              aria-label="Перемотка трека"
              onChange={(e) => handleSeek(Number(e.target.value))}
              style={{
                background: `linear-gradient(to right, #9B735B 0%, #9B735B ${progressPercent}%, #DEC6B5 ${progressPercent}%, #DEC6B5 100%)`,
              }}
              className="viki-progress-slider mt-2 w-full"
            />

            {loadError && (
              <p className="mt-1.5 text-[12px] text-[#9A4D3A]">{loadError}</p>
            )}
          </div>

          {/* 4-Song Playlist */}
          <ul className="flex flex-col gap-1.5">
            {PLAYLIST.map((track, idx) => {
              const isActive = idx === trackIndex;
              return (
                <li key={track.id}>
                  <button
                    type="button"
                    onClick={() => selectTrack(idx, true)}
                    className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[#8D654E] ${
                      isActive
                        ? 'bg-[#9B735B] text-white'
                        : 'text-[#5B3B2A] hover:bg-[#F3E1D4]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#E6CCBC] text-[#5B3B2A]'
                        }`}
                      >
                        {isActive && isPlaying ? '❚❚' : idx + 1}
                      </span>

                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-medium leading-tight">
                          {track.title}
                        </div>
                        <div
                          className={`truncate text-[12px] ${
                            isActive ? 'text-white/85' : 'text-[#8D654E]'
                          }`}
                        >
                          {track.artist}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 text-[12px] font-medium tabular-nums ${
                        isActive ? 'text-white/90' : 'text-[#8D654E]'
                      }`}
                    >
                      {isActive && duration > 0
                        ? formatTime(duration)
                        : track.fallbackDuration}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
