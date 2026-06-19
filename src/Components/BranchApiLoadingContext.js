import { createContext, useContext, useState } from "react";
import axios from 'axios';

const BranchApiLoadingContext = createContext();

export const BranchApiLoadingProvider = ({ children }) => {
  const [apiLoadingBranch, setApiLoadingBranch] = useState(false);
  const validateBranchLogin = async () => {
    setApiLoadingBranch(true);
    console.log('apiLoadingBranch-start', apiLoadingBranch);

    const storedBranchData = localStorage.getItem("branch");
    const storedToken = localStorage.getItem("branch_token");

    // If admin data or token is missing, remove all sensitive localStorage items
    if (!storedBranchData || !storedToken) {
        clearSensitiveData();
        setApiLoadingBranch(false);
        throw new Error("Unauthorized: Missing admin data or token");
    }

    let branchData;
    try {
        branchData = JSON.parse(storedBranchData);
    } catch (error) {
        console.error("Error parsing branch data:", error);
        clearSensitiveData();
        setApiLoadingBranch(false);
        throw new Error("Unauthorized: Invalid branch data");
    }

    try {
        const payload = {
            branch_id: `${branchData.branch_id}`,
            _token: `${storedToken}`,
        };

        if (branchData.type === "sub_user") {
            payload.sub_user_id = `${branchData.id}`;
        }

        const response = await axios.post(
            "https://api.screeningstar.co.in/branch/verify-branch-login",
            payload
        );

        const result = response.data;
        if (result.status) {
            const newToken = result.token || result._token;
            if (newToken) {
                localStorage.setItem("branch_token", newToken);
            }
        } else {
            clearSensitiveData();
            throw new Error("Unauthorized: Verification failed");
        }

    } catch (error) {
        console.error("Error validating login:", error);
        clearSensitiveData();
        throw new Error("Unauthorized: Validation error");
    } finally {
            setApiLoadingBranch(false);
            console.log('apiLoadingBranch-end', apiLoadingBranch);
        }
    }
   

console.log('apiloadingfinal',apiLoadingBranch)

  // Helper function to clear sensitive data from localStorage
  const clearSensitiveData = () => {
    localStorage.removeItem("branch");
    localStorage.removeItem("branch_token");
  };



  return (
    <BranchApiLoadingContext.Provider value={{ apiLoadingBranch, setApiLoadingBranch, validateBranchLogin }}>
      {children}
    </BranchApiLoadingContext.Provider>
  );
};

export const useApiLoadingBranch = () => useContext(BranchApiLoadingContext);
