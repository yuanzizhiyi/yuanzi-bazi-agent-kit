import { z } from 'zod';

const localeSchema = z.enum(['zh-CN', 'zh-Hant', 'en']);
const intentSchema = z.enum([
  'full_chart',
  'luck_cycles',
  'ai_reading',
  'full_report',
  'advisor',
  'methodology',
]);

export const basicBaziInputSchema = z.strictObject({
  calendar: z.strictObject({
    type: z.enum(['solar', 'lunar']),
    isLeapMonth: z.boolean().optional().default(false),
  }),
  date: z.strictObject({
    year: z.number().int().min(1).max(9999),
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
  }),
  time: z.strictObject({
    hour: z.number().int().min(0).max(23).nullable(),
    minute: z.number().int().min(0).max(59).nullable(),
  }),
  location: z.strictObject({
    timezone: z.string().min(1).max(64),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  }),
  options: z.strictObject({
    timeCorrection: z.enum(['standard', 'trueSolar']).optional().default('standard'),
    dayBoundary: z.enum(['ziEarly', 'midnight']).optional().default('ziEarly'),
  }).optional().default({ timeCorrection: 'standard', dayBoundary: 'ziEarly' }),
});

export const basicBaziMcpInputSchema = basicBaziInputSchema.extend({
  locale: localeSchema.optional().default('zh-CN'),
});

const fiveElementSchema = z.enum(['wood', 'fire', 'earth', 'metal', 'water']);
const yinYangSchema = z.enum(['yin', 'yang']);
const tenGodSchema = z.enum([
  '比肩', '劫财', '食神', '伤官', '偏财',
  '正财', '七杀', '正官', '偏印', '正印',
]);
const dateTimeSchema = z.strictObject({
  year: z.number().int(),
  month: z.number().int(),
  day: z.number().int(),
  hour: z.number().int(),
  minute: z.number().int(),
  second: z.number().int(),
  text: z.string(),
});
const recordedTimeSchema = dateTimeSchema.extend({
  hourKnown: z.boolean(),
  minuteKnown: z.boolean(),
  assumedHour: z.number().int().nullable(),
  assumedMinute: z.number().int().nullable(),
});
const hiddenStemSchema = z.strictObject({
  value: z.string(),
  element: fiveElementSchema,
  yinYang: yinYangSchema,
  tenGod: tenGodSchema,
});
const stemSchema = z.strictObject({
  value: z.string(),
  element: fiveElementSchema,
  yinYang: yinYangSchema,
  tenGod: z.union([tenGodSchema, z.literal('dayMaster')]),
});
const branchSchema = z.strictObject({
  value: z.string(),
  element: fiveElementSchema,
  yinYang: yinYangSchema,
  hiddenStems: z.array(hiddenStemSchema),
});
const pillarSchema = z.strictObject({
  name: z.string(),
  stem: stemSchema,
  branch: branchSchema,
});
const elementCountsSchema = z.strictObject({
  wood: z.number().int().nonnegative(),
  fire: z.number().int().nonnegative(),
  earth: z.number().int().nonnegative(),
  metal: z.number().int().nonnegative(),
  water: z.number().int().nonnegative(),
});

