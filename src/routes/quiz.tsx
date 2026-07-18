import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bones } from "@/data/bones";
import { Brain, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { useLanguage } from "@/lib/useLanguage";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Test Rapid — Santix" },
      { name: "description", content: "Testează-ți cunoștințele de anatomie cu întrebări mixte: alegere multiplă și identificare în 3D." },
      { property: "og:title", content: "Test Rapid de Anatomie — Santix" },
      { property: "og:description", content: "Quiz interactiv despre oasele corpului uman." },
    ],
  }),
  component: QuizPage,
});

interface Question {
  type: "mc" | "identify";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

function buildQuestions(lang: "ro" | "en"): Question[] {
  const find = (id: string) => bones.find((b) => b.id === id)!;

  if (lang === "en") {
    return [
      {
        type: "mc",
        question: "What is the longest bone in the human body?",
        options: ["Humerus", "Femur", "Tibia", "Sternum"],
        correctIndex: 1,
        explanation: `The ${find("femur").name} (${find("femur").latin}) is the longest and strongest bone in the body, supporting body weight during walking.`,
      },
      {
        type: "identify",
        question: 'Identify the bone: "Butterfly-shaped bone, articulating with all other cranial bones."',
        options: ["Ethmoid bone", "Sphenoid bone", "Occipital bone", "Temporal bone"],
        correctIndex: 1,
        explanation: "The sphenoid is central in the skull and contains the sella turcica for the pituitary gland.",
      },
      {
        type: "mc",
        question: "How many cervical vertebrae does the spine have?",
        options: ["5", "7", "12", "33"],
        correctIndex: 1,
        explanation: "All mammals (with rare exceptions) have 7 cervical vertebrae, regardless of neck length.",
      },
      {
        type: "identify",
        question: "Which is the smallest bone in the body?",
        options: ["Malleus", "Incus", "Stapes", "Lacrimal bone"],
        correctIndex: 2,
        explanation: "The stapes (Stapes) measures only ~3 mm and is located in the middle ear.",
      },
      {
        type: "mc",
        question: "The mandible is…",
        options: [
          "The only movable bone of the skull",
          "The largest facial bone but fixed",
          "Made of two paired bones",
          "Part of the shoulder girdle",
        ],
        correctIndex: 0,
        explanation: "The mandible is the only movable bone of the skull, essential for chewing and speech.",
      },
      {
        type: "identify",
        question: "How many bones form the adult vertebral column?",
        options: ["24", "26", "30", "33"],
        correctIndex: 1,
        explanation: "26 bones: 7 cervical + 12 thoracic + 5 lumbar + sacrum + coccyx (the last two fused).",
      },
      {
        type: "mc",
        question: "How many ribs does the human body have?",
        options: ["10 pairs", "12 pairs", "14 pairs", "11 pairs"],
        correctIndex: 1,
        explanation: "12 pairs: 7 true, 3 false and 2 floating.",
      },
      {
        type: "identify",
        question: "Which bone is located laterally in the forearm, on the thumb side?",
        options: ["Ulna", "Humerus", "Radius", "Carpals"],
        correctIndex: 2,
        explanation: "The radius is lateral and allows forearm rotation (pronation/supination).",
      },
    ];
  }

  return [
    {
      type: "mc",
      question: "Care este cel mai lung os din corpul uman?",
      options: ["Humerus", "Femur", "Tibia", "Stern"],
      correctIndex: 1,
      explanation: `${find("femur").name} (${find("femur").latin}) este cel mai lung și puternic os din corp, susținând greutatea corpului în mers.`,
    },
    {
      type: "identify",
      question: 'Identifică osul: „Os în formă de fluture, articulat cu toate celelalte oase craniene."',
      options: ["Os etmoid", "Os sfenoid", "Os occipital", "Os temporal"],
      correctIndex: 1,
      explanation: "Sfenoidul este central în craniu și conține șaua turcească pentru hipofiză.",
    },
    {
      type: "mc",
      question: "Câte vertebre cervicale are coloana?",
      options: ["5", "7", "12", "33"],
      correctIndex: 1,
      explanation: "Toți mamiferele (cu rare excepții) au 7 vertebre cervicale, indiferent de lungimea gâtului.",
    },
    {
      type: "identify",
      question: "Care este cel mai mic os din corp?",
      options: ["Ciocanul", "Nicovala", "Scărița", "Os lacrimal"],
      correctIndex: 2,
      explanation: "Scărița (Stapes) măsoară doar ~3 mm și se află în urechea medie.",
    },
    {
      type: "mc",
      question: "Mandibula este…",
      options: [
        "Singurul os mobil al craniului",
        "Cel mai mare os al feței dar fix",
        "Format din două oase pereche",
        "Parte a centurii scapulare",
      ],
      correctIndex: 0,
      explanation: "Mandibula este singurul os mobil al craniului, esențial pentru masticație și vorbire.",
    },
    {
      type: "identify",
      question: "Câte oase formează coloana vertebrală adultă?",
      options: ["24", "26", "30", "33"],
      correctIndex: 1,
      explanation: "26 oase: 7 cervicale + 12 toracice + 5 lombare + sacrum + coccis (ultimele două fuzionate).",
    },
    {
      type: "mc",
      question: "Câte coaste are corpul uman?",
      options: ["10 perechi", "12 perechi", "14 perechi", "11 perechi"],
      correctIndex: 1,
      explanation: "12 perechi: 7 adevărate, 3 false și 2 flotante.",
    },
    {
      type: "identify",
      question: "Care os este situat lateral în antebraț, pe partea policelui?",
      options: ["Ulna", "Humerus", "Radius", "Carp"],
      correctIndex: 2,
      explanation: "Radiusul este lateral și permite rotația antebrațului (pronație/supinație).",
    },
  ];
}

/* ── Animated score percentage for results screen ──── */
function AnimatedPercent({ value }: { value: number }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [value]);
  return <>{displayed}%</>;
}

