import "regenerator-runtime/runtime"; // Fixes regenerator-runtime issue with parcel...
import * as d3 from "./vendor/d3-bundle";
import { loadWorld } from "./modules/geo-loader";
import { concat }  from "./modules/util.js";

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
    defaultScaleFactor: 0.97,
    width: 800,
    height: 800,
    currentRotation: [0, 0]
}

// Various styling settings
const style = {
    backgroundFill: "none",
    backgroundStroke: "black",
    countriesFill: "none",
    countriesStroke: "black",
    graticuleStroke: "#ccc",
    outlineStroke: "black"
}

// Available projections
const projections = {
    complexLog: d3.geoComplexLog(),
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

    displays.left.projection.rotate(renderParams.currentRotation);
    displays.right.projection.rotate(renderParams.currentRotation);

    // Fit size based on projection
    displays.left.projection.fitSize([renderParams.width, renderParams.height], world.outline);
    displays.right.projection.fitSize([renderParams.width, renderParams.height], projections.complexLog.preclip().polygon());
    displays.left.baseScale = displays.left.projection.scale();
    displays.right.baseScale = displays.right.projection.scale();

    // Path generators
    displays.left.path = d3.geoPath(displays.left.projection);
    displays.right.path = d3.geoPath(displays.right.projection);

    // Main displays to render the map onto
    displays.left.svg = d3.select("div#display_left")
        .append("div")
        .classed("svg-container", true) 
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderParams.width} ${renderParams.height}`)
        .classed("svg-content-responsive", true);
    displays.right.svg = d3.select("div#display_right")
        .append("div")
        .classed("svg-container", true) 
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", `0 0 ${renderParams.width} ${renderParams.height}`)
        .classed("svg-content-responsive", true);

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

        d3.interrupt("rotation");
        d3.transition("rotation").duration(1000).tween("rotate", function() {
            const rotationInterpolatorLeft = d3.interpolate(displays.left.projection.rotate(), renderParams.currentRotation);
            const rotationInterpolatorRight = d3.interpolate(displays.right.projection.rotate(), renderParams.currentRotation);
            
            return function(t) {
                displays.left.projection.rotate(rotationInterpolatorLeft(t));
                displays.right.projection.rotate(rotationInterpolatorRight(t));
                displays.left.projection.fitSize([renderParams.width, renderParams.height], world.outline);
                displays.right.projection.fitSize([renderParams.width, renderParams.height], projections.complexLog.preclip().polygon());
                displays.left.baseScale = displays.left.projection.scale();
                displays.right.baseScale = displays.right.projection.scale();
                displays.left.projection.scale(displays.left.scaleFactor * displays.left.baseScale);
                displays.right.projection.scale(displays.right.scaleFactor * displays.right.baseScale);
                update();
            }
        }).transition();
    }
    displays.left.svg.on("mousedown", function () {
        const [lambda, phi] = displays.left.projection.invert(d3.mouse(this));
        rotationTransition(lambda, phi);
    });
    displays.right.svg.on("mousedown", function () {
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
            .duration(0)		
            .style("opacity", 0.94);		
            tooltip.html(lambda.toFixed(5) + "<br>" + phi.toFixed(5))	
            .style("left", (d3.event.pageX + 5) + "px")		
            .style("top", (d3.event.pageY - 35) + "px");
        }
    }
    function hideTooltip() {		
        tooltip.transition()		
            .duration(0)		
            .style("opacity", 0)
    }	
    displays.left.svg.on("mousemove", showTooltip(displays.left));	
    displays.left.svg.on("mouseout", hideTooltip);
    displays.right.svg.on("mousemove", showTooltip(displays.right));	
    displays.right.svg.on("mouseout", hideTooltip);

    // Graticule checkbox
    const graticuleCheckbox = d3.select("input#graticuleCheckbox");
    graticuleCheckbox.property("checked", renderParams.showGraticule);
    graticuleCheckbox.on("change", () => {
        renderParams.showGraticule = graticuleCheckbox.property("checked");
        svgs_graticules.attr("visibility", renderParams.showGraticule ? "visible" : "hidden");
    });
     
    // Outline checkbox
    const outlineCheckbox = d3.select("input#outlineCheckbox");
    outlineCheckbox.property("checked", renderParams.showOutline);
    outlineCheckbox.on("change", () => {
        renderParams.showOutline = outlineCheckbox.property("checked");
        svgs_outlines.attr("visibility", renderParams.showOutline ? "visible" : "hidden");
    });

    // Center checkbox
    const centerCheckbox = d3.select("input#centerCheckbox");
    centerCheckbox.property("checked", renderParams.showCenter);
    displays.left.svg_center.attr("visibility", renderParams.showCenter ? "visible" : "hidden");
    centerCheckbox.on("change", () => {
        renderParams.showCenter = centerCheckbox.property("checked");
        displays.left.svg_center.attr("visibility", renderParams.showCenter ? "visible" : "hidden");
    });

    // Color checkbox, triggers re-render
    const colorCheckbox = d3.select("input#colorCheckbox");
    colorCheckbox.property("checked", renderParams.doColorCountries);
    colorCheckbox.on("change", () => {
        renderParams.doColorCountries = colorCheckbox.property("checked");
        update();
    });

    // Complex log clip poly checkbox
    const clipPolyCheckbox = d3.select("input#clipPolyCheckbox");
    clipPolyCheckbox.property("checked", renderParams.showViewportClip);
    svgs_clipPolys.attr("visibility", renderParams.showViewportClip ? "visible" : "hidden");
    clipPolyCheckbox.on("change", () => {
        renderParams.showViewportClip = clipPolyCheckbox.property("checked");
        svgs_clipPolys.attr("visibility", renderParams.showViewportClip ? "visible" : "hidden");
    });

    // Scale range slider and number
    function updateScale(display, scaleFactor) {
        display.scaleFactor = scaleFactor;
        display.scaleRange.property("value", display.scaleFactor);
        display.scaleNumber.property("value", display.scaleFactor);
        display.projection.scale(display.scaleFactor * display.baseScale);

        update();
    }
    displays.left.scaleRange = d3.select("input#scaleRangeLeft");
    displays.left.scaleNumber = d3.select("input#scaleNumberLeft");
    updateScale(displays.left, renderParams.defaultScaleFactor);
    displays.left.scaleRange.on("input", () => {
        updateScale(displays.left, +displays.left.scaleRange.property("value"));
    });
    displays.left.scaleNumber.on("input", () => {
        updateScale(displays.left, +displays.left.scaleNumber.property("value"));
    });
    displays.right.scaleRange = d3.select("input#scaleRangeRight");
    displays.right.scaleNumber = d3.select("input#scaleNumberRight");
    updateScale(displays.right, renderParams.defaultScaleFactor);
    displays.right.scaleRange.on("input", () => {
        updateScale(displays.right, +displays.right.scaleRange.property("value"));
    });
    displays.right.scaleNumber.on("input", () => {
        updateScale(displays.right, +displays.right.scaleNumber.property("value"));
    });


    // Complex log translation button
    d3.select("button#upButton").on("click", function() {
        const [x, y] = displays.right.projection.translate();
        displays.right.projection.translate([x, y - 10]);
        update();
    });
    d3.select("button#downButton").on("click", function() {
        const [x, y] = displays.right.projection.translate();
        displays.right.projection.translate([x, y + 10]);
        update();
    });
}

/** Render both displays */
function render() {
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