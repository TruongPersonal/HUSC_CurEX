import { query } from '../database/db.js';
import { uploadToSupabase } from '../utils/supabase.js';

export const submitDocument = async (req, res) => {
  try {
    const { title, type, subject_id } = req.body;
    const user_id = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng tải lên file PDF' });
    }
    if (!title || !type) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }
    if (!['EXAM', 'SLIDE', 'TEXTBOOK'].includes(type)) {
      return res.status(400).json({ message: 'Loại tài liệu không hợp lệ' });
    }

    const file_url = await uploadToSupabase(req.file, 'documents');

    const result = await query(
      `INSERT INTO documents (title, file_url, type, status, user_id, subject_id)
       VALUES ($1, $2, $3, 'PENDING', $4, $5)
       RETURNING id, title, type, status, created_at`,
      [title, file_url, type, user_id, subject_id || null]
    );

    res.status(201).json({
      message: 'Tải tài liệu lên thành công! Đang chờ Trợ lý Khoa phê duyệt.',
      document: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải tài liệu lên' });
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { type, unit_id, q, limit = 12, offset = 0 } = req.query;
    
    let sql = `
      SELECT d.id, d.title, d.type, d.status, d.file_url, d.created_at,
             u.full_name as uploader,
             s.name as subject_name,
             un.name as unit_name, un.code as unit_code
      FROM documents d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      LEFT JOIN units un ON s.unit_id = un.id
      WHERE d.user_id = $1
    `;
    const params = [user_id];
    let paramIndex = 2;

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (d.title ILIKE $${paramIndex} OR s.name ILIKE $${paramIndex})`;
      paramIndex++;
    }

    if (type) {
      params.push(type);
      sql += ` AND d.type = $${paramIndex}`;
      paramIndex++;
    }

    if (unit_id) {
      params.push(unit_id);
      sql += ` AND un.id = $${paramIndex}`;
      paramIndex++;
    }

    sql += ` ORDER BY d.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.status(200).json({
      documents: result.rows,
      hasMore: result.rows.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getPublicDocuments = async (req, res) => {
  try {
    const { subject_id, unit_id, type, q, limit = 12, offset = 0, include_mine } = req.query;
    const userId = req.user?.id;
    let sql = `
      SELECT d.id, d.title, d.type, d.file_url, d.created_at,
             u.full_name as uploader,
             s.name as subject_name, s.code as subject_code,
             un.name as unit_name, un.code as unit_code
      FROM documents d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      LEFT JOIN units un ON s.unit_id = un.id
      WHERE d.status = 'VERIFIED' AND d.is_hidden = FALSE
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (d.title ILIKE $${params.length} OR u.full_name ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    if (subject_id) {
      params.push(subject_id);
      sql += ` AND d.subject_id = $${params.length}`;
    }

    if (unit_id) {
      params.push(unit_id);
      sql += ` AND un.id = $${params.length}`;
    }
    if (type && ['EXAM', 'SLIDE', 'TEXTBOOK'].includes(type)) {
      params.push(type);
      sql += ` AND d.type = $${params.length}`;
    }

    sql += ` ORDER BY d.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await query(sql, params);
    res.status(200).json({
      documents: result.rows,
      hasMore: result.rows.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT d.*, 
             u.full_name as uploader,
             u.username as uploader_username,
             s.name as subject_name, s.code as subject_code,
             un.name as unit_name, un.code as unit_code
      FROM documents d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      LEFT JOIN units un ON s.unit_id = un.id
      WHERE d.id = $1
    `;
    const result = await query(sql, [id]);
    
    const document = result.rows[0];
    const userId = req.user?.id;

    let has_reported = false;
    if (userId) {
      const reportCheck = await query(
        'SELECT id FROM reports WHERE reporter_id = $1 AND document_id = $2',
        [userId, id]
      );
      has_reported = reportCheck.rows.length > 0;
    }

    const adminReportCheck = await query(
      "SELECT id FROM reports WHERE document_id = $1 AND status = 'RESOLVED'",
      [id]
    );
    const is_hidden_by_admin = adminReportCheck.rows.length > 0;

    res.status(200).json({
      ...document,
      is_owner: document.user_id === userId,
      has_reported,
      is_hidden_by_admin
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const getRelatedDocuments = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id } = req.query;
    
    const sql = `
      SELECT d.id, d.title, d.type, d.created_at,
             u.full_name as uploader,
             u.username as uploader_username,
             s.name as subject_name, s.code as subject_code,
             un.code as unit_code
      FROM documents d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN subjects s ON d.subject_id = s.id
      LEFT JOIN units un ON s.unit_id = un.id
      WHERE d.status = 'VERIFIED' AND d.is_hidden = FALSE 
        AND d.id != $1 AND d.subject_id = $2
      ORDER BY d.created_at DESC LIMIT 4
    `;
    const result = await query(sql, [id, subject_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, subject_id } = req.body;
    const user_id = req.user.id;

    const checkRes = await query('SELECT user_id, file_url FROM documents WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    if (checkRes.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa tài liệu này' });
    }

    let file_url = checkRes.rows[0].file_url;
    if (req.file) {
      file_url = await uploadToSupabase(req.file, 'documents');
    }

    const result = await query(
      `UPDATE documents 
       SET title = COALESCE($1, title), 
           type = COALESCE($2, type), 
           subject_id = COALESCE($3, subject_id),
           file_url = $4,
           status = 'PENDING'
       WHERE id = $5 RETURNING *`,
      [title, type, subject_id, file_url, id]
    );

    res.status(200).json({ message: 'Cập nhật tài liệu thành công! Đang chờ duyệt lại.', document: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const checkRes = await query('SELECT user_id FROM documents WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài liệu' });
    }
    if (checkRes.rows[0].user_id !== user_id) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa tài liệu này' });
    }

    await query('DELETE FROM documents WHERE id = $1', [id]);
    res.status(200).json({ message: 'Đã xóa tài liệu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};
