const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const Stores = new Schema({
  shop_code: Number,
  shop_name: String,
  shop: String,
  address: String,
  suburb: String,
  state: String,
  zip: String,
  phone: String,
  hours: String,
  shop_email: String,
  shop_type: String,
  has_click_collect: Boolean,
  contact_first_name: String,
  contact_last_name: String,
  lat: Number,
  lng: Number,
});

module.exports = mongoose.model('Stores', Stores);