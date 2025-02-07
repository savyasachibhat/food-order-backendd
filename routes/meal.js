const express = require('express');
const Meal = require('../models/meal');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json(meals);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/add-meal', async (req, res) => {
  try {
    const newMeal = new Meal({
      name: req.body.name,
      image: req.body.imageUrl,
      price: req.body.price,
    });

    await newMeal.save();
    res.status(200).send('Meal added successfully.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const meal = await Meal.findById(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    meal.name = req.body.name;
    meal.image = req.body.imageUrl;
    meal.price = req.body.price;

    await meal.save();
    res.status(200).send('Meal updated successfully.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const meal = await Meal.findByIdAndDelete(req.params.id);
    if (!meal) return res.status(404).json({ message: 'Meal not found' });

    res.status(200).send('Meal deleted successfully.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
