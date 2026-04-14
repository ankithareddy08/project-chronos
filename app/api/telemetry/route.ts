import { NextResponse } from 'next/server';

interface CacheData {
  earthquakes: unknown;
  flights: unknown;
  timestamp: number;
}

let cache: CacheData | null = null;
const CACHE_TTL = 60 * 1000; // 60 seconds

// Mock data for demonstration
const MOCK_EARTHQUAKES = {
  features: [
    {
      geometry: { coordinates: [142.3711, 38.3706, 10] },
      properties: { mag: 5.2, place: 'Japan', time: Date.now() - 3600000 },
    },
    {
      geometry: { coordinates: [-122.414, 37.833, 8] },
      properties: { mag: 4.8, place: 'California', time: Date.now() - 1800000 },
    },
    {
      geometry: { coordinates: [13.33, 52.5, 5] },
      properties: { mag: 3.1, place: 'Germany', time: Date.now() - 900000 },
    },
    {
      geometry: { coordinates: [10.75, 59.9, 5] },
      properties: { mag: 2.9, place: 'Norway', time: Date.now() - 600000 },
    },
    {
      geometry: { coordinates: [139.65, 35.67, 12] },
      properties: { mag: 6.1, place: 'Tokyo', time: Date.now() - 300000 },
    },
  ],
};

const MOCK_FLIGHTS = {
  states: [
    {
      icao24: 'a0b1c2',
      callsign: 'AA101',
      origin_country: 'USA',
      latitude: 40.7128,
      longitude: -74.006,
      altitude: 10000,
      velocity: 450,
    },
    {
      icao24: 'a0b1c3',
      callsign: 'BA202',
      origin_country: 'GB',
      latitude: 51.5074,
      longitude: -0.1278,
      altitude: 11000,
      velocity: 460,
    },
    {
      icao24: 'a0b1c4',
      callsign: 'LH303',
      origin_country: 'DE',
      latitude: 52.52,
      longitude: 13.405,
      altitude: 9500,
      velocity: 440,
    },
    {
      icao24: 'a0b1c5',
      callsign: 'SAS404',
      origin_country: 'SE',
      latitude: 59.9139,
      longitude: 10.752,
      altitude: 8500,
      velocity: 430,
    },
    {
      icao24: 'a0b1c6',
      callsign: 'JAL505',
      origin_country: 'JP',
      latitude: 35.6762,
      longitude: 139.6503,
      altitude: 12000,
      velocity: 470,
    },
  ],
};

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

    let earthquakeData = { features: [] };
    let flightData = { states: [] };

    try {
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
        fetch('https://opensky-network.org/api/states/all', {
          method: 'GET',
          headers: {
            'User-Agent': 'ProjectChronos/1.0',
          },
          signal: controller.signal,
        }),
      ]);

      if (earthquakeRes.ok) {
        try {
          earthquakeData = await earthquakeRes.json();
        } catch (err) {
          console.error('Failed to parse earthquake data:', err);
          earthquakeData = MOCK_EARTHQUAKES;
        }
      } else {
        console.warn('Earthquake API failed, using mock data:', earthquakeRes.status);
        earthquakeData = MOCK_EARTHQUAKES;
      }

      if (flightRes.ok) {
        try {
          const rawFlights = await flightRes.json();
          if (Array.isArray(rawFlights.states)) {
            flightData = {
              states: rawFlights.states
                .filter((flight: any[]) => flight[5] !== null && flight[6] !== null)
                .slice(0, 100)
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
          } else {
            flightData = MOCK_FLIGHTS;
          }
        } catch (err) {
          console.error('Failed to parse flight data:', err);
          flightData = MOCK_FLIGHTS;
        }
      } else {
        console.warn('Flight API failed, using mock data:', flightRes.status);
        flightData = MOCK_FLIGHTS;
      }
    } catch (fetchError) {
      console.warn('API fetch timed out or failed, using mock data:', fetchError instanceof Error ? fetchError.message : String(fetchError));
      earthquakeData = MOCK_EARTHQUAKES;
      flightData = MOCK_FLIGHTS;
    } finally {
      clearTimeout(timeout);
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
    console.error('Error in telemetry endpoint:', error instanceof Error ? error.message : String(error));

    return NextResponse.json(
      {
        earthquakes: MOCK_EARTHQUAKES,
        flights: MOCK_FLIGHTS,
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=30',
        },
      }
    );
  }
}
