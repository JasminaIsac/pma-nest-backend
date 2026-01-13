import { PrismaClient, UserRole, ConversationType, MessageStatus, ProjectStatus, TaskPriority, TaskStatus, UserStatus } from '../src/generated/prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import 'dotenv/config';

const prisma = new PrismaClient();

function encryptMessage(text: string): string {
  const encryptionKey =
    process.env.ENCRYPTION_KEY ?? '12345678901234567890123456789012';

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(encryptionKey),
    iv,
  );

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear data
  await prisma.conversationMessage.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.usersToProjects.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data\n');

  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  await prisma.user.createMany({
    data: [
      {
        email: "admin@example.com",
        name: "Admin User",
        role: UserRole.ADMIN,
        tel: "+40712345001",
        location: "Bucharest",
        password: hashedPassword,
        status: UserStatus.ACTIVE
      },
      {
        email: "manager@example.com",
        name: "Project Manager",
        role: UserRole.PROJECT_MANAGER,
        tel: "+40712345002",
        location: "Bucharest",
        password: hashedPassword,
        status: UserStatus.ACTIVE
      },
      {
        email: "dev1@example.com",
        name: "Developer One",
        role: UserRole.DEVELOPER,
        tel: "+40712345003",
        location: "Cluj",
        password: hashedPassword,
        status: UserStatus.ACTIVE
      },
      {
        email: "dev2@example.com",
        name: "Developer Two",
        role: UserRole.DEVELOPER,
        tel: "+40712345004",
        location: "Cluj",
        password: hashedPassword,
        status: UserStatus.ACTIVE
      },
      {
        email: "dev3@example.com",
        name: "Developer Three",      
        role: UserRole.DEVELOPER,
        tel: "+40712345005",
        location: "Cluj",
        password: hashedPassword,
        status: UserStatus.ACTIVE
      }
    ]
  });

  const users = await prisma.user.findMany();
  const admin = users.find(u => u.email === 'admin@example.com')!;
  const manager = users.find(u => u.email === 'manager@example.com')!;
  const dev1 = users.find(u => u.email === 'dev1@example.com')!;
  const dev2 = users.find(u => u.email === 'dev2@example.com')!;
  const dev3 = users.find(u => u.email === 'dev3@example.com')!;

  await prisma.category.createMany({
    data: [
      { title: 'Web Development' },
      { title: 'Mobile Development' },
      { title: 'Backend Services' },
    ],
  });

  const categories = await prisma.category.findMany();
  const web = categories.find(c => c.title === 'Web Development')!;
  const mobile = categories.find(c => c.title === 'Mobile Development')!;
  const backend = categories.find(c => c.title === 'Backend Services')!;

  await prisma.project.createMany({
    data: [
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack e-commerce application',
        categoryId: web.id,
        managerId: manager.id,
        status: ProjectStatus.IN_PROGRESS,
        deadline: new Date(Date.now() + 90 * 86400000),
      },
      {
        name: 'Mobile Banking App',
        description: 'Secure mobile banking app',
        categoryId: mobile.id,
        managerId: manager.id,
        status: ProjectStatus.IN_PROGRESS,
        deadline: new Date(Date.now() + 120 * 86400000),
      },
      {
        name: 'API Gateway Service',
        description: 'Microservices gateway',
        categoryId: backend.id,
        managerId: admin.id,
        status: ProjectStatus.NEW,
        deadline: new Date(Date.now() + 60 * 86400000),
      },
    ],
  });

  const projects = await prisma.project.findMany();
  const ecommerce = projects.find(p => p.name === 'E-Commerce Platform')!;
  const mobileApp = projects.find(p => p.name === 'Mobile Banking App')!;
  const api = projects.find(p => p.name === 'API Gateway Service')!;

  await prisma.usersToProjects.createMany({
    data: [
      { projectId: ecommerce.id, userId: dev1.id, userRole: UserRole.DEVELOPER },
      { projectId: ecommerce.id, userId: dev2.id, userRole: UserRole.DEVELOPER },
      { projectId: mobileApp.id, userId: dev3.id, userRole: UserRole.DEVELOPER },
      { projectId: api.id, userId: dev1.id, userRole: UserRole.DEVELOPER },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Setup project',
        projectId: ecommerce.id,
        assignedTo: dev1.id,
        priority: TaskPriority.HIGH,
        status: TaskStatus.COMPLETED,
        deadline: new Date(),
      },
      {
        title: 'Implement auth',
        projectId: mobileApp.id,
        assignedTo: dev2.id,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        deadline: new Date(Date.now() + 14 * 86400000),
      },
    ],
  });

  const conversation = await prisma.conversation.create({
    data: {
      type: ConversationType.GROUP,
      participants: {
        create: [
          { userId: dev1.id },
          { userId: dev2.id },
          { userId: manager.id },
        ],
      },
    },
  });

  await prisma.conversationMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        senderId: manager.id,
        message: encryptMessage('Team meeting tomorrow'),
        status: MessageStatus.DELIVERED,
      },
      {
        conversationId: conversation.id,
        senderId: dev1.id,
        message: encryptMessage('I will be there'),
        status: MessageStatus.READ,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });