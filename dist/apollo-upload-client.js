'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _classCallCheck = _interopDefault(require('babel-runtime/helpers/classCallCheck'));
var _Array$from = _interopDefault(require('babel-runtime/core-js/array/from'));
var _typeof = _interopDefault(require('babel-runtime/helpers/typeof'));
var _Object$keys = _interopDefault(require('babel-runtime/core-js/object/keys'));
var _extends = _interopDefault(require('babel-runtime/helpers/extends'));
var _JSON$stringify = _interopDefault(require('babel-runtime/core-js/json/stringify'));
var _possibleConstructorReturn = _interopDefault(require('babel-runtime/helpers/possibleConstructorReturn'));
var _inherits = _interopDefault(require('babel-runtime/helpers/inherits'));
var apolloClient = require('apollo-client');
var _objectWithoutProperties = _interopDefault(require('babel-runtime/helpers/objectWithoutProperties'));

/**
 * Extracts files and their positions within variables from an Apollo Client
 * request.
 * @see {@link http://dev.apollodata.com/core/apollo-client-api.html#Request}
 * @param {Object} request - Apollo GraphQL request to be sent to the server.
 * @param {Object} request.variables - GraphQL variables map.
 * @param {String} request.operationName - Name of the GraphQL query or mutation.
 * @returns {Object} - Request with files extracted to a list with their original object paths.
 */
function extractRequestFiles(request) {
  var files = [];

  // Recursively extracts files from an object tree
  function recurse(node) {
    var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

    // Iterate enumerable properties
    _Object$keys(node).forEach(function (key) {
      // Skip non-object
      if (_typeof(node[key]) !== 'object' || node[key] === null) return;

      // Check if the node is a file
      if (typeof File !== 'undefined' && node[key] instanceof File || node[key] instanceof ReactNativeFile || typeof Blob !== 'undefined' && node[key] instanceof Blob) {
        // Extract the file and it's original path in the GraphQL input
        // variables for later transport as a multipart form field.
        files.push({
          variablesPath: 'variables' + path + '.' + key,
          file: node[key]
        });

        // Delete the file from the request variables. It gets repopulated on
        // the server by apollo-upload-server middleware. If an array item it
        // must be deleted without reindexing the array.
        delete node[key];

        // No deeper recursion
        return;
      }

      // Convert file list to an array so recursion can reach the files
      if (typeof FileList !== 'undefined' && node[key] instanceof FileList) node[key] = _Array$from(node[key]);

      // Recurse into child node
      recurse(node[key], path + '.' + key);
    });
  }

  // Recurse request variables
  if (request.variables) recurse(request.variables);

  return { operation: request, files: files };
}

/**
 * A React Native file.
 */
var ReactNativeFile =
/**
 * A React Native FormData file object.
 * @see {@link https://github.com/facebook/react-native/blob/v0.45.1/Libraries/Network/FormData.js#L34}
 * @typedef {Object} ReactNativeFileObject
 * @property {String} uri - File system path.
 * @property {String} [type] - File content type.
 * @property {String} [name] - File name.
 */

/**
 * Constructs a new file.
 * @param {ReactNativeFileObject} file
 * @example
 * const file = new ReactNativeFile({
 *  uri: uriFromCameraRoll,
 *  type: 'image/jpeg',
 *  name: 'photo.jpg'
 * })
 */
function ReactNativeFile(_ref) {
  var uri = _ref.uri,
      type = _ref.type,
      name = _ref.name;

  _classCallCheck(this, ReactNativeFile);

  this.uri = uri;
  this.type = type;
  this.name = name;
};

ReactNativeFile.list = function (files) {
  return files.map(function (file) {
    return new ReactNativeFile(file);
  });
};

