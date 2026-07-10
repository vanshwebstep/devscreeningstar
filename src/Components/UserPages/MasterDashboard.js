import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { useApiLoadingBranch } from '../BranchApiLoadingContext';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Dot
} from "recharts";

const CustomDot = (props) => {
  const { cx, cy, value, index } = props;
  const colors = ["#008000", "#FF0000", "#FFFF00", "#FF1493", "#FFA500", "#1E90FF", "#0000FF"];
  return (
    <Dot
      cx={cx}
      cy={cy}
      fill={colors[index]}
      r={6}
    />
  );
};

const MasterDashboard = () => {
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
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
  const [loading, setLoading] = useState(true);
  const [branchData, setBranchData] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState(""); // Track selected month
  const navigate = useNavigate();

  // Function to filter by selected month
  const filterByMonth = (applications) => {
    if (!selectedMonth) return applications; // If no month is selected, return all data

    return applications.filter(application => {
      const applicationMonth = new Date(application.created_at).toISOString().slice(0, 7); // Extract month in 'YYYY-MM' format
      return applicationMonth === selectedMonth;
    });
  };

  const fetchBranchData = useCallback(async () => {
    setLoading(true);
    setApiLoadingBranch(true)
    const branchData = JSON.parse(localStorage.getItem("branch"));
    const branch_id = JSON.parse(localStorage.getItem("branch"))?.branch_id;
    const branch_token = localStorage.getItem("branch_token");
    const url = `https://api.screeningstar.co.in/branch/?branch_id=${branch_id}&_token=${branch_token}`;

    try {
      let response;
      // Assuming branchData is already an object; no need for JSON.parse
      if (branchData?.type === "sub_user") {
        const sub_user_id = branchData?.id ?? null;
        response = await fetch(`${url}&sub_user_id=${sub_user_id}`);
      } else {
        response = await fetch(url);
      }
      if (response.ok) {
        const result = await response.json();
        const newToken = result.token || result._token || branch_token || '';
        if (newToken) {
          localStorage.setItem("branch_token", newToken);
        }
        // Apply month filter when setting branch data
        const filteredData = {};
        Object.keys(result.clientApplications).forEach(category => {
          filteredData[category] = filterByMonth(result.clientApplications[category].applications);
        });
        setBranchData(filteredData);
      } else {
        console.log('Error fetching data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
    setApiLoadingBranch(false)

  }, [selectedMonth]); // Run when selectedMonth changes

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoadingBranch == false) {
          await validateBranchLogin();
          await fetchBranchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/userLogin');
      }
    };

    initialize();
  }, [fetchBranchData, navigate]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value); // Update selected month
  };

  const handleSearch = (category, e) => {
    setSearchTerms(prevState => ({
      ...prevState,
      [category]: e.target.value.toLowerCase(),
    }));
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const getBackgroundColor = (category) => {
    const categoryColors = {
      initiated: 'bg-blue-200',
      hold: 'bg-gray-300',
      closure_advice: 'bg-teal-200',
      wip: 'bg-orange-200',
      insuff: 'bg-red-200',
      completed: 'bg-green-200',
      completed_green: 'bg-green-300',
      completed_orange: 'bg-orange-300',
      completed_red: 'bg-red-300',
      completed_yellow: 'bg-yellow-300',
      completed_pink: 'bg-pink-300',
      stopcheck: 'bg-purple-200',
      active_employment: 'bg-blue-300',
      not_doable: 'bg-gray-400',
      candidate_denied: 'bg-rose-200',
    };
    return categoryColors[category] || `bg-${Math.floor(Math.random() * 360)}-200`;
  };

  const renderApplicationStats = () => {
    return Object.keys(branchData).map((category) => {
      const categoryData = branchData[category];
      const count = categoryData ? categoryData.length : 0; // Handle empty data case
      const backgroundColor = getBackgroundColor(category);
      if (count === 0) return null; // Don't render if no data exists

      return (
        <div
          key={category}
          className={`flex items-center justify-between w-full sm:w-[48%] md:w-[32%] p-4 ${backgroundColor} rounded shadow`}
        >
          <div className="flex flex-col">
            <p className="text-xs sm:text-sm font-semibold text-black">{category.toUpperCase()}</p>
            <span className="text-lg sm:text-xl font-bold text-black">{count}</span>
          </div>
          <div>
            <i className="fa-solid fa-dollar-sign text-xl sm:text-2xl text-blue-600"></i>
          </div>
        </div>

      );
    });
  };



  const renderTable = (category, applications) => {
    const searchTerm = searchTerms[category] || '';
    const filteredApplications = applications.filter(application =>
      application.application_id.toLowerCase().includes(searchTerm) ||
      application.application_name.toLowerCase().includes(searchTerm)
    );

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredApplications.slice(indexOfFirstEntry, indexOfLastEntry);

    const totalPages = Math.ceil(filteredApplications.length / entriesPerPage);

    if (filteredApplications.length === 0) return null;

    return (
      <div className="bg-white shadow-md rounded-lg p-4 mb-4">
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by Ref ID or Application Name"
            className="p-2 border rounded w-full text-sm sm:text-base"
            onChange={(e) => handleSearch(category, e)}
          />
        </div>

        <h2 className="text-lg sm:text-xl font-bold mb-2">{category.toUpperCase()}</h2>

        {/* Make table responsive */}
        <div className="table-container rounded-lg">
          {/* Top Scroll */}
          <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
          </div>

          {/* Actual Table Scroll */}
          <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>


            <table className="w-full min-w-max border-collapse border rounded-lg">
              <thead>
                <tr className="bg-[#c1dff2] text-[#4d606b] text-sm sm:text-base">
                  <th className="border px-2 sm:px-4 py-2">NO</th>
                  <th className="border px-2 sm:px-4 py-2">REFERENCE ID</th>
                  <th className="border px-2 sm:px-4 py-2">APPLICATION NAME</th>
                </tr>
              </thead>
              <tbody>
                {currentEntries.map((application, index) => (
                  <tr key={index} className="text-sm sm:text-base">
                    <td className="border px-2 sm:px-4 py-2">{index + 1}</td>
                    <td className="border px-2 sm:px-4 py-2">{application.application_id}</td>
                    <td className="border px-2 sm:px-4 py-2">{application.application_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4">
          <div className="flex space-x-2 mb-2 sm:mb-0">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm sm:text-base bg-gray-300 rounded-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm sm:text-base bg-gray-300 rounded-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
          <span className="text-sm sm:text-base">{`Page ${currentPage} of ${totalPages}`}</span>
        </div>
      </div>

    );
  };

  const formatChartData = () => {
    return Object.keys(branchData).map(category => {
      const categoryData = branchData[category] || { applicationCount: 0 };
      return {
        name: category.toUpperCase(),
        value: categoryData.length
      };
    });
  };

    useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [loading]);

  return (
    <div className={`border border-black bg-white}`}>
      <div className='text-center mt-[20px] '>
        <input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className='p-3 px-12 text-2xl bg-gray-300 text-center border-2 rounded'
          disabled={loading}
        />
      </div>
      {loading ? (
        <div className="flex justify-center items-center">
          <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white md:p-12 p-6 w-full mx-auto">
            <div className='text-center'>
              <div className="flex text-left pr-0 flex-wrap gap-4 p-4 bg-white">
                {renderApplicationStats()}
              </div>
            </div>
          </div>
          <div className="mb-6 sm:mb-8 bg-white p-4 sm:p-5">
            <ResponsiveContainer width="100%" height={300} className="sm:h-[400px]">
              <LineChart data={formatChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={window.innerWidth < 640 ? -30 : -45}
                  textAnchor={window.innerWidth < 640 ? "middle" : "end"}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#8884d8"
                  fillOpacity={0.5}
                  fill="url(#colorUv)"
                  dot={<CustomDot />}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div>

            <div className="grid md:grid-cols-2 bg-[#c1dff2] gap p-5 gap-5">
              {Object.entries(branchData).map(([category, data]) => (
                (data.length > 0 || selectedMonth === '') && (
                  <div key={category}>
                    {renderTable(category, data)}
                  </div>
                )
              ))}
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default MasterDashboard;
