import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import http from 'http';
import { Server } from 'socket.io';

const generateId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const SECRET_KEY = "my_super_secret_dnd_key_change_this";
let db = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_campaign', (campaignId) => {
    socket.join(`campaign_${campaignId}`);
    console.log(`User ${socket.id} joined campaign_${campaignId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const connectDB = async () => {
  try {
    db = await mysql.createConnection({
      host: 'db',
      user: 'dnd_user',
      password: 'dnd_user_password',
      database: 'dnd_inventory',
      charset: 'utf8mb4'
    });
    console.log("Connected to DB");
    await db.execute('SET NAMES utf8mb4');

    const tableCharset = 'DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    await db.execute(`CREATE TABLE IF NOT EXISTS users (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) UNIQUE NOT NULL, password VARCHAR(255) NOT NULL) ${tableCharset}`);
    await db.execute(`CREATE TABLE IF NOT EXISTS campaigns (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, dm_id INT NOT NULL, join_code VARCHAR(10) UNIQUE NOT NULL, FOREIGN KEY (dm_id) REFERENCES users(id)) ${tableCharset}`);
    await db.execute(`CREATE TABLE IF NOT EXISTS characters (id VARCHAR(255) PRIMARY KEY, user_id INT NOT NULL, campaign_id INT NOT NULL, data JSON NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE) ${tableCharset}`);
    await db.execute(`CREATE TABLE IF NOT EXISTS campaign_members (user_id INT, campaign_id INT, PRIMARY KEY (user_id, campaign_id), FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE) ${tableCharset}`);
    await db.execute(`CREATE TABLE IF NOT EXISTS quests (id VARCHAR(255) PRIMARY KEY, campaign_id INT NOT NULL, data JSON NOT NULL, FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE) ${tableCharset}`);

    setInterval(async () => { try { await db.query('SELECT 1'); } catch (e) { process.exit(1); } }, 60000);
  } catch (err) {
    console.log("DB Error:", err.message);
    setTimeout(connectDB, 5000);
  }
};
connectDB();

app.use((req, res, next) => { if (!db) return res.status(503).json({ error: 'Server starting' }); next(); });

const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(403).json({ error: 'No token' });
  try { req.user = jwt.verify(token.split(' ')[1], SECRET_KEY); next(); } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
};

// AUTH
app.post('/api/register', async (req, res) => {
  try {
    await db.execute('INSERT INTO users (username, password) VALUES (?, ?)', [req.body.username, await bcrypt.hash(req.body.password, 10)]);
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: 'User exists' }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [req.body.username]);
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });
    if (!await bcrypt.compare(req.body.password, rows[0].password)) return res.status(400).json({ error: 'Wrong password' });
    res.json({ token: jwt.sign({ id: rows[0].id, username: rows[0].username }, SECRET_KEY), username: rows[0].username, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// CAMPAIGNS
app.get('/api/campaigns', authenticate, async (req, res) => {
  try {
    const [asDm] = await db.execute('SELECT *, "DM" as role FROM campaigns WHERE dm_id = ?', [req.user.id]);
    const [asPlayer] = await db.execute('SELECT c.*, "PLAYER" as role FROM campaigns c JOIN campaign_members cm ON c.id = cm.campaign_id WHERE cm.user_id = ?', [req.user.id]);
    res.json([...asDm, ...asPlayer]);
  } catch (e) { console.error("Campaign Error:", e); res.status(500).json({ error: e.message }); }
});

app.post('/api/campaigns', authenticate, async (req, res) => {
  try {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.execute('INSERT INTO campaigns (name, dm_id, join_code) VALUES (?, ?, ?)', [req.body.name, req.user.id, code]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/campaigns/join', authenticate, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT id, dm_id FROM campaigns WHERE join_code = ?', [req.body.code]);
    if (rows.length === 0) return res.status(404).json({ error: 'Code not found' });
    if (rows[0].dm_id === req.user.id) return res.status(400).json({ error: "You are DM" });
    await db.execute('INSERT INTO campaign_members (user_id, campaign_id) VALUES (?, ?)', [req.user.id, rows[0].id]);
    res.json({ success: true });
  } catch (e) { res.json({ success: true }); }
});

app.delete('/api/campaigns/:id', authenticate, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const [rows] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (rows[0].dm_id !== req.user.id) return res.status(403).json({ error: 'Only DM can delete campaign' });
    await db.execute('DELETE FROM campaigns WHERE id = ?', [campaignId]);
    res.json({ success: true });
  } catch (e) {
    console.error('Campaign delete error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/campaigns/:id/export', authenticate, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const [campaignRows] = await db.execute('SELECT id, name, dm_id, join_code FROM campaigns WHERE id = ?', [campaignId]);
    if (campaignRows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    if (campaignRows[0].dm_id !== req.user.id) return res.status(403).json({ error: 'Only DM can export campaign' });

    const campaignMeta = {
      id: campaignRows[0].id,
      name: campaignRows[0].name,
      joinCode: campaignRows[0].join_code,
      exportedAt: new Date().toISOString()
    };

    const [characterRows] = await db.execute('SELECT id, user_id, data FROM characters WHERE campaign_id = ?', [campaignId]);
    const characters = characterRows.map(row => ({
      id: row.id,
      userId: row.user_id,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));

    const [questRows] = await db.execute('SELECT id, data FROM quests WHERE campaign_id = ?', [campaignId]);
    const quests = questRows.map(row => ({
      id: row.id,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));

    res.json({ campaign: campaignMeta, characters, quests });
  } catch (e) {
    console.error('Campaign export error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/campaigns/:id/import', authenticate, async (req, res) => {
  const connection = db;
  try {
    const campaignId = req.params.id;
    const [campaignRows] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (campaignRows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    if (campaignRows[0].dm_id !== req.user.id) return res.status(403).json({ error: 'Only DM can import campaign' });

    const characters = Array.isArray(req.body.characters) ? req.body.characters : [];
    const quests = Array.isArray(req.body.quests) ? req.body.quests : [];

    await connection.beginTransaction();
    await connection.execute('DELETE FROM characters WHERE campaign_id = ?', [campaignId]);
    await connection.execute('DELETE FROM quests WHERE campaign_id = ?', [campaignId]);

    const fallbackUserId = req.user.id;

    let importedCharacters = 0;
    for (const char of characters) {
      if (!char || !char.id || !char.data) continue;
      const dataPayload = {
        ...char.data,
        ownerId: fallbackUserId,
        ownerName: char.data?.ownerName || req.user.username
      };
      await connection.execute(
        'INSERT INTO characters (id, user_id, campaign_id, data) VALUES (?, ?, ?, ?)',
        [char.id, fallbackUserId, campaignId, JSON.stringify(dataPayload)]
      );
      importedCharacters += 1;
    }

    let importedQuests = 0;
    for (const quest of quests) {
      if (!quest || !quest.id || !quest.data) continue;
      await connection.execute(
        'INSERT INTO quests (id, campaign_id, data) VALUES (?, ?, ?)',
        [quest.id, campaignId, JSON.stringify(quest.data)]
      );
      importedQuests += 1;
    }

    await connection.commit();
    io.to(`campaign_${campaignId}`).emit('campaign_imported', { campaignId });
    res.json({ success: true, imported: { characters: importedCharacters, quests: importedQuests } });
  } catch (e) {
    if (connection) {
      try { await connection.rollback(); } catch (rollbackErr) { console.error('Rollback error:', rollbackErr); }
    }
    console.error('Campaign import error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/campaigns/import-new', authenticate, async (req, res) => {
  const connection = db;
  try {
    const { campaign: campaignMeta, characters = [], quests = [] } = req.body || {};
    const nameBase = typeof campaignMeta?.name === 'string' && campaignMeta.name.trim().length > 0
      ? campaignMeta.name.trim()
      : 'Импортированная кампания';
    const campaignName = `${nameBase}`;
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await connection.beginTransaction();
    const [campaignResult] = await connection.execute(
      'INSERT INTO campaigns (name, dm_id, join_code) VALUES (?, ?, ?)',
      [campaignName, req.user.id, joinCode]
    );

    const newCampaignId = campaignResult.insertId;

    const fallbackUserId = req.user.id;
    const charIdMap = new Map();

    let importedCharacters = 0;
    for (const char of Array.isArray(characters) ? characters : []) {
      if (!char || !char.id || !char.data) continue;
      const originalId = typeof char.id === 'string' && char.id.trim().length > 0 ? char.id : generateId();
      const newCharId = generateId();
      charIdMap.set(originalId, newCharId);
      const dataPayload = {
        ...char.data,
        ownerId: fallbackUserId,
        ownerName: char.data?.ownerName || req.user.username
      };
      await connection.execute(
        'INSERT INTO characters (id, user_id, campaign_id, data) VALUES (?, ?, ?, ?)',
        [newCharId, fallbackUserId, newCampaignId, JSON.stringify(dataPayload)]
      );
      importedCharacters += 1;
    }

    let importedQuests = 0;
    for (const quest of Array.isArray(quests) ? quests : []) {
      if (!quest || !quest.id || !quest.data) continue;
      const questData = {
        ...quest.data,
        assignedCharacterIds: Array.isArray(quest.data?.assignedCharacterIds)
          ? quest.data.assignedCharacterIds.map(id => charIdMap.get(id) || id)
          : []
      };
      const newQuestId = generateId();
      await connection.execute(
        'INSERT INTO quests (id, campaign_id, data) VALUES (?, ?, ?)',
        [newQuestId, newCampaignId, JSON.stringify(questData)]
      );
      importedQuests += 1;
    }

    await connection.commit();
    res.json({
      success: true,
      campaign: {
        id: newCampaignId,
        name: campaignName,
        joinCode
      },
      imported: { characters: importedCharacters, quests: importedQuests }
    });
  } catch (e) {
    if (connection) {
      try { await connection.rollback(); } catch (rollbackErr) { console.error('Rollback error:', rollbackErr); }
    }
    console.error('Campaign import-new error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/campaigns/:campaignId/players/:playerId', authenticate, async (req, res) => {
  try {
    const { campaignId, playerId } = req.params;
    const [camp] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (camp.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    if (camp[0].dm_id !== req.user.id) return res.status(403).json({ error: 'Only DM can remove players' });
    if (parseInt(playerId, 10) === req.user.id) return res.status(400).json({ error: 'DM cannot remove self' });

    await db.execute('DELETE FROM campaign_members WHERE campaign_id = ? AND user_id = ?', [campaignId, playerId]);
    await db.execute('DELETE FROM characters WHERE campaign_id = ? AND user_id = ?', [campaignId, playerId]);

    io.to(`campaign_${campaignId}`).emit('player_removed', { playerId: parseInt(playerId, 10) });

    res.json({ success: true });
  } catch (e) {
    console.error('Remove player error:', e);
    res.status(500).json({ error: e.message });
  }
});

// CHARACTERS
app.get('/api/campaigns/:id/characters', authenticate, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const [camp] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (camp.length === 0) return res.status(404).json({});

    const isDm = camp[0].dm_id === req.user.id;

    // Используем LEFT JOIN на случай если юзер удален, но персонаж остался
    let q = `
        SELECT c.id, c.data, c.user_id, u.username 
        FROM characters c 
        LEFT JOIN users u ON c.user_id = u.id 
        WHERE c.campaign_id = ?`;

    let p = [campaignId];

    if (!isDm) {
      q += ' AND c.user_id = ?';
      p.push(req.user.id);
    }

    const [rows] = await db.execute(q, p);
    const chars = {};
    rows.forEach(r => {
      const d = typeof r.data === 'string' ? JSON.parse(r.data) : r.data; // Handle stringified JSON if DB returns string
      d.ownerId = r.user_id;
      d.ownerName = r.username || 'Unknown';
      chars[r.id] = d;
    });
    res.json(chars);
  } catch (e) {
    console.error("Char Fetch Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/characters', authenticate, async (req, res) => {
  try {
    const { id, campaignId, data } = req.body;
    const [camp] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (camp.length === 0) return res.status(404).json({});
    const isDm = camp[0].dm_id === req.user.id;

    const [char] = await db.execute('SELECT user_id FROM characters WHERE id = ?', [id]);
    if (char.length > 0) {
      if (char[0].user_id === req.user.id || isDm) {
        await db.execute('UPDATE characters SET data = ? WHERE id = ?', [JSON.stringify(data), id]);
      } else {
        return res.status(403).json({ error: 'No perm' });
      }
    } else {
      await db.execute('INSERT INTO characters (id, user_id, campaign_id, data) VALUES (?, ?, ?, ?)',
        [id, req.user.id, campaignId, JSON.stringify(data)]);
    }

    const lastAction = data.history?.[0]?.description || 'Изменения';
    io.to(`campaign_${campaignId}`).emit('character_updated', { id, data, updatedBy: req.user.username, lastAction });

    res.json({ success: true });
  } catch (e) {
    console.error("Char Save Error:", e);
    res.status(500).json({ error: e.message });
  }
});

// QUESTS
app.get('/api/campaigns/:id/quests', authenticate, async (req, res) => {
  try {
    const campaignId = req.params.id;
    const [camp] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (camp.length === 0) return res.status(404).json([]);

    const [rows] = await db.execute('SELECT id, data FROM quests WHERE campaign_id = ?', [campaignId]);
    const quests = rows.map(r => {
      const data = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      return { id: r.id, ...data };
    });
    res.json(quests);
  } catch (e) {
    console.error("Quest Fetch Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/quests', authenticate, async (req, res) => {
  try {
    const { id, campaignId, data } = req.body;
    const [camp] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);
    if (camp.length === 0) return res.status(404).json({ error: 'Campaign not found' });

    // Only DM can create/update quests
    if (camp[0].dm_id !== req.user.id) {
      return res.status(403).json({ error: 'Only DM can manage quests' });
    }

    const [existing] = await db.execute('SELECT id FROM quests WHERE id = ?', [id]);
    if (existing.length > 0) {
      await db.execute('UPDATE quests SET data = ? WHERE id = ?', [JSON.stringify(data), id]);
    } else {
      await db.execute('INSERT INTO quests (id, campaign_id, data) VALUES (?, ?, ?)',
        [id, campaignId, JSON.stringify(data)]);
    }

    io.to(`campaign_${campaignId}`).emit('quest_updated', { id, data });

    res.json({ success: true });
  } catch (e) {
    console.error("Quest Save Error:", e);
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/quests/:id', authenticate, async (req, res) => {
  try {
    const questId = req.params.id;
    const [quest] = await db.execute('SELECT campaign_id FROM quests WHERE id = ?', [questId]);
    if (quest.length === 0) return res.status(404).json({ error: 'Quest not found' });

    const campaignId = quest[0].campaign_id;
    const [camp] = await db.execute('SELECT dm_id FROM campaigns WHERE id = ?', [campaignId]);

    // Only DM can delete quests
    if (camp[0].dm_id !== req.user.id) {
      return res.status(403).json({ error: 'Only DM can delete quests' });
    }

    await db.execute('DELETE FROM quests WHERE id = ?', [questId]);
    io.to(`campaign_${campaignId}`).emit('quest_deleted', { id: questId });

    res.json({ success: true });
  } catch (e) {
    console.error("Quest Delete Error:", e);
    res.status(500).json({ error: e.message });
  }
});

server.listen(3000, '0.0.0.0', () => console.log(`Server running`));

