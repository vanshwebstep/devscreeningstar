import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaClipboardList, FaHome, FaIdBadge } from "react-icons/fa";
import Logo from "../imgs/screeningLogoNew.png";
import { CgProfile } from "react-icons/cg";
import { IoNotifications } from "react-icons/io5";
import { RiArrowRightWideLine } from "react-icons/ri";

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

const menuItems = [
  { key: "profile", label: "MY PROFILE", icon: <FaIdBadge className="text-4xl m-auto" /> },
  // { key: "services", label: "SCOPE OF SERVICES", icon: <FaClipboardList className="text-4xl m-auto" /> },
];

const VendorDashboard = () => {
  const navigate = useNavigate();
  const vendor = JSON.parse(localStorage.getItem("vendor") || "{}");
  const services = flattenServices(vendor.services);
  const [activeSection, setActiveSection] = useState("profile");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const signOut = () => {
    localStorage.removeItem("vendor");
    localStorage.removeItem("vendor_token");
    navigate("/vendor-login");
  };

  const handleMenuClick = (key) => {
    setActiveSection(key);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const activeItem = menuItems.find((item) => item.key === activeSection) || menuItems[0];

  return (
    <div className="min-h-screen bg-white text-black">
      <header className="bg-gradient-to-r from-gray-100 via-gray-200 to-gray-300 shadow-md">
        <div className="mx-auto md:px-10 px-4 py-4">
          <div className="flex md:flex-row justify-between items-center">
            <div className="lg:hidden">
              <button className="text-[#4d606b]" onClick={() => setIsMenuOpen((value) => !value)}>
                <FaBars className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => handleMenuClick("profile")} className="text-[#4d606b] hidden lg:block">
                <FaHome className="text-3xl hover:text-[#004391] transition duration-200" />
              </button>
              <div className="border newBorderOrange  rounded-md p-2 shadow-md">
                <button onClick={() => handleMenuClick("profile")}>
                  <img src={Logo} alt="ScreeningStar" className="md:w-[13.5rem] w-auto" />
                </button>
              </div>
              <span className="text-xs md:text-lg hidden lg:block font-bold text-[#4d606b]">Hi Vendor...</span>
            </div>
            <div className="md:mt-4 mt-0 flex items-center md:gap-10 gap-4">
              <CgProfile className="text-4xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer" />
              <IoNotifications className="md:text-4xl text-2xl text-gray-600 hover:text-[#004391] transition duration-200 cursor-pointer" />
              <button onClick={signOut} className="border uppercase signoutButton hidden lg:block hover:text-white font-semibold py-2 px-6 rounded transition duration-200">
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="block md:flex flex-grow desktopPOS">
        <aside className="bg-white md:h-full">
          <div className="container flex flex-col mx-auto md:py-4 py-0">
            <ul className="flex flex-col sm:block hidden max-w-[250px] min-w-[250px] space-y-2">
              {menuItems.map((item) => (
                <li
                  key={item.key}
                  className={`flex justify-center align-middle mx-[30px] min-h-[130px] border border-[#7d7d7d] transition duration-300 transform ease-in-out ${activeSection === item.key
                    ? "activeSubmenu bg-[#c1dff2] text-gray-800 scale-105"
                    : "bg-gradient-to-b from-gray-100 to-gray-300 text-[#4d606b] hover:bg-gradient-to-b hover:from-[#cde4f3] hover:to-[#cde4f3] hover:bg-[#cde4f3] hover:text-gray-800 hover:font-semibold hover:scale-105"
                    } rounded-md shadow-md hover:shadow-lg`}
                >
                  <button className="flex flex-wrap justify-center items-center p-2 w-full font-semibold" onClick={() => handleMenuClick(item.key)}>
                    <div className="p-2 m-auto text-center">
                      {item.icon}
                      <div className="mt-2 text-sm">{item.label}</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            <ul className={`flex-col space-y-2 px-4 pt-4 sm:pt-0 ${isMenuOpen ? "block" : "hidden"} sm:hidden`}>
              {menuItems.map((item) => (
                <li key={item.key} className={`flex items-center border border-gray-300 p-3 rounded-md transition duration-300 transform ${activeSection === item.key ? "bg-gray-200 text-gray-800 font-semibold scale-105" : "bg-white text-gray-600 hover:bg-gray-100 hover:scale-105"} shadow-md hover:shadow-lg`}>
                  <button className="flex items-center space-x-2 w-full" onClick={() => handleMenuClick(item.key)}>
                    <div className="flex gap-3 items-center">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-grow w-full overflow-hidden h-full">
          <div className="w-full mx-auto">
            <div className="bg-white">
              <div className="m-auto md:flex items-center w-full md:w-auto justify-between mb-4">
                <div className="md:py-3 flex-wrap gap-y-4 flex items-center md:pb-1">
                  <button className="text-lg font-bold text-white" onClick={() => handleMenuClick("profile")}>
                    <div className="tab bg-[#d1d1d1] relative z-999 px-6 py-[7px]">
                      <FaHome className="text-[rgb(44,129,186)] text-3xl hover:text-black" />
                     
                        <RiArrowRightWideLine className="absolute  right-[-46px] top-[-28px] text-[100px] uppercase text-white z-50" />
                  
                    </div>
                  </button>
                  <div className="w-full md:w-auto tab bg-[#c1dff2] transition-all duration-300 ease-in-out relative polygon">
                    <button className="tab-link transition-all duration-300 ease-in-out uppercase font-bold text-black bg-[#c1dff2]" onClick={() => handleMenuClick(activeItem.key)}>
                      {activeItem.label}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="border border-black bg-white">
            {activeSection === "profile" ? (
              <>
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
              </>
            ) : (
              <>
                <h2 className="text-center md:text-4xl text-2xl font-bold pb-8 md:pt-7 md:pb-4">SCOPE OF SERVICES</h2>
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
              </>
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

export default VendorDashboard;