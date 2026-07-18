import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect, type MouseEvent } from "react";
import { SkeletonAssembly } from "@/components/landing/SkeletonAssembly";
import {
  motion,
  useMotionValue,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  Brain,
  Layers,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageToggle } from "@/components/layout/LanguageToggle";
import { TextSizeToggle } from "@/components/layout/TextSizeToggle";
import { useLanguage } from "@/lib/useLanguage";

/* ── Reusable animation variants ─────────────────────────────────────────── */

const fadeUpBlur = {
  hidden: { opacity: 0, y: 44, filter: "blur(14px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { type: "spring" as const, stiffness: 160, damping: 22 },
  },
};

const staggerContainer = (stagger = 0.1, delay = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/* ── 3D Tilt Card ─────────────────────────────────────────────────────────── */

function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-8, 8]);
  const glareX = useTransform(x, [-0.5, 0.5], ["0%", "100%"]);
  const glareY = useTransform(y, [-0.5, 0.5], ["0%", "100%"]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d" }}
      whileHover={{ scale: 1.03, transition: { type: "spring", stiffness: 300, damping: 28 } }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative ${className ?? ""}`}
    >
      {/* glare overlay */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(0,242,254,0.045) 0%, transparent 55%)`,
          opacity: 0,
        }}
        whileHover={{ opacity: 0.85 }}
        transition={{ duration: 0.2 }}
      />
      {children}
    </motion.div>
  );
}

/* ── Count-up stat ────────────────────────────────────────────────────────── */

function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  const numMatch = value.match(/^\d+$/);
  const [displayed, setDisplayed] = useState(numMatch ? "0" : value);

  useEffect(() => {
    if (!isInView) return;
    if (!numMatch) { setDisplayed(value); return; }
    const target = parseInt(numMatch[0], 10);
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(String(Math.round(eased * target)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView]);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ type: "spring", stiffness: 180, damping: 20, delay: 0.1 }}
    >
      <div className="text-3xl font-black text-white">{displayed}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
    </motion.div>
  );
}


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Santix — Înțelege-ți corpul" },
      { name: "description", content: "Santix te ajută să explorezi corpul uman în 3D și să înțelegi mai ușor o durere, o mișcare sau o structură anatomică." },
      { property: "og:title", content: "Santix — Înțelege-ți corpul" },
      { property: "og:description", content: "Explorator 3D educațional pentru anatomie, dureri descrise simplu și întrebări ghidate." },
    ],
  }),
  component: SantixLanding,
});

// x/y: pixel positions over the 3D skeleton canvas (card 390px wide, canvas ≈ 540px tall)
// Calibrated to the skeleton-intro.glb proportions rendered at fov=28, camera z=11.
const skeletonZonesRo = [
  { id: "skull",  label: "Craniu",   description: "Protecție cerebrală și punct de pornire pentru simptome precum cefalee sau amețeală.", x: 194, y: 55  },
  { id: "chest",  label: "Torace",   description: "Coaste, stern și respirație. Ideal pentru explorarea durerilor toracice educaționale.", x: 194, y: 155 },
  { id: "arm",    label: "Braț",     description: "Umăr, humerus, cot și antebraț, cu accent pe mobilitate și traumatisme.", x: 100, y: 185 },
  { id: "pelvis", label: "Bazin",    description: "Centura pelviană conectează coloana cu membrele inferioare.", x: 194, y: 270 },
  { id: "knee",   label: "Genunchi", description: "Articulație complexă pentru stabilitate, mers și testarea durerilor mecanice.", x: 155, y: 370 },
  { id: "ankle",  label: "Gleznă",   description: "Stabilitate, propulsie și entorse frecvente în mișcare.", x: 220, y: 450 },
] as const;

const skeletonZonesEn = [
  { id: "skull",  label: "Skull",   description: "Brain protection and starting point for symptoms such as headache or dizziness.", x: 194, y: 55  },
  { id: "chest",  label: "Thorax",  description: "Ribs, sternum and breathing. Ideal for exploring educational chest pain.", x: 194, y: 155 },
  { id: "arm",    label: "Arm",     description: "Shoulder, humerus, elbow and forearm, with a focus on mobility and injuries.", x: 100, y: 185 },
  { id: "pelvis", label: "Pelvis",  description: "The pelvic girdle connects the spine to the lower limbs.", x: 194, y: 270 },
  { id: "knee",   label: "Knee",    description: "Complex joint for stability, walking and testing mechanical pain.", x: 155, y: 370 },
  { id: "ankle",  label: "Ankle",   description: "Stability, propulsion and frequent sprains during movement.", x: 220, y: 450 },
] as const;

