import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home1() {
  const navigate = useNavigate();

  const navigateToImage = () => {
    navigate("/Image");
  };

  const navigateToVideo = () => {
    navigate("/Video");
  };
  const navigateToAudio = () => {
    navigate("/Audio");
  };



  

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center bg-stone-400 relative">
        
        {/* About Us Button */}
        <a
          href="/about"
          className="absolute top-3 right-3 text-white bg-red-500 hover:bg-red-700 px-4 py-2 rounded shadow"
        >
          About Us
        </a>

        {/* Title */}
        <h1 className="text-red-600 text-4xl md:text-5xl font-bold mb-16">
            Steganography
        </h1>

        <div className="flex flex-col md:flex-row justify-center items-center gap-16 md:gap-32">
          {/* Encode Button */}
          <div
            onClick={navigateToImage}
            className="bg-blue-600 flex justify-center items-center w-60 h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          >
            <p className="text-2xl text-white font-semibold">Image </p>
          </div>

          {/* Decode Button */}
          <div
            onClick={navigateToVideo}
            className="bg-green-600 flex justify-center items-center w-60 h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-green-700 transition duration-300 transform hover:scale-105"
          >
            <p className="text-2xl text-white font-semibold">Video</p>
          </div>
          <div
            onClick={navigateToAudio}
            className="bg-red-600 flex justify-center items-center w-60 h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-red
            -700 transition duration-300 transform hover:scale-105"
          >
            <p className="text-2xl text-white font-semibold">Audio</p>
          </div>
        </div>
      </div>
    </>
  );
}
