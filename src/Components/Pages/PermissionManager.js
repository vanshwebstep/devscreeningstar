import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApiLoading } from "../ApiLoadingContext";
import Swal from "sweetalert2";
import axios from "axios";
import { select } from "@material-tailwind/react";
import Select from 'react-select';
const PermissionManager = () => {
  const [serviceGroups, setServiceGroups] = useState([]);
  const [fetchServiceIds, setFetchServiceIds] = useState([]);
     const {validateAdminLogin,setApiLoading,apiLoading} = useApiLoading();


  console.log('fetchServiceIds', fetchServiceIds);
  const [serviceNewGroups, setServiceNewGroups] = useState([]);
  const [serviceTitlesAndIds, setServiceTitlesAndIds] = useState([]);
  const [services, setServices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [mainJson, setMainJson] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jsonPermissions, setJsonPermissions] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [modalPermissionsContent, setModalPermissionsContent] = useState(false);
  const [modalRole, setModalRole] = useState(false);
  const navigate = useNavigate();
  const modalRef = useRef(null);
  const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
  const token = localStorage.getItem("_token");
  const [selectedServices, setSelectedServices] = useState([]); // To hold the selected services as an array
  const [selectedServiceIds, setSelectedServiceIds] = useState(''); // To hold the selected service IDs as a comma-separated string
  console.log('selectedServiceIds', selectedServiceIds);
  const storedToken = localStorage.getItem("_token");

  const fetchRolesWithoutLoader = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/admin/permission/list?admin_id=${adminId}&_token=${token}`,
        { method: "GET", redirect: "follow" }
      );

      const data = await response.json();
      const newToken = data.token || data._token || storedToken ;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const mainJson = JSON.parse(data.roles.find(role => role.role === "admin_user")?.json || null);
      setMainJson(mainJson || []);
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error.message);
    }
  }, [adminId, token]);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);
    try {
      const response = await fetch(
        `https://api.screeningstar.co.in/admin/permission/list?admin_id=${adminId}&_token=${token}`,
        { method: "GET", redirect: "follow" }
      );

      const data = await response.json();
      const newToken = data.token || data._token || storedToken ;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const mainJson = JSON.parse(data.roles.find(role => role.role === "admin_user")?.json || null);
      const teamManagementRole = data.roles.find(
        (role) => role.role === "team_management"
      );
      const serviceIds = teamManagementRole ? teamManagementRole.service_ids : null;
      setFetchServiceIds(serviceIds ? serviceIds.split(',') : []);
      setMainJson(mainJson || []);

      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error.message);
    }
    setLoading(true);
    setApiLoading(true);

  }, [adminId, token]);



 const fecthPreselectServices=()=>{
  if (fetchServiceIds && fetchServiceIds.length > 0) {
    const preselectedServices = services.filter(service =>
      fetchServiceIds.includes(service.id.toString()) // Assuming fetchServiceIds are strings
    ).map(service => ({
      value: service.id,
      label: service.title,
    }));

    // Set the preselected services
    setSelectedServices(preselectedServices);
  }
 }

  const handleCheckboxChange = (category) => {
    setJsonPermissions(prevState => {
      const updatedPermissions = { ...prevState, [category]: !prevState[category] };
      return updatedPermissions;
    });
  };

  const renderPermissions = () => {
    try {
      // Convert mainJson permissions to an array of categories
      const permissionCategories = Object.keys(mainJson);

      return (
        <table className="border-collapse border border-black w-full">
          <thead>
            <tr className="bg-gray-200 ">
              <th className="border border-black px-4 py-2 text-[#4d606b] text-center">Permission</th>
              <th className="border border-black px-4 py-2 text-[#4d606b] text-center">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {permissionCategories.map((category) => (
              <tr key={category}>
                <td className="border border-black px-4 py-2 capitalize">
                  {category.replace(/_/g, " ")}
                </td>
                <td className="border border-black px-4 py-2 text-center">
                  <input
                    type="checkbox"
                    disabled={!isEditable}
                    checked={jsonPermissions[category] || false}
                    onChange={() => handleCheckboxChange(category)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    } catch (error) {
      console.error("Error parsing permissions:", error.message);
      return (
        <div className="text-center text-red-500">
          Invalid Permissions Data
        </div>
      );
    }
  };


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeModal(); // Close the modal if click is outside
        
      }
    };

    // Add event listener for clicks outside the modal
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const openModal = (role, isEditable = false) => {
    setJsonPermissions(JSON.parse(role.json));
    fecthPreselectServices();

    setIsEditable(isEditable);
    const permissionsContent = renderPermissions(); // Get rendered permissions as JSX
    setModalPermissionsContent(permissionsContent);
    setModalRole(role);
    if (modalOpen) {
      setModalOpen(false);
    } else {
      setModalOpen(true);
    }
  };

  // Function to handle closing the modal
  const closeModal = () => {
    fetchRolesWithoutLoader();
    setModalOpen(false);
    setJsonPermissions(null);
    setModalPermissionsContent(null);
    setModalRole(null);
    setIsEditable(false);
  };


  const formatRole = (role) => {
    return role
      .replace(/[^a-zA-Z0-9\s]/g, " ") // Replace special characters with spaces
      .split(" ") // Split into words
      .filter(Boolean) // Remove empty strings from the array
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
      .join(" "); // Join words with spaces
  };
  const handleServiceChange = (selectedOptions) => {
    setSelectedServices(selectedOptions);
    const serviceIds = selectedOptions.map(option => option.value).join(',');
    setSelectedServiceIds(serviceIds);
  };
  const handleUpdate = async (selectedServices) => {
    try {
      const updatePermissionJson = jsonPermissions;
      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      const token = localStorage.getItem("_token");

      if (!adminId || !token) {
        Swal.fire({
          icon: "warning",
          title: "Missing Information",
          text: "Admin ID or token is missing. Please log in again.",
        });
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      // Prepare base payload
      const payload = {
        id: modalRole?.id,
        permission_json: updatePermissionJson,
        admin_id: adminId,
        _token: token,
      };

      // Conditionally add service_ids if the role is 'team_management'
      if (modalRole?.role === 'team_management') {
        const selectedServiceIds = selectedServices
          ? selectedServices.map((service) => service.value).join(",")
          : "";
        payload.service_ids = selectedServiceIds; // Add service_ids to payload
      }

      const raw = JSON.stringify(payload);

      const requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch("https://api.screeningstar.co.in/admin/permission/update", requestOptions);

      const data = await response.json();

      // Update the token if a new one is provided
      const newToken = data.token || data._token || storedToken ;
      if (newToken) {
        localStorage.setItem("_token", newToken);
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (data.status) {
        Swal.fire({
          icon: "success",
          title: "Permissions Updated",
          text: data.message,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: data.message,
        });
      }
      fecthPreselectServices();
      fetchRolesWithoutLoader();
      setModalOpen(false);
      setJsonPermissions(null);
      setModalPermissionsContent(null);
      setModalRole(null);
      setIsEditable(false);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: `An error occurred while updating permissions: ${error.message}`,
      });

      console.error("Error updating permissions:", error);
    }
  };


  const fetchServices = useCallback(async () => {
    setLoading(true);
    setApiLoading(true);

    const admin_id = JSON.parse(localStorage.getItem("admin"))?.id;
    const storedToken = localStorage.getItem("_token");

    if (!storedToken) {
      console.error("No token found. Please log in.");
      setLoading(false);
    setApiLoading(false);

      return;
    }

    try {
      const response = await axios.get(
        `https://api.screeningstar.co.in/service/list?admin_id=${admin_id}&_token=${storedToken}`
      );

      const result = response.data;
      const newToken = result.token || result._token || storedToken ;

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
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    setApiLoading(false);

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
        `https://api.screeningstar.co.in/service-group/list?${queryParams}`,
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

      const newToken = data.token || data._token || storedToken ;
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
        await fetchRoles();
        await fetchGroups ();
        await fetchServices();
        }
      } catch (error) {
        console.error(error.message);
        navigate("/admin-login"); // Redirect if validation fails
      }
    };

    initialize(); // Execute the sequence
  }, [navigate, fetchRoles,fetchGroups,fetchServices]);
  return (
    <div className="w-full bg-[#c1dff2] border border-black overflow-hidden">
      <div className="space-y-4 py-8 md:px-12 px-6 bg-white">

        <div className="overflow-scroll">
          <table className="min-w-full border-collapse border border-black">
            <thead className="bg-[#c1dff2] text-[#4d606b]">
              <td className="border border-black px-4 py-2 font-bold text-center">SI</td>
              <td
                className="border uppercase border-black px-4 py-2 font-bold text-center"
              >
                Title
              </td>
              <td className="border border-black uppercase px-4 py-2 font-bold text-center">Permission</td>
              <td className="border border-black uppercase  px-4 py-2 font-bold text-center">Action</td>
            </thead>
            {loading ? (
              <tbody className="h-10">
                <tr className="">
                  <td colSpan="4" className="w-full py-10 h-10  text-center">
                    <div className="flex justify-center  items-center w-full h-full">
                      <div className="loader border-t-4 border-[#2c81ba] rounded-full w-10 h-10 animate-spin"></div>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody>

                {
                  roles.length > 0 ? (
                    roles.map((role, index) => (
                      <React.Fragment key={role.role}>
                        {/* Title Row for the Role */}
                        <tr className="">
                          <td className="border border-black px-4 py-2 font-bold text-center">{index + 1}</td>
                          <td className="border border-black px-4 py-2 font-bold text-center">{formatRole(role.role)}</td>
                          <td className="border border-black px-4 py-2 font-bold text-center">
                            <button
                              className="bg-blue-500 hover:scale-105 text-white  hover:bg-blue-600 px-4 py-2 rounded"
                              onClick={() => openModal(role, false)}
                            >
                              View
                            </button>
                          </td>
                          <td className="text-center border border-black font-bold px-4 py-2">
                            <button className="bg-green-500 hover:scale-105 text-white rounded px-4 py-2 hover:bg-green-600 ml-2"
                              onClick={() => openModal(role, true)}>
                              Edit
                            </button>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="border px-4 py-2 text-center">
                        No roles found.
                      </td>
                    </tr>
                  )
                }

              </tbody>
            )}
          </table>
        </div>


      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex z-999 justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-3/4 h-3/4  overflow-scroll" ref={modalRef}>
            {/* Modal Content */}
            <h2 className="text-xl font-bold mb-4 text-center">
              {modalRole?.role ? formatRole(modalRole.role) : 'N/A'}
            </h2>
            <p><strong>Permissions:</strong></p>
            <div className="mt-4">{renderPermissions(jsonPermissions)}</div>

            {/* Advanced multi-select for services */}
            {services.length > 0 && modalRole?.role === 'team_management' && (
              <div className="mt-4">
                <label className="block text-lg font-medium mb-2">Select Services</label>
                <Select
                  isMulti
                  name="services"
                  options={services.map((service) => ({
                    value: service.id,
                    label: service.title,
                  }))}
                  value={selectedServices}
                  onChange={handleServiceChange}
                  className="react-select-container "
                  classNamePrefix="react-select"
                  placeholder="Select Services"
                  isDisabled={!isEditable}
                  getOptionLabel={(e) => (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedServices.some((service) => service.value === e.value)}
                        readOnly
                        className="mr-2"
                      />
                      {e.label}
                    </div>
                  )}
                />
              </div>
            )}
            {modalRole?.role === 'view' && selectedServiceIds && (
              <div className="mt-4">
                <p><strong>Selected Services:</strong> {selectedServiceIds.split(',').join(', ')}</p>
              </div>
            )}
            <div className="mt-4">
              <button
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                onClick={closeModal}
              >
                Close
              </button>
              {isEditable && modalRole?.role !== 'view' && (
                <button
                  className="bg-green-500 text-white px-4 py-2 rounded"
                  onClick={() => handleUpdate(selectedServices)} // Pass selectedServices to handleUpdate
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}



    </div >
  )
};

export default PermissionManager;
