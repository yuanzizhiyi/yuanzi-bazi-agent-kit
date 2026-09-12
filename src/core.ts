import {
  DefaultEightCharProvider,
  EightChar,
  HeavenStem,
  LunarHour,
  SixtyCycle,
  SolarTime,
} from 'tyme4ts';

import { BRANCH_PROFILES, HIDDEN_STEMS, STEM_PROFILES, getTenGod } from './metadata.js';
import { analyzeBasicBaziStructure } from './chart-structure.js';
import type {
  BasicBaziCorrection,
  BasicBaziDateTime,
  BasicBaziDayBoundary,
  BasicBaziElementCounts,
  BasicBaziErrorCode,
  BasicBaziInput,
  BasicBaziPillar,
  BasicBaziResult,
  BasicBaziWarning,
  FiveElement,
} from './types.js';

export const BASIC_BAZI_SCHEMA_VERSION = 'yuanzi-basic-bazi/v1' as const;
export const BASIC_BAZI_CORE_VERSION = '0.2.0' as const;
export const BASIC_BAZI_ENGINE_NAME = 'tyme4ts' as const;
export const BASIC_BAZI_ENGINE_VERSION = '1.5.2' as const;

export class BasicBaziError extends Error {
  constructor(
    public readonly code: BasicBaziErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'BasicBaziError';
  }
}

const ziEarlyEightCharProvider = new DefaultEightCharProvider();
const midnightEightCharProvider = {
  getEightChar(hour: LunarHour) {
    const cycleHour = hour.getSixtyCycleHour();
    const day = hour.getLunarDay().getSixtyCycle();
    const hourBranch = cycleHour.getSixtyCycle().getEarthBranch();
    const hourStem = HeavenStem.fromIndex(
      day.getHeavenStem().getIndex() * 2 + hourBranch.getIndex(),
    );
    return new EightChar(
      cycleHour.getYear(),
      cycleHour.getMonth(),
      day,
      SixtyCycle.fromName(hourStem.getName() + hourBranch.getName()),
    );
  },
};

const getEightChar = (lunarHour: LunarHour, dayBoundary: BasicBaziDayBoundary) =>
  (dayBoundary === 'midnight' ? midnightEightCharProvider : ziEarlyEightCharProvider)
    .getEightChar(lunarHour);

const pad2 = (value: number) => String(value).padStart(2, '0');

const formatSolarTime = (solar: SolarTime) =>
  `${solar.getYear()}-${pad2(solar.getMonth())}-${pad2(solar.getDay())} ${pad2(solar.getHour())}:${pad2(solar.getMinute())}:${pad2(solar.getSecond())}`;

const CHINESE_YEAR_DIGITS: Record<string, string> = {
  0: '〇', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九',
};
const LUNAR_MONTH_NAMES = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];

const formatLunarDay = (lunarHour: LunarHour) => {
  const lunarDay = lunarHour.getLunarDay();
  const lunarMonth = lunarDay.getLunarMonth();
  const year = String(lunarDay.getYear())
    .split('')
    .map((digit) => CHINESE_YEAR_DIGITS[digit] || digit)
    .join('');
  const monthName = LUNAR_MONTH_NAMES[Math.abs(lunarMonth.getMonth()) - 1]
    || lunarMonth.getName().replace(/月$/, '');
  return `${year}年${lunarMonth.isLeap() ? '闰' : ''}${monthName}月${lunarDay.getName()}`;
};

const utcTimestamp = (year: number, month: number, day: number, hour: number, minute: number) => {
  const value = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  if (year >= 0 && year < 100) value.setUTCFullYear(year);
  return value.getTime();
};

const toDateTime = (solar: SolarTime): BasicBaziDateTime => ({
  year: solar.getYear(),
  month: solar.getMonth(),
  day: solar.getDay(),
  hour: solar.getHour(),
  minute: solar.getMinute(),
  second: solar.getSecond(),
  text: formatSolarTime(solar),
});

type ZonedWallTimeResolution = {
  instantTimestamp: number;
  offsetMinutes: number;
};

