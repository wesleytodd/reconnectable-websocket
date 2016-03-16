'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultOptions = {
  debug: false,
  automaticOpen: true,
  reconnectOnError: false,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  timeoutInterval: 2000,
  maxReconnectAttempts: null,
  randomRatio: 3,
  binaryType: 'blob'
};

var ReconnectableWebSocket = function ReconnectableWebSocket(url) {
  var _this = this;

  var protocols = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
  (0, _classCallCheck3.default)(this, ReconnectableWebSocket);
  this.CONNECTING = 0;
  this.OPEN = 1;
  this.CLOSING = 2;
  this.CLOSED = 3;

  this.open = function () {
    var socket = _this._socket = new WebSocket(_this._url, _this._protocols);
    socket.binaryType = _this._options.binaryType;

    if (_this._options.maxReconnectAttempts && _this._options.maxReconnectAttempts < _this._reconnectAttempts) {
      return;
    }

    _this._syncState();

    socket.onmessage = _this._onmessage.bind(_this);
    socket.onopen = _this._onopen.bind(_this);
    socket.onclose = _this._onclose.bind(_this);
    socket.onerror = _this._onerror.bind(_this);
  };

  this.send = function (data) {
    if (_this._socket && _this._socket.readyState === WebSocket.OPEN && _this._messageQueue.length === 0) {
      _this._socket.send(data);
    } else {
      _this._messageQueue.push(data);
    }
  };

  this.close = function (code, reason) {
    if (typeof code === 'undefined') code = 1000;

    if (_this._socket) _this._socket.close(code, reason);
  };

  this._onmessage = function (message) {
    _this.onmessage && _this.onmessage(message);
  };

  this._onopen = function (event) {
    _this._syncState();
    _this._flushQueue();
    _this._reconnectAttempts = 0;

    _this.onopen && _this.onopen(event);

    if (_this._isReconnecting) {
      _this._isReconnecting = false;
      _this.onreconnect && _this.onreconnect();
    }
  };

  this._onclose = function (event) {
    _this._syncState();
    if (_this._options.debug) console.log('WebSocket: connection is broken', event);

    _this.onclose && _this.onclose(event);

    _this._tryReconnect(event);
  };

  this._onerror = function (event) {
    // To avoid undetermined state, we close socket on error
    _this._socket.close();
    _this.readyState = _this.CLOSED;

    if (_this._options.debug) console.error('WebSocket: error', event);

    _this.onerror && _this.onerror(event);

    if (_this._options.reconnectOnError) _this._tryReconnect(event);
  };

  this._tryReconnect = function (event) {
    _this._isReconnecting = true;
    setTimeout(function () {
      if (_this.readyState === _this.CLOSED) {
        _this._reconnectAttempts++;
        _this.open();
      }
    }, _this._getTimeout());
  };

  this._flushQueue = function () {
    while (_this._messageQueue.length !== 0) {
      var data = _this._messageQueue.shift();
      _this._send(data);
    }
  };

  this._getTimeout = function () {
    var timeout = _this._options.reconnectInterval * Math.pow(_this._options.reconnectDecay, _this._reconnectAttempts);
    timeout = timeout > _this._options.maxReconnectInterval ? _this._options.maxReconnectInterval : timeout;
    return _this._options.randomRatio ? getRandom(timeout / _this._options.randomRatio, timeout) : timeout;
  };

  this._syncState = function () {
    _this.readyState = _this._socket.readyState;
  };

  this._url = url;
  this._protocols = protocols;
  this._options = (0, _assign2.default)({}, defaultOptions, options);
  this._messageQueue = [];
  this._reconnectAttempts = 0;
  this._isReconnecting = false;
  this.readyState = this.CONNECTING;

  if (options.automaticOpen) this.open();
};

function getRandom(min, max) {
  return Math.random() * (max - min) + min;
}

exports.default = ReconnectableWebSocket;
module.exports = exports['default'];