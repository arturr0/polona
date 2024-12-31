const axios = require('axios');
const express = require('express');

async function fetchAllHits(query, pageSize = 10, sort = 'RELEVANCE') {
    if (!query || query.trim() === '') {
        throw new Error('Parametr "query" jest wymagany i nie może być pusty.');
    }

    const encodedQuery = encodeURIComponent(query);
    const url = (page) =>
        `https://polona.pl/api/search-service/search/simple?query=${encodedQuery}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    let allHits = [];
    let currentPage = 0;
    let totalPages = 1;

    try {
        while (currentPage < totalPages) {
            const requestUrl = url(currentPage);
            console.log(`Wysyłanie zapytania: ${requestUrl}`); // Logowanie URL

            const response = await axios.get(requestUrl, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const filteredHits = response.data.hits.filter(hit => {
                const rights = hit.expandedFields?.rights?.values?.[0];
                return rights === "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.";
            });

            allHits = [...allHits, ...filteredHits];
            totalPages = response.data.totalPages;
            currentPage++;
        }

        return allHits;
    } catch (error) {
        console.error(`Błąd API Polona: ${error.message}`);
        throw error;
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint do wyświetlania przefiltrowanych wyników
app.get('/filtered-hits', async (req, res) => {
    const { query, pageSize = 10, sort = 'RELEVANCE' } = req.query;

    try {
        const filteredHits = await fetchAllHits(query, pageSize, sort);

        // Zwracamy przefiltrowane hity w formacie JSON
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(filteredHits);
    } catch (error) {
        console.error('Błąd podczas pobierania hits:', error.message);

        // Zwrócenie błędu
        res.status(500).json({ error: error.message });
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
