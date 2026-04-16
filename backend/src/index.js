const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const sanitizeHtml = require("sanitize-html");
const { z } = require("zod");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
const TOKEN_TTL = "7d";
const CORS_ORIGINS = (process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const PHONE_PATTERN = /^\+?[0-9()\-\s]{7,20}$/;
const HTTP_URL_PATTERN = /^https?:\/\//i;
const DATA_IMAGE_PATTERN = /^data:image\//i;
const MAX_DATA_IMAGE_LENGTH = 900000;
const MAX_PROFILE_IMAGE_DATA_LENGTH = 700000;
const MAX_EVENT_CONTENT_HTML_LENGTH = 60000;
const MAX_EVENT_CONTENT_TEXT_LENGTH = 20000;
const MAX_EVENT_TITLE_LENGTH = 180;
const READ_LIST_LIMIT = 500;
const WRITE_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

const optionalImageUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") return true;
      if (DATA_IMAGE_PATTERN.test(value)) {
        return value.length <= MAX_DATA_IMAGE_LENGTH;
      }
      return value.length <= 2048 && HTTP_URL_PATTERN.test(value);
    },
    "Укажите корректную ссылку на изображение."
  )
  .nullable()
  .optional();

const optionalAvatarUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (value === "") return true;
      if (DATA_IMAGE_PATTERN.test(value)) {
        return value.length <= MAX_PROFILE_IMAGE_DATA_LENGTH;
      }
      return value.length <= 2048 && HTTP_URL_PATTERN.test(value);
    },
    "Укажите корректную ссылку на аватар."
  )
  .nullable()
  .optional();

class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Слишком много попыток авторизации. Попробуйте позже." },
});

const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Слишком много запросов. Попробуйте через минуту." },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => !WRITE_METHODS.has(req.method),
  message: { message: "Слишком много операций записи. Повторите позже." },
});

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new AppError(403, "Источник запроса не разрешен CORS."));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/api", globalApiLimiter);
app.use("/api", writeLimiter);

function asInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function buildToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    role: user.role,
    institutionId: user.institutionId,
    institution: user.institution ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function parseValidation(schema, payload) {
  const result = schema.safeParse(payload);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    throw new AppError(400, "Ошибка валидации.", errors);
  }
  return result.data;
}

function normalizeImageUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getPositiveInt(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
}

function sanitizeEventContent(value) {
  const raw = String(value || "");
  if (raw.length > MAX_EVENT_CONTENT_HTML_LENGTH) {
    throw new AppError(400, "Контент мероприятия слишком большой.");
  }

  const cleaned = sanitizeHtml(raw, {
    allowedTags: [
      "h2",
      "h3",
      "h4",
      "p",
      "blockquote",
      "ul",
      "ol",
      "li",
      "strong",
      "em",
      "u",
      "a",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "br",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      th: ["colspan", "rowspan"],
      td: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", {
        rel: "noopener noreferrer nofollow",
        target: "_blank",
      }),
    },
  }).trim();

  const plainText = sanitizeHtml(cleaned, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
  if (!plainText) {
    throw new AppError(400, "Контент мероприятия не должен быть пустым.");
  }
  if (plainText.length > MAX_EVENT_CONTENT_TEXT_LENGTH) {
    throw new AppError(400, "Текст контента мероприятия слишком большой.");
  }

  return cleaned;
}

async function getAuthUser(req) {
  if (!req.auth?.userId) return null;
  return prisma.user.findUnique({
    where: { id: req.auth.userId },
    include: { institution: true },
  });
}

function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    if (!header.startsWith("Bearer ")) {
      throw new AppError(401, "Требуется авторизация.");
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET);
    req.auth = {
      userId: Number(payload.sub),
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, "Недействительный токен."));
  }
}

function adminOnly(req, _res, next) {
  if (req.auth?.role !== "ADMIN") {
    console.warn("[SECURITY] user tried admin endpoint", {
      userId: req.auth?.userId ?? null,
      email: req.auth?.email ?? null,
      path: req.originalUrl,
    });
    return next(new AppError(403, "Доступ только для администратора."));
  }
  return next();
}

async function ensureInstitutionExists(id) {
  if (id === null || id === undefined) return null;
  const institution = await prisma.institution.findUnique({
    where: { id },
  });
  if (!institution) {
    throw new AppError(404, "Учебное заведение не найдено.");
  }
  return institution;
}

