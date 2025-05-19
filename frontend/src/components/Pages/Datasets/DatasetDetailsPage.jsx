import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import datasetService from '../../../services/datasetService';
import predictionService from '../../../services/predictionService';
import ConfirmationModal from '../../common/ConfirmationModal/ConfirmationModal';
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

// Define common feature patterns with expanded patterns for better matching
const featurePatterns = {
  productId: [
    'product id', 'product_id', 'productid', 'product-id', 'ProductID', 'product', 'prod id', 'prod_id', 
    'prodid', 'prod-id', 'udi', 'sku', 'item id', 'item_id', 'itemid', 'item-id', 'uid',
    'unit id', 'unit_id', 'unitid', 'unit-id', 'machine id', 'machine_id', 'machineid',
    'part id', 'part_id', 'partid', 'part-id', 'equipment id', 'equipment_id', 'equipmentid',
    'serial', 'serial number', 'serialnumber', 'serial_number', 'serial-number'
  ],
  type: [
    'type', 'machine type', 'machine_type', 'machinetype', 'machine', 'model', 'model type', 
    'model_type', 'modeltype', 'category', 'class', 'classification', 'group', 'series',
    'variant', 'version', 'grade', 'tier', 'level'
  ],
  airTemp: [
    'air temp', 'air temperature', 'air_temp', 'airtemp', 'airtemperature', 'air temperature [k]',
    'temperature [k]', 'air k', 'air', 'temp', 'ambient temp', 'ambient temperature', 'ambient_temp',
    'ambienttemp', 'ambienttemperature', 'ambient', 'environment temp', 'environment temperature',
    'environment_temp', 'environmenttemp', 'environmenttemperature', 'external temp', 'external temperature',
    'external_temp', 'externaltemp', 'externaltemperature', 'surrounding temp', 'surrounding temperature',
    'surrounding_temp', 'surroundingtemp', 'surroundingtemperature', 'room temp', 'room temperature',
    'room_temp', 'roomtemp', 'roomtemperature'
  ],
  processTemp: [
    'process temp', 'process temperature', 'process_temp', 'processtemp', 'procestemperature',
    'process temperature [k]', 'process [k]', 'process k', 'process', 'internal temp', 'internal temperature',
    'internal_temp', 'internaltemp', 'internaltemperature', 'core temp', 'core temperature', 'core_temp',
    'coretemp', 'coretemperature', 'operation temp', 'operation temperature', 'operation_temp',
    'operationtemp', 'operationtemperature', 'working temp', 'working temperature', 'working_temp',
    'workingtemp', 'workingtemperature', 'system temp', 'system temperature', 'system_temp', 
    'systemtemp', 'systemtemperature'
  ],
  rotationalSpeed: [
    'rotational speed', 'rotational_speed', 'rotationalspeed', 'rpm', 'rotation', 'speed', 'rotational', 
    'rotational speed [rpm]', 'rotation speed', 'rotation_speed', 'rotationspeed', 'spin rate', 'spin_rate', 
    'spinrate', 'angular speed', 'angular_speed', 'angularspeed', 'rev per min', 'rev_per_min', 'revpermin',
    'revolutions per minute', 'revolutions_per_minute', 'revolutionsperminute', 'motor speed', 
    'motor_speed', 'motorspeed', 'shaft speed', 'shaft_speed', 'shaftspeed'
  ],
  torque: [
    'torque', 'nm', 'torque [nm]', 'torque nm', 'motor torque', 'motor_torque', 'motortorque',
    'shaft torque', 'shaft_torque', 'shafttorque', 'rotational force', 'rotational_force', 'rotationalforce',
    'turning force', 'turning_force', 'turningforce', 'moment', 'moment of force', 'moment_of_force',
    'momentofforce', 'twist', 'twist force', 'twist_force', 'twistforce'
  ],
  toolWear: [
    'tool wear', 'tool_wear', 'toolwear', 'tool', 'tool wear [min]', 'min', 'tool [min]', 'wear [min]', 'wear',
    'usage time', 'usage_time', 'usagetime', 'tool age', 'tool_age', 'toolage', 'tool usage', 'tool_usage',
    'toolusage', 'tool life', 'tool_life', 'toollife', 'wear time', 'wear_time', 'weartime', 
    'operation time', 'operation_time', 'operationtime', 'runtime', 'run time', 'run_time'
  ]
};

// Helper function to normalize a string for matching with enhanced unit and special character handling
const normalizeForMatch = (str) => {
  if (typeof str !== 'string') {
    return '';
  }
  
  return str.toLowerCase()
    // Handle common units in brackets
    .replace(/\s*\[\s*k\s*\]\s*/g, ' kelvin ')
    .replace(/\s*\[\s*c\s*\]\s*/g, ' celsius ')
    .replace(/\s*\[\s*f\s*\]\s*/g, ' fahrenheit ')
    .replace(/\s*\[\s*nm\s*\]\s*/g, ' newtonmeter ')
    .replace(/\s*\[\s*rpm\s*\]\s*/g, ' rpm ')
    .replace(/\s*\[\s*min\s*\]\s*/g, ' minutes ')
    .replace(/\s*\[\s*s(ec)?\s*\]\s*/g, ' seconds ')
    .replace(/\s*\[\s*h(r|our)?\s*\]\s*/g, ' hours ')
    .replace(/\s*\[\s*m(eter)?\s*\]\s*/g, ' meter ')
    .replace(/\s*\[\s*mm\s*\]\s*/g, ' millimeter ')
    .replace(/\s*\[\s*%\s*\]\s*/g, ' percent ')
    // Remove all brackets and parentheses
    .replace(/[[\](){}]/g, '')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Replace hyphens with spaces
    .replace(/-/g, ' ')
    // Replace dots with spaces
    .replace(/\./g, ' ')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ')
    // Remove all remaining special characters
    .replace(/[^a-z0-9\s]/g, '')
    // Trim spaces
    .trim();
};

