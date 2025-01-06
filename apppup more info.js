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

    // Now let's scrape the content of each page
    const pageContents = [];
    for (let link of results) {
      const pageContent = await scrapePageContent(link, browser);
      pageContents.push({ url: link, content: pageContent });
    }

    await browser.close();
    return pageContents;
  } catch (error) {
    console.error('Błąd wyszukiwania:', error.message);
    return [];
  }
}

async function scrapePageContent(url, browser) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Scrape the page content (you can modify this part depending on the specific content you need)
  const content = await page.evaluate(() => {
    // For example, you could scrape the main body content
    const bodyText = document.body.innerText;
    return bodyText;
  });

  await page.close();
  return content;
}

// Example usage:
searchOnGoogle('ustawa').then(results => {
  results.forEach(result => {
    console.log(`URL: ${result.url}`);
    console.log(`Content: ${result.content.slice(0, 200)}...`);  // Show the first 200 chars
  });
});
