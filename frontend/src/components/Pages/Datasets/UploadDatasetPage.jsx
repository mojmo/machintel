import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import datasetService from '../../../services/datasetService';
import './DatasetPages.css';

const UploadDatasetPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      validateAndSetFile(droppedFiles[0]);
    }
  };
  
  const handleFileInput = (e) => {
    if (e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };
  
  const validateAndSetFile = (file) => {
    // Reset error state
    setError('');
    
    // Check file type (allow only CSV)
    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are allowed');
      return;
    }
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size should not exceed 10MB');
      return;
    }
    
    // Valid file, set it
    setFile(file);
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setError('');
      
      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload with progress tracking
      const onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadProgress(percentCompleted);
      };
      
      // Send to API
      const response = await datasetService.uploadDataset(formData, onUploadProgress);
      
      // Navigate to the dataset details page on success
      navigate(`/datasets/${response.id}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload dataset. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  const promptFileSelector = () => {
    fileInputRef.current.click();
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  return (
    <div className="upload-page">
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Upload Dataset</h1>
        <p>
          Upload your CNC machine data in CSV format. The file should contain sensor readings
          and operation parameters from your machines.
        </p>
      </motion.div>

      <motion.div
        className="upload-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div
          className={`upload-dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={file ? null : promptFileSelector}
        >
          {!file ? (
            <div className="upload-instructions">
              <div className="upload-icon">
                <i className="fas fa-cloud-upload-alt"></i>
                <span>📁</span>
              </div>
              <h2>Drag & Drop your file here</h2>
              <p>or</p>
              <button className="browse-button" onClick={promptFileSelector}>
                Browse Files
              </button>
              <p className="file-note">
                Supported format: CSV up to 10MB
              </p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                style={{ display: 'none' }}
                accept=".csv" 
              />
            </div>
          ) : (
            <div className="file-info">
              <div className="file-icon">
                <i className="fas fa-file-csv"></i>
                <span>📊</span>
              </div>
              <div className="file-details">
                <h3>{file.name}</h3>
                <p>Size: {formatFileSize(file.size)}</p>
              </div>
            </div>
          )}
        </div>

        {file && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isUploading ? (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="progress-text">Uploading... {uploadProgress}%</p>
              </div>
            ) : (
              <div className="upload-actions">
                <button className="upload-button" onClick={handleUpload}>
                  Upload Dataset
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setFile(null);
                    setError('');
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default UploadDatasetPage;