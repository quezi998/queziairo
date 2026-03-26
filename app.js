const profileKey = "airHockeyProfile";
const leaderboardKey = "airHockeyLeaderboard";
const userKey = "airHockeyUser";
const registerDraftKey = "airHockeyRegisterDraft";

const matchTarget = 3;
const goalToastDuration = 1200;
const goalCooldownMs = 700;
const characterKey = "airHockeyCharacter";
const characterStatsKey = "airHockeyCharacterStats";

const ui = {
  profileModal: document.getElementById("profile"),
  profileName: document.getElementById("profileName"),
  profileElo: document.getElementById("profileElo"),
  profileGames: document.getElementById("profileGames"),
  profileFavorite: document.getElementById("profileFavorite"),
  heroStatus: document.getElementById("heroStatus"),
  openCharacter: document.getElementById("openCharacter"),
  characterDot: document.getElementById("characterDot"),
  characterLabel: document.getElementById("characterLabel"),
  openShop: document.getElementById("openShop"),
  openPlay: document.getElementById("openPlay"),
  openProfile: document.getElementById("openProfile"),
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
  botOptions: document.getElementById("botOptions"),
  onlineOptions: document.getElementById("onlineOptions"),
  duelOptions: document.getElementById("duelOptions"),
  botDifficulty: document.getElementById("botDifficulty"),
  queueToggle: document.getElementById("queueToggle"),
  queueStatus: document.getElementById("queueStatus"),
  duelNickname: document.getElementById("duelNickname"),
  sendInvite: document.getElementById("sendInvite"),
  duelStatus: document.getElementById("duelStatus"),
  registerForm: document.getElementById("registerForm"),
  regNickname: document.getElementById("regNickname"),
  regPassword: document.getElementById("regPassword"),
  registerStatus: document.getElementById("registerStatus"),
  loginForm: document.getElementById("loginForm"),
  loginNickname: document.getElementById("loginNickname"),
  loginPassword: document.getElementById("loginPassword"),
  loginStatus: document.getElementById("loginStatus"),
  goLogin: document.getElementById("goLogin"),
  goRegister: document.getElementById("goRegister"),
  registeredLogin: document.getElementById("registeredLogin"),
  registeredProfile: document.getElementById("registeredProfile"),
  registeredNick: document.getElementById("registeredNick"),
  shopCards: document.querySelectorAll(".shop-card"),
  shopButtons: document.querySelectorAll(".shop-select"),
  duelModal: document.getElementById("duelModal"),
  duelModalTitle: document.getElementById("duelModalTitle"),
  duelModalText: document.getElementById("duelModalText"),
  closeDuelModal: document.getElementById("closeDuelModal"),
  acceptDuel: document.getElementById("acceptDuel"),
  declineDuel: document.getElementById("declineDuel"),
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
  authenticated: false,
  scores: { left: 0, right: 0 },
  playing: false,
  rink: { width: 0, height: 0 },
  leftPaddle: { x: 0, y: 0 },
  rightPaddle: { x: 0, y: 0 },
  puck: { x: 0, y: 0, vx: 220, vy: 120 },
  lastTime: 0,
  lastGoalAt: 0,
  matchLocked: false,
  controlTarget: null,
  character: "kompot",
  characterStats: {},
};

const sectionOrder = ["register", "registered", "login", "home", "shop", "profile", "arena"];

