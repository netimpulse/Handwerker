# CLAUDE.md – Shopify Theme

> Diese Datei wird bei jeder Claude-Code-Session automatisch geladen.
> Sie ist das Gedächtnis des Projekts: Architektur, Konventionen und vor allem
> der Abhängigkeits-Log, damit Claude beim Bauen eines Teils weiß, was später
> daran hängt.

---

## ⚠️ MEMORY-PFLEGE – IMMER BEFOLGEN

Diese Regel hat hohe Priorität. Befolge sie bei JEDER Code-Änderung.

**Nach jedem implementierten oder geänderten Feature gilt:**

1. Prüfe, ob das Feature mit anderen Theme-Teilen zusammenhängt
   (Kundenkonto, Metafields, Header, Cart, Checkout, Routes, globale JS/CSS).
2. Falls ja: trage es SOFORT unter `## Architektur & Abhängigkeiten` ein –
   bevor du die Aufgabe als erledigt meldest.
3. Aktualisiere bestehende Einträge, wenn sich eine Abhängigkeit ändert.
   Lösche nichts, was noch im Code aktiv ist.
4. Pro Eintrag dokumentierst du AUSFÜHRLICH:
   - **Feature** – Name
   - **Dateien** – betroffene Sections/Snippets/Assets (mit Pfad)
   - **Hängt an** – Objekte, Metafields, Routes, globale Funktionen
   - **Wird genutzt von** – welche anderen Teile darauf zugreifen (müssen)
   - **Offen / To-do** – noch fehlende Anbindungen oder Risiken
   - **Stand** – Datum der letzten Änderung
5. Wenn etwas eine spätere Anbindung erfordert, die noch nicht existiert,
   notiere sie unter `## Offene Abhängigkeiten (To-do)`, damit sie nicht
   vergessen wird.

Bei Unsicherheit, ob etwas eingetragen werden soll: lieber eintragen.

---

## Projekt-Überblick

- **Plattform:** Shopify (Online Store 2.0 / Liquid)
- **Theme-Basis:** Dawn (volle Dawn-Codebasis: base.css, global.js, Cart-Drawer,
  Facets, Predictive Search etc.) + Custom-Handwerker-Layer
- **Zweck / Shop:** Verkaufsfertiges Handwerker-Theme (Dachdecker, Elektriker,
  SHK, Schreiner, Maler, General Contractor). Lead-Generierung (Angebotsanfrage,
  Click-to-Call) UND Shop-Funktionalität (Produkte, Cart, Checkout).
- **Design-Sprache „Werkstatt-Moderne":** Oswald (semibold, uppercase) für
  Headlines, Archivo als Body-Font, Safety-Orange `#E8650D` auf Anthrazit
  `#16191D`/`#20262E`, Hazard-Stripe-Akzente (schräge Streifen), gefaste
  Kartenecken (clip-path-Chamfer), Blueprint-Punktraster-Hintergründe,
  outlined Zahlen für Prozess-Schritte. Radien überall 0 (kantig).

## Konventionen

- CSS wird pro Section gescoped (keine globalen Klassen-Kollisionen).
- Keine Inline-Styles, keine Inline-Event-Handler.
- Snippets für wiederverwendbare Bausteine, Sections für Seitenblöcke.
- Custom-Handwerker-Code nutzt Präfix `cf-` (CSS-Klassen, Custom Elements,
  Snippet-Dateinamen `snippets/cf-*.liquid`).
- Farb-Logik IMMER über Dawn-Color-Schemes (`color-{{ scheme.id }}` +
  `--color-background/-foreground/-button/-button-text/-link`), nie Hardcodes.
- Alle neuen Schema-Labels über `t:sections.cf.*` (gemeinsamer Label-Pool) bzw.
  `t:sections.<section>.*`; Storefront-Strings über `general.craftsman.*`.
- Dateien NUR mit Write/Edit-Tools schreiben (nie Bash-Heredocs – `!`-Korruption).
- Nach jeder Änderung: `python3 /tmp/validate_theme.py`-artige Prüfung
  (Schema-JSON parsen, Liquid-Tag-Balance, t:-Key-Existenz) + `shopify theme check`.

---

## Architektur & Abhängigkeiten

