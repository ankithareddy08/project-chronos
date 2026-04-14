import { NextResponse } from 'next/server';

interface CacheData {
  earthquakes: unknown;
  flights: unknown;
  timestamp: number;
}

let cache: CacheData | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds - aggressive to keep data fresh

export async function GET() {
  const now = Date.now();

  // Return cached data if still valid
  if (cache && now - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(
      {
        earthquakes: cache.earthquakes,
        flights: cache.flights,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }

  try {
    // Fetch both APIs in parallel with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const [earthquakeRes, flightRes] = await Promise.all([
      fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
        {
          method: 'GET',
          headers: {
            'User-Agent': 'ProjectChronos/1.0',
          },
          signal: controller.signal,
        }
      ),
      // OpenSky Network API - no authentication required for basic queries
      fetch('https://opensky-network.org/api/states/all', {
        method: 'GET',
        headers: {
          'User-Agent': 'ProjectChronos/1.0',
        },
        signal: controller.signal,
      }),
    ]).catch((err) => {
      clearTimeout(timeout);
      throw err;
    });

    clearTimeout(timeout);

    let earthquakeData = { features: [] };
    let flightData = { states: [] };

    if (earthquakeRes.ok) {
      try {
        earthquakeData = await earthquakeRes.json();
      } catch (err) {
        console.error('Failed to parse earthquake data:', err);
      }
    } else {
      console.error('Earthquake API failed:', earthquakeRes.status, earthquakeRes.statusText);
    }

    if (flightRes.ok) {
      try {
        const rawFlights = await flightRes.json();
        // OpenSky returns array of arrays; convert to structured format
        if (Array.isArray(rawFlights.states)) {
          flightData = {
            states: rawFlights.states
              .filter((flight: any[]) => flight[5] !== null && flight[6] !== null) // Has lat/lon
              .slice(0, 100) // Limit to 100 flights for performance
              .map((flight: any[]) => ({
                icao24: flight[0],
                callsign: flight[1]?.trim() || 'N/A',
                origin_country: flight[2],
                latitude: flight[5],
                longitude: flight[6],
                altitude: flight[7],
                velocity: flight[9],
              })),
          };
        }
      } catch (err) {
        console.error('Failed to parse flight data:', err);
      }
    } else {
      console.error('Flight API failed:', flightRes.status, flightRes.statusText);
    }

    // Update cache
    cache = {
      earthquakes: earthquakeData,
      flights: flightData,
      timestamp: now,
    };

    return NextResponse.json(
      {
        earthquakes: earthquakeData,
        flights: flightData,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching telemetry data:', error instanceof Error ? error.message : String(error));

    // Return stale cache if available
    if (cache) {
      return NextResponse.json(
        {
          earthquakes: cache.earthquakes,
          flights: cache.flights,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'public, max-age=15',
            'X-Cache-Status': 'stale',
          },
        }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch telemetry data',
        earthquakes: { features: [] },
        flights: { states: [] },
      },
      { status: 500 }
    );
  }
}
