import React, { useEffect, useState, useRef, useCallback } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from '../ApiLoadingContext';
import Default from "../../imgs/default.png"
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
const UserHistory = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [responseError, setResponseError] = useState(null);
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

    const [loading, setLoading] = useState(true);
    const [tableData, setTableData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
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

        const url = `https://api.screeningstar.co.in/user-history?admin_id=${admin_id}&_token=${storedToken}`;

        fetch(url, {
            method: "GET",
            redirect: "follow",
        })
            .then((response) => {
                return response.json().then((result) => {
                    // Check if the API response status is false
                    if (result.status === false) {
                        // Log the message from the API response
                        console.error('API Error:', result.message);
                        Swal.fire('Error!', `${result.message}`, 'error');
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
                setTableData(result.client_spocs || []);
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
        setCurrentPage(1)
    };

    const handleStartDateChange = (e) => {
        setStartDate(e.target.value);
    };

    const handleEndDateChange = (e) => {
        setEndDate(e.target.value);
    };

    const formatDate = (date) => {
        if (!date) return 'null'; // Return null if date is empty, null, or undefined

        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return null; // Return null if the date is invalid

        // Convert to IST (UTC+5:30)
        const utcOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istDateObj = new Date(dateObj.getTime() + utcOffset);

        // Extract IST date components
        const day = String(istDateObj.getUTCDate()).padStart(2, '0');
        const month = String(istDateObj.getUTCMonth() + 1).padStart(2, '0');
        const year = istDateObj.getUTCFullYear();
        let hours = istDateObj.getUTCHours();
        const minutes = String(istDateObj.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12; // Convert 24-hour to 12-hour format

        return `${day}-${month}-${year} ${hours}:${minutes} ${ampm}`;
    };
    const formatDate2 = (date) => {
        const dateObj = new Date(date);

        // Convert to IST (UTC+5:30)
        const utcOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istDateObj = new Date(dateObj.getTime() + utcOffset);

        // Extract IST date components
        const year = istDateObj.getUTCFullYear();
        const month = String(istDateObj.getUTCMonth() + 1).padStart(2, '0');
        const day = String(istDateObj.getUTCDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    const formatToYYYYMMDD = (date) => {
        const dateObj = new Date(date);
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`; // Output: YYYY-MM-DD
    };

    const filteredData = (Array.isArray(tableData) ? tableData : []).filter((row) => {
        const normalizeString = (str) => {
            const normalized = str?.toLowerCase().replace(/\s+/g, ' ').trim() || '';
            console.log('Normalized String:', normalized);
            return normalized;
        };

        const searchTermNormalized = normalizeString(searchTerm);
        const adminNameNormalized = normalizeString(row?.admin_name);

        const adminEmailNormalized = normalizeString(row?.admin_email);

        const adminMobileNormalized = normalizeString(row?.admin_mobile?.toString());

        const matchesSearchTerm =
            adminNameNormalized.includes(searchTermNormalized) ||
            adminEmailNormalized.includes(searchTermNormalized) ||
            adminMobileNormalized.includes(searchTermNormalized);

        const matchesStartDate = !startDate || formatToYYYYMMDD(row.first_login_time) === startDate;
        console.log('Matches Start Date:', startDate);
        console.log('Matches first login Date:', formatDate(row.first_login_time));

        const result = matchesSearchTerm && matchesStartDate;
        return result;
    });

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= totalPages) {
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
    }, [paginatedData, loading]);

    const Loader = () => (
        <tr>
            <td colSpan="100">
                <div className="flex w-full justify-center items-center h-20">
                    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                </div>
            </td>
        </tr>
    );

    const handleView = (adminId, id) => {
        navigate(`/admin-ViewUser?log_admin_id=${adminId}&log_id=${id}`);
    };
    // Function to format the date and time to "Day-Month-Year Hours:Minutes:Seconds" format
    // Function to format the date and time to "Day-Month-Year Hours:Minutes AM/PM" format






    return (
        <div className="bg-[#c1dff2] border border-black">
            <div className="bg-white p-12 w-full mx-auto">
                <div className="flex justify-between items-center space-x-4 mb-4">
                    <div className="w-1/3">
                        <div>

                            <input
                                type="text"
                                placeholder="Search by Name, Email or Mobile"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="border p-2 rounded w-full mb-2"
                            />
                            <DatePicker
                                selected={startDate ? parseISO(startDate) : null}
                                onChange={(date) => {
                                    if (!date) {
                                        setStartDate("");
                                        return;
                                    }
                                    const formatted = format(date, "yyyy-MM-dd"); // Save format
                                    setStartDate(formatted);
                                }}
                                dateFormat="dd-MM-yyyy"
                                placeholderText="DD-MM-YYYY"
                                className="border uppercase p-2 rounded w-full mb-2"
                            />
                        </div>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4 shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border p-2 rounded"
                    />
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border p-2 rounded"
                    /> */}
                    <button
                        onClick={exportToExcel}
                        className="bg-green-500 hover:scale-105  transition duration-200 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Export to Excel
                    </button>
                </div>
                <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                        <table className="min-w-full border-collapse border border-black rounded-lg overflow-scroll whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#c1dff2] text-[#4d606b]">
                                    <th className="border border-black uppercase px-4 py-2">SL</th>
                                    <th className="border border-black uppercase px-4 py-2">Admin Name</th>
                                    <th className="border border-black uppercase px-4 py-2">Employee Id</th>
                                    <th className="border border-black uppercase px-4 py-2">Ip Address</th>
                                    <th className="border border-black uppercase px-4 py-2">Email</th>
                                    {/* <th className="border border-black uppercase px-4 py-2">Mobile Number</th> */}
                                    {/* <th className="border border-black uppercase px-4 py-2">First Login Time</th>
                                <th className="border border-black uppercase px-4 py-2">Last Logout Time</th> */}
                                    <th className="border border-black uppercase px-4 py-2">Created At</th>
                                    <th className="border border-black uppercase px-4 py-2">View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <Loader />
                                ) : paginatedData.length > 0 ? (
                                    paginatedData.map((row, index) => (
                                        <tr className="text-center" key={index}>
                                            <td className="border border-black px-4 py-2">
                                                {index + 1 + (currentPage - 1) * itemsPerPage}
                                            </td>
                                            {/* <td className="border border-black text-center capitalize px-4 py-2">
                                            <div className="flex justify-center items-center">
                                                <img src={row.profile_picture ? row.profile_picture : `${Default}`} alt={row.admin_name} className="w-10 h-10 rounded-full" />
                                            </div>
                                        </td> */}
                                            <td className="border border-black capitalize px-4 py-2">{row.admin_name}</td>
                                            <td className="border border-black capitalize px-4 py-2">{row.emp_id}</td>
                                            <td className="border border-black capitalize px-4 py-2">
                                                {row.client_ip || "No Ip Found"}
                                            </td>
                                            <td className="border border-black  px-4 py-2">{row.admin_email}</td>
                                            {/* <td className="border border-black capitalize px-4 py-2">{row.admin_mobile}</td> */}

                                            {/* <td className="border border-black capitalize px-4 py-2">{formatDate(row.first_login_time)}</td>
                                        <td className="border border-black capitalize px-4 py-2">
                                            {formatDate(row.last_logout_time)}
                                        </td> */}
                                            <td className="border border-black px-4 py-2">
                                                {formatDate(row.created_at)}
                                            </td>
                                            <td className="border border-black px-4 py-2">
                                                <button
                                                    onClick={() => handleView(row.admin_id, formatDate2(row.created_at))}
                                                    className="bg-green-500 text-white hover:scale-105 font-bold transition duration-200 px-4 py-2 rounded hover:bg-green-700"
                                                >
                                                    View
                                                </button>

                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="text-center text-red-500 border border-black px-4 py-2" colSpan="10">
                                            {responseError && responseError !== "" ? responseError : "No data available in table"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>

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

export default UserHistory;
