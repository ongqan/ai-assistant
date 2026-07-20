const $ = selector => document.querySelector(selector);
const state = { sessionId: null, plan: null };
const serviceIcons = { 住宿: '🏨', 门票: '🎫', 用车: '🚕', 餐饮: '🍜', 保险: '🛡️', 其他: '✨' };
const staticDemo = location.hostname.endsWith('github.io') || location.protocol === 'file:';

const demoCities = {
  杭州: [['西湖', '断桥残雪'], ['灵隐寺', '法喜寺'], ['龙井村', '九溪烟树']],
  上海: [['外滩', '南京东路'], ['武康路', '安福路'], ['陆家嘴', '浦东美术馆']],
  成都: [['宽窄巷子', '人民公园'], ['成都大熊猫繁育研究基地', '东郊记忆'], ['武侯祠', '锦里']],
  北京: [['天安门广场', '故宫博物院'], ['颐和园', '圆明园'], ['慕田峪长城', '鸟巢']],
  厦门: [['鼓浪屿', '中山路'], ['沙坡尾', '演武大桥'], ['环岛路', '曾厝垵']],
  西安: [['西安城墙', '钟鼓楼'], ['秦始皇帝陵博物院', '华清宫'], ['陕西历史博物馆', '大雁塔']]
};

function createBrowserDemoPlan(message, previous) {
  const destination = Object.keys(demoCities).find(city => message.includes(city)) || previous?.intent.destination || '杭州';
  const chineseDays = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7 };
  const match = message.match(/([1-9一二两三四五六七])\s*天/);
  const daysCount = Math.min(7, match ? Number(match[1]) || chineseDays[match[1]] : previous?.intent.days || 3);
  const travelers = /爸妈|父母|老人/.test(message) ? '家庭出行' : /孩子|亲子/.test(message) ? '亲子出行' : /情侣/.test(message) ? '情侣出行' : previous?.intent.travelers || '休闲出行';
  const preferences = /美食|吃/.test(message) ? ['美食', '城市漫游'] : /自然|山|湖/.test(message) ? ['自然风光', '轻松慢游'] : previous?.intent.preferences || ['经典景点', '轻松慢游'];
  const pace = /轻松|不要太赶|爸妈|老人/.test(message) ? '轻松' : previous?.intent.pace || '适中';
  const intent = { destination, origin: '', days: daysCount, travelers, preferences, budget: '中等', pace, missingInformation: ['出发日期'] };
  const days = Array.from({ length: daysCount }, (_, index) => ({
    day: index + 1, title: index ? `${destination}深度体验` : `初见${destination}`, date: '',
    transport: pace === '轻松' ? '地铁／打车结合，减少步行' : '公共交通 + 步行', estimatedCostCny: 260 + index * 80,
    stops: demoCities[destination][index % 3].map(name => ({ name, reason: '顺路安排的代表性目的地', durationMinutes: 120, category: '景点' })),
    tips: [pace === '轻松' ? '下午预留休息时间，可按体力调整。' : '出发前请核验预约规则。']
  }));
  return { intent, title: `${destination}${daysCount}日之旅`, summary: `已生成${daysCount}天${pace}行程。`, bestSeasonNote: '出发前请查看天气。', days,
    services: [
      { type: '住宿', title: `${destination}交通便利住宿`, reason: '减少每日换乘时间', priceHint: '以平台实时价格为准' },
      { type: '门票', title: '热门景点预约', reason: '避免到场后无法入园', priceHint: '提前预约' },
      { type: '用车', title: '接送站服务', reason: '携带行李更方便', priceHint: '比价后下单' },
      { type: '餐饮', title: `${destination}本地风味`, reason: '结合游览区域就近用餐', priceHint: '错峰少排队' }
    ], cautions: ['当前为功能测试数据，价格和营业时间请在真实平台核验。'], placeDataStatus: 'not_configured' };
}

async function api(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error?.message || '服务暂时不可用');
  return payload;
}

function setLoading(visible, refinement = false) {
  $('#loading').classList.toggle('hidden', !visible);
  $('#loadingText').textContent = refinement ? '根据你的反馈重新调整行程' : '连接 AI，理解你的出行需求';
}

function escapeHtml(value = '') {
  const node = document.createElement('div'); node.textContent = value; return node.innerHTML;
}

