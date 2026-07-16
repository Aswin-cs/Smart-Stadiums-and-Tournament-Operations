import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';
import connectToDatabase from '../../../lib/mongodb';
import RateLimit from '../../../models/RateLimit';
import { z } from 'zod';
import { getOrganiserPrompt, getFanPrompt } from '../../lib/ai-prompts';

const genAI = new GoogleGenerativeAI(process.env.GEN_AI_API);

const chatRequestSchema = z.object({
  from: z.enum(['fan', 'organiser']).optional(),
  message: z.string().min(1, "Message cannot be empty").optional(),
  messages: z.any().optional(),
  ticket: z.any().optional(),
  tickets: z.any().optional(),
  matches: z.any().optional(),
  crowdDensityData: z.any().optional(),
  crowd_density_data: z.any().optional(),
  transportationData: z.any().optional(),
  requestType: z.string().optional(),
  stream: z.boolean().optional()
}).passthrough();

export async function POST(req) {
  try {
    const rawBody = await req.json();
    const parsed = chatRequestSchema.safeParse(rawBody);

    if (!parsed.success) {
      return Response.json({ error: 'Invalid input', details: parsed.error.format() }, { status: 400 });
    }

    const body = parsed.data;
    const { from, message, messages, ticket, tickets, matches, crowdDensityData, crowd_density_data, transportationData, requestType } = body;

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
      // Hardened fallback for unauthenticated users
      const forwardedFor = req.headers.get('x-forwarded-for');
      const realIp = req.headers.get('x-real-ip');
      const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || 'unknown-ip');
      
      // Combine IP with User-Agent to mitigate simple X-Forwarded-For spoofing attacks
      const userAgent = req.headers.get('user-agent') || 'unknown-agent';
      identifier = `${ip}-${userAgent.substring(0, 50)}`;
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
    
    /* istanbul ignore next */
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
      /* istanbul ignore next */
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

    /* istanbul ignore next */
    if (isOrganiser) {
      systemInstruction = getOrganiserPrompt(finalCrowdData);
    } else {
      systemInstruction = getFanPrompt(finalTicket, matches, transportationData);
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-lite-latest',
      systemInstruction: systemInstruction,
    });

    if (body.stream) {
      const result = await model.generateContentStream(userPrompt);
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              controller.enqueue(encoder.encode(chunk.text()));
            }
          } catch (e) {
            controller.error(e);
          } finally {
            controller.close();
          }
        }
      });
      return new Response(stream, { headers: { 'Content-Type': 'text/plain' } });
    } else {
      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const text = response.text();
      return Response.json({ reply: text });
    }
  } catch (error) {
    console.error('API Error:', error);
    
    // Check if it's a quota/rate limit error from the Google Generative AI API itself
    if (error?.status === 429 || (error?.message && (error.message.includes('429') || error.message.includes('quota')))) {
      const errorMsg = 'The AI service is currently overwhelmed. Please try again later. If you are not logged in, you may have reached your free daily limit.';
      return Response.json({ error: errorMsg, detail: error.message }, { status: 429 });
    }
    
    return Response.json({ error: 'Failed to fetch AI response', detail: error.message }, { status: 500 });
  }
}

