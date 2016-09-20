
import MarkdownIt from 'markdown-it';
import mdSpoiler from './md-spoiler';

const md = MarkdownIt({
  html: true,
  xhtmlOut: true,
  breaks: false,
  linkify: false
});

md.use(
  mdSpoiler.plugin,
  mdSpoiler.name,
  mdSpoiler.methods(md)
);

export default md;
