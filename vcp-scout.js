/* ═══════════════════════════════════════════════════════════════════════════
   VCP Scout — Site Assistant Chatbot
   Helps veterans find resources across veterancareerpath.com
   Uses Claude Haiku via existing Vercel proxy + search_index.json
   ═══════════════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var PROXY = 'https://vcp-proxy.vercel.app/api/claude';
  var IDX_URL = 'https://veterancareerpath.com/search_index.json';
  var BOT_NAME = 'Scout';
  var siteIndex = null;
  var chatHistory = [];
  var isOpen = false;
  var isLoading = false;

  // ── Build Widget HTML ──
  function init() {
    // Floating button
    var btn = document.createElement('div');
    btn.id = 'scout-btn';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a1628" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    btn.title = 'Ask Scout — find anything on this site';
    btn.onclick = toggleChat;
    document.body.appendChild(btn);

    // Chat panel
    var panel = document.createElement('div');
    panel.id = 'scout-panel';
    panel.innerHTML =
      '<div id="scout-header">' +
        '<div id="scout-title"><strong>' + BOT_NAME + '</strong> <span style="opacity:.6;font-size:.72rem;">Site Assistant</span></div>' +
        '<button id="scout-close" onclick="document.getElementById(\'scout-panel\').classList.remove(\'open\');document.getElementById(\'scout-btn\').classList.remove(\'hide\');">&times;</button>' +
      '</div>' +
      '<div id="scout-msgs">' +
        '<div class="scout-msg bot">Hey! I\'m ' + BOT_NAME + '. I know every page on this site. Ask me anything — career resources, VA benefits, MOS guides, tools, or help finding what you need.</div>' +
      '</div>' +
      '<div id="scout-input-wrap">' +
        '<input id="scout-input" type="text" placeholder="Ask me anything..." autocomplete="off">' +
        '<button id="scout-send" onclick="window._scoutSend()">&#10148;</button>' +
      '</div>';
    document.body.appendChild(panel);

    // Enter key
    document.getElementById('scout-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); window._scoutSend(); }
    });

    // Inject CSS
    var style = document.createElement('style');
    style.textContent =
      '#scout-btn{position:fixed;bottom:20px;right:20px;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#f0c040,#e8aa10);box-shadow:0 4px 16px rgba(0,0,0,.25);cursor:pointer;z-index:9990;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;}' +
      '#scout-btn:hover{transform:scale(1.08);box-shadow:0 6px 24px rgba(0,0,0,.35);}' +
      '#scout-btn.hide{display:none;}' +
      '#scout-panel{position:fixed;bottom:80px;right:20px;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 120px);background:#0d1a2d;border:1px solid rgba(240,192,64,.2);border-radius:14px;box-shadow:0 12px 48px rgba(0,0,0,.5);z-index:9991;display:flex;flex-direction:column;overflow:hidden;opacity:0;pointer-events:none;transform:translateY(16px) scale(.95);transition:opacity .2s,transform .2s;}' +
      '#scout-panel.open{opacity:1;pointer-events:auto;transform:translateY(0) scale(1);}' +
      '#scout-header{background:#08111e;padding:.7rem 1rem;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(240,192,64,.15);}' +
      '#scout-title{color:#f0c040;font-size:.88rem;font-family:"Bebas Neue",sans-serif;letter-spacing:.08em;}' +
      '#scout-close{background:none;border:none;color:rgba(192,216,240,.5);font-size:1.3rem;cursor:pointer;padding:0 .3rem;line-height:1;}' +
      '#scout-close:hover{color:#fff;}' +
      '#scout-msgs{flex:1;overflow-y:auto;padding:.75rem;display:flex;flex-direction:column;gap:.6rem;}' +
      '.scout-msg{max-width:88%;padding:.6rem .85rem;border-radius:12px;font-size:.82rem;line-height:1.55;word-break:break-word;}' +
      '.scout-msg.bot{background:rgba(240,192,64,.08);border:1px solid rgba(240,192,64,.12);color:rgba(192,216,240,.85);align-self:flex-start;border-radius:12px 12px 12px 3px;}' +
      '.scout-msg.user{background:rgba(26,58,107,.5);border:1px solid rgba(26,58,107,.3);color:#e0eaf5;align-self:flex-end;border-radius:12px 12px 3px 12px;}' +
      '.scout-msg a{color:#f0c040;text-decoration:underline;}' +
      '.scout-msg a:hover{color:#fff;}' +
      '.scout-typing{align-self:flex-start;padding:.5rem .85rem;color:rgba(192,216,240,.4);font-size:.78rem;font-style:italic;}' +
      '#scout-input-wrap{display:flex;gap:.4rem;padding:.6rem .75rem;border-top:1px solid rgba(255,255,255,.06);background:rgba(0,0,0,.2);}' +
      '#scout-input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:.5rem .75rem;color:#e0eaf5;font-size:.85rem;font-family:inherit;outline:none;}' +
      '#scout-input:focus{border-color:rgba(240,192,64,.3);}' +
      '#scout-input::placeholder{color:rgba(192,216,240,.3);}' +
      '#scout-send{background:linear-gradient(135deg,#c8960a,#e8aa10);border:none;border-radius:8px;width:38px;min-width:38px;color:#0a1628;font-size:1rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;}' +
      '#scout-send:hover{opacity:.85;}' +
      '#scout-send:disabled{opacity:.4;cursor:default;}' +
      '@media(max-width:480px){#scout-panel{bottom:0;right:0;width:100%;max-width:100%;height:100vh;max-height:100vh;border-radius:0;}#scout-btn{bottom:16px;right:16px;width:48px;height:48px;}}';
    document.head.appendChild(style);
  }

  function toggleChat() {
    var panel = document.getElementById('scout-panel');
    var btn = document.getElementById('scout-btn');
    if (panel.classList.contains('open')) {
      panel.classList.remove('open');
      btn.classList.remove('hide');
    } else {
      panel.classList.add('open');
      btn.classList.add('hide');
      document.getElementById('scout-input').focus();
    }
  }

  // ── Load site index (lazy, on first message) ──
  function loadIndex(cb) {
    if (siteIndex) { cb(siteIndex); return; }
    fetch(IDX_URL).then(function(r) { return r.json(); }).then(function(data) {
      siteIndex = data;
      cb(data);
    }).catch(function() {
      siteIndex = [];
      cb([]);
    });
  }

  // ── Search index for relevant pages ──
  function searchIndex(idx, query) {
    var terms = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(' ').filter(function(t) { return t.length > 1; });
    if (!terms.length) return [];
    var results = [];
    for (var i = 0; i < idx.length; i++) {
      var p = idx[i];
      var title = (p.title || '').toLowerCase();
      var hay = (title + ' ' + (p.desc || '') + ' ' + (p.keywords || '') + ' ' + (p.text || '')).toLowerCase();
      var score = 0;
      // Exact title match gets massive boost
      var qLower = query.toLowerCase().trim();
      if (title.indexOf(qLower) >= 0) score += 200;
      // URL/slug match (e.g. "91b" matches "91b.html" or "mos/91b")
      var urlLower = (p.url || '').toLowerCase();
      if (urlLower.indexOf(qLower.replace(/\s+/g, '-')) >= 0 || urlLower.indexOf(qLower.replace(/\s+/g, '')) >= 0) score += 300;
      for (var j = 0; j < terms.length; j++) {
        var pos = 0, tc = 0;
        while ((pos = hay.indexOf(terms[j], pos)) >= 0) { tc++; pos++; }
        if (tc > 0) score += tc + (title.indexOf(terms[j]) >= 0 ? 15 : 0);
      }
      if (score > 0) results.push({ title: p.title, url: p.url, desc: (p.desc || '').slice(0, 100), score: score });
    }
    results.sort(function(a, b) { return b.score - a.score; });
    return results.slice(0, 8);
  }

  // ── Check if query is a direct page lookup (MOS code, specific term) ──
  function isDirectLookup(query, results) {
    if (!results.length) return false;
    // If top result has a very high score (URL or exact title match), it's a direct hit
    return results[0].score >= 200;
  }

  // ── Send message ──
  window._scoutSend = function() {
    var input = document.getElementById('scout-input');
    var q = input.value.trim();
    if (!q || isLoading) return;
    input.value = '';

    // Add user message
    addMsg(q, 'user');
    chatHistory.push({ role: 'user', content: q });
    isLoading = true;
    document.getElementById('scout-send').disabled = true;

    // Search site index for relevant pages FIRST
    loadIndex(function(idx) {
      var relevant = searchIndex(idx, q);

      // Direct match — show page links immediately without calling AI
      if (isDirectLookup(q, relevant)) {
        var html = 'Here\'s what I found:<br><br>';
        relevant.slice(0, 5).forEach(function(r) {
          html += '<a href="' + r.url + '">' + r.title + '</a>';
          if (r.desc) html += '<br><span style="font-size:.75rem;opacity:.6;">' + r.desc + '</span>';
          html += '<br><br>';
        });
        addMsg(html, 'bot');
        chatHistory.push({ role: 'assistant', content: html });
        isLoading = false;
        document.getElementById('scout-send').disabled = false;
        return;
      }

      // Show typing for AI call
      var typing = document.createElement('div');
      typing.className = 'scout-typing';
      typing.textContent = BOT_NAME + ' is thinking...';
      var msgs = document.getElementById('scout-msgs');
      msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;
      var context = 'You are ' + BOT_NAME + ', a helpful site assistant for veterancareerpath.com — a website with 800+ free resources for veterans transitioning to civilian careers. ';
      context += 'The site has: career assessments (PathFinder Pro $9.99 and Lite free), AI career tools ($15/mo subscription), VA disability guides, MOS-to-civilian translators for all branches, state benefits for all 50 states, GI Bill calculators, resume builders, interview prep, and more. ';
      context += 'Your job: help users find the right page or resource. Give direct links using the format [Page Title](https://veterancareerpath.com/page.html). ';
      context += 'Be concise (2-4 sentences max). Be warm but professional — these are veterans.\n\n';

      if (relevant.length > 0) {
        context += 'RELEVANT PAGES for this question:\n';
        relevant.forEach(function(r) {
          context += '- ' + r.title + ': ' + r.url + (r.desc ? ' — ' + r.desc : '') + '\n';
        });
      }

      context += '\nCurrent page: ' + window.location.pathname;

      // Build messages (keep last 6 exchanges to limit tokens)
      var messages = chatHistory.slice(-12).map(function(m) { return { role: m.role, content: m.content }; });

      fetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          system: context,
          messages: messages
        })
      }).then(function(r) {
        if (!r.ok) throw new Error('API error');
        return r.json();
      }).then(function(data) {
        var text = (data.content && data.content[0] && data.content[0].text) || "Sorry, I couldn't process that. Try rephrasing your question.";
        // Convert markdown links to HTML
        text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        typing.remove();
        addMsg(text, 'bot');
        chatHistory.push({ role: 'assistant', content: text });
      }).catch(function(err) {
        typing.remove();
        // Fallback: show search results without AI
        if (relevant.length > 0) {
          var fallback = "I found some pages that might help:<br>";
          relevant.slice(0, 4).forEach(function(r) {
            fallback += '• <a href="' + r.url + '">' + r.title + '</a><br>';
          });
          addMsg(fallback, 'bot');
        } else {
          addMsg("Sorry, I'm having trouble connecting. Try the search bar at the top of the page, or browse the <a href=\"/\">full site menu</a>.", 'bot');
        }
      }).finally(function() {
        isLoading = false;
        document.getElementById('scout-send').disabled = false;
      });
    });
  };

  function addMsg(html, type) {
    var msgs = document.getElementById('scout-msgs');
    var div = document.createElement('div');
    div.className = 'scout-msg ' + type;
    div.innerHTML = html;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  // ── Init on DOM ready ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
