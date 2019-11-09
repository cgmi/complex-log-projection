import * as d3 from "../vendor/d3-bundle";

/**
 * Concatenates two d3 selections.
 * @param {*} a 
 * @param {*} b 
 */
export function concat(a, b) {
    return d3.selectAll(a.nodes().concat(b.nodes()));
}