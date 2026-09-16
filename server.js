const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const cache = new NodeCache({ stdTTL: 60 * 30 }); // 30 minutes

app.use(cors());
app.use(bodyParser.json());

// Simple price endpoint (query param q)
app.get('/api/price', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'missing q' });

  // In demo mode, return mock prices from providers/mock.js
  try {
    const mock = require('./providers/mock');
    const results = mock.queryPrice(q);
    return res.json({ results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
});

app.post('/api/price-batch', async (req, res) => {
  const queries = req.body.queries;
  if (!queries || !Array.isArray(queries)) return res.status(400).json({ error: 'missing queries array' });
  try {
    const mock = require('./providers/mock');
    const results = queries.map(q => ({ query: q, results: mock.queryPrice(q) }));
    return res.json({ results });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'internal' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Price service (VEAPI-enabled) running on port ${PORT}`));
