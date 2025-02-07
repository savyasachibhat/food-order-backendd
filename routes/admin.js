const express = require('express');
const Meal = require('../models/meal');
const { validateAdminCredentials } = require('../middleware/auth');
const router = express.Router();

router.get('/', validateAdminCredentials, async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json({ message: 'Admin access granted', meals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
