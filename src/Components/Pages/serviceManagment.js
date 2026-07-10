import React, { useEffect, useCallback, useState, useRef } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import SelectSearch from "react-select-search";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "react-select-search/style.css";
import Swal from "sweetalert2";
import swal from "sweetalert";
import { useApiLoading } from '../ApiLoadingContext';

const ServiceManagement = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const [responseError, setResponseError] = useState(null)
  const [deletingId, setDeletingId] = useState(null);
  const [group_name, setGroup_name] = useState();
  const [groupId, setGroupId] = useState("");
  const [serviceGroups, setServiceGroups] = useState([]);
  const [serviceNewGroups, setServiceNewGroups] = useState([]);
  const [serviceTitlesAndIds, setServiceTitlesAndIds] = useState([]);
  const [serviceName, setServiceName] = useState("");
  const [description, setDescription] = useState("");
  const [service_type, setServiceType] = useState([]);
  const [hsn_code, setHSNCode] = useState("");
  const [showInVendorManagement, setShowInVendorManagement] = useState(false);
  const [isFormReady, setIsFormReady] = useState(true);
  const [service_code, setServiceCode] = useState("");
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage, setServicesPerPage] = useState(10);
  const optionsPerPage = [10, 50, 100, 200, 500, 1000];
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const storedToken = localStorage.getItem("_token");
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

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!storedToken) {
      console.error("No token found. Please log in.");
      setApiLoading(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5000/service/list?admin_id=${admin_id}&_token=${storedToken}`
      );

      const result = response.data;
      const newToken = result.token || result._token || storedToken;

      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (result.status) {
        const fetchedServices = result.services || [];
        setServices(fetchedServices);

        // Extract unique groups
        const uniqueGroups = Array.from(
          fetchedServices
            .reduce((map, { group_id, group_name }) => {
              if (!map.has(group_id)) {
                map.set(group_id, { value: group_id, name: group_name });
              }
              return map;
            }, new Map())
            .values()
        );

        setServiceGroups(uniqueGroups);
      } else {
        console.error("Failed to fetch packages. Status:", result.status);
      }
    } catch (error) {
      if (error.response) {
        Swal.fire('Error!', `${error.response.data.message}`, 'error');
        setResponseError(error.response.data.message);
      } else {
        Swal.fire('Error!', 'An unknown error occurred.', 'error');
      }
    } finally {
      setApiLoading(false);
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    const adminData = localStorage.getItem("admin");
    const storedToken = localStorage.getItem("_token");

    if (!storedToken) {
      console.error("No token found. Please log in.");
      return;
    }

    const adminId = adminData ? JSON.parse(adminData)?.id : null;
    if (!adminId) {
      console.error("Admin ID not found.");
      return;
    }

    const queryParams = new URLSearchParams({
      admin_id: adminId,
      _token: storedToken,
    }).toString();

    try {
      const response = await fetch(
        `http://localhost:5000/service-group/list?${queryParams}`,
        {
          method: "GET",
          redirect: "follow",
        }
      );


      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Failed to fetch groups:",
          data?.message || "Unknown error"
        );
        return;
      }

      const newToken = data.token || data._token || storedToken;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (data.status) {
        setServiceNewGroups(data.services);
        const titlesAndIds = data.services.map((service) => ({
          id: service.id,
          title: service.title,
        }));
        setServiceTitlesAndIds(titlesAndIds);
      } else {
        console.error(
          "Failed to fetch groups:",
          data?.message || "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (apiLoading == false) {
          await validateAdminLogin(); // Verify admin first
          await fetchGroups();
          await fetchServices();
        }
      } catch (error) {
        console.error(error.message);
        navigate('/admin-login'); // Redirect if validation fails
      }
    };

    initialize(); // Execute the sequence
  }, [fetchGroups, fetchServices, navigate]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setApiLoading(true);

    // Check if the form is ready to submit and show an error if needed
    if (!isFormReady) {
      swal("Error!", "ServiceCode is already in use.", "error");
      setApiLoading(false);
      setLoading(false); // Reset loading state early if form is not ready
      return; // Exit early if form is not ready
    }

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!storedToken) {
      swal("Error!", "No token found. Please log in.", "error");
      navigate("/admin-login");
      setApiLoading(false);
      setLoading(false); // Reset loading state if no token
      return;
    }

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      id: editingServiceId,
      title: serviceName,
      description: description,
      service_type: service_type.join(","), // Convert array to comma-separated string
      group_id: groupId,
      hsn_code: hsn_code,
      show_in_vendor_management: showInVendorManagement ? 1 : 0,
      service_code: service_code,
      admin_id: admin_id,
      _token: storedToken,
    });

    const apiUrl = editingServiceId
      ? "http://localhost:5000/service/update"
      : "http://localhost:5000/service/create";

    const requestOptions = {
      method: editingServiceId ? "PUT" : "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    try {
      const response = await fetch(apiUrl, requestOptions);
      const result = await response.json(); // Parse the response as JSON

      if (response.ok) {
        // Reset form fields after successful submission
        setServiceName("");
        setDescription("");
        setServiceType("");
        setHSNCode("");
        setShowInVendorManagement(false);
        setServiceCode("");
        fetchServices();

        // Handle potential token update from response
        const newToken = result.token || result._token || storedToken || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
        console.log('result -- ', result)
        Swal.fire(
          "Success!",
          editingServiceId ? result.message || "Form updated successfully." : result.message || "Service Created successfully.",
          "success"
        );
        setEditingServiceId(null);
      } else {
        // Handle error response from API
        const errorMessage = result?.message || "There was an issue saving the service.";
        swal("Error!", errorMessage, "error");

        // Optionally handle token refresh if necessary
        const newToken = result?.token || result?._token || storedToken || "";
        if (newToken) {
          localStorage.setItem("_token", newToken);
        }
      }
    } catch (error) {
      // Handle network or other errors
      swal("Error!", "There was an issue with the request.", "error");
      console.error(error);
    } finally {
      setApiLoading(false);
      setLoading(false); // Always reset loading state, regardless of success or failure
    }
  };


  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This Service will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        setDeletingId(id);
        const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
        const storedToken = localStorage.getItem("_token");
        try {
          const response = await axios.delete(
            `http://localhost:5000/service/delete`,
            {
              params: { id, admin_id, _token: storedToken },
            }
          );

          // If the response includes a new token, update it in localStorage
          const newToken = response.data?.token || response.data?._token || storedToken || "";
          if (newToken) {
            localStorage.setItem("_token", newToken);
          }

          // Remove the deleted service from the state
          setServices((prevServices) =>
            prevServices.filter((service) => service.id !== id)
          );
          setDeletingId(null);
          Swal.fire("Deleted!", "Your Service has been deleted.", "success");
        } catch (error) {
          console.error("Error deleting Service:", error);
          Swal.fire("Error!", "Something went wrong while deleting.", "error");
          setDeletingId(null);

        }
      }
    });
  };

  const handleServiceCodeChange = (e) => {
    const value = e.target.value.trim(); // Trim whitespace from input
    setServiceCode(value);

    // Check if the entered service code exists locally in the array
    const isCodeExistsLocally = services.some(
      (service) => service.service_code === value
    );

    if (isCodeExistsLocally) {
      setIsFormReady(false);
      return; // If already exists locally, no need to call the API
    }

    // Fetch from the API to check if the service code is unique
    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!admin_id || !storedToken) {
      localStorage.removeItem("admin");
      localStorage.removeItem("_token");
      navigate("/admin-login");
      return;
    }

    const apiUrl = `http://localhost:5000/service/is-service-code-unique?service_code=${encodeURIComponent(
      value
    )}&admin_id=${admin_id}&_token=${storedToken}`;

    fetch(apiUrl, { method: "GET" })
      .then((response) => {
        // Parse the response JSON to extract token, even if it's an error
        return response.json().then((result) => {
          const newToken = result.data?.token || result.data?._token || storedToken || "";
          if (newToken) {
            localStorage.setItem("_token", newToken); // Save the token immediately
          }

          if (!response.ok) {
            throw new Error(
              `API responded with status: ${response.status}, Message: ${result.message || "Unknown error"
              }`
            );
          }
          return result; // Pass the parsed JSON response if no error
        });
      })
      .then((result) => {
        console.log(`result - `, result);
        // Check if the service code is unique
        if (result.status) {
          setIsFormReady(true); // The service code is unique
        } else {
          setIsFormReady(false); // The service code is not unique
        }
      })
      .catch((error) => {
        console.error("Error checking service code uniqueness:", error);
        setIsFormReady(false); // Assume not ready on error
      });
  };

  const handleEdit = (service) => {
    setGroupId(service.group_id || "");
    setServiceName(service.title || "");
    setDescription(service.description || "");
  
     setServiceType(
    service.service_type
      ? service.service_type.split(",")
      : []
  );
    setHSNCode(service.hsn_code || "");
    setShowInVendorManagement(
      service.show_in_vendor_management === true ||
      service.show_in_vendor_management === 1 ||
      service.show_in_vendor_management === "1"
    );
    setServiceCode(service.service_code || "");
    setEditingServiceId(service.id);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(services);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Services");
    XLSX.writeFile(workbook, "services.xlsx");
  };

  const filteredServices = services.filter(
    (service) =>
      service.title &&
      service.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const currentServices = filteredServices.slice(
    indexOfFirstService,
    indexOfLastService
  );

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const Loader = () => (
    <div className="flex w-full justify-center items-center h-20">
      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
    </div>
  );

  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);
  const [startPage, setStartPage] = useState(1);
  const maxVisiblePages = 3;

  const handleForward = () => {
    if (startPage + maxVisiblePages < totalPages) {
      setStartPage(startPage + maxVisiblePages);
    }
  };

  const handleBackward = () => {
    if (startPage > 1) {
      setStartPage(startPage - maxVisiblePages);
    }
  };
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1)
  };

  const serviceTypeNames = {
    "valuepitch": "Value Pitch",
    "manual": "Manual",
    "surepass": "SurePass",

  };
