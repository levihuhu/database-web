import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

// Create the context
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('access'));
    const [userRole, setUserRole] = useState(localStorage.getItem('role'));
    const navigate = useNavigate(); // Hook for navigation

    // Effect to update state if localStorage changes externally (e.g., multiple tabs)
    useEffect(() => {
        const handleStorageChange = () => {
            setAuthToken(localStorage.getItem('access'));
            setUserRole(localStorage.getItem('role'));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = (data) => {
        const { access, refresh, user_id, username, role } = data;
        console.log("🔒 AuthContext: Setting auth state and localStorage");
        localStorage.setItem('access', access);
        localStorage.setItem('refresh', refresh);
        localStorage.setItem('user_id', user_id);
        localStorage.setItem('username', username);
        localStorage.setItem('role', role);
        setAuthToken(access); // Update React state -> triggers re-render
        setUserRole(role);
        
        // Navigate after state update
        console.log(`🚀 AuthContext: Navigating to /${role === 'instructor' ? 'teacher' : 'student'}`);
        navigate(role === 'instructor' ? '/teacher' : '/student');
    };

    const logout = () => {
        console.log("🔒 AuthContext: Clearing auth state and localStorage");
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user_id');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        setAuthToken(null); // Update React state -> triggers re-render
        setUserRole(null);
        navigate('/login'); // Navigate to login after logout
    };

    // Value provided to consuming components
    const value = {
        isAuthenticated: Boolean(authToken),
        token: authToken,
        role: userRole,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the AuthContext
export const useAuth = () => {
    return useContext(AuthContext);
}; 