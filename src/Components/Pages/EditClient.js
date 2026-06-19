import { React, useState, useEffect, useCallback, useRef } from 'react'
import "react-datepicker/dist/react-datepicker.css";
import { MultiSelect } from "react-multi-select-component";
import { State } from "country-state-city";
import SelectSearch from "react-select-search";
import 'react-select-search/style.css'
import Swal from 'sweetalert2'
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import { useClientContext } from "./ClientContext";
import { FaChevronLeft } from 'react-icons/fa';
import { useApiLoading } from '../ApiLoadingContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";
const states = State.getStatesOfCountry("IN");
const option = states.map((state) => ({ value: state.isoCode, label: state.name }));
const EditClient = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [customTemplate, setCustomTemplate] = useState(null);
    const [emailsInput, setEmailsInput] = useState("");
    const [emailError, setEmailError] = useState("");
    const navigate = useNavigate();
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
    const [priceData, setPriceData] = useState({});
    const [files, setFiles] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [errors, setErrors] = useState({});
    const [emails, setEmails] = useState([""]);
    const [mobile, setMobile] = useState("");
    const { services, client_spoc_id, AllSpocs, escalation_manager_id, packageList, billing_spoc_id, billing_escalation_id, authorized_detail_id, visible_fields, dedicated_point_of_contact,
        first_level_matrix_name,
        first_level_matrix_designation,
        first_level_matrix_mobile,
        first_level_matrix_email, selectedClient, role, setSelectedClient } = useClientContext();

    if (selectedClient && Object.keys(selectedClient).length === 0) {
        navigate('/admin-active-account');
    }

    if (typeof selectedClient.visible_fields === 'string') {
        // Parse and replace with old one
        selectedClient.visible_fields = JSON.parse(selectedClient.visible_fields);
        // console.log('Updated visible_fields', selectedClient.visible_fields);
    }

    if (typeof selectedClient.client_spoc_email === 'string') {
        try {
            // Parse the JSON string
            const parsedEmail = JSON.parse(selectedClient?.client_spoc_email);

            // Check if it's an array, then join by comma
            if (Array.isArray(parsedEmail)) {
                selectedClient.client_spoc_email = parsedEmail.join(', ');
            }
        } catch (e) {
            console.error('Invalid JSON in client_spoc_email:', e);
        }
    }

    const memoizedAllSpocs = useCallback(() => {
        AllSpocs(); // Call the original AllSpocs function
    }, [AllSpocs]); // Only recreate this function if AllSpocs changes

    useEffect(() => {
        memoizedAllSpocs(); // This will now run only once unless AllSpocs itself changes
    }, [memoizedAllSpocs]);

    useEffect(() => {
        // Check if selectedClient.emails is defined and not null
        if (selectedClient?.emails) {
            // Parse and set emails array from selectedClient
            setEmailsInput(JSON.parse(selectedClient.emails));
            setEmails(JSON.parse(selectedClient.emails));
        }
    }, [selectedClient?.emails]);

    const checkServiceById = useCallback((selectedClientForFunction, serviceId, groupId) => {

        const clientPreSelectedServicesRaw = selectedClientForFunction?.services
            ? typeof selectedClientForFunction.services === 'string'
                ? JSON.parse(selectedClientForFunction.services)
                : selectedClientForFunction.services
            : null;

        // Find the specified group by `groupId`
        const groupWithService = clientPreSelectedServicesRaw?.find(group =>
            group.group_id === groupId && group.services?.some(service => service.serviceId === serviceId)
        );


        if (groupWithService) {
            const service = groupWithService.services.find(s => s.serviceId === serviceId);
            return {
                status: true,
                price: service.price,
                packages: service.packages
            };
        }

        return { status: false };
    }, []);

    const deleteService = (selectedClientForFunction, group_id, serviceId) => {
        // console.log("Input Parameters:", { selectedClientForFunction, group_id, serviceId });

        const clientPreSelectedServicesRaw = selectedClientForFunction?.services
            ? typeof selectedClientForFunction.services === 'string'
                ? JSON.parse(selectedClientForFunction.services)
                : selectedClientForFunction.services
            : null;

        // console.log("Parsed clientPreSelectedServicesRaw:", clientPreSelectedServicesRaw);

        if (!Array.isArray(clientPreSelectedServicesRaw)) {
            console.warn("Invalid services data, exiting function.");
            return; // Early return or handle the error as needed
        }

        // Create a new array with the service deleted
        const updatedClientData = clientPreSelectedServicesRaw.map(group => {
            // console.log("Processing group:", group);

            // Check if the group_id matches
            if (group.group_id === group_id) {
                // console.log("Match found for group_id:", group_id);

                // Filter out the service by serviceId
                const updatedServices = group.services.filter(service => service.serviceId !== serviceId);
                // console.log("Updated services for group:", updatedServices);

                // Return the updated group with the filtered services
                return { ...group, services: updatedServices };
            }

            // console.log("Group does not match group_id, returning as is:", group);
            return group; // Return the group as is if it doesn't match the group_id
        });

        // console.log("Updated client data after processing groups:", updatedClientData);

        // After updating, set the new state
        setSelectedClient((prev) => {
            const newState = {
                ...prev,
                services: JSON.stringify(updatedClientData),
            };
            // console.log("updatedClientData", updatedClientData);
            return newState;
        });
    };





    // console.log(selectedClient.visible_fields);
    const handleChange = (e, selectedOptions = null) => {
        if (selectedOptions) {
            // If selectedOptions is provided (i.e., for MultiSelect change), update visible_fields
            setSelectedClient((prevData) => ({
                ...prevData,
                visible_fields: selectedOptions.map(opt => opt.value), // Store only values from MultiSelect
            }));
        } else {
            // For regular input fields, ensure e is not null
            const { name, value, type, files } = e ? e.target : {}; // Safely destructure e.target if e is not null

            // Handle date input to remove time part
            let finalValue = type === 'date' ? value : (type === "file" ? files[0] : value);

            // If the value is a date input, remove the time part
            if (type === 'date' && finalValue) {
                finalValue = new Date(finalValue).toISOString().split('T')[0]; // Extract just the date (YYYY-MM-DD)
            }

            setSelectedClient((prevData) => ({
                ...prevData,
                [name]: finalValue, // Store the formatted date
            }));
        }
    };


    // console.log('myselected client', selectedClient);
    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to an array

        setFiles((prevFiles) => {
            return {
                ...prevFiles,
                [fileName]: selectedFiles,
            };
        });
    };

    const uploadCustomerLogo = async (adminId, token) => {
        // If token is not provided, check if it exists in localStorage
        const newToken = token || localStorage.getItem('_token');

        // If a new token is found in the response, store it in localStorage
        if (newToken) {
            localStorage.setItem('_token', newToken);
        }

        const fileCount = Object.keys(files).length;
        for (const [index, [key, value]] of Object.entries(files).entries()) {
            const customerLogoselectedClient = new FormData();
            customerLogoselectedClient.append('admin_id', adminId);
            customerLogoselectedClient.append('_token', newToken); // Use the token from localStorage
            customerLogoselectedClient.append('customer_code', selectedClient.client_unique_id);
            customerLogoselectedClient.append('customer_id', selectedClient.main_id);

            for (const file of value) {
                customerLogoselectedClient.append('images', file);
                customerLogoselectedClient.append('upload_category', key);
            }

            if (fileCount === (index + 1)) {
                customerLogoselectedClient.append('company_name', selectedClient.name);
            }

            try {
                await axios.post(
                    `https://api.screeningstar.co.in/customer/upload`,
                    customerLogoselectedClient,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
            } catch (err) {
                Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
            }
        }
    };

    const handleCheckboxChange = (selectedClientForFunction, { group_id, group_symbol, service_code, group_name, service_id, service_name, price, selected_packages }) => {
        // console.log("Checkbox change triggered");
        // console.log("Received parameters:", { group_id, group_symbol, service_code, group_name, service_id, service_name, price, selected_packages });

        // Check service by ID
        const { status, priceOld, packages } = checkServiceById(selectedClientForFunction, service_id, group_id);
        // console.log("Service check result:", { status, priceOld, packages });

        if (status) {
            // console.log(`Service with ID ${service_id} exists. Deleting service...`);
            deleteService(selectedClientForFunction, group_id, service_id);
        }

        const dataToSend = {
            group_id,
            group_symbol,
            service_code,
            group_name,
            service_id,
            service_name,
            price: status ? price : "", // Send empty if deselected
            selected_packages: status ? selected_packages : [], // Send empty if deselected
            action: "checkbox_change"
        };

        // console.log("Data to send to server:", dataToSend);
        sendDataToServer(dataToSend);
    };
    const handleEmailChange = (index, value) => {
        const updatedEmails = [...emails];
        updatedEmails[index] = value;
        setEmails(updatedEmails);
    };
    const handleEmailInputChange = (value) => {
        setEmailsInput(value);
        console.log('value---', value);

        // Split input by commas, trim spaces, and filter out empty strings
        const emailArray = value
            .split(',')
            .map(email => email.trim())
            .filter(email => email !== "");

        // Basic email validation regex
        const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;

        // Find invalid emails
        const invalidEmails = emailArray.filter(email => !emailRegex.test(email));

        if (invalidEmails.length > 0) {
            setEmailError(`Invalid email(s): ${invalidEmails.join(", ")}`);
        } else {
            setEmailError("");
        }

        // Update state with valid emails
        setEmails(emailArray);
    };

    const addEmailField = () => {
        setEmails([...emails, ""]);
    };

    const handlePriceChange = (e, service_id) => {
        const newPrice = e.target.value;

        setPriceData(prevPriceData => ({
            ...prevPriceData,
            [service_id]: {
                ...prevPriceData[service_id],
                pricingPackages: newPrice
            }
        }));

        // Send the updated price when user types or focuses out
        sendDataToServer({
            service_id,
            price: newPrice,
            action: "price_change",
        });
    };

    // 3. Handle package selection change (when packages are selected or changed)
    const handlePackageChange = (selectedList, serviceId) => {

        // Create an array of selected packages in the desired format
        const selectedPackagesData = selectedList.map(pkg => ({
            id: pkg.value,
            name: pkg.label
        }));

        setSelectedPackages(prevSelected => ({
            ...prevSelected,
            [serviceId]: selectedList.map(pkg => pkg.value) // Store only the selected package IDs
        }));
        // Now, send the selected packages data
        const dataToSend = {
            action: 'package_change',
            service_id: serviceId,
            selected_packages: selectedPackagesData
        };

        // Call sendDataToServer to handle the update
        sendDataToServer(dataToSend);
    };


    function updateServiceById(serviceId, updatedInfo, action) {
        // console.log("updateServiceById triggered");
        // console.log("Service ID to update:", serviceId);
        // console.log("Updated information:", updatedInfo);
        // console.log("selectedClient:", selectedClient);

        // Parse selectedClient's services only if it's valid (non-null, non-undefined)
        const clientPreSelectedServicesRaw = selectedClient?.services ? JSON.parse(selectedClient.services) : null;
        // console.log("Parsed client services:", clientPreSelectedServicesRaw);

        if (!clientPreSelectedServicesRaw) {
            // console.log("No existing services found.");
            return false;
        }

        // Check if serviceId exists
        const serviceExists = clientPreSelectedServicesRaw.some((group) =>
            group.services.some((service) => service.serviceId === serviceId)
        );

        if (serviceExists) {
            if (action == 'checkbox_change') {
                // Remove serviceId if it exists
                const updatedData = clientPreSelectedServicesRaw.map((group) => ({
                    ...group,
                    services: group.services.filter((service) => service.serviceId !== serviceId),
                }));

                // console.log("UPDATED DATA:", updatedData);
                setSelectedClient((prev) => ({
                    ...prev,
                    services: JSON.stringify(updatedData),
                }));
                // console.log("Service successfully updated.");
                return true;  // Return true if update was successful
            }
        }
        for (let group of clientPreSelectedServicesRaw) {
            if (group.services) {
                const service = group.services.find(service => service.serviceId === serviceId);

                if (service) {
                    // console.log(`Service found in group ${group.group_id}, updating service...`);
                    // Update the fields in the service object with the values in updatedInfo
                    Object.assign(service, updatedInfo);
                    setSelectedClient((prev) => ({
                        ...prev,
                        services: JSON.stringify(clientPreSelectedServicesRaw),
                    }));
                    // console.log("Service successfully updated.");
                    return true;  // Return true if update was successful
                }
            }
        }

        // console.log("Service not found, creating a new service entry...");

        // If service is not found, create a new service and add it to the appropriate group
        const newService = {
            serviceId,
            serviceTitle: updatedInfo.serviceTitle || '',
            serviceCode: updatedInfo.service_code || "",
            price: updatedInfo.price || '',
            packages: updatedInfo.packages || []  // Assuming updatedInfo includes packages
        };

        // Add the new service to the correct group
        const groupIndex = clientPreSelectedServicesRaw.findIndex(group => group.group_id === updatedInfo.group_id);
        if (groupIndex !== -1) {
            // console.log(`Group ${updatedInfo.group_id} found, adding new service...`);
            clientPreSelectedServicesRaw[groupIndex].services.push(newService);  // Add the new service to the found group
        } else {
            // console.log(`Group ${updatedInfo.group_id} not found, creating a new group...`);
            clientPreSelectedServicesRaw.push({
                group_id: updatedInfo.group_id,
                group_title: updatedInfo.group_name,
                group_symbol: updatedInfo.group_symbol,
                services: [newService]
            });
        }

        // Update the clientData.scopeOfServices directly
        setSelectedClient((prev) => ({
            ...prev,
            services: JSON.stringify(clientPreSelectedServicesRaw),
        }));

        // console.log("New service added successfully.");
        return true;
    }


    // Function to send data to the server (or perform any other action you need)
    const sendDataToServer = (data) => {
        // console.log("sendDataToServer triggered");
        // console.log("Received data:", data);

        let sendDataRunning = false;
        let updatedData = {};

        // Handle the different actions
        switch (data.action) {
            case 'package_change':
                // console.log("Action: package_change");
                updatedData = { packages: data.selected_packages };  // Assuming you want to update packages
                sendDataRunning = true;
                break;
            case 'checkbox_change':
                // console.log("Action: checkbox_change");
                const { selected_packages, group_id, group_name, group_symbol, service_code, price, service_name, action } = data;
                updatedData = { selected_packages, group_id, group_name, group_symbol, service_code, price, serviceTitle: service_name };
                sendDataRunning = true;
                break;
            case 'price_change':
                // console.log("Action: price_change");
                updatedData = { price: data.price };  // Only updating price
                sendDataRunning = true;
                break;
            default:
                // console.log("Unknown action, no update performed.");
                break;
        }

        if (sendDataRunning) {
            // console.log("Updating service with data:", updatedData);
            const serviceId = data.service_id;
            const isUpdated = updateServiceById(serviceId, updatedData, data.action);  // Update service with serviceId
            // console.log(`Service update status for ID ${serviceId}:`, isUpdated);
        } else {
            // console.log("sendDataRunning is false, no update performed.");
        }
    };
    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [services, loading]);

    const validateRequiredFields = () => {
        const requiredFields = [
            "name", "client_unique_id", "address", "state", "state_code", "gst_number",
            "tat_days", "agreement_duration", "client_standard", "agreement_date",
            "mobile",
        ];

        const newErrors = {};
        // console.log("Validating fields for selectedClient:", selectedClient);

        // Validate clientData fields
        requiredFields.forEach(field => {
            const fieldValue = selectedClient[field];
            if (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0)) {
                // console.log(`Validation error for field: ${field}`);
                newErrors[field] = "This field is required";
            }
        });

        // Conditionally validate username based on additional_login
        if (selectedClient?.additional_login === '1') {
            const username = selectedClient.username;
            if (!username) {
                // console.log("Validation error for username: This field is required");
                newErrors.username = "This field is required";
            }
        }

        // Validate emails
        if (!emails || emails.length === 0) {
            // console.log("Validation error: emails array is empty or undefined");
            newErrors.emails = "At least one email is required";
        } else {
            emails.forEach((email, index) => {
                // console.log(`Validating email[${index}]: ${email}`);
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    // console.log(`Validation error for email[${index}]: Invalid email format`);
                    newErrors[`email_${index}`] = "Invalid email format";
                }
            });
        }

        setErrors(newErrors);
        // console.log("Validation errors:", newErrors);
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fileCount = Object.keys(files).length;
        let validationErrors = validateRequiredFields();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            Swal.fire("Error", "Please fill all required fields! ", "error");
            console.log('validationErrors', validationErrors)
            return; // Stop submission if there are validation errors
        }

        setLoading(true);
        setApiLoading(true);

        try {
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
            const storedToken = localStorage.getItem("_token");
            const additionalLoginValue = selectedClient?.additional_login === 1 ? "yes" : "no";

            const formattedAgreementDate = new Date(selectedClient.agreement_date).toISOString().split('T')[0];
            const formattedCreatedAt = new Date(selectedClient.created_at).toISOString().split('T')[0];
            const formattedUpdatedAt = new Date(selectedClient.updated_at).toISOString().split('T')[0];

            const emailArray = selectedClient.client_spoc_email
                .split(',')
                .map(email => email.trim())  // remove whitespace
                .filter(email => email !== ""); // remove empty strings

            const payload2 = JSON.stringify({
                _token: storedToken,
                ...selectedClient,
                client_spoc_email: emailArray,
                visible_fields: selectedClient.visible_fields,
                customer_id: selectedClient.main_id,
                emails,
                additional_login: additionalLoginValue,
                agreement_date: formattedAgreementDate,
                created_at: formattedCreatedAt,
                updated_at: formattedUpdatedAt,
                admin_id: admin_id,
            });

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const requestOptions = {
                method: "PUT",
                headers: myHeaders,
                body: payload2,
                redirect: "follow",
            };

            const response = await fetch("https://api.screeningstar.co.in/customer/update", requestOptions);
            const result = await response.json();

            // Store new token if available
            const newToken = result.token || result._token || storedToken || '';
            if (newToken) {
                localStorage.setItem("_token", newToken);
            }

            if (!response.ok) {
                throw new Error(result.message || "Failed to submit the form");
            }

            // Success message
            if (fileCount == 0) {
                setSelectedOption(null);
                setLoading(false);
                Swal.fire("Success", result.message || "Form submitted successfully!", "success");

            }
            if (fileCount > 0) {
                await uploadCustomerLogo(admin_id, storedToken);
                setLoading(false);
                setApiLoading(false);
                setSelectedOption(null);
                Swal.fire("Success", result.message || "Form submitted successfully!", "success");
            } navigate('/admin-active-account');

            // Upload logo


        } catch (error) {
            console.error("Submission error:", error);

            Swal.fire("Error", error.message || "Something went wrong. Please try again!", "error");

        } finally {
            setLoading(false);
            setApiLoading(false);
        }
    };
    const removeEmailField = (index) => {
        const updatedEmails = emails.filter((_, i) => i !== index);
        setEmails(updatedEmails);
    };

    const handleGoBack = () => {
        navigate('/admin-active-account');
    };

    const fetchImageToBaseNew = async (urls) => {
        const results = await Promise.all(
            urls.map(async (url) => {
                const res = await fetch(url);
                const blob = await res.blob();

                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        resolve({ base64: reader.result });
                    };
                    reader.readAsDataURL(blob); // <-- THIS is the key
                });
            })
        );
        return results;
    };
    const base64ToBlobNew = (base64, mimeType) => {
        const byteCharacters = atob(base64);
        const byteArrays = [];

        for (let i = 0; i < byteCharacters.length; i += 512) {
            const slice = byteCharacters.slice(i, i + 512);
            const byteNumbers = new Array(slice.length);
            for (let j = 0; j < slice.length; j++) {
                byteNumbers[j] = slice.charCodeAt(j);
            }
            byteArrays.push(new Uint8Array(byteNumbers));
        }

        return new Blob(byteArrays, { type: mimeType });
    };
    const FileViewer = ({ fileUrl }) => {
        if (!fileUrl) return <p>No file provided</p>;

        const getFileExtension = (url) => url.split('.').pop().toLowerCase();
        const fileExtension = getFileExtension(fileUrl);

        const handleDownloadFile = async (url, e) => {
            e.preventDefault();

            try {
                const response = await fetchImageToBaseNew([url]);
                const fileData = response?.[0];

                if (!fileData?.base64) {
                    console.error("No base64 data found.");
                    return;
                }

                let base64Content = fileData.base64;
                let mimeType = "application/octet-stream"; // Default for unknown files

                // Check if it includes the data URI prefix
                if (base64Content.startsWith("data:")) {
                    const parts = base64Content.split(",");
                    mimeType = parts[0].match(/data:(.*);base64/)[1];
                    base64Content = parts[1];
                }

                const extensionMap = {
                    "application/pdf": "pdf",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
                    "application/vnd.ms-excel": "xls",
                    "application/zip": "zip",
                    "application/msword": "doc",
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
                    "image/png": "png",
                    "image/jpeg": "jpg",
                    "text/plain": "txt"
                };

                const extension = extensionMap[mimeType] || "";

                const blob = base64ToBlobNew(base64Content, mimeType);
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;

                const nameFromUrl = url.split("/").pop().split("?")[0];
                const defaultName = nameFromUrl.includes(".")
                    ? nameFromUrl
                    : `${nameFromUrl || "downloaded-file"}.${extension}`;

                link.download = defaultName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error("Error downloading file:", error);
            }
        };


        const handleDownloadViaProxy = async (originalUrl, e) => {
            e.preventDefault();

            try {
                const proxyUrl = `/proxy-download?url=${encodeURIComponent(originalUrl)}`;
                const res = await fetch(proxyUrl);

                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = originalUrl.split("/").pop() || "file";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error("Proxy download failed:", error);
            }
        };



        return (<>
            {['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'svg', 'heif', 'heic', 'avif', 'ico', 'jfif', 'raw', 'psd', 'ai', 'eps'].includes(fileExtension) ? (
                <img src={fileUrl} alt="Image File" className="w-20 h-20 object-cover rounded-md mx-auto" />
            ) : fileExtension === 'pdf' ? (
                <iframe src={fileUrl} title="PDF Viewer" className="w-40 h-20"></iframe>
            ) : fileExtension === 'zip' ? (
                <span>📦</span>
            ) : (
                <span>📄</span>
            )}
        </>
        );
    };
    return (
        <div className="bg-[#c1dff2] ">
            <div className="bg-white md:p-10  border w-full mx-auto">

                <div
                    onClick={handleGoBack}
                    className="flex items-center w-36 space-x-3 p-2 md:mx-0 mx-6 md:my-0 my-3 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
                >
                    <FaChevronLeft className="text-xl text-white" />
                    <span className="font-semibold text-lg">Go Back</span>
                </div>
                <div className='md:py-8 py-3' >
                    <form onSubmit={handleSubmit} className="bg-white p-6  shadow-md">

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">Name of the Organization</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter Organization Name"
                                    value={selectedClient?.name}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.name ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.name && <span className="text-red-500">{errors.name}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Client Unique Code</label>
                                <input
                                    type="text"
                                    name="client_unique_id"
                                    placeholder="Enter Client Unique Code"
                                    value={selectedClient?.client_unique_id}
                                    onChange={handleChange}
                                    disabled
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_unique_id ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.client_unique_id && <span className="text-red-500">{errors.client_unique_id}</span>}
                            </div>
                        </div>

                        {/* Registered Address */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">Registered Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Enter Registered Address"
                                    value={selectedClient?.address}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.address ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.address && <span className="text-red-500">{errors.address}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">State</label>
                                <div className="relative">
                                    <select
                                        name="state"
                                        value={selectedClient?.state || ""}
                                        onChange={handleChange}
                                        className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.state ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb] appearance-none pr-8`}
                                    >
                                        <option value="" className="text-[#989fb3]">
                                            Select State
                                        </option>
                                        {option.map((opt) => (
                                            <option key={opt.value} value={opt.value} className="text-black">
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.state && <span className="text-red-500">{errors.state}</span>}
                                </div>
                            </div>
                        </div>

                        {/* State Code and GST Number */}
                        <div className="grid  md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">State Code</label>
                                <input
                                    type="number"
                                    name="state_code"
                                    placeholder="Enter State Code"
                                    value={selectedClient?.state_code}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.state_code ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">GSTIN</label>
                                <input
                                    type="text"
                                    name="gst_number"
                                    placeholder="Enter GSTIN"
                                    value={selectedClient?.gst_number}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.gst_number ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.gst_number && <span className="text-red-500">{errors.gst_number}</span>}
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">TAT (Turnaround Time)</label>
                                <input
                                    type="text"
                                    name="tat_days"
                                    placeholder="Enter TAT"
                                    value={selectedClient?.tat_days}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.tat_days ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.tat_days && <span className="text-red-500">{errors.tat_days}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Agreement Date </label>
                                <DatePicker
                                    selected={selectedClient?.agreement_date ? new Date(selectedClient.agreement_date) : null}
                                    onChange={(date) => {
                                        const formattedDate = date ? format(date, "yyyy-MM-dd") : "";
                                        handleChange({
                                            target: {
                                                name: "agreement_date",
                                                value: formattedDate
                                            }
                                        });
                                    }}
                                    placeholderText="Select Service Agreement Date"
                                    dateFormat="dd-MM-yyyy"
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.agreement_date ? "border-red-500" : "border-gray-300"
                                        } bg-[#f7f6fb]`}
                                    required
                                />
                                {errors.agreement_date && <span className="text-red-500">{errors.agreement_date}</span>}
                            </div>


                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">Standard Process</label>
                                <textarea
                                    name="client_standard"
                                    placeholder="Enter Standard Process"
                                    value={selectedClient?.client_standard}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_standard ? "border-red-500" : "border-gray-300"
                                        } bg-[#f7f6fb]`}
                                    rows={1} // Adjust the number of rows as needed
                                ></textarea>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">Client Logo</label>
                                <input type="file"
                                    name="logo"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange('logo', e)} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                {selectedClient?.logo && (

                                    <img
                                        src={`${selectedClient?.logo}`}
                                        alt="Profile"
                                        className="w-10 h-10 rounded-full cursor-pointer"
                                    />

                                )}
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">Agreement Period</label>
                                <select
                                    name="agreement_duration"
                                    value={selectedClient?.agreement_duration || ""}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.agreement_duration ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                >
                                    <option value="" className="text-[#989fb3]">
                                        Select Agreement Period
                                    </option>
                                    <option value="1 Year">1 Year</option>
                                    <option value="2 Years">2 Years</option>
                                    <option value="3 Years">3 Years</option>
                                    {/* Add more options as needed */}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    Upload Agreement
                                </label>
                                <input type="file"
                                    name="agr_upload"
                                    onChange={(e) => handleFileChange('agr_upload', e)} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                {selectedClient?.agreement && (
                                    <FileViewer fileUrl={selectedClient?.agreement} className=" w-15 h-15 object-cover rounded-md" />


                                )}
                            </div>

                        </div>


                        <h2 className="text-lg font-semibold mb-4"> Client Spoc</h2>
                        <div className="grid md:grid-cols-4 gap-4">
                            <div>
                                <label className="block mb-1 font-medium">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="first_level_matrix_name"
                                    value={selectedClient?.first_level_matrix_name}
                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.first_level_matrix_name && <span className="text-red-500">{errors.first_level_matrix_name}</span>}
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    Email
                                </label>
                                <input
                                    type="text"
                                    name={`emails`}
                                    placeholder="Enter Email"
                                    value={emailsInput}
                                    onChange={(e) => handleEmailInputChange(e.target.value)}
                                    className={`w-full rounded-md p-2.5 border border-gray-300  bg-[#f7f6fb]`}
                                />
                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    Mobile
                                </label>
                                <input
                                    type="number"
                                    name="mobile"
                                    placeholder="Enter Mobile Number"
                                    value={selectedClient?.mobile}
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.mobile ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                />
                                {errors.mobile && <span className="text-red-500">{errors.mobile}</span>}

                            </div>
                            <div>
                                <label className="block mb-1 font-medium">
                                    Designation
                                </label>
                                <input
                                    type="text"
                                    name="first_level_matrix_designation"
                                    value={selectedClient?.first_level_matrix_designation}
                                    onChange={handleChange}
                                    className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                />
                                {errors.first_level_matrix_designation && <span className="text-red-500">{errors.first_level_matrix_designation}</span>}
                            </div>


                        </div>

                        <div className="space-y-6">
                            {/* Escalation Manager */}
                            <h2 className="text-lg font-semibold">Escalation Manager</h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="w-full">
                                    <label className="block mb-1 font-medium"> Name</label>
                                    <input type="text" name="esc_manager_name" placeholder="Enter Name" value={selectedClient?.esc_manager_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium"> Email</label>
                                    <input type="email" name="esc_manager_email" placeholder="Enter Email" value={selectedClient?.esc_manager_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium"> Mobile</label>
                                    <input type="number" name="esc_manager_mobile" placeholder="Enter Mobile" value={selectedClient?.esc_manager_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium"> Designation</label>
                                    <input type="text" name="esc_manager_desgn" placeholder="Enter Designation" value={selectedClient?.esc_manager_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                            </div>

                            {/* Client SPOC */}


                            {/* Billing SPOC */}
                            <h2 className="text-lg font-semibold">Billing SPOC</h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Name</label>
                                    <input type="text" name="billing_spoc_name" placeholder="Enter Name" value={selectedClient?.billing_spoc_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Email</label>
                                    <input type="email" name="billing_spoc_email" placeholder="Enter Email" value={selectedClient?.billing_spoc_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Mobile</label>
                                    <input type="number" name="billing_spoc_mobile" placeholder="Enter Mobile" value={selectedClient?.billing_spoc_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Designation</label>
                                    <input type="text" name="billing_spoc_desgn" placeholder="Enter Designation" value={selectedClient?.billing_spoc_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold">Billing Escalation</h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Name</label>
                                    <input type="text" name="billing_escalation_name" placeholder="Enter Name" value={selectedClient?.billing_escalation_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Email</label>
                                    <input type="email" name="billing_escalation_email" placeholder="Enter Email" value={selectedClient?.billing_escalation_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Mobile</label>
                                    <input type="number" name="billing_escalation_mobile" placeholder="Enter Mobile" value={selectedClient?.billing_escalation_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Designation</label>
                                    <input type="text" name="billing_escalation_desgn" placeholder="Enter Designation" value={selectedClient?.billing_escalation_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                            </div>
                            <h2 className="text-lg font-semibold">Authorized Details</h2>
                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Authorized Person Name</label>
                                    <input type="text" name="authorized_detail_name" placeholder="Enter Authorized Person Name" value={selectedClient?.authorized_detail_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Email</label>
                                    <input type="email" name="authorized_detail_email" placeholder="Enter Email" value={selectedClient?.authorized_detail_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Mobile</label>
                                    <input type="number" name="authorized_detail_mobile" placeholder="Enter Mobile" value={selectedClient?.authorized_detail_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Designation</label>
                                    <input type="text" name="authorized_detail_desgn" placeholder="Enter Designation" value={selectedClient?.authorized_detail_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>

                            </div>
                            <h2 className="text-lg font-semibold">Key Account</h2>
                            <div className="grid md:grid-cols-4 mb-4 gap-4">
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Name</label>
                                    <input type="text" name="client_spoc_name" placeholder="Enter Name" value={selectedClient?.client_spoc_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Email</label>
                                    <input type="email" name="client_spoc_email" multiple placeholder="Enter Email" value={selectedClient?.client_spoc_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Mobile</label>
                                    <input type="number" name="client_spoc_mobile" placeholder="Enter Mobile" value={selectedClient?.client_spoc_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">Designation</label>
                                    <input type="text" name="client_spoc_desgn" placeholder="Enter Designation" value={selectedClient?.client_spoc_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                                </div>
                            </div>
                        </div>
                        <div className="grid gap-4 mt-4 mb-4">
                            <div className="visible_feild">

                                <label className="block mb-1 font-medium">
                                    Visible Fields<span className="text-red-500 text-xl" >*</span>
                                </label>
                                <MultiSelect
                                    className="w-full rounded-md border border-gray-300 bg-[#f7f6fb]"
                                    options={[
                                        { value: "batch_no", label: "Batch No" },
                                        { value: "case_id", label: "Case ID" },
                                        { value: "check_id", label: "Check ID" },
                                        { value: "ticket_id", label: "Ticket ID" },
                                        { value: "sub_client", label: "Sub Client" },
                                        { value: "gender", label: "Gender" },
                                        { value: "photo", label: "Photo" },
                                        { value: "location", label: "Location" },
                                        { value: "employeeId", label: "Employee ID" },
                                    ]}
                                    value={Array.isArray(selectedClient?.visible_fields) ? selectedClient.visible_fields.map(value => ({
                                        value: value,
                                        label: [
                                            { value: "batch_No", label: "Batch No" },
                                            { value: "case_id", label: "Case ID" },
                                            { value: "check_id", label: "Check ID" },
                                            { value: "ticket_id", label: "Ticket ID" },
                                            { value: "sub_client", label: "Sub Client" },
                                            { value: "gender", label: "Gender" },
                                            { value: "photo", label: "Photo" },
                                            { value: "location", label: "Location" },
                                            { value: "employeeId", label: "Employee ID" },
                                        ].find(option => option.value === value)?.label || value,
                                    })) : []}
                                    search
                                    onChange={(selectedOptions) => handleChange(null, selectedOptions)}
                                />



                            </div>
                        </div>
                        <div className={`grid ${selectedClient?.additional_login == "1" ? 'md:grid-cols-2' : ''} gap-4`}>
                            <div>
                                <label
                                    htmlFor="additional-login"
                                    className="block mb-1 font-medium"
                                >
                                    Login Required Option
                                </label>
                                <select
                                    id="additional-login"
                                    name="additional_login" // Add name attribute for consistency
                                    value={selectedClient?.additional_login ?? ""} // Use nullish coalescing for fallback
                                    onChange={handleChange}
                                    className={`w-full rounded-md p-2.5 mb-5 border ${errors.additional_login ? "border-red-500" : "border-gray-300"
                                        } bg-[#f7f6fb]`}
                                >
                                    <option value="">
                                        Select an option
                                    </option>
                                    <option value="1">Yes</option>
                                    <option value="0">No</option>
                                </select>

                                {errors.additional_login && (
                                    <span className="text-red-500 text-sm">{errors.additional_login}</span>
                                )}
                            </div>



                            {/* Conditionally render the username input when "yes" is selected */}
                            {selectedClient?.additional_login == "1" && (
                                <div className="mt-0">
                                    <label className="block mb-1 font-medium">username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={selectedClient?.username}
                                        onChange={handleChange}
                                        className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                        placeholder="Enter username"
                                    />
                                </div>
                            )}

                        </div>
                        <div className="grid gap-4">
                            {/* Row with Dropdown and Custom Logo side by side */}
                            <div className="flex flex-wrap gap-4">
                                {/* Dropdown - left side */}
                                <div className={`w-full ${selectedClient?.custom_template === "yes" ? "md:w-1/2" : ""}`}>
                                    <label className="block mb-1 font-medium">Custom - Report Template</label>
                                    <select
                                        onChange={handleChange}
                                        required
                                        value={selectedClient?.custom_template}
                                        name="custom_template"
                                        className={`w-full rounded-md p-3 mb-[20px] border ${errors.custom_template ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                                    >
                                        <option value="">Custom - Report Template</option>
                                        <option value="yes">Yes</option>
                                        <option value="no">No</option>
                                    </select>
                                    {errors.custom_template && (
                                        <span className="text-red-500">{errors.custom_template}</span>
                                    )}
                                </div>

                                {/* Custom Logo - right side if enabled */}
                                {selectedClient?.custom_template === "yes" && (
                                    <div className="w-full md:w-[48%]">
                                        <label className="block mb-1 font-medium">Custom Logo</label>
                                        <input
                                            type="file"
                                            name="custom_logo"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange("custom_logo", e)}
                                            className="w-full rounded-md p-2 border border-gray-300 bg-[#f7f6fb]"
                                        />
                                        {selectedClient?.custom_logo && (
                                            <img
                                                required
                                                src={selectedClient.custom_logo}
                                                alt="Profile"
                                                className="w-10 h-10 mt-2 rounded-full cursor-pointer"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* PDF Footer textarea - separate full-width line */}
                            {selectedClient?.custom_template === "yes" && (
                                <div className="grid md:grid-cols-2 mb-4 gap-4">
                                    <div className="flex justify-center w-full">
                                        <div className="w-full">
                                            <label className="block mb-1 font-medium">PDF Footer</label>
                                            <textarea
                                                name="custom_address"
                                                placeholder="Enter PDF Footer"
                                                onChange={handleChange}
                                                value={selectedClient?.custom_address}
                                                className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                                rows={2}
                                            ></textarea>
                                        </div>
                                    </div>
                                    <div className="flex justify-center w-full">
                                        <div className="w-full">
                                            <label htmlFor="disclaimer_emails" className="block mb-1 font-medium">
                                                Disclaimer Emails (for PDF)
                                            </label>
                                            <textarea
                                                id="disclaimer_emails"
                                                name="disclaimer_emails"
                                                value={selectedClient?.disclaimer_emails}
                                                placeholder="Enter email addresses, separated by commas"
                                                onChange={handleChange}
                                                className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                                rows={2}
                                            ></textarea>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="clientserviceTable">

                            <div className="table-container rounded-lg">
                                {/* Top Scroll */}
                                <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                                    <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                                </div>

                                {/* Actual Table Scroll */}
                                <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>

                                    <table className="min-w-full">
                                        <thead>
                                            <tr className='bg-[#c1dff2] text-[#4d606b]'>
                                                <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Group</th>
                                                <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Service code</th>
                                                <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Verification Service</th>
                                                <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Price</th>
                                                <th className="py-2 md:py-3 px-4 border-r border-b text-left uppercase whitespace-nowrap">Select Package</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {services.reduce((acc, item, index) => {
                                                const isSameGroup = index > 0 && item.group_title === services[index - 1].group_title;

                                                if (item.services.length > 0) {
                                                    if (!isSameGroup) {
                                                        acc.push(
                                                            <tr key={`group-${item.group_id}`} className='bg-[#c1dff2] text-[#4d606b]'>
                                                                <th className="py-2 md:py-3 px-4 border-r border-b text-center uppercase whitespace-nowrap">
                                                                    {item.symbol}
                                                                </th>
                                                                <th colSpan={4} className="py-2 md:py-3 px-4 border-r border-b text-center uppercase whitespace-nowrap">
                                                                    {item.group_title}
                                                                </th>
                                                            </tr>
                                                        );
                                                    }

                                                    item.services.forEach((service, serviceIndex) => {
                                                        const serviceNumber = serviceIndex + 1;

                                                        const { status, price, packages } = checkServiceById(selectedClient, service.service_id, item.group_id);
                                                        // console.log('service', selectedClient)
                                                        acc.push(
                                                            <tr key={`${item.group_id}-${service.service_id}`}>
                                                                <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap"></td>
                                                                <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap">
                                                                    {service.service_code}
                                                                </td>
                                                                <td className="py-2 md:py-3 px-4 border-l border-r border-b whitespace-nowrap">
                                                                    <div key={service.service_id}>
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`scope_${service.service_id}`}
                                                                            name="services"
                                                                            checked={status || false}
                                                                            onChange={() => handleCheckboxChange(selectedClient, {
                                                                                group_id: item.group_id,
                                                                                group_symbol: item.symbol,
                                                                                service_code: service.service_code,
                                                                                group_name: item.group_title,
                                                                                service_id: service.service_id,
                                                                                service_name: service.service_title,
                                                                                price: priceData[service.service_id]?.pricingPackages || '',
                                                                                selected_packages: status[service.service_id] || []
                                                                            })}
                                                                            className="mr-2 w-5 h-5"
                                                                        />
                                                                        <label htmlFor={`scope_${service.service_id}`} className="ml-2">{service.service_title}</label>
                                                                    </div>
                                                                </td>

                                                                <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap">
                                                                    <input
                                                                        type="number"
                                                                        name="pricingPackages"
                                                                        value={price || ""}
                                                                        onChange={(e) => handlePriceChange(e, service.service_id)}
                                                                        className='outline-none'
                                                                        disabled={!status}
                                                                        onBlur={(e) => handlePriceChange(e, service.service_id)}  // Send on blur/focus out
                                                                    />
                                                                </td>
                                                                <td className="py-2 md:py-3 px-4 border-r border-b whitespace-nowrap uppercase text-left">
                                                                    <MultiSelect
                                                                        options={packageList.map(pkg => ({ value: pkg.id, label: pkg.title }))}
                                                                        value={Array.isArray(packages) ? packages.map(pkg => ({
                                                                            value: pkg.id,
                                                                            label: pkg.name
                                                                        })) : []}


                                                                        onChange={(selectedList) => handlePackageChange(selectedList, service.service_id)}
                                                                        labelledBy="Select"
                                                                        disabled={!status} // Enable if service is selected
                                                                        className='uppercase'
                                                                    />
                                                                </td>

                                                            </tr>
                                                        );
                                                    });
                                                }

                                                return acc;
                                            }, [])}
                                        </tbody>

                                    </table>

                                </div>
                            </div>
                        </div>


                        <div className="mt-4 text-center">
                            <button type="submit" className={`p-6 py-3 bg-[#2c81ba] text-white  hover:scale-105  font-bold rounded-md hover:bg-[#0f5381] transition duration-200r ${loading ? "opacity-50 cursor-not-allowed" : ""
                                }`}>Update</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditClient