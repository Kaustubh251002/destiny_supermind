import React from "react";

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center">
        <p className="text-gray-600">© 2025 InstaBuddy. All rights reserved.</p>
        <div className="flex space-x-6">
          <a href="#" className="text-gray-600 hover:text-indigo-600">
            <i className="bi bi-twitter"></i>
          </a>
          <a href="#" className=" ">
            <i className="bi bi-instagram"></i>
          </a>
          <a href="#" className="text-gray-600 hover:text-indigo-600">
            <i className="bi bi-linkedin"></i>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
