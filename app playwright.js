import { chromium } from 'playwright';

async function searchOnGoogle(fraza) {
  try {
    const query = `site:gov.pl ${fraza}`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    // Launch Playwright browser
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // Zbieranie wyników
    const results = [];
    let nextPageUrl = null;

    do {
      // Zbieranie linków z aktualnej strony wyników
      const currentResults = await page.evaluate(() => {
        const links = [];
        const elements = document.querySelectorAll('.g a');
        
        elements.forEach(element => {
          const href = element.getAttribute('href');
          if (href && href.includes('gov.pl') && href.startsWith('http')) {
            links.push(href);
          }
        });
        
        return links;
      });
      results.push(...currentResults);

      // Sprawdzanie, czy istnieje przycisk 'następna strona'
      nextPageUrl = await page.evaluate(() => {
        const nextButton = document.querySelector('#pnnext');
        return nextButton ? nextButton.getAttribute('href') : null;
      });

      // Przechodzimy do kolejnej strony, jeśli istnieje
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

// Przykład użycia:
searchOnGoogle('ustawa').then(results => {
  console.log(results);
});
