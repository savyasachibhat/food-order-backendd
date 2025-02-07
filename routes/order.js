const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/order');
const router = express.Router();

router.post('/',
  [
    body('customer.name').notEmpty().withMessage('Full Name is required'),
    body('customer.email').isEmail().withMessage('Invalid Email Address'),
    body('customer.street').notEmpty().withMessage('Street is required'),
    body('customer.pincode').notEmpty().withMessage('Pin Code is required'),
    body('customer.city').notEmpty().withMessage('City is required'),
    body('items').isArray({ min: 1 }).withMessage('Cart cannot be empty'),
    body('items.*.name').notEmpty().withMessage('Item name is required'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('Item quantity must be greater than 0'),
    body('items.*.price').isFloat({ gt: 0 }).withMessage('Item price must be greater than 0')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer, items, totalAmount } = req.body;

    try {
      let existingOrder = await Order.findOne({ 'customer.email': customer.email });

      if (existingOrder) {
        items.forEach(newItem => {
          const existingItem = existingOrder.items.find(item => item.name === newItem.name);
          if (existingItem) {
            existingItem.quantity += newItem.quantity;
          } else {
            existingOrder.items.push(newItem);
          }
        });

        existingOrder.totalAmount += totalAmount;
        await existingOrder.save();

        return res.status(200).json({ message: 'Order updated successfully', order: existingOrder });
      } else {
        const newOrder = new Order({ customer, items, totalAmount });
        await newOrder.save();
        return res.status(201).json({ message: 'Order submitted successfully', order: newOrder });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

module.exports = router;
