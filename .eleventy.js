module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("redom.js");
  eleventyConfig.addPassthroughCopy("sessionPickerApp.js");
  eleventyConfig.addPassthroughCopy("bookingLoaderApp.js");
  eleventyConfig.addPassthroughCopy("tachyons.css");
  eleventyConfig.addPassthroughCopy("banner.jpg");
};
