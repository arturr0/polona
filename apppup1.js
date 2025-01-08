import axios from 'axios';
import puppeteer from 'puppeteer';

async function searchPolona() {
  try {
    const response = await axios.post('https://polona.pl/api/search-service/search/simple?query=&page=0&pageSize=4000&sort=RELEVANCE', {
      keywordFilters: {
        copyright: ['false'],
        keywords: ['Historia'],
        category: ['Książki'],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching Polona:', error.message);
    throw error;
  }
}

async function searchOnGoogle(fraza) {
  const query = fraza;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  const userDataDir = './puppeteer_temp_profile';

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox'],
      userDataDir,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const results = [];
    let nextPageUrl = null;

    do {
      const currentResults = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('.g a').forEach(link => {
          const href = link.getAttribute('href');
          
            links.push(href);
          
        });
        return links;
      });

      results.push(...currentResults);

      nextPageUrl = await page.evaluate(() => {
        const nextButton = document.querySelector('#pnnext');
        return nextButton ? nextButton.getAttribute('href') : null;
      });

      if (nextPageUrl) {
        await page.goto('https://www.google.com' + nextPageUrl, { waitUntil: 'domcontentloaded' });
      }
    } while (nextPageUrl);

    await browser.close();
    return results;
  } catch (error) {
    console.error('Error searching Google:', error.message);
    return [];
  }
}

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
        console.log(`Google results for "${title}":`, googleResults);
      }
    }
  } catch (error) {
    console.error('Error in main execution:', error.message);
  }
}

main();
