const bcrypt = require('bcrypt');
const usersRouter = require('express').Router();
const User = require('../models/users');
const Blog = require('../models/blogposts');

usersRouter.post('/', async (request, response) => {
  const { username, name, password } = request.body;
  const blogs = Blog.findById('65c3d720501e3b791500580a');

  if (password === undefined) {
    response.status(400).json({ error: 'User validation failed: password: Path `password` is required.' });
  }

  if (password.length <= 3) {
    response.status(400).json({ error: 'password needs to have more than three characters' });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    passwordHash,
    id: blogs.id,
  });

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

usersRouter.get('/', async (request, response) => {
  const users = await User.find({});
  response.json(users);
});

module.exports = usersRouter;
