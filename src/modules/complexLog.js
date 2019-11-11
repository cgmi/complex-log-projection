import * as d3 from "../vendor/d3-bundle";
import * as math from "mathjs";

const CARTESIAN_OFFSET = 0.00000001;

// Path generator produces some NaN values (Issue #5)
/**
 * Complex logarithm raw projection
 * @desc Projects points specified by longitude and latitude.
 * @param {Number} lambda Longitude
 * @param {Number} phi Latitude
 */
export function complexLogRaw(lambda, phi) {
    // Azimuthal equal raw projection
    // Interpret projected point on complex plane
    let aziComp = math.complex();
    [aziComp.re, aziComp.im] = d3.geoAzimuthalEqualAreaRaw(lambda, phi);

    // Rotate by -90 degrees
    aziComp = aziComp.mul(math.complex(math.cos(-math.pi / 2), math.sin(-math.pi / 2)));

    // Small cartesian offset to prevent logarithm of 0
    aziComp.re += CARTESIAN_OFFSET;
    aziComp.im += CARTESIAN_OFFSET;

    // Apply complex logarithm
    let logComp = math.complex();
    logComp.re = math.log(math.sqrt(aziComp.re ** 2 + aziComp.im ** 2));
    logComp.im = math.atan2(aziComp.im, aziComp.re);

    return [logComp.re, logComp.im];
}


/**
 * Inverse complex logarithm projection
 * @desc Projects points (from pixels) to longitude and latitude.
 */
complexLogRaw.invert = function(x, y) {
    // Inverse complex logarithm (complex exponential function)
    let invLogComp = math.complex();
    invLogComp.re = math.exp(x) * math.cos(y);
    invLogComp.im = math.exp(x) * math.sin(y);

    // Undo offset from forward projection
    invLogComp.re -= CARTESIAN_OFFSET;
    invLogComp.im -= CARTESIAN_OFFSET;

    // Undo rotation
    invLogComp = invLogComp.mul(math.complex(math.cos(math.pi / 2), math.sin(math.pi / 2)));
    
    // Invert azimuthal equal area
    return d3.geoAzimuthalEqualAreaRaw.invert(invLogComp.re, invLogComp.im);
}


/**
 * Complex logarithm projection
 */
export function complexLog() {
    let projection = d3.geoProjection(complexLogRaw).angle(90);

    // FIXME: Some rotations lead to overlapping polygons (Issue #3)
    // Prevent overlapping polygons, so cut along 180°/-180° degree line (left and right in complex log projected view)
    projection.preclip(d3.geoClipPolygon({
        type: "Polygon",
        coordinates: [
            [
                [-180, 0], 
                [180, 0], 
                [0.001, -1], 
                [-0.001, -1], 
                [-180, 0]
            ]
        ] 
    }));

    return projection;
}
