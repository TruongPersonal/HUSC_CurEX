import jwt from 'jsonwebtoken';
import { query } from '../database/db.js';

// Middleware chặn các request không có JWT Token hợp lệ
export const protect = async (req, res, next) => {
  let token;

  // Lấy token từ header Authorization: Bearer <token>
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kiểm tra trạng thái tài khoản thực tế trong DB
      const result = await query('SELECT is_active FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ message: 'Tài khoản đã bị khóa hoặc không còn tồn tại trên hệ thống.' });
      }
      
      // Gắn thông tin user vào request (id, email, role)
      req.user = decoded; 
      
      // Cho phép đi tiếp
      next();
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Không có quyền truy cập. Bạn cần đăng nhập để thực hiện chức năng này.' });
  }
};

// Middleware kiểm tra token nếu có (không bắt buộc login)
export const optionalProtect = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Bỏ qua lỗi token nếu không bắt buộc
    }
  }
  next();
};

// Middleware kiểm tra quyền Admin
export const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này (Yêu cầu Admin)' });
  }
};

// Middleware kiểm tra quyền Trợ lý hoặc Admin
export const isAssistant = (req, res, next) => {
  if (req.user && (req.user.role === 'ASSISTANT' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này (Yêu cầu Trợ lý)' });
  }
};
