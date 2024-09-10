Object.defineProperty(exports, '__esModule', { value: true });
exports.Param = void 0;
class Param {
  options;
  #ros;
  #name;
  constructor(options) {
    this.options = options;
    this.#ros = options.ros;
    this.#name = options.name.replace(':', '.');
  }
  get(callback) {
    this.#ros.rosImpl?.getParameter(this.#name).then(callback);
  }
  set(value, callback, type) {
    this.#ros.rosImpl?.setParameter(this.#name, value, type).then(callback);
  }
}
exports.Param = Param;
//# sourceMappingURL=Param.js.map
