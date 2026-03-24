const profileKey = "airHockeyProfile";
const leaderboardKey = "airHockeyLeaderboard";
const userKey = "airHockeyUser";
const apiBase =
  window.location.origin === "null" ? "http://localhost:4000" : window.location.origin;

const matchTarget = 3;
const goalToastDuration = 1200;
const stateSendInterval = 60;

const ui = {
  profileBtn: document.getElementById("profileBtn"),
  profileModal: document.getElementById("profileModal"),
  closeProfile: document.getElementById("closeProfile"),
  profileName: document.getElementById("profileName"),
  profileElo: document.getElementById("profileElo"),
  profileGames: document.getElementById("profileGames"),
  metricElo: document.getElementById("metricElo"),
  metricGames: document.getElementById("metricGames"),
  heroStatus: document.getElementById("heroStatus"),
  playNow: document.getElementById("playNow"),
  openRegistrationTop: document.getElementById("openRegistrationTop"),
  openArena: document.getElementById("openArena"),
  startMatch: document.getElementById("startMatch"),
  resetMatch: document.getElementById("resetMatch"),
  scoreLeft: document.getElementById("scoreLeft"),
  scoreRight: document.getElementById("scoreRight"),
  matchStatus: document.getElementById("matchStatus"),
  rink: document.getElementById("rink"),
  rinkOverlay: document.getElementById("rinkOverlay"),
  paddleLeft: document.getElementById("paddleLeft"),
  paddleRight: document.getElementById("paddleRight"),
  puck: document.getElementById("puck"),
  goalToast: document.getElementById("goalToast"),
  modeCards: document.querySelectorAll(".mode-card"),
  botOptions: document.getElementById("botOptions"),
  onlineOptions: document.getElementById("onlineOptions"),
  duelOptions: document.getElementById("duelOptions"),
  botDifficulty: document.getElementById("botDifficulty"),
  queueToggle: document.getElementById("queueToggle"),
  queueStatus: document.getElementById("queueStatus"),
  duelRoomCode: document.getElementById("duelRoomCode"),
  createRoom: document.getElementById("createRoom"),
  joinRoom: document.getElementById("joinRoom"),
  duelStatus: document.getElementById("duelStatus"),
  leaderboardBody: document.getElementById("leaderboardBody"),
  registerForm: document.getElementById("registerForm"),
  regNickname: document.getElementById("regNickname"),
  regEmail: document.getElementById("regEmail"),
  regPassword: document.getElementById("regPassword"),
  regCode: document.getElementById("regCode"),
  codeBox: document.getElementById("codeBox"),
  confirmCode: document.getElementById("confirmCode"),
  registerStatus: document.getElementById("registerStatus"),
  loginForm: document.getElementById("loginForm"),
  loginNickname: document.getElementById("loginNickname"),
  loginPassword: document.getElementById("loginPassword"),
  loginStatus: document.getElementById("loginStatus"),
};

const state = {
  profile: {
    nickname: "Гость",
    elo: 0,
    games: 0,
  },
  mode: "bot",
  botDifficulty: "normal",
  queue: false,
  scores: { left: 0, right: 0 },
  playing: false,
  rink: {
    width: 0,
    height: 0,
  },
  leftPaddle: { x: 0, y: 0 },
  rightPaddle: { x: 0, y: 0 },
  puck: { x: 0, y: 0, vx: 220, vy: 120 },
  lastTime: 0,
  onlineRole: null,
  roomCode: null,
  duelConnected: false,
  lastSend: 0,
};

const sectionOrder = ["register", "login", "home", "arena", "rating", "leaderboard"];

const showSection = (id) => {
  sectionOrder.forEach((key) => {
    const el = document.getElementById(key);
    if (!el) return;
    el.classList.toggle("is-active", key === id);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const botSpeedMap = {
  easy: 220,
  normal: 320,
  hard: 420,
};

const loadProfile = () => {
  const stored = localStorage.getItem(profileKey);
  if (!stored) return;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && parsed.nickname) {
      state.profile = { ...state.profile, ...parsed };
    }
  } catch (err) {
    // ignore
  }
};

const saveProfile = () => {
  localStorage.setItem(profileKey, JSON.stringify(state.profile));
};

const loadUser = () => {
  const stored = localStorage.getItem(userKey);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch (err) {
    return null;
  }
};

const saveUser = (user) => {
  localStorage.setItem(userKey, JSON.stringify(user));
};

const isValidEmail = (value) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);

