import { query } from '../database/db.js';
import bcrypt from 'bcrypt';

// Get all users with unit info
export const getUsers = async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.full_name, u.email, u.role, u.is_active, u.created_at, u.updated_at,
             un.name as unit_name, un.code as unit_code,
             COALESCE(v.total, 0) as violations_count
      FROM users u 
      LEFT JOIN units un ON u.unit_id = un.id 
      LEFT JOIN (
        SELECT owner_id, COUNT(*) as total
        FROM (
          SELECT DISTINCT p.user_id as owner_id, p.id FROM reports r JOIN posts p ON r.post_id = p.id WHERE r.status = 'RESOLVED'
          UNION ALL
          SELECT DISTINCT d.user_id as owner_id, d.id FROM reports r JOIN documents d ON r.document_id = d.id WHERE r.status = 'RESOLVED'
        ) combined
        GROUP BY owner_id
      ) v ON u.id = v.owner_id
      WHERE u.role != 'ADMIN'
      ORDER BY u.created_at DESC
    `);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải danh sách người dùng' });
  }
};

// Create a new Assistant
export const createAssistant = async (req, res) => {
  try {
    const { username, full_name, unit_id } = req.body;
    
    if (!username || !full_name || !unit_id) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Check if user exists
    const check = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    
    // Hash default password
    const hashedPassword = await bcrypt.hash('AssistantHC@123!', 10);
    
    const result = await query(
      `INSERT INTO users (username, password, full_name, role, unit_id, is_active) 
       VALUES ($1, $2, $3, 'ASSISTANT', $4, true) RETURNING id, username, full_name, role`,
      [username, hashedPassword, full_name, unit_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo trợ lý' });
  }
};

// Toggle user active status
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const result = await query(
      'UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND role != $3 RETURNING id, is_active',
      [is_active, id, 'ADMIN']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc không thể khóa Admin' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
  }
};

// Delete a user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'DELETE FROM users WHERE id = $1 AND role != $2 RETURNING id',
      [id, 'ADMIN']
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng hoặc không thể xóa Admin' });
    }
    
    res.status(200).json({ message: 'Đã xóa người dùng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa người dùng' });
  }
};

// Update Assistant info
export const updateAssistant = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, full_name, unit_id } = req.body;
    
    if (!username || !full_name || !unit_id) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }

    // Check if new username is already taken by another user
    const check = await query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, id]);
    if (check.rows.length > 0) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }
    
    const result = await query(
      `UPDATE users SET username = $1, full_name = $2, unit_id = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 AND role = 'ASSISTANT' RETURNING id, username, full_name, unit_id`,
      [username, full_name, unit_id, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy Trợ lý hoặc không có quyền chỉnh sửa' });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trợ lý' });
  }
};
