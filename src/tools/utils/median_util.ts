import * as Simplify from '../lib/simplify';
import Voronoi from '../lib/voronoi';
import { assert, Point } from './base';
import { svg } from './svg';

const size = 1024;
const rise = 900;
// tslint:disable-next-line:variable-name
const num_to_match = 8;

let voronoi: any = undefined;
const range = (n: number) => Array.from({ length: n }, (value, key) => key);

const filterMedian = (median: any, n: number) => {
  const distances = range(median.length).map((i) =>
    Math.sqrt(Point.distance2(median[i], median[i + 1])),
  );
  let total = 0;
  distances.map((x) => (total += x));
  const result: any[] = [];
  let index = 0;
  let position = median[0];
  // tslint:disable-next-line:variable-name
  let total_so_far = 0;
  for (let i of range(n)) {
    const target = (i * total) / (n - 1);
    while (total_so_far < target) {
      const step = Math.sqrt(Point.distance2(position, median[index + 1]));
      if (total_so_far + step < target) {
        index += 1;
        position = median[index];
        total_so_far += step;
      } else {
        const t = (target - total_so_far) / step;
        position = [
          (1 - t) * position[0] + t * median[index + 1][0],
          (1 - t) * position[1] + t * median[index + 1][1],
        ];
        total_so_far = target;
      }
    }
    result.push(Point.clone(position));
  }
  result.push(median[median.length - 1]);
  return result;
};

const findLongestShortestPath = (adjacency: any, vertices: any, node: any) => {
  const path = findPathFromFurthestNode(adjacency, vertices, node);
  return findPathFromFurthestNode(adjacency, vertices, path[0]);
};

const findPathFromFurthestNode = (
  adjacency: any,
  vertices: any,
  node: any,
  visited?: any,
) => {
  visited = visited || {};
  visited[node] = true;
  let result: any = [];
  result.distance = 0;
  for (let neighbor of adjacency[node] || []) {
    if (!visited[neighbor]) {
      const candidate = findPathFromFurthestNode(adjacency, vertices, neighbor, visited);
      candidate.distance += Math.sqrt(
        Point.distance2(vertices[node], vertices[neighbor]),
      );
      if (candidate.distance > result.distance) {
        result = candidate;
      }
    }
  }
  result.push(node);
  return result;
};

const findStrokeMedian = (stroke: any) => {
  const paths = svg.convertSVGPathToPaths(stroke);
  assert(paths.length === 1, `Got stroke with multiple loops: ${stroke}`);

  let polygon: any = undefined;
  let diagram: any = undefined;
  for (let approximation of [16, 64]) {
    polygon = svg.getPolygonApproximation(paths[0], approximation);
    voronoi = voronoi || new Voronoi();
    const sites = polygon.map((point: any[]) => ({ x: point[0], y: point[1] }));
    const bounding_box = { xl: -size, xr: size, yt: -size, yb: size };
    try {
      diagram = voronoi.compute(sites, bounding_box);
      break;
    } catch (error) {
      console.error(`WARNING: Voronoi computation failed at ${approximation}.`);
    }
  }
  assert(diagram, 'Voronoi computation failed completely!');

  diagram.vertices.map((x: any, i: number) => {
    x.include = svg.polygonContainsPoint(polygon, [x.x, x.y]);
    x.index = i;
  });
  const vertices = diagram.vertices.map((x: any) => [x.x, x.y].map(Math.round));
  const edges: any = diagram.edges
    .map((x: any) => [x.va.index, x.vb.index])
    .filter((x: any) => diagram.vertices[x[0]].include && diagram.vertices[x[1]].include);
  voronoi.recycle(diagram);

  assert(edges.length > 0);
  let adjacency = {};
  for (let edge of edges) {
    adjacency[edge[0]] = adjacency[edge[0]] || [];
    adjacency[edge[0]].push(edge[1]);
    adjacency[edge[1]] = adjacency[edge[1]] || [];
    adjacency[edge[1]].push(edge[0]);
  }
  const root = edges[0][0];
  const path = findLongestShortestPath(adjacency, vertices, root);
  const points = path.map((i: number) => vertices[i]);

  const tolerance = 4;
  const simple = Simplify.simplify(
    points.map((x: any[]) => ({ x: x[0], y: x[1] })),
    tolerance,
  );
  return simple.map((x: any) => [x.x, x.y]);
};

const normalizeForMatch = (median: any) => {
  return filterMedian(median, num_to_match).map((x) => [
    x[0] / size,
    (rise - x[1]) / size,
  ]);
};

const median_util = {
  findStrokeMedian: findStrokeMedian,
  normalizeForMatch: normalizeForMatch,
};

export { median_util };
