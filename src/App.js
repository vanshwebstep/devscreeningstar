import React from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from "react-router-dom";
import { SidebarProvider } from './Components/SidebarContext'; // Corrected named import
import Submenu from './Components/Submenu.js';
import "./App.css"
import BackgroundVerificationForm from "./Components/background-form.js"
import DigitalAddressVerification from "./Components/DigitalAddressVerification.js"
import { ApiLoadingProvider } from "./Components/ApiLoadingContext";
import { BranchApiLoadingProvider } from "./Components/BranchApiLoadingContext";
import AdminBar from "./Components/adminBar";
import UserBar from "./Components/userBar.js";
import AdminHeader from "./Components/adminHeader.js"
import AdminLogin from "./Components/admin-Login";
import UserLogin from "./Components/userLogin";
import VendorLogin from "./Components/VendorLogin";
import VendorForgotPassword from "./Components/VendorForgotPassword";
import VendorResetPassword from "./Components/VendorResetPassword";
import VendorDashboard from "./Components/VendorDashboard";
import VendorUpdatePassword from "./Components/VendorUpdatePassword";
import VendorLoginCheck from "./Components/VendorLoginCheck";
import Dashboard from "./Components/Pages/dashboard";
import AddClient from "./Components/Pages/addClient";
import ScreeningstarAdmin from "./Components/Pages/screeningstarAdmin";
import CreateInvoice from "./Components/Pages/createInvoice";
import AdminManager from "./Components/Pages/adminManager";
import ValuePitchManager from "./Components/Pages/valuepitchManager";
import ReportMaster from "./Components/Pages/reportMaster";
import ClientCredentials from "./Components/Pages/clientCredentials";
import IntegrationServices from "./Components/Pages/IntegrationServices"
import TATReminder from "./Components/Pages/tatReminder";
import Acknowledgement from "./Components/Pages/acknowledgement";
import CreateUser from "./Components/Pages/createUser";
import ClientSpoc from "./Components/Pages/clientSpoc";
import ActiveAccounts from "./Components/Pages/activeAccounts";
import InactiveClients from "./Components/Pages/inactiveClients";
import GenerateInvoice from "./Components/Pages/generateInvoice";
import RecordTrackers from "./Components/Pages/recordsTrackers";
import InvoiceMaster from "./Components/Pages/invoiceMaster";
import EscalationManager from "./Components/Pages/escalationManager";
import BillingSpoc from "./Components/Pages/billingSpoc";
import LeaveManagement from "./Components/Pages/LeaveManagement";
import HumanResourceMenu from "./Components/Pages/HumanResourceMenu";
import BillingEscalation from "./Components/Pages/billingEscalation";
import AuthorizedDetails from "./Components/Pages/authorizedDetails";
import ExistingUsers from "./Components/Pages/existingUsers";
import ApplicationStatus from "./Components/Pages/applicationStatus";
import AdminChekin from "./Components/Pages/adminChekin";
import ValuePitchChekin from "./Components/Pages/valuepitchChekin.js";
import GenerateReport from "./Components/Pages/generateReport.js";
import GenerateReportServiceForm from "./Components/Pages/GenerateReportServiceForms.js";
import DataGenerateReport from "./Components/Pages/DataGenerateReport.js";
import Form1 from "./Components/Pages/CandidateApplication/form1.js";
import Form2 from "./Components/Pages/CandidateApplication/form2.js";
import Form3 from "./Components/Pages/CandidateApplication/form3.js";
import EditUser from "./Components/Pages/editUser.js";
import PrepareReport from "./Components/Pages/prepareReport.js";
import ServiceManagement from "./Components/Pages/serviceManagment.js";
import ServiceManagementGroup from "./Components/Pages/ServiceManagmentGroup.js";
import PackageManagement from "./Components/Pages/packageManagment.js";
import LoginCheck from './Components/Pages/LoginCheck.js';
import IsNotLogin from './Components/Pages/isNotLogin.js';
import DataManagement from "./Components/Pages/dataManagment.js";
import ImportClientData from "./Components/Pages/ImportClientData.js";
import TeamManagment from "./Components/Pages/teamManagment.js";
import ClientManagementData from "./Components/Pages/admin-clienttable.js";
import UserHistory from "./Components/Pages/UserHistory.js";
import ViewUser from "./Components/Pages/ViewUser.js";
import CreateAdminTicket from "./Components/Pages/CreateAdminTicket.js";
import ViewAdminTicket from "./Components/Pages/ViewAdminTicket.js";
import RecordTracker from "./Components/Pages/Record&Tracker.js";
import TeamManagementGenerateReport from "./Components/Pages/TeamManagementReportGenerate.js";
import TeamManagementCheckin from "./Components/Pages/TeamManagementCheckin.js";
import AdminCandidateManager from "./Components/Pages/AdminCandidateManager.js";
import AdminCandidateCheckin from "./Components/Pages/AdminCandidateCheckin.js";
import ServiceReportForm from "./Components/Pages/ServiceReportForm.js";







