// pages/api/getfeedback.js
import { OpenAI } from "openai";

export default async function handler(req, res) {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      const { month, year, formId } = req.query;
      
      // Default to current month/year if not provided
      const currentDate = new Date();
      const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
      const targetYear = year ? parseInt(year) : currentDate.getFullYear();
      
      // Calculate start and end dates for the month
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);
      
      // Format dates for GHL API (YYYY-MM-DD format)
      const startAt = startDate.toISOString().split('T')[0];
      const endAt = endDate.toISOString().split('T')[0];
  
      // GHL API configuration
      const GHL_API_BASE = 'https://services.leadconnectorhq.com';
      const TOKEN = 'pit-de8ac8fe-6c33-47e8-b6ba-82154297a73e';
      const LOCATION_ID = 'dz7LWqi6yEtXtdE11bBL';
      
      // Build API URL with query parameters
      const apiUrl = new URL(`${GHL_API_BASE}/forms/submissions`);
      apiUrl.searchParams.set('locationId', LOCATION_ID);
      apiUrl.searchParams.set('startAt', startAt);
      apiUrl.searchParams.set('endAt', endAt);
      apiUrl.searchParams.set('limit', '100'); // Adjust as needed
      apiUrl.searchParams.set('page', '1');
      
      // Add formId filter if provided
      if (formId) {
        apiUrl.searchParams.set('formId', formId);
      }
  
      // Make request to GHL API
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Version': '2021-07-28',
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`GHL API error: ${response.status} ${response.statusText}`);
      }
  
      const data = await response.json();
      
      // Process and filter feedback submissions
      let openai = null;
      let useAI = false;
      
      // Check if OpenAI API key is available
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        try {
          openai = new OpenAI({
            apiKey: apiKey,
          });
          useAI = true;
        } catch (error) {
          console.warn("Failed to initialize OpenAI client:", error.message);
          useAI = false;
        }
      } else {
        console.warn("OpenAI API key not found in environment variables. Using fallback sentiment analysis.");
      }
      
      // Process all submissions and filter for feedback
      const feedbackPromises = data.submissions
        .filter(submission => {
          // Filter submissions that have feedback (field with feedback content)
          const others = submission.others || {};
          
          // Look for feedback fields - adjust these field IDs based on your form structure
          const feedbackFields = [
            '2b6BqRzCzzQ4fl2mHc6I', // Your current feedback field ID
            'feedback',
            'review',
            'comment',
            'experience'
          ];
          
          return feedbackFields.some(fieldId => 
            others[fieldId] && 
            typeof others[fieldId] === 'string' && 
            others[fieldId].trim().length > 0
          );
        })
        .map(async submission => {
          const others = submission.others || {};
          
          // Extract feedback text from known field IDs
          const feedbackFields = [
            '2b6BqRzCzzQ4fl2mHc6I',
            'feedback',
            'review',
            'comment',
            'experience'
          ];
          
          let feedbackText = '';
          for (const fieldId of feedbackFields) {
            if (others[fieldId] && typeof others[fieldId] === 'string') {
              feedbackText = others[fieldId].trim();
              if (feedbackText) break;
            }
          }
          
          // Extract customer name
          const customerName = submission.name || 
                             `${others.first_name || ''} ${others.last_name || ''}`.trim() ||
                             'Anonymous Customer';
          
          // Extract email for additional context
          const email = submission.email || others.email || '';
          
          // Calculate rating based on availability of OpenAI
          let rating;
          if (useAI && openai) {
            try {
              rating = await calculateSentimentRatingWithAI(feedbackText, openai);
            } catch (error) {
              console.warn("AI rating failed, using fallback:", error.message);
              rating = calculateSentimentRatingFallback(feedbackText);
            }
          } else {
            rating = calculateSentimentRatingFallback(feedbackText);
          }
          
          return {
            id: submission.id,
            customerName,
            email,
            feedback: feedbackText,
            rating,
            timestamp: submission.createdAt,
            submissionDate: new Date(submission.createdAt).toLocaleDateString(),
            formId: submission.formId,
            // Additional metadata
            source: others.source || 'Direct',
            calendarName: others.calendar_name || '',
            selectedSlot: others.selected_slot || ''
          };
        });
      
      // Wait for all ratings to be processed
      const feedbackData = await Promise.all(feedbackPromises);
      
      // Sort by newest first
      feedbackData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
      // Calculate summary statistics
      const totalFeedbacks = feedbackData.length;
      const averageRating = totalFeedbacks > 0 
        ? (feedbackData.reduce((sum, item) => sum + item.rating, 0) / totalFeedbacks).toFixed(1)
        : 0;
      
      const ratingDistribution = {
        5: feedbackData.filter(f => f.rating === 5).length,
        4: feedbackData.filter(f => f.rating === 4).length,
        3: feedbackData.filter(f => f.rating === 3).length,
        2: feedbackData.filter(f => f.rating === 2).length,
        1: feedbackData.filter(f => f.rating === 1).length
      };
  
      res.status(200).json({
        success: true,
        data: {
          feedbacks: feedbackData,
          summary: {
            totalFeedbacks,
            averageRating: parseFloat(averageRating),
            ratingDistribution,
            month: targetMonth,
            year: targetYear,
            dateRange: {
              start: startAt,
              end: endAt
            }
          }
        }      });
  
    } catch (error) {
      console.error('Error fetching feedback:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feedback data',
        message: error.message
      });
    }
}

