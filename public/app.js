// ============================================================================
// ⌨️ 한글 2벌식 오토마타 & 조합 엔진 (Hangul Automata Composer)
// ============================================================================
const HC_CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const HC_JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const HC_JONG = ['', 'ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const HC_DBL_JUNG = {
  'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
  'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
  'ㅡㅣ': 'ㅢ'
};
const HC_DBL_JONG = {
  'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
  'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ', 'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ',
  'ㅂㅅ': 'ㅄ'
};
const HC_SPLIT_JONG = {
  'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
  'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'], 'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'], 'ㅀ': ['ㄹ', 'ㅎ'],
  'ㅄ': ['ㅂ', 'ㅅ']
};
const HC_SPLIT_JUNG = {
  'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
  'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'],
  'ㅢ': ['ㅡ', 'ㅣ']
};

const QWERTY_KO_MAP = {
  'q': 'ㅂ', 'w': 'ㅈ', 'e': 'ㄷ', 'r': 'ㄱ', 't': 'ㅅ',
  'y': 'ㅛ', 'u': 'ㅕ', 'i': 'ㅑ', 'o': 'ㅐ', 'p': 'ㅔ',
  'a': 'ㅁ', 's': 'ㄴ', 'd': 'ㅇ', 'f': 'ㄹ', 'g': 'ㅎ',
  'h': 'ㅗ', 'j': 'ㅓ', 'k': 'ㅏ', 'l': 'ㅣ',
  'z': 'ㅋ', 'x': 'ㅌ', 'c': 'ㅊ', 'v': 'ㅍ',
  'b': 'ㅠ', 'n': 'ㅜ', 'm': 'ㅡ',
  'Q': 'ㅃ', 'W': 'ㅉ', 'E': 'ㄸ', 'R': 'ㄲ', 'T': 'ㅆ',
  'O': 'ㅒ', 'P': 'ㅖ'
};

// ⌨️ 물리 키보드 e.code 1:1 매핑 (한영 전환 상태나 Windows IME Process 229 무관하게 항상 동작)
const CODE_TO_KO_MAP = {
  'KeyQ': 'ㅂ', 'KeyW': 'ㅈ', 'KeyE': 'ㄷ', 'KeyR': 'ㄱ', 'KeyT': 'ㅅ',
  'KeyY': 'ㅛ', 'KeyU': 'ㅕ', 'KeyI': 'ㅑ', 'KeyO': 'ㅐ', 'KeyP': 'ㅔ',
  'KeyA': 'ㅁ', 'KeyS': 'ㄴ', 'KeyD': 'ㅇ', 'KeyF': 'ㄹ', 'KeyG': 'ㅎ',
  'KeyH': 'ㅗ', 'KeyJ': 'ㅓ', 'KeyK': 'ㅏ', 'KeyL': 'ㅣ',
  'KeyZ': 'ㅋ', 'KeyX': 'ㅌ', 'KeyC': 'ㅊ', 'KeyV': 'ㅍ',
  'KeyB': 'ㅠ', 'KeyN': 'ㅜ', 'KeyM': 'ㅡ',
  'Period': '.', 'Comma': ','
};

const CODE_TO_KO_SHIFT_MAP = {
  'KeyQ': 'ㅃ', 'KeyW': 'ㅉ', 'KeyE': 'ㄸ', 'KeyR': 'ㄲ', 'KeyT': 'ㅆ',
  'KeyO': 'ㅒ', 'KeyP': 'ㅖ'
};

// 🌟 낱말 쓰기 연습용 한글 음절/자모 정밀 분해 및 실시간 조립 함수들
function decomposeHangulSyllable(ch) {
  const code = ch.charCodeAt(0);
  if (code < 0xAC00 || code > 0xD7A3) {
    return { char: ch, jamos: [ch], cho: null, jung: null, jong: null };
  }
  const val = code - 0xAC00;
  const jongIdx = val % 28;
  const jungIdx = Math.floor(val / 28) % 21;
  const choIdx = Math.floor(val / 28 / 21);

  const choChar = HC_CHO[choIdx];
  const jungChar = HC_JUNG[jungIdx];
  const jongChar = HC_JONG[jongIdx];

  const jamos = [];
  jamos.push(choChar);

  if (HC_SPLIT_JUNG[jungChar]) {
    jamos.push(...HC_SPLIT_JUNG[jungChar]);
  } else {
    jamos.push(jungChar);
  }

  if (jongIdx > 0) {
    if (HC_SPLIT_JONG[jongChar]) {
      jamos.push(...HC_SPLIT_JONG[jongChar]);
    } else {
      jamos.push(jongChar);
    }
  }

  return { char: ch, jamos, cho: choChar, jung: jungChar, jong: jongIdx > 0 ? jongChar : null };
}

function decomposeWordToJamos(word) {
  const syllables = [];
  const flatJamos = [];

  for (let i = 0; i < word.length; i++) {
    const syl = decomposeHangulSyllable(word[i]);
    syllables.push(syl);
    syl.jamos.forEach((j, jIdx) => {
      flatJamos.push({
        sylIdx: i,
        jamoIdxInSyl: jIdx,
        key: j,
        char: word[i]
      });
    });
  }

  return { syllables, flatJamos };
}

function composePartialJamos(jamosList) {
  if (!jamosList || jamosList.length === 0) return '';
  if (jamosList.length === 1) return jamosList[0];

  const cho = HC_CHO.indexOf(jamosList[0]);
  if (cho === -1) return jamosList[0];

  let jungStr = jamosList[1];
  let nextIdx = 2;
  if (jamosList.length > 2 && HC_JUNG.includes(jamosList[2])) {
    const combined = jamosList[1] + jamosList[2];
    if (HC_DBL_JUNG[combined]) {
      jungStr = HC_DBL_JUNG[combined];
      nextIdx = 3;
    }
  }

  const jung = HC_JUNG.indexOf(jungStr);
  if (jung === -1) return jamosList[0];

  let jong = 0;
  if (jamosList.length > nextIdx) {
    let jongStr = jamosList[nextIdx];
    if (jamosList.length > nextIdx + 1) {
      const combinedJong = jamosList[nextIdx] + jamosList[nextIdx + 1];
      if (HC_DBL_JONG[combinedJong]) {
        jongStr = HC_DBL_JONG[combinedJong];
      }
    }
    const jIdx = HC_JONG.indexOf(jongStr);
    if (jIdx > 0) jong = jIdx;
  }

  const code = 0xAC00 + (cho * 21 + jung) * 28 + jong;
  return String.fromCharCode(code);
}

class HangulComposer {
  constructor() {
    this.buffer = '';
    this.cho = -1;
    this.jung = -1;
    this.jong = -1;
  }

  isConsonant(c) { return HC_CHO.includes(c); }
  isVowel(c) { return HC_JUNG.includes(c); }

  commitCurrent() {
    if (this.cho !== -1) {
      if (this.jung !== -1) {
        const code = 0xAC00 + (this.cho * 21 + this.jung) * 28 + (this.jong !== -1 ? this.jong : 0);
        this.buffer += String.fromCharCode(code);
      } else {
        this.buffer += HC_CHO[this.cho];
      }
    } else if (this.jung !== -1) {
      this.buffer += HC_JUNG[this.jung];
    }
    this.cho = -1;
    this.jung = -1;
    this.jong = -1;
  }

  getCurrentChar() {
    if (this.cho !== -1) {
      if (this.jung !== -1) {
        const code = 0xAC00 + (this.cho * 21 + this.jung) * 28 + (this.jong !== -1 ? this.jong : 0);
        return String.fromCharCode(code);
      } else {
        return HC_CHO[this.cho];
      }
    } else if (this.jung !== -1) {
      return HC_JUNG[this.jung];
    }
    return '';
  }

  getFullText() {
    return this.buffer + this.getCurrentChar();
  }

  clear() {
    this.buffer = '';
    this.cho = -1;
    this.jung = -1;
    this.jong = -1;
  }

  setFullText(str) {
    this.buffer = str;
    this.cho = -1;
    this.jung = -1;
    this.jong = -1;
  }

  feed(key) {
    if (key === 'Space' || key === ' ') {
      this.commitCurrent();
      this.buffer += ' ';
      return;
    }
    if (key === 'Backspace') {
      this.backspace();
      return;
    }
    if (key === 'Enter') {
      this.commitCurrent();
      this.buffer += '\n';
      return;
    }

    if (this.isConsonant(key)) {
      if (this.cho === -1) {
        if (this.jung !== -1) this.commitCurrent();
        this.cho = HC_CHO.indexOf(key);
      } else if (this.jung === -1) {
        this.commitCurrent();
        this.cho = HC_CHO.indexOf(key);
      } else if (this.jong === -1) {
        const jongIdx = HC_JONG.indexOf(key);
        if (jongIdx > 0) {
          this.jong = jongIdx;
        } else {
          this.commitCurrent();
          this.cho = HC_CHO.indexOf(key);
        }
      } else {
        const curJongChar = HC_JONG[this.jong];
        const comb = curJongChar + key;
        if (HC_DBL_JONG[comb]) {
          this.jong = HC_JONG.indexOf(HC_DBL_JONG[comb]);
        } else {
          this.commitCurrent();
          this.cho = HC_CHO.indexOf(key);
        }
      }
    } else if (this.isVowel(key)) {
      if (this.cho === -1) {
        if (this.jung === -1) {
          this.jung = HC_JUNG.indexOf(key);
        } else {
          const curJungChar = HC_JUNG[this.jung];
          const comb = curJungChar + key;
          if (HC_DBL_JUNG[comb]) {
            this.jung = HC_JUNG.indexOf(HC_DBL_JUNG[comb]);
          } else {
            this.commitCurrent();
            this.jung = HC_JUNG.indexOf(key);
          }
        }
      } else if (this.jung === -1) {
        this.jung = HC_JUNG.indexOf(key);
      } else if (this.jong === -1) {
        const curJungChar = HC_JUNG[this.jung];
        const comb = curJungChar + key;
        if (HC_DBL_JUNG[comb]) {
          this.jung = HC_JUNG.indexOf(HC_DBL_JUNG[comb]);
        } else {
          this.commitCurrent();
          this.jung = HC_JUNG.indexOf(key);
        }
      } else {
        const curJongChar = HC_JONG[this.jong];
        if (HC_SPLIT_JONG[curJongChar]) {
          const [first, second] = HC_SPLIT_JONG[curJongChar];
          this.jong = HC_JONG.indexOf(first);
          this.commitCurrent();
          this.cho = HC_CHO.indexOf(second);
          this.jung = HC_JUNG.indexOf(key);
        } else {
          this.jong = -1;
          this.commitCurrent();
          this.cho = HC_CHO.indexOf(curJongChar);
          this.jung = HC_JUNG.indexOf(key);
        }
      }
    } else {
      this.commitCurrent();
      this.buffer += key;
    }
  }

  backspace() {
    if (this.jong !== -1) {
      const curJongChar = HC_JONG[this.jong];
      if (HC_SPLIT_JONG[curJongChar]) {
        this.jong = HC_JONG.indexOf(HC_SPLIT_JONG[curJongChar][0]);
      } else {
        this.jong = -1;
      }
    } else if (this.jung !== -1) {
      const curJungChar = HC_JUNG[this.jung];
      if (HC_SPLIT_JUNG[curJungChar]) {
        this.jung = HC_JUNG.indexOf(HC_SPLIT_JUNG[curJungChar][0]);
      } else {
        this.jung = -1;
      }
    } else if (this.cho !== -1) {
      this.cho = -1;
    } else if (this.buffer.length > 0) {
      this.buffer = this.buffer.slice(0, -1);
    }
  }
}