import 'react-select-search/style.css'
import SelectSearch from 'react-select-search';
import AdminForgotPassword from './Components/Pages/Admin-Forgot-Password';
import AdminSetPassword from './Components/Pages/Admin-Set-Password';
import AdminUpdatePassword from "./Components/Pages/Admin-Update-Password.js"
import PermissionManager from './Components/Pages/PermissionManager.js';
import  DataCheckin from './Components/Pages/DataCheckin.js';
import  Documents from './Components/Pages/Documents.js';
import  DocumentCheckin from './Components/Pages/DocumentCheckin.js';
import  CandidateBGV from './Components/Pages/AdminCandidateBGV.js';
import  CandidateDAV from './Components/Pages/AdminCandidateDAV.js';


import CaseAllocationList from "./Components/Pages/CaseAllocationList.js";
import CaseAllocationToVendor from "./Components/Pages/CaseAllocationToVendor.js";
import CaseAllocation from "./Components/Pages/CaseAllocation.js";



import BranchLoginCheck from './Components/UserPages/Branch-LoginCheck.js';
import UserDashboard from "./Components/UserPages/userDashboard.js"
import usePagination from './Components/Pages/usePagination.js';
import UserCreate from "./Components/UserPages/createUser.js";
import VerificationStatus from "./Components/UserPages/VerificationStatus.js";
import BulkApplication from "./Components/UserPages/BulkApplication.js";
import ChecklistAndEscalation from "./Components/UserPages/ChecklistAndEscalation.js";
import MasterDashboard from "./Components/UserPages/MasterDashboard.js";
import CreateTickets from "./Components/UserPages/CreateTickets.js";
import ApiIntegration from "./Components/UserPages/ApiIntegration.js";
import CandidateManager from "./Components/UserPages/CandidateManager.js";
import ClientManager from "./Components/UserPages/ClientManager.js";
import DataTable from "./Components/UserPages/innerpages/MasterTable.js";
import UserHeader from "./Components/UserPages/userHeader.js";
import UserForgotPassword from './Components/UserPages/User-Forgot-Password';
import UserSetPassword from "./Components/UserPages/User-reset-password";
import UserUpdatePassword from "./Components/UserPages/User-Update-Password";
import ClientBulkUpload from "./Components/UserPages/ClientBulkUpload.js"
import CandidateBulkUpload from "./Components/UserPages/CandidateBulkUpload.js"
import UserListing from "./Components/UserPages/User-Listing.js"
import ViewUserTicket from "./Components/UserPages/viewUserTicket.js"
import ExpenseMaster from "./Components/Pages/ExpenseMaster.js";



