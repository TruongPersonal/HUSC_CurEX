import { query } from '../database/db.js';

export const exportData = async (req, res) => {
  try {
    let result = {};
    
    if (req.user.role === 'ASSISTANT') {
      const subjects = await query(`
        SELECT s.code, s.name
        FROM subjects s
        WHERE s.unit_id = $1
      `, [req.user.unit_id]);
      result.subjects = subjects.rows;
    } else {
      const units = await query('SELECT code, name FROM units');
      const users = await query(`
        SELECT username, password, full_name, google_id, email, unit_id, role, is_active 
        FROM users
      `);
      result.units = units.rows;
      result.users = users.rows;
    }
    
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi export dữ liệu' });
  }
};

export const importData = async (req, res) => {
  try {
    const { units, subjects, users } = req.body;
    let log = {
      unitsAdded: 0,
      unitsSkipped: 0,
      subjectsAdded: 0,
      subjectsSkipped: 0,
      usersAdded: 0,
      usersSkipped: 0
    };

    if (units && Array.isArray(units) && req.user.role === 'ADMIN') {
      for (const u of units) {
        if (!u.code || !u.name) continue;
        const check = await query('SELECT id FROM units WHERE code = $1', [u.code]);
        if (check.rows.length === 0) {
          await query('INSERT INTO units (code, name) VALUES ($1, $2)', [u.code, u.name]);
          log.unitsAdded++;
        } else {
          log.unitsSkipped++;
        }
      }
    }

    if (subjects && Array.isArray(subjects)) {
      for (const s of subjects) {
        if (!s.code || !s.name) continue;
        
        let unit_id;
        if (req.user.role === 'ASSISTANT') {
          unit_id = req.user.unit_id; // Always use Assistant's unit
        } else {
          if (!s.unit_code) {
            log.subjectsSkipped++;
            continue;
          }
          const unitCheck = await query('SELECT id FROM units WHERE code = $1', [s.unit_code]);
          if (unitCheck.rows.length === 0) {
            log.subjectsSkipped++; // Unit doesn't exist
            continue;
          }
          unit_id = unitCheck.rows[0].id;
        }
        
        const check = await query('SELECT id FROM subjects WHERE code = $1', [s.code]);
        if (check.rows.length === 0) {
          await query('INSERT INTO subjects (code, name, unit_id) VALUES ($1, $2, $3)', [s.code, s.name, unit_id]);
          log.subjectsAdded++;
        } else {
          log.subjectsSkipped++; // Duplicate code
        }
      }
    }

    if (users && Array.isArray(users) && req.user.role === 'ADMIN') {
      for (const u of users) {
        if (!u.username) continue;
        
        let check;
        if (u.unit_id === null || u.unit_id === undefined) {
          check = await query('SELECT id FROM users WHERE username = $1 AND unit_id IS NULL', [u.username]);
        } else {
          check = await query('SELECT id FROM users WHERE username = $1 AND unit_id = $2', [u.username, u.unit_id]);
        }
        
        if (check.rows.length === 0) {
          await query(`
            INSERT INTO users (username, password, full_name, google_id, email, unit_id, role, is_active) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [u.username, u.password, u.full_name, u.google_id, u.email, u.unit_id, u.role, u.is_active]);
          log.usersAdded++;
        } else {
          log.usersSkipped++;
        }
      }
    }

    res.status(200).json({
      message: 'Import hoàn tất',
      log
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi khi import dữ liệu' });
  }
};