const requestCode = async (email, nickname) => {
  const response = await fetch(`${apiBase}/api/send-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, nickname }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Ошибка отправки кода");
  }
  return data;
};

const registerUser = async (payload) => {
  const response = await fetch(`${apiBase}/api/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Регистрация не удалась");
  }
  return data;
};

const loginUser = async (payload) => {
  const response = await fetch(`${apiBase}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Ошибка входа");
  }
  return data;
};

const defaultLeaderboard = () => [];

const loadLeaderboard = () => {
  const stored = localStorage.getItem(leaderboardKey);
  if (!stored) return defaultLeaderboard();
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : defaultLeaderboard();
  } catch (err) {
    return defaultLeaderboard();
  }
};

const saveLeaderboard = (data) => {
  localStorage.setItem(leaderboardKey, JSON.stringify(data));
};

let leaderboard = loadLeaderboard();

const syncLeaderboard = () => {
  const filtered = leaderboard.filter((row) => row.name !== "Ты");
  if (state.profile.nickname && state.profile.nickname !== "Гость") {
    const existing = filtered.find((row) => row.name === state.profile.nickname);
    if (existing) {
      existing.elo = state.profile.elo;
      existing.games = state.profile.games;
    } else {
      filtered.push({ name: state.profile.nickname, elo: state.profile.elo, games: state.profile.games });
    }
  }
  filtered.sort((a, b) => b.elo - a.elo);
  leaderboard = filtered.map((row, index) => ({ ...row, rank: index + 1 }));
  saveLeaderboard(leaderboard);
  renderLeaderboard();
};

const renderLeaderboard = () => {
  ui.leaderboardBody.innerHTML = "";
  if (!leaderboard.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = "<td colspan=\"4\">Пока нет игроков на сервере.</td>";
    ui.leaderboardBody.appendChild(tr);
    return;
  }
  leaderboard.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.name === state.profile.nickname) {
      tr.classList.add("highlight");
    }
    tr.innerHTML = `
      <td>${row.rank}</td>
      <td>${row.name}</td>
      <td>${row.elo}</td>
      <td>${row.games}</td>
    `;
    ui.leaderboardBody.appendChild(tr);
  });
};

const updateProfileUI = () => {
  ui.profileName.textContent = state.profile.nickname;
  ui.profileElo.textContent = state.profile.elo;
  ui.profileGames.textContent = state.profile.games;
  ui.metricElo.textContent = state.profile.elo;
  ui.metricGames.textContent = state.profile.games;
};

const updateHeroStatus = () => {
  const now = new Date();
  const seed = now.getUTCMinutes();
  ui.heroStatus.textContent = `Сейчас в онлайне: ${120 + (seed % 40)}`;
};

const showToast = (text) => {
  ui.goalToast.textContent = text;
  ui.goalToast.classList.add("show");
  setTimeout(() => ui.goalToast.classList.remove("show"), goalToastDuration);
};

const openProfile = () => ui.profileModal.classList.add("show");
const closeProfile = () => ui.profileModal.classList.remove("show");

const updateModeUI = () => {
  ui.modeCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.mode === state.mode);
  });
  ui.botOptions.classList.toggle("hidden", state.mode !== "bot");
  ui.onlineOptions.classList.toggle("hidden", state.mode !== "online");
  ui.duelOptions.classList.toggle("hidden", state.mode !== "duel");
  const labelMap = {
    bot: "Режим: Бот",
    online: "Режим: Онлайн",
    duel: state.roomCode ? `Дуэль: ${state.roomCode}` : "Режим: Дуэль",
  };
  ui.matchStatus.textContent = labelMap[state.mode];
};

const resetPositions = () => {
  const { width, height } = state.rink;
  state.leftPaddle.x = width * 0.25;
  state.leftPaddle.y = height / 2;
  state.rightPaddle.x = width * 0.75;
  state.rightPaddle.y = height / 2;
  state.puck.x = width / 2;
  state.puck.y = height / 2;
  state.puck.vx = 240;
  state.puck.vy = 140;
};

const resetScores = () => {
  state.scores.left = 0;
  state.scores.right = 0;
  ui.scoreLeft.textContent = "0";
  ui.scoreRight.textContent = "0";
};

const updateRinkSize = () => {
  const rect = ui.rink.getBoundingClientRect();
  state.rink.width = rect.width;
  state.rink.height = rect.height;
  resetPositions();
  draw();
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const setPaddlePosition = (paddle, x, y, leftSide) => {
  const radius = 23;
  const half = state.rink.width / 2;
  const minX = leftSide ? radius : half + radius;
  const maxX = leftSide ? half - radius : state.rink.width - radius;
  paddle.x = clamp(x, minX, maxX);
  paddle.y = clamp(y, radius, state.rink.height - radius);
};

const draw = () => {
  ui.paddleLeft.style.transform = `translate(${state.leftPaddle.x - 23}px, ${state.leftPaddle.y - 23}px)`;
  ui.paddleRight.style.transform = `translate(${state.rightPaddle.x - 23}px, ${state.rightPaddle.y - 23}px)`;
  ui.puck.style.transform = `translate(${state.puck.x - 12}px, ${state.puck.y - 12}px)`;
};

const handleGoal = (scorer) => {
  if (scorer === "left") {
    state.scores.left += 1;
    ui.scoreLeft.textContent = state.scores.left;
    showToast("Твой гол!");
  } else {
    state.scores.right += 1;
    ui.scoreRight.textContent = state.scores.right;
    showToast("Гол соперника");
  }

  const matchOver = state.scores.left >= matchTarget || state.scores.right >= matchTarget;

  if (matchOver) {
    if (state.scores.left > state.scores.right) {
      state.profile.elo += 200;
      state.profile.games += 1;
      saveProfile();
      updateProfileUI();
      syncLeaderboard();
      showToast("Победа! +200 ЭЛО");
    } else {
      state.profile.games += 1;
      saveProfile();
      updateProfileUI();
      syncLeaderboard();
      showToast("Матч завершён");
    }
    resetScores();
  }

  const { width, height } = state.rink;
  state.puck.y = height / 2;
  state.puck.vx = scorer === "left" ? 240 : -240;
  state.puck.vy = (Math.random() * 160 - 80) || 80;
  state.puck.x = scorer === "left" ? width * 0.65 : width * 0.35;
};

const updatePhysics = (delta) => {
  const puckRadius = 12;
  const paddleRadius = 23;
  const goalSize = 120;
  const { width, height } = state.rink;

  state.puck.x += state.puck.vx * delta;
  state.puck.y += state.puck.vy * delta;

  if (state.puck.y - puckRadius <= 0 || state.puck.y + puckRadius >= height) {
    state.puck.vy *= -1;
    state.puck.y = clamp(state.puck.y, puckRadius, height - puckRadius);
  }

  const goalTop = height / 2 - goalSize / 2;
  const goalBottom = height / 2 + goalSize / 2;

  if (state.puck.x - puckRadius <= 0) {
    if (state.puck.y >= goalTop && state.puck.y <= goalBottom) {
      handleGoal("right");
    } else {
      state.puck.vx *= -1;
      state.puck.x = puckRadius + 1;
    }
  }

  if (state.puck.x + puckRadius >= width) {
    if (state.puck.y >= goalTop && state.puck.y <= goalBottom) {
      handleGoal("left");
    } else {
      state.puck.vx *= -1;
      state.puck.x = width - puckRadius - 1;
    }
  }

  const collide = (paddle) => {
    const dx = state.puck.x - paddle.x;
    const dy = state.puck.y - paddle.y;
    const dist = Math.hypot(dx, dy);
    const minDist = puckRadius + paddleRadius;
    if (dist < minDist) {
      const nx = dx / dist || 1;
      const ny = dy / dist || 0;
      const speed = Math.hypot(state.puck.vx, state.puck.vy);
      const boost = 60;
      state.puck.vx = nx * (speed + boost);
      state.puck.vy = ny * (speed + boost);
      state.puck.x = paddle.x + nx * minDist;
      state.puck.y = paddle.y + ny * minDist;
    }
  };

  collide(state.leftPaddle);
  collide(state.rightPaddle);
};

const updateBot = (delta) => {
  const speed = botSpeedMap[state.botDifficulty] || botSpeedMap.normal;
  const targetY = state.puck.y;
  const targetX = state.rink.width * 0.75;
  const dx = targetX - state.rightPaddle.x;
  const dy = targetY - state.rightPaddle.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0) {
    const step = speed * delta;
    const move = Math.min(step, dist);
    setPaddlePosition(
      state.rightPaddle,
      state.rightPaddle.x + (dx / dist) * move,
      state.rightPaddle.y + (dy / dist) * move,
      false
    );
  }
};

const updateIdleOpponent = (delta) => {
  const centerY = state.rink.height / 2;
  const dx = state.rink.width * 0.75 - state.rightPaddle.x;
  const dy = centerY - state.rightPaddle.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 1) {
    const step = 160 * delta;
    const move = Math.min(step, dist);
    setPaddlePosition(
      state.rightPaddle,
      state.rightPaddle.x + (dx / dist) * move,
      state.rightPaddle.y + (dy / dist) * move,
      false
    );
  }
};

const tick = (timestamp) => {
  if (!state.playing) {
    state.lastTime = timestamp;
    requestAnimationFrame(tick);
    return;
  }
  const delta = Math.min((timestamp - state.lastTime) / 1000, 0.02);
  state.lastTime = timestamp;

  const duelActive = state.mode === "duel" && state.duelConnected;

  if (state.mode === "bot") {
    updateBot(delta);
  } else if (!duelActive) {
    updateIdleOpponent(delta);
  }

  if (!duelActive || state.onlineRole === "host") {
    updatePhysics(delta);
  }

  if (duelActive && state.onlineRole === "host") {
    const now = Date.now();
    if (now - state.lastSend > stateSendInterval && state.roomCode && socket) {
      state.lastSend = now;
      socket.emit("state:update", {
        code: state.roomCode,
        puck: state.puck,
        scores: state.scores,
      });
    }
  }

  draw();
  requestAnimationFrame(tick);
};

let socket = null;

const initSocket = () => {
  if (!window.io) return;
  socket = window.io(apiBase, { transports: ["websocket", "polling"] });

  socket.on("connect", () => {
    ui.duelStatus.textContent = "Сервер подключён. Создай комнату или введи код.";
  });

  socket.on("disconnect", () => {
    ui.duelStatus.textContent = "Соединение с сервером потеряно.";
    state.duelConnected = false;
    state.roomCode = null;
    state.onlineRole = null;
    updateModeUI();
  });

  socket.on("room:created", ({ code, role }) => {
    state.roomCode = code;
    state.onlineRole = role;
    state.duelConnected = false;
    ui.duelRoomCode.value = code;
    ui.duelStatus.textContent = `Комната создана: ${code}. Ждём друга...`;
    updateModeUI();
  });

  socket.on("room:joined", ({ code, role }) => {
    state.roomCode = code;
    state.onlineRole = role;
    state.duelConnected = true;
    ui.duelRoomCode.value = code;
    ui.duelStatus.textContent = `Подключено к комнате ${code}.`;
    updateModeUI();
  });

  socket.on("room:ready", ({ code }) => {
    state.duelConnected = true;
    ui.duelStatus.textContent = `Друг подключился к комнате ${code}.`;
    updateModeUI();
  });

  socket.on("room:error", ({ message }) => {
    ui.duelStatus.textContent = message || "Ошибка комнаты.";
  });

  socket.on("paddle:update", ({ x, y, side }) => {
    if (side === "left") {
      setPaddlePosition(state.leftPaddle, x, y, true);
    } else {
      setPaddlePosition(state.rightPaddle, x, y, false);
    }
  });

  socket.on("state:update", ({ puck, scores }) => {
    if (state.onlineRole === "guest") {
      state.puck = { ...state.puck, ...puck };
      state.scores = { ...state.scores, ...scores };
      ui.scoreLeft.textContent = state.scores.left;
      ui.scoreRight.textContent = state.scores.right;
    }
  });

  socket.on("match:reset", () => {
    resetScores();
  });
};

ui.rink.addEventListener("mousemove", (event) => {
  if (!state.playing) return;
  const rect = ui.rink.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const duelActive = state.mode === "duel" && state.duelConnected;
  const isLeft = !duelActive || state.onlineRole === "host";

  if (isLeft) {
    setPaddlePosition(state.leftPaddle, x, y, true);
  } else {
    setPaddlePosition(state.rightPaddle, x, y, false);
  }

  if (duelActive && socket && state.roomCode) {
    socket.emit("paddle:update", {
      code: state.roomCode,
      x: isLeft ? state.leftPaddle.x : state.rightPaddle.x,
      y: isLeft ? state.leftPaddle.y : state.rightPaddle.y,
      side: isLeft ? "left" : "right",
    });
  }
});

ui.modeCards.forEach((card) => {
  card.addEventListener("click", () => {
    state.mode = card.dataset.mode;
    updateModeUI();
  });
});

ui.botDifficulty.addEventListener("change", (event) => {
  state.botDifficulty = event.target.value;
});

ui.queueToggle.addEventListener("click", () => {
  state.queue = !state.queue;
  ui.queueToggle.textContent = state.queue ? "Выйти из очереди" : "Встать в очередь";
  ui.queueStatus.textContent = state.queue ? "Поиск соперника..." : "Очередь выключена";
});

ui.createRoom.addEventListener("click", () => {
  if (!socket) {
    ui.duelStatus.textContent = "Нет соединения с сервером.";
    return;
  }
  socket.emit("room:create");
});

ui.joinRoom.addEventListener("click", () => {
  const code = ui.duelRoomCode.value.trim().toUpperCase();
  if (!code) {
    ui.duelStatus.textContent = "Введите код комнаты.";
    return;
  }
  if (!socket) {
    ui.duelStatus.textContent = "Нет соединения с сервером.";
    return;
  }
  socket.emit("room:join", { code });
});

ui.startMatch.addEventListener("click", () => {
  state.playing = true;
  ui.rinkOverlay.classList.add("hidden");
});

ui.resetMatch.addEventListener("click", () => {
  resetScores();
  resetPositions();
  draw();
  if (state.mode === "duel" && state.duelConnected && state.onlineRole === "host" && socket) {
    socket.emit("match:reset", { code: state.roomCode });
  }
  showToast("Матч сброшен");
});

ui.playNow.addEventListener("click", () => {
  showSection("arena");
  state.playing = true;
  ui.rinkOverlay.classList.add("hidden");
});

ui.openRegistrationTop.addEventListener("click", () => {
  showSection("register");
});

ui.openArena.addEventListener("click", () => {
  showSection("arena");
});

ui.profileBtn.addEventListener("click", openProfile);
ui.closeProfile.addEventListener("click", closeProfile);
ui.profileModal.addEventListener("click", (event) => {
  if (event.target === ui.profileModal) closeProfile();
});

ui.confirmCode.addEventListener("click", () => {
  const nick = ui.regNickname.value.trim();
  const email = ui.regEmail.value.trim();
  const password = ui.regPassword.value.trim();
  const code = ui.regCode.value.trim();
  if (!code) {
    ui.registerStatus.textContent = "Введите код из письма.";
    return;
  }
  ui.registerStatus.textContent = "Проверяем код...";
  registerUser({ nickname: nick, email, password, code })
    .then((data) => {
      const user = data.user || { nickname: nick, email, password, elo: 0, games: 0 };
      saveUser(user);
      state.profile.nickname = user.nickname;
      state.profile.elo = user.elo ?? 0;
      state.profile.games = user.games ?? 0;
      saveProfile();
      updateProfileUI();
      syncLeaderboard();
      ui.registerStatus.textContent = `Профиль ${user.nickname} создан.`;
      showToast("Профиль создан");
      showSection("login");
    })
    .catch((err) => {
      ui.registerStatus.textContent = err.message;
    });
});

ui.registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nick = ui.regNickname.value.trim();
  const email = ui.regEmail.value.trim();
  const password = ui.regPassword.value.trim();
  if (!nick) {
    ui.registerStatus.textContent = "Введите ник для регистрации.";
    return;
  }
  if (!email || !isValidEmail(email)) {
    ui.registerStatus.textContent = "Введите корректный email.";
    return;
  }
  if (!password || password.length < 4) {
    ui.registerStatus.textContent = "Пароль должен быть не короче 4 символов.";
    return;
  }

  ui.registerStatus.textContent = "Отправляем код на почту...";
  requestCode(email, nick)
    .then(() => {
      ui.codeBox.classList.remove("hidden");
      ui.registerStatus.textContent = "Код отправлен. Введите его ниже.";
    })
    .catch((err) => {
      ui.registerStatus.textContent = err.message;
    });
});

ui.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const nick = ui.loginNickname.value.trim();
  const password = ui.loginPassword.value.trim();
  if (!nick || !password) {
    ui.loginStatus.textContent = "Введите ник и пароль.";
    return;
  }
  ui.loginStatus.textContent = "Проверяем...";
  loginUser({ nickname: nick, password })
    .then((data) => {
      const user = data.user;
      if (!user) {
        ui.loginStatus.textContent = "Ник не найден на сервере.";
        return;
      }
      saveUser(user);
      state.profile.nickname = user.nickname;
      state.profile.elo = user.elo ?? 0;
      state.profile.games = user.games ?? 0;
      saveProfile();
      updateProfileUI();
      syncLeaderboard();
      ui.loginStatus.textContent = "Вход выполнен. Удачной игры!";
      showToast("Добро пожаловать");
      showSection("home");
    })
    .catch((err) => {
      ui.loginStatus.textContent = err.message;
    });
});

const init = () => {
  loadProfile();
  updateProfileUI();
  updateHeroStatus();
  updateModeUI();
  syncLeaderboard();
  updateRinkSize();
  resetScores();
  initSocket();
  showSection("register");
  window.addEventListener("resize", updateRinkSize);
  requestAnimationFrame((time) => {
    state.lastTime = time;
    requestAnimationFrame(tick);
  });
};

init();
