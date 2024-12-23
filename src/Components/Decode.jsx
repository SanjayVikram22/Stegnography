// Decode.jsx
import React, { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function Decode() {
  const [image, setImage] = useState(null);
  const [secretCode, setSecretCode] = useState("");
  const [decodedMessage, setDecodedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to manage loading status

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
    }
  };

  const handleDecode = async () => {
    if (!image || !secretCode) {
      alert("Please upload an image and enter the secret code.");
      return;
    }

    setIsLoading(true); // Start loading
    const formData = new FormData();
    formData.append("image", image);
    formData.append("key", secretCode);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/decode",
        formData
      );
      if (response.data.hidden_message) {
        setDecodedMessage(response.data.hidden_message);
      } else {
        setDecodedMessage("No hidden message found.");
      }
      setIsLoading(false); // Stop loading
    } catch (error) {
      console.error("Error decoding the image:", error);
      alert(
        error.response?.data?.error ||
          "Failed to decode the image. Please try again."
      );
      setIsLoading(false); // Ensure loading is stopped on error
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-400 p-6 relative">
      <Link
        to="/image"
        className="absolute top-3 right-3 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
      >
        Image
      </Link>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Decode
      </h1>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Upload Image
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
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {image && (
          <div className="mt-6">
            <p className="font-semibold text-lg text-gray-700">Preview:</p>
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-full h-64 object-cover rounded-md"
            />
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Secret Code:
        </label>
        <input
          type="text"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          placeholder="Enter the secret code"
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        />
      </div>

      <button
        onClick={handleDecode}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
      >
        {isLoading ? "Decoding..." : "Decode"}{" "}
        {/* Show loading status directly in the button */}
      </button>

      {decodedMessage && (
        <div className="mt-4 p-6 bg-white rounded-lg shadow-lg w-full md:w-1/2">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Decoded Message:
          </h3>
          <p className="text-gray-800">{decodedMessage}</p>
        </div>
      )}
    </div>
  );
}
