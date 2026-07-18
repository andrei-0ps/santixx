import { createFileRoute } from "@tanstack/react-router";
import { VisionSimulator } from "@/components/vision/VisionSimulator";

export const Route = createFileRoute("/optica")({
  head: () => ({
    meta: [
      { title: "Optică & Vedere — Santix" },
      {
        name: "description",
        content:
          "Simulator educațional 3D al deficiențelor de vedere: miopie, glaucom, daltonism și altele. Plimbă-te prin scenă și vezi cum se schimbă câmpul vizual.",
      },
    ],
  }),
  component: VisionSimulator,
});
