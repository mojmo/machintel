import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import datasetService from '../../../services/datasetService';
import predictionService from '../../../services/predictionService';
import './DatasetPages.css';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement,
  BarElement, 
  Title 
} from 'chart.js';
import { Pie, Bar, Scatter } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title
);

const DatasetDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [dataset, setDataset] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataStats, setDataStats] = useState({});
  const [chartData, setChartData] = useState({});
  const [fullDataLoaded, setFullDataLoaded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch dataset details
        const datasetData = await datasetService.getDatasetById(id);
        setDataset(datasetData);
        
        // Fetch predictions for this dataset
        const predictionsData = await predictionService.getDatasetPredictions(id);
        setPredictions(predictionsData);
        
        // Fetch full dataset stats and complete data if available
        try {
          const statsData = await datasetService.getDatasetStats(id);
          if (statsData) {
            setDataStats(statsData);
            setFullDataLoaded(true);
            
            // Prepare chart data based on full dataset stats
            prepareChartData(statsData);
          } else {
            // If full stats not available, calculate limited stats from preview data
            calculateDataStats(datasetData.csv_data);
          }
        } catch (err) {
          console.error('Unable to fetch full dataset stats:', err);
          // Use preview data for calculations
          calculateDataStats(datasetData.csv_data);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dataset details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);
  
  // Calculate data statistics from preview data
  const calculateDataStats = (csvData) => {
    if (!csvData || !csvData.length) return;
    
    // Get unique product IDs and types
    const productIds = [...new Set(csvData.map(row => row['Product ID'] || row['product_id'] || ''))];
    const types = [...new Set(csvData.map(row => row['Type'] || row['type'] || ''))];

    // Calculate averages
    let airTempSum = 0;
    let processTempSum = 0;
    let torqueSum = 0;
    let toolWearSum = 0;
    let rotationalSpeedSum = 0;
    let count = 0;
    
    csvData.forEach(row => {
      const airTemp = parseFloat(row['Air temperature [K]'] || row['air_temperature'] || 0);
      const processTemp = parseFloat(row['Process temperature [K]'] || row['process_temperature'] || 0);
      const torque = parseFloat(row['Torque [Nm]'] || row['torque'] || 0);
      const toolWear = parseFloat(row['Tool wear [min]'] || row['tool_wear'] || 0);
      const rotationalSpeed = parseFloat(row['Rotational speed [rpm]'] || row['rotational_speed'] || 0);
      
      if (!isNaN(airTemp)) airTempSum += airTemp;
      if (!isNaN(processTemp)) processTempSum += processTemp;
      if (!isNaN(torque)) torqueSum += torque;
      if (!isNaN(toolWear)) toolWearSum += toolWear;
      if (!isNaN(rotationalSpeed)) rotationalSpeedSum += rotationalSpeed;
      count++;
    });
    
    const stats = {
      machineCount: productIds.length,
      typeCount: types.length,
      avgAirTemperature: count ? (airTempSum / count).toFixed(2) : 'N/A',
      avgProcessTemperature: count ? (processTempSum / count).toFixed(2) : 'N/A',
      avgTorque: count ? (torqueSum / count).toFixed(2) : 'N/A',
      avgToolWear: count ? (toolWearSum / count).toFixed(2) : 'N/A',
      avgRotationalSpeed: count ? (rotationalSpeedSum / count).toFixed(2) : 'N/A',
    };
    
    setDataStats(stats);
    
    // Prepare chart data based on preview data
    prepareChartDataFromPreview(csvData);
  };
  
  // Prepare chart data from preview data
  const prepareChartDataFromPreview = (csvData) => {
    if (!csvData || !csvData.length) return;
    
    try {
      // Group data by type and count
      const typeCountMap = {};
      csvData.forEach(row => {
        const type = row['Type'] || row['type'] || 'Unknown';
        if (!typeCountMap[type]) typeCountMap[type] = 0;
        typeCountMap[type]++;
      });
      
      // Prepare pie chart data for types
      const pieData = {
        labels: Object.keys(typeCountMap),
        datasets: [
          {
            data: Object.values(typeCountMap),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }
        ]
      };
      
      // Create simple scatter data for temperature and speed
      const scatterDataTemp = [];
      const scatterDataSpeed = [];
      
      // Also create scatter data by type
      const scatterDataTempByType = {
        H: [], // High type
        M: [], // Medium type
        L: []  // Low type
      };
      
      const scatterDataProcessSpeedByType = {
        H: [], // High type
        M: [], // Medium type
        L: []  // Low type
      };
      
      // Group data by product ID and type to create aggregated stats
      const productTypeSums = {};
      
      csvData.forEach(row => {
        const productId = row['Product ID'] || row['product_id'] || '';
        const type = row['Type'] || row['type'] || '';
        const airTemp = parseFloat(row['Air temperature [K]'] || row['air_temperature'] || 0);
        const processTemp = parseFloat(row['Process temperature [K]'] || row['process_temperature'] || 0);
        const rotationalSpeed = parseFloat(row['Rotational speed [rpm]'] || row['rotational_speed'] || 0);
        const torque = parseFloat(row['Torque [Nm]'] || row['torque'] || 0);
        
        // Basic scatter plots
        if (!isNaN(airTemp) && !isNaN(processTemp)) {
          scatterDataTemp.push({
            x: airTemp,
            y: processTemp,
          });
        }
        
        if (!isNaN(rotationalSpeed) && !isNaN(torque)) {
          scatterDataSpeed.push({
            x: rotationalSpeed,
            y: torque,
          });
        }
        
        // Aggregated data by product and type
        if (productId && type && !isNaN(airTemp) && !isNaN(processTemp) && !isNaN(rotationalSpeed)) {
          if (!productTypeSums[`${productId}-${type}`]) {
            productTypeSums[`${productId}-${type}`] = {
              productId,
              type,
              airTempSum: 0,
              processTempSum: 0,
              rotationalSpeedSum: 0
            };
          }
          
          productTypeSums[`${productId}-${type}`].airTempSum += airTemp;
          productTypeSums[`${productId}-${type}`].processTempSum += processTemp;
          productTypeSums[`${productId}-${type}`].rotationalSpeedSum += rotationalSpeed;
        }
      });
      
      // Create scatter data from aggregated product-type sums
      Object.values(productTypeSums).forEach(item => {
        const { type, productId, airTempSum, processTempSum, rotationalSpeedSum } = item;
        
        if (scatterDataTempByType[type]) {
          scatterDataTempByType[type].push({
            x: airTempSum,
            y: processTempSum,
            productId
          });
        }
        
        if (scatterDataProcessSpeedByType[type]) {
          scatterDataProcessSpeedByType[type].push({
            x: processTempSum,
            y: rotationalSpeedSum,
            productId
          });
        }
      });
      
      // Create dataset objects
      const scatterTempData = {
        datasets: [{
          label: 'Air vs Process Temperature',
          data: scatterDataTemp,
          backgroundColor: 'rgba(255, 99, 132, 0.6)'
        }]
      };
      
      const scatterSpeedData = {
        datasets: [{
          label: 'Rotational Speed vs Torque',
          data: scatterDataSpeed,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      };
      
      // Create final chart data object
      const finalChartData = {
        pieTypeData: pieData,
        scatterTempData: scatterTempData,
        scatterSpeedData: scatterSpeedData
      };
      
      // Add type-based scatter datasets if they have data
      const tempByTypeDatasets = [];
      const processSpeedByTypeDatasets = [];
      
      ['H', 'M', 'L'].forEach((type, index) => {
        const colors = [
          'rgba(255, 99, 132, 0.6)', 
          'rgba(54, 162, 235, 0.6)', 
          'rgba(255, 206, 86, 0.6)'
        ];
        
        if (scatterDataTempByType[type] && scatterDataTempByType[type].length > 0) {
          tempByTypeDatasets.push({
            label: `${type} Type`,
            data: scatterDataTempByType[type],
            backgroundColor: colors[index]
          });
        }
        
        if (scatterDataProcessSpeedByType[type] && scatterDataProcessSpeedByType[type].length > 0) {
          processSpeedByTypeDatasets.push({
            label: `${type} Type`,
            data: scatterDataProcessSpeedByType[type],
            backgroundColor: colors[index]
          });
        }
      });
      
      if (tempByTypeDatasets.length > 0) {
        finalChartData.tempByTypeScatterData = {
          datasets: tempByTypeDatasets
        };
      }
      
      if (processSpeedByTypeDatasets.length > 0) {
        finalChartData.processSpeedByTypeScatterData = {
          datasets: processSpeedByTypeDatasets
        };
      }
      
      setChartData(finalChartData);
      
    } catch (err) {
      console.error('Error preparing chart data:', err);
    }
  };
  
  // Prepare chart data from full dataset stats
  const prepareChartData = (statsData) => {
    if (!statsData) return;
    
    try {
      // Create charts from full dataset stats
      const { 
        type_counts, 
        speed_torque_by_product_type, 
        temp_by_product_type, 
        process_speed_by_product_type 
      } = statsData;
      
      // Pie chart for types
      const pieData = {
        labels: Object.keys(type_counts || {}),
        datasets: [
          {
            data: Object.values(type_counts || {}),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
            ],
            borderWidth: 1,
          }
        ]
      };
      
      // Create scatter data for speed vs torque by type
      const scatterDataSpeedTorqueByType = {
        H: [], // High type
        M: [], // Medium type
        L: []  // Low type
      };
      
      // Process the speed_torque_by_product_type data
      if (speed_torque_by_product_type && Array.isArray(speed_torque_by_product_type)) {
        speed_torque_by_product_type.forEach(item => {
          const speedSum = item.rotational_speed_sum;
          const torqueSum = item.torque_sum;
          const type = item.type;
          
          if (speedSum && torqueSum && type && scatterDataSpeedTorqueByType[type] !== undefined) {
            scatterDataSpeedTorqueByType[type].push({
              x: parseFloat(speedSum),
              y: parseFloat(torqueSum),
              productId: item.product_id
            });
          }
        });
      }
      
      // Create scatter data for air temp vs process temp by product type
      const scatterDataTempByType = {
        H: [], // High type
        M: [], // Medium type
        L: []  // Low type
      };
      
      // Process the temp_by_product_type data
      if (temp_by_product_type && Array.isArray(temp_by_product_type)) {
        temp_by_product_type.forEach(item => {
          const airTempSum = item.air_temp_sum;
          const processTempSum = item.process_temp_sum;
          const type = item.type;
          
          if (airTempSum && processTempSum && type && scatterDataTempByType[type] !== undefined) {
            scatterDataTempByType[type].push({
              x: parseFloat(airTempSum),
              y: parseFloat(processTempSum),
              productId: item.product_id
            });
          }
        });
      }
      
      // Create scatter data for process temp vs rotational speed by product type
      const scatterDataProcessSpeedByType = {
        H: [], // High type
        M: [], // Medium type
        L: []  // Low type
      };
      
      // Process the process_speed_by_product_type data
      if (process_speed_by_product_type && Array.isArray(process_speed_by_product_type)) {
        process_speed_by_product_type.forEach(item => {
          const processTempSum = item.process_temp_sum;
          const rotationalSpeedSum = item.rotational_speed_sum;
          const type = item.type;
          
          if (processTempSum && rotationalSpeedSum && type && scatterDataProcessSpeedByType[type] !== undefined) {
            scatterDataProcessSpeedByType[type].push({
              x: parseFloat(processTempSum),
              y: parseFloat(rotationalSpeedSum),
              productId: item.product_id
            });
          }
        });
      }
      
      // Create the chart data object - Start with just pie chart
      const finalChartData = {
        pieTypeData: pieData
      };
      
      // Add the scatter plots by type
      const hasAirProcessTempByType = 
        scatterDataTempByType.H.length > 0 || 
        scatterDataTempByType.M.length > 0 || 
        scatterDataTempByType.L.length > 0;
        
      if (hasAirProcessTempByType) {
        const tempByTypeDatasets = [];
        
        if (scatterDataTempByType.H.length > 0) {
          tempByTypeDatasets.push({
            label: 'H Type',
            data: scatterDataTempByType.H,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          });
        }
        
        if (scatterDataTempByType.M.length > 0) {
          tempByTypeDatasets.push({
            label: 'M Type',
            data: scatterDataTempByType.M,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          });
        }
        
        if (scatterDataTempByType.L.length > 0) {
          tempByTypeDatasets.push({
            label: 'L Type',
            data: scatterDataTempByType.L,
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
          });
        }
        
        finalChartData.tempByTypeScatterData = {
          datasets: tempByTypeDatasets
        };
      }
      
      const hasProcessSpeedByType = 
        scatterDataProcessSpeedByType.H.length > 0 || 
        scatterDataProcessSpeedByType.M.length > 0 || 
        scatterDataProcessSpeedByType.L.length > 0;
        
      if (hasProcessSpeedByType) {
        const processSpeedByTypeDatasets = [];
        
        if (scatterDataProcessSpeedByType.H.length > 0) {
          processSpeedByTypeDatasets.push({
            label: 'H Type',
            data: scatterDataProcessSpeedByType.H,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          });
        }
        
        if (scatterDataProcessSpeedByType.M.length > 0) {
          processSpeedByTypeDatasets.push({
            label: 'M Type',
            data: scatterDataProcessSpeedByType.M,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          });
        }
        
        if (scatterDataProcessSpeedByType.L.length > 0) {
          processSpeedByTypeDatasets.push({
            label: 'L Type',
            data: scatterDataProcessSpeedByType.L,
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
          });
        }
        
        finalChartData.processSpeedByTypeScatterData = {
          datasets: processSpeedByTypeDatasets
        };
      }
      
      // Add speed vs torque by type chart
      const hasSpeedTorqueByType = 
        scatterDataSpeedTorqueByType.H.length > 0 || 
        scatterDataSpeedTorqueByType.M.length > 0 || 
        scatterDataSpeedTorqueByType.L.length > 0;
        
      if (hasSpeedTorqueByType) {
        const speedTorqueByTypeDatasets = [];
        
        if (scatterDataSpeedTorqueByType.H.length > 0) {
          speedTorqueByTypeDatasets.push({
            label: 'H Type',
            data: scatterDataSpeedTorqueByType.H,
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
          });
        }
        
        if (scatterDataSpeedTorqueByType.M.length > 0) {
          speedTorqueByTypeDatasets.push({
            label: 'M Type',
            data: scatterDataSpeedTorqueByType.M,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
          });
        }
        
        if (scatterDataSpeedTorqueByType.L.length > 0) {
          speedTorqueByTypeDatasets.push({
            label: 'L Type',
            data: scatterDataSpeedTorqueByType.L,
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
          });
        }
        
        finalChartData.speedTorqueByTypeScatterData = {
          datasets: speedTorqueByTypeDatasets
        };
      }
      
      // Set the chart data
      setChartData(finalChartData);
      
      // If we didn't get any scatter plot data, fall back to preview data
      if (!hasAirProcessTempByType && !hasProcessSpeedByType && !hasSpeedTorqueByType) {
        // Fall back to preview data to get scatter plots
        if (dataset && dataset.csv_data) {
          prepareChartDataFromPreview(dataset.csv_data);
        }
      }
      
    } catch (err) {
      console.error('Error preparing chart data from stats:', err);
      // Fall back to preview data
      if (dataset && dataset.csv_data) {
        prepareChartDataFromPreview(dataset.csv_data);
      }
    }
  };
  
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
      <div className="dataset-details-page loading-state">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading dataset information...</p>
      </div>
    );
  }
  
  if (error || !dataset) {
    return (
      <div className="dataset-details-page error-state">
        <div className="error-message">{error || 'Dataset not found'}</div>
        <button className="primary-btn" onClick={() => navigate('/datasets')}>
          Back to Datasets
        </button>
      </div>
    );
  }
  
  const totalPredictions = predictions.length;
  
  return (
    <div className="dataset-details-page">
      <motion.div
        className="dataset-details-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="header-content">
          <h1>Dataset #{dataset.id}</h1>
          <p>Uploaded on {formatDate(dataset.uploaded_at)}</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => navigate('/datasets')}>
            Back to Datasets
          </button>
        </div>
      </motion.div>

      <motion.div
        className="dataset-info"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="info-card">
          <h3>Filename</h3>
          <p>{getFileName(dataset.file)}</p>
        </div>
        <div className="info-card">
          <h3>Data Points</h3>
          <p>{dataset.csv_data ? dataset.csv_data.length : 0}{!fullDataLoaded && '+'}</p>
        </div>
        <div className="info-card">
          <h3>Total Predictions</h3>
          <p>{totalPredictions}</p>
        </div>
      </motion.div>

      {/* Data Summary Section */}
      <motion.div
        className="data-summary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <h2>Data Summary</h2>
        <div className="summary-stats">
          <div className="stat-card">
            <h3>Machine Count</h3>
            <p className="stat-value">{dataStats.machineCount || 'N/A'}</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Air Temp</h3>
            <p className="stat-value">{dataStats.avgAirTemperature || 'N/A'} K</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Process Temp</h3>
            <p className="stat-value">{dataStats.avgProcessTemperature || 'N/A'} K</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Tool Wear</h3>
            <p className="stat-value">{dataStats.avgToolWear || 'N/A'} min</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Torque</h3>
            <p className="stat-value">{dataStats.avgTorque || 'N/A'} Nm</p>
          </div>
          <div className="stat-card">
            <h3>Avg. Rotational Speed</h3>
            <p className="stat-value">{dataStats.avgRotationalSpeed || 'N/A'} rpm</p>
          </div>
        </div>
      </motion.div>

      {/* Charts Section */}
      {chartData.pieTypeData && (
        <motion.div
          className="dataset-charts"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2>Data Visualizations</h2>
          
          <div className="chart-grid">
            {/* Type Distribution Pie Chart */}
            <div className="chart-container">
              <h3>Machine Type Distribution</h3>
              <div className="pie-chart">
                <Pie data={chartData.pieTypeData} options={{ responsive: true }} />
              </div>
            </div>
            
            {/* Air Temp vs Process Temp By Type */}
            {chartData.tempByTypeScatterData && (
              <div className="chart-container">
                <h3>Air vs Process Temperature By Type</h3>
                <div className="scatter-chart">
                  <Scatter 
                    data={chartData.tempByTypeScatterData} 
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const point = context.raw;
                              const label = context.dataset.label || '';
                              return `${label}: (Air: ${point.x.toFixed(1)}, Process: ${point.y.toFixed(1)}, Product: ${point.productId})`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Sum of Air Temperature [K]'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Sum of Process Temperature [K]'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}
            
            {/* Process Temp vs Rotational Speed By Type */}
            {chartData.processSpeedByTypeScatterData && (
              <div className="chart-container">
                <h3>Process Temp vs Rotational Speed By Type</h3>
                <div className="scatter-chart">
                  <Scatter 
                    data={chartData.processSpeedByTypeScatterData} 
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const point = context.raw;
                              const label = context.dataset.label || '';
                              return `${label}: (Process: ${point.x.toFixed(1)}, Speed: ${point.y.toFixed(1)}, Product: ${point.productId})`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Sum of Process Temperature [K]'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Sum of Rotational Speed [rpm]'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}
            
            {/* NEW CHART: Speed vs Torque By Type */}
            {chartData.speedTorqueByTypeScatterData && (
              <div className="chart-container">
                <h3>Rotational Speed vs Torque By Type</h3>
                <div className="scatter-chart">
                  <Scatter 
                    data={chartData.speedTorqueByTypeScatterData} 
                    options={{
                      responsive: true,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const point = context.raw;
                              const label = context.dataset.label || '';
                              return `${label}: (Speed: ${point.x.toFixed(1)}, Torque: ${point.y.toFixed(1)}, Product: ${point.productId})`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Sum of Rotational Speed [rpm]'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Sum of Torque [Nm]'
                          }
                        }
                      }
                    }} 
                  />
                </div>
              </div>
            )}
          </div>

          {!fullDataLoaded && (
            <div className="chart-note">
              <p>Note: Visualizations are based on preview data only. For full dataset analysis, please use the AI Recommendations feature.</p>
            </div>
          )}
        </motion.div>
      )}

      <motion.div
        className="dataset-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h2>Data Preview</h2>
        {dataset.csv_data && dataset.csv_data.length > 0 ? (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {Object.keys(dataset.csv_data[0]).map((key) => (
                    <th key={key}>{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dataset.csv_data.slice(0, 10).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((value, valueIndex) => (
                      <td key={valueIndex}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {dataset.csv_data.length > 10 && (
              <div className="table-note">
                Showing 10 of {dataset.csv_data.length} rows
              </div>
            )}
          </div>
        ) : (
          <p>No data available to preview</p>
        )}
      </motion.div>

      <div className="dataset-actions">
        <button
          className="primary-btn"
          onClick={() => navigate(`/predictions?dataset=${dataset.id}`)}
        >
          View Detailed Predictions
        </button>
        
        {user && user.isAuthenticated && (
          <button
            className="secondary-btn"
            onClick={() => navigate(`/recommendations?dataset=${dataset.id}`)}
          >
            View AI Recommendations
          </button>
        )}
      </div>
    </div>
  );
};

export default DatasetDetailsPage;