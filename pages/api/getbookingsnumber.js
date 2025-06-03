// pages/api/getbookingsnumber.js
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const { startTime, endTime, calendarId, locationId } = req.query;

    // Validate required query parameters
    if (!startTime || !endTime || !calendarId || !locationId) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    // API request configuration
    const apiUrl = 'https://services.leadconnectorhq.com/calendars/events'; // Replace with the actual API endpoint URL
    const token = 'pit-f5b10276-54a5-4d2a-b22c-c224da3a082a'; // Use environment variable in production
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Version: '2021-04-15',
    };

    // Make the API call to fetch bookings
    const response = await axios.get(apiUrl, {
      headers,
      params: {
        startTime,
        endTime,
        calendarId,
        locationId,
      },
    });

    // Count bookings from the response
    const bookings = response.data.events || [];
    const bookingCount = bookings.length;

    // Return the booking count
    res.status(200).json({ bookingsGenerated: bookingCount });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}