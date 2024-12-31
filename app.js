const axios = require('axios');
const express = require('express');

async function fetchAllHits(query, pageSize = 10, sort = 'RELEVANCE') {
    const url = (page) =>
        `https://polona.pl/api/search-service/search/simple?query=${query}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    let allHits = [];
    let currentPage = 0;
    let totalPages = 1; // Początkowa wartość, zostanie nadpisana po pierwszym żądaniu

    try {
        while (currentPage < totalPages) {
            const response = await axios.get(url(currentPage), {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            // Filtruj wyniki na bieżąco
            const filteredHits = response.data.hits.filter(hit => {
                const rights = hit.expandedFields?.rights?.values?.[0];
                return rights === "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.";
            });

            // Dodajemy przefiltrowane wyniki do listy
            allHits = [...allHits, ...filteredHits];

            // Aktualizacja liczby stron
            totalPages = response.data.totalPages;
            currentPage++;
        }

        return allHits; // Zwróć wszystkie przefiltrowane hity
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.message}`);
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
