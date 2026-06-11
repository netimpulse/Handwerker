import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { QA, withTheme } from "./fixtures";

/**
 * Visual-QA fuer das Handwerker-Theme:
 * Screenshots + Fehler-Checks fuer Home (page-landing), Produktseite
 * (main-product inkl. trust_row/quote_cta/specs_table), Cart, 404 und Suche.
 */

const targets: Array<{ name: string; path: string }> = [
  { name: "home", path: QA.paths.home },
  { name: "product", path: QA.paths.product },
  { name: "cart", path: QA.paths.cart },
  { name: "404", path: QA.paths.notFound },
  { name: "search", path: QA.paths.search },
];

const dir = "qa-screenshots";

test.describe("Handwerker Theme – Seiten-QA", () => {
  for (const target of targets) {
    test(`${target.name}: rendert ohne Fehler`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(`console: ${m.text()}`);
      });
      page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));

      const response = await page.goto(withTheme(target.path), {
        waitUntil: "networkidle",
      });

      if (target.name === "404") {
        expect(response?.status()).toBe(404);
      } else {
        expect(response?.ok(), `HTTP-Status: ${response?.status()}`).toBe(true);
      }

      // Scroll-Reveals fuer den Full-Page-Screenshot erzwingen: der
      // IntersectionObserver feuert beim Instant-Scroll des Captures nicht.
      await page.evaluate(() => {
        document
          .querySelectorAll(".cf-reveal")
          .forEach((el) => el.classList.add("cf-reveal--in"));
      });
      await page.waitForTimeout(600);

      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await page.screenshot({
        path: path.join(dir, `${testInfo.project.name}-${target.name}.png`),
        fullPage: true,
      });

      const realErrors = errors.filter(
        (e) =>
          !e.includes("favicon") &&
          !e.includes("third-party") &&
          // 401 auf Shopify-Preview-/Auth-Subressourcen ist Preview-Rauschen,
          // kein Theme-Fehler. Echte fehlende Assets (404) bleiben sichtbar —
          // außer auf der 404-Seite selbst (dort ist das Dokument der 404er).
          !e.includes("status of 401") &&
          !(target.name === "404" && e.includes("status of 404"))
      );
      expect(realErrors, realErrors.join("\n")).toEqual([]);
    });
  }
});
