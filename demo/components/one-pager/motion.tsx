"use client";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

/**
 * The one-pager's motion and media primitives.
 *
 * Split into its own client module so the page itself stays a server
 * component: only these pieces ship JavaScript, and the copy, layout, and
 * imagery are still rendered on the server.
 *
 * Every animation here is an *entrance*. Nothing loops, pulses, or drifts
 * once it has arrived — DESIGN.md's register is calm and clinical, and a page
 * that keeps moving while it is being read is the "toy-like consumer app"
 * anti-reference. Motion's job is to reveal the document as the reader
 * travels down it, then get out of the way.
 */

/**
 * Reveal on scroll: fade up as the element enters the viewport, once.
 *
 * `whileInView` with `viewport={{ once: true }}` rather than a scroll
 * listener, so an element that starts on screen animates immediately and one
 * that is scrolled past stays put instead of replaying.
 *
 * `amount: 0.15` fires when a sixth of the element is showing. A higher
 * threshold leaves tall cards blank until they are almost fully on screen,
 * which reads as a loading failure rather than an entrance.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const still = useReducedMotion();

  // Reduced motion: render the content plainly. Not a zero-duration
  // animation — framer would still add a transform, and the point is that
  // nothing moves at all.
  if (still) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A group whose children arrive one after another.
 *
 * The stagger is applied by index here rather than with framer's variant
 * propagation. Variants inherited through a parent stop working the moment a
 * child is wrapped in another component that does not forward them — the
 * blank-slide failure the deck hit — so each child carries its own
 * `whileInView` and its own delay, and cannot be silently orphaned.
 */
export function RevealGroup({
  children,
  className = "",
  step = 0.07,
}: {
  children: React.ReactNode;
  className?: string;
  /** Seconds between one child's arrival and the next. */
  step?: number;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className={className}>
      {items.map((child, i) => (
        <Reveal key={i} delay={i * step}>
          {child}
        </Reveal>
      ))}
    </div>
  );
}

/**
 * A silent, looping video that only plays while it is on screen.
 *
 * Autoplay is allowed by browsers only for muted, inline video, so all three
 * attributes are mandatory rather than stylistic. Playback is gated on
 * intersection because a decorative loop running off-screen costs battery on
 * exactly the phones this page is read on.
 *
 * The poster carries the first frame, so the block never renders as an empty
 * box while the video loads — and if the video never loads (or the viewer has
 * asked for reduced motion) the poster simply stays, which is a complete and
 * correct rendering rather than a fallback.
 */
export function LoopVideo({
  src,
  poster,
  alt,
  className = "",
}: {
  src: string;
  poster: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const still = useReducedMotion();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || still) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rejects when the browser blocks autoplay; the poster is
          // already showing, so there is nothing to recover — just don't
          // throw an unhandled rejection into the console.
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [still]);

  // Reduced motion, or a video that failed to load: show the poster frame as
  // a still image. It is the same picture, minus the movement.
  if (still || failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={asset(poster)} alt={alt} className={className} />;
  }

  return (
    <video
      ref={ref}
      className={className}
      src={asset(src)}
      poster={asset(poster)}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
      onError={() => setFailed(true)}
    />
  );
}

/**
 * A counter that rolls up to its value when scrolled into view.
 *
 * The value is passed already formatted ("1.5B", "430M", "17%") because these
 * are quoted figures, not computed ones — the animation must never invent a
 * number that differs from the source. So the numeric part is parsed out,
 * animated, and re-joined with its own prefix and suffix, and the final frame
 * is the exact string that was passed in.
 */
