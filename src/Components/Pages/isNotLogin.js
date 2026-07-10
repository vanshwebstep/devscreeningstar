import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const IsNotLogin = ({ children }) => {
  const [loading, setLoading] = useState(true);  // Default loading state to true
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuthentication = async () => {
      const storedAdminData = localStorage.getItem('admin');
      const storedToken = localStorage.getItem('_token');
      // If no authentication data found, clear localStorage and redirect to login page
      if (!storedAdminData || !storedToken) {
        localStorage.clear();
        setLoading(false);
      }

      let adminData;
      try {
        adminData = JSON.parse(storedAdminData);
      } catch (error) {
        console.error('Error parsing JSON from localStorage:', error);
        localStorage.clear();
      }

      // Verify the admin login using an API request
      try {
        const response = await axios.post(
          'https://api.screeningstar.co.in/admin/verify-admin-login',
          {
            admin_id: adminData.id,
            _token: storedToken,
          }
        );
        const result = await response.json();
        const newToken = result.token || result._token || storedToken ;
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        if (result.status) {
          setLoading(true);
          navigate('/', { state: { from: location }, replace: true });  // Redirect to index if valid
        }else{
          setLoading(false);
        }
      } catch (error) {
        console.error('Error validating login:', error);
        localStorage.clear();
        setLoading(false);
      }
    };

    checkAuthentication();  // Run authentication check

  }, [navigate, location]);

  if (loading) {
    return <div>Loading...</div>;  // Show loading message while checking authentication
  }

  return children;  // Return the children components if authenticated
};

export default IsNotLogin;
