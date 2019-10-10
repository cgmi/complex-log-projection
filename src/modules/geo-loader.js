import * as d3 from "../vendor/d3-bundle";
import * as topojson from "topojson";

/**
 * Loads TopoJSON file from URL and extracts land, graticule and outline.
 * @param {String} url TopoJSON file
 */
export async function loadTopojson(url) {
    const world = await d3.json(url);

    let land = topojson.feature(world, world.objects.land);
    let countries = topojson.feature(world, world.objects.countries);
    let graticule = d3.geoGraticule10();
    let outline = ({type: "Sphere"});

    return { land, countries, graticule, outline };
}