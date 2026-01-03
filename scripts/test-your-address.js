/**
 * Test searching for your address "Stilwalker" after removing country filter
 */

const PROXY_URL = process.env.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_URL || "YOUR_PROXY_URL";
const PROXY_TOKEN = process.env.EXPO_PUBLIC_GOOGLE_MAPS_PROXY_TOKEN || "YOUR_PROXY_TOKEN";

async function testSearch(query) {
  console.log(`\n🔍 Searching for: "${query}"\n`);

  // This matches the NEW implementation (no country filter)
  const params = new URLSearchParams({
    input: query,
    location: "18.0425,-63.0548",
    radius: "20000",
  });

  const url = `${PROXY_URL}/maps/places/autocomplete?${params}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${PROXY_TOKEN}`,
      },
    });

    const data = await response.json();

    if (data.predictions && data.predictions.length > 0) {
      console.log(`✅ SUCCESS! Found ${data.predictions.length} results:\n`);
      data.predictions.forEach((p, i) => {
        const mainText = p.structured_formatting?.main_text || p.description;
        const secondaryText = p.structured_formatting?.secondary_text || "";
        console.log(`${i + 1}. ${mainText}`);
        if (secondaryText) {
          console.log(`   ${secondaryText}`);
        }
      });
    } else {
      console.log("❌ No results found");
      console.log("Status:", data.status);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function runTests() {
  console.log("=====================================");
  console.log("Testing Address Search (After Fix)");
  console.log("=====================================");

  await testSearch("Stilwalker");
  await testSearch("Maho Beach"); // Should still work for Sint Maarten

  console.log("\n=====================================\n");
}

runTests();
