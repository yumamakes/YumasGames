// Shared online high scores for every game, stored in Supabase (table: public.scores).
// A page that uses this needs: <ol id="hsList">, and inside its game-over overlay
// <form id="hsForm"> with <div id="hsRow"> holding <input id="hsName"> + submit button, and <p id="hsMsg">.
const HighScores = (() => {
  const SUPABASE_URL = 'https://deahghwgtyofxwnstyfj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_FCHTV28JOB3kRryQLJ1SGg_zjsS1Zbm';
  const headers = {apikey: SUPABASE_KEY};
  let game, list = [], online = false, pending = 0;
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  async function load() {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/scores?select=name,score&game=eq.${game}&order=score.desc,created_at.asc&limit=10`, {headers});
      if (!r.ok) throw new Error(r.status);
      list = await r.json(); online = true;
    } catch (e) { online = false; }
    render();
  }

  function render() {
    const el = $('hsList');
    if (!online) el.innerHTML = '<li class="hs-empty">Online scores only work on the Yuma\'s Games website.</li>';
    else if (!list.length) el.innerHTML = '<li class="hs-empty">No scores yet. Be the first!</li>';
    else el.innerHTML = list.map((s, i) =>
      `<li><span class="hs-rank">${i + 1}</span><span class="hs-name">${esc(s.name)}</span><b>${s.score}</b></li>`).join('');
  }

  const qualifies = score => online && score > 0 && (list.length < 10 || score > list[list.length - 1].score);

  // Call when a game ends: shows the name box if the score makes the Top 10
  function offer(score) {
    pending = score;
    $('hsMsg').textContent = '';
    $('hsRow').hidden = false;
    $('hsForm').querySelector('label').hidden = false;
    try { $('hsName').value = localStorage.getItem('yumas-games-name') || ''; } catch (e) {}
    $('hsForm').hidden = !qualifies(score);
  }
  function hide() { $('hsForm').hidden = true; }

  async function save(e) {
    e.preventDefault();
    const name = $('hsName').value.trim().slice(0, 12);
    if (!name) { $('hsMsg').textContent = 'Type a name first.'; return; }
    try { localStorage.setItem('yumas-games-name', name); } catch (err) {}
    $('hsMsg').textContent = 'Saving…';
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
        method: 'POST',
        headers: {...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal'},
        body: JSON.stringify({game, name, score: pending})
      });
      if (!r.ok) throw new Error(r.status);
      $('hsRow').hidden = true;
      $('hsForm').querySelector('label').hidden = true;
      $('hsMsg').textContent = 'Saved to the Top 10!';
      load();
    } catch (err) {
      $('hsMsg').textContent = 'Could not save. Check the internet connection and try again.';
    }
  }

  function init(name) {
    game = name;
    $('hsForm').addEventListener('submit', save);
    $('hsForm').addEventListener('pointerdown', e => e.stopPropagation());
    load();
  }

  return {init, offer, hide, load, url: SUPABASE_URL, key: SUPABASE_KEY};
})();
