import { readFile, writeFile, rename, rm } from "node:fs/promises";
import { resolve } from "node:path";
import assert from "node:assert/strict";

// Validate the actual static HTML. A broken translation/canonical fails the build.
const root = resolve(import.meta.dirname, "..");
const output = resolve(process.argv[2] || "dist");
const copy = JSON.parse(
  await readFile(resolve(root, "src/web/seo-copy.json"), "utf8"),
);
const languages = Object.keys(copy);
const origin = new URL(
  process.env.EXPO_PUBLIC_SITE_URL || "https://aircapital.app",
).origin;
const pages = ["/", "/demo", "/faq", "/contact"];
const urls = [];
const pathFor = (language, page) =>
  language === "en" ? page : `/${language}${page === "/" ? "" : page}`;
const htmlFile = (path) =>
  resolve(output, path === "/" ? "index.html" : `${path.slice(1)}.html`);
const attrs = (tag) =>
  Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [
      m[1].toLowerCase(),
      m[2],
    ]),
  );
const escape = (value) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

for (const language of languages) {
  // Expo emits folder/index.html for a route that also has children. Normalize
  // the export so Nginx can serve /fr directly without a trailing-slash redirect.
  if (language !== "en") {
    try {
      await rename(
        resolve(output, language, "index.html"),
        htmlFile(`/${language}`),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  const w = JSON.parse(
    await readFile(resolve(root, `src/web/copy/${language}.json`), "utf8"),
  );
  for (const page of pages) {
    const path = pathFor(language, page);
    let html = await readFile(htmlFile(path), "utf8");
    const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
    assert.ok(head, `Missing head: ${path}`);
    const links = [...head.matchAll(/<link\b[^>]*>/gi)].map((m) => attrs(m[0]));
    assert.deepEqual(
      links.filter((l) => l.rel === "canonical").map((l) => l.href),
      [origin + path],
      `Canonical: ${path}`,
    );
    const alternatives = links.filter(
      (l) => l.rel === "alternate" && l.hreflang,
    );
    assert.equal(
      alternatives.length,
      languages.length + 1,
      `hreflang count: ${path}`,
    );
    for (const code of [...languages, "x-default"]) {
      assert.equal(
        alternatives.find((l) => l.hreflang === code)?.href,
        origin + pathFor(code === "x-default" ? "en" : code, page),
        `hreflang ${code}: ${path}`,
      );
    }
    assert.equal(
      (head.match(/<title(?:\s|>)/g) || []).length,
      1,
      `Title count: ${path}`,
    );
    assert.ok(!head.includes("noindex"), `Unexpected noindex: ${path}`);
    assert.equal(
      (html.match(/<h1(?:\s|>)/g) || []).length,
      1,
      `H1 count: ${path}`,
    );
    const description =
      page === "/"
        ? copy[language].description
        : page === "/demo"
          ? w.demoBody
          : page === "/faq"
            ? copy[language].faqDescription
            : copy[language].contactDescription;
    const meta = [...head.matchAll(/<meta\b[^>]*>/gi)].map((m) => attrs(m[0]));
    assert.equal(meta.filter((m) => m.name === "description").length, 1);
    assert.equal(
      meta.find((m) => m.name === "description")?.content,
      escape(description),
      `Translated description: ${path}`,
    );
    const visibleHeading =
      page === "/"
        ? w.heroTitle
        : page === "/demo"
          ? w.demoTitle
          : page === "/faq"
            ? w.faqTitle
            : w.contactTitle;
    assert.ok(
      html.includes(escape(visibleHeading)),
      `Translated SSR content: ${path}`,
    );
    const structured = JSON.parse(
      head.match(
        /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/,
      )?.[1] || "null",
    );
    assert.equal(
      structured?.["@graph"]?.[0]?.url,
      origin + path,
      `Structured URL: ${path}`,
    );
    assert.equal(
      structured?.["@graph"]?.[0]?.inLanguage,
      language,
      `Structured language: ${path}`,
    );

    // Expo 54's +html is outside the route context. Set the document language
    // at export time; page content and metadata are already rendered in it.
    html = html.replace(
      /<html\b[^>]*>/,
      `<html lang="${language}" dir="${language === "ar" ? "rtl" : "ltr"}">`,
    );
    await writeFile(htmlFile(path), html);
    urls.push(origin + path);
  }
}
// These documents currently have full English text only, so have no hreflang.
for (const page of ["privacy", "terms", "cookies", "data-deletion", "legal"]) {
  const html = await readFile(htmlFile(`/${page}`), "utf8");
  if (!html.includes('content="noindex')) urls.push(`${origin}/${page}`);
}
await writeFile(
  resolve(output, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`).join("\n")}\n</urlset>\n`,
);
await writeFile(
  resolve(output, "robots.txt"),
  `User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`,
);
await readFile(resolve(output, "branding/social-card.png"));
const notFound = await readFile(resolve(output, "+not-found.html"), "utf8");
assert.ok(
  notFound.includes("noindex") && notFound.includes("<h1>404</h1>"),
  "404 must not render the home page",
);
await rm(resolve(output, "[lang].html"), { force: true });
await rm(resolve(output, "[lang]/[page].html"), { force: true });
console.log(
  `SEO verified: ${languages.length} languages, ${languages.length * pages.length} localized pages, ${urls.length} sitemap URLs.`,
);
