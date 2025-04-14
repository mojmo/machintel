import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import predictionService from '../../../services/predictionService';
import datasetService from '../../../services/datasetService';
import './PredictionsPage.css';

// Register ChartJS components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const PredictionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [datasetId, setDatasetId] = useState(null);
  
  const [prediction, setPrediction] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch prediction details
        const predictionData = await predictionService.getPredictionById(id);
        setPrediction(predictionData);
        
        // Fetch related dataset details if we have dataset_id
        if (predictionData.dataset) {
            setDatasetId(predictionData.dataset);
          const datasetData = await datasetService.getDatasetById(predictionData.dataset);
          setDataset(datasetData);
        }
        
      } catch (err) {
        console.error('Error fetching prediction data:', err);
        setError('Failed to load prediction details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Prepare radar chart data from features
  const prepareRadarData = () => {
    if (!prediction || !prediction.features) return null;
    
    // Filter numerical features for the radar chart
    const numericalFeatures = {};
    Object.entries(prediction.features).forEach(([key, value]) => {
      // Only include numerical values
      if (typeof value === 'number') {
        numericalFeatures[key] = value;
      }
    });
    
    // Take up to 8 features for readability
    const featureKeys = Object.keys(numericalFeatures).slice(0, 8);
    const featureValues = featureKeys.map(key => numericalFeatures[key]);
    
    // Normalize values between 0 and 1 for radar chart
    const maxValue = Math.max(...featureValues);
    const normalizedValues = featureValues.map(val => val / maxValue);
    
    return {
      labels: featureKeys,
      datasets: [
        {
          label: 'Feature Values',
          data: normalizedValues,
          backgroundColor: 'rgba(245, 166, 35, 0.2)',
          borderColor: 'rgba(245, 166, 35, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(245, 166, 35, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(245, 166, 35, 1)',
        }
      ]
    };
  };
  
  if (isLoading) {
    return (
      <div className="prediction-details-page loading-state">
        <div className="page-header">
          <h1>Prediction Details</h1>
        </div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading prediction details...</p>
      </div>
    );
  }
  
  if (error || !prediction) {
    return (
      <div className="prediction-details-page error-state">
        <div className="page-header">
          <h1>Prediction Details</h1>
        </div>
        <div className="error-message">{error || 'Prediction not found'}</div>
        <button className="primary-btn" onClick={() => navigate(`/predictions?dataset=${datasetId}`)}>
          Back to Predictions
        </button>
      </div>
    );
  }
  
  const radarData = prepareRadarData();
  const isPredictionFailure = prediction.prediction === 'Failure';
  
  return (
    <div className="prediction-details-page">
      <motion.div
        className="prediction-details-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>Prediction Details</h1>
          <p>
            Product ID: <strong>{prediction.product_id}</strong>
            {dataset && (
              <> | Dataset: <span className="highlight">#{dataset.id}</span></>
            )}
          </p>
        </div>
        <button 
          className="primary-btn" 
          onClick={() => dataset ? navigate(`/predictions/?dataset=${dataset.id}`) : navigate('/predictions')}
        >
          Back to Predictions
        </button>
      </motion.div>

      <motion.div
        className="prediction-result-card"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className={`result-banner ${isPredictionFailure ? 'failure' : 'normal'}`}>
          <div className="result-icon">
            {isPredictionFailure ? '⚠️' : '✓'}
          </div>
          <div className="result-content">
            <h2>Prediction Result:</h2>
            <div className="prediction-result">
              {prediction.prediction}
              <span className="confidence">
                {(prediction.confidence * 100).toFixed(1)}% Confidence
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="tab-navigation"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <button 
          className={`tab-button ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${selectedTab === 'features' ? 'active' : ''}`}
          onClick={() => setSelectedTab('features')}
        >
          Feature Data
        </button>
        <button 
          className={`tab-button ${selectedTab === 'visualization' ? 'active' : ''}`}
          onClick={() => setSelectedTab('visualization')}
        >
          Visualization
        </button>
      </motion.div>

      {/* Tab content */}
      <motion.div
        className="tab-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {selectedTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-cards">
              <div className="info-card">
                <h3>Product Information</h3>
                <ul className="info-list">
                  <li><strong>Product ID:</strong> {prediction.product_id}</li>
                  <li><strong>Type:</strong> {prediction.features?.Type || 'N/A'}</li>
                  <li><strong>Prediction Made:</strong> {formatDate(prediction.created_at)}</li>
                </ul>
              </div>
              
              <div className="info-card">
                <h3>Prediction Details</h3>
                <ul className="info-list">
                  <li><strong>Result:</strong> <span className={isPredictionFailure ? 'failure-text' : 'normal-text'}>{prediction.prediction}</span></li>
                  <li><strong>Confidence:</strong> {(prediction.confidence * 100).toFixed(1)}%</li>
                  <li><strong>Model Version:</strong> {prediction.model_version || 'v1.0'}</li>
                </ul>
              </div>
            </div>

            {isPredictionFailure && (
              <div className="failure-explanation">
                <h3>Failure Analysis</h3>
                <p>
                  The model has identified potential issues with this product that might lead to failure. 
                  The key factors that contributed to this prediction are highlighted below:
                </p>
                <ul className="contributing-factors">
                  {/* Dynamically show top 3 features that contributed to failure */}
                  {Object.entries(prediction.features || {})
                    .filter(([key]) => typeof prediction.features[key] === 'number')
                    .sort((a, b) => Math.abs(b[1] - 0.5) - Math.abs(a[1] - 0.5))
                    .slice(0, 3)
                    .map(([key, value]) => (
                      <li key={key}>
                        <strong>{key}:</strong> {value} 
                        {typeof prediction.feature_importance === 'object' && prediction.feature_importance[key] && 
                          <span className="importance-badge">
                            Impact: {(prediction.feature_importance[key] * 100).toFixed(1)}%
                          </span>
                        }
                      </li>
                    ))
                  }
                </ul>
                <p className="recommendation">
                  <strong>Recommendation:</strong> Consider inspecting this product with focus on the highlighted parameters.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'features' && (
          <div className="features-tab">
            <h3>Raw Feature Data</h3>
            <div className="features-table-container">
              <table className="features-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {prediction.features && Object.entries(prediction.features).map(([key, value]) => (
                    <tr key={key}>
                      <td>{key}</td>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedTab === 'visualization' && (
          <div className="visualization-tab">
            <h3>Feature Visualization</h3>
            {radarData ? (
              <div className="chart-container">
                <Radar 
                  data={radarData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const index = context.dataIndex;
                            const key = radarData.labels[index];
                            const originalValue = prediction.features[key];
                            return `${key}: ${originalValue}`;
                          }
                        }
                      }
                    },
                    scales: {
                      r: {
                        angleLines: {
                          display: true
                        },
                        min: 0,
                        max: 1,
                        ticks: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <p className="no-data">No numerical data available for visualization</p>
            )}
            
            <div className="threshold-info">
              <h4>Decision Thresholds</h4>
              <p>
                The prediction model uses machine learning to identify patterns that indicate potential failures.
                For this product, the failure probability was calculated as {(prediction.confidence * 100).toFixed(1)}%,
                {isPredictionFailure 
                  ? ' which exceeds our threshold for reliable operation.' 
                  : ' which is within our acceptable range for reliable operation.'
                }
              </p>
            </div>
          </div>
        )}
      </motion.div>
      
      <motion.div
        className="actions-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <button 
          className="secondary-btn"
          onClick={() => predictionService.getPredictionResults(prediction.id, 'csv')}
        >
          Export as CSV
        </button>
        
        {dataset && (
          <button 
            className="primary-btn"
            onClick={() => navigate(`/datasets/${dataset.id}`)}
          >
            View Source Dataset
          </button>
        )}
      </motion.div>
    </div>
  );
};

export default PredictionDetailsPage;