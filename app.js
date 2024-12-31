const axios = require('axios');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Funkcja do wyszukiwania
async function searchPolona(query, page = 0, pageSize = 10, sort = 'RELEVANCE') {
    const url = `https://polona.pl/api/search-service/search/simple?query=${query}&page=${page}&pageSize=${pageSize}&sort=${sort}`;
    try {
        const response = await axios.post(url);
        return response.data;
    } catch (error) {
        throw new Error(`Błąd API Polona: ${error.message}`);
    }
}

// Endpoint API
app.get('/search', async (req, res) => {
    const { query, page = 0, pageSize = 10, sort = 'RELEVANCE', rights } = req.query;

    try {
        const data = await searchPolona(query, page, pageSize, sort);

        // Filtrowanie po wartości w `rights.values[0]`
        const filteredHits = rights 
            ? filterByRights(data.hits, rights) 
            : data.hits;

        res.json({ ...data, hits: filteredHits });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Funkcja filtrująca
function filterByRights(hits, rightsValue) {
    return hits.filter(hit => 
        hit.expandedFields.rights?.values[0] == "Domena Publiczna. Wolno zwielokrotniać, zmieniać i rozpowszechniać oraz wykonywać utwór, nawet w celach komercyjnych, bez konieczności pytania o zgodę. Wykorzystując utwór należy pamiętać o poszanowaniu autorskich praw osobistych Twórcy."
    );
}

// Uruchomienie serwera
app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});