// AI-powered sentiment analysis for rating calculation
async function calculateSentimentRatingWithAI(text, openai) {
  if (!text || typeof text !== 'string' || !text.trim()) return 3;
  
  try {
    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system", 
          content: "You are a sentiment analysis tool that evaluates customer feedback for a business. Rate the sentiment on a scale of 1 to 5 where 1 is extremely negative, 3 is neutral, and 5 is extremely positive. Only respond with the number rating."
        },
        {
          role: "user",
          content: text
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.1,
      max_tokens: 5,
    });

    // Get the rating from the AI response
    const aiRating = response.choices[0].message.content.trim();
    
    // Convert to number and ensure it's within range 1-5
    const numRating = parseInt(aiRating);
    
    if (isNaN(numRating)) {
      console.warn("AI returned non-numeric rating, defaulting to 3:", aiRating);
      return 3;
    }
    
    return Math.max(1, Math.min(5, numRating)); // Ensure rating is between 1-5
    
  } catch (error) {
    console.error("Error in AI sentiment analysis:", error);
    // Fallback to simple keyword analysis
    return calculateSentimentRatingFallback(text);
  }
}

// Fallback sentiment analysis using keywords (when OpenAI is not available)
function calculateSentimentRatingFallback(text) {
  if (!text || typeof text !== 'string') return 3;
  
  const lowerText = text.toLowerCase();
  
  // Positive indicators
  const positiveWords = [
    'excellent', 'outstanding', 'fantastic', 'amazing', 'wonderful', 'great',
    'perfect', 'brilliant', 'awesome', 'incredible', 'superb', 'exceptional',
    'love', 'impressed', 'satisfied', 'happy', 'pleased', 'delighted',
    'professional', 'helpful', 'efficient', 'quick', 'fast', 'easy',
    'smooth', 'seamless', 'natural', 'human-like', 'intelligent'
  ];
  
  // Negative indicators
  const negativeWords = [
    'terrible', 'awful', 'horrible', 'bad', 'poor', 'disappointing',
    'frustrating', 'annoying', 'slow', 'difficult', 'confusing',
    'unhelpful', 'rude', 'unprofessional', 'failed', 'broken',
    'buggy', 'glitchy', 'useless', 'waste', 'hate'
  ];
  
  // Neutral/mixed indicators
  const neutralWords = [
    'okay', 'fine', 'decent', 'average', 'mixed', 'some issues',
    'mostly good', 'generally', 'overall'
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  // Count positive words
  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveScore++;
  });
  
  // Count negative words
  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeScore++;
  });
  
  // Count neutral words
  neutralWords.forEach(word => {
    if (lowerText.includes(word)) neutralScore++;
  });
  
  // Calculate rating based on sentiment
  if (positiveScore > negativeScore + 1) {
    return positiveScore >= 3 ? 5 : 4;
  } else if (negativeScore > positiveScore + 1) {
    return negativeScore >= 3 ? 1 : 2;
  } else {
    return 3; // Neutral or mixed sentiment
  }
}