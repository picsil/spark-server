'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _PasswordHasher = require('../lib/PasswordHasher');

var _PasswordHasher2 = _interopRequireDefault(_PasswordHasher);

var _HttpError = require('../lib/HttpError');

var _HttpError2 = _interopRequireDefault(_HttpError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var UserDatabaseRepository = function UserDatabaseRepository(database) {
  var _this = this;

  (0, _classCallCheck3.default)(this, UserDatabaseRepository);

  this.createWithCredentials = function () {
    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(userCredentials) {
      var username, password, salt, passwordHash, modelToSave, user;
      return _regenerator2.default.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              username = userCredentials.username, password = userCredentials.password;
              _context.next = 3;
              return _PasswordHasher2.default.generateSalt();

            case 3:
              salt = _context.sent;
              _context.next = 6;
              return _PasswordHasher2.default.hash(password, salt);

            case 6:
              passwordHash = _context.sent;
              modelToSave = {
                accessTokens: [],
                created_at: new Date(),
                created_by: null,
                passwordHash: passwordHash,
                salt: salt,
                username: username
              };
              _context.next = 10;
              return _this._collection.insert(modelToSave, { fullResult: true });

            case 10:
              user = _context.sent[0];
              return _context.abrupt('return', (0, _extends3.default)({}, user, { id: user._id.toString() }));

            case 12:
            case 'end':
              return _context.stop();
          }
        }
      }, _callee, _this);
    }));

    return function (_x) {
      return _ref.apply(this, arguments);
    };
  }();

  this.deleteAccessToken = function () {
    var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(userID, accessToken) {
      return _regenerator2.default.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return _this._collection.findAndModify({ _id: userID }, null, { $pull: { accessTokens: { accessToken: accessToken } } }, { new: true });

            case 2:
              return _context2.abrupt('return', _context2.sent);

            case 3:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }));

    return function (_x2, _x3) {
      return _ref2.apply(this, arguments);
    };
  }();

  this.deleteById = function () {
    var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(id) {
      return _regenerator2.default.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return _this._collection.remove({ _id: id });

            case 2:
              return _context3.abrupt('return', _context3.sent);

            case 3:
            case 'end':
              return _context3.stop();
          }
        }
      }, _callee3, _this);
    }));

    return function (_x4) {
      return _ref3.apply(this, arguments);
    };
  }();

  this.getByAccessToken = function () {
    var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(accessToken) {
      var user;
      return _regenerator2.default.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.next = 2;
              return _this._collection.findOne({ 'accessTokens.accessToken': accessToken });

            case 2:
              user = _context4.sent;
              return _context4.abrupt('return', user ? (0, _extends3.default)({}, user, { id: user._id.toString() }) : null);

            case 4:
            case 'end':
              return _context4.stop();
          }
        }
      }, _callee4, _this);
    }));

    return function (_x5) {
      return _ref4.apply(this, arguments);
    };
  }();

  this.getByUsername = function () {
    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(username) {
      var user;
      return _regenerator2.default.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.next = 2;
              return _this._collection.findOne({ username: username });

            case 2:
              user = _context5.sent;
              return _context5.abrupt('return', user ? (0, _extends3.default)({}, user, { id: user._id.toString() }) : null);

            case 4:
            case 'end':
              return _context5.stop();
          }
        }
      }, _callee5, _this);
    }));

    return function (_x6) {
      return _ref5.apply(this, arguments);
    };
  }();

  this.isUserNameInUse = function () {
    var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(username) {
      return _regenerator2.default.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              _context6.next = 2;
              return _this.getByUsername(username);

            case 2:
              return _context6.abrupt('return', !!_context6.sent);

            case 3:
            case 'end':
              return _context6.stop();
          }
        }
      }, _callee6, _this);
    }));

    return function (_x7) {
      return _ref6.apply(this, arguments);
    };
  }();

  this.saveAccessToken = function () {
    var _ref7 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7(userID, tokenObject) {
      return _regenerator2.default.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              _context7.next = 2;
              return _this._collection.findAndModify({ _id: userID }, null, { $push: { accessTokens: tokenObject } }, { new: true });

            case 2:
              return _context7.abrupt('return', _context7.sent);

            case 3:
            case 'end':
              return _context7.stop();
          }
        }
      }, _callee7, _this);
    }));

    return function (_x8, _x9) {
      return _ref7.apply(this, arguments);
    };
  }();

  this.validateLogin = function () {
    var _ref8 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(username, password) {
      var user, hash;
      return _regenerator2.default.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.prev = 0;
              _context8.next = 3;
              return _this._collection.findOne({ username: username });

            case 3:
              user = _context8.sent;

              if (user) {
                _context8.next = 6;
                break;
              }

              throw new _HttpError2.default('User doesn\'t exist', 404);

            case 6:
              _context8.next = 8;
              return _PasswordHasher2.default.hash(password, user.salt);

            case 8:
              hash = _context8.sent;

              if (!(hash !== user.passwordHash)) {
                _context8.next = 11;
                break;
              }

              throw new _HttpError2.default('Wrong password');

            case 11:
              return _context8.abrupt('return', (0, _extends3.default)({}, user, { id: user._id.toString() }));

            case 14:
              _context8.prev = 14;
              _context8.t0 = _context8['catch'](0);
              throw _context8.t0;

            case 17:
            case 'end':
              return _context8.stop();
          }
        }
      }, _callee8, _this, [[0, 14]]);
    }));

    return function (_x10, _x11) {
      return _ref8.apply(this, arguments);
    };
  }();

  this._collection = database.getCollection('users');
};

exports.default = UserDatabaseRepository;