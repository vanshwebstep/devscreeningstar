import React, { createContext, useState, useEffect, useContext } from "react";
import {
  FcUpload,
  FcConferenceCall,
  FcCustomerSupport,
  FcManager,
  FcMoneyTransfer,
  FcBusinessman,
  FcApproval,
  FcSalesPerformance,
  FcFile,
  FcDatabase,
  FcInspection,
  FcDocument,
  FcServices,
  FcPackage,
  FcCalendar,
  FcDataSheet,
  FcKey,
  FcTimeline,
  FcBriefcase,
  FcBarChart,
  FcPortraitMode,
  FcNightPortrait,

} from "react-icons/fc"; // Added icons

// Create a context for managing sidebar state
const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [openDropdown, setOpenDropdown] = useState(null);

  const [activeTab, setActiveTab] = useState(null); // To manage active tab sections
  const [sectionTabs, setSectionTabs] = useState([]);

  const employeeTabs = [

    { name: "Create User", key: "createUser", href: "/admin-createUser" },
    { name: "Existing User", key: "existingUser", href: "/admin-existing-users" },
    // { name: "Permission Manager",  key: "PermissionManager", href: "/admin-PermissionManager" }
  ];

  const documenttabs = [
    {
      name: "APPLICATION DOCUMENT",
      key: "Documents",
      href: "/admin-documents",
    }
  ]
  const valuePitchTab = [
    {
      name: "ValuePitch Manager",
      key: "ValuePitchManager",
      href: "/admin-valuepitch-manager",
    }
  ]
  const leaveManagement = [
    {
      name: "Leave Management",
      key: "leaveManagement",
      href: "/admin-LeaveManagement",
    }, {
      name: "Leave Listing",
      key: "leaveListing",
      href: "/admin-LeaveListing",
    }, {
      name: "Time Management",
      key: "TimeManagement",
      href: "/admin-TimeManagement",
    }
  ]
  const clientTabs = [
    {
      name: "Client Onboarding",
      key: "clientOnboarding",
      href: "/admin-add-new-client",
    },
    // {
    //   name: "Account Management",
    //   key: "accountManagement",
    //   href: "/admin-client-spoc",
    //   subMenu: [
    //     {
    //       name: "Client Spoc",
    //       key: "clientSpoc",
    //       href: "/admin-client-spoc",
    //     },
    //     {
    //       name: "Escalation Manager",
    //       key: "escalationManager",
    //       href: "/admin-escalation-manager",
    //     },
    //     {
    //       name: "Billing Spoc",
    //       key: "billingSpoc",
    //       href: "/admin-billing-spoc",
    //     },
    //     {
    //       name: "Billing Escalation",
    //       key: "billingEscalation",
    //       href: "/admin-billing-esclation",
    //     },
    //     {
    //       name: "Authorized Details",
    //       key: "authorizedDetails",
    //       href: "/admin-authorized-details",
    //     },
    //   ],
    // },
    {
      name: "Active Accounts",
      key: "activeAccounts",
      href: "/admin-active-account",
    },
    {
      name: "Inactive Clients",
      key: "inactiveClients",
      href: "/admin-inactive-clients",
    },
    {
      name: "Service Management",
      key: "serviceManagement",
      href: "/admin-service-management"
    },
    {
      name: "Service Management Group",
      key: "serviceManagementGroup",
      href: "/admin-service-management-group"
    },
    {
      name: "Package Management",
      key: "packageManagement",
      href: "/admin-package-management"
    },
    {
      name: "Client Credentials",
      key: "enterSaleData",
      href: "/admin-client-credentials"
    },

  ];


  const vendorManagementTabs = [
    {
      name: "Vendor Onboarding",
      key: "vendorOnboarding",
      href: "/admin-vendor-onboarding"
    },
    {
      name: "Active Vendors",
      key: "activeVendors",
      href: "/admin-vendor-listing"
    },
    {
      name: "Inactive Vendors",
      key: "inactiveVendors",
      href: "/admin-inactive-vendor-listing"
    }
    // ,
    // {
    //   name: "Case Allocation To Vendor",
    //   key: "caseAllocationToVendor",
    //   href: "/admin-case-allocation-to-vendor"
    // }
    // {
    //   name: "Vendor Validation Sheet",
    //   key: "vendorValidationSheet",
    //   href: "/admin-vendor-validation-sheet"
    // }
  ];
  const invoiceTabs = [

    {
      name: "Generate Invoice",
      key: "generateInvoice",
      href: "/admin-generate-invoice"
    },
    {
      name: "Records & Trackers",
      key: "recordsAndTrackers",
      href: "/admin-records-and-trackers"
    },
    {
      name: "Invoice Master ",
      key: "enterSaleData",
      href: "/admin-invoice-master"
    }, {
      name: "Expense Master ",
      key: "expenseMaster",
      href: "/admin-expense-master"
    },

  ];

  const clientCredential = [
    {
      name: "Client Credentials",

      key: "enterSaleData",
      href: "/admin-client-credentials"
    }
  ];
  const IntegrationServices = [
    {
      name: "Integration Services",

      key: "IntegrationServices",
      href: "/admin-IntegrationServices"
    }
  ];
  const trashapplications = [
    {
      name: "Trash Applications",
      key: "trashapplications",
      href: "/admin-TrashApplications"
    },
    {
      name: "Trash Customer",
      key: "trashCustomers",
      href: "/admin-CustomerTrash"
    },
  ];
  const universities = [
    {
      name: "Universities",
      key: "universities",
      href: "/admin-Universities"
    },
    {
      name: "Ex-Employments",
      key: "exEmployements",
      href: "/admin-ExEmployements"
    },
    {
      name: "Vendors",
      key: "vendors",
      href: "/admin-Vendors"
    }, {
      name: "Business Development Activity",
      key: "BusinessDevelopmentActivity",
      href: "/admin-BusinessDevelopmentActivity"
    },

  ];
  const clientApplicationTrashed = [
    {
      name: "CLIENT APPLICATION TRASH",
      key: "clientApplicationTrashed",
      href: "/admin-CLientTrashed"
    },

  ];
  const adminManager = [
    {
      name: "Admin Manager",
      key: "adminManager",
      href: "/admin-admin-manager"
    },
  ];
  const dataManagement = [
    {
      name: "Data Management",
      key: "dataManagement",
      href: "/admin-data-management"
    },
    {
      name: "Import Client Data",
      key: "importClientData",
      href: "/admin-import-client-data"
    },
  ];

  const adminTabs = [
    {
      name: "Application Status",
      key: "applicationStatus",
      href: "/admin-application-status"
    },
    {
      name: "PREPARE REPORT",
      key: "reportGeneration",
      href: "/admin-prepare-report"
    },
    // {
    //   name: "QC STATUS",
    //   key: "qcStatus",
    //   href: "/"
    // }
  ];

  const ServiceReportFormsTab = [
    {
      name: "Service Report Form",
      key: "ServiceReportForms",
      href: "/admin-ServiceReportForm"
    }, {
      name: "Service BGV Form",
      key: "ServiceBgvForm",
      href: "/admin-ServiceBGVForm"
    }, {
      name: "Editor Page",
      key: "Modules",
      href: "/admin-Modules"
    }
    // {
    //   name: "Modules",
    //   key: "Modules",
    //   href: "/admin-Modules"
    // }
    ,
    // {
    //   name: "Report Generation",
    //   key: "reportGeneration",
    //   href: "/admin-prepare-report"
    // },
    // {
    //   name: "QC STATUS",
    //   key: "qcStatus",
    //   href: "/"
    // }
  ];
  const CaseAllocationTab = [
    {
      name: "Case Allocation",
      key: "CaseAllocation",
      href: "/admin-CaseAllocation"
    },
    {
      name: "Case Allocation List",
      key: "CaseAllocationList",
      href: "/admin-CaseAllocationList"
    }

  ];
  const HumanResourceMenu = [
    {
      name: "Human Resource",
      key: "HumanResourceMenu",
      href: "/admin-HumanResourceMenu"
    },
    {
      name: "Attendance",
      key: "attendanceMenu",
      href: "/admin-Attendance"
    },
  ];


  const tatReminder = [
    {
      name: "TAT Reminder",
      key: "tatReminder",
      href: "/admin-tat-reminder"
    }
  ]
  const userHistory = [
    {
      name: "User History",
      key: "userHistory",
      href: "/admin-user-history"
    }
  ]
  const acknowledgement = [
    {
      name: "Acknowledgement",
      key: "acknowledgement",
      href: "/admin-acknowledgement"
    }
  ]
  const adminCandidateManager = [
    {
      name: "Candidate Manager",
      key: "adminCandidateManager",
      href: "/admin-candidate-manager"
    }
  ]
  const createadminticket = [
    {
      name: "TICKETS",
      key: "createTickets",
      href: "/admin-createTicket"
    }
  ]
  const teamManagement = [
    {
      name: "Team Management",
      key: "teamManagement",
      href: "/admin-team-management"
    }
  ]
  const caseAllocationToVendor = [
    {
      name: "Case Allocation To Vendor",
      key: "caseAllocationToVendor",
      href: "/admin-case-allocation-to-vendor"
    }
  ]
  const seeMore = [
    // {
    //   name: "DASHBOARD",
    //   key: "dashboard",
    //   href: "/",
    //   button: true // Indicating that this tab is rendered as a button
    // }
    // {
    //   name: "Employee Credentials",
    //   key: "createUser",
    //   href: "/admin-createUser",
    //   subMenu: [
    //     { name: "Create User",  key: "createUser", href: "/admin-createUser" },
    //     { name: "Existing User",  key: "existingUser", href: "/admin-existing-users" },
    //     { name: "Permission Manager",  key: "PermissionManager", href: "/admin-PermissionManager" }

    //   ]
    // },
    // {
    //   name: "Billing Dashboard",
    //   key: "generateInvoice",
    //   href: "/admin-generate-invoice",
    //   subMenu: [
    //     {
    //       name: "Generate Invoice",
    //       key: "generateInvoice",
    //       href: "/admin-generate-invoice"
    //     },
    //     {
    //       name: "Records & Trackers",
    //       key: "recordsAndTrackers",
    //       href: "/admin-records-and-trackers"
    //     },
    //     {
    //       name: "Invoice Master ",
    //       key: "enterSaleData",
    //       href: "/admin-invoice-master"
    //     }
    //   ]
    // },
    // {
    //   name: "User History",
    //   key: "userHistory",
    //   href: "/admin-user-history"
    // },


    // {
    //   name: "Admin Manager",
    //   key: "adminManager",
    //   href: "/admin-admin-manager"
    // },
    // {
    //   name: "TAT Reminder",
    //   key: "tatReminder",
    //   href: "/admin-tat-reminder"
    // },
    // {
    //   name: "Acknowledgement",
    //   key: "acknowledgement",
    //   href: "/admin-acknowledgement"
    // },

    // {
    //   name: "Team Management",
    //   key: "teamManagement",
    //   href: "/admin-team-management"
    // },

    // {
    //   name: "TICKETS",
    //   key: "createTickets",
    //   href: "/admin-createTicket"
    // },
    // {
    //   name: "Reset Password",
    //   key: "resetPassword",
    //   href: "/admin-update-password"
    // }
  ];





  const clientManagerTabs = [
    {
      name: "CLIENT MANAGER",
      key: "clientManager",
      href: "/user-ClientManager"
    }
  ];
  const clientMasterTabs = [
    {
      name: "CANDIDATE MANAGER",
      key: "candidateManager",
      href: "/user-candidateManager"
    }
  ];
  const createInvoiceTabs = [
    {
      name: "CREATE USERS",
      key: "createUsers",
      href: "/user-create"
    },
    {
      name: "USER LISTING",
      key: "userListing",
      href: "/user-listing"
    }
  ];
  const reportMasterTabs = [
    {
      name: "VERIFICATION STATUS",
      key: "verificationStatus",
      href: "/user-verificationStatus"
    }
  ];
  const bulkApplicationTabs = [
    {
      name: "BULK APPLICATION",
      key: "bulkApplication",
      href: "/user-bulkApplication",
      button: true // Indicating that this tab is rendered as a button
    }
  ];
  const masterDashboard = [
    {
      name: "MASTER DASHBOARD",
      key: "masterDashboard",
      href: "/user-MasterDashboard"
    },
  ];
  const createTickets = [
    {
      name: "CREATE TICKETS",
      key: "createTickets",
      href: "/user-createTickets"
    },
  ];
  const checklistAndEscalation = [
    {
      name: "CHECKLIST AND ESCALATION MATRIX",
      key: "checklistAndEscalation",
      href: "/user-checklistAndEscalation"
    },
  ];
  const apiIntegration = [
    {
      name: "API INTEGRATION",
      key: "apiIntegration",
      href: "/user-ApiIntegration"
    },

  ];
  const myProfile = [
    {
      name: "MY PROFILE",
      key: "myProfile",
      href: "/user-MyProfile"
    },

  ];

  const seeMoreTabs = [
    // {
    //   name: "CHECKLIST AND ESCALATION MATRIX",
    //   key: "checklistAndEscalation",
    //   href: "/user-checklistAndEscalation"
    // },

    {
      name: "CREATE TICKETS",
      key: "createTickets",
      href: "/user-createTickets"
    },
    // {
    //   name: "API INTEGRATION",
    //   key: "apiIntegration",
    //   href: "/user-ApiIntegration"
    // },
    // {
    //   name: "User History",
    //   key: "userHistory",
    //   href: "user-dashboard" // Placeholder link
    // },
    // {
    //   name: "RESET PASSWORD",
    //   key: "RESET PASSWORD",
    //   href: "/user-update-password"
    // },
    //  {
    //   name: "VERIFICATION STATUS",
    //   key: "verificationStatus",
    //   href: "/user-verificationStatus"
    // }
  ];

  const handleSectionClick = (section) => {
    let tabs;
    if (!section === "Home") {
      localStorage.setItem('inHome', 'no');
    }
    if (activeTab === section) {
      setActiveTab(null);
      localStorage.removeItem('sectionTabs'); // Remove sectionTabs from localStorage if tab is closed
      setSectionTabs([]); // Clear sectionTabs
    } else {
      // Assign the appropriate tabs based on the section clicked
      if (section === "Employee Credentials") {
        localStorage.setItem('inHome', 'no');
        tabs = employeeTabs;
      } else if (section === "Client Overview") {
        localStorage.setItem('inHome', 'no');
        tabs = clientTabs;
      } else if (section === "Vendor Management") {
        localStorage.setItem('inHome', 'no');
        tabs = vendorManagementTabs;
      } else if (section === "Billing Dashboard") {
        localStorage.setItem('inHome', 'no');
        tabs = invoiceTabs;
      } else if (section === "Report Master") {
        localStorage.setItem('inHome', 'no');
        tabs = adminTabs;
      } else if (section === "Service Report Forms") {
        localStorage.setItem('inHome', 'no');
        tabs = ServiceReportFormsTab;
      } else if (section === "Case Allocation") {
        localStorage.setItem('inHome', 'no');
        tabs = CaseAllocationTab;
      } else if (section === "Human Resource") {
        localStorage.setItem('inHome', 'no');
        tabs = HumanResourceMenu;
      } else if (section === "Attendance") {
        localStorage.setItem('inHome', 'no');
        tabs = HumanResourceMenu;
      } else if (section === "Integration Services") {
        localStorage.setItem('inHome', 'no');
        tabs = IntegrationServices;
      }

      else if (section === "Client Credentials") {
        localStorage.setItem('inHome', 'no');
        tabs = clientCredential;
      } else if (section === "Trash Applications") {
        localStorage.setItem('inHome', 'no');
        tabs = trashapplications;
      } else if (section === "Universities") {
        localStorage.setItem('inHome', 'no');
        tabs = universities;
      }
      else if (section === "CLIENT APPLICATION TRASH") {
        localStorage.setItem('inHome', 'no');
        tabs = clientApplicationTrashed;
      }
      else if (section === "Admin Manager") {
        localStorage.setItem('inHome', 'no');
        tabs = adminManager;
      } else if (section === "Data Management") {
        localStorage.setItem('inHome', 'no');
        tabs = dataManagement;
      } else if (section === "Import Client Data") {
        localStorage.setItem('inHome', 'no');
        tabs = dataManagement;
      } else if (section === "See More") {
        localStorage.setItem('inHome', 'no');
        tabs = seeMore;
      } else if (section === "CLIENT MANAGER") {
        localStorage.setItem('inHome', 'no');
        tabs = clientManagerTabs;
      } else if (section === "CANDIDATE MANAGER") {
        localStorage.setItem('inHome', 'no');
        tabs = clientMasterTabs;
      } else if (section === "CREATE USERS") {
        localStorage.setItem('inHome', 'no');
        tabs = createInvoiceTabs;
      } else if (section === "VERIFICATION STATUS") {
        localStorage.setItem('inHome', 'no');
        tabs = reportMasterTabs;
      } else if (section === "BULK APPLICATION") {
        localStorage.setItem('inHome', 'no');
        tabs = bulkApplicationTabs;
      } else if (section === "SEE MORE") {
        localStorage.setItem('inHome', 'no');
        tabs = seeMoreTabs;
      } else if (section === "TAT Reminder") {
        localStorage.setItem('inHome', 'no');
        tabs = tatReminder;
      } else if (section === "User History") {
        localStorage.setItem('inHome', 'no');
        tabs = userHistory;
      } else if (section === "Acknowledgement") {
        localStorage.setItem('inHome', 'no');
        tabs = acknowledgement;
      } else if (section === "Candidate Manager") {
        localStorage.setItem('inHome', 'no');
        tabs = adminCandidateManager;
      } else if (section === "TICKETS") {
        localStorage.setItem('inHome', 'no');
        tabs = createadminticket;
      } else if (section === "Team Management") {
        localStorage.setItem('inHome', 'no');
        tabs = teamManagement;
      } else if (section === "Case Allocation To Vendor") {
        localStorage.setItem('inHome', 'no');
        tabs = caseAllocationToVendor;
      } else if (section === "MASTER DASHBOARD") {
        localStorage.setItem('inHome', 'no');
        tabs = masterDashboard;
      } else if (section === "CREATE TICKETS") {
        localStorage.setItem('inHome', 'no');
        tabs = createTickets;
      } else if (section === "CHECKLIST AND ESCALATION MATRIX") {
        localStorage.setItem('inHome', 'no');
        tabs = checklistAndEscalation;
      } else if (section === "API INTEGRATION") {
        localStorage.setItem('inHome', 'no');
        tabs = apiIntegration;
      }
      else if (section === "MY PROFILE") {
        localStorage.setItem('inHome', 'no');
        tabs = myProfile;
      } else if (section === "APPLICATION DOCUMENT") {
        localStorage.setItem('inHome', 'no');
        tabs = documenttabs;
      } else if (section === "ValuePitch Manager") {
        localStorage.setItem('inHome', 'no');
        tabs = valuePitchTab;
      }
      else if (section === "Leave Management") {
        localStorage.setItem('inHome', 'no');
        tabs = leaveManagement;
      }
      else if (section === "Home") {
        tabs = [];
        localStorage.setItem('SideBarName', 'home');
        localStorage.setItem('inHome', 'yes');
      }

      setSectionTabs(tabs);
      localStorage.setItem('sectiontabJson', JSON.stringify(tabs)); // Update localStorage after the state is updated
    }

    setActiveTab(section);

  };
  console.log('setActiveTab', activeTab)





  return (
    <SidebarContext.Provider value={{ handleSectionClick, activeTab, sectionTabs, setSectionTabs, openDropdown, setOpenDropdown }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebarContext = () => {
  return useContext(SidebarContext);
};
