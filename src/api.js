/**
 * 1) -----------------------------------------------------------------------------------------------------------
 *      Analyze browser Network Tab to find apis of the following urls.
 *      Tips: extract the productId from the url string.
 *      Use gotScraping to make a request to those apis.
 *
 *      Parse the json and extract:
 *          - fullPrice (it has to be a number)
 *          - discountedPrice (it has to be a number, if it does not exist same as fullPrice)
 *          - currency (written in 3 letters [GBP, USD, EUR...])
 *          - title (product title)
 *
 *      Result example
 *      {
 *          url: ${urlCrawled},
 *          apiUrl: ${apiUrl},
 *          fullPrice: 2000.12,
 *          discountedPrice: 1452.02,
 *          currency: 'GBP',
 *          title: 'Aqualung Computer subacqueo i330R'
 *      }
 * --------------------------------------------------------------------------------------------------------------
 */
import { gotScraping } from "got-scraping";

const urls = [
  "https://www.stoneisland.com/en-it/collection/polos-and-t-shirts/slim-fit-short-sleeve-polo-shirt-2sc17-stretch-organic-cotton-pique-81152SC17A0029.html",
  "https://www.stoneisland.com/en-it/collection/polos-and-t-shirts/short-sleeve-polo-shirt-22r39-50-2-organic-cotton-pique-811522R39V0097.html",
];

async function scrape() {
  for (const url of urls) {
    try {
      const productIdMatch = url.match(/-([\w\d]+)\.html$/);

      if (!productIdMatch) {
        console.error(`Could not extract product ID from URL: ${url}`);
        continue;
      }

      const productId = productIdMatch ? productIdMatch[1] : null;
      const locale = "en_IT";
      const apiUrl = `https://www.stoneisland.com/on/demandware.store/Sites-StoneEU-Site/${locale}/ProductApi-Product?pid=${productId}`;
      const response = await gotScraping({ url: apiUrl, responseType: "json" });

      if (response.statusCode !== 200) {
        throw new Error(
          `Failed to load ${apiUrl} - Status: ${response.statusCode}`
        );
      }

      const data = response.body;

      const result = {
        url,
        apiUrl,
        productId: productId,
        fullPrice: parseFloat(data.price.list.value || 0),
        discountedPrice: parseFloat(
          data.price.sales?.value || data.price.list?.value || 0
        ),
        currency: data.price.list?.currency || "N/A",
        title: data.pageMetaTags?.["og:title"] || data.productName || "Unknown",
      };

      console.log("Result:", result);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error.message);
    }
  }
}

scrape();

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
*/