const showSection = (id) => {
  const protectedSections = ["home", "shop", "profile", "arena"];
  if (protectedSections.includes(id) && !state.authenticated) {
    const storedUser = loadUser();
    id = storedUser ? "login" : "register";
  }
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

const characters = {
  kompot: {
    id: "kompot",
    label: "Компот",
    speed: 520,
    radius: 30,
    hitRadius: 27,
    hitBoost: 55,
    image: "assets/kompot.jpg",
  },
  karamelka: {
    id: "karamelka",
    label: "Карамелька",
    speed: 1150,
    radius: 23,
    hitRadius: 23,
    hitBoost: 75,
    image: "assets/karamelka.jpg",
  },
  korzhik: {
    id: "korzhik",
    label: "Коржик",
    speed: 850,
    radius: 23,
    hitRadius: 23,
    hitBoost: 90,
    image: "assets/korzhik.jpg",
  },
  gonya: {
    id: "gonya",
    label: "Гоня",
    speed: 1000,
    radius: 23,
    hitRadius: 23,
    hitBoost: 60,
    image: "assets/gonya.jpg",
  },
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

const saveRegisterDraft = (draft) => {
  localStorage.setItem(registerDraftKey, JSON.stringify(draft));
};

const loadRegisterDraft = () => {
  const stored = localStorage.getItem(registerDraftKey);
  if (!stored) return { nickname: "", password: "" };
  try {
    return JSON.parse(stored);
  } catch (err) {
    return { nickname: "", password: "" };
  }
};

const loadCharacter = () => {
  const stored = localStorage.getItem(characterKey);
  if (stored && characters[stored]) return stored;
  return "kompot";
};

const saveCharacter = (id) => {
  localStorage.setItem(characterKey, id);
};

const loadCharacterStats = () => {
  const stored = localStorage.getItem(characterStatsKey);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch (err) {
    return {};
  }
};

const saveCharacterStats = () => {
  localStorage.setItem(characterStatsKey, JSON.stringify(state.characterStats));
};

const isValidPassword = (value) => value && value.length >= 4;

const updateProfileUI = () => {
  ui.profileName.textContent = state.profile.nickname;
  ui.profileElo.textContent = state.profile.elo;
  ui.profileGames.textContent = state.profile.games;
  ui.profileFavorite.textContent = getFavoriteCharacterLabel();
};

const getFavoriteCharacterLabel = () => {
  const entries = Object.entries(state.characterStats);
  if (!entries.length) return "Компот";
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries[0][0];
  return characters[top]?.label || "Компот";
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

const applyCharacter = (id) => {
  const character = characters[id] || characters.kompot;
  state.character = character.id;
  saveCharacter(character.id);

  const targetPaddle = state.leftPaddle;
  targetPaddle.radius = character.radius;
  targetPaddle.hitRadius = character.hitRadius;
  targetPaddle.hitBoost = character.hitBoost;
  updatePaddleStyles();

  ui.shopCards.forEach((card) => {
    card.classList.toggle("is-active", card.dataset.character === character.id);
  });
  ui.shopButtons.forEach((btn) => {
    const card = btn.closest(".shop-card");
    if (!card) return;
    btn.textContent = card.dataset.character === character.id ? "Выбран" : "Выбрать";
  });
  updateSelectedCharacterUI();
};

const updatePaddleStyles = () => {
  const left = state.leftPaddle.radius || 23;
  const right = state.rightPaddle.radius || 23;

  ui.paddleLeft.style.width = `${left * 2}px`;
  ui.paddleLeft.style.height = `${left * 2}px`;
  ui.paddleRight.style.width = `${right * 2}px`;
  ui.paddleRight.style.height = `${right * 2}px`;

  const character = characters[state.character] || characters.kompot;
  if (character.image) {
    ui.paddleLeft.style.backgroundImage = `url(${character.image})`;
    ui.paddleLeft.style.backgroundSize = "cover";
    ui.paddleLeft.style.backgroundPosition = "center";
  }
};

const updateSelectedCharacterUI = () => {
  const character = characters[state.character] || characters.kompot;
  if (ui.characterLabel) {
    ui.characterLabel.textContent = `Персонаж: ${character.label}`;
  }
  if (ui.characterDot) {
    ui.characterDot.style.backgroundImage = character.image ? `url(${character.image})` : "none";
  }
};

const updateModeUI = () => {
  ui.botOptions.classList.toggle("hidden", state.mode !== "bot");
  ui.onlineOptions.classList.toggle("hidden", state.mode !== "online");
  ui.duelOptions.classList.toggle("hidden", state.mode !== "duel");
  const labelMap = {
    bot: "Режим: Бот",
    online: "Режим: Онлайн",
    duel: "Режим: Дуэль",
  };
  ui.matchStatus.textContent = labelMap[state.mode];
  applyCharacter(state.character);
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
  const radius = paddle.radius || 23;
  const half = state.rink.width / 2;
  const minX = leftSide ? radius : half + radius;
  const maxX = leftSide ? half - radius : state.rink.width - radius;
  paddle.x = clamp(x, minX, maxX);
  paddle.y = clamp(y, radius, state.rink.height - radius);
};

const draw = () => {
  const leftRadius = state.leftPaddle.radius || 23;
  const rightRadius = state.rightPaddle.radius || 23;
  ui.paddleLeft.style.transform = `translate(${state.leftPaddle.x - leftRadius}px, ${state.leftPaddle.y - leftRadius}px)`;
  ui.paddleRight.style.transform = `translate(${state.rightPaddle.x - rightRadius}px, ${state.rightPaddle.y - rightRadius}px)`;
  ui.puck.style.transform = `translate(${state.puck.x - 12}px, ${state.puck.y - 12}px)`;
};

const handleGoal = (scorer) => {
  const now = Date.now();
  if (now - state.lastGoalAt < goalCooldownMs || state.matchLocked) {
    return;
  }
  state.lastGoalAt = now;

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
    state.matchLocked = true;
    if (state.scores.left > state.scores.right) {
      state.profile.elo += 200;
      state.profile.games += 1;
      saveProfile();
      updateProfileUI();
      showToast("Победа! +200 ЭЛО");
    } else {
      state.profile.games += 1;
      saveProfile();
      updateProfileUI();
      showToast("Матч завершён");
    }

    state.characterStats[state.character] = (state.characterStats[state.character] || 0) + 1;
    saveCharacterStats();
    updateProfileUI();

    resetScores();
    setTimeout(() => {
      state.matchLocked = false;
    }, goalCooldownMs);
  }

  const { width, height } = state.rink;
  state.puck.y = height / 2;
  state.puck.vx = scorer === "left" ? 240 : -240;
  state.puck.vy = (Math.random() * 160 - 80) || 80;
  state.puck.x = scorer === "left" ? width * 0.65 : width * 0.35;
};

const updatePhysics = (delta) => {
  const puckRadius = 12;
  const paddleRadiusLeft = state.leftPaddle.hitRadius || 23;
  const paddleRadiusRight = state.rightPaddle.hitRadius || 23;
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
      return;
    }
    state.puck.vx *= -1;
    state.puck.x = puckRadius + 1;
  }

  if (state.puck.x + puckRadius >= width) {
    if (state.puck.y >= goalTop && state.puck.y <= goalBottom) {
      handleGoal("left");
      return;
    }
    state.puck.vx *= -1;
    state.puck.x = width - puckRadius - 1;
  }

  const collide = (paddle, paddleRadius) => {
    const dx = state.puck.x - paddle.x;
    const dy = state.puck.y - paddle.y;
    const dist = Math.hypot(dx, dy);
    const minDist = puckRadius + paddleRadius;
    if (dist < minDist) {
      const nx = dx / dist || 1;
      const ny = dy / dist || 0;
      const speed = Math.hypot(state.puck.vx, state.puck.vy);
      const boost = paddle.hitBoost ?? 60;
      state.puck.vx = nx * (speed + boost);
      state.puck.vy = ny * (speed + boost);
      state.puck.x = paddle.x + nx * minDist;
      state.puck.y = paddle.y + ny * minDist;
    }
  };

  collide(state.leftPaddle, paddleRadiusLeft);
  collide(state.rightPaddle, paddleRadiusRight);
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

  if (state.controlTarget) {
    const character = characters[state.character] || characters.kompot;
    const speed = character.speed;
    const { x, y } = state.controlTarget;
    const paddle = state.leftPaddle;
    const dx = x - paddle.x;
    const dy = y - paddle.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 0) {
      const step = speed * delta;
      const move = Math.min(step, dist);
      setPaddlePosition(
        paddle,
        paddle.x + (dx / dist) * move,
        paddle.y + (dy / dist) * move,
        true
      );
    }
  }

  if (state.mode === "bot") {
    updateBot(delta);
  } else {
    updateIdleOpponent(delta);
  }

  updatePhysics(delta);
  draw();
  requestAnimationFrame(tick);
};

