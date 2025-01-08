import axios from 'axios';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

// Enable Puppeteer stealth mode to avoid bot detection
puppeteer.use(StealthPlugin());

// Function to perform a search query on Polona
async function searchPolona() {
  try {
    const response = await axios.post(
      'https://polona.pl/api/search-service/search/simple?query=&page=0&pageSize=4000&sort=RELEVANCE',
      {
        keywordFilters: {
          copyright: ['false'],
          keywords: ['Historia'],
          category: ['Książki'],
          language: ['polski'],
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error searching Polona:', error.message);
    throw error;
  }
}

// Function to search on Google with Puppeteer
async function searchOnGoogle(fraza, proxy = null) {
  try {
    const query = `site:gov.pl "${fraza}"`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (proxy) {
      launchOptions.args.push(`--proxy-server=${proxy}`);
    }

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

    try {
      console.log('Waiting for search results...');
      await page.waitForSelector('.g', { timeout: 120000 });
    } catch (error) {
      console.error('Selector not found. Capturing screenshot...');
      await page.screenshot({ path: 'google_error.png' });
      throw error;
    }

    const results = await page.evaluate(() => {
      const links = [];
      document.querySelectorAll('.g a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('gov.pl') && href.startsWith('http')) {
          links.push(href);
        }
      });
      return links;
    });

    await browser.close();
    return results;
  } catch (error) {
    console.error('Error searching Google:', error.message);
    return [];
  }
}

// Function to validate exact matches in the page content
async function validateExactMatch(urls, title) {
  const validatedUrls = [];
  for (const url of urls) {
    try {
      const response = await axios.get(url);
      const html = response.data;
      const $ = cheerio.load(html);

      // Check if the title is found in the page content
      if ($('body').text().includes(title)) {
        validatedUrls.push(url);
      }
    } catch (error) {
      console.error(`Error validating URL ${url}:`, error.message);
    }
  }
  return validatedUrls;
}

// Main function to search on Polona and then Google
async function main() {
  try {
    const polonaData = await searchPolona();
    if (!polonaData || !polonaData.hits || polonaData.hits.length === 0) {
      console.log('No results found on Polona.');
      return;
    }

    for (const hit of polonaData.hits) {
      const title = hit.basicFields?.title?.values?.[0];
      if (title) {
        console.log(`Searching for "${title}" on Google...`);
        const googleResults = await searchOnGoogle(title);

        console.log(`Validating results for "${title}"...`);
        const validatedResults = await validateExactMatch(googleResults, title);

        console.log(`Exact matches for "${title}":`, validatedResults);
      }
    }
  } catch (error) {
    console.error('Error in main execution:', error.message);
  }
}

// Run the main function
main();
