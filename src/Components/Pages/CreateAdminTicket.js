import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { useApiLoading } from '../ApiLoadingContext';

const CreateAdminTicket = () => {
  const [adminData, setAdminData] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
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


  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000]; const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    const adminInfo = JSON.parse(localStorage.getItem('admin'));
    if (adminInfo) {
      setAdminData(adminInfo);
    }
  }, []);

  const fetchData = async (page = 1, search = '') => {
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
    };

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/ticket/list?admin_id=${admin_id}&_token=${storedToken}&page=${page}&search=${search}`,
        requestOptions
      );
      const result = await response.json();
      const newToken = result.token || result._token || storedToken || "";
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }
      if (result.status) {
        // Flatten the tickets from the branches structure
        const allTickets = result.branches.flatMap(branch =>
          branch.branches.flatMap(b =>
            b.tickets.map(ticket => ({
              customer_name: branch.customer_name,
              client_unique_id: branch.client_unique_id,
              ticket_id: ticket.ticket_id,
              ticket_number: ticket.ticket_number,
              title: ticket.title,
              remarks: ticket.remarks,
              status: ticket.status,
              created_at: ticket.created_at,
            }))
          )
        );
        setTickets(allTickets);
        setTotalResults(allTickets.length);
      } else {
        setResponseError(result.message);
        Swal.fire('Error', result.message || 'Failed to fetch tickets.', 'error');
      }
    } catch (error) {

      console.error('Error fetching data:', error);
      Swal.fire('Error', 'Failed to fetch data.', 'error');
    } finally {
      setApiLoading(false);

      setLoading(false);
    }
  };

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
  }, [navigate]);
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchData(page, searchTerm);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to the first page when searching
  };


  const filteredTickets = tickets.filter((ticket) =>
    (ticket.customer_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (ticket.client_unique_id?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (ticket.ticket_number?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (ticket.status?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (ticket.remarks?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (ticket.title?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTickets.slice(indexOfFirstItem, indexOfLastItem);
  const handleview = (ticketNumber) => {
    navigate(`/admin-ViewAdminTicket?ticket_number=${ticketNumber}`); // Adjust this path as needed
  };

  const handleDelete = async (id) => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");
    const formdata = new FormData();
    const requestOptions = {
      method: "DELETE",
      body: formdata,
      redirect: "follow",
    };

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
        fetch(
          `https://api.screeningstar.co.in/ticket/delete?ticket_number=${id}&admin_id=${admin_id}&_token=${storedToken}`,
          requestOptions
        )
          .then((response) => response.json())
          .then((result) => {
            const newToken = result.token || result._token || storedToken || "";
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }
            Swal.fire("Deleted!", "The item has been deleted.", "success");
            fetchData();
          })
          .catch((error) => console.error(error))
          .finally(() => {
            setDeletingId(null); // Reset deleting state
          });
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
      <div className="flex flex-wrap">


        <div className="w-full">
          <div className="block justify-between mb-4">
            <div>
              <input
                type="text"
                placeholder="Search..."
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
              className="border rounded-lg px-3 py-1 text-gray-700 bg-white my-2 shadow-sm focus:ring-2 focus:ring-blue-400"
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
              <table className="min-w-full border-collapse border border-black rounded-lg overflow-scroll whitespace-nowrap">
                <thead className="rounded-lg">
                  <tr className="bg-[#c1dff2] text-[#4d606b]">
                    <th className="uppercase border border-black px-4 py-2">SL</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">Customer Name</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">Client Unique ID</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">TICKET DATE</th>

                    <th className="uppercase border border-black px-4 py-2 text-center">Ticket Number</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">Title</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">TICKET REMARKS</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">TICKET STATUS</th>
                    <th className="uppercase border border-black px-4 py-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        <div className="flex w-full justify-center items-center h-20">
                          <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center text-red-500 p-4">
                        {responseError && responseError !== "" ? responseError : "No data available in table"}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((ticket, index) => (
                      <tr key={ticket.ticket_number} className="text-center">
                        <td className="border border-black px-4 py-2">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="border border-black px-4 py-2">
                          {ticket.customer_name}
                        </td>
                        <td className="border border-black px-4 py-2">
                          {ticket.client_unique_id}
                        </td>
                        <td className="border border-black px-4 py-2">
                          {ticket.created_at
                            ? new Date(ticket.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')
                            : 'NIL'}
                        </td>
                        <td className="border border-black px-4 py-2">{ticket.ticket_number}</td>
                        <td className="border border-black px-4 py-2">{ticket.title}</td>
                        <td className="border border-black px-4 py-2">{ticket.remarks}</td>
                        <td className="border border-black px-4 py-2">{ticket.status}</td>

                        <td className="border border-black px-4 py-2">
                          <button
                            onClick={() => handleview(ticket.ticket_number)}
                            className="bg-blue-500 hover:bg-blue-600 font-bold hover:scale-105 text-white px-4 py-2 rounded-md"
                          >
                            View
                          </button>
                          <button
                            disabled={deletingId === ticket.ticket_number}
                            className={`bg-red-500 hover:scale-105 hover:bg-red-600 ml-2 text-white px-4 py-2 rounded ${deletingId === ticket.ticket_number
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                              } `}
                            onClick={() => handleDelete(ticket.ticket_number)}
                          >
                            {deletingId === ticket.ticket_number ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-4 py-2 bg-gray-300 rounded-md"
            >
              Prev
            </button>
            <span className="mx-2">
              Page {currentPage} of {Math.ceil(filteredTickets.length / itemsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={indexOfLastItem >= filteredTickets.length}
              className="px-4 py-2 bg-gray-300 rounded-md"
            >
              Next
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CreateAdminTicket;
