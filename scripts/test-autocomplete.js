/**
 * Test Google Maps Autocomplete via Proxy
 */

const PROXY_URL = "https://volt-run-716974106554.us-east1.run.app";
const PROXY_TOKEN = "1eb773c9e7134b006278b6f90b0a52d2f7f9e1e07a997c48f96741f02c949e21";

async function testAutocomplete(query, withCountryFilter = false) {
  console.log(`\n🔍 Testing query: "${query}" (country filter: ${withCountryFilter})\n`);

  const params = new URLSearchParams({
    input: query,
    location: "18.0425,-63.0548",
    radius: "20000",
  });

  if (withCountryFilter) {
    params.append("components", "country:sx");
  }

  const url = `${PROXY_URL}/maps/places/autocomplete?${params}`;

  console.log("📍 Request URL:", url);

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PROXY_TOKEN}`,
      },
    });

    console.log("📡 Response status:", response.status);

    const data = await response.json();

    if (data.predictions && data.predictions.length > 0) {
      console.log(`\n✅ Found ${data.predictions.length} predictions:`);
      data.predictions.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.description}`);
      });
    } else {
      console.log("\n❌ No predictions found");
      console.log("Status:", data.status);
      console.log("Error message:", data.error_message || "None");
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Test multiple queries
async function runTests() {
  console.log("========================================");
  console.log("Testing Google Maps Autocomplete Proxy");
  console.log("========================================");

  // Test Sint Maarten location WITH country filter
  await testAutocomplete("Maho Beach", true);

  // Test non-Sint Maarten location WITH country filter (should fail)
  await testAutocomplete("Stilwalker", true);

  // Test non-Sint Maarten location WITHOUT country filter (should work)
  await testAutocomplete("Stilwalker", false);

  // Test famous US location WITHOUT country filter
  await testAutocomplete("1600 Pennsylvania", false);

  console.log("\n========================================");
  console.log("Test Complete");
  console.log("========================================\n");
}

runTests();
