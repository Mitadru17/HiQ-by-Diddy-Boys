import { GoogleGenerativeAI } from '@google/generative-ai';
import Message from '../models/Message.js';
import logger from '../config/logger.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

class ChatService {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    async generateResponse(message, userId, conversationId) {
        try {
            // Get conversation history
            const history = await this.getConversationHistory(conversationId);
            
            // Create chat context from history
            const chat = this.model.startChat({
                history: history.map(msg => ({
                    role: msg.role,
                    parts: msg.content
                }))
            });

            // Generate response
            const result = await chat.sendMessage(message);
            const response = await result.response;
            const responseText = response.text();

            // Save messages to database
            await Promise.all([
                this.saveMessage(message, 'user', userId, conversationId),
                this.saveMessage(responseText, 'assistant', userId, conversationId)
            ]);

            return responseText;
        } catch (error) {
            logger.error('Error generating response:', error);
            throw new Error('Failed to generate response');
        }
    }

    async getConversationHistory(conversationId) {
        try {
            return await Message.find({ conversationId })
                .sort({ timestamp: 1 })
                .limit(10) // Limit to last 10 messages for context
                .lean();
        } catch (error) {
            logger.error('Error fetching conversation history:', error);
            return [];
        }
    }

    async saveMessage(content, role, userId, conversationId) {
        try {
            const message = new Message({
                content,
                role,
                userId,
                conversationId
            });
            await message.save();
            return message;
        } catch (error) {
            logger.error('Error saving message:', error);
            throw new Error('Failed to save message');
        }
    }

    async getUserConversations(userId) {
        try {
            const conversations = await Message.aggregate([
                { $match: { userId } },
                { $group: { 
                    _id: '$conversationId',
                    lastMessage: { $last: '$content' },
                    timestamp: { $max: '$timestamp' },
                    messageCount: { $sum: 1 }
                }},
                { $sort: { timestamp: -1 }}
            ]);
            return conversations;
        } catch (error) {
            logger.error('Error fetching user conversations:', error);
            throw new Error('Failed to fetch conversations');
        }
    }
}

export default new ChatService(); 