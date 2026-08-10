#!/usr/bin/env node
import { createRequire } from 'module';const require = createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ajv/dist/compile/codegen/code.js
var require_code = __commonJS({
  "node_modules/ajv/dist/compile/codegen/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.regexpCode = exports.getEsmExportName = exports.getProperty = exports.safeStringify = exports.stringify = exports.strConcat = exports.addCodeArg = exports.str = exports._ = exports.nil = exports._Code = exports.Name = exports.IDENTIFIER = exports._CodeOrName = void 0;
    var _CodeOrName = class {
    };
    exports._CodeOrName = _CodeOrName;
    exports.IDENTIFIER = /^[a-z$_][a-z$_0-9]*$/i;
    var Name = class extends _CodeOrName {
      constructor(s) {
        super();
        if (!exports.IDENTIFIER.test(s))
          throw new Error("CodeGen: name must be a valid identifier");
        this.str = s;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        return false;
      }
      get names() {
        return { [this.str]: 1 };
      }
    };
    exports.Name = Name;
    var _Code = class extends _CodeOrName {
      constructor(code) {
        super();
        this._items = typeof code === "string" ? [code] : code;
      }
      toString() {
        return this.str;
      }
      emptyStr() {
        if (this._items.length > 1)
          return false;
        const item = this._items[0];
        return item === "" || item === '""';
      }
      get str() {
        var _a3;
        return (_a3 = this._str) !== null && _a3 !== void 0 ? _a3 : this._str = this._items.reduce((s, c) => `${s}${c}`, "");
      }
      get names() {
        var _a3;
        return (_a3 = this._names) !== null && _a3 !== void 0 ? _a3 : this._names = this._items.reduce((names, c) => {
          if (c instanceof Name)
            names[c.str] = (names[c.str] || 0) + 1;
          return names;
        }, {});
      }
    };
    exports._Code = _Code;
    exports.nil = new _Code("");
    function _(strs, ...args) {
      const code = [strs[0]];
      let i = 0;
      while (i < args.length) {
        addCodeArg(code, args[i]);
        code.push(strs[++i]);
      }
      return new _Code(code);
    }
    exports._ = _;
    var plus = new _Code("+");
    function str(strs, ...args) {
      const expr = [safeStringify(strs[0])];
      let i = 0;
      while (i < args.length) {
        expr.push(plus);
        addCodeArg(expr, args[i]);
        expr.push(plus, safeStringify(strs[++i]));
      }
      optimize2(expr);
      return new _Code(expr);
    }
    exports.str = str;
    function addCodeArg(code, arg) {
      if (arg instanceof _Code)
        code.push(...arg._items);
      else if (arg instanceof Name)
        code.push(arg);
      else
        code.push(interpolate(arg));
    }
    exports.addCodeArg = addCodeArg;
    function optimize2(expr) {
      let i = 1;
      while (i < expr.length - 1) {
        if (expr[i] === plus) {
          const res = mergeExprItems(expr[i - 1], expr[i + 1]);
          if (res !== void 0) {
            expr.splice(i - 1, 3, res);
            continue;
          }
          expr[i++] = "+";
        }
        i++;
      }
    }
    function mergeExprItems(a, b) {
      if (b === '""')
        return a;
      if (a === '""')
        return b;
      if (typeof a == "string") {
        if (b instanceof Name || a[a.length - 1] !== '"')
          return;
        if (typeof b != "string")
          return `${a.slice(0, -1)}${b}"`;
        if (b[0] === '"')
          return a.slice(0, -1) + b.slice(1);
        return;
      }
      if (typeof b == "string" && b[0] === '"' && !(a instanceof Name))
        return `"${a}${b.slice(1)}`;
      return;
    }
    function strConcat(c1, c2) {
      return c2.emptyStr() ? c1 : c1.emptyStr() ? c2 : str`${c1}${c2}`;
    }
    exports.strConcat = strConcat;
    function interpolate(x) {
      return typeof x == "number" || typeof x == "boolean" || x === null ? x : safeStringify(Array.isArray(x) ? x.join(",") : x);
    }
    function stringify(x) {
      return new _Code(safeStringify(x));
    }
    exports.stringify = stringify;
    function safeStringify(x) {
      return JSON.stringify(x).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
    }
    exports.safeStringify = safeStringify;
    function getProperty(key2) {
      return typeof key2 == "string" && exports.IDENTIFIER.test(key2) ? new _Code(`.${key2}`) : _`[${key2}]`;
    }
    exports.getProperty = getProperty;
    function getEsmExportName(key2) {
      if (typeof key2 == "string" && exports.IDENTIFIER.test(key2)) {
        return new _Code(`${key2}`);
      }
      throw new Error(`CodeGen: invalid export name: ${key2}, use explicit $id name mapping`);
    }
    exports.getEsmExportName = getEsmExportName;
    function regexpCode(rx) {
      return new _Code(rx.toString());
    }
    exports.regexpCode = regexpCode;
  }
});

// node_modules/ajv/dist/compile/codegen/scope.js
var require_scope = __commonJS({
  "node_modules/ajv/dist/compile/codegen/scope.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ValueScope = exports.ValueScopeName = exports.Scope = exports.varKinds = exports.UsedValueState = void 0;
    var code_1 = require_code();
    var ValueError = class extends Error {
      constructor(name) {
        super(`CodeGen: "code" for ${name} not defined`);
        this.value = name.value;
      }
    };
    var UsedValueState;
    (function(UsedValueState2) {
      UsedValueState2[UsedValueState2["Started"] = 0] = "Started";
      UsedValueState2[UsedValueState2["Completed"] = 1] = "Completed";
    })(UsedValueState || (exports.UsedValueState = UsedValueState = {}));
    exports.varKinds = {
      const: new code_1.Name("const"),
      let: new code_1.Name("let"),
      var: new code_1.Name("var")
    };
    var Scope = class {
      constructor({ prefixes, parent } = {}) {
        this._names = {};
        this._prefixes = prefixes;
        this._parent = parent;
      }
      toName(nameOrPrefix) {
        return nameOrPrefix instanceof code_1.Name ? nameOrPrefix : this.name(nameOrPrefix);
      }
      name(prefix) {
        return new code_1.Name(this._newName(prefix));
      }
      _newName(prefix) {
        const ng = this._names[prefix] || this._nameGroup(prefix);
        return `${prefix}${ng.index++}`;
      }
      _nameGroup(prefix) {
        var _a3, _b;
        if (((_b = (_a3 = this._parent) === null || _a3 === void 0 ? void 0 : _a3._prefixes) === null || _b === void 0 ? void 0 : _b.has(prefix)) || this._prefixes && !this._prefixes.has(prefix)) {
          throw new Error(`CodeGen: prefix "${prefix}" is not allowed in this scope`);
        }
        return this._names[prefix] = { prefix, index: 0 };
      }
    };
    exports.Scope = Scope;
    var ValueScopeName = class extends code_1.Name {
      constructor(prefix, nameStr) {
        super(nameStr);
        this.prefix = prefix;
      }
      setValue(value, { property, itemIndex }) {
        this.value = value;
        this.scopePath = (0, code_1._)`.${new code_1.Name(property)}[${itemIndex}]`;
      }
    };
    exports.ValueScopeName = ValueScopeName;
    var line = (0, code_1._)`\n`;
    var ValueScope = class extends Scope {
      constructor(opts) {
        super(opts);
        this._values = {};
        this._scope = opts.scope;
        this.opts = { ...opts, _n: opts.lines ? line : code_1.nil };
      }
      get() {
        return this._scope;
      }
      name(prefix) {
        return new ValueScopeName(prefix, this._newName(prefix));
      }
      value(nameOrPrefix, value) {
        var _a3;
        if (value.ref === void 0)
          throw new Error("CodeGen: ref must be passed in value");
        const name = this.toName(nameOrPrefix);
        const { prefix } = name;
        const valueKey = (_a3 = value.key) !== null && _a3 !== void 0 ? _a3 : value.ref;
        let vs = this._values[prefix];
        if (vs) {
          const _name = vs.get(valueKey);
          if (_name)
            return _name;
        } else {
          vs = this._values[prefix] = /* @__PURE__ */ new Map();
        }
        vs.set(valueKey, name);
        const s = this._scope[prefix] || (this._scope[prefix] = []);
        const itemIndex = s.length;
        s[itemIndex] = value.ref;
        name.setValue(value, { property: prefix, itemIndex });
        return name;
      }
      getValue(prefix, keyOrRef) {
        const vs = this._values[prefix];
        if (!vs)
          return;
        return vs.get(keyOrRef);
      }
      scopeRefs(scopeName, values = this._values) {
        return this._reduceValues(values, (name) => {
          if (name.scopePath === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return (0, code_1._)`${scopeName}${name.scopePath}`;
        });
      }
      scopeCode(values = this._values, usedValues, getCode) {
        return this._reduceValues(values, (name) => {
          if (name.value === void 0)
            throw new Error(`CodeGen: name "${name}" has no value`);
          return name.value.code;
        }, usedValues, getCode);
      }
      _reduceValues(values, valueCode, usedValues = {}, getCode) {
        let code = code_1.nil;
        for (const prefix in values) {
          const vs = values[prefix];
          if (!vs)
            continue;
          const nameSet = usedValues[prefix] = usedValues[prefix] || /* @__PURE__ */ new Map();
          vs.forEach((name) => {
            if (nameSet.has(name))
              return;
            nameSet.set(name, UsedValueState.Started);
            let c = valueCode(name);
            if (c) {
              const def = this.opts.es5 ? exports.varKinds.var : exports.varKinds.const;
              code = (0, code_1._)`${code}${def} ${name} = ${c};${this.opts._n}`;
            } else if (c = getCode === null || getCode === void 0 ? void 0 : getCode(name)) {
              code = (0, code_1._)`${code}${c}${this.opts._n}`;
            } else {
              throw new ValueError(name);
            }
            nameSet.set(name, UsedValueState.Completed);
          });
        }
        return code;
      }
    };
    exports.ValueScope = ValueScope;
  }
});

// node_modules/ajv/dist/compile/codegen/index.js
var require_codegen = __commonJS({
  "node_modules/ajv/dist/compile/codegen/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.or = exports.and = exports.not = exports.CodeGen = exports.operators = exports.varKinds = exports.ValueScopeName = exports.ValueScope = exports.Scope = exports.Name = exports.regexpCode = exports.stringify = exports.getProperty = exports.nil = exports.strConcat = exports.str = exports._ = void 0;
    var code_1 = require_code();
    var scope_1 = require_scope();
    var code_2 = require_code();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return code_2._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return code_2.str;
    } });
    Object.defineProperty(exports, "strConcat", { enumerable: true, get: function() {
      return code_2.strConcat;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return code_2.nil;
    } });
    Object.defineProperty(exports, "getProperty", { enumerable: true, get: function() {
      return code_2.getProperty;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return code_2.stringify;
    } });
    Object.defineProperty(exports, "regexpCode", { enumerable: true, get: function() {
      return code_2.regexpCode;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return code_2.Name;
    } });
    var scope_2 = require_scope();
    Object.defineProperty(exports, "Scope", { enumerable: true, get: function() {
      return scope_2.Scope;
    } });
    Object.defineProperty(exports, "ValueScope", { enumerable: true, get: function() {
      return scope_2.ValueScope;
    } });
    Object.defineProperty(exports, "ValueScopeName", { enumerable: true, get: function() {
      return scope_2.ValueScopeName;
    } });
    Object.defineProperty(exports, "varKinds", { enumerable: true, get: function() {
      return scope_2.varKinds;
    } });
    exports.operators = {
      GT: new code_1._Code(">"),
      GTE: new code_1._Code(">="),
      LT: new code_1._Code("<"),
      LTE: new code_1._Code("<="),
      EQ: new code_1._Code("==="),
      NEQ: new code_1._Code("!=="),
      NOT: new code_1._Code("!"),
      OR: new code_1._Code("||"),
      AND: new code_1._Code("&&"),
      ADD: new code_1._Code("+")
    };
    var Node = class {
      optimizeNodes() {
        return this;
      }
      optimizeNames(_names, _constants) {
        return this;
      }
    };
    var Def = class extends Node {
      constructor(varKind, name, rhs) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.rhs = rhs;
      }
      render({ es5, _n }) {
        const varKind = es5 ? scope_1.varKinds.var : this.varKind;
        const rhs = this.rhs === void 0 ? "" : ` = ${this.rhs}`;
        return `${varKind} ${this.name}${rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (!names[this.name.str])
          return;
        if (this.rhs)
          this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        return this.rhs instanceof code_1._CodeOrName ? this.rhs.names : {};
      }
    };
    var Assign = class extends Node {
      constructor(lhs, rhs, sideEffects) {
        super();
        this.lhs = lhs;
        this.rhs = rhs;
        this.sideEffects = sideEffects;
      }
      render({ _n }) {
        return `${this.lhs} = ${this.rhs};` + _n;
      }
      optimizeNames(names, constants) {
        if (this.lhs instanceof code_1.Name && !names[this.lhs.str] && !this.sideEffects)
          return;
        this.rhs = optimizeExpr(this.rhs, names, constants);
        return this;
      }
      get names() {
        const names = this.lhs instanceof code_1.Name ? {} : { ...this.lhs.names };
        return addExprNames(names, this.rhs);
      }
    };
    var AssignOp = class extends Assign {
      constructor(lhs, op, rhs, sideEffects) {
        super(lhs, rhs, sideEffects);
        this.op = op;
      }
      render({ _n }) {
        return `${this.lhs} ${this.op}= ${this.rhs};` + _n;
      }
    };
    var Label = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        return `${this.label}:` + _n;
      }
    };
    var Break = class extends Node {
      constructor(label) {
        super();
        this.label = label;
        this.names = {};
      }
      render({ _n }) {
        const label = this.label ? ` ${this.label}` : "";
        return `break${label};` + _n;
      }
    };
    var Throw = class extends Node {
      constructor(error2) {
        super();
        this.error = error2;
      }
      render({ _n }) {
        return `throw ${this.error};` + _n;
      }
      get names() {
        return this.error.names;
      }
    };
    var AnyCode = class extends Node {
      constructor(code) {
        super();
        this.code = code;
      }
      render({ _n }) {
        return `${this.code};` + _n;
      }
      optimizeNodes() {
        return `${this.code}` ? this : void 0;
      }
      optimizeNames(names, constants) {
        this.code = optimizeExpr(this.code, names, constants);
        return this;
      }
      get names() {
        return this.code instanceof code_1._CodeOrName ? this.code.names : {};
      }
    };
    var ParentNode = class extends Node {
      constructor(nodes = []) {
        super();
        this.nodes = nodes;
      }
      render(opts) {
        return this.nodes.reduce((code, n) => code + n.render(opts), "");
      }
      optimizeNodes() {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i].optimizeNodes();
          if (Array.isArray(n))
            nodes.splice(i, 1, ...n);
          else if (n)
            nodes[i] = n;
          else
            nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      optimizeNames(names, constants) {
        const { nodes } = this;
        let i = nodes.length;
        while (i--) {
          const n = nodes[i];
          if (n.optimizeNames(names, constants))
            continue;
          subtractNames(names, n.names);
          nodes.splice(i, 1);
        }
        return nodes.length > 0 ? this : void 0;
      }
      get names() {
        return this.nodes.reduce((names, n) => addNames(names, n.names), {});
      }
    };
    var BlockNode = class extends ParentNode {
      render(opts) {
        return "{" + opts._n + super.render(opts) + "}" + opts._n;
      }
    };
    var Root = class extends ParentNode {
    };
    var Else = class extends BlockNode {
    };
    Else.kind = "else";
    var If = class _If extends BlockNode {
      constructor(condition, nodes) {
        super(nodes);
        this.condition = condition;
      }
      render(opts) {
        let code = `if(${this.condition})` + super.render(opts);
        if (this.else)
          code += "else " + this.else.render(opts);
        return code;
      }
      optimizeNodes() {
        super.optimizeNodes();
        const cond = this.condition;
        if (cond === true)
          return this.nodes;
        let e = this.else;
        if (e) {
          const ns = e.optimizeNodes();
          e = this.else = Array.isArray(ns) ? new Else(ns) : ns;
        }
        if (e) {
          if (cond === false)
            return e instanceof _If ? e : e.nodes;
          if (this.nodes.length)
            return this;
          return new _If(not(cond), e instanceof _If ? [e] : e.nodes);
        }
        if (cond === false || !this.nodes.length)
          return void 0;
        return this;
      }
      optimizeNames(names, constants) {
        var _a3;
        this.else = (_a3 = this.else) === null || _a3 === void 0 ? void 0 : _a3.optimizeNames(names, constants);
        if (!(super.optimizeNames(names, constants) || this.else))
          return;
        this.condition = optimizeExpr(this.condition, names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        addExprNames(names, this.condition);
        if (this.else)
          addNames(names, this.else.names);
        return names;
      }
    };
    If.kind = "if";
    var For = class extends BlockNode {
    };
    For.kind = "for";
    var ForLoop = class extends For {
      constructor(iteration) {
        super();
        this.iteration = iteration;
      }
      render(opts) {
        return `for(${this.iteration})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iteration = optimizeExpr(this.iteration, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iteration.names);
      }
    };
    var ForRange = class extends For {
      constructor(varKind, name, from, to) {
        super();
        this.varKind = varKind;
        this.name = name;
        this.from = from;
        this.to = to;
      }
      render(opts) {
        const varKind = opts.es5 ? scope_1.varKinds.var : this.varKind;
        const { name, from, to } = this;
        return `for(${varKind} ${name}=${from}; ${name}<${to}; ${name}++)` + super.render(opts);
      }
      get names() {
        const names = addExprNames(super.names, this.from);
        return addExprNames(names, this.to);
      }
    };
    var ForIter = class extends For {
      constructor(loop, varKind, name, iterable) {
        super();
        this.loop = loop;
        this.varKind = varKind;
        this.name = name;
        this.iterable = iterable;
      }
      render(opts) {
        return `for(${this.varKind} ${this.name} ${this.loop} ${this.iterable})` + super.render(opts);
      }
      optimizeNames(names, constants) {
        if (!super.optimizeNames(names, constants))
          return;
        this.iterable = optimizeExpr(this.iterable, names, constants);
        return this;
      }
      get names() {
        return addNames(super.names, this.iterable.names);
      }
    };
    var Func = class extends BlockNode {
      constructor(name, args, async) {
        super();
        this.name = name;
        this.args = args;
        this.async = async;
      }
      render(opts) {
        const _async = this.async ? "async " : "";
        return `${_async}function ${this.name}(${this.args})` + super.render(opts);
      }
    };
    Func.kind = "func";
    var Return = class extends ParentNode {
      render(opts) {
        return "return " + super.render(opts);
      }
    };
    Return.kind = "return";
    var Try = class extends BlockNode {
      render(opts) {
        let code = "try" + super.render(opts);
        if (this.catch)
          code += this.catch.render(opts);
        if (this.finally)
          code += this.finally.render(opts);
        return code;
      }
      optimizeNodes() {
        var _a3, _b;
        super.optimizeNodes();
        (_a3 = this.catch) === null || _a3 === void 0 ? void 0 : _a3.optimizeNodes();
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNodes();
        return this;
      }
      optimizeNames(names, constants) {
        var _a3, _b;
        super.optimizeNames(names, constants);
        (_a3 = this.catch) === null || _a3 === void 0 ? void 0 : _a3.optimizeNames(names, constants);
        (_b = this.finally) === null || _b === void 0 ? void 0 : _b.optimizeNames(names, constants);
        return this;
      }
      get names() {
        const names = super.names;
        if (this.catch)
          addNames(names, this.catch.names);
        if (this.finally)
          addNames(names, this.finally.names);
        return names;
      }
    };
    var Catch = class extends BlockNode {
      constructor(error2) {
        super();
        this.error = error2;
      }
      render(opts) {
        return `catch(${this.error})` + super.render(opts);
      }
    };
    Catch.kind = "catch";
    var Finally = class extends BlockNode {
      render(opts) {
        return "finally" + super.render(opts);
      }
    };
    Finally.kind = "finally";
    var CodeGen = class {
      constructor(extScope, opts = {}) {
        this._values = {};
        this._blockStarts = [];
        this._constants = {};
        this.opts = { ...opts, _n: opts.lines ? "\n" : "" };
        this._extScope = extScope;
        this._scope = new scope_1.Scope({ parent: extScope });
        this._nodes = [new Root()];
      }
      toString() {
        return this._root.render(this.opts);
      }
      // returns unique name in the internal scope
      name(prefix) {
        return this._scope.name(prefix);
      }
      // reserves unique name in the external scope
      scopeName(prefix) {
        return this._extScope.name(prefix);
      }
      // reserves unique name in the external scope and assigns value to it
      scopeValue(prefixOrName, value) {
        const name = this._extScope.value(prefixOrName, value);
        const vs = this._values[name.prefix] || (this._values[name.prefix] = /* @__PURE__ */ new Set());
        vs.add(name);
        return name;
      }
      getScopeValue(prefix, keyOrRef) {
        return this._extScope.getValue(prefix, keyOrRef);
      }
      // return code that assigns values in the external scope to the names that are used internally
      // (same names that were returned by gen.scopeName or gen.scopeValue)
      scopeRefs(scopeName) {
        return this._extScope.scopeRefs(scopeName, this._values);
      }
      scopeCode() {
        return this._extScope.scopeCode(this._values);
      }
      _def(varKind, nameOrPrefix, rhs, constant) {
        const name = this._scope.toName(nameOrPrefix);
        if (rhs !== void 0 && constant)
          this._constants[name.str] = rhs;
        this._leafNode(new Def(varKind, name, rhs));
        return name;
      }
      // `const` declaration (`var` in es5 mode)
      const(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.const, nameOrPrefix, rhs, _constant);
      }
      // `let` declaration with optional assignment (`var` in es5 mode)
      let(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.let, nameOrPrefix, rhs, _constant);
      }
      // `var` declaration with optional assignment
      var(nameOrPrefix, rhs, _constant) {
        return this._def(scope_1.varKinds.var, nameOrPrefix, rhs, _constant);
      }
      // assignment code
      assign(lhs, rhs, sideEffects) {
        return this._leafNode(new Assign(lhs, rhs, sideEffects));
      }
      // `+=` code
      add(lhs, rhs) {
        return this._leafNode(new AssignOp(lhs, exports.operators.ADD, rhs));
      }
      // appends passed SafeExpr to code or executes Block
      code(c) {
        if (typeof c == "function")
          c();
        else if (c !== code_1.nil)
          this._leafNode(new AnyCode(c));
        return this;
      }
      // returns code for object literal for the passed argument list of key-value pairs
      object(...keyValues) {
        const code = ["{"];
        for (const [key2, value] of keyValues) {
          if (code.length > 1)
            code.push(",");
          code.push(key2);
          if (key2 !== value || this.opts.es5) {
            code.push(":");
            (0, code_1.addCodeArg)(code, value);
          }
        }
        code.push("}");
        return new code_1._Code(code);
      }
      // `if` clause (or statement if `thenBody` and, optionally, `elseBody` are passed)
      if(condition, thenBody, elseBody) {
        this._blockNode(new If(condition));
        if (thenBody && elseBody) {
          this.code(thenBody).else().code(elseBody).endIf();
        } else if (thenBody) {
          this.code(thenBody).endIf();
        } else if (elseBody) {
          throw new Error('CodeGen: "else" body without "then" body');
        }
        return this;
      }
      // `else if` clause - invalid without `if` or after `else` clauses
      elseIf(condition) {
        return this._elseNode(new If(condition));
      }
      // `else` clause - only valid after `if` or `else if` clauses
      else() {
        return this._elseNode(new Else());
      }
      // end `if` statement (needed if gen.if was used only with condition)
      endIf() {
        return this._endBlockNode(If, Else);
      }
      _for(node, forBody) {
        this._blockNode(node);
        if (forBody)
          this.code(forBody).endFor();
        return this;
      }
      // a generic `for` clause (or statement if `forBody` is passed)
      for(iteration, forBody) {
        return this._for(new ForLoop(iteration), forBody);
      }
      // `for` statement for a range of values
      forRange(nameOrPrefix, from, to, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.let) {
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForRange(varKind, name, from, to), () => forBody(name));
      }
      // `for-of` statement (in es5 mode replace with a normal for loop)
      forOf(nameOrPrefix, iterable, forBody, varKind = scope_1.varKinds.const) {
        const name = this._scope.toName(nameOrPrefix);
        if (this.opts.es5) {
          const arr = iterable instanceof code_1.Name ? iterable : this.var("_arr", iterable);
          return this.forRange("_i", 0, (0, code_1._)`${arr}.length`, (i) => {
            this.var(name, (0, code_1._)`${arr}[${i}]`);
            forBody(name);
          });
        }
        return this._for(new ForIter("of", varKind, name, iterable), () => forBody(name));
      }
      // `for-in` statement.
      // With option `ownProperties` replaced with a `for-of` loop for object keys
      forIn(nameOrPrefix, obj, forBody, varKind = this.opts.es5 ? scope_1.varKinds.var : scope_1.varKinds.const) {
        if (this.opts.ownProperties) {
          return this.forOf(nameOrPrefix, (0, code_1._)`Object.keys(${obj})`, forBody);
        }
        const name = this._scope.toName(nameOrPrefix);
        return this._for(new ForIter("in", varKind, name, obj), () => forBody(name));
      }
      // end `for` loop
      endFor() {
        return this._endBlockNode(For);
      }
      // `label` statement
      label(label) {
        return this._leafNode(new Label(label));
      }
      // `break` statement
      break(label) {
        return this._leafNode(new Break(label));
      }
      // `return` statement
      return(value) {
        const node = new Return();
        this._blockNode(node);
        this.code(value);
        if (node.nodes.length !== 1)
          throw new Error('CodeGen: "return" should have one node');
        return this._endBlockNode(Return);
      }
      // `try` statement
      try(tryBody, catchCode, finallyCode) {
        if (!catchCode && !finallyCode)
          throw new Error('CodeGen: "try" without "catch" and "finally"');
        const node = new Try();
        this._blockNode(node);
        this.code(tryBody);
        if (catchCode) {
          const error2 = this.name("e");
          this._currNode = node.catch = new Catch(error2);
          catchCode(error2);
        }
        if (finallyCode) {
          this._currNode = node.finally = new Finally();
          this.code(finallyCode);
        }
        return this._endBlockNode(Catch, Finally);
      }
      // `throw` statement
      throw(error2) {
        return this._leafNode(new Throw(error2));
      }
      // start self-balancing block
      block(body, nodeCount) {
        this._blockStarts.push(this._nodes.length);
        if (body)
          this.code(body).endBlock(nodeCount);
        return this;
      }
      // end the current self-balancing block
      endBlock(nodeCount) {
        const len = this._blockStarts.pop();
        if (len === void 0)
          throw new Error("CodeGen: not in self-balancing block");
        const toClose = this._nodes.length - len;
        if (toClose < 0 || nodeCount !== void 0 && toClose !== nodeCount) {
          throw new Error(`CodeGen: wrong number of nodes: ${toClose} vs ${nodeCount} expected`);
        }
        this._nodes.length = len;
        return this;
      }
      // `function` heading (or definition if funcBody is passed)
      func(name, args = code_1.nil, async, funcBody) {
        this._blockNode(new Func(name, args, async));
        if (funcBody)
          this.code(funcBody).endFunc();
        return this;
      }
      // end function definition
      endFunc() {
        return this._endBlockNode(Func);
      }
      optimize(n = 1) {
        while (n-- > 0) {
          this._root.optimizeNodes();
          this._root.optimizeNames(this._root.names, this._constants);
        }
      }
      _leafNode(node) {
        this._currNode.nodes.push(node);
        return this;
      }
      _blockNode(node) {
        this._currNode.nodes.push(node);
        this._nodes.push(node);
      }
      _endBlockNode(N1, N2) {
        const n = this._currNode;
        if (n instanceof N1 || N2 && n instanceof N2) {
          this._nodes.pop();
          return this;
        }
        throw new Error(`CodeGen: not in block "${N2 ? `${N1.kind}/${N2.kind}` : N1.kind}"`);
      }
      _elseNode(node) {
        const n = this._currNode;
        if (!(n instanceof If)) {
          throw new Error('CodeGen: "else" without "if"');
        }
        this._currNode = n.else = node;
        return this;
      }
      get _root() {
        return this._nodes[0];
      }
      get _currNode() {
        const ns = this._nodes;
        return ns[ns.length - 1];
      }
      set _currNode(node) {
        const ns = this._nodes;
        ns[ns.length - 1] = node;
      }
    };
    exports.CodeGen = CodeGen;
    function addNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) + (from[n] || 0);
      return names;
    }
    function addExprNames(names, from) {
      return from instanceof code_1._CodeOrName ? addNames(names, from.names) : names;
    }
    function optimizeExpr(expr, names, constants) {
      if (expr instanceof code_1.Name)
        return replaceName(expr);
      if (!canOptimize(expr))
        return expr;
      return new code_1._Code(expr._items.reduce((items, c) => {
        if (c instanceof code_1.Name)
          c = replaceName(c);
        if (c instanceof code_1._Code)
          items.push(...c._items);
        else
          items.push(c);
        return items;
      }, []));
      function replaceName(n) {
        const c = constants[n.str];
        if (c === void 0 || names[n.str] !== 1)
          return n;
        delete names[n.str];
        return c;
      }
      function canOptimize(e) {
        return e instanceof code_1._Code && e._items.some((c) => c instanceof code_1.Name && names[c.str] === 1 && constants[c.str] !== void 0);
      }
    }
    function subtractNames(names, from) {
      for (const n in from)
        names[n] = (names[n] || 0) - (from[n] || 0);
    }
    function not(x) {
      return typeof x == "boolean" || typeof x == "number" || x === null ? !x : (0, code_1._)`!${par(x)}`;
    }
    exports.not = not;
    var andCode = mappend(exports.operators.AND);
    function and(...args) {
      return args.reduce(andCode);
    }
    exports.and = and;
    var orCode = mappend(exports.operators.OR);
    function or(...args) {
      return args.reduce(orCode);
    }
    exports.or = or;
    function mappend(op) {
      return (x, y) => x === code_1.nil ? y : y === code_1.nil ? x : (0, code_1._)`${par(x)} ${op} ${par(y)}`;
    }
    function par(x) {
      return x instanceof code_1.Name ? x : (0, code_1._)`(${x})`;
    }
  }
});

// node_modules/ajv/dist/compile/util.js
var require_util = __commonJS({
  "node_modules/ajv/dist/compile/util.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.checkStrictMode = exports.getErrorPath = exports.Type = exports.useFunc = exports.setEvaluated = exports.evaluatedPropsToName = exports.mergeEvaluated = exports.eachItem = exports.unescapeJsonPointer = exports.escapeJsonPointer = exports.escapeFragment = exports.unescapeFragment = exports.schemaRefOrVal = exports.schemaHasRulesButRef = exports.schemaHasRules = exports.checkUnknownRules = exports.alwaysValidSchema = exports.toHash = void 0;
    var codegen_1 = require_codegen();
    var code_1 = require_code();
    function toHash(arr) {
      const hash = {};
      for (const item of arr)
        hash[item] = true;
      return hash;
    }
    exports.toHash = toHash;
    function alwaysValidSchema(it, schema) {
      if (typeof schema == "boolean")
        return schema;
      if (Object.keys(schema).length === 0)
        return true;
      checkUnknownRules(it, schema);
      return !schemaHasRules(schema, it.self.RULES.all);
    }
    exports.alwaysValidSchema = alwaysValidSchema;
    function checkUnknownRules(it, schema = it.schema) {
      const { opts, self } = it;
      if (!opts.strictSchema)
        return;
      if (typeof schema === "boolean")
        return;
      const rules = self.RULES.keywords;
      for (const key2 in schema) {
        if (!rules[key2])
          checkStrictMode(it, `unknown keyword: "${key2}"`);
      }
    }
    exports.checkUnknownRules = checkUnknownRules;
    function schemaHasRules(schema, rules) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key2 in schema)
        if (rules[key2])
          return true;
      return false;
    }
    exports.schemaHasRules = schemaHasRules;
    function schemaHasRulesButRef(schema, RULES) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key2 in schema)
        if (key2 !== "$ref" && RULES.all[key2])
          return true;
      return false;
    }
    exports.schemaHasRulesButRef = schemaHasRulesButRef;
    function schemaRefOrVal({ topSchemaRef, schemaPath }, schema, keyword, $data) {
      if (!$data) {
        if (typeof schema == "number" || typeof schema == "boolean")
          return schema;
        if (typeof schema == "string")
          return (0, codegen_1._)`${schema}`;
      }
      return (0, codegen_1._)`${topSchemaRef}${schemaPath}${(0, codegen_1.getProperty)(keyword)}`;
    }
    exports.schemaRefOrVal = schemaRefOrVal;
    function unescapeFragment(str) {
      return unescapeJsonPointer(decodeURIComponent(str));
    }
    exports.unescapeFragment = unescapeFragment;
    function escapeFragment(str) {
      return encodeURIComponent(escapeJsonPointer(str));
    }
    exports.escapeFragment = escapeFragment;
    function escapeJsonPointer(str) {
      if (typeof str == "number")
        return `${str}`;
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
    exports.escapeJsonPointer = escapeJsonPointer;
    function unescapeJsonPointer(str) {
      return str.replace(/~1/g, "/").replace(/~0/g, "~");
    }
    exports.unescapeJsonPointer = unescapeJsonPointer;
    function eachItem(xs, f) {
      if (Array.isArray(xs)) {
        for (const x of xs)
          f(x);
      } else {
        f(xs);
      }
    }
    exports.eachItem = eachItem;
    function makeMergeEvaluated({ mergeNames, mergeToName, mergeValues: mergeValues2, resultToName }) {
      return (gen, from, to, toName) => {
        const res = to === void 0 ? from : to instanceof codegen_1.Name ? (from instanceof codegen_1.Name ? mergeNames(gen, from, to) : mergeToName(gen, from, to), to) : from instanceof codegen_1.Name ? (mergeToName(gen, to, from), from) : mergeValues2(from, to);
        return toName === codegen_1.Name && !(res instanceof codegen_1.Name) ? resultToName(gen, res) : res;
      };
    }
    exports.mergeEvaluated = {
      props: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => {
          gen.if((0, codegen_1._)`${from} === true`, () => gen.assign(to, true), () => gen.assign(to, (0, codegen_1._)`${to} || {}`).code((0, codegen_1._)`Object.assign(${to}, ${from})`));
        }),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => {
          if (from === true) {
            gen.assign(to, true);
          } else {
            gen.assign(to, (0, codegen_1._)`${to} || {}`);
            setEvaluated(gen, to, from);
          }
        }),
        mergeValues: (from, to) => from === true ? true : { ...from, ...to },
        resultToName: evaluatedPropsToName
      }),
      items: makeMergeEvaluated({
        mergeNames: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true && ${from} !== undefined`, () => gen.assign(to, (0, codegen_1._)`${from} === true ? true : ${to} > ${from} ? ${to} : ${from}`)),
        mergeToName: (gen, from, to) => gen.if((0, codegen_1._)`${to} !== true`, () => gen.assign(to, from === true ? true : (0, codegen_1._)`${to} > ${from} ? ${to} : ${from}`)),
        mergeValues: (from, to) => from === true ? true : Math.max(from, to),
        resultToName: (gen, items) => gen.var("items", items)
      })
    };
    function evaluatedPropsToName(gen, ps) {
      if (ps === true)
        return gen.var("props", true);
      const props = gen.var("props", (0, codegen_1._)`{}`);
      if (ps !== void 0)
        setEvaluated(gen, props, ps);
      return props;
    }
    exports.evaluatedPropsToName = evaluatedPropsToName;
    function setEvaluated(gen, props, ps) {
      Object.keys(ps).forEach((p) => gen.assign((0, codegen_1._)`${props}${(0, codegen_1.getProperty)(p)}`, true));
    }
    exports.setEvaluated = setEvaluated;
    var snippets = {};
    function useFunc(gen, f) {
      return gen.scopeValue("func", {
        ref: f,
        code: snippets[f.code] || (snippets[f.code] = new code_1._Code(f.code))
      });
    }
    exports.useFunc = useFunc;
    var Type;
    (function(Type2) {
      Type2[Type2["Num"] = 0] = "Num";
      Type2[Type2["Str"] = 1] = "Str";
    })(Type || (exports.Type = Type = {}));
    function getErrorPath(dataProp, dataPropType, jsPropertySyntax) {
      if (dataProp instanceof codegen_1.Name) {
        const isNumber = dataPropType === Type.Num;
        return jsPropertySyntax ? isNumber ? (0, codegen_1._)`"[" + ${dataProp} + "]"` : (0, codegen_1._)`"['" + ${dataProp} + "']"` : isNumber ? (0, codegen_1._)`"/" + ${dataProp}` : (0, codegen_1._)`"/" + ${dataProp}.replace(/~/g, "~0").replace(/\\//g, "~1")`;
      }
      return jsPropertySyntax ? (0, codegen_1.getProperty)(dataProp).toString() : "/" + escapeJsonPointer(dataProp);
    }
    exports.getErrorPath = getErrorPath;
    function checkStrictMode(it, msg, mode = it.opts.strictSchema) {
      if (!mode)
        return;
      msg = `strict mode: ${msg}`;
      if (mode === true)
        throw new Error(msg);
      it.self.logger.warn(msg);
    }
    exports.checkStrictMode = checkStrictMode;
  }
});

// node_modules/ajv/dist/compile/names.js
var require_names = __commonJS({
  "node_modules/ajv/dist/compile/names.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var names = {
      // validation function arguments
      data: new codegen_1.Name("data"),
      // data passed to validation function
      // args passed from referencing schema
      valCxt: new codegen_1.Name("valCxt"),
      // validation/data context - should not be used directly, it is destructured to the names below
      instancePath: new codegen_1.Name("instancePath"),
      parentData: new codegen_1.Name("parentData"),
      parentDataProperty: new codegen_1.Name("parentDataProperty"),
      rootData: new codegen_1.Name("rootData"),
      // root data - same as the data passed to the first/top validation function
      dynamicAnchors: new codegen_1.Name("dynamicAnchors"),
      // used to support recursiveRef and dynamicRef
      // function scoped variables
      vErrors: new codegen_1.Name("vErrors"),
      // null or array of validation errors
      errors: new codegen_1.Name("errors"),
      // counter of validation errors
      this: new codegen_1.Name("this"),
      // "globals"
      self: new codegen_1.Name("self"),
      scope: new codegen_1.Name("scope"),
      // JTD serialize/parse name for JSON string and position
      json: new codegen_1.Name("json"),
      jsonPos: new codegen_1.Name("jsonPos"),
      jsonLen: new codegen_1.Name("jsonLen"),
      jsonPart: new codegen_1.Name("jsonPart")
    };
    exports.default = names;
  }
});

// node_modules/ajv/dist/compile/errors.js
var require_errors = __commonJS({
  "node_modules/ajv/dist/compile/errors.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendErrors = exports.resetErrorsCount = exports.reportExtraError = exports.reportError = exports.keyword$DataError = exports.keywordError = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    exports.keywordError = {
      message: ({ keyword }) => (0, codegen_1.str)`must pass "${keyword}" keyword validation`
    };
    exports.keyword$DataError = {
      message: ({ keyword, schemaType }) => schemaType ? (0, codegen_1.str)`"${keyword}" keyword must be ${schemaType} ($data)` : (0, codegen_1.str)`"${keyword}" keyword is invalid ($data)`
    };
    function reportError(cxt, error2 = exports.keywordError, errorPaths, overrideAllErrors) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error2, errorPaths);
      if (overrideAllErrors !== null && overrideAllErrors !== void 0 ? overrideAllErrors : compositeRule || allErrors) {
        addError(gen, errObj);
      } else {
        returnErrors(it, (0, codegen_1._)`[${errObj}]`);
      }
    }
    exports.reportError = reportError;
    function reportExtraError(cxt, error2 = exports.keywordError, errorPaths) {
      const { it } = cxt;
      const { gen, compositeRule, allErrors } = it;
      const errObj = errorObjectCode(cxt, error2, errorPaths);
      addError(gen, errObj);
      if (!(compositeRule || allErrors)) {
        returnErrors(it, names_1.default.vErrors);
      }
    }
    exports.reportExtraError = reportExtraError;
    function resetErrorsCount(gen, errsCount) {
      gen.assign(names_1.default.errors, errsCount);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} !== null`, () => gen.if(errsCount, () => gen.assign((0, codegen_1._)`${names_1.default.vErrors}.length`, errsCount), () => gen.assign(names_1.default.vErrors, null)));
    }
    exports.resetErrorsCount = resetErrorsCount;
    function extendErrors({ gen, keyword, schemaValue, data, errsCount, it }) {
      if (errsCount === void 0)
        throw new Error("ajv implementation error");
      const err = gen.name("err");
      gen.forRange("i", errsCount, names_1.default.errors, (i) => {
        gen.const(err, (0, codegen_1._)`${names_1.default.vErrors}[${i}]`);
        gen.if((0, codegen_1._)`${err}.instancePath === undefined`, () => gen.assign((0, codegen_1._)`${err}.instancePath`, (0, codegen_1.strConcat)(names_1.default.instancePath, it.errorPath)));
        gen.assign((0, codegen_1._)`${err}.schemaPath`, (0, codegen_1.str)`${it.errSchemaPath}/${keyword}`);
        if (it.opts.verbose) {
          gen.assign((0, codegen_1._)`${err}.schema`, schemaValue);
          gen.assign((0, codegen_1._)`${err}.data`, data);
        }
      });
    }
    exports.extendErrors = extendErrors;
    function addError(gen, errObj) {
      const err = gen.const("err", errObj);
      gen.if((0, codegen_1._)`${names_1.default.vErrors} === null`, () => gen.assign(names_1.default.vErrors, (0, codegen_1._)`[${err}]`), (0, codegen_1._)`${names_1.default.vErrors}.push(${err})`);
      gen.code((0, codegen_1._)`${names_1.default.errors}++`);
    }
    function returnErrors(it, errs) {
      const { gen, validateName, schemaEnv } = it;
      if (schemaEnv.$async) {
        gen.throw((0, codegen_1._)`new ${it.ValidationError}(${errs})`);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, errs);
        gen.return(false);
      }
    }
    var E = {
      keyword: new codegen_1.Name("keyword"),
      schemaPath: new codegen_1.Name("schemaPath"),
      // also used in JTD errors
      params: new codegen_1.Name("params"),
      propertyName: new codegen_1.Name("propertyName"),
      message: new codegen_1.Name("message"),
      schema: new codegen_1.Name("schema"),
      parentSchema: new codegen_1.Name("parentSchema")
    };
    function errorObjectCode(cxt, error2, errorPaths) {
      const { createErrors } = cxt.it;
      if (createErrors === false)
        return (0, codegen_1._)`{}`;
      return errorObject(cxt, error2, errorPaths);
    }
    function errorObject(cxt, error2, errorPaths = {}) {
      const { gen, it } = cxt;
      const keyValues = [
        errorInstancePath(it, errorPaths),
        errorSchemaPath(cxt, errorPaths)
      ];
      extraErrorProps(cxt, error2, keyValues);
      return gen.object(...keyValues);
    }
    function errorInstancePath({ errorPath }, { instancePath }) {
      const instPath = instancePath ? (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(instancePath, util_1.Type.Str)}` : errorPath;
      return [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, instPath)];
    }
    function errorSchemaPath({ keyword, it: { errSchemaPath } }, { schemaPath, parentSchema }) {
      let schPath = parentSchema ? errSchemaPath : (0, codegen_1.str)`${errSchemaPath}/${keyword}`;
      if (schemaPath) {
        schPath = (0, codegen_1.str)`${schPath}${(0, util_1.getErrorPath)(schemaPath, util_1.Type.Str)}`;
      }
      return [E.schemaPath, schPath];
    }
    function extraErrorProps(cxt, { params, message }, keyValues) {
      const { keyword, data, schemaValue, it } = cxt;
      const { opts, propertyName, topSchemaRef, schemaPath } = it;
      keyValues.push([E.keyword, keyword], [E.params, typeof params == "function" ? params(cxt) : params || (0, codegen_1._)`{}`]);
      if (opts.messages) {
        keyValues.push([E.message, typeof message == "function" ? message(cxt) : message]);
      }
      if (opts.verbose) {
        keyValues.push([E.schema, schemaValue], [E.parentSchema, (0, codegen_1._)`${topSchemaRef}${schemaPath}`], [names_1.default.data, data]);
      }
      if (propertyName)
        keyValues.push([E.propertyName, propertyName]);
    }
  }
});

// node_modules/ajv/dist/compile/validate/boolSchema.js
var require_boolSchema = __commonJS({
  "node_modules/ajv/dist/compile/validate/boolSchema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.boolOrEmptySchema = exports.topBoolOrEmptySchema = void 0;
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var boolError = {
      message: "boolean schema is false"
    };
    function topBoolOrEmptySchema(it) {
      const { gen, schema, validateName } = it;
      if (schema === false) {
        falseSchemaError(it, false);
      } else if (typeof schema == "object" && schema.$async === true) {
        gen.return(names_1.default.data);
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, null);
        gen.return(true);
      }
    }
    exports.topBoolOrEmptySchema = topBoolOrEmptySchema;
    function boolOrEmptySchema(it, valid) {
      const { gen, schema } = it;
      if (schema === false) {
        gen.var(valid, false);
        falseSchemaError(it);
      } else {
        gen.var(valid, true);
      }
    }
    exports.boolOrEmptySchema = boolOrEmptySchema;
    function falseSchemaError(it, overrideAllErrors) {
      const { gen, data } = it;
      const cxt = {
        gen,
        keyword: "false schema",
        data,
        schema: false,
        schemaCode: false,
        schemaValue: false,
        params: {},
        it
      };
      (0, errors_1.reportError)(cxt, boolError, void 0, overrideAllErrors);
    }
  }
});

// node_modules/ajv/dist/compile/rules.js
var require_rules = __commonJS({
  "node_modules/ajv/dist/compile/rules.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getRules = exports.isJSONType = void 0;
    var _jsonTypes = ["string", "number", "integer", "boolean", "null", "object", "array"];
    var jsonTypes = new Set(_jsonTypes);
    function isJSONType(x) {
      return typeof x == "string" && jsonTypes.has(x);
    }
    exports.isJSONType = isJSONType;
    function getRules() {
      const groups = {
        number: { type: "number", rules: [] },
        string: { type: "string", rules: [] },
        array: { type: "array", rules: [] },
        object: { type: "object", rules: [] }
      };
      return {
        types: { ...groups, integer: true, boolean: true, null: true },
        rules: [{ rules: [] }, groups.number, groups.string, groups.array, groups.object],
        post: { rules: [] },
        all: {},
        keywords: {}
      };
    }
    exports.getRules = getRules;
  }
});

// node_modules/ajv/dist/compile/validate/applicability.js
var require_applicability = __commonJS({
  "node_modules/ajv/dist/compile/validate/applicability.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.shouldUseRule = exports.shouldUseGroup = exports.schemaHasRulesForType = void 0;
    function schemaHasRulesForType({ schema, self }, type) {
      const group = self.RULES.types[type];
      return group && group !== true && shouldUseGroup(schema, group);
    }
    exports.schemaHasRulesForType = schemaHasRulesForType;
    function shouldUseGroup(schema, group) {
      return group.rules.some((rule) => shouldUseRule(schema, rule));
    }
    exports.shouldUseGroup = shouldUseGroup;
    function shouldUseRule(schema, rule) {
      var _a3;
      return schema[rule.keyword] !== void 0 || ((_a3 = rule.definition.implements) === null || _a3 === void 0 ? void 0 : _a3.some((kwd) => schema[kwd] !== void 0));
    }
    exports.shouldUseRule = shouldUseRule;
  }
});

// node_modules/ajv/dist/compile/validate/dataType.js
var require_dataType = __commonJS({
  "node_modules/ajv/dist/compile/validate/dataType.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reportTypeError = exports.checkDataTypes = exports.checkDataType = exports.coerceAndCheckDataType = exports.getJSONTypes = exports.getSchemaTypes = exports.DataType = void 0;
    var rules_1 = require_rules();
    var applicability_1 = require_applicability();
    var errors_1 = require_errors();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var DataType;
    (function(DataType2) {
      DataType2[DataType2["Correct"] = 0] = "Correct";
      DataType2[DataType2["Wrong"] = 1] = "Wrong";
    })(DataType || (exports.DataType = DataType = {}));
    function getSchemaTypes(schema) {
      const types = getJSONTypes(schema.type);
      const hasNull = types.includes("null");
      if (hasNull) {
        if (schema.nullable === false)
          throw new Error("type: null contradicts nullable: false");
      } else {
        if (!types.length && schema.nullable !== void 0) {
          throw new Error('"nullable" cannot be used without "type"');
        }
        if (schema.nullable === true)
          types.push("null");
      }
      return types;
    }
    exports.getSchemaTypes = getSchemaTypes;
    function getJSONTypes(ts) {
      const types = Array.isArray(ts) ? ts : ts ? [ts] : [];
      if (types.every(rules_1.isJSONType))
        return types;
      throw new Error("type must be JSONType or JSONType[]: " + types.join(","));
    }
    exports.getJSONTypes = getJSONTypes;
    function coerceAndCheckDataType(it, types) {
      const { gen, data, opts } = it;
      const coerceTo = coerceToTypes(types, opts.coerceTypes);
      const checkTypes = types.length > 0 && !(coerceTo.length === 0 && types.length === 1 && (0, applicability_1.schemaHasRulesForType)(it, types[0]));
      if (checkTypes) {
        const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong);
        gen.if(wrongType, () => {
          if (coerceTo.length)
            coerceData(it, types, coerceTo);
          else
            reportTypeError(it);
        });
      }
      return checkTypes;
    }
    exports.coerceAndCheckDataType = coerceAndCheckDataType;
    var COERCIBLE = /* @__PURE__ */ new Set(["string", "number", "integer", "boolean", "null"]);
    function coerceToTypes(types, coerceTypes) {
      return coerceTypes ? types.filter((t) => COERCIBLE.has(t) || coerceTypes === "array" && t === "array") : [];
    }
    function coerceData(it, types, coerceTo) {
      const { gen, data, opts } = it;
      const dataType = gen.let("dataType", (0, codegen_1._)`typeof ${data}`);
      const coerced = gen.let("coerced", (0, codegen_1._)`undefined`);
      if (opts.coerceTypes === "array") {
        gen.if((0, codegen_1._)`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () => gen.assign(data, (0, codegen_1._)`${data}[0]`).assign(dataType, (0, codegen_1._)`typeof ${data}`).if(checkDataTypes(types, data, opts.strictNumbers), () => gen.assign(coerced, data)));
      }
      gen.if((0, codegen_1._)`${coerced} !== undefined`);
      for (const t of coerceTo) {
        if (COERCIBLE.has(t) || t === "array" && opts.coerceTypes === "array") {
          coerceSpecificType(t);
        }
      }
      gen.else();
      reportTypeError(it);
      gen.endIf();
      gen.if((0, codegen_1._)`${coerced} !== undefined`, () => {
        gen.assign(data, coerced);
        assignParentData(it, coerced);
      });
      function coerceSpecificType(t) {
        switch (t) {
          case "string":
            gen.elseIf((0, codegen_1._)`${dataType} == "number" || ${dataType} == "boolean"`).assign(coerced, (0, codegen_1._)`"" + ${data}`).elseIf((0, codegen_1._)`${data} === null`).assign(coerced, (0, codegen_1._)`""`);
            return;
          case "number":
            gen.elseIf((0, codegen_1._)`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "integer":
            gen.elseIf((0, codegen_1._)`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`).assign(coerced, (0, codegen_1._)`+${data}`);
            return;
          case "boolean":
            gen.elseIf((0, codegen_1._)`${data} === "false" || ${data} === 0 || ${data} === null`).assign(coerced, false).elseIf((0, codegen_1._)`${data} === "true" || ${data} === 1`).assign(coerced, true);
            return;
          case "null":
            gen.elseIf((0, codegen_1._)`${data} === "" || ${data} === 0 || ${data} === false`);
            gen.assign(coerced, null);
            return;
          case "array":
            gen.elseIf((0, codegen_1._)`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`).assign(coerced, (0, codegen_1._)`[${data}]`);
        }
      }
    }
    function assignParentData({ gen, parentData, parentDataProperty }, expr) {
      gen.if((0, codegen_1._)`${parentData} !== undefined`, () => gen.assign((0, codegen_1._)`${parentData}[${parentDataProperty}]`, expr));
    }
    function checkDataType(dataType, data, strictNums, correct = DataType.Correct) {
      const EQ = correct === DataType.Correct ? codegen_1.operators.EQ : codegen_1.operators.NEQ;
      let cond;
      switch (dataType) {
        case "null":
          return (0, codegen_1._)`${data} ${EQ} null`;
        case "array":
          cond = (0, codegen_1._)`Array.isArray(${data})`;
          break;
        case "object":
          cond = (0, codegen_1._)`${data} && typeof ${data} == "object" && !Array.isArray(${data})`;
          break;
        case "integer":
          cond = numCond((0, codegen_1._)`!(${data} % 1) && !isNaN(${data})`);
          break;
        case "number":
          cond = numCond();
          break;
        default:
          return (0, codegen_1._)`typeof ${data} ${EQ} ${dataType}`;
      }
      return correct === DataType.Correct ? cond : (0, codegen_1.not)(cond);
      function numCond(_cond = codegen_1.nil) {
        return (0, codegen_1.and)((0, codegen_1._)`typeof ${data} == "number"`, _cond, strictNums ? (0, codegen_1._)`isFinite(${data})` : codegen_1.nil);
      }
    }
    exports.checkDataType = checkDataType;
    function checkDataTypes(dataTypes, data, strictNums, correct) {
      if (dataTypes.length === 1) {
        return checkDataType(dataTypes[0], data, strictNums, correct);
      }
      let cond;
      const types = (0, util_1.toHash)(dataTypes);
      if (types.array && types.object) {
        const notObj = (0, codegen_1._)`typeof ${data} != "object"`;
        cond = types.null ? notObj : (0, codegen_1._)`!${data} || ${notObj}`;
        delete types.null;
        delete types.array;
        delete types.object;
      } else {
        cond = codegen_1.nil;
      }
      if (types.number)
        delete types.integer;
      for (const t in types)
        cond = (0, codegen_1.and)(cond, checkDataType(t, data, strictNums, correct));
      return cond;
    }
    exports.checkDataTypes = checkDataTypes;
    var typeError = {
      message: ({ schema }) => `must be ${schema}`,
      params: ({ schema, schemaValue }) => typeof schema == "string" ? (0, codegen_1._)`{type: ${schema}}` : (0, codegen_1._)`{type: ${schemaValue}}`
    };
    function reportTypeError(it) {
      const cxt = getTypeErrorContext(it);
      (0, errors_1.reportError)(cxt, typeError);
    }
    exports.reportTypeError = reportTypeError;
    function getTypeErrorContext(it) {
      const { gen, data, schema } = it;
      const schemaCode = (0, util_1.schemaRefOrVal)(it, schema, "type");
      return {
        gen,
        keyword: "type",
        data,
        schema: schema.type,
        schemaCode,
        schemaValue: schemaCode,
        parentSchema: schema,
        params: {},
        it
      };
    }
  }
});

// node_modules/ajv/dist/compile/validate/defaults.js
var require_defaults = __commonJS({
  "node_modules/ajv/dist/compile/validate/defaults.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.assignDefaults = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function assignDefaults(it, ty) {
      const { properties, items } = it.schema;
      if (ty === "object" && properties) {
        for (const key2 in properties) {
          assignDefault(it, key2, properties[key2].default);
        }
      } else if (ty === "array" && Array.isArray(items)) {
        items.forEach((sch, i) => assignDefault(it, i, sch.default));
      }
    }
    exports.assignDefaults = assignDefaults;
    function assignDefault(it, prop, defaultValue) {
      const { gen, compositeRule, data, opts } = it;
      if (defaultValue === void 0)
        return;
      const childData = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(prop)}`;
      if (compositeRule) {
        (0, util_1.checkStrictMode)(it, `default is ignored for: ${childData}`);
        return;
      }
      let condition = (0, codegen_1._)`${childData} === undefined`;
      if (opts.useDefaults === "empty") {
        condition = (0, codegen_1._)`${condition} || ${childData} === null || ${childData} === ""`;
      }
      gen.if(condition, (0, codegen_1._)`${childData} = ${(0, codegen_1.stringify)(defaultValue)}`);
    }
  }
});

// node_modules/ajv/dist/vocabularies/code.js
var require_code2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/code.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateUnion = exports.validateArray = exports.usePattern = exports.callValidateCode = exports.schemaProperties = exports.allSchemaProperties = exports.noPropertyInData = exports.propertyInData = exports.isOwnProperty = exports.hasPropFunc = exports.reportMissingProp = exports.checkMissingProp = exports.checkReportMissingProp = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var names_1 = require_names();
    var util_2 = require_util();
    function checkReportMissingProp(cxt, prop) {
      const { gen, data, it } = cxt;
      gen.if(noPropertyInData(gen, data, prop, it.opts.ownProperties), () => {
        cxt.setParams({ missingProperty: (0, codegen_1._)`${prop}` }, true);
        cxt.error();
      });
    }
    exports.checkReportMissingProp = checkReportMissingProp;
    function checkMissingProp({ gen, data, it: { opts } }, properties, missing) {
      return (0, codegen_1.or)(...properties.map((prop) => (0, codegen_1.and)(noPropertyInData(gen, data, prop, opts.ownProperties), (0, codegen_1._)`${missing} = ${prop}`)));
    }
    exports.checkMissingProp = checkMissingProp;
    function reportMissingProp(cxt, missing) {
      cxt.setParams({ missingProperty: missing }, true);
      cxt.error();
    }
    exports.reportMissingProp = reportMissingProp;
    function hasPropFunc(gen) {
      return gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: (0, codegen_1._)`Object.prototype.hasOwnProperty`
      });
    }
    exports.hasPropFunc = hasPropFunc;
    function isOwnProperty(gen, data, property) {
      return (0, codegen_1._)`${hasPropFunc(gen)}.call(${data}, ${property})`;
    }
    exports.isOwnProperty = isOwnProperty;
    function propertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} !== undefined`;
      return ownProperties ? (0, codegen_1._)`${cond} && ${isOwnProperty(gen, data, property)}` : cond;
    }
    exports.propertyInData = propertyInData;
    function noPropertyInData(gen, data, property, ownProperties) {
      const cond = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(property)} === undefined`;
      return ownProperties ? (0, codegen_1.or)(cond, (0, codegen_1.not)(isOwnProperty(gen, data, property))) : cond;
    }
    exports.noPropertyInData = noPropertyInData;
    function allSchemaProperties(schemaMap) {
      return schemaMap ? Object.keys(schemaMap).filter((p) => p !== "__proto__") : [];
    }
    exports.allSchemaProperties = allSchemaProperties;
    function schemaProperties(it, schemaMap) {
      return allSchemaProperties(schemaMap).filter((p) => !(0, util_1.alwaysValidSchema)(it, schemaMap[p]));
    }
    exports.schemaProperties = schemaProperties;
    function callValidateCode({ schemaCode, data, it: { gen, topSchemaRef, schemaPath, errorPath }, it }, func, context, passSchema) {
      const dataAndSchema = passSchema ? (0, codegen_1._)`${schemaCode}, ${data}, ${topSchemaRef}${schemaPath}` : data;
      const valCxt = [
        [names_1.default.instancePath, (0, codegen_1.strConcat)(names_1.default.instancePath, errorPath)],
        [names_1.default.parentData, it.parentData],
        [names_1.default.parentDataProperty, it.parentDataProperty],
        [names_1.default.rootData, names_1.default.rootData]
      ];
      if (it.opts.dynamicRef)
        valCxt.push([names_1.default.dynamicAnchors, names_1.default.dynamicAnchors]);
      const args = (0, codegen_1._)`${dataAndSchema}, ${gen.object(...valCxt)}`;
      return context !== codegen_1.nil ? (0, codegen_1._)`${func}.call(${context}, ${args})` : (0, codegen_1._)`${func}(${args})`;
    }
    exports.callValidateCode = callValidateCode;
    var newRegExp = (0, codegen_1._)`new RegExp`;
    function usePattern({ gen, it: { opts } }, pattern) {
      const u = opts.unicodeRegExp ? "u" : "";
      const { regExp } = opts.code;
      const rx = regExp(pattern, u);
      return gen.scopeValue("pattern", {
        key: rx.toString(),
        ref: rx,
        code: (0, codegen_1._)`${regExp.code === "new RegExp" ? newRegExp : (0, util_2.useFunc)(gen, regExp)}(${pattern}, ${u})`
      });
    }
    exports.usePattern = usePattern;
    function validateArray(cxt) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      if (it.allErrors) {
        const validArr = gen.let("valid", true);
        validateItems(() => gen.assign(validArr, false));
        return validArr;
      }
      gen.var(valid, true);
      validateItems(() => gen.break());
      return valid;
      function validateItems(notValid) {
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        gen.forRange("i", 0, len, (i) => {
          cxt.subschema({
            keyword,
            dataProp: i,
            dataPropType: util_1.Type.Num
          }, valid);
          gen.if((0, codegen_1.not)(valid), notValid);
        });
      }
    }
    exports.validateArray = validateArray;
    function validateUnion(cxt) {
      const { gen, schema, keyword, it } = cxt;
      if (!Array.isArray(schema))
        throw new Error("ajv implementation error");
      const alwaysValid = schema.some((sch) => (0, util_1.alwaysValidSchema)(it, sch));
      if (alwaysValid && !it.opts.unevaluated)
        return;
      const valid = gen.let("valid", false);
      const schValid = gen.name("_valid");
      gen.block(() => schema.forEach((_sch, i) => {
        const schCxt = cxt.subschema({
          keyword,
          schemaProp: i,
          compositeRule: true
        }, schValid);
        gen.assign(valid, (0, codegen_1._)`${valid} || ${schValid}`);
        const merged = cxt.mergeValidEvaluated(schCxt, schValid);
        if (!merged)
          gen.if((0, codegen_1.not)(valid));
      }));
      cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
    }
    exports.validateUnion = validateUnion;
  }
});

// node_modules/ajv/dist/compile/validate/keyword.js
var require_keyword = __commonJS({
  "node_modules/ajv/dist/compile/validate/keyword.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateKeywordUsage = exports.validSchemaType = exports.funcKeywordCode = exports.macroKeywordCode = void 0;
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var code_1 = require_code2();
    var errors_1 = require_errors();
    function macroKeywordCode(cxt, def) {
      const { gen, keyword, schema, parentSchema, it } = cxt;
      const macroSchema = def.macro.call(it.self, schema, parentSchema, it);
      const schemaRef = useKeyword(gen, keyword, macroSchema);
      if (it.opts.validateSchema !== false)
        it.self.validateSchema(macroSchema, true);
      const valid = gen.name("valid");
      cxt.subschema({
        schema: macroSchema,
        schemaPath: codegen_1.nil,
        errSchemaPath: `${it.errSchemaPath}/${keyword}`,
        topSchemaRef: schemaRef,
        compositeRule: true
      }, valid);
      cxt.pass(valid, () => cxt.error(true));
    }
    exports.macroKeywordCode = macroKeywordCode;
    function funcKeywordCode(cxt, def) {
      var _a3;
      const { gen, keyword, schema, parentSchema, $data, it } = cxt;
      checkAsyncKeyword(it, def);
      const validate = !$data && def.compile ? def.compile.call(it.self, schema, parentSchema, it) : def.validate;
      const validateRef = useKeyword(gen, keyword, validate);
      const valid = gen.let("valid");
      cxt.block$data(valid, validateKeyword);
      cxt.ok((_a3 = def.valid) !== null && _a3 !== void 0 ? _a3 : valid);
      function validateKeyword() {
        if (def.errors === false) {
          assignValid();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => cxt.error());
        } else {
          const ruleErrs = def.async ? validateAsync() : validateSync();
          if (def.modifying)
            modifyData(cxt);
          reportErrs(() => addErrs(cxt, ruleErrs));
        }
      }
      function validateAsync() {
        const ruleErrs = gen.let("ruleErrs", null);
        gen.try(() => assignValid((0, codegen_1._)`await `), (e) => gen.assign(valid, false).if((0, codegen_1._)`${e} instanceof ${it.ValidationError}`, () => gen.assign(ruleErrs, (0, codegen_1._)`${e}.errors`), () => gen.throw(e)));
        return ruleErrs;
      }
      function validateSync() {
        const validateErrs = (0, codegen_1._)`${validateRef}.errors`;
        gen.assign(validateErrs, null);
        assignValid(codegen_1.nil);
        return validateErrs;
      }
      function assignValid(_await = def.async ? (0, codegen_1._)`await ` : codegen_1.nil) {
        const passCxt = it.opts.passContext ? names_1.default.this : names_1.default.self;
        const passSchema = !("compile" in def && !$data || def.schema === false);
        gen.assign(valid, (0, codegen_1._)`${_await}${(0, code_1.callValidateCode)(cxt, validateRef, passCxt, passSchema)}`, def.modifying);
      }
      function reportErrs(errors) {
        var _a4;
        gen.if((0, codegen_1.not)((_a4 = def.valid) !== null && _a4 !== void 0 ? _a4 : valid), errors);
      }
    }
    exports.funcKeywordCode = funcKeywordCode;
    function modifyData(cxt) {
      const { gen, data, it } = cxt;
      gen.if(it.parentData, () => gen.assign(data, (0, codegen_1._)`${it.parentData}[${it.parentDataProperty}]`));
    }
    function addErrs(cxt, errs) {
      const { gen } = cxt;
      gen.if((0, codegen_1._)`Array.isArray(${errs})`, () => {
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`).assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
        (0, errors_1.extendErrors)(cxt);
      }, () => cxt.error());
    }
    function checkAsyncKeyword({ schemaEnv }, def) {
      if (def.async && !schemaEnv.$async)
        throw new Error("async keyword in sync schema");
    }
    function useKeyword(gen, keyword, result) {
      if (result === void 0)
        throw new Error(`keyword "${keyword}" failed to compile`);
      return gen.scopeValue("keyword", typeof result == "function" ? { ref: result } : { ref: result, code: (0, codegen_1.stringify)(result) });
    }
    function validSchemaType(schema, schemaType, allowUndefined = false) {
      return !schemaType.length || schemaType.some((st) => st === "array" ? Array.isArray(schema) : st === "object" ? schema && typeof schema == "object" && !Array.isArray(schema) : typeof schema == st || allowUndefined && typeof schema == "undefined");
    }
    exports.validSchemaType = validSchemaType;
    function validateKeywordUsage({ schema, opts, self, errSchemaPath }, def, keyword) {
      if (Array.isArray(def.keyword) ? !def.keyword.includes(keyword) : def.keyword !== keyword) {
        throw new Error("ajv implementation error");
      }
      const deps = def.dependencies;
      if (deps === null || deps === void 0 ? void 0 : deps.some((kwd) => !Object.prototype.hasOwnProperty.call(schema, kwd))) {
        throw new Error(`parent schema must have dependencies of ${keyword}: ${deps.join(",")}`);
      }
      if (def.validateSchema) {
        const valid = def.validateSchema(schema[keyword]);
        if (!valid) {
          const msg = `keyword "${keyword}" value is invalid at path "${errSchemaPath}": ` + self.errorsText(def.validateSchema.errors);
          if (opts.validateSchema === "log")
            self.logger.error(msg);
          else
            throw new Error(msg);
        }
      }
    }
    exports.validateKeywordUsage = validateKeywordUsage;
  }
});

// node_modules/ajv/dist/compile/validate/subschema.js
var require_subschema = __commonJS({
  "node_modules/ajv/dist/compile/validate/subschema.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.extendSubschemaMode = exports.extendSubschemaData = exports.getSubschema = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    function getSubschema(it, { keyword, schemaProp, schema, schemaPath, errSchemaPath, topSchemaRef }) {
      if (keyword !== void 0 && schema !== void 0) {
        throw new Error('both "keyword" and "schema" passed, only one allowed');
      }
      if (keyword !== void 0) {
        const sch = it.schema[keyword];
        return schemaProp === void 0 ? {
          schema: sch,
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}`
        } : {
          schema: sch[schemaProp],
          schemaPath: (0, codegen_1._)`${it.schemaPath}${(0, codegen_1.getProperty)(keyword)}${(0, codegen_1.getProperty)(schemaProp)}`,
          errSchemaPath: `${it.errSchemaPath}/${keyword}/${(0, util_1.escapeFragment)(schemaProp)}`
        };
      }
      if (schema !== void 0) {
        if (schemaPath === void 0 || errSchemaPath === void 0 || topSchemaRef === void 0) {
          throw new Error('"schemaPath", "errSchemaPath" and "topSchemaRef" are required with "schema"');
        }
        return {
          schema,
          schemaPath,
          topSchemaRef,
          errSchemaPath
        };
      }
      throw new Error('either "keyword" or "schema" must be passed');
    }
    exports.getSubschema = getSubschema;
    function extendSubschemaData(subschema, it, { dataProp, dataPropType: dpType, data, dataTypes, propertyName }) {
      if (data !== void 0 && dataProp !== void 0) {
        throw new Error('both "data" and "dataProp" passed, only one allowed');
      }
      const { gen } = it;
      if (dataProp !== void 0) {
        const { errorPath, dataPathArr, opts } = it;
        const nextData = gen.let("data", (0, codegen_1._)`${it.data}${(0, codegen_1.getProperty)(dataProp)}`, true);
        dataContextProps(nextData);
        subschema.errorPath = (0, codegen_1.str)`${errorPath}${(0, util_1.getErrorPath)(dataProp, dpType, opts.jsPropertySyntax)}`;
        subschema.parentDataProperty = (0, codegen_1._)`${dataProp}`;
        subschema.dataPathArr = [...dataPathArr, subschema.parentDataProperty];
      }
      if (data !== void 0) {
        const nextData = data instanceof codegen_1.Name ? data : gen.let("data", data, true);
        dataContextProps(nextData);
        if (propertyName !== void 0)
          subschema.propertyName = propertyName;
      }
      if (dataTypes)
        subschema.dataTypes = dataTypes;
      function dataContextProps(_nextData) {
        subschema.data = _nextData;
        subschema.dataLevel = it.dataLevel + 1;
        subschema.dataTypes = [];
        it.definedProperties = /* @__PURE__ */ new Set();
        subschema.parentData = it.data;
        subschema.dataNames = [...it.dataNames, _nextData];
      }
    }
    exports.extendSubschemaData = extendSubschemaData;
    function extendSubschemaMode(subschema, { jtdDiscriminator, jtdMetadata, compositeRule, createErrors, allErrors }) {
      if (compositeRule !== void 0)
        subschema.compositeRule = compositeRule;
      if (createErrors !== void 0)
        subschema.createErrors = createErrors;
      if (allErrors !== void 0)
        subschema.allErrors = allErrors;
      subschema.jtdDiscriminator = jtdDiscriminator;
      subschema.jtdMetadata = jtdMetadata;
    }
    exports.extendSubschemaMode = extendSubschemaMode;
  }
});

// node_modules/fast-deep-equal/index.js
var require_fast_deep_equal = __commonJS({
  "node_modules/fast-deep-equal/index.js"(exports, module) {
    "use strict";
    module.exports = function equal(a, b) {
      if (a === b) return true;
      if (a && b && typeof a == "object" && typeof b == "object") {
        if (a.constructor !== b.constructor) return false;
        var length, i, keys;
        if (Array.isArray(a)) {
          length = a.length;
          if (length != b.length) return false;
          for (i = length; i-- !== 0; )
            if (!equal(a[i], b[i])) return false;
          return true;
        }
        if (a.constructor === RegExp) return a.source === b.source && a.flags === b.flags;
        if (a.valueOf !== Object.prototype.valueOf) return a.valueOf() === b.valueOf();
        if (a.toString !== Object.prototype.toString) return a.toString() === b.toString();
        keys = Object.keys(a);
        length = keys.length;
        if (length !== Object.keys(b).length) return false;
        for (i = length; i-- !== 0; )
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        for (i = length; i-- !== 0; ) {
          var key2 = keys[i];
          if (!equal(a[key2], b[key2])) return false;
        }
        return true;
      }
      return a !== a && b !== b;
    };
  }
});

// node_modules/json-schema-traverse/index.js
var require_json_schema_traverse = __commonJS({
  "node_modules/json-schema-traverse/index.js"(exports, module) {
    "use strict";
    var traverse = module.exports = function(schema, opts, cb) {
      if (typeof opts == "function") {
        cb = opts;
        opts = {};
      }
      cb = opts.cb || cb;
      var pre = typeof cb == "function" ? cb : cb.pre || function() {
      };
      var post = cb.post || function() {
      };
      _traverse(opts, pre, post, schema, "", schema);
    };
    traverse.keywords = {
      additionalItems: true,
      items: true,
      contains: true,
      additionalProperties: true,
      propertyNames: true,
      not: true,
      if: true,
      then: true,
      else: true
    };
    traverse.arrayKeywords = {
      items: true,
      allOf: true,
      anyOf: true,
      oneOf: true
    };
    traverse.propsKeywords = {
      $defs: true,
      definitions: true,
      properties: true,
      patternProperties: true,
      dependencies: true
    };
    traverse.skipKeywords = {
      default: true,
      enum: true,
      const: true,
      required: true,
      maximum: true,
      minimum: true,
      exclusiveMaximum: true,
      exclusiveMinimum: true,
      multipleOf: true,
      maxLength: true,
      minLength: true,
      pattern: true,
      format: true,
      maxItems: true,
      minItems: true,
      uniqueItems: true,
      maxProperties: true,
      minProperties: true
    };
    function _traverse(opts, pre, post, schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex) {
      if (schema && typeof schema == "object" && !Array.isArray(schema)) {
        pre(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
        for (var key2 in schema) {
          var sch = schema[key2];
          if (Array.isArray(sch)) {
            if (key2 in traverse.arrayKeywords) {
              for (var i = 0; i < sch.length; i++)
                _traverse(opts, pre, post, sch[i], jsonPtr + "/" + key2 + "/" + i, rootSchema, jsonPtr, key2, schema, i);
            }
          } else if (key2 in traverse.propsKeywords) {
            if (sch && typeof sch == "object") {
              for (var prop in sch)
                _traverse(opts, pre, post, sch[prop], jsonPtr + "/" + key2 + "/" + escapeJsonPtr(prop), rootSchema, jsonPtr, key2, schema, prop);
            }
          } else if (key2 in traverse.keywords || opts.allKeys && !(key2 in traverse.skipKeywords)) {
            _traverse(opts, pre, post, sch, jsonPtr + "/" + key2, rootSchema, jsonPtr, key2, schema);
          }
        }
        post(schema, jsonPtr, rootSchema, parentJsonPtr, parentKeyword, parentSchema, keyIndex);
      }
    }
    function escapeJsonPtr(str) {
      return str.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  }
});

// node_modules/ajv/dist/compile/resolve.js
var require_resolve = __commonJS({
  "node_modules/ajv/dist/compile/resolve.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getSchemaRefs = exports.resolveUrl = exports.normalizeId = exports._getFullPath = exports.getFullPath = exports.inlineRef = void 0;
    var util_1 = require_util();
    var equal = require_fast_deep_equal();
    var traverse = require_json_schema_traverse();
    var SIMPLE_INLINED = /* @__PURE__ */ new Set([
      "type",
      "format",
      "pattern",
      "maxLength",
      "minLength",
      "maxProperties",
      "minProperties",
      "maxItems",
      "minItems",
      "maximum",
      "minimum",
      "uniqueItems",
      "multipleOf",
      "required",
      "enum",
      "const"
    ]);
    function inlineRef(schema, limit = true) {
      if (typeof schema == "boolean")
        return true;
      if (limit === true)
        return !hasRef(schema);
      if (!limit)
        return false;
      return countKeys(schema) <= limit;
    }
    exports.inlineRef = inlineRef;
    var REF_KEYWORDS = /* @__PURE__ */ new Set([
      "$ref",
      "$recursiveRef",
      "$recursiveAnchor",
      "$dynamicRef",
      "$dynamicAnchor"
    ]);
    function hasRef(schema) {
      for (const key2 in schema) {
        if (REF_KEYWORDS.has(key2))
          return true;
        const sch = schema[key2];
        if (Array.isArray(sch) && sch.some(hasRef))
          return true;
        if (typeof sch == "object" && hasRef(sch))
          return true;
      }
      return false;
    }
    function countKeys(schema) {
      let count = 0;
      for (const key2 in schema) {
        if (key2 === "$ref")
          return Infinity;
        count++;
        if (SIMPLE_INLINED.has(key2))
          continue;
        if (typeof schema[key2] == "object") {
          (0, util_1.eachItem)(schema[key2], (sch) => count += countKeys(sch));
        }
        if (count === Infinity)
          return Infinity;
      }
      return count;
    }
    function getFullPath(resolver, id = "", normalize) {
      if (normalize !== false)
        id = normalizeId(id);
      const p = resolver.parse(id);
      return _getFullPath(resolver, p);
    }
    exports.getFullPath = getFullPath;
    function _getFullPath(resolver, p) {
      const serialized = resolver.serialize(p);
      return serialized.split("#")[0] + "#";
    }
    exports._getFullPath = _getFullPath;
    var TRAILING_SLASH_HASH = /#\/?$/;
    function normalizeId(id) {
      return id ? id.replace(TRAILING_SLASH_HASH, "") : "";
    }
    exports.normalizeId = normalizeId;
    function resolveUrl(resolver, baseId, id) {
      id = normalizeId(id);
      return resolver.resolve(baseId, id);
    }
    exports.resolveUrl = resolveUrl;
    var ANCHOR = /^[a-z_][-a-z0-9._]*$/i;
    function getSchemaRefs(schema, baseId) {
      if (typeof schema == "boolean")
        return {};
      const { schemaId, uriResolver } = this.opts;
      const schId = normalizeId(schema[schemaId] || baseId);
      const baseIds = { "": schId };
      const pathPrefix = getFullPath(uriResolver, schId, false);
      const localRefs = {};
      const schemaRefs = /* @__PURE__ */ new Set();
      traverse(schema, { allKeys: true }, (sch, jsonPtr, _, parentJsonPtr) => {
        if (parentJsonPtr === void 0)
          return;
        const fullPath = pathPrefix + jsonPtr;
        let innerBaseId = baseIds[parentJsonPtr];
        if (typeof sch[schemaId] == "string")
          innerBaseId = addRef.call(this, sch[schemaId]);
        addAnchor.call(this, sch.$anchor);
        addAnchor.call(this, sch.$dynamicAnchor);
        baseIds[jsonPtr] = innerBaseId;
        function addRef(ref) {
          const _resolve = this.opts.uriResolver.resolve;
          ref = normalizeId(innerBaseId ? _resolve(innerBaseId, ref) : ref);
          if (schemaRefs.has(ref))
            throw ambiguos(ref);
          schemaRefs.add(ref);
          let schOrRef = this.refs[ref];
          if (typeof schOrRef == "string")
            schOrRef = this.refs[schOrRef];
          if (typeof schOrRef == "object") {
            checkAmbiguosRef(sch, schOrRef.schema, ref);
          } else if (ref !== normalizeId(fullPath)) {
            if (ref[0] === "#") {
              checkAmbiguosRef(sch, localRefs[ref], ref);
              localRefs[ref] = sch;
            } else {
              this.refs[ref] = fullPath;
            }
          }
          return ref;
        }
        function addAnchor(anchor) {
          if (typeof anchor == "string") {
            if (!ANCHOR.test(anchor))
              throw new Error(`invalid anchor "${anchor}"`);
            addRef.call(this, `#${anchor}`);
          }
        }
      });
      return localRefs;
      function checkAmbiguosRef(sch1, sch2, ref) {
        if (sch2 !== void 0 && !equal(sch1, sch2))
          throw ambiguos(ref);
      }
      function ambiguos(ref) {
        return new Error(`reference "${ref}" resolves to more than one schema`);
      }
    }
    exports.getSchemaRefs = getSchemaRefs;
  }
});

// node_modules/ajv/dist/compile/validate/index.js
var require_validate = __commonJS({
  "node_modules/ajv/dist/compile/validate/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getData = exports.KeywordCxt = exports.validateFunctionCode = void 0;
    var boolSchema_1 = require_boolSchema();
    var dataType_1 = require_dataType();
    var applicability_1 = require_applicability();
    var dataType_2 = require_dataType();
    var defaults_1 = require_defaults();
    var keyword_1 = require_keyword();
    var subschema_1 = require_subschema();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var errors_1 = require_errors();
    function validateFunctionCode(it) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          topSchemaObjCode(it);
          return;
        }
      }
      validateFunction(it, () => (0, boolSchema_1.topBoolOrEmptySchema)(it));
    }
    exports.validateFunctionCode = validateFunctionCode;
    function validateFunction({ gen, validateName, schema, schemaEnv, opts }, body) {
      if (opts.code.es5) {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${names_1.default.valCxt}`, schemaEnv.$async, () => {
          gen.code((0, codegen_1._)`"use strict"; ${funcSourceUrl(schema, opts)}`);
          destructureValCxtES5(gen, opts);
          gen.code(body);
        });
      } else {
        gen.func(validateName, (0, codegen_1._)`${names_1.default.data}, ${destructureValCxt(opts)}`, schemaEnv.$async, () => gen.code(funcSourceUrl(schema, opts)).code(body));
      }
    }
    function destructureValCxt(opts) {
      return (0, codegen_1._)`{${names_1.default.instancePath}="", ${names_1.default.parentData}, ${names_1.default.parentDataProperty}, ${names_1.default.rootData}=${names_1.default.data}${opts.dynamicRef ? (0, codegen_1._)`, ${names_1.default.dynamicAnchors}={}` : codegen_1.nil}}={}`;
    }
    function destructureValCxtES5(gen, opts) {
      gen.if(names_1.default.valCxt, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.instancePath}`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentData}`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.parentDataProperty}`);
        gen.var(names_1.default.rootData, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.rootData}`);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`${names_1.default.valCxt}.${names_1.default.dynamicAnchors}`);
      }, () => {
        gen.var(names_1.default.instancePath, (0, codegen_1._)`""`);
        gen.var(names_1.default.parentData, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.parentDataProperty, (0, codegen_1._)`undefined`);
        gen.var(names_1.default.rootData, names_1.default.data);
        if (opts.dynamicRef)
          gen.var(names_1.default.dynamicAnchors, (0, codegen_1._)`{}`);
      });
    }
    function topSchemaObjCode(it) {
      const { schema, opts, gen } = it;
      validateFunction(it, () => {
        if (opts.$comment && schema.$comment)
          commentKeyword(it);
        checkNoDefault(it);
        gen.let(names_1.default.vErrors, null);
        gen.let(names_1.default.errors, 0);
        if (opts.unevaluated)
          resetEvaluated(it);
        typeAndKeywords(it);
        returnResults(it);
      });
      return;
    }
    function resetEvaluated(it) {
      const { gen, validateName } = it;
      it.evaluated = gen.const("evaluated", (0, codegen_1._)`${validateName}.evaluated`);
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicProps`, () => gen.assign((0, codegen_1._)`${it.evaluated}.props`, (0, codegen_1._)`undefined`));
      gen.if((0, codegen_1._)`${it.evaluated}.dynamicItems`, () => gen.assign((0, codegen_1._)`${it.evaluated}.items`, (0, codegen_1._)`undefined`));
    }
    function funcSourceUrl(schema, opts) {
      const schId = typeof schema == "object" && schema[opts.schemaId];
      return schId && (opts.code.source || opts.code.process) ? (0, codegen_1._)`/*# sourceURL=${schId} */` : codegen_1.nil;
    }
    function subschemaCode(it, valid) {
      if (isSchemaObj(it)) {
        checkKeywords(it);
        if (schemaCxtHasRules(it)) {
          subSchemaObjCode(it, valid);
          return;
        }
      }
      (0, boolSchema_1.boolOrEmptySchema)(it, valid);
    }
    function schemaCxtHasRules({ schema, self }) {
      if (typeof schema == "boolean")
        return !schema;
      for (const key2 in schema)
        if (self.RULES.all[key2])
          return true;
      return false;
    }
    function isSchemaObj(it) {
      return typeof it.schema != "boolean";
    }
    function subSchemaObjCode(it, valid) {
      const { schema, gen, opts } = it;
      if (opts.$comment && schema.$comment)
        commentKeyword(it);
      updateContext(it);
      checkAsyncSchema(it);
      const errsCount = gen.const("_errs", names_1.default.errors);
      typeAndKeywords(it, errsCount);
      gen.var(valid, (0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
    }
    function checkKeywords(it) {
      (0, util_1.checkUnknownRules)(it);
      checkRefsAndKeywords(it);
    }
    function typeAndKeywords(it, errsCount) {
      if (it.opts.jtd)
        return schemaKeywords(it, [], false, errsCount);
      const types = (0, dataType_1.getSchemaTypes)(it.schema);
      const checkedTypes = (0, dataType_1.coerceAndCheckDataType)(it, types);
      schemaKeywords(it, types, !checkedTypes, errsCount);
    }
    function checkRefsAndKeywords(it) {
      const { schema, errSchemaPath, opts, self } = it;
      if (schema.$ref && opts.ignoreKeywordsWithRef && (0, util_1.schemaHasRulesButRef)(schema, self.RULES)) {
        self.logger.warn(`$ref: keywords ignored in schema at path "${errSchemaPath}"`);
      }
    }
    function checkNoDefault(it) {
      const { schema, opts } = it;
      if (schema.default !== void 0 && opts.useDefaults && opts.strictSchema) {
        (0, util_1.checkStrictMode)(it, "default is ignored in the schema root");
      }
    }
    function updateContext(it) {
      const schId = it.schema[it.opts.schemaId];
      if (schId)
        it.baseId = (0, resolve_1.resolveUrl)(it.opts.uriResolver, it.baseId, schId);
    }
    function checkAsyncSchema(it) {
      if (it.schema.$async && !it.schemaEnv.$async)
        throw new Error("async schema in sync schema");
    }
    function commentKeyword({ gen, schemaEnv, schema, errSchemaPath, opts }) {
      const msg = schema.$comment;
      if (opts.$comment === true) {
        gen.code((0, codegen_1._)`${names_1.default.self}.logger.log(${msg})`);
      } else if (typeof opts.$comment == "function") {
        const schemaPath = (0, codegen_1.str)`${errSchemaPath}/$comment`;
        const rootName = gen.scopeValue("root", { ref: schemaEnv.root });
        gen.code((0, codegen_1._)`${names_1.default.self}.opts.$comment(${msg}, ${schemaPath}, ${rootName}.schema)`);
      }
    }
    function returnResults(it) {
      const { gen, schemaEnv, validateName, ValidationError, opts } = it;
      if (schemaEnv.$async) {
        gen.if((0, codegen_1._)`${names_1.default.errors} === 0`, () => gen.return(names_1.default.data), () => gen.throw((0, codegen_1._)`new ${ValidationError}(${names_1.default.vErrors})`));
      } else {
        gen.assign((0, codegen_1._)`${validateName}.errors`, names_1.default.vErrors);
        if (opts.unevaluated)
          assignEvaluated(it);
        gen.return((0, codegen_1._)`${names_1.default.errors} === 0`);
      }
    }
    function assignEvaluated({ gen, evaluated, props, items }) {
      if (props instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.props`, props);
      if (items instanceof codegen_1.Name)
        gen.assign((0, codegen_1._)`${evaluated}.items`, items);
    }
    function schemaKeywords(it, types, typeErrors, errsCount) {
      const { gen, schema, data, allErrors, opts, self } = it;
      const { RULES } = self;
      if (schema.$ref && (opts.ignoreKeywordsWithRef || !(0, util_1.schemaHasRulesButRef)(schema, RULES))) {
        gen.block(() => keywordCode(it, "$ref", RULES.all.$ref.definition));
        return;
      }
      if (!opts.jtd)
        checkStrictTypes(it, types);
      gen.block(() => {
        for (const group of RULES.rules)
          groupKeywords(group);
        groupKeywords(RULES.post);
      });
      function groupKeywords(group) {
        if (!(0, applicability_1.shouldUseGroup)(schema, group))
          return;
        if (group.type) {
          gen.if((0, dataType_2.checkDataType)(group.type, data, opts.strictNumbers));
          iterateKeywords(it, group);
          if (types.length === 1 && types[0] === group.type && typeErrors) {
            gen.else();
            (0, dataType_2.reportTypeError)(it);
          }
          gen.endIf();
        } else {
          iterateKeywords(it, group);
        }
        if (!allErrors)
          gen.if((0, codegen_1._)`${names_1.default.errors} === ${errsCount || 0}`);
      }
    }
    function iterateKeywords(it, group) {
      const { gen, schema, opts: { useDefaults } } = it;
      if (useDefaults)
        (0, defaults_1.assignDefaults)(it, group.type);
      gen.block(() => {
        for (const rule of group.rules) {
          if ((0, applicability_1.shouldUseRule)(schema, rule)) {
            keywordCode(it, rule.keyword, rule.definition, group.type);
          }
        }
      });
    }
    function checkStrictTypes(it, types) {
      if (it.schemaEnv.meta || !it.opts.strictTypes)
        return;
      checkContextTypes(it, types);
      if (!it.opts.allowUnionTypes)
        checkMultipleTypes(it, types);
      checkKeywordTypes(it, it.dataTypes);
    }
    function checkContextTypes(it, types) {
      if (!types.length)
        return;
      if (!it.dataTypes.length) {
        it.dataTypes = types;
        return;
      }
      types.forEach((t) => {
        if (!includesType(it.dataTypes, t)) {
          strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`);
        }
      });
      narrowSchemaTypes(it, types);
    }
    function checkMultipleTypes(it, ts) {
      if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
        strictTypesError(it, "use allowUnionTypes to allow union type keyword");
      }
    }
    function checkKeywordTypes(it, ts) {
      const rules = it.self.RULES.all;
      for (const keyword in rules) {
        const rule = rules[keyword];
        if (typeof rule == "object" && (0, applicability_1.shouldUseRule)(it.schema, rule)) {
          const { type } = rule.definition;
          if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
            strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`);
          }
        }
      }
    }
    function hasApplicableType(schTs, kwdT) {
      return schTs.includes(kwdT) || kwdT === "number" && schTs.includes("integer");
    }
    function includesType(ts, t) {
      return ts.includes(t) || t === "integer" && ts.includes("number");
    }
    function narrowSchemaTypes(it, withTypes) {
      const ts = [];
      for (const t of it.dataTypes) {
        if (includesType(withTypes, t))
          ts.push(t);
        else if (withTypes.includes("integer") && t === "number")
          ts.push("integer");
      }
      it.dataTypes = ts;
    }
    function strictTypesError(it, msg) {
      const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
      msg += ` at "${schemaPath}" (strictTypes)`;
      (0, util_1.checkStrictMode)(it, msg, it.opts.strictTypes);
    }
    var KeywordCxt = class {
      constructor(it, def, keyword) {
        (0, keyword_1.validateKeywordUsage)(it, def, keyword);
        this.gen = it.gen;
        this.allErrors = it.allErrors;
        this.keyword = keyword;
        this.data = it.data;
        this.schema = it.schema[keyword];
        this.$data = def.$data && it.opts.$data && this.schema && this.schema.$data;
        this.schemaValue = (0, util_1.schemaRefOrVal)(it, this.schema, keyword, this.$data);
        this.schemaType = def.schemaType;
        this.parentSchema = it.schema;
        this.params = {};
        this.it = it;
        this.def = def;
        if (this.$data) {
          this.schemaCode = it.gen.const("vSchema", getData(this.$data, it));
        } else {
          this.schemaCode = this.schemaValue;
          if (!(0, keyword_1.validSchemaType)(this.schema, def.schemaType, def.allowUndefined)) {
            throw new Error(`${keyword} value must be ${JSON.stringify(def.schemaType)}`);
          }
        }
        if ("code" in def ? def.trackErrors : def.errors !== false) {
          this.errsCount = it.gen.const("_errs", names_1.default.errors);
        }
      }
      result(condition, successAction, failAction) {
        this.failResult((0, codegen_1.not)(condition), successAction, failAction);
      }
      failResult(condition, successAction, failAction) {
        this.gen.if(condition);
        if (failAction)
          failAction();
        else
          this.error();
        if (successAction) {
          this.gen.else();
          successAction();
          if (this.allErrors)
            this.gen.endIf();
        } else {
          if (this.allErrors)
            this.gen.endIf();
          else
            this.gen.else();
        }
      }
      pass(condition, failAction) {
        this.failResult((0, codegen_1.not)(condition), void 0, failAction);
      }
      fail(condition) {
        if (condition === void 0) {
          this.error();
          if (!this.allErrors)
            this.gen.if(false);
          return;
        }
        this.gen.if(condition);
        this.error();
        if (this.allErrors)
          this.gen.endIf();
        else
          this.gen.else();
      }
      fail$data(condition) {
        if (!this.$data)
          return this.fail(condition);
        const { schemaCode } = this;
        this.fail((0, codegen_1._)`${schemaCode} !== undefined && (${(0, codegen_1.or)(this.invalid$data(), condition)})`);
      }
      error(append, errorParams, errorPaths) {
        if (errorParams) {
          this.setParams(errorParams);
          this._error(append, errorPaths);
          this.setParams({});
          return;
        }
        this._error(append, errorPaths);
      }
      _error(append, errorPaths) {
        ;
        (append ? errors_1.reportExtraError : errors_1.reportError)(this, this.def.error, errorPaths);
      }
      $dataError() {
        (0, errors_1.reportError)(this, this.def.$dataError || errors_1.keyword$DataError);
      }
      reset() {
        if (this.errsCount === void 0)
          throw new Error('add "trackErrors" to keyword definition');
        (0, errors_1.resetErrorsCount)(this.gen, this.errsCount);
      }
      ok(cond) {
        if (!this.allErrors)
          this.gen.if(cond);
      }
      setParams(obj, assign) {
        if (assign)
          Object.assign(this.params, obj);
        else
          this.params = obj;
      }
      block$data(valid, codeBlock, $dataValid = codegen_1.nil) {
        this.gen.block(() => {
          this.check$data(valid, $dataValid);
          codeBlock();
        });
      }
      check$data(valid = codegen_1.nil, $dataValid = codegen_1.nil) {
        if (!this.$data)
          return;
        const { gen, schemaCode, schemaType, def } = this;
        gen.if((0, codegen_1.or)((0, codegen_1._)`${schemaCode} === undefined`, $dataValid));
        if (valid !== codegen_1.nil)
          gen.assign(valid, true);
        if (schemaType.length || def.validateSchema) {
          gen.elseIf(this.invalid$data());
          this.$dataError();
          if (valid !== codegen_1.nil)
            gen.assign(valid, false);
        }
        gen.else();
      }
      invalid$data() {
        const { gen, schemaCode, schemaType, def, it } = this;
        return (0, codegen_1.or)(wrong$DataType(), invalid$DataSchema());
        function wrong$DataType() {
          if (schemaType.length) {
            if (!(schemaCode instanceof codegen_1.Name))
              throw new Error("ajv implementation error");
            const st = Array.isArray(schemaType) ? schemaType : [schemaType];
            return (0, codegen_1._)`${(0, dataType_2.checkDataTypes)(st, schemaCode, it.opts.strictNumbers, dataType_2.DataType.Wrong)}`;
          }
          return codegen_1.nil;
        }
        function invalid$DataSchema() {
          if (def.validateSchema) {
            const validateSchemaRef = gen.scopeValue("validate$data", { ref: def.validateSchema });
            return (0, codegen_1._)`!${validateSchemaRef}(${schemaCode})`;
          }
          return codegen_1.nil;
        }
      }
      subschema(appl, valid) {
        const subschema = (0, subschema_1.getSubschema)(this.it, appl);
        (0, subschema_1.extendSubschemaData)(subschema, this.it, appl);
        (0, subschema_1.extendSubschemaMode)(subschema, appl);
        const nextContext = { ...this.it, ...subschema, items: void 0, props: void 0 };
        subschemaCode(nextContext, valid);
        return nextContext;
      }
      mergeEvaluated(schemaCxt, toName) {
        const { it, gen } = this;
        if (!it.opts.unevaluated)
          return;
        if (it.props !== true && schemaCxt.props !== void 0) {
          it.props = util_1.mergeEvaluated.props(gen, schemaCxt.props, it.props, toName);
        }
        if (it.items !== true && schemaCxt.items !== void 0) {
          it.items = util_1.mergeEvaluated.items(gen, schemaCxt.items, it.items, toName);
        }
      }
      mergeValidEvaluated(schemaCxt, valid) {
        const { it, gen } = this;
        if (it.opts.unevaluated && (it.props !== true || it.items !== true)) {
          gen.if(valid, () => this.mergeEvaluated(schemaCxt, codegen_1.Name));
          return true;
        }
      }
    };
    exports.KeywordCxt = KeywordCxt;
    function keywordCode(it, keyword, def, ruleType) {
      const cxt = new KeywordCxt(it, def, keyword);
      if ("code" in def) {
        def.code(cxt, ruleType);
      } else if (cxt.$data && def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      } else if ("macro" in def) {
        (0, keyword_1.macroKeywordCode)(cxt, def);
      } else if (def.compile || def.validate) {
        (0, keyword_1.funcKeywordCode)(cxt, def);
      }
    }
    var JSON_POINTER = /^\/(?:[^~]|~0|~1)*$/;
    var RELATIVE_JSON_POINTER = /^([0-9]+)(#|\/(?:[^~]|~0|~1)*)?$/;
    function getData($data, { dataLevel, dataNames, dataPathArr }) {
      let jsonPointer;
      let data;
      if ($data === "")
        return names_1.default.rootData;
      if ($data[0] === "/") {
        if (!JSON_POINTER.test($data))
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        jsonPointer = $data;
        data = names_1.default.rootData;
      } else {
        const matches = RELATIVE_JSON_POINTER.exec($data);
        if (!matches)
          throw new Error(`Invalid JSON-pointer: ${$data}`);
        const up = +matches[1];
        jsonPointer = matches[2];
        if (jsonPointer === "#") {
          if (up >= dataLevel)
            throw new Error(errorMsg("property/index", up));
          return dataPathArr[dataLevel - up];
        }
        if (up > dataLevel)
          throw new Error(errorMsg("data", up));
        data = dataNames[dataLevel - up];
        if (!jsonPointer)
          return data;
      }
      let expr = data;
      const segments = jsonPointer.split("/");
      for (const segment of segments) {
        if (segment) {
          data = (0, codegen_1._)`${data}${(0, codegen_1.getProperty)((0, util_1.unescapeJsonPointer)(segment))}`;
          expr = (0, codegen_1._)`${expr} && ${data}`;
        }
      }
      return expr;
      function errorMsg(pointerType, up) {
        return `Cannot access ${pointerType} ${up} levels up, current level is ${dataLevel}`;
      }
    }
    exports.getData = getData;
  }
});

// node_modules/ajv/dist/runtime/validation_error.js
var require_validation_error = __commonJS({
  "node_modules/ajv/dist/runtime/validation_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ValidationError = class extends Error {
      constructor(errors) {
        super("validation failed");
        this.errors = errors;
        this.ajv = this.validation = true;
      }
    };
    exports.default = ValidationError;
  }
});

// node_modules/ajv/dist/compile/ref_error.js
var require_ref_error = __commonJS({
  "node_modules/ajv/dist/compile/ref_error.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var resolve_1 = require_resolve();
    var MissingRefError = class extends Error {
      constructor(resolver, baseId, ref, msg) {
        super(msg || `can't resolve reference ${ref} from id ${baseId}`);
        this.missingRef = (0, resolve_1.resolveUrl)(resolver, baseId, ref);
        this.missingSchema = (0, resolve_1.normalizeId)((0, resolve_1.getFullPath)(resolver, this.missingRef));
      }
    };
    exports.default = MissingRefError;
  }
});

// node_modules/ajv/dist/compile/index.js
var require_compile = __commonJS({
  "node_modules/ajv/dist/compile/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.resolveSchema = exports.getCompilingSchema = exports.resolveRef = exports.compileSchema = exports.SchemaEnv = void 0;
    var codegen_1 = require_codegen();
    var validation_error_1 = require_validation_error();
    var names_1 = require_names();
    var resolve_1 = require_resolve();
    var util_1 = require_util();
    var validate_1 = require_validate();
    var SchemaEnv = class {
      constructor(env) {
        var _a3;
        this.refs = {};
        this.dynamicAnchors = {};
        let schema;
        if (typeof env.schema == "object")
          schema = env.schema;
        this.schema = env.schema;
        this.schemaId = env.schemaId;
        this.root = env.root || this;
        this.baseId = (_a3 = env.baseId) !== null && _a3 !== void 0 ? _a3 : (0, resolve_1.normalizeId)(schema === null || schema === void 0 ? void 0 : schema[env.schemaId || "$id"]);
        this.schemaPath = env.schemaPath;
        this.localRefs = env.localRefs;
        this.meta = env.meta;
        this.$async = schema === null || schema === void 0 ? void 0 : schema.$async;
        this.refs = {};
      }
    };
    exports.SchemaEnv = SchemaEnv;
    function compileSchema(sch) {
      const _sch = getCompilingSchema.call(this, sch);
      if (_sch)
        return _sch;
      const rootId = (0, resolve_1.getFullPath)(this.opts.uriResolver, sch.root.baseId);
      const { es5, lines } = this.opts.code;
      const { ownProperties } = this.opts;
      const gen = new codegen_1.CodeGen(this.scope, { es5, lines, ownProperties });
      let _ValidationError;
      if (sch.$async) {
        _ValidationError = gen.scopeValue("Error", {
          ref: validation_error_1.default,
          code: (0, codegen_1._)`require("ajv/dist/runtime/validation_error").default`
        });
      }
      const validateName = gen.scopeName("validate");
      sch.validateName = validateName;
      const schemaCxt = {
        gen,
        allErrors: this.opts.allErrors,
        data: names_1.default.data,
        parentData: names_1.default.parentData,
        parentDataProperty: names_1.default.parentDataProperty,
        dataNames: [names_1.default.data],
        dataPathArr: [codegen_1.nil],
        // TODO can its length be used as dataLevel if nil is removed?
        dataLevel: 0,
        dataTypes: [],
        definedProperties: /* @__PURE__ */ new Set(),
        topSchemaRef: gen.scopeValue("schema", this.opts.code.source === true ? { ref: sch.schema, code: (0, codegen_1.stringify)(sch.schema) } : { ref: sch.schema }),
        validateName,
        ValidationError: _ValidationError,
        schema: sch.schema,
        schemaEnv: sch,
        rootId,
        baseId: sch.baseId || rootId,
        schemaPath: codegen_1.nil,
        errSchemaPath: sch.schemaPath || (this.opts.jtd ? "" : "#"),
        errorPath: (0, codegen_1._)`""`,
        opts: this.opts,
        self: this
      };
      let sourceCode;
      try {
        this._compilations.add(sch);
        (0, validate_1.validateFunctionCode)(schemaCxt);
        gen.optimize(this.opts.code.optimize);
        const validateCode = gen.toString();
        sourceCode = `${gen.scopeRefs(names_1.default.scope)}return ${validateCode}`;
        if (this.opts.code.process)
          sourceCode = this.opts.code.process(sourceCode, sch);
        const makeValidate = new Function(`${names_1.default.self}`, `${names_1.default.scope}`, sourceCode);
        const validate = makeValidate(this, this.scope.get());
        this.scope.value(validateName, { ref: validate });
        validate.errors = null;
        validate.schema = sch.schema;
        validate.schemaEnv = sch;
        if (sch.$async)
          validate.$async = true;
        if (this.opts.code.source === true) {
          validate.source = { validateName, validateCode, scopeValues: gen._values };
        }
        if (this.opts.unevaluated) {
          const { props, items } = schemaCxt;
          validate.evaluated = {
            props: props instanceof codegen_1.Name ? void 0 : props,
            items: items instanceof codegen_1.Name ? void 0 : items,
            dynamicProps: props instanceof codegen_1.Name,
            dynamicItems: items instanceof codegen_1.Name
          };
          if (validate.source)
            validate.source.evaluated = (0, codegen_1.stringify)(validate.evaluated);
        }
        sch.validate = validate;
        return sch;
      } catch (e) {
        delete sch.validate;
        delete sch.validateName;
        if (sourceCode)
          this.logger.error("Error compiling schema, function code:", sourceCode);
        throw e;
      } finally {
        this._compilations.delete(sch);
      }
    }
    exports.compileSchema = compileSchema;
    function resolveRef(root, baseId, ref) {
      var _a3;
      ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, ref);
      const schOrFunc = root.refs[ref];
      if (schOrFunc)
        return schOrFunc;
      let _sch = resolve2.call(this, root, ref);
      if (_sch === void 0) {
        const schema = (_a3 = root.localRefs) === null || _a3 === void 0 ? void 0 : _a3[ref];
        const { schemaId } = this.opts;
        if (schema)
          _sch = new SchemaEnv({ schema, schemaId, root, baseId });
      }
      if (_sch === void 0)
        return;
      return root.refs[ref] = inlineOrCompile.call(this, _sch);
    }
    exports.resolveRef = resolveRef;
    function inlineOrCompile(sch) {
      if ((0, resolve_1.inlineRef)(sch.schema, this.opts.inlineRefs))
        return sch.schema;
      return sch.validate ? sch : compileSchema.call(this, sch);
    }
    function getCompilingSchema(schEnv) {
      for (const sch of this._compilations) {
        if (sameSchemaEnv(sch, schEnv))
          return sch;
      }
    }
    exports.getCompilingSchema = getCompilingSchema;
    function sameSchemaEnv(s1, s2) {
      return s1.schema === s2.schema && s1.root === s2.root && s1.baseId === s2.baseId;
    }
    function resolve2(root, ref) {
      let sch;
      while (typeof (sch = this.refs[ref]) == "string")
        ref = sch;
      return sch || this.schemas[ref] || resolveSchema.call(this, root, ref);
    }
    function resolveSchema(root, ref) {
      const p = this.opts.uriResolver.parse(ref);
      const refPath = (0, resolve_1._getFullPath)(this.opts.uriResolver, p);
      let baseId = (0, resolve_1.getFullPath)(this.opts.uriResolver, root.baseId, void 0);
      if (Object.keys(root.schema).length > 0 && refPath === baseId) {
        return getJsonPointer.call(this, p, root);
      }
      const id = (0, resolve_1.normalizeId)(refPath);
      const schOrRef = this.refs[id] || this.schemas[id];
      if (typeof schOrRef == "string") {
        const sch = resolveSchema.call(this, root, schOrRef);
        if (typeof (sch === null || sch === void 0 ? void 0 : sch.schema) !== "object")
          return;
        return getJsonPointer.call(this, p, sch);
      }
      if (typeof (schOrRef === null || schOrRef === void 0 ? void 0 : schOrRef.schema) !== "object")
        return;
      if (!schOrRef.validate)
        compileSchema.call(this, schOrRef);
      if (id === (0, resolve_1.normalizeId)(ref)) {
        const { schema } = schOrRef;
        const { schemaId } = this.opts;
        const schId = schema[schemaId];
        if (schId)
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        return new SchemaEnv({ schema, schemaId, root, baseId });
      }
      return getJsonPointer.call(this, p, schOrRef);
    }
    exports.resolveSchema = resolveSchema;
    var PREVENT_SCOPE_CHANGE = /* @__PURE__ */ new Set([
      "properties",
      "patternProperties",
      "enum",
      "dependencies",
      "definitions"
    ]);
    function getJsonPointer(parsedRef, { baseId, schema, root }) {
      var _a3;
      if (((_a3 = parsedRef.fragment) === null || _a3 === void 0 ? void 0 : _a3[0]) !== "/")
        return;
      for (const part of parsedRef.fragment.slice(1).split("/")) {
        if (typeof schema === "boolean")
          return;
        const partSchema = schema[(0, util_1.unescapeFragment)(part)];
        if (partSchema === void 0)
          return;
        schema = partSchema;
        const schId = typeof schema === "object" && schema[this.opts.schemaId];
        if (!PREVENT_SCOPE_CHANGE.has(part) && schId) {
          baseId = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schId);
        }
      }
      let env;
      if (typeof schema != "boolean" && schema.$ref && !(0, util_1.schemaHasRulesButRef)(schema, this.RULES)) {
        const $ref = (0, resolve_1.resolveUrl)(this.opts.uriResolver, baseId, schema.$ref);
        env = resolveSchema.call(this, root, $ref);
      }
      const { schemaId } = this.opts;
      env = env || new SchemaEnv({ schema, schemaId, root, baseId });
      if (env.schema !== env.root.schema)
        return env;
      return void 0;
    }
  }
});

// node_modules/ajv/dist/refs/data.json
var require_data = __commonJS({
  "node_modules/ajv/dist/refs/data.json"(exports, module) {
    module.exports = {
      $id: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
      description: "Meta-schema for $data reference (JSON AnySchema extension proposal)",
      type: "object",
      required: ["$data"],
      properties: {
        $data: {
          type: "string",
          anyOf: [{ format: "relative-json-pointer" }, { format: "json-pointer" }]
        }
      },
      additionalProperties: false
    };
  }
});

// node_modules/fast-uri/lib/utils.js
var require_utils = __commonJS({
  "node_modules/fast-uri/lib/utils.js"(exports, module) {
    "use strict";
    var isUUID = RegExp.prototype.test.bind(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/iu);
    var isIPv4 = RegExp.prototype.test.bind(/^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)$/u);
    var isHexPair = RegExp.prototype.test.bind(/^[\da-f]{2}$/iu);
    var isUnreserved = RegExp.prototype.test.bind(/^[\da-z\-._~]$/iu);
    var isPathCharacter = RegExp.prototype.test.bind(/^[\da-z\-._~!$&'()*+,;=:@/]$/iu);
    function stringArrayToHexStripped(input) {
      let acc = "";
      let code = 0;
      let i = 0;
      for (i = 0; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (code === 48) {
          continue;
        }
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
        break;
      }
      for (i += 1; i < input.length; i++) {
        code = input[i].charCodeAt(0);
        if (!(code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102)) {
          return "";
        }
        acc += input[i];
      }
      return acc;
    }
    var nonSimpleDomain = RegExp.prototype.test.bind(/[^!"$&'()*+,\-.;=_`a-z{}~]/u);
    function consumeIsZone(buffer) {
      buffer.length = 0;
      return true;
    }
    function consumeHextets(buffer, address, output) {
      if (buffer.length) {
        const hex = stringArrayToHexStripped(buffer);
        if (hex !== "") {
          address.push(hex);
        } else {
          output.error = true;
          return false;
        }
        buffer.length = 0;
      }
      return true;
    }
    function getIPV6(input) {
      let tokenCount = 0;
      const output = { error: false, address: "", zone: "" };
      const address = [];
      const buffer = [];
      let endipv6Encountered = false;
      let endIpv6 = false;
      let consume = consumeHextets;
      for (let i = 0; i < input.length; i++) {
        const cursor = input[i];
        if (cursor === "[" || cursor === "]") {
          continue;
        }
        if (cursor === ":") {
          if (endipv6Encountered === true) {
            endIpv6 = true;
          }
          if (!consume(buffer, address, output)) {
            break;
          }
          if (++tokenCount > 7) {
            output.error = true;
            break;
          }
          if (i > 0 && input[i - 1] === ":") {
            endipv6Encountered = true;
          }
          address.push(":");
          continue;
        } else if (cursor === "%") {
          if (!consume(buffer, address, output)) {
            break;
          }
          consume = consumeIsZone;
        } else {
          buffer.push(cursor);
          continue;
        }
      }
      if (buffer.length) {
        if (consume === consumeIsZone) {
          output.zone = buffer.join("");
        } else if (endIpv6) {
          address.push(buffer.join(""));
        } else {
          address.push(stringArrayToHexStripped(buffer));
        }
      }
      output.address = address.join("");
      return output;
    }
    function normalizeIPv6(host) {
      if (findToken(host, ":") < 2) {
        return { host, isIPV6: false };
      }
      const ipv62 = getIPV6(host);
      if (!ipv62.error) {
        let newHost = ipv62.address;
        let escapedHost = ipv62.address;
        if (ipv62.zone) {
          newHost += "%" + ipv62.zone;
          escapedHost += "%25" + ipv62.zone;
        }
        return { host: newHost, isIPV6: true, escapedHost };
      } else {
        return { host, isIPV6: false };
      }
    }
    function findToken(str, token) {
      let ind = 0;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === token) ind++;
      }
      return ind;
    }
    function removeDotSegments(path) {
      let input = path;
      const output = [];
      let nextSlash = -1;
      let len = 0;
      while (len = input.length) {
        if (len === 1) {
          if (input === ".") {
            break;
          } else if (input === "/") {
            output.push("/");
            break;
          } else {
            output.push(input);
            break;
          }
        } else if (len === 2) {
          if (input[0] === ".") {
            if (input[1] === ".") {
              break;
            } else if (input[1] === "/") {
              input = input.slice(2);
              continue;
            }
          } else if (input[0] === "/") {
            if (input[1] === "." || input[1] === "/") {
              output.push("/");
              break;
            }
          }
        } else if (len === 3) {
          if (input === "/..") {
            if (output.length !== 0) {
              output.pop();
            }
            output.push("/");
            break;
          }
        }
        if (input[0] === ".") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(3);
              continue;
            }
          } else if (input[1] === "/") {
            input = input.slice(2);
            continue;
          }
        } else if (input[0] === "/") {
          if (input[1] === ".") {
            if (input[2] === "/") {
              input = input.slice(2);
              continue;
            } else if (input[2] === ".") {
              if (input[3] === "/") {
                input = input.slice(3);
                if (output.length !== 0) {
                  output.pop();
                }
                continue;
              }
            }
          }
        }
        if ((nextSlash = input.indexOf("/", 1)) === -1) {
          output.push(input);
          break;
        } else {
          output.push(input.slice(0, nextSlash));
          input = input.slice(nextSlash);
        }
      }
      return output.join("");
    }
    var HOST_DELIMS = { "@": "%40", "/": "%2F", "?": "%3F", "#": "%23", ":": "%3A" };
    var HOST_DELIM_RE = /[@/?#:]/g;
    var HOST_DELIM_NO_COLON_RE = /[@/?#]/g;
    function reescapeHostDelimiters(host, isIP) {
      const re = isIP ? HOST_DELIM_NO_COLON_RE : HOST_DELIM_RE;
      re.lastIndex = 0;
      return host.replace(re, (ch) => HOST_DELIMS[ch]);
    }
    function normalizePercentEncoding(input, decodeUnreserved = false) {
      if (input.indexOf("%") === -1) {
        return input;
      }
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (decodeUnreserved && isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        output += input[i];
      }
      return output;
    }
    function normalizePathEncoding(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            const normalizedHex = hex.toUpperCase();
            const decoded = String.fromCharCode(parseInt(normalizedHex, 16));
            if (decoded !== "." && isUnreserved(decoded)) {
              output += decoded;
            } else {
              output += "%" + normalizedHex;
            }
            i += 2;
            continue;
          }
        }
        if (isPathCharacter(input[i])) {
          output += input[i];
        } else {
          output += escape(input[i]);
        }
      }
      return output;
    }
    function escapePreservingEscapes(input) {
      let output = "";
      for (let i = 0; i < input.length; i++) {
        if (input[i] === "%" && i + 2 < input.length) {
          const hex = input.slice(i + 1, i + 3);
          if (isHexPair(hex)) {
            output += "%" + hex.toUpperCase();
            i += 2;
            continue;
          }
        }
        output += escape(input[i]);
      }
      return output;
    }
    function recomposeAuthority(component) {
      const uriTokens = [];
      if (component.userinfo !== void 0) {
        uriTokens.push(component.userinfo);
        uriTokens.push("@");
      }
      if (component.host !== void 0) {
        let host = unescape(component.host);
        if (!isIPv4(host)) {
          const ipV6res = normalizeIPv6(host);
          if (ipV6res.isIPV6 === true) {
            host = `[${ipV6res.escapedHost}]`;
          } else {
            host = reescapeHostDelimiters(host, false);
          }
        }
        uriTokens.push(host);
      }
      if (typeof component.port === "number" || typeof component.port === "string") {
        uriTokens.push(":");
        uriTokens.push(String(component.port));
      }
      return uriTokens.length ? uriTokens.join("") : void 0;
    }
    module.exports = {
      nonSimpleDomain,
      recomposeAuthority,
      reescapeHostDelimiters,
      normalizePercentEncoding,
      normalizePathEncoding,
      escapePreservingEscapes,
      removeDotSegments,
      isIPv4,
      isUUID,
      normalizeIPv6,
      stringArrayToHexStripped
    };
  }
});

// node_modules/fast-uri/lib/schemes.js
var require_schemes = __commonJS({
  "node_modules/fast-uri/lib/schemes.js"(exports, module) {
    "use strict";
    var { isUUID } = require_utils();
    var URN_REG = /([\da-z][\d\-a-z]{0,31}):((?:[\w!$'()*+,\-.:;=@]|%[\da-f]{2})+)/iu;
    var supportedSchemeNames = (
      /** @type {const} */
      [
        "http",
        "https",
        "ws",
        "wss",
        "urn",
        "urn:uuid"
      ]
    );
    function isValidSchemeName(name) {
      return supportedSchemeNames.indexOf(
        /** @type {*} */
        name
      ) !== -1;
    }
    function wsIsSecure(wsComponent) {
      if (wsComponent.secure === true) {
        return true;
      } else if (wsComponent.secure === false) {
        return false;
      } else if (wsComponent.scheme) {
        return wsComponent.scheme.length === 3 && (wsComponent.scheme[0] === "w" || wsComponent.scheme[0] === "W") && (wsComponent.scheme[1] === "s" || wsComponent.scheme[1] === "S") && (wsComponent.scheme[2] === "s" || wsComponent.scheme[2] === "S");
      } else {
        return false;
      }
    }
    function httpParse(component) {
      if (!component.host) {
        component.error = component.error || "HTTP URIs must have a host.";
      }
      return component;
    }
    function httpSerialize(component) {
      const secure = String(component.scheme).toLowerCase() === "https";
      if (component.port === (secure ? 443 : 80) || component.port === "") {
        component.port = void 0;
      }
      if (!component.path) {
        component.path = "/";
      }
      return component;
    }
    function wsParse(wsComponent) {
      wsComponent.secure = wsIsSecure(wsComponent);
      wsComponent.resourceName = (wsComponent.path || "/") + (wsComponent.query ? "?" + wsComponent.query : "");
      wsComponent.path = void 0;
      wsComponent.query = void 0;
      return wsComponent;
    }
    function wsSerialize(wsComponent) {
      if (wsComponent.port === (wsIsSecure(wsComponent) ? 443 : 80) || wsComponent.port === "") {
        wsComponent.port = void 0;
      }
      if (typeof wsComponent.secure === "boolean") {
        wsComponent.scheme = wsComponent.secure ? "wss" : "ws";
        wsComponent.secure = void 0;
      }
      if (wsComponent.resourceName) {
        const [path, query] = wsComponent.resourceName.split("?");
        wsComponent.path = path && path !== "/" ? path : void 0;
        wsComponent.query = query;
        wsComponent.resourceName = void 0;
      }
      wsComponent.fragment = void 0;
      return wsComponent;
    }
    function urnParse(urnComponent, options) {
      if (!urnComponent.path) {
        urnComponent.error = "URN can not be parsed";
        return urnComponent;
      }
      const matches = urnComponent.path.match(URN_REG);
      if (matches) {
        const scheme = options.scheme || urnComponent.scheme || "urn";
        urnComponent.nid = matches[1].toLowerCase();
        urnComponent.nss = matches[2];
        const urnScheme = `${scheme}:${options.nid || urnComponent.nid}`;
        const schemeHandler = getSchemeHandler(urnScheme);
        urnComponent.path = void 0;
        if (schemeHandler) {
          urnComponent = schemeHandler.parse(urnComponent, options);
        }
      } else {
        urnComponent.error = urnComponent.error || "URN can not be parsed.";
      }
      return urnComponent;
    }
    function urnSerialize(urnComponent, options) {
      if (urnComponent.nid === void 0) {
        throw new Error("URN without nid cannot be serialized");
      }
      const scheme = options.scheme || urnComponent.scheme || "urn";
      const nid = urnComponent.nid.toLowerCase();
      const urnScheme = `${scheme}:${options.nid || nid}`;
      const schemeHandler = getSchemeHandler(urnScheme);
      if (schemeHandler) {
        urnComponent = schemeHandler.serialize(urnComponent, options);
      }
      const uriComponent = urnComponent;
      const nss = urnComponent.nss;
      uriComponent.path = `${nid || options.nid}:${nss}`;
      options.skipEscape = true;
      return uriComponent;
    }
    function urnuuidParse(urnComponent, options) {
      const uuidComponent = urnComponent;
      uuidComponent.uuid = uuidComponent.nss;
      uuidComponent.nss = void 0;
      if (!options.tolerant && (!uuidComponent.uuid || !isUUID(uuidComponent.uuid))) {
        uuidComponent.error = uuidComponent.error || "UUID is not valid.";
      }
      return uuidComponent;
    }
    function urnuuidSerialize(uuidComponent) {
      const urnComponent = uuidComponent;
      urnComponent.nss = (uuidComponent.uuid || "").toLowerCase();
      return urnComponent;
    }
    var http = (
      /** @type {SchemeHandler} */
      {
        scheme: "http",
        domainHost: true,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var https = (
      /** @type {SchemeHandler} */
      {
        scheme: "https",
        domainHost: http.domainHost,
        parse: httpParse,
        serialize: httpSerialize
      }
    );
    var ws = (
      /** @type {SchemeHandler} */
      {
        scheme: "ws",
        domainHost: true,
        parse: wsParse,
        serialize: wsSerialize
      }
    );
    var wss = (
      /** @type {SchemeHandler} */
      {
        scheme: "wss",
        domainHost: ws.domainHost,
        parse: ws.parse,
        serialize: ws.serialize
      }
    );
    var urn = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn",
        parse: urnParse,
        serialize: urnSerialize,
        skipNormalize: true
      }
    );
    var urnuuid = (
      /** @type {SchemeHandler} */
      {
        scheme: "urn:uuid",
        parse: urnuuidParse,
        serialize: urnuuidSerialize,
        skipNormalize: true
      }
    );
    var SCHEMES = (
      /** @type {Record<SchemeName, SchemeHandler>} */
      {
        http,
        https,
        ws,
        wss,
        urn,
        "urn:uuid": urnuuid
      }
    );
    Object.setPrototypeOf(SCHEMES, null);
    function getSchemeHandler(scheme) {
      return scheme && (SCHEMES[
        /** @type {SchemeName} */
        scheme
      ] || SCHEMES[
        /** @type {SchemeName} */
        scheme.toLowerCase()
      ]) || void 0;
    }
    module.exports = {
      wsIsSecure,
      SCHEMES,
      isValidSchemeName,
      getSchemeHandler
    };
  }
});

// node_modules/fast-uri/index.js
var require_fast_uri = __commonJS({
  "node_modules/fast-uri/index.js"(exports, module) {
    "use strict";
    var { normalizeIPv6, removeDotSegments, recomposeAuthority, normalizePercentEncoding, normalizePathEncoding, escapePreservingEscapes, reescapeHostDelimiters, isIPv4, nonSimpleDomain } = require_utils();
    var { SCHEMES, getSchemeHandler } = require_schemes();
    function normalize(uri, options) {
      if (typeof uri === "string") {
        uri = /** @type {T} */
        normalizeString(uri, options);
      } else if (typeof uri === "object") {
        uri = /** @type {T} */
        parse3(serialize(uri, options), options);
      }
      return uri;
    }
    function resolve2(baseURI, relativeURI, options) {
      const schemelessOptions = options ? Object.assign({ scheme: "null" }, options) : { scheme: "null" };
      const { parsed: baseParsed, malformedAuthorityOrPort: baseMalformed } = parseWithStatus(baseURI, schemelessOptions);
      const { parsed: relativeParsed, malformedAuthorityOrPort: relativeMalformed } = parseWithStatus(relativeURI, schemelessOptions);
      if (baseMalformed || relativeMalformed) {
        throw new Error(baseParsed.error || relativeParsed.error || "URI is malformed.");
      }
      const resolved = resolveComponent(baseParsed, relativeParsed, schemelessOptions, true);
      schemelessOptions.skipEscape = true;
      return serialize(resolved, schemelessOptions);
    }
    function resolveComponent(base, relative, options, skipNormalization) {
      const target = {};
      if (!skipNormalization) {
        base = parse3(serialize(base, options), options);
        relative = parse3(serialize(relative, options), options);
      }
      options = options || {};
      if (!options.tolerant && relative.scheme) {
        target.scheme = relative.scheme;
        target.userinfo = relative.userinfo;
        target.host = relative.host;
        target.port = relative.port;
        target.path = removeDotSegments(relative.path || "");
        target.query = relative.query;
      } else {
        if (relative.userinfo !== void 0 || relative.host !== void 0 || relative.port !== void 0) {
          target.userinfo = relative.userinfo;
          target.host = relative.host;
          target.port = relative.port;
          target.path = removeDotSegments(relative.path || "");
          target.query = relative.query;
        } else {
          if (!relative.path) {
            target.path = base.path;
            if (relative.query !== void 0) {
              target.query = relative.query;
            } else {
              target.query = base.query;
            }
          } else {
            if (relative.path[0] === "/") {
              target.path = removeDotSegments(relative.path);
            } else {
              if ((base.userinfo !== void 0 || base.host !== void 0 || base.port !== void 0) && !base.path) {
                target.path = "/" + relative.path;
              } else if (!base.path) {
                target.path = relative.path;
              } else {
                target.path = base.path.slice(0, base.path.lastIndexOf("/") + 1) + relative.path;
              }
              target.path = removeDotSegments(target.path);
            }
            target.query = relative.query;
          }
          target.userinfo = base.userinfo;
          target.host = base.host;
          target.port = base.port;
        }
        target.scheme = base.scheme;
      }
      target.fragment = relative.fragment;
      return target;
    }
    function equal(uriA, uriB, options) {
      const normalizedA = normalizeComparableURI(uriA, options);
      const normalizedB = normalizeComparableURI(uriB, options);
      return normalizedA !== void 0 && normalizedB !== void 0 && normalizedA.toLowerCase() === normalizedB.toLowerCase();
    }
    function serialize(cmpts, opts) {
      const component = {
        host: cmpts.host,
        scheme: cmpts.scheme,
        userinfo: cmpts.userinfo,
        port: cmpts.port,
        path: cmpts.path,
        query: cmpts.query,
        nid: cmpts.nid,
        nss: cmpts.nss,
        uuid: cmpts.uuid,
        fragment: cmpts.fragment,
        reference: cmpts.reference,
        resourceName: cmpts.resourceName,
        secure: cmpts.secure,
        error: ""
      };
      const options = Object.assign({}, opts);
      const uriTokens = [];
      const schemeHandler = getSchemeHandler(options.scheme || component.scheme);
      if (schemeHandler && schemeHandler.serialize) schemeHandler.serialize(component, options);
      if (component.path !== void 0) {
        if (!options.skipEscape) {
          component.path = escapePreservingEscapes(component.path);
          if (component.scheme !== void 0) {
            component.path = component.path.split("%3A").join(":");
          }
        } else {
          component.path = normalizePercentEncoding(component.path);
        }
      }
      if (options.reference !== "suffix" && component.scheme) {
        uriTokens.push(component.scheme, ":");
      }
      const authority = recomposeAuthority(component);
      if (authority !== void 0) {
        if (options.reference !== "suffix") {
          uriTokens.push("//");
        }
        uriTokens.push(authority);
        if (component.path && component.path[0] !== "/") {
          uriTokens.push("/");
        }
      }
      if (component.path !== void 0) {
        let s = component.path;
        if (!options.absolutePath && (!schemeHandler || !schemeHandler.absolutePath)) {
          s = removeDotSegments(s);
        }
        if (authority === void 0 && s[0] === "/" && s[1] === "/") {
          s = "/%2F" + s.slice(2);
        }
        uriTokens.push(s);
      }
      if (component.query !== void 0) {
        uriTokens.push("?", component.query);
      }
      if (component.fragment !== void 0) {
        uriTokens.push("#", component.fragment);
      }
      return uriTokens.join("");
    }
    var URI_PARSE = /^(?:([^#/:?]+):)?(?:\/\/((?:([^#/?@]*)@)?(\[[^#/?\]]+\]|[^#/:?]*)(?::(\d*))?))?([^#?]*)(?:\?([^#]*))?(?:#((?:.|[\n\r])*))?/u;
    var AUTHORITY_PREFIX = /^(?:[^#/:?]+:)?\/\/([^/?#]*)/;
    var AUTHORITY_INTRODUCER_REGION = /^(?:[^#/:?]+:)?([/\\\t\n\r]*)/;
    function getParseError(parsed, matches) {
      if (matches[2] !== void 0 && parsed.path && parsed.path[0] !== "/") {
        return 'URI path must start with "/" when authority is present.';
      }
      if (typeof parsed.port === "number" && (parsed.port < 0 || parsed.port > 65535)) {
        return "URI port is malformed.";
      }
      return void 0;
    }
    function parseWithStatus(uri, opts) {
      const options = Object.assign({}, opts);
      const parsed = {
        scheme: void 0,
        userinfo: void 0,
        host: "",
        port: void 0,
        path: "",
        query: void 0,
        fragment: void 0
      };
      let malformedAuthorityOrPort = false;
      let isIP = false;
      if (options.reference === "suffix") {
        if (options.scheme) {
          uri = options.scheme + ":" + uri;
        } else {
          uri = "//" + uri;
        }
      }
      const authorityMatch = uri.match(AUTHORITY_PREFIX);
      if (authorityMatch !== null && authorityMatch[1].indexOf("\\") !== -1) {
        parsed.error = "URI authority must not contain a literal backslash.";
        malformedAuthorityOrPort = true;
      }
      const introducerMatch = uri.match(AUTHORITY_INTRODUCER_REGION);
      if (introducerMatch !== null) {
        const region = introducerMatch[1];
        const normalizedRegion = region.replace(/[\t\n\r]/g, "");
        if (normalizedRegion.length >= 2) {
          if (normalizedRegion.slice(0, 2) !== "//") {
            parsed.error = parsed.error || "URI authority must not contain a literal backslash.";
            malformedAuthorityOrPort = true;
          } else if (region.length !== normalizedRegion.length) {
            parsed.error = parsed.error || "URI authority introducer must not contain whitespace.";
            malformedAuthorityOrPort = true;
          }
        }
      }
      const matches = uri.match(URI_PARSE);
      if (matches) {
        parsed.scheme = matches[1];
        parsed.userinfo = matches[3];
        parsed.host = matches[4];
        parsed.port = parseInt(matches[5], 10);
        parsed.path = matches[6] || "";
        parsed.query = matches[7];
        parsed.fragment = matches[8];
        if (isNaN(parsed.port)) {
          parsed.port = matches[5];
        }
        const parseError = getParseError(parsed, matches);
        if (parseError !== void 0) {
          parsed.error = parsed.error || parseError;
          malformedAuthorityOrPort = true;
        }
        if (parsed.host) {
          const ipv4result = isIPv4(parsed.host);
          if (ipv4result === false) {
            const ipv6result = normalizeIPv6(parsed.host);
            parsed.host = ipv6result.host.toLowerCase();
            isIP = ipv6result.isIPV6;
          } else {
            isIP = true;
          }
        }
        if (parsed.scheme === void 0 && parsed.userinfo === void 0 && parsed.host === void 0 && parsed.port === void 0 && parsed.query === void 0 && !parsed.path) {
          parsed.reference = "same-document";
        } else if (parsed.scheme === void 0) {
          parsed.reference = "relative";
        } else if (parsed.fragment === void 0) {
          parsed.reference = "absolute";
        } else {
          parsed.reference = "uri";
        }
        if (options.reference && options.reference !== "suffix" && options.reference !== parsed.reference) {
          parsed.error = parsed.error || "URI is not a " + options.reference + " reference.";
        }
        const schemeHandler = getSchemeHandler(options.scheme || parsed.scheme);
        if (!options.unicodeSupport && (!schemeHandler || !schemeHandler.unicodeSupport)) {
          if (parsed.host && (options.domainHost || schemeHandler && schemeHandler.domainHost) && isIP === false && nonSimpleDomain(parsed.host)) {
            try {
              parsed.host = new URL("http://" + parsed.host).hostname;
            } catch (e) {
              parsed.error = parsed.error || "Host's domain name can not be converted to ASCII: " + e;
            }
          }
        }
        if (!schemeHandler || schemeHandler && !schemeHandler.skipNormalize) {
          if (uri.indexOf("%") !== -1) {
            if (parsed.scheme !== void 0) {
              parsed.scheme = unescape(parsed.scheme);
            }
            if (parsed.host !== void 0) {
              parsed.host = reescapeHostDelimiters(unescape(parsed.host), isIP);
            }
          }
          if (parsed.path) {
            parsed.path = normalizePathEncoding(parsed.path);
          }
          if (parsed.fragment) {
            try {
              parsed.fragment = encodeURI(decodeURIComponent(parsed.fragment));
            } catch {
              parsed.error = parsed.error || "URI malformed";
            }
          }
        }
        if (schemeHandler && schemeHandler.parse) {
          schemeHandler.parse(parsed, options);
        }
      } else {
        parsed.error = parsed.error || "URI can not be parsed.";
      }
      return { parsed, malformedAuthorityOrPort };
    }
    function parse3(uri, opts) {
      return parseWithStatus(uri, opts).parsed;
    }
    function normalizeString(uri, opts) {
      return normalizeStringWithStatus(uri, opts).normalized;
    }
    function normalizeStringWithStatus(uri, opts) {
      const { parsed, malformedAuthorityOrPort } = parseWithStatus(uri, opts);
      return {
        normalized: malformedAuthorityOrPort ? uri : serialize(parsed, opts),
        malformedAuthorityOrPort
      };
    }
    function normalizeComparableURI(uri, opts) {
      if (typeof uri === "string") {
        const { normalized, malformedAuthorityOrPort } = normalizeStringWithStatus(uri, opts);
        return malformedAuthorityOrPort ? void 0 : normalized;
      }
      if (typeof uri === "object") {
        return serialize(uri, opts);
      }
    }
    var fastUri = {
      SCHEMES,
      normalize,
      resolve: resolve2,
      resolveComponent,
      equal,
      serialize,
      parse: parse3
    };
    module.exports = fastUri;
    module.exports.default = fastUri;
    module.exports.fastUri = fastUri;
  }
});

// node_modules/ajv/dist/runtime/uri.js
var require_uri = __commonJS({
  "node_modules/ajv/dist/runtime/uri.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var uri = require_fast_uri();
    uri.code = 'require("ajv/dist/runtime/uri").default';
    exports.default = uri;
  }
});

// node_modules/ajv/dist/core.js
var require_core = __commonJS({
  "node_modules/ajv/dist/core.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = void 0;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    var ref_error_1 = require_ref_error();
    var rules_1 = require_rules();
    var compile_1 = require_compile();
    var codegen_2 = require_codegen();
    var resolve_1 = require_resolve();
    var dataType_1 = require_dataType();
    var util_1 = require_util();
    var $dataRefSchema = require_data();
    var uri_1 = require_uri();
    var defaultRegExp = (str, flags) => new RegExp(str, flags);
    defaultRegExp.code = "new RegExp";
    var META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"];
    var EXT_SCOPE_NAMES = /* @__PURE__ */ new Set([
      "validate",
      "serialize",
      "parse",
      "wrapper",
      "root",
      "schema",
      "keyword",
      "pattern",
      "formats",
      "validate$data",
      "func",
      "obj",
      "Error"
    ]);
    var removedOptions = {
      errorDataPath: "",
      format: "`validateFormats: false` can be used instead.",
      nullable: '"nullable" keyword is supported by default.',
      jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
      extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
      missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
      processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
      sourceCode: "Use option `code: {source: true}`",
      strictDefaults: "It is default now, see option `strict`.",
      strictKeywords: "It is default now, see option `strict`.",
      uniqueItems: '"uniqueItems" keyword is always validated.',
      unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
      cache: "Map is used as cache, schema object as key.",
      serialize: "Map is used as cache, schema object as key.",
      ajvErrors: "It is default now."
    };
    var deprecatedOptions = {
      ignoreKeywordsWithRef: "",
      jsPropertySyntax: "",
      unicode: '"minLength"/"maxLength" account for unicode characters by default.'
    };
    var MAX_EXPRESSION = 200;
    function requiredOptions(o) {
      var _a3, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
      const s = o.strict;
      const _optz = (_a3 = o.code) === null || _a3 === void 0 ? void 0 : _a3.optimize;
      const optimize2 = _optz === true || _optz === void 0 ? 1 : _optz || 0;
      const regExp = (_c = (_b = o.code) === null || _b === void 0 ? void 0 : _b.regExp) !== null && _c !== void 0 ? _c : defaultRegExp;
      const uriResolver = (_d = o.uriResolver) !== null && _d !== void 0 ? _d : uri_1.default;
      return {
        strictSchema: (_f = (_e = o.strictSchema) !== null && _e !== void 0 ? _e : s) !== null && _f !== void 0 ? _f : true,
        strictNumbers: (_h = (_g = o.strictNumbers) !== null && _g !== void 0 ? _g : s) !== null && _h !== void 0 ? _h : true,
        strictTypes: (_k = (_j = o.strictTypes) !== null && _j !== void 0 ? _j : s) !== null && _k !== void 0 ? _k : "log",
        strictTuples: (_m = (_l = o.strictTuples) !== null && _l !== void 0 ? _l : s) !== null && _m !== void 0 ? _m : "log",
        strictRequired: (_p = (_o = o.strictRequired) !== null && _o !== void 0 ? _o : s) !== null && _p !== void 0 ? _p : false,
        code: o.code ? { ...o.code, optimize: optimize2, regExp } : { optimize: optimize2, regExp },
        loopRequired: (_q = o.loopRequired) !== null && _q !== void 0 ? _q : MAX_EXPRESSION,
        loopEnum: (_r = o.loopEnum) !== null && _r !== void 0 ? _r : MAX_EXPRESSION,
        meta: (_s = o.meta) !== null && _s !== void 0 ? _s : true,
        messages: (_t = o.messages) !== null && _t !== void 0 ? _t : true,
        inlineRefs: (_u = o.inlineRefs) !== null && _u !== void 0 ? _u : true,
        schemaId: (_v = o.schemaId) !== null && _v !== void 0 ? _v : "$id",
        addUsedSchema: (_w = o.addUsedSchema) !== null && _w !== void 0 ? _w : true,
        validateSchema: (_x = o.validateSchema) !== null && _x !== void 0 ? _x : true,
        validateFormats: (_y = o.validateFormats) !== null && _y !== void 0 ? _y : true,
        unicodeRegExp: (_z = o.unicodeRegExp) !== null && _z !== void 0 ? _z : true,
        int32range: (_0 = o.int32range) !== null && _0 !== void 0 ? _0 : true,
        uriResolver
      };
    }
    var Ajv2 = class {
      constructor(opts = {}) {
        this.schemas = {};
        this.refs = {};
        this.formats = /* @__PURE__ */ Object.create(null);
        this._compilations = /* @__PURE__ */ new Set();
        this._loading = {};
        this._cache = /* @__PURE__ */ new Map();
        opts = this.opts = { ...opts, ...requiredOptions(opts) };
        const { es5, lines } = this.opts.code;
        this.scope = new codegen_2.ValueScope({ scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines });
        this.logger = getLogger(opts.logger);
        const formatOpt = opts.validateFormats;
        opts.validateFormats = false;
        this.RULES = (0, rules_1.getRules)();
        checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED");
        checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn");
        this._metaOpts = getMetaSchemaOptions.call(this);
        if (opts.formats)
          addInitialFormats.call(this);
        this._addVocabularies();
        this._addDefaultMetaSchema();
        if (opts.keywords)
          addInitialKeywords.call(this, opts.keywords);
        if (typeof opts.meta == "object")
          this.addMetaSchema(opts.meta);
        addInitialSchemas.call(this);
        opts.validateFormats = formatOpt;
      }
      _addVocabularies() {
        this.addKeyword("$async");
      }
      _addDefaultMetaSchema() {
        const { $data, meta: meta2, schemaId } = this.opts;
        let _dataRefSchema = $dataRefSchema;
        if (schemaId === "id") {
          _dataRefSchema = { ...$dataRefSchema };
          _dataRefSchema.id = _dataRefSchema.$id;
          delete _dataRefSchema.$id;
        }
        if (meta2 && $data)
          this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false);
      }
      defaultMeta() {
        const { meta: meta2, schemaId } = this.opts;
        return this.opts.defaultMeta = typeof meta2 == "object" ? meta2[schemaId] || meta2 : void 0;
      }
      validate(schemaKeyRef, data) {
        let v;
        if (typeof schemaKeyRef == "string") {
          v = this.getSchema(schemaKeyRef);
          if (!v)
            throw new Error(`no schema with key or ref "${schemaKeyRef}"`);
        } else {
          v = this.compile(schemaKeyRef);
        }
        const valid = v(data);
        if (!("$async" in v))
          this.errors = v.errors;
        return valid;
      }
      compile(schema, _meta) {
        const sch = this._addSchema(schema, _meta);
        return sch.validate || this._compileSchemaEnv(sch);
      }
      compileAsync(schema, meta2) {
        if (typeof this.opts.loadSchema != "function") {
          throw new Error("options.loadSchema should be a function");
        }
        const { loadSchema } = this.opts;
        return runCompileAsync.call(this, schema, meta2);
        async function runCompileAsync(_schema, _meta) {
          await loadMetaSchema.call(this, _schema.$schema);
          const sch = this._addSchema(_schema, _meta);
          return sch.validate || _compileAsync.call(this, sch);
        }
        async function loadMetaSchema($ref) {
          if ($ref && !this.getSchema($ref)) {
            await runCompileAsync.call(this, { $ref }, true);
          }
        }
        async function _compileAsync(sch) {
          try {
            return this._compileSchemaEnv(sch);
          } catch (e) {
            if (!(e instanceof ref_error_1.default))
              throw e;
            checkLoaded.call(this, e);
            await loadMissingSchema.call(this, e.missingSchema);
            return _compileAsync.call(this, sch);
          }
        }
        function checkLoaded({ missingSchema: ref, missingRef }) {
          if (this.refs[ref]) {
            throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`);
          }
        }
        async function loadMissingSchema(ref) {
          const _schema = await _loadSchema.call(this, ref);
          if (!this.refs[ref])
            await loadMetaSchema.call(this, _schema.$schema);
          if (!this.refs[ref])
            this.addSchema(_schema, ref, meta2);
        }
        async function _loadSchema(ref) {
          const p = this._loading[ref];
          if (p)
            return p;
          try {
            return await (this._loading[ref] = loadSchema(ref));
          } finally {
            delete this._loading[ref];
          }
        }
      }
      // Adds schema to the instance
      addSchema(schema, key2, _meta, _validateSchema = this.opts.validateSchema) {
        if (Array.isArray(schema)) {
          for (const sch of schema)
            this.addSchema(sch, void 0, _meta, _validateSchema);
          return this;
        }
        let id;
        if (typeof schema === "object") {
          const { schemaId } = this.opts;
          id = schema[schemaId];
          if (id !== void 0 && typeof id != "string") {
            throw new Error(`schema ${schemaId} must be string`);
          }
        }
        key2 = (0, resolve_1.normalizeId)(key2 || id);
        this._checkUnique(key2);
        this.schemas[key2] = this._addSchema(schema, _meta, key2, _validateSchema, true);
        return this;
      }
      // Add schema that will be used to validate other schemas
      // options in META_IGNORE_OPTIONS are alway set to false
      addMetaSchema(schema, key2, _validateSchema = this.opts.validateSchema) {
        this.addSchema(schema, key2, true, _validateSchema);
        return this;
      }
      //  Validate schema against its meta-schema
      validateSchema(schema, throwOrLogError) {
        if (typeof schema == "boolean")
          return true;
        let $schema;
        $schema = schema.$schema;
        if ($schema !== void 0 && typeof $schema != "string") {
          throw new Error("$schema must be a string");
        }
        $schema = $schema || this.opts.defaultMeta || this.defaultMeta();
        if (!$schema) {
          this.logger.warn("meta-schema not available");
          this.errors = null;
          return true;
        }
        const valid = this.validate($schema, schema);
        if (!valid && throwOrLogError) {
          const message = "schema is invalid: " + this.errorsText();
          if (this.opts.validateSchema === "log")
            this.logger.error(message);
          else
            throw new Error(message);
        }
        return valid;
      }
      // Get compiled schema by `key` or `ref`.
      // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
      getSchema(keyRef) {
        let sch;
        while (typeof (sch = getSchEnv.call(this, keyRef)) == "string")
          keyRef = sch;
        if (sch === void 0) {
          const { schemaId } = this.opts;
          const root = new compile_1.SchemaEnv({ schema: {}, schemaId });
          sch = compile_1.resolveSchema.call(this, root, keyRef);
          if (!sch)
            return;
          this.refs[keyRef] = sch;
        }
        return sch.validate || this._compileSchemaEnv(sch);
      }
      // Remove cached schema(s).
      // If no parameter is passed all schemas but meta-schemas are removed.
      // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
      // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
      removeSchema(schemaKeyRef) {
        if (schemaKeyRef instanceof RegExp) {
          this._removeAllSchemas(this.schemas, schemaKeyRef);
          this._removeAllSchemas(this.refs, schemaKeyRef);
          return this;
        }
        switch (typeof schemaKeyRef) {
          case "undefined":
            this._removeAllSchemas(this.schemas);
            this._removeAllSchemas(this.refs);
            this._cache.clear();
            return this;
          case "string": {
            const sch = getSchEnv.call(this, schemaKeyRef);
            if (typeof sch == "object")
              this._cache.delete(sch.schema);
            delete this.schemas[schemaKeyRef];
            delete this.refs[schemaKeyRef];
            return this;
          }
          case "object": {
            const cacheKey = schemaKeyRef;
            this._cache.delete(cacheKey);
            let id = schemaKeyRef[this.opts.schemaId];
            if (id) {
              id = (0, resolve_1.normalizeId)(id);
              delete this.schemas[id];
              delete this.refs[id];
            }
            return this;
          }
          default:
            throw new Error("ajv.removeSchema: invalid parameter");
        }
      }
      // add "vocabulary" - a collection of keywords
      addVocabulary(definitions) {
        for (const def of definitions)
          this.addKeyword(def);
        return this;
      }
      addKeyword(kwdOrDef, def) {
        let keyword;
        if (typeof kwdOrDef == "string") {
          keyword = kwdOrDef;
          if (typeof def == "object") {
            this.logger.warn("these parameters are deprecated, see docs for addKeyword");
            def.keyword = keyword;
          }
        } else if (typeof kwdOrDef == "object" && def === void 0) {
          def = kwdOrDef;
          keyword = def.keyword;
          if (Array.isArray(keyword) && !keyword.length) {
            throw new Error("addKeywords: keyword must be string or non-empty array");
          }
        } else {
          throw new Error("invalid addKeywords parameters");
        }
        checkKeyword.call(this, keyword, def);
        if (!def) {
          (0, util_1.eachItem)(keyword, (kwd) => addRule.call(this, kwd));
          return this;
        }
        keywordMetaschema.call(this, def);
        const definition = {
          ...def,
          type: (0, dataType_1.getJSONTypes)(def.type),
          schemaType: (0, dataType_1.getJSONTypes)(def.schemaType)
        };
        (0, util_1.eachItem)(keyword, definition.type.length === 0 ? (k) => addRule.call(this, k, definition) : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t)));
        return this;
      }
      getKeyword(keyword) {
        const rule = this.RULES.all[keyword];
        return typeof rule == "object" ? rule.definition : !!rule;
      }
      // Remove keyword
      removeKeyword(keyword) {
        const { RULES } = this;
        delete RULES.keywords[keyword];
        delete RULES.all[keyword];
        for (const group of RULES.rules) {
          const i = group.rules.findIndex((rule) => rule.keyword === keyword);
          if (i >= 0)
            group.rules.splice(i, 1);
        }
        return this;
      }
      // Add format
      addFormat(name, format) {
        if (typeof format == "string")
          format = new RegExp(format);
        this.formats[name] = format;
        return this;
      }
      errorsText(errors = this.errors, { separator = ", ", dataVar = "data" } = {}) {
        if (!errors || errors.length === 0)
          return "No errors";
        return errors.map((e) => `${dataVar}${e.instancePath} ${e.message}`).reduce((text, msg) => text + separator + msg);
      }
      $dataMetaSchema(metaSchema, keywordsJsonPointers) {
        const rules = this.RULES.all;
        metaSchema = JSON.parse(JSON.stringify(metaSchema));
        for (const jsonPointer of keywordsJsonPointers) {
          const segments = jsonPointer.split("/").slice(1);
          let keywords = metaSchema;
          for (const seg of segments)
            keywords = keywords[seg];
          for (const key2 in rules) {
            const rule = rules[key2];
            if (typeof rule != "object")
              continue;
            const { $data } = rule.definition;
            const schema = keywords[key2];
            if ($data && schema)
              keywords[key2] = schemaOrData(schema);
          }
        }
        return metaSchema;
      }
      _removeAllSchemas(schemas, regex) {
        for (const keyRef in schemas) {
          const sch = schemas[keyRef];
          if (!regex || regex.test(keyRef)) {
            if (typeof sch == "string") {
              delete schemas[keyRef];
            } else if (sch && !sch.meta) {
              this._cache.delete(sch.schema);
              delete schemas[keyRef];
            }
          }
        }
      }
      _addSchema(schema, meta2, baseId, validateSchema = this.opts.validateSchema, addSchema = this.opts.addUsedSchema) {
        let id;
        const { schemaId } = this.opts;
        if (typeof schema == "object") {
          id = schema[schemaId];
        } else {
          if (this.opts.jtd)
            throw new Error("schema must be object");
          else if (typeof schema != "boolean")
            throw new Error("schema must be object or boolean");
        }
        let sch = this._cache.get(schema);
        if (sch !== void 0)
          return sch;
        baseId = (0, resolve_1.normalizeId)(id || baseId);
        const localRefs = resolve_1.getSchemaRefs.call(this, schema, baseId);
        sch = new compile_1.SchemaEnv({ schema, schemaId, meta: meta2, baseId, localRefs });
        this._cache.set(sch.schema, sch);
        if (addSchema && !baseId.startsWith("#")) {
          if (baseId)
            this._checkUnique(baseId);
          this.refs[baseId] = sch;
        }
        if (validateSchema)
          this.validateSchema(schema, true);
        return sch;
      }
      _checkUnique(id) {
        if (this.schemas[id] || this.refs[id]) {
          throw new Error(`schema with key or id "${id}" already exists`);
        }
      }
      _compileSchemaEnv(sch) {
        if (sch.meta)
          this._compileMetaSchema(sch);
        else
          compile_1.compileSchema.call(this, sch);
        if (!sch.validate)
          throw new Error("ajv implementation error");
        return sch.validate;
      }
      _compileMetaSchema(sch) {
        const currentOpts = this.opts;
        this.opts = this._metaOpts;
        try {
          compile_1.compileSchema.call(this, sch);
        } finally {
          this.opts = currentOpts;
        }
      }
    };
    Ajv2.ValidationError = validation_error_1.default;
    Ajv2.MissingRefError = ref_error_1.default;
    exports.default = Ajv2;
    function checkOptions(checkOpts, options, msg, log2 = "error") {
      for (const key2 in checkOpts) {
        const opt = key2;
        if (opt in options)
          this.logger[log2](`${msg}: option ${key2}. ${checkOpts[opt]}`);
      }
    }
    function getSchEnv(keyRef) {
      keyRef = (0, resolve_1.normalizeId)(keyRef);
      return this.schemas[keyRef] || this.refs[keyRef];
    }
    function addInitialSchemas() {
      const optsSchemas = this.opts.schemas;
      if (!optsSchemas)
        return;
      if (Array.isArray(optsSchemas))
        this.addSchema(optsSchemas);
      else
        for (const key2 in optsSchemas)
          this.addSchema(optsSchemas[key2], key2);
    }
    function addInitialFormats() {
      for (const name in this.opts.formats) {
        const format = this.opts.formats[name];
        if (format)
          this.addFormat(name, format);
      }
    }
    function addInitialKeywords(defs) {
      if (Array.isArray(defs)) {
        this.addVocabulary(defs);
        return;
      }
      this.logger.warn("keywords option as map is deprecated, pass array");
      for (const keyword in defs) {
        const def = defs[keyword];
        if (!def.keyword)
          def.keyword = keyword;
        this.addKeyword(def);
      }
    }
    function getMetaSchemaOptions() {
      const metaOpts = { ...this.opts };
      for (const opt of META_IGNORE_OPTIONS)
        delete metaOpts[opt];
      return metaOpts;
    }
    var noLogs = { log() {
    }, warn() {
    }, error() {
    } };
    function getLogger(logger) {
      if (logger === false)
        return noLogs;
      if (logger === void 0)
        return console;
      if (logger.log && logger.warn && logger.error)
        return logger;
      throw new Error("logger must implement log, warn and error methods");
    }
    var KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i;
    function checkKeyword(keyword, def) {
      const { RULES } = this;
      (0, util_1.eachItem)(keyword, (kwd) => {
        if (RULES.keywords[kwd])
          throw new Error(`Keyword ${kwd} is already defined`);
        if (!KEYWORD_NAME.test(kwd))
          throw new Error(`Keyword ${kwd} has invalid name`);
      });
      if (!def)
        return;
      if (def.$data && !("code" in def || "validate" in def)) {
        throw new Error('$data keyword must have "code" or "validate" function');
      }
    }
    function addRule(keyword, definition, dataType) {
      var _a3;
      const post = definition === null || definition === void 0 ? void 0 : definition.post;
      if (dataType && post)
        throw new Error('keyword with "post" flag cannot have "type"');
      const { RULES } = this;
      let ruleGroup = post ? RULES.post : RULES.rules.find(({ type: t }) => t === dataType);
      if (!ruleGroup) {
        ruleGroup = { type: dataType, rules: [] };
        RULES.rules.push(ruleGroup);
      }
      RULES.keywords[keyword] = true;
      if (!definition)
        return;
      const rule = {
        keyword,
        definition: {
          ...definition,
          type: (0, dataType_1.getJSONTypes)(definition.type),
          schemaType: (0, dataType_1.getJSONTypes)(definition.schemaType)
        }
      };
      if (definition.before)
        addBeforeRule.call(this, ruleGroup, rule, definition.before);
      else
        ruleGroup.rules.push(rule);
      RULES.all[keyword] = rule;
      (_a3 = definition.implements) === null || _a3 === void 0 ? void 0 : _a3.forEach((kwd) => this.addKeyword(kwd));
    }
    function addBeforeRule(ruleGroup, rule, before) {
      const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before);
      if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule);
      } else {
        ruleGroup.rules.push(rule);
        this.logger.warn(`rule ${before} is not defined`);
      }
    }
    function keywordMetaschema(def) {
      let { metaSchema } = def;
      if (metaSchema === void 0)
        return;
      if (def.$data && this.opts.$data)
        metaSchema = schemaOrData(metaSchema);
      def.validateSchema = this.compile(metaSchema, true);
    }
    var $dataRef = {
      $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#"
    };
    function schemaOrData(schema) {
      return { anyOf: [schema, $dataRef] };
    }
  }
});

// node_modules/ajv/dist/vocabularies/core/id.js
var require_id = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/id.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var def = {
      keyword: "id",
      code() {
        throw new Error('NOT SUPPORTED: keyword "id", use "$id" for schema ID');
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/ref.js
var require_ref = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/ref.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.callRef = exports.getValidate = void 0;
    var ref_error_1 = require_ref_error();
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var compile_1 = require_compile();
    var util_1 = require_util();
    var def = {
      keyword: "$ref",
      schemaType: "string",
      code(cxt) {
        const { gen, schema: $ref, it } = cxt;
        const { baseId, schemaEnv: env, validateName, opts, self } = it;
        const { root } = env;
        if (($ref === "#" || $ref === "#/") && baseId === root.baseId)
          return callRootRef();
        const schOrEnv = compile_1.resolveRef.call(self, root, baseId, $ref);
        if (schOrEnv === void 0)
          throw new ref_error_1.default(it.opts.uriResolver, baseId, $ref);
        if (schOrEnv instanceof compile_1.SchemaEnv)
          return callValidate(schOrEnv);
        return inlineRefSchema(schOrEnv);
        function callRootRef() {
          if (env === root)
            return callRef(cxt, validateName, env, env.$async);
          const rootName = gen.scopeValue("root", { ref: root });
          return callRef(cxt, (0, codegen_1._)`${rootName}.validate`, root, root.$async);
        }
        function callValidate(sch) {
          const v = getValidate(cxt, sch);
          callRef(cxt, v, sch, sch.$async);
        }
        function inlineRefSchema(sch) {
          const schName = gen.scopeValue("schema", opts.code.source === true ? { ref: sch, code: (0, codegen_1.stringify)(sch) } : { ref: sch });
          const valid = gen.name("valid");
          const schCxt = cxt.subschema({
            schema: sch,
            dataTypes: [],
            schemaPath: codegen_1.nil,
            topSchemaRef: schName,
            errSchemaPath: $ref
          }, valid);
          cxt.mergeEvaluated(schCxt);
          cxt.ok(valid);
        }
      }
    };
    function getValidate(cxt, sch) {
      const { gen } = cxt;
      return sch.validate ? gen.scopeValue("validate", { ref: sch.validate }) : (0, codegen_1._)`${gen.scopeValue("wrapper", { ref: sch })}.validate`;
    }
    exports.getValidate = getValidate;
    function callRef(cxt, v, sch, $async) {
      const { gen, it } = cxt;
      const { allErrors, schemaEnv: env, opts } = it;
      const passCxt = opts.passContext ? names_1.default.this : codegen_1.nil;
      if ($async)
        callAsyncRef();
      else
        callSyncRef();
      function callAsyncRef() {
        if (!env.$async)
          throw new Error("async schema referenced by sync schema");
        const valid = gen.let("valid");
        gen.try(() => {
          gen.code((0, codegen_1._)`await ${(0, code_1.callValidateCode)(cxt, v, passCxt)}`);
          addEvaluatedFrom(v);
          if (!allErrors)
            gen.assign(valid, true);
        }, (e) => {
          gen.if((0, codegen_1._)`!(${e} instanceof ${it.ValidationError})`, () => gen.throw(e));
          addErrorsFrom(e);
          if (!allErrors)
            gen.assign(valid, false);
        });
        cxt.ok(valid);
      }
      function callSyncRef() {
        cxt.result((0, code_1.callValidateCode)(cxt, v, passCxt), () => addEvaluatedFrom(v), () => addErrorsFrom(v));
      }
      function addErrorsFrom(source) {
        const errs = (0, codegen_1._)`${source}.errors`;
        gen.assign(names_1.default.vErrors, (0, codegen_1._)`${names_1.default.vErrors} === null ? ${errs} : ${names_1.default.vErrors}.concat(${errs})`);
        gen.assign(names_1.default.errors, (0, codegen_1._)`${names_1.default.vErrors}.length`);
      }
      function addEvaluatedFrom(source) {
        var _a3;
        if (!it.opts.unevaluated)
          return;
        const schEvaluated = (_a3 = sch === null || sch === void 0 ? void 0 : sch.validate) === null || _a3 === void 0 ? void 0 : _a3.evaluated;
        if (it.props !== true) {
          if (schEvaluated && !schEvaluated.dynamicProps) {
            if (schEvaluated.props !== void 0) {
              it.props = util_1.mergeEvaluated.props(gen, schEvaluated.props, it.props);
            }
          } else {
            const props = gen.var("props", (0, codegen_1._)`${source}.evaluated.props`);
            it.props = util_1.mergeEvaluated.props(gen, props, it.props, codegen_1.Name);
          }
        }
        if (it.items !== true) {
          if (schEvaluated && !schEvaluated.dynamicItems) {
            if (schEvaluated.items !== void 0) {
              it.items = util_1.mergeEvaluated.items(gen, schEvaluated.items, it.items);
            }
          } else {
            const items = gen.var("items", (0, codegen_1._)`${source}.evaluated.items`);
            it.items = util_1.mergeEvaluated.items(gen, items, it.items, codegen_1.Name);
          }
        }
      }
    }
    exports.callRef = callRef;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/core/index.js
var require_core2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/core/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var id_1 = require_id();
    var ref_1 = require_ref();
    var core = [
      "$schema",
      "$id",
      "$defs",
      "$vocabulary",
      { keyword: "$comment" },
      "definitions",
      id_1.default,
      ref_1.default
    ];
    exports.default = core;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitNumber.js
var require_limitNumber = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitNumber.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      maximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      minimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      exclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      exclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error2 = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`must be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    var def = {
      keyword: Object.keys(KWDs),
      type: "number",
      schemaType: "number",
      $data: true,
      error: error2,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        cxt.fail$data((0, codegen_1._)`${data} ${KWDs[keyword].fail} ${schemaCode} || isNaN(${data})`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/multipleOf.js
var require_multipleOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/multipleOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error2 = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must be multiple of ${schemaCode}`,
      params: ({ schemaCode }) => (0, codegen_1._)`{multipleOf: ${schemaCode}}`
    };
    var def = {
      keyword: "multipleOf",
      type: "number",
      schemaType: "number",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, data, schemaCode, it } = cxt;
        const prec = it.opts.multipleOfPrecision;
        const res = gen.let("res");
        const invalid = prec ? (0, codegen_1._)`Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}` : (0, codegen_1._)`${res} !== parseInt(${res})`;
        cxt.fail$data((0, codegen_1._)`(${schemaCode} === 0 || (${res} = ${data}/${schemaCode}, ${invalid}))`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitLength.js
var require_limitLength = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitLength.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var ucs2length_1 = require_ucs2length();
    var error2 = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxLength" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} characters`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxLength", "minLength"],
      type: "string",
      schemaType: "number",
      $data: true,
      error: error2,
      code(cxt) {
        const { keyword, data, schemaCode, it } = cxt;
        const op = keyword === "maxLength" ? codegen_1.operators.GT : codegen_1.operators.LT;
        const len = it.opts.unicode === false ? (0, codegen_1._)`${data}.length` : (0, codegen_1._)`${(0, util_1.useFunc)(cxt.gen, ucs2length_1.default)}(${data})`;
        cxt.fail$data((0, codegen_1._)`${len} ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/pattern.js
var require_pattern = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/pattern.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var util_1 = require_util();
    var codegen_1 = require_codegen();
    var error2 = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match pattern "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{pattern: ${schemaCode}}`
    };
    var def = {
      keyword: "pattern",
      type: "string",
      schemaType: "string",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const u = it.opts.unicodeRegExp ? "u" : "";
        if ($data) {
          const { regExp } = it.opts.code;
          const regExpCode = regExp.code === "new RegExp" ? (0, codegen_1._)`new RegExp` : (0, util_1.useFunc)(gen, regExp);
          const valid = gen.let("valid");
          gen.try(() => gen.assign(valid, (0, codegen_1._)`${regExpCode}(${schemaCode}, ${u}).test(${data})`), () => gen.assign(valid, false));
          cxt.fail$data((0, codegen_1._)`!${valid}`);
        } else {
          const regExp = (0, code_1.usePattern)(cxt, schema);
          cxt.fail$data((0, codegen_1._)`!${regExp}.test(${data})`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitProperties.js
var require_limitProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error2 = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxProperties" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} properties`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxProperties", "minProperties"],
      type: "object",
      schemaType: "number",
      $data: true,
      error: error2,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxProperties" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`Object.keys(${data}).length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/required.js
var require_required = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/required.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error2 = {
      message: ({ params: { missingProperty } }) => (0, codegen_1.str)`must have required property '${missingProperty}'`,
      params: ({ params: { missingProperty } }) => (0, codegen_1._)`{missingProperty: ${missingProperty}}`
    };
    var def = {
      keyword: "required",
      type: "object",
      schemaType: "array",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, schema, schemaCode, data, $data, it } = cxt;
        const { opts } = it;
        if (!$data && schema.length === 0)
          return;
        const useLoop = schema.length >= opts.loopRequired;
        if (it.allErrors)
          allErrorsMode();
        else
          exitOnErrorMode();
        if (opts.strictRequired) {
          const props = cxt.parentSchema.properties;
          const { definedProperties } = cxt.it;
          for (const requiredKey of schema) {
            if ((props === null || props === void 0 ? void 0 : props[requiredKey]) === void 0 && !definedProperties.has(requiredKey)) {
              const schemaPath = it.schemaEnv.baseId + it.errSchemaPath;
              const msg = `required property "${requiredKey}" is not defined at "${schemaPath}" (strictRequired)`;
              (0, util_1.checkStrictMode)(it, msg, it.opts.strictRequired);
            }
          }
        }
        function allErrorsMode() {
          if (useLoop || $data) {
            cxt.block$data(codegen_1.nil, loopAllRequired);
          } else {
            for (const prop of schema) {
              (0, code_1.checkReportMissingProp)(cxt, prop);
            }
          }
        }
        function exitOnErrorMode() {
          const missing = gen.let("missing");
          if (useLoop || $data) {
            const valid = gen.let("valid", true);
            cxt.block$data(valid, () => loopUntilMissing(missing, valid));
            cxt.ok(valid);
          } else {
            gen.if((0, code_1.checkMissingProp)(cxt, schema, missing));
            (0, code_1.reportMissingProp)(cxt, missing);
            gen.else();
          }
        }
        function loopAllRequired() {
          gen.forOf("prop", schemaCode, (prop) => {
            cxt.setParams({ missingProperty: prop });
            gen.if((0, code_1.noPropertyInData)(gen, data, prop, opts.ownProperties), () => cxt.error());
          });
        }
        function loopUntilMissing(missing, valid) {
          cxt.setParams({ missingProperty: missing });
          gen.forOf(missing, schemaCode, () => {
            gen.assign(valid, (0, code_1.propertyInData)(gen, data, missing, opts.ownProperties));
            gen.if((0, codegen_1.not)(valid), () => {
              cxt.error();
              gen.break();
            });
          }, codegen_1.nil);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/limitItems.js
var require_limitItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/limitItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error2 = {
      message({ keyword, schemaCode }) {
        const comp = keyword === "maxItems" ? "more" : "fewer";
        return (0, codegen_1.str)`must NOT have ${comp} than ${schemaCode} items`;
      },
      params: ({ schemaCode }) => (0, codegen_1._)`{limit: ${schemaCode}}`
    };
    var def = {
      keyword: ["maxItems", "minItems"],
      type: "array",
      schemaType: "number",
      $data: true,
      error: error2,
      code(cxt) {
        const { keyword, data, schemaCode } = cxt;
        const op = keyword === "maxItems" ? codegen_1.operators.GT : codegen_1.operators.LT;
        cxt.fail$data((0, codegen_1._)`${data}.length ${op} ${schemaCode}`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/runtime/equal.js
var require_equal = __commonJS({
  "node_modules/ajv/dist/runtime/equal.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var equal = require_fast_deep_equal();
    equal.code = 'require("ajv/dist/runtime/equal").default';
    exports.default = equal;
  }
});

// node_modules/ajv/dist/vocabularies/validation/uniqueItems.js
var require_uniqueItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/uniqueItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var dataType_1 = require_dataType();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error2 = {
      message: ({ params: { i, j } }) => (0, codegen_1.str)`must NOT have duplicate items (items ## ${j} and ${i} are identical)`,
      params: ({ params: { i, j } }) => (0, codegen_1._)`{i: ${i}, j: ${j}}`
    };
    var def = {
      keyword: "uniqueItems",
      type: "array",
      schemaType: "boolean",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, data, $data, schema, parentSchema, schemaCode, it } = cxt;
        if (!$data && !schema)
          return;
        const valid = gen.let("valid");
        const itemTypes = parentSchema.items ? (0, dataType_1.getSchemaTypes)(parentSchema.items) : [];
        cxt.block$data(valid, validateUniqueItems, (0, codegen_1._)`${schemaCode} === false`);
        cxt.ok(valid);
        function validateUniqueItems() {
          const i = gen.let("i", (0, codegen_1._)`${data}.length`);
          const j = gen.let("j");
          cxt.setParams({ i, j });
          gen.assign(valid, true);
          gen.if((0, codegen_1._)`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j));
        }
        function canOptimize() {
          return itemTypes.length > 0 && !itemTypes.some((t) => t === "object" || t === "array");
        }
        function loopN(i, j) {
          const item = gen.name("item");
          const wrongType = (0, dataType_1.checkDataTypes)(itemTypes, item, it.opts.strictNumbers, dataType_1.DataType.Wrong);
          const indices = gen.const("indices", (0, codegen_1._)`{}`);
          gen.for((0, codegen_1._)`;${i}--;`, () => {
            gen.let(item, (0, codegen_1._)`${data}[${i}]`);
            gen.if(wrongType, (0, codegen_1._)`continue`);
            if (itemTypes.length > 1)
              gen.if((0, codegen_1._)`typeof ${item} == "string"`, (0, codegen_1._)`${item} += "_"`);
            gen.if((0, codegen_1._)`typeof ${indices}[${item}] == "number"`, () => {
              gen.assign(j, (0, codegen_1._)`${indices}[${item}]`);
              cxt.error();
              gen.assign(valid, false).break();
            }).code((0, codegen_1._)`${indices}[${item}] = ${i}`);
          });
        }
        function loopN2(i, j) {
          const eql = (0, util_1.useFunc)(gen, equal_1.default);
          const outer = gen.name("outer");
          gen.label(outer).for((0, codegen_1._)`;${i}--;`, () => gen.for((0, codegen_1._)`${j} = ${i}; ${j}--;`, () => gen.if((0, codegen_1._)`${eql}(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error();
            gen.assign(valid, false).break(outer);
          })));
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/const.js
var require_const = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/const.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error2 = {
      message: "must be equal to constant",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValue: ${schemaCode}}`
    };
    var def = {
      keyword: "const",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, data, $data, schemaCode, schema } = cxt;
        if ($data || schema && typeof schema == "object") {
          cxt.fail$data((0, codegen_1._)`!${(0, util_1.useFunc)(gen, equal_1.default)}(${data}, ${schemaCode})`);
        } else {
          cxt.fail((0, codegen_1._)`${schema} !== ${data}`);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/enum.js
var require_enum = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/enum.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var equal_1 = require_equal();
    var error2 = {
      message: "must be equal to one of the allowed values",
      params: ({ schemaCode }) => (0, codegen_1._)`{allowedValues: ${schemaCode}}`
    };
    var def = {
      keyword: "enum",
      schemaType: "array",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        if (!$data && schema.length === 0)
          throw new Error("enum must have non-empty array");
        const useLoop = schema.length >= it.opts.loopEnum;
        let eql;
        const getEql = () => eql !== null && eql !== void 0 ? eql : eql = (0, util_1.useFunc)(gen, equal_1.default);
        let valid;
        if (useLoop || $data) {
          valid = gen.let("valid");
          cxt.block$data(valid, loopEnum);
        } else {
          if (!Array.isArray(schema))
            throw new Error("ajv implementation error");
          const vSchema = gen.const("vSchema", schemaCode);
          valid = (0, codegen_1.or)(...schema.map((_x, i) => equalCode(vSchema, i)));
        }
        cxt.pass(valid);
        function loopEnum() {
          gen.assign(valid, false);
          gen.forOf("v", schemaCode, (v) => gen.if((0, codegen_1._)`${getEql()}(${data}, ${v})`, () => gen.assign(valid, true).break()));
        }
        function equalCode(vSchema, i) {
          const sch = schema[i];
          return typeof sch === "object" && sch !== null ? (0, codegen_1._)`${getEql()}(${data}, ${vSchema}[${i}])` : (0, codegen_1._)`${data} === ${sch}`;
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/validation/index.js
var require_validation = __commonJS({
  "node_modules/ajv/dist/vocabularies/validation/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var limitNumber_1 = require_limitNumber();
    var multipleOf_1 = require_multipleOf();
    var limitLength_1 = require_limitLength();
    var pattern_1 = require_pattern();
    var limitProperties_1 = require_limitProperties();
    var required_1 = require_required();
    var limitItems_1 = require_limitItems();
    var uniqueItems_1 = require_uniqueItems();
    var const_1 = require_const();
    var enum_1 = require_enum();
    var validation = [
      // number
      limitNumber_1.default,
      multipleOf_1.default,
      // string
      limitLength_1.default,
      pattern_1.default,
      // object
      limitProperties_1.default,
      required_1.default,
      // array
      limitItems_1.default,
      uniqueItems_1.default,
      // any
      { keyword: "type", schemaType: ["string", "array"] },
      { keyword: "nullable", schemaType: "boolean" },
      const_1.default,
      enum_1.default
    ];
    exports.default = validation;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalItems.js
var require_additionalItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateAdditionalItems = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error2 = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "additionalItems",
      type: "array",
      schemaType: ["boolean", "object"],
      before: "uniqueItems",
      error: error2,
      code(cxt) {
        const { parentSchema, it } = cxt;
        const { items } = parentSchema;
        if (!Array.isArray(items)) {
          (0, util_1.checkStrictMode)(it, '"additionalItems" is ignored when "items" is not an array of schemas');
          return;
        }
        validateAdditionalItems(cxt, items);
      }
    };
    function validateAdditionalItems(cxt, items) {
      const { gen, schema, data, keyword, it } = cxt;
      it.items = true;
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      if (schema === false) {
        cxt.setParams({ len: items.length });
        cxt.pass((0, codegen_1._)`${len} <= ${items.length}`);
      } else if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
        const valid = gen.var("valid", (0, codegen_1._)`${len} <= ${items.length}`);
        gen.if((0, codegen_1.not)(valid), () => validateItems(valid));
        cxt.ok(valid);
      }
      function validateItems(valid) {
        gen.forRange("i", items.length, len, (i) => {
          cxt.subschema({ keyword, dataProp: i, dataPropType: util_1.Type.Num }, valid);
          if (!it.allErrors)
            gen.if((0, codegen_1.not)(valid), () => gen.break());
        });
      }
    }
    exports.validateAdditionalItems = validateAdditionalItems;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items.js
var require_items = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateTuple = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "array", "boolean"],
      before: "uniqueItems",
      code(cxt) {
        const { schema, it } = cxt;
        if (Array.isArray(schema))
          return validateTuple(cxt, "additionalItems", schema);
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    function validateTuple(cxt, extraItems, schArr = cxt.schema) {
      const { gen, parentSchema, data, keyword, it } = cxt;
      checkStrictTuple(parentSchema);
      if (it.opts.unevaluated && schArr.length && it.items !== true) {
        it.items = util_1.mergeEvaluated.items(gen, schArr.length, it.items);
      }
      const valid = gen.name("valid");
      const len = gen.const("len", (0, codegen_1._)`${data}.length`);
      schArr.forEach((sch, i) => {
        if ((0, util_1.alwaysValidSchema)(it, sch))
          return;
        gen.if((0, codegen_1._)`${len} > ${i}`, () => cxt.subschema({
          keyword,
          schemaProp: i,
          dataProp: i
        }, valid));
        cxt.ok(valid);
      });
      function checkStrictTuple(sch) {
        const { opts, errSchemaPath } = it;
        const l = schArr.length;
        const fullTuple = l === sch.minItems && (l === sch.maxItems || sch[extraItems] === false);
        if (opts.strictTuples && !fullTuple) {
          const msg = `"${keyword}" is ${l}-tuple, but minItems or maxItems/${extraItems} are not specified or different at path "${errSchemaPath}"`;
          (0, util_1.checkStrictMode)(it, msg, opts.strictTuples);
        }
      }
    }
    exports.validateTuple = validateTuple;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/prefixItems.js
var require_prefixItems = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/prefixItems.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var items_1 = require_items();
    var def = {
      keyword: "prefixItems",
      type: "array",
      schemaType: ["array"],
      before: "uniqueItems",
      code: (cxt) => (0, items_1.validateTuple)(cxt, "items")
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/items2020.js
var require_items2020 = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/items2020.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    var additionalItems_1 = require_additionalItems();
    var error2 = {
      message: ({ params: { len } }) => (0, codegen_1.str)`must NOT have more than ${len} items`,
      params: ({ params: { len } }) => (0, codegen_1._)`{limit: ${len}}`
    };
    var def = {
      keyword: "items",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      error: error2,
      code(cxt) {
        const { schema, parentSchema, it } = cxt;
        const { prefixItems } = parentSchema;
        it.items = true;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        if (prefixItems)
          (0, additionalItems_1.validateAdditionalItems)(cxt, prefixItems);
        else
          cxt.ok((0, code_1.validateArray)(cxt));
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/contains.js
var require_contains = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/contains.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error2 = {
      message: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1.str)`must contain at least ${min} valid item(s)` : (0, codegen_1.str)`must contain at least ${min} and no more than ${max} valid item(s)`,
      params: ({ params: { min, max } }) => max === void 0 ? (0, codegen_1._)`{minContains: ${min}}` : (0, codegen_1._)`{minContains: ${min}, maxContains: ${max}}`
    };
    var def = {
      keyword: "contains",
      type: "array",
      schemaType: ["object", "boolean"],
      before: "uniqueItems",
      trackErrors: true,
      error: error2,
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        let min;
        let max;
        const { minContains, maxContains } = parentSchema;
        if (it.opts.next) {
          min = minContains === void 0 ? 1 : minContains;
          max = maxContains;
        } else {
          min = 1;
        }
        const len = gen.const("len", (0, codegen_1._)`${data}.length`);
        cxt.setParams({ min, max });
        if (max === void 0 && min === 0) {
          (0, util_1.checkStrictMode)(it, `"minContains" == 0 without "maxContains": "contains" keyword ignored`);
          return;
        }
        if (max !== void 0 && min > max) {
          (0, util_1.checkStrictMode)(it, `"minContains" > "maxContains" is always invalid`);
          cxt.fail();
          return;
        }
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          let cond = (0, codegen_1._)`${len} >= ${min}`;
          if (max !== void 0)
            cond = (0, codegen_1._)`${cond} && ${len} <= ${max}`;
          cxt.pass(cond);
          return;
        }
        it.items = true;
        const valid = gen.name("valid");
        if (max === void 0 && min === 1) {
          validateItems(valid, () => gen.if(valid, () => gen.break()));
        } else if (min === 0) {
          gen.let(valid, true);
          if (max !== void 0)
            gen.if((0, codegen_1._)`${data}.length > 0`, validateItemsWithCount);
        } else {
          gen.let(valid, false);
          validateItemsWithCount();
        }
        cxt.result(valid, () => cxt.reset());
        function validateItemsWithCount() {
          const schValid = gen.name("_valid");
          const count = gen.let("count", 0);
          validateItems(schValid, () => gen.if(schValid, () => checkLimits(count)));
        }
        function validateItems(_valid, block) {
          gen.forRange("i", 0, len, (i) => {
            cxt.subschema({
              keyword: "contains",
              dataProp: i,
              dataPropType: util_1.Type.Num,
              compositeRule: true
            }, _valid);
            block();
          });
        }
        function checkLimits(count) {
          gen.code((0, codegen_1._)`${count}++`);
          if (max === void 0) {
            gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true).break());
          } else {
            gen.if((0, codegen_1._)`${count} > ${max}`, () => gen.assign(valid, false).break());
            if (min === 1)
              gen.assign(valid, true);
            else
              gen.if((0, codegen_1._)`${count} >= ${min}`, () => gen.assign(valid, true));
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/dependencies.js
var require_dependencies = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/dependencies.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateSchemaDeps = exports.validatePropertyDeps = exports.error = void 0;
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var code_1 = require_code2();
    exports.error = {
      message: ({ params: { property, depsCount, deps } }) => {
        const property_ies = depsCount === 1 ? "property" : "properties";
        return (0, codegen_1.str)`must have ${property_ies} ${deps} when property ${property} is present`;
      },
      params: ({ params: { property, depsCount, deps, missingProperty } }) => (0, codegen_1._)`{property: ${property},
    missingProperty: ${missingProperty},
    depsCount: ${depsCount},
    deps: ${deps}}`
      // TODO change to reference
    };
    var def = {
      keyword: "dependencies",
      type: "object",
      schemaType: "object",
      error: exports.error,
      code(cxt) {
        const [propDeps, schDeps] = splitDependencies(cxt);
        validatePropertyDeps(cxt, propDeps);
        validateSchemaDeps(cxt, schDeps);
      }
    };
    function splitDependencies({ schema }) {
      const propertyDeps = {};
      const schemaDeps = {};
      for (const key2 in schema) {
        if (key2 === "__proto__")
          continue;
        const deps = Array.isArray(schema[key2]) ? propertyDeps : schemaDeps;
        deps[key2] = schema[key2];
      }
      return [propertyDeps, schemaDeps];
    }
    function validatePropertyDeps(cxt, propertyDeps = cxt.schema) {
      const { gen, data, it } = cxt;
      if (Object.keys(propertyDeps).length === 0)
        return;
      const missing = gen.let("missing");
      for (const prop in propertyDeps) {
        const deps = propertyDeps[prop];
        if (deps.length === 0)
          continue;
        const hasProperty = (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties);
        cxt.setParams({
          property: prop,
          depsCount: deps.length,
          deps: deps.join(", ")
        });
        if (it.allErrors) {
          gen.if(hasProperty, () => {
            for (const depProp of deps) {
              (0, code_1.checkReportMissingProp)(cxt, depProp);
            }
          });
        } else {
          gen.if((0, codegen_1._)`${hasProperty} && (${(0, code_1.checkMissingProp)(cxt, deps, missing)})`);
          (0, code_1.reportMissingProp)(cxt, missing);
          gen.else();
        }
      }
    }
    exports.validatePropertyDeps = validatePropertyDeps;
    function validateSchemaDeps(cxt, schemaDeps = cxt.schema) {
      const { gen, data, keyword, it } = cxt;
      const valid = gen.name("valid");
      for (const prop in schemaDeps) {
        if ((0, util_1.alwaysValidSchema)(it, schemaDeps[prop]))
          continue;
        gen.if(
          (0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties),
          () => {
            const schCxt = cxt.subschema({ keyword, schemaProp: prop }, valid);
            cxt.mergeValidEvaluated(schCxt, valid);
          },
          () => gen.var(valid, true)
          // TODO var
        );
        cxt.ok(valid);
      }
    }
    exports.validateSchemaDeps = validateSchemaDeps;
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/propertyNames.js
var require_propertyNames = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/propertyNames.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error2 = {
      message: "property name must be valid",
      params: ({ params }) => (0, codegen_1._)`{propertyName: ${params.propertyName}}`
    };
    var def = {
      keyword: "propertyNames",
      type: "object",
      schemaType: ["object", "boolean"],
      error: error2,
      code(cxt) {
        const { gen, schema, data, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema))
          return;
        const valid = gen.name("valid");
        gen.forIn("key", data, (key2) => {
          cxt.setParams({ propertyName: key2 });
          cxt.subschema({
            keyword: "propertyNames",
            data: key2,
            dataTypes: ["string"],
            propertyName: key2,
            compositeRule: true
          }, valid);
          gen.if((0, codegen_1.not)(valid), () => {
            cxt.error(true);
            if (!it.allErrors)
              gen.break();
          });
        });
        cxt.ok(valid);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js
var require_additionalProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/additionalProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var names_1 = require_names();
    var util_1 = require_util();
    var error2 = {
      message: "must NOT have additional properties",
      params: ({ params }) => (0, codegen_1._)`{additionalProperty: ${params.additionalProperty}}`
    };
    var def = {
      keyword: "additionalProperties",
      type: ["object"],
      schemaType: ["boolean", "object"],
      allowUndefined: true,
      trackErrors: true,
      error: error2,
      code(cxt) {
        const { gen, schema, parentSchema, data, errsCount, it } = cxt;
        if (!errsCount)
          throw new Error("ajv implementation error");
        const { allErrors, opts } = it;
        it.props = true;
        if (opts.removeAdditional !== "all" && (0, util_1.alwaysValidSchema)(it, schema))
          return;
        const props = (0, code_1.allSchemaProperties)(parentSchema.properties);
        const patProps = (0, code_1.allSchemaProperties)(parentSchema.patternProperties);
        checkAdditionalProperties();
        cxt.ok((0, codegen_1._)`${errsCount} === ${names_1.default.errors}`);
        function checkAdditionalProperties() {
          gen.forIn("key", data, (key2) => {
            if (!props.length && !patProps.length)
              additionalPropertyCode(key2);
            else
              gen.if(isAdditional(key2), () => additionalPropertyCode(key2));
          });
        }
        function isAdditional(key2) {
          let definedProp;
          if (props.length > 8) {
            const propsSchema = (0, util_1.schemaRefOrVal)(it, parentSchema.properties, "properties");
            definedProp = (0, code_1.isOwnProperty)(gen, propsSchema, key2);
          } else if (props.length) {
            definedProp = (0, codegen_1.or)(...props.map((p) => (0, codegen_1._)`${key2} === ${p}`));
          } else {
            definedProp = codegen_1.nil;
          }
          if (patProps.length) {
            definedProp = (0, codegen_1.or)(definedProp, ...patProps.map((p) => (0, codegen_1._)`${(0, code_1.usePattern)(cxt, p)}.test(${key2})`));
          }
          return (0, codegen_1.not)(definedProp);
        }
        function deleteAdditional(key2) {
          gen.code((0, codegen_1._)`delete ${data}[${key2}]`);
        }
        function additionalPropertyCode(key2) {
          if (opts.removeAdditional === "all" || opts.removeAdditional && schema === false) {
            deleteAdditional(key2);
            return;
          }
          if (schema === false) {
            cxt.setParams({ additionalProperty: key2 });
            cxt.error();
            if (!allErrors)
              gen.break();
            return;
          }
          if (typeof schema == "object" && !(0, util_1.alwaysValidSchema)(it, schema)) {
            const valid = gen.name("valid");
            if (opts.removeAdditional === "failing") {
              applyAdditionalSchema(key2, valid, false);
              gen.if((0, codegen_1.not)(valid), () => {
                cxt.reset();
                deleteAdditional(key2);
              });
            } else {
              applyAdditionalSchema(key2, valid);
              if (!allErrors)
                gen.if((0, codegen_1.not)(valid), () => gen.break());
            }
          }
        }
        function applyAdditionalSchema(key2, valid, errors) {
          const subschema = {
            keyword: "additionalProperties",
            dataProp: key2,
            dataPropType: util_1.Type.Str
          };
          if (errors === false) {
            Object.assign(subschema, {
              compositeRule: true,
              createErrors: false,
              allErrors: false
            });
          }
          cxt.subschema(subschema, valid);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/properties.js
var require_properties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/properties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var validate_1 = require_validate();
    var code_1 = require_code2();
    var util_1 = require_util();
    var additionalProperties_1 = require_additionalProperties();
    var def = {
      keyword: "properties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, parentSchema, data, it } = cxt;
        if (it.opts.removeAdditional === "all" && parentSchema.additionalProperties === void 0) {
          additionalProperties_1.default.code(new validate_1.KeywordCxt(it, additionalProperties_1.default, "additionalProperties"));
        }
        const allProps = (0, code_1.allSchemaProperties)(schema);
        for (const prop of allProps) {
          it.definedProperties.add(prop);
        }
        if (it.opts.unevaluated && allProps.length && it.props !== true) {
          it.props = util_1.mergeEvaluated.props(gen, (0, util_1.toHash)(allProps), it.props);
        }
        const properties = allProps.filter((p) => !(0, util_1.alwaysValidSchema)(it, schema[p]));
        if (properties.length === 0)
          return;
        const valid = gen.name("valid");
        for (const prop of properties) {
          if (hasDefault(prop)) {
            applyPropertySchema(prop);
          } else {
            gen.if((0, code_1.propertyInData)(gen, data, prop, it.opts.ownProperties));
            applyPropertySchema(prop);
            if (!it.allErrors)
              gen.else().var(valid, true);
            gen.endIf();
          }
          cxt.it.definedProperties.add(prop);
          cxt.ok(valid);
        }
        function hasDefault(prop) {
          return it.opts.useDefaults && !it.compositeRule && schema[prop].default !== void 0;
        }
        function applyPropertySchema(prop) {
          cxt.subschema({
            keyword: "properties",
            schemaProp: prop,
            dataProp: prop
          }, valid);
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/patternProperties.js
var require_patternProperties = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/patternProperties.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var util_2 = require_util();
    var def = {
      keyword: "patternProperties",
      type: "object",
      schemaType: "object",
      code(cxt) {
        const { gen, schema, data, parentSchema, it } = cxt;
        const { opts } = it;
        const patterns = (0, code_1.allSchemaProperties)(schema);
        const alwaysValidPatterns = patterns.filter((p) => (0, util_1.alwaysValidSchema)(it, schema[p]));
        if (patterns.length === 0 || alwaysValidPatterns.length === patterns.length && (!it.opts.unevaluated || it.props === true)) {
          return;
        }
        const checkProperties = opts.strictSchema && !opts.allowMatchingProperties && parentSchema.properties;
        const valid = gen.name("valid");
        if (it.props !== true && !(it.props instanceof codegen_1.Name)) {
          it.props = (0, util_2.evaluatedPropsToName)(gen, it.props);
        }
        const { props } = it;
        validatePatternProperties();
        function validatePatternProperties() {
          for (const pat of patterns) {
            if (checkProperties)
              checkMatchingProperties(pat);
            if (it.allErrors) {
              validateProperties(pat);
            } else {
              gen.var(valid, true);
              validateProperties(pat);
              gen.if(valid);
            }
          }
        }
        function checkMatchingProperties(pat) {
          for (const prop in checkProperties) {
            if (new RegExp(pat).test(prop)) {
              (0, util_1.checkStrictMode)(it, `property ${prop} matches pattern ${pat} (use allowMatchingProperties)`);
            }
          }
        }
        function validateProperties(pat) {
          gen.forIn("key", data, (key2) => {
            gen.if((0, codegen_1._)`${(0, code_1.usePattern)(cxt, pat)}.test(${key2})`, () => {
              const alwaysValid = alwaysValidPatterns.includes(pat);
              if (!alwaysValid) {
                cxt.subschema({
                  keyword: "patternProperties",
                  schemaProp: pat,
                  dataProp: key2,
                  dataPropType: util_2.Type.Str
                }, valid);
              }
              if (it.opts.unevaluated && props !== true) {
                gen.assign((0, codegen_1._)`${props}[${key2}]`, true);
              } else if (!alwaysValid && !it.allErrors) {
                gen.if((0, codegen_1.not)(valid), () => gen.break());
              }
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/not.js
var require_not = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/not.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "not",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      code(cxt) {
        const { gen, schema, it } = cxt;
        if ((0, util_1.alwaysValidSchema)(it, schema)) {
          cxt.fail();
          return;
        }
        const valid = gen.name("valid");
        cxt.subschema({
          keyword: "not",
          compositeRule: true,
          createErrors: false,
          allErrors: false
        }, valid);
        cxt.failResult(valid, () => cxt.reset(), () => cxt.error());
      },
      error: { message: "must NOT be valid" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/anyOf.js
var require_anyOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/anyOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var code_1 = require_code2();
    var def = {
      keyword: "anyOf",
      schemaType: "array",
      trackErrors: true,
      code: code_1.validateUnion,
      error: { message: "must match a schema in anyOf" }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/oneOf.js
var require_oneOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/oneOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error2 = {
      message: "must match exactly one schema in oneOf",
      params: ({ params }) => (0, codegen_1._)`{passingSchemas: ${params.passing}}`
    };
    var def = {
      keyword: "oneOf",
      schemaType: "array",
      trackErrors: true,
      error: error2,
      code(cxt) {
        const { gen, schema, parentSchema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        if (it.opts.discriminator && parentSchema.discriminator)
          return;
        const schArr = schema;
        const valid = gen.let("valid", false);
        const passing = gen.let("passing", null);
        const schValid = gen.name("_valid");
        cxt.setParams({ passing });
        gen.block(validateOneOf);
        cxt.result(valid, () => cxt.reset(), () => cxt.error(true));
        function validateOneOf() {
          schArr.forEach((sch, i) => {
            let schCxt;
            if ((0, util_1.alwaysValidSchema)(it, sch)) {
              gen.var(schValid, true);
            } else {
              schCxt = cxt.subschema({
                keyword: "oneOf",
                schemaProp: i,
                compositeRule: true
              }, schValid);
            }
            if (i > 0) {
              gen.if((0, codegen_1._)`${schValid} && ${valid}`).assign(valid, false).assign(passing, (0, codegen_1._)`[${passing}, ${i}]`).else();
            }
            gen.if(schValid, () => {
              gen.assign(valid, true);
              gen.assign(passing, i);
              if (schCxt)
                cxt.mergeEvaluated(schCxt, codegen_1.Name);
            });
          });
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/allOf.js
var require_allOf = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/allOf.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: "allOf",
      schemaType: "array",
      code(cxt) {
        const { gen, schema, it } = cxt;
        if (!Array.isArray(schema))
          throw new Error("ajv implementation error");
        const valid = gen.name("valid");
        schema.forEach((sch, i) => {
          if ((0, util_1.alwaysValidSchema)(it, sch))
            return;
          const schCxt = cxt.subschema({ keyword: "allOf", schemaProp: i }, valid);
          cxt.ok(valid);
          cxt.mergeEvaluated(schCxt);
        });
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/if.js
var require_if = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/if.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var util_1 = require_util();
    var error2 = {
      message: ({ params }) => (0, codegen_1.str)`must match "${params.ifClause}" schema`,
      params: ({ params }) => (0, codegen_1._)`{failingKeyword: ${params.ifClause}}`
    };
    var def = {
      keyword: "if",
      schemaType: ["object", "boolean"],
      trackErrors: true,
      error: error2,
      code(cxt) {
        const { gen, parentSchema, it } = cxt;
        if (parentSchema.then === void 0 && parentSchema.else === void 0) {
          (0, util_1.checkStrictMode)(it, '"if" without "then" and "else" is ignored');
        }
        const hasThen = hasSchema(it, "then");
        const hasElse = hasSchema(it, "else");
        if (!hasThen && !hasElse)
          return;
        const valid = gen.let("valid", true);
        const schValid = gen.name("_valid");
        validateIf();
        cxt.reset();
        if (hasThen && hasElse) {
          const ifClause = gen.let("ifClause");
          cxt.setParams({ ifClause });
          gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause));
        } else if (hasThen) {
          gen.if(schValid, validateClause("then"));
        } else {
          gen.if((0, codegen_1.not)(schValid), validateClause("else"));
        }
        cxt.pass(valid, () => cxt.error(true));
        function validateIf() {
          const schCxt = cxt.subschema({
            keyword: "if",
            compositeRule: true,
            createErrors: false,
            allErrors: false
          }, schValid);
          cxt.mergeEvaluated(schCxt);
        }
        function validateClause(keyword, ifClause) {
          return () => {
            const schCxt = cxt.subschema({ keyword }, schValid);
            gen.assign(valid, schValid);
            cxt.mergeValidEvaluated(schCxt, valid);
            if (ifClause)
              gen.assign(ifClause, (0, codegen_1._)`${keyword}`);
            else
              cxt.setParams({ ifClause: keyword });
          };
        }
      }
    };
    function hasSchema(it, keyword) {
      const schema = it.schema[keyword];
      return schema !== void 0 && !(0, util_1.alwaysValidSchema)(it, schema);
    }
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/thenElse.js
var require_thenElse = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/thenElse.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var util_1 = require_util();
    var def = {
      keyword: ["then", "else"],
      schemaType: ["object", "boolean"],
      code({ keyword, parentSchema, it }) {
        if (parentSchema.if === void 0)
          (0, util_1.checkStrictMode)(it, `"${keyword}" without "if" is ignored`);
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/applicator/index.js
var require_applicator = __commonJS({
  "node_modules/ajv/dist/vocabularies/applicator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var additionalItems_1 = require_additionalItems();
    var prefixItems_1 = require_prefixItems();
    var items_1 = require_items();
    var items2020_1 = require_items2020();
    var contains_1 = require_contains();
    var dependencies_1 = require_dependencies();
    var propertyNames_1 = require_propertyNames();
    var additionalProperties_1 = require_additionalProperties();
    var properties_1 = require_properties();
    var patternProperties_1 = require_patternProperties();
    var not_1 = require_not();
    var anyOf_1 = require_anyOf();
    var oneOf_1 = require_oneOf();
    var allOf_1 = require_allOf();
    var if_1 = require_if();
    var thenElse_1 = require_thenElse();
    function getApplicator(draft2020 = false) {
      const applicator = [
        // any
        not_1.default,
        anyOf_1.default,
        oneOf_1.default,
        allOf_1.default,
        if_1.default,
        thenElse_1.default,
        // object
        propertyNames_1.default,
        additionalProperties_1.default,
        dependencies_1.default,
        properties_1.default,
        patternProperties_1.default
      ];
      if (draft2020)
        applicator.push(prefixItems_1.default, items2020_1.default);
      else
        applicator.push(additionalItems_1.default, items_1.default);
      applicator.push(contains_1.default);
      return applicator;
    }
    exports.default = getApplicator;
  }
});

// node_modules/ajv/dist/vocabularies/format/format.js
var require_format = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/format.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var error2 = {
      message: ({ schemaCode }) => (0, codegen_1.str)`must match format "${schemaCode}"`,
      params: ({ schemaCode }) => (0, codegen_1._)`{format: ${schemaCode}}`
    };
    var def = {
      keyword: "format",
      type: ["number", "string"],
      schemaType: "string",
      $data: true,
      error: error2,
      code(cxt, ruleType) {
        const { gen, data, $data, schema, schemaCode, it } = cxt;
        const { opts, errSchemaPath, schemaEnv, self } = it;
        if (!opts.validateFormats)
          return;
        if ($data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fDef = gen.const("fDef", (0, codegen_1._)`${fmts}[${schemaCode}]`);
          const fType = gen.let("fType");
          const format = gen.let("format");
          gen.if((0, codegen_1._)`typeof ${fDef} == "object" && !(${fDef} instanceof RegExp)`, () => gen.assign(fType, (0, codegen_1._)`${fDef}.type || "string"`).assign(format, (0, codegen_1._)`${fDef}.validate`), () => gen.assign(fType, (0, codegen_1._)`"string"`).assign(format, fDef));
          cxt.fail$data((0, codegen_1.or)(unknownFmt(), invalidFmt()));
          function unknownFmt() {
            if (opts.strictSchema === false)
              return codegen_1.nil;
            return (0, codegen_1._)`${schemaCode} && !${format}`;
          }
          function invalidFmt() {
            const callFormat = schemaEnv.$async ? (0, codegen_1._)`(${fDef}.async ? await ${format}(${data}) : ${format}(${data}))` : (0, codegen_1._)`${format}(${data})`;
            const validData = (0, codegen_1._)`(typeof ${format} == "function" ? ${callFormat} : ${format}.test(${data}))`;
            return (0, codegen_1._)`${format} && ${format} !== true && ${fType} === ${ruleType} && !${validData}`;
          }
        }
        function validateFormat() {
          const formatDef = self.formats[schema];
          if (!formatDef) {
            unknownFormat();
            return;
          }
          if (formatDef === true)
            return;
          const [fmtType, format, fmtRef] = getFormat(formatDef);
          if (fmtType === ruleType)
            cxt.pass(validCondition());
          function unknownFormat() {
            if (opts.strictSchema === false) {
              self.logger.warn(unknownMsg());
              return;
            }
            throw new Error(unknownMsg());
            function unknownMsg() {
              return `unknown format "${schema}" ignored in schema at path "${errSchemaPath}"`;
            }
          }
          function getFormat(fmtDef) {
            const code = fmtDef instanceof RegExp ? (0, codegen_1.regexpCode)(fmtDef) : opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(schema)}` : void 0;
            const fmt = gen.scopeValue("formats", { key: schema, ref: fmtDef, code });
            if (typeof fmtDef == "object" && !(fmtDef instanceof RegExp)) {
              return [fmtDef.type || "string", fmtDef.validate, (0, codegen_1._)`${fmt}.validate`];
            }
            return ["string", fmtDef, fmt];
          }
          function validCondition() {
            if (typeof formatDef == "object" && !(formatDef instanceof RegExp) && formatDef.async) {
              if (!schemaEnv.$async)
                throw new Error("async format in sync schema");
              return (0, codegen_1._)`await ${fmtRef}(${data})`;
            }
            return typeof format == "function" ? (0, codegen_1._)`${fmtRef}(${data})` : (0, codegen_1._)`${fmtRef}.test(${data})`;
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/vocabularies/format/index.js
var require_format2 = __commonJS({
  "node_modules/ajv/dist/vocabularies/format/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var format_1 = require_format();
    var format = [format_1.default];
    exports.default = format;
  }
});

// node_modules/ajv/dist/vocabularies/metadata.js
var require_metadata = __commonJS({
  "node_modules/ajv/dist/vocabularies/metadata.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.contentVocabulary = exports.metadataVocabulary = void 0;
    exports.metadataVocabulary = [
      "title",
      "description",
      "default",
      "deprecated",
      "readOnly",
      "writeOnly",
      "examples"
    ];
    exports.contentVocabulary = [
      "contentMediaType",
      "contentEncoding",
      "contentSchema"
    ];
  }
});

// node_modules/ajv/dist/vocabularies/draft7.js
var require_draft7 = __commonJS({
  "node_modules/ajv/dist/vocabularies/draft7.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var core_1 = require_core2();
    var validation_1 = require_validation();
    var applicator_1 = require_applicator();
    var format_1 = require_format2();
    var metadata_1 = require_metadata();
    var draft7Vocabularies = [
      core_1.default,
      validation_1.default,
      (0, applicator_1.default)(),
      format_1.default,
      metadata_1.metadataVocabulary,
      metadata_1.contentVocabulary
    ];
    exports.default = draft7Vocabularies;
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/types.js
var require_types = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/types.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DiscrError = void 0;
    var DiscrError;
    (function(DiscrError2) {
      DiscrError2["Tag"] = "tag";
      DiscrError2["Mapping"] = "mapping";
    })(DiscrError || (exports.DiscrError = DiscrError = {}));
  }
});

// node_modules/ajv/dist/vocabularies/discriminator/index.js
var require_discriminator = __commonJS({
  "node_modules/ajv/dist/vocabularies/discriminator/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var codegen_1 = require_codegen();
    var types_1 = require_types();
    var compile_1 = require_compile();
    var ref_error_1 = require_ref_error();
    var util_1 = require_util();
    var error2 = {
      message: ({ params: { discrError, tagName } }) => discrError === types_1.DiscrError.Tag ? `tag "${tagName}" must be string` : `value of tag "${tagName}" must be in oneOf`,
      params: ({ params: { discrError, tag, tagName } }) => (0, codegen_1._)`{error: ${discrError}, tag: ${tagName}, tagValue: ${tag}}`
    };
    var def = {
      keyword: "discriminator",
      type: "object",
      schemaType: "object",
      error: error2,
      code(cxt) {
        const { gen, data, schema, parentSchema, it } = cxt;
        const { oneOf } = parentSchema;
        if (!it.opts.discriminator) {
          throw new Error("discriminator: requires discriminator option");
        }
        const tagName = schema.propertyName;
        if (typeof tagName != "string")
          throw new Error("discriminator: requires propertyName");
        if (schema.mapping)
          throw new Error("discriminator: mapping is not supported");
        if (!oneOf)
          throw new Error("discriminator: requires oneOf keyword");
        const valid = gen.let("valid", false);
        const tag = gen.const("tag", (0, codegen_1._)`${data}${(0, codegen_1.getProperty)(tagName)}`);
        gen.if((0, codegen_1._)`typeof ${tag} == "string"`, () => validateMapping(), () => cxt.error(false, { discrError: types_1.DiscrError.Tag, tag, tagName }));
        cxt.ok(valid);
        function validateMapping() {
          const mapping = getMapping();
          gen.if(false);
          for (const tagValue in mapping) {
            gen.elseIf((0, codegen_1._)`${tag} === ${tagValue}`);
            gen.assign(valid, applyTagSchema(mapping[tagValue]));
          }
          gen.else();
          cxt.error(false, { discrError: types_1.DiscrError.Mapping, tag, tagName });
          gen.endIf();
        }
        function applyTagSchema(schemaProp) {
          const _valid = gen.name("valid");
          const schCxt = cxt.subschema({ keyword: "oneOf", schemaProp }, _valid);
          cxt.mergeEvaluated(schCxt, codegen_1.Name);
          return _valid;
        }
        function getMapping() {
          var _a3;
          const oneOfMapping = {};
          const topRequired = hasRequired(parentSchema);
          let tagRequired = true;
          for (let i = 0; i < oneOf.length; i++) {
            let sch = oneOf[i];
            if ((sch === null || sch === void 0 ? void 0 : sch.$ref) && !(0, util_1.schemaHasRulesButRef)(sch, it.self.RULES)) {
              const ref = sch.$ref;
              sch = compile_1.resolveRef.call(it.self, it.schemaEnv.root, it.baseId, ref);
              if (sch instanceof compile_1.SchemaEnv)
                sch = sch.schema;
              if (sch === void 0)
                throw new ref_error_1.default(it.opts.uriResolver, it.baseId, ref);
            }
            const propSch = (_a3 = sch === null || sch === void 0 ? void 0 : sch.properties) === null || _a3 === void 0 ? void 0 : _a3[tagName];
            if (typeof propSch != "object") {
              throw new Error(`discriminator: oneOf subschemas (or referenced schemas) must have "properties/${tagName}"`);
            }
            tagRequired = tagRequired && (topRequired || hasRequired(sch));
            addMappings(propSch, i);
          }
          if (!tagRequired)
            throw new Error(`discriminator: "${tagName}" must be required`);
          return oneOfMapping;
          function hasRequired({ required: required2 }) {
            return Array.isArray(required2) && required2.includes(tagName);
          }
          function addMappings(sch, i) {
            if (sch.const) {
              addMapping(sch.const, i);
            } else if (sch.enum) {
              for (const tagValue of sch.enum) {
                addMapping(tagValue, i);
              }
            } else {
              throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`);
            }
          }
          function addMapping(tagValue, i) {
            if (typeof tagValue != "string" || tagValue in oneOfMapping) {
              throw new Error(`discriminator: "${tagName}" values must be unique strings`);
            }
            oneOfMapping[tagValue] = i;
          }
        }
      }
    };
    exports.default = def;
  }
});

// node_modules/ajv/dist/refs/json-schema-draft-07.json
var require_json_schema_draft_07 = __commonJS({
  "node_modules/ajv/dist/refs/json-schema-draft-07.json"(exports, module) {
    module.exports = {
      $schema: "http://json-schema.org/draft-07/schema#",
      $id: "http://json-schema.org/draft-07/schema#",
      title: "Core schema meta-schema",
      definitions: {
        schemaArray: {
          type: "array",
          minItems: 1,
          items: { $ref: "#" }
        },
        nonNegativeInteger: {
          type: "integer",
          minimum: 0
        },
        nonNegativeIntegerDefault0: {
          allOf: [{ $ref: "#/definitions/nonNegativeInteger" }, { default: 0 }]
        },
        simpleTypes: {
          enum: ["array", "boolean", "integer", "null", "number", "object", "string"]
        },
        stringArray: {
          type: "array",
          items: { type: "string" },
          uniqueItems: true,
          default: []
        }
      },
      type: ["object", "boolean"],
      properties: {
        $id: {
          type: "string",
          format: "uri-reference"
        },
        $schema: {
          type: "string",
          format: "uri"
        },
        $ref: {
          type: "string",
          format: "uri-reference"
        },
        $comment: {
          type: "string"
        },
        title: {
          type: "string"
        },
        description: {
          type: "string"
        },
        default: true,
        readOnly: {
          type: "boolean",
          default: false
        },
        examples: {
          type: "array",
          items: true
        },
        multipleOf: {
          type: "number",
          exclusiveMinimum: 0
        },
        maximum: {
          type: "number"
        },
        exclusiveMaximum: {
          type: "number"
        },
        minimum: {
          type: "number"
        },
        exclusiveMinimum: {
          type: "number"
        },
        maxLength: { $ref: "#/definitions/nonNegativeInteger" },
        minLength: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        pattern: {
          type: "string",
          format: "regex"
        },
        additionalItems: { $ref: "#" },
        items: {
          anyOf: [{ $ref: "#" }, { $ref: "#/definitions/schemaArray" }],
          default: true
        },
        maxItems: { $ref: "#/definitions/nonNegativeInteger" },
        minItems: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        uniqueItems: {
          type: "boolean",
          default: false
        },
        contains: { $ref: "#" },
        maxProperties: { $ref: "#/definitions/nonNegativeInteger" },
        minProperties: { $ref: "#/definitions/nonNegativeIntegerDefault0" },
        required: { $ref: "#/definitions/stringArray" },
        additionalProperties: { $ref: "#" },
        definitions: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        properties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          default: {}
        },
        patternProperties: {
          type: "object",
          additionalProperties: { $ref: "#" },
          propertyNames: { format: "regex" },
          default: {}
        },
        dependencies: {
          type: "object",
          additionalProperties: {
            anyOf: [{ $ref: "#" }, { $ref: "#/definitions/stringArray" }]
          }
        },
        propertyNames: { $ref: "#" },
        const: true,
        enum: {
          type: "array",
          items: true,
          minItems: 1,
          uniqueItems: true
        },
        type: {
          anyOf: [
            { $ref: "#/definitions/simpleTypes" },
            {
              type: "array",
              items: { $ref: "#/definitions/simpleTypes" },
              minItems: 1,
              uniqueItems: true
            }
          ]
        },
        format: { type: "string" },
        contentMediaType: { type: "string" },
        contentEncoding: { type: "string" },
        if: { $ref: "#" },
        then: { $ref: "#" },
        else: { $ref: "#" },
        allOf: { $ref: "#/definitions/schemaArray" },
        anyOf: { $ref: "#/definitions/schemaArray" },
        oneOf: { $ref: "#/definitions/schemaArray" },
        not: { $ref: "#" }
      },
      default: true
    };
  }
});

// node_modules/ajv/dist/ajv.js
var require_ajv = __commonJS({
  "node_modules/ajv/dist/ajv.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MissingRefError = exports.ValidationError = exports.CodeGen = exports.Name = exports.nil = exports.stringify = exports.str = exports._ = exports.KeywordCxt = exports.Ajv = void 0;
    var core_1 = require_core();
    var draft7_1 = require_draft7();
    var discriminator_1 = require_discriminator();
    var draft7MetaSchema = require_json_schema_draft_07();
    var META_SUPPORT_DATA = ["/properties"];
    var META_SCHEMA_ID = "http://json-schema.org/draft-07/schema";
    var Ajv2 = class extends core_1.default {
      _addVocabularies() {
        super._addVocabularies();
        draft7_1.default.forEach((v) => this.addVocabulary(v));
        if (this.opts.discriminator)
          this.addKeyword(discriminator_1.default);
      }
      _addDefaultMetaSchema() {
        super._addDefaultMetaSchema();
        if (!this.opts.meta)
          return;
        const metaSchema = this.opts.$data ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA) : draft7MetaSchema;
        this.addMetaSchema(metaSchema, META_SCHEMA_ID, false);
        this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID;
      }
      defaultMeta() {
        return this.opts.defaultMeta = super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : void 0);
      }
    };
    exports.Ajv = Ajv2;
    module.exports = exports = Ajv2;
    module.exports.Ajv = Ajv2;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Ajv2;
    var validate_1 = require_validate();
    Object.defineProperty(exports, "KeywordCxt", { enumerable: true, get: function() {
      return validate_1.KeywordCxt;
    } });
    var codegen_1 = require_codegen();
    Object.defineProperty(exports, "_", { enumerable: true, get: function() {
      return codegen_1._;
    } });
    Object.defineProperty(exports, "str", { enumerable: true, get: function() {
      return codegen_1.str;
    } });
    Object.defineProperty(exports, "stringify", { enumerable: true, get: function() {
      return codegen_1.stringify;
    } });
    Object.defineProperty(exports, "nil", { enumerable: true, get: function() {
      return codegen_1.nil;
    } });
    Object.defineProperty(exports, "Name", { enumerable: true, get: function() {
      return codegen_1.Name;
    } });
    Object.defineProperty(exports, "CodeGen", { enumerable: true, get: function() {
      return codegen_1.CodeGen;
    } });
    var validation_error_1 = require_validation_error();
    Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function() {
      return validation_error_1.default;
    } });
    var ref_error_1 = require_ref_error();
    Object.defineProperty(exports, "MissingRefError", { enumerable: true, get: function() {
      return ref_error_1.default;
    } });
  }
});

// node_modules/ajv-formats/dist/formats.js
var require_formats = __commonJS({
  "node_modules/ajv-formats/dist/formats.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatNames = exports.fastFormats = exports.fullFormats = void 0;
    function fmtDef(validate, compare) {
      return { validate, compare };
    }
    exports.fullFormats = {
      // date: http://tools.ietf.org/html/rfc3339#section-5.6
      date: fmtDef(date3, compareDate),
      // date-time: http://tools.ietf.org/html/rfc3339#section-5.6
      time: fmtDef(getTime(true), compareTime),
      "date-time": fmtDef(getDateTime(true), compareDateTime),
      "iso-time": fmtDef(getTime(), compareIsoTime),
      "iso-date-time": fmtDef(getDateTime(), compareIsoDateTime),
      // duration: https://tools.ietf.org/html/rfc3339#appendix-A
      duration: /^P(?!$)((\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+S)?)?|(\d+W)?)$/,
      uri,
      "uri-reference": /^(?:[a-z][a-z0-9+\-.]*:)?(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'"()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'"()*+,;=:@]|%[0-9a-f]{2})*)*)?(?:\?(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'"()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i,
      // uri-template: https://tools.ietf.org/html/rfc6570
      "uri-template": /^(?:(?:[^\x00-\x20"'<>%\\^`{|}]|%[0-9a-f]{2})|\{[+#./;?&=,!@|]?(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?(?:,(?:[a-z0-9_]|%[0-9a-f]{2})+(?::[1-9][0-9]{0,3}|\*)?)*\})*$/i,
      // For the source: https://gist.github.com/dperini/729294
      // For test cases: https://mathiasbynens.be/demo/url-regex
      url: /^(?:https?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu,
      email: /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i,
      hostname: /^(?=.{1,253}\.?$)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[-0-9a-z]{0,61}[0-9a-z])?)*\.?$/i,
      // optimized https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      ipv4: /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/,
      ipv6: /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i,
      regex,
      // uuid: http://tools.ietf.org/html/rfc4122
      uuid: /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
      // JSON-pointer: https://tools.ietf.org/html/rfc6901
      // uri fragment: https://tools.ietf.org/html/rfc3986#appendix-A
      "json-pointer": /^(?:\/(?:[^~/]|~0|~1)*)*$/,
      "json-pointer-uri-fragment": /^#(?:\/(?:[a-z0-9_\-.!$&'()*+,;:=@]|%[0-9a-f]{2}|~0|~1)*)*$/i,
      // relative JSON-pointer: http://tools.ietf.org/html/draft-luff-relative-json-pointer-00
      "relative-json-pointer": /^(?:0|[1-9][0-9]*)(?:#|(?:\/(?:[^~/]|~0|~1)*)*)$/,
      // the following formats are used by the openapi specification: https://spec.openapis.org/oas/v3.0.0#data-types
      // byte: https://github.com/miguelmota/is-base64
      byte,
      // signed 32 bit integer
      int32: { type: "number", validate: validateInt32 },
      // signed 64 bit integer
      int64: { type: "number", validate: validateInt64 },
      // C-type float
      float: { type: "number", validate: validateNumber },
      // C-type double
      double: { type: "number", validate: validateNumber },
      // hint to the UI to hide input strings
      password: true,
      // unchecked string payload
      binary: true
    };
    exports.fastFormats = {
      ...exports.fullFormats,
      date: fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d$/, compareDate),
      time: fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareTime),
      "date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\dt(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)$/i, compareDateTime),
      "iso-time": fmtDef(/^(?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoTime),
      "iso-date-time": fmtDef(/^\d\d\d\d-[0-1]\d-[0-3]\d[t\s](?:[0-2]\d:[0-5]\d:[0-5]\d|23:59:60)(?:\.\d+)?(?:z|[+-]\d\d(?::?\d\d)?)?$/i, compareIsoDateTime),
      // uri: https://github.com/mafintosh/is-my-json-valid/blob/master/formats.js
      uri: /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/)?[^\s]*$/i,
      "uri-reference": /^(?:(?:[a-z][a-z0-9+\-.]*:)?\/?\/)?(?:[^\\\s#][^\s#]*)?(?:#[^\\\s]*)?$/i,
      // email (sources from jsen validator):
      // http://stackoverflow.com/questions/201323/using-a-regular-expression-to-validate-an-email-address#answer-8829363
      // http://www.w3.org/TR/html5/forms.html#valid-e-mail-address (search for 'wilful violation')
      email: /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i
    };
    exports.formatNames = Object.keys(exports.fullFormats);
    function isLeapYear(year) {
      return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    }
    var DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/;
    var DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    function date3(str) {
      const matches = DATE.exec(str);
      if (!matches)
        return false;
      const year = +matches[1];
      const month = +matches[2];
      const day = +matches[3];
      return month >= 1 && month <= 12 && day >= 1 && day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month]);
    }
    function compareDate(d1, d2) {
      if (!(d1 && d2))
        return void 0;
      if (d1 > d2)
        return 1;
      if (d1 < d2)
        return -1;
      return 0;
    }
    var TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i;
    function getTime(strictTimeZone) {
      return function time3(str) {
        const matches = TIME.exec(str);
        if (!matches)
          return false;
        const hr = +matches[1];
        const min = +matches[2];
        const sec = +matches[3];
        const tz = matches[4];
        const tzSign = matches[5] === "-" ? -1 : 1;
        const tzH = +(matches[6] || 0);
        const tzM = +(matches[7] || 0);
        if (tzH > 23 || tzM > 59 || strictTimeZone && !tz)
          return false;
        if (hr <= 23 && min <= 59 && sec < 60)
          return true;
        const utcMin = min - tzM * tzSign;
        const utcHr = hr - tzH * tzSign - (utcMin < 0 ? 1 : 0);
        return (utcHr === 23 || utcHr === -1) && (utcMin === 59 || utcMin === -1) && sec < 61;
      };
    }
    function compareTime(s1, s2) {
      if (!(s1 && s2))
        return void 0;
      const t1 = (/* @__PURE__ */ new Date("2020-01-01T" + s1)).valueOf();
      const t2 = (/* @__PURE__ */ new Date("2020-01-01T" + s2)).valueOf();
      if (!(t1 && t2))
        return void 0;
      return t1 - t2;
    }
    function compareIsoTime(t1, t2) {
      if (!(t1 && t2))
        return void 0;
      const a1 = TIME.exec(t1);
      const a2 = TIME.exec(t2);
      if (!(a1 && a2))
        return void 0;
      t1 = a1[1] + a1[2] + a1[3];
      t2 = a2[1] + a2[2] + a2[3];
      if (t1 > t2)
        return 1;
      if (t1 < t2)
        return -1;
      return 0;
    }
    var DATE_TIME_SEPARATOR = /t|\s/i;
    function getDateTime(strictTimeZone) {
      const time3 = getTime(strictTimeZone);
      return function date_time(str) {
        const dateTime = str.split(DATE_TIME_SEPARATOR);
        return dateTime.length === 2 && date3(dateTime[0]) && time3(dateTime[1]);
      };
    }
    function compareDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const d1 = new Date(dt1).valueOf();
      const d2 = new Date(dt2).valueOf();
      if (!(d1 && d2))
        return void 0;
      return d1 - d2;
    }
    function compareIsoDateTime(dt1, dt2) {
      if (!(dt1 && dt2))
        return void 0;
      const [d1, t1] = dt1.split(DATE_TIME_SEPARATOR);
      const [d2, t2] = dt2.split(DATE_TIME_SEPARATOR);
      const res = compareDate(d1, d2);
      if (res === void 0)
        return void 0;
      return res || compareTime(t1, t2);
    }
    var NOT_URI_FRAGMENT = /\/|:/;
    var URI = /^(?:[a-z][a-z0-9+\-.]*:)(?:\/?\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:]|%[0-9a-f]{2})*@)?(?:\[(?:(?:(?:(?:[0-9a-f]{1,4}:){6}|::(?:[0-9a-f]{1,4}:){5}|(?:[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){4}|(?:(?:[0-9a-f]{1,4}:){0,1}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){3}|(?:(?:[0-9a-f]{1,4}:){0,2}[0-9a-f]{1,4})?::(?:[0-9a-f]{1,4}:){2}|(?:(?:[0-9a-f]{1,4}:){0,3}[0-9a-f]{1,4})?::[0-9a-f]{1,4}:|(?:(?:[0-9a-f]{1,4}:){0,4}[0-9a-f]{1,4})?::)(?:[0-9a-f]{1,4}:[0-9a-f]{1,4}|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?))|(?:(?:[0-9a-f]{1,4}:){0,5}[0-9a-f]{1,4})?::[0-9a-f]{1,4}|(?:(?:[0-9a-f]{1,4}:){0,6}[0-9a-f]{1,4})?::)|[Vv][0-9a-f]+\.[a-z0-9\-._~!$&'()*+,;=:]+)\]|(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)|(?:[a-z0-9\-._~!$&'()*+,;=]|%[0-9a-f]{2})*)(?::\d*)?(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*|\/(?:(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)?|(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})+(?:\/(?:[a-z0-9\-._~!$&'()*+,;=:@]|%[0-9a-f]{2})*)*)(?:\?(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?(?:#(?:[a-z0-9\-._~!$&'()*+,;=:@/?]|%[0-9a-f]{2})*)?$/i;
    function uri(str) {
      return NOT_URI_FRAGMENT.test(str) && URI.test(str);
    }
    var BYTE = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/gm;
    function byte(str) {
      BYTE.lastIndex = 0;
      return BYTE.test(str);
    }
    var MIN_INT32 = -(2 ** 31);
    var MAX_INT32 = 2 ** 31 - 1;
    function validateInt32(value) {
      return Number.isInteger(value) && value <= MAX_INT32 && value >= MIN_INT32;
    }
    function validateInt64(value) {
      return Number.isInteger(value);
    }
    function validateNumber() {
      return true;
    }
    var Z_ANCHOR = /[^\\]\\Z/;
    function regex(str) {
      if (Z_ANCHOR.test(str))
        return false;
      try {
        new RegExp(str);
        return true;
      } catch (e) {
        return false;
      }
    }
  }
});

// node_modules/ajv-formats/dist/limit.js
var require_limit = __commonJS({
  "node_modules/ajv-formats/dist/limit.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.formatLimitDefinition = void 0;
    var ajv_1 = require_ajv();
    var codegen_1 = require_codegen();
    var ops = codegen_1.operators;
    var KWDs = {
      formatMaximum: { okStr: "<=", ok: ops.LTE, fail: ops.GT },
      formatMinimum: { okStr: ">=", ok: ops.GTE, fail: ops.LT },
      formatExclusiveMaximum: { okStr: "<", ok: ops.LT, fail: ops.GTE },
      formatExclusiveMinimum: { okStr: ">", ok: ops.GT, fail: ops.LTE }
    };
    var error2 = {
      message: ({ keyword, schemaCode }) => (0, codegen_1.str)`should be ${KWDs[keyword].okStr} ${schemaCode}`,
      params: ({ keyword, schemaCode }) => (0, codegen_1._)`{comparison: ${KWDs[keyword].okStr}, limit: ${schemaCode}}`
    };
    exports.formatLimitDefinition = {
      keyword: Object.keys(KWDs),
      type: "string",
      schemaType: "string",
      $data: true,
      error: error2,
      code(cxt) {
        const { gen, data, schemaCode, keyword, it } = cxt;
        const { opts, self } = it;
        if (!opts.validateFormats)
          return;
        const fCxt = new ajv_1.KeywordCxt(it, self.RULES.all.format.definition, "format");
        if (fCxt.$data)
          validate$DataFormat();
        else
          validateFormat();
        function validate$DataFormat() {
          const fmts = gen.scopeValue("formats", {
            ref: self.formats,
            code: opts.code.formats
          });
          const fmt = gen.const("fmt", (0, codegen_1._)`${fmts}[${fCxt.schemaCode}]`);
          cxt.fail$data((0, codegen_1.or)((0, codegen_1._)`typeof ${fmt} != "object"`, (0, codegen_1._)`${fmt} instanceof RegExp`, (0, codegen_1._)`typeof ${fmt}.compare != "function"`, compareCode(fmt)));
        }
        function validateFormat() {
          const format = fCxt.schema;
          const fmtDef = self.formats[format];
          if (!fmtDef || fmtDef === true)
            return;
          if (typeof fmtDef != "object" || fmtDef instanceof RegExp || typeof fmtDef.compare != "function") {
            throw new Error(`"${keyword}": format "${format}" does not define "compare" function`);
          }
          const fmt = gen.scopeValue("formats", {
            key: format,
            ref: fmtDef,
            code: opts.code.formats ? (0, codegen_1._)`${opts.code.formats}${(0, codegen_1.getProperty)(format)}` : void 0
          });
          cxt.fail$data(compareCode(fmt));
        }
        function compareCode(fmt) {
          return (0, codegen_1._)`${fmt}.compare(${data}, ${schemaCode}) ${KWDs[keyword].fail} 0`;
        }
      },
      dependencies: ["format"]
    };
    var formatLimitPlugin = (ajv) => {
      ajv.addKeyword(exports.formatLimitDefinition);
      return ajv;
    };
    exports.default = formatLimitPlugin;
  }
});

// node_modules/ajv-formats/dist/index.js
var require_dist = __commonJS({
  "node_modules/ajv-formats/dist/index.js"(exports, module) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var formats_1 = require_formats();
    var limit_1 = require_limit();
    var codegen_1 = require_codegen();
    var fullName = new codegen_1.Name("fullFormats");
    var fastName = new codegen_1.Name("fastFormats");
    var formatsPlugin = (ajv, opts = { keywords: true }) => {
      if (Array.isArray(opts)) {
        addFormats(ajv, opts, formats_1.fullFormats, fullName);
        return ajv;
      }
      const [formats, exportName] = opts.mode === "fast" ? [formats_1.fastFormats, fastName] : [formats_1.fullFormats, fullName];
      const list = opts.formats || formats_1.formatNames;
      addFormats(ajv, list, formats, exportName);
      if (opts.keywords)
        (0, limit_1.default)(ajv);
      return ajv;
    };
    formatsPlugin.get = (name, mode = "full") => {
      const formats = mode === "fast" ? formats_1.fastFormats : formats_1.fullFormats;
      const f = formats[name];
      if (!f)
        throw new Error(`Unknown format "${name}"`);
      return f;
    };
    function addFormats(ajv, list, fs, exportName) {
      var _a3;
      var _b;
      (_a3 = (_b = ajv.opts.code).formats) !== null && _a3 !== void 0 ? _a3 : _b.formats = (0, codegen_1._)`require("ajv-formats/dist/formats").${exportName}`;
      for (const f of list)
        ajv.addFormat(f, fs[f]);
    }
    module.exports = exports = formatsPlugin;
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = formatsPlugin;
  }
});

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports, module) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
      kListener: Symbol("kListener"),
      kStatusCode: Symbol("status-code"),
      kWebSocket: Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports, module) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = __require("bufferutil");
        module.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports, module) {
    "use strict";
    var kDone = Symbol("kDone");
    var kRun = Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports, module) {
    "use strict";
    var zlib = __require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = Symbol("permessage-deflate");
    var kTotalLength = Symbol("total-length");
    var kCallback = Symbol("callback");
    var kBuffers = Symbol("buffers");
    var kError = Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key2) => {
            let value = params[key2];
            if (value.length > 1) {
              throw new Error(`Parameter "${key2}" must have only a single value`);
            }
            value = value[0];
            if (key2 === "client_max_window_bits") {
              if (value !== true) {
                const num2 = +value;
                if (!Number.isInteger(num2) || num2 < 8 || num2 > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key2}": ${value}`
                  );
                }
                value = num2;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key2}": ${value}`
                );
              }
            } else if (key2 === "server_max_window_bits") {
              const num2 = +value;
              if (!Number.isInteger(num2) || num2 < 8 || num2 > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key2}": ${value}`
                );
              }
              value = num2;
            } else if (key2 === "client_no_context_takeover" || key2 === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key2}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key2}"`);
            }
            params[key2] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key2 = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key2] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key2];
          this._inflate = zlib.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key2 = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key2] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key2];
          this._deflate = zlib.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation2 = __commonJS({
  "node_modules/ws/lib/validation.js"(exports, module) {
    "use strict";
    var { isUtf8 } = __require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = __require("utf-8-validate");
        module.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports, module) {
    "use strict";
    var { Writable } = __require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation2();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error2 = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error2);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error2 = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error2);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error2 = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error2);
            return;
          }
          if (!this._fragmented) {
            const error2 = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error2);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error2 = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error2);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error2 = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error2);
            return;
          }
          if (compressed) {
            const error2 = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error2);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error2 = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error2);
            return;
          }
        } else {
          const error2 = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error2);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error2 = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error2);
            return;
          }
        } else if (this._masked) {
          const error2 = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error2);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num2 = buf.readUInt32BE(0);
        if (num2 > Math.pow(2, 53 - 32) - 1) {
          const error2 = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error2);
          return;
        }
        this._payloadLength = num2 * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error2 = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error2);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error2 = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error2);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error2 = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error2);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error2 = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error2);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error2 = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error2);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error2 = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error2);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports, module) {
    "use strict";
    var { Duplex } = __require("stream");
    var { randomFillSync } = __require("crypto");
    var {
      types: { isUint8Array }
    } = __require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation2();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions, generateMask) {
        this._extensions = extensions || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge2 = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge2 = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge2 ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge2) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports, module) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = Symbol("kCode");
    var kData = Symbol("kData");
    var kError = Symbol("kError");
    var kMessage = Symbol("kMessage");
    var kReason = Symbol("kReason");
    var kTarget = Symbol("kTarget");
    var kType = Symbol("kType");
    var kWasClean = Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error2) {
            const event = new ErrorEvent("error", {
              error: error2,
              message: error2.message
            });
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation2();
    function push(dest, name, elem) {
      if (dest[name] === void 0) dest[name] = [elem];
      else dest[name].push(elem);
    }
    function parse3(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name = header.slice(start, end);
            if (code === 44) {
              push(offers, name, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions) {
      return Object.keys(extensions).map((extension2) => {
        let configurations = extensions[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module.exports = { format, parse: parse3 };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var https = __require("https");
    var http = __require("http");
    var net = __require("net");
    var tls = __require("tls");
    var { randomBytes: randomBytes2, createHash } = __require("crypto");
    var { Duplex, Readable: Readable2 } = __require("stream");
    var { URL: URL2 } = __require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation2();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener, removeEventListener }
    } = require_event_target();
    var { format, parse: parse3 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            protocols = [];
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              protocols = [];
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._readyState = _WebSocket.CLOSING;
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler !== "function") return;
          this.addEventListener(method, handler, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key2 = randomBytes2(16).toString("base64");
      const request = isSecure ? https.request : http.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key2,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key3, value] of Object.entries(headers)) {
              options.headers[key3.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key2 + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions;
          try {
            extensions = parse3(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net.isIP(options.host) ? "" : options.host;
      }
      return tls.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports, module) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = __require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error2(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error2(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports, module) {
    "use strict";
    var { tokenChars } = require_validation2();
    function parse3(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module.exports = { parse: parse3 };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports, module) {
    "use strict";
    var EventEmitter = __require("events");
    var http = __require("http");
    var { Duplex } = __require("stream");
    var { createHash } = __require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http.createServer((req, res) => {
            const body = http.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server2 = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server2.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key2 = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version2 = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key2 === void 0 || !keyRegex.test(key2)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version2 !== 13 && version2 !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version2 === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions,
                key2,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions, key2, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions, key2, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key2 + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions[PerMessageDeflate2.extensionName]) {
          const params = extensions[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module.exports = WebSocketServer2;
    function addListeners(server2, map) {
      for (const event of Object.keys(map)) server2.on(event, map[event]);
      return function removeListeners() {
        for (const event of Object.keys(map)) {
          server2.removeListener(event, map[event]);
        }
      };
    }
    function emitClose(server2) {
      server2._state = CLOSED;
      server2.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server2, req, socket, code, message, headers) {
      if (server2.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server2.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/zod/v4/core/core.js
var _a;
// @__NO_SIDE_EFFECTS__
function $constructor(name, initializer3, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _,
          traits: /* @__PURE__ */ new Set()
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer3(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;
  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a3;
    const inst = params?.Parent ? new Definition() : this;
    init(inst, def);
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");
var $ZodAsyncError = class extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
};
var $ZodEncodeError = class extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
};
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}

// node_modules/zod/v4/core/util.js
var util_exports = {};
__export(util_exports, {
  BIGINT_FORMAT_RANGES: () => BIGINT_FORMAT_RANGES,
  Class: () => Class,
  NUMBER_FORMAT_RANGES: () => NUMBER_FORMAT_RANGES,
  aborted: () => aborted,
  allowsEval: () => allowsEval,
  assert: () => assert,
  assertEqual: () => assertEqual,
  assertIs: () => assertIs,
  assertNever: () => assertNever,
  assertNotEqual: () => assertNotEqual,
  assignProp: () => assignProp,
  base64ToUint8Array: () => base64ToUint8Array,
  base64urlToUint8Array: () => base64urlToUint8Array,
  cached: () => cached,
  captureStackTrace: () => captureStackTrace,
  cleanEnum: () => cleanEnum,
  cleanRegex: () => cleanRegex,
  clone: () => clone,
  cloneDef: () => cloneDef,
  createTransparentProxy: () => createTransparentProxy,
  defineLazy: () => defineLazy,
  esc: () => esc,
  escapeRegex: () => escapeRegex,
  explicitlyAborted: () => explicitlyAborted,
  extend: () => extend,
  finalizeIssue: () => finalizeIssue,
  floatSafeRemainder: () => floatSafeRemainder,
  getElementAtPath: () => getElementAtPath,
  getEnumValues: () => getEnumValues,
  getLengthableOrigin: () => getLengthableOrigin,
  getParsedType: () => getParsedType,
  getSizableOrigin: () => getSizableOrigin,
  hexToUint8Array: () => hexToUint8Array,
  isObject: () => isObject,
  isPlainObject: () => isPlainObject,
  issue: () => issue,
  joinValues: () => joinValues,
  jsonStringifyReplacer: () => jsonStringifyReplacer,
  merge: () => merge,
  mergeDefs: () => mergeDefs,
  normalizeParams: () => normalizeParams,
  nullish: () => nullish,
  numKeys: () => numKeys,
  objectClone: () => objectClone,
  omit: () => omit,
  optionalKeys: () => optionalKeys,
  parsedType: () => parsedType,
  partial: () => partial,
  pick: () => pick,
  prefixIssues: () => prefixIssues,
  primitiveTypes: () => primitiveTypes,
  promiseAllObject: () => promiseAllObject,
  propertyKeyTypes: () => propertyKeyTypes,
  randomString: () => randomString,
  required: () => required,
  safeExtend: () => safeExtend,
  shallowClone: () => shallowClone,
  slugify: () => slugify,
  stringifyPrimitive: () => stringifyPrimitive,
  uint8ArrayToBase64: () => uint8ArrayToBase64,
  uint8ArrayToBase64url: () => uint8ArrayToBase64url,
  uint8ArrayToHex: () => uint8ArrayToHex,
  unwrapMessage: () => unwrapMessage
});
function assertEqual(val) {
  return val;
}
function assertNotEqual(val) {
  return val;
}
function assertIs(_arg) {
}
function assertNever(_x) {
  throw new Error("Unexpected value in exhaustive check");
}
function assert(_) {
}
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function joinValues(array2, separator = "|") {
  return array2.map((val) => stringifyPrimitive(val)).join(separator);
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === void 0;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object3, key2, getter) {
  let value = void 0;
  Object.defineProperty(object3, key2, {
    get() {
      if (value === EVALUATING) {
        return void 0;
      }
      if (value === void 0) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object3, key2, {
        value: v
        // configurable: true,
      });
    },
    configurable: true
  });
}
function objectClone(obj) {
  return Object.create(Object.getPrototypeOf(obj), Object.getOwnPropertyDescriptors(obj));
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function cloneDef(schema) {
  return mergeDefs(schema._zod.def);
}
function getElementAtPath(obj, path) {
  if (!path)
    return obj;
  return path.reduce((acc, key2) => acc?.[key2], obj);
}
function promiseAllObject(promisesObj) {
  const keys = Object.keys(promisesObj);
  const promises = keys.map((key2) => promisesObj[key2]);
  return Promise.all(promises).then((results) => {
    const resolvedObj = {};
    for (let i = 0; i < keys.length; i++) {
      resolvedObj[keys[i]] = results[i];
    }
    return resolvedObj;
  });
}
function randomString(length = 10) {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  let str = "";
  for (let i = 0; i < length; i++) {
    str += chars[Math.floor(Math.random() * chars.length)];
  }
  return str;
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {
};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === void 0)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
function numKeys(data) {
  let keyCount = 0;
  for (const key2 in data) {
    if (Object.prototype.hasOwnProperty.call(data, key2)) {
      keyCount++;
    }
  }
  return keyCount;
}
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(data) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
    case "object":
      if (Array.isArray(data)) {
        return "array";
      }
      if (data === null) {
        return "null";
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return "promise";
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return "map";
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return "set";
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return "date";
      }
      if (typeof File !== "undefined" && data instanceof File) {
        return "file";
      }
      return "object";
    default:
      throw new Error(`Unknown data type: ${t}`);
  }
};
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
var primitiveTypes = /* @__PURE__ */ new Set([
  "string",
  "number",
  "bigint",
  "boolean",
  "symbol",
  "undefined"
]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== void 0) {
    if (params?.error !== void 0)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function createTransparentProxy(getter) {
  let target;
  return new Proxy({}, {
    get(_, prop, receiver) {
      target ?? (target = getter());
      return Reflect.get(target, prop, receiver);
    },
    set(_, prop, value, receiver) {
      target ?? (target = getter());
      return Reflect.set(target, prop, value, receiver);
    },
    has(_, prop) {
      target ?? (target = getter());
      return Reflect.has(target, prop);
    },
    deleteProperty(_, prop) {
      target ?? (target = getter());
      return Reflect.deleteProperty(target, prop);
    },
    ownKeys(_) {
      target ?? (target = getter());
      return Reflect.ownKeys(target);
    },
    getOwnPropertyDescriptor(_, prop) {
      target ?? (target = getter());
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    defineProperty(_, prop, descriptor) {
      target ?? (target = getter());
      return Reflect.defineProperty(target, prop, descriptor);
    }
  });
}
function stringifyPrimitive(value) {
  if (typeof value === "bigint")
    return value.toString() + "n";
  if (typeof value === "string")
    return `"${value}"`;
  return `${value}`;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-34028234663852886e22, 34028234663852886e22],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
var BIGINT_FORMAT_RANGES = {
  int64: [/* @__PURE__ */ BigInt("-9223372036854775808"), /* @__PURE__ */ BigInt("9223372036854775807")],
  uint64: [/* @__PURE__ */ BigInt(0), /* @__PURE__ */ BigInt("18446744073709551615")]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key2 in mask) {
        if (!(key2 in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key2}"`);
        }
        if (!mask[key2])
          continue;
        newShape[key2] = currDef.shape[key2];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key2 in mask) {
        if (!(key2 in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key2}"`);
        }
        if (!mask[key2])
          continue;
        delete newShape[key2];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema._zod.def.shape;
    for (const key2 in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key2) !== void 0) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class2, schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key2 in mask) {
          if (!(key2 in oldShape)) {
            throw new Error(`Unrecognized key: "${key2}"`);
          }
          if (!mask[key2])
            continue;
          shape[key2] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key2]
          }) : oldShape[key2];
        }
      } else {
        for (const key2 in oldShape) {
          shape[key2] = Class2 ? new Class2({
            type: "optional",
            innerType: oldShape[key2]
          }) : oldShape[key2];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class2, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key2 in mask) {
          if (!(key2 in shape)) {
            throw new Error(`Unrecognized key: "${key2}"`);
          }
          if (!mask[key2])
            continue;
          shape[key2] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key2]
          });
        }
      } else {
        for (const key2 in oldShape) {
          shape[key2] = new Class2({
            type: "nonoptional",
            innerType: oldShape[key2]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex; i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a3;
    (_a3 = iss).path ?? (_a3.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx2, config2) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx2?.error?.(iss)) ?? unwrapMessage(config2.customError?.(iss)) ?? unwrapMessage(config2.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx2?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getSizableOrigin(input) {
  if (input instanceof Set)
    return "set";
  if (input instanceof Map)
    return "map";
  if (input instanceof File)
    return "file";
  return "unknown";
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function parsedType(data) {
  const t = typeof data;
  switch (t) {
    case "number": {
      return Number.isNaN(data) ? "nan" : "number";
    }
    case "object": {
      if (data === null) {
        return "null";
      }
      if (Array.isArray(data)) {
        return "array";
      }
      const obj = data;
      if (obj && Object.getPrototypeOf(obj) !== Object.prototype && "constructor" in obj && obj.constructor) {
        return obj.constructor.name;
      }
    }
  }
  return t;
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}
function cleanEnum(obj) {
  return Object.entries(obj).filter(([k, _]) => {
    return Number.isNaN(Number.parseInt(k, 10));
  }).map((el) => el[1]);
}
function base64ToUint8Array(base642) {
  const binaryString = atob(base642);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
function uint8ArrayToBase64(bytes) {
  let binaryString = "";
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}
function base64urlToUint8Array(base64url2) {
  const base642 = base64url2.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - base642.length % 4) % 4);
  return base64ToUint8Array(base642 + padding);
}
function uint8ArrayToBase64url(bytes) {
  return uint8ArrayToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
function hexToUint8Array(hex) {
  const cleanHex = hex.replace(/^0x/, "");
  if (cleanHex.length % 2 !== 0) {
    throw new Error("Invalid hex string length");
  }
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = Number.parseInt(cleanHex.slice(i, i + 2), 16);
  }
  return bytes;
}
function uint8ArrayToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
var Class = class {
  constructor(..._args) {
  }
};

// node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error2.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error2, mapper = (issue2) => issue2.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error3, path = []) => {
    for (const issue2 of error3.issues) {
      if (issue2.code === "invalid_union" && issue2.errors.length) {
        issue2.errors.map((issues) => processError({ issues }, [...path, ...issue2.path]));
      } else if (issue2.code === "invalid_key") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else if (issue2.code === "invalid_element") {
        processError({ issues: issue2.issues }, [...path, ...issue2.path]);
      } else {
        const fullpath = [...path, ...issue2.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue2));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue2));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  };
  processError(error2);
  return fieldErrors;
}

// node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx2 = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx2);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx2, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx2 = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx2);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx2, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx2 = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx2);
  if (result instanceof Promise) {
    throw new $ZodAsyncError();
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx2, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx2 = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx2);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx2, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
  const ctx2 = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parse(_Err)(schema, value, ctx2);
};
var _decode = (_Err) => (schema, value, _ctx) => {
  return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx2 = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parseAsync(_Err)(schema, value, ctx2);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx2 = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx2);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx2 = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx2);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};

// node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version2) => {
  if (!version2)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version2}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time3 = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time3}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var _null = /^null$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a3;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a3 = inst._zod).onattach ?? (_a3.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    var _a3;
    (_a3 = inst2._zod.bag).multipleOf ?? (_a3.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst2._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const curr = inst2._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst2._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a3;
  $ZodCheck.init(inst, def);
  (_a3 = inst._zod.def).when ?? (_a3.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== void 0;
  });
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a3, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a3 = inst._zod).check ?? (_a3.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {
    });
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst2) => {
    const bag = inst2._zod.bag;
    bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// node_modules/zod/v4/core/doc.js
var Doc = class {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split("\n").filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join("\n"));
  }
};

// node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 4,
  patch: 3
};

// node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a3;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a3 = inst._zod).deferred ?? (_a3.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks2, ctx2) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks2) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx2?.async === false) {
          throw new $ZodAsyncError();
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx2) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx2);
      if (checkResult instanceof Promise) {
        if (ctx2.async === false)
          throw new $ZodAsyncError();
        return checkResult.then((checkResult2) => inst._zod.parse(checkResult2, ctx2));
      }
      return inst._zod.parse(checkResult, ctx2);
    };
    inst._zod.run = (payload, ctx2) => {
      if (ctx2.skipChecks) {
        return inst._zod.parse(payload, ctx2);
      }
      if (ctx2.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx2, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary2) => {
            return handleCanaryResult(canary2, payload, ctx2);
          });
        }
        return handleCanaryResult(canary, payload, ctx2);
      }
      const result = inst._zod.parse(payload, ctx2);
      if (result instanceof Promise) {
        if (ctx2.async === false)
          throw new $ZodAsyncError();
        return result.then((result2) => runChecks(result2, checks, ctx2));
      }
      return runChecks(result, checks, ctx2);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_2) {
      }
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === void 0)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid URL format",
            input: payload.value,
            inst,
            continue: !def.abort
          });
          return;
        }
      }
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: def.hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error();
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error();
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error();
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error();
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base642 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base642.padEnd(Math.ceil(base642.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64url";
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {
      }
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodNull = /* @__PURE__ */ $constructor("$ZodNull", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = _null;
  inst._zod.values = /* @__PURE__ */ new Set([null]);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (input === null)
      return payload;
    payload.issues.push({
      expected: "null",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx2) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0; i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx2);
      if (result instanceof Promise) {
        proms.push(result.then((result2) => handleArrayResult(result2, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key2, input, isOptionalIn, isOptionalOut) {
  const isPresent = key2 in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key2, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: void 0,
        path: [key2]
      });
    }
    return;
  }
  if (result.value === void 0) {
    if (isPresent) {
      final.value[key2] = void 0;
    }
  } else {
    final.value[key2] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx2, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key2 in input) {
    if (key2 === "__proto__")
      continue;
    if (keySet.has(key2))
      continue;
    if (t === "never") {
      unrecognized.push(key2);
      continue;
    }
    const r = _catchall.run({ value: input[key2], issues: [] }, ctx2);
    if (r instanceof Promise) {
      proms.push(r.then((r2) => handlePropertyResult(r2, payload, key2, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r, payload, key2, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key2 in shape) {
      const field = shape[key2]._zod;
      if (field.values) {
        propValues[key2] ?? (propValues[key2] = /* @__PURE__ */ new Set());
        for (const v of field.values)
          propValues[key2].add(v);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx2) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key2 of value.keys) {
      const el = shape[key2];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ value: input[key2], issues: [] }, ctx2);
      if (r instanceof Promise) {
        proms.push(r.then((r2) => handlePropertyResult(r2, payload, key2, input, isOptionalIn, isOptionalOut)));
      } else {
        handlePropertyResult(r, payload, key2, input, isOptionalIn, isOptionalOut);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx2, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key2) => {
      const k = esc(key2);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = /* @__PURE__ */ Object.create(null);
    let counter = 0;
    for (const key2 of normalized.keys) {
      ids[key2] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key2 of normalized.keys) {
      const id = ids[key2];
      const k = esc(key2);
      const schema = shape[key2];
      const isOptionalIn = schema?._zod?.optin === "optional";
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(key2)};`);
      if (isOptionalIn && isOptionalOut) {
        doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx2) => fn(shape, payload, ctx2);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx2) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx2?.async === false && ctx2.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx2);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx2, value, inst);
    }
    return superParse(payload, ctx2);
  };
});
function handleUnionResults(results, final, inst, ctx2) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx2, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return void 0;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx2) => {
    if (first) {
      return first(payload, ctx2);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx2);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx2);
    return Promise.all(results).then((results2) => {
      return handleUnionResults(results2, payload, inst, ctx2);
    });
  };
});
var $ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("$ZodDiscriminatedUnion", (inst, def) => {
  def.inclusive = false;
  $ZodUnion.init(inst, def);
  const _super = inst._zod.parse;
  defineLazy(inst._zod, "propValues", () => {
    const propValues = {};
    for (const option of def.options) {
      const pv = option._zod.propValues;
      if (!pv || Object.keys(pv).length === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(option)}"`);
      for (const [k, v] of Object.entries(pv)) {
        if (!propValues[k])
          propValues[k] = /* @__PURE__ */ new Set();
        for (const val of v) {
          propValues[k].add(val);
        }
      }
    }
    return propValues;
  });
  const disc = cached(() => {
    const opts = def.options;
    const map = /* @__PURE__ */ new Map();
    for (const o of opts) {
      const values = o._zod.propValues?.[def.discriminator];
      if (!values || values.size === 0)
        throw new Error(`Invalid discriminated union option at index "${def.options.indexOf(o)}"`);
      for (const v of values) {
        if (map.has(v)) {
          throw new Error(`Duplicate discriminator value "${String(v)}"`);
        }
        map.set(v, o);
      }
    }
    return map;
  });
  inst._zod.parse = (payload, ctx2) => {
    const input = payload.value;
    if (!isObject(input)) {
      payload.issues.push({
        code: "invalid_type",
        expected: "object",
        input,
        inst
      });
      return payload;
    }
    const opt = disc.value.get(input?.[def.discriminator]);
    if (opt) {
      return opt._zod.run(payload, ctx2);
    }
    if (def.unionFallback || ctx2.direction === "backward") {
      return _super(payload, ctx2);
    }
    payload.issues.push({
      code: "invalid_union",
      errors: [],
      note: "No matching discriminator",
      discriminator: def.discriminator,
      options: Array.from(disc.value.keys()),
      input,
      path: [def.discriminator],
      inst
    });
    return payload;
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx2) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx2);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx2);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left2, right2]) => {
        return handleIntersectionResults(payload, left2, right2);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key2) => bKeys.indexOf(key2) !== -1);
    const newObj = { ...a, ...b };
    for (const key2 of sharedKeys) {
      const sharedValue = mergeValues(a[key2], b[key2]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key2, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key2] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = /* @__PURE__ */ new Map();
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodRecord = /* @__PURE__ */ $constructor("$ZodRecord", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx2) => {
    const input = payload.value;
    if (!isPlainObject(input)) {
      payload.issues.push({
        expected: "record",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    const proms = [];
    const values = def.keyType._zod.values;
    if (values) {
      payload.value = {};
      const recordKeys = /* @__PURE__ */ new Set();
      for (const key2 of values) {
        if (typeof key2 === "string" || typeof key2 === "number" || typeof key2 === "symbol") {
          recordKeys.add(typeof key2 === "number" ? key2.toString() : key2);
          const keyResult = def.keyType._zod.run({ value: key2, issues: [] }, ctx2);
          if (keyResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (keyResult.issues.length) {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx2, config())),
              input: key2,
              path: [key2],
              inst
            });
            continue;
          }
          const outKey = keyResult.value;
          const result = def.valueType._zod.run({ value: input[key2], issues: [] }, ctx2);
          if (result instanceof Promise) {
            proms.push(result.then((result2) => {
              if (result2.issues.length) {
                payload.issues.push(...prefixIssues(key2, result2.issues));
              }
              payload.value[outKey] = result2.value;
            }));
          } else {
            if (result.issues.length) {
              payload.issues.push(...prefixIssues(key2, result.issues));
            }
            payload.value[outKey] = result.value;
          }
        }
      }
      let unrecognized;
      for (const key2 in input) {
        if (!recordKeys.has(key2)) {
          unrecognized = unrecognized ?? [];
          unrecognized.push(key2);
        }
      }
      if (unrecognized && unrecognized.length > 0) {
        payload.issues.push({
          code: "unrecognized_keys",
          input,
          inst,
          keys: unrecognized
        });
      }
    } else {
      payload.value = {};
      for (const key2 of Reflect.ownKeys(input)) {
        if (key2 === "__proto__")
          continue;
        if (!Object.prototype.propertyIsEnumerable.call(input, key2))
          continue;
        let keyResult = def.keyType._zod.run({ value: key2, issues: [] }, ctx2);
        if (keyResult instanceof Promise) {
          throw new Error("Async schemas not supported in object keys currently");
        }
        const checkNumericKey = typeof key2 === "string" && number.test(key2) && keyResult.issues.length;
        if (checkNumericKey) {
          const retryResult = def.keyType._zod.run({ value: Number(key2), issues: [] }, ctx2);
          if (retryResult instanceof Promise) {
            throw new Error("Async schemas not supported in object keys currently");
          }
          if (retryResult.issues.length === 0) {
            keyResult = retryResult;
          }
        }
        if (keyResult.issues.length) {
          if (def.mode === "loose") {
            payload.value[key2] = input[key2];
          } else {
            payload.issues.push({
              code: "invalid_key",
              origin: "record",
              issues: keyResult.issues.map((iss) => finalizeIssue(iss, ctx2, config())),
              input: key2,
              path: [key2],
              inst
            });
          }
          continue;
        }
        const result = def.valueType._zod.run({ value: input[key2], issues: [] }, ctx2);
        if (result instanceof Promise) {
          proms.push(result.then((result2) => {
            if (result2.issues.length) {
              payload.issues.push(...prefixIssues(key2, result2.issues));
            }
            payload.value[keyResult.value] = result2.value;
          }));
        } else {
          if (result.issues.length) {
            payload.issues.push(...prefixIssues(key2, result.issues));
          }
          payload.value[keyResult.value] = result.value;
        }
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodLiteral = /* @__PURE__ */ $constructor("$ZodLiteral", (inst, def) => {
  $ZodType.init(inst, def);
  if (def.values.length === 0) {
    throw new Error("Cannot create literal schema with no valid values");
  }
  const values = new Set(def.values);
  inst._zod.values = values;
  inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (values.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values: def.values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.parse = (payload, ctx2) => {
    if (ctx2.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx2.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError();
    }
    payload.value = _out;
    payload.fallback = true;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (input === void 0 && (result.issues.length || result.fallback)) {
    return { issues: [], value: void 0 };
  }
  return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
  });
  inst._zod.parse = (payload, ctx2) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx2);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, input));
      return handleOptionalResult(result, input);
    }
    if (payload.value === void 0) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx2);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx2) => {
    return def.innerType._zod.run(payload, ctx2);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
  });
  inst._zod.parse = (payload, ctx2) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx2);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx2) => {
    if (ctx2.direction === "backward") {
      return def.innerType._zod.run(payload, ctx2);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx2);
    if (result instanceof Promise) {
      return result.then((result2) => handleDefaultResult(result2, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === void 0) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx2) => {
    if (ctx2.direction === "backward") {
      return def.innerType._zod.run(payload, ctx2);
    }
    if (payload.value === void 0) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx2);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
  });
  inst._zod.parse = (payload, ctx2) => {
    const result = def.innerType._zod.run(payload, ctx2);
    if (result instanceof Promise) {
      return result.then((result2) => handleNonOptionalResult(result2, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === void 0) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx2) => {
    if (ctx2.direction === "backward") {
      return def.innerType._zod.run(payload, ctx2);
    }
    const result = def.innerType._zod.run(payload, ctx2);
    if (result instanceof Promise) {
      return result.then((result2) => {
        payload.value = result2.value;
        if (result2.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result2.issues.map((iss) => finalizeIssue(iss, ctx2, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx2, config()))
        },
        input: payload.value
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx2) => {
    if (ctx2.direction === "backward") {
      const right = def.out._zod.run(payload, ctx2);
      if (right instanceof Promise) {
        return right.then((right2) => handlePipeResult(right2, def.in, ctx2));
      }
      return handlePipeResult(right, def.in, ctx2);
    }
    const left = def.in._zod.run(payload, ctx2);
    if (left instanceof Promise) {
      return left.then((left2) => handlePipeResult(left2, def.out, ctx2));
    }
    return handlePipeResult(left, def.out, ctx2);
  };
});
function handlePipeResult(left, next, ctx2) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx2);
}
var $ZodPreprocess = /* @__PURE__ */ $constructor("$ZodPreprocess", (inst, def) => {
  $ZodPipe.init(inst, def);
});
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx2) => {
    if (ctx2.direction === "backward") {
      return def.innerType._zod.run(payload, ctx2);
    }
    const result = def.innerType._zod.run(payload, ctx2);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r2) => handleRefineResult(r2, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      // incorporates params.error into issue reporting
      path: [...inst._zod.def.path ?? []],
      // incorporates params.error into issue reporting
      continue: !inst._zod.def.abort
      // params: inst._zod.def.params,
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}

// node_modules/zod/v4/locales/en.js
var error = () => {
  const Sizable = {
    string: { unit: "characters", verb: "to have" },
    file: { unit: "bytes", verb: "to have" },
    array: { unit: "items", verb: "to have" },
    set: { unit: "items", verb: "to have" },
    map: { unit: "entries", verb: "to have" }
  };
  function getSizing(origin) {
    return Sizable[origin] ?? null;
  }
  const FormatDictionary = {
    regex: "input",
    email: "email address",
    url: "URL",
    emoji: "emoji",
    uuid: "UUID",
    uuidv4: "UUIDv4",
    uuidv6: "UUIDv6",
    nanoid: "nanoid",
    guid: "GUID",
    cuid: "cuid",
    cuid2: "cuid2",
    ulid: "ULID",
    xid: "XID",
    ksuid: "KSUID",
    datetime: "ISO datetime",
    date: "ISO date",
    time: "ISO time",
    duration: "ISO duration",
    ipv4: "IPv4 address",
    ipv6: "IPv6 address",
    mac: "MAC address",
    cidrv4: "IPv4 range",
    cidrv6: "IPv6 range",
    base64: "base64-encoded string",
    base64url: "base64url-encoded string",
    json_string: "JSON string",
    e164: "E.164 number",
    jwt: "JWT",
    template_literal: "input"
  };
  const TypeDictionary = {
    // Compatibility: "nan" -> "NaN" for display
    nan: "NaN"
    // All other type names omitted - they fall back to raw values via ?? operator
  };
  return (issue2) => {
    switch (issue2.code) {
      case "invalid_type": {
        const expected = TypeDictionary[issue2.expected] ?? issue2.expected;
        const receivedType = parsedType(issue2.input);
        const received = TypeDictionary[receivedType] ?? receivedType;
        return `Invalid input: expected ${expected}, received ${received}`;
      }
      case "invalid_value":
        if (issue2.values.length === 1)
          return `Invalid input: expected ${stringifyPrimitive(issue2.values[0])}`;
        return `Invalid option: expected one of ${joinValues(issue2.values, "|")}`;
      case "too_big": {
        const adj = issue2.inclusive ? "<=" : "<";
        const sizing = getSizing(issue2.origin);
        if (sizing)
          return `Too big: expected ${issue2.origin ?? "value"} to have ${adj}${issue2.maximum.toString()} ${sizing.unit ?? "elements"}`;
        return `Too big: expected ${issue2.origin ?? "value"} to be ${adj}${issue2.maximum.toString()}`;
      }
      case "too_small": {
        const adj = issue2.inclusive ? ">=" : ">";
        const sizing = getSizing(issue2.origin);
        if (sizing) {
          return `Too small: expected ${issue2.origin} to have ${adj}${issue2.minimum.toString()} ${sizing.unit}`;
        }
        return `Too small: expected ${issue2.origin} to be ${adj}${issue2.minimum.toString()}`;
      }
      case "invalid_format": {
        const _issue = issue2;
        if (_issue.format === "starts_with") {
          return `Invalid string: must start with "${_issue.prefix}"`;
        }
        if (_issue.format === "ends_with")
          return `Invalid string: must end with "${_issue.suffix}"`;
        if (_issue.format === "includes")
          return `Invalid string: must include "${_issue.includes}"`;
        if (_issue.format === "regex")
          return `Invalid string: must match pattern ${_issue.pattern}`;
        return `Invalid ${FormatDictionary[_issue.format] ?? issue2.format}`;
      }
      case "not_multiple_of":
        return `Invalid number: must be a multiple of ${issue2.divisor}`;
      case "unrecognized_keys":
        return `Unrecognized key${issue2.keys.length > 1 ? "s" : ""}: ${joinValues(issue2.keys, ", ")}`;
      case "invalid_key":
        return `Invalid key in ${issue2.origin}`;
      case "invalid_union":
        if (issue2.options && Array.isArray(issue2.options) && issue2.options.length > 0) {
          const opts = issue2.options.map((o) => `'${o}'`).join(" | ");
          return `Invalid discriminator value. Expected ${opts}`;
        }
        return "Invalid input";
      case "invalid_element":
        return `Invalid value in ${issue2.origin}`;
      default:
        return `Invalid input`;
    }
  };
};
function en_default() {
  return {
    localeError: error()
  };
}

// node_modules/zod/v4/core/registries.js
var _a2;
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");
var $ZodRegistry = class {
  constructor() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
  }
  add(schema, ..._meta) {
    const meta2 = _meta[0];
    this._map.set(schema, meta2);
    if (meta2 && typeof meta2 === "object" && "id" in meta2) {
      this._idmap.set(meta2.id, schema);
    }
    return this;
  }
  clear() {
    this._map = /* @__PURE__ */ new WeakMap();
    this._idmap = /* @__PURE__ */ new Map();
    return this;
  }
  remove(schema) {
    const meta2 = this._map.get(schema);
    if (meta2 && typeof meta2 === "object" && "id" in meta2) {
      this._idmap.delete(meta2.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : void 0;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
};
function registry() {
  return new $ZodRegistry();
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;

// node_modules/zod/v4/core/api.js
// @__NO_SIDE_EFFECTS__
function _string(Class2, params) {
  return new Class2({
    type: "string",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _email(Class2, params) {
  return new Class2({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _guid(Class2, params) {
  return new Class2({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uuidv7(Class2, params) {
  return new Class2({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _url(Class2, params) {
  return new Class2({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _emoji2(Class2, params) {
  return new Class2({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _nanoid(Class2, params) {
  return new Class2({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cuid2(Class2, params) {
  return new Class2({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ulid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _xid(Class2, params) {
  return new Class2({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ksuid(Class2, params) {
  return new Class2({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _ipv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv4(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _cidrv6(Class2, params) {
  return new Class2({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _base64url(Class2, params) {
  return new Class2({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _e164(Class2, params) {
  return new Class2({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _jwt(Class2, params) {
  return new Class2({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDateTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDate(Class2, params) {
  return new Class2({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoTime(Class2, params) {
  return new Class2({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _isoDuration(Class2, params) {
  return new Class2({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _number(Class2, params) {
  return new Class2({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _int(Class2, params) {
  return new Class2({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _boolean(Class2, params) {
  return new Class2({
    type: "boolean",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _null2(Class2, params) {
  return new Class2({
    type: "null",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _unknown(Class2) {
  return new Class2({
    type: "unknown"
  });
}
// @__NO_SIDE_EFFECTS__
function _never(Class2, params) {
  return new Class2({
    type: "never",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
// @__NO_SIDE_EFFECTS__
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
// @__NO_SIDE_EFFECTS__
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
// @__NO_SIDE_EFFECTS__
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
// @__NO_SIDE_EFFECTS__
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
// @__NO_SIDE_EFFECTS__
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
// @__NO_SIDE_EFFECTS__
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
// @__NO_SIDE_EFFECTS__
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
// @__NO_SIDE_EFFECTS__
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
// @__NO_SIDE_EFFECTS__
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
// @__NO_SIDE_EFFECTS__
function _normalize(form) {
  return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
}
// @__NO_SIDE_EFFECTS__
function _trim() {
  return /* @__PURE__ */ _overwrite((input) => input.trim());
}
// @__NO_SIDE_EFFECTS__
function _toLowerCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
}
// @__NO_SIDE_EFFECTS__
function _toUpperCase() {
  return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
}
// @__NO_SIDE_EFFECTS__
function _slugify() {
  return /* @__PURE__ */ _overwrite((input) => slugify(input));
}
// @__NO_SIDE_EFFECTS__
function _array(Class2, element, params) {
  return new Class2({
    type: "array",
    element,
    // get element() {
    //   return element;
    // },
    ...normalizeParams(params)
  });
}
// @__NO_SIDE_EFFECTS__
function _custom(Class2, fn, _params) {
  const norm = normalizeParams(_params);
  norm.abort ?? (norm.abort = true);
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...norm
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _refine(Class2, fn, _params) {
  const schema = new Class2({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
// @__NO_SIDE_EFFECTS__
function _superRefine(fn, params) {
  const ch = /* @__PURE__ */ _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
// @__NO_SIDE_EFFECTS__
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}

// node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {
    }),
    io: params?.io ?? "output",
    counter: 0,
    seen: /* @__PURE__ */ new Map(),
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? void 0
  };
}
function process2(schema, ctx2, _params = { path: [], schemaPath: [] }) {
  var _a3;
  const def = schema._zod.def;
  const seen = ctx2.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: void 0, path: _params.path };
  ctx2.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx2, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx2.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx2, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process2(parent, ctx2, params);
      ctx2.seen.get(parent).isParent = true;
    }
  }
  const meta2 = ctx2.metadataRegistry.get(schema);
  if (meta2)
    Object.assign(result.schema, meta2);
  if (ctx2.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx2.io === "input" && "_prefault" in result.schema)
    (_a3 = result.schema).default ?? (_a3.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx2.seen.get(schema);
  return _result.schema;
}
function extractDefs(ctx2, schema) {
  const root = ctx2.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = /* @__PURE__ */ new Map();
  for (const entry of ctx2.seen.entries()) {
    const id = ctx2.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx2.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx2.external) {
      const externalId = ctx2.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx2.external.uri ?? ((id2) => id2);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx2.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx2.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema2 = seen.schema;
    for (const key2 in schema2) {
      delete schema2[key2];
    }
    schema2.$ref = ref;
  };
  if (ctx2.cycles === "throw") {
    for (const entry of ctx2.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    }
  }
  for (const entry of ctx2.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx2.external) {
      const ext = ctx2.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx2.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx2.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx2, schema) {
  const root = ctx2.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx2.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema2 = seen.def ?? seen.schema;
    const _cached = { ...schema2 };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx2.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx2.target === "draft-07" || ctx2.target === "draft-04" || ctx2.target === "openapi-3.0")) {
        schema2.allOf = schema2.allOf ?? [];
        schema2.allOf.push(refSchema);
      } else {
        Object.assign(schema2, refSchema);
      }
      Object.assign(schema2, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key2 in schema2) {
          if (key2 === "$ref" || key2 === "allOf")
            continue;
          if (!(key2 in _cached)) {
            delete schema2[key2];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key2 in schema2) {
          if (key2 === "$ref" || key2 === "allOf")
            continue;
          if (key2 in refSeen.def && JSON.stringify(schema2[key2]) === JSON.stringify(refSeen.def[key2])) {
            delete schema2[key2];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx2.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema2.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key2 in schema2) {
            if (key2 === "$ref" || key2 === "allOf")
              continue;
            if (key2 in parentSeen.def && JSON.stringify(schema2[key2]) === JSON.stringify(parentSeen.def[key2])) {
              delete schema2[key2];
            }
          }
        }
      }
    }
    ctx2.override({
      zodSchema,
      jsonSchema: schema2,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx2.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx2.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx2.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx2.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx2.target === "openapi-3.0") {
  } else {
  }
  if (ctx2.external?.uri) {
    const id = ctx2.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx2.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx2.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== void 0 && result.id === rootMetaId)
    delete result.id;
  const defs = ctx2.external?.defs ?? {};
  for (const entry of ctx2.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx2.external) {
  } else {
    if (Object.keys(defs).length > 0) {
      if (ctx2.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx2.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx2.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx2 = _ctx ?? { seen: /* @__PURE__ */ new Set() };
  if (ctx2.seen.has(_schema))
    return false;
  ctx2.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx2);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx2);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx2);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx2);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx2) || isTransforming(def.right, ctx2);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx2) || isTransforming(def.valueType, ctx2);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx2) || isTransforming(def.out, ctx2);
  }
  if (def.type === "object") {
    for (const key2 in def.shape) {
      if (isTransforming(def.shape[key2], ctx2))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx2))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx2))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx2))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx2 = initializeContext({ ...params, processors });
  process2(schema, ctx2);
  extractDefs(ctx2, schema);
  return finalize(ctx2, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx2 = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process2(schema, ctx2);
  extractDefs(ctx2, schema);
  return finalize(ctx2, schema);
};

// node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
  // do not set
};
var stringProcessor = (schema, ctx2, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time") {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json.allOf = [
        ...regexes.map((regex) => ({
          ...ctx2.target === "draft-07" || ctx2.target === "draft-04" || ctx2.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx2, _json, _params) => {
  const json = _json;
  const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
  if (typeof format === "string" && format.includes("int"))
    json.type = "integer";
  else
    json.type = "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx2.target === "draft-04" || ctx2.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (typeof multipleOf === "number")
    json.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var nullProcessor = (_schema, ctx2, json, _params) => {
  if (ctx2.target === "openapi-3.0") {
    json.type = "string";
    json.nullable = true;
    json.enum = [null];
  } else {
    json.type = "null";
  }
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {
};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var literalProcessor = (schema, ctx2, json, _params) => {
  const def = schema._zod.def;
  const vals = [];
  for (const val of def.values) {
    if (val === void 0) {
      if (ctx2.unrepresentable === "throw") {
        throw new Error("Literal `undefined` cannot be represented in JSON Schema");
      } else {
      }
    } else if (typeof val === "bigint") {
      if (ctx2.unrepresentable === "throw") {
        throw new Error("BigInt literals cannot be represented in JSON Schema");
      } else {
        vals.push(Number(val));
      }
    } else {
      vals.push(val);
    }
  }
  if (vals.length === 0) {
  } else if (vals.length === 1) {
    const val = vals[0];
    json.type = val === null ? "null" : typeof val;
    if (ctx2.target === "draft-04" || ctx2.target === "openapi-3.0") {
      json.enum = [val];
    } else {
      json.const = val;
    }
  } else {
    if (vals.every((v) => typeof v === "number"))
      json.type = "number";
    if (vals.every((v) => typeof v === "string"))
      json.type = "string";
    if (vals.every((v) => typeof v === "boolean"))
      json.type = "boolean";
    if (vals.every((v) => v === null))
      json.type = "null";
    json.enum = vals;
  }
};
var customProcessor = (_schema, ctx2, _json, _params) => {
  if (ctx2.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
var transformProcessor = (_schema, ctx2, _json, _params) => {
  if (ctx2.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
var arrayProcessor = (schema, ctx2, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = process2(def.element, ctx2, {
    ...params,
    path: [...params.path, "items"]
  });
};
var objectProcessor = (schema, ctx2, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  json.properties = {};
  const shape = def.shape;
  for (const key2 in shape) {
    json.properties[key2] = process2(shape[key2], ctx2, {
      ...params,
      path: [...params.path, "properties", key2]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key2) => {
    const v = def.shape[key2]._zod;
    if (ctx2.io === "input") {
      return v.optin === void 0;
    } else {
      return v.optout === void 0;
    }
  }));
  if (requiredKeys.size > 0) {
    json.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx2.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = process2(def.catchall, ctx2, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => process2(x, ctx2, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  const a = process2(def.left, ctx2, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process2(def.right, ctx2, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
};
var recordProcessor = (schema, ctx2, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  const keyType = def.keyType;
  const keyBag = keyType._zod.bag;
  const patterns = keyBag?.patterns;
  if (def.mode === "loose" && patterns && patterns.size > 0) {
    const valueSchema = process2(def.valueType, ctx2, {
      ...params,
      path: [...params.path, "patternProperties", "*"]
    });
    json.patternProperties = {};
    for (const pattern of patterns) {
      json.patternProperties[pattern.source] = valueSchema;
    }
  } else {
    if (ctx2.target === "draft-07" || ctx2.target === "draft-2020-12") {
      json.propertyNames = process2(def.keyType, ctx2, {
        ...params,
        path: [...params.path, "propertyNames"]
      });
    }
    json.additionalProperties = process2(def.valueType, ctx2, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
  const keyValues = keyType._zod.values;
  if (keyValues) {
    const validKeyValues = [...keyValues].filter((v) => typeof v === "string" || typeof v === "number");
    if (validKeyValues.length > 0) {
      json.required = validKeyValues;
    }
  }
};
var nullableProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  const inner = process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  if (ctx2.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx2, _json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = def.innerType;
  json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx2.io === "input")
    json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(void 0);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx2, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx2.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  process2(innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx2, json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var optionalProcessor = (schema, ctx2, _json, params) => {
  const def = schema._zod.def;
  process2(def.innerType, ctx2, params);
  const seen = ctx2.seen.get(schema);
  seen.ref = def.innerType;
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-compat.js
function isZ4Schema(s) {
  const schema = s;
  return !!schema._zod;
}
function safeParse2(schema, data) {
  if (isZ4Schema(schema)) {
    const result2 = safeParse(schema, data);
    return result2;
  }
  const v3Schema = schema;
  const result = v3Schema.safeParse(data);
  return result;
}
function getObjectShape(schema) {
  if (!schema)
    return void 0;
  let rawShape;
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    rawShape = v4Schema._zod?.def?.shape;
  } else {
    const v3Schema = schema;
    rawShape = v3Schema.shape;
  }
  if (!rawShape)
    return void 0;
  if (typeof rawShape === "function") {
    try {
      return rawShape();
    } catch {
      return void 0;
    }
  }
  return rawShape;
}
function getLiteralValue(schema) {
  if (isZ4Schema(schema)) {
    const v4Schema = schema;
    const def2 = v4Schema._zod?.def;
    if (def2) {
      if (def2.value !== void 0)
        return def2.value;
      if (Array.isArray(def2.values) && def2.values.length > 0) {
        return def2.values[0];
      }
    }
  }
  const v3Schema = schema;
  const def = v3Schema._def;
  if (def) {
    if (def.value !== void 0)
      return def.value;
    if (Array.isArray(def.values) && def.values.length > 0) {
      return def.values[0];
    }
  }
  const directValue = schema.value;
  if (directValue !== void 0)
    return directValue;
  return void 0;
}

// node_modules/zod/v4/classic/iso.js
var iso_exports = {};
__export(iso_exports, {
  ZodISODate: () => ZodISODate,
  ZodISODateTime: () => ZodISODateTime,
  ZodISODuration: () => ZodISODuration,
  ZodISOTime: () => ZodISOTime,
  date: () => date2,
  datetime: () => datetime2,
  duration: () => duration2,
  time: () => time2
});
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
      // enumerable: false,
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
      // enumerable: false,
    },
    addIssue: {
      value: (issue2) => {
        inst.issues.push(issue2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    addIssues: {
      value: (issues2) => {
        inst.issues.push(...issues2);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
      // enumerable: false,
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
      // enumerable: false,
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, {
  Parent: Error
});

// node_modules/zod/v4/classic/parse.js
var parse2 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse3 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode2 = /* @__PURE__ */ _encode(ZodRealError);
var decode2 = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync2 = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync2 = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode2 = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode2 = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync2 = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync2 = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// node_modules/zod/v4/classic/schemas.js
var _installedGroups = /* @__PURE__ */ new WeakMap();
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = /* @__PURE__ */ new Set();
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key2 in methods) {
    const fn = methods[key2];
    Object.defineProperty(proto, key2, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key2, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key2, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v
        });
      }
    });
  }
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output")
    }
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) => parse2(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse3(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode2(inst, data, params);
  inst.decode = (data, params) => decode2(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync2(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync2(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode2(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode2(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync2(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync2(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    check(...chks) {
      const def2 = this.def;
      return this.clone(util_exports.mergeDefs(def2, {
        checks: [
          ...def2.checks ?? [],
          ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }), { parent: true });
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def2, params) {
      return clone(this, def2, params);
    },
    brand() {
      return this;
    },
    register(reg, meta2) {
      reg.add(this, meta2);
      return this;
    },
    refine(check, params) {
      return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(_overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args) {
      if (args.length === 0)
        return globalRegistry.get(this);
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(void 0).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn) {
      return fn(this);
    }
  });
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => stringProcessor(inst, ctx2, json, params);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  });
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => numberProcessor(inst, ctx2, json, params);
  _installLazyMethods(inst, "ZodNumber", {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  });
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => booleanProcessor(inst, ctx2, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodNull = /* @__PURE__ */ $constructor("ZodNull", (inst, def) => {
  $ZodNull.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => nullProcessor(inst, ctx2, json, params);
});
function _null3(params) {
  return _null2(ZodNull, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => unknownProcessor(inst, ctx2, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => neverProcessor(inst, ctx2, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => arrayProcessor(inst, ctx2, json, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    min(n, params) {
      return this.check(_minLength(n, params));
    },
    nonempty(params) {
      return this.check(_minLength(1, params));
    },
    max(n, params) {
      return this.check(_maxLength(n, params));
    },
    length(n, params) {
      return this.check(_length(n, params));
    },
    unwrap() {
      return this.element;
    }
  });
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => objectProcessor(inst, ctx2, json, params);
  util_exports.defineLazy(inst, "shape", () => {
    return def.shape;
  });
  _installLazyMethods(inst, "ZodObject", {
    keyof() {
      return _enum(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: void 0 });
    },
    extend(incoming) {
      return util_exports.extend(this, incoming);
    },
    safeExtend(incoming) {
      return util_exports.safeExtend(this, incoming);
    },
    merge(other) {
      return util_exports.merge(this, other);
    },
    pick(mask) {
      return util_exports.pick(this, mask);
    },
    omit(mask) {
      return util_exports.omit(this, mask);
    },
    partial(...args) {
      return util_exports.partial(ZodOptional, this, args[0]);
    },
    required(...args) {
      return util_exports.required(ZodNonOptional, this, args[0]);
    }
  });
});
function object2(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...util_exports.normalizeParams(params)
  };
  return new ZodObject(def);
}
function looseObject(shape, params) {
  return new ZodObject({
    type: "object",
    shape,
    catchall: unknown(),
    ...util_exports.normalizeParams(params)
  });
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => unionProcessor(inst, ctx2, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...util_exports.normalizeParams(params)
  });
}
var ZodDiscriminatedUnion = /* @__PURE__ */ $constructor("ZodDiscriminatedUnion", (inst, def) => {
  ZodUnion.init(inst, def);
  $ZodDiscriminatedUnion.init(inst, def);
});
function discriminatedUnion(discriminator, options, params) {
  return new ZodDiscriminatedUnion({
    type: "union",
    options,
    discriminator,
    ...util_exports.normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => intersectionProcessor(inst, ctx2, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodRecord = /* @__PURE__ */ $constructor("ZodRecord", (inst, def) => {
  $ZodRecord.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => recordProcessor(inst, ctx2, json, params);
  inst.keyType = def.keyType;
  inst.valueType = def.valueType;
});
function record(keyType, valueType, params) {
  if (!valueType || !valueType._zod) {
    return new ZodRecord({
      type: "record",
      keyType: string2(),
      valueType: keyType,
      ...util_exports.normalizeParams(valueType)
    });
  }
  return new ZodRecord({
    type: "record",
    keyType,
    valueType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => enumProcessor(inst, ctx2, json, params);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...util_exports.normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...util_exports.normalizeParams(params)
  });
}
var ZodLiteral = /* @__PURE__ */ $constructor("ZodLiteral", (inst, def) => {
  $ZodLiteral.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => literalProcessor(inst, ctx2, json, params);
  inst.values = new Set(def.values);
  Object.defineProperty(inst, "value", {
    get() {
      if (def.values.length > 1) {
        throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
      }
      return def.values[0];
    }
  });
});
function literal(value, params) {
  return new ZodLiteral({
    type: "literal",
    values: Array.isArray(value) ? value : [value],
    ...util_exports.normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => transformProcessor(inst, ctx2, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(util_exports.issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(util_exports.issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output2) => {
        payload.value = output2;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => optionalProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => optionalProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => nullableProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => defaultProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => prefaultProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : util_exports.shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => nonoptionalProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...util_exports.normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => catchProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => pipeProcessor(inst, ctx2, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
    // ...util.normalizeParams(params),
  });
}
var ZodPreprocess = /* @__PURE__ */ $constructor("ZodPreprocess", (inst, def) => {
  ZodPipe.init(inst, def);
  $ZodPreprocess.init(inst, def);
});
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => readonlyProcessor(inst, ctx2, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx2, json, params) => customProcessor(inst, ctx2, json, params);
});
function custom(fn, _params) {
  return _custom(ZodCustom, fn ?? (() => true), _params);
}
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
function preprocess(fn, schema) {
  return new ZodPreprocess({
    type: "pipe",
    in: transform(fn),
    out: schema
  });
}

// node_modules/zod/v4/classic/external.js
config(en_default());

// node_modules/@modelcontextprotocol/sdk/dist/esm/types.js
var LATEST_PROTOCOL_VERSION = "2025-11-25";
var SUPPORTED_PROTOCOL_VERSIONS = [LATEST_PROTOCOL_VERSION, "2025-06-18", "2025-03-26", "2024-11-05", "2024-10-07"];
var RELATED_TASK_META_KEY = "io.modelcontextprotocol/related-task";
var JSONRPC_VERSION = "2.0";
var AssertObjectSchema = custom((v) => v !== null && (typeof v === "object" || typeof v === "function"));
var ProgressTokenSchema = union([string2(), number2().int()]);
var CursorSchema = string2();
var TaskCreationParamsSchema = looseObject({
  /**
   * Requested duration in milliseconds to retain task from creation.
   */
  ttl: number2().optional(),
  /**
   * Time in milliseconds to wait between task status requests.
   */
  pollInterval: number2().optional()
});
var TaskMetadataSchema = object2({
  ttl: number2().optional()
});
var RelatedTaskMetadataSchema = object2({
  taskId: string2()
});
var RequestMetaSchema = looseObject({
  /**
   * If specified, the caller is requesting out-of-band progress notifications for this request (as represented by notifications/progress). The value of this parameter is an opaque token that will be attached to any subsequent notifications. The receiver is not obligated to provide these notifications.
   */
  progressToken: ProgressTokenSchema.optional(),
  /**
   * If specified, this request is related to the provided task.
   */
  [RELATED_TASK_META_KEY]: RelatedTaskMetadataSchema.optional()
});
var BaseRequestParamsSchema = object2({
  /**
   * See [General fields: `_meta`](/specification/draft/basic/index#meta) for notes on `_meta` usage.
   */
  _meta: RequestMetaSchema.optional()
});
var TaskAugmentedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * If specified, the caller is requesting task-augmented execution for this request.
   * The request will return a CreateTaskResult immediately, and the actual result can be
   * retrieved later via tasks/result.
   *
   * Task augmentation is subject to capability negotiation - receivers MUST declare support
   * for task augmentation of specific request types in their capabilities.
   */
  task: TaskMetadataSchema.optional()
});
var isTaskAugmentedRequestParams = (value) => TaskAugmentedRequestParamsSchema.safeParse(value).success;
var RequestSchema = object2({
  method: string2(),
  params: BaseRequestParamsSchema.loose().optional()
});
var NotificationsParamsSchema = object2({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
});
var NotificationSchema = object2({
  method: string2(),
  params: NotificationsParamsSchema.loose().optional()
});
var ResultSchema = looseObject({
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: RequestMetaSchema.optional()
});
var RequestIdSchema = union([string2(), number2().int()]);
var JSONRPCRequestSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  ...RequestSchema.shape
}).strict();
var isJSONRPCRequest = (value) => JSONRPCRequestSchema.safeParse(value).success;
var JSONRPCNotificationSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  ...NotificationSchema.shape
}).strict();
var isJSONRPCNotification = (value) => JSONRPCNotificationSchema.safeParse(value).success;
var JSONRPCResultResponseSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema,
  result: ResultSchema
}).strict();
var isJSONRPCResultResponse = (value) => JSONRPCResultResponseSchema.safeParse(value).success;
var ErrorCode;
(function(ErrorCode2) {
  ErrorCode2[ErrorCode2["ConnectionClosed"] = -32e3] = "ConnectionClosed";
  ErrorCode2[ErrorCode2["RequestTimeout"] = -32001] = "RequestTimeout";
  ErrorCode2[ErrorCode2["ParseError"] = -32700] = "ParseError";
  ErrorCode2[ErrorCode2["InvalidRequest"] = -32600] = "InvalidRequest";
  ErrorCode2[ErrorCode2["MethodNotFound"] = -32601] = "MethodNotFound";
  ErrorCode2[ErrorCode2["InvalidParams"] = -32602] = "InvalidParams";
  ErrorCode2[ErrorCode2["InternalError"] = -32603] = "InternalError";
  ErrorCode2[ErrorCode2["UrlElicitationRequired"] = -32042] = "UrlElicitationRequired";
})(ErrorCode || (ErrorCode = {}));
var JSONRPCErrorResponseSchema = object2({
  jsonrpc: literal(JSONRPC_VERSION),
  id: RequestIdSchema.optional(),
  error: object2({
    /**
     * The error type that occurred.
     */
    code: number2().int(),
    /**
     * A short description of the error. The message SHOULD be limited to a concise single sentence.
     */
    message: string2(),
    /**
     * Additional information about the error. The value of this member is defined by the sender (e.g. detailed error information, nested errors etc.).
     */
    data: unknown().optional()
  })
}).strict();
var isJSONRPCErrorResponse = (value) => JSONRPCErrorResponseSchema.safeParse(value).success;
var JSONRPCMessageSchema = union([
  JSONRPCRequestSchema,
  JSONRPCNotificationSchema,
  JSONRPCResultResponseSchema,
  JSONRPCErrorResponseSchema
]);
var JSONRPCResponseSchema = union([JSONRPCResultResponseSchema, JSONRPCErrorResponseSchema]);
var EmptyResultSchema = ResultSchema.strict();
var CancelledNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the request to cancel.
   *
   * This MUST correspond to the ID of a request previously issued in the same direction.
   */
  requestId: RequestIdSchema.optional(),
  /**
   * An optional string describing the reason for the cancellation. This MAY be logged or presented to the user.
   */
  reason: string2().optional()
});
var CancelledNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/cancelled"),
  params: CancelledNotificationParamsSchema
});
var IconSchema = object2({
  /**
   * URL or data URI for the icon.
   */
  src: string2(),
  /**
   * Optional MIME type for the icon.
   */
  mimeType: string2().optional(),
  /**
   * Optional array of strings that specify sizes at which the icon can be used.
   * Each string should be in WxH format (e.g., `"48x48"`, `"96x96"`) or `"any"` for scalable formats like SVG.
   *
   * If not provided, the client should assume that the icon can be used at any size.
   */
  sizes: array(string2()).optional(),
  /**
   * Optional specifier for the theme this icon is designed for. `light` indicates
   * the icon is designed to be used with a light background, and `dark` indicates
   * the icon is designed to be used with a dark background.
   *
   * If not provided, the client should assume the icon can be used with any theme.
   */
  theme: _enum(["light", "dark"]).optional()
});
var IconsSchema = object2({
  /**
   * Optional set of sized icons that the client can display in a user interface.
   *
   * Clients that support rendering icons MUST support at least the following MIME types:
   * - `image/png` - PNG images (safe, universal compatibility)
   * - `image/jpeg` (and `image/jpg`) - JPEG images (safe, universal compatibility)
   *
   * Clients that support rendering icons SHOULD also support:
   * - `image/svg+xml` - SVG images (scalable but requires security precautions)
   * - `image/webp` - WebP images (modern, efficient format)
   */
  icons: array(IconSchema).optional()
});
var BaseMetadataSchema = object2({
  /** Intended for programmatic or logical use, but used as a display name in past specs or fallback */
  name: string2(),
  /**
   * Intended for UI and end-user contexts — optimized to be human-readable and easily understood,
   * even by those unfamiliar with domain-specific terminology.
   *
   * If not provided, the name should be used for display (except for Tool,
   * where `annotations.title` should be given precedence over using `name`,
   * if present).
   */
  title: string2().optional()
});
var ImplementationSchema = BaseMetadataSchema.extend({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  version: string2(),
  /**
   * An optional URL of the website for this implementation.
   */
  websiteUrl: string2().optional(),
  /**
   * An optional human-readable description of what this implementation does.
   *
   * This can be used by clients or servers to provide context about their purpose
   * and capabilities. For example, a server might describe the types of resources
   * or tools it provides, while a client might describe its intended use case.
   */
  description: string2().optional()
});
var FormElicitationCapabilitySchema = intersection(object2({
  applyDefaults: boolean2().optional()
}), record(string2(), unknown()));
var ElicitationCapabilitySchema = preprocess((value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    if (Object.keys(value).length === 0) {
      return { form: {} };
    }
  }
  return value;
}, intersection(object2({
  form: FormElicitationCapabilitySchema.optional(),
  url: AssertObjectSchema.optional()
}), record(string2(), unknown()).optional()));
var ClientTasksCapabilitySchema = looseObject({
  /**
   * Present if the client supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the client supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: looseObject({
    /**
     * Task support for sampling requests.
     */
    sampling: looseObject({
      createMessage: AssertObjectSchema.optional()
    }).optional(),
    /**
     * Task support for elicitation requests.
     */
    elicitation: looseObject({
      create: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ServerTasksCapabilitySchema = looseObject({
  /**
   * Present if the server supports listing tasks.
   */
  list: AssertObjectSchema.optional(),
  /**
   * Present if the server supports cancelling tasks.
   */
  cancel: AssertObjectSchema.optional(),
  /**
   * Capabilities for task creation on specific request types.
   */
  requests: looseObject({
    /**
     * Task support for tool requests.
     */
    tools: looseObject({
      call: AssertObjectSchema.optional()
    }).optional()
  }).optional()
});
var ClientCapabilitiesSchema = object2({
  /**
   * Experimental, non-standard capabilities that the client supports.
   */
  experimental: record(string2(), AssertObjectSchema).optional(),
  /**
   * Present if the client supports sampling from an LLM.
   */
  sampling: object2({
    /**
     * Present if the client supports context inclusion via includeContext parameter.
     * If not declared, servers SHOULD only use `includeContext: "none"` (or omit it).
     */
    context: AssertObjectSchema.optional(),
    /**
     * Present if the client supports tool use via tools and toolChoice parameters.
     */
    tools: AssertObjectSchema.optional()
  }).optional(),
  /**
   * Present if the client supports eliciting user input.
   */
  elicitation: ElicitationCapabilitySchema.optional(),
  /**
   * Present if the client supports listing roots.
   */
  roots: object2({
    /**
     * Whether the client supports issuing notifications for changes to the roots list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the client supports task creation.
   */
  tasks: ClientTasksCapabilitySchema.optional(),
  /**
   * Extensions that the client supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: record(string2(), AssertObjectSchema).optional()
});
var InitializeRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The latest version of the Model Context Protocol that the client supports. The client MAY decide to support older versions as well.
   */
  protocolVersion: string2(),
  capabilities: ClientCapabilitiesSchema,
  clientInfo: ImplementationSchema
});
var InitializeRequestSchema = RequestSchema.extend({
  method: literal("initialize"),
  params: InitializeRequestParamsSchema
});
var ServerCapabilitiesSchema = object2({
  /**
   * Experimental, non-standard capabilities that the server supports.
   */
  experimental: record(string2(), AssertObjectSchema).optional(),
  /**
   * Present if the server supports sending log messages to the client.
   */
  logging: AssertObjectSchema.optional(),
  /**
   * Present if the server supports sending completions to the client.
   */
  completions: AssertObjectSchema.optional(),
  /**
   * Present if the server offers any prompt templates.
   */
  prompts: object2({
    /**
     * Whether this server supports issuing notifications for changes to the prompt list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server offers any resources to read.
   */
  resources: object2({
    /**
     * Whether this server supports clients subscribing to resource updates.
     */
    subscribe: boolean2().optional(),
    /**
     * Whether this server supports issuing notifications for changes to the resource list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server offers any tools to call.
   */
  tools: object2({
    /**
     * Whether this server supports issuing notifications for changes to the tool list.
     */
    listChanged: boolean2().optional()
  }).optional(),
  /**
   * Present if the server supports task creation.
   */
  tasks: ServerTasksCapabilitySchema.optional(),
  /**
   * Extensions that the server supports. Keys are extension identifiers (vendor-prefix/extension-name).
   */
  extensions: record(string2(), AssertObjectSchema).optional()
});
var InitializeResultSchema = ResultSchema.extend({
  /**
   * The version of the Model Context Protocol that the server wants to use. This may not match the version that the client requested. If the client cannot support this version, it MUST disconnect.
   */
  protocolVersion: string2(),
  capabilities: ServerCapabilitiesSchema,
  serverInfo: ImplementationSchema,
  /**
   * Instructions describing how to use the server and its features.
   *
   * This can be used by clients to improve the LLM's understanding of available tools, resources, etc. It can be thought of like a "hint" to the model. For example, this information MAY be added to the system prompt.
   */
  instructions: string2().optional()
});
var InitializedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/initialized"),
  params: NotificationsParamsSchema.optional()
});
var PingRequestSchema = RequestSchema.extend({
  method: literal("ping"),
  params: BaseRequestParamsSchema.optional()
});
var ProgressSchema = object2({
  /**
   * The progress thus far. This should increase every time progress is made, even if the total is unknown.
   */
  progress: number2(),
  /**
   * Total number of items to process (or total progress required), if known.
   */
  total: optional(number2()),
  /**
   * An optional message describing the current progress.
   */
  message: optional(string2())
});
var ProgressNotificationParamsSchema = object2({
  ...NotificationsParamsSchema.shape,
  ...ProgressSchema.shape,
  /**
   * The progress token which was given in the initial request, used to associate this notification with the request that is proceeding.
   */
  progressToken: ProgressTokenSchema
});
var ProgressNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/progress"),
  params: ProgressNotificationParamsSchema
});
var PaginatedRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * An opaque token representing the current pagination position.
   * If provided, the server should return results starting after this cursor.
   */
  cursor: CursorSchema.optional()
});
var PaginatedRequestSchema = RequestSchema.extend({
  params: PaginatedRequestParamsSchema.optional()
});
var PaginatedResultSchema = ResultSchema.extend({
  /**
   * An opaque token representing the pagination position after the last returned result.
   * If present, there may be more results available.
   */
  nextCursor: CursorSchema.optional()
});
var TaskStatusSchema = _enum(["working", "input_required", "completed", "failed", "cancelled"]);
var TaskSchema = object2({
  taskId: string2(),
  status: TaskStatusSchema,
  /**
   * Time in milliseconds to keep task results available after completion.
   * If null, the task has unlimited lifetime until manually cleaned up.
   */
  ttl: union([number2(), _null3()]),
  /**
   * ISO 8601 timestamp when the task was created.
   */
  createdAt: string2(),
  /**
   * ISO 8601 timestamp when the task was last updated.
   */
  lastUpdatedAt: string2(),
  pollInterval: optional(number2()),
  /**
   * Optional diagnostic message for failed tasks or other status information.
   */
  statusMessage: optional(string2())
});
var CreateTaskResultSchema = ResultSchema.extend({
  task: TaskSchema
});
var TaskStatusNotificationParamsSchema = NotificationsParamsSchema.merge(TaskSchema);
var TaskStatusNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tasks/status"),
  params: TaskStatusNotificationParamsSchema
});
var GetTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/get"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var GetTaskResultSchema = ResultSchema.merge(TaskSchema);
var GetTaskPayloadRequestSchema = RequestSchema.extend({
  method: literal("tasks/result"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var GetTaskPayloadResultSchema = ResultSchema.loose();
var ListTasksRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tasks/list")
});
var ListTasksResultSchema = PaginatedResultSchema.extend({
  tasks: array(TaskSchema)
});
var CancelTaskRequestSchema = RequestSchema.extend({
  method: literal("tasks/cancel"),
  params: BaseRequestParamsSchema.extend({
    taskId: string2()
  })
});
var CancelTaskResultSchema = ResultSchema.merge(TaskSchema);
var ResourceContentsSchema = object2({
  /**
   * The URI of this resource.
   */
  uri: string2(),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string2()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var TextResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
   */
  text: string2()
});
var Base64Schema = string2().refine((val) => {
  try {
    atob(val);
    return true;
  } catch {
    return false;
  }
}, { message: "Invalid Base64 string" });
var BlobResourceContentsSchema = ResourceContentsSchema.extend({
  /**
   * A base64-encoded string representing the binary data of the item.
   */
  blob: Base64Schema
});
var RoleSchema = _enum(["user", "assistant"]);
var AnnotationsSchema = object2({
  /**
   * Intended audience(s) for the resource.
   */
  audience: array(RoleSchema).optional(),
  /**
   * Importance hint for the resource, from 0 (least) to 1 (most).
   */
  priority: number2().min(0).max(1).optional(),
  /**
   * ISO 8601 timestamp for the most recent modification.
   */
  lastModified: iso_exports.datetime({ offset: true }).optional()
});
var ResourceSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * The URI of this resource.
   */
  uri: string2(),
  /**
   * A description of what this resource represents.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string2()),
  /**
   * The MIME type of this resource, if known.
   */
  mimeType: optional(string2()),
  /**
   * The size of the raw resource content, in bytes (i.e., before base64 encoding or any tokenization), if known.
   *
   * This can be used by Hosts to display file sizes and estimate context window usage.
   */
  size: optional(number2()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ResourceTemplateSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A URI template (according to RFC 6570) that can be used to construct resource URIs.
   */
  uriTemplate: string2(),
  /**
   * A description of what this template is for.
   *
   * This can be used by clients to improve the LLM's understanding of available resources. It can be thought of like a "hint" to the model.
   */
  description: optional(string2()),
  /**
   * The MIME type for all resources that match this template. This should only be included if all resources matching this template have the same type.
   */
  mimeType: optional(string2()),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ListResourcesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/list")
});
var ListResourcesResultSchema = PaginatedResultSchema.extend({
  resources: array(ResourceSchema)
});
var ListResourceTemplatesRequestSchema = PaginatedRequestSchema.extend({
  method: literal("resources/templates/list")
});
var ListResourceTemplatesResultSchema = PaginatedResultSchema.extend({
  resourceTemplates: array(ResourceTemplateSchema)
});
var ResourceRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The URI of the resource to read. The URI can use any protocol; it is up to the server how to interpret it.
   *
   * @format uri
   */
  uri: string2()
});
var ReadResourceRequestParamsSchema = ResourceRequestParamsSchema;
var ReadResourceRequestSchema = RequestSchema.extend({
  method: literal("resources/read"),
  params: ReadResourceRequestParamsSchema
});
var ReadResourceResultSchema = ResultSchema.extend({
  contents: array(union([TextResourceContentsSchema, BlobResourceContentsSchema]))
});
var ResourceListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var SubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var SubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/subscribe"),
  params: SubscribeRequestParamsSchema
});
var UnsubscribeRequestParamsSchema = ResourceRequestParamsSchema;
var UnsubscribeRequestSchema = RequestSchema.extend({
  method: literal("resources/unsubscribe"),
  params: UnsubscribeRequestParamsSchema
});
var ResourceUpdatedNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The URI of the resource that has been updated. This might be a sub-resource of the one that the client actually subscribed to.
   */
  uri: string2()
});
var ResourceUpdatedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/resources/updated"),
  params: ResourceUpdatedNotificationParamsSchema
});
var PromptArgumentSchema = object2({
  /**
   * The name of the argument.
   */
  name: string2(),
  /**
   * A human-readable description of the argument.
   */
  description: optional(string2()),
  /**
   * Whether this argument must be provided.
   */
  required: optional(boolean2())
});
var PromptSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * An optional description of what this prompt provides
   */
  description: optional(string2()),
  /**
   * A list of arguments to use for templating the prompt.
   */
  arguments: optional(array(PromptArgumentSchema)),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: optional(looseObject({}))
});
var ListPromptsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("prompts/list")
});
var ListPromptsResultSchema = PaginatedResultSchema.extend({
  prompts: array(PromptSchema)
});
var GetPromptRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The name of the prompt or prompt template.
   */
  name: string2(),
  /**
   * Arguments to use for templating the prompt.
   */
  arguments: record(string2(), string2()).optional()
});
var GetPromptRequestSchema = RequestSchema.extend({
  method: literal("prompts/get"),
  params: GetPromptRequestParamsSchema
});
var TextContentSchema = object2({
  type: literal("text"),
  /**
   * The text content of the message.
   */
  text: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ImageContentSchema = object2({
  type: literal("image"),
  /**
   * The base64-encoded image data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the image. Different providers may support different image types.
   */
  mimeType: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var AudioContentSchema = object2({
  type: literal("audio"),
  /**
   * The base64-encoded audio data.
   */
  data: Base64Schema,
  /**
   * The MIME type of the audio. Different providers may support different audio types.
   */
  mimeType: string2(),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ToolUseContentSchema = object2({
  type: literal("tool_use"),
  /**
   * The name of the tool to invoke.
   * Must match a tool name from the request's tools array.
   */
  name: string2(),
  /**
   * Unique identifier for this tool call.
   * Used to correlate with ToolResultContent in subsequent messages.
   */
  id: string2(),
  /**
   * Arguments to pass to the tool.
   * Must conform to the tool's inputSchema.
   */
  input: record(string2(), unknown()),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var EmbeddedResourceSchema = object2({
  type: literal("resource"),
  resource: union([TextResourceContentsSchema, BlobResourceContentsSchema]),
  /**
   * Optional annotations for the client.
   */
  annotations: AnnotationsSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ResourceLinkSchema = ResourceSchema.extend({
  type: literal("resource_link")
});
var ContentBlockSchema = union([
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ResourceLinkSchema,
  EmbeddedResourceSchema
]);
var PromptMessageSchema = object2({
  role: RoleSchema,
  content: ContentBlockSchema
});
var GetPromptResultSchema = ResultSchema.extend({
  /**
   * An optional description for the prompt.
   */
  description: string2().optional(),
  messages: array(PromptMessageSchema)
});
var PromptListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/prompts/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ToolAnnotationsSchema = object2({
  /**
   * A human-readable title for the tool.
   */
  title: string2().optional(),
  /**
   * If true, the tool does not modify its environment.
   *
   * Default: false
   */
  readOnlyHint: boolean2().optional(),
  /**
   * If true, the tool may perform destructive updates to its environment.
   * If false, the tool performs only additive updates.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: true
   */
  destructiveHint: boolean2().optional(),
  /**
   * If true, calling the tool repeatedly with the same arguments
   * will have no additional effect on the its environment.
   *
   * (This property is meaningful only when `readOnlyHint == false`)
   *
   * Default: false
   */
  idempotentHint: boolean2().optional(),
  /**
   * If true, this tool may interact with an "open world" of external
   * entities. If false, the tool's domain of interaction is closed.
   * For example, the world of a web search tool is open, whereas that
   * of a memory tool is not.
   *
   * Default: true
   */
  openWorldHint: boolean2().optional()
});
var ToolExecutionSchema = object2({
  /**
   * Indicates the tool's preference for task-augmented execution.
   * - "required": Clients MUST invoke the tool as a task
   * - "optional": Clients MAY invoke the tool as a task or normal request
   * - "forbidden": Clients MUST NOT attempt to invoke the tool as a task
   *
   * If not present, defaults to "forbidden".
   */
  taskSupport: _enum(["required", "optional", "forbidden"]).optional()
});
var ToolSchema = object2({
  ...BaseMetadataSchema.shape,
  ...IconsSchema.shape,
  /**
   * A human-readable description of the tool.
   */
  description: string2().optional(),
  /**
   * A JSON Schema 2020-12 object defining the expected parameters for the tool.
   * Must have type: 'object' at the root level per MCP spec.
   */
  inputSchema: object2({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()),
  /**
   * An optional JSON Schema 2020-12 object defining the structure of the tool's output
   * returned in the structuredContent field of a CallToolResult.
   * Must have type: 'object' at the root level per MCP spec.
   */
  outputSchema: object2({
    type: literal("object"),
    properties: record(string2(), AssertObjectSchema).optional(),
    required: array(string2()).optional()
  }).catchall(unknown()).optional(),
  /**
   * Optional additional tool information.
   */
  annotations: ToolAnnotationsSchema.optional(),
  /**
   * Execution-related properties for this tool.
   */
  execution: ToolExecutionSchema.optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ListToolsRequestSchema = PaginatedRequestSchema.extend({
  method: literal("tools/list")
});
var ListToolsResultSchema = PaginatedResultSchema.extend({
  tools: array(ToolSchema)
});
var CallToolResultSchema = ResultSchema.extend({
  /**
   * A list of content objects that represent the result of the tool call.
   *
   * If the Tool does not define an outputSchema, this field MUST be present in the result.
   * For backwards compatibility, this field is always present, but it may be empty.
   */
  content: array(ContentBlockSchema).default([]),
  /**
   * An object containing structured tool output.
   *
   * If the Tool defines an outputSchema, this field MUST be present in the result, and contain a JSON object that matches the schema.
   */
  structuredContent: record(string2(), unknown()).optional(),
  /**
   * Whether the tool call ended in an error.
   *
   * If not set, this is assumed to be false (the call was successful).
   *
   * Any errors that originate from the tool SHOULD be reported inside the result
   * object, with `isError` set to true, _not_ as an MCP protocol-level error
   * response. Otherwise, the LLM would not be able to see that an error occurred
   * and self-correct.
   *
   * However, any errors in _finding_ the tool, an error indicating that the
   * server does not support tool calls, or any other exceptional conditions,
   * should be reported as an MCP error response.
   */
  isError: boolean2().optional()
});
var CompatibilityCallToolResultSchema = CallToolResultSchema.or(ResultSchema.extend({
  toolResult: unknown()
}));
var CallToolRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The name of the tool to call.
   */
  name: string2(),
  /**
   * Arguments to pass to the tool.
   */
  arguments: record(string2(), unknown()).optional()
});
var CallToolRequestSchema = RequestSchema.extend({
  method: literal("tools/call"),
  params: CallToolRequestParamsSchema
});
var ToolListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/tools/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ListChangedOptionsBaseSchema = object2({
  /**
   * If true, the list will be refreshed automatically when a list changed notification is received.
   * The callback will be called with the updated list.
   *
   * If false, the callback will be called with null items, allowing manual refresh.
   *
   * @default true
   */
  autoRefresh: boolean2().default(true),
  /**
   * Debounce time in milliseconds for list changed notification processing.
   *
   * Multiple notifications received within this timeframe will only trigger one refresh.
   * Set to 0 to disable debouncing.
   *
   * @default 300
   */
  debounceMs: number2().int().nonnegative().default(300)
});
var LoggingLevelSchema = _enum(["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"]);
var SetLevelRequestParamsSchema = BaseRequestParamsSchema.extend({
  /**
   * The level of logging that the client wants to receive from the server. The server should send all logs at this level and higher (i.e., more severe) to the client as notifications/logging/message.
   */
  level: LoggingLevelSchema
});
var SetLevelRequestSchema = RequestSchema.extend({
  method: literal("logging/setLevel"),
  params: SetLevelRequestParamsSchema
});
var LoggingMessageNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The severity of this log message.
   */
  level: LoggingLevelSchema,
  /**
   * An optional name of the logger issuing this message.
   */
  logger: string2().optional(),
  /**
   * The data to be logged, such as a string message or an object. Any JSON serializable type is allowed here.
   */
  data: unknown()
});
var LoggingMessageNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/message"),
  params: LoggingMessageNotificationParamsSchema
});
var ModelHintSchema = object2({
  /**
   * A hint for a model name.
   */
  name: string2().optional()
});
var ModelPreferencesSchema = object2({
  /**
   * Optional hints to use for model selection.
   */
  hints: array(ModelHintSchema).optional(),
  /**
   * How much to prioritize cost when selecting a model.
   */
  costPriority: number2().min(0).max(1).optional(),
  /**
   * How much to prioritize sampling speed (latency) when selecting a model.
   */
  speedPriority: number2().min(0).max(1).optional(),
  /**
   * How much to prioritize intelligence and capabilities when selecting a model.
   */
  intelligencePriority: number2().min(0).max(1).optional()
});
var ToolChoiceSchema = object2({
  /**
   * Controls when tools are used:
   * - "auto": Model decides whether to use tools (default)
   * - "required": Model MUST use at least one tool before completing
   * - "none": Model MUST NOT use any tools
   */
  mode: _enum(["auto", "required", "none"]).optional()
});
var ToolResultContentSchema = object2({
  type: literal("tool_result"),
  toolUseId: string2().describe("The unique identifier for the corresponding tool call."),
  content: array(ContentBlockSchema).default([]),
  structuredContent: object2({}).loose().optional(),
  isError: boolean2().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var SamplingContentSchema = discriminatedUnion("type", [TextContentSchema, ImageContentSchema, AudioContentSchema]);
var SamplingMessageContentBlockSchema = discriminatedUnion("type", [
  TextContentSchema,
  ImageContentSchema,
  AudioContentSchema,
  ToolUseContentSchema,
  ToolResultContentSchema
]);
var SamplingMessageSchema = object2({
  role: RoleSchema,
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)]),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var CreateMessageRequestParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  messages: array(SamplingMessageSchema),
  /**
   * The server's preferences for which model to select. The client MAY modify or omit this request.
   */
  modelPreferences: ModelPreferencesSchema.optional(),
  /**
   * An optional system prompt the server wants to use for sampling. The client MAY modify or omit this prompt.
   */
  systemPrompt: string2().optional(),
  /**
   * A request to include context from one or more MCP servers (including the caller), to be attached to the prompt.
   * The client MAY ignore this request.
   *
   * Default is "none". Values "thisServer" and "allServers" are soft-deprecated. Servers SHOULD only use these values if the client
   * declares ClientCapabilities.sampling.context. These values may be removed in future spec releases.
   */
  includeContext: _enum(["none", "thisServer", "allServers"]).optional(),
  temperature: number2().optional(),
  /**
   * The requested maximum number of tokens to sample (to prevent runaway completions).
   *
   * The client MAY choose to sample fewer tokens than the requested maximum.
   */
  maxTokens: number2().int(),
  stopSequences: array(string2()).optional(),
  /**
   * Optional metadata to pass through to the LLM provider. The format of this metadata is provider-specific.
   */
  metadata: AssertObjectSchema.optional(),
  /**
   * Tools that the model may use during generation.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   */
  tools: array(ToolSchema).optional(),
  /**
   * Controls how the model uses tools.
   * The client MUST return an error if this field is provided but ClientCapabilities.sampling.tools is not declared.
   * Default is `{ mode: "auto" }`.
   */
  toolChoice: ToolChoiceSchema.optional()
});
var CreateMessageRequestSchema = RequestSchema.extend({
  method: literal("sampling/createMessage"),
  params: CreateMessageRequestParamsSchema
});
var CreateMessageResultSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: string2(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens"]).or(string2())),
  role: RoleSchema,
  /**
   * Response content. Single content block (text, image, or audio).
   */
  content: SamplingContentSchema
});
var CreateMessageResultWithToolsSchema = ResultSchema.extend({
  /**
   * The name of the model that generated the message.
   */
  model: string2(),
  /**
   * The reason why sampling stopped, if known.
   *
   * Standard values:
   * - "endTurn": Natural end of the assistant's turn
   * - "stopSequence": A stop sequence was encountered
   * - "maxTokens": Maximum token limit was reached
   * - "toolUse": The model wants to use one or more tools
   *
   * This field is an open string to allow for provider-specific stop reasons.
   */
  stopReason: optional(_enum(["endTurn", "stopSequence", "maxTokens", "toolUse"]).or(string2())),
  role: RoleSchema,
  /**
   * Response content. May be a single block or array. May include ToolUseContent if stopReason is "toolUse".
   */
  content: union([SamplingMessageContentBlockSchema, array(SamplingMessageContentBlockSchema)])
});
var BooleanSchemaSchema = object2({
  type: literal("boolean"),
  title: string2().optional(),
  description: string2().optional(),
  default: boolean2().optional()
});
var StringSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  minLength: number2().optional(),
  maxLength: number2().optional(),
  format: _enum(["email", "uri", "date", "date-time"]).optional(),
  default: string2().optional()
});
var NumberSchemaSchema = object2({
  type: _enum(["number", "integer"]),
  title: string2().optional(),
  description: string2().optional(),
  minimum: number2().optional(),
  maximum: number2().optional(),
  default: number2().optional()
});
var UntitledSingleSelectEnumSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  default: string2().optional()
});
var TitledSingleSelectEnumSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  oneOf: array(object2({
    const: string2(),
    title: string2()
  })),
  default: string2().optional()
});
var LegacyTitledEnumSchemaSchema = object2({
  type: literal("string"),
  title: string2().optional(),
  description: string2().optional(),
  enum: array(string2()),
  enumNames: array(string2()).optional(),
  default: string2().optional()
});
var SingleSelectEnumSchemaSchema = union([UntitledSingleSelectEnumSchemaSchema, TitledSingleSelectEnumSchemaSchema]);
var UntitledMultiSelectEnumSchemaSchema = object2({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object2({
    type: literal("string"),
    enum: array(string2())
  }),
  default: array(string2()).optional()
});
var TitledMultiSelectEnumSchemaSchema = object2({
  type: literal("array"),
  title: string2().optional(),
  description: string2().optional(),
  minItems: number2().optional(),
  maxItems: number2().optional(),
  items: object2({
    anyOf: array(object2({
      const: string2(),
      title: string2()
    }))
  }),
  default: array(string2()).optional()
});
var MultiSelectEnumSchemaSchema = union([UntitledMultiSelectEnumSchemaSchema, TitledMultiSelectEnumSchemaSchema]);
var EnumSchemaSchema = union([LegacyTitledEnumSchemaSchema, SingleSelectEnumSchemaSchema, MultiSelectEnumSchemaSchema]);
var PrimitiveSchemaDefinitionSchema = union([EnumSchemaSchema, BooleanSchemaSchema, StringSchemaSchema, NumberSchemaSchema]);
var ElicitRequestFormParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   *
   * Optional for backward compatibility. Clients MUST treat missing mode as "form".
   */
  mode: literal("form").optional(),
  /**
   * The message to present to the user describing what information is being requested.
   */
  message: string2(),
  /**
   * A restricted subset of JSON Schema.
   * Only top-level properties are allowed, without nesting.
   */
  requestedSchema: object2({
    type: literal("object"),
    properties: record(string2(), PrimitiveSchemaDefinitionSchema),
    required: array(string2()).optional()
  })
});
var ElicitRequestURLParamsSchema = TaskAugmentedRequestParamsSchema.extend({
  /**
   * The elicitation mode.
   */
  mode: literal("url"),
  /**
   * The message to present to the user explaining why the interaction is needed.
   */
  message: string2(),
  /**
   * The ID of the elicitation, which must be unique within the context of the server.
   * The client MUST treat this ID as an opaque value.
   */
  elicitationId: string2(),
  /**
   * The URL that the user should navigate to.
   */
  url: string2().url()
});
var ElicitRequestParamsSchema = union([ElicitRequestFormParamsSchema, ElicitRequestURLParamsSchema]);
var ElicitRequestSchema = RequestSchema.extend({
  method: literal("elicitation/create"),
  params: ElicitRequestParamsSchema
});
var ElicitationCompleteNotificationParamsSchema = NotificationsParamsSchema.extend({
  /**
   * The ID of the elicitation that completed.
   */
  elicitationId: string2()
});
var ElicitationCompleteNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/elicitation/complete"),
  params: ElicitationCompleteNotificationParamsSchema
});
var ElicitResultSchema = ResultSchema.extend({
  /**
   * The user action in response to the elicitation.
   * - "accept": User submitted the form/confirmed the action
   * - "decline": User explicitly decline the action
   * - "cancel": User dismissed without making an explicit choice
   */
  action: _enum(["accept", "decline", "cancel"]),
  /**
   * The submitted form data, only present when action is "accept".
   * Contains values matching the requested schema.
   * Per MCP spec, content is "typically omitted" for decline/cancel actions.
   * We normalize null to undefined for leniency while maintaining type compatibility.
   */
  content: preprocess((val) => val === null ? void 0 : val, record(string2(), union([string2(), number2(), boolean2(), array(string2())])).optional())
});
var ResourceTemplateReferenceSchema = object2({
  type: literal("ref/resource"),
  /**
   * The URI or URI template of the resource.
   */
  uri: string2()
});
var PromptReferenceSchema = object2({
  type: literal("ref/prompt"),
  /**
   * The name of the prompt or prompt template
   */
  name: string2()
});
var CompleteRequestParamsSchema = BaseRequestParamsSchema.extend({
  ref: union([PromptReferenceSchema, ResourceTemplateReferenceSchema]),
  /**
   * The argument's information
   */
  argument: object2({
    /**
     * The name of the argument
     */
    name: string2(),
    /**
     * The value of the argument to use for completion matching.
     */
    value: string2()
  }),
  context: object2({
    /**
     * Previously-resolved variables in a URI template or prompt.
     */
    arguments: record(string2(), string2()).optional()
  }).optional()
});
var CompleteRequestSchema = RequestSchema.extend({
  method: literal("completion/complete"),
  params: CompleteRequestParamsSchema
});
var CompleteResultSchema = ResultSchema.extend({
  completion: looseObject({
    /**
     * An array of completion values. Must not exceed 100 items.
     */
    values: array(string2()).max(100),
    /**
     * The total number of completion options available. This can exceed the number of values actually sent in the response.
     */
    total: optional(number2().int()),
    /**
     * Indicates whether there are additional completion options beyond those provided in the current response, even if the exact total is unknown.
     */
    hasMore: optional(boolean2())
  })
});
var RootSchema = object2({
  /**
   * The URI identifying the root. This *must* start with file:// for now.
   */
  uri: string2().startsWith("file://"),
  /**
   * An optional name for the root.
   */
  name: string2().optional(),
  /**
   * See [MCP specification](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/47339c03c143bb4ec01a26e721a1b8fe66634ebe/docs/specification/draft/basic/index.mdx#general-fields)
   * for notes on _meta usage.
   */
  _meta: record(string2(), unknown()).optional()
});
var ListRootsRequestSchema = RequestSchema.extend({
  method: literal("roots/list"),
  params: BaseRequestParamsSchema.optional()
});
var ListRootsResultSchema = ResultSchema.extend({
  roots: array(RootSchema)
});
var RootsListChangedNotificationSchema = NotificationSchema.extend({
  method: literal("notifications/roots/list_changed"),
  params: NotificationsParamsSchema.optional()
});
var ClientRequestSchema = union([
  PingRequestSchema,
  InitializeRequestSchema,
  CompleteRequestSchema,
  SetLevelRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  SubscribeRequestSchema,
  UnsubscribeRequestSchema,
  CallToolRequestSchema,
  ListToolsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ClientNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  InitializedNotificationSchema,
  RootsListChangedNotificationSchema,
  TaskStatusNotificationSchema
]);
var ClientResultSchema = union([
  EmptyResultSchema,
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  ElicitResultSchema,
  ListRootsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var ServerRequestSchema = union([
  PingRequestSchema,
  CreateMessageRequestSchema,
  ElicitRequestSchema,
  ListRootsRequestSchema,
  GetTaskRequestSchema,
  GetTaskPayloadRequestSchema,
  ListTasksRequestSchema,
  CancelTaskRequestSchema
]);
var ServerNotificationSchema = union([
  CancelledNotificationSchema,
  ProgressNotificationSchema,
  LoggingMessageNotificationSchema,
  ResourceUpdatedNotificationSchema,
  ResourceListChangedNotificationSchema,
  ToolListChangedNotificationSchema,
  PromptListChangedNotificationSchema,
  TaskStatusNotificationSchema,
  ElicitationCompleteNotificationSchema
]);
var ServerResultSchema = union([
  EmptyResultSchema,
  InitializeResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListResourceTemplatesResultSchema,
  ReadResourceResultSchema,
  CallToolResultSchema,
  ListToolsResultSchema,
  GetTaskResultSchema,
  ListTasksResultSchema,
  CreateTaskResultSchema
]);
var McpError = class _McpError extends Error {
  constructor(code, message, data) {
    super(`MCP error ${code}: ${message}`);
    this.code = code;
    this.data = data;
    this.name = "McpError";
  }
  /**
   * Factory method to create the appropriate error type based on the error code and data
   */
  static fromError(code, message, data) {
    if (code === ErrorCode.UrlElicitationRequired && data) {
      const errorData = data;
      if (errorData.elicitations) {
        return new UrlElicitationRequiredError(errorData.elicitations, message);
      }
    }
    return new _McpError(code, message, data);
  }
};
var UrlElicitationRequiredError = class extends McpError {
  constructor(elicitations, message = `URL elicitation${elicitations.length > 1 ? "s" : ""} required`) {
    super(ErrorCode.UrlElicitationRequired, message, {
      elicitations
    });
  }
  get elicitations() {
    return this.data?.elicitations ?? [];
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/interfaces.js
function isTerminal(status) {
  return status === "completed" || status === "failed" || status === "cancelled";
}

// node_modules/zod-to-json-schema/dist/esm/Options.js
var ignoreOverride = Symbol("Let zodToJsonSchema decide on which parser to use");

// node_modules/zod-to-json-schema/dist/esm/parsers/string.js
var ALPHA_NUMERIC = new Set("ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvxyz0123456789");

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/zod-json-schema-compat.js
function getMethodLiteral(schema) {
  const shape = getObjectShape(schema);
  const methodSchema = shape?.method;
  if (!methodSchema) {
    throw new Error("Schema is missing a method literal");
  }
  const value = getLiteralValue(methodSchema);
  if (typeof value !== "string") {
    throw new Error("Schema method literal must be a string");
  }
  return value;
}
function parseWithCompat(schema, data) {
  const result = safeParse2(schema, data);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/protocol.js
var DEFAULT_REQUEST_TIMEOUT_MSEC = 6e4;
var Protocol = class {
  constructor(_options) {
    this._options = _options;
    this._requestMessageId = 0;
    this._requestHandlers = /* @__PURE__ */ new Map();
    this._requestHandlerAbortControllers = /* @__PURE__ */ new Map();
    this._notificationHandlers = /* @__PURE__ */ new Map();
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers = /* @__PURE__ */ new Map();
    this._timeoutInfo = /* @__PURE__ */ new Map();
    this._pendingDebouncedNotifications = /* @__PURE__ */ new Set();
    this._taskProgressTokens = /* @__PURE__ */ new Map();
    this._requestResolvers = /* @__PURE__ */ new Map();
    this.setNotificationHandler(CancelledNotificationSchema, (notification) => {
      this._oncancel(notification);
    });
    this.setNotificationHandler(ProgressNotificationSchema, (notification) => {
      this._onprogress(notification);
    });
    this.setRequestHandler(
      PingRequestSchema,
      // Automatic pong by default.
      (_request) => ({})
    );
    this._taskStore = _options?.taskStore;
    this._taskMessageQueue = _options?.taskMessageQueue;
    if (this._taskStore) {
      this.setRequestHandler(GetTaskRequestSchema, async (request, extra) => {
        const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return {
          ...task
        };
      });
      this.setRequestHandler(GetTaskPayloadRequestSchema, async (request, extra) => {
        const handleTaskResult = async () => {
          const taskId = request.params.taskId;
          if (this._taskMessageQueue) {
            let queuedMessage;
            while (queuedMessage = await this._taskMessageQueue.dequeue(taskId, extra.sessionId)) {
              if (queuedMessage.type === "response" || queuedMessage.type === "error") {
                const message = queuedMessage.message;
                const requestId = message.id;
                const resolver = this._requestResolvers.get(requestId);
                if (resolver) {
                  this._requestResolvers.delete(requestId);
                  if (queuedMessage.type === "response") {
                    resolver(message);
                  } else {
                    const errorMessage = message;
                    const error2 = new McpError(errorMessage.error.code, errorMessage.error.message, errorMessage.error.data);
                    resolver(error2);
                  }
                } else {
                  const messageType = queuedMessage.type === "response" ? "Response" : "Error";
                  this._onerror(new Error(`${messageType} handler missing for request ${requestId}`));
                }
                continue;
              }
              await this._transport?.send(queuedMessage.message, { relatedRequestId: extra.requestId });
            }
          }
          const task = await this._taskStore.getTask(taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${taskId}`);
          }
          if (!isTerminal(task.status)) {
            await this._waitForTaskUpdate(taskId, extra.signal);
            return await handleTaskResult();
          }
          if (isTerminal(task.status)) {
            const result = await this._taskStore.getTaskResult(taskId, extra.sessionId);
            this._clearTaskQueue(taskId);
            return {
              ...result,
              _meta: {
                ...result._meta,
                [RELATED_TASK_META_KEY]: {
                  taskId
                }
              }
            };
          }
          return await handleTaskResult();
        };
        return await handleTaskResult();
      });
      this.setRequestHandler(ListTasksRequestSchema, async (request, extra) => {
        try {
          const { tasks, nextCursor } = await this._taskStore.listTasks(request.params?.cursor, extra.sessionId);
          return {
            tasks,
            nextCursor,
            _meta: {}
          };
        } catch (error2) {
          throw new McpError(ErrorCode.InvalidParams, `Failed to list tasks: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
      });
      this.setRequestHandler(CancelTaskRequestSchema, async (request, extra) => {
        try {
          const task = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!task) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found: ${request.params.taskId}`);
          }
          if (isTerminal(task.status)) {
            throw new McpError(ErrorCode.InvalidParams, `Cannot cancel task in terminal status: ${task.status}`);
          }
          await this._taskStore.updateTaskStatus(request.params.taskId, "cancelled", "Client cancelled task execution.", extra.sessionId);
          this._clearTaskQueue(request.params.taskId);
          const cancelledTask = await this._taskStore.getTask(request.params.taskId, extra.sessionId);
          if (!cancelledTask) {
            throw new McpError(ErrorCode.InvalidParams, `Task not found after cancellation: ${request.params.taskId}`);
          }
          return {
            _meta: {},
            ...cancelledTask
          };
        } catch (error2) {
          if (error2 instanceof McpError) {
            throw error2;
          }
          throw new McpError(ErrorCode.InvalidRequest, `Failed to cancel task: ${error2 instanceof Error ? error2.message : String(error2)}`);
        }
      });
    }
  }
  async _oncancel(notification) {
    if (!notification.params.requestId) {
      return;
    }
    const controller = this._requestHandlerAbortControllers.get(notification.params.requestId);
    controller?.abort(notification.params.reason);
  }
  _setupTimeout(messageId, timeout, maxTotalTimeout, onTimeout, resetTimeoutOnProgress = false) {
    this._timeoutInfo.set(messageId, {
      timeoutId: setTimeout(onTimeout, timeout),
      startTime: Date.now(),
      timeout,
      maxTotalTimeout,
      resetTimeoutOnProgress,
      onTimeout
    });
  }
  _resetTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (!info)
      return false;
    const totalElapsed = Date.now() - info.startTime;
    if (info.maxTotalTimeout && totalElapsed >= info.maxTotalTimeout) {
      this._timeoutInfo.delete(messageId);
      throw McpError.fromError(ErrorCode.RequestTimeout, "Maximum total timeout exceeded", {
        maxTotalTimeout: info.maxTotalTimeout,
        totalElapsed
      });
    }
    clearTimeout(info.timeoutId);
    info.timeoutId = setTimeout(info.onTimeout, info.timeout);
    return true;
  }
  _cleanupTimeout(messageId) {
    const info = this._timeoutInfo.get(messageId);
    if (info) {
      clearTimeout(info.timeoutId);
      this._timeoutInfo.delete(messageId);
    }
  }
  /**
   * Attaches to the given transport, starts it, and starts listening for messages.
   *
   * The Protocol object assumes ownership of the Transport, replacing any callbacks that have already been set, and expects that it is the only user of the Transport instance going forward.
   */
  async connect(transport) {
    if (this._transport) {
      throw new Error("Already connected to a transport. Call close() before connecting to a new transport, or use a separate Protocol instance per connection.");
    }
    this._transport = transport;
    const _onclose = this.transport?.onclose;
    this._transport.onclose = () => {
      _onclose?.();
      this._onclose();
    };
    const _onerror = this.transport?.onerror;
    this._transport.onerror = (error2) => {
      _onerror?.(error2);
      this._onerror(error2);
    };
    const _onmessage = this._transport?.onmessage;
    this._transport.onmessage = (message, extra) => {
      _onmessage?.(message, extra);
      if (isJSONRPCResultResponse(message) || isJSONRPCErrorResponse(message)) {
        this._onresponse(message);
      } else if (isJSONRPCRequest(message)) {
        this._onrequest(message, extra);
      } else if (isJSONRPCNotification(message)) {
        this._onnotification(message);
      } else {
        this._onerror(new Error(`Unknown message type: ${JSON.stringify(message)}`));
      }
    };
    await this._transport.start();
  }
  _onclose() {
    const responseHandlers = this._responseHandlers;
    this._responseHandlers = /* @__PURE__ */ new Map();
    this._progressHandlers.clear();
    this._taskProgressTokens.clear();
    this._pendingDebouncedNotifications.clear();
    for (const info of this._timeoutInfo.values()) {
      clearTimeout(info.timeoutId);
    }
    this._timeoutInfo.clear();
    for (const controller of this._requestHandlerAbortControllers.values()) {
      controller.abort();
    }
    this._requestHandlerAbortControllers.clear();
    const error2 = McpError.fromError(ErrorCode.ConnectionClosed, "Connection closed");
    this._transport = void 0;
    this.onclose?.();
    for (const handler of responseHandlers.values()) {
      handler(error2);
    }
  }
  _onerror(error2) {
    this.onerror?.(error2);
  }
  _onnotification(notification) {
    const handler = this._notificationHandlers.get(notification.method) ?? this.fallbackNotificationHandler;
    if (handler === void 0) {
      return;
    }
    Promise.resolve().then(() => handler(notification)).catch((error2) => this._onerror(new Error(`Uncaught error in notification handler: ${error2}`)));
  }
  _onrequest(request, extra) {
    const handler = this._requestHandlers.get(request.method) ?? this.fallbackRequestHandler;
    const capturedTransport = this._transport;
    const relatedTaskId = request.params?._meta?.[RELATED_TASK_META_KEY]?.taskId;
    if (handler === void 0) {
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: ErrorCode.MethodNotFound,
          message: "Method not found"
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId).catch((error2) => this._onerror(new Error(`Failed to enqueue error response: ${error2}`)));
      } else {
        capturedTransport?.send(errorResponse).catch((error2) => this._onerror(new Error(`Failed to send an error response: ${error2}`)));
      }
      return;
    }
    const abortController = new AbortController();
    this._requestHandlerAbortControllers.set(request.id, abortController);
    const taskCreationParams = isTaskAugmentedRequestParams(request.params) ? request.params.task : void 0;
    const taskStore = this._taskStore ? this.requestTaskStore(request, capturedTransport?.sessionId) : void 0;
    const fullExtra = {
      signal: abortController.signal,
      sessionId: capturedTransport?.sessionId,
      _meta: request.params?._meta,
      sendNotification: async (notification) => {
        if (abortController.signal.aborted)
          return;
        const notificationOptions = { relatedRequestId: request.id };
        if (relatedTaskId) {
          notificationOptions.relatedTask = { taskId: relatedTaskId };
        }
        await this.notification(notification, notificationOptions);
      },
      sendRequest: async (r, resultSchema, options) => {
        if (abortController.signal.aborted) {
          throw new McpError(ErrorCode.ConnectionClosed, "Request was cancelled");
        }
        const requestOptions = { ...options, relatedRequestId: request.id };
        if (relatedTaskId && !requestOptions.relatedTask) {
          requestOptions.relatedTask = { taskId: relatedTaskId };
        }
        const effectiveTaskId = requestOptions.relatedTask?.taskId ?? relatedTaskId;
        if (effectiveTaskId && taskStore) {
          await taskStore.updateTaskStatus(effectiveTaskId, "input_required");
        }
        return await this.request(r, resultSchema, requestOptions);
      },
      authInfo: extra?.authInfo,
      requestId: request.id,
      requestInfo: extra?.requestInfo,
      taskId: relatedTaskId,
      taskStore,
      taskRequestedTtl: taskCreationParams?.ttl,
      closeSSEStream: extra?.closeSSEStream,
      closeStandaloneSSEStream: extra?.closeStandaloneSSEStream
    };
    Promise.resolve().then(() => {
      if (taskCreationParams) {
        this.assertTaskHandlerCapability(request.method);
      }
    }).then(() => handler(request, fullExtra)).then(async (result) => {
      if (abortController.signal.aborted) {
        return;
      }
      const response = {
        result,
        jsonrpc: "2.0",
        id: request.id
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "response",
          message: response,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(response);
      }
    }, async (error2) => {
      if (abortController.signal.aborted) {
        return;
      }
      const errorResponse = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: Number.isSafeInteger(error2["code"]) ? error2["code"] : ErrorCode.InternalError,
          message: error2.message ?? "Internal error",
          ...error2["data"] !== void 0 && { data: error2["data"] }
        }
      };
      if (relatedTaskId && this._taskMessageQueue) {
        await this._enqueueTaskMessage(relatedTaskId, {
          type: "error",
          message: errorResponse,
          timestamp: Date.now()
        }, capturedTransport?.sessionId);
      } else {
        await capturedTransport?.send(errorResponse);
      }
    }).catch((error2) => this._onerror(new Error(`Failed to send response: ${error2}`))).finally(() => {
      if (this._requestHandlerAbortControllers.get(request.id) === abortController) {
        this._requestHandlerAbortControllers.delete(request.id);
      }
    });
  }
  _onprogress(notification) {
    const { progressToken, ...params } = notification.params;
    const messageId = Number(progressToken);
    const handler = this._progressHandlers.get(messageId);
    if (!handler) {
      this._onerror(new Error(`Received a progress notification for an unknown token: ${JSON.stringify(notification)}`));
      return;
    }
    const responseHandler = this._responseHandlers.get(messageId);
    const timeoutInfo = this._timeoutInfo.get(messageId);
    if (timeoutInfo && responseHandler && timeoutInfo.resetTimeoutOnProgress) {
      try {
        this._resetTimeout(messageId);
      } catch (error2) {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        responseHandler(error2);
        return;
      }
    }
    handler(params);
  }
  _onresponse(response) {
    const messageId = Number(response.id);
    const resolver = this._requestResolvers.get(messageId);
    if (resolver) {
      this._requestResolvers.delete(messageId);
      if (isJSONRPCResultResponse(response)) {
        resolver(response);
      } else {
        const error2 = new McpError(response.error.code, response.error.message, response.error.data);
        resolver(error2);
      }
      return;
    }
    const handler = this._responseHandlers.get(messageId);
    if (handler === void 0) {
      this._onerror(new Error(`Received a response for an unknown message ID: ${JSON.stringify(response)}`));
      return;
    }
    this._responseHandlers.delete(messageId);
    this._cleanupTimeout(messageId);
    let isTaskResponse = false;
    if (isJSONRPCResultResponse(response) && response.result && typeof response.result === "object") {
      const result = response.result;
      if (result.task && typeof result.task === "object") {
        const task = result.task;
        if (typeof task.taskId === "string") {
          isTaskResponse = true;
          this._taskProgressTokens.set(task.taskId, messageId);
        }
      }
    }
    if (!isTaskResponse) {
      this._progressHandlers.delete(messageId);
    }
    if (isJSONRPCResultResponse(response)) {
      handler(response);
    } else {
      const error2 = McpError.fromError(response.error.code, response.error.message, response.error.data);
      handler(error2);
    }
  }
  get transport() {
    return this._transport;
  }
  /**
   * Closes the connection.
   */
  async close() {
    await this._transport?.close();
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * @example
   * ```typescript
   * const stream = protocol.requestStream(request, resultSchema, options);
   * for await (const message of stream) {
   *   switch (message.type) {
   *     case 'taskCreated':
   *       console.log('Task created:', message.task.taskId);
   *       break;
   *     case 'taskStatus':
   *       console.log('Task status:', message.task.status);
   *       break;
   *     case 'result':
   *       console.log('Final result:', message.result);
   *       break;
   *     case 'error':
   *       console.error('Error:', message.error);
   *       break;
   *   }
   * }
   * ```
   *
   * @experimental Use `client.experimental.tasks.requestStream()` to access this method.
   */
  async *requestStream(request, resultSchema, options) {
    const { task } = options ?? {};
    if (!task) {
      try {
        const result = await this.request(request, resultSchema, options);
        yield { type: "result", result };
      } catch (error2) {
        yield {
          type: "error",
          error: error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, String(error2))
        };
      }
      return;
    }
    let taskId;
    try {
      const createResult = await this.request(request, CreateTaskResultSchema, options);
      if (createResult.task) {
        taskId = createResult.task.taskId;
        yield { type: "taskCreated", task: createResult.task };
      } else {
        throw new McpError(ErrorCode.InternalError, "Task creation did not return a task");
      }
      while (true) {
        const task2 = await this.getTask({ taskId }, options);
        yield { type: "taskStatus", task: task2 };
        if (isTerminal(task2.status)) {
          if (task2.status === "completed") {
            const result = await this.getTaskResult({ taskId }, resultSchema, options);
            yield { type: "result", result };
          } else if (task2.status === "failed") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} failed`)
            };
          } else if (task2.status === "cancelled") {
            yield {
              type: "error",
              error: new McpError(ErrorCode.InternalError, `Task ${taskId} was cancelled`)
            };
          }
          return;
        }
        if (task2.status === "input_required") {
          const result = await this.getTaskResult({ taskId }, resultSchema, options);
          yield { type: "result", result };
          return;
        }
        const pollInterval = task2.pollInterval ?? this._options?.defaultTaskPollInterval ?? 1e3;
        await new Promise((resolve2) => setTimeout(resolve2, pollInterval));
        options?.signal?.throwIfAborted();
      }
    } catch (error2) {
      yield {
        type: "error",
        error: error2 instanceof McpError ? error2 : new McpError(ErrorCode.InternalError, String(error2))
      };
    }
  }
  /**
   * Sends a request and waits for a response.
   *
   * Do not use this method to emit notifications! Use notification() instead.
   */
  request(request, resultSchema, options) {
    const { relatedRequestId, resumptionToken, onresumptiontoken, task, relatedTask } = options ?? {};
    return new Promise((resolve2, reject) => {
      const earlyReject = (error2) => {
        reject(error2);
      };
      if (!this._transport) {
        earlyReject(new Error("Not connected"));
        return;
      }
      if (this._options?.enforceStrictCapabilities === true) {
        try {
          this.assertCapabilityForMethod(request.method);
          if (task) {
            this.assertTaskCapability(request.method);
          }
        } catch (e) {
          earlyReject(e);
          return;
        }
      }
      options?.signal?.throwIfAborted();
      const messageId = this._requestMessageId++;
      const jsonrpcRequest = {
        ...request,
        jsonrpc: "2.0",
        id: messageId
      };
      if (options?.onprogress) {
        this._progressHandlers.set(messageId, options.onprogress);
        jsonrpcRequest.params = {
          ...request.params,
          _meta: {
            ...request.params?._meta || {},
            progressToken: messageId
          }
        };
      }
      if (task) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          task
        };
      }
      if (relatedTask) {
        jsonrpcRequest.params = {
          ...jsonrpcRequest.params,
          _meta: {
            ...jsonrpcRequest.params?._meta || {},
            [RELATED_TASK_META_KEY]: relatedTask
          }
        };
      }
      const cancel = (reason) => {
        this._responseHandlers.delete(messageId);
        this._progressHandlers.delete(messageId);
        this._cleanupTimeout(messageId);
        this._transport?.send({
          jsonrpc: "2.0",
          method: "notifications/cancelled",
          params: {
            requestId: messageId,
            reason: String(reason)
          }
        }, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error3) => this._onerror(new Error(`Failed to send cancellation: ${error3}`)));
        const error2 = reason instanceof McpError ? reason : new McpError(ErrorCode.RequestTimeout, String(reason));
        reject(error2);
      };
      this._responseHandlers.set(messageId, (response) => {
        if (options?.signal?.aborted) {
          return;
        }
        if (response instanceof Error) {
          return reject(response);
        }
        try {
          const parseResult = safeParse2(resultSchema, response.result);
          if (!parseResult.success) {
            reject(parseResult.error);
          } else {
            resolve2(parseResult.data);
          }
        } catch (error2) {
          reject(error2);
        }
      });
      options?.signal?.addEventListener("abort", () => {
        cancel(options?.signal?.reason);
      });
      const timeout = options?.timeout ?? DEFAULT_REQUEST_TIMEOUT_MSEC;
      const timeoutHandler = () => cancel(McpError.fromError(ErrorCode.RequestTimeout, "Request timed out", { timeout }));
      this._setupTimeout(messageId, timeout, options?.maxTotalTimeout, timeoutHandler, options?.resetTimeoutOnProgress ?? false);
      const relatedTaskId = relatedTask?.taskId;
      if (relatedTaskId) {
        const responseResolver = (response) => {
          const handler = this._responseHandlers.get(messageId);
          if (handler) {
            handler(response);
          } else {
            this._onerror(new Error(`Response handler missing for side-channeled request ${messageId}`));
          }
        };
        this._requestResolvers.set(messageId, responseResolver);
        this._enqueueTaskMessage(relatedTaskId, {
          type: "request",
          message: jsonrpcRequest,
          timestamp: Date.now()
        }).catch((error2) => {
          this._cleanupTimeout(messageId);
          reject(error2);
        });
      } else {
        this._transport.send(jsonrpcRequest, { relatedRequestId, resumptionToken, onresumptiontoken }).catch((error2) => {
          this._cleanupTimeout(messageId);
          reject(error2);
        });
      }
    });
  }
  /**
   * Gets the current status of a task.
   *
   * @experimental Use `client.experimental.tasks.getTask()` to access this method.
   */
  async getTask(params, options) {
    return this.request({ method: "tasks/get", params }, GetTaskResultSchema, options);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @experimental Use `client.experimental.tasks.getTaskResult()` to access this method.
   */
  async getTaskResult(params, resultSchema, options) {
    return this.request({ method: "tasks/result", params }, resultSchema, options);
  }
  /**
   * Lists tasks, optionally starting from a pagination cursor.
   *
   * @experimental Use `client.experimental.tasks.listTasks()` to access this method.
   */
  async listTasks(params, options) {
    return this.request({ method: "tasks/list", params }, ListTasksResultSchema, options);
  }
  /**
   * Cancels a specific task.
   *
   * @experimental Use `client.experimental.tasks.cancelTask()` to access this method.
   */
  async cancelTask(params, options) {
    return this.request({ method: "tasks/cancel", params }, CancelTaskResultSchema, options);
  }
  /**
   * Emits a notification, which is a one-way message that does not expect a response.
   */
  async notification(notification, options) {
    if (!this._transport) {
      throw new Error("Not connected");
    }
    this.assertNotificationCapability(notification.method);
    const relatedTaskId = options?.relatedTask?.taskId;
    if (relatedTaskId) {
      const jsonrpcNotification2 = {
        ...notification,
        jsonrpc: "2.0",
        params: {
          ...notification.params,
          _meta: {
            ...notification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
      await this._enqueueTaskMessage(relatedTaskId, {
        type: "notification",
        message: jsonrpcNotification2,
        timestamp: Date.now()
      });
      return;
    }
    const debouncedMethods = this._options?.debouncedNotificationMethods ?? [];
    const canDebounce = debouncedMethods.includes(notification.method) && !notification.params && !options?.relatedRequestId && !options?.relatedTask;
    if (canDebounce) {
      if (this._pendingDebouncedNotifications.has(notification.method)) {
        return;
      }
      this._pendingDebouncedNotifications.add(notification.method);
      Promise.resolve().then(() => {
        this._pendingDebouncedNotifications.delete(notification.method);
        if (!this._transport) {
          return;
        }
        let jsonrpcNotification2 = {
          ...notification,
          jsonrpc: "2.0"
        };
        if (options?.relatedTask) {
          jsonrpcNotification2 = {
            ...jsonrpcNotification2,
            params: {
              ...jsonrpcNotification2.params,
              _meta: {
                ...jsonrpcNotification2.params?._meta || {},
                [RELATED_TASK_META_KEY]: options.relatedTask
              }
            }
          };
        }
        this._transport?.send(jsonrpcNotification2, options).catch((error2) => this._onerror(error2));
      });
      return;
    }
    let jsonrpcNotification = {
      ...notification,
      jsonrpc: "2.0"
    };
    if (options?.relatedTask) {
      jsonrpcNotification = {
        ...jsonrpcNotification,
        params: {
          ...jsonrpcNotification.params,
          _meta: {
            ...jsonrpcNotification.params?._meta || {},
            [RELATED_TASK_META_KEY]: options.relatedTask
          }
        }
      };
    }
    await this._transport.send(jsonrpcNotification, options);
  }
  /**
   * Registers a handler to invoke when this protocol object receives a request with the given method.
   *
   * Note that this will replace any previous request handler for the same method.
   */
  setRequestHandler(requestSchema, handler) {
    const method = getMethodLiteral(requestSchema);
    this.assertRequestHandlerCapability(method);
    this._requestHandlers.set(method, (request, extra) => {
      const parsed = parseWithCompat(requestSchema, request);
      return Promise.resolve(handler(parsed, extra));
    });
  }
  /**
   * Removes the request handler for the given method.
   */
  removeRequestHandler(method) {
    this._requestHandlers.delete(method);
  }
  /**
   * Asserts that a request handler has not already been set for the given method, in preparation for a new one being automatically installed.
   */
  assertCanSetRequestHandler(method) {
    if (this._requestHandlers.has(method)) {
      throw new Error(`A request handler for ${method} already exists, which would be overridden`);
    }
  }
  /**
   * Registers a handler to invoke when this protocol object receives a notification with the given method.
   *
   * Note that this will replace any previous notification handler for the same method.
   */
  setNotificationHandler(notificationSchema, handler) {
    const method = getMethodLiteral(notificationSchema);
    this._notificationHandlers.set(method, (notification) => {
      const parsed = parseWithCompat(notificationSchema, notification);
      return Promise.resolve(handler(parsed));
    });
  }
  /**
   * Removes the notification handler for the given method.
   */
  removeNotificationHandler(method) {
    this._notificationHandlers.delete(method);
  }
  /**
   * Cleans up the progress handler associated with a task.
   * This should be called when a task reaches a terminal status.
   */
  _cleanupTaskProgressHandler(taskId) {
    const progressToken = this._taskProgressTokens.get(taskId);
    if (progressToken !== void 0) {
      this._progressHandlers.delete(progressToken);
      this._taskProgressTokens.delete(taskId);
    }
  }
  /**
   * Enqueues a task-related message for side-channel delivery via tasks/result.
   * @param taskId The task ID to associate the message with
   * @param message The message to enqueue
   * @param sessionId Optional session ID for binding the operation to a specific session
   * @throws Error if taskStore is not configured or if enqueue fails (e.g., queue overflow)
   *
   * Note: If enqueue fails, it's the TaskMessageQueue implementation's responsibility to handle
   * the error appropriately (e.g., by failing the task, logging, etc.). The Protocol layer
   * simply propagates the error.
   */
  async _enqueueTaskMessage(taskId, message, sessionId) {
    if (!this._taskStore || !this._taskMessageQueue) {
      throw new Error("Cannot enqueue task message: taskStore and taskMessageQueue are not configured");
    }
    const maxQueueSize = this._options?.maxTaskQueueSize;
    await this._taskMessageQueue.enqueue(taskId, message, sessionId, maxQueueSize);
  }
  /**
   * Clears the message queue for a task and rejects any pending request resolvers.
   * @param taskId The task ID whose queue should be cleared
   * @param sessionId Optional session ID for binding the operation to a specific session
   */
  async _clearTaskQueue(taskId, sessionId) {
    if (this._taskMessageQueue) {
      const messages = await this._taskMessageQueue.dequeueAll(taskId, sessionId);
      for (const message of messages) {
        if (message.type === "request" && isJSONRPCRequest(message.message)) {
          const requestId = message.message.id;
          const resolver = this._requestResolvers.get(requestId);
          if (resolver) {
            resolver(new McpError(ErrorCode.InternalError, "Task cancelled or completed"));
            this._requestResolvers.delete(requestId);
          } else {
            this._onerror(new Error(`Resolver missing for request ${requestId} during task ${taskId} cleanup`));
          }
        }
      }
    }
  }
  /**
   * Waits for a task update (new messages or status change) with abort signal support.
   * Uses polling to check for updates at the task's configured poll interval.
   * @param taskId The task ID to wait for
   * @param signal Abort signal to cancel the wait
   * @returns Promise that resolves when an update occurs or rejects if aborted
   */
  async _waitForTaskUpdate(taskId, signal) {
    let interval = this._options?.defaultTaskPollInterval ?? 1e3;
    try {
      const task = await this._taskStore?.getTask(taskId);
      if (task?.pollInterval) {
        interval = task.pollInterval;
      }
    } catch {
    }
    return new Promise((resolve2, reject) => {
      if (signal.aborted) {
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
        return;
      }
      const timeoutId = setTimeout(resolve2, interval);
      signal.addEventListener("abort", () => {
        clearTimeout(timeoutId);
        reject(new McpError(ErrorCode.InvalidRequest, "Request cancelled"));
      }, { once: true });
    });
  }
  requestTaskStore(request, sessionId) {
    const taskStore = this._taskStore;
    if (!taskStore) {
      throw new Error("No task store configured");
    }
    return {
      createTask: async (taskParams) => {
        if (!request) {
          throw new Error("No request provided");
        }
        return await taskStore.createTask(taskParams, request.id, {
          method: request.method,
          params: request.params
        }, sessionId);
      },
      getTask: async (taskId) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, "Failed to retrieve task: Task not found");
        }
        return task;
      },
      storeTaskResult: async (taskId, status, result) => {
        await taskStore.storeTaskResult(taskId, status, result, sessionId);
        const task = await taskStore.getTask(taskId, sessionId);
        if (task) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: task
          });
          await this.notification(notification);
          if (isTerminal(task.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      getTaskResult: (taskId) => {
        return taskStore.getTaskResult(taskId, sessionId);
      },
      updateTaskStatus: async (taskId, status, statusMessage) => {
        const task = await taskStore.getTask(taskId, sessionId);
        if (!task) {
          throw new McpError(ErrorCode.InvalidParams, `Task "${taskId}" not found - it may have been cleaned up`);
        }
        if (isTerminal(task.status)) {
          throw new McpError(ErrorCode.InvalidParams, `Cannot update task "${taskId}" from terminal status "${task.status}" to "${status}". Terminal states (completed, failed, cancelled) cannot transition to other states.`);
        }
        await taskStore.updateTaskStatus(taskId, status, statusMessage, sessionId);
        const updatedTask = await taskStore.getTask(taskId, sessionId);
        if (updatedTask) {
          const notification = TaskStatusNotificationSchema.parse({
            method: "notifications/tasks/status",
            params: updatedTask
          });
          await this.notification(notification);
          if (isTerminal(updatedTask.status)) {
            this._cleanupTaskProgressHandler(taskId);
          }
        }
      },
      listTasks: (cursor) => {
        return taskStore.listTasks(cursor, sessionId);
      }
    };
  }
};
function isPlainObject2(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function mergeCapabilities(base, additional) {
  const result = { ...base };
  for (const key2 in additional) {
    const k = key2;
    const addValue = additional[k];
    if (addValue === void 0)
      continue;
    const baseValue = result[k];
    if (isPlainObject2(baseValue) && isPlainObject2(addValue)) {
      result[k] = { ...baseValue, ...addValue };
    } else {
      result[k] = addValue;
    }
  }
  return result;
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/validation/ajv-provider.js
var import_ajv = __toESM(require_ajv(), 1);
var import_ajv_formats = __toESM(require_dist(), 1);
function createDefaultAjvInstance() {
  const ajv = new import_ajv.default({
    strict: false,
    validateFormats: true,
    validateSchema: false,
    allErrors: true
  });
  const addFormats = import_ajv_formats.default;
  addFormats(ajv);
  return ajv;
}
var AjvJsonSchemaValidator = class {
  /**
   * Create an AJV validator
   *
   * @param ajv - Optional pre-configured AJV instance. If not provided, a default instance will be created.
   *
   * @example
   * ```typescript
   * // Use default configuration (recommended for most cases)
   * import { AjvJsonSchemaValidator } from '@modelcontextprotocol/sdk/validation/ajv';
   * const validator = new AjvJsonSchemaValidator();
   *
   * // Or provide custom AJV instance for advanced configuration
   * import { Ajv } from 'ajv';
   * import addFormats from 'ajv-formats';
   *
   * const ajv = new Ajv({ validateFormats: true });
   * addFormats(ajv);
   * const validator = new AjvJsonSchemaValidator(ajv);
   * ```
   */
  constructor(ajv) {
    this._ajv = ajv ?? createDefaultAjvInstance();
  }
  /**
   * Create a validator for the given JSON Schema
   *
   * The validator is compiled once and can be reused multiple times.
   * If the schema has an $id, it will be cached by AJV automatically.
   *
   * @param schema - Standard JSON Schema object
   * @returns A validator function that validates input data
   */
  getValidator(schema) {
    const ajvValidator = "$id" in schema && typeof schema.$id === "string" ? this._ajv.getSchema(schema.$id) ?? this._ajv.compile(schema) : this._ajv.compile(schema);
    return (input) => {
      const valid = ajvValidator(input);
      if (valid) {
        return {
          valid: true,
          data: input,
          errorMessage: void 0
        };
      } else {
        return {
          valid: false,
          data: void 0,
          errorMessage: this._ajv.errorsText(ajvValidator.errors)
        };
      }
    };
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/server.js
var ExperimentalServerTasks = class {
  constructor(_server) {
    this._server = _server;
  }
  /**
   * Sends a request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * This method provides streaming access to request processing, allowing you to
   * observe intermediate task status updates for task-augmented requests.
   *
   * @param request - The request to send
   * @param resultSchema - Zod schema for validating the result
   * @param options - Optional request options (timeout, signal, task creation params, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  requestStream(request, resultSchema, options) {
    return this._server.requestStream(request, resultSchema, options);
  }
  /**
   * Sends a sampling request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * For task-augmented requests, yields 'taskCreated' and 'taskStatus' messages
   * before the final result.
   *
   * @example
   * ```typescript
   * const stream = server.experimental.tasks.createMessageStream({
   *     messages: [{ role: 'user', content: { type: 'text', text: 'Hello' } }],
   *     maxTokens: 100
   * }, {
   *     onprogress: (progress) => {
   *         // Handle streaming tokens via progress notifications
   *         console.log('Progress:', progress.message);
   *     }
   * });
   *
   * for await (const message of stream) {
   *     switch (message.type) {
   *         case 'taskCreated':
   *             console.log('Task created:', message.task.taskId);
   *             break;
   *         case 'taskStatus':
   *             console.log('Task status:', message.task.status);
   *             break;
   *         case 'result':
   *             console.log('Final result:', message.result);
   *             break;
   *         case 'error':
   *             console.error('Error:', message.error);
   *             break;
   *     }
   * }
   * ```
   *
   * @param params - The sampling request parameters
   * @param options - Optional request options (timeout, signal, task creation params, onprogress, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  createMessageStream(params, options) {
    const clientCapabilities = this._server.getClientCapabilities();
    if ((params.tools || params.toolChoice) && !clientCapabilities?.sampling?.tools) {
      throw new Error("Client does not support sampling tools capability.");
    }
    if (params.messages.length > 0) {
      const lastMessage = params.messages[params.messages.length - 1];
      const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
      const hasToolResults = lastContent.some((c) => c.type === "tool_result");
      const previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : void 0;
      const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
      const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result")) {
          throw new Error("The last message must contain only tool_result content if any is present");
        }
        if (!hasPreviousToolUse) {
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
        }
      }
      if (hasPreviousToolUse) {
        const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
        const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) {
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
        }
      }
    }
    return this.requestStream({
      method: "sampling/createMessage",
      params
    }, CreateMessageResultSchema, options);
  }
  /**
   * Sends an elicitation request and returns an AsyncGenerator that yields response messages.
   * The generator is guaranteed to end with either a 'result' or 'error' message.
   *
   * For task-augmented requests (especially URL-based elicitation), yields 'taskCreated'
   * and 'taskStatus' messages before the final result.
   *
   * @example
   * ```typescript
   * const stream = server.experimental.tasks.elicitInputStream({
   *     mode: 'url',
   *     message: 'Please authenticate',
   *     elicitationId: 'auth-123',
   *     url: 'https://example.com/auth'
   * }, {
   *     task: { ttl: 300000 } // Task-augmented for long-running auth flow
   * });
   *
   * for await (const message of stream) {
   *     switch (message.type) {
   *         case 'taskCreated':
   *             console.log('Task created:', message.task.taskId);
   *             break;
   *         case 'taskStatus':
   *             console.log('Task status:', message.task.status);
   *             break;
   *         case 'result':
   *             console.log('User action:', message.result.action);
   *             break;
   *         case 'error':
   *             console.error('Error:', message.error);
   *             break;
   *     }
   * }
   * ```
   *
   * @param params - The elicitation request parameters
   * @param options - Optional request options (timeout, signal, task creation params, etc.)
   * @returns AsyncGenerator that yields ResponseMessage objects
   *
   * @experimental
   */
  elicitInputStream(params, options) {
    const clientCapabilities = this._server.getClientCapabilities();
    const mode = params.mode ?? "form";
    switch (mode) {
      case "url": {
        if (!clientCapabilities?.elicitation?.url) {
          throw new Error("Client does not support url elicitation.");
        }
        break;
      }
      case "form": {
        if (!clientCapabilities?.elicitation?.form) {
          throw new Error("Client does not support form elicitation.");
        }
        break;
      }
    }
    const normalizedParams = mode === "form" && params.mode === void 0 ? { ...params, mode: "form" } : params;
    return this.requestStream({
      method: "elicitation/create",
      params: normalizedParams
    }, ElicitResultSchema, options);
  }
  /**
   * Gets the current status of a task.
   *
   * @param taskId - The task identifier
   * @param options - Optional request options
   * @returns The task status
   *
   * @experimental
   */
  async getTask(taskId, options) {
    return this._server.getTask({ taskId }, options);
  }
  /**
   * Retrieves the result of a completed task.
   *
   * @param taskId - The task identifier
   * @param resultSchema - Zod schema for validating the result
   * @param options - Optional request options
   * @returns The task result
   *
   * @experimental
   */
  async getTaskResult(taskId, resultSchema, options) {
    return this._server.getTaskResult({ taskId }, resultSchema, options);
  }
  /**
   * Lists tasks with optional pagination.
   *
   * @param cursor - Optional pagination cursor
   * @param options - Optional request options
   * @returns List of tasks with optional next cursor
   *
   * @experimental
   */
  async listTasks(cursor, options) {
    return this._server.listTasks(cursor ? { cursor } : void 0, options);
  }
  /**
   * Cancels a running task.
   *
   * @param taskId - The task identifier
   * @param options - Optional request options
   *
   * @experimental
   */
  async cancelTask(taskId, options) {
    return this._server.cancelTask({ taskId }, options);
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/experimental/tasks/helpers.js
function assertToolsCallTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "tools/call":
      if (!requests.tools?.call) {
        throw new Error(`${entityName} does not support task creation for tools/call (required for ${method})`);
      }
      break;
    default:
      break;
  }
}
function assertClientRequestTaskCapability(requests, method, entityName) {
  if (!requests) {
    throw new Error(`${entityName} does not support task creation (required for ${method})`);
  }
  switch (method) {
    case "sampling/createMessage":
      if (!requests.sampling?.createMessage) {
        throw new Error(`${entityName} does not support task creation for sampling/createMessage (required for ${method})`);
      }
      break;
    case "elicitation/create":
      if (!requests.elicitation?.create) {
        throw new Error(`${entityName} does not support task creation for elicitation/create (required for ${method})`);
      }
      break;
    default:
      break;
  }
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/index.js
var Server = class extends Protocol {
  /**
   * Initializes this server with the given name and version information.
   */
  constructor(_serverInfo, options) {
    super(options);
    this._serverInfo = _serverInfo;
    this._loggingLevels = /* @__PURE__ */ new Map();
    this.LOG_LEVEL_SEVERITY = new Map(LoggingLevelSchema.options.map((level, index) => [level, index]));
    this.isMessageIgnored = (level, sessionId) => {
      const currentLevel = this._loggingLevels.get(sessionId);
      return currentLevel ? this.LOG_LEVEL_SEVERITY.get(level) < this.LOG_LEVEL_SEVERITY.get(currentLevel) : false;
    };
    this._capabilities = options?.capabilities ?? {};
    this._instructions = options?.instructions;
    this._jsonSchemaValidator = options?.jsonSchemaValidator ?? new AjvJsonSchemaValidator();
    this.setRequestHandler(InitializeRequestSchema, (request) => this._oninitialize(request));
    this.setNotificationHandler(InitializedNotificationSchema, () => this.oninitialized?.());
    if (this._capabilities.logging) {
      this.setRequestHandler(SetLevelRequestSchema, async (request, extra) => {
        const transportSessionId = extra.sessionId || extra.requestInfo?.headers["mcp-session-id"] || void 0;
        const { level } = request.params;
        const parseResult = LoggingLevelSchema.safeParse(level);
        if (parseResult.success) {
          this._loggingLevels.set(transportSessionId, parseResult.data);
        }
        return {};
      });
    }
  }
  /**
   * Access experimental features.
   *
   * WARNING: These APIs are experimental and may change without notice.
   *
   * @experimental
   */
  get experimental() {
    if (!this._experimental) {
      this._experimental = {
        tasks: new ExperimentalServerTasks(this)
      };
    }
    return this._experimental;
  }
  /**
   * Registers new capabilities. This can only be called before connecting to a transport.
   *
   * The new capabilities will be merged with any existing capabilities previously given (e.g., at initialization).
   */
  registerCapabilities(capabilities) {
    if (this.transport) {
      throw new Error("Cannot register capabilities after connecting to transport");
    }
    this._capabilities = mergeCapabilities(this._capabilities, capabilities);
  }
  /**
   * Override request handler registration to enforce server-side validation for tools/call.
   */
  setRequestHandler(requestSchema, handler) {
    const shape = getObjectShape(requestSchema);
    const methodSchema = shape?.method;
    if (!methodSchema) {
      throw new Error("Schema is missing a method literal");
    }
    const methodValue = getLiteralValue(methodSchema);
    if (typeof methodValue !== "string") {
      throw new Error("Schema method literal must be a string");
    }
    const method = methodValue;
    if (method === "tools/call") {
      const wrappedHandler = async (request, extra) => {
        const validatedRequest = safeParse2(CallToolRequestSchema, request);
        if (!validatedRequest.success) {
          const errorMessage = validatedRequest.error instanceof Error ? validatedRequest.error.message : String(validatedRequest.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call request: ${errorMessage}`);
        }
        const { params } = validatedRequest.data;
        const result = await Promise.resolve(handler(request, extra));
        if (params.task) {
          const taskValidationResult = safeParse2(CreateTaskResultSchema, result);
          if (!taskValidationResult.success) {
            const errorMessage = taskValidationResult.error instanceof Error ? taskValidationResult.error.message : String(taskValidationResult.error);
            throw new McpError(ErrorCode.InvalidParams, `Invalid task creation result: ${errorMessage}`);
          }
          return taskValidationResult.data;
        }
        const validationResult = safeParse2(CallToolResultSchema, result);
        if (!validationResult.success) {
          const errorMessage = validationResult.error instanceof Error ? validationResult.error.message : String(validationResult.error);
          throw new McpError(ErrorCode.InvalidParams, `Invalid tools/call result: ${errorMessage}`);
        }
        return validationResult.data;
      };
      return super.setRequestHandler(requestSchema, wrappedHandler);
    }
    return super.setRequestHandler(requestSchema, handler);
  }
  assertCapabilityForMethod(method) {
    switch (method) {
      case "sampling/createMessage":
        if (!this._clientCapabilities?.sampling) {
          throw new Error(`Client does not support sampling (required for ${method})`);
        }
        break;
      case "elicitation/create":
        if (!this._clientCapabilities?.elicitation) {
          throw new Error(`Client does not support elicitation (required for ${method})`);
        }
        break;
      case "roots/list":
        if (!this._clientCapabilities?.roots) {
          throw new Error(`Client does not support listing roots (required for ${method})`);
        }
        break;
      case "ping":
        break;
    }
  }
  assertNotificationCapability(method) {
    switch (method) {
      case "notifications/message":
        if (!this._capabilities.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "notifications/resources/updated":
      case "notifications/resources/list_changed":
        if (!this._capabilities.resources) {
          throw new Error(`Server does not support notifying about resources (required for ${method})`);
        }
        break;
      case "notifications/tools/list_changed":
        if (!this._capabilities.tools) {
          throw new Error(`Server does not support notifying of tool list changes (required for ${method})`);
        }
        break;
      case "notifications/prompts/list_changed":
        if (!this._capabilities.prompts) {
          throw new Error(`Server does not support notifying of prompt list changes (required for ${method})`);
        }
        break;
      case "notifications/elicitation/complete":
        if (!this._clientCapabilities?.elicitation?.url) {
          throw new Error(`Client does not support URL elicitation (required for ${method})`);
        }
        break;
      case "notifications/cancelled":
        break;
      case "notifications/progress":
        break;
    }
  }
  assertRequestHandlerCapability(method) {
    if (!this._capabilities) {
      return;
    }
    switch (method) {
      case "completion/complete":
        if (!this._capabilities.completions) {
          throw new Error(`Server does not support completions (required for ${method})`);
        }
        break;
      case "logging/setLevel":
        if (!this._capabilities.logging) {
          throw new Error(`Server does not support logging (required for ${method})`);
        }
        break;
      case "prompts/get":
      case "prompts/list":
        if (!this._capabilities.prompts) {
          throw new Error(`Server does not support prompts (required for ${method})`);
        }
        break;
      case "resources/list":
      case "resources/templates/list":
      case "resources/read":
        if (!this._capabilities.resources) {
          throw new Error(`Server does not support resources (required for ${method})`);
        }
        break;
      case "tools/call":
      case "tools/list":
        if (!this._capabilities.tools) {
          throw new Error(`Server does not support tools (required for ${method})`);
        }
        break;
      case "tasks/get":
      case "tasks/list":
      case "tasks/result":
      case "tasks/cancel":
        if (!this._capabilities.tasks) {
          throw new Error(`Server does not support tasks capability (required for ${method})`);
        }
        break;
      case "ping":
      case "initialize":
        break;
    }
  }
  assertTaskCapability(method) {
    assertClientRequestTaskCapability(this._clientCapabilities?.tasks?.requests, method, "Client");
  }
  assertTaskHandlerCapability(method) {
    if (!this._capabilities) {
      return;
    }
    assertToolsCallTaskCapability(this._capabilities.tasks?.requests, method, "Server");
  }
  async _oninitialize(request) {
    const requestedVersion = request.params.protocolVersion;
    this._clientCapabilities = request.params.capabilities;
    this._clientVersion = request.params.clientInfo;
    const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requestedVersion) ? requestedVersion : LATEST_PROTOCOL_VERSION;
    return {
      protocolVersion,
      capabilities: this.getCapabilities(),
      serverInfo: this._serverInfo,
      ...this._instructions && { instructions: this._instructions }
    };
  }
  /**
   * After initialization has completed, this will be populated with the client's reported capabilities.
   */
  getClientCapabilities() {
    return this._clientCapabilities;
  }
  /**
   * After initialization has completed, this will be populated with information about the client's name and version.
   */
  getClientVersion() {
    return this._clientVersion;
  }
  getCapabilities() {
    return this._capabilities;
  }
  async ping() {
    return this.request({ method: "ping" }, EmptyResultSchema);
  }
  // Implementation
  async createMessage(params, options) {
    if (params.tools || params.toolChoice) {
      if (!this._clientCapabilities?.sampling?.tools) {
        throw new Error("Client does not support sampling tools capability.");
      }
    }
    if (params.messages.length > 0) {
      const lastMessage = params.messages[params.messages.length - 1];
      const lastContent = Array.isArray(lastMessage.content) ? lastMessage.content : [lastMessage.content];
      const hasToolResults = lastContent.some((c) => c.type === "tool_result");
      const previousMessage = params.messages.length > 1 ? params.messages[params.messages.length - 2] : void 0;
      const previousContent = previousMessage ? Array.isArray(previousMessage.content) ? previousMessage.content : [previousMessage.content] : [];
      const hasPreviousToolUse = previousContent.some((c) => c.type === "tool_use");
      if (hasToolResults) {
        if (lastContent.some((c) => c.type !== "tool_result")) {
          throw new Error("The last message must contain only tool_result content if any is present");
        }
        if (!hasPreviousToolUse) {
          throw new Error("tool_result blocks are not matching any tool_use from the previous message");
        }
      }
      if (hasPreviousToolUse) {
        const toolUseIds = new Set(previousContent.filter((c) => c.type === "tool_use").map((c) => c.id));
        const toolResultIds = new Set(lastContent.filter((c) => c.type === "tool_result").map((c) => c.toolUseId));
        if (toolUseIds.size !== toolResultIds.size || ![...toolUseIds].every((id) => toolResultIds.has(id))) {
          throw new Error("ids of tool_result blocks and tool_use blocks from previous message do not match");
        }
      }
    }
    if (params.tools) {
      return this.request({ method: "sampling/createMessage", params }, CreateMessageResultWithToolsSchema, options);
    }
    return this.request({ method: "sampling/createMessage", params }, CreateMessageResultSchema, options);
  }
  /**
   * Creates an elicitation request for the given parameters.
   * For backwards compatibility, `mode` may be omitted for form requests and will default to `'form'`.
   * @param params The parameters for the elicitation request.
   * @param options Optional request options.
   * @returns The result of the elicitation request.
   */
  async elicitInput(params, options) {
    const mode = params.mode ?? "form";
    switch (mode) {
      case "url": {
        if (!this._clientCapabilities?.elicitation?.url) {
          throw new Error("Client does not support url elicitation.");
        }
        const urlParams = params;
        return this.request({ method: "elicitation/create", params: urlParams }, ElicitResultSchema, options);
      }
      case "form": {
        if (!this._clientCapabilities?.elicitation?.form) {
          throw new Error("Client does not support form elicitation.");
        }
        const formParams = params.mode === "form" ? params : { ...params, mode: "form" };
        const result = await this.request({ method: "elicitation/create", params: formParams }, ElicitResultSchema, options);
        if (result.action === "accept" && result.content && formParams.requestedSchema) {
          try {
            const validator = this._jsonSchemaValidator.getValidator(formParams.requestedSchema);
            const validationResult = validator(result.content);
            if (!validationResult.valid) {
              throw new McpError(ErrorCode.InvalidParams, `Elicitation response content does not match requested schema: ${validationResult.errorMessage}`);
            }
          } catch (error2) {
            if (error2 instanceof McpError) {
              throw error2;
            }
            throw new McpError(ErrorCode.InternalError, `Error validating elicitation response: ${error2 instanceof Error ? error2.message : String(error2)}`);
          }
        }
        return result;
      }
    }
  }
  /**
   * Creates a reusable callback that, when invoked, will send a `notifications/elicitation/complete`
   * notification for the specified elicitation ID.
   *
   * @param elicitationId The ID of the elicitation to mark as complete.
   * @param options Optional notification options. Useful when the completion notification should be related to a prior request.
   * @returns A function that emits the completion notification when awaited.
   */
  createElicitationCompletionNotifier(elicitationId, options) {
    if (!this._clientCapabilities?.elicitation?.url) {
      throw new Error("Client does not support URL elicitation (required for notifications/elicitation/complete)");
    }
    return () => this.notification({
      method: "notifications/elicitation/complete",
      params: {
        elicitationId
      }
    }, options);
  }
  async listRoots(params, options) {
    return this.request({ method: "roots/list", params }, ListRootsResultSchema, options);
  }
  /**
   * Sends a logging message to the client, if connected.
   * Note: You only need to send the parameters object, not the entire JSON RPC message
   * @see LoggingMessageNotification
   * @param params
   * @param sessionId optional for stateless and backward compatibility
   */
  async sendLoggingMessage(params, sessionId) {
    if (this._capabilities.logging) {
      if (!this.isMessageIgnored(params.level, sessionId)) {
        return this.notification({ method: "notifications/message", params });
      }
    }
  }
  async sendResourceUpdated(params) {
    return this.notification({
      method: "notifications/resources/updated",
      params
    });
  }
  async sendResourceListChanged() {
    return this.notification({
      method: "notifications/resources/list_changed"
    });
  }
  async sendToolListChanged() {
    return this.notification({ method: "notifications/tools/list_changed" });
  }
  async sendPromptListChanged() {
    return this.notification({ method: "notifications/prompts/list_changed" });
  }
};

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
import process3 from "node:process";

// node_modules/@modelcontextprotocol/sdk/dist/esm/shared/stdio.js
var STDIO_DEFAULT_MAX_BUFFER_SIZE = 10 * 1024 * 1024;
var ReadBuffer = class {
  constructor(options) {
    this._maxBufferSize = options?.maxBufferSize ?? STDIO_DEFAULT_MAX_BUFFER_SIZE;
  }
  append(chunk) {
    const newSize = (this._buffer?.length ?? 0) + chunk.length;
    if (newSize > this._maxBufferSize) {
      this.clear();
      throw new Error(`ReadBuffer exceeded maximum size of ${this._maxBufferSize} bytes`);
    }
    this._buffer = this._buffer ? Buffer.concat([this._buffer, chunk]) : chunk;
  }
  readMessage() {
    if (!this._buffer) {
      return null;
    }
    const index = this._buffer.indexOf("\n");
    if (index === -1) {
      return null;
    }
    const line = this._buffer.toString("utf8", 0, index).replace(/\r$/, "");
    this._buffer = this._buffer.subarray(index + 1);
    return deserializeMessage(line);
  }
  clear() {
    this._buffer = void 0;
  }
};
function deserializeMessage(line) {
  return JSONRPCMessageSchema.parse(JSON.parse(line));
}
function serializeMessage(message) {
  return JSON.stringify(message) + "\n";
}

// node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js
var StdioServerTransport = class {
  constructor(_stdin = process3.stdin, _stdout = process3.stdout, options) {
    this._stdin = _stdin;
    this._stdout = _stdout;
    this._started = false;
    this._ondata = (chunk) => {
      try {
        this._readBuffer.append(chunk);
        this.processReadBuffer();
      } catch (error2) {
        this.onerror?.(error2);
        this.close().catch(() => {
        });
      }
    };
    this._onerror = (error2) => {
      this.onerror?.(error2);
    };
    this._readBuffer = new ReadBuffer({ maxBufferSize: options?.maxBufferSize });
  }
  /**
   * Starts listening for messages on stdin.
   */
  async start() {
    if (this._started) {
      throw new Error("StdioServerTransport already started! If using Server class, note that connect() calls start() automatically.");
    }
    this._started = true;
    this._stdin.on("data", this._ondata);
    this._stdin.on("error", this._onerror);
  }
  processReadBuffer() {
    while (true) {
      try {
        const message = this._readBuffer.readMessage();
        if (message === null) {
          break;
        }
        this.onmessage?.(message);
      } catch (error2) {
        this.onerror?.(error2);
      }
    }
  }
  async close() {
    this._stdin.off("data", this._ondata);
    this._stdin.off("error", this._onerror);
    const remainingDataListeners = this._stdin.listenerCount("data");
    if (remainingDataListeners === 0) {
      this._stdin.pause();
    }
    this._readBuffer.clear();
    this.onclose?.();
  }
  send(message) {
    return new Promise((resolve2) => {
      const json = serializeMessage(message);
      if (this._stdout.write(json)) {
        resolve2();
      } else {
        this._stdout.once("drain", resolve2);
      }
    });
  }
};

// src/bridge.ts
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// ../shared/protocol.ts
var PROTOCOL_VERSION = 1;
var PORT_START = 49630;
var PORT_END = 49639;
var SERVICE_ID = "eda-mcp-bridge";
var PAIR_CODE_TTL_MS = 5 * 60 * 1e3;
var PAIR_MAX_ATTEMPTS = 5;

// src/pairing.ts
import { randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

// src/logger.ts
var PREFIX = "[eda-mcp]";
function log(msg) {
  process.stderr.write(`${PREFIX} ${msg}
`);
}
function logError(msg, err) {
  const detail = err instanceof Error ? `${err.message}
${err.stack ?? ""}` : err !== void 0 ? String(err) : "";
  process.stderr.write(`${PREFIX} [ERROR] ${msg}${detail ? ` \u2014 ${detail}` : ""}
`);
}
function logDebug(msg) {
  if (process.env.EDA_MCP_DEBUG) process.stderr.write(`${PREFIX} [debug] ${msg}
`);
}

// src/pairing.ts
var CONFIG_DIR = process.env.EDA_MCP_HOME ?? join(homedir(), ".eda-mcp");
var PAIRING_FILE = join(CONFIG_DIR, "pairing.json");
var record2 = null;
var recordLoaded = false;
var session = null;
async function loadPairing() {
  if (recordLoaded) return record2;
  recordLoaded = true;
  try {
    const raw = await readFile(PAIRING_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.token === "string" && parsed.token.length >= 32) {
      record2 = { token: parsed.token, pairedAt: parsed.pairedAt ?? 0, client: parsed.client };
      log(`\u5DF2\u52A0\u8F7D\u914D\u5BF9\u8BB0\u5F55\uFF08${record2.client?.host ?? "unknown"}\uFF0C${new Date(record2.pairedAt).toLocaleString("zh-CN")}\uFF09`);
    } else {
      log("\u914D\u5BF9\u6587\u4EF6\u683C\u5F0F\u4E0D\u6B63\u786E\uFF0C\u6309\u672A\u914D\u5BF9\u5904\u7406");
    }
  } catch (e) {
    if (e.code !== "ENOENT") logError("\u8BFB\u53D6\u914D\u5BF9\u6587\u4EF6\u5931\u8D25", e);
  }
  return record2;
}
async function persist(rec) {
  await mkdir(dirname(PAIRING_FILE), { recursive: true, mode: 448 });
  await writeFile(PAIRING_FILE, JSON.stringify(rec, null, 2), { mode: 384 });
  await chmod(PAIRING_FILE, 384);
}
function startPairing() {
  const code = String(randomInt(0, 1e6)).padStart(6, "0");
  session = { code, expiresAt: Date.now() + PAIR_CODE_TTL_MS, attempts: 0 };
  log(`\u5DF2\u5F00\u542F\u914D\u5BF9\u4F1A\u8BDD\uFF0C\u914D\u5BF9\u7801 ${code}\uFF0C${PAIR_CODE_TTL_MS / 1e3}s \u5185\u6709\u6548`);
  return session;
}
function getPairingSession() {
  if (session && Date.now() > session.expiresAt) session = null;
  return session;
}
async function verifyCode(code, client) {
  const s = session;
  if (!s) return { ok: false, error: "no_pairing_session" };
  if (Date.now() > s.expiresAt) {
    session = null;
    return { ok: false, error: "expired" };
  }
  if (s.attempts >= PAIR_MAX_ATTEMPTS) {
    session = null;
    return { ok: false, error: "too_many_attempts" };
  }
  s.attempts += 1;
  if (!constantTimeEqual(code, s.code)) {
    const attemptsLeft = PAIR_MAX_ATTEMPTS - s.attempts;
    if (attemptsLeft <= 0) {
      session = null;
      return { ok: false, error: "too_many_attempts", attemptsLeft: 0 };
    }
    return { ok: false, error: "invalid_code", attemptsLeft };
  }
  session = null;
  const rec = { token: randomBytes(32).toString("hex"), pairedAt: Date.now(), client };
  await persist(rec);
  record2 = rec;
  recordLoaded = true;
  log(`\u914D\u5BF9\u6210\u529F\uFF08${client?.host ?? "unknown"} / EDA ${client?.edaVersion ?? "?"}\uFF09\uFF0C\u5DF2\u7B7E\u53D1 token`);
  return { ok: true, token: rec.token };
}
async function verifyToken(token) {
  const rec = await loadPairing();
  if (!rec) return false;
  return constantTimeEqual(token, rec.token);
}
async function revokePairing() {
  record2 = null;
  recordLoaded = true;
  session = null;
  try {
    await rm(PAIRING_FILE, { force: true });
    log("\u5DF2\u89E3\u9664\u914D\u5BF9\u5E76\u5220\u9664\u672C\u5730 token");
  } catch (e) {
    logError("\u5220\u9664\u914D\u5BF9\u6587\u4EF6\u5931\u8D25", e);
  }
}
function pairingFilePath() {
  return PAIRING_FILE;
}
function constantTimeEqual(a, b) {
  const ba = Buffer.from(a, "utf-8");
  const bb = Buffer.from(b, "utf-8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

// src/bridge.ts
var AUTH_TIMEOUT_MS = 6e4;
var DEFAULT_EXEC_TIMEOUT_MS = 3e4;
var HEARTBEAT_MS = 2e4;
var RECONNECT_WAIT_MS = 12e4;
var VERSION = "0.1.71";
var Bridge = class {
  http = null;
  wss = null;
  port = 0;
  clients = /* @__PURE__ */ new Map();
  activeId = null;
  pending = /* @__PURE__ */ new Map();
  heartbeat = null;
  get listeningPort() {
    return this.port;
  }
  /** 已认证的连接 */
  authedClients() {
    return [...this.clients.values()].filter((c) => c.authed);
  }
  activeClient() {
    if (this.activeId) {
      const c = this.clients.get(this.activeId);
      if (c?.authed) return c;
    }
    return this.authedClients().at(-1) ?? null;
  }
  setActiveClient(id) {
    const c = this.clients.get(id);
    if (!c?.authed) return false;
    this.activeId = id;
    return true;
  }
  /** 在 PORT_START..PORT_END 里找一个能监听的端口 */
  async start() {
    await loadPairing();
    for (let p = PORT_START; p <= PORT_END; p++) {
      try {
        await this.listenOn(p);
        this.port = p;
        log(`bridge \u76D1\u542C 127.0.0.1:${p}\uFF08\u534F\u8BAE v${PROTOCOL_VERSION}\uFF09`);
        this.startHeartbeat();
        return p;
      } catch (e) {
        if (e.code === "EADDRINUSE") continue;
        throw e;
      }
    }
    throw new Error(`\u7AEF\u53E3\u6BB5 ${PORT_START}-${PORT_END} \u5168\u88AB\u5360\u7528\uFF0Cbridge \u65E0\u6CD5\u542F\u52A8`);
  }
  listenOn(port) {
    return new Promise((resolve2, reject) => {
      const http = createServer((req, res) => {
        const origin = req.headers.origin;
        if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Headers", "content-type");
        res.setHeader("Vary", "Origin");
        if (req.method === "OPTIONS") {
          res.writeHead(204).end();
          return;
        }
        if (req.url === "/health") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              service: SERVICE_ID,
              protocol: PROTOCOL_VERSION,
              version: VERSION,
              pairingOpen: getPairingSession() !== null,
              clients: this.authedClients().length
            })
          );
          return;
        }
        res.writeHead(404).end();
      });
      const onError = (e) => {
        http.removeListener("listening", onListening);
        reject(e);
      };
      const onListening = () => {
        http.removeListener("error", onError);
        this.http = http;
        this.wss = new import_websocket_server.default({ server: http });
        this.wss.on("connection", (ws, req) => this.onConnection(ws, req.headers.origin));
        resolve2();
      };
      http.once("error", onError);
      http.once("listening", onListening);
      http.listen(port, "127.0.0.1");
    });
  }
  onConnection(ws, origin) {
    const client = {
      id: randomUUID(),
      ws,
      authed: false,
      origin,
      connectedAt: Date.now(),
      lastSeen: Date.now()
    };
    this.clients.set(client.id, client);
    log(`\u65B0\u8FDE\u63A5 ${client.id.slice(0, 8)} origin=${origin ?? "-"}\uFF08\u7B49\u5F85\u8BA4\u8BC1\uFF09`);
    const authTimer = setTimeout(() => {
      if (!client.authed) {
        log(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u8D85\u65F6\u672A\u8BA4\u8BC1\uFF0C\u65AD\u5F00`);
        ws.close(4001, "auth timeout");
      }
    }, AUTH_TIMEOUT_MS);
    this.send(ws, {
      type: "hello",
      service: SERVICE_ID,
      protocol: PROTOCOL_VERSION,
      pairingOpen: getPairingSession() !== null,
      serverVersion: VERSION
    });
    ws.on("message", (raw) => {
      client.lastSeen = Date.now();
      void this.onMessage(client, raw.toString(), authTimer);
    });
    ws.on("close", (code) => {
      clearTimeout(authTimer);
      this.clients.delete(client.id);
      if (this.activeId === client.id) this.activeId = null;
      log(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u5173\u95ED code=${code}`);
      if (this.pending.size) {
        log(`\u8FDE\u63A5\u5173\u95ED\u65F6\u6709 ${this.pending.size} \u4E2A\u8BF7\u6C42\u5728\u7B49\u5F85\uFF0C\u6807\u8BB0\u4E3A\u65AD\u8FDE`);
        for (const [id, p] of this.pending) {
          clearTimeout(p.timer);
          this.pending.delete(id);
          p.reject(new Error("DISCONNECTED"));
        }
      }
    });
    ws.on("error", (e) => logError(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u51FA\u9519`, e));
    ws.on("pong", () => {
      client.lastSeen = Date.now();
    });
  }
  async onMessage(client, raw, authTimer) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      logDebug(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u53D1\u6765\u975E JSON\uFF0C\u5FFD\u7565`);
      return;
    }
    if (!client.authed) {
      if (msg.type === "ping") {
        this.send(client.ws, { type: "pong", id: msg.id });
        return;
      }
      if (msg.type === "pair") {
        if (msg.protocol !== PROTOCOL_VERSION) {
          this.send(client.ws, { type: "auth_error", error: "protocol_mismatch" });
          client.ws.close(4002, "protocol mismatch");
          return;
        }
        const r = await verifyCode(String(msg.code ?? ""), msg.client);
        if (r.ok) {
          client.authed = true;
          client.info = msg.client;
          this.activeId = client.id;
          clearTimeout(authTimer);
          this.send(client.ws, { type: "paired", token: r.token });
          log(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u914D\u5BF9\u6210\u529F\uFF08${msg.client?.host ?? "unknown"}\uFF09`);
        } else {
          this.send(client.ws, { type: "pair_error", error: r.error, attemptsLeft: r.attemptsLeft });
          log(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u914D\u5BF9\u5931\u8D25\uFF1A${r.error}`);
        }
        return;
      }
      if (msg.type === "auth") {
        if (msg.protocol !== PROTOCOL_VERSION) {
          this.send(client.ws, { type: "auth_error", error: "protocol_mismatch" });
          client.ws.close(4002, "protocol mismatch");
          return;
        }
        if (await verifyToken(String(msg.token ?? ""))) {
          client.authed = true;
          client.info = msg.client;
          this.activeId = client.id;
          clearTimeout(authTimer);
          this.send(client.ws, { type: "auth_ok", sessionId: client.id });
          log(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u8BA4\u8BC1\u901A\u8FC7\uFF08${msg.client?.host ?? "unknown"} / EDA ${msg.client?.edaVersion ?? "?"}\uFF09`);
        } else {
          this.send(client.ws, { type: "auth_error", error: "invalid_token" });
          log(`\u8FDE\u63A5 ${client.id.slice(0, 8)} token \u65E0\u6548`);
        }
        return;
      }
      logDebug(`\u8FDE\u63A5 ${client.id.slice(0, 8)} \u672A\u8BA4\u8BC1\u5374\u53D1\u6765 ${msg.type}\uFF0C\u5FFD\u7565`);
      return;
    }
    switch (msg.type) {
      case "ping":
        this.send(client.ws, { type: "pong", id: msg.id });
        break;
      case "pong":
        break;
      case "result": {
        const p = this.pending.get(msg.id);
        if (!p) return;
        clearTimeout(p.timer);
        this.pending.delete(msg.id);
        p.resolve(msg.result);
        break;
      }
      case "error": {
        const p = this.pending.get(msg.id);
        if (!p) return;
        clearTimeout(p.timer);
        this.pending.delete(msg.id);
        p.reject(new Error(msg.stack ? `${msg.error}
${msg.stack}` : msg.error));
        break;
      }
      default:
        logDebug(`\u6536\u5230\u672A\u77E5\u6D88\u606F\u7C7B\u578B ${msg.type}`);
    }
  }
  /**
   * 在 EDA 里执行一段 JS（AsyncFunction，可 await，`eda` 已注入）。
   *
   * 断连后**只读操作**自动重试一次：部分 EDA 操作（实测 createNetFlag）会让扩展重连，
   * 此时请求已经发出但回包永远不会来。扩展几秒内就会自己连回来，重试即可成功 ——
   * 比把一个本可恢复的抖动报成失败要好。
   *
   * **写操作（noRetry）不重试**：重试一个已经生效的写操作会做第二遍。
   */
  async execute(code, timeoutMs = DEFAULT_EXEC_TIMEOUT_MS, noRetry = false) {
    try {
      return await this.executeOnce(code, timeoutMs);
    } catch (e) {
      if (!(e instanceof Error) || e.message !== "DISCONNECTED") throw e;
      if (noRetry) {
        throw new Error(
          "\u6267\u884C\u671F\u95F4\u8FDE\u63A5\u65AD\u5F00\uFF0C\u62FF\u4E0D\u5230\u8FD4\u56DE\u503C\u3002**\u8FD9\u662F\u5199\u64CD\u4F5C\uFF0C\u52A8\u4F5C\u5F88\u53EF\u80FD\u5DF2\u7ECF\u751F\u6548** \u2014\u2014 \u65AD\u5F00\u7684\u662F\u56DE\u5305\uFF0C\u4E0D\u662F\u6267\u884C\u672C\u8EAB\u3002\u8BF7\u5148\u7528\u53EA\u8BFB\u5DE5\u5177\u6838\u5B9E\u5F53\u524D\u72B6\u6001\uFF08\u5982 eda_schematic_components \u770B\u5668\u4EF6\u662F\u5426\u5DF2\u5B58\u5728\uFF09\uFF0C\u786E\u8BA4\u540E\u518D\u51B3\u5B9A\u662F\u5426\u91CD\u505A\uFF0C\u4E0D\u8981\u76F4\u63A5\u91CD\u8BD5\u3002"
        );
      }
      log("\u6267\u884C\u671F\u95F4\u8FDE\u63A5\u65AD\u5F00\uFF0C\u7B49\u5F85\u6269\u5C55\u91CD\u8FDE\u540E\u91CD\u8BD5\u4E00\u6B21");
      const back = await this.waitForClient(RECONNECT_WAIT_MS);
      if (!back) {
        throw new Error(
          "\u6267\u884C\u671F\u95F4\u8FDE\u63A5\u65AD\u5F00\uFF0C\u4E14\u6269\u5C55\u672A\u5728 30 \u79D2\u5185\u91CD\u8FDE\u3002**\u8FD9\u6BB5\u4EE3\u7801\u53EF\u80FD\u5DF2\u7ECF\u5728 EDA \u91CC\u6267\u884C\u8FC7\u4E86** \u2014\u2014 \u65AD\u7684\u662F\u56DE\u5305\uFF0C\u4E0D\u662F\u6267\u884C\u672C\u8EAB\uFF0C\u91CD\u8BD5\u5199\u64CD\u4F5C\u524D\u8BF7\u5148\u6838\u5B9E\u5F53\u524D\u72B6\u6001\u3002\u53EF\u8BA9\u7528\u6237\u5728 EDA \u91CC\u70B9\u300CEDA Bridge \u2192 \u91CD\u65B0\u8FDE\u63A5\u300D\u3002"
        );
      }
      try {
        return await this.executeOnce(code, timeoutMs);
      } catch (e2) {
        if (!(e2 instanceof Error) || e2.message !== "DISCONNECTED") throw e2;
        throw new Error(
          "\u8BE5\u64CD\u4F5C\u6BCF\u6B21\u6267\u884C\u90FD\u4F1A\u8BA9 EDA \u6269\u5C55\u91CD\u8FDE\uFF0C\u62FF\u4E0D\u5230\u8FD4\u56DE\u503C\u3002**\u52A8\u4F5C\u5F88\u53EF\u80FD\u5DF2\u7ECF\u751F\u6548**\uFF08\u65AD\u5F00\u7684\u662F\u56DE\u5305\uFF0C\u4E0D\u662F\u6267\u884C\uFF09\u2014\u2014 \u8BF7\u5148\u7528\u53EA\u8BFB\u5DE5\u5177\u6838\u5B9E\u7ED3\u679C\uFF08\u5982 eda_schematic_nets / eda_schematic_primitives\uFF09\uFF0C\u786E\u8BA4\u540E\u518D\u51B3\u5B9A\u662F\u5426\u91CD\u505A\uFF0C\u4E0D\u8981\u76F4\u63A5\u91CD\u8BD5\u3002"
        );
      }
    }
  }
  executeOnce(code, timeoutMs) {
    const client = this.activeClient();
    if (!client) return Promise.reject(new Error("NO_CLIENT"));
    const id = randomUUID();
    return new Promise((resolve2, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`\u6267\u884C\u8D85\u65F6\uFF08${timeoutMs}ms\uFF09\u2014\u2014 EDA \u53EF\u80FD\u6B63\u5FD9\uFF0C\u6216\u4EE3\u7801\u91CC\u6709\u672A resolve \u7684 Promise`));
      }, timeoutMs);
      this.pending.set(id, { resolve: resolve2, reject, timer });
      this.send(client.ws, { type: "execute", id, code });
    });
  }
  /** 等待有已认证连接；已有则立即返回 */
  waitForClient(maxMs) {
    if (this.activeClient()) return Promise.resolve(true);
    return new Promise((resolve2) => {
      const started = Date.now();
      const tick = setInterval(() => {
        if (this.activeClient()) {
          clearInterval(tick);
          resolve2(true);
        } else if (Date.now() - started > maxMs) {
          clearInterval(tick);
          resolve2(false);
        }
      }, 300);
    });
  }
  send(ws, msg) {
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
  }
  /** 主动踢掉所有已认证连接（解除配对后调用） */
  disconnectAll(reason) {
    for (const c of this.clients.values()) c.ws.close(4003, reason);
  }
  startHeartbeat() {
    this.heartbeat = setInterval(() => {
      for (const c of this.clients.values()) {
        if (Date.now() - c.lastSeen > HEARTBEAT_MS * 3) {
          log(`\u8FDE\u63A5 ${c.id.slice(0, 8)} \u5FC3\u8DF3\u8D85\u65F6\uFF0C\u65AD\u5F00`);
          c.ws.terminate();
          continue;
        }
        if (c.ws.readyState === c.ws.OPEN) c.ws.ping();
      }
    }, HEARTBEAT_MS);
    this.heartbeat.unref?.();
  }
  async stop() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    for (const p of this.pending.values()) {
      clearTimeout(p.timer);
      p.reject(new Error("bridge \u5DF2\u505C\u6B62"));
    }
    this.pending.clear();
    this.wss?.close();
    await new Promise((r) => this.http ? this.http.close(() => r()) : r());
  }
};

// src/tools/connection.ts
async function notConnectedHint(bridgePort) {
  const paired = await loadPairing() !== null;
  return [
    "\u5F53\u524D\u6CA1\u6709\u5DF2\u8FDE\u63A5\u7684 EDA\u3002\u6309\u987A\u5E8F\u6392\u67E5\uFF1A",
    "1. \u7ACB\u521BEDA\u4E13\u4E1A\u7248\u91CC\u662F\u5426\u5B89\u88C5\u4E86 eda-bridge \u6269\u5C55\uFF08\u9AD8\u7EA7 \u2192 \u6269\u5C55\u7BA1\u7406\u5668 \u2192 \u5DF2\u5B89\u88C5 \u2192 \u5BFC\u5165 .eext\uFF09",
    "2. \u6269\u5C55\u7BA1\u7406\u5668\u91CC\u662F\u5426\u52FE\u9009\u4E86\u300C\u5141\u8BB8\u5916\u90E8\u4EA4\u4E92\u300D\u2014\u2014 \u4E0D\u52FE\u5219 SYS_WebSocket \u76F4\u63A5\u629B\u9519\uFF0C\u8FD9\u662F\u7ACB\u521B\u7684\u786C\u6027\u8981\u6C42",
    paired ? "3. \u672C\u673A\u5DF2\u6709\u914D\u5BF9\u8BB0\u5F55\uFF0C\u6269\u5C55\u542F\u52A8\u540E\u4F1A\u81EA\u52A8\u91CD\u8FDE\uFF1B\u82E5\u957F\u65F6\u95F4\u8FDE\u4E0D\u4E0A\uFF0C\u8BA9\u7528\u6237\u70B9\u300CEDA Bridge \u2192 \u91CD\u65B0\u8FDE\u63A5\u300D\uFF0C\u4ECD\u4E0D\u884C\u5219\u7528 eda_unpair \u540E\u91CD\u65B0\u914D\u5BF9" : "3. \u5C1A\u672A\u914D\u5BF9\uFF1A\u8C03\u7528 eda_pair_start \u53D6 6 \u4F4D\u7801\uFF0C\u8BA9\u7528\u6237\u5728\u300CEDA Bridge \u2192 \u914D\u5BF9\u300D\u91CC\u8F93\u5165",
    "4. \u82E5\u521A\u88C5\u597D\u6269\u5C55\uFF0C\u9700\u8981\u5237\u65B0\u7F51\u9875\u7248\u9875\u9762\uFF08\u6216\u91CD\u542F\u5BA2\u6237\u7AEF\uFF09\u8BA9\u6269\u5C55\u52A0\u8F7D",
    `
bridge \u76D1\u542C\u7AEF\u53E3\uFF1A${bridgePort || `${PORT_START}-${PORT_END}`}`
  ].join("\n");
}
var connectionTools = [
  {
    name: "eda_status",
    description: "\u67E5\u770B EDA \u8FDE\u63A5\u72B6\u6001\uFF1Abridge \u7AEF\u53E3\u3001\u5DF2\u8FDE\u63A5\u7684 EDA \u5B9E\u4F8B\uFF08\u684C\u9762\u5BA2\u6237\u7AEF / \u7F51\u9875\u7248\uFF09\u3001\u914D\u5BF9\u72B6\u6001\u3002\n\n\u4EFB\u4F55 EDA \u64CD\u4F5C\u5931\u8D25\u6216\u4E0D\u786E\u5B9A\u662F\u5426\u8FDE\u7740\u65F6\u5148\u8C03\u8FD9\u4E2A\uFF0C\u5B83\u4F1A\u7ED9\u51FA\u4E0B\u4E00\u6B65\u7684\u660E\u786E\u6307\u5F15\u3002",
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => {
      const rec = await loadPairing();
      const clients = ctx2.bridge.authedClients().map((c) => ({
        id: c.id.slice(0, 8),
        host: c.info?.host ?? "unknown",
        eda_version: c.info?.edaVersion,
        ext_version: c.info?.extVersion,
        active: c.id === ctx2.bridge.activeClient()?.id,
        connected_seconds: Math.round((Date.now() - c.connectedAt) / 1e3)
      }));
      const verNum = (v) => {
        const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
        if (!m) return null;
        return Number(m[1]) * 1e6 + Number(m[2]) * 1e3 + Number(m[3]);
      };
      const FIXED_IN = verNum("0.1.69");
      const stale = clients.filter((c) => {
        const n = verNum(String(c.ext_version ?? ""));
        return n != null && n < FIXED_IN;
      });
      const leak = clients.length > 3 ? `**\u68C0\u6D4B\u5230 ${clients.length} \u6761\u8FDE\u63A5**\uFF0C\u4F46\u6B63\u5E38\u53EA\u8BE5\u6709\u4E00\u6761\uFF08\u6BCF\u4E2A EDA \u6807\u7B7E\u9875\u4E00\u6761\uFF09\u3002` + (stale.length ? `\u5176\u4E2D ${stale.length} \u6761\u6765\u81EA v0.1.69 \u4E4B\u524D\u7684\u6269\u5C55\uFF0C\u90A3\u4E2A\u7248\u672C\u91CD\u8FDE\u65F6\u4E0D\u5173\u65E7\u8FDE\u63A5 \u2014\u2014 \u8BF7\u5728 EDA \u91CC\u91CD\u65B0\u5BFC\u5165 plugin/plugins/eda-pro/extension/ \u4E0B\u7684\u6700\u65B0 .eext\u3002` : "\u5237\u65B0 EDA \u9875\u9762\u53EF\u4EE5\u6E05\u6389\u591A\u4F59\u7684\u3002") + "\u591A\u4F59\u7684\u8FDE\u63A5\u4F1A\u8BA9\u8C03\u7528\u53D1\u5230\u65E9\u5C31\u4E0D\u7528\u7684\u90A3\u6761\u4E0A\uFF0C\u8868\u73B0\u4E3A\u300C\u6CA1\u53CD\u5E94\u300D\u3002" : null;
      return {
        bridge_port: ctx2.bridge.listeningPort,
        paired: rec !== null,
        paired_at: rec ? new Date(rec.pairedAt).toISOString() : null,
        pairing_file: pairingFilePath(),
        connected_clients: clients,
        connection_leak: leak ?? void 0,
        hint: clients.length === 0 ? await notConnectedHint(ctx2.bridge.listeningPort) : leak ?? "\u8FDE\u63A5\u6B63\u5E38\uFF0C\u53EF\u4EE5\u64CD\u4F5C EDA\u3002"
      };
    }
  },
  {
    name: "eda_pair_start",
    description: `\u5F00\u542F\u4E00\u6B21\u914D\u5BF9\uFF0C\u8FD4\u56DE 6 \u4F4D\u914D\u5BF9\u7801\u3002\u628A\u7801\u539F\u6837\u544A\u8BC9\u7528\u6237\uFF0C\u8BA9 TA \u5728 EDA \u7684\u300CEDA Bridge \u2192 \u914D\u5BF9\u300D\u91CC\u8F93\u5165\u3002

\u914D\u5BF9\u7801 ${PAIR_CODE_TTL_MS / 6e4} \u5206\u949F\u5185\u6709\u6548\u3001\u6700\u591A 5 \u6B21\u5C1D\u8BD5\u3001\u6210\u529F\u5373\u5E9F\u3002\u4E4B\u540E bridge \u7ED9\u6269\u5C55\u7B7E\u53D1\u957F\u671F token\uFF0C\u91CD\u542F EDA \u4E5F\u4E0D\u7528\u518D\u8F93\u3002

\u4E3A\u4EC0\u4E48\u8981\u914D\u5BF9\uFF1A\u4EFB\u610F\u7F51\u9875\u90FD\u80FD\u8FDE\u672C\u673A ws://127.0.0.1\uFF08Chrome \u4E0D\u62E6 loopback\uFF09\uFF0C\u800C\u672C MCP \u80FD\u5728 EDA \u91CC\u6267\u884C\u4EFB\u610F\u4EE3\u7801\uFF0C\u6545\u5FC5\u987B\u4E00\u6B21\u4EBA\u5DE5\u786E\u8BA4\u3002`,
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => {
      const s = startPairing();
      return {
        pairing_code: s.code,
        expires_in_seconds: Math.round((s.expiresAt - Date.now()) / 1e3),
        bridge_port: ctx2.bridge.listeningPort,
        next_step: `\u8BF7\u628A\u914D\u5BF9\u7801 ${s.code} \u544A\u8BC9\u7528\u6237\uFF0C\u8BA9 TA \u5728 EDA \u91CC\u64CD\u4F5C\uFF1A\u9876\u90E8\u83DC\u5355\u300CEDA Bridge\u300D\u2192\u300C\u914D\u5BF9(P)...\u300D\u2192 \u8F93\u5165\u8FD9 6 \u4F4D\u6570\u5B57\u3002
\u82E5\u6CA1\u6709\u8BE5\u83DC\u5355\uFF0C\u8BF4\u660E\u6269\u5C55\u6CA1\u88C5\u6216\u6CA1\u542F\u7528\uFF1B\u82E5\u63D0\u793A WebSocket \u62A5\u9519\uFF0C\u8BF4\u660E\u300C\u5141\u8BB8\u5916\u90E8\u4EA4\u4E92\u300D\u6CA1\u52FE\u3002`
      };
    }
  },
  {
    name: "eda_unpair",
    description: "\u89E3\u9664\u914D\u5BF9\uFF1A\u5220\u9664\u672C\u5730 token \u5E76\u65AD\u5F00\u6240\u6709\u5DF2\u8FDE\u63A5\u7684 EDA\u3002\u9002\u7528\u4E8E\u6362\u673A\u5668\u3001\u7591\u4F3C token \u6CC4\u9732\u3001\u6216\u914D\u5BF9\u72B6\u6001\u9519\u4E71\u9700\u8981\u91CD\u6765\u3002",
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => {
      await revokePairing();
      ctx2.bridge.disconnectAll("unpaired");
      return { ok: true, message: "\u5DF2\u89E3\u9664\u914D\u5BF9\u5E76\u65AD\u5F00\u6240\u6709 EDA \u8FDE\u63A5\u3002\u91CD\u65B0\u4F7F\u7528\u9700\u518D\u8D70\u4E00\u6B21 eda_pair_start\u3002" };
    }
  },
  {
    name: "eda_execute",
    description: "\u5728\u5DF2\u8FDE\u63A5\u7684 EDA \u91CC\u6267\u884C\u4E00\u6BB5 JavaScript\uFF0C\u8FD4\u56DE\u7ED3\u679C\u3002**\u4F18\u5148\u4F7F\u7528\u8BED\u4E49\u5316\u5DE5\u5177**\uFF08eda_project_* \u7B49\uFF09\uFF0C\u672C\u5DE5\u5177\u662F\u5B83\u4EEC\u8986\u76D6\u4E0D\u5230\u65F6\u7684\u515C\u5E95\u3002\n\n\u4EE3\u7801\u4F53\u8FD0\u884C\u5728 AsyncFunction \u91CC\uFF0C\u53EF\u76F4\u63A5 await\uFF0C\u5168\u5C40\u5BF9\u8C61 eda \u5DF2\u6CE8\u5165\uFF0C**\u5FC5\u987B return** \u5426\u5219\u62FF\u5230 null\u3002\n\u4F8B\uFF1A`return await eda.dmt_Project.getCurrentProjectInfo();`\n\nAPI \u547D\u540D\u7A7A\u95F4\uFF1Asys_*\uFF08\u5BF9\u8BDD\u6846/\u6587\u4EF6/\u5B58\u50A8\uFF09\u3001dmt_*\uFF08\u5DE5\u7A0B/\u677F\u5B50/\u539F\u7406\u56FE/PCB \u7BA1\u7406\uFF09\u3001sch_*\uFF08\u539F\u7406\u56FE\u56FE\u5143/DRC\uFF09\u3001pcb_*\uFF08PCB \u56FE\u5143/\u7F51\u7EDC/\u5C42/\u751F\u4EA7\u8D44\u6599\uFF09\u3001lib_*\uFF08\u5668\u4EF6/\u7B26\u53F7/\u5C01\u88C5\uFF09\u3002\u8FD4\u56DE\u503C\u987B\u80FD JSON \u5E8F\u5217\u5316\uFF0C\u7C7B\u5B9E\u4F8B\u8BF7\u5148\u53D6\u5B57\u6BB5\u3002",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "JS \u4EE3\u7801\u4F53\uFF08\u4E0D\u542B\u51FD\u6570\u5305\u88F9\uFF09\u3002\u7528 return \u8FD4\u56DE\u7ED3\u679C\uFF0C\u53EF\u7528 await\u3002" },
        timeout_ms: { type: "integer", description: "\u53EF\u9009\uFF0C\u8D85\u65F6\u6BEB\u79D2\u6570\uFF0C\u9ED8\u8BA4 30000\u3002DRC\u3001\u751F\u4EA7\u8D44\u6599\u5BFC\u51FA\u7B49\u8017\u65F6\u64CD\u4F5C\u53EF\u8C03\u5927\u3002" }
      },
      required: ["code"]
    },
    handler: async (args, ctx2) => {
      const code = args.code;
      if (typeof code !== "string" || !code.trim()) throw new Error("code \u5FC5\u586B\uFF08string\uFF0CJS \u4EE3\u7801\u4F53\uFF09");
      const t = args.timeout_ms;
      return { result: await ctx2.exec(code, typeof t === "number" && t > 0 ? t : void 0) };
    }
  }
];

// src/tools/types.ts
function requireString(args, key2) {
  const v = args[key2];
  if (typeof v !== "string" || !v.trim()) throw new Error(`${key2} \u5FC5\u586B\uFF08string\uFF09`);
  return v;
}
function optionalString(args, key2) {
  const v = args[key2];
  return typeof v === "string" && v.trim() ? v : void 0;
}
function optionalBool(args, key2, dflt = false) {
  const v = args[key2];
  return typeof v === "boolean" ? v : dflt;
}

// src/tools/create.ts
var CREATE_TIMEOUT_MS = 6e4;
var createTools = [
  {
    name: "eda_create_project",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u65B0\u5EFA\u4E00\u4E2A\u5DE5\u7A0B\u3002\u9ED8\u8BA4\u5EFA\u5728\u5F53\u524D\u56E2\u961F\u4E0B\u3002\n\n\u521B\u5EFA\u540E**\u4E0D\u4F1A\u81EA\u52A8\u5207\u6362**\u8FC7\u53BB\uFF0C\u5F53\u524D\u7F16\u8F91\u7684\u5DE5\u7A0B\u4FDD\u6301\u4E0D\u53D8\uFF1B\u8981\u5207\u8FC7\u53BB\u7528 eda_open_project\u3002\n\n\u6CE8\u610F\u8FD9\u4F1A\u5728\u7528\u6237\u7684\u7ACB\u521B\u8D26\u53F7\u91CC\u771F\u5B9E\u521B\u5EFA\u5DE5\u7A0B\uFF0C\u52A8\u624B\u524D\u5148\u8DDF\u7528\u6237\u786E\u8BA4\u540D\u79F0\u3002",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "\u5DE5\u7A0B\u540D\uFF08\u663E\u793A\u540D\uFF09" },
        description: { type: "string", description: "\u5DE5\u7A0B\u63CF\u8FF0\uFF0C\u53EF\u9009" },
        team_uuid: { type: "string", description: "\u76EE\u6807\u56E2\u961F uuid\uFF0C\u53EF\u9009\uFF0C\u9ED8\u8BA4\u5F53\u524D\u56E2\u961F" }
      },
      required: ["name"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const name = requireString(args, "name");
      const desc = optionalString(args, "description");
      const team = optionalString(args, "team_uuid");
      return ctx2.exec(
        `
				const team = ${JSON.stringify(team ?? null)} || (await eda.dmt_Team.getCurrentTeamInfo())?.uuid;
				if (!team) return { ok: false, error: '\u62FF\u4E0D\u5230\u56E2\u961F uuid' };
				const uuid = await eda.dmt_Project.createProject(
					${JSON.stringify(name)}, undefined, team, undefined, ${JSON.stringify(desc ?? "")}
				);
				if (!uuid) return { ok: false, error: '\u521B\u5EFA\u5931\u8D25\uFF0C\u53EF\u80FD\u662F\u540C\u540D\u5DE5\u7A0B\u5DF2\u5B58\u5728\u6216\u65E0\u6743\u9650' };
				return { ok: true, project_uuid: uuid, name: ${JSON.stringify(name)},
					note: '\u5DE5\u7A0B\u5DF2\u521B\u5EFA\u4F46\u672A\u5207\u6362\u8FC7\u53BB\uFF0C\u9700\u8981\u7F16\u8F91\u7684\u8BDD\u7528 eda_open_project \u6253\u5F00' };
			`,
        CREATE_TIMEOUT_MS
      );
    }
  },
  {
    name: "eda_create_board",
    description: '\u3010\u5199\u64CD\u4F5C\u3011\u5728**\u5F53\u524D\u5DE5\u7A0B**\u91CC\u65B0\u5EFA\u4E00\u5757\u677F\u5B50\uFF0C\u81EA\u52A8\u914D\u597D\u4E00\u5F20\u539F\u7406\u56FE\uFF08\u542B 1 \u9875\uFF09\u548C\u4E00\u4E2A PCB\u3002\n\n\u8FD9\u662F"\u65B0\u5EFA\u677F\u5B50"\u7684\u6B63\u786E\u505A\u6CD5\uFF1A\u5E95\u5C42\u8981\u5148\u5EFA\u539F\u7406\u56FE\u548C PCB \u518D\u7ED1\u5B9A\uFF0C\u672C\u5DE5\u5177\u5DF2\u5C01\u88C5\u3002\n\n\u7ED9\u4E86 name \u4F1A\u521B\u5EFA\u540E\u6539\u540D\uFF1B\u4E0D\u7ED9\u5219\u7528 EDA \u7684\u9ED8\u8BA4\u547D\u540D\uFF08Board1\u3001Board2\u2026\uFF09\u3002\n**\u7ED9\u4E86 name \u65F6\u4F1A\u987A\u5E26\u6253\u5F00\u8FD9\u5757\u677F\u7684\u539F\u7406\u56FE\u9875**\uFF1A\u521A\u5EFA\u7684\u677F\u6587\u6863\u6CA1\u843D\u76D8\uFF0C\u4E0D\u5148\u4FDD\u5B58\u4E00\u6B21\u7684\u8BDD modifyBoardName \u4F1A\u9759\u9ED8\u5931\u8D25\uFF08\u8FD4\u56DE true \u4F46\u540D\u5B57\u6CA1\u53D8\u3001\u91CD\u8BD5\u591A\u4E45\u90FD\u6CA1\u7528\uFF09\u3002\u5DE5\u5177\u4F1A\u81EA\u52A8 openDocument \u2192 save \u2192 \u6539\u540D \u2192 \u6309 schematic uuid \u91CD\u67E5\u786E\u8BA4\uFF0C\u56E0\u6B64\u5EFA\u677F\u8981\u82B1\u5341\u51E0\u79D2\uFF0C\u4E14\u7ED3\u675F\u540E\u5F53\u524D\u7F16\u8F91\u5668\u505C\u5728\u65B0\u677F\u7684\u56FE\u9875\u4E0A\u3002\u4ECD\u672A\u6210\u529F\u65F6 renamed=false \u4E14 rename_failed \u4F1A\u8BF4\u660E\u3002\n\n\u6CE8\u610F\u4F5C\u7528\u5728\u5F53\u524D\u6253\u5F00\u7684\u5DE5\u7A0B\u4E0A \u2014\u2014 \u5148\u7528 eda_project_overview \u786E\u8BA4\u662F\u4E0D\u662F\u76EE\u6807\u5DE5\u7A0B\u3002',
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "\u677F\u5B50\u540D\uFF0C\u53EF\u9009\uFF1B\u4E0D\u7ED9\u7528 EDA \u9ED8\u8BA4\u547D\u540D" } }
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const name = optionalString(args, "name");
      const res = await ctx2.exec(
        `
				const proj = await eda.dmt_Project.getCurrentProjectInfo();
				if (!proj) return { ok: false, error: '\u5F53\u524D\u6CA1\u6709\u6253\u5F00\u7684\u5DE5\u7A0B' };
				// \u5B9E\u6D4B\uFF1A\u8FD9\u4E24\u4E2A\u65E0\u53C2\u8C03\u7528\u53EA\u4EA7\u751F\u6E38\u79BB\u6587\u6863\uFF0C\u5FC5\u987B\u518D createBoard \u7ED1\u5B9A
				const schUuid = await eda.dmt_Schematic.createSchematic();
				const pcbUuid = await eda.dmt_Pcb.createPcb();
				if (!schUuid || !pcbUuid) return { ok: false, error: '\u521B\u5EFA\u539F\u7406\u56FE\u6216 PCB \u5931\u8D25' };
				const createdName = await eda.dmt_Board.createBoard(schUuid, pcbUuid);
				if (!createdName) return { ok: false, error: '\u7ED1\u5B9A\u677F\u5B50\u5931\u8D25' };

				// \u2500\u2500 \u5B9A\u4F4D\u521A\u5EFA\u7684\u677F \u2500\u2500
				// \u5173\u952E\uFF1A\u4E0D\u80FD\u6309\u540D\u5B57\u67E5\u3002\u677F\u5B50\u6CA1\u6709 uuid\uFF0C\u540D\u5B57\u5C31\u662F\u5B83\u7684\u552F\u4E00\u6807\u8BC6\uFF0C\u800C
				// createBoard \u7ED9\u7684\u662F EDA \u9ED8\u8BA4\u547D\u540D\uFF08Board1\u3001Board2\u2026\uFF09\uFF0C\u5DE5\u7A0B\u91CC
				// \u5B8C\u5168\u53EF\u80FD\u5DF2\u7ECF\u6709\u4E2A\u540C\u540D\u7684\u65E7\u677F \u2014\u2014 \u6309\u540D\u5B57 find \u4F1A\u649E\u4E0A\u90A3\u4E2A\u65E7\u677F\uFF0C
				// \u4E8E\u662F\u8FD4\u56DE\u522B\u4EBA\u7684 page uuid\u3002\u8FD9\u4E2A\u5751\u771F\u8E29\u8FC7\uFF1A\u8FDE\u7740\u5EFA\u4E24\u5757\u677F\uFF0C\u4E24\u5757\u90FD
				// \u62A5\u544A\u4E86\u7B2C\u4E09\u5757\u677F\u7684\u56FE\u9875 uuid\u3002
				//
				// \u552F\u4E00\u53EF\u9760\u7684\u5224\u636E\u662F schUuid\uFF1A\u90A3\u662F\u6211\u4EEC\u81EA\u5DF1\u521A\u521B\u5EFA\u7684\u539F\u7406\u56FE uuid\uFF0C
				// \u5168\u5C40\u552F\u4E00\uFF0C\u8C01\u4E5F\u5192\u5145\u4E0D\u4E86\u3002\u5217\u8868\u6709\u7F13\u5B58\uFF0C\u6240\u4EE5\u8981\u8F6E\u8BE2\u7B49\u5B83\u51FA\u73B0\uFF0C
				// \u5B81\u53EF\u591A\u7B49 \u2014\u2014 \u62FF\u5230\u786E\u5B9A\u4FE1\u606F\u6BD4\u5FEB\u8FD4\u56DE\u91CD\u8981\u3002
				let info;
				let attempts = 0;
				const tried = [];
				for (let i = 0; i < 8; i += 1) {
					attempts = i + 1;
					const all = (await eda.dmt_Board.getAllBoardsInfo()) || [];
					info = all.find(function (b) { return b.schematic && b.schematic.uuid === schUuid; });
					// pcb \u5B57\u6BB5\u5076\u5C14\u6BD4 schematic \u665A\u6302\u4E0A\uFF0C\u7B49\u9F50\u518D\u6536
					if (info && info.pcb) break;
					tried.push(all.length);
					info = undefined;
					await new Promise(function (r) { setTimeout(r, 500 + i * 500); });
				}
				if (!info) {
					return {
						ok: false,
						error: '\u677F\u5B50\u5EFA\u51FA\u6765\u4E86\uFF0C\u4F46\u67E5\u8BE2\u4E0D\u5230\u5B83\u7684\u5B8C\u6574\u4FE1\u606F \u2014\u2014 \u8F6E\u8BE2 ' + attempts +
							' \u6B21\u90FD\u6CA1\u5728\u677F\u5B50\u5217\u8868\u91CC\u627E\u5230 schematic.uuid=' + schUuid + ' \u7684\u677F\u5B50\u3002' +
							'\u677F\u5B50\u672C\u8EAB\u5E94\u8BE5\u662F\u597D\u7684\uFF08\u9ED8\u8BA4\u540D ' + createdName + '\uFF09\uFF0C\u8BF7\u5728 EDA \u754C\u9762\u91CC\u786E\u8BA4\u3002' +
							'\u8FD9\u91CC\u62D2\u7EDD\u8FD4\u56DE\u53EF\u80FD\u662F\u522B\u7684\u677F\u5B50\u7684\u6570\u636E\u3002',
						created_name: createdName,
						schematic_uuid: schUuid,
						pcb_uuid: pcbUuid,
						boards_seen_per_attempt: tried,
					};
				}

				// \u2500\u2500 \u4EA4\u53C9\u6821\u9A8C\uFF1A\u62FF\u5230\u7684\u8FD9\u4EFD\u6570\u636E\u5FC5\u987B\u5904\u5904\u81EA\u6D3D \u2500\u2500
				const checks = {
					schematic_uuid_matches: info.schematic.uuid === schUuid,
					pcb_uuid_matches: !!info.pcb && info.pcb.uuid === pcbUuid,
					name_matches_create: info.name === createdName,
					in_current_project: info.parentProjectUuid === proj.uuid,
					has_page: !!(info.schematic.page && info.schematic.page.length),
				};
				const failed = Object.keys(checks).filter(function (k) { return !checks[k]; });
				if (failed.length) {
					return {
						ok: false,
						error: '\u67E5\u5230\u7684\u677F\u5B50\u6570\u636E\u6CA1\u901A\u8FC7\u4EA4\u53C9\u6821\u9A8C\uFF0C\u4E0D\u6562\u7528\uFF1A' + failed.join('\u3001') +
							'\u3002\u591A\u534A\u662F\u67E5\u5230\u4E86\u522B\u7684\u677F\u5B50\u6216\u534A\u65E7\u7684\u7F13\u5B58\u3002\u677F\u5B50\u672C\u8EAB\u5E94\u8BE5\u5DF2\u5EFA\u597D\uFF08' + createdName + '\uFF09\uFF0C\u8BF7\u5728 EDA \u754C\u9762\u786E\u8BA4\u3002',
						checks: checks,
						schematic_uuid: schUuid,
						pcb_uuid: pcbUuid,
					};
				}

				return {
					ok: true,
					board: {
						name: createdName,
						schematic: { uuid: info.schematic.uuid, name: info.schematic.name,
							pages: (info.schematic.page || []).map(function (p) { return { uuid: p.uuid, name: p.name }; }) },
						pcb: { uuid: info.pcb.uuid, name: info.pcb.name },
					},
					schematic_uuid: schUuid,
					project: proj.friendlyName || proj.name,
					// \u8FD9\u5757\u677F\u662F\u9760\u4EC0\u4E48\u8BA4\u51FA\u6765\u7684\u3001\u6821\u9A8C\u8FC7\u54EA\u4E9B\u9879 \u2014\u2014 \u4FBF\u4E8E\u8C03\u7528\u65B9\u5224\u65AD\u53EF\u4FE1\u5EA6
					identified_by: 'schematic.uuid === createSchematic() \u7684\u8FD4\u56DE\u503C',
					lookup_attempts: attempts,
					cross_checks: checks,
				};
			`,
        CREATE_TIMEOUT_MS
      );
      const created = res;
      if (!created?.ok || !name || !created.board?.name || created.board.name === name) {
        return res;
      }
      const firstPage = created.board.schematic?.pages?.[0]?.uuid ?? "";
      const renamed = await ctx2.exec(
        `
				const WANT = ${JSON.stringify(name)};
				const SCH = ${JSON.stringify(created.schematic_uuid ?? "")};
				const PAGE = ${JSON.stringify(firstPage)};
				const findMine = async function () {
					return ((await eda.dmt_Board.getAllBoardsInfo()) || [])
						.find(function (b) { return b.schematic && b.schematic.uuid === SCH; });
				};
				const taken = ((await eda.dmt_Board.getAllBoardsInfo()) || [])
					.some(function (b) { return b.name === WANT && !(b.schematic && b.schematic.uuid === SCH); });
				if (taken) {
					return { ok: false, reason: '\u5DE5\u7A0B\u91CC\u5DF2\u7ECF\u6709\u4E00\u5757\u677F\u53EB ' + WANT + '\uFF0C\u677F\u540D\u5FC5\u987B\u552F\u4E00' };
				}

				// \u5148\u8BA9\u6587\u6863\u843D\u76D8\uFF0C\u5426\u5219\u4E0B\u9762\u7684\u6539\u540D\u4F1A\u8C0E\u62A5\u6210\u529F
				let saved = false;
				if (PAGE) {
					const tab = await eda.dmt_EditorControl.openDocument(PAGE);
					if (tab) {
						await eda.dmt_EditorControl.activateDocument(tab);
						await new Promise(function (r) { setTimeout(r, 1200); });
						saved = (await eda.sch_Document.save().catch(function () { return false; })) === true;
						await new Promise(function (r) { setTimeout(r, 1200); });
					}
				}

				// \u8FD4\u56DE\u503C\u4E0D\u53EF\u4FE1\uFF0C\u5224\u636E\u4E00\u5F8B\u662F\u300C\u6309 schUuid \u91CD\u67E5\u8FD9\u5757\u677F\u53EB\u4EC0\u4E48\u300D
				let tries = 0;
				for (let i = 0; i < 4; i += 1) {
					tries = i + 1;
					const mine = await findMine();
					if (!mine) break;
					if (mine.name === WANT) return { ok: true, tries: tries, saved: saved };
					await eda.dmt_Board.modifyBoardName(mine.name, WANT);
					await new Promise(function (r) { setTimeout(r, 800 + i * 800); });
					const back = await findMine();
					if (back && back.name === WANT) return { ok: true, tries: tries, saved: saved };
				}
				const last = await findMine();
				return { ok: false, tries: tries, saved: saved, current_name: last ? last.name : undefined };
			`,
        CREATE_TIMEOUT_MS
      );
      const okRenamed = renamed?.ok === true;
      return {
        ...created,
        board: { ...created.board, name: okRenamed ? name : created.board.name },
        renamed: okRenamed,
        rename_tries: renamed?.tries,
        rename_failed: okRenamed ? void 0 : `\u6539\u540D\u6CA1\u6210\u529F${renamed?.reason ? `\uFF1A${String(renamed.reason)}` : ""}\u3002\u677F\u5B50\u4EE5 ${String(renamed?.current_name ?? created.board.name)} \u5B58\u5728\uFF0C\u677F\u5B50\u672C\u8EAB\u662F\u597D\u7684\uFF0C\u8BF7\u5728 EDA \u754C\u9762\u91CC\u624B\u52A8\u6539\u540D\u3002`
      };
    }
  },
  {
    name: "eda_create_schematic_page",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u7ED9\u5DF2\u6709\u7684\u539F\u7406\u56FE\u52A0\u4E00\u9875\u3002schematic_uuid \u4ECE eda_project_overview \u7684 boards[].schematic.uuid \u62FF\u3002\n\n\u9002\u7528\u4E8E\u539F\u7406\u56FE\u5185\u5BB9\u591A\u3001\u9700\u8981\u5206\u9875\u7EC4\u7EC7\u7684\u60C5\u51B5\uFF08\u5982\u7535\u6E90\u4E00\u9875\u3001MCU \u4E00\u9875\uFF09\u3002",
    inputSchema: {
      type: "object",
      properties: {
        schematic_uuid: { type: "string", description: "\u76EE\u6807\u539F\u7406\u56FE uuid" },
        name: { type: "string", description: "\u9875\u540D\uFF0C\u53EF\u9009\uFF1B\u4E0D\u7ED9\u7528\u9ED8\u8BA4\u547D\u540D" }
      },
      required: ["schematic_uuid"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const uuid2 = requireString(args, "schematic_uuid");
      const name = optionalString(args, "name");
      return ctx2.exec(
        `
				const pageUuid = await eda.dmt_Schematic.createSchematicPage(${JSON.stringify(uuid2)});
				if (!pageUuid) return { ok: false, error: '\u5EFA\u9875\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4 schematic_uuid \u6B63\u786E' };
				const want = ${JSON.stringify(name ?? null)};
				let renamed = false;
				if (want) renamed = await eda.dmt_Schematic.modifySchematicPageName(pageUuid, want);
				const info = await eda.dmt_Schematic.getSchematicPageInfo(pageUuid);
				return { ok: true, page: { uuid: pageUuid, name: info?.name }, renamed };
			`,
        CREATE_TIMEOUT_MS
      );
    }
  },
  {
    name: "eda_rename_board",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u7ED9\u677F\u5B50\u6539\u540D\u3002\u677F\u540D\u5728\u5DE5\u7A0B\u5185\u552F\u4E00\uFF0C\u91CD\u540D\u4F1A\u5931\u8D25\u3002\n\n**\u8FD9\u4E2A\u529F\u80FD\u4E0D\u53EF\u9760**\uFF1AEDA \u7684 modifyBoardName \u5B9E\u6D4B\u65F6\u7075\u65F6\u4E0D\u7075\uFF08\u6709\u65F6\u8FD4\u56DE true \u5374\u6CA1\u751F\u6548\uFF0C\u6709\u65F6\u8FD4\u56DE false\uFF0C\u4E0E\u540D\u5B57\u957F\u77ED\u3001\u662F\u5426\u542B\u4E2D\u6587\u3001\u662F\u5426\u521A\u5237\u65B0\u9875\u9762\u90FD\u65E0\u7A33\u5B9A\u5173\u7CFB\uFF0C\u539F\u56E0\u672A\u67E5\u660E\uFF09\u3002\u672C\u5DE5\u5177\u4EE5\u300C\u6539\u5B8C\u91CD\u65B0\u67E5\u5217\u8868\u300D\u4E3A\u51C6\uFF0C\u4E0D\u4FE1 API \u8FD4\u56DE\u503C\uFF1B\u5931\u8D25\u65F6\u5982\u5B9E\u62A5\u9519\u3002\n\n\u8FDE\u7EED\u5931\u8D25\u5C31\u522B\u91CD\u8BD5\u4E86\uFF0C\u8BA9\u7528\u6237\u5728 EDA \u754C\u9762\u91CC\u624B\u52A8\u6539\u3002",
    inputSchema: {
      type: "object",
      properties: {
        current_name: { type: "string", description: "\u5F53\u524D\u677F\u540D" },
        new_name: { type: "string", description: "\u65B0\u677F\u540D" }
      },
      required: ["current_name", "new_name"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const from = requireString(args, "current_name");
      const to = requireString(args, "new_name");
      return ctx2.exec(
        `
				const boards = await eda.dmt_Board.getAllBoardsInfo();
				if (!boards.some(b => b.name === ${JSON.stringify(from)})) {
					return { ok: false, error: '\u5F53\u524D\u5DE5\u7A0B\u91CC\u6CA1\u6709\u677F\u5B50 ' + ${JSON.stringify(from)}, boards: boards.map(b => b.name) };
				}
				// \u8FD4\u56DE\u503C\u4E0D\u53EF\u4FE1\uFF0C\u4EE5\u91CD\u65B0\u67E5\u8BE2\u4E3A\u51C6\u3002
				// \u5224\u636E\u5FC5\u987B\u662F\u300C\u65B0\u540D\u51FA\u73B0 \u4E14 \u65E7\u540D\u6D88\u5931\u300D\u2014\u2014 \u53EA\u770B\u65B0\u540D\u5B58\u5728\u7684\u8BDD\uFF0C
				// \u76EE\u6807\u540D\u6070\u597D\u662F\u53E6\u4E00\u5757\u5DF2\u5B58\u5728\u7684\u677F\u65F6\u4F1A\u8BEF\u5224\u6210\u529F\u3002
				await eda.dmt_Board.modifyBoardName(${JSON.stringify(from)}, ${JSON.stringify(to)});
				const names = (await eda.dmt_Board.getAllBoardsInfo()).map(b => b.name);
				if (names.includes(${JSON.stringify(to)}) && !names.includes(${JSON.stringify(from)})) {
					return { ok: true, from: ${JSON.stringify(from)}, to: ${JSON.stringify(to)} };
				}
				return {
					ok: false,
					error: '\u6539\u540D\u672A\u751F\u6548\uFF08modifyBoardName \u8C0E\u62A5\u4E86\u6210\u529F\uFF09\u3002\u6700\u5E38\u89C1\u7684\u539F\u56E0\u662F**\u8FD9\u5757\u677F\u521A\u5EFA\u51FA\u6765\u3001'
						+ '\u539F\u7406\u56FE\u6587\u6863\u8FD8\u6CA1\u843D\u76D8** \u2014\u2014 \u6B64\u65F6\u6539\u540D\u4E00\u5B9A\u5931\u8D25\u4E14\u8FD4\u56DE true\uFF0C\u7B49\u591A\u4E45\u3001\u91CD\u8BD5\u591A\u5C11\u6B21\u90FD\u6CA1\u7528\u3002'
						+ '\u89E3\u6CD5\uFF1A\u5148\u7528 eda_open_document \u6253\u5F00\u8FD9\u5757\u677F\u7684\u539F\u7406\u56FE\u9875\uFF0C\u8DD1\u4E00\u6B21 eda_execute '
						+ '"await eda.sch_Document.save()"\uFF0C\u518D\u56DE\u6765\u6539\u540D\u3002'
						+ '\uFF08\u53E6\u4E00\u79CD\u53EF\u80FD\u662F\u65B0\u540D\u5B57\u4E0E\u73B0\u6709\u677F\u5B50\u91CD\u540D\uFF0C\u677F\u540D\u5728\u5DE5\u7A0B\u5185\u5FC5\u987B\u552F\u4E00\u3002\uFF09',
					boards: names,
				};
			`,
        CREATE_TIMEOUT_MS
      );
    }
  }
];

// src/tools/datasheet.ts
import { createWriteStream } from "node:fs";
import { mkdir as mkdir2, stat, unlink } from "node:fs/promises";
import { homedir as homedir2 } from "node:os";
import { basename, join as join2, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

// src/eda/netlist.ts
var FETCH_NETLIST_CODE = `
	const f = await eda.sch_ManufactureData.getNetlistFile();
	if (!f) return null;
	return await f.text();
`;
function parseNetlist(text) {
  const raw = JSON.parse(text);
  const components = [];
  for (const [id, c] of Object.entries(raw.components ?? {})) {
    const pins = [];
    for (const [key2, p] of Object.entries(c.pinInfoMap ?? {})) {
      const pin = p;
      pins.push({ key: key2, name: pin.name ?? "", number: pin.number ?? "", net: pin.net ?? "" });
    }
    pins.sort((a, b) => naturalCompare(a.number, b.number));
    components.push({ id, props: c.props ?? {}, pins });
  }
  components.sort((a, b) => naturalCompare(designatorOf(a), designatorOf(b)));
  return { version: raw.version ?? "?", components };
}
function designatorOf(c) {
  return c.props.Designator ?? c.id;
}
function partNumberOf(c) {
  const name = c.props.Name;
  const literalName = name && !name.startsWith("={") ? name : void 0;
  return c.props["Manufacturer Part"] ?? literalName ?? c.props.DeviceName ?? "";
}
function briefComponent(c) {
  return {
    designator: designatorOf(c),
    part: partNumberOf(c),
    value: c.props.Value || void 0,
    footprint: c.props.FootprintName || c.props["Supplier Footprint"] || void 0,
    lcsc: c.props["Supplier Part"] || void 0,
    manufacturer: c.props.Manufacturer || void 0,
    pins: c.pins.length
  };
}
function detailComponent(c) {
  const INTERNAL = /* @__PURE__ */ new Set(["Symbol", "Device", "Footprint", "3D Model", "3D Model Transform", "Unique ID", "Channel ID", "Group ID", "Reuse Block"]);
  const props = {};
  for (const [k, v] of Object.entries(c.props)) {
    if (!INTERNAL.has(k) && v !== "") props[k] = v;
  }
  return {
    designator: designatorOf(c),
    part: partNumberOf(c),
    props,
    datasheet: c.props.Datasheet || void 0,
    pins: c.pins.map((p) => ({ number: p.number, name: p.name, net: p.net || null }))
  };
}
function buildNets(components) {
  const map = /* @__PURE__ */ new Map();
  for (const c of components) {
    const d = designatorOf(c);
    for (const p of c.pins) {
      if (!p.net) continue;
      let net = map.get(p.net);
      if (!net) {
        net = { name: p.net, nodes: [] };
        map.set(p.net, net);
      }
      net.nodes.push({ designator: d, pin: p.number, pin_name: p.name });
    }
  }
  const nets = [...map.values()];
  for (const n of nets) n.nodes.sort((a, b) => naturalCompare(a.designator, b.designator) || naturalCompare(a.pin, b.pin));
  nets.sort((a, b) => b.nodes.length - a.nodes.length || a.name.localeCompare(b.name));
  return nets;
}
function isAutoNetName(name) {
  return /^\$\d*N\d+$/.test(name);
}
function naturalCompare(a, b) {
  return a.localeCompare(b, void 0, { numeric: true, sensitivity: "base" });
}

// src/tools/datasheet.ts
var MAX_BYTES = 50 * 1024 * 1024;
var DEFAULT_DIR = join2(homedir2(), "Downloads", "eda-datasheets");
function assertSafeUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new Error(`\u4E0D\u662F\u5408\u6CD5 URL\uFF1A${raw}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error(`\u53EA\u652F\u6301 http/https\uFF0C\u6536\u5230 ${u.protocol}`);
  const h = u.hostname.toLowerCase();
  const blocked = h === "localhost" || h.endsWith(".localhost") || h === "0.0.0.0" || /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^169\.254\./.test(h) || h === "[::1]" || h.startsWith("[fd") || h.startsWith("[fe80");
  if (blocked) throw new Error(`\u62D2\u7EDD\u4E0B\u8F7D\u5185\u7F51\u5730\u5740\uFF1A${h}`);
  return u;
}
function safeFileName(url, disposition) {
  let name = "";
  const m = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (m?.[1]) name = decodeURIComponent(m[1]);
  if (!name) name = basename(url.pathname);
  name = name.replace(/[/\\]/g, "_").replace(/^\.+/, "").trim();
  if (!name) name = "datasheet";
  if (!/\.pdf$/i.test(name)) name += ".pdf";
  return name.slice(0, 120);
}
var datasheetTools = [
  {
    name: "eda_download_datasheet",
    description: "\u628A\u5143\u5668\u4EF6\u6570\u636E\u624B\u518C PDF \u4E0B\u8F7D\u5230\u672C\u673A\u78C1\u76D8\uFF0C\u8FD4\u56DE\u843D\u5730\u8DEF\u5F84\uFF08\u4E4B\u540E\u53EF\u7528\u8BFB PDF \u7684\u5DE5\u5177\u63D0\u53D6\u53C2\u6570\uFF09\u3002\n\n\u4E09\u79CD\u6307\u5B9A\u65B9\u5F0F\uFF0C\u4EFB\u9009\u5176\u4E00\uFF1A\n- designator\uFF1A\u5F53\u524D\u539F\u7406\u56FE\u4E0A\u7684\u4F4D\u53F7\uFF08\u5982 U1\uFF09\uFF0C\u81EA\u52A8\u4ECE\u7F51\u8868\u53D6\u94FE\u63A5 \u2014\u2014 \u6700\u5E38\u7528\n- lcsc_id\uFF1A\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF08\u5982 C347222\uFF09\uFF0C\u4ECE\u5668\u4EF6\u5E93\u53D6\u94FE\u63A5\n- url\uFF1A\u76F4\u63A5\u7ED9\u94FE\u63A5\n\n**\u6CE8\u610F**\uFF1A\u7ACB\u521B\u5546\u57CE\u7684 `item.szlcsc.com/datasheet/...html` \u662F\u7F51\u9875\u4E0D\u662F PDF\uFF0C\u4E14\u670D\u52A1\u7AEF\u8BF7\u6C42\u4F1A\u88AB\u5BF9\u65B9 WAF \u62E6\u622A\u3002\u9047\u5230\u8FD9\u7C7B\u94FE\u63A5\u5DE5\u5177\u4F1A\u5982\u5B9E\u62A5\u544A\uFF0C\u8BF7\u8BA9\u7528\u6237\u5728\u6D4F\u89C8\u5668\u91CC\u6253\u5F00\u3002`atta.szlcsc.com` \u7684\u76F4\u94FE\u548C\u591A\u6570\u539F\u5382\u94FE\u63A5\uFF08\u5982 ti.com\uFF09\u53EF\u4EE5\u6B63\u5E38\u4E0B\u8F7D\u3002",
    inputSchema: {
      type: "object",
      properties: {
        designator: { type: "string", description: "\u5F53\u524D\u539F\u7406\u56FE\u4E0A\u7684\u4F4D\u53F7\uFF0C\u5982 U1" },
        lcsc_id: { type: "string", description: "\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF0C\u5982 C347222" },
        url: { type: "string", description: "\u6570\u636E\u624B\u518C\u76F4\u94FE" },
        save_dir: { type: "string", description: `\u4FDD\u5B58\u76EE\u5F55\uFF0C\u9ED8\u8BA4 ${DEFAULT_DIR}` }
      }
    },
    handler: async (args, ctx2) => {
      const des = optionalString(args, "designator");
      const lcsc = optionalString(args, "lcsc_id");
      let url = optionalString(args, "url");
      let source = url ? "url" : "";
      if (!url && des) {
        const text = await ctx2.exec(FETCH_NETLIST_CODE, 9e4);
        if (!text) throw new Error("\u53D6\u4E0D\u5230\u7F51\u8868 \u2014\u2014 \u8BF7\u786E\u8BA4\u5F53\u524D\u6253\u5F00\u7684\u662F\u539F\u7406\u56FE");
        const hit = parseNetlist(text).components.find((c) => designatorOf(c).toUpperCase() === des.toUpperCase());
        if (!hit) return { error: `\u5F53\u524D\u539F\u7406\u56FE\u91CC\u6CA1\u6709\u4F4D\u53F7 ${des}` };
        url = hit.props.Datasheet;
        source = `\u4F4D\u53F7 ${designatorOf(hit)}\uFF08${hit.props["Manufacturer Part"] ?? ""}\uFF09`;
        if (!url) return { error: `\u5668\u4EF6 ${des} \u5728\u7F51\u8868\u91CC\u6CA1\u6709 Datasheet \u5B57\u6BB5`, part: hit.props["Manufacturer Part"] };
      }
      if (!url && lcsc) {
        const d = await ctx2.exec(
          `
					const hit = await eda.lib_Device.getByLcscIds([${JSON.stringify(lcsc)}]);
					if (!hit || !hit.length) return null;
					const d = await eda.lib_Device.get(hit[0].uuid, hit[0].libraryUuid);
					return d ? { props: d.property?.otherProperty ?? {} } : null;
				`,
          6e4
        );
        url = d?.props?.Datasheet;
        source = `\u7ACB\u521B\u7F16\u53F7 ${lcsc}`;
        if (!url) return { error: `\u5668\u4EF6\u5E93\u91CC ${lcsc} \u6CA1\u6709 Datasheet \u5B57\u6BB5` };
      }
      if (!url) throw new Error("\u8BF7\u7ED9\u51FA designator\u3001lcsc_id \u6216 url \u4E09\u8005\u4E4B\u4E00");
      const u = assertSafeUrl(url);
      const dir = optionalString(args, "save_dir") ?? DEFAULT_DIR;
      await mkdir2(dir, { recursive: true });
      const res = await fetch(u, {
        redirect: "follow",
        headers: { "User-Agent": "Mozilla/5.0 (compatible; eda-mcp/0.1)", Accept: "application/pdf,*/*" },
        signal: AbortSignal.timeout(12e4)
      });
      const ctype = res.headers.get("content-type") ?? "";
      if (!res.ok) return { error: `\u4E0B\u8F7D\u5931\u8D25 HTTP ${res.status}`, url: u.href, source };
      if (!/pdf/i.test(ctype)) {
        const isLcscPage = u.hostname.includes("item.szlcsc.com");
        return {
          error: "\u8BE5\u94FE\u63A5\u8FD4\u56DE\u7684\u4E0D\u662F PDF",
          content_type: ctype,
          url: u.href,
          source,
          hint: isLcscPage ? "\u8FD9\u662F\u7ACB\u521B\u5546\u57CE\u7684\u5668\u4EF6\u7F51\u9875\uFF0C\u4E0D\u662F\u6570\u636E\u624B\u518C\u6587\u4EF6\u672C\u8EAB\uFF0C\u800C\u4E14\u670D\u52A1\u7AEF\u8BBF\u95EE\u4F1A\u88AB\u5BF9\u65B9 WAF \u62E6\u622A\u3002\u8BF7\u8BA9\u7528\u6237\u5728\u6D4F\u89C8\u5668\u91CC\u6253\u5F00\u8FD9\u4E2A\u94FE\u63A5\u67E5\u770B/\u4E0B\u8F7D\u3002" : "\u8BF7\u8BA9\u7528\u6237\u5728\u6D4F\u89C8\u5668\u6253\u5F00\u8BE5\u94FE\u63A5\u786E\u8BA4\uFF0C\u6216\u63D0\u4F9B PDF \u76F4\u94FE\u3002"
        };
      }
      const declared = Number(res.headers.get("content-length") ?? 0);
      if (declared > MAX_BYTES) {
        return { error: `\u6587\u4EF6\u8FC7\u5927\uFF08${(declared / 1048576).toFixed(1)} MB\uFF0C\u4E0A\u9650 50 MB\uFF09`, url: u.href };
      }
      const name = safeFileName(u, res.headers.get("content-disposition"));
      const path = resolve(dir, name);
      if (!res.body) return { error: "\u54CD\u5E94\u6CA1\u6709\u5185\u5BB9", url: u.href };
      await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
      const st = await stat(path);
      if (st.size > MAX_BYTES) {
        await unlink(path);
        return { error: `\u6587\u4EF6\u8D85\u8FC7 50 MB \u4E0A\u9650\uFF0C\u5DF2\u5220\u9664`, url: u.href };
      }
      return {
        ok: true,
        saved_path: path,
        size_kb: Math.round(st.size / 1024),
        source,
        url: u.href,
        next: "\u53EF\u7528\u8BFB PDF \u7684\u5DE5\u5177\u4ECE saved_path \u63D0\u53D6\u5F15\u811A\u5B9A\u4E49\u3001\u7535\u6C14\u53C2\u6570\u7B49\u5185\u5BB9\u3002"
      };
    }
  }
];

// src/layout/model.ts
var GRID = 10;
var FAN_BASE = 40;
var FAN_STEP = 50;
var FLAG_LONG = 45;
var FLAG_WIDE = 40;
var LABEL_SLOTS = [
  { name: "\u4E0A", fx: 0, fy: 1 },
  { name: "\u4E0B", fx: 0, fy: -1 },
  { name: "\u53F3", fx: 1, fy: 0 },
  { name: "\u5DE6", fx: -1, fy: 0 },
  { name: "\u53F3\u4E0A", fx: 1, fy: 1 },
  { name: "\u5DE6\u4E0A", fx: -1, fy: 1 },
  { name: "\u53F3\u4E0B", fx: 1, fy: -1 },
  { name: "\u5DE6\u4E0B", fx: -1, fy: -1 }
];
var LABEL_GAP = 12;
function labelWorld(part, pl, index) {
  const label = part.labels?.[index];
  if (!label) return { x: pl.x, y: pl.y };
  const slotIdx = pl.labelSlots?.[index];
  if (slotIdx == null) {
    return { x: pl.x + label.dx, y: pl.y + label.dy };
  }
  const slot = LABEL_SLOTS[slotIdx % LABEL_SLOTS.length];
  const swap = pl.rot === 90 || pl.rot === 270;
  const halfW = (swap ? part.h : part.w) / 2;
  const halfH = (swap ? part.w : part.h) / 2;
  return {
    x: pl.x + slot.fx * (halfW + LABEL_GAP),
    y: pl.y + slot.fy * (halfH + LABEL_GAP)
  };
}
function pinWorld(part, pl, pin) {
  const { dx, dy } = pin;
  const rad = pl.rot * Math.PI / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  let rx = dx * cos - dy * sin;
  const ry = dx * sin + dy * cos;
  let dir = ((pin.dir + pl.rot) % 360 + 360) % 360;
  if (pl.mirror) {
    rx = -rx;
    dir = (180 - dir + 360) % 360;
  }
  return { x: pl.x + rx, y: pl.y + ry, dir };
}
function partBox(part, pl) {
  const swap = pl.rot === 90 || pl.rot === 270;
  const w = swap ? part.h : part.w;
  const h = swap ? part.w : part.h;
  return { minX: pl.x - w / 2, minY: pl.y - h / 2, maxX: pl.x + w / 2, maxY: pl.y + h / 2 };
}
function effectiveBox(part, pl) {
  const box = partBox(part, pl);
  const stubs = part.stubPins ?? [];
  if (!stubs.length) return box;
  const groups = /* @__PURE__ */ new Map();
  for (const pid of stubs) {
    const pin = part.pins.find((q) => q.id === pid);
    if (!pin) continue;
    const w = pinWorld(part, pl, pin);
    const [vx, vy] = dirVec(w.dir);
    const k = `${vx},${vy}`;
    groups.set(k, [...groups.get(k) ?? [], { x: w.x, y: w.y, vx, vy }]);
  }
  let { minX, minY, maxX, maxY } = box;
  for (const list of groups.values()) {
    const horizontal = (list[0]?.vx ?? 0) !== 0;
    list.sort((a, b) => horizontal ? a.y - b.y : a.x - b.x);
    list.forEach((g, idx) => {
      const len = FAN_BASE + idx * FAN_STEP;
      const ex = g.x + g.vx * len;
      const ey = g.y + g.vy * len;
      const along = FLAG_LONG;
      const wide = FLAG_WIDE / 2;
      const x0 = Math.min(g.x, ex + g.vx * along) - (horizontal ? 0 : wide);
      const x1 = Math.max(g.x, ex + g.vx * along) + (horizontal ? 0 : wide);
      const y0 = Math.min(g.y, ey + g.vy * along) - (horizontal ? wide : 0);
      const y1 = Math.max(g.y, ey + g.vy * along) + (horizontal ? wide : 0);
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x1);
      maxY = Math.max(maxY, y1);
    });
  }
  return { minX, minY, maxX, maxY };
}
function overlapArea(a, b) {
  const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const h = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  return w > 0 && h > 0 ? w * h : 0;
}
function dirVec(dir) {
  if (dir === 0) return [1, 0];
  if (dir === 90) return [0, 1];
  if (dir === 180) return [-1, 0];
  return [0, -1];
}
var snap = (v) => Math.round(v / GRID) * GRID;
function pinLocal(pl, world, id) {
  let rx = world.x - pl.x;
  const ry = world.y - pl.y;
  let dir = world.dir;
  if (pl.mirror) {
    rx = -rx;
    dir = (180 - dir + 360) % 360;
  }
  const rad = -pl.rot * Math.PI / 180;
  const cos = Math.round(Math.cos(rad));
  const sin = Math.round(Math.sin(rad));
  const dx = rx * cos - ry * sin;
  const dy = rx * sin + ry * cos;
  return { id, dx, dy, dir: ((dir - pl.rot) % 360 + 360) % 360 };
}

// src/layout/cost.ts
var MIN_GAP = 60;
var DEFAULT_WEIGHTS = {
  partOverlap: 8,
  // 文字压在一起比线长几个单位严重得多，权重要压过 wireLength
  textOverlap: 20,
  wireLength: 1,
  crossing: 400,
  pinFacing: 250,
  netSpread: 0.3,
  tooClose: 6,
  // 「电源在上、地在下」是原理图最强的视觉约定，值得给个不低的权重，
  // 让退火主动把器件转到地脚朝下的姿势，而不是事后硬掰符号方向。
  supplyDir: 60,
  // 占地面积。单位是「格数」，一个 600x400 的块约合 24 格，
  // 权重 4 意味着多占一格约等于多走 4 个单位线长 —— 够把器件收拢，又不至于挤成一堆
  // （挤过头会被 tooClose 拦住）。缺了这一项，组内网络少时器件会散得到处都是：
  // 实测 3 个器件的电源区占到 749x629，组框直接顶出图纸。
  spread: 4,
  // 芯片朝向。要压得过「转一下能省点线长」的诱惑：一条线通常几十到几百
  // 单位，而转 90° 只罚 2×150=300，足以让退火老实待着；真到了不转就摆不下
  // 的地步，几百的收益仍然能翻盘 —— 这是软约束，不是禁令。
  chipRotation: 150
};
function gapBetween(a, b) {
  const gx = Math.max(a.minX - b.maxX, b.minX - a.maxX);
  const gy = Math.max(a.minY - b.maxY, b.minY - a.maxY);
  return Math.max(gx, gy);
}
function labelBox(text, x, y, fontSize = 7) {
  let w = 0;
  for (let i = 0; i < text.length; i++) w += text.charCodeAt(i) > 127 ? fontSize : fontSize * 0.6;
  return { minX: x, minY: y - fontSize / 2, maxX: x + w, maxY: y + fontSize / 2 };
}
function segCross(a1, a2, b1, b2) {
  const d = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = d(b1, b2, a1);
  const d2 = d(b1, b2, a2);
  const d3 = d(a1, a2, b1);
  const d4 = d(a1, a2, b2);
  return (d1 > 0 && d2 < 0 || d1 < 0 && d2 > 0) && (d3 > 0 && d4 < 0 || d3 < 0 && d4 > 0);
}
function evaluate(parts, nets, layout, weights = DEFAULT_WEIGHTS) {
  const ids = [...parts.keys()];
  const boxes = /* @__PURE__ */ new Map();
  const bodies = /* @__PURE__ */ new Map();
  for (const id of ids) {
    const p = parts.get(id);
    const pl = layout.get(id);
    if (!p || !pl) continue;
    boxes.set(id, effectiveBox(p, pl));
    bodies.set(id, partBox(p, pl));
  }
  let partOverlap = 0;
  let tooClose = 0;
  for (let i = 0; i < ids.length; i++) {
    const a = boxes.get(ids[i]);
    if (!a) continue;
    for (let j = i + 1; j < ids.length; j++) {
      const b = boxes.get(ids[j]);
      if (!b) continue;
      partOverlap += overlapArea(a, b);
      const gap = gapBetween(a, b);
      if (gap >= 0 && gap < MIN_GAP) tooClose += MIN_GAP - gap;
    }
  }
  const texts = [];
  for (const id of ids) {
    const p = parts.get(id);
    const pl = layout.get(id);
    if (!p || !pl) continue;
    (p.labels ?? []).forEach((l, i) => {
      const w = labelWorld(p, pl, i);
      const b = labelBox(l.text, w.x, w.y);
      const halfW = (b.maxX - b.minX) / 2;
      texts.push({ minX: b.minX - halfW, maxX: b.maxX - halfW, minY: b.minY, maxY: b.maxY });
    });
  }
  let textOverlap = 0;
  for (let i = 0; i < texts.length; i++) {
    const t = texts[i];
    for (let j = i + 1; j < texts.length; j++) textOverlap += overlapArea(t, texts[j]);
    for (const id of ids) {
      const b = bodies.get(id);
      if (b) textOverlap += overlapArea(t, b);
    }
  }
  let spread = 0;
  {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const b of boxes.values()) {
      minX = Math.min(minX, b.minX);
      minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX);
      maxY = Math.max(maxY, b.maxY);
    }
    if (Number.isFinite(minX)) {
      const w = maxX - minX;
      const h = maxY - minY;
      const area = w / 100 * (h / 100);
      const aspectPenalty = Math.abs(w - h * 1.4) / 100;
      spread = area + aspectPenalty * 3;
    }
  }
  let supplyDir = 0;
  for (const id of ids) {
    const p = parts.get(id);
    const pl = layout.get(id);
    if (!p || !pl) continue;
    for (const pid of p.stubPins ?? []) {
      const pin = p.pins.find((q) => q.id === pid);
      if (!pin) continue;
      const w = pinWorld(p, pl, pin);
      const want = (p.stubUp ?? []).includes(pid) ? 90 : 270;
      if (w.dir !== want) supplyDir += w.dir === (want + 180) % 360 ? 2 : 1;
    }
  }
  let chipRotation = 0;
  for (const id of ids) {
    const p = parts.get(id);
    const pl = layout.get(id);
    if (!p || !pl || p.pins.length < 3) continue;
    if (pl.rot === 90 || pl.rot === 270) chipRotation += 2;
    else if (pl.rot === 180) chipRotation += 1;
    if (pl.mirror) chipRotation += 1;
  }
  const pinPos = (ref) => {
    const dot = ref.lastIndexOf(".");
    if (dot <= 0) return null;
    const part = parts.get(ref.slice(0, dot));
    const pl = layout.get(ref.slice(0, dot));
    if (!part || !pl) return null;
    const pin = part.pins.find((q) => q.id === ref.slice(dot + 1));
    return pin ? pinWorld(part, pl, pin) : null;
  };
  let wireLength = 0;
  let netSpread = 0;
  let pinFacing = 0;
  const segments = [];
  for (const net of nets) {
    const pts = net.pins.map(pinPos).filter((q) => q != null);
    if (pts.length < 2) continue;
    const used = [0];
    const rest = pts.map((_, i) => i).slice(1);
    while (rest.length) {
      let best = Infinity;
      let bi = 0;
      let bu = 0;
      for (const u of used) {
        const pu2 = pts[u];
        for (let k = 0; k < rest.length; k++) {
          const pv2 = pts[rest[k]];
          const d = Math.abs(pu2.x - pv2.x) + Math.abs(pu2.y - pv2.y);
          if (d < best) {
            best = d;
            bi = k;
            bu = u;
          }
        }
      }
      const v = rest[bi];
      const pu = pts[bu];
      const pv = pts[v];
      wireLength += best;
      segments.push([
        [pu.x, pu.y],
        [pv.x, pv.y]
      ]);
      for (const [from, to] of [
        [pu, pv],
        [pv, pu]
      ]) {
        const [vx, vy] = dirVec(from.dir);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.abs(dx) + Math.abs(dy) || 1;
        const align = (vx * dx + vy * dy) / len;
        if (align < 0) pinFacing += -align;
      }
      used.push(v);
      rest.splice(bi, 1);
    }
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    netSpread += Math.max(...xs) - Math.min(...xs) + (Math.max(...ys) - Math.min(...ys));
  }
  let crossing = 0;
  for (let i = 0; i < segments.length; i++) {
    const si = segments[i];
    if (!si) continue;
    for (let j = i + 1; j < segments.length; j++) {
      const sj = segments[j];
      if (sj && segCross(si[0], si[1], sj[0], sj[1])) crossing += 1;
    }
  }
  const total = weights.partOverlap * partOverlap + weights.textOverlap * textOverlap + weights.wireLength * wireLength + weights.crossing * crossing + weights.pinFacing * pinFacing + weights.netSpread * netSpread + weights.tooClose * tooClose + weights.supplyDir * supplyDir + weights.chipRotation * chipRotation + weights.spread * spread;
  return { total, partOverlap, textOverlap, wireLength, crossing, pinFacing, netSpread, tooClose, supplyDir, spread, chipRotation };
}

// src/layout/anneal.ts
function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}
var ROTS = [0, 90, 180, 270];
function anneal(parts, nets, initial, opts = {}) {
  const {
    iterations = 2e4,
    startTemp = 2e3,
    endTemp = 1,
    maxShiftGrids = 6,
    weights = DEFAULT_WEIGHTS,
    seed = 12345,
    bounds,
    onProgress
  } = opts;
  const rng = makeRng(seed);
  const movable = [...parts.keys()].filter((id) => !parts.get(id)?.fixed);
  if (!movable.length) {
    const c = evaluate(parts, nets, initial, weights);
    return { layout: initial, cost: c, initialCost: c, iterations: 0, accepted: 0 };
  }
  const cur = /* @__PURE__ */ new Map();
  for (const [k, v] of initial) {
    const p = parts.get(k);
    const n = p?.labels?.length ?? 0;
    cur.set(k, { ...v, labelSlots: v.labelSlots ? [...v.labelSlots] : new Array(n).fill(0) });
  }
  let curCost = evaluate(parts, nets, cur, weights);
  const initialCost = curCost;
  let best = new Map([...cur].map(([k, v]) => [k, { ...v }]));
  let bestCost = curCost;
  let accepted = 0;
  const clamp = (pl) => {
    if (!bounds) return pl;
    return {
      ...pl,
      x: Math.min(Math.max(pl.x, bounds.minX), bounds.maxX),
      y: Math.min(Math.max(pl.y, bounds.minY), bounds.maxY)
    };
  };
  for (let i = 0; i < iterations; i++) {
    const temp = startTemp * Math.pow(endTemp / startTemp, i / iterations);
    const id = movable[Math.floor(rng() * movable.length)];
    const old = cur.get(id);
    if (!old) continue;
    const before = { ...old };
    const move = rng();
    const labelCount = parts.get(id)?.labels?.length ?? 0;
    if (labelCount && move < 0.15) {
      const slots = [...before.labelSlots ?? new Array(labelCount).fill(0)];
      const which = Math.floor(rng() * labelCount);
      slots[which] = Math.floor(rng() * LABEL_SLOTS.length);
      cur.set(id, { ...before, labelSlots: slots });
    } else if (move < 0.6) {
      const scale = Math.max(1, Math.round(maxShiftGrids * temp / startTemp));
      const dx = (Math.floor(rng() * (2 * scale + 1)) - scale) * GRID;
      const dy = (Math.floor(rng() * (2 * scale + 1)) - scale) * GRID;
      cur.set(id, clamp({ ...before, x: snap(before.x + dx), y: snap(before.y + dy) }));
    } else if (move < 0.82) {
      cur.set(id, { ...before, rot: ROTS[Math.floor(rng() * 4)] });
    } else if (move < 0.9) {
      cur.set(id, { ...before, mirror: !before.mirror });
    } else {
      const other = movable[Math.floor(rng() * movable.length)];
      const op = cur.get(other);
      if (!op || other === id) continue;
      cur.set(id, clamp({ ...before, x: op.x, y: op.y }));
      cur.set(other, clamp({ ...op, x: before.x, y: before.y }));
      const cost2 = evaluate(parts, nets, cur, weights);
      const delta2 = cost2.total - curCost.total;
      if (delta2 <= 0 || rng() < Math.exp(-delta2 / temp)) {
        curCost = cost2;
        accepted += 1;
        if (cost2.total < bestCost.total) {
          bestCost = cost2;
          best = new Map([...cur].map(([k, v]) => [k, { ...v }]));
        }
      } else {
        cur.set(id, before);
        cur.set(other, op);
      }
      if (onProgress && i % 500 === 0) onProgress(i, curCost.total, temp);
      continue;
    }
    const cost = evaluate(parts, nets, cur, weights);
    const delta = cost.total - curCost.total;
    if (delta <= 0 || rng() < Math.exp(-delta / temp)) {
      curCost = cost;
      accepted += 1;
      if (cost.total < bestCost.total) {
        bestCost = cost;
        best = new Map([...cur].map(([k, v]) => [k, { ...v }]));
      }
    } else {
      cur.set(id, before);
    }
    if (onProgress && i % 500 === 0) onProgress(i, curCost.total, temp);
  }
  return { layout: best, cost: bestCost, initialCost, iterations, accepted };
}

// src/layout/route.ts
var key = (x, y) => x / GRID * 1e5 + y / GRID;
var Heap = class {
  a = [];
  push(f, v) {
    this.a.push({ f, v });
    let i = this.a.length - 1;
    while (i > 0) {
      const p = i - 1 >> 1;
      if (this.a[p].f <= f) break;
      this.a[i] = this.a[p];
      i = p;
    }
    this.a[i] = { f, v };
  }
  pop() {
    const top = this.a[0];
    const last = this.a.pop();
    if (this.a.length && last) {
      let i = 0;
      for (; ; ) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.a.length && this.a[l].f < (m === i ? last.f : this.a[m].f)) m = l;
        if (r < this.a.length && this.a[r].f < (m === i ? last.f : this.a[m].f)) m = r;
        if (m === i) break;
        this.a[i] = this.a[m];
        i = m;
      }
      this.a[i] = last;
    }
    return top;
  }
  get size() {
    return this.a.length;
  }
};
var DIRS = [
  [GRID, 0],
  [-GRID, 0],
  [0, GRID],
  [0, -GRID]
];
function route(parts, nets, layout, opts = {}) {
  const { clearance = 10, maxExpand = 6e4, obstacles = [] } = opts;
  let bMinX = Infinity;
  let bMinY = Infinity;
  let bMaxX = -Infinity;
  let bMaxY = -Infinity;
  for (const [id, pl] of layout) {
    const p = parts.get(id);
    if (!p) continue;
    const b = partBox(p, pl);
    bMinX = Math.min(bMinX, b.minX);
    bMinY = Math.min(bMinY, b.minY);
    bMaxX = Math.max(bMaxX, b.maxX);
    bMaxY = Math.max(bMaxY, b.maxY);
  }
  const pad = 200;
  const bounds = opts.bounds ?? {
    minX: Math.floor((bMinX - pad) / GRID) * GRID,
    minY: Math.floor((bMinY - pad) / GRID) * GRID,
    maxX: Math.ceil((bMaxX + pad) / GRID) * GRID,
    maxY: Math.ceil((bMaxY + pad) / GRID) * GRID
  };
  const blocked = /* @__PURE__ */ new Set();
  for (const [id, pl] of layout) {
    const p = parts.get(id);
    if (!p) continue;
    const b = partBox(p, pl);
    const x0 = Math.floor((b.minX - clearance) / GRID) * GRID;
    const x1 = Math.ceil((b.maxX + clearance) / GRID) * GRID;
    const y0 = Math.floor((b.minY - clearance) / GRID) * GRID;
    const y1 = Math.ceil((b.maxY + clearance) / GRID) * GRID;
    for (let x = x0; x <= x1; x += GRID) for (let y = y0; y <= y1; y += GRID) blocked.add(key(x, y));
  }
  for (const o of obstacles) {
    const x0 = Math.floor((o.minX - clearance) / GRID) * GRID;
    const x1 = Math.ceil((o.maxX + clearance) / GRID) * GRID;
    const y0 = Math.floor((o.minY - clearance) / GRID) * GRID;
    const y1 = Math.ceil((o.maxY + clearance) / GRID) * GRID;
    for (let x = x0; x <= x1; x += GRID) for (let y = y0; y <= y1; y += GRID) blocked.add(key(x, y));
  }
  const pinCells = /* @__PURE__ */ new Map();
  const pinExact = /* @__PURE__ */ new Map();
  const pinAt = /* @__PURE__ */ new Map();
  for (const [id, pl] of layout) {
    const p = parts.get(id);
    if (!p) continue;
    for (const pin of p.pins) {
      const w = pinWorld(p, pl, pin);
      const gx = Math.round(w.x / GRID) * GRID;
      const gy = Math.round(w.y / GRID) * GRID;
      const ref = `${id}.${pin.id}`;
      pinCells.set(ref, { x: gx, y: gy, dir: w.dir });
      pinExact.set(ref, { x: w.x, y: w.y });
      pinAt.set(key(gx, gy), ref);
      blocked.delete(key(gx, gy));
      const [vx, vy] = dirVec(w.dir);
      blocked.delete(key(gx + vx * GRID, gy + vy * GRID));
    }
  }
  const occupied = /* @__PURE__ */ new Map();
  const result = [];
  let totalLength = 0;
  let totalBends = 0;
  let failedCount = 0;
  for (const net of nets) {
    const endpoints = net.pins.map((ref) => ({ ref, cell: pinCells.get(ref) })).filter((e) => e.cell != null);
    if (endpoints.length < 2) continue;
    const paths = [];
    const failed = [];
    const ownPins = new Set(net.pins);
    const connected = /* @__PURE__ */ new Set([key(endpoints[0].cell.x, endpoints[0].cell.y)]);
    for (let i = 1; i < endpoints.length; i++) {
      const target = endpoints[i];
      const goal = key(target.cell.x, target.cell.y);
      if (connected.has(goal)) continue;
      const open = new Heap();
      const gScore = /* @__PURE__ */ new Map();
      const cameFrom = /* @__PURE__ */ new Map();
      const start = goal;
      gScore.set(start, 0);
      const conn = [...connected].map((k) => ({ x: Math.floor(k / 1e5) * GRID, y: k % 1e5 * GRID }));
      const h = (x, y) => {
        let m = Infinity;
        for (const c of conn) m = Math.min(m, Math.abs(x - c.x) + Math.abs(y - c.y));
        return m;
      };
      open.push(h(target.cell.x, target.cell.y), start);
      let found = null;
      let expanded = 0;
      while (open.size && expanded < maxExpand) {
        const cur2 = open.pop();
        if (!cur2) break;
        const cx = Math.floor(cur2.v / 1e5) * GRID;
        const cy = cur2.v % 1e5 * GRID;
        if (connected.has(cur2.v) && cur2.v !== start) {
          found = cur2.v;
          break;
        }
        expanded += 1;
        const g = gScore.get(cur2.v) ?? Infinity;
        const prev = cameFrom.get(cur2.v);
        for (const [dx, dy] of DIRS) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < bounds.minX || nx > bounds.maxX || ny < bounds.minY || ny > bounds.maxY) continue;
          const nk = key(nx, ny);
          if (blocked.has(nk) && !connected.has(nk)) continue;
          const pinHere = pinAt.get(nk);
          if (pinHere && !ownPins.has(pinHere)) continue;
          let step = GRID;
          if (prev != null) {
            const px = Math.floor(prev / 1e5) * GRID;
            const py = prev % 1e5 * GRID;
            if (px - cx === 0 !== (cx - nx === 0)) step += GRID * 2;
          }
          const owner = occupied.get(nk);
          if (owner && owner !== net.id) step += GRID * 40;
          const ng = g + step;
          if (ng < (gScore.get(nk) ?? Infinity)) {
            gScore.set(nk, ng);
            cameFrom.set(nk, cur2.v);
            open.push(ng + h(nx, ny), nk);
          }
        }
      }
      if (found == null) {
        failed.push(target.ref);
        failedCount += 1;
        continue;
      }
      const cells = [];
      let cur = found;
      while (cur != null) {
        cells.push(cur);
        cur = cameFrom.get(cur);
      }
      const raw = cells.map((k) => [Math.floor(k / 1e5) * GRID, k % 1e5 * GRID]);
      const poly = [];
      for (let k = 0; k < raw.length; k++) {
        const a = raw[k - 1];
        const b = raw[k];
        const c = raw[k + 1];
        if (!a || !c) {
          poly.push(b);
          continue;
        }
        const collinear = a[0] === b[0] && b[0] === c[0] || a[1] === b[1] && b[1] === c[1];
        if (!collinear) poly.push(b);
      }
      const stitch = (grid, ex) => {
        const seg = [];
        if (grid[0] !== ex.x && grid[1] !== ex.y) seg.push([ex.x, grid[1]]);
        seg.push([ex.x, ex.y]);
        return seg;
      };
      const tailExact = pinExact.get(target.ref);
      const tail = poly[poly.length - 1];
      if (tailExact && tail && (tail[0] !== tailExact.x || tail[1] !== tailExact.y)) {
        poly.push(...stitch(tail, tailExact));
      }
      const headRef = pinAt.get(found);
      const headExact = headRef && ownPins.has(headRef) ? pinExact.get(headRef) : void 0;
      const head = poly[0];
      if (headExact && head && (head[0] !== headExact.x || head[1] !== headExact.y)) {
        poly.unshift(...stitch(head, headExact).reverse());
      }
      paths.push(poly);
      totalBends += Math.max(0, poly.length - 2);
      for (let k = 1; k < raw.length; k++) {
        const a = raw[k - 1];
        const b = raw[k];
        totalLength += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
      }
      for (const k of cells) {
        connected.add(k);
        occupied.set(k, net.id);
      }
    }
    result.push({ netId: net.id, paths, failed });
  }
  return { nets: result, totalLength, totalBends, failedCount };
}

// src/layout/optimize.ts
function scoreOf(cost, routed) {
  return routed.failedCount * 1e5 + cost.partOverlap * 8 + cost.textOverlap * 20 + cost.crossing * 400 + routed.totalLength * 1 + routed.totalBends * 30;
}
function optimize(parts, nets, initial, opts = {}) {
  const {
    rounds = 8,
    patience = 3,
    iterations = 3e4,
    bounds,
    weights = DEFAULT_WEIGHTS,
    seed = 1,
    onRound
  } = opts;
  let best = null;
  let stale = 0;
  const history = [];
  for (let r = 0; r < rounds; r++) {
    const w = { ...weights, tooClose: weights.tooClose * (1 + r * 0.25) };
    const from = best ? best.layout : initial;
    const a = anneal(parts, nets, from, { iterations, bounds, weights: w, seed: seed + r * 977 });
    const routed = route(parts, nets, a.layout);
    const cost = evaluate(parts, nets, a.layout, weights);
    const score = scoreOf(cost, routed);
    history.push({
      round: r + 1,
      score,
      wireLength: routed.totalLength,
      bends: routed.totalBends,
      failed: routed.failedCount
    });
    if (onRound) {
      onRound(r + 1, score, `\u7EBF\u957F ${routed.totalLength} \u62D0\u5F2F ${routed.totalBends} \u5931\u8D25 ${routed.failedCount}`);
    }
    if (!best || score < best.score) {
      best = { layout: a.layout, routed, cost, score, rounds: r + 1, history };
      stale = 0;
    } else {
      stale += 1;
      if (stale >= patience) break;
    }
  }
  if (!best) {
    const routed = route(parts, nets, initial);
    const cost = evaluate(parts, nets, initial, weights);
    best = { layout: initial, routed, cost, score: scoreOf(cost, routed), rounds: 0, history };
  }
  best.history = history;
  return best;
}

// src/tools/layout-tool.ts
var ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
var layoutTools = [
  {
    name: "eda_optimize_layout",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u91CD\u65B0\u6446\u653E\u5668\u4EF6\u5E76\u91CD\u65B0\u8D70\u7EBF\uFF0C\u76EE\u6807\u662F**\u4EBA\u80FD\u770B\u61C2**\uFF1A\u5668\u4EF6\u4E0D\u91CD\u53E0\u3001\u6587\u5B57\u4E0D\u91CD\u53E0\u3001\u8FDE\u7EBF\u77ED\u3001\u4EA4\u53C9\u5C11\u3001\u62D0\u5F2F\u5C11\u3001\u8BE5\u7AD6\u653E\u7684\u7AD6\u653E\u3002\n\n\u8FD9\u662F\u81EA\u5EFA\u7684\u5E03\u5C40\u5668\uFF0C\u4E0D\u662F EDA \u81EA\u5E26\u7684 \u2014\u2014 EDA \u7684 autoLayout \u53EA\u6309\u8FDE\u63A5\u5173\u7CFB\u6392\uFF0C\u4ECE\u4E0D\u65CB\u8F6C\u5668\u4EF6\uFF08\u6240\u4EE5\u56FE\u4E0A\u6C38\u8FDC\u53EA\u6709\u6A2A\u6392\uFF09\uFF0C\u4E5F\u4E0D\u7BA1\u6587\u5B57\u91CD\u53E0\uFF1B\u5B83\u7684 autoRouting \u8FD8\u4F1A\u628A\u5BFC\u7EBF\u4ECE\u5F15\u811A\u4E0A\u626F\u6389\u3002\n\n\u505A\u6CD5\uFF1A\u6A21\u62DF\u9000\u706B\u51B3\u5B9A\u6BCF\u4E2A\u5668\u4EF6\u7684\u4F4D\u7F6E\u4E0E\u671D\u5411\uFF08\u5E73\u79FB\uFF0F\u8F6C\u89D2\uFF0F\u7FFB\u9762\uFF0F\u4EA4\u6362\uFF09\uFF0CA\\* \u5728\u7F51\u683C\u4E0A\u8D70\u6B63\u4EA4\u7EBF\uFF08\u62D0\u5F2F\u7F5A\u5206\u3001\u538B\u522B\u7684\u7F51\u7EDC\u91CD\u7F5A\u3001\u540C\u7F51\u7EDC\u7684\u7EBF\u53EF\u5171\u7528\u6210 T \u578B\u5206\u652F\uFF09\uFF0C\u4E24\u8005\u4EA4\u66FF\u8FED\u4EE3\u82E5\u5E72\u8F6E\uFF0C\u7528**\u771F\u5B9E\u5E03\u7EBF\u7ED3\u679C**\u6253\u5206\u7559\u6700\u597D\u7684\u4E00\u8F6E\u3002\n\n**\u4F60\u53EA\u9700\u8981\u7ED9\u51FA\u7F51\u7EDC\u8868**\uFF08\u54EA\u4E2A\u811A\u8FDE\u54EA\u4E2A\u811A\uFF09\u548C\u5927\u81F4\u7684\u6446\u653E\uFF0C\u4F4D\u7F6E\u548C\u89D2\u5EA6\u4EA4\u7ED9\u5B83\u3002\u628A\u63A5\u53E3\u8FDE\u63A5\u5668\u4E4B\u7C7B\u5FC5\u987B\u9489\u5728\u56FA\u5B9A\u4F4D\u7F6E\u7684\u5668\u4EF6\u586B\u8FDB keep_fixed\u3002\n\n\u6CE8\u610F\u5B83\u4F1A\u6E05\u6389\u5F53\u524D\u9875\u7684\u5BFC\u7EBF\u91CD\u753B\u3002\u7535\u6E90\u4E0E\u5730\u4E0D\u8981\u653E\u8FDB nets \u2014\u2014 \u90A3\u4E9B\u8BE5\u7528\u7B26\u53F7\uFF0C\u653E\u8FDB\u6765\u4F1A\u628A\u6240\u6709\u5668\u4EF6\u62C9\u5230\u4E00\u8D77\u3002",
    inputSchema: {
      type: "object",
      properties: {
        nets: {
          type: "object",
          description: '{ \u7F51\u7EDC\u540D: ["\u4F4D\u53F7.\u5F15\u811A\u53F7", \u2026] }\uFF0C\u4E0E eda_arrange_block \u540C\u683C\u5F0F\u3002\u53EA\u653E\u4FE1\u53F7\u7F51\u3002',
          additionalProperties: { type: "array", items: { type: "string" } }
        },
        power_nets: {
          type: "object",
          description: '\u7535\u6E90\u4E0E\u5730\u7F51\u7EDC\uFF1A{ "GND": ["U1.1","C1.1"], "+5V": ["U1.3"] }\u3002\u8FD9\u4E9B\u7F51\u7EDC\u4E0D\u53C2\u4E0E\u5E03\u7EBF\uFF08\u5B83\u4EEC\u8BE5\u7528\u7B26\u53F7\u8868\u8FBE\uFF09\uFF0C\u4F46\u5DE5\u5177\u4F1A\u4E3A\u6BCF\u4E2A\u5F15\u811A**\u9884\u7559\u7B26\u53F7\u4F4D\u7F6E**\uFF0C\u5E76\u5728\u5199\u56DE\u65F6\u81EA\u52A8\u628A\u7B26\u53F7\u653E\u4E0A\u53BB\u3002\u4E0D\u4F20\u7684\u8BDD\u5E03\u5C40\u4E00\u6536\u7D27\uFF0C\u7B26\u53F7\u5C31\u4F1A\u538B\u5728\u90BB\u8FD1\u5668\u4EF6\u4E0A \u2014\u2014 \u5B9E\u6D4B\u6F0F\u6389\u8FD9\u4E00\u6B65\uFF0C\u4E09\u4E2A\u7535\u5BB9\u5404\u88AB GND \u7B26\u53F7\u538B\u4F4F\u4E00\u5757\u3002',
          additionalProperties: { type: "array", items: { type: "string" } }
        },
        keep_fixed: {
          type: "array",
          items: { type: "string" },
          description: '\u4F4D\u7F6E\u9501\u6B7B\u3001\u4E0D\u53C2\u4E0E\u4F18\u5316\u7684\u4F4D\u53F7\uFF0C\u5982 ["RJ1","RF1"]'
        },
        bounds: {
          type: "object",
          description: "\u5141\u8BB8\u6446\u653E\u7684\u77E9\u5F62\u8303\u56F4\uFF080.01 inch\uFF09\uFF0C\u4E0D\u7ED9\u5219\u7528\u56FE\u7EB8\u5C3A\u5BF8\u7559\u8FB9",
          properties: {
            minX: { type: "number" },
            minY: { type: "number" },
            maxX: { type: "number" },
            maxY: { type: "number" }
          }
        },
        rounds: { type: "number", description: "\u8FED\u4EE3\u8F6E\u6570\uFF0C\u9ED8\u8BA4 8\u3002\u8D8A\u591A\u8D8A\u597D\u4F46\u8D8A\u6162" },
        iterations: { type: "number", description: "\u6BCF\u8F6E\u9000\u706B\u8FED\u4EE3\u6B21\u6570\uFF0C\u9ED8\u8BA4 30000" },
        dry_run: { type: "boolean", description: "\u53EA\u7B97\u4E0D\u5199\uFF0C\u7528\u6765\u5148\u770B\u770B\u80FD\u4F18\u5316\u5230\u4EC0\u4E48\u7A0B\u5EA6" }
      },
      required: ["nets"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const netsIn = args.nets && typeof args.nets === "object" ? args.nets : {};
      const powerIn = args.power_nets && typeof args.power_nets === "object" ? args.power_nets : {};
      const stubOf = /* @__PURE__ */ new Map();
      const stubUpOf = /* @__PURE__ */ new Map();
      const flagKind = /* @__PURE__ */ new Map();
      const isGroundNet = (n) => {
        const u = n.toUpperCase();
        return ["GND", "AGND", "DGND", "PGND", "SGND", "VSS", "VEE", "GNDA", "GNDD", "EARTH"].includes(u);
      };
      for (const [net, refs] of Object.entries(powerIn)) {
        for (const ref of Array.isArray(refs) ? refs : []) {
          const dot = String(ref).lastIndexOf(".");
          if (dot <= 0) continue;
          const des = String(ref).slice(0, dot).toUpperCase();
          const pin = String(ref).slice(dot + 1);
          if (!stubOf.has(des)) stubOf.set(des, []);
          stubOf.get(des)?.push(pin);
          if (!isGroundNet(net)) {
            if (!stubUpOf.has(des)) stubUpOf.set(des, []);
            stubUpOf.get(des)?.push(pin);
          }
          flagKind.set(`${des}.${pin}`, net);
        }
      }
      const fixed = new Set((Array.isArray(args.keep_fixed) ? args.keep_fixed : []).map((s) => String(s).toUpperCase()));
      const dryRun = args.dry_run === true;
      const rounds = typeof args.rounds === "number" ? args.rounds : 8;
      const iterations = typeof args.iterations === "number" ? args.iterations : 3e4;
      const snap2 = await ctx2.exec(
        `
				${ENSURE_SCH}
				const all = await eda.sch_PrimitiveComponent.getAll();
				const parts = [];
				for (const c of all) {
					if (c.componentType !== 'part') continue;
					const b = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => null);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					parts.push({
						des: String(c.designator || ''),
						id: c.primitiveId,
						x: c.x, y: c.y,
						rot: Number(c.rotation) || 0,
						mirror: c.mirror === true,
						w: b ? Math.max(10, b.maxX - b.minX) : 40,
						h: b ? Math.max(10, b.maxY - b.minY) : 40,
						pins: (pins || []).map((p) => ({
							n: String(p.pinNumber != null ? p.pinNumber : p.number),
							x: p.x, y: p.y, dir: Number(p.rotation) || 0,
						})),
						// \u4F4D\u53F7\u4E0E\u578B\u53F7\uFF1A\u4F4D\u7F6E\u6309 EDA \u9ED8\u8BA4\uFF08\u4F4D\u53F7\u5728\u4E0A\u3001\u578B\u53F7\u5728\u4E0B\uFF09\u4F30
						labels: [
							{ text: String(c.designator || ''), dx: -10, dy: (b ? (b.maxY - b.minY) / 2 : 20) + 8 },
							{ text: String(c.name || '').slice(0, 16), dx: -10, dy: -((b ? (b.maxY - b.minY) / 2 : 20) + 8) },
						].filter((l) => l.text),
					});
				}
				const tb = _page.titleBlockData || {};
				return {
					parts,
					sheet: {
						w: tb.Width && tb.Width.value ? Number(tb.Width.value) : 1170,
						h: tb.Height && tb.Height.value ? Number(tb.Height.value) : 825,
					},
				};
			`,
        12e4
      );
      if (snap2.error) return { error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875" };
      const raw = snap2.parts ?? [];
      if (!raw.length) return { error: "\u5F53\u524D\u9875\u6CA1\u6709\u5668\u4EF6" };
      const parts = /* @__PURE__ */ new Map();
      const initial = /* @__PURE__ */ new Map();
      const idOf = /* @__PURE__ */ new Map();
      for (const p of raw) {
        const pl = { x: p.x, y: p.y, rot: (p.rot % 360 + 360) % 360, mirror: p.mirror };
        parts.set(p.des, {
          id: p.des,
          w: p.w,
          h: p.h,
          fixed: fixed.has(p.des.toUpperCase()),
          labels: p.labels,
          stubPins: stubOf.get(p.des.toUpperCase()) ?? [],
          stubUp: stubUpOf.get(p.des.toUpperCase()) ?? [],
          pins: p.pins.map(
            (q) => pinLocal(pl, { x: q.x, y: q.y, dir: (q.dir % 360 + 360) % 360 }, q.n)
          )
        });
        initial.set(p.des, pl);
        idOf.set(p.des, p.id);
      }
      const nets = Object.entries(netsIn).map(([id, refs]) => ({ id, pins: (Array.isArray(refs) ? refs : []).map(String) })).filter((n) => n.pins.length >= 2);
      if (!nets.length) return { error: "nets \u91CC\u6CA1\u6709\u5305\u542B\u4E24\u4E2A\u53CA\u4EE5\u4E0A\u5F15\u811A\u7684\u7F51\u7EDC" };
      const sheet = snap2.sheet ?? { w: 1170, h: 825 };
      const margin = 120;
      const bounds = args.bounds ?? {
        minX: margin,
        minY: margin,
        maxX: sheet.w - margin,
        maxY: sheet.h - margin
      };
      const t0 = Date.now();
      const r = optimize(parts, nets, initial, { rounds, iterations, bounds });
      const elapsed = Date.now() - t0;
      const moves = [...r.layout].filter(([des]) => !fixed.has(des.toUpperCase())).map(([des, pl]) => ({ id: idOf.get(des), des, x: pl.x, y: pl.y, rotation: pl.rot, mirror: pl.mirror })).filter((m) => m.id);
      const wires = r.routed.nets.flatMap(
        (n) => n.paths.map((p) => ({ net: n.netId, points: p.flat() }))
      );
      const flags = [];
      for (const [ref, net] of flagKind) {
        const dot = ref.lastIndexOf(".");
        const des = ref.slice(0, dot);
        const part = parts.get(des);
        const pl = r.layout.get(des);
        if (!part || !pl) continue;
        const pin = part.pins.find((q) => q.id === ref.slice(dot + 1));
        if (!pin) continue;
        const w = pinWorld(part, pl, pin);
        const [vx, vy] = dirVec(w.dir);
        const L = 40;
        const ex = w.x + vx * L;
        const ey = w.y + vy * L;
        const rot = 0;
        flags.push({ net, x: w.x, y: w.y, ex, ey, rot });
      }
      const KIND = {};
      for (const net of Object.keys(powerIn)) {
        const u = net.toUpperCase();
        KIND[net] = u === "AGND" || u === "GNDA" ? "AnalogGround" : u === "PGND" || u === "EARTH" ? "ProtectGround" : ["GND", "DGND", "SGND", "VSS", "VEE", "GNDD"].includes(u) ? "Ground" : "Power";
      }
      const summary = {
        parts: parts.size,
        nets: nets.length,
        rounds: r.rounds,
        elapsed_ms: elapsed,
        wire_length: r.routed.totalLength,
        bends: r.routed.totalBends,
        unrouted: r.routed.failedCount,
        part_overlap: Math.round(r.cost.partOverlap),
        text_overlap: Math.round(r.cost.textOverlap),
        crossings: r.cost.crossing,
        rotated: [...r.layout.values()].filter((p) => p.rot === 90 || p.rot === 270).length,
        history: r.history
      };
      if (dryRun) {
        return { ...summary, dry_run: true, note: "\u53EA\u7B97\u4E86\u6CA1\u5199\u3002\u53BB\u6389 dry_run \u624D\u4F1A\u771F\u6B63\u843D\u5230\u56FE\u4E0A\u3002" };
      }
      const applied = await ctx2.exec(
        `
				${ENSURE_SCH}
				const MOVES = ${JSON.stringify(moves)};
				const WIRES = ${JSON.stringify(wires)};
				const olds = (await eda.sch_PrimitiveWire.getAll()).map(function (w) { return w.primitiveId; });
				if (olds.length) await eda.sch_PrimitiveWire.delete(olds);
				const removed = olds.length;
				// \u65E7\u7684\u7535\u6E90\u5730\u7B26\u53F7\u4E00\u5E76\u6E05\u6389\uFF0C\u7A0D\u540E\u6309\u65B0\u4F4D\u7F6E\u91CD\u653E\uFF1B\u7559\u7740\u5C31\u662F\u4E00\u5806\u5B64\u513F
				const staleFlags = (await eda.sch_PrimitiveComponent.getAll())
					.filter(function (c) { return c.componentType === 'netflag'; })
					.map(function (c) { return c.primitiveId; });
				if (staleFlags.length) await eda.sch_PrimitiveComponent.delete(staleFlags);
				const flagsRemoved = staleFlags.length;
				let moved = 0;
				for (const m of MOVES) {
					const r = await eda.sch_PrimitiveComponent.modify(m.id, {
						x: m.x, y: m.y, rotation: m.rotation, mirror: m.mirror,
					});
					if (r !== false) moved += 1;
				}
				let drawn = 0;
				for (const w of WIRES) {
					const ok = await eda.sch_PrimitiveWire.create(w.points, w.net);
					if (ok) drawn += 1;
				}
				// \u7535\u6E90\u5730\u7B26\u53F7\uFF1A\u5F15\u4E00\u5C0F\u6BB5\u7EBF\uFF0C\u672B\u7AEF\u653E\u7B26\u53F7\u3002\u7EBF\u4E0D\u5E26\u7F51\u7EDC\u540D \u2014\u2014 \u5426\u5219\u5BFC\u7EBF\u7684
				// NET \u6807\u7B7E\u548C\u7B26\u53F7\u540D\u4F1A\u628A\u540C\u4E00\u4E2A\u7F51\u7EDC\u540D\u753B\u4E24\u904D\uFF0C\u6324\u5728\u4E00\u8D77\u3002
				const FLAGS = ${JSON.stringify(flags)};
				const KINDS = ${JSON.stringify(KIND)};
				let flagsDrawn = 0;
				for (const f of FLAGS) {
					await eda.sch_PrimitiveWire.create([f.x, f.y, f.ex, f.ey]).catch(() => {});
					const ok = await eda.sch_PrimitiveComponent.createNetFlag(KINDS[f.net] || 'Ground', f.net, f.ex, f.ey, f.rot);
					if (ok) flagsDrawn += 1;
				}
				return { wires_removed: removed, parts_moved: moved, wires_drawn: drawn, flags_removed: flagsRemoved, flags_drawn: flagsDrawn };
			`,
        18e4
      );
      return {
        ...summary,
        ...applied,
        note: r.routed.failedCount > 0 ? `\u6709 ${r.routed.failedCount} \u6761\u8FDE\u63A5\u6CA1\u8D70\u901A \u2014\u2014 \u591A\u534A\u662F\u5668\u4EF6\u6324\u5F97\u6CA1\u901A\u9053\u4E86\uFF0C\u52A0\u5927 rounds \u6216\u653E\u5BBD bounds \u518D\u8BD5\u3002` : "\u6446\u653E\u4E0E\u8D70\u7EBF\u90FD\u5DF2\u66F4\u65B0\u3002\u7535\u6E90\u5730\u7B26\u53F7\u9700\u8981\u53E6\u5916\u7528 eda_label_nets \u8865\uFF0C\u5B83\u4EEC\u4E0D\u53C2\u4E0E\u5E03\u5C40\u3002"
      };
    }
  }
];

// src/tools/library.ts
var SEARCH_TIMEOUT_MS = 6e4;
var NOISE_PROPS = /* @__PURE__ */ new Set([
  "Symbol",
  "Footprint",
  "3D Model",
  "3D Model Title",
  "3D Model Transform",
  "Add into BOM",
  "Convert to PCB",
  "Supplier",
  "Manufacturer",
  "Manufacturer Part",
  "Supplier Part",
  "Datasheet",
  "Designator"
]);
var libraryTools = [
  {
    name: "eda_library_search",
    description: '\u5728\u5143\u5668\u4EF6\u5E93\u91CC\u6309\u5173\u952E\u8BCD\u641C\u7D22\u5668\u4EF6\uFF08\u8986\u76D6\u7ACB\u521B\u5546\u57CE\u7684\u5668\u4EF6\u5E93\uFF09\u3002\u7528\u4E8E\u9009\u578B\uFF1A\u627E\u67D0\u578B\u53F7\u3001\u67D0\u7C7B\u5668\u4EF6\u6709\u54EA\u4E9B\u53EF\u9009\u3002\n\n\u8FD4\u56DE\u578B\u53F7\u540D\u3001\u5382\u5546\u3001\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF08C \u5F00\u5934\uFF09\u3001\u5C01\u88C5\u540D\u3001\u53C2\u6570\u63CF\u8FF0\u3002\u62FF\u5230\u7ACB\u521B\u7F16\u53F7\u540E\u53EF\u7528 eda_library_device \u770B\u5B8C\u6574\u53C2\u6570\u4E0E datasheet\u3002\n\n\u6CE8\u610F\u8FD9\u662F**\u5E93**\u91CC\u7684\u641C\u7D22\uFF0C\u56DE\u7B54"\u6709\u4EC0\u4E48\u53EF\u4EE5\u7528"\uFF1B\u8981\u770B"\u5F53\u524D\u677F\u5B50\u4E0A\u7528\u4E86\u4EC0\u4E48"\u8BF7\u7528 eda_schematic_components\u3002',
    inputSchema: {
      type: "object",
      properties: {
        keyword: { type: "string", description: "\u641C\u7D22\u8BCD\uFF0C\u5982 AMS1117 / 0.1uF 0402 / STM32F103" },
        limit: { type: "integer", description: "\u6BCF\u9875\u6570\u91CF\uFF0C\u9ED8\u8BA4 10\uFF0C\u6700\u5927 50" },
        page: { type: "integer", description: "\u9875\u7801\uFF0C\u4ECE 1 \u5F00\u59CB\uFF0C\u9ED8\u8BA4 1" }
      },
      required: ["keyword"]
    },
    handler: async (args, ctx2) => {
      const kw = requireString(args, "keyword");
      const limit = Math.min(typeof args.limit === "number" && args.limit > 0 ? args.limit : 10, 50);
      const page = typeof args.page === "number" && args.page > 0 ? args.page : 1;
      const rows = await ctx2.exec(
        `return await eda.lib_Device.search(${JSON.stringify(kw)}, undefined, undefined, undefined, ${limit}, ${page});`,
        SEARCH_TIMEOUT_MS
      );
      return {
        keyword: kw,
        page,
        returned: rows?.length ?? 0,
        hint: (rows?.length ?? 0) === limit ? "\u53EF\u80FD\u8FD8\u6709\u66F4\u591A\u7ED3\u679C\uFF0C\u7FFB\u4E0B\u4E00\u9875" : void 0,
        devices: (rows ?? []).map((d) => ({
          name: d.name,
          lcsc: d.supplierId || void 0,
          manufacturer: d.manufacturer || void 0,
          manufacturer_part: d.manufacturerId || void 0,
          footprint: d.footprintName || void 0,
          symbol: d.symbolName || void 0,
          description: d.description || void 0,
          device_uuid: d.uuid,
          library_uuid: d.libraryUuid
        }))
      };
    }
  },
  {
    name: "eda_library_device",
    description: "\u67E5\u5668\u4EF6\u5728\u5E93\u91CC\u7684\u5B8C\u6574\u4FE1\u606F\uFF1A\u7535\u6C14\u53C2\u6570\u3001\u5C01\u88C5\u3001\u7B26\u53F7\u3001**\u6570\u636E\u624B\u518C\u94FE\u63A5**\u3001\u9ED8\u8BA4\u4F4D\u53F7\u524D\u7F00\u3002\n\n\u7528\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF08\u5982 C347222\uFF09\u67E5\u6700\u65B9\u4FBF\uFF1B\u4E5F\u53EF\u4EE5\u7528 device_uuid + library_uuid\uFF08\u4ECE eda_library_search \u62FF\uFF09\u3002\n\n\u8981\u4E0B\u8F7D\u6570\u636E\u624B\u518C PDF \u5230\u672C\u5730\uFF0C\u628A\u8FD9\u91CC\u8FD4\u56DE\u7684 datasheet \u94FE\u63A5\u4EA4\u7ED9 eda_download_datasheet\u3002",
    inputSchema: {
      type: "object",
      properties: {
        lcsc_id: { type: "string", description: "\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF0C\u5982 C347222" },
        device_uuid: { type: "string", description: "\u5668\u4EF6 uuid\uFF08\u4E0E library_uuid \u914D\u5408\u4F7F\u7528\uFF09" },
        library_uuid: { type: "string", description: "\u6240\u5C5E\u5E93 uuid" }
      }
    },
    handler: async (args, ctx2) => {
      const lcsc = optionalString(args, "lcsc_id");
      const du = optionalString(args, "device_uuid");
      const lu = optionalString(args, "library_uuid");
      if (!lcsc && !du) throw new Error("\u8BF7\u7ED9\u51FA lcsc_id\uFF0C\u6216 device_uuid + library_uuid");
      const raw = await ctx2.exec(
        `
				let uuid = ${JSON.stringify(du ?? null)};
				let libUuid = ${JSON.stringify(lu ?? null)};
				const lcsc = ${JSON.stringify(lcsc ?? null)};
				if (!uuid && lcsc) {
					const hit = await eda.lib_Device.getByLcscIds([lcsc]);
					if (!hit || !hit.length) return null;
					uuid = hit[0].uuid; libUuid = hit[0].libraryUuid;
				}
				const d = await eda.lib_Device.get(uuid, libUuid || undefined);
				if (!d) return null;
				return {
					uuid: d.uuid, libraryUuid: d.libraryUuid, name: d.name, description: d.description,
					property: d.property, association: d.association, subPartNames: d.subPartNames,
				};
			`,
        SEARCH_TIMEOUT_MS
      );
      if (!raw) return { error: `\u672A\u627E\u5230\u5668\u4EF6\uFF08${lcsc ?? du}\uFF09\u3002\u82E5\u7528\u7ACB\u521B\u7F16\u53F7\uFF0C\u786E\u8BA4\u662F C \u5F00\u5934\u7684\u5546\u57CE\u7F16\u53F7\u3002` };
      const prop = raw.property ?? {};
      const other = prop.otherProperty ?? {};
      const params = {};
      for (const [k, v] of Object.entries(other)) {
        if (!NOISE_PROPS.has(k) && v) params[k] = v;
      }
      const assoc = raw.association ?? {};
      return {
        name: raw.name,
        description: raw.description || void 0,
        lcsc: prop.supplierId || void 0,
        manufacturer: prop.manufacturer || void 0,
        manufacturer_part: prop.manufacturerId || void 0,
        designator_prefix: prop.designator || void 0,
        datasheet: other.Datasheet || void 0,
        footprint: other["Supplier Footprint"] || void 0,
        parameters: params,
        device_uuid: raw.uuid,
        library_uuid: raw.libraryUuid,
        symbol_uuid: assoc.symbolUuid || void 0,
        footprint_uuid: assoc.footprintUuid || void 0,
        sub_parts: raw.subPartNames
      };
    }
  }
];

// src/layout/group.ts
var GROUP_PADDING = 60;
var GROUP_GAP = 140;
var groupOf = (partId, assign) => assign.get(partId) ?? "_default";
function netGroups(net, assign) {
  const gs = /* @__PURE__ */ new Set();
  for (const ref of net.pins) {
    const dot = ref.lastIndexOf(".");
    if (dot > 0) gs.add(groupOf(ref.slice(0, dot), assign));
  }
  return gs;
}
function layoutByGroups(parts, nets, assign, titles, opts = {}) {
  const {
    iterations = 2e4,
    weights = DEFAULT_WEIGHTS,
    seed = 7,
    sheet = { w: 1655, h: 1170 },
    margin = 120,
    anchors,
    obstacles = []
  } = opts;
  const members = /* @__PURE__ */ new Map();
  for (const id of parts.keys()) {
    const g = groupOf(id, assign);
    if (!members.has(g)) members.set(g, []);
    members.get(g)?.push(id);
  }
  const groupIds = [...members.keys()];
  const innerNets = /* @__PURE__ */ new Map();
  const crossGroupNets = [];
  for (const n of nets) {
    const gs = netGroups(n, assign);
    if (gs.size === 1) {
      const g = [...gs][0];
      if (!innerNets.has(g)) innerNets.set(g, []);
      innerNets.get(g)?.push(n);
    } else {
      crossGroupNets.push(n.id);
    }
  }
  const localLayout = /* @__PURE__ */ new Map();
  const localSize = /* @__PURE__ */ new Map();
  const perGroup = [];
  for (const g of groupIds) {
    const ids = members.get(g) ?? [];
    const sub = /* @__PURE__ */ new Map();
    for (const id of ids) {
      const p = parts.get(id);
      if (p) sub.set(id, p);
    }
    const init = /* @__PURE__ */ new Map();
    const cols = Math.max(1, Math.ceil(Math.sqrt(ids.length)));
    let step = 0;
    for (const id of ids) {
      const p = sub.get(id);
      if (p) step = Math.max(step, Math.max(p.w, p.h));
    }
    step = snap(Math.max(90, step + 60));
    ids.forEach((id, i) => {
      init.set(id, {
        x: snap(i % cols * step),
        y: snap(Math.floor(i / cols) * step),
        rot: 0,
        mirror: false
      });
    });
    const innerWeights = { ...weights, spread: weights.spread * 8 };
    const inner = innerNets.get(g) ?? [];
    const a = sub.size > 1 ? anneal(sub, inner, init, { iterations, weights: innerWeights, seed: seed + g.length * 31 }) : {
      layout: init,
      cost: evaluate(sub, inner, init, innerWeights),
      initialCost: evaluate(sub, inner, init, innerWeights),
      iterations: 0,
      accepted: 0
    };
    const r = route(sub, inner, a.layout);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [id, pl] of a.layout) {
      const p = sub.get(id);
      if (!p) continue;
      const swap = pl.rot === 90 || pl.rot === 270;
      const w = swap ? p.h : p.w;
      const h = swap ? p.w : p.h;
      minX = Math.min(minX, pl.x - w / 2);
      minY = Math.min(minY, pl.y - h / 2);
      maxX = Math.max(maxX, pl.x + w / 2);
      maxY = Math.max(maxY, pl.y + h / 2);
    }
    for (const rn of r.nets) {
      for (const path of rn.paths) {
        for (const [x, y] of path) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      minY = 0;
      maxX = 0;
      maxY = 0;
    }
    localLayout.set(g, a.layout);
    localSize.set(g, {
      w: maxX - minX + 2 * GROUP_PADDING,
      h: maxY - minY + 2 * GROUP_PADDING,
      minX,
      minY
    });
    perGroup.push({
      id: g,
      parts: ids.length,
      w: Math.round(maxX - minX),
      h: Math.round(maxY - minY),
      wireLength: r.totalLength,
      bends: r.totalBends
    });
  }
  const affinity = /* @__PURE__ */ new Map();
  for (const n of nets) {
    const gs = [...netGroups(n, assign)];
    for (let i = 0; i < gs.length; i++) {
      for (let j = i + 1; j < gs.length; j++) {
        const k = [gs[i], gs[j]].sort().join("|");
        affinity.set(k, (affinity.get(k) ?? 0) + 1);
      }
    }
  }
  const dodgeObstacles = (x, y, w, h) => {
    let cx = x;
    let cy = y;
    for (let guard = 0; guard < 60; guard += 1) {
      const box = { minX: cx - w / 2, minY: cy - h / 2, maxX: cx + w / 2, maxY: cy + h / 2 };
      const hit = obstacles.find(
        (o) => box.minX < o.maxX && o.minX < box.maxX && box.minY < o.maxY && o.minY < box.maxY
      );
      if (!hit) break;
      cx = hit.maxX + w / 2 + GROUP_GAP;
      if (cx + w / 2 > sheet.w - margin) {
        cx = margin + w / 2;
        cy = hit.maxY + h / 2 + GROUP_GAP;
      }
    }
    return { x: snap(cx), y: snap(cy) };
  };
  const gParts = /* @__PURE__ */ new Map();
  const gInit = /* @__PURE__ */ new Map();
  let cursorX = margin;
  let cursorY = margin;
  let rowH = 0;
  for (const g of groupIds) {
    const s = localSize.get(g);
    if (!s) continue;
    const pinned = anchors?.get(g);
    gParts.set(g, {
      id: g,
      w: s.w + GROUP_GAP,
      h: s.h + GROUP_GAP,
      pins: [{ id: "c", dx: 0, dy: 0, dir: 0 }],
      // anchor 是**软**约束：拿它当起点，但仍参与退火。
      // 原来这里按 `fixed: pinned != null` 锁死，结果 AI 随手给的三个
      // 等距 anchor 一旦装不下（某个组比间距还宽），组框就直接叠在一起，
      // 算法明明有重叠代价却动不了它们。MapGroup.anchor 的语义本来就是
      // 「期望位置，算法在附近安排」—— 实现跟设计对齐。
      fixed: false
    });
    if (pinned) {
      const safe2 = dodgeObstacles(pinned.x, pinned.y, s.w, s.h);
      gInit.set(g, { x: safe2.x, y: safe2.y, rot: 0, mirror: false });
      continue;
    }
    if (cursorX + s.w > sheet.w - margin && rowH > 0) {
      cursorX = margin;
      cursorY += rowH + GROUP_GAP;
      rowH = 0;
    }
    const safe = dodgeObstacles(cursorX + s.w / 2, cursorY + s.h / 2, s.w, s.h);
    gInit.set(g, { x: safe.x, y: safe.y, rot: 0, mirror: false });
    cursorX += s.w + GROUP_GAP;
    rowH = Math.max(rowH, s.h);
  }
  const obstacleIds = /* @__PURE__ */ new Set();
  obstacles.forEach((o, i) => {
    const id = `__obstacle_${i}`;
    obstacleIds.add(id);
    gParts.set(id, {
      id,
      w: Math.max(GRID, o.maxX - o.minX),
      h: Math.max(GRID, o.maxY - o.minY),
      pins: [],
      fixed: true
    });
    gInit.set(id, { x: snap((o.minX + o.maxX) / 2), y: snap((o.minY + o.maxY) / 2), rot: 0, mirror: false });
  });
  const gNets = [...affinity.entries()].map(([k, cnt]) => ({
    id: `aff:${k}`,
    // 耦合越强，重复越多次，等价于加权
    pins: k.split("|").flatMap((g) => Array.from({ length: Math.min(3, cnt) }, () => `${g}.c`))
  }));
  const gWeights = { ...weights, pinFacing: 0, supplyDir: 0 };
  const gRes = gParts.size > 1 ? anneal(gParts, gNets, gInit, {
    // 组间摆放看着简单（只有几个矩形），但解空间是离散的、代价面很崎岖：
    // 三个区排成一行、一列、还是 2x2，差别巨大。迭代给足才找得到能塞进图纸的排布。
    iterations: Math.max(2e4, iterations),
    weights: gWeights,
    seed: seed + 101,
    bounds: { minX: margin, minY: margin, maxX: sheet.w - margin, maxY: sheet.h - margin }
  }) : { layout: gInit, cost: evaluate(gParts, gNets, gInit, gWeights), initialCost: evaluate(gParts, gNets, gInit, gWeights), iterations: 0, accepted: 0 };
  const layout = /* @__PURE__ */ new Map();
  const groups = [];
  for (const g of groupIds) {
    if (obstacleIds.has(g)) continue;
    const size = localSize.get(g);
    const gp = gRes.layout.get(g);
    const local = localLayout.get(g);
    if (!size || !gp || !local) continue;
    const originX = snap(gp.x - size.w / 2 + GROUP_PADDING - size.minX);
    const originY = snap(gp.y - size.h / 2 + GROUP_PADDING - size.minY);
    for (const [id, pl] of local) {
      layout.set(id, { ...pl, x: snap(pl.x + originX), y: snap(pl.y + originY) });
    }
    const t = titles.get(g) ?? {};
    groups.push({
      id: g,
      title: t.title,
      note: t.note,
      minX: snap(gp.x - size.w / 2),
      minY: snap(gp.y - size.h / 2),
      maxX: snap(gp.x + size.w / 2),
      maxY: snap(gp.y + size.h / 2)
    });
  }
  const warnings = [];
  if (groups.length) {
    const allMinX = Math.min(...groups.map((g) => g.minX));
    const allMinY = Math.min(...groups.map((g) => g.minY));
    const allMaxX = Math.max(...groups.map((g) => g.maxX));
    const allMaxY = Math.max(...groups.map((g) => g.maxY));
    const needW = allMaxX - allMinX;
    const needH = allMaxY - allMinY;
    const availW = sheet.w - 2 * margin;
    const availH = sheet.h - 2 * margin;
    let dx = 0;
    let dy = 0;
    if (needW <= availW) dx = snap(margin - allMinX);
    else warnings.push(`\u6240\u6709\u5206\u533A\u6A2A\u5411\u5171\u9700 ${Math.round(needW)}\uFF0C\u56FE\u7EB8\u53EA\u6709 ${Math.round(availW)} \u53EF\u7528 \u2014\u2014 \u6362\u66F4\u5927\u7684\u56FE\u7EB8\uFF0C\u6216\u628A\u5206\u533A\u62C6\u7EC6`);
    if (needH <= availH) dy = snap(margin - allMinY);
    else warnings.push(`\u6240\u6709\u5206\u533A\u7EB5\u5411\u5171\u9700 ${Math.round(needH)}\uFF0C\u56FE\u7EB8\u53EA\u6709 ${Math.round(availH)} \u53EF\u7528 \u2014\u2014 \u6362\u66F4\u5927\u7684\u56FE\u7EB8\uFF0C\u6216\u628A\u5206\u533A\u62C6\u7EC6`);
    if (obstacles.length && (dx !== 0 || dy !== 0)) {
      const wouldHit = groups.some(
        (g) => obstacles.some(
          (o) => g.minX + dx < o.maxX && o.minX < g.maxX + dx && g.minY + dy < o.maxY && o.minY < g.maxY + dy
        )
      );
      if (wouldHit) {
        dx = 0;
        dy = 0;
      }
    }
    if (dx !== 0 || dy !== 0) {
      for (const [id, pl] of layout) layout.set(id, { ...pl, x: pl.x + dx, y: pl.y + dy });
      for (const g of groups) {
        g.minX += dx;
        g.maxX += dx;
        g.minY += dy;
        g.maxY += dy;
      }
    }
    for (const g of groups) {
      if (g.minX < 0 || g.minY < 0 || g.maxX > sheet.w || g.maxY > sheet.h) {
        const pinned = anchors?.get(g.id);
        warnings.push(
          pinned ? `\u5206\u533A ${g.id} \u8D8A\u51FA\u56FE\u7EB8 \u2014\u2014 \u5B83\u7684\u4F4D\u7F6E\u662F\u6307\u5B9A\u7684 (${pinned.x},${pinned.y})\uFF0C\u800C\u8BE5\u533A\u5B9E\u9645\u5360 ${Math.round(g.maxX - g.minX)}\xD7${Math.round(g.maxY - g.minY)}\uFF0C\u632A\u4E00\u4E0B anchor` : `\u5206\u533A ${g.id} \u8D8A\u51FA\u56FE\u7EB8`
        );
      }
    }
  }
  const routed = route(parts, nets, layout, { obstacles });
  if (routed.failedCount) warnings.push(`${routed.failedCount} \u6761\u8FDE\u63A5\u6CA1\u8D70\u901A\uFF0C\u591A\u534A\u662F\u5206\u533A\u4E4B\u95F4\u6CA1\u7559\u591F\u901A\u9053`);
  return { layout, groups, routed, crossGroupNets, perGroup, warnings };
}

// src/layout/map.ts
var EMPTY_MAP = {
  version: 1,
  meta: { sheet: { w: 1170, h: 825 }, grid: 10 },
  groups: [],
  parts: [],
  nets: []
};
function guessNetKind(name) {
  const u = name.toUpperCase();
  if (u === "AGND" || u === "GNDA") return "analog_ground";
  if (u === "PGND" || u === "EARTH" || u === "FGND") return "protect_ground";
  if (["GND", "DGND", "SGND", "VSS", "VEE", "GNDD"].includes(u)) return "ground";
  if (u.startsWith("VCC") || u.startsWith("VDD") || u.startsWith("VBAT") || u === "V+") return "power";
  const c0 = u.charCodeAt(0);
  if ((c0 >= 48 && c0 <= 57 || u.charAt(0) === "+") && u.includes("V")) return "power";
  return "signal";
}
function defaultStyle(kind) {
  return kind === "signal" ? "wire" : "symbol";
}
function validateMap(m) {
  const errs = [];
  const ids = /* @__PURE__ */ new Set();
  for (const p of m.parts) {
    if (ids.has(p.id)) errs.push(`\u4F4D\u53F7\u91CD\u590D: ${p.id}`);
    ids.add(p.id);
    if (!p.pins.length) errs.push(`${p.id} \u6CA1\u6709\u5F15\u811A`);
    if (p.group && !m.groups.some((g) => g.id === p.group)) errs.push(`${p.id} \u5F52\u5C5E\u7684\u5206\u533A\u4E0D\u5B58\u5728: ${p.group}`);
  }
  for (const n of m.nets) {
    if (n.pins.length < 2 && n.style === "wire") {
      errs.push(`\u7F51\u7EDC ${n.id} \u53EA\u6709 ${n.pins.length} \u4E2A\u5F15\u811A\uFF0C\u753B\u4E0D\u6210\u7EBF`);
    }
    for (const ref of n.pins) {
      const dot = ref.lastIndexOf(".");
      const part = dot > 0 ? m.parts.find((p) => p.id === ref.slice(0, dot)) : void 0;
      if (!part) {
        errs.push(`\u7F51\u7EDC ${n.id} \u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u4F4D\u53F7: ${ref}`);
      } else if (!part.pins.some((q) => q.id === ref.slice(dot + 1))) {
        errs.push(`\u7F51\u7EDC ${n.id} \u5F15\u7528\u4E86\u4E0D\u5B58\u5728\u7684\u5F15\u811A: ${ref}`);
      }
    }
  }
  return errs;
}
var MAP_MARK = "EDAMCP_MAP_V1:";
var COMPACT_LIMIT = 96;
function pretty(v, ind) {
  const flat = JSON.stringify(v);
  if (flat === void 0) return "null";
  if (typeof v !== "object" || v === null || flat.length <= COMPACT_LIMIT) return flat;
  const next = `${ind} `;
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return `[
${v.map((x) => next + pretty(x, next)).join(",\n")}
${ind}]`;
  }
  const entries = Object.entries(v).filter(([, x]) => x !== void 0);
  if (!entries.length) return "{}";
  return `{
${entries.map(([k, x]) => `${next}${JSON.stringify(k)}: ${pretty(x, next)}`).join(",\n")}
${ind}}`;
}
function packMap(map) {
  return `${MAP_MARK}
${pretty(map, "")}`;
}
function unpackMap(rawAfterMark) {
  try {
    return JSON.parse(rawAfterMark);
  } catch {
    return JSON.parse(rawAfterMark.replace(/[\r\n]+/g, ""));
  }
}
function saveMapCode(payload, x, y) {
  return `
		const PAYLOAD = ${JSON.stringify(payload)};
		const MARK = ${JSON.stringify(MAP_MARK)};
		const findMaps = async function () {
			return ((await eda.sch_PrimitiveText.getAll()) || []).filter(function (t) {
				return String(t.content || '').indexOf(MARK) === 0;
			});
		};

		const olds = (await findMaps()).map(function (t) { return t.primitiveId; });
		if (olds.length) await eda.sch_PrimitiveText.delete(olds);
		await new Promise(function (r) { setTimeout(r, 400); });

		const made = await eda.sch_PrimitiveText.create(${x}, ${y}, PAYLOAD);
		if (!made) return { ok: false, error: '\u5730\u56FE\u5199\u5165\u5931\u8D25', removed_old: olds.length };

		// \u56DE\u8BFB\uFF1A\u4E0A\u9762\u90A3\u6B21\u5220\u53EF\u80FD\u56E0\u4E3A\u7F13\u5B58\u6F0F\u6389\u4E86\u51E0\u4EFD\uFF0C\u8FD9\u91CC\u628A\u9664\u81EA\u5DF1\u4EE5\u5916\u7684\u90FD\u6E05\u6389
		await new Promise(function (r) { setTimeout(r, 600); });
		let all = await findMaps();
		let cleanedExtra = 0;
		if (all.length > 1) {
			const dup = all
				.filter(function (t) { return t.primitiveId !== made.primitiveId; })
				.map(function (t) { return t.primitiveId; });
			if (dup.length) {
				await eda.sch_PrimitiveText.delete(dup);
				cleanedExtra = dup.length;
				await new Promise(function (r) { setTimeout(r, 400); });
				all = await findMaps();
			}
		}

		const got = all.filter(function (t) { return t.primitiveId === made.primitiveId; })[0];
		const len = got ? String(got.content || '').length : 0;
		return {
			ok: len === PAYLOAD.length && all.length === 1,
			copies: all.length,
			removed_old: olds.length,
			cleaned_extra: cleanedExtra,
			bytes: PAYLOAD.length,
			read_back: len,
		};
	`;
}

// src/layout/trace.ts
var Trace = class {
  entries = [];
  step = "(\u672A\u547D\u540D)";
  enabled;
  constructor(enabled = true) {
    this.enabled = enabled;
  }
  /** 切换当前步骤名，之后的记录都归到它名下 */
  at(step) {
    this.step = step;
    return this;
  }
  log(msg, data) {
    this.push("info", msg, data);
  }
  warn(msg, data) {
    this.push("warn", msg, data);
  }
  error(msg, data) {
    this.push("error", msg, data);
  }
  push(level, msg, data) {
    if (!this.enabled) return;
    this.entries.push({ step: this.step, level, msg, ...data ? { data } : {} });
  }
  /** 只有 warn / error —— 出问题时先看这个 */
  issues() {
    return this.entries.filter((e) => e.level !== "info");
  }
  all() {
    return this.entries;
  }
  /** 给返回值用的紧凑形态：正常时只回统计，有问题时把问题列出来 */
  summary() {
    const bad = this.issues();
    return {
      steps: new Set(this.entries.map((e) => e.step)).size,
      issues: bad.length,
      lines: bad.map((e) => `[${e.step}] ${e.msg}${e.data ? " " + JSON.stringify(e.data) : ""}`)
    };
  }
  /** 人读的完整流水，问题行前面加标记 */
  format() {
    return this.entries.map((e) => {
      const mark = e.level === "error" ? "!! " : e.level === "warn" ? " ! " : "   ";
      return `${mark}[${e.step}] ${e.msg}${e.data ? " " + JSON.stringify(e.data) : ""}`;
    });
  }
};
function checkRouteEndpoints(trace, nets, pinXY, tol = 1) {
  trace.at("\u8D70\u7EBF\u81EA\u68C0");
  let bad = 0;
  for (const net of nets) {
    const pts = [];
    for (const path of net.paths) for (const p of path) pts.push(p);
    if (!pts.length) {
      trace.error(`\u7F51\u7EDC ${net.id} \u4E00\u4E2A\u70B9\u90FD\u6CA1\u6709 \u2014\u2014 \u7EBF\u6CA1\u753B\u51FA\u6765`, { pins: net.pins });
      bad += net.pins.length;
      continue;
    }
    for (const ref of net.pins) {
      const xy = pinXY.get(ref);
      if (!xy) {
        trace.warn(`\u7F51\u7EDC ${net.id} \u7684\u5F15\u811A ${ref} \u5728\u5E03\u5C40\u91CC\u627E\u4E0D\u5230`, {});
        bad += 1;
        continue;
      }
      let best = Infinity;
      for (const [px, py] of pts) {
        const d = Math.abs(px - xy.x) + Math.abs(py - xy.y);
        if (d < best) best = d;
      }
      if (best > tol) {
        trace.error(`\u5F15\u811A ${ref} \u6CA1\u843D\u5728 ${net.id} \u7684\u7EBF\u4E0A`, {
          \u5F15\u811A: [xy.x, xy.y],
          \u6700\u8FD1\u70B9\u5DEE: best
        });
        bad += 1;
      }
    }
  }
  if (bad === 0) trace.log(`${nets.length} \u6761\u7F51\u7EDC\u7684\u5F15\u811A\u7AEF\u70B9\u5168\u90E8\u5BF9\u9F50`, {});
  return bad;
}

// src/tools/verify.ts
var READBACK_DELAY_MS = 1200;
var COORD_TOLERANCE = 10;
var DEFAULT_ATTEMPTS = 6;
var HASH_FN = `
	const __hash = async function (text) {
		const s = String(text);
		if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
			try {
				const buf = new TextEncoder().encode(s);
				const out = await crypto.subtle.digest('SHA-256', buf);
				const bytes = Array.from(new Uint8Array(out));
				return 'sha256:' + bytes.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
			} catch (e) { /* \u843D\u5230\u4E0B\u9762\u7684 FNV-1a */ }
		}
		let h = 2166136261;
		for (let i = 0; i < s.length; i += 1) {
			h = h ^ s.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return 'fnv1a:' + (h >>> 0).toString(16) + ':' + s.length;
	};
`;
async function hashLocal(text, algo) {
  if (algo.startsWith("sha256")) {
    const { createHash } = await import("node:crypto");
    return "sha256:" + createHash("sha256").update(text, "utf8").digest("hex");
  }
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h = h ^ text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return "fnv1a:" + (h >>> 0).toString(16) + ":" + text.length;
}
async function stableRead(ctx2, code, opts = {}) {
  const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
  const timeoutMs = opts.timeoutMs ?? 12e4;
  const settleMs = opts.settleMs ?? 0;
  const notes = [];
  const wrapped = `
		${HASH_FN}
		const __run = async function () { ${code}
		};
		const __value = await __run();
		const __text = JSON.stringify(__value === undefined ? null : __value);
		return { __text: __text, __hash: await __hash(__text) };
	`;
  let prev = null;
  let reads = 0;
  let lastErr = "";
  for (let i = 0; i < attempts; i += 1) {
    if (settleMs > 0 || i > 0) {
      await sleep(i === 0 ? settleMs : settleMs + 300 * i);
    }
    const clientId = ctx2.bridge.activeClient()?.id;
    let got;
    try {
      got = await ctx2.exec(wrapped, timeoutMs);
      reads += 1;
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
      notes.push(`\u7B2C ${i + 1} \u6B21\u8BFB\u53D6\u629B\u9519\uFF1A${lastErr}`);
      prev = null;
      continue;
    }
    if (typeof got?.__text !== "string" || typeof got?.__hash !== "string") {
      notes.push(`\u7B2C ${i + 1} \u6B21\u8FD4\u56DE\u7ED3\u6784\u4E0D\u5BF9\uFF08__text/__hash \u4E0D\u662F\u5B57\u7B26\u4E32\uFF09\uFF0C\u4E22\u5F03`);
      prev = null;
      continue;
    }
    const text = got.__text;
    const hash = got.__hash;
    const mine = await hashLocal(text, hash);
    if (mine !== hash) {
      notes.push(`\u7B2C ${i + 1} \u6B21\u4F20\u8F93\u6821\u9A8C\u4E0D\u7B26\uFF08EDA=${hash.slice(0, 24)} \u672C\u4FA7=${mine.slice(0, 24)}\uFF09\uFF0C\u4E22\u5F03`);
      prev = null;
      continue;
    }
    if (prev && prev.client !== clientId) {
      notes.push(
        `\u7B2C ${i + 1} \u6B21\u6362\u4E86\u6807\u7B7E\u9875\u56DE\u7B54\uFF08${prev.client ?? "?"} \u2192 ${clientId ?? "?"}\uFF09\u2014\u2014 \u591A\u5F00 EDA \u9875\u9762\u65F6\u8C03\u7528\u76EE\u6807\u4F1A\u6F02\u79FB\uFF0C\u91CD\u65B0\u8BFB`
      );
      prev = { text, hash, client: clientId };
      continue;
    }
    if (prev && prev.hash === hash) {
      try {
        return { value: JSON.parse(text), reads, hash, notes };
      } catch (e) {
        notes.push(`\u4E24\u6B21\u4E00\u81F4\u4F46 JSON \u89E3\u6790\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`);
        prev = null;
        continue;
      }
    }
    if (prev && prev.hash !== hash) {
      notes.push(`\u7B2C ${i + 1} \u6B21\u4E0E\u4E0A\u4E00\u6B21\u4E0D\u4E00\u81F4\uFF08\u7F13\u5B58\u6216\u72B6\u6001\u672A\u7A33\uFF09\uFF0C\u7EE7\u7EED\u8BFB`);
    }
    prev = { text, hash, client: clientId };
  }
  throw new Error(
    `\u8BFB\u4E86 ${reads} \u6B21\u4ECD\u62FF\u4E0D\u5230\u53EF\u4FE1\u6570\u636E\uFF08\u8981\u6C42\u8FDE\u7EED\u4E24\u6B21\u4E00\u81F4\u4E14\u4F20\u8F93\u6821\u9A8C\u901A\u8FC7\uFF09\u3002` + (lastErr ? `\u6700\u540E\u4E00\u6B21\u9519\u8BEF\uFF1A${lastErr}\u3002` : "") + `\u8FC7\u7A0B\uFF1A${notes.join("\uFF1B") || "\u65E0"}`
  );
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function currentPage(ctx2, attempts = DEFAULT_ATTEMPTS) {
  const { value } = await stableRead(
    ctx2,
    `
		const proj = await eda.dmt_Project.getCurrentProjectInfo().catch(function () { return null; });
		const board = await eda.dmt_Board.getCurrentBoardInfo().catch(function () { return null; });
		const sch = await eda.dmt_Schematic.getCurrentSchematicInfo().catch(function () { return null; });
		const page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(function () { return null; });
		const pcb = await eda.dmt_Pcb.getCurrentPcbInfo().catch(function () { return null; });
		const editor = page ? 'schematic' : (pcb ? 'pcb' : 'other');

		// \u7126\u70B9\u5728 PCB \u6216\u522B\u5904\u65F6\uFF0C\u300C\u67E5\u4E0D\u5230\u539F\u7406\u56FE\u9875\u300D\u662F\u6B63\u5E38\u72B6\u6001\u800C\u4E0D\u662F\u9519\u8BEF \u2014\u2014
		// \u53EA\u6709\u5F53\u81EA\u5DF1\u58F0\u79F0\u5728\u539F\u7406\u56FE\u7F16\u8F91\u5668\u91CC\uFF0C\u5404\u9879\u624D\u5FC5\u987B\u9F50\u5907\u4E14\u4E92\u76F8\u5BF9\u5F97\u4E0A\u3002
		const problems = [];
		if (editor === 'schematic' && !sch) problems.push('\u5728\u539F\u7406\u56FE\u7F16\u8F91\u5668\u91CC\u5374\u67E5\u4E0D\u5230\u5F53\u524D\u539F\u7406\u56FE');
		if (page && sch && page.parentSchematicUuid !== sch.uuid) {
			problems.push('\u56FE\u9875\u58F0\u660E\u7684\u6240\u5C5E\u539F\u7406\u56FE(' + page.parentSchematicUuid +
				') \u4E0E\u5F53\u524D\u539F\u7406\u56FE(' + sch.uuid + ') \u4E0D\u4E00\u81F4');
		}
		if (board && sch && board.schematic && board.schematic.uuid !== sch.uuid) {
			problems.push('\u5F53\u524D\u677F\u4E0B\u7684\u539F\u7406\u56FE(' + board.schematic.uuid +
				') \u4E0E\u5F53\u524D\u539F\u7406\u56FE(' + sch.uuid + ') \u4E0D\u4E00\u81F4');
		}
		if (sch && sch.page && page && !sch.page.some(function (p) { return p.uuid === page.uuid; })) {
			problems.push('\u5F53\u524D\u56FE\u9875\u4E0D\u5728\u5F53\u524D\u539F\u7406\u56FE\u7684\u56FE\u9875\u5217\u8868\u91CC');
		}

		return {
			boardName: board ? board.name : undefined,
			pageUuid: page ? page.uuid : undefined,
			pageName: page ? page.name : undefined,
			schematicUuid: sch ? sch.uuid : undefined,
			schematicName: sch ? sch.name : undefined,
			pcbUuid: pcb ? pcb.uuid : undefined,
			pcbName: pcb ? pcb.name : undefined,
			editor: editor,
			projectUuid: proj ? proj.uuid : undefined,
			projectName: proj ? (proj.friendlyName || proj.name) : undefined,
			consistent: problems.length === 0,
			inconsistency: problems.length ? problems.join('\uFF1B') : undefined,
		};
	`,
    { attempts }
  );
  return value;
}
var CENSUS_CODE = `
	const kinds = {
		component: eda.sch_PrimitiveComponent,
		wire: eda.sch_PrimitiveWire,
		text: eda.sch_PrimitiveText,
		rectangle: eda.sch_PrimitiveRectangle,
	};
	const counts = {};
	const parts = [];
	for (const name of Object.keys(kinds)) {
		const api = kinds[name];
		if (!api || !api.getAll) { counts[name] = -1; continue; }
		const list = (await api.getAll()) || [];
		counts[name] = list.length;
		// \u6458\u8981\u53EA\u53D6\u4F4D\u7F6E\u4E0E\u8EAB\u4EFD\uFF0C\u4E0D\u53D6\u6837\u5F0F \u2014\u2014 \u6837\u5F0F\u53D8\u52A8\u4E0D\u8BE5\u88AB\u5F53\u6210\u56FE\u7EB8\u53D8\u4E86
		for (const it of list) {
			parts.push(name + ':' + (it.designator || it.net || it.content || '') +
				'@' + Math.round(it.x || 0) + ',' + Math.round(it.y || 0));
		}
	}
	parts.sort();
	let total = 0;
	for (const k of Object.keys(counts)) { if (counts[k] > 0) total += counts[k]; }
	return { counts: counts, total: total, digest: await __hash(parts.join('|')) };
`;
async function census(ctx2, opts = {}) {
  const { value } = await stableRead(ctx2, CENSUS_CODE, {
    attempts: opts.attempts ?? DEFAULT_ATTEMPTS,
    settleMs: opts.settleMs ?? 0
  });
  return value;
}
function diffCensus(before, after, expect) {
  const delta = {};
  const keys = /* @__PURE__ */ new Set([...Object.keys(before.counts), ...Object.keys(after.counts)]);
  for (const k of keys) {
    const d = (after.counts[k] ?? 0) - (before.counts[k] ?? 0);
    if (d !== 0) delta[k] = d;
  }
  const changed = before.digest !== after.digest;
  let matchesExpectation;
  const bad = [];
  if (expect) {
    matchesExpectation = true;
    for (const [k, want] of Object.entries(expect)) {
      const got = delta[k] ?? 0;
      if (got !== want) {
        matchesExpectation = false;
        bad.push(`${k} \u9884\u671F ${want >= 0 ? "+" : ""}${want}\u3001\u5B9E\u9645 ${got >= 0 ? "+" : ""}${got}`);
      }
    }
  }
  const parts = [];
  parts.push(
    Object.keys(delta).length ? "\u53D8\u5316\uFF1A" + Object.entries(delta).map(([k, v]) => `${k} ${v >= 0 ? "+" : ""}${v}`).join("\uFF0C") : "\u5404\u7C7B\u56FE\u5143\u6570\u91CF\u6CA1\u53D8"
  );
  if (!changed) parts.push("\u5185\u5BB9\u6458\u8981\u4E5F\u6CA1\u53D8 \u2014\u2014 \u8FD9\u4E00\u6B65\u5F88\u53EF\u80FD\u538B\u6839\u6CA1\u751F\u6548");
  if (bad.length) parts.push("\u4E0E\u9884\u671F\u4E0D\u7B26\uFF1A" + bad.join("\uFF1B"));
  return { delta, changed, matchesExpectation, summary: parts.join("\u3002") };
}
async function verifyPlaced(ctx2, want, opts = {}) {
  const { value } = await stableRead(
    ctx2,
    `
		const out = [];
		for (const c of (await eda.sch_PrimitiveComponent.getAll()) || []) {
			if (c.componentType !== 'part') continue;
			out.push({ designator: String(c.designator || ''), x: c.x, y: c.y, rotation: c.rotation || 0 });
		}
		return out;
	`,
    { attempts: opts.attempts ?? DEFAULT_ATTEMPTS, settleMs: opts.settleMs ?? READBACK_DELAY_MS }
  );
  const byDes = new Map(value.map((c) => [c.designator.toUpperCase(), c]));
  const checks = want.map((w) => {
    const got = byDes.get(w.designator.toUpperCase());
    if (!got) return { ...w, found: false, ok: false, note: "\u56DE\u8BFB\u65F6\u627E\u4E0D\u5230\u8FD9\u4E2A\u4F4D\u53F7" };
    const dx = Math.abs(got.x - w.x);
    const dy = Math.abs(got.y - w.y);
    const posOk = dx <= COORD_TOLERANCE && dy <= COORD_TOLERANCE;
    const rotOk = w.rotation == null || ((got.rotation - w.rotation) % 360 + 360) % 360 === 0;
    const notes = [];
    if (!posOk) notes.push(`\u4F4D\u7F6E\u504F\u4E86 (${dx.toFixed(0)}, ${dy.toFixed(0)})`);
    if (!rotOk) notes.push(`\u89D2\u5EA6\u662F ${got.rotation}\u3001\u8981\u6C42 ${w.rotation}`);
    return {
      ...w,
      found: true,
      actualX: got.x,
      actualY: got.y,
      actualRotation: got.rotation,
      ok: posOk && rotOk,
      note: notes.join("\uFF1B") || void 0
    };
  });
  const bad = checks.filter((c) => !c.ok);
  return {
    checks,
    allOk: bad.length === 0,
    summary: bad.length ? `${bad.length}/${checks.length} \u4E2A\u5668\u4EF6\u6CA1\u5230\u4F4D\uFF1A` + bad.map((b) => `${b.designator}(${b.note})`).join("\uFF0C") : `${checks.length} \u4E2A\u5668\u4EF6\u4F4D\u7F6E\u89D2\u5EA6\u90FD\u5DF2\u56DE\u8BFB\u786E\u8BA4`
  };
}
var verifyTools = [
  {
    name: "eda_current_context",
    description: "\u5F53\u524D\u6B63\u5728\u7F16\u8F91\u7684\u5BF9\u8C61\uFF1A\u54EA\u5757\u677F\u3001\u54EA\u4E00\u9875\u539F\u7406\u56FE\u3001\u54EA\u4E2A PCB\u3002\n\n\u7528\u6237\u8BF4\u300C\u8FD9\u4E2A\u539F\u7406\u56FE\u300D\u300C\u5F53\u524D\u8FD9\u5757\u677F\u300D\u65F6\uFF0C\u7528\u672C\u5DE5\u5177\u628A\u6307\u4EE3\u89E3\u6790\u6210\u5177\u4F53 uuid\u3002\n\u6CE8\u610F\uFF1A\u6253\u5F00\u539F\u7406\u56FE\u65F6 pcb \u4E3A null\uFF0C\u53CD\u4E4B\u4EA6\u7136 \u2014\u2014 \u7531\u6B64\u53EF\u5224\u65AD\u7528\u6237\u6B64\u523B\u5728\u54EA\u4E2A\u7F16\u8F91\u5668\u91CC\u3002\n**\u677F\u5B50\u6CA1\u6709 uuid**\uFF1AEDA \u91CC\u677F\u540D\u5C31\u662F\u5B83\u5728\u5DE5\u7A0B\u5185\u7684\u552F\u4E00\u6807\u8BC6\u3002\n\n**\u5199\u56FE\u7EB8\u4E4B\u524D\u5148\u8C03\u5B83**\uFF1A\u6240\u6709\u539F\u7406\u56FE\u5DE5\u5177\u90FD\u4F5C\u7528\u5728\u9690\u5F0F\u7684\u300C\u5F53\u524D\u9875\u300D\u4E0A\uFF0C\u7126\u70B9\u4E0D\u5BF9\u5C31\u4F1A\u628A\u56FE\u753B\u8FDB\u522B\u7684\u677F\u5B50\u3002\n\n\u6570\u636E\u7ECF\u8FC7\u4E09\u9053\u6821\u9A8C\u624D\u8FD4\u56DE\uFF1A\u7ED3\u6784\u68C0\u67E5\u3001\u4F20\u8F93\u54C8\u5E0C\u6BD4\u5BF9\u3001\u540C\u4E00\u8BFB\u53D6\u8FDE\u505A\u4E24\u904D\u53D6\u4E00\u81F4\u503C\uFF1B\u677F\uFF0F\u539F\u7406\u56FE\uFF0F\u56FE\u9875\u8FD8\u4F1A\u4E92\u76F8\u5370\u8BC1\uFF08\u56FE\u9875\u58F0\u660E\u7684\u7236\u539F\u7406\u56FE\u5FC5\u987B\u5C31\u662F\u5F53\u524D\u539F\u7406\u56FE\uFF09\u3002\u4EFB\u4F55\u4E00\u9053\u8FC7\u4E0D\u4E86\u5C31\u5982\u5B9E\u62A5\u9519\uFF0C**\u4E0D\u4F1A\u8FD4\u56DE\u53EF\u80FD\u662F\u810F\u7684\u6570\u636E** \u2014\u2014 \u6162\u4E00\u70B9\u6CA1\u5173\u7CFB\uFF0C\u4FE1\u606F\u5FC5\u987B\u786E\u5B9A\u3002\n\ncensus=true \u65F6\u989D\u5916\u666E\u67E5\u56FE\u4E0A\u5404\u7C7B\u56FE\u5143\u7684\u6570\u91CF\u4E0E\u5185\u5BB9\u6458\u8981\uFF0C\u53EF\u7528\u4E8E\u5728\u5199\u64CD\u4F5C\u524D\u540E\u6BD4\u5BF9\u300C\u56FE\u7EB8\u5230\u5E95\u53D8\u4E86\u6CA1\u6709\u300D\u3002",
    inputSchema: {
      type: "object",
      properties: {
        census: {
          type: "boolean",
          description: "\u662F\u5426\u540C\u65F6\u666E\u67E5\u56FE\u5143\u6570\u91CF\u4E0E\u5185\u5BB9\u6458\u8981\uFF0C\u9ED8\u8BA4 false"
        }
      }
    },
    handler: async (args, ctx2) => {
      const id = await currentPage(ctx2);
      const tabs = ctx2.bridge.authedClients();
      const activeId = ctx2.bridge.activeClient()?.id;
      const out = {
        answered_by_tab: activeId,
        open_tabs: tabs.length,
        board: id.boardName ? { name: id.boardName } : null,
        schematic: id.schematicUuid ? { uuid: id.schematicUuid, name: id.schematicName } : null,
        schematic_page: id.pageUuid ? { uuid: id.pageUuid, name: id.pageName } : null,
        pcb: id.pcbUuid ? { uuid: id.pcbUuid, name: id.pcbName } : null,
        editor: id.editor,
        project: id.projectUuid ? { uuid: id.projectUuid, name: id.projectName } : null,
        verified: id.consistent,
        inconsistency: id.inconsistency
      };
      if (!id.consistent) {
        out.note = `\u8EAB\u4EFD\u81EA\u76F8\u77DB\u76FE\uFF0C\u4E0D\u8981\u5728\u8FD9\u4E2A\u72B6\u6001\u4E0B\u5199\u56FE\u7EB8\uFF1A${id.inconsistency}`;
        return out;
      }
      if (args.census === true && id.editor === "schematic") {
        const c = await census(ctx2);
        out.census = { counts: c.counts, total: c.total, digest: c.digest };
      }
      const notes = [];
      notes.push(
        id.editor === "schematic" ? "\u8EAB\u4EFD\u5DF2\u786E\u8BA4\uFF0C\u53EF\u4EE5\u5B89\u5168\u5730\u5728\u8FD9\u4E00\u9875\u4E0A\u64CD\u4F5C\u3002" : `\u5F53\u524D\u5728 ${id.editor} \u7F16\u8F91\u5668\u91CC\uFF0C\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875 \u2014\u2014 \u539F\u7406\u56FE\u7C7B\u5DE5\u5177\u6B64\u65F6\u4E0D\u8BE5\u8C03\u7528\u3002`
      );
      if (tabs.length > 1) {
        notes.push(
          `**\u6CE8\u610F\u6709 ${tabs.length} \u4E2A EDA \u6807\u7B7E\u9875\u8FDE\u7740**\uFF08${tabs.map((c) => c.id).join("\u3001")}\uFF09\uFF0C\u5F53\u524D\u5E94\u7B54\u7684\u662F ${activeId}\u3002\u8C03\u7528\u9ED8\u8BA4\u53D1\u7ED9\u6700\u540E\u4E00\u4E2A\u8FDE\u4E0A\u7684\u9875\u9762\uFF0C\u65B0\u5F00\u9875\u9762\u6216\u67D0\u9875\u5237\u65B0\u91CD\u8FDE\u90FD\u4F1A\u8BA9\u76EE\u6807\u9759\u9ED8\u6F02\u79FB\u5230\u53E6\u4E00\u4E2A\u6587\u6863\u4E0A \u2014\u2014 \u8FDE\u7EED\u64CD\u4F5C\u524D\u8BF7\u7528 eda_use_tab \u9489\u4F4F\u4E00\u4E2A\uFF0C\u6216\u53EA\u7559\u4E00\u4E2A EDA \u9875\u9762\u3002`
        );
      }
      out.note = notes.join(" ");
      return out;
    }
  },
  {
    name: "eda_use_tab",
    description: "\u3010\u53EA\u8BFB\u3011\u628A\u540E\u7EED\u6240\u6709\u8C03\u7528\u9489\u5728\u6307\u5B9A\u7684 EDA \u6807\u7B7E\u9875\u4E0A\u3002\n\n**\u591A\u5F00 EDA \u9875\u9762\u65F6\u5FC5\u987B\u5148\u9489**\uFF1A\u6BCF\u4E2A\u6D4F\u89C8\u5668\u6807\u7B7E\u9875\u90FD\u662F\u4E00\u4E2A\u72EC\u7ACB\u7684\u6269\u5C55\u5B9E\u4F8B\uFF0C\u8C03\u7528\u9ED8\u8BA4\u53D1\u7ED9\u300C\u6700\u540E\u4E00\u4E2A\u8FDE\u4E0A\u7684\u300D\uFF0C\u65B0\u5F00\u9875\u9762\u6216\u67D0\u9875\u5237\u65B0\u91CD\u8FDE\u90FD\u4F1A\u8BA9\u76EE\u6807\u9759\u9ED8\u6F02\u79FB \u2014\u2014 \u8868\u73B0\u51FA\u6765\u5C31\u662F\u300C\u5DE5\u7A0B\u600E\u4E48\u81EA\u5DF1\u53D8\u4E86\u300D\u300C\u8BFB\u5230\u7684\u662F\u522B\u7684\u677F\u5B50\u7684\u6570\u636E\u300D\u3002\n\n\u6807\u7B7E\u9875 id \u4ECE eda_status \u7684 connected_clients \u6216 eda_current_context \u7684 answered_by_tab \u62FF\u3002\u4E0D\u7ED9 tab_id \u5219\u53EA\u5217\u51FA\u5F53\u524D\u6709\u54EA\u4E9B\u9875\u9762\u8FDE\u7740\u3002",
    inputSchema: {
      type: "object",
      properties: {
        tab_id: { type: "string", description: "\u8981\u9489\u4F4F\u7684\u6807\u7B7E\u9875 id\uFF1B\u4E0D\u7ED9\u5219\u53EA\u5217\u51FA\u53EF\u9009\u9879" }
      }
    },
    handler: async (args, ctx2) => {
      const tabs = ctx2.bridge.authedClients();
      const listing = tabs.map((c) => ({
        id: c.id,
        host: c.info?.host,
        connected_seconds: Math.round((Date.now() - c.connectedAt) / 1e3),
        active: c.id === ctx2.bridge.activeClient()?.id
      }));
      const wanted = typeof args.tab_id === "string" ? args.tab_id.trim() : "";
      if (!wanted) {
        return {
          tabs: listing,
          note: tabs.length > 1 ? "\u6709\u591A\u4E2A\u9875\u9762\u8FDE\u7740 \u2014\u2014 \u4F20 tab_id \u9489\u4F4F\u4E00\u4E2A\uFF0C\u5426\u5219\u8C03\u7528\u76EE\u6807\u4F1A\u968F\u91CD\u8FDE\u6F02\u79FB\u3002" : "\u53EA\u6709\u4E00\u4E2A\u9875\u9762\u8FDE\u7740\uFF0C\u6682\u65F6\u4E0D\u7528\u9489\u3002"
        };
      }
      if (!ctx2.bridge.setActiveClient(wanted)) {
        return {
          ok: false,
          error: `\u6CA1\u6709\u5DF2\u8BA4\u8BC1\u7684\u6807\u7B7E\u9875 ${wanted}`,
          tabs: listing
        };
      }
      const id = await currentPage(ctx2);
      return {
        ok: true,
        pinned_tab: wanted,
        context: {
          project: id.projectName,
          board: id.boardName,
          schematic_page: id.pageName,
          editor: id.editor
        },
        note: "\u540E\u7EED\u8C03\u7528\u90FD\u4F1A\u53D1\u5230\u8FD9\u4E2A\u9875\u9762\u3002\u5B83\u82E5\u88AB\u5173\u95ED\u6216\u5237\u65B0\u91CD\u8FDE\uFF0C\u9700\u8981\u91CD\u65B0\u9489\u3002"
      };
    }
  }
];

// src/tools/map-apply.ts
var ENSURE_SCH2 = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
var MARK = MAP_MARK;
var FLAG_OF = {
  signal: null,
  power: "Power",
  ground: "Ground",
  analog_ground: "AnalogGround",
  protect_ground: "ProtectGround"
};
var mapApplyTools = [
  {
    name: "eda_map_apply",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u6309\u5730\u56FE\u91CD\u65B0\u5E03\u5C40\u5E76\u91CD\u753B\u6574\u5F20\u539F\u7406\u56FE\u3002\n\n\u6D41\u7A0B\uFF1A\u5206\u7EC4\u5E03\u5C40\uFF08\u6BCF\u7EC4\u5148\u5728\u4E00\u7247\u7A7A\u5730\u4E0A\u72EC\u7ACB\u4F18\u5316\uFF0C\u518D\u4F5C\u4E3A\u6574\u4F53\u62FC\u63A5\uFF09\u2192 A\\* \u6B63\u4EA4\u5E03\u7EBF \u2192 \u6E32\u67D3\u5668\u4EF6\u3001\u5BFC\u7EBF\u3001\u7535\u6E90\u5730\u7B26\u53F7\u3001\u8DE8\u533A\u7AEF\u53E3\u3001\u5206\u533A\u6846\u4E0E\u6807\u9898 \u2192 \u628A\u7ED3\u679C\u5199\u56DE\u5730\u56FE\u3002\n\n**AI \u53EA\u9700\u8981\u628A\u8BED\u4E49\u5199\u5BF9**\uFF1A\u8C01\u8FDE\u8C01\u3001\u8C01\u5C5E\u4E8E\u54EA\u4E2A\u533A\u3001\u6BCF\u6761\u7F51\u7EDC\u662F\u4FE1\u53F7\u8FD8\u662F\u7535\u6E90\u5730\u3002\u4F4D\u7F6E\u3001\u89D2\u5EA6\u3001\u8D70\u7EBF\u3001\u6587\u5B57\u6446\u653E\u90FD\u7531\u7B97\u6CD5\u51B3\u5B9A\u3002\n\n\u60F3\u6309\u9605\u8BFB\u4E60\u60EF\u5E72\u9884\u5206\u533A\u4F4D\u7F6E\uFF08\u4FE1\u53F7\u4ECE\u5DE6\u5F80\u53F3\u3001\u7535\u6E90\u5728\u5DE6\u4E0A\u3001\u63A5\u53E3\u8D34\u8FB9\u7F18\uFF09\uFF0C\u5728\u5730\u56FE\u7684 group \u4E0A\u7ED9 anchor \u2014\u2014 \u7ED9\u4E86 anchor \u7684\u533A\u4F1A\u88AB\u9501\u6B7B\uFF0C\u6CA1\u7ED9\u7684\u7B97\u6CD5\u81EA\u5DF1\u5B89\u6392\u3002\u7EC4\u5185\u5E03\u5C40\u4E0D\u63A5\u53D7\u5E72\u9884\uFF0C\u90A3\u662F\u7EAF\u51E0\u4F55\uFF0C\u7B97\u6CD5\u6BD4\u624B\u7B97\u51C6\u3002\n\n\u4F1A\u6E05\u6389\u5F53\u524D\u9875\u7684\u5BFC\u7EBF\u4E0E\u7535\u6E90\u5730\u7B26\u53F7\u91CD\u753B\u3002\u5148\u7528 dry_run \u770B\u6307\u6807\u518D\u51B3\u5B9A\u662F\u5426\u843D\u5730\u3002",
    inputSchema: {
      type: "object",
      properties: {
        map: { type: "object", description: "\u5730\u56FE\uFF1B\u4E0D\u4F20\u5219\u8BFB\u56FE\u7EB8\u91CC\u5B58\u7684\u90A3\u4EFD" },
        iterations: { type: "number", description: "\u6BCF\u7EC4\u9000\u706B\u8FED\u4EE3\u6B21\u6570\uFF0C\u9ED8\u8BA4 20000" },
        dry_run: { type: "boolean", description: "\u53EA\u7B97\u4E0D\u753B\uFF0C\u5148\u770B\u80FD\u4F18\u5316\u5230\u4EC0\u4E48\u7A0B\u5EA6" },
        trace: {
          type: "boolean",
          description: "\u8FC7\u7A0B\u65E5\u5FD7\uFF0C**\u9ED8\u8BA4\u5F00**\u3002\u8FD4\u56DE\u91CC\u7684 trace.issues \u4F1A\u76F4\u63A5\u6307\u51FA\u662F\u54EA\u4E00\u6B65\u51FA\u7684\u95EE\u9898\uFF08\u5F15\u811A\u7AEF\u70B9\u6CA1\u5BF9\u4E0A\u3001\u7F51\u7EDC\u88AB\u8DF3\u8FC7\u3001\u67D0\u6B65\u5199\u5931\u8D25\uFF09\uFF0C\u4E0D\u7528\u56DE\u5934\u7FFB\u4EE3\u7801\u731C\u3002trace_full=true \u65F6\u8FDE\u6B63\u5E38\u6D41\u6C34\u4E00\u8D77\u8FD4\u56DE\u3002"
        },
        trace_full: { type: "boolean", description: "\u8FD4\u56DE\u5B8C\u6574\u6D41\u6C34\u800C\u4E0D\u53EA\u662F\u95EE\u9898\u884C\uFF0C\u9ED8\u8BA4 false" },
        layer: {
          type: "number",
          description: "\u53EA\u6E32\u67D3\u7B2C N \u5C42\uFF08\u9010\u5C42\u9012\u8FDB\uFF0C\u89C1 design.md \xA74.11\uFF09\u3002**\u524D\u9762\u6240\u6709\u5C42\u5DF2\u5360\u7684\u5730\u76D8\u4F1A\u4F5C\u4E3A\u969C\u788D**\u4F20\u7ED9\u5E03\u5C40\u4E0E\u5E03\u7EBF \u2014\u2014 \u8FD9\u4E00\u5C42\u7684\u5668\u4EF6\u88AB\u7B97\u6CD5\u6321\u5728\u5916\u9762\uFF0C\u4E0D\u4F1A\u538B\u5230\u5DF2\u7ECF\u753B\u597D\u7684\u90E8\u5206\u3002\u5668\u4EF6\u7684\u5C42\u53F7\u5199\u5728\u5730\u56FE\u7684 part.layer \u4E0A\uFF0C\u4E0D\u5199\u5C31\u662F\u7B2C 1 \u5C42\u3002\n\n\u914D\u5408 incremental \u4F7F\u7528\uFF1A\u7B2C 1 \u5C42\u5168\u91CF\u6E32\u67D3\uFF0C\u4E4B\u540E\u6BCF\u5C42\u90FD\u52A0 incremental \u4FDD\u4F4F\u524D\u9762\u7684\u6210\u679C\u3002\u4E0D\u4F20 layer \u5C31\u662F\u8001\u884C\u4E3A\uFF0C\u4E00\u6B21\u753B\u5B8C\u6240\u6709\u5668\u4EF6\u3002"
        },
        incremental: {
          type: "boolean",
          description: "\u589E\u91CF\u6E32\u67D3\uFF1A**\u4E0D\u6E05\u573A**\uFF0C\u53EA\u628A\u8FD9\u4E00\u6B21\u7B97\u51FA\u6765\u7684\u4E1C\u897F\u753B\u4E0A\u53BB\uFF0C\u4FDD\u7559\u56FE\u4E0A\u5DF2\u6709\u7684\u56FE\u5143\u3002\u9010\u5C42\u9012\u8FDB\u65F6\u5FC5\u987B\u5F00\uFF08\u5426\u5219\u7B2C\u4E8C\u5C42\u4F1A\u628A\u7B2C\u4E00\u5C42\u62B9\u6389\uFF09\uFF1B\u9ED8\u8BA4 false\uFF0C\u5373\u7167\u65E7\u6E05\u7A7A\u91CD\u753B\u3002"
        },
        save_map: { type: "boolean", description: "\u662F\u5426\u628A\u4F18\u5316\u7ED3\u679C\u5199\u56DE\u5730\u56FE\uFF0C\u9ED8\u8BA4 true" }
      }
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const iterations = typeof args.iterations === "number" ? args.iterations : 2e4;
      const dryRun = args.dry_run === true;
      const trace = new Trace(args.trace !== false);
      const traceFull = args.trace_full === true;
      const incremental = args.incremental === true;
      const layer = typeof args.layer === "number" ? args.layer : null;
      const saveMap = args.save_map !== false;
      let map = args.map;
      if (!map) {
        const loaded = await ctx2.exec(
          `
					${ENSURE_SCH2}
					const MARK = ${JSON.stringify(MARK)};
					const all = await eda.sch_PrimitiveText.getAll();
					for (const t of all) {
						const c = String(t.content || '');
						if (c.indexOf(MARK) === 0) return { raw: c.slice(MARK.length) };
					}
					return { raw: null };
				`,
          6e4
        );
        if (loaded.error) return { error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875" };
        if (!loaded.raw) return { error: "\u6CA1\u4F20 map\uFF0C\u56FE\u7EB8\u91CC\u4E5F\u6CA1\u6709\u5730\u56FE\u3002\u5148\u8DD1 eda_map_import \u751F\u6210\u4E00\u4EFD\u3002" };
        map = unpackMap(loaded.raw);
      }
      const layerOf = (p) => p.layer ?? 1;
      const thisLayer = layer == null ? map.parts : map.parts.filter((p) => layerOf(p) === layer);
      const priorLayers = layer == null ? [] : map.parts.filter((p) => layerOf(p) < layer);
      if (layer != null && !thisLayer.length) {
        return { error: `\u7B2C ${layer} \u5C42\u6CA1\u6709\u4EFB\u4F55\u5668\u4EF6\u3002\u5730\u56FE\u91CC\u7684 part.layer \u662F\u591A\u5C11\uFF1F\u4E0D\u5199\u9ED8\u8BA4\u662F 1\u3002` };
      }
      const parts = /* @__PURE__ */ new Map();
      const assign = /* @__PURE__ */ new Map();
      const titles = /* @__PURE__ */ new Map();
      const idToPrimitive = /* @__PURE__ */ new Map();
      for (const p of thisLayer) {
        if (!p.id.trim()) continue;
        parts.set(p.id, {
          id: p.id,
          w: p.w,
          h: p.h,
          fixed: p.fixed === true,
          pins: p.pins.map((q) => ({ id: q.id, dx: q.dx, dy: q.dy, dir: q.dir })),
          labels: (p.labels ?? []).filter((l) => l.text).map((l) => ({ text: l.text, dx: l.dx, dy: l.dy }))
        });
        if (p.group) assign.set(p.id, p.group);
        if (p.primitiveId) idToPrimitive.set(p.id, p.primitiveId);
      }
      for (const g of map.groups) titles.set(g.id, { title: g.title, note: g.note });
      const anchors = /* @__PURE__ */ new Map();
      for (const g of map.groups) if (g.anchor) anchors.set(g.id, g.anchor);
      const layoutNets = map.nets.filter((n) => n.kind === "signal" && n.pins.length >= 2).map((n) => ({ id: n.id, pins: n.pins }));
      const styleOf = (n) => n.style ?? defaultStyle(n.kind);
      const wireNetIds = new Set(map.nets.filter((n) => styleOf(n) === "wire").map((n) => n.id));
      const wireNets = layoutNets.filter((n) => wireNetIds.has(n.id));
      const symbolNets = map.nets.filter((n) => styleOf(n) === "symbol");
      const portNets = map.nets.filter((n) => styleOf(n) === "port");
      const stubNets = [...symbolNets, ...portNets];
      for (const n of stubNets) {
        const up = n.kind === "power";
        for (const ref of n.pins) {
          const dot = ref.lastIndexOf(".");
          if (dot <= 0) continue;
          const part = parts.get(ref.slice(0, dot));
          if (!part) continue;
          const pinId = ref.slice(dot + 1);
          part.stubPins = [...part.stubPins ?? [], pinId];
          if (up) part.stubUp = [...part.stubUp ?? [], pinId];
        }
      }
      const stubOf = (p) => {
        const pins = [];
        const up = [];
        for (const n of stubNets) {
          for (const ref of n.pins) {
            const dot = ref.lastIndexOf(".");
            if (dot <= 0 || ref.slice(0, dot) !== p.id) continue;
            const pid = ref.slice(dot + 1);
            pins.push(pid);
            if (n.kind === "power") up.push(pid);
          }
        }
        return { pins, up };
      };
      const obstacles = priorLayers.filter((p) => p.id.trim()).map((p) => {
        const st = stubOf(p);
        const part = {
          id: p.id,
          w: p.w,
          h: p.h,
          pins: p.pins.map((q) => ({ id: q.id, dx: q.dx, dy: q.dy, dir: q.dir })),
          stubPins: st.pins.length ? st.pins : void 0,
          stubUp: st.up.length ? st.up : void 0
        };
        return effectiveBox(part, {
          x: p.place.x,
          y: p.place.y,
          rot: p.place.rot,
          mirror: p.place.mirror
        });
      });
      if (obstacles.length) {
        trace.at("\u5206\u5C42");
        trace.log(`\u7B2C ${layer} \u5C42\uFF1A\u672C\u5C42 ${thisLayer.length} \u4E2A\u5668\u4EF6\uFF0C\u524D\u9762\u5C42 ${obstacles.length} \u5757\u5730\u76D8\u4F5C\u4E3A\u969C\u788D`, {});
      }
      const t0 = Date.now();
      const res = layoutByGroups(parts, layoutNets, assign, titles, {
        iterations,
        sheet: map.meta.sheet,
        anchors: anchors.size ? anchors : void 0,
        obstacles: obstacles.length ? obstacles : void 0
      });
      const elapsed = Date.now() - t0;
      const moves = [];
      for (const [des, pl] of res.layout) {
        const pid = idToPrimitive.get(des);
        if (pid) moves.push({ id: pid, x: pl.x, y: pl.y, rotation: pl.rot, mirror: pl.mirror });
      }
      const wires = res.routed.nets.filter((n) => wireNetIds.has(n.netId)).flatMap((n) => n.paths.map((p) => ({ net: n.netId, points: p.flat() })));
      trace.at("\u5730\u56FE");
      trace.log(`\u5668\u4EF6 ${parts.size}\uFF0C\u7F51\u7EDC ${map.nets.length}`, {
        \u753B\u7EBF: wireNets.length,
        \u7B26\u53F7: symbolNets.length,
        \u8DE8\u533A\u7AEF\u53E3: res.crossGroupNets.length
      });
      for (const n of map.nets) {
        const style = n.style ?? defaultStyle(n.kind);
        if (style !== "wire" && n.kind === "signal") {
          trace.log(`\u7F51\u7EDC ${n.id} \u4E0D\u753B\u5BFC\u7EBF\uFF08style=${style}\uFF09`, { \u5F15\u811A: n.pins });
        }
        if (n.pins.length < 2) trace.warn(`\u7F51\u7EDC ${n.id} \u53EA\u6709 ${n.pins.length} \u4E2A\u5F15\u811A\uFF0C\u8FDE\u4E0D\u6210`, {});
      }
      trace.at("\u5206\u7EC4\u5E03\u5C40");
      for (const g of res.groups) {
        trace.log(`\u533A ${g.id}`, {
          \u5C3A\u5BF8: `${g.maxX - g.minX}\xD7${g.maxY - g.minY}`,
          \u6846: [g.minX, g.minY, g.maxX, g.maxY]
        });
      }
      for (const a of res.groups) {
        for (const b of res.groups) {
          if (a.id >= b.id) continue;
          const hit = a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
          if (hit) trace.error(`\u5206\u533A\u6846 ${a.id} \u4E0E ${b.id} \u91CD\u53E0`, { a: [a.minX, a.minY, a.maxX, a.maxY], b: [b.minX, b.minY, b.maxX, b.maxY] });
        }
      }
      for (const w of res.warnings) trace.warn(w, {});
      const pinXY = /* @__PURE__ */ new Map();
      for (const [des, pl] of res.layout) {
        const part = parts.get(des);
        if (!part) continue;
        for (const pin of part.pins) {
          const w = pinWorld(part, pl, pin);
          pinXY.set(`${des}.${pin.id}`, { x: w.x, y: w.y });
        }
      }
      const endpointBad = checkRouteEndpoints(
        trace,
        res.routed.nets.filter((n) => wireNetIds.has(n.netId)).map((n) => ({
          id: n.netId,
          pins: wireNets.find((w) => w.id === n.netId)?.pins ?? [],
          paths: n.paths
        })),
        pinXY
      );
      const q5 = (v) => Math.round(v / 5) * 5;
      const clusters = /* @__PURE__ */ new Map();
      for (const n of [...symbolNets, ...portNets]) {
        const isPort = (n.style ?? defaultStyle(n.kind)) === "port";
        const kind = isPort ? "BI" : FLAG_OF[n.kind];
        if (!kind) continue;
        for (const ref of n.pins) {
          const dot = ref.lastIndexOf(".");
          if (dot <= 0) continue;
          const des = ref.slice(0, dot);
          const part = parts.get(des);
          const pl = res.layout.get(des);
          if (!part || !pl) continue;
          const pin = part.pins.find((q) => q.id === ref.slice(dot + 1));
          if (!pin) continue;
          const w = pinWorld(part, pl, pin);
          const [vx, vy] = dirVec(w.dir);
          const key2 = `${des}|${vx},${vy}`;
          clusters.set(key2, [
            ...clusters.get(key2) ?? [],
            { what: isPort ? "port" : "flag", kind, net: n.id, x: w.x, y: w.y, vx, vy, pinCount: part.pins.length }
          ]);
        }
      }
      const flags = [];
      const ports = [];
      const takenSpots = /* @__PURE__ */ new Set();
      const spotKey = (x, y) => `${Math.round(x / 45)},${Math.round(y / 45)}`;
      const flagRotOf = (g) => {
        if (g.what === "port") {
          if (g.vx < 0) return 90;
          if (g.vx > 0) return 270;
          if (g.vy > 0) return 180;
          return 0;
        }
        if (g.kind === "Power") return 180;
        return 0;
      };
      const occupiedCells = /* @__PURE__ */ new Map();
      const cellsAlong = (x1, y1, x2, y2) => {
        const out = [];
        const ax = q5(x1);
        const ay = q5(y1);
        const bx = q5(x2);
        const by = q5(y2);
        const steps2 = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) / 5;
        const sx = Math.sign(bx - ax);
        const sy = Math.sign(by - ay);
        for (let i = 0; i <= steps2; i += 1) out.push(`${ax + sx * i * 5},${ay + sy * i * 5}`);
        return out;
      };
      const flagCells = (x, y, rot) => {
        const half = FLAG_WIDE / 2;
        let x0 = x;
        let x1 = x;
        let y0 = y;
        let y1 = y;
        if (rot === 0) {
          x0 = x - half;
          x1 = x + half;
          y0 = y - FLAG_LONG;
          y1 = y;
        } else if (rot === 180) {
          x0 = x - half;
          x1 = x + half;
          y0 = y;
          y1 = y + FLAG_LONG;
        } else if (rot === 90) {
          x0 = x - FLAG_LONG;
          x1 = x;
          y0 = y - half;
          y1 = y + half;
        } else {
          x0 = x;
          x1 = x + FLAG_LONG;
          y0 = y - half;
          y1 = y + half;
        }
        const out = [];
        for (let px = q5(x0); px <= q5(x1); px += 5) {
          for (let py = q5(y0); py <= q5(y1); py += 5) out.push(`${px},${py}`);
        }
        return out;
      };
      for (const group of clusters.values()) {
        const horizontal = group[0]?.vx !== 0;
        group.sort((a, b) => horizontal ? a.y - b.y : a.x - b.x);
        const mid = (group.length - 1) / 2;
        group.forEach((g, idx) => {
          const rot = flagRotOf(g);
          const maxLen = FAN_BASE + (idx + 3) * FAN_STEP;
          let len = FAN_BASE + idx * FAN_STEP;
          let ex = g.x;
          let ey = g.y;
          let cells = [];
          let placedOut = false;
          while (len <= maxLen) {
            const tx = q5(g.x + g.vx * len);
            const ty = q5(g.y + g.vy * len);
            const path = [...cellsAlong(g.x, g.y, tx, ty), ...flagCells(tx, ty, rot)];
            const clash = takenSpots.has(spotKey(tx, ty)) || path.some((c) => {
              const owner = occupiedCells.get(c);
              return owner != null && owner !== g.net;
            });
            if (!clash) {
              ex = tx;
              ey = ty;
              cells = path;
              placedOut = true;
              break;
            }
            len += FAN_STEP;
          }
          if (!placedOut) {
            ex = q5(g.x);
            ey = q5(g.y);
            cells = flagCells(ex, ey, rot);
          }
          takenSpots.add(spotKey(ex, ey));
          for (const c of cells) occupiedCells.set(c, g.net);
          const placed = { kind: g.kind, net: g.net, x: g.x, y: g.y, ex, ey, rot };
          if (g.what === "port") ports.push({ ...placed, dir: "BI" });
          else flags.push(placed);
        });
      }
      const summary = {
        parts: parts.size,
        wire_nets: wireNets.length,
        symbol_nets: symbolNets.length,
        cross_group_nets: res.crossGroupNets,
        groups: res.groups.map((g) => ({
          id: g.id,
          title: g.title,
          box: [g.minX, g.minY, g.maxX, g.maxY],
          size: `${g.maxX - g.minX}\xD7${g.maxY - g.minY}`
        })),
        per_group: res.perGroup,
        wire_length: res.routed.totalLength,
        bends: res.routed.totalBends,
        unrouted: res.routed.failedCount,
        elapsed_ms: elapsed,
        rotated: [...res.layout.values()].filter((p) => p.rot === 90 || p.rot === 270).length,
        warnings: res.warnings
      };
      const traceOut = () => ({
        trace: trace.enabled ? { ...trace.summary(), ...traceFull ? { full: trace.format() } : {} } : void 0
      });
      if (dryRun) {
        return {
          ...summary,
          ...traceOut(),
          endpoint_mismatches: endpointBad,
          dry_run: true,
          note: endpointBad > 0 ? `\u53EA\u7B97\u4E86\u6CA1\u753B\u3002**\u4F46\u6709 ${endpointBad} \u4E2A\u5F15\u811A\u7AEF\u70B9\u6CA1\u843D\u5728\u81EA\u5DF1\u7684\u7EBF\u4E0A** \u2014\u2014 \u770B trace.lines\uFF0C\u753B\u4E0A\u53BB\u4E5F\u662F\u65AD\u7684\u3002` : "\u53EA\u7B97\u4E86\u6CA1\u753B\u3002\u53BB\u6389 dry_run \u624D\u4F1A\u843D\u5230\u56FE\u4E0A\u3002"
        };
      }
      const steps = {};
      const runStep = async (name, code, timeout = 12e4) => {
        trace.at(`\u6E32\u67D3:${name}`);
        try {
          const r = await ctx2.exec(`${ENSURE_SCH2}${code}`, timeout);
          steps[name] = r;
          if (r && typeof r === "object" && "error" in r) trace.error(`\u8FD9\u4E00\u6B65\u8FD4\u56DE\u4E86\u9519\u8BEF`, r);
          else trace.log("\u5B8C\u6210", r);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          steps[name] = { failed: msg };
          trace.error(`\u8FD9\u4E00\u6B65\u629B\u9519\uFF0C\u540E\u9762\u7684\u6B65\u9AA4\u4F1A\u5728\u6B8B\u56FE\u4E0A\u7EE7\u7EED`, { error: msg });
        }
      };
      const before = await census(ctx2).catch(() => null);
      if (incremental) {
        trace.at("\u6E05\u573A");
        trace.log("\u589E\u91CF\u6A21\u5F0F\uFF0C\u8DF3\u8FC7\u6E05\u573A", {});
      } else {
        await runStep(
          "\u6E05\u5BFC\u7EBF",
          `
					const ids = (await eda.sch_PrimitiveWire.getAll()).map(function (w) { return w.primitiveId; });
					if (ids.length) await eda.sch_PrimitiveWire.delete(ids);
					return { removed: ids.length };
				`
        );
        await runStep(
          "\u6E05\u7B26\u53F7\u4E0E\u7AEF\u53E3",
          `
					const ids = (await eda.sch_PrimitiveComponent.getAll())
						.filter(function (c) { return c.componentType === 'netflag' || c.componentType === 'netport'; })
						.map(function (c) { return c.primitiveId; });
					if (ids.length) await eda.sch_PrimitiveComponent.delete(ids);
					return { removed: ids.length };
				`
        );
        await runStep(
          "\u6E05\u65E7\u533A\u6846\u4E0E\u6587\u5B57",
          `
					const MARKTXT = ${JSON.stringify(MARK)};
					const rects = (await eda.sch_PrimitiveRectangle.getAll()).map(function (x) { return x.primitiveId; });
					if (rects.length) await eda.sch_PrimitiveRectangle.delete(rects);
					// \u5730\u56FE\u90A3\u6761\u6587\u5B57\u8981\u7559\u7740\uFF0C\u9760\u6807\u8BB0\u8BA4\u51FA\u6765
					const texts = (await eda.sch_PrimitiveText.getAll())
						.filter(function (x) { return String(x.content || '').indexOf(MARKTXT) !== 0; })
						.map(function (x) { return x.primitiveId; });
					if (texts.length) await eda.sch_PrimitiveText.delete(texts);
					return { rects: rects.length, texts: texts.length };
				`
        );
      }
      await runStep(
        "\u6446\u5668\u4EF6",
        `
				const MOVES = ${JSON.stringify(moves)};
				let n = 0;
				for (const m of MOVES) {
					const r = await eda.sch_PrimitiveComponent.modify(m.id, {
						x: m.x, y: m.y, rotation: m.rotation, mirror: m.mirror,
					});
					if (r !== false) n += 1;
				}
				return { moved: n, total: MOVES.length };
			`,
        18e4
      );
      trace.at("\u6446\u5668\u4EF6\u56DE\u8BFB");
      const wantPlaced = [...res.layout.entries()].filter(([des]) => idToPrimitive.has(des)).map(([des, pl]) => ({ designator: des, x: pl.x, y: pl.y, rotation: pl.rot }));
      const placedCheck = await verifyPlaced(ctx2, wantPlaced).catch((e) => {
        trace.error("\u56DE\u8BFB\u5668\u4EF6\u4F4D\u7F6E\u5931\u8D25", { error: e instanceof Error ? e.message : String(e) });
        return null;
      });
      if (placedCheck) {
        if (placedCheck.allOk) {
          trace.log(`${wantPlaced.length} \u4E2A\u5668\u4EF6\u7684\u4F4D\u7F6E\u4E0E\u89D2\u5EA6\u5DF2\u56DE\u8BFB\u786E\u8BA4`, {});
        } else {
          trace.error("\u5668\u4EF6\u6CA1\u6446\u5230\u7B97\u6CD5\u8981\u6C42\u7684\u4F4D\u7F6E \u2014\u2014 \u540E\u9762\u7684\u8D70\u7EBF\u4F1A\u6210\u7247\u5BF9\u4E0D\u4E0A\u5F15\u811A", {
            \u6982\u51B5: placedCheck.summary,
            \u660E\u7EC6: placedCheck.checks.filter((c) => !c.ok).slice(0, 8)
          });
        }
      }
      await runStep(
        "\u753B\u5BFC\u7EBF",
        `
				const WIRES = ${JSON.stringify(wires)};
				let n = 0;
				for (const w of WIRES) {
					if (await eda.sch_PrimitiveWire.create(w.points, w.net)) n += 1;
				}
				return { drawn: n, total: WIRES.length };
			`,
        18e4
      );
      await runStep(
        "\u653E\u7535\u6E90\u5730\u7B26\u53F7",
        `
				const FLAGS = ${JSON.stringify(flags)};
				let n = 0;
				for (const f of FLAGS) {
					// \u5F15\u51FA\u7EBF\u4E0D\u5E26\u7F51\u7EDC\u540D \u2014\u2014 \u5E26\u4E86\u4F1A\u8BA9\u5BFC\u7EBF\u7684 NET \u6807\u7B7E\u548C\u7B26\u53F7\u540D\u628A\u540C\u4E00\u4E2A
					// \u7F51\u7EDC\u540D\u753B\u4E24\u904D\u3002\u6CBF\u5F15\u811A\u65B9\u5411\u4E00\u6761\u76F4\u7EBF\uFF0C\u4E0D\u8F6C\u5411\u3002
					// \u9000\u5316\u6210\u8D34\u5F15\u811A\u65F6 ex/ey \u5C31\u662F\u5F15\u811A\u672C\u8EAB\uFF0C\u4E0D\u5FC5\u753B\u96F6\u957F\u5EA6\u7684\u7EBF
					if (f.ex !== f.x || f.ey !== f.y) {
						await eda.sch_PrimitiveWire.create([f.x, f.y, f.ex, f.ey]).catch(() => {});
					}
					if (await eda.sch_PrimitiveComponent.createNetFlag(f.kind, f.net, f.ex, f.ey, f.rot)) n += 1;
				}
				return { drawn: n, total: FLAGS.length };
			`,
        18e4
      );
      await runStep(
        "\u653E\u8DE8\u533A\u7AEF\u53E3",
        `
				const PORTS = ${JSON.stringify(ports)};
				let n = 0;
				for (const p of PORTS) {
					if (p.ex !== p.x || p.ey !== p.y) {
						await eda.sch_PrimitiveWire.create([p.x, p.y, p.ex, p.ey]).catch(() => {});
					}
					if (await eda.sch_PrimitiveComponent.createNetPort(p.dir, p.net, p.ex, p.ey, p.rot)) n += 1;
				}
				return { drawn: n, total: PORTS.length };
			`,
        18e4
      );
      await runStep(
        "\u753B\u533A\u6846\u4E0E\u6807\u9898",
        `
				const GROUPS = ${JSON.stringify(res.groups)};
				let n = 0;
				for (const g of GROUPS) {
					// create(topLeftX, topLeftY, width, height)\uFF0Cy \u8F74\u5411\u4E0A\u6240\u4EE5 topLeft \u53D6\u8F83\u5927\u7684 y
					const rc = await eda.sch_PrimitiveRectangle.create(g.minX, g.maxY, g.maxX - g.minX, g.maxY - g.minY);
					if (rc) {
						await eda.sch_PrimitiveRectangle.modify(rc.primitiveId, { color: '#5B7FA6', lineWidth: 2, lineType: 1 }).catch(() => {});
						n += 1;
					}
					// create(x, y, text)\uFF0C\u5750\u6807\u5728\u524D\u3002\u6807\u9898\u5199\u6846\u5185\uFF0C\u5199\u6846\u5916\u4F1A\u6389\u51FA\u56FE\u7EB8
					if (g.title) await eda.sch_PrimitiveText.create(g.minX + 15, g.maxY - 25, g.title).catch(() => {});
					if (g.note) await eda.sch_PrimitiveText.create(g.minX + 15, g.maxY - 45, g.note).catch(() => {});
				}
				return { drawn: n };
			`,
        18e4
      );
      const applied = { steps };
      let mapSaved = null;
      if (saveMap) {
        for (const p of map.parts) {
          const pl = res.layout.get(p.id);
          if (pl) {
            p.place = { x: pl.x, y: pl.y, rot: pl.rot, mirror: pl.mirror };
            if (pl.labelSlots && p.labels) {
              const swap = pl.rot === 90 || pl.rot === 270;
              const halfW = (swap ? p.h : p.w) / 2;
              const halfH = (swap ? p.w : p.h) / 2;
              p.labels.forEach((l, i) => {
                const s = LABEL_SLOTS[(pl.labelSlots?.[i] ?? 0) % LABEL_SLOTS.length];
                if (s) {
                  l.dx = s.fx * (halfW + 12);
                  l.dy = s.fy * (halfH + 12);
                }
              });
            }
          }
        }
        for (const g of map.groups) {
          const box = res.groups.find((x) => x.id === g.id);
          if (box) g.box = { minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY };
        }
        for (const n of map.nets) {
          const r = res.routed.nets.find((x) => x.netId === n.id);
          if (r) n.routes = r.paths;
        }
        map.meta.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        const payload = packMap(map);
        mapSaved = await ctx2.exec(
          `${ENSURE_SCH2}${saveMapCode(packMap(map), -400, -400)}`,
          12e4
        );
      }
      const after = before ? await census(ctx2).catch(() => null) : null;
      const diff = before && after ? diffCensus(before, after) : null;
      const notes = [];
      if (res.routed.failedCount > 0) {
        notes.push(
          `${res.routed.failedCount} \u6761\u8FDE\u63A5\u6CA1\u8D70\u901A\uFF0C\u591A\u534A\u662F\u5206\u533A\u4E4B\u95F4\u6CA1\u7559\u591F\u901A\u9053 \u2014\u2014 \u52A0\u5927 iterations\uFF0C\u6216\u7ED9\u5206\u533A\u6362\u4E2A anchor\u3002`
        );
      } else {
        notes.push("\u5E03\u5C40\u3001\u8D70\u7EBF\u3001\u7B26\u53F7\u3001\u5206\u533A\u6846\u90FD\u5DF2\u91CD\u753B\uFF0C\u7ED3\u679C\u5DF2\u5199\u56DE\u5730\u56FE\u3002\u6587\u5B57\u4F4D\u7F6E\u7B97\u8FC7\u4F46\u843D\u4E0D\u5230\u56FE\u4E0A\uFF08EDA \u4E0D\u5F00\u653E\u5C5E\u6027\u6587\u5B57\u7684\u4F4D\u7F6E\u4FEE\u6539\uFF09\u3002");
      }
      if (diff && !diff.changed) {
        notes.push("**\u56FE\u7EB8\u5185\u5BB9\u6458\u8981\u524D\u540E\u6CA1\u53D8 \u2014\u2014 \u8FD9\u4E00\u8D9F\u5F88\u53EF\u80FD\u4E00\u6B65\u90FD\u6CA1\u751F\u6548**\uFF0C\u9010\u6761\u770B steps \u91CC\u6709\u6CA1\u6709 failed\u3002");
      }
      if (endpointBad > 0) {
        notes.push(`**${endpointBad} \u4E2A\u5F15\u811A\u7AEF\u70B9\u6CA1\u843D\u5728\u81EA\u5DF1\u7684\u7EBF\u4E0A**\uFF0C\u56FE\u4E0A\u770B\u7740\u8FDE\u4E86\u5B9E\u9645\u662F\u65AD\u7684 \u2014\u2014 \u770B trace.lines\u3002`);
      }
      return {
        ...summary,
        ...applied,
        ...traceOut(),
        endpoint_mismatches: endpointBad,
        parts_placed_verified: placedCheck ? placedCheck.allOk : null,
        map_saved: mapSaved,
        census_diff: diff ? { delta: diff.delta, changed: diff.changed, summary: diff.summary } : void 0,
        note: notes.join(" ")
      };
    }
  }
];

// src/tools/map-tool.ts
var ENSURE_SCH3 = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
var MARK2 = MAP_MARK;
var MAP_X = -400;
var MAP_Y = -400;
var mapTools = [
  {
    name: "eda_map_save",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u628A\u539F\u7406\u56FE\u5730\u56FE\u5B58\u8FDB\u5F53\u524D\u9875\u3002\n\n\u5730\u56FE\u662F\u8FD9\u5F20\u56FE\u7684\u771F\u76F8\u6E90\uFF1A\u5668\u4EF6\u51E0\u4F55\u3001\u5F15\u811A\u3001\u8FDE\u63A5\u3001\u5206\u533A\u3001\u7F51\u7EDC\u6027\u8D28\u5168\u5728\u91CC\u9762\u3002\u5B58\u8FDB\u56FE\u7EB8\u800C\u4E0D\u662F\u672C\u5730\u6587\u4EF6\uFF0C\u6362\u53F0\u673A\u5668\u3001\u522B\u4EBA\u6253\u5F00\u5DE5\u7A0B\u90FD\u8FD8\u5728\uFF0C\u624D\u8C08\u5F97\u4E0A\u4E0B\u6B21\u63A5\u7740\u4F18\u5316\u3002\n\n\u5199\u5165\u524D\u4F1A\u505A\u5F15\u7528\u6821\u9A8C\uFF08\u4F4D\u53F7\u662F\u5426\u91CD\u590D\u3001\u7F51\u7EDC\u5F15\u7528\u7684\u5F15\u811A\u662F\u5426\u5B58\u5728\u3001\u5206\u533A\u662F\u5426\u6709\u5B9A\u4E49\uFF09\uFF0C\u6709\u95EE\u9898\u76F4\u63A5\u62A5\u9519\u4E0D\u5199 \u2014\u2014 \u5B58\u8FDB\u53BB\u4E00\u4EFD\u81EA\u76F8\u77DB\u76FE\u7684\u5730\u56FE\uFF0C\u540E\u9762\u6BCF\u4E00\u6B65\u90FD\u4F1A\u8DDF\u7740\u9519\u3002",
    inputSchema: {
      type: "object",
      properties: {
        map: { type: "object", description: "\u5B8C\u6574\u7684\u5730\u56FE\u5BF9\u8C61\uFF0C\u7ED3\u6784\u89C1 src/layout/map.ts \u7684 SchematicMap" }
      },
      required: ["map"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const map = args.map;
      if (!map || typeof map !== "object") throw new Error("map \u5FC5\u987B\u662F\u5BF9\u8C61");
      const errs = validateMap(map);
      if (errs.length) return { ok: false, errors: errs, note: "\u5730\u56FE\u81EA\u8EAB\u6709\u77DB\u76FE\uFF0C\u6CA1\u6709\u5199\u5165\u3002\u9010\u6761\u4FEE\u6389\u518D\u5B58\u3002" };
      map.version = 1;
      map.meta = { ...map.meta ?? { sheet: { w: 1170, h: 825 }, grid: 10 }, updatedAt: (/* @__PURE__ */ new Date()).toISOString() };
      const payload = packMap(map);
      const r = await ctx2.exec(
        `${ENSURE_SCH3}${saveMapCode(payload, MAP_X, MAP_Y)}`,
        12e4
      );
      return {
        ...r,
        parts: map.parts.length,
        nets: map.nets.length,
        groups: map.groups.length,
        note: r.ok ? "\u5730\u56FE\u5DF2\u968F\u56FE\u7EB8\u4FDD\u5B58\u3002" : "\u5199\u56DE\u540E\u957F\u5EA6\u5BF9\u4E0D\u4E0A\uFF0C\u5730\u56FE\u53EF\u80FD\u88AB\u622A\u65AD\u4E86\u3002"
      };
    }
  },
  {
    name: "eda_map_load",
    description: "\u3010\u53EA\u8BFB\u3011\u8BFB\u56DE\u5B58\u5728\u5F53\u524D\u9875\u91CC\u7684\u539F\u7406\u56FE\u5730\u56FE\u3002\u6CA1\u6709\u5730\u56FE\u65F6\u8FD4\u56DE exists:false\uFF0C\u4E0D\u5F53\u4F5C\u9519\u8BEF \u2014\u2014 \u9996\u6B21\u4F7F\u7528\u6216\u4ECE\u522B\u5904\u5BFC\u5165\u7684\u56FE\u672C\u6765\u5C31\u6CA1\u6709\u3002",
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => {
      const r = await ctx2.exec(
        `
				${ENSURE_SCH3}
				const MARK = ${JSON.stringify(MARK2)};
				const all = await eda.sch_PrimitiveText.getAll();
				for (const t of all) {
					const c = String(t.content || '');
					if (c.indexOf(MARK) === 0) return { raw: c.slice(MARK.length) };
				}
				return { raw: null };
			`,
        6e4
      );
      if (r.error) return { error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875" };
      if (!r.raw) return { exists: false, map: EMPTY_MAP, note: "\u8FD9\u5F20\u56FE\u8FD8\u6CA1\u6709\u5730\u56FE\u3002\u7528 eda_map_import \u4ECE\u73B0\u6709\u56FE\u751F\u6210\u4E00\u4EFD\u3002" };
      try {
        const map = unpackMap(r.raw);
        return {
          exists: true,
          map,
          parts: map.parts?.length ?? 0,
          nets: map.nets?.length ?? 0,
          groups: map.groups?.length ?? 0
        };
      } catch (e) {
        return { exists: true, error: `\u5730\u56FE\u89E3\u6790\u5931\u8D25\uFF1A${e instanceof Error ? e.message : String(e)}`, raw_length: r.raw.length };
      }
    }
  },
  {
    name: "eda_map_import",
    description: "\u3010\u53EA\u8BFB\u3011\u4ECE\u5F53\u524D\u5DF2\u753B\u597D\u7684\u539F\u7406\u56FE\u53CD\u5411\u751F\u6210\u4E00\u4EFD\u5730\u56FE\uFF0C\u4E0D\u5FC5\u91CD\u753B\u3002\n\n\u5668\u4EF6\u51E0\u4F55\u3001\u5F15\u811A\u3001\u4F4D\u7F6E\u4ECE EDA \u8BFB\uFF08\u90A3\u662F\u5BA2\u89C2\u4E8B\u5B9E\uFF09\uFF1B\u5BFC\u7EBF\u4E0E\u7F51\u7EDC\u5F52\u5C5E\u4ECE\u6587\u6863\u6E90\u7801\u89E3\u6790 \u2014\u2014 `sch_Net.getAllNets()` \u5728\u6269\u5C55\u4E0A\u4E0B\u6587\u91CC\u8FD4\u56DE\u7A7A\uFF0C\u53EA\u80FD\u8D70 getDocumentSource\u3002\n\n**\u7F51\u7EDC\u6027\u8D28\uFF08\u4FE1\u53F7\uFF0F\u7535\u6E90\uFF0F\u5730\uFF09\u53EA\u6309\u540D\u5B57\u7ED9\u4E86\u4E2A\u731C\u6D4B**\uFF0CAI \u5FC5\u987B\u9010\u6761\u8FC7\u76EE\uFF1AAVDD_1V8 / VBAT_SW \u65E2\u50CF\u7535\u6E90\u53C8\u50CF\u4FE1\u53F7\uFF0CPWR_EN \u542C\u7740\u50CF\u7535\u6E90\u5176\u5B9E\u662F\u666E\u901A IO\u3002\u6539\u597D\u4E4B\u540E\u7528 eda_map_save \u5B58\u56DE\u53BB\u3002",
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => {
      const r = await ctx2.exec(
        `
				${ENSURE_SCH3}
				await new Promise((r) => setTimeout(r, 800));
				const src = await eda.sys_FileManager.getDocumentSource();
				const lines = String(src).split(String.fromCharCode(10));

				// \u5BFC\u7EBF\u7684\u7F51\u7EDC\u540D\u6302\u5728 ATTR(key=NET) \u4E0A\uFF0CparentId \u6307\u5411 WIRE
				const wireNet = {};
				for (const ln of lines) {
					if (ln.indexOf('"type":"ATTR"') < 0) continue;
					const q = ln.indexOf('||');
					if (q < 0) continue;
					let b = ln.slice(q + 2);
					const l = b.lastIndexOf('|');
					if (l >= 0) b = b.slice(0, l);
					let o = null;
					try { o = JSON.parse(b); } catch (e) { continue; }
					if (String(o.key) === 'NET') wireNet[String(o.parentId)] = String(o.value);
				}
				// LINE \u901A\u8FC7 lineGroup \u5F52\u5C5E\u5230 WIRE\uFF0C\u4E8E\u662F\u6BCF\u6BB5\u7EBF\u90FD\u77E5\u9053\u81EA\u5DF1\u5C5E\u4E8E\u54EA\u6761\u7F51\u7EDC
				const segs = [];
				for (const ln of lines) {
					if (ln.indexOf('"type":"LINE"') < 0) continue;
					const q = ln.indexOf('||');
					if (q < 0) continue;
					let b = ln.slice(q + 2);
					const l = b.lastIndexOf('|');
					if (l >= 0) b = b.slice(0, l);
					let o = null;
					try { o = JSON.parse(b); } catch (e) { continue; }
					if (o.startX == null) continue;
					const net = wireNet[String(o.lineGroup)];
					if (net) segs.push({ net: net, x1: o.startX, y1: -o.startY, x2: o.endX, y2: -o.endY });
				}

				const all = await eda.sch_PrimitiveComponent.getAll();
				const parts = [];
				const pinRefs = [];
				const skipped = [];
				for (const c of all) {
					if (c.componentType !== 'part') continue;
					const bb = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => null);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					const des = String(c.designator || '');
					// \u56FE\u7EB8\u6807\u9898\u680F\uFF08Drawing-Symbol_*\uFF09\u4E5F\u662F part\uFF0C\u4F46\u5B83\u6CA1\u6709\u5F15\u811A\uFF0C\u4F4D\u53F7\u4E5F\u662F\u7A7A\u7684\u3002
					// \u6536\u8FDB\u5730\u56FE\u4F1A\u8BA9 validateMap \u76F4\u63A5\u62D2\u6536\uFF08\u300C \u6CA1\u6709\u5F15\u811A\u300D\uFF09\uFF0C\u800C\u4E14\u5B83\u6839\u672C\u4E0D\u662F
					// \u7535\u8DEF\u7684\u4E00\u90E8\u5206 \u2014\u2014 \u5224\u636E\u548C\u4F53\u68C0\u90A3\u8FB9\u4E00\u81F4\uFF1A\u65E0\u5F15\u811A\u5373\u56FE\u7EB8\u88C5\u9970\u3002
					if (!pins || !pins.length || !des.trim()) {
						skipped.push({ primitiveId: c.primitiveId, xy: [c.x, c.y], reason: !des.trim() ? '\u4F4D\u53F7\u4E3A\u7A7A' : '\u6CA1\u6709\u5F15\u811A' });
						continue;
					}
					parts.push({
						id: des,
						primitiveId: c.primitiveId,
						name: String(c.name || ''),
						x: c.x, y: c.y,
						rot: ((Number(c.rotation) || 0) % 360 + 360) % 360,
						mirror: c.mirror === true,
						w: bb ? Math.max(10, bb.maxX - bb.minX) : 40,
						h: bb ? Math.max(10, bb.maxY - bb.minY) : 40,
						pins: (pins || []).map((p) => ({
							n: String(p.pinNumber != null ? p.pinNumber : p.number),
							name: String(p.pinName || ''),
							x: p.x, y: p.y,
							dir: ((Number(p.rotation) || 0) % 360 + 360) % 360,
						})),
					});
					for (const p of (pins || [])) {
						pinRefs.push({ ref: des + '.' + String(p.pinNumber != null ? p.pinNumber : p.number), x: p.x, y: p.y });
					}
				}

				// \u5F15\u811A\u843D\u5728\u54EA\u6761\u7EBF\u6BB5\u4E0A\uFF0C\u5C31\u5C5E\u4E8E\u54EA\u6761\u7F51\u7EDC\uFF08\u70B9\u5230\u7EBF\u6BB5\u8DDD\u79BB\uFF0CT \u578B\u5206\u652F\u4E5F\u7B97\uFF09
				const d2 = (px, py, s) => {
					const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
					const len2 = dx * dx + dy * dy;
					let t = len2 === 0 ? 0 : ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
					t = t < 0 ? 0 : t > 1 ? 1 : t;
					const qx = s.x1 + t * dx, qy = s.y1 + t * dy;
					return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
				};
				const nets = {};
				for (const pr of pinRefs) {
					for (const s of segs) {
						if (d2(pr.x, pr.y, s) < 2) {
							if (!nets[s.net]) nets[s.net] = [];
							if (nets[s.net].indexOf(pr.ref) < 0) nets[s.net].push(pr.ref);
							break;
						}
					}
				}
				// \u7535\u6E90\u5730\u548C\u7AEF\u53E3\u8981**\u4ECE\u7B26\u53F7\u53CD\u63A8**\uFF0C\u4E0D\u80FD\u9760\u5BFC\u7EBF\u7684\u7F51\u7EDC\u540D\u3002
				// \u7B26\u53F7\u7684\u5F15\u51FA\u7EBF\u662F\u523B\u610F\u4E0D\u5E26\u7F51\u7EDC\u540D\u7684\uFF08\u5E26\u4E86\u4F1A\u8BA9\u540C\u4E00\u4E2A\u7F51\u7EDC\u540D\u753B\u4E24\u904D\uFF0C
				// \u6324\u5728\u4E00\u5C0F\u6BB5\u7EBF\u7684\u4E24\u7AEF\uFF09\uFF0C\u6240\u4EE5\u90A3\u4E9B\u7EBF\u6BB5\u5728 wireNet \u91CC\u67E5\u4E0D\u5230\u5F52\u5C5E\u3002
				// \u505A\u6CD5\uFF1A\u628A\u6240\u6709\u7EBF\u6BB5\u5F53\u6210\u56FE\uFF0C\u4ECE\u7B26\u53F7\u5F15\u811A\u51FA\u53D1\u505A\u8FDE\u901A\u641C\u7D22\uFF0C
				// \u6CBF\u9014\u78B0\u5230\u7684\u5668\u4EF6\u5F15\u811A\u5C31\u5F52\u8FD9\u4E2A\u7B26\u53F7\u7684\u7F51\u7EDC\u3002
				// \u53EA\u6536**\u6CA1\u6709\u7F51\u7EDC\u540D**\u7684\u7EBF\u6BB5\u3002\u5E26\u540D\u5B57\u7684\u7EBF\u6BB5\u5DF2\u7ECF\u5C5E\u4E8E\u67D0\u6761\u5177\u4F53\u7F51\u7EDC\uFF0C
				// \u987A\u7740\u5B83\u7EE7\u7EED\u8D70\u5C31\u4F1A\u628A\u4E24\u6761\u65E0\u5173\u7F51\u7EDC\u4E32\u6210\u4E00\u6761 \u2014\u2014 \u5B9E\u6D4B +3V3 \u56E0\u6B64\u541E\u6389\u4E86
				// \u6574\u4E2A RESET \u7F51\u7EDC\u7684\u6210\u5458\u3002\u7B26\u53F7\u7684\u5F15\u51FA\u7EBF\u6070\u6070\u90FD\u662F\u4E0D\u5E26\u540D\u5B57\u7684\uFF0C\u591F\u7528\u3002
				const allSegs = [];
				for (const ln of lines) {
					if (ln.indexOf('"type":"LINE"') < 0) continue;
					const q = ln.indexOf('||');
					if (q < 0) continue;
					let b = ln.slice(q + 2);
					const l = b.lastIndexOf('|');
					if (l >= 0) b = b.slice(0, l);
					let o = null;
					try { o = JSON.parse(b); } catch (e) { continue; }
					if (o.startX == null) continue;
					if (wireNet[String(o.lineGroup)]) continue;
					allSegs.push({ x1: o.startX, y1: -o.startY, x2: o.endX, y2: -o.endY });
				}
				const near = (ax, ay, bx, by) => Math.abs(ax - bx) + Math.abs(ay - by) < 3;
				for (const c of all) {
					if (c.componentType !== 'netflag' && c.componentType !== 'netport') continue;
					const nm = String(c.name || '');
					if (!nm) continue;
					if (!nets[nm]) nets[nm] = [];
					const symPins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					// \u4ECE\u7B26\u53F7\u7684\u6BCF\u4E2A\u5F15\u811A\u51FA\u53D1\uFF0C\u987A\u7740\u7EBF\u6BB5\u4E00\u8DEF\u8D70
					const frontier = (symPins || []).map((p) => ({ x: p.x, y: p.y }));
					const seen = [];
					const usedSeg = {};
					let guard = 0;
					while (frontier.length && guard < 400) {
						guard += 1;
						const cur = frontier.pop();
						if (seen.some((s) => near(s.x, s.y, cur.x, cur.y))) continue;
						seen.push(cur);
						// \u843D\u5728\u8FD9\u4E2A\u70B9\u4E0A\u7684\u5668\u4EF6\u5F15\u811A
						for (const pr of pinRefs) {
							if (near(pr.x, pr.y, cur.x, cur.y) && nets[nm].indexOf(pr.ref) < 0) nets[nm].push(pr.ref);
						}
						// \u987A\u7740\u5171\u7AEF\u70B9\u7684\u7EBF\u6BB5\u7EE7\u7EED\u8D70
						for (let si = 0; si < allSegs.length; si++) {
							if (usedSeg[si]) continue;
							const s2 = allSegs[si];
							if (near(s2.x1, s2.y1, cur.x, cur.y)) {
								usedSeg[si] = 1;
								frontier.push({ x: s2.x2, y: s2.y2 });
							} else if (near(s2.x2, s2.y2, cur.x, cur.y)) {
								usedSeg[si] = 1;
								frontier.push({ x: s2.x1, y: s2.y1 });
							}
						}
					}
				}

				// \u56FE\u7EB8\u5C3A\u5BF8\uFF1A\u5148\u95EE titleBlockData\uFF0C\u8BFB\u4E0D\u5230\u5C31\u4ECE\u6587\u6863\u6E90\u7801\u91CC\u7FFB Width/Height \u7684
				// ATTR \u2014\u2014 \u90A3\u662F\u771F\u503C\u3002\u5B9E\u6D4B titleBlockData \u6709\u65F6\u6574\u4E2A\u662F\u7A7A\u7684\uFF0C\u4E00\u65E6\u9759\u9ED8
				// \u515C\u5E95\u6210 A4\uFF0C\u5E03\u5C40\u5C31\u6309\u9519\u8BEF\u7684\u56FE\u7EB8\u7B97\uFF0CA3 \u4E0A\u7684\u5668\u4EF6\u4F1A\u88AB\u5224\u6210\u653E\u4E0D\u4E0B\u3002
				const tb = _page.titleBlockData || {};
				const fromTb = function (k) {
					const v = tb[k] && tb[k].value;
					const n = Number(v);
					return isFinite(n) && n > 0 ? n : null;
				};
				const fromSrc = function (k) {
					for (const ln of lines) {
						if (ln.indexOf('"key":"' + k + '"') < 0) continue;
						const q = ln.indexOf('||');
						if (q < 0) continue;
						let b = ln.slice(q + 2);
						const l = b.lastIndexOf('|');
						if (l >= 0) b = b.slice(0, l);
						try {
							const o = JSON.parse(b);
							const n = Number(o.value);
							if (isFinite(n) && n > 0) return n;
						} catch (e) { /* \u8FD9\u4E00\u884C\u4E0D\u662F\u6211\u4EEC\u8981\u7684 */ }
					}
					return null;
				};
				const sheetW = fromTb('Width') || fromSrc('Width');
				const sheetH = fromTb('Height') || fromSrc('Height');
				return {
					sheet_source: sheetW ? (fromTb('Width') ? 'titleBlockData' : '\u6587\u6863\u6E90\u7801') : '\u8BFB\u4E0D\u5230\uFF0C\u7528\u4E86 A4 \u9ED8\u8BA4\u503C',
					sheet: { w: sheetW || 1170, h: sheetH || 825 },
					parts: parts,
					nets: nets,
					wire_segments: segs.length,
					skipped_decorations: skipped,
				};
			`,
        18e4
      );
      if (r.error) return { error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875" };
      const rawParts = r.parts ?? [];
      const rawNets = r.nets ?? {};
      const sheet = r.sheet ?? { w: 1170, h: 825 };
      const map = {
        version: 1,
        meta: { sheet, grid: 10, updatedAt: (/* @__PURE__ */ new Date()).toISOString() },
        groups: [],
        parts: rawParts.map((p) => {
          const rot = p.rot;
          const mirror = p.mirror;
          const cx = p.x;
          const cy = p.y;
          return {
            id: p.id,
            primitiveId: p.primitiveId,
            w: p.w,
            h: p.h,
            place: { x: cx, y: cy, rot, mirror },
            // 引脚存本地定义：世界坐标减去摆放，再逆转回去
            pins: p.pins.map((q) => {
              const rx = q.x - cx;
              const ry = q.y - cy;
              const rad = -rot * Math.PI / 180;
              const cos = Math.round(Math.cos(rad));
              const sin = Math.round(Math.sin(rad));
              let dx = rx * cos - ry * sin;
              const dy = rx * sin + ry * cos;
              let dir = (q.dir - rot + 360) % 360;
              if (mirror) {
                dx = -dx;
                dir = (180 - dir + 360) % 360;
              }
              return { id: q.n, name: q.name, dx, dy, dir };
            }),
            labels: [
              { key: "Designator", text: p.id, dx: -10, dy: p.h / 2 + 12 },
              { key: "Name", text: String(p.name ?? "").slice(0, 20), dx: -10, dy: -(p.h / 2 + 12) }
            ].filter((l) => l.text)
          };
        }),
        nets: Object.entries(rawNets).map(([id, pins]) => {
          const kind = guessNetKind(id);
          return { id, kind, style: defaultStyle(kind), pins };
        })
      };
      const guessed = map.nets.filter((n) => n.kind !== "signal").map((n) => `${n.id}=${n.kind}`);
      const lonely = map.nets.filter((n) => n.pins.length < 2).map((n) => n.id);
      return {
        map,
        parts: map.parts.length,
        nets: map.nets.length,
        wire_segments: r.wire_segments,
        guessed_kinds: guessed,
        single_pin_nets: lonely,
        note: "**\u8FD9\u53EA\u662F\u521D\u7A3F**\u3002\u7F51\u7EDC\u6027\u8D28\u662F\u6309\u540D\u5B57\u731C\u7684\uFF0C\u8BF7\u9010\u6761\u6838\u5BF9 guessed_kinds \u2014\u2014 \u540D\u5B57\u5224\u65AD\u4E0D\u4E86 AVDD_1V8 \u662F\u7535\u6E90\u8FD8\u662F\u4FE1\u53F7\u3001PWR_EN \u662F\u4E0D\u662F\u666E\u901A IO\u3002\u5206\u533A\u4E5F\u662F\u7A7A\u7684\uFF0C\u9700\u8981\u4F60\u6309\u529F\u80FD\u5212\u3002\u6539\u597D\u540E\u7528 eda_map_save \u5B58\u56DE\u56FE\u7EB8\u3002"
      };
    }
  },
  {
    name: "eda_map_verify",
    description: "\u3010\u53EA\u8BFB\u3011\u62FF\u5730\u56FE\u91CC\u7684\u5668\u4EF6\u51E0\u4F55\u8DDF EDA \u91CC\u7684\u771F\u5B9E\u7B26\u53F7\u6BD4\u5BF9\u3002\n\n**AI \u624B\u5199\u5730\u56FE\u540E\u5FC5\u8DD1**\u3002\u5F15\u811A\u6570\u91CF\u3001\u5F15\u811A\u53F7\u3001\u5F15\u811A\u5750\u6807\u3001\u7B26\u53F7\u5C3A\u5BF8\u90FD\u662F\u5E93\u91CC\u7684\u5BA2\u89C2\u4E8B\u5B9E\uFF0C\u51ED\u8BB0\u5FC6\u586B\u5FC5\u7136\u51FA\u9519\uFF1B\u800C\u9519\u7684\u5F15\u811A\u53F7\u4F1A\u4E00\u8DEF\u5E26\u5230\u6E32\u67D3\uFF0C\u8868\u73B0\u4E3A\u300C\u7EBF\u8FDE\u5230\u4E86\u4E0D\u5B58\u5728\u7684\u811A\u4E0A\u300D\uFF0C\u5230\u90A3\u65F6\u5F88\u96BE\u8FFD\u662F\u54EA\u4E00\u6B65\u7F16\u9519\u7684\u3002\n\n\u6743\u8D23\u5206\u660E\uFF1A\u51E0\u4F55\u4EE5 EDA \u4E3A\u51C6\uFF08\u5BA2\u89C2\u4E8B\u5B9E\uFF09\uFF0C\u8FDE\u63A5\u4E0E\u5206\u533A\u4EE5\u5730\u56FE\u4E3A\u51C6\uFF08\u8BBE\u8BA1\u610F\u56FE\uFF09\u3002\u6240\u4EE5\u8FD9\u91CC\u53EA\u62A5\u51E0\u4F55\u5DEE\u5F02\uFF0C\u4E0D\u78B0\u7F51\u7EDC\u3002",
    inputSchema: {
      type: "object",
      properties: {
        map: { type: "object", description: "\u8981\u6821\u9A8C\u7684\u5730\u56FE\uFF1B\u4E0D\u4F20\u5219\u8BFB\u56FE\u7EB8\u91CC\u5B58\u7684\u90A3\u4EFD" }
      }
    },
    handler: async (args, ctx2) => {
      let map = args.map;
      if (!map) {
        const loaded = await ctx2.exec(
          `
					${ENSURE_SCH3}
					const MARK = ${JSON.stringify(MARK2)};
					const all = await eda.sch_PrimitiveText.getAll();
					for (const t of all) {
						const c = String(t.content || '');
						if (c.indexOf(MARK) === 0) return { raw: c.slice(MARK.length) };
					}
					return { raw: null };
				`,
          6e4
        );
        if (!loaded.raw) return { error: "\u6CA1\u4F20 map\uFF0C\u56FE\u7EB8\u91CC\u4E5F\u6CA1\u6709\u5B58\u5730\u56FE" };
        map = unpackMap(loaded.raw);
      }
      const real = await ctx2.exec(
        `
				${ENSURE_SCH3}
				const all = await eda.sch_PrimitiveComponent.getAll();
				const out = {};
				for (const c of all) {
					if (c.componentType !== 'part') continue;
					const bb = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => null);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					out[String(c.designator || '')] = {
						w: bb ? Math.round(bb.maxX - bb.minX) : null,
						h: bb ? Math.round(bb.maxY - bb.minY) : null,
						pins: (pins || []).map((p) => String(p.pinNumber != null ? p.pinNumber : p.number)).sort(),
					};
				}
				return { parts: out };
			`,
        12e4
      );
      if (real.error) return { error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875" };
      const actual = real.parts ?? {};
      const issues = [];
      for (const p of map.parts) {
        const a = actual[p.id];
        if (!a) {
          issues.push({ part: p.id, problem: "\u56FE\u4E0A\u6CA1\u6709\u8FD9\u4E2A\u5668\u4EF6", map: `${p.pins.length} \u4E2A\u5F15\u811A`, eda: "\u4E0D\u5B58\u5728" });
          continue;
        }
        const mapPins = p.pins.map((q) => q.id).sort();
        if (mapPins.join(",") !== a.pins.join(",")) {
          issues.push({ part: p.id, problem: "\u5F15\u811A\u53F7\u5BF9\u4E0D\u4E0A", map: mapPins.join(","), eda: a.pins.join(",") });
        }
        if (a.w != null && Math.abs(a.w - p.w) > 2) {
          issues.push({ part: p.id, problem: "\u7B26\u53F7\u5BBD\u5EA6\u5BF9\u4E0D\u4E0A", map: String(p.w), eda: String(a.w) });
        }
        if (a.h != null && Math.abs(a.h - p.h) > 2) {
          issues.push({ part: p.id, problem: "\u7B26\u53F7\u9AD8\u5EA6\u5BF9\u4E0D\u4E0A", map: String(p.h), eda: String(a.h) });
        }
      }
      const extra = Object.keys(actual).filter((d) => d && !map.parts.some((p) => p.id === d));
      return {
        checked: map.parts.length,
        issues,
        not_in_map: extra,
        verdict: issues.length === 0 && extra.length === 0 ? "\u4E00\u81F4" : `${issues.length + extra.length} \u5904\u5BF9\u4E0D\u4E0A`,
        note: issues.length || extra.length ? "\u51E0\u4F55\u4EE5 EDA \u4E3A\u51C6 \u2014\u2014 \u6309 eda \u90A3\u4E00\u5217\u6539\u5730\u56FE\uFF0C\u522B\u53CD\u8FC7\u6765\u3002not_in_map \u662F\u56FE\u4E0A\u6709\u3001\u5730\u56FE\u91CC\u6F0F\u6389\u7684\u5668\u4EF6\u3002" : "\u5730\u56FE\u4E0E\u56FE\u7EB8\u4E00\u81F4\uFF0C\u53EF\u4EE5\u5F80\u4E0B\u8D70\u3002"
      };
    }
  }
];

// src/layout/connectivity.ts
var CONNECT_TOL = 1;
function dist2ToSegment(px, py, s) {
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const qx = s.x1 + t * dx;
  const qy = s.y1 + t * dy;
  return Math.abs(px - qx) + Math.abs(py - qy);
}
function segmentsTouch(a, b, tol) {
  return dist2ToSegment(a.x1, a.y1, b) <= tol || dist2ToSegment(a.x2, a.y2, b) <= tol || dist2ToSegment(b.x1, b.y1, a) <= tol || dist2ToSegment(b.x2, b.y2, a) <= tol;
}
var DSU = class {
  p;
  constructor(n) {
    this.p = Array.from({ length: n }, (_, i) => i);
  }
  find(x) {
    while (this.p[x] !== x) {
      const parent = this.p[x];
      this.p[x] = this.p[parent];
      x = this.p[x];
    }
    return x;
  }
  union(a, b) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra !== rb) this.p[ra] = rb;
  }
};
function buildConnectivity(segs, terms, tol = CONNECT_TOL) {
  const nSeg = segs.length;
  const dsu = new DSU(nSeg + terms.length);
  for (let i = 0; i < nSeg; i++) {
    for (let j = i + 1; j < nSeg; j++) {
      if (segmentsTouch(segs[i], segs[j], tol)) dsu.union(i, j);
    }
  }
  const touched = /* @__PURE__ */ new Set();
  terms.forEach((t, k) => {
    for (let i = 0; i < nSeg; i++) {
      if (dist2ToSegment(t.x, t.y, segs[i]) <= tol) {
        dsu.union(nSeg + k, i);
        touched.add(k);
      }
    }
  });
  for (let a = 0; a < terms.length; a++) {
    for (let b = a + 1; b < terms.length; b++) {
      const ta = terms[a];
      const tb = terms[b];
      if (Math.abs(ta.x - tb.x) + Math.abs(ta.y - tb.y) <= tol) {
        dsu.union(nSeg + a, nSeg + b);
        touched.add(a);
        touched.add(b);
      }
    }
  }
  const byName = /* @__PURE__ */ new Map();
  terms.forEach((t, k) => {
    if (t.kind === "pin" || !t.net) return;
    const list = byName.get(t.net) ?? [];
    list.push(k);
    byName.set(t.net, list);
  });
  for (const list of byName.values()) {
    for (let i = 1; i < list.length; i++) {
      dsu.union(nSeg + list[0], nSeg + list[i]);
      touched.add(list[0]);
      touched.add(list[i]);
    }
  }
  const buckets = /* @__PURE__ */ new Map();
  for (let i = 0; i < nSeg; i++) {
    const r = dsu.find(i);
    const b = buckets.get(r) ?? { pins: [], names: /* @__PURE__ */ new Set(), segs: 0 };
    b.segs += 1;
    buckets.set(r, b);
  }
  terms.forEach((t, k) => {
    if (!touched.has(k)) return;
    const r = dsu.find(nSeg + k);
    const b = buckets.get(r) ?? { pins: [], names: /* @__PURE__ */ new Set(), segs: 0 };
    if (t.kind === "pin") b.pins.push(t.id);
    else if (t.net) b.names.add(t.net);
    buckets.set(r, b);
  });
  const groups = [];
  const rootToIndex = /* @__PURE__ */ new Map();
  for (const [root, b] of buckets) {
    rootToIndex.set(root, groups.length);
    groups.push({
      index: groups.length,
      pins: b.pins.sort(),
      names: [...b.names].sort(),
      segments: b.segs
    });
  }
  const of = /* @__PURE__ */ new Map();
  terms.forEach((t, k) => {
    if (!touched.has(k)) return;
    const gi = rootToIndex.get(dsu.find(nSeg + k));
    if (gi != null) of.set(t.id, gi);
  });
  const isolated = terms.filter((_, k) => !touched.has(k)).map((t) => t.id);
  return { groups, of, isolated };
}
function diffConnectivity(conn, declared, terms) {
  const broken = [];
  const shorts = [];
  for (const net of declared) {
    if (net.pins.length < 2) continue;
    const buckets = /* @__PURE__ */ new Map();
    for (const ref of net.pins) {
      const gi = conn.of.get(ref);
      const key2 = gi == null ? "none" : String(gi);
      buckets.set(key2, [...buckets.get(key2) ?? [], ref]);
    }
    if (buckets.size > 1) {
      const actual = [...buckets.values()];
      broken.push({
        net: net.id,
        expected: net.pins,
        actual,
        note: `\u58F0\u660E\u4E3A\u540C\u4E00\u7F51\u7EDC\uFF0C\u5B9E\u9645\u5374\u5206\u6210\u4E86 ${buckets.size} \u7EC4\uFF1A` + actual.map((g) => `[${g.join(" ")}]`).join(" \u4E0E ") + "\uFF08\u5176\u4E2D none \u8868\u793A\u538B\u6839\u6CA1\u63A5\u5230\u4EFB\u4F55\u5BFC\u7EBF\uFF09"
      });
    }
  }
  const netOfPin = /* @__PURE__ */ new Map();
  for (const net of declared) for (const ref of net.pins) netOfPin.set(ref, net.id);
  for (const g of conn.groups) {
    const names = /* @__PURE__ */ new Set();
    for (const ref of g.pins) {
      const n = netOfPin.get(ref);
      if (n) names.add(n);
    }
    for (const n of g.names) names.add(n);
    if (names.size > 1) {
      shorts.push({
        nets: [...names].sort(),
        pins: g.pins,
        note: `\u8FD9\u4E9B\u5F15\u811A\u5728\u56FE\u4E0A\u8FDE\u6210\u4E86\u4E00\u7247\uFF0C\u4F46\u5B83\u4EEC\u5206\u5C5E ${names.size} \u6761\u4E0D\u540C\u7684\u7F51\u7EDC \u2014\u2014 \u77ED\u8DEF`
      });
    }
  }
  const ncSet = new Set(terms.filter((t) => t.nc).map((t) => t.id));
  const orphans = conn.isolated.filter((id) => !ncSet.has(id));
  return { broken, shorts, orphans, ok: broken.length === 0 && shorts.length === 0 && orphans.length === 0 };
}
function findCrossings(segs, boxes, shrink = 6) {
  const out = [];
  for (const b of boxes) {
    const x0 = b.minX + shrink;
    const y0 = b.minY + shrink;
    const x1 = b.maxX - shrink;
    const y1 = b.maxY - shrink;
    if (x1 <= x0 || y1 <= y0) continue;
    for (const s of segs) {
      if (segmentHitsBox(s, x0, y0, x1, y1)) {
        out.push({
          part: b.id,
          seg: s,
          note: `\u7F51\u7EDC ${s.net || "(\u65E0\u540D)"} \u7684\u5BFC\u7EBF\u4ECE ${b.id} \u8EAB\u4E0A\u538B\u8FC7\u53BB\u4E86`
        });
      }
    }
  }
  return out;
}
function segmentHitsBox(s, x0, y0, x1, y1) {
  let t0 = 0;
  let t1 = 1;
  const dx = s.x2 - s.x1;
  const dy = s.y2 - s.y1;
  const tests = [
    [-dx, s.x1 - x0],
    [dx, x1 - s.x1],
    [-dy, s.y1 - y0],
    [dy, y1 - s.y1]
  ];
  for (const [p, q] of tests) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return t0 < t1;
}

// src/tools/netcheck.ts
var ENSURE_SCH4 = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
var COLLECT = `
	${ENSURE_SCH4}
	const flat = function (L) {
		const o = [];
		if (!L) return o;
		if (Array.isArray(L[0])) { for (const s of L) for (const v of s) o.push(v); }
		else { for (const v of L) o.push(v); }
		return o;
	};

	// line \u662F**\u6BB5\u5217\u8868**\uFF0C\u6BCF 4 \u4E2A\u6570\u4E00\u6BB5 (x1,y1,x2,y2) \u2014\u2014 \u4E0D\u662F\u70B9\u5E8F\u5217\u3002
	// \u6309\u70B9\u5E8F\u5217\uFF08\u6B65\u957F 2\uFF09\u89E3\u6790\u4F1A\u628A\u4E0A\u4E00\u6BB5\u7684\u7EC8\u70B9\u548C\u4E0B\u4E00\u6BB5\u7684\u8D77\u70B9\u8FDE\u6210\u4E00\u6761\u865A\u5047\u7684
	// \u659C\u7EBF\uFF0C\u51ED\u7A7A\u9020\u51FA\u8DE8\u7F51\u7EDC\u7684\u8FDE\u63A5\uFF1A\u5B9E\u6D4B RESET \u56E0\u6B64\u88AB\u5E76\u8FDB GND\uFF0C\u62A5\u51FA\u6839\u672C
	// \u4E0D\u5B58\u5728\u7684\u77ED\u8DEF\u3002\u6BB5\u5185\u5FC5\u7136\u6B63\u4EA4\uFF0C\u53EF\u4EE5\u62FF\u8FD9\u4E2A\u81EA\u68C0\u89E3\u6790\u5BF9\u4E0D\u5BF9\u3002
	const segs = [];
	for (const w of (await eda.sch_PrimitiveWire.getAll()) || []) {
		const p = flat(w.line);
		for (let i = 0; i + 3 < p.length; i += 4) {
			segs.push({ x1: p[i], y1: p[i + 1], x2: p[i + 2], y2: p[i + 3], net: String(w.net || '') });
		}
	}
	// \u89E3\u6790\u81EA\u68C0\uFF1A\u539F\u7406\u56FE\u5BFC\u7EBF\u4E00\u5F8B\u6B63\u4EA4\uFF0C\u51FA\u73B0\u659C\u6BB5\u5C31\u8BF4\u660E\u6B65\u957F\u9519\u4E86
	let skew = 0;
	for (const s of segs) { if (s.x1 !== s.x2 && s.y1 !== s.y2) skew += 1; }

	const terms = [];
	const parts = [];
	const decorations = [];
	for (const c of (await eda.sch_PrimitiveComponent.getAll()) || []) {
		const pins = (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(function () { return []; })) || [];
		const t = String(c.componentType || '');
		if (t === 'part') {
			const des = String(c.designator || '');
			// \u56FE\u7EB8\u6807\u9898\u680F\u4E5F\u662F part\uFF0C\u4F46\u5B83\u6CA1\u6709\u5F15\u811A \u2014\u2014 \u8FD9\u662F\u552F\u4E00\u7A33\u7684\u5224\u636E
			if (!pins.length) { decorations.push({ id: c.primitiveId, xy: [c.x, c.y] }); continue; }
			const bb = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(function () { return null; });
			parts.push({
				des: des,
				xy: [c.x, c.y],
				pins: pins.length,
				box: bb ? { minX: bb.minX, minY: bb.minY, maxX: bb.maxX, maxY: bb.maxY } : null,
			});
			for (const p of pins) {
				const n = String(p.pinNumber != null ? p.pinNumber : p.number);
				terms.push({ id: des + '.' + n, x: p.x, y: p.y, kind: 'pin', nc: p.noConnected === true });
			}
		} else if (t === 'netflag' || t === 'netport') {
			// \u8FDE\u63A5\u70B9\u662F\u7B26\u53F7\u7684\u5F15\u811A\uFF0C\u4E0D\u662F\u7B26\u53F7\u672C\u4F53
			const a = pins[0];
			terms.push({
				id: String(c.primitiveId),
				x: a ? a.x : c.x,
				y: a ? a.y : c.y,
				kind: t === 'netflag' ? 'flag' : 'port',
				net: String(c.net || c.name || ''),
			});
		}
	}

	// \u56FE\u7EB8\u5C3A\u5BF8\uFF1AWidth / Height \u624D\u662F\u771F\u7684\uFF08Size \u5B57\u6BB5\u662F\u5C55\u793A\u7528\u7684\uFF0C\u5E38\u5E74\u505C\u5728 A4\uFF09\u3002
	// \u53D6\u4E0D\u5230\u5C31**\u660E\u8BF4\u53D6\u4E0D\u5230**\uFF0C\u7EDD\u4E0D\u62FF A4 \u515C\u5E95 \u2014\u2014 \u5B9E\u6D4B titleBlockData \u6709\u65F6\u6574\u4E2A
	// \u8BFB\u56DE\u6765\u662F\u7A7A\u7684\uFF0C\u4E00\u515C\u5E95\u5C31\u628A A3 \u56FE\u7EB8\u4E0A\u6240\u6709 x>1170 \u7684\u5668\u4EF6\u5168\u62A5\u6210\u51FA\u6846\uFF0C
	// \u4E00\u5C4F\u5047\u8B66\u62A5\u3002\u5B81\u53EF\u4E0D\u67E5\u8FD9\u4E00\u9879\u3002
	const tb = _page.titleBlockData || {};
	const num = function (k) {
		const v = tb[k] && tb[k].value;
		const n = Number(v);
		return isFinite(n) && n > 0 ? n : null;
	};
	const sw = num('Width');
	const sh = num('Height');
	const sheet = sw && sh ? { w: sw, h: sh } : null;

	// \u5730\u56FE\uFF1A\u62FF\u5B83\u5F53\u58F0\u660E\u7684\u771F\u76F8\u6E90
	let mapRaw = null;
	const MARKTXT = ${JSON.stringify(MAP_MARK)};
	const texts = [];
	for (const t of (await eda.sch_PrimitiveText.getAll()) || []) {
		const c = String(t.content || '');
		if (c.indexOf(MARKTXT) === 0) { mapRaw = c.slice(MARKTXT.length); continue; }
		texts.push({ x: t.x, y: t.y, s: c.slice(0, 40) });
	}

	return { skew: skew, segs: segs, terms: terms, parts: parts, decorations: decorations, sheet: sheet, mapRaw: mapRaw, texts: texts };
`;
var netcheckTools = [
  {
    name: "eda_check_schematic",
    description: "\u3010\u53EA\u8BFB\u3011\u539F\u7406\u56FE\u4F53\u68C0 \u2014\u2014 \u5EFA\u7ACB\u8FDE\u901A\u6027\u6A21\u578B\uFF0C\u62FF\u56FE\u4E0A**\u5B9E\u9645**\u5F62\u6210\u7684\u7F51\u7EDC\u53BB\u5426\u8BC1\u5730\u56FE\u91CC**\u58F0\u660E**\u7684\u7F51\u7EDC\u3002\n\n**\u753B\u5B8C\u5FC5\u8DD1**\u3002DRC \u67E5\u7684\u662F\u5DF2\u6709\u7F51\u7EDC\u4E4B\u95F4\u7684\u51B2\u7A81\uFF0C\u67E5\u4E0D\u51FA\u300C\u5F15\u811A\u538B\u6839\u6CA1\u8FDB\u7F51\u7EDC\u300D\uFF1A\u5B9E\u6D4B\u4E00\u6B21\u5E03\u7EBF\u540E 148 \u4E2A\u5F15\u811A\u53EA\u5269 60 \u4E2A\u8FD8\u8FDE\u7740\uFF0CDRC \u4F9D\u65E7\u62A5 errors 0\u3002\n\n\u5224\u636E\u4E0D\u662F\u300C\u5F15\u811A\u9644\u8FD1\u6709\u6CA1\u6709\u7EBF\u300D\uFF0C\u800C\u662F\u8FDE\u901A\u5206\u91CF\uFF1A\u8282\u70B9\u662F\u5F15\u811A\uFF0F\u5BFC\u7EBF\u6BB5\uFF0F\u7535\u6E90\u5730\u7B26\u53F7\uFF0F\u7AEF\u53E3\uFF0C\u8FB9\u662F\u51E0\u4F55\u91CD\u5408\u52A0**\u540C\u540D\u7B26\u53F7\u7AEF\u53E3\u7684\u865A\u62DF\u8FB9**\u3002\u56E0\u6B64\u7528\u7AEF\u53E3\u8DE8\u533A\u76F8\u8FDE\u3001\u7528\u7B26\u53F7\u8FDE\u7535\u6E90\u5730\uFF0C\u90FD\u80FD\u6B63\u786E\u5224\u4E3A\u8FDE\u901A \u2014\u2014 \u8FD9\u662F\u65E7\u5224\u636E\u505A\u4E0D\u5230\u7684\u3002\n\n\u67E5\u51FA\u4E09\u7C7B\u9519\uFF1A\n\xB7 **broken** \u58F0\u660E\u5728\u540C\u4E00\u7F51\u7EDC\u3001\u5B9E\u9645\u65AD\u6210\u51E0\u6BB5\uFF08\u6BCF\u6BB5\u5217\u51FA\u5177\u4F53\u5F15\u811A\uFF09\n\xB7 **shorts** \u5206\u5C5E\u4E0D\u540C\u7F51\u7EDC\u7684\u5F15\u811A\u8FDE\u6210\u4E86\u4E00\u7247 \u2014\u2014 \u77ED\u8DEF\uFF0CDRC \u901A\u5E38\u4E0D\u62A5\uFF0C\u8089\u773C\u4E5F\u770B\u4E0D\u51FA\n\xB7 **orphans** \u4E0D\u5C5E\u4E8E\u4EFB\u4F55\u7F51\u7EDC\u53C8\u6CA1\u6253 NC \u7684\u5F15\u811A\n\n\u6CA1\u6709\u5730\u56FE\u65F6\u53EA\u80FD\u62A5 orphans \u548C\u51E0\u4F55\u95EE\u9898\uFF0C\u62A5\u4E0D\u4E86 broken / shorts \u2014\u2014 \u5148\u8DD1 eda_map_import \u751F\u6210\u5730\u56FE\uFF0C\u4F53\u68C0\u624D\u6709\u58F0\u660E\u53EF\u6BD4\u3002",
    inputSchema: {
      type: "object",
      properties: {
        allow_floating: {
          type: "array",
          items: { type: "string" },
          description: '\u5141\u8BB8\u60AC\u7A7A\u7684\u5F15\u811A\uFF0C\u5982 ["U2.2","U2.3"]\u3002\u5DF2\u6253 NC \u6807\u8BB0\u7684\u4F1A\u81EA\u52A8\u653E\u8FC7\uFF0C\u4E0D\u7528\u91CD\u590D\u586B\u3002'
        },
        verbose: { type: "boolean", description: "\u8FDE\u540C\u5B9E\u9645\u7F51\u7EDC\u5206\u7EC4\u4E00\u8D77\u8FD4\u56DE\uFF0C\u4FBF\u4E8E\u4EBA\u5DE5\u6838\u5BF9" }
      }
    },
    handler: async (args, ctx2) => {
      const allow = new Set(
        Array.isArray(args.allow_floating) ? args.allow_floating.map((s) => s.toUpperCase()) : []
      );
      const d = await ctx2.exec(COLLECT, 18e4);
      if (d.error) return { error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875" };
      const conn = buildConnectivity(d.segs, d.terms);
      let map = null;
      if (d.mapRaw) {
        try {
          map = unpackMap(d.mapRaw);
        } catch {
          map = null;
        }
      }
      const declared = (map?.nets ?? []).map((n) => ({ id: n.id, pins: n.pins }));
      const diff = diffConnectivity(conn, declared, d.terms);
      const orphans = diff.orphans.filter((id) => !allow.has(id.toUpperCase()));
      const out = [];
      if (d.sheet) {
        const sh = d.sheet;
        for (const p of d.parts) {
          const b = p.box;
          if (!b) continue;
          const over = [];
          if (b.minX < 0) over.push(`\u5DE6\u51FA ${Math.round(-b.minX)}`);
          if (b.minY < 0) over.push(`\u4E0B\u51FA ${Math.round(-b.minY)}`);
          if (b.maxX > sh.w) over.push(`\u53F3\u51FA ${Math.round(b.maxX - sh.w)}`);
          if (b.maxY > sh.h) over.push(`\u4E0A\u51FA ${Math.round(b.maxY - sh.h)}`);
          if (over.length) {
            out.push({
              what: p.des,
              box: [Math.round(b.minX), Math.round(b.minY), Math.round(b.maxX), Math.round(b.maxY)],
              how: over.join("\u3001")
            });
          }
        }
      }
      const boxes = d.parts.filter((p) => p.box).map((p) => ({ id: p.des, ...p.box }));
      const crossings = findCrossings(d.segs, boxes);
      const problems = diff.broken.length + diff.shorts.length + orphans.length + out.length + crossings.length;
      return {
        page_sheet: d.sheet ?? "\u8BFB\u4E0D\u5230\uFF08titleBlockData \u4E3A\u7A7A\uFF09\uFF0C\u672C\u6B21\u8DF3\u8FC7\u51FA\u6846\u68C0\u67E5",
        skew_segments: d.skew || void 0,
        counted: {
          parts: d.parts.length,
          pins: d.terms.filter((t) => t.kind === "pin").length,
          wire_segments: d.segs.length,
          flags_and_ports: d.terms.filter((t) => t.kind !== "pin").length,
          // 图纸标题栏这类装饰单独列，免得被当成器件对不上数
          decorations_ignored: d.decorations.length
        },
        declared_nets: declared.length,
        actual_nets: conn.groups.length,
        broken: diff.broken,
        shorts: diff.shorts,
        orphans,
        outside_sheet: out,
        wires_crossing_parts: crossings.map((c) => ({
          part: c.part,
          net: c.seg.net || "(\u65E0\u540D)",
          from: [c.seg.x1, c.seg.y1],
          to: [c.seg.x2, c.seg.y2]
        })),
        actual_groups: args.verbose === true ? conn.groups : void 0,
        verdict: problems === 0 ? "\u901A\u8FC7" : `\u53D1\u73B0 ${problems} \u5904\u95EE\u9898`,
        note: declared.length === 0 ? "\u56FE\u7EB8\u91CC\u6CA1\u6709\u5730\u56FE\uFF0C\u672C\u6B21\u53EA\u67E5\u4E86\u5B64\u513F\u5F15\u811A\u548C\u51FA\u6846 \u2014\u2014 \u65AD\u7EBF\u4E0E\u77ED\u8DEF\u67E5\u4E0D\u4E86\u3002\u8DD1 eda_map_import \u751F\u6210\u5730\u56FE\u540E\u518D\u4F53\u68C0\u3002" : problems === 0 ? "\u5B9E\u9645\u8FDE\u901A\u6027\u4E0E\u5730\u56FE\u58F0\u660E\u5B8C\u5168\u4E00\u81F4\u3002" : "\u5148\u770B shorts\uFF08\u77ED\u8DEF\u6700\u81F4\u547D\u4E14\u8089\u773C\u96BE\u53D1\u73B0\uFF09\uFF0C\u518D\u770B broken\uFF0C\u6700\u540E orphans\u3002"
      };
    }
  }
];

// src/tools/pcb.ts
var PCB_TIMEOUT_MS = 9e4;
var ENSURE_PCB = `
	const _pcb = await eda.dmt_Pcb.getCurrentPcbInfo().catch(() => null);
	if (!_pcb) {
		const boards = await eda.dmt_Board.getAllBoardsInfo();
		return { error: 'NOT_PCB_EDITOR', available_pcbs: boards.filter(b => b.pcb).map(b => ({ board: b.name, pcb_uuid: b.pcb.uuid, pcb_name: b.pcb.name })) };
	}
`;
function pcbHint(result) {
  if (result?.error !== "NOT_PCB_EDITOR") return result;
  return {
    error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00 PCB \u2014\u2014 pcb_* \u63A5\u53E3\u7ED1\u5B9A\u6D3B\u52A8\u753B\u5E03\uFF0C\u5FC5\u987B\u5148\u628A PCB \u5207\u5230\u524D\u53F0\u3002",
    available_pcbs: result.available_pcbs,
    next_step: "\u7528 eda_open_document(document_uuid: <\u4E0A\u9762\u67D0\u4E2A pcb_uuid>) \u6253\u5F00\u540E\u91CD\u8BD5\u3002"
  };
}
var pcbTools = [
  {
    name: "eda_open_document",
    description: "\u5728 EDA \u7F16\u8F91\u5668\u91CC\u6253\u5F00\u5E76\u6FC0\u6D3B\u4E00\u4E2A\u6587\u6863\uFF08PCB \u6216\u539F\u7406\u56FE\u9875\uFF09\uFF0Cuuid \u4ECE eda_project_overview \u62FF\u3002\n\n\u7528\u9014\uFF1A\u539F\u7406\u56FE\u7C7B\u63A5\u53E3\u548C PCB \u7C7B\u63A5\u53E3\u90FD**\u53EA\u5BF9\u5F53\u524D\u6D3B\u52A8\u753B\u5E03\u751F\u6548**\uFF0C\u8981\u8BFB PCB \u5C31\u5F97\u5148\u628A PCB \u6253\u5F00\u3002\u672C\u5DE5\u5177\u662F\u5728\u540C\u4E00\u5DE5\u7A0B\u5185\u5207\u6807\u7B7E\u9875\uFF0C\u4E0D\u4F1A\u91CD\u8F7D\u9875\u9762\u3001\u4E0D\u4F1A\u65AD\u5F00\u8FDE\u63A5\uFF08\u4E0E eda_open_project \u5207\u6362\u5DE5\u7A0B\u4E0D\u540C\uFF09\u3002",
    inputSchema: {
      type: "object",
      properties: { document_uuid: { type: "string", description: "PCB uuid \u6216\u539F\u7406\u56FE\u9875 uuid" } },
      required: ["document_uuid"]
    },
    handler: async (args, ctx2) => {
      const uuid2 = requireString(args, "document_uuid");
      return ctx2.exec(
        `
				const tabId = await eda.dmt_EditorControl.openDocument(${JSON.stringify(uuid2)});
				if (!tabId) return { ok: false, error: '\u6253\u5F00\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4 uuid \u662F\u672C\u5DE5\u7A0B\u5185\u7684 PCB \u6216\u539F\u7406\u56FE\u9875' };
				await eda.dmt_EditorControl.activateDocument(tabId);
				await new Promise(r => setTimeout(r, 1200));   // \u753B\u5E03\u8BA2\u9605\u5EFA\u7ACB\u9700\u8981\u4E00\u70B9\u65F6\u95F4
				const pcb = await eda.dmt_Pcb.getCurrentPcbInfo().catch(() => null);
				const page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
				return { ok: true, tab_id: tabId, editor: pcb ? 'pcb' : page ? 'schematic' : 'other',
					opened: pcb ? { type: 'pcb', name: pcb.name, uuid: pcb.uuid } : page ? { type: 'schematic_page', name: page.name, uuid: page.uuid } : null };
			`,
        PCB_TIMEOUT_MS
      );
    }
  },
  {
    name: "eda_pcb_overview",
    description: "\u5F53\u524D PCB \u7684\u6982\u51B5\uFF1A\u540D\u79F0\u3001\u94DC\u5C42\u6570\u3001\u7F51\u7EDC\u6570\u91CF\u3001\u5F53\u524D\u6240\u5728\u5C42\u3002\n\n\u9700\u8981\u7F16\u8F91\u5668\u91CC\u6B63\u5F00\u7740 PCB\uFF1B\u6CA1\u5F00\u4F1A\u8FD4\u56DE\u53EF\u7528\u7684 PCB \u5217\u8868\u548C\u6253\u5F00\u65B9\u6CD5\u3002",
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => pcbHint(
      await ctx2.exec(
        `
				${ENSURE_PCB}
				const layers = await eda.pcb_Layer.getTheNumberOfCopperLayers().catch(() => null);
				const names = await eda.pcb_Net.getAllNetsName().catch(() => []);
				const cur = eda.pcb_Layer.getCurrentLayer?.() ?? null;
				return {
					pcb: { name: _pcb.name, uuid: _pcb.uuid },
					copper_layers: layers,
					net_count: names.length,
					current_layer: cur && typeof cur === 'object' ? { id: cur.id, name: cur.name } : cur,
				};
			`,
        PCB_TIMEOUT_MS
      )
    )
  },
  {
    name: "eda_pcb_nets",
    description: "\u5F53\u524D PCB \u7684\u7F51\u7EDC\u5217\u8868\u4E0E\u8D70\u7EBF\u957F\u5EA6\u3002\u7528\u4E8E\u957F\u5EA6\u5339\u914D\u6838\u5BF9\u3001\u627E\u672A\u5E03\u7EBF\u7F51\u7EDC\u3002\n\n\u957F\u5EA6\u4E3A 0 \u8868\u793A\u8BE5\u7F51\u7EDC\u5728 PCB \u4E0A\u8FD8\u6CA1\u6709\u8D70\u7EBF\uFF08\u53EA\u6709\u98DE\u7EBF\uFF09\u3002\n**\u5355\u4F4D**\uFF1A\u5B98\u65B9\u6587\u6863\u672A\u8BF4\u660E getNetLength \u7684\u5355\u4F4D\uFF0C\u5B9E\u6D4B\u6570\u503C\u5728 mil \u91CF\u7EA7\uFF08\u4F8B\uFF1A\u4E00\u6761\u7EA6 2339 \u7684\u8D70\u7EBF\uFF09\u3002\u7528\u4E8E\u76F8\u5BF9\u6BD4\u8F83\u662F\u53EF\u9760\u7684\uFF0C\u9700\u8981\u7EDD\u5BF9\u503C\u65F6\u8BF7\u5728 EDA \u754C\u9762\u6838\u5BF9\u4E00\u6761\u5DF2\u77E5\u8D70\u7EBF\u518D\u6362\u7B97\u3002",
    inputSchema: {
      type: "object",
      properties: {
        net_name: { type: "string", description: "\u53EA\u67E5\u6307\u5B9A\u7F51\u7EDC" },
        include_auto_named: { type: "boolean", description: "\u662F\u5426\u5305\u542B $1N\u2026 \u81EA\u52A8\u547D\u540D\u7F51\u7EDC\uFF0C\u9ED8\u8BA4 true\uFF08PCB \u4FA7\u8FD9\u7C7B\u5F88\u5E38\u89C1\uFF09" }
      }
    },
    handler: async (args, ctx2) => {
      const one = optionalString(args, "net_name");
      const includeAuto = optionalBool(args, "include_auto_named", true);
      return pcbHint(
        await ctx2.exec(
          `
				${ENSURE_PCB}
				const one = ${JSON.stringify(one ?? null)};
				const includeAuto = ${includeAuto};
				let names = await eda.pcb_Net.getAllNetsName();
				if (one) {
					names = names.filter(n => n.toLowerCase() === one.toLowerCase());
					if (!names.length) return { error: '\u627E\u4E0D\u5230\u7F51\u7EDC ' + one, available: (await eda.pcb_Net.getAllNetsName()).slice(0, 40) };
				} else if (!includeAuto) {
					names = names.filter(n => !/^\\$\\d*N\\d+$/.test(n));
				}
				const out = [];
				for (const n of names) {
					const len = await eda.pcb_Net.getNetLength(n).catch(() => null);
					out.push({ name: n, length: len, routed: typeof len === 'number' && len > 0 });
				}
				out.sort((a, b) => (b.length ?? 0) - (a.length ?? 0));
				return {
					pcb: _pcb.name,
					total: out.length,
					unrouted: out.filter(x => !x.routed).length,
					nets: out,
					length_unit_note: '\u5355\u4F4D\u672A\u5728\u5B98\u65B9\u6587\u6863\u4E2D\u8BF4\u660E\uFF0C\u6570\u503C\u5728 mil \u91CF\u7EA7\uFF1B\u76F8\u5BF9\u6BD4\u8F83\u53EF\u9760\uFF0C\u7EDD\u5BF9\u503C\u8BF7\u81EA\u884C\u6838\u5BF9',
				};
			`,
          PCB_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_pcb_drc",
    description: "\u5BF9\u5F53\u524D PCB \u8DD1 DRC\uFF0C\u8FD4\u56DE**\u5E26\u660E\u7EC6\u7684\u9519\u8BEF\u6811**\uFF1A\u5206\u7C7B\u3001\u6761\u6570\u3001\u6BCF\u6761\u7684\u5177\u4F53\u63CF\u8FF0\u3002\n\n\u6CE8\u610F\u4E0E eda_schematic_drc \u4E0D\u540C \u2014\u2014 \u539F\u7406\u56FE DRC \u53EA\u80FD\u62FF\u5230\u5206\u7C7B\u8BA1\u6570\uFF0CPCB DRC \u80FD\u62FF\u5230\u5177\u4F53\u95EE\u9898\u63CF\u8FF0\u3002\n\n\u5E38\u89C1\u5206\u7C7B\uFF1AConnection Error\uFF08\u8FDE\u63A5\u9519\u8BEF\uFF0C\u901A\u5E38\u662F\u672A\u5E03\u7EBF\uFF09\u3001Netlist Error\uFF08PCB \u4E0E\u539F\u7406\u56FE\u7F51\u8868\u4E0D\u4E00\u81F4\uFF0C\u9700\u8981\u5728 EDA \u91CC\u6267\u884C\u300C\u5BFC\u5165\u53D8\u66F4\u300D\uFF09\u3001\u95F4\u8DDD/\u7EBF\u5BBD\u7B49\u89C4\u5219\u9519\u8BEF\u3002",
    inputSchema: {
      type: "object",
      properties: {
        show_ui: { type: "boolean", description: "\u662F\u5426\u540C\u65F6\u5728 EDA \u5E95\u90E8\u6253\u5F00 DRC \u9762\u677F\uFF0C\u9ED8\u8BA4 false" },
        max_items_per_category: { type: "integer", description: "\u6BCF\u4E2A\u5206\u7C7B\u6700\u591A\u8FD4\u56DE\u51E0\u6761\u660E\u7EC6\uFF0C\u9ED8\u8BA4 20" }
      }
    },
    handler: async (args, ctx2) => {
      const showUi = optionalBool(args, "show_ui");
      const maxItems = typeof args.max_items_per_category === "number" ? args.max_items_per_category : 20;
      return pcbHint(
        await ctx2.exec(
          `
				${ENSURE_PCB}
				const raw = await eda.pcb_Drc.check(true, ${showUi}, true);
				const MAX = ${maxItems};
				const title = t => Array.isArray(t) ? t.join(' ') : String(t ?? '');
				// \u7ED3\u6784\u662F [{ name, title, count, list: [ { title, count, list: [ {explanation, objs, ...} ] } ] }]
				const flatten = (nodes) => {
					const out = [];
					for (const n of nodes || []) {
						const kids = n.list || [];
						const leaves = kids.filter(k => k.explanation || k.globalIndex);
						const branches = kids.filter(k => !(k.explanation || k.globalIndex));
						if (leaves.length) {
							out.push({
								category: title(n.title) || n.name,
								count: n.count ?? leaves.length,
								items: leaves.slice(0, MAX).map(l => ({
									message: l.explanation?.str ?? title(l.title),
									objects: Array.isArray(l.objs) ? l.objs.slice(0, 8) : undefined,
								})),
								truncated: leaves.length > MAX ? leaves.length - MAX : undefined,
							});
						}
						if (branches.length) out.push(...flatten(branches));
					}
					return out;
				};
				const cats = flatten(raw);
				const total = cats.reduce((s, c) => s + (c.count || 0), 0);
				return {
					pcb: _pcb.name,
					passed: total === 0,
					total_issues: total,
					categories: cats,
					ui_opened: ${showUi},
				};
			`,
          PCB_TIMEOUT_MS
        )
      );
    }
  }
];

// src/tools/project.ts
var projectTools = [
  {
    name: "eda_project_overview",
    description: "\u5F53\u524D\u5DE5\u7A0B\u5168\u8C8C\uFF1A\u5DE5\u7A0B\u540D\u4E0E uuid\u3001\u6240\u5C5E\u56E2\u961F\u3001\u4EE5\u53CA\u5168\u90E8\u677F\u5B50\uFF08\u6BCF\u5757\u677F\u542B\u5176\u539F\u7406\u56FE uuid + \u9875\u5217\u8868\u3001PCB uuid\uFF09\u3002\n\n\u8FD9\u662F\u64CD\u4F5C EDA \u7684\u8D77\u70B9 \u2014\u2014 \u540E\u7EED\u6309\u539F\u7406\u56FE / PCB \u64CD\u4F5C\u65F6\u9700\u8981\u7684 uuid \u90FD\u6765\u81EA\u8FD9\u91CC\u3002\n\n\u8FD4\u56DE\u503C\u5DF2\u88C1\u526A\u6389\u56FE\u6846\u6392\u7248\u7B49\u566A\u97F3\u5B57\u6BB5\uFF1B\u9700\u8981\u539F\u59CB\u7ED3\u6784\u7528 eda_execute \u8C03 dmt_Board.getAllBoardsInfo()\u3002",
    inputSchema: { type: "object", properties: {} },
    handler: async (_args, ctx2) => ctx2.exec(`
				const proj = await eda.dmt_Project.getCurrentProjectInfo();
				if (!proj) return { error: '\u5F53\u524D\u6CA1\u6709\u6253\u5F00\u7684\u5DE5\u7A0B\uFF0C\u8BF7\u5148\u8BA9\u7528\u6237\u5728 EDA \u91CC\u6253\u5F00\u4E00\u4E2A\u5DE5\u7A0B' };
				const boards = await eda.dmt_Board.getAllBoardsInfo();
				const team = await eda.dmt_Team.getCurrentTeamInfo().catch(() => null);
				const ws = await eda.dmt_Workspace.getCurrentWorkspaceInfo().catch(() => null);
				return {
					project: { uuid: proj.uuid, name: proj.friendlyName || proj.name, description: proj.description || undefined },
					team: team ? { uuid: team.uuid, name: team.name } : undefined,
					workspace: ws ? { uuid: ws.uuid, name: ws.name } : undefined,
					boards: (boards || []).map(b => ({
						name: b.name,
						uuid: b.uuid,
						schematic: b.schematic ? {
							uuid: b.schematic.uuid,
							name: b.schematic.name,
							pages: (b.schematic.page || []).map(p => ({ uuid: p.uuid, name: p.name })),
						} : null,
						pcb: b.pcb ? { uuid: b.pcb.uuid, name: b.pcb.name } : null,
					})),
				};
			`)
  },
  // eda_current_context 搬到了 tools/verify.ts —— 那边带三道数据校验和
  // 板/原理图/图页的互相印证。这里留个记号，免得又有人在这加一份同名的。
  {
    name: "eda_list_projects",
    description: "\u5217\u51FA\u53EF\u8BBF\u95EE\u7684\u5DE5\u7A0B\uFF08uuid + \u540D\u79F0 + \u6240\u5C5E\u56E2\u961F\uFF09\uFF0C\u7528\u4E8E\u67E5\u627E\u6216\u5207\u6362\u5DE5\u7A0B\u3002\n\n\u9ED8\u8BA4\u53EA\u5217\u5F53\u524D\u56E2\u961F\uFF1Binclude_all_teams=true \u65F6\u904D\u5386\u5168\u90E8\u56E2\u961F\uFF08\u4E2A\u4EBA + \u5404\u534F\u4F5C\u56E2\u961F\uFF09\u3002\n\u6CE8\u610F\u6BCF\u4E2A\u5DE5\u7A0B\u8981\u5355\u72EC\u53D6\u4E00\u6B21\u8BE6\u60C5\uFF08\u7EA6 250ms\uFF09\uFF0C\u56E2\u961F\u5DE5\u7A0B\u591A\u65F6\u4F1A\u6162\uFF0C\u975E\u5FC5\u8981\u4E0D\u8981\u5F00 include_all_teams\u3002",
    inputSchema: {
      type: "object",
      properties: {
        include_all_teams: { type: "boolean", description: "\u662F\u5426\u904D\u5386\u6240\u6709\u56E2\u961F\uFF0C\u9ED8\u8BA4 false\uFF08\u53EA\u67E5\u5F53\u524D\u56E2\u961F\uFF09" },
        team_uuid: { type: "string", description: "\u53EF\u9009\uFF0C\u6307\u5B9A\u56E2\u961F uuid\uFF1B\u7ED9\u51FA\u65F6\u5FFD\u7565 include_all_teams" }
      }
    },
    handler: async (args, ctx2) => {
      const all = optionalBool(args, "include_all_teams");
      const teamUuid = optionalString(args, "team_uuid");
      return ctx2.exec(
        `
				const wantAll = ${all};
				const fixedTeam = ${JSON.stringify(teamUuid ?? null)};
				let teams;
				if (fixedTeam) {
					const list = await eda.dmt_Team.getAllTeamsInfo();
					teams = list.filter(t => t.uuid === fixedTeam);
					if (!teams.length) return { error: '\u627E\u4E0D\u5230\u56E2\u961F ' + fixedTeam };
				} else if (wantAll) {
					teams = await eda.dmt_Team.getAllTeamsInfo();
				} else {
					const cur = await eda.dmt_Team.getCurrentTeamInfo();
					teams = cur ? [cur] : [];
				}
				const out = [];
				for (const t of teams) {
					// \u5B9E\u6D4B\uFF1AteamUuid \u6587\u6863\u6807\u53EF\u9009\uFF0C\u4F46\u4E0D\u4F20\u8FD4\u56DE\u7A7A\u6570\u7EC4\uFF0C\u5FC5\u987B\u663E\u5F0F\u4F20
					const uuids = await eda.dmt_Project.getAllProjectsUuid(t.uuid);
					for (const u of uuids) {
						const p = await eda.dmt_Project.getProjectInfo(u);
						if (p) out.push({ uuid: p.uuid, name: p.friendlyName || p.name, team: t.name, team_uuid: t.uuid, folder_uuid: p.folderUuid || undefined });
					}
				}
				return { count: out.length, projects: out };
			`,
        6e4
      );
    }
  },
  {
    name: "eda_open_project",
    description: "\u5728 EDA \u91CC\u6253\u5F00\u6307\u5B9A uuid \u7684\u5DE5\u7A0B\uFF08\u5207\u6362\u5F53\u524D\u5DE5\u7A0B\uFF09\u3002uuid \u4ECE eda_list_projects \u83B7\u53D6\u3002\n\n\u4F1A\u6539\u53D8\u7528\u6237\u754C\u9762\u663E\u793A\u7684\u5185\u5BB9\uFF0C\u4F46\u4E0D\u4FEE\u6539\u5DE5\u7A0B\u6570\u636E\u3002\u5207\u6362\u540E\u5EFA\u8BAE\u518D\u8C03 eda_project_overview \u786E\u8BA4\u3002\n\n\u672C\u5DE5\u5177\u4F1A\u5148\u6821\u9A8C uuid \u662F\u5426\u5C5E\u4E8E\u53EF\u8BBF\u95EE\u7684\u5DE5\u7A0B\uFF0C\u65E0\u6548 uuid \u76F4\u63A5\u8FD4\u56DE\u9519\u8BEF\u800C\u4E0D\u4F1A\u771F\u7684\u53BB\u6253\u5F00\u2014\u2014 \u56E0\u4E3A\u5B9E\u6D4B\u53D1\u73B0 EDA \u7684 openProject \u9047\u5230\u4E0D\u5B58\u5728\u7684 uuid \u4E0D\u662F\u5E72\u51C0\u5931\u8D25\uFF0C\u800C\u662F\u628A\u7F16\u8F91\u5668\u5207\u5230\u7A7A\u767D\u7684\u300C\u5F00\u59CB\u9875\u300D\uFF0C\u5BFC\u81F4\u5F53\u524D\u5DE5\u7A0B\u4E0A\u4E0B\u6587\u4E22\u5931\u3001\u540E\u7EED\u6240\u6709 getCurrent* \u8C03\u7528\u8FD4\u56DE\u7A7A\u3002\n\n**\u5207\u5230\u4E0D\u540C\u5DE5\u7A0B\u4F1A\u91CD\u8F7D EDA \u9875\u9762\u5E76\u77ED\u6682\u65AD\u5F00\u8FDE\u63A5**\uFF08\u7EA6 10-30 \u79D2\uFF09\uFF0C\u672C\u5DE5\u5177\u4F1A\u7ACB\u5373\u8FD4\u56DE\u800C\u4E0D\u7B49\u5F85\u5B8C\u6210\u3002\u5207\u6362\u540E\u4E0D\u8981\u9A6C\u4E0A\u67E5\u6570\u636E \u2014\u2014 \u5148\u8C03 eda_status \u786E\u8BA4\u91CD\u65B0\u8FDE\u4E0A\uFF0C\u518D\u8C03 eda_project_overview\uFF1B\u8FC7\u65E9\u67E5\u8BE2\u4F1A\u56E0\u4E3A\u5DE5\u7A0B\u5C1A\u672A\u52A0\u8F7D\u5B8C\u800C\u8FD4\u56DE\u7A7A\u5217\u8868\u3002",
    inputSchema: {
      type: "object",
      properties: { project_uuid: { type: "string", description: "\u76EE\u6807\u5DE5\u7A0B uuid" } },
      required: ["project_uuid"]
    },
    handler: async (args, ctx2) => {
      const uuid2 = requireString(args, "project_uuid");
      return ctx2.exec(
        `
				const target = ${JSON.stringify(uuid2)};
				// \u5148\u6821\u9A8C\uFF1AopenProject \u5BF9\u65E0\u6548 uuid \u4F1A\u628A\u7F16\u8F91\u5668\u5207\u5230\u300C\u5F00\u59CB\u9875\u300D\u5E76\u6E05\u7A7A\u4E0A\u4E0B\u6587\uFF0C
				// \u90A3\u79CD\u72B6\u6001\u5F88\u96BE\u81EA\u52A8\u6062\u590D\uFF08\u8981\u9760\u7528\u6237\u624B\u52A8\u70B9\u56DE\u5DE5\u7A0B\uFF09\uFF0C\u6240\u4EE5\u5B81\u53EF\u591A\u82B1\u4E00\u6B21\u67E5\u8BE2\u4E5F\u4E0D\u80FD\u8BD5\u9519\u3002
				const teams = await eda.dmt_Team.getAllTeamsInfo();
				let known = false;
				for (const t of teams) {
					const uuids = await eda.dmt_Project.getAllProjectsUuid(t.uuid);
					if (uuids.includes(target)) { known = true; break; }
				}
				if (!known) {
					return { ok: false, error: '\u5DE5\u7A0B ' + target + ' \u4E0D\u5728\u53EF\u8BBF\u95EE\u5217\u8868\u4E2D\uFF0C\u5DF2\u963B\u6B62\u6253\u5F00\uFF08\u907F\u514D\u6E05\u7A7A\u5F53\u524D\u5DE5\u7A0B\u4E0A\u4E0B\u6587\uFF09\u3002\u8BF7\u7528 eda_list_projects \u786E\u8BA4 uuid\u3002' };
				}

				const cur = await eda.dmt_Project.getCurrentProjectInfo();
				if (cur && cur.uuid === target) {
					// \u76EE\u6807\u5C31\u662F\u5F53\u524D\u5DE5\u7A0B\uFF1AEDA \u4E0D\u4F1A\u91CD\u8F7D\uFF0C\u53EF\u4EE5\u540C\u6B65\u786E\u8BA4
					return { ok: true, already_open: true, current_project: { uuid: cur.uuid, name: cur.friendlyName || cur.name } };
				}

				// \u5207\u5230\u522B\u7684\u5DE5\u7A0B\u4F1A\u91CD\u8F7D\u9875\u9762\u3001\u65AD\u5F00\u672C\u8FDE\u63A5\uFF0C\u82E5\u5728\u8FD9\u91CC await \u5C31\u62FF\u4E0D\u5230\u56DE\u5305\u4E86\u3002
				// \u6240\u4EE5\u5EF6\u8FDF\u89E6\u53D1\uFF0C\u5148\u628A\u7ED3\u679C\u53D1\u56DE\u53BB\u3002
				setTimeout(() => { eda.dmt_Project.openProject(target); }, 50);
				return {
					ok: true,
					switching: true,
					from: cur ? (cur.friendlyName || cur.name) : null,
					to_uuid: target,
					note: '\u5DF2\u53D1\u8D77\u5207\u6362\u3002EDA \u4F1A\u91CD\u8F7D\u9875\u9762\u5E76\u77ED\u6682\u65AD\u5F00\u8FDE\u63A5\uFF08\u7EA6 10-30 \u79D2\uFF09\u3002\u8BF7\u5148\u7528 eda_status \u786E\u8BA4\u91CD\u8FDE\uFF0C\u518D\u67E5\u5DE5\u7A0B\u6570\u636E \u2014\u2014 \u8FC7\u65E9\u67E5\u8BE2\u4F1A\u8FD4\u56DE\u7A7A\u5217\u8868\u3002',
				};
			`,
        6e4
      );
    }
  }
];

// src/tools/schematic-edit.ts
var EDIT_TIMEOUT_MS = 6e4;
var ENSURE_SCH5 = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
function schHint(r) {
  if (r?.error !== "NOT_SCH_EDITOR") return r;
  return {
    error: "\u5F53\u524D\u7F16\u8F91\u5668\u91CC\u6CA1\u6709\u6253\u5F00\u539F\u7406\u56FE\u9875 \u2014\u2014 \u539F\u7406\u56FE\u63A5\u53E3\u7ED1\u5B9A\u6D3B\u52A8\u753B\u5E03\u3002",
    next_step: "\u5148\u7528 eda_project_overview \u627E\u5230\u76EE\u6807\u9875 uuid\uFF0C\u518D\u7528 eda_open_document \u6253\u5F00\uFF0C\u7136\u540E\u91CD\u8BD5\u3002"
  };
}
function num(args, key2) {
  const v = args[key2];
  if (typeof v !== "number" || !Number.isFinite(v)) throw new Error(`${key2} \u5FC5\u586B\uFF08number\uFF0C\u5355\u4F4D 0.01 inch\uFF09`);
  return v;
}
var schematicEditTools = [
  {
    name: "eda_set_page_size",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u8BBE\u7F6E\u5F53\u524D\u539F\u7406\u56FE\u9875\u7684\u56FE\u7EB8\u5C3A\u5BF8\u3002\u9ED8\u8BA4\u65B0\u5EFA\u7684\u9875\u662F A4\uFF0811.7 \xD7 8.25 inch\uFF09\uFF0C\u5668\u4EF6\u5750\u6807\u8D85\u51FA\u8FD9\u4E2A\u8303\u56F4\u5C31\u4F1A\u6389\u5230\u56FE\u6846\u5916\u9762\u3002\n\n\u753B\u5927\u56FE\u524D\u5148\u8BBE\u597D\u5C3A\u5BF8\uFF1AA4 \u7EA6 1170\xD7825\u3001A3 \u7EA6 1650\xD71170\uFF08\u5355\u4F4D 0.01 inch\uFF09\u3002\u4E0D\u786E\u5B9A\u8981\u591A\u5927\u65F6\uFF0C\u5148\u770B\u84DD\u672C/\u76EE\u6807\u5668\u4EF6\u7684\u5750\u6807\u8303\u56F4\u518D\u9009\u3002\n\n\u4E5F\u53EF\u4EE5\u7528 width/height \u76F4\u63A5\u7ED9\u81EA\u5B9A\u4E49\u5C3A\u5BF8\uFF08\u5355\u4F4D inch\uFF09\u3002",
    inputSchema: {
      type: "object",
      properties: {
        size: { type: "string", description: "\u56FE\u7EB8\u89C4\u683C\uFF0C\u5982 A4 / A3 / A2 / A1 / A0" },
        width: { type: "number", description: "\u81EA\u5B9A\u4E49\u5BBD\u5EA6\uFF08inch\uFF09\uFF0C\u4E0E size \u4E8C\u9009\u4E00" },
        height: { type: "number", description: "\u81EA\u5B9A\u4E49\u9AD8\u5EA6\uFF08inch\uFF09\uFF0C\u4E0E size \u4E8C\u9009\u4E00" }
      }
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const size = optionalString(args, "size");
      const w = typeof args.width === "number" ? args.width : null;
      const h = typeof args.height === "number" ? args.height : null;
      const SHEETS = {
        A5: [827, 583],
        A4: [1170, 825],
        A3: [1655, 1170],
        A2: [2340, 1655],
        A1: [3310, 2340],
        A0: [4680, 3310]
      };
      const key2 = size ? size.toUpperCase() : "";
      if (size && !SHEETS[key2] && !(w && h)) {
        throw new Error(`\u4E0D\u8BA4\u8BC6\u7684\u56FE\u7EB8\u89C4\u683C ${size}\uFF0C\u53EF\u9009 ${Object.keys(SHEETS).join(" / ")}\uFF0C\u6216\u76F4\u63A5\u7ED9 width/height\uFF08inch\uFF09`);
      }
      const [sw, sh] = SHEETS[key2] ?? [Math.round((w ?? 0) * 100), Math.round((h ?? 0) * 100)];
      if (!size && !(w && h)) throw new Error("\u8BF7\u7ED9\u51FA size\uFF08\u5982 A3\uFF09\uFF0C\u6216\u540C\u65F6\u7ED9\u51FA width \u4E0E height\uFF08inch\uFF09");
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				// modifySchematicPageTitleBlock \u53EA\u7ED9\u90E8\u5206\u5B57\u6BB5\u4F1A\u629B
				// \u300CCannot set properties of undefined\u300D\u2014\u2014 \u5B83\u5185\u90E8\u6309\u5B8C\u6574\u7ED3\u6784\u904D\u5386\uFF0C
				// \u6240\u4EE5\u5FC5\u987B\u628A\u73B0\u6709 titleBlockData \u6574\u4EFD\u8BFB\u56DE\u6765\u3001\u6539\u5B8C\u518D\u5199\u56DE\u53BB\u3002
				const before = _page.titleBlockData || {};
				const data = JSON.parse(JSON.stringify(before));
				const put = (k, v) => { data[k] = Object.assign({}, data[k] || {}, { value: String(v) }); };
				${size ? `put('Size', ${JSON.stringify(size)}); put('Page Size', ${JSON.stringify(size)});` : ""}
				put('Width', ${sw});
				put('Height', ${sh});
				const ok = await eda.dmt_Schematic.modifySchematicPageTitleBlock(undefined, data);
				// getCurrentSchematicPageInfo \u8BFB\u7684\u662F\u7F13\u5B58\uFF0C\u5199\u5B8C\u7ACB\u523B\u8BFB\u4F1A\u62FF\u5230**\u4E0A\u4E00\u6B21**\u7684\u503C
				// \uFF08\u5B9E\u6D4B\u5199 1655 \u8BFB\u56DE 16.55 \u2014\u2014 \u6B63\u662F\u524D\u4E00\u6B21\u5199\u8FDB\u53BB\u7684\u6570\uFF09\uFF0C\u7B49\u4E00\u4E0B\u518D\u8BFB\u624D\u662F\u65B0\u503C\u3002
				await new Promise((r) => setTimeout(r, 400));
				const after = (await eda.dmt_Schematic.getCurrentSchematicPageInfo())?.titleBlockData || {};
				const read = (k) => after[k] && after[k].value !== undefined ? String(after[k].value) : undefined;
				return {
					ok: ok === true && Math.abs(Number(read('Width')) - ${sw}) < 0.05 && Math.abs(Number(read('Height')) - ${sh}) < 0.05,
					page: _page.name,
					size: read('Size'), page_size: read('Page Size'),
					canvas: { width: Number(read('Width')), height: Number(read('Height')) },
					inch: { width: Number(read('Width')) / 100, height: Number(read('Height')) / 100 },
					before: { size: before.Size && before.Size.value, width: before.Width && before.Width.value, height: before.Height && before.Height.value },
				};
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_label_pin_net",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u7ED9\u4E00\u4E2A\u5F15\u811A\u5F15\u51FA\u4E00\u5C0F\u6BB5\u5BFC\u7EBF\u5E76\u6807\u4E0A\u7F51\u7EDC\u540D \u2014\u2014 **\u6279\u91CF\u8FDE\u63A5\u7684\u9996\u9009\u65B9\u5F0F**\u3002\n\n\u4E3A\u4EC0\u4E48\u4E0D\u7528\u957F\u8DDD\u79BB\u8FDE\u7EBF\uFF1A\u539F\u7406\u56FE\u91CC\u4EA4\u53C9\u91CD\u5408\u7684\u5BFC\u7EBF\u4F1A\u88AB EDA \u5224\u5B9A\u4E3A\u7535\u6C14\u76F8\u8FDE\u3002\u81EA\u52A8\u751F\u6210\u7684 L \u578B\u957F\u8DEF\u5F84\u5728\u5BC6\u96C6\u56FE\u91CC\u5FC5\u7136\u5927\u91CF\u4EA4\u53C9\uFF0C\u4F1A\u628A\u672C\u4E0D\u76F8\u5E72\u7684\u7F51\u7EDC\u8FDE\u6210\u4E00\u7247\uFF08\u5B9E\u6D4B\u4E00\u6B21\u590D\u523B\u4E2D 81 \u4E2A\u5F15\u811A\u88AB\u8BEF\u5E76\u8FDB\u540C\u4E00\u4E2A\u7F51\u7EDC\uFF09\u3002\n\n\u540C\u540D\u7F51\u7EDC\u672C\u6765\u5C31\u7535\u6C14\u76F8\u8FDE\uFF0C\u6240\u4EE5\u53EA\u8981\u7ED9\u6BCF\u4E2A\u5F15\u811A\u5F15\u51FA\u4E00\u5C0F\u6BB5\u5E26\u7F51\u7EDC\u540D\u7684\u7EBF\uFF0C\u4E0D\u9700\u8981\u7269\u7406\u8FDE\u901A\uFF0C\u4E5F\u5C31\u4E0D\u4F1A\u8BEF\u8FDE\u3002\u5BC6\u96C6\u56FE\u3001\u603B\u7EBF\u3001\u7535\u6E90\u5730\u7F51\u7EDC\u90FD\u8BE5\u7528\u8FD9\u4E2A\u3002\n\n\u4E24\u4E2A\u5F15\u811A\u4E4B\u95F4\u786E\u5B9E\u8981\u753B\u770B\u5F97\u89C1\u7684\u8FDE\u7EBF\u65F6\uFF0C\u624D\u7528 eda_connect_pins\u3002",
    inputSchema: {
      type: "object",
      properties: {
        designator: { type: "string", description: "\u5668\u4EF6\u4F4D\u53F7\uFF0C\u5982 U1" },
        pin: { type: "string", description: "\u5F15\u811A\u53F7\u6216\u5F15\u811A\u540D\uFF0C\u5982 3 \u6216 VIN" },
        net: { type: "string", description: "\u7F51\u7EDC\u540D\uFF0C\u5982 VCC_3V3" },
        length: { type: "number", description: "\u5F15\u51FA\u7EBF\u957F\u5EA6\uFF080.01 inch\uFF09\uFF0C\u9ED8\u8BA4 20" }
      },
      required: ["designator", "pin", "net"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const des = requireString(args, "designator");
      const pin = requireString(args, "pin");
      const net = requireString(args, "net");
      const len = typeof args.length === "number" && args.length > 0 ? args.length : 20;
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const des = ${JSON.stringify(des)}.toUpperCase();
				const key = ${JSON.stringify(pin)}.toUpperCase();
				const all = await eda.sch_PrimitiveComponent.getAll();
				const c = all.find(x => String(x.designator || '').toUpperCase() === des);
				if (!c) return { ok: false, error: '\u627E\u4E0D\u5230\u4F4D\u53F7 ' + des };
				const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId);
				const p = (pins || []).find(x => String(x.pinNumber || '').toUpperCase() === key)
					|| (pins || []).find(x => String(x.pinName || '').toUpperCase() === key);
				if (!p) return { ok: false, error: des + ' \u4E0A\u627E\u4E0D\u5230\u5F15\u811A ' + key,
					pins: (pins||[]).map(x => x.pinNumber + ':' + x.pinName) };

				// \u987A\u7740\u5F15\u811A\u671D\u5411\u5F15\u51FA\uFF0C\u907F\u514D\u7EBF\u538B\u5728\u7B26\u53F7\u4E0A
				const L = ${len};
				const r = ((Number(p.rotation) % 360) + 360) % 360;
				const d = r === 0 ? [L, 0] : r === 90 ? [0, -L] : r === 180 ? [-L, 0] : r === 270 ? [0, L] : [L, 0];
				const line = [p.x, p.y, p.x + d[0], p.y + d[1]];
				const w = await eda.sch_PrimitiveWire.create(line, ${JSON.stringify(net)});
				if (!w) return { ok: false, error: '\u5F15\u51FA\u7EBF\u521B\u5EFA\u5931\u8D25\uFF08\u8BE5\u5F15\u811A\u53EF\u80FD\u5DF2\u5C5E\u4E8E\u522B\u7684\u5DF2\u547D\u540D\u7F51\u7EDC\uFF09', attempted: line };
				return { ok: true, pin: des + '.' + p.pinNumber, net: ${JSON.stringify(net)}, path: line, wire_id: w.primitiveId };
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_label_nets",
    description: '\u3010\u5199\u64CD\u4F5C\u3011\u6309\u4E00\u4EFD\u7F51\u7EDC\u58F0\u660E\u6279\u91CF\u5EFA\u7ACB\u5F15\u811A\u8FDE\u63A5\u3002\u5403\u7684\u662F\u548C eda_arrange_block \u5B8C\u5168\u76F8\u540C\u7684 nets \u53C2\u6570\uFF1A{ "+24V": ["U1.3","C11.1"], "GND": ["U1.1","C11.2"] }\u3002\n\n**\u4F1A\u6309\u7F51\u7EDC\u8BED\u4E49\u81EA\u52A8\u9009\u62E9\u56FE\u5F62\u8868\u8FBE**\uFF0C\u800C\u4E0D\u662F\u4E00\u5F8B\u8D34\u6587\u5B57\u6807\u7B7E\uFF1A\n- \u7535\u6E90\u4E0E\u5730\uFF08GND / AGND / VCC / +3V3 / +24V \u8FD9\u7C7B\uFF09\u2192 \u653E**\u7535\u6E90\u7B26\u53F7\u3001\u5730\u7B26\u53F7**\n- \u5176\u4F59\u4FE1\u53F7 \u2192 \u5F15\u51FA\u77ED\u7EBF + \u7F51\u7EDC\u6807\u7B7E\uFF0C\u4E14\u6309\u5F15\u811A\u5E8F\u9519\u5F00\u957F\u5EA6\uFF0C\u907F\u514D\u6587\u5B57\u7CCA\u5728\u4E00\u8D77\n\n\u4E3A\u4EC0\u4E48\u5FC5\u987B\u8FD9\u6837\uFF1A\u82AF\u7247\u76F8\u90BB\u5F15\u811A\u95F4\u8DDD\u53EA\u6709 10\uFF080.1 inch\uFF09\uFF0C\u800C\u4E00\u4E2A\u7F51\u7EDC\u540D\u7684\u6587\u5B57\u5BBD\u5EA6\u52A8\u8F84 50 \u4EE5\u4E0A\u3002\u5BC6\u96C6\u82AF\u7247\u4E0A\u9010\u4E2A\u5F15\u811A\u8D34\u6587\u5B57\u6807\u7B7E\uFF0C\u5FC5\u7136\u91CD\u53E0\u6210\u4E00\u56E2\uFF08\u5B9E\u6D4B LM331 \u5468\u56F4\u4E03\u516B\u4E2A\u6807\u7B7E\u53E0\u5728\u4E00\u8D77\uFF0C\u8FDE\u5F15\u811A\u540D\u90FD\u88AB\u76D6\u4F4F\uFF09\u3002\u7535\u6E90\u5730\u53C8\u6070\u6070\u662F\u5F15\u811A\u6700\u591A\u7684\u7F51\u7EDC\uFF0C\u6362\u6210\u7B26\u53F7\u80FD\u4E00\u6B21\u6D88\u6389\u5927\u534A\u91CD\u53E0\u3002\n\n\u987A\u5E8F\u5F88\u91CD\u8981\uFF1A**\u5148\u628A\u5757\u6392\u5E03\u5B9A\u7A3F\u518D\u8C03\u8FD9\u4E2A**\u3002\u8FDE\u63A5\u5EFA\u7ACB\u540E\u518D\u79FB\u52A8\u5668\u4EF6\uFF0C\u5BFC\u7EBF\u548C\u7B26\u53F7\u4F1A\u7559\u5728\u539F\u5730\uFF0C\u8FDE\u63A5\u5C31\u65AD\u4E86\u3002',
    inputSchema: {
      type: "object",
      properties: {
        nets: {
          type: "object",
          description: '{ \u7F51\u7EDC\u540D: ["\u4F4D\u53F7.\u5F15\u811A\u53F7", \u2026] }\uFF0C\u4E0E eda_arrange_block \u7684 nets \u540C\u683C\u5F0F',
          additionalProperties: { type: "array", items: { type: "string" } }
        },
        length: { type: "number", description: "\u6BCF\u4E2A\u5F15\u811A\u5F15\u51FA\u7EBF\u7684\u957F\u5EA6\uFF080.01 inch\uFF09\uFF0C\u9ED8\u8BA4 30" },
        power_nets: {
          type: "object",
          description: '\u53EF\u9009\uFF0C\u624B\u5DE5\u6307\u5B9A\u67D0\u4E2A\u7F51\u7EDC\u7528\u54EA\u79CD\u7B26\u53F7\uFF1A{ "VBUS": "power", "EARTH": "protect_ground" }\u3002\u53D6\u503C power / ground / analog_ground / protect_ground / label\u3002\u4E0D\u6307\u5B9A\u65F6\u6309\u7F51\u7EDC\u540D\u81EA\u52A8\u5224\u65AD\uFF08GND/VSS\u2192\u5730\uFF0CAGND\u2192\u6A21\u62DF\u5730\uFF0CVCC/VDD/+xxV\u2192\u7535\u6E90\uFF09\u3002\u586B label \u53EF\u4EE5\u5F3A\u5236\u67D0\u4E2A\u7535\u6E90\u7F51\u7EDC\u4ECD\u7528\u6587\u5B57\u6807\u7B7E\u3002',
          additionalProperties: { type: "string" }
        }
      },
      required: ["nets"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const nets = args.nets && typeof args.nets === "object" ? args.nets : {};
      const len = typeof args.length === "number" && args.length > 0 ? args.length : 30;
      const override = args.power_nets && typeof args.power_nets === "object" ? args.power_nets : {};
      const FLAG = {
        power: "Power",
        ground: "Ground",
        analog_ground: "AnalogGround",
        protect_ground: "ProtectGround"
      };
      const classify = (net) => {
        const manual = override[net];
        if (manual) return manual === "label" ? "label" : FLAG[manual] ? manual : "label";
        const u = net.toUpperCase();
        if (u === "AGND" || u === "GNDA") return "analog_ground";
        if (u === "PGND" || u === "EARTH" || u === "FGND") return "protect_ground";
        if (u === "GND" || u === "DGND" || u === "SGND" || u === "VSS" || u === "VEE" || u === "GNDD") return "ground";
        if (u.indexOf("VCC") === 0 || u.indexOf("VDD") === 0 || u.indexOf("VBAT") === 0 || u === "V+") return "power";
        const c0 = u.charCodeAt(0);
        if ((c0 >= 48 && c0 <= 57 || u.charAt(0) === "+") && u.indexOf("V") >= 0) return "power";
        return "label";
      };
      const jobs = [];
      const seqOf = {};
      for (const [net, refs] of Object.entries(nets)) {
        const kind = classify(net);
        for (const ref of Array.isArray(refs) ? refs : []) {
          const dot = String(ref).lastIndexOf(".");
          if (dot <= 0) continue;
          const des = String(ref).slice(0, dot).toUpperCase();
          seqOf[des] = (seqOf[des] ?? -1) + 1;
          jobs.push({
            des,
            pin: String(ref).slice(dot + 1),
            net,
            kind,
            flag: FLAG[kind] ?? "",
            seq: kind === "label" ? seqOf[des] : 0
          });
        }
      }
      if (!jobs.length) throw new Error('nets \u91CC\u6CA1\u6709\u53EF\u89E3\u6790\u7684 "\u4F4D\u53F7.\u5F15\u811A\u53F7" \u6761\u76EE');
      const r = await ctx2.exec(
        `
				${ENSURE_SCH5}
				const JOBS = ${JSON.stringify(jobs)};
				const L = ${len};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;

				const pinCache = {};
				const getPins = async (des) => {
					if (!pinCache[des]) {
						const c = byDes[des];
						pinCache[des] = c ? (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId) || []) : [];
					}
					return pinCache[des];
				};

				const done = [], failed = [];
				let flags = 0, labels = 0;
				for (const j of JOBS) {
					if (!byDes[j.des]) { failed.push({ ref: j.des + '.' + j.pin, why: '\u56FE\u4E0A\u6CA1\u6709\u8FD9\u4E2A\u4F4D\u53F7' }); continue; }
					const pins = await getPins(j.des);
					const key = String(j.pin).toUpperCase();
					let p = null;
					for (const x of pins) if (String(x.pinNumber || '').toUpperCase() === key) { p = x; break; }
					if (!p) for (const x of pins) if (String(x.pinName || '').toUpperCase() === key) { p = x; break; }
					if (!p) {
						const avail = pins.map((x) => x.pinNumber + ':' + x.pinName).join(' ');
						failed.push({ ref: j.des + '.' + j.pin, why: '\u627E\u4E0D\u5230\u8BE5\u5F15\u811A', pins: avail });
						continue;
					}
					// \u987A\u7740\u5F15\u811A\u671D\u5411\u5F80\u5916\u5F15\uFF0C\u4ECE\u7B26\u53F7\u5185\u4FA7\u63A5\u5165\u7684\u8BDD EDA \u4E0D\u8BA4\u8FD9\u4E2A\u8FDE\u63A5\u3002
					// \u6587\u5B57\u6807\u7B7E\u6309\u540C\u5668\u4EF6\u5185\u7684\u5E8F\u53F7\u9519\u5F00\u5F15\u51FA\u957F\u5EA6\uFF0C\u907F\u514D\u76F8\u90BB\u5F15\u811A\u7684\u6807\u7B7E\u53E0\u5728\u4E00\u8D77 \u2014\u2014
					// \u5F15\u811A\u95F4\u8DDD\u53EA\u6709 10\uFF0C\u800C\u7F51\u7EDC\u540D\u6587\u5B57\u5BBD\u5EA6\u52A8\u8F84 50 \u4EE5\u4E0A\u3002
					const rot = ((Number(p.rotation) % 360) + 360) % 360;
					// \u7535\u6E90\u5730\u7684\u5F15\u51FA\u7EBF\u8981\u957F\u4E00\u70B9\uFF0840\uFF09\uFF0C\u5426\u5219\u7B26\u53F7\u540D\u4F1A\u538B\u5728\u5668\u4EF6\u4F4D\u53F7\u4E0A \u2014\u2014
					// \u5B9E\u6D4B\u5F15\u51FA 30 \u65F6\uFF0CC2 \u7684\u4F4D\u53F7\u548C\u5B83\u4E0A\u65B9 +3V3 \u7684\u7F51\u7EDC\u540D\u53EA\u5DEE 5 \u4E2A\u5355\u4F4D\u3002
					const L2 = j.kind === 'label' ? L + (j.seq % 3) * 25 : L + 10;
					const d = rot === 0 ? [L2, 0] : rot === 90 ? [0, -L2] : rot === 180 ? [-L2, 0] : rot === 270 ? [0, L2] : [L2, 0];
					const ex = p.x + d[0], ey = p.y + d[1];
					// \u8981\u653E\u7B26\u53F7\u65F6\uFF0C\u5BFC\u7EBF\u672C\u8EAB**\u4E0D\u5E26\u7F51\u7EDC\u540D** \u2014\u2014 \u5426\u5219\u5BFC\u7EBF\u7684 NET \u6807\u7B7E\u548C\u7B26\u53F7\u540D\u4F1A\u628A
					// \u540C\u4E00\u4E2A\u7F51\u7EDC\u540D\u753B\u4E24\u904D\uFF0C\u6324\u5728\u4E00\u5C0F\u6BB5\u7EBF\u7684\u4E24\u7AEF\u3002\u8BA9\u7B26\u53F7\u72EC\u81EA\u547D\u540D\u8FD9\u4E2A\u7F51\u7EDC\u3002
					const w = j.flag
						? await eda.sch_PrimitiveWire.create([p.x, p.y, ex, ey])
						: await eda.sch_PrimitiveWire.create([p.x, p.y, ex, ey], j.net);
					if (!w) { failed.push({ ref: j.des + '.' + j.pin, why: '\u5F15\u51FA\u7EBF\u521B\u5EFA\u5931\u8D25\uFF08\u8BE5\u5F15\u811A\u53EF\u80FD\u5DF2\u5C5E\u4E8E\u522B\u7684\u7F51\u7EDC\uFF09' }); continue; }

					if (j.flag) {
						// \u7535\u6E90 / \u5730\uFF1A\u5728\u5F15\u51FA\u7EBF\u672B\u7AEF\u653E\u7B26\u53F7\u3002\u7B26\u53F7\u81EA\u5E26\u4E00\u4E2A\u5F15\u811A\uFF0C\u5750\u6807\u5373\u653E\u7F6E\u70B9\uFF0C
						// \u4E0E\u5BFC\u7EBF\u7AEF\u70B9\u91CD\u5408\u5C31\u8FDE\u4E0A\u4E86\u3002\u65CB\u8F6C\u8BA9\u7B26\u53F7\u671D\u5916\uFF08\u80CC\u5BF9\u5668\u4EF6\uFF09\u3002
						const fr = rot === 0 ? 270 : rot === 90 ? 180 : rot === 180 ? 90 : 0;
						const fl = await eda.sch_PrimitiveComponent.createNetFlag(j.flag, j.net, ex, ey, fr);
						if (fl) { flags += 1; done.push(j.des + '.' + p.pinNumber + '=' + j.net + '(\u7B26\u53F7)'); }
						else failed.push({ ref: j.des + '.' + j.pin, why: '\u7535\u6E90/\u5730\u7B26\u53F7\u521B\u5EFA\u5931\u8D25' });
					} else {
						labels += 1;
						done.push(j.des + '.' + p.pinNumber + '=' + j.net);
					}
				}
				return {
					ok: failed.length === 0,
					labeled: done.length, total: JOBS.length,
					power_symbols: flags, text_labels: labels,
					done, failed,
				};
			`,
        18e4
      );
      return schHint(r);
    }
  },
  {
    name: "eda_arrange_block",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u628A\u4E00\u4E2A\u529F\u80FD\u5757\u6392\u5E03\u597D\uFF1A\u6838\u5FC3\u82AF\u7247\u5C45\u4E2D\uFF0C\u5916\u56F4\u5668\u4EF6\u6309**\u5B83\u63A5\u5728\u82AF\u7247\u54EA\u4E00\u4FA7\u7684\u5F15\u811A**\u653E\u5230\u5BF9\u5E94\u65B9\u4F4D\u3002\n\n\u8FD9\u4E00\u6B65\u662F\u7EAF\u51E0\u4F55\u8BA1\u7B97\uFF0C\u4EA4\u7ED9\u5DE5\u5177\u505A\uFF1B**\u54EA\u4E9B\u5668\u4EF6\u5C5E\u4E8E\u540C\u4E00\u4E2A\u529F\u80FD\u5757\u662F\u4F60\u7684\u5224\u65AD**\uFF0C\u8981\u5148\u8BFB eda-schematic-layout skill \u60F3\u6E05\u695A\u518D\u8C03\u3002\n\n\u5DE5\u5177\u4F1A\u8BFB\u53D6\u6BCF\u4E2A\u5668\u4EF6\u7B26\u53F7\u7684\u5B9E\u9645\u5C3A\u5BF8\uFF08bbox\uFF09\u6765\u51B3\u5B9A\u95F4\u8DDD\uFF0C\u907F\u514D\u4E92\u76F8\u538B\u4F4F \u2014\u2014 \u56FA\u5B9A\u95F4\u8DDD\u5728\u5927\u82AF\u7247\uFF08\u5341\u51E0\u4E2A\u5F15\u811A\uFF09\u4E0A\u5FC5\u7136\u91CD\u53E0\u3002\n\n\u5916\u56F4\u5668\u4EF6\u4E0E\u6838\u5FC3\u5171\u4EAB\u54EA\u6761\u7F51\u7EDC\u3001\u90A3\u6761\u7F51\u7EDC\u63A5\u5728\u6838\u5FC3\u7684\u54EA\u4E2A\u5F15\u811A\u4E0A\uFF0C\u51B3\u5B9A\u5B83\u88AB\u653E\u5230\u5DE6/\u53F3/\u4E0A/\u4E0B\u3002\u63A5\u7535\u6E90\u7F51\u7EDC\u7684\uFF08\u53BB\u8026\u7535\u5BB9\uFF09\u653E\u4E0A\u65B9\uFF0C\u63A5\u5730\u7684\u653E\u4E0B\u65B9\uFF0C\u5176\u4F59\u6309\u5F15\u811A\u65B9\u4F4D\u3002\n\n\u6392\u5B8C\u6574\u5757\u518D\u8C03 eda_auto_route\u3002",
    inputSchema: {
      type: "object",
      properties: {
        core: { type: "string", description: "\u6838\u5FC3\u5668\u4EF6\u4F4D\u53F7\uFF0C\u901A\u5E38\u662F\u82AF\u7247\uFF0C\u5982 U5" },
        members: { type: "array", items: { type: "string" }, description: '\u5757\u5185\u5176\u4F59\u5668\u4EF6\u4F4D\u53F7\uFF0C\u5982 ["R15","R16","C19"]' },
        center_x: { type: "number", description: "\u5757\u4E2D\u5FC3 X\uFF080.01 inch\uFF09" },
        center_y: { type: "number", description: "\u5757\u4E2D\u5FC3 Y\uFF080.01 inch\uFF09" },
        gap: { type: "number", description: "\u5668\u4EF6\u4E4B\u95F4\u7684\u51C0\u95F4\u9699\uFF0C\u9ED8\u8BA4 60\uFF080.01 inch\uFF09" },
        nets: {
          type: "object",
          description: '\u672C\u5757\u7684\u8FDE\u63A5\u58F0\u660E\uFF0C**\u5F3A\u70C8\u5EFA\u8BAE\u4F20**\uFF1A{ "+24V": ["U1.3","C11.1"], "GND": ["U1.1","C11.2"] }\uFF0C\u952E\u662F\u7F51\u7EDC\u540D\u3001\u503C\u662F "\u4F4D\u53F7.\u5F15\u811A\u53F7" \u5217\u8868\u3002\u5668\u4EF6\u521A\u653E\u4E0B\u65F6\u56FE\u4E0A\u8FD8\u6CA1\u6709\u4EFB\u4F55\u7F51\u7EDC\uFF0C\u4E0D\u4F20\u8FD9\u4E2A\u53C2\u6570\u5DE5\u5177\u5C31\u65E0\u4ECE\u5224\u65AD\u8C01\u8BE5\u653E\u5DE6\u3001\u8C01\u8BE5\u653E\u53F3\uFF0C\u53EA\u80FD\u5168\u5806\u5230\u53F3\u8FB9\u4E00\u5217\u3002\u540C\u4E00\u4EFD\u58F0\u660E\u53EF\u4EE5\u539F\u6837\u5582\u7ED9 eda_label_pin_net \u505A\u6807\u6CE8 \u2014\u2014 \u5199\u4E00\u6B21\uFF0C\u7528\u4E24\u5904\u3002',
          additionalProperties: { type: "array", items: { type: "string" } }
        },
        max_per_lane: {
          type: "number",
          description: "\u540C\u4E00\u4FA7\u6392\u6EE1\u51E0\u4E2A\u5C31\u6362\u4E0B\u4E00\u5217/\u884C\uFF0C\u9ED8\u8BA4 3\u3002\u9632\u6B62\u5916\u56F4\u5668\u4EF6\u6392\u6210\u957F\u6761\u9876\u51FA\u56FE\u6846\u3002"
        }
      },
      required: ["core", "members", "center_x", "center_y"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const core = requireString(args, "core").toUpperCase();
      const members = (Array.isArray(args.members) ? args.members : []).map((m) => String(m).toUpperCase());
      const cx = num(args, "center_x");
      const cy = num(args, "center_y");
      const gap = typeof args.gap === "number" ? args.gap : 60;
      const nets = args.nets && typeof args.nets === "object" ? args.nets : {};
      const MAX_PER_LANE = typeof args.max_per_lane === "number" && args.max_per_lane > 0 ? args.max_per_lane : 3;
      const declared = /* @__PURE__ */ new Map();
      const netsOfDes = /* @__PURE__ */ new Map();
      for (const [net, refs] of Object.entries(nets)) {
        for (const ref of Array.isArray(refs) ? refs : []) {
          const dot = String(ref).lastIndexOf(".");
          if (dot <= 0) continue;
          const des = String(ref).slice(0, dot).toUpperCase();
          declared.set(`${des}.${String(ref).slice(dot + 1)}`, net);
          if (!netsOfDes.has(des)) netsOfDes.set(des, /* @__PURE__ */ new Set());
          netsOfDes.get(des)?.add(net);
        }
      }
      const snap2 = await ctx2.exec(
        `
				${ENSURE_SCH5}
				const WANT = ${JSON.stringify([core, ...members])};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
				const items = [];
				for (const des of WANT) {
					const c = byDes[des];
					if (!c) continue;
					const b = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => undefined);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					items.push({
						des: des,
						id: c.primitiveId,
						w: b ? Math.max(20, b.maxX - b.minX) : 60,
						h: b ? Math.max(20, b.maxY - b.minY) : 60,
						pins: (pins || []).map((p) => ({
							n: String(p.pinNumber != null ? p.pinNumber : (p.number != null ? p.number : '')),
							x: p.x, y: p.y,
						})),
					});
				}
				return { ok: true, items };
			`,
        12e4
      );
      const items = new Map((snap2.items ?? []).map((i) => [i.des, i]));
      const coreInfo = items.get(core);
      if (!coreInfo) return { ok: false, error: `\u627E\u4E0D\u5230\u6838\u5FC3\u5668\u4EF6 ${core}` };
      const GND = ["GND", "AGND", "DGND", "PGND", "SGND", "VSS", "VEE"];
      const isGnd = (n) => GND.includes(n.toUpperCase());
      const isSupply = (n) => {
        const u = n.toUpperCase();
        if (u.startsWith("VCC") || u.startsWith("VDD") || u.startsWith("VBAT") || u === "V+") return true;
        return /^[+0-9]/.test(u) && u.includes("V");
      };
      const gx = coreInfo.pins.reduce((a, q) => a + q.x, 0) / Math.max(1, coreInfo.pins.length);
      const gy = coreInfo.pins.reduce((a, q) => a + q.y, 0) / Math.max(1, coreInfo.pins.length);
      const netSide = /* @__PURE__ */ new Map();
      for (const p of coreInfo.pins) {
        const net = declared.get(`${core}.${p.n}`);
        if (!net) continue;
        const dx = p.x - gx, dy = p.y - gy;
        const side = Math.abs(dx) >= Math.abs(dy) ? dx < 0 ? "L" : "R" : dy > 0 ? "T" : "B";
        if (!netSide.has(net)) netSide.set(net, side);
      }
      const buckets = { L: [], R: [], T: [], B: [] };
      const unresolved = [];
      const anchorOf = /* @__PURE__ */ new Map();
      for (const des of members) {
        if (!items.has(des)) {
          unresolved.push(`${des}(\u56FE\u4E0A\u6CA1\u6709)`);
          continue;
        }
        const mine = [...netsOfDes.get(des) ?? []];
        let side = mine.map((n) => netSide.get(n)).find(Boolean);
        if (!side && mine.some(isSupply)) side = "T";
        if (!side && mine.some(isGnd)) side = "B";
        if (!side) {
          side = "R";
          unresolved.push(des);
        }
        const anchorPin = coreInfo.pins.find((cp) => {
          const n = declared.get(`${core}.${cp.n}`);
          return n != null && mine.includes(n);
        });
        anchorOf.set(des, anchorPin ? { x: anchorPin.x, y: anchorPin.y } : null);
        buckets[side].push(des);
      }
      const moves = [
        { des: core, id: coreInfo.id, x: Math.round(cx), y: Math.round(cy), side: "core" }
      ];
      const halfW = coreInfo.w / 2;
      const halfH = coreInfo.h / 2;
      for (const side of ["L", "R", "T", "B"]) {
        const list = buckets[side];
        if (!list.length) continue;
        const key2 = (d) => {
          const a = anchorOf.get(d);
          if (!a) return Number.MAX_SAFE_INTEGER;
          return side === "L" || side === "R" ? a.y : a.x;
        };
        list.sort((a, b) => key2(a) - key2(b));
        const sizes = list.map((d) => items.get(d));
        const lanes = Math.ceil(list.length / MAX_PER_LANE);
        const perLane = Math.ceil(list.length / lanes);
        const maxW = Math.max(...sizes.map((s) => s.w));
        const maxH = Math.max(...sizes.map((s) => s.h));
        if (side === "L" || side === "R") {
          const pitch = maxH + gap;
          const dir = side === "L" ? -1 : 1;
          list.forEach((des, i) => {
            const lane = Math.floor(i / perLane);
            const inLane = i % perLane;
            const n = Math.min(perLane, list.length - lane * perLane);
            moves.push({
              des,
              id: items.get(des).id,
              side,
              x: Math.round(cx + dir * (halfW + gap + maxW / 2 + lane * (maxW + gap))),
              y: Math.round(cy - (n - 1) * pitch / 2 + inLane * pitch)
            });
          });
        } else {
          const pitch = maxW + gap;
          const dir = side === "T" ? 1 : -1;
          list.forEach((des, i) => {
            const lane = Math.floor(i / perLane);
            const inLane = i % perLane;
            const n = Math.min(perLane, list.length - lane * perLane);
            moves.push({
              des,
              id: items.get(des).id,
              side,
              x: Math.round(cx - (n - 1) * pitch / 2 + inLane * pitch),
              y: Math.round(cy + dir * (halfH + gap + maxH / 2 + lane * (maxH + gap)))
            });
          });
        }
      }
      const w = await ctx2.exec(
        `
				${ENSURE_SCH5}
				const MOVES = ${JSON.stringify(moves.map((m) => ({ id: m.id, x: m.x, y: m.y })))};
				let moved = 0;
				for (const m of MOVES) {
					const r = await eda.sch_PrimitiveComponent.modify(m.id, { x: m.x, y: m.y });
					if (r !== false) moved += 1;
				}
				return { ok: true, moved };
			`,
        18e4
      );
      const check = await verifyPlaced(
        ctx2,
        moves.map((m) => ({ designator: m.des, x: m.x, y: m.y }))
      );
      const actualOf = new Map(check.checks.map((c) => [c.designator, c]));
      const minY = Math.min(...moves.map((m) => m.y));
      const minX = Math.min(...moves.map((m) => m.x));
      const outOfFrame = minX < 40 ? `x=${minX}` : minY < 40 ? `y=${minY}` : null;
      const warnings = [];
      if (declared.size === 0) {
        warnings.push("\u6CA1\u4F20 nets \u58F0\u660E\uFF0C\u65E0\u4ECE\u5224\u65AD\u65B9\u4F4D\uFF0C\u5668\u4EF6\u5168\u5806\u5230\u4E86\u53F3\u8FB9\u4E00\u5217 \u2014\u2014 \u8865\u4E0A nets \u518D\u6392\u4E00\u6B21");
      }
      if (minY < 40) warnings.push(`\u6700\u4E0A\u9762\u7684\u5668\u4EF6 y=${minY} \u5DF2\u8D34\u8FD1\u56FE\u6846\u4E0A\u6CBF\uFF0C\u628A center_y \u8C03\u5927\u4E9B`);
      if (outOfFrame) warnings.push(`\u6709\u5668\u4EF6\u6392\u5230\u4E86\u56FE\u6846\u5916\uFF08${outOfFrame}\uFF09`);
      if (!check.allOk) warnings.push(check.summary);
      return schHint({
        ok: true,
        core,
        core_size: { w: coreInfo.w, h: coreInfo.h },
        declared_pins: declared.size,
        moved: w.moved,
        // x/y 是回读到的实际位置；requested_x/y 只在两者不符时出现
        placed: moves.map((m) => {
          const got = actualOf.get(m.des);
          const ok = got?.ok !== false;
          return {
            des: m.des,
            side: m.side,
            x: got?.actualX ?? m.x,
            y: got?.actualY ?? m.y,
            ...ok ? {} : { requested_x: m.x, requested_y: m.y, problem: got?.note }
          };
        }),
        positions_verified: check.allOk,
        unresolved: unresolved.length ? unresolved : void 0,
        warning: warnings.length ? warnings.join("\uFF1B") : void 0,
        note: check.allOk ? "\u5757\u5185\u5DF2\u6309\u58F0\u660E\u7684\u8FDE\u63A5\u5173\u7CFB\u6392\u5E03\uFF0C\u4F4D\u7F6E\u90FD\u5DF2\u56DE\u8BFB\u786E\u8BA4\u3002\u6574\u5F20\u56FE\u6392\u5B8C\u540E\u8DD1 eda_auto_route\u3002" : "\u6392\u5E03\u5199\u56DE\u4E86\uFF0C\u4F46\u56DE\u8BFB\u53D1\u73B0\u6709\u5668\u4EF6\u6CA1\u5230\u4F4D \u2014\u2014 \u5148\u770B placed \u91CC\u7684 problem\uFF0C\u522B\u6025\u7740\u8D70\u7EBF\u3002"
      });
    }
  },
  {
    name: "eda_arrange_components",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u6279\u91CF\u79FB\u52A8 / \u65CB\u8F6C\u5668\u4EF6 \u2014\u2014 \u529F\u80FD\u5206\u533A\u5E03\u5C40\u7684\u6267\u884C\u624B\u6BB5\u3002\n\n\u4E00\u6B21\u4F20\u591A\u4E2A {designator, x, y, rotation?, mirror?}\uFF0C\u6BD4\u9010\u4E2A\u8C03\u7528\u5FEB\u5F97\u591A\u3002\u5750\u6807\u5355\u4F4D 0.01 inch\uFF0Crotation \u9006\u65F6\u9488\u4E3A\u6B63\u3002\n\n**\u5178\u578B\u7528\u6CD5\u662F\u6309\u529F\u80FD\u5206\u533A**\uFF1A\u5148\u60F3\u6E05\u695A\u8FD9\u5F20\u56FE\u5206\u51E0\u4E2A\u529F\u80FD\u5757\uFF08\u7535\u6E90\u3001\u65F6\u949F\u3001MCU\u3001\u6A21\u62DF\u524D\u7AEF\u3001ADC/DAC\u3001\u63A5\u53E3\u2026\uFF09\uFF0C\u7ED9\u6BCF\u5757\u5212\u4E00\u7247\u56FE\u7EB8\u533A\u57DF\uFF0C\u518D\u628A\u5404\u5757\u7684\u5668\u4EF6\u6446\u8FDB\u53BB\u3002\u6446\u5B8C\u8DD1 eda_auto_route\uFF0C\u8FDE\u7EBF\u81EA\u7136\u5C31\u77ED\u800C\u6E05\u6670\u3002\n\n\u53EA\u60F3\u8BA9\u7B97\u6CD5\u6392\u3001\u4E0D\u5728\u610F\u5206\u533A\u65F6\uFF0C\u7528 eda_auto_layout \u66F4\u7701\u4E8B\u3002",
    inputSchema: {
      type: "object",
      properties: {
        placements: {
          type: "array",
          description: "\u6BCF\u9879 {designator, x, y, rotation?, mirror?}",
          items: {
            type: "object",
            properties: {
              designator: { type: "string" },
              x: { type: "number" },
              y: { type: "number" },
              rotation: { type: "number" },
              mirror: { type: "boolean" }
            },
            required: ["designator", "x", "y"]
          }
        }
      },
      required: ["placements"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const list = args.placements;
      if (!Array.isArray(list) || !list.length) throw new Error("placements \u5FC5\u987B\u662F\u975E\u7A7A\u6570\u7EC4");
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const want = ${JSON.stringify(list)};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
				const okList = [], failList = [];
				for (const w of want) {
					const c = byDes[String(w.designator).toUpperCase()];
					if (!c) { failList.push({ designator: w.designator, error: '\u627E\u4E0D\u5230\u8BE5\u4F4D\u53F7' }); continue; }
					const prop = { x: w.x, y: w.y };
					if (w.rotation !== undefined) prop.rotation = w.rotation;
					if (w.mirror !== undefined) prop.mirror = w.mirror;
					const m = await eda.sch_PrimitiveComponent.modify(c.primitiveId, prop);
					if (m) okList.push(w.designator); else failList.push({ designator: w.designator, error: 'modify \u8FD4\u56DE\u5931\u8D25' });
				}
				return { ok: failList.length === 0, moved: okList.length, failed: failList.length,
					failures: failList.slice(0, 10), page: _page.name,
					note: '\u4F4D\u7F6E\u53D8\u4E86\uFF0C\u8BB0\u5F97\u8DD1 eda_auto_route \u91CD\u65B0\u6574\u7406\u8FDE\u7EBF\u3002' };
			`,
          18e4
        )
      );
    }
  },
  {
    name: "eda_wire_block",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u628A\u4E00\u4E2A\u529F\u80FD\u5757\u5185\u90E8\u7684\u5F15\u811A\u7528**\u771F\u5B9E\u5BFC\u7EBF**\u8FDE\u8D77\u6765 \u2014\u2014 \u5757\u5185\u8FDE\u63A5\u7684\u6B63\u786E\u505A\u6CD5\u3002\n\n\u4E3A\u4EC0\u4E48\u4E0D\u7528\u9010\u5F15\u811A\u8D34\u7F51\u7EDC\u6807\u7B7E\uFF1A\u4E24\u7AEF\u5404\u8D34\u4E00\u4E2A\u540C\u540D\u6807\u7B7E\uFF0C\u7535\u6C14\u4E0A\u6210\u7ACB\uFF0C\u4F46\u4EBA\u5F97\u6EE1\u56FE\u627E\u540C\u540D\u6587\u5B57\u624D\u80FD\u770B\u51FA\u8C01\u8FDE\u8C01\uFF1B\u5BC6\u96C6\u82AF\u7247\u4E0A\u6807\u7B7E\u8FD8\u4F1A\u4E92\u76F8\u538B\u4F4F\u3002**\u5757\u5185\u5668\u4EF6\u4E4B\u95F4\u5C31\u8BE5\u6709\u770B\u5F97\u89C1\u7684\u7EBF\u3002**\n\n\u7ED9\u5B83\u4E00\u4EFD nets \u58F0\u660E\uFF0C\u5B83\u4F1A\uFF1A\n- \u7535\u6E90\u3001\u5730\u7F51\u7EDC \u2192 \u8DF3\u8FC7\uFF08\u4EA4\u7ED9 eda_label_nets \u653E\u7B26\u53F7\uFF09\n- \u4E24\u4E2A\u5F15\u811A \u2192 \u76F4\u7EBF\u6216 L \u5F62\u8FDE\u8D77\u6765\n- \u4E09\u4E2A\u4EE5\u4E0A \u2192 \u62C9\u4E00\u6761\u4E3B\u5E72\uFF0C\u5404\u5F15\u811A\u5F15\u77ED\u7EBF\u63A5\u4E0A\u53BB\uFF08\u603B\u7EBF\u5F0F\uFF0C\u6700\u6E05\u6670\uFF09\n\n\u8DE8\u533A\u7684\u7F51\u7EDC\u4E0D\u8981\u653E\u8FDB\u6765 \u2014\u2014 \u957F\u7EBF\u7A7F\u8D8A\u56FE\u7EB8\u662F\u53EF\u8BFB\u6027\u7684\u5934\u53F7\u6740\u624B\uFF0C\u8DE8\u533A\u7528 eda_add_net_identifier \u653E IN/OUT \u7AEF\u53E3\u3002",
    inputSchema: {
      type: "object",
      properties: {
        nets: {
          type: "object",
          description: '{ \u7F51\u7EDC\u540D: ["\u4F4D\u53F7.\u5F15\u811A\u53F7", \u2026] }\uFF0C\u4E0E eda_arrange_block \u540C\u683C\u5F0F',
          additionalProperties: { type: "array", items: { type: "string" } }
        },
        include_power: {
          type: "boolean",
          description: "\u662F\u5426\u4E5F\u7ED9\u7535\u6E90\u5730\u7F51\u7EDC\u753B\u7EBF\uFF0C\u9ED8\u8BA4 false\uFF08\u7535\u6E90\u5730\u5E94\u8BE5\u7528\u7B26\u53F7\uFF0C\u4E0D\u8BE5\u62C9\u7EBF\uFF09"
        }
      },
      required: ["nets"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const nets = args.nets && typeof args.nets === "object" ? args.nets : {};
      const includePower = args.include_power === true;
      const GND = ["GND", "AGND", "DGND", "PGND", "SGND", "VSS", "VEE", "GNDA", "GNDD", "EARTH"];
      const isPowerish = (n) => {
        const u = n.toUpperCase();
        if (GND.includes(u)) return true;
        if (u.startsWith("VCC") || u.startsWith("VDD") || u.startsWith("VBAT") || u === "V+") return true;
        const c0 = u.charCodeAt(0);
        return (c0 >= 48 && c0 <= 57 || u.charAt(0) === "+") && u.includes("V");
      };
      const groups = [];
      const skipped = [];
      for (const [net, refs] of Object.entries(nets)) {
        if (!includePower && isPowerish(net)) {
          skipped.push(net);
          continue;
        }
        const parsed = [];
        for (const ref of Array.isArray(refs) ? refs : []) {
          const dot = String(ref).lastIndexOf(".");
          if (dot <= 0) continue;
          parsed.push({ des: String(ref).slice(0, dot).toUpperCase(), pin: String(ref).slice(dot + 1) });
        }
        if (parsed.length >= 2) groups.push({ net, refs: parsed });
        else if (parsed.length === 1) skipped.push(`${net}(\u53EA\u6709\u4E00\u4E2A\u5F15\u811A)`);
      }
      if (!groups.length) {
        return { ok: true, wired: 0, skipped, note: "\u6CA1\u6709\u9700\u8981\u753B\u7EBF\u7684\u7F51\u7EDC\uFF08\u7535\u6E90\u5730\u9ED8\u8BA4\u8DF3\u8FC7\uFF0C\u5355\u5F15\u811A\u7F51\u7EDC\u65E0\u6CD5\u6210\u7EBF\uFF09\u3002" };
      }
      const r = await ctx2.exec(
        `
				${ENSURE_SCH5}
				const GROUPS = ${JSON.stringify(groups)};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
				const pinCache = {};
				const getPins = async (des) => {
					if (!pinCache[des]) {
						const c = byDes[des];
						pinCache[des] = c ? (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId) || []) : [];
					}
					return pinCache[des];
				};
				const findPin = async (des, key) => {
					const pins = await getPins(des);
					const k = String(key).toUpperCase();
					for (const x of pins) if (String(x.pinNumber || '').toUpperCase() === k) return x;
					for (const x of pins) if (String(x.pinName || '').toUpperCase() === k) return x;
					return null;
				};
				// \u5F15\u811A\u5FC5\u987B\u4ECE\u671D\u5411\u90A3\u4E00\u4FA7\u63A5\u5165\uFF0C\u4ECE\u7B26\u53F7\u5185\u4FA7\u753B\u8FDB\u53BB EDA \u4E0D\u8BA4\u8FD9\u4E2A\u8FDE\u63A5\u3002
				// \u5F15\u51FA\u957F\u5EA6**\u6309\u7F51\u7EDC\u9010\u4E2A\u9519\u5F00**\uFF1A\u4E24\u4E2A\u7F51\u7EDC\u82E5\u90FD\u4ECE\u540C\u4E00\u9897\u82AF\u7247\u7684\u76F8\u90BB\u5F15\u811A\u5F15\u51FA\u3001
				// \u53C8\u90FD\u8981\u6298\u8FD4\u5230\u540C\u4E00\u4FA7\uFF0C\u7528\u540C\u4E00\u4E2A\u957F\u5EA6\u5C31\u4F1A\u8BA9\u4E24\u6761\u7AD6\u76F4\u6BB5\u843D\u5728\u540C\u4E00\u4E2A x \u4E0A\u3002
				// \u539F\u7406\u56FE\u91CC\u91CD\u53E0\u7684\u5BFC\u7EBF\u4F1A\u88AB\u5224\u5B9A\u4E3A\u7535\u6C14\u76F8\u8FDE \u2014\u2014 \u5B9E\u6D4B FB \u4E0E AOUT \u56E0\u6B64\u77ED\u8DEF\uFF0C
				// \u7B49\u4E8E\u628A\u53CD\u9988\u7535\u963B\u6574\u4E2A\u65C1\u8DEF\u6389\uFF0C\u800C DRC \u4E00\u58F0\u4E0D\u542D\u3002
				const outward = (p, stub) => {
					const r = ((Number(p.rotation) % 360) + 360) % 360;
					if (r === 0) return [stub, 0];
					if (r === 90) return [0, -stub];
					if (r === 180) return [-stub, 0];
					return [0, stub];
				};

				const done = [], failed = [];
				for (let gi = 0; gi < GROUPS.length; gi++) {
					const g = GROUPS[gi];
					const stub = 20 + (gi % 5) * 12; // \u6BCF\u4E2A\u7F51\u7EDC\u9519\u5F00 12\uFF0C\u4E94\u4E2A\u4E00\u5FAA\u73AF
					const pts = [];
					let bad = false;
					for (const ref of g.refs) {
						if (!byDes[ref.des]) { failed.push({ net: g.net, why: '\u56FE\u4E0A\u6CA1\u6709 ' + ref.des }); bad = true; break; }
						const p = await findPin(ref.des, ref.pin);
						if (!p) { failed.push({ net: g.net, why: ref.des + ' \u4E0A\u627E\u4E0D\u5230\u5F15\u811A ' + ref.pin }); bad = true; break; }
						const d = outward(p, stub);
						pts.push({ ref: ref.des + '.' + ref.pin, x: p.x, y: p.y, ex: p.x + d[0], ey: p.y + d[1] });
					}
					if (bad) continue;

					let segs = 0;
					if (pts.length === 2) {
						const a = pts[0], b = pts[1];
						if (a.y === b.y || a.x === b.x) {
							// \u6B63\u597D\u5171\u7EBF\uFF1A\u4E00\u6761\u76F4\u7EBF\u5230\u5E95
							if (await eda.sch_PrimitiveWire.create([a.x, a.y, b.x, b.y], g.net)) segs += 1;
						} else {
							// L \u5F62\uFF1A\u5148\u5404\u81EA\u671D\u5916\u5F15\u51FA\uFF0C\u518D\u6298\u4E00\u4E2A\u76F4\u89D2\u63A5\u4E0A
							const w = await eda.sch_PrimitiveWire.create([a.x, a.y, a.ex, a.ey, a.ex, b.y, b.x, b.y], g.net);
							if (w) segs += 1;
							else if (await eda.sch_PrimitiveWire.create([a.x, a.y, a.ex, a.ey, b.ex, a.ey, b.ex, b.ey, b.x, b.y], g.net)) segs += 1;
						}
					} else {
						// \u4E09\u4E2A\u4EE5\u4E0A\uFF1A\u62C9\u4E00\u6761\u4E3B\u5E72\uFF0C\u5404\u5F15\u811A\u5F15\u77ED\u7EBF\u63A5\u4E0A\u53BB\u3002
						// \u4E3B\u5E72\u8D70\u5411\u53D6\u51B3\u4E8E\u5F15\u811A\u662F\u6A2A\u5411\u6563\u5F00\u8FD8\u662F\u7EB5\u5411\u6563\u5F00\u3002
						let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
						for (const p of pts) {
							if (p.ex < minX) minX = p.ex;
							if (p.ex > maxX) maxX = p.ex;
							if (p.ey < minY) minY = p.ey;
							if (p.ey > maxY) maxY = p.ey;
						}
						const horizontal = (maxX - minX) >= (maxY - minY);
						if (horizontal) {
							const ys = pts.map((p) => p.ey).sort((a, b) => a - b);
							const trunk = ys[Math.floor(ys.length / 2)];
							if (await eda.sch_PrimitiveWire.create([minX, trunk, maxX, trunk], g.net)) segs += 1;
							for (const p of pts) {
								const path = p.ey === trunk ? [p.x, p.y, p.ex, p.ey] : [p.x, p.y, p.ex, p.ey, p.ex, trunk];
								if (await eda.sch_PrimitiveWire.create(path, g.net)) segs += 1;
							}
						} else {
							const xs = pts.map((p) => p.ex).sort((a, b) => a - b);
							const trunk = xs[Math.floor(xs.length / 2)];
							if (await eda.sch_PrimitiveWire.create([trunk, minY, trunk, maxY], g.net)) segs += 1;
							for (const p of pts) {
								const path = p.ex === trunk ? [p.x, p.y, p.ex, p.ey] : [p.x, p.y, p.ex, p.ey, trunk, p.ey];
								if (await eda.sch_PrimitiveWire.create(path, g.net)) segs += 1;
							}
						}
					}
					if (segs) done.push(g.net + '(' + pts.length + '\u811A/' + segs + '\u6BB5)');
					else failed.push({ net: g.net, why: '\u5BFC\u7EBF\u521B\u5EFA\u5931\u8D25' });
				}
				return { ok: failed.length === 0, wired: done.length, done, failed };
			`,
        18e4
      );
      return schHint({ ...r, skipped_power_nets: skipped.length ? skipped : void 0 });
    }
  },
  {
    name: "eda_draw_zone",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u7ED9\u4E00\u4E2A\u529F\u80FD\u533A\u753B\u8FB9\u6846\u3001\u6807\u9898\u548C\u8BF4\u660E \u2014\u2014 \u8BA9\u4EBA\u4E00\u773C\u770B\u51FA\u8FD9\u5757\u7535\u8DEF\u662F\u5E72\u4EC0\u4E48\u7684\u3002\n\n\u5206\u533A\u4E0D\u662F\u6446\u4F4D\u7F6E\u5C31\u5B8C\u4E8B\u4E86\uFF1A\u6846\u8D77\u6765\u3001\u5199\u4E0A\u300C\u7535\u6E90 +5V\u2192+3V3\u300D\u8FD9\u6837\u7684\u6807\u9898\uFF0C\u518D\u8865\u4E00\u53E5\u529F\u80FD\u8BF4\u660E\uFF0C\u8BFB\u56FE\u7684\u4EBA\u4E0D\u7528\u9010\u4E2A\u5668\u4EF6\u63A8\u6572\u5C31\u77E5\u9053\u6BCF\u5757\u5728\u505A\u4EC0\u4E48\u3002\n\n\u6846\u8981\u7559\u51FA\u4F59\u91CF\uFF08\u6BD4\u5668\u4EF6\u5305\u56F4\u76D2\u6BCF\u8FB9\u591A 40 \u4EE5\u4E0A\uFF09\uFF0C\u6807\u9898\u5199\u5728\u6846\u5185\u5DE6\u4E0A\u89D2\u3002\u5148\u628A\u8FD9\u4E00\u533A\u7684\u5668\u4EF6\u90FD\u6446\u597D\u3001\u91CF\u51FA\u5B9E\u9645\u8303\u56F4\uFF0C\u518D\u753B\u6846 \u2014\u2014 \u5668\u4EF6\u52A8\u4E86\u6846\u4E0D\u4F1A\u8DDF\u7740\u52A8\u3002\n\n\u5750\u6807\u7ED9\u4E24\u4E2A\u5BF9\u89D2\u70B9\u5373\u53EF\uFF08\u5DE5\u5177\u5185\u90E8\u4F1A\u8F6C\u6210 EDA \u8981\u7684 topLeft+\u5BBD\u9AD8\uFF1B`sch_PrimitiveRectangle.create` \u7684\u5B9E\u9645\u7B7E\u540D\u662F (topLeftX, topLeftY, width, height)\uFF0C\u4E0D\u662F\u4E24\u70B9\u5F0F\uFF0C\u76F4\u63A5\u6309\u4E24\u70B9\u4F20\u4F1A\u753B\u51FA\u4E00\u4E2A\u5DE8\u6846\u8DD1\u5230\u56FE\u7EB8\u5916\uFF09\u3002",
    inputSchema: {
      type: "object",
      properties: {
        x1: { type: "number", description: "\u6846\u5DE6\u4E0B\u89D2 X\uFF080.01 inch\uFF09" },
        y1: { type: "number", description: "\u6846\u5DE6\u4E0B\u89D2 Y" },
        x2: { type: "number", description: "\u6846\u53F3\u4E0A\u89D2 X" },
        y2: { type: "number", description: "\u6846\u53F3\u4E0A\u89D2 Y" },
        title: { type: "string", description: "\u533A\u6807\u9898\uFF0C\u5982\u300C\u7535\u6E90 +5V\u2192+3V3\u300D" },
        note: { type: "string", description: "\u53EF\u9009\uFF0C\u4E00\u53E5\u529F\u80FD\u8BF4\u660E" }
      },
      required: ["x1", "y1", "x2", "y2", "title"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const x1 = num(args, "x1");
      const y1 = num(args, "y1");
      const x2 = num(args, "x2");
      const y2 = num(args, "y2");
      const title = requireString(args, "title");
      const note = optionalString(args, "note");
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				// \u5B9E\u6D4B\u7B7E\u540D\u662F (topLeftX, topLeftY, width, height)\uFF0C**\u4E0D\u662F\u4E24\u4E2A\u5BF9\u89D2\u70B9**\uFF1B
				// \u800C\u4E14\u539F\u7406\u56FE y \u8F74\u5411\u4E0A\uFF0C\u6240\u4EE5 topLeftY \u8981\u53D6\u8F83\u5927\u7684\u90A3\u4E2A y\uFF0C\u9AD8\u5EA6\u5F80\u4E0B\u7B97\u3002
				// \u7167\u4E24\u70B9\u5F0F\u4F20\u4F1A\u753B\u51FA\u4E00\u4E2A\u5BBD\u9AD8\u7B49\u4E8E\u5BF9\u89D2\u5750\u6807\u7684\u5DE8\u6846\uFF0C\u8DD1\u5230\u56FE\u7EB8\u5916\u9762\u53BB\u3002
				const rc = await eda.sch_PrimitiveRectangle.create(${Math.min(x1, x2)}, ${Math.max(y1, y2)}, ${Math.abs(x2 - x1)}, ${Math.abs(y2 - y1)});
				// \u9ED8\u8BA4\u6837\u5F0F\uFF08color/lineWidth \u90FD\u662F null\uFF09\u753B\u51FA\u6765\u6781\u6DE1\uFF0C\u7F29\u653E\u4E00\u5C0F\u5C31\u5B8C\u5168\u770B\u4E0D\u89C1\u4E86\uFF0C
				// \u7B49\u4E8E\u767D\u6846\u3002\u7ED9\u4E2A\u660E\u786E\u7684\u7070\u84DD\u865A\u7EBF\uFF0C\u65E2\u80FD\u4E00\u773C\u770B\u6E05\u5206\u533A\u8FB9\u754C\uFF0C\u53C8\u4E0D\u4F1A\u8DDF\u4FE1\u53F7\u7EBF\u62A2\u773C\u3002
				if (rc) {
					await eda.sch_PrimitiveRectangle.modify(rc.primitiveId, {
						color: '#5B7FA6',
						lineWidth: 2,
						lineType: 1,
					}).catch(() => undefined);
				}
				// \u6807\u9898\u653E\u5728\u6846**\u5185**\u5DE6\u4E0A\u89D2\u3002\u653E\u6846\u5916\u770B\u7740\u6E05\u723D\uFF0C\u4F46\u533A\u6846\u5E38\u5E38\u7D27\u8D34\u56FE\u7EB8\u8FB9\u7F18\uFF0C
				// \u5F80\u5916\u632A\u4E00\u70B9\u6807\u9898\u5C31\u6389\u5230\u56FE\u7EB8\u5916\u9762\u53BB\u4E86 \u2014\u2014 \u5B9E\u6D4B A4 \u4E0A\u5C31\u8FD9\u4E48\u4E22\u8FC7\u4E00\u6B21\u3002
				// \u7B7E\u540D\u662F create(x, y, text) \u2014\u2014 \u5750\u6807\u5728\u524D\u3002\u4F20\u6210 (text, x, y) \u7684\u8BDD
				// \u6587\u5B57\u4F1A\u88AB\u5F53\u6210 x \u5750\u6807\uFF0C\u56FE\u5143\u8DD1\u5230\u5929\u8FB9\u53BB\uFF0C\u56FE\u4E0A\u4EC0\u4E48\u90FD\u770B\u4E0D\u89C1\u3002
				const t = await eda.sch_PrimitiveText.create(${Math.min(x1, x2)} + 15, ${Math.max(y1, y2)} - 25, ${JSON.stringify(title)});
				let n = null;
				${note ? `n = await eda.sch_PrimitiveText.create(${Math.min(x1, x2)} + 15, ${Math.max(y1, y2)} - 45, ${JSON.stringify(note)});` : ""}
				return {
					ok: !!rc, rect_id: rc && rc.primitiveId, title_id: t && t.primitiveId, note_id: n && n.primitiveId,
					box: [${Math.min(x1, x2)}, ${Math.min(y1, y2)}, ${Math.max(x1, x2)}, ${Math.max(y1, y2)}],
				};
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_mark_nc",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u7ED9\u4E0D\u4F7F\u7528\u7684\u5F15\u811A\u6253 NC \u6807\u8BB0\u3002\n\n\u88F8\u9732\u60AC\u7A7A\u7684\u5F15\u811A\uFF0C\u8BFB\u56FE\u7684\u4EBA\u5206\u4E0D\u6E05\u662F**\u6709\u610F\u4E0D\u63A5**\u8FD8\u662F**\u753B\u6F0F\u4E86**\u3002\u82AF\u7247\u7684 NC \u7A7A\u811A\u3001\u672A\u7528\u7684\u903B\u8F91\u95E8\u8F93\u51FA\u3001\u5355\u5411\u4F7F\u7528\u7684\u6536\u53D1\u5668\u63A5\u6536\u7AEF\uFF0C\u90FD\u8BE5\u660E\u786E\u6807\u51FA\u6765\u3002\n\n\u6CE8\u610F\uFF1A\u7ACB\u521B\u7684\u6269\u5C55 API \u6CA1\u6709\u5F00\u653E\u539F\u751F\u300C\u975E\u8FDE\u63A5\u6807\u5FD7\u300D\uFF0C\u8FD9\u91CC\u7528\u5F15\u811A\u7AEF\u70B9\u5904\u7684 \u2715 \u7B26\u53F7\u7B49\u6548\u8868\u8FBE \u2014\u2014 \u89C6\u89C9\u4E0A\u4E00\u81F4\uFF0C\u4F46\u4E0D\u53C2\u4E0E\u7535\u6C14\u68C0\u67E5\uFF0C\u6240\u4EE5 eda_check_schematic \u4ECD\u4F1A\u628A\u5B83\u4EEC\u7B97\u4F5C\u60AC\u7A7A\uFF0C\u628A\u8FD9\u4E9B\u5F15\u811A\u586B\u8FDB\u8BE5\u5DE5\u5177\u7684 allow_floating \u5373\u53EF\u3002",
    inputSchema: {
      type: "object",
      properties: {
        pins: {
          type: "array",
          items: { type: "string" },
          description: '\u8981\u6807\u8BB0\u7684\u5F15\u811A\uFF0C\u5982 ["U2.2","U2.3","U12.6"]'
        }
      },
      required: ["pins"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const refs = (Array.isArray(args.pins) ? args.pins : []).map((x) => String(x));
      if (!refs.length) throw new Error("pins \u4E0D\u80FD\u4E3A\u7A7A");
      const jobs = refs.map((ref) => {
        const dot = ref.lastIndexOf(".");
        return dot <= 0 ? null : { des: ref.slice(0, dot).toUpperCase(), pin: ref.slice(dot + 1) };
      }).filter(Boolean);
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const JOBS = ${JSON.stringify(jobs)};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
				const done = [], failed = [];
				for (const j of JOBS) {
					const c = byDes[j.des];
					if (!c) { failed.push(j.des + '.' + j.pin + ' \u56FE\u4E0A\u6CA1\u6709\u8FD9\u4E2A\u4F4D\u53F7'); continue; }
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					const k = String(j.pin).toUpperCase();
					let p = null;
					for (const x of (pins || [])) if (String(x.pinNumber || '').toUpperCase() === k) { p = x; break; }
					if (!p) for (const x of (pins || [])) if (String(x.pinName || '').toUpperCase() === k) { p = x; break; }
					if (!p) { failed.push(j.des + '.' + j.pin + ' \u627E\u4E0D\u5230\u8BE5\u5F15\u811A'); continue; }
					const t = await eda.sch_PrimitiveText.create(p.x - 4, p.y - 4, String.fromCharCode(10005));
					if (t) done.push(j.des + '.' + String(p.pinNumber));
					else failed.push(j.des + '.' + j.pin + ' \u6807\u8BB0\u521B\u5EFA\u5931\u8D25');
				}
				return { ok: failed.length === 0, marked: done.length, done, failed };
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_auto_route",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u8BA9 EDA \u81EA\u52A8\u6574\u7406\u5F53\u524D\u539F\u7406\u56FE\u9875\u7684\u8FDE\u7EBF\uFF0C\u628A\u6563\u843D\u7684\u77ED\u5F15\u51FA\u7EBF\u6574\u7406\u6210\u6B63\u89C4\u8D70\u7EBF\u3002\n\n**\u5FC5\u987B\u4F20 nets**\uFF08\u548C eda_arrange_block / eda_label_nets \u540C\u4E00\u4EFD\u58F0\u660E\uFF09\u3002\u5B9E\u6D4B EDA \u7684\u5E03\u7EBF\u7B97\u6CD5\u5728\u91CD\u7EC4\u8FDE\u7EBF\u65F6\u4F1A\u628A\u5BFC\u7EBF\u4ECE\u5F15\u811A\u4E0A\u626F\u6389 \u2014\u2014 \u4E00\u6B21\u5168\u56FE\u5E03\u7EBF\u540E 148 \u4E2A\u5F15\u811A\u53EA\u5269 60 \u4E2A\u8FD8\u8FDE\u7740\uFF0C\u800C DRC \u7167\u6837\u62A5 0 \u9519\u8BEF\u3001\u5668\u4EF6\u548C\u7F51\u7EDC\u540D\u4E5F\u90FD\u8FD8\u5728\uFF0C\u5149\u770B DRC \u6839\u672C\u53D1\u73B0\u4E0D\u4E86\u3002\n\n\u4F20\u4E86 nets\uFF0C\u5DE5\u5177\u4F1A\u5728\u5E03\u7EBF\u540E\u9010\u4E2A\u5F15\u811A\u6838\u5BF9\uFF0C\u628A\u88AB\u626F\u6389\u7684\u91CD\u65B0\u63A5\u56DE\u53BB\uFF0C\u5E76\u62A5\u544A\u4FEE\u590D\u6570\u91CF\u3002\u4E0D\u4F20\u5C31\u53EA\u5E03\u7EBF\u4E0D\u6821\u9A8C\uFF0C**\u65AD\u4E86\u4E5F\u4E0D\u4F1A\u6709\u4EBA\u544A\u8BC9\u4F60**\u3002\n\n\u5DE5\u4F5C\u6D41\uFF1Aeda_place_component \u2192 eda_arrange_block(nets) \u2192 eda_label_nets(nets) \u2192 **eda_auto_route(nets)**\u3002",
    inputSchema: {
      type: "object",
      properties: {
        component_uuids: {
          type: "array",
          items: { type: "string" },
          description: "\u53EF\u9009\uFF0C\u53EA\u5904\u7406\u8FD9\u4E9B\u5668\u4EF6\uFF08\u56FE\u5143 id\uFF09\uFF1B\u4E0D\u7ED9\u5219\u5904\u7406\u5168\u56FE\u6240\u6709\u672A\u5E03\u7EBF\u7F51\u7EDC"
        },
        nets: {
          type: "object",
          description: '**\u5F3A\u70C8\u5EFA\u8BAE\u4F20**\uFF0C\u683C\u5F0F\u4E0E eda_arrange_block / eda_label_nets \u5B8C\u5168\u76F8\u540C\uFF1A{ "+24V": ["U1.3","C11.1"], \u2026 }\u3002\u5E03\u7EBF\u7B97\u6CD5\u4F1A\u626F\u65AD\u5F15\u811A\u8FDE\u63A5\uFF0C\u6709\u4E86\u8FD9\u4EFD\u58F0\u660E\u5DE5\u5177\u624D\u80FD\u6838\u5BF9\u5E76\u81EA\u52A8\u63A5\u56DE\u3002',
          additionalProperties: { type: "array", items: { type: "string" } }
        }
      }
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const uuids = Array.isArray(args.component_uuids) ? args.component_uuids : null;
      const nets = args.nets && typeof args.nets === "object" ? args.nets : {};
      const jobs = [];
      for (const [net, refs] of Object.entries(nets)) {
        for (const ref of Array.isArray(refs) ? refs : []) {
          const dot = String(ref).lastIndexOf(".");
          if (dot <= 0) continue;
          jobs.push({ des: String(ref).slice(0, dot).toUpperCase(), pin: String(ref).slice(dot + 1), net });
        }
      }
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const stat = async () => {
					const src = await eda.sys_FileManager.getDocumentSource();
					const n = (t) => (src.match(new RegExp('"type":"' + t + '"', 'g')) || []).length;
					return { wires: n('WIRE'), lines: n('LINE') };
				};
				const before = await stat();
				const t0 = Date.now();
				const props = ${uuids ? `{ uuids: ${JSON.stringify(uuids)} }` : "undefined"};
				await eda.sch_Document.autoRouting(props);
				const after = await stat();

				// \u2500\u2500 \u5E03\u7EBF\u540E\u81EA\u68C0\uFF1AEDA \u7684\u7B97\u6CD5\u4F1A\u628A\u5BFC\u7EBF\u4ECE\u5F15\u811A\u4E0A\u626F\u6389 \u2500\u2500
				// getDocumentSource \u6709\u7F13\u5B58\uFF0C\u5E03\u7EBF\u521A\u7ED3\u675F\u5C31\u8BFB\u4F1A\u62FF\u5230\u65E7\u5185\u5BB9\uFF0C\u770B\u8D77\u6765\u4E00\u5207\u6B63\u5E38\u3002
				// \u5FC5\u987B\u7B49\u4E00\u4E0B\u518D\u8BFB\uFF0C\u5426\u5219\u8FD9\u6BB5\u6821\u9A8C\u5F62\u540C\u865A\u8BBE\u3002
				const JOBS = ${JSON.stringify(jobs)};
				let repaired = 0, stillOff = [];
				if (JOBS.length) {
					await new Promise((r) => setTimeout(r, 1500));
					const endpoints = () => {
						const out = [];
						for (const ln of String(srcCache).split(String.fromCharCode(10))) {
							if (ln.indexOf('"type":"LINE"') < 0) continue;
							const q = ln.indexOf('||');
							if (q < 0) continue;
							let body = ln.slice(q + 2);
							const last = body.lastIndexOf('|');
							if (last >= 0) body = body.slice(0, last);
							let o = null;
							try { o = JSON.parse(body); } catch (e) { continue; }
							if (o.startX == null) continue;
							out.push([o.startX, -o.startY]);
							out.push([o.endX, -o.endY]);
						}
						return out;
					};
					var srcCache = await eda.sys_FileManager.getDocumentSource();
					let pts = endpoints();

					const all = await eda.sch_PrimitiveComponent.getAll();
					const byDes = {};
					for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
					const pinCache = {};
					const getPins = async (des) => {
						if (!pinCache[des]) {
							const c = byDes[des];
							pinCache[des] = c ? (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId) || []) : [];
						}
						return pinCache[des];
					};

					for (const j of JOBS) {
						const pins = await getPins(j.des);
						const key = String(j.pin).toUpperCase();
						let p = null;
						for (const x of pins) if (String(x.pinNumber || '').toUpperCase() === key) { p = x; break; }
						if (!p) for (const x of pins) if (String(x.pinName || '').toUpperCase() === key) { p = x; break; }
						if (!p) continue;
						let ok = false;
						for (const pt of pts) {
							if (Math.abs(pt[0] - p.x) + Math.abs(pt[1] - p.y) < 2) { ok = true; break; }
						}
						if (ok) continue;
						// \u63A5\u56DE\u53BB\u3002\u957F\u5EA6\u53D6 30 \u800C\u4E0D\u662F 20 \u2014\u2014
						// \u5B9E\u6D4B stub \u7AEF\u70B9\u843D\u5728\u522B\u7684\u7EBF\u7AEF\u70B9\u65C1\u8FB9 1-2 \u4E2A\u5355\u4F4D\u65F6\uFF0Ccreate \u4F1A\u9759\u9ED8\u5931\u8D25
						// \uFF08\u8FD4\u56DE\u5BF9\u8C61\u4F46\u7EBF\u4E0D\u843D\u5728\u5F15\u811A\u4E0A\uFF09\uFF0C\u62C9\u957F\u4E00\u70B9\u5C31\u80FD\u907F\u5F00\u3002
						const rot = ((Number(p.rotation) % 360) + 360) % 360;
						const L = 30;
						const d = rot === 0 ? [L, 0] : rot === 90 ? [0, -L] : rot === 180 ? [-L, 0] : rot === 270 ? [0, L] : [L, 0];
						const w = await eda.sch_PrimitiveWire.create([p.x, p.y, p.x + d[0], p.y + d[1]], j.net);
						if (w) repaired += 1;
						else stillOff.push(j.des + '.' + j.pin);
					}
				}

				return {
					ok: true, page: _page.name, elapsed_ms: Date.now() - t0,
					before, after,
					checked_pins: JOBS.length,
					repaired_after_routing: repaired,
					still_disconnected: stillOff.length ? stillOff : undefined,
					note: JOBS.length
						? (repaired
							? '\u5E03\u7EBF\u7B97\u6CD5\u626F\u65AD\u4E86 ' + repaired + ' \u4E2A\u5F15\u811A\u8FDE\u63A5\uFF0C\u5DF2\u6309 nets \u58F0\u660E\u63A5\u56DE\u3002'
							: '\u5E03\u7EBF\u5B8C\u6210\uFF0C\u6240\u6709\u58F0\u660E\u7684\u5F15\u811A\u8FDE\u63A5\u90FD\u8FD8\u5728\u3002')
						: '**\u6CA1\u4F20 nets\uFF0C\u6CA1\u505A\u8FDE\u63A5\u6821\u9A8C** \u2014\u2014 \u5E03\u7EBF\u7B97\u6CD5\u53EF\u80FD\u5DF2\u7ECF\u626F\u65AD\u5F15\u811A\u8FDE\u63A5\uFF0CDRC \u67E5\u4E0D\u51FA\u6765\u3002\u5EFA\u8BAE\u4F20 nets \u91CD\u8DD1\u3002',
				};
			`,
          18e4
        )
      );
    }
  },
  {
    name: "eda_auto_layout",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u8BA9 EDA \u81EA\u52A8\u5E03\u5C40\u5F53\u524D\u539F\u7406\u56FE\u9875\u7684\u5668\u4EF6\u4F4D\u7F6E\u3002\n\n\u9002\u7528\u4E8E\u4ECE\u96F6\u753B\u56FE\u3001\u8FD8\u6CA1\u60F3\u597D\u5668\u4EF6\u600E\u4E48\u6446\u7684\u65F6\u5019\uFF1A\u5148\u968F\u4FBF\u653E\u4E0B\u53BB\uFF0C\u518D\u8BA9\u7B97\u6CD5\u6392\u3002\u5982\u679C\u5668\u4EF6\u4F4D\u7F6E\u662F\u7167\u7740\u53C2\u8003\u56FE\u6446\u7684\uFF08\u6BD4\u5982\u590D\u523B\uFF09\uFF0C**\u4E0D\u8981\u7528**\uFF0C\u4F1A\u6253\u4E71\u539F\u6709\u5E03\u5C40\u3002\n\ndevice_types \u628A\u4F4D\u53F7\u6620\u5C04\u5230\u5668\u4EF6\u7C7B\u522B\uFF08resistor / capacitor / inductive / diode / triode / oscillator / chip / otherDevice\uFF09\uFF0C\u7B97\u6CD5\u4F1A\u636E\u6B64\u4F18\u5316\u6446\u653E \u2014\u2014 \u7ED9\u4E86\u4F1A\u660E\u663E\u66F4\u6574\u9F50\u3002\n\n\u5E03\u5C40\u6539\u53D8\u540E\u5E94\u91CD\u65B0\u8DD1 eda_auto_route\u3002",
    inputSchema: {
      type: "object",
      properties: {
        component_uuids: { type: "array", items: { type: "string" }, description: "\u53EF\u9009\uFF0C\u53EA\u5E03\u5C40\u8FD9\u4E9B\u5668\u4EF6" },
        device_types: {
          type: "object",
          description: '\u53EF\u9009\uFF0C\u4F4D\u53F7 \u2192 \u7C7B\u522B\uFF0C\u5982 {"R1":"resistor","C1":"capacitor","U1":"chip"}',
          additionalProperties: { type: "string" }
        }
      }
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const uuids = Array.isArray(args.component_uuids) ? args.component_uuids : null;
      const types = args.device_types && typeof args.device_types === "object" ? args.device_types : null;
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const props = {};
				${uuids ? `props.uuids = ${JSON.stringify(uuids)};` : ""}
				${types ? `props.designatorDeviceTypeMap = ${JSON.stringify(types)};` : ""}
				const t0 = Date.now();
				await eda.sch_Document.autoLayout(Object.keys(props).length ? props : undefined);
				const comps = await eda.sch_PrimitiveComponent.getAll();
				return {
					ok: true, page: _page.name, elapsed_ms: Date.now() - t0,
					component_count: comps.length,
					note: '\u5E03\u5C40\u5DF2\u91CD\u6392\u3002\u4F4D\u7F6E\u53D8\u4E86\uFF0C\u63A5\u7740\u8DD1 eda_auto_route \u91CD\u65B0\u6574\u7406\u8FDE\u7EBF\u3002',
				};
			`,
          18e4
        )
      );
    }
  },
  {
    name: "eda_place_component",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u5728\u5F53\u524D\u539F\u7406\u56FE\u9875\u653E\u7F6E\u4E00\u4E2A\u5143\u5668\u4EF6\u3002\n\n\u7528\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF08lcsc_id\uFF09\u6700\u65B9\u4FBF\uFF0C\u4E5F\u53EF\u4EE5\u76F4\u63A5\u7ED9 device_uuid + library_uuid\uFF08\u4ECE eda_library_search \u62FF\uFF09\u3002\n\n**\u653E\u5668\u4EF6\u524D\u5148\u89C4\u5212\u529F\u80FD\u5206\u533A** \u2014\u2014 \u89C1 eda-schematic-layout skill\u3002\u6309\u6E05\u5355\u987A\u5E8F\u968F\u624B\u6446\u4F1A\u8BA9\u8FDE\u7EBF\u6A2A\u7A7F\u6574\u5F20\u56FE\u3001\u65E0\u6CD5\u9605\u8BFB\uFF1B\u5206\u533A\u662F\u8BBE\u8BA1\u5224\u65AD\uFF0C\u5DE5\u5177\u53EA\u8D1F\u8D23\u6267\u884C\u3002\n\n**\u5750\u6807\u5355\u4F4D\u662F 0.01 inch**\uFF08A4 \u56FE\u7EB8\u7EA6 1170 \xD7 830\uFF09\uFF0Crotation \u9006\u65F6\u9488\u4E3A\u6B63\u3002\n\n**\u4F4D\u53F7\u4F1A\u81EA\u52A8\u5206\u914D**\uFF08U1\u3001U2\u3001R1\u2026\uFF09\uFF1AEDA \u7684 create \u63A5\u53E3\u653E\u51FA\u6765\u7684\u5668\u4EF6\u4F4D\u53F7\u662F\u5E93\u91CC\u7684\u5360\u4F4D\u7B26\uFF08\u5982 `U?`\uFF09\uFF0C\u591A\u4E2A\u5668\u4EF6\u4F1A\u91CD\u540D\u3001\u6CA1\u6CD5\u5F15\u7528\uFF0C\u6240\u4EE5\u672C\u5DE5\u5177\u653E\u7F6E\u540E\u4F1A\u626B\u63CF\u5168\u56FE\u5DF2\u7528\u4F4D\u53F7\u5E76\u8865\u4E0A\u4E0B\u4E00\u4E2A\u53EF\u7528\u7F16\u53F7\u3002\u4E5F\u53EF\u4EE5\u7528 designator \u53C2\u6570\u6307\u5B9A\uFF0C\u91CD\u590D\u65F6\u4F1A\u62A5\u9519\u3002\n\n**\u8FD4\u56DE\u503C\u91CC `placed.actual` \u662F\u56DE\u8BFB\u51FA\u6765\u7684\u5B9E\u9645\u72B6\u6001\uFF0C`placed.requested` \u624D\u662F\u4F60\u8981\u6C42\u7684**\u3002\u4E24\u8005\u4E0D\u7B26\u65F6 `position_verified` \u4E3A false \u5E76\u7ED9\u51FA warnings \u2014\u2014 \u8BF7\u4EE5 actual \u4E3A\u51C6\uFF0C\u4E0D\u8981\u5047\u5B9A\u8BF7\u6C42\u7684\u5750\u6807\u5C31\u662F\u7ED3\u679C\u3002\u82E5 `stacked_with` \u975E\u7A7A\uFF0C\u8BF4\u660E\u5668\u4EF6\u53E0\u5728\u4E86\u522B\u7684\u5668\u4EF6\u4E0A\uFF08\u6570\u91CF\u3001DRC \u90FD\u67E5\u4E0D\u51FA\u8FD9\u79CD\u9519\uFF09\u3002\n\n\u653E\u5B8C\u53EF\u4EE5\u518D\u8DD1 eda_schematic_drc \u770B\u6709\u6CA1\u6709\u65B0\u589E error\u3002",
    inputSchema: {
      type: "object",
      properties: {
        lcsc_id: { type: "string", description: "\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\uFF0C\u5982 C347222" },
        device_uuid: { type: "string", description: "\u5668\u4EF6 uuid\uFF08\u4E0E library_uuid \u914D\u5408\uFF09" },
        library_uuid: { type: "string", description: "\u5E93 uuid" },
        x: { type: "number", description: "X \u5750\u6807\uFF0C\u5355\u4F4D 0.01 inch" },
        y: { type: "number", description: "Y \u5750\u6807\uFF0C\u5355\u4F4D 0.01 inch" },
        rotation: { type: "number", description: "\u65CB\u8F6C\u89D2\u5EA6\uFF08\u9006\u65F6\u9488\u4E3A\u6B63\uFF09\uFF0C\u9ED8\u8BA4 0" },
        mirror: { type: "boolean", description: "\u662F\u5426\u955C\u50CF\uFF0C\u9ED8\u8BA4 false" },
        designator: { type: "string", description: "\u53EF\u9009\uFF0C\u6307\u5B9A\u4F4D\u53F7\u5982 U5\uFF1B\u4E0D\u7ED9\u5219\u81EA\u52A8\u5206\u914D\u4E0B\u4E00\u4E2A\u53EF\u7528\u7F16\u53F7" }
      },
      required: ["x", "y"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const lcsc = optionalString(args, "lcsc_id");
      const du = optionalString(args, "device_uuid");
      const lu = optionalString(args, "library_uuid");
      if (!lcsc && !(du && lu)) throw new Error("\u8BF7\u7ED9\u51FA lcsc_id\uFF0C\u6216 device_uuid + library_uuid");
      const x = num(args, "x");
      const y = num(args, "y");
      const rotation = typeof args.rotation === "number" ? args.rotation : 0;
      const mirror = args.mirror === true;
      const wantDes = optionalString(args, "designator");
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				let uuid = ${JSON.stringify(du ?? null)}, libUuid = ${JSON.stringify(lu ?? null)};
				const lcsc = ${JSON.stringify(lcsc ?? null)};
				if (!uuid && lcsc) {
					const hit = await eda.lib_Device.getByLcscIds([lcsc]);
					if (!hit || !hit.length) return { ok: false, error: '\u5E93\u91CC\u627E\u4E0D\u5230\u7ACB\u521B\u7F16\u53F7 ' + lcsc };
					uuid = hit[0].uuid; libUuid = hit[0].libraryUuid;
				}
				// \u4F4D\u53F7\u552F\u4E00\u6027\u53EA\u770B**\u5F53\u524D\u9875**\u3002
				// getAll(undefined, true) \u5B9E\u6D4B\u8DE8\u8D8A\u6574\u4E2A\u5DE5\u7A0B\u7684\u6240\u6709\u539F\u7406\u56FE \u2014\u2014 \u8FDE\u522B\u7684 Board \u90FD\u7B97\u8FDB\u6765\uFF0C
				// \u4E8E\u662F\u65B0\u5EFA\u4E00\u5757\u677F\u653E C1 \u4F1A\u88AB\u53E6\u4E00\u5757\u677F\u4E0A\u7684 C1 \u6321\u4F4F\u3001\u987A\u5EF6\u6210 C2\uFF0C\u4F4D\u53F7\u8DDF\u8BBE\u8BA1\u5BF9\u4E0D\u4E0A\u3002
				// \u4E0D\u540C Board \u662F\u5404\u81EA\u72EC\u7ACB\u7684\u8BBE\u8BA1\uFF0C\u7F51\u8868\u4E5F\u6309 Board \u751F\u6210\uFF0C\u672C\u5C31\u4E0D\u8BE5\u4E92\u76F8\u5360\u7528\u4F4D\u53F7\u3002
				// \u4EE3\u4EF7\uFF1A\u540C\u4E00\u539F\u7406\u56FE\u5206\u591A\u9875\u65F6\u8DE8\u9875\u53EF\u80FD\u649E\u53F7\uFF0C\u9700\u8981\u8C03\u7528\u65B9\u81EA\u5DF1\u907F\u8BA9\u3002
				const usedAll = await eda.sch_PrimitiveComponent.getAll();
				const used = new Set(usedAll.map(x => String(x.designator || '').toUpperCase()));
				const before = (await eda.sch_PrimitiveComponent.getAll()).length;

				const c = await eda.sch_PrimitiveComponent.create(
					{ libraryUuid: libUuid, uuid }, ${x}, ${y}, undefined, ${rotation}, ${mirror}
				);
				const after = await eda.sch_PrimitiveComponent.getAll();
				if (!c && after.length === before) return { ok: false, error: '\u653E\u7F6E\u5931\u8D25\uFF0CEDA \u672A\u8FD4\u56DE\u56FE\u5143\u4E14\u5668\u4EF6\u6570\u6CA1\u6709\u589E\u52A0' };

				// EDA \u653E\u51FA\u6765\u7684\u4F4D\u53F7\u662F\u5E93\u91CC\u7684\u5360\u4F4D\u7B26\uFF08U?\uFF09\uFF0C\u4E0D\u7F16\u53F7\u7684\u8BDD\u591A\u4E2A\u5668\u4EF6\u4F1A\u91CD\u540D\u3001\u65E0\u6CD5\u5F15\u7528
				const raw = String(c.designator || '');
				const want = ${JSON.stringify(wantDes ?? null)};
				let finalDes = raw;
				let assigned = false;
				let assignError;

				if (want) {
					if (used.has(want.toUpperCase())) {
						assignError = '\u4F4D\u53F7 ' + want + ' \u5DF2\u88AB\u5360\u7528\uFF0C\u5DF2\u4FDD\u7559\u81EA\u52A8\u5206\u914D\u7684\u7F16\u53F7';
					} else {
						const m = await eda.sch_PrimitiveComponent.modify(c.primitiveId, { designator: want });
						const fresh = await eda.sch_PrimitiveComponent.getAll();
						const dup = fresh.filter(x => String(x.designator || '').toUpperCase() === want.toUpperCase()).length;
						if (m && dup === 1) { finalDes = want; assigned = true; }
						else assignError = dup > 1 ? '\u4F4D\u53F7 ' + want + ' \u51FA\u73B0\u91CD\u590D\uFF0C\u5DF2\u653E\u5F03\u6307\u5B9A' : '\u8BBE\u7F6E\u6307\u5B9A\u4F4D\u53F7\u5931\u8D25';
					}
				}
				if (!assigned && (raw === '' || raw.indexOf('?') >= 0)) {
					// \u524D\u7F00\u53D6\u81EA\u5E93\u91CC\u7684\u5360\u4F4D\u7B26\uFF1AU? \u2192 U\uFF1B\u6CA1\u6709\u5C31\u9000\u56DE U
					// \u6CE8\u610F\u8FD9\u91CC\u523B\u610F\u4E0D\u5199\u542B\u53CD\u659C\u6760\u7684\u6B63\u5219 \u2014\u2014 \u8FD9\u6BB5\u4EE3\u7801\u662F\u653E\u5728 TS \u6A21\u677F\u5B57\u7B26\u4E32\u91CC\u4F20\u7ED9 EDA \u6267\u884C\u7684\uFF0C
					// \u6A21\u677F\u5B57\u7B26\u4E32\u4F1A\u628A ? d \u8FD9\u7C7B\u65E0\u6548\u8F6C\u4E49\u7684\u53CD\u659C\u6760\u5403\u6389\uFF0C\u5230\u4E86 EDA \u90A3\u8FB9\u5C31\u6210\u4E86\u975E\u6CD5\u6B63\u5219\u3002
					const prefix = (raw.replace(/[?0-9]+$/, '') || 'U').toUpperCase();
					// \u6539\u5B8C\u5FC5\u987B\u91CD\u65B0\u67E5\u5168\u56FE\u786E\u8BA4\u552F\u4E00 \u2014\u2014 getAll \u76F8\u5BF9\u5199\u5165\u6709\u5EF6\u8FDF\uFF0C\u53EA\u51ED\u653E\u7F6E\u524D\u90A3\u4E00\u6B21\u5FEB\u7167\u7B97\u7F16\u53F7\uFF0C
					// \u8FDE\u7EED\u653E\u7F6E\u65F6\u4F1A\u7B97\u51FA\u540C\u4E00\u4E2A\u53F7\uFF0C\u4E24\u4E2A\u5668\u4EF6\u540C\u4F4D\u53F7\u3002\u4F4D\u53F7\u91CD\u590D\u4F1A\u8BA9\u6574\u5F20\u56FE**\u5BFC\u4E0D\u51FA\u7F51\u8868**
					// \uFF08DRC \u62A5\u81F4\u547D\u9519\u8BEF\uFF09\uFF0C\u4EE3\u4EF7\u8FDC\u5927\u4E8E\u591A\u67E5\u51E0\u6B21\u3002
					let n = 1;
					for (let attempt = 0; attempt < 40 && !assigned; attempt++) {
						while (used.has(prefix + n)) n++;
						const auto = prefix + n;
						const m = await eda.sch_PrimitiveComponent.modify(c.primitiveId, { designator: auto });
						if (!m) { assignError = '\u81EA\u52A8\u7F16\u53F7\u5931\u8D25\uFF0C\u4F4D\u53F7\u4ECD\u662F\u5360\u4F4D\u7B26 ' + raw; break; }
						const fresh = await eda.sch_PrimitiveComponent.getAll();
						const dup = fresh.filter(x => String(x.designator || '').toUpperCase() === auto).length;
						if (dup === 1) { finalDes = auto; assigned = true; }
						else { fresh.forEach(x => used.add(String(x.designator || '').toUpperCase())); n++; }
					}
					if (!assigned && !assignError) assignError = '\u8FDE\u7EED 40 \u6B21\u90FD\u649E\u4E0A\u91CD\u540D\uFF0C\u672A\u80FD\u5206\u914D\u552F\u4E00\u4F4D\u53F7';
				}

				// \u2500\u2500 \u56DE\u8BFB\u786E\u8BA4 \u2500\u2500
				// c.x / c.y \u662F create \u90A3\u4E00\u523B\u7684\u5BF9\u8C61\u5FEB\u7167\uFF0C\u4E0D\u662F EDA \u91CC\u7684\u5B9E\u9645\u72B6\u6001\uFF1A
				// \u4E2D\u95F4\u7ECF\u8FC7\u4E86\u82E5\u5E72\u6B21 modify\uFF08\u6539\u4F4D\u53F7\uFF09\uFF0C\u8FD9\u4E2A JS \u5BF9\u8C61\u4E0D\u4F1A\u8DDF\u7740\u66F4\u65B0\u3002
				// \u4EE5\u524D\u8FD9\u91CC\u76F4\u63A5\u8FD4\u56DE c.x/c.y\uFF0C\u7B49\u4E8E\u628A\u8BF7\u6C42\u503C\u56DE\u663E\u6210\u7ED3\u679C \u2014\u2014 \u5668\u4EF6\u660E\u660E
				// \u53E0\u5728\u4E0A\u4E00\u4E2A\u8EAB\u4E0A\uFF0C\u5DE5\u5177\u5374\u62A5\u544A\u5750\u6807\u6B63\u786E\u3002\u4E00\u5F8B\u6309 primitiveId \u91CD\u65B0\u67E5\u3002
				await new Promise(function (r) { setTimeout(r, 600); });
				const REQ = { x: ${x}, y: ${y}, rotation: ${rotation} };
				const TOL = 10; // \u534A\u4E2A\u7F51\u683C\uFF1AEDA \u4F1A\u628A\u5750\u6807\u5438\u9644\u5230\u7F51\u683C\uFF0C\u5DEE\u8FD9\u70B9\u4E0D\u7B97\u5931\u8D25
				const fresh2 = await eda.sch_PrimitiveComponent.getAll();
				const back = fresh2.filter(function (p) { return p.primitiveId === c.primitiveId; })[0];
				const actual = back
					? { x: back.x, y: back.y, rotation: back.rotation || 0, designator: String(back.designator || '') }
					: null;
				const posOk = !!actual && Math.abs(actual.x - REQ.x) <= TOL && Math.abs(actual.y - REQ.y) <= TOL;

				// \u53E0\u5728\u522B\u4EBA\u8EAB\u4E0A\u662F\u6700\u5BB9\u6613\u88AB\u6F0F\u6389\u7684\u5931\u8D25\uFF1A\u6570\u91CF\u5BF9\u3001\u8FD4\u56DE\u503C\u5BF9\u3001DRC \u4E5F\u4E0D\u62A5
				const stacked = !actual ? [] : fresh2
					.filter(function (p) {
						return p.componentType === 'part' && p.primitiveId !== c.primitiveId &&
							Math.abs(p.x - actual.x) <= TOL && Math.abs(p.y - actual.y) <= TOL;
					})
					.map(function (p) { return String(p.designator || '?'); });

				const warns = [];
				if (!back) warns.push('\u56DE\u8BFB\u65F6\u6309 primitiveId \u627E\u4E0D\u5230\u521A\u653E\u7684\u5668\u4EF6 \u2014\u2014 \u653E\u7F6E\u53EF\u80FD\u6CA1\u771F\u6B63\u751F\u6548');
				if (actual && !posOk) {
					warns.push('\u5B9E\u9645\u843D\u70B9 (' + actual.x + ', ' + actual.y + ') \u4E0E\u8BF7\u6C42 (' +
						REQ.x + ', ' + REQ.y + ') \u4E0D\u7B26');
				}
				if (stacked.length) warns.push('\u548C\u5DF2\u6709\u5668\u4EF6\u91CD\u53E0\uFF1A' + stacked.join('\u3001'));

				return {
					ok: true,
					placed: {
						primitive_id: c.primitiveId,
						designator: actual ? actual.designator : finalDes,
						requested: REQ,
						actual: actual,
						position_verified: posOk,
						stacked_with: stacked.length ? stacked : undefined,
					},
					designator_assigned: assigned,
					designator_note: assignError,
					component_count: { before, after: after.length },
					page: _page.name,
					warnings: warns.length ? warns : undefined,
				};
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_draw_wire",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u5728\u5F53\u524D\u539F\u7406\u56FE\u9875\u753B\u5BFC\u7EBF\u3002points \u662F\u5750\u6807\u6570\u7EC4 [x1,y1,x2,y2,\u2026]\uFF0C\u5355\u4F4D 0.01 inch\u3002\n\n\u7F51\u7EDC\u5F52\u5C5E\u89C4\u5219\uFF08\u5B98\u65B9\uFF09\uFF1A\u4E0D\u6307\u5B9A net \u65F6\u2014\u2014\u6CA1\u6709\u7AEF\u70B9\u843D\u5728\u56FE\u5143\u4E0A\u5219\u4E3A\u7A7A\u7F51\u7EDC\uFF1B\u6709\u4E00\u4E2A\u7AEF\u70B9\u843D\u5728\u67D0\u7F51\u7EDC\u7684\u56FE\u5143\u4E0A\u5219\u8DDF\u968F\u8BE5\u7F51\u7EDC\uFF1B\u7AEF\u70B9\u843D\u5728\u591A\u4E2A\u4E0D\u540C\u7F51\u7EDC\u4E0A\u5219**\u521B\u5EFA\u5931\u8D25**\u3002\u6307\u5B9A net \u65F6\u2014\u2014\u672A\u663E\u5F0F\u547D\u540D\u7F51\u7EDC\u7684\u76F8\u63A5\u56FE\u5143\u4F1A\u8DDF\u968F\u672C\u7F51\u7EDC\uFF1B\u5DF2\u663E\u5F0F\u547D\u540D\u7684\u5219\u521B\u5EFA\u5931\u8D25\u3002\n\n\u6240\u4EE5\u7ED9\u591A\u70B9\u8FDE\u7EBF\u65F6\uFF0C\u5148\u786E\u8BA4\u4E24\u7AEF\u5F15\u811A\u7684\u7F51\u7EDC\u72B6\u6001\uFF0C\u907F\u514D\u649E\u7F51\u7EDC\u3002",
    inputSchema: {
      type: "object",
      properties: {
        points: {
          type: "array",
          items: { type: "number" },
          description: "\u6298\u7EBF\u5750\u6807 [x1,y1,x2,y2,...]\uFF0C\u81F3\u5C11\u4E24\u4E2A\u70B9\uFF084 \u4E2A\u6570\uFF09\uFF0C\u5355\u4F4D 0.01 inch"
        },
        net: { type: "string", description: "\u7F51\u7EDC\u540D\uFF0C\u53EF\u9009\uFF1B\u4E0D\u7ED9\u5219\u6309\u7AEF\u70B9\u6240\u89E6\u56FE\u5143\u63A8\u65AD" }
      },
      required: ["points"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const pts = args.points;
      if (!Array.isArray(pts) || pts.length < 4 || pts.length % 2 !== 0 || pts.some((n) => typeof n !== "number")) {
        throw new Error("points \u5FC5\u987B\u662F\u5076\u6570\u4E2A\u6570\u5B57\u4E14\u81F3\u5C11 4 \u4E2A\uFF08\u4E24\u4E2A\u70B9\uFF09\uFF0C\u5355\u4F4D 0.01 inch");
      }
      const net = optionalString(args, "net");
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const w = await eda.sch_PrimitiveWire.create(${JSON.stringify(pts)}, ${JSON.stringify(net ?? void 0)});
				if (!w) return { ok: false, error: '\u5BFC\u7EBF\u521B\u5EFA\u5931\u8D25\u3002\u5E38\u89C1\u539F\u56E0\uFF1A\u7AEF\u70B9\u843D\u5728\u591A\u4E2A\u4E0D\u540C\u7F51\u7EDC\u7684\u56FE\u5143\u4E0A\uFF0C\u6216\u4E0E\u5DF2\u663E\u5F0F\u547D\u540D\u7F51\u7EDC\u7684\u56FE\u5143\u51B2\u7A81\u3002' };
				return { ok: true, wire: { primitive_id: w.primitiveId, net: w.net ?? ${JSON.stringify(net ?? null)} }, page: _page.name };
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_component_pins",
    description: "\u5217\u51FA\u67D0\u4E2A\u5668\u4EF6\u5728\u753B\u5E03\u4E0A\u7684\u6240\u6709\u5F15\u811A\uFF1A\u5F15\u811A\u53F7\u3001\u5F15\u811A\u540D\u3001**\u7EDD\u5BF9\u5750\u6807**\u3001\u671D\u5411\u3001\u7535\u6C14\u7C7B\u578B\u3002\n\n\u8FD9\u662F\u81EA\u52A8\u8FDE\u7EBF\u7684\u524D\u63D0 \u2014\u2014 \u5750\u6807\u5DF2\u7ECF\u7B97\u597D\u4E86\u5668\u4EF6\u7684\u4F4D\u7F6E\u4E0E\u65CB\u8F6C\uFF0C\u76F4\u63A5\u5C31\u662F\u53EF\u4EE5\u843D\u7EBF\u7684\u70B9\u3002\n\nrotation \u8868\u793A\u5F15\u811A\u671D\u5916\u7684\u65B9\u5411\uFF1A0 \u671D\u53F3\u300190 \u671D\u4E0A\u3001180 \u671D\u5DE6\u3001270 \u671D\u4E0B\u3002\u8FDE\u7EBF\u65F6\u7B2C\u4E00\u6BB5\u5E94\u987A\u7740\u8FD9\u4E2A\u65B9\u5411\u5F15\u51FA\uFF0C\u5426\u5219\u7EBF\u4F1A\u538B\u5728\u5668\u4EF6\u7B26\u53F7\u4E0A\u3002",
    inputSchema: {
      type: "object",
      properties: { designator: { type: "string", description: "\u5668\u4EF6\u4F4D\u53F7\uFF0C\u5982 U1" } },
      required: ["designator"]
    },
    handler: async (args, ctx2) => {
      const des = requireString(args, "designator");
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const want = ${JSON.stringify(des)}.toUpperCase();
				const all = await eda.sch_PrimitiveComponent.getAll();
				const c = all.find(x => String(x.designator || '').toUpperCase() === want);
				if (!c) return { error: '\u5F53\u524D\u539F\u7406\u56FE\u9875\u91CC\u6CA1\u6709\u4F4D\u53F7 ' + want, available: all.map(x => x.designator).filter(Boolean).slice(0, 40) };
				const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId);
				// \u7B26\u53F7\u5B9E\u9645\u5360\u591A\u5927\u662F\u5E03\u5C40\u7684\u5FC5\u8981\u8F93\u5165 \u2014\u2014 \u4E0D\u77E5\u9053\u5C3A\u5BF8\u5C31\u53EA\u80FD\u731C\u95F4\u8DDD\uFF0C\u5668\u4EF6\u4F1A\u4E92\u76F8\u538B\u4F4F
				const bbox = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => undefined);
				return {
					designator: c.designator,
					component: { primitive_id: c.primitiveId, x: c.x, y: c.y, rotation: c.rotation },
					bbox: bbox ? { ...bbox, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY } : undefined,
					pin_count: (pins || []).length,
					pins: (pins || []).map(p => ({
						number: p.pinNumber, name: p.pinName,
						x: p.x, y: p.y, rotation: p.rotation,
						type: p.pinType, no_connect: p.noConnected,
					})),
				};
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_connect_pins",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u628A\u4E24\u4E2A\u5668\u4EF6\u5F15\u811A\u7528\u5BFC\u7EBF\u8FDE\u8D77\u6765 \u2014\u2014 \u81EA\u52A8\u67E5\u5F15\u811A\u5750\u6807\u5E76\u751F\u6210\u6298\u7EBF\u8DEF\u5F84\u3002\n\n\u5F15\u811A\u7528\u300C\u4F4D\u53F7.\u5F15\u811A\u53F7\u300D\u6216\u300C\u4F4D\u53F7.\u5F15\u811A\u540D\u300D\u6307\u5B9A\uFF0C\u5982 `U1.3`\u3001`U1.VIN`\u3001`R1.2`\u3002\n\n\u8FD9\u662F\u81EA\u52A8\u753B\u539F\u7406\u56FE\u7684\u4E3B\u529B\u5DE5\u5177\uFF0C\u6BD4\u624B\u5DE5\u7B97\u5750\u6807\u8C03 eda_draw_wire \u53EF\u9760\u5F97\u591A\u3002\n\n\u8DEF\u5F84\u9ED8\u8BA4\u6309\u8D77\u70B9\u5F15\u811A\u7684\u671D\u5411\u9009\u62E9\u5148\u6A2A\u540E\u7AD6\u8FD8\u662F\u5148\u7AD6\u540E\u6A2A\uFF08\u987A\u7740\u5F15\u811A\u5F15\u51FA\uFF0C\u907F\u514D\u538B\u5728\u7B26\u53F7\u4E0A\uFF09\uFF1B\u4E24\u811A\u540C\u4E00\u6C34\u5E73\u7EBF\u6216\u5782\u76F4\u7EBF\u4E0A\u5219\u76F4\u8FDE\u3002\n\n**\u7F51\u7EDC\u51B2\u7A81\u4F1A\u5931\u8D25**\uFF1A\u5982\u679C\u4E24\u7AEF\u5F15\u811A\u5DF2\u5206\u522B\u5C5E\u4E8E\u4E0D\u540C\u7684\u5DF2\u547D\u540D\u7F51\u7EDC\uFF0CEDA \u4F1A\u62D2\u7EDD\u521B\u5EFA\uFF0C\u8FD9\u65F6\u8981\u5148\u7528\u7F51\u7EDC\u6807\u7B7E\u7EDF\u4E00\u547D\u540D\uFF0C\u800C\u4E0D\u662F\u53CD\u590D\u91CD\u8BD5\u3002",
    inputSchema: {
      type: "object",
      properties: {
        from: { type: "string", description: "\u8D77\u70B9\u5F15\u811A\uFF0C\u5982 U1.3 \u6216 U1.VIN" },
        to: { type: "string", description: "\u7EC8\u70B9\u5F15\u811A\uFF0C\u5982 C1.1" },
        net: { type: "string", description: "\u53EF\u9009\uFF0C\u6307\u5B9A\u7F51\u7EDC\u540D" },
        route: {
          type: "string",
          enum: ["auto", "hv", "vh", "direct"],
          description: "auto=\u6309\u8D77\u70B9\u5F15\u811A\u671D\u5411\u51B3\u5B9A\uFF08\u9ED8\u8BA4\uFF09\uFF1Bhv=\u5148\u6C34\u5E73\u540E\u5782\u76F4\uFF1Bvh=\u5148\u5782\u76F4\u540E\u6C34\u5E73\uFF1Bdirect=\u4E24\u70B9\u76F4\u8FDE"
        }
      },
      required: ["from", "to"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const from = requireString(args, "from");
      const to = requireString(args, "to");
      const net = optionalString(args, "net");
      const route2 = optionalString(args, "route") ?? "auto";
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const all = await eda.sch_PrimitiveComponent.getAll();

				// "U1.3" / "U1.VIN" \u2192 \u627E\u5230\u90A3\u6839\u5F15\u811A
				const locate = async (spec) => {
					const dot = spec.lastIndexOf('.');
					if (dot <= 0) return { err: spec + ' \u683C\u5F0F\u5E94\u4E3A\u300C\u4F4D\u53F7.\u5F15\u811A\u53F7\u300D\uFF0C\u5982 U1.3' };
					const des = spec.slice(0, dot).toUpperCase();
					const key = spec.slice(dot + 1).toUpperCase();
					const c = all.find(x => String(x.designator || '').toUpperCase() === des);
					if (!c) return { err: '\u627E\u4E0D\u5230\u4F4D\u53F7 ' + des };
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId);
					const p = (pins || []).find(x => String(x.pinNumber || '').toUpperCase() === key)
						|| (pins || []).find(x => String(x.pinName || '').toUpperCase() === key);
					if (!p) return { err: des + ' \u4E0A\u627E\u4E0D\u5230\u5F15\u811A ' + key, pins: (pins||[]).map(x => x.pinNumber + ':' + x.pinName) };
					return { pin: p, designator: c.designator };
				};

				const a = await locate(${JSON.stringify(from)});
				if (a.err) return { ok: false, error: a.err, pins: a.pins };
				const b = await locate(${JSON.stringify(to)});
				if (b.err) return { ok: false, error: b.err, pins: b.pins };

				const p1 = a.pin, p2 = b.pin;

				// \u5173\u952E\uFF1A\u5BFC\u7EBF\u5FC5\u987B\u4ECE\u5F15\u811A\u7AEF\u70B9**\u671D\u5916**\u63A5\u5165\u3002\u5B9E\u6D4B\u82E5\u4ECE\u7AEF\u70B9\u5F80\u7B26\u53F7\u672C\u4F53\u65B9\u5411\u753B\uFF0C
				// \u7EBF\u4F1A\u538B\u5728\u5F15\u811A\u4E0A\uFF0CEDA \u4E0D\u8BA4\u8FD9\u4E2A\u8FDE\u63A5 \u2014\u2014 \u8868\u73B0\u4E3A\u7F51\u7EDC\u53EA\u6302\u4E0A\u4E86\u53E6\u4E00\u7AEF\u90A3\u4E2A\u5F15\u811A\u3002
				// \u6240\u4EE5\u4E24\u7AEF\u5404\u5148\u6CBF\u81EA\u8EAB\u671D\u5411\u5F15\u51FA\u4E00\u5C0F\u6BB5\uFF08stub\uFF09\uFF0C\u518D\u5728\u4E24\u4E2A stub \u7AEF\u70B9\u4E4B\u95F4\u8D70\u6298\u7EBF\u3002
				// \u5750\u6807\u7CFB y \u5411\u4E0B\u4E3A\u6B63\uFF1Brotation \u9006\u65F6\u9488\u4E3A\u6B63\uFF0C0=\u671D\u53F3 90=\u671D\u4E0A 180=\u671D\u5DE6 270=\u671D\u4E0B\u3002
				const STUB = 10; // 0.1 inch\uFF0C\u4E00\u4E2A\u6805\u683C
				const outward = (rot) => {
					const r = ((Number(rot) % 360) + 360) % 360;
					if (r === 0) return [STUB, 0];
					if (r === 90) return [0, -STUB];
					if (r === 180) return [-STUB, 0];
					if (r === 270) return [0, STUB];
					return [0, 0]; // \u975E\u6B63\u4EA4\u671D\u5411\uFF1A\u4E0D\u52A0 stub\uFF0C\u76F4\u63A5\u8FDE
				};
				const [dx1, dy1] = outward(p1.rotation);
				const [dx2, dy2] = outward(p2.rotation);
				const a1 = [p1.x + dx1, p1.y + dy1];
				const b1 = [p2.x + dx2, p2.y + dy2];

				let mode = ${JSON.stringify(route2)};
				if (mode === 'auto') {
					if (a1[0] === b1[0] || a1[1] === b1[1]) mode = 'direct';
					// \u8D77\u70B9 stub \u662F\u6C34\u5E73\u5F15\u51FA\u7684\u8BDD\uFF0C\u63A5\u7740\u8D70\u6C34\u5E73\u6BB5\u66F4\u987A\uFF1B\u53CD\u4E4B\u5148\u8D70\u5782\u76F4
					else mode = dx1 !== 0 ? 'hv' : 'vh';
				}

				let mid;
				if (mode === 'direct' || a1[0] === b1[0] || a1[1] === b1[1]) mid = [];
				else if (mode === 'vh') mid = [a1[0], b1[1]];
				else mid = [b1[0], a1[1]];

				const line = [p1.x, p1.y, a1[0], a1[1], ...mid, b1[0], b1[1], p2.x, p2.y]
					// \u53BB\u6389\u8FDE\u7EED\u91CD\u590D\u70B9\uFF0C\u907F\u514D\u96F6\u957F\u5EA6\u7EBF\u6BB5
					.reduce((acc, v, i, arr) => {
						if (i % 2 === 1) {
							const px = arr[i - 1], py = v;
							const n = acc.length;
							if (n >= 2 && acc[n - 2] === px && acc[n - 1] === py) return acc;
							acc.push(px, py);
						}
						return acc;
					}, []);

				const w = await eda.sch_PrimitiveWire.create(line, ${JSON.stringify(net ?? void 0)});
				if (!w) {
					return { ok: false, error: '\u5BFC\u7EBF\u521B\u5EFA\u5931\u8D25\u3002\u6700\u5E38\u89C1\u539F\u56E0\u662F\u4E24\u7AEF\u5F15\u811A\u5DF2\u5206\u5C5E\u4E0D\u540C\u7684\u5DF2\u547D\u540D\u7F51\u7EDC \u2014\u2014 '
						+ 'EDA \u4E0D\u5141\u8BB8\u8FD9\u6837\u5408\u5E76\uFF0C\u8BF7\u5148\u7528\u7F51\u7EDC\u6807\u7B7E\u628A\u5B83\u4EEC\u7EDF\u4E00\u547D\u540D\u3002',
						attempted_path: line };
				}
				return {
					ok: true,
					from: a.designator + '.' + p1.pinNumber + '(' + p1.pinName + ')',
					to: b.designator + '.' + p2.pinNumber + '(' + p2.pinName + ')',
					route: mode,
					path: line,
					net: w.net ?? ${JSON.stringify(net ?? null)},
					wire_id: w.primitiveId,
				};
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_add_net_identifier",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u5728\u5F53\u524D\u539F\u7406\u56FE\u9875\u653E\u7F6E\u7F51\u7EDC\u6807\u8BC6\uFF1A\u7F51\u7EDC\u6807\u7B7E\uFF08NetLabel\uFF09\u3001\u7535\u6E90/\u5730\u7B26\u53F7\uFF08NetFlag\uFF09\u6216\u7F51\u7EDC\u7AEF\u53E3\uFF08NetPort\uFF09\u3002\n\n- kind=label\uFF1A\u666E\u901A\u7F51\u7EDC\u6807\u7B7E\uFF0C**\u5750\u6807\u5FC5\u987B\u843D\u5728\u4E00\u6761\u5DF2\u6709\u5BFC\u7EBF\u4E0A**\u3002\u653E\u5728\u7A7A\u767D\u5904\u65F6 EDA \u4F1A\u8FDB\u5165\u7B49\u5F85\u9F20\u6807\u70B9\u51FB\u7684\u4EA4\u4E92\u6A21\u5F0F\uFF0C\u63A5\u53E3\u4E00\u76F4\u4E0D\u8FD4\u56DE\uFF08\u8868\u73B0\u4E3A\u6267\u884C\u8D85\u65F6\uFF09\u2014\u2014\u6240\u4EE5\u8981\u5148\u753B\u7EBF\u518D\u8D34\u6807\u7B7E\uFF0C\u5750\u6807\u53D6\u7EBF\u4E0A\u7684\u70B9\u3002\n- kind=power / ground / analog_ground / protect_ground\uFF1A\u7535\u6E90\u4E0E\u5404\u7C7B\u5730\u7B26\u53F7\n- kind=port_in / port_out / port_bi\uFF1A\u5C42\u6B21\u56FE\u7F51\u7EDC\u7AEF\u53E3\n\n\u5750\u6807\u5355\u4F4D 0.01 inch\u3002",
    inputSchema: {
      type: "object",
      properties: {
        kind: {
          type: "string",
          enum: ["label", "power", "ground", "analog_ground", "protect_ground", "port_in", "port_out", "port_bi"],
          description: "\u6807\u8BC6\u7C7B\u578B"
        },
        net: { type: "string", description: "\u7F51\u7EDC\u540D\uFF0C\u5982 GND / VCC_3V3" },
        x: { type: "number", description: "X \u5750\u6807\uFF0C\u5355\u4F4D 0.01 inch" },
        y: { type: "number", description: "Y \u5750\u6807\uFF0C\u5355\u4F4D 0.01 inch" },
        rotation: { type: "number", description: "\u65CB\u8F6C\u89D2\u5EA6\uFF0C\u9ED8\u8BA4 0\uFF08label \u4E0D\u9002\u7528\uFF09" }
      },
      required: ["kind", "net", "x", "y"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const kind = requireString(args, "kind");
      const net = requireString(args, "net");
      const x = num(args, "x");
      const y = num(args, "y");
      const rotation = typeof args.rotation === "number" ? args.rotation : 0;
      const FLAG = {
        power: "Power",
        ground: "Ground",
        analog_ground: "AnalogGround",
        protect_ground: "ProtectGround"
      };
      const PORT = { port_in: "IN", port_out: "OUT", port_bi: "BI" };
      let call;
      if (kind === "label") {
        call = `await eda.sch_PrimitiveAttribute.createNetLabel(${x}, ${y}, ${JSON.stringify(net)})`;
      } else if (FLAG[kind]) {
        call = `await eda.sch_PrimitiveComponent.createNetFlag(${JSON.stringify(FLAG[kind])}, ${JSON.stringify(net)}, ${x}, ${y}, ${rotation})`;
      } else if (PORT[kind]) {
        call = `await eda.sch_PrimitiveComponent.createNetPort(${JSON.stringify(PORT[kind])}, ${JSON.stringify(net)}, ${x}, ${y}, ${rotation})`;
      } else {
        throw new Error(`\u672A\u77E5 kind: ${kind}`);
      }
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const p = ${call};
				if (!p) return { ok: false, error: '\u521B\u5EFA\u5931\u8D25\uFF0C\u8BF7\u786E\u8BA4\u5750\u6807\u5728\u56FE\u7EB8\u8303\u56F4\u5185\u3001\u7F51\u7EDC\u540D\u5408\u6CD5' };
				return { ok: true, kind: ${JSON.stringify(kind)}, net: ${JSON.stringify(net)}, primitive_id: p.primitiveId, page: _page.name };
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_add_schematic_text",
    description: "\u3010\u5199\u64CD\u4F5C\u3011\u5728\u5F53\u524D\u539F\u7406\u56FE\u9875\u653E\u7F6E\u4E00\u6BB5\u6587\u5B57\uFF08\u6CE8\u91CA\u3001\u6807\u9898\u7B49\uFF09\u3002\u5750\u6807\u5355\u4F4D 0.01 inch\u3002",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "\u6587\u5B57\u5185\u5BB9" },
        x: { type: "number", description: "X \u5750\u6807\uFF0C\u5355\u4F4D 0.01 inch" },
        y: { type: "number", description: "Y \u5750\u6807\uFF0C\u5355\u4F4D 0.01 inch" },
        rotation: { type: "number", description: "\u65CB\u8F6C\u89D2\u5EA6\uFF0C\u9ED8\u8BA4 0" },
        font_size: { type: "number", description: "\u5B57\u53F7\uFF0C\u53EF\u9009" }
      },
      required: ["content", "x", "y"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const content = requireString(args, "content");
      const x = num(args, "x");
      const y = num(args, "y");
      const rotation = typeof args.rotation === "number" ? args.rotation : 0;
      const size = typeof args.font_size === "number" ? args.font_size : null;
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const t = await eda.sch_PrimitiveText.create(${x}, ${y}, ${JSON.stringify(content)}, ${rotation}, null, null, ${size});
				if (!t) return { ok: false, error: '\u6587\u5B57\u521B\u5EFA\u5931\u8D25' };
				return { ok: true, primitive_id: t.primitiveId, page: _page.name };
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_delete_primitives",
    description: "\u3010\u5199\u64CD\u4F5C\xB7\u4E0D\u53EF\u64A4\u9500\u3011\u5220\u9664\u5F53\u524D\u539F\u7406\u56FE\u9875\u4E0A\u7684\u56FE\u5143\uFF0C\u6309\u56FE\u5143 id\u3002\n\nid \u4ECE eda_schematic_primitives \u6216\u5404\u521B\u5EFA\u5DE5\u5177\u7684\u8FD4\u56DE\u503C\u91CC\u62FF\u3002\n\n**\u52A8\u624B\u524D\u5FC5\u987B\u8DDF\u7528\u6237\u786E\u8BA4\u8981\u5220\u4EC0\u4E48**\u2014\u2014\u672C\u5DE5\u5177\u4E0D\u505A\u4E8C\u6B21\u786E\u8BA4\uFF0CEDA \u4FA7\u4E5F\u4E0D\u4E00\u5B9A\u80FD\u64A4\u9500\u3002\u4E0D\u8981\u51ED\u731C\u6D4B\u5220\u9664\uFF0C\u4E0D\u786E\u5B9A\u5C31\u5148\u5217\u51FA\u6765\u7ED9\u7528\u6237\u770B\u3002",
    inputSchema: {
      type: "object",
      properties: {
        primitive_ids: { type: "array", items: { type: "string" }, description: "\u8981\u5220\u9664\u7684\u56FE\u5143 id \u6570\u7EC4" },
        kind: {
          type: "string",
          enum: ["component", "wire", "text", "attribute"],
          description: "\u56FE\u5143\u7C7B\u578B\uFF0C\u51B3\u5B9A\u7528\u54EA\u4E2A\u63A5\u53E3\u5220\u9664"
        }
      },
      required: ["primitive_ids", "kind"]
    },
    mutating: true,
    handler: async (args, ctx2) => {
      const ids = args.primitive_ids;
      if (!Array.isArray(ids) || !ids.length || ids.some((i) => typeof i !== "string")) {
        throw new Error("primitive_ids \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\u6570\u7EC4");
      }
      const kind = requireString(args, "kind");
      const API = {
        component: "sch_PrimitiveComponent",
        wire: "sch_PrimitiveWire",
        text: "sch_PrimitiveText",
        attribute: "sch_PrimitiveAttribute"
      };
      const api = API[kind];
      if (!api) throw new Error(`\u672A\u77E5 kind: ${kind}`);
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const ok = await eda.${api}.delete(${JSON.stringify(ids)});
				return { ok: ok === true, deleted_count: ${ids.length}, kind: ${JSON.stringify(kind)}, page: _page.name,
					note: ok ? undefined : '\u63A5\u53E3\u8FD4\u56DE false\uFF0C\u53EF\u80FD id \u4E0D\u5B58\u5728\u6216\u7C7B\u578B\u4E0D\u5339\u914D' };
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  },
  {
    name: "eda_schematic_primitives",
    description: '\u5217\u51FA\u5F53\u524D\u539F\u7406\u56FE\u9875\u4E0A\u7684\u5668\u4EF6\u56FE\u5143\uFF08\u542B\u56FE\u5143 id\u3001\u4F4D\u53F7\u3001\u5750\u6807\uFF09\u3002\n\n\u4E0E eda_schematic_components \u7684\u533A\u522B\uFF1A\u90A3\u4E2A\u8BFB\u7F51\u8868\uFF08\u542B\u578B\u53F7/\u5C01\u88C5/\u53C2\u6570\uFF0C\u53E3\u5F84\u662F"\u4F1A\u4E0A PCB \u7684\u5668\u4EF6"\uFF09\uFF1B\u8FD9\u4E2A\u8BFB\u753B\u5E03\u56FE\u5143\uFF08\u542B primitive_id \u548C\u5750\u6807\uFF0C\u5305\u542B\u7F51\u7EDC\u6807\u5FD7\u7B49\u975E BOM \u56FE\u5143\uFF09\uFF0C\u7528\u4E8E**\u5B9A\u4F4D\u548C\u7F16\u8F91**\u3002\u8981\u6539\u52A8\u6216\u5220\u9664\u56FE\u5143\u65F6\u7528\u8FD9\u4E2A\u62FF id\u3002',
    inputSchema: {
      type: "object",
      properties: {
        all_pages: { type: "boolean", description: "\u662F\u5426\u8DE8\u6240\u6709\u539F\u7406\u56FE\u9875\uFF0C\u9ED8\u8BA4 false\uFF08\u53EA\u5F53\u524D\u9875\uFF09" }
      }
    },
    handler: async (args, ctx2) => {
      const allPages = args.all_pages === true;
      return schHint(
        await ctx2.exec(
          `
				${ENSURE_SCH5}
				const list = await eda.sch_PrimitiveComponent.getAll(undefined, ${allPages});
				return {
					page: _page.name,
					all_pages: ${allPages},
					count: list.length,
					primitives: list.map(c => ({
						primitive_id: c.primitiveId,
						designator: c.designator,
						x: c.x, y: c.y,
						rotation: c.rotation,
						locked: c.locked,
					})),
				};
			`,
          EDIT_TIMEOUT_MS
        )
      );
    }
  }
];

// src/tools/schematic.ts
var NETLIST_TIMEOUT_MS = 9e4;
async function fetchComponents(ctx2) {
  const text = await ctx2.exec(FETCH_NETLIST_CODE, NETLIST_TIMEOUT_MS);
  if (!text) throw new Error("EDA \u6CA1\u6709\u8FD4\u56DE\u7F51\u8868 \u2014\u2014 \u8BF7\u786E\u8BA4\u5F53\u524D\u6253\u5F00\u7684\u662F\u539F\u7406\u56FE\uFF08\u4E0D\u662F PCB \u6216\u5F00\u59CB\u9875\uFF09\uFF0C\u53EF\u7528 eda_current_context \u786E\u8BA4");
  return parseNetlist(text).components;
}
function matchDesignator(d, filter) {
  const f = filter.toUpperCase();
  const u = d.toUpperCase();
  if (u === f) return true;
  const m = /^([A-Z]+)(\d+)$/.exec(u);
  return m ? m[1] === f : u.startsWith(f);
}
var schematicTools = [
  {
    name: "eda_schematic_components",
    description: '\u5F53\u524D\u539F\u7406\u56FE\u7684\u5668\u4EF6\u6E05\u5355\uFF1A\u4F4D\u53F7\u3001\u578B\u53F7\u3001\u5C01\u88C5\u3001\u7ACB\u521B\u5546\u57CE\u7F16\u53F7\u3001\u5382\u5546\u3001\u5F15\u811A\u6570\u3002\n\n\u6570\u636E\u6765\u81EA EDA \u5BFC\u51FA\u7684\u7F51\u8868\uFF0C\u53EA\u542B\u771F\u5B9E\u5668\u4EF6\uFF08\u4F1A\u4E0A PCB \u7684\uFF09\uFF0C\u4E0D\u542B\u7535\u6E90\u7B26\u53F7 / \u7F51\u7EDC\u6807\u5FD7\u7B49\u56FE\u5143\u2014\u2014 \u6240\u4EE5\u6570\u91CF\u4F1A\u6BD4\u539F\u7406\u56FE\u4E0A\u770B\u5230\u7684\u56FE\u5143\u5C11\uFF0C\u8FD9\u662F\u5BF9\u7684\u3002\n\n\u7528 designator_filter \u6309\u4F4D\u53F7\u7B5B\u9009\uFF08\u7ED9 "R" \u5339\u914D\u6240\u6709\u7535\u963B R1/R2\u2026\uFF0C\u7ED9 "U1" \u7CBE\u786E\u5339\u914D\uFF09\uFF1B\u7528 keyword \u6309\u578B\u53F7/\u63CF\u8FF0\u641C\u7D22\u3002\u5668\u4EF6\u591A\u65F6\u5148\u7B5B\u518D\u770B\uFF0C\u4E0D\u8981\u4E00\u6B21\u6027\u62C9\u5168\u90E8\u3002',
    inputSchema: {
      type: "object",
      properties: {
        designator_filter: { type: "string", description: "\u4F4D\u53F7\u524D\u7F00\u6216\u5B8C\u6574\u4F4D\u53F7\uFF0C\u5982 R / C / U1" },
        keyword: { type: "string", description: "\u5728\u578B\u53F7\u3001\u5382\u5546\u3001\u63CF\u8FF0\u91CC\u641C\u7D22\u7684\u5173\u952E\u8BCD\uFF0C\u5982 AMS1117 / \u7535\u963B" },
        limit: { type: "integer", description: "\u6700\u591A\u8FD4\u56DE\u591A\u5C11\u4E2A\uFF0C\u9ED8\u8BA4 200" }
      }
    },
    handler: async (args, ctx2) => {
      const comps = await fetchComponents(ctx2);
      const df = optionalString(args, "designator_filter");
      const kw = optionalString(args, "keyword")?.toLowerCase();
      const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 200;
      let list = comps;
      if (df) list = list.filter((c) => matchDesignator(designatorOf(c), df));
      if (kw) {
        list = list.filter(
          (c) => Object.values(c.props).some((v) => typeof v === "string" && v.toLowerCase().includes(kw))
        );
      }
      const total = list.length;
      return {
        total_in_schematic: comps.length,
        matched: total,
        returned: Math.min(total, limit),
        components: list.slice(0, limit).map(briefComponent),
        hint: total > limit ? `\u8FD8\u6709 ${total - limit} \u4E2A\u672A\u8FD4\u56DE\uFF0C\u8BF7\u7F29\u5C0F\u7B5B\u9009\u6761\u4EF6` : void 0
      };
    }
  },
  {
    name: "eda_component_detail",
    description: "\u5355\u4E2A\u5668\u4EF6\u7684\u5B8C\u6574\u4FE1\u606F\uFF1A\u5168\u90E8\u5C5E\u6027\uFF08\u7535\u6C14\u53C2\u6570\u3001\u5C01\u88C5\u3001Datasheet \u94FE\u63A5\u7B49\uFF09\u4E0E\u6BCF\u4E2A\u5F15\u811A\u6240\u8FDE\u7684\u7F51\u7EDC\u3002\n\n\u6309\u4F4D\u53F7\u67E5\u8BE2\u3002\u8981\u770B\u591A\u4E2A\u5668\u4EF6\u5148\u7528 eda_schematic_components \u5217\u6E05\u5355\u3002",
    inputSchema: {
      type: "object",
      properties: { designator: { type: "string", description: "\u5668\u4EF6\u4F4D\u53F7\uFF0C\u5982 U1 / R12" } },
      required: ["designator"]
    },
    handler: async (args, ctx2) => {
      const want = requireString(args, "designator").toUpperCase();
      const comps = await fetchComponents(ctx2);
      const hit = comps.find((c) => designatorOf(c).toUpperCase() === want);
      if (!hit) {
        const near = comps.map(designatorOf).filter((d) => d.toUpperCase().startsWith(want.replace(/\d+$/, ""))).slice(0, 15);
        return { error: `\u627E\u4E0D\u5230\u4F4D\u53F7 ${want}`, similar: near };
      }
      return detailComponent(hit);
    }
  },
  {
    name: "eda_schematic_drc",
    description: "\u5BF9\u5F53\u524D\u539F\u7406\u56FE\u8DD1 DRC\uFF08\u8BBE\u8BA1\u89C4\u5219\u68C0\u67E5\uFF09\uFF0C\u8FD4\u56DE\u5404\u7C7B\u95EE\u9898\u7684\u6570\u91CF\u6C47\u603B\u3002\n\n**\u6CE8\u610F API \u7684\u9650\u5236**\uFF1A\u7ACB\u521B\u53EA\u8FD4\u56DE\u5206\u7C7B\u8BA1\u6570\uFF08\u5982 error 2 \u6761\u3001warn 1 \u6761\uFF09\uFF0C\u4E0D\u8FD4\u56DE\u6BCF\u6761\u95EE\u9898\u7684\u63CF\u8FF0\u548C\u4F4D\u7F6E \u2014\u2014 \u8FD9\u662F\u5B98\u65B9\u63A5\u53E3\u672C\u8EAB\u7684\u9650\u5236\uFF08\u8BE5\u63A5\u53E3\u6807\u8BB0\u4E3A @beta\uFF09\uFF0C\u4E0D\u662F\u672C\u5DE5\u5177\u6CA1\u53D6\u5230\u3002\u8981\u770B\u5177\u4F53\u662F\u54EA\u4E9B\u95EE\u9898\uFF0C\u7528 show_ui=true \u5728 EDA \u5E95\u90E8\u547C\u51FA DRC \u9762\u677F\uFF0C\u8BA9\u7528\u6237\u81EA\u5DF1\u770B\uFF1B\u6216\u8BA9\u7528\u6237\u628A\u9762\u677F\u5185\u5BB9\u8D34\u8FC7\u6765\u3002\n\n\u5178\u578B\u7528\u6CD5\uFF1A\u6539\u5B8C\u539F\u7406\u56FE\u8DD1\u4E00\u6B21\uFF0C\u786E\u8BA4\u6CA1\u6709\u65B0\u589E error\uFF1B\u6709 error \u65F6\u63D0\u793A\u7528\u6237\u6253\u5F00\u9762\u677F\u6838\u5BF9\u3002",
    inputSchema: {
      type: "object",
      properties: {
        show_ui: { type: "boolean", description: "\u662F\u5426\u5728 EDA \u91CC\u547C\u51FA\u5E95\u90E8 DRC \u9762\u677F\u4F9B\u7528\u6237\u67E5\u770B\u660E\u7EC6\uFF0C\u9ED8\u8BA4 false" },
        strict: { type: "boolean", description: "\u4E25\u683C\u6A21\u5F0F\uFF0C\u9ED8\u8BA4 true\uFF08\u5B98\u65B9\u8BF4\u660E\uFF1A\u539F\u7406\u56FE\u5F53\u524D\u7EDF\u4E00\u6309\u4E25\u683C\u6A21\u5F0F\u68C0\u67E5\uFF09" }
      }
    },
    handler: async (args, ctx2) => {
      const showUi = optionalBool(args, "show_ui");
      const strict = args.strict === void 0 ? true : optionalBool(args, "strict", true);
      const raw = await ctx2.exec(
        `return await eda.sch_Drc.check(${strict}, ${showUi}, true);`,
        NETLIST_TIMEOUT_MS
      );
      const issues = (raw ?? []).map((i) => ({ type: i.type ?? "unknown", count: i.count ?? 0 }));
      const errors = issues.filter((i) => i.type === "error").reduce((s, i) => s + i.count, 0);
      const warnings = issues.filter((i) => i.type === "warn").reduce((s, i) => s + i.count, 0);
      return {
        passed: errors === 0,
        errors,
        warnings,
        issues,
        ui_opened: showUi,
        note: "\u7ACB\u521B\u7684 DRC \u63A5\u53E3\u53EA\u8FD4\u56DE\u5206\u7C7B\u8BA1\u6570\uFF0C\u4E0D\u542B\u6BCF\u6761\u95EE\u9898\u7684\u63CF\u8FF0\u4E0E\u4F4D\u7F6E\u3002" + (showUi ? "\u5DF2\u5728 EDA \u5E95\u90E8\u6253\u5F00 DRC \u9762\u677F\uFF0C\u8BF7\u8BA9\u7528\u6237\u67E5\u770B\u660E\u7EC6\u3002" : "\u9700\u8981\u660E\u7EC6\u65F6\u7528 show_ui=true \u6253\u5F00\u9762\u677F\u3002")
      };
    }
  },
  {
    name: "eda_schematic_nets",
    description: "\u5F53\u524D\u539F\u7406\u56FE\u7684\u7F51\u7EDC\uFF08\u8FDE\u63A5\u5173\u7CFB\uFF09\uFF1A\u6BCF\u4E2A\u7F51\u7EDC\u540D\u4E0B\u6302\u7740\u54EA\u4E9B\u5668\u4EF6\u7684\u54EA\u4E9B\u5F15\u811A\u3002\n\n\u4E0D\u5E26\u53C2\u6570\u65F6\u8FD4\u56DE\u7F51\u7EDC\u6982\u89C8\uFF08\u6309\u8FDE\u63A5\u6570\u6392\u5E8F\uFF0C\u7535\u6E90/\u5730\u5728\u524D\uFF09\uFF1B\u7ED9 net_name \u65F6\u8FD4\u56DE\u8BE5\u7F51\u7EDC\u7684\u5B8C\u6574\u8282\u70B9\u5217\u8868\u3002\n\n\u5F62\u5982 $1N9877 \u7684\u662F EDA \u81EA\u52A8\u547D\u540D\u7684\u533F\u540D\u7F51\u7EDC\uFF08\u591A\u4E3A\u4E24\u70B9\u95F4\u7684\u666E\u901A\u8FDE\u7EBF\uFF09\uFF0C\u9ED8\u8BA4\u6298\u53E0\u4E0D\u5C55\u5F00\uFF0C\u9700\u8981\u65F6\u7528 include_auto_named=true\u3002",
    inputSchema: {
      type: "object",
      properties: {
        net_name: { type: "string", description: "\u6307\u5B9A\u7F51\u7EDC\u540D\uFF0C\u5982 GND / VCC_3V3\uFF1B\u7ED9\u51FA\u65F6\u8FD4\u56DE\u8BE5\u7F51\u7EDC\u7684\u5168\u90E8\u8282\u70B9" },
        include_auto_named: { type: "boolean", description: "\u662F\u5426\u5305\u542B $1N\u2026 \u5F62\u5F0F\u7684\u81EA\u52A8\u547D\u540D\u7F51\u7EDC\uFF0C\u9ED8\u8BA4 false" },
        limit: { type: "integer", description: "\u6982\u89C8\u6A21\u5F0F\u4E0B\u6700\u591A\u8FD4\u56DE\u591A\u5C11\u4E2A\u7F51\u7EDC\uFF0C\u9ED8\u8BA4 100" }
      }
    },
    handler: async (args, ctx2) => {
      const comps = await fetchComponents(ctx2);
      const nets = buildNets(comps);
      const target = optionalString(args, "net_name");
      if (target) {
        const hit = nets.find((n) => n.name.toLowerCase() === target.toLowerCase());
        if (!hit) {
          return {
            error: `\u627E\u4E0D\u5230\u7F51\u7EDC ${target}`,
            available: nets.filter((n) => !isAutoNetName(n.name)).map((n) => n.name).slice(0, 40)
          };
        }
        return { net: hit.name, pin_count: hit.nodes.length, nodes: hit.nodes };
      }
      const includeAuto = optionalBool(args, "include_auto_named");
      const limit = typeof args.limit === "number" && args.limit > 0 ? args.limit : 100;
      const named = nets.filter((n) => includeAuto || !isAutoNetName(n.name));
      const autoCount = nets.length - nets.filter((n) => !isAutoNetName(n.name)).length;
      return {
        total_nets: nets.length,
        auto_named_nets: autoCount,
        returned: Math.min(named.length, limit),
        nets: named.slice(0, limit).map((n) => ({ name: n.name, pin_count: n.nodes.length })),
        hint: includeAuto ? void 0 : `\u53E6\u6709 ${autoCount} \u4E2A\u81EA\u52A8\u547D\u540D\u7F51\u7EDC\u672A\u5217\u51FA\uFF0C\u9700\u8981\u65F6\u8BBE include_auto_named=true`
      };
    }
  }
];

// src/tools/index.ts
var allTools = [
  ...connectionTools,
  ...verifyTools,
  ...projectTools,
  ...schematicTools,
  ...schematicEditTools,
  ...netcheckTools,
  ...layoutTools,
  ...mapTools,
  ...mapApplyTools,
  ...libraryTools,
  ...datasheetTools,
  ...createTools,
  ...pcbTools
];
var dupes = allTools.map((t) => t.name).filter((n, i, a) => a.indexOf(n) !== i);
if (dupes.length) {
  throw new Error(`\u5DE5\u5177\u540D\u91CD\u590D\uFF1A${[...new Set(dupes)].join("\u3001")} \u2014\u2014 \u540C\u540D\u5DE5\u5177\u4F1A\u88AB\u9759\u9ED8\u8986\u76D6\uFF0C\u5FC5\u987B\u6539\u540D\u6216\u5408\u5E76\u5B9E\u73B0`);
}
var toolMap = new Map(allTools.map((t) => [t.name, t]));

// src/index.ts
var VERSION2 = "0.1.71";
var bridge = new Bridge();
var server = new Server({ name: "eda-mcp", version: VERSION2 }, { capabilities: { tools: {} } });
var currentToolIsMutating = false;
var ctx = {
  bridge,
  exec: async (code, timeoutMs) => await bridge.execute(code, timeoutMs, currentToolIsMutating)
};
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema }))
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = toolMap.get(name);
  if (!tool) throw new McpError(ErrorCode.MethodNotFound, `\u672A\u77E5\u5DE5\u5177: ${name}`);
  try {
    currentToolIsMutating = tool.mutating === true;
    const result = await tool.handler(args ?? {}, ctx);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    if (err instanceof Error && err.message === "NO_CLIENT") {
      return { content: [{ type: "text", text: await notConnectedHint(bridge.listeningPort) }], isError: true };
    }
    logError(`\u5DE5\u5177 ${name} \u6267\u884C\u5931\u8D25`, err);
    const msg = err instanceof Error ? err.message : String(err);
    return { content: [{ type: "text", text: `\u9519\u8BEF: ${msg}` }], isError: true };
  }
});
async function shutdown(reason) {
  log(`\u9000\u51FA\uFF08${reason}\uFF09`);
  await bridge.stop().catch(() => {
  });
  process.exit(0);
}
async function main() {
  const paired = await loadPairing() !== null;
  await bridge.start();
  const transport = new StdioServerTransport();
  transport.onclose = () => void shutdown("stdio \u5DF2\u5173\u95ED");
  process.stdin.on("end", () => void shutdown("stdin \u7ED3\u675F"));
  await server.connect(transport);
  log(`EDA MCP v${VERSION2} \u5DF2\u542F\u52A8\uFF08stdio\uFF09\uFF0C${allTools.length} \u4E2A\u5DE5\u5177\uFF0C\u914D\u5BF9\u72B6\u6001\uFF1A${paired ? "\u5DF2\u914D\u5BF9" : "\u672A\u914D\u5BF9"}`);
}
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
main().catch((err) => {
  logError("\u542F\u52A8\u5931\u8D25", err);
  process.exit(1);
});
