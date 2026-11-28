Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
// src/sequences/index.ts
const build = [
	"clean",
	"container",
	"cover",
	"sass",
	"copy",
	"scripts",
	"render",
	"loi",
	"footnotes",
	"inject",
	"opf"
];
const sequences = {
	epub: [...build, "epub"],
	mobi: [
		...build,
		"mobiCSS",
		"mobi"
	],
	pdf: [...build, "pdf"],
	web: [...build, "web"],
	sample: [...build, "sample"],
	reader: [...build, "reader"],
	xml: [...build, "xml"]
};
// src/create-build-sequence.ts
function createBuildSequence(desiredSequences) {
	const builds = Object.keys(sequences);
	const chosen = desiredSequences.filter((a) => sequences[a]);
	return chosen.length < 1 ? builds : chosen;
}
exports.createBuildSequence = createBuildSequence;
exports.sequences = sequences;
