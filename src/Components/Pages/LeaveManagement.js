import React, { useEffect, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from 'date-fns';
const LeaveManagement = () => {
    const [files, setFiles] = useState({});
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();


    const [deletingId, setDeletingId] = useState(null);
    const navigate = useNavigate();
    const [spocs, setSpocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    const [isEditing, setIsEditing] = useState(false);
    const [currentSpocId, setCurrentSpocId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const storedToken = localStorage.getItem("_token");
    let adminData;
    if (storedToken) {
        adminData = JSON.parse(localStorage.getItem('admin'))
    }
    const [formData, setFormData] = useState({
        ticket_date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        photo: adminData.profile_picture,
        employee_name: adminData.name,
        employee_id: adminData.emp_id,
        leave_date: "",
        from_date: "",
        to_date: "",
        purpose_of_leave: "",
        remarks: "",
        personal_manager_id: ""
    });
    console.log('adminData---', adminData)
    const fetchData = useCallback(() => {
        setLoading(true);
        setApiLoading(true);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        // Check if admin_id or storedToken is missing
        if (!admin_id || !storedToken) {
            console.error('Missing admin_id or _token');
            setLoading(false);
            setApiLoading(false); // Ensure loading is stopped if missing data
            return;
        }

        // Construct the URL with query parameters
        const url = `https://api.screeningstar.co.in/personal-manager/list?admin_id=${admin_id}&_token=${storedToken}`;

        // Request options for GET request (no body required)
        const requestOptions = {
            method: "GET", // GET method does not need a body
            redirect: "follow",
        };

        fetch(url, requestOptions)
            .then((response) => {
                const newToken = response.token || response._token || storedToken || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Store new token if available
                }
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json(); // Parse response body as JSON
            })
            .then((result) => {

                const newToken = result.token || result._token || storedToken || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken); // Store new token if available
                }

                // Assuming result.billing_spocs is an array
                try {
                    setSpocs(result.services);
                } catch (error) {
                    console.error('Failed to parse JSON:', error);
                }
            })
            .catch((error) => {
                console.error('Fetch error:', error);
            })
            .finally(() => {
                setLoading(false);
                setApiLoading(false);// Stop loading
            });

    }, []);

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin(); // Verify admin first
                    await fetchData(); // Fetch data after verification
                }
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchData]);


    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleChange = (e) => {
        const { name, value } = e.target;
    
        setFormData((prevData) => {
            const updatedForm = { ...prevData, [name]: value };
    
            // Only run date validation if from_date or to_date is being changed
            if (name === "from_date" || name === "to_date") {
                const fromDate = name === "from_date" ? value : updatedForm.from_date;
                const toDate = name === "to_date" ? value : updatedForm.to_date;
    
                if (fromDate && toDate) {
                    if (new Date(fromDate) > new Date(toDate)) {
                        setError("From Date cannot be later than To Date.");
                    } else if (new Date(toDate) < new Date(fromDate)) {
                        setError("To Date cannot be earlier than From Date.");
                    } else {
                        setError(null); // Dates are valid
                    }
                }
            }
    
            return updatedForm;
        });
    };
    const handleDateChangeTCKT = (date) => {
        if (!date) {
            setFormData((prevData) => ({
                ...prevData,
                ticket_date: '', // or null, depending on your backend format
            }));
            return;
        }
    
        const formattedDate = format(date, 'yyyy-MM-dd');
        setFormData((prevData) => ({
            ...prevData,
            ticket_date: formattedDate,
        }));
    };
    
    const handleDateChange = (name, date) => {
        // Format the date to yyyy-mm-dd for storage
        const formattedDate = date ? format(date, 'yyyy-MM-dd') : null;
        setFormData((prevData) => ({
            ...prevData,
            [name]: formattedDate,
        }));
       
        // Validate the dates if both from_date and to_date are filled
        if (name === 'from_date' || name === 'to_date') {
            const fromDate = name === 'from_date' ? formattedDate : formData.from_date;
            const toDate = name === 'to_date' ? formattedDate : formData.to_date;

            if (fromDate && toDate) {
                const from = new Date(fromDate);
                const to = new Date(toDate);

                if (from > to) {
                    setError("From Date cannot be later than To Date.");
                } else if (to < from) {
                    setError("To Date cannot be earlier than From Date.");
                } else {
                    setError(null);
                }
            }
        }
    };
 const formatDateForDisplay = (date) => {
        // Format date for displaying in dd-mm-yyyy format
        return date ? format(parse(date, 'yyyy-MM-dd', new Date()), 'dd-MM-yyyy') : '';
    };





    const handleEdit = (spoc) => {
        setFormData(spoc);
        setIsEditing(true);
        setCurrentSpocId(spoc.id);
    };


    const handleFileChange = (fileName, e) => {
        console.log('fileName', fileName)
        console.log('e', e)

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



    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const fileCount = Object.keys(files).length;
        const isFileUploading = fileCount > 0;
        const storedToken = localStorage.getItem("_token");
        if (error) {
            alert('please correct error')
setLoading(false);
    
        }else{
            let raw;
            if (isEditing) {
                raw = JSON.stringify({
                    "ticket_date": formData.ticket_date,
                    "employee_name": formData.employee_name,
                    "photo": formData.photo,
                    "employee_id": formData.employee_id,
                    "purpose_of_leave": formData.purpose_of_leave,
                    "remarks": formData.remarks,
                    "from_date": formData.from_date,
                    "to_date": formData.to_date,
                    "personal_manager_id": formData.id,
                    "admin_id": admin_id,
                    "_token": storedToken,
                    "send_mail":1
                });
            } else {
                raw = JSON.stringify({
                    "ticket_date": formData.ticket_date,
                    "employee_name": formData.employee_name,
                    "employee_id": formData.employee_id,
                    "photo": formData.photo,
                    "purpose_of_leave": formData.purpose_of_leave,
                    "from_date": formData.from_date,
                    "to_date": formData.to_date,
                    "remarks": formData.remarks,
                    "admin_id": admin_id,
                    "_token": storedToken,
                     "send_mail":1
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
                    await fetchData();
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
    }
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSpocs = spocs
        .filter((spoc) => spoc.admin_name.toLowerCase().includes(searchTerm.toLowerCase()))
        .slice(indexOfFirstItem, indexOfLastItem);
    ;

    const totalPages = Math.ceil(spocs.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const filteredSpocs = spocs.filter((spoc) =>
        spoc.admin_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (

        <div className=" ">
            <div className="bg-white md:p-12 p-6 border border-black w-full mx-auto">
                <div className="flex space-x-4">

                    <div className="w-full">
                        <form className="space-y-4 ps-0 pb-[30px]  bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="ticket_date" className="block mb-2">Ticket Date<span className="text-red-500 text-xl">*</span></label>
                                <DatePicker
                selected={formData.ticket_date ? parse(formData.ticket_date, 'yyyy-MM-dd', new Date()) : null}
                onChange={handleDateChangeTCKT}
                dateFormat="dd-MM-yyyy"
                className="uppercase w-full border rounded p-2"
                required
            />
                            </div>

                            <div>
                                <label htmlFor="photo" className="block mb-2">Photo</label>
                                <input
                                    type="file"
                                    id="photo"
                                    name="photo"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            handleFileChange('photo', e);
                                        } else if (adminData.profile_picture) {
                                            // Send existing image if no new file selected
                                            handleFileChange('photo', { target: { files: [adminData.profile_picture] } });
                                        }
                                    }}
                                    className="w-full border rounded p-2"
                                />
                                {adminData.profile_picture && (
                                    <img
                                        src={adminData.profile_picture}
                                        className="w-14 h-14 mt-4 rounded-full object-cover"
                                        alt="Admin Photo"
                                    />
                                )}
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

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* From Date */}
                                    <div>
                                        <label htmlFor="from_date" className="block mb-1 ">
                                            From Date <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <DatePicker
                    selected={formData.from_date ? new Date(formData.from_date) : null}
                    onChange={(date) => handleDateChange('from_date', date)}
                    dateFormat="dd-MM-yyyy"
                    className={`w-full border rounded p-2 uppercase ${error ? 'border-red-500' : 'border-gray-300'}`}
                    required
                />
                                    </div>

                                    {/* To Date */}
                                    <div>
                                        <label htmlFor="to_date" className="block mb-1 ">
                                            To Date <span className="text-red-500 text-lg">*</span>
                                        </label>
                                        <DatePicker
                    selected={formData.to_date ? new Date(formData.to_date) : null}
                    onChange={(date) => handleDateChange('to_date', date)}
                    dateFormat="dd-MM-yyyy"
                    className={`w-full border rounded p-2 uppercase ${error ? 'border-red-500' : 'border-gray-300'}`}
                    required
                />
                                    </div>
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <p className="text-red-600 font-medium text-sm mt-1">
                                        {error}
                                    </p>
                                )}
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

                            <button
                                type="submit"
                                disabled={loading}
                                className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isEditing ? 'Edit' : 'Submit'}
                            </button>
                        </form>

                    </div>
                    {/* <div className="w-3/5 overflow-x-auto">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by Name"
                                className="w-full rounded-md p-2.5 border border-gray-300"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
                        </div>
                        <div className="overflow-auto">
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
                                        <th className="py-2 px-4 border border-black uppercase">Remarks</th>
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
                                                        <td className="py-2 px-4 border border-black">{spoc.ticket_date}</td>
                                                        <td className="py-2 px-4 border border-black">
                                                            <img src={spoc.photo} alt="Employee" className="w-12 h-12 object-cover rounded-full" />
                                                        </td>
                                                        <td className="py-2 px-4 border border-black">{spoc.employee_name}</td>
                                                        <td className="py-2 px-4 border border-black">{spoc.employee_id}</td>
                                                        <td className="py-2 px-4 border border-black">{spoc.leave_date}</td>
                                                        <td className="py-2 px-4 border border-black">{spoc.purpose_of_leave}</td>
                                                        <td className="py-2 px-4 border border-black">{spoc.remarks}</td>
                                                        <td className="py-2 px-4 border border-black whitespace-nowrap">
                                                            <button className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={() => handleEdit(spoc)}>Edit</button>
                                                            <button
                                                                disabled={deletingId === spoc.id}
                                                                className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded ${deletingId === spoc.id ? "opacity-50 cursor-not-allowed" : ""} `}
                                                                onClick={() => handleDelete(spoc.id)}>
                                                                {deletingId === spoc.id ? "Deleting..." : "Delete"}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>

                        </div>
                        <div className="flex justify-center mt-4">
                            {Array.from({ length: totalPages }, (_, index) => (
                                <button
                                    key={index + 1}
                                    className={`px-3 py-1 border rounded ${currentPage === index + 1 ? "bg-[#2c81ba] hover:bg-[#0f5381] text-white" : ""}`}
                                    onClick={() => handlePageChange(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    </div> */}

                </div>
            </div>
        </div>

    );
};

export default LeaveManagement;
