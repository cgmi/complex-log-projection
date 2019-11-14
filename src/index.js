import "regenerator-runtime/runtime"; // Fixes regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadWorld } from "./modules/geo-loader";
import { complexLog } from "./modules/complexLog";
import { concat }  from "./modules/util.js";

// Canvas is faster than SVG
const USE_CANVAS_RENDERER = true;

// Word geographic data
let world;
const topoJsonUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Left and right displays for map projections
let displays = {
    left: {},
    right: {}
};

// Various render settings
let renderParams = {
    showGraticule: true,
    showOutline: true,
    showCenter: true,
    showViewportClip: false,
    doColorCountries: true,
    scaleFactor: 1,
    width: 650,
    height: 650,
    currentRotation: [0, 0]
}

// Various styling settings
const style = {
    backgroundFill: "white",
    backgroundStroke: "black",
    countriesFill: "none",
    countriesStroke: "black",
    graticuleStroke: "#ccc",
    outlineStroke: "black"
}

// Available projections
const projections = {
    complexLog: complexLog(),
    azimuthal: d3.geoAzimuthalEqualArea()
}

// Color scale used for country coloring
const colorScale = d3.scaleOrdinal(d3.schemeCategory10);


/**
 * Prepare site for map rendering
 * @desc Grabs TopoJSON map and sets projection. Appends SVG and creates UI functionality.
 */
