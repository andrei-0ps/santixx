import { expect, test } from "@playwright/test";
import { searchAnatomy } from "../src/data/anatomySearch";

test("bone search results keep technical terms searchable but display plain-language names", () => {
  const ulna = searchAnatomy("ulna").find((result) => result.key === "os:ulna");
  const fingerBones = searchAnatomy("falange").find((result) => result.key === "os:falange-mana");
  const sacrum = searchAnatomy("sacrum").find((result) => result.key === "os:sacrum");

  expect(ulna?.label).toBe("Osul antebrațului de pe partea degetului mic");
  expect(ulna?.label).not.toContain("Ulnă");
  expect(ulna?.labelEn).toBe("Little-finger-side forearm bone");

  expect(fingerBones?.label).toBe("Oasele degetelor mâinii");
  expect(fingerBones?.label).not.toContain("Falange");

  expect(sacrum?.label).toBe("Osul de la baza coloanei");
  expect(sacrum?.label).not.toBe("Sacrum");
});