function SantixLanding() {
  const { lang, t } = useLanguage();

  return (
    <div className="santix-intro relative min-h-screen overflow-hidden bg-[#050709] text-white">
      {/* Background layers */}
      <div className="pointer-events-none absolute inset-0 santix-grid" />
      <div className="pointer-events-none absolute inset-0 santix-aura" />
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-px santix-scan" />

      {/* Animated ambient orbs */}
      <motion.div
        className="pointer-events-none absolute left-[8%] top-[14%] hidden h-72 w-72 rounded-full sm:block"
        style={{ background: "radial-gradient(circle, rgba(0,242,254,0.07) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.18, 1], opacity: [0.32, 0.55, 0.32] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute right-[10%] top-[30%] hidden h-56 w-56 rounded-full sm:block"
        style={{ background: "radial-gradient(circle, rgba(0,144,254,0.055) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.16, 1], opacity: [0.28, 0.46, 0.28] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[20%] left-[40%] hidden h-80 w-80 rounded-full sm:block"
        style={{ background: "radial-gradient(circle, rgba(0,242,254,0.035) 0%, transparent 72%)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.32, 0.18] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />

      {/* Header */}
      <motion.header
        className="relative z-10 flex flex-wrap items-center gap-3 px-4 py-4 md:flex-nowrap md:px-10 md:py-5"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.05 }}
      >
        <Link to="/" aria-label="Santix" className="flex min-h-11 items-center">
          <span className="text-xl font-black tracking-[0.08em]">
            San<span className="text-cyan-300">tix</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-8 text-sm text-slate-400 md:flex">
          <Link to="/glosar" className="transition hover:text-white">{t.nav_ghid}</Link>
          <Link to="/quiz" className="transition hover:text-white">{t.nav_quiz}</Link>
        </nav>

        <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2 md:ml-0">
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link
              to="/explorator"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-bold text-black shadow-[0_0_22px_rgba(0,242,254,0.20)] transition-shadow hover:shadow-[0_0_34px_rgba(0,242,254,0.36)]"
            >
              {t.landing_start}
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
          <TextSizeToggle />
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </motion.header>

      <main className="relative z-10">
        {/* ── HERO ── */}
        <section className="mx-auto grid min-h-[calc(100vh-84px)] max-w-7xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 md:grid-cols-[1.02fr_0.98fr] md:px-10 md:pb-20 md:pt-10">

          {/* Left column — animated stagger */}
          <motion.div
            className="max-w-3xl"
            variants={staggerContainer(0.1, 0.1)}
            initial="hidden"
            animate="visible"
          >
            {/* Title */}
            <motion.h1
              variants={fadeUpBlur}
              className="max-w-4xl text-4xl font-black leading-[0.96] tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl"
            >
              San<span className="santix-title-gradient">tix</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUpBlur}
              className="mt-5 max-w-xl text-base leading-7 text-slate-400 sm:mt-7 sm:text-lg sm:leading-8"
            >
              {t.landing_account_desc}
            </motion.p>

            {/* CTA buttons */}
            <motion.div variants={fadeUpBlur} className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              <motion.div whileHover={{ scale: 1.04, y: -3 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/explorator"
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 px-7 py-4 text-sm font-bold text-black shadow-[0_0_28px_rgba(0,242,254,0.24)] transition-shadow hover:shadow-[0_0_44px_rgba(0,242,254,0.42)]"
                >
                  {t.landing_start}
                  <MousePointerClick className="size-4" />
                </Link>
              </motion.div>
              <motion.a
                href="#flux"
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-300/20 bg-white/[0.02] px-7 py-4 text-sm font-semibold text-slate-300 hover:border-cyan-300/55 hover:bg-cyan-300/5 hover:text-white transition-all"
              >
                {t.landing_how}
                <Sparkles className="size-4 text-cyan-300" />
              </motion.a>
            </motion.div>

            {/* Stats */}
            <motion.div variants={fadeUpBlur} className="mt-10 grid max-w-2xl grid-cols-3 gap-3 sm:mt-16 sm:gap-6">
              <AnimatedStat value={t.landing_stat1_val} label={t.landing_stat1_label} />
              <AnimatedStat value={t.landing_stat2_val} label={t.landing_stat2_label} />
              <AnimatedStat value={t.landing_stat3_val} label={t.landing_stat3_label} />
            </motion.div>
          </motion.div>

          {/* Right column — skeleton preview */}
          <motion.div
            className="relative hidden min-h-[620px] items-center justify-center md:flex"
            initial={{ opacity: 0, x: 60, filter: "blur(16px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 100, damping: 22, delay: 0.4 }}
          >
            <NeonSkeletonPreview lang={lang} selectedZoneLabel={t.landing_selected_zone} />
          </motion.div>
        </section>

        {/* ── FEATURES ── */}
        <FeatureSection t={t} />

        {/* ── STEPS ── */}
        <StepsSection t={t} />
      </main>
    </div>
  );
}

/* ── Feature section (staggered, 3D tilt cards) ──────────────────────────── */

type TranslationBag = ReturnType<typeof useLanguage>["t"];

function FeatureSection({ t }: { t: TranslationBag }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-120px" });
  const featureCards = [
    {
      icon: Layers,
      title: t.landing_feature1_title,
      text: t.landing_feature2_desc,
      cardClass: "rounded-[1.35rem] border-cyan-300/10 bg-white/[0.03]",
      iconClass: "rounded-2xl border-cyan-300/[0.18] bg-cyan-300/[0.09] text-cyan-300",
    },
    {
      icon: Brain,
      title: t.landing_feature2_title,
      text: t.landing_feature3_desc,
      cardClass: "rounded-3xl border-white/10 bg-white/[0.026] md:mt-8",
      iconClass: "rounded-xl border-sky-300/[0.16] bg-sky-300/[0.08] text-sky-200",
    },
    {
      icon: ShieldCheck,
      title: t.landing_feature3_title,
      text: t.landing_feature4_desc,
      cardClass: "rounded-[1.6rem] border-cyan-300/[0.08] bg-black/25 md:mt-3",
      iconClass: "rounded-2xl border-white/[0.12] bg-white/[0.045] text-cyan-200",
    },
  ];

  return (
    <section id="anatomie" ref={ref} className="border-t border-cyan-300/10 px-4 py-16 sm:px-6 sm:py-24 md:px-10">
      <motion.div
        className="mx-auto mb-12 max-w-7xl"
        initial={{ opacity: 0, y: 36 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ type: "spring", stiffness: 160, damping: 22 }}
      >
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{t.landing_features_title}</p>
        <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
          {t.landing_feature1_desc}
        </h2>
      </motion.div>

      <motion.div
        className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3"
        variants={staggerContainer(0.14)}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
      >
        {featureCards.map(({ icon: Icon, title, text, cardClass, iconClass }) => (
          <motion.div key={title} variants={fadeUpBlur}>
            <TiltCard>
              <article className={`group border p-7 shadow-[0_16px_48px_rgba(0,0,0,0.22)] ${cardClass}`}>
                <motion.div
                  className={`mb-6 flex size-12 items-center justify-center border ${iconClass}`}
                  whileHover={{ scale: 1.08, rotate: 4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                >
                  <Icon className="size-5" />
                </motion.div>
                <h3 className="text-xl font-black tracking-tight text-white group-hover:text-cyan-100 transition-colors">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition-colors">{text}</p>
              </article>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

/* ── Steps section (staggered entrance) ──────────────────────────────────── */

function StepsSection({ t }: { t: TranslationBag }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const stepCards = [
    {
      number: t.landing_step1_num,
      title: t.landing_step1_title,
      text: t.landing_step1_desc,
      cardClass: "rounded-[1.4rem] border-white/10 bg-white/[0.028]",
    },
    {
      number: t.landing_step2_num,
      title: t.landing_step2_title,
      text: t.landing_step2_desc,
      cardClass: "rounded-3xl border-cyan-300/[0.09] bg-cyan-300/[0.025] md:mt-6",
    },
    {
      number: t.landing_step3_num,
      title: t.landing_step3_title,
      text: t.landing_step3_desc,
      cardClass: "rounded-[1.55rem] border-white/10 bg-black/25 md:mt-2",
    },
  ];

  return (
    <section id="flux" ref={ref} className="px-4 pb-20 sm:px-6 sm:pb-28 md:px-10">
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-10 flex items-end justify-between gap-6"
          initial={{ opacity: 0, y: 32 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">{t.landing_how_title}</p>
            <h2 className="mt-4 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
              {t.landing_how_subtitle}
            </h2>
          </div>
          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} className="hidden md:block">
            <Link
              to="/explorator"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-black hover:-translate-y-0.5 transition-transform"
            >
              {t.landing_start}
              <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="grid gap-5 md:grid-cols-3"
          variants={staggerContainer(0.18)}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {stepCards.map(({ number, title, text, cardClass }) => (
            <motion.div key={title} variants={fadeUpBlur}>
              <TiltCard>
                <article className={`group h-full border p-7 ${cardClass}`}>
                  <motion.div
                    className="text-5xl font-black text-cyan-300/[0.18]"
                    whileHover={{ scale: 1.04, color: "rgba(0,242,254,0.34)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  >
                    {number}
                  </motion.div>
                  <h3 className="mt-5 text-xl font-black text-white group-hover:text-cyan-100 transition-colors">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400 group-hover:text-slate-300 transition-colors">{text}</p>
                </article>
              </TiltCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function NeonSkeletonPreview({ lang, selectedZoneLabel }: { lang: "ro" | "en"; selectedZoneLabel: string }) {
  const zones = lang === "en" ? skeletonZonesEn : skeletonZonesRo;
  const [activeZone, setActiveZone] = useState<(typeof zones)[number]>(zones[0]);

  // Derive once — avoids repeating activeZone.id === "X" dozens of times in JSX
  const az = activeZone.id;

  return (
    <div className="relative h-[640px] w-[390px]">
      <div className="absolute inset-0 rounded-full bg-cyan-300/[0.045] blur-3xl" />
      <div className="absolute -left-5 top-40 size-20 rounded-full border border-cyan-300/12 bg-cyan-300/[0.015]" />
      <div className="absolute -right-4 bottom-24 size-16 rounded-full border border-cyan-300/12 bg-cyan-300/[0.015]" />

      <div className="relative h-full overflow-hidden rounded-[2rem] border border-cyan-300/10 bg-[#03090b]/80 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
        {/* 3D skeleton with cinematic cascade assembly + 3D-anchored zone dots */}
        <div className="absolute inset-x-0 top-0" style={{ height: "calc(100% - 100px)" }}>
          <SkeletonAssembly
            zones={zones}
            activeId={az}
            onSelect={(id) => {
              const next = zones.find((z) => z.id === id);
              if (next) setActiveZone(next as (typeof zones)[number]);
            }}
          />
        </div>
        {/* keep SVG below as invisible placeholder to avoid layout shift — hidden */}
        <svg aria-hidden="true" className="hidden" viewBox="0 0 340 500">

          <defs>
            <filter id="ng" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0.9 0 0 0 0 1 0 0 0 0.7 0" result="g" />
              <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="ngs" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4.5" result="b" />
              <feColorMatrix in="b" type="matrix" values="0 0 0 0 0 0 0 0 0 0.95 0 0 0 0 1 0 0 0 0.88 0" result="g" />
              <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>

          {/* ── SKULL ── */}
          <g filter={az==="skull" ? "url(#ngs)" : "url(#ng)"} style={{transition:"filter .25s"}}>
            {/* cranium */}
            <ellipse cx="170" cy="42" rx="26" ry="30"
              fill={az==="skull" ? "rgba(0,242,254,.13)" : "rgba(0,242,254,.04)"}
              stroke={az==="skull" ? "rgba(0,242,254,.92)" : "rgba(0,242,254,.38)"} strokeWidth="1.4"/>
            {/* orbital arches — subtle arched lines, not big holes */}
            <path d="M157 40 Q161 36 165 40" fill="none"
              stroke={az==="skull" ? "rgba(0,242,254,.75)" : "rgba(0,242,254,.28)"} strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M175 40 Q179 36 183 40" fill="none"
              stroke={az==="skull" ? "rgba(0,242,254,.75)" : "rgba(0,242,254,.28)"} strokeWidth="1.2" strokeLinecap="round"/>
            {/* nasal aperture */}
            <path d="M168 48 L170 52 L172 48" fill="none"
              stroke={az==="skull" ? "rgba(0,242,254,.6)" : "rgba(0,242,254,.2)"} strokeWidth="1" strokeLinecap="round"/>
            {/* cheekbones */}
            <path d="M145 44 Q152 50 156 52" fill="none"
              stroke={az==="skull" ? "rgba(0,242,254,.55)" : "rgba(0,242,254,.18)"} strokeWidth="1" strokeLinecap="round"/>
            <path d="M195 44 Q188 50 184 52" fill="none"
              stroke={az==="skull" ? "rgba(0,242,254,.55)" : "rgba(0,242,254,.18)"} strokeWidth="1" strokeLinecap="round"/>
            {/* mandible */}
            <path d="M147 58 Q148 72 170 75 Q192 72 193 58"
              fill={az==="skull" ? "rgba(0,242,254,.09)" : "rgba(0,242,254,.02)"}
              stroke={az==="skull" ? "rgba(0,242,254,.85)" : "rgba(0,242,254,.32)"} strokeWidth="1.4"/>
            {/* midface suture line */}
            <line x1="170" y1="13" x2="170" y2="55"
              stroke={az==="skull" ? "rgba(0,242,254,.35)" : "rgba(0,242,254,.1)"} strokeWidth="0.7" strokeDasharray="3,3"/>
          </g>

          {/* ── CERVICAL SPINE + CLAVICLES ── */}
          <g filter="url(#ng)" opacity={az==="skull"||az==="chest" ? 0.88 : 0.52}>
            {[76,83,90].map(y=>(
              <rect key={y} x="166" y={y} width="8" height="5" rx="1.5"
                fill="rgba(0,242,254,.05)" stroke="rgba(0,242,254,.38)" strokeWidth="1"/>
            ))}
            <path d="M170 99 Q148 97 126 108" fill="none" stroke="rgba(0,242,254,.48)" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M170 99 Q192 97 214 108" fill="none" stroke="rgba(0,242,254,.48)" strokeWidth="1.7" strokeLinecap="round"/>
          </g>

          {/* ── RIBCAGE ── */}
          <g filter={az==="chest" ? "url(#ngs)" : "url(#ng)"} style={{transition:"filter .25s"}}>
            <rect x="167" y="108" width="6" height="62" rx="3"
              fill={az==="chest" ? "rgba(0,242,254,.18)" : "rgba(0,242,254,.06)"}
              stroke={az==="chest" ? "rgba(0,242,254,.9)" : "rgba(0,242,254,.4)"} strokeWidth="1.2"/>
            {[0,1,2,3,4,5,6].map(i => {
              const y=113+i*9; const w=34-i*2; const a=az==="chest";
              return <g key={i}>
                <path d={`M170 ${y} Q${170-w*.5} ${y+2} ${170-w} ${y+6} Q${170-w-5} ${y+10} ${170-w-3} ${y+14}`}
                  fill="none" stroke={a?"rgba(0,242,254,.82)":"rgba(0,242,254,.3)"} strokeWidth="1.3" strokeLinecap="round"/>
                <path d={`M170 ${y} Q${170+w*.5} ${y+2} ${170+w} ${y+6} Q${170+w+5} ${y+10} ${170+w+3} ${y+14}`}
                  fill="none" stroke={a?"rgba(0,242,254,.82)":"rgba(0,242,254,.3)"} strokeWidth="1.3" strokeLinecap="round"/>
              </g>;
            })}
          </g>

          {/* ── ARMS ── */}
          <g filter={az==="arm" ? "url(#ngs)" : "url(#ng)"} style={{transition:"filter .25s"}}>
            {/* scapula hints */}
            <path d="M126 108 Q116 118 118 136 Q122 143 128 140" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.75)" : "rgba(0,242,254,.27)"} strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M214 108 Q224 118 222 136 Q218 143 212 140" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.75)" : "rgba(0,242,254,.27)"} strokeWidth="1.3" strokeLinecap="round"/>
            {/* humerus */}
            <path d="M120 113 Q110 142 108 174" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.88)" : "rgba(0,242,254,.4)"} strokeWidth="5" strokeLinecap="round"/>
            <path d="M220 113 Q230 142 232 174" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.88)" : "rgba(0,242,254,.4)"} strokeWidth="5" strokeLinecap="round"/>
            {/* elbow */}
            <circle cx="107" cy="176" r="5"
              fill={az==="arm" ? "rgba(0,242,254,.2)" : "rgba(0,242,254,.06)"}
              stroke={az==="arm" ? "rgba(0,242,254,.9)" : "rgba(0,242,254,.38)"} strokeWidth="1.2"/>
            <circle cx="233" cy="176" r="5"
              fill={az==="arm" ? "rgba(0,242,254,.2)" : "rgba(0,242,254,.06)"}
              stroke={az==="arm" ? "rgba(0,242,254,.9)" : "rgba(0,242,254,.38)"} strokeWidth="1.2"/>
            {/* radius + ulna */}
            <path d="M104 181 Q97 208 95 243" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.8)" : "rgba(0,242,254,.3)"} strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M110 181 Q106 209 106 244" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.65)" : "rgba(0,242,254,.22)"} strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M236 181 Q243 208 245 243" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.8)" : "rgba(0,242,254,.3)"} strokeWidth="3.5" strokeLinecap="round"/>
            <path d="M230 181 Q234 209 234 244" fill="none"
              stroke={az==="arm" ? "rgba(0,242,254,.65)" : "rgba(0,242,254,.22)"} strokeWidth="2.2" strokeLinecap="round"/>
            {/* fingers */}
            <path d="M91 245 Q88 252 89 258 M95 246 Q93 253 94 259 M100 246 Q98 254 99 260 M105 246 Q105 253 106 259"
              fill="none" stroke={az==="arm" ? "rgba(0,242,254,.62)" : "rgba(0,242,254,.2)"}
              strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M249 245 Q252 252 251 258 M245 246 Q247 253 246 259 M240 246 Q242 254 241 260 M235 246 Q235 253 234 259"
              fill="none" stroke={az==="arm" ? "rgba(0,242,254,.62)" : "rgba(0,242,254,.2)"}
              strokeWidth="1.5" strokeLinecap="round"/>
          </g>

          {/* ── LUMBAR SPINE ── */}
          <g filter="url(#ng)" opacity="0.48">
            {[0,1,2,3,4].map(i=>(
              <rect key={i} x="164" y={174+i*9} width="12" height="7" rx="2"
                fill="rgba(0,242,254,.05)" stroke="rgba(0,242,254,.33)" strokeWidth="1"/>
            ))}
          </g>

          {/* ── PELVIS ── */}
          <g filter={az==="pelvis" ? "url(#ngs)" : "url(#ng)"} style={{transition:"filter .25s"}}>
            <path d="M170 224 Q140 220 128 238 Q121 255 133 270 Q148 282 170 284 Q192 282 207 270 Q219 255 212 238 Q200 220 170 224Z"
              fill={az==="pelvis" ? "rgba(0,242,254,.12)" : "rgba(0,242,254,.04)"}
              stroke={az==="pelvis" ? "rgba(0,242,254,.9)" : "rgba(0,242,254,.36)"} strokeWidth="1.4"/>
            <path d="M149 278 Q170 288 191 278" fill="none"
              stroke={az==="pelvis" ? "rgba(0,242,254,.72)" : "rgba(0,242,254,.26)"} strokeWidth="1.2"/>
            <path d="M163 226 Q167 248 168 268 M177 226 Q173 248 172 268" fill="none"
              stroke={az==="pelvis" ? "rgba(0,242,254,.6)" : "rgba(0,242,254,.2)"} strokeWidth="1"/>
          </g>

          {/* ── FEMURS + KNEES + LOWER LEGS ── */}
          <g filter={az==="knee" ? "url(#ngs)" : "url(#ng)"} style={{transition:"filter .25s"}}>
            {/* femur */}
            <path d="M153 284 Q147 325 144 360" fill="none"
              stroke={az==="knee" ? "rgba(0,242,254,.88)" : "rgba(0,242,254,.42)"} strokeWidth="6" strokeLinecap="round"/>
            <path d="M187 284 Q193 325 196 360" fill="none"
              stroke={az==="knee" ? "rgba(0,242,254,.88)" : "rgba(0,242,254,.42)"} strokeWidth="6" strokeLinecap="round"/>
            {/* patella */}
            <ellipse cx="143" cy="364" rx="8" ry="6"
              fill={az==="knee" ? "rgba(0,242,254,.22)" : "rgba(0,242,254,.07)"}
              stroke={az==="knee" ? "rgba(0,242,254,.92)" : "rgba(0,242,254,.4)"} strokeWidth="1.4"/>
            <ellipse cx="197" cy="364" rx="8" ry="6"
              fill={az==="knee" ? "rgba(0,242,254,.22)" : "rgba(0,242,254,.07)"}
              stroke={az==="knee" ? "rgba(0,242,254,.92)" : "rgba(0,242,254,.4)"} strokeWidth="1.4"/>
            {/* tibia */}
            <path d="M140 370 Q136 403 134 434" fill="none"
              stroke={az==="knee" ? "rgba(0,242,254,.85)" : "rgba(0,242,254,.38)"} strokeWidth="5" strokeLinecap="round"/>
            <path d="M200 370 Q204 403 206 434" fill="none"
              stroke={az==="knee" ? "rgba(0,242,254,.85)" : "rgba(0,242,254,.38)"} strokeWidth="5" strokeLinecap="round"/>
            {/* fibula */}
            <path d="M148 372 Q146 406 145 435" fill="none"
              stroke={az==="knee" ? "rgba(0,242,254,.58)" : "rgba(0,242,254,.22)"} strokeWidth="2" strokeLinecap="round"/>
            <path d="M192 372 Q194 406 195 435" fill="none"
              stroke={az==="knee" ? "rgba(0,242,254,.58)" : "rgba(0,242,254,.22)"} strokeWidth="2" strokeLinecap="round"/>
          </g>

          {/* ── ANKLE + FOOT ── */}
          <g filter={az==="ankle" ? "url(#ngs)" : "url(#ng)"} style={{transition:"filter .25s"}}>
            <ellipse cx="137" cy="437" rx="7" ry="5"
              fill={az==="ankle" ? "rgba(0,242,254,.2)" : "rgba(0,242,254,.05)"}
              stroke={az==="ankle" ? "rgba(0,242,254,.9)" : "rgba(0,242,254,.33)"} strokeWidth="1.2"/>
            <ellipse cx="203" cy="437" rx="7" ry="5"
              fill={az==="ankle" ? "rgba(0,242,254,.2)" : "rgba(0,242,254,.05)"}
              stroke={az==="ankle" ? "rgba(0,242,254,.9)" : "rgba(0,242,254,.33)"} strokeWidth="1.2"/>
            {/* foot shape */}
            <path d="M133 441 L123 453 Q119 457 146 457 L148 450 L136 442Z"
              fill={az==="ankle" ? "rgba(0,242,254,.13)" : "rgba(0,242,254,.04)"}
              stroke={az==="ankle" ? "rgba(0,242,254,.82)" : "rgba(0,242,254,.28)"} strokeWidth="1.2" strokeLinejoin="round"/>
            <path d="M207 441 L217 453 Q221 457 194 457 L192 450 L204 442Z"
              fill={az==="ankle" ? "rgba(0,242,254,.13)" : "rgba(0,242,254,.04)"}
              stroke={az==="ankle" ? "rgba(0,242,254,.82)" : "rgba(0,242,254,.28)"} strokeWidth="1.2" strokeLinejoin="round"/>
            {/* toes */}
            <path d="M123 453 L121 460 M128 455 L127 461 M133 456 L132 462 M138 456 L137 461 M143 455 L143 460"
              fill="none" stroke={az==="ankle" ? "rgba(0,242,254,.68)" : "rgba(0,242,254,.2)"}
              strokeWidth="1.4" strokeLinecap="round"/>
            <path d="M217 453 L219 460 M212 455 L213 461 M207 456 L208 462 M202 456 L203 461 M197 455 L197 460"
              fill="none" stroke={az==="ankle" ? "rgba(0,242,254,.68)" : "rgba(0,242,254,.2)"}
              strokeWidth="1.4" strokeLinecap="round"/>
          </g>
        </svg>

        <div className="santix-selection-panel absolute bottom-3 left-4 right-4 rounded-2xl border border-cyan-300/15 bg-black/55 px-4 py-3 backdrop-blur-xl">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{selectedZoneLabel}</div>
          <AnimatePresence mode="wait">
            <motion.div
              key={az}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
            >
              <div className="santix-selection-title mt-1 text-base font-black text-white">{activeZone.label}</div>
              <p className="santix-selection-copy mt-1 text-xs leading-5 text-slate-400">{activeZone.description}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
