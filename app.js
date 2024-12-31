const axios = require('axios');
const express = require('express');

async function searchPolona(query, page = 0, pageSize = 10, sort = 'RELEVANCE') {
    const url = (page) => 
        `https://polona.pl/api/search-service/search/simple?query=${query}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    let results = [];
    let currentPage = page;

    try {
        while (results.length < pageSize) {
            const response = await axios.get(url(currentPage), {
                headers: { 'Content-Type': 'application/json' },
            });

            const filteredHits = response.data.hits.filter(hit => {
                const rights = hit.expandedFields?.rights?.values?.[0];
                return rights === "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.";
            });

            results = [...results, ...filteredHits];
            currentPage++;

            if (response.data.totalPages <= currentPage) break; // Przerwij, jeśli osiągnięto ostatnią stronę
        }

        return { hits: results.slice(0, pageSize), totalElements: results.length };
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.message}`);
    }
}


const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint wyszukiwania
app.get('/search', async (req, res) => {
    const { query, page = 0, pageSize = 10, sort = 'RELEVANCE' } = req.query;

    try {
        // Wykonanie wyszukiwania za pomocą Polona API
        const data = await searchPolona(query, page, pageSize, sort);

        // Wysłanie danych do przeglądarki
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(data);
    } catch (error) {
        console.error('Błąd podczas wyszukiwania:', error.message);

        // Wysłanie błędu w przypadku niepowodzenia
        res.status(500).json({ error: error.message });
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
