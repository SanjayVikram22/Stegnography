import React from "react";
import { useNavigate } from "react-router-dom";

export default function Audio() {
  const navigate = useNavigate();

  const navigateToEncode = () => {
    navigate("/encode_audio");
  };

  const navigateToDecode = () => {
    navigate("/decode_audio");
  };
  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center bg-stone-400 relative">
        
        {/* About Us Button */}
        <a
          href="/"
          className="absolute top-3 right-3 text-white bg-red-500 hover:bg-red-700 px-4 py-2 rounded shadow"
        >
          Home
        </a>

        {/* Title */}
        <h1 className="text-red-600 text-4xl md:text-5xl font-bold mb-16">
          Audio Steganography
        </h1>

        <div className="flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32">
          {/* Encode Button */}
          <div
            onClick={navigateToEncode}
            className="bg-blue-600 flex justify-center items-center w-60 h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          >
            <p className="text-2xl text-white font-semibold">Encode</p>
          </div>

          {/* Decode Button */}
          <div
            onClick={navigateToDecode}
            className="bg-green-600 flex justify-center items-center w-60 h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-green-700 transition duration-300 transform hover:scale-105"
          >
            <p className="text-2xl text-white font-semibold">Decode</p>
          </div>
        </div>
      </div>
    </>
  );
}
