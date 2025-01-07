from googlesearch import search
import requests
from bs4 import BeautifulSoup

def search_gov_pl(query, max_results=10):
    # Add the `site:gov.pl` filter to search only .gov.pl domains
    search_query = f"{query} site:gov.pl"
    
    # Perform the search
    results = []
    for url in search(search_query, num_results=max_results):
        results.append(url)
    
    return results

def scrape_page_content(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        return soup.get_text()  # Get all text content from the page
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None

# Main code
if __name__ == "__main__":
    word_to_search = "Historia"
    max_results = 5  # Limit results for demonstration
    
    print(f"Searching for '{word_to_search}' on *.gov.pl domains...")
    gov_pl_results = search_gov_pl(word_to_search, max_results=max_results)
    
    for index, url in enumerate(gov_pl_results, start=1):
        print(f"\nResult {index}: {url}")
        page_content = scrape_page_content(url)
        if page_content and word_to_search.lower() in page_content.lower():
            print(f"'{word_to_search}' found on this page!")
        else:
            print(f"'{word_to_search}' NOT found on this page.")