async function prepare() {
    // Download world map and set desired projection
    world = await loadWorld(topoJsonUrl);
    displays.left.projection = projections.azimuthal;
    displays.right.projection = projections.complexLog;

    // Fit size based on projection
    displays.left.projection.fitSize([renderParams.width, renderParams.height], world.outline);
    displays.right.projection.fitSize([renderParams.width, renderParams.height], world.countries);
    displays.left.baseScale = displays.left.projection.scale();
    displays.right.baseScale = displays.right.projection.scale();

    clipComplexLog();

    // Shift complex log slightly up
    const t = displays.right.projection.translate();
    displays.right.projection.translate([t[0], t[1] - renderParams.height / 4]);



    // Main displays to render the map onto
    if (USE_CANVAS_RENDERER) {
        displays.left.canvas = d3.select("div#display_left").append("canvas").attr("width", renderParams.width).attr("height", renderParams.height);
        displays.right.canvas = d3.select("div#display_right").append("canvas").attr("width", renderParams.width).attr("height", renderParams.height);
        displays.left.canvas.context = displays.left.canvas.node().getContext("2d");
        displays.right.canvas.context = displays.right.canvas.node().getContext("2d");

        displays.left.displayObject = displays.left.canvas;
        displays.right.displayObject = displays.right.canvas;

        // Canvas path generators
        displays.left.path = d3.geoPath(displays.left.projection, displays.left.canvas.context);
        displays.right.path = d3.geoPath(displays.right.projection, displays.right.canvas.context);
    } else {
        displays.left.svg = d3.select("div#display_left").append("svg").attr("width", renderParams.width).attr("height", renderParams.height);
        displays.right.svg = d3.select("div#display_right").append("svg").attr("width", renderParams.width).attr("height", renderParams.height);

        displays.left.displayObject = displays.left.svg;
        displays.right.displayObject = displays.right.svg;

        // SVG path generators
        displays.left.path = d3.geoPath(displays.left.projection);
        displays.right.path = d3.geoPath(displays.right.projection);
    
        // SVG background
        displays.left.svg_background = displays.left.svg.append("g").append("rect");
        displays.right.svg_background = displays.right.svg.append("g").append("rect");
        const svgs_backgrounds = concat(displays.left.svg_background, displays.right.svg_background);
        svgs_backgrounds.attr("id", "background").attr("fill", style.backgroundFill).attr("stroke", style.backgroundStroke)
        svgs_backgrounds.attr("width", renderParams.width).attr("height", renderParams.height);
    
        // SVG countries
        displays.left.svg_countries = displays.left.svg.append("g").selectAll("path").data(world.countries.features).enter().append("path");
        displays.right.svg_countries = displays.right.svg.append("g").selectAll("path").data(world.countries.features).enter().append("path");
        const svgs_countries = concat(displays.left.svg_countries, displays.right.svg_countries);
        svgs_countries.attr("id", "countries").attr("fill", style.countriesFill).attr("stroke", style.countriesStroke);
    
        // SVG graticule
        displays.left.svg_graticule = displays.left.svg.append("g").append("path").datum(world.graticule);
        displays.right.svg_graticule = displays.right.svg.append("g").append("path").datum(world.graticule);
        const svgs_graticules = concat(displays.left.svg_graticule, displays.right.svg_graticule);
        svgs_graticules.attr("id", "graticule").attr("fill", "none").attr("stroke", style.graticuleStroke);
    
        // SVG outline
        displays.left.svg_outline = displays.left.svg.append("g").append("path").datum(world.outline);
        displays.right.svg_outline = displays.right.svg.append("g").append("path").datum(world.outline);
        const svgs_outlines = concat(displays.left.svg_outline, displays.right.svg_outline);
        svgs_outlines.attr("id", "outline").attr("fill", "none").attr("stroke", style.outlineStroke);
    
        // Viewport clip visualization
        displays.left.svg_clipPoly = displays.left.svg.append("g").append("path").datum(projections.complexLog.preclip().polygon ? projections.complexLog.preclip().polygon() : "");
        displays.right.svg_clipPoly = displays.right.svg.append("g").append("path").datum(projections.complexLog.preclip().polygon ? projections.complexLog.preclip().polygon() : "");
        const svgs_clipPolys = concat(displays.left.svg_clipPoly, displays.right.svg_clipPoly);
        svgs_clipPolys.attr("id", "viewportClip").attr("fill", "none").attr("stroke", "#ff0000");
    
        // Left-display center cross
        const crossSize = 20;
        displays.left.svg_center = displays.left.svg.append("g");
        displays.left.svg_center.append("line")
            .attr("x1", renderParams.width / 2 - crossSize / 2)
            .attr("x2", renderParams.width / 2 + crossSize / 2)
            .attr("y1", renderParams.height / 2)
            .attr("y2", renderParams.height / 2);
        displays.left.svg_center.append("line")
            .attr("x1", renderParams.width / 2)
            .attr("x2", renderParams.width / 2)
            .attr("y1", renderParams.height / 2 - crossSize / 2)
            .attr("y2", renderParams.height / 2 + crossSize / 2);
        displays.left.svg_center.selectAll("line")
            .attr("stroke", "red")
            .attr("stroke-width", 2);
    }


    // Longitude and latitude controls
    const longitudeTextbox = d3.select("input#longitude");
    const latitudeTextbox = d3.select("input#latitude");
    longitudeTextbox.property("value", renderParams.currentRotation[0]);
    latitudeTextbox.property("value", renderParams.currentRotation[1]);
    // Transition to clicked position
    function rotationTransition(lambda, phi) {
        renderParams.currentRotation = [-lambda, -phi];
        longitudeTextbox.property("value", renderParams.currentRotation[0]);
        latitudeTextbox.property("value", renderParams.currentRotation[1]);

        d3.transition().duration(1000).tween("rotate", function() {
            const rotationInterpolatorLeft = d3.interpolate(displays.left.projection.rotate(), renderParams.currentRotation);
            const rotationInterpolatorRight = d3.interpolate(displays.right.projection.rotate(), renderParams.currentRotation);
            
            return function(t) {
                displays.left.projection.rotate(rotationInterpolatorLeft(t));
                displays.right.projection.rotate(rotationInterpolatorRight(t));
                update();
            }
        }).transition();

        clipComplexLog();
    }
    displays.left.displayObject.on("mousedown", function () {
        const [lambda, phi] = displays.left.projection.invert(d3.mouse(this));
        rotationTransition(lambda, phi);
    });
    displays.right.displayObject.on("mousedown", function () {
        const [lambda, phi] = displays.right.projection.invert(d3.mouse(this));
        rotationTransition(lambda, phi);
    });
    longitudeTextbox.on("change", () => {
        rotationTransition(-longitudeTextbox.property("value"), renderParams.currentRotation[1]);
    });
    latitudeTextbox.on("input", () => {
        rotationTransition(renderParams.currentRotation[0], -latitudeTextbox.property("value"));
    });

    // Hover information about world coordinates
    let tooltip = d3.select("body").append("div").attr("class", "tooltip").style("opacity", 0);
    function showTooltip(display) {
        return function() {
            const [mouseX, mouseY] = d3.mouse(this);
            const [lambda, phi] = display.projection.invert([mouseX, mouseY]);

            tooltip.transition()		
            .duration(200)		
            .style("opacity", 0.94);		
            tooltip.html(lambda.toFixed(5) + "<br>" + phi.toFixed(5))	
            .style("left", (d3.event.pageX + 5) + "px")		
            .style("top", (d3.event.pageY - 35) + "px");
        }
    }
    function hideTooltip() {		
        tooltip.transition()				
            .style("opacity", 0)
    }	
    displays.left.displayObject.on("mousemove", showTooltip(displays.left));	
    displays.left.displayObject.on("mouseout", hideTooltip);
    displays.right.displayObject.on("mousemove", showTooltip(displays.right));	
    displays.right.displayObject.on("mouseout", hideTooltip);

    // // Graticule checkbox
    // const graticuleCheckbox = d3.select("input#graticuleCheckbox");
    // graticuleCheckbox.property("checked", renderParams.showGraticule);
    // graticuleCheckbox.on("change", () => {
    //     renderParams.showGraticule = graticuleCheckbox.property("checked");
    //     svgs_graticules.attr("visibility", renderParams.showGraticule ? "visible" : "hidden");
    // });
     
    // // Outline checkbox
    // const outlineCheckbox = d3.select("input#outlineCheckbox");
    // outlineCheckbox.property("checked", renderParams.showOutline);
    // outlineCheckbox.on("change", () => {
    //     renderParams.showOutline = outlineCheckbox.property("checked");
    //     svgs_outlines.attr("visibility", renderParams.showOutline ? "visible" : "hidden");
    // });

    // // Center checkbox
    // const centerCheckbox = d3.select("input#centerCheckbox");
    // centerCheckbox.property("checked", renderParams.showCenter);
    // displays.left.svg_center.attr("visibility", renderParams.showCenter ? "visible" : "hidden");
    // centerCheckbox.on("change", () => {
    //     renderParams.showCenter = centerCheckbox.property("checked");
    //     displays.left.svg_center.attr("visibility", renderParams.showCenter ? "visible" : "hidden");
    // });

    // Color checkbox, triggers re-render
    const colorCheckbox = d3.select("input#colorCheckbox");
    colorCheckbox.property("checked", renderParams.doColorCountries);
    colorCheckbox.on("change", () => {
        renderParams.doColorCountries = colorCheckbox.property("checked");
        update();
    });

    // // Complex log clip poly checkbox
    // const clipPolyCheckbox = d3.select("input#clipPolyCheckbox");
    // clipPolyCheckbox.property("checked", renderParams.showViewportClip);
    // svgs_clipPolys.attr("visibility", renderParams.showViewportClip ? "visible" : "hidden");
    // clipPolyCheckbox.on("change", () => {
    //     renderParams.showViewportClip = clipPolyCheckbox.property("checked");
    //     svgs_clipPolys.attr("visibility", renderParams.showViewportClip ? "visible" : "hidden");
    // });

    // FIXME: Scale affects translation of complex log projection (Issue #1)
    // Scale range slider and number
    const scaleRange = d3.select("input#scaleRange");
    const scaleNumber = d3.select("input#scaleNumber");
    scaleRange.property("value", renderParams.scaleFactor);
    scaleNumber.property("value", renderParams.scaleFactor);
    scaleRange.on("input", () => {
        renderParams.scaleFactor = +scaleRange.property("value");
        scaleNumber.property("value", renderParams.scaleFactor);
        displays.left.projection.scale(renderParams.scaleFactor * displays.left.baseScale);
        displays.right.projection.scale(renderParams.scaleFactor * displays.right.baseScale);

        update();
    });
    scaleNumber.on("input", () => {
        renderParams.scaleFactor = +scaleNumber.property("value");
        scaleRange.property("value", renderParams.scaleFactor);
        displays.left.projection.scale(renderParams.scaleFactor * displays.left.baseScale);
        displays.right.projection.scale(renderParams.scaleFactor * displays.right.baseScale);

        update();
    });

    // Complex log translation button
    d3.select("button#upButton").on("click", function() {
        const [x, y] = displays.right.projection.translate();
        displays.right.projection.translate([x, y - 100]);
        update();
    });
    d3.select("button#downButton").on("click", function() {
        const [x, y] = displays.right.projection.translate();
        displays.right.projection.translate([x, y + 100]);
        update();
    });
}

