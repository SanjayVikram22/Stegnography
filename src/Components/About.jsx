import React from "react";

export default function About() {
  return (
    <>
      <div className="about-content py-12 bg-stone-400 text-gray-100 relative">
        <a
          href="/"
          className="absolute top-3 right-3 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
        >
          Home
        </a>
        <div className="container mx-auto px-6">
          <h1 className="text-5xl font-bold mb-10 text-center text-yellow-400">
            About Us
          </h1>
          <p className="text-xl mb-12 text-center max-w-3xl mx-auto text-gray-50 leading-relaxed">
            Meet the team behind the Fernet encryption project, committed to
            pioneering secure communication through advanced encryption and
            steganography. By integrating Fernet encryption with LSB
            steganography, we set a new standard in data privacy, ensuring
            confidential and covert transmission for modern digital security.
          </p>

          <h2 className="text-4xl font-semibold mb-8 text-yellow-400 text-center">
            Project Team
          </h2>
          <ul className="space-y-4 mb-16">
            <li className="bg-indigo-700 text-white py-4 px-6 rounded-md shadow-md hover:shadow-2xl transition duration-200">
              M.Sethil Kumar - Project Supervisor
            </li>
            <li className="bg-indigo-700 text-white py-4 px-6 rounded-md shadow-md hover:shadow-xl transition duration-200">
              Roja Sri V - Web Design and AES method Optimizer
            </li>
            <li className="bg-indigo-700 text-white py-4 px-6 rounded-md shadow-md hover:shadow-xl transition duration-200">
              Gokulnath M - Web Development
            </li>
            <li className="bg-indigo-700 text-white py-4 px-6 rounded-md shadow-md hover:shadow-xl transition duration-200">
              Ashok Kumar P - Flask Code Establishment
            </li>
            <li className="bg-indigo-700 text-white py-4 px-6 rounded-md shadow-md hover:shadow-xl transition duration-200">
              Kathirvel R - Web deployment and Server Issue Handler
            </li>
          </ul>

          <h2 className="text-4xl font-semibold mb-8 text-yellow-400 text-center">
            Our Vision
          </h2>
          <p className="text-xl text-gray-50 leading-relaxed max-w-3xl mx-auto text-center">
            Our vision is to bridge the gap between innovative encryption
            methods and practical data security solutions. Through projects like
            Fernet encryption, we aim to fortify data privacy, streamline secure
            communication, and protect sensitive information, ensuring a safer
            digital future for all.
          </p>
        </div>
      </div>
    </>
  );
}
