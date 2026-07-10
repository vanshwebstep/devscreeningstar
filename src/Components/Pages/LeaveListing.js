import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import SidebarContext from '../SidebarContext'
import axios from 'axios';
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';
import Default from "../../imgs/default.png"

import swal from 'sweetalert';
const LeaveListing = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();


    const [loadingSpoc, setLoadingSpoc] = useState({});
    const [searchTerm, setSearchTerm] = useState("");

    const [files, setFiles] = useState({});
    const [currentSpocId, setCurrentSpocId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const navigate = useNavigate();
    const [spocs, setSpocs] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [clientData, setClientData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(null);
    const [error, setError] = useState(null);
    const [viewBranchesRow, setViewBranchesRow] = useState(null);
    const [branchesData, setBranchesData] = useState([]);
    const storedToken = localStorage.getItem('_token');
    const location = useLocation();
    const [currentPage, setCurrentPage] = useState(1);
    const query = new URLSearchParams(location.search);
    const emailFromQuery = query.get('email') || '';
    const [isEditing, setIsEditing] = useState(false);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const [formData, setFormData] = useState({
        ticket_date: "",
        photo: null,
        employee_name: "",
        employee_id: "",
        leave_date: "",
        purpose_of_leave: "",
        remarks: "",
        personal_manager_id: ""
    });

    let adminData;
    if (storedToken) {
        adminData = JSON.parse(localStorage.getItem('admin'))
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
    const fetchClientData = async () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        setApiLoading(true);
        try {
            const response = await fetch(
                `https://api.screeningstar.co.in/personal-manager/my-list?admin_id=${admin_id}&_token=${storedToken}`,
                { method: "GET", redirect: "follow" }
            );

            if (!response.ok) {
                setApiLoading(false)

                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            setApiLoading(false);
            const data = await response.json();
            const newToken = data.token || data._token || storedToken || '';
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (data.status) {
                setSpocs(data.services);
            } else {
                setError("Unexpected data format received.");
            }
        } catch (error) {
            setApiLoading(false);
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

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSpocs = spocs
        .filter((spoc) => spoc.employee_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(indexOfFirstItem, indexOfLastItem);
    ;
    const totalPages = Math.ceil(spocs.length / itemsPerPage);

    const handleAction = async (spocId, status) => {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');
        const raw = JSON.stringify({
            personal_manager_id: spocId,
            status: status,
            admin_id: adminId,
            _token: token
        });

        const requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        // Set loading state for this spocId and status
        setLoadingSpoc((prev) => ({ ...prev, [spocId]: status }));

        try {
            const response = await fetch("https://api.screeningstar.co.in/personal-manager/response", requestOptions);
            const result = await response.json();
            console.log("API Response:", result);

            if (result.status) {
                let message = "";

                if (status === 1) {
                    message = "Accepted";
                } else if (status === 2) {
                    message = "Rejected";
                }

                if (message) {
                    Swal.fire({
                        title: message,
                        icon: "success",
                        confirmButtonText: "OK"
                    });
                }

                // Update status for this specific spoc directly
                setSpocs((prevSpocs) =>
                    prevSpocs.map((spoc) =>
                        spoc.id === spocId ? { ...spoc, status: status } : spoc
                    )
                );
            } else {
                Swal.fire({
                    title: "Error!",
                    text: result.message || "Something went wrong. Please try again.",
                    icon: "error",
                    confirmButtonText: "OK"
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                title: "Error!",
                text: "Failed to process request. Please check your network or try again later.",
                icon: "error",
                confirmButtonText: "OK"
            });
        } finally {
            // Reset loading state for this spocId
            setLoadingSpoc((prev) => {
                const updatedLoading = { ...prev };
                delete updatedLoading[spocId]; // Remove the spocId once the action is completed
                return updatedLoading;
            });
        }
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [currentSpocs, loading]);
    const formatDate = (date) => {
        if (!date) return null; // Return null if date is undefined, null, or empty
        const dateObj = new Date(date);
        if (isNaN(dateObj)) return null; // Return null if date is invalid

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${day}-${month}-${year}`;
    };

    return (
        <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">
            <div className="space-y-4 py-[30px] md:px-[51px] px-[25px] bg-white">
                <div>
                    <div className="mb-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search by Name"
                                className="md:w-1/3 rounded-md p-2.5 border border-gray-300"
                                value={searchTerm}
                                onChange={handleSearch}
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
                    <div className="table-container rounded-lg">
                        {/* Top Scroll */}
                        <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                        </div>

                        {/* Actual Table Scroll */}
                        <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                            <table className="min-w-full border-collapse border border-black rounded-lg">
                                <thead className="rounded-lg border border-black">
                                    <tr className="bg-[#c1dff2] text-[#4d606b] text-left rounded-lg whitespace-nowrap">
                                        <th className="py-2 px-4 border border-black uppercase">No.</th>
                                        <th className="py-2 px-4 border border-black uppercase">Ticket Date</th>
                                        <th className="py-2 px-4 border border-black uppercase">Photo</th>
                                        <th className="py-2 px-4 border border-black uppercase">Name of the Employee</th>
                                        <th className="py-2 px-4 border border-black uppercase">Employee ID</th>
                                        <th className="py-2 px-4 border border-black uppercase">Leave Date</th>
                                        <th className="py-2 px-4 border border-black uppercase">Purpose of Leave</th>
                                        <th className="py-2 px-4 border border-black uppercase  w-96">Remarks</th>
                                        <th className="py-2 px-4 border border-black text-center uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="py-4 text-center text-gray-500">
                                                <Loader className="text-center" />
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {currentSpocs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={9} className="py-4 text-center text-gray-500">
                                                        Your Table Is Empty.
                                                    </td>
                                                </tr>
                                            ) : (
                                                currentSpocs.map((spoc, index) => (
                                                    <tr key={spoc.id} className="hover:bg-gray-200">
                                                        <td className="py-2 px-4 border border-black">{index + indexOfFirstItem + 1}</td>
                                                        <td className="py-2 px-4 border border-black">{formatDate(spoc.ticket_date)}</td>
                                                        <td className="py-2 px-4 border border-black">
                                                            <img src={spoc.photo ? spoc.photo : `${adminData.profile_picture}`} alt="Employee" className="w-12 h-12 object-cover rounded-full" />
                                                        </td>
                                                        <td className="py-2 px-4 border border-black">{spoc.employee_name}</td>
                                                        <td className="py-2 px-4 border border-black">{spoc.employee_id}</td>
                                                        <td className="py-2 px-4 border border-black whitespace-nowrap">
                                                            {`${formatDate(spoc.from_date)} To ${formatDate(spoc.to_date)}`}
                                                        </td>
                                                        <td className="py-2 px-4 border border-black">{spoc.purpose_of_leave}</td>
                                                        <td className="py-2 px-4 border border-black ">{spoc.remarks}</td>
                                                        <td className="py-2 px-4 border border-black  whitespace-nowrap">
                                                            <div className='flex gap-2'>
                                                                {spoc.status === 1 ? (
                                                                    <button
                                                                        className="bg-green-600 transition-colors duration-300 ease-in-out text-white rounded-full p-3 font-bold flex items-center justify-center shadow-md  focus:outline-none"
                                                                        disabled
                                                                    >
                                                                        ✔ APPROVED
                                                                    </button>
                                                                ) : spoc.status === 2 ? (
                                                                    <button
                                                                        className="bg-red-500  transition-colors duration-300 ease-in-out text-white rounded-full p-3 font-bold flex items-center justify-center shadow-md  focus:outline-none"
                                                                        disabled
                                                                    >
                                                                        ✖ REJECTED
                                                                    </button>
                                                                ) : null}


                                                            </div>
                                                        </td>

                                                    </tr>
                                                ))
                                            )}
                                        </>
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
        </div>
    );
};

export default LeaveListing;
