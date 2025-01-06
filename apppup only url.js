import puppeteer from 'puppeteer';

async function searchOnGoogle(fraza) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const query = `site:gov.pl ${'ulica'}`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const links = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('a');
    elements.forEach(element => {
      const link = element.getAttribute('href');
      if (link && link.startsWith('http') && link.includes('gov.pl')) {
        results.push(link);
      }
    });
    return results;
  });

  await browser.close();
  return links;
}

searchOnGoogle('projekt').then(results => console.log(results));