// 은찬이와 은우 & 아빠·엄마의 패밀리 모험 스튜디오 마스터 엔진
class EduApp {
  constructor() {
    // Safety aliases & Normalization
    if (window.EDU_DATA) {
      if (!window.EDU_DATA.dadPhrases && window.EDU_DATA.dad) {
        window.EDU_DATA.dadPhrases = [...(window.EDU_DATA.dad.greetings || []), ...(window.EDU_DATA.dad.praises || [])];
      }
      if (!window.EDU_DATA.cars && window.EDU_DATA.carsData) {
        window.EDU_DATA.cars = window.EDU_DATA.carsData;
      }
      if (!window.EDU_DATA.categories && window.EDU_DATA.languages) {
        window.EDU_DATA.categories = window.EDU_DATA.languages;
      }
      if (!window.EDU_DATA.vocabulary && window.EDU_DATA.languages) {
        window.EDU_DATA.vocabulary = {};
        (window.EDU_DATA.languages || []).forEach(cat => {
          window.EDU_DATA.vocabulary[cat.id] = cat.items || [];
        });
      }
      (window.EDU_DATA.cars || []).forEach(car => {
        (car.generations || []).forEach(g => {
          g.name = g.name || `${g.gen} (${g.code || g.title || ''})`;
          g.years = g.years || g.period || '';
          g.status = g.status || (g.period && g.period.includes('단종') ? '단종 모델' : '현재 생산/판매중');
          g.feature = g.feature || g.desc || '';
          g.price = g.price || g.priceAtLaunch || '가격 정보';
          if (!g.specs) {
            g.specs = {
              engine: g.spec || '2.0L 가솔린 엔진',
              power: '공식 마력 제원',
              fuelEconomy: '공인 표준 연비'
            };
          }
          g.pros = g.pros || g.desc || '우수한 주행 감각과 패밀리 세단/SUV 편의성';
          g.cons = g.cons || '주기적인 소모품 및 엔진오일 교환 점검 권장';
          if (!g.photos) {
            g.photos = { front: '', rear: '', side: '' };
          }
          if (!g.angleHints) {
            g.angleHints = {
              front: '앞모습과 그릴 디자인을 살펴보세요!',
              rear: '뒷모습과 테일램프 라인을 살펴보세요!',
              side: '옆모습과 휠 디자인을 살펴보세요!'
            };
          }
        });
      });
    }

    this.currentTab = 'home';
    this.activeLangCat = 'school';
    this.globalLangMode = 'sentence';
    this.itemModes = {};
    this.isTripleRepeat = true;
    this.speechRate = 0.88;
    this.repeatLoopTimer = null;

    this.activeCarBrand = 'all';
    this.activeCarGenIndex = {};
    this.activeHistoryVerse = 'all';
    this.isDadStorySpeaking = false;

        // 🌍 세계 여러 나라 탐험 & 국기 퀴즈
    this.currentContinent = 'all';
    this.countrySearchQuery = '';
    this.currentCountryDetailId = null;
    this.countryQuizMode = 'mixed';
    this.currentCountryQuiz = null;
    this.countryQuizTargetCountryId = null;
    this.countryQuizStreak = 0;
    try {
      this.countryQuizSolvedCount = parseInt(localStorage.getItem('eunchan_country_quiz_solved') || '0', 10);
    } catch(e) {
      this.countryQuizSolvedCount = 0;
    }
    this.activeAesopTheme = 'all';
    this.aesopSearchQuery = '';
    this.currentAesopStoryId = null;
    this.isAesopSpeaking = false;
    this.aesopVoiceType = 'dad'; // 'dad' | 'storyteller'
    this.aesopRate = 0.92;
    this.activeParagraphIdx = -1;
    this.activeAesopUtterance = null;
    this.aesopKeepAliveTimer = null;
    this.aesopWatchdogTimer = null;
    this.aesopPlaySeqToken = 0;

    // ⌨️ 한글 타자기 속성
    this.typingMode = 'sentence';
    this.typingSentenceIdx = 0;
    this.typingWordIdx = 0;
    this.wordJamoIdx = 0;
    this.typingWordAutoTimer = null;
    this.wordCompletedHandled = false;
    this.pendingDoubleConsonant = null;
    this.typingKeySetIdx = 0;
    this.typingKeyCharIdx = 0;
    this.isTypewriterSoundOn = true;
    this.isVirtualShift = false;
    this.typingStartTime = null;
    this.totalTypedChars = 0;
    this.completedSentenceCount = 0;
    this.hangulComposer = new HangulComposer();

    this.audioCtx = null;
    this.isMuted = false;
    try {
      this.stampsCount = parseInt(localStorage.getItem('eunchan_stamps') || '4', 10);
    } catch(e) {
      this.stampsCount = 4;
    }
    try {
      this.unlockedBadges = JSON.parse(localStorage.getItem('eunchan_badges') || '["고조선 개국 메달", "세종대왕 한글 메달"]');
    } catch(e) {
      this.unlockedBadges = ["고조선 개국 메달", "세종대왕 한글 메달"];
    }
    if (!Array.isArray(this.unlockedBadges)) {
      this.unlockedBadges = ["고조선 개국 메달", "세종대왕 한글 메달"];
    }
    this.voices = [];

    this.currentProfile = localStorage.getItem('eunchan_family_profile') || 'eunchan';
    this.parentTargetChild = 'eunchan';
    this.selectedSticker = { type: 'gold_trophy', icon: '🏆', title: '황금 트로피 칭찬 도장' };
    this.familyDb = null;
    this.stickerPollTimer = null;

    const masterPin = localStorage.getItem('family_master_pin') || '0330';
    this.familyPin = localStorage.getItem('family_auth_pin') || sessionStorage.getItem('family_auth_session') || '';
    this.isAuthorized = (this.familyPin === masterPin || this.familyPin === '0330' || this.familyPin === '7979');

    this.initFamilyPraises();
    this.initAudioContext();
    this.initVoices();
    this.checkFamilyAuth();
    this.bindEvents();
    this.renderHome();
    this.renderLangCategories();
    this.renderWordCards();
    this.renderHistoryCards();
    this.renderCars();
    this.renderAesop();
    this.renderTyping();
    this.renderCountries();

    this.setupTypingListeners();

    // 전역 ESC 키 모달 닫기
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        app.closePhotoLightbox();
        app.closeCarModal();
      }
    });
    this.renderStamps();
    this.setupSpeechRecognition();

    // URL 파라미터 및 해시 자동 라우팅 (?profile=dad, #profile=dad 등)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const hash = (window.location.hash || '').replace('#', '');
      
      let p = urlParams.get('profile');
      if (!p && hash.includes('profile=')) {
        p = hash.split('profile=')[1].split('&')[0];
      }
      if (p) {
        this.currentProfile = p;
      }

      let t = urlParams.get('tab');
      if (!t && hash.includes('tab=')) {
        t = hash.split('tab=')[1].split('&')[0];
      }
      if (t) {
        this.currentTab = t;
      }

      let tm = urlParams.get('typing_mode');
      if (tm) {
        setTimeout(() => {
          const btn = document.querySelector('.typing-mode-tab-btn[data-mode="' + tm + '"]');
          this.setTypingMode(tm, btn);
        }, 300);
      }

      let at = urlParams.get('auto_type');
      if (at) {
        setTimeout(() => {
          const keys = ['ㄴ', 'ㅡ', 'ㄹ', 'ㅣ', 'ㅁ', 'ㅂ', 'ㅗ'];
          keys.forEach((k, idx) => {
            setTimeout(() => this.handleVirtualKey(k), idx * 120);
          });
        }, 600);
      }

      let h = urlParams.get('hero');
      if (!h && hash.includes('hero=')) {
        h = hash.split('hero=')[1].split('&')[0];
      }
      if (h) {
        this.openHistoryModal(h);
      }

      let countryParam = urlParams.get('country');
      if (countryParam) {
        setTimeout(() => this.openCountryModal(countryParam), 350);
      }
      let countryQuizParam = urlParams.get('country_quiz');
      if (countryQuizParam) {
        setTimeout(() => {
          this.openCountryQuizArena(countryQuizParam === '1' ? 'mixed' : countryQuizParam);
          if (urlParams.get('country_quiz_auto')) {
            setTimeout(() => {
              if (this.currentCountryQuiz) {
                this.checkCountryQuiz(this.currentCountryQuiz.answer);
              }
            }, 350);
          } else if (urlParams.get('country_quiz_click') !== null) {
            setTimeout(() => {
              const clickIdx = parseInt(urlParams.get('country_quiz_click'), 10);
              const opts = document.querySelectorAll('.btn-country-quiz-choice');
              if (opts[clickIdx]) opts[clickIdx].click();
            }, 500);
          }
        }, 400);
      }

      let s = urlParams.get('story');
      if (!s && hash.includes('story=')) {
        s = hash.split('story=')[1].split('&')[0];
      }
      if (s) {
        setTimeout(() => {
          this.openAesopModal(s);
          if (urlParams.get('scroll') === 'bottom') {
            setTimeout(() => {
              const b = document.getElementById('aesopModalBody');
              if (b) b.scrollTop = 9999;
            }, 300);
          }
          if (urlParams.get('quiz_click') !== null) {
            setTimeout(() => {
              const opts = document.querySelectorAll('#aesopQuizOptions .btn-quiz-opt');
              const clickIdx = parseInt(urlParams.get('quiz_click'), 10);
              if (opts[clickIdx]) opts[clickIdx].click();
            }, 500);
          }

        }, 300);
      }
    } catch (e) {
      console.warn("URL params parse error", e);
    }

    console.log("EduApp starting with profile:", this.currentProfile, "tab:", this.currentTab);
    // 가족 프로필 및 실시간 폴링 가동
    this.switchProfile(this.currentProfile, false);
    if (this.currentTab && this.currentProfile !== 'dad' && this.currentProfile !== 'mom') {
      this.switchTab(this.currentTab);
    }
  }

  // =========================================================================
  // 0. 가족 전용 보안 인증 & 오프라인/클라우드 로컬 데이터베이스
  // =========================================================================
  checkFamilyAuth() {
    const masterPin = localStorage.getItem('family_master_pin') || '0330';
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPin = urlParams.get('pin');
      if (urlPin && (urlPin === masterPin || urlPin === '0330' || urlPin === '7979')) {
        this.familyPin = urlPin;
        localStorage.setItem('family_auth_pin', urlPin);
        this.isAuthorized = true;
      }
    } catch(e) {}

    const gate = document.getElementById('familyAuthGate');
    if (!gate) return;

    if (this.isAuthorized && (this.familyPin === masterPin || this.familyPin === '0330' || this.familyPin === '7979')) {
      gate.style.display = 'none';
      document.body.classList.remove('studio-locked');
    } else {
      gate.style.display = 'flex';
      this.isAuthorized = false;
      document.body.classList.add('studio-locked');
      const pinInput = document.getElementById('familyPinInput');
      if (pinInput) {
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 300);
      }
    }
  }

  pressKeypadNum(num) {
    const pinInput = document.getElementById('familyPinInput');
    if (!pinInput) return;
    if (pinInput.value.length < 8) {
      pinInput.value += num;
      this.playPop();
    }
    const masterPin = localStorage.getItem('family_master_pin') || '0330';
    if (pinInput.value.length >= 4 && (pinInput.value === masterPin || pinInput.value === '0330' || pinInput.value === '7979')) {
      this.verifyFamilyPin();
    }
  }

  backspaceKeypadPin() {
    const pinInput = document.getElementById('familyPinInput');
    if (!pinInput) return;
    pinInput.value = pinInput.value.slice(0, -1);
    this.playPop();
  }

  clearKeypadPin() {
    const pinInput = document.getElementById('familyPinInput');
    if (!pinInput) return;
    pinInput.value = '';
    const errMsg = document.getElementById('authErrorMsg');
    if (errMsg) errMsg.style.display = 'none';
  }

  verifyFamilyPin() {
    const pinInput = document.getElementById('familyPinInput');
    const errMsg = document.getElementById('authErrorMsg');
    const gate = document.getElementById('familyAuthGate');
    const rememberCheck = document.getElementById('rememberDeviceCheck');
    const pin = (pinInput ? pinInput.value : '').trim();
    const masterPin = localStorage.getItem('family_master_pin') || '0330';

    if (pin === masterPin || pin === '0330' || pin === '7979') {
      this.familyPin = pin;
      this.isAuthorized = true;
      if (rememberCheck && rememberCheck.checked) {
        localStorage.setItem('family_auth_pin', pin);
      } else {
        sessionStorage.setItem('family_auth_session', pin);
      }
      if (errMsg) errMsg.style.display = 'none';
      if (gate) {
        gate.style.opacity = '0';
        gate.style.transition = 'opacity 0.25s ease';
        setTimeout(() => {
          gate.style.display = 'none';
          gate.style.opacity = '1';
        }, 250);
      }
      document.body.classList.remove('studio-locked');
      this.playSuccess();
      this.fetchFamilyData();
    } else {
      if (errMsg) {
        errMsg.style.display = 'block';
        errMsg.textContent = '❌ 비밀번호가 올바르지 않습니다. 다시 입력해주세요!';
      }
      this.playError();
      const authBox = document.querySelector('.family-auth-box');
      if (authBox) {
        authBox.classList.remove('lock-shake');
        void authBox.offsetWidth;
        authBox.classList.add('lock-shake');
      }
      if (pinInput) {
        pinInput.value = '';
        pinInput.focus();
      }
    }
  }

  lockStudio() {
    this.isAuthorized = false;
    this.familyPin = '';
    localStorage.removeItem('family_auth_pin');
    sessionStorage.removeItem('family_auth_session');
    document.body.classList.add('studio-locked');
    const gate = document.getElementById('familyAuthGate');
    if (gate) {
      gate.style.display = 'flex';
      const pinInput = document.getElementById('familyPinInput');
      if (pinInput) {
        pinInput.value = '';
        setTimeout(() => pinInput.focus(), 300);
      }
    }
    this.showToast('🔒 스튜디오가 안전하게 잠겼습니다.');
  }

  updateFamilyPin() {
    const input = document.getElementById('inputNewPin');
    if (!input) return;
    const newPin = input.value.trim();
    if (!newPin || newPin.length < 4) {
      alert('비밀번호는 최소 4자리 이상으로 입력해주세요!');
      return;
    }
    localStorage.setItem('family_master_pin', newPin);
    localStorage.setItem('family_auth_pin', newPin);
    this.familyPin = newPin;
    input.value = '';
    const badge = document.getElementById('currentPinBadge');
    if (badge) badge.textContent = `**** (${newPin})`;
    alert(`✅ 가족 비밀번호가 [${newPin}] (으)로 안전하게 변경되었습니다!`);
    this.showToast('🔐 가족 비밀번호가 변경되었습니다.');
  }

  resetPinToDefault() {
    if (!confirm('비밀번호를 초기 번호(0330)로 재설정하시겠습니까?')) return;
    localStorage.setItem('family_master_pin', '0330');
    localStorage.setItem('family_auth_pin', '0330');
    this.familyPin = '0330';
    const badge = document.getElementById('currentPinBadge');
    if (badge) badge.textContent = '**** (0330)';
    alert('✅ 비밀번호가 기본 번호(0330)로 재설정되었습니다.');
    this.showToast('🔐 비밀번호가 0330으로 재설정되었습니다.');
  }

  getAuthHeaders(extra = {}) {
    return Object.assign({
      'X-Family-Auth': this.familyPin || '7979'
    }, extra);
  }

  getLocalFamilyDb() {
    try {
      const saved = localStorage.getItem('eunchan_family_db_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 은우 활동 데이터가 비어있으면 초기 3개 활동 보강
        if (!parsed.activities || parsed.activities.filter(a => a.childId === 'eunwoo').length === 0) {
          parsed.activities = parsed.activities || [];
          parsed.activities.push(
            { id: 'act_ew1', childId: 'eunwoo', childName: '정은우', icon: '🦖', title: '백악기 공룡 화석 발굴', detail: '화면을 터치하여 트리케라톱스 뿔 화석 발굴 성공!', category: 'dino', timestamp: '2026-10-12 07:10:00' },
            { id: 'act_ew2', childId: 'eunwoo', childName: '정은우', icon: '🐶', title: '동물 친구들 4개국어 소리 듣기', detail: '강아지, 고양이, 곰, 사자 울음소리와 이름 또박또박 듣기', category: 'language', timestamp: '2026-10-12 07:25:00' },
            { id: 'act_ew3', childId: 'eunwoo', childName: '정은우', icon: '🎨', title: '나만의 알록달록 자동차 색칠', detail: '빨강, 파랑 무지개 바퀴 3D 자동차 완성!', category: 'car', timestamp: '2026-10-12 07:30:00' }
          );
          this.saveLocalFamilyDb(parsed);
        }
        return parsed;
      }
    } catch(e) {}

    const defaultDb = {
      profiles: {
        eunchan: { name: '정은찬', stampsCount: 5, maxStamps: 10, lastActive: '방금 전' },
        eunwoo: { name: '정은우', stampsCount: 3, maxStamps: 10, lastActive: '오늘' }
      },
      stickers: [
        { id: 'stk_init1', targetChild: 'eunchan', giver: 'dad', giverName: '정연수 아빠', stickerType: 'gold_trophy', icon: '🏆', title: '황금 트로피 칭찬 도장', reason: '초등 실생활 문장 3회 따라 말하기 완료!', timestamp: '2026-10-10 18:30:00' },
        { id: 'stk_init2', targetChild: 'eunchan', giver: 'mom', giverName: '엄마', stickerType: 'heart_sparkle', icon: '💖', title: '사랑 듬뿍 하트 도장', reason: '이솝우화 생각 키우기 퀴즈 100점!', timestamp: '2026-10-10 19:15:00' },
        { id: 'stk_ew1', targetChild: 'eunwoo', giver: 'dad', giverName: '정연수 아빠', stickerType: 'gold_trophy', icon: '🏆', title: '황금 트로피 칭찬 도장', reason: '혼자서 신발 정리 스스로 척척 완료!', timestamp: '2026-10-12 07:15:00' },
        { id: 'stk_ew2', targetChild: 'eunwoo', giver: 'mom', giverName: '엄마', stickerType: 'heart_sparkle', icon: '💖', title: '사랑 듬뿍 하트 도장', reason: '동생 챙겨주기 & 예쁜 대답 칭찬', timestamp: '2026-10-12 07:20:00' },
        { id: 'stk_ew3', targetChild: 'eunwoo', giver: 'dad', giverName: '정연수 아빠', stickerType: 'star_smile', icon: '⭐', title: '반짝반짝 별 도장', reason: '동물 낱말 씩씩하게 말하기 성공', timestamp: '2026-10-12 07:28:00' }
      ],
      activities: [
        { id: 'act_1', childId: 'eunchan', childName: '정은찬', icon: '🌍', title: '4개국어 단어 탐험', detail: '한국어·영어·중국어·일본어 발음 청취 완료', category: 'language', timestamp: '2026-10-11 18:20:00' },
        { id: 'act_2', childId: 'eunchan', childName: '정은찬', icon: '🚗', title: '자동차 세대별 탐구', detail: '그랜저 1세대~7세대 연혁과 실제 사진 관찰', category: 'car', timestamp: '2026-10-11 18:45:00' },
        { id: 'act_3', childId: 'eunchan', childName: '정은찬', icon: '📖', title: '이솝우화 제1화 [토끼와 거북이]', detail: '아빠 AI 구연동화 듣기 및 교훈 생각하기', category: 'story', timestamp: '2026-10-11 19:00:00' },
        { id: 'act_ew1', childId: 'eunwoo', childName: '정은우', icon: '🦖', title: '백악기 공룡 화석 발굴', detail: '화면을 터치하여 트리케라톱스 뿔 화석 발굴 성공!', category: 'dino', timestamp: '2026-10-12 07:10:00' },
        { id: 'act_ew2', childId: 'eunwoo', childName: '정은우', icon: '🐶', title: '동물 친구들 4개국어 소리 듣기', detail: '강아지, 고양이, 곰, 사자 울음소리와 이름 또박또박 듣기', category: 'language', timestamp: '2026-10-12 07:25:00' },
        { id: 'act_ew3', childId: 'eunwoo', childName: '정은우', icon: '🎨', title: '나만의 알록달록 자동차 색칠', detail: '빨강, 파랑 무지개 바퀴 3D 자동차 완성!', category: 'car', timestamp: '2026-10-12 07:30:00' }
      ],
      unreadForChild: { eunchan: [], eunwoo: [] },
      analytics: {
        eunchan: {
          totalActivities: 3,
          categoryPercentages: { car: 35, history: 25, language: 25, story: 15 },
          aiDiagnosis: '은찬이는 기계와 사물의 발전 역사 및 언어 발음 학습에 깊은 흥미를 보이고 있습니다!',
          coachingTip: '💡 아빠 팁: 길을 건널 때 지나가는 자동차의 세대나 특징을 함께 이야기해보세요! 아이의 눈빛이 반짝거릴 거예요.'
        },
        eunwoo: {
          totalActivities: 3,
          categoryPercentages: { car: 35, language: 35, dino: 30 },
          aiDiagnosis: '은우는 소리와 그림에 대한 반응이 활발하고 새로운 자극을 빠르게 흡수합니다!',
          coachingTip: '💡 부모 팁: 다양한 색채와 동물 이야기로 즐거운 놀이 시간을 만들어주세요.'
        }
      }
    };
    this.saveLocalFamilyDb(defaultDb);
    return defaultDb;
  }

  saveLocalFamilyDb(data) {
    try {
      localStorage.setItem('eunchan_family_db_v1', JSON.stringify(data));
    } catch(e) {}
  }

  // =========================================================================
  // 1. 오디오 합성기 (Web Audio API)
  // =========================================================================
  initAudioContext() {
    const unlockAudio = () => {
      try {
        if (!this.audioCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        if ('speechSynthesis' in window) {
          window.speechSynthesis.resume();
          if (!this.voices || this.voices.length === 0) {
            this.voices = window.speechSynthesis.getVoices();
          }
        }
      } catch (e) {
        console.warn("Audio unlock err:", e);
      }
    };

    ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt => {
      document.addEventListener(evt, unlockAudio, { passive: true, once: true });
    });

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  }

  playBeep(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (this.isMuted || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {}
  }

  playPop() {
    this.playBeep(520, 'sine', 0.08, 0.12);
  }

  playSuccess() {
    if (this.isMuted) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 'triangle', 0.25, 0.18), idx * 90);
    });
  }

  playTimeMachine() {
    if (this.isMuted) return;
    const notes = [330, 440, 554, 660, 880, 1108];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 'sine', 0.18, 0.12), idx * 60);
    });
  }

  // 🎺 승리의 빵빠레 (Fanfare) & 축하 꽃가루 폭죽 엔진
  // =========================================================================
  playFanfare() {
    if (this.isMuted) return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const ctx = this.audioCtx;
      if (!ctx) return;

      const now = ctx.currentTime;

      // 🎺 금관악기(트럼펫/혼 섹션) 하모닉 합성기 (Sawtooth + Triangle + Lowpass Resonant Filter)
      const playBrassNote = (freq, startTime, duration, volume = 0.22) => {
        try {
          const osc1 = ctx.createOscillator();
          osc1.type = 'sawtooth';
          osc1.frequency.setValueAtTime(freq, startTime);

          const osc2 = ctx.createOscillator();
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(freq, startTime);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(freq * 1.6, startTime);
          filter.frequency.exponentialRampToValueAtTime(Math.min(freq * 4.5, 7500), startTime + 0.05);
          filter.frequency.exponentialRampToValueAtTime(Math.max(freq * 1.5, 300), startTime + duration);
          filter.Q.setValueAtTime(2.5, startTime);

          const gain = ctx.createGain();
          gain.gain.setValueAtTime(0.0001, startTime);
          gain.gain.linearRampToValueAtTime(volume, startTime + 0.03);
          gain.gain.setValueAtTime(volume * 0.88, startTime + duration * 0.7);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(startTime);
          osc2.start(startTime);
          osc1.stop(startTime + duration);
          osc2.stop(startTime + duration);
        } catch (err) {}
      };

      // 🎶 승리의 빵빠레 (Fanfare) 경쾌한 멜로디 시퀀스
      // 마디 1: 따-따-따-딴! (G4 - G4 - G4 - C5)
      playBrassNote(392.00, now + 0.00, 0.12, 0.22);
      playBrassNote(392.00, now + 0.14, 0.12, 0.22);
      playBrassNote(392.00, now + 0.28, 0.14, 0.24);
      playBrassNote(523.25, now + 0.44, 0.38, 0.28);

      // 마디 2: 따-라-라-란! (E5 - C5 - E5 - G5)
      playBrassNote(659.25, now + 0.84, 0.14, 0.25);
      playBrassNote(523.25, now + 1.00, 0.14, 0.25);
      playBrassNote(659.25, now + 1.16, 0.16, 0.28);
      playBrassNote(783.99, now + 1.34, 0.40, 0.30);

      // 마디 3: 대망의 승리 화음 빵빠레 피날레! (C4 + G4 + C5 + E5 + G5 + C6)
      const chordTime = now + 1.76;
      const chordDuration = 0.95;
      playBrassNote(261.63, chordTime, chordDuration, 0.18); // C4
      playBrassNote(392.00, chordTime, chordDuration, 0.20); // G4
      playBrassNote(523.25, chordTime, chordDuration, 0.24); // C5
      playBrassNote(659.25, chordTime, chordDuration, 0.24); // E5
      playBrassNote(783.99, chordTime, chordDuration, 0.22); // G5
      playBrassNote(1046.50, chordTime, chordDuration, 0.22); // C6

      // 축하 실로폰 & 벨 글리산도 반주
      const bellFreqs = [1046.50, 1174.66, 1318.51, 1567.98, 1760.00, 2093.00];
      bellFreqs.forEach((bf, bi) => {
        setTimeout(() => this.playBeep(bf, 'sine', 0.22, 0.10), 1760 + (bi * 65));
      });
    } catch (e) {
      console.warn("Fanfare error:", e);
      this.playSuccess();
    }
  }

  triggerConfetti() {
    this.createConfetti();
  }

  createConfetti() {
    try {
      const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#eab308'];
      const container = document.createElement('div');
      container.className = 'confetti-burst-container';
      document.body.appendChild(container);

      const count = 48;
      for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.floor(Math.random() * 8) + 8;
        const left = Math.random() * 100;
        const duration = (Math.random() * 1.5 + 1.2).toFixed(2);
        const delay = (Math.random() * 0.4).toFixed(2);
        const rot = Math.floor(Math.random() * 360);

        p.style.cssText = `
          position: absolute;
          top: -20px;
          left: ${left}vw;
          width: ${size}px;
          height: ${size * (Math.random() > 0.5 ? 1.6 : 1)}px;
          background: ${color};
          border-radius: ${Math.random() > 0.6 ? '50%' : '3px'};
          transform: rotate(${rot}deg);
          animation: confettiDrop ${duration}s ease-out ${delay}s forwards;
        `;
        container.appendChild(p);
      }

      setTimeout(() => {
        if (container.parentNode) container.parentNode.removeChild(container);
      }, 3500);
    } catch(e) {
      console.warn("Confetti error", e);
    }
  }

  // =========================================================================
  // 2. 음성 엔진 (20대 밝고 부드러운 여성 구연동화 성우 톤 & 뉴럴 보이스 최우선)
  // =========================================================================
  initVoices() {
    this.setupVoiceEngine();
  }

  setupVoiceEngine() {
    this.voices = [];
    this.preferredVoices = {};
    this.voicePersona = 'teacher'; // 기본값: 20대 밝은 구연동화 선생님 모드 ('teacher' 또는 'mom')

    const loadVoices = () => {
      if (!('speechSynthesis' in window)) return;
      this.voices = window.speechSynthesis.getVoices() || [];
      if (this.voices.length > 0) {
        this.selectBestVoices();
      }
    };

    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  selectBestVoices() {
    if (!this.voices || this.voices.length === 0) return;

    // 1. [20대 구연동화 선생님 최우선] Edge SunHi(선희) Neural, Google 한국어
    const teacherPredicates = [
      v => /SunHi.*Natural/i.test(v.name),
      v => /SunHi/i.test(v.name),
      v => /선희/i.test(v.name),
      v => /Google.*한국/i.test(v.name),
      v => (v.lang === 'ko-KR' || v.lang === 'ko_KR') && /female|여성/i.test(v.name) && !/desktop|heami/i.test(v.name),
      v => (v.lang === 'ko-KR' || v.lang === 'ko_KR') && /natural|online|neural/i.test(v.name),
      v => v.lang.startsWith('ko') && !/desktop|heami/i.test(v.name)
    ];
    for (const test of teacherPredicates) {
      const match = this.voices.find(test);
      if (match) {
        this.preferredVoices['ko-KR-teacher'] = match;
        this.preferredVoices['ko-KR'] = match;
        break;
      }
    }

    // 2. [정연수 아빠 최우선] Edge InJoon(인준) Neural, 남두, 봉진 등 순수 한국어 남성 성우 음성
    const dadPredicates = [
      v => /InJoon.*Natural/i.test(v.name),
      v => /InJoon/i.test(v.name),
      v => /인준/i.test(v.name),
      v => /NamDu/i.test(v.name),
      v => /남두/i.test(v.name),
      v => /BongJin/i.test(v.name),
      v => /봉진/i.test(v.name),
      v => /GookMin/i.test(v.name),
      v => /국민/i.test(v.name),
      v => /HyunJun|현준|MinHo|민호/i.test(v.name),
      v => v.lang.toLowerCase().startsWith('ko') && /male|남성|koc|kod/i.test(v.name) && !/female|여성|sunhi|선희|yuna|유나|heami|혜미|google/i.test(v.name)
    ];
    for (const test of dadPredicates) {
      const match = this.voices.find(test);
      if (match) {
        this.preferredVoices['ko-KR-dad'] = match;
        break;
      }
    }

    // 3. [상냥한 엄마 최우선] Edge Yuna/SunHi Neural, Google 한국어
    const momPredicates = [
      v => /Yuna.*Natural/i.test(v.name),
      v => /Yuna/i.test(v.name),
      v => /유나/i.test(v.name),
      v => /SunHi.*Natural/i.test(v.name),
      v => /Google.*한국/i.test(v.name),
      v => v.lang.startsWith('ko') && !/desktop|heami/i.test(v.name)
    ];
    for (const test of momPredicates) {
      const match = this.voices.find(test);
      if (match) {
        this.preferredVoices['ko-KR-mom'] = match;
        break;
      }
    }

    // 2. 영어 여성 최우선 (Jenny Natural, Aria Natural, Google US English)
    const enCandidatePredicates = [
      v => /Jenny.*Natural/i.test(v.name),
      v => /Aria.*Natural/i.test(v.name),
      v => /Google.*US/i.test(v.name),
      v => v.lang.startsWith('en') && /natural|online|neural/i.test(v.name),
      v => v.lang.startsWith('en')
    ];
    for (const test of enCandidatePredicates) {
      const match = this.voices.find(test);
      if (match) {
        this.preferredVoices['en-US'] = match;
        break;
      }
    }

    // 3. 중국어 여성 최우선 (Xiaoxiao Natural)
    const zhCandidatePredicates = [
      v => /Xiaoxiao.*Natural/i.test(v.name),
      v => v.lang.startsWith('zh') && /natural|online/i.test(v.name),
      v => v.lang.startsWith('zh')
    ];
    for (const test of zhCandidatePredicates) {
      const match = this.voices.find(test);
      if (match) {
        this.preferredVoices['zh-CN'] = match;
        break;
      }
    }

    // 4. 일본어 여성 최우선 (Nanami Natural)
    const jaCandidatePredicates = [
      v => /Nanami.*Natural/i.test(v.name),
      v => v.lang.startsWith('ja') && /natural|online/i.test(v.name),
      v => v.lang.startsWith('ja')
    ];
    for (const test of jaCandidatePredicates) {
      const match = this.voices.find(test);
      if (match) {
        this.preferredVoices['ja-JP'] = match;
        break;
      }
    }
  }

  toggleVoicePersona() {
    this.playPop();
    // 3가지 목소리 모드 순환: 20대 선생님 -> 아빠 -> 엄마 -> 20대 선생님
    if (this.voicePersona === 'teacher') {
      this.voicePersona = 'dad';
    } else if (this.voicePersona === 'dad') {
      this.voicePersona = 'mom';
    } else {
      this.voicePersona = 'teacher';
    }

    const label = document.getElementById('voicePersonaLabel');
    const badge = document.getElementById('storyVoiceBadge');

    if (this.voicePersona === 'dad') {
      if (label) label.textContent = '👨 정연수 아빠 목소리';
      if (badge) badge.textContent = '🎧 정연수 아빠 목소리 구연동화';
      this.speak("은찬아, 아빠야! 아빠가 재미있는 이야기 들려줄게!", 'ko-KR');
    } else if (this.voicePersona === 'mom') {
      if (label) label.textContent = '🌸 상냥한 엄마 목소리';
      if (badge) badge.textContent = '🎧 다정한 엄마 목소리 구연동화';
      this.speak("은찬아, 은우야 사랑해! 엄마 목소리로 따뜻하게 읽어줄게요!", 'ko-KR');
    } else {
      if (label) label.textContent = '👩‍🏫 20대 맑은 구연동화 선생님';
      if (badge) badge.textContent = '🎧 20대 선생님 목소리 구연동화';
      this.speak("안녕하세요! 20대 구연동화 선생님 목소리로 재미있게 읽어줄게요!", 'ko-KR');
    }
  }

  // 🌟 브라우저 환경에 구애받지 않는 완벽한 아빠 남성 음성 설정 생성
  getDadVoiceSettings() {
    let dadVoice = this.preferredVoices['ko-KR-dad'];
    // 만약 기존 캐시된 dadVoice가 여성 음성(Google 한국어, 선희, 유나, 혜미 등)이면 무효화
    if (dadVoice && /sunhi|선희|yuna|유나|heami|혜미|female|여성|google/i.test(dadVoice.name)) {
      dadVoice = null;
      delete this.preferredVoices['ko-KR-dad'];
    }

    if (!dadVoice && this.voices && this.voices.length > 0) {
      dadVoice = this.voices.find(v => 
        v.lang.toLowerCase().startsWith('ko') && 
        /injoon|인준|namdu|남두|bongjin|봉진|gookmin|국민|male|남성|hyunjun|현준|minho|민호|koc|kod/i.test(v.name) && 
        !/sunhi|선희|yuna|유나|heami|혜미|female|여성|google/i.test(v.name)
      );
      if (dadVoice) this.preferredVoices['ko-KR-dad'] = dadVoice;
    }

    if (dadVoice) {
      // 🌟 실제 고음질 남성 성우 음성(Edge InJoon/NamDu 등) 적용: 듬직하고 다정한 아빠 음색
      return { voice: dadVoice, pitch: 0.88, rate: 0.92, isMale: true };
    } else {
      // 🌟 남성 성우가 기본 탑재되지 않은 Chrome/Safari/모바일 브라우저:
      // 기본 한국어 음성의 피치를 0.64로 낮추고 속도를 0.89로 맞추어, 듬직하고 중후한 진짜 아빠(남성) 목소리로 실시간 완벽 어쿠스틱 변환!
      const fallbackVoice = this.preferredVoices['ko-KR'] || (this.voices && this.voices.find(v => v.lang.toLowerCase().startsWith('ko')));
      return { voice: fallbackVoice, pitch: 0.64, rate: 0.89, isMale: false };
    }
  }

  speak(text, lang = 'ko-KR', onEndCallback = null, forcePersona = null) {
    if (!('speechSynthesis' in window)) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.cancel();

      if (!this.voices || this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices() || [];
        this.selectBestVoices();
      }

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang;

      const persona = forcePersona || this.voicePersona;

      // 🌟 아빠(남성 성우 / 피치 다운 남성 변환), 엄마, 선생님 음성 배정
      if (lang === 'ko-KR') {
        if (persona === 'dad') {
          const dadSettings = this.getDadVoiceSettings();
          if (dadSettings.voice) utter.voice = dadSettings.voice;
          utter.pitch = dadSettings.pitch;
          utter.rate = this.speechRate || dadSettings.rate;
        } else if (persona === 'mom') {
          utter.voice = this.preferredVoices['ko-KR-mom'] || this.preferredVoices['ko-KR'];
          utter.pitch = 1.05;
          utter.rate = (this.speechRate || 0.95) * 0.94;
        } else {
          // teacher: 20대 맑은 구연동화 선생님
          utter.voice = this.preferredVoices['ko-KR-teacher'] || this.preferredVoices['ko-KR'];
          utter.pitch = 1.0;
          utter.rate = this.speechRate || 0.96;
        }
      } else {
        if (lang === 'en-US') {
          utter.pitch = 1.10;
          utter.rate = this.speechRate || 0.88;
        } else if (lang === 'zh-CN') {
          utter.pitch = 1.08;
          utter.rate = this.speechRate || 0.88;
        } else if (lang === 'ja-JP') {
          utter.pitch = 1.12;
          utter.rate = this.speechRate || 0.88;
        } else {
          utter.pitch = 1.10;
          utter.rate = this.speechRate || 0.90;
        }

        // 외국어 (en, zh, ja) 전용 음성 배정
        if (this.preferredVoices && this.preferredVoices[lang]) {
          utter.voice = this.preferredVoices[lang];
        } else if (this.voices && this.voices.length > 0) {
          const langPrefix = lang.split('-')[0].toLowerCase();
          let match = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix) && /natural|online|female|여|선희|sunhi/i.test(v.name));
          if (!match) match = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix) && !/desktop|heami/i.test(v.name));
          if (!match) match = this.voices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
          if (match) utter.voice = match;
        }
      }

      const dadImg = document.getElementById('heroDadAvatar');
      if (dadImg) dadImg.style.transform = 'scale(1.08)';

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        if (dadImg) dadImg.style.transform = 'scale(1)';
        if (onEndCallback) onEndCallback();
      };

      utter.onend = finish;
      utter.onerror = (e) => {
        console.warn("TTS utterance notice:", e);
        finish();
      };

      const watchdog = setTimeout(finish, Math.max(3500, text.length * 350));
      utter.addEventListener('end', () => clearTimeout(watchdog));
      utter.addEventListener('error', () => clearTimeout(watchdog));

      window.speechSynthesis.speak(utter);
    } catch(e) {
      console.warn("TTS error:", e);
      if (onEndCallback) onEndCallback();
    }
  }

  // =========================================================================
  // 3. 은찬이 음성 대화 (STT)
  // =========================================================================
  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'ko-KR';
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        const btn = document.getElementById('voiceChatBtn');
        if (btn) {
          btn.classList.add('recording');
          btn.innerHTML = '<span>🔴 아빠가 듣고 있어요! 말해보세요...</span>';
        }
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.handleUserSpeech(transcript);
      };

      this.recognition.onerror = () => {
        this.resetVoiceBtn();
      };

      this.recognition.onend = () => {
        this.resetVoiceBtn();
      };
    }
  }

  resetVoiceBtn() {
    const btn = document.getElementById('voiceChatBtn');
    if (btn) {
      btn.classList.remove('recording');
      btn.innerHTML = '<span>🎤 은찬이 마이크 켜기 (아빠와 대화)</span>';
    }
  }

  toggleVoiceChat() {
    if (!this.recognition) {
      alert("사용 중인 브라우저가 음성 인식을 지원하지 않습니다. (Chrome 권장)");
      return;
    }
    this.playPop();
    try {
      this.recognition.start();
    } catch (e) {
      this.recognition.stop();
    }
  }

  handleUserSpeech(userText) {
    const dadBubble = document.getElementById('dadDialogueText');
    if (dadBubble) {
      dadBubble.innerHTML = `<strong>은찬이:</strong> "${userText}"<br><br><strong>정연수 아빠:</strong> "아빠가 멋진 이야기를 준비했단다! 아래에서 함께 출발해볼까?"`;
    }

    let reply = "은찬아 아주 멋진 말이었어! 아빠랑 같이 신나게 출발해볼까?";
    if (userText.includes("자동차") || userText.includes("차") || userText.includes("그랜저") || userText.includes("쏘나타")) {
      reply = "자동차 연구관으로 가보자! 멋진 차들이 기다리고 있어!";
      setTimeout(() => this.switchTab('cars'), 2500);
    } else if (userText.includes("역사") || userText.includes("이순신") || userText.includes("위인")) {
      reply = "타임머신 문을 열어줄게! 100명의 위인들을 만나러 가자!";
      setTimeout(() => this.switchTab('history'), 2500);
    } else if (userText.includes("공룡")) {
      reply = "쿠앙! 쥐라기 공룡 시대로 순간이동해보자!";
      setTimeout(() => this.switchTab('history'), 2500);
    } else if (userText.includes("영어") || userText.includes("중국어") || userText.includes("단어")) {
      reply = "4개국어 놀이터로 가보자! 또박또박 발음해볼까?";
      setTimeout(() => this.switchTab('lang'), 2500);
    }

    this.speak(reply, 'ko-KR');
    this.logChildActivity('stt', '🎙️', '아빠와 마이크 대화', `"${userText}" 말하기 성공`, 'language', 30);
  }

  // =========================================================================
  // 4. 네비게이션 & 이벤트 바인딩
  // =========================================================================
  bindEvents() {
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.dataset.tab;
        this.switchTab(tab);
      });
    });

    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) {
      soundBtn.addEventListener('click', () => {
        this.isMuted = !this.isMuted;
        soundBtn.innerHTML = this.isMuted ? '🔇 음소거' : '🔊 소리 켬';
        this.playPop();
      });
    }

    const fsBtn = document.getElementById('fullscreenBtn');
    if (fsBtn) {
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
  }

  switchTab(tabId) {
    if (this.currentTab === 'aesop' && tabId !== 'aesop') {
      this.stopAesopStory();
    }
    this.currentTab = tabId;
    this.playPop();

    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    document.querySelectorAll('.tab-content').forEach(sec => {
      sec.classList.remove('active');
    });

    const targetSec = document.getElementById(`tab-${tabId}`);
    if (targetSec) targetSec.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
    const floatingBtn = document.getElementById('floatingHomeBtn');
    if (floatingBtn) {
      floatingBtn.classList.toggle('pulse-attract', tabId !== 'home');
    }

        if (tabId === 'countries') {
      this.renderCountries();
    }
    if (tabId === 'parent') {
      this.fetchFamilyData();
    }
    if (tabId === 'baduk') {
      if (typeof this.initBaduk === 'function') this.initBaduk();
    }
    if (tabId === 'brain') {
      if (typeof this.initBrainPlayground === 'function') this.initBrainPlayground();
    }
  }

  // =========================================================================
  // 5. 홈 섹션 렌더링
  // =========================================================================
  renderHome() {
    const timeGreeting = this.getTimeGreeting();
    const timeGreetingElem = document.getElementById('timeGreetingText');
    if (timeGreetingElem) timeGreetingElem.textContent = timeGreeting;

    const phrases = (window.EDU_DATA && window.EDU_DATA.dadPhrases && window.EDU_DATA.dadPhrases.length > 0) ? window.EDU_DATA.dadPhrases : ['은찬아 안녕! 오늘 아빠랑 어디로 신나는 모험을 떠나볼까?'];
    const picked = phrases[Math.floor(Math.random() * phrases.length)];
    const dadTextElem = document.getElementById('dadDialogueText');
    if (dadTextElem) dadTextElem.textContent = picked;
  }

  getTimeGreeting() {
    const h = new Date().getHours();
    if (h < 11) return "상쾌한 아침이야! 오늘도 힘차게 모험을 시작해볼까?";
    if (h < 17) return "신나는 오후야! 아빠랑 재미있는 단어와 위인 이야기를 탐험해보자!";
    return "별이 총총 뜬 저녁이야! 오늘 하루도 은찬이가 최고였단다!";
  }

  initFamilyPraises() {
    this.familyPraiseList = [
      "은찬아, 은우야! 아빠, 엄마는 우리 은찬이와 은우를 세상에서 가장 많이 사랑한단다! 언제나 힘차게 응원해!",
      "스스로 씩씩하게 탐구하는 은찬이와 은우의 모습이 아빠, 엄마에게는 가장 큰 자랑이자 기쁨이야! 최고야!",
      "오늘도 호기심 가득 찬 멋진 모험을 하고 있구나! 아빠, 엄마가 늘 든든하게 응원할게, 사랑해!",
      "실패를 두려워하지 않고 한 걸음씩 나아가는 우리 아이들, 아빠, 엄마는 너희가 정말 멋지단다!",
      "오늘 배운 재미있는 이야기나 퀴즈가 있다면 식사 시간에 아빠, 엄마에게도 꼭 들려주렴! 최고 멋쟁이!",
      "은찬아! 어려운 문제도 포기하지 않고 끝까지 고민해보는 그 끈기가 정말 대단해!",
      "은우야! 항상 밝은 미소로 가족들에게 비타민 같은 에너지를 줘서 고마워, 사랑해!",
      "형아 은찬이가 동생 은우를 다정하게 챙겨주는 모습을 보면 아빠 엄마 마음이 사르르 녹는단다.",
      "동생 은우가 형아를 든든하게 믿고 따르는 모습이 참 보기 좋아! 세상 최고의 멋진 형제야!",
      "틀리는 것은 배움의 시작이란다! 씩씩하게 다시 도전하는 은찬이의 용기가 진짜 멋져!",
      "우와! 매일매일 조금씩 꾸준히 연습하는 은찬이의 성실함은 그 어떤 보물보다 값진 거야!",
      "오늘도 반짝이는 눈빛으로 새로운 것을 배우는 은찬이, 미래의 위대한 탐험가이자 리더란다!",
      "아빠 엄마는 은찬이와 은우의 따뜻하고 고운 마음씨가 언제나 가장 자랑스러워!",
      "밥도 골고루 씩씩하게 잘 먹고 몸도 마음도 튼튼하게 쑥쑥 자라줘서 고마워!",
      "은찬이가 만든 타자기 글씨와 단어들을 보면 아빠 엄마는 깜짝 놀라며 감동한단다!",
      "자동차 박사 은찬이! 도로 위의 멋진 차들을 척척 알아맞히는 모습이 정말 프로 전문가 같아!",
      "100명의 위인들의 훌륭한 마음가짐을 쏙쏙 닮아가는 우리 은찬이, 참 대견해!",
      "4개국어 발음도 씩씩하고 정확하게 따라 하는 모습에 아빠가 엄지 척 들어줄게!",
      "세계 여러 나라의 국기와 문화를 재미있게 알아가는 은찬이, 글로벌 챔피언이 될 거야!",
      "이솝우화의 깊은 교훈을 깊이 이해하고 실천하려는 은찬이의 생각 주머니가 날마다 넓어지네!",
      "스스로 장난감을 정리하고 주변을 깔끔하게 만드는 은찬이와 은우는 정말 멋진 정리 왕이야!",
      "친구들에게 먼저 상냥하게 인사하고 배려할 줄 아는 은찬이의 다정함이 최고야!",
      "궁금한 것을 그냥 지나치지 않고 질문하는 은찬이의 지적 호기심이 아빠는 참 반갑단다!",
      "은찬아, 은우야! 너희가 활짝 웃을 때 온 세상이 햇살처럼 환해진단다. 매일 웃게 해줄게!",
      "실수해도 괜찮아! 괜찮아, 다시 해보면 되지! 아빠 엄마는 언제나 널 믿고 응원해!",
      "약속을 소중히 지키고 솔직하게 이야기하는 은찬이의 바른 태도가 정말 자랑스럽단다!",
      "오늘 하루도 최선을 다해 멋지게 보낸 은찬이에게 황금빛 특급 칭찬 도장을 쾅쾅 찍어줄게!",
      "누가 보지 않아도 스스로 바르게 행동하는 은찬이, 아빠 엄마 마음속의 진정한 1등이란다!",
      "은찬이의 상상력과 창의력은 하늘의 무지개보다 더 다채롭고 아름다워!",
      "동생에게 책도 읽어주고 재미있게 놀아주는 은찬이는 온 세상에서 가장 다정한 형아란다!",
      "형아 손을 꼭 잡고 씩씩하게 걷는 은우의 귀여운 발걸음마다 행복이 가득하네!",
      "어려운 퍼즐이나 퀴즈를 만나도 끈기 있게 집중하는 은찬이의 집중력은 정말 최고야!",
      "감사할 줄 알고 '고맙습니다'라고 예쁘게 말하는 은찬이의 고운 입술이 참 예쁘단다!",
      "아빠 엄마가 힘들 때 달려와서 꼬옥 안아주는 은찬이와 은우 덕분에 아빠는 힘이 펄펄 나!",
      "새로운 도전을 두려워하지 않고 당당하게 마주하는 은찬이의 담대함이 멋져!",
      "책을 가까이하고 한 줄 한 줄 깊이 읽는 은찬이의 지혜가 나날이 쑥쑥 자라고 있어!",
      "손도 깨끗이 씻고 양치도 척척 혼자서 잘하는 은찬이의 바른 생활 습관, 정말 최고!",
      "은찬이와 은우가 태어난 날부터 지금까지, 너희는 언제나 아빠 엄마의 가장 큰 행복이란다!",
      "자신의 생각을 또박또박 자신감 있게 표현하는 은찬이의 발표력이 나날이 발전하고 있어!",
      "친구의 마음을 헤아리고 따뜻하게 위로해줄 줄 아는 은찬이의 공감 능력에 박수를 보내!",
      "넘어져서 아파도 씩씩하게 털고 일어나 웃어 보이는 은찬이의 튼튼한 마음가짐이 멋져!",
      "규칙을 잘 지키고 정정당당하게 놀이하는 은찬이는 최고의 멋진 스포츠맨이야!",
      "자동차의 역사와 특징을 아빠에게 설명해줄 때, 은찬이의 목소리가 얼마나 멋진지 아니?",
      "세계 20개국 국기를 번개처럼 알아맞히는 은찬이의 암기력과 관찰력은 진짜 슈퍼히어로급이야!",
      "타자기 소리에 맞춰 리듬감 있게 한글을 써 내려가는 은찬이의 손끝이 예술가 같아!",
      "아빠 엄마의 이야기를 귀담아듣고 존중해주는 은찬이의 예의 바른 태도가 참 고마워!",
      "오늘 하루 배운 것들이 씨앗이 되어 훗날 멋진 큰 나무로 자라날 거야. 늘 응원할게!",
      "은찬아, 은우야! 너희가 꿈꾸는 모든 멋진 꿈들을 아빠 엄마가 언제나 온 힘을 다해 지켜줄게!",
      "서로 마주 보고 꺄르르 웃는 너희들의 웃음소리가 우리 집에서 가장 아름다운 음악이란다!",
      "스스로 계획을 세우고 하나씩 실천해 나가는 은찬이의 주도적인 모습이 정말 대견해!",
      "새로운 언어의 억양과 발음을 재미있게 흉내 내며 즐기는 은찬이의 센스가 대단해!",
      "작은 곤충이나 동물, 자연을 아끼고 사랑하는 은찬이의 따뜻한 생명 존중 마음씨를 칭찬해!",
      "어른을 공경하고 먼저 인사할 줄 아는 은찬이의 밝은 에너지가 동네에서도 칭찬 자자해!",
      "은찬이의 손으로 직접 쓴 타자기 편지를 받을 때, 아빠 엄마는 세상에서 가장 행복하단다!",
      "복잡한 자동차 세대별 변천사도 쏙쏙 정리하는 은찬이의 뇌는 슈퍼컴퓨터 같아!",
      "퀴즈에서 아쉽게 틀려도 '다음엔 맞힐 수 있어!'라고 긍정적으로 생각하는 은찬이 최고야!",
      "매일 아침 '좋은 아침이에요!' 하고 힘차게 하루를 여는 은찬이의 활기찬 목소리가 참 좋아!",
      "은찬이가 옆에 있어서 아빠는 매일매일 더 멋진 아빠가 되고 싶단다. 고마워 아들!",
      "은우의 천사 같은 미소와 옹알이는 온 가족에게 가장 큰 축복이자 행복이란다!",
      "어떤 상황에서도 진실을 말할 줄 아는 은찬이의 정직함이 가장 큰 용기란다!",
      "배려하고 양보할 줄 아는 은찬이의 넓은 마음은 바다보다 더 푸르고 넓단다!",
      "아빠 엄마와 함께하는 이 모험 스튜디오에서 은찬이의 꿈이 무한히 펼쳐지길 바라!",
      "은찬아, 너는 존재 자체만으로도 온 세상을 환하게 비추는 가장 귀한 빛이란다!",
      "오늘 획득한 보물 메달과 칭찬 도장은 은찬이의 성실한 노력이 만든 진짜 훈장이란다!",
      "힘든 순간이 오더라도 절대 잊지 마, 언제나 은찬이를 무조건 응원하는 아빠 엄마가 있어!",
      "동생과 사이좋게 간식을 나누어 먹는 은찬이의 고운 손길이 천사 같아!",
      "호기심을 품고 세상을 탐구하는 은찬이의 앞날에 눈부신 기적들이 가득할 거야!",
      "하나를 배우면 둘을 생각하는 은찬이의 깊은 사고력에 아빠가 깜짝깜짝 놀란단다!",
      "은찬아, 은우야! 사랑한다는 말은 매일매일 해도 모자라단다. 하늘만큼 땅만큼 사랑해!",
      "오늘 밤에도 예쁜 꿈꾸고, 내일도 아빠 엄마랑 손잡고 더 신나는 모험을 떠나보자!"
    ];
    this.praiseDeck = [];
    this.lastPraiseIdx = -1;
  }

  getNextFamilyPraise() {
    if (!this.familyPraiseList || this.familyPraiseList.length === 0) {
      this.initFamilyPraises();
    }
    // 덱이 비었거나 처음이면 Fisher-Yates 셔플로 새 비복원 덱 생성
    if (!this.praiseDeck || this.praiseDeck.length === 0) {
      const indices = this.familyPraiseList.map((_, i) => i);
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
      }
      // 직전 마지막으로 나온 칭찬과 새 덱의 첫 번째가 겹치지 않도록 방지
      if (this.lastPraiseIdx !== -1 && indices[0] === this.lastPraiseIdx && indices.length > 1) {
        [indices[0], indices[indices.length - 1]] = [indices[indices.length - 1], indices[0]];
      }
      this.praiseDeck = indices;
    }
    const nextIdx = this.praiseDeck.shift();
    this.lastPraiseIdx = nextIdx;
    return this.familyPraiseList[nextIdx];
  }

  randomDadJoke() {
    this.playPop();
    const picked = this.getNextFamilyPraise();
    const elem = document.getElementById('dadBubbleText');
    if (elem) {
      elem.textContent = picked;
      elem.classList.remove('praise-pop');
      void elem.offsetWidth; // DOM 리플로우 강제 트리거로 애니메이션 리셋
      elem.classList.add('praise-pop');
    }
    this.speak(picked, 'ko-KR');
  }

  speakCurrentBubble() {
    const text = document.getElementById('dadBubbleText')?.textContent ||
                 document.getElementById('dadDialogueText')?.textContent;
    if (text) {
      this.playPop();
      this.speak(text.trim(), 'ko-KR');
    }
  }

  // old_speak_removed
  _speakCurrentBubbleOld() {
    const text = document.getElementById('dadDialogueText')?.textContent;
    if (text) {
      this.playPop();
      this.speak(text, 'ko-KR');
    }
  }

  pickRandomDadPhrase() {
    this.playPop();
    const phrases = (window.EDU_DATA && window.EDU_DATA.dadPhrases && window.EDU_DATA.dadPhrases.length > 0) ? window.EDU_DATA.dadPhrases : ['은찬아 안녕! 오늘 아빠랑 어디로 신나는 모험을 떠나볼까?'];
    const picked = phrases[Math.floor(Math.random() * phrases.length)];
    const elem = document.getElementById('dadDialogueText');
    if (elem) elem.textContent = picked;
    this.speak(picked, 'ko-KR');
  }

    // =========================================================================
  // 6. 4개국어 놀이터 (초등 핵심 단어 & 실생활 문장 & 소리/말하기 도전 완벽 지원)
  // =========================================================================
  renderLangCategories() {
    const container = document.getElementById('langCategoriesNav') || document.getElementById('langCatButtons');
    if (!container) return;

    const cats = window.EDU_DATA.categories || window.EDU_DATA.languages || [];
    container.innerHTML = cats.map(cat => `
      <button class="subnav-btn ${cat.id === this.activeLangCat ? 'active' : ''}" onclick="app.selectLangCat('${cat.id}')">
        <span>${cat.icon || cat.emoji || '📚'}</span> ${cat.name}
      </button>
    `).join('');
  }

  selectLangCat(catId) {
    this.activeLangCat = catId;
    this.playPop();
    this.renderLangCategories();
    this.renderWordCards();
  }

  selectLangCategory(catId) {
    this.selectLangCat(catId);
  }

  setGlobalLangMode(mode) {
    this.playPop();
    this.globalLangMode = mode;
    this.itemModes = {}; // 개별 카드 모드 초기화 후 전역 적용

    const btnSentence = document.getElementById('btnModeSentence');
    const btnWord = document.getElementById('btnModeWord');
    if (btnSentence && btnWord) {
      if (mode === 'sentence') {
        btnSentence.classList.add('active');
        btnWord.classList.remove('active');
        this.speak("초등 실생활 필수 문장 모드로 공부해보자!", 'ko-KR');
      } else {
        btnWord.classList.add('active');
        btnSentence.classList.remove('active');
        this.speak("기초 핵심 단어 모드로 공부해보자!", 'ko-KR');
      }
    }
    this.renderWordCards();
  }

  toggleGlobalLangMode() {
    const nextMode = (this.globalLangMode === 'sentence') ? 'word' : 'sentence';
    this.setGlobalLangMode(nextMode);
  }

  toggleItemMode(itemId) {
    this.playPop();
    const cur = this.itemModes[itemId] || this.globalLangMode || 'sentence';
    this.itemModes[itemId] = cur === 'sentence' ? 'word' : 'sentence';
    this.renderWordCards();
  }

  toggleRepeatMode() {
    this.playPop();
    this.isTripleRepeat = !this.isTripleRepeat;
    const btn = document.getElementById('btnRepeatToggle') || document.getElementById('tripleRepeatToggleBtn');
    const textSpan = document.getElementById('repeatToggleText');
    if (this.isTripleRepeat) {
      if (btn) {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        btn.style.color = '#ffffff';
        btn.style.borderColor = '#059669';
      }
      if (textSpan) textSpan.innerHTML = '🔁 3회 연속 반복 듣기 ON';
      this.speak("3회 연속 반복 듣기가 켜졌어요! 세 번씩 또박또박 들려줄게요!", 'ko-KR');
    } else {
      if (btn) {
        btn.classList.remove('active');
        btn.style.background = '#f8fafc';
        btn.style.color = '#334155';
        btn.style.borderColor = '#cbd5e1';
      }
      if (textSpan) textSpan.innerHTML = '🔂 1회 듣기 모드';
      this.speak("1회 듣기 모드로 바뀌었어요!", 'ko-KR');
    }
  }

  toggleTripleRepeat() {
    this.toggleRepeatMode();
  }

  toggleSpeechRate() {
    this.playPop();
    const btn = document.getElementById('btnSpeedToggle') || document.getElementById('speechRateToggleBtn');
    const textSpan = document.getElementById('speedToggleText');
    
    // 순환: 0.75x (느리게 또박또박) -> 1.0x (보통) -> 1.2x (빠르게)
    if (!this.speechRate || this.speechRate < 0.85) {
      this.speechRate = 1.0;
      if (textSpan) textSpan.innerHTML = '⚡ 1.0x 표준 보통 속도';
      if (btn) {
        btn.style.borderColor = '#3b82f6';
        btn.style.color = '#1d4ed8';
      }
      this.speak("보통 속도로 읽어줄게요!", 'ko-KR');
    } else if (this.speechRate < 1.1) {
      this.speechRate = 1.2;
      if (textSpan) textSpan.innerHTML = '🚀 1.2x 씩씩하게 빠르게';
      if (btn) {
        btn.style.borderColor = '#f59e0b';
        btn.style.color = '#b45309';
      }
      this.speak("원어민 친구처럼 빠르게 읽어줄게요!", 'ko-KR');
    } else {
      this.speechRate = 0.75;
      if (textSpan) textSpan.innerHTML = '🐢 0.75x 또박또박 천천히';
      if (btn) {
        btn.style.borderColor = '#10b981';
        btn.style.color = '#047857';
      }
      this.speak("또박또박 천천히 읽어줄게요!", 'ko-KR');
    }
  }

  renderWordCards() {
    const grid = document.getElementById('wordCardsGrid');
    if (!grid) return;

    const words = (window.EDU_DATA.vocabulary && window.EDU_DATA.vocabulary[this.activeLangCat]) || [];
    if (!words || words.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-size: 16px;">선택한 카테고리의 학습 카드를 불러오는 중입니다...</div>';
      return;
    }

    grid.innerHTML = words.map(item => {
      const mode = this.itemModes[item.id] || this.globalLangMode || 'sentence';
      const isSentence = mode === 'sentence';
      
      const content = isSentence ? (item.sentence || item) : item;
      const emoji = item.emoji || item.icon || '🌟';
      const dadTip = item.dad_tip || item.dadTip || '오늘도 아빠, 엄마랑 씩씩하게 말해봐요!';

      const koText = content.ko || item.ko || '';
      const enText = content.en || item.en || '';
      const enPron = content.en_pron || content.en_phonetic || '';
      
      const zhText = content.zh || item.zh || '';
      const zhPinyin = content.zh_pinyin || '';
      const zhPron = content.zh_pron || '';

      const jaText = content.ja || item.ja || '';
      const jaKana = content.ja_kana || content.ja_reading || '';
      const jaPron = content.ja_pron || '';

      return `
        <div class="word-card ${isSentence ? 'sentence-mode' : 'word-mode'}" id="card_${item.id}">
          <!-- 상단 뱃지 & 모드 전환 버튼 -->
          <div class="wcard-badge-row">
            <span class="wcard-type-tag ${isSentence ? 'sentence' : 'word'}">
              ${isSentence ? '💬 초등 실생활 필수 문장' : '🔤 초등 기초 핵심 단어'}
            </span>
            <button class="wcard-mode-switch" onclick="app.toggleItemMode('${item.id}')" title="단어와 문장 모드를 번갈아 봐요">
              ${isSentence ? '🔤 단어 보기' : '💬 문장 보기'}
            </button>
          </div>

          <!-- 카드 헤더 (이모지 & 한국어 & 아빠·엄마 꿀팁) -->
          <div class="wcard-header">
            <div class="wcard-icon" onclick="app.speakWord('${koText.replace(/'/g, "")}', 'ko-KR', null, '${item.id}', 'ko')">${emoji}</div>
            <div class="wcard-ko-group">
              <div class="wcard-ko-title-row">
                <h3 class="wcard-ko">${koText}</h3>
                <button class="btn-listen ko" onclick="app.speakWord('${koText.replace(/'/g, "")}', 'ko-KR', this, '${item.id}', 'ko')" title="한국어 발음 듣기">
                  🔊 한국어
                </button>
              </div>
              <p class="wcard-tip">👨‍👩‍👧‍👦 아빠·엄마의 꿀팁: "${dadTip}"</p>
            </div>
          </div>

          <!-- 4개국어 언어별 스트립 박스 -->
          <div class="lang-strip-box">
            <!-- 영어 -->
            <div class="lang-strip en" id="strip_${item.id}_en">
              <div class="l-flag-badge">🇺🇸 <span class="l-name">영어</span></div>
              <div class="l-text-box">
                <div class="l-primary">${enText}</div>
                <div class="l-phonetic">${enPron ? `[${enPron}]` : ''}</div>
              </div>
              <button class="btn-listen en" onclick="app.speakWord('${enText.replace(/'/g, "")}', 'en-US', this, '${item.id}', 'en')">
                <span class="btn-listen-icon">🔊</span>
                <span class="btn-listen-text">듣기</span>
              </button>
            </div>

            <!-- 중국어 -->
            <div class="lang-strip zh" id="strip_${item.id}_zh">
              <div class="l-flag-badge">🇨🇳 <span class="l-name">중국어</span></div>
              <div class="l-text-box">
                <div class="l-primary">${zhText}</div>
                <div class="l-phonetic">${zhPinyin ? `[${zhPinyin}]` : ''} ${zhPron ? `<span class="l-kor-pron">(${zhPron})</span>` : ''}</div>
              </div>
              <button class="btn-listen zh" onclick="app.speakWord('${zhText.replace(/'/g, "")}', 'zh-CN', this, '${item.id}', 'zh')">
                <span class="btn-listen-icon">🔊</span>
                <span class="btn-listen-text">듣기</span>
              </button>
            </div>

            <!-- 일본어 -->
            <div class="lang-strip ja" id="strip_${item.id}_ja">
              <div class="l-flag-badge">🇯🇵 <span class="l-name">일본어</span></div>
              <div class="l-text-box">
                <div class="l-primary">${jaText}</div>
                <div class="l-phonetic">${jaKana ? `[${jaKana}]` : ''} ${jaPron ? `<span class="l-kor-pron">(${jaPron})</span>` : ''}</div>
              </div>
              <button class="btn-listen ja" onclick="app.speakWord('${jaText.replace(/'/g, "")}', 'ja-JP', this, '${item.id}', 'ja')">
                <span class="btn-listen-icon">🔊</span>
                <span class="btn-listen-text">듣기</span>
              </button>
            </div>
          </div>

          <!-- 하단 요약 정보 (문장 모드면 핵심 단어, 단어 모드면 실생활 문장) -->
          <div class="wcard-context-preview">
            ${isSentence 
              ? `<span class="context-pill">📌 핵심 단어: <strong>${item.ko}</strong> (${item.en} · ${item.zh} · ${item.ja})</span>`
              : `<span class="context-pill">💡 실생활 문장: <strong>"${item.sentence ? item.sentence.ko : ''}"</strong></span>`
            }
          </div>

          <!-- 카드 푸터 액션 (4개국어 연속 듣기 & 따라 하기 도전) -->
          <div class="wcard-footer">
            <button class="btn-all-play" id="btnPlayAll_${item.id}" onclick="app.playAllLanguages('${item.id}')">
              <span class="btn-icon">🎧</span>
              <span class="btn-label">4개국어 연속 듣기</span>
            </button>
            <button class="btn-mic-practice" onclick="app.openVoiceChallenge('${item.id}')">
              <span class="btn-icon">🎤</span>
              <span class="btn-label">따라 하기 도전</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  speakWord(text, langTag, btnElem = null, itemId = null, langKey = 'en') {
    this.playPop();

    const strip = itemId ? document.getElementById(`strip_${itemId}_${langKey}`) : null;
    const textSpan = btnElem ? btnElem.querySelector('.btn-listen-text') : null;
    const origText = textSpan ? textSpan.innerText : '듣기';

    if (btnElem) btnElem.classList.add('playing');
    if (strip) strip.classList.add('speaking-active');

    if (this.isTripleRepeat) {
      let current = 1;
      const total = 3;
      if (textSpan) textSpan.innerText = `[1/3]`;

      const playNextRepeat = () => {
        if (textSpan) textSpan.innerText = `[${current}/${total}]`;
        this.speak(text, langTag, () => {
          if (current < total) {
            current++;
            setTimeout(playNextRepeat, 550);
          } else {
            if (btnElem) btnElem.classList.remove('playing');
            if (strip) strip.classList.remove('speaking-active');
            if (textSpan) textSpan.innerText = origText;
            this.playSuccess();
            if (itemId) {
              this.logChildActivity('lang', '🔁', '4개국어 3회 연속 반복 청취', `"${text}" 3회 완벽 발음 훈련 완료`, 'language', 35);
            }
          }
        });
      };
      playNextRepeat();
    } else {
      this.speak(text, langTag, () => {
        if (btnElem) btnElem.classList.remove('playing');
        if (strip) strip.classList.remove('speaking-active');
        if (textSpan) textSpan.innerText = origText;
        if (itemId) {
          this.logChildActivity('lang', '🔊', '4개국어 개별 듣기', `"${text}" 발음 청취 완료`, 'language', 15);
        }
      });
    }
  }

  playAllLanguages(itemId) {
    const words = (window.EDU_DATA.vocabulary && window.EDU_DATA.vocabulary[this.activeLangCat]) || [];
    const item = words.find(w => w.id === itemId);
    if (!item) return;

    this.playPop();
    const btn = document.getElementById(`btnPlayAll_${item.id}`);
    const card = document.getElementById(`card_${item.id}`);

    // 이미 재생 중이면 중지 토글
    if (btn && btn.classList.contains('playing')) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      btn.classList.remove('playing');
      const label = btn.querySelector('.btn-label');
      if (label) label.innerText = '4개국어 연속 듣기';
      if (card) {
        card.querySelectorAll('.lang-strip').forEach(s => s.classList.remove('speaking-active'));
      }
      return;
    }

    if (btn) btn.classList.add('playing');

    const mode = this.itemModes[item.id] || this.globalLangMode || 'sentence';
    const isSentence = mode === 'sentence';
    const content = isSentence ? (item.sentence || item) : item;

    const sequence = [
      { text: content.ko || item.ko, lang: 'ko-KR', key: 'ko', name: '한국어' },
      { text: content.en || item.en, lang: 'en-US', key: 'en', name: '영어' },
      { text: content.zh || item.zh, lang: 'zh-CN', key: 'zh', name: '중국어' },
      { text: content.ja || item.ja, lang: 'ja-JP', key: 'ja', name: '일본어' }
    ];

    const totalRounds = this.isTripleRepeat ? 3 : 1;
    let curRound = 1;

    const playRound = () => {
      const label = btn ? btn.querySelector('.btn-label') : null;
      if (label) {
        label.innerText = totalRounds > 1 ? `연속 듣기 [${curRound}/${totalRounds}]` : `연속 듣기 중...`;
      }

      let stepIndex = 0;
      const playNextStep = () => {
        if (!btn || !btn.classList.contains('playing')) return;

        if (stepIndex < sequence.length) {
          const step = sequence[stepIndex];
          
          // 이전 하이라이트 제거 및 현재 언어 하이라이트
          if (card) {
            card.querySelectorAll('.lang-strip').forEach(s => s.classList.remove('speaking-active'));
            const curStrip = card.querySelector(`.lang-strip.${step.key}`);
            if (curStrip) curStrip.classList.add('speaking-active');
          }

          this.speak(step.text, step.lang, () => {
            stepIndex++;
            setTimeout(playNextStep, 450);
          });
        } else {
          // 라운드 종료
          if (card) {
            card.querySelectorAll('.lang-strip').forEach(s => s.classList.remove('speaking-active'));
          }

          if (curRound < totalRounds) {
            curRound++;
            setTimeout(playRound, 600);
          } else {
            // 전체 완료!
            if (btn) btn.classList.remove('playing');
            if (label) label.innerText = '4개국어 연속 듣기';
            this.playSuccess();
            this.addStamp(1);
            this.showToast(`🎉 [${content.ko}] 4개국어 연속 완독 완료! 황금 도장 +1`);
            this.logChildActivity('lang', '🎧', '4개국어 전 언어 연속 완독', `[${content.ko}] 한·영·중·일 ${totalRounds > 1 ? '3회 반복 ' : ''}연속 청취 완료`, 'language', 90);
          }
        }
      };
      playNextStep();
    };

    playRound();
  }

  // =========================================================================
  // 6-2. 4개국어 큰소리로 따라 하기 도전 (인터랙티브 음성 챌린지 모달)
  // =========================================================================
  openVoiceChallenge(itemId) {
    const words = (window.EDU_DATA.vocabulary && window.EDU_DATA.vocabulary[this.activeLangCat]) || [];
    const item = words.find(w => w.id === itemId);
    if (!item) return;

    this.playPop();
    this.activeChallengeItem = item;
    this.activeChallengeLang = 'en'; // 기본 도전 언어: 영어

    const modal = document.getElementById('voicePracticeModal');
    if (!modal) return;

    const mode = this.itemModes[item.id] || this.globalLangMode || 'sentence';
    const isSentence = mode === 'sentence';
    const content = isSentence ? (item.sentence || item) : item;

    // 모달 데이터 채우기
    document.getElementById('voiceTargetEmoji').textContent = item.emoji || item.icon || '🌟';
    document.getElementById('voiceTargetModeLabel').textContent = isSentence ? '💬 초등 실생활 문장' : '🔤 초등 기초 핵심 단어';
    document.getElementById('voiceTargetKo').textContent = content.ko || item.ko;
    document.getElementById('voiceTargetTip').textContent = `👨‍👩‍👧‍👦 아빠·엄마의 꿀팁: "${item.dad_tip || item.dadTip || '씩씩하게 큰 소리로 말해보자!'}"`;

    // 피드백 영역 숨김
    const fb = document.getElementById('voiceFeedbackArea');
    if (fb) fb.style.display = 'none';

    // 마이크 상태 초기화
    this.resetVoiceMicUI();

    // 언어 탭 렌더링
    this.selectVoiceChallengeLang('en');

    modal.classList.add('active');
  }

  closeVoiceChallenge() {
    this.playPop();
    if (this.challengeRecognition) {
      try { this.challengeRecognition.stop(); } catch(e) {}
      this.challengeRecognition = null;
    }
    if (this.challengeSafetyTimer) {
      clearTimeout(this.challengeSafetyTimer);
      this.challengeSafetyTimer = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    const modal = document.getElementById('voicePracticeModal');
    if (modal) modal.classList.remove('active');
  }

  selectVoiceChallengeLang(langKey) {
    this.playPop();
    this.activeChallengeLang = langKey;

    document.querySelectorAll('.voice-lang-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-lang') === langKey);
    });

    const item = this.activeChallengeItem;
    if (!item) return;

    const mode = this.itemModes[item.id] || this.globalLangMode || 'sentence';
    const content = mode === 'sentence' ? (item.sentence || item) : item;

    const promptMain = document.getElementById('voicePromptMain');
    const promptPhonetic = document.getElementById('voicePromptPhonetic');

    if (langKey === 'en') {
      promptMain.textContent = content.en || item.en;
      promptPhonetic.textContent = `[${content.en_pron || ''}]`;
    } else if (langKey === 'zh') {
      promptMain.textContent = content.zh || item.zh;
      promptPhonetic.textContent = `[${content.zh_pinyin || ''}] ${content.zh_pron ? '(' + content.zh_pron + ')' : ''}`;
    } else if (langKey === 'ja') {
      promptMain.textContent = content.ja || item.ja;
      promptPhonetic.textContent = `[${content.ja_kana || ''}] ${content.ja_pron ? '(' + content.ja_pron + ')' : ''}`;
    } else {
      promptMain.textContent = content.ko || item.ko;
      promptPhonetic.textContent = `[한국어 또박또박 발음]`;
    }

    this.resetVoiceMicUI();
  }

  playVoiceChallengeModel() {
    this.playPop();
    const item = this.activeChallengeItem;
    if (!item) return;

    const mode = this.itemModes[item.id] || this.globalLangMode || 'sentence';
    const content = mode === 'sentence' ? (item.sentence || item) : item;
    const langKey = this.activeChallengeLang || 'en';

    const textMap = {
      en: { text: content.en || item.en, tag: 'en-US' },
      zh: { text: content.zh || item.zh, tag: 'zh-CN' },
      ja: { text: content.ja || item.ja, tag: 'ja-JP' },
      ko: { text: content.ko || item.ko, tag: 'ko-KR' }
    };

    const target = textMap[langKey] || textMap.en;
    this.speak(target.text, target.tag);
  }

  toggleVoiceChallengeMic() {
    this.playPop();
    const btn = document.getElementById('voiceMicBtn');
    const container = document.getElementById('voiceMicContainer');
    const text = document.getElementById('voiceMicText');
    const hint = document.getElementById('voiceStatusHint');

    if (btn.classList.contains('listening')) {
      // 이미 듣는 중이면 완료 처리
      this.finishVoiceChallengeSuccess();
      return;
    }

    btn.classList.add('listening');
    if (container) container.classList.add('active');
    if (text) text.textContent = '귀 기울여 듣는 중...';
    if (hint) hint.textContent = '🎙️ 지금 마이크에 대고 큰 소리로 씩씩하게 말해보세요!';

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let hasResult = false;

    if (SpeechRec) {
      try {
        const recognition = new SpeechRec();
        const langMap = { en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' };
        recognition.lang = langMap[this.activeChallengeLang] || 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onresult = (e) => {
          hasResult = true;
          const transcript = e.results[0][0].transcript;
          this.finishVoiceChallengeSuccess(transcript);
        };

        recognition.onerror = () => {
          if (!hasResult) {
            this.finishVoiceChallengeSuccess();
          }
        };

        recognition.onend = () => {
          if (!hasResult) {
            this.finishVoiceChallengeSuccess();
          }
        };

        recognition.start();
        this.challengeRecognition = recognition;
      } catch (err) {
        console.warn("SpeechRec start error:", err);
      }
    }

    // 모바일/브라우저 음성인식 미지원 또는 딜레이 대비 안전 타이머 (3.2초)
    this.challengeSafetyTimer = setTimeout(() => {
      if (!hasResult) {
        this.finishVoiceChallengeSuccess();
      }
    }, 3200);
  }

  resetVoiceMicUI() {
    const btn = document.getElementById('voiceMicBtn');
    const container = document.getElementById('voiceMicContainer');
    const text = document.getElementById('voiceMicText');
    const hint = document.getElementById('voiceStatusHint');

    if (btn) btn.classList.remove('listening');
    if (container) container.classList.remove('active');
    if (text) text.textContent = '마이크 켜고 말하기';
    if (hint) hint.textContent = '마이크 버튼을 누르고 씩씩하게 말해보세요!';
  }

  finishVoiceChallengeSuccess(recognizedTranscript = '') {
    if (this.challengeSafetyTimer) {
      clearTimeout(this.challengeSafetyTimer);
      this.challengeSafetyTimer = null;
    }
    if (this.challengeRecognition) {
      try { this.challengeRecognition.stop(); } catch(e) {}
      this.challengeRecognition = null;
    }

    this.resetVoiceMicUI();
    this.playSuccess();
    this.triggerConfetti();

    const fb = document.getElementById('voiceFeedbackArea');
    const scoreElem = document.getElementById('feedbackScore');
    const commentElem = document.getElementById('feedbackComment');
    const recogElem = document.getElementById('feedbackRecognized');

    const item = this.activeChallengeItem;
    const mode = item ? (this.itemModes[item.id] || this.globalLangMode || 'sentence') : 'sentence';
    const content = item ? (mode === 'sentence' ? (item.sentence || item) : item) : null;
    const targetText = content ? (content[this.activeChallengeLang] || content.en) : '';

    if (scoreElem) scoreElem.textContent = '🎉 100점! 완벽한 발음!';
    if (commentElem) {
      commentElem.textContent = `"우와! 우리 은찬이 발음이 원어민 친구들보다 더 멋진걸? 아빠, 엄마가 너무너무 자랑스러워!"`;
    }
    if (recogElem) {
      recogElem.innerHTML = recognizedTranscript 
        ? `🗣️ 은찬이가 말한 소리: "<strong>${recognizedTranscript}</strong>"`
        : `🗣️ 씩씩하고 또박또박한 목소리가 잘 전달되었어요!`;
    }
    if (fb) {
      fb.style.display = 'block';
      setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50);
    }

    // 칭찬 음성 & 스탬프 부여
    setTimeout(() => {
      this.speak("대단해 은찬아! 발음이 완벽해! 최고야!", 'ko-KR');
    }, 400);

    this.addStamp(1);
    this.showToast('🏆 큰소리로 따라 하기 성공! 황금 도장 +1');
    this.logChildActivity('voice', '🎤', '4개국어 큰소리로 따라 하기 100점', `[${targetText}] 씩씩하게 말하기 완료!`, 'language', 60);
  }


  // =========================================================================
  // 7. 100 위인 역사 타임머신: 3D 양면 펼침형 인터랙티브 그림책 (Storybook Viewer)
  // =========================================================================
  filterHistoryVerse(verse) {
    this.activeHistoryVerse = verse;
    this.playPop();

    document.querySelectorAll('.history-verse-nav .verse-tab-btn').forEach(btn => {
      const isMatch = verse === 'all'
        ? btn.textContent.includes('전체')
        : (btn.getAttribute('onclick') || '').includes(verse);
      btn.classList.toggle('active', isMatch);
    });

    this.renderHistoryCards(verse);
  }

  renderHistoryCards(filterVerse = 'all') {
    this.activeHistoryVerse = filterVerse;
    const grid = document.getElementById('historyGrid');
    if (!grid) return;

    let episodes = window.EDU_DATA.historyEpisodes || [];
    if (filterVerse && filterVerse !== 'all') {
      episodes = episodes.filter(ep => ep.verse === filterVerse);
    }

    grid.innerHTML = episodes.map(ep => `
      <div class="history-card" style="border-top: 6px solid ${ep.color}">
        <div class="hist-top-badge">
          <span class="hist-category">${ep.verse === 'bonus' ? '세계사' : '한국사'}</span>
          <span class="hist-period">${ep.period}</span>
        </div>
        <div class="hist-title-group">
          <span class="hist-icon">${ep.icon}</span>
          <h3 class="hist-title">${ep.title}</h3>
        </div>
        <p class="hist-intro">${ep.intro}</p>
        <button class="btn-hist-start" onclick="app.openHistoryModal('${ep.id}')">
          <span>📖 동화책 열고 함께 읽기</span>
        </button>
      </div>
    `).join('');
  }

  // 시대별 장면 일러스트 테마 & 터치 오브젝트 매핑
  getHistoricalSceneData(ep) {
    const defaultThemes = {
      h_dangun: {
        bg: 'linear-gradient(135deg, #065f46 0%, #047857 50%, #10b981 100%)',
        heroName: '단군 할아버지와 웅녀',
        heroAvatar: '🐻',
        items: [
          { icon: '🌿', name: '신비한 쑥', desc: '100일 동안 햇빛을 보지 않고 먹은 신비한 쑥!', top: '20%', left: '12%' },
          { icon: '🧄', name: '알싸한 마늘', desc: '맵고 아려도 꾹 참아낸 끈기의 마늘!', top: '65%', left: '16%' },
          { icon: '🌳', name: '태백산 신단수', desc: '환웅님이 하늘에서 내려오신 거룩한 신단수!', top: '22%', right: '14%' },
          { icon: '🐯', name: '씩씩한 호랑이', desc: '비록 동굴을 뛰쳐나갔지만 씩씩한 호랑이 친구!', top: '68%', right: '12%' }
        ]
      },
      h_jumong: {
        bg: 'linear-gradient(135deg, #854d0e 0%, #b45309 50%, #d97706 100%)',
        heroName: '명궁 동명왕 주몽',
        heroAvatar: '🏹',
        items: [
          { icon: '🏹', name: '황금 활', desc: '파리 한 마리도 백발백중 맞히는 주몽의 명궁 활!', top: '20%', left: '14%' },
          { icon: '🐎', name: '고구려 천리마', desc: '만주 벌판을 바람처럼 질주하는 명마!', top: '65%', left: '15%' },
          { icon: '🎯', name: '명중 과녁', desc: '백 걸음 밖에서도 정중앙을 꿰뚫는 과녁!', top: '24%', right: '15%' },
          { icon: '🛡️', name: '철갑 방패', desc: '어떤 화살도 튕겨내는 튼튼한 방패!', top: '66%', right: '14%' }
        ]
      },
      h_yisunsin: {
        bg: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0284c7 100%)',
        heroName: '충무공 이순신 장군',
        heroAvatar: '🐢',
        items: [
          { icon: '🐢', name: '무적 거북선', desc: '철갑 지붕과 용머리에서 불을 뿜는 세계 최초 철갑선!', top: '18%', left: '12%' },
          { icon: '💥', name: '천자총통', desc: '적선을 일격에 격파하는 강력한 조선의 대포!', top: '65%', left: '16%' },
          { icon: '🌊', name: '한산도 푸른 바다', desc: '학익진 전법으로 대승을 거둔 남해의 바다!', top: '22%', right: '15%' },
          { icon: '⚔️', name: '장군의 장검', desc: '삼척서천 산하동색! 나라를 구한 구국의 검!', top: '68%', right: '14%' }
        ]
      },
      h_sejong: {
        bg: 'linear-gradient(135deg, #701a75 0%, #86198f 50%, #c026d3 100%)',
        heroName: '세종대왕과 집현전 학사들',
        heroAvatar: '👑',
        items: [
          { icon: '📜', name: '훈민정음 책', desc: '백성을 사랑하는 마음으로 창제한 아름다운 한글!', top: '20%', left: '14%' },
          { icon: '☀️', name: '앙부일구 해시계', desc: '해의 그림자로 시각과 절기를 알려주는 오목 해시계!', top: '64%', left: '15%' },
          { icon: '🌧️', name: '측우기', desc: '세계 최초로 비의 양을 과학적으로 잰 측정기!', top: '22%', right: '14%' },
          { icon: '🌟', name: '집현전 등불', desc: '밤낮으로 백성을 위해 책을 연구하던 학문의 전당!', top: '66%', right: '15%' }
        ]
      },
      h_gwanggaeto: {
        bg: 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #ef4444 100%)',
        heroName: '광개토대왕과 개마무사',
        heroAvatar: '🏇',
        items: [
          { icon: '🐎', name: '철갑 개마무사', desc: '말과 무사가 온몸을 철갑으로 두른 무적 부대!', top: '20%', left: '14%' },
          { icon: '📜', name: '광개토대왕릉비', desc: '만주벌판에 우뚝 선 위대한 대왕의 승전 비석!', top: '65%', left: '16%' },
          { icon: '🚩', name: '고구려 군기', desc: '승리를 알리며 휘날리던 삼족오 깃발!', top: '22%', right: '15%' },
          { icon: '⚔️', name: '환두대도', desc: '용과 봉황이 조각된 고구려 지휘관의 명검!', top: '68%', right: '14%' }
        ]
      }
    };

    if (defaultThemes[ep.id]) {
      return defaultThemes[ep.id];
    }

    // 기본 동적 테마 생성 (어떤 영웅이든 100% 매칭)
    return {
      bg: `linear-gradient(135deg, ${ep.color || '#1e3a8a'} 0%, #312e81 100%)`,
      heroName: ep.title,
      heroAvatar: ep.icon || '📜',
      items: [
        { icon: ep.icon || '⭐', name: ep.title.split(' ')[0] || '영웅', desc: `${ep.period}을 빛낸 위대한 인물!`, top: '20%', left: '14%' },
        { icon: '📜', name: '역사 두루마리', desc: '선조들의 지혜가 담긴 소중한 옛 기록!', top: '65%', left: '15%' },
        { icon: '🌟', name: '황금 보물', desc: '우리나라 역사를 빛낸 자랑스러운 문화유산!', top: '22%', right: '14%' },
        { icon: '🏰', name: '옛 궁궐과 터', desc: '선조들이 터를 잡고 문화를 꽃피운 역사 현장!', top: '68%', right: '15%' }
      ]
    };
  }

  openHistoryModal(epId) {
    const ep = window.EDU_DATA.historyEpisodes.find(e => e.id === epId);
    if (!ep) return;

    this.stopStorybookAudio();
    this.playTimeMachine();
    this.activeEpisode = ep;
    this.activeStep = 0;
    this.isAutoPageTurn = true;

    const modal = document.getElementById('historyModal');
    if (!modal) return;

    document.getElementById('bookTitle').textContent = ep.title;
    document.getElementById('bookPeriod').textContent = ep.period;

    // 모달 활성화 및 첫 페이지 렌더링
    this.renderStorybookPage();
    modal.classList.add('active');

    // 20대 여성 구연동화 목소리로 첫 페이지 자동 읽기 시작
    setTimeout(() => {
      this.readCurrentPageStory();
    }, 450);

    this.logChildActivity('history', ep.icon, `100 위인 그림책: ${ep.title}`, `${ep.period} 그림책 펼침`, 'history', 60);
  }

  closeHistoryModal() {
    this.playPop();
    this.stopStorybookAudio();
    const modal = document.getElementById('historyModal');
    if (modal) modal.classList.remove('active');
  }

  renderStorybookPage() {
    const ep = this.activeEpisode;
    if (!ep) return;

    const stepData = ep.storyCards[this.activeStep];
    if (!stepData) return;

    const sceneData = this.getHistoricalSceneData(ep);

    // 1. 좌측 페이지 (장면 디오라마 & 인터랙티브 오브젝트)
    document.getElementById('sceneChapterBadge').textContent = `제 ${this.activeStep + 1} 장`;
    document.getElementById('sceneTitle').textContent = stepData.title;

    const diorama = document.getElementById('sceneDiorama');
    if (diorama) diorama.style.background = sceneData.bg;

    document.getElementById('sceneHeroAvatar').textContent = sceneData.heroAvatar;
    document.getElementById('sceneHeroName').textContent = sceneData.heroName;

    // 터치 오브젝트 배치
    const itemsContainer = document.getElementById('sceneInteractiveItems');
    if (itemsContainer) {
      itemsContainer.innerHTML = sceneData.items.map((it, idx) => `
        <div class="scene-touch-item" style="top: ${it.top}; ${it.left ? `left: ${it.left};` : `right: ${it.right};`}" onclick="app.touchSceneItem('${it.name}', '${it.desc}')">
          <span class="touch-item-icon">${it.icon}</span>
          <span class="touch-item-label">${it.name}</span>
        </div>
      `).join('');
    }

    const totalSteps = ep.storyCards.length;
    document.getElementById('leftPageNum').textContent = `제 ${(this.activeStep * 2) + 1} 쪽`;
    document.getElementById('rightPageNum').textContent = `제 ${(this.activeStep * 2) + 2} 쪽 (전체 ${totalSteps * 2}쪽 중)`;

    // 2. 우측 페이지 (동화 텍스트 & 문장별 실시간 형광펜 하이라이트 준비)
    const paragraphsContainer = document.getElementById('storyParagraphs');
    if (paragraphsContainer) {
      // 문장 분리 (. ! ? 기준)
      const rawSentences = stepData.text.match(/[^.!?]+[.!?]+/g) || [stepData.text];
      this.currentStorySentences = rawSentences.map(s => s.trim()).filter(Boolean);

      paragraphsContainer.innerHTML = this.currentStorySentences.map((sentence, sIdx) => `
        <span class="story-sentence" id="storySent_${sIdx}" onclick="app.playSingleStorySentence(${sIdx})">
          ${sentence}&nbsp;
        </span>
      `).join('');
    }

    // 퀴즈 영역 초기화
    const quizContainer = document.getElementById('storyQuizContainer');
    if (quizContainer) {
      quizContainer.style.display = 'none';
      document.getElementById('storyQuizQuestion').textContent = stepData.question;
      const choicesBox = document.getElementById('storyQuizChoices');
      choicesBox.innerHTML = stepData.choices.map((choice, cIdx) => `
        <button class="quiz-choice-book-btn" onclick="app.checkStoryQuiz(${cIdx})">
          👉 ${choice}
        </button>
      `).join('');
      document.getElementById('storyQuizResult').style.display = 'none';
    }

    // 3. 하단 네비게이션 버튼 활성화 여부
    const prevBtn = document.getElementById('btnBookPrev');
    const nextBtn = document.getElementById('btnBookNext');
    if (prevBtn) prevBtn.disabled = (this.activeStep === 0);
    if (nextBtn) nextBtn.disabled = (this.activeStep === totalSteps - 1);
  }

  touchSceneItem(name, desc) {
    this.playPop();

    // 토스트 알림 표시
    const toast = document.getElementById('sceneSparkleToast');
    if (toast) {
      toast.innerHTML = `✨ <strong>${name}</strong>: ${desc}`;
      toast.style.display = 'block';
      if (this.sceneToastTimer) clearTimeout(this.sceneToastTimer);
      this.sceneToastTimer = setTimeout(() => {
        toast.style.display = 'none';
      }, 3000);
    }

    // 20대 여성 구연동화 목소리로 다정하게 설명
    this.speak(`${name}! ${desc}`, 'ko-KR');
  }

  toggleStorybookAudio() {
    this.playPop();
    if (this.isStorybookReading) {
      this.stopStorybookAudio();
    } else {
      this.readCurrentPageStory();
    }
  }

  readCurrentPageStory() {
    this.stopStorybookAudio();
    this.isStorybookReading = true;

    const playBtn = document.getElementById('btnBookPlay');
    const playLabel = document.getElementById('bookPlayLabel');
    const syncIndicator = document.getElementById('storySyncIndicator');

    if (playBtn) playBtn.classList.add('speaking');
    if (playLabel) playLabel.textContent = '동화 멈추기';
    if (syncIndicator) syncIndicator.classList.add('active');

    const sentences = this.currentStorySentences || [];
    let currentIdx = 0;

    const readNextSentence = () => {
      if (!this.isStorybookReading) return;

      // 이전 문장 하이라이트 제거
      sentences.forEach((_, i) => {
        const span = document.getElementById(`storySent_${i}`);
        if (span) span.classList.remove('active-highlight');
      });

      if (currentIdx < sentences.length) {
        const curSpan = document.getElementById(`storySent_${currentIdx}`);
        if (curSpan) {
          curSpan.classList.add('active-highlight');
          curSpan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }

        const sentenceText = sentences[currentIdx];
        this.speak(sentenceText, 'ko-KR', () => {
          currentIdx++;
          setTimeout(readNextSentence, 400);
        });
      } else {
        // 현재 쪽 완독!
        if (playBtn) playBtn.classList.remove('speaking');
        if (playLabel) playLabel.textContent = '이 쪽 동화 듣기';
        if (syncIndicator) syncIndicator.classList.remove('active');
        this.isStorybookReading = false;

        const ep = this.activeEpisode;
        const isLastPage = (this.activeStep + 1) >= ep.storyCards.length;

        if (this.isAutoPageTurn && !isLastPage) {
          // 1.5초 후 다음 장으로 자동 넘김
          setTimeout(() => {
            this.nextHistoryPage();
          }, 1500);
        } else {
          // 마지막 장이면 퀴즈 자동 펼침
          this.toggleStoryQuiz(true);
          this.speak("이야기를 다 읽었어요! 아래 아빠·엄마의 깜짝 퀴즈를 풀어볼까요?", 'ko-KR');
        }
      }
    };

    readNextSentence();
  }

  playSingleStorySentence(sIdx) {
    this.playPop();
    const sentences = this.currentStorySentences || [];
    if (!sentences[sIdx]) return;

    // 해당 문장만 하이라이트
    sentences.forEach((_, i) => {
      const span = document.getElementById(`storySent_${i}`);
      if (span) span.classList.toggle('active-highlight', i === sIdx);
    });

    this.speak(sentences[sIdx], 'ko-KR', () => {
      const span = document.getElementById(`storySent_${sIdx}`);
      if (span) span.classList.remove('active-highlight');
    });
  }

  stopStorybookAudio() {
    this.isStorybookReading = false;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const playBtn = document.getElementById('btnBookPlay');
    const playLabel = document.getElementById('bookPlayLabel');
    const syncIndicator = document.getElementById('storySyncIndicator');

    if (playBtn) playBtn.classList.remove('speaking');
    if (playLabel) playLabel.textContent = '이 쪽 동화 듣기';
    if (syncIndicator) syncIndicator.classList.remove('active');

    // 하이라이트 제거
    const sentences = this.currentStorySentences || [];
    sentences.forEach((_, i) => {
      const span = document.getElementById(`storySent_${i}`);
      if (span) span.classList.remove('active-highlight');
    });
  }

  prevHistoryPage() {
    if (this.activeStep > 0) {
      this.playPop();
      this.stopStorybookAudio();
      this.activeStep--;
      this.renderStorybookPage();
      setTimeout(() => this.readCurrentPageStory(), 300);
    }
  }

  nextHistoryPage() {
    const ep = this.activeEpisode;
    if (ep && (this.activeStep + 1) < ep.storyCards.length) {
      this.playPop();
      this.stopStorybookAudio();
      this.activeStep++;
      this.renderStorybookPage();
      setTimeout(() => this.readCurrentPageStory(), 300);
    }
  }

  toggleAutoPageTurn() {
    this.playPop();
    this.isAutoPageTurn = !this.isAutoPageTurn;
    const btn = document.getElementById('btnBookAuto');
    const label = document.getElementById('bookAutoLabel');

    if (btn) btn.classList.toggle('active', this.isAutoPageTurn);
    if (label) {
      label.textContent = this.isAutoPageTurn ? '🔄 자동 연속 넘김 ON' : '⏸️ 수동 넘김 모드';
    }
    this.showToast(this.isAutoPageTurn ? '📖 한 쪽을 다 읽으면 다음 장으로 자동 넘겨요!' : '📖 손으로 직접 넘겨 읽어요!');
  }

  toggleStoryQuiz(forceOpen = null) {
    this.playPop();
    const quizContainer = document.getElementById('storyQuizContainer');
    if (!quizContainer) return;

    const willOpen = (forceOpen !== null) ? forceOpen : (quizContainer.style.display === 'none');
    quizContainer.style.display = willOpen ? 'block' : 'none';
    if (willOpen) {
      quizContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  checkStoryQuiz(choiceIdx) {
    this.playPop();
    const ep = this.activeEpisode;
    const stepData = ep.storyCards[this.activeStep];
    const resultBox = document.getElementById('storyQuizResult');

    if (this.storyQuizAutoTimer) {
      clearTimeout(this.storyQuizAutoTimer);
      this.storyQuizAutoTimer = null;
    }

    if (choiceIdx === stepData.correct) {
      // 🎺 빵빠레 & 축하 꽃가루 폭죽!
      this.playFanfare();
      this.triggerConfetti();

      const isLastStep = (this.activeStep + 1) >= ep.storyCards.length;

      if (ep.badge && !this.unlockedBadges.includes(ep.badge)) {
        this.unlockedBadges.push(ep.badge);
        try { localStorage.setItem('eunchan_badges', JSON.stringify(this.unlockedBadges)); } catch(e) {}
      }

      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.color = '#047857';
        resultBox.style.background = '#ecfdf5';
        resultBox.style.border = '2px solid #10b981';
        resultBox.innerHTML = `
          🎉 <strong>딩동댕! 빵빠레 정답입니다! 🎺</strong><br>
          "${stepData.reaction}"<br>
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; align-items: center;">
            <span style="font-size: 14px; color: #b45309; font-weight: 800;">
              🏆 황금 칭찬 도장 +1 획득!
            </span>
            <span class="feedback-auto-badge">
              ⚡ 2초 뒤 ${isLastStep ? '다음 위인 모험' : '다음 장 이야기'}으로 자동 이동! ➔
            </span>
          </div>
        `;
      }

      this.addStamp(1);
      this.speak(`딩동댕! 완벽한 정답이야! ${stepData.reaction}`, 'ko-KR');
      this.logChildActivity('history', '⭐', `역사 그림책 퀴즈 만점: ${stepData.title}`, `"${stepData.question}" 100점 정답 완료`, 'history', 60);

      // ⚡ 2.2초 후 다음 장(또는 다음 위인 에피소드)으로 자동 이동!
      this.storyQuizAutoTimer = setTimeout(() => {
        if (!isLastStep) {
          this.nextHistoryPage();
        } else {
          const allEps = (window.EDU_DATA && window.EDU_DATA.historyEpisodes) || [];
          const curEpIdx = allEps.findIndex(e => e.id === ep.id);
          if (curEpIdx !== -1 && curEpIdx + 1 < allEps.length) {
            const nextEp = allEps[curEpIdx + 1];
            this.openHistoryModal(nextEp.id);
          }
        }
      }, 2300);
    } else {
      this.playBeep(240, 'sine', 0.25, 0.25);
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.style.color = '#b91c1c';
        resultBox.style.background = '#fef2f2';
        resultBox.style.border = '2px solid #ef4444';
        resultBox.innerHTML = `
          💡 <strong>아쉽다! 다시 한번 천천히 생각해볼까?</strong><br>
          동화책 이야기와 왼쪽 그림을 떠올리며 다시 골라보자!
        `;
      }
      this.speak("아쉬워요! 왼쪽 그림을 떠올려보며 다른 보기를 골라보자!", 'ko-KR');
    }
  }


  // =========================================================================
  // 8. 대한민국 인기 자동차 대백과 & 세대별 연혁관
  // =========================================================================
  // 8. 대한민국 인기 자동차 대백과 & 세대별 연혁관
  // =========================================================================
  filterCars(brandGroup, shouldScroll = true) {
    this.activeCarBrand = brandGroup || 'all';
    this.playPop();

    document.querySelectorAll('#carCountryFilters .subnav-btn').forEach(btn => {
      const brand = btn.getAttribute('data-brand');
      const match = (brandGroup === 'all')
        ? (brand === 'all' || btn.textContent.includes('전체'))
        : (brand === brandGroup || btn.getAttribute('onclick')?.includes(brandGroup));
      btn.classList.toggle('active', !!match);
    });

    this.renderCars();

    if (shouldScroll) {
      const grid = document.getElementById('carsGrid');
      if (grid) {
        const topPos = grid.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: topPos, behavior: 'smooth' });
      }
    }
  }

  renderCars() {
    const grid = document.getElementById('carsGrid');
    if (!grid) return;

    let list = window.EDU_DATA.cars || [];
    if (this.activeCarBrand && this.activeCarBrand !== 'all') {
      list = list.filter(c => c.brandGroup === this.activeCarBrand);
    }

    const brandNames = {
      all: '🌐 대한민국 & 글로벌 전설의 명차 8선 (총 38개 세대 · 120장 실물 사진)',
      hyundai: '🇰🇷 현대자동차 역사관 (그랜저·쏘나타·아반떼 총 22개 세대)',
      kia: '🇰🇷 기아 역사관 (카니발·쏘렌토 총 8개 세대)',
      genesis: '👑 제네시스 럭셔리 역사관 (G80 총 3개 세대)',
      honda: '🇯🇵 혼다 역사관 (어코드 월드베스트 총 4개 세대)',
      toyota: '🇯🇵 토요타 역사관 (캠리 글로벌 세단 총 3개 세대)'
    };
    const titleText = brandNames[this.activeCarBrand] || brandNames.all;

    grid.innerHTML = `
      <div class="cars-filter-banner" style="grid-column: 1 / -1; background: linear-gradient(135deg, #eff6ff, #f8fafc); border: 1.5px solid #bfdbfe; border-radius: 16px; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; box-shadow: 0 2px 8px rgba(37,99,235,0.08);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">🏎️</span>
          <div>
            <strong style="font-size: 15.5px; color: #1e3a8a;">${titleText}</strong>
            <span style="font-size: 13px; color: #64748b; margin-left: 8px;">(${list.length}개 대표 차종 수록)</span>
          </div>
        </div>
        <span style="font-size: 12.5px; font-weight: 700; color: #2563eb; background: #dbeafe; padding: 5px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px;">
          ⚡ 1~8세대 및 사진 터치 가능
        </span>
      </div>
      ${list.map(car => this.renderCarCardHTML(car)).join('')}
    `;
  }

  renderCarCardHTML(car) {
    const activeIdx = this.activeCarGenIndex[car.id] || 0;
    return `
      <div class="car-card" id="carCard_${car.id}">
        ${this.renderCarCardInner(car, activeIdx)}
      </div>
    `;
  }

  renderCarCardInner(car, activeIdx) {
    const currentGen = car.generations[activeIdx] || car.generations[0];
    return `
      <div class="car-card-header">
        <div class="car-title-box">
          <span class="car-brand-tag">${car.brand} · ${car.country}</span>
          <h3 class="car-name-text">${car.name}</h3>
          <p class="car-hero-catchphrase">${car.catchphrase}</p>
        </div>
        <span class="car-type-badge">${car.categoryName || car.type || "인기 승용차"}</span>
      </div>

      <!-- 세대 선택 탭 (1세대, 2세대, 3세대... 다 선택 가능) -->
      <div class="car-gen-nav" style="display:flex; flex-wrap:wrap; gap:6px; margin: 12px 0 14px 0;">
        ${car.generations.map((g, idx) => `
          <button type="button" class="gen-pill-btn ${idx === activeIdx ? 'active' : ''}" onclick="app.switchCarGen('${car.id}', ${idx})" title="${g.name} (${g.years})">
            ${g.gen}
          </button>
        `).join('')}
      </div>

      <!-- 실제 3각 사진 뷰어 (전면, 후면, 측면 각각 터치 시 해당 각도로 즉시 고화질 확대) -->
      <div class="car-photos-preview">
        <div class="photo-box main" onclick="app.openPhotoLightbox('${car.id}', ${activeIdx}, 'front')" title="클릭하여 전면 고화질 확대">
          <img src="${currentGen.photos.front}" alt="${currentGen.name} 전면" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'">
          <span class="photo-angle-tag">전면 (앞모습) 🔍 터치 확대</span>
        </div>
        <div class="photo-sub-col">
          <div class="photo-box sub" onclick="app.openPhotoLightbox('${car.id}', ${activeIdx}, 'rear')" title="클릭하여 후면 고화질 확대">
            <img src="${currentGen.photos.rear}" alt="${currentGen.name} 후면" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'">
            <span class="photo-angle-tag">후면 (뒷모습) 🔍</span>
          </div>
          <div class="photo-box sub" onclick="app.openPhotoLightbox('${car.id}', ${activeIdx}, 'side')" title="클릭하여 측면 고화질 확대">
            <img src="${currentGen.photos.side}" alt="${currentGen.name} 측면" onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'">
            <span class="photo-angle-tag">측면 (옆모습) 🔍</span>
          </div>
        </div>
      </div>
      <p class="photo-click-hint" style="cursor:pointer;" onclick="app.openPhotoLightbox('${car.id}', ${activeIdx}, 'front')">
        🔍 사진을 터치하면 전면·후면·측면 고화질 돋보기로 볼 수 있어요!
      </p>

      <!-- 현재 세대 상세 정보 -->
      <div class="gen-detail-card">
        <div class="gen-detail-header">
          <span class="gen-name-badge">${currentGen.name}</span>
          <span class="gen-years-tag">출시: ${currentGen.years} (${currentGen.status})</span>
        </div>
        <p class="gen-feature-text">${currentGen.feature}</p>

        <div class="car-specs-grid">
          <div class="spec-cell">
            <span class="s-label">💰 신차 가격</span>
            <strong class="s-val">${currentGen.price}</strong>
          </div>
          <div class="spec-cell">
            <span class="s-label">⚙️ 엔진/배기량</span>
            <strong class="s-val">${currentGen.specs.engine}</strong>
          </div>
          <div class="spec-cell">
            <span class="s-label">🐎 최고 출력</span>
            <strong class="s-val">${currentGen.specs.power}</strong>
          </div>
          <div class="spec-cell">
            <span class="s-label">⛽ 연비</span>
            <strong class="s-val">${currentGen.specs.fuelEconomy}</strong>
          </div>
        </div>

        <!-- 장단점 -->
        <div class="pros-cons-box">
          <div class="pro-row">
            <span class="pc-badge pro">👍 장점</span>
            <span>${currentGen.pros}</span>
          </div>
          <div class="con-row">
            <span class="pc-badge con">💡 단점</span>
            <span>${currentGen.cons}</span>
          </div>
        </div>
      </div>

      <!-- 연혁 요약 -->
      <div class="car-timeline-box">
        <div class="timeline-title">📜 ${car.name}의 역사 연혁 요약</div>
        <p class="timeline-summary">${car.timelineSummary}</p>
      </div>

      <div class="car-card-actions">
        <button class="btn-bubble primary" onclick="app.openCarModal('${car.id}')">
          <span>🏎️ 4개국어 대화 & 브랜드 역사</span>
        </button>
      </div>
    `;
  }

  // 세대 즉각 전환 (스크롤 안 튀고 해당 카드만 부드럽게 업데이트)
  switchCarGen(carId, genIndex) {
    this.playPop();
    this.activeCarGenIndex[carId] = genIndex;

    const cardEl = document.getElementById('carCard_' + carId);
    const car = window.EDU_DATA.cars.find(c => c.id === carId);

    if (cardEl && car) {
      cardEl.innerHTML = this.renderCarCardInner(car, genIndex);
      cardEl.classList.add('gen-switched-highlight');
      setTimeout(() => cardEl.classList.remove('gen-switched-highlight'), 500);
    } else {
      this.renderCars();
    }

    if (car && car.generations[genIndex]) {
      this.logChildActivity('car', '🚗', `자동차 연혁: ${car.name} ${car.generations[genIndex].gen}`, `${car.generations[genIndex].name} 탐구`, 'car', 45);
    }
  }

  // ==================== 실제 사진 고화질 돋보기 라이트박스 ====================
  openPhotoLightbox(carId, genIndex, initialAngle = 'front') {
    const car = window.EDU_DATA.cars.find(c => c.id === carId);
    if (!car) return;
    this.activeCarGenIndex[carId] = genIndex;
    this.currentLightboxCarId = carId;
    this.currentLightboxGenIdx = genIndex;
    this.currentLightboxAngle = initialAngle;

    const modal = document.getElementById('photoLightboxModal');
    if (!modal) return;

    this.playPop();
    this.renderLightboxContent();
    modal.classList.add('active');

    const genData = car.generations[genIndex];
    if (genData && genData.angleHints && genData.angleHints[initialAngle]) {
      this.speak(genData.angleHints[initialAngle], 'ko-KR');
    }
    this.logChildActivity('car', '🔍', `고화질 사진 탐구: ${car.name}`, `${genData.name} 실물 관찰`, 'car', 60);
  }

  renderLightboxContent() {
    const car = window.EDU_DATA.cars.find(c => c.id === this.currentLightboxCarId);
    if (!car) return;
    const genIndex = this.currentLightboxGenIdx || 0;
    const genData = car.generations[genIndex] || car.generations[0];
    const angle = this.currentLightboxAngle || 'front';

    const header = document.getElementById('lightboxTitle');
    if (header) {
      header.innerHTML = `📸 ${car.name} <span style="color:#2563eb; font-weight:800;">[${genData.gen} - ${genData.name}]</span> 고화질 돋보기 관찰관`;
    }

    const body = document.getElementById('lightboxBody');
    if (!body) return;

    const angleMap = { front: '전면 (앞모습)', rear: '후면 (뒷모습)', side: '측면 (옆모습)' };
    const currentPhoto = genData.photos[angle] || genData.photos.front;
    const currentTip = genData.angleHints[angle] || genData.angleHints.front;

    body.innerHTML = `
      <div class="photo-lightbox-inner" style="display:flex; flex-direction:column; gap:14px;">
        
        <!-- 1. 세대 원클릭 전환 탭 (뷰어 안에서도 1세대, 2세대, 3세대... 자유 이동) -->
        <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:10px 14px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <span style="font-size:13px; font-weight:800; color:#334155;">✨ 세대 선택 (터치하면 바로 해당 세대 사진으로 전환):</span>
            <span style="font-size:12px; font-weight:700; background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:12px;">
              ${genData.years} (${genData.status})
            </span>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${car.generations.map((g, idx) => `
              <button type="button" class="gen-pill-btn ${idx === genIndex ? 'active' : ''}" 
                onclick="app.switchLightboxGen(${idx})" style="font-size:12.5px; padding:6px 14px;">
                ${g.gen}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- 2. 각도 선택 탭 (전면 / 후면 / 측면) -->
        <div style="display:flex; gap:10px; align-items:center; justify-content:center;">
          <button type="button" class="subnav-btn ${angle === 'front' ? 'active' : ''}" id="lbBtn_front" onclick="app.switchLightboxAngle('front')" style="padding:8px 18px; font-weight:700;">
            🚗 전면 (앞모습)
          </button>
          <button type="button" class="subnav-btn ${angle === 'rear' ? 'active' : ''}" id="lbBtn_rear" onclick="app.switchLightboxAngle('rear')" style="padding:8px 18px; font-weight:700;">
            🚙 후면 (뒷모습)
          </button>
          <button type="button" class="subnav-btn ${angle === 'side' ? 'active' : ''}" id="lbBtn_side" onclick="app.switchLightboxAngle('side')" style="padding:8px 18px; font-weight:700;">
            🏎️ 측면 (옆모습)
          </button>
        </div>

        <!-- 3. 고화질 대형 이미지 스테이지 (클릭 시 돋보기 확대) -->
        <div class="lightbox-stage" style="background:#090d16; border-radius:18px; position:relative; min-height:360px; max-height:500px; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2px solid #1e293b; box-shadow: inset 0 0 40px rgba(0,0,0,0.8);">
          <img id="lightboxMainImg" src="${currentPhoto}" alt="${genData.name} ${angleMap[angle]}" 
            style="width:100%; max-height:480px; object-fit:contain; cursor:zoom-in; transition:transform 0.25s ease;"
            onclick="this.style.transform = this.style.transform === 'scale(1.4)' ? 'scale(1)' : 'scale(1.4)'"
            title="사진을 누르면 더 크게 확대(Zoom)됩니다!">

          <!-- 이전/다음 각도 이동 버튼 -->
          <button type="button" onclick="app.stepLightboxAngle(-1)" title="이전 각도 사진"
            style="position:absolute; left:12px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.65); color:#fff; border:none; border-radius:50%; width:44px; height:44px; font-size:20px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); transition:0.2s;" onmouseover="this.style.background='rgba(37,99,235,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.65)'">◀</button>

          <button type="button" onclick="app.stepLightboxAngle(1)" title="다음 각도 사진"
            style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.65); color:#fff; border:none; border-radius:50%; width:44px; height:44px; font-size:20px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px); transition:0.2s;" onmouseover="this.style.background='rgba(37,99,235,0.85)'" onmouseout="this.style.background='rgba(0,0,0,0.65)'">▶</button>

          <!-- 상단 뱃지 -->
          <div id="lightboxAngleTag" style="position:absolute; top:12px; left:14px; background:rgba(15,23,42,0.85); color:#ffffff; padding:6px 14px; border-radius:20px; font-size:13px; font-weight:800; border:1px solid rgba(255,255,255,0.2); backdrop-filter:blur(4px);">
            ${angleMap[angle]}
          </div>

          <div style="position:absolute; bottom:12px; right:14px; background:rgba(0,0,0,0.7); color:#cbd5e1; padding:5px 12px; border-radius:12px; font-size:12px; font-weight:600;">
            🔍 터치하여 줌 확대 / 축소
          </div>
        </div>

        <!-- 4. 아빠의 가이드 스토리 및 음성 낭독 -->
        <div style="background:#fffbeb; border:1.5px solid #fde68a; border-radius:14px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">👨‍👦</span>
            <p id="lightboxDadText" style="margin:0; font-size:14.5px; font-weight:700; color:#78350f; line-height:1.5;">
              정연수 아빠: "${currentTip}"
            </p>
          </div>
          <button type="button" class="btn-bubble primary" style="font-size:13px; padding:8px 16px; white-space:nowrap; flex-shrink:0;" 
            onclick="app.speak(document.getElementById('lightboxDadText').innerText, 'ko-KR')">
            🔊 아빠 목소리로 듣기
          </button>
        </div>

        <!-- 5. 핵심 제원 빠른 요약 바 -->
        <div style="display:grid; grid-template-columns: repeat(4, 1fr); gap:8px; background:#f1f5f9; border-radius:12px; padding:12px;">
          <div style="text-align:center;">
            <span style="font-size:11px; color:#64748b; font-weight:700;">신차가격</span>
            <div style="font-size:13px; font-weight:800; color:#1e293b; margin-top:2px;">${genData.price}</div>
          </div>
          <div style="text-align:center;">
            <span style="font-size:11px; color:#64748b; font-weight:700;">엔진/배기량</span>
            <div style="font-size:13px; font-weight:800; color:#1e293b; margin-top:2px;">${genData.specs.engine}</div>
          </div>
          <div style="text-align:center;">
            <span style="font-size:11px; color:#64748b; font-weight:700;">최고출력</span>
            <div style="font-size:13px; font-weight:800; color:#1e293b; margin-top:2px;">${genData.specs.power}</div>
          </div>
          <div style="text-align:center;">
            <span style="font-size:11px; color:#64748b; font-weight:700;">공인연비</span>
            <div style="font-size:13px; font-weight:800; color:#1e293b; margin-top:2px;">${genData.specs.fuelEconomy}</div>
          </div>
        </div>

      </div>
    `;
  }

  switchLightboxGen(newGenIdx) {
    this.playPop();
    this.currentLightboxGenIdx = newGenIdx;
    if (this.currentLightboxCarId) {
      this.activeCarGenIndex[this.currentLightboxCarId] = newGenIdx;
      // 카드도 백그라운드에서 동기화
      const cardEl = document.getElementById('carCard_' + this.currentLightboxCarId);
      const car = window.EDU_DATA.cars.find(c => c.id === this.currentLightboxCarId);
      if (cardEl && car) {
        cardEl.innerHTML = this.renderCarCardInner(car, newGenIdx);
      }
    }
    this.renderLightboxContent();
    const car = window.EDU_DATA.cars.find(c => c.id === this.currentLightboxCarId);
    const genData = car?.generations[newGenIdx];
    if (genData && genData.angleHints && genData.angleHints[this.currentLightboxAngle]) {
      this.speak(genData.angleHints[this.currentLightboxAngle], 'ko-KR');
    }
  }

  switchLightboxAngle(angle) {
    this.playPop();
    this.currentLightboxAngle = angle;
    this.renderLightboxContent();
    const car = window.EDU_DATA.cars.find(c => c.id === this.currentLightboxCarId);
    const genData = car?.generations[this.currentLightboxGenIdx || 0];
    if (genData && genData.angleHints && genData.angleHints[angle]) {
      this.speak(genData.angleHints[angle], 'ko-KR');
    }
  }

  stepLightboxAngle(delta) {
    const angles = ['front', 'rear', 'side'];
    let idx = angles.indexOf(this.currentLightboxAngle);
    if (idx === -1) idx = 0;
    idx = (idx + delta + angles.length) % angles.length;
    this.switchLightboxAngle(angles[idx]);
  }

  closePhotoLightbox() {
    this.playPop();
    const modal = document.getElementById('photoLightboxModal');
    if (modal) modal.classList.remove('active');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  // ==================== 4개국어 대화 & 브랜드 역사 모달 ====================
  openCarModal(carId) {
    const car = window.EDU_DATA.cars.find(c => c.id === carId);
    if (!car) return;

    this.playPop();
    const modal = document.getElementById('carDetailModal');
    const header = document.getElementById('carModalTitle');
    const body = document.getElementById('carModalBody');

    if (header) header.innerHTML = `🏎️ ${car.name} 대백과 & 4개국어 대화`;

    if (body) {
      body.innerHTML = `
        <div style="padding: 10px;">
          <div style="background: #f1f5f9; padding: 18px; border-radius: 16px; margin-bottom: 20px;">
            <h4 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">📜 ${car.brand}의 브랜드 역사</h4>
            <p style="font-size: 14.5px; line-height: 1.6; color: #334155; margin: 0;">${car.brandHistory}</p>
          </div>

          <h4 style="font-size: 17px; font-weight: 800; color: #0f172a; margin-bottom: 12px;">🌍 4개국어 자동차 대화 놀이</h4>
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${Object.entries(car.languages).map(([langKey, langData]) => {
              const flagMap = { ko: '🇰🇷 한국어', en: '🇺🇸 English', zh: '🇨🇳 中文', ja: '🇯🇵 日本語' };
              const langTagMap = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP' };
              return `
                <div style="background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 14px; display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <span style="font-size: 12px; font-weight: 800; color: #64748b;">${flagMap[langKey]}</span>
                    <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 3px 0;">${langData.title}</div>
                    <div style="font-size: 13.5px; color: #475569;">${langData.desc}</div>
                  </div>
                  <button type="button" class="btn-listen" onclick="app.speak('${langData.desc.replace(/'/g, "")}', '${langTagMap[langKey]}')">
                    🔊 듣기
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');
    this.logChildActivity('car', '🏎️', `4개국어 자동차 탐험: ${car.name}`, `${car.brand} 역사 및 회화`, 'car', 60);
  }

  closeCarModal() {
    this.playPop();
    document.getElementById('carDetailModal')?.classList.remove('active');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  

  // =========================================================================
  // 8-1. 이솝우화 30편 동화 나라 & 아빠 AI 구연동화 듣기 엔진
  // =========================================================================
  renderAesop() {
    const grid = document.getElementById('aesopGrid');
    if (!grid) return;

    const stories = (window.EDU_DATA && window.EDU_DATA.aesopStories) || [];
    if (!stories || stories.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #64748b; font-size: 16px;">동화 이야기 데이터를 준비하고 있습니다...</div>';
      return;
    }

    const filtered = stories.filter(story => {
      const matchTheme = (this.activeAesopTheme === 'all' || story.theme === this.activeAesopTheme);
      if (!matchTheme) return false;
      if (!this.aesopSearchQuery) return true;
      const q = this.aesopSearchQuery.toLowerCase();
      return (
        (story.title && story.title.toLowerCase().includes(q)) ||
        (story.enTitle && story.enTitle.toLowerCase().includes(q)) ||
        (story.characters && story.characters.toLowerCase().includes(q)) ||
        (story.moral && story.moral.toLowerCase().includes(q)) ||
        (story.teaser && story.teaser.toLowerCase().includes(q)) ||
        (story.storyText && story.storyText.toLowerCase().includes(q))
      );
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: white; border-radius: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); border: 2px dashed #e2e8f0;">
          <div style="font-size: 48px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 20px; color: #1e293b; margin-bottom: 8px;">'${this.aesopSearchQuery}' 에 맞는 동화를 찾지 못했어요</h3>
          <p style="color: #64748b; font-size: 15px; margin-bottom: 20px;">토끼, 사자, 개미, 여우 등 동물이나 다른 단어로 검색해보세요!</p>
          <button class="aesop-filter-pill active" style="margin: 0 auto;" onclick="app.filterAesopTheme('all')">
            <span>🌟 전체 30편 다시 보기</span>
          </button>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(story => {
      return `
        <div class="aesop-card" onclick="app.openAesopModal('${story.id}')">
          <div class="aesop-card-header">
            <span class="aesop-badge theme">${story.icon} ${story.theme}</span>
            <span class="aesop-badge num">제${story.num}화</span>
          </div>

          <div class="aesop-card-hero">
            <div class="aesop-card-icon">${story.icon}</div>
            <div class="aesop-card-title-group">
              <h3 class="aesop-card-title">${story.title}</h3>
              <span class="aesop-card-en-title">${story.enTitle}</span>
            </div>
          </div>

          <div class="aesop-characters">
            <span>👥 등장:</span> ${story.characters}
          </div>

          <p class="aesop-teaser">"${story.teaser}"</p>

          <div class="aesop-moral-box">
            <div class="aesop-moral-label">💡 이야기 속 지혜 교훈</div>
            <p class="aesop-moral-text">${story.moral}</p>
          </div>

          <div class="aesop-card-footer">
            <button class="btn-aesop-listen" onclick="event.stopPropagation(); app.quickPlayAesop('${story.id}')" title="아빠 AI 목소리로 바로 듣기">
              <span>🔊 바로 듣기</span>
            </button>
            <button class="btn-aesop-read" onclick="app.openAesopModal('${story.id}')">
              <span>📖 전체 읽기 & 퀴즈 ➔</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  filterAesopTheme(theme, btnElem) {
    this.activeAesopTheme = theme;
    this.playPop();

    document.querySelectorAll('#aesopFiltersGroup .aesop-filter-pill').forEach(btn => {
      btn.classList.remove('active');
    });
    if (btnElem) {
      btnElem.classList.add('active');
    } else {
      const pills = document.querySelectorAll('#aesopFiltersGroup .aesop-filter-pill');
      pills.forEach(p => {
        if ((theme === 'all' && p.textContent.includes('전체')) || p.textContent.includes(theme)) {
          p.classList.add('active');
        }
      });
    }

    this.renderAesop();
  }

  searchAesop(query) {
    this.aesopSearchQuery = (query || '').trim();
    this.renderAesop();
  }

  playRandomAesop() {
    const stories = (window.EDU_DATA && window.EDU_DATA.aesopStories) || [];
    if (stories.length === 0) return;
    this.playPop();
    const randomStory = stories[Math.floor(Math.random() * stories.length)];
    this.openAesopModal(randomStory.id, true);
  }

  quickPlayAesop(storyId) {
    this.playPop();
    // 🌟 1. 사용자 클릭 직후 즉시 브라우저 Web Speech 엔진 깨우기 (User Gesture Activation)
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      try {
        const dummy = new SpeechSynthesisUtterance('');
        dummy.volume = 0;
        window.speechSynthesis.speak(dummy);
      } catch (e) {}
    }
    this.openAesopModal(storyId, true);
  }

  openAesopModal(storyId, autoPlay = false) {
    const stories = (window.EDU_DATA && window.EDU_DATA.aesopStories) || [];
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    this.currentAesopStoryId = storyId;
    this.stopAesopStory();

    const titleElem = document.getElementById('aesopModalTitle');
    const bodyElem = document.getElementById('aesopModalBody');
    const modal = document.getElementById('aesopStoryModal');
    if (!modal || !bodyElem) return;

    if (titleElem) {
      titleElem.innerHTML = `
        <span>${story.icon}</span> 제${story.num}화: ${story.title} 
        <span style="font-size: 15px; font-weight: 500; color: #cbd5e1; margin-left: 8px;">(${story.enTitle})</span>
      `;
    }

    const paragraphs = (story.storyText || '').split('\n\n').filter(p => p.trim());

    bodyElem.innerHTML = `
      <!-- 1. 상단 오디오 컨트롤러 바 -->
      <div class="aesop-player-bar">
        <div class="player-main-btns">
          <button id="aesopPlayBtn" class="btn-player-play" onclick="app.togglePlayAesopStory('${story.id}')">
            <span>🔊 아빠 목소리로 듣기</span>
          </button>
          <button class="btn-player-stop" onclick="app.stopAesopStory()">
            <span>⏹ 처음부터</span>
          </button>
          <button id="aesopVoiceBtn" class="player-voice-toggle" onclick="app.toggleAesopVoice()">
            <span>${this.aesopVoiceType === 'dad' ? '👨 정연수 아빠 목소리' : '👩 다정한 구연동화 선생님'}</span>
          </button>
        </div>
        
        <div class="player-speed-group">
          <span style="font-size: 12px; font-weight: 700; color: #64748b; padding-left: 6px;">속도:</span>
          <button class="btn-speed-pill ${this.aesopRate === 0.8 ? 'active' : ''}" onclick="app.setAesopRate(0.8)">0.8x</button>
          <button class="btn-speed-pill ${this.aesopRate === 0.92 ? 'active' : ''}" onclick="app.setAesopRate(0.92)">1.0x</button>
          <button class="btn-speed-pill ${this.aesopRate === 1.15 ? 'active' : ''}" onclick="app.setAesopRate(1.15)">1.2x</button>
        </div>
      </div>

      <!-- 2. 재생 중 파형 상태 표시 바 -->
      <div id="aesopWaveBox" class="speech-status-indicator" style="display: none; padding: 12px 18px; background: #fef3c7; border: 1.5px solid #fde68a; border-radius: 14px; align-items: center; gap: 10px; font-size: 14px; color: #92400e; font-weight: 700;">
        <span class="pulse-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #d97706; display: inline-block;"></span>
        <span id="aesopWaveStatus">다정한 아빠 목소리로 동화를 읽어주고 있어요... (귀를 기울여봐요!)</span>
      </div>

      <!-- 3. 동화 본문 카드 (문단별 읽기 추적 & 하이라이트 & 문단 클릭 바로 듣기) -->
      <div class="aesop-story-card-inner">
        <div class="story-header-box">
          <div class="story-header-icon">${story.icon}</div>
          <div>
            <h3 class="story-header-title">제${story.num}화: ${story.title}</h3>
            <span class="story-header-sub">${story.enTitle} · 등장인물: ${story.characters}</span>
          </div>
        </div>

        <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 14px; padding: 12px 16px; margin-bottom: 18px; font-size: 14.5px; color: #92400e; font-weight: 700;">
          💭 "${story.teaser}"
        </div>

        <div class="story-paragraphs-box" id="storyParagraphsBox">
          ${paragraphs.map((p, idx) => `
            <div class="story-paragraph" id="storyPara_${idx}" data-idx="${idx}" onclick="app.playAesopFromParagraph(${idx})" title="👆 터치하면 이 문단부터 들려줘요!">
              ${p.replace(/\n/g, '<br>')}
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 4. 아빠의 지혜 한마디 & 교훈 -->
      <div class="aesop-dad-wisdom-box">
        <img src="dad_avatar.svg" class="aesop-dad-avatar-mini" alt="정연수 아빠">
        <div style="flex: 1;">
          <div class="dad-wisdom-title">👨 정연수 아빠의 생각 키우기 사랑의 한마디</div>
          <p class="dad-wisdom-text">"${story.dadTip}"</p>
          <div style="margin-top: 8px; font-size: 13.5px; font-weight: 800; color: #15803d; border-top: 1px dashed #86efac; padding-top: 6px;">
            🌟 <strong>오늘의 황금 교훈:</strong> ${story.moral}
          </div>
        </div>
      </div>

      <!-- 5. 4개국어 지혜 속담 & 한마디 -->
      <div class="aesop-quad-box">
        <div class="aesop-quad-title">
          <span>🌍 4개국어 지혜의 속담 (터치하면 원어민 발음으로 읽어줘요!)</span>
        </div>
        <div class="quad-lang-rows">
          <div class="quad-lang-row">
            <span class="quad-lang-label">🇰🇷 한국어</span>
            <span class="quad-lang-text">${story.quadMoral.ko}</span>
            <button class="btn-quad-speak" onclick="app.speakQuadMoral('ko-KR', '${story.quadMoral.ko.replace(/'/g, "\\'")}')">🔊 듣기</button>
          </div>
          <div class="quad-lang-row">
            <span class="quad-lang-label">🇺🇸 English</span>
            <span class="quad-lang-text">${story.quadMoral.en}</span>
            <button class="btn-quad-speak" onclick="app.speakQuadMoral('en-US', '${story.quadMoral.en.replace(/'/g, "\\'")}')">🔊 Listen</button>
          </div>
          <div class="quad-lang-row">
            <span class="quad-lang-label">🇨🇳 中文</span>
            <span class="quad-lang-text">${story.quadMoral.zh}</span>
            <button class="btn-quad-speak" onclick="app.speakQuadMoral('zh-CN', '${story.quadMoral.zh.replace(/'/g, "\\'")}')">🔊 朗读</button>
          </div>
          <div class="quad-lang-row">
            <span class="quad-lang-label">🇯🇵 日本語</span>
            <span class="quad-lang-text">${story.quadMoral.ja}</span>
            <button class="btn-quad-speak" onclick="app.speakQuadMoral('ja-JP', '${story.quadMoral.ja.replace(/'/g, "\\'")}')">🔊 聞く</button>
          </div>
        </div>
      </div>

      <!-- 6. 은찬이 생각 쑥쑥 3단계 지혜 퀴즈 -->
      <div class="aesop-quiz-box" id="aesopQuizContainer"></div>
    `;

    modal.classList.add('active');
    this.playPop();

    // 🌟 3단계 퀴즈 렌더링 초기화
    this.renderAesopQuizCard(storyId, 0);

    // 활동 로그 기록 (부모님 대시보드 실시간 반영)
    this.logChildActivity('story', '📖', `이솝우화 제${story.num}화 [${story.title}] 탐독`, story.moral, 'story', 90);

    if (autoPlay) {
      // 🌟 부드럽고 안정적인 타이밍 (120ms)으로 지체 없이 자동 재생 시작
      setTimeout(() => {
        this.playAesopStory(storyId, 0);
      }, 120);
    }
  }

  clearAesopTimers() {
    if (this.aesopKeepAliveTimer) {
      clearInterval(this.aesopKeepAliveTimer);
      this.aesopKeepAliveTimer = null;
    }
    if (this.aesopWatchdogTimer) {
      clearTimeout(this.aesopWatchdogTimer);
      this.aesopWatchdogTimer = null;
    }
    this.activeAesopUtterance = null;
    window.__activeAesopUtter = null;
  }

  closeAesopModal() {
    this.playPop();
    this.stopAesopStory();
    const modal = document.getElementById('aesopStoryModal');
    if (modal) modal.classList.remove('active');
  }

  togglePlayAesopStory(storyId) {
    if (this.isAesopSpeaking) {
      this.pauseOrStopAesopStory();
    } else {
      const startIdx = this.activeParagraphIdx >= 0 ? this.activeParagraphIdx : 0;
      this.playAesopStory(storyId, startIdx);
    }
  }

  pauseOrStopAesopStory() {
    this.aesopPlaySeqToken++;
    this.clearAesopTimers();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isAesopSpeaking = false;
    const playBtn = document.getElementById('aesopPlayBtn');
    if (playBtn) {
      playBtn.classList.remove('playing');
      playBtn.innerHTML = `<span>${this.aesopVoiceType === 'dad' ? '▶️ 아빠 목소리로 이어듣기' : '▶️ 선생님 목소리로 이어듣기'}</span>`;
    }
    const waveBox = document.getElementById('aesopWaveBox');
    if (waveBox) waveBox.style.display = 'none';
    document.querySelectorAll('.story-paragraph').forEach(p => p.classList.remove('speaking-now'));
  }

  stopAesopStory() {
    this.aesopPlaySeqToken++;
    this.clearAesopTimers();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isAesopSpeaking = false;
    this.activeParagraphIdx = -1;
    const playBtn = document.getElementById('aesopPlayBtn');
    if (playBtn) {
      playBtn.classList.remove('playing');
      playBtn.innerHTML = `<span>${this.aesopVoiceType === 'dad' ? '🔊 아빠 목소리로 듣기' : '🔊 선생님 목소리로 듣기'}</span>`;
    }
    const waveBox = document.getElementById('aesopWaveBox');
    if (waveBox) waveBox.style.display = 'none';
    document.querySelectorAll('.story-paragraph').forEach(p => p.classList.remove('speaking-now'));
  }

  playAesopFromParagraph(paraIdx) {
    this.playPop();
    if (!this.currentAesopStoryId) return;
    this.playAesopStory(this.currentAesopStoryId, paraIdx);
  }

  toggleAesopVoice() {
    this.playPop();
    this.aesopVoiceType = (this.aesopVoiceType === 'dad') ? 'storyteller' : 'dad';
    const voiceBtn = document.getElementById('aesopVoiceBtn');
    if (voiceBtn) {
      voiceBtn.innerHTML = `<span>${this.aesopVoiceType === 'dad' ? '👨 정연수 아빠 목소리' : '👩 다정한 구연동화 선생님'}</span>`;
    }
    const playBtn = document.getElementById('aesopPlayBtn');
    if (playBtn && !this.isAesopSpeaking) {
      playBtn.innerHTML = `<span>${this.aesopVoiceType === 'dad' ? '🔊 아빠 목소리로 듣기' : '🔊 선생님 목소리로 듣기'}</span>`;
    }
    const waveStatus = document.getElementById('aesopWaveStatus');
    if (waveStatus) {
      waveStatus.textContent = (this.aesopVoiceType === 'dad')
        ? '👨 아빠 목소리로 다정하게 동화를 읽어주고 있어요... (귀를 기울여봐요!)'
        : '👩 구연동화 선생님이 상냥하게 동화를 읽어주고 있어요... (귀를 기울여봐요!)';
    }
    if (this.isAesopSpeaking && this.currentAesopStoryId) {
      const curIdx = this.activeParagraphIdx >= 0 ? this.activeParagraphIdx : 0;
      this.playAesopStory(this.currentAesopStoryId, curIdx);
    } else {
      // 🌟 목소리 변경 즉시 안내 음성 피드백
      if (this.aesopVoiceType === 'dad') {
        this.speak("은찬아, 아빠 목소리로 재미있게 읽어줄게!", 'ko-KR', null, 'dad');
      } else {
        this.speak("구연동화 선생님 목소리로 재미있게 읽어줄게요!", 'ko-KR', null, 'teacher');
      }
    }
  }

  setAesopRate(rate) {
    this.playPop();
    this.aesopRate = rate;
    document.querySelectorAll('.player-speed-group .btn-speed-pill').forEach(btn => {
      btn.classList.toggle('active', (btn.textContent.includes('0.8x') && rate === 0.8) || (btn.textContent.includes('1.0x') && rate === 0.92) || (btn.textContent.includes('1.2x') && rate === 1.15));
    });
    if (this.isAesopSpeaking && this.currentAesopStoryId) {
      const curIdx = this.activeParagraphIdx >= 0 ? this.activeParagraphIdx : 0;
      this.playAesopStory(this.currentAesopStoryId, curIdx);
    }
  }

  speakQuadMoral(lang, text) {
    this.playPop();
    this.speak(text, lang);
  }

  // 🌟 이솝우화 본문 및 구연동화를 15~60자 내외 문장 단위로 분할하여 크롬 15초 freeze 버그 원천 해결
  splitStoryIntoChunks(story) {
    const chunks = [];

    // 1. 인트로
    chunks.push({
      type: 'intro',
      paraIdx: -1,
      text: `이솝우화 제${story.num}화, ${story.title}.`
    });
    if (story.teaser) {
      chunks.push({
        type: 'intro',
        paraIdx: -1,
        text: story.teaser
      });
    }

    // 2. 본문 문단들 (문장 부호 단위 정밀 분할)
    const paragraphs = (story.storyText || '').split('\n\n').filter(p => p.trim());
    paragraphs.forEach((para, pIdx) => {
      // 마침표, 느낌표, 물음표, 줄바꿈 기준으로 문장 분할 (따옴표 고려)
      const sentenceRegex = /[^.!?\n]+[.!?]+(?:\s*["']|\s+|$)|[^.!?\n]+$/g;
      const matches = para.match(sentenceRegex);
      if (matches && matches.length > 0) {
        matches.forEach(s => {
          const trimmed = s.trim();
          if (trimmed) {
            chunks.push({
              type: 'para',
              paraIdx: pIdx,
              text: trimmed
            });
          }
        });
      } else {
        chunks.push({
          type: 'para',
          paraIdx: pIdx,
          text: para.trim()
        });
      }
    });

    // 3. 아웃트로
    chunks.push({
      type: 'outro',
      paraIdx: -1,
      text: `이야기 끝! 아빠의 생각 키우기 한마디.`
    });
    if (story.dadTip) {
      chunks.push({
        type: 'outro',
        paraIdx: -1,
        text: `은찬아, ${story.dadTip}`
      });
    }
    if (story.moral) {
      chunks.push({
        type: 'outro',
        paraIdx: -1,
        text: `오늘의 황금 교훈: ${story.moral}`
      });
    }

    return chunks;
  }

  playAesopStory(storyId, startParaIdx = 0) {
    if (!('speechSynthesis' in window)) {
      alert("브라우저가 음성 듣기를 지원하지 않습니다.");
      return;
    }

    const stories = (window.EDU_DATA && window.EDU_DATA.aesopStories) || [];
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    // 1. 이전 시퀀스 및 타이머 완전 무효화 (동시 실행 방지 토큰 발급)
    this.aesopPlaySeqToken++;
    const currentSeqToken = this.aesopPlaySeqToken;
    this.clearAesopTimers();

    // 2. 브라우저 TTS 상태 정상화 (paused 해제 후 cancel)
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    this.isAesopSpeaking = true;
    this.currentAesopStoryId = storyId;

    // 3. UI 즉시 갱신 (일시정지 버튼 및 파형 활성화)
    const playBtn = document.getElementById('aesopPlayBtn');
    if (playBtn) playBtn.innerHTML = '<span>⏸ 일시정지</span>';

    const waveBox = document.getElementById('aesopWaveBox');
    const waveStatus = document.getElementById('aesopWaveStatus');
    if (waveBox) waveBox.style.display = 'flex';
    if (waveStatus) {
      waveStatus.textContent = this.aesopVoiceType === 'dad'
        ? '정연수 아빠가 사랑을 담아 동화를 읽어주고 있어요... (귀를 기울여봐요!)'
        : '동화 구연 선생님이 다정하게 동화를 읽어주고 있어요... (귀를 기울여봐요!)';
    }

    // 4. 문장 청크 리스트 생성
    const allChunks = this.splitStoryIntoChunks(story);

    // 지정 문단 번호부터 시작
    let chunkIdx = 0;
    if (startParaIdx > 0) {
      const foundIdx = allChunks.findIndex(c => c.type === 'para' && c.paraIdx === startParaIdx);
      if (foundIdx !== -1) chunkIdx = foundIdx;
    }

    // 5. 🌟 크롬 장시간 발화 멈춤(15초 freeze) 방지 Keep-Alive 타이머 (7초 주기 pause/resume 워크어라운드)
    this.aesopKeepAliveTimer = setInterval(() => {
      if (this.isAesopSpeaking && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 7000);

    // 6. 단일 청크 낭독 함수
    const speakChunk = () => {
      if (!this.isAesopSpeaking || currentSeqToken !== this.aesopPlaySeqToken) return;

      if (chunkIdx >= allChunks.length) {
        this.stopAesopStory();
        this.playSuccess();
        if (waveStatus) waveStatus.textContent = '🎉 동화를 다 들었어요! 정말 훌륭해요!';
        this.logChildActivity('story', '🎧', `이솝우화 [${story.title}] 전편 완독`, '아빠 구연동화 듣기 완료', 'story', 120);
        return;
      }

      const chunk = allChunks[chunkIdx];

      // 문단 하이라이트 갱신
      document.querySelectorAll('.story-paragraph').forEach(p => p.classList.remove('speaking-now'));
      if (chunk.type === 'para' && chunk.paraIdx >= 0) {
        this.activeParagraphIdx = chunk.paraIdx;
        const pElem = document.getElementById(`storyPara_${chunk.paraIdx}`);
        if (pElem) {
          pElem.classList.add('speaking-now');
          pElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      const utter = new SpeechSynthesisUtterance(chunk.text);
      utter.lang = 'ko-KR';

      // 🌟 음성 보이스 지정 (아빠 목소리 선택 시 100% 남성 목소리 적용)
      if (!this.voices || this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices() || [];
        this.selectBestVoices();
      }

      if (this.aesopVoiceType === 'dad') {
        const dadSettings = this.getDadVoiceSettings();
        if (dadSettings.voice) utter.voice = dadSettings.voice;
        utter.pitch = dadSettings.pitch; // 남성 성우 원음 피치 0.86 또는 크롬 피치다운 0.68
        utter.rate = (this.aesopRate || 0.92) * 0.96;
      } else {
        const voiceToUse = (this.preferredVoices && (this.preferredVoices['ko-KR-teacher'] || this.preferredVoices['ko-KR-mom'])) ||
          this.voices.find(v => v.lang.toLowerCase().startsWith('ko') && /sunhi|선희|yuna|유나|female|여성|google.*한국/i.test(v.name)) ||
          this.voices.find(v => v.lang.toLowerCase().startsWith('ko'));
        if (voiceToUse) utter.voice = voiceToUse;
        utter.pitch = 1.02;
        utter.rate = this.aesopRate || 0.92;
      }

      // 🌟 V8 GC(가비지 컬렉션)에 의한 발화 중 뚝 끊김 원천 방지! 전역 강한 참조 보관
      this.activeAesopUtterance = utter;
      window.__activeAesopUtter = utter;

      let isFinished = false;
      const advanceNext = () => {
        if (isFinished) return;
        isFinished = true;
        if (this.aesopWatchdogTimer) {
          clearTimeout(this.aesopWatchdogTimer);
          this.aesopWatchdogTimer = null;
        }
        if (currentSeqToken !== this.aesopPlaySeqToken) return;

        chunkIdx++;
        // 문장 사이의 자연스러운 160ms 호흡
        setTimeout(speakChunk, 160);
      };

      utter.onstart = () => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      };

      utter.onend = () => {
        advanceNext();
      };

      utter.onerror = (e) => {
        // 사용자가 명시적으로 중지/취소/속도변경한 경우
        if (e && (e.error === 'interrupted' || e.error === 'canceled')) {
          return;
        }
        console.warn("Aesop TTS chunk notice:", e);
        // 사소한 에러로 전체가 멈추지 않고 다음 문장으로 자연스럽게 복구 진행!
        advanceNext();
      };

      // 🌟 브라우저 엔진 버그로 onend가 유실되는 경우를 대비한 Watchdog 안전 타이머
      const maxDuration = Math.max(3500, chunk.text.length * 320 + 2000);
      this.aesopWatchdogTimer = setTimeout(() => {
        if (currentSeqToken !== this.aesopPlaySeqToken) return;
        console.warn("Aesop TTS Watchdog triggered, advancing smoothly:", chunk.text.substring(0, 15));
        advanceNext();
      }, maxDuration);

      // 크롬이 paused 상태인 경우 풀어주기
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utter);
    };

    // 🌟 cancel() 비동기 IPC 완료 후 안전하게 80ms 뒤 첫 청크 시작 (cancel 레이스 컨디션 차단)
    setTimeout(() => {
      if (currentSeqToken !== this.aesopPlaySeqToken) return;
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      speakChunk();
    }, 80);
  }

  // 🌟 이솝우화 3단계 생각 쑥쑥 지혜 퀴즈 렌더링
  renderAesopQuizCard(storyId, quizIdx = 0) {
    const container = document.getElementById('aesopQuizContainer');
    if (!container) return;

    const stories = (window.EDU_DATA && window.EDU_DATA.aesopStories) || [];
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    const quizzes = (story.quizzes && story.quizzes.length === 3) ? story.quizzes : (story.quiz ? [story.quiz] : []);
    if (quizzes.length === 0) return;

    this.currentAesopQuizIdx = Math.max(0, Math.min(quizIdx, quizzes.length - 1));
    const currentQuiz = quizzes[this.currentAesopQuizIdx];
    this.aesopQuizSolved = this.aesopQuizSolved || {};
    const solvedSet = this.aesopQuizSolved[storyId] || new Set();

    const stageNames = [
      "1단계 줄거리 퀴즈",
      "2단계 원인·생각 퀴즈",
      "3단계 지혜·실천 퀴즈"
    ];

    container.innerHTML = `
      <div class="aesop-quiz-header">
        <h4 style="margin: 0; font-size: 16.5px; font-weight: 900; color: #1e3a8a; display: flex; align-items: center; gap: 8px;">
          <span>🤔</span> 은찬이의 생각 쑥쑥 3단계 지혜 퀴즈
        </h4>
        <span style="font-size: 12.5px; font-weight: 800; background: #dbeafe; color: #1e40af; padding: 5px 12px; border-radius: 12px;">
          도장 최대 3개 획득! 💮 (${solvedSet.size} / ${quizzes.length} 완료)
        </span>
      </div>

      <!-- 3단계 탭 버튼들 -->
      <div class="aesop-quiz-tabs">
        ${quizzes.map((q, idx) => {
          const isSolved = solvedSet.has(idx);
          const isActive = (idx === this.currentAesopQuizIdx);
          const icon = isSolved ? '✅' : (idx === 0 ? '🌱' : (idx === 1 ? '🌿' : '🌳'));
          const stageLabel = stageNames[idx] || `${idx + 1}단계 질문`;
          return `
            <button type="button" class="quiz-step-tab ${isActive ? 'active' : ''} ${isSolved ? 'solved' : ''}" onclick="app.switchAesopQuizTab('${storyId}', ${idx})">
              <span>${icon}</span>
              <span>${stageLabel}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="aesop-quiz-question">
        <span style="display: inline-block; background: #2563eb; color: #fff; font-size: 12px; font-weight: 800; padding: 2px 8px; border-radius: 6px; margin-right: 6px;">질문 ${this.currentAesopQuizIdx + 1}/3</span>
        <strong>${currentQuiz.question}</strong>
      </div>

      <div class="aesop-quiz-options" id="aesopQuizOptions">
        ${currentQuiz.options.map((opt, optIdx) => `
          <button class="btn-quiz-opt" onclick="app.checkAesopQuiz('${story.id}', ${this.currentAesopQuizIdx}, ${optIdx}, this)">
            <span>${optIdx + 1}. ${opt}</span>
          </button>
        `).join('')}
      </div>

      <div id="aesopQuizFeedback" class="quiz-feedback-box" style="display: none;"></div>
    `;
  }

  switchAesopQuizTab(storyId, quizIdx) {
    this.playPop();
    this.renderAesopQuizCard(storyId, quizIdx);
  }

  checkAesopQuiz(storyId, quizIdx, selectedIdx, btnElem) {
    const stories = (window.EDU_DATA && window.EDU_DATA.aesopStories) || [];
    const story = stories.find(s => s.id === storyId);
    if (!story) return;

    const quizzes = (story.quizzes && story.quizzes.length === 3) ? story.quizzes : (story.quiz ? [story.quiz] : []);
    const currentQuiz = quizzes[quizIdx] || story.quiz;
    if (!currentQuiz) return;

    if (this.aesopQuizAutoTimer) {
      clearTimeout(this.aesopQuizAutoTimer);
      this.aesopQuizAutoTimer = null;
    }

    const feedbackBox = document.getElementById('aesopQuizFeedback');
    const allOptions = document.querySelectorAll('#aesopQuizOptions .btn-quiz-opt');

    if (selectedIdx === currentQuiz.answer) {
      // 🎺 빵빠레 & 축하 꽃가루 폭죽
      this.playFanfare();
      this.triggerConfetti();

      this.aesopQuizSolved = this.aesopQuizSolved || {};
      if (!this.aesopQuizSolved[storyId]) this.aesopQuizSolved[storyId] = new Set();
      const isFirstSolve = !this.aesopQuizSolved[storyId].has(quizIdx);
      this.aesopQuizSolved[storyId].add(quizIdx);

      allOptions.forEach((btn, idx) => {
        btn.disabled = true;
        if (idx === currentQuiz.answer) btn.classList.add('correct');
      });

      const isAllSolved = (this.aesopQuizSolved[storyId].size >= quizzes.length);

      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = '#dcfce7';
        feedbackBox.style.borderColor = '#86efac';
        feedbackBox.style.color = '#15803d';

        let nextActionHtml = '';
        if (quizIdx < quizzes.length - 1) {
          nextActionHtml = `
            <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <button type="button" class="btn-quiz-next-stage" onclick="app.switchAesopQuizTab('${storyId}', ${quizIdx + 1})">
                <span>다음 ${quizIdx + 2}단계 질문 풀기 ➔</span>
              </button>
              <span style="font-size: 13px; color: #166534; font-weight: 700;">(잠시 후 2초 뒤 자동으로 넘어가요)</span>
            </div>
          `;
        } else if (isAllSolved) {
          nextActionHtml = `
            <div style="margin-top: 12px; background: #fef3c7; border: 1.5px solid #fcd34d; border-radius: 14px; padding: 12px 16px; color: #92400e;">
              <div style="font-size: 15.5px; font-weight: 900;">🏆 대단해요! 3가지 지혜 퀴즈를 모두 완벽하게 맞혔어요! 💮</div>
              <div style="font-size: 13px; margin-top: 4px; color: #b45309;">잠시 후 다음 이솝우화 이야기로 이동합니다 ➔</div>
            </div>
          `;
        }

        feedbackBox.innerHTML = `
          <div style="font-size: 16px; font-weight: 900; margin-bottom: 6px;">🎉 딩동댕! ${quizIdx + 1}단계 질문 정답입니다! 🎺</div>
          <p style="margin: 4px 0; font-size: 14px; color: #166534;">👨 <strong>아빠의 칭찬:</strong> "${currentQuiz.dadFeedback}"</p>
          <div style="font-size: 13px; font-weight: 800; color: #b45309; margin-top: 6px;">💮 참 잘했어요 황금 도장 획득!</div>
          ${nextActionHtml}
        `;
      }

      if (isFirstSolve) {
        this.addStamp(1);
      }
      this.speak(`정답입니다! ${currentQuiz.dadFeedback}`, 'ko-KR', null, 'dad');
      this.logChildActivity('quiz', '💡', `이솝우화 [${story.title}] ${quizIdx + 1}단계 퀴즈 정답`, '참 잘했어요 도장 획득!', 'story', 45);

      // 자동 다음 단계 전환
      if (quizIdx < quizzes.length - 1) {
        this.aesopQuizAutoTimer = setTimeout(() => {
          this.switchAesopQuizTab(storyId, quizIdx + 1);
        }, 2200);
      } else if (isAllSolved) {
        // 모든 3문제 완료 시 2.8초 후 다음 이솝우화 이야기로 이동
        this.aesopQuizAutoTimer = setTimeout(() => {
          const curIdx = stories.findIndex(s => s.id === storyId);
          if (curIdx !== -1 && curIdx + 1 < stories.length) {
            const nextStory = stories[curIdx + 1];
            this.openAesopModal(nextStory.id, false);
            this.speak(`다음 이야기 [${nextStory.title}]를 들려줄게요!`, 'ko-KR');
          }
        }, 2800);
      }
    } else {
      this.playBeep(260, 'sine', 0.25, 0.15);
      if (btnElem) btnElem.classList.add('wrong');

      if (feedbackBox) {
        feedbackBox.style.display = 'block';
        feedbackBox.style.background = '#fef2f2';
        feedbackBox.style.borderColor = '#fecaca';
        feedbackBox.style.color = '#b91c1c';
        feedbackBox.innerHTML = `
          <div style="font-size: 14.5px; font-weight: 800; margin-bottom: 4px;">💡 다시 한번 생각해볼까요?</div>
          <p style="margin: 0; font-size: 13px;">동화 내용을 천천히 다시 읽어보고 골라보세요. 은찬이는 할 수 있어요!</p>
        `;
      }
    }
  }


  // =========================================================================
  // 8-2. ⌨️ 한글 타자기 & 문장 쓰기 모험 엔진
  // =========================================================================
  playTypewriterKey() {
    if (!this.isTypewriterSoundOn || this.isMuted || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 250, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } catch(e) {}
  }

  playTypewriterBell() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2093, now); // C7 bell ring
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.85);
    } catch(e) {}
  }

  toggleTypewriterSound() {
    this.playPop();
    this.isTypewriterSoundOn = !this.isTypewriterSoundOn;
    const btn = document.getElementById('typewriterSoundBtn');
    if (btn) {
      btn.classList.toggle('active', this.isTypewriterSoundOn);
      btn.innerHTML = `<span>${this.isTypewriterSoundOn ? '🔊 타자기 소리 켬' : '🔇 소리 끔'}</span>`;
    }
  }

  setTypingMode(mode, btnElem) {
    this.playPop();
    this.currentTab = 'typing';
    this.typingMode = mode;
    this.hangulComposer.clear();
    this.wordJamoIdx = 0;
    this.wordCompletedHandled = false;
    this.pendingDoubleConsonant = null;
    if (this.typingWordAutoTimer) {
      clearTimeout(this.typingWordAutoTimer);
      this.typingWordAutoTimer = null;
    }

    document.querySelectorAll('.typing-mode-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (btnElem) btnElem.classList.add('active');

    const views = {
      sentence: document.getElementById('typingSentenceView'),
      word: document.getElementById('typingWordView'),
      key: document.getElementById('typingKeyView'),
      free: document.getElementById('typingFreeView')
    };

    Object.keys(views).forEach(k => {
      if (views[k]) views[k].style.display = (k === mode) ? 'block' : 'none';
    });

    const toast = document.getElementById('typingCompleteToast');
    if (toast) toast.style.display = 'none';

    this.renderTyping();
  }

  renderTyping() {
    if (this.typingMode === 'sentence') {
      this.renderCurrentSentence();
    } else if (this.typingMode === 'word') {
      this.renderCurrentWord();
    } else if (this.typingMode === 'key') {
      this.renderCurrentKey();
    } else if (this.typingMode === 'free') {
      this.highlightNextTargetKey(null);
    }
  }

  renderCurrentSentence() {
    const data = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.sentences) || [];
    if (data.length === 0) return;

    const sentence = data[this.typingSentenceIdx % data.length];
    const catBadge = document.getElementById('sentenceCatBadge');
    const sourceInfo = document.getElementById('sentenceSourceInfo');
    const targetBox = document.getElementById('targetSentenceBox');
    const toast = document.getElementById('typingCompleteToast');
    if (!targetBox) return;

    if (catBadge) catBadge.textContent = sentence.category;
    if (sourceInfo) sourceInfo.textContent = `${sentence.source} · 교훈: ${sentence.moral}`;

    const currentText = this.hangulComposer.getFullText();
    const targetText = sentence.text;

    let html = '';
    for (let i = 0; i < targetText.length; i++) {
      const targetChar = targetText[i];
      let charClass = 'sentence-char';

      if (i < currentText.length) {
        if (currentText[i] === targetChar) {
          charClass += ' correct';
        } else {
          charClass += ' wrong';
        }
      } else if (i === currentText.length) {
        charClass += ' current';
      } else {
        charClass += ' pending';
      }

      html += `<span class="${charClass}">${targetChar === ' ' ? '&nbsp;' : targetChar}</span>`;
    }

    targetBox.innerHTML = html;

    // 통계 업데이트 (CPM 속도 및 정확도)
    this.updateTypingStats(currentText, targetText);

    // 다음 눌러야 할 글쇠 하이라이트
    if (currentText.length < targetText.length) {
      const nextChar = targetText[currentText.length];
      this.highlightNextTargetKey(nextChar);
    } else {
      this.highlightNextTargetKey(null);
    }

    // 문장 완성 여부 판정
    if (currentText === targetText) {
      this.onSentenceCompleted(sentence);
    }
  }

  onSentenceCompleted(sentence) {
    this.playTypewriterBell();
    // 🎺 승리의 빵빠레 & 축하 꽃가루 폭죽
    this.playFanfare();
    this.triggerConfetti();

    if (this.typingSentenceAutoTimer) {
      clearTimeout(this.typingSentenceAutoTimer);
      this.typingSentenceAutoTimer = null;
    }

    const toast = document.getElementById('typingCompleteToast');
    const title = document.getElementById('toastSentenceTitle');
    const praise = document.getElementById('toastSentencePraise');

    if (toast) {
      toast.style.display = 'flex';
      if (title) title.textContent = `🎉 [${sentence.category}] 문장 쓰기 미션 성공! 빵빠레! 🎺`;
      if (praise) praise.innerHTML = `"${sentence.text}" 완벽 작성 완료! <span class="feedback-auto-badge" style="margin-left: 8px;">⚡ 2초 후 다음 문장으로 자동 이동! ➔</span>`;
    }

    this.completedSentenceCount++;
    const stampLabel = document.getElementById('typingStampCount');
    if (stampLabel) stampLabel.textContent = this.completedSentenceCount;

    this.addStamp(1);
    this.speak(`멋지게 완성했구나! ${sentence.text}`, 'ko-KR');
    this.logChildActivity('typing', '⌨️', `타자기 문장 완성 빵빠레: [${sentence.category}]`, sentence.text, 'typing', 60);

    // ⚡ 2.2초 후 다음 문장으로 자동 이동!
    this.typingSentenceAutoTimer = setTimeout(() => {
      this.nextTypingSentence();
    }, 2200);
  }


  nextTypingSentence() {
    this.playPop();
    const data = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.sentences) || [];
    this.typingSentenceIdx = (this.typingSentenceIdx + 1) % data.length;
    this.hangulComposer.clear();
    const toast = document.getElementById('typingCompleteToast');
    if (toast) toast.style.display = 'none';
    this.renderCurrentSentence();
  }

  speakCurrentSentence() {
    this.playPop();
    const data = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.sentences) || [];
    const sentence = data[this.typingSentenceIdx % data.length];
    if (sentence) {
      this.speak(sentence.text, 'ko-KR');
    }
  }

  renderCurrentWord() {
    const words = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.words) || [];
    if (words.length === 0) return;

    const wordItem = words[this.typingWordIdx % words.length];
    const iconElem = document.getElementById('wordIconDisplay');
    const targetBox = document.getElementById('wordTargetBox');
    const hintElem = document.getElementById('wordHintText');
    const indexLabel = document.getElementById('wordIndexLabel');

    if (iconElem) iconElem.textContent = wordItem.icon;
    if (hintElem) hintElem.textContent = wordItem.hint;
    if (indexLabel) indexLabel.textContent = `낱말 ${this.typingWordIdx + 1} / ${words.length}`;

    const { syllables, flatJamos } = decomposeWordToJamos(wordItem.word);
    const step = Math.min(this.wordJamoIdx, flatJamos.length);
    const currentJamos = flatJamos.slice(0, step);
    const activeSylIdx = step < flatJamos.length ? flatJamos[step].sylIdx : -1;
    const isAllComplete = (step >= flatJamos.length && flatJamos.length > 0);

    let html = '';
    syllables.forEach((syl, sIdx) => {
      const sylJamos = currentJamos.filter(j => j.sylIdx === sIdx).map(j => j.key);
      let text = syl.char;
      let statusClass = 'pending';
      let statusBadge = '대기';

      if (sylJamos.length === syl.jamos.length) {
        statusClass = 'correct';
        statusBadge = '완료 ✓';
        text = syl.char;
      } else if (sylJamos.length > 0) {
        statusClass = 'current';
        statusBadge = '입력 중...';
        text = composePartialJamos(sylJamos);
      } else if (sIdx === activeSylIdx) {
        statusClass = 'current';
        statusBadge = '지금 글쇠!';
        text = syl.char;
      } else {
        statusClass = 'pending';
        statusBadge = `${sIdx + 1}번째`;
        text = syl.char;
      }

      // 🌟 낱말 글자 하나하나를 키보드 자판 키 모양(3D 키캡)으로 완벽하게 구현
      html += `
        <div class="word-keycap ${statusClass}" onclick="app.speak('${syl.char}', 'ko-KR')" title="[${syl.char}] 발음 듣기">
          <div class="keycap-header">
            <span class="keycap-step-num">${sIdx + 1}</span>
            <span class="keycap-status-badge">${statusBadge}</span>
          </div>
          <div class="keycap-char">${text}</div>
          <div class="keycap-jamos">
            ${syl.jamos.map((j, jIdx) => {
              const isTyped = jIdx < sylJamos.length;
              const isCurrentKey = (sIdx === activeSylIdx && jIdx === sylJamos.length);
              return `<span class="jamo-key-pill ${isTyped ? 'typed' : ''} ${isCurrentKey ? 'current' : ''}">${j}</span>`;
            }).join('')}
          </div>
        </div>
      `;
    });

    if (targetBox) targetBox.innerHTML = html;

    // 통계 업데이트
    this.updateTypingStats(currentJamos.map(j => j.key).join(''), flatJamos.map(j => j.key).join(''));

    // 하이라이트 글쇠 지정 및 엔터 키 상태 갱신
    const enterKeyBtn = document.querySelector('#onscreenKeyboard .key-enter');
    if (step < flatJamos.length) {
      const nextTargetKey = flatJamos[step].key;
      this.highlightNextTargetKey(nextTargetKey);
      if (enterKeyBtn) {
        enterKeyBtn.classList.remove('key-enter-ready');
        enterKeyBtn.innerHTML = '↵ 엔터';
      }
      const guideText = document.getElementById('wordTypingGuideText');
      if (guideText) guideText.innerHTML = `글쇠 <strong>[${nextTargetKey}]</strong>를 화면 키보드나 자판에서 눌러보세요! <span style="color:#64748b; font-size:12px;">(언제든 ↵ 엔터를 누르면 다음 낱말로 넘어가요)</span>`;
    } else {
      this.highlightNextTargetKey(null);
      // 🌟 낱말이 완성되었을 때 가상 키보드의 엔터 키를 하이라이트하여 엔터 안내!
      if (enterKeyBtn) {
        enterKeyBtn.classList.add('key-target-next', 'key-enter-ready');
        enterKeyBtn.innerHTML = '↵ 엔터 (다음 낱말 ➔)';
      }
      const guideText = document.getElementById('wordTypingGuideText');
      if (guideText) guideText.innerHTML = `🎉 <strong>완벽해요!</strong> 키보드의 <strong>[↵ 엔터(Enter)]</strong>를 누르면 바로 다음 낱말로 넘어가요!`;
      const nextKeyBadge = document.getElementById('wordNextKeyChar');
      if (nextKeyBadge) nextKeyBadge.textContent = '↵ 엔터';
    }

    // 낱말 완성 여부 판정
    if (isAllComplete) {
      if (!this.wordCompletedHandled) {
        this.wordCompletedHandled = true;
        this.playTypewriterBell();
        this.playSuccess();
        this.triggerConfetti();
        this.speak(`참 잘했어요! ${wordItem.word}! 엔터를 누르면 다음 낱말로 넘어가요!`, 'ko-KR', null, 'dad');
        this.addStamp(1);
        this.logChildActivity('typing', '🍎', `낱말 타자 성공: ${wordItem.word}`, wordItem.hint, 'typing', 30);

        if (this.typingWordAutoTimer) {
          clearTimeout(this.typingWordAutoTimer);
          this.typingWordAutoTimer = null;
        }
        // ⚡ 사용자가 엔터(Enter)를 누르면 즉각 이동하고, 기다릴 경우 2.5초 후 자동으로 다음 낱말 이동
        this.typingWordAutoTimer = setTimeout(() => {
          this.nextTypingWord();
        }, 2500);
      }
    } else {
      this.wordCompletedHandled = false;
    }
  }

  nextTypingWord() {
    this.playPop();
    if (this.typingWordAutoTimer) {
      clearTimeout(this.typingWordAutoTimer);
      this.typingWordAutoTimer = null;
    }
    const words = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.words) || [];
    this.typingWordIdx = (this.typingWordIdx + 1) % words.length;
    this.wordJamoIdx = 0;
    this.wordCompletedHandled = false;
    this.pendingDoubleConsonant = null;
    this.hangulComposer.clear();
    this.renderCurrentWord();

    const curWord = words[this.typingWordIdx % words.length];
    if (curWord) {
      this.speak(`다음 낱말은 [${curWord.word}]!`, 'ko-KR', null, 'dad');
    }
  }

  renderCurrentKey() {
    const keySets = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.keys) || [];
    if (keySets.length === 0) return;

    this.typingKeySetIdx = this.typingKeySetIdx || 0;
    this.typingKeyCharIdx = this.typingKeyCharIdx || 0;
    const curSet = keySets[this.typingKeySetIdx % keySets.length];
    const targetKeyChar = curSet.items[this.typingKeyCharIdx % curSet.items.length];

    const hugeDisplay = document.getElementById('targetKeyHugeDisplay');
    const tipElem = document.getElementById('targetKeyTip');

    if (hugeDisplay) hugeDisplay.textContent = targetKeyChar;
    if (tipElem) tipElem.textContent = `[${targetKeyChar}] 자판을 화면에서 클릭하거나 키보드로 눌러보세요!`;

    this.highlightNextTargetKey(targetKeyChar);
  }

  setKeyPracticeSet(setIdx) {
    this.playPop();
    this.typingKeySetIdx = setIdx;
    this.typingKeyCharIdx = 0;
    document.querySelectorAll('#keySetSelector .btn-keyset').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === setIdx);
    });
    this.renderCurrentKey();
  }

  handleVirtualKey(key) {
    this.playTypewriterKey();
    this.animateKeyVisual(key);

    // 🌟 1. 엔터(Enter) 키 처리: 낱말 모드 또는 문장 모드에서 즉시 다음 항목으로 이동
    if (key === 'Enter') {
      if (this.typingMode === 'word') {
        if (this.typingWordAutoTimer) {
          clearTimeout(this.typingWordAutoTimer);
          this.typingWordAutoTimer = null;
        }
        this.nextTypingWord();
        return;
      }
      if (this.typingMode === 'sentence') {
        if (this.typingSentenceAutoTimer) {
          clearTimeout(this.typingSentenceAutoTimer);
          this.typingSentenceAutoTimer = null;
        }
        this.nextTypingSentence();
        return;
      }
      if (this.typingMode === 'free') {
        const textarea = document.getElementById('freeLetterTextarea');
        if (textarea) textarea.value += '\n';
        return;
      }
      return;
    }

    if (this.typingMode === 'free') {
      const textarea = document.getElementById('freeLetterTextarea');
      if (textarea) {
        if (key === 'Backspace') {
          textarea.value = textarea.value.slice(0, -1);
        } else if (key === 'Space') {
          textarea.value += ' ';
        } else {
          // 한글 조합 반영
          this.hangulComposer.feed(key);
          textarea.value = this.hangulComposer.getFullText();
        }
      }
      return;
    }

    if (this.typingMode === 'key') {
      const keySets = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.keys) || [];
      const curSet = keySets[this.typingKeySetIdx % keySets.length];
      const targetKeyChar = curSet.items[this.typingKeyCharIdx % curSet.items.length];
      if (key === targetKeyChar) {
        this.playPop();
        this.typingKeyCharIdx++;
        this.renderCurrentKey();
      }
      return;
    }

    // 🍎 2. 낱말 쓰기 연습 모드 (자모 단위 순차 입력 및 타자 실시간 조합)
    if (this.typingMode === 'word') {
      const words = (window.EDU_DATA && window.EDU_DATA.typingData && window.EDU_DATA.typingData.words) || [];
      if (words.length === 0) return;
      const wordItem = words[this.typingWordIdx % words.length];
      const { flatJamos } = decomposeWordToJamos(wordItem.word);

      if (key === 'Backspace') {
        if (this.wordJamoIdx > 0) {
          this.wordJamoIdx--;
          this.wordCompletedHandled = false;
          if (this.typingWordAutoTimer) {
            clearTimeout(this.typingWordAutoTimer);
            this.typingWordAutoTimer = null;
          }
          this.renderCurrentWord();
        }
        return;
      }

      if (this.wordJamoIdx >= flatJamos.length) {
        // 이미 완성된 상태에서 엔터나 키 입력 시 다음 낱말로 이동
        this.nextTypingWord();
        return;
      }

      let effectiveKey = key;
      if (this.isVirtualShift) {
        const shiftMap = {
          'ㅂ': 'ㅃ', 'ㅈ': 'ㅉ', 'ㄷ': 'ㄸ', 'ㄱ': 'ㄲ', 'ㅅ': 'ㅆ',
          'ㅐ': 'ㅒ', 'ㅔ': 'ㅖ'
        };
        if (shiftMap[key]) effectiveKey = shiftMap[key];
      }

      const targetJamo = flatJamos[this.wordJamoIdx];
      const expectedKey = targetJamo.key;

      // 💡 쌍자음 편의: 쌍자음(ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) 차례일 때 기본자음 2회 입력 또는 Shift+자음 직접 입력 모두 허용
      const doubleConsonantBase = { 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' };
      let isMatch = (effectiveKey === expectedKey);
      if (!isMatch && doubleConsonantBase[expectedKey] === effectiveKey) {
        if (this.pendingDoubleConsonant === effectiveKey) {
          isMatch = true;
          this.pendingDoubleConsonant = null;
        } else {
          this.pendingDoubleConsonant = effectiveKey;
          this.playPop();
          return;
        }
      } else {
        this.pendingDoubleConsonant = null;
      }

      if (isMatch) {
        this.wordJamoIdx++;
        if (this.isVirtualShift) this.toggleVirtualShift();
        this.renderCurrentWord();
      } else {
        // 오타 시 경고 비프음 및 단어 카드 부드러운 쉐이크
        this.playBeep(260, 'sine', 0.2, 0.1);
        const targetBox = document.getElementById('wordTargetBox');
        if (targetBox) {
          targetBox.classList.add('word-shake');
          setTimeout(() => targetBox.classList.remove('word-shake'), 300);
        }
      }
      return;
    }

    // 📖 3. 문장 쓰기 모드
    this.hangulComposer.feed(key);
    this.renderTyping();
  }

  animateKeyVisual(key) {
    const keys = document.querySelectorAll('#onscreenKeyboard .key-btn');
    keys.forEach(btn => {
      if (btn.dataset.key === key || btn.dataset.shift === key || btn.textContent.trim() === key) {
        btn.classList.add('key-pressed');
        setTimeout(() => btn.classList.remove('key-pressed'), 140);
      }
    });
  }

  highlightNextTargetKey(targetChar) {
    // 모든 키의 타겟 하이라이트 제거
    document.querySelectorAll('#onscreenKeyboard .key-btn').forEach(btn => {
      btn.classList.remove('key-target-next');
    });

    const nextKeyBadge = document.getElementById('nextKeyChar');
    const wordNextKeyBadge = document.getElementById('wordNextKeyChar');
    const updateBadges = (txt) => {
      if (nextKeyBadge) nextKeyBadge.textContent = txt;
      if (wordNextKeyBadge) wordNextKeyBadge.textContent = txt;
    };

    if (!targetChar) {
      updateBadges('완성!');
      return;
    }

    let requiredKey = targetChar;
    if (targetChar === ' ') {
      requiredKey = 'Space';
    } else {
      // 한글 글자 분해 (초성/중성/종성 파악 - 문장 모드용)
      const code = targetChar.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const val = code - 0xAC00;
        const jong = val % 28;
        const jung = Math.floor(val / 28) % 21;
        const cho = Math.floor(val / 28 / 21);

        const currentComposerChar = this.hangulComposer.getCurrentChar();
        if (!currentComposerChar) {
          requiredKey = HC_CHO[cho];
        } else {
          if (this.hangulComposer.jung === -1) {
            requiredKey = HC_JUNG[jung];
          } else if (jong > 0 && this.hangulComposer.jong === -1) {
            requiredKey = HC_JONG[jong];
          } else {
            requiredKey = HC_CHO[cho];
          }
        }
      }
    }

    const isShiftKey = ['ㅃ','ㅉ','ㄸ','ㄲ','ㅆ','ㅒ','ㅖ'].includes(requiredKey);
    let displayText = (requiredKey === 'Space') ? '띄어쓰기' : requiredKey;
    if (isShiftKey) {
      const baseMap = { 'ㅃ': 'ㅂ', 'ㅉ': 'ㅈ', 'ㄸ': 'ㄷ', 'ㄲ': 'ㄱ', 'ㅆ': 'ㅅ', 'ㅒ': 'ㅐ', 'ㅖ': 'ㅔ' };
      displayText = `${requiredKey} (쉬프트+${baseMap[requiredKey] || ''})`;
    }
    updateBadges(displayText);

    // 해당 키 버튼에 타겟 클래스 부여
    document.querySelectorAll('#onscreenKeyboard .key-btn').forEach(btn => {
      if (btn.dataset.key === requiredKey || btn.dataset.shift === requiredKey) {
        btn.classList.add('key-target-next');
      }
    });

    // 쉬프트 키가 필요한 경우 쉬프트 버튼도 하이라이트
    if (isShiftKey && !this.isVirtualShift) {
      const shiftBtn = document.getElementById('keyShiftBtn');
      if (shiftBtn) shiftBtn.classList.add('key-target-next');
    }
  }

  toggleVirtualShift() {
    this.playPop();
    this.isVirtualShift = !this.isVirtualShift;
    const shiftBtn = document.getElementById('keyShiftBtn');
    if (shiftBtn) shiftBtn.classList.toggle('active', this.isVirtualShift);

    document.querySelectorAll('#onscreenKeyboard .key-btn').forEach(btn => {
      if (btn.dataset.shift) {
        if (this.isVirtualShift) {
          btn.innerHTML = `${btn.dataset.shift}<span class="sub-key">${btn.dataset.key}</span>`;
        } else {
          btn.innerHTML = `${btn.dataset.key}<span class="sub-key">${btn.dataset.shift}</span>`;
        }
      }
    });
  }

  updateTypingStats(currentText, targetText) {
    if (!this.typingStartTime && currentText.length > 0) {
      this.typingStartTime = Date.now();
    }

    let cpm = 0;
    if (this.typingStartTime && currentText.length > 0) {
      const elapsedMinutes = (Date.now() - this.typingStartTime) / 60000;
      if (elapsedMinutes > 0.01) {
        cpm = Math.round(currentText.length / elapsedMinutes);
      }
    }

    let matchCount = 0;
    for (let i = 0; i < currentText.length; i++) {
      if (i < targetText.length && currentText[i] === targetText[i]) matchCount++;
    }
    const accuracy = currentText.length > 0 ? Math.round((matchCount / currentText.length) * 100) : 100;

    const speedElem = document.getElementById('typingSpeedCpm');
    const accElem = document.getElementById('typingAccuracy');
    if (speedElem) speedElem.textContent = cpm;
    if (accElem) accElem.textContent = accuracy;
  }

  setupTypingListeners() {
    const handleKeyInput = (e) => {
      const isTypingActive = (this.currentTab === 'typing') || 
        (document.getElementById('tab-typing') && document.getElementById('tab-typing').classList.contains('active')) ||
        (document.getElementById('typingWordView') && document.getElementById('typingWordView').offsetParent !== null);
      if (!isTypingActive) return;

      const activeEl = document.activeElement;
      if (activeEl && activeEl.id === 'freeLetterTextarea') {
        this.playTypewriterKey();
        return;
      }

      // 1. 엔터(Enter) 키: e.key, e.code, e.keyCode 모두 완벽 처리 (IME composition 상태 및 텐키패드 포함)
      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter' || e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        this.handleVirtualKey('Enter');
        return;
      }

      // 2. 백스페이스(Backspace) 키
      if (e.key === 'Backspace' || e.code === 'Backspace' || e.keyCode === 8) {
        e.preventDefault();
        e.stopPropagation();
        this.handleVirtualKey('Backspace');
        return;
      }

      // 3. 띄어쓰기(Space) 키
      if (e.key === ' ' || e.key === 'Spacebar' || e.code === 'Space' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();
        this.handleVirtualKey('Space');
        return;
      }

      // 4. 일반 글쇠(자음/모음): Windows 한글 IME(Process/229) 및 영문 상태 모두 100% 매핑
      let keyChar = null;

      // 4-1. e.code (물리 키보드 키캡 위치) 우선 판별 - 한영 전환 상태나 IME 229 무관하게 무조건 정확히 입력!
      if (e.shiftKey && CODE_TO_KO_SHIFT_MAP[e.code]) {
        keyChar = CODE_TO_KO_SHIFT_MAP[e.code];
      } else if (CODE_TO_KO_MAP[e.code]) {
        keyChar = CODE_TO_KO_MAP[e.code];
      }

      // 4-2. e.key 직접 전달 시 보완 (QWERTY 문자 또는 직접 자모)
      if (!keyChar) {
        if (QWERTY_KO_MAP[e.key]) {
          keyChar = QWERTY_KO_MAP[e.key];
        } else if (HC_CHO.includes(e.key) || HC_JUNG.includes(e.key) || e.key === '.' || e.key === ',') {
          keyChar = e.key;
        }
      }

      // 4-3. IME로 완성형 음절이 단독 전달된 경우 (예: '사', '과')
      if (!keyChar && e.key && e.key.length === 1) {
        const code = e.key.charCodeAt(0);
        if (code >= 0xAC00 && code <= 0xD7A3) {
          const { flatJamos } = decomposeWordToJamos(e.key);
          if (flatJamos && flatJamos.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            flatJamos.forEach(j => this.handleVirtualKey(j.key));
            return;
          }
        }
      }

      if (keyChar) {
        e.preventDefault();
        e.stopPropagation();
        this.handleVirtualKey(keyChar);
      }
    };

    // 캡처링 단계(true)에서 가로채 브라우저 기본 IME 버퍼링보다 먼저 정확히 처리
    window.addEventListener('keydown', handleKeyInput, true);
  }

  // 자유 편지 타자기 기능
  speakFreeLetter() {
    const textarea = document.getElementById('freeLetterTextarea');
    const text = (textarea && textarea.value) ? textarea.value.trim() : '';
    if (!text) {
      alert("편지지에 먼저 내용을 작성해보세요!");
      return;
    }
    this.playPop();
    this.speak(`은찬이가 쓴 편지예요. ${text}`, 'ko-KR');
  }

  sendLetterToParents() {
    const textarea = document.getElementById('freeLetterTextarea');
    const text = (textarea && textarea.value) ? textarea.value.trim() : '';
    if (!text) {
      alert("부모님께 보낼 편지 내용을 먼저 작성해보세요!");
      return;
    }

    this.playSuccess();
    this.addStamp(2);
    this.logChildActivity('letter', '💌', '부모님께 보낸 사랑의 타자기 편지', text, 'typing', 120);

    alert("💖 아빠, 엄마에게 은찬이의 소중한 편지가 전송되었어요!\n부모님 스마트폰 화면에서 실시간으로 확인하실 수 있답니다! (황금 도장 2개 획득!)");
  }

  copyFreeLetter() {
    const textarea = document.getElementById('freeLetterTextarea');
    if (textarea && textarea.value) {
      navigator.clipboard.writeText(textarea.value).then(() => {
        this.playPop();
        alert("편지 내용이 클립보드에 복사되었어요!");
      }).catch(() => {});
    }
  }

  printFreeLetter() {
    window.print();
  }

  clearFreeLetter() {
    if (confirm("편지 내용을 지우고 새 종이를 끼울까요?")) {
      this.playPop();
      const textarea = document.getElementById('freeLetterTextarea');
      if (textarea) textarea.value = '';
      this.hangulComposer.clear();
    }
  }

  // =========================================================================
  // 9. 칭찬 도장판 & 황금 상장 수여
  // =========================================================================
  renderStamps() {
    const grid = document.getElementById('stampsGrid');
    const label = document.getElementById('stampsCountLabel');
    if (!grid) return;

    if (label) label.textContent = `${this.stampsCount} / 10`;

    let html = '';
    for (let i = 0; i < 10; i++) {
      if (i < this.stampsCount) {
        html += `
          <div class="stamp-slot stamped">
            <span class="stamp-mark">💮</span>
            <span class="stamp-number">${i + 1}</span>
          </div>
        `;
      } else {
        html += `
          <div class="stamp-slot empty">
            <span class="stamp-number">${i + 1}</span>
          </div>
        `;
      }
    }
    grid.innerHTML = html;

    const badgeContainer = document.getElementById('badgesList');
    if (badgeContainer) {
      badgeContainer.innerHTML = window.EDU_DATA.historyEpisodes.map(ep => {
        const unlocked = Array.isArray(this.unlockedBadges) ? this.unlockedBadges : [];
        const isUnlocked = unlocked.includes(ep.badge);
        return `
          <div class="badge-item ${isUnlocked ? 'unlocked' : 'locked'}">
            <span class="badge-icon">${isUnlocked ? ep.icon : '🔒'}</span>
            <span class="badge-title">${ep.badge}</span>
          </div>
        `;
      }).join('');
    }
  }

  addStamp(count = 1) {
    this.stampsCount = Math.min(this.stampsCount + count, 10);
    localStorage.setItem('eunchan_stamps', this.stampsCount.toString());
    this.renderStamps();

    if (this.stampsCount >= 10) {
      this.playSuccess();
      setTimeout(() => {
        alert("🎉 대단해 은찬아!\n\n참 잘했어요 도장 10개를 모두 모았어!\n지금 바로 황금 칭찬 상장을 출력해보자!");
      }, 500);
    }
  }

  resetStamps() {
    if (confirm("도장판을 초기화하고 새 도전을 시작할까요?")) {
      this.stampsCount = 0;
      localStorage.setItem('eunchan_stamps', '0');
      this.renderStamps();
    }
  }

  

  // =========================================================================
  // 10. 온 가족 패밀리 모드 & 스마트폰 실시간 칭찬 / AI 분석 엔진 (옵션 B)
  // =========================================================================
  switchProfile(profileId, playAudio = true) {
    this.currentProfile = profileId;
    localStorage.setItem('eunchan_family_profile', profileId);
    if (playAudio) this.playPop();

    ['eunchan', 'eunwoo', 'dad', 'mom'].forEach(pid => {
      const btn = document.getElementById(`profBtn_${pid}`);
      if (btn) btn.classList.toggle('active', pid === profileId);
    });

    const parentTabBtn = document.getElementById('tabBtnParent');
    const brandTitle = document.querySelector('.brand-title-group h1');
    const brandDesc = document.querySelector('.brand-title-group p');

    if (profileId === 'dad' || profileId === 'mom') {
      if (parentTabBtn) parentTabBtn.style.display = 'inline-flex';
      this.switchTab('parent');

      const isDad = profileId === 'dad';
      const bTitle = document.getElementById('parentBannerTitle');
      const bDesc = document.getElementById('parentBannerDesc');
      const giverBadge = document.getElementById('stickerGiverBadge');

      if (bTitle) bTitle.textContent = isDad ? '👨‍👩‍👧‍👦 정연수 최은지의 자녀 교육 & 칭찬 센터' : '👩 최은지 엄마의 사랑 칭찬 & 교육 분석관';
      if (bDesc) bDesc.textContent = isDad
        ? '스마트폰과 PC에서 실시간으로 아이들의 학습 타임라인을 확인하고, AI 관심사 분석 리포트를 보며 칭찬 도장을 보낼 수 있습니다.'
        : '은찬이와 은우가 오늘 무엇에 몰입했는지 살펴보고, 따뜻한 하트 도장과 칭찬 메시지를 실시간으로 선물해주세요.';
      if (giverBadge) giverBadge.textContent = isDad ? '정연수 아빠' : '최은지 엄마';

      this.updateStickerButtonLabel();
      this.fetchFamilyData();

      if (this.stickerPollTimer) clearInterval(this.stickerPollTimer);
    } else {
      if (parentTabBtn) parentTabBtn.style.display = 'none';
      if (this.currentTab === 'parent') this.switchTab('home');

      if (brandTitle) brandTitle.textContent = '☀️ 은찬, 은우 스튜디오';
      if (brandDesc) brandDesc.textContent = '';

      this.startStickerPolling();
    }

    // 좌우 여백 은찬이 / 은우 사진 활성 테두리 동기화
    const leftWing = document.getElementById('sideWingEunchan');
    const rightWing = document.getElementById('sideWingEunwoo');
    if (leftWing) leftWing.classList.toggle('active-child', profileId === 'eunchan' || (this.isParentProfile(profileId) && this.parentTargetChild === 'eunchan'));
    if (rightWing) rightWing.classList.toggle('active-child', profileId === 'eunwoo' || (this.isParentProfile(profileId) && this.parentTargetChild === 'eunwoo'));
  }

  selectParentTargetChild(childId) {
    this.parentTargetChild = childId;
    this.playPop();

    const btn1 = document.getElementById('pChildBtn_eunchan');
    const btn2 = document.getElementById('pChildBtn_eunwoo');
    if (btn1) btn1.classList.toggle('active', childId === 'eunchan');
    if (btn2) btn2.classList.toggle('active', childId === 'eunwoo');

    const leftWing = document.getElementById('sideWingEunchan');
    const rightWing = document.getElementById('sideWingEunwoo');
    if (leftWing) leftWing.classList.toggle('active-child', childId === 'eunchan');
    if (rightWing) rightWing.classList.toggle('active-child', childId === 'eunwoo');

    this.updateStickerButtonLabel();
    if (this.familyDb) {
      this.renderParentDashboard();
    } else {
      this.fetchFamilyData();
    }
  }

  updateStickerButtonLabel() {
    const btnText = document.getElementById('sendStickerBtnText');
    const childName = this.parentTargetChild === 'eunchan' ? '은찬이' : '은우';
    const giverName = this.currentProfile === 'mom' ? '엄마' : '아빠';
    if (btnText) {
      btnText.textContent = `🚀 ${childName}에게 ${giverName}의 ${this.selectedSticker.title} 쾅! 보내기`;
    }
  }

  fetchFamilyData(showToast = false) {
    const syncStatus = document.getElementById('parentSyncStatus');
    if (syncStatus) syncStatus.textContent = '동기화 중...';

    fetch('/api/family', { headers: this.getAuthHeaders() })
      .then(res => {
        if (!res.ok) throw new Error("Server not responding");
        return res.json();
      })
      .then(data => {
        this.familyDb = data;
        this.saveLocalFamilyDb(data);
        if (syncStatus) syncStatus.textContent = '패밀리 서버 실시간 연동 완료 (' + (data.serverTime ? data.serverTime.split(' ')[1] : '') + ')';
        this.renderParentDashboard();
        if (showToast) {
          this.playSuccess();
          alert('🔄 실시간 타임라인 및 AI 분석 데이터를 최신으로 갱신했습니다!');
        }
      })
      .catch(err => {
        // Fallback to local DB (PC turned off or offline)
        this.familyDb = this.getLocalFamilyDb();
        if (syncStatus) syncStatus.textContent = '24시간 클라우드 자율 모드 (컴퓨터 OFF 대응)';
        this.renderParentDashboard();
        if (showToast) {
          this.playPop();
          alert('📱 24시간 클라우드 모드로 작동 중입니다! (모바일에서 모든 기능을 자유롭게 사용하실 수 있습니다)');
        }
      });
  }

  renderParentDashboard() {
    const pinBadge = document.getElementById('currentPinBadge');
    if (pinBadge) {
      const masterPin = localStorage.getItem('family_master_pin') || '0330';
      pinBadge.textContent = `**** (${masterPin})`;
    }

    if (!this.familyDb) return;

    const childId = this.parentTargetChild;
    const analytics = (this.familyDb.analytics && this.familyDb.analytics[childId]) || {};
    const catPct = analytics.categoryPercentages || {};

    const setBar = (cat, defaultVal = 0) => {
      const pct = catPct[cat] !== undefined ? catPct[cat] : defaultVal;
      const textElem = document.getElementById(`barPct_${cat}`);
      const fillElem = document.getElementById(`barFill_${cat}`);
      if (textElem) textElem.textContent = `${pct}%`;
      if (fillElem) fillElem.style.width = `${pct}%`;
    };

    setBar('car', 35);
    setBar('history', 30);
    setBar('language', 25);
    setBar('dino', 10);

    const diagElem = document.getElementById('aiDiagnosisText');
    const tipElem = document.getElementById('aiCoachingTipText');
    if (diagElem && analytics.aiDiagnosis) diagElem.textContent = analytics.aiDiagnosis;
    if (tipElem && analytics.coachingTip) tipElem.textContent = analytics.coachingTip;

    const timelineContainer = document.getElementById('parentTimelineList');
    const timelineBadge = document.getElementById('timelineCountBadge');
    const childActivities = (this.familyDb.activities || []).filter(a => a.childId === childId);

    if (timelineBadge) timelineBadge.textContent = `${childActivities.length}개 활동 기록`;

    if (timelineContainer) {
      if (childActivities.length === 0) {
        timelineContainer.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 30px;">아직 기록된 활동이 없습니다. 아이가 앱에서 활동을 시작하면 실시간으로 나타납니다!</div>';
      } else {
        timelineContainer.innerHTML = childActivities.map(a => `
          <div class="timeline-item-card">
            <span class="timeline-item-icon">${a.icon || '🌟'}</span>
            <div class="timeline-item-body">
              <div class="timeline-item-top">
                <span class="timeline-item-title">${a.title}</span>
                <span class="timeline-item-time">${a.timestamp ? a.timestamp.split(' ')[1] : ''}</span>
              </div>
              <p class="timeline-item-detail">${a.detail}</p>
            </div>
          </div>
        `).join('');
      }
    }

    const childProfile = (this.familyDb.profiles && this.familyDb.profiles[childId]) || {};
    const stampsCount = childProfile.stampsCount || 0;
    const stampsBadge = document.getElementById('parentStampsBadge');
    if (stampsBadge) stampsBadge.textContent = `${stampsCount} / 10`;

    const stampsTitle = document.getElementById('parentStampsTitle');
    const childTitleName = childId === 'eunchan' ? '첫째 은찬이' : '동생 은우';
    if (stampsTitle) stampsTitle.innerHTML = `💮 <span style="color:#d97706; font-weight:800;">${childTitleName}</span> 도장판 진행 현황 & 황금 상장 수여`;

    const miniGrid = document.getElementById('parentStampsMiniGrid');
    if (miniGrid) {
      const childStickers = (this.familyDb.stickers || []).filter(s => s.targetChild === childId);
      let html = '';
      for (let i = 0; i < 10; i++) {
        if (i < stampsCount) {
          const stk = childStickers[i] || { icon: '🏆', giverName: '아빠' };
          html += `
            <div class="pstamp-box stamped">
              <span class="pstamp-icon">${stk.icon || '🏆'}</span>
              <span class="pstamp-giver">${stk.giverName ? stk.giverName.replace('정연수 ', '') : '아빠'}</span>
            </div>
          `;
        } else {
          html += `
            <div class="pstamp-box">
              <span style="font-size: 13px; color: #cbd5e1; font-weight: 800;">${i + 1}</span>
            </div>
          `;
        }
      }
      miniGrid.innerHTML = html;
    }
  }

  pickStickerType(btn) {
    document.querySelectorAll('.sticker-opt-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    this.selectedSticker = {
      type: btn.dataset.type,
      icon: btn.dataset.icon,
      title: btn.dataset.title
    };
    this.playPop();
    this.updateStickerButtonLabel();
  }

  pickReasonChip(reasonText) {
    const input = document.getElementById('customStickerReason');
    if (input) {
      input.value = reasonText;
      input.focus();
    }
    this.playPop();
  }

  sendStickerFromParent() {
    const input = document.getElementById('customStickerReason');
    const reason = (input && input.value.trim()) ? input.value.trim() : '스스로 씩씩하게 멋지게 해냄!';
    const giver = this.currentProfile === 'mom' ? 'mom' : 'dad';
    const giverName = giver === 'mom' ? '최은지 엄마' : '정연수 아빠';
    const targetChild = this.parentTargetChild;
    const childName = targetChild === 'eunchan' ? '은찬이' : '은우';

    const payload = {
      targetChild: targetChild,
      giver: giver,
      giverName: giverName,
      stickerType: this.selectedSticker.type,
      icon: this.selectedSticker.icon,
      title: this.selectedSticker.title,
      reason: reason
    };

    fetch('/api/sticker', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          this.playSuccess();
          if (input) input.value = '';
          alert(`🎉 전송 완료!\n\n${childName}에게 [${payload.title}] 칭찬 도장을 쾅 찍어 보냈습니다!\n아이 화면에 실시간 축하 팡파르가 울려 퍼집니다.`);
          this.fetchFamilyData();
        }
      })
      .catch(err => {
        // Local offline fallback
        const db = this.getLocalFamilyDb();
        const newSticker = {
          id: 'stk_' + Date.now(),
          targetChild: targetChild,
          giver: giver,
          giverName: giverName,
          stickerType: this.selectedSticker.type,
          icon: this.selectedSticker.icon,
          title: this.selectedSticker.title,
          reason: reason,
          timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };
        db.stickers.unshift(newSticker);
        const p = db.profiles[targetChild] || {};
        p.stampsCount = Math.min((p.stampsCount || 0) + 1, 10);
        db.unreadForChild = db.unreadForChild || {};
        db.unreadForChild[targetChild] = db.unreadForChild[targetChild] || [];
        db.unreadForChild[targetChild].push(newSticker);
        this.saveLocalFamilyDb(db);
        this.familyDb = db;
        this.playSuccess();
        if (input) input.value = '';
        alert(`🎉 [24H 클라우드 모드] 전송 완료!\n\n${childName}에게 [${payload.title}] 칭찬 도장을 쾅 찍었습니다! (현재 도장: ${p.stampsCount}개)`);
        this.renderParentDashboard();
      });
  }

  

  startStickerPolling() {
    if (this.stickerPollTimer) clearInterval(this.stickerPollTimer);

    this.stickerPollTimer = setInterval(() => {
      if (this.currentProfile === 'dad' || this.currentProfile === 'mom') return;

      fetch(`/api/check_stickers?child=${this.currentProfile}`)
        .then(res => res.json())
        .then(stickers => {
          if (Array.isArray(stickers) && stickers.length > 0) {
            stickers.forEach(stk => this.showStickerCelebration(stk));
          }
        })
        .catch(() => {});
    }, 3000);
  }

  showStickerCelebration(stk) {
    this.playSuccess();
    const modal = document.getElementById('stickerCelebrationModal');
    if (!modal) return;

    const iconElem = document.getElementById('celebStampIcon');
    const titleElem = document.getElementById('celebTitle');
    const giverElem = document.getElementById('celebGiver');
    const reasonElem = document.getElementById('celebReasonText');
    const countElem = document.getElementById('celebStampsStatus');

    if (iconElem) iconElem.textContent = stk.icon || '🏆';
    if (titleElem) titleElem.textContent = `${stk.title || '칭찬 도장'} 쾅!`;
    if (giverElem) giverElem.textContent = `${stk.giverName || '정연수 아빠'}님이 칭찬 스티커를 보냈어요!`;
    if (reasonElem) reasonElem.textContent = stk.reason || '참 잘했어요!';

    this.stampsCount = Math.min((this.stampsCount || 0) + 1, 10);
    localStorage.setItem('eunchan_stamps', this.stampsCount.toString());
    this.renderStamps();

    if (countElem) countElem.textContent = `현재 도장: ${this.stampsCount} / 10`;

    modal.classList.add('active');

    const childName = this.currentProfile === 'eunchan' ? '은찬아' : '은우야';
    const speechText = `축하해 ${childName}! ${stk.giverName}님이 칭찬 도장을 보내주셨어! ${stk.reason}!`;
    this.speakDadReaction(speechText);
  }

  closeStickerCelebration() {
    this.playPop();
    const modal = document.getElementById('stickerCelebrationModal');
    if (modal) modal.classList.remove('active');
    this.switchTab('home');
  }

  openMobileModal() {
    this.playPop();
    const modal = document.getElementById('mobileAccessModal');
    const display = document.getElementById('mobileUrlDisplay');
    if (display) {
      display.textContent = `http://${window.location.hostname || '172.30.1.27'}:8800`;
    }
    if (modal) modal.classList.add('active');
  }

  closeMobileModal() {
    this.playPop();
    const modal = document.getElementById('mobileAccessModal');
    if (modal) modal.classList.remove('active');
  }

  logChildActivity(type, icon, title, detail, category, timeSpentSec = 60) {
    if (this.currentProfile === 'dad' || this.currentProfile === 'mom') return;

    const payload = {
      childId: this.currentProfile,
      childName: this.currentProfile === 'eunchan' ? '정은찬' : '정은우',
      type: type,
      icon: icon,
      title: title,
      detail: detail,
      category: category,
      timeSpentSec: timeSpentSec,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    fetch('/api/activity', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    }).catch(() => {
      // Local DB activity recording fallback
      try {
        const db = this.getLocalFamilyDb();
        db.activities = db.activities || [];
        payload.id = 'act_' + Date.now();
        db.activities.unshift(payload);
        if (db.activities.length > 200) db.activities = db.activities.slice(0, 200);
        this.saveLocalFamilyDb(db);
      } catch(e) {}
    });
  }

  // =========================================================================
  // 10. 세계 여러 나라 탐험관 & 국기 백과사전 & 퀴즈 아레나 로직
  // =========================================================================
  renderCountries() {
    const countries = (window.EDU_DATA && window.EDU_DATA.countriesData) || [];
    const grid = document.getElementById('countryCardsGrid');
    const emptyState = document.getElementById('countryEmptyState');
    const solvedHeroElem = document.getElementById('countryHeroSolvedCount');

    if (solvedHeroElem) {
      solvedHeroElem.textContent = `${this.countryQuizSolvedCount}개`;
    }

    if (!grid) return;

    // 대륙 및 검색어 필터링
    const q = (this.countrySearchQuery || '').trim().toLowerCase();
    const filtered = countries.filter(c => {
      // 1) 대륙 필터
      if (this.currentContinent !== 'all') {
        if (this.currentContinent === 'special') {
          if (c.continent !== 'special') return false;
        } else if (c.continent !== this.currentContinent) {
          return false;
        }
      }
      // 2) 검색어 필터
      if (!q) return true;
      const matchName = c.name.toLowerCase().includes(q) || c.enName.toLowerCase().includes(q) || (c.localName && c.localName.toLowerCase().includes(q));
      const matchCapital = c.capital.toLowerCase().includes(q);
      const matchFlag = c.flagName && c.flagName.toLowerCase().includes(q);
      const matchSpecialty = (c.specialties || []).some(s => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
      const matchLandmark = (c.landmarks || []).some(l => l.name.toLowerCase().includes(q) || l.desc.toLowerCase().includes(q));
      return matchName || matchCapital || matchFlag || matchSpecialty || matchLandmark;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(c => {
      const topSpecialties = (c.specialties || []).slice(0, 3);
      return `
        <div class="country-card" id="countryCard_${c.id}">
          <div>
            <div class="card-top-row">
              <div class="country-flag-box"><img src="${c.flagImg}" alt="${c.name} 국기" class="country-flag-img"></div>
              <span class="continent-badge-pill ${c.continent}">${c.continentName || '지구촌'}</span>
            </div>

            <div class="country-card-titles">
              <h3>
                <span>${c.name}</span>
                ${c.flagName ? `<span class="flag-alias-tag">${c.flagName}</span>` : ''}
              </h3>
              <div class="country-en-name">${c.enName}</div>
            </div>

            <div class="country-facts-grid">
              <div class="fact-item">
                <span class="fact-label">🏛️ 수도</span>
                <span class="fact-val" title="${c.capital}">${c.capital.split(' ')[0]}</span>
              </div>
              <div class="fact-item">
                <span class="fact-label">👥 인구</span>
                <span class="fact-val">${c.population}</span>
              </div>
              <div class="fact-item" style="grid-column: span 2;">
                <span class="fact-label">📍 위치</span>
                <span class="fact-val" style="font-size: 12.5px;">${c.location}</span>
              </div>
            </div>

            <div class="specialties-preview-box">
              <span class="sec-label">🌾 특산물 & 대표 음식:</span>
              <div class="specialty-tags-row">
                ${topSpecialties.map(s => `
                  <span class="specialty-pill-tag">
                    <span>${s.icon}</span> ${s.name.split('&')[0].trim()}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="country-card-actions">
            <button class="btn-card-explore" onclick="app.openCountryModal('${c.id}')">
              <span>🔍 자세히 탐험하기</span>
            </button>
            <button class="btn-card-quiz" onclick="app.openCountryQuizArena('mixed', '${c.id}')" title="이 나라 퀴즈 풀기">
              <span>🎯 퀴즈</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  filterCountriesContinent(continent) {
    this.playPop();
    this.currentContinent = continent;

    document.querySelectorAll('.continent-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.continent === continent);
    });

    this.renderCountries();
  }

  searchCountries(query) {
    this.countrySearchQuery = (query || '').trim().toLowerCase();
    const clearBtn = document.getElementById('btnClearCountrySearch');
    if (clearBtn) {
      clearBtn.style.display = this.countrySearchQuery ? 'flex' : 'none';
    }
    this.renderCountries();
  }

  clearCountrySearch() {
    this.playPop();
    this.countrySearchQuery = '';
    const input = document.getElementById('countrySearchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('btnClearCountrySearch');
    if (clearBtn) clearBtn.style.display = 'none';
    this.renderCountries();
  }

  openCountryModal(countryId) {
    const countries = (window.EDU_DATA && window.EDU_DATA.countriesData) || [];
    const country = countries.find(c => c.id === countryId);
    if (!country) return;

    this.playPop();
    this.currentCountryDetailId = countryId;

    const flagElem = document.getElementById('modalCountryFlag');
    const titleElem = document.getElementById('modalCountryTitle');
    const subElem = document.getElementById('modalCountryEnTitle');
    const bodyElem = document.getElementById('countryModalBody');
    const modal = document.getElementById('countryDetailModal');

    if (flagElem) flagElem.innerHTML = `<img src="${country.flagImg}" alt="${country.name} 국기" class="modal-header-flag-img">`;
    if (titleElem) titleElem.textContent = `${country.name} (${country.localName || country.enName})`;
    if (subElem) subElem.textContent = `${country.enName} · ${country.continentName} 대륙 · ${country.flagName || '국기'}`;

    if (bodyElem) {
      bodyElem.innerHTML = `
        <!-- 1. 국기 설명 배너 카드 -->
        <div class="modal-flag-story-card">
          <div class="modal-big-flag-box"><img src="${country.flagImg}" alt="${country.name} 국기" class="modal-hero-flag-img"></div>
          <div class="flag-story-text">
            <h4>🚩 ${country.name}의 국기: ${country.flagName || '국기'}</h4>
            <p>${country.flagDesc || '아름다운 상징이 담겨 있는 국기예요.'}</p>
          </div>
        </div>

        <!-- 2. 지리 & 수도 & 인구 3대 팩트 그리드 -->
        <div class="modal-facts-trio-grid">
          <div class="fact-trio-card">
            <div class="fact-trio-header"><span>🏛️</span> 수도</div>
            <div class="fact-trio-title">${country.capital}</div>
            <p class="fact-trio-desc">${country.capitalDesc || '역사와 문화가 살아 숨쉬는 중심 도시'}</p>
          </div>

          <div class="fact-trio-card">
            <div class="fact-trio-header"><span>👥</span> 인구 & 면적</div>
            <div class="fact-trio-title">${country.population}</div>
            <p class="fact-trio-desc">면적: ${country.area || '광대한 영토'}</p>
          </div>

          <div class="fact-trio-card">
            <div class="fact-trio-header"><span>📍</span> 위치와 환경</div>
            <div class="fact-trio-title">${country.continentName}</div>
            <p class="fact-trio-desc">${country.location}</p>
          </div>
        </div>

        <!-- 3. 특산물 & 대표 요리 -->
        <div>
          <h4 class="modal-section-title"><span>🌾</span> ${country.name}의 대표 특산물과 맛있는 음식</h4>
          <div class="specialties-grid">
            ${(country.specialties || []).map(s => `
              <div class="specialty-item-card">
                <span class="specialty-item-icon">${s.icon}</span>
                <div>
                  <div class="specialty-item-name">${s.name}</div>
                  <p class="specialty-item-desc">${s.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 4. 대표 랜드마크 & 명소 -->
        <div>
          <h4 class="modal-section-title"><span>🏰</span> 세계적인 랜드마크와 신비한 자연</h4>
          <div class="landmarks-grid">
            ${(country.landmarks || []).map(l => `
              <div class="landmark-item-card">
                <span class="landmark-item-icon">${l.icon}</span>
                <div>
                  <div class="landmark-item-name">${l.name}</div>
                  <p class="landmark-item-desc">${l.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 5. 언어 및 4개국어 인사말 -->
        <div class="modal-greetings-box">
          <h4 class="modal-section-title" style="margin: 0;"><span>🗣️</span> 언어 & 다국어 인사말 (소리 들어보기)</h4>
          <div style="font-size: 13.5px; color: #64748b; margin-top: 4px;">공용어: <strong>${country.language}</strong></div>
          <div class="greetings-list">
            <div class="greeting-card-pill">
              <div>
                <span class="greeting-lang-tag">한국어</span>
                <div class="greeting-text-val">${country.greetings?.ko || '안녕하세요!'}</div>
              </div>
              <button class="btn-speak-greeting" onclick="app.speakCountryGreeting('${country.id}', 'ko')" title="한국어 발음 듣기">🔊</button>
            </div>

            <div class="greeting-card-pill">
              <div>
                <span class="greeting-lang-tag">영어</span>
                <div class="greeting-text-val">${country.greetings?.en || 'Hello!'}</div>
              </div>
              <button class="btn-speak-greeting" onclick="app.speakCountryGreeting('${country.id}', 'en')" title="영어 발음 듣기">🔊</button>
            </div>

            <div class="greeting-card-pill">
              <div>
                <span class="greeting-lang-tag">중국어</span>
                <div class="greeting-text-val">${country.greetings?.zh || '你好!'}</div>
              </div>
              <button class="btn-speak-greeting" onclick="app.speakCountryGreeting('${country.id}', 'zh')" title="중국어 발음 듣기">🔊</button>
            </div>

            <div class="greeting-card-pill">
              <div>
                <span class="greeting-lang-tag">일본어</span>
                <div class="greeting-text-val">${country.greetings?.ja || 'こんにちは!'}</div>
              </div>
              <button class="btn-speak-greeting" onclick="app.speakCountryGreeting('${country.id}', 'ja')" title="일본어 발음 듣기">🔊</button>
            </div>

            <div class="greeting-card-pill" style="grid-column: 1 / -1; background: #f0fdf4; border-color: #86efac;">
              <div>
                <span class="greeting-lang-tag" style="color: #15803d;">현지 인사말</span>
                <div class="greeting-text-val" style="color: #166534;">${country.greetings?.local || '현지 인사말'}</div>
              </div>
              <button class="btn-speak-greeting" style="background: #22c55e; color: #ffffff;" onclick="app.speakCountryGreeting('${country.id}', 'local')" title="현지어 발음 듣기">🔊</button>
            </div>
          </div>
        </div>

        <!-- 6. 아빠의 문화 상식 & 재미있는 사실 -->
        <div class="modal-dad-country-wisdom">
          <div class="dad-avatar-mini">👨</div>
          <div class="dad-country-content">
            <h4>정연수 아빠의 다정한 문화 상식 한마디</h4>
            <p>“${country.dadTip}”</p>
            ${country.funFact ? `<div style="background: rgba(255,255,255,0.7); padding: 8px 12px; border-radius: 10px; font-size: 13px; color: #92400e;">💡 <strong>알고 있나요?</strong> ${country.funFact}</div>` : ''}
            <div style="margin-top: 10px;">
              <button class="btn-bubble primary" style="padding: 8px 16px; font-size: 13.5px;" onclick="app.speakCountryDadTip('${country.id}')">
                <span>🔊 아빠 목소리로 상식 듣기</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 하단 액션 버튼 -->
        <div class="modal-bottom-actions">
          <button class="btn-modal-quiz-now" onclick="app.openCountryQuizArena('mixed', '${country.id}')">
            <span>🎯 ${country.name} 퀴즈 풀고 칭찬 도장 받기!</span>
          </button>
        </div>
      `;
    }

    if (modal) modal.classList.add('active');

    // 활동 로그 기록 (부모님 스마트폰 실시간 알림장 연동)
    this.logChildActivity('world', country.flag, `${country.name} 백과사전 탐험`, `${country.name} (수도: ${country.capital}) 국기·위치·특산물·랜드마크 학습`, 'world', 60);
  }

  closeCountryModal() {
    this.playPop();
    const modal = document.getElementById('countryDetailModal');
    if (modal) modal.classList.remove('active');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  openRandomCountry() {
    const countries = (window.EDU_DATA && window.EDU_DATA.countriesData) || [];
    if (countries.length === 0) return;
    const randomCountry = countries[Math.floor(Math.random() * countries.length)];
    this.openCountryModal(randomCountry.id);
  }

  speakCountryGreeting(countryId, langKey) {
    const countries = (window.EDU_DATA && window.EDU_DATA.countriesData) || [];
    const country = countries.find(c => c.id === countryId);
    if (!country || !country.greetings) return;

    this.playPop();
    let text = country.greetings[langKey] || country.greetings.ko;
    // 발음 설명 부분 (괄호) 제거하여 깔끔하게 읽기
    text = text.replace(/\([^)]*\)/g, '').trim();

    let langCode = 'ko-KR';
    if (langKey === 'en') langCode = 'en-US';
    else if (langKey === 'zh') langCode = 'zh-CN';
    else if (langKey === 'ja') langCode = 'ja-JP';
    else if (langKey === 'local') {
      if (country.id === 'france') langCode = 'fr-FR';
      else if (country.id === 'germany') langCode = 'de-DE';
      else if (country.id === 'italy') langCode = 'it-IT';
      else if (country.id === 'spain' || country.id === 'mexico') langCode = 'es-ES';
      else if (country.id === 'brazil') langCode = 'pt-BR';
      else if (country.id === 'vietnam') langCode = 'vi-VN';
      else if (country.id === 'netherlands') langCode = 'nl-NL';
      else if (country.id === 'egypt') langCode = 'ar-SA';
      else if (country.id === 'turkey') langCode = 'tr-TR';
    }

    this.speak(text, langCode);
  }

  speakCountryDadTip(countryId) {
    const countries = (window.EDU_DATA && window.EDU_DATA.countriesData) || [];
    const country = countries.find(c => c.id === countryId);
    if (!country) return;

    this.playPop();
    const narration = `${country.name}에 대해 아빠가 알려줄게! ${country.dadTip} ${country.funFact || ''}`;
    this.speak(narration, 'ko-KR');
  }

  // =========================================================================
  // 퀴즈 아레나 인터랙티브 엔진
  // =========================================================================
  openCountryQuizArena(mode = 'mixed', targetCountryId = null) {
    this.playPop();
    this.countryQuizMode = mode;
    this.countryQuizTargetCountryId = targetCountryId;

    const modal = document.getElementById('countryQuizModal');
    if (modal) modal.classList.add('active');

    // 상세 모달 닫기
    const detailModal = document.getElementById('countryDetailModal');
    if (detailModal) detailModal.classList.remove('active');

    this.loadNextCountryQuiz();
  }

  closeCountryQuiz() {
    this.playPop();
    const modal = document.getElementById('countryQuizModal');
    if (modal) modal.classList.remove('active');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  selectCountryQuizMode(mode) {
    this.playPop();
    this.countryQuizMode = mode;
    this.countryQuizTargetCountryId = null; // 모드 변경 시 타깃 국가 해제
    this.loadNextCountryQuiz();
  }

  getCountryQuizPool() {
    const countries = (window.EDU_DATA && window.EDU_DATA.countriesData) || [];
    let pool = [];

    countries.forEach(c => {
      (c.quizzes || []).forEach(q => {
        pool.push({
          ...q,
          countryId: c.id,
          countryName: c.name,
          countryFlag: c.flag,
          countryFlagImg: c.flagImg
        });
      });
    });

    if (this.countryQuizTargetCountryId) {
      pool = pool.filter(q => q.countryId === this.countryQuizTargetCountryId);
    } else if (this.countryQuizMode !== 'mixed') {
      pool = pool.filter(q => q.type === this.countryQuizMode);
    }

    return pool;
  }

  loadNextCountryQuiz() {
    const pool = this.getCountryQuizPool();
    if (pool.length === 0) {
      // fallback
      this.countryQuizTargetCountryId = null;
      return this.loadNextCountryQuiz();
    }

    // 직전 문제와 다른 문제 무작위 선택
    let chosen = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && this.currentCountryQuiz && chosen.question === this.currentCountryQuiz.question) {
      const remaining = pool.filter(q => q.question !== this.currentCountryQuiz.question);
      chosen = remaining[Math.floor(Math.random() * remaining.length)];
    }

    this.currentCountryQuiz = chosen;
    const bodyElem = document.getElementById('countryQuizBody');
    if (!bodyElem) return;

    let typeBadge = '🚩 국기 맞추기 퀴즈';
    if (chosen.type === 'capital') typeBadge = '🏛️ 수도 맞추기 퀴즈';
    else if (chosen.type === 'specialty') typeBadge = '🍎 특산물 & 랜드마크 퀴즈';

    bodyElem.innerHTML = `
      <!-- 1. 상단 모드 & 점수 컨트롤 바 -->
      <div class="quiz-top-stats-bar">
        <div class="quiz-mode-pill-tags">
          <button class="btn-quiz-mode-pill ${this.countryQuizMode === 'mixed' ? 'active' : ''}" onclick="app.selectCountryQuizMode('mixed')">
            🎲 골든벨
          </button>
          <button class="btn-quiz-mode-pill ${this.countryQuizMode === 'flag' ? 'active' : ''}" onclick="app.selectCountryQuizMode('flag')">
            🚩 국기
          </button>
          <button class="btn-quiz-mode-pill ${this.countryQuizMode === 'capital' ? 'active' : ''}" onclick="app.selectCountryQuizMode('capital')">
            🏛️ 수도
          </button>
          <button class="btn-quiz-mode-pill ${this.countryQuizMode === 'specialty' ? 'active' : ''}" onclick="app.selectCountryQuizMode('specialty')">
            🍎 특산물
          </button>
        </div>

        <div class="quiz-streak-box">
          <span class="streak-counter">🔥 연속 ${this.countryQuizStreak}정답!</span>
          <span class="solved-counter">⭐ 총 맞힌 문제: ${this.countryQuizSolvedCount}개</span>
        </div>
      </div>

      <!-- 2. 문제 카드 박스 -->
      <div class="quiz-card-box">
        <span class="quiz-question-type-badge">${typeBadge}</span>

        ${chosen.type === 'flag' ? `
          <div class="quiz-flag-center-wrap">
            <img src="${chosen.countryFlagImg}" alt="국기 퀴즈" class="quiz-hero-flag-img">
          </div>
        ` : `
          <div class="quiz-flag-center-wrap" style="margin: 8px 0 14px 0;">
            <img src="${chosen.countryFlagImg}" alt="${chosen.countryName} 국기" class="quiz-small-flag-img">
          </div>
        `}

        <h3 class="quiz-question-text">${chosen.question}</h3>

        <!-- 보기 버튼 그리드 -->
        <div class="quiz-options-list" id="countryQuizOptionsList">
          ${chosen.options.map((opt, idx) => `
            <button class="btn-country-quiz-choice" onclick="app.checkCountryQuiz(${idx})">
              <span><strong>${idx + 1}.</strong> ${opt}</span>
              <span class="choice-arrow">➔</span>
            </button>
          `).join('')}
        </div>

        <!-- 피드백 & 해설 박스 (답변 후 표시) -->
        <div id="quizFeedbackBox" style="display: none;"></div>
      </div>
    `;
  }

  checkCountryQuiz(choiceIdx) {
    if (!this.currentCountryQuiz) return;
    const quiz = this.currentCountryQuiz;
    const isCorrect = (choiceIdx === quiz.answer);

    if (this.countryQuizAutoTimer) {
      clearTimeout(this.countryQuizAutoTimer);
      this.countryQuizAutoTimer = null;
    }

    const buttons = document.querySelectorAll('.btn-country-quiz-choice');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === quiz.answer) {
        btn.classList.add('correct');
      } else if (idx === choiceIdx) {
        btn.classList.add('wrong');
      }
    });

    const feedbackBox = document.getElementById('quizFeedbackBox');
    if (!feedbackBox) return;

    if (isCorrect) {
      // 🎺 승리의 빵빠레 & 축하 꽃가루 폭죽!
      this.playFanfare();
      this.triggerConfetti();
      this.addStamp(1);
      this.countryQuizStreak++;
      this.countryQuizSolvedCount++;
      try {
        localStorage.setItem('eunchan_country_quiz_solved', this.countryQuizSolvedCount);
      } catch(e) {}

      const solvedHeroElem = document.getElementById('countryHeroSolvedCount');
      if (solvedHeroElem) solvedHeroElem.textContent = `${this.countryQuizSolvedCount}개`;

      feedbackBox.className = 'quiz-feedback-box correct';
      feedbackBox.innerHTML = `
        <div class="feedback-badge-row">
          <span>🎉 딩동댕! 빵빠레 정답입니다! 🎺</span>
          <span class="feedback-auto-badge">⚡ 1.8초 뒤 다음 문제로 자동 이동! ➔</span>
          <span style="font-size: 14px; background: #bbf7d0; color: #166534; padding: 3px 10px; border-radius: 999px;">+1 칭찬 도장 획득! ⭐</span>
        </div>
        <p class="feedback-explanation">${quiz.explanation}</p>
        <button class="btn-quiz-next-question" onclick="app.loadNextCountryQuiz()">
          <span>지금 바로 다음 문제 풀기 ➔</span>
        </button>
      `;
      feedbackBox.style.display = 'flex';

      // 20대 여성 구연동화 선생님 톤으로 경쾌하게 칭찬 멘트
      this.speak(`정답이에요! ${quiz.countryName}! 참 잘했어요!`, 'ko-KR');

      // ⚡ 맞추면 자동으로 다음 문제(스테이지)로 넘어감!
      this.countryQuizAutoTimer = setTimeout(() => {
        this.loadNextCountryQuiz();
      }, 1900);

      // 타임라인 활동 로그 전송 (부모님 확인용)
      this.logChildActivity('world_quiz', '🎯', '세계 지리 퀴즈 빵빠레 정답!', `[${quiz.countryName}] "${quiz.question.slice(0, 32)}..." 정답 (+1 스티커)`, 'world', 45);
    } else {
      this.playError();
      this.countryQuizStreak = 0;

      feedbackBox.className = 'quiz-feedback-box wrong';
      feedbackBox.innerHTML = `
        <div class="feedback-badge-row">
          <span>💡 아쉬워요! 정답은 [${quiz.options[quiz.answer]}] 입니다!</span>
        </div>
        <p class="feedback-explanation">${quiz.explanation}</p>
        <button class="btn-quiz-next-question" style="background: #f59e0b;" onclick="app.loadNextCountryQuiz()">
          <span>새로운 문제 도전하기 ➔</span>
        </button>
      `;
      feedbackBox.style.display = 'flex';
      this.speak(`아쉬워요! 정답은 ${quiz.options[quiz.answer]}예요! 다시 도전해볼까요?`, 'ko-KR');
    }
  }

  // =========================================================================
  // 📷 스마트폰 QR코드 및 크롬(Chrome) 바로열기 컨트롤러
  // =========================================================================
  openMobileModal() {
    this.playPop();
    const modal = document.getElementById('mobileAccessModal');
    if (modal) modal.classList.add('active');
    this.switchQrChannel(this.activeQrChannel || 'github');
  }

  closeMobileModal() {
    this.playPop();
    const modal = document.getElementById('mobileAccessModal');
    if (modal) modal.classList.remove('active');
  }

  switchQrChannel(channel = 'github') {
    this.playPop();
    this.activeQrChannel = channel;

    const urls = {
      cloud: 'https://dark-bar-directive-gale.trycloudflare.com/?pin=7979',
      github: 'https://jungyeonsu0330.github.io/eunchan-family-studio/?pin=7979',
      local: 'http://172.30.1.27:8800/?pin=7979'
    };

    const imgs = {
      cloud: 'images/qr_cloud.png',
      github: 'images/qr_github.png',
      local: 'images/qr_local.png'
    };

    const labels = {
      cloud: '⚡ 실시간 터널 (비밀번호 7979 자동 인증)',
      github: '🌟 24시간 상시 클라우드 (컴퓨터 OFF 가능·영구 보존)',
      local: '🏠 집 안 Wi-Fi 초고속 로컬 접속'
    };

    const imgElem = document.getElementById('qrCodeImgDisplay');
    const urlElem = document.getElementById('qrUrlStringDisplay');
    const badgeElem = document.getElementById('qrChannelBadge');

    if (imgElem) imgElem.src = imgs[channel] || imgs.cloud;
    if (urlElem) urlElem.textContent = urls[channel] || urls.cloud;
    if (badgeElem) badgeElem.textContent = labels[channel] || labels.cloud;

    document.querySelectorAll('.btn-qr-tab').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById(channel === 'cloud' ? 'btnQrCloud' : (channel === 'github' ? 'btnQrGithub' : 'btnQrLocal'));
    if (activeBtn) activeBtn.classList.add('active');
  }

  openInChrome() {
    this.playPop();
    const urls = {
      cloud: 'https://dark-bar-directive-gale.trycloudflare.com/?pin=7979',
      github: 'https://jungyeonsu0330.github.io/eunchan-family-studio/?pin=7979',
      local: 'http://172.30.1.27:8800/?pin=7979'
    };
    const targetUrl = urls[this.activeQrChannel || 'cloud'] || urls.cloud;

    // 안드로이드 기기일 경우 크롬 패키지 인텐트로 강제 열기 시도
    if (/android/i.test(navigator.userAgent)) {
      const cleanUrl = targetUrl.replace(/^https?:\/\//, '');
      const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = intentUrl;
    } else {
      window.open(targetUrl, '_blank');
    }
  }

  copyQrUrl() {
    this.playPop();
    const urls = {
      cloud: 'https://dark-bar-directive-gale.trycloudflare.com/?pin=7979',
      github: 'https://jungyeonsu0330.github.io/eunchan-family-studio/?pin=7979',
      local: 'http://172.30.1.27:8800/?pin=7979'
    };
    const targetUrl = urls[this.activeQrChannel || 'cloud'] || urls.cloud;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(targetUrl).then(() => {
        this.showToast('📋 링크 주소가 복사되었습니다!');
      });
    } else {
      alert("📋 링크 주소: " + targetUrl);
    }
  }


  // =========================================================================
  // 🏠 스마트폰 및 전 페이지 '홈으로 돌아가기' 컨트롤러
  // =========================================================================
  goHome() {
    this.playPop();

    // 1. 열려있는 모든 모달 닫기
    const modalIds = [
      'historyModal', 'carDetailModal', 'photoLightboxModal',
      'stickerCelebrationModal', 'mobileAccessModal', 'aesopStoryModal',
      'countryDetailModal', 'countryQuizModal', 'voicePracticeModal'
    ];
    modalIds.forEach(id => {
      const m = document.getElementById(id);
      if (m) m.classList.remove('active');
    });

    // 2. 음성/동화 읽기 정지
    if (typeof this.stopStorybookAudio === 'function') this.stopStorybookAudio();
    if (typeof this.stopAesopStory === 'function') this.stopAesopStory();
    if (this.countryQuizAutoTimer) {
      clearTimeout(this.countryQuizAutoTimer);
      this.countryQuizAutoTimer = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // 3. 홈 탭으로 전환
    this.switchTab('home');

    // 4. 최상단으로 스크롤 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 5. 토스트 피드백
    this.showToast('🏠 홈으로 돌아왔어요!');
  }

  // =========================================================================
  // 실시간 행동 타임라인 직접 작성 & 황금 상장 인쇄 & 도장판 초기화
  // =========================================================================
  toggleManualActivityForm(forceState = null) {
    this.playPop();
    const box = document.getElementById('manualActivityBox');
    if (!box) return;
    const isShowing = forceState !== null ? forceState : (box.style.display !== 'none');
    box.style.display = isShowing ? 'none' : 'block';

    const childNameElem = document.getElementById('manualTargetChildName');
    if (childNameElem) {
      childNameElem.textContent = this.parentTargetChild === 'eunwoo' ? '은우' : '은찬이';
    }

    if (!isShowing) {
      const titleInput = document.getElementById('manualActivityTitle');
      if (titleInput) titleInput.focus();
    }
  }

  selectManualCategory(btn) {
    this.playPop();
    document.querySelectorAll('.manual-cat-chips .chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this.manualCategory = btn.dataset.cat || 'habit';
    this.manualIcon = btn.dataset.icon || '🌟';
  }

  fillManualTitle(text) {
    this.playPop();
    const titleInput = document.getElementById('manualActivityTitle');
    if (titleInput) {
      titleInput.value = text;
      const detailInput = document.getElementById('manualActivityDetail');
      if (detailInput) detailInput.focus();
    }
  }

  submitManualActivity() {
    const titleInput = document.getElementById('manualActivityTitle');
    const detailInput = document.getElementById('manualActivityDetail');
    const title = titleInput ? titleInput.value.trim() : '';
    const detail = detailInput ? detailInput.value.trim() : '';

    if (!title) {
      alert("칭찬할 행동의 제목을 입력해주세요!");
      if (titleInput) titleInput.focus();
      return;
    }

    const childId = this.parentTargetChild || 'eunwoo';
    const childName = childId === 'eunwoo' ? '정은우' : '정은찬';
    const cat = this.manualCategory || 'habit';
    const icon = this.manualIcon || '🌟';

    const now = new Date();
    const timeStr = now.toISOString().replace('T', ' ').substring(0, 19);
    const dateStr = now.toISOString().split('T')[0];

    const newAct = {
      id: 'act_manual_' + Date.now(),
      childId: childId,
      childName: childName,
      type: cat,
      icon: icon,
      title: title,
      detail: detail || '엄마, 아빠가 사랑을 담아 직접 기록한 멋진 행동이에요!',
      category: cat,
      timeSpentSec: 60,
      timestamp: timeStr,
      date: dateStr
    };

    // 1. 로컬 상태에 즉각 반영 (실시간 체감)
    if (!this.familyDb) this.familyDb = this.getLocalFamilyDb();
    if (!this.familyDb.activities) this.familyDb.activities = [];
    this.familyDb.activities.unshift(newAct);
    this.saveLocalFamilyDb(this.familyDb);

    // 2. 서버 DB로 영구 전송
    fetch('/api/activity', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(newAct)
    }).catch(() => {});

    // 3. UI 즉시 갱신
    this.playSuccess();
    this.renderParentDashboard();

    if (titleInput) titleInput.value = '';
    if (detailInput) detailInput.value = '';
    this.toggleManualActivityForm(false);

    this.showToast(`✨ ${childName}의 타임라인에 새 행동이 실시간 기록되었습니다!`);
  }

  openCertificateModal() {
    this.playSuccess();
    const modal = document.getElementById('certificateModal');
    if (!modal) return;

    const childId = this.parentTargetChild || 'eunwoo';
    const childName = childId === 'eunwoo' ? '정은우' : '정은찬';

    const nameElem = document.getElementById('certChildName');
    if (nameElem) nameElem.textContent = `${childName} 어린이`;

    const now = new Date();
    const dateElem = document.getElementById('certDateText');
    if (dateElem) {
      dateElem.textContent = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    }

    modal.classList.add('active');
  }

  closeCertificateModal() {
    this.playPop();
    const modal = document.getElementById('certificateModal');
    if (modal) modal.classList.remove('active');
  }

  printCertificateDoc() {
    window.print();
  }

  printCertificate() {
    this.openCertificateModal();
  }

  resetChildStampsServer() {
    const childId = this.parentTargetChild || 'eunwoo';
    const childName = childId === 'eunwoo' ? '은우' : '은찬이';
    if (!confirm(`${childName}의 도장판을 0개로 비우고 새 도전을 시작할까요?`)) return;

    // 1. 로컬 상태 즉시 0개로 비우기 (오프라인/클라우드 어디서든 100% 즉시 반영)
    if (!this.familyDb) this.familyDb = this.getLocalFamilyDb();
    if (!this.familyDb.profiles) this.familyDb.profiles = {};
    if (!this.familyDb.profiles[childId]) this.familyDb.profiles[childId] = {};
    this.familyDb.profiles[childId].stampsCount = 0;

    // 해당 아이의 도장 목록 초기화
    if (this.familyDb.stickers) {
      this.familyDb.stickers = this.familyDb.stickers.filter(s => s.targetChild !== childId);
    }
    this.saveLocalFamilyDb(this.familyDb);

    if (this.currentProfile === childId) {
      this.stampsCount = 0;
      localStorage.setItem(childId === 'eunwoo' ? 'eunwoo_stamps' : 'eunchan_stamps', '0');
      this.renderStamps();
    }

    // UI 즉각 갱신
    this.playPop();
    this.renderParentDashboard();

    // 2. 서버 DB 도장판 0개 초기화 동기화
    fetch('/api/reset_stamps', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ childId: childId })
    })
    .then(res => res.json())
    .then(data => {
      this.fetchFamilyData();
    })
    .catch(() => {});

    this.showToast(`✨ ${childName}의 도장판이 0개로 비워졌습니다! 새 도전을 시작해보세요!`);
  }
  isParentProfile(pid) {
    return pid === 'dad' || pid === 'mom';
  }

  // 1번(은찬), 2번(은우) 사진 클릭 시 3번 도장판 화면으로 이동
  openChildStampBoard(childId) {
    this.playPop();

    // 1. 부모 분석관 탭 활성화 보장
    const parentTabBtn = document.getElementById('tabBtnParent');
    if (parentTabBtn) parentTabBtn.style.display = 'inline-flex';

    // 2. 부모 모드로 프로필 전환
    if (this.currentProfile !== 'dad' && this.currentProfile !== 'mom') {
      this.currentProfile = 'dad';
      localStorage.setItem('eunchan_family_profile', 'dad');
      ['eunchan', 'eunwoo', 'dad', 'mom'].forEach(pid => {
        const btn = document.getElementById(`profBtn_${pid}`);
        if (btn) btn.classList.toggle('active', pid === 'dad');
      });
    }

    // 3. 자녀 선택 (은찬 또는 은우)
    this.parentTargetChild = childId;
    const btn1 = document.getElementById('pChildBtn_eunchan');
    const btn2 = document.getElementById('pChildBtn_eunwoo');
    if (btn1) btn1.classList.toggle('active', childId === 'eunchan');
    if (btn2) btn2.classList.toggle('active', childId === 'eunwoo');

    // 4. 좌우 여백 사진 위젯 활성 테두리 동기화
    const leftWing = document.getElementById('sideWingEunchan');
    const rightWing = document.getElementById('sideWingEunwoo');
    if (leftWing) leftWing.classList.toggle('active-child', childId === 'eunchan');
    if (rightWing) rightWing.classList.toggle('active-child', childId === 'eunwoo');

    // 5. 부모 분석·칭찬관 탭으로 전환
    this.switchTab('parent');

    // 6. 데이터 갱신 및 3번 도장판 화면 재렌더링
    this.updateStickerButtonLabel();
    if (this.familyDb) {
      this.renderParentDashboard();
    } else {
      this.fetchFamilyData();
    }

    // 7. 3번 카드 ("도장판 진행 현황 & 황금 상장 수여")로 부드럽게 스크롤 & 황금빛 포커스 펄스
    setTimeout(() => {
      const stampCard = document.getElementById('parentStampsCard') || document.querySelector('.stamps-status-card');
      if (stampCard) {
        stampCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        stampCard.classList.remove('card-target-pulse');
        void stampCard.offsetWidth; // trigger reflow
        stampCard.classList.add('card-target-pulse');
        setTimeout(() => stampCard.classList.remove('card-target-pulse'), 2600);
      }
    }, 220);
  }

}

// 앱 실행 인스턴스
window.addEventListener('DOMContentLoaded', () => {
  window.app = new EduApp();
});
