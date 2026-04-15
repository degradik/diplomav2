const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const institutionsData = [{ name: "МГТУ им. Н. Э. Баумана" }, { name: "МГУ им. М. В. Ломоносова" }];
  for (const institution of institutionsData) {
    await prisma.institution.upsert({
      where: { name: institution.name },
      update: {},
      create: institution,
    });
  }

  const [bmstu, msu] = await prisma.institution.findMany({ orderBy: { id: "asc" } });

  const adminHash = await bcrypt.hash("admin", 10);
  await prisma.user.upsert({
    where: { email: "admin@mail.com" },
    update: {
      name: "Администратор",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "+7 900 000-00-01",
      institutionId: bmstu?.id ?? null,
    },
    create: {
      name: "Администратор",
      email: "admin@mail.com",
      passwordHash: adminHash,
      role: "ADMIN",
      phone: "+7 900 000-00-01",
      institutionId: bmstu?.id ?? null,
    },
  });

  const usersData = [
    {
      name: "Иван Петров",
      email: "ivan.petrov@example.com",
      password: "user12345",
      phone: "+7 900 111-22-33",
      institutionId: bmstu.id,
    },
    {
      name: "Анна Сидорова",
      email: "anna.sidorova@example.com",
      password: "user12345",
      phone: "+7 900 444-55-66",
      institutionId: msu.id,
    },
  ];

  for (const user of usersData) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        phone: user.phone,
        role: "USER",
        institutionId: user.institutionId,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        phone: user.phone,
        role: "USER",
        institutionId: user.institutionId,
      },
    });
  }

  const eventData = [
    {
      title: "Хакатон по веб-разработке",
      startAt: new Date("2026-05-12T10:00:00.000Z"),
      endAt: new Date("2026-05-12T18:00:00.000Z"),
      institutionId: bmstu.id,
      isPublic: false,
      status: "PUBLISHED",
      content: "<p>Внутренний хакатон для студентов МГТУ: команды, задачи и защита решений.</p>",
    },
    {
      title: "Открытая IT-конференция",
      startAt: new Date("2026-06-01T08:00:00.000Z"),
      endAt: new Date("2026-06-01T17:00:00.000Z"),
      institutionId: null,
      isPublic: true,
      status: "PUBLISHED",
      content: "<p>Публичное мероприятие: доклады, воркшопы и нетворкинг.</p>",
    },
    {
      title: "Архивный семинар",
      startAt: new Date("2025-03-10T08:00:00.000Z"),
      endAt: new Date("2025-03-10T12:00:00.000Z"),
      institutionId: msu.id,
      isPublic: true,
      status: "ARCHIVED",
      content: "<p>Завершенное архивное мероприятие.</p>",
    },
  ];

  for (const event of eventData) {
    const existing = await prisma.event.findFirst({
      where: {
        title: event.title,
      },
    });

    if (!existing) {
      await prisma.event.create({ data: event });
    } else {
      await prisma.event.update({
        where: { id: existing.id },
        data: event,
      });
    }
  }

  const ivan = await prisma.user.findUnique({
    where: { email: "ivan.petrov@example.com" },
  });
  const openConference = await prisma.event.findFirst({
    where: { title: "Открытая IT-конференция" },
  });

  if (ivan && openConference) {
    await prisma.userEvent.upsert({
      where: { userId_eventId: { userId: ivan.id, eventId: openConference.id } },
      update: {},
      create: { userId: ivan.id, eventId: openConference.id },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
