import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USERS_PATH = path.join(__dirname, "../data/users.json");

const JWT_SECRET = process.env.JWT_SECRET || "brainhub-dev-secret-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function readUsers() {
  if (!fs.existsSync(USERS_PATH)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeUsers(users) {
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
}

// Seed a demo account on first boot so the app can be tried without signing up.
function ensureDemoUser() {
  const users = readUsers();
  if (users.length === 0) {
    const demoUser = {
      id: "demo",
      name: "Demo User",
      email: "demo@brainhub.ai",
      passwordHash: bcrypt.hashSync("demo1234", 10),
      createdAt: new Date().toISOString(),
    };
    writeUsers([demoUser]);
  }
}
ensureDemoUser();

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

async function register({ name, email, password }) {
  if (!name || !name.trim()) throw Object.assign(new Error("Name is required"), { status: 400 });
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw Object.assign(new Error("A valid email is required"), { status: 400 });
  if (!password || password.length < 6)
    throw Object.assign(new Error("Password must be at least 6 characters"), { status: 400 });

  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  if (users.some((u) => u.email === normalizedEmail)) {
    throw Object.assign(new Error("An account with this email already exists"), { status: 409 });
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);

  return { user: publicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    throw Object.assign(new Error("Email and password are required"), { status: 400 });
  }
  const users = readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user) throw Object.assign(new Error("Invalid email or password"), { status: 401 });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw Object.assign(new Error("Invalid email or password"), { status: 401 });

  return { user: publicUser(user), token: signToken(user) };
}

function getUserById(id) {
  const user = readUsers().find((u) => u.id === id);
  return user ? publicUser(user) : null;
}

export { register, login, verifyToken, getUserById, publicUser };
