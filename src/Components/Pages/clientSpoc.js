import React, { useState, useEffect, useRef, useCallback } from "react";
import Swal from 'sweetalert2';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import swal from 'sweetalert';
import { useApiLoading } from '../ApiLoadingContext';
const ClientSpoc = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();


  const [deletingId, setDeletingId] = useState(null);
  const [spocs, setSpocs] = useState([]);
  const [error, setError] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true); // Loader statesetLoadingBtn
  const [loadingBtn, setLoadingBtn] = useState(false); // 
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
    name: "",
    designation: "",
    phone: "",
    email: "",
    email1: "",
    email2: "",
    email3: "",
    email4: "",
  });
  const [expandedSpoc, setExpandedSpoc] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpocId, setCurrentSpocId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const clientEditRef = useRef(null);



  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "SPOC Name is required";
    }
    if (!formData.designation.trim()) {
      errors.designation = "Designation is required";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Contact Number is required";
    }

    const validateEmail = (email) =>
      email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? "Invalid email format"
        : null;

    // Handle main email and email1 to email4 separately
    if (!formData.email) {
      errors.email = "Email is required";
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) errors.email = emailError;
    }

    // For email1 to email4, check if any field has an email and validate accordingly
    ["email1", "email2", "email3", "email4"].forEach((field) => {
      if (formData[field]) {
        const emailError = validateEmail(formData[field]);
        if (emailError) errors[field] = emailError;
      }
    });

    setError(errors);
    return Object.keys(errors).length === 0;
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

    const url = `https://api.screeningstar.co.in/client-spoc/list?admin_id=${admin_id}&_token=${storedToken}`;

    try {
      const response = await fetch(url, { method: "GET", redirect: "follow" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const newToken = data.token || data._token || storedToken || '';
      if (newToken) localStorage.setItem("_token", newToken);

      setSpocs(data.client_spocs);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setApiLoading(false);
      setLoading(false); // Ensure loading state is turned off
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin();
          await fetchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login');
      }
    };

    initialize();
  }, [navigate, fetchData]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const newFormData = { ...prevData, [name]: value };
      // Clear specific error for the field if valid input
      if (value.trim() && error[name]) {
        setError((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors[name];
          return newErrors;
        });
      }
      return newFormData;
    });
  };

  const handleBlur = (emailField) => {
    const email = formData[emailField];
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (email) {
      // Clear previous errors for the current email field
      setError((prevErrors) => ({ ...prevErrors, [emailField]: null }));

      // Make the API call to check if the email exists
      fetch("https://api.screeningstar.co.in/client-spoc/check-email-exists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, admin_id, _token: storedToken }),
        redirect: "follow",
      })
        .then((response) => response.json())
        .then((result) => {
          if (result.exists) {
            // Update the error state if the email already exists
            setError((prevErrors) => ({
              ...prevErrors,
              [emailField]: "Email already exists",
            }));
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          setError((prevErrors) => ({
            ...prevErrors,
            [emailField]: "An error occurred while checking email",
          }));
        });
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!validateForm()) {
      return;
    } else {
      setApiLoading(true);
      setLoading(true);
    }

    // Get admin_id and token
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      setApiLoading(false);
      setLoading(false);
      swal("Failed!", "Missing admin ID or authentication token. Please log in again.", "error");
      return;
    }

    // Prepare request body
    const raw = JSON.stringify({
      ...formData,
      admin_id,
      _token: storedToken,
    });

    const requestOptions = {
      method: isEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: raw,
    };

    // Determine URL based on whether it's editing or creating
    const url = isEditing
      ? `https://api.screeningstar.co.in/client-spoc/update`
      : `https://api.screeningstar.co.in/client-spoc/create`;

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json(); // Parse the JSON response

      if (response.ok) {
        // Reset form and handle success
        setLoading(false);
        setApiLoading(false);

        // Store new token if available
        const newToken = data.token || data._token || storedToken || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }

        // Refresh data and reset form
        fetchData();
        setFormData({ name: "", designation: "", phone: "", email: "", email1: "", email2: "", email3: "", email4: "" });
        setIsEditing(false);
        setCurrentSpocId(null);
        setError({});

        swal(
          "Success!",
          isEditing ? "Form updated successfully." : "Form submitted successfully.",
          "success"
        );
      } else {
        // Handle error from the backend
        setApiLoading(false);
        setLoading(false);
        const errorMessage = data.message || "An unexpected error occurred";
        swal("Failed!", errorMessage, "error");
        console.error("Failed to submit form:", errorMessage);
      }
    } catch (error) {
      setApiLoading(false);

      setLoading(false);
      swal("Failed!", "A network error occurred. Please try again.", "error");
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

    swal({
      title: "Are you sure?",
      text: "Once deleted, you will not be able to recover this data!",
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        setDeletingId(id); // Set the deleting ID
        fetch(
          `https://api.screeningstar.co.in/client-spoc/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
          {
            method: "DELETE",
            redirect: "follow",
          }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(`Error: ${response.statusText}`);
            }
            return response.json();
          })
          .then((result) => {
            const newToken = result.token || result._token || storedToken || "";
            if (newToken) localStorage.setItem("_token", newToken);

            swal("Deleted!", "The item has been deleted successfully.", "success");
            setDeletingId(null); // Reset deleting ID
            fetchData(); // Refresh the data or update the state
          })
          .catch((error) => {
            console.error("Delete request failed:", error);
            swal("Error!", "An error occurred while deleting the item.", "error");
            setDeletingId(null); // Reset deleting ID
          });
      }
    });
  };


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSpocs = spocs
    .filter((spoc) =>
      spoc.name && spoc.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(spocs.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const toggleExpand = (spocId) => {
    setExpandedSpoc((prev) => (prev === spocId ? null : spocId));
  };
  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );
  const handleCancel = () => {
    fetchData();
    setFormData({ name: "", designation: "", phone: "", email: "", email1: "", email2: "", email3: "", email4: "" });
    setIsEditing(false);
    setCurrentSpocId(null);
  };

  return (

    <div className="">
      <div ref={clientEditRef} className="bg-white  border-black md:p-12 p-6 border w-full mx-auto">
        <div className="md:flex space-x-4">
          <div className="md:w-2/5">
            <form className="space-y-4 ps-0 md:pr-[30px] pb-[30px]  bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block mb-2">Name of the Spoc<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded p-2"

                />
                {error.name && <p className="text-red-500">{error.name}</p>}
              </div>
              <div>
                <label htmlFor="designation" className="block mb-2">Designation<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="text"
                  id="designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full border rounded p-2"

                />
                {error.designation && <p className="text-red-500">{error.designation}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="block mb-2">Contact Number<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border rounded p-2"

                />
                {error.phone && <p className="text-red-500">{error.phone}</p>}
              </div>
              <div>
                <label htmlFor="email" className="block mb-2">Email ID<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="email"
                  onBlur={() => handleBlur(formData.email)}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded p-2"

                />
                {error.email && <p className="text-red-500">{error.email}</p>}
              </div>
              <div>
                <label htmlFor="email1" className="block mb-2">Email ID 1</label>
                <input
                  type="email"
                  onBlur={() => handleBlur(formData.email1)}
                  id="email1"
                  name="email1"
                  value={formData.email1}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
                {error.email1 && <p className="text-red-500">{error.email1}</p>}
              </div>
              <div>
                <label htmlFor="email2" className="block mb-2">Email ID 2</label>
                <input
                  type="email"
                  onBlur={() => handleBlur(formData.email2)}
                  id="email2"
                  name="email2"
                  value={formData.email2}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
                {error.email2 && <p className="text-red-500">{error.email2}</p>}
              </div>
              <div>
                <label htmlFor="email3" className="block mb-2">Email ID 3</label>
                <input
                  type="email"
                  onBlur={() => handleBlur(formData.email3)}
                  id="email3"
                  name="email3"
                  value={formData.email3}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
                {error.email3 && <p className="text-red-500">{error.email3}</p>}
              </div>
              <div>
                <label htmlFor="email4" className="block mb-2">Email ID 4</label>
                <input
                  type="email"
                  onBlur={() => handleBlur(formData.email4)}
                  id="email4"
                  name="email4"
                  value={formData.email4}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                />
                {error.email4 && <p className="text-red-500">{error.email4}</p>}
              </div>
              <div className={isEditing ? "flex gap-2" : ""}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`p-6 py-3 bg-[#2c81ba] text-white font-bold rounded-md hover:bg-[#0f5381] hover:scale-105 transition flex justify-center text-center items-center w-full duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {isEditing ? "Edit" : "Submit"}
                </button>

                {isEditing && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={`p-6 py-3 bg-red-500 text-white font-bold rounded-md hover:bg-red-600 hover:scale-105 transition flex justify-center text-center items-center w-full duration-200 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    CANCEL
                  </button>

                )}
              </div>

            </form>

          </div>
          <div className="md:w-3/5 overflow-x-auto no-margin">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by Spoc Name"
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
                <table className="min-w-full border-collapse border border-black  rounded-lg">
                  <thead className="rounded-lg">
                    <tr className="bg-[#c1dff2] text-[#4d606b] rounded-lg whitespace-nowrap">
                      <th className="py-2 px-4 border border-black  uppercase">No.</th>
                      <th className="py-2 px-4 border border-black uppercase">SPOC Name</th>
                      <th className="py-2 px-4 border border-black uppercase">Designation</th>
                      <th className="py-2 px-4 border border-black uppercase">Contact Number</th>
                      <th className="py-2 px-4 border border-black uppercase">Email ID</th>
                      <th className="py-2 px-4 border border-black border-b-0 uppercase">Actions</th>
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
                            <td colSpan={6} className="py-4 text-center text-gray-500">
                              Your Table Is Empty.
                            </td>
                          </tr>
                        ) : (
                          currentSpocs.map((spoc, index) => {
                            const emails = [spoc.email, spoc.email1, spoc.email2, spoc.email3, spoc.email4].filter(email => email);
                            const isExpanded = expandedSpoc === spoc.id;
                            return (
                              <tr key={spoc.id} className="hover:bg-gray-200">
                                <td className="py-2 px-4 border border-black">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                <td className="py-2 px-4 border border-black">{spoc.name}</td>
                                <td className="py-2 px-4 border border-black">{spoc.designation}</td>
                                <td className="py-2 px-4 border border-black">{spoc.phone}</td>
                                <td className="py-2 px-4 border border-black">
                                  <span>
                                    {isExpanded ? emails.join(', ') : emails[0]}
                                  </span>
                                  {emails.length > 1 && (
                                    <button
                                      className="text-blue-500 underline ml-2"
                                      onClick={() => toggleExpand(spoc.id)}
                                    >
                                      {isExpanded ? 'View Less' : 'View More'}
                                    </button>
                                  )}
                                </td>
                                <td className="py-3 px-4 border border-black border-x-0 border-b-0 flex gap-1">
                                  <button className="bg-green-500 hover:scale-105 hover:bg-green-600  text-white px-4 py-2 rounded mr-2" onClick={() => handleEdit(spoc)}>
                                    Edit
                                  </button>
                                  <button
                                    disabled={deletingId === spoc.id}
                                    className={`bg-red-500 hover:scale-105 hover:bg-red-600  text-white px-4 py-2 rounded ${deletingId === spoc.id ? "opacity-50 cursor-not-allowed" : ""} `}
                                    onClick={() => handleDelete(spoc.id)}>
                                    {deletingId === spoc.id ? "Deleting..." : "Delete"}
                                  </button>

                                </td>
                              </tr>
                            );
                          })
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
                  onClick={() => handlePageChange(index + 1)}
                  className={`px-3 py-1 border rounded ${currentPage === index + 1 ? "bg-[#2c81ba]  hover:bg-[#0f5381]  text-white" : "bg-gray-200"}`}
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

export default ClientSpoc;
