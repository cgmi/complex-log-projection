import * as d3 from "../vendor/d3-bundle";
import { complexLogRaw } from "./complexLog";

const azi = d3.geoAzimuthalEquidistant();

const complexLog = d3.geoTransform({
    point: function(x,y){
        this.stream.point(complexLogRaw(x, y))
    }
});

const complexLogStream = {
    stream: function(s) { 
        return azi.stream(complexLog.stream(s)); 
    }
};

export function complexLogWithStream() {
    let proj = d3.geoProjection(complexLogRaw);
    proj.stream = complexLogStream.stream;

    return proj;
}