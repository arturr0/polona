const axios = require('axios');
const express = require('express');

async function fetchAllHits(keywords, pageSize = 10, sort = 'RELEVANCE') {
    const url = (page) =>
        `https://polona.pl/api/search-service/search/simple?query=${keywords}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

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

            // Filtrowanie wyników na podstawie przekazanego słowa kluczowego i praw
            const filteredHits = hits.filter(hit =>
                hit.keywords?.values?.some(keyword => keyword.includes(keywords)) &&
                hit.rights?.values?.includes('Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.')
            );

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

// Endpoint do wyświetlania wyników na podstawie słów kluczowych i filtrowania po "Komunikacja autobusowa" oraz prawach
app.get('/all-hits', async (req, res) => {
    const { keywords, pageSize = 10, sort = 'RELEVANCE' } = req.query;

    if (!keywords) {
        return res.status(400).json({ error: 'Brak słów kluczowych w zapytaniu' });
    }

    try {
        const hits = await fetchAllHits(keywords, pageSize, sort);

        // Zwracamy wszystkie przefiltrowane hity w formacie JSON
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
