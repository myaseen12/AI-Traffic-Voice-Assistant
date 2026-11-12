"use client";
import React, { useState, useEffect, useRef } from "react";

export default function AudioPlayerControls({
  audioBase64,
  audioFormat = "mp3",
  voiceInfo = null,
  language = "en",
  title = "Spoken Answer",
  autoPlay = false,
  onPlayStateChange,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [loadError, setLoadError] = useState(null);

  // Setup HTML5 Audio element
  useEffect(() => {
    if (!audioBase64) {
      return;
    }

    const mime = audioFormat.toLowerCase() === "wav" ? "audio/wav" : "audio/mp3";
    const src = `data:${mime};base64,${audioBase64}`;
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.playbackRate = playbackRate;

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setLoadError(null);
      if (autoPlay) {
        audio.play().catch(() => {
          // Auto-play was prevented by browser policy
          setIsPlaying(false);
        });
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    const onError = () => {
      setLoadError("Audio could not be decoded.");
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    const onPlay = () => {
      setIsPlaying(true);
      if (onPlayStateChange) onPlayStateChange(true);
    };

    const onPause = () => {
      setIsPlaying(false);
      if (onPlayStateChange) onPlayStateChange(false);
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.pause();
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audioRef.current = null;
    };
  }, [audioBase64, audioFormat, autoPlay]);

  // Toggle Play / Pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.error("Playback error:", err);
      });
    }
  };

  // Replay from start (0:00)
  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    audioRef.current.play().catch((err) => {
      console.error("Replay error:", err);
    });
  };

  // Stop playback completely and reset
  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
    if (onPlayStateChange) onPlayStateChange(false);
  };

  // Timeline scrubber seek
  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Speed changer (0.75x, 1x, 1.25x)
  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!audioBase64) return null;

  const isLowResource =
    language === "ps" ||
    (voiceInfo && voiceInfo.quality_tier === "LOW_RESOURCE") ||
    (voiceInfo && voiceInfo.is_high_quality === false);

  return (
    <div className="w-full mt-3 pt-2.5 border-t border-slate-700/60 bg-navy-950/70 p-3 rounded-xl border border-slate-700/50">
      
      {/* Header: Title + Language Voice Quality Disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs">
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse font-semibold text-slate-300">
          <span className="text-cyan-neon">🔊</span>
          <span>{title}</span>
          <span className="text-[10px] text-slate-400 font-mono uppercase bg-navy-900 px-1.5 py-0.5 rounded border border-slate-700">
            {audioFormat.toUpperCase()}
          </span>
        </div>

        {/* Low-Resource vs High-Quality Voice Badge */}
        {isLowResource ? (
          <span
            className="text-[10px] bg-amber-950/80 text-amber-300 border border-amber-600/70 px-2 py-0.5 rounded-full font-medium flex items-center space-x-1"
            title="High-quality neural voice is currently unavailable for Pashto. Synthesized using regional phonetic approximation."
          >
            <span>⚠️</span>
            <span>Pashto: Regional Phonetic Approximation</span>
          </span>
        ) : (
          <span className="text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 px-2 py-0.5 rounded-full font-medium flex items-center space-x-1">
            <span>✓</span>
            <span>High-Quality Neural Voice</span>
          </span>
        )}
      </div>

      {/* Advisory Note for Pashto Citizens */}
      {isLowResource && (
        <div className="mb-2 p-1.5 rounded-lg bg-amber-950/40 border border-amber-700/40 text-[11px] text-amber-200/90 leading-tight">
          ℹ️ <strong>Pashto Voice Note:</strong> High-quality neural speech models are currently limited for Pashto. This spoken response is rendered using regional phonetic synthesis.
        </div>
      )}

      {/* Error display if audio fails */}
      {loadError && (
        <div className="text-[11px] text-rose-400 mb-2">
          ⚠️ {loadError}
        </div>
      )}

      {/* Timeline Scrubber */}
      <div className="flex items-center space-x-2 rtl:space-x-reverse mb-2">
        <span className="text-[11px] font-mono text-cyan-neon w-9 text-right rtl:text-left">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration > 0 ? duration : 100}
          step="0.05"
          value={currentTime}
          onChange={handleSeek}
          disabled={!duration}
          aria-label="Audio timeline scrubber"
          className="flex-grow h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-neon focus:outline-none"
        />
        <span className="text-[11px] font-mono text-slate-400 w-9">
          {formatTime(duration)}
        </span>
      </div>

      {/* Playback Controls Bar: Play/Pause, Replay, Stop, Speed */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        
        {/* Core Buttons: Play/Pause, Replay, Stop */}
        <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
          {/* Play / Pause Button */}
          <button
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause audio playback" : "Play audio playback"}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-royal-600 to-cyan-500 hover:from-royal-500 hover:to-cyan-400 text-white font-bold text-xs shadow-glow-cyan/40 transition flex items-center space-x-1"
            title={isPlaying ? "Pause Spoken Voice" : "Play Spoken Voice"}
          >
            <span>{isPlaying ? "⏸️ Pause" : "▶ Play"}</span>
          </button>

          {/* Replay Button */}
          <button
            onClick={handleReplay}
            aria-label="Replay audio from start"
            className="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-slate-700 text-slate-200 hover:text-white text-xs transition flex items-center space-x-1"
            title="Replay Spoken Audio from Beginning"
          >
            <span>↺</span>
            <span className="hidden sm:inline">Replay</span>
          </button>

          {/* Stop Button */}
          <button
            onClick={handleStop}
            aria-label="Stop audio playback"
            className="px-2.5 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 border border-slate-700 text-slate-200 hover:text-rose-400 text-xs transition flex items-center space-x-1"
            title="Stop Audio Playback"
          >
            <span>⏹</span>
            <span className="hidden sm:inline">Stop</span>
          </button>

          {/* Soundwave Bouncing Bars when Playing */}
          {isPlaying && (
            <div className="flex items-center space-x-1 h-3 ml-2 rtl:mr-2">
              <span className="w-1 bg-cyan-neon rounded-full animate-bounce h-3" style={{ animationDelay: "0ms" }}></span>
              <span className="w-1 bg-cyan-neon rounded-full animate-bounce h-4" style={{ animationDelay: "150ms" }}></span>
              <span className="w-1 bg-cyan-neon rounded-full animate-bounce h-2" style={{ animationDelay: "300ms" }}></span>
              <span className="w-1 bg-cyan-neon rounded-full animate-bounce h-3.5" style={{ animationDelay: "100ms" }}></span>
            </div>
          )}
        </div>

        {/* Speed Multiplier Selector (0.75x, 1x, 1.25x) */}
        <div className="flex items-center space-x-1 rtl:space-x-reverse bg-navy-900 p-1 rounded-lg border border-slate-800 text-[10px]">
          <span className="text-slate-400 px-1 font-semibold">Speed:</span>
          {[0.75, 1.0, 1.25].map((rate) => (
            <button
              key={rate}
              onClick={() => changeSpeed(rate)}
              className={`px-2 py-0.5 rounded transition font-mono font-bold ${
                playbackRate === rate
                  ? "bg-cyan-500 text-navy-950 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
