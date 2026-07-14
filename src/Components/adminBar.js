import React, { useState, useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSidebarContext } from './SidebarContext'; // Correct named import and fix typo
import { MobileContext } from "./MobileContext";
import { FcSalesPerformance, FcCalendar, FcCustomerSupport, FcManager, FcBarChart, FcDatabase } from "react-icons/fc";
import {
  FaUser,
  FaFileInvoice,

  FaUserCog,
  FaTrash,
  FaClipboardList,
  FaUserShield,
  FaEdit,
  FaCode,
  FaSignOutAlt,
  FaNewUser,
  FaUsersCog,
  FaFileAlt,
  FaDatabase,
  FaIdBadge,
  FaKey,
  FaRegFileAlt,
  FaSignInAlt,
  FaTasks,
  FaClock, FaHistory, FaCheckCircle, FaTicketAlt
} from "react-icons/fa";
import { useApiLoading } from './ApiLoadingContext';
import { MdStorage } from "react-icons/md";
import { GrServices } from "react-icons/gr";
import { useParams } from 'react-router-dom';
const AdminBar = () => {
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();

  const { isMenuOpen, setIsMenuOpen } = useContext(MobileContext);
  const fullUrl = window.location.href;
  const urlParts = fullUrl.split('/');    // Split URL by "/"
  const desiredPart = urlParts[urlParts.length - 1];  // Get the last part (after "screening")
  console.log('queryParams', desiredPart);
  const [isAnimating, setIsAnimating] = useState(false);
  const [roleByLocal, setRoleByLocal] = useState(null);


  const [isTabOpen, setIsTabOpen] = useState(false);
  const { handleSectionClick, setOpenDropdown } = useSidebarContext();
  const [activeTab, setActiveTab] = useState('');
  const [animationClose, setAnimationClose] = useState(false);
  const [adminManagerOpen, setAdminManagerOpen] = useState(false);
  const [animation, setAnimation] = useState(false);



  const handleClick = (linkName) => {
    localStorage.setItem('SideBarName', linkName)
    localStorage.removeItem('activeTab');
    localStorage.removeItem('openDropdown');
    setOpenDropdown(null)
    if (linkName !== 'See More') {
      setTimeout(() => {
        setIsMenuOpen(false);
      }, 800);
    }

    if (linkName === 'Client Overview') {
      localStorage.setItem('subMenu', 'clientOnboarding');
    } else if (linkName === 'Vendor Management') {
      localStorage.setItem('subMenu', 'vendorOnboarding');
    } else if (linkName === 'Go To Login') {
      localStorage.setItem('subMenu', 'enterSaleData');
    } else if (linkName === 'Admin Manager') {
      localStorage.setItem('subMenu', 'adminManager');
      if (adminManagerOpen) {
        setAnimationClose(true);

        // Delay the state change to give animation time
        setTimeout(() => {
          setAdminManagerOpen(false);
          setAnimationClose(false); // Reset animation state after closing
        }, 500); // Assuming animation duration is 500ms, adjust accordingly
      } else {
        // Open and reset animationClose state when opening
        setAdminManagerOpen(true);
        // setAnimationClose(false);
      }


      if (adminManagerOpen) {
        setAnimation((prevState) => !prevState);
      }
    } else if (linkName === 'Acknowledgement') {
      localStorage.setItem('subMenu', 'acknowledgement');
    } else if (linkName === 'Candidate Manager') {
      localStorage.setItem('subMenu', 'adminCandidateManager');
    } else if (linkName === 'Data Management') {
      localStorage.setItem('subMenu', 'dataManagement');
    } else if (linkName === 'Import Client Data') {
      localStorage.setItem('subMenu', 'importClientData');
    } else if (linkName === 'Team Management') {
      localStorage.setItem('subMenu', 'teamManagement');
    } else if (linkName === 'Case Allocation To Vendor') {
      localStorage.setItem('subMenu', 'caseAllocationToVendor');
    } else if (linkName === 'TICKETS') {
      localStorage.setItem('subMenu', 'createTickets');
    } else if (linkName === 'TAT Reminder') {
      localStorage.setItem('subMenu', 'tatReminder');
    } else if (linkName === 'Report Master') {
      localStorage.setItem('subMenu', 'applicationStatus');
    } else if (linkName === 'Service Report Forms') {
      localStorage.setItem('subMenu', 'ServiceReportForms');
    } else if (linkName === 'Case Allocation') {
      localStorage.setItem('subMenu', 'CaseAllocation');
    } else if (linkName === 'Integration Services') {
      localStorage.setItem('subMenu', 'IntegrationServices');
    } else if (linkName === 'Human Resource') {
      localStorage.setItem('subMenu', 'HumanResourceMenu');
    } else if (linkName === 'See More') {
      localStorage.setItem('subMenu', 'createUser');
    } else if (linkName === 'Employee Credentials') {
      localStorage.setItem('subMenu', 'createUser');
    } else if (linkName === 'Billing Dashboard') {
      localStorage.setItem('subMenu', 'generateInvoice');
    } else if (linkName === 'User History') {
      localStorage.setItem('subMenu', 'userHistory');
    } else if (linkName === 'APPLICATION DOCUMENT') {
      localStorage.setItem('subMenu', 'Documents');
    } else if (linkName === 'See More') {
      localStorage.setItem('subMenu', 'createUser');
    } else if (linkName === 'Trash Applications') {
      localStorage.setItem('subMenu', 'trashapplications');
    } else if (linkName === 'Universities') {
      localStorage.setItem('subMenu', 'universities');
    }

    else {
      localStorage.setItem('subMenu', linkName);
    }
    if (linkName !== 'See More' && linkName !== 'Admin Manager') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }


    handleSectionClick(linkName);
  };
  console.log('localStorage', localStorage);
  // localStorage.clear()
  const handleOpenClick = () => {
    handleClick('See More');
    if (isTabOpen) {
      setIsTabOpen(false);
    } else {
      setIsTabOpen(true);
    }
  }
  useEffect(() => {
    // Get the role from localStorage and set it into the state
    const storedRole = JSON.parse(localStorage.getItem('admin'))?.role;
    setRoleByLocal(storedRole);
  }, []);

  const [shouldRender, setShouldRender] = useState(isTabOpen);
  const [visibleItems, setVisibleItems] = useState([]); // Track visible items for stagger effect
  const tabs = [
    { name: "Employee Credentials", icon: <FaUserShield className="text-3xl m-auto" />, link: "/admin-createUser" },
    { name: "Billing Dashboard", icon: <FaFileInvoice className="text-3xl m-auto" />, link: "/admin-generate-invoice" },
    { name: "User History", icon: <FaHistory className="text-3xl m-auto" />, link: "/admin-user-history" }
  ];

  useEffect(() => {
    if (isTabOpen) {
      setShouldRender(true);
      setIsAnimating(true);

      // Open: Stagger items from top to bottom
      tabs.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => [...prev, index]);
        }, index * 100);
      });

    } else {
      setIsAnimating(false);

      // Close: Stagger items from bottom to top
      tabs.forEach((_, index) => {
        setTimeout(() => {
          setVisibleItems((prev) => prev.filter((i) => i !== tabs.length - 1 - index));
        }, index * 100);
      });

      setTimeout(() => setShouldRender(false), tabs.length * 100 + 500);
    }
  }, [isTabOpen]);
  return (
    <nav className="bg-gradient-to-r bg-white md:h-full ">
      <div className="container flex flex-col mx-auto md:py-4 py-0">
        <ul className=" flex flex-col  sm:block hidden  max-w-[250px] space-y-2">
          <li
            className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-500 transform ease-in-out ${activeTab === 'Client Overview' || localStorage.getItem('SideBarName') === 'Client Overview'
              ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-add-new-client"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Client Overview' || localStorage.getItem('SideBarName') === 'Client Overview' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent the default action if apiLoading is true
                } else {
                  handleClick('Client Overview');
                }
              }}
            >
              <div className="p-3 m-auto text-center">
                <FaUser className="text-4xl m-auto" />
                CLIENT OVERVIEW
              </div>
            </Link>

          </li>
          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Vendor Management' || localStorage.getItem('SideBarName') === 'Vendor Management'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-vendor-onboarding"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Vendor Management' || localStorage.getItem('SideBarName') === 'Vendor Management' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault();
                } else {
                  handleClick('Vendor Management');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaUsersCog className="text-4xl m-auto" />
                VENDOR MANAGEMENT
              </div>
            </Link>
          </li>



          {/* <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Go To Login' || localStorage.getItem('SideBarName') === 'Go To Login'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-client-credentials"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Go To Login' || localStorage.getItem('SideBarName') === 'Go To Login' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Go To Login');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaSignInAlt  className="text-4xl m-auto" />
                GO TO LOGIN
              </div>
            </Link>
          </li> */}

          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Admin Manager' || localStorage.getItem('SideBarName') === 'Admin Manager'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-admin-manager"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Admin Manager' || localStorage.getItem('SideBarName') === 'Admin Manager' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Admin Manager');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaUserCog className="text-4xl m-auto" />
                ADMIN MANAGER
              </div>
            </Link>
          </li>
          {adminManagerOpen && (
            <div
              className={`transform transition-all max-w-56 mx-auto mt-0 duration-700 ease-in-out origin-top 
      ${adminManagerOpen ? 'opacity-100 translate-y-0 scale-y-100' : 'opacity-0 -translate-y-20 scale-y-50'} 
      ${!adminManagerOpen ? 'transition-all duration-1000' : ''}`}
            >
              {[
                { name: 'Data Management', icon: <FaDatabase className="text-4xl m-auto" />, link: '/admin-data-management' },
                { name: 'Import Client Data', icon: <FaFileAlt className="text-4xl m-auto" />, link: '/admin-import-client-data' },
                { name: 'Team Management', icon: <FaUsersCog className="text-4xl m-auto" />, link: '/admin-team-management' },
                { name: 'Case Allocation To Vendor', icon: <FaTasks className="text-4xl m-auto" />, link: '/admin-case-allocation-to-vendor' },
                { name: 'APPLICATION DOCUMENT', icon: <FaFileAlt className="text-4xl m-auto" />, link: '/admin-documents' },
                { name: 'Candidate Manager', icon: <FaEdit className="text-4xl m-auto" />, link: '/admin-candidate-manager' },
                { name: 'ValuePitch Manager', icon: <FaFileAlt className="text-4xl m-auto" />, link: '/admin-valuepitch-manager' }
              ].map((tab, index) => (
                <li
                  key={tab.name}
                  className={`flex justify-center mx-[30px] border staggered border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out 
          ${activeTab === tab.name || localStorage.getItem('SideBarName') === tab.name
                      ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
                      : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'
                    } rounded-md shadow-md hover:shadow-lg ${animationClose ? '' : 'notstaggered'}`}
                  style={{
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  <Link
                    to={tab.link}
                    className={`flex flex-wrap justify-center items-center p-2 
            ${activeTab === tab.name || localStorage.getItem('SideBarName') === tab.name ? 'font-semibold' : ''} 
            ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={(e) => {
                      if (apiLoading) {
                        e.preventDefault(); // Prevent navigation if apiLoading is true
                      } else {
                        handleClick(tab.name);
                      }
                    }}
                  >
                    <div className="p-2 m-auto text-center">
                      {tab.icon}
                      <h5 className="text-base">{tab.name.toUpperCase()}</h5>
                    </div>
                  </Link>
                </li>
              ))}
            </div>
          )}



          {/* <li className={` flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px]  transition duration-300 transform ease-in-out ${activeTab === 'Candidate Manager' || localStorage.getItem('SideBarName') === 'Candidate Manager'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
            } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-candidate-manager"
              className={` flex flex-wrap justify-center items-center p-2 ${activeTab === 'Candidate Manager' || localStorage.getItem('SideBarName') === 'Candidate Manager' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Candidate Manager')}
            >
              <div className="p-2 m-auto text-center " >
                <FaEdit className="text-4xl m-auto" />
                <h5 className="text-sm whitespace-nowrap"> CANDIDATE MANAGER</h5>
              </div>
            </Link>
          </li> */}

          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Acknowledgement' || localStorage.getItem('SideBarName') === 'Acknowledgement'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-acknowledgement"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Acknowledgement' || localStorage.getItem('SideBarName') === 'Acknowledgement' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Acknowledgement');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaCheckCircle className="text-4xl m-auto" />
                <h5 className="text-sm"> ACKNOWLEDGEMENT</h5>
              </div>
            </Link>
          </li>

          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'TICKETS' || localStorage.getItem('SideBarName') === 'TICKETS'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-createTicket"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'TICKETS' || localStorage.getItem('SideBarName') === 'TICKETS' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('TICKETS');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaTicketAlt className="text-4xl m-auto" />
                TICKETS
              </div>
            </Link>
          </li>
          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'TAT Reminder' || localStorage.getItem('SideBarName') === 'TAT Reminder'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-tat-reminder"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'TAT Reminder' || localStorage.getItem('SideBarName') === 'TAT Reminder' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('TAT Reminder');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaClock className="text-4xl m-auto" />
                TAT REMINDER
              </div>
            </Link>
          </li>

          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Report Master' || localStorage.getItem('SideBarName') === 'Report Master'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-application-status"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Report Master' || localStorage.getItem('SideBarName') === 'Report Master' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Report Master');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaClipboardList className="text-4xl m-auto" />
                REPORT MASTER
              </div>
            </Link>
          </li>

          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Case Allocation' || localStorage.getItem('SideBarName') === 'Case Allocation'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-CaseAllocation"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Case Allocation' || localStorage.getItem('SideBarName') === 'Case Allocation' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Case Allocation');
                }
              }}
            >
              <div className="p-2 m-auto whitespace-nowrap text-center">
                <FaTasks className="text-4xl m-auto" />
                CASE ALLOCATION
              </div>
            </Link>
          </li>

          <li
            className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'IntegrationServices' || localStorage.getItem('SideBarName') === 'IntegrationServices'
              ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-IntegrationServices"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Integration Services' || localStorage.getItem('SideBarName') === 'Integration Services' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Integration Services');
                }
              }}
            >
              <div className="p-2 m-auto whitespace-nowrap text-center">
                <FaIdBadge className="text-4xl m-auto" />
                INTEGRATION
                <br />
                SERVICES
              </div>
            </Link>
          </li>

          {(!roleByLocal || roleByLocal !== 'sub_user' && roleByLocal !== 'user') && (
            <li
              className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Human Resource' || localStorage.getItem('SideBarName') === 'Human Resource'
                ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
                : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
                } rounded-md shadow-md hover:shadow-lg`}>
              <Link
                to="/admin-HumanResourceMenu"
                className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Human Resource' || localStorage.getItem('SideBarName') === 'Human Resource' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                onClick={(e) => {
                  if (apiLoading) {
                    e.preventDefault(); // Prevent navigation if apiLoading is true
                  } else {
                    handleClick('Human Resource');
                  }
                }}
              >
                <div className="p-2 m-auto whitespace-nowrap text-center">
                  <FaIdBadge className="text-4xl m-auto" />
                  HUMAN RESOURCE
                </div>
              </Link>
            </li>
          )}
          <li className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'See More' || localStorage.getItem('SideBarName') === 'See More'
            ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105'
            : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105'} rounded-md shadow-md hover:shadow-lg`}>
            <Link
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'See More' || localStorage.getItem('SideBarName') === 'See More' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleOpenClick();
                }
              }}
              to={'/'}
            >
              <div className="p-2 m-auto text-center">
                <FaKey className="text-4xl m-auto" />
                ADMIN ACCESS
              </div>
            </Link>
          </li>
          {shouldRender && (
            <div className="max-w-56 mx-auto mt-0 duration-500">
              {tabs.map((tab, index) => (
                <li
                  key={tab.name}
                  className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 ease-out transform
          ${visibleItems.includes(index)
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-3 scale-100"
                    }
          ${activeTab === tab.name || localStorage.getItem("SideBarName") === tab.name
                      ? "bg-[#c1dff2] text-gray-800 activeSubmenu scale-105"
                      : "bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105"
                    } rounded-md shadow-md hover:shadow-lg`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <Link
                    to={tab.link}
                    className={`flex flex-wrap justify-center items-center p-2 ${activeTab === tab.name || localStorage.getItem("SideBarName") === tab.name ? "font-semibold" : ""}
            ${apiLoading ? "cursor-not-allowed opacity-50" : ""}`}
                    onClick={(e) => {
                      if (apiLoading) {
                        e.preventDefault(); // Prevent navigation if apiLoading is true
                      } else {
                        handleClick(tab.name);
                      }
                    }}
                  >
                    <div className="p-2 m-auto text-center">
                      {tab.icon}
                      <h5 className="text-base">{tab.name.toUpperCase()}</h5>
                    </div>
                  </Link>
                </li>
              ))}
            </div>
          )}


          <li
            className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Trash Applications' || localStorage.getItem('SideBarName') === 'Trash Applications'
              ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-TrashApplications"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Trash Applications' || localStorage.getItem('SideBarName') === 'Trash Applications' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Trash Applications');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaTrash className="text-4xl m-auto" />
                TRASH
              </div>
            </Link>
          </li>
          <li
            className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Universities' || localStorage.getItem('SideBarName') === 'Universities'
              ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-Universities"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Universities' || localStorage.getItem('SideBarName') === 'Universities' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Universities');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <MdStorage className="text-4xl m-auto" />
                INTERNAL STORAGE
              </div>
            </Link>
          </li>

          {/* <li
            className={`flex justify-center mx-[30px] border border-[#7d7d7d] min-h-[130px] transition duration-300 transform ease-in-out ${activeTab === 'Service Report Forms' || localStorage.getItem('SideBarName') === 'Service Report Forms'
              ? 'bg-[#c1dff2] text-gray-800 activeSubmenu scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}>
            <Link
              to="/admin-ServiceReportForm"
              className={`flex flex-wrap justify-center items-center p-2 ${activeTab === 'Service Report Forms' || localStorage.getItem('SideBarName') === 'Service Report Forms' ? 'font-semibold' : ''} ${apiLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={(e) => {
                if (apiLoading) {
                  e.preventDefault(); // Prevent navigation if apiLoading is true
                } else {
                  handleClick('Service Report Forms');
                }
              }}
            >
              <div className="p-2 m-auto text-center">
                <FaCode className="text-4xl m-auto" />
                DEVELOPERS
              </div>
            </Link>
          </li> */}


        </ul>
        <ul
          className={`flex-col space-y-2 px-4 pt-4 sm:pt-0 ${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}
        >

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform  ${activeTab === 'Client Overview' || localStorage.getItem('SideBarName') === 'Client Overview'
              ? 'bg-gray-200 text-gray-800 font-semibold scale-105' // Light blue background and slight zoom effect when selected
              : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105' // Light blue on hover with zoom effect
              } rounded-md shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-add-new-client"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Client Overview' || localStorage.getItem('SideBarName') === 'Client Overview' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Client Overview')}
            >
              <div className=" flex gap-3 ">
                <FaUser className="text-2xl" />
                <span>{'CLIENT OVERVIEW'}</span>
              </div>
            </Link>
          </li>
          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Vendor Management' || localStorage.getItem('SideBarName') === 'Vendor Management'
              ? 'bg-gray-200 text-gray-800 font-semibold scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'
              } shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-vendor-onboarding"
              className={`flex items-center space-x-2 w-full ${activeTab === 'Vendor Management' || localStorage.getItem('SideBarName') === 'Vendor Management' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Vendor Management')}
            >
              <div className="flex gap-3">
                <FaUsersCog className="text-2xl" />
                <span>{'VENDOR MANAGEMENT'}</span>
              </div>
            </Link>
          </li>
          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Go To Login' || localStorage.getItem('SideBarName') === 'Go To Login'
              ? 'bg-gray-200 text-gray-800 font-semibold scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'
              } shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-client-credentials"
              className={`flex items-center space-x-2 w-full ${activeTab === 'Go To Login' || localStorage.getItem('SideBarName') === 'Go To Login'
                ? 'font-semibold'
                : ''
                }`}
              onClick={() => handleClick('Go To Login')}
            >
              <div className="flex gap-3">
                <FaClipboardList className="text-2xl" />
                <span>{'GO TO LOGIN'}</span>
              </div>
            </Link>
          </li>

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300  p-3 rounded-md transition duration-300 transform ${activeTab === 'Admin Manager' || localStorage.getItem('SideBarName') === 'Admin Manager'
              ? 'bg-gray-200 text-gray-800 font-semibold scale-105'
              : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'
              } shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-admin-manager"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Admin Manager' || localStorage.getItem('SideBarName') === 'Admin Manager'
                ? 'font-semibold'
                : ''
                }`}
              onClick={() => handleClick('Admin Manager')}
            >
              <div className="flex gap-3">
                <FaUserCog className="text-2xl" />
                <span>{'ADMIN MANAGER'}</span>
              </div>
            </Link>
          </li>

          {adminManagerOpen && (
            <div className="transition duration-300 ease-in-out transform origin-top">
              {['Data Management', 'Import Client Data', 'Team Management', 'Case Allocation To Vendor', 'APPLICATION DOCUMENT', 'Candidate Manager'].map((tab, index) => {
                const tabRoutes = {
                  'Data Management': '/admin-data-management',
                  'Import Client Data': '/admin-import-client-data',
                  'Team Management': '/admin-team-management',
                  'Case Allocation To Vendor': '/admin-case-allocation-to-vendor',
                  'APPLICATION DOCUMENT': '/admin-documents',
                  'Candidate Manager': '/admin-candidate-manager',
                };

                return (
                  <li
                    key={tab}
                    className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-2 rounded-md w-11/12 m-auto transition duration-300 transform ${activeTab === tab || localStorage.getItem('SideBarName') === tab
                      ? 'bg-gray-200 text-gray-800 font-semibold scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'
                      } shadow-md hover:shadow-lg`}
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <Link
                      to={tabRoutes[tab] || '/default-route'}
                      className={` flex items-center space-x-2 w-full ${activeTab === tab || localStorage.getItem('SideBarName') === tab
                        ? 'font-semibold'
                        : ''
                        }`}
                      onClick={() => handleClick(tab)}
                    >
                      <div className="flex gap-3">
                        {tab === 'Data Management' && <FaDatabase className="text-lg" />}
                        {tab === 'Import Client Data' && <FaFileAlt className="text-lg" />}
                        {tab === 'Team Management' && <FaUsersCog className="text-lg" />}
                        {tab === 'Case Allocation To Vendor' && <FaTasks className="text-lg" />}
                        {tab === 'APPLICATION DOCUMENT' && <FaFileAlt className="text-lg" />}
                        {tab === 'Candidate Manager' && <FaEdit className="text-lg" />}
                        <span className="text-xs">{tab.toUpperCase()}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </div>
          )}

          {/* <li
            className={`${apiLoading  ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Candidate Manager' || localStorage.getItem('SideBarName') === 'Candidate Manager' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-candidate-manager"
              className={`${apiLoading  ? 'pointer-events-none opacity-50' : ''} flex items-center space-x-2 w-full ${activeTab === 'Candidate Manager' || localStorage.getItem('SideBarName') === 'Candidate Manager' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Candidate Manager')}
            >
              <FaEdit className="text-2xl" />
              <h5 className="text-sm">CANDIDATE MANAGER</h5>
            </Link>
          </li> */}

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Acknowledgement' || localStorage.getItem('SideBarName') === 'Acknowledgement' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-acknowledgement"
              className={`flex items-center space-x-2 w-full ${activeTab === 'Acknowledgement' || localStorage.getItem('SideBarName') === 'Acknowledgement' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Acknowledgement')}
            >
              <FaCheckCircle className="text-2xl" />
              <h5 className="text-sm">ACKNOWLEDGEMENT</h5>
            </Link>
          </li>

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'TICKETS' || localStorage.getItem('SideBarName') === 'TICKETS' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-createTicket"
              className={` flex items-center space-x-2 w-full ${activeTab === 'TICKETS' || localStorage.getItem('SideBarName') === 'TICKETS' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('TICKETS')}
            >
              <FaTicketAlt className="text-2xl" />
              <h5 className="text-sm">TICKETS</h5>
            </Link>
          </li>

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'TAT Reminder' || localStorage.getItem('SideBarName') === 'TAT Reminder' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-tat-reminder"
              className={` flex items-center space-x-2 w-full ${activeTab === 'TAT Reminder' || localStorage.getItem('SideBarName') === 'TAT Reminder' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('TAT Reminder')}
            >
              <FaClock className="text-2xl" />
              <h5 className="text-sm">TAT REMINDER</h5>
            </Link>
          </li>

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Report Master' || localStorage.getItem('SideBarName') === 'Report Master' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-application-status"
              className={`flex items-center space-x-2 w-full ${activeTab === 'Report Master' || localStorage.getItem('SideBarName') === 'Report Master' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Report Master')}
            >
              <FaClipboardList className="text-2xl" />
              <h5 className="text-sm">REPORT MASTER</h5>
            </Link>
          </li>


          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Case Allocation' || localStorage.getItem('SideBarName') === 'Case Allocation' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-CaseAllocation"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Case Allocation' || localStorage.getItem('SideBarName') === 'Case Allocation' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Case Allocation')}
            >
              <FaTasks className="text-2xl" />
              <h5 className="text-sm">CASE ALLOCATION</h5>
            </Link>
          </li>
          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Case Allocation' || localStorage.getItem('SideBarName') === 'Case Allocation' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-IntegrationServices"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Integration Services' || localStorage.getItem('SideBarName') === 'Integration Services' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Integration Services')}
            >
              <FaTasks className="text-2xl" />
              <h5 className="text-sm">Integration Services</h5>
            </Link>
          </li>

          <li className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'See More' || localStorage.getItem('SideBarName') === 'See More'
            ? 'bg-gray-200 text-gray-800 font-semibold scale-105'
            : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105' // Hover effect for unselected item
            } shadow-md hover:shadow-lg`}>
            <Link
              className={` flex items-center space-x-2 w-full ${activeTab === 'See More' || localStorage.getItem('SideBarName') === 'See More' ? 'font-semibold' : ''}`}
              onClick={() => handleOpenClick()}
              to={'/'}
            >
              <FaKey className="text-2xl" />
              <h5 className="text-sm">ADMIN ACCESS</h5>
            </Link>
          </li>
          {shouldRender && (
            <div className="mx-auto mt-0 duration-500">
              {tabs.map((tab, index) => (
                <li
                  key={tab.name}
                  className={`flex justify-center border mb-2  p-3  border-[#7d7d7d]transition duration-300 ease-out transform
          ${visibleItems.includes(index)
                      ? "opacity-100 translate-y-0 scale-100"
                      : "opacity-0 translate-y-3 scale-100"
                    }
          ${activeTab === tab.name || localStorage.getItem("SideBarName") === tab.name
                      ? "bg-[#c1dff2] text-gray-800 activeSubmenu scale-105"
                      : "bg-white text-gray-600 hover:bg-gray-100 hover:scale-105 hover:font-semibold "
                    } rounded-md shadow-md hover:shadow-lg`}
                  style={{
                    transitionDelay: `${index * 100}ms`,
                  }}
                >
                  <Link
                    to={tab.link}
                    className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center space-x-2 w-full ${activeTab === tab.name || localStorage.getItem("SideBarName") === tab.name ? "font-semibold" : ""} 
            ${apiLoading ? "cursor-not-allowed opacity-50" : ""}`}
                    onClick={(e) => {
                      if (apiLoading) {
                        e.preventDefault(); // Prevent navigation if apiLoading is true
                      } else {
                        handleClick(tab.name);
                      }
                    }}
                  >
                    {tab.icon && <span className="text-2xl">{tab.icon}</span>}
                    <h5 className="text-sm">{tab.name.toUpperCase()}</h5>
                  </Link>
                </li>
              ))}
            </div>
          )}

          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Trash Applications' || localStorage.getItem('SideBarName') === 'Trash Applications' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-TrashApplications"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Trash Applications' || localStorage.getItem('SideBarName') === 'Trash Applications' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Trash Applications')}
            >
              <FaTrash className="text-2xl" />
              <h5 className="text-sm"> Trash</h5>
            </Link>
          </li>
          <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Universities' || localStorage.getItem('SideBarName') === 'Universities' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-Universities"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Universities' || localStorage.getItem('SideBarName') === 'Universities' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Universities')}
            >
              <MdStorage className="text-2xl" />
              <h5 className="text-sm"> INTERNAL STORAGE</h5>
            </Link>
          </li>

          {/* <li
            className={`${apiLoading ? 'pointer-events-none opacity-50' : ''} flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeTab === 'Service Report Forms' || localStorage.getItem('SideBarName') === 'Service Report Forms' ? 'bg-gray-200 text-gray-800 font-semibold scale-105' : 'bg-white text-gray-600 hover:bg-gray-100 hover:scale-105'} shadow-md hover:shadow-lg`}
          >
            <Link
              to="/admin-ServiceReportForm"
              className={` flex items-center space-x-2 w-full ${activeTab === 'Service Report Forms' || localStorage.getItem('SideBarName') === 'Service Report Forms' ? 'font-semibold' : ''}`}
              onClick={() => handleClick('Service Report Forms')}
            >
              <FaCode className="text-2xl" />
              <h5 className="text-sm"> DEVELOPERS</h5>
            </Link>
          </li> */}

        </ul>
      </div>
    </nav>
  );
};

export default AdminBar;
