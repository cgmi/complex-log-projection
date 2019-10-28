// TODO: Integrate d3-bundle as module into package manager
import "regenerator-runtime/runtime"; // Fix regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadTopojson } from "./modules/geo-loader";
import { complexLog, complexLogRaw } from "./modules/complexLog";

// TODO: Rename and refactor the following lines
let world, projection, svg, svg_background, svg_countries, svg_graticule, svg_outline, display;

const topoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Various render settings
let renderParams = {
    showGraticule: true,
    showOutline: true,
    doColorCountries: true,
    scaleFactor: 0.9,
    width: 900,
    height: 900,
    currentRotation: [0, 0]
}

const style = {
    backgroundFill: "none",
    backgroundStroke: "black",
    countriesFill: "none",
    countriesStroke: "black",
    graticuleStroke: "#ccc",
    outlineStroke: "black"
}

let baseScale;

let projections = {
    complexLog: complexLog(),
    azimuthal: d3.geoAzimuthalEqualArea()
}

const translateStep = 10;

const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


/**
 * Changes current projection and re-fits display area
 * @param {d3.GeoProjection} newProjection 
 */
function changeProjection(newProjection) { 
    projection = newProjection;

    // Fit size based on projection
    let fittingObject = newProjection == projections.complexLog ? world.countries : world.outline;
    projection.fitSize([renderParams.width, renderParams.height], fittingObject);

    // FIXME: Doesn't work with azimuthal equidistant
    // Clipping along 180°/-180° line in complex plane
    if (projection == projections.complexLog) {
        const n = 10; // Precision, how many vertices to insert along clipping polygon rectangle lines
        const p = 1;  // Padding along 180°/-180° degree line in complex log projection, choose large enough to prevent overlapping polygons across map
        let viewportClip = {
            type: "Polygon",
            coordinates: [
            [
                ...Array.from({length: n}, (_, t) => [p + (renderParams.width - p * 2) * t / n, p]),
                ...Array.from({length: n}, (_, t) => [renderParams.width - p, (renderParams.height - p * 2) * t / n + p]),
                ...Array.from({length: n}, (_, t) => [p + (renderParams.width - p * 2) * (n - t) / n, renderParams.height - p]),
                ...Array.from({length: n}, (_, t) => [p, (renderParams.height - p * 2) * (n - t) / n + p]),
                [p, p]
            ].map(point => projection.invert(point))
            ]
        };

        projection.preclip(d3.geoClipPolygon({
            type: "Polygon",
            coordinates: [viewportClip.coordinates[0].map(d3.geoRotation(projection.rotate()))] // Clip polygon must also be rotated
        }));
    }

    // Rotation dictates projection point of interest
    projection.rotate(renderParams.currentRotation);

    // Set scale after pre-clipping so it doesn't affect clipping polygon
    // Base scale is the scale that is derived from fitSize() for that projection
    baseScale = projection.scale()
    projection.scale(renderParams.scaleFactor * baseScale);  
}


/**
 * Translate projected map by vector (x, y)
 * @param {Number} x 
 * @param {Number} y 
 */
function translateMap(x, y) {
    let t = projection.translate();
    projection.translate([t[0] + x, t[1] + y]);
    update();
}


/**
 * Prepare site for map rendering
 * @desc Grabs TopoJSON map and sets projection. Appends SVG and creates UI functionality.
 */
