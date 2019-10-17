// TODO: Integrate d3-bundle as module into package manager
import "regenerator-runtime/runtime"; // Fix regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadTopojson } from "./modules/geo-loader";
import { complexLog } from "./modules/complexLog";

// TODO: Rename and refactor the following lines
let world, projection, svg, svg_background, svg_countries, svg_graticule, svg_outline, display;

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

let style = {
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

let translateStep = 10;

let colorScale = d3.scaleOrdinal(d3.schemeCategory10);


/**
 * Changes current projection and re-fits display area
 * @param {d3.GeoProjection} newProjection 
 */
function changeProjection(newProjection) { 
    projection = newProjection;
    let fittingObject = newProjection == projections.complexLog ? world.countries : world.outline;
    projection.fitSize([renderParams.width, renderParams.height], fittingObject);

    // Clipping along 180°/-180° line in complex plane
    if (projection == projections.complexLog) {
        const n = 100; // precision
        const p = 1; // padding
        let viewport = {
            type: "Polygon",
            coordinates: [
            [
                ...Array.from({length: n}, (_, t) => [p + (renderParams.width - p * 2) * t / n, p]),
                ...Array.from({length: n}, (_, t) => [renderParams.width - p, (renderParams.height - p * 2) * t / n + p]),
                ...Array.from({length: n}, (_, t) => [p + (renderParams.width - p * 2) * (n - t) / n, renderParams.height - p]),
                ...Array.from({length: n}, (_, t) => [p, (renderParams.height - p * 2) * (n - t) / n + p]),
                [p, p]
            ].map(p => projections.complexLog.invert(p))
            ]
        }

        console.log(viewport.coordinates);

        projection.preclip(d3.geoClipPolygon({
            type: "Polygon",
            coordinates: [viewport.coordinates[0]]
        }));
    }

    baseScale = projection.scale()
    projection.scale(renderParams.scaleFactor * baseScale);
    projection.precision(0.2);
    projection.rotate(renderParams.currentRotation);
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
    world = await loadTopojson("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json");

    changeProjection(projections.azimuthal);

    // Main display to render the map onto
    // SVG
    svg = d3.select("div#display").append("svg").attr("width", renderParams.width).attr("height", renderParams.height);
    // SVG background
    svg_background = svg.append("g").append("rect").attr("fill", style.backgroundFill).attr("stroke", style.backgroundStroke);
    // SVG countries
    svg_countries = svg.append("g").selectAll("path").data(world.countries.features).enter().append("path");
    svg_countries.attr("fill", style.countriesFill).attr("stroke", style.countriesStroke);
    // SVG graticule
    svg_graticule = svg.append("g").append("path").datum(world.graticule);
    svg_graticule.attr("fill", "none").attr("stroke", style.graticuleStroke);
    // SVG outline
    svg_outline = svg.append("g").append("path").datum(world.outline);
    svg_outline.attr("fill", "none").attr("stroke", style.outlineStroke);

    display = svg;

    // Transition to clicked position
    display.on("mousedown", function () {
        const mousePos = d3.mouse(this);
        const worldPos = projection.invert(mousePos);
        
        //console.log(`[${mousePos[0]}, ${mousePos[1]}] was [${worldPos[0]}, ${worldPos[1]}]`)

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

    // Graticule checkbox, triggers re-render
    const graticuleCheckbox = d3.select("input#graticuleCheckbox");
    graticuleCheckbox.property("checked", renderParams.showGraticule);
    graticuleCheckbox.on("change", () => {
        renderParams.showGraticule = graticuleCheckbox.property("checked");
        update();
    });

    // Outline checkbox, triggers re-render
    const outlineCheckbox = d3.select("input#outlineCheckbox");
    outlineCheckbox.property("checked", renderParams.showOutline);
    outlineCheckbox.on("change", () => {
        renderParams.showOutline = outlineCheckbox.property("checked");
        update();
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
// TODO: Do we have to set all these parameters in the render function?

/** Render projected map to SVG */
function renderSvg() {
    const width = svg.attr("width");
    const height = svg.attr("height");

    // Sync SVG settings
    svg_graticule.attr("visibility", renderParams.showGraticule ? "visible" : "hidden");
    svg_outline.attr("visibility", renderParams.showOutline ? "visible" : "hidden");

    // Render SVG
    let path = d3.geoPath(projection);
    svg_background.attr("width", width).attr("height", height);
    svg_countries.attr("d", path);
    svg_graticule.attr("d", path);
    svg_outline.attr("d", path);

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