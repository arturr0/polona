import axios from 'axios';
import { load } from 'cheerio';
import puppeteer from 'puppeteer';
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
    return response.data; // Return the response data
  } catch (error) {
    console.error('Error searching Polona:', error.message);
    throw error; // Rethrow the error to handle it in the caller
  }
}

// Function to search on Google


async function searchOnGoogle(query) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
  const results = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.tF2Cxc')).map(element => ({
      title: element.querySelector('h3')?.innerText,
      link: element.querySelector('a')?.href,
      snippet: element.querySelector('.VwiC3b')?.innerText,
    }));
  });

  await browser.close();
  return results;
}


// Function to introduce a delay between requests (to avoid rate-limiting)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
async function main() {
  try {
    console.log('Fetching data from Polona...');
    const polonaData = await searchPolona();

    if (!polonaData || !polonaData.hits || polonaData.hits.length === 0) {
      console.log('No results found on Polona.');
      return;
    }

    console.log(`Found ${polonaData.hits.length} items on Polona.`);
    const batchSize = 5;

    for (let i = 0; i < polonaData.hits.length; i += batchSize) {
      const batch = polonaData.hits.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (hit) => {
          const title = hit.basicFields?.title?.values?.[0];
          if (title) {
            console.log(`Searching for "${title}" on Google...`);
            const googleResults = await searchOnGoogle(title);
            console.log(`Google results for "${title}":`, googleResults);

            // Additional validation: Check if the search result title matches the Polona title
            const exactMatch = googleResults.filter(result =>
              result.title.toLowerCase().includes(title.toLowerCase())
            );

            if (exactMatch.length > 0) {
              console.log(`Exact match found for "${title}":`, exactMatch);
            } else {
              console.log(`No exact match found for "${title}"`);
            }

            // Introducing a delay to avoid overwhelming Google
            await delay(1000); // 1-second delay between requests
          }
        })
      );
    }
  } catch (error) {
    console.error('Error in main execution:', error.message);
  }
}

// Execute the main function
main();
