const axios = require('axios');
const express = require('express');

async function fetchAllHits(query, pageSize = 10, sort = 'RELEVANCE') {
    const url = (page) =>
        `https://polona.pl/api/search-service/search/simple?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    let allHits = [];
    let currentPage = 0;
    let totalPages = 1; // Początkowa wartość, zostanie nadpisana po pierwszym żądaniu

    try {
        while (currentPage < totalPages) {
            try {
                const response = await axios.get(url(currentPage), {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                const hits = response.data.hits;

                // Filtrujemy wyniki, pozostawiając tylko rekordy z odpowiednią domeną
                const filteredHits = hits.filter(hit => {
                    const rights = hit.expandedFields?.rights?.values?.[0];
                    return rights === "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.";
                });

                // Dodajemy przefiltrowane wyniki do listy
                allHits = [...allHits, ...filteredHits];

                // Aktualizacja liczby stron
                totalPages = response.data.totalPages;
                currentPage++;
            } catch (error) {
                console.warn(`Błąd na stronie ${currentPage}: ${error.message}`);

                // Opcjonalnie: przerwij działanie, jeśli błąd jest krytyczny
                if (error.response?.status !== 400 || pageSize === 1) {
                    throw error;
                }

                // W przypadku błędu 400 zmniejsz pageSize i spróbuj ponownie
                pageSize = Math.max(1, Math.floor(pageSize / 2));
                console.log(`Zmniejszono pageSize do ${pageSize}`);
            }
        }

        return allHits; // Zwróć wszystkie przefiltrowane wyniki
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
