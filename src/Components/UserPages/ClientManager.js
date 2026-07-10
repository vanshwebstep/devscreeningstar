import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useApiLoadingBranch } from '../BranchApiLoadingContext';
import Default from "../../imgs/default.png"
import CustomMultiSelect from './CustomMultiselect';

const ClientManager = () => {
    const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
    const [visibleFeilds, setVisibleFeilds] = useState([]);
    const [isExist, setIsExist] = useState([])
    const fileInputRef = useRef();
    const attachDocsRef = useRef();
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
    const [searchTerm, setSearchTerm] = useState("");
    const [tableCurrentPage, setTableCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200, 500, 1000];
    const navigate = useNavigate();
    const [loadingStates, setLoadingStates] = useState({});
    const clientEditRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const entriesPerPage = 10;
    const [itemsPerPage] = useState(10); // Set the number of items per page
    const [searchQuery, setSearchQuery] = useState("");
    const [branchData, setBranchData] = useState(null);
    const [files, setFiles] = useState({});
    const [formData, setFormData] = useState({
    });
    const [errors, setErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [spocName, setSpocName] = useState('');
    const [spocID, setSpocID] = useState('');
    const [spocs, setSpocs] = useState([]);
    const [services, setServices] = useState([]);
    const [rawServices, setRawServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingbtn, setLoadingbtn] = useState(false);
    const [error, setError] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [clientSpocName, setClientSpocName] = useState([]);
    const [applicantName, setApplicantName] = useState([]);
    const [organisationName, setOrganisationName] = useState('');
    const [handleEditClick, setHandleEditClick] = useState('');
    const [clientApplicationId, setClientApplicationId] = useState('');

    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalServices, setModalServices] = React.useState([]);

    const totalEntries = services.reduce((total, group) => {
        return total + (Array.isArray(group.services) ? group.services.length : 0);
    }, 0);

    const [ipAddress, setIpAddress] = useState(null);

    useEffect(() => {
        // Make a request to ipify API to get the IP address
        axios.get('https://api.ipify.org?format=json')
            .then((response) => {
                setIpAddress(response.data.ip);
            })
            .catch((error) => {
                console.error('Error fetching IP address:', error);
            });
    }, []);
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    // Get the flattened list of services with group details
    const allServices = services.flatMap((group, groupIndex) => {
        // Ensure group.services is a valid array
        if (!Array.isArray(group.services)) {
            return []; // Return an empty array if services is not defined or not an array
        }

        return group.services.map((service, serviceIndex) => ({
            ...service,
            groupSymbol: group.group_symbol || group.group_title,
            index: serviceIndex,
            groupIndex,
        }));
    });

    // console.log(`allServices - `, allServices);

    // Determine the services to display on the current page
    const startIndex = (currentPage - 1) * entriesPerPage;
    const currentServices = allServices.slice(
        startIndex,
        startIndex + entriesPerPage
    );

    // Handle page changes
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    useEffect(() => {
        const branchInfo = JSON.parse(localStorage.getItem("branch"));
        if (branchInfo) {
            setBranchData(branchInfo);
        }
    }, []);

    const handleFileChange = (fileName, e) => {
        const selectedFiles = Array.from(e.target.files);
        setFiles(prevFiles => ({ ...prevFiles, [fileName]: selectedFiles }));
    };

    const fetchCustomerInfo = useCallback(async () => {
        setLoading(true);
        setApiLoadingBranch(true);

        const branchInfo = JSON.parse(localStorage.getItem("branch"));
        const { customer_id, id: branch_id } = branchInfo;
        const branch_token = localStorage.getItem("branch_token");
        const url = `http://localhost:5000/branch/client-application/listings?customer_id=${customer_id}&branch_id=${branchInfo.branch_id}&_token=${branch_token}`;

        try {
            let response;
            // Assuming branchData is already an object; no need for JSON.parse
            if (branchInfo?.type === "sub_user") {
                const sub_user_id = branchInfo?.id ?? null;
                response = await fetch(`${url}&sub_user_id=${sub_user_id}`);
            } else {
                response = await fetch(url);
            }

            if (response.ok) {
                const result = await response.json();
                const newToken = result.token || result._token || '';
                if (newToken) {
                    localStorage.setItem("branch_token", newToken);
                }

                setTableData(result.data.clientApplications);
                const customerInfo = result.data.customer;
                const services = customerInfo.services ? JSON.parse(customerInfo.services) : [];
                setRawServices(services);
                setServices(services);
                setFormData(prevFormData => ({
                    ...prevFormData,
                    organizationName: customerInfo.name || '',
                    generate_report_type: formData.generate_report_type || 'CONFIDENTIAL BACKGROUND SCREENING REPORT',
                }));
                setSpocs(customerInfo?.client_spoc_name || []);

                setOrganisationName(customerInfo.name);
                const spocDetails = result.data.customer.spoc_details?.map(spoc => ({
                    id: spoc.id,
                    name: spoc.name,
                }));
                const spocDetailss = result.data.clientApplications?.map(spoc => ({
                    employeIdExist: spoc.employee_id,
                    locationExist: spoc.location,
                }));

                // console.log('spocDetailss', spocDetailss);

                const isExist = {
                    employeIdExist: spocDetailss.some(spoc => spoc.employeIdExist && spoc.employeIdExist.trim() !== ""),
                    locationExist: spocDetailss.some(spoc => spoc.locationExist && spoc.locationExist.trim() !== "")
                };

                setIsExist(isExist);
                setClientSpocName(spocDetails || []);
                setSpocName(result.data.customer.client_spoc_name);
                const visiblefeilds = JSON.parse(customerInfo.visible_fields);
                setVisibleFeilds(visiblefeilds);
            } else {
                // console.log('Error fetching data:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setApiLoadingBranch(false);
            // Ensures loading is set to false whether the request succeeds or fails
        }
    }, []);


    useEffect(() => {
        const initialize = async () => {
            try {
                if (apiLoadingBranch == false) {
                    await validateBranchLogin();
                    await fetchCustomerInfo();
                }
            } catch (error) {
                console.error(error.message);
                navigate('/userLogin');
            }
        };

        initialize();
    }, [fetchCustomerInfo, navigate]);

    const handleEdit = (item) => {
        if (clientEditRef.current) {
            clientEditRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        setHandleEditClick('Update');
        const selectedServices = (item.services || "")
            .split(",")
            .map(service => {
                const trimmedService = service.trim();  // Trim each service string
                const serviceNumber = parseInt(trimmedService, 10);  // Convert to number
                // console.log(`Trimmed Service: "${trimmedService}", Parsed Number: ${serviceNumber}`);
                return serviceNumber; // Return the converted number
            });

        // Log the final array of selected service IDs
        // console.log("selectedServices -", selectedServices);

        // Map over services and set isSelected based on selectedServices array
        const updatedServices = services.map(group => {
            // console.log(`Processing group: ${group.group_title} (ID: ${group.group_id})`);

            return {
                ...group, // Keep the existing properties of the group
                services: group.services.map(service => {
                    // console.log(`Processing service: ${service.serviceTitle} (ID: ${service.serviceId})`);

                    // Check if the serviceId is in selectedServices array
                    const isSelected = selectedServices.includes(service.serviceId);
                    // console.log(`Is service ${service.serviceTitle} selected? ${isSelected}`);

                    // Return the updated service object with isSelected property
                    return {
                        ...service, // Keep the existing properties of the service
                        isSelected: isSelected // Mark as selected or not based on condition
                    };
                })
            };
        });

        // Log the final updated services array
        // console.log("Updated Services: ", updatedServices);
        setServices(updatedServices);
        setFormData({
            id: item.id,
            organizationName: organisationName,
            fullName: item.name || '',
            photo: item.photo || '',
            employeeId: item.employee_id || '',
            location: item.location || '',
            client_spoc_name: item.client_spoc_name || "",
            groupManager: item.groupManager || '',
            applicationId: item.application_id || '',
            gender: item.gender,
            batch_no: item.batch_no,
            case_id: item.case_id,
            check_id: item.check_id,
            ticket_id: item.ticket_id,
            sub_client: item.sub_client,
            photo: item.photo,
            location: item.location,
            generate_report_type: item.generate_report_type || 'CONFIDENTIAL BACKGROUND SCREENING REPOR',
            services: updatedServices || [], // Ensure services are passed correctly
        });
        setClientApplicationId(item.id);

        // Log formData (Note: This might not show the updated state immediately due to setState's async nature)
    };
    // console.log('editdata', formData);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingbtn(true); // Start loading when the form is submitted
        // console.log('first -0', branchData);
        const branch_id = branchData?.branch_id;
        const customer_id = branchData?.customer_id;
        const _token = localStorage.getItem("branch_token");

        const validationErrors = {};

        // Perform validation
        if (!formData.fullName) validationErrors.fullName = 'Full name is required.';
        if (!formData.generate_report_type) validationErrors.generate_report_type = 'Report Type Is Required';

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors); // Set errors state to show error messages
            setLoadingbtn(false); // Stop loading if validation fails
            return; // Prevent further execution if validation errors are present
        }

        // Collect all selected service IDs into a comma-separated string
        const selectedServiceIds = services
            .flatMap(group => group.services) // Flatten the services array
            .filter(service => service.isSelected) // Filter to only selected services
            .map(service => service.serviceId) // Extract service IDs
            .join(','); // Join them into a comma-separated string

        const uploadCustomerLogo = async (insertedId, new_application_id) => {
            // console.log('files - - - ', files)
            if (branchData) {
                const { customer_id, id: branch_id } = branchData;
                const branch_token = localStorage.getItem("branch_token");
                const fileCount = Object.keys(files).length;
                // console.log('files - - - ', files, 'count', fileCount)

                const serviceData = JSON.stringify(selectedServiceIds);

                for (const [index, [key, value]] of Object.entries(files).entries()) {
                    const customerLogoFormData = new FormData();
                    customerLogoFormData.append('branch_id', branchData.branch_id);
                    customerLogoFormData.append('_token', branch_token);
                    customerLogoFormData.append('customer_code', customer_id);
                    customerLogoFormData.append('client_application_id', insertedId);
                    if (branchData?.type === "sub_user" && branchData.id) {
                        customerLogoFormData.append('sub_user_id', `${branchData.id}`);
                    }

                    customerLogoFormData.append('upload_category', key);

                    for (const file of value) {
                        customerLogoFormData.append('images', file);
                    }

                    if (fileCount === (index + 1)) {
                        customerLogoFormData.append('send_mail', handleEditClick ? 0 : 1);
                        customerLogoFormData.append('services', serviceData);
                        customerLogoFormData.append('client_application_name', applicantName);
                        customerLogoFormData.append('client_application_generated_id', new_application_id);
                    }

                    try {
                        await axios.post(`http://localhost:5000/branch/client-application/upload`, customerLogoFormData, {
                            headers: {
                                "Content-Type": "multipart/form-data",
                            },
                        });
                    } catch (err) {
                        Swal.fire('Error!', `An error occurred while uploading logo: ${err.message}`, 'error');
                        setLoadingbtn(false); // Stop loading in case of error
                        throw err; // Throw error to stop further execution
                    }
                }
            }
        };

        const fileCount = Object.keys(files).length;
        const validReportTypes = [
            "CONFIDENTIAL BACKGROUND SCREENING REPORT",
            "VENDOR CONFIDENTIAL SCREENING REPORT"
        ];
        // console.log(`formData - `, formData);

        let payload = {
            client_application_id: formData.id,
            branch_id: branchData?.branch_id,
            customer_id,
            _token,
            name: formData.fullName,
            client_spoc_name: formData.client_spoc_name || "",
            employee_id: formData.employeeId,
            spoc: formData.client_spoc_name,
            location: formData.location,
            batch_number: formData.batchNumber,
            sub_client: formData.subClient,
            services: selectedServiceIds,
            package: formData.package,
            gender: formData.gender,
            batch_no: formData.batch_no,
            case_id: formData.case_id,
            check_id: formData.check_id,
            ticket_id: formData.ticket_id,
            sub_client: formData.sub_client,
            photo: formData.photo,
            generate_report_type: validReportTypes.includes(formData.generate_report_type)
                ? formData.generate_report_type
                : "CONFIDENTIAL BACKGROUND SCREENING REPORT",

            location: formData.location,
            send_mail: fileCount === 0 ? 1 : 0,
        };

        // console.log('first -1', branchData);

        if (branchData?.type == "sub_user") {
            payload.sub_user_id = `${branchData.id}`;
        }


        const apiUrl = handleEditClick
            ? "http://localhost:5000/branch/client-application/update"
            : "http://localhost:5000/branch/client-application/create";

        const method = handleEditClick ? "PUT" : "POST";

        try {

            const response = await fetch(apiUrl, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                const data = await response.json();
                let insertedId;
                let new_application_id;

                if (handleEditClick) {
                    setHandleEditClick(null);

                    insertedId = formData.id;
                    new_application_id = formData.applicationId;
                } else {
                    insertedId = data?.result?.results?.insertId || null;
                    new_application_id = data?.result?.new_application_id || null;
                }

                const newToken = data.token || data._token || '';
                if (newToken) {
                    localStorage.setItem("branch_token", newToken);
                }

                const fileCount = Object.keys(files).length;
                // console.log('fileCount', fileCount);

                if (fileCount > 0 && insertedId && new_application_id) {
                    await uploadCustomerLogo(insertedId, new_application_id);
                }

                Swal.fire("Success!", data.message || "Form submission successful!", "success");

                await fetchCustomerInfo();
                await setSpocs();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                if (attachDocsRef.current) attachDocsRef.current.value = '';
                setFiles({});

                setSubmitMessage('Form submitted successfully!');
                setFormData({
                    fullName: '',
                    employeeId: '',
                    location: '',
                    client_spoc_name: '',
                    groupManager: '',
                    package: [],
                    services: '',
                    photo: '',
                    gender: '',
                    batch_no: '',
                    case_id: '',
                    check_id: '',
                    ticket_id: '',
                    sub_client: '',
                    photo: '',
                    location: '',
                    generate_report_type: '',
                });
            } else {
                const errorData = await response.json();
                Swal.fire('Error!', errorData?.message || "An error occurred.", 'error');
                setSubmitMessage(`Error: ${errorData?.message || "An error occurred."}`);
            }

        } catch (error) {
            console.error('Error submitting form:', error);
            setSubmitMessage('Error submitting form.');
        }
        setLoadingbtn(false); // Stop loading after everything is complete
        fetchCustomerInfo();
    };


    const handleDelete = async (id) => {
        // Track loading state per item
        const branch_id = branchData?.branch_id;
        const _token = localStorage.getItem("branch_token");
        const formdata = new FormData();
        const requestOptions = {
            method: "DELETE",
            body: formdata,
            redirect: "follow"
        };

        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to delete this item?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel"
        }).then((result) => {
            if (result.isConfirmed) {
                setLoadingStates((prevState) => ({ ...prevState, [id]: true })); // Set loading for the specific item

                let url;
                if (branchData?.type === "sub_user") {
                    const sub_user_id = branchData?.id ?? null;
                    url = `http://localhost:5000/branch/client-application/delete?id=${id}&branch_id=${branch_id}&_token=${_token}&sub_user_id=${sub_user_id}`;
                } else {
                    url = `http://localhost:5000/branch/client-application/delete?id=${id}&branch_id=${branch_id}&_token=${_token}`;
                }

                fetch(`${url}`, requestOptions)
                    .then((response) => response.json())
                    .then((result) => {
                        const newToken = result.token || result._token || '';
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }
                        setLoadingStates((prevState) => ({ ...prevState, [id]: false })); // Reset loading for the specific item
                        Swal.fire("Deleted!", "The item has been deleted.", "success");
                        fetchCustomerInfo();
                    })
                    .catch((error) => {
                        setLoadingStates((prevState) => ({ ...prevState, [id]: false })); // Reset loading on error
                        console.error(error);
                        Swal.fire("Error", "There was an error deleting the item.", "error");
                    });
            }
        });
    };



    const handleChange = (e) => {
        const { name, value } = e.target;

        // Clear the error for the current field when the user types
        setErrors(prevErrors => ({
            ...prevErrors,
            [name]: '', // Reset error for the current field
        }));

        setFormData(prevFormData => ({
            ...prevFormData,
            [name]: value,
        }));
        setApplicantName(formData.fullName);
    };

    const selectPackageById = (selectedPackageIds, rawServices, sendAll = false) => {
        let showServices;
        if (sendAll) {
            showServices = rawServices;
        } else {
            // Create a new array of groups with filtered services
            showServices = rawServices.map(group => {
                const filteredServices = group.services
                    .filter(service =>
                        service.packages.some(pkg => selectedPackageIds.includes(pkg.name))
                    )
                    .map(service => ({
                        ...service,
                        isSelected: true
                    }));

                return {
                    ...group,
                    services: filteredServices
                };
            });
        }

        setServices(showServices);

        // Log the updated services to verify
        // console.log("HERE - ", services);
    };


    const handlePackageChange = (selectedOptions) => {
        // console.log("handlePackageChange triggered");
        console.log("Selected Options:", selectedOptions);

        const selectedPackageIds = selectedOptions?.map(option => option.value) || [];
        // console.log("Mapped Selected Package IDs:", selectedPackageIds);

        const isSelectAllSelected = selectedPackageIds.includes("select_all");
        const isCurrentlyAllSelected = formData?.package?.includes("select_all");

        if (isSelectAllSelected && !isCurrentlyAllSelected) {
            // console.log('"select_all" selected. Selecting all services...');

            // Select all services
            services.forEach(group => {
                group.services.forEach(service => {
                    service.isSelected = true;
                    // console.log(`Service ${service.name} selected`);
                });
            });

            selectPackageById(selectedPackageIds, rawServices, true);

            const updatedFormData = {
                ...formData,
                package: ["select_all"]
            };
            setFormData(updatedFormData);
            // console.log("FormData updated with select_all");
            return;
        } else if (isSelectAllSelected && isCurrentlyAllSelected) {
            // console.log('"select_all" clicked again. Deselecting all services...');

            selectPackageById(selectedPackageIds, rawServices, true);

            // Deselect all services
            services.forEach(group => {
                group.services.forEach(service => {
                    service.isSelected = false;
                    // console.log(`Service ${service.name} deselected`);
                });
            });

            const updatedFormData = {
                ...formData,
                package: []
            };
            setFormData(updatedFormData);
            // console.log("FormData cleared");
            return;
        }

        if (selectedPackageIds.length === 0) {
            // console.log("No packages selected. Deselecting all services...");

            selectPackageById(selectedPackageIds, rawServices, true);

            services.forEach(group => {
                group.services.forEach(service => {
                    service.isSelected = false;
                    // console.log(`Service ${service.name} deselected`);
                });
            });


            setFormData({ ...formData, package: [] });
            return;
        } else {
            // console.log("Specific packages selected. Matching services...");
            selectPackageById(selectedPackageIds, rawServices);

            const updatedFormData = {
                ...formData,
                package: selectedPackageIds
            };
            setFormData(updatedFormData);
            // console.log("FormData updated with specific packages");
        }

    };




    const handleCheckboxChange = (serviceIndex, groupIndex) => {
        // Create 
        const updatedServices = [...services];

        const service = updatedServices[groupIndex].services[serviceIndex];
        service.isSelected = !service.isSelected;

        // Update the state with the modified services array
        setServices(updatedServices); // Assuming 'setServices' is the function to update state
    };
    const uniquePackages = [
        ...new Set(
            services
                .flatMap(group =>
                    Array.isArray(group.services)
                        ? group.services.flatMap(service =>
                            Array.isArray(service.packages)
                                ? service.packages.map(pkg => ({ id: pkg.id, name: pkg.name }))
                                : []
                        )
                        : []
                )
        )
    ];

    const handleViewMore = (services) => {
        setModalServices(services);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalServices([]);
    };
    // console.log('visibleFeilds', visibleFeilds)
    // console.log('Client Spoc  data is -', clientSpocName);
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
    const filteredData = tableData.filter((item) =>
        (item.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.application_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.employee_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (item.location?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    const totalTablePages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedData = filteredData.slice(
        (tableCurrentPage - 1) * rowsPerPage,
        tableCurrentPage * rowsPerPage

    );
    const handleTablePageChange = (page) => {
        if (page >= 1 && page <= totalTablePages) {
            setTableCurrentPage(page);
        }
    };
    const getOptions = () =>
        Array.from(new Set(uniquePackages.map(pkg => pkg.name)))
            .map(name => ({ label: name, value: name }));

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setTableCurrentPage(1);
    };
    const getValue = () =>
        Array.isArray(formData.package)
            ? formData.package.map(pkg => ({ label: pkg, value: pkg }))
            : [];
    // console.log('myipadress is', ipAddress);

    useEffect(() => {
        if (tableScrollRef.current) {
            setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
    }, [paginatedData, loading]);

    console.log('formData', formData)

    return (
        <div className="bg-[#c1dff2]  border border-black " ref={clientEditRef} id="clientedit">
            <div className="bg-white md:p-12 p-6 w-full mx-auto">
                <form className="space-y-4 w-full pb-16 text-center" onSubmit={handleSubmit}>
                    <div className='md:flex space-x-4'>
                        <div className="md:w-2/5">
                            <div className="w-full">
                                <label htmlFor="organizationName" className="block text-left w-full  m-auto mb-2 text-gray-700">Name of the Organization</label>
                                <input
                                    type="text"
                                    name="organizationName"
                                    placeholder="NAME OF THE ORGANIZATION"
                                    value={formData.organizationName}
                                    readOnly
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border ${errors.organizationName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                />
                                {errors.organizationName && <p className="text-red-500 text-sm">{errors.organizationName}</p>}
                            </div>

                            {/* Full Name */}
                            <div className="w-full">
                                <label htmlFor="fullName" className="block text-left w-full  m-auto mb-2 text-gray-700">{formData.generate_report_type && formData.generate_report_type.toLowerCase() == "vendor confidential screening report" ? "Full Name of Organization" : "Full Name of the Applicant"}<span className="text-red-500 text-xl" >*</span></label>
                                <input
                                    type="text"
                                    name="fullName"
                                    placeholder="FULL NAME OF THE APPLICANT"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className={`w-full m-auto p-3 mb-[20px] border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                />
                                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
                            </div>
                            <div className="mb-4">
                                <label className="block text-left w-full  m-auto mb-2 text-gray-700" htmlFor="report status">Generate Report Type:<span className="text-red-500 text-xl" >*</span></label>
                                <select name="generate_report_type" id=""
                                    value={formData.generate_report_type || 'CONFIDENTIAL BACKGROUND SCREENING REPORT'}
                                    onChange={handleChange}
                                    className="border rounded-md p-2 mt-2 uppercase w-full">
                                    <option value="CONFIDENTIAL BACKGROUND SCREENING REPORT">
                                        CONFIDENTIAL BACKGROUND SCREENING REPORT
                                    </option>
                                    <option value="VENDOR CONFIDENTIAL SCREENING REPORT">
                                        VENDOR CONFIDENTIAL SCREENING REPORT
                                    </option>
                                </select>
                                {errors.generate_report_type && <p className="text-red-500 text-sm">{errors.generate_report_type}</p>}

                            </div>
                            <div className="w-full">
                                <label htmlFor="attach_documents" className="block text-left w-full m-auto mb-2 text-gray-700">Attach documents</label>
                                <input
                                    type="file"
                                    name="attach_documents"
                                    multiple
                                    ref={attachDocsRef}
                                    onChange={(e) => handleFileChange('attach_documents', e)}
                                    className={`w-full m-auto p-3 mb-[20px] border border-gray-300  rounded-md`}
                                />

                                {errors.attach_documents && <p className="text-red-500 text-sm">{errors.attach_documents}</p>}
                            </div>
                            {
                                visibleFeilds.includes("photo") && (

                                    <div className="w-full">
                                        <label htmlFor="photo" className="block text-left w-full  m-auto mb-2 text-gray-700">Upload Photo (Optional)</label>
                                        <input
                                            type="file"
                                            name="photo"
                                            ref={fileInputRef}
                                            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                                            onChange={(e) => {
                                                const file = e.target.files[0];

                                                if (file) {
                                                    const allowedTypes = [
                                                        "image/png",
                                                        "image/jpeg",
                                                        "image/jpg",
                                                        "image/webp",
                                                        "image/gif"
                                                    ];

                                                    if (!allowedTypes.includes(file.type)) {
                                                        setErrors(prev => ({
                                                            ...prev,
                                                            photo: "Only PNG, JPG, JPEG, WEBP, or GIF images are allowed",
                                                        }));
                                                        e.target.value = ""; // reset input
                                                        return;
                                                    }

                                                    setErrors(prev => ({ ...prev, photo: "" }));
                                                }

                                                handleFileChange("photo", e); // now safe to call
                                            }}
                                            className={`w-full m-auto p-3 mb-[20px] border ${errors.photo ? "border-red-500" : "border-gray-300"
                                                } rounded-md`}
                                        />

                                        {errors.photo && <p className="text-red-500 text-sm">{errors.photo}</p>}
                                    </div>
                                )
                            }
                            {
                                visibleFeilds.includes("employeeId") &&
                                (!formData.generate_report_type ||
                                    formData.generate_report_type.toLowerCase() !== "vendor confidential screening report") && (
                                    <div className="w-full">
                                        <label htmlFor="employeeId" className="block text-left w-full m-auto mb-2 text-gray-700">
                                            Employee ID  (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="employeeId"
                                            placeholder="EMPLOYEE ID"
                                            value={formData.employeeId || ""}
                                            onChange={handleChange}
                                            className={`w-full m-auto p-3 mb-[20px] border ${errors.employeeId ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                        />
                                        {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
                                    </div>
                                )
                            }

                            {
                                visibleFeilds.includes("location") && (
                                    <div className="w-full">
                                        <label htmlFor="location" className="block text-left w-full  m-auto mb-2 text-gray-700">Location (Optional)</label>
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="LOCATION"
                                            value={formData.location}
                                            onChange={handleChange}
                                            className={`w-full m-auto p-3 mb-[20px] border ${errors.location ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                        />
                                        {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
                                    </div>
                                )
                            }
                            <div className="w-full">
                                <label htmlFor="client_spoc_name" className="block text-left w-full m-auto mb-2 text-gray-700">NAME OF THE SPOC CASE UPLOADED:(Optional)</label>
                                <select
                                    name="client_spoc_name"
                                    onChange={handleChange}
                                    value={formData.client_spoc_name || ""} // Ensure it's an empty string if undefined
                                    className={`w-full m-auto uppercase p-3 mb-[20px] border ${errors.client_spoc_name ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                                >
                                    <option value="">
                                        Choose Any Client Spoc
                                    </option>
                                    <option value="Client Spoc">
                                        Client Spoc
                                    </option>
                                    <option value="Screeningtar Spoc">
                                        Screeningtar Spoc
                                    </option>
                                </select>


                                {errors.client_spoc_name && <p className="text-red-500 text-sm">{errors.client_spoc_name}</p>}
                            </div>
                            {visibleFeilds.includes("gender") && (
                                <div className="mb-4">
                                    <label htmlFor="gender" className='block uppercase text-left w-full m-auto mb-2 text-gray-700'>Gender (Optional)</label>
                                    <select
                                        name="gender"
                                        id="gender"
                                        onChange={handleChange}
                                        className="border border-gray-300 uppercase w-full rounded-md p-3 mt-2"
                                        value={formData.gender || ''}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Transgender">Trans Gender</option>
                                    </select>
                                </div>
                            )}
                            {
                                visibleFeilds.includes("batch_no") && (
                                    <div className="mb-4">
                                        <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="batch_no">
                                            Batch No (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="batch_no"
                                            value={formData.batch_no}
                                            id="batch_no"
                                            className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                            placeholder="Batch No"
                                            onChange={handleChange}
                                        />
                                    </div>
                                )
                            }
                            {
                                visibleFeilds.includes("case_id") && (
                                    <div className="mb-4">
                                        <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="case_id">
                                            Case ID (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="case_id"
                                            value={formData.case_id}

                                            id="case_id"
                                            className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                            placeholder="Case ID"
                                            onChange={handleChange}
                                        />
                                    </div>
                                )
                            }
                            {
                                visibleFeilds.includes("check_id") && (
                                    <div className="mb-4">
                                        <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="check_id">
                                            Check ID (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.check_id}
                                            name="check_id"
                                            id="check_id"
                                            className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                            placeholder="Check ID"
                                            onChange={handleChange}
                                        />
                                    </div>
                                )
                            }
                            {
                                visibleFeilds.includes("ticket_id") && (
                                    <div className="mb-4">
                                        <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="ticket_id">
                                            Ticket ID (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="ticket_id"
                                            value={formData.ticket_id}
                                            id="ticket_id"
                                            className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                            placeholder="Ticket ID"
                                            onChange={handleChange}
                                        />
                                    </div>
                                )
                            }
                            {
                                visibleFeilds.includes("sub_client") && (
                                    <div className="mb-4">
                                        <label className="block text-left w-full m-auto mb-2 text-gray-700" htmlFor="sub_client">
                                            Sub Client (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            name="sub_client"
                                            value={formData.sub_client}
                                            id="sub_client"
                                            className="border border-gray-300 w-full rounded-md p-3 mt-2 capitalize"
                                            placeholder="Sub Client"
                                            onChange={handleChange}
                                        />
                                    </div>
                                )
                            }

                            <div className='flex justify-center gap-5 items-center'>
                                <div>
                                    <button
                                        type="submit"
                                        disabled={loadingbtn}
                                        className={`p-6 py-3 bg-[#2c81ba] hover:scale-105   transition duration-200  text-white font-bold rounded-md hover:bg-[#0f5381] ${loadingbtn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        Submit
                                    </button>
                                </div>
                                {handleEditClick && (
                                    <div className='flex items-center gap-7'>
                                        <button
                                            onClick={() => {
                                                setHandleEditClick(null);
                                                setFormData({
                                                    fullName: '',
                                                    employeeId: '',
                                                    location: '',
                                                    client_spoc_name: '',
                                                    groupManager: '',
                                                    package: [],
                                                    services: '',
                                                    photo: '',
                                                    gender: '',
                                                    batch_no: '',
                                                    case_id: '',
                                                    check_id: '',
                                                    ticket_id: '',
                                                    sub_client: '',
                                                    photo: '',
                                                    location: '',
                                                    generate_report_type: '',

                                                });
                                                fetchCustomerInfo();
                                                setSpocs();
                                            }}

                                            disabled={loadingbtn}
                                            className={`p-6 py-3 bg-red-500 hover:scale-105 transition duration-200  text-white font-bold rounded-md hover:bg-red-600 ${loadingbtn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                                {!handleEditClick && (
                                    <div className='flex items-center gap-7'>
                                        <div className=''>
                                            <h3 className='text-xl font-bold'>OR</h3>
                                        </div>
                                        <button
                                            onClick={() => navigate('/user-ClientBulkUpload')}

                                            disabled={loadingbtn}
                                            className={`p-6 py-3 bg-[#2c81ba] hover:scale-105 transition duration-200  text-white font-bold rounded-md hover:bg-[#0f5381] ${loadingbtn ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            Bulk Upload
                                        </button>
                                    </div>
                                )}

                            </div>

                        </div>
                        <div className="md:w-3/5 margin-l">

                            <div className="space-y-4 m-auto w-full bg-white rounded-md">
                                <CustomMultiSelect
                                    options={Array.from(new Set(uniquePackages.map(pkg => pkg.name)))
                                        .map(name => ({ label: name, value: name }))
                                    }
                                    value={Array.isArray(formData.package) ? formData.package.map(pkg => ({ label: pkg, value: pkg })) : []}

                                    onChange={handlePackageChange}
                                    placeholder="SELECT SERVICES"
                                />


                            </div>
                            <div className='p-2.5 overflow-x-auto'>
                                <table className="m-auto w-full  border-collapse border border-black rounded-lg">
                                    <thead>
                                        <tr className="bg-[#c1dff2] text-[#4d606b]">
                                            <th className=" uppercase border border-black  px-4 py-2">SERVICE</th>
                                            <th className=" uppercase border border-black px-4 text-left py-2">SERVICE NAMES</th>
                                        </tr>
                                    </thead>


                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="py-4 text-center border border-black text-gray-500">
                                                    <Loader className="text-center" />
                                                </td>
                                            </tr>
                                        ) : currentServices.length > 0 ? (
                                            currentServices.map((service) => (
                                                <tr className="text-center whitespace-nowrap" key={service.serviceId}>
                                                    <td className="border border-black  px-4 py-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={service.isSelected || false}
                                                            className="w-6 h-6"
                                                            name="services[]"
                                                            onChange={() =>
                                                                handleCheckboxChange(service.index, service.groupIndex)
                                                            }
                                                        />
                                                    </td>

                                                    <td className="border px-4 border-black text-left py-2">
                                                        {service.serviceTitle}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-4 text-center border-black border text-gray-500">
                                                    No Services Available
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>


                                </table>
                            </div>
                            <div className="flex justify-center mt-4 space-x-2">
                                <button
                                    type='button'
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>

                                {(() => {
                                    const maxPagesToShow = 3; // Maximum page numbers to display
                                    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                                    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                                    // Adjust if we are close to the beginning or end
                                    if (endPage - startPage + 1 < maxPagesToShow) {
                                        startPage = Math.max(1, endPage - maxPagesToShow + 1);
                                    }

                                    const pages = [];
                                    if (startPage > 1) {
                                        pages.push(
                                            <button
                                                type='button'
                                                key={1}
                                                onClick={() => handlePageChange(1)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                1
                                            </button>
                                        );
                                        if (startPage > 2) {
                                            pages.push(<span key="start-ellipsis">...</span>);
                                        }
                                    }

                                    for (let page = startPage; page <= endPage; page++) {
                                        pages.push(
                                            <button
                                                type='button'
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`px-4 py-2 ${currentPage === page
                                                    ? "bg-[#2c81ba] text-white"
                                                    : "bg-gray-200"
                                                    } rounded`}
                                            >
                                                {page}
                                            </button>
                                        );
                                    }

                                    if (endPage < totalPages) {
                                        if (endPage < totalPages - 1) {
                                            pages.push(<span key="end-ellipsis">...</span>);
                                        }
                                        pages.push(
                                            <button
                                                type='button'
                                                key={totalPages}
                                                onClick={() => handlePageChange(totalPages)}
                                                className="px-4 py-2 bg-gray-200 rounded"
                                            >
                                                {totalPages}
                                            </button>
                                        );
                                    }

                                    return pages;
                                })()}

                                <button
                                    type='button'
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>

                        </div>
                    </div>
                </form>
                <div className="w-full">
                    <div className="block pt-16 border-t-2 mb-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="px-4 md:w-auto w-full py-2 border rounded-md"
                            />
                        </div>
                        <select
                            value={rowsPerPage}
                            onChange={(e) => {
                                setRowsPerPage(Number(e.target.value));
                                setTableCurrentPage(1);
                            }}
                            className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-2  shadow-sm focus:ring-2 focus:ring-blue-400"
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

                            <table className="m-auto w-full border-collapse border border-black rounded-lg">
                                <thead>
                                    <tr className="bg-[#c1dff2] text-[#4d606b] whitespace-nowrap">
                                        <th className=" uppercase border border-black px-4 py-2">Sl No.</th>
                                        <th className=" uppercase border border-black px-4 py-2">Photo</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Name Of The Applicant</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Generate Report Type</th>
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Application Id</th>
                                        {isExist.employeIdExist && (
                                            <th className="uppercase border border-black px-4 py-2 text-left">Employe Id</th>
                                        )}
                                        {isExist.locationExist && (
                                            <th className="uppercase border border-black px-4 py-2 text-left">Location</th>
                                        )}
                                        <th className=" uppercase border border-black px-4 py-2 text-left">Service</th>
                                        <th className=" uppercase border border-black px-4 py-2">Edit</th>
                                        <th className=" uppercase border border-black px-4 py-2">Delete</th>

                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (

                                        <tr>
                                            <td colSpan={100} className="py-4 text-center text-gray-500">
                                                <Loader className="text-center" />
                                            </td>
                                        </tr>
                                    ) : paginatedData.length == 0 ? (

                                        <tr>
                                            <td colSpan={100} className="py-4 text-center text-gray-500">
                                                No data available
                                            </td>
                                        </tr>
                                    ) : (
                                        <>
                                            {
                                                paginatedData.map((item, index) => (
                                                    <tr key={item.id} className="text-center">
                                                        <td className="border border-black px-4 py-2">
                                                            {index + 1 + (tableCurrentPage - 1) * rowsPerPage}
                                                        </td>
                                                        <td className="border border-black px-4 text-center py-2">
                                                            <div className='flex justify-center'>
                                                                <img src={item.photo ? item.photo : `${Default}`} alt="Photo" className="h-10 w-10 object-cover" />
                                                            </div>
                                                        </td>
                                                        <td className="border border-black px-4 py-2 text-left">{item.name}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{item.generate_report_type}</td>
                                                        <td className="border border-black px-4 py-2 text-left">{item.application_id}</td>
                                                        {isExist.employeIdExist && (
                                                            <td className="border border-black px-4 py-2 text-left">{item.employee_id || "null"}</td>
                                                        )}
                                                        {isExist.locationExist && (
                                                            <td className="border border-black px-4 py-2 text-left ">{item.location}</td>
                                                        )}
                                                        <td className="border border-black px-4 py-2  text-left">
                                                            <div className='flex whitespace-nowrap'>
                                                                {Array.isArray(item.serviceNames) && item.serviceNames.length > 0 ? (
                                                                    item.serviceNames.length === 1 ? (
                                                                        // Single service
                                                                        <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
                                                                            {typeof item.serviceNames[0] === "string"
                                                                                ? item.serviceNames[0]
                                                                                : item.serviceNames[0].join(", ")}
                                                                        </span>
                                                                    ) : (
                                                                        // Multiple services
                                                                        <>
                                                                            {typeof item.serviceNames[0] === "string" ? (
                                                                                <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
                                                                                    {item.serviceNames[0]}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
                                                                                    {item.serviceNames[0].join(", ")}
                                                                                </span>
                                                                            )}
                                                                            <button
                                                                                className="text-blue-500 ml-2"
                                                                                onClick={() => handleViewMore(item.serviceNames)}
                                                                            >
                                                                                View More
                                                                            </button>
                                                                        </>
                                                                    )
                                                                ) : (
                                                                    // No services or serviceNames is not an array
                                                                    <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                                                        You have no services
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="border  border-black px-4 py-2">
                                                            <button
                                                                className="bg-green-500 hover:scale-105 transition duration-200  text-white px-4 py-2 rounded-md"
                                                                onClick={() => handleEdit(item)}
                                                            >
                                                                Edit
                                                            </button>
                                                        </td>
                                                        <td className="border  border-black px-4 py-2">
                                                            <button
                                                                className={`bg-red-500 hover:scale-105 transition duration-200 text-white px-4 py-2 rounded-md 
        ${loadingStates[item.id] ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                                                                onClick={() => handleDelete(item.id)}
                                                                disabled={loadingStates[item.id]} // Disable button when loading
                                                            >
                                                                {loadingStates[item.id] ? 'Deleting...' : 'Delete'}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            }
                                        </>
                                    )}
                                </tbody>
                            </table>

                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <button
                            onClick={() => handleTablePageChange(tableCurrentPage - 1)}
                            disabled={tableCurrentPage === 1}
                            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
                        >
                            Previous
                        </button>
                        <span className="text-gray-700">
                            Page {tableCurrentPage} of {totalTablePages}
                        </span>
                        <button
                            onClick={() => handleTablePageChange(tableCurrentPage + 1)}
                            disabled={tableCurrentPage === totalTablePages}
                            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
                        >
                            Next
                        </button>
                    </div>
                </div>
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black no-margin bg-opacity-50 flex items-center justify-center z-999">
                        <div className="bg-white rounded-lg shadow-lg p-4 md:mx-0 mx-4 md:w-1/3">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-bold">Services</h2>
                                <button
                                    className="text-red-500 text-2xl"
                                    onClick={handleCloseModal}
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 w-full m-auto max-h-96 overflow-y-scroll">
                                {modalServices.length > 0 ? (
                                    modalServices.map((service, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-blue-100 border max-h-max  border-blue-500 rounded-lg text-sm"
                                        >
                                            {service}
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
    );
};

export default ClientManager;
