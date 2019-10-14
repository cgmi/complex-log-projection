const tape = require("tape");
const d3 = require("../src/vendor/d3-bundle");
const complexLog = require("../src/modules/complexLog")


/**
 * Tests if inverse complex logarithm (complex exponential function)
 * yields original longitude and latitude
 */
tape("Inverse complex log test", function(test) {
    // TODO: Include more cases
    const LAMBDA = 10;
    const PHI = 20;

    const projectionRaw = complexLog.complexLogRaw;

    let [x, y] = projectionRaw(LAMBDA, PHI);
    let [lambda, phi] = projectionRaw.invert(x, y);

    test.equal(LAMBDA, lambda);
    test.equal(PHI, phi);

    test.end();
});

