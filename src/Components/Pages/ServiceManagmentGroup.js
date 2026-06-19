import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2'; // Import SweetAlert2
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';

const ServiceManagementGroup = () => {
    const [deletingId, setDeletingId] = useState(null);
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
    const [symbol, setSymbol] = useState();
    const [title, setTitle] = useState();
    const [services, setServices] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [servicesPerPage, setServicesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const [editingServiceId, setEditingServiceId] = useState(null);
    const storedToken = localStorage.getItem('token');
    const navigate = useNavigate();


    const fetchServices = useCallback(async () => {
        setLoading(true);
        setApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!storedToken) {
            console.error("No token found. Please log in.");
            navigate('/admin-login');
            setApiLoading(false);
            setLoading(false); // Set loading to false if no token is found
            return;
        }

        try {
            const response = await axios.get(`https://api.screeningstar.co.in/service-group/list`, {
                params: { admin_id, _token: storedToken }
            });


            const result = response.data;

            // Handle token renewal
            const newToken = result.token || result._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (result.status) {
                setServices(result.services);
            } else {
                console.error("Failed to fetch services.");
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            if (error.response) {
                Swal.fire('Error!', `${error.response.data.message}`, 'error');
                setResponseError(error.response.data.message);
            } else {
                Swal.fire('Error!', 'An unknown error occurred.', 'error');
            }
        } finally {
            setApiLoading(false);
            setLoading(false); // Ensure loading is set to false once the request is complete
        }
    }, [navigate]); // Memoize fetchServices function to prevent re-renders

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin(); // Verify admin first
                    await fetchServices();
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [fetchServices, navigate]); // Now `fetchServices` is stable and won't cause unwanted rerenders


    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        if (!storedToken) {
            console.error("No token found. Please log in.");
            navigate('/admin-login');
            Swal.fire({
                icon: 'error',
                title: 'Authentication Failed',
                text: 'You are not logged in. Please log in to continue.',
            });
            setLoading(false);
            return;
        }

        const raw = JSON.stringify({
            id: editingServiceId,
            title: title,
            symbol: symbol,
            admin_id: admin_id,
            _token: storedToken,
        });

        const requestOptions = {
            method: editingServiceId ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: raw,
        };

        try {
            const url = editingServiceId
                ? `https://api.screeningstar.co.in/service-group/update`
                : `https://api.screeningstar.co.in/service-group/create`;

            const response = await fetch(url, requestOptions);

            const result = await response.json();
            const newToken = result.token || result._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
            if (response.ok) {
                if (editingServiceId) {
                    Swal.fire('SUCCESS!', 'Your package has been UPDATED', 'success');
                } else {
                    Swal.fire('SUCCESS!', 'Your package has been CREATED', 'success');

                }
                setLoading(false);
                setEditingServiceId(null);
                setTitle(''); // Clear input fields
                setSymbol(''); // Clear input fields
                fetchServices();
            } else {
                setLoading(false);
                const errorMessage = result.message || 'Failed to update the service. Please try again.';
                Swal.fire({
                    icon: 'error',
                    title: 'Failed',
                    text: errorMessage,
                });
            }
        } catch (error) {
            setLoading(false);
            console.error('Error while updating:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'An error occurred while updating the service. Please try again.',
            });
        }
    };


    const handleEdit = (service) => {
        setEditingServiceId(service.id); // Set service ID for edit mode
        setTitle(service.title || '');
        setSymbol(service.symbol || '');
    };


    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "This package will be deleted permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                setDeletingId(id);
                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");

                try {
                    const response = await axios.delete(`https://api.screeningstar.co.in/service-group/delete`, {
                        params: { id, admin_id, _token: storedToken }
                    });

                    const result = response.data;
                    const newToken = result.token || result._token || storedToken;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }

                    setServices((prevServices) =>
                        prevServices.filter((service) => service.id !== id)
                    );
                    setDeletingId(null);
                    Swal.fire('Deleted!', 'Your package has been deleted.', 'success');
                } catch (error) {
                    console.error('Error deleting package:', error);
                    Swal.fire('Error!', 'Something went wrong while deleting.', 'error');
                    setDeletingId(null);
                }
            }
        });
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredServices);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Services');
        XLSX.writeFile(workbook, 'services.xlsx');
    };

    const filteredServices = services.filter((service) =>
        service.title && service.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
    const maxVisiblePages = 3; // Adjust the max number of visible pages// Number of pages visible before showing "..."
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    const indexOfLastService = currentPage * servicesPerPage;
    const indexOfFirstService = indexOfLastService - servicesPerPage;
    const currentServices = filteredServices.slice(indexOfFirstService, indexOfLastService);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [currentServices, loading]);

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1)
    };
    return (
        <div className="">

            <div className="bg-white md:p-12 p-6 border-black border w-full mx-auto">
                <div className="md:flex flex-wrap ">

                    <div className="md:w-2/5">
                        <form onSubmit={handleSubmit} className="space-y-4 ps-0 md:pr-[30px] pb-[30px] bg-white rounded-md">
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    type="text"
                                    name="symbol"
                                    required
                                    value={symbol}
                                    onChange={(e) => setSymbol(e.target.value)}
                                    placeholder="Group Symbol"
                                    className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Group Title"
                                    className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                                />
                            </div>


                            <div className="text-left">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex justify-center text-center align-middle items-center w-full bg-[#2c81ba] hover:scale-105 hover:bg-[#0f5381]  text-white  py-2.5 px-[30px] text-[18px] border rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {editingServiceId ? 'Update' : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="md:w-3/5">
                        <div className="md:flex justify-between items-center mb-4">
                            <div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Search by Group Title"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="md:w-[450px] w-full rounded-md p-2.5 border border-gray-300 mb-4"
                                    />
                                </div>
                                <select
                                    value={servicesPerPage}
                                    onChange={(e) => {
                                        setServicesPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }} className="border rounded-lg px-3 py-1 text-gray-700 bg-white  shadow-sm focus:ring-2 focus:ring-blue-400"
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
                                className="bg-green-500 mb-4 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded text-[18px]"
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

                                <table className="min-w-full border-collapse border border-black  rounded-lg overflow-scroll whitespace-nowrap">
                                    <thead className="rounded-lg">
                                        <tr className="bg-[#c1dff2] text-[#4d606b]">
                                            <th className="uppercase border border-black  px-4 py-2">SL</th>
                                            <th className="uppercase border border-black  px-4 py-2">Group Symbol </th>
                                            <th className="uppercase border border-black  px-4 py-2">Group Title</th>
                                            <th className="uppercase border border-black  px-4 py-2">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (

                                            <tr>
                                                <td colSpan={4} className="py-4 text-center text-gray-500">
                                                    <Loader className="text-center" />
                                                </td>
                                            </tr>
                                        ) : currentServices.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-4 text-center text-red-500">
                                                    {responseError && responseError !== ""
                                                        ? responseError
                                                        : "No data available in table"}
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {currentServices.map((service, index) => (
                                                    <tr key={service.id} className="text-center">
                                                        <td className="border border-black  px-4 py-2">
                                                            {index + 1 + (currentPage - 1) * servicesPerPage}
                                                        </td>
                                                        <td className="border border-black  px-4 py-2">{service.symbol}</td>
                                                        <td className="border border-black  px-4 py-2">{service.title}</td>

                                                        <td className="border border-black  px-4 py-2">
                                                            <button
                                                                onClick={() => handleEdit(service)}
                                                                className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded-md mr-2"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                disabled={deletingId === service.id}
                                                                onClick={() => handleDelete(service.id)}
                                                                className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded-md ${deletingId === service.id ? "opacity-50 cursor-not-allowed" : " hover:scale-105"} `}
                                                            >
                                                                {deletingId === service.id ? "Deleting..." : "Delete"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            {/* First Page */}
                            {startPage > 1 && (
                                <button
                                    onClick={() => paginate(1)}
                                    className={`mx-1 px-3 py-1 rounded-md ${currentPage === 1 ? "bg-[#2c81ba] text-white" : "bg-gray-200"}`}
                                >
                                    1
                                </button>
                            )}

                            {/* Backward Ellipsis */}
                            {startPage > 2 && <span className="mx-1 px-3 py-1">...</span>}

                            {/* Visible Pages */}
                            {Array.from({ length: endPage - startPage + 1 }, (_, index) => {
                                const pageNumber = startPage + index;
                                return (
                                    <button
                                        key={pageNumber}
                                        onClick={() => paginate(pageNumber)}
                                        className={`mx-1 px-3 py-1 rounded-md ${currentPage === pageNumber ? "bg-[#2c81ba] text-white" : "bg-gray-200"
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                );
                            })}

                            {/* Forward Ellipsis */}
                            {endPage < totalPages - 1 && <span className="mx-1 px-3 py-1">...</span>}

                            {/* Last Page */}
                            {endPage < totalPages && (
                                <button
                                    onClick={() => paginate(totalPages)}
                                    className={`mx-1 px-3 py-1 rounded-md ${currentPage === totalPages ? "bg-[#2c81ba] text-white" : "bg-gray-200"}`}
                                >
                                    {totalPages}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ServiceManagementGroup;