function serializeEventForUser(event, userId, userInstitutionId) {
  const isPast = event.startAt.getTime() <= Date.now();
  const isPublished = event.status === "PUBLISHED";
  const isAccessibleByInstitution =
    event.isPublic || (userInstitutionId !== null && userInstitutionId !== undefined && event.institutionId === userInstitutionId);
  const isAccessible = isPublished && isAccessibleByInstitution;
  const isRegistered = event.participants.some((item) => item.userId === userId);
  const canRegister = isAccessible && !isPast && !isRegistered;

  return {
    id: event.id,
    title: event.title,
    imageUrl: event.imageUrl,
    content: event.content,
    startAt: event.startAt,
    endAt: event.endAt,
    isPublic: event.isPublic,
    status: event.status,
    institutionId: event.institutionId,
    institution: event.institution,
    participantsCount: event._count.participants,
    isRegistered,
    isPast,
    isAccessible,
    canRegister,
  };
}

const registerSchema = z
  .object({
    fullName: z.string().trim().min(5, "ФИО должно содержать минимум 5 символов.").max(120),
    phone: z
      .string()
      .trim()
      .refine((value) => value === "" || PHONE_PATTERN.test(value), "Некорректный формат телефона.")
      .optional(),
    email: z.string().trim().email("Некорректный email.").max(180),
    password: z.string().min(8, "Пароль должен быть минимум 8 символов.").max(120),
    institutionId: z.number().int().positive().optional(),
  })
  .strict();

const loginSchema = z
  .object({
    email: z.string().trim().email("Некорректный email.").max(180),
    password: z.string().min(1, "Пароль обязателен.").max(120),
  })
  .strict();

const mePatchSchema = z
  .object({
    phone: z
      .string()
      .trim()
      .min(1, "Телефон обязателен.")
      .refine((value) => PHONE_PATTERN.test(value), "Некорректный формат телефона.")
      .optional(),
    avatarUrl: optionalAvatarUrlSchema,
    institutionId: z.number().int().positive().nullable().optional(),
  })
  .strict();

const adminInstitutionCreateSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
  })
  .strict();

const adminInstitutionPatchSchema = z
  .object({
    name: z.string().trim().min(2).max(180),
  })
  .strict();

const adminUserCreateSchema = z
  .object({
    fullName: z.string().trim().min(5).max(120),
    phone: z
      .string()
      .trim()
      .min(1)
      .refine((value) => PHONE_PATTERN.test(value), "Некорректный формат телефона."),
    email: z.string().trim().email().max(180),
    password: z.string().min(8).max(120),
    role: z.enum(["USER", "ADMIN"]).default("USER"),
    institutionId: z.number().int().positive().nullable().optional(),
  })
  .strict();

const adminEventCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Название обязательно.").max(MAX_EVENT_TITLE_LENGTH),
    content: z.string().trim().min(1, "Описание обязательно.").max(MAX_EVENT_CONTENT_HTML_LENGTH),
    imageUrl: optionalImageUrlSchema,
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    institutionId: z.number().int().positive().nullable().optional(),
    isPublic: z.boolean(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  })
  .strict()
  .refine((data) => new Date(data.startAt).getTime() < new Date(data.endAt).getTime(), {
    message: "Дата начала должна быть раньше даты окончания.",
    path: ["startAt"],
  });

const adminEventPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_EVENT_TITLE_LENGTH).optional(),
    content: z.string().trim().min(1).max(MAX_EVENT_CONTENT_HTML_LENGTH).optional(),
    imageUrl: optionalImageUrlSchema,
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    institutionId: z.number().int().positive().nullable().optional(),
    isPublic: z.boolean().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  })
  .strict()
  .refine(
    (data) => {
      if (!data.startAt || !data.endAt) return true;
      return new Date(data.startAt).getTime() < new Date(data.endAt).getTime();
    },
    {
      message: "Дата начала должна быть раньше даты окончания.",
      path: ["startAt"],
    }
  );

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post("/api/auth/register", authLimiter, async (req, res, next) => {
  try {
    const payload = parseValidation(registerSchema, req.body);
    if (payload.institutionId !== undefined) {
      await ensureInstitutionExists(payload.institutionId);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await prisma.user.create({
      data: {
        name: payload.fullName,
        phone: payload.phone || null,
        email: payload.email.toLowerCase(),
        passwordHash,
        role: "USER",
        institutionId: payload.institutionId ?? null,
      },
      include: { institution: true },
    });

    const token = buildToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === "P2002") {
      return next(new AppError(409, "Пользователь с таким email уже существует."));
    }
    return next(error);
  }
});

