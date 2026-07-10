import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import { MultiSelect } from "react-multi-select-component";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import { useApiLoadingBranch } from '../BranchApiLoadingContext';
import Default from "../../imgs/default.png"

const CLientTrashed = () => {
    const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
    const [visibleFeilds, setVisibleFeilds] = useState([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [tableCurrentPage, setTableCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const optionsPerPage = [10, 50, 100, 200,500,1000];
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

    const [isExist, setIsExist] = useState([])
    const [errors, setErrors] = useState({});
    const [submitMessage, setSubmitMessage] = useState('');
    const [spocName, setSpocName] = useState('');
    const [spocID, setSpocID] = useState('');
    const [spocs, setSpocs] = useState([]);
    const [services, setServices] = useState([]);
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
        const url = `https://api.screeningstar.co.in/branch/trashed/client-application/listings?customer_id=${customer_id}&branch_id=${branchInfo.branch_id}&_token=${branch_token}`;

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
                const customerInfo = result.data.clientApplications;
                const services = customerInfo.services ? JSON.parse(customerInfo.services) : [];
                setServices(services);
                setFormData(prevFormData => ({
                    ...prevFormData,
                    organizationName: customerInfo.name || '',
                }));
                setSpocs(customerInfo?.client_spoc_name || []);
                setOrganisationName(customerInfo.name);
                const spocDetails = result.data.clientApplications?.map(spoc => ({
                    id: spoc.id,
                    name: spoc.name,
                }));
                const spocDetailss = result.data.clientApplications?.map(spoc => ({
                    employeIdExist: spoc.employee_id,
                    locationExist: spoc.location,
                }));

                console.log('spocDetailss', spocDetailss);

                const isExist = {
                    employeIdExist: spocDetailss.some(spoc => spoc.employeIdExist && spoc.employeIdExist.trim() !== ""),
                    locationExist: spocDetailss.some(spoc => spoc.locationExist && spoc.locationExist.trim() !== "")
                };

                setIsExist(isExist);

                console.log("isExist", isExist);

                setClientSpocName(spocDetails || []);
                setSpocName(result.data.clientApplications.id);
                const visiblefeilds = JSON.parse(customerInfo.visible_fields);
                setVisibleFeilds(visiblefeilds);
            } else {
                console.log('Error fetching data:', response.statusText);
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

    console.log('isExist', isExist);

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
                console.log(`Trimmed Service: "${trimmedService}", Parsed Number: ${serviceNumber}`);
                return serviceNumber; // Return the converted number
            });

        // Log the final array of selected service IDs
        console.log("selectedServices -", selectedServices);

        // Map over services and set isSelected based on selectedServices array
        const updatedServices = services.map(group => {
            console.log(`Processing group: ${group.group_title} (ID: ${group.group_id})`);

            return {
                ...group, // Keep the existing properties of the group
                services: group.services.map(service => {
                    console.log(`Processing service: ${service.serviceTitle} (ID: ${service.serviceId})`);

                    // Check if the serviceId is in selectedServices array
                    const isSelected = selectedServices.includes(service.serviceId);
                    console.log(`Is service ${service.serviceTitle} selected? ${isSelected}`);

                    // Return the updated service object with isSelected property
                    return {
                        ...service, // Keep the existing properties of the service
                        isSelected: isSelected // Mark as selected or not based on condition
                    };
                })
            };
        });

        // Log the final updated services array
        console.log("Updated Services: ", updatedServices);
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
            services: updatedServices || [], // Ensure services are passed correctly
        });
        setClientApplicationId(item.id);

        // Log formData (Note: This might not show the updated state immediately due to setState's async nature)
    };
    console.log('editdata', formData);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoadingbtn(true); // Start loading when the form is submitted
        console.log('first -0', branchData);
        const branch_id = branchData?.branch_id;
        const customer_id = branchData?.customer_id;
        const _token = localStorage.getItem("branch_token");

        const validationErrors = {};

        // Perform validation
        if (!formData.fullName) validationErrors.fullName = 'Full name is required.';

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
            console.log('files - - - ', files)
            if (branchData) {
                const { customer_id, id: branch_id } = branchData;
                const branch_token = localStorage.getItem("branch_token");
                const fileCount = Object.keys(files).length;
                console.log('files - - - ', files, 'count', fileCount)

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

                    for (const file of value) {
                        customerLogoFormData.append('images', file);
                        customerLogoFormData.append('upload_category', key);
                    }

                    if (fileCount === (index + 1)) {
                        customerLogoFormData.append('send_mail', handleEditClick ? 0 : 1);
                        customerLogoFormData.append('services', serviceData);
                        customerLogoFormData.append('client_application_name', applicantName);
                        customerLogoFormData.append('client_application_generated_id', new_application_id);
                    }

                    try {
                        await axios.post(`https://api.screeningstar.co.in/branch/client-application/upload`, customerLogoFormData, {
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

        console.log(`formData - `, formData);

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
            photo: formData.photo, // Ensure photo is passed for update
            services: selectedServiceIds,
            package: formData.package,
            gender: formData.gender,
            batch_no: formData.batch_no,
            case_id: formData.case_id,
            check_id: formData.check_id,
            ticket_id: formData.ticket_id,
            sub_client: formData.sub_client,
            photo: formData.photo,
            location: formData.location,
            send_mail: fileCount === 0 ? 1 : 0,
        };

        console.log('first -1', branchData);

        if (branchData?.type == "sub_user") {
            payload.sub_user_id = `${branchData.id}`;
        }


        const apiUrl = handleEditClick
            ? "https://api.screeningstar.co.in/branch/client-application/update"
            : "https://api.screeningstar.co.in/branch/client-application/create";

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
                console.log('fileCount', fileCount);

                if (fileCount > 0 && insertedId && new_application_id) {
                    await uploadCustomerLogo(insertedId, new_application_id);
                }

                Swal.fire("Success!", data.message || "Form submission successful!", "success");

                await fetchCustomerInfo();
                await setSpocs();
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
                    url = `https://api.screeningstar.co.in/branch/trashed/client-application/delete?id=${id}&branch_id=${branch_id}&_token=${_token}&sub_user_id=${sub_user_id}`;
                } else {
                    url = `https://api.screeningstar.co.in/branch/trashed/client-application/delete?id=${id}&branch_id=${branch_id}&_token=${_token}`;
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
    const handleRestore = async (id) => {
        const branch_id = branchData?.branch_id;
        const _token = localStorage.getItem("branch_token");
        const formdata = new FormData();
        const requestOptions = {
            method: "PUT",
            body: formdata,
            redirect: "follow"
        };

        Swal.fire({
            title: "Are you sure?",
            text: "Do you really want to Restore this item?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, Restore it!",
            cancelButtonText: "Cancel"
        }).then((result) => {
            if (result.isConfirmed) {
                setLoadingStates((prevState) => ({ ...prevState, [id]: true })); // Set loading for the specific item

                let url;
                if (branchData?.type === "sub_user") {
                    const sub_user_id = branchData?.id ?? null;
                    url = `https://api.screeningstar.co.in/branch/trashed/client-application/restore?id=${id}&branch_id=${branch_id}&_token=${_token}&sub_user_id=${sub_user_id}`;
                } else {
                    url = `https://api.screeningstar.co.in/branch/trashed/client-application/restore?id=${id}&branch_id=${branch_id}&_token=${_token}`;
                }

                fetch(`${url}`, requestOptions)
                    .then((response) => response.json())
                    .then((result) => {
                        const newToken = result.token || result._token || '';
                        if (newToken) {
                            localStorage.setItem("_token", newToken);
                        }
                        setLoadingStates((prevState) => ({ ...prevState, [id]: false })); // Reset loading for the specific item
                        Swal.fire("Restored!", "The item has been deleted.", "success");
                        fetchCustomerInfo();
                    })
                    .catch((error) => {
                        setLoadingStates((prevState) => ({ ...prevState, [id]: false })); // Reset loading on error
                        console.error(error);
                        Swal.fire("Error", "There was an error Restoring the item.", "error");
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


    const selectPackageById = (selectedPackageIds) => {
        // Iterate over the services and update isSelected based on selected package IDs
        services.forEach(group => {
            group.services.forEach(service => {
                // Check if any package within the service matches the selected package ID
                const matchingPackage = service.packages.some(pkg => selectedPackageIds.includes(pkg.name));

                // Update the service's isSelected based on whether any package matches
                service.isSelected = matchingPackage;
            });
        });

        // Optional: Log the updated services to verify
        console.log(services);
    };

    const handlePackageChange = (selectedOptions) => {
        const selectedPackageIds = selectedOptions.map(option => option.value); // Get selected package IDs

        if (selectedPackageIds.length === 0) {
            // If no packages are selected, deselect all services
            services.forEach(group => {
                group.services.forEach(service => {
                    service.isSelected = false;
                });
            });
            console.log("All services have been deselected");
        } else {
            // Otherwise, select services that match the selected package IDs
            selectPackageById(selectedPackageIds);
            console.log(`Selected Package IDs: `, selectedPackageIds);
        }

        // Update the form data with the selected package IDs
        setFormData({
            ...formData,
            package: selectedPackageIds
        });
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
    console.log('visibleFeilds', visibleFeilds)
    // console.log('Client Spoc  data is -', clientSpocName);
    const Loader = () => (
        <div className="flex w-full justify-center items-center h-20">
            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
        </div>
    );
  const filteredData = tableData.filter((item) =>
  (item.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (item.application_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (item.employee_id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
  (item.location || "").toLowerCase().includes(searchTerm.toLowerCase())
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
    
              useEffect(() => {
        if (tableScrollRef.current) {
          setScrollWidth(tableScrollRef.current.scrollWidth + "px");
        }
      }, [paginatedData, loading]); 

    console.log('myipadress is', ipAddress);
    return (
        <div className="bg-[#c1dff2]  border border-black " ref={clientEditRef} id="clientedit">
            <div className="bg-white md:p-12 p-6 w-full mx-auto">

                <div className="w-full">
                    <div className="block mb-4">
                        <div>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <th className=" uppercase border border-black px-4 py-2 text-left">Application Id</th>
                                    {isExist.employeIdExist && (
                                        <th className="uppercase border border-black px-4 py-2 text-left">Employe Id</th>
                                    )}
                                    {isExist.locationExist && (
                                        <th className="uppercase border border-black px-4 py-2 text-left">Location</th>
                                    )}
                                    <th className=" uppercase border border-black px-4 py-2 text-left">Service</th>
                                    {/* <th className=" uppercase border border-black px-4 py-2">Edit</th> */}
                                    <th className=" uppercase border border-black px-4 py-2" colSpan={2}>Action</th>

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
                                        {console.log(`tableData - `, tableData)}
                                        {paginatedData.map((item, index) => (
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
                                                        className={`bg-red-500 hover:scale-105 transition duration-200 text-white px-4 py-2 rounded-md 
        ${loadingStates[item.id] ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={loadingStates[item.id]} // Disable button when loading
                                                    >
                                                        {loadingStates[item.id] ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                  
                                                </td>
                                                <td className="border  border-black px-4 py-2">
                                                <button
                                                        className={`bg-green-500 hover:scale-105 transition duration-200 text-white px-4 py-2 rounded-md 
        ${loadingStates[item.id] ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}
                                                        onClick={() => handleRestore(item.id)}
                                                        disabled={loadingStates[item.id]} // Disable button when loading
                                                    >
                                                        {loadingStates[item.id] ? 'Restoring...' : 'Restore'}
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

export default CLientTrashed;