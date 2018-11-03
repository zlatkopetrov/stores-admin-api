const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TSStores = new Schema({
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
  lat: Number,
  lng: Number,
});

module.exports = mongoose.model('TSStores', TSStores);