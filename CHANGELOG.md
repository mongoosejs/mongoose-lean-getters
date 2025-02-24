2.2.1 / 2025-02-24
==================
 * fix: handle getter for single nested that returns non-object #42

2.2.0 / 2025-02-21
==================
 * feat: allow default lean options plugin config #41 [DesignByOnyx](https://github.com/DesignByOnyx)
 * fix: allow nested schemas on discriminated models to work #43 [DesignByOnyx](https://github.com/DesignByOnyx)
 * fix: allow array getters to return non-arrays fix #38 #37 [DesignByOnyx](https://github.com/DesignByOnyx)

2.1.1 / 2024-08-04
==================
 * fix: allow non-discriminated documents be retrieved #40 [DesignByOnyx](https://github.com/DesignByOnyx)
 * fix: don't throw error if array contains null #36 [Sebmaster](https://github.com/Sebmaster)

2.1.0 / 2024-04-27
==================
 * feat: add support for findOneAndReplace #34 [Ebulus7899](https://github.com/Ebulus7899)
 * fix: handle discriminators in nested document arrays #32 [nathan-knight](https://github.com/nathan-knight)

2.0.1 / 2024-03-08
==================
 * fix: handle discriminators with explicit tied values #31 [MarkParnwell](https://github.com/MarkParnwell)
 * fix: correctly get schema for each element of a discriminated array #28 [nathan-knight](https://github.com/nathan-knight)

2.0.0 / 2024-03-07
==================
 * BREAKING CHANGE: call getters correctly on array elements for Mongoose 7.5.0, require Mongoose 7.5.0 #30

1.1.0 / 2023-06-01
==================
 * feat: apply getters to schemas with discriminator #26 [remcorakers](https://github.com/remcorakers)

1.0.0 / 2023-04-27
==================
 * BREAKING CHANGE: require Mongoose >= 7.1
 * fix: avoid calling getters on excluded paths in arrays #22 [IslandRhythms](https://github.com/IslandRhythms)

0.4.0 / 2023-02-13
==================
 * fix: support findOneAndDelete #24 #23 [IslandRhythms](https://github.com/IslandRhythms)

0.3.6 / 2023-01-06
==================
 * fix: omit paths with no getters set #21 [IslandRhythms](https://github.com/IslandRhythms)

0.3.5 / 2022-07-22
==================
 * fix: correct semver range #19 [DesignByOnyx](https://github.com/DesignByOnyx)

0.3.4 / 2022-06-19
==================
 * fix: call nested getters if nesting level > 1 #17 [vladomnifi](https://github.com/vladomnifi)

0.3.3 / 2022-05-28
==================
 * fix(types): remove unnecessary empty index.ts file #14 #15

0.3.2 / 2022-04-20
==================
 * fix: correctly handle projections with document arrays #13
 * fix: export default for ESM imports #11 [IslandRhythms](https://github.com/IslandRhythms)

0.3.1 / 2022-04-17
==================
 * fix: avoid running getters on fields that are excluded by projection #9 [IslandRhythms](https://github.com/IslandRhythms)

0.3.0 / 2021-12-20
==================
 * feat: add Mongoose 6 to supported versions #8 [medolino](https://github.com/medolino)

0.2.2 / 2021-12-02
==================
 * fix: fix compiling with strict tsconfig #7 [Maks-s](https://github.com/Maks-s)

0.2.1 / 2021-09-22
==================
 * fix: upgrade to latest mpath #5

0.2.0 / 2021-03-03
==================
 * feat: add index.d.ts for TypeScript support #4

0.1.2 / 2019-12-05
==================
 * fix: only call getters once when using `find()` #1

0.1.1 / 2019-07-18
==================
 * docs: add example to README
