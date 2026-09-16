// Simple mock price provider for demo
const data = [
  { q: 'Sony A7 IV', price: 17800, source: 'jd', link: 'https://item.jd.com/1000.html' },
  { q: 'Canon R6 Mark II', price: 24999, source: 'jd', link: 'https://item.jd.com/2000.html' },
  { q: 'Nikon Z7 II', price: 21999, source: 'jd', link: 'https://item.jd.com/3000.html' }
];

module.exports = {
  queryPrice(q) {
    // simple fuzzy match
    const found = data.filter(d => d.q.toLowerCase().includes((q||'').toLowerCase()));
    if (found.length) return found;
    return [{ q, price: null, source: 'mock', link: null }];
  }
};
