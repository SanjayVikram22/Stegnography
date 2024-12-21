import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom"; // Import Link

export default function EncodeAudio() {
  const [audio, setAudio] = useState(null);
  const [text, setText] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [encodedAudio, setEncodedAudio] = useState(null);
  const [error, setError] = useState("");

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAudio(file);
    }
  };

  const handleEncode = async () => {
    if (!audio || !text || !secretCode) {
      alert(
        "Please upload an audio file, enter the secret message, and provide the secret code."
      );
      return;
    }

    const formData = new FormData();
    formData.append("audio", audio);
    formData.append("text", text);
    formData.append("key", secretCode);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/encode_audio",
        formData,
        {
          responseType: "blob", // Important for handling binary data
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );

      // Create a URL for the downloaded audio
      const audioURL = window.URL.createObjectURL(new Blob([response.data]));
      setEncodedAudio(audioURL);
      setError("");
    } catch (err) {
      console.error("Error encoding the audio:", err);
      setError(
        err.response?.data?.error ||
          "Failed to encode the audio. Please try again."
      );
      setEncodedAudio(null);
    }
  };

  useEffect(() => {
    // Cleanup the blob URL when the component unmounts or when a new audio is selected
    return () => {
      if (encodedAudio) {
        URL.revokeObjectURL(encodedAudio);
      }
    };
  }, [encodedAudio]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-400 p-6 relative">
      {/* Replaced <a> with <Link> and corrected the 'to' attribute */}
      <Link
        to="/audio"
        className="absolute top-3 right-3 text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded shadow"
      >
        Audio
      </Link>
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-8 tracking-tight">
        Encode Audio
      </h1>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Upload Audio File (Any Format)
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
              accept="audio/*"
              onChange={handleAudioChange}
              className="hidden"
            />
          </label>
        </div>

        {audio && (
          <div className="mt-6">
            <p className="font-semibold text-lg text-gray-700">Preview:</p>
            <audio
              src={URL.createObjectURL(audio)}
              controls
              className="w-full"
            />
          </div>
        )}
      </div>

      <div className="w-full md:w-1/2 bg-white p-6 rounded-xl shadow-xl mb-8">
        <label className="block text-xl font-semibold text-gray-700 mb-4">
          Secret Message:
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter the secret message to embed"
          className="w-full p-3 border-2 border-gray-300 rounded-lg"
          rows={4}
        />
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
        onClick={handleEncode}
        className={`bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 ${
          uploadProgress > 0 && uploadProgress < 100
            ? "opacity-50 cursor-not-allowed"
            : ""
        }`}
        disabled={uploadProgress > 0 && uploadProgress < 100}
      >
        {uploadProgress > 0 && uploadProgress < 100
          ? `Encoding... (${uploadProgress}%)`
          : "Encode"}
      </button>

      {encodedAudio && (
        <div className="mt-4 p-6 bg-white rounded-lg shadow-lg w-full md:w-1/2">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">
            Encoded Audio:
          </h3>
          <audio src={encodedAudio} controls className="w-full" />
          <br />
          <a
            href={encodedAudio}
            download="encoded_audio.wav"
            className="mt-2 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Download Encoded Audio
          </a>
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