const selectedLabels = Array.isArray(service_type)
  ? service_type.map((item) => serviceTypeNames[item]).join(", ")
  : "";

  console.log(selectedLabels);

  return (
    <div className="">

      <div className="bg-white border-black border  p-6 md:p-12 w-full mx-auto">
        <div className="md:flex flex-wrap">
          <div className="md:w-2/5">
            <form
              onSubmit={handleSubmit}
              className="space-y-4 ps-0 md:pr-[30px] pb-[30px] bg-white rounded-md"
            >
              <div className="grid grid-cols-1  gap-4">
                <SelectSearch
                  options={serviceTitlesAndIds.map((service) => ({
                    value: service.id,
                    name: service.title,
                  }))}
                  value={groupId} // Assuming groupId is the state variable for the selected value
                  name="group_id"
                  required
                  placeholder="Choose Service Group"
                  onChange={(value) => setGroupId(value)}
                  search
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="serviceName"
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Service Name"
                  className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="description"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">

                <SelectSearch
  options={Object.entries(serviceTypeNames).map(([value, name]) => ({
    value,
    name
  }))}
  value={service_type}
  name="service_type"
  required
  placeholder="Choose Service Type"
  onChange={(value) =>
    setServiceType(Array.isArray(value) ? value : [value])
  }
  search
  multiple
/>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="service_code"
                  value={service_code}
                  required
                  onChange={handleServiceCodeChange}
                  placeholder="Service Code"
                  className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                />
                {!isFormReady && (
                  <p className="text-red-500 text-sm">
                    This service code already exists.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <input
                  type="text"
                  name="hsn_code"
                  required
                  value={hsn_code}
                  onChange={(e) => setHSNCode(e.target.value)}
                  placeholder="HSN Code"
                  className="w-full rounded-md p-2.5 border bg-[#f7f6fb] border-gray-300"
                />
              </div>
              <label className="flex items-center gap-3 text-left text-gray-700">
                <input
                  type="checkbox"
                  name="show_in_vendor_management"
                  checked={showInVendorManagement}
                  onChange={(e) => setShowInVendorManagement(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span>Show in Vendor Management</span>
              </label>
              <div className="text-left">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex justify-center text-center align-middle items-center w-full bg-[#2c81ba] hover:scale-105 hover:bg-[#0f5381] text-white  py-2.5 px-[30px] text-[18px] border rounded-md ${loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  {editingServiceId ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
          <div className="md:w-3/5">
            <div className="md:flex justify-between items-center mb-4">
              <div>
                <div>
                  <input
                    type="text"
                    placeholder="Search by Service Name"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="md:w-[450px] w-full rounded-md p-2.5 border border-gray-300 mb-4"
                  />
                </div>
                <select
                  value={servicesPerPage}
                  onChange={(e) => {
                    setServicesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-lg px-3 py-1 text-gray-700 bg-white  shadow-sm focus:ring-2 focus:ring-blue-400"
                >
                  {optionsPerPage.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={exportToExcel}
                className="bg-green-500  mb-4 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded text-[18px]"
              >
                Export to Excel
              </button>
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
                <table className="min-w-full border-collapse border border-black  rounded-lg overflow-scroll whitespace-nowrap">
                  <thead className="rounded-lg">
                    <tr className="bg-[#c1dff2] text-[#4d606b]">
                      <th className="uppercase border border-black  px-4 py-2">SL</th>
                      <th className="uppercase border border-black  px-4 py-2 text-left">
                        Group
                      </th>
                      <th className="uppercase border border-black  px-4 py-2 text-left">
                        Service Code
                      </th>
                      <th className="uppercase border border-black  px-4 py-2 text-left">
                        Service Name
                      </th>
                      <th className="uppercase border border-black  px-4 py-2 text-left">
                        Service Description
                      </th>
                      <th className="uppercase border border-black  px-4 py-2">HSN Code</th>
                      <th className="uppercase border border-black  px-4 py-2">Service Type</th>
                      <th className="uppercase border border-black  px-4 py-2">Vendor Management</th>
                      <th className="uppercase border border-black  px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="py-4 text-center text-gray-500"
                        >
                          <Loader className="text-center" />
                        </td>
                      </tr>
                    ) : currentServices.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-4 text-center text-red-500">
                          {responseError && responseError !== ""
                            ? responseError
                            : "No data available in table"}
                        </td>
                      </tr>
                    ) : (
                      <>
                        {currentServices.map((service, index) => (
                          <tr key={service.id} className="text-center">
                            <td className="border border-black  px-4 py-2">
                              {index + 1 + (currentPage - 1) * servicesPerPage}
                            </td>
                            <td className="border border-black px-4 py-2 text-left">
                              {service.group_name}{" "}
                              {service.group_symbol &&
                                `(${service.group_symbol})`}
                            </td>
                            <td className="border border-black  px-4 py-2">
                              {service.service_code}
                            </td>
                            <td className="border border-black  px-4 py-2 text-left">
                              {service.title}
                            </td>
                            <td className="border border-black  px-4 py-2 text-left">
                              {service.description}
                            </td>
                            <td className="border border-black  px-4 py-2">
                              {service.hsn_code}
                            </td>
                            <td className="border border-black  px-4 py-2">
                              {service.service_type}
                            </td>
                            <td className="border border-black px-4 py-2">
                              {service.show_in_vendor_management === true ||
                              service.show_in_vendor_management === 1 ||
                              service.show_in_vendor_management === "1"
                                ? "Yes"
                                : "No"}
                            </td>
                            <td className="border border-black  px-4 py-2">
                              <button
                                onClick={() => handleEdit(service)}
                                className="bg-green-500 hover:scale-105 hover:bg-green-600 text-white px-4 py-2 rounded-md mr-2"
                              >
                                Edit
                              </button>
                              <button
                                disabled={deletingId === service.id}
                                onClick={() => handleDelete(service.id)}
                                className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md  ${deletingId === service.id ? "opacity-50 cursor-not-allowed" : " hover:scale-105"} `}
                              >
                                {deletingId === service.id ? "Deleting..." : "Delete"}
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

            {/* Pagination */}
            <div className="mt-4 text-center">
              {/* First Page */}


              {/* Backward Ellipsis */}
              {startPage > 2 && (
                <button onClick={handleBackward} className="mx-1 px-3 py-1 rounded-md bg-gray-200">
                  ...
                </button>
              )}

              {/* Middle Pages */}
              {Array.from({ length: Math.min(maxVisiblePages, totalPages - 2) }, (_, index) => {
                const pageNumber = startPage + index;
                return (
                  pageNumber < totalPages && (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`mx-1 px-3 py-1 rounded-md ${currentPage === pageNumber ? "bg-[#2c81ba] text-white" : "bg-gray-200"
                        }`}
                    >
                      {pageNumber}
                    </button>
                  )
                );
              })}

              {/* Forward Ellipsis */}
              {startPage + maxVisiblePages < totalPages && (
                <button onClick={handleForward} className="mx-1 px-3 py-1 rounded-md bg-gray-200">
                  ...
                </button>
              )}

              {/* Last Page */}
              {totalPages > 1 && (
                <button
                  onClick={() => paginate(totalPages)}
                  className={`mx-1 px-3 py-1 rounded-md ${currentPage === totalPages ? "bg-[#2c81ba] text-white" : "bg-gray-200"}`}
                >
                  {totalPages}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceManagement;
