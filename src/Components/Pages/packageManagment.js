import React, { useEffect, useState,useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { useApiLoading } from '../ApiLoadingContext';
import { useCallback } from 'react';

const PackageManagement = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

    const [responseError, setResponseError] = useState(null);

    const [deletingId, setDeletingId] = useState(null);
    const [packageName, setPackageName] = useState('');
    const [packageDescription, setPackageDescription] = useState('');
    const [packages, setPackages] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [editingPackageId, setEditingPackageId] = useState(null);
    const navigate = useNavigate();
    const storedToken = localStorage.getItem("_token");
    const [packagesPerPage, setPackagesPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200,500,1000];
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


    const fetchPackages = useCallback(async () => {
        setLoading(true);
        setApiLoading(true);

        const admin = JSON.parse(localStorage.getItem("admin"));
        const storedToken = localStorage.getItem("_token");

        if (!storedToken) {
            console.error("No token found. Please log in.");
            setLoading(false);
            setApiLoading(false);

            navigate('/admin-login');
            return;
        }

        const admin_id = admin?.id;
        if (!admin_id) {
            console.error("Admin ID not found in localStorage.");
            setLoading(false);
            setApiLoading(false);

            navigate('/admin-login');
            return;
        }

        try {
            const response = await axios.get(
                `https://api.screeningstar.co.in/package/list`,
                {
                    params: { admin_id, _token: storedToken },
                }
            );

            const result = response.data;

            const newToken = result.token || result._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (result.status) {
                setPackages(result.packages || []);
            } else {
                console.error("Failed to fetch packages. Response:", result);
            }
        } catch (error) {
            if (error.response) {
                Swal.fire('Error!', `${error.response.data.message}`, 'error');
                setResponseError(error.response.data.message);
            } else {
                Swal.fire('Error!', 'An unknown error occurred.', 'error');
            }
        } finally {
            setApiLoading(false);
            setLoading(false);
        }
    }, [navigate]); // Only re-create if `navigate` changes

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin();
                    await fetchPackages();
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login');
            }
        };

        initialize();
    }, [navigate, fetchPackages]);


    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!storedToken) {
            console.error("No token found. Please log in.");
            navigate('/admin-login');
            setLoading(false); // Ensure loading state is reset in this case
            return;
        }

        const requestBody = {
            id: editingPackageId,
            title: packageName,
            description: packageDescription,
            admin_id: admin_id,
            _token: storedToken,
        };

        try {
            let response;

            if (editingPackageId) {
                // If editing, use the update API
                response = await axios.put(
                    "https://api.screeningstar.co.in/package/update",
                    requestBody,
                    { headers: { "Content-Type": "application/json" } }
                );
                Swal.fire('Success!', 'Package updated successfully.', 'success');
            } else {
                // If not editing, use the create API
                response = await axios.post(
                    "https://api.screeningstar.co.in/package/create",
                    requestBody,
                    { headers: { "Content-Type": "application/json" } }
                );
                Swal.fire('Success!', 'Package created successfully.', 'success');
            }

            // Update the token if returned by the API
            const newToken = response?.data?.token || response?.data?._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            // Refresh the package list and reset form state
            fetchPackages();
            setPackageName('');
            setPackageDescription('');
            setEditingPackageId(null);
        } catch (error) {
            console.error(
                editingPackageId ? 'Error updating package:' : 'Error creating package:',
                error
            );

            // Display dynamic error message
            const errorMessage = error?.response?.data?.message || 'Something went wrong. Please try again.';
            Swal.fire('Error!', errorMessage, 'error');
        } finally {
            setLoading(false); // Reset loading state regardless of success or error
        }
    };


    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "This package will be deleted permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (swalResult) => {
            if (swalResult.isConfirmed) {
                setDeletingId(id);
                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");
                try {
                    const response = await axios.delete(
                        `https://api.screeningstar.co.in/package/delete`,
                        {
                            params: { id, admin_id, _token: storedToken },
                        }
                    );

                    // Check and store a new token if provided in the API response
                    const newToken = response.data?.token || response.data?._token || storedToken;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }

                    // Update the packages state
                    setPackages((prevPackages) => prevPackages.filter((pkg) => pkg.id !== id));
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

    const handleEdit = (pkg) => {
        setPackageName(pkg.title);
        setPackageDescription(pkg.description);
        setEditingPackageId(pkg.id); // Set the ID to indicate edit mode
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(filteredPackages);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Packages');
        XLSX.writeFile(workbook, 'packages.xlsx');
    };

    const filteredPackages = packages.filter(pkg =>
        pkg.title && pkg.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastPackage = currentPage * packagesPerPage;
    const indexOfFirstPackage = indexOfLastPackage - packagesPerPage;
    const currentPackages = filteredPackages.slice(indexOfFirstPackage, indexOfLastPackage);
          useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [currentPackages, loading]); 

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
            <div className="bg-white border-black border  md:p-12 p-6 w-full mx-auto">
                <div className="md:flex flex-wrap">

                    <div className="md:w-2/5">
                        <form onSubmit={handleSubmit} className="space-y-4 ps-0 md:pr-[30px] pb-[30px] bg-white rounded-md">
                            <div className="grid grid-cols-1 gap-4">
                                <input
                                    type="text"
                                    name="packageName"
                                    required
                                    value={packageName}
                                    onChange={(e) => setPackageName(e.target.value)}
                                    placeholder="Package Name"
                                    className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <textarea
                                    name='packageDescription'
                                    required
                                    value={packageDescription}
                                    onChange={(e) => setPackageDescription(e.target.value)}
                                    placeholder='Package Description'
                                    className='w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300'
                                />
                            </div>
                            <div className="text-left">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex justify-center text-center align-middle items-center w-full bg-[#2c81ba] hover:bg-[#0f5381] hover:scale-105 text-white  py-2.5 px-[30px] text-[18px] border rounded-md ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {editingPackageId ? 'Update' : 'Submit'}
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
                                        placeholder="Search by Package Name"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="md:w-[450px] w-full rounded-md p-2.5 border border-gray-300 mb-4"
                                    />
                                </div>
                                <select
                                    value={packagesPerPage}
                                    onChange={(e) => {
                                        setPackagesPerPage(Number(e.target.value));
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
                            <button onClick={exportToExcel} className="bg-green-500 hover:scale-105 mb-4 hover:bg-green-600 text-white px-4 py-2 rounded text-[18px]">
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
                                        <th className=" uppercase border border-black  px-4 py-2">SL</th>
                                        <th className=" uppercase border border-black  px-4 py-2  text-left">Package Name</th>
                                        <th className=" uppercase border border-black  px-4 py-2  text-left">Description</th>
                                        <th className=" uppercase border border-black  px-4 py-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (

                                        <tr>
                                            <td colSpan={6} className="py-4 text-center text-gray-500">
                                                <Loader className="text-center" />
                                            </td>
                                        </tr>
                                    ) : currentPackages.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-4 text-center text-red-500">
                                                {responseError && responseError !== ""
                                                    ? responseError
                                                    : "No data available in table"}
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {currentPackages.map((pkg, index) => (
                                                <tr key={pkg.id} className='text-center'>
                                                    <td className="border border-black  px-4 py-2">{index + 1 + (currentPage - 1) * packagesPerPage}</td>
                                                    <td className="border border-black  px-4 py-2 text-left">{pkg.title}</td>
                                                    <td className="border border-black  px-4 py-2 text-left">{pkg.description}</td>
                                                    <td className="border border-black  px-4 py-2">
                                                        <button onClick={() => handleEdit(pkg)} className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded-md mr-2">Edit</button>
                                                        <button
                                                            disabled={deletingId === pkg.id}
                                                            onClick={() => handleDelete(pkg.id)}
                                                            className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded-md ${deletingId === pkg.id ? "opacity-50 cursor-not-allowed" : " hover:scale-105"} `}>
                                                            {deletingId === pkg.id ? "Deleting..." : "Delete"}
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

                        {/* Pagination */}
                        <div className="mt-4 text-center">
                            {Array.from({ length: Math.ceil(filteredPackages.length / packagesPerPage) }, (_, index) => (
                                <button
                                    key={index + 1}
                                    onClick={() => paginate(index + 1)}
                                    className={`mx-1 px-3 py-1 rounded-md ${currentPage === index + 1 ? 'bg-[#2c81ba] hover:bg-[#0f5381] text-white' : 'bg-gray-200'}`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default PackageManagement;
