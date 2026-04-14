import { NextResponse } from 'next/server';

export async function GET() {
  const results = {
    usgs: 'testing...',
    opensky: 'testing...',
    timestamp: new Date().toISOString(),
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(
        'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
        { signal: controller.signal, headers: { 'User-Agent': 'ProjectChronos/1.0' } }
      );
      results.usgs = `Status: ${res.status} ${res.statusText}`;
    } catch (e) {
      results.usgs = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    try {
      const res = await fetch('https://opensky-network.org/api/states/all', {
        signal: controller.signal,
        headers: { 'User-Agent': 'ProjectChronos/1.0' },
      });
      results.opensky = `Status: ${res.status} ${res.statusText}`;
    } catch (e) {
      results.opensky = `Error: ${e instanceof Error ? e.message : String(e)}`;
    }

    clearTimeout(timeout);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }

  return NextResponse.json(results);
}
