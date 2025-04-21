const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const fsp = require('fs').promises;
const fs = require('fs');
const cors = require('cors');
const multer = require("multer");
app.use(express.json());
const BASE_DIR = path.join(__dirname, 'course/content')
const yaml = require('js-yaml')

const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const folder = req.query.path
    const folderPath = path.join(__dirname, "course", "content", folder || '', "images");

    try {
      await fsp.mkdir(folderPath, { recursive: true });
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
      const items = await fsp.readdir(folderPath);

      for (const item of items) {
        const itemPath = path.join(folderPath, item);
        const stats = await fsp.lstat(itemPath);
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
  const relativePath = req.query.filePath; 
  const root = req.query.root === 'true';
  const fullPath = path.join(root ? BASE_DIR : __dirname, relativePath);

  try {
    const fileContent = await fsp.readFile(fullPath, 'utf-8');
    res.send(fileContent);
  } catch (err) {
    res.status(500).json({ error: 'Unable to read file' });
  }
});

app.get('/resources', async (req, res) => {
  const relativePath = req.query.filePath.substring(0, req.query.filePath.lastIndexOf('/')); 
  const root = req.query.root === 'true';
  const fullPath = path.join(root ? BASE_DIR : __dirname, relativePath, "/images");

  console.log(fullPath)
  try {
    await fsp.access(fullPath);
    const files = await fsp.readdir(fullPath);
    res.json(files); 
  } catch (err) {
    res.json([]);
  }
});

app.delete('/resources', async (req, res) => {
  const relativePath = req.query.filePath.substring(0, req.query.filePath.lastIndexOf('/'));
  const allowedFiles = req.body.allowedFiles || []; 
  const dirPath = path.join(__dirname, relativePath, 'images');

  try {
    await fsp.access(dirPath);

    const allFiles = await fsp.readdir(dirPath);

    const filesToDelete = allFiles.filter(file => !allowedFiles.includes(file));

    await Promise.all(
      filesToDelete.map(file => fsp.unlink(path.join(dirPath, file)))
    );

    res.json({ deleted: filesToDelete });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete files' });
  }
});

app.delete('/file', async (req, res) => {
  const relativePath = req.query.filePath; 
  if (!relativePath) {
    return res.status(400).json({ error: 'Missing folderPath query parameter' });
  }

  const filePath = path.join(__dirname, relativePath);

  try {
    await fsp.unlink(filePath);
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
    await fsp.rename(oldFilePath, newFilePath);
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
  const root = req.query.root === 'true';
  const fileContent = req.body.content || '\n'; 

  if (!relativePath) {
    return res.status(400).json({ error: 'Missing filePath query parameter' });
  }

  const filePath = path.join(root ? BASE_DIR : __dirname, relativePath);

  try {
    if (fs.existsSync(filePath) && fileContent === '\n') {
      return res.status(400).json({ error: 'File already exists' });
    }

    await fsp.writeFile(filePath, fileContent);
    res.json({ message: 'File created successfully' });
  } catch (err) {
    console.error('Error creating file:', err);
    res.status(500).json({ error: 'Unable to create file' });
  }
});

app.get('/config', async (req, res) => {
  try {
    const fileContent = await fsp.readFile('./course/it4kt.yml', 'utf-8');
    const data = yaml.load(fileContent);

    res.json({ config: data });
  } catch (error) {
    console.error('Chyba pri čítaní YAML:', error);
    res.status(500).json({ error: 'Nepodarilo sa načítať konfiguráciu' });
  }
})
  
app.post('/config', async (req, res) => {
  try {
    const newConfig = req.body.config; // Assuming the new config is sent in the 'config' field of the request body

    if (!newConfig || typeof newConfig !== 'object') {
      return res.status(400).json({ error: 'Neplatný formát konfigurácie v tele požiadavky' });
    }

    const yamlStr = yaml.dump(newConfig); // Convert the JavaScript object back to YAML

    await fsp.writeFile('./course/it4kt.yml', yamlStr, 'utf-8');

    res.json({ message: 'Konfigurácia úspešne aktualizovaná' });
  } catch (error) {
    console.error('Chyba pri zápise YAML:', error);
    res.status(500).json({ error: 'Nepodarilo sa uložiť konfiguráciu' });
  }
});  


app.delete('/folder', async (req, res) => {
  const relativePath = req.query.name; 
  if (!relativePath) {
    return res.status(400).json({ error: 'Missing folderPath query parameter' });
  }

  const folderPath = path.join(__dirname, relativePath);

  try {
    fsp.rm(folderPath, { recursive: true, force: true })
    res.json({ message: 'Folder deleted successfully' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Folder not found' });
    } else {
      res.status(500).json({ error: 'Unable to delete file' });
    }
  }
});

app.put('/folder', async (req, res) => {
  const { folderPath, name } = req.query;

  if (!folderPath || !name) {
    return res.status(400).json({ error: 'Missing filePath or fileName query parameter' });
  }

  const oldFilePath = path.join(__dirname, folderPath);
  const newFilePath = path.join(path.dirname(oldFilePath), name);

  try {
    await fsp.rename(oldFilePath, newFilePath);
    res.json({ message: 'Folder renamed successfully' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.status(404).json({ error: 'Folder not found' });
    } else {
      res.status(500).json({ error: 'Unable to rename folder' });
    }
  }
});

app.post('/folder', async (req, res) => {
  const name = req.query.name;

  if (!name) {
    return res.status(400).json({ error: 'Missing name query parameter' });
  }

  const folderPath = path.join(BASE_DIR, name);

  try {
    if (fs.existsSync(folderPath)) {
      return res.status(400).json({ error: 'Folder already exists' });
    }

    await fsp.mkdir(folderPath, { recursive: true }); // creates the folder
    res.json({ message: 'Folder created successfully' });
  } catch (err) {
    console.error('Error creating folder:', err);
    res.status(500).json({ error: 'Unable to create folder' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});