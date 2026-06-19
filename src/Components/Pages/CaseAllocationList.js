import React, { useEffect, useState, useCallback, useRef } from 'react';
import Modal from 'react-modal';
import { useApiLoading } from '../ApiLoadingContext';
import * as XLSX from 'xlsx';
import { useClientContext } from "./ClientContext";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FaChevronLeft } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import swal from "sweetalert";
import moment from 'moment';

import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
const CaseAllocationList = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];
  const [scopeFilter, setScopeFilter] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
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

  const [data, setData] = useState([]);
  const [services, setServices] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / entriesPerPage);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalServices, setModalServices] = useState([]);
  const [files, setFiles] = useState({});
  const [loadingBtn, setLoadingBtn] = useState(false);
  const [adminRoles, setAdminRoles] = useState([]);
  const [responseError, setResponseError] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [errors, setErrors] = useState({});
  const [referenceIds, setReferenceIds] = useState([]);
  const [formData, setFormData] = useState({
    id: '',
    month: '',
    initiationDate: '',
    employeeId: '',
    referenceId: '',
    applicantName: '',
    dateOfBirth: '',
    gender: '',
    mobileNumber: '',
    alternateNumber: '',
    fatherOrSpouseName: '',
    address: '',
    scopeOfService: [],
    color_code: '',
    vendorName: '',
    deadlineDate: '',
    reportDate: '',
    caseAging: '',
    remarks: '',
  });
  const [submitMessage, setSubmitMessage] = useState('');
  const storedToken = localStorage.getItem('token');
  const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
  const fetchData = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Admin ID or token not found. Please log in.",
      });
      setApiLoading(false);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/client-allocation/list?admin_id=${admin_id}&_token=${storedToken}`,
        {
          method: "GET",
          redirect: "follow",
        }
      );
      const result = await response.json();

      if (!response.ok) {
        swal.fire("Error!", `${result.message}`, "error");
        setResponseError(result.message);

        // Update token if provided
        if (result.token || result._token) {
          localStorage.setItem("_token", result.token || result._token);
        }

        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      // Parse JSON only once
      // Log the response for debugging
      console.log("API Response:", result);

      // Update token if provided
      if (result.token || result._token) {
        localStorage.setItem("_token", result.token || result._token);
      }

      // Handle response data
      const data = result.data || {};
      const { applications = [], services = [] } = data;

      setApplications(applications);
      setServices(result.data?.caseAllocations?.service_ids || []);
      setServicesList(result.data?.services || []);
      setData(result.data?.caseAllocations || []);


      const referenceOptions = applications.map((app, index) => ({
        value: app.application_id,
        label: app.application_id,
        key: `${app.application_id}-${index}`
      }));
      const serviceOptions = services.map((service, index) => ({
        value: service.id,
        label: service.title,
        key: `${service.title}-${index}` // Ensure key is unique
      }));
      setReferenceIds(referenceOptions);

      setServices(serviceOptions || []);
    } catch (error) {
      console.error("Fetch error:", error);
      swal.fire({
        icon: "error",
        title: "Fetch Error",
        text: "Failed to fetch. Please try again later.",
      });
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

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  const handleEdit = async (user) => {
    console.log('user', user);
    setEditingUserId(user?.id);

    setFormData({
      id: user.id || '',
      month: user?.month_year || '',
      initiationDate: user?.created_at?.split('T')[0] || '',
      employeeId: user?.employee_id || '',
      referenceId: user?.application_id || '',
      applicantName: user?.name || '',
      dateOfBirth: user?.dob || '',
      gender: user?.gender || '',
      mobileNumber: user?.contact_number || '',
      alternateNumber: user?.contact_number2 || '',
      fatherOrSpouseName: user?.father_name || user?.spouse_name || '',
      address: user?.permanent_address || '',
      scopeOfService: JSON.parse(user?.service_ids || []),
      color_code: user?.color_code || '',
      vendorName: user?.vendor_name || '',
      deadlineDate: user?.deadline_date || '',
      reportDate: user?.report_date || '',
      caseAging: user?.case_aging || '',
      remarks: user?.remarks || '',
    });

    await fetchData();
  };


  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
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
    fetchData();
  };
  const filteredData = data.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleViewMore = (services) => {
    setModalServices(services);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalServices([]);
  };
  const handleCheckInGo = (id) => {
    console.log('ds', id)
    navigate(`/admin-CaseAllocationEdit?${id}`);
  };


  const validateForm = () => {
    const newErrors = {};
    console.log('woleformData', formData)
    // Validate new fields
    if (!formData.month) newErrors.month = "Month is required.";
    if (!formData.initiationDate) newErrors.initiationDate = "Initiation Date is required.";
    if (!formData.referenceId) newErrors.referenceId = "Reference ID is required.";
    if (!formData.applicantName) newErrors.applicantName = "Applicant Name is required.";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required.";
    if (!formData.gender) newErrors.gender = "Gender is required.";
    if (!formData.mobileNumber) newErrors.mobileNumber = "Mobile Number is required.";
    if (!formData.alternateNumber) newErrors.alternateNumber = "Alternate Number is required.";
    if (!formData.fatherOrSpouseName) newErrors.fatherOrSpouseName = "Father/Spouse Name is required.";
    if (!formData.address) newErrors.address = "Address is required.";
    if (!formData.scopeOfService || formData.scopeOfService.length === 0) newErrors.scopeOfService = "Scope of Service is required.";
    if (!formData.color_code) newErrors.color_code = "Color Code is required.";
    if (!formData.vendorName) newErrors.vendorName = "Vendor Name is required.";
    if (!formData.deadlineDate) newErrors.deadlineDate = "Deadline Date is required.";
    if (!formData.reportDate) newErrors.reportDate = "Report Date is required.";
    if (!formData.caseAging) newErrors.caseAging = "Case Aging is required.";
    if (!formData.remarks) newErrors.remarks = "Remarks are required.";

    console.log(`newErrors - `, newErrors);
    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
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

    const formPayload = {
      admin_id: adminId,
      _token: token,
      id: formData.id,
      month_year: formData.month,
      initiationDate: formData.initiationDate,
      employeeId: formData.employeeId,
      application_id: formData.referenceId,
      applicantName: formData.applicantName,
      dob: formData.dateOfBirth,
      gender: formData.gender,
      contact_number: formData.mobileNumber,
      contact_number2: formData.alternateNumber,
      father_name: formData.fatherOrSpouseName,
      spouse_name: formData.fatherOrSpouseName,
      permanent_address: formData.address,
      service_ids: JSON.stringify(formData.scopeOfService),
      color_code: formData.color_code,
      vendor_name: formData.vendorName,
      deadline_date: formData.deadlineDate,
      report_date: formData.reportDate,
      case_aging: formData.caseAging,
      remarks: formData.remarks,
    };
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    try {

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(formPayload),
        redirect: "follow"
      };


      const response = await fetch(
        "https://api.screeningstar.co.in/client-allocation/update",
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
        // if (isFileUploading) {
        //     await uploadAdminProfilePicture(formData.id, adminId, token);
        // }
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
  const uniqueServiceIds = [...new Set(filteredData.flatMap(item => {
    let serviceIds = [];

    if (!item.service_ids) {
      console.warn(`Skipping item: service_ids is null or empty`, item);
      return []; // Skip this item safely
    }

    try {
      console.log(`Step - 1`, item.service_ids);
      serviceIds = JSON.parse(item.service_ids);
      console.log(`Step - 2`);
    } catch (error) {
      console.error(`JSON parse error:`, error, `for item`, item.service_ids);
      serviceIds = [];
    }

    console.log(`Step - 4`);
    console.log(`serviceIds - `, serviceIds);

    return Array.isArray(serviceIds) ? serviceIds.map(id => Number(id)) : [];
  }))];


  // Filter the servicesList to only include the matched services
  const matchedServices = servicesList.filter(service => uniqueServiceIds.includes(service.id));
  const filteredAndSortedData = filteredData.filter((item) => {
    let match = true;

    // Filter by Scope of Service (Dropdown)
    if (scopeFilter && item.service_ids) {
      let serviceIds;
      try {

        serviceIds = JSON.parse(item.service_ids);
        console.log('item.service_ids', item.service_ids)

      } catch (error) {
        console.error('Failed to parse service_ids', error);
        serviceIds = [];
      }
      const numericServiceIds = serviceIds.map((id) => Number(id));
      match = numericServiceIds.includes(Number(scopeFilter));
    }

    // Filter by Vendor Name
    if (vendorFilter && !item.vendor_name.toLowerCase().includes(vendorFilter.toLowerCase())) {
      match = false;
    }

    // Filter by Month
    if (monthFilter && !item.month_year.toLowerCase().includes(monthFilter.toLowerCase())) {
      match = false;
    }

    return match;
  });

  const displayedEntries = filteredAndSortedData.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const tableRef = useRef(null);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(displayedEntries); // Convert JSON to sheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "table_data.xlsx");
  };

  console.log('modalServices--', modalServices)
  console.log('services---', servicesList)
  const formatDate = (dob) => {
    if (!dob) return null;

    let year, month, day;

    try {
      if (dob.includes('T')) {
        // Handle format like "08T00:00:00.000Z-08-2002"
        const parts = dob.split('-');
        if (parts.length !== 3) return null;

        day = parts[0].split('T')[0];
        month = parts[1];
        year = parts[2];
      } else {
        // Handle format like "2002-08-08"
        const parts = dob.split('-');
        if (parts.length !== 3) return null;

        [year, month, day] = parts;
      }

      if (!year || !month || !day) return null;

      return `${day}-${month}-${year}`;
    } catch (error) {
      return null;
    }
  };


  // Test cases
  console.log(formatDate("2002-08-08")); // Expected: "08-08-2002"
  console.log(formatDate("08T00:00:00.000Z-08-2002")); // Expected: "08-08-2002"
  const handleDateChange = (date, fieldName) => {
    if (!date) {
      setFormData((prev) => ({
        ...prev,
        [fieldName]: '',
      }));
      return;
    }

    // Set time to noon to avoid timezone offset issues
    const localDate = new Date(date);
    localDate.setHours(12, 0, 0, 0);

    const formattedDate = localDate.toISOString().split('T')[0]; // yyyy-mm-dd
    setFormData((prev) => ({
      ...prev,
      [fieldName]: formattedDate,
    }));
  };
  const handleMonthChange = (date) => {
    if (!date) {
      setFormData((prev) => ({
        ...prev,
        month: '',
      }));
      return;
    }

    const formattedMonth = date.toISOString().slice(0, 7); // yyyy-MM
    setFormData((prev) => ({
      ...prev,
      month: formattedMonth,
    }));
  };
  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log('e ---', name, 'value ---', value);
    console.log('applications', applications);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
      const year = String(date.getFullYear()).slice(2); // Extract last two digits of the year

      return `${day}-${month}-${year}`;
    };

    setFormData((prev) => {
      if (name === 'referenceId') {
        console.log('Comparing:', value);
        const selectedService = applications.find(app => app.application_id === String(value));
        console.log('Selected Service:', selectedService);

        if (selectedService) {
          return {
            ...prev,
            month: selectedService.month_year || '',
            initiationDate: selectedService.created_at
              ? new Date(selectedService.created_at).toISOString().split('T')[0]
              : '',
            employeeId: selectedService.employee_id || '',
            referenceId: selectedService.application_id || '',
            applicantName: selectedService.name || '',
            dateOfBirth: selectedService.dob
              ? new Date(selectedService.dob).toISOString().split('T')[0]
              : '',
            gender: selectedService.gender || '',
            mobileNumber: selectedService.contact_number || '',
            alternateNumber: selectedService.contact_number2 || '',
            fatherOrSpouseName: selectedService.father_name || selectedService.spouse_name || '',
            address: [
              selectedService.permanent_address_house_no,
              selectedService.permanent_address_floor,
              selectedService.permanent_address_cross,
              selectedService.permanent_address_street,
              selectedService.permanent_address_main,
              selectedService.permanent_address_area,
              selectedService.permanent_address_locality,
              selectedService.permanent_address_city,
              selectedService.permanent_address_landmark,
              selectedService.permanent_address_taluk,
              selectedService.permanent_address_district,
              selectedService.permanent_address_state,
              selectedService.permanent_address_pin_code
            ].filter(Boolean).join(', '),
            scopeOfService: selectedService.services,
            color_code: selectedService.color_code,
            vendorName: '',
            deadlineDate: selectedService.deadline_date
              ? formatDate(selectedService.deadline_date)
              : '',
            reportDate: selectedService.report_date ? new Date(selectedService.report_date).toISOString().split('T')[0]
              : '',
            caseAging: '',
            remarks: '',
          };
        } else {
          console.log('No service found for this application ID');
        }
      }

      // Handle multiple selection case for scopeOfService
      if (name === 'scopeOfService') {
        const { checked, value } = e.target;

        return {
          ...prev,
          scopeOfService: checked
            ? [...(prev.scopeOfService || []), value]
            : (prev.scopeOfService || []).filter((v) => v !== value),
        };
      }



      // Default case for other fields
      return { ...prev, [name]: value };
    });
  };
  const getValidDate = (date) => {
    const parsed = new Date(date);
    return isNaN(parsed) ? null : parsed;
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
          `https://api.screeningstar.co.in/client-allocation/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
          requestOptions
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.statusText}`);
        }

        const result = await response.json();

        // Dynamic message from API response
        const successMessage = result.message || "The data has been deleted successfully.";
        await swal("Deleted!", successMessage, "success");

        setDeletingId(null);
        fetchData();

        const newToken = result.token || result._token || storedToken || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
      }
    } catch (error) {
      await swal("Failed!", "There was an error deleting the data.", "error");
      console.error("Delete request failed:", error);
      setDeletingId(null);
    }
  };

  return (

    <div className="w-full bg-[#c1dff2] overflow-hidden">
      <div className="border border-black space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        {editingUserId ? (
          <>
            <div onClick={handleCancelEdit} className="flex items-center w-36 space-x-3 p-2 rounded-lg bg-[#2c81ba] text-white hover:bg-[#1a5b8b] transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg cursor-pointer"
            >
              <FaChevronLeft className="text-xl text-white" />
              <span className="font-semibold text-lg">Go Back</span>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium">Month</label>
                <DatePicker
                  selected={
                    formData.month
                      ? moment(formData.month, "YYYY-MM").toDate() // Convert to Date
                      : null
                  }
                  onChange={(date) => {
                    const formatted = moment(date).format("YYYY-MM"); // Format the date
                    setFormData({ ...formData, month: formatted });
                  }}
                  dateFormat="MM-yyyy"
                  showMonthYearPicker
                  placeholderText="Select Month"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Date of Initiation </label>
                <DatePicker
                  selected={getValidDate(formData?.initiationDate)}
                  onChange={(date) => handleDateChange(date, 'initiationDate')}
                  dateFormat="dd-MM-yyyy"
                  disabled
                  readOnly
                  placeholderText="Select Initiation Date"
                  className="uppercase w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Employee ID </label>
                <input
                  type="text"
                  name="employeeId"
                  disabled
                  readOnly
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Reference ID</label>
                {/* <select
                  name="referenceId"
                  required
                  value={formData.referenceId}
                 onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Reference ID</option>
                  {referenceIds.map((ref) => (
                    <option key={ref.value} value={ref.value}>
                      {ref.label}
                    </option>
                  ))}
                </select> */}
                <input
                  type="text"
                  name="referenceId"
                  required
                  value={formData.referenceId}
                  disabled
                  readOnly
                  className="w-full p-2 border rounded"
                />


              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Name of the Applicant</label>
                <input
                  type="text"
                  name="applicantName"
                  disabled
                  readOnly
                  value={formData.applicantName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Date of Birth</label>
                <DatePicker
                  selected={getValidDate(formData?.dateOfBirth)}
                  onChange={(date) => handleDateChange(date, 'dateOfBirth')}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select Date of Birth"
                  className="uppercase w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Gender</label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Transgender">Transgender</option>
                </select>

              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Mobile Number</label>
                <input
                  type="tel"
                  name="mobileNumber"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Alternate Number</label>
                <input
                  type="tel"
                  name="alternateNumber"
                  required
                  value={formData.alternateNumber}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Father Name / Spouse Name</label>
                <input
                  type="text"
                  name="fatherOrSpouseName"
                  required
                  value={formData.fatherOrSpouseName}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Address</label>
                <textarea
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>

              {/* Scope of Service */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Scope of Service</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

                  {services.map((service) => (
                    <label key={service.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="scopeOfService"
                        value={service.value}
                        checked={
                          String(formData?.scopeOfService || '')
                            .split(',')
                            .includes(String(service.value))
                        }
                        onChange={(e) => {
                          const { checked, value } = e.target;
                          let updatedValues = String(formData.scopeOfService || '').split(',');

                          if (checked) {
                            if (!updatedValues.includes(value)) {
                              updatedValues.push(value);
                            }
                          } else {
                            updatedValues = updatedValues.filter((v) => v !== value);
                          }

                          setFormData({
                            ...formData,
                            scopeOfService: updatedValues,
                          });
                        }}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm">{service.label}</span>
                    </label>
                  ))}

                </div>
              </div>
              <div className="mb-4">
                <label for="color_code" className="block text-sm font-medium">Color Code</label>
                <select
                  name="color_code"
                  required
                  value={formData.color_code}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Color</option>
                  <option value="green">Green</option>
                  <option value="red">Red</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="pink">Pink</option>
                </select>

              </div>
              <div className="mb-4">
                <label for="vendorName" className="block text-sm font-medium">Name of the Vendor</label>
                <input
                  type="text"
                  name="vendorName"
                  value={formData.vendorName}
                  required
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Deadline Date</label>
                <DatePicker
                  selected={getValidDate(formData?.deadlineDate)}
                  onChange={(date) => handleDateChange(date, 'deadlineDate')}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select Deadline Date"
                  className="uppercase w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label for="reportDate" className="block text-sm font-medium">Report Date</label>
                <DatePicker
                  selected={getValidDate(formData?.reportDate)}
                  onChange={(date) => handleDateChange(date, 'reportDate')}
                  dateFormat="dd-MM-yyyy"
                  placeholderText="Select Report Date"
                  className="uppercase w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Case Aging</label>
                <input
                  type="text"
                  name="caseAging"
                  required
                  value={formData.caseAging}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium">Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  required
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                ></textarea>
              </div>

              <div className='flex items-center gap-7'>
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

              </div>
            </form>
          </>
        ) : (
          <div>
            <div className="md:flex justify-between items-center">
              <div className="text-left mb-2">
                <div>
                  <button className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-6 py-2 rounded"
                    onClick={exportToExcel}
                  >

                    Export to Excel
                  </button>
                </div>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4 mb-0 shadow-sm focus:ring-2 focus:ring-blue-400"
                >
                  {optionsPerPage.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:flex space-x-4 mb-4">
                <select
                  className="border md:w-auto w-full mb-2 p-2 rounded"
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value)}
                >
                  <option value="">Select Scope of Service</option>
                  {matchedServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.title}
                    </option>
                  ))}
                </select>

                {/* Name of the Vendor Filter */}
                <input
                  type="text"
                  className="border md:w-auto mb-2 w-full margin-l p-2 rounded"
                  placeholder="Search Vendor"
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                />

                {/* Month Filter */}
                <input
                  type="text"
                  className="border md:w-auto mb-2 w-full no-margin p-2 rounded"
                  placeholder="Search Month"
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="table-container rounded-lg">
              {/* Top Scroll */}
              <div
                className="top-scroll"
                ref={topScrollRef}
                onScroll={syncScroll}
              >
                <div className="top-scroll-inner" style={{ width: tableScrollRef.current?.scrollWidth || "100%" }} />
              </div>

              {/* Actual Table Scroll */}
              <div
                className="table-scroll rounded-lg"
                ref={tableScrollRef}
                onScroll={syncScroll}
              >
                <table className="min-w-full border-collapse border border-black rounded-lg"
                  ref={tableRef} >
                  <thead className="rounded-lg border border-black">
                    <tr className="bg-[#c1dff2] text-[#4d606b] whitespace-nowrap text-left">
                      <th className=" uppercase border  border-black px-4 py-2 text-center">SL No</th>
                      <th className=" uppercase border  border-black px-4 py-2">Month</th>
                      <th className=" uppercase border  border-black px-4 py-2">Date of Initiation</th>
                      <th className=" uppercase border  border-black px-4 py-2">Employee ID</th>
                      <th className=" uppercase border  border-black px-4 py-2">Reference ID</th>
                      <th className=" uppercase border  border-black px-4 py-2">Name of the Applicant</th>
                      <th className=" uppercase border  border-black px-4 py-2">Date of Birth</th>
                      <th className=" uppercase border  border-black px-4 py-2">Gender</th>
                      <th className=" uppercase border  border-black px-4 py-2">Mobile Number</th>
                      <th className=" uppercase border  border-black px-4 py-2">Alternate Number</th>
                      <th className=" uppercase border  border-black px-4 py-2">Father/Spouse Name</th>
                      <th className=" uppercase border  border-black px-4 py-2">Address</th>
                      <th className=" uppercase border  border-black px-4 py-2">
                        Scope of Service
                      </th>
                      <th className=" uppercase border  border-black px-4 py-2">Color Code</th>
                      <th className=" uppercase border  border-black px-4 py-2">Name of the Vendor</th>
                      <th className=" uppercase border  border-black px-4 py-2">Deadline Date</th>
                      <th className=" uppercase border  border-black px-4 py-2">Report Date</th>
                      <th className=" uppercase border  border-black px-4 py-2">Case Aging</th>
                      <th className=" uppercase border  border-black px-4 py-2">Remarks</th>
                      <th className=" uppercase border  border-black px-4 py-2">Action</th>

                    </tr>
                  </thead>

                  {loading ? (
                    <tbody className="h-10">
                      <tr>
                        <td colSpan="12" className="w-full py-10 h-10 text-center">
                          <div className="flex justify-center items-center w-full h-full">
                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  ) : displayedEntries.length === 0 ? (
                    <tbody className="h-10">
                      <tr>
                        <td colSpan={17} className="py-4 text-center text-red-500">
                          {responseError && responseError !== "" ? responseError : "No data available in table"}

                        </td>
                      </tr>
                    </tbody>
                  ) : (
                    <tbody>
                      {displayedEntries.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-black px-4 py-2 text-center">{index + 1 + (currentPage - 1) * entriesPerPage}</td>
                          <td className="border border-black px-4 py-2">{item.month_year}</td>
                          <td className="border border-black px-4 py-2">
                            {(() => {
                              const date = new Date(item.created_at);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${day}-${month}-${year}`;
                            })()}
                          </td>


                          <td className="border border-black px-4 py-2 whitespace-nowrap">{item.employee_id}</td>
                          <td className="border border-black px-4 py-2">{item.application_id}</td>
                          <td className="border border-black px-4 py-2">{item.name}</td>
                          <td className="border border-black px-4 py-2">{formatDate(item?.dob)}</td>
                          <td className="border border-black px-4 py-2">{item.gender}</td>
                          <td className="border border-black px-4 py-2">{item.contact_number}</td>
                          <td className="border border-black px-4 py-2">{item.contact_number2}</td>
                          <td className="border border-black px-4 py-2">{item.father_name || item.spouse_name}</td>
                          <td className="border border-black px-4 py-2 min-w-[500px]">{item.permanent_address}</td>
                          <td className="border  border-black px-4 py-2 text-left">
                            <div className=" ">
                              <div className="flex whitespace-nowrap">
                                {(() => {
                                  let serviceIds = [];

                                  // Validate & Parse item.service_ids
                                  if (typeof item.service_ids === "string" && item.service_ids.trim() !== "") {
                                    try {
                                      serviceIds = JSON.parse(item?.service_ids);
                                    } catch (error) {
                                      console.error("Failed to parse service_ids:", error, "Raw value:", item.service_ids);
                                    }
                                  }
                                  // Ensure serviceIds is an array & convert IDs to numbers
                                  const numericServiceIds = Array.isArray(serviceIds) ? serviceIds.map(Number) : [];

                                  // Match serviceIds with servicesList
                                  const matchedServices =
                                    Array.isArray(servicesList) && servicesList.length > 0
                                      ? numericServiceIds.map((id) => servicesList.find((service) => service?.id === id)).filter(Boolean)
                                      : [];

                                  // UI Logic
                                  if (matchedServices.length === 0) {
                                    return (
                                      <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                        No matching services found
                                      </span>
                                    );
                                  }

                                  return matchedServices.length === 1 ? (
                                    <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
                                      {matchedServices[0].title}
                                    </span>
                                  ) : (
                                    <>
                                      <span className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm">
                                        {matchedServices[0].title}
                                      </span>
                                      <button className="text-blue-500 ml-2" onClick={() => handleViewMore(matchedServices)}>
                                        View More
                                      </button>
                                    </>
                                  );
                                })()}
                              </div>

                            </div>
                          </td>

                          <td className="border border-black px-4 py-2">{item.color_code}</td>
                          <td className="border border-black px-4 py-2">{item.vendor_name}</td>
                          <td className="border border-black px-4 py-2">{formatDate(item?.deadline_date)}</td>
                          <td className="border border-black px-4 py-2">{formatDate(item?.report_date)}</td>
                          <td className="border border-black px-4 py-2">{item.case_aging}</td>
                          <td className="border border-black px-4 py-2">{item.remarks}</td>
                          <td className="border border-black px-4 py-2">
                            <div className='flex gap-4'>
                              <button
                                className="px-4 py-2 text-white rounded-md font-bold bg-green-500 hover:bg-green-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                onClick={() => handleEdit(item)}
                              >
                                EDIT
                              </button>
                              <button
                                className="px-4 py-2 text-white rounded-md font-bold bg-red-500 hover:bg-red-600 hover:scale-105 transition-transform duration-300 ease-in-out transform"
                                onClick={() => handleDelete(item.id)}
                              >
                                DELETE
                              </button>
                            </div>
                          </td>


                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>
            </div>

            {/* Pagination */}

            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}

            {isModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-999">
                <div className="bg-white rounded-lg shadow-lg p-4 w-1/3">
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
                              modalServices.map((service, idx) => {
                                // Find the matching service from serviceList using the id
                                const matchedService = servicesList.find((s) => s.id === service.id);
                                return matchedService ? (
                                  <span
                                    key={idx}
                                    className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm"
                                  >
                                    {matchedService.title} {/* Display the service title */}
                                  </span>
                                ) : (
                                  <span key={idx} className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg text-sm">
                                    Service not found
                                  </span>
                                );
                              })
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
            )}
          </div>
        )}
      </div>
    </div>

  );
};

export default CaseAllocationList;
