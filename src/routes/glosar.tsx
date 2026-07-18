import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  CircleHelp,
  Compass,
  Eye,
  FileText,
  History,
  Layers3,
  MapPin,
  MessageCircle,
  MousePointer2,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import type { TranslationKey } from "@/lib/translations";
import { useLanguage } from "@/lib/useLanguage";

export const Route = createFileRoute("/glosar")({
  head: () => ({
    meta: [
      { title: "Ghid Santix" },
      {
        name: "description",
        content:
          "Ghid practic pentru exploratorul 3D, AI-ul educațional, Ajutor Aproape și Optică/Vedere.",
      },
      { property: "og:title", content: "Ghid Santix" },
      {
        property: "og:description",
        content: "Află ce poți face în Santix și unde găsești fiecare funcție.",
      },
    ],
  }),
  component: GhidSantixPage,
});

type GuideNavItem = {
  id: string;
  label: TranslationKey;
};

const guideNavigation: GuideNavItem[] = [
  { id: "ghid-start", label: "ghid_toc_start" },
  { id: "ghid-explorer", label: "ghid_toc_explorer" },
  { id: "ghid-ai", label: "ghid_toc_ai" },
  { id: "ghid-nearby", label: "ghid_toc_nearby" },
  { id: "ghid-optics", label: "ghid_toc_optics" },
  { id: "ghid-account", label: "ghid_toc_account" },
  { id: "ghid-initiation", label: "ghid_toc_initiation" },
  { id: "ghid-safety", label: "ghid_toc_safety" },
  { id: "ghid-faq", label: "ghid_toc_faq" },
];

const modeRows = [
  ["ghid_mode_skeleton_title", "ghid_mode_skeleton_body"],
  ["ghid_mode_muscles_title", "ghid_mode_muscles_body"],
  ["ghid_mode_organs_title", "ghid_mode_organs_body"],
  ["ghid_mode_complete_title", "ghid_mode_complete_body"],
] as const satisfies ReadonlyArray<readonly [TranslationKey, TranslationKey]>;

const explorerControls = [
  [MousePointer2, "ghid_control_select"],
  [Search, "ghid_control_search"],
  [Target, "ghid_control_highlight"],
  [Compass, "ghid_control_focus"],
  [Layers3, "ghid_control_navigate"],
  [RotateCcw, "ghid_control_reset"],
] as const satisfies ReadonlyArray<readonly [typeof MousePointer2, TranslationKey]>;

const initiationMissions: TranslationKey[] = [
  "ghid_initiation_mission_1",
  "ghid_initiation_mission_2",
  "ghid_initiation_mission_3",
  "ghid_initiation_mission_4",
];

const safetyPoints: TranslationKey[] = [
  "ghid_safety_education",
  "ghid_safety_emergency",
  "ghid_safety_guest",
  "ghid_safety_sensitive",
];

const faqItems = [
  ["ghid_faq_q1", "ghid_faq_a1"],
  ["ghid_faq_q2", "ghid_faq_a2"],
  ["ghid_faq_q3", "ghid_faq_a3"],
  ["ghid_faq_q4", "ghid_faq_a4"],
] as const satisfies ReadonlyArray<readonly [TranslationKey, TranslationKey]>;

