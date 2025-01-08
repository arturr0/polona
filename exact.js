import axios from 'axios';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
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
async function searchOnGoogle(fraza) {
  try {
    // Use quotes around the search phrase for exact matching
    const query = `site:gov.pl "${fraza}"`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for search results to load
    await page.waitForSelector('.g');

    // Extract URLs from the search results
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

// Function to validate exact match in the page content
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
    // Fetch data from Polona
    const polonaData = await searchPolona();
    
    // If there are no results from Polona, exit
    if (!polonaData || !polonaData.hits || polonaData.hits.length === 0) {
      console.log('No results found on Polona.');
      return;
    }

    // For each hit in the Polona data, perform a Google search
    for (const hit of polonaData.hits) {
      const title = hit.basicFields?.title?.values?.[0]; // Get the title of the item
      
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
