async function searchOnGoogle(fraza) {
    try {
      const query = `site:gov.pl ${fraza}`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  
      const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
      const page = await browser.newPage();
  
      // Set user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
      await page.goto(url, { waitUntil: 'domcontentloaded' });
  
      // Increase timeout
      await page.waitForSelector('.g', { timeout: 60000 });
  
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
  