function renderCanvas(display) {
    const context = display.canvas.context;
    context.save();
    context.beginPath(), context.fillStyle = style.backgroundFill, context.strokeStyle = style.backgroundStroke, context.rect(0, 0, renderParams.width, renderParams.height), context.fill(), context.stroke();
    context.beginPath(), display.path(world.outline), context.clip(), context.strokeStyle = style.outlineStroke, context.strokeRect(0, 0, renderParams.width, renderParams.height);
    context.beginPath(), display.path(world.graticule), context.strokeStyle = "#ccc", context.stroke();
    context.beginPath(), display.path(world.countries), context.fillStyle = "#000", context.fill();
    context.restore();
    context.beginPath(), display.path(world.outline), context.strokeStyle = "#000", context.stroke();
}

// TODO: Canvas renderer for better performance (Issue #2)
/** Render both displays */
function render() {
    if (USE_CANVAS_RENDERER) {
        // Draw left display
        renderCanvas(displays.left);
        renderCanvas(displays.right);

    } else {
        // Render paths
        displays.left.svg_countries.attr("d", displays.left.path);
        displays.right.svg_countries.attr("d", displays.right.path);
        displays.left.svg_graticule.attr("d", displays.left.path);
        displays.right.svg_graticule.attr("d", displays.right.path);
        displays.left.svg_clipPoly.attr("d", displays.left.path);
        displays.right.svg_clipPoly.attr("d", displays.right.path);
        // Outline cannot be rendered properly with complex log
        displays.left.svg_outline.attr("d", displays.left.path);

        // Color coding for countries
        if (renderParams.doColorCountries) {
            displays.left.svg_countries.style("fill", function (d) { return colorScale(d.id); });
            displays.right.svg_countries.style("fill", function (d) { return colorScale(d.id); });
        } else {
            displays.left.svg_countries.style("fill", "none");
            displays.right.svg_countries.style("fill", "none");
        }
    }
}

