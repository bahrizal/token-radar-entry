/* Token Radar dashboard: renders window.RADAR with no network and no framework.
   Views by hash: #/ board, #live live tokens, #model the model,
   #protocol/<slug> one protocol's detail, #board?category=X&chain=Y&minTvl=N&watchlist=1 a filtered board.
   Farm plans are generated here from the row's own record, with the same rules as
   lib/model.ts, so the plan the page shows is the plan board.json carries. */
(function () {
  'use strict';
  var R = window.RADAR;
  var app = document.getElementById('app');
  var foot = document.getElementById('foot-note');
  if (!R) { app.innerHTML = '<p class="empty">No radar data loaded.</p>'; return; }

  /* ---------- formatting ---------- */
  function fmtUsd(v) {
    if (v === null || v === undefined) return '—';
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (v >= 1e3) return '$' + (v / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(v);
  }
  function fmtInt(v) { return v === null || v === undefined ? '—' : Math.round(v).toLocaleString('en-US'); }
  function fmtPct(v) {
    if (v === null || v === undefined) return '—';
    var s = (v > 0 ? '+' : '') + v.toFixed(2) + '%';
    return '<span class="' + (v >= 0 ? 'up' : 'down') + '">' + s + '</span>';
  }
  function fmtAge(d) {
    if (d === null || d === undefined) return '—';
    if (d < 30) return d + 'd';
    if (d < 365) return Math.round(d / 30) + 'mo';
    return (d / 365).toFixed(1) + 'y';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function chainOf(p) { return p.chains.length > 0 ? p.chains[0] : 'its main chain'; }
  function capitalFor(p) {
    if (p.tvl_usd >= 5e9) return 250;
    if (p.tvl_usd >= 1e9) return 150;
    if (p.tvl_usd >= 1e8) return 100;
    return 50;
  }
  function holdDaysFor(age) {
    if (age === null || age === undefined) return 30;
    if (age < 180) return 60;
    if (age < 365) return 45;
    return 30;
  }

  /* ---------- farm plan (same rules as lib/model.ts) ---------- */
  function actionFor(p, capital, chain) {
    var c = (p.category || '').toLowerCase();
    var name = p.name;
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0)
      return 'Supply $' + capital + ' of USDC to ' + name + ' on ' + chain + ', then borrow $20 of a stable asset against it and repay the loan.';
    if (c.indexOf('dex') >= 0 || c.indexOf('liquidity manager') >= 0 || c.indexOf('leveraged farm') >= 0)
      return 'Provide $' + capital + ' of liquidity to ' + name + '\'s main pool on ' + chain + ' and swap $10 through the pool once a week.';
    if (c.indexOf('bridge') >= 0 || c.indexOf('cross chain') >= 0)
      return 'Bridge $' + capital + ' of USDC to ' + chain + ' through ' + name + ', then bridge $10 back the other way a week later.';
    if (c.indexOf('stak') >= 0 || c.indexOf('restak') >= 0)
      return 'Stake $' + capital + ' of the chain\'s staking asset through ' + name + ' on ' + chain + ' and keep the receipt token in the wallet.';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('basis trad') >= 0)
      return 'Deposit $' + capital + ' of USDC as margin on ' + name + ' and open then close one small hedged trade.';
    if (c.indexOf('prediction') >= 0)
      return 'Fund $' + capital + ' on ' + name + ' and place one small position on a market that settles within the month.';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('risk') >= 0)
      return 'Deposit $' + capital + ' into a ' + name + ' vault on ' + chain + ' and keep the vault shares in the wallet.';
    if (c.indexOf('yield aggregator') >= 0 || c.indexOf('yield') >= 0)
      return 'Deposit $' + capital + ' into ' + name + '\'s main vault on ' + chain + ' and claim the vault\'s yield once, then re-deposit it.';
    if (c.indexOf('stable') >= 0)
      return 'Mint $' + capital + ' of the stable asset through ' + name + ' on ' + chain + ' and hold it in the wallet for the full period.';
    if (c.indexOf('rwa') >= 0)
      return 'Mint $' + capital + ' of the protocol\'s yield-bearing asset on ' + chain + ' through ' + name + ' and hold it.';
    if (c.indexOf('insurance') >= 0)
      return 'Buy $' + capital + ' of cover from ' + name + ' on ' + chain + ' and keep the policy active for the full period.';
    if (c.indexOf('index') >= 0)
      return 'Buy $' + capital + ' of the ' + name + ' index on ' + chain + ' and hold the index tokens in the wallet.';
    if (c.indexOf('payment') >= 0 || c.indexOf('card') >= 0)
      return 'Move $' + capital + ' through ' + name + ' on ' + chain + ' and make one payment with the protocol\'s card or rail.';
    if (c.indexOf('farm') >= 0)
      return 'Deposit $' + capital + ' into ' + name + '\'s farm on ' + chain + ' and harvest the farm\'s rewards once.';
    if (c.indexOf('otc') >= 0)
      return 'Complete one $' + capital + ' trade on ' + name + '\'s OTC desk on ' + chain + ' and keep the settlement receipt.';
    if (c.indexOf('governance') >= 0)
      return 'Lock $' + capital + ' of assets in ' + name + '\'s governance on ' + chain + ' and vote once on an open proposal.';
    if (c.indexOf('chain') >= 0 || c.indexOf('btc') >= 0 || c.indexOf('anchor') >= 0)
      return 'Use $' + capital + ' of assets in ' + name + ' on ' + chain + ' and keep the position open for the full period.';
    return 'Deposit $' + capital + ' of USDC into ' + name + ' on ' + chain + ' and keep the position open.';
  }
  function weeklyFor(p) {
    var c = (p.category || '').toLowerCase();
    if (c.indexOf('lend') >= 0 || c.indexOf('cdp') >= 0 || c.indexOf('collateral') >= 0) return 'one deposit, borrow or repay';
    if (c.indexOf('dex') >= 0 || c.indexOf('liquidity manager') >= 0 || c.indexOf('leveraged farm') >= 0) return 'one swap or liquidity adjustment';
    if (c.indexOf('bridge') >= 0 || c.indexOf('cross chain') >= 0) return 'one bridge transfer';
    if (c.indexOf('stak') >= 0 || c.indexOf('restak') >= 0) return 'one stake, unstake or reward claim';
    if (c.indexOf('perpetual') >= 0 || c.indexOf('derivative') >= 0 || c.indexOf('basis trad') >= 0) return 'one trade, opened and closed';
    if (c.indexOf('prediction') >= 0) return 'one market position';
    if (c.indexOf('curator') >= 0 || c.indexOf('allocator') >= 0 || c.indexOf('risk') >= 0) return 'one vault deposit or withdrawal';
    if (c.indexOf('yield') >= 0) return 'one deposit or yield claim';
    if (c.indexOf('stable') >= 0 || c.indexOf('rwa') >= 0) return 'one mint or transfer';
    if (c.indexOf('insurance') >= 0) return 'one policy check or renewal';
    if (c.indexOf('index') >= 0) return 'one buy or rebalance';
    if (c.indexOf('payment') >= 0 || c.indexOf('card') >= 0) return 'one payment';
    if (c.indexOf('farm') >= 0) return 'one harvest';
    if (c.indexOf('governance') >= 0) return 'one vote or delegation check';
    return 'one deposit, swap or vote';
  }
  function stepText(step) {
    var s = step.text + ' Cost: ' + step.cost + '. Time: ' + step.time + '.';
    if (s.length > 600) s = s.slice(0, 596) + '...';
    if (s.length < 20) s += ' Hold the position and check the protocol\'s own page.';
    return s;
  }
  function farmSteps(p) {
    var chain = chainOf(p);
    var capital = capitalFor(p);
    var hold = holdDaysFor(p.age_days);
    var weekly = weeklyFor(p);
    return [
      { text: 'Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.', cost: 'under $3 of gas for the first transaction', time: '5 minutes' },
      { text: actionFor(p, capital, chain), cost: '$' + capital + ' of capital and about $' + (capital >= 150 ? 8 : 4) + ' of gas', time: '15 minutes to set up' },
      { text: 'Make one qualifying action each week, such as ' + weekly + ', so the wallet stays active.', cost: 'about $2 of gas a week', time: '10 minutes a week' },
      { text: 'Hold the position for at least ' + hold + ' days so the activity is counted in more than one snapshot.', cost: 'the $' + capital + ' stays in the position', time: hold + ' days' },
      { text: 'Before you withdraw, open the protocol\'s own points or rewards page and claim only from the link it publishes.', cost: 'no fee to check, and never pay to claim', time: '10 minutes' },
      { text: 'Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.', cost: 'nothing but the log', time: '5 minutes' }
    ].map(stepText);
  }

  /* ---------- routing ---------- */
  function parseHash() {
    var h = location.hash || '#/';
    var raw = h.slice(1);
    var qi = raw.indexOf('?');
    var path = qi >= 0 ? raw.slice(0, qi) : raw;
    var params = {};
    if (qi >= 0) {
      raw.slice(qi + 1).split('&').forEach(function (kv) {
        var eq = kv.indexOf('=');
        if (eq > 0) params[decodeURIComponent(kv.slice(0, eq))] = decodeURIComponent(kv.slice(eq + 1));
      });
    }
    var parts = path.split('/').filter(Boolean);
    if (parts[0] === 'protocol' && parts[1]) return { view: 'protocol', slug: parts[1], params: params };
    if (parts[0] === 'live') return { view: 'live', params: params };
    if (parts[0] === 'model') return { view: 'model', params: params };
    return { view: 'board', params: params };
  }
  function navOn(view) {
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      a.classList.toggle('on', a.getAttribute('data-nav') === view || (view === 'protocol' && a.getAttribute('data-nav') === 'board'));
    });
  }

  /* ---------- shared bits ---------- */
  var watchSet = {};
  (R.watchlist || []).forEach(function (s) { watchSet[s] = true; });
  function isWatch(slug) { return !!watchSet[slug]; }
  var topImplied = R.rows.length ? R.rows[0].implied_value_usd : 1;
  function rowHtml(r) {
    var pct = (r.implied_value_usd / topImplied) * 100;
    return '<tr data-slug="' + esc(r.slug) + '">' +
      '<td><span class="rank">' + r.rank + '</span></td>' +
      '<td><a class="name" href="#protocol/' + esc(r.slug) + '">' + esc(r.name) + '</a><small>' + esc(r.slug) + (isWatch(r.slug) ? ' &middot; watchlist' : '') + '</small></td>' +
      '<td><span class="pill">' + esc(r.category || '—') + '</span></td>' +
      '<td>' + esc(r.chains.slice(0, 2).join(', ')) + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '') + '</td>' +
      '<td class="num">' + fmtUsd(r.tvl_usd) + '</td>' +
      '<td class="num">' + fmtPct(r.change_7d) + '</td>' +
      '<td class="num">' + fmtAge(r.age_days) + '</td>' +
      '<td class="num"><b>' + fmtUsd(r.implied_value_usd) + '</b><div class="bar"><i style="width:' + Math.max(2, pct).toFixed(1) + '%"></i></div></td>' +
      '</tr>';
  }
  function statsHtml() {
    var pre = R.rows.length;
    var tvl = R.rows.reduce(function (a, r) { return a + r.tvl_usd; }, 0);
    var med = R.rows.slice().sort(function (a, b) { return a.implied_value_usd - b.implied_value_usd; })[Math.floor(R.rows.length / 2)];
    return '<div class="stats">' +
      '<div class="stat"><b>' + R.board_size + '</b><span>protocols ranked</span></div>' +
      '<div class="stat"><b>' + R.watchlist_size + '</b><span>watchlist covered</span></div>' +
      '<div class="stat"><b>' + R.early_size + '</b><span>early finds below the floor</span></div>' +
      '<div class="stat"><b>' + fmtUsd(tvl) + '</b><span>combined TVL ranked</span></div>' +
      '<div class="stat"><b>' + fmtUsd(med ? med.implied_value_usd : 0) + '</b><span>median implied value</span></div>' +
      '</div>';
  }

  /* ---------- board ---------- */
  var shown = 100;
  function renderBoard(params) {
    navOn('board');
    var cats = {};
    R.rows.forEach(function (r) { cats[r.category || '—'] = true; });
    var chains = {};
    R.rows.forEach(function (r) { r.chains.forEach(function (c) { chains[c] = true; }); });
    var catOpts = '<option value="">All categories</option>' + Object.keys(cats).sort().map(function (c) {
      return '<option value="' + esc(c) + '"' + (params.category === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
    var chainOpts = '<option value="">All chains</option>' + Object.keys(chains).sort().map(function (c) {
      return '<option value="' + esc(c) + '"' + (params.chain === c ? ' selected' : '') + '>' + esc(c) + '</option>';
    }).join('');
    var minTvl = params.minTvl ? Number(params.minTvl) : 0;
    var minOpts = [[0, 'Any TVL'], [1e7, 'TVL ≥ $10M'], [5e7, 'TVL ≥ $50M'], [1e8, 'TVL ≥ $100M'], [5e8, 'TVL ≥ $500M'], [1e9, 'TVL ≥ $1B']].map(function (o) {
      return '<option value="' + o[0] + '"' + (minTvl === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');
    var sort = params.sort || 'rank';
    var sortOpts = [['rank', 'Sort: rank'], ['implied', 'Sort: implied value'], ['tvl', 'Sort: TVL'], ['growth', 'Sort: 7-day growth'], ['age', 'Sort: age']].map(function (o) {
      return '<option value="' + o[0] + '"' + (sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
    }).join('');
    var html = statsHtml() +
      '<p class="note"><b>How to read this board.</b> Every row is a protocol whose record shows no token yet. ' +
      'Implied value is the model\u2019s claim for what its token would be worth if the protocol\u2019s record stayed as it is ' +
      '(TVL \u00d7 its category\u2019s market multiple, then growth, age and reach). It is not a prediction that a token comes. ' +
      'Click a row for the model math and a farm plan.</p>' +
      '<div class="controls">' +
      '<input type="search" id="q" placeholder="Search name or slug\u2026" value="' + esc(params.q || '') + '">' +
      '<select id="category">' + catOpts + '</select>' +
      '<select id="chain">' + chainOpts + '</select>' +
      '<select id="minTvl">' + minOpts + '</select>' +
      '<select id="sort">' + sortOpts + '</select>' +
      '<label><input type="checkbox" id="watchlist" ' + (params.watchlist ? 'checked' : '') + '> Watchlist only</label>' +
      '<span class="count" id="count"></span>' +
      '</div>' +
      '<table><thead><tr><th>#</th><th>Protocol</th><th>Category</th><th>Chains</th><th class="num">TVL</th><th class="num">7d</th><th class="num">Age</th><th class="num">Implied value</th></tr></thead><tbody id="tbody"></tbody></table>' +
      '<p style="margin-top:12px"><button class="btn" id="more">Show all rows</button></p>';
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
    var tbody = document.getElementById('tbody');
    var countEl = document.getElementById('count');
    var moreBtn = document.getElementById('more');
    function currentRows() {
      var q = (document.getElementById('q').value || '').toLowerCase();
      var cat = document.getElementById('category').value;
      var ch = document.getElementById('chain').value;
      var min = Number(document.getElementById('minTvl').value || 0);
      var s = document.getElementById('sort').value;
      var wl = document.getElementById('watchlist').checked;
      var rows = R.rows.filter(function (r) {
        if (q && r.name.toLowerCase().indexOf(q) < 0 && r.slug.indexOf(q) < 0) return false;
        if (cat && (r.category || '—') !== cat) return false;
        if (ch && r.chains.indexOf(ch) < 0) return false;
        if (min && r.tvl_usd < min) return false;
        if (wl && !isWatch(r.slug)) return false;
        return true;
      });
      var by = {
        rank: function (a, b) { return a.rank - b.rank; },
        implied: function (a, b) { return b.implied_value_usd - a.implied_value_usd; },
        tvl: function (a, b) { return b.tvl_usd - a.tvl_usd; },
        growth: function (a, b) { return (b.change_7d || 0) - (a.change_7d || 0); },
        age: function (a, b) { return (b.age_days || 0) - (a.age_days || 0); }
      }[s] || function (a, b) { return a.rank - b.rank; };
      return rows.slice().sort(by);
    }
    function draw() {
      var rows = currentRows();
      var list = rows.slice(0, shown);
      tbody.innerHTML = list.map(rowHtml).join('') || '<tr><td colspan="8" class="empty">No protocols match these filters.</td></tr>';
      countEl.textContent = 'Showing ' + list.length + ' of ' + rows.length + ' protocols';
      moreBtn.style.display = rows.length > shown ? '' : 'none';
    }
    ['q', 'category', 'chain', 'minTvl', 'sort', 'watchlist'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', function () { shown = 100; draw(); });
    });
    moreBtn.addEventListener('click', function () { shown = 100000; draw(); });
    draw();
  }

  /* ---------- detail ---------- */
  function renderProtocol(slug) {
    navOn('protocol');
    var r = null;
    for (var i = 0; i < R.rows.length; i++) if (R.rows[i].slug === slug) { r = R.rows[i]; break; }
    if (!r) { app.innerHTML = '<p class="empty">No protocol named ' + esc(slug) + ' on this board. <a href="#/">Back to the board</a></p>'; return; }
    var peers = R.live.filter(function (l) { return l.category === r.category; }).slice(0, 5);
    var steps = farmSteps(r);
    var html = '<p><a href="#/">&larr; Back to the board</a></p>' +
      '<div class="detail"><h2>' + esc(r.name) + '</h2>' +
      '<p class="meta">Rank #' + r.rank + ' &middot; ' + esc(r.category || '—') + ' &middot; ' + esc(r.chains.join(', ')) +
      ' &middot; TVL ' + fmtUsd(r.tvl_usd) + ' &middot; 7d ' + fmtPct(r.change_7d) + ' &middot; listed ' + esc(r.listed_at || 'unknown') + '</p>' +
      '<div class="math">' +
      '<div><b>' + fmtUsd(r.implied_value_usd) + '</b><span>implied value</span></div>' +
      '<div><b>' + fmtUsd(r.base_value_usd) + '</b><span>base: TVL &times; ' + r.multiple.toFixed(3) + ' multiple</span></div>' +
      '<div><b>&times;' + r.growth_multiplier.toFixed(2) + '</b><span>growth (' + (r.change_7d === null ? 'n/a' : r.change_7d.toFixed(2) + '%') + ' over 7d)</span></div>' +
      '<div><b>&times;' + r.maturity_multiplier.toFixed(2) + '</b><span>maturity (' + fmtAge(r.age_days) + ' with no token)</span></div>' +
      '<div><b>&times;' + r.breadth_multiplier.toFixed(2) + '</b><span>reach (' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + ')</span></div>' +
      '</div>' +
      '<h3>Why it ranks here</h3><p>' + esc(r.name) + ' records no token, holds ' + fmtUsd(r.tvl_usd) + ' of TVL' +
      (r.change_7d !== null ? ' (' + (r.change_7d >= 0 ? 'up ' : 'down ') + Math.abs(r.change_7d).toFixed(2) + '% over seven days)' : '') +
      ' and has run ' + (r.age_days === null ? 'an unrecorded time' : fmtAge(r.age_days)) + ' with no token. ' +
      (r.multiple_peers >= R.model.min_peers
        ? 'Protocols in its category trade at a median ' + r.multiple.toFixed(3) + '&times; TVL, so its base is ' + fmtUsd(r.base_value_usd)
        : 'Its category has too few live peers for a category multiple, so the global median ' + r.multiple.toFixed(3) + '&times; applies and its base is ' + fmtUsd(r.base_value_usd)) +
      '; growth, age and reach take it to ' + fmtUsd(r.implied_value_usd) + '.</p>' +
      '<h3>Farm plan</h3><ol class="steps">' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
      (peers.length ? '<h3>What its category trades at</h3><table class="mini"><thead><tr><th>Protocol</th><th class="num">TVL</th><th class="num">Market cap</th><th class="num">Multiple</th></tr></thead><tbody>' +
        peers.map(function (l) { return '<tr><td>' + esc(l.name) + '</td><td class="num">' + fmtUsd(l.tvl_usd) + '</td><td class="num">' + fmtUsd(l.mcap_usd) + '</td><td class="num">' + (l.multiple === null ? '—' : l.multiple.toFixed(3) + '&times;') + '</td></tr>'; }).join('') +
        '</tbody></table><p style="color:var(--muted)">Live-token peers in the same category, by market cap. ' + (peers.length >= R.model.min_peers ? 'Their median multiple is what the model applies above.' : 'Fewer than ' + R.model.min_peers + ' live peers in this category, so the model applies the global median instead.') + '</p>' : '') +
      '</div>';
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
  }

  /* ---------- live ---------- */
  function renderLive() {
    navOn('live');
    var html = statsHtml() +
      '<p class="note"><b>These already trade.</b> Live-token protocols are shown at the market\u2019s own values, never mixed into the ranked board. ' +
      'Their market-cap-to-TVL ratios are what the model\u2019s category multiples are taken from.</p>' +
      '<table><thead><tr><th>Protocol</th><th>Category</th><th>Chains</th><th class="num">TVL</th><th class="num">Market cap</th><th class="num">7d</th><th class="num">Multiple</th></tr></thead><tbody>' +
      R.live.map(function (l) {
        return '<tr><td><span class="name">' + esc(l.name) + '</span><small>' + esc(l.slug) + '</small></td>' +
          '<td><span class="pill">' + esc(l.category || '—') + '</span></td>' +
          '<td>' + esc(l.chains.slice(0, 2).join(', ')) + '</td>' +
          '<td class="num">' + fmtUsd(l.tvl_usd) + '</td>' +
          '<td class="num">' + fmtUsd(l.mcap_usd) + '</td>' +
          '<td class="num">' + fmtPct(l.change_7d) + '</td>' +
          '<td class="num">' + (l.multiple === null ? '—' : l.multiple.toFixed(3) + '&times;') + '</td></tr>';
      }).join('') + '</tbody></table>';
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
  }

  /* ---------- model ---------- */
  function renderModel() {
    navOn('model');
    var m = R.model;
    var rows = R.multiples.map(function (x) {
      return '<tr><td>' + esc(x.category) + '</td><td class="num">' + x.peers + '</td><td class="num">' + x.multiple.toFixed(3) + '&times;</td><td>' + (x.from_global ? 'global median' : 'category median') + '</td></tr>';
    }).join('');
    var html = '<div class="model-grid"><div class="card"><h2>The model, radar-2</h2>' +
      '<p>Implied value follows from the snapshot\u2019s own figures only: a protocol\u2019s TVL, its seven-day growth, and how long it has run with no token. No name is ever special-cased.</p>' +
      '<p class="formula">implied = TVL &times; multiple &times; growth &times; maturity &times; breadth</p>' +
      '<ul>' +
      '<li><b>Multiple.</b> The median market-cap-to-TVL of live-token protocols in the same category, in this snapshot. Categories with fewer than ' + m.min_peers + ' live peers use the global median (' + R.global_multiple.toFixed(3) + '&times;). Clamped to ' + m.multiple_floor + '&ndash;' + m.multiple_cap + '&times;.</li>' +
      '<li><b>Growth.</b> 1 + (7-day change &times; ' + m.growth_weight + '), change clamped to ' + m.growth_floor + '%&hellip;' + m.growth_cap + '%. A drop past ' + m.flight_threshold + '% takes a further &times;' + m.flight_penalty + ' flight penalty.</li>' +
      '<li><b>Maturity.</b> Young protocols (under ' + m.maturity_young_days + ' days) score 0.55&ndash;0.70; it rises to 1.00 at ' + (m.maturity_days / 365).toFixed(0) + ' years, then to 1.10 for the longest-running. Unknown age scores ' + m.unknown_age_multiplier + '.</li>' +
      '<li><b>Breadth.</b> &times;' + m.breadth_three + ' on 3&ndash;4 chains, &times;' + m.breadth_five + ' on 5 or more.</li>' +
      '<li><b>Excluded.</b> Exchanges, bridges and liquid-staking products, and any name carrying wrapped, staked or staking or beginning with an exchange\u2019s name: a wrapped product of a token that already trades is not a protocol awaiting its own launch.</li>' +
      '</ul>' +
      '<p>A protocol that records no token is called pre-token, never tokenless: the snapshot\u2019s record is not proof it has none.</p>' +
      '</div>' +
      '<div class="card"><h2>Category multiples</h2>' +
      '<table class="mini"><thead><tr><th>Category</th><th class="num">Peers</th><th class="num">Multiple</th><th>Source</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p>Categories not listed here had fewer than ' + m.min_peers + ' live peers and use the global median of ' + R.global_multiple.toFixed(3) + '&times;.</p>' +
      '</div></div>';
    app.innerHTML = html;
    app.setAttribute('aria-busy', 'false');
  }

  /* ---------- boot ---------- */
  foot.textContent = 'Snapshot as of ' + R.as_of + ' · floor $' + fmtInt(R.floor_usd) + ' · source: ' + R.source + ' · ' + R.board_size + ' protocols ranked, ' + R.live_size + ' live tokens set aside.';
  function route() {
    var r = parseHash();
    if (r.view === 'protocol') renderProtocol(r.slug);
    else if (r.view === 'live') renderLive();
    else if (r.view === 'model') renderModel();
    else renderBoard(r.params);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
