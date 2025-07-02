import React, { useState } from 'react';
import { isSvg, isSvgUri, isBase64ImageContent } from "../../utils/imageUtils";
const EMPTY_STYLE = '{}';
function SvgImage(props) {
  const {
    data,
    style,
    ...other
  } = props;
  const styleObj = Object.assign({}, ...(style || []));
  const [svgStyleCss, setSvgStyleCss] = useState(EMPTY_STYLE);
  const [postCssStyleCalled, setPostCssStyleCalled] = useState(false);
  const createStyleSvgCss = async PostCssPackage => {
    setPostCssStyleCalled(true);
    const {
      postcss,
      cssjs
    } = PostCssPackage;
    postcss().process(styleObj, {
      parser: cssjs
    }).then(style => setSvgStyleCss(`{${style.css}}`));
  };
  if (isSvgUri(data)) {
    return <img {...other} src={data.uri} style={styleObj} />;
  } else if (isBase64ImageContent(data)) {
    return <img {...other} src={data} style={styleObj} />;
  } else if (data) {
    const PostCssPackage = require("../../optionalDependencies").PostCssPackage;
    if (PostCssPackage) {
      if (!postCssStyleCalled) {
        createStyleSvgCss(PostCssPackage);
        return null;
      }
      const svgStyleTag = `<style> svg ${svgStyleCss} </style>`;
      return <div {...other}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html: svgStyleTag + data
      }} />;
    }
  }
  return null;
}
SvgImage.displayName = 'IGNORE';
SvgImage.isSvg = isSvg;
export default SvgImage;