import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const App = () => {
  const [file, setFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [fileDets, setFileDets] = useState([]);
  const [selectedDownload, setSelectedDownload] = useState("");
  const [roomCode, setRoomCode] = useState(0);
  const [joinCode, setJoinCode] = useState("");
  const [isSelected, setIsSelected] = useState(false);
  const URL = import.meta.env.VITE_BACKEND_URL;
  console.log(URL);

  useEffect(() => {
    // Cleanup on window close or refresh
    const handleWindowClose = async () => {
      console.log(roomCode);
      if (roomCode) {
        await axios.post(`${URL}/remove-room-code`, {
          roomCode,
        });
        setFileDets([]);
        setJoinCode("");
        try {
          const response = await axios.delete(`${URL}/delete/${roomCode}`);
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
  //       let res = await axios.get("URL/files");
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
        const res = await axios.post(`${URL}/upload/${roomCode}`, formData, {
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
      const response = await axios.get(`${URL}/files/${selectedDownload}`);

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
      let result = await axios.get(`${URL}/generateroomcode`);
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
      let res = await axios.get(`${URL}/getFiles/${joinCode}`);
      console.log(res.data.message);
      setFileDets(res.data.message);
    } catch (err) {}
  };

  const handleRadioChange = (value) => {
    setSelectedDownload(value);
  };

  const handleDisconnect = async () => {
    if (roomCode) {
      console.log(roomCode);
      await axios.post(`${URL}/remove-room-code`, {
        roomCode,
      });
      setFileDets([]);
      setJoinCode("");
      try {
        const response = await axios.delete(`${URL}/delete/${roomCode}`);
        console.log(response.data.message);
        setRoomCode(0);
        setFile(null);
        setSelectedDownload("");
        window.location.reload();
      } catch (err) {
        console.log(err);
      }
    }
  };

  return (
    <div className="container">
      <h1>DocItUp</h1>
      <h2>File Upload and Download</h2>
      {/* <div className="upload-section">
        <input type="file" onChange={onFileChange} />
        <button onClick={onFileUpload}>Upload</button>
      </div> */}
      <div
        className="upload-section"
        onClick={() => document.getElementById("fileInput").click()}
      >
        {/* <p>Click to select a file</p> */}
        <p>{file ? `Selected File: ${file.name}` : "Click to select a file"}</p>
        <input type="file" id="fileInput" onChange={onFileChange} />
        <br />
      </div>
      <br />
      <button onClick={onFileUpload} style={{ margin: "auto" }}>
        Upload
      </button>
      {/* {filename && (
        <>
          <p>Uploaded file: {filename}</p>

          <button onClick={handleDownload}>Download</button>
        </>
      )} */}
      <br />
      <br />
      <div className="file-list">
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
      </div>
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
      <input
        type="text"
        className="room-code-input"
        onChange={(e) => setJoinCode(e.target.value)}
      />{" "}
      <br />
      <br />
      <button onClick={handleJoinRoom}>Join Room</button>
      {roomCode !== 0 ? (
        <button onClick={handleDisconnect}>Disconnect</button>
      ) : (
        ""
      )}
    </div>
  );
};

export default App;
