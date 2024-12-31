const axios = require('axios');
const express = require('express');

async function searchPolona(query, page = 0, pageSize = 10, sort = 'RELEVANCE') {
    const url = `https://polona.pl/api/search-service/search/simple?query=${query}&page=${page}&pageSize=${pageSize}&sort=${sort}`;

    try {
        const response = await axios.post(url, {}, {
            headers: {
                'Content-Type': 'application/json', // Ważny nagłówek
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.message}`);
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Endpoint API
app.get('/search', async (req, res) => {
    const { query, page = 0, pageSize = 10, sort = 'RELEVANCE' } = req.query;

    try {
        const data = await searchPolona(query, page, pageSize, sort);

        // Zwracanie danych z poprawnym nagłówkiem
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json(data); // Wyślij JSON do przeglądarki
    } catch (error) {
        console.error('Błąd podczas wyszukiwania:', error.message);

        // Zwrot błędu
        res.status(500).json({ error: error.message });
    }
});

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
