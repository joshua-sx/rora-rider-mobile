const assert = require("assert");
const { decodePolyline, extractRouteData } = require("../utils/route-validation");

const validDirections = {
  status: "OK",
  routes: [
    {
      legs: [
        {
          distance: { value: 1200, text: "1.2 km" },
          duration: { value: 600, text: "10 mins" },
        },
      ],
      overview_polyline: { points: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
    },
  ],
};

const result = extractRouteData(validDirections);
assert.strictEqual(result.distanceKm, 1.2);
assert.strictEqual(result.durationMin, 10);
assert.ok(result.coordinates.length > 0);

assert.throws(() => extractRouteData({ status: "ZERO_RESULTS" }), /No route found/);
assert.throws(() => extractRouteData({ status: "OK" }), /missing route data/);
assert.throws(
  () =>
    extractRouteData({
      status: "OK",
      routes: [
        {
          legs: [{ distance: {}, duration: {} }],
          overview_polyline: { points: "_p~iF~ps|U_ulLnnqC_mqNvxq`@" },
        },
      ],
    }),
  /missing distance or duration/
);
assert.throws(() => decodePolyline(""), /Invalid polyline encoding/);
assert.throws(() => decodePolyline(null), /Invalid polyline encoding/);

console.log("route-validation tests passed");
