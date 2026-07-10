import React, { useState, useEffect, useRef } from "react";
import "../App.css";
import { useSidebarContext } from './SidebarContext';
import Modal from "react-modal";
import { FaHome } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { RiArrowRightWideLine } from "react-icons/ri";
import { useApiLoading } from './ApiLoadingContext';
import { useApiLoadingBranch } from './BranchApiLoadingContext';

Modal.setAppElement("#root");
const Submenu = () => {
  const navigate = useNavigate();
  const { validateAdminLogin, setApiLoading, apiLoading } = useApiLoading();
  const { apiLoadingBranch } = useApiLoadingBranch();

  const { handleSectionClick, setSectionTabs, openDropdown, setOpenDropdown } = useSidebarContext();

  const sectionTabs = JSON.parse(localStorage.getItem('sectiontabJson'));




  const [animateTabs, setAnimateTabs] = useState(true);
  const [subMenu, setSubMenu] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const storedToken = localStorage.getItem("token");
  const dropdownRef = useRef(null);

  const [activeTab, setActiveTab] = useState(localStorage.getItem('activeTab'));

  useEffect(() => {
    const storedDropdown = localStorage.getItem('openDropdown');
    const subMenu = localStorage.getItem('subMenu');


    if (storedDropdown) {
      setOpenDropdown(storedDropdown);
    }

    setAnimateTabs(true);
  }, []);

  const handleSignout = async () => {
    console.log("Attempting to sign out...");
    try {
      if (!storedToken) {
        console.error('No token found');
        return;
      }
      const response = await fetch('https://api.screeningstar.co.in/Screeningstar/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${storedToken}`,
        },
      });
      if (response.ok) {
        console.log("Signout successful.");
        localStorage.clear();
        navigate('/admin-login');
      } else {
        const errorMessage = await response.text();
        console.error('Logout failed:', errorMessage);
      }
    } catch (error) {
      console.error('An error occurred during signout:', error);
    }
  };

  const openModal = () => {
    console.log("Opening signout modal...");
    setIsModalOpen(true);
  };
  const closeModal = () => {
    console.log("Closing signout modal...");
    setIsModalOpen(false);
  };
  const confirmSignout = () => {
    console.log("Confirming signout...");
    handleSignout();
    closeModal();
  };

  const toggleDropdown = (index, hasSubMenu, tabKey) => {
    const isDropdownOpen = openDropdown === tabKey;

    console.log("Toggling dropdown:", { index, hasSubMenu, tabKey });

    if (!hasSubMenu || !hasSubMenu.length) {
      console.log("No submenu available. Closing dropdowns.");
      setOpenDropdown(null);
      setActiveTab(null);
      localStorage.removeItem('openDropdown');
      localStorage.removeItem('activeTab');
      return;
    }

    if (isDropdownOpen) {
      console.log("Closing currently open dropdown:", tabKey);
      setOpenDropdown(null);
      setActiveTab(null);
      localStorage.removeItem('openDropdown');
      localStorage.removeItem('activeTab');
    } else {
      console.log("Opening dropdown:", tabKey);
      setOpenDropdown(tabKey);
      setActiveTab(hasSubMenu[0].key);
      localStorage.setItem('openDropdown', tabKey);
      localStorage.setItem('activeTab', hasSubMenu[0].key);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (openDropdown === "accountManagement") {
          return;
        } else if (openDropdown === "createUser") {
          return;
        } else if (openDropdown === "generateInvoice") {
          return;
        }

        console.log("Click detected outside dropdown. Closing dropdown.");
        setOpenDropdown(null);
        localStorage.removeItem('openDropdown');
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openDropdown]);

  useEffect(() => {
    sectionTabs && Array.isArray(sectionTabs) && sectionTabs.forEach((tab) => {
      const storedSubMenu = localStorage.getItem('subMenu');
      if (storedSubMenu === tab.name) {
        let updatedSubMenu = tab.key;
        if (storedSubMenu === 'See More') {
          updatedSubMenu = 'Service Management';
        }
        if (storedSubMenu === 'Client Overview') {
          updatedSubMenu = 'Add client';
        }
        if (storedSubMenu === 'Employee Credentials') {
          updatedSubMenu = 'create User';
        } if (storedSubMenu === 'leaveManagement') {
          updatedSubMenu = 'leaveManagement ';
        }
        localStorage.setItem('subMenu', updatedSubMenu);
        console.log('Match found: Setting subMenu to', updatedSubMenu);
      }
    });
  }, [sectionTabs]);
  const defaultTabKey = (sectionTabs && sectionTabs.length > 0) ? sectionTabs[0].key : "";

  const currentSubMenu = localStorage.getItem("subMenu") || defaultTabKey;



  // useEffect(() => {

  //   const storedTabs = localStorage.getItem('sectionTabs');

  //   if (!storedTabs) {
  //     // If not, set it to the default value and store in localStorage
  //     localStorage.setItem('sectionTabs', JSON.stringify(sectionTabs));
  //   } else {
  //     // If exists, initialize state with the value from localStorage
  //     setSectionTabs(JSON.parse(storedTabs));
  //   }
  // }, []); 
  return (
    <>
      <div className={`w-full mx-auto ${sectionTabs && sectionTabs.length === 0 ? "bg-white" : ""}`}>

        <div className="bg-white">
          <div
            className={`m-auto md:flex items-center  w-full md:w-auto justify-between 
    ${localStorage.getItem('inHome') == "yes" ? "mb-0" :
                localStorage.getItem('activeTab') !== null ? "mb-16" : "mb-4"}`}
          >            <div className="md:py-3 flex-wrap  gap-y-4 flex items-center md:pb-1">
              {sectionTabs && sectionTabs.length > 0 && (
                <Link
                  className="text-lg font-bold text-white"
                  to={localStorage.getItem('isBranchExist') === 'yes' ? '/user-dashboard' : '/'}
                  onClick={(e) => {
                    if (apiLoading || apiLoadingBranch) {
                      e.preventDefault();
                    } else {
                      handleSectionClick('Home')
                    }
                  }}
                >

                  <div className={`tab  bg-[#d1d1d1] relative z-999 ${sectionTabs && sectionTabs.length === 0 ? "py-1.5 px-4 rounded-full hidden" : "px-6 py-[7px] tab relative"}`}>
                    <FaHome className="text-[rgb(44,129,186)] text-3xl hover:text-black" />
                    {sectionTabs && Array.isArray(sectionTabs) && sectionTabs.length > 0 && (
                      <RiArrowRightWideLine className="absolute  right-[-46px] top-[-28px] text-[100px] uppercase text-white z-50" />
                    )}
                  </div>
                </Link>
              )}
              {sectionTabs && Array.isArray(sectionTabs) && sectionTabs.map((tab, index) => {
                const isLastTab = index === sectionTabs.length - 1;
                console.log('currentSubMenu -- 0', currentSubMenu)
                console.log('tab.key -- 0', tab.key)

                const isActive = currentSubMenu === tab.key;

                return (
                  <div
                    key={tab.key}
                    className={` w-full md:w-auto tab ${isActive ? 'bg-[#c1dff2]' : 'bg-[#d1d1d1]'}  transition-all duration-300 ease-in-out relative ${isLastTab ? 'polygon' : ''}`}

                    style={isLastTab ? { borderRadius: "40px transition-all duration-300 " } : {}}

                  >
                    <Link
                      to={tab.href}
                      className={`tab-link  transition-all duration-300 ease-in-out ${(apiLoading || apiLoadingBranch) ? 'cursor-not-allowed opacity-50' : ''}
  uppercase ${isActive ? "font-bold text-black bg-[#c1dff2]" : " bg-[#d1d1d1] text-[#2c81ba]"
                        }`}
                      onClick={(e) => {
                        if (apiLoading || apiLoadingBranch) {
                          e.preventDefault(); // Prevent navigation if apiLoading is true
                        } else {
                          toggleDropdown(index, tab.subMenu, tab.key);
                          localStorage.setItem("subMenu", tab.key);
                        }
                      }}
                    >
                      {tab.name}
                    </Link>

                    {openDropdown === tab.key &&
                      activeTab &&
                      tab.subMenu &&
                      tab.subMenu.length > 0 && (
                        <div
                          ref={dropdownRef}
                          className={`submenu dropdownmargin flex ${openDropdown === "accountManagement" ? "md:top-[110px] top-[350px] md:overflow-x-auto overflow-x-scroll md:max-w-fit  max-w-[450px]" : ""
                            }${openDropdown === "generateInvoice" ? "top-[50px] left-[-350px]" : ""
                            } ${openDropdown === "createUser" ? "top-[50px] left-[-80px]" : ""
                            } absolute md:left-[-320px] md:gap-1`}
                        >
                          {tab.subMenu.map((subItem) => (
                            <Link
                              key={subItem.key}
                              to={subItem.href}
                              className={`block m-2.5 whitespace-nowrap  ${(apiLoading || apiLoadingBranch) ? 'cursor-not-allowed opacity-50' : ''}
 transition-all duration-300 md:text-base text-xs  ease-in-out  uppercase py-1.5 md:px-6 px-4 rounded-full ${activeTab === subItem.key
                                  ? "bg-[#2c81ba] text-white"
                                  : "bg-gray-300 text-gray-600"
                                }`}
                              onClick={(e) => {
                                if (apiLoading || apiLoadingBranch) {
                                  e.preventDefault(); // Prevent navigation if apiLoading is true
                                } else {
                                  setActiveTab(subItem.key);
                                  localStorage.setItem("activeTab", subItem.key);
                                }
                              }}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}

                    {!isLastTab && (
                      <RiArrowRightWideLine className="absolute right-[-46px] top-[-28px] text-[100px] text-white z-10" />
                    )}
                  </div>
                );
              })}

            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        contentLabel="Confirm Signout"
        className="modal-content"
        overlayClassName="modal-overlay"
      >
        <h2>Are you sure you want to sign out?</h2>
        <div className="flex justify-end mt-4">
          <button onClick={closeModal} className="px-4 py-2 bg-gray-500 text-white rounded-lg mr-2">Cancel</button>
          <button onClick={confirmSignout} className="px-4 py-2 bg-red-600 text-white rounded-lg">Signout</button>
        </div>
      </Modal>
    </>
  );
};

export default Submenu;
