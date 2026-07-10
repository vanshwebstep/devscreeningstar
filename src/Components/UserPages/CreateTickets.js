import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useApiLoadingBranch } from '../BranchApiLoadingContext';


const CreateTickets = () => {
  const [deletingId, setDeletingId] = useState(null);
  const { validateBranchLogin, setApiLoadingBranch, apiLoadingBranch } = useApiLoadingBranch();

  const [branchData, setBranchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];
  const [searchTerm, setSearchTerm] = useState('');
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();
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
    title: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const branchInfo = JSON.parse(localStorage.getItem('branch'));
    if (branchInfo) {
      setBranchData(branchInfo);
    }
  }, []);

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    setApiLoadingBranch(true);
    const branch_id = JSON.parse(localStorage.getItem('branch'))?.branch_id;
    const branch_token = localStorage.getItem('branch_token');
    const branchData = JSON.parse(localStorage.getItem('branch')); // Assuming branchData is stored in localStorage

    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
    };

    let url = `https://api.screeningstar.co.in/branch/ticket/list?branch_id=${branch_id}&_token=${branch_token}&page=${page}&search=${search}`;

    // Conditionally append sub_user_id if the condition is met
    if (branchData?.type == "sub_user" && branchData.id) {
      url += `&sub_user_id=${branchData.id}`;
    }

    try {
      const response = await fetch(url, requestOptions);
      const result = await response.json();

      if (result.status) {
        setTickets(result.branches || []);
        setTotalResults(result.totalResults || 0);
      } else {
        Swal.fire('Error', result.message || 'Failed to fetch tickets.', 'error');
      }
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const branch_id = branchData?.branch_id;
    const branch_token = localStorage.getItem('branch_token');
    const newErrors = {};

    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    setErrors({});
    try {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');

      const rawData = {
        branch_id: branch_id,
        _token: branch_token,
        title: formData.title,
        sub_user_id: null,
        description: formData.description,
      };


      if (branchData?.type === "sub_user" && branchData.id) {
        rawData.sub_user_id = `${branchData.id}`;
      }

      const raw = JSON.stringify(rawData);


      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };




      const response = await fetch('https://api.screeningstar.co.in/branch/ticket/create', requestOptions);

      if (response.ok) {
        const result = await response.json();
        Swal.fire('Success', result.message || 'Ticket Created Succesfully', 'success');
        setFormData({ title: '', description: '' });
        fetchData(); // Refresh the list
      } else {
        const errorData = await response.json();
        Swal.fire('Error', errorData.message || 'Failed to create ticket.', 'error');
      }
    } catch (error) {
      Swal.fire('Error', 'An error occurred. Please try again.', 'error');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page, searchTerm);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };
  const filteredTickets = tickets.filter((ticket) =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const handleview = (ticketNumber) => {
    navigate(`/user-viewTicket?ticket_number=${ticketNumber}`); // Adjust this path as needed
  };
  const handleDelete = async (id) => {
    const branch_id = branchData?.branch_id;
    const _token = localStorage.getItem("branch_token");

    if (!_token) {
      Swal.fire("Error", "Token not found. Please log in again.", "error");
      return;
    }

    const url =
      branchData?.type === "sub_user" && branchData.id
        ? `https://api.screeningstar.co.in/branch/ticket/delete?ticket_number=${id}&branch_id=${branch_id}&_token=${_token}&sub_user_id=${branchData.id}`
        : `https://api.screeningstar.co.in/branch/ticket/delete?ticket_number=${id}&branch_id=${branch_id}&_token=${_token}`;

    const requestOptions = {
      method: "DELETE",
      redirect: "follow",
    };

    Swal.fire({
      title: "Are you sure?",
      text: "Do you really want to delete this item?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeletingId(id);

        try {
          const response = await fetch(url, requestOptions);
          const result = await response.json();

          if (response.ok) {
            const newToken = result.token || result._token || "";
            if (newToken) {
              localStorage.setItem("branch_token", newToken);
            }

            Swal.fire("Deleted!", "The item has been deleted.", "success");
            fetchData(); // Refresh the data after deletion
          } else {
            Swal.fire("Error", result.message || "Failed to delete the item.", "error");
          }
        } catch (error) {
          console.error("Error deleting item:", error);
          Swal.fire("Error", "An error occurred while deleting the item.", "error");
        } finally {
          setDeletingId(null); // Reset deleting state
        }
      }
    });
  };
          useEffect(() => {
      if (tableScrollRef.current) {
        setScrollWidth(tableScrollRef.current.scrollWidth + "px");
      }
    }, [currentItems, loading]); 

  return (
    <div className="bg-white border-black border md:p-12 p-6 w-full mx-auto">
      <div className="md:flex flex-wrap">
        <div className="md:w-2/5">
          <form className="space-y-4 py-[30px] md:px-[51px]  bg-white rounded-md" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full p-3 mb-[20px] bg-[#f7f6fb] border ${errors.title ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleChange}
                className={`w-full p-3 mb-[20px] bg-[#f7f6fb] border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-md`}
              />
            </div>
            <div className="text-left">
              <button
                type="submit"
                className={`bg-[#2c81ba] text-white py-2.5 px-[30px] text-[18px] border rounded-md hover:bg-[#0f5381] ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={loading}
              >
                Submit
              </button>
            </div>
          </form>
        </div>

        <div className="md:w-3/5">
          <div className="mb-4">
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
              <table className="min-w-full border-collapse border border-black rounded-lg overflow-scroll whitespace-nowrap">
                <thead className="rounded-lg">
                  <tr className="bg-[#c1dff2] text-[#4d606b]">
                    <th className="uppercase border border-black px-4 py-2">SL</th>
                    <th className="uppercase border border-black px-4 py-2 text-left">Title</th>
                    <th className="uppercase border border-black px-4 py-2 text-left">Ticket Number</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">Created At</th>
                    <th className="uppercase border border-black px-4 py-2 text-center" colSpan={2}>ACTION</th>

                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4">
                        <div className="flex w-full justify-center items-center h-20">
                          <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length > 0 ? (
                    currentItems.map((ticket, index) => (
                      <tr key={ticket.id} className="text-center">
                        <td className="border border-black px-4 py-2">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="border border-black px-4 py-2 text-left">{ticket.title}</td>
                        <td className="border border-black px-4 py-2">{ticket.ticket_number}</td>
                        <td className="border border-black px-4 py-2">{new Date(ticket.created_at).toLocaleDateString().replace(/\//g, '-')}</td>
                        <td className='border border-black  px-4 py-2'> <button
                          onClick={() => handleview(ticket.ticket_number)}
                          className="bg-blue-500 text-white hover:scale-105 px-4 py-2 hover:bg-blue-800 rounded-md mr-2"
                        >
                          View
                        </button>
                        </td>
                        <td className='border border-black  px-4 py-2'>

                          <button
                            disabled={deletingId === ticket.ticket_number}
                            className={`bg-red-500 hover:scale-105 hover:bg-red-600  text-white px-4 py-2 rounded ${deletingId === ticket.ticket_number ? "opacity-50 cursor-not-allowed" : ""} `}
                            onClick={() => handleDelete(ticket.ticket_number)}>
                            {deletingId === ticket.ticket_number ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-4">
                        No tickets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 text-center">
            {[...Array(Math.ceil(totalResults / itemsPerPage)).keys()].map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page + 1)}
                className={`mx-1 px-3 py-1 rounded-md ${currentPage === page + 1 ? 'bg-[#2c81ba] text-white' : 'bg-gray-200'}`}
              >
                {page + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTickets;