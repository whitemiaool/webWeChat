'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

const assert = require('assert');
const debug = require('./debug');
const File = require('fs');
const Path = require('path');
const Matcher = require('./matcher');
const jsStringEscape = require('js-string-escape');

function mkpathSync(pathname) {
  if (File.existsSync(pathname)) return;
  const parent = Path.dirname(pathname);
  if (File.existsSync(parent)) File.mkdirSync(pathname);else {
    mkpathSync(parent);
    File.mkdirSync(pathname);
  }
}

// Parse headers from headerLines.  Optional argument `only` is an array of
// regular expressions; only headers matching one of these expressions are
// parsed.  Returns a object with name/value pairs.
function parseHeaders(filename, headerLines) {
  let only = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  const headers = Object.create(null);
  for (let line of headerLines) {
    if (line === '') continue;

    var _line$match$slice = line.match(/^(.*?)\:\s+(.*)$/).slice(1);

    var _line$match$slice2 = _slicedToArray(_line$match$slice, 2);

    let name = _line$match$slice2[0];
    let value = _line$match$slice2[1];

    if (only && !match(name, only)) continue;

    const key = (name || '').toLowerCase();
    value = (value || '').trim().replace(/^"(.*)"$/, '$1');
    if (Array.isArray(headers[key])) headers[key].push(value);else if (headers[key]) headers[key] = [headers[key], value];else headers[key] = value;
  }
  return headers;
}

function parseRequest(filename, request, requestHeaders) {
  assert(request, `${ filename } missing request section`);

  var _request$split = request.split(/\n/);

  var _request$split2 = _toArray(_request$split);

  const methodAndPath = _request$split2[0];

  const headerLines = _request$split2.slice(1);

  let method;
  let path;
  let rawRegexp;
  let regexp;
  if (/\sREGEXP\s/.test(methodAndPath)) {
    var _methodAndPath$split = methodAndPath.split(' REGEXP ');

    var _methodAndPath$split2 = _slicedToArray(_methodAndPath$split, 2);

    method = _methodAndPath$split2[0];
    rawRegexp = _methodAndPath$split2[1];

    var _rawRegexp$match$slic = rawRegexp.match(/^\/(.+)\/(i|m|g)?$/).slice(1);

    var _rawRegexp$match$slic2 = _slicedToArray(_rawRegexp$match$slic, 2);

    const inRegexp = _rawRegexp$match$slic2[0];
    const flags = _rawRegexp$match$slic2[1];

    regexp = new RegExp(inRegexp, flags || '');
  } else {
    ;

    var _methodAndPath$split3 = methodAndPath.split(/\s/);

    var _methodAndPath$split4 = _slicedToArray(_methodAndPath$split3, 2);

    method = _methodAndPath$split4[0];
    path = _methodAndPath$split4[1];
  }assert(method && (path || regexp), `${ filename }: first line must be <method> <path>`);
  assert(/^[a-zA-Z]+$/.test(method), `${ filename }: method not valid`);
  const headers = parseHeaders(filename, headerLines, requestHeaders);
  const body = headers.body;
  delete headers.body;
  const url = path || regexp;
  return { url: url, method: method, headers: headers, body: body };
}

function parseResponse(filename, response, body) {
  if (response) {
    var _response$split = response.split(/\n/);

    var _response$split2 = _toArray(_response$split);

    const statusLine = _response$split2[0];

    const headerLines = _response$split2.slice(1);

    const newFormat = statusLine.match(/HTTP\/(\d\.\d)\s+(\d{3})\s*(.*)/);
    const version = newFormat[1];
    const statusCode = parseInt(newFormat[2], 10);
    const statusMessage = newFormat[3].trim();
    const headers = parseHeaders(filename, headerLines);
    const rawHeaders = headerLines.reduce(function (raw, header) {
      var _header$split = header.split(/:\s+/);

      var _header$split2 = _slicedToArray(_header$split, 2);

      const name = _header$split2[0];
      const value = _header$split2[1];

      raw.push(name);
      raw.push(value);
      return raw;
    }, []);
    return { statusCode: statusCode, statusMessage: statusMessage, version: version, headers: headers, rawHeaders: rawHeaders, body: body, trailers: {}, rawTrailers: [] };
  }
}

