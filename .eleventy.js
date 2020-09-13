module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("redom.js");
  eleventyConfig.addPassthroughCopy("sessionPickerApp.js");
};
