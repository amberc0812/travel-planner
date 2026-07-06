declare module 'world-atlas/countries-110m.json' {
  // Topology object consumed by topojson-client's feature(); typed loosely on purpose.
  const topology: {
    objects: { countries: unknown }
    [key: string]: unknown
  }
  export default topology
}