function readAndInitialParseFile(filename) {
  const buffer = File.readFileSync(filename);
  const parts = buffer.toString('utf8').split('\n\n');
  if (parts.length > 2) {
    const parts0 = new Buffer(parts[0], 'utf8');
    const parts1 = new Buffer(parts[1], 'utf8');
    const body = buffer.slice(parts0.length + parts1.length + 4);
    return [parts[0], parts[1], body];
  } else return [parts[0], parts[1], ''];
}

// Write headers to the File object.  Optional argument `only` is an array of
// regular expressions; only headers matching one of these expressions are
// written.
function writeHeaders(file, headers) {
  let only = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  for (let name in headers) {
    let value = headers[name];
    if (only && !match(name, only)) continue;
    if (Array.isArray(value)) for (let item of value) file.write(`${ name }: ${ item }\n`);else file.write(`${ name }: ${ value }\n`);
  }
}

// Returns true if header name matches one of the regular expressions.
function match(name, regexps) {
  for (let regexp of regexps) if (regexp.test(name)) return true;
  return false;
}

module.exports = class Catalog {

  constructor(settings) {
    this.settings = settings;
    // We use this to cache host/host:port mapped to array of matchers.
    this.matchers = {};
    this._basedir = Path.resolve('fixtures');
  }

  getFixturesDir() {
    return this._basedir;
  }

  setFixturesDir(dir) {
    this._basedir = Path.resolve(dir);
    this.matchers = {};
  }

  find(host) {
    // Return result from cache.
    const matchers = this.matchers[host];
    if (matchers) return matchers;

    // Start by looking for directory and loading each of the files.
    // Look for host-port (windows friendly) or host:port (legacy)
    let pathname = `${ this.getFixturesDir() }/${ host.replace(':', '-') }`;
    if (!File.existsSync(pathname)) pathname = `${ this.getFixturesDir() }/${ host }`;
    if (!File.existsSync(pathname)) return null;

    const newMatchers = this.matchers[host] || [];
    this.matchers[host] = newMatchers;

    const stat = File.statSync(pathname);
    if (stat.isDirectory()) {
      const files = File.readdirSync(pathname);
      for (let file of files) {
        let mapping = this._read(`${ pathname }/${ file }`);
        newMatchers.push(Matcher.fromMapping(host, mapping));
      }
    } else {
      const mapping = this._read(pathname);
      newMatchers.push(Matcher.fromMapping(host, mapping));
    }

    return newMatchers;
  }

  save(host, request, response, callback) {
    const matcher = Matcher.fromMapping(host, { request: request, response: response });
    const matchers = this.matchers[host] || [];
    matchers.push(matcher);
    const requestHeaders = this.settings.headers;

    const uid = `${ Date.now() }${ Math.floor(Math.random() * 100000) }`;
    const tmpfile = `${ this.getFixturesDir() }/node-replay.${ uid }`;
    const pathname = `${ this.getFixturesDir() }/${ host.replace(':', '-') }`;

    debug(`Creating ${ pathname }`);
    try {
      mkpathSync(pathname);
    } catch (error) {
      setImmediate(function () {
        callback(error);
      });
      return;
    }

    const filename = `${ pathname }/${ uid }`;
    try {
      const file = File.createWriteStream(tmpfile, { encoding: 'utf-8' });
      file.write(`${ request.method.toUpperCase() } ${ request.url.path || '/' }\n`);
      writeHeaders(file, request.headers, requestHeaders);
      if (request.body) {
        let body = '';
        for (let chunks of request.body) body += chunks[0];
        writeHeaders(file, { body: jsStringEscape(body) });
      }
      file.write('\n');
      // Response part
      file.write(`HTTP/${ response.version || '1.1' } ${ response.statusCode || 200 } ${ response.statusMessage }\n`);
      writeHeaders(file, response.headers);
      file.write('\n');
      for (let part of response.body) file.write(part[0], part[1]);
      file.end(function () {
        File.rename(tmpfile, filename, callback);
      });
    } catch (error) {
      callback(error);
    }
  }

  _read(filename) {
    var _readAndInitialParseF = readAndInitialParseFile(filename);

    var _readAndInitialParseF2 = _slicedToArray(_readAndInitialParseF, 3);

    const request = _readAndInitialParseF2[0];
    const response = _readAndInitialParseF2[1];
    const part = _readAndInitialParseF2[2];

    const body = [[part, undefined]];
    return {
      request: parseRequest(filename, request, this.settings.headers),
      response: parseResponse(filename, response, body)
    };
  }

};
//# sourceMappingURL=catalog.js.map
