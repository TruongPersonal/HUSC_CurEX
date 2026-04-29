import { query } from '../database/db.js';

export const getUnits = async (req, res) => {
  try {
    const result = await query('SELECT * FROM units ORDER BY name ASC');
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const createUnit = async (req, res) => {
  try {
    const { code, name } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'Thiếu thông tin' });
    
    // Check exist
    const check = await query('SELECT id FROM units WHERE code = $1', [code]);
    if (check.rows.length > 0) return res.status(400).json({ message: 'Mã khoa đã tồn tại' });
    
    const result = await query(
      'INSERT INTO units (code, name) VALUES ($1, $2) RETURNING *',
      [code, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name } = req.body;
    
    // Check exist if code changed
    const check = await query('SELECT id FROM units WHERE code = $1 AND id != $2', [code, id]);
    if (check.rows.length > 0) return res.status(400).json({ message: 'Mã khoa đã tồn tại' });
    
    const result = await query(
      'UPDATE units SET code = $1, name = $2 WHERE id = $3 RETURNING *',
      [code, name, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM units WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Không tìm thấy' });
    res.status(200).json({ message: 'Đã xóa thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server (Có thể do ràng buộc dữ liệu)' });
  }
};
