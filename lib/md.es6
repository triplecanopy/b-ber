
import MarkdownIt from 'markdown-it';
import mdSpoiler from './md-directives/md-spoiler';

const md = new MarkdownIt({
  html: true,
  xhtmlOut: true,
  breaks: false,
  linkify: false,
});

md.use(
  mdSpoiler.plugin,
  mdSpoiler.name,
  mdSpoiler.methods(md)
);

export default md;