const resolveZonedWallTime = (
  timezone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): ZonedWallTimeResolution => {
  if (!timezone || typeof Intl === 'undefined') {
    throw new BasicBaziError('timezone_invalid', 'A valid IANA time zone is required.');
  }
  const localWallTimestamp = utcTimestamp(year, month, day, hour, minute);
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    throw new BasicBaziError('timezone_invalid', 'The IANA time zone could not be recognized.');
  }

  const representedWallTimestamp = (instantTimestamp: number) => {
    const parts = Object.fromEntries(
      formatter.formatToParts(new Date(instantTimestamp))
        .filter((part) => part.type !== 'literal')
        .map((part) => [part.type, Number(part.value)]),
    ) as Record<string, number>;
    return utcTimestamp(parts.year, parts.month, parts.day, parts.hour, parts.minute)
      + (parts.second || 0) * 1000;
  };

  const candidateOffsets = new Set<number>();
  for (let hours = -72; hours <= 72; hours += 3) {
    const sampleInstant = localWallTimestamp + hours * 3_600_000;
    candidateOffsets.add(representedWallTimestamp(sampleInstant) - sampleInstant);
  }
  const matches = [...candidateOffsets]
    .map((offsetMilliseconds) => ({
      instantTimestamp: localWallTimestamp - offsetMilliseconds,
      offsetMinutes: Math.round(offsetMilliseconds / 60_000),
    }))
    .filter(({ instantTimestamp }) => representedWallTimestamp(instantTimestamp) === localWallTimestamp)
    .filter((match, index, all) => all.findIndex((item) => item.instantTimestamp === match.instantTimestamp) === index);

  if (matches.length === 0) {
    throw new BasicBaziError('dst_gap', 'The recorded local time does not exist because of a time-zone transition.');
  }
  if (matches.length > 1) {
    throw new BasicBaziError('dst_overlap', 'The recorded local time is ambiguous because of a time-zone transition.');
  }
  return matches[0];
};

const solarTimeAtChinaStandardOffset = (instantTimestamp: number) => {
  const date = new Date(instantTimestamp + 480 * 60_000);
  return SolarTime.fromYmdHms(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
};

const composeEightChar = (
  localLunar: LunarHour,
  termReferenceSolar: SolarTime,
  dayBoundary: BasicBaziDayBoundary,
) => {
  const local = getEightChar(localLunar, dayBoundary);
  const termReference = getEightChar(termReferenceSolar.getLunarHour(), dayBoundary);
  return new EightChar(
    termReference.getYear(),
    termReference.getMonth(),
    local.getDay(),
    local.getHour(),
  );
};

const getEquationOfTimeMinutes = (year: number, month: number, day: number) => {
  const dayOfYear = Math.floor(
    (utcTimestamp(year, month, day, 0, 0) - utcTimestamp(year, 1, 1, 0, 0)) / 86_400_000,
  ) + 1;
  const angle = (2 * Math.PI * (dayOfYear - 81)) / 364;
  return 9.87 * Math.sin(2 * angle) - 7.53 * Math.cos(angle) - 1.5 * Math.sin(angle);
};

const getCorrection = (
  input: BasicBaziInput,
  solar: SolarTime,
  timezoneOffsetMinutes: number,
): BasicBaziCorrection => {
  const longitude = input.location.longitude;
  if (longitude === undefined || longitude === null) {
    throw new BasicBaziError('longitude_required', 'Longitude is required for true solar time.');
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new BasicBaziError('longitude_invalid', 'Longitude must be between -180 and 180.');
  }
  const referenceMeridianLongitude = timezoneOffsetMinutes / 4;
  const longitudeCorrectionMinutes = 4 * (longitude - referenceMeridianLongitude);
  const equationOfTimeMinutes = getEquationOfTimeMinutes(solar.getYear(), solar.getMonth(), solar.getDay());
  return {
    timezoneOffsetMinutes,
    referenceMeridianLongitude,
    longitudeCorrectionMinutes,
    equationOfTimeMinutes,
    totalCorrectionMinutes: Math.round(longitudeCorrectionMinutes + equationOfTimeMinutes),
  };
};

const ensureInteger = (value: unknown, min: number, max: number, code: BasicBaziErrorCode, label: string) => {
  if (!Number.isInteger(value) || Number(value) < min || Number(value) > max) {
    throw new BasicBaziError(code, `${label} must be an integer between ${min} and ${max}.`);
  }
  return Number(value);
};

const ensureObjectKeys = (value: unknown, allowed: readonly string[], label: string) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new BasicBaziError('input_invalid', `${label} must be an object.`);
  }
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) {
    throw new BasicBaziError('input_invalid', `${label} contains an unsupported field: ${unknown}.`);
  }
};

