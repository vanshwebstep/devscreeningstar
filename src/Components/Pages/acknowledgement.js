import React, { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from '../ApiLoadingContext';

const Acknowledgement = () => {

  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [responseError, setResponseError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
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

  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      console.error("Missing admin_id or _token");
      setLoading(false);
      setApiLoading(false);
      return;
    }

    const url = `https://api.screeningstar.co.in/acknowledgement/list?admin_id=${admin_id}&_token=${storedToken}`;

    fetch(url, {
      method: "GET",
      redirect: "follow",
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((result) => {
            const errorMessage = result?.message || "An unknown error occurred.";
            console.error("API Error:", errorMessage);
            Swal.fire('Error!', errorMessage, 'error');
            setResponseError(errorMessage);
            throw new Error(errorMessage);
          });
        }
        return response.json();
      })
      .then((result) => {
        const newToken = result?.token || result?._token || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        setTableData(result?.customers?.data || []);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setTableData([]);
      })
      .finally(() => {
        setLoading(false);
        setApiLoading(false);
      });
  }, []); // If you need to include any dependencies for re-running, add them to the array

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin();
          await fetchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login");
      }
    };

    initialize();
  }, [navigate, fetchData]);

  const handleSendApproval = (customer_id) => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      Swal.fire("Error", "Admin ID or token is missing.", "error");
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      admin_id,
      _token: storedToken,
      customer_id,
    });

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    // Set loading state to true
    setLoading(true);

    fetch("https://api.screeningstar.co.in/acknowledgement/send-notification", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.status) {
          fetchData();
          Swal.fire("Success", result.message || "Notification sent successfully!", "success");
        } else {
          Swal.fire("Error", result.message || "Failed to send notification.", "error");
        }
      })
      .catch((error) => {
        console.error("API Error:", error);
        Swal.fire("Error", "An error occurred while sending notification.", "error");
      })
      .finally(() => {
        // Set loading state to false
        setLoading(false);
      });
  };
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];
  const [currentPage, setCurrentPage] = useState(1);




  const filteredData =
    tableData?.filter(
      (row) =>
        row?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row?.client_unique_id?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(paginatedData.length / itemsPerPage);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Acknowledgement");
    XLSX.writeFile(wb, "Acknowledgement.xlsx");
  };
    useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [tableData, loading]); // recalc whenever data changes


  const Loader = () => (
    <tr>
      <td colSpan="5">
        <div className="flex w-full justify-center items-center h-20">
          <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
      </td>
    </tr>
  );
  return (
    <div className="bg-[#c1dff2] border border-black">

      <div className="bg-white md:p-12 p-6 w-full mx-auto">
        <div className="mb-4 md:flex justify-between items-center">
          <div>
            <div>
              <button
                onClick={exportToExcel}
                className="bg-green-500 text-white rounded mb-2 px-4 py-2 hover:bg-green-600 border">
                Export to Excel
              </button>
            </div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-1 text-gray-700 bg-white  shadow-sm focus:ring-2 focus:ring-blue-400"
            >
              {optionsPerPage.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Search by Name or Client ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded md:w-1/3 w-full "
          />

        </div>

         <div className="table-container rounded-lg">
      {/* Top Scroll */}
      <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
      </div>

      {/* Actual Table Scroll */}
      <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
            <table className="min-w-full border-collapse border border-black rounded-lg overflow-scroll whitespace-nowrap">
              <thead className="rounded-lg">
                <tr className="bg-[#c1dff2] text-[#4d606b] rounded-lg">
                  <th className="border border-black uppercase px-4 py-2">SL</th>
                  <th className="border border-black uppercase px-4 py-2">Client Code</th>
                  <th className="border border-black uppercase px-4 py-2">Company Name</th>
                  <th className="border border-black uppercase px-4 py-2">Application Count</th>
                  <th className="border border-black uppercase px-4 py-2">Send Approvals</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex justify-center items-center h-24">
                        <Loader />
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((row, index) => (
                        <tr className="text-center" key={index}>
                          <td className="border border-black px-4 py-2">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </td>
                          <td className="border border-black px-4 py-2">{row.client_unique_id}</td>
                          <td className="border border-black px-4 py-2">{row.name}</td>
                          <td className="border border-black px-4 py-2">{row.applicationCount}</td>
                          <td className="border border-black px-4 py-2">
                            <button
                              onClick={() => handleSendApproval(row.id)}
                              className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                            >
                              Send
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center text-red-500 p-4">
                          {responseError && responseError !== "" ? responseError : "No data available in table"}
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}


      </div>
    </div>
  );
};

export default Acknowledgement;
