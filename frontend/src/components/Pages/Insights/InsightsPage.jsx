import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import insightService from '../../../services/insightService';
import DOMPurify from 'dompurify';
import './InsightsPage.css';

const RecommendationsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get dataset ID from query params if available
  const queryParams = new URLSearchParams(location.search);
  const datasetId = queryParams.get('dataset');
  
  const [recommendations, setRecommendations] = useState([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        let data;
        
        // If we have a dataset ID, fetch recommendations for that dataset
        if (datasetId) {
          data = await insightService.getInsightsByDataset(datasetId);
        } else {
          // Otherwise fetch all recommendations
          data = await insightService.getAllInsights();
        }
        
        setRecommendations(data);
        if (data.length > 0) {
          setSelectedRecommendation(data[0]);
        }
      } catch (err) {
        setError('Failed to load recommendations. Please try again.');
        console.error('Error fetching recommendations:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [datasetId]);

  const handleRecommendationSelect = async (recommendationId) => {
    try {
      setIsLoading(true);
      const recommendationData = await insightService.getInsightById(recommendationId);
      setSelectedRecommendation(recommendationData);
    } catch (err) {
      setError('Failed to load recommendation details.');
      console.error('Error fetching recommendation details:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGenerateRecommendation = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      // If there's a specific dataset ID, use that
      const datasetIds = datasetId ? [datasetId] : [];
      
      // Call the API to generate a recommendation
      const result = await insightService.generateInsight(datasetIds);
      
      // Show a message indicating the recommendation is being generated
      alert('Recommendation generation started. It will be available shortly.');
      
      // Refresh the list after a brief delay to allow the backend to process
      setTimeout(() => {
        fetchRecommendations();
      }, 5000);
      
    } catch (err) {
      setError('Failed to generate recommendation. Please try again.');
      console.error('Error generating recommendation:', err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const fetchRecommendations = async () => {
    try {
      let data;
      
      // If we have a dataset ID, fetch recommendations for that dataset
      if (datasetId) {
        data = await insightService.getInsightsByDataset(datasetId);
      } else {
        // Otherwise fetch all recommendations
        data = await insightService.getAllInsights();
      }
      
      setRecommendations(data);
      if (data.length > 0) {
        setSelectedRecommendation(data[0]);
      }
    } catch (err) {
      setError('Failed to load recommendations. Please try again.');
      console.error('Error fetching recommendations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading && recommendations.length === 0) {
    return (
      <div className="recommendations-page loading-state">
        <div className="page-header">
          <h1>AI Recommendations</h1>
        </div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading recommendations...</p>
      </div>
    );
  }

  return (
    <div className="recommendations-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>AI Recommendations</h1>
          <p>Advanced analytics and recommendations for your CNC machine data</p>
        </div>
        
        <div className="header-actions">
          <button 
            className="primary-btn"
            onClick={handleGenerateRecommendation}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate New Recommendation'}
          </button>
          
          {datasetId && (
            <button 
              className="secondary-btn"
              onClick={() => navigate(`/datasets/${datasetId}`)}
            >
              Back to Dataset
            </button>
          )}
        </div>
      </motion.div>

      {error && (
        <motion.div
          className="error-message" 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <p>{error}</p>
        </motion.div>
      )}

      {recommendations.length === 0 ? (
        <motion.div
          className="no-recommendations"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2>No Recommendations Available</h2>
          <p>There are no recommendations available yet. Generate a recommendation or upload more data for our AI to analyze.</p>
          <div className="no-data-actions">
            <button 
              className="primary-btn" 
              onClick={handleGenerateRecommendation}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Recommendation'}
            </button>
            <button className="secondary-btn" onClick={() => navigate('/upload')}>
              Upload More Data
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="recommendations-container">
          <motion.div
            className="recommendations-sidebar"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2>Available Recommendations</h2>
            <ul className="recommendations-list">
              {recommendations.map((recommendation) => (
                <li
                  key={recommendation.insight_id || recommendation.id}
                  className={selectedRecommendation && (recommendation.insight_id || recommendation.id) === (selectedRecommendation.insight_id || selectedRecommendation.id) ? 'active' : ''}
                  onClick={() => handleRecommendationSelect(recommendation.insight_id || recommendation.id)}
                >
                  <div className="recommendation-list-item">
                    <h3>Analysis #{recommendation.insight_id || recommendation.id}</h3>
                    <p className="recommendation-date">Generated: {formatDate(recommendation.created_at)}</p>
                    {recommendation.dataset && (
                      <p className="recommendation-dataset">Dataset #{recommendation.dataset}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            className="recommendation-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {selectedRecommendation ? (
              <>
                <div className="recommendation-header">
                  <h2>Analysis #{selectedRecommendation.insight_id || selectedRecommendation.id}</h2>
                  <p className="recommendation-date">Generated on {formatDate(selectedRecommendation.created_at)}</p>
                  {selectedRecommendation.dataset && (
                    <p className="recommendation-dataset">
                      For Dataset #{selectedRecommendation.dataset} - <a href={`/datasets/${selectedRecommendation.dataset}`}>View Dataset</a>
                    </p>
                  )}
                </div>

                <div className="recommendation-body">
                  {/* Safely render the HTML content from the API */}
                  <div 
                    className="recommendation-html-content"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(selectedRecommendation.recommendation) 
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="no-recommendation-selected">
                <p>Select a recommendation from the sidebar to view details.</p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RecommendationsPage;