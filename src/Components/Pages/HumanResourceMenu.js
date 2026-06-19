import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import SidebarContext from '../SidebarContext'
import axios from 'axios';
import { useApiLoading } from '../ApiLoadingContext';
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import Default from "../../imgs/default.png"
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
const HumanResourceMenu = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

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

    // 🔹 Measure table width after render

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

    const fetchClientData = async () => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        setApiLoading(true);
        try {
            const response = await fetch(
                `https://api.screeningstar.co.in/personal-manager/list?admin_id=${admin_id}&_token=${storedToken}`,
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



    const handleEdit = (spoc) => {
        setFormData(spoc);
        setIsEditing(true);
        setCurrentSpocId(spoc.id);
    };
    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert the file list to an array
        setFiles(prevFiles => ({
            ...prevFiles, // Preserve other files
            [fileName]: selectedFiles // Add the new files
        }));
    };
    const uploadAdminProfilePicture = async (insertedId, adminId, token) => {
        const fileCount = Object.keys(files).length;
        console.log(`File count: ${fileCount}`);

        if (fileCount > 0) {
            for (const [key, value] of Object.entries(files)) {
                console.log(`Processing files for key: ${key}`);

                const formData = new FormData();
                formData.append("admin_id", adminId); // Ensure adminId is defined
                formData.append("_token", token); // Ensure token is defined
                formData.append("id", insertedId);
                formData.append("send_mail", 1);

                // Add the files from fileInput
                for (const file of value) {
                    formData.append('images', file);
                }

                try {
                    console.log("Sending POST request to upload files...");
                    const response = await axios.post(
                        `https://api.screeningstar.co.in/personal-manager/upload`,
                        formData,
                        {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        }
                    );
                    console.log("Upload response:", response.data);

                    // Save the new token if present in the response
                    const newToken = response.data._token || response.data.token || storedToken;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }

                    return;
                } catch (err) {
                    console.error("Error occurred:", err);
                    Swal.fire('Error!', `An error occurred while uploading profile picture: ${err.message}`, 'error');

                    // Save the new token even in case of failure
                    const newToken = err.response?.data._token || err.response?.data.token || storedToken;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }
                }
            }
        } else {
            console.warn(`Upload image first`);
        }
    };

    console.log('clientData', clientData)


    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const fileCount = Object.keys(files).length;
        const isFileUploading = fileCount > 0;
        const storedToken = localStorage.getItem("_token");

        let raw;
        if (isEditing) {
            raw = JSON.stringify({
                "ticket_date": formData.ticket_date,
                "employee_name": formData.employee_name,
                "employee_id": formData.employee_id,
                "leave_date": formData.leave_date,
                "purpose_of_leave": formData.purpose_of_leave,
                "remarks": formData.remarks,
                "personal_manager_id": formData.id,
                "admin_id": admin_id,
                "_token": storedToken,
            });
        } else {
            raw = JSON.stringify({
                "ticket_date": formData.ticket_date,
                "employee_name": formData.employee_name,
                "employee_id": formData.employee_id,
                "leave_date": formData.leave_date,
                "purpose_of_leave": formData.purpose_of_leave,
                "remarks": formData.remarks,
                "admin_id": admin_id,
                "_token": storedToken,
            });
        }

        const requestOptions = {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: raw,
        };

        const url = isEditing
            ? `https://api.screeningstar.co.in/personal-manager/update`
            : `https://api.screeningstar.co.in/personal-manager/create`;

        try {
            const response = await fetch(url, requestOptions);
            const data = await response.json();
            const newToken = data.token || data._token || storedToken || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (response.ok) {
                let insertId;

                if (isEditing) {
                    insertId = formData.id;
                } else {
                    insertId = data?.result?.insertId;
                }


                if (isFileUploading) {
                    await uploadAdminProfilePicture(insertId, admin_id, storedToken);
                }
                Swal.fire(
                    "Success!",
                    isEditing ? "Form updated successfully." : "Form submitted successfully.",
                    "success"
                );
                setFormData({
                    ticket_date: "",
                    photo: null,
                    employee_name: "",
                    employee_id: "",
                    leave_date: "",
                    purpose_of_leave: "",
                    remarks: "",
                    personal_manager_id: ""
                });
                setLoading(false);
                await fetchClientData();
                await setIsEditing(false);
                setCurrentSpocId(null);




                // Display success message dynamically

            } else {
                setLoading(false);

                // Display error message dynamically
                const errorMessage = data.message || "Failed to submit form. Please try again.";
                Swal.fire("Error!", errorMessage, "error");
            }
        } catch (error) {
            setLoading(false);

            // Catch unexpected errors
            Swal.fire("Error!", `An unexpected error occurred: ${error.message}`, "error");
            console.error("Error submitting form:", error);
        }
    };
    const handleDelete = async (id) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        const requestOptions = {
            method: "DELETE",
            redirect: "follow",
        };

        try {
            const willDelete = await swal({
                title: "Are you sure?",
                text: "Once deleted, you will not be able to recover this data!",
                icon: "warning",
                buttons: true,
                dangerMode: true,
            });

            if (willDelete) {
                setDeletingId(id);
                const response = await fetch(
                    `https://api.screeningstar.co.in/personal-manager/delete?personal_manager_id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
                    requestOptions
                );

                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }

                // Remove the deleted SPOC from the state immediately
                setSpocs((prevSpocs) => prevSpocs.filter((spoc) => spoc.id !== id));
                swal("Deleted!", "The data has been deleted successfully.", "success");
                setDeletingId(null);
                const result = await response.json();
                const newToken = result.token || result._token || storedToken || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            }
        } catch (error) {
            swal("Failed!", "There was an error deleting the data.", "error");
            console.error("Delete request failed:", error);
            setDeletingId(null);
        }
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
    const formatDate = (date) => {
        if (!date) return null; // Return null if date is undefined, null, or empty
        const dateObj = new Date(date);
        if (isNaN(dateObj)) return null; // Return null if date is invalid

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${day}-${month}-${year}`;
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [currentSpocs, loading]); // recalc whenever data changes
    return (
        <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">
            <div className="space-y-4 py-[30px] px-[51px] bg-white">

                {isEditing && (
                    <>
                        <div className="w-full p-10">
                            <form className="space-y-4 ps-0 pb-[30px] px-[51px] bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
                                <div>
                                    <label htmlFor="ticket_date" className="block mb-2">Ticket Date<span className="text-red-500 text-xl">*</span></label>
                                    <DatePicker
                                        id="ticket_date"
                                        name="ticket_date"
                                        selected={formData.ticket_date ? parseISO(formData.ticket_date) : null}
                                        onChange={(date) => {
                                            const value = date ? format(date, "yyyy-MM-dd") : "";
                                            setFormData((prevData) => ({ ...prevData, ticket_date: value }));
                                        }}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="w-full border rounded p-2"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="photo" className="block mb-2">Photo<span className="text-red-500 text-xl">*</span></label>
                                    <input
                                        type="file"
                                        id="photo"
                                        name="photo"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange('photo', e)}
                                        className="w-full border rounded p-2"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="employee_name" className="block mb-2">Name of the Employee<span className="text-red-500 text-xl">*</span></label>
                                    <input
                                        type="text"
                                        id="employee_name"
                                        name="employee_name"
                                        value={formData.employee_name}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="employee_id" className="block mb-2">Employee ID<span className="text-red-500 text-xl">*</span></label>
                                    <input
                                        type="text"
                                        id="employee_id"
                                        name="employee_id"
                                        value={formData.employee_id}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="leave_date" className="block mb-2">Leave Date<span className="text-red-500 text-xl">*</span></label>
                                    <DatePicker
                                        id="leave_date"
                                        name="leave_date"
                                        selected={formData.leave_date ? parseISO(formData.leave_date) : null}
                                        onChange={(date) => {
                                            const value = date ? format(date, "yyyy-MM-dd") : "";
                                            setFormData((prevData) => ({ ...prevData, leave_date: value }));
                                        }}
                                        dateFormat="dd-MM-yyyy"
                                        placeholderText="DD-MM-YYYY"
                                        className="w-full border rounded p-2"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="purpose_of_leave" className="block mb-2">Purpose of Leave<span className="text-red-500 text-xl">*</span></label>
                                    <input
                                        type="text"
                                        id="purpose_of_leave"
                                        name="purpose_of_leave"
                                        value={formData.purpose_of_leave}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="remarks" className="block mb-2">Remarks (Optional)</label>
                                    <textarea
                                        id="remarks"
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        className="w-full border rounded p-2"
                                    />
                                </div>
                                <div className='flex gap-8'>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {isEditing ? 'Edit' : 'Submit'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className={`p-6 py-3 bg-red-600 text-white hover:scale-105 font-bold rounded-md hover:bg-red-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                </div>

                            </form>

                        </div></>
                )}
                <div className="mb-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Search by Name"
                            className="w-1/3 rounded-md p-2.5 border border-gray-300"
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
                                    <th className="py-2 px-4 border border-black text-center uppercase">Actions</th>
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
                                                        <img

                                                            src={spoc.photo ? spoc.photo : `${Default}`}
                                                            alt="Employee" className="w-12 h-12 object-cover rounded-full" />
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

                                                            <button
                                                                className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded mr-2"
                                                                onClick={() => handleEdit(spoc)}>
                                                                Edit
                                                            </button>

                                                            <button
                                                                disabled={deletingId === spoc.id}
                                                                className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded mr-2 ${deletingId === spoc.id ? "opacity-50 cursor-not-allowed" : ""}`}
                                                                onClick={() => handleDelete(spoc.id)}>
                                                                {deletingId === spoc.id ? "Deleting..." : "Delete"}
                                                            </button>
                                                            <button
                                                                className={`${spoc.status === 1
                                                                    ? 'bg-blue-600 hover:bg-blue-700' // Dark blue for status 1
                                                                    : spoc.status === 2
                                                                        ? 'bg-blue-200 hover:bg-blue-300' // Lightest blue for status 2
                                                                        : 'bg-gray-500 hover:bg-gray-600' // Normal blue for other cases
                                                                    } transition-colors duration-300 ease-in-out text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:scale-105 focus:outline-none`}
                                                                disabled={loadingSpoc[spoc.id] === 1}
                                                                onClick={() => handleAction(spoc.id, 1)}
                                                            >
                                                                {loadingSpoc[spoc.id] === 1 ? (
                                                                    <div className="spinner-border text-white spinner-border-sm" role="status">
                                                                        <div className="loader border-t-4 border-white rounded-full w-5 h-5 animate-spin"></div>
                                                                    </div> // Spinner for loading state
                                                                ) : (
                                                                    '✔'
                                                                )}
                                                            </button>

                                                            <button
                                                                className={`${spoc.status === 2
                                                                    ? 'bg-red-500 hover:bg-red-600' // Dark color for status 2
                                                                    : spoc.status === 1
                                                                        ? 'bg-red-200 hover:bg-red-300' // Lightest color for status 1
                                                                        : 'bg-gray-500 hover:bg-gray-600' // Normal color for no status or other values
                                                                    } transition-colors duration-300 ease-in-out text-white rounded-full w-12 h-12 flex items-center justify-center shadow-md hover:scale-105 focus:outline-none`}
                                                                disabled={loadingSpoc[spoc.id] === 2}
                                                                onClick={() => handleAction(spoc.id, 2)}
                                                            >
                                                                {loadingSpoc[spoc.id] === 2 ? (
                                                                    <div className="spinner-border text-white spinner-border-sm" role="status">
                                                                        <div className="loader border-t-4 border-black rounded-full w-5 h-5 animate-spin"></div>
                                                                    </div> // Spinner for loading state
                                                                ) : (
                                                                    '✖'
                                                                )}
                                                            </button>

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
    );
};

export default HumanResourceMenu;
