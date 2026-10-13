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
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches.length > 0) {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const clientX = touch.clientX;
        const clientY = touch.clientY;
        const coord = this.getBadukGridCoord(canvas, clientX, clientY);
        if (coord) {
          this.placeBadukStone(coord.x, coord.y);
        }
      }
    }, { passive: false });

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

  EduApp.prototype.handleBadukClick = function(e) {
    if (this.badukIsGameOver || this.isBadukAiThinking) return;
    const humanStone = (this.badukPlayerColor === 'white') ? 2 : 1;
    if (this.badukOpponent === 'pve' && this.badukTurn !== humanStone) return;

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
  // 3-2. 🔍 눈썰미 쑥쑥 틀린그림 찾기 (Spot the Differences)
  // ==========================================================================
  EduApp.prototype.initSpotStages = function() {
    if (this.spotStagesInitialized) return;

    this.spotStages = [
      {
        id: 0,
        title: '🚗 은찬이의 멋진 자동차 마을',
        diffs: [
          { id: 0, x: 75, y: 70, radius: 32, hint: '신호등 불빛 색깔을 살펴보세요!' },
          { id: 1, x: 175, y: 280, radius: 34, hint: '빨간 스포츠카의 바퀴 휠 모양을 보세요!' },
          { id: 2, x: 410, y: 55, radius: 36, hint: '하늘에 떠 있는 구름 모양을 찾아보세요!' },
          { id: 3, x: 480, y: 160, radius: 34, hint: '가로수에 달린 탐스러운 사과 개수를 세어보세요!' },
          { id: 4, x: 295, y: 125, radius: 32, hint: '지붕 위 귀여운 고양이의 모자를 찾아보세요!' }
        ]
      },
      {
        id: 1,
        title: '🦕 아기 공룡 쥐라기 동산',
        diffs: [
          { id: 0, x: 100, y: 60, radius: 34, hint: '화산에서 피어오르는 연기 모양을 보세요!' },
          { id: 1, x: 210, y: 240, radius: 34, hint: '아기 티라노의 꼬리 무늬를 살펴보세요!' },
          { id: 2, x: 360, y: 295, radius: 32, hint: '둥지 속 공룡알의 줄무늬를 비교해보세요!' },
          { id: 3, x: 450, y: 110, radius: 32, hint: '날아다니는 나비의 날개 색을 확인해보세요!' },
          { id: 4, x: 480, y: 190, radius: 34, hint: '야자수 나무에 달린 코코넛 열매를 찾아보세요!' }
        ]
      },
      {
        id: 2,
        title: '🚀 반짝반짝 우주 은하수',
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
        title: '🏰 동화 요정의 비밀의 성',
        diffs: [
          { id: 0, x: 260, y: 50, radius: 32, hint: '성 꼭대기 펄럭이는 깃발 모양을 보세요!' },
          { id: 1, x: 120, y: 80, radius: 34, hint: '하늘에 걸린 무지개 색깔 순서를 살펴보세요!' },
          { id: 2, x: 270, y: 150, radius: 32, hint: '시계탑의 바늘이 가리키는 시간을 비교해보세요!' },
          { id: 3, x: 440, y: 290, radius: 34, hint: '호수 위 하얀 백조의 머리 장식을 보세요!' },
          { id: 4, x: 150, y: 280, radius: 34, hint: '분수대 가운데 반짝이는 보석 색상을 찾아보세요!' }
        ]
      }
    ];

    this.spotStagesInitialized = true;
    this.setupSpotClickListeners();
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

    document.querySelectorAll('.btn-spot-stage').forEach(btn => {
      btn.classList.toggle('active', parseInt(btn.dataset.stage, 10) === idx);
    });

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

    const curStage = this.spotStages[this.spotStageIdx];
    if (!curStage) return;

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

          // 모두 찾았을 때
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
    if (this.spotFoundMap[this.spotStageIdx]) {
      this.spotFoundMap[this.spotStageIdx].clear();
    }
    const overlay = document.getElementById('spotWinOverlay');
    if (overlay) overlay.style.display = 'none';
    this.renderSpotStage();
  };

  EduApp.prototype.nextSpotStage = function() {
    this.playPop();
    const nextIdx = (this.spotStageIdx + 1) % this.spotStages.length;
    this.selectSpotStage(nextIdx);
  };

  EduApp.prototype.renderSpotStage = function() {
    const leftCanvas = document.getElementById('spotCanvasLeft');
    const rightCanvas = document.getElementById('spotCanvasRight');
    if (!leftCanvas || !rightCanvas) return;

    this.spotFoundMap[this.spotStageIdx] = this.spotFoundMap[this.spotStageIdx] || new Set();
    const foundSet = this.spotFoundMap[this.spotStageIdx];

    // HUD 업데이트
    const countElem = document.getElementById('spotFoundCount');
    if (countElem) countElem.textContent = foundSet.size;

    for (let i = 0; i < 5; i++) {
      const star = document.getElementById(`spotStar_${i}`);
      if (star) star.classList.toggle('found', i < foundSet.size);
    }

    const curStage = this.spotStages[this.spotStageIdx];
    if (!curStage) return;

    // 양쪽 캔버스 그리기
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

    if (stageIdx === 0) {
      // 🚗 1탄. 멋진 자동차 마을
      // 하늘 & 잔디 배경
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 240);
      skyGrad.addColorStop(0, '#bae6fd');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, 240);

      ctx.fillStyle = '#86efac';
      ctx.fillRect(0, 240, w, 60);

      // 아스팔트 도로
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

      // [차이점 2] 하늘 구름 모양 (410, 55)
      ctx.fillStyle = '#ffffff';
      if (isRight) {
        // 하트 구름
        this.drawHeart(ctx, 410, 55, 30, '#ffffff');
      } else {
        // 일반 뭉게구름
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
      // 빨간불
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(75, 55, 8, 0, Math.PI * 2);
      ctx.fill();
      // 초록불 vs 노란불
      ctx.fillStyle = isRight ? '#eab308' : '#22c55e';
      ctx.beginPath();
      ctx.arc(75, 85, 8, 0, Math.PI * 2);
      ctx.fill();

      // 건물들 & [차이점 4] 지붕 위 고양이 (295, 125)
      ctx.fillStyle = '#fdba74';
      ctx.fillRect(250, 150, 90, 90);
      // 삼각형 지붕
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(240, 150);
      ctx.lineTo(295, 100);
      ctx.lineTo(350, 150);
      ctx.fill();

      // 고양이
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🐱', 295, 132);
      if (isRight) {
        // 노란 모자 쓴 고양이
        ctx.font = '16px sans-serif';
        ctx.fillText('🧢', 295, 114);
      }

      // [차이점 3] 가로수 나무와 사과 (480, 160)
      ctx.fillStyle = '#78350f';
      ctx.fillRect(472, 180, 16, 70);
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(480, 155, 38, 0, Math.PI * 2);
      ctx.fill();
      // 사과 그리기
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(465, 150, 6, 0, Math.PI * 2);
      ctx.arc(495, 145, 6, 0, Math.PI * 2);
      if (!isRight) {
        ctx.arc(480, 170, 6, 0, Math.PI * 2); // 좌측은 사과 3개
      }
      ctx.fill();

      // [차이점 1] 빨간 스포츠카 & 바퀴 (175, 280)
      // 자동차 본체
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(110, 270, 130, 36, 12);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(140, 245, 75, 30, 8);
      ctx.fill();
      // 유리창
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(150, 252, 55, 20);

      // 바퀴
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(135, 305, 14, 0, Math.PI * 2);
      ctx.arc(215, 305, 14, 0, Math.PI * 2);
      ctx.fill();

      // 휠 모양 (동그라미 vs 별)
      ctx.fillStyle = '#f8fafc';
      if (isRight) {
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 135, 305);
        ctx.fillText('⭐', 215, 305);
      } else {
        ctx.beginPath();
        ctx.arc(135, 305, 6, 0, Math.PI * 2);
        ctx.arc(215, 305, 6, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (stageIdx === 1) {
      // 🦕 2탄. 아기 공룡 쥐라기 동산
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(0, 0, w, 220);
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(0, 220, w, 160);

      // [차이점 0] 화산 연기 (100, 60)
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(30, 220);
      ctx.lineTo(85, 120);
      ctx.lineTo(125, 120);
      ctx.lineTo(180, 220);
      ctx.fill();
      // 용암
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(88, 120, 34, 10);
      // 연기
      ctx.fillStyle = 'rgba(100, 116, 139, 0.7)';
      if (isRight) {
        // 도넛 모양 연기
        ctx.beginPath();
        ctx.arc(105, 65, 22, 0, Math.PI * 2);
        ctx.arc(105, 65, 10, 0, Math.PI * 2, true);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(95, 75, 18, 0, Math.PI * 2);
        ctx.arc(115, 60, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // [차이점 1] 아기 티라노 꼬리 무늬 (210, 240)
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.ellipse(220, 245, 45, 35, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🦖', 220, 260);

      // 꼬리 무늬
      ctx.fillStyle = isRight ? '#f59e0b' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(180, 255, 6, 0, Math.PI * 2);
      ctx.arc(192, 262, 5, 0, Math.PI * 2);
      ctx.fill();

      // [차이점 2] 공룡알 둥지 (360, 295)
      ctx.font = '36px sans-serif';
      ctx.fillText('🪺', 360, 320);
      ctx.font = '28px sans-serif';
      ctx.fillText(isRight ? '🐣' : '🥚', 360, 295);

      // [차이점 3] 나비 날개 색 (450, 110)
      ctx.font = '34px sans-serif';
      ctx.fillText(isRight ? '🦋' : '🐝', 450, 110);

      // [차이점 4] 야자수 코코넛 (480, 190)
      ctx.fillStyle = '#92400e';
      ctx.fillRect(475, 170, 16, 120);
      ctx.font = '50px sans-serif';
      ctx.fillText('🌴', 482, 175);
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(470, 195, 6, 0, Math.PI * 2);
      ctx.arc(495, 195, 6, 0, Math.PI * 2);
      if (!isRight) {
        ctx.arc(482, 205, 6, 0, Math.PI * 2);
      }
      ctx.fill();

    } else if (stageIdx === 2) {
      // 🚀 3탄. 반짝반짝 우주 은하수
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);

      // 별빛 배경
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 40; i++) {
        const bx = (i * 37) % w;
        const by = (i * 29) % h;
        ctx.fillRect(bx, by, 1.5, 1.5);
      }

      // [차이점 0] 우주인 헬멧 바이저 (130, 210)
      ctx.font = '64px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👨‍🚀', 130, 240);
      ctx.fillStyle = isRight ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(130, 208, 9, 0, Math.PI * 2);
      ctx.fill();

      // [차이점 1] 로켓 창문 (275, 110)
      ctx.font = '72px sans-serif';
      ctx.fillText('🚀', 275, 150);
      ctx.fillStyle = '#0284c7';
      if (isRight) {
        ctx.fillRect(268, 105, 14, 14); // 네모 창문
      } else {
        ctx.beginPath();
        ctx.arc(275, 112, 7, 0, Math.PI * 2); // 동그라미 창문
        ctx.fill();
      }

      // [차이점 2] 토성 고리 색상 (460, 65)
      ctx.font = '64px sans-serif';
      ctx.fillText(isRight ? '🪐' : '🌕', 460, 80);

      // [차이점 3] 인공위성 안테나 장식 (85, 90)
      ctx.font = '48px sans-serif';
      ctx.fillText('🛰️', 85, 115);
      ctx.font = '20px sans-serif';
      ctx.fillText(isRight ? '🌟' : '🔴', 85, 75);

      // [차이점 4] 외계인 친구 (395, 270)
      ctx.font = '54px sans-serif';
      ctx.fillText(isRight ? '👾' : '👽', 395, 290);

    } else if (stageIdx === 3) {
      // 🏰 4탄. 동화 요정의 성
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 250);
      skyGrad.addColorStop(0, '#fbcfe8');
      skyGrad.addColorStop(1, '#c084fc');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, 250);

      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, 250, w, 130);

      // [차이점 1] 무지개 (120, 80)
      ctx.font = '54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isRight ? '🌈' : '⛅', 120, 95);

      // 마법의 성 본체
      ctx.font = '84px sans-serif';
      ctx.fillText('🏰', 270, 180);

      // [차이점 0] 성 꼭대기 깃발 (260, 50)
      ctx.font = '28px sans-serif';
      ctx.fillText(isRight ? '👑' : '🚩', 260, 60);

      // [차이점 2] 시계탑 바늘 시간 (270, 150)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(270, 150, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(270, 150);
      ctx.lineTo(270, 142);
      ctx.moveTo(270, 150);
      ctx.lineTo(isRight ? 270 : 277, isRight ? 157 : 150);
      ctx.stroke();

      // [차이점 3] 호수 백조 머리 장식 (440, 290)
      ctx.font = '48px sans-serif';
      ctx.fillText('🦢', 440, 310);
      ctx.font = '20px sans-serif';
      ctx.fillText(isRight ? '👑' : '🌸', 440, 275);

      // [차이점 4] 분수대 보석 (150, 280)
      ctx.font = '44px sans-serif';
      ctx.fillText('⛲', 150, 310);
      ctx.font = '22px sans-serif';
      ctx.fillText(isRight ? '💎' : '💖', 150, 275);
    }

    // 이미 발견한 다른 점들에 초록색 반짝이 링 ⭕ 표시
    diffs.forEach(diff => {
      if (foundSet.has(diff.id)) {
        ctx.save();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 4;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(diff.x, diff.y, diff.radius * 0.9, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = 'bold 16px sans-serif';
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
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(this.spotHintPos.x, this.spotHintPos.y, 36, 0, Math.PI * 2);
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
  // 3-3. 🕵️‍♂️ 와글와글 은찬이를 찾아라! (Where's Eunchan? / 윌리를 찾아라 스타일)
  // ==========================================================================
  EduApp.prototype.initWhereScenes = function() {
    if (this.whereScenesInitialized) return;

    this.whereScenes = {
      park: {
        id: 'park',
        title: '🎡 와글와글 놀이공원 대축제',
        targets: [
          { id: 't_eunchan', name: '빨간 줄무늬 은찬이', icon: '👦', x: 520, y: 390, clue: '대관람차와 솜사탕 근처에서 신나게 손을 흔들고 있어요!' },
          { id: 't_cat', name: '핑크 선글라스 고양이', icon: '🐱', x: 230, y: 220, clue: '바이킹 배 지붕 위를 조심스럽게 올려다보세요!' },
          { id: 't_bear', name: '무지개 풍선 든 아기 곰', icon: '🐻', x: 880, y: 440, clue: '회전목마 옆 풍선 스탠드 근처에서 풍선을 쥐고 있어요!' },
          { id: 't_key', name: '황금 보물 열쇠', icon: '🗝️', x: 1060, y: 560, clue: '아이스크림 카트 바퀴 아래 반짝반짝 빛나고 있어요!' },
          { id: 't_dog', name: '탐정 망토 강아지', icon: '🐶', x: 350, y: 520, clue: '분수대 벤치에서 돋보기를 들고 탐정 흉내를 내고 있어요!' }
        ]
      },
      ocean: {
        id: 'ocean',
        title: '🌊 신비한 바닷속 산호초 파티',
        targets: [
          { id: 't_eunchan', name: '잠수부 은찬이', icon: '🤿', x: 740, y: 310, clue: '노란 잠수함 창문 옆에서 물안경을 끼고 헤엄치고 있어요!' },
          { id: 't_fish', name: '황금 왕관 복어', icon: '🐡', x: 310, y: 190, clue: '해파리 숲 위쪽에서 반짝이는 왕관을 쓰고 둥둥 떠 있어요!' },
          { id: 't_pearl', name: '조개 속 무지개 진주', icon: '💎', x: 180, y: 540, clue: '보라색 거대 조개껍질 속에서 오색 빛을 뿜고 있어요!' },
          { id: 't_octopus', name: '파티 모자 문어', icon: '🐙', x: 960, y: 430, clue: '산호초 바위 뒤에서 8개의 다리로 춤추고 있어요!' },
          { id: 't_bottle', name: '유리병 속 보물 지도', icon: '🗺️', x: 530, y: 560, clue: '모래사장 해초 덤불 사이에 숨겨져 있답니다!' }
        ]
      },
      safari: {
        id: 'safari',
        title: '🦁 복작복작 사파리 동물원',
        targets: [
          { id: 't_eunchan', name: '탐험가 은찬이', icon: '🧭', x: 380, y: 330, clue: '사파리 지프차 보닛 옆에서 망원경을 들고 관찰하고 있어요!' },
          { id: 't_lion', name: '선글라스 아기 사자', icon: '🦁', x: 820, y: 260, clue: '사자 바위 그늘 아래에서 멋진 선글라스를 끼고 있어요!' },
          { id: 't_panda', name: '대나무 하트 아기 팬더', icon: '🐼', x: 190, y: 460, clue: '대나무 숲 평상에서 하트 모양 대나무 잎을 쥐고 있어요!' },
          { id: 't_dad', name: '카메라 든 정연수 아빠', icon: '👨', x: 1020, y: 490, clue: '기린 타워 앞에서 은찬이의 멋진 모습을 찰칵 찍고 있어요!' },
          { id: 't_bird', name: '오색 깃털 앵무새', icon: '🦜', x: 610, y: 150, clue: '폭포 위 큰 나무 나뭇가지 꼭대기에 앉아 있어요!' }
        ]
      }
    };

    this.whereScenesInitialized = true;
    this.setupWhereClickListeners();
  };

  EduApp.prototype.setupWhereClickListeners = function() {
    const canvas = document.getElementById('whereCanvas');
    if (!canvas) return;
    canvas.addEventListener('click', (e) => this.handleWhereCanvasClick(e));
  };

  EduApp.prototype.selectWhereScene = function(sceneId) {
    this.playPop();
    this.whereSceneIdx = sceneId;

    document.querySelectorAll('.btn-where-theme').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scene === sceneId);
    });

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

    const curScene = this.whereScenes[this.whereSceneIdx];
    if (!curScene) return;

    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();
    const foundSet = this.whereFoundTargets[this.whereSceneIdx];

    let foundTarget = null;
    curScene.targets.forEach(target => {
      if (!foundSet.has(target.id)) {
        const dist = Math.hypot(clickX - target.x, clickY - target.y);
        if (dist <= 42) {
          foundTarget = target;
        }
      }
    });

    if (foundTarget) {
      foundSet.add(foundTarget.id);
      this.playSuccess();
      this.speak(`찾았다! ${foundTarget.name}!`, 'ko-KR');
      this.renderWhereScene();

      // 모두 찾았을 때
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
    const curScene = this.whereScenes[this.whereSceneIdx];
    if (!curScene) return;

    this.whereFoundTargets[this.whereSceneIdx] = this.whereFoundTargets[this.whereSceneIdx] || new Set();
    const foundSet = this.whereFoundTargets[this.whereSceneIdx];

    const unfound = curScene.targets.find(t => !foundSet.has(t.id));
    if (unfound) {
      this.whereHintTargetId = unfound.id;
      this.renderWhereScene();

      // 타깃 위치로 부드럽게 스크롤
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
    if (this.whereFoundTargets[this.whereSceneIdx]) {
      this.whereFoundTargets[this.whereSceneIdx].clear();
    }
    const overlay = document.getElementById('whereWinOverlay');
    if (overlay) overlay.style.display = 'none';
    this.renderWhereScene();
  };

  EduApp.prototype.nextWhereScene = function() {
    this.playPop();
    const sceneKeys = Object.keys(this.whereScenes);
    const curIdx = sceneKeys.indexOf(this.whereSceneIdx);
    const nextKey = sceneKeys[(curIdx + 1) % sceneKeys.length];
    this.selectWhereScene(nextKey);
  };

  EduApp.prototype.renderWhereScene = function() {
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

    this.drawWhereScene(canvas, this.whereSceneIdx, foundSet, curScene.targets);
  };

  EduApp.prototype.drawWhereScene = function(canvas, sceneId, foundSet, targets) {
    const ctx = canvas.getContext('2d');
    const w = 1200;
    const h = 650;
    canvas.width = w;
    canvas.height = h;

    ctx.clearRect(0, 0, w, h);

    if (sceneId === 'park') {
      // 🎡 와글와글 놀이공원 대축제
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
      skyGrad.addColorStop(0, '#67e8f9');
      skyGrad.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, 320);

      // 잔디광장
      ctx.fillStyle = '#86efac';
      ctx.fillRect(0, 320, w, 330);

      // 돌 보도블록 도로
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.ellipse(600, 500, 560, 160, 0, 0, Math.PI * 2);
      ctx.fill();

      // 대관람차 (중앙 상단 520, 200)
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(520, 180, 110, 0, Math.PI * 2);
      ctx.stroke();

      for (let a = 0; a < 8; a++) {
        const rad = (a * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(520, 180);
        ctx.lineTo(520 + Math.cos(rad) * 110, 180 + Math.sin(rad) * 110);
        ctx.stroke();
        // 곤돌라
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(520 + Math.cos(rad) * 110 - 12, 180 + Math.sin(rad) * 110 - 12, 24, 24);
      }

      // 바이킹 배 (좌측 230, 240)
      ctx.font = '84px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⛵', 230, 260);

      // 회전목마 (우측 880, 260)
      ctx.font = '96px sans-serif';
      ctx.fillText('🎠', 880, 290);

      // 롤러코스터 트랙
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, 150);
      ctx.bezierCurveTo(200, 60, 350, 260, 500, 120);
      ctx.bezierCurveTo(650, 0, 800, 240, 1200, 100);
      ctx.stroke();

      // 분수대 (350, 520)
      ctx.font = '72px sans-serif';
      ctx.fillText('⛲', 350, 550);

      // 아이스크림 카트 (1060, 540)
      ctx.font = '72px sans-serif';
      ctx.fillText('🍦', 1060, 560);

      // 텐트 & 부스들
      ctx.font = '64px sans-serif';
      ctx.fillText('🎪', 100, 420);
      ctx.fillText('🎈', 750, 420);
      ctx.fillText('🍿', 620, 470);
      ctx.fillText('🎡', 1140, 380);

      // 와글와글 수많은 시민 군중 캐릭터들 (50명)
      const crowdEmojis = ['👨‍👩‍👧', '🏃‍♂️', '🚶‍♀️', '💃', '🕺', '👧', '👦', '👵', '👴', '🐶', '🐩', '🐱', '🐦', '🐰', '🐼', '🐯', '🐧'];
      for (let i = 0; i < 45; i++) {
        const cx = 80 + (i * 26) % 1060;
        const cy = 350 + ((i * 47) % 270);
        ctx.font = '26px sans-serif';
        ctx.fillText(crowdEmojis[i % crowdEmojis.length], cx, cy);
      }

    } else if (sceneId === 'ocean') {
      // 🌊 신비한 바닷속 산호초 파티
      const seaGrad = ctx.createLinearGradient(0, 0, 0, h);
      seaGrad.addColorStop(0, '#38bdf8');
      seaGrad.addColorStop(0.4, '#0284c7');
      seaGrad.addColorStop(1, '#082f49');
      ctx.fillStyle = seaGrad;
      ctx.fillRect(0, 0, w, h);

      // 모래 바닥
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.moveTo(0, 580);
      ctx.bezierCurveTo(400, 550, 800, 610, 1200, 570);
      ctx.lineTo(1200, h);
      ctx.lineTo(0, h);
      ctx.fill();

      // 노란 잠수함 (740, 240)
      ctx.font = '110px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🪸', 120, 560);
      ctx.fillText('🪸', 420, 570);
      ctx.fillText('🪸', 840, 580);
      ctx.fillText('🪸', 1120, 560);

      // 잠수함
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(740, 220, 110, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(710, 220, 16, 0, Math.PI * 2);
      ctx.arc(770, 220, 16, 0, Math.PI * 2);
      ctx.fill();

      // 바다 동물 친구들 가득
      const seaCreatures = ['🐟', '🐠', '🐡', '🐬', '🐳', '🦈', '🦭', '🦀', '🦞', '🦐', '🦑', '🪼', '🐢', '🫧', '🐚'];
      for (let i = 0; i < 48; i++) {
        const sx = 60 + (i * 24) % 1100;
        const sy = 80 + ((i * 53) % 520);
        ctx.font = '32px sans-serif';
        ctx.fillText(seaCreatures[i % seaCreatures.length], sx, sy);
      }

    } else if (sceneId === 'safari') {
      // 🦁 복작복작 사파리 동물원
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 280);
      skyGrad.addColorStop(0, '#fef08a');
      skyGrad.addColorStop(1, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, 280);

      // 초원 & 흙길
      ctx.fillStyle = '#65a30d';
      ctx.fillRect(0, 280, w, 370);

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(0, 480);
      ctx.bezierCurveTo(400, 420, 800, 540, 1200, 460);
      ctx.lineTo(1200, 560);
      ctx.bezierCurveTo(800, 620, 400, 500, 0, 580);
      ctx.fill();

      // 사파리 지프차 (380, 400)
      ctx.font = '84px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🚙', 380, 400);

      // 기린 타워 & 나무들
      ctx.font = '96px sans-serif';
      ctx.fillText('🦒', 980, 360);
      ctx.fillText('🐘', 640, 480);
      ctx.fillText('🦛', 160, 550);
      ctx.fillText('🦓', 520, 360);
      ctx.fillText('🦏', 880, 550);

      // 동물원 식구들
      const zooAnimals = ['🐒', '🦍', '🦧', '🦘', '🦙', '🦔', '🦥', '🦦', '🦨', '🦩', '🦚', '🦜', '🐊', '🌴', '🌲', '🌿', '🪵'];
      for (let i = 0; i < 45; i++) {
        const zx = 60 + (i * 26) % 1100;
        const zy = 180 + ((i * 49) % 430);
        ctx.font = '32px sans-serif';
        ctx.fillText(zooAnimals[i % zooAnimals.length], zx, zy);
      }
    }

    // 5명의 타깃 캐릭터 렌더링
    targets.forEach(t => {
      ctx.save();
      ctx.font = '40px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // 힌트 상태일 때 펄스 강조
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

      // 이미 찾은 대상에게 초록색 체크 동그라미 표시
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
