"use client";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { BrandLogo } from "@/components/ui";

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
 * The 17-in-100 grid, with each filled mark arriving in turn.
 *
 * The distribution is computed by the caller and passed in, so the animation
 * cannot change which cells are filled — only when they appear.
 */
export function DotGrid({ cells }: { cells: boolean[] }) {
  const still = useReducedMotion();
  let filledSeen = 0;

  return (
    <div aria-hidden className="grid grid-cols-10 gap-[3px]">
      {cells.map((filled, i) => {
        // Filled marks stagger in reading order; empty cells are just there.
        const delay = filled ? 0.24 + filledSeen++ * 0.045 : 0;
        const base = "aspect-square rounded-[2px]";
        const tone = filled ? "bg-brand-teal" : "bg-[#D8E5E8]";

        if (still || !filled) return <span key={i} className={`${base} ${tone}`} />;

        return (
          <motion.span
            key={i}
            className={`${base} ${tone}`}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.32, delay, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

/**
 * The brand mark, alive.
 *
 * The owner's note, 2026-09-02: "make the Hearfy logo move… again, then they
 * stopped" — the shared `BrandLogo` plays its entry once (arc, bars, dot, in
 * reading order) and then sits still, which reads as an animation that broke
 * rather than one that finished.
 *
 * So this wraps the shared mark and adds a continuous second layer: the three
 * sound bars breathe, staggered, the way a level meter does. That is the one
 * loop on the page that earns itself — this is a hearing brand, and the bars
 * are a signal, so motion there means "sound", not "decoration". Nothing else
 * on the page loops.
 *
 * Why wrap rather than edit `components/ui.tsx`: that component is shared by
 * every screen in the demo (a chrome-bar logo that pulsed on all 27 screens
 * would be exactly the toy-app register PRODUCT.md rules out) AND it is being
 * edited concurrently in another session. Scaling the bars from here keeps
 * the loop on this page only, and keeps this change out of their diff.
 *
 * The animation targets the three <rect> bars by their position in the SVG —
 * the mark is arc, bar, bar, bar, dot — via CSS on nth-of-type, so no change
 * to the shared component is needed. `motion-safe:` means the whole thing is
 * dropped for a viewer who asked for reduced motion, with no JS check.
 */
export function LiveBrandLogo({ size = "lg" }: { size?: "sm" | "lg" }) {
  return (
    <span className="op-live-logo inline-flex">
      <BrandLogo size={size} animate />
    </span>
  );
}
