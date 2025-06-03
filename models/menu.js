const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true }, // e.g., "Pizza", "Burgers", "Drinks"
  price: { type: Number, required: true },
  imageUrl: { type: String }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
