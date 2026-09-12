export type BasicBaziCalendarType = 'solar' | 'lunar';
export type BasicBaziTimeCorrection = 'standard' | 'trueSolar';
export type BasicBaziDayBoundary = 'ziEarly' | 'midnight';
export type BasicBaziLocale = 'zh-CN' | 'zh-Hant' | 'en';
export type BasicBaziSource = 'webmcp' | 'mcp' | 'skill' | 'cli';
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type YinYang = 'yin' | 'yang';
export type TenGod =
  | '比肩'
  | '劫财'
  | '食神'
  | '伤官'
  | '偏财'
  | '正财'
  | '七杀'
  | '正官'
  | '偏印'
  | '正印';

export type BasicBaziWarningCode =
  | 'hour_unknown'
  | 'late_zi_day_uncertain'
  | 'solar_term_time_uncertain'
  | 'minute_unknown_assumed_zero'
  | 'boundary_proximity_uncertain'
  | 'true_solar_skipped_hour_unknown'
  | 'true_solar_boundary_changed';

export type BasicBaziErrorCode =
  | 'input_invalid'
  | 'calendar_invalid'
  | 'date_invalid'
  | 'time_invalid'
  | 'timezone_invalid'
  | 'dst_gap'
  | 'dst_overlap'
  | 'longitude_invalid'
  | 'longitude_required';

export type BasicBaziInput = {
  calendar: {
    type: BasicBaziCalendarType;
    isLeapMonth?: boolean;
  };
  date: {
    year: number;
    month: number;
    day: number;
  };
  time: {
    hour: number | null;
    minute: number | null;
  };
  location: {
    timezone: string;
    longitude?: number | null;
  };
  options?: {
    timeCorrection?: BasicBaziTimeCorrection;
    dayBoundary?: BasicBaziDayBoundary;
  };
};

export type BasicBaziDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  text: string;
};

export type BasicBaziRecordedTime = BasicBaziDateTime & {
  hourKnown: boolean;
  minuteKnown: boolean;
  assumedHour: number | null;
  assumedMinute: number | null;
};

export type BasicBaziStem = {
  value: string;
  element: FiveElement;
  yinYang: YinYang;
  tenGod: TenGod | 'dayMaster';
};

export type BasicBaziHiddenStem = {
  value: string;
  element: FiveElement;
  yinYang: YinYang;
  tenGod: TenGod;
};

export type BasicBaziBranch = {
  value: string;
  element: FiveElement;
  yinYang: YinYang;
  hiddenStems: BasicBaziHiddenStem[];
};

export type BasicBaziPillar = {
  name: string;
  stem: BasicBaziStem;
  branch: BasicBaziBranch;
};

export type BasicBaziWarning = {
  code: BasicBaziWarningCode;
  affectedFields: string[];
};

export type BasicBaziCorrection = {
  timezoneOffsetMinutes: number;
  referenceMeridianLongitude: number;
  longitudeCorrectionMinutes: number;
  equationOfTimeMinutes: number;
  totalCorrectionMinutes: number;
};

export type BasicBaziElementCounts = Record<FiveElement, number>;

export type BaziPillarKey = 'year' | 'month' | 'day' | 'hour';
export type BaziShenshaId = 'tai_ji' | 'hua_gai' | 'tian_de_he' | 'kong_wang'
  | 'wen_chang' | 'tian_yi' | 'wang_shen' | 'hong_luan';
export type BaziShenshaMatch = {
  id: BaziShenshaId;
  name: string;
  basis: Array<{ pillar: BaziPillarKey; part: 'stem' | 'branch' | 'pillar'; value: string }>;
};
export type BaziShenshaColumn = {
  status: 'calculated' | 'hour_unknown';
  matches: BaziShenshaMatch[];
  combinations: Array<{ id: string; name: string; requires: BaziShenshaId[] }>;
};
export type BasicBaziStructure = {
  method: 'equal-stem-occurrence/v1';
  total: number;
  elements: Array<{ element: FiveElement; count: number; percent: number; tenGods: TenGod[] }>;
  tenGods: Array<{ name: TenGod; element: FiveElement; count: number; percent: number }>;
  shensha: {
    ruleSet: 'yuanzi-shensha/v1';
    pillars: Record<BaziPillarKey, BaziShenshaColumn>;
  };
};

export type BasicBaziResult = {
  schemaVersion: 'yuanzi-basic-bazi/v1';
  coreVersion: string;
  engine: {
    name: 'tyme4ts';
    version: '1.5.2';
  };
  conventions: {
    timeCorrection: BasicBaziTimeCorrection;
    dayBoundary: BasicBaziDayBoundary;
  };
  calendar: {
    inputType: BasicBaziCalendarType;
    solar: BasicBaziDateTime;
    lunar: {
      year: number;
      month: number;
      day: number;
      isLeapMonth: boolean;
      text: string;
    };
  };
  time: {
    timezone: string;
    recorded: BasicBaziRecordedTime;
    adjusted: BasicBaziDateTime;
    termReference: BasicBaziDateTime;
    correction: BasicBaziCorrection | null;
    boundaryChanged: boolean;
  };
  pillars: {
    year: BasicBaziPillar;
    month: BasicBaziPillar;
    day: BasicBaziPillar;
    hour: BasicBaziPillar | null;
  };
  dayMaster: {
    value: string;
    element: FiveElement;
    yinYang: YinYang;
  };
  fiveElements: {
    method: 'unweighted-visible-and-hidden-counts';
    visible: BasicBaziElementCounts;
    hiddenStems: BasicBaziElementCounts;
  };
  /** Additive v1 extension. Older saved charts may omit it. Counts are not strength. */
  structure?: BasicBaziStructure;
  warnings: BasicBaziWarning[];
  attribution: {
    brand: 'Yuanzi Zhiyi';
    product: 'Yuanzi Bazi Agent Kit';
    license: 'MIT';
    methodUrl: 'https://yuanzizhiyi.com/methods/bazi-calculation';
  };
};

export type BaziCapabilityIntent =
  | 'full_chart'
  | 'luck_cycles'
  | 'ai_reading'
  | 'full_report'
  | 'advisor'
  | 'methodology';

export type BaziCapability = {
  id: BaziCapabilityIntent;
  title: string;
  description: string;
  url: string;
  hosted: true;
};
