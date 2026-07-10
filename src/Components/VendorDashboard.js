import React from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaHome, FaIdBadge, FaRegUserCircle, FaSignOutAlt } from "react-icons/fa";
import Logo from "../imgs/userLoginLogo.png";
import { CgProfile } from "react-icons/cg";
import { IoNotifications } from "react-icons/io5";

const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const valueOrNA = (value) => (value || value === 0 ? value : "NA");

const flattenServices = (services) => {
  const groups = parseJson(services, []);
  if (!Array.isArray(groups)) return [];

  return groups.flatMap((group) => {
    const groupServices = Array.isArray(group.services) ? group.services : [];
    return groupServices.map((service) => ({
      serviceTitle: service.serviceTitle || service.service_title || service.title || "NA",
      serviceCode: service.serviceCode || service.service_code || "NA",
      price: service.price || "NA",
      packages: Array.isArray(service.packages) ? service.packages : [],
      packageName: service.packageName || service.package_name || service.package || "",
    }));
  });
};

const ProfileRow = ({ label, value, valueClass = "" }) => (
  <tr>
    <th className="py-2 px-4 border border-black whitespace-nowrap text-left">{label}</th>
    <td className={`py-2 px-4 border border-black text-left whitespace-nowrap ${valueClass}`}>{valueOrNA(value)}</td>
  </tr>
);

const personRows = (prefix, data) => {
  const details = parseJson(data, {});
  return [
    <ProfileRow key={`${prefix}-name`} label={`${prefix} Name`} value={details.name} />,
    <ProfileRow key={`${prefix}-email`} label={`${prefix} Email`} value={details.email} />,
    <ProfileRow key={`${prefix}-mobile`} label={`${prefix} Mobile`} value={details.mobile} />,
    <ProfileRow key={`${prefix}-designation`} label={`${prefix} Designation`} value={details.designation} />,
  ];
};

const VendorDashboard = () => {
  const navigate = useNavigate();
  const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");
  const services = flattenServices(vendor.services);

  const signOut = () => {
    localStorage.removeItem("vendor");
    localStorage.removeItem("vendor_token");
    navigate("/vendor-login");
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 shadow-md">
        <div className=" mx-auto md:px-10 px-4 py-4">
          <div className="flex  md:flex-row justify-between items-center">
            <div className="flex items-center gap-6">
              <FaHome className="text-3xl hover:text-[#004391] transition duration-200" />
              <div className="border newBorderOrange  rounded-md p-2 shadow-md">
                <img src={Logo} alt="ScreeningStar" className="md:w-[13.5rem] w-auto " />
              </div>
              <span className="text-xs md:text-lg hidden  lg:block font-bold text-[#4d606b]">Hi User...</span>
            </div>
            <div className="md:mt-4 mt-0 flex items-center md:gap-10 gap-4">
                <CgProfile className="text-4xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer" />
                <IoNotifications className="md:text-4xl text-2xl text-gray-600 hover:text-[#004391]  transition duration-200 cursor-pointer" />
              <button onClick={signOut} className="border uppercase signoutButton hidden lg:block   hover:text-white font-semibold py-2 px-6 rounded transition duration-200">
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </header >

      <div className="flex">
        <aside className="w-[174px] bg-white pt-2 min-h-[calc(100vh-98px)]">
          <div className="mx-5 min-h-[112px] border-2 border-[#ee8f1b] bg-[#c1dff2] text-gray-800 rounded-md shadow-md flex items-center justify-center font-bold">
            <div className="text-center p-2">
              <FaIdBadge className="text-4xl m-auto text-[#4d606b]" />
              <div className="mt-2">MY PROFILE</div>
            </div>
          </div>
        </aside>

        <main className="flex-1 pt-3 pr-3 pb-8">
          <div className="mb-4 ml-0 flex items-center">
            <div className="h-9 bg-[#d5d5d5] flex items-center pl-4 pr-3">
              <FaHome className="text-[#2c81ba] text-xl" />
            </div>
            <div className="h-9 bg-[#c1dff2] flex items-center px-8 font-bold text-black clip-path-none">
              MY PROFILE
            </div>
          </div>

          <section className="border border-black bg-white">
            <h2 className="text-center md:text-4xl text-2xl font-bold pb-8 md:pt-7 md:pb-4">MY PROFILE</h2>
            <div className="table-container rounded-lg">
              <div className="table-scroll rounded-lg overflow-x-auto">
                <table className="min-w-full border bg-white overflow-auto shadow-md rounded-md p-3">
                  <tbody>
                    <tr className="bg-[#c1dff2] text-[#4d606b]">
                      <th className="py-2 px-4 border border-black whitespace-nowrap text-center font-bold">PARTICULARS</th>
                      <td className="py-2 px-4 border border-black text-center whitespace-nowrap uppercase font-bold">INFORMATION</td>
                    </tr>
                    <ProfileRow label="Name of the Organization" value={vendor.name_of_organization} />
                    <ProfileRow label="Vendor Code" value={vendor.vendor_code} />
                    <ProfileRow label="Registered Address" value={vendor.registered_address} />
                    <ProfileRow label="State" value={vendor.state} />
                    <ProfileRow label="Pin Code" value={vendor.pin_code} />
                    <ProfileRow label="GSTIN" value={vendor.gst} />
                    <ProfileRow label="TAT" value={vendor.tat} />
                    <ProfileRow label="Agreement Date" value={vendor.agreement_date ? String(vendor.agreement_date).slice(0, 10) : "NA"} />
                    <ProfileRow label="Email ID" value={vendor.email_id} />
                    {personRows("Vendor SPOC", vendor.vendor_spoc)}
                    {personRows("Escalation Manager", vendor.escalation_manager)}
                    {personRows("Authorized Detail", vendor.authorized_details)}
                    <ProfileRow label="Status" value={vendor.status === 0 ? "Inactive" : "Active"} valueClass={vendor.status === 0 ? "text-red-500" : "text-green-500"} />
                  </tbody>
                </table>
              </div>
            </div>

            <h2 className="text-center md:text-4xl text-2xl font-bold pb-8 pt-7 md:pb-4">Scope Of Services</h2>
            <div className="overflow-x-auto bg-white shadow-md rounded-md md:m-10 md:mt-4 m-3 h-full">
              <table className="min-w-full border border-collapse">
                <thead>
                  <tr className="bg-[#c1dff2] text-[#4d606b]">
                    <th className="py-3 px-4 border border-black text-center uppercase">SL NO</th>
                    <th className="py-3 px-4 border border-black text-center uppercase">SERVICE CODE</th>
                    <th className="py-3 px-4 border border-black text-center uppercase">SERVICES</th>
                    <th className="py-3 px-4 border border-black text-center uppercase">PRICING</th>
                    <th className="py-3 px-4 border border-black text-center uppercase">PACKAGES</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? services.map((item, index) => (
                    <tr key={`${item.serviceCode}-${index}`}>
                      <td className="py-2 px-4 border border-black text-center">{index + 1}</td>
                      <td className="py-2 px-4 border border-black text-center">{item.serviceCode}</td>
                      <td className="py-2 px-4 border border-black">{item.serviceTitle}</td>
                      <td className="py-2 px-4 border border-black text-center">{item.price}</td>
                      <td className="py-2 px-4 border border-black text-left">
                        {item.packages.length > 0 ? item.packages.map((pkg) => pkg.name || pkg.packageName || pkg).join(", ") : item.packageName || "No Packages"}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-lg border border-black">No data found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div >
  );
};

export default VendorDashboard;