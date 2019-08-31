// import User from '../models/User';

class UserController {
  async store(req, res) {
    return res.json({ message: 'Calling from Controller' });
  }
}

export default new UserController();
