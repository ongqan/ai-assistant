import { config } from '../config.js';

const TIMEOUT_MS = 6000;

async function findPlace(keyword, city) {
  if (!config.amapKey) return null;
  const params = new URLSearchParams({
    key: config.amapKey,
    keywords: keyword,
    city,
    citylimit: 'true',
    extensions: 'all',
    offset: '1',
    page: '1'
  });
  const response = await fetch(`https://restapi.amap.com/v3/place/text?${params}`, {
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) throw new Error(`地图服务响应异常：${response.status}`);
  const data = await response.json();
  const poi = data.pois?.[0];
  if (!poi?.location) return null;
  const [longitude, latitude] = poi.location.split(',').map(Number);
  return {
    verifiedName: poi.name,
    address: Array.isArray(poi.address) ? poi.address.join('') : poi.address || '',
    longitude,
    latitude,
    source: 'amap'
  };
}

export async function enrichPlanWithPlaces(plan) {
  if (!config.amapKey) return { ...plan, placeDataStatus: 'not_configured' };
  const enrichedDays = await Promise.all(plan.days.map(async day => ({
    ...day,
    stops: await Promise.all(day.stops.map(async stop => {
      try {
        return { ...stop, place: await findPlace(stop.name, plan.intent.destination) };
      } catch {
        return { ...stop, place: null };
      }
    }))
  })));
  return { ...plan, days: enrichedDays, placeDataStatus: 'amap' };
}

