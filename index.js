const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const multer = require("multer");

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const folder = req.query.path
    const folderPath = path.join(__dirname, "course", "content", folder || '', "images");

    try {
      await fs.mkdir(folderPath, { recursive: true });
      cb(null, folderPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({ storage: storage });

app.use(cors({ origin: "http://localhost:5173" }));

app.use("/course/content", express.static(path.join(__dirname, "course", "content")));

app.get("/course/content/:folder/images/:filename", (req, res) => {
  const { folder, filename } = req.params;
  const filePath = path.join(__dirname, "course", "content", folder || '' , "images", filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error serving file:", err);
      res.status(404).send("File not found.");
    }
  });
});

app.post("/upload", upload.any(), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No file uploaded!" });
  }

  const folder = req.query.path; 

  const file = req.files[0];

  const imageUrl = `${req.protocol}://${req.get("host")}/course/content${folder ? '/' + folder : ''}/images/${file.filename}`;
  res.json({ imageUrl });
});

app.get('/files', async (req, res) => {
  const folderPath = path.join(__dirname, 'course/content'); 

  const searchFolder = async (folderPath, basePath) => {
    let filesAndFolders = [];

    try {
      const items = await fs.readdir(folderPath);

      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stats = await fs.lstat(itemPath);
        const relativePath = path.relative(basePath, itemPath);

        if(item !== 'images') {
          if (stats.isDirectory()) {
            filesAndFolders.push({
              name: item,
              type: 'folder',
              path: relativePath,
              children: await searchFolder(itemPath, basePath),
            });
          } else {
            filesAndFolders.push({
              name: item.endsWith('.md') ? item.replace(/\.md$/, "") : item,
              type: 'file',
              path: relativePath,
            });
          }
        }
      }
    } catch (err) {
      throw new Error('Unable to read folder');
    }

    return filesAndFolders;
  };

  try {
    const result = await searchFolder(folderPath, __dirname);
    res.json({ content: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/file', async (req, res) => {
  const relativePath = req.query.folderPath; 
  const filePath = path.join(__dirname, relativePath);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    res.send(fileContent);
  } catch (err) {
    res.status(500).json({ error: 'Unable to read file' });
  }
});

app.delete('/file', async (req, res) => {
  const relativePath = req.query.filePath; 
  if (!relativePath) {
    return res.status(400).json({ error: 'Missing folderPath query parameter' });
  }

  const filePath = path.join(__dirname, relativePath);

  try {
    await fs.unlink(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Unable to delete file' });
    }
  }
});

app.put('/file', async (req, res) => {
  const { filePath, fileName } = req.query;

  if (!filePath || !fileName) {
    return res.status(400).json({ error: 'Missing filePath or fileName query parameter' });
  }

  const oldFilePath = path.join(__dirname, filePath);
  const newFilePath = path.join(path.dirname(oldFilePath), fileName + '.md');

  try {
    await fs.rename(oldFilePath, newFilePath);
    res.json({ message: 'File renamed successfully' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({ error: 'Unable to rename file' });
    }
  }
});

app.post('/file', async (req, res) => {
  const relativePath = req.query.filePath;

  if (!relativePath) {
    return res.status(400).json({ error: 'Missing folderPath query parameter' });
  }

  const filePath = path.join(__dirname, relativePath);

  try {
    await fs.writeFile(filePath, '\n');
    res.json({ message: 'File created successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Unable to create file' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});