const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');

const corsOptions = {
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST'], 
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));


app.get('/', (req, res) => {
  res.send('Hello World!')
})

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

        if (stats.isDirectory()) {
          filesAndFolders.push({
            name: item,
            type: 'folder',
            path: relativePath,
            children: await searchFolder(itemPath, basePath),
          });
        } else {
          filesAndFolders.push({
            name: item,
            type: 'file',
            path: relativePath,
          });
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


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});