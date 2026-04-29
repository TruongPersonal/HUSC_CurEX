import { query } from '../database/db.js';

export const getAdminStats = async (req, res) => {
  try {
    // User stats
    const usersCount = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN role = 'STUDENT' THEN 1 END) as students,
        COUNT(CASE WHEN role = 'ASSISTANT' THEN 1 END) as assistants,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins
      FROM users
    `);

    // Report stats
    const reportsCount = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
        COUNT(CASE WHEN status IN ('RESOLVED', 'DISMISSED') THEN 1 END) as resolved
      FROM reports
    `);

    // Units count
    const unitsCount = await query(`SELECT COUNT(*) as total FROM units`);

    // Content counts
    const contentCount = await query(`
      SELECT 
        (SELECT COUNT(*) FROM documents) as docs,
        (SELECT COUNT(*) FROM posts) as posts
    `);

    // Recent activities (Latest 5 docs or posts)
    const recentActivities = await query(`
      (SELECT 'DOC' as type, d.title as activity, u.full_name, d.created_at 
       FROM documents d JOIN users u ON d.user_id = u.id)
      UNION ALL
      (SELECT 'POST' as type, p.title as activity, u.full_name, p.created_at 
       FROM posts p JOIN users u ON p.user_id = u.id)
      ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      users: usersCount.rows[0],
      reports: reportsCount.rows[0],
      units: unitsCount.rows[0].total,
      content: contentCount.rows[0],
      recent: recentActivities.rows
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê hệ thống' });
  }
};

export const getAssistantStats = async (req, res) => {
  try {
    const { unit_id } = req.user;
    if (!unit_id) {
      return res.status(403).json({ message: 'Tài khoản không được liên kết với Đơn vị nào' });
    }

    // Subjects in unit
    const subjectsCount = await query(`
      SELECT COUNT(*) as total FROM subjects WHERE unit_id = $1
    `, [unit_id]);

    // Documents in unit
    const docsCount = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN d.status IN ('VERIFIED', 'REJECTED') THEN 1 END) as verified,
        COUNT(CASE WHEN d.status = 'PENDING' THEN 1 END) as pending
      FROM documents d
      JOIN subjects s ON d.subject_id = s.id
      WHERE s.unit_id = $1
    `, [unit_id]);

    // Market posts in unit
    const postsCount = await query(`
      SELECT COUNT(*) as total
      FROM posts p
      JOIN subjects s ON p.subject_id = s.id
      WHERE s.unit_id = $1
    `, [unit_id]);

    // Recent activities in unit
    const recentActivities = await query(`
      (SELECT 'DOC' as type, d.title as activity, u.full_name, d.created_at 
       FROM documents d 
       JOIN users u ON d.user_id = u.id 
       JOIN subjects s ON d.subject_id = s.id
       WHERE s.unit_id = $1)
      UNION ALL
      (SELECT 'POST' as type, p.title as activity, u.full_name, p.created_at 
       FROM posts p 
       JOIN users u ON p.user_id = u.id
       JOIN subjects s ON p.subject_id = s.id
       WHERE s.unit_id = $1)
      ORDER BY created_at DESC LIMIT 5
    `, [unit_id]);

    res.json({
      subjects: subjectsCount.rows[0].total,
      docs: docsCount.rows[0],
      posts: postsCount.rows[0].total,
      recent: recentActivities.rows
    });
  } catch (error) {
    console.error('getAssistantStats error:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê đơn vị' });
  }
};
