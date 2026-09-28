/* Mairrô Semijoias — prévia v4 (28/09/2026), ZELES. Uma página, rotas por "#/".
   Toda imagem passa por img() pra que o arquivo único troque o caminho por data: sem cirurgia.
   Armadilhas da casa respeitadas aqui (skill zeles-site-de-cliente):
   - scrollTo sempre com behavior 'instant' (o smooth contamina);
   - gaveta fechada com visibility hidden + pointer-events (fantasma clicável);
   - revelação por rolagem uma vez só, com folga no pé (rootMargin -15%);
   - WhatsApp sem número configurado NÃO vira wa.me vazio: na prévia mostra a mensagem que iria. */
(function () {
  'use strict';
  var D = window.MAIRRO;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var img = function (p) { return (window.__IMG && window.__IMG[p]) || p; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var CATS = D.categorias;
  var porSlug = {}; D.produtos.forEach(function (p) { porSlug[p.slug] = p; });

  /* ---------- grafismo do designer em todo lugar marcado ---------- */
  var G = D.grafismo.map(function (g) { return '<path transform="' + g.t + '" d="' + g.d + '"/>'; }).join('');
  function pintaGrafismos(r) { $$('svg[data-grafismo]', r).forEach(function (s) { if (!s.firstChild) s.innerHTML = G; }); }
  pintaGrafismos();

  /* ---------- abertura: desenha o grafismo; pula no toque; não repete na mesma visita ---------- */
  (function abertura() {
    var body = document.body, nav = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0]) || {};
    var viu = false; try { viu = sessionStorage.getItem('mairro-abertura') === '1'; } catch (e) {}
    var reduz = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if ((viu && nav.type !== 'reload') || reduz || location.hash.length > 2) { body.classList.remove('abrindo'); body.classList.add('sem-abertura'); requestAnimationFrame(function () { body.classList.remove('sem-abertura'); body.classList.add('pronto'); }); return; }
    $$('#abertura path').forEach(function (p) { p.setAttribute('pathLength', '1'); });
    body.classList.add('anima');
    var fim = function () {
      if (!body.classList.contains('abrindo')) return;
      body.classList.remove('abrindo'); body.classList.add('pronto');
      try { sessionStorage.setItem('mairro-abertura', '1'); } catch (e) {}
      window.removeEventListener('pointerdown', fim, true); window.removeEventListener('wheel', fim, true); window.removeEventListener('keydown', fim, true);
    };
    setTimeout(fim, 3300);
    window.addEventListener('pointerdown', fim, { capture: true, passive: true });
    window.addEventListener('wheel', fim, { capture: true, passive: true });
    window.addEventListener('keydown', fim, true);
  })();

  /* ---------- seleção (lista de desejos que vira UMA mensagem de WhatsApp) ---------- */
  var sel = [];
  try { sel = JSON.parse(localStorage.getItem('mairro-selecao') || '[]').filter(function (s) { return porSlug[s]; }); } catch (e) {}
  function guardaSel() { try { localStorage.setItem('mairro-selecao', JSON.stringify(sel)); } catch (e) {} }
  function temSel(s) { return sel.indexOf(s) >= 0; }
  function alternaSel(s) {
    var i = sel.indexOf(s);
    if (i >= 0) sel.splice(i, 1); else sel.push(s);
    guardaSel(); contaSel();
    $$('[data-coracao="' + s + '"]').forEach(function (b) { b.classList.toggle('marcado', temSel(s)); b.setAttribute('aria-pressed', temSel(s)); });
    avisa(temSel(s) ? '<b>' + esc(porSlug[s].nome) + '</b> entrou nos favoritos.' : 'Saiu dos favoritos.');
    if ($('#gaveta-selecao').classList.contains('aberta')) desenhaSel();
  }
  function contaSel() { $('#abrir-selecao').classList.toggle('tem-item', sel.length > 0); } /* v6: coração sem número; cheio (Carmel) quando há favorito */
  function desenhaSel() {
    var corpo = $('#selecao-corpo');
    if (!sel.length) {
      corpo.innerHTML = '<div class="sel-vazia"><p>Toque no coração das peças que você gostou pra guardar aqui.</p><a class="btn btn-vazio" href="#/novidades" data-fecha-gaveta>Ver novidades</a></div>';
      return;
    }
    corpo.innerHTML = '<div class="sel-lista">' + sel.map(function (s) {
      var p = porSlug[s];
      return '<div class="sel-item"><a href="#/p/' + s + '" data-fecha-gaveta><img src="' + img(p.fotos[0]) + '" alt=""></a><div><b>' + esc(p.nome) + '</b><span>' + D.preco + '</span>' +
        (temSac(s) ? '<em class="na-sacola">na sacola</em>' : '<button class="por-sacola" data-sacola="' + s + '">pôr na sacola</button>') + '</div><button data-tira="' + s + '">tirar</button></div>';
    }).join('') + '</div>';
  }

  /* ---------- sacola (v6, pedido do Cassiano 28/09/2026): a mensagem única pro WhatsApp ---------- */
  var sac = [];
  try { sac = JSON.parse(localStorage.getItem('mairro-sacola') || '[]').filter(function (s) { return porSlug[s]; }); } catch (e) {}
  function guardaSac() { try { localStorage.setItem('mairro-sacola', JSON.stringify(sac)); } catch (e) {} }
  function temSac(s) { return sac.indexOf(s) >= 0; }
  function contaSac() {
    var b = $('#abrir-sacola'), c = $('#contador'), n = sac.length;
    c.textContent = n; c.hidden = !n;
    b.classList.toggle('tem-item', n > 0);
    document.documentElement.classList.toggle('sacola-cheia', n > 0);
    b.setAttribute('aria-label', n ? ('Sacola com ' + n + (n === 1 ? ' peça' : ' peças')) : 'Sacola vazia');
  }
  function pula(el) { if (!el) return; el.classList.remove('sacola-pulou'); void el.offsetWidth; el.classList.add('sacola-pulou'); }
  function poeSac(s, origem) {
    if (temSac(s)) { abreGaveta('#gaveta-sacola'); return; }
    sac.push(s); guardaSac(); contaSac();
    pula($('#abrir-sacola')); pula(origem);
    avisa('<b>' + esc(porSlug[s].nome) + '</b> entrou na sacola.');
    if ($('#gaveta-selecao').classList.contains('aberta')) desenhaSel();
    if ($('#gaveta-sacola').classList.contains('aberta')) desenhaSac();
  }
  function tiraSac(s) {
    var i = sac.indexOf(s); if (i >= 0) sac.splice(i, 1);
    guardaSac(); contaSac(); desenhaSac();
  }
  function desenhaSac() {
    var corpo = $('#sacola-corpo');
    if (!sac.length) {
      corpo.innerHTML = '<div class="sel-vazia"><p>Sua sacola está vazia. Na página da peça, toque na sacola: aqui as peças viram <b>uma mensagem só</b> pra loja, com nome e preço de cada uma.</p><a class="btn btn-vazio" href="#/novidades" data-fecha-gaveta>Ver novidades</a></div>';
      return;
    }
    corpo.innerHTML = '<div class="sel-lista">' + sac.map(function (s) {
      var p = porSlug[s];
      return '<div class="sel-item"><a href="#/p/' + s + '" data-fecha-gaveta><img src="' + img(p.fotos[0]) + '" alt=""></a><div><b>' + esc(p.nome) + '</b><span>' + D.preco + '</span></div><button data-tira-sacola="' + s + '">tirar</button></div>';
    }).join('') + '</div><div class="sel-pe"><button class="btn btn-cheio btn-bloco" id="manda-sel">' + icWhats + 'Enviar meu pedido</button><p>Vai pro WhatsApp da loja com as ' + sac.length + ' peça' + (sac.length > 1 ? 's' : '') + ' escritas.</p></div>';
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-coracao]'); if (c) { e.preventDefault(); alternaSel(c.getAttribute('data-coracao')); return; }
    var t = e.target.closest('[data-tira]'); if (t) { alternaSel(t.getAttribute('data-tira')); return; }
    var ps = e.target.closest('[data-sacola]'); if (ps) { e.preventDefault(); poeSac(ps.getAttribute('data-sacola'), ps.classList.contains('botao-sacola') ? ps : null); return; }
    var ts = e.target.closest('[data-tira-sacola]'); if (ts) { tiraSac(ts.getAttribute('data-tira-sacola')); return; }
    if (e.target.closest('#manda-sel')) {
      whats('Oi! Separei estas peças no site da Mairrô:\n' + sac.map(function (s, i) { return (i + 1) + '. ' + porSlug[s].nome + ' (' + D.preco + ')'; }).join('\n') + '\nEstão disponíveis?');
      return;
    }
    var w = e.target.closest('[data-whats]'); if (w) { e.preventDefault(); whats(w.getAttribute('data-whats')); return; }
    if (e.target.closest('[data-fecha-gaveta]')) fechaGavetas();
  });

  /* ---------- WhatsApp: número ainda não veio da loja → mostra a mensagem que iria ---------- */
  var icWhats = '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.8 7L4 20l1.1-4A8 8 0 1 1 20 12z"/></svg>';
  function whats(msg) {
    if (D.whatsapp) { window.open('https://wa.me/' + D.whatsapp + '?text=' + encodeURIComponent(msg), '_blank', 'noopener'); return; }
    avisa('Na versão no ar isto abre o WhatsApp da loja já escrito:<q>' + esc(msg).replace(/\n/g, '<br>') + '</q>', 6500);
  }
  var tAviso;
  function avisa(html, ms) { var a = $('#aviso'); a.innerHTML = html; a.classList.add('mostra'); clearTimeout(tAviso); tAviso = setTimeout(function () { a.classList.remove('mostra'); }, ms || 2600); }

  /* ---------- gavetas ---------- */
  function abreGaveta(id) { fechaGavetas(); var g = $(id); g.classList.add('aberta'); document.body.classList.add('gaveta-aberta'); if (id === '#gaveta-selecao') desenhaSel(); if (id === '#gaveta-sacola') desenhaSac(); }
  function fechaGavetas() { $$('.gaveta.aberta').forEach(function (g) { g.classList.remove('aberta'); }); document.body.classList.remove('gaveta-aberta'); }
  $('#abrir-menu').addEventListener('click', function () { abreGaveta('#gaveta-menu'); });
  $('#abrir-selecao').addEventListener('click', function () { abreGaveta('#gaveta-selecao'); });
  $('#abrir-sacola').addEventListener('click', function () { abreGaveta('#gaveta-sacola'); });
  contaSac();
  $('#veu').addEventListener('click', fechaGavetas);
  $$('[data-fechar]').forEach(function (b) { b.addEventListener('click', fechaGavetas); });
  $$('.menu-cel a, .menu-cel-2 a').forEach(function (a) { a.addEventListener('click', fechaGavetas); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fechaGavetas(); });

  /* ---------- cabeçalho que encolhe ---------- */
  var topo = $('#topo');
  function medeTopo() { document.documentElement.style.setProperty('--topo-h', topo.offsetHeight + 'px'); }
  window.addEventListener('scroll', function () { topo.classList.toggle('rolou', window.scrollY > 40); }, { passive: true });
  window.addEventListener('resize', medeTopo); medeTopo();
  if ('ResizeObserver' in window) new ResizeObserver(medeTopo).observe(topo); /* o cabeçalho encolhe ao rolar: a barra de filtros gruda no tamanho novo */

  /* ---------- pedaços de HTML ---------- */
  var icCor = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>';
  var seta = function (dir) { return '<svg viewBox="0 0 24 24"><path d="' + (dir < 0 ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7') + '"/></svg>'; };
  var agua = '<svg class="agua" data-grafismo viewBox="0 0 6698.79 4912.3" aria-hidden="true"></svg>';
  function card(p) {
    return '<article class="card rv"><a href="#/p/' + p.slug + '" class="card-foto" aria-label="' + esc(p.nome) + '">' +
      '<img src="' + img(p.fotos[0]) + '" alt="' + esc(p.nome) + '" loading="lazy">' +
      (p.fotos[1] ? '<img class="alt" src="' + img(p.fotos[1]) + '" alt="" loading="lazy">' : '') +
      (p.novo ? '<span class="card-selo">Novo</span>' : '') + '</a>' +
      '<button class="coracao' + (temSel(p.slug) ? ' marcado' : '') + '" data-coracao="' + p.slug + '" aria-pressed="' + temSel(p.slug) + '" aria-label="Guardar na seleção">' + icCor + '</button>' +
      '<a href="#/p/' + p.slug + '" class="card-info"><span class="card-tom"><i class="bolinha ' + p.tom.toLowerCase() + '"></i>' + p.tom + '</span>' +
      '<span class="card-nome">' + esc(p.nome) + '</span><span class="card-preco">' + D.preco + '</span><span class="card-parc">' + D.parcela + '</span></a></article>';
  }
  function trilho(lista, id) {
    return '<div class="trilho-wrap"><div class="trilho" id="' + id + '">' + lista.map(card).join('') + '</div>' +
      '<div class="trilho-nav"><button class="seta" data-trilho="' + id + '" data-dir="-1" aria-label="Anterior">' + seta(-1) + '</button>' +
      '<div class="trilho-barra"><i data-barra="' + id + '"></i></div>' +
      '<button class="seta" data-trilho="' + id + '" data-dir="1" aria-label="Próximo">' + seta(1) + '</button></div></div>';
  }
  function ligaTrilhos(r) {
    $$('.trilho', r).forEach(function (t) {
      var barra = $('[data-barra="' + t.id + '"]', r);
      var mede = function () { var m = t.scrollWidth - t.clientWidth, f = t.clientWidth / t.scrollWidth; barra.style.width = (f * 100) + '%'; barra.style.left = (m > 0 ? t.scrollLeft / m * (100 - f * 100) : 0) + '%'; };
      t.addEventListener('scroll', mede, { passive: true }); setTimeout(mede, 50);
    });
    $$('[data-trilho]', r).forEach(function (b) {
      b.addEventListener('click', function () { var t = document.getElementById(b.getAttribute('data-trilho')); t.scrollBy({ left: +b.getAttribute('data-dir') * t.clientWidth * .8, behavior: 'smooth' }); });
    });
  }
  function catsHTML() {
    return '<div class="cats">' + CATS.map(function (c) {
      var n = D.produtos.filter(function (p) { return p.cat === c.id; }).length;
      return '<a class="cat rv" href="#/c/' + c.id + '"><span class="cat-arco"><img src="' + img(c.foto) + '" alt="" loading="lazy"></span><span class="cat-nome">' + c.nome + '</span><span class="cat-mais">' + n + ' peças</span></a>';
    }).join('') + '</div>';
  }
  function presentesHTML() {
    return '<div class="presentes">' + D.faixas.map(function (f, i) {
      return '<a class="pres rv" href="#/presentes?faixa=' + f.id + '"><span class="num">0' + (i + 1) + '</span><h3>' + f.nome + '</h3><p>' + f.texto + '</p><span class="faixa">' + f.valor + '</span>' + agua + '</a>';
    }).join('') + '</div><div class="ocasioes rv">' + D.ocasioes.map(function (o) { return '<a class="chip" href="#/presentes?ocasiao=' + o.id + '">' + o.nome + '</a>'; }).join('') + '</div>';
  }
  var icTroca = '<svg viewBox="0 0 32 32"><path d="M6 12h17l-4-4M26 20H9l4 4"/></svg>';
  var icSelo = '<svg viewBox="0 0 32 32"><path d="M16 4l3 3h5v5l3 4-3 4v5h-5l-3 3-3-3H8v-5l-3-4 3-4V7h5z"/><path d="M12 16l3 3 5-6"/></svg>';
  var icLoja = '<svg viewBox="0 0 32 32"><path d="M5 13l2-7h18l2 7M5 13v13h22V13M5 13h22M13 26v-7h6v7"/></svg>';
  function confiaHTML() {
    return '<div class="confia rv"><a href="#/como-comprar#troca">' + icTroca + '<b>Troca em 7 dias</b><span>Comprou pelo site e não era bem isso? A gente troca.</span></a>' +
      '<a href="#/como-comprar#cuidados">' + icSelo + '<b>Garantia do banho</b><span>O que ela cobre e como acionar, por escrito.</span></a>' +
      '<a href="#/loja">' + icLoja + '<b>Retire hoje em Jataí</b><span>Reserve pelo site e busque na loja.</span></a></div>';
  }

  /* ---------- telas ---------- */
  var V = {};
  V.home = function () {
    var novos = D.produtos.filter(function (p) { return p.novo; });
    return '<section class="hero"><div class="hero-texto">' + agua.replace('class="agua"', 'class="agua"') +
      '<span class="kicker rv">Semijoias · bolsas · Jataí</span><h1 class="rv">O detalhe<br>que <em>fica.</em></h1>' +
      '<p class="lead rv">Peças escolhidas uma a uma pra você — e pra quem você ama. Veja, guarde as preferidas e fale com a loja num toque.</p>' +
      '<div class="botoes rv"><a class="btn btn-cheio" href="#/novidades">Ver novidades</a><a class="btn btn-vazio" href="#/presentes">Escolher um presente</a></div></div>' +
      '<div class="hero-foto"><img src="' + img(D.fotos.hero) + '" alt="Cliente da Mairrô com colar e anéis dourados"><span class="hero-legenda">Coleção atual</span></div></section>' +

      '<section class="sec"><div class="sec-cab"><span class="kicker rv">Comece por aqui</span><h2 class="titulo rv">O que você procura?</h2></div>' + catsHTML() + '</section>' +

      '<section class="sec" style="padding-top:0"><div class="sec-cab"><span class="kicker rv">Chegou agora</span><h2 class="titulo rv">Novidades da semana</h2>' +
      '<p class="lead rv">As mesmas peças que você viu no Instagram — com preço.</p></div>' + trilho(novos, 'tr-novos') +
      '<p style="text-align:center;margin-top:34px" class="rv"><a class="link-seta" href="#/novidades">Ver todas as novidades</a></p></section>' +

      '<section class="edit"><img data-paralaxe src="' + img(D.fotos.editorial) + '" alt="" loading="lazy"><div class="edit-texto">' +
      '<span class="kicker rv">Brincos</span><h2 class="titulo rv">Brilho de perto.</h2><p class="rv">Peças que conversam com o seu rosto — pra usar sozinhas e deixar o resto em silêncio.</p>' +
      '<a class="btn btn-claro rv" href="#/c/brincos">Ver brincos</a></div></section>' +

      '<section class="sec"><div class="sec-cab"><span class="kicker rv">Presentes</span><h2 class="titulo rv">Presente pra quem?</h2>' +
      '<p class="lead rv">Escolha pelo quanto quer investir ou pela data. A gente embala.</p></div>' + presentesHTML() + '</section>' +

      '<section class="sec" style="padding-top:0"><div class="dupla"><div class="dupla-foto rv"><img src="' + img(D.fotos.caixa) + '" alt="Caixa de presente com o grafismo da Mairrô" loading="lazy"></div>' +
      '<div class="dupla-texto"><span class="kicker rv">A caixa Mairrô</span><h2 class="titulo rv">Já sai pronta pra presentear.</h2>' +
      '<p class="rv">Toda peça vai na caixa com o nosso grafismo. E se a ideia é ganhar, não dar: mande a dica da peça pra quem precisa saber.</p>' +
      '<div class="botoes rv"><a class="btn btn-cheio" href="#/presentes">Ver presentes</a><button class="btn btn-vazio" data-dica="">Mandar a dica pra alguém</button></div></div></div></section>' +

      '<section class="sec" style="padding-top:0">' + confiaHTML() + '</section>' +

      '<section class="loja-bloco"><div class="loja-fotos rv"><img src="' + img(D.fotos.loja) + '" alt="Parede da loja com o logo da Mairrô" loading="lazy"></div>' +
      '<div class="loja-texto">' + agua + '<span class="kicker">A loja</span><h2 class="titulo">Venha ver de perto, em Jataí.</h2>' +
      '<dl><div><dt>Endereço</dt><dd>' + D.loja.endereco + '</dd></div><div><dt>Horário</dt><dd>' + D.loja.horario + '</dd></div></dl>' +
      '<div class="botoes"><a class="btn btn-claro" href="#/loja">Como chegar</a><button class="btn btn-claro" data-whats="Oi! Queria reservar uma peça pra retirar na loja.">Reservar pra retirar</button></div></div></section>' +

      '<section class="sec"><div class="sec-cab"><span class="kicker rv">@mairrosemijoias</span><h2 class="titulo-m rv">No Instagram, todo dia.</h2></div>' +
      '<div class="insta rv">' + D.fotos.insta.map(function (f) { return '<a href="https://www.instagram.com/mairrosemijoias" target="_blank" rel="noopener"><img src="' + img(f) + '" alt="" loading="lazy"></a>'; }).join('') + '</div></section>';
  };

  function vitrine(titulo, kicker, lead, lista, ativo) {
    var chips = '<a class="chip' + (ativo === 'todas' ? ' ativo' : '') + '" href="#/c/todas">Tudo</a>' +
      '<a class="chip' + (ativo === 'novidades' ? ' ativo' : '') + '" href="#/novidades">Novidades</a>' +
      CATS.map(function (c) { return '<a class="chip' + (ativo === c.id ? ' ativo' : '') + '" href="#/c/' + c.id + '">' + c.nome + '</a>'; }).join('');
    return '<section class="vit-cab"><span class="kicker">' + kicker + '</span><h1 class="titulo">' + titulo + '</h1><p class="lead">' + lead + '</p></section>' +
      '<div class="filtros">' + chips + '<span class="conta">' + lista.length + ' peças</span></div>' +
      '<section class="vit-corpo"><div class="grade">' + lista.map(card).join('') + '</div></section>';
  }
  V.novidades = function () {
    return vitrine('Novidades', 'Chegou agora', 'Na ordem do Instagram: a peça do post de hoje está aqui, com preço, no primeiro toque.', D.produtos.filter(function (p) { return p.novo; }), 'novidades');
  };
  V.cat = function (id) {
    if (id === 'todas') return vitrine('Todas as peças', 'Catálogo', 'Tudo o que está na loja hoje, com preço e parcelamento.', D.produtos, 'todas');
    var c = CATS.filter(function (x) { return x.id === id; })[0]; if (!c) return V.home();
    return vitrine(c.nome, 'Semijoias', c.texto, D.produtos.filter(function (p) { return p.cat === id; }), id);
  };

  V.produto = function (slug) {
    var p = porSlug[slug]; if (!p) return V.home();
    var c = CATS.filter(function (x) { return x.id === p.cat; })[0];
    var combina = D.produtos.filter(function (x) { return x.slug !== slug && x.cat !== p.cat; }).slice(0, 8);
    var msg = 'Oi! Quero a peça ' + p.nome + ' (' + D.preco + ') que vi no site: mairrosemijoias.com.br/produtos/' + p.slug;
    var tabela = p.cat === 'bolsas'
      ? [['Material', 'XXX'], ['Medidas', 'XX × XX × XX cm'], ['Alça', 'XXX'], ['Cor', p.tom]]
      : [['Acabamento', p.tom], ['Banho', 'XXX'], ['Camadas / micragem', 'XX micras'], ['Medida', 'XX cm'], ['Peso', 'XX g'], ['Garantia do banho', 'XX meses']];
    return '<nav class="migalha"><a href="#/">Início</a> · <a href="#/c/' + c.id + '">' + c.nome + '</a> · ' + esc(p.nome) + '</nav>' +
      '<section class="ficha"><div class="galeria">' + p.fotos.map(function (f) { return '<figure><img src="' + img(f) + '" alt="' + esc(p.nome) + '"></figure>'; }).join('') + '</div>' +
      '<div class="ficha-info"><span class="card-tom"><i class="bolinha ' + p.tom.toLowerCase() + '"></i>' + p.tom + (p.novo ? ' · Novidade' : '') + '</span>' +
      '<h1>' + esc(p.nome) + '</h1><div class="preco-g">' + D.preco + '<small>' + D.parcela + ' · ou Pix à vista</small></div>' +
      '<p class="ficha-desc">' + p.desc + '</p><span class="disp"><i></i>Disponível na loja de Jataí</span>' +
      '<div class="ficha-botoes"><div class="linha-compra"><button class="btn btn-cheio btn-bloco" data-whats="' + esc(msg) + '">' + icWhats + 'Quero esta — falar no WhatsApp</button>' +
      '<button class="botao-sacola" data-sacola="' + p.slug + '" aria-label="Colocar na sacola"><svg class=\"ic-sacola\" viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M5 8.5h14V21H5z\"/><path d=\"M9 8.5V7a3 3 0 0 1 6 0v1.5\"/></svg></button></div>' +
      '<button class="btn btn-vazio btn-bloco" data-whats="' + esc('Oi! Quero reservar ' + p.nome + ' pra retirar hoje na loja.') + '">Reservar pra retirar hoje em Jataí</button>' +
      '<button class="btn btn-vazio btn-bloco" data-pagar>Pagar agora — Pix ou cartão</button></div>' +
      '<div class="ficha-mini"><button data-coracao="' + p.slug + '" class="' + (temSel(p.slug) ? 'marcado' : '') + '">' + icCor + 'Guardar</button>' +
      '<button data-dica="' + p.slug + '"><svg viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 14v6h14v-6"/></svg>Mandar a dica pra alguém</button></div>' +
      '<div class="sanfona"><details open><summary>Detalhes da peça</summary><div class="conteudo"><table>' + tabela.map(function (l) { return '<tr><td>' + l[0] + '</td><td>' + l[1] + '</td></tr>'; }).join('') + '</table></div></details>' +
      '<details><summary>Entrega e retirada</summary><div class="conteudo">Retire hoje na loja de Jataí ou receba em casa: enviamos para todo o Brasil em até XX dias úteis, frete XXX. <a class="link-seta" href="#/como-comprar">Como funciona</a></div></details>' +
      '<details><summary>Troca e garantia</summary><div class="conteudo">Comprou pelo site? Você tem 7 dias pra desistir ou trocar. O banho tem garantia de XX meses contra defeito — como acionar está em <a class="link-seta" href="#/como-comprar#troca">Trocas</a>.</div></details>' +
      '<details><summary>Como cuidar</summary><div class="conteudo">Perfume e creme antes, a peça por último. Guarde separada, longe da umidade. Tire pra piscina, mar e academia.</div></details></div>' +
      '</div></section>' +
      '<section class="sec" style="padding-top:40px"><div class="sec-cab"><span class="kicker rv">Combine com</span><h2 class="titulo-m rv">Pra completar o look</h2></div>' + trilho(combina, 'tr-combina') + '</section>' +
      '<div class="barra-compra" id="barra-compra"><div class="bc-txt"><b>' + esc(p.nome) + '</b><span>' + D.preco + '</span></div><button class="btn btn-cheio" data-whats="' + esc(msg) + '">Quero esta</button></div>';
  };

  V.presentes = function (q) {
    var lista = D.produtos.filter(function (p) { return p.cat !== 'bolsas'; }), tit = 'Ideias pra presentear';
    var f = D.faixas.filter(function (x) { return x.id === q.faixa; })[0], o = D.ocasioes.filter(function (x) { return x.id === q.ocasiao; })[0];
    if (f) { lista = D.produtos.filter(function (p) { return p.faixa === f.id; }); tit = f.nome + ' · ' + f.valor; }
    if (o) { lista = D.produtos.filter(function (p) { return (p.ocasioes || []).indexOf(o.id) >= 0; }); tit = o.nome; }
    return '<section class="vit-cab"><span class="kicker">Presentes</span><h1 class="titulo">Presente pra quem?</h1><p class="lead">Escolha pelo valor ou pela data. Toda peça vai na caixa Mairrô.</p></section>' +
      '<section class="sec" style="padding-top:10px">' + presentesHTML() + '</section>' +
      '<section class="vit-corpo" id="resultado" style="padding-top:0"><div class="sec-cab"><h2 class="titulo-m">' + esc(tit) + '</h2></div><div class="grade">' + lista.map(card).join('') + '</div></section>';
  };

  V.loja = function () {
    return '<section class="vit-cab"><span class="kicker">A loja</span><h1 class="titulo">Mairrô em Jataí</h1><p class="lead">Venha provar, conversar e sair com a peça. Ou reserve pelo site e só passe pra buscar.</p></section>' +
      '<section class="sec" style="padding-top:10px"><div class="dupla"><div class="dupla-foto rv"><img src="' + img(D.fotos.fachada) + '" alt="Fachada da loja Mairrô" loading="lazy"></div>' +
      '<div class="dupla-texto"><span class="kicker rv">Endereço</span><h2 class="titulo-m rv">' + D.loja.endereco + '</h2><p class="rv">' + D.loja.horario + '<br>WhatsApp ' + D.loja.fone + '</p>' +
      '<div class="botoes rv"><button class="btn btn-cheio" data-mapa>Como chegar</button><button class="btn btn-vazio" data-whats="Oi! Queria reservar uma peça pra retirar na loja.">Reservar pra retirar</button></div></div></div></section>' +
      '<section class="sec" style="padding-top:0"><div class="dupla inverte"><div class="dupla-foto rv"><img src="' + img(D.fotos.loja) + '" alt="Interior da loja" loading="lazy"></div>' +
      '<div class="dupla-texto"><span class="kicker rv">Por dentro</span><h2 class="titulo-m rv">Um espaço pra escolher com calma.</h2><p class="rv">Espelhos em arco, as peças à vista e alguém pra ajudar a combinar. É o mesmo cuidado que vai no pacote de quem compra pelo site.</p></div></div></section>' +
      '<section class="sec" style="padding-top:0"><div class="mapa rv">' + agua + '<button class="btn btn-vazio" data-mapa>Abrir no Google Maps</button></div></section>';
  };

  V.comprar = function () {
    return '<section class="vit-cab"><span class="kicker">Como comprar</span><h1 class="titulo">Simples, do jeito que você já faz.</h1><p class="lead">Você escolhe aqui, fala com uma pessoa de verdade e recebe em casa — ou busca na loja.</p></section>' +
      '<section class="sec" style="padding-top:20px"><div class="passos">' +
      '<div class="passo rv"><h3>Escolha</h3><p>Guarde as preferidas no coração. Cada peça tem preço e parcelamento.</p></div>' +
      '<div class="passo rv"><h3>Chame a loja</h3><p>Um toque manda a peça e o preço pro nosso WhatsApp. Respondemos em até XX horas.</p></div>' +
      '<div class="passo rv"><h3>Pague</h3><p>Pix ou cartão em até XXx, por link seguro do banco. Nada de cartão digitado no site.</p></div>' +
      '<div class="passo rv"><h3>Receba</h3><p>Retire hoje em Jataí ou receba em casa em até XX dias úteis, frete XXX.</p></div></div></section>' +
      '<section class="sec" style="padding-top:0"><div class="texto-col">' +
      '<h2 id="troca">Troca e devolução</h2><p>Comprou pelo site ou pelo WhatsApp? Você tem <b>7 dias</b> depois de receber pra desistir, com devolução do valor (art. 49 do Código de Defesa do Consumidor). Pra trocar tamanho ou modelo, fale com a loja.</p>' +
      '<h2 id="cuidados">Cuidados e garantia</h2><ul><li>Perfume, creme e maquiagem antes; a peça por último.</li><li>Guarde cada peça separada, longe da umidade.</li><li>Tire pra piscina, mar, academia e banho.</li></ul><p>O banho tem garantia de <b>XX meses</b> contra defeito de fabricação. Pra acionar, mande foto da peça e da nota pelo WhatsApp.</p>' +
      '<h2 id="privacidade">Privacidade</h2><p>Guardamos só o que você mandar pra comprar. Sua seleção de peças fica no seu aparelho.</p>' +
      '<h2 id="termos">Quem vende</h2><p>' + D.loja.razao + ' · CNPJ ' + D.loja.cnpj + ' · ' + D.loja.endereco + '</p></div></section>';
  };

  /* ---------- roteador ---------- */
  var app = $('#app');
  function rota() {
    var h = location.hash.replace(/^#\/?/, ''), q = {}, ancora = '';
    var ai = h.indexOf('#'); if (ai >= 0) { ancora = h.slice(ai + 1); h = h.slice(0, ai); }
    var qi = h.indexOf('?'); if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var a = kv.split('='); q[a[0]] = decodeURIComponent(a[1] || ''); }); h = h.slice(0, qi); }
    var partes = h.split('/').filter(Boolean), html;
    if (!partes.length) html = V.home();
    else if (partes[0] === 'novidades') html = V.novidades();
    else if (partes[0] === 'c') html = V.cat(partes[1]);
    else if (partes[0] === 'p') html = V.produto(partes[1]);
    else if (partes[0] === 'presentes') html = V.presentes(q);
    else if (partes[0] === 'loja') html = V.loja();
    else if (partes[0] === 'como-comprar') html = V.comprar();
    else html = V.home();
    app.innerHTML = html;
    pintaGrafismos(app); ligaTrilhos(app); revela(app); ligaFicha(); paralaxe();
    $$('.menu-desk a').forEach(function (a) { a.classList.toggle('ativo', ('#/' + h) === a.getAttribute('href') || (partes[0] === 'c' && a.getAttribute('href') === '#/c/' + partes[1])); });
    var alvo = ancora && document.getElementById(ancora);
    if (!alvo && (q.faixa || q.ocasiao)) alvo = document.getElementById('resultado');
    if (alvo) window.scrollTo({ top: alvo.getBoundingClientRect().top + window.scrollY - topo.offsetHeight - 20, behavior: 'instant' });
    else window.scrollTo({ top: 0, behavior: 'instant' });
    document.title = (partes[0] === 'p' && porSlug[partes[1]] ? porSlug[partes[1]].nome + ' · ' : '') + 'Mairrô Semijoias · Jataí';
  }
  window.addEventListener('hashchange', rota);

  /* ---------- revelação por rolagem ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 }) : null;
  function revela(r) {
    var itens = $$('.rv', r);
    if (!io) { itens.forEach(function (e) { e.classList.add('visto'); }); return; }
    itens.forEach(function (e, i) { e.style.transitionDelay = (Math.min(i % 5, 4) * 0.06) + 's'; io.observe(e); });
  }

  /* ---------- ficha: zoom da foto, barra de compra no celular, pagar, dica ---------- */
  var fichaBarra = null; /* a barra de compra aparece quando os botões da ficha saem de vista POR CIMA do cabeçalho */
  window.addEventListener('scroll', function () { if (fichaBarra) fichaBarra(); }, { passive: true });
  function ligaFicha() {
    $$('.galeria figure').forEach(function (f) {
      f.addEventListener('click', function (e) {
        if (window.innerWidth <= 860) return;
        var r = f.getBoundingClientRect(), im = f.querySelector('img');
        im.style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
        f.classList.toggle('zoom');
      });
      f.addEventListener('mousemove', function (e) {
        if (!f.classList.contains('zoom')) return;
        var r = f.getBoundingClientRect(); f.querySelector('img').style.transformOrigin = ((e.clientX - r.left) / r.width * 100) + '% ' + ((e.clientY - r.top) / r.height * 100) + '%';
      });
    });
    var barra = $('#barra-compra'), botoes = $('.ficha-botoes');
    document.body.classList.toggle('tem-barra', !!barra);
    fichaBarra = barra && botoes ? function () { barra.classList.toggle('mostra', botoes.getBoundingClientRect().bottom < topo.offsetHeight); } : null;
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-pagar]')) { avisa('Na versão no ar, este botão abre o <b>link de pagamento do banco</b> (Pix ou cartão), fora do site. Falta a loja escolher o provedor.', 5200); return; }
    if (e.target.closest('[data-mapa]')) { avisa('Na versão no ar, abre o Google Maps no endereço da loja.', 3200); return; }
    var d = e.target.closest('[data-dica]'); if (d) {
      var p = porSlug[d.getAttribute('data-dica')];
      var txt = p ? 'Olha o que eu gostei na Mairrô: ' + p.nome + ' — ' + D.preco : 'Olha a Mairrô Semijoias: peças lindas pra presente.';
      var url = 'https://mairrosemijoias.com.br/' + (p ? 'produtos/' + p.slug : '');
      if (navigator.share) { navigator.share({ title: 'Mairrô', text: txt, url: url }).catch(function () {}); }
      else avisa('No celular abre o "compartilhar" com:<q>' + esc(txt) + ' ' + url + '</q>', 5200);
    }
  });

  /* ---------- paralaxe leve na foto editorial ---------- */
  var par = [];
  function paralaxe() { par = $$('[data-paralaxe]'); }
  window.addEventListener('scroll', function () {
    par.forEach(function (im) {
      var r = im.parentNode.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; im.style.transform = 'translateY(' + (k * -5) + '%)';
    });
  }, { passive: true });

  /* ---------- rodapé ---------- */
  $('#rodape-legal').innerHTML = D.loja.razao + ' · CNPJ ' + D.loja.cnpj + '<br>' + D.loja.endereco + ' · ' + D.loja.fone + '<br>© 2026 Mairrô Semijoias';
  contaSel(); rota();
})();
