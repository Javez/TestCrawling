/**
 * 1) -----------------------------------------------------------------------------------------------------------
 *      Use playwright navigate to the following urls.
 *      Check response status code (200, 404, 403), proceed only in case of code 200, throw an error in other cases.
 *      Use playwright methods select the country associated with the url.
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
 *          currency: 'GBP',
 *          title: 'Aqualung Computer subacqueo i330R'
 *      }
 * --------------------------------------------------------------------------------------------------------------
 */

import { chromium } from "playwright";
import * as cheerio from "cheerio";
import * as fs from "fs";

const urls = [
  {
    url: "https://www.selfridges.com/US/en/product/fear-of-god-essentials-camouflage-panels-relaxed-fit-woven-blend-overshirt_R04364969/#colour=WOODLAND%20CAMO",
    country: "GB",
  },
  {
    url: "https://www.selfridges.com/ES/en/product/gucci-interlocking-g-print-crewneck-cotton-jersey-t-shirt_R04247338/",
    country: "US",
  },
  {
    url: "https://www.selfridges.com/US/en/product/fear-of-god-essentials-essentials-cotton-jersey-t-shirt_R04318378/#colour=BLACK",
    country: "IT",
  },
];

async function scrape() {
  const browser = await chromium.launch({ headless: false });
  const results = [];

  for (const { url, country } of urls) {
    try {
      const context = await browser.newContext({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        locale: `en-${country}`,
        extraHTTPHeaders: {
          "accept-language": `en-${country},en;q=0.9`,
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "navigate",
          "sec-fetch-user": "?1",
          "sec-fetch-dest": "document",
          "upgrade-insecure-requests": "1",
        },
      });

      const page = await browser.newPage();

      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      const status = response.status();

      if (status !== 200) {
        throw new Error(`Failed to load ${url}\nStatus: ${status}`);
      }

      await page.waitForTimeout(3000);

      const content = await page.content();
      const $ = cheerio.load(content);

      const title = $("h1 .sc-5ec017c-3").text().trim();
      const fullPriceText =
        $(".sc-eb97dd86-1 span")
          .text()
          .replace(/[^\d.]/g, "") || undefined;
      const discountedPriceText =
        $(".sc-eb97dd86-2")
          .text()
          .replace(/[^\d.]/g, "") || undefined;
      const currency =
        $(".translation-country-selector-trigger-flag a")
          .text()
          .match(/[A-Z]{3}/)?.[0] || undefined;
      if (!title) throw new Error(`Could not extract title from ${url}`);
      if (!fullPriceText)
        throw new Error(`Could not extract price from ${url}`);
      if (!currency) throw new Error(`Could not extract currency from ${url}`);

      const fullPrice = parseFloat(fullPriceText) || 0;
      const discountedPrice = parseFloat(discountedPriceText) || "No Discount";

      results.push({
        url,
        fullPrice,
        discountedPrice,
        currency,
        title,
      });

      await context.close();
    } catch (error) {
      console.error(`Error scraping \n${url}\n${error.message}\n`);
      continue;
    }
  }

  await browser.close();
  try {
    fs.writeFileSync(
      "./src/playwright-result.json",
      JSON.stringify({ results }, null, 2),
      "utf8"
    );
    console.log("Finished writing result");
  } catch (err) {
    console.log("Error during work:\n", err);
  }
}

scrape();