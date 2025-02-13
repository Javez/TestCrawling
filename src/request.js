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
import * as fs from "fs";

const urls = [
  "https://www.miinto.it/p-de-ver-s-abito-slip-3059591a-7c04-405c-8015-0936fc8ff9dd",
  "https://www.miinto.it/p-abito-a-spalline-d-jeny-fdac3d17-f571-4b55-8780-97dddf80ef35",
  "https://www.miinto.it/p-abito-bianco-con-stampa-grafica-e-scollo-a-v-profondo-2b03a3d9-fab1-492f-8efa-9151d3322ae7",
];

const extractData = (html, url) => {
  const $ = cheerio.load(html);

  const title = $("h1[data-testid='product-name']").text().trim();

  const fullPriceText = $("p[data-testid='product-price']")
    .text()
    .trim()
    .replace(/[^\d,.-]/g, "") 
    .replace(",", ".");

  const discountedPriceText = $("p[data-testid='product-previous-price']")
    .text()
    .trim()
    .replace(/[^\d,.-]/g, "") 
    .replace(",", ".");

  const fullPrice = parseFloat(fullPriceText).toFixed(2);
  const discountedPrice = discountedPriceText
    ? parseFloat(discountedPriceText).toFixed(2)
    : fullPrice;

  const priceText = $("p[data-testid='product-price']").text().trim();

  const currencySymbol = priceText.match(/[\€\$\£\¥\₹]/)?.[0] || "";
  let currency = undefined;
  if (currencySymbol === "€") {
    currency = "EUR";
  } else if (currencySymbol === "$") {
    currency = "USD";
  } else if (currencySymbol === "£") {
    currency = "GBP";
  } else if (currencySymbol === "¥") {
    currency = "JPY";
  } else if (currencySymbol === "₹") {
    currency = "INR";
  }

  return {
    url,
    fullPrice,
    discountedPrice,
    currency,
    title,
  };
};

const crawlSequential = async () => {
  const results = [];
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
      results.push(productData);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }

  return results;
};

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
  return results;
};

(async () => {
  const resultOne = await crawlSequential();
  const resultTwo = await crawlParallel();

  try {
    fs.writeFileSync(
      "./src/request-sequential-result.json",
      JSON.stringify({ resultOne }, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      "./src/request-parralel-result.json",
      JSON.stringify({ resultTwo }, null, 2),
      "utf8"
    );
    console.log("Finished writing result");
  } catch (err) {
    console.log("Error during work:\n", err);
  }
})();