const tape = require("tape");
const almostEqual = require("almost-equal")

const d3 = require("../src/vendor/d3-bundle");
const complexLog = require("../src/modules/complexLog")


/**
 * Tests if inverse complex logarithm (complex exponential function)
 * yields original longitude and latitude
 */
tape("Inverse complex log test", function(test) {
    // TODO: Include more cases
    const LAMBDA = 0.1;
    const PHI = 0.2;

    const projectionRaw = complexLog.complexLogRaw;

    let [x, y] = projectionRaw(LAMBDA, PHI);
    let [lambda, phi] = projectionRaw.invert(x, y);

    test.ok(almostEqual(LAMBDA, lambda), "longitude");
    test.ok(almostEqual(PHI, phi), "latitude");

    test.end();
});

