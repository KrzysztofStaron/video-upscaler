"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function formatTime(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [upscaledUrl, setUpscaledUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [originalFps, setOriginalFps] = useState<number | null>(null);
  const [targetFps, setTargetFps] = useState(60);
  const [error, setError] = useState("");

  const originalRef = useRef<HTMLVideoElement>(null);
  const upscaledRef = useRef<HTMLVideoElement>(null);

  const hasVideo = useMemo(() => Boolean(originalUrl), [originalUrl]);

  useEffect(() => {
    if (!originalRef.current) return;
    const v = originalRef.current;
    const onLoaded = () => {
      setDuration(v.duration || 0);
      setCurrentTime(0);
      // Simple fps hint: if browser reports total frames, estimate quickly
      const quality = (v as any).getVideoPlaybackQuality?.();
      if (quality && typeof quality.totalVideoFrames === "number" && v.duration > 0) {
        const approx = Math.round(quality.totalVideoFrames / v.duration) || 30;
        setOriginalFps(approx);
      } else {
        setOriginalFps(30);
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [originalUrl]);

  const pickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/*";
    input.onchange = () => {
      const f = input.files?.[0];
      if (!f) return;
      handleSelectedFile(f);
    };
    input.click();
  };

  const handleSelectedFile = (f: File) => {
    if (!f.type.startsWith("video/")) {
      setError("Please select a video file.");
      return;
    }
    setError("");
    setFile(f);
    const url = URL.createObjectURL(f);
    setOriginalUrl(url);
    // For now, preview the same video on the right until upscaling is wired
    setUpscaledUrl(url);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSelectedFile(f);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const playBoth = () => {
    originalRef.current?.play();
    upscaledRef.current?.play();
  };

  const pauseBoth = () => {
    originalRef.current?.pause();
    upscaledRef.current?.pause();
  };

  const seekBoth = (t: number) => {
    if (originalRef.current) originalRef.current.currentTime = t;
    if (upscaledRef.current) upscaledRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const reset = () => {
    setFile(null);
    setOriginalUrl("");
    setUpscaledUrl("");
    setOriginalFps(null);
    setTargetFps(60);
    setDuration(0);
    setCurrentTime(0);
    setError("");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-neutral-950 via-zinc-950 to-black text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 md:px-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Video Upscaler</h1>
          <p className="max-w-2xl text-sm text-zinc-400">
            Upload a video to preview the original alongside the upscaled result. Controls keep both videos in sync.
            Choose your target frame rate and scrub the timeline to compare.
          </p>
        </header>

        {!hasVideo ? (
          <section
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            className={
              "group relative flex min-h-[280px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition " +
              (isDragging
                ? "border-emerald-500/60 bg-emerald-500/5"
                : "border-zinc-700 hover:border-zinc-500 bg-zinc-900/40")
            }
            onClick={pickFile}
            aria-label="Upload video"
          >
            <div className="pointer-events-none flex flex-col items-center gap-3 px-6 text-center">
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                Drag & drop or click to upload
              </div>
              <h2 className="text-lg font-medium">Drop your video here</h2>
              <p className="max-w-md text-sm text-zinc-400">
                MP4, MOV, or WEBM up to ~200MB. We’ll show a side-by-side preview once it’s loaded.
              </p>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <button className="rounded-md bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700" onClick={playBoth}>
                  Play both
                </button>
                <button className="rounded-md bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700" onClick={pauseBoth}>
                  Pause both
                </button>
                <button
                  className="rounded-md bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700"
                  onClick={() => seekBoth(0)}
                >
                  Restart
                </button>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs text-zinc-400" htmlFor="fps">
                  Target FPS
                </label>
                <input
                  id="fps"
                  type="range"
                  min={24}
                  max={120}
                  step={6}
                  value={targetFps}
                  onChange={e => setTargetFps(Number(e.target.value))}
                  className="h-1 w-40 appearance-none rounded bg-zinc-700 accent-emerald-400"
                />
                <span className="w-10 text-right text-sm tabular-nums">{targetFps}</span>
                <button
                  className="rounded-md bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
                  onClick={reset}
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <input
                type="range"
                min={0}
                max={Math.max(0, Math.floor(duration))}
                step={0.01}
                value={currentTime}
                onChange={e => seekBoth(Number(e.target.value))}
                className="h-1 w-full appearance-none rounded bg-zinc-700 accent-emerald-400"
                aria-label="Timeline"
              />
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <figure className="flex flex-col gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-3">
                <figcaption className="flex items-center justify-between text-sm">
                  <span className="font-medium">Original video</span>
                  <span className="text-zinc-400">{originalFps ? `${originalFps} fps` : "— fps"}</span>
                </figcaption>
                <video
                  ref={originalRef}
                  src={originalUrl}
                  className="aspect-video w-full rounded-lg bg-black"
                  controls
                  playsInline
                  preload="metadata"
                  onTimeUpdate={e => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                  muted
                  loop
                />
              </figure>
              <figure className="flex flex-col gap-2 rounded-xl border border-white/10 bg-gradient-to-b from-zinc-900/60 to-zinc-900/20 p-3">
                <figcaption className="flex items-center justify-between text-sm">
                  <span className="font-medium">Upscaled video</span>
                  <span className="text-zinc-400">{`${targetFps} fps`}</span>
                </figcaption>
                <video
                  ref={upscaledRef}
                  src={upscaledUrl}
                  className="aspect-video w-full rounded-lg bg-black"
                  controls
                  playsInline
                  preload="metadata"
                  muted
                  loop
                />
              </figure>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </div>
            ) : null}
          </section>
        )}

        <footer className="mt-6 text-center text-xs text-zinc-500">
          Tip: Use space to play/pause after focusing a video. Drag the slider to compare frames.
        </footer>
      </main>
    </div>
  );
}
