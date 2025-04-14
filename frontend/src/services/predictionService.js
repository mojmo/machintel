import axios from 'axios';
import { API_URL } from '../config/constants';

const PREDICTIONS_API = `${API_URL}/predictions`;

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

// Get all predictions for the current user
const getAllPredictions = async () => {
  const response = await axios.get(PREDICTIONS_API, getAuthHeader());
  return response.data;
};

// Get predictions for a specific dataset
const getDatasetPredictions = async (datasetId) => {
  const response = await axios.get(
    `${PREDICTIONS_API}/?dataset=${datasetId}`, 
    getAuthHeader()
  );
  return response.data;
};

// Get a single prediction by ID
const getPredictionById = async (id) => {
  const response = await axios.get(`${PREDICTIONS_API}/${id}/`, getAuthHeader());
  return response.data;
};

// TODO: All the following functions to be completed later

// Create a new prediction for a dataset
const createPrediction = async (datasetId) => {
  const response = await axios.post(
    PREDICTIONS_API, 
    { dataset_id: datasetId },
    getAuthHeader()
  );
  return response.data;
};

// Delete a prediction
const deletePrediction = async (id) => {
  const response = await axios.delete(`${PREDICTIONS_API}/${id}/`, getAuthHeader());
  return response.data;
};

// Get prediction results in various formats
const getPredictionResults = async (id, format = 'json') => {
  const response = await axios.get(
    `${PREDICTIONS_API}/${id}/results/?format=${format}`,
    format === 'csv' 
      ? { ...getAuthHeader(), responseType: 'blob' }
      : getAuthHeader()
  );
  
  if (format === 'csv') {
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `prediction-${id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return { success: true };
  }
  
  return response.data;
};

const predictionService = {
  getAllPredictions,
  getDatasetPredictions,
  getPredictionById,
  createPrediction,
  deletePrediction,
  getPredictionResults
};

export default predictionService;