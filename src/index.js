// Fix regenerator-runtime issue with parcel...
import 'regenerator-runtime/runtime'

// d3
import * as d3_base from "d3";
import * as d3_geo_projection from "d3-geo-projection";
// Merge base d3 and the geo-projection extension
const d3 = Object.assign({}, d3_base, d3_geo_projection);

// topojson
import * as topojson from"topojson";


async function drawWorld() {
    const response = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json");
    const world = await response.json();

    let land = topojson.feature(world, world.objects.land);
    let graticule = d3.geoGraticule10();
    let outline = ({type: "Sphere"});

    let projection = d3.geoMercator();
    
    const canvas = document.getElementById("map");
    const context = canvas.getContext("2d")

    const width = canvas.width;

    const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, outline)).bounds(outline);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
    let height = dy;

    const path = d3.geoPath(projection, context);
    context.save();
    context.beginPath(), path(outline), context.clip(), context.fillStyle = "#fff", context.fillRect(0, 0, width, height);
    context.beginPath(), path(graticule), context.strokeStyle = "#ccc", context.stroke();
    context.beginPath(), path(land), context.fillStyle = "#000", context.fill();
    context.restore();
    context.beginPath(), path(outline), context.strokeStyle = "#000", context.stroke();
    let map = context.canvas;
}

drawWorld();

