const cloudinary = require('cloudinary').v2;

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a local file (PDF/DOCX/image) to Cloudinary.
 * Returns Cloudinary HTTPS URL or null if keys are missing / error occurs.
 */
const uploadToCloudinary = async (filePath) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const isConfigured = Boolean(process.env.CLOUDINARY_URL || (cloudName && !cloudName.includes('your_')));

  if (!isConfigured) {
    return null; // Fallback to local server path
  }

  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'hiresmart_resumes',
    });
    return result.secure_url;
  } catch (err) {
    console.error('[Cloudinary] Upload failed:', err.message);
    return null;
  }
};

module.exports = { cloudinary, uploadToCloudinary };
