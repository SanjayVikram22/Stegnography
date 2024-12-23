import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link

export default function EncodeVideo() {
  const [video, setVideo] = useState(null);
  const [hiddenText, setHiddenText] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [encodedVideoURL, setEncodedVideoURL] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // State to track loading status

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
    }
  };

  const handleEncode = async () => {
    if (!video || !hiddenText || !secretCode) {
      alert("Please upload a video, enter text, and set a secret code.");
      return;
    }

    setIsLoading(true); // Start loading
    const formData = new FormData();
    formData.append("video", video);
    formData.append("text", hiddenText);
    formData.append("key", secretCode);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/encode_video",
        formData,
        {
          responseType: "blob", // Ensure response is a Blob for download
        }
      );

      const url = URL.createObjectURL(response.data);
      setEncodedVideoURL(url);
      setIsLoading(false); // Stop loading
    } catch (error) {
      console.error("Error encoding the video:", error);
      alert("Failed to encode the video. Please try again.");
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-400 p-6 relative">
      {/* Replaced <a> with <Link> */}
      <Link
        to="/video"
        className="absolute top-3 right-3 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
      >
        Video
      </Link>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Encode Video
      </h1>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Upload Video
        </label>

        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 transition duration-200">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 mb-3 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V8a4 4 0 014-4h6a4 4 0 014 4v8M16 12l4-4m0 0l-4 4m4-4v10"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
            </div>
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              className="hidden"
            />
          </label>
        </div>

        {video && (
          <div className="mt-6">
            <p className="font-semibold text-lg text-gray-700">Preview:</p>
            <video
              src={URL.createObjectURL(video)}
              controls
              className="w-full h-64 object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Text to be hidden:
        </label>
        <textarea
          value={hiddenText}
          onChange={(e) => setHiddenText(e.target.value)}
          placeholder="Enter the text you want to hide"
          className="w-full p-3 border-2 border-gray-300 rounded-lg h-32"
        />
        <label className="block text-xl font-semibold text-gray-700 mb-4 mt-4">
          Secret Code:
        </label>
        <input
          type="password"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          placeholder="Set a secret code"
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        />
      </div>

      <button
        onClick={handleEncode}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        {isLoading ? "Encoding..." : "Encode"}{" "}
        {/* Update button text based on loading status */}
      </button>

      {encodedVideoURL && (
        <a
          href={encodedVideoURL}
          download="encoded_video.avi"
          className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
        >
          Download Encoded Video
        </a>
      )}
    </div>
  );
}
