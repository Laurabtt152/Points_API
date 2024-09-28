const express = require('express');
const app = express();
app.use(express.json());

// Global array to store transactions
let transactions = [];

// Helper function to calculate balances
const calculateBalance = () => {
  const balance = {};
  transactions.forEach((txn) => {
    if (!balance[txn.payer]) {
      balance[txn.payer] = 0;
    }
    balance[txn.payer] += txn.points;
  });
  return balance; 
};
 
// Add Points
app.post('/add', (req, res) => {
  const { payer, points, timestamp } = req.body;
  if (!payer || !points || !timestamp) {
    return res.status(400).send('Missing required fields.');
  }
  transactions.push({ payer, points, timestamp });
  res.status(200).send();
});

// Spend Points
app.post('/spend', (req, res) => {
  let pointsToSpend = req.body.points;
  if (!pointsToSpend) {
    return res.status(400).send('Points to spend are required.');
  }

  const balance = calculateBalance();
  const totalPoints = Object.values(balance).reduce((sum, points) => sum + points, 0);
  
  if (pointsToSpend > totalPoints) {
    return res.status(400).send('Not enough points.');
  }

  transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const spentPoints = [];
  
  for (let i = 0; i < transactions.length && pointsToSpend > 0; i++) {
    const txn = transactions[i];
    if (txn.points === 0) continue;

    const pointsUsed = Math.min(txn.points, pointsToSpend);
    transactions[i].points -= pointsUsed;
    pointsToSpend -= pointsUsed;

    const spender = spentPoints.find(sp => sp.payer === txn.payer);
    if (spender) {
      spender.points -= pointsUsed;
    } else {
      spentPoints.push({ payer: txn.payer, points: -pointsUsed });
    }
  }

  res.status(200).json(spentPoints);
});

// Get Balance
app.get('/balance', (req, res) => {
  const balance = calculateBalance();
  res.status(200).json(balance);
});

// Run the server
app.listen(8000, () => {
  console.log('API running on port 8000');
});
