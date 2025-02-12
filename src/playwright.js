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
  const browser = await chromium.launch({ headless: true });

  for (const { url, country } of urls) {
    try {
      const context = await browser.newContext({ locale: `en-${country}` });
      const page = await context.newPage();

      const response = await page.goto(url);
      const status = response.status();

      if (status !== 200) {
        throw new Error(`Failed to load ${url} - Status: ${status}`);
      }

      await page.waitForTimeout(2000);

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

      console.log({
        url,
        fullPrice,
        discountedPrice,
        currency,
        title,
      });

      await context.close();
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
      continue;
    }
  }

  await browser.close();
}

scrape();

/*Example;

//npx playwright test
//npx playwright show-report
//npx playwright test --ui

import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto('https://playwright.dev/');

  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});

//Actions
//Navigation

//Most of the tests will start with navigating page to the URL. After that, test will be able to interact with the page elements.

await page.goto('https://playwright.dev/');

// Create a locator.
const getStarted = page.getByRole('link', { name: 'Get started' });

// Click it.
await getStarted.click();

await page.getByRole('link', { name: 'Get started' }).click();

locator.check()	//Check the input checkbox
locator.click()	//Click the element
locator.uncheck()	//Uncheck the input checkbox
locator.hover()	//Hover mouse over the element
locator.fill()	//Fill the form field, input text
locator.focus()	//Focus the element
locator.press()	//Press single key
locator.setInputFiles()	//Pick files to upload
locator.selectOption()	//Select option in the drop down

expect(success).toBeTruthy();

await expect(page).toHaveTitle(/Playwright/);

expect(locator).toBeChecked()	//Checkbox is checked
expect(locator).toBeEnabled()	//Control is enabled
expect(locator).toBeVisible()	//Element is visible
expect(locator).toContainText()	//Element contains text
expect(locator).toHaveAttribute()	//Element has attribute
expect(locator).toHaveCount()	//List of elements has given length
expect(locator).toHaveText()	//Element matches text
expect(locator).toHaveValue()	//Input element has value
expect(page).toHaveTitle()	//Page has title
expect(page).toHaveURL()	////Page has URL

//Test Isolation

import { test } from '@playwright/test';

test('example test', async ({ page }) => {
  // "page" belongs to an isolated BrowserContext, created for this specific test.
});

test('another test', async ({ page }) => {
  // "page" in this second test is completely isolated from the first test.
});

//Using Test Hooks

import { test, expect } from '@playwright/test';

test.describe('navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the starting url before each test.
    await page.goto('https://playwright.dev/');
  });

  test('main navigation', async ({ page }) => {
    // Assertions use the expect API.
    await expect(page).toHaveURL('https://playwright.dev/');
  });
});
*/
