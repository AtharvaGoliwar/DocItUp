import React, { useState, useEffect } from "react";
import axios from "axios";

const App = () => {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [fileDets, setFileDets] = useState([]);
  const [selectedDownload, setSelectedDownload] = useState("");
  const [roomCode, setRoomCode] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const url = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // Cleanup on window close or refresh
    const handleWindowClose = async () => {
      console.log(roomCode);
      if (roomCode) {
        await axios.post(`${url}/remove-room-code`, {
          roomCode,
        });
        try {
          const response = await axios.delete(`${url}/delete/${roomCode}`);
          console.log(response.data.message);
        } catch (err) {
          console.log(err);
        }
      }
    };

    // Add event listener for beforeunload
    window.addEventListener("beforeunload", handleWindowClose);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
    };
  }, [roomCode]);

  // useEffect(() => {
  //   // setJoinCode("");
  //   setSelectedDownload("");
  // }, []);

  // useEffect(() => {
  //   const getFileDets = async () => {
  //     try {
  //       let res = await axios.get("url/files");
  //       console.log(res.data.message);
  //       setFileDets(res.data.message);
  //     } catch (err) {
  //       console.log(err);
  //     }
  //   };
  //   getFileDets();
  // }, []);

  // Handle file selection
  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const onFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    if (roomCode !== 0) {
      try {
        const res = await axios.post(`${url}/upload/${roomCode}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        setFilename(res.data.filename);
        alert("File uploaded successfully");
      } catch (err) {
        console.error(err);
        alert("Error uploading file");
      }
    } else {
      console.log("nahi chalega");
      return;
    }
  };

  // Handle file download
  const handleDownload = async () => {
    try {
      // Fetch file data from the backend
      const response = await axios.get(`${url}/files/${selectedDownload}`);

      const { contentType, data: base64Data, fileName } = response.data;

      // Decode Base64 to binary data
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      // Create a Blob with the binary data
      const blob = new Blob([byteArray], { type: contentType });

      // Create a URL for the Blob and download it
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      // let filename = response.data.filename;
      console.log(fileName);
      link.setAttribute("download", fileName); // Provide the filename for download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleCreateRoom = async () => {
    try {
      let result = await axios.get(`${url}/generateroomcode`);
      let code = result.data.roomCode;
      console.log(code);
      if (code) {
        setRoomCode(code);
      }
    } catch (err) {
      console.log(err);
    }
  };
  const handleJoinRoom = async () => {
    setSelectedDownload("");
    try {
      let res = await axios.get(`${url}/getFiles/${joinCode}`);
      console.log(res.data.message);
      setFileDets(res.data.message);
    } catch (err) {}
  };

  const handleRadioChange = (value) => {
    setSelectedDownload(value);
  };

  return (
    <div>
      <h2>File Upload and Download</h2>
      <input type="file" onChange={onFileChange} />
      <button onClick={onFileUpload}>Upload</button>

      {filename && (
        <>
          <p>Uploaded file: {filename}</p>

          <button onClick={handleDownload}>Download</button>
        </>
      )}
      <br />
      <br />
      {fileDets.map((item) => (
        <div>
          <input
            type="radio"
            value={item}
            checked={selectedDownload === item}
            onChange={() => handleRadioChange(item)}
          />
          {item}
          <br />
        </div>
      ))}
      <button onClick={handleDownload}>Download</button>
      <br />
      <br />
      <button
        onClick={handleCreateRoom}
        disabled={roomCode !== 0 ? true : false}
      >
        Create Room
      </button>
      <div>{roomCode !== 0 ? roomCode : ""}</div>
      <br />
      <br />
      <input type="text" onChange={(e) => setJoinCode(e.target.value)} />
      <button onClick={handleJoinRoom}>Join Room</button>
    </div>
  );
};

export default App;
