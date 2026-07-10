import React, { useCallback, useEffect, useState,useRef } from "react";
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
const ApplicationStatus = () => {
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


    const [tableData, setTableData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filters, setFilters] = useState({
        reportGeneratedBy: '',
        qcStatusFetch: '',
        reportDate: null,
        qcDate: null,
        qcStatus: '',
        reportGeneratedByMonth: ''
    });

    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200,500,1000];
    const fetchData = useCallback(() => {
        setLoading(true); // Set loading to true before starting the fetch
        setApiLoading(true);

        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            headers: {
                'Content-Type': 'application/json',
            },
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/report-master/application-tracker?admin_id=${adminId}&_token=${token}`, requestOptions)
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
                setApiLoading(false);

                const newToken = result.token || result._token || token;
                if (newToken) {
                    console.log('token saved', newToken)
                    localStorage.setItem("_token", newToken);
                }

                // Flatten the response structure to match the table columns
                const flattenedData = result.result.flatMap(customer =>
                    customer.branches.flatMap(branch =>
                        branch.applications.map(application => ({
                            customerId: customer.customer_id,
                            customerName: application.application_name,
                            customerUniqueId: application.application_id,
                            applicationId: application.application_id,
                            applicationName: application.application_name,
                            clientApplicationId: application.client_application_id,
                            overall_status: application.overall_status,
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
                setApiLoading(false);

            });
    }, []); // empty dependency array ensures it only runs once when component mounts

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin(); // Verify admin first
                    await fetchData();
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchData]);

    // Pagination logic: Slice the data to only show the current page
    const paginateData = (data) => {
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        return data.slice(startIndex, endIndex);
    };

    // Calculate total pages
    const totalPages = Math.ceil(filteredData.length / entriesPerPage);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    // Handle filter change
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({ ...filters, [name]: value });
    };
    const handleDateChange = (date, fieldName) => {
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : '';
        handleFilterChange({
            target: {
                name: fieldName,
                value: formattedDate
            }
        });
    };
    // Handle form submission and filtering
    const handleSubmit = (e) => {
        e.preventDefault();

        // Log the filters to track which one is clicked and its value
        console.log("Filters applied:", filters);

        // Filter the table data based on the selected filters
        const result = tableData.filter(item => {
            return (
                (filters.reportGeneratedBy ? item.reportGeneratorName === filters.reportGeneratedBy : true) &&
                (filters.qcStatusFetch ? item.qcDoneByName === filters.qcStatusFetch : true) &&
                (filters.reportDate ? new Date(item.reportDate).toDateString() === new Date(filters.reportDate).toDateString() : true) &&
                (filters.qcDate ? new Date(item.qcDate).toDateString() === new Date(filters.qcDate).toDateString() : true) &&
                (filters.reportGeneratedByMonth ? item.reportDate?.startsWith(filters.reportGeneratedByMonth) : true) &&
                (filters.qcStatus ? item.qcStatus === filters.qcStatus : true) &&
                (filters.overall_status ? item.overall_status === filters.overall_status : true)




            );
        });

        // Update the filtered data state
        setFilteredData(result);
        setCurrentPage(1);  // Reset to the first page after filtering
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
            // Extract dynamic columns from services_status and handle missing values
            const servicesStatus = item.services_status || {};
            const dynamicColumns = Object.keys(servicesStatus)
                .map((service) => `${service}`) // Default to "N/A" if value is missing
                .join(", "); // Join all entries with commas

            return {
                "SL No": (currentPage - 1) * entriesPerPage + index + 1,
                "Reference ID": item.customerUniqueId,
                "Name of the Applicant": item.customerName || "N/A",
                "Scope of the Services": dynamicColumns, // Assign formatted string
                "Component Status": item.overall_status || "N/A",
                "Report Data": "GENERATE REPORT", // Placeholder for the button column
            };
        });

        // Create worksheet and workbook
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

        // Write the workbook and download it
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const data = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(data, "ClientsData.xlsx");
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
                <div>
                    <button
                        onClick={handleDownload}
                        className="bg-green-500 text-white rounded px-4 py-2 mb-2  hover:scale-105 hover:bg-green-600 border"
                    >
                        Export to Excel
                    </button>
                </div>
                <select
                    value={entriesPerPage}
                    onChange={(e) => {
                        setEntriesPerPage(Number(e.target.value));
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

                <form onSubmit={handleSubmit} className="md:flex flex-wrap justify-center items-center space-x-4 md:p-4 md:px-0">

                    <div class="overflow-x-auto">
                        <table class="min-w-full border-collapse border border-gray-400 shadow-md">
                            <thead className="bg-[#c1dff2]">
                                <tr class=" uppercase text-gray-700 bg-[#c1dff2]">
                                    <th class="border border-gray-400 px-4 py-2">Report Generated By</th>
                                    <th class="border border-gray-400 px-4 py-2">QC Status Fetch</th>
                                    <th class="border border-gray-400 px-4 py-2">REPORT MONTH</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="">
                                    <td class="border border-gray-400 px-4 py-2">
                                        <select id="reportGeneratedBy" name="reportGeneratedBy" class="w-full  rounded border-gray-300 bg-gray-100 p-2" onChange={handleFilterChange}>
                                            <option value="">Select an option</option>
                                            {tableData.length === 0 || !tableData.some(row => row.reportGeneratorName) ? (
                                                <option disabled>No data available</option>
                                            ) : (
                                                tableData
                                                    .map(row => row.reportGeneratorName)
                                                    .filter((name, index, self) => name && self.indexOf(name) === index)
                                                    .map((name, index) => <option key={index} value={name}>{name}</option>)
                                            )}
                                        </select>
                                        <DatePicker
                                            selected={filters.reportDate}
                                            onChange={(date) => handleDateChange(date, 'reportDate')}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Select date"
                                            className="uppercase w-full bg-gray-100 p-2 rounded border-gray-300 mt-2"
                                        />                </td>
                                    <td class="border border-gray-400 px-4 py-2">
                                        <select id="qcStatusFetch" name="qcStatusFetch" class="w-full bg-gray-100 p-2 rounded border-gray-300" onChange={handleFilterChange}>
                                            <option value="">Select a status</option>
                                            {tableData.length === 0 || !tableData.some(row => row.qcDoneByName) ? (
                                                <option disabled>No data available</option>
                                            ) : (
                                                tableData
                                                    .map(row => row.qcDoneByName)
                                                    .filter((name, index, self) => name && self.indexOf(name) === index)
                                                    .map((name, index) => <option key={index} value={name}>{name}</option>)
                                            )}
                                        </select>
                                        <DatePicker
                                            selected={filters.qcDate}
                                            onChange={(date) => handleDateChange(date, 'qcDate')}
                                            dateFormat="dd-MM-yyyy"
                                            placeholderText="Select date"
                                            className="uppercase w-full bg-gray-100 p-2 rounded border-gray-300 mt-2"
                                        />                </td>
                                    <td class="border border-gray-400 px-4 py-2">
                                        <input type="month" id="reportGeneratedByMonth" name="reportGeneratedByMonth" class="w-full bg-gray-100 p-2 rounded border-gray-300" onChange={handleFilterChange} />
                                    </td>
                                  
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-center mt-6">
                        <button
                            type="submit"
                            className="px-8 py-3 bg-[#2c81ba] text-white rounded-md font-bold hover:scale-105 hover:bg-[#0f5381] transition"
                        >
                            Submit
                        </button>
                    </div>


                </form>


             <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                    <table className="min-w-full border-collapse border border-black overflow-scroll">
                        <thead>
                            <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b] uppercase">
                                <th className="border border-black px-4 py-2">SL No</th>
                                <th className="border border-black px-4 py-2">Application Date</th>
                                <th className="border border-black px-4 py-2">Reference ID</th>
                                <th className="border border-black px-4 py-2">Name of the Applicant</th>
                                <th
                                    className="border border-black px-4 py-2 text-center"
                                    colSpan={maxServicesCount}
                                >
                                    SCOPE OF SERVICES
                                </th>
                                <th className="border border-black px-4 py-2">Report Date</th>
                                <th className="border border-black px-4 py-2">Report prepared by</th>
                                <th className="border border-black px-4 py-2">Qc Done By</th>
                            </tr>
                        </thead>
                        <tbody className="overflow-scroll">
                            {loading ? (
                                <tr>
                                    <td colSpan={10} className="w-full py-10 h-10 text-center">
                                        <div className="flex justify-center items-center w-full h-full">
                                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="w-full py-10 h-10 text-center text-red-500">
                                        {responseError && responseError !== "" ? responseError : "No data available in table"}                                    </td>
                                </tr>
                            ) : (
                                paginateData(filteredData).map((row, index) => (
                                    <tr key={row.applicationId}>
                                        <td className="border border-black text-center px-4 py-2">{index + 1}</td>
                                        <td className="border border-black px-4 py-2 whitespace-nowrap">{formatDate(row.applicationDate)}</td>
                                        <td className="border border-black px-4 py-2">{row.customerUniqueId}</td>
                                        <td className="border border-black px-4 py-2">{row.customerName}</td>

                                        {Object.keys(row.services_status).map((service) => (
                                            <td key={service} className="border border-black whitespace-nowrap text-center px-4 py-2">
                                                {service}
                                            </td>
                                        ))}

                                        {/* Add empty cells if needed to maintain balance */}
                                        {[...Array(maxServicesCount - Object.keys(row.services_status).length)].map((_, i) => (
                                            <td key={`empty-${row.applicationId}-${i}`} className="border border-black px-4 py-2"></td>
                                        ))}
                                        <td className="border border-black px-4 py-2 uppercase text-center">{formatDate(row.reportDate)}</td>
                                        <td className="border border-black px-4 py-2 uppercase text-center">{row.reportGeneratorName}</td>
                                        <td className="border border-black px-4 py-2 uppercase text-center">{row.qcDoneByName}</td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>


                    {/* Pagination */}

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

export default ApplicationStatus;
