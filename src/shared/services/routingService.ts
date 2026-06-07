/**
 * Service to calculate routing distances using Open Source Routing Machine (OSRM)
 * API Endpoint: https://router.project-osrm.org
 */

export const routingService = {
  /**
   * Fetches the shortest path distance between two points.
   * @returns Distance in kilometers, or null if failed.
   */
  getShortestPathDistance: async (startLng: number, startLat: number, endLng: number, endLat: number): Promise<number | null> => {
    try {
      const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=false`);
      const data = await res.json();
      
      if (data.routes && data.routes.length > 0) {
        // OSRM returns distance in meters. Convert to kilometers.
        return data.routes[0].distance / 1000;
      }
      return null;
    } catch (e) {
      console.error('OSRM Routing Error', e);
      return null;
    }
  },

  /**
   * Fetches the shortest path distance matrix from a source to multiple destinations.
   * @param source User location {lng, lat}
   * @param destinations Array of destination locations {lng, lat}
   * @returns Array of distances in kilometers. Null if failed or exceeded limit.
   */
  getDistanceMatrix: async (
    source: { lng: number; lat: number },
    destinations: { lng: number; lat: number }[]
  ): Promise<number[] | null> => {
    try {
      if (destinations.length === 0) return [];
      
      // OSRM Table API supports ~100 coordinates maximum
      // The first coordinate is the source
      const coordsStr = [
        `${source.lng},${source.lat}`,
        ...destinations.map(d => `${d.lng},${d.lat}`)
      ].join(';');

      // sources=0 means distances from source to all others
      const res = await fetch(`https://router.project-osrm.org/table/v1/driving/${coordsStr}?sources=0`);
      const data = await res.json();

      if (data.distances && data.distances.length > 0) {
        // data.distances[0] contains array of distances from source to all points
        // The first element is distance from source to source (0)
        // We slice(1) to get distances to destinations
        return data.distances[0].slice(1).map((d: number) => d / 1000);
      }
      return null;
    } catch (e) {
      console.error('OSRM Table Routing Error', e);
      return null;
    }
  }
};
