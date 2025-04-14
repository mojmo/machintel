import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider } from './contexts/AuthContext';

// Layout Component
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/routing/ProtectedRoute';

// Pages
import LandingPage from './components/Pages/LandingPage/LandingPage';
import LoginPage from './components/Pages/Auth/LoginPage';
import RegisterPage from './components/Pages/Auth/RegisterPage';
import DatasetsPage from './components/Pages/Datasets/DatasetsPage';
import DatasetDetailsPage from './components/Pages/Datasets/DatasetDetailsPage';
import UploadDatasetPage from './components/Pages/Datasets/UploadDatasetPage';
import PredictionsPage from './components/Pages/Predictions/PredictionsPage';
import PredictionDetailsPage from './components/Pages/Predictions/PredictionDetailsPage';
import InsightsPage from './components/Pages/Insights/InsightsPage';
import NotFoundPage from './components/Pages/NotFoundPage/NotFoundPage';

// Styles
import './App.css';

function App() {
  return (
    <MantineProvider theme={{
      colors: {
        brand: ['#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100', '#DD2C00', '#BF360C'],
      },
      primaryColor: 'brand',
    }}>
      <Notifications />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes outside the layout */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Routes using the Layout component */}
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              
              {/* Protected routes - accessible to both registered users and guests */}
              <Route path="/datasets" element={
                <ProtectedRoute>
                  <DatasetsPage />
                </ProtectedRoute>
              } />
              <Route path="/datasets/:id" element={
                <ProtectedRoute>
                  <DatasetDetailsPage />
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute>
                  <UploadDatasetPage />
                </ProtectedRoute>
              } />
              <Route path="/predictions" element={
                <ProtectedRoute>
                  <PredictionsPage />
                </ProtectedRoute>
              } />
              <Route path="/predictions/:id" element={
                <ProtectedRoute>
                  <PredictionDetailsPage />
                </ProtectedRoute>
              } />
              
              {/* Authenticated User Only Routes */}
              <Route path="/recommendations" element={
                <ProtectedRoute authenticatedOnly={true}>
                  <InsightsPage />
                </ProtectedRoute>
              } />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;