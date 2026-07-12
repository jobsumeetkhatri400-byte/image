const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|webp|svg/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// In-memory storage for image data (replace with database in production)
let images = [];

// Upload image
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const imageData = {
      id: Date.now().toString(),
      name: req.body.name || 'Unnamed Image',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      size: req.file.size,
      uploadDate: new Date().toISOString()
    };

    images.unshift(imageData);
    
    res.status(201).json({
      message: 'Image uploaded successfully',
      image: imageData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all images
app.get('/api/images', (req, res) => {
  res.json(images);
});

// Get single image
app.get('/api/images/:id', (req, res) => {
  const image = images.find(img => img.id === req.params.id);
  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }
  res.json(image);
});

// Delete image
app.delete('/api/images/:id', (req, res) => {
  const imageIndex = images.findIndex(img => img.id === req.params.id);
  
  if (imageIndex === -1) {
    return res.status(404).json({ error: 'Image not found' });
  }

  // Delete file from filesystem
  const imagePath = path.join(__dirname, images[imageIndex].path);
  if (fs.existsSync(imagePath)) {
    fs.unlinkSync(imagePath);
  }

  images.splice(imageIndex, 1);
  res.json({ message: 'Image deleted successfully' });
});

// Update image name
app.put('/api/images/:id', (req, res) => {
  const image = images.find(img => img.id === req.params.id);
  
  if (!image) {
    return res.status(404).json({ error: 'Image not found' });
  }

  image.name = req.body.name || image.name;
  res.json(image);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
