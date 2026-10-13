// ============================================================================
// 🥋⚫⚪ 정연수 아빠와 함께하는 신나는 바둑 & 오목 대국장
// 🧩🔍🌀 집중력 쑥쑥 두뇌 탐험 놀이터 (미로 탈출·틀린그림·은찬이를 찾아라)
// 통합 게임 엔진 (Games Engine)
// ============================================================================

(function() {
  if (typeof window === 'undefined') return;

  // --------------------------------------------------------------------------
  // 1. 착수 사운드 (바둑판에 돌을 놓을 때 울리는 묵직하고 맑은 소리)
  // --------------------------------------------------------------------------
  EduApp.prototype.playStoneSound = function() {
    if (this.isMuted) return;
    try {
      if (!this.audioCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const now = this.audioCtx.currentTime;

      // 1. 나무 통 울림 (깊은 저음 사인파 480Hz -> 130Hz)
      const osc = this.audioCtx.createOscillator();
      const oscGain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      oscGain.gain.setValueAtTime(0.35, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(this.audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.08);

      // 2. 바둑돌 맞닿는 명쾌한 충격음 (고역대 밴드패스 필터링 노이즈)
      const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.035);
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1850, now);
      filter.Q.setValueAtTime(3.2, now);

      const noiseGain = this.audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.28, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.audioCtx.destination);

      noise.start(now);
    } catch(e) {
      if (typeof this.playPop === 'function') this.playPop();
    }
  };

  // --------------------------------------------------------------------------
  // 2. ⚫⚪ 바둑 & 오목 대국장 엔진 (Baduk & Gomoku Arena)
  // --------------------------------------------------------------------------
  EduApp.prototype.initBaduk = function() {
    this.badukGameType = this.badukGameType || 'omok'; // 'omok' | 'baduk'
    this.badukBoardSize = this.badukBoardSize || 9; // 9, 13, 15, 19
    this.badukOpponent = this.badukOpponent || 'pve'; // 'pve' | 'pvp'
    this.badukPlayerColor = this.badukPlayerColor || 'black'; // 'black' | 'white'
    this.badukAiLevel = this.badukAiLevel || 'lv2'; // 'lv1' ~ 'lv5'
    this.badukRule = this.badukRule || 'capture5'; // 'capture5' | 'free'

    if (!this.badukInitialized) {
      this.setupBadukListeners();
      this.badukInitialized = true;
    }

    if (!this.badukBoard || this.badukBoard.length !== this.badukBoardSize) {
      this.resetBadukGame();
    } else {
      this.drawBadukBoard();
      this.updateBadukHUD();
    }
  };

  EduApp.prototype.setupBadukListeners = function() {
    const canvas = document.getElementById('badukCanvas');
    if (!canvas) return;

    canvas.addEventListener('click', (e) => this.handleBadukClick(e));
    canvas.addEventListener('mousemove', (e) => this.handleBadukMouseMove(e));
    canvas.addEventListener('mouseleave', () => {
      this.badukHoverCoord = null;
      this.drawBadukBoard();
    });

    // 모바일 터치 이벤트
    // touchstart에서 막지 않고 touchend에서 "거의 안 움직인 탭"만 착수로 인정한다.
    // (스크롤 제스처는 그대로 통과하고, 탭일 때만 합성 click을 막아 이중 착수를 방지)
    let touchStartPt = null;
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartPt = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else {
        touchStartPt = null;
      }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (!touchStartPt || !e.changedTouches || e.changedTouches.length === 0) return;
      const t = e.changedTouches[0];
      const moved = Math.hypot(t.clientX - touchStartPt.x, t.clientY - touchStartPt.y);
      touchStartPt = null;
      if (moved > 10) return; // 스크롤/드래그로 판단
      if (e.cancelable) e.preventDefault(); // 이어지는 click 방지
      if (!this.canBadukHumanMove()) return;
      const coord = this.getBadukGridCoord(canvas, t.clientX, t.clientY);
      if (coord) {
        this.placeBadukStone(coord.x, coord.y);
      }
    }, { passive: false });

    canvas.addEventListener('touchcancel', () => { touchStartPt = null; }, { passive: true });

    // 윈도우 리사이즈 시 다시 그리기
    window.addEventListener('resize', () => {
      if (this.currentTab === 'baduk') {
        this.drawBadukBoard();
      }
    });
  };

  EduApp.prototype.setBadukGameType = function(type) {
    this.playPop();
    this.badukGameType = type;

    const btnOmok = document.getElementById('btnBadukModeOmok');
    const btnBaduk = document.getElementById('btnBadukModeBaduk');
    if (btnOmok) btnOmok.classList.toggle('active', type === 'omok');
    if (btnBaduk) btnBaduk.classList.toggle('active', type === 'baduk');

    const ruleGroup = document.getElementById('badukRuleTypeGroup');
    if (ruleGroup) ruleGroup.style.display = (type === 'baduk') ? 'flex' : 'none';

    const passBtn = document.getElementById('btnBadukPass');
    if (passBtn) passBtn.style.display = (type === 'baduk') ? 'inline-flex' : 'none';

    // 기본 권장 크기 자동 설정 (오목은 15x15 또는 9x9, 바둑은 9x9)
    if (type === 'omok' && this.badukBoardSize !== 15 && this.badukBoardSize !== 9) {
      this.setBadukBoardSize(15, false);
    } else if (type === 'baduk' && this.badukBoardSize !== 9 && this.badukBoardSize !== 13) {
      this.setBadukBoardSize(9, false);
    } else {
      this.resetBadukGame();
    }
  };

  EduApp.prototype.setBadukBoardSize = function(size, doPlayPop = true) {
    if (doPlayPop) this.playPop();
    this.badukBoardSize = parseInt(size, 10);

    document.querySelectorAll('.btn-baduk-size').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === this.badukBoardSize);
    });

    this.resetBadukGame();
  };

  EduApp.prototype.setBadukPlayerColor = function(color) {
    this.playPop();
    this.badukPlayerColor = color;

    document.querySelectorAll('.btn-baduk-color').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.color === color);
    });

    this.resetBadukGame();
  };

  EduApp.prototype.setBadukOpponent = function(opp) {
    this.playPop();
    this.badukOpponent = opp;

    const btnPve = document.getElementById('btnBadukOppPve');
    const btnPvp = document.getElementById('btnBadukOppPvp');
    if (btnPve) btnPve.classList.toggle('active', opp === 'pve');
    if (btnPvp) btnPvp.classList.toggle('active', opp === 'pvp');

    const aiRow = document.getElementById('badukAiLevelRow') || document.getElementById('badukAiLevelGroup');
    if (aiRow) aiRow.style.display = (opp === 'pve') ? 'flex' : 'none';

    this.resetBadukGame();
  };

  EduApp.prototype.setBadukAiLevel = function(level) {
    this.playPop();
    if (level === 'easy') level = 'lv2';
    if (level === 'normal') level = 'lv3';
    if (level === 'hard') level = 'lv5';
    this.badukAiLevel = level;

    document.querySelectorAll('.btn-baduk-level').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === level);
    });
  };

  EduApp.prototype.setBadukRule = function(rule) {
    this.playPop();
    this.badukRule = rule;

    document.querySelectorAll('.btn-baduk-rule').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.rule === rule);
    });
    this.resetBadukGame();
  };

  EduApp.prototype.resetBadukGame = function() {
    const size = this.badukBoardSize;
    this.badukBoard = Array.from({ length: size }, () => Array(size).fill(0));
    this.badukTurn = 1; // 1: 흑돌 (선공), 2: 백돌 (후공)
    this.badukMoveHistory = [];
    this.badukBlackCaptures = 0;
    this.badukWhiteCaptures = 0;
    this.badukIsGameOver = false;
    this.badukLastMove = null;
    this.badukWinningLine = null;
    this.badukHintCoord = null;
    this.badukHoverCoord = null;
    this.isBadukAiThinking = false;

    this.drawBadukBoard();
    this.updateBadukHUD();

    // 만약 PvE 모드이고 은찬이가 백돌을 골라 AI가 흑돌(선공)인 경우 AI 첫 수 바로 시작!
    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    if (this.badukOpponent === 'pve' && this.badukTurn !== humanStone) {
      this.isBadukAiThinking = true;
      const statusText = document.getElementById('badukTurnStatusText');
      if (statusText) statusText.textContent = '⚫ 흑돌(AI 친구)의 선공 차례예요! AI가 첫 수를 생각하고 있어요...';

      setTimeout(() => {
        this.triggerBadukAiMove();
      }, 600);
    }
  };

  EduApp.prototype.getBadukGridCoord = function(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const size = this.badukBoardSize;
    const displayW = rect.width;
    const displayH = rect.height;
    const margin = Math.max(22, displayW * 0.055);
    const cellSpacing = (displayW - margin * 2) / (size - 1);

    const gx = Math.round((x - margin) / cellSpacing);
    const gy = Math.round((y - margin) / cellSpacing);

    if (gx >= 0 && gx < size && gy >= 0 && gy < size) {
      const targetX = margin + gx * cellSpacing;
      const targetY = margin + gy * cellSpacing;
      const dist = Math.hypot(x - targetX, y - targetY);
      if (dist <= cellSpacing * 0.48) {
        return { x: gx, y: gy };
      }
    }
    return null;
  };

  EduApp.prototype.handleBadukMouseMove = function(e) {
    if (this.badukIsGameOver || this.isBadukAiThinking) return;
    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    if (this.badukOpponent === 'pve' && this.badukTurn !== humanStone) return;

    const canvas = document.getElementById('badukCanvas');
    if (!canvas) return;

    const coord = this.getBadukGridCoord(canvas, e.clientX, e.clientY);
    if (!coord) {
      if (this.badukHoverCoord) {
        this.badukHoverCoord = null;
        this.drawBadukBoard();
      }
      return;
    }

    if (!this.badukHoverCoord || this.badukHoverCoord.x !== coord.x || this.badukHoverCoord.y !== coord.y) {
      this.badukHoverCoord = coord;
      this.drawBadukBoard();
    }
  };

  EduApp.prototype.canBadukHumanMove = function() {
    if (this.badukIsGameOver || this.isBadukAiThinking) return false;
    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    if (this.badukOpponent === 'pve' && this.badukTurn !== humanStone) return false;
    return true;
  };

  EduApp.prototype.handleBadukClick = function(e) {
    if (!this.canBadukHumanMove()) return;

    const canvas = document.getElementById('badukCanvas');
    if (!canvas) return;

    const coord = this.getBadukGridCoord(canvas, e.clientX, e.clientY);
    if (coord) {
      this.placeBadukStone(coord.x, coord.y);
    }
  };

  EduApp.prototype.placeBadukStone = function(gx, gy) {
    if (this.badukIsGameOver) return false;
    if (this.badukBoard[gy][gx] !== 0) return false;

    const currentPlayer = this.badukTurn;
    const opponent = 3 - currentPlayer;

    // 바둑 규칙 검증 (자충수 및 따먹기)
    let capturedStones = [];
    if (this.badukGameType === 'baduk') {
      // 1. 임시 착수
      const testBoard = this.badukBoard.map(row => [...row]);
      testBoard[gy][gx] = currentPlayer;

      // 2. 인접한 상대 돌들의 활로가 0이 되어 잡히는지 확인
      const neighbors = [
        { x: gx + 1, y: gy }, { x: gx - 1, y: gy },
        { x: gx, y: gy + 1 }, { x: gx, y: gy - 1 }
      ];

      neighbors.forEach(n => {
        if (n.x >= 0 && n.x < this.badukBoardSize && n.y >= 0 && n.y < this.badukBoardSize) {
          if (testBoard[n.y][n.x] === opponent) {
            const chain = this.getBadukChainAndLiberties(n.x, n.y, testBoard);
            if (chain.liberties.length === 0) {
              chain.stones.forEach(s => {
                if (!capturedStones.some(cs => cs.x === s.x && cs.y === s.y)) {
                  capturedStones.push(s);
                }
              });
            }
          }
        }
      });

      // 3. 상대 돌을 잡지 못했을 때, 자기 자신의 활로가 0이면 자충수(착수 금지)
      if (capturedStones.length === 0) {
        const selfChain = this.getBadukChainAndLiberties(gx, gy, testBoard);
        if (selfChain.liberties.length === 0) {
          this.playBeep(260, 'sawtooth', 0.15, 0.2);
          const statusText = document.getElementById('badukTurnStatusText');
          if (statusText) {
            statusText.textContent = '⚠️ 이곳은 숨구멍(활로)이 없어 둘 수 없는 착수금지점이에요!';
            setTimeout(() => this.updateBadukHUD(), 2000);
          }
          return false;
        }
      }

      // 4. 패(Ko) 규칙 검증: 1수 전 상태로 바로 되돌아가는지 확인
      if (capturedStones.length === 1 && this.badukMoveHistory.length >= 2) {
        const prevMove = this.badukMoveHistory[this.badukMoveHistory.length - 1];
        if (prevMove.captures && prevMove.captures.length === 1) {
          const cap = prevMove.captures[0];
          if (prevMove.x === capturedStones[0].x && prevMove.y === capturedStones[0].y &&
              cap.x === gx && cap.y === gy) {
            this.playBeep(260, 'sawtooth', 0.15, 0.2);
            const statusText = document.getElementById('badukTurnStatusText');
            if (statusText) {
              statusText.textContent = '⚠️ 패(Ko) 규칙이에요! 다른 곳에 먼저 한 수 둔 뒤에 잡을 수 있어요!';
              setTimeout(() => this.updateBadukHUD(), 2200);
            }
            return false;
          }
        }
      }
    }

    // 착수 실행
    this.badukBoard[gy][gx] = currentPlayer;
    this.badukLastMove = { x: gx, y: gy, player: currentPlayer };
    this.badukHintCoord = null;
    this.badukHoverCoord = null;
    this.playStoneSound();

    // 바둑 따먹은 돌 제거 및 점수 반영
    if (capturedStones.length > 0) {
      capturedStones.forEach(s => {
        this.badukBoard[s.y][s.x] = 0;
      });
      if (currentPlayer === 1) {
        this.badukBlackCaptures += capturedStones.length;
      } else {
        this.badukWhiteCaptures += capturedStones.length;
      }
      this.playSuccess();
    }

    // 수순 기록
    this.badukMoveHistory.push({
      x: gx,
      y: gy,
      player: currentPlayer,
      captures: capturedStones
    });

    // 승리 판정
    if (this.badukGameType === 'omok') {
      const winLine = this.checkOmokWin(gx, gy, currentPlayer);
      if (winLine) {
        this.badukIsGameOver = true;
        this.badukWinningLine = winLine;
        this.handleGameWin(currentPlayer, '오목 5목 완성!');
        this.drawBadukBoard();
        this.updateBadukHUD();
        return true;
      }
    } else {
      // 바둑 모드
      if (this.badukRule === 'capture5') {
        if (this.badukBlackCaptures >= 5) {
          this.badukIsGameOver = true;
          this.handleGameWin(1, '바둑돌 5개 먼저 따먹기 성공!');
          this.drawBadukBoard();
          this.updateBadukHUD();
          return true;
        } else if (this.badukWhiteCaptures >= 5) {
          this.badukIsGameOver = true;
          this.handleGameWin(2, '바둑돌 5개 먼저 따먹기 성공!');
          this.drawBadukBoard();
          this.updateBadukHUD();
          return true;
        }
      }
    }

    // 턴 전환
    this.badukTurn = opponent;
    this.drawBadukBoard();
    this.updateBadukHUD();

    // AI 모드이고 AI 턴이면 AI 착수 발동
    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    const aiStone = 3 - humanStone;
    if (!this.badukIsGameOver && this.badukOpponent === 'pve' && this.badukTurn === aiStone) {
      this.isBadukAiThinking = true;
      const statusText = document.getElementById('badukTurnStatusText');
      if (statusText) {
        const aiStoneName = (aiStone === 1) ? '⚫ 흑돌' : '⚪ 백돌';
        statusText.textContent = `🤖 똑똑한 AI(${aiStoneName})가 다음 착수점을 생각 중이에요...`;
      }

      setTimeout(() => {
        this.triggerBadukAiMove();
      }, 500);
    }

    return true;
  };

  // --------------------------------------------------------------------------
  // 바둑 활로 & 체인 탐색 알고리즘 (BFS)
  // --------------------------------------------------------------------------
  EduApp.prototype.getBadukChainAndLiberties = function(startX, startY, board) {
    const size = this.badukBoardSize;
    const player = board[startY][startX];
    const queue = [{ x: startX, y: startY }];
    const visited = Array.from({ length: size }, () => Array(size).fill(false));
    visited[startY][startX] = true;

    const stones = [];
    const libertiesSet = new Set();

    while (queue.length > 0) {
      const cur = queue.shift();
      stones.push(cur);

      const dirs = [
        { x: cur.x + 1, y: cur.y }, { x: cur.x - 1, y: cur.y },
        { x: cur.x, y: cur.y + 1 }, { x: cur.x, y: cur.y - 1 }
      ];

      dirs.forEach(d => {
        if (d.x >= 0 && d.x < size && d.y >= 0 && d.y < size) {
          if (board[d.y][d.x] === 0) {
            libertiesSet.add(`${d.x},${d.y}`);
          } else if (board[d.y][d.x] === player && !visited[d.y][d.x]) {
            visited[d.y][d.x] = true;
            queue.push(d);
          }
        }
      });
    }

    const liberties = Array.from(libertiesSet).map(s => {
      const [lx, ly] = s.split(',').map(Number);
      return { x: lx, y: ly };
    });

    return { stones, liberties };
  };

  // --------------------------------------------------------------------------
  // 오목 5목 연속 승리 체크
  // --------------------------------------------------------------------------
  EduApp.prototype.checkOmokWin = function(gx, gy, player) {
    const size = this.badukBoardSize;
    const board = this.badukBoard;
    const directions = [
      { dx: 1, dy: 0 },  // 가로
      { dx: 0, dy: 1 },  // 세로
      { dx: 1, dy: 1 },  // 대각선 ↘
      { dx: 1, dy: -1 }  // 대각선 ↗
    ];

    for (const dir of directions) {
      let count = 1;
      const lineStones = [{ x: gx, y: gy }];

      // 정방향 탐색
      let step = 1;
      while (true) {
        const nx = gx + dir.dx * step;
        const ny = gy + dir.dy * step;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === player) {
          count++;
          lineStones.push({ x: nx, y: ny });
          step++;
        } else {
          break;
        }
      }

      // 역방향 탐색
      step = 1;
      while (true) {
        const nx = gx - dir.dx * step;
        const ny = gy - dir.dy * step;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] === player) {
          count++;
          lineStones.unshift({ x: nx, y: ny });
          step++;
        } else {
          break;
        }
      }

      if (count >= 5) {
        return lineStones;
      }
    }
    return null;
  };

  // --------------------------------------------------------------------------
  // 승리 축하 처리
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // 승리 축하 처리
  // --------------------------------------------------------------------------
  EduApp.prototype.handleGameWin = function(winnerPlayer, reason) {
    this.playFanfare();
    this.triggerConfetti();

    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    const isHumanWinner = (winnerPlayer === humanStone);
    const winnerColor = (winnerPlayer === 1) ? '흑돌' : '백돌';

    let winnerName = '';
    if (isHumanWinner) {
      winnerName = `은찬이(${winnerColor})`;
    } else {
      const oppName = (this.badukOpponent === 'pve') ? 'AI 친구' : '아빠';
      winnerName = `${oppName}(${winnerColor})`;
    }

    const msg = `🎉 축하합니다! ${winnerName}의 멋진 승리! (${reason})`;

    const statusText = document.getElementById('badukTurnStatusText');
    if (statusText) statusText.textContent = msg;

    if (isHumanWinner) {
      this.speak('와아! 은찬이가 멋진 지혜로 대국에서 승리했어요! 아빠가 너무너무 자랑스러워!', 'ko-KR');
    }
  };

  // --------------------------------------------------------------------------
  // AI 착수 엔진 (오목 & 바둑)
  // --------------------------------------------------------------------------
  EduApp.prototype.triggerBadukAiMove = function() {
    if (this.badukIsGameOver) return;
    this.isBadukAiThinking = false;

    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    const aiStone = 3 - humanStone;

    let bestMove = null;
    if (this.badukGameType === 'omok') {
      bestMove = this.computeBestOmokMove(aiStone, this.badukAiLevel);
    } else {
      bestMove = this.computeBestBadukMove(aiStone, this.badukAiLevel);
    }

    if (bestMove) {
      this.placeBadukStone(bestMove.x, bestMove.y);
    } else {
      // 둘 곳이 없거나 패스
      this.passBadukMove();
    }
  };

  // --------------------------------------------------------------------------
  // 오목 AI 착수 계산 (5단계 난이도)
  // lv1: 병아리(입문, 실수율 65%), lv2: 토끼(쉬움, 35%), lv3: 호랑이(보통, 18%), lv4: 사자(어려움, 5%), lv5: 알파고(최강, 0%)
  // --------------------------------------------------------------------------
  EduApp.prototype.computeBestOmokMove = function(aiPlayer, level) {
    if (level === 'easy') level = 'lv2';
    if (level === 'normal') level = 'lv3';
    if (level === 'hard') level = 'lv5';
    level = level || 'lv2';

    const size = this.badukBoardSize;
    const board = this.badukBoard;
    const humanPlayer = 3 - aiPlayer;

    const candidates = [];
    const directions = [
      { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 }, { dx: 1, dy: -1 }
    ];

    let immediateAiWin = null;
    let immediateHumanWin = null;

    // 빈 칸 가치 평가
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] !== 0) continue;

        // 돌 인접성 확인 (판에 돌이 있을 경우 2칸 이내에 돌이 없으면 스킵)
        let hasNeighbor = false;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const ny = y + dy;
            const nx = x + dx;
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && board[ny][nx] !== 0) {
              hasNeighbor = true;
              break;
            }
          }
          if (hasNeighbor) break;
        }
        if (!hasNeighbor && this.badukMoveHistory.length > 0) continue;

        // 중앙과의 거리 보너스
        const centerDist = Math.hypot(x - (size - 1) / 2, y - (size - 1) / 2);
        let score = (size - centerDist) * 3;

        let aiAttack = 0;
        let humanDefense = 0;
        let aiFours = 0;
        let aiThrees = 0;
        let humanFours = 0;
        let humanThrees = 0;

        for (const dir of directions) {
          const aEval = this.evalOmokLineDetailed(x, y, dir, aiPlayer);
          const hEval = this.evalOmokLineDetailed(x, y, dir, humanPlayer);

          aiAttack += aEval.score;
          humanDefense += hEval.score;

          if (aEval.count >= 5) immediateAiWin = { x, y, score: 5000000 };
          if (hEval.count >= 5 && !immediateHumanWin) immediateHumanWin = { x, y, score: 3000000 };

          if (aEval.count === 4) aiFours++;
          if (aEval.count === 3 && aEval.openEnds === 2) aiThrees++;
          if (hEval.count === 4) humanFours++;
          if (hEval.count === 3 && hEval.openEnds === 2) humanThrees++;
        }

        // 공격 가중치와 수비 가중치
        let atkWeight = (level === 'lv4' || level === 'lv5') ? 1.25 : 1.1;
        let defWeight = (level === 'lv1') ? 0.6 : 1.0;
        score += aiAttack * atkWeight + humanDefense * defWeight;

        // 복합 위협(3-3, 4-3, 4-4) 보너스 (레벨 3 이상)
        if (level !== 'lv1') {
          if (aiFours >= 2 || (aiFours >= 1 && aiThrees >= 1)) score += 60000;
          if (aiThrees >= 2) score += 35000;
          if (humanFours >= 2 || (humanFours >= 1 && humanThrees >= 1)) score += 50000;
          if (humanThrees >= 2) score += 25000;
        }

        candidates.push({ x, y, score, aiAttack, humanDefense });
      }
    }

    if (candidates.length === 0) {
      return { x: Math.floor(size / 2), y: Math.floor(size / 2) };
    }

    candidates.sort((a, b) => b.score - a.score);

    // 난이도별 착수 결정
    // 1단계 병아리 (입문): 아이들이 신나게 이길 수 있도록 실수율 65%
    if (level === 'lv1') {
      if (immediateAiWin && Math.random() < 0.6) return immediateAiWin;
      if (immediateHumanWin && Math.random() < 0.35) return immediateHumanWin;
      if (Math.random() < 0.65 && candidates.length > 3) {
        const pick = Math.min(candidates.length - 1, 3 + Math.floor(Math.random() * 5));
        return candidates[pick];
      }
      return candidates[Math.min(candidates.length - 1, Math.floor(Math.random() * 3))];
    }

    // 2단계 토끼 (쉬움): 5목 완성은 100% 두지만 상대 4목 방어 70%, 실수율 35%
    if (level === 'lv2') {
      if (immediateAiWin) return immediateAiWin;
      if (immediateHumanWin && Math.random() < 0.75) return immediateHumanWin;
      if (Math.random() < 0.35 && candidates.length > 2) {
        const pick = Math.min(candidates.length - 1, 1 + Math.floor(Math.random() * 3));
        return candidates[pick];
      }
      return candidates[0];
    }

    // 3단계 호랑이 (보통): 5목 및 4목 방어 100%, 3목 방어 85%, 가끔 2위 선택
    if (level === 'lv3') {
      if (immediateAiWin) return immediateAiWin;
      if (immediateHumanWin) return immediateHumanWin;
      if (Math.random() < 0.18 && candidates.length > 1) {
        return candidates[1];
      }
      return candidates[0];
    }

    // 4단계 사자 (어려움): 공격적 3-3, 4-3 생성, 방어율 100%, 실수율 5%
    if (level === 'lv4') {
      if (immediateAiWin) return immediateAiWin;
      if (immediateHumanWin) return immediateHumanWin;
      if (Math.random() < 0.05 && candidates.length > 1) {
        return candidates[1];
      }
      return candidates[0];
    }

    // 5단계 알파고 (최강): 실수 0%, 최적 착수점 선택
    if (immediateAiWin) return immediateAiWin;
    if (immediateHumanWin) return immediateHumanWin;
    return candidates[0];
  };

  EduApp.prototype.evalOmokLineDetailed = function(x, y, dir, player) {
    const size = this.badukBoardSize;
    const board = this.badukBoard;
    let count = 1;
    let openEnds = 0;

    // + 방향
    let step = 1;
    while (true) {
      const nx = x + dir.dx * step;
      const ny = y + dir.dy * step;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (board[ny][nx] === player) {
          count++;
          step++;
        } else if (board[ny][nx] === 0) {
          openEnds++;
          break;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    // - 방향
    step = 1;
    while (true) {
      const nx = x - dir.dx * step;
      const ny = y - dir.dy * step;
      if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
        if (board[ny][nx] === player) {
          count++;
          step++;
        } else if (board[ny][nx] === 0) {
          openEnds++;
          break;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    let score = count * 50;
    if (count >= 5) score = 2000000;
    else if (count === 4 && openEnds === 2) score = 400000;
    else if (count === 4 && openEnds === 1) score = 60000;
    else if (count === 3 && openEnds === 2) score = 25000;
    else if (count === 3 && openEnds === 1) score = 3000;
    else if (count === 2 && openEnds === 2) score = 1200;

    return { count, openEnds, score };
  };

  // 기존 호환용 메서드
  EduApp.prototype.evalOmokLine = function(x, y, dir, player) {
    return this.evalOmokLineDetailed(x, y, dir, player).score;
  };

  // --------------------------------------------------------------------------
  // 바둑 AI 착수 계산 (5단계 난이도)
  // lv1: 병아리(입문, 60% 무작위), lv2: 토끼(쉬움, 35%), lv3: 호랑이(보통, 18%), lv4: 사자(어려움, 5%), lv5: 알파고(최강, 0%)
  // --------------------------------------------------------------------------
  EduApp.prototype.computeBestBadukMove = function(aiPlayer, level) {
    if (level === 'easy') level = 'lv2';
    if (level === 'normal') level = 'lv3';
    if (level === 'hard') level = 'lv5';
    level = level || 'lv2';

    const size = this.badukBoardSize;
    const board = this.badukBoard;
    const opponent = 3 - aiPlayer;
    const validMoves = [];

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (board[y][x] !== 0) continue;

        // 가상 착수
        const testBoard = board.map(row => [...row]);
        testBoard[y][x] = aiPlayer;

        // 1. 상대 돌을 잡을 수 있는지? (포획)
        let captures = 0;
        const neighbors = [
          { x: x + 1, y: y }, { x: x - 1, y: y },
          { x: x, y: y + 1 }, { x: x, y: y - 1 }
        ];

        neighbors.forEach(n => {
          if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size && testBoard[n.y][n.x] === opponent) {
            const chain = this.getBadukChainAndLiberties(n.x, n.y, testBoard);
            if (chain.liberties.length === 0) {
              captures += chain.stones.length;
            }
          }
        });

        // 2. 자충수 체크
        const selfChain = this.getBadukChainAndLiberties(x, y, testBoard);
        if (captures === 0 && selfChain.liberties.length === 0) {
          continue; // 자충수 배제
        }

        // 3. 내 위기 돌 구출(활로 1개인 돌 연결하여 활로 늘리기)
        let savedStones = 0;
        if (captures === 0) {
          const oldSelfNeighbors = neighbors.filter(n =>
            n.x >= 0 && n.x < size && n.y >= 0 && n.y < size && board[n.y][n.x] === aiPlayer
          );
          oldSelfNeighbors.forEach(n => {
            const oldChain = this.getBadukChainAndLiberties(n.x, n.y, board);
            if (oldChain.liberties.length === 1 && selfChain.liberties.length >= 2) {
              savedStones += oldChain.stones.length;
            }
          });
        }

        // 4. 상대 돌 단수(활로 1개로 줄이기) 압박
        let atariOpponents = 0;
        neighbors.forEach(n => {
          if (n.x >= 0 && n.x < size && n.y >= 0 && n.y < size && testBoard[n.y][n.x] === opponent) {
            const oppChain = this.getBadukChainAndLiberties(n.x, n.y, testBoard);
            if (oppChain.liberties.length === 1) {
              atariOpponents += oppChain.stones.length;
            }
          }
        });

        let score = captures * 600;
        score += savedStones * 500;
        score += atariOpponents * 180;
        score += selfChain.liberties.length * 35;

        // 자충수성 위험 수(활로가 1개뿐인 채로 남는 경우) 페널티
        if (captures === 0 && selfChain.liberties.length === 1) {
          score -= 400;
        }

        // 화점 및 귀, 변 보너스
        if ((x === 2 || x === size - 3) && (y === 2 || y === size - 3)) score += 60;
        if (x === Math.floor(size / 2) && y === Math.floor(size / 2)) score += 50;

        validMoves.push({ x, y, score, captures, savedStones });
      }
    }

    if (validMoves.length === 0) return null;

    validMoves.sort((a, b) => b.score - a.score);

    // 5단계 난이도 적용
    if (level === 'lv1') {
      // 60% 확률로 무작위 안전 착수 (아이들이 쉽게 돌을 잡을 수 있음)
      if (Math.random() < 0.6 && validMoves.length > 2) {
        const pick = Math.floor(Math.random() * Math.min(validMoves.length, 6));
        return validMoves[pick];
      }
      return validMoves[0];
    } else if (level === 'lv2') {
      // 35% 확률로 2~4위 착수
      if (Math.random() < 0.35 && validMoves.length > 2) {
        const pick = Math.floor(Math.random() * Math.min(validMoves.length, 4));
        return validMoves[pick];
      }
      return validMoves[0];
    } else if (level === 'lv3') {
      // 18% 확률로 2위 착수
      if (Math.random() < 0.18 && validMoves.length > 1) {
        return validMoves[1];
      }
      return validMoves[0];
    } else if (level === 'lv4') {
      // 5% 확률로 2위 착수
      if (Math.random() < 0.05 && validMoves.length > 1) {
        return validMoves[1];
      }
      return validMoves[0];
    }

    // lv5 알파고: 최고 득점 수 100% 선택
    return validMoves[0];
  };

  EduApp.prototype.undoBadukMove = function() {
    if (this.badukMoveHistory.length === 0 || this.badukIsGameOver || this.isBadukAiThinking) return;
    this.playPop();

    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    let undoCount = 1;
    if (this.badukOpponent === 'pve') {
      // PvE 모드: 플레이어 턴으로 돌아올 때까지 무르기 (기본 2수, 착수 수가 1수면 1수)
      if (this.badukTurn === humanStone && this.badukMoveHistory.length >= 2) {
        undoCount = 2;
      } else {
        undoCount = 1;
      }
    }

    for (let i = 0; i < undoCount; i++) {
      if (this.badukMoveHistory.length === 0) break;
      const last = this.badukMoveHistory.pop();
      this.badukBoard[last.y][last.x] = 0;

      // 잡혔던 돌들 복구
      if (last.captures && last.captures.length > 0) {
        const oppColor = 3 - last.player;
        last.captures.forEach(c => {
          this.badukBoard[c.y][c.x] = oppColor;
        });
        if (last.player === 1) {
          this.badukBlackCaptures -= last.captures.length;
        } else {
          this.badukWhiteCaptures -= last.captures.length;
        }
      }
      this.badukTurn = last.player;
    }

    this.badukLastMove = this.badukMoveHistory.length > 0 ? this.badukMoveHistory[this.badukMoveHistory.length - 1] : null;
    this.badukWinningLine = null;
    this.badukHintCoord = null;
    this.badukHoverCoord = null;
    this.isBadukAiThinking = false;

    this.drawBadukBoard();
    this.updateBadukHUD();

    // 만약 은찬이가 백돌인데 수를 다 물러서 첫 수(AI 흑돌 턴)가 된 경우 AI 다시 착수
    if (this.badukOpponent === 'pve' && this.badukTurn !== humanStone && !this.badukIsGameOver) {
      this.isBadukAiThinking = true;
      setTimeout(() => this.triggerBadukAiMove(), 500);
    }
  };

  EduApp.prototype.showBadukHint = function() {
    if (this.badukIsGameOver || this.isBadukAiThinking) return;
    this.playPop();

    let hint = null;
    if (this.badukGameType === 'omok') {
      hint = this.computeBestOmokMove(this.badukTurn, 'lv5');
    } else {
      hint = this.computeBestBadukMove(this.badukTurn, 'lv5');
    }

    if (hint) {
      this.badukHintCoord = hint;
      this.drawBadukBoard();
      const statusText = document.getElementById('badukTurnStatusText');
      if (statusText) {
        statusText.textContent = `💡 아빠 AI 팁: 반짝이는 별표 위치(${hint.x + 1}, ${hint.y + 1})를 눈여겨보세요!`;
      }
    }
  };

  EduApp.prototype.passBadukMove = function() {
    if (this.badukIsGameOver || this.isBadukAiThinking) return;
    this.playPop();
    this.badukTurn = 3 - this.badukTurn;
    const statusText = document.getElementById('badukTurnStatusText');
    if (statusText) statusText.textContent = '🏳️ 한 수를 쉬었습니다. 상대방 차례예요!';
    this.updateBadukHUD();
    this.drawBadukBoard();

    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    if (this.badukOpponent === 'pve' && this.badukTurn !== humanStone) {
      setTimeout(() => this.triggerBadukAiMove(), 500);
    }
  };

  EduApp.prototype.openBadukRulesModal = function() {
    this.playPop();
    const modal = document.getElementById('badukRulesModal');
    if (modal) modal.style.display = 'flex';
  };

  EduApp.prototype.closeBadukRulesModal = function() {
    this.playPop();
    const modal = document.getElementById('badukRulesModal');
    if (modal) modal.style.display = 'none';
  };

  EduApp.prototype.updateBadukHUD = function() {
    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    const oppStone = 3 - humanStone;

    const cardP1 = document.getElementById('badukPlayerBlackCard') || document.getElementById('badukPlayer1Card');
    const cardP2 = document.getElementById('badukPlayerWhiteCard') || document.getElementById('badukPlayer2Card');
    const p1Avatar = document.getElementById('player1StoneAvatar');
    const p2Avatar = document.getElementById('player2StoneAvatar');
    const p1Name = document.getElementById('player1NameText');
    const p2Name = document.getElementById('whitePlayerNameText');
    const p2AvatarBox = document.getElementById('whitePlayerAvatarBox');
    const p1Pill = document.getElementById('blackTurnPill');
    const p2Pill = document.getElementById('whiteTurnPill');
    const moveBadge = document.getElementById('badukMoveBadge');
    const statusText = document.getElementById('badukTurnStatusText');
    const p1CaptureLabel = document.getElementById('player1CaptureLabel');
    const p2CaptureLabel = document.getElementById('player2CaptureLabel');
    const blackScore = document.getElementById('blackCaptureCount');
    const whiteScore = document.getElementById('whiteCaptureCount');

    // 스톤 색상 아바타 업데이트
    if (p1Avatar) {
      p1Avatar.className = `bplayer-stone ${humanStone === 1 ? 'black-stone-avatar' : 'white-stone-avatar'}`;
    }
    if (p2Avatar) {
      p2Avatar.className = `bplayer-stone ${oppStone === 1 ? 'black-stone-avatar' : 'white-stone-avatar'}`;
    }

    // 이름 텍스트 업데이트
    if (p1Name) {
      p1Name.textContent = `👦 은찬이 (${humanStone === 1 ? '흑돌' : '백돌'})`;
    }
    const oppName = (this.badukOpponent === 'pve') ? '똑똑한 AI' : '아빠';
    if (p2Name) {
      p2Name.textContent = `${this.badukOpponent === 'pve' ? '🤖' : '👨'} ${oppName} (${oppStone === 1 ? '흑돌' : '백돌'})`;
    }
    if (p2AvatarBox) {
      p2AvatarBox.textContent = (this.badukOpponent === 'pve') ? '🤖' : '👨';
    }

    // 따먹은 돌 표시
    const p1Score = (humanStone === 1) ? this.badukBlackCaptures : this.badukWhiteCaptures;
    const p2Score = (oppStone === 1) ? this.badukBlackCaptures : this.badukWhiteCaptures;
    if (blackScore) blackScore.textContent = p1Score;
    if (whiteScore) whiteScore.textContent = p2Score;
    if (p1CaptureLabel) {
      const targetName = (humanStone === 1) ? '백돌' : '흑돌';
      p1CaptureLabel.innerHTML = `따먹은 ${targetName}: <strong id="blackCaptureCount" class="score-highlight">${p1Score}</strong>개`;
    }
    if (p2CaptureLabel) {
      const targetName = (oppStone === 1) ? '백돌' : '흑돌';
      p2CaptureLabel.innerHTML = `따먹은 ${targetName}: <strong id="whiteCaptureCount" class="score-highlight">${p2Score}</strong>개`;
    }

    if (moveBadge) moveBadge.textContent = `제 ${this.badukMoveHistory.length + 1} 수`;

    const isHumanTurn = (this.badukTurn === humanStone);
    if (cardP1) cardP1.classList.toggle('active', isHumanTurn);
    if (cardP2) cardP2.classList.toggle('active', !isHumanTurn);
    if (p1Pill) p1Pill.style.display = isHumanTurn ? 'inline-block' : 'none';
    if (p2Pill) p2Pill.style.display = !isHumanTurn ? 'inline-block' : 'none';

    if (!this.badukIsGameOver && statusText && !this.isBadukAiThinking) {
      const turnStoneName = (this.badukTurn === 1) ? '⚫ 흑돌' : '⚪ 백돌';
      if (isHumanTurn) {
        statusText.textContent = (this.badukGameType === 'omok')
          ? `${turnStoneName}(은찬이) 차례예요! 5목을 향해 돌을 놓아보세요.`
          : `${turnStoneName}(은찬이) 차례예요! 상대 돌의 활로를 막아 따먹어보세요.`;
      } else {
        statusText.textContent = `${turnStoneName}(${oppName}) 차례예요!`;
      }
    }
  };

  // --------------------------------------------------------------------------
  // 바둑판 캔버스 렌더링 (천연 원목 텍스처 & 3D 볼록 바둑돌)
  // --------------------------------------------------------------------------
  EduApp.prototype.drawBadukBoard = function() {
    const canvas = document.getElementById('badukCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = document.getElementById('badukBoardContainer');
    const containerWidth = container ? container.clientWidth : 600;
    const targetSize = Math.max(300, Math.min(containerWidth - 32, 580));

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = targetSize + 'px';
    canvas.style.height = targetSize + 'px';
    canvas.width = targetSize * dpr;
    canvas.height = targetSize * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    const size = this.badukBoardSize;
    const margin = Math.max(22, targetSize * 0.055);
    const boardArea = targetSize - margin * 2;
    const cellSpacing = boardArea / (size - 1);
    const stoneRadius = cellSpacing * 0.44;

    // 1. 원목 바탕 칠하기
    const woodGrad = ctx.createLinearGradient(0, 0, targetSize, targetSize);
    woodGrad.addColorStop(0, '#f2be7e');
    woodGrad.addColorStop(0.5, '#e0a969');
    woodGrad.addColorStop(1, '#cb9352');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(0, 0, targetSize, targetSize);

    // 은은한 나뭇결 무늬 선
    ctx.strokeStyle = 'rgba(160, 95, 30, 0.08)';
    ctx.lineWidth = 1.5;
    for (let gx = 0; gx < targetSize; gx += 14) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx + 6, targetSize);
      ctx.stroke();
    }

    // 2. 바둑판 격자선 그리기
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.1;

    for (let i = 0; i < size; i++) {
      const pos = margin + i * cellSpacing;

      // 가로선
      ctx.beginPath();
      ctx.moveTo(margin, pos);
      ctx.lineTo(targetSize - margin, pos);
      ctx.stroke();

      // 세로선
      ctx.beginPath();
      ctx.moveTo(pos, margin);
      ctx.lineTo(pos, targetSize - margin);
      ctx.stroke();
    }

    // 3. 좌표 라벨 표시 (A-T, 1-19)
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const colLetters = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
    for (let i = 0; i < size; i++) {
      const pos = margin + i * cellSpacing;
      const letter = colLetters[i] || (i + 1);
      // 상단 & 하단 영문 라벨
      ctx.fillText(letter, pos, margin * 0.42);
      ctx.fillText(letter, pos, targetSize - margin * 0.42);
      // 좌측 & 우측 숫자 라벨
      ctx.fillText(size - i, margin * 0.45, pos);
      ctx.fillText(size - i, targetSize - margin * 0.45, pos);
    }

    // 4. 화점(별점) 그리기
    const starPoints = this.getStarPoints(size);
    ctx.fillStyle = '#451a03';
    starPoints.forEach(sp => {
      const sx = margin + sp.x * cellSpacing;
      const sy = margin + sp.y * cellSpacing;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(2.8, cellSpacing * 0.08), 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. 착수된 바둑돌 그리기
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const val = this.badukBoard[y][x];
        if (val !== 0) {
          const cx = margin + x * cellSpacing;
          const cy = margin + y * cellSpacing;
          this.drawSingleStone(ctx, cx, cy, stoneRadius, val);

          // 마지막 착수 수순 표시 링
          if (this.badukLastMove && this.badukLastMove.x === x && this.badukLastMove.y === y) {
            ctx.save();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, stoneRadius * 0.45, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
    }

    // 6. 착수 힌트 표시 (반짝이는 황금 별표)
    if (this.badukHintCoord) {
      const hx = margin + this.badukHintCoord.x * cellSpacing;
      const hy = margin + this.badukHintCoord.y * cellSpacing;
      ctx.save();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(hx, hy, stoneRadius * 0.85, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#eab308';
      ctx.font = `${stoneRadius * 1.1}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', hx, hy);
      ctx.restore();
    }

    // 7. 마우스 호버 반투명 고스트 돌
    if (this.badukHoverCoord && !this.badukIsGameOver && !this.isBadukAiThinking) {
      const hx = this.badukHoverCoord.x;
      const hy = this.badukHoverCoord.y;
      if (this.badukBoard[hy][hx] === 0) {
        const cx = margin + hx * cellSpacing;
        const cy = margin + hy * cellSpacing;
        ctx.save();
        ctx.globalAlpha = 0.45;
        this.drawSingleStone(ctx, cx, cy, stoneRadius, this.badukTurn);
        ctx.restore();
      }
    }

    // 8. 오목 5목 연결 승리선 그리기 (황금빛 레이저 빔)
    if (this.badukWinningLine && this.badukWinningLine.length >= 2) {
      const first = this.badukWinningLine[0];
      const last = this.badukWinningLine[this.badukWinningLine.length - 1];
      const x1 = margin + first.x * cellSpacing;
      const y1 = margin + first.y * cellSpacing;
      const x2 = margin + last.x * cellSpacing;
      const y2 = margin + last.y * cellSpacing;

      ctx.save();
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  };

  EduApp.prototype.getStarPoints = function(size) {
    if (size === 9) {
      return [{ x: 2, y: 2 }, { x: 6, y: 2 }, { x: 2, y: 6 }, { x: 6, y: 6 }, { x: 4, y: 4 }];
    } else if (size === 13) {
      return [{ x: 3, y: 3 }, { x: 9, y: 3 }, { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 6, y: 6 }];
    } else if (size === 15) {
      return [{ x: 3, y: 3 }, { x: 11, y: 3 }, { x: 3, y: 11 }, { x: 11, y: 11 }, { x: 7, y: 7 }];
    } else if (size === 19) {
      return [
        { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
        { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
        { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 }
      ];
    }
    return [];
  };

  EduApp.prototype.drawSingleStone = function(ctx, cx, cy, r, player) {
    ctx.save();
    // 부드러운 그림자
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = Math.max(3, r * 0.25);
    ctx.shadowOffsetX = 1.5;
    ctx.shadowOffsetY = 2.5;

    if (player === 1) {
      // 흑돌 (흑요석 광택 3D 그라데이션)
      const grad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.05, cx, cy, r);
      grad.addColorStop(0, '#555555');
      grad.addColorStop(0.3, '#2a2a2a');
      grad.addColorStop(0.85, '#111111');
      grad.addColorStop(1, '#000000');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // 은은한 반사광
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.35, cy - r * 0.35, r * 0.28, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 백돌 (고급 조개 바둑돌 진주빛 3D 그라데이션)
      const grad = ctx.createRadialGradient(cx - r * 0.32, cy - r * 0.32, r * 0.05, cx, cy, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.65, '#f8fafc');
      grad.addColorStop(0.9, '#e2e8f0');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // 밝은 하이라이트
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(cx - r * 0.32, cy - r * 0.32, r * 0.32, r * 0.18, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };


  // --------------------------------------------------------------------------
  // 3. 🧩 집중력 쑥쑥 두뇌 탐험 놀이터 (Brain Playground) 엔진
  // --------------------------------------------------------------------------
  EduApp.prototype.initBrainPlayground = function() {
    this.brainSubGame = this.brainSubGame || 'maze'; // 'maze' | 'spot' | 'where'

    if (!this.brainListenersSetup) {
      this.setupBrainListeners();
      this.brainListenersSetup = true;
    }

    this.setBrainSubGame(this.brainSubGame);
  };

  EduApp.prototype.setupBrainListeners = function() {
    // 키보드 방향키 미로 조작 연동
    window.addEventListener('keydown', (e) => {
      if (this.currentTab === 'brain' && this.brainSubGame === 'maze') {
        const keyMap = {
          'ArrowUp': [0, -1], 'KeyW': [0, -1],
          'ArrowDown': [0, 1], 'KeyS': [0, 1],
          'ArrowLeft': [-1, 0], 'KeyA': [-1, 0],
          'ArrowRight': [1, 0], 'KeyD': [1, 0]
        };
        if (keyMap[e.code]) {
          e.preventDefault();
          this.moveMazePlayer(keyMap[e.code][0], keyMap[e.code][1]);
        }
      }
    });
  };

  EduApp.prototype.setBrainSubGame = function(gameName) {
    this.playPop();
    this.brainSubGame = gameName;

    const btnMaze = document.getElementById('btnBrainMaze');
    const btnSpot = document.getElementById('btnBrainSpot');
    const btnWhere = document.getElementById('btnBrainWhere');
    if (btnMaze) btnMaze.classList.toggle('active', gameName === 'maze');
    if (btnSpot) btnSpot.classList.toggle('active', gameName === 'spot');
    if (btnWhere) btnWhere.classList.toggle('active', gameName === 'where');

    const panelMaze = document.getElementById('brainPanelMaze');
    const panelSpot = document.getElementById('brainPanelSpot');
    const panelWhere = document.getElementById('brainPanelWhere');
    if (panelMaze) panelMaze.style.display = (gameName === 'maze') ? 'block' : 'none';
    if (panelSpot) panelSpot.style.display = (gameName === 'spot') ? 'block' : 'none';
    if (panelWhere) panelWhere.style.display = (gameName === 'where') ? 'block' : 'none';

    if (gameName === 'maze') {
      if (!this.mazeGrid) this.generateNewMaze();
      else this.drawMaze();
    } else if (gameName === 'spot') {
      this.initSpotStages();
      this.renderSpotStage();
    } else if (gameName === 'where') {
      this.initWhereScenes();
      this.renderWhereScene();
    }
  };

  // ==========================================================================
  // 3-1. 🌀 요리조리 미로 탈출 서브게임 (Maze Escape)
  // ==========================================================================
  EduApp.prototype.setMazeDifficulty = function(size) {
    this.playPop();
    this.mazeDifficulty = parseInt(size, 10);
    document.querySelectorAll('.btn-maze-opt').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === this.mazeDifficulty);
    });
    this.generateNewMaze();
  };

  EduApp.prototype.setMazeTheme = function(theme) {
    this.playPop();
    this.mazeTheme = theme;
    document.querySelectorAll('.btn-maze-theme').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    this.drawMaze();
  };

  EduApp.prototype.generateNewMaze = function() {
    const size = this.mazeDifficulty || 9;
    // 홀수 크기 보장
    const w = size % 2 === 0 ? size + 1 : size;
    const h = w;

    // 1. 전체를 벽(1)으로 채우기
    const grid = Array.from({ length: h }, () => Array(w).fill(1));

    // 2. DFS Recursive Backtracker 길 뚫기
    const stack = [];
    const startX = 1;
    const startY = 1;
    grid[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    while (stack.length > 0) {
      const cur = stack[stack.length - 1];
      const neighbors = [];
      const dirs = [
        { dx: 0, dy: -2 }, { dx: 0, dy: 2 },
        { dx: -2, dy: 0 }, { dx: 2, dy: 0 }
      ];

      for (const d of dirs) {
        const nx = cur.x + d.dx;
        const ny = cur.y + d.dy;
        if (nx > 0 && nx < w - 1 && ny > 0 && ny < h - 1 && grid[ny][nx] === 1) {
          neighbors.push({ x: nx, y: ny, wallX: cur.x + d.dx / 2, wallY: cur.y + d.dy / 2 });
        }
      }

      if (neighbors.length > 0) {
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        grid[chosen.wallY][chosen.wallX] = 0;
        grid[chosen.y][chosen.x] = 0;
        stack.push({ x: chosen.x, y: chosen.y });
      } else {
        stack.pop();
      }
    }

    this.mazeGrid = grid;
    this.mazeWidth = w;
    this.mazeHeight = h;
    this.mazePlayerPos = { x: 1, y: 1 };
    this.mazeEndPos = { x: w - 2, y: h - 2 };
    this.mazePlayerTrail = [{ x: 1, y: 1 }];
    this.mazeCollectedStars = 0;
    this.mazeIsWon = false;

    // 길목에 별 3~4개 배치
    this.mazeStars = [];
    const pathCells = [];
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        if (grid[y][x] === 0 && !(x === 1 && y === 1) && !(x === w - 2 && y === h - 2)) {
          pathCells.push({ x, y });
        }
      }
    }
    // 셔플 후 별 배치
    pathCells.sort(() => Math.random() - 0.5);
    const starCount = Math.min(pathCells.length, Math.floor(w / 3.5) + 1);
    for (let i = 0; i < starCount; i++) {
      this.mazeStars.push(pathCells[i]);
    }
    this.mazeTotalStars = this.mazeStars.length;

    // HUD 업데이트
    const starElem = document.getElementById('mazeStarCount');
    const totElem = document.getElementById('mazeTotalStars');
    if (starElem) starElem.textContent = '0';
    if (totElem) totElem.textContent = this.mazeTotalStars;

    const overlay = document.getElementById('mazeWinOverlay');
    if (overlay) overlay.style.display = 'none';

    this.drawMaze();
  };

  EduApp.prototype.moveMazePlayer = function(dx, dy) {
    if (this.mazeIsWon || !this.mazeGrid) return;

    const nx = this.mazePlayerPos.x + dx;
    const ny = this.mazePlayerPos.y + dy;

    if (nx >= 0 && nx < this.mazeWidth && ny >= 0 && ny < this.mazeHeight) {
      if (this.mazeGrid[ny][nx] === 0) {
        this.mazePlayerPos = { x: nx, y: ny };
        this.mazePlayerTrail.push({ x: nx, y: ny });
        this.playPop();

        // 별 수집 확인
        const starIdx = this.mazeStars.findIndex(s => s.x === nx && s.y === ny);
        if (starIdx !== -1) {
          this.mazeStars.splice(starIdx, 1);
          this.mazeCollectedStars++;
          this.playSuccess();
          const starElem = document.getElementById('mazeStarCount');
          if (starElem) starElem.textContent = this.mazeCollectedStars;
        }

        // 목적지 도착 확인
        if (nx === this.mazeEndPos.x && ny === this.mazeEndPos.y) {
          this.triggerMazeWin();
        }

        this.drawMaze();
      } else {
        // 벽 부딪힘
        this.playBeep(220, 'sine', 0.05, 0.1);
      }
    }
  };

  EduApp.prototype.triggerMazeWin = function() {
    this.mazeIsWon = true;
    this.playFanfare();
    this.triggerConfetti();

    const overlay = document.getElementById('mazeWinOverlay');
    const starsRow = document.getElementById('mazeWinStarsRow');
    if (starsRow) {
      starsRow.textContent = '⭐'.repeat(Math.max(1, this.mazeCollectedStars || 3));
    }
    if (overlay) overlay.style.display = 'flex';

    this.speak('와아! 은찬이가 신나는 미로를 완벽하게 탈출해서 아빠를 만났어요! 만세!', 'ko-KR');
  };

  EduApp.prototype.nextMazeLevel = function() {
    this.playPop();
    const overlay = document.getElementById('mazeWinOverlay');
    if (overlay) overlay.style.display = 'none';
    this.generateNewMaze();
  };

  EduApp.prototype.drawMaze = function() {
    const canvas = document.getElementById('mazeCanvas');
    if (!canvas || !this.mazeGrid) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const containerWidth = container ? container.clientWidth : 560;
    const targetSize = Math.max(280, Math.min(containerWidth - 24, 560));

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = targetSize + 'px';
    canvas.style.height = targetSize + 'px';
    canvas.width = targetSize * dpr;
    canvas.height = targetSize * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    const w = this.mazeWidth;
    const h = this.mazeHeight;
    const cellSize = targetSize / w;

    // 테마별 색상 설정
    let floorColor = '#fefce8';
    let wallColor = '#d97706';
    let wallShadow = '#92400e';
    let trailColor = 'rgba(251, 191, 36, 0.4)';

    if (this.mazeTheme === 'forest') {
      floorColor = '#f0fdf4';
      wallColor = '#16a34a';
      wallShadow = '#14532d';
      trailColor = 'rgba(74, 222, 128, 0.4)';
    } else if (this.mazeTheme === 'space') {
      floorColor = '#0f172a';
      wallColor = '#3b82f6';
      wallShadow = '#1d4ed8';
      trailColor = 'rgba(147, 197, 253, 0.4)';
    }

    // 바닥 채우기
    ctx.fillStyle = floorColor;
    ctx.fillRect(0, 0, targetSize, targetSize);

    // 지나온 발자국 트레일 그리기
    ctx.fillStyle = trailColor;
    this.mazePlayerTrail.forEach(t => {
      ctx.beginPath();
      ctx.arc(t.x * cellSize + cellSize / 2, t.y * cellSize + cellSize / 2, cellSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
    });

    // 벽 그리기
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.mazeGrid[y][x] === 1) {
          const px = x * cellSize;
          const py = y * cellSize;

          ctx.fillStyle = wallColor;
          ctx.beginPath();
          ctx.roundRect(px + 0.5, py + 0.5, cellSize - 1, cellSize - 1, Math.max(2, cellSize * 0.15));
          ctx.fill();

          // 입체감 상단 하이라이트
          ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
          ctx.fillRect(px + 1, py + 1, cellSize - 2, cellSize * 0.25);
        }
      }
    }

    // 보너스 별 아이템들 그리기
    this.mazeStars.forEach(s => {
      const sx = s.x * cellSize + cellSize / 2;
      const sy = s.y * cellSize + cellSize / 2;
      ctx.save();
      ctx.font = `${cellSize * 0.7}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', sx, sy);
      ctx.restore();
    });

    // 도착점 (아빠 또는 트로피)
    const ex = this.mazeEndPos.x * cellSize + cellSize / 2;
    const ey = this.mazeEndPos.y * cellSize + cellSize / 2;
    ctx.save();
    ctx.font = `${cellSize * 0.85}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👨', ex, ey);
    ctx.restore();

    // 플레이어 은찬이 아바타 그리기
    const px = this.mazePlayerPos.x * cellSize + cellSize / 2;
    const py = this.mazePlayerPos.y * cellSize + cellSize / 2;
    ctx.save();
    ctx.font = `${cellSize * 0.85}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👦', px, py);
    ctx.restore();

    ctx.restore();
  };

  // ==========================================================================
  // 3-2. 🔍 눈썰미 쑥쑥 틀린그림 찾기 (Spot the Differences) - 20개 다양한 테마 스테이지
  // ==========================================================================
  EduApp.prototype.buildSpotStagesData = function() {
    return [
      {
        id: 0,
        title: '🚗 1탄. 멋진 자동차 마을',
        badge: '🚗 1탄',
        themeType: 'cars',
        diffs: [
          { id: 0, x: 75, y: 70, radius: 34, hint: '신호등 불빛 색깔을 살펴보세요!' },
          { id: 1, x: 175, y: 280, radius: 34, hint: '빨간 스포츠카 바퀴 휠 모양을 보세요!' },
          { id: 2, x: 410, y: 55, radius: 36, hint: '하늘에 떠 있는 구름 모양을 찾아보세요!' },
          { id: 3, x: 480, y: 160, radius: 34, hint: '가로수 사과 개수를 세어보세요!' },
          { id: 4, x: 295, y: 125, radius: 32, hint: '지붕 위 귀여운 고양이의 모자를 찾아보세요!' }
        ]
      },
      {
        id: 1,
        title: '🦕 2탄. 아기 공룡 동산',
        badge: '🦕 2탄',
        themeType: 'dino',
        diffs: [
          { id: 0, x: 100, y: 60, radius: 34, hint: '화산에서 피어오르는 연기 모양을 보세요!' },
          { id: 1, x: 210, y: 240, radius: 34, hint: '아기 티라노의 꼬리 무늬를 살펴보세요!' },
          { id: 2, x: 360, y: 295, radius: 32, hint: '둥지 속 공룡알의 줄무늬를 비교해보세요!' },
          { id: 3, x: 450, y: 110, radius: 32, hint: '날아다니는 익룡의 날개 색을 확인해보세요!' },
          { id: 4, x: 480, y: 190, radius: 34, hint: '야자수 나무에 달린 코코넛 열매를 찾아보세요!' }
        ]
      },
      {
        id: 2,
        title: '🚀 3탄. 반짝반짝 우주 은하수',
        badge: '🚀 3탄',
        themeType: 'space',
        diffs: [
          { id: 0, x: 130, y: 210, radius: 34, hint: '우주 비행사의 헬멧 유리창 색을 살펴보세요!' },
          { id: 1, x: 275, y: 110, radius: 34, hint: '로켓 우주선의 창문 모양을 비교해보세요!' },
          { id: 2, x: 460, y: 65, radius: 34, hint: '토성 행성의 예쁜 고리 색상을 보세요!' },
          { id: 3, x: 85, y: 90, radius: 32, hint: '인공위성 안테나 끝 장식을 찾아보세요!' },
          { id: 4, x: 395, y: 270, radius: 34, hint: '귀여운 외계인 친구의 눈 개수를 살펴보세요!' }
        ]
      },
      {
        id: 3,
        title: '🏰 4탄. 동화 요정의 비밀 성',
        badge: '🏰 4탄',
        themeType: 'castle',
        diffs: [
          { id: 0, x: 260, y: 50, radius: 32, hint: '성 꼭대기 펄럭이는 깃발 모양을 보세요!' },
          { id: 1, x: 120, y: 80, radius: 34, hint: '하늘에 걸린 무지개 색깔 순서를 살펴보세요!' },
          { id: 2, x: 270, y: 150, radius: 32, hint: '시계탑의 바늘이 가리키는 시간을 비교해보세요!' },
          { id: 3, x: 440, y: 290, radius: 34, hint: '호수 위 하얀 백조의 머리 왕관을 보세요!' },
          { id: 4, x: 150, y: 280, radius: 34, hint: '분수대 가운데 반짝이는 보석 색상을 찾아보세요!' }
        ]
      },
      {
        id: 4,
        title: '🦁 5탄. 복작복작 사파리 동물원',
        badge: '🦁 5탄',
        themeType: 'safari',
        diffs: [
          { id: 0, x: 150, y: 230, radius: 34, hint: '아기 사자의 머리 리본 색상을 살펴보세요!' },
          { id: 1, x: 400, y: 130, radius: 34, hint: '기린 목의 알록달록 반점 개수를 세어보세요!' },
          { id: 2, x: 270, y: 280, radius: 34, hint: '얼룩말 줄무늬 모양을 비교해보세요!' },
          { id: 3, x: 110, y: 310, radius: 34, hint: '연못 위 악어가 쓴 멋진 선글라스를 찾아보세요!' },
          { id: 4, x: 470, y: 100, radius: 32, hint: '나무 위 원숭이가 쥐고 있는 바나나를 보세요!' }
        ]
      },
      {
        id: 5,
        title: '🌊 6탄. 신비한 바닷속 산호초',
        badge: '🌊 6탄',
        themeType: 'ocean',
        diffs: [
          { id: 0, x: 160, y: 220, radius: 34, hint: '귀여운 문어의 파티 꼬깔모자를 확인해보세요!' },
          { id: 1, x: 340, y: 170, radius: 34, hint: '황금 해마의 꼬리 방향을 비교해보세요!' },
          { id: 2, x: 240, y: 310, radius: 34, hint: '거대 조개 속 무지개 진주의 색깔을 찾아보세요!' },
          { id: 3, x: 430, y: 250, radius: 34, hint: '바다거북 등껍질 위의 별빛 무늬를 살펴보세요!' },
          { id: 4, x: 90, y: 110, radius: 32, hint: '잠수함 창문 밖으로 지나가는 물고기를 보세요!' }
        ]
      },
      {
        id: 6,
        title: '🍬 7탄. 달콤한 디저트 과자나라',
        badge: '🍬 7탄',
        themeType: 'candy',
        diffs: [
          { id: 0, x: 180, y: 250, radius: 34, hint: '진저브레드 쿠키의 단추 개수를 확인해보세요!' },
          { id: 1, x: 360, y: 190, radius: 34, hint: '대형 컵케이크 위의 체리 토핑 색상을 보세요!' },
          { id: 2, x: 100, y: 140, radius: 34, hint: '대왕 롤리팝 사탕의 회오리 줄무늬를 살펴보세요!' },
          { id: 3, x: 460, y: 80, radius: 32, hint: '아이스크림 성 꼭대기의 깃발을 찾아보세요!' },
          { id: 4, x: 270, y: 300, radius: 34, hint: '초콜릿 분수에서 퐁퐁 튀는 방울을 세어보세요!' }
        ]
      },
      {
        id: 7,
        title: '❄️ 8탄. 펭귄과 눈사람 겨울마을',
        badge: '❄️ 8탄',
        themeType: 'winter',
        diffs: [
          { id: 0, x: 160, y: 220, radius: 34, hint: '꼬마 눈사람의 따뜻한 목도리 색깔을 보세요!' },
          { id: 1, x: 320, y: 260, radius: 34, hint: '아기 펭귄이 끼고 있는 푹신한 귀마개를 찾아보세요!' },
          { id: 2, x: 440, y: 210, radius: 34, hint: '얼음 이글루 입구 모양을 비교해보세요!' },
          { id: 3, x: 260, y: 60, radius: 32, hint: '겨울 밤하늘에 반짝이는 오로라 별똥별을 보세요!' },
          { id: 4, x: 100, y: 320, radius: 34, hint: '썰매 위 선물상자 리본 모양을 살펴보세요!' }
        ]
      },
      {
        id: 8,
        title: '🌴 9탄. 신비한 아마존 열대정글',
        badge: '🌴 9탄',
        themeType: 'jungle',
        diffs: [
          { id: 0, x: 120, y: 130, radius: 34, hint: '큰부리새 투칸의 알록달록 부리 색을 보세요!' },
          { id: 1, x: 280, y: 200, radius: 34, hint: '나뭇가지 위 카멜레온의 피부 색상을 비교해보세요!' },
          { id: 2, x: 430, y: 270, radius: 34, hint: '폭포 옆에 활짝 핀 정글 꽃잎 모양을 보세요!' },
          { id: 3, x: 480, y: 90, radius: 32, hint: '덩굴 식물에 달린 신비한 열매 개수를 찾아보세요!' },
          { id: 4, x: 200, y: 310, radius: 34, hint: '연잎 위 아기 청개구리의 왕관을 살펴보세요!' }
        ]
      },
      {
        id: 9,
        title: '🤖 10탄. 첨단 미래 로봇 연구소',
        badge: '🤖 10탄',
        themeType: 'robot',
        diffs: [
          { id: 0, x: 150, y: 220, radius: 34, hint: '청소 로봇의 머리 안테나 라이트 색상을 보세요!' },
          { id: 1, x: 270, y: 130, radius: 34, hint: '메인 슈퍼컴퓨터 모니터의 홀로그램 그래프를 보세요!' },
          { id: 2, x: 400, y: 100, radius: 32, hint: '벽면 에너지 배터리의 충전 게이지 칸수를 세어보세요!' },
          { id: 3, x: 350, y: 260, radius: 34, hint: '연구원 곰돌이 로봇의 안경테 모양을 찾아보세요!' },
          { id: 4, x: 90, y: 90, radius: 34, hint: '벽면 톱니바퀴의 황금 톱니를 비교해보세요!' }
        ]
      },
      {
        id: 10,
        title: '⚽ 11탄. 신나는 학교 운동회',
        badge: '⚽ 11탄',
        themeType: 'sports',
        diffs: [
          { id: 0, x: 270, y: 290, radius: 34, hint: '축구공 중앙의 오각형 무늬 색상을 확인해보세요!' },
          { id: 1, x: 220, y: 70, radius: 34, hint: '운동장 하늘에 걸린 만국기 깃발 모양을 보세요!' },
          { id: 2, x: 140, y: 210, radius: 34, hint: '열심히 응원하는 은찬이의 머리띠 색을 살펴보세요!' },
          { id: 3, x: 410, y: 190, radius: 34, hint: '시상대 위 우승 트로피의 별 개수를 세어보세요!' },
          { id: 4, x: 470, y: 80, radius: 32, hint: '전광판 점수판의 승리 점수 숫자를 확인해보세요!' }
        ]
      },
      {
        id: 11,
        title: '🏖️ 12탄. 햇살 가득 모래 해변',
        badge: '🏖️ 12탄',
        themeType: 'beach',
        diffs: [
          { id: 0, x: 180, y: 160, radius: 34, hint: '알록달록 비치 파라솔의 줄무늬 색을 비교해보세요!' },
          { id: 1, x: 360, y: 250, radius: 34, hint: '멋진 모래성 꼭대기의 조개 깃발을 찾아보세요!' },
          { id: 2, x: 450, y: 290, radius: 34, hint: '파도 위 서핑보드의 번개 무늬를 살펴보세요!' },
          { id: 3, x: 280, y: 60, radius: 32, hint: '푸른 하늘을 나는 갈매기 부리의 물고기를 보세요!' },
          { id: 4, x: 100, y: 270, radius: 34, hint: '튜브를 탄 귀여운 아기 물개의 선글라스를 찾아보세요!' }
        ]
      },
      {
        id: 12,
        title: '🏫 13탄. 은찬이의 두뇌 쏙쏙 교실',
        badge: '🏫 13탄',
        themeType: 'school',
        diffs: [
          { id: 0, x: 230, y: 110, radius: 34, hint: '초록 칠판에 적힌 덧셈 문제의 정답을 확인해보세요!' },
          { id: 1, x: 420, y: 130, radius: 34, hint: '책장 위 회전 지구본의 대륙 색상을 비교해보세요!' },
          { id: 2, x: 150, y: 270, radius: 34, hint: '은찬이의 책가방에 달린 스마일 배지를 찾아보세요!' },
          { id: 3, x: 310, y: 240, radius: 32, hint: '교탁 위 연필꽂이에 꽂힌 알록달록 연필 수를 세어보세요!' },
          { id: 4, x: 80, y: 90, radius: 32, hint: '교실 창문 밖으로 날아온 노랑나비를 살펴보세요!' }
        ]
      },
      {
        id: 13,
        title: '🛒 14탄. 복작복작 마트 장보기',
        badge: '🛒 14탄',
        themeType: 'market',
        diffs: [
          { id: 0, x: 200, y: 280, radius: 34, hint: '쇼핑 카트 속 커다란 수박의 줄무늬를 살펴보세요!' },
          { id: 1, x: 340, y: 170, radius: 34, hint: '과일 코너 진열대의 달콤한 바나나 송이를 세어보세요!' },
          { id: 2, x: 270, y: 60, radius: 34, hint: '마트 벽면 둥근 시계의 시침 바늘을 비교해보세요!' },
          { id: 3, x: 440, y: 190, radius: 34, hint: '친절한 마트 점원 모자의 별 마크를 찾아보세요!' },
          { id: 4, x: 100, y: 190, radius: 32, hint: '음료수 진열대의 탄산음료 캔 색상을 확인해보세요!' }
        ]
      },
      {
        id: 14,
        title: '🚂 15탄. 칙칙폭폭 기차역',
        badge: '🚂 15탄',
        themeType: 'train',
        diffs: [
          { id: 0, x: 180, y: 90, radius: 34, hint: '증기기관차 굴뚝에서 나오는 뭉게구름 하트 모양을 보세요!' },
          { id: 1, x: 340, y: 230, radius: 34, hint: '역장 곰돌이가 불고 있는 황금 호루라기를 살펴보세요!' },
          { id: 2, x: 90, y: 250, radius: 34, hint: '기관차 전면의 밝은 라이트 전조등 빛 색을 보세요!' },
          { id: 3, x: 440, y: 280, radius: 34, hint: '플랫폼 벤치 옆에 놓인 여행가방의 네임택을 찾아보세요!' },
          { id: 4, x: 270, y: 50, radius: 32, hint: '기차역 꼭대기 시계탑의 시간을 확인해보세요!' }
        ]
      },
      {
        id: 15,
        title: '✈️ 16탄. 세계 여행 하늘 공항',
        badge: '✈️ 16탄',
        themeType: 'airport',
        diffs: [
          { id: 0, x: 220, y: 150, radius: 34, hint: '여객기 날개 제트 엔진의 불꽃 색상을 비교해보세요!' },
          { id: 1, x: 430, y: 80, radius: 34, hint: '공항 관제탑 레이더 안테나의 회전 날개를 보세요!' },
          { id: 2, x: 120, y: 310, radius: 34, hint: '활주로 바닥의 비행기 유도등 불빛을 찾아보세요!' },
          { id: 3, x: 330, y: 270, radius: 34, hint: '여행객 토끼가 손에 쥔 여권 커버 색상을 살펴보세요!' },
          { id: 4, x: 260, y: 60, radius: 32, hint: '하늘 높이 떠 있는 비행선 풍선의 로고를 확인해보세요!' }
        ]
      },
      {
        id: 16,
        title: '🚒 17탄. 출동 119 소방서',
        badge: '🚒 17탄',
        themeType: 'fire',
        diffs: [
          { id: 0, x: 170, y: 200, radius: 34, hint: '빨간 소방차 위의 경광등 사이렌 색깔을 비교해보세요!' },
          { id: 1, x: 300, y: 280, radius: 34, hint: '소방관 아저씨가 잡은 소방호스 노즐을 살펴보세요!' },
          { id: 2, x: 230, y: 160, radius: 34, hint: '용감한 소방관 헬멧의 번개 엠블럼을 찾아보세요!' },
          { id: 3, x: 420, y: 100, radius: 32, hint: '소방서 옥상 긴급 출동 확성기 개수를 세어보세요!' },
          { id: 4, x: 450, y: 290, radius: 34, hint: '도로변 빨간 소화전의 밸브 손잡이 모양을 보세요!' }
        ]
      },
      {
        id: 17,
        title: '🎸 18탄. 숲속 동물 음악 밴드',
        badge: '🎸 18탄',
        themeType: 'concert',
        diffs: [
          { id: 0, x: 170, y: 220, radius: 34, hint: '곰 드러머의 신나는 드럼 심벌즈 색상을 확인해보세요!' },
          { id: 1, x: 270, y: 170, radius: 34, hint: '토끼 보컬의 스탠드 마이크 리본 장식을 찾아보세요!' },
          { id: 2, x: 370, y: 240, radius: 34, hint: '여우 기타리스트의 기타 피크 모양을 비교해보세요!' },
          { id: 3, x: 440, y: 180, radius: 32, hint: '음악 보면대에 그려진 높은음자리표를 살펴보세요!' },
          { id: 4, x: 270, y: 50, radius: 34, hint: '무대 천장에 매달린 반짝반짝 미러볼 조명을 보세요!' }
        ]
      },
      {
        id: 18,
        title: '🚜 19탄. 평화로운 시골 농장',
        badge: '🚜 19탄',
        themeType: 'farm',
        diffs: [
          { id: 0, x: 170, y: 260, radius: 34, hint: '초록 트랙터의 커다란 바퀴 휠 모양을 살펴보세요!' },
          { id: 1, x: 330, y: 150, radius: 34, hint: '밀짚모자 허수아비 어깨에 앉은 아기 참새를 보세요!' },
          { id: 2, x: 430, y: 100, radius: 34, hint: '언덕 위 붉은 풍차 날개의 회전 각도를 확인해보세요!' },
          { id: 3, x: 250, y: 310, radius: 32, hint: '텃밭에서 쑥쑥 자라는 주황 당근의 잎사귀를 세어보세요!' },
          { id: 4, x: 90, y: 210, radius: 34, hint: '외양간 얼룩송아지의 이마 하트 얼룩무늬를 찾아보세요!' }
        ]
      },
      {
        id: 19,
        title: '🎪 20탄. 환상적인 서커스 매직쇼',
        badge: '🎪 20탄',
        themeType: 'circus',
        diffs: [
          { id: 0, x: 270, y: 130, radius: 34, hint: '마술사 모자 속에서 날아오르는 흰 비둘기를 보세요!' },
          { id: 1, x: 270, y: 50, radius: 34, hint: '거대한 서커스 천막 꼭대기의 황금 별을 확인해보세요!' },
          { id: 2, x: 150, y: 240, radius: 34, hint: '외발자전거를 탄 피에로의 알록달록 풍선 개수를 세어보세요!' },
          { id: 3, x: 390, y: 190, radius: 34, hint: '공중에서 핑핑 도는 저글링 볼의 색상을 비교해보세요!' },
          { id: 4, x: 460, y: 100, radius: 32, hint: '화려한 레드카펫 무대 커튼의 금빛 태슬을 살펴보세요!' }
        ]
      }
    ];
  };

  EduApp.prototype.initSpotStages = function() {
    this.spotStageIdx = (typeof this.spotStageIdx === 'number' && this.spotStageIdx >= 0) ? this.spotStageIdx : 0;
    this.spotFoundMap = this.spotFoundMap || {};
    this.spotFoundMap[this.spotStageIdx] = this.spotFoundMap[this.spotStageIdx] || new Set();

    if (!this.spotStagesInitialized) {
      this.spotStages = this.buildSpotStagesData();
      this.spotStagesInitialized = true;
      this.setupSpotClickListeners();
    }

    this.renderSpotStageButtons();
  };

  EduApp.prototype.renderSpotStageButtons = function() {
    const container = document.getElementById('spotStageButtons');
    if (!container || !this.spotStages) return;

    if (container.children.length !== this.spotStages.length) {
      container.innerHTML = this.spotStages.map((stage, idx) => `
        <button class="btn-spot-stage ${idx === this.spotStageIdx ? 'active' : ''}" data-stage="${idx}" onclick="app.selectSpotStage(${idx})">
          <span>${stage.title}</span>
        </button>
      `).join('');
    } else {
      Array.from(container.children).forEach((btn, idx) => {
        btn.classList.toggle('active', idx === this.spotStageIdx);
      });
    }
  };

  EduApp.prototype.setupSpotClickListeners = function() {
    const leftCanvas = document.getElementById('spotCanvasLeft');
    const rightCanvas = document.getElementById('spotCanvasRight');
    if (leftCanvas) {
      leftCanvas.addEventListener('click', (e) => this.handleSpotCanvasClick(e, false));
    }
    if (rightCanvas) {
      rightCanvas.addEventListener('click', (e) => this.handleSpotCanvasClick(e, true));
    }
  };

  EduApp.prototype.selectSpotStage = function(idx) {
    this.playPop();
    this.spotStageIdx = idx;
    this.spotFoundMap = this.spotFoundMap || {};
    this.spotFoundMap[this.spotStageIdx] = this.spotFoundMap[this.spotStageIdx] || new Set();

    this.renderSpotStageButtons();

    const activeBtn = document.querySelector(`.btn-spot-stage[data-stage="${idx}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    const overlay = document.getElementById('spotWinOverlay');
    if (overlay) overlay.style.display = 'none';

    this.renderSpotStage();
  };

  EduApp.prototype.handleSpotCanvasClick = function(e, isRight) {
    const canvas = isRight ? document.getElementById('spotCanvasRight') : document.getElementById('spotCanvasLeft');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 540 / rect.width;
    const scaleY = 380 / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (!this.spotStages || !this.spotStages[this.spotStageIdx]) return;
    const curStage = this.spotStages[this.spotStageIdx];

    this.spotFoundMap[this.spotStageIdx] = this.spotFoundMap[this.spotStageIdx] || new Set();
    const foundSet = this.spotFoundMap[this.spotStageIdx];

    let foundAny = false;
    curStage.diffs.forEach(diff => {
      if (!foundSet.has(diff.id)) {
        const dist = Math.hypot(clickX - diff.x, clickY - diff.y);
        if (dist <= diff.radius) {
          foundSet.add(diff.id);
          foundAny = true;
          this.playSuccess();
          this.renderSpotStage();

          if (foundSet.size === curStage.diffs.length) {
            setTimeout(() => {
              this.playFanfare();
              this.triggerConfetti();
              const overlay = document.getElementById('spotWinOverlay');
              if (overlay) overlay.style.display = 'flex';
              this.speak('우와! 5개의 다른 점을 모두 찾았어요! 은찬이의 눈썰미는 명탐정 홈즈 같아요!', 'ko-KR');
            }, 300);
          }
        }
      }
    });

    if (!foundAny) {
      this.playBeep(320, 'sine', 0.08, 0.1);
    }
  };

  EduApp.prototype.showSpotHint = function() {
    this.playPop();
    if (!this.spotStages) return;
    const curStage = this.spotStages[this.spotStageIdx];
    if (!curStage) return;

    this.spotFoundMap[this.spotStageIdx] = this.spotFoundMap[this.spotStageIdx] || new Set();
    const foundSet = this.spotFoundMap[this.spotStageIdx];

    const unfound = curStage.diffs.find(d => !foundSet.has(d.id));
    if (unfound) {
      this.spotHintPos = { x: unfound.x, y: unfound.y };
      this.renderSpotStage();
      this.speak(unfound.hint, 'ko-KR');
      setTimeout(() => {
        this.spotHintPos = null;
        this.renderSpotStage();
      }, 2600);
    }
  };

  EduApp.prototype.resetCurrentSpotStage = function() {
    this.playPop();
    if (this.spotFoundMap && this.spotFoundMap[this.spotStageIdx]) {
      this.spotFoundMap[this.spotStageIdx].clear();
    }
    const overlay = document.getElementById('spotWinOverlay');
    if (overlay) overlay.style.display = 'none';
    this.renderSpotStage();
  };

  EduApp.prototype.nextSpotStage = function() {
    this.playPop();
    const nextIdx = (this.spotStageIdx + 1) % (this.spotStages ? this.spotStages.length : 20);
    this.selectSpotStage(nextIdx);
  };

  EduApp.prototype.renderSpotStage = function() {
    const leftCanvas = document.getElementById('spotCanvasLeft');
    const rightCanvas = document.getElementById('spotCanvasRight');
    if (!leftCanvas || !rightCanvas) return;

    this.initSpotStages();
    this.spotFoundMap[this.spotStageIdx] = this.spotFoundMap[this.spotStageIdx] || new Set();
    const foundSet = this.spotFoundMap[this.spotStageIdx];

    const countElem = document.getElementById('spotFoundCount');
    if (countElem) countElem.textContent = foundSet.size;

    for (let i = 0; i < 5; i++) {
      const star = document.getElementById(`spotStar_${i}`);
      if (star) star.classList.toggle('found', i < foundSet.size);
    }

    const curStage = this.spotStages[this.spotStageIdx];
    if (!curStage) return;

    this.drawSpotScene(leftCanvas, this.spotStageIdx, false, foundSet, curStage.diffs);
    this.drawSpotScene(rightCanvas, this.spotStageIdx, true, foundSet, curStage.diffs);
  };

  EduApp.prototype.drawSpotScene = function(canvas, stageIdx, isRight, foundSet, diffs) {
    const ctx = canvas.getContext('2d');
    const w = 540;
    const h = 380;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    // Palettes and themed rendering for all 20 stages
    const themePalettes = [
      { sky: ['#bae6fd', '#e0f2fe'], ground: '#86efac', mainIcon: '🚗', mainX: 175, mainY: 280, env: 'cars' },
      { sky: ['#fef08a', '#bbf7d0'], ground: '#65a30d', mainIcon: '🦕', mainX: 210, mainY: 240, env: 'dino' },
      { sky: ['#0f172a', '#1e1b4b'], ground: '#312e81', mainIcon: '🚀', mainX: 275, mainY: 110, env: 'space' },
      { sky: ['#fbcfe8', '#e0e7ff'], ground: '#a7f3d0', mainIcon: '🏰', mainX: 270, mainY: 150, env: 'castle' },
      { sky: ['#fed7aa', '#fef08a'], ground: '#84cc16', mainIcon: '🦁', mainX: 150, mainY: 230, env: 'safari' },
      { sky: ['#38bdf8', '#0284c7'], ground: '#fef08a', mainIcon: '🤿', mainX: 160, mainY: 220, env: 'ocean' },
      { sky: ['#fce7f3', '#ffe4e6'], ground: '#fbcfe8', mainIcon: '🧁', mainX: 360, mainY: 190, env: 'candy' },
      { sky: ['#e0f2fe', '#bae6fd'], ground: '#f8fafc', mainIcon: '⛄', mainX: 160, mainY: 220, env: 'winter' },
      { sky: ['#a7f3d0', '#6ee7b7'], ground: '#15803d', mainIcon: '🦜', mainX: 120, mainY: 130, env: 'jungle' },
      { sky: ['#0284c7', '#0f172a'], ground: '#1e293b', mainIcon: '🤖', mainX: 150, mainY: 220, env: 'robot' },
      { sky: ['#bae6fd', '#fed7aa'], ground: '#4ade80', mainIcon: '⚽', mainX: 270, mainY: 290, env: 'sports' },
      { sky: ['#7dd3fc', '#fef08a'], ground: '#fde047', mainIcon: '🏖️', mainX: 180, mainY: 160, env: 'beach' },
      { sky: ['#fef3c7', '#dcfce7'], ground: '#cbd5e1', mainIcon: '🏫', mainX: 230, mainY: 110, env: 'school' },
      { sky: ['#fed7aa', '#ffedd5'], ground: '#e2e8f0', mainIcon: '🛒', mainX: 200, mainY: 280, env: 'market' },
      { sky: ['#93c5fd', '#dbeafe'], ground: '#475569', mainIcon: '🚂', mainX: 180, mainY: 90, env: 'train' },
      { sky: ['#60a5fa', '#93c5fd'], ground: '#64748b', mainIcon: '✈️', mainX: 220, mainY: 150, env: 'airport' },
      { sky: ['#fed7aa', '#fca5a5'], ground: '#334155', mainIcon: '🚒', mainX: 170, mainY: 200, env: 'fire' },
      { sky: ['#c084fc', '#e9d5ff'], ground: '#166534', mainIcon: '🎸', mainX: 370, mainY: 240, env: 'concert' },
      { sky: ['#fde047', '#bbf7d0'], ground: '#854d0e', mainIcon: '🚜', mainX: 170, mainY: 260, env: 'farm' },
      { sky: ['#f43f5e', '#fbbf24'], ground: '#7f1d1d', mainIcon: '🎪', mainX: 270, mainY: 50, env: 'circus' }
    ];

    const pal = themePalettes[stageIdx % themePalettes.length];

    // 1. Sky & Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 240);
    skyGrad.addColorStop(0, pal.sky[0]);
    skyGrad.addColorStop(1, pal.sky[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 240);

    // 2. Ground / Terrain
    ctx.fillStyle = pal.ground;
    ctx.beginPath();
    ctx.moveTo(0, 240);
    ctx.bezierCurveTo(180, 225, 360, 255, w, 240);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // 3. Stage-specific Scenery and Differences (0 ~ 4)
    if (stageIdx === 0) {
      // 🚗 1탄. 멋진 자동차 마을
      // 도로
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 290, w, 90);
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 3;
      ctx.setLineDash([16, 12]);
      ctx.beginPath();
      ctx.moveTo(0, 335);
      ctx.lineTo(w, 335);
      ctx.stroke();
      ctx.setLineDash([]);

      // [차이점 2] 구름 (410, 55)
      ctx.fillStyle = '#ffffff';
      if (isRight) {
        this.drawHeart(ctx, 410, 55, 30, '#ffffff');
      } else {
        ctx.beginPath();
        ctx.arc(395, 55, 18, 0, Math.PI * 2);
        ctx.arc(415, 48, 24, 0, Math.PI * 2);
        ctx.arc(435, 55, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // [차이점 0] 신호등 (75, 70)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(60, 40, 30, 70);
      ctx.fillRect(72, 110, 6, 80);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(75, 55, 8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isRight ? '#eab308' : '#22c55e';
      ctx.beginPath(); ctx.arc(75, 85, 8, 0, Math.PI * 2); ctx.fill();

      // [차이점 4] 집과 고양이 (295, 125)
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(250, 150, 90, 90);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(240, 150); ctx.lineTo(295, 100); ctx.lineTo(350, 150); ctx.fill();
      ctx.font = '24px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('🐱', 295, 132);
      if (isRight) {
        ctx.font = '16px sans-serif';
        ctx.fillText('🧢', 295, 114);
      }

      // [차이점 3] 가로수와 사과 (480, 160)
      ctx.fillStyle = '#78350f'; ctx.fillRect(472, 180, 16, 70);
      ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(480, 155, 38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(465, 150, 6, 0, Math.PI * 2);
      ctx.arc(495, 145, 6, 0, Math.PI * 2);
      if (!isRight) ctx.arc(480, 170, 6, 0, Math.PI * 2);
      ctx.fill();

      // [차이점 1] 스포츠카 (175, 280)
      ctx.fillStyle = '#dc2626';
      ctx.beginPath(); ctx.roundRect(110, 270, 130, 36, 12); ctx.fill();
      ctx.beginPath(); ctx.roundRect(140, 245, 75, 30, 8); ctx.fill();
      ctx.fillStyle = '#e0f2fe'; ctx.fillRect(150, 252, 55, 20);
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); ctx.arc(135, 305, 14, 0, Math.PI * 2); ctx.arc(215, 305, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = isRight ? '#fbbf24' : '#cbd5e1';
      ctx.beginPath(); ctx.arc(135, 305, 7, 0, Math.PI * 2); ctx.arc(215, 305, 7, 0, Math.PI * 2); ctx.fill();
    } else {
      // 2~20탄 공통 프로시저럴 일러스트 렌더링 시스템
      // 배경 랜드마크 장식
      ctx.save();
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pal.mainIcon, 270, 220);

      // 주변 보조 데코레이션
      const subIcons = {
        dino: ['🌋', '🌴', '🌿', '🥚', '🦕', '🦖', '🦋'],
        space: ['🪐', '⭐', '🛰️', '🛸', '👨‍🚀', '✨', '🌍'],
        castle: ['🏰', '🌈', '🦢', '⛲', '🧚', '💎', '👑'],
        safari: ['🦒', '🦓', '🐘', '🐊', '🐒', '🌴', '☀️'],
        ocean: ['🐙', '🐡', '🐬', '🪸', '🦭', '🐚', '🫧'],
        candy: ['🧁', '🍪', '🍭', '🍩', '🍫', '🍬', '🍓'],
        winter: ['⛄', '🐧', '❄️', '🦌', '🎄', '🛷', '🧊'],
        jungle: ['🌴', '🐒', '🌺', '🐸', '🐍', '🦜', '🌧️'],
        robot: ['🤖', '🔋', '⚙️', '💻', '💡', '📡', '🕹️'],
        sports: ['⚽', '🏃', '🏆', '🏁', '🥇', '🏀', '🎉'],
        beach: ['🏖️', '🏄', '🦀', '🐬', '🥥', '🦪', '☀️'],
        school: ['🏫', '📚', '🎒', '✏️', '🎨', '📐', '👦'],
        market: ['🛒', '🍎', '🍌', '🍉', '🍞', '🧀', '🏪'],
        train: ['🚂', '🛤️', '🐻', '🧳', '🔔', '🎫', '☁️'],
        airport: ['✈️', '🛫', '🧳', '🌐', '📡', '🐇', '🌤️'],
        fire: ['🚒', '🧑‍🚒', '🧯', '🚨', '💧', '🐕', '🏢'],
        concert: ['🎸', '🥁', '🎤', '🦊', '🎵', '🎶', '✨'],
        farm: ['🚜', '🥕', '🐄', '🐖', '🌾', '🌻', '🐓'],
        circus: ['🎪', '🎩', '🤹', '🦁', '🎺', '🕊️', '✨']
      }[pal.env] || ['⭐', '🎈', '🌸', '🍀', '🌈'];

      ctx.font = '28px sans-serif';
      ctx.fillText(subIcons[0], 80, 180);
      ctx.fillText(subIcons[1], 460, 210);
      ctx.fillText(subIcons[2], 370, 310);
      ctx.restore();

      // 5개 차이점 렌더링
      diffs.forEach(diff => {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (diff.id === 0) {
          // [차이점 0] 색상/라이트 차이
          ctx.fillStyle = isRight ? '#f59e0b' : '#3b82f6';
          ctx.beginPath();
          ctx.arc(diff.x, diff.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();
          ctx.font = '16px sans-serif';
          ctx.fillText(isRight ? '⭐' : '🔵', diff.x, diff.y);
        } else if (diff.id === 1) {
          // [차이점 1] 메인 캐릭터/패턴 차이
          ctx.font = '32px sans-serif';
          const iconA = subIcons[3] || '🎈';
          const iconB = subIcons[4] || '🎁';
          ctx.fillText(isRight ? iconB : iconA, diff.x, diff.y);
        } else if (diff.id === 2) {
          // [차이점 2] 배경 구름/하늘 오브젝트
          if (isRight) {
            this.drawHeart(ctx, diff.x, diff.y, 26, '#ffffff');
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(diff.x - 12, diff.y, 13, 0, Math.PI * 2);
            ctx.arc(diff.x + 4, diff.y - 6, 17, 0, Math.PI * 2);
            ctx.arc(diff.x + 18, diff.y, 13, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (diff.id === 3) {
          // [차이점 3] 개수 차이 (사과/열매/별 3개 vs 2개)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(diff.x - 12, diff.y - 4, 7, 0, Math.PI * 2);
          ctx.arc(diff.x + 12, diff.y - 4, 7, 0, Math.PI * 2);
          if (!isRight) {
            ctx.arc(diff.x, diff.y + 10, 7, 0, Math.PI * 2);
          }
          ctx.fill();
        } else if (diff.id === 4) {
          // [차이점 4] 액세서리 차이 (모자, 리본, 안경)
          ctx.font = '28px sans-serif';
          const charIcon = subIcons[5] || '🐱';
          ctx.fillText(charIcon, diff.x, diff.y + 6);
          if (isRight) {
            ctx.font = '16px sans-serif';
            ctx.fillText('🎀', diff.x, diff.y - 14);
          }
        }
        ctx.restore();
      });
    }

    // 이미 찾은 차이점에 초록색 체크 원 표시
    diffs.forEach(diff => {
      if (foundSet.has(diff.id)) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.radius + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.fill();

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✓', diff.x, diff.y);
        ctx.restore();
      }
    });

    // 힌트 펄스 애니메이션 마커
    if (this.spotHintPos) {
      ctx.save();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(this.spotHintPos.x, this.spotHintPos.y, 38, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔍', this.spotHintPos.x, this.spotHintPos.y);
      ctx.restore();
    }
  };

  EduApp.prototype.drawHeart = function(ctx, x, y, size, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    const d = size / 2;
    ctx.moveTo(x, y + d * 0.7);
    ctx.bezierCurveTo(x, y, x - d, y, x - d, y + d * 0.7);
    ctx.bezierCurveTo(x - d, y + d * 1.4, x, y + d * 1.8, x, y + d * 2.2);
    ctx.bezierCurveTo(x, y + d * 1.8, x + d, y + d * 1.4, x + d, y + d * 0.7);
    ctx.bezierCurveTo(x + d, y, x, y, x, y + d * 0.7);
    ctx.fill();
    ctx.restore();
  };

  // ==========================================================================
  // 3-3. 🕵️‍♂️ 와글와글 은찬이를 찾아라! (Where's Eunchan? / 윌리를 찾아라 스타일) - 20개 다양한 테마
  // ==========================================================================
  EduApp.prototype.buildWhereScenesData = function() {
    return {
      theme_0: {
        id: 'theme_0',
        title: '🎡 1. 와글와글 놀이공원 대축제',
        badge: '🎡 테마 1',
        themeType: 'park',
        targets: [
          { id: 't_eunchan', name: '빨간 줄무늬 은찬이', icon: '👦', x: 520, y: 390, clue: '대관람차와 솜사탕 근처에서 신나게 손을 흔들고 있어요!' },
          { id: 't_cat', name: '핑크 선글라스 고양이', icon: '🐱', x: 230, y: 220, clue: '바이킹 배 지붕 위를 조심스럽게 올려다보세요!' },
          { id: 't_bear', name: '무지개 풍선 든 아기 곰', icon: '🐻', x: 880, y: 440, clue: '회전목마 옆 풍선 스탠드 근처에서 풍선을 쥐고 있어요!' },
          { id: 't_key', name: '황금 보물 열쇠', icon: '🗝️', x: 1060, y: 560, clue: '아이스크림 카트 바퀴 아래 반짝반짝 빛나고 있어요!' },
          { id: 't_dog', name: '탐정 망토 강아지', icon: '🐶', x: 350, y: 520, clue: '분수대 벤치에서 돋보기를 들고 탐정 흉내를 내고 있어요!' }
        ]
      },
      theme_1: {
        id: 'theme_1',
        title: '🌊 2. 신비한 바닷속 산호초 파티',
        badge: '🌊 테마 2',
        themeType: 'ocean',
        targets: [
          { id: 't_eunchan', name: '잠수부 은찬이', icon: '🤿', x: 740, y: 310, clue: '노란 잠수함 창문 옆에서 물안경을 끼고 헤엄치고 있어요!' },
          { id: 't_fish', name: '황금 왕관 복어', icon: '🐡', x: 310, y: 190, clue: '해파리 숲 위쪽에서 반짝이는 왕관을 쓰고 둥둥 떠 있어요!' },
          { id: 't_pearl', name: '조개 속 무지개 진주', icon: '💎', x: 180, y: 540, clue: '보라색 거대 조개껍질 속에서 오색 빛을 뿜고 있어요!' },
          { id: 't_octopus', name: '파티 모자 문어', icon: '🐙', x: 960, y: 430, clue: '산호초 바위 뒤에서 8개의 다리로 춤추고 있어요!' },
          { id: 't_bottle', name: '유리병 속 보물 지도', icon: '🗺️', x: 530, y: 560, clue: '모래사장 해초 덤불 사이에 숨겨져 있답니다!' }
        ]
      },
      theme_2: {
        id: 'theme_2',
        title: '🦁 3. 복작복작 사파리 동물원',
        badge: '🦁 테마 3',
        themeType: 'safari',
        targets: [
          { id: 't_eunchan', name: '탐험가 은찬이', icon: '🧭', x: 380, y: 330, clue: '사파리 지프차 보닛 옆에서 망원경을 들고 관찰하고 있어요!' },
          { id: 't_lion', name: '선글라스 아기 사자', icon: '🦁', x: 820, y: 260, clue: '사자 바위 그늘 아래에서 멋진 선글라스를 끼고 있어요!' },
          { id: 't_panda', name: '대나무 하트 아기 팬더', icon: '🐼', x: 190, y: 460, clue: '대나무 숲 평상에서 하트 모양 대나무 잎을 쥐고 있어요!' },
          { id: 't_dad', name: '카메라 든 정연수 아빠', icon: '👨', x: 1020, y: 490, clue: '기린 타워 앞에서 은찬이의 멋진 모습을 찰칵 찍고 있어요!' },
          { id: 't_bird', name: '오색 깃털 앵무새', icon: '🦜', x: 610, y: 150, clue: '폭포 위 큰 나무 나뭇가지 꼭대기에 앉아 있어요!' }
        ]
      },
      theme_3: {
        id: 'theme_3',
        title: '🚀 4. 반짝반짝 은하수 우주정거장',
        badge: '🚀 테마 4',
        themeType: 'space',
        targets: [
          { id: 't_eunchan', name: '우주비행사 은찬이', icon: '👨‍🚀', x: 460, y: 280, clue: '우주 왕복선 해치 문 앞에서 헬멧을 쓰고 손을 흔들어요!' },
          { id: 't_alien', name: '외계인 아기 삐뽀', icon: '👽', x: 820, y: 350, clue: '보라색 분화구 옆에서 안테나를 쫑긋 세우고 있어요!' },
          { id: 't_dad', name: '우주 망원경 든 아빠', icon: '🔭', x: 1040, y: 480, clue: '관측 돔 타워에서 토성 고리를 열심히 관찰하고 있어요!' },
          { id: 't_star', name: '황금 스타 크리스탈', icon: '⭐', x: 210, y: 510, clue: '인공위성 태양광 패널 아래에서 영롱하게 반짝여요!' },
          { id: 't_bot', name: '우주 청소 로봇', icon: '🤖', x: 670, y: 170, clue: '우주정거장 안테나 사이를 날아다니고 있어요!' }
        ]
      },
      theme_4: {
        id: 'theme_4',
        title: '🦕 5. 백악기 아기 공룡 탐험대',
        badge: '🦕 테마 5',
        themeType: 'dino',
        targets: [
          { id: 't_eunchan', name: '공룡 모자 은찬이', icon: '🦖', x: 580, y: 370, clue: '거대한 브라키오사우루스 다리 뒤에서 웃고 있어요!' },
          { id: 't_pterodactyl', name: '날개 펄럭 아기 프테라', icon: '🦅', x: 310, y: 140, clue: '화산 바위 절벽 위에서 큰 날개를 펄럭이고 있어요!' },
          { id: 't_triceratops', name: '알 품는 엄마 트리케라', icon: '🦕', x: 850, y: 430, clue: '따뜻한 고사리 덤불 둥지에서 아기알을 돌보고 있어요!' },
          { id: 't_amber', name: '황금 호박 공룡 화석', icon: '🔮', x: 160, y: 550, clue: '시냇물 조약돌 틈 사이에 반짝이는 노란 호박 보석이에요!' },
          { id: 't_dad', name: '캠핑 쌍안경 아빠', icon: '🏕️', x: 1010, y: 490, clue: '탐험 텐트 앞에서 쌍안경으로 공룡을 스케치하고 있어요!' }
        ]
      },
      theme_5: {
        id: 'theme_5',
        title: '🍬 6. 달콤새콤 과자 & 젤리 왕국',
        badge: '🍬 테마 6',
        themeType: 'candy',
        targets: [
          { id: 't_eunchan', name: '파티셰 모자 은찬이', icon: '👨‍🍳', x: 490, y: 340, clue: '대형 딸기 생크림 케이크 계단 앞에서 숟가락을 들고 있어요!' },
          { id: 't_ginger', name: '거대 딸기 든 진저쿠키', icon: '🍪', x: 230, y: 420, clue: '초콜릿 쿠키 벽돌집 문앞에서 딸기를 안고 있어요!' },
          { id: 't_bear', name: '마시멜로 아기 곰', icon: '🧸', x: 830, y: 280, clue: '솜사탕 구름 미끄럼틀 위에서 폭신폭신 쉬고 있어요!' },
          { id: 't_candy', name: '황금 롤리팝 사탕', icon: '🍭', x: 1060, y: 520, clue: '젤리빈 분수대 옆 잔디밭에 꽂혀 있답니다!' },
          { id: 't_mom', name: '초콜릿 맛보는 엄마', icon: '👩', x: 680, y: 470, clue: '와플 테이블에서 은찬이에게 줄 쿠키를 고르고 있어요!' }
        ]
      },
      theme_6: {
        id: 'theme_6',
        title: '❄️ 7. 펭귄과 루돌프 눈꽃 겨울나라',
        badge: '❄️ 테마 7',
        themeType: 'winter',
        targets: [
          { id: 't_eunchan', name: '털모자 썰매 은찬이', icon: '🛷', x: 530, y: 390, clue: '완만한 눈 언덕에서 붉은 썰매를 타고 씽씽 달려요!' },
          { id: 't_snowman', name: '목도리 칭칭 눈사람', icon: '⛄', x: 280, y: 460, clue: '얼음 이글루 마당에서 주황 당근 코를 뽐내고 있어요!' },
          { id: 't_deer', name: '선물상자 루돌프', icon: '🦌', x: 890, y: 320, clue: '크리스마스트리 숲 사이에서 빨간 코를 뽐내고 있어요!' },
          { id: 't_crystal', name: '얼음 보석 결정', icon: '❄️', x: 170, y: 230, clue: '고드름 절벽 끝에서 은빛 다이아몬드처럼 빛나요!' },
          { id: 't_dad', name: '따뜻한 코코아 든 아빠', icon: '☕', x: 1030, y: 510, clue: '모닥불 쉼터 벤치에서 김이 모락모락 코코아를 들고 있어요!' }
        ]
      },
      theme_7: {
        id: 'theme_7',
        title: '🌴 8. 깊은 아마존 신비의 숲',
        badge: '🌴 테마 8',
        themeType: 'jungle',
        targets: [
          { id: 't_eunchan', name: '정글 모자 은찬이', icon: '👒', x: 420, y: 360, clue: '흔들 다리 입구에서 나침반을 보며 길을 찾고 있어요!' },
          { id: 't_monkey', name: '하트 꼬리 원숭이', icon: '🐒', x: 770, y: 230, clue: '덩굴 타잔 줄에 대롱대롱 매달려 바나나를 먹어요!' },
          { id: 't_toucan', name: '나뭇잎 왕관 투칸', icon: '🦜', x: 210, y: 160, clue: '키 큰 야자수 잎사귀 꼭대기에 앉아 지저귀고 있어요!' },
          { id: 't_relic', name: '황금 잉카 유물 나침반', icon: '🧭', x: 930, y: 540, clue: '신전 돌계단 틈 사이 덩굴에 감싸여 반짝여요!' },
          { id: 't_dad', name: '지도 펼친 아빠', icon: '🗺️', x: 610, y: 480, clue: '고대 유적지 석탑 앞에서 비밀 지도를 해독하고 있어요!' }
        ]
      },
      theme_8: {
        id: 'theme_8',
        title: '🏰 9. 동화 속 마법 요정의 궁전',
        badge: '🏰 테마 9',
        themeType: 'castle',
        targets: [
          { id: 't_eunchan', name: '별빛 망토 마법사 은찬이', icon: '🧙‍♂️', x: 600, y: 310, clue: '대리석 분수대 난간에서 요술 지팡이로 별가루를 뿌려요!' },
          { id: 't_fairy', name: '요술봉 아기 요정', icon: '🧚‍♀️', x: 340, y: 210, clue: '장미 덩굴 아치문 위를 날아다니고 있어요!' },
          { id: 't_owl', name: '안경 쓴 지혜 부엉이', icon: '🦉', x: 880, y: 170, clue: '도서관 높은 탑 창틀에서 두꺼운 마법책을 읽고 있어요!' },
          { id: 't_shoe', name: '다이아몬드 유리구두', icon: '👠', x: 190, y: 520, clue: '호박 마차 바퀴 옆 레드카펫 끝에 놓여 있어요!' },
          { id: 't_king', name: '왕관 쓴 친절한 국왕', icon: '👑', x: 1040, y: 440, clue: '궁전 테라스에서 따뜻하게 손을 흔들어 맞이해줘요!' }
        ]
      },
      theme_9: {
        id: 'theme_9',
        title: '🤖 10. 미래 하이테크 사이버 시티',
        badge: '🤖 테마 10',
        themeType: 'robot',
        targets: [
          { id: 't_eunchan', name: '사이버 고글 은찬이', icon: '🥽', x: 510, y: 350, clue: '하늘을 나는 에어택시 정류장에서 멋진 고글을 쓰고 있어요!' },
          { id: 't_droid', name: '안내 바퀴 안드로이드', icon: '🤖', x: 260, y: 430, clue: '홀로그램 도로 중앙에서 길을 친절히 안내해요!' },
          { id: 't_cat', name: '홀로그램 핑크 고양이', icon: '🐱', x: 820, y: 220, clue: '네온사인 전광판 지붕 위에서 빛나고 있어요!' },
          { id: 't_core', name: '무한 동력 황금 코어', icon: '🔋', x: 150, y: 540, clue: '충전 스테이션 캡슐 안에서 번쩍이고 있어요!' },
          { id: 't_dad', name: '드론 조종기 든 아빠', icon: '🎮', x: 1020, y: 370, clue: '스카이라운지 데크에서 촬영 드론을 조종하고 있어요!' }
        ]
      },
      theme_10: {
        id: 'theme_10',
        title: '⚽ 11. 와글와글 학교 체육대회',
        badge: '⚽ 테마 11',
        themeType: 'sports',
        targets: [
          { id: 't_eunchan', name: '1등 번호표 은찬이', icon: '🏃‍♂️', x: 470, y: 370, clue: '결승선 테이프를 향해 힘차게 달려가는 중이에요!' },
          { id: 't_bear', name: '대형 응원 깃발 곰돌이', icon: '🚩', x: 220, y: 280, clue: '청군 응원석 맨 앞줄에서 펄럭펄럭 깃발을 흔들어요!' },
          { id: 't_referee', name: '호루라기 심판 코알라', icon: '🐨', x: 780, y: 330, clue: '트랙 중앙선에서 호루라기를 입에 물고 경기를 지켜봐요!' },
          { id: 't_cup', name: '번쩍이는 황금 우승컵', icon: '🏆', x: 1050, y: 480, clue: '중앙 시상대 테이블 위 붉은 보자기 위에 놓여 있어요!' },
          { id: 't_dad', name: '확성기 응원단장 아빠', icon: '📢', x: 890, y: 510, clue: '백군 응원석에서 은찬이 이름을 목청껏 외치고 있어요!' }
        ]
      },
      theme_11: {
        id: 'theme_11',
        title: '🏖️ 12. 시원한 야자수 모래 해변',
        badge: '🏖️ 테마 12',
        themeType: 'beach',
        targets: [
          { id: 't_eunchan', name: '스노클링 은찬이', icon: '🏊‍♂️', x: 620, y: 380, clue: '에메랄드빛 얕은 파도 속에서 스노클을 물고 있어요!' },
          { id: 't_crab', name: '선글라스 아기 꽃게', icon: '🦀', x: 290, y: 520, clue: '모래성 해자 옆에서 집게발을 흔들고 있어요!' },
          { id: 't_dolphin', name: '점프하는 무지개 돌고래', icon: '🐬', x: 850, y: 240, clue: '수평선 바다 위로 시원하게 물보라를 뿜으며 뛰어요!' },
          { id: 't_pearl', name: '조개 속 분홍 진주', icon: '🦪', x: 140, y: 470, clue: '비치체어 그늘 아래 예쁜 조개껍데기 속에 숨어있어요!' },
          { id: 't_dad', name: '파라솔 아래 아빠', icon: '⛱️', x: 1020, y: 460, clue: '시원한 수박 주스를 마시며 은찬이를 흐뭇하게 바라봐요!' }
        ]
      },
      theme_12: {
        id: 'theme_12',
        title: '🏫 13. 은찬이네 행복한 초등학교',
        badge: '🏫 테마 13',
        themeType: 'school',
        targets: [
          { id: 't_eunchan', name: '책가방 멘 은찬이', icon: '🎒', x: 530, y: 360, clue: '중앙 현관 분수대 앞에서 친구들에게 반갑게 인사해요!' },
          { id: 't_rabbit', name: '하모니카 부는 토끼', icon: '🐰', x: 810, y: 230, clue: '2층 음악실 창가에서 맑은 하모니카 소리를 연주해요!' },
          { id: 't_friend', name: '돋보기 든 척척박사 친구', icon: '👓', x: 310, y: 410, clue: '화단 속 무당벌레를 돋보기로 신기하게 관찰해요!' },
          { id: 't_paper', name: '100점 맞은 황금 시험지', icon: '💯', x: 170, y: 520, clue: '도서관 게시판 칭찬 코너에 멋지게 붙어있어요!' },
          { id: 't_dad', name: '교문 앞 마중 나온 아빠', icon: '🚗', x: 1040, y: 470, clue: '정문 시계탑 아래에서 은찬이를 기다리며 손을 흔들어요!' }
        ]
      },
      theme_13: {
        id: 'theme_13',
        title: '🛒 14. 복작복작 행복 대형 마트',
        badge: '🛒 테마 14',
        themeType: 'market',
        targets: [
          { id: 't_eunchan', name: '쇼핑카트 끄는 은찬이', icon: '🛒', x: 440, y: 390, clue: '맛있는 유기농 과일 코너 앞에서 카트를 밀고 있어요!' },
          { id: 't_chef', name: '시식 코너 햄스터 셰프', icon: '🐹', x: 760, y: 340, clue: '노릇노릇 만두를 구우며 맛보라고 손짓하고 있어요!' },
          { id: 't_cat', name: '과일 상자 위 아기 고양이', icon: '🐈', x: 220, y: 260, clue: '사과 박스 더미 꼭대기에서 꼬리를 살랑살랑 흔들어요!' },
          { id: 't_ticket', name: '황금 VIP 할인 쿠폰', icon: '🎟️', x: 1070, y: 530, clue: '계산대 카운터 모니터 옆에 반짝반짝 꽂혀 있어요!' },
          { id: 't_dad', name: '영수증 꼼꼼히 보는 아빠', icon: '🧾', x: 910, y: 490, clue: '장바구니를 든 채 알뜰하게 할인 내역을 확인해요!' }
        ]
      },
      theme_14: {
        id: 'theme_14',
        title: '🚂 15. 낭만 가득 중앙 기차역',
        badge: '🚂 테마 15',
        themeType: 'train',
        targets: [
          { id: 't_eunchan', name: '기관사 모자 은찬이', icon: '🚂', x: 490, y: 320, clue: '증기기관차 운전실 창문에서 칙칙폭폭 손을 흔들어요!' },
          { id: 't_bear', name: '시계 보는 곰돌이 역장', icon: '🐻', x: 820, y: 360, clue: '1번 플랫폼 출발 신호기 아래에서 회중시계를 확인해요!' },
          { id: 't_cat', name: '악기 가방 멘 여행객 고양이', icon: '🎸', x: 260, y: 440, clue: '대합실 벤치에서 기타를 치며 기차를 기다려요!' },
          { id: 't_ticket', name: '황금빛 골든 익스프레스 티켓', icon: '🎫', x: 1040, y: 530, clue: '개찰구 자동 차단기 옆 바닥에 떨어져 반짝여요!' },
          { id: 't_dad', name: '기차표 확인하는 아빠', icon: '👨', x: 680, y: 480, clue: '매점 옆에서 은찬이와 탈 열차 좌석 번호를 보고 있어요!' }
        ]
      },
      theme_15: {
        id: 'theme_15',
        title: '✈️ 16. 하늘 높이 세계 여행 공항',
        badge: '✈️ 테마 16',
        themeType: 'airport',
        targets: [
          { id: 't_eunchan', name: '캐리어 끄는 파일럿 은찬이', icon: '🛫', x: 540, y: 370, clue: '탑승구 게이트 앞 통로에서 파란 캐리어를 끌고 있어요!' },
          { id: 't_squirrel', name: '승무원 다람쥐', icon: '🐿️', x: 310, y: 320, clue: '기내식 카트를 밀며 손님들에게 오렌지 주스를 건네요!' },
          { id: 't_panda', name: '여권 챙기는 판다', icon: '🐼', x: 860, y: 410, clue: '출국 심사대 줄에서 초록색 모자를 쓰고 기다리고 있어요!' },
          { id: 't_passport', name: '황금 여권 케이스', icon: '🛂', x: 180, y: 540, clue: '환전소 앞 벤치 틈에 황금빛으로 놓여 있어요!' },
          { id: 't_dad', name: '면세점 선물 상자 든 아빠', icon: '🎁', x: 1030, y: 480, clue: '은찬이가 좋아하는 장난감 비행기 상자를 들고 웃어요!' }
        ]
      },
      theme_16: {
        id: 'theme_16',
        title: '🚒 17. 삐뽀삐뽀 용감한 119 소방서',
        badge: '🚒 테마 17',
        themeType: 'fire',
        targets: [
          { id: 't_eunchan', name: '소방관 헬멧 쓴 은찬이', icon: '🧑‍🚒', x: 470, y: 350, clue: '반짝이는 빨간 소방차 문 옆에서 경례하고 있어요!' },
          { id: 't_dog', name: '소방 마스코트 달마시안', icon: '🐕', x: 240, y: 450, clue: '소방서 앞마당 잔디에서 구조 배낭을 메고 서 있어요!' },
          { id: 't_chief', name: '사다리차 위 든든한 대장님', icon: '👨‍🚒', x: 790, y: 210, clue: '높이 뻗은 구조 사다리 바스켓 위에서 지휘하고 있어요!' },
          { id: 't_extinguisher', name: '황금 소화기', icon: '🧯', x: 1050, y: 520, clue: '소방 장비 보관함 유리 진열대 안에서 빛나요!' },
          { id: 't_dad', name: '격려 박수 치는 아빠', icon: '👏', x: 670, y: 470, clue: '소방 훈련을 멋지게 마친 은찬이에게 박수를 보내요!' }
        ]
      },
      theme_17: {
        id: 'theme_17',
        title: '🎸 18. 신나는 숲속 록 페스티벌',
        badge: '🎸 테마 18',
        themeType: 'concert',
        targets: [
          { id: 't_eunchan', name: '일렉기타 연주 은찬이', icon: '🎸', x: 520, y: 330, clue: '메인 야외 무대 중앙에서 멋진 기타 솔로를 뽐내요!' },
          { id: 't_gorilla', name: '선글라스 드러머 고릴라', icon: '🦍', x: 810, y: 240, clue: '대형 앰프 뒤 드럼 세트에서 파워풀하게 드럼을 쳐요!' },
          { id: 't_rabbit', name: '야광봉 흔드는 토끼 팬', icon: '🐰', x: 320, y: 470, clue: '스탠딩 구역 맨 앞줄에서 은찬이 팬클럽 야광봉을 흔들어요!' },
          { id: 't_trophy', name: '황금 높은음자리표 트로피', icon: '🏆', x: 160, y: 530, clue: '심사위원석 테이블 위 벨벳 쿠션에 놓여 있어요!' },
          { id: 't_dad', name: '캠코더 촬영 중인 아빠', icon: '📹', x: 1010, y: 480, clue: '객석 뒤 삼각대에서 은찬이의 공연 영상을 정성껏 담아요!' }
        ]
      },
      theme_18: {
        id: 'theme_18',
        title: '🚜 19. 무럭무럭 평화로운 동물 농장',
        badge: '🚜 테마 19',
        themeType: 'farm',
        targets: [
          { id: 't_eunchan', name: '밀짚모자 농부 은찬이', icon: '🧑‍🌾', x: 450, y: 370, clue: '빨간 멜빵바지를 입고 초록 배추밭에 물을 주고 있어요!' },
          { id: 't_rabbit', name: '당근 갉아먹는 아기 토끼', icon: '🐇', x: 210, y: 460, clue: '주황 당근 두둑 사이에서 귀를 쫑긋거리며 오물오물해요!' },
          { id: 't_cow', name: '방울 단 아기 젖소', icon: '🐄', x: 840, y: 390, clue: '목장 나무 울타리 옆에서 신선한 풀을 뜯고 있어요!' },
          { id: 't_pumpkin', name: '황금 왕호박 바구니', icon: '🎃', x: 1060, y: 530, clue: '헛간 수레 뒤에 탐스럽게 놓여 노란 빛을 뿜어요!' },
          { id: 't_dad', name: '트랙터 운전하는 아빠', icon: '🚜', x: 690, y: 470, clue: '밭 고랑을 갈며 은찬이에게 활짝 웃으며 손을 흔들어요!' }
        ]
      },
      theme_19: {
        id: 'theme_19',
        title: '🎪 20. 환상적인 매직 서커스 천막',
        badge: '🎪 테마 20',
        themeType: 'circus',
        targets: [
          { id: 't_eunchan', name: '실크햇 마술사 은찬이', icon: '🎩', x: 530, y: 330, clue: '중앙 링 마술 테이블에서 비둘기를 날리는 중이에요!' },
          { id: 't_seal', name: '공 굴리는 아기 물개', icon: '🦭', x: 250, y: 460, clue: '원형 발판 위에서 알록달록 무지개 공을 코로 굴려요!' },
          { id: 't_clown', name: '외발자전거 타는 피에로', icon: '🤡', x: 830, y: 270, clue: '공중 줄타기 트랙 아래에서 저글링을 하며 자전거를 타요!' },
          { id: 't_wand', name: '마법의 황금 별 요술봉', icon: '🪄', x: 170, y: 540, clue: '서커스 분장실 트렁크 가방 뚜껑 위에 놓여 반짝여요!' },
          { id: 't_dad', name: '환호하며 기립박수 치는 아빠', icon: '🙌', x: 1020, y: 490, clue: 'VIP 관람석 앞줄에서 은찬이 마술에 열렬히 환호해요!' }
        ]
      }
    };
  };

  EduApp.prototype.initWhereScenes = function() {
    // 호환성 처리 (이전 park, ocean, safari 등의 키를 theme_0, theme_1, theme_2로 매핑)
    if (this.whereSceneIdx === 'park') this.whereSceneIdx = 'theme_0';
    else if (this.whereSceneIdx === 'ocean') this.whereSceneIdx = 'theme_1';
    else if (this.whereSceneIdx === 'safari') this.whereSceneIdx = 'theme_2';
    else if (!this.whereSceneIdx) this.whereSceneIdx = 'theme_0';

    this.whereFoundTargets = this.whereFoundTargets || {};
    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();

    if (!this.whereScenesInitialized) {
      this.whereScenes = this.buildWhereScenesData();
      this.whereScenesInitialized = true;
      this.setupWhereClickListeners();
    }

    this.renderWhereSceneButtons();
  };

  EduApp.prototype.renderWhereSceneButtons = function() {
    const container = document.getElementById('whereThemeButtons');
    if (!container || !this.whereScenes) return;

    const sceneKeys = Object.keys(this.whereScenes);
    if (container.children.length !== sceneKeys.length) {
      container.innerHTML = sceneKeys.map((key) => {
        const sc = this.whereScenes[key];
        return `
          <button class="btn-where-theme ${key === this.whereSceneIdx ? 'active' : ''}" data-scene="${key}" onclick="app.selectWhereScene('${key}')">
            <span>${sc.title}</span>
          </button>
        `;
      }).join('');
    } else {
      Array.from(container.children).forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.scene === this.whereSceneIdx);
      });
    }
  };

  EduApp.prototype.setupWhereClickListeners = function() {
    const canvas = document.getElementById('whereCanvas');
    if (!canvas) return;
    canvas.addEventListener('click', (e) => this.handleWhereCanvasClick(e));
  };

  EduApp.prototype.selectWhereScene = function(sceneId) {
    this.playPop();
    if (sceneId === 'park') sceneId = 'theme_0';
    if (sceneId === 'ocean') sceneId = 'theme_1';
    if (sceneId === 'safari') sceneId = 'theme_2';

    this.whereSceneIdx = sceneId;
    this.whereFoundTargets = this.whereFoundTargets || {};
    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();

    this.renderWhereSceneButtons();

    const activeBtn = document.querySelector(`.btn-where-theme[data-scene="${sceneId}"]`);
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }

    const overlay = document.getElementById('whereWinOverlay');
    if (overlay) overlay.style.display = 'none';

    this.renderWhereScene();
  };

  EduApp.prototype.handleWhereCanvasClick = function(e) {
    const canvas = document.getElementById('whereCanvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 1200 / rect.width;
    const scaleY = 650 / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (!this.whereScenes) return;
    const curScene = this.whereScenes[this.whereSceneIdx];
    if (!curScene) return;

    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();
    const foundSet = this.whereFoundTargets[this.whereSceneIdx];

    let foundTarget = null;
    curScene.targets.forEach(target => {
      if (!foundSet.has(target.id)) {
        const dist = Math.hypot(clickX - target.x, clickY - target.y);
        if (dist <= 44) {
          foundTarget = target;
        }
      }
    });

    if (foundTarget) {
      foundSet.add(foundTarget.id);
      this.playSuccess();
      this.speak(`찾았다! ${foundTarget.name}!`, 'ko-KR');
      this.renderWhereScene();

      if (foundSet.size === curScene.targets.length) {
        setTimeout(() => {
          this.playFanfare();
          this.triggerConfetti();
          const overlay = document.getElementById('whereWinOverlay');
          if (overlay) overlay.style.display = 'flex';
          this.speak('대단해요 은찬아! 모든 숨은 친구와 보물을 하나도 빠짐없이 찾아냈어요! 은찬이는 최고의 명탐정!', 'ko-KR');
        }, 400);
      }
    } else {
      this.playBeep(330, 'sine', 0.08, 0.08);
    }
  };

  EduApp.prototype.showWhereHint = function() {
    this.playPop();
    if (!this.whereScenes) return;
    const curScene = this.whereScenes[this.whereSceneIdx];
    if (!curScene) return;

    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();
    const foundSet = this.whereFoundTargets[this.whereSceneIdx];

    const unfound = curScene.targets.find(t => !foundSet.has(t.id));
    if (unfound) {
      this.whereHintTargetId = unfound.id;
      this.renderWhereScene();

      const scrollBox = document.getElementById('whereScrollBox');
      if (scrollBox) {
        const targetScrollLeft = Math.max(0, unfound.x - scrollBox.clientWidth / 2);
        scrollBox.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
      }

      this.speak(unfound.clue, 'ko-KR');

      setTimeout(() => {
        this.whereHintTargetId = null;
        this.renderWhereScene();
      }, 2800);
    }
  };

  EduApp.prototype.resetWhereScene = function() {
    this.playPop();
    if (this.whereFoundTargets && this.whereFoundTargets[this.whereSceneIdx]) {
      this.whereFoundTargets[this.whereSceneIdx].clear();
    }
    const overlay = document.getElementById('whereWinOverlay');
    if (overlay) overlay.style.display = 'none';
    this.renderWhereScene();
  };

  EduApp.prototype.nextWhereScene = function() {
    this.playPop();
    if (!this.whereScenes) return;
    const sceneKeys = Object.keys(this.whereScenes);
    const curIdx = sceneKeys.indexOf(this.whereSceneIdx);
    const nextKey = sceneKeys[(curIdx + 1) % sceneKeys.length];
    this.selectWhereScene(nextKey);
  };

  EduApp.prototype.renderWhereScene = function() {
    this.initWhereScenes();
    const curScene = this.whereScenes[this.whereSceneIdx];
    if (!curScene) return;

    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();
    const foundSet = this.whereFoundTargets[this.whereSceneIdx];

    // 1. HUD 타깃 카드 렌더링
    const countElem = document.getElementById('whereFoundCount');
    if (countElem) countElem.textContent = foundSet.size;

    const grid = document.getElementById('whereTargetsGrid');
    if (grid) {
      grid.innerHTML = curScene.targets.map(t => {
        const isFound = foundSet.has(t.id);
        return `
          <div class="where-target-item ${isFound ? 'found' : ''}" onclick="app.speak('${t.clue.replace(/'/g, "\\'")}', 'ko-KR')">
            <span class="where-target-icon">${t.icon}</span>
            <div class="where-target-details">
              <span class="where-target-name">${t.name}</span>
              <span class="where-target-status">${isFound ? '✅ 찾음!' : '🔍 찾는 중'}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. 대형 파노라마 캔버스 렌더링
    const canvas = document.getElementById('whereCanvas');
    if (!canvas) return;

    this.drawWhereScene(canvas, this.whereSceneIdx, foundSet, curScene.targets, curScene.themeType);
  };

  EduApp.prototype.drawWhereScene = function(canvas, sceneId, foundSet, targets, themeType) {
    const ctx = canvas.getContext('2d');
    const w = 1200;
    const h = 650;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    // 20개 테마별 파노라마 색상 & 무대 배경 구성
    const themeVisuals = {
      park: {
        sky: ['#67e8f9', '#e0f2fe'],
        ground: '#86efac',
        path: '#fde68a',
        crowd: ['👨‍👩‍👧', '🏃‍♂️', '🚶‍♀️', '💃', '🕺', '👧', '👦', '👵', '👴', '🐶', '🐩', '🐱', '🐦', '🐰', '🐼', '🐯', '🐧', '🎈', '🍿', '🍦', '🎪']
      },
      ocean: {
        sky: ['#38bdf8', '#0284c7'],
        ground: '#082f49',
        path: '#fef08a',
        crowd: ['🐟', '🐠', '🐡', '🐬', '🐳', '🦈', '🦭', '🦀', '🦞', '🦐', '🦑', '🪼', '🐢', '🫧', '🐚', '🪸', '🐙', '🌊', '⚓', '🟡']
      },
      safari: {
        sky: ['#fef08a', '#fed7aa'],
        ground: '#65a30d',
        path: '#d97706',
        crowd: ['🐒', '🦍', '🦧', '🦘', '🦙', '🦔', '🦥', '🦦', '🦨', '🦩', '🦚', '🦜', '🐊', '🌴', '🌲', '🌿', '🪵', '🦒', '🐘', '🦓']
      },
      space: {
        sky: ['#0f172a', '#1e1b4b'],
        ground: '#312e81',
        path: '#4338ca',
        crowd: ['🪐', '⭐', '🛰️', '🛸', '👨‍🚀', '✨', '🌍', '☄️', '🌙', '🔭', '🚀', '👽', '👾', '🌟', '💫', '🟣', '🔷']
      },
      dino: {
        sky: ['#fef08a', '#dcfce7'],
        ground: '#15803d',
        path: '#b45309',
        crowd: ['🌋', '🌴', '🌿', '🥚', '🦕', '🦖', '🦋', '🦎', '🌲', '🌾', '🐾', '🪨', '🦅', '🍀', '✨', '🔥']
      },
      candy: {
        sky: ['#fce7f3', '#ffe4e6'],
        ground: '#fbcfe8',
        path: '#f472b6',
        crowd: ['🧁', '🍪', '🍭', '🍩', '🍫', '🍬', '🍓', '🍰', '🧇', '🥞', '🍮', '🍡', '🍦', '🍒', '🍯', '🎀']
      },
      winter: {
        sky: ['#e0f2fe', '#bae6fd'],
        ground: '#f8fafc',
        path: '#cbd5e1',
        crowd: ['⛄', '🐧', '❄️', '🦌', '🎄', '🛷', '🧊', '🧤', '🧣', '🎿', '🏂', '🐻‍❄️', '🔔', '🕯️', '🌨️', '✨']
      },
      jungle: {
        sky: ['#a7f3d0', '#6ee7b7'],
        ground: '#166534',
        path: '#92400e',
        crowd: ['🌴', '🐒', '🌺', '🐸', '🐍', '🦜', '🌧️', '🐆', '🦋', '🦎', '🌳', '🎋', '🍃', '☀️', '💧', '🪵']
      },
      castle: {
        sky: ['#fbcfe8', '#e0e7ff'],
        ground: '#86efac',
        path: '#fed7aa',
        crowd: ['🏰', '🌈', '🦢', '⛲', '🧚', '💎', '👑', '🐴', '🌹', '🪞', '🕯️', '🪄', '🛡️', '⚔️', '🕊️', '💐']
      },
      robot: {
        sky: ['#0369a1', '#0f172a'],
        ground: '#1e293b',
        path: '#06b6d4',
        crowd: ['🤖', '🔋', '⚙️', '💻', '💡', '📡', '🕹️', '📟', '🔌', '🖲️', '🥽', '🚘', '🚁', '🛰️', '⚡', '🔷']
      },
      sports: {
        sky: ['#bae6fd', '#fed7aa'],
        ground: '#22c55e',
        path: '#ef4444',
        crowd: ['⚽', '🏃', '🏆', '🏁', '🥇', '🏀', '🎉', '⚾', '🎾', '🏐', '👟', '📣', '🎈', '🎪', '🚴', '🎽']
      },
      beach: {
        sky: ['#7dd3fc', '#fef08a'],
        ground: '#fde047',
        path: '#38bdf8',
        crowd: ['🏖️', '🏄', '🦀', '🐬', '🥥', '🦪', '☀️', '🍉', '🌴', '🤿', '⛵', '🩴', '🕶️', '🐚', '⛱️', '🪸']
      },
      school: {
        sky: ['#fef3c7', '#dcfce7'],
        ground: '#cbd5e1',
        path: '#fbbf24',
        crowd: ['🏫', '📚', '🎒', '✏️', '🎨', '📐', '👦', '👧', '👩‍🏫', '🎹', '🏀', '🔬', '🌍', '📝', '🔔', '🍎']
      },
      market: {
        sky: ['#fed7aa', '#ffedd5'],
        ground: '#f1f5f9',
        path: '#fb923c',
        crowd: ['🛒', '🍎', '🍌', '🍉', '🍞', '🧀', '🏪', '🥕', '🍇', '🥛', '🥩', '🍕', '🥫', '📦', '🧾', '🛍️']
      },
      train: {
        sky: ['#93c5fd', '#dbeafe'],
        ground: '#475569',
        path: '#94a3b8',
        crowd: ['🚂', '🛤️', '🐻', '🧳', '🔔', '🎫', '☁️', '🚃', '🎩', '📦', '🪑', '⏰', '🥖', '☕', '📰', '🏮']
      },
      airport: {
        sky: ['#60a5fa', '#93c5fd'],
        ground: '#64748b',
        path: '#cbd5e1',
        crowd: ['✈️', '🛫', '🧳', '🌐', '📡', '🐇', '🌤️', '🛬', '🛂', '☕', '🏬', '🛍️', '🎫', '💺', '📻', '🗼']
      },
      fire: {
        sky: ['#fed7aa', '#fca5a5'],
        ground: '#334155',
        path: '#ef4444',
        crowd: ['🚒', '🧑‍🚒', '🧯', '🚨', '💧', '🐕', '🏢', '🪜', '🪓', '📻', '📢', '🚑', '🦺', '🪖', '🔥', '✨']
      },
      concert: {
        sky: ['#c084fc', '#3b0764'],
        ground: '#166534',
        path: '#ec4899',
        crowd: ['🎸', '🥁', '🎤', '🦊', '🎵', '🎶', '✨', '🎹', '🎷', '🎺', '🪩', '🐰', '🐻', '💡', '🎉', '🕶️']
      },
      farm: {
        sky: ['#fde047', '#bbf7d0'],
        ground: '#854d0e',
        path: '#ca8a04',
        crowd: ['🚜', '🥕', '🐄', '🐖', '🌾', '🌻', '🐓', '🐑', '🦆', '🐎', '🥔', '🌽', '🥬', '🏡', '🪵', '🧺']
      },
      circus: {
        sky: ['#f43f5e', '#fbbf24'],
        ground: '#7f1d1d',
        path: '#eab308',
        crowd: ['🎪', '🎩', '🤹', '🦁', '🎺', '🕊️', '✨', '🤡', '🦭', '🚲', '🎈', '🦯', '🥁', '🍿', '🐯', '🌟']
      }
    };

    const visual = themeVisuals[themeType] || themeVisuals.park;

    // 1. 하늘 / 실내 상단 그라데이션
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
    skyGrad.addColorStop(0, visual.sky[0]);
    skyGrad.addColorStop(1, visual.sky[1]);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 320);

    // 2. 잔디 / 대지 / 바닥
    ctx.fillStyle = visual.ground;
    ctx.fillRect(0, 320, w, 330);

    // 3. 중앙 보도블록 / 트랙 / 도로 타원
    ctx.fillStyle = visual.path;
    ctx.beginPath();
    ctx.ellipse(600, 490, 560, 150, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4. 대형 랜드마크 장식들 (테마별)
    ctx.save();
    ctx.font = '100px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (themeType === 'park') {
      ctx.fillText('🎡', 520, 180);
      ctx.fillText('⛵', 230, 240);
      ctx.fillText('🎠', 880, 260);
      ctx.fillText('⛲', 350, 550);
      ctx.fillText('🍦', 1060, 560);
    } else if (themeType === 'ocean') {
      ctx.fillText('🪸', 200, 540);
      ctx.fillText('🚢', 740, 210);
      ctx.fillText('🪸', 950, 550);
      ctx.fillText('🫧', 420, 310);
    } else if (themeType === 'safari') {
      ctx.fillText('🚙', 380, 380);
      ctx.fillText('🦒', 980, 360);
      ctx.fillText('🐘', 640, 480);
      ctx.fillText('🌴', 160, 230);
    } else if (themeType === 'space') {
      ctx.fillText('🚀', 480, 210);
      ctx.fillText('🪐', 840, 190);
      ctx.fillText('🛸', 220, 230);
      ctx.fillText('🛰️', 1040, 260);
    } else if (themeType === 'dino') {
      ctx.fillText('🌋', 310, 180);
      ctx.fillText('🦕', 850, 380);
      ctx.fillText('🌴', 160, 300);
      ctx.fillText('🦖', 600, 480);
    } else if (themeType === 'candy') {
      ctx.fillText('🎂', 500, 220);
      ctx.fillText('🏠', 230, 350);
      ctx.fillText('🍭', 850, 320);
      ctx.fillText('🧁', 1050, 480);
    } else if (themeType === 'winter') {
      ctx.fillText('🏰', 520, 190);
      ctx.fillText('🏠', 260, 380);
      ctx.fillText('🎄', 880, 280);
      ctx.fillText('⛄', 160, 480);
    } else if (themeType === 'jungle') {
      ctx.fillText('🏛️', 520, 220);
      ctx.fillText('🌴', 210, 280);
      ctx.fillText('🌴', 850, 290);
      ctx.fillText('🌊', 1050, 460);
    } else if (themeType === 'castle') {
      ctx.fillText('🏰', 540, 180);
      ctx.fillText('⛲', 340, 470);
      ctx.fillText('🪞', 880, 260);
      ctx.fillText('🎠', 170, 380);
    } else if (themeType === 'robot') {
      ctx.fillText('🏢', 530, 190);
      ctx.fillText('⚡', 240, 360);
      ctx.fillText('📡', 820, 240);
      ctx.fillText('🚘', 1040, 460);
    } else if (themeType === 'sports') {
      ctx.fillText('🏟️', 530, 190);
      ctx.fillText('🏁', 220, 340);
      ctx.fillText('🏆', 840, 340);
      ctx.fillText('🎉', 1050, 450);
    } else if (themeType === 'beach') {
      ctx.fillText('⛵', 530, 190);
      ctx.fillText('🏖️', 260, 400);
      ctx.fillText('🌴', 850, 310);
      ctx.fillText('⛱️', 1040, 460);
    } else if (themeType === 'school') {
      ctx.fillText('🏫', 530, 190);
      ctx.fillText('🌳', 240, 340);
      ctx.fillText('🔔', 820, 250);
      ctx.fillText('🚌', 1040, 460);
    } else if (themeType === 'market') {
      ctx.fillText('🏪', 530, 190);
      ctx.fillText('🍇', 240, 350);
      ctx.fillText('🍞', 820, 340);
      ctx.fillText('🛒', 1040, 460);
    } else if (themeType === 'train') {
      ctx.fillText('🚂', 530, 210);
      ctx.fillText('🚉', 240, 340);
      ctx.fillText('⏰', 820, 250);
      ctx.fillText('🛤️', 1040, 460);
    } else if (themeType === 'airport') {
      ctx.fillText('✈️', 530, 190);
      ctx.fillText('🗼', 240, 260);
      ctx.fillText('🛬', 820, 320);
      ctx.fillText('🧳', 1040, 460);
    } else if (themeType === 'fire') {
      ctx.fillText('🚒', 530, 230);
      ctx.fillText('🏢', 240, 320);
      ctx.fillText('🚨', 820, 260);
      ctx.fillText('🧯', 1040, 460);
    } else if (themeType === 'concert') {
      ctx.fillText('🎪', 530, 190);
      ctx.fillText('🎙️', 240, 340);
      ctx.fillText('🪩', 820, 240);
      ctx.fillText('🥁', 1040, 460);
    } else if (themeType === 'farm') {
      ctx.fillText('🚜', 530, 240);
      ctx.fillText('🏡', 240, 320);
      ctx.fillText('🌾', 820, 340);
      ctx.fillText('🌻', 1040, 460);
    } else if (themeType === 'circus') {
      ctx.fillText('🎪', 530, 190);
      ctx.fillText('🤹', 240, 340);
      ctx.fillText('🎈', 820, 250);
      ctx.fillText('🎺', 1040, 460);
    }
    ctx.restore();

    // 5. 와글와글 군중 캐릭터 (45~50명 이상 골고루 배치)
    const crowdList = visual.crowd;
    for (let i = 0; i < 48; i++) {
      const cx = 70 + (i * 24) % 1080;
      const cy = 340 + ((i * 47) % 270);
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(crowdList[i % crowdList.length], cx, cy);
    }

    // 6. 5명의 타깃 캐릭터 & 보물 렌더링
    targets.forEach(t => {
      ctx.save();
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 힌트 상태일 때 강조 표시
      if (this.whereHintTargetId === t.id) {
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 44, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.fill();
      }

      ctx.fillText(t.icon, t.x, t.y);

      // 이미 찾은 대상에게 초록색 체크 원 표시
      if (foundSet.has(t.id)) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 28, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText('✓', t.x, t.y - 24);
      }

      ctx.restore();
    });
  };

})();
