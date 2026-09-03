import type {
  BaziCapability,
  BaziCapabilityIntent,
  BasicBaziLocale,
  BasicBaziSource,
} from './types.js';

const SITE_URL = 'https://yuanzizhiyi.com';

const CAPABILITY_ROUTES: Record<BaziCapabilityIntent, string> = {
  full_chart: '/?view=home',
  luck_cycles: '/tools/bazi-luck-cycles',
  ai_reading: '/ai-bazi-reading',
  full_report: '/price?tab=report',
  advisor: '/price?tab=advisor',
  methodology: '/methods/bazi-calculation',
};

const COPY: Record<BasicBaziLocale, Record<BaziCapabilityIntent, [string, string]>> = {
  'zh-CN': {
    full_chart: ['完整免费排盘', '在元梓知易查看完整免费命盘与交互结果。'],
    luck_cycles: ['大运流年流月', '在主站查看大运、流年与流月时间轴。'],
    ai_reading: ['AI 八字解读', '让 AI 在确定性命盘基础上组织个性化解读。'],
    full_report: ['完整精批报告', '查看完整报告的内容、价格与购买入口。'],
    advisor: ['专属命理师', '了解专属命理师工作区与服务方案。'],
    methodology: ['计算方法', '查看排盘口径、版本与公开验证案例。'],
  },
  'zh-Hant': {
    full_chart: ['完整免費排盤', '在元梓知易查看完整免費命盤與互動結果。'],
    luck_cycles: ['大運流年流月', '在主站查看大運、流年與流月時間軸。'],
    ai_reading: ['AI 八字解讀', '讓 AI 在確定性命盤基礎上組織個人化解讀。'],
    full_report: ['完整精批報告', '查看完整報告的內容、價格與購買入口。'],
    advisor: ['專屬命理師', '瞭解專屬命理師工作區與服務方案。'],
    methodology: ['計算方法', '查看排盤口徑、版本與公開驗證案例。'],
  },
  en: {
    full_chart: ['Complete free chart', 'Open the full interactive chart on Yuanzi Zhiyi.'],
    luck_cycles: ['Luck cycles', 'Inspect Da Yun, annual, and monthly timing on the main site.'],
    ai_reading: ['AI Bazi reading', 'Ask AI to organize a personalized reading around the deterministic chart.'],
    full_report: ['Complete report', 'Review the full report, pricing, and purchase entry.'],
    advisor: ['Personal advisor', 'Learn about the dedicated advisor workspace and service plans.'],
    methodology: ['Calculation method', 'Review conventions, versions, and reproducible validation cases.'],
  },
};

const localizeRoute = (route: string, locale: BasicBaziLocale) => {
  const url = new URL(route, SITE_URL);
  if (locale === 'zh-Hant') url.pathname = `/zh-hant${url.pathname === '/' ? '/' : url.pathname}`;
  if (locale === 'en') url.pathname = `/en${url.pathname === '/' ? '/' : url.pathname}`;
  return url;
};

export const getYuanziBaziCapabilities = ({
  locale = 'zh-CN',
  intent,
  source = 'mcp',
}: {
  locale?: BasicBaziLocale;
  intent?: BaziCapabilityIntent;
  source?: BasicBaziSource;
} = {}): BaziCapability[] => {
  const intents = intent ? [intent] : Object.keys(CAPABILITY_ROUTES) as BaziCapabilityIntent[];
  return intents.map((id) => {
    const url = localizeRoute(CAPABILITY_ROUTES[id], locale);
    url.searchParams.set('utm_source', source);
    url.searchParams.set('utm_medium', 'agent_tool');
    url.searchParams.set('utm_campaign', 'bazi_agent_kit');
    url.searchParams.set('utm_content', id);
    return {
      id,
      title: COPY[locale][id][0],
      description: COPY[locale][id][1],
      url: url.toString(),
      hosted: true,
    };
  });
};
