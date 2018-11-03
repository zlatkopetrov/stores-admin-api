const googleApi = require('spherical-geometry-js');
const express = require('express');
const Airtable = require('airtable');
const router = express.Router();
const NodeGeocoder = require('node-geocoder');

const Stores = require('../models/Stores');
// const TSStores = require('../models/TSStores');
// const Orders = require('../models/Orders');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GOOGLE_API_KEY,
  formater: null,
}

const geocoder = NodeGeocoder(options);

router.get('/', (req, res) => {
  res.json('WORKING !!!');
});

// Importing the stores from airtable
router.get('/import-stores', (req, res) => {
  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE);
  let shop;
  let newShop;
  let totalStores = 0;
  base('TS-Working-Stores').select({
    view: 'Grid view'
  }).eachPage(async function page(records, fetchNextPage) {
    for (let i = 0; i < records.length; i++) {
      if(records[i].get('Store Code') && records[i].get('Store Code') !== undefined) {
        shop = await Stores.findOne({shop_code_: records[i].get('Store Code')}).exec();
        if(!shop) {
          // getting the lng and lat for the original address
          let lng;
          let lat;
          let address = `${records[i].get('Address')},${records[i].get('Suburb')},${records[i].get('State')}`;
          if (records[i].get('Address') === undefined) {
            address = `${records[i].get('Shop')},${records[i].get('Suburb')},${records[i].get('State')}`;
          }

          try { 
            await geocoder.geocode({address: address})
              .then((response) => {
                lng = response[0].longitude;
                lat = response[0].latitude;
              });
          } catch (e) {
            console.log('Error getting address for store: ', records[i].get('Store Code'), address ,e);
          }
          newShop = new Stores({
            shop_code: records[i].get('Store Code'),
            shop_name: records[i].get('Store Name'),
            shop: records[i].get('Shop'),
            address: records[i].get('Address'),
            suburb: records[i].get('Suburb'),
            state: records[i].get('State'),
            zip: parseInt(records[i].get('ZIP')),
            phone: records[i].get('Phone'),
            hours: records[i].get('Opening Hours'),
            shop_email: records[i].get('Store Email'),
            shop_type: records[i].get('Store Type'),
            has_click_collect: records[i].get('Click and Collect'),
            contact_first_name: records[i].get('Store Contact First Name'),
            contact_last_name: records[i].get('Store Contact Last Name'),
            lat: parseFloat(lat),
            lng: parseFloat(lng),
          });
          newShop.save().then(() => console.log('New Store "' + records[i].get('Store Name') + '" was saved into the database 🙋'));
        }
      }
    };

    fetchNextPage();

  }, function done(err) {
    if(err) { console.error(err); return; }
  });
  res.json('Importing New Data ⏩ !!!');
});

router.get('/get-distance',async (req, res) => {
  const selectedStores = [];

  // getting the lat and lng for the original address
  const originalLat = parseFloat(req.query.latlng.split(',')[0]);
  const originalLng = parseFloat(req.query.latlng.split(',')[1]);
  let originalAddress;
  let allStores;

  // getting the address details for the original address
  try { 
    await geocoder.reverse({lat: originalLat, lon: originalLng})
      .then((response) => {
        originalAddress = response;
      });
  } catch (e) {
    console.log('Error getting address: ', e);
  }

  // selecting the stores are within the customer's state
  allStores = await Stores.find({ state: originalAddress[0].administrativeLevels.level1short, has_click_collect: true }).exec();
  if (allStores.length == 0) {
    allStores = await Stores.find({ state: originalAddress[0].countryCode, has_click_collect: true }).exec();
  }

  if (allStores && allStores.length > 0) {
    const originalLatlng = new googleApi.LatLng(originalLat, originalLng);

    // loops through the stores and checks the distance from the original address
    for(let i = 0; i < allStores.length; i++) {
      const destinationLatlng = new googleApi.LatLng(allStores[i].lat, allStores[i].lng);
      if (googleApi.computeDistanceBetween(originalLatlng, destinationLatlng) < parseInt(process.env.RADIUS)) {
        const store = {
          details: allStores[i],
          distance: googleApi.computeDistanceBetween(originalLatlng, destinationLatlng)
        }
        selectedStores.push(store);
      }
    }
    if (selectedStores.length > 0) {
      const sortedStores = selectedStores.sort((a, b) => a.distance - b.distance);
      res.status(200).json({ stores: sortedStores});
    } else {
      res.status(200).json({ stores: 'No stores in your area'});
    }
  } else {
    res.status(404).json({ error: 'No stores in the database'});
  }
});

module.exports = router;