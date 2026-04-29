import { query } from '../database/db.js';

// Get documents for Assistant's unit
export const getDocuments = async (req, res) => {
  try {
    const { tab } = req.query; // 'PENDING' or 'REVIEWED'

    let sql = `
      SELECT d.id, d.title, d.type, d.status, d.file_url, d.is_hidden, d.created_at, d.updated_at,
             d.subject_id,
             u.username as uploader_username, u.full_name as uploader_name,
             s.name as subject_name, s.code as subject_code
      FROM documents d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE s.unit_id = $1
    `;
    const params = [req.user.unit_id];

    if (tab === 'PENDING') {
      sql += ` AND d.status = 'PENDING'`;
    } else if (tab === 'REVIEWED') {
      sql += ` AND d.status IN ('VERIFIED', 'REJECTED')`;
    }

    sql += ` ORDER BY d.updated_at DESC`;

    const result = await query(sql, params);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server khi tải danh sách tài liệu' });
  }
};

// Update document status (VERIFIED or REJECTED)
export const updateDocumentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    // Ensure document belongs to Assistant's unit
    const check = await query(`
      SELECT d.id FROM documents d
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE d.id = $1 AND s.unit_id = $2
    `, [id, req.user.unit_id]);

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác tài liệu này' });
    }

    const result = await query(
      'UPDATE documents SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status',
      [status, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
  }
};

// Update document info (title, type, subject_id)
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, subject_id } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: 'Tiêu đề không được để trống' });
    }
    if (type && !['EXAM', 'SLIDE', 'TEXTBOOK'].includes(type)) {
      return res.status(400).json({ message: 'Loại tài liệu không hợp lệ' });
    }

    const check = await query(`
      SELECT d.id FROM documents d
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE d.id = $1 AND s.unit_id = $2
    `, [id, req.user.unit_id]);

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác tài liệu này' });
    }

    const result = await query(
      `UPDATE documents 
       SET title = $1, type = COALESCE($2, type), subject_id = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING id, title, type, subject_id`,
      [title.trim(), type || null, subject_id || null, id]
    );
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật tài liệu' });
  }
};

// Delete a document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const check = await query(`
      SELECT d.id FROM documents d
      LEFT JOIN subjects s ON d.subject_id = s.id
      WHERE d.id = $1 AND s.unit_id = $2
    `, [id, req.user.unit_id]);

    if (check.rows.length === 0) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài liệu này' });
    }

    await query('DELETE FROM documents WHERE id = $1', [id]);
    res.status(200).json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa tài liệu' });
  }
};
