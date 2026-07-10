import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import SidebarContext from '../SidebarContext'
import { useApiLoading } from "../ApiLoadingContext";
import Swal from 'sweetalert2';

const ClientCredentials = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

  const [searchQuery, setSearchQuery] = useState("");
  const [clientData, setClientData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(null);
  const [error, setError] = useState(null);
  const [responseError, setResponseError] = useState(null);
  const [viewBranchesRow, setViewBranchesRow] = useState(null);
  const [branchesData, setBranchesData] = useState([]);
  const storedToken = localStorage.getItem('token');
  const tableScrollRef = useRef(null);
  const topScrollRef = useRef(null);
  const [scrollWidth, setScrollWidth] = useState("100%");

  // 🔹 Sync scroll positions
  const syncScroll = (e) => {
    if (e.target === topScrollRef.current) {
      tableScrollRef.current.scrollLeft = e.target.scrollLeft;
    } else {
      topScrollRef.current.scrollLeft = e.target.scrollLeft;
    }
  };

  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const emailFromQuery = query.get('email') || '';
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];
  const fetchClientData = async () => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    setApiLoading(true);
    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/external-login-credentials/list?admin_id=${admin_id}&_token=${storedToken}`,
        { method: "GET", redirect: "follow" }
      );
      const data = await response.json();

      if (!response.ok) {
        Swal.fire('Error!', `${data.message}`, 'error');
        setResponseError(data.message);
        setApiLoading(false);
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      const newToken = data.token || data._token || storedToken || '';
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (data.status) {
        const mappedData = data.customers.map((client, index) => ({
          clientId: client.client_unique_id,
          branchName: client.name,
          branchEmail: client.emails ? JSON.parse(client.emails)[0] : 'N/A',
          branchCount: client.branch_count,
          main_id: client.main_id,
          logo: client.logo
        }));
        setClientData(mappedData);
      } else {
        setError("Unexpected data format received.");
      }
    } catch (error) {
      console.error(error.message);
      setError(`Error fetching data: ${error.message}`);
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };
  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin();
          await fetchClientData();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login');
      }
    };
    initialize();
  }, [navigate]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Slice data for the current page

  console.log('clientData', clientData)

  const handleViewBranchesClick = async (clientId) => {
    if (viewBranchesRow === clientId) {
      setViewBranchesRow(null);
      setBranchesData([]); // Clear branches data when hiding
      return;
    }

    // Set loading state to true
    setIsLoading(clientId);
    setError(null); // Clear previous errors

    try {
      // Retrieve admin_id and token from localStorage
      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      const token = localStorage.getItem("_token");

      if (!adminId || !token) {
        throw new Error("Admin ID or Token not found in localStorage");
      }

      const url = `https://api.screeningstar.co.in/branch/list-by-customer?customer_id=${clientId}&admin_id=${adminId}&_token=${token}`;

      // Use the GET method with the new API
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      const newToken = data.token || data._token || storedToken || "";
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      if (data.status && data.branches) {
        setViewBranchesRow(clientId);
        setBranchesData(data.branches); // Set the correct branch data here
      } else {
        setError("Error fetching branches.");
      }
    } catch (error) {
      console.error(error); // Log error for debugging
      setError(`Error fetching branches: ${error.message}`);
    } finally {
      // Set loading state to false
      setIsLoading(null);
    }
  };

  const filteredClientData = clientData.filter(
    (client) =>
      client.clientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.branchName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.branchEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentData = filteredClientData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredClientData.length / itemsPerPage);

  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [currentData, loading]);

  return (
    <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">

      <div className=" py-6 px-4 md:py-[30px] md:px-[51px] bg-white">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Client ID, Name, or Username"
            className="md:w-1/3 w-full rounded-md p-2.5 border border-gray-300"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />


        </div>
        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
          className="border rounded-lg px-3 py-1 text-gray-700 bg-white mb-4 shadow-sm focus:ring-2 focus:ring-blue-400"
        >
          {optionsPerPage.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="table-container rounded-lg">
          {/* Top Scroll */}
          <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
          </div>

          {/* Actual Table Scroll */}
          <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
            <table className="min-w-full border-collapse border border-black text-sm md:text-base">
              <thead className="">
                <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] text-left ">
                  <th className=" uppercase border border-black px-4 py-2  text-center">SI</th>
                  <th className=" uppercase border border-black px-4 py-2">Client ID</th>
                  <th className=" uppercase border border-black px-4 py-2">Name of Client Organisation</th>
                  <th className=" uppercase border border-black px-4 py-2">Username</th>
                  <th className=" uppercase border border-black px-4 py-2 text-center">Link</th>
                </tr>
              </thead>
              {loading ? (
                <tbody className="h-10">
                  <tr className="">
                    <td colSpan="10" className="w-full py-10 h-10  text-center">
                      <div className="flex justify-center  items-center w-full h-full">
                        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="text-center">
                  {error ? (
                    <tr>
                      <td colSpan={5} className="border border-black px-4 py-2 text-red-500">
                        {responseError}
                      </td>
                    </tr>
                  ) : currentData.length > 0 ? (
                    currentData.map((client, index) => (
                      <React.Fragment key={client.clientId}>
                        <tr className="text-left">
                          <td className="border border-black px-4 py-2 text-center">    {(currentPage - 1) * itemsPerPage + index + 1}</td>
                          <td className="border border-black px-4 py-2 text-left">{client.clientId}</td>
                          <td className="border border-black px-4 py-2 text-left">{client.branchName}</td>
                          <td className="border border-black px-4 py-2 text-left">
                            <div className="text-left">{client.branchEmail}</div>
                          </td>
                          <td className="border border-black whitespace-nowrap px-4 text-center py-2">
                            {client.branchCount > 1 ? (
                              <button
                                onClick={() => handleViewBranchesClick(client.main_id)}
                                className={`ml-2 p-2 px-4 font-bold  text-white transition-transform duration-300 ease-in-out transform rounded-md border ${isLoading === client.main_id
                                  ? 'opacity-50  cursor-not-allowed bg-green-500 hover:bg-green-600'
                                  : viewBranchesRow === client.main_id
                                    ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300'
                                    : 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300'
                                  } ${!isLoading && 'hover:scale-105'}`}
                                disabled={isLoading === client.main_id}
                              >
                                {viewBranchesRow === client.main_id ? 'LESS' : 'VIEW BRANCHES'}
                              </button>

                            ) : (
                              <Link
                                to={`/userLogin?branchEmail=${encodeURIComponent(client.branchEmail)}&adminid=${JSON.parse(localStorage.getItem("admin"))?.id}&token=${localStorage.getItem("_token")}&logo=${client.logo}`}
                                target="_blank"
                                className="bg-green-500 hover:bg-green-600 hover:scale-105 focus:ring-2 focus:ring-green-300 ml-2 p-2 px-4 font-bold  text-white transition-transform duration-300 ease-in-out transform rounded-md border "
                              >
                                LOGIN
                              </Link>
                            )}
                          </td>
                        </tr>

                        {/* Conditionally render branches for the selected row */}
                        {viewBranchesRow === client.main_id && client.branchCount > 1 && (
                          <tr>
                            <td colSpan={5} className="p-4">
                              <table className="min-w-full border-collapse border border-black">
                                <thead>
                                  <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b]">
                                    <th className="uppercase border border-black px-4 py-2">Branch ID</th>
                                    <th className="uppercase border border-black px-4 py-2 text-left">Branch Name</th>
                                    <th className="uppercase border border-black px-4 py-2 text-left">Branch Email</th>
                                    <th className="uppercase border border-black px-4 py-2">Link</th>
                                  </tr>
                                </thead>
                                <tbody className="text-center">
                                  {branchesData.length > 0 ? (
                                    branchesData.map((branch) => (
                                      <tr key={branch.id}>
                                        <td className="border border-black px-4 py-2">{branch.id}</td>
                                        <td className="border border-black px-4 py-2 text-left">{branch.name}</td>
                                        <td className="border border-black px-4 py-2 text-left">{branch.email}</td>
                                        <td className="border border-black px-4 py-2">
                                          <Link
                                            to={`/userLogin?branchEmail=${encodeURIComponent(branch.email)}&adminid=${JSON.parse(localStorage.getItem("admin"))?.id}&token=${localStorage.getItem("_token")}&logo=${client.logo}`}
                                            target="_blank"
                                            className="bg-green-500 hover:bg-green-600 hover:scale-105 focus:ring-2 focus:ring-green-300 ml-2 p-2 px-4 font-bold  text-white transition-transform duration-300 ease-in-out transform rounded-md border"
                                          >
                                            LOGIN
                                          </Link>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={4} className="border border-black px-4 py-2 font-light">
                                        You have no branches.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="border border-black px-4 py-2">
                        No head branches found.
                      </td>
                    </tr>
                  )}
                </tbody>
              )}
            </table>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  );
};

export default ClientCredentials;
