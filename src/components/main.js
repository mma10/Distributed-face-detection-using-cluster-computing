import { React, Component  } from 'react';
import axios from 'axios';
const FormData = require('form-data');

export default class main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedFile: null
        };
    }
    onChangeHandler = (event) => {
        this.setState({
            selectedFile: event.target.files[0],
            loaded: 0,
        });
        console.log(event.target.files[0]);
    };

    arrayBufferToBase64(Arraybuffer, fileName) {
        let binary = '';
        const bytes = new Uint8Array(Arraybuffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const file = window.btoa(binary);
        const mimType = "text/plain";          
          
        const url = `data:${mimType};base64,` + file;
        console.log("file from code", file)
    
        // url for the file
        // this.fileUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    
        // download the file
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
      }

    handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData();
        const { selectedFile } = this.state;
        formData.append('videoTitle',selectedFile.name);
        formData.append('videoFile', selectedFile, selectedFile.name);         
        
        // axios.get('http://ec2-13-233-126-177.ap-south-1.compute.amazonaws.com:4000')
        // .then((res) => {
            // console.log("response from ec2-instance", res);
        // });
                                                                
        axios.post('http://localhost:4000/api/face-detect', formData,  { headers: 
            { "Content-Type": "multipart/form-data" }
        })   
        .then((res) => {
            console.log("response-data from backend", res.data.videoBuffer.data);
            const outputBuffer = res.data.videoBuffer.data;                       

            this.arrayBufferToBase64(outputBuffer,"final-output.mp4");

            // console.log("NEW blob", new Blob([res.data], {type: 'video/mp4'}));
            // const url = window.URL.createObjectURL(new Blob([res.data], {type: 'video/mp4'}));
            // console.log(url)
            // const link = document.createElement('a');
            // link.href = url;
            // link.setAttribute(
            //   "download",
            //   `final-face-detection.mp4`,
            // );                                
            // document.body.appendChild(link);                      
            // link.click();                   
        })
        .catch(err => {
            console.log(err);
        })
    };

    render() {
        return (            
            < div >
                <h3> IMAGE DETECTOR IN VIDEO FILE</h3>                
                <form onSubmit={this.handleSubmit}>
                    <label>
                        Upload the mp4 file: <br /><br />
                        <input type="file" name="file" onChange={this.onChangeHandler} />
                    </label>
                    <br /><br />
                    <button type="submit">
                        Upload
                    </button>
                </form >                
            </div >
        );
    }
}