// Helper function to find value by pattern matching in column names
const findValueByPattern = (row, patterns) => {
  const normalizedPatterns = patterns.map(p => normalizeForMatch(p));
  let bestMatch = null;
  let bestScore = 0;
  
  // First pass - look for exact pattern matches
  for (const key in row) {
    if (key === 'id' && patterns !== featurePatterns.productId) continue; // Skip id key unless looking for product IDs
    
    const normalizedKey = normalizeForMatch(key);
    
    // Check if this column matches any of our patterns
    for (let i = 0; i < normalizedPatterns.length; i++) {
      const pattern = normalizedPatterns[i];
      if (normalizedKey.includes(pattern) || pattern.includes(normalizedKey)) {
        const matchScore = pattern.length; // Longer pattern matches are better
        
        // If value is a valid number and match score is better than previous best
        const value = parseFloat(row[key]);
        if (!isNaN(value) && matchScore > bestScore) {
          bestMatch = value;
          bestScore = matchScore;
        }
      }
    }
  }
  
  if (bestMatch !== null) {
    return bestMatch;
  }
  
  // Second pass with looser matching - try to find any numeric value with a remotely similar name
  for (const key in row) {
    if (key === 'id' && patterns !== featurePatterns.productId) continue; // Skip id key unless looking for product IDs
    
    const normalizedKey = normalizeForMatch(key);
    
    // For looser matching, check if any part of the pattern matches the key
    const hasPatternMatch = normalizedPatterns.some(pattern => {
      // Split pattern into words and check if any significant word is in the key
      const patternWords = pattern.split(' ').filter(word => word.length > 1);
      return patternWords.some(word => normalizedKey.includes(word));
    });
    
    if (hasPatternMatch) {
      const value = parseFloat(row[key]);
      if (!isNaN(value)) return value;
    }
  }
  
  // Third pass - check all columns for numeric values when no good match found
  // This is helpful for datasets with completely different naming conventions
  if (patterns === featurePatterns.airTemp || patterns === featurePatterns.processTemp || 
      patterns === featurePatterns.rotationalSpeed || patterns === featurePatterns.torque || 
      patterns === featurePatterns.toolWear) {
    
    // Check all numeric columns for potential matches based on value ranges
    const numericColumns = [];
    for (const key in row) {
      const value = parseFloat(row[key]);
      if (!isNaN(value)) {
        numericColumns.push({ key, value });
      }
    }
    
    // Apply heuristics based on expected value ranges for each feature type
    if (patterns === featurePatterns.airTemp) {
      // Air temperatures are typically between 273-323 K (0-50°C)
      const airTempCandidate = numericColumns.find(col => col.value >= 270 && col.value <= 330);
      if (airTempCandidate) return airTempCandidate.value;
    } else if (patterns === featurePatterns.processTemp) {
      // Process temperatures are typically higher than air temp, around 300-450 K
      const processTempCandidate = numericColumns.find(col => col.value >= 300 && col.value <= 450);
      if (processTempCandidate) return processTempCandidate.value;
    } else if (patterns === featurePatterns.rotationalSpeed) {
      // Rotational speeds are typically in the hundreds or thousands
      const speedCandidate = numericColumns.find(col => col.value >= 500 && col.value <= 3000);
      if (speedCandidate) return speedCandidate.value;
    } else if (patterns === featurePatterns.torque) {
      // Torque values are typically between 10-80 Nm
      const torqueCandidate = numericColumns.find(col => col.value >= 10 && col.value <= 80);
      if (torqueCandidate) return torqueCandidate.value;
    } else if (patterns === featurePatterns.toolWear) {
      // Tool wear is typically measured in minutes, usually 0-250
      const wearCandidate = numericColumns.find(col => col.value >= 0 && col.value <= 250);
      if (wearCandidate) return wearCandidate.value;
    }
  }
  
  return null;
};

