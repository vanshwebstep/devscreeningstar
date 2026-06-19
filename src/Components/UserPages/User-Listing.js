import React, { useEffect, useState, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { useApiLoadingBranch } from '../BranchApiLoadingContext';
import { useNavigate } from 'react-router-dom';

const UserListing = () => {
  const navigate = useNavigate();
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();
  const [branchData, setBranchData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingUser, setEditingUser] = useState(null); // Store the user being edited
  const [selectedFields, setSelectedFields] = useState({}); // Store selected fields to edit

  const [rowsPerPage, setRowsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];

  useEffect(() => {
    const branchInfo = JSON.parse(localStorage.getItem('branch'));
    if (branchInfo) {
      setBranchData(branchInfo);
    }
  }, []);

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

  const fetchData = async () => {
    setApiLoadingBranch(true);
    const branchData = JSON.parse(localStorage.getItem('branch'));
    const branch_id = branchData?.branch_id;
    const branch_token = localStorage.getItem('branch_token');
    const branch_type = branchData?.id
    // Get branch type from localStorage

    // Construct the base URL
    let url = `https://api.screeningstar.co.in/branch/sub-user/list?branch_id=${branch_id}&_token=${branch_token}`;

    // Conditionally add sub_user_id to the URL if branch_type is 'subuser'
    if (branchData?.type == "sub_user") {
      url += `&sub_user_id=${branch_type}`;
    }

    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
    };

    try {
      const response = await fetch(url, requestOptions);
      const result = await response.json();

      const newToken = result.token || result._token || localStorage.getItem('branch_token') || "";
      if (newToken) {
        localStorage.setItem("branch_token", newToken); // Ensure token name consistency
      }
      setData(result.subUsers || []);
      setFilteredData(result.subUsers || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'Failed to fetch data.', 'error');
    } finally {
      setApiLoadingBranch(false);
      setLoading(false);
    }
  };

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
  }, [navigate]);
  const totalPages = useMemo(() => Math.ceil(filteredData.length / rowsPerPage), [filteredData]);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);
    const filtered = data.filter((item) =>
      item.email?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredData(filtered);
  };

  const handleEdit = (client) => {
    setEditingUser(client);
    setSelectedFields({
      email: client.email || '',
      // Add other fields as needed
    });
  };

  const handleFieldChange = (field, value) => {
    setSelectedFields((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setSaveLoading(true); // Start loading state

    const { id } = editingUser;
    const { email } = selectedFields;
    const branch_id = branchData?.branch_id;
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');

    const rawData = {
      id,
      branch_id,
      _token: localStorage.getItem('branch_token'),
      email,
    };

    if (branchData?.type === "sub_user" && branchData.id) {
      rawData.sub_user_id = `${branchData.id}`;
    }
    const raw = JSON.stringify(rawData);

    const requestOptions = {
      method: 'PUT',
      headers: myHeaders,
      body: raw,
      redirect: 'follow',
    };

    try {
      const response = await fetch('https://api.screeningstar.co.in/branch/sub-user/update-email', requestOptions);
      const result = await response.json();  // Assuming the API returns a JSON object

      const newToken = result.token || result._token || localStorage.getItem('branch_token') || "";
      if (newToken) {
        localStorage.setItem("branch_token", newToken); // Ensure token name consistency
      }
      if (response.ok) {
        Swal.fire('Success', result.message || 'User updated successfully', 'success');
        setEditingUser(null); // Reset the editing form
        fetchData(); // Refetch data to reflect changes
      } else {
        Swal.fire('Error', result.message || 'Failed to update user.', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      Swal.fire('Error', error.message || 'An error occurred while updating the user.', 'error');
    } finally {
      setSaveLoading(false); // Stop loading state after request completes
    }
  };


  const handleCancelEdit = () => {
    setEditingUser(null); // Reset and go back to the table
  };

  const handlePageChange = (page) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const paginatedData = useMemo(() => {
    if (filteredData && filteredData.length > 0) {
      return filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    }
    return [];
  }, [filteredData, currentPage, rowsPerPage]);

  const handleDelete = async (id) => {
    const branch_id = branchData?.branch_id;
    const _token = localStorage.getItem("branch_token");
    const formdata = new FormData();
    const requestOptions = {
      method: "DELETE",
      body: formdata,
      redirect: "follow",
    };

    // Store the base URL in a variable
    let url = `https://api.screeningstar.co.in/branch/sub-user/delete?id=${id}&branch_id=${branch_id}&_token=${_token}`;

    // Conditionally add sub_user_id if the condition is met
    if (branchData?.type === "sub_user" && branchData.id) {
      url += `&sub_user_id=${branchData.id}`;
    }

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        setDeletingId(id);

        fetch(url, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            // Update token if provided in the response
            const newToken = result.token || result._token || _token || "";
            if (newToken) {
              localStorage.setItem("branch_token", newToken); // Ensure token name consistency
            }

            Swal.fire("Deleted!", "The item has been deleted.", "success");
            fetchData(); // Refresh the data after deletion
          })
          .catch((error) => {
            console.error("Error during deletion:", error);
            Swal.fire("Error!", "Something went wrong. Please try again.", "error");
          })
          .finally(() => {
            setDeletingId(null); // Always reset deletingId
          });
      }
    });
  };
  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [paginatedData, loading]);

  
  return (
    <div className="w-full bg-[#c1dff2] overflow-hidden">
      <div className="border border-black space-y-4 py-[30px] md:px-[51px] px-6 bg-white">
        {editingUser ? (
          <div>
            <h2>Edit User</h2>

            <div className="mb-4">
              <input
                type="email"
                placeholder="Email"
                value={selectedFields.email || ''}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                className="w-full rounded-md p-2.5 border border-gray-300"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={saveLoading} // Disable while loading
              className={`bg-green-500 text-white font-bold transition duration-200 px-4 py-2 rounded mr-3 ${saveLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
                }`}
            >
              {saveLoading ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick={handleCancelEdit}
              className="bg-red-500 text-white hover:scale-105 font-bold  transition duration-200  px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <div className=" md:w-1/2 w-full text-left">
                <input
                  type="text"
                  placeholder="Search by Email"
                  className="w-full rounded-md p-2.5 border border-gray-300"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
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
            </div>

            <div className="table-container rounded-lg">
              {/* Top Scroll */}
              <div className="top-scroll" ref={topScrollRef} onScroll={syncScroll}>
                <div className="top-scroll-inner" style={{ width: scrollWidth }} />
              </div>

              {/* Actual Table Scroll */}
              <div className="table-scroll rounded-lg" ref={tableScrollRef} onScroll={syncScroll}>


                <table className="min-w-full border-collapse border border-black rounded-lg">
                  <thead className="rounded-lg border border-black">
                    <tr className="bg-[#c1dff2] text-[#4d606b] whitespace-nowrap text-left">
                      <th className="uppercase border border-black px-4 py-2 text-center">SL</th>
                      <th className="uppercase border border-black px-4 py-2">Email</th>
                      <th className="uppercase border border-black px-4 py-2 text-center" colSpan={2}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="12" className="py-10 text-center">
                          <div className="flex justify-center items-center w-full h-full">
                            <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                          </div>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan="21" className="text-center py-4 text-gray-500">
                          No data available in table.
                        </td>
                      </tr>
                    ) : (
                      paginatedData.map((client, index) => (
                        <tr key={client.clientId || index} className="border-b border-gray-300 text-left">
                          <td className="border border-black px-4 py-2 text-center">
                            {(currentPage - 1) * rowsPerPage + index + 1}
                          </td>
                          <td className="border border-black px-4 py-2 min-w-[200px]">{client.email}</td>
                          <td className="px-4 py-2 gap-1 text-center border-black border items-center">
                            <div className="flex gap-1 justify-center ">
                              <button
                                onClick={() => handleEdit(client)}
                                className="bg-green-500 hover:scale-105  transition duration-200 hover:bg-green-600  text-white px-4 py-2 rounded mr-3"
                              >
                                Edit
                              </button>
                              <button
                                disabled={deletingId === client.id}
                                onClick={() => handleDelete(client.id)}
                                className={`bg-red-500 hover:scale-105  transition duration-200 hover:bg-red-600   text-white px-4 py-2 rounded ${deletingId === client.id ? "opacity-50 cursor-not-allowed" : ""} `}
                              >
                                {deletingId === client.id ? "Deleting..." : "Delete"}
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserListing;
