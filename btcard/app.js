// 비티 카드 시범판 (서버 없이 동작하는 PWA)
// 구독자 확인: 네이버 유료 글의 링크(?k=코드) 또는 코드 직접 입력 → config.json의 해시와 비교
{
  const $app = document.getElementById('app');
  const KEY = 'btcard.access';
  const S = { cfg: null, feed: { days: [] }, access: null, route: 'gate', date: null, open: null, idx: 0, os: /android/i.test(navigator.userAgent) ? 'and' : 'ios', err: '', toast: '', cat: 'all', capOpen: false };
  let installPrompt = null;
  let lockUntil = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; } },
    set(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* 저장 불가 환경 */ } },
  };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const inApp = () => /NAVER\(inapp|KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
  const dayLabel = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${'일월화수목금토'[d.getDay()]})`; };
  const untilLabel = (t) => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const valid = () => S.access && S.access.until > Date.now();
  const seriesInfo = (id) => (S.cfg.series[id] || { name: id, color: '#1b3a72', order: 99 });
  const firstLine = (t) => String(t).split('\n').map((x) => x.trim()).find(Boolean) || '';
  const chips = () => {
    const present = new Set(S.feed.days.flatMap((d) => d.sets.map((x) => x.series)));
    const keys = Object.keys(S.cfg.series).filter((k) => present.has(k)).sort((a, b) => seriesInfo(a).order - seriesInfo(b).order);
    return `<div class="chips">${[['all', '전체']].concat(keys.map((k) => [k, seriesInfo(k).short || seriesInfo(k).name]))
      .map(([k, l]) => `<button data-cat="${esc(k)}" class="${S.cat === k ? 'on' : ''}">${esc(l)}</button>`).join('')}</div>`;
  };
  const sortSets = (sets) => sets.slice().sort((a, b) => seriesInfo(a.series).order - seriesInfo(b.series).order);

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function checkCode(raw) {
    // 아이폰 키보드가 바꿔 넣는 대시·공백을 정리하고, 하이픈 없이 써도 받아 준다 (BT1127K7Q → BT-1127-K7Q)
    let code = String(raw || '').toUpperCase().replace(/[\u2010-\u2015\u2212\u30FC\uFF0D_.·]/g, '-').replace(/\s+/g, '').replace(/-+/g, '-');
    const bare = code.replace(/-/g, '');
    if (/^BT\d{4}[A-Z0-9]{3}$/.test(bare)) code = `BT-${bare.slice(2, 6)}-${bare.slice(6)}`;
    if (!code) return null;
    const h = await sha256(code);
    return S.cfg.keys.some((k) => k.hash === h) ? code : null;
  }
  function grant(code) {
    const first = !S.access;
    S.access = { until: Date.now() + S.cfg.accessDays * 864e5, code };
    store.set(S.access);
    return first;
  }

  let tt;
  function toast(m) { S.toast = m; render(); clearTimeout(tt); tt = setTimeout(() => { S.toast = ''; render(); }, 2800); }
  function go(route) { S.route = route; S.err = ''; render(); }

  const tabs = () => `<nav class="tabs">${[['home', '오늘'], ['archive', '보관함'], ['my', '내 정보']]
    .map(([k, l]) => `<button data-go="${k}" class="${S.route === k ? 'on' : ''}"><i></i>${l}</button>`).join('')}</nav>`;

  const V = {
    gate: () => `<div class="body pad">
      <h1>비티 카드</h1>
      <p class="muted">비티의 인사이트 노트 구독자를 위한 매일 카드뉴스 앱이에요.</p>
      <div class="box">네이버 인사이트 노트 유료 글 맨 아래의 <b>"비티 카드 앱에서 넘겨보기"</b> 버튼을 누르면 바로 열려요.</div>
      <form id="codeForm" autocomplete="off">
        <label class="muted" for="code">또는 연동 코드로 열기 (유료 글 하단에 있어요)</label>
        <input class="field" id="code" name="code" placeholder="BT-0000-XXX" autocapitalize="characters" spellcheck="false">
        <p class="err" id="err">${esc(S.err)}</p>
        <button class="btn" type="submit">열기</button>
      </form>
      ${standalone() ? '' : '<button class="btn ghost" data-go="install">홈 화면에 추가하는 방법 보기</button>'}
      <h2>아직 구독 전이라면</h2>
      <a class="btn nv" href="${esc(S.cfg.naverUrl)}">네이버에서 구독하기 · 월 5,900원</a>
      <p class="muted" style="margin-top:10px">카드만 보는 비티 카드 멤버십(월 4,900원)은 준비 중이에요.</p>
    </div>`,

    welcome: () => `<div class="body pad">
      <div class="ok">✓</div>
      <h1 style="margin-top:0">인사이트 노트 구독자님,<br>비티 카드가 열렸어요</h1>
      <ul class="ben">
        <li><b>매일 카드뉴스를 한곳에서</b>모닝 인사이트, 5분 세상읽기, 비티의 마켓</li>
        <li><b>보관함</b>지난 카드를 날짜별로 다시 보기</li>
        <li><b>이용 기간 ${untilLabel(S.access.until)}까지</b>네이버 유료 글의 버튼을 누를 때마다 자동 연장</li>
      </ul>
      ${standalone() ? '' : '<div class="box">지금 이 화면에서 바로 홈 화면에 추가하면, 아이콘을 눌렀을 때 코드 입력 없이 열려요. 추가할 때 <b>"웹 앱으로 열기"</b>를 꼭 켜 주세요.</div>'}
      ${standalone() ? '' : '<button class="btn" data-go="install">홈 화면에 추가하기</button>'}
      <button class="btn ghost" data-go="home">${standalone() ? '카드 보러 가기' : '나중에'}</button>
    </div>`,

    install: () => {
      if (standalone()) return `<div class="body pad"><h1>이미 앱으로 쓰고 있어요</h1><p class="muted">홈 화면의 비티 카드 아이콘으로 열면 돼요.</p><button class="btn" data-go="home">카드 보러 가기</button></div>`;
      const ios = S.os === 'ios';
      const back = `<button class="back" data-go="${valid() ? 'home' : 'gate'}">‹ 뒤로</button>`;
      const iosSteps = [
        ['guide/ios-1.jpg', '<b>①</b> Safari 주소창 왼쪽의 메뉴 버튼을 눌러요'],
        ['guide/ios-2.jpg', '<b>②</b> <b>공유</b>를 눌러요'],
        ['guide/ios-3.jpg', '<b>③</b> 아래쪽 <b>더 보기</b>를 눌러요'],
        ['guide/ios-4.jpg', '<b>④</b> <b>홈 화면에 추가</b>를 눌러요'],
        ['guide/ios-5.jpg', '<b>⑤</b> <b>웹 앱으로 열기</b>를 꼭 켜고 <b>⑥</b> 오른쪽 위 <b>추가</b>를 눌러요'],
      ];
      const andSteps = ['크롬 오른쪽 위 메뉴(점 세 개)를 눌러요', '"앱 설치" 또는 "홈 화면에 추가"를 골라요', '설치된 비티 카드를 누르면 바로 열려요'];
      return `<div class="body pad">
        ${back}
        <h1>홈 화면에 추가하기</h1>
        <p class="muted">앱스토어 설치 없이 30초면 끝나요. 처음 한 번만 하면 돼요.</p>
        ${inApp() ? `<div class="box warn">지금은 네이버·카카오톡 같은 앱 안의 브라우저예요. 오른쪽 위 메뉴에서 <b>${ios ? '"Safari로 열기"' : '"다른 브라우저로 열기"'}</b>를 누른 뒤 진행해 주세요.</div>` : ''}
        <div class="seg"><button data-os="ios" class="${ios ? 'on' : ''}">아이폰</button><button data-os="and" class="${ios ? '' : 'on'}">안드로이드</button></div>
        ${ios ? `<div class="box must"><b>"웹 앱으로 열기"를 꼭 켜 주세요.</b> 그래야 주소창 없는 전체 화면과 새 카드 알림까지, 최적의 상태로 이용할 수 있어요.</div>
          <ol class="gsteps">${iosSteps.map(([img, t]) => `<li><p>${t}</p><img src="${img}" alt="" loading="lazy"></li>`).join('')}</ol>
          <div class="box">이제 홈 화면의 <b>비티 카드</b> 아이콘을 누르면 바로 열려요.</div>`
        : `<ol class="ist">${andSteps.map((t, i) => `<li><span>${i + 1}</span><div>${t}</div></li>`).join('')}</ol>
          ${installPrompt ? '<button class="btn" data-act="install">지금 설치하기</button>' : ''}`}
        ${S.access ? `<p class="muted">혹시 아이콘으로 열었을 때 코드를 물으면 이 코드를 넣어 주세요 <span class="code">${esc(S.access.code)}</span></p>` : ''}
        <button class="btn ghost" data-go="${valid() ? 'home' : 'gate'}">돌아가기</button>
      </div>`;
    },

    home: () => {
      const days = S.feed.days;
      const has = (d) => S.cat === 'all' || d.sets.some((x) => x.series === S.cat);
      const latest = days.find(has);
      const day = (S.date && days.find((d) => d.date === S.date)) || latest;
      const isLatest = day && day === days[0];
      const sets = day ? sortSets(day.sets).filter((x) => S.cat === 'all' || x.series === S.cat) : [];
      return `<div class="body pad">
        <div class="hd">
          ${S.date ? '<button class="back" data-act="toArchive">‹ 보관함</button>' : ''}
          <div class="muted">${day ? dayLabel(day.date) : ''}</div>
          <h1 style="margin:2px 0 6px">${isLatest ? '오늘의 카드' : S.date ? '지난 카드' : '가장 최근 카드'}</h1>
          <span class="badge">인사이트 노트 구독자 · ${untilLabel(S.access.until)}까지</span>
        </div>
        ${S.date ? '' : chips()}
        ${sets.length ? sets.map((x) => `<button class="set" data-open="${esc(x.series)}" data-date="${esc(day.date)}">
          <img src="${esc(x.cards[0])}" alt="" loading="lazy">
          <div><span class="tag">${esc(seriesInfo(x.series).short || '')}</span><h3>${esc(seriesInfo(x.series).name)}</h3><div class="d">${x.cards.length}장${x.text ? ' · 캡션' : ''}</div>${x.text ? `<div class="ex">${esc(firstLine(x.text))}</div>` : ''}</div></button>`).join('')
          : '<div class="empty">아직 올라온 카드가 없어요.</div>'}
        ${standalone() ? '' : '<div class="box">홈 화면에 추가하면 앱처럼 바로 열 수 있어요. <button class="lnk" data-go="install">추가하는 방법</button></div>'}
      </div>${tabs()}`;
    },

    archive: () => {
      const days = S.feed.days.filter((d) => S.cat === 'all' || d.sets.some((x) => x.series === S.cat));
      return `<div class="body pad"><h1>보관함</h1>${chips()}
      ${days.length ? days.map((d) => `<button class="day" data-day="${esc(d.date)}"><span>${dayLabel(d.date)}</span>
        <small>${sortSets(d.sets).filter((x) => S.cat === 'all' || x.series === S.cat).map((x) => `${esc(seriesInfo(x.series).short || seriesInfo(x.series).name)} ${x.cards.length}`).join(' · ')}</small></button>`).join('')
        : '<div class="empty">이 분류의 카드가 아직 없어요.</div>'}
      </div>${tabs()}`;
    },

    my: () => `<div class="body pad"><h1>내 정보</h1>
      <div class="row"><span>멤버십</span><span>네이버 인사이트 노트 구독자</span></div>
      <div class="row"><span>이용 기간</span><span>${untilLabel(S.access.until)}까지</span></div>
      <div class="row"><span>실행 방식</span><span>${standalone() ? '홈 화면 앱' : '브라우저'}</span></div>
      <p class="muted">네이버 유료 글의 "비티 카드 앱에서 넘겨보기" 버튼을 누르거나 새 연동 코드를 입력하면 그날부터 ${S.cfg.accessDays}일로 연장돼요.</p>
      ${standalone() ? '' : '<button class="btn" data-go="install">홈 화면에 추가하기</button>'}
      <button class="btn ghost" data-go="gate">새 연동 코드 입력</button>
      </div>${tabs()}`,
  };

  function viewer() {
    const day = S.feed.days.find((d) => d.date === S.open.date);
    const set = day && day.sets.find((x) => x.series === S.open.series);
    if (!set) return '';
    return `<div class="vw" role="dialog" aria-label="${esc(seriesInfo(set.series).name)}">
      <div class="vbar"><button data-act="close">닫기</button><b>${esc(seriesInfo(set.series).name)}</b><span class="muted" style="min-width:56px;text-align:right" id="cnt">${S.idx + 1}/${set.cards.length}</span></div>
      <div class="track" id="track">${set.cards.map((c, i) => `<div class="slide"><img src="${esc(c)}" alt="${i + 1}번째 카드" draggable="false"></div>`).join('')}</div>
      ${set.text ? `<div class="cap ${S.capOpen ? 'open' : ''}"><div class="capt short">${esc(set.text.replace(/\s*\n\s*/g, ' '))}</div><div class="capt full">${esc(set.text)}</div><button class="lnk" data-act="cap">${S.capOpen ? '접기' : '더 보기'}</button></div>` : ''}
      <div class="vfoot"><button data-act="prev" aria-label="이전 카드">‹</button>
        <div class="dots">${set.cards.map((_, i) => `<i class="${i === S.idx ? 'on' : ''}"></i>`).join('')}</div>
        <button data-act="next" aria-label="다음 카드">›</button></div></div>`;
  }

  function render() {
    const needAccess = ['home', 'archive', 'my', 'welcome'];
    if (needAccess.includes(S.route) && !valid()) S.route = 'gate';
    let h = V[S.route]();
    if (S.open) h += viewer();
    if (S.toast) h += `<div class="toast" role="status">${esc(S.toast)}</div>`;
    $app.innerHTML = h;
    const t = document.getElementById('track');
    if (t) {
      t.scrollLeft = S.idx * t.clientWidth;
      t.addEventListener('scroll', () => {
        if (Date.now() < lockUntil) return; // 버튼으로 넘기는 중에는 중간 위치를 무시
        const i = Math.round(t.scrollLeft / t.clientWidth); if (i !== S.idx) { S.idx = i; syncDots(); }
      }, { passive: true });
    }
    const f = document.getElementById('codeForm');
    if (f) f.addEventListener('submit', onCode);
  }
  function syncDots() {
    document.querySelectorAll('.dots i').forEach((d, i) => d.classList.toggle('on', i === S.idx));
    const c = document.getElementById('cnt'); const n = document.querySelectorAll('.slide').length;
    if (c) c.textContent = `${S.idx + 1}/${n}`;
  }
  function slide(to) {
    const t = document.getElementById('track'); if (!t) return;
    S.idx = Math.max(0, Math.min(t.children.length - 1, to));
    const busy = Date.now() < lockUntil; // 연달아 누르면 애니메이션 없이 바로 이동
    lockUntil = Date.now() + 500;
    t.scrollTo({ left: S.idx * t.clientWidth, behavior: busy ? 'auto' : 'smooth' }); syncDots();
  }
  function openViewer(date, series) { S.open = { date, series }; S.idx = 0; S.capOpen = false; history.pushState({ viewer: 1 }, ''); render(); }
  function closeViewer() { if (S.open) { S.open = null; render(); } }

  async function onCode(e) {
    e.preventDefault();
    const input = document.getElementById('code');
    const code = await checkCode(input.value);
    if (!code) { S.err = '이번 주 연동 코드가 아니에요. 네이버 유료 글 하단의 최신 코드를 확인해 주세요.'; render(); return; }
    const first = grant(code);
    S.route = first ? 'welcome' : 'home';
    toast(`${untilLabel(S.access.until)}까지 열렸어요`);
  }

  $app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go],[data-open],[data-act],[data-os],[data-day],[data-cat]');
    if (!el) return;
    const d = el.dataset;
    if (d.cat) { S.cat = d.cat; S.date = null; render(); return; }
    if (d.go) { S.open = null; if (d.go === 'home') S.date = null; go(d.go); return; }
    if (d.os) { S.os = d.os; render(); return; }
    if (d.day) { S.date = d.day; go('home'); return; }
    if (d.open) { openViewer(d.date, d.open); return; }
    if (d.act === 'close') { history.back(); return; }
    if (d.act === 'cap') { S.capOpen = !S.capOpen; const c = document.querySelector('.cap'); if (c) { c.classList.toggle('open', S.capOpen); el.textContent = S.capOpen ? '접기' : '더 보기'; } return; }
    if (d.act === 'prev') slide(S.idx - 1);
    if (d.act === 'next') slide(S.idx + 1);
    if (d.act === 'latest') { S.date = null; render(); }
    if (d.act === 'toArchive') { S.date = null; go('archive'); }
    if (d.act === 'install' && installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; render(); }); }
  });
  addEventListener('popstate', closeViewer);
  addEventListener('keydown', (e) => {
    if (!S.open) return;
    if (e.key === 'ArrowRight') slide(S.idx + 1);
    else if (e.key === 'ArrowLeft') slide(S.idx - 1);
    else if (e.key === 'Escape') history.back();
  });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; if (S.route === 'install') render(); });
  addEventListener('appinstalled', () => toast('홈 화면에 추가됐어요'));
  addEventListener('resize', () => { const t = document.getElementById('track'); if (t) t.scrollLeft = S.idx * t.clientWidth; });

  async function boot() {
    try {
      S.cfg = await (await fetch('config.json', { cache: 'no-store' })).json();
    } catch {
      $app.innerHTML = '<div class="body pad"><h1>비티 카드</h1><p class="muted">설정을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p></div>';
      return;
    }
    try { S.feed = await (await fetch('feed.json', { cache: 'no-store' })).json(); } catch { S.feed = { days: [] }; }
    S.access = store.get();

    const params = new URLSearchParams(location.search);
    const k = params.get('k');
    if (k) {
      const code = await checkCode(k);
      // 맞는 코드는 주소에 남겨 둔다: 홈 화면에 추가하면 이 주소가 아이콘에 저장돼 다시 입력할 필요가 없다
      history.replaceState(null, '', code ? `${location.pathname}?k=${encodeURIComponent(code)}` : location.pathname);
      if (code) {
        const first = grant(code);
        S.route = first ? 'welcome' : 'home';
        render();
        if (!first) toast(`${untilLabel(S.access.until)}까지 연장됐어요`);
      } else {
        S.route = 'gate';
        S.err = valid() ? '' : '링크의 연동 코드가 만료됐어요. 네이버 유료 글의 최신 버튼을 눌러 주세요.';
        S.route = valid() ? 'home' : 'gate';
        render();
      }
    } else {
      S.route = valid() ? 'home' : 'gate';
      render();
    }
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  boot();
}
