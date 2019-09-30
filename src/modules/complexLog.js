import * as d3 from "../vendor/d3-bundle";
import * as math from "mathjs";

export function complexLogRaw(lambda, phi) {
    let re, im;
    [re, im] = d3.geoAzimuthalEquidistantRaw(lambda, phi);

    let logRe = re;
    let logIm = im;

    // let aziComplex = math.complex(re, im);
    // logRe = math.log(aziComplex.abs());
    // logIm = aziComplex.arg();

    return [logRe, logIm];
}

export function complexLog() {
    return d3.geoProjection(complexLogRaw).clipAngle(180 - 1e-3);
}
