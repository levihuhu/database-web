import axios from 'axios';

const API_URL = 'http://localhost:8000/api/ai/chat/';

export const sendMessageToGPT = async (messages) => {
  try {
    const response = await axios.post(API_URL, {
      messages: messages
    });
    
    return response.data;
  } catch (error) {
    console.error('Error communicating with GPT API:', error);
    throw error;
  }
};

export const evaluateSQLQuery = async (studentQuery, correctQuery, databaseSchema) => {
  try {
    const messages = [
      { 
        role: 'system', 
        content: `You are a SQL teacher evaluating student answers. 
                 The correct SQL query is: ${correctQuery}
                 Database schema: ${JSON.stringify(databaseSchema)}
                 Evaluate if the student's answer is correct. Consider variations that would produce the same result.
                 Provide feedback in JSON format with properties: "correct" (boolean), "feedback" (string), "explanation" (string).`
      },
      { 
        role: 'user', 
        content: `Student's SQL query: ${studentQuery}`
      }
    ];
    
    return await sendMessageToGPT(messages);
  } catch (error) {
    console.error('Error evaluating SQL query:', error);
    throw error;
  }
};