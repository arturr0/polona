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

            const hits = response.data.hits;

            // Dodajemy wyniki do listy
            allHits = [...allHits, ...hits];

            // Aktualizacja liczby stron
            totalPages = response.data.totalPages;
            currentPage++;
        }

        return allHits; // Zwróć wszystkie hity
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.message}`);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint do wyświetlania wszystkich wyników
app.get('/all-hits', async (req, res) => {
    const { query, pageSize = 10, sort = 'RELEVANCE' } = req.query;

    try {
        const hits = await fetchAllHits(query, pageSize, sort);

        // Zwracamy wszystkie hity w formacie JSON
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(hits);
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