// Helper function to find string value by pattern matching in column names
const findStringValueByPattern = (row, patterns) => {
  const normalizedPatterns = patterns.map(p => normalizeForMatch(p));
  let bestMatch = '';
  let bestScore = 0;
  
  // Special handling for productId - it's often a critical identifier
  if (patterns === featurePatterns.productId) {
    // First check if we have an "id" field that looks like a product ID
    if (row.id !== undefined && row.id !== null && row.id !== '') {
      // If id appears to be non-numeric or has a prefix/format, likely a product ID
      const idValue = String(row.id);
      if (isNaN(parseInt(idValue)) || idValue.match(/^[a-zA-Z][0-9]+/) || idValue.includes('-')) {
        return idValue;
      }
    }
    
    // Look for fields that have "product" or "id" or similar patterns
    for (const key in row) {
      const normalizedKey = normalizeForMatch(key);
      
      // Higher priority exact matches for product ID
      if (normalizedKey.includes('productid') || 
          normalizedKey.includes('product id') || 
          normalizedKey.includes('udi') || 
          normalizedKey.includes('serialnumber') ||
          normalizedKey.includes('machine id')) {
        return row[key];
      }
    }
  }
  
  // First pass - look for exact pattern matches
  for (const key in row) {
    if (key === 'id' && patterns !== featurePatterns.productId) continue; // Skip id key unless specifically looking for product IDs
    
    const normalizedKey = normalizeForMatch(key);
    
    // Check if this column matches any of our patterns
    for (let i = 0; i < normalizedPatterns.length; i++) {
      const pattern = normalizedPatterns[i];
      if (normalizedKey.includes(pattern) || pattern.includes(normalizedKey)) {
        const matchScore = pattern.length; // Longer pattern matches are better
        
        if (matchScore > bestScore) {
          bestMatch = row[key];
          bestScore = matchScore;
        }
      }
    }
  }
  
  if (bestMatch !== '') {
    return bestMatch;
  }
  
  // Looser matching if no match was found
  for (const key in row) {
    if (key === 'id' && patterns !== featurePatterns.productId) continue;
    
    const normalizedKey = normalizeForMatch(key);
    
    // For looser matching, check if any part of the pattern matches the key
    const hasPatternMatch = normalizedPatterns.some(pattern => {
      for (const part of pattern.split(' ')) {
        if (part.length > 1 && normalizedKey.includes(normalizeForMatch(part))) return true; // Only match meaningful parts
      }
      return false;
    });
    
    if (hasPatternMatch) {
      return row[key];
    }
  }
  
  // If we're looking for a type and none was found, try to determine type from other fields
  if (patterns === featurePatterns.type && bestMatch === '') {
    // Check if any column has values like 'H', 'M', 'L' which are common machine types
    for (const key in row) {
      const value = String(row[key]).trim();
      if (['H', 'M', 'L', 'HIGH', 'MEDIUM', 'LOW'].includes(value.toUpperCase())) {
        return value;
      }
    }
  }
  
  return '';
};

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Prepare chart data from preview data
  const prepareChartDataFromPreview = useCallback((csvData) => {
    if (!csvData || !csvData.length) return;
    
    try {
      // Group data by type and count using flexible matching
      const typeCountMap = {};
      csvData.forEach(row => {
        const type = findStringValueByPattern(row, featurePatterns.type) || 'Unknown';
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
        // Use pattern matching to find values regardless of naming conventions
        const productId = findStringValueByPattern(row, featurePatterns.productId);
        const type = findStringValueByPattern(row, featurePatterns.type);
        
        // Find feature values using the pattern matching helper
        const airTemp = findValueByPattern(row, featurePatterns.airTemp);
        const processTemp = findValueByPattern(row, featurePatterns.processTemp);
        const rotationalSpeed = findValueByPattern(row, featurePatterns.rotationalSpeed);
        const torque = findValueByPattern(row, featurePatterns.torque);
        
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
  }, []);

  const calculateDataStats = useCallback((csvData) => {
    if (!csvData || !csvData.length) return;
    
    // Get unique product IDs and types using pattern matching
    const productIds = [...new Set(csvData.map(row => findStringValueByPattern(row, featurePatterns.productId)))].filter(Boolean);
    console.log('Product IDs:', productIds.length);
    const types = [...new Set(csvData.map(row => findStringValueByPattern(row, featurePatterns.type)))].filter(Boolean);

    // Collect all numeric values per feature for advanced statistics
    const allNumericValues = {
      airTemp: [],
      processTemp: [],
      torque: [],
      toolWear: [],
      rotationalSpeed: []
    };
    
    // First pass - collect all numeric values from rows 
    csvData.forEach(row => {
      // Try different naming patterns for each feature, using our predefined patterns
      const airTemp = findValueByPattern(row, featurePatterns.airTemp);
      console.log('airTemp', airTemp);
      const processTemp = findValueByPattern(row, featurePatterns.processTemp);
      const torque = findValueByPattern(row, featurePatterns.torque);
      const toolWear = findValueByPattern(row, featurePatterns.toolWear);
      const rotationalSpeed = findValueByPattern(row, featurePatterns.rotationalSpeed);
      
      if (airTemp !== null) { 
        allNumericValues.airTemp.push(airTemp);
      }
      if (processTemp !== null) {  
        allNumericValues.processTemp.push(processTemp);
      }
      if (torque !== null) {  
        allNumericValues.torque.push(torque);
      }
      if (toolWear !== null) { 
        allNumericValues.toolWear.push(toolWear);
      }
      if (rotationalSpeed !== null) { 
        allNumericValues.rotationalSpeed.push(rotationalSpeed);
      }
    });
    
    // Helper function to get average from an array of values
    const getAverage = (values) => {
      if (!values.length) return 'N/A';
      const sum = values.reduce((total, val) => total + val, 0);
      return (sum / values.length).toFixed(2);
    };
    
    // Helper function to infer values based on expected ranges when no direct match is found
    const inferValuesFromRanges = (csvData) => {
      // Create arrays to hold inferred values
      const inferredValues = {
        airTemp: [],
        processTemp: [],
        torque: [],
        toolWear: [],
        rotationalSpeed: []
      };
      
      // If we have data but couldn't find values using pattern matching
      // Look for columns with values in expected ranges
      if (allNumericValues.airTemp.length === 0 || 
          allNumericValues.processTemp.length === 0 ||
          allNumericValues.torque.length === 0 ||
          allNumericValues.rotationalSpeed.length === 0) {
        
        // For each row, check all columns for values that might match our expected feature ranges
        csvData.forEach(row => {
          const numericColumns = {};
          
          // Extract all numeric values from this row
          Object.entries(row).forEach(([colKey, value]) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              numericColumns[colKey] = numValue;
            }
          });
          
          // Try to infer which column is which feature based on typical value ranges
          Object.values(numericColumns).forEach(value => {
            // Air temperature (typically 270-330K)
            if (value >= 270 && value <= 330 && allNumericValues.airTemp.length === 0) {
              inferredValues.airTemp.push(value);
            }
            // Process temperature (typically 300-450K)
            else if (value >= 300 && value <= 450 && allNumericValues.processTemp.length === 0) {
              inferredValues.processTemp.push(value);
            }
            // Torque (typically 10-80 Nm)
            else if (value >= 10 && value <= 80 && allNumericValues.torque.length === 0) {
              inferredValues.torque.push(value);
            }
            // Rotational speed (typically 500-3000 rpm)
            else if (value >= 500 && value <= 3000 && allNumericValues.rotationalSpeed.length === 0) {
              inferredValues.rotationalSpeed.push(value);
            }
            // Tool wear (typically 0-250 min)
            else if (value >= 0 && value <= 250 && allNumericValues.toolWear.length === 0) {
              inferredValues.toolWear.push(value);
            }
          });
        });
      }
      
      return inferredValues;
    };
    
    // Use inferred values when no direct matches found
    const inferredValues = inferValuesFromRanges(csvData);
    
    // Combine direct matches with inferred values
    const finalValues = {
      airTemp: allNumericValues.airTemp.length > 0 ? allNumericValues.airTemp : inferredValues.airTemp,
      processTemp: allNumericValues.processTemp.length > 0 ? allNumericValues.processTemp : inferredValues.processTemp,
      torque: allNumericValues.torque.length > 0 ? allNumericValues.torque : inferredValues.torque,
      toolWear: allNumericValues.toolWear.length > 0 ? allNumericValues.toolWear : inferredValues.toolWear,
      rotationalSpeed: allNumericValues.rotationalSpeed.length > 0 ? allNumericValues.rotationalSpeed : inferredValues.rotationalSpeed
    };
    
    const stats = {
      machineCount: productIds.length || finalValues.airTemp.length || types.length ||   1, // Default to at least 1 machine
      typeCount: types.length || 1, // Default to at least 1 type
      avgAirTemperature: getAverage(finalValues.airTemp),
      avgProcessTemperature: getAverage(finalValues.processTemp),
      avgTorque: getAverage(finalValues.torque),
      avgToolWear: getAverage(finalValues.toolWear),
      avgRotationalSpeed: getAverage(finalValues.rotationalSpeed),
    };
    
    // Add unit abbreviations for display purposes if needed
    const displayStats = {
      ...stats,
      // Remove "N/A" from these since we'll add units for display
      avgAirTemperature: stats.avgAirTemperature === 'N/A' ? '0' : stats.avgAirTemperature,
      avgProcessTemperature: stats.avgProcessTemperature === 'N/A' ? '0' : stats.avgProcessTemperature,
      avgTorque: stats.avgTorque === 'N/A' ? '0' : stats.avgTorque,
      avgToolWear: stats.avgToolWear === 'N/A' ? '0' : stats.avgToolWear,
      avgRotationalSpeed: stats.avgRotationalSpeed === 'N/A' ? '0' : stats.avgRotationalSpeed,
    };
    
    setDataStats(displayStats);
    
    // Prepare chart data based on preview data
    prepareChartDataFromPreview(csvData);
  }, [prepareChartDataFromPreview]);

  // Function to prepare chart data from full dataset stats
const prepareChartData = useCallback((statsData, csvData) => {
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
      if (!hasAirProcessTempByType && !hasProcessSpeedByType && !hasSpeedTorqueByType && csvData && csvData.length > 0) {
        // Fall back to generating chart data from preview data
        // This is a simplified version of prepareChartDataFromPreview logic to avoid circular dependencies
        try {
          // Generate charts directly from the provided CSV data instead of using the function reference
          // This breaks the circular dependency chain
          const typeCountMap = {};
          const scatterDataTemp = [];
          const scatterDataSpeed = [];
          
          // Process the CSV data
          csvData.forEach(row => {
            const type = findStringValueByPattern(row, featurePatterns.type) || 'Unknown';
            if (!typeCountMap[type]) typeCountMap[type] = 0;
            typeCountMap[type]++;
            
            const airTemp = findValueByPattern(row, featurePatterns.airTemp);
            const processTemp = findValueByPattern(row, featurePatterns.processTemp);
            const rotationalSpeed = findValueByPattern(row, featurePatterns.rotationalSpeed);
            const torque = findValueByPattern(row, featurePatterns.torque);
            
            if (!isNaN(airTemp) && !isNaN(processTemp)) {
              scatterDataTemp.push({ x: airTemp, y: processTemp });
            }
            
            if (!isNaN(rotationalSpeed) && !isNaN(torque)) {
              scatterDataSpeed.push({ x: rotationalSpeed, y: torque });
            }
          });
          
          // Add the basic charts to the final chart data
          if (scatterDataTemp.length > 0) {
            finalChartData.scatterTempData = {
              datasets: [{
                label: 'Air vs Process Temperature',
                data: scatterDataTemp,
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
              }]
            };
          }
          
          if (scatterDataSpeed.length > 0) {
            finalChartData.scatterSpeedData = {
              datasets: [{
                label: 'Rotational Speed vs Torque',
                data: scatterDataSpeed,
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
              }]
            };
          }
          
          // Update the chart data
          setChartData(finalChartData);
        } catch (previewErr) {
          console.error('Error processing preview data for charts:', previewErr);
        }
      }
      
    } catch (err) {
      console.error('Error preparing chart data from stats:', err);
      // If there's an error in processing, try to generate basic charts from CSV data
      if (csvData && csvData.length > 0) {
        // Generate basic charts directly without calling the other function
        try {
          const typeCountMap = {};
          csvData.forEach(row => {
            const type = findStringValueByPattern(row, featurePatterns.type) || 'Unknown';
            if (!typeCountMap[type]) typeCountMap[type] = 0;
            typeCountMap[type]++;
          });
          
          const pieData = {
            labels: Object.keys(typeCountMap),
            datasets: [{
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
            }]
          };
          
          setChartData({pieTypeData: pieData});
        } catch (fallbackErr) {
          console.error('Error in fallback chart generation:', fallbackErr);
        }
      }
    }
  }, []);

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
            
            // Prepare chart data based on full dataset stats, passing the CSV data as fallback
            prepareChartData(statsData, datasetData.csv_data);
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
  }, [id, calculateDataStats, prepareChartData]);
  
  // Prepare chart data from preview data
  // const prepareChartDataFromPreview = useCallback((csvData) => {
  //   if (!csvData || !csvData.length) return;
    
  //   try {
  //     // Group data by type and count using flexible matching
  //     const typeCountMap = {};
  //     csvData.forEach(row => {
  //       const type = findStringValueByPattern(row, featurePatterns.type) || 'Unknown';
  //       if (!typeCountMap[type]) typeCountMap[type] = 0;
  //       typeCountMap[type]++;
  //     });
      
  //     // Prepare pie chart data for types
  //     const pieData = {
  //       labels: Object.keys(typeCountMap),
  //       datasets: [
  //         {
  //           data: Object.values(typeCountMap),
  //           backgroundColor: [
  //             'rgba(255, 99, 132, 0.6)',
  //             'rgba(54, 162, 235, 0.6)',
  //             'rgba(255, 206, 86, 0.6)',
  //             'rgba(75, 192, 192, 0.6)',
  //             'rgba(153, 102, 255, 0.6)',
  //           ],
  //           borderColor: [
  //             'rgba(255, 99, 132, 1)',
  //             'rgba(54, 162, 235, 1)',
  //             'rgba(255, 206, 86, 1)',
  //             'rgba(75, 192, 192, 1)',
  //             'rgba(153, 102, 255, 1)',
  //           ],
  //           borderWidth: 1,
  //         }
  //       ]
  //     };
      
  //     // Create simple scatter data for temperature and speed
  //     const scatterDataTemp = [];
  //     const scatterDataSpeed = [];
      
  //     // Also create scatter data by type
  //     const scatterDataTempByType = {
  //       H: [], // High type
  //       M: [], // Medium type
  //       L: []  // Low type
  //     };
      
  //     const scatterDataProcessSpeedByType = {
  //       H: [], // High type
  //       M: [], // Medium type
  //       L: []  // Low type
  //     };
      
  //     // Group data by product ID and type to create aggregated stats
  //     const productTypeSums = {};
      
  //     csvData.forEach(row => {
  //       // Use pattern matching to find values regardless of naming conventions
  //       const productId = findStringValueByPattern(row, featurePatterns.productId);
  //       const type = findStringValueByPattern(row, featurePatterns.type);
        
  //       // Find feature values using the pattern matching helper
  //       const airTemp = findValueByPattern(row, featurePatterns.airTemp);
  //       const processTemp = findValueByPattern(row, featurePatterns.processTemp);
  //       const rotationalSpeed = findValueByPattern(row, featurePatterns.rotationalSpeed);
  //       const torque = findValueByPattern(row, featurePatterns.torque);
        
  //       // Basic scatter plots
  //       if (!isNaN(airTemp) && !isNaN(processTemp)) {
  //         scatterDataTemp.push({
  //           x: airTemp,
  //           y: processTemp,
  //         });
  //       }
        
  //       if (!isNaN(rotationalSpeed) && !isNaN(torque)) {
  //         scatterDataSpeed.push({
  //           x: rotationalSpeed,
  //           y: torque,
  //         });
  //       }
        
  //       // Aggregated data by product and type
  //       if (productId && type && !isNaN(airTemp) && !isNaN(processTemp) && !isNaN(rotationalSpeed)) {
  //         if (!productTypeSums[`${productId}-${type}`]) {
  //           productTypeSums[`${productId}-${type}`] = {
  //             productId,
  //             type,
  //             airTempSum: 0,
  //             processTempSum: 0,
  //             rotationalSpeedSum: 0
  //           };
  //         }
          
  //         productTypeSums[`${productId}-${type}`].airTempSum += airTemp;
  //         productTypeSums[`${productId}-${type}`].processTempSum += processTemp;
  //         productTypeSums[`${productId}-${type}`].rotationalSpeedSum += rotationalSpeed;
  //       }
  //     });
      
  //     // Create scatter data from aggregated product-type sums
  //     Object.values(productTypeSums).forEach(item => {
  //       const { type, productId, airTempSum, processTempSum, rotationalSpeedSum } = item;
        
  //       if (scatterDataTempByType[type]) {
  //         scatterDataTempByType[type].push({
  //           x: airTempSum,
  //           y: processTempSum,
  //           productId
  //         });
  //       }
        
  //       if (scatterDataProcessSpeedByType[type]) {
  //         scatterDataProcessSpeedByType[type].push({
  //           x: processTempSum,
  //           y: rotationalSpeedSum,
  //           productId
  //         });
  //       }
  //     });
      
  //     // Create dataset objects
  //     const scatterTempData = {
  //       datasets: [{
  //         label: 'Air vs Process Temperature',
  //         data: scatterDataTemp,
  //         backgroundColor: 'rgba(255, 99, 132, 0.6)'
  //       }]
  //     };
      
  //     const scatterSpeedData = {
  //       datasets: [{
  //         label: 'Rotational Speed vs Torque',
  //         data: scatterDataSpeed,
  //         backgroundColor: 'rgba(54, 162, 235, 0.6)'
  //       }]
  //     };
      
  //     // Create final chart data object
  //     const finalChartData = {
  //       pieTypeData: pieData,
  //       scatterTempData: scatterTempData,
  //       scatterSpeedData: scatterSpeedData
  //     };
      
  //     // Add type-based scatter datasets if they have data
  //     const tempByTypeDatasets = [];
  //     const processSpeedByTypeDatasets = [];
      
  //     ['H', 'M', 'L'].forEach((type, index) => {
  //       const colors = [
  //         'rgba(255, 99, 132, 0.6)', 
  //         'rgba(54, 162, 235, 0.6)', 
  //         'rgba(255, 206, 86, 0.6)'
  //       ];
        
  //       if (scatterDataTempByType[type] && scatterDataTempByType[type].length > 0) {
  //         tempByTypeDatasets.push({
  //           label: `${type} Type`,
  //           data: scatterDataTempByType[type],
  //           backgroundColor: colors[index]
  //         });
  //       }
        
  //       if (scatterDataProcessSpeedByType[type] && scatterDataProcessSpeedByType[type].length > 0) {
  //         processSpeedByTypeDatasets.push({
  //           label: `${type} Type`,
  //           data: scatterDataProcessSpeedByType[type],
  //           backgroundColor: colors[index]
  //         });
  //       }
  //     });
      
  //     if (tempByTypeDatasets.length > 0) {
  //       finalChartData.tempByTypeScatterData = {
  //         datasets: tempByTypeDatasets
  //       };
  //     }
      
  //     if (processSpeedByTypeDatasets.length > 0) {
  //       finalChartData.processSpeedByTypeScatterData = {
  //         datasets: processSpeedByTypeDatasets
  //       };
  //     }
      
  //     setChartData(finalChartData);
      
  //   } catch (err) {
  //     console.error('Error preparing chart data:', err);
  //   }
  // }, []);
  
  // Prepare chart data from full dataset stats
  // const prepareChartData = (statsData) => {
  //   if (!statsData) return;
    
  //   try {
  //     // Create charts from full dataset stats
  //     const { 
  //       type_counts, 
  //       speed_torque_by_product_type, 
  //       temp_by_product_type, 
  //       process_speed_by_product_type 
  //     } = statsData;
      
  //     // Pie chart for types
  //     const pieData = {
  //       labels: Object.keys(type_counts || {}),
  //       datasets: [
  //         {
  //           data: Object.values(type_counts || {}),
  //           backgroundColor: [
  //             'rgba(255, 99, 132, 0.6)',
  //             'rgba(54, 162, 235, 0.6)',
  //             'rgba(255, 206, 86, 0.6)',
  //             'rgba(75, 192, 192, 0.6)',
  //             'rgba(153, 102, 255, 0.6)',
  //           ],
  //           borderColor: [
  //             'rgba(255, 99, 132, 1)',
  //             'rgba(54, 162, 235, 1)',
  //             'rgba(255, 206, 86, 1)',
  //             'rgba(75, 192, 192, 1)',
  //             'rgba(153, 102, 255, 1)',
  //           ],
  //           borderWidth: 1,
  //         }
  //       ]
  //     };
      
  //     // Create scatter data for speed vs torque by type
  //     const scatterDataSpeedTorqueByType = {
  //       H: [], // High type
  //       M: [], // Medium type
  //       L: []  // Low type
  //     };
      
  //     // Process the speed_torque_by_product_type data
  //     if (speed_torque_by_product_type && Array.isArray(speed_torque_by_product_type)) {
  //       speed_torque_by_product_type.forEach(item => {
  //         const speedSum = item.rotational_speed_sum;
  //         const torqueSum = item.torque_sum;
  //         const type = item.type;
          
  //         if (speedSum && torqueSum && type && scatterDataSpeedTorqueByType[type] !== undefined) {
  //           scatterDataSpeedTorqueByType[type].push({
  //             x: parseFloat(speedSum),
  //             y: parseFloat(torqueSum),
  //             productId: item.product_id
  //           });
  //         }
  //       });
  //     }
      
  //     // Create scatter data for air temp vs process temp by product type
  //     const scatterDataTempByType = {
  //       H: [], // High type
  //       M: [], // Medium type
  //       L: []  // Low type
  //     };
      
  //     // Process the temp_by_product_type data
  //     if (temp_by_product_type && Array.isArray(temp_by_product_type)) {
  //       temp_by_product_type.forEach(item => {
  //         const airTempSum = item.air_temp_sum;
  //         const processTempSum = item.process_temp_sum;
  //         const type = item.type;
          
  //         if (airTempSum && processTempSum && type && scatterDataTempByType[type] !== undefined) {
  //           scatterDataTempByType[type].push({
  //             x: parseFloat(airTempSum),
  //             y: parseFloat(processTempSum),
  //             productId: item.product_id
  //           });
  //         }
  //       });
  //     }
      
  //     // Create scatter data for process temp vs rotational speed by product type
  //     const scatterDataProcessSpeedByType = {
  //       H: [], // High type
  //       M: [], // Medium type
  //       L: []  // Low type
  //     };
      
  //     // Process the process_speed_by_product_type data
  //     if (process_speed_by_product_type && Array.isArray(process_speed_by_product_type)) {
  //       process_speed_by_product_type.forEach(item => {
  //         const processTempSum = item.process_temp_sum;
  //         const rotationalSpeedSum = item.rotational_speed_sum;
  //         const type = item.type;
          
  //         if (processTempSum && rotationalSpeedSum && type && scatterDataProcessSpeedByType[type] !== undefined) {
  //           scatterDataProcessSpeedByType[type].push({
  //             x: parseFloat(processTempSum),
  //             y: parseFloat(rotationalSpeedSum),
  //             productId: item.product_id
  //           });
  //         }
  //       });
  //     }
      
  //     // Create the chart data object - Start with just pie chart
  //     const finalChartData = {
  //       pieTypeData: pieData
  //     };
      
  //     // Add the scatter plots by type
  //     const hasAirProcessTempByType = 
  //       scatterDataTempByType.H.length > 0 || 
  //       scatterDataTempByType.M.length > 0 || 
  //       scatterDataTempByType.L.length > 0;
        
  //     if (hasAirProcessTempByType) {
  //       const tempByTypeDatasets = [];
        
  //       if (scatterDataTempByType.H.length > 0) {
  //         tempByTypeDatasets.push({
  //           label: 'H Type',
  //           data: scatterDataTempByType.H,
  //           backgroundColor: 'rgba(255, 99, 132, 0.6)',
  //         });
  //       }
        
  //       if (scatterDataTempByType.M.length > 0) {
  //         tempByTypeDatasets.push({
  //           label: 'M Type',
  //           data: scatterDataTempByType.M,
  //           backgroundColor: 'rgba(54, 162, 235, 0.6)',
  //         });
  //       }
        
  //       if (scatterDataTempByType.L.length > 0) {
  //         tempByTypeDatasets.push({
  //           label: 'L Type',
  //           data: scatterDataTempByType.L,
  //           backgroundColor: 'rgba(255, 206, 86, 0.6)',
  //         });
  //       }
        
  //       finalChartData.tempByTypeScatterData = {
  //         datasets: tempByTypeDatasets
  //       };
  //     }
      
  //     const hasProcessSpeedByType = 
  //       scatterDataProcessSpeedByType.H.length > 0 || 
  //       scatterDataProcessSpeedByType.M.length > 0 || 
  //       scatterDataProcessSpeedByType.L.length > 0;
        
  //     if (hasProcessSpeedByType) {
  //       const processSpeedByTypeDatasets = [];
        
  //       if (scatterDataProcessSpeedByType.H.length > 0) {
  //         processSpeedByTypeDatasets.push({
  //           label: 'H Type',
  //           data: scatterDataProcessSpeedByType.H,
  //           backgroundColor: 'rgba(255, 99, 132, 0.6)',
  //         });
  //       }
        
  //       if (scatterDataProcessSpeedByType.M.length > 0) {
  //         processSpeedByTypeDatasets.push({
  //           label: 'M Type',
  //           data: scatterDataProcessSpeedByType.M,
  //           backgroundColor: 'rgba(54, 162, 235, 0.6)',
  //         });
  //       }
        
  //       if (scatterDataProcessSpeedByType.L.length > 0) {
  //         processSpeedByTypeDatasets.push({
  //           label: 'L Type',
  //           data: scatterDataProcessSpeedByType.L,
  //           backgroundColor: 'rgba(255, 206, 86, 0.6)',
  //         });
  //       }
        
  //       finalChartData.processSpeedByTypeScatterData = {
  //         datasets: processSpeedByTypeDatasets
  //       };
  //     }
      
  //     // Add speed vs torque by type chart
  //     const hasSpeedTorqueByType = 
  //       scatterDataSpeedTorqueByType.H.length > 0 || 
  //       scatterDataSpeedTorqueByType.M.length > 0 || 
  //       scatterDataSpeedTorqueByType.L.length > 0;
        
  //     if (hasSpeedTorqueByType) {
  //       const speedTorqueByTypeDatasets = [];
        
  //       if (scatterDataSpeedTorqueByType.H.length > 0) {
  //         speedTorqueByTypeDatasets.push({
  //           label: 'H Type',
  //           data: scatterDataSpeedTorqueByType.H,
  //           backgroundColor: 'rgba(255, 99, 132, 0.6)',
  //         });
  //       }
        
  //       if (scatterDataSpeedTorqueByType.M.length > 0) {
  //         speedTorqueByTypeDatasets.push({
  //           label: 'M Type',
  //           data: scatterDataSpeedTorqueByType.M,
  //           backgroundColor: 'rgba(54, 162, 235, 0.6)',
  //         });
  //       }
        
  //       if (scatterDataSpeedTorqueByType.L.length > 0) {
  //         speedTorqueByTypeDatasets.push({
  //           label: 'L Type',
  //           data: scatterDataSpeedTorqueByType.L,
  //           backgroundColor: 'rgba(255, 206, 86, 0.6)',
  //         });
  //       }
        
  //       finalChartData.speedTorqueByTypeScatterData = {
  //         datasets: speedTorqueByTypeDatasets
  //       };
  //     }
      
  //     // Set the chart data
  //     setChartData(finalChartData);
      
  //     // If we didn't get any scatter plot data, fall back to preview data
  //     if (!hasAirProcessTempByType && !hasProcessSpeedByType && !hasSpeedTorqueByType) {
  //       // Fall back to preview data to get scatter plots
  //       if (dataset && dataset.csv_data) {
  //         prepareChartDataFromPreview(dataset.csv_data);
  //       }
  //     }
      
  //   } catch (err) {
  //     console.error('Error preparing chart data from stats:', err);
  //     // Fall back to preview data
  //     if (dataset && dataset.csv_data) {
  //       prepareChartDataFromPreview(dataset.csv_data);
  //     }
  //   }
  // };
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const getFileName = (fileUrl) => {
    if (!fileUrl) return 'Unknown File';
    const parts = fileUrl.split('/');
    return parts[parts.length - 1];
  };
  
  const handleDeleteDataset = async () => {
    try {
      setIsDeleting(true);
      await datasetService.deleteDataset(dataset.id);
      navigate('/datasets', { state: { message: 'Dataset successfully deleted' } });
    } catch (err) {
      console.error('Error deleting dataset:', err);
      setError('Failed to delete dataset. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
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
      <div
        className="dataset-details-header"
      >
        <div className="header-content">
          <h1>Dataset #{dataset.id}</h1>
          <p>Uploaded on {formatDate(dataset.uploaded_at)}</p>
        </div>
        <div className="header-actions">
          <button className="primary-btn" onClick={() => navigate('/datasets')}>
            Back to Datasets
          </button>
          <button className="delete-btn" onClick={() => setShowDeleteModal(true)}>
            Delete Dataset
          </button>
        </div>
      </div>

      <motion.div
        className="dataset-info"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          <h3>Status</h3>
          <p className={`status-${dataset.status || 'uploaded'}`}>
            {dataset.status === 'error' ? 'Error' : 
             dataset.status === 'processing' ? 'Processing' :
             dataset.status === 'processed' ? 'Completed' : 'Uploaded'}
          </p>
        </div>
        <div className="info-card">
          <h3>Total Predictions</h3>
          <p>{totalPredictions}</p>
        </div>
      </motion.div>

      {/* Display error message if there is one */}
      {dataset.error_message && (
        <motion.div
          className="error-message-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="error-message">
            <h3>Error Processing Dataset</h3>
            <p>{dataset.error_message}</p>
          </div>
        </motion.div>
      )}

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
      
      {/* Delete confirmation modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteDataset}
        title="Delete Dataset"
        message={`Are you sure you want to delete dataset #${id}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        isDanger={true}
      />
    </div>
  );
};

export default DatasetDetailsPage;