app.post("/api/auth/login", authLimiter, async (req, res, next) => {
  try {
    const payload = parseValidation(loginSchema, req.body);
    const user = await prisma.user.findUnique({
      where: { email: payload.email.toLowerCase() },
      include: { institution: true },
    });
    if (!user) {
      console.warn("[SECURITY] failed login (email not found)", { email: payload.email });
      throw new AppError(401, "Неверный email или пароль.");
    }

    const passwordValid = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordValid) {
      console.warn("[SECURITY] failed login (wrong password)", { email: payload.email, userId: user.id });
      throw new AppError(401, "Неверный email или пароль.");
    }

    const token = buildToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    next(error);
  }
});

app.get("/api/auth/me", authRequired, async (req, res, next) => {
  try {
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");
    res.json(sanitizeUser(me));
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/me", authRequired, async (req, res, next) => {
  try {
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");
    res.json(sanitizeUser(me));
  } catch (error) {
    next(error);
  }
});

app.patch("/api/users/me", authRequired, async (req, res, next) => {
  try {
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");
    const payload = parseValidation(mePatchSchema, req.body);

    if (payload.institutionId !== undefined) {
      await ensureInstitutionExists(payload.institutionId);
    }

    const updated = await prisma.user.update({
      where: { id: me.id },
      data: {
        phone: payload.phone === undefined ? me.phone : payload.phone,
        avatarUrl: payload.avatarUrl === undefined ? me.avatarUrl : normalizeImageUrl(payload.avatarUrl),
        institutionId: payload.institutionId === undefined ? me.institutionId : payload.institutionId,
      },
      include: { institution: true },
    });

    res.json(sanitizeUser(updated));
  } catch (error) {
    next(error);
  }
});

app.get("/api/institutions", async (_req, res, next) => {
  try {
    const institutions = await prisma.institution.findMany({
      take: READ_LIST_LIMIT,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true, events: true },
        },
      },
    });
    res.json(institutions);
  } catch (error) {
    next(error);
  }
});

app.get("/api/events", authRequired, async (req, res, next) => {
  try {
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");

    const filterType = String(req.query.filter || "all");
    if (!["all", "upcoming", "past", "mine"].includes(filterType)) {
      throw new AppError(400, "Некорректный фильтр мероприятий.");
    }

    const now = new Date();
    const institutionAccessWhere =
      me.institutionId === null || me.institutionId === undefined
        ? [{ isPublic: true }]
        : [{ isPublic: true }, { institutionId: me.institutionId }];

    const events = await prisma.event.findMany({
      where: {
        status: "PUBLISHED",
        OR: institutionAccessWhere,
      },
      take: READ_LIST_LIMIT,
      include: {
        institution: true,
        participants: {
          where: { userId: me.id },
          select: { userId: true },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startAt: "asc" },
    });

    let serialized = events
      .map((event) => serializeEventForUser(event, me.id, me.institutionId))
      .filter((event) => event.isAccessible);
    if (filterType === "upcoming") {
      serialized = serialized.filter((event) => event.startAt > now);
    } else if (filterType === "past") {
      serialized = serialized.filter((event) => event.startAt <= now);
    } else if (filterType === "mine") {
      serialized = serialized.filter((event) => event.isRegistered);
    }

    res.json(serialized);
  } catch (error) {
    next(error);
  }
});

app.get("/api/events/:id", authRequired, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    if (!eventId) throw new AppError(400, "Некорректный id мероприятия.");
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        institution: true,
        participants: {
          where: { userId: me.id },
          select: { userId: true },
        },
        _count: {
          select: { participants: true },
        },
      },
    });
    if (!event) throw new AppError(404, "Мероприятие не найдено.");
    const hasAccess =
      event.status === "PUBLISHED" &&
      (event.isPublic || (me.institutionId !== null && me.institutionId !== undefined && event.institutionId === me.institutionId));
    if (!hasAccess) throw new AppError(404, "Мероприятие не найдено.");

    res.json(serializeEventForUser(event, me.id, me.institutionId));
  } catch (error) {
    next(error);
  }
});

app.post("/api/events/:id/register", authRequired, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    if (!eventId) throw new AppError(400, "Некорректный id мероприятия.");
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: {
          where: { userId: me.id },
          select: { userId: true },
        },
      },
    });
    if (!event) throw new AppError(404, "Мероприятие не найдено.");

    const isPublished = event.status === "PUBLISHED";
    if (!isPublished) throw new AppError(400, "Регистрация доступна только на опубликованные мероприятия.");

    if (event.startAt.getTime() <= Date.now()) {
      throw new AppError(400, "Нельзя зарегистрироваться на прошедшее мероприятие.");
    }

    const hasAccess =
      event.isPublic || (me.institutionId !== null && me.institutionId !== undefined && event.institutionId === me.institutionId);
    if (!hasAccess) {
      throw new AppError(403, "Мероприятие недоступно для вашего учебного заведения.");
    }

    if (event.participants.length > 0) {
      throw new AppError(409, "Вы уже зарегистрированы на это мероприятие.");
    }

    const registration = await prisma.userEvent.create({
      data: {
        userId: me.id,
        eventId,
      },
    });
    res.status(201).json(registration);
  } catch (error) {
    if (error.code === "P2002") {
      return next(new AppError(409, "Вы уже зарегистрированы на это мероприятие."));
    }
    next(error);
  }
});

