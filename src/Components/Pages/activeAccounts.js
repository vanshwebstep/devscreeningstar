import React, { useEffect, useState,useRef, useCallback } from 'react';
import Modal from 'react-modal';
import { useApiLoading } from '../ApiLoadingContext';
import * as XLSX from 'xlsx';
import { useClientContext } from "./ClientContext";
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { use } from 'react';
import Default from "../../imgs/default.png"

Modal.setAppElement('#root'); // Make sure to set the app element for accessibility
const ActiveAccounts = () => {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalServices, setModalServices] = useState([]);
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeList, setActiveList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchViewLoading, setBranchViewLoading] = useState(false);
  const { selectedClient, setSelectedClient } = useClientContext();
  const [expandedServices, setExpandedServices] = useState({});
  const [errors, setErrors] = useState({});
  const [viewBranchesRow, setViewBranchesRow] = useState(null);
  const [branchesData, setBranchesData] = useState([]);
  const storedToken = localStorage.getItem('_token'); // Ensure the token is stored correctly
  const maxVisibleServices = 1;
  const [showModal, setShowModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedEmail, setUpdatedEmail] = useState('');
  const [isBlockLoading, setIsBlockLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200,500,1000];
  const totalPages = Math.ceil(activeList.length / rowsPerPage);

  console.log('thisscedclien', selectedClient);


  const handleEditClick = (branch) => {
    setCurrentBranch(branch);
    setUpdatedName(branch.name);
    setUpdatedEmail(branch.email);
    setShowModal(true);

  };
  const handleViewMore = (services) => {
    setModalServices(services);
    setIsModalOpen(true);
  };

  const handleCloseServiceModal = () => {
    setIsModalOpen(false);
  };
  const handleCloseModal = () => {
    setShowModal(false);
  };
  const handleSubmit = (e) => {
    e.preventDefault();

    setIsUpdateLoading(true); // Set loading state to true

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    const raw = JSON.stringify({
      id: currentBranch.id,
      name: updatedName,
      email: updatedEmail,
      admin_id: admin_id,
      _token: storedToken,
    });

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("https://api.screeningstar.co.in/branch/update", requestOptions)
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            const newToken = data.token || data._token;
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }
            throw new Error(`Error: ${response.status} ${response.statusText}`);
          });
        }

        return response.json();
      })
      .then((result) => {
        const newToken = result.token || result._token;
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        if (!result.status) {
          Swal.fire("Error", result.message || "An unknown error occurred", "error");
        } else {
          setCurrentBranch(null)
          Swal.fire("Success", result.message || "Operation was successful", "success");
          handleViewBranchesClick();
        }
      })
      .catch((error) => {
        console.error(error);
        Swal.fire("An error occurred", error.message, "error");
      })
      .finally(() => {
        setIsUpdateLoading(false);
        setCurrentBranch(null) // Reset loading state
      });
  };

  const toggleExpanded = (serviceIndex) => {
    setExpandedServices((prevState) => ({
      ...prevState,
      [serviceIndex]: !prevState[serviceIndex], // Toggle the expansion for this specific serviceIndex
    }));
  };

  const fetchActiveAccounts = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      Swal.fire({
        icon: "error",
        title: "Authentication Error",
        text: "Admin ID or token not found. Please log in.",
      });
      setApiLoading(false);
      setLoading(false);
    }

    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/customer/list?admin_id=${admin_id}&_token=${storedToken}`,
        { method: "GET", redirect: "follow" }
      );
      const data = await response.json();
      if (!response.ok) {

        Swal.fire('Error!', `${data.message}`, 'error');
        setResponseError(data.message);
        const errorMessage = data?.message || `Error: ${response.status} ${response.statusText}`;

        Swal.fire({
          icon: "error",
          title: "Fetch Error",
          text: errorMessage,
        });
        if (data.token || data._token) {
          localStorage.setItem("_token", data.token || data._token);
        }
        throw new Error(errorMessage);
      }

      // If successful, update token and store results
      if (data.token || data._token) {
        localStorage.setItem("_token", data.token || data._token);
      }
      console.log('datcustomersa', data)

      setActiveList(data.customers);




    } catch (error) {
      console.error("Failed to fetch active accounts:", error);
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
          await fetchActiveAccounts();
        }
        // Fetch data after verification
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login'); // Redirect if validation fails
      }
    };

    initialize(); // Execute the sequence
  }, [navigate, fetchActiveAccounts]);


  const handleBlock = async (id) => {
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    // Check if admin_id or storedToken is missing
    if (!admin_id || !storedToken) {
      console.error("Missing admin_id or _token");
      return;
    }

    // Show confirmation alert
    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, block it!",
    });

    if (confirmation.isConfirmed) {
      setIsBlockLoading(true);
      setActiveId(id);
      try {
        const response = await fetch(
          `https://api.screeningstar.co.in/customer/inactive?customer_id=${id}&admin_id=${admin_id}&_token=${storedToken}`,
          {
            method: "GET",
            redirect: "follow",
          }
        );
        const result = await response.json();

        const newToken = result.token || result._token;
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        Swal.fire("Blocked!", "The customer has been blocked successfully.", "success");

        fetchActiveAccounts(); // Refresh active accounts
      } catch (error) {
        console.error("Failed to block customer:", error);
      } finally {
        setIsBlockLoading(false);
        setActiveId(null); // Reset loading state
      }
    }
  };

  const handleDelete = useCallback((id, name) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Are you sure you want to delete "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        setIsDeleteLoading(true);
        setActiveId(id);
  
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        const formdata = new FormData();
  
        const requestOptions = {
          method: "DELETE",
          body: formdata,
          redirect: "follow",
        };
  
        fetch(`https://api.screeningstar.co.in/customer/delete?id=${id}&admin_id=${admin_id}&_token=${storedToken}`, requestOptions)
          .then((response) => response.json()) // Parse as JSON
          .then((result) => {
            const newToken = result.token || result._token || '';
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }
  
            if (result.status == true) {
              fetchActiveAccounts();
              Swal.fire('Deleted!', result.message || `"${name}" has been deleted.`, 'success');
            } else {
              Swal.fire('Failed!', result.message || 'Could not delete the customer.', 'warning');
            }
          })
          .catch((error) => {
            console.error(error);
            Swal.fire('Error!', error.message || 'There was an issue deleting the customer.', 'error');
          })
          .finally(() => {
            setIsDeleteLoading(false);
            setActiveId(null);
          });
      }
    });
  }, [fetchActiveAccounts]);
  


  const handleViewBranchesClick = async (clientId) => {
    if (viewBranchesRow === clientId) {
      // Hide branches if already visible
      setViewBranchesRow(null);
      setBranchesData([]);
      setShowModal(false); // Close modal
      return;
    }

    setBranchViewLoading(true);
    setActiveId(clientId); // Start loading state

    try {
      const adminData = JSON.parse(localStorage.getItem("admin"));
      const adminId = adminData?.id;
      const token = localStorage.getItem("_token");

      if (!adminId || !token) {
        throw new Error("Admin ID or Token not found in localStorage");
      }

      const url = `https://api.screeningstar.co.in/branch/list-by-customer?customer_id=${clientId}&admin_id=${adminId}&_token=${token}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(`Fetch error: ${response.status} ${response.statusText}`);
      }

      // Update token if a new one is provided
      const newToken = result.token || result._token || "";
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      // Check if the API returned valid branch data
      if (result.status === true && Array.isArray(result.branches)) {
        setViewBranchesRow(clientId); // Set the current row
        setBranchesData(result.branches); // Update branch data
        setShowModal(true); // Open modal
      } else {
        throw new Error("Invalid response: Missing or incorrect branch data");
      }
    } catch (error) {
      console.error("Error fetching branch data:", error.message);
    } finally {
      setBranchViewLoading(false);
      setActiveId(null)// End loading state
    }
  };

  const handleEdit = (client) => {
    navigate('/admin-editclient');
    setSelectedClient(client);
  };

  const handleDeleteBranch = useCallback((branch) => {
    Swal.fire({
      title: `Are you sure you want to delete the ${branch.name} branch?`,
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
        const token = localStorage.getItem('_token');

        const formdata = new FormData();
        setShowModal(true);

        const requestOptions = {
          method: "DELETE",
          body: formdata,
          redirect: "follow"
        };

        fetch(`https://api.screeningstar.co.in/branch/delete?id=${branch.id}&admin_id=${adminId}&_token=${token}`, requestOptions)
          .then((response) => response.json())
          .then((result) => {
            setShowModal(false);

            const newToken = result.token || result._token || '';
            if (newToken) {
              localStorage.setItem("_token", newToken);
            }

            setBranchesData((prevData) => prevData.filter((item) => item.id !== branch.id));
            Swal.fire('Deleted!', `${branch.name} branch has been deleted.`, 'success');
            fetchActiveAccounts();

          })
          .catch((error) => {
            console.error(error);
            Swal.fire('Error!', `There was an issue deleting the ${branch.name} branch.`, 'error');
          });
      } else {
        Swal.fire('Cancelled', `${branch.name} branch deletion was cancelled.`, 'info');
      }
    });
  }, [branchesData]); // Depend on branchesData to ensure it's updated correctly


  const Loader = () => (
    <div className="flex w-full bg-white justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );

  const changePage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const renderPageNumbers = () => {
    const visiblePages = 5; // Number of page buttons to show
    const pageNumbers = [];

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pageNumbers.push(i);
      } else if (
        pageNumbers[pageNumbers.length - 1] !== "..."
      ) {
        pageNumbers.push("...");
      }
    }
    return pageNumbers.map((number, index) => (
      <button
        key={index}
        onClick={() => number !== "..." && changePage(number)}
        className={`px-4 py-2 rounded ${number === currentPage
          ? "bg-blue-500 text-white"
          : "bg-gray-300"
          } ${number === "..." ? "cursor-default" : ""}`}
        disabled={number === "..."}
      >
        {number}
      </button>
    ));
  };
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };


  const filteredData = activeList.filter(client => {
    return client.name.toLowerCase().includes(searchTerm.toLowerCase());
  });
    const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  console.log('filteredData', filteredData)
  // Handle the change in search input
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  setCurrentPage(1)
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    const data = filteredData.map((client, index) => [
      (currentPage - 1) * rowsPerPage + index + 1,
      client.client_unique_id,
      client.name,
      client.address,
      client.emails ? JSON.parse(client.emails).join(', ') : 'NIL',
      client.state,
      client.state_code,
      client.gst_number,
      client.mobile,
      client.tat_days,
      client.agreement_date
        ? new Date(client.agreement_date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        : 'NIL',
      client.client_standard,
      client.agreement_duration
        ? new Date(client.agreement_duration).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
        : 'NIL',
      client.logo ? 'Logo Exists' : 'No Logo',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([
      ['SL', 'Client ID', 'Company Name', 'Registered Address', 'Email', 'State', 'State Code', 'GST Number', 'Mobile Number', 'TAT', 'Date of Service Agreement', 'Standard Process', 'Agreement Period', 'Upload Client Logo', 'Scope of Services'],
      ...data
    ]);

    XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    XLSX.writeFile(wb, 'clients_data.xlsx');
  };
  useEffect(() => {
    if (tableScrollRef.current) {
      setScrollWidth(tableScrollRef.current.scrollWidth + "px");
    }
  }, [paginatedData, loading]); // recalc whenever data changes


  const handleUpdateBranch = () => {
    if (!currentBranch) return;
    setIsUpdateLoading(true);
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    const token = localStorage.getItem('_token');

    const body = JSON.stringify({
      id: currentBranch.id,
      name: updatedName,
      email: updatedEmail,
      admin_id: adminId,
      _token: token,
    });

    const requestOptions = {
      method: "PUT",
      headers: myHeaders,
      body: body,
      redirect: "follow",
    };

    fetch("https://api.screeningstar.co.in/branch/update", requestOptions)
      .then((response) => response.json())
      .then((result) => {
        if (result.k) {
          // If response contains "k", treat it as success
          console.log("Update successful:", result);
          setIsUpdateLoading(false);
          setCurrentBranch(null)
          Swal.fire({
            title: 'Success!',
            text: result.message || 'Branch updated successfully.',
            icon: 'success',
            confirmButtonText: 'OK'
          });

          setShowModal(false); // Close the modal
        } else {
          setIsUpdateLoading(false);
          setCurrentBranch(null);
          setShowModal(false)
          Swal.fire({
            title: 'Success!',
            text: result.message || 'Failed to update branch. Please try again.',
            icon: 'success',
            confirmButtonText: 'OK'
          });
        }
      })
      .catch((error) => {
        console.error("Error updating branch:", error);
        setIsUpdateLoading(false);
        // SweetAlert error in case of network or other errors
        Swal.fire({
          title: 'Error!',
          text: 'Failed to update branch. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      });
  };


  return (
    <div className="w-full bg-[#c1dff2] overflow-hidden">
      <div className="border border-black space-y-4 py-[30px] md:px-[51px] px-6  bg-white">

        <div className='md:flex justify-between items-center'>
          <div className="text-left">
            <div>
              <button
                className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-6 py-2 rounded"
                onClick={handleDownloadExcel}
              >
                Export to Excel
              </button>

            </div>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border rounded-lg px-3 py-1 text-gray-700 bg-white mt-4 shadow-sm focus:ring-2 focus:ring-blue-400"
            >
              {optionsPerPage.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4 md:w-1/2 text-right">
            <input
              type="text"
              placeholder="Search by Company Name"
              className="w-full rounded-md p-2.5 border border-gray-300"
              value={searchTerm}
              onChange={handleSearchChange}
            />
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
                <th className=" uppercase border  border-black px-4 py-2 text-center">SL</th>
                <th className=" uppercase border  border-black px-4 py-2">Client ID</th>
                <th className=" uppercase border  border-black px-4 py-2">Company Name</th>
                <th className=" uppercase border  border-black px-4 py-2">Registered Address</th>
                <th className=" uppercase border  border-black px-4 py-2">Email</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">State</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">State Code</th>
                <th className=" uppercase border  border-black px-4 py-2">GST Number</th>
                <th className=" uppercase border  border-black px-4 py-2">Mobile Number</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">TAT</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Date of Service Agreement</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Standard Process</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Agreement Period</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Upload Client Logo</th>
                <th className=" uppercase border  border-black px-4 py-2">Scope of Services</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Additional Login Required?</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Created At</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center">Updated At</th>
                <th className=" uppercase border  border-black px-4 py-2 text-center" colSpan={2}>
                  Action
                </th>
              </tr>
            </thead>
            {loading ? (
              <tbody className="h-10">
                <tr className="">
                  <td colSpan="12" className="w-full py-10 h-10  text-center">
                    <div className="flex justify-center  items-center w-full h-full">
                      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="21" className="text-center py-4 text-red-500">
                      {responseError && responseError !== "" ? responseError : "No data available in table"}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((client, index) => {
                    const services = client.services ? JSON.parse(client.services).flatMap(group => group.services) : [];
                    console.log('this is my client ', client)
                    return (
                      <tr key={client.clientId} className="border-b border-gray-300 text-left">
                        <td className="border  border-black px-4 py-2 text-center">
                          {(currentPage - 1) * rowsPerPage + index + 1}
                        </td>
                        <td className="border  border-black px-4 py-2 whitespace-nowrap">{client.client_unique_id || 'null'}</td>
                        <td className="border  border-black px-4 py-2 min-w-[200px] whitespace-nowrap">{client.name || 'null'}</td>
                        <td className="border  border-black px-4 py-2">{client.address || 'null'}</td>
                        <td className="border  border-black px-4 py-2">
                          {client.emails ? JSON.parse(client.emails).join(', ') : 'NIL'}
                        </td>
                        <td className="border  border-black px-4 py-2 text-center">{client.state || 'null'}</td>
                        <td className="border  border-black px-4 py-2 text-center">{client.state_code || 'null'}</td>
                        <td className="border  border-black px-4 py-2 min-w-[200px] whitespace-nowrap">{client.gst_number || 'null'}</td>
                        <td className="border  border-black px-4 py-2 min-w-[200px]">{client.mobile || 'null'}</td>
                        <td className="border  border-black px-4 py-2 text-center whitespace-nowrap">{client.tat_days}</td>
                        <td className="border  border-black px-4 py-2 min-w-[300px] text-center">
                          {client.agreement_date
                            ? new Date(client.agreement_date).toLocaleDateString('en-GB').replace(/\//g, '-')
                            : 'NIL'}
                        </td>
                        <td className="border  border-black px-4 py-2 min-w-[300px] text-center">{client.client_standard || 'null'}</td>
                        <td className="border border-black px-4 py-2 text-center">
                          {client.agreement_duration && !isNaN(new Date(client.agreement_duration))
                            ? new Date(client.agreement_duration).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                            : client.agreement_duration || 'No date available'}
                        </td>


                        <td className="border  border-black px-4 py-2 text-center">
                          <img
                            src={client.logo ? client.logo : `${Default}`}
                            alt="Client Logo"
                            className="w-10 text-center m-auto h-10"
                          />
                        </td>
                        <td className="border  border-black px-4 py-2 text-center">
                          <div className="flex items-center">
                            {services.length > 0 ? (
                              <>
                                <span className="px-4 py-2 bg-blue-100 whitespace-nowrap border border-blue-500 rounded-lg text-sm">
                                  {services[0].serviceTitle}
                                </span>
                                {services.length > 1 && (
                                  <button
                                    className="text-blue-500 whitespace-nowrap ml-2"
                                    onClick={() => handleViewMore(services)}
                                  >
                                    View More
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="px-4 py-2 bg-red-100 border border-red-500 rounded-lg">
                                No Services Available
                              </span>
                            )}
                          </div>


                        </td>
                        <td className="border  border-black px-4 py-2 text-center">
                          {client.additional_login == 1 ? 'Yes' : 'No'}
                        </td>
                        <td className="border  border-black px-4 py-2 text-center">
                          {client.created_at
                            ? new Date(client.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')
                            : 'NIL'}
                        </td>
                        <td className="border  border-black px-4 py-2 text-center">
                          {client.updated_at
                            ? new Date(client.updated_at).toLocaleDateString('en-GB').replace(/\//g, '-')
                            : 'NIL'}
                        </td>
                        <td className="border  border-black px-4 py-2 gap-1 text-center items-center">
                          <div className="flex  gap-1">
                            <button
                              onClick={() => handleEdit(client)}
                              className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleBlock(client.main_id)}
                              disabled={isBlockLoading && activeId == client.main_id}
                              className={`bg-red-500 hover:scale-105 hover:bg-red-600 text-white px-4 py-2 rounded mr-3 ${isBlockLoading && activeId == client.main_id ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              Block
                            </button>
                            <button
                              onClick={() => handleDelete(client.main_id , client.name)}
                              disabled={isDeleteLoading && activeId == client.main_id}
                              className={`bg-[#073d88] hover:scale-105 hover:bg-[#12253f] text-white px-4 py-2 rounded ${isDeleteLoading && activeId == client.main_id ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              Delete
                            </button>
                            {client.branch_count > 1 && (
                              <button
                                onClick={() => handleViewBranchesClick(client.main_id)}
                                className={`bg-green-600 hover:scale-105 hover:bg-green-700 text-white px-4 py-2 whitespace-nowrap rounded mr-3 ${branchViewLoading && activeId == client.main_id ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                disabled={branchViewLoading && activeId == client.main_id}
                              >
                                VIEW BRANCHES
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            )}
          </table>
        </div>

        </div>
        <div className="flex justify-between items-center mt-4">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400"
          >
            Next
          </button>

        </div>
        <Modal
          isOpen={showModal}
          onRequestClose={() => setShowModal(false)}
          contentLabel="VIEW BRANCHES"
          className="modal-content overflow-y-scroll max-h-[500px] "
          overlayClassName="modal-overlay"
        >
          <h2>Branches</h2>
          <table className="min-w-full border-collapse border  border-black ">
            <thead>
              <tr className="bg-[#c1dff2] whitespace-nowrap text-[#4d606b]">
                <th className=" uppercase border  border-black px-4 py-2">Branch ID</th>
                <th className=" uppercase border  border-black px-4 py-2">Branch Name</th>
                <th className=" uppercase border  border-black px-4 py-2">Branch Email</th>
                <th className=" uppercase border  border-black px-4 py-2" colSpan={2}>Actions</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {branchesData.length > 0 ? (
                branchesData
                  .filter((branch) => branch.is_head !== 1)
                  .map((branch, index) => (
                    <tr key={branch.id}>
                      <td className="border  border-black px-4 py-2 font-light">{index + 1}</td>
                      <td className="border  border-black px-4 py-2 font-light">{branch.name}</td>
                      <td className="border  border-black px-4 py-2 font-light">{branch.email}</td>
                      <td className="  p-2 items-start gap-3">
                        <button
                          className="bg-green-500 text-white px-4 py-2 rounded "
                          onClick={() => handleEditClick(branch)}
                        >
                          Edit
                        </button>
                      </td>
                      <td className="  p-2 items-start gap-3">
                        <button
                          className="bg-red-500 text-white px-4 py-2 rounded "
                          onClick={() => handleDeleteBranch(branch)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={4} className="border  border-black px-4 py-2 font-light">
                    No branches available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <button
            onClick={() => setShowModal(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mt-4"
          >
            Close
          </button>
        </Modal>
        <Modal
          isOpen={currentBranch !== null}
          onRequestClose={() => setCurrentBranch(null)}
          contentLabel="Edit Branch"
          className="modal-content overflow-y-scroll max-h-[500px]"
          overlayClassName="modal-overlay"
        >
          <h2>Edit Branch</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUpdateBranch();
            }}
          >
            <div className="mb-4">
              <label className="block text-gray-700">Branch Name:</label>
              <input
                type="text"
                value={updatedName}
                onChange={(e) => setUpdatedName(e.target.value)}
                className="border  w-full px-4 py-2"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Branch Email:</label>
              <input
                type="email"
                value={updatedEmail}
                onChange={(e) => setUpdatedEmail(e.target.value)}
                className="border  w-full px-4 py-2"
              />
            </div>
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isUpdateLoading}
                className={`bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded ${isUpdateLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {isUpdateLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setCurrentBranch(null)}
                disabled={isUpdateLoading}
                className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded ${isUpdateLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                Cancel
              </button>
            </div>

          </form>
        </Modal>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black no-margin bg-opacity-50 flex items-center justify-center z-999">
            <div className="bg-white rounded-lg shadow-lg p-4 md:mx-0 mx-4 md:w-1/3">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Services</h2>
                <button className="text-red-500 text-2xl" onClick={handleCloseServiceModal}>
                  &times;
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 w-full max-h-96 overflow-y-auto">
                {modalServices.length > 0 ? (
                  modalServices.map((service, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-blue-100 border border-blue-500 rounded-lg text-sm"
                    >
                      {service.serviceTitle}
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
    </div >
  );
};

export default ActiveAccounts;
