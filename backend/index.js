const fs = require('fs')
const path = require('path')
const express = require('express');
const app = express();
const cors = require('cors');
const { exec } = require("child_process");
const multer  = require('multer');
const AWS = require('aws-sdk');

var breakLoop = false;   
let dataLen = 0;
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }

app.use(cors()); 
app.use(express.json());

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        console.log("file from diskstorage", req.body);
      cb(null, req.body.videoTitle) //Appending fileName
    }
  });  
var upload = multer({ storage: storage });
const type = upload.single('videoFile');



app.get('/', (req,res) => {
    res.send("cors resolved");
});



function getDataLen(){    
    AWS.config.update({
        accessKeyId: "",
        secretAccessKey: ""
      });
    
    
    var s3 = new AWS.S3();       
    const bucketNameDownload = "";        

    var bucketParams = {
        Bucket : bucketNameDownload,
    };        
        
      // Call S3 to obtain a list of the objects in the bucket    
    s3.listObjects(bucketParams,function(err, data){
        console.log("list objects function")
        if (err) {
            console.log("Error", err); 
            dataLen = -1;            
        } else {
            console.log("Successfully listed objects");       
            console.log(data.Contents.length, "Data Length") 
            dataLen = data.Contents.length;
            console.log(dataLen, "dataLen inside function")                            
        }
    })  
    
    
}


app.post('/api/face-detect', type, (req, res) => {    
    console.log(req.body);
    console.log(req.file);
    const fileName = req.body.videoTitle;     

    //configuring the AWS environment
        
    AWS.config.update({
    accessKeyId: "",
    secretAccessKey: ""
  });


    var s3 = new AWS.S3();
    // const bucketName = "video-store-opencv";
    const bucketName = "";
    const bucketNameDownload = "";
    const filePath = "./uploads/" + fileName;   

    //configuring parameters
    var params = {
      Bucket: bucketName,
      Body : fs.createReadStream(filePath),
      Key : path.basename(filePath)
    };

    s3.upload(params, function (err, data) {
      //handle error
      if (err) {
        console.log("Error in uploading file to S3 storage", err);
        res.status(400).send("error uploading");
        return;
      }

      //success
      if (data) {
        console.log("Uploaded in: ", data.Location);        

        // get number of frames of videoFile
        var frames = 0; 
        var filePath = "./uploads/";
        var command = "ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -print_format default=nokey=1:noprint_wrappers=1 " +  filePath + fileName;
        exec(command, (error, stdout, stderr) => { 
            if(error){
                res.status(400).send("Failed to run command");
                console.log(error, "error")
                return;
            }
            if(stderr){
                res.status(400).send("Failed to run command");
                console.log(stderr, "stderror")
                return;
            }      
            if(stdout){
                frames = parseInt(stdout);       
            }
            
            console.log(frames, "number of frames");            

            // Loop the S3 storage to check if all files have been generated       
            sleep(120000)      
            
            // sleep(10000)
            // getDataLen();
            // console.log(dataLen, "Current number of frames in S3")
            

            // Download all the files
            var command = "aws s3 sync s3://" + bucketNameDownload + " ./downloads";
            console.log(command, "command to download files")
            exec(command, (error, stdout, stderr) => {     
                if(error){
                    res.status(400).send("Failed to run command");
                    console.log(error)
                    return;
                }
                if(stderr){
                    res.status(400).send("Failed to run command");
                    console.log(stderr)
                    return;
                }   

                console.log("downloaded files")
                // Merge all the downloaded files
                // Specify the current directory
                var cmd = 'ffmpeg -framerate 15 -i "C:\\WORK\\8th Sem\\Cloud Computing\\ccProject\\face-detector\\backend\\downloads\\%d.jpg" -r 15 -pix_fmt yuv420p output.mp4';
                exec(cmd, (error, stdout, stderr) => { 
                    if(error){
                        res.status(400).send("Failed to run command");
                        console.log(error)
                        return;
                    }
                    if(stderr){
                        res.status(400).send("Failed to run command");
                        console.log(stderr)
                        return;
                    }      
                    console.log("Merged downloaded files")
                    // Clear the frames bucket
                    command = "aws s3 rm s3://" +bucketNameDownload + " --recursive";
                    exec(command, (error, stdout, stderr) => { 
                        if(error){
                            res.status(400).send("Failed to run command");
                            console.log(error)
                            return;
                        }
                        if(stderr){
                            res.status(400).send("Failed to run command");
                            console.log(stderr)
                            return;
                        } 
                        const filePathh = "./output.mp4";
                        fs.readFile(filePathh, function (err, data){
                            if (!err) {
                                console.log("The final output file ",data.length,data);
                                res.status(200).json({ videoBuffer: data });
                                return;
                            } else {
                               console.log(err);
                               res.status(500).send("Error getting the output file");
                               return;
                            }
                        });
                    
                    });                         
                });                                   
            });             
        });                                                                                                                                        
    };            
    
    });
});  

const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
});