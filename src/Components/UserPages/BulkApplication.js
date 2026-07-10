import React, { useState, useRef, useEffect, useCallback } from "react";
import { FaFolderOpen } from "react-icons/fa";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Swal from 'sweetalert2';
import axios from 'axios';
import { useApiLoadingBranch } from '../BranchApiLoadingContext';
import { useNavigate } from "react-router-dom";
const BulkApplication = () => {
  const navigate = useNavigate();
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();

  const [deletingId, setDeletingId] = useState(null);
  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState([]);

  console.log('customer', customer)

  useEffect(() => {
    const branchInfo = JSON.parse(localStorage.getItem("branch"));
    if (branchInfo) {
      setBranchData(branchInfo);
    } else {
      navigate('/userLogin');
    }
  }, []);
  const [formData, setFormData] = useState({
    organizationName: customer.name,
    client_spoc_name: "",
    remarks: "",
    files: [],
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


  const [tableData, setTableData] = useState([]);
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000]; const [filteredData, setFilteredData] = useState(tableData);

  useEffect(() => {
    if (searchTerm) {
      const filtered = tableData.filter((entry) =>
        entry.title && entry.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(tableData);
    }
  }, [searchTerm, tableData]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  const handleSearch = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTerm(searchTerm); // Save search term

    const filteredData = tableData.filter((entry) => {
      const title = entry.title || ''; // Default to an empty string if undefined
      return title.toLowerCase().includes(searchTerm);
    });
    setFilteredData(filteredData); // Update filtered data based on search
  };
  const fetchData = useCallback(async () => {
    setLoading(true);
    setApiLoadingBranch(true);
    const branchData = JSON.parse(localStorage.getItem("branch"));
    if (!branchData) {
      setLoading(false);
      setApiLoadingBranch(false);
      return;
    }

    const { customer_id, branch_id } = branchData;
    const branch_token = localStorage.getItem("branch_token");
    const url = `https://api.screeningstar.co.in/branch/bulk/list?customer_id=${customer_id}&branch_id=${branch_id}&_token=${branch_token}`;

    try {
      let response;
      if (branchData?.type === "sub_user") {
        const sub_user_id = branchData?.id ?? null;
        response = await fetch(`${url}&sub_user_id=${sub_user_id}`);
      } else {
        response = await fetch(url);
      }

      const result = await response.json(); // Parse JSON regardless of status
      const newToken = result.token || result._token || branch_token || '';
      if (newToken) {
        localStorage.setItem("branch_token", newToken); // Save token even if the response is bad
      }

      if (response.ok) {
        setCustomer(result.data.customer || []);
        setFormData((prev) => ({
          ...prev,
          organizationName: result.data.customer?.name || '',
        }));
        setTableData(result.data.bulks || []);
      } else {
        console.error('Error fetching data:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setApiLoadingBranch(false)
      setLoading(false); // Ensure loading state is reset
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoadingBranch == false) {
          await validateBranchLogin();
          await fetchData();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/userLogin');
      }
    };

    initialize();
  }, [fetchData, navigate]);



  const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: type === "file" ? Array.from(files) : value, // Ensure files are stored as an array
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "", // Clear errors for this field
    }));
  };



  const handleDelete = async (id) => {
    const branch_id = JSON.parse(localStorage.getItem("branch") ?? '{}').branch_id;
    const _token = localStorage.getItem("branch_token");
    const formdata = new FormData();
    const requestOptions = {
      method: "DELETE",
      body: formdata,
      redirect: "follow"
    };

    setErrors({}); // Reset any previous errors

    // Confirm the deletion
    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(id);
        let url;
        if (branchData?.type == "sub_user" && branchData.id) {
          url = `https://api.screeningstar.co.in/branch/bulk/delete?id=${id}&branch_id=${branch_id}&_token=${_token}&sub_user_id=${branchData.id}`;
        } else {
          url = `https://api.screeningstar.co.in/branch/bulk/delete?id=${id}&branch_id=${branch_id}&_token=${_token}`;
        }

        fetch(url, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            // Ensure the token is always updated
            const newToken = result.token || result._token || '';
            if (newToken) {
              localStorage.setItem("branch_token", newToken);
            }

            if (result.status == true) {
              Swal.fire("Success!", result.message, "success");
              fetchData();
            } else {
              Swal.fire("Error!", result.message || "There was an issue deleting the item.", "error");
            }
          })
          .catch((error) => {
            console.error("Error deleting item:", error);
            Swal.fire("Error!", "An error occurred while deleting the item.", "error");
          })
          .finally(() => {
            setDeletingId(null); // Ensure deleting state is cleared in all cases
          });
      }
    });
  };





  const validateForm = () => {
    const newErrors = {};

    if (!formData.organizationName) newErrors.organizationName = "Organization name is required.";
    if (!formData.client_spoc_name) newErrors.client_spoc_name = "SPOC name is required.";
    if (!formData.remarks) newErrors.remarks = "Remarks are required.";
    if (formData.files.length === 0) newErrors.files = "Please upload at least one file.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setFormData({ organizationName: customer.name, client_spoc_name: "", remarks: "", files: [] || '' });
      setLoading(true); // Set loading to true when submission starts

      if (branchData) {
        const { customer_id, id: branch_id } = branchData;
        const branchId = branchData?.branch_id;
        const branch_token = localStorage.getItem("branch_token");

        const customerLogoFormData = new FormData();
        customerLogoFormData.append('branch_id', branchId);
        customerLogoFormData.append('_token', branch_token);
        customerLogoFormData.append('customer_id', customer_id);
        if (branchData?.type === "sub_user" && branchData.id) {
          customerLogoFormData.append('sub_user_id', `${branchData.id}`);
        }
        customerLogoFormData.append('client_spoc_name', formData.client_spoc_name);
        customerLogoFormData.append('remarks', formData.remarks);
        customerLogoFormData.append("send_mail", "1");

        const zip = new JSZip();
        formData.files.forEach((file) => zip.file(file.name, file));

        // Generate the ZIP file as a Blob
        const content = await zip.generateAsync({ type: "blob" });
        customerLogoFormData.append("zip", content, "uploaded_files.zip");

        let response; // Declare response outside the try block
        let newToken = branch_token; // Declare newToken outside so it is accessible

        try {
          // Send the form data to the API first
          response = await axios.post(
            `https://api.screeningstar.co.in/branch/bulk/create`,
            customerLogoFormData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          // Extract token from response (whether success or failure)
          newToken = response?.data?.token || response?.data?._token || branch_token;

          fetchData();
          setLoading(false); // Set loading to false on successful submission
          Swal.fire('Success!', 'Form submitted successfully!', 'success');
          setFormData({
            organizationName: "",
            client_spoc_name: "",
            remarks: "",
            files: [],
          });
          if (e.target.name === "files") {
            setFormData((prev) => ({
              ...prev,
              files: Array.from(e.target.files), // Store selected files
            }));
          } else {
            setFormData((prev) => ({
              ...prev,
              [e.target.name]: e.target.value,
            }));
          }
          saveAs(content, "uploaded_files.zip");
        } catch (err) {
          Swal.fire('Error!', `An error occurred while uploading: ${err.message}`, 'error');
        } finally {
          console.log('token save hua hai = ', newToken);

          if (newToken) {
            localStorage.setItem("branch_token", newToken);
          }
          setLoading(false); // Always stop loading in finally block
        }
      }
    }
  };
  const displayedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [displayedData, loading]);





  // Your form validation function remains the same


  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );

  // Calculate the displayed data for the current page
  return (
    <div className="bg-[#c1dff2] border border-black">
      <div className="bg-white md:p-12 p-6 w-full mx-auto">
        <form className="space-y-4 w-full text-center" onSubmit={handleSubmit}>
          <div className='md:flex space-x-4'>
            <div className="md:w-2/5">
              <div className="w-full">
                <label
                  htmlFor="organizationName"
                  className="block text-left w-full m-auto mb-2 text-gray-700"
                >
                  Organisation Name
                </label>
                <input
                  type="text"
                  name="organizationName"
                  placeholder="Organization Name"
                  value={formData.organizationName || ''}
                  readOnly
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.organizationName ? "border-red-500" : "border-gray-300"
                    } rounded-md`}
                />
                {errors.organizationName && (
                  <p className="text-red-500 text-sm">{errors.organizationName}</p>
                )}
              </div>

              {/* Full Name */}
              <div className="w-full">
                <label
                  htmlFor="client_spoc_name"
                  className="block text-left w-full m-auto mb-2 text-gray-700"
                >
                  SPOC Name<span className="text-red-500 text-xl" >*</span>
                </label>
                <select
                  name="client_spoc_name"
                  value={formData.client_spoc_name}
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.client_spoc_name ? "border-red-500" : "border-gray-300"} rounded-md`}
                >
                  <option value="" >Select SPOC Name</option>
                  <option key={customer.client_spoc_name} value={customer.client_spoc_name}>
                    {customer.client_spoc_name}
                  </option>
                </select>

                {errors.client_spoc_name && (
                  <p className="text-red-500 text-sm">{errors.client_spoc_name}</p>
                )}
              </div>

              {/* Attach Files */}
              <div className="w-full">
                <label
                  htmlFor="files"
                  className="block text-left w-full m-auto mb-2 text-gray-700"
                >
                  Attach Documents (PDF, Images, or Folders)<span className="text-red-500 text-xl" >*</span>
                </label>
                <input
                  type="file"
                  name="files"
                  multiple
                  onChange={handleChange}
                  className="w-full m-auto p-3 mb-[20px] border border-gray-300 rounded-md"
                />
                {errors.files && <p className="text-red-500 text-sm">{errors.files}</p>}
              </div>

              {/* Remarks */}
              <div className="w-full">
                <label
                  htmlFor="remarks"
                  className="block text-left w-full m-auto mb-2 text-gray-700"
                >
                  Remarks<span className="text-red-500 text-xl" >*</span>
                </label>
                <input
                  type="text"
                  name="remarks"
                  placeholder="Remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  className={`w-full m-auto p-3 mb-[20px] border ${errors.remarks ? "border-red-500" : "border-gray-300"
                    } rounded-md`}
                />
                {errors.remarks && (
                  <p className="text-red-500 text-sm">{errors.remarks}</p>
                )}
              </div>

              <div className="block text-left mb-4">
                <button
                  type="submit"
                  className={`bg-[#2c81ba] text-white py-2.5 px-[30px] text-[18px] border rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={loading}
                >
                  Submit
                </button>
              </div>
            </div>

            <div className="md:w-3/5 margin-l">
              <div className=" text-left mb-4">
                <div>
                  <input
                    type="text"
                    placeholder="Search by Title"
                    value={searchTerm}
                    onChange={handleSearch}
                    className="w-[450px] rounded-md p-2.5 border border-gray-300"
                  />
                </div>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
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
                        <th className="border border-black uppercase px-4 py-2">Sl No.</th>
                        <th className="border border-black uppercase px-4 py-2">SPOC Name</th>
                        <th className="border border-black uppercase px-4 py-2">Date</th>
                        <th className="border border-black uppercase px-4 py-2">Folder</th>
                        <th className="border border-black uppercase px-4 py-2">Remarks</th>
                        <th className="uppercase border border-black px-4 py-2 text-center" >ACTION</th>

                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-gray-500">
                            {/* Replace with your Loader component */}
                            < Loader />
                          </td>
                        </tr>
                      ) : displayedData.length === 0 ? (
                        <tr>
                          <td colSpan={17} className="py-4 text-center text-gray-500">
                            No data available in table
                          </td>
                        </tr>
                      ) : (
                        displayedData.map((entry, index) => (
                          <tr key={entry.id} className="text-center">
                            <td className="border border-black px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td className="border border-black px-4 py-2">
                              {
                                entry.client_spoc_name
                              }
                            </td>


                            <td className="border border-black px-4 py-2">{new Date(entry.created_at).toLocaleDateString().replace(/\//g, '-')}</td>
                            <td className="border border-black px-4 py-2">
                              <button
                                type="button"
                                className="bg-none text-black p-3 px-2 rounded-md text-2xl whitespace-nowrap"
                                onClick={() => {
                                  if (entry.zip) {
                                    const url = new URL(entry.zip); // Parse the URL
                                    const baseFileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1); // Extract basename
                                    const link = document.createElement('a');
                                    link.href = entry.zip;
                                    link.download = baseFileName; // Use the extracted base file name
                                    link.click();
                                  } else {
                                    alert('No ZIP file URL available.');
                                  }
                                }}
                              >
                                <FaFolderOpen />
                              </button>
                            </td>
                            <td className="border border-black px-4 py-2">{entry.remarks}</td>
                            <td className='border border-black  px-4 py-2'>
                              <button
                                type="button"
                                disabled={deletingId === entry.id}
                                onClick={() => handleDelete(entry.id)}
                                className={`bg-red-500 hover:scale-105 hover:bg-red-600  text-white px-4 py-2 rounded ${deletingId === entry.id ? "opacity-50 cursor-not-allowed" : ""} `}
                              >
                                {deletingId === entry.id ? "Deleting..." : "Delete"}
                              </button>

                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination Controls */}
              <div className="flex justify-center mt-4 space-x-2">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
                >
                  Previous
                </button>

                {(() => {
                  const maxPagesToShow = 3;
                  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
                  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

                  if (endPage - startPage + 1 < maxPagesToShow) {
                    startPage = Math.max(1, endPage - maxPagesToShow + 1);
                  }

                  const pages = [];
                  if (startPage > 1) {
                    pages.push(
                      <button
                        type="button"
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
                        type="button"
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-4 py-2 ${currentPage === page ? 'bg-[#2c81ba] text-white' : 'bg-gray-200'} rounded`}
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
                        type="button"
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
                  type="button"
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

        {/* Table */}

      </div >
    </div >
  );
};

export default BulkApplication;
