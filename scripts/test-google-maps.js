#!/usr/bin/env node

/**
 * Google Maps API Integration Test Script
 * Tests all Google Maps services end-to-end
 */

const https = require('https');

// Your API Key
// Provide via env var to avoid committing secrets:
//   GOOGLE_MAPS_API_KEY=... node ./scripts/test-google-maps.js
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

if (!API_KEY) {
  console.error('❌ Missing GOOGLE_MAPS_API_KEY env var.');
  process.exit(1);
}

// Sint Maarten location constants
const SINT_MAARTEN_LOCATION = {
  latitude: 18.0425,
  longitude: -63.0548,
};
const SEARCH_RADIUS = 20000; // 20km

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Helper function to make HTTPS requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Test helper
async function runTest(name, testFn) {
  process.stdout.write(`\n🧪 Testing: ${name}... `);
  try {
    const result = await testFn();
    console.log('✅ PASSED');
    results.passed++;
    results.tests.push({ name, status: 'PASSED', details: result });
    return result;
  } catch (error) {
    console.log('❌ FAILED');
    console.log(`   Error: ${error.message}`);
    results.failed++;
    results.tests.push({ name, status: 'FAILED', error: error.message });
    return null;
  }
}

// Test 1: Places Autocomplete API
async function testPlacesAutocomplete() {
  const query = 'Princess Juliana Airport';
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${API_KEY}&components=country:sx&location=${SINT_MAARTEN_LOCATION.latitude},${SINT_MAARTEN_LOCATION.longitude}&radius=${SEARCH_RADIUS}`;

  const data = await makeRequest(url);

  if (data.status !== 'OK') {
    throw new Error(`API returned status: ${data.status}. Error: ${data.error_message || 'Unknown error'}`);
  }

  if (!data.predictions || data.predictions.length === 0) {
    throw new Error('No predictions returned');
  }

  console.log(`\n   ℹ️  Found ${data.predictions.length} suggestions:`);
  data.predictions.slice(0, 3).forEach((p, i) => {
    console.log(`      ${i + 1}. ${p.description}`);
  });

  return {
    suggestionsCount: data.predictions.length,
    firstSuggestion: data.predictions[0].description,
    placeId: data.predictions[0].place_id,
  };
}

// Test 2: Place Details API
async function testPlaceDetails(placeId) {
  if (!placeId) {
    throw new Error('No place ID provided from previous test');
  }

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${API_KEY}&fields=name,geometry,formatted_address,place_id`;

  const data = await makeRequest(url);

  if (data.status !== 'OK') {
    throw new Error(`API returned status: ${data.status}. Error: ${data.error_message || 'Unknown error'}`);
  }

  if (!data.result || !data.result.geometry || !data.result.geometry.location) {
    throw new Error('Invalid place details response');
  }

  const location = data.result.geometry.location;
  console.log(`\n   ℹ️  Place Details:`);
  console.log(`      Name: ${data.result.name}`);
  console.log(`      Address: ${data.result.formatted_address}`);
  console.log(`      Coordinates: ${location.lat}, ${location.lng}`);

  return {
    name: data.result.name,
    coordinates: { lat: location.lat, lng: location.lng },
    address: data.result.formatted_address,
  };
}

// Test 3: Geocoding API
async function testGeocoding() {
  const address = 'Maho Beach, Sint Maarten';
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}&components=country:sx`;

  const data = await makeRequest(url);

  if (data.status !== 'OK') {
    throw new Error(`API returned status: ${data.status}. Error: ${data.error_message || 'Unknown error'}`);
  }

  if (!data.results || data.results.length === 0) {
    throw new Error('No geocoding results');
  }

  const location = data.results[0].geometry.location;
  console.log(`\n   ℹ️  Geocoded "${address}":`);
  console.log(`      Coordinates: ${location.lat}, ${location.lng}`);
  console.log(`      Formatted: ${data.results[0].formatted_address}`);

  return {
    coordinates: { lat: location.lat, lng: location.lng },
    formattedAddress: data.results[0].formatted_address,
  };
}

// Test 4: Reverse Geocoding API
async function testReverseGeocoding() {
  const lat = SINT_MAARTEN_LOCATION.latitude;
  const lng = SINT_MAARTEN_LOCATION.longitude;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${API_KEY}`;

  const data = await makeRequest(url);

  if (data.status !== 'OK') {
    throw new Error(`API returned status: ${data.status}. Error: ${data.error_message || 'Unknown error'}`);
  }

  if (!data.results || data.results.length === 0) {
    throw new Error('No reverse geocoding results');
  }

  console.log(`\n   ℹ️  Reverse Geocoded (${lat}, ${lng}):`);
  console.log(`      Address: ${data.results[0].formatted_address}`);

  return {
    address: data.results[0].formatted_address,
  };
}

