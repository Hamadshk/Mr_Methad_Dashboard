export default async function handler(req, res) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
  
    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'API key not configured' });
    }
  
    // Prevent caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  
    try {
      // Fetch subscription data
      const subscriptionResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
        headers: {
          'xi-api-key': apiKey,
        },
      });
  
      if (!subscriptionResponse.ok) {
        throw new Error(`HTTP error from subscription endpoint! status: ${subscriptionResponse.status}`);
      }
  
      const subscriptionData = await subscriptionResponse.json();
      console.log('Subscription response:', subscriptionData); // Debug log
  
      const usedCredits = subscriptionData.character_count || 0;
      const totalCredits = subscriptionData.character_limit || 1000000; // Fallback to hardcoded value
      const remainingCredits = totalCredits - usedCredits;
  
      // Optional: Fetch usage/character-stats for additional validation
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const startUnix = Math.floor(startDate.getTime());
      const endUnix = Math.floor(endDate.getTime());
  
      const usageResponse = await fetch(
        `https://api.elevenlabs.io/v1/usage/character-stats?start_unix=${startUnix}&end_unix=${endUnix}&aggregation_interval=month&metric=characters`,
        {
          headers: {
            'xi-api-key': apiKey,
          },
        }
      );
  
      let usageCredits = usedCredits; // Default to subscription data
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        console.log('Usage response:', usageData); // Debug log
        // Sum usage.All for the current month
        usageCredits = usageData.usage?.All?.reduce((sum, val) => sum + val, 0) || usedCredits;
      }
  
      res.status(200).json({
        success: true,
        data: {
          usedCredits: Math.round(usageCredits),
          remainingCredits: Math.round(totalCredits - usageCredits),
          totalCredits,
        },
      });
    } catch (error) {
      console.error('Error fetching ElevenLabs data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }