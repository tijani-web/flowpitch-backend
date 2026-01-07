// scripts/seed.js
import { config } from 'dotenv';
import prisma from '../lib/prisma.js'; 
import bcrypt from 'bcryptjs';

// Load environment variables
config();

// Add connection test function
async function waitForDatabase() {
  console.log('⏳ Waiting for database to wake up (Render free tier)...');
  for (let i = 0; i < 30; i++) { // Try for 30 seconds
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database is awake!');
      return true;
    } catch {
      console.log(`Still waiting... (${i+1}/30)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Database never woke up');
}

const industries = [
  'SaaS', 'FinTech', 'HealthTech', 'EdTech', 'AI/ML', 'E-commerce', 
  'DevTools', 'Marketing', 'Productivity', 'Gaming', 'Real Estate Tech',
  'Food Tech', 'Travel Tech', 'Climate Tech', 'Web3', 'Cybersecurity'
];

const realisticStartups = [
  {
    title: "Notion AI",
    description: "Building the future of workspace intelligence with AI-powered features that enhance productivity and creativity for teams worldwide. Our AI understands context, automates repetitive tasks, and helps teams work smarter.",
    category: "Productivity",
    logo_url: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop&crop=center",
    progress: 78
  },
  {
    title: "Stripe Capital",
    description: "Revolutionizing small business lending with embedded financing solutions. We provide instant access to capital for e-commerce businesses through their existing payment processing platform.",
    category: "FinTech",
    logo_url: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=100&h=100&fit=crop&crop=center",
    progress: 92
  },
  {
    title: "Figma Dev Mode",
    description: "Bridging the gap between design and development with specialized tools for engineers. Dev Mode provides code snippets, measurement tools, and version comparison directly in Figma.",
    category: "DevTools",
    logo_url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=100&h=100&fit=crop&crop=center",
    progress: 65
  },
  {
    title: "Calendly Scheduling AI",
    description: "Intelligent scheduling assistant that eliminates back-and-forth emails. Our AI understands preferences, time zones, and meeting contexts to find perfect time slots automatically.",
    category: "Productivity",
    logo_url: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=100&h=100&fit=crop&crop=center",
    progress: 45
  },
  {
    title: "Plaid Data Connect",
    description: "Secure financial data infrastructure connecting apps to users' bank accounts. We're building the next generation of open banking APIs with enhanced security and real-time data sync.",
    category: "FinTech",
    logo_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop&crop=center",
    progress: 83
  },
  {
    title: "GitHub Copilot Enterprise",
    description: "AI pair programmer scaled for enterprise development teams. Context-aware code suggestions, security vulnerability detection, and team knowledge base integration.",
    category: "DevTools",
    logo_url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=100&h=100&fit=crop&crop=center",
    progress: 71
  },
  {
    title: "Zoom AI Companion",
    description: "AI-powered meeting assistant that provides real-time transcription, action item detection, and meeting summaries. Integrated directly into the Zoom platform.",
    category: "SaaS",
    logo_url: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=100&h=100&fit=crop&crop=center",
    progress: 88
  },
  {
    title: "Shopify Markets Pro",
    description: "Global commerce platform enabling businesses to sell internationally with localized payment methods, tax calculation, and cross-border shipping optimization.",
    category: "E-commerce",
    logo_url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=100&h=100&fit=crop&crop=center",
    progress: 59
  },
  {
    title: "Canva Magic Studio",
    description: "AI-powered design platform that transforms ideas into professional designs instantly. From text-to-image generation to automated brand kit applications.",
    category: "Marketing",
    logo_url: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=100&h=100&fit=crop&crop=center",
    progress: 76
  },
  {
    title: "Deel HR Platform",
    description: "Global payroll and compliance platform for distributed teams. Automated tax filings, contractor management, and localized benefits administration worldwide.",
    category: "SaaS",
    logo_url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop&crop=center",
    progress: 94
  },
  {
    title: "Linear Metrics",
    description: "Advanced analytics and reporting for engineering teams. Track velocity, cycle time, and team performance with beautiful, actionable dashboards.",
    category: "DevTools",
    logo_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop&crop=center",
    progress: 52
  },
  {
    title: "Brex Empower",
    description: "Corporate card and expense management platform with built-in spend controls, automated policy enforcement, and real-time budget tracking.",
    category: "FinTech",
    logo_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=100&h=100&fit=crop&crop=center",
    progress: 81
  },
  {
    title: "Airtable AI",
    description: "Intelligent database platform that understands natural language queries and automates complex workflows. Transform spreadsheets into powerful business applications.",
    category: "Productivity",
    logo_url: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&h=100&fit=crop&crop=center",
    progress: 67
  },
  {
    title: "Webflow E-commerce",
    description: "Visual website builder with native e-commerce capabilities. Design, build, and launch online stores without writing code, with integrated payments and inventory management.",
    category: "E-commerce",
    logo_url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=100&h=100&fit=crop&crop=center",
    progress: 89
  },
  {
    title: "Framer Motion",
    description: "Production-ready animation library for React. Create smooth, performant animations and interactions with a declarative API used by top tech companies.",
    category: "DevTools",
    logo_url: "https://images.unsplash.com/photo-1634942537034-2531766767d1?w=100&h=100&fit=crop&crop=center",
    progress: 96
  }
];

const realisticUsers = [
  {
    name: "Alex Chen",
    username: "alexchen",
    email: "alex.chen@example.com",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    bio: "Product lead passionate about building tools that make teams more productive. Previously at Google and Stripe."
  },
  {
    name: "Sarah Rodriguez",
    username: "sarahrod",
    email: "sarah.rodriguez@example.com",
    avatar_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    bio: "Engineering manager focused on developer experience and platform infrastructure. Love open source and community building."
  },
  {
    name: "Marcus Johnson",
    username: "marcusj",
    email: "marcus.johnson@example.com",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    bio: "Full-stack developer with 8+ years experience. Building the future of fintech infrastructure one API at a time."
  },
  {
    name: "Priya Patel",
    username: "priyap",
    email: "priya.patel@example.com",
    avatar_url: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face",
    bio: "Product designer passionate about creating intuitive user experiences. Previously led design at Airbnb and Pinterest."
  },
  {
    name: "James Wilson",
    username: "jamesw",
    email: "james.wilson@example.com",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
    bio: "Startup founder and angel investor. Focused on SaaS and devtools. Love mentoring early-stage founders."
  },
  {
    name: "Lisa Zhang",
    username: "lisaz",
    email: "lisa.zhang@example.com",
    avatar_url: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?w=100&h=100&fit=crop&crop=face",
    bio: "Growth marketer with expertise in product-led growth and community building. Data-driven approach to user acquisition."
  },
  {
    name: "David Kim",
    username: "davidk",
    email: "david.kim@example.com",
    avatar_url: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?w=100&h=100&fit=crop&crop=face",
    bio: "Backend engineer specializing in distributed systems and scalability. Contributor to several open source projects."
  },
  {
    name: "Emma Thompson",
    username: "emmat",
    email: "emma.thompson@example.com",
    avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    bio: "Product manager with background in computer science. Passionate about building products that solve real user problems."
  }
];

const roadmapStages = [
  { title: "Backlog", position: 1, color: "bg-gray-500" },
  { title: "Planned", position: 2, color: "bg-blue-500" },
  { title: "In Progress", position: 3, color: "bg-yellow-500" },
  { title: "Completed", position: 4, color: "bg-green-500" }
];

const featureTemplates = {
  saas: [
    {
      title: "Multi-tenant Architecture",
      description: "Implement proper tenant isolation and data separation for enterprise customers with complex security requirements.",
      tags: ["architecture", "security", "enterprise"],
      priority: "high"
    },
    {
      title: "SSO Integration",
      description: "Support SAML 2.0 and OIDC for enterprise single sign-on with role-based access control and directory sync.",
      tags: ["authentication", "enterprise", "security"],
      priority: "high"
    },
    {
      title: "Advanced Analytics Dashboard",
      description: "Build comprehensive analytics with custom reports, data export, and real-time metrics visualization.",
      tags: ["analytics", "dashboard", "metrics"],
      priority: "medium"
    },
    {
      title: "API Rate Limiting",
      description: "Implement tiered rate limiting with usage monitoring and customizable limits per customer plan.",
      tags: ["api", "infrastructure", "scaling"],
      priority: "medium"
    }
  ],
  fintech: [
    {
      title: "Real-time Payment Processing",
      description: "Support instant bank transfers with proper transaction monitoring and fraud detection systems.",
      tags: ["payments", "real-time", "fraud"],
      priority: "high"
    },
    {
      title: "Regulatory Compliance Dashboard",
      description: "Automated compliance reporting for financial regulations with audit trails and documentation.",
      tags: ["compliance", "regulatory", "security"],
      priority: "high"
    },
    {
      title: "Multi-currency Support",
      description: "Handle 50+ currencies with real-time exchange rates and cross-border transaction fees.",
      tags: ["payments", "international", "forex"],
      priority: "medium"
    },
    {
      title: "Investment Portfolio Analytics",
      description: "Advanced portfolio performance tracking with risk analysis and investment recommendations.",
      tags: ["analytics", "investing", "wealth"],
      priority: "medium"
    }
  ],
  devtools: [
    {
      title: "VS Code Extension",
      description: "Native IDE integration with syntax highlighting, auto-completion, and inline documentation.",
      tags: ["ide", "developer-experience", "extensions"],
      priority: "high"
    },
    {
      title: "CLI Tool Redesign",
      description: "Modern command-line interface with better error messages, progress indicators, and plugin system.",
      tags: ["cli", "developer-tools", "ux"],
      priority: "high"
    },
    {
      title: "Performance Monitoring",
      description: "Real-time performance metrics with alerting, historical data, and bottleneck identification.",
      tags: ["performance", "monitoring", "observability"],
      priority: "medium"
    },
    {
      title: "GitHub Actions Integration",
      description: "Seamless CI/CD integration with automated testing, deployment, and status reporting.",
      tags: ["ci-cd", "github", "automation"],
      priority: "medium"
    }
  ]
};

const realisticComments = [
  "This would be a game-changer for our workflow! Currently, we're spending hours manually doing what this feature would automate.",
  "Love the direction here. Would be great to see integration with Slack/Teams for notifications.",
  "As an enterprise customer, we'd need SSO support before we could adopt this. Any timeline on that?",
  "The UI mockups look clean! One suggestion - consider adding keyboard shortcuts for power users.",
  "This addresses a major pain point we've been facing. The automated reporting would save us 10+ hours per week.",
  "Would love to see more customization options for the dashboard. Different team roles need different data views.",
  "The performance improvements in the latest release are noticeable! Great work team.",
  "Security is a big concern for us. Would like to see more details about data encryption and access controls.",
  "This feature would be perfect if it integrated with our existing CRM system. Any plans for API endpoints?",
  "The mobile experience needs some love - currently hard to use on smaller screens.",
  "We've been waiting for this feature! It would solve so many of our current workflow issues.",
  "Consider adding bulk actions for managing multiple items at once. Would save a ton of time.",
  "The documentation could use more examples and tutorials for common use cases.",
  "Love the simplicity of the interface! Much cleaner than competing solutions.",
  "Would be helpful to have more granular permission controls for team management."
];

async function main() {
  console.log('🌱 Starting production-grade seed...');
   await waitForDatabase();

  // Clear existing data
  // console.log('🗑️ Clearing existing data...');
  // await prisma.votes.deleteMany();
  // await prisma.comments.deleteMany();
  // await prisma.features.deleteMany();
  // await prisma.roadmapStages.deleteMany();
  // await prisma.followers.deleteMany();
  // await prisma.projectMembers.deleteMany();
  // await prisma.projectInvites.deleteMany();
  // await prisma.activityLogs.deleteMany();
  // await prisma.notifications.deleteMany();
  // await prisma.projects.deleteMany();
  // await prisma.users.deleteMany();

  // Create users
  console.log('👥 Creating realistic users...');
  const users = [];
  for (const userData of realisticUsers) {
    const hashedPassword = await bcrypt.hash('password123', 12);
    const user = await prisma.users.create({
      data: {
        ...userData,
        password_hash: hashedPassword,
      }
    });
    users.push(user);
  }

  // Create projects with proper stages and features
  console.log('🚀 Creating startups with realistic roadmaps...');
  
  for (const startup of realisticStartups) {
    const owner = users[Math.floor(Math.random() * users.length)];
    
    // Create project
    const project = await prisma.projects.create({
      data: {
        title: startup.title,
        description: startup.description,
        category: startup.category,
        logo_url: startup.logo_url,
        progress: startup.progress,
        visibility: 'public',
        slug: startup.title.toLowerCase().replace(/ /g, '-'),
        owner_id: owner.id,
      }
    });

    // Create roadmap stages
    const stages = [];
    for (const stageData of roadmapStages) {
      const stage = await prisma.roadmapStages.create({
        data: {
          ...stageData,
          project_id: project.id,
        }
      });
      stages.push(stage);
    }

    // Determine feature template based on category
    let templateKey = 'saas';
    if (startup.category === 'FinTech') templateKey = 'fintech';
    if (startup.category === 'DevTools') templateKey = 'devtools';
    
    const templateFeatures = featureTemplates[templateKey];
    
    // Create features distributed across stages
    for (let i = 0; i < templateFeatures.length; i++) {
      const featureData = templateFeatures[i];
      const stageIndex = i % stages.length;
      const author = users[Math.floor(Math.random() * users.length)];
      
      // Calculate realistic progress based on stage
      let progress = 0;
      let status = 'open';
      if (stageIndex === 0) { // Backlog
        progress = 0;
        status = 'open';
      } else if (stageIndex === 1) { // Planned
        progress = 10;
        status = 'under_review';
      } else if (stageIndex === 2) { // In Progress
        progress = Math.floor(Math.random() * 60) + 20;
        status = 'in_progress';
      } else { // Completed
        progress = 100;
        status = 'completed';
      }

      const feature = await prisma.features.create({
        data: {
          ...featureData,
          project_id: project.id,
          stage_id: stages[stageIndex].id,
          author_id: author.id,
          progress: progress,
          status: status,
          vote_count: Math.floor(Math.random() * 200) + 20,
        }
      });

      // Add votes - FIXED: No duplicate users per feature
      const voterCount = Math.floor(Math.random() * 8) + 3;
      const usedVoters = new Set();
      
      for (let j = 0; j < voterCount && usedVoters.size < users.length; j++) {
        let voter;
        let attempts = 0;
        
        do {
          voter = users[Math.floor(Math.random() * users.length)];
          attempts++;
          if (attempts > 50) break;
        } while (usedVoters.has(voter.id));
        
        if (voter && !usedVoters.has(voter.id)) {
          usedVoters.add(voter.id);
          await prisma.votes.create({
            data: {
              value: Math.random() > 0.2 ? 1 : -1,
              user_id: voter.id,
              feature_id: feature.id,
            }
          });
        }
      }

      // Add comments
      const commentCount = Math.floor(Math.random() * 6) + 2;
      for (let k = 0; k < commentCount; k++) {
        const commenter = users[Math.floor(Math.random() * users.length)];
        const commentText = realisticComments[Math.floor(Math.random() * realisticComments.length)];
        
        await prisma.comments.create({
          data: {
            content: commentText,
            author_id: commenter.id,
            feature_id: feature.id,
          }
        });
      }
    }

    // Add team members - FIXED: No duplicate members
    const memberCount = Math.floor(Math.random() * 4) + 2;
    const availableMembers = users.filter(u => u.id !== owner.id);
    const usedMembers = new Set();
    
    for (let i = 0; i < Math.min(memberCount, availableMembers.length); i++) {
      let member;
      let attempts = 0;
      
      do {
        member = availableMembers[Math.floor(Math.random() * availableMembers.length)];
        attempts++;
        if (attempts > 50) break;
      } while (usedMembers.has(member.id));
      
      if (member && !usedMembers.has(member.id)) {
        usedMembers.add(member.id);
        const roles = ['admin', 'editor', 'viewer'];
        await prisma.projectMembers.create({
          data: {
            role: roles[Math.floor(Math.random() * roles.length)],
            user_id: member.id,
            project_id: project.id,
          }
        });
      }
    }

    // Add followers - FIXED: No duplicate followers
    const followerCount = Math.floor(Math.random() * 15) + 5;
    const usedFollowers = new Set();
    
    for (let i = 0; i < Math.min(followerCount, users.length); i++) {
      let follower;
      let attempts = 0;
      
      do {
        follower = users[Math.floor(Math.random() * users.length)];
        attempts++;
        if (attempts > 50) break;
      } while (usedFollowers.has(follower.id));
      
      if (follower && !usedFollowers.has(follower.id)) {
        usedFollowers.add(follower.id);
        await prisma.followers.create({
          data: {
            user_id: follower.id,
            project_id: project.id,
          }
        });
      }
    }

    console.log(`✅ Created ${startup.title} with ${templateFeatures.length} features`);
  }

  console.log('🎉 Production seed completed!');
  console.log(`📊 Created:`);
  console.log(`   👥 ${users.length} users`);
  console.log(`   🚀 ${realisticStartups.length} startups`);
  console.log(`   💬 Realistic comments and votes`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });