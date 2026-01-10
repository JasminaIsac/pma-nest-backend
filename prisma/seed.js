const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (in reverse order of dependencies)
  await prisma.conversationMessage.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.usersToProjects.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data\n');

  // Create users
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  const users = await prisma.user.createMany({
    data: [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        tel: '+40712345001',
        location: 'Bucharest',
        password: hashedPassword,
        status: 'active',
      },
      {
        email: 'manager@example.com',
        name: 'Project Manager',
        role: 'project_manager',
        tel: '+40712345002',
        location: 'Bucharest',
        password: hashedPassword,
        status: 'active',
      },
      {
        email: 'dev1@example.com',
        name: 'Developer One',
        role: 'developer',
        tel: '+40712345003',
        location: 'Cluj',
        password: hashedPassword,
        status: 'active',
      },
      {
        email: 'dev2@example.com',
        name: 'Developer Two',
        role: 'developer',
        tel: '+40712345004',
        location: 'Iasi',
        password: hashedPassword,
        status: 'active',
      },
      {
        email: 'dev3@example.com',
        name: 'Developer Three',
        role: 'developer',
        tel: '+40712345005',
        location: 'Timisoara',
        password: hashedPassword,
        status: 'active',
      },
    ],
  });

  console.log(`✓ Created ${users.count} users`);
  console.log('  - admin@example.com (Admin)');
  console.log('  - manager@example.com (Project Manager)');
  console.log('  - dev1@example.com (Developer)');
  console.log('  - dev2@example.com (Developer)');
  console.log('  - dev3@example.com (Developer)\n');

  // Get created users
  const allUsers = await prisma.user.findMany();
  const adminUser = allUsers.find((u) => u.email === 'admin@example.com');
  const managerUser = allUsers.find((u) => u.email === 'manager@example.com');
  const dev1 = allUsers.find((u) => u.email === 'dev1@example.com');
  const dev2 = allUsers.find((u) => u.email === 'dev2@example.com');
  const dev3 = allUsers.find((u) => u.email === 'dev3@example.com');

  // Create categories
  const categories = await prisma.category.createMany({
    data: [
      { title: 'Web Development' },
      { title: 'Mobile Development' },
      { title: 'Backend Services' },
      { title: 'DevOps & Infrastructure' },
      { title: 'Quality Assurance' },
    ],
  });

  console.log(`✓ Created ${categories.count} categories\n`);

  // Get created categories
  const allCategories = await prisma.category.findMany();
  const webCat = allCategories.find((c) => c.title === 'Web Development');
  const mobileCat = allCategories.find((c) => c.title === 'Mobile Development');
  const backendCat = allCategories.find((c) => c.title === 'Backend Services');

  // Create projects
  const projects = await prisma.project.createMany({
    data: [
      {
        name: 'E-Commerce Platform',
        description: 'Full-stack e-commerce application with payment integration',
        category_id: webCat.id,
        manager_id: managerUser.id,
        status: 'in_progress',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      },
      {
        name: 'Mobile Banking App',
        description: 'Secure banking application for iOS and Android',
        category_id: mobileCat.id,
        manager_id: managerUser.id,
        status: 'in_progress',
        deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
      },
      {
        name: 'API Gateway Service',
        description: 'Microservices API gateway with authentication and rate limiting',
        category_id: backendCat.id,
        manager_id: adminUser.id,
        status: 'new',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      },
      {
        name: 'Real-time Chat System',
        description: 'WebSocket-based chat application with encryption',
        category_id: webCat.id,
        manager_id: managerUser.id,
        status: 'completed',
        deadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
    ],
  });

  console.log(`✓ Created ${projects.count} projects\n`);

  // Get created projects
  const allProjects = await prisma.project.findMany();
  const ecommerce = allProjects.find((p) => p.name === 'E-Commerce Platform');
  const mobileApp = allProjects.find((p) => p.name === 'Mobile Banking App');
  const apiGateway = allProjects.find((p) => p.name === 'API Gateway Service');
  const chatSystem = allProjects.find((p) => p.name === 'Real-time Chat System');

  // Create users to projects associations
  const usersToProjects = await prisma.usersToProjects.createMany({
    data: [
      {
        project_id: ecommerce.id,
        user_id: dev1.id,
        user_role: 'developer',
      },
      {
        project_id: ecommerce.id,
        user_id: dev2.id,
        user_role: 'developer',
      },
      {
        project_id: mobileApp.id,
        user_id: dev2.id,
        user_role: 'project_manager',
      },
      {
        project_id: mobileApp.id,
        user_id: dev3.id,
        user_role: 'developer',
      },
      {
        project_id: apiGateway.id,
        user_id: dev1.id,
        user_role: 'developer',
      },
      {
        project_id: chatSystem.id,
        user_id: dev3.id,
        user_role: 'developer',
      },
    ],
  });

  console.log(`✓ Created ${usersToProjects.count} project team assignments\n`);

  // Create tasks
  const tasks = await prisma.task.createMany({
    data: [
      {
        title: 'Setup project structure',
        description: 'Create folder structure and initialize git repository',
        project_id: ecommerce.id,
        assigned_to: dev1.id,
        priority: 'high',
        status: 'completed',
        deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Implement product catalog',
        description: 'Create database schema and API endpoints for products',
        project_id: ecommerce.id,
        assigned_to: dev2.id,
        priority: 'high',
        status: 'in_progress',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Payment gateway integration',
        description: 'Integrate Stripe for payment processing',
        project_id: ecommerce.id,
        assigned_to: dev1.id,
        priority: 'high',
        status: 'new',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Design mobile UI',
        description: 'Create wireframes and design system for mobile app',
        project_id: mobileApp.id,
        assigned_to: dev3.id,
        priority: 'medium',
        status: 'in_progress',
        deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Implement authentication',
        description: 'Setup JWT-based authentication with biometric support',
        project_id: mobileApp.id,
        assigned_to: dev2.id,
        priority: 'high',
        status: 'new',
        deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Setup Docker containers',
        description: 'Create Dockerfile and docker-compose configuration',
        project_id: apiGateway.id,
        assigned_to: dev1.id,
        priority: 'medium',
        status: 'new',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      },
      {
        title: 'Code review and testing',
        description: 'Review chat system implementation and run QA tests',
        project_id: chatSystem.id,
        assigned_to: dev3.id,
        priority: 'low',
        status: 'to_check',
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log(`✓ Created ${tasks.count} tasks\n`);

  // Create conversations and messages
  const conversation1 = await prisma.conversation.create({
    data: {
      type: 'private',
      participants: {
        create: [
          { userId: dev1.id },
          { userId: managerUser.id },
        ],
      },
    },
  });

  const conversation2 = await prisma.conversation.create({
    data: {
      type: 'group',
      participants: {
        create: [
          { userId: dev1.id },
          { userId: dev2.id },
          { userId: dev3.id },
          { userId: managerUser.id },
        ],
      },
    },
  });

  console.log(`✓ Created 2 conversations\n`);

  // Helper function to encrypt message
  function encryptMessage(text) {
    const encryptionKey = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Create messages
  const messages = await prisma.conversationMessage.createMany({
    data: [
      {
        conversationId: conversation1.id,
        senderId: dev1.id,
        message: encryptMessage('Hi manager, could you review the latest code changes?'),
        status: 'delivered',
      },
      {
        conversationId: conversation1.id,
        senderId: managerUser.id,
        message: encryptMessage('Sure, I will check them tomorrow morning.'),
        status: 'delivered',
      },
      {
        conversationId: conversation2.id,
        senderId: managerUser.id,
        message: encryptMessage('Team meeting tomorrow at 10 AM. Please prepare status updates.'),
        status: 'delivered',
      },
      {
        conversationId: conversation2.id,
        senderId: dev1.id,
        message: encryptMessage('I will have my tasks summary ready.'),
        status: 'read',
      },
      {
        conversationId: conversation2.id,
        senderId: dev2.id,
        message: encryptMessage('Same here, looking forward to it!'),
        status: 'delivered',
      },
    ],
  });

  console.log(`✓ Created ${messages.count} encrypted messages\n`);

  console.log('✅ Database seeded successfully!\n');
  console.log('📊 Summary:');
  console.log(`  - Users: ${allUsers.length}`);
  console.log(`  - Categories: ${allCategories.length}`);
  console.log(`  - Projects: ${allProjects.length}`);
  console.log(`  - Tasks: ${tasks.count}`);
  console.log(`  - Conversations: 2`);
  console.log(`  - Messages: ${messages.count}`);
  console.log('\n🔐 Default password for all users: Test123!@#\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
