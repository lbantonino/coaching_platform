// Phase B : compare chaque menu de l'app à sa planche du kit (positions relatives à la boîte).
// Usage : node cmp-menus.cjs <dossier captures> [numéros séparés par des virgules]
const { chromium, devices } = require("@playwright/test");
const path = require("path");
const OUT = process.argv[2];
const ONLY = (process.argv[3] || "36,30,17,05,22,09").split(",");
const APP = "http://localhost:3000";
const KIT = "http://127.0.0.1:8766/Coory%20Boites.dc.html";

// Mesure exécutée dans la page : textes, tuiles 38, ronds 38, filets, relatifs à la boîte.
const measure = (box) => {
  const r0 = box.getBoundingClientRect();
  const rel = (r) => `x${(r.left - r0.left).toFixed(1)} y${(r.top - r0.top).toFixed(1)} ${r.width.toFixed(1)}×${r.height.toFixed(1)}`;
  const items = [];
  for (const el of box.querySelectorAll("*")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden") continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
    if (own) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const tr = range.getBoundingClientRect();
      items.push({ y: tr.top - r0.top, line: `texte « ${own.slice(0, 34)} » ${rel(tr)} ${cs.fontSize} ${cs.fontWeight} ${cs.color}` });
    } else if (Math.round(r.width) === 38 && Math.round(r.height) === 38 && el.tagName !== "svg") {
      items.push({ y: r.top - r0.top, line: `carré38 ${rel(r)} r${cs.borderRadius} ${cs.backgroundColor}` });
    } else if (r.height <= 1.5 && r.width > 60) {
      items.push({ y: r.top - r0.top, line: `filet ${rel(r)} ${cs.backgroundColor}` });
    } else if (Math.round(r.width) === 40 && Math.round(r.height) === 5) {
      items.push({ y: r.top - r0.top, line: `poignée ${rel(r)} ${cs.backgroundColor}` });
    } else if (el.tagName === "svg" && r.width < 30) {
      items.push({ y: r.top - r0.top, line: `icône ${rel(r)} trait ${el.getAttribute("stroke-width")} ${cs.color}` });
    }
  }
  items.sort((a, b) => a.y - b.y);
  return { size: `${r0.width.toFixed(1)}×${r0.height.toFixed(1)} r${getComputedStyle(box).borderRadius}`, items: items.map((i) => i.line) };
};

const openers = {
  "36": async (p) => {
    await p.goto(`${APP}/coach/notifications`);
    await p.getByRole("button", { name: /^Plus d'actions : / }).first().click();
  },
  "30": async (p) => {
    await p.goto(`${APP}/coach/comptabilite`);
    await p.locator('ul[aria-label="Liste des paiements"] button[aria-label="Plus d\'actions"]').first().click();
  },
  "17": async (p) => {
    await p.goto(`${APP}/coach`);
    await p.waitForTimeout(800);
    const href = await p.locator('a[href*="/agenda/seances/"]').filter({ hasText: "Piste du mercredi" }).first().getAttribute("href");
    await p.goto(`${APP}${href}`);
    await p.waitForTimeout(800);
    // Téléphone : la page n'a pas de « ••• » ; on l'ouvre en grand écran puis on repasse à 390 px.
    const size = p.viewportSize();
    if (size.width < 1024) await p.setViewportSize({ width: 1200, height: 844 });
    await p.getByRole("button", { name: "Plus d'actions" }).filter({ visible: true }).first().click();
    if (size.width < 1024) { await p.waitForTimeout(500); await p.setViewportSize(size); }
  },
  "05": async (p) => {
    await goFiche(p, "");
    const phone = (p.viewportSize()?.width ?? 0) < 1024;
    await p.getByRole("button", { name: phone ? /^Créer pour / : "Créer" }).filter({ visible: true }).first().click();
  },
  "22": async (p) => {
    await p.goto(`${APP}/coach/documents`);
    await p.getByRole("button", { name: "Plus d'actions : Facture FAC-2026-014" }).click();
  },
  "09": async (p) => {
    await goFiche(p, "?onglet=objectifs");
    await p.locator('button[aria-label^="Actions : "]').first().click();
  },
};
async function goFiche(p, query) {
  await p.goto(`${APP}/coach`);
  const org = await p.evaluate(() => document.querySelector('a[href*="/coach/o/"]')?.getAttribute("href")?.split("/")[3]);
  await p.goto(`${APP}/coach/o/${org}/sportifs`);
  const href = await p.locator('a[href*="/sportifs/"]').filter({ hasText: "Inès Benali" }).first().getAttribute("href");
  await p.goto(`${APP}${href.split("?")[0]}${query}`);
  await p.waitForTimeout(800);
}

(async () => {
  const browser = await chromium.launch();
  const kitPage = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await kitPage.goto(KIT);
  await kitPage.waitForTimeout(2500);
  for (const mobile of [false, true]) {
    const c = await browser.newContext(
      mobile
        ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
        : { viewport: { width: 1200, height: 780 }, deviceScaleFactor: 2 },
    );
    await c.addInitScript(() => { try { localStorage.setItem("coory-theme", "light"); } catch {} });
    const p = await c.newPage();
    await p.goto(`${APP}/login`);
    await p.getByLabel("Adresse e-mail").fill("coach-a@example.test");
    await p.getByLabel("Mot de passe", { exact: true }).fill("demo-coach-local");
    await p.getByRole("button", { name: "Se connecter" }).click();
    await p.waitForURL(/\/coach$/, { timeout: 30000 });
    for (const n of ONLY) {
      const shot = `${n}-${mobile ? "m" : "d"}`;
      const kit = await kitPage.evaluate(({ shot, measureSrc, mobile }) => {
        const measure = eval(measureSrc);
        const root = document.querySelector(`[data-shot="${shot}"]`);
        if (!root) return null;
        const box = [...root.querySelectorAll("div")].find((d) => {
          const cs = getComputedStyle(d);
          return mobile ? cs.borderTopLeftRadius === "28px" && cs.borderBottomLeftRadius === "0px" : cs.borderRadius === "24px" && d.getBoundingClientRect().width > 300;
        });
        return box ? measure(box) : null;
      }, { shot, measureSrc: `(${measure.toString()})`, mobile });
      let app = null;
      try {
        await openers[n](p);
        const dialog = p.locator("dialog[open]");
        await dialog.waitFor();
        await p.waitForTimeout(700);
        app = await dialog.evaluate((d, src) => eval(src)(d), `(${measure.toString()})`);
        await p.screenshot({ path: path.join(OUT, `${shot}.png`) });
        await p.keyboard.press("Escape");
        await p.waitForTimeout(300);
      } catch (error) {
        app = { size: "—", items: [`(${error.message.split("\n")[0]})`] };
      }
      console.log(`\n===== ${shot}  kit ${kit?.size}  |  app ${app.size}`);
      const rows = Math.max(kit?.items.length ?? 0, app.items.length);
      for (let i = 0; i < rows; i++) {
        console.log(`K ${kit?.items[i] ?? ""}`);
        console.log(`A ${app.items[i] ?? ""}`);
      }
    }
    await c.close();
  }
  await browser.close();
})();
