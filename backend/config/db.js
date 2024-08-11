// import mongoose from "mongoose";
const mongoose = require('mongoose');
// import "dotenv/config"
require("dotenv").config()
mongoose.set("strictQuery",false);
const connectDB = async ()=>{
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log("Database connected",conn.connection.host)
    }catch(err){
        console.log(err)
    }
}

module.exports = connectDB;