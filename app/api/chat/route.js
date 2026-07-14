import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';
import RateLimit from '../../../models/RateLimit';
import { z } from 'zod';

const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API);

const chatRequestSchema = z.object({
  from: z.string().optional(),
  message: z.string().optional(),
  messages: z.any().optional(),
  ticket: z.any().optional(),
  tickets: z.any().optional(),
  matches: z.any().optional(),
  crowdDensityData: z.any().optional(),
  crowd_density_data: z.any().optional(),
  requestType: z.string().optional()
}).passthrough();

export async function POST(req) {
  try {
    const rawBody = await req.json();
    const body = chatRequestSchema.parse(rawBody);
    const { from, message, messages, ticket, tickets, matches, crowdDensityData, crowd_density_data, requestType } = body;

    // Rate Limiting Logic
    await connectToDatabase();
    
    // Get session to check if user is authenticated
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user;
    
    // Determine identifier (userId if auth, IP if not)
    let identifier;
    if (isAuthenticated) {
      identifier = session.user.id || session.user.email;
    } else {
      // Fallback to IP address for unauthenticated users
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      identifier = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown-ip');
    }

    // Determine type of request (submission or notification)
    const type = requestType === 'notification' ? 'notification' : 'submission';

    // Rate limits thresholds
    const limits = {
      authenticated: { submissions: 15, notifications: 8 },
      unauthenticated: { submissions: 10, notifications: 5 }
    };
    
    const currentLimits = isAuthenticated ? limits.authenticated : limits.unauthenticated;
    
    // Fetch or create rate limit record
    let rateLimitRecord = await RateLimit.findOne({ identifier });
    const now = new Date();
    
    if (!rateLimitRecord) {
      rateLimitRecord = new RateLimit({
        identifier,
        submissionsCount: 0,
        notificationsCount: 0,
        lastResetDate: now
      });
    } else {
      // Check if 24 hours have passed since last reset
      const timeSinceLastReset = now - rateLimitRecord.lastResetDate;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (timeSinceLastReset > twentyFourHours) {
        rateLimitRecord.submissionsCount = 0;
        rateLimitRecord.notificationsCount = 0;
        rateLimitRecord.lastResetDate = now;
      }
    }
    
    // Check limits
    if (type === 'submission') {
      if (rateLimitRecord.submissionsCount >= currentLimits.submissions) {
        const errorMsg = isAuthenticated 
          ? 'Rate limit exceeded for chat submissions. Please try again later.'
          : 'You have reached your free daily limit for AI chats. Please log in for more quotas.';
        return Response.json({ error: errorMsg }, { status: 429 });
      }
      rateLimitRecord.submissionsCount += 1;
    } else {
      if (rateLimitRecord.notificationsCount >= currentLimits.notifications) {
        const errorMsg = isAuthenticated
          ? 'Rate limit exceeded for notifications. Please try again later.'
          : 'You have reached your free daily limit for notifications. Please log in for more quotas.';
        return Response.json({ error: errorMsg }, { status: 429 });
      }
      rateLimitRecord.notificationsCount += 1;
    }
    
    await rateLimitRecord.save();

    const isOrganiser = from === 'organiser';
    const finalTicket = ticket || tickets;
    const finalCrowdData = crowdDensityData || crowd_density_data;

    let userPrompt = message;
    if (!userPrompt && messages) {
      if (typeof messages === 'string') {
        userPrompt = messages;
      } else if (Array.isArray(messages) && messages.length > 0) {
        const lastMsg = messages[messages.length - 1];
        userPrompt = typeof lastMsg === 'string' ? lastMsg : (lastMsg.text || lastMsg.content || lastMsg.message);
      }
    }

    let systemInstruction = '';

    if (isOrganiser) {
      const crowdContext = finalCrowdData ? `\nCrowd Density & Gate Status Data: ${JSON.stringify(finalCrowdData)}` : '';
      systemInstruction = 'You are a helpful Stadium Operations AI Assistant for the FIFA World Cup 2026. You assist the stadium organiser with real-time venue management, crowd flow monitoring, resolving gate congestion, handling incidents, and staff deployment. Use the provided crowd density, gate status, and incident data to give precise recommendations and insights. Keep your responses professional, concise, direct, and focused on operations.' + crowdContext;
    } else {
      const ticketContext = finalTicket ? `\nUser's Current Ticket Info: ${JSON.stringify(finalTicket)}` : '';
      const matchesContext = matches ? `\nSchedule and Match Scores: ${JSON.stringify(matches)}` : '';
      systemInstruction = 'You are a helpful Stadium Assistant for the FIFA World Cup 2026. You help fans find their seats, food, facilities and answer general questions about the event. Keep your answers brief, friendly, and helpful. You have access to the user\'s ticket info, so use it to personalize your answers and guide them accurately without asking for their seat details. Here is a list of amenities available in the stadium: Food (Burgers, Beer, Hot Dogs, Pizza, Snacks, Coffee), Facilities (Restroom North, Restroom South), Emergency (First Aid, Emergency Exit). CRITICAL: You must always respond in the same language that the user uses to ask their question (for example, if they prompt in Spanish, respond in Spanish; if they prompt in German, respond in German, etc.).' + ticketContext + matchesContext;
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    return Response.json({ reply: text });
  } catch (error) {
    console.error('API Error:', error);
    
    // Check if it's a quota/rate limit error from the Google Generative AI API itself
    if (error?.status === 429 || (error?.message && (error.message.includes('429') || error.message.includes('quota')))) {
      const errorMsg = isAuthenticated
        ? 'The AI service is currently overwhelmed. Please try again later.'
        : 'You have reached your free daily limit for AI chats. Please log in for more quotas.';
      return Response.json({ error: errorMsg, detail: error.message }, { status: 429 });
    }
    
    return Response.json({ error: 'Failed to fetch AI response', detail: error.message }, { status: 500 });
  }
}

