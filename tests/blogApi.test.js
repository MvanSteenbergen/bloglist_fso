/* eslint-disable no-undef */
const mongoose = require('mongoose');
const supertest = require('supertest');
const bcrypt = require('bcrypt');

const helper = require('./testHelper');
const app = require('../app');

const api = supertest(app);
const Blog = require('../models/blogposts');
const User = require('../models/users');

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const blogObjects = helper.initialBlogs
    .map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);

  const passwordHash = await bcrypt.hash('hashybash', 10);
  const user = new User({ username: 'root', passwordHash });
  await user.save();
});

describe('get-requests', () => {
  test('returns correct number of blog posts', async () => {
    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    const response = await api
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body).toHaveLength(helper.initialBlogs.length);
  });

  test('a specific blog has the correct id', async () => {
    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    const response = await api
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`);

    const contents = response.body;

    expect(contents[0]).toHaveProperty('id');
  });
});

describe('post-requests', () => {
  test('succeeds with code 201 with valid data and valid login', async () => {
    const newBlog = {
      title: 'A Search Engine That Exists',
      author: 'G. Oogle',
      url: 'https://www.google.com/',
      likes: 0,
    };

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const response = await api
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`);

    const contents = response.body.map((r) => r.title);

    expect(response.body).toHaveLength(helper.initialBlogs.length + 1);
    expect(contents).toContain('A Search Engine That Exists');
  });

  test('fails with status code 401 without valid login token', async () => {
    const newBlog = {
      title: 'Another Search Engine',
      author: 'G. Oogle',
      url: 'https://www.google.com/',
      likes: 0,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', 'Bearer clearlyinvalidtoken')
      .send(newBlog)
      .expect(401)
      .expect('Content-Type', /application\/json/);
  });

  test('adding a blog without likes-field sets likes to 0', async () => {
    const newBlog = {
      title: 'Setting Likes To 0: The Definitive Guide',
      author: 'R. Eset',
      url: 'https://www.medium.com/settinglikesto0/',
    };

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const response = await api
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`);

    const contents = response.body.map((r) => r.likes).at(-1);

    expect(contents).toEqual(0);
  });

  test('adding a blog without a title and/or a url leads to a 400 bad request', async () => {
    const badBlog1 = {
      author: 'H. Burt',
      url: 'https://invalidrequest.tv/',
    };
    const badBlog2 = {
      title: 'A Bad Request: Dramatic and Demeaning',
      url: 'https://abadrequest.meta/',
    };

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(badBlog1)
      .expect(400);

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(badBlog2)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('delete-requests', () => {
  test('succeeds with status code 204 with valid id', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length - 1);

    const titles = blogsAtEnd.map((r) => r.title);

    expect(titles).not.toContain(blogToDelete.title);
  });

  test('fails with status code 404 with non-existing but valid id', async () => {
    const id = helper.nonExistingId();

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    await api
      .get(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });

  test('fails with status code 404 with invalid id', async () => {
    const id = 'invalid_id';

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    await api
      .get(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

describe('put-requests', () => {
  test('succeeds with valid data', async () => {
    const blogsAtStart = await helper.blogsInDb();

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    const blogToUpdate = {
      id: blogsAtStart[0].id,
      title: blogsAtStart[0].title,
      author: blogsAtStart[0].author,
      likes: blogsAtStart[0].likes + 1,
      url: blogsAtStart[0].url,
    };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(blogToUpdate)
      .expect(201);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd[0].likes).toEqual(blogsAtStart[0].likes + 1);
  });

  test('fails with status 404 with non-existing but valid id', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const id = helper.nonExistingId();

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    const blogToUpdate = {
      id,
      title: blogsAtStart[0].title,
      author: blogsAtStart[0].author,
      likes: blogsAtStart[0].likes,
      url: blogsAtStart[0].url,
    };

    await api
      .put(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(blogToUpdate)
      .expect(404);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });

  test('fails with status code 400 with invalid id', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const id = 'invalid_id';

    const login = {
      username: 'root',
      password: 'hashybash',
    };

    const tokenResponse = await api
      .post('/api/login')
      .send(login);

    const { token } = tokenResponse.body;

    const blogToUpdate = {
      id,
      title: blogsAtStart[0].title,
      author: blogsAtStart[0].author,
      likes: blogsAtStart[0].likes,
      url: blogsAtStart[0].url,
    };

    await api
      .put(`/api/blogs/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(blogToUpdate)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length);
  });
});

afterAll(async () => {
  await mongoose.connection.close();
});
