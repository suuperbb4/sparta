// 비티 노트 시범판 (서버 없이 동작하는 PWA)
// 구독자 확인: 네이버 유료 글의 링크(?k=코드) 또는 코드 직접 입력 → config.json의 해시와 비교
{
  const $app = document.getElementById('app');
  const KEY = 'btcard.access';
  const SEEN = 'btcard.seenNotice';
  const MEMBER = 'btcard.member';
  const S = {
    cfg: null, feed: { days: [] }, notices: [], access: null, route: 'gate', date: null, open: null, idx: 0,
    os: /android/i.test(navigator.userAgent) ? 'and' : 'ios', err: '', toast: '', cat: 'all', capOpen: false, seen: '', member: null, plan: 'monthly', method: 'card', agree: {}, phone: '', busy: false,
  };
  const VERSION = 'v17';
  const B = () => esc(S.cfg.brand); // 앱 이름은 config.json의 brand 한 곳에서 바꾼다
  let installPrompt = null;
  let lockUntil = 0;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* 저장 불가 환경 */ } },
  };
  const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const inApp = () => /NAVER\(inapp|KAKAOTALK|Instagram|FBAN|FBAV|Line\//i.test(navigator.userAgent);
  const W = '일월화수목금토';
  const dayLabel = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${d.getMonth() + 1}월 ${d.getDate()}일 (${W[d.getDay()]})`; };
  const longDay = (iso) => { const d = new Date(iso + 'T00:00:00'); return `${d.getMonth() + 1}월 ${d.getDate()}일 ${W[d.getDay()]}요일`; };
  const untilLabel = (t) => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const memberUntil = () => { const m = S.member; if (!m) return 0; return m.status === 'canceled' ? m.paidUntil : Infinity; };
  const viaCode = () => S.access && S.access.until > Date.now();
  const valid = () => viaCode() || memberUntil() > Date.now();
  const won = (n) => n.toLocaleString('ko-KR');
  const ymd = (t) => { const d = new Date(t); return `${d.getMonth() + 1}월 ${d.getDate()}일`; };
  const priceOf = (plan) => (plan === 'annual' ? S.cfg.membership.annualPrice : S.cfg.membership.cardPrice);
  const saveMember = () => ls.set(MEMBER, JSON.stringify(S.member));
  // 결제대행사 연결 지점: 정식 오픈 때 이 함수만 토스페이먼츠 자동결제(빌링) 등록으로 바꾼다
  async function startBilling({ plan, method, phone }) {
    await new Promise((r) => setTimeout(r, 1200));
    const now = Date.now(); const trialEnd = now + S.cfg.membership.trialDays * 864e5;
    return { plan, method, phoneTail: phone.slice(-4), status: 'trial', start: now, trialEnd, nextBill: trialEnd, test: !!S.cfg.membership.testMode };
  }
  const info = (id) => (S.cfg.series[id] || { name: id, short: id, cat: 'etc', color: '#7C8BA1', order: 99 });
  const catOf = (series) => info(series).cat || 'etc';
  const firstLine = (t) => String(t || '').split('\n').map((x) => x.trim()).find(Boolean) || '';
  // 캡션 첫 줄이 "11월 27일 ○○입니다." 같은 인사말이면 그다음 문장을 제목처럼 쓴다
  const headline = (t) => {
    const lines = String(t || '').split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#'));
    const pick = lines.find((x, i) => i > 0 || !/입니다\.?$/.test(x)) || lines[0] || '';
    const m = pick.match(/^.*?[.!?](?=\s|$)/); // 첫 문장만 (오래된 아이폰도 되도록 lookbehind는 쓰지 않음)
    return m ? m[0] : pick;
  };
  const sortSets = (sets) => sets.slice().sort((a, b) => info(a.series).order - info(b.series).order);
  const inCat = (s) => S.cat === 'all' || catOf(s.series) === S.cat;
  const unread = () => S.notices.length && S.notices[0].id !== S.seen;
  const ICON = {
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    archive: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>',
    news: '<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>',
    my: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
  };

  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  async function checkCode(raw) {
    // 아이폰 키보드가 바꿔 넣는 대시·공백을 정리하고, 하이픈 없이 써도 받아 준다 (BT1127K7Q → BT-1127-K7Q)
    let code = String(raw || '').toUpperCase().replace(/[‐-―−ー－_.·]/g, '-').replace(/\s+/g, '').replace(/-+/g, '-');
    const bare = code.replace(/-/g, '');
    if (/^BT\d{4}[A-Z0-9]{3}$/.test(bare)) code = `BT-${bare.slice(2, 6)}-${bare.slice(6)}`;
    if (!code) return null;
    const h = await sha256(code);
    return S.cfg.keys.some((k) => k.hash === h) ? code : null;
  }
  function grant(code) {
    const first = !S.access;
    S.access = { until: Date.now() + S.cfg.accessDays * 864e5, code };
    ls.set(KEY, JSON.stringify(S.access));
    return first;
  }

  let tt;
  function toast(m) { S.toast = m; render(); clearTimeout(tt); tt = setTimeout(() => { S.toast = ''; render(); }, 2800); }
  function go(route) { S.route = route; S.err = ''; render(); const b = document.querySelector('.body'); if (b) b.scrollTop = 0; }

  const tabs = () => `<nav class="tabs">${[['home', '오늘'], ['archive', '보관함'], ['news', '소식'], ['my', '내 정보']]
    .map(([k, l]) => `<button data-go="${k}" class="${S.route === k ? 'on' : ''}"><span class="${k === 'news' && unread() ? 'dot' : ''}">${ICON[k]}</span>${l}</button>`).join('')}</nav>`;
  const topbar = () => `<div class="top"><div class="brand"><span class="logo">BT</span>${esc(S.cfg.brand)}</div><span class="pro">PREMIUM</span></div>`;
  const chips = () => `<div class="chips">${[{ id: 'all', name: '전체' }].concat(S.cfg.categories)
    .map((c) => `<button data-cat="${c.id}" class="${S.cat === c.id ? 'on' : ''}">${esc(c.name)}</button>`).join('')}</div>`;
  const feat = (s, date) => `<button class="feat" data-open="${esc(s.series)}" data-date="${esc(date)}" style="--c:${info(s.series).color}">
      <div class="ph"><img src="${esc(s.thumb || s.cards[0])}" alt="" loading="lazy" decoding="async"><span class="cnt">${s.cards.length}장</span></div>
      <div class="meta"><span class="tag">${esc(info(s.series).short)}</span>
        <h3>${esc(headline(s.text) || info(s.series).name)}</h3>
        <p>${s.text ? esc(firstLine(s.text)) : esc(info(s.series).name)}</p></div></button>`;

  const V = {
    gate: () => `<div class="body pad">
      <div class="hero"><span class="logo">BT</span><h1>비티의 인사이트 노트<br>구독자 전용 카드</h1>
      <p class="muted">모닝 인사이트, 마켓, 5분 세상읽기를 한곳에서. 발행 즉시 가장 먼저 받아보세요.</p></div>
      <div class="box">네이버 인사이트 노트 유료 글 맨 아래의 <b>"${B()} 앱에서 넘겨보기"</b> 버튼을 누르면 바로 열려요.</div>
      <form id="codeForm" autocomplete="off">
        <label class="muted" for="code">또는 연동 코드로 열기 (유료 글 하단에 있어요)</label>
        <input class="field" id="code" name="code" placeholder="BT-0000-XXX" autocapitalize="characters" spellcheck="false">
        <p class="err" id="err">${esc(S.err)}</p>
        <button class="btn" type="submit">열기</button>
      </form>
      ${standalone() ? '' : '<button class="btn ghost" data-go="install">홈 화면에 추가하는 방법 보기</button>'}
      <h2>아직 구독 전이라면</h2>
      <button class="btn" data-go="plans">${S.cfg.membership.trialDays}일 무료로 시작하기</button>
      <p class="muted" style="text-align:center;margin-top:8px">이후 월 ${S.cfg.membership.cardPrice}원 · 언제든 해지</p>
    </div>`,

    welcome: () => `<div class="body pad">
      <div class="ok">✓</div>
      <h1 style="margin-top:0">인사이트 노트 구독자님,<br>${B()}가 열렸어요</h1>
      <ul class="ben">
        <li><div><b>발행 즉시 가장 먼저</b>SNS·오픈채팅보다 반나절 먼저 전체 카드를 받아요</div></li>
        <li><div><b>세 가지 시리즈를 한곳에서</b>모닝 인사이트, 마켓, 5분 세상읽기와 캡션까지</div></li>
        <li><div><b>보관함</b>지난 카드를 날짜와 분류별로 다시 보기</div></li>
        <li><div><b>이용 기간 ${untilLabel(S.access.until)}까지</b>네이버 유료 글의 버튼을 누를 때마다 자동 연장</div></li>
      </ul>
      ${standalone() ? '' : '<div class="box">지금 이 화면에서 바로 홈 화면에 추가하면, 아이콘을 눌렀을 때 코드 입력 없이 열려요. 추가할 때 <b>"웹 앱으로 열기"</b>를 꼭 켜 주세요.</div><button class="btn" data-go="install">홈 화면에 추가하기</button>'}
      <button class="btn ghost" data-go="home">${standalone() ? '카드 보러 가기' : '나중에'}</button>
    </div>`,

    install: () => {
      if (standalone()) return `<div class="body pad"><button class="back" data-go="home">‹ 뒤로</button><h1>이미 앱으로 쓰고 있어요</h1><p class="muted">홈 화면의 ${B()} 아이콘으로 열면 돼요.</p><button class="btn" data-go="home">카드 보러 가기</button></div>`;
      const ios = S.os === 'ios';
      const iosSteps = [
        ['guide/ios-1.jpg', '<b>①</b> Safari 주소창 왼쪽의 메뉴 버튼을 눌러요'],
        ['guide/ios-2.jpg', '<b>②</b> <b>공유</b>를 눌러요'],
        ['guide/ios-3.jpg', '<b>③</b> 아래쪽 <b>더 보기</b>를 눌러요'],
        ['guide/ios-4.jpg', '<b>④</b> <b>홈 화면에 추가</b>를 눌러요'],
        ['guide/ios-5.jpg', '<b>⑤</b> <b>웹 앱으로 열기</b>를 꼭 켜고 <b>⑥</b> 오른쪽 위 <b>추가</b>를 눌러요'],
      ];
      const andSteps = ['크롬 오른쪽 위 메뉴(점 세 개)를 눌러요', '"앱 설치" 또는 "홈 화면에 추가"를 골라요', `설치된 ${B()}를 누르면 바로 열려요`];
      return `<div class="body pad">
        <button class="back" data-go="${valid() ? 'home' : 'gate'}">‹ 뒤로</button>
        <h1>홈 화면에 추가하기</h1>
        <p class="muted">앱스토어 설치 없이 30초면 끝나요. 처음 한 번만 하면 돼요.</p>
        ${inApp() ? `<div class="box warn">지금은 네이버·카카오톡 같은 앱 안의 브라우저예요. 오른쪽 위 메뉴에서 <b>${ios ? '"Safari로 열기"' : '"다른 브라우저로 열기"'}</b>를 누른 뒤 진행해 주세요.</div>` : ''}
        <div class="seg"><button data-os="ios" class="${ios ? 'on' : ''}">아이폰</button><button data-os="and" class="${ios ? '' : 'on'}">안드로이드</button></div>
        ${ios ? `<div class="box must"><b>"웹 앱으로 열기"를 꼭 켜 주세요.</b> 그래야 주소창 없는 전체 화면과 새 카드 알림까지, 최적의 상태로 이용할 수 있어요.</div>
          <ol class="gsteps">${iosSteps.map(([img, t]) => `<li><p>${t}</p><img src="${img}" alt="" loading="lazy"></li>`).join('')}</ol>
          <div class="box">이제 홈 화면의 <b>${B()}</b> 아이콘을 누르면 바로 열려요.</div>`
        : `<ol class="ist">${andSteps.map((t, i) => `<li><span>${i + 1}</span><div>${t}</div></li>`).join('')}</ol>
          ${installPrompt ? '<button class="btn" data-act="install">지금 설치하기</button>' : ''}`}
        ${S.access ? `<p class="muted">혹시 아이콘으로 열었을 때 코드를 물으면 이 코드를 넣어 주세요 <span class="code">${esc(S.access.code)}</span></p>` : ''}
      </div>`;
    },

    home: () => {
      const days = S.feed.days;
      const day = (S.date && days.find((d) => d.date === S.date)) || days[0];
      const sets = day ? sortSets(day.sets) : [];
      const today = day && day === days[0];
      // 분류별 가장 최근 세트(스토리 동그라미)
      const latestOf = (cat) => { for (const d of days) { const s = sortSets(d.sets).find((x) => catOf(x.series) === cat); if (s) return { s, d }; } return null; };
      const pin = S.notices.find((n) => n.pinned);
      return `<div class="body pad">
        ${S.date ? '<button class="back" data-act="toArchive">‹ 보관함</button>' : topbar()}
        <p class="hello">${day ? (today && !S.date ? '오늘의 인사이트' : longDay(day.date)) : '오늘의 인사이트'}</p>
        <p class="sub">${day ? longDay(day.date) : ''} · ${S.member && !viaCode() ? (S.member.status === 'trial' ? `무료 체험 ${ymd(S.member.trialEnd)}까지` : `${B()} 멤버십`) : `구독 ${untilLabel(S.access.until)}까지`}</p>
        ${S.date ? '' : `<div class="stories">${S.cfg.categories.map((c) => {
          const l = latestOf(c.id); const color = l ? info(l.s.series).color : '#7C8BA1';
          const isNew = l && day && l.d.date === day.date;
          return `<button class="story" ${l ? `data-open="${esc(l.s.series)}" data-date="${esc(l.d.date)}"` : 'data-go="news"'} style="--c:${color}">
            <div class="ring ${isNew ? 'new' : ''}"><i ${l ? `style="background-image:url('${esc(l.s.thumb || l.s.cards[0])}')"` : ''}>${l ? '' : '+'}</i></div>${esc(c.name)}</button>`;
        }).join('')}</div>`}
        ${pin && !S.date ? `<button class="pin" data-go="news"><b>공지</b><span>${esc(pin.title)}</span>›</button>` : ''}
        <div class="sec"><h2>${S.date ? '이날 발행' : '오늘 발행'}</h2><span class="muted">${sets.length > 1 ? '옆으로 넘겨 보기 ›' : ''}</span></div>
        ${sets.length ? `<div class="rail">${sets.map((s) => feat(s, day.date)).join('')}</div>` : '<div class="empty">아직 올라온 카드가 없어요.</div>'}
        ${!S.date && days.length > 1 ? '<button class="btn ghost" data-go="archive">지난 카드 보기</button>' : ''}
        ${standalone() || S.date ? '' : '<div class="box">홈 화면에 추가하면 앱처럼 바로 열 수 있어요. <button class="lnk" data-go="install">추가하는 방법</button></div>'}
      </div>${tabs()}`;
    },

    archive: () => {
      const days = S.feed.days.map((d) => ({ d, sets: sortSets(d.sets).filter(inCat) })).filter((x) => x.sets.length);
      return `<div class="body pad">${topbar()}<h1>보관함</h1>${chips()}
      ${days.length ? days.map(({ d, sets }) => `<div class="dh">${dayLabel(d.date)}</div><div class="grid">${sets.map((s) => `
        <button class="tile" data-open="${esc(s.series)}" data-date="${esc(d.date)}" style="--c:${info(s.series).color}">
          <div class="ph"><img src="${esc(s.thumb || s.cards[0])}" alt="" loading="lazy" decoding="async"><span class="cnt">${s.cards.length}장</span></div>
          <span class="tag">${esc(info(s.series).short)}</span></button>`).join('')}</div>`).join('')
        : `<div class="empty">${S.cat === 'etc' ? '주간 비티·특집 카드가 올라오면 여기에 모여요.' : '이 분류의 카드가 아직 없어요.'}</div>`}
      </div>${tabs()}`;
    },

    news: () => `<div class="body pad">${topbar()}<h1>소식</h1><p class="muted">공지사항과 비티의 안내를 모았어요.</p>
      <div style="margin-top:16px">${S.notices.length ? S.notices.map((n) => `<article class="note"><div class="nh">${n.pinned ? '<span class="nb">공지</span>' : ''}<span class="muted">${dayLabel(n.date)}</span></div>
        <h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></article>`).join('') : '<div class="empty">아직 소식이 없어요.</div>'}</div>
      </div>${tabs()}`,

    my: () => {
      const m = S.member;
      const methodName = (id) => (S.cfg.membership.methods.find((x) => x.id === id) || {}).name || id;
      const memberCard = m ? `<div class="card">
          <div class="row"><span>멤버십</span><span>${B()} ${m.plan === 'annual' ? '연간' : '월간'}${m.test ? ' <em class="tm">테스트</em>' : ''}</span></div>
          <div class="row"><span>상태</span><span>${m.status === 'trial' ? `무료 체험 중 · ${ymd(m.trialEnd)}까지` : m.status === 'canceled' ? `해지됨 · ${ymd(m.paidUntil)}까지 이용` : '이용 중'}</span></div>
          ${m.status === 'canceled' ? '' : `<div class="row"><span>다음 결제</span><span>${ymd(m.nextBill)} · ${priceOf(m.plan)}원</span></div>`}
          <div class="row"><span>결제수단</span><span>${esc(methodName(m.method))} · ${esc(m.phoneTail)}</span></div>
        </div>
        ${m.status === 'canceled' ? '<button class="btn" data-act="resume">멤버십 다시 시작</button>' : '<button class="btn ghost" data-go="cancel">멤버십 해지</button>'}` : '';
      const naverCard = viaCode() ? `<div class="card">
          <div class="row"><span>멤버십</span><span>네이버 인사이트 노트 구독자</span></div>
          <div class="row"><span>이용 기간</span><span>${untilLabel(S.access.until)}까지 · 자동 연장</span></div>
        </div>
        <p class="muted">네이버 유료 글의 "${B()} 앱에서 넘겨보기" 버튼을 누르거나 새 연동 코드를 입력하면 그날부터 ${S.cfg.accessDays}일로 연장돼요.</p>` : '';
      return `<div class="body pad">${topbar()}<h1>내 정보</h1>
      ${naverCard}${memberCard}
      <div class="card"><div class="row"><span>실행 방식</span><span>${standalone() ? '홈 화면 앱' : '브라우저'}</span></div></div>
      ${standalone() ? '' : '<button class="btn ghost" data-go="install">홈 화면에 추가하기</button>'}
      ${m ? '' : '<button class="btn ghost" data-go="plans">멤버십 안내</button>'}
      ${viaCode() ? '' : '<button class="btn ghost" data-go="gate">네이버 구독자 연동하기</button>'}
      <button class="btn ghost" data-act="diag">화면 진단 (문제가 있을 때 캡처해서 보내 주세요)</button>
      <div class="diag" id="diag" hidden></div>
      <p class="ver">${esc(S.cfg.brand)} ${VERSION}</p>
      </div>${tabs()}`;
    },

    plans: () => {
      const m = S.cfg.membership; const annual = S.plan === 'annual';
      return `<div class="body pad">
      <button class="back" data-go="${valid() ? 'my' : 'gate'}">‹ 뒤로</button>
      <h1>${B()} 멤버십</h1>
      <p class="muted">매일 카드 전체를 발행 즉시, 가장 먼저. 첫 ${m.trialDays}일은 무료예요.</p>
      <div class="seg" style="margin-top:18px"><button data-plan="monthly" class="${annual ? '' : 'on'}">월간</button><button data-plan="annual" class="${annual ? 'on' : ''}">연간 <span class="save">2개월 무료</span></button></div>
      <div class="plan rec">
        <span class="pt">${m.trialDays}일 무료 체험</span><h3>${B()} 멤버십 · ${annual ? '연간' : '월간'}</h3>
        <div class="pr">${annual ? m.annualPrice : m.cardPrice}원 <small>/ ${annual ? '년' : '월'}</small></div>
        ${annual ? `<p class="muted" style="margin:0">월 ${m.annualMonthly}원꼴 · 월간보다 2개월 무료</p>` : ''}
        <ul><li>모닝 인사이트·마켓·5분 세상읽기 전체와 캡션</li><li>발행 즉시, SNS보다 반나절 먼저</li><li>보관함 · 공지</li><li>체험 중 해지하면 0원</li></ul>
        <button class="btn" data-go="checkout">${m.trialDays}일 무료로 시작하기</button>
      </div>
      <div class="plan"><span class="pt alt">칼럼까지</span><h3>네이버 인사이트 노트</h3><div class="pr">${m.naverPrice}원 <small>/ 월</small></div>
        <ul><li>깊이 있는 칼럼 전체</li><li>${B()} 앱 무료 포함</li></ul>
        <a class="btn nv" href="${esc(S.cfg.naverUrl)}">네이버에서 구독하기</a>
        <button class="btn ghost" data-go="gate">이미 구독 중이에요</button></div>
      <details class="faq"><summary>자주 묻는 질문</summary>
        <p><b>언제 결제되나요?</b><br>무료 체험이 끝나는 날 첫 결제가 되고, 이후 ${annual ? '1년' : '한 달'}마다 자동 결제돼요. 결제 전에 알림을 보내드려요.</p>
        <p><b>해지는 어떻게 하나요?</b><br>내 정보 → 멤버십 해지에서 바로 할 수 있어요. 해지해도 결제한 기간 끝까지 볼 수 있어요.</p>
        <p><b>무료 체험은 몇 번 되나요?</b><br>결제수단과 휴대폰 번호 기준으로 한 번이에요.</p></details>
      </div>`;
    },

    checkout: () => {
      const m = S.cfg.membership; const annual = S.plan === 'annual';
      const price = priceOf(S.plan); const now = Date.now(); const end = now + m.trialDays * 864e5;
      const need = ['terms', 'privacy', 'billing'];
      const ready = need.every((k) => S.agree[k]) && /^01\d{8,9}$/.test(S.phone.replace(/\D/g, ''));
      const ag = (k, label, req, text) => `<div class="ag"><label><input type="checkbox" data-agree="${k}" ${S.agree[k] ? 'checked' : ''}><span>${req ? '<b>[필수]</b>' : '[선택]'} ${label}</span></label>${text ? `<details><summary>보기</summary><p>${text}</p></details>` : ''}</div>`;
      return `<div class="body pad co">
      <button class="back" data-go="plans">‹ 요금제</button>
      <h1>결제 정보 확인</h1>
      <div class="sum">
        <div class="sl"><span>${B()} 멤버십 · ${annual ? '연간' : '월간'}</span><b>${price}원 / ${annual ? '년' : '월'}</b></div>
        <div class="today"><span>오늘 결제 금액</span><strong>0원</strong></div>
        <ol class="tl">
          <li class="on"><i></i><div><b>오늘</b> 무료 체험 시작 · 카드 전체 바로 열림</div></li>
          <li><i></i><div><b>${ymd(end - 2 * 864e5)}</b> 결제 전 알림</div></li>
          <li><i></i><div><b>${ymd(end)}</b> 첫 결제 ${price}원 · 이후 ${annual ? '매년' : '매월'} 자동 결제</div></li>
        </ol>
      </div>
      <h2>결제수단</h2>
      <div class="methods">${m.methods.map((x) => `<button class="mt ${S.method === x.id ? 'on' : ''}" data-method="${x.id}"><i></i>${esc(x.name)}</button>`).join('')}</div>
      <h2>휴대폰 번호</h2>
      <input class="field plain" id="phone" type="tel" inputmode="numeric" placeholder="010-0000-0000" value="${esc(S.phone)}" autocomplete="tel">
      <p class="muted" style="margin-top:-4px">결제 알림과 영수증을 보내고, 무료 체험 중복을 확인하는 데만 써요.</p>
      <h2>약관 동의</h2>
      <div class="agree">
        <label class="all"><input type="checkbox" data-agree="all" ${need.concat('mkt').every((k) => S.agree[k]) ? 'checked' : ''}><span>전체 동의</span></label>
        ${ag('terms', '서비스 이용약관', true, `${B()} 멤버십은 디지털 카드 콘텐츠를 열람하는 구독 서비스예요. 콘텐츠는 정보 제공·시황 정리 목적이며 투자자문이나 매매 권유가 아니에요. 콘텐츠의 무단 복제와 배포는 금지돼요.`)}
        ${ag('privacy', '개인정보 수집·이용', true, '수집 항목: 휴대폰 번호, 결제수단 정보(결제대행사 보관). 이용 목적: 결제, 결제 알림, 무료 체험 중복 확인, 고객 문의 응대. 보관 기간: 해지 후 관련 법령에서 정한 기간.')}
        ${ag('billing', `정기결제 동의`, true, `무료 체험이 끝나는 ${ymd(end)}부터 ${annual ? '매년' : '매월'} ${price}원이 선택한 결제수단으로 자동 결제돼요. 결제 전 언제든 해지할 수 있고, 체험 중 해지하면 비용이 청구되지 않아요. 결제 후 7일 안에 콘텐츠를 열람하지 않았다면 전액 환불돼요.`)}
        ${ag('mkt', '혜택·이벤트 알림 받기', false, '')}
      </div>
      <p class="test">${m.testMode ? '테스트 모드 · 실제 결제는 일어나지 않아요' : ''}</p>
      <p class="biz">사업자 정보와 환불 정책 전문은 정식 오픈 때 이 자리에 표시돼요.</p>
      </div>
      <div class="paybar"><button class="btn" data-act="startTrial" ${ready && !S.busy ? '' : 'disabled'}>${S.busy ? '처리 중…' : `오늘 0원 · ${m.trialDays}일 무료 체험 시작`}</button></div>`;
    },

    done: () => {
      const mm = S.member;
      return `<div class="body pad">
      <div class="ok">✓</div>
      <h1 style="margin-top:0">${S.cfg.membership.trialDays}일 무료 체험이<br>시작됐어요</h1>
      <div class="card">
        <div class="row"><span>체험 기간</span><span>${ymd(mm.start)} ~ ${ymd(mm.trialEnd)}</span></div>
        <div class="row"><span>첫 결제</span><span>${ymd(mm.nextBill)} · ${priceOf(mm.plan)}원</span></div>
        <div class="row"><span>해지</span><span>내 정보에서 언제든</span></div>
      </div>
      ${mm.test ? '<p class="test">테스트 모드라 실제 결제수단은 등록되지 않았어요.</p>' : ''}
      ${standalone() ? '' : '<div class="box">홈 화면에 추가하면 매일 앱처럼 바로 열 수 있어요. 추가할 때 <b>"웹 앱으로 열기"</b>를 꼭 켜 주세요.</div><button class="btn" data-go="install">홈 화면에 추가하기</button>'}
      <button class="btn ghost" data-go="home">카드 보러 가기</button>
      </div>`;
    },

    cancel: () => {
      const mm = S.member; const until = mm.status === 'trial' ? mm.trialEnd : mm.nextBill;
      return `<div class="body pad">
      <button class="back" data-go="my">‹ 내 정보</button>
      <h1>정말 해지할까요?</h1>
      <p class="muted">${mm.status === 'trial' ? '지금 해지하면 비용은 청구되지 않아요.' : '해지해도 결제한 기간 끝까지 볼 수 있어요.'} ${ymd(until)}까지 이용할 수 있어요.</p>
      <div class="card lose"><p class="muted" style="margin:0 0 8px">해지하면 이런 것들을 받을 수 없어요</p>
        <ul><li>매일 모닝 인사이트·마켓·5분 세상읽기 전체</li><li>SNS보다 반나절 먼저 받는 카드</li><li>지난 카드 보관함</li></ul></div>
      <button class="btn" data-go="my">계속 이용하기</button>
      <button class="btn ghost" data-act="doCancel">해지하기</button>
      </div>`;
    },
  };

  function viewer() {
    const day = S.feed.days.find((d) => d.date === S.open.date);
    const set = day && day.sets.find((x) => x.series === S.open.series);
    if (!set) return '';
    const n = set.cards.length + (set.text ? 1 : 0);
    // 캡션은 카드 뒤 마지막 장으로
    const tags = set.text ? (set.text.match(/#[^\s#]+/g) || []) : [];
    const body = set.text ? set.text.replace(/(^|\s)#[^\s#]+/g, '').trim() : '';
    const capSlide = set.text ? `<div class="slide"><article class="txt" style="--c:${info(set.series).color}">
        <span class="tag">${esc(info(set.series).short)} · ${dayLabel(day.date)}</span>
        <div class="tb">${esc(body)}</div>
        ${tags.length ? `<div class="tg">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
      </article></div>` : '';
    return `<div class="vw" role="dialog" aria-label="${esc(info(set.series).name)}">
      <div class="vbar"><button data-act="close">닫기</button><div class="vt"><b>${esc(info(set.series).short)}</b><small>${dayLabel(day.date)}</small></div><span id="cnt">${S.idx + 1}/${n}</span></div>
      <div class="prog">${Array.from({ length: n }, (_, i) => `<i class="${i <= S.idx ? 'on' : ''}"></i>`).join('')}</div>
      <div class="track" id="track">${set.cards.map((c, i) => `<div class="slide"><img src="${esc(c)}" alt="${i + 1}번째 카드" draggable="false" decoding="async" ${i > 1 ? 'loading="lazy"' : ''}></div>`).join('')}${capSlide}</div>
      <div class="vfoot"><button data-act="prev" aria-label="이전 카드">‹</button><span>${set.text ? '마지막 장에 캡션이 있어요' : '옆으로 밀어서 넘기기'}</span><button data-act="next" aria-label="다음 카드">›</button></div></div>`;
  }

  function render() {
    const needAccess = ['home', 'archive', 'news', 'my', 'welcome', 'done', 'cancel'];
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
        const i = Math.round(t.scrollLeft / t.clientWidth); if (i !== S.idx) { S.idx = i; sync(); }
      }, { passive: true });
    }
    const f = document.getElementById('codeForm');
    if (f) f.addEventListener('submit', onCode);
  }
  function sync() {
    document.querySelectorAll('.prog i').forEach((d, i) => d.classList.toggle('on', i <= S.idx));
    const c = document.getElementById('cnt'); const n = document.querySelectorAll('.slide').length;
    if (c) c.textContent = `${S.idx + 1}/${n}`;
  }
  function slide(to) {
    const t = document.getElementById('track'); if (!t) return;
    S.idx = Math.max(0, Math.min(t.children.length - 1, to));
    const busy = Date.now() < lockUntil; // 연달아 누르면 애니메이션 없이 바로 이동
    lockUntil = Date.now() + 500;
    t.scrollTo({ left: S.idx * t.clientWidth, behavior: busy ? 'auto' : 'smooth' }); sync();
  }
  function openViewer(date, series) { S.open = { date, series }; S.idx = 0; S.capOpen = false; history.pushState({ viewer: 1 }, ''); render(); }
  function closeViewer() { if (S.open) { S.open = null; render(); } }

  async function onCode(e) {
    e.preventDefault();
    const code = await checkCode(document.getElementById('code').value);
    if (!code) { S.err = '이번 주 연동 코드가 아니에요. 네이버 유료 글 하단의 최신 코드를 확인해 주세요.'; render(); return; }
    const first = grant(code);
    S.route = first ? 'welcome' : 'home';
    toast(`${untilLabel(S.access.until)}까지 열렸어요`);
  }

  $app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-go],[data-open],[data-act],[data-os],[data-day],[data-cat],[data-plan],[data-method]');
    if (!el) return;
    const d = el.dataset;
    if (d.cat) { S.cat = d.cat; render(); return; }
    if (d.plan) { S.plan = d.plan; render(); return; }
    if (d.method) { S.method = d.method; render(); return; }
    if (d.go) {
      S.open = null; S.date = null;
      if (d.go === 'news' && S.notices.length) { S.seen = S.notices[0].id; ls.set(SEEN, S.seen); }
      go(d.go); return;
    }
    if (d.os) { S.os = d.os; render(); return; }
    if (d.open) { openViewer(d.date, d.open); return; }
    if (d.act === 'close') { history.back(); return; }
    if (d.act === 'cap') { S.capOpen = !S.capOpen; const c = document.querySelector('.cap'); if (c) { c.classList.toggle('open', S.capOpen); el.textContent = S.capOpen ? '접기' : '더 보기'; } return; }
    if (d.act === 'prev') slide(S.idx - 1);
    if (d.act === 'next') slide(S.idx + 1);
    if (d.act === 'toArchive') { S.date = null; go('archive'); }
    if (d.act === 'diag') { const x = document.getElementById('diag'); x.textContent = probe(); x.hidden = false; return; }
    if (d.act === 'startTrial') { startTrial(); return; }
    if (d.act === 'doCancel') {
      const until = S.member.status === 'trial' ? S.member.trialEnd : S.member.nextBill;
      S.member = { ...S.member, status: 'canceled', paidUntil: until }; saveMember(); go('my'); toast(`해지했어요. ${ymd(until)}까지 볼 수 있어요`); return;
    }
    if (d.act === 'resume') { S.member = { ...S.member, status: S.member.trialEnd > Date.now() ? 'trial' : 'active' }; delete S.member.paidUntil; saveMember(); render(); toast('멤버십을 다시 시작했어요'); return; }
    if (d.act === 'install' && installPrompt) { installPrompt.prompt(); installPrompt.userChoice.finally(() => { installPrompt = null; render(); }); }
  });
  $app.addEventListener('change', (e) => {
    const k = e.target.dataset && e.target.dataset.agree; if (!k) return;
    if (k === 'all') ['terms', 'privacy', 'billing', 'mkt'].forEach((x) => { S.agree[x] = e.target.checked; });
    else S.agree[k] = e.target.checked;
    keepScroll();
  });
  $app.addEventListener('input', (e) => {
    if (e.target.id !== 'phone') return;
    const v = e.target.value.replace(/\D/g, '').slice(0, 11);
    S.phone = v.length > 7 ? `${v.slice(0, 3)}-${v.slice(3, v.length - 4)}-${v.slice(-4)}` : v.length > 3 ? `${v.slice(0, 3)}-${v.slice(3)}` : v;
    e.target.value = S.phone; refreshPay();
  });
  function refreshPay() {
    const b = document.querySelector('[data-act=startTrial]'); if (!b) return;
    const ok = ['terms', 'privacy', 'billing'].every((k) => S.agree[k]) && /^01\d{8,9}$/.test(S.phone.replace(/\D/g, ''));
    b.disabled = !ok || S.busy;
  }
  function keepScroll() { const y = document.querySelector('.body') ? document.querySelector('.body').scrollTop : 0; render(); const b = document.querySelector('.body'); if (b) b.scrollTop = y; }
  async function startTrial() {
    if (S.busy) return; S.busy = true; keepScroll();
    try { S.member = await startBilling({ plan: S.plan, method: S.method, phone: S.phone.replace(/\D/g, '') }); saveMember(); S.busy = false; go('done'); }
    catch { S.busy = false; keepScroll(); toast('결제수단 등록에 실패했어요. 다시 시도해 주세요'); }
  }
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

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function fitScreen() {
    if (!(isIOS && standalone())) return;
    const portrait = innerHeight > innerWidth;
    const full = portrait ? Math.max(screen.height, screen.width) : Math.min(screen.height, screen.width);
    $app.style.height = innerHeight < full - 1 ? `${full}px` : '';
    $app.style.bottom = innerHeight < full - 1 ? 'auto' : '';
  }
  function probe() {
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;visibility:hidden;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
    document.body.appendChild(el); const cs = getComputedStyle(el);
    const v = [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((x) => parseInt(x, 10)); el.remove();
    const r = $app.getBoundingClientRect(); const tb = document.querySelector('.tabs');
    return [`버전 ${VERSION} · ${standalone() ? '웹 앱' : '브라우저'} · ${isIOS ? 'iOS' : 'Android 등'}`,
      `화면 ${screen.width}×${screen.height} / 창 ${innerWidth}×${innerHeight}`,
      `보이는 영역 ${visualViewport ? Math.round(visualViewport.height) : '-'} · 문서 ${document.documentElement.clientHeight}`,
      `안전영역 위 ${v[0]} 아래 ${v[2]} 좌 ${v[3]} 우 ${v[1]}`,
      `앱 틀 ${Math.round(r.top)}~${Math.round(r.bottom)} · 탭 아래끝 ${tb ? Math.round(tb.getBoundingClientRect().bottom) : '-'}`,
      navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')].join('\n');
  }
  addEventListener('resize', fitScreen);
  addEventListener('orientationchange', () => setTimeout(fitScreen, 300));

  async function boot() {
    fitScreen();
    try {
      S.cfg = await (await fetch('config.json', { cache: 'no-store' })).json();
    } catch {
      $app.innerHTML = '<div class="body pad"><h1>비티의 인사이트 노트</h1><p class="muted">설정을 불러오지 못했어요. 잠시 후 다시 열어 주세요.</p></div>';
      return;
    }
    try { S.feed = await (await fetch('feed.json', { cache: 'no-store' })).json(); } catch { S.feed = { days: [] }; }
    try { S.notices = (await (await fetch('notices.json', { cache: 'no-store' })).json()).notices || []; } catch { S.notices = []; }
    S.notices.sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
    try { S.access = JSON.parse(ls.get(KEY) || 'null'); } catch { S.access = null; }
    try { S.member = JSON.parse(ls.get(MEMBER) || 'null'); } catch { S.member = null; }
    S.seen = ls.get(SEEN) || '';

    const k = new URLSearchParams(location.search).get('k');
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
