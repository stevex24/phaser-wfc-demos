import test from "node:test";
import assert from "node:assert/strict";

import {
  FALSE_JUNCTION_LEVEL,
  LevelModel,
  PROJECTION
} from "../src/levelModel.js";

test("the approved level contains eight named nodes", () => {
  assert.deepEqual(Object.keys(FALSE_JUNCTION_LEVEL.nodes), [
    "start", "low1", "low2", "lowJ", "highJ", "high1", "high2", "goal"
  ]);
});

test("the graph is an undirected route from start to goal", () => {
  const level = new LevelModel();
  assert.deepEqual(level.neighbors("start"), ["low1"]);
  assert.deepEqual(level.neighbors("lowJ"), ["low2", "highJ"]);
  assert.deepEqual(level.neighbors("goal"), ["high2"]);
});

test("move accepts graph edges in either direction", () => {
  const level = new LevelModel();
  assert.equal(level.move("lowJ", "highJ"), "highJ");
  assert.equal(level.move("highJ", "lowJ"), "lowJ");
});

test("move rejects destinations that are not graph neighbors", () => {
  const level = new LevelModel();
  assert.throws(() => level.move("start", "goal"), /Illegal move/);
  assert.throws(() => level.move("low2", "high1"), /Illegal move/);
});

test("the false junction uses distinct logical points", () => {
  const level = new LevelModel();
  assert.notDeepEqual(level.node("lowJ"), level.node("highJ"));
  assert.equal(level.node("lowJ").z, 0);
  assert.equal(level.node("highJ").z, 2);
});

test("the two false-junction points project to exactly the same pixel", () => {
  const level = new LevelModel();
  const origin = { x: 600, y: 360 };
  assert.deepEqual(level.project("lowJ", origin), origin);
  assert.deepEqual(level.project("highJ", origin), origin);
});

test("the projection constants match the approved Day 3 mathematics", () => {
  assert.deepEqual(PROJECTION, {
    xStep: 40,
    groundStep: 24,
    heightStep: 24
  });
});

test("only the lowJ-highJ edge is marked apparent", () => {
  const level = new LevelModel();
  assert.equal(level.isApparentEdge("lowJ", "highJ"), true);
  assert.equal(level.isApparentEdge("highJ", "lowJ"), true);
  assert.equal(level.isApparentEdge("start", "low1"), false);
});

test("goal detection is independent of rendering", () => {
  const level = new LevelModel();
  assert.equal(level.isGoal("goal"), true);
  assert.equal(level.isGoal("high2"), false);
});

test("reveal is always available in the first prototype", () => {
  const level = new LevelModel();
  assert.equal(level.revealPolicy, "always");
});

test("the complete approved route reaches the goal", () => {
  const level = new LevelModel();
  const route = ["start", "low1", "low2", "lowJ", "highJ", "high1", "high2", "goal"];
  let current = route[0];

  for (const next of route.slice(1)) {
    current = level.move(current, next);
  }

  assert.equal(level.isGoal(current), true);
});

test("invalid apparent edges are rejected when a level is constructed", () => {
  const badDefinition = {
    id: "bad-level",
    start: "a",
    goal: "b",
    revealPolicy: "always",
    nodes: {
      a: { x: 0, y: 0, z: 0 },
      b: { x: 1, y: 0, z: 0 }
    },
    edges: [{ from: "a", to: "b", kind: "apparent" }]
  };

  assert.throws(
    () => new LevelModel(badDefinition),
    /Apparent edge endpoints must share a projection/
  );
});

