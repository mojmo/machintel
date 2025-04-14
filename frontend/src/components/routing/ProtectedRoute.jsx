import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const ProtectedRoute = ({ children, authenticatedOnly = false }) => {
    const { user, loading } = useAuth();
    
    // Add a check for loading state to prevent redirect flicker
    if (loading) {
        return <div>Loading...</div>;
    }
    
    // No user - redirect to login
    if (!user) {
        return <Navigate to="/login" />;
    }
    
    // For routes that require full authentication (not guest access)
    if (authenticatedOnly && user.isGuest) {
        return <Navigate to="/login" state={{ message: "This feature requires a registered account." }} />;
    }
    
    return children;
};

export default ProtectedRoute;