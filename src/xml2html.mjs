// xml2html.mjs
// Time-stamp: "2019-04-25 17:14:40 queinnec"

import CodeGradX from '../codegradx.mjs';
import sax from '../src/sax.mjs';
/** Re-export the `CodeGradX` object */
export default CodeGradX;

/** Conversion of texts (stems, reports) from XML to HTML.
    This function may be modified to accommodate your own desires.
*/

CodeGradX.xml2html = function (s, options) {
  options = Object.assign({}, CodeGradX.xml2html.default, options);
  let result = '';
  //const mark, totalMark;
  let mode = 'default';
  let questionCounter = 0, sectionLevel = 0;
  // HTML tags to be left as they are:    
  const htmlTagsRegExp = new RegExp('^(p|pre|code|ul|ol|li|em|it|i|sub|sup|strong|b)$');
  // Tags to be converted into DIV:
  const divTagsRegExp = new RegExp('^(warning|error|introduction|conclusion|normal|stem|report)$');
  // Tags to be converted into SPAN:
  const spanTagsRegExp = new RegExp("^(user|machine|lineNumber)$");
  // Tags with special hack:
  const specialTagRegExp = new RegExp("^(img|a)$");
  // Tags to be ignored:
  const ignoreTagsRegExp = new RegExp("^(FW4EX|expectations|title|fw4ex)$");
  function convertAttributes (attributes) {
      let s = '';
      for ( let name of Object.keys(attributes) ) {
          let value = attributes[name];
          s += ' ' + name + '="' + value + '"';
      }
      return s;
  }
  const parser = sax.parser(true, {
    //trim: true
  });
  parser.onerror = function (e) {
      throw e;
  };
  const special = {
      "'": "&apos;",
      '"': "&quot;",
      '<': "&lt;",
      '>': "&gt;",
      '&': "&amp;"
  };
  function htmlencode (text) {
      let htmltext = '';
      const letters = text.split('');
      for ( let i=0 ; i<letters.length ; i++ ) {
          const ch = letters[i];
          if ( special[ch] ) {
              htmltext += special[ch];
          } else {
              htmltext += ch;
          }
      }
      return htmltext;
  }
  parser.ontext= function (text) {
      if ( ! mode.match(/ignore/) ) {
          let htmltext = '';
          const letters = text.split('');
          for ( let i=0 ; i<letters.length ; i++ ) {
              const ch = letters[i];
              if ( special[ch] ) {
                  htmltext += special[ch];
              } else {
                  htmltext += ch;
              }
          }
          result += htmltext;
      }
  };
  function absolutize (node) {
      if ( options.exercise ) {
          const pathRegExp = new RegExp('^(./)?(path/.*)$');
          if ( node.attributes.src ) {
              let matches = node.attributes.src.match(pathRegExp);
              if ( matches ) {
                  node.attributes.src = options.exercise.server +
                      '/exercisecontent/' +
                      options.exercise.safecookie +
                      '/' +
                      matches[2];
              }
          }
          if ( node.attributes.href ) {
              let matches = node.attributes.href.match(pathRegExp);
              if ( matches ) {
                  node.attributes.href = options.exercise.server +
                      '/exercisecontent/' +
                      options.exercise.safecookie +
                      '/' +
                      matches[2];
              }
          }
      }
      const tagname = node.name;
      const attributes = convertAttributes(node.attributes);
      return '<' + tagname + attributes + ' />';
  }
  parser.onopentag = function (node) {
      const tagname = node.name;
      const attributes = convertAttributes(node.attributes);
      if ( tagname.match(ignoreTagsRegExp) ) {
        mode = 'ignore';
      } else if ( tagname.match(htmlTagsRegExp) ) {
        result += '<' + tagname + attributes + '>';
      } else if ( tagname.match(specialTagRegExp) ) {
        result += absolutize(node);
      } else if ( tagname.match(spanTagsRegExp) ) {
        result += '<span class="fw4ex_' + tagname + '"' + attributes + '>';
      } else if ( tagname.match(divTagsRegExp) ) {
        result += '<div class="fw4ex_' + tagname + '"' + attributes + '>';
      } else if ( tagname.match(/^mark$/) ) {
        const markOrig = CodeGradX._str2num(node.attributes.value);
        const mark =  options.markFactor * 
              CodeGradX._str2num2decimals(markOrig);
        result += '<span' + attributes + ' class="fw4ex_mark">' + 
              mark + '<!-- ' + markOrig;
      } else if ( tagname.match(/^section$/) ) {
        result += '<div' + attributes + ' class="fw4ex_section' +
          (++sectionLevel) + '">';
      } else if ( tagname.match(/^question$/) ) {
        const qname = node.attributes.name;
        const title = node.attributes.title || '';
        result += '<div' + attributes + ' class="fw4ex_question">';
        result += '<div class="fw4ex_question_title" data_counter="' +
           (++questionCounter) + '">' + qname + ": " +
            title + '</div>';
      } else {
        result += '<div class="fw4ex_' + tagname + '"' + attributes + '>';
      }
  };
  parser.onclosetag = function (tagname) {
      if ( tagname.match(ignoreTagsRegExp) ) {
        mode = 'default';
      } else if ( tagname.match(htmlTagsRegExp) ) {
        result += '</' + tagname + '>';
      } else if ( tagname.match(specialTagRegExp) ) {
        /* result = result; */
      } else if ( tagname.match(spanTagsRegExp) ) {
        result += '</span>';
      } else if ( tagname.match(divTagsRegExp) ) {
        result += '</div>';
      } else if ( tagname.match(/^mark$/) ) {
        result += ' --></span>';
      } else if ( tagname.match(/^section$/) ) {
        --sectionLevel;
        result += '</div>';
      } else if ( tagname.match(/^question$/) ) {
        result += '</div>';
      } else {
        result += '</div>';
      }
  };
  parser.oncomment = function (text) {
    if ( ! mode.match(/ignore/) ) {
      result += '<!-- ' + text + ' -->';
    }
  };
  parser.oncdata = function (text) {
    if ( ! mode.match(/ignore/) ) {
        result += '<pre>' + htmlencode(text);
    }
  };
  parser.cdata = function (text) {
    if ( ! mode.match(/ignore/) ) {
        result += htmlencode(text);
    }
  };
  parser.onclosecdata = function () {
    if ( ! mode.match(/ignore/) ) {
        result += '</pre>';
    }
  };
  parser.write(s).close();
  if ( questionCounter <= 1 ) {
      // If only one question, remove its title:
      let questionTitleRegExp = new RegExp(
          '<div class=.fw4ex_question_title. [^>]*>.*?</div>');
      result = result.replace(questionTitleRegExp, '');
  }
  return Promise.resolve(result);
};
CodeGradX.xml2html.default = {
  markFactor:  100
};

// end of xml2html.js
