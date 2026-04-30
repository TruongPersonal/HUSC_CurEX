import { query } from '../database/db.js';

export const getReports = async (req, res) => {
  try {
    const result = await query(`
      SELECT r.id, r.reason, r.description, r.status, r.created_at,
             r.post_id, r.document_id,
             u.username as reporter_username, u.full_name as reporter_name,
             p.title as post_title, p.image_url as post_image,
             d.title as doc_title,
             CASE
               WHEN r.post_id IS NOT NULL THEN 'POST'
               WHEN r.document_id IS NOT NULL THEN 'DOCUMENT'
             END as target_type,
             owner.full_name as owner_name, owner.username as owner_username
      FROM reports r
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN posts p ON r.post_id = p.id
      LEFT JOIN documents d ON r.document_id = d.id
      LEFT JOIN users owner ON owner.id = COALESCE(p.user_id, d.user_id)
      ORDER BY r.created_at DESC
    `);
    
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải danh sách báo cáo' });
  }
};

export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'RESOLVED' or 'DISMISSED'
    
    if (!['RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái báo cáo không hợp lệ' });
    }

    const result = await query(
      'UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, post_id, document_id',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy báo cáo' });
    }

    const report = result.rows[0];

    // If report is resolved, hide the content and resolve ALL OTHER reports for the same content
    if (status === 'RESOLVED') {
      if (report.post_id) {
        await query('UPDATE posts SET is_hidden = TRUE WHERE id = $1', [report.post_id]);
        await query('UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE post_id = $2 AND status = $3', ['RESOLVED', report.post_id, 'PENDING']);
      } else if (report.document_id) {
        await query('UPDATE documents SET is_hidden = TRUE WHERE id = $1', [report.document_id]);
        await query('UPDATE reports SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE document_id = $2 AND status = $3', ['RESOLVED', report.document_id, 'PENDING']);
      }
    }

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái báo cáo' });
  }
};

export const submitReport = async (req, res) => {
  try {
    const { post_id, document_id, reason, description } = req.body;
    const reporter_id = req.user.id;

    if (!reason) {
      return res.status(400).json({ message: 'Vui lòng chọn lý do báo cáo.' });
    }

    // Check if already reported
    const existingReport = await query(
      `SELECT id FROM reports 
       WHERE reporter_id = $1 
       AND (post_id = $2 OR (post_id IS NULL AND $2 IS NULL))
       AND (document_id = $3 OR (document_id IS NULL AND $3 IS NULL))`,
      [reporter_id, post_id || null, document_id || null]
    );

    if (existingReport.rows.length > 0) {
      return res.status(400).json({ message: 'Bạn đã gửi báo cáo cho nội dung này rồi. Chúng mình đang trong quá trình xử lý!' });
    }

    const result = await query(
      `INSERT INTO reports (reporter_id, post_id, document_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, status, created_at`,
      [reporter_id, post_id || null, document_id || null, reason, description]
    );

    res.status(201).json({ 
      message: 'Cảm ơn bạn đã gửi báo cáo. Chúng mình sẽ xử lý trong thời gian sớm nhất!',
      report: result.rows[0]
    });
  } catch (error) {
    console.error('Submit report error:', error);
    res.status(500).json({ message: 'Lỗi server khi gửi báo cáo.' });
  }
};

export const getMyReports = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT r.id, r.reason, r.description, r.status, r.created_at,
             p.title as post_title, d.title as doc_title,
             CASE
               WHEN r.post_id IS NOT NULL THEN 'POST'
               WHEN r.document_id IS NOT NULL THEN 'DOCUMENT'
             END as target_type
      FROM reports r
      LEFT JOIN posts p ON r.post_id = p.id
      LEFT JOIN documents d ON r.document_id = d.id
      WHERE r.reporter_id = $1
      ORDER BY r.created_at DESC
    `, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải báo cáo của bạn.' });
  }
};

export const getReportsAgainstMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT r.id, r.reason, r.description, r.status, r.created_at,
             p.title as post_title, d.title as doc_title,
             u.username as reporter_username,
             CASE
               WHEN r.post_id IS NOT NULL THEN 'POST'
               WHEN r.document_id IS NOT NULL THEN 'DOCUMENT'
             END as target_type
      FROM reports r
      LEFT JOIN posts p ON r.post_id = p.id
      LEFT JOIN documents d ON r.document_id = d.id
      JOIN users u ON r.reporter_id = u.id
      WHERE (p.user_id = $1 OR d.user_id = $1)
      ORDER BY r.created_at DESC
    `, [userId]);

    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải báo cáo vi phạm của bạn.' });
  }
};