function GhidSantixPage() {
  const { t } = useLanguage();
  const text = (key: TranslationKey) => {
    const value = t[key];
    return typeof value === "string" ? value : "";
  };

  const toc = (
    <nav aria-label={t.ghid_toc_title} className="space-y-1">
      {guideNavigation.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="flex min-h-10 items-center border-l-2 border-transparent px-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground focus-visible:border-primary focus-visible:text-foreground"
        >
          {text(item.label)}
        </a>
      ))}
    </nav>
  );

  return (
    <div className="absolute inset-2 overflow-hidden rounded-2xl border border-primary/10 bg-background/96 sm:inset-x-4 lg:inset-0 lg:m-4 lg:mt-2 lg:rounded-3xl">
      <div data-testid="guide-scroll" className="h-full overflow-y-auto scroll-smooth">
        <header className="border-b border-primary/10 bg-background/80">
          <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <BookOpen className="size-4" />
              <span>{t.ghid_title}</span>
            </div>
            <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-normal text-foreground sm:text-4xl">
              {t.ghid_subtitle}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              {t.ghid_disclaimer}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/explorator"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t.ghid_action_explorer}
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/optica"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/25 px-4 py-2 text-sm font-bold text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5"
              >
                <Eye className="size-4 text-primary" />
                {t.ghid_action_optics}
              </Link>
            </div>
          </div>
        </header>

        <div className="sticky top-0 z-20 border-b border-primary/10 bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
          <details className="group">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-foreground">
              {t.ghid_toc_open}
              <ChevronDown className="size-4 text-primary transition-transform group-open:rotate-180" />
            </summary>
            <div className="max-h-[55vh] overflow-y-auto border-t border-primary/10 pt-2">
              {toc}
            </div>
          </details>
        </div>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-7 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8 lg:py-10">
          <aside className="sticky top-6 hidden self-start lg:block">
            <p className="mb-3 px-3 text-xs font-bold uppercase text-muted-foreground">
              {t.ghid_toc_title}
            </p>
            {toc}
          </aside>

          <main className="min-w-0" data-testid="guide-content">
            <section id="ghid-start" className="scroll-mt-20 pb-12">
              <SectionHeading
                icon={Sparkles}
                eyebrow={t.ghid_toc_start}
                title={t.ghid_quick_title}
              />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{t.ghid_quick_intro}</p>
              <ol className="mt-7 border-y border-primary/10">
                {[1, 2, 3, 4].map((step) => (
                  <li
                    key={step}
                    className="grid gap-3 border-b border-primary/10 py-5 last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)]"
                  >
                    <span className="grid size-9 place-items-center rounded-full border border-primary/25 text-sm font-black text-primary">
                      {step}
                    </span>
                    <div>
                      <h3 className="font-bold text-foreground">
                        {text(`ghid_quick_${step}_title` as TranslationKey)}
                      </h3>
                      <p className="mt-1 leading-6 text-muted-foreground">
                        {text(`ghid_quick_${step}_body` as TranslationKey)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <GuideSection id="ghid-explorer">
              <SectionHeading
                icon={Compass}
                eyebrow={t.ghid_toc_explorer}
                title={t.ghid_explorer_title}
              />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                {t.ghid_explorer_intro}
              </p>

              <h3 className="mt-8 text-sm font-black uppercase text-foreground">
                {t.ghid_modes_title}
              </h3>
              <dl className="mt-3 grid border-t border-primary/10 md:grid-cols-2">
                {modeRows.map(([title, body]) => (
                  <div
                    key={title}
                    className="border-b border-primary/10 py-5 pr-5 md:odd:border-r md:even:pl-5"
                  >
                    <dt className="font-bold text-foreground">{text(title)}</dt>
                    <dd className="mt-1 text-sm leading-6 text-muted-foreground">{text(body)}</dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-8 text-sm font-black uppercase text-foreground">
                {t.ghid_controls_title}
              </h3>
              <ul className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {explorerControls.map(([Icon, label]) => (
                  <li key={label} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                    <Icon className="mt-1 size-4 shrink-0 text-primary" />
                    <span>{text(label)}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/explorator"
                className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border border-primary/25 px-4 py-2 text-sm font-bold text-foreground hover:bg-primary/5"
              >
                {t.ghid_action_explorer}
                <ArrowRight className="size-4 text-primary" />
              </Link>
            </GuideSection>

            <GuideSection id="ghid-ai">
              <SectionHeading
                icon={MessageCircle}
                eyebrow={t.ghid_toc_ai}
                title={t.ghid_ai_title}
              />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{t.ghid_ai_intro}</p>
              <div className="mt-7 grid gap-6 md:grid-cols-2">
                <InfoBlock
                  icon={UserRound}
                  title={t.ghid_ai_guest_title}
                  body={t.ghid_ai_guest_body}
                />
                <InfoBlock
                  icon={MessageCircle}
                  title={t.ghid_ai_flow_title}
                  body={t.ghid_ai_flow_body}
                />
                <InfoBlock
                  icon={Target}
                  title={t.ghid_ai_anatomy_title}
                  body={t.ghid_ai_anatomy_body}
                />
                <InfoBlock
                  icon={BookOpen}
                  title={t.ghid_ai_educational_title}
                  body={t.ghid_ai_educational_body}
                />
              </div>
              <div className="mt-7 border-l-2 border-primary bg-primary/[0.04] px-4 py-3 text-sm leading-6 text-foreground">
                {t.ghid_ai_no_diagnosis}
              </div>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <ExampleLine
                  label={t.ghid_ai_example_symptom_label}
                  text={t.ghid_ai_example_symptom}
                />
                <ExampleLine
                  label={t.ghid_ai_example_education_label}
                  text={t.ghid_ai_example_education}
                />
              </div>
            </GuideSection>

            <GuideSection id="ghid-nearby">
              <SectionHeading
                icon={MapPin}
                eyebrow={t.ghid_toc_nearby}
                title={t.ghid_nearby_title}
              />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                {t.ghid_nearby_intro}
              </p>
              <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-primary/10 bg-primary/10 sm:grid-cols-2">
                {[
                  ["ghid_nearby_open_title", "ghid_nearby_open_body"],
                  ["ghid_nearby_location_title", "ghid_nearby_location_body"],
                  ["ghid_nearby_results_title", "ghid_nearby_results_body"],
                  ["ghid_nearby_limits_title", "ghid_nearby_limits_body"],
                ].map(([title, body]) => (
                  <div key={title} className="bg-background p-5">
                    <h3 className="font-bold text-foreground">{text(title as TranslationKey)}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {text(body as TranslationKey)}
                    </p>
                  </div>
                ))}
              </div>
            </GuideSection>

            <GuideSection id="ghid-optics">
              <SectionHeading icon={Eye} eyebrow={t.ghid_toc_optics} title={t.ghid_optics_title} />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                {t.ghid_optics_intro}
              </p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="flex gap-3 border-t border-primary/10 pt-4">
                    <span className="font-black text-primary">0{step}</span>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {text(`ghid_optics_step_${step}` as TranslationKey)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-6 border-l-2 border-amber-400/70 pl-4 text-sm leading-6 text-muted-foreground">
                {t.ghid_optics_note}
              </p>
              <Link
                to="/optica"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                <Eye className="size-4" />
                {t.ghid_action_optics}
              </Link>
            </GuideSection>

            <GuideSection id="ghid-account">
              <SectionHeading
                icon={History}
                eyebrow={t.ghid_toc_account}
                title={t.ghid_account_title}
              />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                {t.ghid_account_intro}
              </p>
              <div className="mt-7 grid gap-8 md:grid-cols-2">
                <InfoBlock icon={UserRound} title={t.ghid_guest_title} body={t.ghid_guest_body} />
                <InfoBlock
                  icon={History}
                  title={t.ghid_account_user_title}
                  body={t.ghid_account_user_body}
                />
              </div>
              <div className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <p className="border-l-2 border-primary/25 pl-4">{t.ghid_guest_session}</p>
                <p className="border-l-2 border-primary/25 pl-4">{t.ghid_account_history}</p>
              </div>
            </GuideSection>

            <GuideSection id="ghid-initiation">
              <SectionHeading
                icon={Trophy}
                eyebrow={t.ghid_toc_initiation}
                title={t.ghid_initiation_title}
              />
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                {t.ghid_initiation_intro}
              </p>
              <ol className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">
                {initiationMissions.map((mission, index) => (
                  <li
                    key={mission}
                    className="flex gap-3 border-b border-primary/10 py-3 text-sm text-muted-foreground"
                  >
                    <span className="font-black text-primary">{index + 1}</span>
                    {text(mission)}
                  </li>
                ))}
              </ol>
              <p className="mt-6 max-w-3xl text-sm leading-6 text-muted-foreground">
                {t.ghid_initiation_local}
              </p>
            </GuideSection>

            <GuideSection id="ghid-safety">
              <SectionHeading
                icon={ShieldCheck}
                eyebrow={t.ghid_toc_safety}
                title={t.ghid_safety_title}
              />
              <ul className="mt-6 divide-y divide-primary/10 border-y border-primary/10">
                {safetyPoints.map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 py-4 text-sm leading-6 text-muted-foreground"
                  >
                    <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
                    {text(point)}
                  </li>
                ))}
              </ul>
            </GuideSection>

            <GuideSection id="ghid-faq">
              <SectionHeading icon={CircleHelp} eyebrow={t.ghid_toc_faq} title={t.ghid_faq_title} />
              <div className="mt-6 border-t border-primary/10">
                {faqItems.map(([question, answer]) => (
                  <details key={question} className="group border-b border-primary/10">
                    <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-bold text-foreground">
                      {text(question)}
                      <ChevronDown className="size-4 shrink-0 text-primary transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="max-w-3xl pb-5 text-sm leading-6 text-muted-foreground">
                      {text(answer)}
                    </p>
                  </details>
                ))}
              </div>
            </GuideSection>

            <footer className="border-t border-primary/10 py-10">
              <h2 className="text-xl font-black text-foreground">{t.ghid_end_title}</h2>
              <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{t.ghid_end_body}</p>
              <Link
                to="/explorator"
                className="mt-5 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary hover:text-primary/80"
              >
                {t.ghid_action_explorer}
                <ArrowRight className="size-4" />
              </Link>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}

function GuideSection({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-primary/10 py-12 first:border-t-0">
      {children}
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
}: {
  icon: typeof Compass;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-1 size-5 shrink-0 text-primary" />
      <div>
        <p className="text-xs font-bold uppercase text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-black tracking-normal text-foreground sm:text-3xl">
          {title}
        </h2>
      </div>
    </div>
  );
}

function InfoBlock({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Compass;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-4">
      <Icon className="mt-1 size-5 shrink-0 text-primary" />
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function ExampleLine({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-t border-primary/10 pt-4">
      <p className="text-xs font-bold uppercase text-primary">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">“{text}”</p>
    </div>
  );
}