function renderPlan(plan) {
  state.plan = plan;
  const intent = plan.intent;
  $('#intentSummary').textContent = `${intent.destination} · ${intent.days}天 · ${intent.travelers}`;
  $('#intentTags').innerHTML = [`📍 ${intent.destination}`, `◷ ${intent.days} 天`, `☻ ${intent.travelers}`, `♡ ${intent.preferences.join('、')}`, `¥ ${intent.budget || '预算待定'}`].map(value => `<span>${escapeHtml(value)}</span>`).join('');
  $('#daysList').innerHTML = plan.days.map(day => `<article class="day-card">
    <div class="day-num">D${day.day}</div><div class="day-body"><h4>${escapeHtml(day.title)}</h4>
    <div class="stops">${day.stops.map(stop => `<span class="stop">${escapeHtml(stop.name)}${stop.place ? `<small class="verified" title="${escapeHtml(stop.place.address)}">✓ 已核验</small>` : ''}</span>`).join('<b>→</b>')}</div>
    <span class="transport">🚇 ${escapeHtml(day.transport)} · 预计 ¥${day.estimatedCostCny}</span>
    ${day.tips?.length ? `<p class="day-tip">${escapeHtml(day.tips[0])}</p>` : ''}</div>
    <span class="duration">${day.stops.reduce((sum, stop) => sum + stop.durationMinutes, 0)} 分钟</span></article>`).join('');

  const verifiedPlaces = plan.days.flatMap(day => day.stops).filter(stop => stop.place);
  $('#mapMeta').textContent = plan.placeDataStatus === 'amap' ? `${verifiedPlaces.length} 个地点已由高德核验` : '配置高德 Key 后核验地点';
  $('#travelTip').textContent = plan.cautions?.[0] || plan.bestSeasonNote || '具体营业时间和预约规则请在出发前核验。';
  $('#serviceGrid').innerHTML = plan.services.map(service => `<article class="service-card"><span class="service-icon">${serviceIcons[service.type] || '✨'}</span><h4>${escapeHtml(service.title)}</h4><p>${escapeHtml(service.reason)}</p><b>${escapeHtml(service.priceHint || service.bookingAdvice)}　→</b></article>`).join('');
  renderMapPins(verifiedPlaces);
  $('#results').classList.remove('hidden');
  $('#refineBar').classList.remove('hidden');
}

function renderMapPins(places) {
  const map = $('.map-card');
  map.querySelectorAll('.dynamic-pin').forEach(node => node.remove());
  places.slice(0, 6).forEach((stop, index) => {
    const pin = document.createElement('div'); pin.className = 'pin dynamic-pin'; pin.textContent = index + 1;
    pin.style.left = `${16 + (index * 29) % 68}%`; pin.style.top = `${22 + (index * 23) % 55}%`; pin.title = stop.name; map.appendChild(pin);
  });
  map.querySelectorAll('.p1,.p2,.p3').forEach(node => node.style.display = places.length ? 'none' : 'grid');
}

async function generate(message) {
  if (!message.trim()) return $('#tripInput').focus();
  setLoading(true);
  try {
    const result = staticDemo
      ? { sessionId: 'browser-demo', plan: createBrowserDemoPlan(message) }
      : await api('/api/plans', { method: 'POST', body: JSON.stringify({ message }) });
    state.sessionId = result.sessionId; renderPlan(result.plan); $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { toast(error.message, true); } finally { setLoading(false); }
}

async function refine(message) {
  if (!message.trim() || !state.sessionId) return;
  setLoading(true, true);
  try {
    const result = staticDemo
      ? { sessionId: state.sessionId, plan: createBrowserDemoPlan(message, state.plan) }
      : await api(`/api/plans/${state.sessionId}/refine`, { method: 'POST', body: JSON.stringify({ message }) });
    renderPlan(result.plan); $('#refineInput').value = ''; toast('AI 已按你的要求更新行程');
  } catch (error) { toast(error.message, true); } finally { setLoading(false); }
}

async function loadStatus() {
  if (staticDemo) {
    $('#integrationStatus').textContent = '● 在线演示模式';
    $('#integrationStatus').classList.add('ready');
    return;
  }
  try {
    const { integrations } = await api('/api/health'); const badge = $('#integrationStatus');
    badge.textContent = integrations.demo ? '● 演示测试模式' : integrations.llm ? `● AI 已连接${integrations.map ? ' · 地图已连接' : ''}` : '● 等待配置 AI Key';
    badge.classList.toggle('ready', integrations.llm || integrations.demo);
  } catch { $('#integrationStatus').textContent = '● 请通过项目服务启动'; }
}

function toast(message, isError = false) {
  const element = $('#toast'); element.textContent = message; element.classList.toggle('error', isError); element.classList.add('show');
  setTimeout(() => element.classList.remove('show'), 3200);
}

$('#sendBtn').addEventListener('click', () => generate($('#tripInput').value));
$('#tripInput').addEventListener('keydown', event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); generate(event.target.value); } });
document.querySelectorAll('.quick-prompts button').forEach(button => button.addEventListener('click', () => { $('#tripInput').value = button.textContent; generate(button.textContent); }));
$('#newPlanBtn').addEventListener('click', () => { state.sessionId = null; window.scrollTo({ top: 100, behavior: 'smooth' }); $('#tripInput').focus(); });
$('#saveBtn').addEventListener('click', () => { if (state.plan) localStorage.setItem('travelmate:lastPlan', JSON.stringify(state.plan)); toast('行程已安全保存到当前浏览器'); });
$('#savedBtn').addEventListener('click', () => { const saved = localStorage.getItem('travelmate:lastPlan'); if (!saved) return toast('暂无已保存的行程'); renderPlan(JSON.parse(saved)); $('#results').scrollIntoView({ behavior: 'smooth' }); });
$('#refineBtn').addEventListener('click', () => refine($('#refineInput').value));
$('#refineInput').addEventListener('keydown', event => { if (event.key === 'Enter') refine(event.target.value); });
loadStatus();
