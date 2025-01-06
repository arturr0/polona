import requests
from bs4 import BeautifulSoup

def scrape_gov_pl(search_term):
    search_url = f"https://duckduckgo.com/html/?q=site%3Agov.pl+{search_term}"
    response = requests.get(search_url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        results = []

        # Look for results with anchor tags containing the 'result__a' class
        for link in soup.find_all('a', class_='result__a'):
            url = link.get('href')
            if url:
                results.append(url)

        return results
    else:
        return f"Error: {response.status_code}"

# Example usage
search_results = scrape_gov_pl('ustawa')
for result in search_results:
    print(result)
