// eslint-disable-next-line no-unused-vars
const _ = require('lodash');

const dummy = (blogs) => 1;

const totalLikes = (blogs) => blogs
  .map((blog) => blog.likes)
  .reduce((a, b) => a + b, 0);

const favoriteBlog = (blogs) => {
  const likesArray = blogs.map((blog) => Number(blog.likes));
  const index = likesArray.indexOf(Math.max(...likesArray));
  if (index === -1) return {};
  return blogs[index];
};

const mostBlogs = (blogs) => {
  const partitioned = _.groupBy(blogs, 'author');
  const names = Object.keys(partitioned);
  const number = Object.values(partitioned)
    .map((blog) => blog.length);
  const index = number.indexOf(Math.max(...number));
  if (index === -1) return {};
  return {
    author: names[index],
    blogs: number[index],
  };
};

const mostLikes = (blogs) => {
  try {
    return _(blogs)
      .groupBy('author')
      .map((object, author) => ({
        author,
        likes: _.sumBy(object, 'likes'),
      }))
      .value()
      .reduce((prev, current) => ((prev && prev.likes >= current.likes) ? prev : current));
  } catch (error) {
    return {};
  }
};

module.exports = {
  dummy, favoriteBlog, totalLikes, mostBlogs, mostLikes,
};
