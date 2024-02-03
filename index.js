import OpenAI from 'openai';
import http from 'http';
import fs from 'fs/promises';
import fs1 from 'fs'
import qs from 'querystring'; // to parse POST data
const openai = new OpenAI({
  apiKey: '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', // Replace this securely
});
import fetch from 'node-fetch';

import admin from 'firebase-admin';

import serviceAccount from './app.json' assert { type: 'json' };
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "prompt-game-3df0f.appspot.com" // Replace with your storage bucket URL
});

const db = admin.firestore();
const storage = admin.storage();


const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};
import path from 'path';


async function saveImage(prompt, imageBuffer) {
  try {
    console.log("Try to save locally");
    const fileName = `images/${Date.now()}.png`; // Create a unique file name
    fs1.writeFileSync(fileName, imageBuffer); // Synchronously write the buffer to file
    console.log('Image saved locally as '+fileName);
    return fileName; // Make sure to return the fileName

  } catch (error) {
    console.error("Error saving image locally:", error);
  }
}


async function fetchImage(promptText) {
  try {
    const url = 'https://api.openai.com/v1/images/generations'; // OpenAI API endpoint for image generation
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openai.apiKey}`
    };
    const data = JSON.stringify({
      model: "dall-e-3",
      prompt: promptText,
      n: 1,
      size: "1024x1024"
    });

    const response = await fetch(url, { method: 'POST', headers: headers, body: data });
    const responseJson = await response.json();

    const imageUrl = responseJson.data[0].url;
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.buffer();
    return imageBuffer;
  } catch (error) {
    console.error("Error fetching image:", error);
    return null;
  }
}


http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/generate') {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', async () => {
        const postData = qs.parse(body);
        const imageBuffer = await fetchImage(postData.prompt);
        const savedFileName = await saveImage(postData.prompt, imageBuffer);

        let htmlData = await fs.readFile('index.html', 'utf8');
        // Add the script to update the image, hide the prompt input, and unhide the name input
        const scriptToUpdatePage = `
<script>
document.getElementById('openaiImage').src = '/${savedFileName}';
document.getElementById('promptInputContainer').style.display = 'none'; // Hide the prompt input
document.getElementById('nameInputContainer').style.display = 'block'; // Unhide the name input
Swal.close();
</script>
`;
        htmlData = htmlData.replace('</body>', scriptToUpdatePage + '</body>');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(htmlData);
        res.end();
    });
}
  else if (req.url === '/generate-pre') {
    console.log('generate-pre')
    let htmlData = await fs.readFile('index.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(htmlData);
    res.end();
  }
  else if (req.url.endsWith('.css') || req.url.endsWith('.js') || req.url.endsWith('.png') || req.url.endsWith('.jpg')) {
    try {
      const fileData = await fs.readFile(`.${req.url}`);
      const fileExtension = path.extname(req.url);
      const mimeType = MIME_TYPES[fileExtension] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mimeType });
      res.write(fileData);
      res.end();
    } catch (error) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.write('404 Not Found');
      res.end();
    }
  }
  else {
    let htmlData = await fs.readFile('index1.html', 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(htmlData);
    res.end();
  }
}).listen(4444);