app.delete("/api/events/:id/register", authRequired, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    if (!eventId) throw new AppError(400, "Некорректный id мероприятия.");
    const me = await getAuthUser(req);
    if (!me) throw new AppError(404, "Пользователь не найден.");

    await prisma.userEvent.delete({
      where: {
        userId_eventId: { userId: me.id, eventId },
      },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return next(new AppError(404, "Регистрация не найдена."));
    }
    next(error);
  }
});

app.get("/api/admin/dashboard", authRequired, adminOnly, async (_req, res, next) => {
  try {
    const [users, institutions, events, registrations] = await Promise.all([
      prisma.user.count(),
      prisma.institution.count(),
      prisma.event.count(),
      prisma.userEvent.count(),
    ]);
    res.json({ users, institutions, events, registrations });
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/users", authRequired, adminOnly, async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim().toLowerCase();
    const limit = getPositiveInt(req.query.limit, 200, 1, READ_LIST_LIMIT);
    const users = await prisma.user.findMany({
      where: query
        ? {
            OR: [
              { name: { contains: query } },
              { email: { contains: query } },
            ],
          }
        : undefined,
      include: {
        institution: true,
        _count: { select: { registrations: true } },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
    });
    res.json(users.map((item) => sanitizeUser(item)));
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/users", authRequired, adminOnly, async (req, res, next) => {
  try {
    const payload = parseValidation(adminUserCreateSchema, req.body);
    if (payload.institutionId !== null && payload.institutionId !== undefined) {
      await ensureInstitutionExists(payload.institutionId);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const created = await prisma.user.create({
      data: {
        name: payload.fullName,
        phone: payload.phone,
        email: payload.email.toLowerCase(),
        passwordHash,
        role: payload.role,
        institutionId: payload.institutionId ?? null,
      },
      include: { institution: true },
    });
    res.status(201).json(sanitizeUser(created));
  } catch (error) {
    if (error.code === "P2002") {
      return next(new AppError(409, "Пользователь с таким email уже существует."));
    }
    next(error);
  }
});

app.post("/api/admin/institutions", authRequired, adminOnly, async (req, res, next) => {
  try {
    const payload = parseValidation(adminInstitutionCreateSchema, req.body);
    const created = await prisma.institution.create({
      data: { name: payload.name },
    });
    res.status(201).json(created);
  } catch (error) {
    if (error.code === "P2002") {
      return next(new AppError(409, "Такое учебное заведение уже существует."));
    }
    next(error);
  }
});

app.patch("/api/admin/institutions/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const institutionId = asInt(req.params.id);
    if (!institutionId) throw new AppError(400, "Некорректный institution id.");
    const payload = parseValidation(adminInstitutionPatchSchema, req.body);
    await ensureInstitutionExists(institutionId);

    const updated = await prisma.institution.update({
      where: { id: institutionId },
      data: { name: payload.name },
    });
    res.json(updated);
  } catch (error) {
    if (error.code === "P2002") {
      return next(new AppError(409, "Такое учебное заведение уже существует."));
    }
    next(error);
  }
});

app.delete("/api/admin/institutions/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const institutionId = asInt(req.params.id);
    if (!institutionId) throw new AppError(400, "Некорректный institution id.");
    await ensureInstitutionExists(institutionId);

    const [usersCount, eventsCount] = await Promise.all([
      prisma.user.count({ where: { institutionId } }),
      prisma.event.count({ where: { institutionId } }),
    ]);

    if (usersCount > 0 || eventsCount > 0) {
      throw new AppError(
        409,
        "Нельзя удалить учебное заведение с зависимостями. Сначала удалите или переназначьте пользователей/мероприятия."
      );
    }

    await prisma.institution.delete({ where: { id: institutionId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/events", authRequired, adminOnly, async (req, res, next) => {
  try {
    const status = String(req.query.status || "").trim();
    if (status && !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      throw new AppError(400, "Некорректный статус мероприятия.");
    }
    const limit = getPositiveInt(req.query.limit, 200, 1, READ_LIST_LIMIT);
    const where = status ? { status } : undefined;
    const events = await prisma.event.findMany({
      where,
      take: limit,
      include: {
        institution: true,
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { startAt: "asc" },
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
});

app.post("/api/admin/events", authRequired, adminOnly, async (req, res, next) => {
  try {
    const payload = parseValidation(adminEventCreateSchema, req.body);
    if (!payload.isPublic && !payload.institutionId) {
      throw new AppError(400, "Для непубличного мероприятия нужно указать учебное заведение.");
    }
    if (payload.institutionId !== null && payload.institutionId !== undefined) {
      await ensureInstitutionExists(payload.institutionId);
    }

    const created = await prisma.event.create({
      data: {
        title: payload.title,
        imageUrl: normalizeImageUrl(payload.imageUrl),
        content: sanitizeEventContent(payload.content),
        startAt: new Date(payload.startAt),
        endAt: new Date(payload.endAt),
        institutionId: payload.institutionId ?? null,
        isPublic: payload.isPublic,
        status: payload.status,
      },
      include: { institution: true },
    });
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/admin/events/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    if (!eventId) throw new AppError(400, "Некорректный event id.");
    const payload = parseValidation(adminEventPatchSchema, req.body);

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, "Мероприятие не найдено.");

    if (payload.institutionId !== null && payload.institutionId !== undefined) {
      await ensureInstitutionExists(payload.institutionId);
    }

    const startAt = payload.startAt ? new Date(payload.startAt) : event.startAt;
    const endAt = payload.endAt ? new Date(payload.endAt) : event.endAt;
    if (startAt.getTime() >= endAt.getTime()) {
      throw new AppError(400, "Дата начала должна быть раньше даты окончания.");
    }

    const data = {
      title: payload.title ?? event.title,
      imageUrl: payload.imageUrl === undefined ? event.imageUrl : normalizeImageUrl(payload.imageUrl),
      content: payload.content === undefined ? event.content : sanitizeEventContent(payload.content),
      startAt,
      endAt,
      institutionId: payload.institutionId === undefined ? event.institutionId : payload.institutionId,
      isPublic: payload.isPublic ?? event.isPublic,
      status: payload.status ?? event.status,
    };

    if (!data.isPublic && !data.institutionId) {
      throw new AppError(400, "Для непубличного мероприятия нужно указать учебное заведение.");
    }

    const updated = await prisma.event.update({
      where: { id: eventId },
      data,
      include: { institution: true },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/events/:id", authRequired, adminOnly, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    if (!eventId) throw new AppError(400, "Некорректный event id.");

    const mode = String(req.query.mode || "archive");
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new AppError(404, "Мероприятие не найдено.");

    if (mode === "delete") {
      await prisma.event.delete({ where: { id: eventId } });
      return res.status(204).send();
    }

    const archived = await prisma.event.update({
      where: { id: eventId },
      data: { status: "ARCHIVED" },
    });
    return res.json(archived);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/events/:id/participants", authRequired, adminOnly, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    if (!eventId) throw new AppError(400, "Некорректный event id.");

    const q = String(req.query.q || "").trim().toLowerCase();
    const institutionId = req.query.institutionId ? asInt(req.query.institutionId) : null;
    const limit = getPositiveInt(req.query.limit, 300, 1, READ_LIST_LIMIT);

    const participants = await prisma.userEvent.findMany({
      where: {
        eventId,
        user: {
          ...(q
            ? {
                OR: [
                  { name: { contains: q } },
                  { email: { contains: q } },
                ],
              }
            : {}),
          ...(institutionId ? { institutionId } : {}),
        },
      },
      include: {
        user: {
          include: { institution: true },
        },
      },
      take: limit,
      orderBy: { registeredAt: "asc" },
    });

    res.json(participants);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/events/:id/participants/:userId", authRequired, adminOnly, async (req, res, next) => {
  try {
    const eventId = asInt(req.params.id);
    const userId = asInt(req.params.userId);
    if (!eventId || !userId) throw new AppError(400, "Некорректные параметры.");

    await prisma.userEvent.delete({
      where: { userId_eventId: { userId, eventId } },
    });
    res.status(204).send();
  } catch (error) {
    if (error.code === "P2025") {
      return next(new AppError(404, "Участник не найден в этом мероприятии."));
    }
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
      details: error.details,
    });
  }

  if (error?.name === "PrismaClientKnownRequestError") {
    return res.status(400).json({ message: "Ошибка обработки запроса к базе данных." });
  }

  console.error(error);
  return res.status(500).json({ message: "Внутренняя ошибка сервера." });
});

app.listen(PORT, () => {
  console.log(`Backend started on http://localhost:${PORT}`);
});
