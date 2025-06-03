// import { NextApiRequest, NextApiResponse } from 'next';

// export default async function handler(req, res) {
//   if (req.method !== 'GET') {
//     return res.status(405).json({ error: 'Method not allowed' });
//   }

//   try {
//     let allConversations = [];
//     let nextCursor = null;
//     const pageSize = 100; // Max page size for efficiency
//     const apiKey = process.env.ELEVENLABS_API_KEY;

//     if (!apiKey) {
//       throw new Error('ELEVENLABS_API_KEY is not set');
//     }

//     // Fetch all conversations, handling pagination
//     do {
//       const url = nextCursor
//         ? `https://api.elevenlabs.io/v1/convai/conversations?page_size=${pageSize}&cursor=${encodeURIComponent(nextCursor)}`
//         : `https://api.elevenlabs.io/v1/convai/conversations?page_size=${pageSize}`;
      
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//           'xi-api-key': apiKey,
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`ElevenLabs API responded with status ${response.status}`);
//       }

//       const data = await response.json();
//       allConversations = allConversations.concat(data.conversations);
//       nextCursor = data.has_more ? data.next_cursor : null;
//     } while (nextCursor);

//     const totalCalls = allConversations.length;
//     return res.status(200).json({ totalCalls });
//   } catch (error) {
//     console.error('Error fetching ElevenLabs conversations:', error);
//     return res.status(500).json({ error: 'Failed to fetch total calls' });
//   }
// }

import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let allConversations = [];
    let nextCursor = null;
    const pageSize = 100; // Max page size for efficiency
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not set');
    }

    // Fetch all conversations, handling pagination
    do {
      const url = nextCursor
        ? `https://api.elevenlabs.io/v1/convai/conversations?page_size=${pageSize}&cursor=${encodeURIComponent(nextCursor)}`
        : `https://api.elevenlabs.io/v1/convai/conversations?page_size=${pageSize}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API responded with status ${response.status}`);
      }

      const data = await response.json();
      allConversations = allConversations.concat(data.conversations);
      nextCursor = data.has_more ? data.next_cursor : null;
    } while (nextCursor);

    // Calculate total calls
    const totalCalls = allConversations.length;

    // Calculate successful calls based on different criteria
    const successfulCalls = allConversations.filter(conversation => {
      // Check multiple indicators of success:
      
      // 1. Check if conversation was completed successfully
      if (conversation.status === 'completed' || conversation.status === 'successful') {
        return true;
      }

      // 2. Check if conversation has a reasonable duration (adjust threshold as needed)
      // A very short call might indicate failure/hangup
      const minDurationSeconds = 10; // Minimum 10 seconds for successful call
      if (conversation.duration_seconds && conversation.duration_seconds >= minDurationSeconds) {
        return true;
      }

      // 3. Check if conversation reached conclusion/goal
      // This depends on your conversation flow - adjust based on your use case
      if (conversation.conversation_summary && 
          (conversation.conversation_summary.includes('booking') || 
           conversation.conversation_summary.includes('appointment') ||
           conversation.conversation_summary.includes('scheduled') ||
           conversation.conversation_summary.includes('confirmed'))) {
        return true;
      }

      // 4. Check if conversation wasn't terminated early
      if (conversation.end_reason !== 'user_hangup' && 
          conversation.end_reason !== 'error' && 
          conversation.end_reason !== 'timeout') {
        return true;
      }

      // 5. Check if conversation has transcript indicating engagement
      if (conversation.transcript && conversation.transcript.length > 100) {
        return true;
      }

      return false;
    }).length;

    // Calculate unsuccessful calls
    const unsuccessfulCalls = totalCalls - successfulCalls;

    // Calculate success rate for reference
    const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0;

    // Additional metrics that might be useful
    const callsByStatus = {};
    const callsByEndReason = {};
    let totalDuration = 0;
    let averageDuration = 0;

    allConversations.forEach(conversation => {
      // Group by status
      const status = conversation.status || 'unknown';
      callsByStatus[status] = (callsByStatus[status] || 0) + 1;

      // Group by end reason
      const endReason = conversation.end_reason || 'unknown';
      callsByEndReason[endReason] = (callsByEndReason[endReason] || 0) + 1;

      // Calculate total duration
      if (conversation.duration_seconds) {
        totalDuration += conversation.duration_seconds;
      }
    });

    // Calculate average duration
    if (totalCalls > 0) {
      averageDuration = (totalDuration / totalCalls).toFixed(1);
    }

    // Return comprehensive call data
    return res.status(200).json({
      totalCalls,
      successfulCalls,
      unsuccessfulCalls,
      successRate: parseFloat(successRate),
      averageDurationSeconds: parseFloat(averageDuration),
      averageDurationMinutes: (parseFloat(averageDuration) / 60).toFixed(1),
      callsByStatus,
      callsByEndReason,
      totalDurationSeconds: totalDuration,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching ElevenLabs conversations:', error);
    
    // Return more detailed error information for debugging
    return res.status(500).json({ 
      error: 'Failed to fetch call data',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}