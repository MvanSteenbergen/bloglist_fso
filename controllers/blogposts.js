const blogsRouter = require('express').Router();
const Blog = require('../models/blogposts');

blogsRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({});
  response.json(blogs);
});

blogsRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body);
  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

blogsRouter.delete('/:id', async (request, response) => {
  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
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
