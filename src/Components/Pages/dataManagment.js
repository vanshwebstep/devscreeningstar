import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';
import Default from "../../imgs/default.png"

const DataManagement = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(null);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [uniqueHeadings, setUniqueHeadings] = useState([]);
    const fetchedRowsRef = useRef(new Set()); // Track fetched rows
    const uniqueHeadingsSet = useRef(new Set());
    const [responseError, setResponseError] = useState(null);
    const [data, setData] = useState([]);
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');
    const [clientData, setClientData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCases, setActiveCases] = useState(null);
    const [nonHeadBranchData, setNonHeadBranchData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isBlockLoading, setIsBlockLoading] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [excelLoading, setExcelLoading] = useState(null);
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
    const [parentName, setParentName] = useState("N/A");

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const totalPages = Math.ceil(clientData?.length / rowsPerPage);
    const paginatedDataw = data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handlePageChange = (page) => {
        ;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }
    const handleExportToExcel = () => {
        setTimeout(() => {
            const table = document.getElementById("exceltable"); // Get the latest table
            if (!table) {
                console.error("Table not found!");
                return;
            }
            const ws = XLSX.utils.table_to_sheet(table, { raw: true }); // Convert table to sheet
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Report Data");

            XLSX.writeFile(wb, "Report_Data.xlsx");
            setExcelLoading(null)
            // fetchDataw();
            window.location.reload();
        }, 500); // Small delay to ensure table updates
    };


    const fetchData = useCallback(() => {
        setLoading(true);
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

        fetch(`https://api.screeningstar.co.in/data-management/list?admin_id=${adminId}&_token=${token}`, requestOptions)
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
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setClientData(result.customers);

                setLoading(false);
            })
            .catch((error) => console.error(error)).finally(() => {
                setLoading(false);
                setApiLoading(false);

            });
    }, []);



    const fetchDataw = async (branchId) => {
        if (!adminId || !token) {
            Swal.fire({
                icon: "warning",
                title: "Missing Data",
                text: "Required parameters are missing.",
            });
            return;
        }
        if (branchId) {
            setExcelLoading(branchId);
        }

        const requestOptions = {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`, // If required by API
            },
        };

        try {
            const response = await fetch(
                `https://api.screeningstar.co.in/data-management/applications-by-branch?branch_id=${branchId}&admin_id=${adminId}&_token=${token}`,
                requestOptions
            );

            if (!response.ok) {
                setExcelLoading(null);

                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json();

            if (!Array.isArray(result.customers) || result.customers.length === 0) {
                Swal.fire({
                    icon: "warning",
                    title: "No Data",
                    text: "No data available in the table.",
                });
                setExcelLoading(null);

            }

            setData(result.customers || []);
            setParentName(result.parentName || "");

            // Handle token updates
            const newToken = result.token || result._token;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
        } catch (error) {
            setExcelLoading(null);

            console.error("Fetch error:", error);
            Swal.fire({
                icon: "error",
                title: "Fetch Error",
                text: "Failed to fetch data. Please try again later.",
            });
        }
    };


    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin();
                    // Verify admin first
                    await fetchData();
                } // Fetch data after verification
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchData]);
    const fetchAllServicesData = async () => {
        try {
            const applicationServiceMap = new Map();

            data.forEach(row => {
                const servicesList = row.services ? row.services.split(',') : [];
                if (!fetchedRowsRef.current.has(row.application_id)) {
                    if (!applicationServiceMap.has(row.application_id)) {
                        applicationServiceMap.set(row.application_id, []);
                    }
                    applicationServiceMap.get(row.application_id).push(...servicesList);
                }
            });

            const results = [];

            // Fetch one by one using for...of
            for (const [applicationId, servicesList] of applicationServiceMap.entries()) {
                try {
                    const uniqueServices = [...new Set(servicesList)];
                    const fetchedServices = await fetchServicesData(applicationId, uniqueServices);
                    setExcelLoading(null);

                    fetchedServices.forEach(service => {
                        const heading = getServiceHeading(service.reportFormJson);
                        if (heading) uniqueHeadingsSet.current.add(heading);
                    });

                    results.push({ applicationId, fetchedServices });
                } catch (error) {
                    console.error(`Error fetching data for application ID ${applicationId}:`, error);
                    setExcelLoading(null);
                    return; // Stop further execution if an error occurs
                }
            }

            const updatedData = data.map(row => {
                const matchingResult = results.find(result => result.applicationId === row.application_id);
                return matchingResult ? { ...row, fetchedServices: matchingResult.fetchedServices } : row;
            });

            setUniqueHeadings([...uniqueHeadingsSet.current]);
            console.log(`updatedData - `, updatedData);
            setData(updatedData);
            setLoading(false);
            handleExportToExcel();
        } catch (error) {
            console.error("Error in fetchAllServicesData:", error);
            setExcelLoading(null);
            setLoading(false);
        }
    };


    useEffect(() => {
        if (data.length > 0 && !hasFetchedDataRef.current) {
            hasFetchedDataRef.current = true; // Run only once
            fetchAllServicesData();
        }
    }, [data]);

    const getServiceHeading = (reportFormJson) => {
        try {
            if (!reportFormJson || typeof reportFormJson.json !== 'string') {
                console.error("Invalid reportFormJson:", reportFormJson);
                return undefined;
            }

            const parsedJson = JSON.parse(reportFormJson.json);
            return parsedJson?.heading?.trim() || undefined;
        } catch (error) {
            console.error('Error parsing JSON:', error);
            return undefined;
        }
    };

    const handleCheckIn = (main_id) => {
        // Toggle off if the same client is clicked again
        if (activeCases?.main_id === main_id) {
            setActiveCases(null);
            setNonHeadBranchData([]);
            return;
        }

        setIsLoading(main_id); // Set loading state to true
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(
            `https://api.screeningstar.co.in/data-management/branch-list-by-customer?customer_id=${main_id}&admin_id=${adminId}&_token=${token}`,
            requestOptions
        )
            .then((response) => response.json())
            .then((result) => {
                // Update token in localStorage if a new one is provided
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                // Set active client and branch data
                setActiveCases({ main_id });
                setNonHeadBranchData(result.customers || []);
            })
            .catch((error) => {
                console.error("Error fetching branch list:", error);
            })
            .finally(() => {
                setIsLoading(null); // Reset loading state
            });
    };


    const handleDelete = (main_id) => {
        // Handle delete functionality here
    };
    const handleCheckInGo = (branch_id, main_id) => {
        navigate(`/admin-DataCheckin?clientId=${main_id}&branchId=${branch_id}`);
    };
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1)
    };

    const filteredData = clientData?.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const paginatedData = filteredData?.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const filteredDataw = paginatedDataw.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const handleBlock = async (id) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        // Check if admin_id or storedToken is missing
        if (!admin_id || !storedToken) {
            console.error("Missing admin_id or _token");
            return;
        }

        // Show confirmation alert
        const confirmation = await Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, block it!",
        });

        if (confirmation.isConfirmed) {
            setIsBlockLoading(true);
            setActiveId(id);
            try {
                const response = await fetch(
                    `https://api.screeningstar.co.in/customer/inactive?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
                    {
                        method: "GET",
                        redirect: "follow",
                    }
                );
                const result = await response.json();

                const newToken = result.token || result._token || storedToken;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }

                Swal.fire("Blocked!", "The customer has been blocked successfully.", "success");

                fetchData(); // Refresh active accounts
            } catch (error) {
                console.error("Failed to block customer:", error);
            } finally {
                setIsBlockLoading(false);
                setActiveId(null); // Reset loading state
            }
        }
    };
    const hasFetchedDataRef = useRef(false); // Prevent multiple fetch calls

    const fetchServicesData = async (applicationId, servicesList) => {
        if (!servicesList || servicesList.length === 0 || fetchedRowsRef.current.has(applicationId)) return [];

        fetchedRowsRef.current.add(applicationId); // Mark as fetched

        try {
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${encodeURIComponent(servicesList.join(','))}&application_id=${encodeURIComponent(applicationId)}&admin_id=${encodeURIComponent(adminId)}&_token=${encodeURIComponent(token)}`;
            const response = await fetch(url, { method: "GET" });
            const result = await response.json();

            // Update token if present
            if (result.token || result._token) {
                localStorage.setItem("_token", result.token || result._token || token);
            }

            // Ensure result.results is an array before filtering
            return Array.isArray(result.results) ? result.results.filter(item => item != null && item !== undefined) : [];
        } catch (error) {
            console.error("Error fetching service data:", error);
            return [];
        }
    };

    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [paginatedData, loading]);

    const getServiceStatus = (annexureData) => {
        return annexureData && annexureData.status !== null ? annexureData.status : ' INITIATED';
    };
    return (
        <div className="">
            <div className="bg-white border border-black md:p-12 p-6 w-full mx-auto">

                <div className='flex justify-between items-baseline mb-3' >

                    <div className="w-1/2 text-left">
                        <input
                            type="text"
                            placeholder="Search by Name"
                            className="w-full rounded-md p-2.5 border border-gray-300"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-2  shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                        <table className="min-w-full border-collapse border border-black rounded-lg">
                            <thead>
                                <tr className="bg-[#c1dff2] text-left text-[#4d606b] whitespace-nowrap">
                                    <th className="uppercase border border-black px-4 py-2 text-center">SL</th>
                                    <th className="uppercase border border-black px-4 py-2">Client ID</th>
                                    <th className="uppercase border border-black px-4 py-2">Organization Name</th>
                                    <th className="uppercase border border-black px-4 py-2 text-center" colspan={2} >Action</th>
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
                                <tbody>
                                    {paginatedData?.length > 0 ? (
                                        paginatedData?.map((item, index) => (
                                            <React.Fragment key={item.client_unique_id}>
                                                <tr className="text-left">
                                                    <td className="border border-black px-4 py-2 text-center">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                                    <td className="border border-black px-4 py-2">{item.client_unique_id}</td>
                                                    <td className="border border-black px-4 py-2">{item.name || 'N/A'}</td>


                                                    {item.head_branch_applications_count >= 0 && (
                                                        <td className="border border-black px-4 py-2 text-center">
                                                            <div className=' md:block  flex whitespace-nowrap '>
                                                                {item.application_count <= item.head_branch_applications_count ? (
                                                                    <>                                                                <button
                                                                        className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                                                        onClick={() => handleCheckInGo(item.head_branch_id, item.main_id)}
                                                                    >
                                                                        CHECK IN
                                                                    </button>


                                                                    </>
                                                                ) : item.application_count > item.head_branch_applications_count && item.head_branch_applications_count > 0 ? (
                                                                    // Condition 2: Show both CHECK IN and VIEW BRANCHES buttons
                                                                    <>
                                                                        <button
                                                                            className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                                                            onClick={() => handleCheckInGo(item.head_branch_id, item.main_id)}
                                                                        >
                                                                            CHECK IN
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleCheckIn(item.main_id)}
                                                                            className={`ml-2 px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 transition-transform duration-300 ease-in-out transform ${isLoading === item.main_id
                                                                                ? 'opacity-50 cursor-not-allowed'
                                                                                : activeCases && activeCases.main_id === item.main_id
                                                                                    ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300'
                                                                                    : 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300'
                                                                                } ${!isLoading && 'hover:scale-105'}`}
                                                                            disabled={isLoading === item.main_id}
                                                                        >
                                                                            {activeCases && activeCases.main_id === item.main_id ? 'Less' : 'VIEW BRANCHES'}
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    // Condition 3: Show only VIEW BRANCHES button
                                                                    item.head_branch_applications_count === 0 && item.application_count > 0 && (
                                                                        <button
                                                                            onClick={() => handleCheckIn(item.main_id)}
                                                                            className={`px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 transition-transform duration-300 ease-in-out transform ${isLoading === item.main_id
                                                                                ? 'opacity-50 cursor-not-allowed'
                                                                                : activeCases && activeCases.main_id === item.main_id
                                                                                    ? 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300'
                                                                                    : 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300'
                                                                                } ${!isLoading && 'hover:scale-105'}`}
                                                                            disabled={isLoading === item.main_id}
                                                                        >
                                                                            {activeCases && activeCases.main_id === item.main_id ? 'Less' : 'VIEW BRANCHES'}
                                                                        </button>
                                                                    )
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="border border-black px-4 py-2">
                                                        <div className='flex justify-center items-center'>
                                                            <button
                                                                className="px-4 py-2 text-white rounded-md font-bold bg-blue-500 hover:bg-blue-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                                                onClick={() => fetchDataw(item.head_branch_id)}
                                                            >
                                                                {excelLoading === item.head_branch_id ? "Exporting..." : "EXPORT"}
                                                            </button>
                                                        </div>
                                                    </td>
                                                    {/* <td className="border border-black text-center px-4 py-2">
                                                <button
                                                    onClick={() => handleBlock(item.main_id)}
                                                    disabled={isBlockLoading && activeId === item.main_id}
                                                    className={`px-4 py-2 text-white font-semibold  bg-red-500 hover:bg-red-600 rounded-md transition-transform duration-300 ease-in-out ${isBlockLoading && activeId === item.main_id
                                                            ? 'opacity-50 cursor-not-allowed'
                                                            : 'bg-red-500 hover:bg-red-600 focus:ring-2 focus:ring-red-300 hover:scale-105'
                                                        }`}
                                                >
                                                    {isBlockLoading && activeId === item.main_id ? 'Blocking...' : 'Block'}
                                                </button>
                                            </td> */}
                                                </tr>
                                                {activeCases && activeCases.main_id === item.main_id && nonHeadBranchData.length > 0 && (
                                                    <tr className="text-center py-4">
                                                        <td colSpan="7" className="border border-black px-4 py-8">
                                                            <table className="w-full mt-2">
                                                                <thead>
                                                                    <tr className="bg-gray-300">
                                                                        <th className=" uppercase border border-black px-4 py-2">SL</th>
                                                                        <th className=" uppercase border border-black px-4 py-2">Branch Name</th>
                                                                        <th className=" uppercase border border-black px-4 py-2">Application Count</th>
                                                                        <th className=" uppercase border border-black px-4 py-2">CHECK IN</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {nonHeadBranchData.map((branch, index) => (
                                                                        <tr key={branch.branch_id}>
                                                                            <td className="border border-black px-4 py-2">{index + 1}</td>
                                                                            <td className="border border-black px-4 py-2">{branch.branch_name}</td>
                                                                            <td className="border border-black px-4 py-2">{branch.application_count}</td>

                                                                            <td className="border border-black px-4 py-2">
                                                                                <button
                                                                                    className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105  transition-transform duration-300 ease-in-out transform"
                                                                                    onClick={() => handleCheckInGo(branch.branch_id, item.main_id)}
                                                                                >
                                                                                    CHECK IN
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center text-red-500 p-4">
                                                {responseError && responseError !== "" ? responseError : "No data available in table"}
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
            <div className='overflow-x-scroll hidden'>

                <table id='exceltable' className="min-w-full border-collapse border border-black overflow-scroll rounded-lg whitespace-nowrap">
                    <thead className='rounded-lg'>
                        <tr className="bg-[#c1dff2] text-[#4d606b]">
                            <th className="uppercase border border-black px-4 py-2">SL NO</th>
                            <th className="uppercase border border-black px-4 py-2">Date of Initiation</th>
                            <th className="uppercase border border-black px-4 py-2">Applicant Employee Id</th>
                            <th className="uppercase border border-black px-4 py-2">Reference Id</th>
                            <th className="uppercase border border-black px-4 py-2">Photo</th>
                            <th className="uppercase border border-black px-4 py-2">Name Of Applicant</th>
                            {/* <th className="uppercase border border-black px-4 py-2">Report Data</th> */}


                            {uniqueHeadings.map((heading, idx) => (
                                <th key={idx} className="border border-black px-4 py-2">{heading}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={17} className="py-4 text-center text-gray-500">
                                    <Loader className="text-center" />
                                </td>
                            </tr>
                        ) : filteredDataw.length === 0 ? (
                            <tr>
                                <td colSpan={17} className="py-4 text-center text-gray-500">
                                    No data available in table
                                </td>
                            </tr>
                        ) : (
                            <>
                                {filteredDataw.map((data, index) => (
                                    <React.Fragment key={data.id}>
                                        <tr className="text-center">
                                            <td className="border border-black px-4 py-2">{index + 1}</td>
                                            <td className="border border-black px-4 py-2">
                                                {new Date(data.created_at).toLocaleDateString("en-GB").replace(/\//g, "-")}
                                            </td>

                                            <td className="border border-black px-4 py-2">{data.employee_id || 'NIL'}</td>
                                            <td className="border border-black px-4 py-2">{data.application_id || 'NIL'}</td>
                                            <td className="border border-black px-4 py-2 text-center">
                                                <div className='flex justify-center items-center'>
                                                    <img
                                                        src={data.photo ? data.photo : `${Default}`}
                                                        alt={data.name || 'No name available'}
                                                        className="w-10 h-10 rounded-full"
                                                    />
                                                </div>
                                            </td>
                                            <td className="border border-black px-4 py-2">{data.name || 'NIL'}</td>

                                            {/* Report Data Button */}
                                            {/* <td className="border border-black px-4 py-2">
                                                    <button
                                                        className="bg-white border border-[#073d88] text-[#073d88] px-4 py-2 rounded hover:bg-[#073d88] hover:text-white"
                                                        onClick={() => handleUpload(data.id, data.branch_id)}
                                                    >
                                                        BASIC ENTRY
                                                    </button>
                                                </td> */}

                                            {/* Service Statuses */}
                                            {uniqueHeadings.map((heading, idx) => {
                                                const service = data.fetchedServices?.find(service => getServiceHeading(service.reportFormJson) === heading);
                                                return (
                                                    <td key={idx} className="border border-black px-4 py-2">
                                                        {service ? getServiceStatus(service.annexureData) : ''}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </React.Fragment>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataManagement;