var UploadHTTPFetchNetworkInterface = function (_HTTPFetchNetworkInte) {
  _inherits(UploadHTTPFetchNetworkInterface, _HTTPFetchNetworkInte);

  function UploadHTTPFetchNetworkInterface() {
    _classCallCheck(this, UploadHTTPFetchNetworkInterface);

    return _possibleConstructorReturn(this, _HTTPFetchNetworkInte.apply(this, arguments));
  }

  UploadHTTPFetchNetworkInterface.prototype.fetchFromRemoteEndpoint = function fetchFromRemoteEndpoint(_ref) {
    var request = _ref.request,
        options = _ref.options;

    // Skip process if uploads are impossible
    if (typeof FormData !== 'undefined') {
      // Extract any files from the request
      var _extractRequestFiles = extractRequestFiles(request),
          operation = _extractRequestFiles.operation,
          files = _extractRequestFiles.files;

      // Only initiate a multipart form request if there are uploads


      if (files.length) {
        // Convert query AST to string for transport
        operation.query = apolloClient.printAST(operation.query);

        // Build the form
        var formData = new FormData();
        formData.append('operations', _JSON$stringify(operation));
        files.forEach(function (_ref2) {
          var variablesPath = _ref2.variablesPath,
              file = _ref2.file;

          formData.append(variablesPath, file, file.name);
        });

        // Send request
        return fetch(this._uri, _extends({
          method: 'POST',
          body: formData
        }, options));
      }
    }

    // Standard fetch method fallback
    return _HTTPFetchNetworkInte.prototype.fetchFromRemoteEndpoint.call(this, { request: request, options: options });
  };

  return UploadHTTPFetchNetworkInterface;
}(apolloClient.HTTPFetchNetworkInterface);

function createNetworkInterface(_ref3) {
  var uri = _ref3.uri,
      _ref3$opts = _ref3.opts,
      opts = _ref3$opts === undefined ? {} : _ref3$opts;

  return new UploadHTTPFetchNetworkInterface(uri, opts);
}

var UploadHTTPBatchedNetworkInterface = function (_HTTPBatchedNetworkIn) {
  _inherits(UploadHTTPBatchedNetworkInterface, _HTTPBatchedNetworkIn);

  function UploadHTTPBatchedNetworkInterface() {
    _classCallCheck(this, UploadHTTPBatchedNetworkInterface);

    return _possibleConstructorReturn(this, _HTTPBatchedNetworkIn.apply(this, arguments));
  }

  UploadHTTPBatchedNetworkInterface.prototype.batchedFetchFromRemoteEndpoint = function batchedFetchFromRemoteEndpoint(_ref) {
    var requests = _ref.requests,
        options = _ref.options;

    // Skip process if uploads are impossible
    if (typeof FormData !== 'undefined') {
      // Extract any files from the request
      var batchFiles = [];
      var batchOperations = requests.map(function (request, operationIndex) {
        var _extractRequestFiles = extractRequestFiles(request),
            operation = _extractRequestFiles.operation,
            files = _extractRequestFiles.files;

        if (files.length) {
          batchFiles.push({
            operationIndex: operationIndex,
            files: files
          });
        }
        return operation;
      });

      // Only initiate a multipart form request if there are uploads
      if (batchFiles.length) {
        // For each operation, convert query AST to string for transport
        batchOperations.forEach(function (operation) {
          operation.query = apolloClient.printAST(operation.query);
        });

        // Build the form
        var formData = new FormData();
        formData.append('operations', _JSON$stringify(batchOperations));
        batchFiles.forEach(function (_ref2) {
          var operationIndex = _ref2.operationIndex,
              files = _ref2.files;

          files.forEach(function (_ref3) {
            var variablesPath = _ref3.variablesPath,
                file = _ref3.file;
            return formData.append(operationIndex + '.' + variablesPath, file);
          });
        });

        // Send request
        return fetch(this._uri, _extends({
          method: 'POST',
          body: formData
        }, options));
      }
    }

    // Standard fetch method fallback
    return _HTTPBatchedNetworkIn.prototype.batchedFetchFromRemoteEndpoint.call(this, { requests: requests, options: options });
  };

  return UploadHTTPBatchedNetworkInterface;
}(apolloClient.HTTPBatchedNetworkInterface);

var createBatchingNetworkInterface = function createBatchingNetworkInterface(_ref4) {
  var _ref4$opts = _ref4.opts,
      fetchOpts = _ref4$opts === undefined ? {} : _ref4$opts,
      options = _objectWithoutProperties(_ref4, ['opts']);

  return new UploadHTTPBatchedNetworkInterface(_extends({ fetchOpts: fetchOpts }, options));
};

exports.extractRequestFiles = extractRequestFiles;
exports.ReactNativeFile = ReactNativeFile;
exports.UploadHTTPFetchNetworkInterface = UploadHTTPFetchNetworkInterface;
exports.createNetworkInterface = createNetworkInterface;
exports.UploadHTTPBatchedNetworkInterface = UploadHTTPBatchedNetworkInterface;
exports.createBatchingNetworkInterface = createBatchingNetworkInterface;
//# sourceMappingURL=apollo-upload-client.js.map
