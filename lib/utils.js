
exports.getRandomBytes = getRandomBytes;
exports.getByte = getByte;
exports.encode64 = encode64;
exports.decode64 = decode64;
exports.char64 = char64;
exports.microtime = microtime;

var base64Code = [
  '.', '/', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K',
  'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
  'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k',
  'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x',
  'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
var index64 = [
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
  -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1,
  54, 55, 56, 57, 58, 59, 60, 61, 62, 63, -1, -1, -1, -1, -1, -1, -1,
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, -1, -1, -1, -1, -1, -1, 28, 29, 30, 31,
  32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
  49, 50, 51, 52, 53, -1, -1, -1, -1, -1];

function getRandomBytes(count) {
  var output = [];
  for (var i = 0; i < count; i++)
    output.push(Math.floor(Math.random() * 255));
  
  return output;
}

function getByte(c) {
  var b;
  
  try { b = c.charCodeAt(0); }
  catch (err) { b = c; }
  
  return (b > 127) ? -128 + (b % 128) : b;
}

function encode64(input, count) {
  var off = 0;
  var rs = [];
  var c1;
  var c2;
  if (count <= 0 || count > input.length)
    throw 'Invalid count';
  
  while (off < count) {
    c1 = input[off++] & 0xff;
    rs.push(base64Code[(c1 >> 2) & 0x3f]);
    c1 = (c1 & 0x03) << 4;
    if (off >= count) {
      rs.push(base64Code[c1 & 0x3f]);
      break;
    }
    c2 = input[off++] & 0xff;
    c1 |= (c2 >> 4) & 0x0f;
    rs.push(base64Code[c1 & 0x3f]);
    c1 = (c2 & 0x0f) << 2;
    if (off >= count) {
      rs.push(base64Code[c1 & 0x3f]);
      break;
    }
    c2 = input[off++] & 0xff;
    c1 |= (c2 >> 6) & 0x03;
    rs.push(base64Code[c1 & 0x3f]);
    rs.push(base64Code[c2 & 0x3f]);
  }
  
  return rs.join('');
}

function decode64(input, count) {
  var off = 0;
  var slen = input.length;
  var olen = 0;
  var rs = [];
  var c1, c2, c3, c4, o;
  
  if (count <= 0)
    throw 'Invalid count';
  
  while (off < slen - 1 && olen < count) {
    c1 = char64(input.charAt(off++));
    c2 = char64(input.charAt(off++));
    if (c1 == -1 || c2 == -1) {
      break;
    }
    o = getByte(c1 << 2);
    o |= (c2 & 0x30) >> 4;
    rs.push(String.fromCharCode(o));
    if (++olen >= count || off >= slen) {
      break;
    }
    c3 = char64(input.charAt(off++));
    if (c3 == -1) {
      break;
    }
    o = getByte((c2 & 0x0f) << 4);
    o |= (c3 & 0x3c) >> 2;
    rs.push(String.fromCharCode(o));
    if (++olen >= count || off >= slen) {
      break;
    }
    c4 = char64(input.charAt(off++));
    o = getByte((c3 & 0x03) << 6);
    o |= c4;
    rs.push(String.fromCharCode(o));
    ++olen;
  }
  
  var ret = [];
  for (off = 0; off < olen; off++) {
    ret.push(getByte(rs[off]));
  }
  return ret;
}

function char64(x) {
  var code = x.charCodeAt(0);
  if (code < 0 || code > index64.length)
    return -1;
  
  return index64[code];
}

function microtime(getAsFloat) {
  // http://kevin.vanzonneveld.net
  // +   original by: Paulo Freitas
  // *     example 1: timeStamp = microtime(true);
  // *     results 1: timeStamp > 1000000000 && timeStamp < 2000000000
  var now = new Date().getTime() / 1000;
  var s = parseInt(now, 10);
  
  return (getAsFloat) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
}
