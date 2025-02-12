/**
 * 1) -----------------------------------------------------------------------------------------------------------
 *      Use puppeteer navigate to the following urls.
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
 *
 * 2) -----------------------------------------------------------------------------------------------------------
 *      Extract product options (from the select form) and log them
 *      Select/click on the second option (if the second one doesn't exist, select/click the first)
 *
 *      Log options example:
 *      [
 *          {
 *              value: 'Blu - L/XL',
 *              optionValue: '266,1033', // Attribute "value" of option element
 *          }
 *      ]
 * --------------------------------------------------------------------------------------------------------------
 */
import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

const urls = [
    'https://www.outdoorsrlshop.it/catalogo/1883-trekker-rip.html',
    'https://www.outdoorsrlshop.it/catalogo/2928-arco-man-t-shirt.html'
];

async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (const url of urls) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      const status = response.status();

      if (status !== 200) {
        throw new Error(`Failed to load ${url} - Status: ${status}`);
      }

      // Extract HTML and load into Cheerio
      const content = await page.content();
      const $ = cheerio.load(content);

      // Extract product details (Modify selectors based on actual website structure)
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

      console.log({
        url,
        fullPrice,
        discountedPrice,
        currency,
        title,
      });

      // Extract product options
      const options = [];
      const selectElement = await page.$("select");
      if (selectElement) {
        const optionElements = await page.$$("select option");

        for (const option of optionElements) {
          const value = await option.evaluate((el) => el.textContent.trim());
          const optionValue = await option.evaluate((el) =>
            el.getAttribute("value")
          );

          options.push({ value, optionValue });
        }

        console.log("Product options:", options);

        // Select the second option if available, otherwise the first
        if (options.length > 1) {
          await page.select("select", options[1].optionValue);
        } else if (options.length > 0) {
          await page.select("select", options[0].optionValue);
        }
      }
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }

  await browser.close();
}

scrape();


/*Example;

import puppeteer from "puppeteer";
// Or import puppeteer from 'puppeteer-core';

// Launch the browser and open a new blank page
const browser = await puppeteer.launch();
const page = await browser.newPage();

// Navigate the page to a URL.
await page.goto("https://developer.chrome.com/");

// Set screen size.
await page.setViewport({ width: 1080, height: 1024 });

// Type into search box.
await page.locator(".devsite-search-field").fill("automate beyond recorder");

// Wait and click on first result.
await page.locator(".devsite-result-item-link").click();

// Locate the full title with a unique string.
const textSelector = await page
  .locator("text/Customize and automate")
  .waitHandle();
const fullTitle = await textSelector?.evaluate((el) => el.textContent);

// Print the full title.
console.log('The title of this blog post is "%s".', fullTitle);

await browser.close();
*/