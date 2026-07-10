import React, { useState, useContext, useEffect, useRef, useCallback } from "react";
import "../App.css";
import Modal from "react-modal";
import { GrServices } from "react-icons/gr";
import { useNavigate } from "react-router-dom";
import { } from "react-icons/fc";
import { FaHome, FaBars, FaUserTie } from "react-icons/fa";
import { RiArrowRightWideLine } from "react-icons/ri";
import Logo from "../imgs/screeningLogoNew.png";
import { IoNotifications } from "react-icons/io5";
import { CgProfile } from "react-icons/cg";
import {
  FaUser,
  FaFileInvoice,
  FaClipboardList,
  FaUserShield,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useSidebarContext } from './SidebarContext';
import { MobileContext } from "./MobileContext";
import { useApiLoading } from './ApiLoadingContext';
Modal.setAppElement("#root");

const AdminHeader = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const { isMenuOpen, setIsMenuOpen } = useContext(MobileContext);

  const [isSignoutLoading, setIsSignoutLoading] = useState(false);
  localStorage.setItem("isBranchExist", 'no');
  const { handleSectionClick, activeTab, sectionTabs, setActiveTab, setSectionTabs } = useSidebarContext();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [totalNotificationCount, setTotalNotificationCount] = useState(null);
  
  const [innerDropdowns, setInnerDropdowns] = useState({});
  const [profilePic, setProfilePic] = useState({});
  const [tatDelayNotifications, setTatDelayNotifications] = useState([]);
  const [applicationNotifications, setApplicationNotifications] = useState([]);
  const [bulkUploadsNotifications, setBulkUploadsNotifications] = useState([]);
  const notificationRef = useRef(null);
  const myAccountRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState("newApplications");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMyAccountOpen, setIsMyAccountOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [roleByLocal, setRoleByLocal] = useState(null);
  const storedToken = localStorage.getItem("_token");

  useEffect(() => {
    const storedRole = JSON.parse(localStorage.getItem('admin'))?.role;
    setRoleByLocal(storedRole);
  }, []);
  let checkinData;
  if (storedToken) {
    checkinData = JSON.parse(localStorage.getItem('checkin_data'))
  }
  const handleSignout = async () => {
    try {
      setIsSignoutLoading(true);
      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;

      if (!storedToken || !adminId) {
        console.error('No token or admin_id found');
        setIsSignoutLoading(false); // Reset loading state
        return;
      }

      const requestOptions = {
        method: 'GET',
        redirect: 'follow',
      };

      const url = `https://api.screeningstar.co.in/admin/logout?admin_id=${adminId}&_token=${storedToken}`;
      const response = await fetch(url, requestOptions);

      if (response.ok) {
        localStorage.removeItem("sectiontabJson");
        localStorage.removeItem("subMenu");
        localStorage.removeItem("_token");
        localStorage.removeItem("admin");
        navigate('/admin-login');
      } else {
        const errorMessage = await response.text();
        console.error('Logout failed:', errorMessage);
      }
    } catch (error) {
      console.error('An error occurred:', error);
    } finally {
      setIsSignoutLoading(false); // Ensure loading state is reset
    }
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
    if (openDropdown !== dropdown) {

      setInnerDropdowns({});
    }
  };

  const toggleInnerDropdown = (dropdown) => {
    setInnerDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const confirmSignout = () => {
    handleSignout();
    closeModal();

  };


  const toggleNotificationPopup = useCallback(async () => {

    if (!isNotificationOpen) {
      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      if (!adminId) {
        console.error("Admin ID not found");
        return;
      }
      const multipliedAdminId = adminId * 1.5;
      const encodedAdminId = btoa(multipliedAdminId.toString());

      try {
        const response = await fetch(`https://api.screeningstar.co.in/notification?YWRtaW5faWQ=${encodedAdminId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);

        let newTatDelayNotifications = [];
        let newApplicationNotifications = [];
        let newBulkUploadsNotifications = [];
        let tatDelayCount = 0;
        let newApplicationsCount = 0;
        let bulkUploadsCount = 0;

        // Count TAT delay applications
        if (result.status && result.data.tatDelayList) {
          newTatDelayNotifications = result.data.tatDelayList.flatMap((customer) =>
            customer.branches.flatMap((branch) => {
              return branch.applications.map((application) => {
                if (application.is_tat_delay_notification_read === 0) {
                  tatDelayCount += 1;
                }
                return {
                  applicationName: application.application_name,
                  customerName: customer.customer_name,
                  daysOutOfTat: application.days_out_of_tat,
                  applicationID: application.application_id,
                  isPriority: application.is_priority,
                  newNotification: application.is_tat_delay_notification_read
                };
              });
            })
          );
        }

        // Count new applications
        if (result.status && result.data.newApplications) {
          newApplicationNotifications = result.data.newApplications.flatMap((customer) =>
            customer.branches.flatMap((branch) => {
              return branch.applications.map((application) => {
                if (application.is_new_notification_read == 0) {
                  newApplicationsCount += 1;
                }
                return {
                  applicationName: application.client_applicant_name,
                  customerName: customer.customer_name,
                  daysOutOfTat: application.days_out_of_tat,
                  applicationID: application.application_id,
                  isPriority: application.is_priority,
                  newNotification: application.is_new_notification_read
                };
              });
            })
          );
        }

        // Count bulk uploads
        if (result.status && result.data.newBulkUploads) {
          newBulkUploadsNotifications = result.data.newBulkUploads.flatMap((customer) =>
            customer.branches.flatMap((branch) => {
              return branch.bulks.map((bulk) => {
                if (bulk.is_notification_read == 0) {
                  bulkUploadsCount += 1;
                }
                return {
                  branchName: branch.branch_name,
                  customerName: customer.customer_name,
                  clientSpocName: bulk.client_spoc_name,
                  createdAt: bulk.created_at,
                  zip: bulk.zip,
                  newNotification: bulk.is_notification_read
                };
              });
            })
          );
        }

        setTatDelayNotifications(newTatDelayNotifications);
        setApplicationNotifications(newApplicationNotifications);
        setBulkUploadsNotifications(newBulkUploadsNotifications);

        // Log application counts
        console.log(`TAT Delay Applications Count: ${tatDelayCount}`);
        console.log(`New Applications Count: ${newApplicationsCount}`);
        console.log(`Bulk Uploads Count: ${bulkUploadsCount}`);
        console.log(`Total Applications Count: ${tatDelayCount + newApplicationsCount + bulkUploadsCount}`);

        // Set the total notification count based on newNotification = 0
        setTotalNotificationCount(tatDelayCount + newApplicationsCount + bulkUploadsCount);

      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }
  }, [isNotificationOpen]);

  const toggleNotificationPopup2 = useCallback(async () => {
    const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
    if (!adminId) {
      console.error("Admin ID not found");
      return;
    }
    const multipliedAdminId = adminId * 1.5;
    const encodedAdminId = btoa(multipliedAdminId.toString());

    try {
      const response = await fetch(`https://api.screeningstar.co.in/notification/view?YWRtaW5faWQ=${encodedAdminId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log('result.data', result.data)

    } catch (error) {
      console.error("Error fetching notifications:", error);
    }

  }, []);

  const handleNotificationOpen = () => {
    setIsNotificationOpen((prev) => !prev);
    toggleNotificationPopup();
    toggleNotificationPopup2();

  };
  useEffect(() => {
    if (isNotificationOpen) {
      return; // Skip the effect if notification is open
    }

    let firstResponseOk = false;
    let intervalId;

    const checkResponse = async () => {
      if (apiLoading) return; // Avoid API call if loading

      try {
        const response = await toggleNotificationPopup();

        if (response?.ok) {
          if (!firstResponseOk) {
            firstResponseOk = true;
            console.log("First response successful");
          }
        } else {
          console.warn("Response not OK");
          clearInterval(intervalId); // Clear interval if response is not OK
        }
      } catch (error) {
        console.error("An error occurred:", error);
        clearInterval(intervalId); // Clear interval on error
      }
    };

    intervalId = setInterval(checkResponse, 2000);

    // Cleanup on component unmount or when effect dependencies change
    return () => clearInterval(intervalId);
  }, [toggleNotificationPopup, isNotificationOpen, apiLoading]);


  const toggleMyAccountPopup = useCallback(() => {
    setIsMyAccountOpen((prev) => !prev);
  }, []);



  // Handle click outside dropdown to close it
  useEffect(() => {

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null); // Close outer dropdown if click is outside
      }
      else if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false); // Close the notification popup
      }
      else if (myAccountRef.current && !myAccountRef.current.contains(event.target)) {
        setIsMyAccountOpen(false); // Close the notification popup
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const admin = JSON.parse(localStorage.getItem('admin'));
  const adminName = admin ? admin.name : null;

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  const handleCheckin = async () => {
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      const storedToken = localStorage.getItem("_token");

      const raw = JSON.stringify({
        admin_id: adminId,
        _token: storedToken
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow"
      };

      const response = await fetch("https://api.screeningstar.co.in/admin/check-in", requestOptions);
      const result = await response.text();
      console.log(result);

      validateAdminLogin();
    } catch (error) {
      console.error("Check-in failed:", error);
    }
  };

  const handleCheckout = async () => {
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");

      const adminId = JSON.parse(localStorage.getItem("admin"))?.id;
      const storedToken = localStorage.getItem("_token");

      const raw = JSON.stringify({
        admin_id: adminId,
        _token: storedToken,
      });

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
      };

      const response = await fetch("https://api.screeningstar.co.in/admin/check-out", requestOptions);
      const result = await response.text();
      console.log(result);

      validateAdminLogin();
    } catch (error) {
      console.error("Checkout failed:", error);
    }
  };


  const handlePersonalClick = (linkName) => {

    localStorage.setItem('SideBarName', linkName)
    localStorage.removeItem('activeTab');

    localStorage.removeItem('openDropdown');
    setIsMyAccountOpen(false);
    if (linkName === 'Leave Management') {
      localStorage.setItem('subMenu', 'leaveManagement');
    } else {
      localStorage.setItem('subMenu', linkName);
    }



    handleSectionClick(linkName);

  };

  const sortedTatDelayNotifications = [...tatDelayNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedApplicationNotifications = [...applicationNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedBulkUploadsNotifications = [...bulkUploadsNotifications].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


  const { cio_status, cio_created_at } = checkinData || {};

  let buttonLabel = '';
  let handleClick = null;

  // Logic based on cio_status and cio_created_at
  if (!cio_created_at || !cio_status) {
    buttonLabel = 'CHECKIN';
    handleClick = handleCheckin;
  } else if (cio_status == 'check-in') {
    buttonLabel = 'CHECKOUT';
    handleClick = handleCheckout;
  } else if (cio_status === 'checkout') {
    buttonLabel = 'CHECKIN';
    handleClick = handleCheckin;
  } else {
    buttonLabel = 'CHECKIN';
    handleClick = handleCheckin;
  }




  return (

    <nav className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 shadow-md" id="sidebar_menu">
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        className="modal  absolute  bg-white border-orange-500 border-4 p-5 py-12 px-4  shadow-lg w-[90%] sm:w-[30%] m-auto top-1/4 left-0 right-0 text-center rounded-lg"
        overlayClassName="fixed z-9999 inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <h2 className="text-2xl sm:text-3xl font-bold">Confirm Sign Out</h2>
        <p className="text-base sm:text-lg mt-2">Are you sure you want to sign out?</p>

        <div className="flex justify-center mt-6 space-x-3">
          <button
            onClick={closeModal}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-5 sm:px-6 rounded"
          >
            Cancel
          </button>
          <button
            onClick={confirmSignout}
            className={`bg-orange-600 hover:bg-orange-700 text-white font-bold   py-2 px-5 sm:px-6 rounded ${isSignoutLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSignoutLoading}
          >
            {isSignoutLoading ? 'Signing Out...' : 'Sign Out'}
          </button>
        </div>
      </Modal>


      <div className=" mx-auto md:px-10 px-4 py-4">
        <div className="flex  md:flex-row justify-between items-center">
          <div className="lg:hidden">
            <button onClick={handleMenuToggle} className="text-[#4d606b]">
              <FaBars className="text-xl" />
            </button>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/" onClick={() => handleSectionClick('Home')} className="text-[#4d606b] hidden lg:block">
              <FaHome className="text-3xl hover:text-[#004391] transition duration-200" />
            </Link>
            <Link to="/" onClick={() => handleSectionClick('Home')}>
              <div className="border orangeBorder rounded-md p-1 shadow-md cursor-pointer">
                <img src={Logo} alt="Logo" className=" md:w-[13.5rem] w-auto " />
              </div>
            </Link>
            <span className="text-xs md:text-lg hidden lg:block font-bold text-[#4d606b]">Hi {adminName}</span>

          </div>




          <div className="md:mt-4 mt-0 flex items-center md:gap-10 gap-4">

            <div className="relative">
              {(() => {
                const adminImage = JSON.parse(localStorage.getItem("admin"))?.profile_picture;
                return adminImage ? (
                  <img
                    src={`${adminImage}`}
                    alt="Profile"
                    className=" md:w-14 w-6  md:h-14 h-6 rounded-full cursor-pointer"
                    onClick={toggleMyAccountPopup}
                  />
                ) : (
                  <CgProfile
                    className="md:text-4xl text-2xl  text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer"
                    onClick={toggleMyAccountPopup}
                  />
                );
              })()}

              {isMyAccountOpen && (
                <div
                  ref={myAccountRef}
                  className="absolute orangeBorder md:right-0 right-0 mt-2  w-64 lg:w-96 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
                >
                  <h3 className="text-xl font-bold z-99999 text-gray-700">My Account</h3>
                  <ul className="mt-2 space-y-2">
                    <li
                      className="  text-gray-600 cursor-pointer"
                      onClick={() => navigate('/admin-update-password')}
                    >
                      <span className="text-lg text-blue-700">
                        Update Password
                      </span>
                    </li>
                    <Link
                      to="/admin-LeaveManagement"
                      className="text-sm text-red-600 md:hidden block cursor-pointer"
                      onClick={() => handlePersonalClick('Leave Management')}
                    >

                      <span className="block md:text-sm text-sm text-[#004391] font-semibold">LEAVE MANAGEMENT</span>


                    </Link>

                    <li
                      className="text-sm text-red-600 md:hidden block cursor-pointer"
                      onClick={openModal}
                    >
                      SIGN OUT
                    </li>


                  </ul>
                </div>

              )}
            </div>

            <div className="relative ">
              <div className="relative">
                <IoNotifications
                  className="md:text-4xl text-2xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer"
                  onClick={handleNotificationOpen}
                />
                {totalNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {totalNotificationCount}
                  </span>
                )}
              </div>

              {isNotificationOpen && (
                <div
                  ref={notificationRef}
                  className="absolute orangeBorder right-0 mt-4 w-96 bg-white rounded-lg  shadow-lg border border-gray-200 p-4 z-99999"
                >
                  <h3 className="text-xl font-bold mb-3 text-gray-700">Notifications</h3>

                  {/* Tabs for switching between New Applications and Out of TAT */}
                  <div className="flex space-x-4 border-b pb-2 mb-4">
                    <button
                      className={`text-base font-medium ${activeNotificationTab === "newApplications"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                        }`}
                      onClick={() => setActiveNotificationTab("newApplications")}
                    >
                      New Applications
                    </button>
                    <button
                      className={`text-base font-medium ${activeNotificationTab === "outOfTAT"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                        }`}
                      onClick={() => setActiveNotificationTab("outOfTAT")}
                    >
                      Out of TAT
                    </button>

                    <button
                      className={`text-base font-medium ${activeNotificationTab === "newBulks"
                        ? "text-blue-500 border-b-2 border-blue-500"
                        : "text-gray-500"
                        }`}
                      onClick={() => setActiveNotificationTab("newBulks")}
                    >
                      New Bulk Files
                    </button>
                  </div>


                  {activeNotificationTab === "outOfTAT" && (
                    <ul className="mt-2 space-y-2">
                      {sortedTatDelayNotifications.length > 0 ? (
                        [...sortedTatDelayNotifications]
                          .sort((a, b) => a.newNotification.localeCompare(b.newNotification)) // Sort new notifications to top
                          .map((notification, index) => {
                            const isPriority = notification.isPriority === "1";
                            const newNotification = notification.newNotification === "0";

                            return (
                              <li
                                key={index}
                                className={`text-sm text-gray-600 p-2 border-b last:border-b-0 ${newNotification ? "bg-yellow-100" : ""
                                  } relative ${isPriority ? "border-green-500" : "border-gray-200"}`}
                              >
                                {newNotification && (
                                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                )}
                                <div className="flex justify-between items-center">
                                  <span>
                                    <strong>{notification.applicationName}</strong>
                                    {` (`}
                                    <strong>{notification.applicationID}</strong>
                                    {`) for `}
                                    <em>{notification.customerName}</em>
                                    {` is ${notification.daysOutOfTat} days out of TAT.`}
                                  </span>
                                  {isPriority && <span className="text-green-500 font-bold">Priority</span>}
                                </div>
                              </li>
                            );
                          })
                      ) : (
                        <li className="text-sm text-gray-600">No new notifications</li>
                      )}
                    </ul>
                  )}


                  {activeNotificationTab === "newApplications" && (
                    <ul className="mt-2 space-y-2 overflow-y-scroll max-h-96">
                      {sortedApplicationNotifications.length > 0 ? (
                        [...sortedApplicationNotifications]
                          .sort((a, b) => a.newNotification.localeCompare(b.newNotification)) // Sort new notifications to top
                          .map((notification, index) => {
                            const isPriority = notification.isPriority === "1";
                            const newNotification = notification.newNotification === "0";

                            return (
                              <li
                                key={index}
                                className={`text-sm text-gray-600 p-2 border-b last:border-b-0 ${newNotification ? "bg-yellow-100" : ""
                                  } relative ${isPriority ? "border-green-500" : "border-gray-200"}`}
                              >
                                {newNotification && (
                                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                )}
                                <div className="flex justify-between items-center">
                                  <span>
                                    {`New Application of `}
                                    <strong>{notification.applicationName}</strong>
                                    {` (`}
                                    <strong>{notification.applicationID}</strong>
                                    {`) from `}
                                    <em>{notification.customerName}</em>
                                  </span>
                                  {isPriority && <span className="text-green-500 font-bold">Priority</span>}
                                </div>
                              </li>
                            );
                          })
                      ) : (
                        <li className="text-sm text-gray-600">No new notifications</li>
                      )}
                    </ul>
                  )}

                  {activeNotificationTab === "newBulks" && (
                    <ul className="mt-2 space-y-2 overflow-y-scroll max-h-96">
                      {sortedBulkUploadsNotifications.length > 0 ? (
                        [...sortedBulkUploadsNotifications]
                          .sort((a, b) => a.newNotification.localeCompare(b.newNotification)) // Sort new notifications to top
                          .map((notification, index) => {
                            const newNotification = notification.newNotification === "0";

                            return (
                              <li
                                key={index}
                                className={`text-sm text-gray-600 p-2 border-b last:border-b-0 ${newNotification ? "bg-yellow-100" : ""
                                  } relative border-gray-200`}
                              >
                                {newNotification && (
                                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
                                )}
                                <div className="flex justify-between items-center">
                                  <span>
                                    {`Bulk file uploaded by `}
                                    <strong>{notification.branchName}</strong>
                                    {` (`}
                                    <strong>{notification.customerName}</strong>
                                    {`) under `}
                                    <em>{notification.clientSpocName}</em>
                                    {` on `}
                                    <strong>{notification.createdAt}</strong>.
                                  </span>
                                  <button
                                    type="button"
                                    className="ml-4 text-blue-500 font-bold hover:underline"
                                    onClick={() => {
                                      if (notification.zip) {
                                        const url = new URL(notification.zip);
                                        const baseFileName = url.pathname.substring(url.pathname.lastIndexOf('/') + 1);
                                        const link = document.createElement("a");
                                        link.href = notification.zip;
                                        link.download = baseFileName;
                                        link.click();
                                      } else {
                                        alert("No ZIP file URL available.");
                                      }
                                    }}
                                  >
                                    Download ZIP
                                  </button>
                                </div>
                              </li>
                            );
                          })
                      ) : (
                        <li className="text-sm text-gray-600">No new notifications</li>
                      )}
                    </ul>
                  )}





                </div>
              )}


            </div>
            {/* <button
              onClick={handleCheckin}
              className={`md:text-xl text-sm border-4 rounded-md border-orange-400 transition md:block hidden duration-200 cursor-pointer
    bg-blue-400 hover:bg-blue-500 text-gray-600 hover:text-[#004391]
      `}
            >
              <div className="p-2 m-auto text-center">
                <span className="block md:text-base text-sm text-white font-semibold">
                  CHECKIN 
                </span>
              </div>
            </button>
            <button
              onClick={handleCheckout}
              className={`md:text-xl text-sm border-4 rounded-md border-orange-400 transition md:block hidden duration-200 cursor-pointer
                bg-blue-500 hover:bg-blue-400 text-gray-600 hover:text-[#004391]
                  `}
            >
              <div className="p-2 m-auto text-center">
                <span className="block md:text-base text-sm text-white font-semibold">
                  CHECKOUT 
                </span>
              </div>
            </button> */}


            <Link
              to="/admin-LeaveManagement"
              className="md:text-xl text-sm text-gray-600 hover:text-[#004391] transition md:block hidden duration-200 cursor-pointer"
              onClick={() => handlePersonalClick('Leave Management')}
            >
              <div className="p-3 m-auto text-center">
                <span className="block md:text-base text-sm text-[#004391] font-semibold">EMPLOYEE</span>
                <span className="block md:text-base text-sm text-[#004391] font-semibold">MANAGEMENT</span>
              </div>
            </Link>




            <button
              onClick={openModal}
              className={`signoutButton  border-4 border-blue-400 hidden lg:block font-semibold uppercase py-2 px-6 rounded transition duration-200 ${isSignoutLoading ? 'opacity-50 cursor-not-allowed' : 'hoverBgOrange hover:text-white'
                }`}
              disabled={isSignoutLoading}
            >
              {isSignoutLoading ? 'Signing Out...' : 'Sign Out'}
            </button>

          </div>
        </div>
      </div>
    </nav >


  );
};

export default AdminHeader;