### Composed Page-Sections (Kern-Feature: „1 Section = 1 fertige Seite")
- **Dateien:**
  - `sections/page-landing.liquid` – komplette Startseite (Blocks: hero, trust,
    service, step, stat, before_after, project, testimonial, faq, cta)
  - `sections/page-services.liquid` – Leistungsseite (Blocks: service_detail,
    step, faq, cta) + integrierter Sofort-Preisschätzer
  - `sections/page-about.liquid` – Über-uns (Blocks: story, value, timeline,
    stat, team_member, certificate, cta)
  - `sections/page-references.liquid` – Referenzen (Blocks: project mit
    optionalem Vorher-Bild → Karte rendert BA-Slider, before_after,
    testimonial, logo, cta) + Kategorie-Filter
  - `sections/page-contact.liquid` – Kontakt (Angebotsformular via
    `{% form 'contact' %}`, Blocks: service_option, faq; Notdienst-Leiste,
    PLZ-Check, Karten-Bild, Öffnungszeiten)
- **Hängt an:**
  - `assets/craftsman-pages.css` (gemeinsames Design-System aller cf-Teile)
  - `assets/craftsman-pages.js` (Custom Elements: `cf-before-after`,
    `cf-count-up`, `cf-filter-grid`, `cf-zip-check`, `cf-availability`,
    `cf-estimator`, `cf-legal-toc`, `cf-print-button`, `cf-reveal-group`)
  - Snippets: `cf-section-head`, `cf-before-after`, `cf-service-card`,
    `cf-project-card`, `cf-trust-item`, `cf-testimonial-card`, `cf-team-card`,
    `cf-step`, `cf-stat`, `cf-faq-item`, `cf-cta-banner`, `icon-craftsman`
  - Locales: `general.craftsman.*` + `general.before_after.*` (en/de),
    Schema-Labels `sections.cf.*` (en/de Schema-Locales)
  - Dawn-Color-Schemes (scheme-1…6 in `config/settings_data.json`)
- **Wird genutzt von:**
  - Templates: `index.json` (page-landing), `page.services.json`,
    `page.about.json`, `page.references.json`, `page.contact.json`
  - Testimonial-Blocks speisen optional JSON-LD `AggregateRating`
    (Toggle `enable_review_schema` in page-landing & page-references —
    nur auf EINER Seite aktiv lassen, sonst doppelte Rich-Snippets!)
- **Offen / To-do:** Bilder/echte Inhalte kommen vom Merchant (Placeholder-SVGs
  greifen automatisch). CTA-Buttons in Presets haben keine Links gesetzt.
- **Stand:** 2026-06-11

### Sofort-Preisschätzer (in page-services)
- **Dateien:** `sections/page-services.liquid` (Markup + Settings),
  `assets/craftsman-pages.js` (`<cf-estimator>`)
- **Hängt an:** `service_detail`-Blocks mit `price_min`/`price_max`/`price_unit`;
  Währung aus `cart.currency.iso_code`, Formatierung via `Intl.NumberFormat`.
- **Wird genutzt von:** CTA-Button führt auf Kontaktseite (Link-Setting
  `estimator_button_link` muss vom Merchant auf /pages/kontakt gesetzt werden).
- **Offen / To-do:** Button-Link in Template/Customizer setzen (siehe Admin-To-dos).
- **Stand:** 2026-06-11

### PLZ-Einzugsgebiets-Check (in page-contact)
- **Dateien:** `sections/page-contact.liquid`, `assets/craftsman-pages.js`
  (`<cf-zip-check>`)
- **Hängt an:** Section-Setting `zip_list` (Komma/Zeilen-getrennt, `*` als
  Präfix-Wildcard, z. B. `10*`). Rein clientseitig, keine API.
- **Stand:** 2026-06-11

### Notdienst-/Erreichbarkeits-Logik
- **Dateien:** `assets/craftsman-pages.js` (`<cf-availability>`),
  `sections/page-contact.liquid` (Notdienst-Banner),
  `sections/sticky-action-bar.liquid` (Status-Zeile)
- **Hängt an:** Settings `*_open`/`*_close` (Stunden 0–24) und `*_days`
  (Wochentage, 0=Sonntag). Vergleich mit LOKALER Besucherzeit (clientseitig).
- **Stand:** 2026-06-11

### Mobile Sticky-Action-Bar (Anrufen | Angebot | WhatsApp)
- **Dateien:** `sections/sticky-action-bar.liquid` (+ CSS in
  craftsman-pages.css, `.cf-actionbar`)
- **Hängt an:** Footer-Group (`sections/footer-group.json`, Eintrag
  `action-bar`); `enabled_on: groups: [footer]`. Rendert NICHTS solange
  weder Telefon noch Quote-Link noch WhatsApp gesetzt sind (bewusst inert).
- **Wird genutzt von:** allen Seiten (Footer-Group ist global). z-index 40 –
  liegt unter Modals/Drawern von Dawn (die nutzen höhere Werte).
- **Offen / To-do:** Merchant muss Telefon/Links im Customizer setzen.
- **Stand:** 2026-06-11

