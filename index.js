const express = require("express");
const fs = require("fs");
let cors = require("cors");
const https = require("https");
const path = require("path");
const request = require("request");

const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/videoplayer", (req, res) => {
  const range = req.headers.range;
  console.log("Range header: ", range);
  const tmpDirectory = path.join(process.cwd(), "tmp");
  console.log(tmpDirectory);
  const videoPath = tmpDirectory + "/video.mp4";
  const videoSize = fs.statSync(videoPath).size;
  const chunkSize = 1 * 1e6;
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + chunkSize, videoSize - 1);
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };
  res.writeHead(206, headers);
  const stream = fs.createReadStream(videoPath, {
    start,
    end,
  });
  stream.pipe(res);
});

io.on("connection", (socket) => {
  console.log("A client connected");

  socket.on("test_data", (data) => {
    console.log("Received client event:", data);
    // Send a response back to the client
    socket.emit("test_server_response", { message: "Hello from the server!" });
  });

  socket.on("disconnect", () => {
    console.log("A client disconnected");
  });
});

app.get("/test", async (req, res) => {
  const tmpDirectory = path.join(process.cwd(), "tmp");
  console.log(tmpDirectory);
  console.log("PORT is", process.env.PORT);

  res.sendFile(`${tmpDirectory}/Reaper.jpg`);
});

server.listen(port, () => {
  console.log(`Example app listen at http://localhost:${port}`);

  const tmpDirectory = path.join(process.cwd(), "tmp");
  console.log(tmpDirectory);

  const file = fs.createWriteStream(tmpDirectory + "/video.mp4");
  const request = https
    .get("https://res.cloudinary.com/dtv9lwjso/video/upload/v1694956219/video_w5ta68.mp4", function (response) {
      response.pipe(file);

      console.log(response.statusCode);
      console.log(response.statusMessage);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");
      });

      file.on("error", (e) => {
        console.log("Error Occured!", e);
      });
    })
    .on("error", (e) => {
      console.log("Error Occured!", e);
    });
});

module.exports = app;