async function prepare() {
    // Download world map and set desired projection
    world = await loadTopojson(topoJsonUrl);

    changeProjection(projections.azimuthal);

    // Main display to render the map onto
    // SVG
    svg = d3.select("div#display").append("svg").attr("width", renderParams.width).attr("height", renderParams.height);
    // SVG background
    svg_background = svg.append("g").append("rect").attr("fill", style.backgroundFill).attr("stroke", style.backgroundStroke).attr("id", "background");
    // SVG countries
    svg_countries = svg.append("g").selectAll("path").data(world.countries.features).enter().append("path").attr("id", "countries");
    svg_countries.attr("fill", style.countriesFill).attr("stroke", style.countriesStroke);
    // SVG graticule
    svg_graticule = svg.append("g").append("path").datum(world.graticule).attr("id", "graticule");
    svg_graticule.attr("fill", "none").attr("stroke", style.graticuleStroke);
    // SVG outline
    svg_outline = svg.append("g").append("path").datum(world.outline).attr("id", "outline");
    svg_outline.attr("fill", "none").attr("stroke", style.outlineStroke);

    display = svg;

    // Transition to clicked position
    display.on("mousedown", function () {
        const mousePos = d3.mouse(this);
        const worldPos = projection.invert(mousePos);

        let [lambda, phi] = projection.invert(mousePos);
        renderParams.currentRotation = [-lambda, -phi];

        d3.transition().duration(650).tween("rotate", function() {
            let rotationInterpolator = d3.interpolate(projection.rotate(), renderParams.currentRotation);
            
            return function(t) {
                projection.rotate(rotationInterpolator(t));
                update();
            }
        }).transition();
    });

    // Keyboard interaction
    display.attr("focusable", false);
    display.on("keydown", function () {
        switch (d3.event.code) {
            case "KeyW":
                translateMap(0, -translateStep);
                break;
            case "KeyS":
                translateMap(0, translateStep);
                break;
            case "KeyA":
                translateMap(-translateStep, 0);
                break;
            case "KeyD":
                translateMap(translateStep, 0);
                break;
        }
    });
    display.on("focus", function () { });

    // Graticule checkbox
    const graticuleCheckbox = d3.select("input#graticuleCheckbox");
    graticuleCheckbox.property("checked", renderParams.showGraticule);
    graticuleCheckbox.on("change", () => {
        renderParams.showGraticule = graticuleCheckbox.property("checked");
        svg_graticule.attr("visibility", renderParams.showGraticule ? "visible" : "hidden");
    });
     
    // Outline checkbox
    const outlineCheckbox = d3.select("input#outlineCheckbox");
    outlineCheckbox.property("checked", renderParams.showOutline);
    outlineCheckbox.on("change", () => {
        renderParams.showOutline = outlineCheckbox.property("checked");
        svg_outline.attr("visibility", renderParams.showOutline ? "visible" : "hidden");
    });

    // Color checkbox, triggers re-render
    const colorCheckbox = d3.select("input#colorCheckbox");
    colorCheckbox.property("checked", renderParams.doColorCountries);
    colorCheckbox.on("change", () => {
        renderParams.doColorCountries = colorCheckbox.property("checked");
        update();
    });

    // Complex logarithm toggle checkbox, trigger re-render
    const complexLogCheckbox = d3.select("input#complexLogCheckbox");
    complexLogCheckbox.on("change", () => {
        if (!complexLogCheckbox.property("checked")) {
            changeProjection(projections.azimuthal)
        } else {
            changeProjection(projections.complexLog);
        }

        update();
    });

    // Scale range slider and number
    const scaleRange = d3.select("input#scaleRange");
    const scaleNumber = d3.select("input#scaleNumber");
    scaleRange.property("value", renderParams.scaleFactor);
    scaleNumber.property("value", renderParams.scaleFactor);
    scaleRange.on("input", () => {
        renderParams.scaleFactor = +scaleRange.property("value");
        scaleNumber.property("value", renderParams.scaleFactor);
        projection.scale(renderParams.scaleFactor * baseScale)

        update();
    });
    scaleNumber.on("input", () => {
        renderParams.scaleFactor = +scaleNumber.property("value");
        scaleRange.property("value", renderParams.scaleFactor);
        projection.scale(renderParams.scaleFactor * baseScale)

        update();
    })

}


// TODO: Put rendering into separate module

/** Render projected map to SVG */
function renderSvg() {
    let width = svg.attr("width");
    let height = svg.attr("height");

    // Render SVG
    let path = d3.geoPath(projection);
    svg_background.attr("width", width).attr("height", height);
    svg_countries.attr("d", path);
    svg_graticule.attr("d", path);

    // Outline cannot be rendered properly with complex log
    if (projection != projections.complexLog) {
        svg_outline.attr("d", path);
    } else {
        svg_outline.attr("d", "");        
    }

    // Color coding for countries
    if (renderParams.doColorCountries) {
        svg_countries.style("fill", function (d) { return colorScale(d.id); });
    } else {
        svg_countries.style("fill", "none");
    }
}


/**
 * Trigger re-rendering
 */
function update() {
    renderSvg();
}


/**
 * Prepares map and renders one time
 */
async function start() {
    await prepare();
    update();
}

start();