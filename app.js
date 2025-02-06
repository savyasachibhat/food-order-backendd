//app.js


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const app = express();

const URL = `mongodb+srv://savyasachibhat:9xEiiGD3ORe4D885@cluster0.86xg6.mongodb.net/savya`
mongoose.connect(URL);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const mealSchema = new mongoose.Schema({
  name: {type: String , required:true},
  price: {type : Number , required : true},
  image : {type : String , required : true}
});

const Meal = mongoose.model('Meal', mealSchema);

const orderSchema = new mongoose.Schema({
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    street: { type: String, required: true },
    pincode: { type: Number, required: true },
    city: { type: String, required: true }
  },
  items: [
    {
      name: { type: String, required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  totalAmount: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);


const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = bcrypt.hashSync('admin1234', 10); // Hash the admin password

// Input validation middleware
const validateAdminCredentials = (req, res, next) => {
  const { email, password } = req.headers;

  if (email === ADMIN_EMAIL && bcrypt.compareSync(password, ADMIN_PASSWORD)) {
    next(); // Proceed to the next middleware or route handler
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

// Protected route for /admin with input validation
app.get('/admin', validateAdminCredentials, async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json({ message: 'Admin access granted', meals });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/meals', async (req, res) => {
  try {
    const meals = await Meal.find();
    res.json(meals);
  
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/add-meal', async (req, res) => {
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


app.put('/meals/:id', async (req, res) => {
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

// Convert the id parameter to a mongoose.ObjectId to ensure it matches the format MongoDB expects.
// Use findByIdAndDelete() instead of remove().
app.delete('/meals/:id', async (req, res) => {
  try {
    const mealId = req.params.id;
    
    // Check if the id is valid
    if (!mongoose.Types.ObjectId.isValid(mealId)) {
      return res.status(400).json({ message: 'Invalid meal ID' });
    }
    
    // Use findByIdAndDelete for better handling of deletion
    const meal = await Meal.findByIdAndDelete(mealId);
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    res.status(200).send('Meal deleted successfully.');
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


app.post('/orders',
  [
    // Customer details validation
    body('customer.name').notEmpty().withMessage('Full Name is required'),
    body('customer.email').isEmail().withMessage('Invalid Email Address'),
    body('customer.street').notEmpty().withMessage('Street is required'),
    body('customer.pincode').notEmpty().withMessage('Pin Code is required'),
    body('customer.city').notEmpty().withMessage('City is required'),
    // Cart items validation
    body('items').isArray({ min: 1 }).withMessage('Cart cannot be empty'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('Item quantity must be greater than 0'),
    body('items.*.price').isFloat({ gt: 0 }).withMessage('Item price must be greater than 0')
  ],
  async (req, res) => {
    // Validate request data
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Extract order data from request body
    const { customer, items, totalAmount } = req.body;

    try {
      // Check if an order for the customer already exists
      let existingOrder = await Order.findOne({ 'customer.email': customer.email });

      if (existingOrder) {
        // Append new items to the existing order
        items.forEach(newItem => {
          const existingItem = existingOrder.items.find(item => item.name === newItem.name);
          if (existingItem) {
            // Update the quantity if the item already exists
            existingItem.quantity += newItem.quantity;
          } else {
            // Add the new item if it doesn't exist
            existingOrder.items.push(newItem);
          }
        });

        // Update the total amount
        existingOrder.totalAmount += totalAmount;
        await existingOrder.save();

        return res.status(200).json({ message: 'Order updated successfully', order: existingOrder });
      } else {
        // Create a new order
        const newOrder = new Order({ customer, items, totalAmount });
        await newOrder.save();
        return res.status(201).json({ message: 'Order submitted successfully', order: newOrder });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);


// Backend route to fetch cart data for a user by email
app.get('/cart/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const cart = await Order.findOne({ 'customer.email': email });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// Unexpected Server Error: If the server encounters an error that isn't caught by the try-catch block, it might serve
//  an HTML error page (like a 500 Internal Server Error).

// Incorrect Endpoint: If the client sends a request to an incorrect or non-existent endpoint, the server might return a
//  404 Not Found HTML page.


// Middleware to handle uncaught errors
// Middleware to handle 404 responses
app.use((req, res, next) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Middleware to handle 500 responses (unexpected errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

