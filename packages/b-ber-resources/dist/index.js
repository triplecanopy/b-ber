//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let fs_extra = require("fs-extra");
fs_extra = __toESM(fs_extra);
let path = require("path");
path = __toESM(path);
//#region src/index.ts
const packageRoot = path.default.resolve(__dirname, "..");
var src_default = () => fs_extra.default.readdir(packageRoot).then((data) => {
	const assets = {};
	data.filter((a) => /png|jpe?g/.test(path.default.extname(a))).map((a) => assets[path.default.basename(a, path.default.extname(a))] = path.default.join(packageRoot, a));
	return assets;
});
//#endregion
module.exports = src_default;