import { MobileProvider } from "./Components/MobileContext";
import { ClientProvider } from "./Components/Pages/ClientContext.js";
import EditClient from "./Components/Pages/EditClient.js";
import { ServiceProvider } from "./Components/Pages/ServiceContext.js";
import Modules from "./Components/Pages/Modules.js";
import ViewModules from "./Components/Pages/ModuleView.js";
import CkEditor from "./Components/Pages/CkEditor.js";
import ServiceBGVForm from "./Components/Pages/ServiceBGVForm.js";
import GenerateServiceBGVForm from "./Components/Pages/GenerateServiceBGVForm.js";
import LeaveListing from "./Components/Pages/LeaveListing.js";
import MyProfile from "./Components/UserPages/MyProfile.js";
import Attendance from "./Components/Pages/Attendance.js";
import ApplicationTrash from "./Components/Pages/ApplicationTrash.js";
import ApplicationTrashCheckin from "./Components/Pages/ApplicationTrashCheckin.js";
import CustomerTrash from "./Components/Pages/CustomerTrash.js";
import CLientTrashed from "./Components/UserPages/CLientTrashed.js";
import Universities from "./Components/Pages/Universities.js";
import ExEmployements from "./Components/Pages/ExEmployments.js";
import Vendors from "./Components/Pages/Vendors.js";
import AdminVendorOnboarding from "./Components/Pages/AdminVendorOnboarding.js";
import AdminVendorListing from "./Components/Pages/AdminVendorListing.js";
import AdminInactiveVendorListing from "./Components/Pages/AdminInactiveVendorListing.js";
import AdminVendorEdit from "./Components/Pages/AdminVendorEdit.js";
import BusinessDevelopmentActivity from "./Components/Pages/BusinessDevelopmentActivity.js";
import UniversitiesBulk from "./Components/Pages/UniversitiesBulk.js";
import ExEmploymentBulk from "./Components/Pages/ExEmploymentBulk.js";
import VendorBulk from "./Components/Pages/VendorBulk.js";
import BusinessDevelopmentBulk from "./Components/Pages/BusinessDevelopmentBulk.js";
import CaseAllocationBulk from "./Components/Pages/CaseAllocationBulk.js";
import TimeManagement from "./Components/Pages/TimeManagement.js";
import CaseAllocationEdit from "./Components/Pages/CaseAllocationEdit.js";

