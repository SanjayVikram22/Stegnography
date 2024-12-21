import React from "react";
import { useNavigate, Link } from "react-router-dom";

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-stone-400 relative px-4">
      {/* About Us Button */}
      <Link
        to="/about"
        className="absolute top-4 right-4 text-white bg-red-500 hover:bg-red-700 px-4 py-2 rounded shadow transition duration-300"
      >
        About Us
      </Link>

      {/* Title */}
      <h1 className="text-red-600 text-4xl md:text-5xl font-bold mb-12 text-center">
        Steganography
      </h1>

      <div className="flex flex-col sm:flex-row justify-center items-center gap-12 sm:gap-16 md:gap-32 w-full max-w-4xl">
        {/* Image Button */}
        <button
          onClick={navigateToImage}
          className="bg-blue-600 flex justify-center items-center w-48 h-48 sm:w-60 sm:h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-blue-700 transition duration-300 transform hover:scale-105"
          aria-label="Navigate to Image"
        >
          <p className="text-xl sm:text-2xl text-white font-semibold">Image</p>
        </button>

        {/* Video Button */}
        <button
          onClick={navigateToVideo}
          className="bg-green-600 flex justify-center items-center w-48 h-48 sm:w-60 sm:h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-green-700 transition duration-300 transform hover:scale-105"
          aria-label="Navigate to Video"
        >
          <p className="text-xl sm:text-2xl text-white font-semibold">Video</p>
        </button>

        {/* Audio Button */}
        <button
          onClick={navigateToAudio}
          className="bg-red-600 flex justify-center items-center w-48 h-48 sm:w-60 sm:h-60 rounded-lg shadow-lg border-2 border-gray-300 cursor-pointer hover:bg-red-700 transition duration-300 transform hover:scale-105"
          aria-label="Navigate to Audio"
        >
          <p className="text-xl sm:text-2xl text-white font-semibold">Audio</p>
        </button>
      </div>
    </div>
  );
}
