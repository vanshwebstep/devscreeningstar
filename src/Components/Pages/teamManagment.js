import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';  // Import XLSX for Excel export
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';

const TeamManagement = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

    const [responseError, setResponseError] = useState(null);

    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [filterData, setFilterData] = useState([]);
    const [selectedValue, setSelectedValue] = useState("");

    const [clientData, setClientData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeCases, setActiveCases] = useState(null);
    const [nonHeadBranchData, setNonHeadBranchData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(null);
    const [isBlockLoading, setIsBlockLoading] = useState(false);
    const [activeId, setActiveId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000]; const totalPages = Math.ceil(clientData.length / rowsPerPage);

    const handlePageChange = (page) => {
        ;
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }

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

    const fetchData = useCallback((filterStatus = null) => {
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
        function toCamelCase(str) {
            return str
                .toLowerCase()
                .split(' ')
                .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
                .join('');
        }
        // Construct the URL dynamically
        const baseUrl = `https://api.screeningstar.co.in/client-master-tracker/list`;
        const queryParams = new URLSearchParams({
            admin_id: adminId,
            _token: token,
        });

        if (filterStatus) {
            queryParams.append('filter_status', toCamelCase(filterStatus));
        }

        const urlWithParams = `${baseUrl}?${queryParams.toString()}`;

        fetch(urlWithParams, requestOptions)
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
                setClientData(result.data.customers);
                setFilterData(result?.data?.filterOptions || []);
                setApiLoading(false);

                setLoading(false);
            })
            .catch((error) => console.error(error))
            .finally(() => {
                setApiLoading(false);
                setLoading(false);
            });
    }, []);





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

    const handleCheckIn = (main_id) => {
        if (activeCases && activeCases.main_id === main_id) {
            setActiveCases(null); // Toggle off if the same client is clicked again
            setNonHeadBranchData([]);
            return;
        }

        setIsLoading(main_id); // Set loading state for the specific client

        const admin = localStorage.getItem("admin");
        const token = localStorage.getItem("_token");

        // Validate required data
        if (!admin || !token) {
            console.error("Admin or token is missing.");
            setIsLoading(null);
            return;
        }

        const adminId = JSON.parse(admin)?.id;
        const requestOptions = {
            method: "GET",
            redirect: "follow",
        };

        fetch(`https://api.screeningstar.co.in/client-master-tracker/branch-list-by-customer?customer_id=${main_id}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                return response.json();
            })
            .then((result) => {
                const newToken = result.token || result._token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                setActiveCases({ main_id }); // Set the active client
                setNonHeadBranchData(result.customers || []); // Ensure an empty array if no customers
            })
            .catch((error) => {
                console.error("Failed to fetch branch list:", error);
            })
            .finally(() => {
                setIsLoading(null); // Reset loading state
            });
    };


    const handleDelete = (main_id) => {
        // Handle delete functionality here
    };
    const handleCheckInGo = (branch_id, main_id) => {
        navigate(`/admin-TeamManagementCheckin?clientId=${main_id}&branchId=${branch_id}`);
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

    const filteredData = clientData.filter((data) =>
        data.name.toLowerCase().includes(searchTerm.toLowerCase()) || data.client_unique_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
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

                const newToken = result.token || result._token;
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
    const statusList = Object.keys(filterData).map(key => ({
        status: key.replace(/([A-Z])/g, ' $1').toLowerCase(),  // Formatting the status name
        count: filterData[key]
    }));
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [paginatedData, loading]);

    // Filtered data based on the search query
    const filteredDropdownData = statusList.filter((item) =>
        item.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
        <div className="">
            <div className="bg-white border border-black md:p-12 p-6 w-full mx-auto">

                <div className='md:flex justify-between items-baseline mb-3' >

                    <div className="md:w-6/12 mb-2 text-left">
                        <input
                            type="text"
                            placeholder="Search by Name"
                            className="w-full rounded-md p-2.5 border capitalize border-gray-300"
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4  shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className='text-left md:w-3/12 w-1/2'>
                        <div className="relative w-full">
                            <div
                                className="w-full rounded-md p-2.5 border border-gray-300 bg-white cursor-pointer uppercase"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                {selectedValue ? (
                                    <>
                                        {selectedValue.replace(/count/gi, '').charAt(0).toUpperCase() + selectedValue.replace(/count/gi, '').slice(1)}
                                    </>
                                ) : (
                                    "Select Status"
                                )}
                            </div>

                            {/* Dropdown options */}
                            {showDropdown && (
                                <div className="absolute w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto z-10">
                                    {filteredDropdownData.length > 0 ? (
                                        <>
                                            {/* Clear Selection Option */}
                                            <div
                                                className={`p-2 hover:bg-red-100 uppercase cursor-pointer font-semibold ${selectedValue === null ? "bg-red-200" : ""
                                                    }`}
                                                onClick={() => {
                                                    setSelectedValue(null); // Reset selection
                                                    fetchData(null);
                                                    setCurrentPage(1)
                                                    setShowDropdown(false); // Close dropdown
                                                }}
                                            >
                                                Clear Selection
                                            </div>

                                            {/* Dropdown Options */}
                                            {filteredDropdownData.map((item) => (
                                                <div
                                                    key={item.status}
                                                    className={`p-2 hover:bg-gray-100  uppercase cursor-pointer ${selectedValue === item.status ? "bg-gray-200" : ""
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedValue(item.status);
                                                        fetchData(item.status); // Fetch data with selected filter
                                                        setShowDropdown(false); // Close dropdown
                                                        setCurrentPage(1)
                                                    }}
                                                >
                                                    {`${item.status.replace(/\bcount\b/gi, '').trim().charAt(0).toUpperCase() + item.status.replace(/\bcount\b/gi, '').trim().slice(1)} (${item.count})`}
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <div className="p-2 text-gray-500">No results found</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="table-container rounded-lg">
                    {/* Top Scroll */}
                    <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                        <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                    </div>

                    {/* Actual Table Scroll */}
                    <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                        <table className="min-w-full  border-collapse border border-black rounded-lg">
                            <thead>
                                <tr className="bg-[#c1dff2] text-left text-[#4d606b] whitespace-nowrap">
                                    <th className="uppercase border border-black px-4 py-2 text-center">SL</th>
                                    <th className="uppercase border border-black px-4 py-2">Client ID</th>
                                    <th className="uppercase border border-black px-4 py-2">Organization Name</th>
                                    <th className="uppercase border border-black px-4 py-2 text-center">Action</th>
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
                                    {paginatedData.length > 0 ? (
                                        paginatedData.map((item, index) => (
                                            <React.Fragment key={item.client_unique_id}>
                                                <tr className="text-left">
                                                    <td className="border border-black px-4 py-2 text-center">{(currentPage - 1) * rowsPerPage + index + 1}</td>
                                                    <td className="border border-black px-4 py-2">{item.client_unique_id}</td>
                                                    <td className="border border-black px-4 py-2">{item.name || 'N/A'}</td>
                                                    {item.head_branch_applications_count >= 0 && (
                                                        <td className="border border-black px-4 py-2 whitespace-nowrap text-center">
                                                            {item.application_count <= item.head_branch_applications_count ? (
                                                                // Condition 1: Show only CHECK IN button
                                                                <button
                                                                    className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                                                    onClick={() => handleCheckInGo(item.head_branch_id, item.main_id)}
                                                                >
                                                                    CHECK IN
                                                                </button>
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
                                                        </td>
                                                    )}

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
                                            </td>                                    </tr>
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

export default TeamManagement;
