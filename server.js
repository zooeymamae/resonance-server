require('dotenv').config();
const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());

function httpsGet(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(url, postData, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getSpotifyToken() {
  const credentials = Buffer.from(
    process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET
  ).toString('base64');

  const postData = 'grant_type=client_credentials';
  const data = await httpsPost(
    'https://accounts.spotify.com/api/token',
    postData,
    {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + credentials,
      'Content-Length': Buffer.byteLength(postData)
    }
  );
  return data.access_token;
}

app.get('/search/songs', async (req, res) => {
  try {
    const token = await getSpotifyToken();
    const q = encodeURIComponent(req.query.q);
    const data = await httpsGet(
      `https://api.spotify.com/v1/search?q=${q}&type=track&limit=8`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    res.json(data.tracks.items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/search/movies', async (req, res) => {
  try {
    const q = encodeURIComponent(req.query.q);
    const data = await httpsGet(
      `https://api.themoviedb.org/3/search/movie?query=${q}&api_key=${process.env.TMDB_API_KEY}`
    );
    res.json(data.results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => res.send('Resonance server is running'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`✓ Resonance server running on port ${PORT}`));
