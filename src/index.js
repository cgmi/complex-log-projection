import 'regenerator-runtime/runtime'; // Fix regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadTopojson } from './modules/geo-loader';

let world, projection, canvas, context;

// Various render settings
let renderParams = {
    showGraticule: true
}

/**
 * Prepare site for map rendering
 * @desc Grabs TopoJSON map and sets projection. Selects canvas and sets graticule checkbox.
 */
async function prepare() {
    // Download world map and set desired projection
    world = await loadTopojson("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json");
    //projection = d3.geoMercator();
    projection = d3.geoAzimuthalEquidistant();
    

    // Main canvas to render the map onto
    canvas = d3.select("canvas#map").node();
    context = canvas.getContext("2d");

    // Graticule checkbox, triggers re-render
    const graticuleCheckbox = d3.select("input#graticuleCheckbox");
    graticuleCheckbox.property("checked", renderParams.showGraticule);
    graticuleCheckbox.on("change", () => {
        renderParams.showGraticule = graticuleCheckbox.property("checked");
        render();
    });
}

/**
 * Render projected map to canvas
 */
function render() {
    const width = canvas.width;

    const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, world.outline)).bounds(world.outline);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
    let height = dy;

    const path = d3.geoPath(projection, context);
    context.save();
    context.beginPath(), path(world.outline), context.clip(), context.fillStyle = "#fff", context.fillRect(0, 0, width, height);

    if (renderParams.showGraticule) {
        context.beginPath(), path(world.graticule), context.strokeStyle = "#ccc", context.stroke();
    }    

    context.beginPath(), path(world.land), context.fillStyle = "#000", context.fill();
    context.restore();
    context.beginPath(), path(world.outline), context.strokeStyle = "#000", context.stroke();
}

/**
 * Prepares map and renders one time
 */
async function start() {
    await prepare();
    render();
}

start();