function QuizPage() {
  const { lang, t } = useLanguage();
  const questions = useMemo(() => buildQuestions(lang), [lang]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = forward

  const q = questions[idx];

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.correctIndex) setScore((s) => s + 1);
  };

  const next = () => {
    setDirection(1);
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  const reset = () => {
    setDirection(1);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  const cardVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "55%" : "-55%",
      opacity: 0,
      filter: "blur(14px)",
      scale: 0.94,
    }),
    center: {
      x: 0, opacity: 1, filter: "blur(0px)", scale: 1,
      transition: { type: "spring" as const, stiffness: 200, damping: 26 },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-55%" : "55%",
      opacity: 0, filter: "blur(10px)", scale: 0.94,
      transition: { duration: 0.22, ease: "easeIn" as const },
    }),
  };

  return (
    <div className="absolute inset-0 m-4 mt-2 rounded-3xl glass overflow-y-auto p-8 flex flex-col items-center text-foreground">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3 mb-2"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
        >
          <motion.div
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <Brain className="size-5 text-primary" />
          </motion.div>
          <span className="text-[10px] tracking-[0.22em] uppercase text-muted-foreground font-semibold">
            {t.quiz_title}
          </span>
        </motion.div>

        <motion.h1
          className="text-4xl font-bold tracking-tight text-foreground"
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.08 }}
        >
          {t.quiz_subtitle.split(" ").slice(0, -1).join(" ")}{" "}
          <span className="text-gradient-bone">{t.quiz_subtitle.split(" ").at(-1)}</span>
        </motion.h1>

        <AnimatePresence mode="wait">
        {!done ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress bar */}
            <div className="mt-8 flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>{t.quiz_question} {idx + 1} / {questions.length}</span>
              <motion.span
                key={score}
                initial={{ scale: 1.5, color: "oklch(0.82 0.17 205)" }}
                animate={{ scale: 1, color: "oklch(0.82 0.17 205)" }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="text-primary font-semibold"
              >
                {t.quiz_score} {score}
              </motion.span>
            </div>
            <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-bone-glow rounded-full"
                animate={{ width: `${((idx + (picked !== null ? 1 : 0)) / questions.length) * 100}%` }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </div>

            {/* Question card — slides in/out */}
            <div className="mt-8 overflow-hidden relative" style={{ minHeight: 360 }}>
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={idx}
                  custom={direction}
                  variants={cardVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="glass-strong rounded-3xl p-7"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 22, delay: 0.15 }}
                      className={`text-[10px] tracking-[0.18em] uppercase font-bold rounded-full px-2.5 py-1 ${
                        q.type === "mc"
                          ? "bg-accent/15 text-accent border border-accent/25"
                          : "bg-medical/15 text-medical border border-medical/25"
                      }`}
                    >
                      {q.type === "mc" ? t.quiz_multiple : t.quiz_identify}
                    </motion.span>
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight leading-snug text-foreground">{q.question}</h2>

                  {/* Answer buttons — staggered entrance */}
                  <motion.div
                    className="mt-6 grid gap-3"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
                    initial="hidden"
                    animate="visible"
                  >
                    {q.options.map((opt, i) => {
                      const isPicked = picked === i;
                      const isCorrect = i === q.correctIndex;
                      const showAnswer = picked !== null;
                      return (
                        <motion.div
                          key={i}
                          variants={{
                            hidden: { opacity: 0, x: -24, filter: "blur(6px)" },
                            visible: { opacity: 1, x: 0, filter: "blur(0px)",
                              transition: { type: "spring" as const, stiffness: 220, damping: 24 } },
                          }}
                          className={[
                            "quiz-answer-btn",
                            showAnswer && isPicked && !isCorrect ? "quiz-shake" : "",
                            showAnswer && isCorrect ? "quiz-pop" : "",
                          ].join(" ")}
                        >
                          <button
                            type="button"
                            onClick={() => handlePick(i)}
                            disabled={picked !== null}
                            className={`w-full flex items-center gap-3 text-left rounded-2xl px-5 py-4 border transition-colors duration-300 ${
                              showAnswer
                                ? isCorrect
                                  ? "bg-success/15 border-success/40 text-white"
                                  : isPicked
                                    ? "bg-destructive/15 border-destructive/40 text-white"
                                    : "bg-primary/[0.03] border-primary/10 text-muted-foreground opacity-60"
                                : "bg-primary/[0.055] border-primary/18 text-foreground hover:bg-primary/[0.10] hover:border-primary/35"
                            }`}
                          >
                            <span className={`size-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-300 ${
                              showAnswer && isCorrect
                                ? "bg-success text-white border-transparent scale-110"
                                : showAnswer && isPicked
                                  ? "bg-destructive text-destructive-foreground border-transparent"
                                  : "border-primary/35 text-primary"
                            }`}>
                              {showAnswer && isCorrect ? <Check className="size-4" /> :
                               showAnswer && isPicked  ? <X className="size-4" /> :
                               String.fromCharCode(65 + i)}
                            </span>
                            <span className="text-sm font-semibold tracking-tight">{opt}</span>
                          </button>
                        </motion.div>
                      );
                    })}
                  </motion.div>

                  {/* Explanation + Next */}
                  <AnimatePresence>
                    {picked !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.25 }}
                        className="mt-6 rounded-2xl bg-primary/10 border border-primary/20 p-4"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="size-3.5 text-primary" />
                          <span className="text-[10px] tracking-[0.22em] uppercase text-primary font-bold">
                            {t.quiz_explanation}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{q.explanation}</p>

                        <motion.button
                          onClick={next}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="mt-4 w-full rounded-2xl bg-primary text-primary-foreground font-semibold py-3 text-sm tracking-tight"
                        >
                          {idx + 1 >= questions.length ? t.quiz_see_result : t.quiz_next}
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.88, y: 40, filter: "blur(16px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            className="mt-10 glass-strong rounded-3xl p-10 text-center"
          >
            <motion.div
              className="size-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-bone-glow flex items-center justify-center mb-5 shadow-[var(--shadow-glow)]"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.1 }}
            >
              <Sparkles className="size-9 text-primary-foreground" />
            </motion.div>

            <motion.h2
              className="text-3xl font-bold tracking-tight text-foreground"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 22 }}
            >
              {t.quiz_finished}
            </motion.h2>

            <motion.p
              className="mt-2 text-muted-foreground"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              {t.quiz_correct_prefix}{" "}
              <span className="text-primary font-bold">{score}</span>{" "}
              {lang === "ro" ? "din" : "out of"}{" "}
              <span className="text-foreground font-bold">{questions.length}</span>{" "}
              {lang === "ro" ? "întrebări." : "questions."}
            </motion.p>

            <motion.div
              className="mt-6 text-6xl font-black text-gradient-bone"
              initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 200, damping: 16 }}
            >
              <AnimatedPercent value={Math.round((score / questions.length) * 100)} />
            </motion.div>

            <motion.button
              onClick={reset}
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 22 }}
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold px-8 py-3.5 text-sm shadow-[0_0_24px_rgba(0,242,254,0.35)]"
            >
              <RotateCcw className="size-4" /> {t.quiz_restart}
            </motion.button>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
