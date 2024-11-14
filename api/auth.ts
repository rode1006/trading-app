import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/auth'; // Replace with your actual API base URL

// Function to register a user  
export const registerUser = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/register`, {
      username,
      password,
    });
    return response.data; // This will return the response data from the API
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Registration Error:', error.response.data);
      throw new Error(error.response.data.message || 'Registration failed');
    } else {
      console.error('Unexpected Registration Error:', error);
      throw new Error('Unexpected error during registration');
    }
  }
};

// Function to log in a user
export const loginUser = async (username: string, password: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/login`, {
      username,
      password,
    });
    return response.data; // This will return the response data from the API
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error('Login Error:', error.response.data);
      throw new Error(error.response.data.message || 'Login failed');
    } else {
      console.error('Unexpected Login Error:', error);
      throw new Error('Unexpected error during login');
    }
  }
};

