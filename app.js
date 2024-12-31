const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Funkcja do wyszukiwania
async function searchPolona(query, page = 0, pageSize = 10, sort = 'RELEVANCE') {
    const url = `https://polona.pl/api/search-service/search/simple?query=${query}&page=${page}&pageSize=${pageSize}&sort=${sort}`;
    try {
        const response = await axios.get(url); // Zmienione na GET
        return response.data;
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.response?.data?.message || error.message}`);
    }
}

// Endpoint API
app.get('/search', async (req, res) => {
    const { query, page = 0, pageSize = 10, sort = 'RELEVANCE', titleContains } = req.query;

    try {
        const data = await searchPolona(query, page, pageSize, sort);

        // Filtrowanie po `rights.values[0]` (twardo zapisany warunek)
        let filteredHits = data.hits;

        // Filtrowanie po prawach (twardo zapisany warunek)
        filteredHits = filterByRights(filteredHits);

        // Filtrowanie po tytule, jeśli zadano parametr titleContains
        if (titleContains) {
            filteredHits = filterByTitle(filteredHits, titleContains);
        }

        res.json({ ...data, hits: filteredHits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Funkcja filtrująca po prawach
function filterByRights(hits) {
    const rightsValue = "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy.";
    return hits.filter(hit => 
        hit.expandedFields?.rights?.values[0] === rightsValue
    );
}

// Funkcja filtrująca po tytule
function filterByTitle(hits, titleValue) {
    return hits.filter(hit => 
        hit.basicFields?.title?.values[0]?.toLowerCase().includes(titleValue.toLowerCase())
    );
}

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
