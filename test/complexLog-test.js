const tape = require("tape");
const almostEqual = require("almost-equal")

const d3 = require("../src/vendor/d3-bundle");
const complexLog = require("../src/modules/complexLog")


/**
 * Tests if inverse complex logarithm (complex exponential function)
 * yields original longitude and latitude
 */
tape("Inverse complex log test", function(test) {
    let testCases = [ [0, 0], [0.1, 0.2], [Math.PI, 0], [0, Math.PI], [Math.PI, Math.PI] ];
    const projectionRaw = complexLog.complexLogRaw;

    for (const testCase of testCases) {
        let [x, y] = projectionRaw(testCase[0], testCase[1]);
        let [lambda, phi] = projectionRaw.invert(x, y);

        // Module and shift to check for equality in radians
        lambda = lambda % Math.PI + Math.PI;
        phi = phi % Math.PI + Math.PI;
        testCase[0] = testCase[0] % Math.PI + Math.PI;
        testCase[1] = testCase[1] % Math.PI + Math.PI;
    
        test.ok(almostEqual(testCase[0], lambda), "longitude");
        test.ok(almostEqual(testCase[1], phi), "latitude");
    }

    test.end();
});

