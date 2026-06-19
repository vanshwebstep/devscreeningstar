import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2'
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css'; // Correct import path for CSS
import { Navigation, Thumbs } from 'swiper'; // Import modules directly
import { useNavigate } from "react-router-dom";
import { FaChevronLeft } from 'react-icons/fa';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, parse } from "date-fns";
import { useApiLoading } from '../ApiLoadingContext';


const DataGenerateReport = () => {
    const navigate = useNavigate();
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [checkboxState, setCheckboxState] = useState({});
function formatDateSafe(dateValue) {
  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
}
    const [submittedData, setSubmittedData] = useState(null); // State to hold submitted data
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [servicesForm, setServicesForm] = useState('');
    const [applicationRefID, setApplicationRefID] = useState('');
    const [servicesDataInfo, setServicesDataInfo] = useState('');
    const [servicesData, setServicesData] = useState([]);
    const [branchInfo, setBranchInfo] = useState([]);
    const [customerInfo, setCustomerInfo] = useState([]);
    const [referenceId, setReferenceId] = useState("");
    const [thumbsSwiper, setThumbsSwiper] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [adminDataList, setAdminDataList] = useState([]);
    const [adminNames, setAdminNames] = useState([]);
    const [errors, setErrors] = useState({});
    const inputRefs = useRef({});
    const [myData_qc, setMyData_qc] = useState("");
    const [myBasic_entry, setMyBasic_entry] = useState();
    const parseDate = (dateStr) => {
        return dateStr ? parse(dateStr, "yyyy-MM-dd", new Date()) : null;
    };
    const [formData, setFormData] = useState({
        client_organization_name: '',
        client_applicant_name: '',
        client_applicant_gender: '',
        client_organization_code: '',
        updated_json: {
            month_year: '',
            initiation_date: '',
            organization_name: '',
            verification_purpose: '',
            employee_id: '',
            client_code: '',
            applicant_name: '',
            contact_number: '',
            contact_number2: '',
            father_name: '',
            spouse_name: '',
            dob: '',
            gender: '',
            marital_status: '',
            Nationality: '',
            QC_Date: '',
            QC_Analyst_Name: '',
            Data_Entry_Analyst_Name: '',
            Date_of_Data: '',
            insuff: '',
            address: {
                address_house_no: "",
                address_floor: " ",
                address_cross: " ",
                address_street: "",
                address_main: "",
                address_area: " ",
                address_locality: "",
                address_city: "",
                address_landmark: " ",
                address_taluk: "",
                address_district: "",
                address_state: "",
                address_pin_code: ""
            },

            permanent_address: {
                permanent_address: "",
                permanent_address_house_no: "",
                permanent_address_floor: "",
                permanent_address_cross: "",
                permanent_address_street: "",
                permanent_address_main: "",
                permanent_address_area: "",
                permanent_address_locality: "",
                permanent_address_city: "",
                permanent_address_landmark: "",
                permanent_address_taluk: "",
                permanent_address_district: "",
                permanent_address_state: "",
                permanent_address_pin_code: ""
            }

        },
    });
    console.log('myData_qc', myData_qc)

    const openModal = (image) => {
        setSelectedImage(`${image.trim()}`);
        setModalOpen(true);
    };

    // Close the modal
    const closeModal = () => {
        setModalOpen(false);
        setSelectedImage(null);
    };
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    // Initialize `selectedStatuses` only if it's empty or if `servicesDataInfo` changes length
    useEffect(() => {
        if (servicesDataInfo && servicesDataInfo.length > 0) {
            // Check if selectedStatuses has been initialized already to avoid resetting
            if (selectedStatuses.length === 0 || selectedStatuses.length !== servicesDataInfo.length) {
                const initialStatuses = servicesDataInfo.map((serviceData) => {
                    // Get status or fallback to an empty string
                    return serviceData?.annexureData?.status || '';
                });
                setSelectedStatuses(initialStatuses);
            }
        }
    }, [servicesDataInfo]); // Only trigger when `servicesDataInfo` changes

    const handleStatusChange = (e, index) => {
        const updatedStatuses = [...selectedStatuses];
        updatedStatuses[index] = e.target.value;
        setSelectedStatuses(updatedStatuses);
    };

    // Check if all statuses are 'completed' (as per your original logic)
    const allCompleted = selectedStatuses.every(status =>
        status && status.includes('completed')
    );

    const handleFileChange = (index, dbTable, fileName, e) => {

        const selectedFiles = Array.from(e.target.files);

        // Update the state with the new selected files
        setFiles((prevFiles) => ({
            ...prevFiles,
            [dbTable]: { selectedFiles, fileName },
        }));
    };

    const applicationId = new URLSearchParams(window.location.search).get('applicationId');
    const branchid = new URLSearchParams(window.location.search).get('branchid');
    const fromTat = new URLSearchParams(window.location.search).get('from-tat');


    // Set referenceId only once when applicationId changes
    useEffect(() => {
        if (applicationId) setReferenceId(applicationId);
    }, [applicationId]); // Only rerun when applicationId changes



    function parseAndConvertDate(inputDate) {
        // Try parsing with the built-in Date constructor
        let parsedDate = new Date(inputDate);

        // If the input date is invalid, attempt to handle common date formats manually
        if (isNaN(parsedDate)) {
            // Handle potential formats manually
            if (/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(inputDate)) {
                // ISO 8601 format (e.g., "2024-11-19T14:54:38.000Z")
                parsedDate = new Date(inputDate);
            } else if (/\d{4}\/\d{2}\/\d{2}/.test(inputDate)) {
                // "YYYY/MM/DD" format (e.g., "2023/12/11")
                parsedDate = new Date(inputDate.replace(/\//g, '-'));
            } else if (/\d{2}-\d{2}-\d{4}/.test(inputDate)) {
                // "DD-MM-YYYY" format (e.g., "13-11-2024")
                const [day, month, year] = inputDate.split('-');
                parsedDate = new Date(`${year}-${month}-${day}`);
            } else {
                // If it's still not valid, return fallback date
                parsedDate = 'N/A';
            }
        }

        // Format the date to 'YYYY-MM-DD' format
        const formattedDate = parsedDate.toISOString().split('T')[0]; // Extracts only the date portion
        return formattedDate;
    }

    const fetchApplicationData = useCallback(() => {
        setLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/data-management/application-by-id?application_id=${applicationId}&branch_id=${branchid}&admin_id=${adminId}&_token=${token}`, requestOptions)
            .then((response) => response.json())
            .then((result) => {
                // Check if result is valid
                if (!result || !result.application) {
                    setLoading(false);
                    return;
                }

                const newToken = result.token || result._token || token || '';
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                const applicationData = result.application;
                const cmtData = result.CMTData || [];
                const services = applicationData.services;
                setMyData_qc(applicationData.is_data_qc);
                fetchServicesJson(services);
                setMyBasic_entry(applicationData.is_basic_entry || "0")
                const uniqueNames = [...new Set(result.admins.map(admin => admin.name))];
                setAdminNames(uniqueNames);
                setServicesForm(services);
                setServicesData(result);
                setBranchInfo(result.branchInfo);
                setCustomerInfo(result.customerInfo);
                setApplicationRefID(applicationData.application_id);

                setFormData(prevFormData => ({
                    ...prevFormData,
                    client_organization_name: result.customerInfo.name || result.branchInfo.name || prevFormData.client_organization_name || '',
                    client_applicant_name: applicationData.name || prevFormData.updated_json.name || '',
                    client_applicant_gender: applicationData.gender || prevFormData.client_applicant_gender || '',
                    client_organization_code: result.customerInfo.client_unique_id || cmtData.client_code || prevFormData.updated_json.client_code || '',
                    updated_json: {
                        month_year: cmtData.month_year || applicationData.month_year || prevFormData.updated_json.month_year || '',
                        verification_purpose: cmtData.verification_purpose || prevFormData.updated_json.verification_purpose || '',
                        employee_id: cmtData.employee_id || applicationData.employee_id || prevFormData.updated_json.employee_id || '',
                        contact_number: cmtData.contact_number || prevFormData.updated_json.contact_number || '',
                        contact_number2: cmtData.contact_number2 || prevFormData.updated_json.contact_number2 || '',
                        spouse_name: cmtData.spouse_name || prevFormData.updated_json.spouse_name || '',
                        Nationality: cmtData.Nationality || prevFormData.updated_json.Nationality || '',
                        QC_Date: cmtData?.QC_Date
                            ? new Date(cmtData.QC_Date).toISOString().split('T')[0]
                            : (prevFormData?.updated_json?.QC_Date
                                ? new Date(prevFormData.updated_json.QC_Date).toISOString().split('T')[0]
                                : ''),
                        QC_Analyst_Name: cmtData.QC_Analyst_Name || prevFormData.updated_json.QC_Analyst_Name || '',
                        Data_Entry_Analyst_Name: cmtData.Data_Entry_Analyst_Name || prevFormData.updated_json.Data_Entry_Analyst_Name || '',
                        Date_of_Data: cmtData.Date_of_Data || prevFormData.updated_json.Date_of_Data || '',
                        father_name: cmtData.father_name || prevFormData.updated_json.father_name || '',
                        initiation_date: cmtData?.initiation_date
                            ? new Date(cmtData.initiation_date).toISOString().split('T')[0]
                            : (prevFormData?.updated_json?.insuffDetails?.initiation_date
                                ? new Date(prevFormData.updated_json.insuffDetails.initiation_date).toISOString().split('T')[0]
                                : ''),
                        dob: formatDateSafe(cmtData?.dob || prevFormData?.updated_json?.insuffDetails?.dob),

                        marital_status: cmtData.marital_status || prevFormData.updated_json.marital_status || '',
                        insuff: cmtData.insuff || prevFormData.updated_json.insuff || '',
                        address: {
                            address: cmtData.address || prevFormData.updated_json.address.address || '',
                            address_floor: cmtData.address_floor || prevFormData.updated_json.address.address_floor || '',
                            address_cross: cmtData.address_cross || prevFormData.updated_json.address.address_cross || '',
                            address_street: cmtData.address_street || prevFormData.updated_json.address.address_street || '',
                            address_main: cmtData.address_main || prevFormData.updated_json.address.address_main || '',
                            address_area: cmtData.address_area || prevFormData.updated_json.address.address_area || '',
                            address_locality: cmtData.address_locality || prevFormData.updated_json.address.address_locality || '',
                            address_city: cmtData.address_city || prevFormData.updated_json.address.address_city || '',
                            address_landmark: cmtData.address_landmark || prevFormData.updated_json.address.address_landmark || '',
                            address_taluk: cmtData.address_taluk || prevFormData.updated_json.address.address_taluk || '',
                            residence_mobile_number: cmtData.residence_mobile_number || prevFormData.updated_json.address.residence_mobile_number || '',
                            address_state: cmtData.address_state || prevFormData.updated_json.address.address_state || '',
                            address_pin_code: cmtData.address_pin_code || prevFormData.updated_json.address.address_pin_code || '',
                        },
                        permanent_address: {
                            permanent_sender_name: cmtData.permanent_sender_name || prevFormData.updated_json.permanent_address.permanent_sender_name || '',
                            permanent_receiver_name: cmtData.permanent_receiver_name || prevFormData.updated_json.permanent_address.permanent_receiver_name || '',
                            permanent_address: cmtData.permanent_address || prevFormData.updated_json.permanent_address.permanent_address || '',
                            permanent_address_street: cmtData.permanent_address_street || prevFormData.updated_json.permanent_address.permanent_address_street || '',
                            permanent_address_main: cmtData.permanent_address_main || prevFormData.updated_json.permanent_address.permanent_address_main || '',
                            permanent_address_area: cmtData.permanent_address_area || prevFormData.updated_json.permanent_address.permanent_address_area || '',
                            permanent_address_locality: cmtData.permanent_address_locality || prevFormData.updated_json.permanent_address.permanent_address_locality || '',
                            permanent_address_city: cmtData.permanent_address_city || prevFormData.updated_json.permanent_address.permanent_address_city || '',
                            permanent_address_landmark: cmtData.permanent_address_landmark || prevFormData.updated_json.permanent_address.permanent_address_landmark || '',
                            permanent_address_taluk: cmtData.permanent_address_taluk || prevFormData.updated_json.permanent_address.permanent_address_taluk || '',
                            permanent_address_district: cmtData.permanent_address_district || prevFormData.updated_json.permanent_address.permanent_address_district || '',
                            permanent_address_state: cmtData.permanent_address_state || prevFormData.updated_json.permanent_address.permanent_address_state || '',
                            permanent_address_pin_code: cmtData.permanent_address_pin_code || prevFormData.updated_json.permanent_address.permanent_address_pin_code || '',
                        }

                    }
                }));
                setLoading(false);

            })
            .catch((error) => {
                setLoading(false);
                // You might want to add some error handling here, like logging the error.
            });
    }, [applicationId, branchid, setServicesForm, setServicesData, setBranchInfo, setCustomerInfo, setFormData, setLoading]);



    useEffect(() => {
        fetchApplicationData();
    }, [fetchApplicationData]);


    const fetchServicesJson = useCallback(async (servicesList) => {
        setLoading(true);
        setApiLoading(true);
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem("_token");

        // Return an empty array if servicesList is empty or undefined
        if (!servicesList || servicesList.length === 0) {
            setApiLoading(false);
            setLoading(false);
            console.warn("Services list is empty.");
            return [];
        }

        try {
            const requestOptions = {
                method: "GET",
                redirect: "follow",
            };

            // Construct the URL with service IDs
            const url = `https://api.screeningstar.co.in/client-master-tracker/services-annexure-data?service_ids=${servicesList}&application_id=${applicationId}&admin_id=${adminId}&_token=${token}`;

            const response = await fetch(url, requestOptions);

            if (response.ok) {
                setLoading(false);
                setApiLoading(false);

                const result = await response.json();

                // Update the token if a new one is provided
                const newToken = result.token || result._token || localStorage.getItem("_token") || "";
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                // Filter out null or invalid items
                const filteredResults = result.results.filter((item) => item !== null && item.serviceStatus !== false);
                setServicesDataInfo(filteredResults);


                if (result?.results?.length) {
                    const newCheckboxState = {};

                    result.results.forEach((item) => {
                        if (item.annexureData) {
                            Object.keys(item.annexureData).forEach((key) => {
                                if (key.startsWith("checkbox_annexure_")) {
                                    newCheckboxState[key] = item.annexureData[key];
                                }
                            });
                        }
                    });

                    setCheckboxState(newCheckboxState);
                }
                return filteredResults;
            } else {
                setApiLoading(false);

                setLoading(false);
                console.error("Failed to fetch service data:", response.statusText);
                return [];
            }
        } catch (error) {
            setApiLoading(false);

            setLoading(false);
            console.error("Error fetching service data:", error);
            return [];
        }


    },
        []);



    const handleChange = (e) => {
        const { name, value, type } = e.target; // Capture input type

        const formatDate = (dateStr) => {
            // Only process if the input is a date field
            if (type === "date") {
                // Ensure proper date format (YYYY-MM-DD)
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                    return dateStr; // Keep valid date format as is
                }

                // Convert valid date objects to YYYY-MM-DD
                const date = new Date(dateStr);
                return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : "";
            }

            // If it's not a date input, return as is
            return dateStr;
        };
        if (
            name == "client_organization_name" ||
            name == "client_applicant_name" ||
            name == "client_applicant_gender" ||
            name == "client_organization_code"
        ) {
            // ✅ Just update top-level field
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        } else {
            setFormData((prevFormData) => {
                const updatedFormData = { ...prevFormData };

                if (name.startsWith('updated_json.address.')) {
                    const addressField = name.replace('updated_json.address.', '');
                    updatedFormData.updated_json.address[addressField] = formatDate(value);
                } else if (name.startsWith('updated_json.permanent_address.')) {
                    const permanentField = name.replace('updated_json.permanent_address.', '');
                    updatedFormData.updated_json.permanent_address[permanentField] = formatDate(value);
                } else if (name.startsWith('updated_json.insuffDetails.')) {
                    const insuffField = name.replace('updated_json.insuffDetails.', '');
                    updatedFormData.updated_json.insuffDetails[insuffField] = formatDate(value);
                } else {
                    const topLevelField = name.replace('updated_json.', '');
                    updatedFormData.updated_json[topLevelField] = formatDate(value);
                }

                return updatedFormData;
            });
        }
        setErrors((prevErrors) => {
            const { [name]: removedError, ...rest } = prevErrors;
            return rest;
        });
    };



    const uploadCustomerLogo = async (email_status) => {
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");

        if (!admin_id || !storedToken) {
            console.error("Admin ID or token not found in local storage.");
            return;
        }

        const fileEntries = Object.entries(files);
        const fileCount = fileEntries.length;

        for (const [rawKey, value] of fileEntries) {
            const key = rawKey.replace("[]", ""); // Sanitize key
            const customerLogoFormData = new FormData();

            customerLogoFormData.append("admin_id", admin_id);
            customerLogoFormData.append("_token", storedToken);
            customerLogoFormData.append("application_id", applicationId);
            customerLogoFormData.append("email_status", email_status || 0);
            customerLogoFormData.append("branch_id", branchid);
            customerLogoFormData.append("customer_code", customerInfo.client_unique_id);
            customerLogoFormData.append("application_code", applicationId);

            if (value.selectedFiles?.length > 0) {
                for (const file of value.selectedFiles) {
                    if (file instanceof File) {
                        customerLogoFormData.append("images", file);
                    } else {
                        console.warn("Invalid file object skipped:", file);
                    }
                }

                // Append sanitized file name and table
                const sanitizedFileName = value.fileName.replace(/\[\]$/, "");
                customerLogoFormData.append("db_column", sanitizedFileName);
                customerLogoFormData.append("db_table", key);
            }

            // Append 'send_mail' only in the last iteration
            if (fileEntries.indexOf([rawKey, value]) === fileCount - 1) {
                customerLogoFormData.append("send_mail", 1);
            }

            try {
                const response = await axios.post(
                    "https://api.screeningstar.co.in/client-master-tracker/upload",
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );

                const data = response.data; // Axios automatically parses JSON responses
                const newToken = data.token || data._token || storedToken;

                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
            } catch (err) {
                console.error("Error uploading logo:", err.message || err);
            }
        }
    };




    const validateForm = () => {
        const newErrors = {};
        const {
            month_year,
            verification_purpose,
            contact_number,
            contact_number2,
        } = formData.updated_json;

        // Required fields validation
        if (!month_year) newErrors.month_year = "Month-Year is required.";
        if (!verification_purpose) newErrors.verification_purpose = "Verification Purpose is required.";
        console.log(`myData_qc Vlaue - `, myData_qc);
        // Check if 'myData_qc' is empty or falsy (null, undefined, or empty string)
        var myData_qc = document.getElementById("data_qc").value;
        var myBasic_entry = document.getElementById("basic_entry").value;

        // Set errors and return validation status
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (validateForm()) {
            window.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
            setLoading(true);
            try {
                const adminData = JSON.parse(localStorage.getItem("admin"));
                const token = localStorage.getItem("_token");
                // Function to replace empty strings with null
                const replaceEmptyWithNull = (obj) => {
                    for (let key in obj) {
                        if (obj[key] && typeof obj[key] === "object") {
                            replaceEmptyWithNull(obj[key]);
                        } else {
                            if (obj[key] === "") {
                                obj[key] = null;
                            }
                        }
                    }
                    return obj; // Make sure to return the modified object
                };

                const modifiedFormData = replaceEmptyWithNull({ ...formData });
                var myData_qc = document.getElementById("data_qc").value;

                var myBasic_entry = document.getElementById("basic_entry").value;

                const raw = JSON.stringify({
                    admin_id: adminData?.id,
                    _token: token,
                    branch_id: branchid,
                    customer_id: branchInfo.customer_id,
                    application_id: applicationId,
                    data_qc: myData_qc || "0",
                    basic_entry: myBasic_entry || "0",
                    ...modifiedFormData,
                    send_mail: 0,
                });

                console.log("data_qc", myData_qc);
                const requestOptions = {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: raw,
                };

                const response = await fetch(
                    `https://api.screeningstar.co.in/data-management/submit`,
                    requestOptions
                );

                if (!response.ok) {
                    const errorResponse = await response.json();
                    throw new Error(
                        errorResponse.message || `HTTP error! Status: ${response.status}`
                    );
                }

                const result = await response.json();
                const newToken = result._token || result.token || token;
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }

                Swal.fire("Success!", result.message || 'sfsfs', "success");
                const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
                const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');
                uploadCustomerLogo(result.email_status);
                if (fromTat == 1) {
                    navigate("/admin-tat-reminder");
                } else {
                    navigate(`/admin-DataCheckin?clientId=${clientIdFromUrl}&branchId=${branchidFromUrl}`);

                }
            } catch (error) {
                console.error("Error during submission:", error);

                // Determine the type of error and display a dynamic message
                let errorMessage = "An unexpected error occurred. Please try again later.";
                if (error.name === "TypeError") {
                    errorMessage = "Network error: Unable to reach the server. Please check your connection.";
                } else if (error.message) {
                    errorMessage = error.message;
                } else if (error.response?.status === 500) {
                    errorMessage = "Server error: Something went wrong on our end. Please contact support.";
                } else if (error.response?.status === 400) {
                    errorMessage = "Invalid request: Please check the form data and try again.";
                }

                Swal.fire("Error", errorMessage, "error");
            } finally {
                setLoading(false); // Ensure loading is stopped after processing completes
            }
        }
    }, [servicesDataInfo, branchid, branchInfo, applicationId, formData, selectedStatuses, files]);




    const handleInputChange = useCallback((e, index) => {
        const { name, value } = e.target;

        setServicesDataInfo((prev) => {
            const updatedServicesDataInfo = [...prev];

            updatedServicesDataInfo[index] = {
                ...updatedServicesDataInfo[index],
                annexureData: {
                    ...updatedServicesDataInfo[index].annexureData,
                    [name]: value || '',
                },
            };

            return updatedServicesDataInfo;
        });
    }, []);

    const handleGoBack = () => {
        const branchidFromUrl = new URLSearchParams(window.location.search).get('branchid');
        const clientIdFromUrl = new URLSearchParams(window.location.search).get('clientId');

        const branchId = branchidFromUrl;
        const customerId = clientIdFromUrl;

        if (fromTat == 1) {
            navigate("/admin-tat-reminder");
        } else {
            navigate(`/admin-DataCheckin?clientId=${customerId}&branchId=${branchId}`);
        }
    }
    console.log('sih', formData.updated_json.QC_Date);

    return (
        <div className="bg-[#c1dff2] border border-black">
            <h2 className="text-2xl font-bold py-3 text-left text-[#4d606b] px-3 border">DATA GENERATE REPORT</h2>
            <div className="bg-white md:p-4 p-6 w-full border-t border-black mx-auto">
                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 mb-4 md:mb-0 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className=" md:p-12 p-0">
                    {loading ? (
                        <div className="flex w-full justify-center items-center h-20">
                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                        </div>
                    ) : (
                        <form className="space-y-4" autoComplete="off" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="apid" className="block text-gray-700">Reference ID</label>
                                <input
                                    type="text"
                                    name="application_id"
                                    id="apidoo"
                                    value={applicationRefID}
                                    readOnly
                                    className="w-full p-3 mb-4 border border-gray-300 rounded-md"
                                />
                                <input type="hidden" name="apid" id="apid" value={referenceId} />
                            </div>
                            <div className=" form start space-y-2  py-[30px]  bg-white rounded-md" id="client-spoc">
                                <div>
                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="month_year">
                                                Month - Year<span className="text-red-500 text-xl">*</span>
                                            </label>
                                            <input
                                                type="month"
                                                name="month_year"
                                                id="month_year"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.month_year || ''}
                                                onChange={handleChange}
                                            />
                                            {errors.month_year && (
                                                <p className="text-red-500 text-sm">{errors.month_year}</p>
                                            )}
                                        </div>


                                        <div className="mb-4">
                                            <label htmlFor="initiation_date">Initiation Date</label>
                                            <DatePicker
                                                id="initiation_date"
                                                selected={parseDate(formData.updated_json.initiation_date)}
                                                onChange={(date) => {
                                                    const formattedDate = date ? format(date, "yyyy-MM-dd") : ""; // ✅ prevents crash
                                                    handleChange({
                                                        target: {
                                                            name: "updated_json.initiation_date",
                                                            value: formattedDate,
                                                            type: "date"
                                                        }
                                                    });
                                                }}

                                                dateFormat="dd-MM-yyyy"
                                                className="w-full border p-2 outline-none uppercase rounded-md mt-2"
                                            />

                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="client_organization_name">Name of the Client Organization</label>
                                            <input
                                                type="text"
                                                name="client_organization_name"
                                                id="client_organization_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.client_organization_name}
                                                onChange={handleChange}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="verification_purpose">
                                                Verification Purpose <span className="text-red-500 text-xl">*</span>
                                            </label>
                                            <select
                                                name="verification_purpose"
                                                id="verification_purpose"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.verification_purpose}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Verification Purpose</option>
                                                <option value="Employment">Employment</option>
                                                <option value="Discreet">Discreet</option>
                                                <option value="Vendor/Company Screening">Vendor/Company Screening</option>
                                                <option value="Personal">Personal</option>
                                                <option value="Official">Official</option>
                                            </select>
                                            {errors.verification_purpose && (
                                                <p className="text-red-500 text-sm">{errors.verification_purpose}</p>
                                            )}
                                        </div>

                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="employee_id">Applicant Employee ID</label>
                                            <input
                                                type="text"
                                                name="employee_id"
                                                id="employee_id"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.employee_id}
                                                onChange={handleChange}

                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="client_organization_code">Client Code</label>
                                            <input
                                                type="text"
                                                name="client_organization_code"
                                                id="client_organization_code"

                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.client_organization_code}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="client_applicant_name">Name of the Applicant<span className="text-red-500 text-xl" >*</span></label>
                                            <input
                                                ref={(el) => (inputRefs.current['client_applicant_name'] = el)} // Add ref
                                                type="text"
                                                name="client_applicant_name"
                                                id="client_applicant_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.client_applicant_name}
                                                onChange={handleChange}
                                            />
                                            {errors.client_applicant_name && (
                                                <p className="text-red-500 text-sm">{errors.client_applicant_name}</p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="contact_number">Contact Number</label>
                                            <input
                                                type="tel"
                                                name="contact_number"
                                                id="contact_number"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.contact_number}

                                                onChange={handleChange}
                                            />
                                            {errors.contact_number && (
                                                <p className="text-red-500 text-sm">{errors.contact_number}</p>
                                            )}

                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="contact_number2">Contact Number 2:</label>
                                            <input
                                                type="tel"
                                                name="contact_number2"
                                                id="contact_number2"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.contact_number2}

                                                onChange={handleChange}
                                            />
                                            {errors.contact_number2 && (
                                                <p className="text-red-500 text-sm">{errors.contact_number2}</p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="father_name">Father's Name:</label>
                                            <input
                                                type="text"
                                                name="father_name"
                                                id="father_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.father_name}

                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="contact_number2">Spouse Name</label>
                                            <input
                                                type="test"
                                                name="spouse_name"
                                                id="spouse_name"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.spouse_name}

                                                onChange={handleChange}
                                            />
                                            {errors.spouse_name && (
                                                <p className="text-red-500 text-sm">{errors.spouse_name}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="client_applicant_gender">Gender</label>
                                            <select
                                                name="client_applicant_gender"
                                                id="client_applicant_gender"
                                                className="border w-full rounded-md p-2 mt-2"
                                                value={formData.client_applicant_gender}

                                                onChange={handleChange}
                                            >
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Transgender">Transgender</option>

                                            </select>

                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="dob">Date Of Birth</label>
                                            <DatePicker
                                                id="dob"
                                                selected={parseDate(formData.updated_json.dob)}
                                                onChange={(date) => {
                                                    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                                    handleChange({
                                                        target: {
                                                            name: "updated_json.dob",
                                                            value: formattedDate,
                                                            type: "date"
                                                        }
                                                    });
                                                }}
                                                dateFormat="dd-MM-yyyy"
                                                className="w-full border uppercase p-2 outline-none rounded-md mt-2"
                                            />

                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="marital_status">Marital Status</label>
                                            <select
                                                name="marital_status"
                                                id="marital_status"
                                                className="border w-full rounded-md p-2 mt-2"
                                                value={formData.updated_json.marital_status}

                                                onChange={handleChange}
                                            >
                                                <option value="">Select Marital Status</option>
                                                <option value="Single">Single</option>
                                                <option value="Married">Married</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-3">
                                        <div className="mb-4">
                                            <label htmlFor="Nationality">Nationality</label>
                                            <input
                                                type="text"
                                                name="Nationality"
                                                id="Nationality"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.Nationality}

                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="Date_of_Data ">Date of Data Entry </label>
                                            <DatePicker
                                                id="Date_of_Data"
                                                selected={parseDate(formData.updated_json.Date_of_Data)}
                                                onChange={(date) => {
                                                    const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                                    handleChange({
                                                        target: {
                                                            name: "updated_json.Date_of_Data",
                                                            value: formattedDate,
                                                            type: "date"
                                                        }
                                                    });
                                                }}
                                                dateFormat="dd-MM-yyyy"
                                                className="border w-full rounded-md p-2 mt-2 uppercase"
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="Data_Entry_Analyst_Name">Data Entry Analyst Name</label>

                                            <select name="Data_Entry_Analyst_Name"
                                                value={formData.updated_json.Data_Entry_Analyst_Name}
                                                onChange={handleChange}
                                                id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                                <option value="">Select NAME </option>
                                                {adminNames.map((spoc) => (
                                                    <option value={spoc}>{spoc}</option>
                                                ))}

                                            </select>
                                        </div>
                                    </div>

                                </div>

                                <div className='permanentaddress '>
                                    <div className='my-4 font-semibold text-xl '>Permanent Address</div>
                                    <div className="form-group border border-black p-3 rounded-md">
                                        <div className="mb-4">
                                            <label htmlFor="permanent_address">Full Address:</label>
                                            <input
                                                type="text"
                                                name="updated_json.permanent_address.permanent_address"
                                                id="permanent_address"
                                                className="border w-full rounded-md p-2 mt-2 capitalize overflow-x-auto whitespace-nowrap"
                                                value={formData.updated_json.permanent_address.permanent_address || ''}
                                                onChange={handleChange}
                                            />


                                        </div>

                                        <div className="form-group">
                                            <h3 className="font-medium text-lg mb-3">Period of Stay</h3>
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <div className="mb-4">
                                                    <label htmlFor="permanent_sender_name">From:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_sender_name"
                                                        id="permanent_sender_name"
                                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_sender_name}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor="permanent_receiver_name">To:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_receiver_name"
                                                        id="permanent_receiver_name"
                                                        className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_receiver_name}
                                                        onChange={handleChange}
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-3">
                                                <div className="mb-4">
                                                    <label htmlFor="permanent_address_landmark">Landmark:</label>
                                                    <input
                                                        type="text"
                                                        name="updated_json.permanent_address.permanent_address_landmark"
                                                        id="permanent_address_landmark"
                                                        className="border w-full rounded-md p-2 mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_address_landmark}
                                                        onChange={handleChange}
                                                    />
                                                </div>

                                                <div className="mb-4">
                                                    <label htmlFor="permanent_address_pin_code">Pin Code:</label>
                                                    <input
                                                        type="text" // Keep as text to handle leading zeros
                                                        name="updated_json.permanent_address.permanent_address_pin_code"
                                                        id="permanent_address_pin_code"
                                                        className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                        value={formData.updated_json.permanent_address.permanent_address_pin_code}
                                                        onChange={handleChange}

                                                    />
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <label htmlFor="permanent_address_state">State:</label>
                                                <input
                                                    type="text"
                                                    name="updated_json.permanent_address.permanent_address_state"
                                                    id="permanent_address_state"
                                                    className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                    value={formData.updated_json.permanent_address.permanent_address_state}
                                                    onChange={handleChange}

                                                />
                                            </div>
                                        </div>
                                    </div>


                                </div>
                                <div className='currentaddress'>
                                    <div className='mt-6 font-semibold text-xl'>Current Address </div>
                                    <label className="flex items-center space-x-2 mb-2">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        updated_json: {
                                                            ...prev.updated_json,
                                                            address: {
                                                                address: prev.updated_json.permanent_address.permanent_address || '',
                                                                address_landmark: prev.updated_json.permanent_address.permanent_address_landmark || '',
                                                                residence_mobile_number: prev.updated_json.permanent_address.permanent_address_cross || '',
                                                                address_state: prev.updated_json.permanent_address.permanent_address_state || '',
                                                                address_main: prev.updated_json.permanent_address.permanent_address_main || '',
                                                                address_area: prev.updated_json.permanent_address.permanent_address_area || '',
                                                                address_locality: prev.updated_json.permanent_address.permanent_address_locality || '',
                                                                address_city: prev.updated_json.permanent_address.permanent_address_city || '',
                                                                address_taluk: prev.updated_json.permanent_address.permanent_address_taluk || '',
                                                                address_district: prev.updated_json.permanent_address.permanent_address_district || '',
                                                                address_state: prev.updated_json.permanent_address.permanent_address_state || '',
                                                                address_pin_code: prev.updated_json.permanent_address.permanent_address_pin_code || '',
                                                            },
                                                        },
                                                    }));
                                                }
                                            }}
                                            className="form-checkbox h-4 w-4 text-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Same as Permanent Address</span>
                                    </label>
                                    <div className="form-group border border-black rounded-md p-3">
                                        <div className="mb-4">
                                            <label htmlFor="address">Full Address:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.address"
                                                id="address"
                                                className="border w-full rounded-md p-2 mt-2 capitalize overflow-x-auto whitespace-nowrap"
                                                value={formData.updated_json.address.address || ''}
                                                onChange={handleChange}
                                            />

                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="address_landmark">Landmark:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.address_landmark"
                                                id="address_landmark"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.address.address_landmark}
                                                onChange={handleChange}

                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="residence_mobile_number">Residence Mobile No:</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.residence_mobile_number"
                                                id="residence_mobile_number"
                                                className="border w-full rounded-md p-2 mt-2 capitalize"
                                                value={formData.updated_json.address.residence_mobile_number}
                                                onChange={handleChange}

                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="address_state">State</label>
                                            <input
                                                type="text"
                                                name="updated_json.address.address_state"
                                                id="address_state"
                                                className="w-full border p-2 outline-none rounded-md mt-2 capitalize"
                                                value={formData.updated_json.address.address_state}
                                                onChange={handleChange}

                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className=" grid md:grid-cols-3 gap-3">
                                    <div className="mb-4">
                                        <label htmlFor="data_qc">Data QC</label>
                                        <select
                                            name="data_qc"
                                            id="data_qc"
                                            className="border w-full rounded-md p-2 mt-2"
                                            onChange={(e) => {
                                                setMyData_qc(e.target.value);
                                                // Clear the error when a valid value is selected
                                                if (e.target.value) {
                                                    setErrors((prevErrors) => {
                                                        const updatedErrors = { ...prevErrors };
                                                        delete updatedErrors.myData_qc;
                                                        return updatedErrors;
                                                    });
                                                }
                                            }}
                                            value={myData_qc} // Bind the state to the dropdown
                                            aria-label="Select QC Status" // Add accessibility for better UX
                                        >
                                            <option value="1">YES</option>
                                            <option value="0">NO</option>
                                        </select>
                                        {errors.myData_qc && (
                                            <p className="text-red-500 text-sm">{errors.myData_qc}</p>
                                        )}
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="QC Date">QC Analyst Name</label>

                                        <select name="QC_Analyst_Name"
                                            value={formData.updated_json.QC_Analyst_Name}
                                            onChange={handleChange}
                                            id="" className="border w-full rounded-md p-2 mt-2 uppercase">
                                            <option value="">Select NAME </option>
                                            {adminNames.map((spoc) => (
                                                <option value={spoc}>{spoc}</option>
                                            ))}

                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label htmlFor="QC_Date">QC Date</label>

                                        <DatePicker
                                            id="QC_Date"
                                            selected={parseDate(formData.updated_json.QC_Date)}
                                            onChange={(date) => {
                                                const formattedDate = date ? format(date, "yyyy-MM-dd") : ""; // ✅ prevents crash
                                                handleChange({
                                                    target: {
                                                        name: "updated_json.QC_Date",
                                                        value: formattedDate,
                                                        type: "date"
                                                    }
                                                });
                                            }}
                                            dateFormat="dd-MM-yyyy"
                                            className="w-full border p-2 outline-none uppercase rounded-md mt-2"
                                        />
                                    </div>
                                </div>
                                <div className="mb-4 pt-0 mt-[-10px]">
                                    <label htmlFor="basic_entry">BASIC ENTRY</label>
                                    <select
                                        name="basic_entry"
                                        id="basic_entry"
                                        className="border w-full rounded-md p-2 mt-2"
                                        onChange={(e) => {
                                            setMyBasic_entry(e.target.value);
                                            // Clear the error when a valid value is selected
                                            if (e.target.value) {
                                                setErrors((prevErrors) => {
                                                    const updatedErrors = { ...prevErrors };
                                                    delete updatedErrors.myBasic_entry;
                                                    return updatedErrors;
                                                });
                                            }
                                        }}
                                        value={myBasic_entry} // Bind the state to the dropdown
                                        aria-label="Select QC Status" // Add accessibility for better UX
                                    >
                                        <option value="1">YES</option>
                                        <option value="0">NO</option>
                                    </select>
                                    {errors.myBasic_entry && (
                                        <p className="text-red-500 text-sm">{errors.myBasic_entry}</p>
                                    )}
                                </div>
                            </div>
                       <div className="SelectedServices border border-black rounded-md">
  <div className="bg-[#c1dff2] border-b border-black rounded-t-md p-4">
    <h1 className="text-center text-2xl">
      SELECTED SERVICES<span className="text-red-500 text-xl">*</span>
    </h1>
  </div>
  <div className="p-5 border">
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {servicesDataInfo &&
        servicesDataInfo.map((serviceData, index) => {
          if (serviceData.serviceStatus) {
            if (
              !serviceData?.serviceStatus ||
              !serviceData?.reportFormJson ||
              !serviceData?.reportFormJson?.json
            ) {
              return null; // Skip this entry
            }

            let formJson;
            try {
              formJson = JSON.parse(serviceData.reportFormJson.json);
            } catch (e) {
              console.error(
                `Error parsing reportFormJson.json for service ID ${serviceData?.service_id}:`,
                e
              );
              return null; // Skip this entry if JSON is invalid
            }

            return (
              <div
                key={index}
                className="bg-[#f4f4f4] border border-gray-300 p-4 rounded-md shadow-sm"
              >
                {formJson.heading && <span className="font-semibold">{formJson.heading}</span>}
              </div>
            );
          }
          return null;
        })}
    </div>
  </div>
</div>

                            <div className="text-left mt-4">
                                <button
                                    type="submit"
                                    className="p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381] transition duration-200 "
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div >
    );
};

export default DataGenerateReport;
