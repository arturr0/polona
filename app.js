const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Funkcja do wyszukiwania w Polona API
async function searchPolona(query, page = 0, pageSize = 10, sort = 'RELEVANCE') {
    const url = `https://polona.pl/api/search-service/search/simple?query=${query}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    try {
        const response = await axios.get(url);  // Używamy GET, aby poprawnie wysłać zapytanie
        return response.data;
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.message}`);
    }
}

// Funkcja filtrująca wyniki po tytule i prawach autorskich
function filterByTitleAndRights(hits, titleContains, rightsValue) {
    return hits.filter(hit => {
        const titleMatch = hit.basicFields.title.values[0].toLowerCase().includes(titleContains.toLowerCase());
        const rightsMatch = hit.expandedFields.rights.values[0] === rightsValue;
        return titleMatch && rightsMatch;
    });
}

// Endpoint API
app.get('/search', async (req, res) => {
    const { query, page = 0, pageSize = 10, sort = 'RELEVANCE', titleContains = 'c++', rights } = req.query;

    // Wartość praw autorskich, jeśli nie jest podana, ustawiamy jako domyślną
    const defaultRights = "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.";

    try {
        // Wyszukiwanie w Polona API
        const data = await searchPolona(query, page, pageSize, sort);

        // Filtrujemy dane, jeżeli są określone warunki wyszukiwania
        let filteredHits = data.hits;
        
        // Filtruj po tytule i prawach, jeżeli oba warunki są podane
        if (titleContains || rights) {
            filteredHits = filterByTitleAndRights(filteredHits, titleContains, rights || defaultRights);
        }

        // Zwróć dane z przefiltrowanymi wynikami
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({ ...data, hits: filteredHits });
    } catch (error) {
        console.error('Błąd podczas wyszukiwania:', error.message);

        // Zwróć błąd, jeśli wystąpił problem
        res.status(500).json({ error: error.message });
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
