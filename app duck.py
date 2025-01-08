import requests
from bs4 import BeautifulSoup

def search_gov_urls(search_term):
    search_url = f"https://duckduckgo.com/html/?q=site:gov.pl+{search_term}"
    response = requests.get(search_url)
    
    if response.status_code != 200:
        print("Error fetching search results")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    urls = []
    
    # Extract the URLs from the search result page
    for result in soup.find_all('a', class_='result__a'):
        href = result.get('href')
        if href and "gov.pl" in href:
            urls.append(href)
    
    return urls

# Example usage
gov_urls = search_gov_urls("ustawa")
for url in gov_urls:
    print(url)
