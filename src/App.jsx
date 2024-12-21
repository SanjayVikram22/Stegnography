import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Encode from "./Components/Encode";
import Decode from "./Components/Decode"; // Make sure Decode component exists
import Home1 from "./Components/Home1";
import EncodeVideo from "./Components/EncodeVideo";
import EncodeAudio from "./Components/EncodeAudio";
import DecodeVideo from "./Components/DecodeVideo";
import DecodeAudio from "./Components/DecodeAudio";
import Video from "./Components/Video";
import Image from "./Components/Image";
import Audio from "./Components/Audio";
import About from "./Components/About";

export default function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Home1 />} />
          <Route path="/about" element={<About/>} />
          <Route path="/image" element={<Image />} />
          <Route path="/encode" element={<Encode />} />
          <Route path="/decode" element={<Decode />} />
          <Route path="/video" element={<Video />} />
          <Route path="/decode_video" element={<DecodeVideo />} />
          <Route path="/encode_video" element={<EncodeVideo />} />
          <Route path="/Audio" element={<Audio />} />
          <Route path="/encode_audio" element={<EncodeAudio />} />
          <Route path="/decode_audio" element={<DecodeAudio />} />
        </Routes>
      </Router>
    </>
  );
}
