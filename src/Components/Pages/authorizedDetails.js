import React, { useEffect, useRef,useState, useCallback } from "react";
import Swal from 'sweetalert2'
import swal from 'sweetalert';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';

const AuthorizedDetails = () => {
  const navigate = useNavigate();
      const [deletingId, setDeletingId] = useState(null);
   const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();

  const clientEditRef = useRef(null);
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

  const [spocs, setSpocs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    phone: "",
    email: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentSpocId, setCurrentSpocId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = useCallback(() => {
    setLoading(true);
    setApiLoading(true);
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    // Check if admin_id or storedToken is missing
    if (!admin_id || !storedToken) {
      console.error('Missing admin_id or _token');
      setLoading(false); 
    setApiLoading(false);
    // Ensure loading state is turned off in case of early return
      return;
    }

    // Construct the URL with query parameters
    const url = `https://api.screeningstar.co.in/authorized-detail/list?admin_id=${admin_id}&_token=${storedToken}`;

    // Request options for GET request (no body required)
    const requestOptions = {
      method: "GET", // GET method does not need a body
      redirect: "follow",
    };

    fetch(url, requestOptions)
      .then((response) => {
        if (!response.ok) {
          // If the response is not ok, handle the token refresh
          return response.json().then((data) => {
            const newToken = data.token || data._token || storedToken;
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }
            throw new Error('Network response was not ok');
          });
        }
        return response.json(); // Process the response JSON if the response is OK
      })
      .then((result) => {
        // Set the fetched data to state, ensure it has the correct structure
        setSpocs(result.authorized_details);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
      })
      .finally(() => {
    setApiLoading(false);

        setLoading(false);  // Always turn off loading after the request completes
      });
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
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
            setApiLoading(true);
            setLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

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

    const url = isEditing
      ? `https://api.screeningstar.co.in/authorized-detail/update`
      : `https://api.screeningstar.co.in/authorized-detail/create`;

    try {
      const response = await fetch(url, requestOptions);
      if (response.ok) {
        setLoading(false);
        setApiLoading(false);

        const data = await response.json();
        console.log(`data - `, data);
        swal("Success!", data.message || 'Succesfully Created', "success");
        const newToken = data.token || data._token || storedToken || '';
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        fetchData(); // Refresh data after form submission
        setFormData({ name: "", designation: "", phone: "", email: "" });
        setIsEditing(false);
        setCurrentSpocId(null);
      } else {
            setApiLoading(false);
            setLoading(false);

        // Handle the error response dynamically
        const errorData = await response.json(); // Get error details from the response
        let errorMessage = 'Something went wrong!'; // Default message

        if (errorData?.message) {
          errorMessage = errorData.message; // Show the server error message
        } else if (errorData?.errors) {
          // Display field-specific error messages (e.g., validation errors)
          errorMessage = Object.values(errorData.errors).join(' | ');
        }

        Swal.fire("Error!", errorMessage, "error"); // Show error message dynamically
      }
    } catch (error) {
            setApiLoading(false);
            setLoading(false);
      console.error("Error submitting form:", error);
      Swal.fire("Error!", "An unexpected error occurred", "error"); // Display generic error
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

    swal({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      buttons: {
        cancel: {
          text: "Cancel",
          visible: true,
          closeModal: true,
        },
        confirm: {
          text: "Ok",
          visible: true,
          closeModal: false,
        },
      },
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        setDeletingId(id);
        fetch(`https://api.screeningstar.co.in/authorized-detail/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            const newToken = result.token || result._token || storedToken || "";
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }
            swal("Deleted!", "The item has been deleted.", "success");
            setDeletingId(null);
            fetchData(); // Refresh the table
          })
          .catch((error) => {
            console.error("Error during deletion:", error);
            swal("Error!", "Failed to delete the item. Please try again.", "error");
            setDeletingId(null);
          });
      }
    });
  };

  const handleCancel = () => {
    fetchData();
    setFormData({ name: "", designation: "", phone: "", email: "" });
    setIsEditing(false);
    setCurrentSpocId(null);
};

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Updated filtering logic
  const currentSpocs = spocs
    .filter((spoc) => spoc.name && spoc.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(spocs.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] text-center rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );

  return (
    <div className="">
      <div ref={clientEditRef} className="bg-white md:p-12 p-6  border w-full border-black mx-auto">
        <div className="md:flex space-x-4">

          <div className="md:w-2/5">
            <form className="space-y-4 ps-0 md:pr-[30px] pb-[30px] bg-white rounded-md" id="client-spoc" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block mb-2">Name of the Authorized Person<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
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
                  required
                />
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
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block mb-2">Email ID<span className="text-red-500 text-xl" >*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
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
                placeholder="Search by Authorized Person Name"
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
                <thead className="rounded-lg">
                  <tr className="bg-[#c1dff2] text-[#4d606b] text-left rounded-lg whitespace-nowrap">
                    <th className="py-2 px-4 border border-black uppercase">No.</th>
                    <th className="py-2 px-4 border border-black uppercase">Name of the Authorized Person</th>
                    <th className="py-2 px-4 border border-black uppercase">Designation</th>
                    <th className="py-2 px-4 border border-black uppercase">Contact Number</th>
                    <th className="py-2 px-4 border border-black uppercase">Email ID</th>
                    <th className="py-2 px-4 border border-black uppercase text-center">Actions</th>
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
                          <td colSpan="6" className="py-4 text-center text-gray-500">
                            Your table is empty.
                          </td>
                        </tr>
                      ) : (
                        currentSpocs.map((spoc, index) => (
                          <tr key={spoc.id} className="hover:bg-gray-200 text-left">
                            <td className="py-2 px-4 border border-black">{index + 1 + indexOfFirstItem}</td>
                            <td className="py-2 px-4 border border-black">{spoc.name}</td>
                            <td className="py-2 px-4 border border-black">{spoc.designation}</td>
                            <td className="py-2 px-4 border border-black">{spoc.phone}</td>
                            <td className="py-2 px-4 border border-black">{spoc.email}</td>
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
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-[#2c81ba] hover:bg-[#0f5381]  text-white" : ""}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthorizedDetails;