const Layout = () => {
  const location = useLocation();
  const isUserRoute = location.pathname.startsWith("/user");
  const isVendorRoute = location.pathname.startsWith("/vendor");
  const isAdminRoute = location.pathname.startsWith("/admin") || location.pathname === "/";
  const hideSidebarAndHeader =
    location.pathname === "/admin-login" ||
    location.pathname === "/admin-forgot-password" ||
    location.pathname === "/user-forgot-password" ||
    location.pathname === "/admin-set-password" ||
    location.pathname === "/branch/reset-password" ||
    location.pathname === "/reset-password" ||
    location.pathname === "/userLogin"||
    location.pathname === "/admin-update-password"||
    location.pathname === "/user-update-password" ||
    isVendorRoute ||
    location.pathname === "/background-form" ||
    location.pathname === "/digital-form"
    
  return (
    <div className="">
      <div className="flex flex-col h-screen ">
        {!hideSidebarAndHeader && (
          <>
            {isUserRoute && !isAdminRoute && <UserHeader />}
            {isAdminRoute && !isUserRoute && <AdminHeader />}
            
          </>
        )}
        <div className="block md:flex flex-grow desktopPOS">
          {!hideSidebarAndHeader && (
            <>
              {isUserRoute && <UserBar />}
              {isAdminRoute && !isUserRoute && <AdminBar />}
            </>
          )}
          <div className="flex-grow w-full overflow-hidden h-full ">
            {!hideSidebarAndHeader && <Submenu />}
            <Routes>

            <Route path="/background-form" element={<BackgroundVerificationForm />} />
            <Route path="/digital-form" element={<DigitalAddressVerification />} />
         
              <Route path="/userLogin" element={<UserLogin />} />
              <Route path="/vendor-login" element={<VendorLogin />} />
              <Route path="/vendor-forgot-password" element={<VendorForgotPassword />} />
              <Route path="/vendor/reset-password" element={<VendorResetPassword />} />
              <Route path="/vendor-dashboard" element={<VendorLoginCheck><VendorDashboard /></VendorLoginCheck>} />
              <Route path="/vendor-update-password" element={<VendorLoginCheck><VendorUpdatePassword /></VendorLoginCheck>} />
              <Route path="/" element={ <LoginCheck><Dashboard /></LoginCheck>} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/admin-forgot-password" element={<IsNotLogin><AdminForgotPassword /></IsNotLogin>} />
              <Route path="/reset-password" element={<IsNotLogin><AdminSetPassword /></IsNotLogin>} />
              <Route path="/admin-update-password" element={<AdminUpdatePassword />} />
              <Route path="/admin-add-new-client" element={<AddClient />} />
              <Route path="/admin-usePagination" element={<usePagination />} />
              <Route path="/admin-editclient" element={<EditClient />} />
              <Route path="/admin-screeningstar-admin" element={<ScreeningstarAdmin />} />
              <Route path="/admin-create-invoice" element={<CreateInvoice />} />
              <Route path="/admin-admin-manager" element={<AdminManager />} />
              <Route path="/admin-valuepitch-manager" element={<ValuePitchManager />} />
              <Route path="/admin-candidate-manager" element={<AdminCandidateManager />} />
              <Route path="/admin-CandidateBGV" element={<CandidateBGV />} />
              <Route path="/admin-CandidateDAV" element={<CandidateDAV />} />
              <Route path="/admin-Modules" element={<Modules/>} />
              <Route path="/admin-ViewModules" element={<ViewModules/>} />
              <Route path="/admin-CkEditor" element={<CkEditor/>} />
              <Route path="/admin-UniversitiesBulk" element={<UniversitiesBulk/>} />
              <Route path="/admin-ExEmploymentBulk" element={<ExEmploymentBulk/>} />
              <Route path="/admin-VendorBulk" element={<VendorBulk/>} />
              <Route path="/admin-BusinessDevelopmentBulk" element={<BusinessDevelopmentBulk/>} />
              <Route path="/admin-CaseAllocationBulk" element={<CaseAllocationBulk/>} />

              
              <Route path="/admin-DocumentCheckin" element={<DocumentCheckin />} />

              <Route path="/admin-documents" element={<Documents />} />

              <Route path="/admin-data-management" element={<DataManagement />} />
              <Route path="/admin-import-client-data" element={<ImportClientData />} />
              <Route path="/admin-report-master" element={<ReportMaster />} />
              <Route path="/admin-client-credentials" element={<ClientCredentials />} />
              <Route path="/admin-IntegrationServices" element={<IntegrationServices />} />
              <Route path="/admin-tat-reminder" element={<TATReminder />} />
              <Route path="/admin-acknowledgement" element={<Acknowledgement />} />
              <Route path="/admin-createUser" element={<CreateUser />} />
              <Route path="/admin-client-spoc" element={<ClientSpoc />} />
              <Route path="/admin-escalation-manager" element={<EscalationManager />} />
              <Route path="/admin-billing-spoc" element={<BillingSpoc />} />
              <Route path="/admin-billing-esclation" element={<BillingEscalation />} />
              <Route path="/admin-authorized-details" element={<AuthorizedDetails />} />
              <Route path="/admin-active-account" element={<ActiveAccounts />} />
              <Route path="/admin-inactive-clients" element={<InactiveClients />} />
              <Route path="/admin-generate-invoice" element={<GenerateInvoice />} />
              <Route path="/admin-records-and-trackers" element={<RecordTrackers />} />
              <Route path="/admin-invoice-master" element={<InvoiceMaster />} />
              <Route path="/admin-existing-users" element={<ExistingUsers />} />
              <Route path="/admin-application-status" element={<ApplicationStatus />} />
              <Route path="/admin-chekin" element={<AdminChekin />} />
              <Route path="/admin-CandidateCheckin" element={<AdminCandidateCheckin />} />
              <Route path="/admin-DataCheckin" element={<DataCheckin />} />
              <Route path="/admin-valuepitch-checkin" element={<ValuePitchChekin />} />
              <Route path="/admin-user-history" element={<UserHistory />} />
              <Route path="/admin-ViewUser" element={<ViewUser />} />
              <Route path="/admin-createTicket" element={<CreateAdminTicket />} />
              <Route path="/admin-ViewAdminTicket" element={<ViewAdminTicket />} />
              <Route path="/admin-RecordTracker" element={<RecordTracker />} />
              <Route path="/admin-TeamManagementGenerateReport" element={<TeamManagementGenerateReport />} />
              <Route path="/admin-TeamManagementCheckin" element={<TeamManagementCheckin />} />
              <Route path="/admin-ServiceReportForm" element={<ServiceReportForm />} />
              <Route path="/admin-CaseAllocationList" element={<CaseAllocationList/>} />
              <Route path="/admin-case-allocation-to-vendor" element={<CaseAllocationToVendor/>} />
              <Route path="/admin-CaseAllocation" element={<CaseAllocation/>} />
              <Route path="/admin-LeaveManagement" element={<LeaveManagement/>} />
              <Route path="/admin-HumanResourceMenu" element={<HumanResourceMenu/>} />
              <Route path="/admin-ServiceBGVForm" element={<ServiceBGVForm/>} />

              <Route path="/admin-GenerateServiceBGVForm" element={<GenerateServiceBGVForm/>} />
              <Route path="/admin-TimeManagement" element={<TimeManagement/>} />
              <Route path="/admin-expense-master" element={<ExpenseMaster/>} />
 
              
              
              <Route path="/admin-GenerateReportServiceForm" element={<GenerateReportServiceForm />} />
              <Route path="/admin-generate-report" element={<GenerateReport />} />
              
              <Route path="/admin-DataGenerateReport" element={<DataGenerateReport />} />

              <Route path="/form1" element={<Form1 />} />
              <Route path="/form2" element={<Form2 />} />
              <Route path="/form3" element={<Form3 />} />
              <Route path="/admin-editUser/:userId" element={<EditUser />} />
              <Route path="/admin-prepare-report" element={<PrepareReport />} />
              <Route path="/admin-service-management" element={<ServiceManagement />} />
              <Route path="/admin-service-management-group" element={<ServiceManagementGroup />} />
              <Route path="/admin-package-management" element={<PackageManagement />} />
              <Route path="/admin-team-management" element={<TeamManagment />} />
              <Route path="/admin-clienttable" element={<ClientManagementData />} />
              <Route path="/admin-PermissionManager" element={<PermissionManager />} />
              <Route path="/admin-LeaveListing" element={<LeaveListing />} />
              <Route path="/admin-Attendance" element={<Attendance />} />
              <Route path="/admin-TrashApplications" element={<ApplicationTrash />} />
              <Route path="/admin-ApplicationTrashCheckin" element={<ApplicationTrashCheckin />} />
              <Route path="/admin-CustomerTrash" element={<CustomerTrash />} />
              <Route path="/admin-Universities" element={<Universities />} />
              <Route path="/admin-ExEmployements" element={<ExEmployements />} />
              <Route path="/admin-Vendors" element={<Vendors />} />
              <Route path="/admin-vendor-onboarding" element={<AdminVendorOnboarding />} />
              <Route path="/admin-vendor-listing" element={<AdminVendorListing />} />
              <Route path="/admin-inactive-vendor-listing" element={<AdminInactiveVendorListing />} />
              <Route path="/admin-vendor-edit/:vendorId" element={<AdminVendorEdit />} />
              <Route path="/admin-BusinessDevelopmentActivity" element={<BusinessDevelopmentActivity />} />
              <Route path="/admin-CaseAllocationEdit" element={<CaseAllocationEdit />} />

              


              
              
              

              <Route path="/user-dashboard" element={<BranchLoginCheck><UserDashboard /></BranchLoginCheck>} />
              <Route path="/user-ClientBulkUpload" element={<ClientBulkUpload />} />
              <Route path="/user-CandidateBulkUpload" element={<CandidateBulkUpload />} />



              <Route path="/user-create" element={ <UserCreate />} />
              <Route path="/user-candidateManager" element={<CandidateManager />} />
              <Route path="/user-verificationStatus" element={<VerificationStatus />} />
              <Route path="/user-bulkApplication" element={<BulkApplication />} />
              <Route path="/user-checklistAndEscalation" element={<ChecklistAndEscalation />} />
              <Route path="/user-MasterDashboard" element={<MasterDashboard /> } />
              <Route path="/user-createTickets" element={<CreateTickets />} />
              <Route path="/user-ApiIntegration" element={<ApiIntegration />} />
              <Route path="/user-ClientManager" element={<ClientManager />} />
              <Route path="/user-DataTable" element={<DataTable />} />
              <Route path="/user-forgot-password" element={<UserForgotPassword />} />
              <Route path="/branch/reset-password" element={<UserSetPassword />} />
              <Route path="/user-update-password" element={<UserUpdatePassword />} />
              <Route path="/user-listing" element={<UserListing />} />
              <Route path="/user-viewTicket" element={<ViewUserTicket />} />
              <Route path="/user-MyProfile" element={<MyProfile />} />
              <Route path="/user-CLientTrashed" element={<CLientTrashed />} />

              


              


            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (

    <SidebarProvider>
      <ServiceProvider>
        <MobileProvider>
      <ClientProvider>
      <ApiLoadingProvider>
      <BranchApiLoadingProvider>
        
        <Router basename="/">
          <Layout />
        </Router>
        </BranchApiLoadingProvider>
        </ApiLoadingProvider>
      </ClientProvider>
      </MobileProvider>
      </ServiceProvider>
    </SidebarProvider>
  );
};

export default App;
