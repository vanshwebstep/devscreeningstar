import React, { useState, useRef, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx'; // Ensure you have xlsx installed
import axios from 'axios';
import swal from 'sweetalert';
import { useNavigate } from "react-router-dom";
import { useApiLoadingBranch } from '../BranchApiLoadingContext';
import CustomMultiSelect from './CustomMultiselect';


const CandidateManager = () => {
  const navigate = useNavigate();
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
  const [searchTerm, setSearchTerm] = useState("");
  const [tableCurrentPage, setTableCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000]; const [loadingStates, setLoadingStates] = useState({});
  const clientEditRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;
  const storedToken = localStorage.getItem('token');
  const [branchData, setBranchData] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState('');
  const [spocID, setSpocID] = useState('');
  const [spocName, setSpocName] = useState('');
  const [spocNamee, setSpocNamee] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [organisationName, setOrganisationName] = useState('');
  const [handleEditClick, setHandleEditClick] = useState('');
  const [ApplicationId, setCandidateApplicationId] = useState('');
  const [formData, setFormData] = useState({

  })
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

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalServices, setModalServices] = React.useState([]);

  const allServices = services
    .filter(group => group?.services) // Filter out undefined groups or groups without services
    .flatMap((group, groupIndex) =>
      group.services.map((service, serviceIndex) => ({
        ...service,
        groupSymbol: group.group_symbol || group.group_title,
        index: serviceIndex,
        groupIndex,
      }))
    );


  // Calculate total pages
  const totalEntries = allServices.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);

  // Get current page services
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentServices = allServices.slice(startIndex, startIndex + entriesPerPage);

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

  const fetchCustomerInfo = useCallback(async () => {
    const branchData = JSON.parse(localStorage.getItem("branch"));
    setApiLoadingBranch(true);
    setLoading(true);
    const { customer_id, id: branch_id } = branchData;
    const branch_token = localStorage.getItem("branch_token");
    const url = `https://api.screeningstar.co.in/branch/candidate-application/listings?customer_id=${customer_id}&branch_id=${branchData?.branch_id}&_token=${branch_token}`;

    try {
      let response;
      if (branchData?.type === "sub_user") {
        const sub_user_id = branchData?.id ?? null;
        response = await fetch(`${url}&sub_user_id=${sub_user_id}`);
      } else {
        response = await fetch(url);
      }
      if (response.ok) {
        setLoading(false);
        setApiLoadingBranch(false);
        const result = await response.json();
        const newToken = result.token || result._token || '';
        if (newToken) {
          localStorage.setItem("branch_token", newToken);
        }

        setTableData(result.data.candidateApplications);
        const customerInfo = result.data.customer;
        const services = customerInfo.services ? JSON.parse(customerInfo.services) : [];
        setServices(services);
        setFormData(prevFormData => ({
          ...prevFormData,
          organizationName: customerInfo.name || '',
        }));

        setOrganisationName(customerInfo.name);
        const spocDetails = result.data.customer.spoc_details?.map(spoc => ({
          id: spoc.id,
          name: spoc.name,
        }));

        setSpocID(result.data.customer.spoc_details[0].id);
        setSpocName(result.data.customer.spoc_details[0].name);
      } else {
        setApiLoadingBranch(false);
        setLoading(false);
        console.log('Error fetching data:', response.statusText);
      }
    } catch (error) {
      setApiLoadingBranch(false);
      setLoading(false);
      console.error('Error fetching data:', error);
    }
    setApiLoadingBranch(false);
    setLoading(false);
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
        const serviceNumber = parseInt(trimmedService, 10);
        return serviceNumber;
      });


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

    setServices(updatedServices);
    setFormData({
      id: item.id,
      organizationName: organisationName,
      fullName: item.name || '',
      mobile_number: item.mobile_number || '',
      email: item.email || '',
      employeeId: item.employee_id || '',
      applicationId: item.application_id || '',
      services: updatedServices || [],
    });
    setCandidateApplicationId(item.id);

    // Log formData (Note: This might not show the updated state immediately due to setState's async nature)
    console.log('editdata (after setFormData):', setFormData);
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validationErrors = {};

    // Client-side validation
    if (!formData.organizationName) validationErrors.organizationName = 'Organization name is required.';
    if (!formData.fullName) validationErrors.fullName = 'Full name is required.';
    if (!formData.mobile_number) validationErrors.mobile_number = 'Mobile Number is required.';
    if (!formData.email) {
      validationErrors.email = 'Email is required.';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      validationErrors.email = 'Enter a valid email address.';
    }

    // If validation errors exist, set them and prevent submission
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors); // Display validation errors
      setLoading(false);
      return;
    }

    // Clear previous errors if validation passes
    setErrors({});

    // Prepare payload
    const selectedServiceIds = services
      .flatMap(group => group.services)
      .filter(service => service.isSelected)
      .map(service => service.serviceId)
      .join(',');

    const packageString = Array.isArray(formData.package) ? formData.package.join(',') : formData.package;
    const payload = {
      candidate_application_id: formData.id,
      branch_id: branchData?.branch_id,
      customer_id: branchData?.customer_id,
      _token: localStorage.getItem("branch_token"),
      name: formData.fullName,
      email: formData.email,
      mobile_number: formData.mobile_number,
      employee_id: formData.employeeId,
      services: selectedServiceIds,
      package: packageString,
      ...(branchData?.type === "sub_user" && { sub_user_id: branchData.id }),
    };

    const apiUrl = handleEditClick
      ? "https://api.screeningstar.co.in/branch/candidate-application/update"
      : "https://api.screeningstar.co.in/branch/candidate-application/create";

    try {
      const response = await fetch(apiUrl, {
        method: handleEditClick ? "PUT" : "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setLoading(false);
        Swal.fire({
          title: "Success!",
          text: handleEditClick ? data.message || "Online Background Verification Form updated sucessfully!" : "Online Background Verification Form generated sucessfully",
          icon: "success"
        });
        setHandleEditClick(null);
        setFormData({
          fullName: '',
          employeeId: '',
          mobile_number: '',
          email: '',
          package: [],
          services: '',
          photo: '',
        });
        fetchCustomerInfo();
        setSubmitMessage('Online Background Verification Form generated sucessfully');
      } else {
        // Handle API errors
        setErrors({ api: data.message || "An error occurred during submission." });
        Swal.fire("Error!", data.message || "An error occurred.", "error");
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setErrors({ api: 'An unexpected error occurred. Please try again later.' });
      Swal.fire("Error!", "An unexpected error occurred.", "error");
    } finally {
      setLoading(false);
    }
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
    console.log("handlePackageChange triggered");
    console.log("Selected Options:", selectedOptions);

    const selectedPackageIds = selectedOptions?.map(option => option.value) || [];
    console.log("Mapped Selected Package IDs:", selectedPackageIds);

    const isSelectAllSelected = selectedPackageIds.includes("select_all");
    const isCurrentlyAllSelected = formData?.package?.includes("select_all");

    if (isSelectAllSelected && !isCurrentlyAllSelected) {
      console.log('"select_all" selected. Selecting all services...');

      // Select all services
      services.forEach(group => {
        group.services.forEach(service => {
          service.isSelected = true;
          console.log(`Service ${service.name} selected`);
        });
      });

      const updatedFormData = {
        ...formData,
        package: ["select_all"]
      };
      setFormData(updatedFormData);
      console.log("FormData updated with select_all");
      return;
    }

    if (isSelectAllSelected && isCurrentlyAllSelected) {
      console.log('"select_all" clicked again. Deselecting all services...');

      // Deselect all services
      services.forEach(group => {
        group.services.forEach(service => {
          service.isSelected = false;
          console.log(`Service ${service.name} deselected`);
        });
      });

      const updatedFormData = {
        ...formData,
        package: []
      };
      setFormData(updatedFormData);
      console.log("FormData cleared");
      return;
    }

    if (selectedPackageIds.length === 0) {
      console.log("No packages selected. Deselecting all services...");

      services.forEach(group => {
        group.services.forEach(service => {
          service.isSelected = false;
          console.log(`Service ${service.name} deselected`);
        });
      });

      setFormData({ ...formData, package: [] });
      return;
    }

    console.log("Specific packages selected. Matching services...");
    selectPackageById(selectedPackageIds);

    const updatedFormData = {
      ...formData,
      package: selectedPackageIds
    };
    setFormData(updatedFormData);
    console.log("FormData updated with specific packages");
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
  const handleDelete = async (id) => {
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
        setLoadingStates((prevState) => ({ ...prevState, [id]: true }));
        let url
        if (branchData?.type === "sub_user") {
          const sub_user_id = branchData?.id ?? null;
          url = `https://api.screeningstar.co.in/branch/candidate-application/delete?id=${id}&branch_id=${branch_id}&_token=${_token}&sub_user_id=${sub_user_id}`
        } else {
          url = `https://api.screeningstar.co.in/branch/candidate-application/delete?id=${id}&branch_id=${branch_id}&_token=${_token}`
        }
        fetch(`${url}`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            const newToken = result.token || result._token || ''
            if (newToken) {
              localStorage.setItem("_token", newToken)
            }
            setLoadingStates((prevState) => ({ ...prevState, [id]: false }));
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

  const handleViewMore = (services) => {
    setModalServices(services);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalServices([]);
  };
  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );
  const filteredData = tableData.filter((item) =>
    (item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (String(item.mobile_number).toLowerCase().includes(searchTerm.toLowerCase())) ||
    (String(item.employee_id).toLowerCase().includes(searchTerm.toLowerCase()))
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
  return (

    <div className="bg-[#c1dff2] border-black border" ref={clientEditRef} id="clientedit" >
      <div className="bg-white md:p-12 p-6 w-full mx-auto">

        <form className="space-y-4 w-full pb-16 text-center" onSubmit={handleSubmit}>
          <div className='md:flex space-x-4'>
            <div className="md:w-2/5">
              <div className="w-full">
                <label htmlFor="organizationName" className="block text-left w-full m-auto mb-2 text-gray-700">Name of the Organization</label>
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
              <div className="w-full">
                <label htmlFor="organizationName" className="block text-left w-full m-auto mb-2 text-gray-700">Name of the Applicant<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="NAME OF THE Applicant"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.fullName && <p className="text-red-500 text-sm">{errors.fullName}</p>}
              </div>

              <div className="w-full">
                <label htmlFor="fullName" className="block text-left w-full m-auto mb-2 text-gray-700">Mobile  Number<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="number"
                  name="mobile_number"
                  placeholder="MOBILE NUMBER*"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.mobile_number ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.mobile_number && <p className="text-red-500 text-sm">{errors.mobile_number}</p>}
              </div>
              <div className="w-full">
                <label htmlFor="employeeId" className="block text-left w-full m-auto mb-2 text-gray-700">Email ID<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email ID"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
              </div>
              <div className="w-full">
                <label htmlFor="employeeId" className="block text-left w-full m-auto mb-2 text-gray-700">Employee ID (Optional)</label>
                <input
                  type="text"
                  name="employeeId"
                  placeholder="EMPLOYEE ID"
                  value={formData.employeeId}
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.employeeId ? 'border-red-500' : 'border-gray-300'} rounded-md`}
                />
                {errors.employeeId && <p className="text-red-500 text-sm">{errors.employeeId}</p>}
              </div>
              <div className='block'>
                <div className='flex justify-center gap-5 items-center'>
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105  transition duration-200  font-bold rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            mobile_number: '',
                            email: '',
                            package: [],
                            services: '',
                            photo: '',
                          });
                          fetchCustomerInfo();

                        }}

                        disabled={loading}
                        className={`p-6 py-3 bg-red-500 hover:scale-105 transition duration-200  text-white font-bold rounded-md hover:bg-red-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {!handleEditClick && (
                    <div className='flex items-center gap-7'>
                      <div>
                        <h3 className='text-xl font-bold'>OR</h3>
                      </div>
                      <button
                        onClick={() => navigate('/user-CandidateBulkUpload')}
                        disabled={loading}
                        className={`p-6 py-3 bg-[#2c81ba] text-white hover:scale-105 font-bold  transition duration-200  rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        Bulk Upload
                      </button>
                    </div>
                  )}

                </div>

              </div>
            </div>
            <div className='md:w-3/5 margin-l'>
              <div className="space-y-4 m-auto w-full  bg-white rounded-md">
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
                <table className="m-auto w-full border-collapse border border-black rounded-lg">
                  <thead>
                    <tr className="bg-[#c1dff2] text-[#4d606b]">
                      <th className=" uppercase border border-black px-4 py-2">SERVICE</th>
                      <th className=" uppercase border border-black px-4 py-2">SERVICE NAMES</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="py-4 border-black border text-center text-gray-500">
                          <Loader className="text-center" />
                        </td>
                      </tr>
                    ) : currentServices.length > 0 ? (
                      currentServices.map((service) => (
                        <tr className="text-center whitespace-nowrap" key={service.serviceId}>
                          <td className="border border-black px-4 py-2">
                            <input
                              type="checkbox"
                              checked={service.isSelected || false}
                              className='w-6 h-6'
                              name="services[]"
                              onChange={() =>
                                handleCheckboxChange(service.index, service.groupIndex)
                              }
                            />
                          </td>

                          <td className="border border-black px-4 text-left py-2">
                            {service.serviceTitle}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-gray-500">
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
                  const maxPagesToShow = 3 // Maximum page numbers to display
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
                    )
                    if (startPage > 2) {
                      pages.push(<span key="start-ellipsis">...</span>)
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
                    )
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
                    )
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
        <div className=" pt-16 w-1/3  border-t-2 mb-2">
          <div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 w-full py-2 border rounded-md"
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
                  <th className=" uppercase border border-black px-4 py-2 text-left">Name Of The Applicant</th>
                  <th className=" uppercase border border-black px-4 py-2 text-left">Email</th>
                  <th className=" uppercase border border-black px-4 py-2 text-left">Mobile Number</th>
                  <th className=" uppercase border border-black px-4 py-2 text-left">Employe Id</th>
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
                    {paginatedData.map((item, index) => (
                      <tr key={item.id} className="text-center">
                        <td className="border border-black px-4 py-2">  {index + 1 + (tableCurrentPage - 1) * rowsPerPage}</td>
                        <td className="border border-black px-4 py-2 text-left">{item.name}</td>
                        <td className="border border-black px-4 py-2 text-left">{item.email}</td>
                        <td className="border border-black px-4 py-2 text-left">{item.mobile_number}</td>
                        <td className="border border-black px-4 py-2 text-left whitespace-nowrap">{item.employee_id
                          || 'null'}</td>
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



                        <td className="border border-black px-4 py-2">

                          <button
                            className="bg-green-500 text-white hover:scale-105  transition duration-200  px-4 py-2 rounded-md"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>

                        </td>
                        <td className="border border-black px-4 py-2">
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
                      className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm"
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

export default CandidateManager;


