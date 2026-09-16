const axios = require('axios');

// Placeholder VEAPI provider. In production, fill with real endpoints and response parsing.
module.exports = {
  async queryPrice(q) {
    // For demo, return mocked single result
    return [{ source: 'veapi', title: q, price: null, currency: 'CNY', link: null }];
  }
};
