import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';

const Universities = () => {
    const clientEditRef = useRef(null);
    const [deletingId, setDeletingId] = useState(null);
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const navigate = useNavigate();
    const [spocs, setSpocs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [services, setServices] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalServices, setModalServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responseError, setResponseError] = useState(null);
    const [selectedServices, setSelectedServices] = useState([]);
    const [formData, setFormData] = useState({
        university_name: "",
        university_address: "",
        contact_name: "",
        designation: "",
        mobile_number: "",
        email_id: "",
        scope_of_services: "",
        pricing: "",
        turnaround_time: "",
        standard_process: "",
        verification_link: "",
        remark: "",
    });

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
    const [isEditing, setIsEditing] = useState(false);
    const [currentSpocId, setCurrentSpocId] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const handleViewMore = (services) => {
        setModalServices(services);
        setIsModalOpen(true);
    };

    const handleCloseServiceModal = () => {
        setIsModalOpen(false);
        setModalServices([]);
    };
    const fetchData = useCallback(async () => {
        setLoading(true);
        setApiLoading(true);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error('Missing admin_id or _token');
            setLoading(false);
            setApiLoading(false);
            return;
        }

        const url = `https://api.screeningstar.co.in/internal-storage/university/list?admin_id=${admin_id}&_token=${storedToken}`;

        try {
            const response = await fetch(url, {
                method: "GET",
                redirect: "follow",
            });

            const data = await response.json();

            if (!response.ok) {
                Swal.fire('Error!', `${data.message}`, 'error');
                setResponseError(data.message);
                throw new Error('Network response was not ok');
            }

            const newToken = data.token || data._token || storedToken;
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }
            const myServices = data.data.services;

            const serviceOptions = myServices.map((service, index) => ({
                value: service.id,
                label: service.title,
                key: `${service.title}-${index}` // Ensure key is unique
            }));

            setServices(serviceOptions);
            setSpocs(data.data.universities || []);

        } catch (error) {
            console.error('Fetch error:', error);
        } finally {
            setLoading(false);
            setApiLoading(false);
        }
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


    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const normalizedValue =
            name === 'scope_of_services' && /^\d+$/.test(value) ? Number(value) : value;

        if (type === "checkbox") {
            if (name === 'scope_of_services') {
                setSelectedServices((prevData) => {
                    const existing = prevData[name] || [];

                    if (checked) {
                        if (!existing.includes(normalizedValue)) {
                            return {
                                ...prevData,
                                [name]: [...existing, normalizedValue],
                            };
                        }
                        return prevData;
                    } else {
                        return {
                            ...prevData,
                            [name]: existing.filter((v) => v !== normalizedValue),
                        };
                    }
                });
            } else {
                setFormData((prevData) => {
                    const existing = prevData[name] || [];

                    if (checked) {
                        if (!existing.includes(value)) {
                            return {
                                ...prevData,
                                [name]: [...existing, value],
                            };
                        }
                        return prevData;
                    } else {
                        return {
                            ...prevData,
                            [name]: existing.filter((v) => v !== value),
                        };
                    }
                });
            }
        } else {
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiLoading(true);

        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        const raw = JSON.stringify({
            ...formData,
            ...(selectedServices?.scope_of_services ? { scope_of_services: selectedServices.scope_of_services.join(',') } : {}),
            admin_id,
            _token: storedToken,
        });


        const requestOptions = {
            method: isEditing ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: raw,
        };

        const url = isEditing
            ? "https://api.screeningstar.co.in/internal-storage/university/update"
            : "https://api.screeningstar.co.in/internal-storage/university/create";

        try {
            const response = await fetch(url, requestOptions);

            // Extract response data
            const data = await response.json();
            const newToken = data.token || data._token || storedToken || "";
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (response.ok) {
                setLoading(false);
                setApiLoading(false);

                // Refresh data and reset form
                fetchData();
                setFormData({
                    university_name: "",
                    university_address: "",
                    contact_name: "",
                    designation: "",
                    mobile_number: "",
                    email_id: "",
                    scope_of_services: "",
                    pricing: "",
                    turnaround_time: "",
                    standard_process: "",
                    verification_link: "",
                    remark: ""
                });
                setSelectedServices([]);
                setIsEditing(false);
                setCurrentSpocId(null);

                // Display success message dynamically
                Swal.fire(
                    "Success!",
                    isEditing ? "Form updated successfully." : "Form submitted successfully.",
                    "success"
                );
            } else {
                setLoading(false);
                setApiLoading(false);

                // Display error message dynamically
                const errorMessage = data.message || "Failed to submit form. Please try again.";
                Swal.fire("Error!", errorMessage, "error");
            }
        } catch (error) {
            setLoading(false);
            setApiLoading(false);

            // Catch unexpected errors
            Swal.fire("Error!", `An unexpected error occurred: ${error.message}`, "error");
            console.error("Error submitting form:", error);
        }
    };


    const handleEdit = (spoc) => {
        if (clientEditRef.current) {
            clientEditRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        console.log('spoc', spoc);

        // Convert "2,4,6" => [2, 4, 6]
        const servicesArray = spoc.scope_of_services
            ? spoc.scope_of_services.split(',').map(Number)
            : [];

        // Update selectedServices with the parsed array
        setSelectedServices(prev => ({
            ...prev,
            scope_of_services: servicesArray
        }));

        setFormData(spoc);
        setIsEditing(true);
        setCurrentSpocId(spoc.id);
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
                    `https://api.screeningstar.co.in/internal-storage/university/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
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
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentSpocs = spocs
        .filter((spoc) => spoc.university_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
        spoc.university_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [currentSpocs, loading]);
    const handleCancel = () => {
        fetchData();
        setFormData({
            university_name: "",
            university_address: "",
            contact_name: "",
            designation: "",
            mobile_number: "",
            email_id: "",
            scope_of_services: "",
            pricing: "",
            turnaround_time: "",
            standard_process: "",
            verification_link: "",
            remark: ""
        });
        setSelectedServices([]);
        setIsEditing(false);
        setCurrentSpocId(null);
    };
    return (

        <div className=" ">
            <div className="bg-white  md:p-12 p-6 border border-black w-full mx-auto">
                <div className="md:flex space-x-4">

                    <div ref={clientEditRef} className="md:w-2/5">
                        <form className="space-y-4 ps-0 pb-[30px]  md:pr-[30px] bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
                            <div className="w-full">
                                <label htmlFor="university_name" className="block text-left w-full  m-auto mb-2 text-gray-700">Name of the University</label>
                                <input
                                    type="text"
                                    name="university_name"
                                    placeholder="NAME OF THE UNIVERSITY"
                                    value={formData.university_name}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md`}
                                />
                            </div>

                            {/* Full Name */}
                            <div className="w-full">
                                <label htmlFor="university_address" className="block text-left w-full  m-auto mb-2 text-gray-700">University Address</label>
                                <input
                                    type="text"
                                    name="university_address"
                                    placeholder="University Address"
                                    value={formData.university_address}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md`}
                                />
                            </div>
                            <div className="w-full">
                                <label htmlFor="contact_name" className="block text-left w-full  m-auto mb-2 text-gray-700">Contact Name</label>
                                <input
                                    type="text"
                                    name="contact_name"
                                    placeholder="Contact Name "
                                    value={formData.contact_name}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300  rounded-md`}
                                />
                            </div>




                            <div className="w-full">
                                <label htmlFor="designation" className="block text-left w-full  m-auto mb-2 text-gray-700">Designation </label>
                                <input
                                    type="text"
                                    name="designation"
                                    placeholder="Designation"
                                    value={formData.designation}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md`}
                                />
                            </div>

                            <div className="w-full">
                                <label htmlFor="mobile_number" className="block text-left w-full m-auto mb-2 text-gray-700">Mobile Number</label>
                                <input
                                    type="text"
                                    name="mobile_number"
                                    placeholder="Mobile Number"
                                    value={formData.mobile_number}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md`}
                                />
                            </div>

                            <div className="mb-4">
                                <label htmlFor="email_id" className='block text-left w-full m-auto mb-2 text-gray-700'>Email Id</label>
                                <input
                                    type="text"
                                    name="email_id"
                                    placeholder="Email Id"
                                    value={formData.email_id}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md`}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="scope_of_services">
                                    Scope Of Services
                                </label>
                                <div className="flex grid grid-cols-2 flex-col gap-2">
                                    {services.map((service) => (
                                        <label key={service.value} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                name="scope_of_services"
                                                value={service.value}
                                                checked={selectedServices?.scope_of_services?.includes(Number(service.value)) || false}
                                                onChange={handleChange}
                                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-sm">{service.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>


                            <div className="mb-4">
                                <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="pricing">
                                    Pricing
                                </label>
                                <input
                                    type="text"
                                    name="pricing"
                                    value={formData.pricing}

                                    id="pricing"
                                    className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                    placeholder="Pricing"
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="mb-4">
                                <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="turnaround_time">
                                    Turnaround Time
                                </label>
                                <input
                                    type="text"
                                    value={formData.turnaround_time}
                                    name="turnaround_time"
                                    id="turnaround_time"
                                    className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                    placeholder="Turnaround Time"
                                    onChange={handleChange}
                                />
                            </div>


                            <div className="mb-4">
                                <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="standard_process">
                                    Standard Process
                                </label>
                                <input
                                    type="text"
                                    name="standard_process"
                                    value={formData.standard_process}
                                    id="standard_process"
                                    className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                    placeholder="Standard Process"
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="verification_link">
                                    Verification Link
                                </label>
                                <input
                                    type="text"
                                    name="verification_link"
                                    value={formData.verification_link}
                                    id="verification_link"
                                    className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                    placeholder="Verification Link"
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="remark">
                                    Remark
                                </label>
                                <input
                                    type="text"
                                    name="remark"
                                    value={formData.remark}
                                    id="remark"
                                    className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                    placeholder="Remark"
                                    onChange={handleChange}
                                />
                            </div>
                            <div className={"flex gap-2 justify-center"}>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className={`px-8 py-3 bg-[#2c81ba]  w-full text-white font-bold rounded-md hover:bg-[#0f5381] hover:scale-105 transition flex justify-center text-center items-center  duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""
                                            }`}
                                    >
                                        {isEditing ? "Edit" : "Submit"}
                                    </button>
                                </div>

                                {!isEditing && (
                                    <div className='flex items-center gap-7'>
                                        <div>
                                            <h3 className='text-xl font-bold'>OR</h3>
                                        </div>
                                        <button
                                            onClick={() => navigate('/admin-UniversitiesBulk')}
                                            disabled={loading}
                                            className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold  transition duration-200  rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Bulk Upload
                                        </button>
                                    </div>
                                )}

                                {isEditing && (
                                    <div>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className={`p-6 py-3 bg-red-500 text-white font-bold rounded-md hover:bg-red-600 hover:scale-105 transition flex justify-center text-center items-center w-full duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                                        >
                                            CANCEL
                                        </button>
                                    </div>

                                )}

                            </div>
                        </form>
                    </div>
                    <div className="md:w-3/5 overflow-x-auto no-margin">
                        <div className="mb-4">
                            <input
                                type="text"
                                placeholder="Search by University Name"
                                className="w-full rounded-md p-2.5 border border-gray-300"
                                value={searchTerm}
                                onChange={handleSearch}
                            />
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
                                            <th className="uppercase border border-black px-4 py-2">Sl No.</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">University Name</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">University Address</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Contact Name</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Designation</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Mobile Number</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Email ID</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Scope of Services</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Pricing</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Turnaround Time</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Standard Process</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Verification Link</th>
                                            <th className="uppercase border border-black px-4 py-2 text-left">Remark</th>

                                            <th className="py-2 px-4 border border-black text-center uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-4 text-center text-gray-500">
                                                    <Loader className="text-center" />
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {currentSpocs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="py-4 text-center text-red-500">
                                                            {responseError && responseError !== "" ? responseError : "No data available in table"}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentSpocs.map((spoc, index) => (
                                                        <tr key={spoc.id} className="hover:bg-gray-200">
                                                            <td className="py-2 px-4 border border-black">{index + indexOfFirstItem + 1}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.university_name}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.university_address}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.contact_name}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.designation}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.mobile_number}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.email_id}</td>
                                                            <td className="border border-black px-4 py-2 text-center">
                                                                <div className="flex items-center">
                                                                    {spoc.scope_of_services ? (() => {
                                                                        const selectedIds = spoc.scope_of_services.split(',').map(id => parseInt(id.trim()));
                                                                        const matchedServices = services
                                                                            .filter(service => selectedIds.includes(service.value))
                                                                            .map(s => ({ serviceTitle: s.label }));

                                                                        return matchedServices.length > 0 ? (
                                                                            <>
                                                                                <span className="px-4 py-2 bg-blue-100 whitespace-nowrap border border-blue-500 rounded-lg text-sm">
                                                                                    {matchedServices[0].serviceTitle}
                                                                                </span>
                                                                                {matchedServices.length > 1 && (
                                                                                    <button
                                                                                        className="text-blue-500 whitespace-nowrap ml-2"
                                                                                        onClick={() => handleViewMore(matchedServices)}
                                                                                    >
                                                                                        View More
                                                                                    </button>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                                                                No Services Available
                                                                            </span>
                                                                        );
                                                                    })() : (
                                                                        <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                                                            No Services Available
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>                                                        <td className="border border-black px-4 py-2 text-left">{spoc.pricing}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.turnaround_time}</td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.standard_process}</td>
                                                            <td className="border border-black px-4 py-2 text-left">
                                                                {spoc.verification_link}
                                                            </td>
                                                            <td className="border border-black px-4 py-2 text-left">{spoc.remark}</td>
                                                            <td className="py-2 px-4 border border-black whitespace-nowrap">
                                                                <button className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={() => handleEdit(spoc)}>Edit</button>
                                                                <button
                                                                    disabled={deletingId === spoc.id}
                                                                    className={`bg-red-500 hover:scale-105 hover:bg-red-600  text-white px-4 py-2 rounded ${deletingId === spoc.id ? "opacity-50 cursor-not-allowed" : ""} `}
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
                    </div>
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
                            <div className="bg-white rounded-lg shadow-lg p-4 md:mx-0 mx-4 md:w-1/3">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold">Services</h2>
                                    <button className="text-red-500 text-2xl" onClick={handleCloseServiceModal}>
                                        &times;
                                    </button>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2 w-full max-h-96 overflow-y-auto">
                                    {modalServices.length > 0 ? (
                                        modalServices.map((service, idx) => (
                                            <span
                                                key={idx}
                                                className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm"
                                            >
                                                {service.serviceTitle}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-500">No service available</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};

export default Universities;
