import axios from 'axios';
import { API_URL } from '../config/constants';

const DATASETS_API = `${API_URL}/datasets`;

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

// Get all datasets for the current user
const getAllDatasets = async () => {
  const response = await axios.get(`${DATASETS_API}/my/`, getAuthHeader());
  return response.data;
};

// Get a single dataset by ID
const getDatasetById = async (id) => {
  const response = await axios.get(`${DATASETS_API}/my/${id}/`, getAuthHeader());
  return response.data;
};

// Upload a new dataset
const uploadDataset = async (formData, onUploadProgress) => {
  const config = {
    ...getAuthHeader(),
    headers: {
      ...getAuthHeader().headers,
      'Content-Type': 'multipart/form-data'
    },
    onUploadProgress
  };
  
  const response = await axios.post(`${DATASETS_API}/upload/`, formData, config);
  return response.data;
};

// Get dataset statistics
const getDatasetStats = async (id) => {
  try {
    const response = await axios.get(`${DATASETS_API}/my/${id}/stats/`, getAuthHeader());
    return response.data;
  } catch (error) {
    console.error('Error fetching dataset stats:', error);
    throw error;
  }
};

// TODO: All following functions to be completed later
// Download dataset
const downloadDataset = async (id) => {
  const response = await axios.get(`${DATASETS_API}/${id}/download/`, {
    ...getAuthHeader(),
    responseType: 'blob'
  });
  
  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  const contentDisposition = response.headers['content-disposition'];
  let filename = 'dataset.csv';
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch.length === 2) {
      filename = filenameMatch[1];
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return { success: true };
};

// Delete a dataset
const deleteDataset = async (id) => {
  const response = await axios.delete(`${DATASETS_API}/my/${id}/`, getAuthHeader());
  return response.data;
};

// Preview dataset (first few rows)
const previewDataset = async (id) => {
  const response = await axios.get(`${DATASETS_API}/${id}/preview/`, getAuthHeader());
  return response.data;
};

// Share dataset with another user
const shareDataset = async (id, email) => {
  const response = await axios.post(
    `${DATASETS_API}/${id}/share/`, 
    { email },
    getAuthHeader()
  );
  return response.data;
};

// Get shared users for a dataset
const getSharedUsers = async (id) => {
  const response = await axios.get(`${DATASETS_API}/${id}/shared-users/`, getAuthHeader());
  return response.data;
};

// Remove shared user from dataset
const removeSharedUser = async (datasetId, userId) => {
  const response = await axios.delete(
    `${DATASETS_API}/${datasetId}/shared-users/${userId}/`, 
    getAuthHeader()
  );
  return response.data;
};


const datasetService = {
  getAllDatasets,
  getDatasetById,
  uploadDataset,
  downloadDataset,
  deleteDataset,
  previewDataset,
  getDatasetStats,
  shareDataset,
  getSharedUsers,
  removeSharedUser
};

export default datasetService;