const axios = require('axios');
const express = require('express');

// Funkcja do pobierania wszystkich hitów z API Polona
async function fetchAllHits(query, pageSize = 10, sort = 'RELEVANCE') {
    const url = (page) =>
        `https://polona.pl/api/search-service/search/simple?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    let allHits = [];
    let currentPage = 0;
    let totalPages = 1; // Początkowa wartość, zostanie nadpisana po pierwszym żądaniu

    // Funkcja sleep do wprowadzenia opóźnienia
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

            // Dodajemy opóźnienie, aby nie przeciążać API
            await sleep(1000); // 1 sekunda opóźnienia między zapytaniami
        }

        return allHits; // Zwróć wszystkie hity
    } catch (error) {
        // Logowanie błędu w przypadku problemu z API
        console.error('Błąd podczas pobierania hits:', error.response ? error.response.data : error.message);
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
        // Zwrócenie błędu w przypadku problemów z pobraniem hitów
        console.error('Błąd podczas pobierania hits:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
