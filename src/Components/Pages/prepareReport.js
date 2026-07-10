import React, { useCallback, useEffect, useState, useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import * as XLSX from "xlsx";
import Swal from 'sweetalert2';
import { saveAs } from "file-saver";
const PrepareReport = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [responseError, setResponseError] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        reportGeneratedBy: '',
        qcStatusFetch: '',
        reportDate: '',
        qcDate: '',
        qcStatus: '',
        reportGeneratedByMonth: ''
    });
    const storedToken = localStorage.getItem("_token");
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
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const fetchData = useCallback(() => {
        setLoading(true); // Set loading to true before starting the fetch
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/report-master/prepare-report?admin_id=${adminId}&_token=${token}`, requestOptions)
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
                setLoading(false);
                const newToken = result.token || result._token || storedToken;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Flatten the response structure to match the table columns
                const flattenedData = result.result.flatMap(customer =>
                    customer.branches.flatMap(branch =>
                        branch.applications.map(application => ({
                            customerId: customer.customer_id,
                            customerName: customer.customer_name,
                            customerUniqueId: customer.customer_unique_id,
                            applicationId: application.application_id,
                            applicationName: application.application_name,
                            clientApplicationId: application.client_application_id,
                            overallStatus: application.overall_status,
                            applicationDate: application.application_created_at,
                            reportDate: application.report_date,
                            reportGeneratedBy: application.report_generate_by,
                            reportGeneratorName: application.report_generator_name,
                            qcDate: application.qc_date,
                            qcDoneBy: application.qc_done_by,
                            qcDoneByName: application.qc_done_by_name,
                            qcStatus: application.is_verify,
                            services_status: application.services_status

                        })))
                );

                setTableData(flattenedData);
                setFilteredData(flattenedData); // Set filteredData to match the initial table data
            })
            .catch((error) => {
                console.error(error);
                setLoading(false); // In case of an error, make sure loading is set to false
            });
    }, []);
    useEffect(() => {
        const initialize = async () => {
            try {
                await validateAdminLogin(); // Verify admin first
                await fetchData(); // Fetch data after verification
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchData]);
    const paginateData = (data) => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        return data.slice(startIndex, endIndex);
    };
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    const formatDate = (dateString) => {
        if (!dateString || isNaN(new Date(dateString).getTime())) {
            return "N/A";
        }

        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0'); // Ensure 2 digits for day
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();

        return `${day}-${month}-${year}`;
    };
    const handleDownload = () => {
        const excelData = filteredData.map((item, index) => {
            return {
                "SL No": (currentPage - 1) * entriesPerPage + index + 1,
                "Report Date": formatDate(item.reportDate), // Format the date similarly to the table
                "Reference ID": item.customerUniqueId,
                "Name of the Applicant": item.customerName || "N/A", // Default to "N/A" if not available
                "Report Analyst Name": item.reportGeneratorName || "N/A", // Default to "N/A" if not available
                "Overall Status": item.overallStatus || "N/A", // Default to "N/A" if not available
                "QC Status": item.qcStatus || "N/A", // Default to "N/A" if not available
                "QC Analyst Name": item.qcDoneByName || "N/A", // Default to "N/A" if not available
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

        // Write the workbook and download it
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "ClientsData.xlsx");
    };
    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = tableData.filter(row =>
            row?.customerName?.toLowerCase().includes(value) ||
            row?.applicationName?.toLowerCase().includes(value)

        );
        setCurrentPage(1)
        setFilteredData(filtered);
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [filteredData, loading]);
    const maxServicesCount = Math.max(...filteredData.map(row => Object.keys(row.services_status || {}).length));
    console.log('filteredData', filteredData)
    return (
        <div className="w-full bg-[#c1dff2]  overflow-hidden">

            <div className="bg-white border border-black md:p-12 p-6 rounded-md w-full mx-auto">
                <div className="md:flex justify-between">
                    <div className="block ">
                        <div>
                            <button
                                onClick={handleDownload}
                                className="bg-green-500 text-white rounded mb-2 px-4 py-2 hover:scale-105 hover:bg-green-600 border"
                            >
                                Export to Excel
                            </button>
                        </div>
                        <div>
                            <select
                                value={entriesPerPage}
                                onChange={(e) => {
                                    setEntriesPerPage(Number(e.target.value));
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
                    </div>
                    <input
                        type="text"
                        placeholder="Search by Applicant Name"
                        value={searchTerm}
                        onChange={handleSearch}
                        className="border rounded-lg md:w-1/3 w-full px-3 py-1 text-gray-700 bg-white my-4 shadow-sm focus:ring-2 focus:ring-blue-400"
                    />
                </div>
                <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                        <table className="min-w-full border-collapse border border-black ">
                            <thead>
                                <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] uppercase">
                                    <th className="border border-black px-4 py-2">SL No</th>
                                    <th className="border border-black px-4 py-2">Application Date</th>
                                    <th className="border border-black px-4 py-2">Reference ID</th>
                                    <th className="border border-black px-4 py-2">Name of the Organization</th>
                                    <th className="border border-black px-4 py-2">Name of the Applicant</th>
                                    <th
                                        className="border border-black px-4 py-2 text-center"
                                        colSpan={maxServicesCount}
                                    >
                                        SCOPE OF SERVICES
                                    </th>

                                </tr>
                            </thead>
                            <tbody className="overflow-auto">
                                {loading ? (
                                    <tr className="">
                                        <td colSpan="12" className="w-full py-10 h-10  text-center">
                                            <div className="flex justify-center  items-center w-full h-full">
                                                <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="w-full py-10 h-10 text-center text-red-500">
                                            {responseError && responseError !== "" ? responseError : "No data available in table"}
                                        </td>
                                    </tr>
                                ) : (
                                    paginateData(filteredData).map((row, index) => (
                                        <tr key={row.applicationId}>
                                            <td className="border border-black text-center px-4 py-2">{index + 1}</td>
                                            <td className="border border-black px-4 py-2 whitespace-nowrap">{formatDate(row.applicationDate)}</td>
                                            <td className="border border-black px-4 py-2 whitespace-nowrap">{row.applicationId}</td>
                                            <td className="border border-black px-4 py-2">{row?.customerName}</td>
                                            <td className="border border-black px-4 py-2">{row?.applicationName}</td>
                                            {Object.keys(row?.services_status).map((service) => (
                                                <td key={service} className="border border-black whitespace-nowrap text-center px-4 py-2">
                                                    {service}
                                                </td>
                                            ))}
                                            {[...Array(maxServicesCount - Object.keys(row?.services_status).length)].map((_, i) => (
                                                <td key={`empty-${row?.applicationId}-${i}`} className="border border-black px-4 py-2"></td>
                                            ))}



                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="flex justify-between mt-4">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <div>
                        Page {currentPage} of {totalPages}
                    </div>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrepareReport;