### Produkt-Detailseite (main-product, erweitert)
- **Dateien:** `sections/main-product.liquid` – Anzeigename jetzt
  „Produkt-Detailseite" (de.schema.json) / „Product detail page" wäre noch zu
  setzen (en behält „Product information" von Dawn – bewusst NICHT geändert, um
  Dawn-Locale-Dateien nicht zu forken; Blöcke heißen aber neu). Neue Blocks:
  `trust_row` (3 Icon-Badges), `quote_cta` (Angebot-anfragen-Box, hängt Link
  `?produkt={{ product.handle }}` an), `specs_table` (Zeilen „Label|Wert").
- **Hängt an:** Dawn-Snippets (buy-buttons, price, product-variant-picker,
  product-media-gallery), `assets/craftsman-pages.css` (cf-product-*-Klassen),
  Schema-Labels `sections.main-product.blocks.{trust_row,quote_cta,specs_table}`.
- **Wird genutzt von:** `templates/product.json` (alle 3 neuen Blocks aktiv).
- **Offen / To-do:** `quote_cta`-Link muss im Customizer auf die Kontaktseite
  zeigen; Kontaktformular liest den `?produkt=`-Parameter NICHT automatisch aus
  (optionales Future-Feature).
- **Stand:** 2026-06-11

### Rechtsseiten-Styling (AGB / Impressum / Datenschutz)
- **Dateien:** `sections/page-legal.liquid`, `templates/page.legal.json`,
  JS `<cf-legal-toc>` + `<cf-print-button>` in craftsman-pages.js
- **Hängt an:** `page.content` (H2-Überschriften → automatisches
  Inhaltsverzeichnis), `page.published_at` (Stand-Datum, Format
  `date_formats.date` in en/de Locales), Print-CSS in craftsman-pages.css.
- **Wird genutzt von:** allen Pages mit Template-Suffix `legal`.
- **Stand:** 2026-06-11

### 404-Seite
- **Dateien:** `sections/main-404.liquid` (komplett neu: Outline-404,
  Hazard-Stripe, Suchformular → `routes.search_url`, Quick-Link-Blocks),
  `templates/404.json`
- **Hängt an:** `templates.404.*` + `general.craftsman.not_found.*` Locale-Keys,
  craftsman-pages.css
- **Stand:** 2026-06-11

### Farb-/Typo-System (settings_data.json)
- **Dateien:** `config/settings_data.json` (Preset „Handwerker", vorher „Dawn")
- **Inhalt:** scheme-1 Weiß, scheme-2 Papier `#F4F1EC`, scheme-3 Anthrazit
  `#20262E`, scheme-4 Tiefschwarz `#16191D`, scheme-5 Orange-Akzentfläche,
  scheme-6 Stahlblau `#24405E`. Button immer `#E8650D` mit dunklem Label
  (AA-Kontrast ~6,9:1). Fonts: `oswald_n6` (Headings) / `archivo_n4` (Body).
  Alle Radien (Buttons, Inputs, Cards, Pills, Media, Badges, Popups) = 0.
- **Wird genutzt von:** ALLEN Sections (Dawn-Scheme-CSS in theme.liquid
  generiert `.color-scheme-X`-Klassen + CSS-Variablen).
- **Achtung:** Bestehende ältere Custom-Sections (hero-craftsman etc.)
  referenzieren scheme-IDs ebenfalls – Farbänderungen wirken global.
- **Stand:** 2026-06-11

### Ältere Custom-Sections (Session(s) davor, weiterhin aktiv)
- `header-craftsman` (Topbar, Notdienst-Badge, CTA), `footer-craftsman`,
  `hero-craftsman`, `services-showcase`, `project-gallery`,
  `before-after-slider`, `team-members`, `testimonials-carousel`,
  `trust-credentials`, `stats-counter`, `cta-contact-banner`, `faq-accordion`,
  `news-insights`, `blog-featured`, `blog-overview`, `blog-post-enhanced`.
- Diese sind eigenständige Einzel-Sections (Alternative zu den Composed Pages).
  Header/Footer-Group nutzen aktuell DAWN-Header/-Footer; header-craftsman/
  footer-craftsman sind optional im Customizer wählbar.
- **Offen / To-do:** Schemas dieser Sections haben hardcoded ENGLISCHE Labels
  (nicht `t:`-Keys) → für Theme-Store-Submission müssten sie auf
  Schema-Locales umgestellt werden (mechanischer Refactor, ~15 Dateien).
- **Stand:** vor 2026-06-11

### Wishlist / Favoriten (Alt-Eintrag, Status unklar)
- `snippets/wishlist-button.liquid` war geplant/teilweise vorhanden –
  aktuell NICHT Teil des Handwerker-Scopes. Kein aktiver Code im Repo gefunden.
- **Stand:** vor 2026-06-11

---

## Offene Abhängigkeiten (To-do)

- [ ] Schemas der 15 älteren Custom-Sections auf `t:`-Locale-Keys umstellen
      (Theme-Store-Pflicht; neue cf-Sections sind bereits konform).
- [ ] Kontaktformular: `?produkt=`-Query-Parameter (von quote_cta der
      Produktseite) optional als vorausgefülltes Feld übernehmen.
- [ ] `estimator_button_link` & CTA-Block-Links in Templates auf
      `/pages/kontakt` setzen, sobald die Seite im Shop existiert (Admin).
- [ ] Optional: scheme-6 (Stahlblau) im Editor benennen/bewerben.
- [ ] Optional: Karriere-Section („Wir stellen ein") – laut Recherche in DE
      sehr wichtig (Fachkräftemangel) – noch nicht gebaut.

---

## 🔧 ADMIN-TO-DOS (für die Session MIT Shop-MCP-Verbindung)

> Claude ist aktuell NICHT mit dem Ziel-Shop verbunden. KEINE Admin-Änderungen
> im aktuell verbundenen (falschen) Shop machen! Folgende Schritte ausführen,
> sobald die Verbindung zum richtigen Shop steht:

1. **Seiten anlegen** (Online Store → Pages) und Template zuweisen:
   - „Leistungen" → Template `page.services`
   - „Über uns" → Template `page.about`
   - „Referenzen" → Template `page.references`
   - „Kontakt" → Template `page.contact` (existiert evtl. schon → Template prüfen)
   - „AGB", „Impressum", „Datenschutz", „Widerruf" → Template `page.legal`
     (Inhalt mit H2-Überschriften strukturieren → automatisches
     Inhaltsverzeichnis)
2. **Navigation** (Online Store → Navigation):
   - Hauptmenü: Start / Leistungen / Referenzen / Über uns / Shop (Collection
     „Alle") / Kontakt
   - Footer-Menü „legal": AGB, Impressum, Datenschutz, Widerruf
3. **Customizer-Konfiguration:**
   - Sticky-Action-Bar (Footer-Group): Telefonnummer, Quote-Link
     (→ /pages/kontakt), ggf. WhatsApp-Nummer, Erreichbarkeits-Zeiten setzen
   - page-contact: Telefon, E-Mail, Adresse, Öffnungszeiten, Karten-Bild
     (Screenshot Google Maps) + Karten-Link, PLZ-Liste, Datenschutz-Hinweis
     (mit Link auf /pages/datenschutz), Notdienst aktivieren falls gewünscht
   - page-services: `estimator_button_link` → /pages/kontakt;
     Preisspannen (`price_min`/`price_max`/`price_unit`) je Leistung pflegen
   - Produktseite: quote_cta-Link → /pages/kontakt
   - Landing (index): Hero-Bild + echte Projektbilder hochladen,
     CTA-/Hero-Button-Links setzen
   - JSON-LD Review-Schema nur auf EINER Seite aktiv lassen
     (Landing ODER Referenzen)
4. **Theme-Settings prüfen:** Logo hochladen; Farbschemata ggf. an CI anpassen
   (Preset „Handwerker": Orange #E8650D / Anthrazit) – Schemes heißen
   scheme-1…scheme-6 (6 = Stahlblau-Alternative)
5. **Shop-Inhalte:** Blog „news" existiert? (blog-featured referenziert ihn);
   Collection „all" für Featured-Products-Section auf der Startseite
6. **Kontaktformular-Empfänger:** Shopify sendet an die Shop-E-Mail –
   in Settings → Notifications prüfen
7. **Optional Metafelder:** Produkt-Metafelder für technische Daten, falls
   specs_table später metafield-getrieben werden soll (aktuell manuelle Zeilen)

---

## Metafields & Namespaces (Referenz)

| Namespace.Key | Typ | Verwendung |
|---|---|---|
| `custom.wishlist` | list / json | (Alt-Planung, aktuell ungenutzt) |
| – | – | Composed Pages nutzen bewusst KEINE Metafields (alles Section-Settings, damit der Customizer reicht) |

---

## QA-Workflow (Kurzreferenz)

- Dev-Store: `handwerker-yamrvgge.myshopify.com`, Test-Theme-ID `162862432492`
  (`shopify.theme.toml`, env: `SHOPIFY_CLI_THEME_TOKEN`,
  `SHOPIFY_STOREFRONT_PASSWORD` sind in der Session gesetzt)
- Push auf Test-Theme: `shopify theme push -e development`
- Visual QA: `npx playwright test` (Screenshots), Details im Skill
  `shopify-visual-qa`
