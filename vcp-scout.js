/*
   VCP Scout Site Assistant Chatbot
   Helps veterans find resources across veterancareerpath.com.
   Uses the shared secure AI client only when server authorization is available.
*/
(function () {
  'use strict';

  var IDX_URL = 'https://veterancareerpath.com/search_index.json';
  var BOT_NAME = 'Scout';
  var siteIndex = null;
  var chatHistory = [];
  var isLoading = false;

  function init() {
    var btn = document.createElement('div');
    btn.id = 'scout-btn';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0a1628" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    btn.title = 'Ask Scout to find anything on this site';
    btn.onclick = toggleChat;
    document.body.appendChild(btn);

    var panel = document.createElement('div');
    panel.id = 'scout-panel';
    panel.innerHTML =
      '<div id="scout-header">' +
        '<div id="scout-title"><strong>' + BOT_NAME + '</strong> <span style="opacity:.6;font-size:.72rem;">Site Assistant</span></div>' +
        '<button id="scout-close" type="button" aria-label="Close Scout">&times;</button>' +
      '</div>' +
      '<div id="scout-msgs">' +
        '<div class="scout-msg bot">Hey! I\'m ' + BOT_NAME + '. I can help find pages on this site. Ask me about career resources, VA benefits, MOS guides, tools, or anything else here.</div>' +
      '</div>' +
      '<div id="scout-input-wrap">' +
        '<input id="scout-input" type="text" placeholder="Ask me anything..." autocomplete="off" aria-label="Ask Scout">' +
        '<button id="scout-send" type="button" aria-label="Send Scout message">&#10148;</button>' +
      '</div>';
    document.body.appendChild(panel);

    document.getElementById('scout-close').addEventListener('click', toggleChat);
    document.getElementById('scout-send').addEventListener('click', window._scoutSend);
    document.getElementById('scout-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        window._scoutSend();
      }
    });

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

  function loadIndex(cb) {
    if (siteIndex) {
      cb(siteIndex);
      return;
    }
    fetch(IDX_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        siteIndex = data;
        cb(data);
      })
      .catch(function () {
        siteIndex = [];
        cb([]);
      });
  }

  function searchIndex(idx, query) {
    var terms = query.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').trim().split(' ').filter(function (t) {
      return t.length > 1;
    });
    if (!terms.length) return [];

    var results = [];
    var qLower = query.toLowerCase().trim();
    for (var i = 0; i < idx.length; i++) {
      var p = idx[i];
      var title = String(p.title || '').toLowerCase();
      var hay = (title + ' ' + (p.desc || '') + ' ' + (p.keywords || '') + ' ' + (p.text || '')).toLowerCase();
      var score = 0;
      if (title.indexOf(qLower) >= 0) score += 200;
      var urlLower = String(p.url || '').toLowerCase();
      if (urlLower.indexOf(qLower.replace(/\s+/g, '-')) >= 0 || urlLower.indexOf(qLower.replace(/\s+/g, '')) >= 0) score += 300;
      for (var j = 0; j < terms.length; j++) {
        var pos = 0;
        var tc = 0;
        while ((pos = hay.indexOf(terms[j], pos)) >= 0) {
          tc++;
          pos++;
        }
        if (tc > 0) score += tc + (title.indexOf(terms[j]) >= 0 ? 15 : 0);
      }
      if (score > 0) {
        results.push({
          title: p.title,
          url: p.url,
          desc: String(p.desc || '').slice(0, 100),
          score: score
        });
      }
    }
    results.sort(function (a, b) { return b.score - a.score; });
    return results.slice(0, 8);
  }

  function isDirectLookup(query, results) {
    return results.length > 0 && results[0].score >= 200;
  }

  window._scoutSend = function () {
    var input = document.getElementById('scout-input');
    var q = input.value.trim();
    if (!q || isLoading) return;
    input.value = '';

    addMsg(q, 'user', false);
    chatHistory.push({ role: 'user', content: q });
    isLoading = true;
    document.getElementById('scout-send').disabled = true;

    loadIndex(function (idx) {
      var relevant = searchIndex(idx, q);

      if (isDirectLookup(q, relevant)) {
        showSearchResults(relevant, "Here's what I found:");
        finishLoading();
        return;
      }

      var typing = document.createElement('div');
      typing.className = 'scout-typing';
      typing.textContent = BOT_NAME + ' is thinking...';
      var msgs = document.getElementById('scout-msgs');
      msgs.appendChild(typing);
      msgs.scrollTop = msgs.scrollHeight;

      if (!window.VCBSecureApi) {
        typing.remove();
        showFallback(relevant);
        finishLoading();
        return;
      }

      var context = 'You are ' + BOT_NAME + ', a helpful site assistant for veterancareerpath.com. ';
      context += 'The site has career assessments, AI career tools, VA disability guides, MOS-to-civilian translators, state benefits, GI Bill calculators, resume builders, interview prep, and related transition resources. ';
      context += 'Help users find the right page or resource. Give direct links using the format [Page Title](https://veterancareerpath.com/page.html). ';
      context += 'Be concise, usually 2-4 sentences. Be professional and practical for veterans and military families.\n\n';
      if (relevant.length > 0) {
        context += 'RELEVANT PAGES for this question:\n';
        relevant.forEach(function (r) {
          context += '- ' + r.title + ': ' + r.url + (r.desc ? ', ' + r.desc : '') + '\n';
        });
      }
      context += '\nCurrent page: ' + window.location.pathname;

      window.VCBSecureApi.callClaude(
        chatHistory.slice(-12).map(function (m) {
          return m.role.toUpperCase() + ': ' + m.content;
        }).join('\n'),
        context,
        300
      ).then(function (text) {
        typing.remove();
        text = text || "Sorry, I could not process that. Try rephrasing your question.";
        var safe = renderSafeLinks(text);
        addMsg(safe, 'bot', true);
        chatHistory.push({ role: 'assistant', content: String(text) });
      }).catch(function () {
        typing.remove();
        showFallback(relevant);
      }).finally(finishLoading);
    });
  };

  function showSearchResults(relevant, heading) {
    var html = escapeHtml(heading) + '<br><br>';
    relevant.slice(0, 5).forEach(function (r) {
      html += '<a href="' + safeUrl(r.url) + '">' + escapeHtml(r.title) + '</a>';
      if (r.desc) html += '<br><span style="font-size:.75rem;opacity:.6;">' + escapeHtml(r.desc) + '</span>';
      html += '<br><br>';
    });
    addMsg(html, 'bot', true);
    chatHistory.push({ role: 'assistant', content: heading });
  }

  function showFallback(relevant) {
    if (relevant.length > 0) {
      showSearchResults(relevant.slice(0, 4), 'I found some pages that might help:');
    } else {
      addMsg('Sorry, I could not connect to AI. Try the search bar at the top of the page, or browse the <a href="/">full site menu</a>.', 'bot', true);
    }
  }

  function finishLoading() {
    isLoading = false;
    document.getElementById('scout-send').disabled = false;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeUrl(url) {
    var value = String(url || '').trim();
    if (/^https:\/\/veterancareerpath\.com\//i.test(value)) return value;
    if (/^\/[a-z0-9/_-]+\.html(?:#[a-z0-9_-]+)?$/i.test(value)) return value;
    if (/^\/[a-z0-9/_-]+\/?$/i.test(value)) return value;
    return '/';
  }

  function renderSafeLinks(text) {
    return escapeHtml(text).replace(/\[([^\]]+)\]\((https:\/\/veterancareerpath\.com\/[^)\s"&<>]+)\)/g, function (_, label, url) {
      return '<a href="' + safeUrl(url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(label) + '</a>';
    });
  }

  function addMsg(html, type, trusted) {
    var msgs = document.getElementById('scout-msgs');
    var div = document.createElement('div');
    div.className = 'scout-msg ' + type;
    if (trusted) {
      div.innerHTML = html;
    } else {
      div.textContent = String(html || '');
    }
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
