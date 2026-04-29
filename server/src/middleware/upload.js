import multer from 'multer';

// Sử dụng memoryStorage để có thể lấy được buffer file và upload lên Cloud (Supabase)
const storage = multer.memoryStorage();

// Kiểm tra loại file (chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
  const allowedFileTypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = allowedFileTypes.test(file.mimetype);

  if (mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Chỉ cho phép tải lên hình ảnh!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter
});

// PDF upload for documents
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép tải lên file PDF!'));
  }
};

export const uploadPdf = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // Giới hạn 20MB
  fileFilter: pdfFilter
});