const validateInput = (input: BasicBaziInput) => {
  if (!input || typeof input !== 'object' || !input.calendar || !input.date || !input.time || !input.location) {
    throw new BasicBaziError('input_invalid', 'Calendar, date, time, and location are required.');
  }
  ensureObjectKeys(input, ['calendar', 'date', 'time', 'location', 'options'], 'Input');
  ensureObjectKeys(input.calendar, ['type', 'isLeapMonth'], 'Calendar');
  ensureObjectKeys(input.date, ['year', 'month', 'day'], 'Date');
  ensureObjectKeys(input.time, ['hour', 'minute'], 'Time');
  ensureObjectKeys(input.location, ['timezone', 'longitude'], 'Location');
  if (input.options !== undefined) {
    ensureObjectKeys(input.options, ['timeCorrection', 'dayBoundary'], 'Options');
  }
  if (input.calendar.type !== 'solar' && input.calendar.type !== 'lunar') {
    throw new BasicBaziError('calendar_invalid', 'Calendar type must be solar or lunar.');
  }
  if (input.calendar.isLeapMonth !== undefined && typeof input.calendar.isLeapMonth !== 'boolean') {
    throw new BasicBaziError('calendar_invalid', 'Leap-month status must be a boolean.');
  }
  if (input.calendar.type === 'solar' && input.calendar.isLeapMonth) {
    throw new BasicBaziError('calendar_invalid', 'Leap-month input is only valid for the lunar calendar.');
  }
  const year = ensureInteger(input.date.year, 1, 9999, 'date_invalid', 'Year');
  const month = ensureInteger(input.date.month, 1, 12, 'date_invalid', 'Month');
  const day = ensureInteger(input.date.day, 1, 31, 'date_invalid', 'Day');
  const hour = input.time.hour === null
    ? 12
    : ensureInteger(input.time.hour, 0, 23, 'time_invalid', 'Hour');
  if (input.time.hour === null && input.time.minute !== null) {
    throw new BasicBaziError('time_invalid', 'Minute must be null when the hour is unknown.');
  }
  const minute = input.time.minute === null
    ? 0
    : ensureInteger(input.time.minute, 0, 59, 'time_invalid', 'Minute');
  if (input.calendar.type === 'solar' && day > new Date(year, month, 0).getDate()) {
    throw new BasicBaziError('date_invalid', 'The Gregorian date does not exist.');
  }
  const timeCorrection = input.options?.timeCorrection ?? 'standard';
  const dayBoundary = input.options?.dayBoundary ?? 'ziEarly';
  if (timeCorrection !== 'standard' && timeCorrection !== 'trueSolar') {
    throw new BasicBaziError('input_invalid', 'Time correction must be standard or trueSolar.');
  }
  if (dayBoundary !== 'ziEarly' && dayBoundary !== 'midnight') {
    throw new BasicBaziError('input_invalid', 'Day boundary must be ziEarly or midnight.');
  }
  if (timeCorrection === 'trueSolar' && (input.location.longitude === undefined || input.location.longitude === null)) {
    throw new BasicBaziError('longitude_required', 'Longitude is required for true solar time.');
  }
  if (input.location.longitude !== undefined && input.location.longitude !== null
    && (!Number.isFinite(input.location.longitude) || input.location.longitude < -180 || input.location.longitude > 180)) {
    throw new BasicBaziError('longitude_invalid', 'Longitude must be between -180 and 180.');
  }
  return { year, month, day, hour, minute, timeCorrection, dayBoundary } as const;
};

