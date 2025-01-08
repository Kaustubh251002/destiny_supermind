import React from "react";

const Footer = () => {
  return (
    <footer className="border-t bg-white/50 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <i className="bi bi-lightning-charge-fill text-xl text-purple-600"></i>
            <p className="text-gray-600">© 2025 InstaBuddy. All rights reserved.</p>
          </div>
          <div className="flex space-x-8">
            {['twitter', 'instagram', 'linkedin'].map((platform) => (
              <a
                key={platform}
                href="#"
                className="text-gray-500 hover:text-indigo-600 transform hover:scale-125 transition-all duration-300"
              >
                <i className={`bi bi-${platform} text-xl`}></i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
