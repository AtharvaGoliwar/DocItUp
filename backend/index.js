const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { GridFSBucket } = require('mongodb');
const fs = require('fs');
const connectDB = require('./config/db.js')
require("dotenv").config();

const app = express();
app.use(express.json());

// const mongoURI = 'mongodb+srv://atharvagoliwar23:SNj34TwIL5IQbZWg@updowncluster.yjfwx.mongodb.net/?retryWrites=true&w=majority&appName=UpDownCluster';

// Connect to MongoDB
connectDB();
// try{

//     const conn = mongoose.connect(mongoURI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//     });
//     console.log("Connected to database",conn)
// }catch(err){
//     console.log(err)
// }

app.use(cors({
    origin: 'https://doc-it-up.vercel.app/', // replace with your React app's URL
}));

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
    gfs = new GridFSBucket(conn.db, {
        bucketName: 'uploads',
    });
});

// Set up Multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Route to retrieve all files from both smallfiles and GridFS
app.get('/getFiles/:roomCode', async (req, res) => {
    const code = req.params.roomCode;
    try {
        const filesCollection = conn.db.collection('smallfiles');

        // Retrieve all files from the smallfiles collection
        const smallFiles = await filesCollection.find({roomCode:code}).toArray();
        let sendArr = []
        smallFiles.map((item)=>{
            console.log(item.filename)
            sendArr.push(item.filename)
        })
        // console.log(smallFiles)

        // Retrieve all files from GridFS
        // gfs.find({}).toArray((err, gridFiles) => {
        //     if (err) {
        //         return res.status(500).send('Error fetching files from GridFS.');
        //     }

        //     // Combine both lists of files
        //     const allFiles = smallFiles.map(file => ({
        //         _id: file._id,
        //         filename: file.filename,
        //         contentType: file.contentType,
        //         size: file.data.length,
        //         source: 'smallfiles',
        //     })).concat(gridFiles.map(file => ({
        //         _id: file._id,
        //         filename: file.filename,
        //         contentType: file.contentType,
        //         size: file.length,
        //         source: 'GridFS',
            // })));

            res.json({message: sendArr});
        // });
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while retrieving the files.');
    }
});


// Hybrid Upload Route
app.post('/upload/:roomCode', upload.single('file'), async (req, res) => {
    const file = req.file;
    const code = req.params.roomCode;
    console.log(file)
    if (!file) {
        return res.status(400).send('No file uploaded.');
    }

    try {
        // Check file size
        if (file.size <= 16 * 1024 * 1024) {  // 16 MB
            // Store directly in MongoDB
            const filesCollection = conn.db.collection('smallfiles');
            const result = await filesCollection.insertOne({
                roomCode:code,
                filename: file.originalname,
                contentType: file.mimetype,
                data: file.buffer,
            });
            res.json({ fileId: result.insertedId, filename: file.originalname });
        } else {
            // Store in GridFS
            const uploadStream = gfs.openUploadStream(file.originalname, {
                contentType: file.mimetype,
            });

            uploadStream.end(file.buffer);

            uploadStream.on('finish', () => {
                res.json({ fileId: uploadStream.id, filename: file.originalname });
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred while uploading the file.');
    }
});

// Generate a random 6-digit room code
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store for generated room codes
let generatedRoomCodes = new Set();

// Route to get a new room code
app.get('/generateroomcode', (req, res) => {
    let roomCode;

    // Ensure uniqueness of the room code
    do {
        roomCode = generateRoomCode();
    } while (generatedRoomCodes.has(roomCode));

    generatedRoomCodes.add(roomCode);
    console.log(generatedRoomCodes)

    res.json({ roomCode });
});


// Hybrid Download Route
app.get('/files/:filename', async (req, res) => {
    const filename = req.params.filename;
    console.log(filename);
    
    // First, check the smallfiles collection
    const filesCollection = conn.db.collection('smallfiles');
    try{
        const result = await filesCollection.findOne({filename: filename})
        console.log(result)
        // res.set('Content-Type', result.contentType);
        console.log(result.filename)
        console.log("check")
        res.json({contentType: result.contentType, data:result.data, fileName: result.filename})
    }catch(err){
        console.log(err)
    }
    // filesCollection.findOne({ filename: filename }, (err, file) => {
    //     if (err) {
    //         return res.status(500).send('Error retrieving file from smallfiles.');
    //     }

        // if (file) {
        //     // File found in smallfiles, send it
        //     console.log(file)
        //     res.set('Content-Type', file.contentType);
        //     res.json({message:file.data});}
        // } else {
        //     // File not found in smallfiles, check GridFS
        //     gfs.find({ filename: filename }).toArray((err, files) => {
        //         if (err) {
        //             return res.status(500).send('Error retrieving file from GridFS.');
        //         }
        //         if (!files || files.length === 0) {
        //             return res.status(404).send('File not found');
        //         }

        //         // File found in GridFS, send it
        //         gfs.openDownloadStreamByName(filename).pipe(res).on('error', (error) => {
        //             res.status(500).send('Error downloading file from GridFS.');
        //         });
        //     });
        // }
    
});

// Route to remove a room code
app.post('/remove-room-code', (req, res) => {
    const { roomCode } = req.body;
    
    if (generatedRoomCodes.has(roomCode)) {
        generatedRoomCodes.delete(roomCode);
        res.json({ message: 'Room code removed successfully' });
    } else {
        res.status(404).json({ message: 'Room code not found' });
    }

    console.log(generatedRoomCodes)
});

app.delete('/delete/:roomCode', async(req,res)=>{
    const {roomCode} = req.params
    const filesCollection = conn.db.collection('smallfiles');
    try{
        const result = await filesCollection.deleteMany({roomCode: roomCode})
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No data found with the given roomCode' });
        }
        console.log("ofoijfe")
        res.json({ message: 'Data deleted successfully' });
    }catch(err){
        console.log(err)
        res.status(500).json({message:"server error"})
    }
})


// Start the server
const port = process.env.PORT;
app.listen(port, () => console.log(`Server started on port ${port}`));