/**
 * Clipping complex logarithm projection
 */
function clipComplexLog() {
    // Clip complex log to avoid overlapping polygons
//     const width = renderParams.width;
//     const height = renderParams.height;
//     const n = 1; // Precision, how many vertices to insert along clipping polygon rectangle lines
//     const p = 0.1;  // Padding along 180°/-180° degree line in complex log projection, choose large enough to prevent overlapping polygons across map
//     let viewportClip = {
//         type: "Polygon",
//         coordinates: [
//             [
//                 ...Array.from({length: n}, (_, t) => [p + (width - p * 2) * t / n, p]),
//                 ...Array.from({length: n}, (_, t) => [width - p, (height - p * 2) * t / n + p]),
//                 ...Array.from({length: n}, (_, t) => [p + (width - p * 2) * (n - t) / n, height - p]),
//                 ...Array.from({length: n}, (_, t) => [p, (height - p * 2) * (n - t) / n + p]),
//                 [p, p]
//             ].map(point => displays.right.projection.invert(point)).map(d3.geoRotation(displays.right.projection.rotate())) // Clip polygon must also be rotated
//         ]
//     };
//     console.log(viewportClip.coordinates);
//     displays.right.projection.preclip(d3.geoClipPolygon(viewportClip));
}


/**
 * Trigger re-rendering
 */
function update() {
    render();
}


/**
 * Prepares map and renders one time
 */
async function start() {
    await prepare();
    update();
}

start();