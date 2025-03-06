import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import chatService from './services/chatService.js';
import logger from './config/logger.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production' 
            ? 'https://your-frontend-domain.com' 
            : 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? 'https://your-frontend-domain.com' 
        : 'http://localhost:5173'
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api', limiter);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error:', err));

// REST API Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message, userId, conversationId } = req.body;

        if (!message || !userId || !conversationId) {
            return res.status(400).json({ 
                error: 'Missing required fields' 
            });
        }

        const response = await chatService.generateResponse(
            message, 
            userId, 
            conversationId
        );

        res.json({ response });
    } catch (error) {
        logger.error('Chat API error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat message' 
        });
    }
});

app.get('/api/conversations/:userId', async (req, res) => {
    try {
        const conversations = await chatService.getUserConversations(
            req.params.userId
        );
        res.json({ conversations });
    } catch (error) {
        logger.error('Get conversations error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch conversations' 
        });
    }
});

// Socket.IO Connection
io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    socket.on('join_conversation', (conversationId) => {
        socket.join(conversationId);
        logger.info(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    socket.on('chat_message', async (data) => {
        try {
            const { message, userId, conversationId } = data;
            
            // Generate and save response
            const response = await chatService.generateResponse(
                message, 
                userId, 
                conversationId
            );

            // Broadcast response to all users in the conversation
            io.to(conversationId).emit('chat_response', {
                response,
                conversationId
            });
        } catch (error) {
            logger.error('Socket chat error:', error);
            socket.emit('error', { 
                message: 'Failed to process message' 
            });
        }
    });

    socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error' 
    });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
}); 