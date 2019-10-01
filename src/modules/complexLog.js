import * as d3 from "../vendor/d3-bundle";

export function complexLogRaw(lambda, phi) {
    let re, im;
    [re, im] = d3.geoAzimuthalEquidistantRaw(lambda, phi);

    let logRe = re;
    let logIm = im;

    //logRe = math.log(math.sqrt(re ** 2 + im ** 2));
    //logIm = math.atan2(im, re);

    return [logRe, logIm];
}

export function complexLog() {
    return d3.geoProjection(complexLogRaw).clipAngle(180 - 1e-3);
}
