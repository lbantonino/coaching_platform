class Component extends DCLogic {
  state = { per: '6m', rm: 'race', slotA: 'race', slotB: 'wall', dd: null, tab: null, vOpen: false, aView: 'week', wk: null, wkOpen: false };
  renderVals() {
    const cur = this.state.tab || this.props.tab || 'overview';
    const go = k => () => this.setState({ tab: k });
    const v = {
      tabs: TABS.map(([k, l]) => { const on = cur === k; return { l, on: go(k), sel: on ? 'true' : 'false', bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 3px rgba(22,18,40,.10)' : 'none' }; }),
      weeks: WEEKS, hist: HIST.map((h, i, a) => Object.assign({}, h, { line: i === a.length - 1 ? 'none' : 'block' })),
      histShort: HIST.slice(0, 5).map((h, i) => Object.assign({}, h, { line: i === 4 ? 'none' : 'block' }))
    };
    const isM = !!this.props.mobile, idx = TABS.findIndex(t => t[0] === cur);
    Object.assign(v, { isM, isD: !isM, vOpen: this.state.vOpen, vExp: this.state.vOpen ? 'true' : 'false', vRot: this.state.vOpen ? 'rotate(180deg)' : 'none', vBg: this.state.vOpen ? '#faf9fc' : '#fff', vRing: this.state.vOpen ? 'inset 0 0 0 1.5px rgba(139,92,246,.55)' : 'inset 0 0 0 1px rgba(22,18,40,.06)', vCur: TABS[idx][1], vIdx: (idx + 1) + ' / ' + TABS.length, vToggle: () => this.setState(s => ({ vOpen: !s.vOpen })) });
    v.tabs.forEach((t, i) => { const k = TABS[i][0], on = k === cur; t.pick = () => this.setState({ tab: k, vOpen: false }); t.mbg = on ? 'rgba(139,92,246,.10)' : 'transparent'; t.mc = on ? '#6a3ee0' : '#17151d'; });
    const CUR = WEEKS.findIndex(w => w.cur), wk = this.state.wk == null ? (CUR < 0 ? 0 : CUR) : this.state.wk, isWeek = this.state.aView === 'week', setWk = n => this.setState({ wk: Math.max(0, Math.min(WEEKS.length - 1, n)), wkOpen: false });
    Object.assign(v, {
      aIsWeek: isWeek, weeksShown: isWeek ? [WEEKS[wk]] : WEEKS,
      aModes: [['week', 'Semaine'], ['all', 'Toutes les semaines']].map(([k, l]) => { const on = this.state.aView === k; return { l, sel: on ? 'true' : 'false', on: () => this.setState({ aView: k, wkOpen: false }), bg: on ? '#fff' : 'transparent', c: on ? '#17151d' : '#64626e', sh: on ? '0 1px 3px rgba(22,18,40,.10)' : 'none' }; }),
      wkLabel: 'Semaine ' + (wk + 1), wkLabelLow: 'semaine ' + (wk + 1), wkOther: isWeek && CUR >= 0 && wk !== CUR, wkBack: () => setWk(CUR),
      wkPrev: () => setWk(wk - 1), wkNext: () => setWk(wk + 1), wkPrevC: wk === 0 ? '#c9c7d1' : '#17151d', wkNextC: wk === WEEKS.length - 1 ? '#c9c7d1' : '#17151d',
      wkOpen: this.state.wkOpen, wkExp: this.state.wkOpen ? 'true' : 'false', wkRing: this.state.wkOpen ? 'inset 0 0 0 1.5px rgba(139,92,246,.55)' : 'inset 0 0 0 1px rgba(22,18,40,.12)', wkToggle: () => this.setState(s => ({ wkOpen: !s.wkOpen })),
      wkOpts: WEEKS.map((w, i) => ({ n: String(i + 1), aria: 'Semaine ' + (i + 1) + (i === CUR ? ' (actuelle)' : ''), pick: () => setWk(i), bg: i === wk ? '#17151d' : '#f6f5fa', c: i === wk ? '#fff' : '#17151d', sh: i === CUR ? 'inset 0 0 0 2px #8b5cf6' : 'none' }))
    });
    const fm = x => Math.floor(x / 60) + ':' + String(Math.round(x % 60)).padStart(2, '0');
    const st = this.state, rm = st.rm, dd = st.dd;
    const byK = k => REPM.find(m => m.k === k);
    const setDd = n => () => this.setState({ dd: dd === n ? null : n });
    const opt = (list, cur, fn) => list.map(m => ({ l: m.l, v: m.v + (m.u === 'min/km' ? '' : ' ' + m.u), sel: m.k === cur ? 'true' : 'false', check: m.k === cur ? '✓' : '', bg: m.k === cur ? 'rgba(139,92,246,.08)' : 'transparent', pick: () => fn(m.k) }));
    const RUN = REPM.filter(m => m.g === 'run'), MUS = REPM.filter(m => m.g === 'mus');
    const mkCard = (name, key, stKey) => { const m = byK(key), shown = rm === key, pick = k => this.setState({ [stKey]: k, rm: k, dd: null }); return Object.assign({}, m, { cat: m.g === 'run' ? 'RUNNING' : 'MUSCULATION', open: dd === name, exp: dd === name ? 'true' : 'false', rot: dd === name ? 'rotate(180deg)' : 'none', toggle: setDd(name), ring: shown ? 'inset 0 0 0 1.5px ' + m.line : 'none', showL: shown ? 'Affiché dans le graphique' : 'Voir l’évolution ↓', show: () => this.setState({ rm: key }), optsRun: opt(RUN, key, pick), optsMus: opt(MUS, key, pick) }); };
    v.cA = mkCard('a', st.slotA, 'slotA'); v.cB = mkCard('b', st.slotB, 'slotB');
    v.swap = () => this.setState(p => ({ slotA: p.slotB, slotB: p.slotA, dd: null }));
    const mob = !!this.props.mobile; v.cPad = mob ? '20px 18px' : '18px 20px'; v.ddFlex = mob ? '1 1 100%' : '0 1 auto'; v.ddItem = mob ? '1 1 auto' : '0 1 auto';
    v.chDd = { open: dd === 'chart', exp: dd === 'chart' ? 'true' : 'false', rot: dd === 'chart' ? 'rotate(180deg)' : 'none', toggle: setDd('chart') };
    const pickCh = k => this.setState({ rm: k, dd: null });
    v.chRun = opt(RUN, rm, pickCh); v.chMus = opt(MUS, rm, pickCh);
    const M = byK(rm), A = M.s, MOS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const fv = d => { if (d <= A[0][0]) return A[0][1] + (A[0][1] - A[1][1]) / (A[1][0] - A[0][0]) * (A[0][0] - d) * 0.5; for (let i = 1; i < A.length; i++) if (d <= A[i][0]) return A[i - 1][1] + (A[i][1] - A[i - 1][1]) * (d - A[i - 1][0]) / (A[i][0] - A[i - 1][0]); return A[A.length - 1][1]; };
    const PER = { '1s': [7, 4], '4s': [28, 5], '1m': [30, 5], '6m': [182, 7], '1a': [364, 13] }, per = st.per || '6m', span = PER[per][0], n = PER[per][1], END = 154;
    const amp = Math.abs(A[A.length - 1][1] - A[0][1]) * 0.06;
    const S = Array.from({ length: n }, (_, i) => { const d = Math.round(END - span + span * i / (n - 1)), dt = new Date(2026, 5, 2 + d), noise = i === n - 1 ? 0 : Math.sin(d * 1.7 + M.k.length) * amp; const sh = dt.getDate() + ' ' + MOS[dt.getMonth()]; return [d, Math.round((fv(d) + noise) * 10) / 10, sh, sh + ' ' + dt.getFullYear()]; });
    const d0 = S[0][0], d1 = S[S.length - 1][0];
        const PL = [['1s', '1 semaine'], ['4s', '4 semaines'], ['1m', '1 mois'], ['6m', '6 mois'], ['1a', '1 an']];
    v.pers = PL.map(([k, l]) => ({ l, v: '', sel: per === k ? 'true' : 'false', check: per === k ? '✓' : '', bg: per === k ? 'rgba(139,92,246,.08)' : 'transparent', pick: () => this.setState({ per: k, dd: null }) }));
    v.perDd = { l: PL.find(p => p[0] === per)[1], open: dd === 'per', exp: dd === 'per' ? 'true' : 'false', rot: dd === 'per' ? 'rotate(180deg)' : 'none', toggle: setDd('per') };
    const vals = S.map(x => x[1]), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), pad = Math.max((hi - lo) * 0.3, M.pace ? 5 : 2);
    const top = M.inv ? lo - pad : hi + pad, bot = M.inv ? hi + pad : lo - pad;
    const P = S.map(([d, val, lab]) => ({ x: (d - d0) / (d1 - d0), y: (val - top) / (bot - top), lab }));
    const xl = [S[0][2], S[Math.floor((S.length - 1) / 2)][2], S[S.length - 1][2]];
    const path = P.map((p, i) => (i ? 'L' : 'M') + (p.x * 600).toFixed(1) + ' ' + (p.y * 160).toFixed(1)).join('');
    const first = vals[0], last = vals[vals.length - 1], diff = Math.round(Math.abs(last - first));
    v.ch = { l: M.l, c: M.c, line: M.line, fill: M.fill, cur: M.v + ' ' + M.u, path, area: path + 'V160H0Z',
      pts: P.map(p => ({ x: (p.x * 100) + '%', y: (p.y * 100) + '%', d: p.lab })), xl: xl.map(l => ({ l })),
      ticks: [0, 1, 2, 3, 4].map(i => { const val = top + (bot - top) * i / 4; return { top: (i * 25) + '%', l: M.pace ? fm(val) : String(Math.round(val)) }; }),
      delta: M.pace ? (last <= first ? diff + ' s/km plus rapide' : diff + ' s/km plus lent') + ' depuis le ' + S[0][3] : (last >= first ? '+' : '−') + diff + ' ' + M.du + ' depuis le ' + S[0][3],
      note: M.pace ? 'Axe inversé : plus la courbe monte, plus l’allure est rapide.' : M.note };
    const hAll = !!this.state.histAll, HN = 6, hs = hAll ? HIST : HIST.slice(0, HN);
    v.histShown = hs.map((h, i) => Object.assign({}, h, { line: i === hs.length - 1 ? 'none' : 'block' }));
    v.histBtn = hAll ? 'Réduire' : 'Voir tout l’historique (' + HIST.length + ')'; v.histExp = hAll ? 'true' : 'false'; v.histRot = hAll ? 'rotate(180deg)' : 'none';
    v.histToggle = () => this.setState(p => ({ histAll: !p.histAll }));
    TABS.forEach(([k]) => { v['is_' + k] = cur === k; v['go_' + k] = go(k); });
    return v;
  }
}
const REPM = [{"k":"z2","l":"Endurance (zone 2)","v":"5:40","u":"min/km","d":"≈ 10,6 km/h · Constaté · 11 août 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,355,"2 juin"],[70,346,"11 août"],[154,340,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"tempo","l":"Tempo","v":"5:05","u":"min/km","d":"≈ 11,8 km/h · Estimation coach · 1 oct. 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,322,"2 juin"],[70,313,"11 août"],[121,305,"1 oct."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"seuil","l":"Seuil","v":"4:45","u":"min/km","d":"≈ 12,6 km/h · Test · 3 nov. 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,300,"2 juin"],[70,292,"11 août"],[154,285,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"a5","l":"Allure 5 km","v":"4:38","u":"min/km","d":"≈ 12,9 km/h · Record · 3 mai 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,290,"2 juin"],[70,284,"11 août"],[154,278,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"a10","l":"Allure 10 km","v":"4:52","u":"min/km","d":"≈ 12,3 km/h · Record · 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,305,"2 juin"],[70,298,"11 août"],[154,292,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"semi","l":"Allure semi-marathon","v":"5:05","u":"min/km","d":"≈ 11,8 km/h · Record · 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,318,"2 juin"],[70,311,"11 août"],[154,305,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"mara","l":"Allure marathon","v":"5:30","u":"min/km","d":"≈ 10,9 km/h · Estimation coach · 1 oct. 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,342,"2 juin"],[70,336,"11 août"],[121,330,"1 oct."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"race","l":"Race pace (Hyrox)","v":"4:50–5:05","u":"min/km","d":"≈ 12,1 km/h · Estimation coach · 1 oct. 2026","g":"run","pace":1,"inv":1,"icon":"M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2 2M9 2h6","s":[[0,312,"2 juin"],[70,305,"11 août"],[121,297.5,"1 oct."]],"c":"#8a6200","tint":"rgba(254,193,79,.24)","line":"#e0a52a","fill":"rgba(254,193,79,.16)"},{"k":"fcmax","l":"FC max","v":"191","u":"bpm","d":"Test · 3 nov. 2026","g":"run","icon":"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z","inv":0,"du":"bpm","note":"Fréquence cardiaque maximale mesurée en test.","s":[[0,193,"2 juin"],[70,192,"11 août"],[154,191,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"fcrep","l":"FC repos","v":"52","u":"bpm","d":"Constaté · 3 nov. 2026","g":"run","icon":"M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z","inv":1,"du":"bpm","note":"Axe inversé : plus la courbe monte, plus la FC de repos est basse.","s":[[0,58,"2 juin"],[70,55,"11 août"],[154,52,"3 nov."]],"c":"#4f4ed6","tint":"rgba(119,118,255,.14)","line":"#7776FF","fill":"rgba(119,118,255,.10)"},{"k":"wall","l":"Wall ball","v":"6 kg × 25","u":"reps","d":"Test · 1 oct. 2026","g":"mus","icon":"M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M7 6v12M17 6v12","inv":0,"du":"répétitions à 6 kg","note":"Répétitions de wall ball à 6 kg, sans pause.","s":[[0,15,"2 juin"],[70,20,"11 août"],[121,25,"1 oct."]],"c":"#DD2D4A","tint":"rgba(221,45,74,.10)","line":"#DD2D4A","fill":"rgba(221,45,74,.08)"},{"k":"squat","l":"Back squat","v":"70 kg × 5","u":"reps","d":"Constaté · 20 oct. 2026","g":"mus","icon":"M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M7 6v12M17 6v12","inv":0,"du":"kg sur 5 répétitions","note":"Charge en kg sur 5 répétitions.","s":[[0,60,"2 juin"],[70,65,"11 août"],[140,70,"20 oct."]],"c":"#DD2D4A","tint":"rgba(221,45,74,.10)","line":"#DD2D4A","fill":"rgba(221,45,74,.08)"},{"k":"sdt","l":"Soulevé de terre","v":"90 kg × 3","u":"reps","d":"Test · 1 oct. 2026","g":"mus","icon":"M6.5 6.5h11M6.5 17.5h11M4 9v6M20 9v6M7 6v12M17 6v12","inv":0,"du":"kg sur 3 répétitions","note":"Charge en kg sur 3 répétitions.","s":[[0,80,"2 juin"],[70,85,"11 août"],[121,90,"1 oct."]],"c":"#DD2D4A","tint":"rgba(221,45,74,.10)","line":"#DD2D4A","fill":"rgba(221,45,74,.08)"}];
const TABS = [['overview','Vue d’ensemble'],['profil','Profil'],['agenda','Agenda'],['programme','Programme'],['objectifs','Objectifs'],['reperes','Repères'],['dispos','Disponibilités'],['notes','Notes'],['documents','Documents'],['historique','Historique']];
const MO = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const PH = ['Préparation', 'Préparation', 'Préparation', 'Allègement', 'Développement', 'Développement', 'Développement', 'Allègement', 'Spécifique', 'Spécifique', 'Spécifique', 'Allègement'];
const DCOL = { run: '#7776FF', mus: '#DD2D4A', hyr: '#FEC14F' };
const DK = { run: ['Running', 'color-mix(in srgb, #7776FF 12%, #fff)', '#4f4ed6', '#fff'], mus: ['Musculation', 'color-mix(in srgb, #DD2D4A 10%, #fff)', '#b51f39', '#fff'], hyr: ['Hyrox', 'color-mix(in srgb, #FEC14F 20%, #fff)', '#8a6200', '#17151d'] };
const WEEKS = PH.map((ph, i) => {
  const d = n => new Date(2026, 9, n + 7 * i), f = x => x.getDate() + ' ' + MO[x.getMonth()];
  const cur = i === 1, long = i === 3 || i === 7 || i === 11;
  const ses = [['Renfo Hyrox', 'Force', 'mus', (cur ? 'Aujourd\u2019hui' : 'Mar ' + d(27).getDate()) + ' · 07:00'], ['Endurance rapide', 'Intervalles', 'run', ''], ['Hyrox Pace', 'Spécifique', 'hyr', ''], ['Circuit Hyrox', 'Circuit', 'hyr', 'Sam ' + d(31).getDate() + ' · 10:00'], [long ? 'Sortie longue' : 'Easy Run', 'Endurance', 'run', '']]
    .map((x, j) => ({ n: String(j + 1), name: x[0], type: x[1], c: DCOL[x[2]], kind: DK[x[2]][0], bg: DK[x[2]][1], tc: DK[x[2]][2], bc: DK[x[2]][3], coach: !!x[3], when: x[3], wc: cur && j === 0 ? '#6a3ee0' : '#17151d' }));
  return { title: 'Semaine ' + (i + 1), sub: f(d(26)) + ' – ' + f(d(32)) + ' · 2 avec le coach · 3 libres', ph: ph, cur, ring: cur ? 'inset 0 0 0 1.5px rgba(139,92,246,.55)' : 'inset 0 0 0 1px rgba(22,18,40,.05)', ses, comp: i === 6 };
});
const IC = {
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3', chart: 'M5 20V12M12 20V5M19 20v-9', note: 'M4 4h12l4 4v12H4zM8 12h8M8 16h5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4', target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6',
  userc: 'M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 11l2 2 4-4', userp: 'M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM19 8v6M16 11h6', link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
};
const HIST = [
  ['trophy', 'Performance ajoutée : Hyrox Open', '1:21:30 · Hyrox Rotterdam · le 26 septembre 2026', '3 nov. 2026'], ['trophy', 'Performance ajoutée : Hyrox Open', '1:28:00 · Hyrox Anvers · le 9 mai 2026', '3 nov. 2026'], ['trophy', 'Performance ajoutée : 5 km', '23:15 · le 3 mai 2026', '3 nov. 2026'],
  ['chart', 'Mesure ajoutée : Race pace (Hyrox)', '4:50–5:05 min/km · mesurée le 1 octobre 2026', '1 oct. 2026'], ['chart', 'Mesure ajoutée : Charge de référence', '6 kg × 25 · Wall ball · mesurée le 1 octobre 2026', '1 oct. 2026'],
  ['note', 'Notes libres mises à jour', '', '18 sept. 2026'], ['shield', 'Accord donné, noté par le coach (formulaire signé)', 'Blessures et points d\u2019attention (données de santé)', '16 sept. 2026'],
  ['target', 'Objectif créé : Hyrox Anvers', 'Hyrox', '16 sept. 2026'], ['check', 'Objectif atteint : Hyrox Anvers', '', '16 sept. 2026'], ['target', 'Objectif créé : Hyrox Gent', 'Hyrox', '16 sept. 2026'], ['target', 'Objectif créé : Hyrox Bruxelles', 'Hyrox', '16 sept. 2026'],
  ['userc', 'Compte activé par le sportif', '', '16 sept. 2026'], ['userp', 'Fiche créée', '', '15 sept. 2026'], ['link', 'Lien d\u2019invitation créé', 'Accès à l\u2019espace sportif', '15 sept. 2026'],
  ['chart', 'Mesure ajoutée : Race pace (Hyrox)', '4:58–5:12 min/km · mesurée le 11 août 2026', '11 août 2026'], ['chart', 'Mesure ajoutée : Race pace (Hyrox)', '5:05–5:20 min/km · mesurée le 2 juin 2026', '2 juin 2026']
].map(([k, t, s, d]) => ({ d: IC[k], t, s, date: d, hasS: !!s }));