if (ui.rink) {
  ui.rink.addEventListener("mousemove", (event) => {
    if (!state.playing) return;
    const rect = ui.rink.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    state.controlTarget = { x, y };
  });
}

if (ui.botDifficulty) {
  ui.botDifficulty.addEventListener("change", (event) => {
    state.botDifficulty = event.target.value;
  });
}

if (ui.queueToggle) {
  ui.queueToggle.addEventListener("click", () => {
    state.queue = !state.queue;
    ui.queueToggle.textContent = state.queue ? "Выйти из очереди" : "Встать в очередь";
    ui.queueStatus.textContent = state.queue ? "Подбор участников..." : "Очередь выключена";
  });
}

if (ui.sendInvite) {
  ui.sendInvite.addEventListener("click", () => {
    const nick = ui.duelNickname.value.trim();
    if (!nick) {
      ui.duelStatus.textContent = "Введите ник соперника.";
      return;
    }
    ui.duelModalTitle.textContent = "Дуэль";
    ui.duelModalText.textContent = `${nick} хочет сыграть в дуэль с вами.`;
    ui.duelModal.classList.add("show");
  });
}

if (ui.closeDuelModal) {
  ui.closeDuelModal.addEventListener("click", () => {
    ui.duelModal.classList.remove("show");
  });
}

if (ui.acceptDuel) {
  ui.acceptDuel.addEventListener("click", () => {
    ui.duelModal.classList.remove("show");
    ui.duelStatus.textContent = "Дуэль принята. Старт!";
  });
}

if (ui.declineDuel) {
  ui.declineDuel.addEventListener("click", () => {
    ui.duelModal.classList.remove("show");
    ui.duelStatus.textContent = "Дуэль отклонена.";
  });
}

if (ui.startMatch) {
  ui.startMatch.addEventListener("click", () => {
    state.playing = true;
    ui.rinkOverlay.classList.add("hidden");
  });
}

