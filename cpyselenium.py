import requests
from bs4 import BeautifulSoup

def search_gov_pl(query, max_results=10):
    query = f"{query} site:gov.pl"
    search_url = f"https://www.google.com/search?q={query}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"
    }
    
    # Send HTTP request to Google search results page
    response = requests.get(search_url, headers=headers)
    if response.status_code != 200:
        print(f"Error fetching search results: {response.status_code}")
        return []
    
    # Parse the HTML content
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extract all URLs from the search result
    results = []
    for a_tag in soup.find_all('a', href=True):
        href = a_tag['href']
        if 'url?q=' in href:
            url = href.split('url?q=')[1].split('&')[0]
            if 'gov.pl' in url:
                results.append(url)
        
        if len(results) >= max_results:
            break

    return results

def scrape_and_check(url, word):
    try:
        # Send HTTP request to fetch the page content
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error fetching URL: {url} ({response.status_code})")
            return False
        
        # Parse the page content
        page_text = response.text.lower()  # Convert to lowercase for case-insensitive search
        
        # Check if the word exists in the content
        return word.lower() in page_text
    except Exception as e:
        print(f"Error scraping {url}: {e}")
        return False

# Main code
if __name__ == "__main__":
    word_to_search = "ustawa"
    max_results = 5
    
    print(f"Searching for '{word_to_search}' on *.gov.pl domains...")
    gov_pl_results = search_gov_pl(word_to_search, max_results=max_results)
    
    for index, url in enumerate(gov_pl_results, start=1):
        print(f"\nResult {index}: {url}")
        found = scrape_and_check(url, word_to_search)
        if found:
            print(f"'{word_to_search}' found on this page!")
        else:
            print(f"'{word_to_search}' NOT found on this page.")
