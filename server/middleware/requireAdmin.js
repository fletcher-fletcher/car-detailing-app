// server/middleware/requireAdmin.js
const requireAdmin = (req, res, next) => {
  const user = req.user;
  
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Требуются права администратора' });
  }
  
  next();
};

export default requireAdmin;
