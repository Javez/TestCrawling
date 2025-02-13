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
import * as fs from "fs";

const urls = [
  "https://www.outdoorsrlshop.it/catalogo/1883-trekker-rip.html",
  "https://www.outdoorsrlshop.it/catalogo/2928-arco-man-t-shirt.html",
  "https://www.outdoorsrlshop.it/catalogo/2383-aircontact-core-65-10-sl.html", //added because previos links does not have discount prices
];

async function scrape() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const results = [];

  for (const url of urls) {
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded" });
      const status = response.status();

      if (status !== 200) {
        throw new Error(`Failed to load ${url} - Status: ${status}`);
      }

      const content = await page.content();
      const $ = cheerio.load(content);

      const title = $("h1").text().trim();

      const prezzoDiv = $("main .valutazione").next(".prezzo");

      const fullPriceText = prezzoDiv.find(".upyPrezzoFinale").text().trim();

      const discountedPriceText = prezzoDiv
        .find(".upyPrezzoScontato")
        .text()
        .trim();

      const priceText = prezzoDiv.text().trim();

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

      const fullPrice =
        parseFloat(
          fullPriceText.replace(/[^\d,.-]/g, "").replace(",", ".")
        ).toFixed(2) || 0;
      const discountedPrice = discountedPriceText
        ? parseFloat(
            discountedPriceText.replace(/[^\d,.-]/g, "").replace(",", ".")
          ).toFixed(2)
        : fullPrice;

      const options = [];
      const selectElement = await page.$("select.scegliVarianti");
      if (selectElement) {
        const optionElements = await page.$$("select.scegliVarianti option");

        for (const option of optionElements) {
          const value = await option.evaluate((el) => el.textContent.trim());
          const optionValue = await option.evaluate((el) =>
            el.getAttribute("value")
          );

          options.push({ value, optionValue });
        }

        if (options.length > 1) {
          await page.select("select.scegliVarianti", options[1].optionValue);
        } else if (options.length > 0) {
          await page.select("select.scegliVarianti", options[0].optionValue);
        }
      }

      results.push({
        url,
        fullPrice,
        discountedPrice,
        currency,
        title,
        options,
      });
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }

  await browser.close();

  try {
    fs.writeFileSync(
      "./src/puppeteer-result.json",
      JSON.stringify({ results }, null, 2),
      "utf8"
    );
    console.log("Finished writing result");
  } catch (err) {
    console.log("Error during work:\n", err);
  }
}

scrape();