import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const saveFileLocal = async (file, folder = 'uploads') => {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Đường dẫn tuyệt đối để lưu file: server/public/uploads/folder/filename
    const uploadDir = path.join(__dirname, '../../public/uploads', folder);
    
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);
    
    // Ghi file từ buffer vào ổ cứng
    fs.writeFileSync(filePath, file.buffer);

    // Trả về URL tương đối (Backend sẽ tự nối domain ở Controller)
    return `/uploads/${folder}/${fileName}`;
  } catch (error) {
    console.error('Lỗi khi lưu file nội bộ:', error);
    throw error;
  }
};
