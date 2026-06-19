import React, { createContext, useCallback, useState, useEffect, useContext } from "react";
import { useApiLoading } from '../ApiLoadingContext';
import Swal from "sweetalert2";

import { useNavigate } from "react-router-dom";

const Modules = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [responseError, setResponseError] = useState(null);

  const [moduleData, setModuleData] = useState([]); // Changed to an array to handle multiple entries
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const handleView = (module) => {
    navigate(`/admin-ViewModules?modules=${module}`); // Navigate to the desired route
  };
  const fetchModuleData = useCallback(async () => {
    const adminData = JSON.parse(localStorage.getItem("admin"));
    const admin_id = adminData?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      console.error("Admin ID or Token is missing from localStorage");
      return;
    }

    setLoading(true);
    setApiLoading(true);

    const url = `https://api.screeningstar.co.in/email-template/modules?admin_id=${admin_id}&_token=${storedToken}`;

    try {
      const response = await fetch(url);
      const result = await response.json();
      if (!response.ok) {
        Swal.fire('Error!', `${result.message}`, 'error');
        setResponseError(result.message);
      };

      const newToken = result._token || storedToken;

      if (newToken !== storedToken) {
        localStorage.setItem("_token", newToken);
      }

      setModuleData(result.services);
    } catch (error) {
      console.error("Error fetching module data:", error);
    } finally {
      setLoading(false);
      setApiLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        await validateAdminLogin(); // Validate before fetching data
        await fetchModuleData();
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login");
      }
    };

    if (!apiLoading) {
      initialize();
    }
  }, [fetchModuleData, navigate]);

  console.log('moduleData', moduleData)
  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );
  return (
    <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">

      <div className="space-y-4 py-6 px-4 md:py-[30px] md:px-[51px] bg-white">

        <table className="min-w-full border-collapse border border-black">
          <thead>
            <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] text-left">
              <th className="uppercase border border-black px-4 py-2 text-center">SI</th>
              <th className="uppercase border border-black px-4 py-2">Module Name</th>
              <th className="uppercase border border-black px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  <Loader className="text-center" />
                </td>
              </tr>
            ) : !moduleData || moduleData.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-red-500">
                  {responseError || 'No Data Available'}
                </td>
              </tr>
            ) : (
              moduleData?.map((item, index) => (
                <tr key={index}>
                  <td className="border border-black px-4 py-2 text-center">{index + 1}</td>
                  <td className="border border-black px-4 capitalize py-2">{item.module}</td>
                  <td className="border border-black px-4 py-2 text-center">
                    <button
                      className="ml-2 p-2 px-4 font-bold text-white bg-green-500 hover:bg-green-600 rounded-md"
                      onClick={() => handleView(item.module)}
                    >
                      VIEW
                    </button>
                  </td>
                </tr>
              ))
            )
           }
          </tbody>
        </table>

      </div>
    </div>
  )
}

export default Modules