import React from 'react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-200 via-blue-300 to-blue-500">
      <div className="max-w-4xl w-full p-12 bg-white bg-opacity-90 rounded-lg shadow-xl text-center">
        <h1 className="text-6xl font-extrabold mb-4 text-gray-800 leading-tight">Welcome to Smart Wallet with Policy Signers</h1>
        <h2 className="text-3xl font-light mb-8 text-gray-700">Test out your policy signers with any smart contract</h2>
        <div className="w-full mb-8 overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/caj7q1o8N70"
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-96"
          ></iframe>
        </div>
        <div className="text-center">
          <a href="/home" className="inline-block px-10 py-4 bg-blue-600 text-white font-bold rounded-full shadow-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105">
            Test it out
          </a>
        </div>
      </div>
    </div>
  );
}