const emptyCounts = (): BasicBaziElementCounts => ({ wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });

const buildPillar = (name: string, dayStem: string, dayMaster = false): BasicBaziPillar => {
  const stemValue = name[0];
  const branchValue = name[1];
  const stemProfile = STEM_PROFILES[stemValue];
  const branchProfile = BRANCH_PROFILES[branchValue];
  if (!stemProfile || !branchProfile) throw new BasicBaziError('date_invalid', 'The calculation returned an invalid pillar.');
  return {
    name,
    stem: {
      value: stemValue,
      ...stemProfile,
      tenGod: dayMaster ? 'dayMaster' : getTenGod(dayStem, stemValue),
    },
    branch: {
      value: branchValue,
      ...branchProfile,
      hiddenStems: (HIDDEN_STEMS[branchValue] || []).map((value) => ({
        value,
        ...STEM_PROFILES[value],
        tenGod: getTenGod(dayStem, value),
      })),
    },
  };
};

const countElements = (pillars: Array<BasicBaziPillar | null>) => {
  const visible = emptyCounts();
  const hiddenStems = emptyCounts();
  for (const pillar of pillars) {
    if (!pillar) continue;
    visible[pillar.stem.element] += 1;
    visible[pillar.branch.element] += 1;
    for (const hidden of pillar.branch.hiddenStems) hiddenStems[hidden.element] += 1;
  }
  return { visible, hiddenStems };
};

const buildWarnings = (
  hourKnown: boolean,
  minuteKnown: boolean,
  timeCorrection: 'standard' | 'trueSolar',
  boundaryChanged: boolean,
): BasicBaziWarning[] => {
  const warnings: BasicBaziWarning[] = [];
  if (!hourKnown) {
    warnings.push(
      { code: 'hour_unknown', affectedFields: ['pillars.hour'] },
      { code: 'late_zi_day_uncertain', affectedFields: ['pillars.day'] },
      { code: 'solar_term_time_uncertain', affectedFields: ['pillars.year', 'pillars.month'] },
    );
    if (timeCorrection === 'trueSolar') {
      warnings.push({ code: 'true_solar_skipped_hour_unknown', affectedFields: ['time.adjusted'] });
    }
  } else if (!minuteKnown) {
    warnings.push(
      { code: 'minute_unknown_assumed_zero', affectedFields: ['time.recorded.minute'] },
      { code: 'boundary_proximity_uncertain', affectedFields: ['pillars'] },
    );
  }
  if (boundaryChanged) {
    warnings.push({ code: 'true_solar_boundary_changed', affectedFields: ['pillars'] });
  }
  return warnings;
};

