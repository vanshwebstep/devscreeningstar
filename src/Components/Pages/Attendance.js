////old code


import React, { useEffect, useState, useCallback, useRef } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";
import Default from "../../imgs/default.png";
import { saveAs } from "file-saver";
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";

const Attendance = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [responseError, setResponseError] = useState(null);
  const [filtredDataRaw, setFiltredDataRaw] = useState([]);
  const [searchName, setSearchName] = useState("");
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

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const tableRef = React.useRef(null);
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];
  const navigate = useNavigate();

  function groupByAdmin(data) {
    const grouped = {};

    data.forEach(entry => {
      const {
        admin_id,
        admin_name,
        profile_picture,
        admin_email,
        admin_mobile,
        emp_id,
        date,
        first_login_time,
        last_logout_time,
        break_times,
        purpose_of_leave,
        leave_from_date,
        leave_to_date
      } = entry;

      if (!date) return; // Skip if date is invalid/null

      if (!grouped[admin_id]) {
        grouped[admin_id] = {
          admin_id,
          admin_name,
          profile_picture,
          admin_email,
          admin_mobile,
          emp_id,
          daily_records: {}
        };
      }

      const dt = new Date(date + 'T00:00:00'); // Safe for IST
      const year = dt.getFullYear().toString();
      const month = String(dt.getMonth() + 1).padStart(2, '0');

      if (!grouped[admin_id].daily_records[year]) {
        grouped[admin_id].daily_records[year] = {};
      }

      if (!grouped[admin_id].daily_records[year][month]) {
        grouped[admin_id].daily_records[year][month] = [];
      }

      grouped[admin_id].daily_records[year][month].push({
        date,
        first_login_time,
        last_logout_time,
        break_times,
        purpose_of_leave,
        leave_from_date,
        leave_to_date
      });
    });

    // Sort by date ascending
    Object.values(grouped).forEach(admin => {
      Object.values(admin.daily_records).forEach(months => {
        Object.values(months).forEach(records => {
          records.sort((a, b) => new Date(a.date) - new Date(b.date));
        });
      });
    });

    return Object.values(grouped);
  }



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

    const url = `https://api.screeningstar.co.in/personal-manager/attendance-list?admin_id=${admin_id}&_token=${storedToken}`;

    fetch(url, {
      method: "GET",
      redirect: "follow",
    })
      .then((response) => {
        return response.json().then((result) => {
          // Check if the API response status is false
          if (result.status === false) {
            // Log the message from the API response
            console.error("API Error:", result.message);
            Swal.fire("Error!", `${result.message}`, "error");
            setResponseError(result.message);

            // Optionally, you can throw an error here if you want to halt the further execution
            throw new Error(result.message);
          }
          return result;
        });
      })
      .then((result) => {
        const newToken = result.token || result._token || storedToken || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }

        const groupedResult = groupByAdmin(result.data.attendance_records);
        console.log(`groupedResult - `, groupedResult);
        setTableData(groupedResult || []);
      })
      .catch((error) => {
        console.error("Fetch error:", error);
        setTableData([]);
      })
      .finally(() => {
        setApiLoading(false);
        setLoading(false);
      });
  }, []);

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
  };

  const formatDate = (date) => {
    if (!date || date === "null" || date === "undefined") return "";

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return "";

    // Convert to IST (UTC+5:30)
    const utcOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(dateObj.getTime() + utcOffset);

    // Extract time components
    let hours = istDateObj.getUTCHours();
    const minutes = String(istDateObj.getUTCMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
  };

  const formatDate2 = (date) => {
    const dateObj = new Date(date);

    // Convert to IST (UTC+5:30)
    const utcOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
    const istDateObj = new Date(dateObj.getTime() + utcOffset);

    // Extract IST date components
    const year = istDateObj.getUTCFullYear();
    const month = String(istDateObj.getUTCMonth() + 1).padStart(2, "0");
    const day = String(istDateObj.getUTCDate()).padStart(2, "0");

    return `${day}-${month}-${year}`;
  };

  const formatToYYYYMMDD = (date) => {
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`; // Output: YYYY-MM-DD
  };

  const filteredData = (Array.isArray(tableData) ? tableData : []).filter(
    (row) => {
      const normalizeString = (str) => {
        return str?.toLowerCase().replace(/\s+/g, " ").trim() || "";
      };

      const searchTermNormalized = normalizeString(searchTerm);
      const adminNameNormalized = normalizeString(row?.admin_name);
      const adminEmailNormalized = normalizeString(row?.admin_email);
      const adminMobileNormalized = normalizeString(
        row?.admin_mobile?.toString()
      );

      const matchesSearchTerm =
        adminNameNormalized.includes(searchTermNormalized) ||
        adminEmailNormalized.includes(searchTermNormalized) ||
        adminMobileNormalized.includes(searchTermNormalized);

      const matchesDateRange = (() => {
        if (!startDate && !endDate) return true;
        console.log('row', row)
        const loginDate = new Date(row.first_login_time);
        const from = startDate ? new Date(startDate) : null;
        const to = endDate ? new Date(endDate) : null;

        if (from && to) {
          return loginDate >= from && loginDate <= to;
        } else if (from) {
          return loginDate >= from;
        } else if (to) {
          return loginDate <= to;
        }
      })();

      return matchesSearchTerm && matchesDateRange;
    }
  );


  const handleFilter = async () => {
    if (!startDate || !endDate) {
      Swal.fire({
        icon: "warning",
        title: "Select Dates",
        text: "Please select both start and end dates.",
      });
      return;
    }

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

    const from = format(startDate, "MM/yyyy");
    const to = format(endDate, "MM/yyyy");

    const url = `https://api.screeningstar.co.in/personal-manager/attendance-list?admin_id=${admin_id}&_token=${storedToken}&from=${from}&to=${to}`;

    try {
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      const result = await response.json();

      if (result.status === false) {
        console.error("API Error:", result.message);
        Swal.fire("Error!", `${result.message}`, "error");
        setResponseError(result.message);
        throw new Error(result.message);
      }

      const newToken = result.token || result._token || storedToken || "";
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      const attendanceRecords = result.data.attendance_records || [];
      const filteredFlat = result.data.attendance_records || [];

      /*
      // Step 1: Filter by date
      const filteredFlat = attendanceRecords.filter((entry) => {
        if (entry?.date) {
          const entryDate = new Date(entry.date);
          const fromDate = new Date(startDate);
          const toDate = new Date(endDate);

          // Reset hours to compare only dates
          entryDate.setHours(0, 0, 0, 0);
          fromDate.setHours(0, 0, 0, 0);
          toDate.setHours(0, 0, 0, 0);

          return entryDate >= fromDate && entryDate <= toDate;
        }
        return false;
      });
      */

      if (filteredFlat.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Data Found",
          text: "No records found in the selected date range.",
        });
        setTableData([]);
        setFiltredDataRaw([]);
        return;
      }

      // Step 2: Group by admin
      const groupedResult = groupByAdmin(filteredFlat); // Must match your UI format

      setTableData(groupedResult || []);
      setFiltredDataRaw(groupedResult || []);
      setCurrentPage(1);
    } catch (error) {
      console.error("Fetch error:", error);
      setTableData([]);
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  };



  const exportToExcel = () => {
    console.log('1')
    if (!tableRef.current) return;
    console.log('2')

    // Grab the rendered table from DOM
    const tableElement = tableRef.current;
    console.log('3')

    // Convert HTML table → Excel worksheet
    const worksheet = XLSX.utils.table_to_sheet(tableElement, { raw: true });
    console.log('4')

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    // Export Excel
    XLSX.writeFile(workbook, "Attendance.xlsx");
  };




  const Loader = () => (
    <tr>
      <td colSpan="100">
        <div className="flex w-full justify-center items-center h-20">
          <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
      </td>
    </tr>
  );

  const [expandedRow, setExpandedRow] = useState(null);

  const handleView = (adminId) => {
    setExpandedRow((prev) => (prev === adminId ? null : adminId));
  };
  // Function to format the date and time to "Day-Month-Year Hours:Minutes:Seconds" format
  // Function to format the date and time to "Day-Month-Year Hours:Minutes AM/PM" format

  function getDaysInMonth(year, month) {
    return new Date(year, parseInt(month), 0).getDate(); // month = "07" → 7
  }

  const breakTypes = [
    "LOGIN",
    "TEA BREAK IN-1",
    "TEA BREAK OUT-1",
    "LUNCH BREAK IN",
    "LUNCH BREAK OUT",
    "TEA BREAK IN-2",
    "TEA BREAK OUT-2",
    "LOGOUT"
  ];
  const adminMonthBlocks = [];

  tableData.forEach(admin => {
    Object.keys(admin.daily_records).forEach(year => {
      Object.keys(admin.daily_records[year]).forEach(month => {
        adminMonthBlocks.push({
          admin,
          year,
          month,
          records: admin.daily_records[year][month]
        });
      });
    });
  });

  console.log(`tableData - `, tableData);

  const filteredAdminBlocks = adminMonthBlocks.filter(({ admin }) =>
    admin.admin_name.toLowerCase().includes(searchName.toLowerCase())
  );

  console.log('adminMonthBlocks', adminMonthBlocks)
  console.log('filteredAdminBlocks', filteredAdminBlocks)

  const paginatedAdminBlocks = filteredAdminBlocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );




  const totalPages = Math.ceil(filteredAdminBlocks.length / itemsPerPage);
  const paginatedData = filteredAdminBlocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [paginatedAdminBlocks, loading]);
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-[#c1dff2] border border-black">
      <div className="bg-white p-12 w-full mx-auto">
        {/* Filter Section */}
        <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
          <div className="w-full md:w-1/3 space-y-2">
            <input
              type="text"
              placeholder="Search by employee name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="mb-4 px-4 py-2 border rounded-lg w-full"
            />

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 w-16">From</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                className="border px-3 py-2 rounded-md"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600 w-16">To</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                dateFormat="MM/yyyy"
                showMonthYearPicker
                className="border px-3 py-2 rounded-md"
              />
            </div>
            <button
              onClick={handleFilter}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
            >
              Search
            </button>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-2 w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-400"
            >
              {optionsPerPage.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={exportToExcel}
            className="bg-green-600 hover:bg-green-700 transition transform hover:scale-105 text-white px-6 py-2 rounded-lg shadow-sm"
          >
            Export to Excel
          </button>
        </div>

        {/* Table */}
        <div className="table-container rounded-lg">
          {/* Top Scroll */}
          <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
          </div>

          {/* Actual Table Scroll */}
          <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
            <table ref={tableRef} className="min-w-full border-collapse border border-black rounded-lg whitespace-nowrap mb-4">
              <thead>
                <tr className="bg-[#c1dff2] text-[#4d606b] text-center">
                  <th className="border border-black px-4 py-2">SL NO</th>
                  <th className="border border-black px-4 py-2">EMPLOYEE ID</th>
                  <th className="border border-black px-4 py-2">NAME OF THE EMPLOYEE</th>
                  <th className="border border-black px-4 py-2">ATTENDANCE</th>
                  {Array.from({ length: 31 }, (_, i) => (
                    <th key={i + 1} className="border border-black px-2 py-2">
                      {i + 1}
                    </th>
                  ))}
                  <th className="border border-black px-4 py-2">LEAVE</th>
                  <th className="border border-black px-4 py-2">PRESENT</th>
                  <th className="border border-black px-4 py-2">LEAVE FROM</th>
                  <th className="border border-black px-4 py-2">LEAVE TO</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAdminBlocks.map(({ admin, year, month, records }, index) => {
                  const breakTypes = [
                    "LOGIN", "TEA BREAK IN-1", "TEA BREAK OUT-1", "LUNCH BREAK IN",
                    "LUNCH BREAK OUT", "TEA BREAK IN-2", "TEA BREAK OUT-2", "LOGOUT"
                  ];

                  const daysInMonth = getDaysInMonth(year, month);
                  const presentCount = records.filter(r => r.first_login_time || r.last_logout_time).length;
                  const leaveCount = records.length - presentCount;
                  const leaveFrom = records.find(r => !r.first_login_time && !r.last_logout_time)?.date || "";
                  const leaveTo = [...records].reverse().find(r => !r.first_login_time && !r.last_logout_time)?.date || "";

                  return (
                    <React.Fragment key={`${admin.emp_id}-${year}-${month}`}>
                      <tr className="bg-yellow-100 text-center font-bold text-black">
                        <td colSpan={35} className="border border-black py-2 text-lg">
                          ATTENDANCE SHEET — {admin.admin_name} ({admin.emp_id}) — {month.padStart(2, '0')}/{year}
                        </td>
                      </tr>

                      {breakTypes.map((label, i) => (
                        <tr key={`${admin.emp_id}-${label}-${year}-${month}`} className="text-center">
                          {i === 0 && (
                            <>
                              <td rowSpan={breakTypes.length} className="border border-black">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{admin.emp_id}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{admin.admin_name}</td>
                            </>
                          )}
                          <td className="border border-black">{label}</td>
                          {Array.from({ length: 31 }, (_, d) => {
                            const day = d + 1;
                            const record = records.find(r => new Date(r.date).getDate() === day);
                            const key = label.toLowerCase();
                            let value = "";

                            if (record) {
                              if (label === "LOGIN") value = record.first_login_time;
                              else if (label === "LOGOUT") value = record.last_logout_time;
                              else value = record.break_times?.[key];
                            }

                            return (
                              <td key={d} className="border border-black text-xs px-2 py-1">
                                {formatDate(value)}
                              </td>
                            );
                          })}
                          {i === 0 && (
                            <>
                              <td rowSpan={breakTypes.length} className="border border-black">{leaveCount}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{presentCount}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{leaveFrom ? formatDate2(leaveFrom) : ""}</td>
                              <td rowSpan={breakTypes.length} className="border border-black">{leaveTo ? formatDate2(leaveTo) : ""}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>


            </table>
          </div>
        </div>






        {/* Pagination */}
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

export default Attendance;
