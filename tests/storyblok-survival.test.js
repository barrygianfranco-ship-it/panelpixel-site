const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("js/storyblok-richtext.js", "utf8");
const context = vm.createContext({ console, URLSearchParams, fetch: async () => ({ ok: true, json: async () => ({ stories: [] }) }) });
vm.runInContext(source, context);

const richtext = {
  content: [
    { type: "blok", attrs: { body: [{ component: "survival_chapter", number: "01", eyebrow: "Origini", title: "La villa", years: "1996", summary: "Il primo contagio." }] } },
    { type: "blok", attrs: { body: [{ component: "survival_timeline", title: "Trent'anni", items: [{ year: "1996", title: "Resident Evil", text: "La paura comincia." }] }] } },
    { type: "blok", attrs: { body: [{ component: "survival_compare", title: "Originale / Remake", left_title: "1996", left_text: "La soglia.", right_title: "2002", right_text: "La rinascita." }] } },
    { type: "blok", attrs: { body: [{ component: "survival_panorama", image: { filename: "https://a.storyblok.com/f/1/1600x900/test.jpg", alt: "Villa nella notte" }, caption: "Ritorno a casa." }] } },
    { type: "blok", attrs: { body: [{ component: "survival_dossier", label: "Documento", code: "RE-01", title: "Dietro le quinte", text: "Una nota d'archivio." }] } },
  ],
};

context.__fixture = richtext;
const html = vm.runInContext("storyblokRichtextToHtml(__fixture)", context);

assert.match(html, /class="survival-chapter"/);
assert.match(html, /class="survival-timeline"/);
assert.match(html, /class="survival-compare"/);
assert.match(html, /class="survival-panorama"/);
assert.match(html, /class="survival-dossier"/);
assert.match(html, /Trent&#039;anni/);
assert.doesNotMatch(html, /undefined/);

console.log("Storyblok Survival components: OK");
