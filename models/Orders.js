const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Orders = new Schema({
  order: String,
  line_items: String,
  picked_up: {type: Boolean, default: false},
  created_at: {type: Date, default: Date.now()},
});

module.exports = mongoose.model('Orders', Orders);