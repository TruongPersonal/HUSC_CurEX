import { query } from '../database/db.js';

export const getSubjects = async (req, res) => {
  try {
    // If assistant, only return their unit's subjects
    let sql = `
      SELECT s.*, u.name as unit_name, u.code as unit_code 
      FROM subjects s 
      JOIN units u ON s.unit_id = u.id 
    `;
    const params = [];
    
    if (req.user.role === 'ASSISTANT') {
      sql += ` WHERE s.unit_id = $1 `;
      params.push(req.user.unit_id);
    }
    
    sql += ` ORDER BY s.name ASC`;
    const result = await query(sql, params);
    
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { code, name } = req.body;
    let { unit_id } = req.body;
    
    if (req.user.role === 'ASSISTANT') {
      unit_id = req.user.unit_id; // Force unit_id for assistant
    }
    
    if (!code || !name || !unit_id) return res.status(400).json({ message: 'Thiếu thông tin' });
    
    const check = await query('SELECT id FROM subjects WHERE code = $1', [code]);
    if (check.rows.length > 0) return res.status(400).json({ message: 'Mã học phần đã tồn tại' });
    
    const result = await query(
      'INSERT INTO subjects (code, name, unit_id) VALUES ($1, $2, $3) RETURNING *',
      [code, name, unit_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;
    
    // Check permission
    if (req.user.role === 'ASSISTANT') {
      const checkSubject = await query('SELECT unit_id FROM subjects WHERE id = $1', [id]);
      if (checkSubject.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
      if (checkSubject.rows[0].unit_id !== req.user.unit_id) {
        return res.status(403).json({ message: 'Không có quyền sửa môn của khoa khác' });
      }
    }
    
    const check = await query('SELECT id FROM subjects WHERE code = $1 AND id != $2', [code, id]);
    if (check.rows.length > 0) return res.status(400).json({ message: 'Mã học phần đã tồn tại' });
    
    const result = await query(
      'UPDATE subjects SET code = $1, name = $2 WHERE id = $3 RETURNING *',
      [code, name, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (req.user.role === 'ASSISTANT') {
      const checkSubject = await query('SELECT unit_id FROM subjects WHERE id = $1', [id]);
      if (checkSubject.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
      if (checkSubject.rows[0].unit_id !== req.user.unit_id) {
        return res.status(403).json({ message: 'Không có quyền xóa môn của khoa khác' });
      }
    }
    
    const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING id', [id]);
    res.status(200).json({ message: 'Đã xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
