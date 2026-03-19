require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

// Get Spotify token
async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
      ).toString('base64')
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

// Search songs
app.get('/search/songs', async (req, res) => {
  const token = await getSpotifyToken();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${req.query.q}&type=track&limit=8`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  const data = await response.json();
  res.json(data.tracks.items);
});

// Search movies
app.get('/search/movies', async (req, res) => {
  const response = await fetch(
    `https://api.themoviedb.org/3/search/movie?query=${req.query.q}&api_key=${process.env.TMDB_API_KEY}`
  );
  const data = await response.json();
  res.json(data.results);
});

app.listen(3000, () => console.log('Resonance server running on port 3000'));