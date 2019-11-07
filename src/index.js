import "regenerator-runtime/runtime"; // Fixes regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadWorld } from "./modules/geo-loader";
import { complexLog } from "./modules/complexLog";

let world, 
    projection_left,
    projection_right,
    path_left,
    path_right;

let displays = {};

// TODO: Example with street data
const topoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";
//const topoJsonUrl = "/data/deutschland_bundesländer_3_mittel.topojson.json";

// Various render settings
let renderParams = {
    showGraticule: true,
    showOutline: true,
    showViewportClip: false,
    doColorCountries: true,
    scaleFactor: 1,
    width: 600,
    height: 600,
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

const projections = {
    complexLog: complexLog(),
    azimuthal: d3.geoAzimuthalEqualArea()
}

const translateStep = 10;

// Color scale used for country coloring
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

// /**
//  * Changes current projection and re-fits display area
//  * @param {d3.GeoProjection} newProjection 
//  */
// function changeProjection(newProjection) { 
//     projection = newProjection;

//     // Fit size based on projection
//     const fittingObject = newProjection == projections.complexLog ? world.countries : world.outline;
//     projection.fitSize([renderParams.width, renderParams.height], fittingObject);

//     // Rotation dictates projection point of interest
//     projection.rotate(renderParams.currentRotation);

//     // FIXME: Scale affects translate
//     // FIXME: Changing projection also increases the scale slightly, therefore shifts the complex log projection upwards
//     // Base scale is the scale that is derived from fitSize() for that projection
//     baseScale = projection.scale()
//     projection.scale(renderParams.scaleFactor * baseScale);  

//     // Update path generator
//     path = d3.geoPath(projection);
// }


// /**
//  * Translate projected map by vector (x, y)
//  * @param {Number} x 
//  * @param {Number} y 
//  */
// function translateMap(x, y) {
//     const t = projection.translate();
//     projection.translate([t[0] + x, t[1] + y]);
//     update();
// }


/**
 * Prepare site for map rendering
 * @desc Grabs TopoJSON map and sets projection. Appends SVG and creates UI functionality.
 */
async function prepare() {
    // Download world map and set desired projection
    world = await loadWorld(topoJsonUrl);

    projection_left = projections.azimuthal;
    projection_right = projections.complexLog;

    // Fit size based on projection
    projection_left.fitSize([renderParams.width, renderParams.height], world.outline);
    projection_right.fitSize([renderParams.width, renderParams.height], world.countries);

    path_left = d3.geoPath(projection_left);
    path_right = d3.geoPath(projection_right);

    // Main displays to render the map onto
    displays.svg = d3.selectAll("div.display").append("svg").attr("width", renderParams.width).attr("height", renderParams.height);

    // SVG background
    displays.svg_background = displays.svg.append("g").append("rect").attr("fill", style.backgroundFill).attr("stroke", style.backgroundStroke).attr("id", "background");
    // SVG countries
    displays.svg_countries = displays.svg.append("g").selectAll("path").data(world.countries.features).enter().append("path").attr("id", "countries");
    displays.svg_countries.attr("fill", style.countriesFill).attr("stroke", style.countriesStroke);
    // SVG graticule
    displays.svg_graticule = displays.svg.append("g").append("path").datum(world.graticule).attr("id", "graticule");
    displays.svg_graticule.attr("fill", "none").attr("stroke", style.graticuleStroke);
    // SVG outline
    displays.svg_outline = displays.svg.append("g").append("path").datum(world.outline).attr("id", "outline");
    displays.svg_outline.attr("fill", "none").attr("stroke", style.outlineStroke);

    // Viewport clip visualization
    displays.svg_viewportClip = displays.svg.append("g").append("path").datum(projections.complexLog.preclip().polygon()).attr("id", "viewportClip");
    displays.svg_viewportClip.attr("fill", "none").attr("stroke", "#ff0000");

    // // Transition to clicked position
    // displays.svg.on("mousedown", function () {
    //     const [lambda, phi] = projection.invert(d3.mouse(this));
    //     renderParams.currentRotation = [-lambda, -phi];

    //     d3.transition().duration(1000).tween("rotate", function() {
    //         const rotationInterpolator = d3.interpolate(projection.rotate(), renderParams.currentRotation);
            
    //         return function(t) {
    //             projection.rotate(rotationInterpolator(t));
    //             update();
    //         }
    //     }).transition();
    // });

    // // Keyboard interaction
    // displays.svg.attr("focusable", false);
    // displays.svg.on("keydown", function () {
    //     switch (d3.event.code) {
    //         case "KeyW":
    //             translateMap(0, -translateStep);
    //             break;
    //         case "KeyS":
    //             translateMap(0, translateStep);
    //             break;
    //         case "KeyA":
    //             translateMap(-translateStep, 0);
    //             break;
    //         case "KeyD":
    //             translateMap(translateStep, 0);
    //             break;
    //     }
    // });
    // displays.svg.on("focus", function () { });

    // Graticule checkbox
    const graticuleCheckbox = d3.select("input#graticuleCheckbox");
    graticuleCheckbox.property("checked", renderParams.showGraticule);
    graticuleCheckbox.on("change", () => {
        renderParams.showGraticule = graticuleCheckbox.property("checked");
        displays.svg_graticule.attr("visibility", renderParams.showGraticule ? "visible" : "hidden");
    });
     
    // Outline checkbox
    const outlineCheckbox = d3.select("input#outlineCheckbox");
    outlineCheckbox.property("checked", renderParams.showOutline);
    outlineCheckbox.on("change", () => {
        renderParams.showOutline = outlineCheckbox.property("checked");
        displays.svg_outline.attr("visibility", renderParams.showOutline ? "visible" : "hidden");
    });

    // Color checkbox, triggers re-render
    const colorCheckbox = d3.select("input#colorCheckbox");
    colorCheckbox.property("checked", renderParams.doColorCountries);
    colorCheckbox.on("change", () => {
        renderParams.doColorCountries = colorCheckbox.property("checked");
        update();
    });

    const viewportClipCheckbox = d3.select("input#viewportClipCheckbox");
    viewportClipCheckbox.property("checked", renderParams.showViewportClip);
    displays.svg_viewportClip.attr("visibility", renderParams.showViewportClip ? "visible" : "hidden");
    viewportClipCheckbox.on("change", () => {
        renderParams.showViewportClip = viewportClipCheckbox.property("checked");
        displays.svg_viewportClip.attr("visibility", renderParams.showViewportClip ? "visible" : "hidden");
    });

    // Scale range slider and number
    const scaleRange = d3.select("input#scaleRange");
    const scaleNumber = d3.select("input#scaleNumber");
    scaleRange.property("value", renderParams.scaleFactor);
    scaleNumber.property("value", renderParams.scaleFactor);
    scaleRange.on("input", () => {
        renderParams.scaleFactor = +scaleRange.property("value");
        scaleNumber.property("value", renderParams.scaleFactor);
        //projection.scale(renderParams.scaleFactor * baseScale);

        update();
    });
    scaleNumber.on("input", () => {
        renderParams.scaleFactor = +scaleNumber.property("value");
        scaleRange.property("value", renderParams.scaleFactor);
        //projection.scale(renderParams.scaleFactor * baseScale)

        update();
    })

}

/** Render projected map to SVG */
function renderSvg() {
    const width = displays.svg.attr("width");
    const height = displays.svg.attr("height");

    let pathFn = function(d, i, nodes) {
        const classList = nodes[0].parentElement.parentElement.parentElement.classList;
        if (classList.contains("display-left")) {
            return path_left(d);
        } else {
            return path_right(d);
        }
    }

    // Render SVG
    displays.svg_background.attr("width", width).attr("height", height);
    displays.svg_countries.attr("d", pathFn);
    displays.svg_graticule.attr("d", pathFn);
    displays.svg_viewportClip.attr("d", pathFn)

    // Outline cannot be rendered properly with complex log
    displays.svg_outline.attr("d", pathFn);

    // Color coding for countries
    if (renderParams.doColorCountries) {
        displays.svg_countries.style("fill", function (d) { return colorScale(d.id); });
    } else {
        displays.svg_countries.style("fill", "none");
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