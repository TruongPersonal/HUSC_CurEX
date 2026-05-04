import { query } from '../database/db.js';
import { saveFileLocal } from '../utils/uploadUtils.js';

const getFullImageUrl = (req, path) => {
  if (!path) return path;
  if (path.startsWith('http')) return path;
  return `${req.protocol}://${req.get('host')}${path}`;
};

export const getPosts = async (req, res) => {
  try {
    const { 
      q, 
      condition, 
      min_price, 
      max_price, 
      mine,
      include_mine,
      limit = 12, 
      offset = 0 
    } = req.query;
    const userId = req.user?.id;

    let queryStr = `
      SELECT 
        p.id, p.title, p.description, p.price, p.condition, p.image_url, 
        p.place, p.status, p.created_at, p.updated_at,
        s.name as subject_name,
        u.full_name as seller_name
      FROM posts p
      LEFT JOIN subjects s ON p.subject_id = s.id
      LEFT JOIN units su ON s.unit_id = su.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN units uu ON u.unit_id = uu.id
      WHERE 1=1
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (mine === 'true' && userId) {
      queryStr += ` AND p.user_id = $${paramIndex}`;
      queryParams.push(userId);
      paramIndex++;
    } else {
      queryStr += ` AND p.is_hidden = FALSE`;
    }

    if (q) {
      queryStr += ` AND (
        s.name ILIKE $${paramIndex} OR 
        su.name ILIKE $${paramIndex} OR
        u.full_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${q}%`);
      paramIndex++;
    }

    if (condition) {
      queryStr += ` AND p.condition = $${paramIndex}`;
      queryParams.push(condition);
      paramIndex++;
    }

    if (min_price) {
      queryStr += ` AND p.price >= $${paramIndex}`;
      queryParams.push(parseInt(min_price));
      paramIndex++;
    }

    if (max_price) {
      queryStr += ` AND p.price <= $${paramIndex}`;
      queryParams.push(parseInt(max_price));
      paramIndex++;
    }

    queryStr += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await query(queryStr, queryParams);

    res.status(200).json({
      posts: result.rows.map(p => ({ ...p, image_url: getFullImageUrl(req, p.image_url) })),
      hasMore: result.rows.length === parseInt(limit)
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await query(`
      SELECT 
        p.*, 
        s.name as subject_name, s.code as subject_code,
        u.full_name as seller_name, u.username as seller_username,
        u.phone as seller_phone,
        un.name as unit_name
      FROM posts p
      LEFT JOIN subjects s ON p.subject_id = s.id
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN units un ON u.unit_id = un.id
      WHERE p.id = $1 AND (p.is_hidden = FALSE OR p.user_id = $2)
    `, [id, userId || -1]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng.' });
    }

    const post = result.rows[0];
    
    let buyer = null;
    if (post.status === 'SOLD') {
      const buyerResult = await query(`
        SELECT er.meeting_at as completed_at, u.full_name, u.username, u.phone
        FROM exchange_requests er
        JOIN users u ON er.buyer_id = u.id
        WHERE er.post_id = $1 AND er.status = 'COMPLETED'
        LIMIT 1
      `, [id]);
      if (buyerResult.rows.length > 0) {
        buyer = buyerResult.rows[0];
        if (post.user_id !== userId) {
          delete buyer.phone;
        }
      }
    }

    let myRequest = null;
    if (userId) {
      const reqCheck = await query(
        `SELECT er.id, er.status, er.meeting_at, er.poster_message, u.phone as seller_phone
         FROM exchange_requests er
         JOIN posts p ON er.post_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE er.post_id = $1 AND er.buyer_id = $2`,
        [id, userId]
      );
      if (reqCheck.rows.length > 0) {
        myRequest = reqCheck.rows[0];
        if (myRequest.status !== 'ACCEPTED' && myRequest.status !== 'COMPLETED' && myRequest.status !== 'CANCELLED') {
          delete myRequest.seller_phone;
        }
      }
    }

    delete post.seller_phone;

    let has_reported = false;
    if (userId) {
      const reportCheck = await query(
        'SELECT id FROM reports WHERE reporter_id = $1 AND post_id = $2',
        [userId, id]
      );
      has_reported = reportCheck.rows.length > 0;
    }

    const adminReportCheck = await query(
      "SELECT id FROM reports WHERE post_id = $1 AND status = 'RESOLVED'",
      [id]
    );
    const is_hidden_by_admin = adminReportCheck.rows.length > 0;

    res.status(200).json({
      ...post,
      image_url: getFullImageUrl(req, post.image_url),
      is_owner: post.user_id === userId,
      my_request: myRequest,
      buyer,
      has_reported,
      is_hidden_by_admin
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const getRelatedPosts = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject_id } = req.query;

    const result = await query(`
      SELECT p.id, p.title, p.price, p.description, p.image_url, p.condition, p.created_at,
             s.name as subject_name
      FROM posts p
      JOIN subjects s ON p.subject_id = s.id
      WHERE p.subject_id = $1 AND p.id != $2 AND p.is_hidden = FALSE AND p.status = 'AVAILABLE'
      ORDER BY p.created_at DESC
      LIMIT 4
    `, [subject_id, id]);

    res.status(200).json(result.rows.map(p => ({ ...p, image_url: getFullImageUrl(req, p.image_url) })));
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi tải bài đăng liên quan.' });
  }
};

export const createExchangeRequest = async (req, res) => {
  try {
    const { post_id, buyer_message } = req.body;
    const buyer_id = req.user.id;

    const postCheck = await query('SELECT user_id, status FROM posts WHERE id = $1', [post_id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Bài đăng không tồn tại.' });
    }
    if (postCheck.rows[0].user_id === buyer_id) {
      return res.status(400).json({ message: 'Bạn không thể gửi yêu cầu cho bài đăng của chính mình.' });
    }
    if (postCheck.rows[0].status === 'SOLD') {
      return res.status(400).json({ message: 'Sản phẩm này đã được bán.' });
    }

    const dupCheck = await query(
      'SELECT id FROM exchange_requests WHERE post_id = $1 AND buyer_id = $2',
      [post_id, buyer_id]
    );
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Bạn đã gửi yêu cầu cho bài đăng này rồi.' });
    }

    await query(
      'INSERT INTO exchange_requests (post_id, buyer_id, buyer_message) VALUES ($1, $2, $3)',
      [post_id, buyer_id, buyer_message]
    );

    res.status(201).json({ message: 'Gửi yêu cầu thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const getRequestsForPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const postCheck = await query('SELECT user_id FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0 || postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xem yêu cầu này.' });
    }

    const result = await query(`
      SELECT er.*, u.full_name as buyer_name, u.username as buyer_username, u.phone as buyer_phone
      FROM exchange_requests er
      JOIN users u ON er.buyer_id = u.id
      WHERE er.post_id = $1
      ORDER BY er.created_at DESC
    `, [id]);

    const sanitizedRequests = result.rows.map(r => {
      if (r.status !== 'ACCEPTED' && r.status !== 'COMPLETED' && r.status !== 'CANCELLED') {
        delete r.buyer_phone;
      }
      return r;
    });

    res.status(200).json(sanitizedRequests);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, meeting_at, poster_message } = req.body;
    const userId = req.user.id;

    const requestCheck = await query(`
      SELECT er.*, p.user_id as owner_id
      FROM exchange_requests er
      JOIN posts p ON er.post_id = p.id
      WHERE er.id = $1
    `, [requestId]);

    if (requestCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu.' });
    }

    const isOwner = requestCheck.rows[0].owner_id === userId;
    const isBuyer = requestCheck.rows[0].buyer_id === userId;

    if (!isOwner && !isBuyer) {
      return res.status(403).json({ message: 'Bạn không có quyền thực hiện thao tác này.' });
    }

    if (isBuyer && !isOwner) {
      if (requestCheck.rows[0].status !== 'ACCEPTED') {
        return res.status(403).json({ message: 'Bạn chỉ có thể đổi giờ khi yêu cầu đã được chấp nhận.' });
      }
      if (!meeting_at) {
        return res.status(400).json({ message: 'Vui lòng cung cấp thời gian mới.' });
      }
      await query('UPDATE exchange_requests SET meeting_at = $1, updated_at = NOW() WHERE id = $2', [meeting_at, requestId]);
      return res.status(200).json({ message: 'Cập nhật thời gian thành công!' });
    }
    
    if (status === 'ACCEPTED') {
      const activeRequest = await query(
        'SELECT id FROM exchange_requests WHERE post_id = $1 AND (status = \'ACCEPTED\' OR status = \'COMPLETED\') AND id != $2',
        [requestCheck.rows[0].post_id, requestId]
      );
      if (activeRequest.rows.length > 0) {
        return res.status(400).json({ message: 'Bạn đang có một giao dịch khác đang tiến hành hoặc đã hoàn thành cho bài đăng này.' });
      }
    }

    let updateQuery = 'UPDATE exchange_requests SET status = $1, updated_at = NOW()';
    let queryParams = [status || requestCheck.rows[0].status];

    if (meeting_at) {
      updateQuery += ', meeting_at = $2';
      queryParams.push(meeting_at);
    }

    if (poster_message) {
      updateQuery += `, poster_message = $${queryParams.length + 1}`;
      queryParams.push(poster_message);
    }

    updateQuery += ` WHERE id = $${queryParams.length + 1}`;
    queryParams.push(requestId);

    await query(updateQuery, queryParams);

    if (status === 'COMPLETED') {
      await query('UPDATE posts SET status = \'SOLD\', updated_at = NOW() WHERE id = $1', [requestCheck.rows[0].post_id]);
    }

    res.status(200).json({ message: 'Cập nhật thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const deleteMarketPost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const postCheck = await query('SELECT user_id, is_hidden FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng.' });
    }

    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bài đăng này.' });
    }

    if (postCheck.rows[0].is_hidden) {
      return res.status(400).json({ message: 'Không thể xóa bài đăng đang bị ẩn để phục vụ việc thống kê vi phạm.' });
    }

    await query('DELETE FROM posts WHERE id = $1', [id]);
    res.status(200).json({ message: 'Xóa bài đăng thành công!' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};

export const updateMarketPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, condition, place, subject_id } = req.body;
    const userId = req.user.id;

    const postCheck = await query('SELECT user_id, image_url FROM posts WHERE id = $1', [id]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài đăng.' });
    }

    if (postCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa bài đăng này.' });
    }

    let imageUrl = postCheck.rows[0].image_url;
    if (req.file) {
      imageUrl = await saveFileLocal(req.file, 'posts');
    }

    const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${req.protocol}://${req.get('host')}${imageUrl}`;

    await query(`
      UPDATE posts 
      SET title = $1, description = $2, price = $3, condition = $4, place = $5, subject_id = $6, image_url = $7, updated_at = NOW()
      WHERE id = $8
    `, [title, description, price, condition, place, subject_id, imageUrl, id]);

    res.status(200).json({ message: 'Cập nhật bài đăng thành công!', image_url: fullImageUrl });
  } catch (error) {
    console.error('Update market post error:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};
