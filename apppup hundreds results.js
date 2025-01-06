import puppeteer from 'puppeteer';

async function searchOnGoogle(fraza) {
  try {
    const query = `site:gov.pl ${fraza}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    // Launch Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Wait for search results to load
    await page.waitForSelector('.g');

    // Extract URLs from the search results
    const results = [];
    let nextPageUrl = null;
    do {
      const currentResults = await page.evaluate(() => {
        const links = [];
        document.querySelectorAll('.g a').forEach(link => {
          const href = link.getAttribute('href');
          if (href && href.includes('gov.pl') && href.startsWith('http')) {
            links.push(href);
          }
        });
        return links;
      });
      results.push(...currentResults);

      // Check if there's a next page
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
    console.error('Błąd wyszukiwania:', error.message);
    return [];
  }
}

// Example usage:
searchOnGoogle('ustawa').then(results => {
  console.log(results);
});
