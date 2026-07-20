const cityData = {
  杭州: [['西湖', '断桥残雪'], ['灵隐寺', '法喜寺'], ['龙井村', '九溪烟树']],
  上海: [['外滩', '南京东路'], ['武康路', '安福路'], ['陆家嘴', '浦东美术馆']],
  成都: [['宽窄巷子', '人民公园'], ['成都大熊猫繁育研究基地', '东郊记忆'], ['武侯祠', '锦里']],
  北京: [['天安门广场', '故宫博物院'], ['颐和园', '圆明园'], ['慕田峪长城', '鸟巢']],
  厦门: [['鼓浪屿', '中山路'], ['沙坡尾', '演武大桥'], ['环岛路', '曾厝垵']],
  西安: [['西安城墙', '钟鼓楼'], ['秦始皇帝陵博物院', '华清宫'], ['陕西历史博物馆', '大雁塔']]
};

function parseIntent(message, previousPlan) {
  const previous = previousPlan?.intent;
  const destination = Object.keys(cityData).find(city => message.includes(city)) || previous?.destination || '杭州';
  const chineseDays = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };
  const dayMatch = message.match(/([1-9一二两三四五六七])\s*天/);
  const days = dayMatch ? Number(dayMatch[1]) || chineseDays[dayMatch[1]] : previous?.days || 3;
  const travelers = /爸妈|父母|老人/.test(message) ? '家庭出行' : /孩子|亲子|小朋友/.test(message) ? '亲子出行' : /情侣|女友|男友/.test(message) ? '情侣出行' : previous?.travelers || '休闲出行';
  const preferences = /美食|吃|餐厅/.test(message) ? ['美食', '城市漫游'] : /自然|山|湖/.test(message) ? ['自然风光', '轻松慢游'] : /历史|博物馆|文化/.test(message) ? ['人文历史', '经典景点'] : previous?.preferences || ['经典景点', '轻松慢游'];
  const pace = /轻松|不要太赶|老人|爸妈/.test(message) ? '轻松' : /紧凑|多去/.test(message) ? '紧凑' : previous?.pace || '适中';
  return { destination, origin: previous?.origin || '', days: Math.min(7, days), travelers, preferences, budget: previous?.budget || '中等', pace, missingInformation: ['出发日期', '具体预算'] };
}

export async function generateMockPlan(message, previousPlan) {
  await new Promise(resolve => setTimeout(resolve, 650));
  const intent = parseIntent(message, previousPlan);
  const routes = cityData[intent.destination];
  const days = Array.from({ length: intent.days }, (_, index) => {
    const stops = routes[index % routes.length];
    return {
      day: index + 1, title: index === 0 ? `初见${intent.destination}` : `${intent.destination}深度体验`, date: '',
      transport: intent.pace === '轻松' ? '地铁／打车结合，减少步行' : '公共交通 + 步行', estimatedCostCny: 260 + index * 80,
      stops: stops.map((name, stopIndex) => ({ name, reason: stopIndex ? '与上一站距离较近，动线顺路' : '当地具有代表性的目的地', durationMinutes: intent.pace === '轻松' ? 150 : 120, category: '景点' })),
      tips: [intent.pace === '轻松' ? '下午安排了休息时间，可根据体力灵活调整。' : '建议提前核验开放时间和预约规则。']
    };
  });
  return {
    intent, title: `${intent.destination}${intent.days}日${intent.preferences[0]}之旅`,
    summary: `根据你的需求生成了${intent.days}天${intent.pace}节奏行程，各天景点尽量就近组合。`, bestSeasonNote: '出发前请查看当地实时天气。', days,
    services: [
      { type: '住宿', title: `${intent.destination}交通便利住宿`, reason: '靠近主要交通站点，减少换乘时间', searchKeyword: `${intent.destination} 地铁附近酒店`, priceHint: '以平台实时价格为准', bookingAdvice: '可免费取消的房型更灵活' },
      { type: '门票', title: '热门景点预约', reason: '避免到场后无法入园', searchKeyword: `${intent.destination} 景点预约`, priceHint: '提前预约', bookingAdvice: '以景区官方通知为准' },
      { type: '用车', title: '接送站服务', reason: '携带行李时更方便', searchKeyword: `${intent.destination} 接送站`, priceHint: '比价后下单', bookingAdvice: '确认车型和取消规则' },
      { type: '餐饮', title: `${intent.destination}本地风味`, reason: '结合每日游览区域就近用餐', searchKeyword: `${intent.destination} 当地美食`, priceHint: '错峰少排队', bookingAdvice: '热门餐厅建议提前取号' }
    ], cautions: ['当前为功能测试数据，营业时间、价格和库存请在真实平台核验。']
  };
}