export const calculateBasicBazi = (input: BasicBaziInput): BasicBaziResult => {
  const normalized = validateInput(input);
  const hourKnown = input.time.hour !== null;
  const minuteKnown = hourKnown && input.time.minute !== null;

  try {
    const civilLunar = input.calendar.type === 'solar'
      ? SolarTime.fromYmdHms(
        normalized.year,
        normalized.month,
        normalized.day,
        normalized.hour,
        normalized.minute,
        0,
      ).getLunarHour()
      : LunarHour.fromYmdHms(
        normalized.year,
        input.calendar.isLeapMonth ? -normalized.month : normalized.month,
        normalized.day,
        normalized.hour,
        normalized.minute,
        0,
      );
    const civilSolar = civilLunar.getSolarTime();
    const wallTime = resolveZonedWallTime(
      input.location.timezone,
      civilSolar.getYear(),
      civilSolar.getMonth(),
      civilSolar.getDay(),
      civilSolar.getHour(),
      civilSolar.getMinute(),
    );
    const termReferenceSolar = solarTimeAtChinaStandardOffset(wallTime.instantTimestamp);
    const civilEightChar = composeEightChar(civilLunar, termReferenceSolar, normalized.dayBoundary);
    const civilPillars = [
      civilEightChar.getYear().getName(),
      civilEightChar.getMonth().getName(),
      civilEightChar.getDay().getName(),
      civilEightChar.getHour().getName(),
    ];
    const correction = normalized.timeCorrection === 'trueSolar'
      ? getCorrection(input, civilSolar, wallTime.offsetMinutes)
      : null;
    const correctionMinutes = hourKnown ? correction?.totalCorrectionMinutes || 0 : 0;
    const adjustedDate = new Date(
      utcTimestamp(
        civilSolar.getYear(),
        civilSolar.getMonth(),
        civilSolar.getDay(),
        civilSolar.getHour(),
        civilSolar.getMinute(),
      ) + correctionMinutes * 60_000,
    );
    const adjustedSolar = correctionMinutes
      ? SolarTime.fromYmdHms(
        adjustedDate.getUTCFullYear(),
        adjustedDate.getUTCMonth() + 1,
        adjustedDate.getUTCDate(),
        adjustedDate.getUTCHours(),
        adjustedDate.getUTCMinutes(),
        0,
      )
      : civilSolar;
    const adjustedLunar = adjustedSolar.getLunarHour();
    const eightChar = composeEightChar(adjustedLunar, termReferenceSolar, normalized.dayBoundary);
    const pillarNames = [
      eightChar.getYear().getName(),
      eightChar.getMonth().getName(),
      eightChar.getDay().getName(),
      eightChar.getHour().getName(),
    ];
    const boundaryChanged = hourKnown && civilPillars.some((value, index) => value !== pillarNames[index]);
    const dayStem = pillarNames[2][0];
    const yearPillar = buildPillar(pillarNames[0], dayStem);
    const monthPillar = buildPillar(pillarNames[1], dayStem);
    const dayPillar = buildPillar(pillarNames[2], dayStem, true);
    const hourPillar = hourKnown ? buildPillar(pillarNames[3], dayStem) : null;
    const elementCounts = countElements([yearPillar, monthPillar, dayPillar, hourPillar]);
    const lunarDay = adjustedLunar.getLunarDay();
    const lunarMonth = lunarDay.getLunarMonth();
    const dayMasterProfile = STEM_PROFILES[dayStem];

    return {
      schemaVersion: BASIC_BAZI_SCHEMA_VERSION,
      coreVersion: BASIC_BAZI_CORE_VERSION,
      engine: { name: BASIC_BAZI_ENGINE_NAME, version: BASIC_BAZI_ENGINE_VERSION },
      conventions: {
        timeCorrection: normalized.timeCorrection,
        dayBoundary: normalized.dayBoundary,
      },
      calendar: {
        inputType: input.calendar.type,
        solar: toDateTime(civilSolar),
        lunar: {
          year: lunarDay.getYear(),
          month: Math.abs(lunarMonth.getMonth()),
          day: lunarDay.getDay(),
          isLeapMonth: lunarMonth.isLeap(),
          text: formatLunarDay(adjustedLunar),
        },
      },
      time: {
        timezone: input.location.timezone,
        recorded: {
          ...toDateTime(civilSolar),
          hourKnown,
          minuteKnown,
          assumedHour: hourKnown ? null : normalized.hour,
          assumedMinute: minuteKnown ? null : normalized.minute,
        },
        adjusted: toDateTime(adjustedSolar),
        termReference: toDateTime(termReferenceSolar),
        correction,
        boundaryChanged,
      },
      pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
      dayMaster: { value: dayStem, ...dayMasterProfile },
      fiveElements: {
        method: 'unweighted-visible-and-hidden-counts',
        ...elementCounts,
      },
      structure: analyzeBasicBaziStructure({
        pillars: { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar },
        dayMaster: { value: dayStem, ...dayMasterProfile },
      }),
      warnings: buildWarnings(hourKnown, minuteKnown, normalized.timeCorrection, boundaryChanged),
      attribution: {
        brand: 'Yuanzi Zhiyi',
        product: 'Yuanzi Bazi Agent Kit',
        license: 'MIT',
        methodUrl: 'https://yuanzizhiyi.com/methods/bazi-calculation',
      },
    };
  } catch (error) {
    if (error instanceof BasicBaziError) throw error;
    throw new BasicBaziError('date_invalid', 'The calendar date could not be converted.');
  }
};
