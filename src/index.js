// TODO: Integrate d3-bundle as module into package manager
import 'regenerator-runtime/runtime'; // Fix regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadTopojson } from "./modules/geo-loader";
import { complexLog } from "./modules/complexLog";

// TODO: Rename and refactor to avoid globals
let world, projection, canvas, context, svg, svg_land, svg_graticule, svg_outline, display;

// Various render settings
let renderParams = {
    useSvg: true,
    showGraticule: true,
    showOutline: true,
    scaleFactor: 0.9,
    width: 900,
    height: 900,
}


/**
 * Prepare site for map rendering
 * @desc Grabs TopoJSON map and sets projection. Selects canvas and sets graticule checkbox.
 */
async function prepare() {
    // Download world map and set desired projection
    world = await loadTopojson("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json");
    projection = complexLog();

    // Main display to render the map onto
    if (renderParams.useSvg) {
        // SVG
        svg = d3.select("div#display").append("svg").attr("width", renderParams.width).attr("height", renderParams.height);
        //svg.style("display", "block");

        // SVG landmass
        svg_land = svg.append("g").selectAll("path").data(world.land.features).enter().append("path");
        svg_land.attr("fill", "none").attr("stroke", "black");

        // SVG graticule
        svg_graticule = svg.append("g").append("path").datum(world.graticule);
        svg_graticule.attr("fill", "none").attr("stroke", "#ccc");

        // SVG outline
        svg_outline = svg.append("g").append("path").datum(world.outline);
        svg_outline.attr("fill", "none").attr("stroke", "black");

        display = svg;
    } else {
        // Canvas
        canvas = d3.select("div#display").append("canvas").attr("width", renderParams.width).attr("height", renderParams.height);
        context = canvas.node().getContext("2d");
        display = canvas;
    }

    // Mouse coordinates
    display.on("mousedown", function() {
        console.log(projection.invert(d3.mouse(this)));
    });

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

    // Scale range slider and label
    const scaleRange = d3.select("input#scaleRange");
    const scaleLabel = d3.select("label#scaleLabel");
    scaleRange.node().value = renderParams.scaleFactor;
    scaleLabel.node().innerHTML = renderParams.scaleFactor;
    scaleRange.on("input", () => {
        renderParams.scaleFactor = +scaleRange.node().value;
        scaleLabel.node().innerHTML = renderParams.scaleFactor;
        update();
    });

}


// TODO: Put rendering into separate module

/** Render projected map to SVG */
function renderSvg() {
    // Calculate scale for projection to fit SVG
    const width =  svg.attr("width");
    const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, world.outline)).bounds(world.outline);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
    const height = dy;

    // Sync SVG settings
    svg_graticule.attr("visibility", renderParams.showGraticule ? "visible" : "hidden");
    svg_outline.attr("visibility", renderParams.showOutline ? "visible" : "hidden");

    // Prepare SVG
    svg.attr("height", height);

    // Render SVG
    let path = d3.geoPath(projection);
    svg_land.attr("d", path);
    svg_graticule.attr("d", path);
    svg_outline.attr("d", path);
}


/**
 * Render projected map to canvas
 */
function renderCanvas() {
    // Calculate scale for projection to fit canvas
    const width = canvas.attr("width");
    const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, world.outline)).bounds(world.outline);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    projection.scale(renderParams.scaleFactor * projection.scale() * (l - 1) / l).precision(0.2);
    const height = dy;

    // Prepare canvas
    canvas.attr("height", height);

    // Set up geo path and start rendering
    const path = d3.geoPath(projection, context);
    context.clearRect(0, 0, canvas.node().width, canvas.node().height);
    context.save();

    // Background
    context.beginPath(), path(world.outline), context.clip(), context.fillStyle = "#fff", context.fillRect(0, 0, width, height);

    // Graticule
    if (renderParams.showGraticule) {
        context.beginPath(), path(world.graticule), context.strokeStyle = "#ccc", context.stroke();
        context.restore();
    }  
    
    // Landmass
    context.beginPath(), path(world.land), context.fillStyle = "#000", context.stroke();
    context.restore();

    // Globe outline
    if (renderParams.showOutline) {
        context.beginPath(), path(world.outline), context.strokeStyle = "#000", context.stroke();
    }
}


/**
 * Trigger re-rendering
 */
function update() {
    if (renderParams.useSvg) {
        renderSvg();
    } else {
        renderCanvas();
    }
}


/**
 * Prepares map and renders one time
 */
async function start() {
    await prepare();
    update();
}

start();