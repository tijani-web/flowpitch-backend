import express from 'express'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url';
import path from 'path'

// middleware imports.
import logger from './middleware/logger.js'
import notFound from './middleware/notFound.js'
import errorHandler from './middleware/error.js'

// github/google passport oauth import.
import passport from './passportSetup.js'
import cors from 'cors'

// routes imports.
import userRoutes from './routes/userRoutes.js'
import projectRoutes from './routes/projectRoutes.js'
import authRoutes from './routes/authRoutes.js'
import oauthRoutes from './routes/oauthRoutes.js'
import featureRoutes from './routes/featureRoutes.js'
import voteRoutes from './routes/voteRoutes.js'
import commentRoutes from './routes/commentRoutes.js'
import projectMemberRoutes from './routes/projectMemberRoutes.js'
import discussionRoutes from './routes/discussionRoutes.js'
import discussionRepliesRoutes from './routes/discussionRepliesRoutes.js'
import activityRoutes from './routes/activityRoutes.js'
import followerRoutes from './routes/followerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import stageRoutes from './routes/stageRoutes.js';


dotenv.config()

const app = express()
const PORT = process.env.PORT

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cors({
  origin: ['http://localhost:3000', 'https://flowpitch.vercel.app'],
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(logger)
app.use(passport.initialize());



// Routes
// Routes - REORDER to avoid conflicts
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', userRoutes); 

app.use('/api', voteRoutes);          // ← FIRST
app.use('/api', commentRoutes);    // ← SECOND
app.use('/api', featureRoutes);    // ← THIRD
app.use('/api/projects', projectMemberRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/discussions', discussionRepliesRoutes);
app.use('/api', discussionRoutes)
app.use('/api', activityRoutes);
app.use('/api', followerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', searchRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', stageRoutes);


// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is listening on port http://localhost:${PORT}`)
})