export const BASIC_BAZI_TOOL_INPUT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    calendar: {
      type: 'object',
      additionalProperties: false,
      properties: {
        type: { type: 'string', enum: ['solar', 'lunar'] },
        isLeapMonth: { type: 'boolean', default: false },
      },
      required: ['type'],
    },
    date: {
      type: 'object',
      additionalProperties: false,
      properties: {
        year: { type: 'integer', minimum: 1, maximum: 9999 },
        month: { type: 'integer', minimum: 1, maximum: 12 },
        day: { type: 'integer', minimum: 1, maximum: 31 },
      },
      required: ['year', 'month', 'day'],
    },
    time: {
      type: 'object',
      additionalProperties: false,
      properties: {
        hour: { anyOf: [{ type: 'integer', minimum: 0, maximum: 23 }, { type: 'null' }] },
        minute: { anyOf: [{ type: 'integer', minimum: 0, maximum: 59 }, { type: 'null' }] },
      },
      required: ['hour', 'minute'],
    },
    location: {
      type: 'object',
      additionalProperties: false,
      properties: {
        timezone: { type: 'string', minLength: 1, maxLength: 64 },
        longitude: { anyOf: [{ type: 'number', minimum: -180, maximum: 180 }, { type: 'null' }] },
      },
      required: ['timezone'],
    },
    options: {
      type: 'object',
      additionalProperties: false,
      properties: {
        timeCorrection: { type: 'string', enum: ['standard', 'trueSolar'], default: 'standard' },
        dayBoundary: { type: 'string', enum: ['ziEarly', 'midnight'], default: 'ziEarly' },
      },
    },
    locale: { type: 'string', enum: ['zh-CN', 'zh-Hant', 'en'], default: 'zh-CN' },
  },
  required: ['calendar', 'date', 'time', 'location'],
} as const;

export const BAZI_CAPABILITY_TOOL_INPUT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    locale: { type: 'string', enum: ['zh-CN', 'zh-Hant', 'en'] },
    intent: {
      type: 'string',
      enum: ['full_chart', 'luck_cycles', 'ai_reading', 'full_report', 'advisor', 'methodology'],
    },
  },
  required: ['intent'],
} as const;
