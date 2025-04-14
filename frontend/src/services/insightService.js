import axios from 'axios';
import { API_URL } from '../config/constants';

const INSIGHTS_API = `${API_URL}/insights`;

// Get auth token function
const getAuthHeader = () => {
  if (localStorage.getItem('authToken')) {
    return {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }
  } else if (localStorage.getItem('guestToken')) {
    return {
      headers: {
        'X-Guest-Session': localStorage.getItem('guestToken')
      }
    }
  }
  return {
    headers: {}
  }
};

// Get all insights for the current user
const getAllInsights = async () => {
  const response = await axios.get(INSIGHTS_API, getAuthHeader());
  return response.data;
};

// Get a single insight by ID
const getInsightById = async (id) => {
  const response = await axios.get(`${INSIGHTS_API}/${id}/`, getAuthHeader());
  return response.data;
};

// Request generation of a new insight (may be a long-running task)
const generateInsight = async (datasetIds) => {
  const response = await axios.post(
    `${INSIGHTS_API}/generate/`, 
    { dataset_ids: datasetIds },
    getAuthHeader()
  );
  return response.data;
};

// Check status of insight generation
const checkInsightStatus = async (taskId) => {
  const response = await axios.get(
    `${INSIGHTS_API}/status/${taskId}/`,
    getAuthHeader()
  );
  return response.data;
};

// Get insights related to a specific dataset
const getInsightsByDataset = async (datasetId) => {
  const response = await axios.get(
    `${INSIGHTS_API}/dataset/${datasetId}/`,
    getAuthHeader()
  );
  return response.data;
};

const insightService = {
  getAllInsights,
  getInsightById,
  generateInsight,
  checkInsightStatus,
  getInsightsByDataset
};

export default insightService;