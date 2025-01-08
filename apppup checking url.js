//const puppeteer = require('puppeteer');
import puppeteer from 'puppeteer';

async function searchOnGovPages(searchTerm) {
  try {
    // Launch Puppeteer browser in headless mode
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Perform the search for gov.pl sites on Google
    const query = `site:gov.pl ${searchTerm}`;
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    // Go to Google Search
    await page.goto(googleSearchUrl, { waitUntil: 'domcontentloaded' });

    // Wait for the search results to load
    await page.waitForSelector('a');

    // Extract links from the Google search results
    const urls = await page.evaluate(() => {
      const links = [];
      const anchorTags = document.querySelectorAll('a');
      anchorTags.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('gov.pl')) {
          links.push(href);
        }
      });
      return links;
    });

    // Initialize an array to store the results
    const searchResults = [];

    // Loop through the URLs and check the page content
    for (const url of urls) {
      // Only proceed if the URL is valid
      if (url && url.startsWith('http')) {
        console.log(`Checking URL: ${url}`);

        // Go to each gov.pl page
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Wait for the body content to load
        await page.waitForSelector('body');

        // Extract the page content
        const pageContent = await page.evaluate(() => {
          return document.body.innerText || document.body.textContent;
        });

        // Check if the search term is in the page content
        if (pageContent.includes(searchTerm)) {
          searchResults.push(url);
        }
      }
    }

    // Close the browser after checking all pages
    await browser.close();

    // Return the search results
    return searchResults;

  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

// Example usage: Searching for "ustawa" on gov.pl pages
searchOnGovPages('Legionowo').then(results => {
  if (results.length > 0) {
    console.log('Found the term in the following URLs:');
    results.forEach(url => {
      console.log(url);
    });
  } else {
    console.log('No pages found with the specified term.');
  }
});
