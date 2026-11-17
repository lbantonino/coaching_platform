import { expect, test } from "@playwright/test";

// Vue Mois sur ordinateur (relecture du 16/11/2026, plus de pastilles) : une séance collective se
// reconnaît à l'icône « groupe », comme sur téléphone (avant : un point cerclé ; une simple barre
// pâlie ne suffisait pas, le jaune Hyrox devenait presque invisible).
const ORG_A = "0a000000-0000-4000-8000-0000000000a1";

test("vue Mois : une séance collective porte l'icône « groupe », une individuelle non", async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name === "telephone",
    "Le téléphone l'affiche déjà (petites étiquettes).",
  );
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill("coach-a@example.test");
  await page.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page).toHaveURL(/\/coach$/);

  await page.goto(`/coach/o/${ORG_A}/agenda?vue=mois&date=2027-01-01`);
  const month = page.getByRole("region", { name: "Janvier 2027" });
  const collective = month
    .locator("span.flex", { hasText: "Piste du mercredi" })
    .filter({ visible: true })
    .first();
  await expect(collective).toBeVisible();
  await expect(collective.locator("svg.lucide-users")).toHaveCount(1);
  const individual = month
    .locator("span.flex", { hasText: /^\d\d:\d\d[A-ZÀ-Ü][a-zà-ü]+ [A-Z]\.$/ })
    .filter({ visible: true })
    .first();
  await expect(individual).toBeVisible();
  await expect(individual.locator("svg.lucide-users")).toHaveCount(0);
});
