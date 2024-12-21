import React, { useState, useEffect } from "react";
import axios from "axios";

export default function DecodeAudio() {
  const [audio, setAudio] = useState(null);
  const [secretCode, setSecretCode] = useState("");
  const [decodedMessage, setDecodedMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false); // State to manage loading status
  const [audioURL, setAudioURL] = useState(null); // State to store the blob URL
  const [audioError, setAudioError] = useState(false); // State to manage audio playback errors
  const [error, setError] = useState(""); // State to manage decoding errors

  useEffect(() => {
    // Cleanup the blob URL when the component unmounts or when a new audio is selected
    return () => {
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudio(file);
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
      const url = URL.createObjectURL(file);
      setAudioURL(url);
      setAudioError(false); // Reset any previous audio errors
    }
  };

  const handleDecode = async () => {
    if (!audio || !secretCode) {
      alert("Please upload an audio file and enter the secret code.");
      return;
    }

    setIsLoading(true); // Start loading
    setDecodedMessage(""); // Reset previous message
    setError(""); // Reset previous errors
    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("key", secretCode);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/decode_audio",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      if (response.data.hidden_message) {
        setDecodedMessage(response.data.hidden_message);
      } else {
        setDecodedMessage("No hidden message found.");
      }
      setIsLoading(false); // Stop loading
    } catch (error) {
      console.error("Error decoding the audio:", error);
      setDecodedMessage("");
      setError(
        error.response?.data?.error ||
          "Failed to decode the audio. Please try again."
      );
      setIsLoading(false); // Ensure loading is stopped on error
    }
  };

  const handleAudioError = () => {
    setAudioError(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-400 p-6 relative">
      <a
        href="/Audio"
        className="absolute top-3 right-3 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
      >
        Audio
      </a>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Decode Audio
      </h1>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Upload Encoded Audio File (Any Format)
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
                  d="M9 5l7 7-7 7"
                ></path>
              </svg>
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag
                and drop
              </p>
            </div>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              className="hidden"
            />
          </label>
        </div>

        {audio && (
          <div className="mt-6">
            <p className="font-semibold text-lg text-gray-700">Preview:</p>
            {audioError ? (
              <p className="text-red-500">Cannot play the uploaded audio.</p>
            ) : (
              <audio
                src={audioURL}
                controls
                className="w-full"
                onError={handleAudioError}
              />
            )}
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Secret Code:
        </label>
        <input
          type="password"
          value={secretCode}
          onChange={(e) => setSecretCode(e.target.value)}
          placeholder="Enter the secret code"
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
        />
      </div>

      <button
        onClick={handleDecode}
        className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        disabled={isLoading}
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

      {error && (
        <div className="mt-4 p-4 bg-red-200 text-red-800 rounded-lg w-full md:w-1/2">
          {error}
        </div>
      )}
    </div>
  );
}
