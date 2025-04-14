import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import datasetService from '../../../services/datasetService';
import predictionService from '../../../services/predictionService';
import './PredictionsPage.css';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const PredictionsPage = () => {
  const { datasetId: pathDatasetId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get dataset ID from either path parameter or query parameter
  const queryParams = new URLSearchParams(location.search);
  const queryDatasetId = queryParams.get('dataset');
  const effectiveDatasetId = pathDatasetId || queryDatasetId;
  
  const [dataset, setDataset] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // If we have a dataset ID, fetch specific dataset details and predictions
        if (effectiveDatasetId) {
          // Fetch dataset details
          const datasetData = await datasetService.getDatasetById(effectiveDatasetId);
          setDataset(datasetData);
          
          // Fetch predictions for this dataset
          const predictionsData = await predictionService.getDatasetPredictions(effectiveDatasetId);
          setPredictions(predictionsData);
        } else {
          // No dataset ID - fetch all predictions
          const allPredictions = await predictionService.getAllPredictions();
          setPredictions(allPredictions);
          setDataset(null);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load prediction data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [effectiveDatasetId]);
  
  // Filter predictions based on search term
  const filteredPredictions = predictions.filter(prediction => 
    prediction.product_id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPredictions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPredictions.length / itemsPerPage);
  
  // Charts data preparation
  const prepareChartData = () => {
    // Count predictions by result
    const predictionCounts = {
      Normal: predictions.filter(p => p.prediction === 'Normal').length,
      Failure: predictions.filter(p => p.prediction === 'Failure').length
    };
    
    // Group by confidence level
    const confidenceLevels = {
      'Very Low (0-20%)': 0,
      'Low (20-40%)': 0,
      'Medium (40-60%)': 0,
      'High (60-80%)': 0,
      'Very High (80-100%)': 0
    };
    
    predictions.forEach(p => {
      const confidence = p.confidence * 100;
      
      if (confidence < 20) confidenceLevels['Very Low (0-20%)']++;
      else if (confidence < 40) confidenceLevels['Low (20-40%)']++;
      else if (confidence < 60) confidenceLevels['Medium (40-60%)']++;
      else if (confidence < 80) confidenceLevels['High (60-80%)']++;
      else confidenceLevels['Very High (80-100%)']++;
    });
    
    const pieData = {
      labels: ['Normal', 'Failure'],
      datasets: [
        {
          data: [predictionCounts.Normal, predictionCounts.Failure],
          backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
          borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
          borderWidth: 1
        }
      ]
    };
    
    const barData = {
      labels: Object.keys(confidenceLevels),
      datasets: [
        {
          label: 'Predictions by Confidence Level',
          data: Object.values(confidenceLevels),
          backgroundColor: 'rgba(245, 166, 35, 0.6)',
          borderColor: 'rgba(245, 166, 35, 1)',
          borderWidth: 1
        }
      ]
    };
    
    return { pieData, barData };
  };

  const totalPredictions = predictions.length;
  const failurePredictions = predictions.filter(p => p.prediction === 'Failure').length;
  const normalPredictions = totalPredictions - failurePredictions;
  
  let chartData = { pieData: null, barData: null };
  if (predictions.length > 0) {
    chartData = prepareChartData();
  }
  
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // Scroll to top of results
    window.scrollTo({ top: document.getElementById('results-top').offsetTop, behavior: 'smooth' });
  };
  
  if (isLoading) {
    return (
      <div className="predictions-page loading-state">
        <div className="page-header">
          <h1>Prediction Results</h1>
        </div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading prediction results...</p>
      </div>
    );
  }
  
  if (error || !dataset || !predictions) {
    return (
      <div className="predictions-page error-state">
        <div className="page-header">
          <h1>Prediction Results</h1>
        </div>
        <div className="error-message">{error || 'Prediction data not found'}</div>
        <button className="primary-btn" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }
  
  return (
    <div className="predictions-page">
      <motion.div
        className="predictions-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>Prediction Results</h1>
          {dataset ? (
            <p>Dataset #{effectiveDatasetId} - Total Predictions: {predictions.length}</p>
          ) : (
            <p>All Predictions - Total: {predictions.length}</p>
          )}
        </div>
        {dataset ? (
          <button className="primary-btn" onClick={() => navigate(`/datasets/${effectiveDatasetId}`)}>
            Back to Dataset
          </button>
        ) : (
          <button className="primary-btn" onClick={() => navigate('/datasets')}>
            View All Datasets
          </button>
        )}
      </motion.div>

      {dataset && predictions.length > 0 && (
        <motion.div
          className="prediction-summary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2>Prediction Summary</h2>
          <div className="prediction-stats">
            <div className="stat-card">
              <h3>Normal Predictions</h3>
              <p className="normal-count">{normalPredictions}</p>
            </div>
            <div className="stat-card">
              <h3>Failure Predictions</h3>
              <p className="failure-count">{failurePredictions}</p>
            </div>
            <div className="stat-card">
              <h3>Failure Rate</h3>
              <p className="failure-rate">
                {totalPredictions > 0
                  ? `${((failurePredictions / totalPredictions) * 100).toFixed(1)}%`
                  : '0%'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {predictions.length > 0 && (
        <motion.div
          className="prediction-charts"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="chart-row">
            <div className="chart-container">
              <h2>Prediction Distribution</h2>
              <div className="pie-chart">
                <Pie data={chartData.pieData} options={{ responsive: true }} />
              </div>
            </div>
            <div className="chart-container">
              <h2>Confidence Levels</h2>
              <div className="bar-chart">
                <Bar 
                  data={chartData.barData} 
                  options={{
                    responsive: true,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }} 
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        id="results-top"
        className="predictions-table-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="table-header">
          <h2>Detailed Predictions</h2>
          <div className="search-container">
            <input
              type="text"
              placeholder="Search by Product ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
        </div>

        {predictions.length === 0 ? (
          <div className="no-predictions">
            <p>No predictions available for this dataset.</p>
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="no-predictions">
            <p>No predictions matching your search.</p>
          </div>
        ) : (
          <>
            <div className="predictions-table-wrapper">
              <table className="predictions-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Type</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((prediction) => (
                    <tr key={prediction.id} className={prediction.prediction === 'Failure' ? 'failure-row' : 'normal-row'}>
                      <td>{prediction.product_id}</td>
                      <td>{prediction.features.Type}</td>
                      <td>
                        <span className={`prediction-badge ${prediction.prediction.toLowerCase()}`}>
                          {prediction.prediction}
                        </span>
                      </td>
                      <td>{(prediction.confidence * 100).toFixed(2)}%</td>
                      <td>
                        <button
                          className="details-btn"
                          onClick={() => navigate(`/predictions/${prediction.id}`)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  &laquo;
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-btn"
                >
                  &lsaquo;
                </button>
                
                <div className="page-info">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  &rsaquo;
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="page-btn"
                >
                  &raquo;
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PredictionsPage;