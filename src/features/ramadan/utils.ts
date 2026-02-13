import type { HighLatitudeRule, RamadanMethod, RamadanTimings, RamadanLocation } from './types';
import { RAMADAN_METHODS } from './constants';

const deg2rad = (deg: number) => (deg * Math.PI) / 180;
const rad2deg = (rad: number) => (rad * 180) / Math.PI;

const normalize = (value: number, max: number) => {
  const result = value % max;
  return result < 0 ? result + max : result;
};

const dayOfYear = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
};

const calcSolarTimeUtc = (date: Date, latitude: number, longitude: number, angle: number, isSunrise: boolean) => {
  const N = dayOfYear(date);
  const lngHour = longitude / 15;
  const t = N + ((isSunrise ? 6 : 18) - lngHour) / 24;
  const M = (0.9856 * t) - 3.289;
  let L = M + (1.916 * Math.sin(deg2rad(M))) + (0.020 * Math.sin(deg2rad(2 * M))) + 282.634;
  L = normalize(L, 360);

  let RA = rad2deg(Math.atan(0.91764 * Math.tan(deg2rad(L))));
  RA = normalize(RA, 360);

  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA /= 15;

  const sinDec = 0.39782 * Math.sin(deg2rad(L));
  const cosDec = Math.cos(Math.asin(sinDec));

  const cosH = (Math.cos(deg2rad(angle)) - (sinDec * Math.sin(deg2rad(latitude)))) / (cosDec * Math.cos(deg2rad(latitude)));

  if (cosH > 1 || cosH < -1) {
    return null;
  }

  let H = isSunrise ? 360 - rad2deg(Math.acos(cosH)) : rad2deg(Math.acos(cosH));
  H /= 15;

  const T = H + RA - (0.06571 * t) - 6.622;
  let UT = T - lngHour;
  UT = normalize(UT, 24);

  return UT;
};

const utcToDate = (date: Date, utcHours: number) => {
  const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
  return new Date(utcDate.getTime() + utcHours * 3600000);
};

const applyHighLatitudeRule = (
  nightLengthHours: number,
  rule: HighLatitudeRule
) => {
  if (rule === 'MiddleOfNight') {
    return nightLengthHours / 2;
  }
  if (rule === 'AngleBased') {
    return nightLengthHours * 0.6;
  }
  return nightLengthHours / 7;
};

export const calculateRamadanTimings = (
  date: Date,
  lat: number,
  lng: number,
  method: RamadanMethod,
  highLatitudeRule: HighLatitudeRule
): RamadanTimings | null => {
  const sunriseUtc = calcSolarTimeUtc(date, lat, lng, 90.833, true);
  const sunsetUtc = calcSolarTimeUtc(date, lat, lng, 90.833, false);
  if (sunriseUtc === null || sunsetUtc === null) {
    return null;
  }

  const sunrise = utcToDate(date, sunriseUtc);
  const sunset = utcToDate(date, sunsetUtc);

  const fajrAngle = RAMADAN_METHODS[method]?.fajrAngle ?? 18;
  const fajrUtc = calcSolarTimeUtc(date, lat, lng, 90 + fajrAngle, true);

  let suhoor = fajrUtc !== null ? utcToDate(date, fajrUtc) : null;

  if (!suhoor) {
    const tomorrow = new Date(date.getTime() + 86400000);
    const tomorrowSunriseUtc = calcSolarTimeUtc(tomorrow, lat, lng, 90.833, true);
    if (tomorrowSunriseUtc !== null) {
      const tomorrowSunrise = utcToDate(tomorrow, tomorrowSunriseUtc);
      const nightLengthHours = (tomorrowSunrise.getTime() - sunset.getTime()) / 3600000;
      const adjustmentHours = applyHighLatitudeRule(nightLengthHours, highLatitudeRule);
      suhoor = new Date(tomorrowSunrise.getTime() - adjustmentHours * 3600000);
    }
  }

  if (!suhoor) {
    return null;
  }

  return {
    date: date.toISOString().slice(0, 10),
    suhoor,
    iftar: sunset,
    method,
    highLatitudeRule,
  };
};

export const getDefaultMethodForLocation = (location?: RamadanLocation): RamadanMethod => {
  const country = location?.country?.toLowerCase() || '';
  const tz = location?.tz?.toLowerCase() || '';
  if (country.includes('saudi') || country.includes('bahrain') || country.includes('qatar') || country.includes('united arab emirates') || country.includes('kuwait') || country.includes('oman')) {
    return 'UmmAlQura';
  }
  if (country.includes('egypt')) return 'Egypt';
  if (country.includes('pakistan') || country.includes('bangladesh') || country.includes('india')) return 'Karachi';
  if (country.includes('united states') || country.includes('canada') || tz.includes('america/')) return 'ISNA';
  if (country.includes('morocco') || country.includes('algeria') || country.includes('tunisia') || country.includes('libya')) return 'MWL';
  return 'MWL';
};

export const getFastingTheme = (now: Date, timings?: RamadanTimings | null) => {
  if (!timings) return 'standard';
  const isDaylight = now >= timings.suhoor && now <= timings.iftar;
  return isDaylight ? 'daylight' : 'midnight';
};

export const getNextRamadanEvent = (now: Date, timings?: RamadanTimings | null) => {
  if (!timings) return null;
  if (now < timings.iftar) {
    return { label: 'Iftar', time: timings.iftar };
  }
  const nextDay = new Date(now.getTime() + 86400000);
  return { label: 'Suhoor', time: new Date(timings.suhoor.getTime() + 86400000) };
};

export const formatCountdown = (target: Date, now: Date) => {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return '00:00';
  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};
