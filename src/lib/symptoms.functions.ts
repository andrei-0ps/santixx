import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { classifyPainLocally, getKnowledgeFor, painLevels, type PainLevel } from "@/data/painKnowledge";
import { validateAiUserText } from "@/lib/security/inputSafety";

const InputSchema = z.object({
  structureName: z.string().min(1).max(120),
  structureLatin: z.string().min(0).max(120).optional().default(""),
  structureDescription: z.string().min(0).max(1000).optional().default(""),
  tissueType: z.enum(["os", "muschi", "tendon"]).default("os"),
  symptoms: z.string().min(3).max(800),
});

const ResponseSchema = z.object({
  nivel: z.enum(["usor", "mediu", "consultare_doctor"]),
  cauze: z.array(z.string().min(1).max(280)).min(1).max(4),
  recomandare: z.string().min(1).max(600),
  explicatieNivel: z.string().min(1).max(400),
});

export type SymptomAnalysis = z.infer<typeof ResponseSchema>;

const TISSUE_LABEL: Record<"os" | "muschi" | "tendon", string> = {
  os: "țesut osos (sistem scheletal)",
  muschi: "țesut muscular (sistem muscular striat)",
  tendon: "tendon / țesut conjunctiv fibros",
};

export const analyzeSymptoms = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<SymptomAnalysis> => {
    const safeSymptoms = validateAiUserText(data.symptoms, 800);
    if (safeSymptoms.rejectedReason) {
      throw new Error(safeSymptoms.rejectedReason);
    }

    const localLevel = classifyPainLocally(safeSymptoms.text);
    return buildLocalAnalysis(data.tissueType, localLevel);
  });

function buildLocalAnalysis(tissueType: "os" | "muschi" | "tendon", level: PainLevel): SymptomAnalysis {
  const knowledge = getKnowledgeFor(tissueType);
  const details = painLevels[level];

  return {
    nivel: level,
    cauze: [...knowledge[level]].slice(0, 3),
    recomandare:
      level === "consultare_doctor"
        ? "Este recomandată consultarea unui medic, mai ales dacă durerea este severă, apare după traumă sau limitează funcția. Până atunci, evită solicitarea zonei."
        : level === "mediu"
          ? "Monitorizează simptomele, redu efortul și aplică măsuri simple precum repaus relativ. Dacă durerea persistă sau se agravează, consultă un medic."
          : "Încearcă repaus relativ, hidratare și revenire treptată la efort. Dacă simptomele persistă, cresc sau apar semne noi, cere sfat medical.",
    explicatieNivel: `${details.label}: ${details.summary}`,
  };
}
