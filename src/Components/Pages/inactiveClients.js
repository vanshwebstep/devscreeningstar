import { useEffect, useState, useCallback, useRef } from "react";
import axios from 'axios';
import Swal from 'sweetalert2'
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import Default from "../../imgs/default.png"

const InactiveClients = () => {
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [responseError, setResponseError] = useState(null);


    const [isUnblockLoading, setIsUnblockLoading] = useState(false);
    const navigate = useNavigate();
    const [inactiveClients, setInactiveClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const storedToken = localStorage.getItem('token');
    const [searchTerm, setSearchTerm] = useState('');

    const [activeId, setActiveId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const totalPages = Math.ceil(inactiveClients.length / entriesPerPage);

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


    const fetchInactiveClients = useCallback(async () => {
        setApiLoading(true);
        setLoading(true);

        try {
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
            const storedToken = localStorage.getItem("_token");

            if (!storedToken) {
                throw new Error("Authentication error: No token found. Please log in.");
            }

            const response = await fetch(
                `https://api.screeningstar.co.in/customer/inactive-list?admin_id=${admin_id}&_token=${storedToken}`,
                {
                    method: "GET",
                    redirect: "follow",
                }
            );
            const result = await response.json();

            // Update the token if a new one is provided in the response
            const newToken = result.token || result._token || storedToken || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (!response.ok) {
                Swal.fire('Error!', `${result.message}`, 'error');
                setResponseError(result.message);
                throw new Error(`Network error: ${response.status} ${response.statusText}`);
            }


            // Set the inactive clients
            setInactiveClients(result.customers);
        } catch (error) {
            console.error("Error fetching inactive accounts:", error.message);
            setError(error.message);
        } finally {
            setApiLoading(false);
            setLoading(false);
        }
    }, []); // Memoize with an empty dependency array to avoid re-creation
    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin(); // Verify admin first
                    await fetchInactiveClients();
                }
            } catch (error) {
                console.error(error.message);

            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchInactiveClients]);

    const handleUnblock = async (id) => {
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
            text: "You are about to unblock this customer.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, unblock it!",
        });

        if (confirmation.isConfirmed) {
            setIsUnblockLoading(true);
            setApiLoading(true);

            setActiveId(id); // Set loading state to true
            try {
                const response = await fetch(
                    `https://api.screeningstar.co.in/customer/active?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
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

                Swal.fire("Unblocked!", "The customer has been unblocked successfully.", "success");

                fetchInactiveClients(); // Refresh active accounts
            } catch (error) {
                console.error("Failed to unblock customer:", error);
                Swal.fire("Error", "Failed to unblock the customer. Please try again.", "error");
            } finally {
                setIsUnblockLoading(false);
                setApiLoading(false);

                setActiveId(null);
            }
        }
    };
    const Loader = () => (
        <div className="flex w-full bg-white  justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );

    const currentData = inactiveClients.slice(
        (currentPage - 1) * entriesPerPage,
        currentPage * entriesPerPage
    );
    const changePage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    const renderPageNumbers = () => {
        const visiblePages = 5; // Number of page buttons to show
        const pageNumbers = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - 2 && i <= currentPage + 2)
            ) {
                pageNumbers.push(i);
            } else if (
                pageNumbers[pageNumbers.length - 1] !== "..."
            ) {
                pageNumbers.push("...");
            }
        }
        return pageNumbers.map((number, index) => (
            <button
                key={index}
                onClick={() => number !== "..." && changePage(number)}
                className={`px-4 py-2 rounded ${number === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300"
                    } ${number === "..." ? "cursor-default" : ""}`}
                disabled={number === "..."}
            >
                {number}
            </button>
        ));
    };
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };


    const filteredData = currentData.filter(client => {
        return client.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    // Handle the change in search input
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1)
    };

    const handleDownloadExcel = () => {
        const wb = XLSX.utils.book_new();

        const data = filteredData.map((client, index) => [
            (currentPage - 1) * entriesPerPage + index + 1,
            client.client_unique_id,
            client.name,
            client.address,
            client.emails ? JSON.parse(client.emails).join(', ') : 'NIL',
            client.state,
            client.state_code,
            client.gst_number,
            client.mobile,
            client.tat_days,
            client.agreement_date
                ? new Date(client.agreement_date).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })
                : 'NIL',
            client.client_standard,
            client.agreement_duration
                ? new Date(client.agreement_duration).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                })
                : 'NIL',
            client.custom_template || 'NIL',
            client.logo ? 'Logo Exists' : 'No Logo',
        ]);

        const ws = XLSX.utils.aoa_to_sheet([
            ['SL', 'Client ID', 'Company Name', 'Registered Address', 'Email', 'State', 'State Code', 'GST Number', 'Mobile Number', 'TAT', 'Date of Service Agreement', 'Standard Process', 'Agreement Period', 'Custom Template', 'Upload Client Logo', 'Scope of Services'],
            ...data
        ]);

        XLSX.utils.book_append_sheet(wb, ws, 'Clients');
        XLSX.writeFile(wb, 'Inaactive_clients.xlsx');
    };
    const handleDelete = useCallback((id) => {
        // Initialize the delete loading state


        // Show confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: `This action will delete the customer. You can't undo this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                setIsDeleteLoading(true); // Start the loading state
                setActiveId(id);
                // Get admin ID and token from localStorage
                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");
                const formdata = new FormData();

                const requestOptions = {
                    method: "DELETE",
                    body: formdata,
                    redirect: "follow",
                };

                // Perform the DELETE request to delete the customer
                fetch(`https://api.screeningstar.co.in/customer/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
                    .then((response) => response.text())
                    .then((result) => {
                        const newToken = result.token || result._token || storedToken || '';
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }
                        fetchInactiveClients(); // Refresh the list of active accounts
                        Swal.fire('Deleted!', 'The customer has been deleted.', 'success');
                    })
                    .catch((error) => {
                        console.error(error);
                        Swal.fire('Error!', 'There was an issue deleting the customer.', 'error');
                    })
                    .finally(() => {
                        setIsDeleteLoading(false);
                        setActiveId(null); // Stop the loading state
                    });
            } else {
                Swal.fire('Cancelled', 'The customer deletion was cancelled.', 'info');
            }
        });
    }, [fetchInactiveClients]);
     useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [filteredData, loading]); 

    return (
        <div className="">
            <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto">
                <div className='md:flex justify-between items-center'>
                    <div className=" text-left ">
                        <div>
                            <button
                                className="bg-green-500 hover:scale-105 text-white px-6 py-2 rounded"
                                onClick={handleDownloadExcel}
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
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white my-4 shadow-sm focus:ring-2 focus:ring-blue-400"
                        >
                            {optionsPerPage.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="mb-4 md:w-1/2 text-right">
                        <input
                            type="text"
                            placeholder="Search by Company Name"
                            className="w-full rounded-md p-2.5 border border-gray-300"
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
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
                                <thead className="rounded-lg">
                                    <tr className="bg-[#c1dff2] text-[#4d606b] whitespace-nowrap">
                                        {/* Table Headers */}
                                        <th className=" uppercase border border-black px-4 py-2">SL</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Client ID</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Organization Name</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Registered Address</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Email</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">State</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">State Code</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">GST Number</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Mobile Number</th>
                                        <th className=" uppercase border border-black px-4 py-2">TAT</th>
                                        <th className=" uppercase border border-black px-4 py-2">Date of Agreement</th>
                                        <th className=" uppercase border border-black px-4 py-2">Standard Process</th>
                                        <th className=" uppercase border border-black px-4 py-2">Agreement Period</th>
                                        <th className=" uppercase border border-black px-4 py-2">Custom Template</th>
                                        <th className=" uppercase border border-black px-4 py-2">Upload Client logo</th>
                                        <th className=" uppercase border border-black px-4 py-2">Additional login required?</th>
                                        <th className=" uppercase border border-black px-4 py-2" colSpan={2}>
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                {loading ? (
                                    <tbody className="h-10">
                                        <tr className="">
                                            <td colSpan="12" className="w-full py-10 h-10  text-center">
                                                <div className="flex justify-center  items-center w-full h-full">
                                                    <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                ) : (
                                    <tbody>
                                        {filteredData.length === 0 ? (
                                            <tr>
                                                <td colSpan="21" className="text-center py-4 text-red-500">
                                                    {responseError && responseError !== "" ? responseError : "No data available in table"}
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredData.map((client, index) => (
                                                <tr key={client.clientId} className="text-center border-b border-gray-300">
                                                    <td className="border border-black px-4 py-2">{(currentPage - 1) * entriesPerPage + index + 1}</td>
                                                    <td className="border border-black px-4 whitespace-nowrap py-2 text-left">{client.client_unique_id}</td>
                                                    <td className="border border-black px-4 py-2 whitespace-nowrap min-w-[200px] text-left">{client.name}</td>
                                                    <td className="border border-black px-4 py-2 text-left">{client.address}</td>
                                                    <td className="border border-black px-4 py-2 text-left">
                                                        {client.emails ? JSON.parse(client.emails).join(', ') : 'NIL'}
                                                    </td>
                                                    <td className="border border-black px-4 py-2 text-left">{client.state}</td>
                                                    <td className="border border-black px-4 py-2 text-left">{client.state_code}</td>
                                                    <td className="border border-black px-4 py-2 min-w-[200px] text-left">{client.gst_number}</td>
                                                    <td className="border border-black px-4 py-2 min-w-[200px] text-left">{client.mobile}</td>
                                                    <td className="border border-black px-4 whitespace-nowrap py-2">{client.tat_days}</td>
                                                    <td className="border border-black px-4 py-2 min-w-[300px]">


                                                        {client.agreement_date
                                                            ? new Date(client.agreement_date).toLocaleDateString('en-GB').replace(/\//g, '-')
                                                            : 'NIL'}


                                                    </td>
                                                    <td className="border border-black px-4 uppercase py-2 min-w-[300px]">{client.client_standard}</td>
                                                    <td className="border border-black px-4 py-2">
                                                        {client.agreement_duration}
                                                    </td>
                                                    <td className="border border-black px-4 uppercase py-2">{client.custom_template || 'NIL'}</td>
                                                    <td className="border border-black px-4 py-2">
                                                        <img
                                                            src={client.logo ? client.logo : `${Default}`}
                                                            alt="Client Logo"
                                                            className="w-10 m-auto h-10"
                                                        />
                                                    </td>
                                                    <td className="border uppercase border-black px-4 py-2">
                                                        {client.additional_login == 1 ? 'yes' : 'no'}
                                                    </td>
                                                    <td className="border border-black px-4 py-2 ">
                                                        <button
                                                            onClick={() => handleUnblock(client.main_id)}
                                                            disabled={isUnblockLoading && activeId === client.main_id}
                                                            className={`bg-red-500 hover:bg-red-600 hover:scale-105 text-white px-4 py-2 rounded mr-3 ${isUnblockLoading && activeId === client.main_id ? "opacity-50 cursor-not-allowed" : ""} `}
                                                        >
                                                            Unblock
                                                        </button>
                                                    </td>
                                                    <td className="border border-black px-4 py-2 ">
                                                        <button
                                                            onClick={() => handleDelete(client.main_id)}
                                                            disabled={isDeleteLoading && activeId == client.main_id}
                                                            className={`bg-[#073d88] hover:scale-105 hover:bg-[#12253f] text-white px-4 py-2 rounded ${isDeleteLoading && activeId == client.main_id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                        >
                                                            Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
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
export default InactiveClients;