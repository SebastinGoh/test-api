const nodeGeocoder = require('node-geocoder');

const GEOCODER_PROVIDER = process.env.GEOCODER_PROVIDER;
const GEOCODER_API_KEY = process.env.GEOCODER_API_KEY;

const options = {
    provider : GEOCODER_PROVIDER,
    httpAdapter : 'https',
    apiKey : GEOCODER_API_KEY,
    formatter : null
}

const geoCoder = nodeGeocoder(options);

module.exports = geoCoder;