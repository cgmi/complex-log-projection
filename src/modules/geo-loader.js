import * as d3 from "../vendor/d3-bundle";
import * as topojson from "topojson";

/**
 * Loads whole world TopoJSON file from URL and extracts land, graticule and outline.
 * @param {String} url TopoJSON file
 */
export async function loadWorld(url) {
    const world = await d3.json(url);

    const land = topojson.feature(world, world.objects.land);
    const countries = topojson.feature(world, world.objects.countries);
    const graticule = d3.geoGraticule10();
    const outline = ({type: "Sphere"});

    return { land, countries, graticule, outline };
}

export async function loadGermany(url) {
    const germany = await d3.json(url);
    
    const outline = topojson.feature(germany, germany.objects.outline);

    return { outline };
}
