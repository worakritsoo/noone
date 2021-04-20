import { ssr } from '@sveltejs/kit/ssr';
import root from './generated/root.svelte';
import { set_paths } from './runtime/paths.js';
import { set_prerendering } from './runtime/env.js';
import * as user_hooks from "./hooks.js";

const template = ({ head, body }) => "<!DOCTYPE html>\n<html lang=\"en\">\n\t<head>\n\t\t<meta charset=\"utf-8\" />\n\t\t<link rel=\"icon\" href=\"/favicon.ico\" />\n\t\t<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n\t\t\n\t<script type=\"module\" src=\"https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js\"></script>\n\t<script nomodule src=\"https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.js\"></script>\n\t<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css\"/>\n\t\t" + head + "\n\t</head>\n\t<body>\n\t\t<div id=\"svelte\">" + body + "</div>\n\t</body>\n</html>\n";

let options = null;

// allow paths to be overridden in svelte-kit start
// and in prerendering
export function init(settings) {
	set_paths(settings.paths);
	set_prerendering(settings.prerendering || false);

	options = {
		amp: false,
		dev: false,
		entry: {
			file: "/./_app/start-073b141d.js",
			css: ["/./_app/assets/start-a8cd1609.css"],
			js: ["/./_app/start-073b141d.js","/./_app/chunks/vendor-e25105b5.js"]
		},
		fetched: undefined,
		get_component_path: id => "/./_app/" + entry_lookup[id],
		get_stack: error => String(error), // for security
		handle_error: error => {
			console.error(error.stack);
			error.stack = options.get_stack(error);
		},
		hooks: get_hooks(user_hooks),
		hydrate: true,
		initiator: undefined,
		load_component,
		manifest,
		paths: settings.paths,
		read: settings.read,
		root,
		router: true,
		ssr: true,
		target: "#svelte",
		template
	};
}

const d = decodeURIComponent;
const empty = () => ({});

const manifest = {
	assets: [],
	layout: "src/routes/$layout.svelte",
	error: "src/routes/$error.svelte",
	routes: [
		{
						type: 'page',
						pattern: /^\/$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/index.svelte"],
						b: ["src/routes/$error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/settings\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/settings/$layout.svelte", "src/routes/settings/index.svelte"],
						b: ["src/routes/$error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/settings\/notifications\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/settings/$layout.svelte", "src/routes/settings/notifications/index.svelte"],
						b: ["src/routes/$error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/settings\/profile\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/settings/$layout.svelte", "src/routes/settings/profile/index.svelte"],
						b: ["src/routes/$error.svelte"]
					},
		{
						type: 'endpoint',
						pattern: /^\/graphql\/?$/,
						params: empty,
						load: () => import("..\\..\\src\\routes\\graphql.ts")
					},
		{
						type: 'page',
						pattern: /^\/search\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/search/index.svelte"],
						b: ["src/routes/$error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/about\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/about.svelte"],
						b: ["src/routes/$error.svelte"]
					},
		{
						type: 'page',
						pattern: /^\/links\/?$/,
						params: empty,
						a: ["src/routes/$layout.svelte", "src/routes/links/index.svelte"],
						b: ["src/routes/$error.svelte"]
					}
	]
};

// this looks redundant, but the indirection allows us to access
// named imports without triggering Rollup's missing import detection
const get_hooks = hooks => ({
	getContext: hooks.getContext || (() => ({})),
	getSession: hooks.getSession || (() => ({})),
	handle: hooks.handle || (({ request, render }) => render(request))
});

const module_lookup = {
	"src/routes/$layout.svelte": () => import("..\\..\\src\\routes\\$layout.svelte"),"src/routes/$error.svelte": () => import("..\\..\\src\\routes\\$error.svelte"),"src/routes/index.svelte": () => import("..\\..\\src\\routes\\index.svelte"),"src/routes/settings/$layout.svelte": () => import("..\\..\\src\\routes\\settings\\$layout.svelte"),"src/routes/settings/index.svelte": () => import("..\\..\\src\\routes\\settings\\index.svelte"),"src/routes/settings/notifications/index.svelte": () => import("..\\..\\src\\routes\\settings\\notifications\\index.svelte"),"src/routes/settings/profile/index.svelte": () => import("..\\..\\src\\routes\\settings\\profile\\index.svelte"),"src/routes/search/index.svelte": () => import("..\\..\\src\\routes\\search\\index.svelte"),"src/routes/about.svelte": () => import("..\\..\\src\\routes\\about.svelte"),"src/routes/links/index.svelte": () => import("..\\..\\src\\routes\\links\\index.svelte")
};

const metadata_lookup = {"src/routes/$layout.svelte":{"entry":"/./_app/pages/$layout.svelte-23c10756.js","css":["/./_app/assets/pages/$layout.svelte-eae091cc.css"],"js":["/./_app/pages/$layout.svelte-23c10756.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null},"src/routes/$error.svelte":{"entry":"/./_app/pages/$error.svelte-55dabfa8.js","css":[],"js":["/./_app/pages/$error.svelte-55dabfa8.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null},"src/routes/index.svelte":{"entry":"/./_app/pages/index.svelte-5bd4abec.js","css":[],"js":["/./_app/pages/index.svelte-5bd4abec.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null},"src/routes/settings/$layout.svelte":{"entry":"/./_app/pages/settings/$layout.svelte-0f7cdc0c.js","css":[],"js":["/./_app/pages/settings/$layout.svelte-0f7cdc0c.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null},"src/routes/settings/index.svelte":{"entry":"/./_app/pages/settings/index.svelte-6aed79a7.js","css":[],"js":["/./_app/pages/settings/index.svelte-6aed79a7.js","/./_app/chunks/vendor-e25105b5.js","/./_app/chunks/Title-9b063d7f.js"],"styles":null},"src/routes/settings/notifications/index.svelte":{"entry":"/./_app/pages/settings/notifications/index.svelte-acfae39c.js","css":[],"js":["/./_app/pages/settings/notifications/index.svelte-acfae39c.js","/./_app/chunks/vendor-e25105b5.js","/./_app/chunks/Title-9b063d7f.js"],"styles":null},"src/routes/settings/profile/index.svelte":{"entry":"/./_app/pages/settings/profile/index.svelte-6329fdf5.js","css":[],"js":["/./_app/pages/settings/profile/index.svelte-6329fdf5.js","/./_app/chunks/vendor-e25105b5.js","/./_app/chunks/Title-9b063d7f.js"],"styles":null},"src/routes/search/index.svelte":{"entry":"/./_app/pages/search/index.svelte-03a23b95.js","css":["/./_app/assets/pages/search/index.svelte-f9fa0e0b.css"],"js":["/./_app/pages/search/index.svelte-03a23b95.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null},"src/routes/about.svelte":{"entry":"/./_app/pages/about.svelte-b81f9138.js","css":[],"js":["/./_app/pages/about.svelte-b81f9138.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null},"src/routes/links/index.svelte":{"entry":"/./_app/pages/links/index.svelte-3f55465f.js","css":[],"js":["/./_app/pages/links/index.svelte-3f55465f.js","/./_app/chunks/vendor-e25105b5.js"],"styles":null}};

async function load_component(file) {
	return {
		module: await module_lookup[file](),
		...metadata_lookup[file]
	};
}

init({ paths: {"base":"","assets":"/."} });

export function render(request, {
	prerender
} = {}) {
	const host = request.headers["host"];
	return ssr({ ...request, host }, options, { prerender });
}