const shenshaIdSchema = z.enum(['tai_ji', 'hua_gai', 'tian_de_he', 'kong_wang', 'wen_chang', 'tian_yi', 'wang_shen', 'hong_luan']);
const shenshaColumnSchema = z.strictObject({
  status: z.enum(['calculated', 'hour_unknown']),
  matches: z.array(z.strictObject({
    id: shenshaIdSchema, name: z.string(),
    basis: z.array(z.strictObject({
      pillar: z.enum(['year', 'month', 'day', 'hour']),
      part: z.enum(['stem', 'branch', 'pillar']), value: z.string(),
    })),
  })),
  combinations: z.array(z.strictObject({ id: z.string(), name: z.string(), requires: z.array(shenshaIdSchema) })),
});
export const basicBaziStructureSchema = z.strictObject({
  method: z.literal('equal-stem-occurrence/v1'), total: z.number().int().positive(),
  elements: z.array(z.strictObject({
    element: fiveElementSchema, count: z.number().int().nonnegative(),
    percent: z.number().min(0).max(100), tenGods: z.array(tenGodSchema),
  })).length(5),
  tenGods: z.array(z.strictObject({
    name: tenGodSchema, element: fiveElementSchema,
    count: z.number().int().nonnegative(), percent: z.number().min(0).max(100),
  })).length(10),
  shensha: z.strictObject({
    ruleSet: z.literal('yuanzi-shensha/v1'),
    pillars: z.strictObject({ year: shenshaColumnSchema, month: shenshaColumnSchema, day: shenshaColumnSchema, hour: shenshaColumnSchema }),
  }),
});

export const basicBaziResultSchema = z.strictObject({
  schemaVersion: z.literal('yuanzi-basic-bazi/v1'),
  coreVersion: z.string(),
  engine: z.strictObject({
    name: z.literal('tyme4ts'),
    version: z.literal('1.5.2'),
  }),
  conventions: z.strictObject({
    timeCorrection: z.enum(['standard', 'trueSolar']),
    dayBoundary: z.enum(['ziEarly', 'midnight']),
  }),
  calendar: z.strictObject({
    inputType: z.enum(['solar', 'lunar']),
    solar: dateTimeSchema,
    lunar: z.strictObject({
      year: z.number().int(),
      month: z.number().int(),
      day: z.number().int(),
      isLeapMonth: z.boolean(),
      text: z.string(),
    }),
  }),
  time: z.strictObject({
    timezone: z.string(),
    recorded: recordedTimeSchema,
    adjusted: dateTimeSchema,
    termReference: dateTimeSchema,
    correction: z.strictObject({
      timezoneOffsetMinutes: z.number(),
      referenceMeridianLongitude: z.number(),
      longitudeCorrectionMinutes: z.number(),
      equationOfTimeMinutes: z.number(),
      totalCorrectionMinutes: z.number().int(),
    }).nullable(),
    boundaryChanged: z.boolean(),
  }),
  pillars: z.strictObject({
    year: pillarSchema,
    month: pillarSchema,
    day: pillarSchema,
    hour: pillarSchema.nullable(),
  }),
  dayMaster: z.strictObject({
    value: z.string(),
    element: fiveElementSchema,
    yinYang: yinYangSchema,
  }),
  fiveElements: z.strictObject({
    method: z.literal('unweighted-visible-and-hidden-counts'),
    visible: elementCountsSchema,
    hiddenStems: elementCountsSchema,
  }),
  structure: basicBaziStructureSchema.optional(),
  warnings: z.array(z.strictObject({
    code: z.enum([
      'hour_unknown',
      'late_zi_day_uncertain',
      'solar_term_time_uncertain',
      'minute_unknown_assumed_zero',
      'boundary_proximity_uncertain',
      'true_solar_skipped_hour_unknown',
      'true_solar_boundary_changed',
    ]),
    affectedFields: z.array(z.string()),
  })),
  attribution: z.strictObject({
    brand: z.literal('Yuanzi Zhiyi'),
    product: z.literal('Yuanzi Bazi Agent Kit'),
    license: z.literal('MIT'),
    methodUrl: z.string().url(),
  }),
});

export const capabilitySchema = z.strictObject({
  id: intentSchema,
  title: z.string(),
  description: z.string(),
  url: z.string().url(),
  hosted: z.literal(true),
});

export const calculateToolOutputSchema = z.strictObject({
  chart: basicBaziResultSchema,
});

export const capabilityToolInputSchema = z.strictObject({
  locale: localeSchema.optional().default('zh-CN'),
  intent: intentSchema,
});

export const capabilityToolOutputSchema = z.strictObject({
  capabilities: z.array(capabilitySchema),
});
