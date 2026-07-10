import React, { useEffect, useRef, useState, useCallback } from "react";
import Swal from 'sweetalert2';
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format } from "date-fns";

const BusinessDevelopmentActivity = () => {
  const clientEditRef = useRef(null);
  const [deletingId, setDeletingId] = useState(null);
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const navigate = useNavigate();
  const [spocs, setSpocs] = useState([]);
  const [yesNo, setYesNo] = useState([]);
  const [services, setServices] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalServices, setModalServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [responseError, setResponseError] = useState(null);
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

  const [formData, setFormData] = useState({
    bd_expert_name: "",
    date: null, // store as Date objec
    client_organization_name: "",
    company_size: "",
    spoc_name: "",
    spoc_designation: "",
    contact_number: "",
    email: "",
    is_using_any_bgv_vendor: "",
    vendor_name: "",
    is_interested_in_using_our_services: "",
    reason_for_not_using_our_services: "",
    reason_for_using_our_services: "",
    callback_asked_at: "",
    is_prospect: "",
    comments: "",
    followup_date: "",
    followup_comments: "",
    remarks: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpocId, setCurrentSpocId] = useState(null);
  const handleViewMore = (services) => {
    setModalServices(services);
    setIsModalOpen(true);
  };
  const handleDateChange = (date) => {
    setFormData((prevData) => ({
      ...prevData,
      date,
    }));
  };
  const handleCloseServiceModal = () => {
    setIsModalOpen(false);
    setModalServices([]);
  };
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const formatDate = (date) => {
    // Check if date is in dd-mm-yyyy format using regex
    const regex = /^\d{2}-\d{2}-\d{4}$/;
    if (regex.test(date)) {
      return date; // Return the date as is if it matches dd-mm-yyyy format
    }

    // Check if the date is invalid or not provided
    if (!date || isNaN(new Date(date))) {
      return 'nll'; // Return 'nll' if the date is invalid or not provided
    }

    // Format the date if it's a valid Date object
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, '0'); // Ensures two-digit day
    const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
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

    const url = `https://api.screeningstar.co.in/internal-storage/daily-activity-tracker/list?admin_id=${admin_id}&_token=${storedToken}`;

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
      setSpocs(data.data.activies || []);

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

  useEffect(() => {
    if (spocs) {
      const combined = spocs.map(service => ({
        is_interested_in_using_our_services: service.is_interested_in_using_our_services,
        is_using_any_bgv_vendor: service.is_using_any_bgv_vendor
      }));
      setYesNo(combined);
    }
  }, [spocs]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    const raw = JSON.stringify({
      ...formData,
      date: formData.date ? format(formData.date, "yyyy-MM-dd") : "", // format the date here
      callback_asked_at: formData.callback_asked_at ? format(formData.callback_asked_at, "yyyy-MM-dd") : "",
      followup_date: formData.followup_date ? format(formData.followup_date, "yyyy-MM-dd") : "",
      admin_id,
      _token: storedToken,
    });

    const requestOptions = {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    };

    const url = isEditing
      ? "https://api.screeningstar.co.in/internal-storage/daily-activity-tracker/update"
      : "https://api.screeningstar.co.in/internal-storage/daily-activity-tracker/create";

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
          bd_expert_name: "",
          date: "",
          client_organization_name: "",
          company_size: "",
          spoc_name: "",
          spoc_designation: "",
          contact_number: "",
          email: "",
          is_using_any_bgv_vendor: "",
          vendor_name: "",
          is_interested_in_using_our_services: "",
          reason_for_not_using_our_services: "",
          reason_for_using_our_services: "",
          callback_asked_at: "",
          is_prospect: "",
          comments: "",
          followup_date: "",
          followup_comments: "",
          remarks: ""
        });
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
          `https://api.screeningstar.co.in/internal-storage/daily-activity-tracker/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
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
    .filter((spoc) => spoc.bd_expert_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
    spoc.bd_expert_name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log(filteredSpocs);
  const handleCancel = () => {
    fetchData();
    setFormData({
      bd_expert_name: "",
      date: "",
      client_organization_name: "",
      company_size: "",
      spoc_name: "",
      spoc_designation: "",
      contact_number: "",
      email: "",
      is_using_any_bgv_vendor: "",
      vendor_name: "",
      is_interested_in_using_our_services: "",
      reason_for_not_using_our_services: "",
      reason_for_using_our_services: "",
      callback_asked_at: "",
      is_prospect: "",
      comments: "",
      followup_date: "",
      followup_comments: "",
      remarks: ""
    });
    setIsEditing(false);
    setCurrentSpocId(null);
  };
  console.log('yesNo', yesNo)
  return (

    <div className=" ">
      <div className="bg-white  md:p-12 p-6 border border-black w-full mx-auto">
        <div className="md:flex space-x-4">

          <div ref={clientEditRef} className="md:w-2/5">
            <form className="space-y-4 ps-0 pb-[30px]  md:pr-[30px] bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
              <div className="w-full">
                <label htmlFor="bd_expert_name" className="block text-left w-full m-auto mb-2 text-gray-700">Name of the BD Expert</label>
                <input
                  type="text"
                  name="bd_expert_name"
                  placeholder="Name of the BD Expert"
                  value={formData.bd_expert_name}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label htmlFor="date" className="block text-left w-full m-auto mb-2 text-gray-700">Date</label>
                <DatePicker
                  selected={formData.date}
                  onChange={handleDateChange}
                  placeholderText="Select Date"
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                  dateFormat="dd-MM-yyyy" // What user sees
                  id="date"
                  name="date"
                />
              </div>

              <div className="w-full">
                <label htmlFor="client_organization_name" className="block text-left w-full m-auto mb-2 text-gray-700">Client Organization Full Name</label>
                <input
                  type="text"
                  name="client_organization_name"
                  placeholder="Client Organization Full Name"
                  value={formData.client_organization_name}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label htmlFor="company_size" className="block text-left w-full m-auto mb-2 text-gray-700">Company Size (Contact only companies with 100+ employees)</label>
                <input
                  type="text"
                  name="company_size"
                  placeholder="Company Size (Contact only companies with 100+ employees)"
                  value={formData.company_size}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label htmlFor="spoc_name" className="block text-left w-full m-auto mb-2 text-gray-700">Whom You Spoke To</label>
                <input
                  type="text"
                  name="spoc_name"
                  placeholder="Whom You Spoke To"
                  value={formData.spoc_name}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label htmlFor="spoc_designation" className="block text-left w-full m-auto mb-2 text-gray-700">Designation</label>
                <input
                  type="text"
                  name="spoc_designation"
                  placeholder="Designation"
                  value={formData.spoc_designation}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label htmlFor="contact_number" className="block text-left w-full m-auto mb-2 text-gray-700">Contact Number</label>
                <input
                  type="tel"
                  name="contact_number"
                  placeholder="Contact Number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label htmlFor="email" className="block text-left w-full m-auto mb-2 text-gray-700">Email Id</label>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Id"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
              </div>

              <div className="w-full">
                <label className="block text-left w-full m-auto mb-2 text-gray-700">
                  Are they using any vendor for BGV?
                </label>

                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_using_any_bgv_vendor"
                      value="yes"
                      className="w-5 h-5 accent-blue-600"
                      checked={formData.is_using_any_bgv_vendor === "yes"}
                      onChange={handleChange}
                    />
                    yes
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_using_any_bgv_vendor"
                      value="no"
                      className="w-5 h-5 accent-blue-600"
                      checked={formData.is_using_any_bgv_vendor === "no"}
                      onChange={handleChange}
                    />
                    no
                  </label>
                </div>

                {formData.is_using_any_bgv_vendor === "yes" && (
                  <div className="w-full">
                    <label className="block text-left w-full m-auto mb-2 text-gray-700">
                      Vendor Name
                    </label>
                    <input
                      type="text"
                      name="vendor_name"
                      placeholder="Enter vendor name"
                      value={formData.vendor_name || ""}
                      onChange={handleChange}
                      className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>
              <div className="w-full">
                <label className="block text-left w-full m-auto mb-2 text-gray-700">
                  Interested in our Services?
                </label>

                <div className="flex items-center gap-4 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_interested_in_using_our_services"
                      value="yes"
                      className="w-5 h-5 accent-blue-600"
                      checked={formData.is_interested_in_using_our_services === "yes"}
                      onChange={handleChange}
                    />
                    yes
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_interested_in_using_our_services"
                      value="no"
                      className="w-5 h-5 accent-blue-600"
                      checked={formData.is_interested_in_using_our_services === "no"}
                      onChange={handleChange}
                    />
                    no
                  </label>
                </div>

                {formData.is_interested_in_using_our_services === "yes" && (
                  <div className="w-full">
                    <label className="block text-left w-full m-auto mb-2 text-gray-700">
                      What action have you taken?
                    </label>
                    <input
                      type="text"
                      name="reason_for_using_our_services"
                      placeholder="Describe the action taken"
                      value={formData.reason_for_using_our_services || ""}
                      onChange={handleChange}
                      className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                    />
                  </div>
                )}

                {formData.is_interested_in_using_our_services === "no" && (
                  <div className="w-full">
                    <label className="block text-left w-full m-auto mb-2 text-gray-700">
                      Reason for not being interested?
                    </label>
                    <input
                      type="text"
                      name="reason_for_not_using_our_services"
                      placeholder="Mention the reason"
                      value={formData.reason_for_not_using_our_services || ""}
                      onChange={handleChange}
                      className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                    />
                  </div>
                )}
              </div>


              <div className="w-full">
                <label htmlFor="callback_asked_at" className="block text-left w-full m-auto mb-2 text-gray-700">When did they ask you to call back</label>
                <DatePicker
                  selected={formData.callback_asked_at}
                  onChange={(date) => setFormData((prev) => ({ ...prev, callback_asked_at: date }))}
                  placeholderText="When did they ask you to call back"
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                  dateFormat="dd-MM-yyyy"
                  name="callback_asked_at"
                />
              </div>

              <div className="w-full">
                <label className="block text-left w-full m-auto mb-2 text-gray-700">
                  Is it a prospect?
                </label>

                <div className="flex items-center gap-6 mb-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_prospect"
                      value="yes"
                      checked={formData.is_prospect === "yes"}
                      onChange={handleChange}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-gray-800 text-base">yes</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="is_prospect"
                      value="no"
                      checked={formData.is_prospect === "no"}
                      onChange={handleChange}
                      className="w-5 h-5 accent-blue-600"
                    />
                    <span className="text-gray-800 text-base">no</span>
                  </label>
                </div>
              </div>


              <div className="w-full">
                <label htmlFor="comments" className="block text-left w-full m-auto mb-2 text-gray-700">Comments (if any)</label>
                <textarea
                  name="comments"
                  placeholder="Comments"
                  value={formData.comments}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                ></textarea>
              </div>

              <div className="w-full">
                <label htmlFor="followup_date" className="block text-left w-full m-auto mb-2 text-gray-700">Follow up Date</label>
                <DatePicker
                  selected={formData.followup_date}
                  onChange={(date) => setFormData((prev) => ({ ...prev, followup_date: date }))}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                  placeholderText="Follow up Date"
                  dateFormat="dd-MM-yyyy"
                  name="followup_date"
                />
              </div>

              <div className="w-full">
                <label htmlFor="followup_comments" className="block text-left w-full m-auto mb-2 text-gray-700">Follow up Comments</label>
                <textarea
                  name="followup_comments"
                  placeholder="Follow up Comments"
                  value={formData.followup_comments}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                ></textarea>
              </div>

              <div className="w-full">
                <label htmlFor="remarks" className="block text-left w-full m-auto mb-2 text-gray-700">Final Remarks</label>
                <textarea
                  name="remarks"
                  placeholder="Final Remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                ></textarea>
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
                      onClick={() => navigate('/admin-BusinessDevelopmentBulk')}
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
                placeholder="Search by bd expert name"
                className="w-full rounded-md p-2.5 border border-gray-300"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
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
                <table className="min-w-full border-collapse border border-black rounded-lg">
                  <thead className="rounded-lg border border-black">
                    <tr className="bg-[#c1dff2] text-[#4d606b] text-left rounded-lg whitespace-nowrap">
                      <th className="uppercase border border-black px-4 py-2">Sl no.</th>
                      <th className="uppercase border border-black px-4 py-2">Name of the BD Expert</th>
                      <th className="uppercase border border-black px-4 py-2">Date</th>
                      <th className="uppercase border border-black px-4 py-2">Client Organization Full Name</th>
                      <th className="uppercase border border-black px-4 py-2">Company Size (Contact only companies with 100+ employees)</th>
                      <th className="uppercase border border-black px-4 py-2">Whom You Spoke To</th>
                      <th className="uppercase border border-black px-4 py-2">Designation</th>
                      <th className="uppercase border border-black px-4 py-2">Contact no.</th>
                      <th className="uppercase border border-black px-4 py-2">Email Id</th>
                      <th className="uppercase border border-black px-4 py-2">BGV Vendor?</th>
                      <th className="uppercase border border-black px-4 py-2">Vendor Name</th>
                      <th className="uppercase border border-black px-4 py-2">Interested?</th>
                      <th className="uppercase border border-black px-4 py-2">Reason not Using</th>
                      <th className="uppercase border border-black px-4 py-2">Reason Using</th>
                      <th className="uppercase border border-black px-4 py-2">When did they ask you to call back</th>
                      <th className="uppercase border border-black px-4 py-2">Is Prospect?</th>
                      <th className="uppercase border border-black px-4 py-2">Comments</th>
                      <th className="uppercase border border-black px-4 py-2">Follow up Date</th>
                      <th className="uppercase border border-black px-4 py-2">Follow up Comments</th>
                      <th className="uppercase border border-black px-4 py-2">Final Remarks</th>
                      <th className="uppercase border border-black px-4 py-2 text-center">Actions</th>
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
                              {responseError && responseError !== "" ? responseError : "no data available in table"}
                            </td>
                          </tr>
                        ) : (
                          currentSpocs.map((spoc, index) => (
                            <tr key={spoc.id} className="hover:bg-gray-200 ">
                              <td className="py-2 px-4 border border-black">{index + indexOfFirstItem + 1}</td>
                              <td className="border border-black px-4 py-2">{spoc.bd_expert_name}</td>
                              <td className="border border-black px-4 py-2 whitespace-nowrap">{formatDate(spoc.date)}</td>
                              <td className="border border-black px-4 py-2">{spoc.client_organization_name}</td>
                              <td className="border border-black px-4 py-2">{spoc.company_size}</td>
                              <td className="border border-black px-4 py-2">{spoc.spoc_name}</td>
                              <td className="border border-black px-4 py-2">{spoc.spoc_designation}</td>
                              <td className="border border-black px-4 py-2 whitespace-nowrap">{spoc.contact_number}</td>
                              <td className="border border-black px-4 py-2">{spoc.email}</td>
                              <td className="border border-black px-4 py-2">{spoc.is_using_any_bgv_vendor}</td>
                              <td className="border border-black px-4 py-2">{spoc.vendor_name}</td>
                              <td className="border border-black px-4 py-2">{spoc.is_interested_in_using_our_services}</td>
                              <td className="border border-black px-4 py-2">{spoc.reason_for_not_using_our_services}</td>
                              <td className="border border-black px-4 py-2">{spoc.reason_for_using_our_services}</td>
                              <td className="border border-black px-4 py-2">{formatDate(spoc.callback_asked_at)}</td>
                              <td className="border border-black px-4 py-2">{spoc.is_prospect}</td>
                              <td className="border border-black px-4 py-2">{spoc.comments}</td>
                              <td className="border border-black px-4 py-2">{formatDate(spoc.followup_date)}</td>
                              <td className="border border-black px-4 py-2">{spoc.followup_comments}</td>
                              <td className="border border-black px-4 py-2">{spoc.remarks}</td>
                              <td className="py-2  px-4 border border-black">
                                <div className="flex gap-2">
                                  <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mr-2" onClick={() => handleEdit(spoc)}>Edit</button>
                                  <button className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ${deletingId === spoc.id ? "opacity-50 cursor-not-allowed" : ""}`} disabled={deletingId === spoc.id} onClick={() => handleDelete(spoc.id)}>
                                    {deletingId === spoc.id ? "Deleting..." : "Delete"}
                                  </button>
                                </div></td>
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

        </div>
      </div>
    </div>

  );
};

export default BusinessDevelopmentActivity;