// Test 5: Directions API
async function testDirections() {
  // Princess Juliana Airport to Maho Beach
  const origin = '18.0419,-63.1086'; // Airport
  const destination = '18.0485,-63.1204'; // Maho Beach
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${API_KEY}`;

  const data = await makeRequest(url);

  if (data.status !== 'OK') {
    throw new Error(`API returned status: ${data.status}. Error: ${data.error_message || 'Unknown error'}`);
  }

  if (!data.routes || data.routes.length === 0) {
    throw new Error('No routes found');
  }

  const route = data.routes[0];
  const leg = route.legs[0];

  console.log(`\n   ℹ️  Route Details:`);
  console.log(`      Distance: ${leg.distance.text}`);
  console.log(`      Duration: ${leg.duration.text}`);
  console.log(`      Polyline points: ${route.overview_polyline.points.length} chars`);

  return {
    distance: leg.distance.value, // meters
    duration: leg.duration.value, // seconds
    polyline: route.overview_polyline.points,
  };
}

// Test 6: Distance Matrix API
async function testDistanceMatrix() {
  const origins = '18.0419,-63.1086'; // Airport
  const destinations = '18.0485,-63.1204|18.0425,-63.0548'; // Maho Beach, Center
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&key=${API_KEY}`;

  const data = await makeRequest(url);

  if (data.status !== 'OK') {
    throw new Error(`API returned status: ${data.status}. Error: ${data.error_message || 'Unknown error'}`);
  }

  if (!data.rows || data.rows.length === 0) {
    throw new Error('No distance matrix results');
  }

  const elements = data.rows[0].elements;
  console.log(`\n   ℹ️  Distance Matrix:`);
  elements.forEach((el, i) => {
    if (el.status === 'OK') {
      console.log(`      Destination ${i + 1}: ${el.distance.text}, ${el.duration.text}`);
    }
  });

  return {
    destinations: elements.length,
    firstDistance: elements[0].distance.value,
    firstDuration: elements[0].duration.value,
  };
}

// Test 7: API Key Validation
async function testAPIKeyValidation() {
  // Test with a simple request to validate the key
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=test&key=${API_KEY}`;

  const data = await makeRequest(url);

  // Any response other than REQUEST_DENIED means the key is valid
  if (data.status === 'REQUEST_DENIED') {
    throw new Error('API Key is invalid or restricted');
  }

  console.log(`\n   ℹ️  API Key Status: Valid and Working`);

  return { valid: true };
}

// Main test runner
async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║      Google Maps API Integration Test Suite               ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n🔑 API Key: ${API_KEY.substring(0, 20)}...`);
  console.log(`📍 Test Location: Sint Maarten (${SINT_MAARTEN_LOCATION.latitude}, ${SINT_MAARTEN_LOCATION.longitude})`);
  console.log(`📏 Search Radius: ${SEARCH_RADIUS / 1000}km`);

  // Run tests sequentially
  await runTest('API Key Validation', testAPIKeyValidation);

  const autocompleteResult = await runTest('Places Autocomplete API', testPlacesAutocomplete);

  if (autocompleteResult && autocompleteResult.placeId) {
    await runTest('Place Details API', () => testPlaceDetails(autocompleteResult.placeId));
  }

  await runTest('Geocoding API', testGeocoding);
  await runTest('Reverse Geocoding API', testReverseGeocoding);
  await runTest('Directions API', testDirections);
  await runTest('Distance Matrix API', testDistanceMatrix);

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total:  ${results.passed + results.failed}`);

  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! Google Maps integration is working correctly.');
    console.log('\n✨ Your app is ready to use with:');
    console.log('   • Places Autocomplete for location search');
    console.log('   • Geocoding for address → coordinates');
    console.log('   • Reverse Geocoding for coordinates → address');
    console.log('   • Directions API for route calculation');
    console.log('   • Distance Matrix for multiple destinations');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    console.log('\n💡 Common issues:');
    console.log('   1. API key needs to have the required APIs enabled');
    console.log('   2. Billing must be enabled in Google Cloud Console');
    console.log('   3. API key restrictions might be blocking requests');
    console.log('\n🔗 Enable APIs at: https://console.cloud.google.com/apis/library');
  }

  console.log('\n');

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error('\n❌ Fatal Error:', error.message);
  process.exit(1);
});