if (ui.resetMatch) {
  ui.resetMatch.addEventListener("click", () => {
    resetScores();
    resetPositions();
    draw();
    showToast("Матч сброшен");
  });
}

if (ui.openShop) {
  ui.openShop.addEventListener("click", () => {
    showSection("shop");
  });
}

if (ui.openCharacter) {
  ui.openCharacter.addEventListener("click", () => {
    showSection("shop");
  });
}

if (ui.openPlay) {
  ui.openPlay.addEventListener("click", () => {
    showSection("arena");
  });
}

if (ui.openProfile) {
  ui.openProfile.addEventListener("click", () => {
    showSection("profile");
  });
}

if (ui.goLogin) {
  ui.goLogin.addEventListener("click", () => {
    showSection("login");
  });
}

if (ui.goRegister) {
  ui.goRegister.addEventListener("click", () => {
    showSection("register");
  });
}

if (ui.registeredLogin) {
  ui.registeredLogin.addEventListener("click", () => {
    showSection("login");
  });
}

if (ui.registeredProfile) {
  ui.registeredProfile.addEventListener("click", () => {
    showSection("profile");
  });
}

ui.shopButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".shop-card");
    if (!card) return;
    applyCharacter(card.dataset.character);
  });
});

const updateRegisterDraft = () => {
  if (!ui.regNickname || !ui.regPassword) return;
  saveRegisterDraft({
    nickname: ui.regNickname.value.trim(),
    password: ui.regPassword.value.trim(),
  });
};

if (ui.regNickname) {
  ui.regNickname.addEventListener("input", updateRegisterDraft);
}

if (ui.regPassword) {
  ui.regPassword.addEventListener("input", updateRegisterDraft);
}
if (ui.registerForm) {
  ui.registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nick = ui.regNickname.value.trim();
    const password = ui.regPassword.value.trim();
    if (!nick) {
      ui.registerStatus.textContent = "Введите ник для регистрации.";
      return;
    }
    if (!isValidPassword(password)) {
      ui.registerStatus.textContent = "Пароль должен быть не короче 4 символов.";
      return;
    }
    const user = { nickname: nick, password, elo: 0, games: 0 };
    saveUser(user);
    state.profile.nickname = user.nickname;
    state.profile.elo = 0;
    state.profile.games = 0;
    saveProfile();
    updateProfileUI();
    ui.registerStatus.textContent = "Вы зарегистрировались. Теперь войдите.";
    if (ui.registeredNick) {
      ui.registeredNick.textContent = nick;
    }
    if (ui.loginNickname) {
      ui.loginNickname.value = nick;
    }
    showToast("Вы зарегистрировались");
    showSection("registered");
  });
}

if (ui.loginForm) {
  ui.loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nick = ui.loginNickname.value.trim();
    const password = ui.loginPassword.value.trim();
    if (!nick || !password) {
      ui.loginStatus.textContent = "Введите ник и пароль.";
      return;
    }
    const storedUser = loadUser();
    if (!storedUser || storedUser.nickname !== nick) {
      ui.loginStatus.textContent = "Ник не найден. Сначала зарегистрируйся.";
      return;
    }
    if (storedUser.password !== password) {
      ui.loginStatus.textContent = "Неверный пароль.";
      return;
    }
    state.profile.nickname = storedUser.nickname;
    state.profile.elo = storedUser.elo ?? 0;
    state.profile.games = storedUser.games ?? 0;
    state.authenticated = true;
    saveProfile();
    updateProfileUI();
    ui.loginStatus.textContent = "Вход выполнен. Удачной игры!";
    showToast("Добро пожаловать");
    showSection("home");
  });
}

const init = () => {
  loadProfile();
  const draft = loadRegisterDraft();
  if (ui.regNickname && draft.nickname) {
    ui.regNickname.value = draft.nickname;
  }
  if (ui.regPassword && draft.password) {
    ui.regPassword.value = draft.password;
  }
  state.character = loadCharacter();
  state.characterStats = loadCharacterStats();
  state.leftPaddle.radius = characters[state.character].radius;
  state.leftPaddle.hitRadius = characters[state.character].hitRadius;
  state.leftPaddle.hitBoost = characters[state.character].hitBoost;
  state.rightPaddle.radius = 23;
  state.rightPaddle.hitRadius = 23;
  state.rightPaddle.hitBoost = 60;
  updateProfileUI();
  updateHeroStatus();
  updateModeUI();
  updateRinkSize();
  resetScores();
  updatePaddleStyles();
  const storedUser = loadUser();
  showSection(storedUser ? "login" : "register");
  window.addEventListener("resize", updateRinkSize);
  requestAnimationFrame((time) => {
    state.lastTime = time;
    requestAnimationFrame(tick);
  });
};

init();



