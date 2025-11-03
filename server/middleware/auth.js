// server/middleware/auth.js
import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 Auth middleware - Token:', token ? 'exists' : 'missing');

  // Пропускаем тестовые токены для разработки
  if (token && token.startsWith('test-')) {
    console.log('⚠️ Using test token bypass');
    const testUsers = {
      'test-admin-token-real': { 
        id: 'admin-real-id', 
        email: 'admin@detailing.ru', 
        role: 'admin',
        userId: 'admin-real-id'
      },
      'test-executor-token': { 
        id: 'executor-test-id', 
        email: 'executor@detailing.ru', 
        role: 'executor',
        userId: 'executor-test-id'
      },
      'test-client-token': { 
        id: 'client-test-id', 
        email: 'client@detailing.ru', 
        role: 'client',
        userId: 'client-test-id'
      }
    };
    
    if (testUsers[token]) {
      req.user = testUsers[token];
      return next();
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('❌ Token verification failed:', err.message);
      return res.status(403).json({ message: 'Неверный токен' });
    }
    
    console.log('✅ Token verified, user:', user);
    
    // ИСПРАВЛЕНИЕ: Убеждаемся, что req.user.id существует
    req.user = {
      ...user,
      id: user.userId || user.id  // используем userId из токена как id
    };
    
    console.log('✅ Set req.user:', req.user);
    next();
  });
};

export default authenticateToken;
