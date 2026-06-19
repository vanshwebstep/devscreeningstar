import { React, useState, useRef, useEffect, useCallback } from "react";
import "../../App.css";
import "react-datepicker/dist/react-datepicker.css";
import { useNavigate } from 'react-router-dom';
import { MultiSelect } from "react-multi-select-component";
import { State } from "country-state-city";
import SelectSearch from "react-select-search";
import { useApiLoading } from '../ApiLoadingContext';
import "react-select-search/style.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Swal from "sweetalert2";
import axios from "axios";
import { format } from "date-fns";

import { useClientContext } from "./ClientContext";
const states = State.getStatesOfCountry("IN");
const option = states.map((state) => ({
    value: state.isoCode,
    label: state.name,
}));
const storedToken = localStorage.getItem("token");
const AddClient = () => {
    const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
    const [emailsInput, setEmailsInput] = useState("");
    const [emailError, setEmailError] = useState("");

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

    const navigate = useNavigate();
    const [selectedFields, setSelectedFields] = useState([]);
    const clientSubmitRef = useRef(null);
    const {
        services,
        packageList,
        client_spoc_id,
        AllSpocs,
        escalation_manager_id,
        billing_spoc_id,
        billing_escalation_id,
        esc_manager_name,
        esc_manager_email,
        esc_manager_mobile,
        esc_manager_desgn,
        client_spoc_name,
        client_spoc_email,
        client_spoc_mobile,
        client_spoc_desgn,
        billing_spoc_name,
        billing_spoc_email,
        billing_spoc_mobile,
        billing_spoc_desgn,
        billing_escalation_name,
        billing_escalation_email,
        billing_escalation_mobile,
        billing_escalation_desgn,
        authorized_detail_name,
        authorized_detail_email,
        authorized_detail_mobile,
        authorized_detail_desgn,
        authorized_detail_id,
        finalLoading
    } = useClientContext();
    const [priceData, setPriceData] = useState({});
    const [files, setFiles] = useState([]);
    const [service, setService] = useState([]);
    const [selectedServices, setSelectedServices] = useState({});
    const [selectedPackages, setSelectedPackages] = useState([]);
    const [date, setDate] = useState(null);
    const [loading, setLoading] = useState(false);

    const [selectedOption, setSelectedOption] = useState(null);
    const [customTemplate, setCustomTemplate] = useState(null);

    const [selected, setSelected] = useState([]);
    const [errors, setErrors] = useState({});
    const [branches, setBranches] = useState([]);
    const [emails, setEmails] = useState([""]);
    const [fileName, setFileName] = useState("");
    const [apiError, setApiError] = useState("");
    const [clientData, setClientData] = useState({
        company_name: "",
        client_code: "",
        address: "",
        state: "",
        state_code: "",
        gstin: "",
        tat: "",
        date_agreement: "",
        agreement_period: "",
        agr_upload: "",
        scopeOfServices: [],
        visible_fields: [],
        mobile_number: "",
        dedicated_point_of_contact: "",
        first_level_matrix_name: "",
        first_level_matrix_designation: "",
        first_level_matrix_mobile: "",
        custom_address: "",
        disclaimer_emails: "",
        first_level_matrix_email: "",
        client_standard: "",
        username: "",

        esc_manager_name: "",
        esc_manager_email: "",
        esc_manager_mobile: "",
        esc_manager_desgn: "",

        client_spoc_name: "",
        client_spoc_email: "",
        client_spoc_mobile: "",
        client_spoc_desgn: "",

        billing_spoc_name: "",
        billing_spoc_email: "",
        billing_spoc_mobile: "",
        billing_spoc_desgn: "",

        billing_escalation_name: "",
        billing_escalation_email: "",
        billing_escalation_mobile: "",
        billing_escalation_desgn: "",

        authorized_detail_name: "",
        authorized_detail_email: "",
        authorized_detail_mobile: "",
        authorized_detail_desgn: "",
    });

    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files); // Convert FileList to an array

        if (selectedFiles.length === 0) {
            alert("No files selected.");
            return;
        }

        setFiles((prevFiles) => ({
            ...prevFiles,
            [fileName]: selectedFiles,
        }));
    };


    const uploadCustomerLogo = async (adminId, token, customerInsertId, password) => {

        console.log('insustssss', customerInsertId);

        const fileCount = Object.keys(files).length;
        for (const [index, [key, value]] of Object.entries(files).entries()) {
            const customerLogoFormData = new FormData();
            customerLogoFormData.append('admin_id', adminId);
            customerLogoFormData.append('_token', token);
            customerLogoFormData.append('customer_code', clientData.client_code);
            customerLogoFormData.append('customer_id', customerInsertId);
            for (const file of value) {
                customerLogoFormData.append('images', file);
                customerLogoFormData.append('upload_category', key);
            }
            if (fileCount === (index + 1)) {
                customerLogoFormData.append('send_mail', 1);
                customerLogoFormData.append('company_name', clientData.company_name);
                customerLogoFormData.append('password', password);
            }

            try {
                await axios.post(
                    `https://api.screeningstar.co.in/customer/upload`,
                    customerLogoFormData,
                    {
                        headers: {
                            "Content-Type": "multipart/form-data",
                        },
                    }
                );
                Swal.fire("Success", "Image Uploaded successfully!", "success");
            } catch (err) {
                Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
            }
        }
    };

    const memoizedAllSpocs = useCallback(async () => {
        console.log('workinggg')
        try {
            await AllSpocs();
        } finally {
            setApiLoading(false);
            console.log('workinggg finaly')
        }
    }, [AllSpocs]);

    useEffect(() => {
        const initialize = async () => {
            try {
                setApiLoading(true);
                // Set loading to true before login validation

                await validateAdminLogin(); // Wait for login validation to complete

                console.log('apiloading-1 (before AllSpocs):', true); // Should always be true
                if (finalLoading == true) {
                    setApiLoading(true);
                }
                else {
                    setApiLoading(true);

                }
                await memoizedAllSpocs(); // Fetch SPOCs

                setApiLoading(false); // Set loading to false after AllSpocs completes

                console.log('apiloading-2 (after AllSpocs):', false);
            } catch (error) {
                console.error(error.message);
                navigate('/admin-login');
            }
        };

        initialize();
    }, [navigate]);

    // It's better to keep `navigate` in dependencies


    const addBranch = () => {
        setBranches([...branches, { branch_email: "", branch_name: "" }]);
    };

    const removeBranch = (index) => {
        const newBranches = branches.filter((_, i) => i !== index);
        setBranches(newBranches);
    };

    const handleInputChange = (index, event) => {
        const { name, value } = event.target;
        const newBranches = [...branches];
        newBranches[index][name] = value;
        setBranches(newBranches);
    };

    // 1. Handle checkbox change (checking/unchecking a service)
    const handleCheckboxChange = ({
        group_id,
        group_symbol,
        service_code,
        group_name,
        service_id,
        service_name,
        price,
        selected_packages,
    }) => {
        setSelectedServices((prevSelectedServices) => {
            const isSelected = prevSelectedServices[service_id];
            const newSelectedState = !isSelected; // Toggle checkbox state

            // Update priceData and selectedPackages if deselecting
            if (!newSelectedState) {
                setPriceData((prevPriceData) => ({
                    ...prevPriceData,
                    [service_id]: { pricingPackages: "" },
                }));
                setSelectedPackages((prevSelectedPackages) => ({
                    ...prevSelectedPackages,
                    [service_id]: [],
                }));
            }

            // Send the data to server with the current selection status and other details
            sendDataToServer({
                group_id,
                group_symbol,
                service_code,
                group_name,
                service_id,
                service_name,
                price: newSelectedState ? price : "", // Send empty if deselected
                selected_packages: newSelectedState ? selected_packages : [], // Send empty if deselected
                action: "checkbox_change",
            });

            return {
                ...prevSelectedServices,
                [service_id]: newSelectedState,
            };
        });
    };




    // 2. Handle price change (focus in/out or typing in the price input)
    const handlePriceChange = (e, service_id) => {
        const newPrice = e.target.value;

        setPriceData((prevPriceData) => ({
            ...prevPriceData,
            [service_id]: {
                ...prevPriceData[service_id],
                pricingPackages: newPrice,
            },
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
        const selectedPackagesData = selectedList.map((pkg) => ({
            id: pkg.value,
            name: pkg.label,
        }));

        setSelectedPackages((prevSelected) => ({
            ...prevSelected,
            [serviceId]: selectedList.map((pkg) => pkg.value), // Store only the selected package IDs
        }));
        // Now, send the selected packages data
        const dataToSend = {
            action: "package_change",
            service_id: serviceId,
            selected_packages: selectedPackagesData,
        };

        // Call sendDataToServer to handle the update
        sendDataToServer(dataToSend);
    };

    function updateServiceById(
        serviceId,
        updatedInfo,
        services = clientData.scopeOfServices
    ) {
        for (let group of services) {
            if (group.services) {
                const service = group.services.find(
                    (service) => service.serviceId === serviceId
                );

                if (service) {
                    // Update the fields in the service object with the values in updatedInfo
                    Object.assign(service, updatedInfo);
                    return true; // Return true if update was successful
                }
            }
        }

        const newService = {
            serviceId,
            serviceTitle: updatedInfo.serviceTitle || "",
            serviceCode: updatedInfo.service_code || "",
            price: updatedInfo.price || "",
            packages: updatedInfo.packages || [], // Assuming updatedInfo includes packages
        };

        // Add the new service to the correct group
        const groupIndex = services.findIndex(
            (group) => group.group_id === updatedInfo.group_id
        );
        if (groupIndex !== -1) {
            services[groupIndex].services.push(newService);
        } else {
            services.push({
                group_id: updatedInfo.group_id,
                group_title: updatedInfo.group_name,
                services: [newService],
            });
        }

        // Update the clientData.scopeOfServices directly
        clientData.scopeOfServices = [...services]; // Ensure clientData is updated with the latest services
        setClientData((prev) => ({
            ...prev,
            scopeOfServices: services,
        }));

        return true;
    }

    // Function to send data to the server (or perform any other action you need)
    const sendDataToServer = (data) => {
        let sendDataRunning = false;
        let updatedData = {};

        // Handle the different actions
        switch (data.action) {
            case "package_change":
                updatedData = { packages: data.selected_packages }; // Assuming you want to update packages
                sendDataRunning = true;
                break;
            case "checkbox_change":
                const {
                    selected_packages,
                    group_id,
                    group_name,
                    group_symbol,
                    service_code,
                    price,
                    service_name,
                } = data;
                updatedData = {
                    selected_packages,
                    group_id,
                    group_name,
                    group_symbol,
                    service_code,
                    price,
                    serviceTitle: service_name,
                };
                sendDataRunning = true;
                break;
            case "price_change":
                updatedData = { price: data.price }; // Only updating price
                sendDataRunning = true;
                break;
            default:
                break;
        }

        if (sendDataRunning) {
            const serviceId = data.service_id;
            const isUpdated = updateServiceById(serviceId, updatedData);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        setClientData((prevData) => ({
            ...prevData,
            [name]: type === "file" ? files[0] : value, // Handle file input
        }));
    };

    const validateRequiredFields = () => {
        const requiredFields = [
            "company_name",
            "client_code",
            "address",
            "state",
            "state_code",
            "gstin",
            "tat",
            "date_agreement",
            "agreement_period",
            "mobile_number",

        ];

        const newErrors = {};

        // Validate clientData fields
        requiredFields.forEach((field) => {
            const fieldValue = clientData[field];

            if (
                !fieldValue ||
                (Array.isArray(fieldValue) && fieldValue.length === 0)
            ) {
                newErrors[field] = "This field is required";
            }
        });

        // Validate each branch's branch_email and branch_name
        branches.forEach((branch, index) => {
            if (branch.branch_email) {
                if (!branch.branch_name) {
                    newErrors[`branch_name_${index}`] = "Branch name is required when branch email is filled";
                }
            } else {
                // No validation needed if branch_email is not filled
                delete newErrors[`branch_email_${index}`];
                delete newErrors[`branch_name_${index}`];
            }
        });


        // Validate emails
        if (!emails || emails.length === 0) {
            newErrors.emails = "At least one email is required";
        } else {
            emails.forEach((emailString, index) => {

                // Email regex pattern
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                emails.forEach((email) => {
                    if (!emailPattern.test(email)) {
                        newErrors[`email_${index}`] = "Invalid email format";

                        Swal.fire({
                            icon: "error",
                            title: "Submission Error",
                            text: "Invalid Email format",
                        });
                    }
                });
            });

        }

        setErrors(newErrors);
        return newErrors;
    };

    console.log("errors", errors);

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent form submission immediately
        setApiLoading(true);
        setLoading(true);
        const fileCount = Object.keys(files).length;
        // Run validation and get errors
        const validationErrors = validateRequiredFields();
        if (emails.length == 0) {
            setErrors(prevErrors => ({
                ...prevErrors,
                duplicate_email: "Each branch email must be unique."
            }));
            setApiLoading(false);
            setLoading(false);
            Swal.fire({
                icon: "error",
                title: "Submission Error",
                text:
                    "Each branch email must be unique." ||
                    "Branch Emails cannot be same",
            });
            return;
        }
        // If there are validation errors, show an alert and stop submission
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            setApiLoading(false);
            setLoading(false);
            return; // Stop submission if there are validation errors
        }

        try {
            // Retrieve necessary data from localStorage
            const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
            const storedToken = localStorage.getItem("_token");
            const emailArray = clientData.client_spoc_email
                .split(',')
                .map(email => email.trim())  // remove whitespace
                .filter(email => email !== ""); // remove empty strings
            // Prepare the payload with all necessary data
            const payload2 = JSON.stringify({
                admin_id: admin_id,
                _token: storedToken,
                ...clientData,
                client_spoc_email: emailArray,
                visible_fields: clientData.visible_fields,// Send as an array
                branches,
                emails,
                custom_template: customTemplate,
                additional_login: selectedOption,
                send_mail: fileCount > 0 ? 0 : 1
            });
            // Set up request headers
            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            // Define the request options
            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: payload2,
                redirect: "follow",
            };

            // Make the API call
            const response = await fetch(
                "https://api.screeningstar.co.in/customer/create",
                requestOptions
            );

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.message || "Failed to submit the form";
                const newToken = result.token || result._token || storedToken || '';
                console.log('token saved succesfully');
                if (newToken) {
                    localStorage.setItem("_token", newToken);
                }
                throw new Error(errorMessage);
            }




            if (clientSubmitRef.current) {
                clientSubmitRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
            console.log('result', result);
            const customerInsertId = result.data?.customerId;
            const password = result.password;
            console.log('customerInsertId', customerInsertId);
            console.log('token saved succesfully');
            const newToken = result.token || result._token || storedToken || "";
            if (newToken) {
                console.log('token saved succesfully');
                localStorage.setItem("_token", newToken);
            }
            else {
                console.log('token failed to submit');

            }
            if (fileCount == 0) {
                setApiLoading(false);
                setLoading(false);
                Swal.fire("Success", result.message || "Form submitted successfully!", "success");

            }
            if (fileCount > 0) {
                await uploadCustomerLogo(admin_id, storedToken, customerInsertId, password);
                setLoading(false);
                setApiLoading(false);

                Swal.fire("Success", result.message || "Form submitted successfully!", "success");
            }



            // Reset the form data after successful submission
            setClientData({
                company_name: "",
                client_code: "",
                address: "",
                state: "",
                state_code: "",
                gstin: "",
                tat: "",
                date_agreement: "",
                agreement_period: "",
                agr_upload: "",
                scopeOfServices: [],
                visible_fields: [],
                mobile_number: "",
                dedicated_point_of_contact: "",
                first_level_matrix_name: "",
                first_level_matrix_designation: "",
                first_level_matrix_mobile: "",
                custom_template: "",
                custom_address: "",
                disclaimer_emails: "",
                first_level_matrix_email: "",
                client_standard: "",
                username: "",

                esc_manager_name: "",
                esc_manager_email: "",
                esc_manager_mobile: "",
                esc_manager_desgn: "",

                client_spoc_name: "",
                client_spoc_email: "",
                client_spoc_mobile: "",
                client_spoc_desgn: "",

                billing_spoc_name: "",
                billing_spoc_email: "",
                billing_spoc_mobile: "",
                billing_spoc_desgn: "",

                billing_escalation_name: "",
                billing_escalation_email: "",
                billing_escalation_mobile: "",
                billing_escalation_desgn: "",

                authorized_detail_name: "",
                authorized_detail_email: "",
                authorized_detail_mobile: "",
                authorized_detail_desgn: "",
            });
            setFiles([]);
            setEmails([])
            setSelected([]); // Clear selected package options
            setBranches([{ branch_email: "", branch_name: "" }]); // Reset branches
            setDate(null); // Reset service agreement date
            setSelectedOption(null); // Reset login requirement option
            setFileName("");
            setSelectedServices({});
            setPriceData({});
            setSelectedPackages([])
            navigate('/admin-active-account');
        } catch (error) {
            setApiLoading(false);
            setLoading(false);
            console.error("Submission error:", error);

            // Display the dynamic error using Swal
            Swal.fire({
                icon: "error",
                title: "Submission Error",
                text:
                    error.message ||
                    "There was an error submitting the form. Please try again.",
            });

            setApiError(
                error.message ||
                "There was an error submitting the form. Please try again."
            );
        }

        // Clear any previous API errors
        setApiError("");
    };


    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [services, loading]); // recalc whenever data changes


    const handleEmailInputChange = (value) => {
        setEmailsInput(value);
        console.log('value---', value)
        // Convert to array & trim spaces
        const emailArray = value.split(",").map(email => email.trim());

        // Optional: Basic email validation
        const invalidEmails = emailArray.filter(email => email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email));

        if (invalidEmails.length > 0) {
            // setEmailError("One or more emails are invalid.");
        } else {
            setEmailError("");
        }

        // Update emails array
        setEmails(emailArray.filter(email => email !== ""));
    };
    const addEmailField = () => {
        setEmails([...emails, ""]); // Add new empty email field
    };

    const removeEmailField = (index) => {
        const updatedEmails = emails.filter((_, i) => i !== index);
        setEmails(updatedEmails);
    };
    const Loader = () => (
        <div className="flex w-full bg-white justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    return (
        <div
            className="w-full   border-black border  overflow-hidden"
            ref={clientSubmitRef}
            id="clientSubmit"
        >

            <form
                className={`space-y-4  py-6 px-4 md:py-[30px] md:px-[51px]   bg-white border ${loading ? "opacity-50 blur-sm cursor-not-allowed" : ""
                    }`}
                onSubmit={handleSubmit}
            >
                {/* Organization Name */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            Name of the Organization <span className="text-red-500 text-xl" >*</span>
                        </label>
                        <input
                            type="text"
                            name="company_name"
                            required
                            placeholder="Enter Organization Name"
                            value={clientData.company_name}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.company_name ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />
                        {errors.company_name && (
                            <span className="text-red-500">{errors.company_name}</span>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Client Unique Code<span className="text-red-500 text-xl" >*</span></label>
                        <input
                            type="text"
                            name="client_code"
                            required
                            placeholder="Enter Client Unique Code"
                            value={clientData.client_code}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_code ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />
                        {errors.client_code && (
                            <span className="text-red-500">{errors.client_code}</span>
                        )}
                    </div>
                </div>

                {/* Registered Address */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            Registered Address<span className="text-red-500 text-xl" >*</span>
                        </label>
                        <input
                            type="text"
                            name="address"
                            required
                            placeholder="Enter Registered Address"
                            value={clientData.address}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.address ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />
                        {errors.address && (
                            <span className="text-red-500">{errors.address}</span>
                        )}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">State<span className="text-red-500 text-xl" >*</span></label>
                        <div className="relative">
                            <select
                                name="state"
                                required
                                value={clientData.state || ""}
                                onChange={handleChange}
                                className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.state ? "border-red-500" : "border-gray-300"
                                    } bg-[#f7f6fb] appearance-none pr-8`}
                            >
                                <option value="" className="text-[#989fb3]">
                                    Select State
                                </option>
                                {option.map((opt) => (
                                    <option
                                        key={opt.value}
                                        value={opt.value}
                                        className="text-black"
                                    >
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            {errors.state && (
                                <span className="text-red-500">{errors.state}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* State Code and GST Number */}
                <div className="grid mb-[30px] md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">State Code<span className="text-red-500 text-xl" >*</span></label>
                        <input
                            type="number"
                            name="state_code"
                            required
                            placeholder="Enter State Code"
                            value={clientData.state_code}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.state_code ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">GSTIN<span className="text-red-500 text-xl" >*</span></label>
                        <input
                            type="text"
                            name="gstin"
                            required
                            placeholder="Enter GSTIN"
                            value={clientData.gstin}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.gstin ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />
                        {errors.gstin && (
                            <span className="text-red-500">{errors.gstin}</span>
                        )}
                    </div>
                </div>

                {/* Mobile Number and TAT */}
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            TAT (Turnaround Time)<span className="text-red-500 text-xl" >*</span>
                        </label>
                        <input
                            type="number"
                            name="tat"
                            required
                            placeholder="Enter TAT"
                            value={clientData.tat}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.tat ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />
                        {errors.tat && <span className="text-red-500">{errors.tat}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">
                            Agreement Date{" "}<span className="text-red-500 text-xl" >*</span>
                        </label>
                        <DatePicker
                            selected={clientData.date_agreement ? new Date(clientData.date_agreement) : null}
                            onChange={(date) => {
                                const formattedDate = format(date, "yyyy-MM-dd");
                                handleChange({
                                    target: {
                                        name: "date_agreement",
                                        value: formattedDate
                                    }
                                });
                            }}
                            placeholderText="Select Agreement Date"
                            dateFormat="dd-MM-yyyy"
                            className={`w-full rounded-md p-2.5 mb-[20px] uppercase border ${errors.date_agreement ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                            required
                        />
                        {errors.date_agreement && (
                            <span className="text-red-500">{errors.date_agreement}</span>
                        )}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            Client Logo
                        </label>
                        <input
                            type="file"
                            name="logo"
                            accept="image/*" // Allows only image files
                            onChange={(e) => handleFileChange("logo", e)}
                            className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                        />

                    </div>
                    <div>
                        <label className="block mb-1 font-medium">
                            Standard Process
                        </label>
                        <textarea
                            required
                            name="client_standard"
                            placeholder="Enter Standard Process"
                            value={clientData.client_standard}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.client_standard ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                            rows={1} // Adjust the number of rows as needed
                        ></textarea>

                        {errors.client_standard && (
                            <span className="text-red-500">{errors.client_standard}</span>
                        )}
                    </div>


                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            Agreement Period<span className="text-red-500 text-xl" >*</span>
                        </label>
                        <select
                            name="agreement_period"
                            required
                            value={clientData.agreement_period || ""}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.agreement_period ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
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
                        <input
                            type="file"
                            name="agr_upload"
                            onChange={(e) => handleFileChange("agr_upload", e)}
                            className="w-full rounded-md p-2 border border-gray-300 bg-[#f7f6fb]"
                        />
                    </div>
                </div>
                <h2 className="text-lg font-semibold">Client Spoc</h2>
                <div className="grid md:grid-cols-4 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">
                            Name
                        </label>
                        <input
                            type="text"
                            name="first_level_matrix_name"
                            placeholder="Enter Name of the key account"

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
                            name="emails"
                            required
                            placeholder="You can add multiple emails by comas(,)"
                            value={emailsInput}
                            onChange={(e) => handleEmailInputChange(e.target.value)}
                            className={`w-full rounded-md p-2.5 border ${emailError ? "border-red-500" : "border-gray-300"} bg-[#f7f6fb]`}
                        />
                        {emailError && <span className="text-red-500">{emailError}</span>}

                    </div>
                    <div>
                        <label className="block mb-1 font-medium">
                            Mobile
                        </label>

                        <input
                            type="number"
                            name="mobile_number"
                            required
                            placeholder="Enter Mobile Number"
                            value={clientData.mobile_number}
                            onChange={handleChange}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.mobile_number ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />

                        {errors.mobile_number && <span className="text-red-500">{errors.mobile_number}</span>}
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">
                            Designation
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Designation"
                            name="first_level_matrix_designation"
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
                            <input type="text" name="esc_manager_name" placeholder="Enter Name" value={clientData.esc_manager_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium"> Email</label>
                            <input type="email" name="esc_manager_email" placeholder="Enter Email" value={clientData.esc_manager_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium"> Mobile</label>
                            <input type="number" name="esc_manager_mobile" placeholder="Enter Mobile" value={clientData.esc_manager_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium"> Designation</label>
                            <input type="text" name="esc_manager_desgn" placeholder="Enter Designation" value={clientData.esc_manager_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                    </div>

                    {/* Client SPOC */}


                    {/* Billing SPOC */}
                    <h2 className="text-lg font-semibold">Billing SPOC</h2>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Name</label>
                            <input type="text" name="billing_spoc_name" placeholder="Enter Name" value={clientData.billing_spoc_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Email</label>
                            <input type="email" name="billing_spoc_email" placeholder="Enter Email" value={clientData.billing_spoc_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Mobile</label>
                            <input type="number" name="billing_spoc_mobile" placeholder="Enter Mobile" value={clientData.billing_spoc_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Designation</label>
                            <input type="text" name="billing_spoc_desgn" placeholder="Enter Designation" value={clientData.billing_spoc_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                    </div>
                    <h2 className="text-lg font-semibold">Billing Escalation</h2>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Name</label>
                            <input type="text" name="billing_escalation_name" placeholder="Enter Name" value={clientData.billing_escalation_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Email</label>
                            <input type="email" name="billing_escalation_email" placeholder="Enter Email" value={clientData.billing_escalation_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Mobile</label>
                            <input type="number" name="billing_escalation_mobile" placeholder="Enter Mobile" value={clientData.billing_escalation_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Designation</label>
                            <input type="text" name="billing_escalation_desgn" placeholder="Enter Designation" value={clientData.billing_escalation_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                    </div>
                    <h2 className="text-lg font-semibold">Authorized Details</h2>
                    <div className="grid md:grid-cols-4 gap-4">
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Authorized Person Name</label>
                            <input type="text" name="authorized_detail_name" placeholder="Enter Authorized Person Name" value={clientData.authorized_detail_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Email</label>
                            <input type="email" name="authorized_detail_email" placeholder="Enter Email" value={clientData.authorized_detail_email || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Mobile</label>
                            <input type="number" name="authorized_detail_mobile" placeholder="Enter Mobile" value={clientData.authorized_detail_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Designation</label>
                            <input type="text" name="authorized_detail_desgn" placeholder="Enter Designation" value={clientData.authorized_detail_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]" />
                        </div>

                    </div>
                    <h2 className="text-lg font-semibold"> Key Account</h2>
                    <div className="grid md:grid-cols-4 mb-4 gap-4">
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Name</label>

                            <input type="text" name="client_spoc_name" placeholder="Enter Name" value={clientData.client_spoc_name || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Email</label>
                            <input
                                type="email"

                                name="client_spoc_email"
                                placeholder="Enter comma-separated emails"
                                value={clientData.client_spoc_email || ''}
                                onChange={handleChange}
                                className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]"
                                multiple // Optional: allows multiple emails in some browsers
                            />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Mobile</label>
                            <input type="number" name="client_spoc_mobile" placeholder="Enter Mobile" value={clientData.client_spoc_mobile || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                        <div className="w-full">
                            <label className="block mb-1 font-medium">Designation</label>
                            <input type="text" name="client_spoc_desgn" placeholder="Enter Designation" value={clientData.client_spoc_desgn || ''} onChange={handleChange} className="w-full rounded-md p-2.5 mb-[20px] border border-gray-300 bg-[#f7f6fb]" />
                        </div>
                    </div>
                </div>
                <div className="grid gap-4">
                    <div className="visible_feild">
                        <label className="block mb-1 font-medium">
                            Visible Fields
                        </label>
                        <MultiSelect

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
                            value={clientData.visible_fields.map(value => ({
                                value: value,
                                label:

                                    [
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
                            }))} // Convert stored values back to object format
                            placeholder="Choose your fields"
                            search
                            onChange={(selectedOptions) =>
                                setClientData((prevData) => ({
                                    ...prevData,
                                    visible_fields: selectedOptions.map(opt => opt.value), // Store only values
                                }))
                            }
                            className={`w-full rounded-md p-1 mb-[20px] border ${errors?.visible_fields ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        />







                        {errors.additional_login && (
                            <span className="text-red-500">{errors.additional_login}</span>
                        )}
                    </div>
                </div>
                <div className={`grid ${selectedOption === 'yes' ? 'md:grid-cols-2' : ''} gap-4`}>
                    <div>
                        <label className="block mb-1 font-medium">
                            Secondary Credentials <span className="text-red-500 text-xl" >*</span>
                        </label>
                        <select
                            required
                            onChange={(e) => setSelectedOption(e.target.value)}
                            className={`w-full rounded-md p-2.5 mb-[20px] border ${errors.additional_login ? "border-red-500" : "border-gray-300"
                                } bg-[#f7f6fb]`}
                        >
                            <option value="">Secondary Credentials</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                        {errors.additional_login && (
                            <span className="text-red-500">{errors.additional_login}</span>
                        )}
                    </div>

                    {/* Conditionally render the 
                     input when "yes" is selected */}
                    {selectedOption === "yes" && (
                        <div className="mt-0">
                            <label className="block mb-1 font-medium">username</label>
                            <input
                                type="text"
                                name="username"
                                onChange={handleChange}
                                className="w-full rounded-md p-2.5 border border-gray-300 bg-[#f7f6fb]"
                                placeholder="Enter username"
                            />
                        </div>
                    )}
                </div>
                <div></div>
                <div className="grid gap-4">
                    {/* Row with Dropdown and Custom Logo side by side */}
                    <div className="flex flex-wrap gap-4">
                        {/* Dropdown - left side */}
                        <div className={`w-full ${customTemplate === "yes" ? "md:w-1/2" : ""}`}>
                            <label className="block mb-1 font-medium">Custom - Report Template</label>
                            <select
                                onChange={(e) => setCustomTemplate(e.target.value)}
                                required
                                className={`w-full rounded-md p-3 mb-[20px] border ${errors.custom_template ? "border-red-500" : "border-gray-300"
                                    } bg-[#f7f6fb]`}
                            >
                                <option value="">Custom - Report Template</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                            {errors.custom_template && (
                                <span className="text-red-500">{errors.custom_template}</span>
                            )}
                        </div>


                        {customTemplate === "yes" && (
                            <div className="w-full md:w-[48%]">
                                <label className="block mb-1 font-medium">Custom Logo</label>
                                <input
                                    type="file"
                                    name="custom_logo"
                                    accept="image/*"
                                    onChange={(e) => handleFileChange("custom_logo", e)}
                                    className="w-full rounded-md p-2 border border-gray-300 bg-[#f7f6fb]"
                                />
                            </div>
                        )}
                    </div>

                    {/* PDF Footer textarea - separate full-width line */}
                    {customTemplate === "yes" && (
                        <div className="grid md:grid-cols-2 mb-4 gap-4">
                            <div className="flex justify-center w-full">
                                <div className="w-full">
                                    <label className="block mb-1 font-medium">PDF Footer</label>
                                    <textarea
                                        name="custom_address"
                                        placeholder="Enter PDF Footer"
                                        onChange={handleChange}
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





                <div className="">
                    {branches.length > 0 &&
                        branches.map((branch, index) => (
                            <div key={index} className="mb-4 flex items-center md:w-1/2 md:grid-cols-2 gap-4">
                                <div className="w-1/2">
                                    <input
                                        type="email"
                                        name="branch_email"
                                        value={branch.branch_email}
                                        required={branches.length > 0} // Only required when branches exist
                                        onChange={(event) => handleInputChange(index, event)}
                                        placeholder="Branch Email"
                                        className="border w-full rounded-md p-2.5 mb-[20px]"
                                    />
                                    {errors[`branch_email_${index}`] && (
                                        <span className="text-red-500">{errors[`branch_email_${index}`]}</span>
                                    )}
                                </div>
                                <div className="flex w-1/2 items-start gap-2">
                                    <div>
                                        <input
                                            type="text"
                                            name="branch_name"
                                            required={branches.length > 0} // Only required when branches exist
                                            value={branch.branch_name}
                                            onChange={(event) => handleInputChange(index, event)}
                                            placeholder="Branch Name"
                                            className="border w-full rounded-md p-2.5 mb-[20px]"
                                        />
                                        {errors[`branch_name_${index}`] && (
                                            <span className="text-red-500">{errors[`branch_name_${index}`]}</span>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeBranch(index)}
                                        className="bg-red-500 hover:bg-red-600 text-white p-2.5 mb-[20px] rounded"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    }

                    <button
                        type="button"
                        onClick={addBranch}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 px-4 rounded"
                    >
                        Add Branch
                    </button>
                    <button
                        type="submit"
                        className="bg-green-500 hover:bg-green-600 text-white p-2 px-4 rounded ml-4"
                    >
                        Submit
                    </button>
                </div>

                <div className="clientserviceTable">
                    <div className="table-container rounded-lg">
                        {/* Top Scroll */}
                        <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                            <div className="top-scroll-inner" style={{ width: scrollWidth }} />
                        </div>

                        {/* Actual Table Scroll */}
                        <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>
                            <table className="min-w-full border border-black  text-sm md:text-base">
                                <thead className="border-black">
                                    <tr className="bg-[#c1dff2] text-[#4d606b] border-black">
                                        <th className="py-2 md:py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">
                                            Group
                                        </th>
                                        <th className="py-2 md:py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">
                                            Service code
                                        </th>
                                        <th className="py-2 md:py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">
                                            Verification Service
                                        </th>
                                        <th className="py-2 md:py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">
                                            Price
                                        </th>
                                        <th className="py-2 md:py-3 px-4 border-r border-b border-black text-left uppercase whitespace-nowrap">
                                            Select Package
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.reduce((acc, item, index) => {
                                        const isSameGroup =
                                            index > 0 &&
                                            item.group_title === services[index - 1].group_title;

                                        if (item.services.length > 0) {
                                            if (!isSameGroup) {
                                                acc.push(
                                                    <tr
                                                        key={`group-${item.group_id}`}
                                                        className="bg-[#c1dff2] text-[#4d606b]"
                                                    >
                                                        <th className="py-2 md:py-3 px-4 border-r border-b border-black text-center uppercase whitespace-nowrap">
                                                            {item.symbol}
                                                        </th>
                                                        <th
                                                            colSpan={4}
                                                            className="py-2 md:py-3 px-4 border-r border-b border-black text-left pl-[215px] uppercase whitespace-nowrap"
                                                        >
                                                            {item.group_title}
                                                        </th>
                                                    </tr>
                                                );
                                            }

                                            item.services.forEach((service, serviceIndex) => {
                                                const serviceNumber = serviceIndex + 1;

                                                acc.push(
                                                    <tr key={`${item.group_id}-${service.service_id}`}>
                                                        <td className="py-2 md:py-3 px-4 border-l border-black border-r border-b whitespace-nowrap"></td>
                                                        <td className="py-2 md:py-3 px-4 border-l border-black border-r border-b whitespace-nowrap">
                                                            {service.service_code}
                                                        </td>
                                                        <td className="py-2 md:py-3 px-4 border-l border-r border-black border-b whitespace-nowrap">
                                                            <div key={service.service_id}>
                                                                <input
                                                                    type="checkbox"
                                                                    id={`scope_${service.service_id}`}
                                                                    name="scopeOfServices"
                                                                    checked={
                                                                        selectedServices[service.service_id] || false
                                                                    }
                                                                    onChange={() =>
                                                                        handleCheckboxChange({
                                                                            group_id: item.group_id,
                                                                            group_symbol: item.symbol,
                                                                            service_code: service.service_code,
                                                                            group_name: item.group_title,
                                                                            service_id: service.service_id,
                                                                            service_name: service.service_title,
                                                                            price:
                                                                                priceData[service.service_id]
                                                                                    ?.pricingPackages || "",
                                                                            selected_packages:
                                                                                selectedPackages[service.service_id] ||
                                                                                [],
                                                                        })
                                                                    }
                                                                    className="mr-2 w-5 h-5"
                                                                />
                                                                <label
                                                                    htmlFor={`scope_${service.service_id}`}
                                                                    className="ml-2"
                                                                >
                                                                    {service.service_title}
                                                                </label>
                                                            </div>
                                                        </td>

                                                        <td
                                                            className="py-2 md:py-3 px-4 border-r border-b border-black whitespace-nowrap"
                                                            onClick={() => {
                                                                if (!selectedServices[service.service_id]) {
                                                                    Swal.fire({
                                                                        icon: "warning",
                                                                        title: `Please Select ${service.service_title} Service First`,
                                                                        showConfirmButton: true,
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <input
                                                                type="number"
                                                                name="pricingPackages"
                                                                value={
                                                                    priceData[service.service_id]
                                                                        ?.pricingPackages || ""
                                                                }
                                                                onChange={(e) =>
                                                                    handlePriceChange(e, service.service_id)
                                                                }
                                                                className="p-2 border rounded"
                                                                disabled={!selectedServices[service.service_id]}
                                                                onBlur={(e) =>
                                                                    handlePriceChange(e, service.service_id)
                                                                }
                                                            />
                                                        </td>
                                                        <td
                                                            className="py-2 md:py-3 px-4 border-r border-b border-black whitespace-nowrap uppercase text-left"
                                                            onClick={() => {
                                                                if (!selectedServices[service.service_id]) {
                                                                    Swal.fire({
                                                                        icon: "warning",
                                                                        title: `Please Select ${service.service_title} Service First`,
                                                                        showConfirmButton: true,
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <MultiSelect
                                                                options={packageList.map((pkg) => ({
                                                                    value: pkg.id,
                                                                    label: pkg.title,
                                                                }))}
                                                                value={
                                                                    selectedPackages[service.service_id]?.map(
                                                                        (pkgId) => ({
                                                                            value: pkgId,
                                                                            label: packageList.find(
                                                                                (pkg) => pkg.id === pkgId
                                                                            )?.title,
                                                                        })
                                                                    ) || []
                                                                }
                                                                onChange={(selectedList) =>
                                                                    handlePackageChange(
                                                                        selectedList,
                                                                        service.service_id
                                                                    )
                                                                }
                                                                labelledBy="Select"
                                                                disabled={!selectedServices[service.service_id]} // Enable if service is selected
                                                                className="uppercase"
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

                <div className="text-center">
                    <button
                        type="submit"
                        className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold rounded-md hover:bg-[#0f5381] transition duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        disabled={loading}
                    >
                        Submit
                    </button>

                    {apiError && <div className="text-red-500 mt-4">{apiError}</div>}
                </div>
            </form>
        </div>
    );
};

export default AddClient;
