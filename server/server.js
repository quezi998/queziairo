import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketServer } from "socket.io";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: "*" },
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

const port = process.env.PORT || 4000;
const apiKey = process.env.SENDGRID_API_KEY;
const fromEmail = process.env.SENDGRID_FROM;

if (!apiKey || !fromEmail) {
  console.warn("Missing SENDGRID_API_KEY or SENDGRID_FROM in .env");
}

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

const codes = new Map();
const users = new Map();
const rooms = new Map();
const ttlMs = 10 * 60 * 1000;

const createCode = () => String(Math.floor(100000 + Math.random() * 900000));
const createRoomCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();

const validateCode = (email, code) => {
  const record = codes.get(email);
  if (!record) return { ok: false, message: "Код не найден." };
  if (Date.now() > record.expiresAt) {
    codes.delete(email);
    return { ok: false, message: "Код истёк." };
  }
  if (record.code !== code) {
    return { ok: false, message: "Неверный код." };
  }
  codes.delete(email);
  return { ok: true };
};

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.post("/api/send-code", async (req, res) => {
  const { email } = req.body || {};
  if (!apiKey || !fromEmail) {
    return res.status(500).json({ message: "Сервер не настроен." });
  }
  if (!email || typeof email !== "string") {
    return res.status(400).json({ message: "Нужен email." });
  }
  const code = createCode();
  codes.set(email, { code, expiresAt: Date.now() + ttlMs });

  const msg = {
    to: email,
    from: fromEmail,
    subject: "Код регистрации Айро Хоккей",
    text: `Ваш код подтверждения: ${code}. Он действует 10 минут.`,
    html: `<strong>Ваш код подтверждения: ${code}</strong><br/>Он действует 10 минут.`,
  };

  try {
    await sgMail.send(msg);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ message: "Не удалось отправить письмо." });
  }
});

app.post("/api/register", (req, res) => {
  const { nickname, email, password, code } = req.body || {};
  if (!nickname || !email || !password || !code) {
    return res.status(400).json({ message: "Нужны ник, email, пароль и код." });
  }
  if (users.has(nickname)) {
    return res.status(409).json({ message: "Ник уже зарегистрирован." });
  }
  const result = validateCode(email, code);
  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }
  const user = { nickname, email, password, elo: 0, games: 0 };
  users.set(nickname, user);
  return res.json({ ok: true, user });
});

app.post("/api/login", (req, res) => {
  const { nickname, password } = req.body || {};
  if (!nickname || !password) {
    return res.status(400).json({ message: "Нужны ник и пароль." });
  }
  const user = users.get(nickname);
  if (!user) {
    return res.status(404).json({ message: "Ник не найден на сервере." });
  }
  if (user.password !== password) {
    return res.status(401).json({ message: "Неверный пароль." });
  }
  return res.json({ ok: true, user });
});

io.on("connection", (socket) => {
  socket.on("room:create", () => {
    const code = createRoomCode();
    rooms.set(code, { hostId: socket.id, guestId: null });
    socket.join(code);
    socket.emit("room:created", { code, role: "host" });
  });

  socket.on("room:join", ({ code }) => {
    const room = rooms.get(code);
    if (!room) {
      socket.emit("room:error", { message: "Комната не найдена." });
      return;
    }
    if (room.guestId) {
      socket.emit("room:error", { message: "Комната уже занята." });
      return;
    }
    room.guestId = socket.id;
    socket.join(code);
    socket.emit("room:joined", { code, role: "guest" });
    io.to(room.hostId).emit("room:ready", { code });
  });

  socket.on("paddle:update", ({ code, x, y, side }) => {
    if (!code) return;
    socket.to(code).emit("paddle:update", { x, y, side });
  });

  socket.on("state:update", ({ code, puck, scores }) => {
    if (!code) return;
    socket.to(code).emit("state:update", { puck, scores });
  });

  socket.on("match:reset", ({ code }) => {
    if (!code) return;
    socket.to(code).emit("match:reset");
  });

  socket.on("disconnect", () => {
    for (const [code, room] of rooms.entries()) {
      if (room.hostId === socket.id || room.guestId === socket.id) {
        rooms.delete(code);
        socket.to(code).emit("room:error", { message: "Соперник отключился." });
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
