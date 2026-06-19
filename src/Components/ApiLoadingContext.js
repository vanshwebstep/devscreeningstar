import { createContext, useContext, useState } from "react";
import axios from 'axios';

const BranchApiLoadingContext = createContext();

export const ApiLoadingProvider = ({ children }) => {
  const [apiLoading, setApiLoading] = useState(false);


  const validateAdminLogin = async () => {
    setApiLoading(true);
    
    const storedAdminData = localStorage.getItem("admin");
    const storedToken = localStorage.getItem("_token");

    // If admin data or token is missing, remove all sensitive localStorage items
    if (!storedAdminData || !storedToken) {
        clearSensitiveData();
        setApiLoading(false);
        throw new Error("Unauthorized: Missing admin data or token");
    }

    let adminData;
    try {
        adminData = JSON.parse(storedAdminData);
    } catch (error) {
        console.error("Error parsing admin data:", error);
        clearSensitiveData();
        setApiLoading(false);
        throw new Error("Unauthorized: Invalid admin data");
    }

    let isComponentMounted = true; // Prevent state updates if unmounted

    try {
        const response = await axios.post(
            "https://api.screeningstar.co.in/admin/verify-admin-login",
            {
                admin_id: adminData.id,
                _token: storedToken,
            }
        );

        const result = response.data;
        if (result.status) {
            const newToken = result.token || result._token;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
            const checkinData = {
                cio_status : result?.admin?.cio_status,
                cio_created_at : result?.admin?.cio_created_at

            };
        
            localStorage.setItem("checkin_data", JSON.stringify(checkinData));


        } else {
            clearSensitiveData();
            throw new Error("Unauthorized: Verification failed");
        }
    } catch (error) {
        console.error("Error validating login:", error);
        clearSensitiveData();
        throw new Error("Unauthorized: Validation error");
    } finally {
        if (isComponentMounted) {
            setApiLoading(false);
        }
    }

    return () => {
        isComponentMounted = false; // Prevent updates if the component is unmounted
    };
};


  // Helper function to clear sensitive data from localStorage
  const clearSensitiveData = () => {
    localStorage.removeItem("sectiontabJson");
    localStorage.removeItem("subMenu");
    localStorage.removeItem("_token");
    localStorage.removeItem("admin");
  };



  return (
    <BranchApiLoadingContext.Provider value={{ apiLoading, setApiLoading, validateAdminLogin }}>
      {children}
    </BranchApiLoadingContext.Provider>
  );
};

export const useApiLoading = () => useContext(BranchApiLoadingContext);
