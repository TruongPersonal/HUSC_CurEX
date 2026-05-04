import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { query } from '../database/db.js';
import { saveFileLocal } from '../utils/uploadUtils.js';

const getFullImageUrl = (req, path) => {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${req.protocol}://${req.get('host')}${path}`;
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, unit_id: user.unit_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' } // Token có thời hạn 7 ngày
  );
};

export const googleLogin = async (req, res) => {
  const { credential } = req.body; // credential là idToken Google gửi về

  try {
    // 1. Xác thực Token với Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: google_id } = payload;

    // 2. Chặn nếu không phải email sinh viên HUSC
    if (!email.endsWith('@husc.edu.vn')) {
      return res.status(403).json({ 
        message: 'Chỉ sinh viên trường Đại học Khoa học, Đại học Huế mới được phép tham gia hệ thống.' 
      });
    }

    // 3. Kiểm tra user trong Database
    let userResult = await query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userResult.rows[0];

    if (!user) {
      // Sinh viên mới -> Tự động đăng ký
      const username = email.split('@')[0];
      const insertResult = await query(
        `INSERT INTO users (username, email, google_id, full_name, avatar_url, role) 
         VALUES ($1, $2, $3, $4, $5, 'STUDENT') RETURNING *`,
        [username, email, google_id, name, picture]
      );
      user = insertResult.rows[0];
    } else if (!user.google_id) {
      // Update google_id nếu tài khoản đã có nhưng chưa liên kết
      const updateResult = await query(
        `UPDATE users SET google_id = $1, avatar_url = $2 WHERE id = $3 RETURNING *`,
        [google_id, picture, user.id]
      );
      user = updateResult.rows[0];
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.' 
      });
    }

    const { password: userPassword, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      has_password: !!userPassword
    };

    // 4. Sinh JWT Token của hệ thống
    const token = generateToken(user);

    // 5. Trả về cho Frontend
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: { ...userData, avatar_url: getFullImageUrl(req, userData.avatar_url) }
    });

  } catch (error) {
    console.error('Google verification error:', error);
    res.status(400).json({ message: 'Xác thực Google thất bại. Vui lòng thử lại.' });
  }
};

export const localLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không chính xác.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ 
        message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' 
      });
    }

    if (!user.password) {
      return res.status(401).json({ message: 'Tài khoản này chưa thiết lập mật khẩu phụ.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu không chính xác.' });
    }

    const { password: userPassword, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      has_password: !!userPassword
    };

    const token = generateToken(user);
    
    res.status(200).json({
      message: 'Đăng nhập thành công',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Local login error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const getMe = async (req, res) => {
  try {
    // req.user được gán từ Middleware protect
    const result = await query(
      'SELECT id, username, email, full_name, avatar_url, role, unit_id, phone, password FROM users WHERE id = $1', 
      [req.user.id]
    );
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    const { password, ...userWithoutPassword } = user;
    const userData = { ...userWithoutPassword, has_password: !!password };

    res.status(200).json({ user: { ...userData, avatar_url: getFullImageUrl(req, userData.avatar_url) } });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    if (user.password) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại.' });
      }
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.status(200).json({ message: 'Cập nhật mật khẩu thành công.' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const updateProfile = async (req, res) => {
  const { full_name, phone } = req.body;
  const userId = req.user.id;

  try {
    // Nếu phone là chuỗi rỗng thì lưu là null
    const phoneValue = phone && phone.trim() !== "" ? phone : null;

    const result = await query(
      `UPDATE users SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 RETURNING id, username, email, full_name, avatar_url, role, unit_id, phone`,
      [full_name, phoneValue, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    res.status(200).json({ 
      message: 'Cập nhật thông tin thành công.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn ảnh đại diện.' });
    }
    
    const avatar_url = await saveFileLocal(req.file, 'avatars');
    const userId = req.user.id;

    const result = await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, avatar_url',
      [avatar_url, userId]
    );

    res.status(200).json({ 
      message: 'Cập nhật ảnh đại diện thành công.',
      avatar_url: getFullImageUrl(req, result.rows[0].avatar_url)
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi tải ảnh lên.' });
  }
};
