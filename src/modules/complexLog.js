import * as d3 from "../vendor/d3-bundle";
import * as math from "mathjs";

/**
 * Complex logarithm raw projection
 * @desc Projects points specified by longitude and latitude.
 * @param {Number} lambda Longitude
 * @param {Number} phi Latitude
 */
export function complexLogRaw(lambda, phi) {
    let re, im;
    [re, im] = d3.geoAzimuthalEquidistantRaw(lambda, phi);

    let logRe = re;
    let logIm = im;

    // Apply complex logarithm 
    //logRe = math.log(math.sqrt(re ** 2 + im ** 2));
    //logIm = math.atan2(im, re);

    return [logRe, logIm];
}

/**
 * Inverse complex logarithm projection
 * @desc Projects points (from pixels) to longitude and latitude.
 */
complexLogRaw.invert = function(x, y) {
    let invLogRe = x;
    let invLogIm = y;

    // Inverse complex logarithm (complex exponential function)
    //invLogRe = math.exp(x) * math.cos(y);
    //invLogIm = math.exp(x) * math.sin(y);
    
    return d3.geoAzimuthalEquidistantRaw.invert(invLogRe, invLogIm);
}

/**
 * Complex logarithm projection
 */
export function complexLog() {
    return d3.geoProjection(complexLogRaw).clipAngle(180 - 1e-3);
}
