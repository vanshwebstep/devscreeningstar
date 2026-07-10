import React, { useEffect, useState, useCallback, useRef } from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useApiLoading } from '../ApiLoadingContext';
import { FaChevronLeft } from 'react-icons/fa';
import Default from "../../imgs/default.png"
import DatePicker from "react-datepicker";
import { format, parseISO } from "date-fns";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
const ExistingUsers = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

    const [responseError, setResponseError] = useState(null);

    const [deleteLoadingId, setDeleteLoadingId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000]; const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [editingUserId, setEditingUserId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingBtn, setLoadingBtn] = useState(false);
    const [adminRoles, setAdminRoles] = useState([]);
    const [files, setFiles] = useState({});
    const [services, setServices] = useState([]);
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

    const [errors, setErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [formData, setFormData] = useState({
        employeePhoto: '',
        employeeName: '',
        employeeMobile: '',
        email: '',
        designation: '',
        role: '',
        permissions: [],
        services: [],

    });
    const storedToken = localStorage.getItem('token');
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem("_token");
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setApiLoading(true);

        try {
            const response = await fetch(
                `https://api.screeningstar.co.in/admin/list?admin_id=${adminId}&_token=${token}`,
                { method: "GET", redirect: "follow" }
            );

            const data = await response.json();

            // Update the token if a new one is provided
            const newToken = data.token || data._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (!response.ok) {
                Swal.fire('Error!', `${data.message}`, 'error');
                setResponseError(data.message);
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setUsers(data.client_spocs || []);
        } catch (error) {
            console.error("Error fetching users:", error.message);
        }
        setApiLoading(false);

        setLoading(false);
    }, [adminId, token]);

    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoading == false) {
                    await validateAdminLogin(); // Verify admin first
                    await fetchUsers();
                } // Fetch data after verification
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login'); // Redirect if validation fails
            }
        };

        initialize(); // Execute the sequence
    }, [navigate, fetchUsers]);

    const fetchAdminRoleList = useCallback(async () => {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            headers: { 'Content-Type': 'application/json' },
            redirect: "follow"
        };

        try {
            const response = await fetch(`https://api.screeningstar.co.in/admin/create-listing?admin_id=${adminId}&_token=${token}`, requestOptions);
            const result = await response.json();

            if (response.ok) {
                const newToken = result.token || result._token || storedToken || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                const roles = result.data.roles?.map(roleObj => roleObj.role) || [];
                const services = result.data.services?.map(service => ({ id: service.id, title: service.title })) || [];
                setServices(services);

                setAdminRoles(roles);

            } else {
                console.error("Failed to fetch roles:", result.message || "Unknown error");
            }
        } catch (error) {
            console.error("Error fetching admin role list:", error);
        }
    }, []);

    const handleEdit = async (user) => {
        // console.log("Fetched adminRoles:", adminRoles);
        const allPermissions = [
            "Client Overview",
            "Admin Manager",
            "Acknowledgement",
            "Tickets",
            "Data Management",
            "Team Management",
            "Application Document",
            "Candidate Manager",
            "Tat Reminder",
            "Report Master",
            "Case Allocation",
            "Human Resource",
            "Employee Credentials",
            "Billing Dashboard",
            "User History",
            "Trash",
            "Internal Storage",
            "Developers",
        ];
        const permissionObject = allPermissions.reduce((acc, permission) => {
            acc[permission] = user.permissions?.includes(permission);
            return acc;
        }, {});
        console.log('allPermissions',)
        const userPermissions = JSON.parse(user.permissions);

        setEditingUserId(user.id);
        setFormData({
            id: user.id || '',
            employeePhoto: user.profile_picture || '',
            employeeName: user.name,
            employeeMobile: user.mobile,
            email: user.email,
            designation: user.designation,
            role: user.role,
            dateofJoining: user.date_of_joining,
            service_ids: user.service_ids,
            employeeId: user.emp_id,
            status: user.status,
            permissions: userPermissions, // Convert to JSON string
            services: user.service_ids ? user.service_ids.split(',') : [],
        });
        console.log('userPermissions', userPermissions)
        await fetchAdminRoleList();
    };


    const handleCancelEdit = () => {
        setEditingUserId(null);
        setFormData({
            id: '',
            employeePhoto: '',
            employeeName: '',
            employeeMobile: '',
            employeeId: '',
            email: '',
            designation: '',
            role: '',
            dateofJoining: '',
            status: '',
            permissions: []
        });
        fetchUsers();
    };

    const handleInputChange = (e) => {
        const { name, value, options, multiple } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));

        if (name === "services" && multiple) {
            const selectedValues = Array.from(options)
                .filter((option) => option.selected)
                .map((option) => option.value);

            setFormData({
                ...formData,
                [name]: selectedValues, // Update services as an array
            });
            return;
        }
        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            if (name === "employeeMobile" && /^\d{10}$/.test(value)) {
                delete newErrors.employeeMobile;
            }
            if (name === "email" && /\S+@\S+\.\S+/.test(value)) {
                delete newErrors.email;
            }
            if (name === "password" && value.length >= 6) {
                delete newErrors.password;
            }
            if (value.trim()) {
                delete newErrors[name];
            }
            return newErrors;
        });
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.employeeName) newErrors.employeeName = "Employee Name is required.";
        if (!formData.employeeMobile) newErrors.employeeMobile = "Employee Mobile is required.";
        if (!formData.services) newErrors.services = "services is required.";

        if (!formData.employeeId) {
            newErrors.employeeId = "Employee ID is required.";
        } else if (/[^a-zA-Z0-9_-]/.test(formData.employeeId)) {
            newErrors.employeeId = "Employee ID must not contain special characters or spaces .";
        } else if (/\s/.test(formData.employeeId)) {
            newErrors.employeeId = "Employee ID must not contain spaces.";
        }
        if (!/^\d{10}$/.test(formData.employeeMobile)) newErrors.employeeMobile = "Mobile must be 10 digits.";
        if (!formData.email) newErrors.email = "Email is required.";
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
        if (!formData.designation) newErrors.designation = "Designation is required.";
        if (!formData.dateofJoining) newErrors.dateofJoining = "Date is required.";
        if (!formData.role) newErrors.role = "Role is required.";
        console.log(`newErrors - `, newErrors);
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles((prevFiles) => ({ ...prevFiles, ['profile-picture']: selectedFiles }));
    };

    const uploadAdminProfilePicture = async (insertedId, adminId, token) => {
        const fileCount = Object.keys(files).length;
        console.log(`File count: ${fileCount}`);

        if (fileCount > 0) {
            for (const [key, value] of Object.entries(files)) {
                console.log(`Processing files for key: ${key}`);

                const formData = new FormData();
                formData.append("admin_id", adminId);
                formData.append("_token", token);
                formData.append("id", insertedId);
                formData.append("send_mail", 0);

                for (const file of value) {
                    formData.append('images', file);
                }

                try {
                    console.log("Sending POST request to upload files...");
                    const response = await axios.post(`https://api.screeningstar.co.in/admin/upload`, formData, {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    });
                    console.log("Upload response:", response.data);
                    const newToken = response.data._token || response.data.token || storedToken;
                    if (newToken) {
                        localStorage.setItem("_token", newToken);
                    }
                    return response.data; // Return response for further use if necessary
                } catch (err) {
                    console.error("Error occurred:", err);
                    Swal.fire('Error!', `An error occurred while uploading profile picture: ${err.message}`, 'error');
                }
            }
        } else {
            console.warn("Upload image first");
            return;
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            Swal.fire({
                icon: "warning",
                title: "Validation Failed",
                text: "Please ensure all fields are filled out correctly.",
            });
            return;
        }

        setLoadingBtn(true); // Start loading

        const adminData = JSON.parse(localStorage.getItem("admin")) || {};
        const token = localStorage.getItem("_token");
        const adminId = adminData.id;
        const fileCount = Object.keys(files).length;
        const isFileUploading = fileCount > 0;
        console.log('mypermission', formData.permissions)
        const allPermissions = [
            "client_overview",
            "team_management",
            "tickets",
            "human_resource",
            "application_document",
            "tat_reminder",
            "employee_credentials",
            "admin_manager",
            "candidate_manager",
            "report_master",
            "billing_dashboard",
            "data_management",
            "acknowledgement",
            "case_allocation",
            "user_history",
            "trash",
            "internal_storage",
            "developers",
        ];
        const permissionsObject = typeof formData.permissions === "string"
            ? JSON.parse(formData.permissions) // Convert string to object
            : formData.permissions || {}; // Use existing object if already parsed

        const permissionObject = allPermissions.reduce((acc, permission) => {
            acc[permission] = !!permissionsObject[permission]; // Convert truthy/falsy values to boolean
            return acc;
        }, {});


        const formPayload = {
            admin_id: adminId,
            _token: token,
            id: formData.id,
            name: formData.employeeName,
            mobile: formData.employeeMobile,
            employee_id: formData.employeeId,
            email: formData.email,
            date_of_joining: formData.dateofJoining.includes('T')
                ? formData.dateofJoining.split('T')[0]  // Extracting only the date part
                : formData.dateofJoining,  // Keeping it as it is if already simple
            designation: formData.designation,
            role: formData.role,
            permissions: JSON.stringify(permissionObject), // Convert to JSON string
            service_ids: formData.services.join(','),
            send_mail: 0,
            status: formData.status,
        };

        try {
            const requestOptions = {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formPayload),
                redirect: "follow",
            };

            const response = await fetch(
                "https://api.screeningstar.co.in/admin/update",
                requestOptions
            );

            const result = await response.json();
            const newToken = result._token || result.token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (result.status) {
                setSubmitMessage("User updated successfully!");
                setFormData({
                    employeePhoto: "",
                    employeeName: "",
                    employeeMobile: "",
                    employeeId: "",
                    email: "",
                    date_of_joining: "",
                    designation: "",
                    role: "",
                });
                if (isFileUploading) {
                    await uploadAdminProfilePicture(formData.id, adminId, token);
                }
                setFiles({})


                Swal.fire({
                    icon: "success",
                    title: "User Updated",
                    text: "User has been updated successfully!",
                }).then(() => {
                    handleCancelEdit();
                });
            } else {
                setSubmitMessage("Failed to update user.");
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: result.message || result.error || "Failed to update user.",
                });
            }
        } catch (error) {
            console.error("Error uploading user data:", error);
            setSubmitMessage("Failed to update user.");
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to update user. Please try again later.",
            });
        } finally {
            setLoadingBtn(false); // Stop loading after the process ends
        }
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

    const handleDelete = useCallback((id) => {
        // Show confirmation dialog
        Swal.fire({
            title: 'Are you sure?',
            text: `This action will delete the admin. You can't undo this!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel',
        }).then((result) => {
            if (result.isConfirmed) {
                // Set the loading state for the specific button
                setDeleteLoadingId(id);

                // Get admin ID and token from localStorage
                const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
                const storedToken = localStorage.getItem("_token");
                const formdata = new FormData();

                const requestOptions = {
                    method: "DELETE",
                    body: formdata,
                    redirect: "follow"
                };

                // Perform the DELETE request to delete the admin
                fetch(`https://api.screeningstar.co.in/admin/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
                    .then((response) => response.json())
                    .then((result) => {
                        const newToken = result.token || result._token || storedToken || '';
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }
                        if (result.status) {
                            Swal.fire('Deleted!', result.message, 'success');
                        } else {
                            Swal.fire('Error!', result.message, 'error');
                        }
                        fetchUsers(); // Refresh the list of active accounts
                    })
                    .catch((error) => {
                        console.error(error);
                        Swal.fire('Error!', 'There was an issue deleting the admin.', 'error');
                    })
                    .finally(() => {
                        // Reset loading state after operation completes
                        setDeleteLoadingId(null);
                    });
            } else {
                Swal.fire('Cancelled', 'The admin deletion was cancelled.', 'info');
            }
        });
    }, [fetchUsers]);


    const formatRole = (role) => {
        return role
            .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special characters with spaces
            .split(" ") // Split into words
            .filter(Boolean) // Remove empty strings from the array
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
            .join(" "); // Join words with spaces
    };
    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.emp_id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentData = filteredUsers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    console.log('formdata', formData)
    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            services: checked
                ? [...(prev.services || []), value]
                : prev.services.filter((id) => id !== value),
        }));
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [currentData, loading]);
    const handleCheckboxChangeRole = (e) => {
        const { value, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            permissions: {
                ...prev.permissions,
                [value]: checked, // Toggle true/false
            },
        }));
    };

    return (

        <div className="w-full border border-black overflow-hidden">
            <div className="space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
                {editingUserId ? (
                    <>
                        <div onClick={handleCancelEdit} className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                        >
                            <FaChevronLeft className="text-xl text-white" />
                            <span className="font-semibold text-lg">Go Back</span>
                        </div>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="employeePhoto" className="block mb-1 text-sm font-medium">
                                    Employee Photo<span className="text-red-500 text-xl">*</span>
                                </label>
                                <input
                                    id="employeePhoto"
                                    type="file"
                                    name="employeePhoto"
                                    accept="image/*"
                                    className="w-full p-3 border border-gray-300 rounded-md text-left appearance-none"
                                    onChange={handleFileChange}
                                />
                                {formData.employeePhoto && (
                                    <img
                                        src={formData.employeePhoto ? formData.employeePhoto : `${Default}`}
                                        alt={`${formData.employeeName}'s photo`}
                                        className="w-20 h-20 mt-2 rounded-full"
                                    />
                                )}
                            </div>
                            <div>
                                <label htmlFor="employeeName" className="block mb-1 text-sm font-medium">
                                    Employee Name<span className="text-red-500 text-xl">*</span>
                                </label>
                                <input
                                    id="employeeName"
                                    type="text"
                                    name="employeeName"
                                    placeholder="Employee Name"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    value={formData.employeeName}
                                    onChange={handleInputChange}
                                    required
                                />
                                {errors.employeeName && <p className="text-red-500 text-sm">{errors.employeeName}</p>}
                            </div>
                            <div>
                                <label htmlFor="employeeId" className="block mb-1 text-sm font-medium">
                                    Employee ID<span className="text-red-500 text-xl">*</span>
                                </label>
                                <input
                                    id="employeeId"
                                    type="text"
                                    name="employeeId"
                                    placeholder="Employee ID"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    value={formData.employeeId}
                                    onChange={handleInputChange}
                                    required
                                />
                                {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
                            </div>
                            <div>
                                <label htmlFor="employeeMobile" className="block mb-1 text-sm font-medium">
                                    Employee Mobile<span className="text-red-500 text-xl">*</span>
                                </label>
                                <input
                                    id="employeeMobile"
                                    type="text"
                                    name="employeeMobile"
                                    placeholder="Employee Mobile"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    value={formData.employeeMobile}
                                    onChange={handleInputChange}
                                    required
                                />
                                {errors.employeeMobile && <p className="text-red-500 text-sm">{errors.employeeMobile}</p>}
                            </div>

                            <div>
                                <label htmlFor="email" className="block mb-1 text-sm font-medium">
                                    Email<span className="text-red-500 text-xl">*</span>
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Email"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="designation" className="block mb-1 text-sm font-medium">
                                    Designation<span className="text-red-500 text-xl">*</span>
                                </label>
                                <input
                                    id="designation"
                                    type="text"
                                    name="designation"
                                    placeholder="Designation"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    value={formData.designation}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="dateofJoining" className="block mb-1 text-sm font-medium">
                                    Date of Joining<span className="text-red-500 text-xl">*</span>
                                </label>
                                <DatePicker
                                    id="dateofJoining"
                                    name="dateofJoining"
                                    selected={
                                        formData.dateofJoining && formData.dateofJoining.trim() !== ""
                                            ? parseISO(formData.dateofJoining)
                                            : null
                                    }
                                    onChange={(date) => {
                                        if (!date) {
                                            setFormData({ ...formData, dateofJoining: "" });
                                            return;
                                        }
                                        const formatted = format(date, "yyyy-MM-dd"); // for saving
                                        setFormData({ ...formData, dateofJoining: formatted });
                                    }}
                                    dateFormat="dd-MM-yyyy" // for display
                                    placeholderText="DD-MM-YYYY"
                                    className="uppercase w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="role" className="block mb-1 text-sm font-medium">
                                    Role<span className="text-red-500 text-xl">*</span>
                                </label>
                                <select
                                    id="role"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Select Role</option>
                                    {adminRoles.map((role, index) => (
                                        <option key={index} value={role}>
                                            {formatRole(role)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {formData.role && formData.role !== "admin_user" && (
                                <>
                                    {Object.keys(formData.permissions || {}).length > 0 && (
                                        <div className="border rounded-lg mb-4 p-2 border-black">
                                            <label className="block text-xl font-bold mb-1">
                                                Permissions <span className="text-red-500 text-xl">*</span>
                                            </label>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                                {[
                                                    "Client Overview",
                                                    "Admin Manager",
                                                    "Acknowledgement",
                                                    "Tickets",
                                                    "Data Management",
                                                    "Team Management",
                                                    "Application Document",
                                                    "Candidate Manager",
                                                    "Tat Reminder",
                                                    "Report Master",
                                                    "Case Allocation",
                                                    "Human Resource",
                                                    "Employee Credentials",
                                                    "Billing Dashboard",
                                                    "User History",
                                                    "Trash",
                                                    "Internal Storage",
                                                    "Developers",
                                                ].map((permission) => {
                                                    const formattedValue = permission.toLowerCase().replace(/\s+/g, "_");
                                                    const isChecked = formData.permissions?.[formattedValue] ?? false;

                                                    return (
                                                        <label key={formattedValue} className="flex items-center space-x-2">
                                                            <input
                                                                type="checkbox"
                                                                disabled={loadingBtn}
                                                                value={formattedValue}
                                                                checked={isChecked}
                                                                onChange={handleCheckboxChangeRole}
                                                                className="w-5 h-5 rounded-full"
                                                            />
                                                            <span>{permission}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {services.length > 0 && (
                                        <div className="border rounded-lg p-2 border-black">
                                            <label className="block text-xl font-bold mb-1">
                                                Services <span className="text-red-500 text-xl">*</span>
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                                                {services.map((service) => (
                                                    <label key={service.id} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            name="services"
                                                            disabled={loadingBtn}
                                                            value={service.id.toString()}
                                                            checked={formData.services?.includes(service.id.toString())}
                                                            onChange={handleCheckboxChange}
                                                            className="w-5 h-5"

                                                        />
                                                        <span>{service.title}</span>
                                                    </label>
                                                ))}
                                            </div>

                                            {errors.services && <p className="text-red-500 text-sm">{errors.services}</p>}
                                        </div>
                                    )}
                                </>
                            )}


                            <div>
                                <label htmlFor="status" className="block mb-1 text-sm font-medium">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    className="w-full p-3 mb-[20px] border border-gray-300 rounded-md"
                                    name="status"
                                    disabled={loadingBtn}
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Choose Any Status</option>
                                    <option value="1">Active</option>
                                    <option value="0">Inactive</option>
                                </select>
                            </div>
                            <div className="text-left">
                                <button
                                    type="submit"
                                    className={`p-6 py-3 bg-[#2c81ba]  hover:scale-105 text-white font-bold rounded-md hover:bg-[#0f5381]  ${loadingBtn ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    disabled={loadingBtn}
                                >
                                    Submit
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className={`p-6 py-3 ml-2 bg-red-500  hover:scale-105 text-white font-bold rounded-md hover:bg-red-600 ${loadingBtn ? "opacity-50 cursor-not-allowed" : ""
                                        }`}
                                    disabled={loadingBtn}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div>
                        <div className="block items-center mb-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Search by Name or ID"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-4 py-2 border border-gray-400 rounded-md md:w-1/3 w-full"
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

                                <table className="min-w-full border-collapse border whitespace-nowrap border-black">
                                    <thead>
                                        <tr className="bg-[#c1dff2] text-[#4d606b]">
                                            <th className="border border-black uppercase px-4 py-2">SL</th>
                                            <th className="border border-black uppercase px-4 py-2">
                                                Employee Photo
                                            </th>
                                            <th className="border border-black uppercase px-4 py-2">
                                                Employee ID
                                            </th>
                                            <th className="border border-black uppercase text-left px-4 py-2">
                                                Name
                                            </th>
                                            <th className="border border-black uppercase text-left px-4 py-2">
                                                Mobile Number
                                            </th>
                                            <th className="border border-black uppercase text-left px-4 py-2">
                                                Email
                                            </th>
                                            <th className="border border-black uppercase px-4 py-2">
                                                Designation
                                            </th>
                                            <th className="border border-black uppercase px-4 py-2">Role</th>
                                            <th className="border border-black uppercase px-4 py-2">
                                                Date Of Joining
                                            </th>
                                            <th className="border border-black uppercase px-4 py-2">
                                                Status
                                            </th>
                                            <th
                                                className="border border-black uppercase px-4 py-2"
                                                colSpan={2}
                                            >
                                                Action
                                            </th>
                                        </tr>
                                    </thead>
                                    {loading ? (
                                        <tbody>
                                            <tr>
                                                <td colSpan="11" className="py-10 text-center">
                                                    <div className='flex justify-center items-center'>
                                                        <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    ) : (
                                        <tbody>
                                            {currentData.length > 0 ? (
                                                currentData.map((user, index) => (
                                                    <tr key={user.id}>
                                                        <td className="border border-black px-4 py-2">
                                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                                        </td>
                                                        <td className="border border-black text-center px-4 py-2">
                                                            <img
                                                                src={user.profile_picture ? user.profile_picture : `${Default}`}
                                                                alt={user.name}
                                                                className="w-10 h-10 mx-auto rounded-full"
                                                            />
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            {user.emp_id || "N/A"}
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            {user.name || "N/A"}
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            {user.mobile || "N/A"}
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            {user.email || "N/A"}
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            {user.designation || "N/A"}
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            {formatRole(user.role || "N/A")}
                                                        </td>
                                                        <td className="border border-black px-4 py-2 text-left">
                                                            {formatDate(user.date_of_joining) || "N/A"}

                                                        </td>
                                                        <td className={`border border-black px-4  text-center uppercase py-2 ${user.status && user.status == 1 ? 'text-green-500' : 'text-red-500'}`}>
                                                            {user.status && user.status == 1 ? 'Active' : 'Inactive'}
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            <button onClick={() => handleEdit(user)}>
                                                                <MdEdit
                                                                    className="text-blue-500 font-bold transform transition-transform duration-300 ease-in-out hover:text-blue-600 hover:scale-110 hover:shadow-md"
                                                                    aria-label="Edit"
                                                                />


                                                            </button>
                                                        </td>
                                                        <td className="border border-black px-4 py-2">
                                                            <button onClick={() => handleDelete(user.id)}>
                                                                <MdDelete className={`text-red-500 text-lg font-bold transform transition-transform duration-300 ease-in-out hover:text-red-600 hover:scale-110 hover:shadow-md   ${deleteLoadingId == user.id ? 'opacity-50 text-black  hover:text-black cursor-not-allowed' : ''} `} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td
                                                        colSpan="11"
                                                        className="px-4 py-2 text-center text-red-500"
                                                        style={{ height: "100px" }}
                                                    >
                                                        {responseError || "No Admin Found"}
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
                )}
            </div>
        </div>
    );
};
export default ExistingUsers;
