const $ = selector => document.querySelector(selector);
const state = { sessionId: null, plan: null };
const serviceIcons = { 住宿: '🏨', 门票: '🎫', 用车: '🚕', 餐饮: '🍜', 保险: '🛡️', 其他: '✨' };

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
    const result = await api('/api/plans', { method: 'POST', body: JSON.stringify({ message }) });
    state.sessionId = result.sessionId; renderPlan(result.plan); $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) { toast(error.message, true); } finally { setLoading(false); }
}

async function refine(message) {
  if (!message.trim() || !state.sessionId) return;
  setLoading(true, true);
  try {
    const result = await api(`/api/plans/${state.sessionId}/refine`, { method: 'POST', body: JSON.stringify({ message }) });
    renderPlan(result.plan); $('#refineInput').value = ''; toast('AI 已按你的要求更新行程');
  } catch (error) { toast(error.message, true); } finally { setLoading(false); }
}

async function loadStatus() {
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
