/**
 * 1) -----------------------------------------------------------------------------------------------------------
 *      Use got-scraping to crawl in sequence the following urls.
 *      Check response status code (200, 404, 403), proceed only in case of code 200, throw an error in other cases.
 *
 *      Using cheerio extract from html:
 *          - fullPrice (it has to be a number)
 *          - discountedPrice (it has to be a number, if it does not exist same as fullPrice)
 *          - currency (written in 3 letters [GBP, USD, EUR...])
 *          - title (product title)
 *
 *      Result example
 *      {
 *          url: ${urlCrawled},
 *          fullPrice: 2000.12,
 *          discountedPrice: 1452.02,
 *          currency: 'EUR',
 *          title: 'Abito Bianco con Stampa Grafica e Scollo a V Profondo'
 *      }
 * --------------------------------------------------------------------------------------------------------------
 * 2) -----------------------------------------------------------------------------------------------------------
 *      Like the first exercise but the urls must be crawled in parallel
 * --------------------------------------------------------------------------------------------------------------
 */
import { gotScraping } from "got-scraping";
import * as cheerio from "cheerio";

const urls = [
  "https://www.miinto.it/p-de-ver-s-abito-slip-3059591a-7c04-405c-8015-0936fc8ff9dd",
  "https://www.miinto.it/p-abito-a-spalline-d-jeny-fdac3d17-f571-4b55-8780-97dddf80ef35",
  "https://www.miinto.it/p-abito-bianco-con-stampa-grafica-e-scollo-a-v-profondo-2b03a3d9-fab1-492f-8efa-9151d3322ae7",
];


// Extract product details from HTML
const extractData = (html, url) => {
  const $ = cheerio.load(html);

  const fullPriceText = $(".price--full")
    .text()
    .replace(/[^\d.]/g, "");
  const discountedPriceText = $(".price--discounted")
    .text()
    .replace(/[^\d.]/g, "");
  const currency =
    $(".price")
      .text()
      .match(/[A-Z]{3}/)?.[0] || "EUR"; // Adjust based on site format
  const title = $("h1.product-title").text().trim();

  const fullPrice = parseFloat(fullPriceText) || 0;
  const discountedPrice = parseFloat(discountedPriceText) || fullPrice;

  return {
    url,
    fullPrice,
    discountedPrice,
    currency,
    title,
  };
};

// 1️⃣ Crawl URLs in SEQUENCE
const crawlSequential = async () => {
  console.log("Crawling in SEQUENCE...");

  for (const url of urls) {
    try {
      const response = await gotScraping(url);
      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to load ${url} - Status: ${response.statusCode}`
        );
      }
      const productData = extractData(response.body, url);
      console.log(productData);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }
};

// 2️⃣ Crawl URLs in PARALLEL
const crawlParallel = async () => {
  console.log("Crawling in PARALLEL...");

  const promises = urls.map(async (url) => {
    try {
      const response = await gotScraping(url);
      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to load ${url} - Status: ${response.statusCode}`
        );
      }
      return extractData(response.body, url);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      return null;
    }
  });

  const results = await Promise.all(promises);
  console.log(results.filter(Boolean)); // Filter out failed requests
};

// Run both crawling functions
(async () => {
  await crawlSequential();
  await crawlParallel();
})();


/*
Example;

import { gotScraping } from "got-scraping";

gotScraping.get("https://apify.com").then(({ body }) => console.log(body));

gotScraping
  .get({
    url: "https://apify.com",
    proxyUrl: "http://usernamed:password@myproxy.com:1234",
  })
  .then(({ body }) => console.log(body));

const response = await gotScraping({
  url: "https://api.apify.com/v2/browser-info",
  headerGeneratorOptions: {
    browsers: [
      {
        name: "chrome",
        minVersion: 87,
        maxVersion: 89,
      },
    ],
    devices: ["desktop"],
    locales: ["de-DE", "en-US"],
    operatingSystems: ["windows", "linux"],
  },
});

//Overriding request headers

const response = await gotScraping({
  url: "https://apify.com/",
  headers: {
    "user-agent": "test",
  },
});

//JSON Mode

const response = await gotScraping({
  responseType: "json",
  url: "https://api.apify.com/v2/browser-info",
});

// ESM or TypeScript:
import * as cheerio from "cheerio";

// In other environments:
const cheerio = require("cheerio");

const $ = cheerio.load('<ul id="fruits">...</ul>');

$.html();
//=> <html><head></head><body><ul id="fruits">...</ul></body></html>

$(".apple", "#fruits").text();
//=> Apple

$("ul .pear").attr("class");
//=> pear

$("li[class=orange]").html();
//=> Orange

$.root().html();
//=>  <html>
//      <head></head>
//      <body>
//        <ul id="fruits">
//          <li class="apple">Apple</li>
//          <li class="orange">Orange</li>
//          <li class="pear">Pear</li>
//        </ul>
//      </body>
//    </html>

$(".pear").prop("outerHTML");
//=> <li class="pear">Pear</li>

const $ = cheerio.load("This is <em>content</em>.");
$("body").text();
//=> This is content.

//The "DOM Node" object

tagName;
parentNode;
previousSibling;
nextSibling;
nodeValue;
firstChild;
childNodes;
lastChild;
*/