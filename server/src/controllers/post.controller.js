import { query } from '../database/db.js';
import { saveFileLocal } from '../utils/uploadUtils.js';

const getFullImageUrl = (req, path) => {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${req.protocol}://${req.get('host')}${path}`;
};

export const getFormData = async (req, res) => {
  try {
    const unitsResult = await query('SELECT * FROM units ORDER BY name ASC');
    const subjectsResult = await query('SELECT * FROM subjects ORDER BY name ASC');

    res.status(200).json({
      units: unitsResult.rows,
      subjects: subjectsResult.rows
    });
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu form:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, description, price, condition, place, subject_id } = req.body;
    const user_id = req.user.id; 
    
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên 1 hình ảnh' });
    }
    
    const image_url = await saveFileLocal(req.file, 'posts');
    
    if (!title || !price || !condition || !place || !subject_id) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường bắt buộc' });
    }

    const insertQuery = `
      INSERT INTO posts (title, description, price, condition, place, image_url, subject_id, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      title, 
      description, 
      parseInt(price), 
      condition, 
      place, 
      image_url, 
      parseInt(subject_id), 
      user_id
    ];
    
    const result = await query(insertQuery, values);
    
    res.status(201).json({
      message: 'Đăng bài thành công!',
      post: { ...result.rows[0], image_url: getFullImageUrl(req, result.rows[0].image_url) }
    });
    
  } catch (error) {
    console.error('Lỗi khi tạo bài đăng:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
  }
};
// Get posts for Assistant management
export const getAssistantPosts = async (req, res) => {
  try {
    const { tab = 'AVAILABLE' } = req.query; // AVAILABLE | SOLD
    
    let sql = `
      SELECT p.id, p.title, p.price, p.condition, p.status, p.image_url, p.is_hidden, p.place, p.created_at, p.updated_at,
             p.subject_id,
             u.username as seller_username, u.full_name as seller_name,
             s.name as subject_name, s.code as subject_code,
             b.full_name as buyer_name, b.username as buyer_username,
             er.transaction_time
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN subjects s ON p.subject_id = s.id
      -- Join to get buyer info and transaction time for SOLD posts
      LEFT JOIN LATERAL (
        SELECT buyer_id, updated_at as transaction_time FROM exchange_requests 
        WHERE post_id = p.id AND status IN ('COMPLETED', 'ACCEPTED')
        LIMIT 1
      ) er ON TRUE
      LEFT JOIN users b ON er.buyer_id = b.id
      WHERE s.unit_id = $1 AND p.status = $2
      ORDER BY p.updated_at DESC
    `;
    const result = await query(sql, [req.user.unit_id, tab]);
    res.status(200).json(result.rows.map(p => ({ ...p, image_url: getFullImageUrl(req, p.image_url) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi tải bài đăng' });
  }
};

// Delete post
export const deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    const check = await query(`
      SELECT p.id FROM posts p
      JOIN subjects s ON p.subject_id = s.id
      WHERE p.id = $1 AND s.unit_id = $2
    `, [id, req.user.unit_id]);

    if (check.rows.length === 0) return res.status(403).json({ message: 'Không có quyền' });

    await query('DELETE FROM posts WHERE id = $1', [id]);
    res.status(200).json({ message: 'Đã xóa bài đăng' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
