import { expect, test } from "@playwright/test";
import { analyzePainLocally } from "../src/data/painKnowledge";

const distalPhalanx = {
  tissueType: "os" as const,
  selectedName: "Falanga distală a degetului mijlociu",
  segment: "Mâna",
  group: "Falange",
};

const benignSmallBoneAnswers = {
  varsta: 1,
  debut: 0,
  functie: 0,
  semne: 0,
  durata: 0,
  os_sprijin: 1,
};

test("severe pain alone in a finger phalanx does not become alarmist doctor consult", () => {
  const result = analyzePainLocally({
    ...distalPhalanx,
    answers: {
      ...benignSmallBoneAnswers,
      intensitate: 2,
    },
  });

  expect(result.nivel).toBe("mediu");
  expect(result.title).toBe("Monitorizare atentă");
  expect(result.recomandare).toContain("Durerea intensă la un deget");
  expect(result.cauze.join(" ")).not.toContain("fractură, fisură sau traumatism important");
});

test("severe phalanx pain after trauma recommends medical consult with prudent wording", () => {
  const result = analyzePainLocally({
    ...distalPhalanx,
    answers: {
      ...benignSmallBoneAnswers,
      intensitate: 2,
      debut: 2,
    },
  });

  expect(result.nivel).toBe("consultare_doctor");
  expect(result.title).toBe("Consult medical recomandat");
  expect(result.recomandare).toContain("contuzie, entorsă sau posibilă fisură/fractură");
  expect(result.recomandare).toContain("cere consult rapid");
});

test("phalanx pain with deformity or loss of function requires rapid consult", () => {
  const result = analyzePainLocally({
    ...distalPhalanx,
    answers: {
      ...benignSmallBoneAnswers,
      intensitate: 2,
      functie: 1,
      semne: 2,
    },
  });

  expect(result.nivel).toBe("consultare_doctor");
  expect(result.title).toBe("Consult rapid");
  expect(result.recomandare).toContain("leziune importantă");
});

test("mild or moderate phalanx pain stays in monitoring/general guidance", () => {
  const result = analyzePainLocally({
    ...distalPhalanx,
    answers: {
      ...benignSmallBoneAnswers,
      intensitate: 1,
      os_sprijin: 0,
    },
  });

  expect(["usor", "mediu"]).toContain(result.nivel);
  expect(result.title ?? "").not.toBe("Consult rapid");
  expect(result.recomandare).toContain("Monitorizează");
});

test("large bone severe pain after trauma remains higher triage", () => {
  const result = analyzePainLocally({
    tissueType: "os",
    selectedName: "Femur",
    segment: "Coapsa",
    group: "Os lung",
    answers: {
      varsta: 1,
      intensitate: 2,
      debut: 2,
      functie: 1,
      semne: 1,
      durata: 0,
      os_sprijin: 1,
    },
  });

  expect(result.nivel).toBe("consultare_doctor");
  expect(result.title).toBeUndefined();
});
