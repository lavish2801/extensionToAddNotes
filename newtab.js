(function () {
  // Shooting stars: random count (max 5) on load and at random times, slower speed
  const shootingStarsEl = document.getElementById('shooting-stars');
  const SHOOTING_STAR_MAX_COUNT = 3;
  const SHOOTING_STAR_DURATION_MIN = 1.8;
  const SHOOTING_STAR_DURATION_MAX = 3.2;

  function fireShootingStar() {
    if (!shootingStarsEl) return;
    const star = document.createElement('div');
    star.className = 'shooting-star';
    const angle = Math.random() * 360;
    star.style.setProperty('--angle', angle + 'deg');
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 1 + '%';
    const duration = SHOOTING_STAR_DURATION_MIN + Math.random() * (SHOOTING_STAR_DURATION_MAX - SHOOTING_STAR_DURATION_MIN);
    star.style.animationDuration = duration + 's';
    shootingStarsEl.appendChild(star);
    star.addEventListener('animationend', () => star.remove());
  }

  function fireShootingStars() {
    const count = 1 + Math.floor(Math.random() * SHOOTING_STAR_MAX_COUNT);
    for (let i = 0; i < count; i++) {
      setTimeout(fireShootingStar, i * 250);
    }
  }

  if (shootingStarsEl) {
    fireShootingStars();
    function scheduleNext() {
      const delay = 2500 + Math.random() * 5000;
      setTimeout(() => {
        fireShootingStars();
        scheduleNext();
      }, delay);
    }
    scheduleNext();
  }

  function normalizeNotes(raw) {
    if (!Array.isArray(raw)) return [];
    const now = Date.now();
    return raw.map((n) => {
      if (typeof n === 'string') return { text: n, done: false };
      const note = { text: n.text || '', done: !!n.done };
      if (note.done && (n.doneAt == null)) note.doneAt = now;
      else if (n.doneAt != null) note.doneAt = n.doneAt;
      return note;
    });
  }

  const KEEP_DONE_MS = {
    forever: Infinity,
    '1d': 24 * 60 * 60 * 1000,
    '3d': 3 * 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '2w': 14 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000
  };

  function applyRetention(notes, keepDoneFor) {
    const maxAge = KEEP_DONE_MS[keepDoneFor] || Infinity;
    if (maxAge === Infinity) return notes;
    const now = Date.now();
    return notes.filter((n) => !n.done || (now - (n.doneAt || 0)) <= maxAge);
  }

  const listEl = document.getElementById('undone-list');
  const emptyEl = document.getElementById('empty-message');
  const openLink = document.getElementById('open-extension');
  const datetimeDateEl = document.getElementById('datetime-date');
  const datetimeTimeEl = document.getElementById('datetime-time');

  function updateDateTime() {
    const d = new Date();
    if (datetimeDateEl) {
      datetimeDateEl.textContent = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
    }
    if (datetimeTimeEl) {
      datetimeTimeEl.textContent = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    }
  }

  if (datetimeDateEl || datetimeTimeEl) {
    updateDateTime();
    setInterval(updateDateTime, 1000);
  }

  function render(notes) {
    const undone = notes.filter((n) => !n.done);
    listEl.innerHTML = '';
    listEl.classList.toggle('undone-list-multi', undone.length > 5);
    if (undone.length === 0) {
      emptyEl.hidden = false;
      return;
    }
    emptyEl.hidden = true;
    undone.forEach((note) => {
      const li = document.createElement('li');
      li.className = 'undone-item';
      li.textContent = note.text;
      listEl.appendChild(li);
    });
  }

  chrome.storage.local.get(['notes', 'keepDoneFor'], (result) => {
    let notes = normalizeNotes(result.notes);
    const keepDoneFor = result.keepDoneFor || 'forever';
    notes = applyRetention(notes, keepDoneFor);
    render(notes);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.notes) return;
    const notes = normalizeNotes(changes.notes.newValue || []);
    chrome.storage.local.get(['keepDoneFor'], (r) => {
      const kept = applyRetention(notes, r.keepDoneFor || 'forever');
      render(kept);
    });
  });

  openLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('popup.html') });
  });

  // Random website button — add or edit URLs in this array
  const RANDOM_WEBSITES = [
    'http://alien-ufo-research.com/reptilians/',
    'https://www.flightradar24.com/',
    'http://nooooooooooooooo.com/',
    'http://secrettechnology.com/',
    'http://www.patience-is-a-virtue.org/',
    'https://isitchristmas.com/',
    'http://omfgdogs.com/',
    'http://zombo.com/',
    'http://www.rainymood.com/',
    'http://www.fallingfalling.com/',
    'http://corgiorgy.com/',
    'http://www.pointerpointer.com/',
    'http://eelslap.com/',
    'http://zoomquilt.org/',
    'http://beesbeesbees.com/',
    'http://www.thepictureofeverything.com/',
    'http://doughnutkitten.com/',
    'https://www.futureme.org/',
    'http://www.newyearexercise.com/',
    'https://web.archive.org/web/20180201230730/http://www.dragomirsdiary.com/2011/08/hello-diary.html',
    'http://5secondfilms.com/',
    'http://alpha61.com/primenumbershittingbear/',
    'http://www.myhousematesdiary.com/',
    'http://www.cachemonet.com/',
    'http://clickingbad.nullism.com/',
    'http://www.gizoogle.net/',
    'https://ncase.me/trust/',
    'http://www.clicktoremove.com/',
    'http://vectorpark.com/head/',
    'https://www.purristan.com/',
    'https://www.airfrais.eu/us/index.html',
    'http://www.nobodyhere.com/justme/me.here',
    'http://www.superbad.com/',
    'http://therevolvinginternet.com/',
    'http://get.your-d.tk/',
    'http://www.miserablebastard.com/',
    'http://www.freechocolate.com/',
    'https://morelessgame.com/',
    'http://sheepfilms.co.uk/category/shortfilms/',
    'http://strangehorizons.com/non-fiction/articles/installing-linux-on-a-dead-badger-users-notes/',
    'http://perfectlytimedphotos.com/popular/perfectly-timed-photo',
    'http://jpriest.com/gamez/pinguxtreme.swf',
    'http://www.bradthegame.com/',
    'http://theworstthingsforsale.com/',
    'https://s3.mirror.co.uk/click-the-colour-and-not-the-word/index.html',
    'http://theoatmeal.com/comics/dog_paradox',
    'http://www.catbirdseat.org/catbirdseat/bingo.html',
    'http://unomoralez.com/',
    'http://www.fincher.org/Misc/Pennies/BigTower.shtml',
    'http://www.cleverbot.com/',
    'http://www.hat.net/abs/noclick/index.html',
    'http://www.staggeringbeauty.com/',
    'http://burymewithmymoney.com/',
    'http://just-shower-thoughts.tumblr.com/',
    'http://www.trypap.com/',
    'http://www.republiquedesmangues.fr/',
    'http://www.koalastothemax.com/',
    'http://www.carrotmuseum.co.uk/carrotcolours.html',
    'http://grandpanoclothes.com/',
    'http://www.everydayim.com/',
    'http://hasthelargehadroncolliderdestroyedtheworldyet.com/',
    'http://ninjaflex.com/',
    'http://chrismckenzie.com/',
    'http://corndogoncorndog.com/',
    'http://gameaboutsquares.com/',
    'http://salmonofcapistrano.com/',
    'http://www.wutdafuk.com/',
    'http://www.ouaismaisbon.ch/',
    'http://unicodesnowmanforyou.com/',
    'http://www.psyhigh.com/',
    'http://www.internetisshit.org/',
    'http://www.fmylife.com/',
    'http://www.realultimatepower.net/index4.htm',
    'http://rulesoftheinternet.com/index.php?title=Main_Page',
    'http://www.markdalderup.com/daylight-of-darkness/the-start-of-the-world/',
    'http://presidentialpickuplines.tumblr.com/',
    'http://sarina-brewer.com/',
    'http://chickswithstevebuscemeyes.tumblr.com/',
    'http://thingsididlastnight.com/',
    'http://www.heptune.com/farts.html',
    'http://inventorspot.com/articles/body_bread_13546',
    'http://memebase.cheezburger.com/pictureisunrelated',
    'http://alien-ufo-research.com/news/2013/proof-of-time-travelers.php',
    'http://pixelsfighting.com/',
    'http://hardcoreprawnlawn.com/',
    'http://www.slightlyinteresting.com/lavalamp/lava.asp',
    'http://thefo.nz/',
    'http://faceofdisapproval.com/',
    'http://semanticresponsiveillustration.com/',
    'http://dogs.are.the.most.moe/',
    'https://web.archive.org/web/20190512120348/https://oct82.com/',
    'http://www.drawastickman.com',
    'https://trek.nasa.gov/mars/index.html',
    'http://ihumans.tumblr.com/',
    'http://whos.agood.dog/lesser.dog/',
    'http://chatwithhodor.com/',
    'https://web.archive.org/web/20170514160422/http://manbabies.com/',
    'http://www.rinkworks.com/bookaminute/classics.shtml',
    'http://www.ijustwantyourmoney.com/',
    'http://www.onemilliongiraffes.com/',
    'http://www.lkozma.net/wpv/index.html',
    'http://www.fieggen.com/shoelace/index.htm',
    'http://playing.hypernom.com/monkeys',
    'http://www.sam-i-am.com/play/5k/expletives/index.html',
    'http://beaarthurmountainspizza.tumblr.com/',
    'http://www.stopabductions.com/',
    'https://swatblog.rtgp.xyz/',
    'http://kimjongillookingatthings.tumblr.com/',
    'http://garfieldminusgarfield.net/',
    'http://dogeweather.com/',
    'http://www.hen2hen.com/',
    'https://web.archive.org/web/20160725231633/http://celebritiesaskids.net/',
    'http://codepen.io/ge1doot/full/WbWQOP/',
    'http://icanhas.cheezburger.com/',
    'http://www.engrish.com/',
    'http://www.astrohamster.com/',
    'http://stuffonmycat.com/',
    'http://www.bbc.com/future/bespoke/story/20150306-journey-to-the-centre-of-earth/index.html',
    'http://www.cowsgomoo.co.uk/',
    'http://www.woot.co.uk/',
    'https://bouncingdvdlogo.com/',
    'http://orteil.dashnet.org/cookieclicker/',
    'http://themostseconds.com/',
    'http://www.midwaymeetup.com/',
    'https://www.youtube.com/watch?v=9C_HReR_McQ&feature=emb_logo',
    'http://www.handspeak.com/word/',
    'http://topdocumentaryfilms.com/',
    'http://www.madsci.org/cgi-bin/lynn/jardin/SCG',
    'http://trumpdonald.org/',
    'https://drawception.com',
    'http://badkidsjokes.tumblr.com/',
    'http://internet-map.net/',
    'https://youtu.be/9C_HReR_McQ',
    'http://hyperboleandahalf.blogspot.co.uk/',
    'http://slither.io/',
    'http://www.youareinaforest.com/',
    'http://remoji.com/',
    'http://shiiiit.com/',
    'http://www.howmanypeopleareinspacerightnow.com/',
    'http://hmpg.net/',
    'http://conceptlab.com/simulator/morning/clock800.html',
    'https://www.kamogo.com/9',
    'http://www.therestartpage.com/',
    'http://www.stinkymeat.net/',
    'http://www.eviloverlord.com/lists/overlord.html',
    'http://www.windows93.net/',
    'http://thefuckingtime.com/',
    'http://make-everything-ok.com/',
    'http://what-if.xkcd.com/8/',
    'http://www.danielyeow.com/2011/drawing-molecules/',
    'http://inventorspot.com/articles/ten_bizarre_japanese_soft_drinks_5225',
    'http://www.wikihow.com/Recycle-Your-Socks',
    'https://www.dctech.com/physics/notes/0005.php',
    'http://www.pintprice.com/',
    'http://www.barefooters.org/',
    'http://www.weirdconverter.com/',
    'http://www.theflatearthsociety.org/cms/',
    'http://scienceblogs.com/goodmath/2006/10/12/who-needs-a-calculator-multipl/',
    'http://www.coincalc.com/',
    'http://festivusweb.com/',
    'http://www.appropedia.org/Solar_Charged_Lawnmower',
    'http://www.genderanalyzer.com/',
    'http://www.muppetlabs.com/~breadbox/txt/al.html',
    'http://fliptitle.com/',
    'http://www.worldbeardchampionships.com/photos/',
    'http://www.fishcam.com/',
    'http://www.ehow.com/how_4594591_suck-egg-bottle.html',
    'https://www.youtube.com/watch?v=jU9USxJ9vPs',
    'http://www.venganza.org/',
    'http://www.humanforsale.com/',
    'http://www.willitblend.com/',
    'http://www.icbe.org/',
    'http://www.museumofconceptualart.com/accomplished/index.html',
    'https://scatter.wordpress.com/2010/05/30/the-shortest-possible-game-of-monopoly-21-seconds/',
    'http://www.thesmokinggun.com/time-waster',
    'https://www.youtube.com/askaninja',
    'http://www.godecookery.com/mythical/mythical.htm',
    'http://www.sandalandsoxer.co.uk/home.htm',
    'http://www.lileks.com/oldads/index.html',
    'http://australianmuseum.net.au/death-the-last-taboo',
    'http://www.shadyurl.com/',
    'http://memebase.cheezburger.com/thisisphotobomb',
    'https://www.gutenberg.org/',
    'http://ipetcompanion.com',
    'http://findtheinvisiblecow.com/',
    'https://web.archive.org/web/20190618062455/http://www.iloveyoulikeafatladylovesapples.com/',
    'http://www.thepointless.com/reddot',
    'http://www.rrrather.com/',
    'http://virtualpiano.net/',
    'http://drunkenme.com/movie-drinking-games/',
    'http://findagrave.com/',
    'https://onetinyhand.com/',
    'http://www.plspetdoge.com/',
    'http://www.firstmenonthemoon.com/',
    'http://codepen.io/akm2/full/rHIsa',
    'https://www.housecreep.com/',
    'http://you.regettingold.com/',
    'http://hotdogcat.com/',
    'http://instantrimshot.com/',
    'http://www.anothersadtrombone.com/',
    'https://web.archive.org/web/20180211011023/http://cutecatnames.com/',
    'http://www.instantwhoop.com',
    'https://sliding.toys/mystic-square/8-puzzle/daily/',
    'https://longdogechallenge.com/',
    'https://maze.toys/mazes/mini/daily/',
    'https://optical.toys',
    'https://paint.toys/zen-garden/',
    'https://puginarug.com',
    'https://memory.toys/classic/easy/',
    'https://alwaysjudgeabookbyitscover.com',
    'https://clicking.toys/peg-solitaire/english/',
    'https://weirdorconfusing.com/',
    'https://checkbox.toys/scale/',
    'https://binarypiano.com/',
    'https://mondrianandme.com/',
    'https://cruel.toys/maze',
    'https://onesquareminesweeper.com/',
    'https://cursoreffects.com',
    'https://patience.toys',
    'http://floatingqrcode.com/',
    'https://thatsthefinger.com/',
    'https://cant-not-tweet-this.com/',
    'http://heeeeeeeey.com/',
    'https://paint.toys/sand/',
    'https://ant.toys',
    'https://toms.toys',
    'http://burymewithmymoney.com/',
    'https://smashthewalls.com/',
    'https://jacksonpollock.org/',
    'https://duckstreet.net/',
    'http://drawing.garden/',
    'https://www.trypap.com/',
    'https://paint.toys/symmetry/',
    'http://www.movenowthinklater.com/',
    'https://sliding.toys/mystic-square/15-puzzle/daily/',
    'https://checkboxrace.com/',
    'http://www.rrrgggbbb.com/',
    'http://www.koalastothemax.com/',
    'https://rotatingsandwiches.com/',
    'http://www.everydayim.com/',
    'http://randomcolour.com/',
    'http://maninthedark.com/',
    'http://cat-bounce.com/',
    'https://paint.toys/',
    'http://chrismckenzie.com/',
    'https://thezen.zone/',
    'http://ihasabucket.com/',
    'http://corndogoncorndog.com/',
    'http://www.hackertyper.com/',
    'https://pointerpointer.com',
    'http://imaninja.com/',
    'https://paint.toys/calligram/',
    'http://www.nullingthevoid.com/',
    'http://www.muchbetterthanthis.com/',
    'http://www.yesnoif.com/',
    'http://lacquerlacquer.com',
    'https://clicking.toys/flip-grid/neat-nine/3-holes/',
    'http://potatoortomato.com/',
    'http://iamawesome.com/',
    'https://strobe.cool/',
    'http://thisisnotajumpscare.com/',
    
    'http://crouton.net/',
    'http://corgiorgy.com/',
    'http://www.wutdafuk.com/',
    'http://unicodesnowmanforyou.com/',
    'http://www.crossdivisions.com/',
    'https://memory.toys/maze/easy/',
    'https://boringboringboring.com/',
    'http://www.patience-is-a-virtue.org/',
    'http://pixelsfighting.com/',
    'https://existentialcrisis.com/',
    'http://www.omfgdogs.com/',
    'http://oct82.com/',
    'http://www.blankwindows.com/',
    'http://tunnelsnakes.com/',
    'http://www.trashloop.com/',
    'https://paint.toys',
    'http://www.doublepressure.com/',
    'https://optical.toys/thatcher-effect/',
    'https://musical.toys',
    'http://notdayoftheweek.com/',
    'https://number.toys/',
    'https://card.toys',
    'https://greatbignothing.com/',
    'https://zoomquilt.org/',
    'https://cruel.toys/hunt',
    "https://optical.toys/troxler-fade/",
    'https://dadlaughbutton.com/',
    'https://remoji.com/',
    'http://papertoilet.com/',
    'https://loopedforinfinity.com/',
    "https://www.ripefordebate.com/",
    // 'https://end.city/',
    // 'https://elonjump.com/',
    'https://www.bouncingdvdlogo.com/',
    'https://toybox.toms.toys',
    'https://memory.toys/monkey-challenge/easy/',
    'https://memory.toys',

    'http://eelslap.com/',
    'http://endless.horse/',
    'http://corndog.io/',
    'http://www.republiquedesmangues.fr/',
    'http://www.staggeringbeauty.com/',
    'http://ninjaflex.com/',
    'http://www.ismycomputeron.com/',
    'http://doughnutkitten.com/',
    'http://chillestmonkey.com/',
    'http://scroll-o-meter.club/',
    'http://tencents.info/',
    'http://chihuahuaspin.com/',
    'http://spaceis.cool/',
    'http://yeahlemons.com/',
    'http://wowenwilsonquiz.com',
    'http://buildshruggie.com/',
  ];

  const randomWebsiteBtn = document.getElementById('random-website-btn');
  const randomWebsiteBtnText = document.getElementById('random-website-btn-text');
  const RANDOM_BTN_PHRASES = [
    'Random website',
    'Send me somewhere weird',
    'I\'m feeling lucky (and curious)',
    'Surprise me, internet!',
    'What could go wrong?',
    'Take me to the rabbit hole',
    'One click closer to chaos',
    'Feed my procrastination',
    'Yeet me into the void',
    'I have 5 minutes to waste',
    'Mystery destination, please',
    'The internet is my oyster',
    'Adventure awaits (probably)',
    'Click at your own risk',
    'No regrets. Well, maybe some.'
  ];

  function setRandomBtnPhrase() {
    if (randomWebsiteBtnText) {
      randomWebsiteBtnText.textContent = RANDOM_BTN_PHRASES[Math.floor(Math.random() * RANDOM_BTN_PHRASES.length)];
    }
  }

  if (randomWebsiteBtn) {
    setRandomBtnPhrase();
    randomWebsiteBtn.addEventListener('mouseenter', setRandomBtnPhrase);
    randomWebsiteBtn.addEventListener('mouseleave', () => {
      if (randomWebsiteBtnText) randomWebsiteBtnText.textContent = 'Random website';
    });
    randomWebsiteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (RANDOM_WEBSITES.length === 0) return;
      const url = RANDOM_WEBSITES[Math.floor(Math.random() * RANDOM_WEBSITES.length)];
      window.location.href = url;
    });
  }

  // Random code snippet from snippets folder (add new files here)
  const SNIPPET_FILES = ['snippets/1.txt', 'snippets/2.txt', 'snippets/3.txt', 
    'snippets/4.txt', 'snippets/5.txt', 'snippets/6.txt', 'snippets/7.txt', 
    'snippets/8.txt', 'snippets/9.txt', 'snippets/10.txt', 'snippets/11.txt', 
    'snippets/12.txt', 'snippets/13.txt', 'snippets/14.txt', 'snippets/15.txt', 'snippets/16.txt', 
    'snippets/17.txt', 'snippets/18.txt', 'snippets/19.txt', 'snippets/20.txt', 'snippets/21.txt', 
    'snippets/22.txt', 'snippets/23.txt', 'snippets/24.txt', 'snippets/25.txt', 'snippets/26.txt', 
    'snippets/27.txt', 'snippets/28.txt', 'snippets/29.txt', 'snippets/30.txt', 
    'snippets/31.txt', 'snippets/32.txt', 'snippets/33.txt', 'snippets/34.txt',
    'snippets/35.txt', 'snippets/36.txt', 'snippets/37.txt', 'snippets/38.txt', 'snippets/39.txt', 'snippets/40.txt'];
  const snippetEl = document.getElementById('snippet-code');
  const snippetBg = document.getElementById('snippet-background');
  if (snippetEl && snippetBg) {
    const file = SNIPPET_FILES[Math.floor(Math.random() * SNIPPET_FILES.length)];
    fetch(chrome.runtime.getURL(file))
      .then((r) => r.text())
      .then((text) => {
        snippetEl.textContent = text.trim();
      })
      .catch(() => { snippetBg.hidden = true; });
  }
})();
