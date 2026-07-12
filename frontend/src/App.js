import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [images, setImages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imageName, setImageName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${API_URL}/images`);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setMessage('Please select an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('name', imageName || 'Unnamed Image');

    try {
      await axios.post(`${API_URL}/upload`, formData);
      setMessage('Image uploaded successfully!');
      setSelectedFile(null);
      setImageName('');
      fetchImages();
      // Reset file input
      document.getElementById('file-input').value = '';
    } catch (error) {
      setMessage('Error uploading image');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await axios.delete(`${API_URL}/images/${id}`);
        setMessage('Image deleted successfully!');
        fetchImages();
      } catch (error) {
        setMessage('Error deleting image');
        console.error('Delete error:', error);
      }
    }
  };

  const handleEditStart = (image) => {
    setEditingId(image.id);
    setEditName(image.name);
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(`${API_URL}/images/${id}`, { name: editName });
      setEditingId(null);
      setEditName('');
      fetchImages();
      setMessage('Image name updated!');
    } catch (error) {
      setMessage('Error updating image name');
      console.error('Update error:', error);
    }
  };

  const getImageUrl = (path) => {
    if (path.startsWith('http')) {
      return path;
    }
    // Remove /api from API_URL for image paths
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${path}`;
  };

  return (
    <div className="App">
      <header className="header">
        <h1>🖼️ Image Gallery</h1>
        <p>Upload and manage your images</p>
      </header>

      <div className="container">
        <div className="upload-section">
          <h2>Upload New Image</h2>
          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
              <button onClick={() => setMessage('')} className="close-message">&times;</button>
            </div>
          )}
          
          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group">
              <label htmlFor="image-name">Image Name:</label>
              <input
                type="text"
                id="image-name"
                value={imageName}
                onChange={(e) => setImageName(e.target.value)}
                placeholder="Enter image name"
                className="form-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="file-input">Choose Image:</label>
              <input
                type="file"
                id="file-input"
                onChange={handleFileSelect}
                accept="image/*"
                className="file-input"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={uploading || !selectedFile}
              className="upload-btn"
            >
              {uploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </form>
        </div>

        <div className="gallery-section">
          <h2>Your Images ({images.length})</h2>
          
          {images.length === 0 ? (
            <div className="no-images">
              <p>No images yet. Upload your first image!</p>
            </div>
          ) : (
            <div className="gallery-grid">
              {images.map((image) => (
                <div key={image.id} className="gallery-item">
                  <div className="image-wrapper">
                    <img 
                      src={getImageUrl(image.path)} 
                      alt={image.name}
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="image-info">
                    {editingId === image.id ? (
                      <div className="edit-form">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="edit-input"
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button onClick={() => handleEditSave(image.id)} className="save-btn">
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="cancel-btn">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3 className="image-name">{image.name}</h3>
                        <p className="image-meta">
                          {new Date(image.uploadDate).toLocaleDateString()}
                        </p>
                        <div className="image-actions">
                          <button 
                            onClick={() => handleEditStart(image)}
                            className="action-btn edit-btn"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(image.id)}
                            className="action-btn delete-btn"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