export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const still = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(still ? value : null);

  useEffect(() => {
    if (still) {
      setShown(value);
      return;
    }
    const el = ref.current;
    if (!el) return;

    const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
    if (!match) {
      setShown(value);
      return;
    }
    const [, prefix, digits, suffix] = match;
    const target = parseFloat(digits);
    const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const DURATION = 900;
        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / DURATION);
          // Ease-out cubic: fast at first, settling gently — a linear count
          // reads as a stopwatch rather than a figure arriving.
          const eased = 1 - Math.pow(1 - t, 3);
          setShown(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`);
          if (t < 1) frame = requestAnimationFrame(tick);
          // The last frame is the source string itself, so rounding can never
          // leave "16.99%" on screen where the source says "17%".
          else setShown(value);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, still]);

  return (
    <span ref={ref} className={className}>
      {/* Before the observer fires there is no text; reserve the width with
          the real string held invisible so the card cannot jump when the
          count starts. */}
      {shown ?? <span className="invisible">{value}</span>}
    </span>
  );
}

/**
 * The treated/untreated bar, as the deck draws it: the treated segment grows
 * from nothing to its share once, when scrolled into view.
 *
 * The segment carries its own `whileInView` rather than inheriting a parent's
 * variant, for the same blank-on-deep-link reason as `RevealGroup`. The final
 * width is the quoted figure itself, so the animation cannot misstate it.
 */
export function GapBar({ treated, untreated }: { treated: number; untreated: number }) {
  const still = useReducedMotion();
  const width = `${treated}%`;
  return (
    <div
      role="img"
      aria-label={`${treated}% treated, ${untreated}% untreated`}
      className="flex h-11 w-full overflow-hidden rounded-full bg-[#E4EEF0]"
    >
      <motion.div
        className="flex items-center justify-center bg-teal-ink text-[14px] font-extrabold text-white"
        initial={{ width: still ? width : 0 }}
        whileInView={{ width }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: still ? 0 : 1.2, delay: 0.2, ease: [0.22, 0.61, 0.36, 1] }}
      >
        {treated}%
      </motion.div>
      <div className="flex flex-1 items-center justify-center text-[14px] font-extrabold text-slate-500">
        {untreated}%
      </div>
    </div>
  );
}

/**
 * The How-it-works film, ported from the deck's Room slide (2026-10-05).
 *
 * Unlike `LoopVideo` this is a film someone may want to watch, not a
 * decorative loop, so it carries the deck's controls: click anywhere to
 * play/pause, a corner button that appears on hover, and a scrub bar under the
 * caption. It still only plays while on screen, for the same battery reason.
 *
 * Reduced motion: no autoplay, and the browser's native controls instead of
 * the custom bar (they include their own seek bar).
 *
 * The duration is read off the element on mount as well as from the event:
 * from a warm cache `loadedmetadata` can fire before React attaches the
 * listener, which left the deck's bar ending at ~60% (Achi, 2026-09-06).
 */
export type FilmCaption = { n: string; from: number; name: string; line: string };

export function FilmPlayer({
  src,
  poster,
  alt,
  line,
  captions = [],
  lineFrom = 0,
}: {
  src: string;
  poster: string;
  alt: string;
  line: string;
  /** Step captions, each shown from its `from` second until the next one. */
  captions?: FilmCaption[];
  /** The second at which the captions hand back to `line`. */
  lineFrom?: number;
}) {
  const still = useReducedMotion() === true;
  const ref = useRef<HTMLVideoElement>(null);
  const [hover, setHover] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const known = duration > 0 && Number.isFinite(duration);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const read = () => {
      if (v.readyState >= 1 && Number.isFinite(v.duration) && v.duration > 0) setDuration(v.duration);
    };
    read();
    v.addEventListener("loadedmetadata", read);
    v.addEventListener("durationchange", read);
    return () => {
      v.removeEventListener("loadedmetadata", read);
      v.removeEventListener("durationchange", read);
    };
  }, []);

  // Autoplay while on screen, pause when scrolled away. A viewer who paused it
  // themselves is not overridden when it comes back into view.
  const userPaused = useRef(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !userPaused.current) void v.play().catch(() => {});
        else if (!entry.isIntersecting) v.pause();
      },
      { threshold: 0.3 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [still]);

  // The caption the film has reached. Before the first step, or past
  // `lineFrom`, the film's own line is shown instead.
  const step =
    captions.length > 0 && time < lineFrom
      ? [...captions].reverse().find((c) => time >= c.from)
      : undefined;

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      void v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <div
      className="group relative min-w-0 cursor-pointer overflow-hidden rounded-[28px] bg-brand-navy shadow-card print:shadow-none"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => {
        setHover(true);
        if (!still) toggle();
      }}
    >
      {/* 4:5 below sm so a phone gets a picture rather than a letterbox;
          object-cover shows more of the same frame's centre. */}
      <video
        ref={ref}
        className="block aspect-[4/5] w-full max-w-full object-cover sm:aspect-video"
        src={asset(src)}
        poster={asset(poster)}
        muted
        loop
        playsInline
        controls={still}
        preload="metadata"
        aria-label={alt}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
      />
      {!still && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
          aria-label={playing ? "Pause the film" : "Play the film"}
          className={`absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-brand-navy shadow-soft backdrop-blur transition-opacity duration-200 hover:bg-white ${
            hover || !playing ? "opacity-100" : "opacity-0"
          }`}
        >
          {playing ? (
            <Pause size={18} strokeWidth={2.4} aria-hidden />
          ) : (
            <Play size={18} strokeWidth={2.4} aria-hidden className="ml-0.5" />
          )}
        </button>
      )}
      {/* The caption and, under it, the scrub bar, in one gradient. The strip
          ignores the pointer so a click on the picture reaches the toggle;
          only the range input opts back in, and it stops its own click so
          seeking never also pauses. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B2340]/85 via-[#0B2340]/40 to-transparent px-6 pb-6 pt-24 sm:px-10 sm:pb-8">
        {/* One caption at a time, cross-fading on the step boundary. The
            min-height holds the strip steady so the scrub bar under it does
            not jump as captions of different lengths come and go. */}
        <div className="min-h-[7.5rem] sm:min-h-[8.5rem] flex flex-col justify-end" aria-hidden>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step ? step.n : "line"}
              initial={{ opacity: 0, y: still ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: still ? 0 : -4 }}
              transition={{ duration: still ? 0 : 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            >
              {step ? (
                <>
                  <p className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#7FE0DC]">
                    {step.n} &middot; {step.name}
                  </p>
                  <p className="mt-2 max-w-[46ch] text-pretty text-[15px] font-semibold leading-[1.45] text-white sm:text-[19px]">
                    {step.line}
                  </p>
                </>
              ) : (
                <p className="max-w-[22ch] text-balance text-[24px] font-extrabold leading-[1.1] tracking-[-0.02em] text-white sm:text-[36px]">
                  {line}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        {!still && (
          <input
            type="range"
            aria-label="Seek the film"
            min={0}
            max={known ? duration : 0}
            disabled={!known}
            step={0.01}
            value={known ? Math.min(time, duration) : 0}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const v = ref.current;
              const t = Number(e.currentTarget.value);
              if (!v || Number.isNaN(t) || !known) return;
              v.currentTime = Math.min(Math.max(t, 0), duration);
              setTime(v.currentTime);
            }}
            className={`pointer-events-auto mt-5 block h-4 w-full cursor-pointer accent-[#12AAA5] transition-opacity duration-200 sm:mt-6 ${
              hover || !playing ? "opacity-100" : "opacity-60"
            }`}
          />
        )}
      </div>
      {/* Every caption, for a screen reader: the visible one changes with the
          film, so on its own it would read out one step in five. */}
      <div className="sr-only">
        <p>{line}</p>
        {captions.length > 0 && (
          <ol>
            {captions.map((c) => (
              <li key={c.n}>
                {c.name}: {c.line}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/**
 * The living brand mark now lives in `components/ui.tsx`, beside the mark it
 * wraps, and is worn by the cover and the end-cap as well as this page.
 *
 * It started here because the shared component was being edited in a parallel
 * session and the loop was wanted on one page only. Both reasons are gone: that
 * session landed, and the owner asked for the same mark on the demo's first and
 * last screens (2026-09-02) — which is exactly where DESIGN.md already allowed
 * the brandmark to perform. Re-exported rather than moved-and-rewritten so the
 * page's import keeps working and there is still one definition.
 */
export { LiveBrandLogo } from "@/components/ui";
