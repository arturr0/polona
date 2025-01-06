import requests
from bs4 import BeautifulSoup

def scrape_website(url, search_term):
    try:
        response = requests.get(url)
        soup = BeautifulSoup(response.text, 'html.parser')
        body_text = soup.get_text().lower()
        count = body_text.count(search_term.lower())
        return f'Found "{search_term}" {count} times on {url}'
    except Exception as e:
        return f'Error scraping {url}: {str(e)}'

# Example usage
url = 'https://www.gov.pl/web/finanse'
print(scrape_website(url, 'ustawa'))
