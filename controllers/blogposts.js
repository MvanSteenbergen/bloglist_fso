const blogsRouter = require('express').Router();
const jwt = require('jsonwebtoken');

const Blog = require('../models/blogposts');
const User = require('../models/users');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog
    .find({}).populate('user', { username: 1, name: 1 });
  response.json(blogs);
});

const getTokenFrom = (request) => {
  const authorization = request.get('authorization');
  if (authorization && authorization.startsWith('Bearer ')) {
    return authorization.replace('Bearer ', '');
  }
  return null;
};

blogsRouter.post('/', async (request, response) => {
  const { body } = request;
  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);
  if (!decodedToken.id) {
    return response.status(401).json({ error: 'token invalid' });
  }
  const user = await User.findById(decodedToken.id);

  const blog = new Blog({
    title: body.title,
    author: body.author,
    likes: body.likes,
    user: user.id,
  });

  const savedBlog = await blog.save();
  // eslint-disable-next-line no-underscore-dangle
  user.blogs = user.blogs.concat(savedBlog.id);
  await user.save();

  return response.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', async (request, response) => {
  const { user } = request;
  const blog = await Blog.findById(request.params.id);

  if (blog.user.toString() === user.id.toString()) {
    await Blog.findByIdAndDelete(request.params.id);
  } else {
    return response.status(401).json({ error: 'User unauthorized to delete blog' });
  }
  return response.status(204).end();
});

blogsRouter.put('/:id', async (request, response) => {
  const { body } = request;

  const blog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes,
  };

  const savedBlog = await Blog.findByIdAndUpdate(request.params.id, blog, { new: true });

  if (savedBlog === null) {
    response.status(404).json(savedBlog);
  } else {
    response.status(201).json(savedBlog);
  }
});

module.exports = blogsRouter;
