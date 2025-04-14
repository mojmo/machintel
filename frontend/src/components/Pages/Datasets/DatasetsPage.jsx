import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import datasetService from '../../../services/datasetService';
import './DatasetPages.css';

const DatasetsPage = () => {
  const navigate = useNavigate();
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setIsLoading(true);
        const response = await datasetService.getAllDatasets();
        
        // Check the structure of the response
        console.log("API response:", response);
        
        // Handle different response structures
        let datasetsArray = [];
        
        if (Array.isArray(response)) {
          datasetsArray = response;
        } else if (response && response.results && Array.isArray(response.results)) {
          // If API returns { results: [...] } format
          datasetsArray = response.results;
        } else if (response && typeof response === 'object') {
          // If API returns an object with datasets
          datasetsArray = response.datasets || [];
        }
        
        setDatasets(datasetsArray);
      } catch (err) {
        setError('Failed to load datasets. Please try again.');
        console.error('Error fetching datasets:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatasets();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'Unknown File';
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  };

  if (isLoading) {
    return (
      <div className="datasets-page loading-state">
        <div className="page-header">
          <h1>Your Datasets</h1>
        </div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading your datasets...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="datasets-page error-state">
        <div className="page-header">
          <h1>Your Datasets</h1>
        </div>
        <div className="error-message">{error}</div>
        <button className="primary-btn" onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="datasets-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>Your Datasets</h1>
          <p>View and manage your uploaded datasets</p>
        </div>
        <button className="primary-btn" onClick={() => navigate('/upload')}>
          Upload New Dataset
        </button>
      </motion.div>

      {Array.isArray(datasets) && datasets.length > 0 ? (
        <motion.div
          className="datasets-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {datasets.map((dataset, index) => (
            <motion.div
              key={dataset.id || index}
              className="dataset-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              <div className="dataset-card-header">
                <h3>Dataset #{dataset.id}</h3>
              </div>
              <div className="dataset-card-body">
                <div className="dataset-name">
                  <strong>File:</strong> {getFileName(dataset.file)}
                </div>
                <div className="dataset-meta">
                  <span>Uploaded: {formatDate(dataset.uploaded_at)}</span>
                </div>
                <div className="dataset-card-actions">
                  <button className="view-btn" onClick={() => navigate(`/datasets/${dataset.id}`)}>
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="no-datasets"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>No Datasets Found</h2>
          <p>You haven't uploaded any datasets yet. Get started by uploading your first dataset!</p>
          {/* <div className="no-datasets-action">
            <button className="primary-btn" onClick={() => navigate('/upload')}>
              Upload Dataset
            </button>
          </div> */}
        </motion.div>
      )}
    </div>
  );
};

export default DatasetsPage;